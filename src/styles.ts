export const CSS = `
/* Вариант В: спокойный и аккуратный, синяя «чертёжная» гамма, тонкие линии, профиль ключа как главный образ */
:root{--bg:#0f2233;--panel:#14304a;--line:#2b5276;--fg:#e8f0f7;--muted:#9fb6ca;--gold:#e2b44f;--gold-ink:#1a1405;--red:#e0382c;--red-hi:#ff5a4d;--wa:#25d366;--wa-ink:#05230f;--tg:#2aabee;--tg-ink:#04141c;--dim:#7fa9d3;--gold-t:#e2b44f;--gold-hover:#f2c867;--gold-t-hover:#f2c867;--err-fg:#ffd5cc;--soft:rgba(255,255,255,.04);--soft2:rgba(255,255,255,.12);color-scheme:dark;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--body:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
:root[data-theme="light"]{--bg:#eef2f6;--panel:#ffffff;--line:#c9d6e2;--fg:#10212f;--muted:#465a6c;--dim:#3f6f9d;
  --gold-t:#855600;--gold-hover:#d6a23a;--gold-t-hover:#5f3d00;--red-hi:#c4281c;--err-fg:#7a1d12;--soft:rgba(16,33,47,.05);--soft2:rgba(16,33,47,.1);color-scheme:light}
.bar,footer,.cw-panel header{--fg:#e8f0f7;--muted:#9fb6ca;--line:#2b5276;--dim:#7fa9d3;--gold-t:#e2b44f;--gold-hover:#f2c867;--gold-t-hover:#f2c867;--soft:rgba(255,255,255,.04);--soft2:rgba(255,255,255,.12);color:var(--fg)}
html{background:var(--bg)}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;font-size:clamp(1rem,.93rem + .15vw,1.125rem)}
body{background:var(--bg);color:var(--fg);font:1rem/1.6 var(--body);
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:40px 40px;background-position:-1px -1px;background-attachment:scroll}
a{color:inherit}
.wrap{max-width:66rem;margin:0 auto;padding-left:max(1rem,env(safe-area-inset-left,0px));padding-right:max(1rem,env(safe-area-inset-right,0px))}
h1,h2,h3{margin:0;font-weight:600;line-height:1.2;text-wrap:balance}
.lbl{font-family:var(--mono);font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-t)}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:#0a1824;border-bottom:1px solid var(--line)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:30;background:#0a1824}
.bar .wrap{display:flex;justify-content:space-between;align-items:center;gap:0.625rem;padding-block:0.6875rem}
.logo{text-decoration:none;font-weight:700;letter-spacing:.01em;font-size:clamp(1.1rem,4.6vw,1.65rem);line-height:1.15}
.logo b{color:var(--gold-t)}
.tel{border:1px solid var(--gold-t);color:var(--gold-t);text-decoration:none;padding:0.5rem 0.875rem;border-radius:0.375rem;font-family:var(--mono);font-size:clamp(.9rem,3.4vw,1.05rem);white-space:nowrap}
.hero{padding-block:3rem 2.5rem}
.hero .wrap{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:1.875rem;align-items:center}
.hero h1{font-size:clamp(2rem,7vw,3.4rem);margin:0.75rem 0 1rem}
.hero p{color:var(--muted);max-width:44ch;margin:0 0 1.5rem}
.btns{display:flex;flex-wrap:wrap;gap:0.625rem}
.btn{display:inline-flex;align-items:center;min-height:3.125rem;padding:0 1.375rem;border-radius:0.375rem;text-decoration:none;font-weight:600;border:1px solid var(--line)}
.btn.gold{background:var(--gold);color:var(--gold-ink);border-color:var(--gold)}
.btn:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid var(--gold-t);outline-offset:2px}
.key{width:100%;height:auto;color:var(--gold-t)}
.state{margin-top:1.375rem;font-family:var(--mono);font-size:.85rem;color:var(--muted)}
@media (max-width:43.75rem){.hero .wrap{grid-template-columns:1fr}.key{max-width:26.25rem}}
section{padding-block:2.5rem}
h2{font-size:clamp(1.5rem,4.5vw,2rem);margin:0.5rem 0 1.375rem}
.rows{display:grid;gap:0;border:1px solid var(--line);border-radius:0.625rem;overflow:hidden;background:var(--panel)}
.row{display:grid;grid-template-columns:8.125rem minmax(0,1fr);gap:1rem;padding:1.125rem 1.25rem;border-top:1px solid var(--line)}
.row:first-child{border-top:0}
.row h3{font-size:1.1rem}
.row p{margin:0.25rem 0 0;color:var(--muted)}
.row .lbl{padding-top:3px}
@media (max-width:35rem){.row{grid-template-columns:1fr;gap:0.25rem}}
.tags{display:flex;flex-wrap:wrap;gap:0.5rem}
.tag{border:1px solid var(--line);background:var(--panel);padding:0.625rem 1rem;border-radius:0.375rem}
.vrow{display:grid;grid-template-columns:minmax(0,15rem) minmax(0,1fr);gap:1.75rem;align-items:center}
.vbox{position:relative;aspect-ratio:9/16;border:1px solid var(--line);border-radius:0.625rem;overflow:hidden;background:#06101a;width:100%}
.vbox iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.vplay{position:absolute;inset:0;width:100%;border:0;background:linear-gradient(160deg,#14304a,#06101a);color:#e8f0f7;font:600 1rem var(--body);cursor:pointer;display:flex;flex-direction:column;gap:0.75rem;align-items:center;justify-content:center}
.vplay i{width:3.875rem;height:3.875rem;border-radius:50%;border:2px solid var(--gold);display:grid;place-items:center}
.vplay i::after{content:"";border-left:17px solid var(--gold);border-top:10px solid transparent;border-bottom:10px solid transparent;margin-left:0.25rem}
.vrow p{color:var(--muted);margin:0 0 1rem}
@media (max-width:40rem){.vrow{grid-template-columns:1fr}.vbox{max-width:16.875rem;margin:0 auto}}
footer{background:#0a1824;border-top:1px solid var(--line);padding-block:2.5rem 1.75rem}
.info{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(14.375rem,100%),1fr));gap:1.625rem}
.info p{margin:0.375rem 0 0}
.info a{color:var(--gold-t);text-underline-offset:3px}
.hrs{width:100%;border-collapse:collapse;margin-top:0.375rem}
.hrs td{padding:3px 0}.hrs td:last-child{text-align:right;font-family:var(--mono);font-size:.9rem}
.copy{margin-top:1.875rem;color:var(--muted);font-size:.88rem}

.goods{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(10rem,100%),1fr));gap:0.875rem}
.good{background:var(--panel);border:1px solid var(--line);border-radius:0.625rem;overflow:hidden;display:flex;flex-direction:column}
.good .t{padding:0.75rem 0.875rem 0.875rem;display:flex;flex-direction:column;gap:0.25rem;flex:1}
.good h3{font-size:1.02rem}
.good p{margin:0;color:var(--muted);font-size:.9rem}
.good .pr{margin-top:auto;padding-top:0.375rem;font-family:var(--mono);color:var(--gold-t);font-weight:600}
.pr.noprice{color:var(--muted);font-weight:400;font-size:.85rem}
.empty{color:var(--muted)}

.lead{max-width:32.5rem;background:var(--panel);border:1px solid var(--line);border-radius:0.625rem;padding:1.25rem}
.lead label{display:block;margin:0.875rem 0 0.375rem;font-weight:600}
.lead label:first-child{margin-top:0}
.lead input[type=text],.lead input[type=tel],.lead textarea{width:100%;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:0.375rem;padding:0.75rem;font:inherit}
.lead textarea{min-height:5.25rem;resize:vertical}
.lead input:focus-visible,.lead textarea:focus-visible{outline:3px solid var(--gold-t);outline-offset:1px}
.lead .btn{margin-top:1.125rem;width:100%;cursor:pointer;font:inherit;font-weight:700;border:0}
.lead .btn:disabled{opacity:.6;cursor:default}
.lead .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}

.gal-wrap{position:relative}
.gal{position:relative}
.gal-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.gal-track::-webkit-scrollbar{display:none}
.gal-track img{flex:0 0 100%;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;scroll-snap-align:start;background:var(--bg);display:block}
.gal-cnt{position:absolute;right:0.5rem;bottom:0.5rem;background:rgba(6,16,26,.75);color:#e8f0f7;font:.8rem var(--mono);padding:3px 0.5rem;border-radius:6.1875rem}
.ph{aspect-ratio:4/3;background:repeating-linear-gradient(135deg,var(--bg) 0 12px,var(--line) 12px 13px);display:grid;place-items:center;color:var(--muted);font-size:.8rem}
.badge{position:absolute;left:0.5rem;top:0.5rem;font:700 .78rem var(--mono);letter-spacing:.06em;text-transform:uppercase;padding:0.25rem 0.5625rem;border-radius:0.3125rem}
.badge.out{top:auto;bottom:0.5rem;left:0.5rem;background:#3a4650;color:#dfe6ec}
.is-out .gal-track,.is-out .ph{filter:grayscale(.8);opacity:.7}
.good .pr s{color:var(--muted);font-weight:400;font-size:.85rem;margin-right:0.25rem}
.vc{position:relative}
.vc-track{display:flex;gap:0.875rem;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:0.25rem}
.vc-track::-webkit-scrollbar{display:none}
.vcard{flex:0 0 min(70vw,15.625rem);scroll-snap-align:start;display:flex;flex-direction:column;gap:0.5rem}
.vcard .vbox{max-width:none;margin:0}
.vplay img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9}
.vplay i{position:relative}
.vlink{font-size:.88rem;color:var(--gold-t);text-underline-offset:3px}
.vc-btn{position:absolute;top:42%;z-index:2;width:2.625rem;height:2.625rem;border-radius:50%;border:1px solid var(--line);background:rgba(10,24,36,.88);color:#e8f0f7;font-size:1.5rem;line-height:1;cursor:pointer}
.vc-btn.prev{left:-.375rem}.vc-btn.next{right:-.375rem}
.vc-btn:focus-visible{outline:3px solid var(--gold-t);outline-offset:2px}

.vfs{position:absolute;top:0.5rem;right:0.5rem;z-index:3;width:2.375rem;height:2.375rem;border-radius:0.5rem;border:1px solid rgba(255,255,255,.35);background:rgba(6,16,26,.7);color:#fff;font-size:1.15rem;line-height:1;cursor:pointer}
.vfs:hover{background:rgba(6,16,26,.9)}
.vfs:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.vbox:fullscreen,.vbox.vfull{width:100vw;height:100vh;max-width:none;aspect-ratio:auto;border-radius:0;border:0;background:#000}
.vbox.vfull{position:fixed;inset:0;z-index:100;width:auto;height:auto}
.vbox:fullscreen .vfs,.vbox.vfull .vfs{top:max(0.75rem,env(safe-area-inset-top,0px));right:max(0.75rem,env(safe-area-inset-right,0px))}
html.vlock{overflow:hidden}

.lf-status{margin:1rem 0 0;display:flex;gap:0.875rem;align-items:center;border-radius:0.5rem;padding:0.875rem 1rem;border:1px solid var(--gold-t);background:rgba(226,180,79,.08)}
.lf-status[hidden]{display:none}
.lf-status .ico{flex:none;width:2.375rem;height:2.375rem;border-radius:50%;background:var(--gold);color:var(--gold-ink);display:grid;place-items:center}
.lf-status b{display:block}
.lf-status span>span{color:var(--muted);font-size:.92rem}
.lf-status.bad{border-color:#b5584a;background:rgba(181,88,74,.12)}
.lf-status.bad .ico{background:#b5584a;color:#fff;font-size:1.2rem}

.cw-btn{position:fixed;right:max(1rem,env(safe-area-inset-right,0px));bottom:max(1rem,env(safe-area-inset-bottom,0px));z-index:50;display:flex;align-items:center;gap:0.625rem;height:3.5rem;padding:0 1.0625rem;border-radius:6.1875rem;border:0;background:var(--gold);color:var(--gold-ink);font:700 1rem var(--body);cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45)}
.cw-btn.cw-hide{display:none}
.cw-label{display:none}
@media (min-width:45rem){.cw-label{display:inline}}
.cw-btn:focus-visible,.cw-panel button:focus-visible,.cw-panel textarea:focus-visible,.cw-panel input:focus-visible{outline:3px solid var(--gold-t);outline-offset:2px}
.cw-dot{position:absolute;top:2px;right:2px;width:0.875rem;height:0.875rem;border-radius:50%;background:#e5533d;border:2px solid var(--bg)}
.cw-panel{position:fixed;right:max(1rem,env(safe-area-inset-right,0px));bottom:max(1rem,env(safe-area-inset-bottom,0px));z-index:60;width:min(22.5rem,calc(100vw - 2rem));height:min(32.5rem,calc(100dvh - 2rem));display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:0.875rem;box-shadow:0 16px 48px rgba(0,0,0,.55);overflow:hidden}
.cw-panel[hidden]{display:none}
.cw-panel header{display:flex;justify-content:space-between;align-items:center;gap:0.625rem;padding:0.75rem 0.875rem;background:#0a1824;border-bottom:1px solid var(--line)}
.cw-panel header b{display:block}
.cw-panel header small{color:var(--muted)}
.cw-panel header button{width:2.5rem;height:2.5rem;border-radius:0.5rem;border:0;background:none;color:var(--fg);font-size:1.6rem;line-height:1;cursor:pointer}
.cw-log{flex:1;overflow-y:auto;padding:0.875rem;display:flex;flex-direction:column;gap:0.5rem}
.cw-msg{max-width:84%;padding:0.5625rem 0.75rem;border-radius:0.75rem;overflow-wrap:anywhere;white-space:pre-wrap;font-size:.96rem}
.cw-msg.them{align-self:flex-start;background:var(--bg);border:1px solid var(--line)}
.cw-msg.me{align-self:flex-end;background:var(--gold);color:var(--gold-ink)}
.cw-msg.err{align-self:stretch;max-width:none;background:rgba(181,88,74,.15);border:1px solid #b5584a;color:var(--err-fg);font-size:.9rem}
.cw-who{border-top:1px solid var(--line);padding:0.5rem 0.875rem;font-size:.88rem;color:var(--muted)}
.cw-who summary{cursor:pointer}
.cw-who input{width:100%;margin-top:0.5rem;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:0.375rem;padding:0.625rem;font:inherit}
.cw-form{display:flex;gap:0.5rem;padding:0.625rem 0.75rem;border-top:1px solid var(--line);align-items:flex-end}
.cw-form textarea{flex:1;resize:none;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:0.5rem;padding:0.625rem;font:inherit;max-height:6.875rem}
.cw-form button{flex:none;width:2.875rem;height:2.75rem;border-radius:0.5rem;border:0;background:var(--gold);color:var(--gold-ink);font-size:1.15rem;cursor:pointer}
.cw-form button:disabled{opacity:.6}
.cw-form .cw-clip{background:none;border:1px solid var(--gold-t);color:var(--gold-t);display:grid;place-items:center;padding:0}
.cw-form .cw-clip .ico{width:1.4rem;height:1.4rem;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.cw-attach{display:flex;align-items:center;gap:.65rem;padding:.5rem .75rem;border-top:1px solid var(--line);font-size:.88rem;color:var(--muted)}
.cw-attach[hidden],.cw-attach img[hidden]{display:none}
.cw-attach img{flex:none;width:3.25rem;height:3.25rem;object-fit:cover;border-radius:.4rem;border:1px solid var(--line)}
.cw-attach span{flex:1;min-width:0}
.cw-attach button{flex:none;width:2.5rem;height:2.5rem;border:0;border-radius:.5rem;background:none;color:var(--fg);font-size:1.5rem;line-height:1;cursor:pointer}
.cw-ph{display:block;margin-bottom:.35rem}
.cw-ph:last-child{margin-bottom:0}
.cw-photo{display:block;width:100%;max-width:15rem;max-height:12rem;object-fit:cover;border-radius:.5rem;background:var(--panel)}
@media (max-width:32.5rem){.cw-panel{right:0;bottom:0;width:100vw;height:min(35rem,88dvh);border-radius:0.875rem 0.875rem 0 0}}

.cw-panel header small.on{color:#7fe0a2}
.cw-from{display:block;font:700 .76rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--gold-t);margin-bottom:2px}
.cw-msg.auto .cw-from{color:var(--muted)}
.cw-tick{margin-left:0.5rem;font-size:.78rem;opacity:.7;float:right;padding-top:3px}
.cw-link{display:block;color:var(--gold-t);margin-top:0.375rem;text-underline-offset:3px}
button.cw-link{background:none;border:0;padding:0;font:inherit;text-align:left;text-decoration:underline;cursor:pointer}
.cw-chips{display:flex;flex-wrap:wrap;gap:0.5rem;align-self:flex-start}
.cw-chips button{border:1px solid var(--gold-t);background:none;color:var(--gold-t);border-radius:6.1875rem;padding:0.5rem 0.875rem;font:inherit;font-size:.88rem;cursor:pointer}
.cw-chips button:hover{background:rgba(226,180,79,.12)}

.row.svc{grid-template-columns:8.125rem minmax(0,1fr) auto;align-items:start}
.svc-price{font:700 1.1rem var(--mono);color:var(--gold-t);white-space:nowrap;text-align:right;padding-top:2px}
.svc-price span{font-size:.8rem;font-weight:500;color:var(--muted)}
.svc-price s{display:block;color:var(--muted);font-weight:400;font-size:.82rem}
.svc-more{grid-column:2/-1;margin-top:0.375rem}
.svc-more summary{cursor:pointer;color:var(--gold-t);font-size:.9rem;list-style:none;width:max-content}
.svc-more summary::-webkit-details-marker{display:none}
.svc-more summary::after{content:" ▾"}
.svc-more[open] summary::after{content:" ▴"}
.svc-more summary:focus-visible{outline:3px solid var(--gold-t);outline-offset:3px}
.svc-text{margin-top:0.625rem;color:var(--fg);max-width:68ch}
.svc-text p{margin:0 0 0.625rem;color:var(--muted)}
.svc-text ul{margin:0 0 0.625rem;padding-left:1.2em;color:var(--muted)}
.svc-text li{margin:3px 0}
@media (max-width:35rem){.row.svc{grid-template-columns:1fr;gap:0.25rem}.svc-price{text-align:left}.svc-more{grid-column:1}}

.tag-sale{display:inline-flex;align-items:center;background:var(--red);color:#fff;font:800 .78rem var(--body);letter-spacing:.08em;text-transform:uppercase;padding:0.375rem 0.75rem 0.375rem 1.375rem;
  clip-path:polygon(14px 0,100% 0,100% 100%,14px 100%,0 50%);position:relative;transform:rotate(-4deg);margin-right:0.5rem;vertical-align:middle;box-shadow:0 2px 0 rgba(0,0,0,.25)}
.tag-sale::before{content:"";position:absolute;left:0.6875rem;top:50%;width:0.375rem;height:0.375rem;margin-top:-3px;border-radius:50%;background:var(--bg)}
.tag-sale.on-card{position:absolute;left:-2px;top:0.75rem;z-index:2;font-size:.9rem;padding:0.5rem 1rem 0.5rem 1.625rem;margin:0}
.tag-sale.on-card::before{left:0.8125rem}
.svc-price.sale,.good .pr.sale{color:var(--red-hi)}
.svc-price.sale s,.good .pr.sale s{color:var(--muted)}

.svc-price .svc-note{display:block;font:500 .84rem var(--body);color:var(--muted);margin-top:3px}
@media (max-width:35rem){.svc-price .svc-note{display:inline;margin-left:0.5rem}}

.row>*{min-width:0}
@media (max-width:15rem){.bar .wrap{flex-wrap:wrap}}
.logo{min-width:0;text-wrap:balance}
@media (max-width:35rem){.svc-price{white-space:normal}.svc-price .svc-note{display:inline-block;margin-left:.5rem}}

/* наведение мыши и нажатие: подсветка и смена контура (на сенсорных экранах «залипания» нет) */
.tel,.btn,.vc-btn,.cw-btn,.cw-form button,.cw-panel header button,.cw-chips button,.vfs{transition:none}
@media (prefers-reduced-motion:no-preference){
  .tel,.btn,.vc-btn,.cw-btn,.cw-form button,.cw-panel header button,.cw-chips button,.vfs{transition:background-color .18s ease,color .18s ease,border-color .18s ease,box-shadow .18s ease,transform .18s ease}
}
@media (hover:hover){
  .tel:hover{background:var(--gold);color:var(--gold-ink);border-color:var(--gold-t);box-shadow:0 0 0 .25rem rgba(226,180,79,.22)}
  .btn:not(.gold):hover{border-color:var(--gold-t);color:var(--gold-t);background:rgba(226,180,79,.1)}
  .btn.gold:hover{background:var(--gold-hover);border-color:var(--gold-hover);box-shadow:0 .375rem 1.125rem rgba(226,180,79,.3)}
  .cw-btn:hover{background:var(--gold-hover);transform:scale(1.05)}
  .vc-btn:hover{border-color:var(--gold);color:var(--gold)}
  .cw-form button:hover{background:var(--gold-hover)}
  .cw-form .cw-clip:hover{background:rgba(226,180,79,.14)}
  .cw-attach button:hover{background:rgba(255,255,255,.1)}
  .cw-panel header button:hover{background:rgba(255,255,255,.1)}
  .info a:hover,.vlink:hover,.cw-link:hover{text-decoration-thickness:.125rem;color:var(--gold-t-hover)}
  .svc-more summary:hover{text-decoration:underline;text-underline-offset:.25rem}
  .logo:hover b{color:var(--gold-t-hover)}
}
.tel:active,.btn:active,.cw-btn:active{transform:translateY(1px) scale(.98)}

/* значки и кнопки мессенджеров в фирменных цветах */
.ico{width:1.35rem;height:1.35rem;flex:none;vertical-align:middle}
.ico *{fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.btns .btn.gold{gap:.6rem}
.btns .btn,.btns .split{font-weight:700}
.split{display:inline-flex;align-items:stretch;min-height:3.125rem;border-radius:.375rem;overflow:hidden;border:1px solid var(--c);text-decoration:none;color:var(--fg)}
.split.wa{--c:var(--wa);--ink:var(--wa-ink)}
.split.tg{--c:var(--tg);--ink:var(--tg-ink)}
.split .tile{display:grid;place-items:center;width:3.125rem;background:var(--c);color:var(--ink)}
.split .label{display:flex;align-items:center;padding:0 1.15rem;background:var(--soft)}
.mlink{display:inline-flex;align-items:center;gap:.5rem}
.mlink.wa .ico{color:var(--wa)}.mlink.tg .ico{color:var(--tg)}.mlink.phone .ico{color:var(--gold-t)}
.mlink .ico{width:1.2rem;height:1.2rem}
@media (prefers-reduced-motion:no-preference){.split,.split .label{transition:background-color .18s ease,box-shadow .18s ease,border-color .18s ease}}
@media (hover:hover){
  .split:hover{box-shadow:0 0 0 .2rem rgba(255,255,255,.14)}
  .split:hover{box-shadow:0 0 0 .2rem color-mix(in srgb,var(--c) 28%,transparent)}
  .split:hover .label{background:var(--soft2)}
  .split:hover .label{background:color-mix(in srgb,var(--c) 18%,transparent)}
}
.split:active{transform:translateY(1px) scale(.98)}

@media (max-width:35rem){.btns .btn.gold,.btns .split{width:100%}.btns .btn.gold{justify-content:center}.split .label{flex:1;justify-content:center;padding:0 1rem}}

/* кнопки связи одной ширины: в ряд, когда на каждую хватает места, иначе по одной в строке на всю ширину (старые браузеры без @container получают столбик) */
.hero .btns{display:grid;grid-template-columns:repeat(3,minmax(0,15rem));gap:.625rem;container-type:inline-size}
.hero .btns>.btn,.hero .btns>.split{grid-column:1/-1;width:auto;min-width:0;justify-content:center}
.hero .btns>.btn{padding-inline:1rem}
.split .label{flex:1;justify-content:center;padding:0 .9rem;white-space:nowrap}
@container (min-width:33rem){.hero .btns>.btn,.hero .btns>.split{grid-column:auto}}

/* чертёж ключа: линии, размеры, штамп (размеры шрифта заданы в единицах рисунка) */
.kd .o{fill:none;stroke:var(--gold-t);stroke-width:2.2;stroke-linejoin:round}
.kd .g{fill:none;stroke:var(--gold-t);stroke-width:1.4;stroke-dasharray:2 5;opacity:.6}
.kd .c{fill:none;stroke:var(--gold-t);stroke-width:1;stroke-dasharray:14 3 2 3;opacity:.45}
.kd .frame{fill:none;stroke:var(--dim);stroke-width:1.6}
.kd .frame2{fill:none;stroke:var(--dim);stroke-width:1}
.kd .dim path{fill:none;stroke:var(--dim);stroke-width:1}
.kd .dim polygon{fill:var(--dim);stroke:none}
.kd .dim text{font:14px var(--mono);fill:var(--fg);stroke:none}
.kd .tb rect,.kd .tb path{fill:none;stroke:var(--dim);stroke-width:1}
.kd .tb text{font:12.5px var(--mono);fill:var(--fg)}
.kd .tb text.b{font-weight:700;fill:var(--gold-t);font-size:13.5px}
.kd .tb text.m{fill:var(--muted);font-size:11.5px}
.kd .note{font:12px var(--mono);fill:var(--muted)}
@media (max-width:43.75rem){
  .kd .dim text{font-size:18px}
  .kd .tb text{font-size:16px}
  .kd .tb text.b{font-size:17px}
  .kd .tb text.m{font-size:13px}
  .kd .note{font-size:15px}
}

/* значок услуги в рамке слева от названия */
.row.svc{grid-template-columns:10.5rem minmax(0,1fr) auto}
.svc-lead{display:flex;align-items:center;gap:.7rem;min-width:0}
.svc-tile{display:grid;place-items:center;flex:none;width:2.9rem;height:2.9rem;border:1px solid var(--gold-t);border-radius:.375rem;background:rgba(226,180,79,.09);color:var(--gold-t)}
.svc-tile .ico{width:1.5rem;height:1.5rem}
.svc-tile .ico *{stroke-width:1.7}
.svc-lead .lbl{overflow-wrap:anywhere}
@media (max-width:35rem){.row.svc{grid-template-columns:1fr}}

/* плашка про особые дни и список в подвале */
.notice{background:rgba(226,180,79,.14);border-bottom:1px solid var(--gold-t);color:var(--fg);font-size:.95rem}
.notice .wrap{padding-block:.55rem}
.notice b{color:var(--gold-t)}
.spec{margin:.4rem 0 0;padding:0;list-style:none;color:var(--fg);font-size:.92rem}
.spec li{padding:.15rem 0}

.good .ask{margin-top:.6rem;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;width:100%;min-height:2.5rem;border:1px solid var(--line);border-radius:.375rem;background:none;color:var(--gold-t);font:600 .88rem var(--body);cursor:pointer;transition:background-color .18s,border-color .18s}
.good .ask .ico{width:1.05rem;height:1.05rem}
@media (hover:hover){.good .ask:hover{border-color:var(--gold-t);background:rgba(226,180,79,.1)}}
.good .ask:focus-visible{outline:3px solid var(--gold-t);outline-offset:2px}
.good{container-type:inline-size}
@container (max-width:13.5rem){.good .ask-more{display:none}}

/* кнопка темы в шапке */
.bar-actions{display:flex;align-items:center;gap:.6rem;flex:none}
.theme-btn{display:grid;place-items:center;width:2.6rem;height:2.6rem;border-radius:50%;border:1px solid var(--line);background:none;color:var(--fg);cursor:pointer;transition:border-color .18s,color .18s}
.theme-btn .ico{width:1.3rem;height:1.3rem}
.theme-btn .i-moon{display:none}
:root[data-theme="light"] .theme-btn .i-sun{display:none}
:root[data-theme="light"] .theme-btn .i-moon{display:grid}
@media (hover:hover){.theme-btn:hover{border-color:var(--gold-t);color:var(--gold-t)}}
@media (max-width:23rem){.bar-actions{gap:.4rem}.theme-btn{width:2.3rem;height:2.3rem}}

/* телефон в шапке: на узких экранах компактнее, на самых узких только значок */
.tel{display:inline-flex;align-items:center;gap:.5rem}
.tel-ico{display:none;width:1.25rem;height:1.25rem}
@media (max-width:30rem){.tel{padding:.5rem .6rem}.bar-actions{gap:.4rem}.theme-btn{width:2.4rem;height:2.4rem}}
@media (max-width:26.5rem){
  .tel{padding:0;width:2.4rem;height:2.4rem;justify-content:center;border-radius:50%}
  .tel-ico{display:block}
  .tel-num{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
}

/* первый экран: фото и чертёж */
.hero-art{display:grid;gap:1rem;align-content:center;min-width:0}
.hero-photo{margin:0;position:relative;border:1px solid var(--line);border-radius:.625rem;overflow:hidden;aspect-ratio:16/9;background:var(--panel)}
.hero-photo img{display:block;width:100%;height:100%;object-fit:cover}
.hero-photo figcaption{position:absolute;left:.6rem;bottom:.6rem;max-width:calc(100% - 1.2rem);background:rgba(6,16,26,.72);color:#e8f0f7;font:.8rem var(--mono);padding:.25rem .6rem;border-radius:.3rem}

/* как мы работаем: три шага */
.steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr));gap:1rem}
.steps li{display:flex;gap:.9rem;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:.625rem;padding:1.1rem 1.1rem 1.2rem}
.steps .n{flex:none;display:grid;place-items:center;width:2.2rem;height:2.2rem;border:1px solid var(--gold-t);border-radius:50%;color:var(--gold-t);font:700 1rem var(--mono)}
.steps h3{margin:.1rem 0 .25rem;font-size:1.1rem}
.steps p{margin:0;color:var(--muted)}

/* «до и после» */
.how{display:grid;gap:1.5rem;--ar:1.333}
.ba-wrap{margin:0;max-width:calc(var(--ar) * 34rem)}
.ba-wrap figcaption{margin-top:.6rem;color:var(--muted);font-size:.92rem}
@media (min-width:52rem){
  .how.has-ba{grid-template-columns:minmax(0,1fr) minmax(0,min(30rem,calc(var(--ar) * 34rem)));gap:2rem;align-items:center}
  .how.has-ba .steps{grid-template-columns:minmax(0,1fr)}
}
.ba{position:relative;aspect-ratio:var(--ar);border:1px solid var(--line);border-radius:.625rem;overflow:hidden;background:var(--panel);--pos:50%;touch-action:pan-y}
.ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.ba .ba-before{clip-path:inset(0 calc(100% - var(--pos)) 0 0)}
.ba-line{position:absolute;top:0;bottom:0;left:var(--pos);width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);pointer-events:none}
.ba-line::after{content:"‹ ›";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2.6rem;height:2.6rem;border-radius:50%;background:#fff;color:#10212f;font:700 1rem var(--body);display:grid;place-items:center;box-shadow:0 .2rem .8rem rgba(0,0,0,.35);letter-spacing:.1rem}
.ba-tag{position:absolute;top:.6rem;font:700 .75rem var(--mono);letter-spacing:.1em;text-transform:uppercase;background:rgba(6,16,26,.75);color:#e8f0f7;padding:.25rem .6rem;border-radius:.3rem;pointer-events:none}
.ba-tag.l{left:.6rem}.ba-tag.r{right:.6rem}
.ba-range{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize;-webkit-appearance:none;appearance:none;background:none}
.ba:focus-within{outline:3px solid var(--gold-t);outline-offset:2px}

/* карточка товара: краткое описание, кнопка «Подробнее» */
.good .d{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.good h3 a{color:inherit;text-decoration:none}
.good .more{display:flex;align-items:center;justify-content:center;min-height:2.5rem;margin-top:.6rem;border:1px solid var(--gold-t);border-radius:.375rem;background:rgba(226,180,79,.1);color:var(--gold-t);font:700 .9rem var(--body);text-decoration:none}
.good .more + .ask{margin-top:.5rem}
.good .more:focus-visible,.good h3 a:focus-visible{outline:3px solid var(--gold-t);outline-offset:2px}
.pm-on .good .gal-wrap{cursor:zoom-in}
.good.is-loading{opacity:.7;cursor:progress}
.good a,.good .gal-wrap,.pm button{-webkit-tap-highlight-color:transparent}
@media (hover:hover){
  .good .more:hover{background:rgba(226,180,79,.2)}
  .good h3 a:hover{text-decoration:underline;text-decoration-color:var(--gold-t);text-underline-offset:.2em}
}

/* галерея товара (страница товара и окно) */
.pg{min-width:0}
.pg-main{position:relative;border:1px solid var(--line);border-radius:.625rem;overflow:hidden;background:var(--bg)}
.pg-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.pg-track::-webkit-scrollbar{display:none}
.pg-track:focus-visible{outline:3px solid var(--gold-t);outline-offset:-3px}
.pg-track img{flex:0 0 100%;width:100%;height:auto;aspect-ratio:4/3;object-fit:contain;scroll-snap-align:center;display:block;background:var(--bg)}
.pg-btn{position:absolute;top:50%;transform:translateY(-50%);width:2.75rem;height:2.75rem;border-radius:50%;border:0;background:rgba(6,16,26,.72);color:#fff;font:400 1.7rem/1 var(--body);cursor:pointer;display:grid;place-items:center;padding:0 0 .15rem}
.pg-btn.prev{left:.5rem}.pg-btn.next{right:.5rem}
.pg-btn:disabled{opacity:.28;cursor:default}
.pg-btn:focus-visible{outline:3px solid var(--gold-t);outline-offset:2px}
.pg-cnt{position:absolute;right:.5rem;bottom:.5rem;background:rgba(6,16,26,.75);color:#e8f0f7;font:.8rem var(--mono);padding:3px .5rem;border-radius:6.1875rem}
.pg-thumbs{display:flex;gap:.5rem;margin-top:.6rem;overflow-x:auto;padding:.2rem .2rem .35rem}
.pg-thumbs button{flex:none;width:4.25rem;height:3.25rem;padding:0;border:2px solid var(--line);border-radius:.4rem;background:var(--bg);overflow:hidden;cursor:pointer;opacity:.7}
.pg-thumbs button.on{border-color:var(--gold-t);opacity:1}
.pg-thumbs button:focus-visible{outline:3px solid var(--gold-t);outline-offset:2px}
.pg-thumbs img{width:100%;height:100%;object-fit:cover;display:block}
@media (hover:hover){.pg-btn:not(:disabled):hover{background:rgba(6,16,26,.9)}.pg-thumbs button:hover{opacity:1}}

/* содержимое товара */
.pi{display:grid;gap:1.5rem}
.pi-info{min-width:0}
.pi-badges{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;margin-bottom:.7rem}
.pi-badges .tag-sale{margin:0}
.pi-stock{font:.8rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.pi-stock.in{color:#4fbf7f}
:root[data-theme="light"] .pi-stock.in{color:#1f7a45}
.pi-title{font-size:clamp(1.45rem,1.1rem + 1.3vw,2.1rem);line-height:1.2;margin:0 0 .7rem;text-wrap:balance}
.pi .pr{font-family:var(--mono);color:var(--gold-t);font-weight:700;font-size:1.55rem;margin:.2rem 0 1.1rem}
.pi .pr.sale{color:var(--red-hi)}
.pi .pr s{color:var(--muted);font-weight:400;font-size:1rem;margin-right:.4rem}
.pi .pr.noprice{font-size:1rem;font-weight:400;color:var(--muted)}
.pi-text{overflow-wrap:anywhere}
.pi-text p{margin:0 0 .85rem;line-height:1.65}
.pi-text ul{margin:0 0 .85rem;padding-left:1.25rem}
.pi-text li{margin:.2rem 0}
.pi-acts{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1.25rem}
.pi-acts .btn{gap:.6rem;font-weight:700;justify-content:center;cursor:pointer;font-family:inherit;font-size:1rem}
.pi-page{display:inline-block;margin-top:1rem;color:var(--gold-t);text-underline-offset:3px}
@media (min-width:52rem){.pi{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:2rem;align-items:start}}
@media (max-width:30rem){.pi-acts .btn{flex:1 1 100%}}

/* страница товара */
.pp{padding:1.5rem 0 3rem}
.crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:.45rem;margin-bottom:1.25rem;font-size:.9rem;color:var(--muted)}
.crumbs a{color:var(--gold-t);text-underline-offset:3px}
.crumbs [aria-current]{overflow-wrap:anywhere}
.pp-more{padding:0;margin-top:3rem}
.pp-more h2{margin:0 0 1.1rem}

/* окно товара на главной */
.pm{padding:0;border:1px solid var(--line);border-radius:.875rem;background:var(--panel);color:var(--fg);width:min(62rem,calc(100vw - 2rem));max-width:none;max-height:calc(100dvh - 2rem);overflow:hidden;margin:auto}
.pm::backdrop{background:rgba(5,12,20,.76)}
.pm-box{position:relative;max-height:calc(100dvh - 2rem);overflow-y:auto;overscroll-behavior:contain;padding:1.25rem}
.pm-x{position:absolute;top:.65rem;right:.65rem;z-index:3;width:2.75rem;height:2.75rem;border-radius:50%;border:1px solid var(--line);background:var(--panel);color:var(--fg);font:400 1.7rem/1 var(--body);cursor:pointer;display:grid;place-items:center;padding:0 0 .15rem}
.pm-x:focus-visible{outline:3px solid var(--gold-t);outline-offset:2px}
.pm .pi-info{padding-top:.1rem}
@media (min-width:52rem){.pm .pi-info{padding-right:2.5rem}}
html.pm-open{overflow:hidden}
@media (max-width:47.5rem){
  .pm{width:100vw;height:100dvh;max-height:none;border:0;border-radius:0}
  .pm-box{max-height:100dvh;height:100dvh;padding:3.9rem 1rem 1.5rem}
}
@media (hover:hover){.pm-x:hover{border-color:var(--gold-t);color:var(--gold-t)}}
@media (prefers-reduced-motion:no-preference){
  .pm[open]{animation:pm-in .22s ease-out}
  @keyframes pm-in{from{opacity:0;transform:translateY(.75rem) scale(.985)}to{opacity:1;transform:none}}
}

/* мягкое появление блоков (включается скриптом, только если анимации не отключены) */
@media (prefers-reduced-motion:no-preference){
  .rv .reveal{opacity:0;transform:translateY(.9rem);transition:opacity .55s ease,transform .55s ease}
  .rv .reveal.in{opacity:1;transform:none}
  /* плавная смена дня и ночи (там, где браузер умеет, иначе тема меняется сразу) */
  ::view-transition-old(root),::view-transition-new(root){animation-duration:.45s}
}
`;
