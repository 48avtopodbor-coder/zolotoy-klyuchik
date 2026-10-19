import { Hono, type Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { hashPassword, makeSession, passwordOk, sessionOk, verifyPassword, SESSION_MAX_AGE } from './auth';
import { DEFAULT_CONTACTS, DEFAULT_SITE, TIME_RE, loadSettings, loadSpecial, saveSetting, type Contacts, type Hours, type Settings, type Site } from './settings';
import { HOLIDAYS_RF } from './holidays';
import { homePage, SERVICE_ICONS, type Product, type Service, type Video } from './views';
import * as A from './admin';

type Env = {
  Bindings: { DB: D1Database; ADMIN_PASSWORD: string; TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string; TELEGRAM_WEBHOOK_SECRET?: string; TELEGRAM_API?: string };
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

const loadServices = async (db: D1Database) =>
  (await db.prepare('SELECT id,label,title,short,price,mode,old_price,details,note,show_note,icon FROM services ORDER BY position, id').all<Service>()).results;

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


/** Берёт кадр-обложку со страницы ролика ВКонтакте. Возвращает ключ сохранённой картинки или null. */
async function fetchVkCover(db: D1Database, oid: string, vid: string): Promise<string | null> {
  try {
    const page = await fetch(`https://vk.com/video_ext.php?oid=${oid}&id=${vid}&hd=2`, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!page.ok) return null;
    const text = new TextDecoder('windows-1251').decode(await page.arrayBuffer());
    const urls = [...text.matchAll(/"(https:[^"]*?size=(\d+)x(\d+)[^"]*?type=video_thumb[^"]*?)"/g)]
      .map((m) => ({ url: m[1].replace(/\\\//g, '/').replace(/\\u0026/g, '&').replace(/&amp;/g, '&'), w: +m[2], h: +m[3] }))
      .filter((u) => u.h > u.w)
      .sort((a, b) => Math.abs(a.h - 640) - Math.abs(b.h - 640)); // нам подходит вертикальный кадр около 360x640
    for (const u of urls) {
      const img = await fetch(u.url, { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://vk.com/' } });
      const type = img.headers.get('content-type') ?? '';
      if (!img.ok || !IMAGE_TYPES[type]) continue;
      const buf = await img.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE) continue;
      const key = `${crypto.randomUUID()}.${IMAGE_TYPES[type]}`;
      await db.prepare('INSERT INTO images (key, content_type, data) VALUES (?,?,?)').bind(key, type, toBase64(buf)).run();
      return key;
    }
  } catch { /* обложку можно загрузить вручную */ }
  return null;
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
  const [products, videos, st, services, special] = await Promise.all([loadProducts(c.env.DB), loadVideos(c.env.DB), loadSettings(c.env.DB), loadServices(c.env.DB), loadSpecial(c.env.DB)]);
  return html(homePage({ products, videos, hours: st.hours, contacts: st.contacts, site: st.site, chat: st.chat, services, special, origin: new URL(c.req.url).origin }), 200, 'public, max-age=30');
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

app.get('/robots.txt', (c) => c.text(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${new URL(c.req.url).origin}/sitemap.xml\n`));
// значок сайта: золотой ключ на тёмной плитке (один и тот же файл для /favicon.svg и /favicon.ico)
const FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0f2233"/><rect x="2" y="2" width="60" height="60" rx="10" fill="none" stroke="#2b5276" stroke-width="2"/><g transform="rotate(-45 32 32)" fill="none" stroke="#e2b44f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="32" r="9.5"/><circle cx="14" cy="32" r="2.4" fill="#e2b44f" stroke="none"/><path d="M23.5 32H56M46 32v9.5M54 32v6.5"/></g></svg>';
const favicon = () => new Response(FAVICON, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' } });
app.get('/favicon.svg', favicon);
app.get('/favicon.ico', favicon);
app.get('/sitemap.xml', (c) => {
  const today = new Date().toISOString().slice(0, 10);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${new URL(c.req.url).origin}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
});

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
  if ((recent?.n ?? 0) >= 5) return c.json({ error: 'Слишком много заявок за час. Позвоните нам, пожалуйста.' }, 429);

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
  return sent ? c.json({ ok: true }) : c.json({ error: 'Попробуйте ещё раз или позвоните нам.' }, 502);
});


/* ---------- чат на сайте <-> Telegram ---------- */

type Bind = Env['Bindings'];
const tgApi = (env: Bind) => env.TELEGRAM_API ?? 'https://api.telegram.org';
/** TELEGRAM_CHAT_ID может содержать несколько id через запятую: все получают сообщения и могут отвечать. */
const tgRecipients = (env: Bind): number[] =>
  (env.TELEGRAM_CHAT_ID ?? '').split(',').map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n !== 0);

async function tgCall<T = unknown>(env: Bind, method: string, body: unknown): Promise<T | null> {
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const r = await fetch(`${tgApi(env)}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    const j = (await r.json()) as { ok: boolean; result: T };
    return j.ok ? j.result : null;
  } catch { return null; }
}

/** Фото в чате: настоящий формат определяем по первым байтам, а не по тому, что заявил браузер. */
function sniffChatImage(b: Uint8Array): 'image/jpeg' | 'image/png' | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  return null;
}
/** Какие автоответы посетитель уже получил на странице (страница присылает идентификаторы, мастер видит пометку в Telegram). */
const AUTO_LABELS: Record<string, string> = {
  hours: 'график работы', price: 'цены', way: 'адрес и как добраться', contacts: 'телефон и мессенджеры', away: 'время открытия (сейчас закрыто)',
};
const MAX_CHAT_PHOTO = 900 * 1000; // страница сама сжимает фото до 200–400 КБ, больше не принимаем

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Отдаёт фото из чата. Кэш только личный: фото видят автор переписки и сотрудники. */
const chatPhotoResponse = (b64: string) => {
  const bytes = fromBase64(b64);
  return new Response(bytes, {
    headers: {
      'content-type': sniffChatImage(bytes) ?? 'application/octet-stream', 'cache-control': 'private, max-age=86400',
      'x-content-type-options': 'nosniff', 'content-disposition': 'inline', 'referrer-policy': 'no-referrer',
    },
  });
};

async function tgSendPhoto(env: Bind, to: number, buf: ArrayBuffer, mime: string, caption: string): Promise<{ message_id: number } | null> {
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const fd = new FormData();
    fd.append('chat_id', String(to));
    fd.append('caption', caption);
    fd.append('parse_mode', 'HTML');
    fd.append('photo', new Blob([buf], { type: mime }), mime === 'image/png' ? 'photo.png' : 'photo.jpg');
    const r = await fetch(`${tgApi(env)}/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
    const j = (await r.json()) as { ok: boolean; result: { message_id: number } };
    return j.ok ? j.result : null;
  } catch { return null; }
}

const sameOrigin = (c: C) => {
  const o = c.req.header('origin');
  return !o || new URL(o).host === new URL(c.req.url).host;
};

app.post('/api/chat/send', async (c) => {
  if (!sameOrigin(c)) return c.json({ error: 'forbidden' }, 403);
  let b: Record<string, unknown> = {};
  let photo: File | null = null;
  try {
    if ((c.req.header('content-type') ?? '').startsWith('multipart/form-data')) {
      const f = await c.req.formData();
      for (const k of ['cid', 'text', 'name', 'phone', 'auto']) b[k] = f.get(k) ?? '';
      const p = f.get('photo');
      if (p && typeof p !== 'string' && p.size > 0) photo = p;
    } else b = await c.req.json();
  } catch { return c.json({ error: 'Некорректный запрос' }, 400); }
  const text = String(b.text ?? '').trim().slice(0, 1000);
  if (!text && !photo) return c.json({ error: 'Напишите сообщение или приложите фото' }, 400);
  const name = String(b.name ?? '').trim().slice(0, 80);
  const phone = String(b.phone ?? '').trim().slice(0, 30);
  const db = c.env.DB;

  let pic: { buf: ArrayBuffer; mime: 'image/jpeg' | 'image/png' } | null = null;
  if (photo) {
    if (photo.size > MAX_CHAT_PHOTO) return c.json({ error: 'Фото слишком большое. Попробуйте другое или позвоните нам.' }, 413);
    const buf = await photo.arrayBuffer();
    const mime = sniffChatImage(new Uint8Array(buf));
    if (!mime) return c.json({ error: 'Фото должно быть в формате JPG или PNG' }, 400);
    pic = { buf, mime };
  }
  const ipHash = await hashIp(c.req.header('cf-connecting-ip') ?? 'unknown');

  const perIp = await db.prepare(
    'SELECT COUNT(*) AS n FROM chat_messages m JOIN chats ch ON ch.id = m.chat_id WHERE ch.ip_hash=? AND m.from_visitor=1 AND m.created_at > unixepoch() - 3600',
  ).bind(ipHash).first<{ n: number }>();
  if ((perIp?.n ?? 0) >= 30) return c.json({ error: 'Слишком много сообщений. Позвоните нам, пожалуйста.' }, 429);
  if (pic) {
    const perIpPhotos = await db.prepare(
      'SELECT COUNT(*) AS n FROM chat_messages m JOIN chats ch ON ch.id = m.chat_id WHERE ch.ip_hash=? AND m.photo IS NOT NULL AND m.created_at > unixepoch() - 3600',
    ).bind(ipHash).first<{ n: number }>();
    if ((perIpPhotos?.n ?? 0) >= 8) return c.json({ error: 'Слишком много фото за час. Позвоните нам, пожалуйста.' }, 429);
  }

  const banned = await db.prepare('SELECT 1 FROM chats WHERE blocked=1 AND ip_hash=? AND created_at > unixepoch() - 604800').bind(ipHash).first();
  if (banned) return c.json({ error: 'Чат сейчас недоступен. Позвоните нам, пожалуйста.' }, 403);

  let cid = String(b.cid ?? '');
  let chat = /^[0-9a-f]{32}$/.test(cid) ? await db.prepare('SELECT id, name, phone FROM chats WHERE id=?').bind(cid).first<{ id: string; name: string; phone: string }>() : null;
  const first = !chat;
  if (!chat) {
    cid = [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, '0')).join('');
    await db.prepare('INSERT INTO chats (id, name, phone, ip_hash) VALUES (?,?,?,?)').bind(cid, name, phone, ipHash).run();
    chat = { id: cid, name, phone };
    if (Math.random() < 0.05) await db.prepare('DELETE FROM chat_messages WHERE created_at < unixepoch() - 2592000').run(); // чистим переписку старше 30 дней
  } else if ((name && name !== chat.name) || (phone && phone !== chat.phone)) {
    chat = { id: cid, name: name || chat.name, phone: phone || chat.phone };
    await db.prepare('UPDATE chats SET name=?, phone=? WHERE id=?').bind(chat.name, chat.phone, cid).run();
  }

  let photoKey: string | null = null;
  if (pic) {
    photoKey = crypto.randomUUID();
    await db.batch([
      db.prepare('INSERT INTO chat_photos (key, chat_id, data) VALUES (?,?,?)').bind(photoKey, cid, toBase64(pic.buf)),
      db.prepare('DELETE FROM chat_photos WHERE created_at < unixepoch() - 2592000'), // фото старше 30 дней не храним
      db.prepare('DELETE FROM chat_photos WHERE key IN (SELECT key FROM chat_photos ORDER BY created_at DESC, rowid DESC LIMIT -1 OFFSET 300)'), // и не больше 300 штук
    ]);
  }
  const ins = await db.prepare('INSERT INTO chat_messages (chat_id, from_visitor, text, photo) VALUES (?,1,?,?)').bind(cid, text, photoKey).run();
  const id = ins.meta.last_row_id as number;

  const who = [chat.name, chat.phone].filter(Boolean).map(escHtml).join(' · ');
  const icon = pic ? '📷' : '💬';
  const head = first || who ? `${icon} <b>Чат с сайта</b> #${cid.slice(0, 4)}${who ? `\n${who}` : ''}\n\n` : `${icon} #${cid.slice(0, 4)}\n`;
  const tail = first ? '\n\n<i>Чтобы ответить, нажмите «Ответить» на это сообщение.</i>' : '';
  const autos = [...new Set(String(b.auto ?? '').split(',').map((x) => x.trim()).filter((x) => x in AUTO_LABELS))].slice(0, 4);
  const autoLine = autos.length ? `\n\n<i>🤖 Посетитель уже получил автоответ: ${autos.map((x) => AUTO_LABELS[x]).join(', ')}.</i>` : '';
  const msg = `${head}${escHtml(text)}${autoLine}${tail}`;
  let delivered = false;
  const remember = (to: number, mid: number) => db.prepare('INSERT OR REPLACE INTO tg_map (tg_chat, tg_message, chat_id) VALUES (?,?,?)').bind(to, mid, cid).run();
  for (const to of tgRecipients(c.env)) {
    let r: { message_id: number } | null = null;
    if (pic) {
      // подпись к фото у Telegram ограничена 1024 символами: длинный текст уходит вторым сообщением
      const long = msg.length > 1000;
      r = await tgSendPhoto(c.env, to, pic.buf, pic.mime, long ? `${head}<i>Текст сообщения ниже.</i>${tail}` : msg);
      if (r && long) {
        const t2 = await tgCall<{ message_id: number }>(c.env, 'sendMessage', { chat_id: to, text: escHtml(text), parse_mode: 'HTML', reply_to_message_id: r.message_id });
        if (t2) await remember(to, t2.message_id);
      }
      if (!r) r = await tgCall<{ message_id: number }>(c.env, 'sendMessage', { chat_id: to, text: `${msg}\n\n<i>📷 Фото не удалось передать в Telegram. Оно сохранено на сайте: админка, вкладка «Чаты».</i>`, parse_mode: 'HTML', disable_web_page_preview: true });
    } else {
      r = await tgCall<{ message_id: number }>(c.env, 'sendMessage', { chat_id: to, text: msg, parse_mode: 'HTML', disable_web_page_preview: true });
    }
    if (r) {
      delivered = true;
      await remember(to, r.message_id);
    }
  }
  return c.json({ ok: true, cid, id, delivered });
});

/** «Мастер на связи»: кто-то из сотрудников отвечал в чате за последние 10 минут. */
async function staffRecent(db: D1Database): Promise<boolean> {
  const r = await db.prepare('SELECT MAX(created_at) AS m FROM chat_messages WHERE from_visitor=0').first<{ m: number | null }>();
  return !!r?.m && r.m > Date.now() / 1000 - 600;
}
const json = (o: unknown) => new Response(JSON.stringify(o), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

app.get('/api/chat/status', async (c) => (sameOrigin(c) ? json({ recent: await staffRecent(c.env.DB) }) : c.json({ error: 'forbidden' }, 403)));

app.get('/api/chat/poll', async (c) => {
  if (!sameOrigin(c)) return c.json({ error: 'forbidden' }, 403);
  const cid = c.req.query('cid') ?? '';
  const recent = await staffRecent(c.env.DB);
  if (!/^[0-9a-f]{32}$/.test(cid)) return json({ messages: [], recent });
  const after = Math.max(0, Number(c.req.query('after') ?? 0) || 0);
  const { results } = await c.env.DB.prepare(
    'SELECT id, from_visitor AS v, text, created_at AS t, photo AS p FROM chat_messages WHERE chat_id=? AND id>? ORDER BY id LIMIT 50',
  ).bind(cid, after).all();
  return json({ messages: results, recent });
});

/** Фото из переписки видит только её автор: ссылка работает вместе с секретным номером переписки. */
app.get('/api/chat/photo/:key', async (c) => {
  const key = c.req.param('key'), cid = c.req.query('cid') ?? '';
  if (!/^[0-9a-f-]{36}$/.test(key) || !/^[0-9a-f]{32}$/.test(cid)) return c.notFound();
  const row = await c.env.DB.prepare('SELECT data FROM chat_photos WHERE key=? AND chat_id=?').bind(key, cid).first<{ data: string }>();
  return row ? chatPhotoResponse(row.data) : c.notFound();
});

/** Сюда Telegram присылает ответы сотрудника. */
app.post('/api/telegram/webhook', async (c) => {
  const secret = c.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || c.req.header('x-telegram-bot-api-secret-token') !== secret) return c.text('forbidden', 403);
  const upd = (await c.req.json().catch(() => null)) as {
    message?: { message_id: number; text?: string; caption?: string; photo?: unknown[]; chat: { id: number }; reply_to_message?: { message_id: number } };
  } | null;
  const m0 = upd?.message;
  if (!m0) return c.text('ok');
  if (!tgRecipients(c.env).includes(m0.chat.id)) return c.text('ok'); // чужим не отвечаем
  const body = m0.text ?? m0.caption;
  if (!body) {
    // фото и файлы без подписи на сайт не передаются: подсказываем, чтобы ответ не потерялся молча
    if (m0.photo) await tgCall(c.env, 'sendMessage', { chat_id: m0.chat.id, reply_to_message_id: m0.message_id, text: 'Фото на сайт пока не передаётся. Напишите ответ текстом.' });
    return c.text('ok');
  }
  const m = { ...m0, text: body };
  if (m.text.startsWith('/start')) {
    await tgCall(c.env, 'sendMessage', { chat_id: m.chat.id, text: 'Здесь будут сообщения из чата на сайте. Чтобы ответить посетителю, нажмите «Ответить» на его сообщение. Команды в ответе на сообщение: /close завершить диалог, /block заблокировать спамера.' });
    return c.text('ok');
  }
  const cmd = m.text.trim().split(/\s+/)[0].toLowerCase().replace(/@\w+$/, '');
  if (cmd === '/close' || cmd === '/block') {
    const lk = m.reply_to_message
      ? await c.env.DB.prepare('SELECT chat_id FROM tg_map WHERE tg_chat=? AND tg_message=?').bind(m.chat.id, m.reply_to_message.message_id).first<{ chat_id: string }>()
      : null;
    if (!lk) {
      await tgCall(c.env, 'sendMessage', { chat_id: m.chat.id, reply_to_message_id: m.message_id, text: 'Нажмите «Ответить» на сообщение посетителя и напишите команду.' });
      return c.text('ok');
    }
    if (cmd === '/close') {
      await c.env.DB.prepare('INSERT INTO chat_messages (chat_id, from_visitor, text) VALUES (?,0,?)').bind(lk.chat_id, 'Диалог завершён. Если появятся вопросы, напишите нам снова.').run();
    } else {
      await c.env.DB.prepare('UPDATE chats SET blocked=1 WHERE id=?').bind(lk.chat_id).run();
    }
    await tgCall(c.env, 'sendMessage', { chat_id: m.chat.id, reply_to_message_id: m.message_id, text: cmd === '/close' ? 'Диалог закрыт, посетитель увидел сообщение.' : 'Посетитель заблокирован на 7 дней.' });
    return c.text('ok');
  }
  const link = m.reply_to_message
    ? await c.env.DB.prepare('SELECT chat_id FROM tg_map WHERE tg_chat=? AND tg_message=?').bind(m.chat.id, m.reply_to_message.message_id).first<{ chat_id: string }>()
    : null;
  if (!link) {
    await tgCall(c.env, 'sendMessage', { chat_id: m.chat.id, reply_to_message_id: m.message_id, text: 'Не понял, кому отправить. Нажмите «Ответить» на сообщение посетителя.' });
    return c.text('ok');
  }
  await c.env.DB.prepare('INSERT INTO chat_messages (chat_id, from_visitor, text) VALUES (?,0,?)').bind(link.chat_id, m.text.slice(0, 2000)).run();
  if (m0.photo) await tgCall(c.env, 'sendMessage', { chat_id: m.chat.id, reply_to_message_id: m.message_id, text: 'Посетитель увидел только подпись: фото на сайт пока не передаётся.' });
  else await tgCall(c.env, 'setMessageReaction', { chat_id: m.chat.id, message_id: m.message_id, reaction: [{ type: 'emoji', emoji: '👍' }] });
  return c.text('ok');
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

/* ---------- услуги и цены ---------- */

app.get('/admin/services', async (c) => c.html(A.servicesPage(await loadServices(c.env.DB), A.flashText(q(c)))));

function serviceFields(f: FormData) {
  const mode = String(f.get('mode') ?? 'from');
  return {
    label: String(f.get('label') ?? '').trim().slice(0, 24),
    title: String(f.get('title') ?? '').trim().slice(0, 120),
    short: String(f.get('short') ?? '').trim().slice(0, 300),
    price: toInt(f.get('price'), 10_000_000),
    mode: ['from', 'fixed', 'sale', 'none'].includes(mode) ? mode : 'from',
    old_price: toInt(f.get('old_price'), 10_000_000),
    details: String(f.get('details') ?? '').trim().slice(0, 6000),
    note: String(f.get('note') ?? '').trim().slice(0, 60),
    show_note: f.get('show_note') ? 1 : 0,
    icon: String(f.get('icon') ?? '') in SERVICE_ICONS ? String(f.get('icon')) : 'key',
  };
}

app.post('/admin/services', async (c) => {
  const v = serviceFields(await c.req.formData());
  if (!v.title) return c.redirect('/admin/services');
  const pos = await c.env.DB.prepare('SELECT COALESCE(MAX(position),0)+1 AS p FROM services').first<{ p: number }>();
  await c.env.DB.prepare('INSERT INTO services (label,title,short,price,mode,old_price,details,note,show_note,icon,position) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .bind(v.label, v.title, v.short, v.price, v.mode, v.old_price, v.details, v.note, v.show_note, v.icon, pos?.p ?? 1).run();
  return c.redirect('/admin/services?added=1');
});

app.post('/admin/services/:id', async (c) => {
  const v = serviceFields(await c.req.formData());
  if (!v.title) return c.redirect('/admin/services');
  await c.env.DB.prepare('UPDATE services SET label=?,title=?,short=?,price=?,mode=?,old_price=?,details=?,note=?,show_note=?,icon=? WHERE id=?')
    .bind(v.label, v.title, v.short, v.price, v.mode, v.old_price, v.details, v.note, v.show_note, v.icon, Number(c.req.param('id'))).run();
  return c.redirect('/admin/services?saved=1');
});

app.post('/admin/services/:id/move', async (c) => {
  const id = Number(c.req.param('id'));
  const dir = String((await c.req.formData()).get('dir'));
  const list = await loadServices(c.env.DB);
  const i = list.findIndex((x) => x.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < list.length) {
    [list[i], list[j]] = [list[j], list[i]];
    await c.env.DB.batch(list.map((x, n) => c.env.DB.prepare('UPDATE services SET position=? WHERE id=?').bind(n + 1, x.id)));
  }
  return c.redirect('/admin/services?saved=1');
});

app.post('/admin/services/:id/delete', async (c) => {
  await c.env.DB.prepare('DELETE FROM services WHERE id=?').bind(Number(c.req.param('id'))).run();
  return c.redirect('/admin/services?deleted=1');
});

/* ---------- главная страница: фото, шаги, до и после ---------- */

app.get('/admin/site', (c) => c.html(A.sitePage(c.get('st').site, A.flashText(q(c)))));

app.post('/admin/site', async (c) => {
  const f = await c.req.formData();
  const cur = c.get('st').site;
  const next: Site = JSON.parse(JSON.stringify(cur));
  const db = c.env.DB;

  const put = async (name: string): Promise<string | null | 'bad'> => {
    const file = files(f, name)[0];
    if (!file) return null;
    return storeImage(db, file);
  };

  const hero = await put('hero_photo');
  if (hero === 'bad') return c.text('Фото должно быть JPG, PNG или WebP до 1 МБ', 400);
  if (hero || f.get('hero_remove')) { if (cur.hero.key) await dropImages(c, [cur.hero.key]); next.hero.key = hero; }
  next.hero.caption = String(f.get('hero_caption') ?? '').trim().slice(0, 100);

  next.steps = DEFAULT_SITE.steps.map((d, i) => ({
    t: String(f.get(`step${i}_t`) ?? '').trim().slice(0, 80) || d.t,
    d: String(f.get(`step${i}_d`) ?? '').trim().slice(0, 220) || d.d,
  }));

  const before = await put('ba_before'), after = await put('ba_after');
  if (before === 'bad' || after === 'bad') return c.text('Фото должны быть JPG, PNG или WebP до 1 МБ', 400);
  // пропорции кадра берём из размеров снимка, которые админка присылает вместе с файлом
  const aspect = (name: string): number | undefined => {
    const m = /^(\d{2,5})x(\d{2,5})$/.exec(String(f.get(name) ?? ''));
    return m ? Math.min(2.5, Math.max(0.4, Math.round((+m[1] / +m[2]) * 1000) / 1000)) : undefined;
  };
  if (f.get('ba_remove')) {
    await dropImages(c, [cur.ba.before, cur.ba.after].filter((k): k is string => !!k));
    next.ba.before = null; next.ba.after = null; delete next.ba.ar;
  } else {
    if (before) { if (cur.ba.before) await dropImages(c, [cur.ba.before]); next.ba.before = before; }
    if (after) { if (cur.ba.after) await dropImages(c, [cur.ba.after]); next.ba.after = after; }
    const ar = aspect(after ? 'ba_after_wh' : 'ba_before_wh');
    if ((after || before) && ar) next.ba.ar = ar;
  }
  next.ba.caption = String(f.get('ba_caption') ?? '').trim().slice(0, 100);

  await saveSetting(db, 'site', next);
  return c.redirect('/admin/site?saved=1');
});

/* ---------- выбор темы: авто, тёмная или светлая ---------- */

app.get('/admin/theme', (c) => c.html(A.themePage(c.get('st').site.theme, A.flashText(q(c)))));

app.post('/admin/theme', async (c) => {
  const f = await c.req.formData();
  const cur = c.get('st').site;
  const top = String(f.get('theme_top') ?? 'auto'), how = String(f.get('theme_how') ?? 'sun');
  const from = String(f.get('theme_from') ?? ''), to = String(f.get('theme_to') ?? '');
  const theme = { ...cur.theme };
  const okTimes = TIME_RE.test(from) && TIME_RE.test(to) && from < to;
  if (okTimes) { theme.from = from; theme.to = to; }
  theme.mode = top === 'dark' ? 'dark' : top === 'light' ? 'light' : how === 'hours' ? 'hours' : 'sun';
  if (theme.mode === 'hours' && !okTimes)
    return c.html(A.themePage({ ...theme, from: TIME_RE.test(from) ? from : theme.from, to: TIME_RE.test(to) ? to : theme.to }, undefined, 'Проверьте время: светлая тема должна начинаться раньше, чем заканчиваться'), 400);
  await saveSetting(c.env.DB, 'site', { ...cur, theme });
  return c.redirect('/admin/theme?saved=1');
});

/* ---------- видео ---------- */

app.get('/admin/videos', async (c) => c.html(A.videosPage(await loadVideos(c.env.DB), A.flashText(q(c)), q(c).err ? 'Не удалось взять обложку из ВК. Загрузите свою картинку.' : undefined)));

app.post('/admin/videos', async (c) => {
  const form = await c.req.formData();
  const url = String(form.get('url') ?? '').trim().slice(0, 300);
  const m = url.match(/(?:clip|video)(-?\d+)_(\d+)/);
  if (!m || !/^https:\/\/(vk\.(com|ru)|vkvideo\.ru)\//.test(url)) return c.text('Нужна ссылка на видео ВКонтакте, например https://vk.ru/clip-236241268_456239028', 400);
  let cover: string | null = null;
  const cf = files(form, 'cover')[0];
  if (cf) { const k = await storeImage(c.env.DB, cf); if (k === 'bad') return c.text('Обложка должна быть JPG, PNG или WebP до 1 МБ', 400); cover = k; }
  if (!cover) cover = await fetchVkCover(c.env.DB, m[1], m[2]);
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

async function setCover(c: C, id: number, newKey: string) {
  const v = await c.env.DB.prepare('SELECT cover_key FROM videos WHERE id=?').bind(id).first<{ cover_key: string | null }>();
  await c.env.DB.prepare('UPDATE videos SET cover_key=? WHERE id=?').bind(newKey, id).run();
  if (v?.cover_key) await dropImages(c, [v.cover_key]);
}

app.post('/admin/videos/:id/cover-auto', async (c) => {
  const id = Number(c.req.param('id'));
  const v = await c.env.DB.prepare('SELECT oid, vid FROM videos WHERE id=?').bind(id).first<{ oid: string; vid: string }>();
  if (!v) return c.notFound();
  const key = await fetchVkCover(c.env.DB, v.oid, v.vid);
  if (!key) return c.redirect('/admin/videos?err=cover');
  await setCover(c, id, key);
  return c.redirect('/admin/videos?saved=1');
});

app.post('/admin/videos/:id/cover', async (c) => {
  const id = Number(c.req.param('id'));
  const f = files(await c.req.formData(), 'cover')[0];
  if (!f) return c.text('Выберите картинку', 400);
  const key = await storeImage(c.env.DB, f);
  if (key === 'bad') return c.text('Обложка должна быть JPG, PNG или WebP до 1 МБ', 400);
  await setCover(c, id, key);
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

app.get('/admin/hours', async (c) => c.html(A.hoursPage(c.get('st').hours, await loadSpecial(c.env.DB), A.flashText(q(c)))));

app.post('/admin/hours', async (c) => {
  const f = await c.req.formData();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const open = String(f.get(`open${i}`) ?? ''), close = String(f.get(`close${i}`) ?? ''), off = !!f.get(`off${i}`);
    if (!off && (!TIME_RE.test(open) || !TIME_RE.test(close) || open >= close))
      return c.html(A.hoursPage(c.get('st').hours, await loadSpecial(c.env.DB), undefined, `Проверьте время в строке «${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]}»: открытие должно быть раньше закрытия`));
    days.push({ off, open: TIME_RE.test(open) ? open : '09:00', close: TIME_RE.test(close) ? close : '17:00' });
  }
  const lunch = { on: !!f.get('lunch_on'), from: String(f.get('lunch_from') ?? ''), to: String(f.get('lunch_to') ?? '') };
  if (lunch.on && (!TIME_RE.test(lunch.from) || !TIME_RE.test(lunch.to) || lunch.from >= lunch.to))
    return c.html(A.hoursPage(c.get('st').hours, await loadSpecial(c.env.DB), undefined, 'Проверьте обеденный перерыв: начало должно быть раньше конца'));
  if (!TIME_RE.test(lunch.from)) lunch.from = '13:00';
  if (!TIME_RE.test(lunch.to)) lunch.to = '14:00';
  const hours: Hours = { days, lunch };
  await saveSetting(c.env.DB, 'hours', hours);
  return c.redirect('/admin/hours?saved=1');
});

const validDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d + 'T00:00:00Z')) && new Date(d + 'T00:00:00Z').toISOString().slice(0, 10) === d;

app.post('/admin/special', async (c) => {
  const f = await c.req.formData();
  const date = String(f.get('date') ?? '');
  const kind = String(f.get('kind') ?? 'closed');
  const open = String(f.get('open') ?? ''), close = String(f.get('close') ?? '');
  const note = String(f.get('note') ?? '').trim().slice(0, 120);
  const fail = async (m: string) => c.html(A.hoursPage(c.get('st').hours, await loadSpecial(c.env.DB), undefined, m));
  if (!validDate(date)) return fail('Укажите дату особого дня');
  if (!['closed', 'short', 'custom'].includes(kind)) return fail('Выберите тип дня');
  if (kind !== 'closed' && (!TIME_RE.test(open) || !TIME_RE.test(close) || open >= close)) return fail('Проверьте время: открытие должно быть раньше закрытия');
  await c.env.DB.prepare('INSERT INTO special_days (date,kind,open,close,note) VALUES (?,?,?,?,?) ON CONFLICT(date) DO UPDATE SET kind=excluded.kind, open=excluded.open, close=excluded.close, note=excluded.note')
    .bind(date, kind, kind === 'closed' ? null : open, kind === 'closed' ? null : close, note).run();
  return c.redirect('/admin/hours?saved=1');
});

app.post('/admin/special/:date/delete', async (c) => {
  await c.env.DB.prepare('DELETE FROM special_days WHERE date=?').bind(c.req.param('date')).run();
  return c.redirect('/admin/hours?deleted=1');
});

/** Добавляет праздники РФ из производственного календаря. Уже существующие даты не трогает. */
app.post('/admin/hours/holidays', async (c) => {
  const days = c.get('st').hours.days;
  const stmts = HOLIDAYS_RF.map((h) => {
    let open: string | null = null, close: string | null = null;
    if (h.kind === 'short') {
      const d = days[(new Date(h.date + 'T00:00:00Z').getUTCDay() + 6) % 7];
      const [hh, mm] = d.close.split(':').map(Number);
      const t = Math.max(0, hh * 60 + mm - 60);
      open = d.open; close = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    }
    return c.env.DB.prepare('INSERT OR IGNORE INTO special_days (date,kind,open,close,note) VALUES (?,?,?,?,?)').bind(h.date, h.kind, open, close, h.note);
  });
  await c.env.DB.batch(stmts);
  return c.redirect('/admin/hours?added=1');
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

app.get('/admin/chats', async (c) => {
  const db = c.env.DB;
  const { results: list } = await db.prepare(
    'SELECT c.id, c.name, c.phone, c.blocked, (SELECT MAX(created_at) FROM chat_messages m WHERE m.chat_id=c.id) AS last FROM chats c ORDER BY last DESC LIMIT 40',
  ).all<A.ChatRow>();
  const ids = list.map((x) => x.id);
  const msgs = ids.length
    ? (await db.prepare(`SELECT chat_id, from_visitor AS v, text, created_at AS t, photo AS p FROM chat_messages WHERE chat_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`).bind(...ids).all<A.ChatMsg>()).results
    : [];
  return c.html(A.chatsPage(list, msgs, A.flashText(q(c)), c.get('st').chat));
});
app.post('/admin/chats/settings', async (c) => {
  const f = await c.req.formData();
  await saveSetting(c.env.DB, 'chat', { auto: !!f.get('auto') });
  return c.redirect('/admin/chats?saved=1');
});
app.get('/admin/chat-photo/:key', async (c) => {
  const key = c.req.param('key');
  if (!/^[0-9a-f-]{36}$/.test(key)) return c.notFound();
  const row = await c.env.DB.prepare('SELECT data FROM chat_photos WHERE key=?').bind(key).first<{ data: string }>();
  return row ? chatPhotoResponse(row.data) : c.notFound();
});
app.post('/admin/chats/:id/delete', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.batch([c.env.DB.prepare('DELETE FROM chat_messages WHERE chat_id=?').bind(id), c.env.DB.prepare('DELETE FROM chat_photos WHERE chat_id=?').bind(id), c.env.DB.prepare('DELETE FROM tg_map WHERE chat_id=?').bind(id), c.env.DB.prepare('DELETE FROM chats WHERE id=?').bind(id)]);
  return c.redirect('/admin/chats?deleted=1');
});

/* ---------- заявки ---------- */

app.post('/admin/telegram/setup', async (c) => {
  const secret = c.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !c.env.TELEGRAM_BOT_TOKEN) return c.redirect('/admin/leads?err=tg');
  const ok = await tgCall(c.env, 'setWebhook', {
    url: `${new URL(c.req.url).origin}/api/telegram/webhook`, secret_token: secret, allowed_updates: ['message'], drop_pending_updates: true,
  });
  return c.redirect(ok ? '/admin/leads?saved=1' : '/admin/leads?err=tg');
});

app.get('/admin/leads', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id,name,phone,message,sent,created_at FROM leads ORDER BY id DESC LIMIT 100').all<A.Lead>();
  return c.html(A.leadsPage(results, A.flashText(q(c)), q(c).err ? 'Не удалось подключить чат к Telegram. Проверьте токен бота и повторите.' : undefined));
});
app.post('/admin/leads/:id/delete', async (c) => {
  await c.env.DB.prepare('DELETE FROM leads WHERE id=?').bind(Number(c.req.param('id'))).run();
  return c.redirect('/admin/leads?deleted=1');
});

export default app;
