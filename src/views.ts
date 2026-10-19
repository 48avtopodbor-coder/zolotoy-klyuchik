import { CSS } from './styles';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number | null;
  show_price: number;
  image_key: string | null;
}

export const PHONE_TEL = '+79005964577';
export const PHONE_TEXT = '8 900 596-45-77';
const YA_MAP = 'https://yandex.ru/maps/?text=%D0%9B%D0%B8%D0%BF%D0%B5%D1%86%D0%BA%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%A5%D0%BE%D1%80%D0%BE%D1%88%D0%B0%D0%B2%D0%B8%D0%BD%D0%B0%2C%2023';
const GIS_MAP = 'https://2gis.ru/lipetsk/search/%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%A5%D0%BE%D1%80%D0%BE%D1%88%D0%B0%D0%B2%D0%B8%D0%BD%D0%B0%2023';

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

function shell(title: string, body: string, opts: { noindex?: boolean; desc?: string } = {}): string {
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
  const img = p.image_key
    ? `<img src="/img/${esc(p.image_key)}" alt="${esc(p.title)}" width="800" height="600" loading="lazy" decoding="async">`
    : `<div class="ph">фото скоро</div>`;
  const price = p.show_price && p.price != null
    ? `<div class="pr">${rub(p.price)}</div>`
    : `<div class="pr ask">Цену уточняйте по телефону</div>`;
  return `<article class="good">${img}<div class="t"><h3>${esc(p.title)}</h3>${p.description ? `<p>${esc(p.description)}</p>` : ''}${price}</div></article>`;
}

export function homePage(products: Product[]): string {
  const goods = products.length
    ? `<div class="goods">${products.map(productCard).join('')}</div>`
    : `<p class="empty">Скоро здесь появятся товары. Наличие подскажем по телефону.</p>`;
  const body = `
<div class="bar"><div class="wrap">
  <a class="logo" href="#top">Мастерская <b>Золотой ключик</b></a>
  <a class="tel" href="tel:${PHONE_TEL}">${PHONE_TEXT}</a>
</div></div>
<main id="top">
  <div class="hero"><div class="wrap">
    <div>
      <div class="lbl">Липецк · ул. Хорошавина, 23</div>
      <h1>Точная копия вашего ключа</h1>
      <p>Дубликаты обычных и домофонных ключей, защитная плёнка для телефона, зарядки и шнуры.</p>
      <div class="btns">
        <a class="btn gold" href="tel:${PHONE_TEL}">Позвонить</a>
        <a class="btn" href="https://wa.me/79005964577" target="_blank" rel="noopener">WhatsApp</a>
        <a class="btn" href="https://t.me/Vitaliy48ru" target="_blank" rel="noopener">Telegram</a>
      </div>
      <div class="state" id="state">Пн–Пт 9:00–17:00</div>
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

  <section style="padding-top:0"><div class="wrap">
    <div class="lbl">Видео</div><h2>Как мы работаем</h2>
    <div class="vrow">
      <div class="vbox" id="vbox"><button class="vplay" id="vplay" type="button"><i></i><span>Смотреть видео</span></button></div>
      <div><p>Короткий видеообзор нашей работы. Загружается только после нажатия.</p>
      <a class="btn" href="https://vk.ru/clip-236241268_456239028?c=1" target="_blank" rel="noopener">Открыть во ВКонтакте</a></div>
    </div>
  </div></section>
</main>

<footer id="contacts"><div class="wrap">
  <div class="info">
    <div><div class="lbl">Адрес</div><p>398027, г. Липецк,<br>ул. Хорошавина, д. 23</p>
      <p><a href="${YA_MAP}" target="_blank" rel="noopener">Маршрут в Яндекс Картах</a></p>
      <p><a href="${GIS_MAP}" target="_blank" rel="noopener">Открыть в 2ГИС</a></p></div>
    <div><div class="lbl">График</div>
      <table class="hrs"><tr><td>Пн–Пт</td><td>9:00–17:00</td></tr><tr><td>Сб, Вс</td><td>выходной</td></tr></table></div>
    <div><div class="lbl">Связь</div><p><a href="tel:${PHONE_TEL}">${PHONE_TEXT}</a></p><p><a href="https://wa.me/79005964577" target="_blank" rel="noopener">WhatsApp</a></p><p><a href="https://t.me/Vitaliy48ru" target="_blank" rel="noopener">Telegram: @Vitaliy48ru</a></p></div>
  </div>
  <div class="copy">© Мастерская «Золотой ключик», Липецк</div>
</div></footer>

<script>
(function(){
  var m=new Date(Date.now()+3*3600e3),d=m.getUTCDay(),h=m.getUTCHours()+m.getUTCMinutes()/60;
  var open=d>=1&&d<=5&&h>=9&&h<17;
  document.getElementById('state').textContent=open?'● Сейчас открыто до 17:00':'○ Сейчас закрыто. Пн–Пт 9:00–17:00';
  document.getElementById('vplay').addEventListener('click',function(){
    var f=document.createElement('iframe');
    f.src='https://vk.com/video_ext.php?oid=-236241268&id=456239028&hd=2';
    f.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';f.allowFullscreen=true;f.title='Видеообзор';
    document.getElementById('vbox').replaceChildren(f);
  });
})();
</script>`;
  return shell('Мастерская Золотой ключик, Липецк', body, {
    desc: 'Дубликаты ключей и домофонных ключей, наклейка защитной плёнки, зарядки и USB-шнуры. Липецк, ул. Хорошавина, 23.',
  });
}

