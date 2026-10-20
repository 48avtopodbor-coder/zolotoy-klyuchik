import { loadSettings, TIME_RE, type SmsCfg } from './settings';

/**
 * SMS мастеру на случай, когда Telegram не доходит (нет интернета). Работает по расписанию раз в минуту (cron в wrangler.toml):
 * пишет о новой заявке и о сообщении в чате, на которое за несколько минут никто не ответил.
 * Ключи лежат только в Cloudflare (секреты), в базе их нет.
 */
export interface SmsEnv {
  DB: D1Database;
  SMSRU_API_ID?: string;
  SMSRU_API?: string; // для проверки: адрес поддельного сервера вместо https://sms.ru
  SMSGATE_USER?: string;
  SMSGATE_PASSWORD?: string;
  SMSGATE_API?: string; // для проверки: адрес поддельного сервера вместо https://api.sms-gate.app
}
export interface SendResult { ok: boolean; info: string }
export interface SmsLogRow { created_at: number; kind: string; ok: number; info: string }

const STALE = 18 * 3600; // обращения старше 18 часов уже не важны, SMS по ним не пишем
const RETRY_AFTER = 300; // после неудачи пробуем снова не раньше чем через 5 минут
const MAX_TRIES = 3;
/** Вопросы, на которые чат сам ответил на странице: по ним SMS не нужно. */
const TOPICS = new Set(['hours', 'price', 'way', 'contacts']);

/** 8 900 596-45-77, +7 900 …, 900 … -> 79005964577 */
export function normPhone(s: string): string | null {
  let d = s.replace(/\D/g, '');
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
  if (d.length === 10) d = '7' + d;
  return /^7\d{10}$/.test(d) ? d : null;
}
export const fmtPhone = (d: string): string => (/^7\d{10}$/.test(d) ? `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}` : d);

export const smsKeysReady = (env: SmsEnv, cfg: SmsCfg): boolean =>
  cfg.provider === 'gate' ? !!(env.SMSGATE_USER && env.SMSGATE_PASSWORD) : !!env.SMSRU_API_ID;

/** Одно SMS кириллицей вмещает 70 знаков, поэтому тексты короткие. */
const clip = (s: string, n: number): string => {
  const a = Array.from(s.replace(/\s+/g, ' ').trim());
  return a.length > n ? a.slice(0, Math.max(0, n - 1)).join('').trimEnd() + '…' : a.join('');
};
const len = (s: string) => Array.from(s).length;

export function leadText(l: { name: string; phone: string; message: string }): string {
  const head = `Заявка: ${clip(l.name, 18)} ${l.phone.replace(/[^\d+]/g, '')}`;
  const room = 70 - len(head) - 1;
  return room >= 8 && l.message.trim() ? `${head} ${clip(l.message, room)}` : clip(head, 70);
}
export function chatText(c: { phone: string; text: string }): string {
  const tel = c.phone.replace(/[^\d+]/g, '');
  const head = 'В чате: ', tail = tel ? ` ${tel}` : '';
  return head + clip(c.text || 'фото', 70 - len(head + tail)) + tail;
}

/** Тихие часы по Москве: например с 22:00 до 08:00 (через полночь). */
export function quietNow(cfg: SmsCfg, now = Date.now()): boolean {
  if (!cfg.quiet || !TIME_RE.test(cfg.qfrom) || !TIME_RE.test(cfg.qto)) return false;
  const m = new Date(now + 3 * 3600e3), cur = m.getUTCHours() * 60 + m.getUTCMinutes();
  const mins = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const f = mins(cfg.qfrom), t = mins(cfg.qto);
  if (f === t) return false;
  return f < t ? cur >= f && cur < t : cur >= f || cur < t;
}

/* ---------- отправка ---------- */

const RU_ERR: Record<number, string> = {
  200: 'неверный ключ api_id', 201: 'не хватает средств на счёте', 202: 'неверный номер телефона',
  204: 'для этого оператора не создано имя отправителя', 206: 'превышен дневной лимит', 207: 'на этот номер нельзя отправлять',
  220: 'сервис временно недоступен', 221: 'нужно создать буквенное имя отправителя', 230: 'превышен лимит сообщений на этот номер за день',
  301: 'неверный ключ api_id', 302: 'аккаунт не подтверждён кодом из регистрационного SMS', 500: 'ошибка на стороне SMS.ru',
};
type RuOne = { status?: string; status_code?: number; status_text?: string };

