import { CSS } from './styles';
import { themeHead } from './theme';
import { type ChatCfg, type Contacts, type Hours, type Site, type SpecialDay, addDaysStr, hoursRows, mskToday, phoneTel, specialLine, waNumber } from './settings';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number | null;
  old_price: number | null;
  show_price: number;
  is_sale: number;
  in_stock: number;
  images: string[];
}
export interface Video { id: number; oid: string; vid: string; url: string; cover_key: string | null }

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

/* ---------- товары: адрес страницы, краткое описание, текст ---------- */

const TRANSLIT: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
export const slugify = (t: string): string =>
  t.toLowerCase().replace(/[а-яё]/g, (c) => TRANSLIT[c] ?? '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
/** Адрес страницы товара: номер и название латиницей. Если название поменяли, старый адрес перенаправляется на новый. */
export const productSlug = (p: { id: number; title: string }): string => [p.id, slugify(p.title)].filter(Boolean).join('-');
export const productUrl = (p: { id: number; title: string }): string => `/tovar/${productSlug(p)}`;

/** Краткое описание для карточки: без переносов, обрезано по слову. */
export function excerpt(text: string, max = 140): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), Math.floor(max * 0.6))).replace(/[\s.,;:!—–-]+$/, '') + '…';
}

/** Описание товара: пустая строка делит абзацы, строки с «- » становятся списком, одиночные переносы сохраняются. */
export function renderProductText(text: string): string {
  const out: string[] = [];
  let para: string[] = [], list: string[] = [];
  const flushP = () => { if (para.length) out.push(`<p>${para.map(esc).join('<br>')}</p>`); para = []; };
  const flushL = () => { if (list.length) out.push(`<ul>${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`); list = []; };
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const l = raw.trim();
    if (!l) { flushP(); flushL(); continue; }
    const m = /^[-•–]\s+(.*)$/.exec(l);
    if (m) { flushP(); list.push(m[1]); } else { flushL(); para.push(l); }
  }
  flushP(); flushL();
  return out.join('');
}

export function shell(title: string, body: string, opts: { noindex?: boolean; desc?: string; head?: string } = {}): string {
  return `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
${opts.desc ? `<meta name="description" content="${esc(opts.desc)}">` : ''}
${opts.noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}
<meta name="theme-color" content="#0a1824">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${opts.head ?? ''}
<style>${CSS}</style>
</head><body>${body}</body></html>`;
}


export interface Service {
  id: number; label: string; title: string; short: string;
  price: number | null; mode: 'from' | 'fixed' | 'sale' | 'none'; old_price: number | null; details: string;
  note: string; show_note: number; icon: string;
}

/** Текст услуги из админки: пустая строка разделяет абзацы, строки с «- » становятся списком. */
export function renderDetails(text: string): string {
  return text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) => {
    const lines = b.split('\n');
    const items = lines.filter((l) => l.trim().startsWith('- '));
    if (items.length && items.length >= lines.length - 1) {
      const head = lines.filter((l) => !l.trim().startsWith('- ')).join(' ');
      return `${head ? `<p>${esc(head)}</p>` : ''}<ul>${items.map((l) => `<li>${esc(l.trim().slice(2))}</li>`).join('')}</ul>`;
    }
    const first = lines.findIndex((l) => l.trim().startsWith('- '));
    if (first > 0) {
      return `<p>${esc(lines.slice(0, first).join(' '))}</p><ul>${lines.slice(first).filter((l) => l.trim().startsWith('- ')).map((l) => `<li>${esc(l.trim().slice(2))}</li>`).join('')}</ul>`;
    }
    return `<p>${esc(lines.join(' '))}</p>`;
  }).join('');
}

/** Значки услуг (линейные, 24x24). Подписи показываются в админке при выборе. */
export const SERVICE_ICONS: Record<string, string> = {
  key: 'Ключ', fob: 'Домофонная таблетка', phone: 'Телефон', plug: 'Зарядка, шнур', shield: 'Защита', wrench: 'Ремонт',
};
const ICON_SYMBOLS =
  '<symbol id="s-key" viewBox="0 0 24 24"><g transform="rotate(-45 12 12)"><circle cx="5.6" cy="12" r="3.8"/><circle cx="5.6" cy="12" r="1.1"/><path d="M9.4 12H21.5M17.5 12v3.4M21 12v2.4"/></g></symbol>'
  + '<symbol id="s-fob" viewBox="0 0 24 24"><circle cx="12" cy="14" r="7.6"/><circle cx="12" cy="14" r="3"/><path d="M7.2 6.8 5.4 3.6a1.9 1.9 0 0 1 3.2-2"/></symbol>'
  + '<symbol id="s-phone" viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.2"/><path d="M10.5 18.5h3"/><path d="M9 10.5 13.6 5.9M9 14.5l6.2-6.2"/></symbol>'
  + '<symbol id="s-plug" viewBox="0 0 24 24"><path d="M9 2.5v5M15 2.5v5"/><path d="M6.5 7.5h11v3.2a5.5 5.5 0 0 1-11 0z"/><path d="M12 16.2v5.3"/></symbol>'
  + '<symbol id="s-shield" viewBox="0 0 24 24"><path d="M12 2.8 4.8 5.6v5.6c0 4.4 3 7.6 7.2 9.2 4.2-1.6 7.2-4.8 7.2-9.2V5.6z"/><path d="M8.6 11.8l2.4 2.4 4.4-4.8"/></symbol>'
  + '<symbol id="s-wrench" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></symbol>';

export function servicePrice(s: Service): string {
  if (s.price == null || s.mode === 'none') return '';
  const note = s.show_note && s.note.trim() ? `<span class="svc-note">${esc(s.note.trim())}</span>` : '';
  if (s.mode === 'sale') return `<div class="svc-price sale">${s.old_price != null && s.old_price > s.price ? `<s>${rub(s.old_price)}</s>` : ''}<span class="tag-sale">Акция</span>${rub(s.price)}${note}</div>`;
  return `<div class="svc-price">${s.mode === 'from' ? '<span>от</span> ' : ''}${rub(s.price)}${note}</div>`;
}

/** Цена услуги одной строкой для автоответа в чате. */
function chatPrice(s: Service): string {
  if (s.price == null || s.mode === 'none') return '';
  const base = s.mode === 'from' ? `от ${rub(s.price)}`
    : s.mode === 'sale' ? `${rub(s.price)} (акция${s.old_price != null && s.old_price > s.price ? `, было ${rub(s.old_price)}` : ''})`
    : rub(s.price);
  return `${s.title}: ${base}${s.show_note && s.note.trim() ? `, ${s.note.trim()}` : ''}`;
}

function serviceRow(s: Service): string {
  const more = s.details.trim()
    ? `<details class="svc-more"><summary>Подробнее</summary><div class="svc-text">${renderDetails(s.details)}</div></details>`
    : '';
  const icon = s.icon in SERVICE_ICONS ? s.icon : 'key';
  const lead = `<div class="svc-lead"><span class="svc-tile"><svg class="ico" aria-hidden="true"><use href="#s-${icon}"/></svg></span>${s.label ? `<span class="lbl">${esc(s.label)}</span>` : ''}</div>`;
  return `<div class="row svc" id="service-${s.id}">${lead}<div><h3>${esc(s.title)}</h3><p>${esc(s.short)}</p></div>${servicePrice(s)}${more}</div>`;
}

