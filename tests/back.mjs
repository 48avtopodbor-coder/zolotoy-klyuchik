// Кнопка «назад» вокруг окна товара и страницы товара: 17 сценариев с проверками.
// Ловит ошибку, когда после «Открыть страницу товара» и «назад» меняется только адрес, а на экране остаётся страница товара.
//
// Запуск (нужен playwright-core: `npm i --no-save playwright-core`, Chromium берётся из /opt/pw-browsers):
//   npx wrangler dev --port 8787 --local        # в другом окне терминала, в базе должно быть не меньше двух товаров
//   BASE=http://127.0.0.1:8787 node tests/back.mjs
// Переменные: BF=1 включает кэш страниц «назад-вперёд» (как в обычном Chrome), MOBILE=1 телефон с касаниями,
// ONLY=F1,F5 запускает только выбранные сценарии. На живом сайте тоже можно: ничего не отправляется.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const BF = process.env.BF === '1';
const MOBILE = process.env.MOBILE === '1';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  ignoreDefaultArgs: BF ? ['--disable-back-forward-cache'] : [],
  args: BF ? ['--enable-features=BackForwardCache,BackForwardCacheTimeToLiveControl'] : [],
});
const ctxOpts = MOBILE
  ? { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true }
  : { viewport: { width: 1280, height: 800 } };

let pass = 0, fail = 0;
const failed = [];
function eq(label, got, want) {
  const bad = Object.keys(want).filter((k) => got[k] !== want[k]);
  if (bad.length) { fail++; failed.push(label); console.log('  ✗', label, 'ожидали', JSON.stringify(want), 'получили', JSON.stringify(got)); }
  else { pass++; console.log('  ✓', label); }
}
function ok(label, cond, extra = '') {
  if (!cond) { fail++; failed.push(label); console.log('  ✗', label, extra); } else { pass++; console.log('  ✓', label); }
}

