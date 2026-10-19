import { esc, rub, shell } from './views';
import { DAY_LONG, type Contacts, type Hours } from './settings';

export interface AdminProduct {
  id: number; title: string; description: string; price: number | null; old_price: number | null;
  show_price: number; is_sale: number; in_stock: number; images: string[];
}
export interface AdminVideo { id: number; url: string; cover_key: string | null }
export interface Lead { id: number; name: string; phone: string; message: string; sent: number; created_at: number }

const TABS: [string, string, string][] = [
  ['products', 'Товары', '/admin/products'],
  ['videos', 'Видео', '/admin/videos'],
  ['hours', 'Часы работы', '/admin/hours'],
  ['contacts', 'Контакты', '/admin/contacts'],
  ['chats', 'Чаты', '/admin/chats'],
  ['leads', 'Заявки', '/admin/leads'],
  ['password', 'Пароль', '/admin/password'],
];

const ADMIN_CSS = `<style>
.admin{display:grid;grid-template-columns:210px minmax(0,1fr);min-height:100vh}
.side{background:#0a1824;border-right:1px solid var(--line);padding:18px 12px;position:sticky;top:0;align-self:start;height:100vh;display:flex;flex-direction:column;gap:4px}
.side .brand{font-weight:700;padding:6px 10px 14px}.side .brand b{color:var(--gold)}
.side a,.side button{display:block;width:100%;text-align:left;padding:11px 12px;border-radius:6px;text-decoration:none;color:var(--fg);background:none;border:0;font:inherit;cursor:pointer}
.side a:hover,.side button:hover{background:var(--panel)}
.side a[aria-current=page]{background:var(--panel);color:var(--gold);font-weight:700}
.side .sp{flex:1}
.main{padding:24px max(16px,env(safe-area-inset-right,0px)) 60px 24px;max-width:820px;width:100%}
.main h1{font-size:1.5rem;margin-bottom:6px}
.main .sub{color:var(--muted);margin:0 0 20px}
@media (max-width:760px){
  .admin{grid-template-columns:1fr}
  .side{position:sticky;top:env(safe-area-inset-top,0px);height:auto;flex-direction:row;overflow-x:auto;padding:8px;border-right:0;border-bottom:1px solid var(--line);z-index:20;gap:2px}
  .side .brand,.side .sp{display:none}
  .side a,.side button{width:auto;white-space:nowrap;padding:10px 12px}
  .main{padding:18px max(16px,env(safe-area-inset-left,0px)) 60px}
}
.f label{display:block;margin:14px 0 6px;font-weight:600}
.f input[type=text],.f input[type=password],.f input[type=number],.f input[type=url],.f input[type=time],.f textarea{width:100%;background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:12px;font:inherit}
.f textarea{min-height:90px;resize:vertical}
.f input:focus-visible,.f textarea:focus-visible,.f select:focus-visible{outline:3px solid var(--gold);outline-offset:1px}
.f .chk{display:flex;align-items:center;gap:10px;margin:12px 0}
.f .chk input{width:22px;height:22px;accent-color:var(--gold);flex:none}
.f .chk label{margin:0;font-weight:500}
.f .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end}
.hint{color:var(--muted);font-size:.88rem;margin-top:4px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:22px}
.abtn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:6px;border:1px solid var(--line);background:none;color:var(--fg);text-decoration:none;font:inherit;font-weight:600;cursor:pointer}
.abtn.gold{background:var(--gold);color:var(--gold-ink);border-color:var(--gold)}
.abtn.danger{color:#ff9b8a;border-color:#7a3a30}
.abtn.sm{min-height:38px;padding:0 12px;font-size:.9rem}
.abtn:disabled{opacity:.6;cursor:default}
.acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.msg{background:#12402a;border:1px solid #2d7a53;color:#c8f1da;border-radius:6px;padding:10px 14px;margin-bottom:16px}
.err{background:#4a1d17;border:1px solid #8a3a30;color:#ffd5cc;border-radius:6px;padding:10px 14px;margin-bottom:16px}
.item{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}
.item:first-child{border-top:0}
.item img,.item .nophoto{width:72px;height:54px;object-fit:cover;border-radius:6px;background:var(--bg)}
.item .nophoto{display:grid;place-items:center;font-size:.7rem;color:var(--muted)}
.item b{display:block;overflow-wrap:anywhere}.item small{color:var(--muted)}
.tag{display:inline-block;font-size:.72rem;font-family:var(--mono);padding:2px 7px;border-radius:4px;background:var(--gold);color:var(--gold-ink);margin-left:6px;vertical-align:middle}
.tag.grey{background:#3a4650;color:#dfe6ec}
@media (max-width:520px){.item{grid-template-columns:60px minmax(0,1fr)}.item .acts{grid-column:1/-1}}
.photos{display:flex;flex-wrap:wrap;gap:12px;margin:8px 0}
.pitem{width:132px;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px;font-size:.85rem}
.pitem img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:5px}
.pitem label{margin:0!important;font-weight:500!important;display:flex;gap:6px;align-items:center}
.pitem input[type=radio]{accent-color:var(--gold)}
.dayrow{display:grid;grid-template-columns:130px auto 1fr 1fr;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--line)}
.dayrow:first-child{border-top:0}
.dayrow .chk{margin:0}
@media (max-width:560px){.dayrow{grid-template-columns:1fr 1fr}.dayrow>b{grid-column:1/-1}}
.vitem{grid-template-columns:72px minmax(0,1fr) auto}
.vextra{grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.vextra form{margin:0}
.vcover{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.vcover input[type=file]{max-width:230px;font-size:.85rem}
.lead-item{border-top:1px solid var(--line);padding:14px 0}.lead-item:first-child{border-top:0}
.lead-item .meta{color:var(--muted);font-size:.85rem}
.lead-item p{margin:6px 0 0;overflow-wrap:anywhere}
</style>`;