const DAYS_LD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Разметка schema.org: поисковики показывают адрес, график и цены в выдаче и на карте. */
function jsonLd(origin: string, contacts: Contacts, hours: Hours, services: Service[], special: SpecialDay[]): string {
  const main = contacts.phones[0];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    name: 'Мастерская «Золотой ключик»',
    url: origin,
    ...(main ? { telephone: phoneTel(main) } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Липецк', addressCountry: 'RU', streetAddress: contacts.address },
    openingHoursSpecification: hours.days
      .map((d, i) => (d.off ? null : { '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS_LD[i], opens: d.open, closes: d.close }))
      .filter(Boolean),
    ...(special.length ? { specialOpeningHoursSpecification: special.map((x) => ({
      '@type': 'OpeningHoursSpecification', validFrom: x.date, validThrough: x.date,
      opens: x.kind === 'closed' ? '00:00' : x.open, closes: x.kind === 'closed' ? '00:00' : x.close })) } : {}),
    areaServed: { '@type': 'City', name: 'Липецк' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Услуги',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.short },
        ...(s.price != null && s.mode !== 'none' ? { priceCurrency: 'RUB', price: s.price } : {}),
      })),
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

/* Чертёж ключа на первом экране: лист с рамкой, размерами и штампом.
   Цифры условные: рисунок декоративный. Размеры линий и шрифтов задаёт CSS (.kd). */
const arrow = (x: number, y: number, a: number) =>
  `<polygon transform="translate(${x} ${y}) rotate(${a})" points="0,0 -7,-2.6 -7,2.6"/>`;

const KEY_DRAWING = (() => {
  const key = '<circle class="o" cx="62" cy="75" r="46"/><circle class="o" cx="62" cy="75" r="14"/>'
    + '<path class="o" d="M108 66H370V84H346V104H328V84H300V98H284V84H108Z"/>'
    + '<path class="g" d="M130 66V84M170 66V84M210 66V84"/>';
  const axes = '<path class="c" d="M-8 75H128M62 20V130"/>';
  const len = `<g class="dim"><path d="M16 124V152M370 88V152M16 146H370"/>${arrow(16, 146, 180)}${arrow(370, 146, 0)}<text x="193" y="140" text-anchor="middle">62</text></g>`;
  const head = `<g class="dim"><path d="M94.53 107.53L12 25H-18"/>${arrow(29.47, 42.47, 225)}${arrow(94.53, 107.53, 45)}<text x="-18" y="20">Ø16</text></g>`;
  const stem = `<g class="dim"><path d="M372 66H400M372 84H400M394 50V66M394 84V100"/>${arrow(394, 66, 90)}${arrow(394, 84, -90)}<text x="404" y="75" dominant-baseline="middle">3,2</text></g>`;
  const tooth = `<g class="dim"><path d="M328 104H306M314 84V104"/>${arrow(314, 84, -90)}${arrow(314, 104, 90)}<text x="314" y="124" text-anchor="middle">3,5</text></g>`;
  const stamp = '<g class="tb"><rect x="300" y="222" width="200" height="78"/><path d="M300 248H500M300 274H500M424 248V274"/>'
    + '<text class="b" x="310" y="241">ДУБЛИКАТ КЛЮЧА</text><text x="310" y="267">Масштаб 1:1</text><text x="434" y="267">Лист 1</text>'
    + '<text class="m" x="310" y="291">Золотой ключик, Липецк</text></g>';
  return '<svg class="key kd" viewBox="0 0 510 310" role="img" aria-label="Чертёж ключа: длина 62 миллиметра, диаметр головки 16, толщина стержня 3,2, глубина зубца 3,5">'
    + '<rect class="frame" x="3" y="3" width="504" height="304" rx="2"/><rect class="frame2" x="10" y="10" width="490" height="290"/>'
    + `<g transform="translate(40 48)">${axes}${key}${len}${head}${stem}${tooth}</g>`
    + stamp + '<text class="note" x="20" y="292">размеры в мм</text></svg>';
})();

function priceBlock(p: Product, cls = 'pr'): string {
  return p.show_price && p.price != null
    ? `<div class="${cls}${p.is_sale ? ' sale' : ''}">${p.is_sale && p.old_price != null && p.old_price > p.price ? `<s>${rub(p.old_price)}</s> ` : ''}${rub(p.price)}</div>`
    : `<div class="${cls} noprice">Цену уточняйте по телефону</div>`;
}

export function productCard(p: Product): string {
  const url = productUrl(p);
  const photos = p.images.length
    ? `<div class="gal"><div class="gal-track">${p.images
        .map((k, i) => `<img src="/img/${esc(k)}" alt="${esc(p.title)}${p.images.length > 1 ? `, фото ${i + 1}` : ''}" width="800" height="600" loading="lazy" decoding="async">`)
        .join('')}</div>${p.images.length > 1 ? `<span class="gal-cnt">1/${p.images.length}</span>` : ''}</div>`
    : `<div class="ph">фото скоро</div>`;
  const badges = `${p.is_sale ? '<span class="tag-sale on-card">Акция</span>' : ''}${p.in_stock ? '' : '<span class="badge out">Нет в наличии</span>'}`;
  const text = excerpt(p.description);
  return `<article class="good${p.in_stock ? '' : ' is-out'}" data-id="${p.id}" data-url="${url}"><div class="gal-wrap">${photos}${badges}</div><div class="t"><h3><a href="${url}">${esc(p.title)}</a></h3>${text ? `<p class="d">${esc(text)}</p>` : ''}${priceBlock(p)}<a class="more" href="${url}" aria-label="Подробнее о товаре: ${esc(p.title)}">Подробнее</a><button class="ask" type="button" data-ask="${esc(p.title)}" data-stock="${p.in_stock ? 1 : 0}" data-url="${url}" aria-label="Спросить про товар: ${esc(p.title)}"><svg class="ico" aria-hidden="true"><use href="#i-chat"/></svg><span>Спросить<span class="ask-more"> про товар</span></span></button></div></article>`;
}

/** Содержимое товара: галерея, цена, описание, кнопки. Одно и то же на странице товара и в окне на главной. */
export function productInner(p: Product, contacts: Contacts, level: 1 | 2): string {
  const n = p.images.length;
  const url = productUrl(p);
  const main = contacts.phones[0] ?? '';
  const badges = `${p.is_sale ? '<span class="tag-sale">Акция</span>' : ''}<span class="pi-stock ${p.in_stock ? 'in' : 'out'}">${p.in_stock ? 'В наличии' : 'Нет в наличии'}</span>`;
  const slides = p.images.map((k, i) => `<img src="/img/${esc(k)}" alt="${esc(p.title)}${n > 1 ? `, фото ${i + 1}` : ''}" width="1000" height="750" decoding="async"${i === 0 ? ' fetchpriority="high"' : i > 1 ? ' loading="lazy"' : ''}>`).join('');
  const gallery = n
    ? `<div class="pg"><div class="pg-main"><div class="pg-track" tabindex="0" role="group" aria-roledescription="карусель" aria-label="Фото товара">${slides}</div>${n > 1 ? `<button class="pg-btn prev" type="button" aria-label="Предыдущее фото">‹</button><button class="pg-btn next" type="button" aria-label="Следующее фото">›</button><span class="pg-cnt">1 / ${n}</span>` : ''}</div>${n > 1 ? `<div class="pg-thumbs">${p.images.map((k, i) => `<button type="button" aria-label="Фото ${i + 1}"${i === 0 ? ' class="on"' : ''}><img src="/img/${esc(k)}" alt="" width="68" height="52" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}</div>`
    : `<div class="pg"><div class="pg-main"><div class="ph">фото скоро</div></div></div>`;
  return `<div class="pi">${gallery}<div class="pi-info"><div class="pi-badges">${badges}</div>
<h${level} class="pi-title"${level === 2 ? ' id="pm-t"' : ''}>${esc(p.title)}</h${level}>
${priceBlock(p)}
${p.description.trim() ? `<div class="pi-text">${renderProductText(p.description)}</div>` : ''}
<div class="pi-acts"><button class="btn gold ask" type="button" data-ask="${esc(p.title)}" data-stock="${p.in_stock ? 1 : 0}" data-url="${url}"><svg class="ico" aria-hidden="true"><use href="#i-chat"/></svg>Спросить про товар</button>${main ? `<a class="btn" href="tel:${phoneTel(main)}"><svg class="ico" aria-hidden="true"><use href="#i-ph"/></svg>Позвонить</a>` : ''}</div>
${level === 2 ? `<a class="pi-page" href="${url}">Открыть страницу товара</a>` : ''}</div></div>`;
}

function videoCard(v: Video, i: number): string {
  const cover = v.cover_key ? `<img src="/img/${esc(v.cover_key)}" alt="" loading="lazy" width="360" height="640">` : '';
  return `<div class="vcard"><div class="vbox" data-oid="${esc(v.oid)}" data-vid="${esc(v.vid)}"><button class="vplay" type="button" aria-label="Смотреть видео ${i + 1}">${cover}<i></i></button></div><a class="vlink" href="${esc(v.url)}" target="_blank" rel="noopener">Открыть во ВКонтакте</a></div>`;
}

interface Common { hours: Hours; contacts: Contacts; services: Service[]; special: SpecialDay[]; chat: ChatCfg }

/** Общая рамка страниц: шапка, подвал, чат и скрипты. Содержимое страницы вставляется между top и bottom. */
function chrome(d: Common, logoHref: string) {
  const { hours, contacts, services, chat } = d;
  const today = mskToday();
  const upcoming = d.special.filter((x) => x.date >= today && x.date <= addDaysStr(today, 120));
  const soon = upcoming.filter((x) => x.date <= addDaysStr(today, 7)).map((x) => specialLine(x, hours)).filter((x): x is string => !!x);
  const later = upcoming.filter((x) => x.date <= addDaysStr(today, 45)).map((x) => specialLine(x, hours)).filter((x): x is string => !!x);
  const notice = soon.length ? `<div class="notice" role="status"><div class="wrap"><b>Обратите внимание:</b> ${soon.map(esc).join(' · ')}</div></div>` : '';
  const main = contacts.phones[0] ?? '';
  const wa = waNumber(contacts);
  const tg = contacts.telegram.replace(/^@/, '');
  const mapQ = encodeURIComponent(contacts.address);
  const hoursJson = JSON.stringify({ ...hours, special: upcoming.map((x) => ({ d: x.date, k: x.kind, o: x.open, c: x.close, n: x.note })) }).replace(/</g, '\\u003c');
  const phonesHtml = contacts.phones.map((p) => `<p><a class="mlink phone" href="tel:${phoneTel(p)}"><svg class="ico" aria-hidden="true"><use href="#i-ph"/></svg>${esc(p)}</a></p>`).join('');
  const top = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  ${ICON_SYMBOLS}
  <symbol id="i-wa" viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/><path d="M8.9 8.6c0 3.3 2.7 6 6 6" stroke-width="2.6"/></symbol>
  <symbol id="i-tg" viewBox="0 0 24 24"><path d="M21.5 3 2.8 10.3l6 2.3 2.3 6.9 3.3-4 5 3.7z"/><path d="M8.8 12.6 21.5 3"/></symbol>
  <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></symbol>
  <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"/></symbol>
  <symbol id="i-chat" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></symbol>
  <symbol id="i-cam" viewBox="0 0 24 24"><path d="M4 8h3l1.6-2.2h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></symbol>
  <symbol id="i-ph" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></symbol>
</svg>
<div class="bar"><div class="wrap">
  <a class="logo" href="${logoHref}">Мастерская <b>Золотой ключик</b></a>
  <div class="bar-actions">
    <button class="theme-btn" id="theme-btn" type="button" aria-label="Включить светлую тему"><svg class="ico i-sun" aria-hidden="true"><use href="#i-sun"/></svg><svg class="ico i-moon" aria-hidden="true"><use href="#i-moon"/></svg></button>
    ${main ? `<a class="tel" href="tel:${phoneTel(main)}" aria-label="Позвонить ${esc(main)}"><svg class="ico tel-ico" aria-hidden="true"><use href="#i-ph"/></svg><span class="tel-num">${esc(main)}</span></a>` : ''}
  </div>
</div></div>
${notice}
`;
  const bottom = `

<footer id="contacts"><div class="wrap">
  <div class="info">
    <div><div class="lbl">Адрес</div><p>${esc(contacts.address)}</p>
      <p><a href="https://yandex.ru/maps/?text=${mapQ}" target="_blank" rel="noopener">Маршрут в Яндекс Картах</a></p>
      <p><a href="https://2gis.ru/lipetsk/search/${mapQ}" target="_blank" rel="noopener">Открыть в 2ГИС</a></p></div>
    <div><div class="lbl">График</div>
      <table class="hrs">${hoursRows(hours).map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.value)}</td></tr>`).join('')}</table>
      ${later.length ? `<div class="lbl" style="margin-top:1rem">Особые дни</div><ul class="spec">${later.slice(0, 8).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}</div>
    <div><div class="lbl">Связь</div>${phonesHtml}
      ${wa ? `<p><a class="mlink wa" href="https://wa.me/${wa}" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-wa"/></svg>WhatsApp</a></p>` : ''}
      ${tg ? `<p><a class="mlink tg" href="https://t.me/${esc(tg)}" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-tg"/></svg>Telegram: @${esc(tg)}</a></p>` : ''}</div>
  </div>
  <div class="copy">© Мастерская «Золотой ключик», Липецк</div>
</div></footer>

<button class="cw-btn" id="cw-btn" type="button" aria-label="Напишите нам" aria-expanded="false" aria-controls="cw-panel">
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>
  <span class="cw-label">Напишите нам</span><i class="cw-dot" id="cw-dot" hidden></i>
</button>
<section class="cw-panel" id="cw-panel" hidden aria-label="Чат с мастерской">
  <header><div><b>Золотой ключик</b><small id="cw-sub">Отвечаем в рабочее время</small></div><button type="button" id="cw-close" aria-label="Закрыть чат">×</button></header>
  <div class="cw-log" id="cw-log" role="log" aria-live="polite"></div>
  <details class="cw-who" id="cw-who"><summary>Оставить имя и телефон (по желанию)</summary>
    <input id="cw-name" type="text" placeholder="Ваше имя" maxlength="80" autocomplete="name">
    <input id="cw-phone" type="tel" placeholder="Телефон, чтобы мы могли перезвонить" maxlength="30" autocomplete="tel" inputmode="tel">
  </details>
  <div class="cw-attach" id="cw-attach" hidden>
    <img id="cw-prev" alt="Выбранное фото" hidden>
    <span id="cw-pinfo" role="status"></span>
    <button type="button" id="cw-pdel" aria-label="Убрать фото">×</button>
  </div>
  <form class="cw-form" id="cw-form">
    <button type="button" class="cw-clip" id="cw-clip" aria-label="Прикрепить фото" title="Прикрепить фото"><svg class="ico" aria-hidden="true"><use href="#i-cam"/></svg></button>
    <input id="cw-file" type="file" accept="image/*" hidden>
    <textarea id="cw-text" rows="1" maxlength="1000" placeholder="Напишите сообщение…" aria-label="Сообщение"></textarea>
    <button type="submit" aria-label="Отправить">➤</button>
  </form>
</section>
<script type="application/json" id="cw-data">${JSON.stringify({
    hours: hoursRows(hours),
    address: contacts.address,
    ya: `https://yandex.ru/maps/?text=${mapQ}`,
    gis: `https://2gis.ru/lipetsk/search/${mapQ}`,
    auto: chat.auto,
    prices: services.map(chatPrice).filter(Boolean),
    special: later.slice(0, 4),
    phones: contacts.phones.map((p) => [p, `tel:${phoneTel(p)}`]),
    wa: wa ? `https://wa.me/${wa}` : '',
    tg: tg ? `https://t.me/${tg}` : '',
  }).replace(/</g, '\\u003c')}</script>
<script>
(function(){
  var D=JSON.parse(document.getElementById('cw-data').textContent);
  var $=function(id){return document.getElementById(id)};
  var btn=$('cw-btn'),panel=$('cw-panel'),log=$('cw-log'),form=$('cw-form'),text=$('cw-text'),dot=$('cw-dot'),sub=$('cw-sub'),
      who=$('cw-who'),nameI=$('cw-name'),phoneI=$('cw-phone'),
      file=$('cw-file'),clip=$('cw-clip'),att=$('cw-attach'),prev=$('cw-prev'),pinfo=$('cw-pinfo'),pdel=$('cw-pdel'),
      sendBtn=form.querySelector('button[type=submit]');
  var photo=null,photoUrl=null,prepping=false,autoOn=!!D.auto,done={};
  var seen={},lastId=0,cid=null,timer=null,lastAct=0,openP=false,unread=0,recent=false,waiting=false,hinted=false,hintTimer=null,
      chips=null,baseTitle=document.title;
  try{cid=localStorage.getItem('cw_cid')}catch(e){}
  try{lastAct=+localStorage.getItem('cw_act')||0}catch(e){}
  function save(){try{localStorage.setItem('cw_cid',cid);localStorage.setItem('cw_act',String(lastAct))}catch(e){}}
  function el(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n}
  function scroll(){log.scrollTop=log.scrollHeight}

  /* статус в шапке: «на связи» только если сейчас рабочее время и мастер недавно отвечал */
  function setStatus(){
    var on=recent;
    sub.textContent=on?'● Мастер на связи':(window.__open?'Отвечаем в рабочее время':'Мастерская закрыта. Ответим, как только сможем');
    sub.className=on?'on':'';
  }
  function bubble(m){
    if(seen[m.id])return;seen[m.id]=1;
    var d=el('div','cw-msg '+(m.v?'me':'them'));
    if(!m.v)d.appendChild(el('span','cw-from','Мастер'));
    var src=m.img||(m.p&&cid?'/api/chat/photo/'+m.p+'?cid='+cid:'');
    if(src){
      var a=el('a','cw-ph'),im=el('img','cw-photo');
      a.href=src;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label','Открыть фото');
      im.src=src;im.alt='Фото';im.loading='lazy';im.onload=scroll;a.appendChild(im);d.appendChild(a);
    }
    if(m.text)d.appendChild(el('span','',m.text));
    if(m.tick){var k=el('span','cw-tick','✓');k.title='Доставлено мастеру';d.appendChild(k)}
    log.appendChild(d);scroll();
  }
  function note(txt,links,label,acts){
    var d=el('div','cw-msg them auto');d.appendChild(el('span','cw-from',label||'Подсказка'));
    d.appendChild(el('span','',txt));
    (links||[]).forEach(function(l){var a=el('a','cw-link',l[0]);a.href=l[1];if(l[1].indexOf('http')===0){a.target='_blank';a.rel='noopener'}d.appendChild(a)});
    (acts||[]).forEach(function(x){var b=el('button','cw-link',x[0]);b.type='button';b.addEventListener('click',x[1]);d.appendChild(b)});
    log.appendChild(d);scroll();
  }

  /* автоответы: тексты собираются из данных сайта (график с особыми днями, адрес, цены, контакты) */
  var TOP=[
    ['hours',/график|режим работ|часы работ|время работ|расписани|до скольки|с скольки|во сколько (вы |мастерск)?(открыва|закрыва|работа)|когда (вы |мастерск)?(открыва|закрыва|работа)|работаете|работает ли|открыты|открыто|закрыты|закрыто|выходн|перерыв|обед/],
    ['price',/ско(лько|ка|ко) (это )?(будет )?сто(ит|ить)|цена|цены|цену|цене|стоимост|прайс|почем|по чем|расценк|сколько (с меня|денег|надо|нужно|берете|возьмете)/],
    ['way',/адрес|где (вы )?(находит|расположен|нах)|где вы|где (ваша |ваш )?(мастерск|офис)|как (до вас |к вам )?(добрат|доехат|дойти|пройти|найти|проехат)|как вас найти|на карте|маршрут|ориентир|куда (ехать|идти|подъехать)/],
    ['contacts',/телефон|позвонит|позвоню|номер для связи|ваш номер|whatsapp|ватсап|вотсап|вацап|telegram|телеграм|связаться/]
  ];
  function answer(tp,label){
    done[tp]=1;label=label||'Автоответ';
    if(tp==='hours'){
      var st=window.__status||'';
      note((st?st+'.\\n\\n':'')+D.hours.map(function(r){return r.label+': '+r.value}).join('\\n')+((D.special&&D.special.length)?'\\n\\nОсобые дни:\\n'+D.special.join('\\n'):''),null,label);
    }else if(tp==='price'){
      note('Ориентировочные цены:\\n'+D.prices.join('\\n')+'\\n\\nТочную цену назовёт мастер, она зависит от ключа. Пришлите фото ключа, и мы скажем, сделаем ли и сколько.',null,label,[['Прислать фото ключа',function(){file.click()}]]);
    }else if(tp==='way'){
      note(D.address,[['Маршрут в Яндекс Картах',D.ya],['Открыть в 2ГИС',D.gis]],label);
    }else if(tp==='contacts'){
      var ln=D.phones.map(function(p){return ['Позвонить: '+p[0],p[1]]});
      if(D.wa)ln.push(['Написать в WhatsApp',D.wa]);
      if(D.tg)ln.push(['Написать в Telegram',D.tg]);
      note('Телефон и мессенджеры:',ln,label);
    }
  }
  function away(){
    hinted=true;
    var ln=[];
    if(D.wa)ln.push(['Написать в WhatsApp',D.wa]);
    if(D.tg)ln.push(['Написать в Telegram',D.tg]);
    note((window.__status||'Сейчас закрыто')+'. Сообщение передано мастеру: если он на связи, ответит раньше, иначе в рабочее время.'+(phoneI.value?'':' Оставьте телефон, и мы перезвоним.')+(ln.length?'\\n\\nЧтобы не ждать на этой странице, напишите в мессенджер: ответ придёт на телефон.':''),ln,'Автоответ');
    if(!phoneI.value)who.open=true;
  }
  /* что ответить на сообщение: до 2 тем, каждая один раз; когда закрыто, один раз сообщаем время открытия */
  function plan(t){
    if(!autoOn)return {topics:[],away:false};
    var s=t.toLowerCase().replace(/ё/g,'е'),out=[];
    TOP.forEach(function(x){if(x[1].test(s)&&!done[x[0]])out.push(x[0])});
    out=out.slice(0,2);
    return {topics:out,away:!window.__open&&!recent&&!hinted&&out.indexOf('hours')<0};
  }
  function marks(pl){return pl.topics.concat(pl.away?['away']:[]).join(',')}
  function play(pl){
    var delay=500;
    pl.topics.forEach(function(tp){setTimeout(function(){answer(tp)},delay);delay+=700});
    if(pl.away){hinted=true;setTimeout(away,delay)}
  }
  function problem(txt){log.appendChild(el('div','cw-msg err',txt));scroll()}

  function hello(){
    var d=el('div','cw-msg them auto');d.appendChild(el('span','cw-from','Подсказка'));
    d.appendChild(el('span','',window.__open?'Здравствуйте! Напишите, чем помочь, или выберите вопрос ниже. Можно приложить фото ключа.':'Здравствуйте! Мастерская сейчас закрыта. Напишите (можно с фото ключа): если мастер на связи, он ответит сразу, иначе в рабочее время. Оставьте телефон, чтобы мы могли перезвонить.'));
    log.appendChild(d);
    chips=el('div','cw-chips');
    [['Сколько стоит дубликат ключа?','send'],['Прислать фото ключа','photo'],['График работы','hours'],['Как добраться','way']].forEach(function(c){
      var b=el('button','',c[0]);b.type='button';
      b.addEventListener('click',function(){
        removeChips();
        if(c[1]==='send'){text.value=c[0];form.requestSubmit()}
        else if(c[1]==='photo')file.click();
        else if(c[1]==='hours')answer('hours','Подсказка');
        else answer('way','Подсказка');
      });
      chips.appendChild(b);
    });
    log.appendChild(chips);scroll();
  }
  function removeChips(){if(chips){chips.remove();chips=null}}

  function applyMessages(j){
    recent=!!j.recent;setStatus();
    var staff=false;
    (j.messages||[]).forEach(function(m){
      if(!seen[m.id]){bubble(m);if(!m.v)staff=true}
      if(m.id>lastId)lastId=m.id;
    });
    if(staff){
      waiting=false;clearTimeout(hintTimer);
      if(!openP||document.hidden){unread++;document.title='('+unread+') Новое сообщение';if(!openP)dot.hidden=false}
    }
  }
  function poll(){
    var url=cid?'/api/chat/poll?cid='+cid+'&after='+lastId:'/api/chat/status';
    fetch(url,{cache:'no-store'}).then(function(r){return r.json()}).then(applyMessages).catch(function(){});
  }
  function schedule(){
    clearInterval(timer);
    if(!cid)return;
    var idle=Date.now()-lastAct;
    if(openP&&idle<15*60e3)timer=setInterval(function(){if(!document.hidden)poll()},4000);
    else if(!openP&&idle<30*60e3)timer=setInterval(function(){if(!document.hidden)poll()},15000);
  }
  function resetTitle(){unread=0;document.title=baseTitle}
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&openP)resetTitle()});

  function open(){
    openP=true;panel.hidden=false;btn.setAttribute('aria-expanded','true');dot.hidden=true;btn.classList.add('cw-hide');resetTitle();
    if(!log.children.length)hello();
    setStatus();poll();schedule();setTimeout(function(){text.focus()},50);
  }
  function close(){openP=false;panel.hidden=true;btn.setAttribute('aria-expanded','false');btn.classList.remove('cw-hide');schedule();btn.focus()}
  btn.addEventListener('click',open);
  /* «Спросить про товар»: открываем чат и подставляем вопрос, отправляет сам посетитель */
  document.addEventListener('click',function(e){
    var a=e.target.closest('[data-ask]');if(!a)return;
    var t=a.dataset.ask,q=a.dataset.stock==='1'?'Здравствуйте! Интересует товар «'+t+'». Есть в наличии?':'Здравствуйте! Когда будет в наличии «'+t+'»?';
    if(a.dataset.url)q+='\\n'+location.origin+a.dataset.url;
    open();removeChips();
    text.value=text.value.trim()?text.value.trim()+'\\n'+q:q;
    text.style.height='auto';text.style.height=Math.min(text.scrollHeight,110)+'px';
    text.focus();text.setSelectionRange(text.value.length,text.value.length);
  });
  $('cw-close').addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&openP)close()});
  text.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
  text.addEventListener('input',function(){text.style.height='auto';text.style.height=Math.min(text.scrollHeight,110)+'px'});

  /* если мастер не ответил за 2,5 минуты, предлагаем оставить телефон */
  function armHint(){
    clearTimeout(hintTimer);waiting=true;
    if(hinted)return;
    if(!window.__open){
      hinted=true;
      note('Мастерская закрыта. Если мастер на связи, он ответит раньше, иначе в рабочее время.'+(phoneI.value?'':' Оставьте телефон, чтобы мы могли перезвонить.'));
      if(!phoneI.value)who.open=true;
      return;
    }
    hintTimer=setTimeout(function(){
      if(!waiting||hinted)return;hinted=true;
      note('Мастер увидит сообщение и ответит, как освободится.'+(phoneI.value?'':' Оставьте телефон, и мы перезвоним.'));
      if(!phoneI.value)who.open=true;
    },150000);
  }

  /* фото: уменьшаем и сжимаем прямо в браузере (до 1600 px, JPEG), чтобы отправка шла быстро даже по плохой связи */
  function prep(f){
    return new Promise(function(res,rej){
      if(f.size>40*1024*1024)return rej();
      var im=new Image(),u=URL.createObjectURL(f);
      im.onload=function(){
        var s=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));
        var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);
        URL.revokeObjectURL(u);
        c.toBlob(function(b){
          if(!b)return rej();
          if(b.size<=850000)return res(b);
          c.toBlob(function(b2){b2&&b2.size<=850000?res(b2):rej()},'image/jpeg',0.55);
        },'image/jpeg',0.82);
      };
      im.onerror=function(){URL.revokeObjectURL(u);rej()};
      im.src=u;
    });
  }
  function clearPhoto(keepUrl){
    photo=null;if(photoUrl&&!keepUrl)URL.revokeObjectURL(photoUrl);photoUrl=null;
    att.hidden=true;prev.hidden=true;prev.removeAttribute('src');file.value='';
    text.placeholder='Напишите сообщение…';
  }
  clip.addEventListener('click',function(){file.click()});
  pdel.addEventListener('click',function(){clearPhoto();text.focus()});
  file.addEventListener('change',function(){
    var f=file.files&&file.files[0];if(!f)return;
    removeChips();clearPhoto();
    prepping=true;att.hidden=false;pinfo.textContent='Готовлю фото…';sendBtn.disabled=true;
    prep(f).then(function(b){
      photo=b;photoUrl=URL.createObjectURL(b);prev.src=photoUrl;prev.hidden=false;
      pinfo.textContent='Фото готово. Его увидит только мастерская.';
      text.placeholder='Вопрос про этот ключ…';
      text.focus();
    }).catch(function(){
      clearPhoto();problem('Не удалось обработать фото. Выберите другое или опишите ключ словами.');
    }).then(function(){prepping=false;sendBtn.disabled=false});
  });

  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(prepping)return;
    var t=text.value.trim();if(!t&&!photo)return;
    sendBtn.disabled=true;removeChips();
    var req,pl=plan(t);
    if(photo){
      var fd=new FormData();fd.append('cid',cid||'');fd.append('text',t);fd.append('name',nameI.value);fd.append('phone',phoneI.value);fd.append('auto',marks(pl));fd.append('photo',photo,'photo.jpg');
      req={method:'POST',body:fd};
    }else req={method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cid:cid,text:t,name:nameI.value,phone:phoneI.value,auto:marks(pl)})};
    var sentUrl=photo?photoUrl:null;
    fetch('/api/chat/send',req)
    .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
    .then(function(x){
      if(!x.ok){problem(x.j.error||'Не удалось отправить. Позвоните нам.');return}
      cid=x.j.cid;lastAct=Date.now();save();
      bubble({id:x.j.id,v:1,text:t,img:sentUrl,tick:x.j.delivered});text.value='';text.style.height='auto';
      if(sentUrl)clearPhoto(true);
      if(!x.j.delivered)problem('Сообщение сохранено, но пока не дошло до мастера. Позвоните нам, пожалуйста.');
      if(phoneI.value)who.open=false;
      play(pl);armHint();schedule();
    })
    .catch(function(){problem('Нет связи. Проверьте интернет или позвоните нам.')})
    .then(function(){sendBtn.disabled=false;text.focus()});
  });
  if(cid&&Date.now()-lastAct<30*60e3){schedule();poll()}
})();
</script>
<script type="application/json" id="hours-data">${hoursJson}</script>
<script>
(function(){
  /* статус «открыто / закрыто» по графику и особым дням из админки; Липецк = МСК (UTC+3) */
  var H=JSON.parse(document.getElementById('hours-data').textContent),SP={};
  H.special.forEach(function(x){SP[x.d]=x});
  var m=new Date(Date.now()+3*3600e3),mins=m.getUTCHours()*60+m.getUTCMinutes();
  var today=new Date(Date.UTC(m.getUTCFullYear(),m.getUTCMonth(),m.getUTCDate()));
  function tm(s){var p=s.split(':');return +p[0]*60+ +p[1]}
  function f(s){return s.replace(/^0/,'')}
  function sched(dt){
    var key=dt.toISOString().slice(0,10),sp=SP[key];
    if(sp){return sp.k==='closed'?{off:true,note:sp.n}:{off:false,open:sp.o,close:sp.c,note:sp.n}}
    var d=H.days[(dt.getUTCDay()+6)%7];return {off:d.off,open:d.open,close:d.close};
  }
  var MONTHS=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var WD=['в воскресенье','в понедельник','во вторник','в среду','в четверг','в пятницу','в субботу'];
  var d=sched(today),text='',open=false;
  if(!d.off){
    var o=tm(d.open),c=tm(d.close);
    if(mins>=o&&mins<c){
      if(H.lunch.on&&mins>=tm(H.lunch.from)&&mins<tm(H.lunch.to))text='Сейчас перерыв, откроемся в '+f(H.lunch.to);
      else{open=true;text='Сейчас открыто до '+f(d.close)}
    }else if(mins<o)text='Сейчас закрыто. Откроемся сегодня в '+f(d.open);
  }
  if(!text){
    for(var i=1;i<=30;i++){
      var dt=new Date(today.getTime()+i*86400000),n=sched(dt);
      if(!n.off){
        var when=i===1?'завтра':i<7?WD[dt.getUTCDay()]:dt.getUTCDate()+' '+MONTHS[dt.getUTCMonth()];
        text=(d.off&&d.note?'Сегодня выходной ('+d.note.replace(/\\s*\\(.*\\)$/,'')+'). ':'Сейчас закрыто. ')+'Откроемся '+when+' в '+f(n.open);break;
      }
    }
    if(!text)text='Сейчас закрыто';
  }
  var st=document.getElementById('state');if(st)st.textContent=(open?'● ':'○ ')+text;window.__open=open;window.__status=text;

  /* слайдер «до и после» */
  document.querySelectorAll('.ba').forEach(function(b){
    var r=b.querySelector('.ba-range');
    r.addEventListener('input',function(){b.style.setProperty('--pos',r.value+'%')});
  });

  /* мягкое появление блоков при прокрутке: если что-то не поддерживается, блоки просто видны */
  if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    var rv=document.querySelectorAll('.reveal');
    document.documentElement.classList.add('rv');
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}});
    },{rootMargin:'0px 0px -8% 0px',threshold:.06});
    rv.forEach(function(el){io.observe(el)});
  }

  /* счётчик фото на карточке товара */
  document.querySelectorAll('.gal').forEach(function(g){
    var t=g.querySelector('.gal-track'),c=g.querySelector('.gal-cnt');if(!c)return;
    t.addEventListener('scroll',function(){c.textContent=(Math.round(t.scrollLeft/t.clientWidth)+1)+'/'+t.children.length},{passive:true});
  });

  /* галерея товара: стрелки, миниатюры, счётчик (на странице товара и в окне) */
  var calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function initGal(root){
    root.querySelectorAll('.pg').forEach(function(g){
      if(g._on)return;g._on=1;
      var tr=g.querySelector('.pg-track');if(!tr)return;
      var n=tr.children.length,cnt=g.querySelector('.pg-cnt'),th=g.querySelectorAll('.pg-thumbs button'),pv=g.querySelector('.prev'),nx=g.querySelector('.next');
      function idx(){return tr.clientWidth?Math.round(tr.scrollLeft/tr.clientWidth):0}
      function go(i){i=Math.max(0,Math.min(n-1,i));tr.scrollTo({left:i*tr.clientWidth,behavior:calm?'auto':'smooth'})}
      function sync(){
        var i=idx();
        if(cnt)cnt.textContent=(i+1)+' / '+n;
        th.forEach(function(b,j){b.classList.toggle('on',j===i);if(j===i)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});
        if(pv)pv.disabled=i<=0;
        if(nx)nx.disabled=i>=n-1;
      }
      tr.addEventListener('scroll',function(){requestAnimationFrame(sync)},{passive:true});
      if(pv)pv.addEventListener('click',function(){go(idx()-1)});
      if(nx)nx.addEventListener('click',function(){go(idx()+1)});
      th.forEach(function(b,j){b.addEventListener('click',function(){go(j)})});
      tr.addEventListener('keydown',function(e){
        if(e.key==='ArrowLeft'){e.preventDefault();go(idx()-1)}
        else if(e.key==='ArrowRight'){e.preventDefault();go(idx()+1)}
      });
      g._go=function(i){tr.scrollTo({left:i*tr.clientWidth,behavior:'auto'});sync()};
      sync();
    });
  }
  initGal(document);

  /* окно товара на главной: по нажатию на фото, название или «Подробнее». У каждого товара есть и своя страница с тем же содержимым */
  var pm=document.getElementById('pm'),here=location.pathname,pushed=false,leaving=false;
  if(pm&&pm.showModal){
    var pbody=pm.querySelector('.pm-body'),pbox=pm.querySelector('.pm-box'),loads={},baseTitle=document.title,curCard=null;
    document.documentElement.classList.add('pm-on');
    function fetchP(id){
      if(!loads[id])loads[id]=fetch('/api/product/'+id).then(function(r){if(!r.ok)throw new Error('нет товара');return r.text()}).catch(function(e){delete loads[id];throw e});
      return loads[id];
    }
    function openP(card,idx){
      var id=card.dataset.id,url=card.dataset.url;
      curCard=card;card.classList.add('is-loading');
      var slow=setTimeout(function(){if(curCard===card)location.href=url},6000);
      fetchP(id).then(function(html){
        clearTimeout(slow);card.classList.remove('is-loading');
        if(curCard!==card)return;
        pbody.innerHTML=html;initGal(pbody);
        var h=pbody.querySelector('.pi-title');
        if(h)pm.setAttribute('aria-label',h.textContent);
        if(!pm.open){
          pm.showModal();document.documentElement.classList.add('pm-open');
          history.pushState({pm:1},'',url);pushed=true;
          document.title=(h?h.textContent+' | ':'')+'Золотой ключик';
        }
        pbox.scrollTop=0;
        var g=pbody.querySelector('.pg');if(g&&g._go&&idx)g._go(idx);
      }).catch(function(){clearTimeout(slow);card.classList.remove('is-loading');location.href=url});
    }
    pm.addEventListener('close',function(){
      document.documentElement.classList.remove('pm-open');
      document.title=baseTitle;pbody.innerHTML='';curCard=null;
      if(pushed){pushed=false;history.back()}
    });
    /* «Открыть страницу товара»: адрес окна совпадает с адресом страницы, поэтому Chrome не добавляет запись в историю, а подменяет её,
       и после «назад» меняется только адрес. Сначала снимаем запись окна кнопкой «назад», потом открываем страницу как обычный новый переход */
    function toPage(url){
      if(leaving)return;
      leaving=true;pushed=false;
      var done=false;
      function go(){if(done)return;done=true;removeEventListener('popstate',go);location.href=url}
      addEventListener('popstate',go);setTimeout(go,1500);
      setTimeout(function(){leaving=false;if(pm.open)pm.close()},5000);
      history.back();
    }
    pm.addEventListener('click',function(e){
      var pg=e.target.closest('.pi-page');
      if(pg&&pushed&&!e.button&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();toPage(pg.href);return}
      if(e.target===pm||e.target.closest('.pm-x')||e.target.closest('[data-ask]'))pm.close();
    });
    addEventListener('pagehide',function(){if(leaving&&pm.open)pm.close()});
    var goods=document.getElementById('goods');
    if(goods){
      goods.addEventListener('click',function(e){
        if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
        var card=e.target.closest('.good');
        if(!card||e.target.closest('[data-ask]'))return;
        if(e.target.closest('a')||e.target.closest('.gal-wrap')){
          e.preventDefault();
          var tr=card.querySelector('.gal-track');
          openP(card,tr&&tr.clientWidth?Math.round(tr.scrollLeft/tr.clientWidth):0);
        }
      });
      /* окно открывается мгновенно: содержимое подгружаем, как только палец или мышь коснулись карточки */
      ['pointerover','touchstart','focusin'].forEach(function(ev){
        goods.addEventListener(ev,function(e){var c=e.target.closest&&e.target.closest('.good');if(c)fetchP(c.dataset.id).catch(function(){})},{passive:true});
      });
    }
  }

  /* адрес и страница должны совпадать. Chrome после «назад» иногда меняет только адрес, а страница остаётся прежней: тогда загружаем ту, что соответствует адресу */
  function sync(pop){
    if(leaving)return;
    if(pm&&pm.open){
      if(!pop&&location.pathname!==here)return;
      pushed=false;pm.close();
    }
    if(location.pathname!==here)location.reload();
  }
  addEventListener('popstate',function(){sync(true)});
  addEventListener('pageshow',function(e){if(e.persisted){leaving=false;sync(false)}});

  /* форма заявки */
  var lf=document.getElementById('lead-form');
  if(lf)lf.addEventListener('submit',function(e){
    e.preventDefault();
    var s=document.getElementById('lf-status'),btn=document.getElementById('lf-btn');
    function say(title,text,ok){
      s.className='lf-status '+(ok?'ok':'bad');s.hidden=false;
      s.innerHTML='<span class="ico" aria-hidden="true">'+(ok
        ?'<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5l4 4 8-9"/></svg>'
        :'<b>!</b>')+'</span><span><b></b><span></span></span>';
      s.querySelector('span:last-child b').textContent=title;
      s.querySelector('span:last-child span').textContent=text;
    }
    var fd=new FormData(lf),data={};fd.forEach(function(v,k){data[k]=v});
    btn.disabled=true;btn.textContent='Отправляю…';
    fetch('/api/lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)})
    .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
    .then(function(x){
      if(x.ok){say('Заявка принята','Перезвоним вам в рабочее время.',true);lf.reset()}
      else say('Заявка не отправлена',x.j.error||'Позвоните нам, пожалуйста.',false);
    })
    .catch(function(){say('Нет связи','Проверьте интернет или позвоните нам.',false)})
    .then(function(){btn.disabled=false;btn.textContent='Отправить заявку'});
  });

  /* видео: загрузка по нажатию, одновременно играет только один ролик */
  var vc=document.getElementById('vc');
  if(!vc)return;
  var track=document.getElementById('vc-track'),timer=null,stopped=false,playing=null;
  function stop(){stopped=true;clearInterval(timer)}
  function reset(box){if(box&&box.querySelector('iframe'))box.innerHTML=box._orig}
  track.querySelectorAll('.vbox').forEach(function(b){b._orig=b.innerHTML});
  track.addEventListener('click',function(e){
    var b=e.target.closest('.vplay');if(!b)return;
    var box=b.parentNode;
    if(playing&&playing!==box)reset(playing);
    var f=document.createElement('iframe');
    f.src='https://vk.com/video_ext.php?oid='+box.dataset.oid+'&id='+box.dataset.vid+'&hd=2&autoplay=1';
    f.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';f.allowFullscreen=true;f.title='Видео мастерской';
    var fs=document.createElement('button');
    fs.type='button';fs.className='vfs';fs.setAttribute('aria-label','Развернуть на весь экран');fs.textContent='⛶';
    box.replaceChildren(f,fs);playing=box;stop();
  });
  /* своя кнопка «на весь экран»: на компьютере плеер ВК её не показывает */
  function isFull(box){return document.fullscreenElement===box||box.classList.contains('vfull')}
  function leaveFull(box){
    box.classList.remove('vfull');document.documentElement.classList.remove('vlock');
    if(document.fullscreenElement===box&&document.exitFullscreen)document.exitFullscreen();
  }
  track.addEventListener('click',function(e){
    var fs=e.target.closest('.vfs');if(!fs)return;
    var box=fs.parentNode;
    if(isFull(box)){leaveFull(box);return}
    if(box.requestFullscreen)box.requestFullscreen().catch(function(){box.classList.add('vfull');document.documentElement.classList.add('vlock')});
    else{box.classList.add('vfull');document.documentElement.classList.add('vlock')}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&playing&&playing.classList.contains('vfull'))leaveFull(playing)});
  /* ролик, который прокрутили за пределы экрана, выключается (иначе звук идёт «за кадром») */
  if('IntersectionObserver' in window){
    var leave=new IntersectionObserver(function(es){
      es.forEach(function(en){if(!en.isIntersecting&&en.target===playing&&!isFull(playing)){reset(playing);playing=null}});
    },{threshold:.3});
    track.querySelectorAll('.vbox').forEach(function(b){leave.observe(b)});
  }

  /* карусель видео: медленная автопрокрутка, останавливается при любом действии посетителя */
  function step(dir){
    var card=track.firstElementChild;if(!card)return;
    var gap=parseFloat(getComputedStyle(track).columnGap)||14,w=card.getBoundingClientRect().width+gap,max=track.scrollWidth-track.clientWidth;
    if(dir>0&&track.scrollLeft>=max-4)track.scrollTo({left:0,behavior:'smooth'});
    else track.scrollBy({left:dir*w,behavior:'smooth'});
  }
  vc.querySelector('.prev').addEventListener('click',function(){stop();step(-1)});
  vc.querySelector('.next').addEventListener('click',function(){stop();step(1)});
  ['pointerdown','wheel','keydown','touchstart'].forEach(function(ev){track.addEventListener(ev,stop,{passive:true})});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      clearInterval(timer);
      if(es[0].isIntersecting&&!stopped)timer=setInterval(function(){step(1)},6000);
    },{threshold:.5}).observe(vc);
  }
})();
</script>`;
  return { top, bottom, upcoming, main, wa, tg };
}

export function homePage(d: Common & { products: Product[]; videos: Video[]; origin: string; site: Site }): string {
  const { products, videos, hours, contacts, services, origin, site } = d;
  const c = chrome(d, '#top');
  const { main, wa, tg, upcoming } = c;
  const goods = products.length
    ? `<div class="goods">${products.map(productCard).join('')}</div>`
    : `<p class="empty">Скоро здесь появятся товары. Наличие подскажем по телефону.</p>`;

  const heroPhoto = site.hero.key
    ? `<figure class="hero-photo"><img src="/img/${esc(site.hero.key)}" alt="${esc(site.hero.caption || 'Мастерская')}" width="1400" height="788" decoding="async" fetchpriority="high">${site.hero.caption ? `<figcaption>${esc(site.hero.caption)}</figcaption>` : ''}</figure>`
    : '';
  const baAr = site.ba.ar && site.ba.ar >= 0.4 && site.ba.ar <= 2.5 ? Number(site.ba.ar.toFixed(3)) : 1.333;
  const ba = site.ba.before && site.ba.after
    ? `<figure class="ba-wrap"><div class="ba" style="--pos:50%">
      <img class="ba-after" src="/img/${esc(site.ba.after)}" alt="Плёнка на телефоне: после" loading="lazy" decoding="async">
      <img class="ba-before" src="/img/${esc(site.ba.before)}" alt="Телефон без плёнки: до" loading="lazy" decoding="async">
      <span class="ba-tag l">До</span><span class="ba-tag r">После</span><i class="ba-line" aria-hidden="true"></i>
      <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Сравнение: до и после">
    </div>${site.ba.caption ? `<figcaption>${esc(site.ba.caption)}</figcaption>` : ''}</figure>`
    : '';
  const stepsHtml = `<section id="steps" class="reveal"><div class="wrap">
    <div class="lbl">Порядок работы</div><h2>Как мы работаем</h2>
    <div class="how${ba ? ' has-ba' : ''}" style="--ar:${baAr}">
      <ol class="steps">${site.steps.map((st, i) => `<li><span class="n" aria-hidden="true">${i + 1}</span><div><h3>${esc(st.t)}</h3><p>${esc(st.d)}</p></div></li>`).join('')}</ol>
      ${ba}
    </div>
  </div></section>`;
  const vids = videos.length
    ? `<section id="video" class="reveal" style="padding-top:0"><div class="wrap">
    <div class="lbl">Видео</div><h2>Смотрите, как мы работаем</h2>
    <div class="vc" id="vc">
      <button class="vc-btn prev" type="button" aria-label="Назад">‹</button>
      <div class="vc-track" id="vc-track">${videos.map(videoCard).join('')}</div>
      <button class="vc-btn next" type="button" aria-label="Вперёд">›</button>
    </div>
  </div></section>`
    : '';
  const modal = `