async function run(name, fn) {
  if (ONLY && !ONLY.includes(name.split(' ')[0])) return;
  console.log(`\n${name}`);
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  const H = {
    page,
    async state() {
      for (let i = 0; i < 10; i++) {
        try {
          return await page.evaluate(() => {
            const pm = document.getElementById('pm');
            const kind = location.href === 'about:blank' ? 'blank'
              : document.getElementById('goods') ? 'home'
              : document.querySelector('main.pp h1.pi-title') ? 'product' : 'other';
            return { kind, path: location.pathname, modal: !!(pm && pm.open), cls: document.documentElement.classList.contains('pm-open'), h1: (document.querySelector('main.pp h1.pi-title') || {}).textContent || '' };
          });
        } catch { await page.waitForTimeout(250); }
      }
      return { kind: 'error' };
    },
    async settle(ms = 900) { await page.waitForTimeout(ms); },
    async start() {
      await page.goto('about:blank');
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await page.waitForSelector('#goods .good');
      await H.settle(300);
    },
    async openModal(sel = '#goods .good h3 a', nth = 0) {
      await page.locator(sel).nth(nth).click();
      await page.waitForSelector('dialog#pm[open]');
      await H.settle(400);
    },
    async toPageLink() {
      await page.locator('dialog#pm a.pi-page').click();
      await page.waitForURL(/\/tovar\//);
      await page.waitForSelector('main.pp h1.pi-title');
      await H.settle(600);
    },
    async back() { await page.goBack({ waitUntil: 'load', timeout: 8000 }).catch(() => null); await H.settle(); return H.state(); },
    async forward() { await page.goForward({ waitUntil: 'load', timeout: 8000 }).catch(() => null); await H.settle(); return H.state(); },
  };
  try { await fn(H); } catch (e) { fail++; failed.push(name + ' (исключение)'); console.log('  ✗ исключение:', String(e).split('\n')[0]); }
  ok('нет ошибок скрипта на странице', errs.length === 0, JSON.stringify(errs));
  await ctx.close();
}

console.log(`=== ${BASE}  bfcache=${BF}  mobile=${MOBILE}`);

await run('F1 окно → «Открыть страницу товара» → назад, назад', async (h) => {
  await h.start(); await h.openModal(); await h.toPageLink();
  eq('на странице товара', await h.state(), { kind: 'product' });
  eq('назад #1: главная без окна', await h.back(), { kind: 'home', path: '/', modal: false, cls: false });
  eq('назад #2: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F2 окно → назад закрывает окно', async (h) => {
  await h.start(); await h.openModal();
  const s = await h.state(); ok('окно открыто, адрес товара', s.modal && /^\/tovar\//.test(s.path));
  eq('назад #1: окно закрыто, адрес /', await h.back(), { kind: 'home', path: '/', modal: false, cls: false });
  eq('назад #2: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F3 окно → крестик → назад выходит с сайта', async (h) => {
  await h.start(); await h.openModal();
  await h.page.locator('.pm-x').click(); await h.settle();
  eq('окно закрыто, адрес /', await h.state(), { kind: 'home', path: '/', modal: false });
  eq('назад: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F4 окно → Esc → назад выходит с сайта', async (h) => {
  await h.start(); await h.openModal();
  await h.page.keyboard.press('Escape'); await h.settle();
  eq('окно закрыто, адрес /', await h.state(), { kind: 'home', path: '/', modal: false });
  eq('назад: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F5 окно → обновить страницу → назад → назад', async (h) => {
  await h.start(); await h.openModal();
  await h.page.reload({ waitUntil: 'load' }); await h.settle();
  eq('после обновления страница товара', await h.state(), { kind: 'product' });
  eq('назад #1: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  eq('назад #2: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F6 окно → назад → вперёд → назад → назад', async (h) => {
  await h.start(); await h.openModal();
  await h.back();
  eq('вперёд: страница товара', await h.forward(), { kind: 'product' });
  eq('назад #1: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  eq('назад #2: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F7 прямой заход на страницу товара → назад', async (h) => {
  const p = h.page;
  await p.goto('about:blank');
  const slug = execSync('curl -s ' + BASE + '/sitemap.xml').toString().match(/\/tovar\/[^<]+/)[0];
  await p.goto(BASE + slug, { waitUntil: 'load' }); await h.settle(300);
  eq('страница товара', await h.state(), { kind: 'product' });
  eq('назад: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F8 страница товара → другой товар → назад → назад → назад', async (h) => {
  await h.start(); await h.openModal(); await h.toPageLink();
  const first = (await h.state()).h1;
  await h.page.locator('.pp-more .good h3 a').first().click();
  await h.page.waitForLoadState('load'); await h.settle(600);
  const second = await h.state();
  ok('открылась другая страница товара', second.kind === 'product' && second.h1 !== first, JSON.stringify(second));
  const b1 = await h.back(); eq('назад #1: первый товар', b1, { kind: 'product', h1: first });
  eq('назад #2: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  eq('назад #3: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F9 окно → страница → назад → вперёд → назад', async (h) => {
  await h.start(); await h.openModal(); await h.toPageLink();
  eq('назад: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  eq('вперёд: страница товара', await h.forward(), { kind: 'product' });
  eq('назад: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  eq('назад: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F10 окно → страница → «Главная» в крошках → назад ×3', async (h) => {
  await h.start(); await h.openModal(); await h.toPageLink();
  await h.page.locator('.crumbs a').first().click();
  await h.page.waitForSelector('#goods .good'); await h.settle(500);
  eq('главная', await h.state(), { kind: 'home', path: '/', modal: false });
  eq('назад #1: страница товара', await h.back(), { kind: 'product' });
  eq('назад #2: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  eq('назад #3: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F11 окно A → крестик → окно B → страница → назад ×2', async (h) => {
  await h.start(); await h.openModal('#goods .good h3 a', 0);
  await h.page.locator('.pm-x').click(); await h.settle();
  await h.openModal('#goods .good h3 a', 1); await h.toPageLink();
  eq('назад #1: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  eq('назад #2: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F12 окно → «Спросить про товар» → назад выходит с сайта', async (h) => {
  await h.start(); await h.openModal();
  await h.page.locator('dialog#pm .pi-acts .ask').click(); await h.settle(700);
  eq('окно закрыто, адрес /', await h.state(), { kind: 'home', path: '/', modal: false });
  eq('назад: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F13 окно → ctrl-клик по «Открыть страницу» открывает новую вкладку', async (h) => {
  await h.start(); await h.openModal();
  const [np] = await Promise.all([
    h.page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
    h.page.locator('dialog#pm a.pi-page').click({ modifiers: ['Control'] }),
  ]);
  ok('новая вкладка открылась', !!np);
  if (np) { await np.waitForLoadState('load').catch(() => {}); ok('в ней страница товара', /\/tovar\//.test(np.url())); await np.close(); }
  eq('в старой вкладке окно по-прежнему открыто', await h.state(), { kind: 'home', modal: true });
});

await run('F14 два окна подряд через «Подробнее» и фото', async (h) => {
  await h.start();
  await h.openModal('#goods .good a.more', 0);
  await h.page.keyboard.press('Escape'); await h.settle();
  await h.openModal('#goods .good .gal-wrap', 1);
  await h.toPageLink();
  eq('назад #1: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  eq('назад #2: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F15 быстрый возврат и снова «Открыть страницу товара» (флаг не залипает)', async (h) => {
  await h.start(); await h.openModal(); await h.toPageLink();
  eq('назад: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  await h.openModal('#goods .good h3 a', 1); await h.toPageLink();
  eq('открылась страница второго товара', await h.state(), { kind: 'product' });
  eq('назад: главная', await h.back(), { kind: 'home', path: '/', modal: false });
  eq('назад: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F16 медленная сеть: окно остаётся, пока грузится страница товара', async (h) => {
  await h.start(); await h.openModal();
  await h.page.route(/\/tovar\/\d+-/, async (route) => { if (route.request().resourceType() === 'document') await new Promise((r) => setTimeout(r, 2000)); await route.continue(); });
  // журнал состояния окна из самой страницы: Playwright во время перехода не даёт выполнять скрипты
  await h.page.evaluate(() => {
    sessionStorage.removeItem('__log'); const t0 = Date.now();
    setInterval(() => {
      const a = JSON.parse(sessionStorage.getItem('__log') || '[]');
      a.push([Date.now() - t0, document.getElementById('pm').open ? 1 : 0, location.pathname === '/' ? 'главная' : 'товар']);
      sessionStorage.setItem('__log', JSON.stringify(a));
    }, 50);
  });
  await h.page.locator('dialog#pm a.pi-page').click({ noWaitAfter: true });
  await h.page.waitForSelector('main.pp h1.pi-title', { timeout: 8000 }); await h.settle(500);
  await h.page.unroute(/\/tovar\/\d+-/);
  const log = await h.page.evaluate(() => JSON.parse(sessionStorage.getItem('__log') || '[]'));
  const last = log[log.length - 1] || [];
  const longest = log.length ? log[log.length - 1][0] : 0;
  ok('журнал собран за время загрузки (около 2 с)', longest > 1500, 'последняя отметка ' + longest + ' мс, записей ' + log.length);
  ok('всё это время окно было на экране (закрывается только в момент ухода со страницы)', log.length > 1 && log.slice(0, -1).every((x) => x[1] === 1), JSON.stringify(log.filter((x) => x[1] !== 1).slice(0, 3)));
  ok('адрес в это время уже /, запись окна снята', log.slice(5).every((x) => x[2] === 'главная'), JSON.stringify(log.slice(-3)));
  eq('страница товара открылась', await h.state(), { kind: 'product' });
  eq('назад #1: главная', await h.back(), { kind: 'home', path: '/', modal: false, cls: false });
  eq('назад #2: выходим с сайта', await h.back(), { kind: 'blank' });
});

await run('F17 после возврата главная остаётся на том же месте каталога', async (h) => {
  await h.start();
  await h.page.locator('#goods').scrollIntoViewIfNeeded();
  await h.page.evaluate(() => window.scrollTo(0, document.getElementById('goods').getBoundingClientRect().top + scrollY + 120));
  await h.settle(700);
  const before = await h.page.evaluate(() => Math.round(scrollY));
  await h.openModal(); await h.toPageLink();
  const back = await h.back();
  await h.settle(700);
  const after = await h.page.evaluate(() => Math.round(scrollY));
  eq('назад: главная', back, { kind: 'home', path: '/', modal: false });
  ok('прокрутка на месте (было ' + before + ', стало ' + after + ')', before > 300 && Math.abs(after - before) < 60, 'было ' + before + ', стало ' + after);
});

console.log(`\nИтого: ${pass} проверок прошло, ${fail} не прошло`);
if (failed.length) console.log('Не прошли:', failed.join(' | '));
await browser.close();
process.exit(fail ? 1 : 0);
