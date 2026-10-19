export const CSS = `
/* Вариант В: спокойный и аккуратный, синяя «чертёжная» гамма, тонкие линии, профиль ключа как главный образ */
:root{--bg:#0f2233;--panel:#14304a;--line:#2b5276;--fg:#e8f0f7;--muted:#9fb6ca;--gold:#e2b44f;--gold-ink:#1a1405;--red:#e0382c;--red-hi:#ff5a4d;color-scheme:dark;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--body:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;font-size:clamp(1rem,.875rem + .3vw,1.25rem)}
body{background:var(--bg);color:var(--fg);font:1rem/1.6 var(--body);
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:40px 40px;background-position:-1px -1px;background-attachment:scroll}
a{color:inherit}
.wrap{max-width:66rem;margin:0 auto;padding-left:max(1rem,env(safe-area-inset-left,0px));padding-right:max(1rem,env(safe-area-inset-right,0px))}
h1,h2,h3{margin:0;font-weight:600;line-height:1.2;text-wrap:balance}
.lbl{font-family:var(--mono);font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:#0a1824;border-bottom:1px solid var(--line)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:30;background:#0a1824}
.bar .wrap{display:flex;justify-content:space-between;align-items:center;gap:0.625rem;padding-block:0.6875rem}
.logo{text-decoration:none;font-weight:700;letter-spacing:.01em;font-size:clamp(1.1rem,4.6vw,1.65rem);line-height:1.15}
.logo b{color:var(--gold)}
.tel{border:1px solid var(--gold);color:var(--gold);text-decoration:none;padding:0.5rem 0.875rem;border-radius:0.375rem;font-family:var(--mono);font-size:clamp(.9rem,3.4vw,1.05rem);white-space:nowrap}
.hero{padding-block:3rem 2.5rem}
.hero .wrap{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:1.875rem;align-items:center}
.hero h1{font-size:clamp(2rem,7vw,3.4rem);margin:0.75rem 0 1rem}
.hero p{color:var(--muted);max-width:44ch;margin:0 0 1.5rem}
.btns{display:flex;flex-wrap:wrap;gap:0.625rem}
.btn{display:inline-flex;align-items:center;min-height:3.125rem;padding:0 1.375rem;border-radius:0.375rem;text-decoration:none;font-weight:600;border:1px solid var(--line)}
.btn.gold{background:var(--gold);color:var(--gold-ink);border-color:var(--gold)}
.btn:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.key{width:100%;height:auto;color:var(--gold)}
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
.vplay{position:absolute;inset:0;width:100%;border:0;background:linear-gradient(160deg,var(--panel),#06101a);color:var(--fg);font:600 1rem var(--body);cursor:pointer;display:flex;flex-direction:column;gap:0.75rem;align-items:center;justify-content:center}
.vplay i{width:3.875rem;height:3.875rem;border-radius:50%;border:2px solid var(--gold);display:grid;place-items:center}
.vplay i::after{content:"";border-left:17px solid var(--gold);border-top:10px solid transparent;border-bottom:10px solid transparent;margin-left:0.25rem}
.vrow p{color:var(--muted);margin:0 0 1rem}
@media (max-width:40rem){.vrow{grid-template-columns:1fr}.vbox{max-width:16.875rem;margin:0 auto}}
footer{background:#0a1824;border-top:1px solid var(--line);padding-block:2.5rem 1.75rem}
.info{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(14.375rem,100%),1fr));gap:1.625rem}
.info p{margin:0.375rem 0 0}
.info a{color:var(--gold);text-underline-offset:3px}
.hrs{width:100%;border-collapse:collapse;margin-top:0.375rem}
.hrs td{padding:3px 0}.hrs td:last-child{text-align:right;font-family:var(--mono);font-size:.9rem}
.copy{margin-top:1.875rem;color:var(--muted);font-size:.88rem}

.goods{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(10rem,100%),1fr));gap:0.875rem}
.good{background:var(--panel);border:1px solid var(--line);border-radius:0.625rem;overflow:hidden;display:flex;flex-direction:column}
.good .t{padding:0.75rem 0.875rem 0.875rem;display:flex;flex-direction:column;gap:0.25rem;flex:1}
.good h3{font-size:1.02rem}
.good p{margin:0;color:var(--muted);font-size:.9rem}
.good .pr{margin-top:auto;padding-top:0.375rem;font-family:var(--mono);color:var(--gold);font-weight:600}
.good .pr.ask{color:var(--muted);font-weight:400;font-size:.85rem}
.empty{color:var(--muted)}

.lead{max-width:32.5rem;background:var(--panel);border:1px solid var(--line);border-radius:0.625rem;padding:1.25rem}
.lead label{display:block;margin:0.875rem 0 0.375rem;font-weight:600}
.lead label:first-child{margin-top:0}
.lead input[type=text],.lead input[type=tel],.lead textarea{width:100%;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:0.375rem;padding:0.75rem;font:inherit}
.lead textarea{min-height:5.25rem;resize:vertical}
.lead input:focus-visible,.lead textarea:focus-visible{outline:3px solid var(--gold);outline-offset:1px}
.lead .btn{margin-top:1.125rem;width:100%;cursor:pointer;font:inherit;font-weight:700;border:0}
.lead .btn:disabled{opacity:.6;cursor:default}
.lead .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}

.gal-wrap{position:relative}
.gal{position:relative}
.gal-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.gal-track::-webkit-scrollbar{display:none}
.gal-track img{flex:0 0 100%;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;scroll-snap-align:start;background:var(--bg);display:block}
.gal-cnt{position:absolute;right:0.5rem;bottom:0.5rem;background:rgba(6,16,26,.75);color:var(--fg);font:.8rem var(--mono);padding:3px 0.5rem;border-radius:6.1875rem}
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
.vlink{font-size:.88rem;color:var(--gold);text-underline-offset:3px}
.vc-btn{position:absolute;top:42%;z-index:2;width:2.625rem;height:2.625rem;border-radius:50%;border:1px solid var(--line);background:rgba(10,24,36,.88);color:var(--fg);font-size:1.5rem;line-height:1;cursor:pointer}
.vc-btn.prev{left:-.375rem}.vc-btn.next{right:-.375rem}
.vc-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px}

.vfs{position:absolute;top:0.5rem;right:0.5rem;z-index:3;width:2.375rem;height:2.375rem;border-radius:0.5rem;border:1px solid rgba(255,255,255,.35);background:rgba(6,16,26,.7);color:#fff;font-size:1.15rem;line-height:1;cursor:pointer}
.vfs:hover{background:rgba(6,16,26,.9)}
.vfs:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.vbox:fullscreen,.vbox.vfull{width:100vw;height:100vh;max-width:none;aspect-ratio:auto;border-radius:0;border:0;background:#000}
.vbox.vfull{position:fixed;inset:0;z-index:100;width:auto;height:auto}
.vbox:fullscreen .vfs,.vbox.vfull .vfs{top:max(0.75rem,env(safe-area-inset-top,0px));right:max(0.75rem,env(safe-area-inset-right,0px))}
html.vlock{overflow:hidden}

.lf-status{margin:1rem 0 0;display:flex;gap:0.875rem;align-items:center;border-radius:0.5rem;padding:0.875rem 1rem;border:1px solid var(--gold);background:rgba(226,180,79,.08)}
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
.cw-btn:focus-visible,.cw-panel button:focus-visible,.cw-panel textarea:focus-visible,.cw-panel input:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.cw-dot{position:absolute;top:2px;right:2px;width:0.875rem;height:0.875rem;border-radius:50%;background:#e5533d;border:2px solid var(--bg)}
.cw-panel{position:fixed;right:max(1rem,env(safe-area-inset-right,0px));bottom:max(1rem,env(safe-area-inset-bottom,0px));z-index:60;width:min(22.5rem,calc(100vw - 2rem));height:min(32.5rem,calc(100dvh - 2rem));display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:0.875rem;box-shadow:0 16px 48px rgba(0,0,0,.55);overflow:hidden}
.cw-panel[hidden]{display:none}
.cw-panel header{display:flex;justify-content:space-between;align-items:center;gap:0.625rem;padding:0.75rem 0.875rem;background:#0a1824;border-bottom:1px solid var(--line)}
.cw-panel header b{display:block}
.cw-panel header small{color:var(--muted)}
.cw-panel header button{width:2.5rem;height:2.5rem;border-radius:0.5rem;border:0;background:none;color:var(--fg);font-size:1.6rem;line-height:1;cursor:pointer}
.cw-log{flex:1;overflow-y:auto;padding:0.875rem;display:flex;flex-direction:column;gap:0.5rem}
.cw-msg{max-width:84%;padding:0.5625rem 0.75rem;border-radius:0.75rem;overflow-wrap:anywhere;white-space:pre-wrap;font-size:.96rem}
.cw-msg.them{align-self:flex-start;background:#0f2233;border:1px solid var(--line)}
.cw-msg.me{align-self:flex-end;background:var(--gold);color:var(--gold-ink)}
.cw-msg.err{align-self:stretch;max-width:none;background:rgba(181,88,74,.15);border:1px solid #b5584a;color:#ffd5cc;font-size:.9rem}
.cw-who{border-top:1px solid var(--line);padding:0.5rem 0.875rem;font-size:.88rem;color:var(--muted)}
.cw-who summary{cursor:pointer}
.cw-who input{width:100%;margin-top:0.5rem;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:0.375rem;padding:0.625rem;font:inherit}
.cw-form{display:flex;gap:0.5rem;padding:0.625rem 0.75rem;border-top:1px solid var(--line);align-items:flex-end}
.cw-form textarea{flex:1;resize:none;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:0.5rem;padding:0.625rem;font:inherit;max-height:6.875rem}
.cw-form button{flex:none;width:2.875rem;height:2.75rem;border-radius:0.5rem;border:0;background:var(--gold);color:var(--gold-ink);font-size:1.15rem;cursor:pointer}
.cw-form button:disabled{opacity:.6}
@media (max-width:32.5rem){.cw-panel{right:0;bottom:0;width:100vw;height:min(35rem,88dvh);border-radius:0.875rem 0.875rem 0 0}}

.cw-panel header small.on{color:#7fe0a2}
.cw-from{display:block;font:700 .76rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:2px}
.cw-msg.auto .cw-from{color:var(--muted)}
.cw-tick{margin-left:0.5rem;font-size:.78rem;opacity:.7;float:right;padding-top:3px}
.cw-link{display:block;color:var(--gold);margin-top:0.375rem;text-underline-offset:3px}
.cw-chips{display:flex;flex-wrap:wrap;gap:0.5rem;align-self:flex-start}
.cw-chips button{border:1px solid var(--gold);background:none;color:var(--gold);border-radius:6.1875rem;padding:0.5rem 0.875rem;font:inherit;font-size:.88rem;cursor:pointer}
.cw-chips button:hover{background:rgba(226,180,79,.12)}

.row.svc{grid-template-columns:8.125rem minmax(0,1fr) auto;align-items:start}
.svc-price{font:700 1.1rem var(--mono);color:var(--gold);white-space:nowrap;text-align:right;padding-top:2px}
.svc-price span{font-size:.8rem;font-weight:500;color:var(--muted)}
.svc-price s{display:block;color:var(--muted);font-weight:400;font-size:.82rem}
.svc-more{grid-column:2/-1;margin-top:0.375rem}
.svc-more summary{cursor:pointer;color:var(--gold);font-size:.9rem;list-style:none;width:max-content}
.svc-more summary::-webkit-details-marker{display:none}
.svc-more summary::after{content:" ▾"}
.svc-more[open] summary::after{content:" ▴"}
.svc-more summary:focus-visible{outline:3px solid var(--gold);outline-offset:3px}
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
.logo{min-width:0}
@media (max-width:35rem){.svc-price{white-space:normal}.svc-price .svc-note{display:inline-block;margin-left:.5rem}}
`;
