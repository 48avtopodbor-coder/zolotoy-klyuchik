// Проверка SMS мастеру целиком: админка, пробное SMS, заявки, чат, тихие часы, предел в сутки, повторы, два сервиса (77 проверок).
//
// Как запускать (три окна терминала, из корня проекта):
//   node tests/sms/fake-sms.mjs                      # поддельный SMS.ru и SMS Gateway на 9998
//   node <поддельный Telegram>                       # по желанию: на 9999, чтобы заявки и чат уходили «в Telegram» без ошибок
//   npx wrangler d1 migrations apply DB --local
//   npx wrangler dev --port 8842 --local --test-scheduled --var TELEGRAM_BOT_TOKEN:t --var TELEGRAM_CHAT_ID:111,222 --var TELEGRAM_WEBHOOK_SECRET:whsec --var TELEGRAM_API:http://127.0.0.1:9999 --var SMSRU_API_ID:testkey --var SMSRU_API:http://127.0.0.1:9998 --var SMSGATE_USER:u --var SMSGATE_PASSWORD:p --var SMSGATE_API:http://127.0.0.1:9998
//   node tests/sms/integration.mjs                   # BASE=... для другого порта
// Нужны python3 (правки локальной базы через sqlite3) и пароль админки в .dev.vars. В локальной базе не должно быть настройки admin_pw,
// иначе пароль из .dev.vars не подойдёт (удалить: DELETE FROM settings WHERE key='admin_pw'). Обход по расписанию вызывается как /__scheduled.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE = process.env.BASE || 'http://127.0.0.1:8842';
const FAKE = 'http://127.0.0.1:9998';
const HERE = new URL('.', import.meta.url).pathname;
const ROOT = new URL('../../', import.meta.url).pathname;
const DBDIR = ROOT + '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/';
const DB = process.env.DB || DBDIR + readdirSync(DBDIR).filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite').sort((a, b) => statSync(DBDIR + b).size - statSync(DBDIR + a).size)[0];
const PW = readFileSync(ROOT + '.dev.vars', 'utf8').match(/ADMIN_PASSWORD=(.*)/)[1].trim().replace(/^["']|["']$/g, '');

let pass = 0, fail = 0; const failed = [];
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; failed.push(n); console.log('  ✗', n, x); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), `получили ${JSON.stringify(a)}, ждали ${JSON.stringify(b)}`);
const sql = (q, args = []) => JSON.parse(execFileSync('python3', ['-I', HERE + 'sql.py', DB, q, JSON.stringify(args)]).toString());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const len = (s) => Array.from(s).length;

let cookie = '', ipN = 0;
async function login() {
  const r = await fetch(BASE + '/admin/login', { method: 'POST', body: new URLSearchParams({ password: PW }), redirect: 'manual' });
  cookie = r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  return r.status;
}
const admin = (path, init = {}) => fetch(BASE + path, { ...init, headers: { cookie, ...(init.headers || {}) }, redirect: 'manual' });
const fake = async (p) => (await fetch(FAKE + p)).json();
const mode = (m) => fake('/__mode?m=' + m);
const sent = async () => (await fake('/__log')).filter((x) => x.path === '/sms/send' || x.path === '/3rdparty/v1/messages');
const trigger = async () => { await fetch(BASE + '/__scheduled?cron=*+*+*+*+*'); await sleep(400); };

