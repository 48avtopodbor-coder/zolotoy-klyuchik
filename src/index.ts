import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { makeSession, passwordOk, sessionOk, SESSION_MAX_AGE } from './auth';
import { adminListPage, homePage, loginPage, productFormPage, type Product } from './views';

type Env = { Bindings: { DB: D1Database; ADMIN_PASSWORD: string; TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string } };

const app = new Hono<Env>();
const COOKIE = 'sid';
const MAX_IMAGE = 1024 * 1024; // фото хранятся в D1 (лимит строки 2 МБ, base64 даёт +33%)
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
  const cache = caches.default;
  const hit = await cache.match(c.req.url);
  if (hit) return hit;
  const row = await c.env.DB.prepare('SELECT content_type, data FROM images WHERE key=?').bind(key).first<{ content_type: string; data: string }>();
  if (!row) return c.notFound();
  const bin = atob(row.data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const res = new Response(bytes, {
    headers: { 'content-type': row.content_type, 'cache-control': 'public, max-age=31536000, immutable' },
  });
  c.executionCtx.waitUntil(cache.put(c.req.url, res.clone()));
  return res;
});

app.get('/robots.txt', (c) => c.text('User-agent: *\nDisallow: /admin\n'));


/* ---------- заявки с сайта ---------- */

const escHtml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function hashIp(ip: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`lead:${ip}`));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

app.post('/api/lead', async (c) => {
  const origin = c.req.header('origin');
  if (origin && new URL(origin).host !== new URL(c.req.url).host) return c.json({ error: 'forbidden' }, 403);

  let body: Record<string, unknown>;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Некорректный запрос' }, 400); }

  if (String(body.website ?? '') !== '') return c.json({ ok: true }); // ловушка для ботов

  const name = String(body.name ?? '').trim().slice(0, 80);
  const phone = String(body.phone ?? '').trim().slice(0, 30);
  const message = String(body.message ?? '').trim().slice(0, 500);
  const digits = phone.replace(/\D/g, '');
  if (!name) return c.json({ error: 'Укажите имя' }, 400);
  if (digits.length < 10 || digits.length > 15) return c.json({ error: 'Проверьте номер телефона' }, 400);

  const ipHash = await hashIp(c.req.header('cf-connecting-ip') ?? 'unknown');
  const recent = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM leads WHERE ip_hash=? AND created_at > unixepoch() - 3600')
    .bind(ipHash).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 5) return c.json({ error: 'Слишком много заявок. Позвоните нам: 8 900 596-45-77' }, 429);

  const ins = await c.env.DB.prepare('INSERT INTO leads (name, phone, message, ip_hash) VALUES (?,?,?,?)')
    .bind(name, phone, message, ipHash).run();
  const id = ins.meta.last_row_id;

  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = c.env;
  let sent = false;
  if (token && chat) {
    const when = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
    const text = `<b>Новая заявка с сайта</b>\nИмя: ${escHtml(name)}\nТелефон: ${escHtml(phone)}${message ? `\nСообщение: ${escHtml(message)}` : ''}\n<i>${when} (МСК)</i>`;
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      sent = r.ok;
    } catch { /* заявка уже сохранена */ }
  }
  if (sent) await c.env.DB.prepare('UPDATE leads SET sent=1 WHERE id=?').bind(id).run();
  return sent ? c.json({ ok: true }) : c.json({ error: 'Не удалось отправить заявку. Позвоните нам: 8 900 596-45-77' }, 502);
});

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

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(out);
}

async function saveImage(env: Env['Bindings'], file: unknown): Promise<string | null | 'bad'> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = IMAGE_TYPES[file.type];
  if (!ext || file.size > MAX_IMAGE) return 'bad';
  const key = `${crypto.randomUUID()}.${ext}`;
  await env.DB.prepare('INSERT INTO images (key, content_type, data) VALUES (?,?,?)')
    .bind(key, file.type, toBase64(await file.arrayBuffer())).run();
  return key;
}

async function deleteImage(c: { env: Env['Bindings']; req: { url: string } }, key: string) {
  await c.env.DB.prepare('DELETE FROM images WHERE key=?').bind(key).run();
  await caches.default.delete(new URL(`/img/${key}`, c.req.url).toString());
}

app.post('/admin/products', async (c) => {
  const form = await c.req.formData();
  const f = parseFields(form);
  if (!f.title) return c.text('Укажите название', 400);
  const img = await saveImage(c.env, form.get('image'));
  if (img === 'bad') return c.text('Фото должно быть JPG, PNG или WebP до 1 МБ', 400);
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
  if (img === 'bad') return c.text('Фото должно быть JPG, PNG или WebP до 1 МБ', 400);
  await c.env.DB.prepare('UPDATE products SET title=?,description=?,price=?,show_price=?,image_key=? WHERE id=?')
    .bind(f.title, f.description, f.price, f.show_price, img ?? old.image_key, id).run();
  if (img && old.image_key) await deleteImage(c, old.image_key);
  return c.redirect('/admin?saved=1');
});

app.post('/admin/products/:id/delete', async (c) => {
  const id = Number(c.req.param('id'));
  const old = await getProduct(c, id);
  if (old) {
    await c.env.DB.prepare('DELETE FROM products WHERE id=?').bind(id).run();
    if (old.image_key) await deleteImage(c, old.image_key);
  }
  return c.redirect('/admin?deleted=1');
});

export default app;