<dialog class="pm" id="pm" aria-label="Товар"><button class="pm-x" type="button" aria-label="Закрыть">×</button><div class="pm-box"><div class="pm-body"></div></div></dialog>`;
  const body = c.top + `<main id="top">
  <div class="hero"><div class="wrap">
    <div>
      <div class="lbl">Липецк · ${esc(contacts.address.replace(/^\d{6},?\s*/, '').replace(/^г\.\s*Липецк,?\s*/, ''))}</div>
      <h1>Точная копия вашего ключа</h1>
      <p>Дубликаты обычных и домофонных ключей, защитная плёнка для телефона, зарядки и шнуры.</p>
      <div class="btns">
        ${main ? `<a class="btn gold" href="tel:${phoneTel(main)}"><svg class="ico" aria-hidden="true"><use href="#i-ph"/></svg>Позвонить</a>` : ''}
        ${wa ? `<a class="split wa" href="https://wa.me/${wa}" target="_blank" rel="noopener"><span class="tile"><svg class="ico" aria-hidden="true"><use href="#i-wa"/></svg></span><span class="label">WhatsApp</span></a>` : ''}
        ${tg ? `<a class="split tg" href="https://t.me/${esc(tg)}" target="_blank" rel="noopener"><span class="tile"><svg class="ico" aria-hidden="true"><use href="#i-tg"/></svg></span><span class="label">Telegram</span></a>` : ''}
      </div>
      <div class="state" id="state">${hoursRows(hours).map((r) => `${r.label} ${r.value}`).join(', ')}</div>
    </div>
    <div class="hero-art">${heroPhoto}${KEY_DRAWING}</div>
  </div></div>

  <section class="reveal"><div class="wrap">
    <div class="lbl">Услуги</div><h2>Что мы делаем</h2>
    <div class="rows">${services.map(serviceRow).join('')}</div>
  </div></section>

  ${stepsHtml}
  <section id="goods" class="reveal" style="padding-top:0"><div class="wrap">
    <div class="lbl">Товары</div><h2>В наличии</h2>
    ${goods}
  </div></section>

  ${vids}

  <section id="lead" class="reveal" style="padding-top:0"><div class="wrap">
    <div class="lbl">Заявка</div><h2>Оставьте номер, мы перезвоним</h2>
    <form id="lead-form" class="lead" novalidate>
      <label for="lf-name">Ваше имя</label>
      <input id="lf-name" name="name" type="text" autocomplete="name" maxlength="80" required>
      <label for="lf-phone">Телефон</label>
      <input id="lf-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="8 900 000-00-00" maxlength="30" required>
      <label for="lf-msg">Что нужно сделать (необязательно)</label>
      <textarea id="lf-msg" name="message" maxlength="500" placeholder="Например: сделать два дубликата ключа от квартиры"></textarea>
      <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn gold" type="submit" id="lf-btn">Отправить заявку</button>
      <p class="lf-status" id="lf-status" role="status" hidden></p>
    </form>
  </div></section>
