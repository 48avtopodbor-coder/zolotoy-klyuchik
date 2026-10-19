import { Hono, type Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { hashPassword, makeSession, passwordOk, sessionOk, verifyPassword, SESSION_MAX_AGE } from './auth';
import { DEFAULT_CONTACTS, TIME_RE, loadSettings, saveSetting, type Contacts, type Hours, type Settings } from './settings';
import { homePage, type Product, type Video } from './views';
import * as A from './admin';

type Env = {
  Bindings: { DB: D1Database; ADMIN_PASSWORD: string; TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string };
  Variables: { st: Settings };
};
type C = Context<Env>;

const app = new Hono<Env>();
const COOKIE = 'sid';
const MAX_IMAGE = 1024 * 1024; // фото хранятся в D1 (лимит строки 2 МБ, base64 даёт +33%)
const MAX_PHOTOS = 6;
const IMAGE_TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

const html = (body: string, status: 200 | 401 = 200, cache = 'no-store') =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache } });

const sessionSecret = (env: Env['Bindings'], st: Settings) => `${env.ADMIN_PASSWORD}:${st.ver}`;

/* ---------- работа с данными ---------- */

async function loadProducts(db: D1Database): Promise<Product[]> {
  const [p, im] = await db.batch([
    db.prepare('SELECT id,title,description,price,old_price,show_price,is_sale,in_stock FROM products ORDER BY is_sale DESC, created_at DESC, id DESC'),
    db.prepare('SELECT product_id, image_key FROM product_images ORDER BY product_id, position, id'),
  ]);
  const imgs = new Map<number, string[]>();
  for (const r of im.results as { product_id: number; image_key: string }[]) {
    (imgs.get(r.product_id) ?? imgs.set(r.product_id, []).get(r.product_id)!).push(r.image_key);
  }
  return (p.results as Omit<Product, 'images'>[]).map((x) => ({ ...x, images: imgs.get(x.id) ?? [] }));
}

const loadVideos = async (db: D1Database) =>
  (await db.prepare('SELECT id,url,oid,vid,cover_key FROM videos ORDER BY position, id').all<Video>()).results;

function toInt(v: string | File | null, max: number): number | null {
  const t = String(v ?? '').trim();
  if (t === '') return null;
  const n = Math.floor(Number(t));
  return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : null;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(out);
}

async function storeImage(db: D1Database, file: File): Promise<string | 'bad'> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext || file.size === 0 || file.size > MAX_IMAGE) return 'bad';
  const key = `${crypto.randomUUID()}.${ext}`;
  await db.prepare('INSERT INTO images (key, content_type, data) VALUES (?,?,?)').bind(key, file.type, toBase64(await file.arrayBuffer())).run();
  return key;
}

async function dropImages(c: C, keys: string[]) {
  for (const key of keys) {
    await c.env.DB.prepare('DELETE FROM images WHERE key=?').bind(key).run();
    await caches.default.delete(new URL(`/img/${key}`, c.req.url).toString());
  }
}

const files = (form: FormData, name: string): File[] =>
  form.getAll(name).filter((f): f is File => typeof f !== 'string' && f.size > 0);

/* ---------- публичная часть ---------- */

app.get('/', async (c) => {
  const [products, videos, st] = await Promise.all([loadProducts(c.env.DB), loadVideos(c.env.DB), loadSettings(c.env.DB)]);
  return html(homePage({ products, videos, hours: st.hours, contacts: st.contacts }), 200, 'public, max-age=30');
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

/* ---------- вход в админку ---------- */

app.get('/admin/login', () => html(A.loginPage()));

app.post('/admin/login', async (c) => {
  const pw = String((await c.req.formData()).get('password') ?? '');
  const st = await loadSettings(c.env.DB);
  const ok = st.pw ? await verifyPassword(pw, st.pw) : await passwordOk(pw, c.env.ADMIN_PASSWORD);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800)); // замедляем подбор пароля
    return html(A.loginPage('Неверный пароль'), 401);
  }
  await setSession(c, st);
  return c.redirect('/admin/products');
});

