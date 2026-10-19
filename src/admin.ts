import { esc, rub, shell, SERVICE_ICONS, type Service } from './views';
import { DAY_LONG, mskToday, ruDate, type Contacts, type Hours, type Site, type SpecialDay } from './settings';
import { SUN_LIB, type ThemeCfg } from './theme';

export interface AdminProduct {
  id: number; title: string; description: string; price: number | null; old_price: number | null;
  show_price: number; is_sale: number; in_stock: number; images: string[];
}
export interface AdminVideo { id: number; url: string; cover_key: string | null }
export interface Lead { id: number; name: string; phone: string; message: string; sent: number; created_at: number }

const TABS: [string, string, string][] = [
  ['products', 'Товары', '/admin/products'],
  ['services', 'Услуги и цены', '/admin/services'],
  ['site', 'Главная страница', '/admin/site'],
  ['theme', 'Выбор темы', '/admin/theme'],
  ['videos', 'Видео', '/admin/videos'],
  ['hours', 'Часы работы', '/admin/hours'],
  ['contacts', 'Контакты', '/admin/contacts'],
  ['chats', 'Чаты', '/admin/chats'],
  ['leads', 'Заявки', '/admin/leads'],
  ['password', 'Пароль', '/admin/password'],
];

const ADMIN_CSS = `<style>
.admin{display:grid;grid-template-columns:13.125rem minmax(0,1fr);min-height:100vh}
.side{background:#0a1824;border-right:1px solid var(--line);padding:1.125rem 0.75rem;position:sticky;top:0;align-self:start;height:100vh;display:flex;flex-direction:column;gap:0.25rem}
.side .brand{font-weight:700;padding:0.375rem 0.625rem 0.875rem}.side .brand b{color:var(--gold)}
.side a,.side button{display:block;width:100%;text-align:left;padding:0.6875rem 0.75rem;border-radius:0.375rem;text-decoration:none;color:var(--fg);background:none;border:0;font:inherit;cursor:pointer}
.side a:hover,.side button:hover{background:var(--panel)}
.side a[aria-current=page]{background:var(--panel);color:var(--gold);font-weight:700}
.side .sp{flex:1}
.main{padding:1.5rem max(1rem,env(safe-area-inset-right,0px)) 3.75rem 1.5rem;max-width:51.25rem;width:100%}
.main h1{font-size:1.5rem;margin-bottom:0.375rem}
.main .sub{color:var(--muted);margin:0 0 1.25rem}
@media (max-width:47.5rem){
  .admin{grid-template-columns:1fr}
  .side{position:sticky;top:env(safe-area-inset-top,0px);height:auto;flex-direction:row;overflow-x:auto;padding:0.5rem;border-right:0;border-bottom:1px solid var(--line);z-index:20;gap:2px}
  .side .brand,.side .sp{display:none}
  .side a,.side button{width:auto;white-space:nowrap;padding:0.625rem 0.75rem}
  .main{padding:1.125rem max(1rem,env(safe-area-inset-left,0px)) 3.75rem}
}
.f label{display:block;margin:0.875rem 0 0.375rem;font-weight:600}
.f input[type=text],.f input[type=password],.f input[type=number],.f input[type=url],.f input[type=time],.f textarea{width:100%;background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:0.375rem;padding:0.75rem;font:inherit}
.f textarea{min-height:5.625rem;resize:vertical}
.f input:focus-visible,.f textarea:focus-visible,.f select:focus-visible{outline:3px solid var(--gold);outline-offset:1px}
.f .chk{display:flex;align-items:center;gap:0.625rem;margin:0.75rem 0}
.f .chk input{width:1.375rem;height:1.375rem;accent-color:var(--gold);flex:none}
.f .chk label{margin:0;font-weight:500}
.f .row2{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;align-items:end}
.hint{color:var(--muted);font-size:.88rem;margin-top:0.25rem}
.card{background:var(--panel);border:1px solid var(--line);border-radius:0.625rem;padding:1.125rem;margin-bottom:1.375rem}
.abtn{display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;padding:0 1rem;border-radius:0.375rem;border:1px solid var(--line);background:none;color:var(--fg);text-decoration:none;font:inherit;font-weight:600;cursor:pointer}
.abtn.gold{background:var(--gold);color:var(--gold-ink);border-color:var(--gold)}
.abtn.danger{color:#ff9b8a;border-color:#7a3a30}
.abtn.sm{min-height:2.375rem;padding:0 0.75rem;font-size:.9rem}
.abtn:disabled{opacity:.6;cursor:default}
.acts{display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center}
.msg{background:#12402a;border:1px solid #2d7a53;color:#c8f1da;border-radius:0.375rem;padding:0.625rem 0.875rem;margin-bottom:1rem}
.err{background:#4a1d17;border:1px solid #8a3a30;color:#ffd5cc;border-radius:0.375rem;padding:0.625rem 0.875rem;margin-bottom:1rem}
.item{display:grid;grid-template-columns:4.5rem minmax(0,1fr) auto;gap:0.875rem;align-items:center;padding:0.75rem 0;border-top:1px solid var(--line)}
.item:first-child{border-top:0}
.item img,.item .nophoto{width:4.5rem;height:3.375rem;object-fit:cover;border-radius:0.375rem;background:var(--bg)}
.item .nophoto{display:grid;place-items:center;font-size:.7rem;color:var(--muted)}
.item b{display:block;overflow-wrap:anywhere}.item small{color:var(--muted)}
.tag{display:inline-block;font-size:.72rem;font-family:var(--mono);padding:2px 0.4375rem;border-radius:0.25rem;background:var(--gold);color:var(--gold-ink);margin-left:0.375rem;vertical-align:middle}
.tag.grey{background:#3a4650;color:#dfe6ec}
@media (max-width:32.5rem){.item{grid-template-columns:3.75rem minmax(0,1fr)}.item .acts{grid-column:1/-1}}
.photos{display:flex;flex-wrap:wrap;gap:0.75rem;margin:0.5rem 0}
.pitem{width:8.25rem;background:var(--bg);border:1px solid var(--line);border-radius:0.5rem;padding:0.5rem;display:flex;flex-direction:column;gap:0.375rem;font-size:.85rem}
.pitem img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:0.3125rem}
.pitem label{margin:0!important;font-weight:500!important;display:flex;gap:0.375rem;align-items:center}
.pitem input[type=radio]{accent-color:var(--gold)}
.dayrow{display:grid;grid-template-columns:8.125rem auto 1fr 1fr;gap:0.625rem;align-items:center;padding:0.625rem 0;border-top:1px solid var(--line)}
.dayrow:first-child{border-top:0}
.dayrow .chk{margin:0}
@media (max-width:35rem){.dayrow{grid-template-columns:1fr 1fr}.dayrow>b{grid-column:1/-1}}
.vitem{grid-template-columns:4.5rem minmax(0,1fr) auto}
.vextra{grid-column:1/-1;display:flex;gap:0.625rem;flex-wrap:wrap;align-items:center}
.vextra form{margin:0}
.vcover{display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center}
.vcover input[type=file]{max-width:14.375rem;font-size:.85rem}
.lead-item{border-top:1px solid var(--line);padding:0.875rem 0}.lead-item:first-child{border-top:0}
.lead-item .meta{color:var(--muted);font-size:.85rem}
.lead-item p{margin:0.375rem 0 0;overflow-wrap:anywhere}
@media (prefers-reduced-motion:no-preference){.abtn{transition:background-color .18s ease,color .18s ease,border-color .18s ease}}
@media (hover:hover){
  .abtn:not(.gold):not(.danger):hover{border-color:var(--gold);color:var(--gold)}
  .abtn.gold:hover{background:#f2c867;border-color:#f2c867}
  .abtn.danger:hover{background:rgba(255,155,138,.12);border-color:#ff9b8a}
}
</style>`;