/* ---------- админка ---------- */

const ADMIN_CSS = `
<style>
.adm{max-width:760px;margin:0 auto;padding:24px max(16px,env(safe-area-inset-left,0px)) 60px}
.adm h1{font-size:1.5rem;margin-bottom:18px}
.adm label{display:block;margin:14px 0 6px;font-weight:600}
.adm input[type=text],.adm input[type=password],.adm input[type=number],.adm textarea{width:100%;background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:12px;font:inherit}
.adm textarea{min-height:90px;resize:vertical}
.adm input:focus-visible,.adm textarea:focus-visible{outline:3px solid var(--gold);outline-offset:1px}
.adm .chk{display:flex;align-items:center;gap:10px;margin:14px 0}
.adm .chk input{width:22px;height:22px;accent-color:var(--gold)}
.adm .chk label{margin:0}
.adm button,.adm .btn{cursor:pointer;font:inherit;font-weight:600}
.adm .danger{background:transparent;color:#ff9b8a;border:1px solid #7a3a30;border-radius:6px;min-height:42px;padding:0 14px}
.adm .card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:24px}
.adm .item{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}
.adm .item:first-child{border-top:0}
.adm .item img,.adm .item .ph{width:72px;height:54px;object-fit:cover;border-radius:6px;background:var(--bg)}
.adm .item .ph{display:grid;place-items:center;font-size:.7rem;color:var(--muted)}
.adm .item b{display:block;overflow:hidden;text-overflow:ellipsis}
.adm .item small{color:var(--muted)}
.adm .acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.adm .acts .btn{min-height:42px;padding:0 14px}
.adm .top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:18px}
.adm .msg{background:#12402a;border:1px solid #2d7a53;color:#c8f1da;border-radius:6px;padding:10px 14px;margin-bottom:16px}
.adm .err{background:#4a1d17;border:1px solid #8a3a30;color:#ffd5cc;border-radius:6px;padding:10px 14px;margin-bottom:16px}
.adm .prev[hidden]{display:none}
.adm .prev{max-width:240px;margin-top:10px;border-radius:8px;display:block}
.adm .hint{color:var(--muted);font-size:.88rem;margin-top:4px}
@media (max-width:520px){.adm .item{grid-template-columns:60px minmax(0,1fr)}.adm .acts{grid-column:1/-1;justify-content:flex-start}}
</style>`;

function adminShell(title: string, inner: string): string {
  return shell(title, `${ADMIN_CSS}<div class="adm">${inner}</div>`, { noindex: true });
}

export function loginPage(error?: string): string {
  return adminShell('Вход в админку', `
<h1>Вход в админку</h1>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<form method="post" action="/admin/login" class="card">
  <label for="pw">Пароль</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
  <p><button class="btn gold" type="submit" style="margin-top:16px;border:0">Войти</button></p>
</form>`);
}

