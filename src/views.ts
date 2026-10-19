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

export function shell(title: string, body: string, opts: { noindex?: boolean; desc?: string } = {}): string {
  return `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
${opts.desc ? `<meta name="description" content="${esc(opts.desc)}">` : ''}
${opts.noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}
<meta name="theme-color" content="#0a1824">
<style>${CSS}</style>
</head><body>${body}</body></html>`;
}

function productCard(p: Product): string {
  const photos = p.images.length
    ? `<div class="gal"><div class="gal-track">${p.images
        .map((k, i) => `<img src="/img/${esc(k)}" alt="${esc(p.title)}${p.images.length > 1 ? `, фото ${i + 1}` : ''}" width="800" height="600" loading="lazy" decoding="async">`)
        .join('')}</div>${p.images.length > 1 ? `<span class="gal-cnt">1/${p.images.length}</span>` : ''}</div>`
    : `<div class="ph">фото скоро</div>`;
  const badges = `${p.is_sale ? '<span class="badge sale">Акция</span>' : ''}${p.in_stock ? '' : '<span class="badge out">Нет в наличии</span>'}`;
  const price = p.show_price && p.price != null
    ? `<div class="pr">${p.is_sale && p.old_price != null && p.old_price > p.price ? `<s>${rub(p.old_price)}</s> ` : ''}${rub(p.price)}</div>`
    : `<div class="pr ask">Цену уточняйте по телефону</div>`;
  return `<article class="good${p.in_stock ? '' : ' is-out'}"><div class="gal-wrap">${photos}${badges}</div><div class="t"><h3>${esc(p.title)}</h3>${p.description ? `<p>${esc(p.description)}</p>` : ''}${price}</div></article>`;
}

function videoCard(v: Video, i: number): string {
  const cover = v.cover_key ? `<img src="/img/${esc(v.cover_key)}" alt="" loading="lazy" width="360" height="640">` : '';
  return `<div class="vcard"><div class="vbox" data-oid="${esc(v.oid)}" data-vid="${esc(v.vid)}"><button class="vplay" type="button" aria-label="Смотреть видео ${i + 1}">${cover}<i></i></button></div><a class="vlink" href="${esc(v.url)}" target="_blank" rel="noopener">Открыть во ВКонтакте</a></div>`;
}

export function homePage(d: { products: Product[]; videos: Video[]; hours: Hours; contacts: Contacts }): string {
  const { products, videos, hours, contacts } = d;
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
        ${main ? `<a class="btn gold" href="tel:${phoneTel(main)}">Позвонить</a>` : ''}
        ${wa ? `<a class="btn" href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        ${tg ? `<a class="btn" href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram</a>` : ''}
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
    <div class="rows">
      <div class="row"><span class="lbl">Ключи</span><div><h3>Дубликаты ключей</h3><p>Копии ключей от квартиры, замков и почтовых ящиков.</p></div></div>
      <div class="row"><span class="lbl">Домофон</span><div><h3>Домофонные ключи</h3><p>Копия таблетки для подъезда с записью нужного кода.</p></div></div>
      <div class="row"><span class="lbl">Телефон</span><div><h3>Наклейка защитной плёнки</h3><p>Ровно, без пузырей, на плёнку или защитное стекло.</p></div></div>
    </div>
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
      ${wa ? `<p><a href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a></p>` : ''}
      ${tg ? `<p><a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram: @${esc(tg)}</a></p>` : ''}</div>
  </div>
  <div class="copy">© Мастерская «Золотой ключик», Липецк</div>
</div></footer>

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
  var st=document.getElementById('state');st.textContent=(open?'● ':'○ ')+text;

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
    function say(t,ok){s.textContent=t;s.hidden=false;s.className='lf-status '+(ok?'ok':'bad')}
    var fd=new FormData(lf),data={};fd.forEach(function(v,k){data[k]=v});
    btn.disabled=true;btn.textContent='Отправляю…';
    fetch('/api/lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)})
    .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
    .then(function(x){
      if(x.ok){say('Спасибо! Заявка отправлена, мы скоро перезвоним.',true);lf.reset()}
      else say(x.j.error||'Не удалось отправить. Позвоните нам.',false);
    })
    .catch(function(){say('Нет связи. Позвоните нам.',false)})
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
    var w=card.getBoundingClientRect().width+14,max=track.scrollWidth-track.clientWidth;
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
  return shell('Мастерская Золотой ключик, Липецк', body, {
    desc: 'Дубликаты ключей и домофонных ключей, наклейка защитной плёнки, зарядки и USB-шнуры. Липецк.',
  });
}