async function viaSmsRu(env: SmsEnv, phone: string, text: string): Promise<SendResult> {
  try {
    const r = await fetch(`${env.SMSRU_API ?? 'https://sms.ru'}/sms/send`, {
      method: 'POST', body: new URLSearchParams({ api_id: env.SMSRU_API_ID ?? '', to: phone, msg: text, json: '1' }), signal: AbortSignal.timeout(10000),
    });
    const j = (await r.json()) as RuOne & { sms?: Record<string, RuOne> };
    const one = Object.values(j.sms ?? {})[0];
    if (j.status === 'OK' && one?.status === 'OK') return { ok: true, info: 'принято SMS.ru' };
    const code = one?.status_code ?? j.status_code ?? 0;
    return { ok: false, info: `SMS.ru, код ${code}: ${clip(one?.status_text ?? j.status_text ?? RU_ERR[code] ?? 'причина неизвестна', 140)}` };
  } catch { return { ok: false, info: 'нет связи с SMS.ru' }; }
}

const b64 = (s: string): string => { let t = ''; new TextEncoder().encode(s).forEach((x) => { t += String.fromCharCode(x); }); return btoa(t); };

async function viaGate(env: SmsEnv, phone: string, text: string): Promise<SendResult> {
  try {
    const r = await fetch(`${env.SMSGATE_API ?? 'https://api.sms-gate.app'}/3rdparty/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Basic ' + b64(`${env.SMSGATE_USER ?? ''}:${env.SMSGATE_PASSWORD ?? ''}`) },
      body: JSON.stringify({ textMessage: { text }, phoneNumbers: ['+' + phone], ttl: 21600, priority: 100 }),
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) return { ok: true, info: 'принято приложением SMS Gateway' };
    const body = clip(await r.text().catch(() => ''), 100);
    return { ok: false, info: `SMS Gateway, ответ ${r.status}${r.status === 401 ? ' (неверный логин или пароль)' : ''}${body ? ': ' + body : ''}` };
  } catch { return { ok: false, info: 'нет связи с сервером SMS Gateway' }; }
}

export async function sendSms(env: SmsEnv, cfg: SmsCfg, text: string): Promise<SendResult> {
  const phone = normPhone(cfg.phone);
  if (!phone) return { ok: false, info: 'не указан номер телефона' };
  if (!smsKeysReady(env, cfg)) return { ok: false, info: 'в Cloudflare не добавлен ключ сервиса' };
  return cfg.provider === 'gate' ? viaGate(env, phone, text) : viaSmsRu(env, phone, text);
}

/** SMS.ru сообщает, сколько бесплатных SMS на свой номер доступно в сутки. */
async function freeInfo(env: SmsEnv): Promise<string> {
  try {
    const r = await fetch(`${env.SMSRU_API ?? 'https://sms.ru'}/my/free`, {
      method: 'POST', body: new URLSearchParams({ api_id: env.SMSRU_API_ID ?? '', json: '1' }), signal: AbortSignal.timeout(8000),
    });
    const j = (await r.json()) as { status?: string; total_free?: number; used_today?: number };
    return j.status === 'OK' ? `бесплатных SMS в сутки: ${j.total_free ?? 0}, сегодня использовано: ${j.used_today ?? 0}` : '';
  } catch { return ''; }
}

/** Пробное SMS из админки: идёт всегда, даже если уведомления выключены или сейчас тихие часы. */
export async function sendTest(env: SmsEnv, cfg: SmsCfg): Promise<SendResult> {
  const r = await sendSms(env, cfg, 'Золотой ключик: пробное SMS, всё работает');
  const free = r.ok && cfg.provider === 'smsru' ? await freeInfo(env) : '';
  const out = { ok: r.ok, info: r.info + (free ? `. ${free[0].toUpperCase()}${free.slice(1)}` : '') };
  await logSms(env.DB, 'test', '', out);
  return out;
}

/* ---------- журнал и пределы ---------- */

async function logSms(db: D1Database, kind: string, ref: string, r: SendResult): Promise<void> {
  await db.prepare('INSERT INTO sms_log (kind, ref, ok, info) VALUES (?,?,?,?)').bind(kind, ref, r.ok ? 1 : 0, r.info).run();
  if (Math.random() < 0.05) await db.prepare('DELETE FROM sms_log WHERE created_at < unixepoch() - 2592000').run();
}

/** Сколько SMS по заявкам и чату ушло сегодня (сутки по Москве). */
export async function sentToday(db: D1Database): Promise<number> {
  const r = await db.prepare("SELECT COUNT(*) AS n FROM sms_log WHERE ok=1 AND kind IN ('lead','chat') AND created_at >= unixepoch('now','+3 hours','start of day','-3 hours')").first<{ n: number }>();
  return r?.n ?? 0;
}
export async function smsRecent(db: D1Database, n = 12): Promise<SmsLogRow[]> {
  return (await db.prepare('SELECT created_at, kind, ok, info FROM sms_log ORDER BY id DESC LIMIT ?').bind(n).all<SmsLogRow>()).results;
}

async function failures(db: D1Database, kind: string, ref: string): Promise<{ n: number; last: number }> {
  const r = await db.prepare('SELECT COUNT(*) AS n, COALESCE(MAX(created_at), 0) AS last FROM sms_log WHERE ok=0 AND kind=? AND ref=? AND created_at > unixepoch() - 86400')
    .bind(kind, ref).first<{ n: number; last: number }>();
  return { n: r?.n ?? 0, last: r?.last ?? 0 };
}

/* ---------- обход по расписанию ---------- */

interface DueChat { id: string; phone: string; mid: number; prev: number; text: string; auto: string }

export async function smsWatch(env: SmsEnv, now = Date.now()): Promise<void> {
  const db = env.DB;
  const cfg = (await loadSettings(db)).sms;
  if (!cfg.on || (!cfg.leads && !cfg.chats)) return;
  if (!normPhone(cfg.phone) || !smsKeysReady(env, cfg) || quietNow(cfg, now)) return;
  const sec = now / 1000;
  let left = cfg.daily - (await sentToday(db));

  if (cfg.leads) {
    await db.prepare('UPDATE leads SET sms=1 WHERE sms=0 AND created_at <= unixepoch() - ?').bind(STALE).run();
    const { results } = await db.prepare('SELECT id, name, phone, message FROM leads WHERE sms=0 ORDER BY id LIMIT 3').all<{ id: number; name: string; phone: string; message: string }>();
    for (const l of results) {
      if (left <= 0) return;
      const ref = String(l.id), f = await failures(db, 'lead', ref);
      if (f.n >= MAX_TRIES) { await db.prepare('UPDATE leads SET sms=1 WHERE id=?').bind(l.id).run(); continue; }
      if (f.n && sec - f.last < RETRY_AFTER) continue;
      if (!(await db.prepare('UPDATE leads SET sms=1 WHERE id=? AND sms=0').bind(l.id).run()).meta.changes) continue; // другой запуск уже взял
      const r = await sendSms(env, cfg, leadText(l));
      await logSms(db, 'lead', ref, r);
      if (r.ok) left--; else await db.prepare('UPDATE leads SET sms=0 WHERE id=?').bind(l.id).run();
    }
  }

  if (cfg.chats && left > 0) {
    const { results } = await db.prepare(
      `SELECT c.id, c.phone, m.id AS mid, c.sms_msg AS prev, m.text, m.auto
       FROM chats c JOIN chat_messages m ON m.id = (SELECT MAX(id) FROM chat_messages WHERE chat_id = c.id)
       WHERE m.from_visitor = 1 AND c.blocked = 0 AND m.id > c.sms_msg
         AND m.created_at <= unixepoch() - ? AND m.created_at > unixepoch() - ?
       ORDER BY m.id LIMIT 8`,
    ).bind(cfg.wait * 60, STALE).all<DueChat>();
    const done = (c: DueChat) => db.prepare('UPDATE chats SET sms_msg=? WHERE id=? AND sms_msg<?').bind(c.mid, c.id, c.mid).run();
    const due: DueChat[] = [];
    for (const c of results) {
      if (c.auto.split(',').some((x) => TOPICS.has(x))) await done(c); // чат уже ответил на вопрос про график, цены, адрес или телефон
      else due.push(c);
    }
    if (!due.length) return;
    const lastSms = (await db.prepare("SELECT COALESCE(MAX(created_at), 0) AS t FROM sms_log WHERE ok=1 AND kind='chat'").first<{ t: number }>())?.t ?? 0;
    if (sec - lastSms < Math.max(cfg.wait, 10) * 60) return; // не чаще раза в 10 минут: защита от спама в чате
    const ref = due.map((c) => `${c.id.slice(0, 8)}#${c.mid}`).join(',').slice(0, 200), f = await failures(db, 'chat', ref);
    if (f.n >= MAX_TRIES) { for (const c of due) await done(c); return; }
    if (f.n && sec - f.last < RETRY_AFTER) return;
    const mine: DueChat[] = [];
    for (const c of due) if ((await done(c)).meta.changes) mine.push(c);
    if (!mine.length) return;
    const r = await sendSms(env, cfg, mine.length === 1 ? chatText(mine[0]) : `В чате ждут ответа: ${mine.length}`);
    await logSms(db, 'chat', ref, r);
    if (!r.ok) for (const c of mine) await db.prepare('UPDATE chats SET sms_msg=? WHERE id=? AND sms_msg=?').bind(c.prev, c.id, c.mid).run();
  }
}