</main>` + modal + c.bottom;
  const from = services.filter((x) => x.price != null && x.mode !== 'none').map((x) => `${x.title.toLowerCase()} ${x.mode === 'from' ? 'от ' : ''}${x.price} ₽`).join(', ');
  const desc = `Дубликаты ключей и домофонных ключей, наклейка защитной плёнки на телефон, зарядки и USB-шнуры в Липецке. ${from ? `Цены: ${from}. ` : ''}${contacts.address}.`;
  const title = 'Дубликаты ключей, домофонные ключи, плёнка на телефон в Липецке | Золотой ключик';
  const head = `${themeHead(site.theme)}
<meta name="color-scheme" content="dark light">
<link rel="canonical" href="${esc(origin)}/">
<meta property="og:type" content="website"><meta property="og:locale" content="ru_RU">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(origin)}/">
${jsonLd(origin, contacts, hours, services, upcoming)}`;
  return shell(title, body, { desc, head });
}

/* ---------- страница товара ---------- */

function productLd(origin: string, p: Product): string {
  const url = origin + productUrl(p);
  const images = p.images.map((k) => `${origin}/img/${k}`);
  const data = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.title, url, sku: String(p.id),
    ...(images.length ? { image: images } : {}),
    ...(p.description.trim() ? { description: p.description.replace(/\s+/g, ' ').trim().slice(0, 1000) } : {}),
    ...(p.show_price && p.price != null ? {
      offers: {
        '@type': 'Offer', url, priceCurrency: 'RUB', price: p.price, itemCondition: 'https://schema.org/NewCondition',
        availability: p.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'Мастерская «Золотой ключик»' },
      },
    } : {}),
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Товары', item: `${origin}/#goods` },
      { '@type': 'ListItem', position: 3, name: p.title, item: url },
    ],
  };
  return [data, crumbs].map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
}