async function setSession(c: C, st: Settings) {
  setCookie(c, COOKIE, await makeSession(sessionSecret(c.env, st)), {
    httpOnly: true, secure: new URL(c.req.url).protocol === 'https:', sameSite: 'Strict', path: '/', maxAge: SESSION_MAX_AGE,
  });
}

app.post('/admin/logout', (c) => {
  deleteCookie(c, COOKIE, { path: '/' });
  return c.redirect('/admin/login');
});

// всё остальное под /admin требует входа
const guard = async (c: C, next: () => Promise<void>) => {
  const st = await loadSettings(c.env.DB);
  if (!(await sessionOk(getCookie(c, COOKIE), sessionSecret(c.env, st)))) return c.redirect('/admin/login');
  c.set('st', st);
  await next();
};
app.use('/admin', guard);
app.use('/admin/*', guard);

app.get('/admin', (c) => c.redirect('/admin/products'));

const q = (c: C) => c.req.query() as Record<string, string | undefined>;

/* ---------- товары ---------- */

app.get('/admin/products', async (c) => c.html(A.productsPage(await loadProducts(c.env.DB), A.flashText(q(c)))));
app.get('/admin/products/new', (c) => c.html(A.productFormPage()));
app.get('/admin/products/:id/edit', async (c) => {
  const id = Number(c.req.param('id'));
  const p = (await loadProducts(c.env.DB)).find((x) => x.id === id);
  return p ? c.html(A.productFormPage(p)) : c.notFound();
});

async function saveProduct(c: C, id: number | null) {
  const form = await c.req.formData();
  const title = String(form.get('title') ?? '').trim().slice(0, 120);
  if (!title) return c.text('Укажите название', 400);
  const description = String(form.get('description') ?? '').trim().slice(0, 600);
  const price = toInt(form.get('price'), 10_000_000);
  const oldPrice = toInt(form.get('old_price'), 10_000_000);
  const flags = [form.get('show_price') ? 1 : 0, form.get('is_sale') ? 1 : 0, form.get('in_stock') ? 1 : 0];

  const db = c.env.DB;
  const existing = id ? ((await loadProducts(db)).find((x) => x.id === id)?.images ?? []) : [];
  if (id && !(await db.prepare('SELECT 1 FROM products WHERE id=?').bind(id).first())) return c.notFound();

  const keep = [...new Set(form.getAll('keep').map(String))].filter((k) => existing.includes(k));
  const uploads = files(form, 'images');
  if (keep.length + uploads.length > MAX_PHOTOS) return c.text(`Не больше ${MAX_PHOTOS} фото на товар`, 400);

  const added: string[] = [];
  for (const f of uploads) {
    const key = await storeImage(db, f);
    if (key === 'bad') { await dropImages(c, added); return c.text('Фото должны быть JPG, PNG или WebP до 1 МБ', 400); }
    added.push(key);
  }
  const main = String(form.get('main') ?? '');
  const ordered = [...(keep.includes(main) ? [main] : []), ...keep.filter((k) => k !== main), ...added];

  if (id) {
    await db.prepare('UPDATE products SET title=?,description=?,price=?,old_price=?,show_price=?,is_sale=?,in_stock=? WHERE id=?')
      .bind(title, description, price, oldPrice, ...flags, id).run();
    await db.prepare('DELETE FROM product_images WHERE product_id=?').bind(id).run();
    await dropImages(c, existing.filter((k) => !keep.includes(k)));
  } else {
    const r = await db.prepare('INSERT INTO products (title,description,price,old_price,show_price,is_sale,in_stock) VALUES (?,?,?,?,?,?,?)')
      .bind(title, description, price, oldPrice, ...flags).run();
    id = r.meta.last_row_id as number;
  }
  if (ordered.length) {
    await db.batch(ordered.map((k, i) => db.prepare('INSERT INTO product_images (product_id,image_key,position) VALUES (?,?,?)').bind(id, k, i)));
  }
  return c.redirect('/admin/products?saved=1');
}

