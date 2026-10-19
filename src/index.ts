import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { makeSession, passwordOk, sessionOk, SESSION_MAX_AGE } from './auth';
import { adminListPage, homePage, loginPage, productFormPage, type Product } from './views';

type Env = { Bindings: { DB: D1Database; IMAGES: R2Bucket; ADMIN_PASSWORD: string } };

const app = new Hono<Env>();
const COOKIE = 'sid';
const MAX_IMAGE = 3 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

const html = (body: string, status: 200 | 401 = 200, cache = 'no-store') =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache } });

/* ---------- публичная часть ---------- */

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id,title,description,price,show_price,image_key FROM products ORDER BY created_at DESC, id DESC',
  ).all<Product>();
  return html(homePage(results), 200, 'public, max-age=30');
});

app.get('/img/:key', async (c) => {
  const key = c.req.param('key');
  if (!/^[\w-]+\.(webp|jpg|png)$/.test(key)) return c.notFound();
  const obj = await c.env.IMAGES.get(key);
  if (!obj) return c.notFound();
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType ?? 'image/webp',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
});

app.get('/robots.txt', (c) => c.text('User-agent: *\nDisallow: /admin\n'));

/* ---------- админка ---------- */

app.get('/admin/login', (c) => html(loginPage()));

app.post('/admin/login', async (c) => {
  const form = await c.req.formData();
  const pw = String(form.get('password') ?? '');
  if (!(await passwordOk(pw, c.env.ADMIN_PASSWORD))) {
    await new Promise((r) => setTimeout(r, 800)); // замедляем подбор пароля
    return html(loginPage('Неверный пароль'), 401);
  }
  setCookie(c, COOKIE, await makeSession(c.env.ADMIN_PASSWORD), {
    httpOnly: true, secure: new URL(c.req.url).protocol === 'https:', sameSite: 'Strict', path: '/', maxAge: SESSION_MAX_AGE,
  });
  return c.redirect('/admin');
});

app.post('/admin/logout', (c) => {
  deleteCookie(c, COOKIE, { path: '/' });
  return c.redirect('/admin/login');
});

// всё остальное под /admin требует входа
app.use('/admin/*', async (c, next) => {
  if (!(await sessionOk(getCookie(c, COOKIE), c.env.ADMIN_PASSWORD))) return c.redirect('/admin/login');
  await next();
});
app.use('/admin', async (c, next) => {
  if (!(await sessionOk(getCookie(c, COOKIE), c.env.ADMIN_PASSWORD))) return c.redirect('/admin/login');
  await next();
});

app.get('/admin', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id,title,description,price,show_price,image_key FROM products ORDER BY created_at DESC, id DESC',
  ).all<Product>();
  return html(adminListPage(results, c.req.query('saved') ? 'Сохранено' : c.req.query('deleted') ? 'Товар удалён' : undefined));
});

app.get('/admin/products/new', () => html(productFormPage()));

async function getProduct(c: { env: Env['Bindings'] }, id: number) {
  return c.env.DB.prepare('SELECT id,title,description,price,show_price,image_key FROM products WHERE id=?').bind(id).first<Product>();
}

app.get('/admin/products/:id/edit', async (c) => {
  const p = await getProduct(c, Number(c.req.param('id')));
  return p ? html(productFormPage(p)) : c.notFound();
});

function parseFields(form: FormData) {
  const title = String(form.get('title') ?? '').trim().slice(0, 120);
  const description = String(form.get('description') ?? '').trim().slice(0, 600);
  const priceRaw = String(form.get('price') ?? '').trim();
  const price = priceRaw === '' ? null : Math.max(0, Math.min(10_000_000, Math.floor(Number(priceRaw))));
  return { title, description, price: Number.isFinite(price as number) ? price : null, show_price: form.get('show_price') ? 1 : 0 };
}

async function saveImage(env: Env['Bindings'], file: unknown): Promise<string | null | 'bad'> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = IMAGE_TYPES[file.type];
  if (!ext || file.size > MAX_IMAGE) return 'bad';
  const key = `${crypto.randomUUID()}.${ext}`;
  await env.IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return key;
}

app.post('/admin/products', async (c) => {
  const form = await c.req.formData();
  const f = parseFields(form);
  if (!f.title) return c.text('Укажите название', 400);
  const img = await saveImage(c.env, form.get('image'));
  if (img === 'bad') return c.text('Фото должно быть JPG, PNG или WebP до 3 МБ', 400);
  await c.env.DB.prepare('INSERT INTO products (title,description,price,show_price,image_key) VALUES (?,?,?,?,?)')
    .bind(f.title, f.description, f.price, f.show_price, img).run();
  return c.redirect('/admin?saved=1');
});

app.post('/admin/products/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const old = await getProduct(c, id);
  if (!old) return c.notFound();
  const form = await c.req.formData();
  const f = parseFields(form);
  if (!f.title) return c.text('Укажите название', 400);
  const img = await saveImage(c.env, form.get('image'));
  if (img === 'bad') return c.text('Фото должно быть JPG, PNG или WebP до 3 МБ', 400);
  await c.env.DB.prepare('UPDATE products SET title=?,description=?,price=?,show_price=?,image_key=? WHERE id=?')
    .bind(f.title, f.description, f.price, f.show_price, img ?? old.image_key, id).run();
  if (img && old.image_key) await c.env.IMAGES.delete(old.image_key);
  return c.redirect('/admin?saved=1');
});

app.post('/admin/products/:id/delete', async (c) => {
  const id = Number(c.req.param('id'));
  const old = await getProduct(c, id);
  if (old) {
    await c.env.DB.prepare('DELETE FROM products WHERE id=?').bind(id).run();
    if (old.image_key) await c.env.IMAGES.delete(old.image_key);
  }
  return c.redirect('/admin?deleted=1');
});

export default app;