const PRODUCT_FORM_JS = `
<script>
(function(){
  var form=document.getElementById('pf'),file=document.getElementById('image'),prev=document.getElementById('prev'),err=document.getElementById('formerr');
  function resize(f){return new Promise(function(res,rej){
    var img=new Image(),u=URL.createObjectURL(f);
    img.onload=function(){
      var max=1000,s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
      c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);
      c.toBlob(function(b){b?res(b):rej(new Error('Не удалось обработать фото'))},'image/webp',0.82);
    };
    img.onerror=function(){rej(new Error('Это не картинка'))};img.src=u;
  })}
  file.addEventListener('change',function(){
    var f=file.files[0];if(!f)return;prev.src=URL.createObjectURL(f);prev.hidden=false;
  });
  form.addEventListener('submit',function(e){
    e.preventDefault();err.hidden=true;
    var btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Сохраняю…';
    var fd=new FormData(form),f=file.files[0];
    (f?resize(f).then(function(b){fd.set('image',b,'photo.webp')}):Promise.resolve())
    .then(function(){return fetch(form.action,{method:'POST',body:fd,credentials:'same-origin',redirect:'follow'})})
    .then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(t||'Ошибка сохранения')});location.href='/admin?saved=1'})
    .catch(function(x){err.textContent=x.message;err.hidden=false;btn.disabled=false;btn.textContent='Сохранить'});
  });
})();
</script>`;

export function productFormPage(p?: Product): string {
  const editing = !!p;
  return adminShell(editing ? 'Редактирование товара' : 'Новый товар', `
<div class="top"><h1>${editing ? 'Редактирование товара' : 'Новый товар'}</h1><a class="btn" href="/admin">← К списку</a></div>
<form id="pf" class="card" method="post" action="${editing ? `/admin/products/${p!.id}` : '/admin/products'}" enctype="multipart/form-data">
  <div class="err" id="formerr" hidden></div>
  <label for="title">Название</label>
  <input id="title" name="title" type="text" maxlength="120" required value="${esc(p?.title ?? '')}">
  <label for="description">Описание (необязательно)</label>
  <textarea id="description" name="description" maxlength="600">${esc(p?.description ?? '')}</textarea>
  <label for="price">Цена, ₽</label>
  <input id="price" name="price" type="number" min="0" max="10000000" step="1" inputmode="numeric" value="${p?.price ?? ''}">
  <div class="chk"><input id="show_price" name="show_price" type="checkbox" value="1" ${!p || p.show_price ? 'checked' : ''}><label for="show_price">Показывать цену на сайте</label></div>
  <div class="hint">Если галочка снята, на сайте будет написано «Цену уточняйте по телефону».</div>
  <label for="image">Фото${editing && p!.image_key ? ' (выберите новое, чтобы заменить)' : ''}</label>
  <input id="image" name="image" type="file" accept="image/*">
  <img id="prev" class="prev" alt="Предпросмотр" ${editing && p!.image_key ? `src="/img/${esc(p!.image_key)}"` : 'hidden'}>
  <div class="hint">Фото автоматически уменьшится, чтобы сайт открывался быстро.</div>
  <p><button class="btn gold" type="submit" style="margin-top:18px;border:0">Сохранить</button></p>
</form>${PRODUCT_FORM_JS}`);
}

export function adminListPage(products: Product[], flash?: string): string {
  const rows = products.length
    ? products.map((p) => `
<div class="item">
  ${p.image_key ? `<img src="/img/${esc(p.image_key)}" alt="" loading="lazy">` : '<div class="ph">нет фото</div>'}
  <div><b>${esc(p.title)}</b><small>${p.price != null ? rub(p.price) : 'без цены'}${p.price != null ? (p.show_price ? ' · цена показана' : ' · цена скрыта') : ''}</small></div>
  <div class="acts">
    <a class="btn" href="/admin/products/${p.id}/edit">Изменить</a>
    <form method="post" action="/admin/products/${p.id}/delete" onsubmit="return confirm('Удалить этот товар?')"><button class="danger" type="submit">Удалить</button></form>
  </div>
</div>`).join('')
    : '<p class="empty">Товаров пока нет. Добавьте первый.</p>';
  return adminShell('Админка', `
<div class="top"><h1>Товары</h1>
  <div class="acts"><a class="btn" href="/" target="_blank">Сайт</a>
  <form method="post" action="/admin/logout"><button class="btn" type="submit">Выйти</button></form></div></div>
${flash ? `<div class="msg">${esc(flash)}</div>` : ''}
<p><a class="btn gold" href="/admin/products/new">+ Добавить товар</a></p>
<div class="card" style="margin-top:18px">${rows}</div>`);
}
