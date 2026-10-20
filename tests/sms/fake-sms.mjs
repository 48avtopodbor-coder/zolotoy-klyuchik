// Поддельные SMS.ru и SMS Gateway (порт 9998): запоминает запросы (/__log, /__reset), режим ответа переключается через /__mode?m=ok|err221|err201|topErr|down|gate401|gate503.
// Запуск: node tests/sms/fake-sms.mjs
import http from 'node:http';
let mode = 'ok'; const log = []; let used = 0;
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const chunks = []; for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString();
  const send = (code, body, type = 'application/json') => { res.statusCode = code; res.setHeader('content-type', type); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
  if (u.pathname === '/__log') return send(200, log);
  if (u.pathname === '/__reset') { log.length = 0; used = 0; return send(200, {}); }
  if (u.pathname === '/__mode') { mode = u.searchParams.get('m') || 'ok'; return send(200, { mode }); }
  const ct = req.headers['content-type'] || '';
  const rec = { path: u.pathname, method: req.method, auth: req.headers.authorization || '', ct: ct.split(';')[0] };
  if (ct.startsWith('application/x-www-form-urlencoded')) rec.form = Object.fromEntries(new URLSearchParams(raw));
  else if (raw) { try { rec.json = JSON.parse(raw); } catch { rec.raw = raw; } }
  log.push(rec);
  if (u.pathname === '/sms/send') {
    const to = rec.form?.to || '';
    if (mode === 'down') return send(500, '<html>Bad gateway</html>', 'text/html');
    if (mode === 'topErr') return send(200, { status: 'ERROR', status_code: 200 });
    if (mode === 'err221') return send(200, { status: 'OK', status_code: 100, sms: { [to]: { status: 'ERROR', status_code: 221, status_text: 'Для работы с нашим сервисом, необходимо создать буквенного отправителя' } }, balance: 0 });
    if (mode === 'err201') return send(200, { status: 'OK', status_code: 100, sms: { [to]: { status: 'ERROR', status_code: 201 } }, balance: 0 });
    used++;
    return send(200, { status: 'OK', status_code: 100, sms: { [to]: { status: 'OK', status_code: 100, sms_id: '000000-' + used } }, balance: 0 });
  }
  if (u.pathname === '/my/free') return send(200, { status: 'OK', status_code: 100, total_free: 5, used_today: used });
  if (u.pathname === '/3rdparty/v1/messages') {
    if (mode === 'gate401' || rec.auth !== 'Basic ' + Buffer.from('u:p').toString('base64')) return send(401, { message: 'unauthorized' });
    if (mode === 'gate503') return send(503, 'queue limit exceeded', 'text/plain');
    used++;
    return send(202, { id: 'm' + used, state: 'Pending', recipients: [] });
  }
  send(404, {});
}).listen(9998, '127.0.0.1', () => console.log('fake sms on 9998'));