app.post('/admin/products', (c) => saveProduct(c, null));
app.post('/admin/products/:id', (c) => saveProduct(c, Number(c.req.param('id'))));

app.post('/admin/products/:id/delete', async (c) => {
  const id = Number(c.req.param('id'));
  const { results } = await c.env.DB.prepare('SELECT image_key FROM product_images WHERE product_id=?').bind(id).all<{ image_key: string }>();
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM product_images WHERE product_id=?').bind(id),
    c.env.DB.prepare('DELETE FROM products WHERE id=?').bind(id),
  ]);
  await dropImages(c, results.map((r) => r.image_key));
  return c.redirect('/admin/products?deleted=1');
});

/* ---------- видео ---------- */

app.get('/admin/videos', async (c) => c.html(A.videosPage(await loadVideos(c.env.DB), A.flashText(q(c)))));

app.post('/admin/videos', async (c) => {
  const form = await c.req.formData();
  const url = String(form.get('url') ?? '').trim().slice(0, 300);
  const m = url.match(/(?:clip|video)(-?\d+)_(\d+)/);
  if (!m || !/^https:\/\/(vk\.(com|ru)|vkvideo\.ru)\//.test(url)) return c.text('Нужна ссылка на видео ВКонтакте, например https://vk.ru/clip-236241268_456239028', 400);
  let cover: string | null = null;
  const cf = files(form, 'cover')[0];
  if (cf) { const k = await storeImage(c.env.DB, cf); if (k === 'bad') return c.text('Обложка должна быть JPG, PNG или WebP до 1 МБ', 400); cover = k; }
  const pos = await c.env.DB.prepare('SELECT COALESCE(MAX(position),0)+1 AS p FROM videos').first<{ p: number }>();
  await c.env.DB.prepare('INSERT INTO videos (url,oid,vid,cover_key,position) VALUES (?,?,?,?,?)').bind(url, m[1], m[2], cover, pos?.p ?? 1).run();
  return c.redirect('/admin/videos?added=1');
});

app.post('/admin/videos/:id/move', async (c) => {
  const id = Number(c.req.param('id'));
  const dir = String((await c.req.formData()).get('dir'));
  const list = await loadVideos(c.env.DB);
  const i = list.findIndex((v) => v.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < list.length) {
    [list[i], list[j]] = [list[j], list[i]];
    await c.env.DB.batch(list.map((v, n) => c.env.DB.prepare('UPDATE videos SET position=? WHERE id=?').bind(n + 1, v.id)));
  }
  return c.redirect('/admin/videos?saved=1');
});

app.post('/admin/videos/:id/delete', async (c) => {
  const id = Number(c.req.param('id'));
  const v = await c.env.DB.prepare('SELECT cover_key FROM videos WHERE id=?').bind(id).first<{ cover_key: string | null }>();
  await c.env.DB.prepare('DELETE FROM videos WHERE id=?').bind(id).run();
  if (v?.cover_key) await dropImages(c, [v.cover_key]);
  return c.redirect('/admin/videos?deleted=1');
});

/* ---------- часы работы ---------- */

app.get('/admin/hours', (c) => c.html(A.hoursPage(c.get('st').hours, A.flashText(q(c)))));

app.post('/admin/hours', async (c) => {
  const f = await c.req.formData();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const open = String(f.get(`open${i}`) ?? ''), close = String(f.get(`close${i}`) ?? ''), off = !!f.get(`off${i}`);
    if (!off && (!TIME_RE.test(open) || !TIME_RE.test(close) || open >= close))
      return c.html(A.hoursPage(c.get('st').hours, undefined, `Проверьте время в строке «${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]}»: открытие должно быть раньше закрытия`));
    days.push({ off, open: TIME_RE.test(open) ? open : '09:00', close: TIME_RE.test(close) ? close : '17:00' });
  }
  const lunch = { on: !!f.get('lunch_on'), from: String(f.get('lunch_from') ?? ''), to: String(f.get('lunch_to') ?? '') };
  if (lunch.on && (!TIME_RE.test(lunch.from) || !TIME_RE.test(lunch.to) || lunch.from >= lunch.to))
    return c.html(A.hoursPage(c.get('st').hours, undefined, 'Проверьте обеденный перерыв: начало должно быть раньше конца'));
  if (!TIME_RE.test(lunch.from)) lunch.from = '13:00';
  if (!TIME_RE.test(lunch.to)) lunch.to = '14:00';
  const hours: Hours = { days, lunch };
  await saveSetting(c.env.DB, 'hours', hours);
  return c.redirect('/admin/hours?saved=1');
});