export function productPage(d: Common & { product: Product; others: Product[]; origin: string; site: Site }): string {
  const { product: p, others, contacts, origin, site } = d;
  const c = chrome(d, '/');
  const abs = origin + productUrl(p);
  const crumbs = `<nav class="crumbs" aria-label="Путь по сайту"><a href="/">Главная</a><span aria-hidden="true">›</span><a href="/#goods">Товары</a><span aria-hidden="true">›</span><span aria-current="page">${esc(p.title)}</span></nav>`;
  const more = others.length
    ? `<section class="pp-more"><h2>Другие товары</h2><div class="goods">${others.map(productCard).join('')}</div></section>`
    : '';
  const body = c.top + `<main id="top" class="pp"><div class="wrap">${crumbs}${productInner(p, contacts, 1)}${more}</div></main>` + c.bottom;
  const title = `${p.title.length > 70 ? p.title.slice(0, 67) + '…' : p.title} в Липецке | Золотой ключик`;
  const price = p.show_price && p.price != null ? `Цена ${rub(p.price)}. ` : '';
  const desc = p.description.trim()
    ? excerpt(p.description, 155)
    : `${p.title}. ${price}${p.in_stock ? 'В наличии' : 'Под заказ'} в мастерской «Золотой ключик», ${contacts.address}.`;
  const img = p.images[0] ? `${origin}/img/${p.images[0]}` : '';
  const head = `${themeHead(site.theme)}
<meta name="color-scheme" content="dark light">
<link rel="canonical" href="${esc(abs)}">
<meta property="og:type" content="product"><meta property="og:locale" content="ru_RU">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(abs)}">${img ? `<meta property="og:image" content="${esc(img)}">` : ''}
${productLd(origin, p)}`;
  return shell(title, body, { desc, head });
}

/** Страница на месте убранного товара: человек видит ссылку на каталог, поисковик получает 404. */
export function missingProductPage(d: Common & { site: Site }): string {
  const c = chrome(d, '/');
  const body = c.top + `<main id="top" class="pp"><div class="wrap"><h1 class="pi-title">Такого товара нет</h1><p class="empty">Возможно, его уже убрали или ссылка устарела. Посмотрите, что есть сейчас.</p><p><a class="btn gold" href="/#goods">Все товары</a></p></div></main>` + c.bottom;
  return shell('Товар не найден | Золотой ключик', body, { noindex: true, head: `${themeHead(d.site.theme)}\n<meta name="color-scheme" content="dark light">` });
}