const DEF = { on: 1, phone: '8 900 596-45-77', provider: 'smsru', leads: 1, chats: 1, wait: 5, quiet: 0, qfrom: '22:00', qto: '08:00', daily: 5 };
async function save(over = {}) {
  const cfg = { ...DEF, ...over }, body = new URLSearchParams();
  for (const [k, v] of Object.entries(cfg)) if (v !== 0 && v !== false && v !== undefined) body.set(k, String(v));
  return admin('/admin/sms', { method: 'POST', body });
}
async function lead(over = {}) {
  const r = await fetch(BASE + '/api/lead', {
    method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '10.77.0.' + (++ipN) },
    body: JSON.stringify({ name: 'Иван', phone: '8 900 111-22-33', message: 'нужен дубликат ключа от домофона', ...over }),
  });
  await r.text();
  return sql('SELECT id FROM leads ORDER BY id DESC LIMIT 1')[0].id;
}
async function chat(text, over = {}) {
  const r = await fetch(BASE + '/api/chat/send', {
    method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '10.78.0.' + (++ipN) },
    body: JSON.stringify({ cid: '', text, name: '', phone: '', auto: '', ...over }),
  });
  return (await r.json()).cid;
}
const age = (cid, sec) => sql('UPDATE chat_messages SET created_at = created_at - ? WHERE chat_id=?', [sec, cid]);
const resetAll = async () => {
  await fake('/__reset'); await mode('ok');
  sql('DELETE FROM sms_log'); sql('UPDATE leads SET sms=1');
  sql('UPDATE chats SET sms_msg = COALESCE((SELECT MAX(id) FROM chat_messages m WHERE m.chat_id = chats.id), 0)');
};
const cfgNow = () => JSON.parse(sql("SELECT value FROM settings WHERE key='sms'")[0].value);
const logRows = () => sql('SELECT kind, ref, ok, info, created_at FROM sms_log ORDER BY id');
const msk = () => { const m = new Date(Date.now() + 3 * 3600e3); return m.getUTCHours() * 60 + m.getUTCMinutes(); };
const hm = (mins) => { const x = ((mins % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };

/* ---------------------------------------------------------------- */
console.log('\nA. страница в админке и сохранение');
ok('вход в админку', (await login()) === 302);
let page = await (await admin('/admin/sms')).text();
ok('вкладка SMS есть в меню', page.includes('href="/admin/sms"'));
ok('по умолчанию выключено', page.includes('Сейчас: <b>выключено</b>'));
ok('доступ к сервису добавлен (ключ есть в окружении)', page.includes('Доступ к сервису: <b>добавлен</b>'));
ok('инструкция свёрнута, когда ключ есть', !/<details class="card how" open/.test(page));

let r = await save({ phone: 'abc' });
let t = await r.text();
ok('кривой номер: ошибка и введённое сохраняется', r.status === 200 && t.includes('не похож на российский') && t.includes('value="abc"'));
r = await save({ phone: '' });
t = await r.text();
ok('включить без номера нельзя', r.status === 200 && t.includes('укажите номер'));
r = await save({ wait: 999, daily: 0, provider: 'x', qfrom: 'zz', quiet: 1 });
ok('сохранение: перенаправление', r.status === 302 && r.headers.get('location') === '/admin/sms?saved=1');
let c = cfgNow();
eq('ожидание и предел вернулись к обычным, сервис к SMS.ru, время к 22:00', [c.wait, c.daily, c.provider, c.qfrom, c.phone], [5, 5, 'smsru', '22:00', '79005964577']);
page = await (await admin('/admin/sms?saved=1')).text();
ok('номер показан красиво, флажки отмечены', page.includes('value="+7 900 596-45-77"') && /id="on" name="on" type="checkbox" value="1" checked/.test(page) && /id="leads"[^>]*checked/.test(page));
ok('сообщение «Сохранено»', page.includes('Сохранено'));
ok('состояние «включено и готово»', page.includes('Сейчас: <b>включено и готово</b>'));

/* ---------------------------------------------------------------- */
console.log('\nB. пробное SMS');
await resetAll(); await save({});
r = await admin('/admin/sms/test', { method: 'POST' });
eq('пробное: перенаправление на успех', [r.status, r.headers.get('location')], [302, '/admin/sms?t=1']);
let s = await sent();
eq('SMS.ru получил один запрос на отправку', s.length, 1);
eq('поля запроса', [s[0].form.api_id, s[0].form.to, s[0].form.msg, s[0].form.json], ['testkey', '79005964577', 'Золотой ключик: пробное SMS, всё работает', '1']);
ok('и один запрос про бесплатный предел', (await fake('/__log')).some((x) => x.path === '/my/free'));
page = await (await admin('/admin/sms?t=1')).text();
ok('зелёное сообщение и строка в журнале с пределом', page.includes('Пробное SMS отправлено') && page.includes('принято SMS.ru. Бесплатных SMS в сутки: 5, сегодня использовано: 1'), page.match(/принято[^<]*/)?.[0]);

for (const [m, want] of [['err221', 'SMS.ru, код 221: Для работы с нашим сервисом, необходимо создать буквенного отправителя'], ['err201', 'SMS.ru, код 201: не хватает средств на счёте'], ['topErr', 'SMS.ru, код 200: неверный ключ api_id'], ['down', 'нет связи с SMS.ru']]) {
  await mode(m);
  r = await admin('/admin/sms/test', { method: 'POST' });
  page = await (await admin(r.headers.get('location'))).text();
  ok(`ошибка «${m}» показана понятным текстом`, r.headers.get('location') === '/admin/sms?t=0' && page.includes('Пробное SMS не отправилось: ' + want), page.match(/не отправилось[^<]*/)?.[0]);
}
await mode('ok');
await save({ on: 0 });
await fake('/__reset');
r = await admin('/admin/sms/test', { method: 'POST' });
eq('пробное идёт даже когда SMS выключены', (await sent()).length, 1);
await save({ on: 1, quiet: 1, qfrom: hm(msk() - 60), qto: hm(msk() + 60) });
await fake('/__reset');
await admin('/admin/sms/test', { method: 'POST' });
eq('пробное идёт и в тихие часы', (await sent()).length, 1);

/* ---------------------------------------------------------------- */
console.log('\nC. заявки с сайта');
await resetAll(); await save({});
let id = await lead();
await trigger();
s = await sent();
eq('одно SMS на заявку', s.length, 1);
eq('текст SMS', s[0]?.form.msg, 'Заявка: Иван 89001112233 нужен дубликат ключа от домофона');
eq('получатель', s[0]?.form.to, '79005964577');
eq('заявка отмечена как обработанная', sql('SELECT sms FROM leads WHERE id=?', [id])[0].sms, 1);
eq('в журнале одна удачная запись', logRows().map((x) => [x.kind, x.ref, x.ok]), [['lead', String(id), 1]]);
await trigger(); await trigger();
eq('повторные обходы ничего не шлют', (await sent()).length, 1);
await fake('/__reset');
await lead({ message: 'очень длинное сообщение '.repeat(30).slice(0, 480) }); await trigger();
s = await sent();
ok('длинное сообщение укорочено до 70 знаков', s.length === 1 && len(s[0].form.msg) === 70 && s[0].form.msg.endsWith('…'), s[0]?.form.msg);

console.log('\nD. выключено и тихие часы');
await resetAll(); await save({ on: 0 });
id = await lead(); await trigger();
eq('выключено: SMS нет, заявка ждёт', [(await sent()).length, sql('SELECT sms FROM leads WHERE id=?', [id])[0].sms], [0, 0]);
await save({ on: 1, leads: 0 }); await trigger();
eq('заявки отключены отдельно: SMS нет', (await sent()).length, 0);
await save({ on: 1, quiet: 1, qfrom: hm(msk() - 60), qto: hm(msk() + 60) }); await trigger();
eq('тихие часы: SMS нет', (await sent()).length, 0);
await save({ on: 1, quiet: 1, qfrom: hm(msk() + 120), qto: hm(msk() + 180) }); await trigger();
s = await sent();
ok('вне тихих часов накопленная заявка уходит', s.length === 1 && s[0].form.msg.startsWith('Заявка: Иван'));

console.log('\nE. старая заявка и без ключа в журнале');
await resetAll(); await save({});
id = await lead(); sql('UPDATE leads SET created_at = created_at - 72000, sms=0 WHERE id=?', [id]);
await trigger();
eq('заявка старше 18 часов: SMS нет, заявка закрыта', [(await sent()).length, sql('SELECT sms FROM leads WHERE id=?', [id])[0].sms], [0, 1]);

/* ---------------------------------------------------------------- */
console.log('\nF. чат');
await resetAll(); await save({});
const A = await chat('Здравствуйте, можно сделать дубликат ключа Mul-T-Lock?', { name: 'Анна', phone: '8 900 222-33-44' });
await trigger();
eq('сразу после сообщения SMS нет', (await sent()).length, 0);
age(A, 240); await trigger();
eq('через 4 минуты SMS нет (ждём 5)', (await sent()).length, 0);
age(A, 120); await trigger();
s = await sent();
ok('через 6 минут одно SMS', s.length === 1, JSON.stringify(s.map((x) => x.form?.msg)));
ok('текст: «В чате», обрезан до 70, номер в конце', s[0] && s[0].form.msg.startsWith('В чате: Здравствуйте') && len(s[0].form.msg) <= 70 && s[0].form.msg.endsWith(' 89002223344'), s[0]?.form.msg);
await trigger(); await trigger();
eq('повторно по тому же сообщению не шлём', (await sent()).length, 1);
eq('в журнале одна запись про чат', logRows().filter((x) => x.kind === 'chat').length, 1);

const B = await chat('Сколько стоит ключ?'); age(B, 400); await trigger();
eq('второй чат сразу после первого SMS: защита от частых SMS', (await sent()).length, 1);
sql("UPDATE sms_log SET created_at = created_at - 700 WHERE kind='chat'"); await trigger();
s = await sent();
ok('через 10 минут после прошлого SMS уходит и второй чат', s.length === 2 && s[1].form.msg.startsWith('В чате: Сколько стоит ключ?'), s[1]?.form.msg);

console.log('\nG. чат: когда SMS не нужно');
await resetAll(); await save({});
const C = await chat('Добрый день, у меня вопрос'); age(C, 400);
sql('INSERT INTO chat_messages (chat_id, from_visitor, text) VALUES (?,0,?)', [C, 'Да, слушаю вас']);
await trigger();
eq('мастер ответил: SMS нет', (await sent()).length, 0);
const D = await chat('Какой у вас график работы?', { auto: 'hours' }); age(D, 400); await trigger();
eq('чат сам ответил про график: SMS нет', (await sent()).length, 0);
eq('и сообщение отмечено обработанным', sql('SELECT sms_msg, (SELECT MAX(id) FROM chat_messages WHERE chat_id=?) AS mx FROM chats WHERE id=?', [D, D])[0].sms_msg, sql('SELECT MAX(id) AS mx FROM chat_messages WHERE chat_id=?', [D])[0].mx);
const D2 = await chat('Цены и адрес подскажите', { auto: 'price,way' }); age(D2, 400); await trigger();
eq('цены и адрес: SMS нет', (await sent()).length, 0);
const E = await chat('Нужна срочная помощь', { auto: 'away' }); age(E, 400); await trigger();
s = await sent();
ok('автоответ «закрыто» не повод молчать: SMS есть', s.length === 1 && s[0].form.msg.startsWith('В чате: Нужна срочная помощь'), s[0]?.form.msg);
const H = await chat('Спам'); age(H, 400); sql('UPDATE chats SET blocked=1 WHERE id=?', [H]);
sql("UPDATE sms_log SET created_at = created_at - 700 WHERE kind='chat'"); await trigger();
eq('заблокированный посетитель: SMS нет', (await sent()).length, 1);

console.log('\nH. несколько чатов сразу');
await resetAll(); await save({});
const F1 = await chat('Первый вопрос'), F2 = await chat('Второй вопрос'), F3 = await chat('Третий вопрос');
for (const x of [F1, F2, F3]) age(x, 400);
await trigger();
s = await sent();
ok('одно SMS на всех', s.length === 1 && s[0].form.msg === 'В чате ждут ответа: 3', JSON.stringify(s.map((x) => x.form?.msg)));
await trigger();
eq('больше не шлём', (await sent()).length, 1);

console.log('\nI. предел в сутки');
await resetAll(); await save({ daily: 1 });
const L1 = await lead(), L2 = await lead({ name: 'Пётр' });
await trigger();
s = await sent();
ok('при пределе 1 уходит одно SMS', s.length === 1, String(s.length));
eq('вторая заявка ждёт', sql('SELECT sms FROM leads WHERE id=?', [L2])[0].sms, 0);
page = await (await admin('/admin/sms')).text();
ok('на странице: сегодня отправлено 1 из 1', page.includes('Сегодня отправлено: <b>1 из 1</b>'));
await trigger();
eq('и дальше не шлём', (await sent()).length, 1);
await save({ daily: 5 }); await trigger();
s = await sent();
ok('после увеличения предела вторая заявка уходит', s.length === 2 && s[1].form.msg.startsWith('Заявка: Пётр'), s[1]?.form.msg);

/* ---------------------------------------------------------------- */
console.log('\nJ. сбой сервиса и повторы');
await resetAll(); await save({});
await mode('err221');
id = await lead(); await trigger();
eq('первая попытка: запрос ушёл, заявка не закрыта', [(await sent()).length, sql('SELECT sms FROM leads WHERE id=?', [id])[0].sms], [1, 0]);
ok('в журнале неудача с причиной', logRows().length === 1 && logRows()[0].ok === 0 && logRows()[0].info.includes('код 221'), JSON.stringify(logRows()));
await trigger(); await trigger();
eq('сразу повторять не будем', (await sent()).length, 1);
sql('UPDATE sms_log SET created_at = created_at - 400'); await trigger();
eq('через 5 минут вторая попытка', (await sent()).length, 2);
sql('UPDATE sms_log SET created_at = created_at - 400'); await trigger();
eq('третья попытка', (await sent()).length, 3);
sql('UPDATE sms_log SET created_at = created_at - 400'); await trigger();
eq('больше трёх попыток нет, заявка закрыта', [(await sent()).length, sql('SELECT sms FROM leads WHERE id=?', [id])[0].sms], [3, 1]);
await mode('ok');
await lead({ name: 'Ольга' }); await trigger();
s = await sent();
ok('после починки новая заявка уходит', s.length === 4 && s[3].form.msg.startsWith('Заявка: Ольга'), s[3]?.form.msg);

await resetAll(); await save({});
await mode('down');
const G1 = await chat('Вопрос при сбое'); age(G1, 400); await trigger();
eq('чат при сбое: запрос ушёл', (await sent()).length, 1);
eq('сообщение не закрыто, будет повтор', sql('SELECT sms_msg < (SELECT MAX(id) FROM chat_messages WHERE chat_id=?) AS pending FROM chats WHERE id=?', [G1, G1])[0].pending, 1);
await mode('ok');
sql('UPDATE sms_log SET created_at = created_at - 700'); await trigger();
s = await sent();
ok('повтор после починки доходит', s.length === 2 && s[1].form.msg.startsWith('В чате: Вопрос при сбое'), s[1]?.form.msg);

/* ---------------------------------------------------------------- */
console.log('\nK. запасной телефон (SMS Gateway)');
await resetAll(); await save({ provider: 'gate' });
page = await (await admin('/admin/sms')).text();
ok('выбран запасной телефон', /<option value="gate" selected>/.test(page));
await lead(); await trigger();
s = await sent();
eq('запрос на сервер шлюза', [s.length, s[0]?.path, s[0]?.auth], [1, '/3rdparty/v1/messages', 'Basic ' + Buffer.from('u:p').toString('base64')]);
eq('тело запроса', s[0]?.json, { textMessage: { text: 'Заявка: Иван 89001112233 нужен дубликат ключа от домофона' }, phoneNumbers: ['+79005964577'], ttl: 21600, priority: 100 });
await mode('gate401');
r = await admin('/admin/sms/test', { method: 'POST' });
page = await (await admin(r.headers.get('location'))).text();
ok('401 понятно объяснён', page.includes('ответ 401 (неверный логин или пароль)'), page.match(/не отправилось[^<]*/)?.[0]);
await mode('gate503');
r = await admin('/admin/sms/test', { method: 'POST' });
page = await (await admin(r.headers.get('location'))).text();
ok('503 показан с текстом сервера', page.includes('ответ 503: queue limit exceeded'), page.match(/не отправилось[^<]*/)?.[0]);
await mode('ok');
await fake('/__reset');
r = await admin('/admin/sms/test', { method: 'POST' });
eq('пробное через шлюз проходит', [r.headers.get('location'), (await sent()).length], ['/admin/sms?t=1', 1]);

/* ---------------------------------------------------------------- */
console.log('\nL. чат запоминает автоответы');
const M = await chat('Проверка', { auto: 'hours,price,bogus,away' });
eq('в базе только известные метки', sql('SELECT auto FROM chat_messages WHERE chat_id=?', [M])[0].auto, 'hours,price,away');
const M2 = await chat('Ещё проверка');
eq('без автоответов пусто', sql('SELECT auto FROM chat_messages WHERE chat_id=?', [M2])[0].auto, '');

console.log('\nМ. без входа в админку SMS недоступны');
const anon = await fetch(BASE + '/admin/sms', { redirect: 'manual' });
eq('страница: перенаправление на вход', [anon.status, anon.headers.get('location')], [302, '/admin/login']);
const anon2 = await fetch(BASE + '/admin/sms/test', { method: 'POST', redirect: 'manual' });
eq('пробное SMS без входа не уходит', [anon2.status, (await sent()).length], [302, 1]);
const anon3 = await fetch(BASE + '/admin/sms', { method: 'POST', body: new URLSearchParams({ on: '1', phone: '89990000000' }), redirect: 'manual' });
eq('сохранение без входа не проходит', anon3.status, 302);

await resetAll(); await save({ on: 0 });
console.log(`\nИтого: ${pass} проверок прошло, ${fail} не прошло`);
if (failed.length) console.log('Не прошли:', failed.join(' | '));
process.exit(fail ? 1 : 0);
