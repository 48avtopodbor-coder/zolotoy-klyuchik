import { CSS } from './styles';
import { type Contacts, type Hours, hoursRows, phoneTel, waNumber } from './settings';

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

export function shell(title: string, body: string, opts: { noindex?: boolean; desc?: string; head?: string } = {}): string {
  return `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
${opts.desc ? `<meta name="description" content="${esc(opts.desc)}">` : ''}
${opts.noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}
<meta name="theme-color" content="#0a1824">
${opts.head ?? ''}
<style>${CSS}</style>
</head><body>${body}</body></html>`;
}


export interface Service {
  id: number; label: string; title: string; short: string;
  price: number | null; mode: 'from' | 'fixed' | 'sale' | 'none'; old_price: number | null; details: string;
  note: string; show_note: number;
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

export function servicePrice(s: Service): string {
  if (s.price == null || s.mode === 'none') return '';
  const note = s.show_note && s.note.trim() ? `<span class="svc-note">${esc(s.note.trim())}</span>` : '';
  if (s.mode === 'sale') return `<div class="svc-price sale">${s.old_price != null && s.old_price > s.price ? `<s>${rub(s.old_price)}</s>` : ''}<span class="tag-sale">Акция</span>${rub(s.price)}${note}</div>`;
  return `<div class="svc-price">${s.mode === 'from' ? '<span>от</span> ' : ''}${rub(s.price)}${note}</div>`;
}

function serviceRow(s: Service): string {
  const more = s.details.trim()
    ? `<details class="svc-more"><summary>Подробнее</summary><div class="svc-text">${renderDetails(s.details)}</div></details>`
    : '';
  return `<div class="row svc" id="service-${s.id}"><span class="lbl">${esc(s.label)}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.short)}</p></div>${servicePrice(s)}${more}</div>`;
}

const DAYS_LD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Разметка schema.org: поисковики показывают адрес, график и цены в выдаче и на карте. */
function jsonLd(origin: string, contacts: Contacts, hours: Hours, services: Service[]): string {
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

function productCard(p: Product): string {
  const photos = p.images.length
    ? `<div class="gal"><div class="gal-track">${p.images
        .map((k, i) => `<img src="/img/${esc(k)}" alt="${esc(p.title)}${p.images.length > 1 ? `, фото ${i + 1}` : ''}" width="800" height="600" loading="lazy" decoding="async">`)
        .join('')}</div>${p.images.length > 1 ? `<span class="gal-cnt">1/${p.images.length}</span>` : ''}</div>`
    : `<div class="ph">фото скоро</div>`;
  const badges = `${p.is_sale ? '<span class="tag-sale on-card">Акция</span>' : ''}${p.in_stock ? '' : '<span class="badge out">Нет в наличии</span>'}`;
  const price = p.show_price && p.price != null
    ? `<div class="pr${p.is_sale ? ' sale' : ''}">${p.is_sale && p.old_price != null && p.old_price > p.price ? `<s>${rub(p.old_price)}</s> ` : ''}${rub(p.price)}</div>`
    : `<div class="pr ask">Цену уточняйте по телефону</div>`;
  return `<article class="good${p.in_stock ? '' : ' is-out'}"><div class="gal-wrap">${photos}${badges}</div><div class="t"><h3>${esc(p.title)}</h3>${p.description ? `<p>${esc(p.description)}</p>` : ''}${price}</div></article>`;
}

function videoCard(v: Video, i: number): string {
  const cover = v.cover_key ? `<img src="/img/${esc(v.cover_key)}" alt="" loading="lazy" width="360" height="640">` : '';
  return `<div class="vcard"><div class="vbox" data-oid="${esc(v.oid)}" data-vid="${esc(v.vid)}"><button class="vplay" type="button" aria-label="Смотреть видео ${i + 1}">${cover}<i></i></button></div><a class="vlink" href="${esc(v.url)}" target="_blank" rel="noopener">Открыть во ВКонтакте</a></div>`;
}

export function homePage(d: { products: Product[]; videos: Video[]; hours: Hours; contacts: Contacts; services: Service[]; origin: string }): string {
  const { products, videos, hours, contacts, services, origin } = d;
  const main = contacts.phones[0] ?? '';
  const wa = waNumber(contacts);
  const tg = contacts.telegram.replace(/^@/, '');
  const mapQ = encodeURIComponent(contacts.address);
  const goods = products.length
    ? `<div class="goods">${products.map(productCard).join('')}</div>`
    : `<p class="empty">Скоро здесь появятся товары. Наличие подскажем по телефону.</p>`;
  const vids = videos.length
    ? `<section id="video" style="padding-top:0"><div class="wrap">
    <div class="lbl">Видео</div><h2>Как мы работаем</h2>
    <div class="vc" id="vc">
      <button class="vc-btn prev" type="button" aria-label="Назад">‹</button>
      <div class="vc-track" id="vc-track">${videos.map(videoCard).join('')}</div>
      <button class="vc-btn next" type="button" aria-label="Вперёд">›</button>
    </div>
  </div></section>`
    : '';
  const hoursJson = JSON.stringify(hours).replace(/</g, '\\u003c');
  const phonesHtml = contacts.phones.map((p) => `<p><a href="tel:${phoneTel(p)}">${esc(p)}</a></p>`).join('');

  const body = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="i-wa" viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/><path d="M8.9 8.6c0 3.3 2.7 6 6 6" stroke-width="2.6"/></symbol>
  <symbol id="i-tg" viewBox="0 0 24 24"><path d="M21.5 3 2.8 10.3l6 2.3 2.3 6.9 3.3-4 5 3.7z"/><path d="M8.8 12.6 21.5 3"/></symbol>
  <symbol id="i-ph" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></symbol>
</svg>
<div class="bar"><div class="wrap">
  <a class="logo" href="#top">Мастерская <b>Золотой ключик</b></a>
  ${main ? `<a class="tel" href="tel:${phoneTel(main)}">${esc(main)}</a>` : ''}
</div></div>
<main id="top">
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
    <svg class="key" viewBox="0 0 400 150" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
      <circle cx="62" cy="75" r="46"/><circle cx="62" cy="75" r="14"/>
      <path d="M108 66H370V84H346V104H328V84H300V98H284V84H108Z"/>
      <path d="M130 66V84M170 66V84M210 66V84" stroke-dasharray="3 5" opacity=".55"/>
      <path d="M62 8V20M62 130V142M2 75H14M110 75H122" opacity=".4"/>
    </svg>
  </div></div>

  <section><div class="wrap">
    <div class="lbl">Услуги</div><h2>Что мы делаем</h2>
    <div class="rows">${services.map(serviceRow).join('')}</div>
  </div></section>

  <section id="goods" style="padding-top:0"><div class="wrap">
    <div class="lbl">Товары</div><h2>В наличии</h2>
    ${goods}
  </div></section>

  ${vids}

  <section id="lead" style="padding-top:0"><div class="wrap">
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
</main>

<footer id="contacts"><div class="wrap">
  <div class="info">
    <div><div class="lbl">Адрес</div><p>${esc(contacts.address)}</p>
      <p><a href="https://yandex.ru/maps/?text=${mapQ}" target="_blank" rel="noopener">Маршрут в Яндекс Картах</a></p>
      <p><a href="https://2gis.ru/lipetsk/search/${mapQ}" target="_blank" rel="noopener">Открыть в 2ГИС</a></p></div>
    <div><div class="lbl">График</div>
      <table class="hrs">${hoursRows(hours).map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.value)}</td></tr>`).join('')}</table></div>
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
  <form class="cw-form" id="cw-form">
    <textarea id="cw-text" rows="1" maxlength="1000" placeholder="Напишите сообщение…" aria-label="Сообщение"></textarea>
    <button type="submit" aria-label="Отправить">➤</button>
  </form>
</section>
<script type="application/json" id="cw-data">${JSON.stringify({
    hours: hoursRows(hours),
    address: contacts.address,
    ya: `https://yandex.ru/maps/?text=${mapQ}`,
    gis: `https://2gis.ru/lipetsk/search/${mapQ}`,
  }).replace(/</g, '\\u003c')}</script>