const IMG_JS = `<script>
(function(){
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
  document.querySelectorAll('form[data-img]').forEach(function(form){
    var err=form.querySelector('.err'),btn=form.querySelector('button[type=submit]'),label=btn.textContent;
    form.querySelectorAll('input[type=file]').forEach(function(inp){
      inp.addEventListener('change',function(){
        var box=form.querySelector('[data-prev="'+inp.name+'"]');if(!box)return;box.replaceChildren();
        Array.prototype.forEach.call(inp.files,function(f){var i=document.createElement('img');i.src=URL.createObjectURL(f);i.className='prev';i.style.cssText='width:96px;height:72px;object-fit:cover;border-radius:6px;margin:6px 6px 0 0';box.appendChild(i)});
      });
    });
    form.querySelectorAll('[data-rm]').forEach(function(b){b.addEventListener('click',function(){b.closest('.pitem').remove()})});
    form.addEventListener('submit',function(e){
      e.preventDefault();err.hidden=true;btn.disabled=true;btn.textContent='Сохраняю…';
      var fd=new FormData(form),jobs=[];
      form.querySelectorAll('input[type=file]').forEach(function(inp){
        fd.delete(inp.name);
        Array.prototype.forEach.call(inp.files,function(f){jobs.push(resize(f).then(function(b){fd.append(inp.name,b,'photo.webp')}))});
      });
      Promise.all(jobs)
      .then(function(){return fetch(form.action,{method:'POST',body:fd,credentials:'same-origin'})})
      .then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(t||'Ошибка сохранения')});location.href=form.dataset.next})
      .catch(function(x){err.textContent=x.message;err.hidden=false;btn.disabled=false;btn.textContent=label});
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
  return shell('Вход в админку', `${ADMIN_CSS}<div class="main f" style="margin:0 auto;padding-top:48px">
<h1>Вход в админку</h1>${error ? `<div class="err">${esc(error)}</div>` : ''}
<form method="post" action="/admin/login" class="card">
  <label for="pw">Пароль</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
  <p><button class="abtn gold" type="submit" style="margin-top:16px">Войти</button></p>
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
  <p><button class="abtn gold" type="submit" style="margin-top:18px">Сохранить</button></p>
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
  <p><button class="abtn gold" type="submit" style="margin-top:14px">Добавить видео</button></p>
</form>`, flash, IMG_JS);
}

/* ---------- часы, контакты, пароль, заявки ---------- */

export function hoursPage(h: Hours, flash?: string, error?: string): string {
  const rows = h.days.map((d, i) => `<div class="dayrow"><b>${DAY_LONG[i]}</b>
  <div class="chk"><input id="off${i}" name="off${i}" type="checkbox" value="1"${d.off ? ' checked' : ''}><label for="off${i}">выходной</label></div>
  <div><label class="hint" for="o${i}" style="margin:0">с</label><input id="o${i}" name="open${i}" type="time" value="${esc(d.open)}"></div>
  <div><label class="hint" for="c${i}" style="margin:0">до</label><input id="c${i}" name="close${i}" type="time" value="${esc(d.close)}"></div></div>`).join('');
  return layout('hours', 'Часы работы', `