const IMG_JS = `<script>
(function(){
  function resize(f,max){return new Promise(function(res,rej){
    var img=new Image(),u=URL.createObjectURL(f);
    img.onload=function(){
      var s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
      c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);
      c.toBlob(function(b){b?res({b:b,w:c.width,h:c.height}):rej(new Error('Не удалось обработать фото'))},'image/webp',0.82);
    };
    img.onerror=function(){rej(new Error('Это не картинка'))};img.src=u;
  })}
  document.querySelectorAll('form[data-img]').forEach(function(form){
    var err=form.querySelector('.err'),btn=form.querySelector('button[type=submit]'),label=btn.textContent;
    form.querySelectorAll('input[type=file]').forEach(function(inp){
      inp.addEventListener('change',function(){
        var box=form.querySelector('[data-prev="'+inp.name+'"]');if(!box)return;box.replaceChildren();
        Array.prototype.forEach.call(inp.files,function(f){var i=document.createElement('img');i.src=URL.createObjectURL(f);i.className='prev';i.style.cssText='width:6rem;height:4.5rem;object-fit:cover;border-radius:0.375rem;margin:0.375rem 0.375rem 0 0';box.appendChild(i)});
      });
    });
    form.querySelectorAll('[data-rm]').forEach(function(b){b.addEventListener('click',function(){b.closest('.pitem').remove()})});
    form.addEventListener('submit',function(e){
      e.preventDefault();err.hidden=true;btn.disabled=true;btn.textContent='Сохраняю…';
      var fd=new FormData(form),jobs=[];
      form.querySelectorAll('input[type=file]').forEach(function(inp){
        fd.delete(inp.name);
        Array.prototype.forEach.call(inp.files,function(f){jobs.push(resize(f,+(form.dataset.max||1000)).then(function(r){fd.append(inp.name,r.b,'photo.webp');fd.append(inp.name+'_wh',r.w+'x'+r.h)}))});
      });
      Promise.all(jobs)
      .then(function(){return fetch(form.action,{method:'POST',body:fd,credentials:'same-origin'})})
      .then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(t||'Ошибка сохранения')});location.href=form.dataset.next})
      .catch(function(x){err.textContent=x.message;err.hidden=false;err.scrollIntoView({block:'center'});btn.disabled=false;btn.textContent=label});
    });
  });
})();
</script>`;