<script>
(function(){
  var D=JSON.parse(document.getElementById('cw-data').textContent);
  var $=function(id){return document.getElementById(id)};
  var btn=$('cw-btn'),panel=$('cw-panel'),log=$('cw-log'),form=$('cw-form'),text=$('cw-text'),dot=$('cw-dot'),sub=$('cw-sub'),
      who=$('cw-who'),nameI=$('cw-name'),phoneI=$('cw-phone');
  var seen={},lastId=0,cid=null,timer=null,lastAct=0,openP=false,unread=0,recent=false,waiting=false,hinted=false,hintTimer=null,
      chips=null,baseTitle=document.title;
  try{cid=localStorage.getItem('cw_cid')}catch(e){}
  try{lastAct=+localStorage.getItem('cw_act')||0}catch(e){}
  function save(){try{localStorage.setItem('cw_cid',cid);localStorage.setItem('cw_act',String(lastAct))}catch(e){}}
  function el(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n}
  function scroll(){log.scrollTop=log.scrollHeight}

  /* статус в шапке: «на связи» только если сейчас рабочее время и мастер недавно отвечал */
  function setStatus(){
    var on=window.__open&&recent;
    sub.textContent=on?'● Мастер на связи':(window.__open?'Отвечаем в рабочее время':'Сейчас не на связи, ответим в рабочее время');
    sub.className=on?'on':'';
  }
  function bubble(m){
    if(seen[m.id])return;seen[m.id]=1;
    var d=el('div','cw-msg '+(m.v?'me':'them'));
    if(!m.v)d.appendChild(el('span','cw-from','Мастер'));
    d.appendChild(el('span','',m.text));
    if(m.tick){var k=el('span','cw-tick','✓');k.title='Доставлено мастеру';d.appendChild(k)}
    log.appendChild(d);scroll();
  }
  function note(txt,links){
    var d=el('div','cw-msg them auto');d.appendChild(el('span','cw-from','Подсказка'));
    d.appendChild(el('span','',txt));
    (links||[]).forEach(function(l){var a=el('a','cw-link',l[0]);a.href=l[1];a.target='_blank';a.rel='noopener';d.appendChild(a)});
    log.appendChild(d);scroll();
  }
  function problem(txt){log.appendChild(el('div','cw-msg err',txt));scroll()}

  function hello(){
    var d=el('div','cw-msg them auto');d.appendChild(el('span','cw-from','Подсказка'));
    d.appendChild(el('span','',window.__open?'Здравствуйте! Напишите, чем помочь, или выберите вопрос ниже.':'Здравствуйте! Сейчас мы не на связи. Оставьте сообщение и номер телефона, ответим в рабочее время.'));
    log.appendChild(d);
    chips=el('div','cw-chips');
    [['Сколько стоит дубликат ключа?','send'],['График работы','hours'],['Как добраться','way']].forEach(function(c){
      var b=el('button','',c[0]);b.type='button';
      b.addEventListener('click',function(){
        removeChips();
        if(c[1]==='send'){text.value=c[0];form.requestSubmit()}
        else if(c[1]==='hours')note(D.hours.map(function(r){return r.label+': '+r.value}).join('\\n'));
        else note(D.address,[['Маршрут в Яндекс Картах',D.ya],['Открыть в 2ГИС',D.gis]]);
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
      note('Сейчас мы не на связи, ответим в рабочее время.'+(phoneI.value?'':' Оставьте телефон, чтобы мы могли перезвонить.'));
      if(!phoneI.value)who.open=true;
      return;
    }
    hintTimer=setTimeout(function(){
      if(!waiting||hinted)return;hinted=true;
      note('Мастер увидит сообщение и ответит, как освободится.'+(phoneI.value?'':' Оставьте телефон, и мы перезвоним.'));
      if(!phoneI.value)who.open=true;
    },150000);
  }

  form.addEventListener('submit',function(e){
    e.preventDefault();
    var t=text.value.trim();if(!t)return;
    var sendBtn=form.querySelector('button');sendBtn.disabled=true;removeChips();
    fetch('/api/chat/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cid:cid,text:t,name:nameI.value,phone:phoneI.value})})
    .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
    .then(function(x){
      if(!x.ok){problem(x.j.error||'Не удалось отправить. Позвоните нам.');return}
      cid=x.j.cid;lastAct=Date.now();save();
      bubble({id:x.j.id,v:1,text:t,tick:x.j.delivered});text.value='';text.style.height='auto';
      if(!x.j.delivered)problem('Сообщение сохранено, но пока не дошло до мастера. Позвоните нам, пожалуйста.');
      if(phoneI.value)who.open=false;
      armHint();schedule();
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
  /* статус «открыто / закрыто» по графику из админки; Липецк = МСК (UTC+3) */
  var H=JSON.parse(document.getElementById('hours-data').textContent);
  var m=new Date(Date.now()+3*3600e3),di=(m.getUTCDay()+6)%7,mins=m.getUTCHours()*60+m.getUTCMinutes();
  function tm(s){var p=s.split(':');return +p[0]*60+ +p[1]}
  function f(s){return s.replace(/^0/,'')}
  var d=H.days[di],text='',open=false;
  if(!d.off){
    var o=tm(d.open),c=tm(d.close);
    if(mins>=o&&mins<c){
      if(H.lunch.on&&mins>=tm(H.lunch.from)&&mins<tm(H.lunch.to))text='Сейчас перерыв, откроемся в '+f(H.lunch.to);
      else{open=true;text='Сейчас открыто до '+f(d.close)}
    }else if(mins<o)text='Сейчас закрыто. Откроемся сегодня в '+f(d.open);
  }
  if(!text){
    var nm=['в понедельник','во вторник','в среду','в четверг','в пятницу','в субботу','в воскресенье'];
    for(var i=1;i<=7;i++){var n=H.days[(di+i)%7];if(!n.off){text='Сейчас закрыто. Откроемся '+(i===1?'завтра':nm[(di+i)%7])+' в '+f(n.open);break}}
    if(!text)text='Сейчас закрыто';
  }
  var st=document.getElementById('state');st.textContent=(open?'● ':'○ ')+text;window.__open=open;

  /* счётчик фото на карточке товара */
  document.querySelectorAll('.gal').forEach(function(g){
    var t=g.querySelector('.gal-track'),c=g.querySelector('.gal-cnt');if(!c)return;
    t.addEventListener('scroll',function(){c.textContent=(Math.round(t.scrollLeft/t.clientWidth)+1)+'/'+t.children.length},{passive:true});
  });

  /* форма заявки */
  var lf=document.getElementById('lead-form');
  lf.addEventListener('submit',function(e){
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
  const from = services.filter((x) => x.price != null && x.mode !== 'none').map((x) => `${x.title.toLowerCase()} ${x.mode === 'from' ? 'от ' : ''}${x.price} ₽`).join(', ');
  const desc = `Дубликаты ключей и домофонных ключей, наклейка защитной плёнки на телефон, зарядки и USB-шнуры в Липецке. ${from ? `Цены: ${from}. ` : ''}${contacts.address}.`;
  const title = 'Дубликаты ключей, домофонные ключи, плёнка на телефон в Липецке | Золотой ключик';
  const head = `<link rel="canonical" href="${esc(origin)}/">
<meta property="og:type" content="website"><meta property="og:locale" content="ru_RU">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(origin)}/">
${jsonLd(origin, contacts, hours, services)}`;
  return shell(title, body, { desc, head });
}