/* ---------- контакты ---------- */

app.get('/admin/contacts', (c) => c.html(A.contactsPage(c.get('st').contacts, A.flashText(q(c)))));

app.post('/admin/contacts', async (c) => {
  const f = await c.req.formData();
  const phones = String(f.get('phones') ?? '').split('\n').map((s) => s.trim().slice(0, 30)).filter(Boolean).slice(0, 4);
  const whatsapp = String(f.get('whatsapp') ?? '').trim().slice(0, 30);
  const telegram = String(f.get('telegram') ?? '').trim().replace(/^@/, '').slice(0, 64);
  const address = String(f.get('address') ?? '').trim().slice(0, 200);
  const bad = (m: string) => c.html(A.contactsPage({ phones, whatsapp, telegram, address }, undefined, m));
  if (!phones.length || phones.some((p) => p.replace(/\D/g, '').length < 10)) return bad('Проверьте телефоны: нужен хотя бы один номер, не меньше 10 цифр в каждом');
  if (whatsapp && whatsapp.replace(/\D/g, '').length < 10) return bad('Проверьте номер WhatsApp');
  if (telegram && !/^[A-Za-z0-9_]{3,64}$/.test(telegram)) return bad('Telegram: только латинские буквы, цифры и подчёркивание');
  if (!address) return bad('Укажите адрес');
  const contacts: Contacts = { ...DEFAULT_CONTACTS, phones, whatsapp, telegram, address };
  await saveSetting(c.env.DB, 'contacts', contacts);
  return c.redirect('/admin/contacts?saved=1');
});

/* ---------- пароль ---------- */

app.get('/admin/password', (c) => c.html(A.passwordPage(A.flashText(q(c)))));

app.post('/admin/password', async (c) => {
  const st = c.get('st');
  const f = await c.req.formData();
  const cur = String(f.get('current') ?? ''), next = String(f.get('next') ?? ''), rep = String(f.get('repeat') ?? '');
  const ok = st.pw ? await verifyPassword(cur, st.pw) : await passwordOk(cur, c.env.ADMIN_PASSWORD);
  if (!ok) { await new Promise((r) => setTimeout(r, 800)); return c.html(A.passwordPage(undefined, 'Текущий пароль указан неверно')); }
  if (next.length < 10) return c.html(A.passwordPage(undefined, 'Новый пароль слишком короткий: нужно минимум 10 символов'));
  if (next.length > 200) return c.html(A.passwordPage(undefined, 'Новый пароль слишком длинный'));
  if (next !== rep) return c.html(A.passwordPage(undefined, 'Новый пароль и повтор не совпадают'));
  const ver = st.ver + 1;
  await saveSetting(c.env.DB, 'admin_pw', await hashPassword(next));
  await saveSetting(c.env.DB, 'session_ver', String(ver));
  await setSession(c, { ...st, ver }); // все остальные входы закрываются, текущий остаётся
  return c.redirect('/admin/password?saved=1');
});

/* ---------- заявки ---------- */

app.get('/admin/leads', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id,name,phone,message,sent,created_at FROM leads ORDER BY id DESC LIMIT 100').all<A.Lead>();
  return c.html(A.leadsPage(results, A.flashText(q(c))));
});
app.post('/admin/leads/:id/delete', async (c) => {
  await c.env.DB.prepare('DELETE FROM leads WHERE id=?').bind(Number(c.req.param('id'))).run();
  return c.redirect('/admin/leads?deleted=1');
});

export default app;