function layout(tab: string, title: string, inner: string, flash?: string, js = ''): string {
  const nav = TABS.map(([k, label, href]) => `<a href="${href}"${k === tab ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return shell(`${title}, админка`, `${ADMIN_CSS}<div class="admin">
<nav class="side" aria-label="Разделы админки"><div class="brand">Золотой <b>ключик</b></div>${nav}<span class="sp"></span>
<a href="/" target="_blank" rel="noopener">Открыть сайт ↗</a>
<form method="post" action="/admin/logout"><button type="submit">Выйти</button></form></nav>
<main class="main"><h1>${esc(title)}</h1>${flash ? `<div class="msg" role="status">${esc(flash)}</div>` : ''}${inner}</main></div>${js}`, { noindex: true });
}

export const flashText = (q: Record<string, string | undefined>): string | undefined =>
  q.saved ? 'Сохранено' : q.deleted ? 'Удалено' : q.added ? 'Добавлено' : undefined;

export function loginPage(error?: string): string {
  return shell('Вход в админку', `${ADMIN_CSS}<div class="main f" style="margin:0 auto;padding-top:3rem">
<h1>Вход в админку</h1>${error ? `<div class="err">${esc(error)}</div>` : ''}
<form method="post" action="/admin/login" class="card">
  <label for="pw">Пароль</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
  <p><button class="abtn gold" type="submit" style="margin-top:1rem">Войти</button></p>
</form></div>`, { noindex: true });
}

/* ---------- товары ---------- */

export function productsPage(list: AdminProduct[], flash?: string): string {
  const rows = list.length ? list.map((p) => `<div class="item">
  ${p.images[0] ? `<img src="/img/${esc(p.images[0])}" alt="" loading="lazy">` : '<div class="nophoto">нет фото</div>'}
  <div><b>${esc(p.title)}${p.is_sale ? '<span class="tag">акция</span>' : ''}${p.in_stock ? '' : '<span class="tag grey">нет в наличии</span>'}</b>
  <small>${p.price != null ? rub(p.price) : 'без цены'}${p.price != null ? (p.show_price ? ' · цена показана' : ' · цена скрыта') : ''} · фото: ${p.images.length}</small></div>
  <div class="acts"><a class="abtn sm" href="/admin/products/${p.id}/edit">Изменить</a>
  <form method="post" action="/admin/products/${p.id}/delete" onsubmit="return confirm('Удалить этот товар?')"><button class="abtn sm danger" type="submit">Удалить</button></form></div>
</div>`).join('') : '<p class="hint">Товаров пока нет. Добавьте первый.</p>';
  return layout('products', 'Товары', `<p><a class="abtn gold" href="/admin/products/new">+ Добавить товар</a></p><div class="card">${rows}</div>`, flash);
}

export function productFormPage(p?: AdminProduct): string {
  const edit = !!p;
  const photos = p?.images.length
    ? `<div class="photos">${p.images.map((k, i) => `<div class="pitem"><img src="/img/${esc(k)}" alt="">
<input type="hidden" name="keep" value="${esc(k)}"><label><input type="radio" name="main" value="${esc(k)}"${i === 0 ? ' checked' : ''}> главное</label>
<button class="abtn sm danger" type="button" data-rm>Убрать</button></div>`).join('')}</div>` : '';
  return layout('products', edit ? 'Редактирование товара' : 'Новый товар', `
<p><a class="abtn sm" href="/admin/products">← К списку</a></p>
<form class="card f" method="post" action="${edit ? `/admin/products/${p!.id}` : '/admin/products'}" enctype="multipart/form-data" data-img data-next="/admin/products?saved=1">
  <div class="err" hidden></div>
  <label for="title">Название</label>
  <input id="title" name="title" type="text" maxlength="120" required value="${esc(p?.title ?? '')}">
  <label for="description">Описание (необязательно)</label>
  <textarea id="description" name="description" maxlength="600">${esc(p?.description ?? '')}</textarea>
  <div class="row2">
    <div><label for="price">Цена, ₽</label><input id="price" name="price" type="number" min="0" max="10000000" step="1" inputmode="numeric" value="${p?.price ?? ''}"></div>
    <div><label for="old_price">Старая цена, ₽</label><input id="old_price" name="old_price" type="number" min="0" max="10000000" step="1" inputmode="numeric" value="${p?.old_price ?? ''}"></div>
  </div>
  <div class="chk"><input id="show_price" name="show_price" type="checkbox" value="1"${!p || p.show_price ? ' checked' : ''}><label for="show_price">Показывать цену на сайте</label></div>
  <div class="chk"><input id="is_sale" name="is_sale" type="checkbox" value="1"${p?.is_sale ? ' checked' : ''}><label for="is_sale">Акция</label></div>
  <div class="hint" style="margin-top:-6px">Для акции на карточке будет метка, старая цена зачёркнута, а сам товар встанет в начало списка.</div>
  <div class="chk"><input id="in_stock" name="in_stock" type="checkbox" value="1"${!p || p.in_stock ? ' checked' : ''}><label for="in_stock">Есть в наличии</label></div>
  <label>Фото (до 6)</label>
  ${photos}
  <input id="images" name="images" type="file" accept="image/*" multiple>
  <div data-prev="images"></div>
  <div class="hint">Можно выбрать несколько фото сразу. Главное фото показывается первым. Фото автоматически уменьшаются, чтобы сайт открывался быстро.</div>
  <p><button class="abtn gold" type="submit" style="margin-top:1.125rem">Сохранить</button></p>
</form>`, undefined, IMG_JS);
}

/* ---------- видео ---------- */

export function videosPage(list: AdminVideo[], flash?: string, error?: string): string {
  const rows = list.length ? list.map((v, i) => `<div class="item vitem">
  ${v.cover_key ? `<img src="/img/${esc(v.cover_key)}" alt="" loading="lazy">` : '<div class="nophoto">без обложки</div>'}
  <div><b>Видео ${i + 1}</b><small><a href="${esc(v.url)}" target="_blank" rel="noopener" style="color:var(--gold)">${esc(v.url.replace(/^https?:\/\//, '').slice(0, 44))}</a></small></div>
  <div class="acts">
    <form method="post" action="/admin/videos/${v.id}/move"><input type="hidden" name="dir" value="up"><button class="abtn sm" type="submit"${i === 0 ? ' disabled' : ''} aria-label="Выше">↑</button></form>
    <form method="post" action="/admin/videos/${v.id}/move"><input type="hidden" name="dir" value="down"><button class="abtn sm" type="submit"${i === list.length - 1 ? ' disabled' : ''} aria-label="Ниже">↓</button></form>
    <form method="post" action="/admin/videos/${v.id}/delete" onsubmit="return confirm('Убрать это видео с сайта?')"><button class="abtn sm danger" type="submit">Убрать</button></form>
  </div>
  <div class="vextra">
    <form method="post" action="/admin/videos/${v.id}/cover-auto"><button class="abtn sm" type="submit">Взять обложку из ВК</button></form>
    <form class="f vcover" method="post" action="/admin/videos/${v.id}/cover" enctype="multipart/form-data" data-img data-next="/admin/videos?saved=1">
      <span class="err" hidden></span>
      <input name="cover" type="file" accept="image/*" required aria-label="Своя обложка для видео ${i + 1}">
      <button class="abtn sm" type="submit">Загрузить свою</button>
    </form>
  </div></div>`).join('') : '<p class="hint">Видео пока нет.</p>';
  return layout('videos', 'Видео', `
<p class="sub">Ролики показываются на главной каруселью в том порядке, как здесь. Ссылку берите из ВКонтакте (клип или видео). Обложку можно взять из ВК автоматически или загрузить свою (лучше вертикальную, как клип).</p>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<div class="card">${rows}</div>
<form class="card f" method="post" action="/admin/videos" enctype="multipart/form-data" data-img data-next="/admin/videos?added=1">
  <div class="err" hidden></div>
  <label for="url">Новое видео: ссылка</label>
  <input id="url" name="url" type="url" required placeholder="https://vk.ru/clip-236241268_456239028">
  <label for="cover">Обложка (необязательно)</label>
  <input id="cover" name="cover" type="file" accept="image/*">
  <div data-prev="cover"></div>
  <div class="hint">Если свою обложку не выбрать, сайт попробует взять её из ВК сам.</div>
  <p><button class="abtn gold" type="submit" style="margin-top:0.875rem">Добавить видео</button></p>
</form>`, flash, IMG_JS);
}

/* ---------- часы, контакты, пароль, заявки ---------- */

export function hoursPage(h: Hours, special: SpecialDay[], flash?: string, error?: string): string {
  const rows = h.days.map((d, i) => `<div class="dayrow"><b>${DAY_LONG[i]}</b>
  <div class="chk"><input id="off${i}" name="off${i}" type="checkbox" value="1"${d.off ? ' checked' : ''}><label for="off${i}">выходной</label></div>
  <div><label class="hint" for="o${i}" style="margin:0">с</label><input id="o${i}" name="open${i}" type="time" value="${esc(d.open)}"></div>
  <div><label class="hint" for="c${i}" style="margin:0">до</label><input id="c${i}" name="close${i}" type="time" value="${esc(d.close)}"></div></div>`).join('');
  return layout('hours', 'Часы работы', `
<p class="sub">График показывается в подвале сайта и в статусе «Сейчас открыто / закрыто».</p>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<form class="card f" method="post" action="/admin/hours">${rows}
  <div class="chk" style="margin-top:1rem"><input id="lunch_on" name="lunch_on" type="checkbox" value="1"${h.lunch.on ? ' checked' : ''}><label for="lunch_on">Есть обеденный перерыв (во все рабочие дни)</label></div>
  <div class="row2"><div><label for="lf">Обед с</label><input id="lf" name="lunch_from" type="time" value="${esc(h.lunch.from)}"></div>
  <div><label for="lt">Обед до</label><input id="lt" name="lunch_to" type="time" value="${esc(h.lunch.to)}"></div></div>
  <p><button class="abtn gold" type="submit" style="margin-top:1.125rem">Сохранить</button></p>
</form>
${specialBlock(special)}`, flash);
}

const KIND_LABEL: Record<string, string> = { closed: 'Выходной', short: 'Сокращённый день', custom: 'Особые часы' };

function specialBlock(special: SpecialDay[]): string {
  const today = mskToday();
  const upcoming = special.filter((x) => x.date >= today);
  const past = special.length - upcoming.length;
  const rows = upcoming.length ? upcoming.map((x) => `<div class="item sp-item">
  <div><b>${esc(ruDate(x.date))}</b><small>${esc(KIND_LABEL[x.kind] ?? x.kind)}${x.kind !== 'closed' && x.open ? `: ${esc(x.open)}–${esc(x.close ?? '')}` : ''}${x.note ? ` · ${esc(x.note)}` : ''}</small></div>
  <form method="post" action="/admin/special/${x.date}/delete"><button class="abtn sm danger" type="submit">Удалить</button></form></div>`).join('')
    : '<p class="hint">Особых дней пока нет.</p>';
  return `<h2 style="font-size:1.15rem;margin:1.75rem 0 .5rem">Праздники и особые дни</h2>
<p class="sub">В такие дни сайт показывает «выходной» или другие часы и сам считает, когда откроетесь. За неделю до особого дня наверху сайта появляется плашка.</p>
<form class="card" method="post" action="/admin/hours/holidays"><b>Праздники РФ</b>
  <p class="hint">Добавит нерабочие дни по производственному календарю РФ: ноябрь и декабрь 2026 года и весь 2027 год. Сокращённые предпраздничные дни 2027 года я пока не заполнял, их стоит сверить с официальным календарём и добавить вручную. Если правительство перенесёт выходные, поменяйте дни здесь.</p>
  <button class="abtn" type="submit">Добавить праздники РФ</button></form>
<div class="card">${rows}${past ? `<p class="hint" style="margin-top:.75rem">Прошедших дат: ${past} (на сайте не показываются).</p>` : ''}</div>
<form class="card f" method="post" action="/admin/special">
  <b>Добавить особый день</b>
  <div class="row2"><div><label for="sp-date">Дата</label><input id="sp-date" name="date" type="date" required></div>
  <div><label for="sp-kind">Что в этот день</label><select id="sp-kind" name="kind" class="sel"><option value="closed">Выходной</option><option value="short">Сокращённый день</option><option value="custom">Особые часы</option></select></div></div>
  <div class="row2"><div><label for="sp-o">Открытие (если не выходной)</label><input id="sp-o" name="open" type="time" value="09:00"></div>
  <div><label for="sp-c">Закрытие</label><input id="sp-c" name="close" type="time" value="16:00"></div></div>
  <label for="sp-note">Пояснение (необязательно)</label><input id="sp-note" name="note" type="text" maxlength="120" placeholder="Например: День народного единства">
  <p><button class="abtn gold" type="submit" style="margin-top:.9rem">Добавить день</button></p>
  <p class="hint">Если на эту дату уже есть запись, она заменится.</p>
</form>
<style>.sp-item{grid-template-columns:minmax(0,1fr) auto}.sel{width:100%;background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:.375rem;padding:.75rem;font:inherit}</style>`;
}

export function contactsPage(c: Contacts, flash?: string, error?: string): string {
  return layout('contacts', 'Контакты', `
${error ? `<div class="err">${esc(error)}</div>` : ''}
<form class="card f" method="post" action="/admin/contacts">
  <label for="phones">Телефоны (по одному в строке, первый идёт в шапку сайта)</label>
  <textarea id="phones" name="phones" required>${esc(c.phones.join('\n'))}</textarea>
  <label for="whatsapp">Номер для WhatsApp (если пусто, используется первый телефон)</label>
  <input id="whatsapp" name="whatsapp" type="text" inputmode="tel" value="${esc(c.whatsapp)}">
  <label for="telegram">Telegram (логин без @, если пусто, кнопка не показывается)</label>
  <input id="telegram" name="telegram" type="text" value="${esc(c.telegram)}" maxlength="64">
  <label for="address">Адрес</label>
  <textarea id="address" name="address" required maxlength="200">${esc(c.address)}</textarea>
  <div class="hint">По адресу строятся ссылки на Яндекс Карты и 2ГИС.</div>
  <p><button class="abtn gold" type="submit" style="margin-top:1.125rem">Сохранить</button></p>
</form>`, flash);
}

export function passwordPage(flash?: string, error?: string): string {
  return layout('password', 'Пароль', `
<p class="sub">Один пароль для входа в админку. Минимум 10 символов. Лучше несколько слов подряд, например «ключ-липецк-синий-4821».</p>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<form class="card f" method="post" action="/admin/password" autocomplete="off">
  <label for="cur">Текущий пароль</label><input id="cur" name="current" type="password" autocomplete="current-password" required>
  <label for="new">Новый пароль</label><input id="new" name="next" type="password" autocomplete="new-password" minlength="10" required>
  <label for="rep">Новый пароль ещё раз</label><input id="rep" name="repeat" type="password" autocomplete="new-password" minlength="10" required>
  <p><button class="abtn gold" type="submit" style="margin-top:1.125rem">Сменить пароль</button></p>
</form>`, flash);
}

export function leadsPage(list: Lead[], flash?: string, error?: string): string {
  const fmt = (t: number) => new Date((t + 3 * 3600) * 1000).toISOString().slice(0, 16).replace('T', ' ');
  const rows = list.length ? list.map((l) => `<div class="lead-item">
  <div class="meta">${fmt(l.created_at)} (МСК)${l.sent ? '' : ' · <span style="color:#ff9b8a">не ушла в Telegram</span>'}</div>
  <p><b>${esc(l.name)}</b> · <a href="tel:${esc(l.phone.replace(/[^\d+]/g, ''))}" style="color:var(--gold)">${esc(l.phone)}</a></p>
  ${l.message ? `<p>${esc(l.message)}</p>` : ''}
  <form method="post" action="/admin/leads/${l.id}/delete" onsubmit="return confirm('Удалить заявку?')" style="margin-top:0.5rem"><button class="abtn sm danger" type="submit">Удалить</button></form>
</div>`).join('') : '<p class="hint">Заявок пока нет.</p>';
  return layout('leads', 'Заявки', `<p class="sub">Последние 100 заявок с сайта. Новые также приходят вам в Telegram.</p>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<div class="card">${rows}</div>
<form class="card" method="post" action="/admin/telegram/setup"><b>Чат с сайта в Telegram</b>
<p class="hint">Нажмите один раз, чтобы ответы из Telegram доходили до посетителей. Повторять нужно только если меняли бота.</p>
<button class="abtn sm" type="submit">Подключить чат к Telegram</button></form>`, flash);
}

export interface ChatRow { id: string; name: string; phone: string; blocked: number; last: number | null }
export interface ChatMsg { chat_id: string; v: number; text: string; t: number; p: string | null }

export function chatsPage(list: ChatRow[], msgs: ChatMsg[], flash?: string): string {
  const fmt = (t: number) => new Date((t + 3 * 3600) * 1000).toISOString().slice(0, 16).replace('T', ' ');
  const rows = list.length ? list.map((ch) => {
    const mine = msgs.filter((m) => m.chat_id === ch.id);
    const who = [ch.name, ch.phone].filter(Boolean).map(esc).join(' · ') || 'Без имени';
    return `<details class="chat-item"><summary><b>${who}</b> <span class="meta">#${ch.id.slice(0, 4)} · ${ch.last ? fmt(ch.last) + ' (МСК)' : ''} · сообщений: ${mine.length}${ch.blocked ? ' · <span style="color:#ff9b8a">заблокирован</span>' : ''}</span></summary>
<div class="chat-log">${mine.map((m) => `<div class="cm ${m.v ? 'v' : 's'}"><small>${m.v ? 'Посетитель' : 'Мастер'} · ${fmt(m.t)}</small>${m.p ? `<a href="/admin/chat-photo/${esc(m.p)}" target="_blank" rel="noopener"><img class="cph" src="/admin/chat-photo/${esc(m.p)}" alt="Фото от посетителя" loading="lazy" onerror="this.replaceWith(document.createTextNode('[фото уже удалено]'))"></a>` : ''}${m.text ? `<div>${esc(m.text)}</div>` : ''}</div>`).join('')}</div>
<form method="post" action="/admin/chats/${ch.id}/delete" onsubmit="return confirm('Удалить эту переписку?')"><button class="abtn sm danger" type="submit">Удалить переписку</button></form></details>`;
  }).join('') : '<p class="hint">Переписок пока нет.</p>';
  return layout('chats', 'Чаты', `<p class="sub">Переписки с посетителями через чат на сайте. Отвечать нужно в Telegram, нажав «Ответить» на сообщение. Переписки старше 30 дней удаляются сами.</p>
<style>.chat-item{border-top:1px solid var(--line);padding:0.75rem 0}.chat-item:first-child{border-top:0}.chat-item summary{cursor:pointer}.meta{color:var(--muted);font-size:.85rem}.cph{display:block;max-width:100%;max-height:14rem;border-radius:.375rem;margin:.25rem 0;border:1px solid var(--line)}.chat-log{display:flex;flex-direction:column;gap:0.5rem;margin:0.75rem 0}.cm{max-width:88%;padding:0.5rem 0.75rem;border-radius:0.625rem;overflow-wrap:anywhere;white-space:pre-wrap}.cm small{display:block;color:var(--muted);font-size:.75rem}.cm.v{background:var(--bg);border:1px solid var(--line);align-self:flex-start}.cm.s{background:rgba(226,180,79,.15);border:1px solid var(--gold);align-self:flex-end}</style>
<div class="card">${rows}</div>`, flash);
}

/* ---------- услуги и цены ---------- */

const MODES: [string, string][] = [['from', 'От (цена «от …»)'], ['fixed', 'Фиксированная цена'], ['sale', 'Акция (старая цена зачёркнута)'], ['none', 'Не показывать цену']];

function serviceForm(s: Service | null, i: number, total: number): string {
  const act = s ? `/admin/services/${s.id}` : '/admin/services';
  const id = s ? `s${s.id}` : 'new';
  return `<form class="card f" method="post" action="${act}">
  <div class="row2">
    <div><label for="${id}-title">Название услуги</label><input id="${id}-title" name="title" type="text" maxlength="120" required value="${esc(s?.title ?? '')}"></div>
    <div><label for="${id}-label">Короткая метка слева (1–2 слова)</label><input id="${id}-label" name="label" type="text" maxlength="24" value="${esc(s?.label ?? '')}"></div>
  </div>
  <label for="${id}-icon">Значок слева от названия</label>
  <select id="${id}-icon" name="icon" class="sel">${Object.entries(SERVICE_ICONS).map(([v, t]) => `<option value="${v}"${(s?.icon ?? 'key') === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
  <label for="${id}-short">Краткое описание под названием</label>
  <input id="${id}-short" name="short" type="text" maxlength="300" value="${esc(s?.short ?? '')}">
  <div class="row2">
    <div><label for="${id}-mode">Как показывать цену</label><select id="${id}-mode" name="mode" class="sel">${MODES.map(([v, t]) => `<option value="${v}"${(s?.mode ?? 'from') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
    <div><label for="${id}-price">Цена, ₽</label><input id="${id}-price" name="price" type="number" min="0" max="10000000" inputmode="numeric" value="${s?.price ?? ''}"></div>
  </div>
  <label for="${id}-old">Старая цена, ₽ (только для режима «Акция»)</label>
  <input id="${id}-old" name="old_price" type="number" min="0" max="10000000" inputmode="numeric" value="${s?.old_price ?? ''}">
  <div class="row2">
    <div class="chk" style="margin:0 0 0.375rem"><input id="${id}-sn" name="show_note" type="checkbox" value="1"${s ? (s.show_note ? ' checked' : '') : ''}><label for="${id}-sn">Подпись под ценой</label></div>
    <div><label for="${id}-note" style="margin-top:0">Текст подписи</label><input id="${id}-note" name="note" type="text" maxlength="60" placeholder="на все модели" value="${esc(s?.note ?? 'на все модели')}"></div>
  </div>
  <label for="${id}-det">Подробный текст (раскрывается по кнопке «Подробнее», читается поисковиками)</label>
  <textarea id="${id}-det" name="details" maxlength="6000" style="min-height:13.75rem">${esc(s?.details ?? '')}</textarea>
  <div class="hint">Абзацы разделяйте пустой строкой. Строки, которые начинаются с «- », станут маркированным списком.</div>
  <div class="acts" style="margin-top:1rem">
    <button class="abtn gold" type="submit">${s ? 'Сохранить' : 'Добавить услугу'}</button>
    ${s ? `<button class="abtn sm" type="submit" formaction="/admin/services/${s.id}/move" name="dir" value="up"${i === 0 ? ' disabled' : ''} formnovalidate aria-label="Выше">↑</button>
    <button class="abtn sm" type="submit" formaction="/admin/services/${s.id}/move" name="dir" value="down"${i === total - 1 ? ' disabled' : ''} formnovalidate aria-label="Ниже">↓</button>
    <button class="abtn sm danger" type="submit" formaction="/admin/services/${s.id}/delete" formnovalidate onclick="return confirm('Удалить эту услугу?')">Удалить</button>` : ''}
  </div>
</form>`;
}

export function servicesPage(list: Service[], flash?: string): string {
  return layout('services', 'Услуги и цены', `
<p class="sub">Эти услуги и цены показываются на главной странице. Подробный текст помогает поиску: в нём стоит перечислить виды ключей, форматы и модели телефонов. Только то, что вы действительно делаете.</p>
<style>.sel{width:100%;background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:0.375rem;padding:0.75rem;font:inherit}</style>
${list.map((s, i) => serviceForm(s, i, list.length)).join('')}
<h2 style="font-size:1.15rem;margin:1.75rem 0 0.75rem">Новая услуга</h2>
${serviceForm(null, 0, 0)}`, flash);
}

/* ---------- главная страница ---------- */

export function sitePage(site: Site, flash?: string): string {
  const photo = (key: string | null, label: string) => key ? `<img class="pv" src="/img/${esc(key)}" alt="${esc(label)}">` : '<div class="hint">Фото пока нет.</div>';
  const steps = site.steps.map((st, i) => `<div class="card" style="margin-bottom:1rem"><b>Шаг ${i + 1}</b>
  <label for="st${i}t">Заголовок</label><input id="st${i}t" name="step${i}_t" type="text" maxlength="80" value="${esc(st.t)}">
  <label for="st${i}d">Описание</label><textarea id="st${i}d" name="step${i}_d" maxlength="220" style="min-height:4.5rem">${esc(st.d)}</textarea></div>`).join('');
  return layout('site', 'Главная страница', `
<p class="sub">Фото на первом экране, блок «Как мы работаем» и сравнение «до и после» для плёнки.</p>
<style>.pv{display:block;max-width:20rem;width:100%;border-radius:.5rem;border:1px solid var(--line);margin:.4rem 0}.ba2{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:1rem}</style>
<form class="f" method="post" action="/admin/site" enctype="multipart/form-data" data-img data-max="1400" data-next="/admin/site?saved=1">
  <div class="err" hidden></div>
  <div class="card"><b>Фото на первом экране</b>
    <p class="hint">Живое фото мастерской или работы, лучше горизонтальное. Показывается рядом с чертежом.</p>
    ${photo(site.hero.key, 'Фото на первом экране')}
    <label for="hero_photo">${site.hero.key ? 'Заменить фото' : 'Загрузить фото'}</label>
    <input id="hero_photo" name="hero_photo" type="file" accept="image/*">
    <div data-prev="hero_photo"></div>
    ${site.hero.key ? '<div class="chk"><input id="hero_remove" name="hero_remove" type="checkbox" value="1"><label for="hero_remove">Убрать фото</label></div>' : ''}
    <label for="hero_caption">Подпись на фото (необязательно)</label>
    <input id="hero_caption" name="hero_caption" type="text" maxlength="100" value="${esc(site.hero.caption)}">
  </div>
  <h2 style="font-size:1.15rem;margin:1.5rem 0 .6rem">Блок «Как мы работаем»</h2>
  ${steps}
  <div class="card"><b>Плёнка: до и после</b>
    <p class="hint">Загрузите оба фото, и на сайте появится ползунок для сравнения. Снимайте телефон одинаково в обоих кадрах.</p>
    <div class="ba2">
      <div>${photo(site.ba.before, 'До')}<label for="ba_before">Фото «До»</label><input id="ba_before" name="ba_before" type="file" accept="image/*"><div data-prev="ba_before"></div></div>
      <div>${photo(site.ba.after, 'После')}<label for="ba_after">Фото «После»</label><input id="ba_after" name="ba_after" type="file" accept="image/*"><div data-prev="ba_after"></div></div>
    </div>
    ${site.ba.before || site.ba.after ? '<div class="chk"><input id="ba_remove" name="ba_remove" type="checkbox" value="1"><label for="ba_remove">Убрать оба фото</label></div>' : ''}
    <label for="ba_caption">Подпись под сравнением</label>
    <input id="ba_caption" name="ba_caption" type="text" maxlength="100" value="${esc(site.ba.caption)}">
  </div>
  <p><button class="abtn gold" type="submit">Сохранить</button></p>
</form>`, flash, IMG_JS);
}

/* ---------- выбор темы ---------- */

/** Подсказки на странице: сегодняшние восход и закат и то, как сайт выглядит прямо сейчас (считает браузер, формула та же, что на сайте). */
const themeHintJs = (th: ThemeCfg) => `<script>(function(){${SUN_LIB}
var C=${JSON.stringify({ m: th.mode, f: th.from, t: th.to })},t=new Date(Date.now()+3*36e5),s=sunMsk(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()),a=document.getElementById('th_today'),n=document.getElementById('th_now');
if(a)a.textContent='Сегодня восход в '+fmtMsk(s[0])+', закат в '+fmtMsk(s[1])+' по Москве.';
if(n)n.textContent='Сейчас сайт открывается '+(dayState(C,Date.now()).day?'светлым':'тёмным')+'.';
})()</script>`;

export function themePage(th: ThemeCfg, flash?: string, error?: string): string {
  const top = th.mode === 'dark' ? 'dark' : th.mode === 'light' ? 'light' : 'auto';
  const how = th.mode === 'hours' ? 'hours' : 'sun';
  const opt = (id: string, val: string, swatch: string, title: string, text: string) =>
    `<label class="opt" for="${id}"><input id="${id}" name="theme_top" type="radio" value="${val}"${top === val ? ' checked' : ''}><span class="sw ${swatch}" aria-hidden="true"></span><span><b>${title}</b><small>${text}</small></span></label>`;
  return layout('theme', 'Выбор темы', `
<p class="sub">Какой вид у сайта: светлый или тёмный. Посетитель всё равно может сам нажать кнопку с солнцем или луной в шапке сайта. Его выбор действует до ближайшей смены дня и ночи.</p>
<p class="hint" id="th_now" style="margin:-.5rem 0 1.25rem"></p>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<style>
.tmo{display:grid;gap:.875rem;margin:0 0 1.25rem}
.grp{border:1px solid var(--line);border-radius:.625rem;background:var(--panel)}
.grp:has(.opt input:checked){border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}
.f .opt{display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:.9rem;align-items:center;margin:0;padding:1rem;font-weight:400;cursor:pointer}
.f .opt input{width:1.375rem;height:1.375rem;accent-color:var(--gold);margin:0}
.opt b{display:block;font-size:1.05rem}
.opt small{display:block;color:var(--muted);margin-top:.15rem;font-size:.9rem}
.sw{position:relative;width:4.25rem;height:2.75rem;border-radius:.4rem;border:1px solid var(--line);overflow:hidden}
.sw::after{content:"";position:absolute;left:.4rem;right:.4rem;bottom:.4rem;height:.35rem;border-radius:2px;background:#e2b44f}
.sw.dark{background:#0f2233}.sw.light{background:#eef2f6}.sw.auto{background:linear-gradient(115deg,#eef2f6 50%,#0f2233 50%)}
.autosub{padding:0 1rem 1rem 1rem}
.autosub .in{border-top:1px solid var(--line);padding-top:.5rem}
.grp:not(:has(.opt input:checked)) .autosub{opacity:.5}
.autosub .row2{margin:0 0 0 2.0rem}
@media (max-width:30rem){.f .opt{grid-template-columns:auto minmax(0,1fr)}.opt .sw{display:none}.autosub .row2{margin-left:0}}
</style>
<form class="f" method="post" action="/admin/theme">
  <div class="tmo">
    <div class="grp">
      ${opt('t_auto', 'auto', 'auto', 'Авто', 'Днём светлая, ночью тёмная. Сайт сам переключается по московскому времени.')}
      <div class="autosub"><div class="in">
        <div class="chk"><input id="th_sun" name="theme_how" type="radio" value="sun"${how === 'sun' ? ' checked' : ''}><label for="th_sun">По солнцу: светлая от восхода до заката в Липецке</label></div>
        <p class="hint" id="th_today" style="margin:-.25rem 0 .5rem 2rem"></p>
        <div class="chk"><input id="th_hours" name="theme_how" type="radio" value="hours"${how === 'hours' ? ' checked' : ''}><label for="th_hours">По часам: каждый день в одно и то же время</label></div>
        <div class="row2">
          <div><label for="th_from">Светлая с</label><input id="th_from" name="theme_from" type="time" value="${esc(th.from)}"></div>
          <div><label for="th_to">до (остальное время тёмная)</label><input id="th_to" name="theme_to" type="time" value="${esc(th.to)}"></div>
        </div>
      </div></div>
    </div>
    <div class="grp">${opt('t_dark', 'dark', 'dark', 'Тёмная', 'Всегда тёмная, и днём тоже.')}</div>
    <div class="grp">${opt('t_light', 'light', 'light', 'Светлая', 'Всегда светлая, и ночью тоже.')}</div>
  </div>
  <p><button class="abtn gold" type="submit">Сохранить</button></p>
</form>`, flash, themeHintJs(th));
}