<p class="sub">График показывается в подвале сайта и в статусе «Сейчас открыто / закрыто».</p>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<form class="card f" method="post" action="/admin/hours">${rows}
  <div class="chk" style="margin-top:16px"><input id="lunch_on" name="lunch_on" type="checkbox" value="1"${h.lunch.on ? ' checked' : ''}><label for="lunch_on">Есть обеденный перерыв (во все рабочие дни)</label></div>
  <div class="row2"><div><label for="lf">Обед с</label><input id="lf" name="lunch_from" type="time" value="${esc(h.lunch.from)}"></div>
  <div><label for="lt">Обед до</label><input id="lt" name="lunch_to" type="time" value="${esc(h.lunch.to)}"></div></div>
  <p><button class="abtn gold" type="submit" style="margin-top:18px">Сохранить</button></p>
</form>`, flash);
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
  <p><button class="abtn gold" type="submit" style="margin-top:18px">Сохранить</button></p>
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
  <p><button class="abtn gold" type="submit" style="margin-top:18px">Сменить пароль</button></p>
</form>`, flash);
}

export function leadsPage(list: Lead[], flash?: string, error?: string): string {
  const fmt = (t: number) => new Date((t + 3 * 3600) * 1000).toISOString().slice(0, 16).replace('T', ' ');
  const rows = list.length ? list.map((l) => `<div class="lead-item">
  <div class="meta">${fmt(l.created_at)} (МСК)${l.sent ? '' : ' · <span style="color:#ff9b8a">не ушла в Telegram</span>'}</div>
  <p><b>${esc(l.name)}</b> · <a href="tel:${esc(l.phone.replace(/[^\d+]/g, ''))}" style="color:var(--gold)">${esc(l.phone)}</a></p>
  ${l.message ? `<p>${esc(l.message)}</p>` : ''}
  <form method="post" action="/admin/leads/${l.id}/delete" onsubmit="return confirm('Удалить заявку?')" style="margin-top:8px"><button class="abtn sm danger" type="submit">Удалить</button></form>
</div>`).join('') : '<p class="hint">Заявок пока нет.</p>';
  return layout('leads', 'Заявки', `<p class="sub">Последние 100 заявок с сайта. Новые также приходят вам в Telegram.</p>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<div class="card">${rows}</div>
<form class="card" method="post" action="/admin/telegram/setup"><b>Чат с сайта в Telegram</b>
<p class="hint">Нажмите один раз, чтобы ответы из Telegram доходили до посетителей. Повторять нужно только если меняли бота.</p>
<button class="abtn sm" type="submit">Подключить чат к Telegram</button></form>`, flash);
}

export interface ChatRow { id: string; name: string; phone: string; blocked: number; last: number | null }
export interface ChatMsg { chat_id: string; v: number; text: string; t: number }

export function chatsPage(list: ChatRow[], msgs: ChatMsg[], flash?: string): string {
  const fmt = (t: number) => new Date((t + 3 * 3600) * 1000).toISOString().slice(0, 16).replace('T', ' ');
  const rows = list.length ? list.map((ch) => {
    const mine = msgs.filter((m) => m.chat_id === ch.id);
    const who = [ch.name, ch.phone].filter(Boolean).map(esc).join(' · ') || 'Без имени';
    return `<details class="chat-item"><summary><b>${who}</b> <span class="meta">#${ch.id.slice(0, 4)} · ${ch.last ? fmt(ch.last) + ' (МСК)' : ''} · сообщений: ${mine.length}${ch.blocked ? ' · <span style="color:#ff9b8a">заблокирован</span>' : ''}</span></summary>
<div class="chat-log">${mine.map((m) => `<div class="cm ${m.v ? 'v' : 's'}"><small>${m.v ? 'Посетитель' : 'Мастер'} · ${fmt(m.t)}</small><div>${esc(m.text)}</div></div>`).join('')}</div>
<form method="post" action="/admin/chats/${ch.id}/delete" onsubmit="return confirm('Удалить эту переписку?')"><button class="abtn sm danger" type="submit">Удалить переписку</button></form></details>`;
  }).join('') : '<p class="hint">Переписок пока нет.</p>';
  return layout('chats', 'Чаты', `<p class="sub">Переписки с посетителями через чат на сайте. Отвечать нужно в Telegram, нажав «Ответить» на сообщение. Переписки старше 30 дней удаляются сами.</p>
<style>.chat-item{border-top:1px solid var(--line);padding:12px 0}.chat-item:first-child{border-top:0}.chat-item summary{cursor:pointer}.meta{color:var(--muted);font-size:.85rem}.chat-log{display:flex;flex-direction:column;gap:8px;margin:12px 0}.cm{max-width:88%;padding:8px 12px;border-radius:10px;overflow-wrap:anywhere;white-space:pre-wrap}.cm small{display:block;color:var(--muted);font-size:.75rem}.cm.v{background:var(--bg);border:1px solid var(--line);align-self:flex-start}.cm.s{background:rgba(226,180,79,.15);border:1px solid var(--gold);align-self:flex-end}</style>
<div class="card">${rows}</div>`, flash);
}
