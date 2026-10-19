export const CSS = `
/* Вариант В: спокойный и аккуратный, синяя «чертёжная» гамма, тонкие линии, профиль ключа как главный образ */
:root{--bg:#0f2233;--panel:#14304a;--line:#2b5276;--fg:#e8f0f7;--muted:#9fb6ca;--gold:#e2b44f;--gold-ink:#1a1405;color-scheme:dark;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--body:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--fg);font:16px/1.6 var(--body);
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:40px 40px;background-position:-1px -1px;background-attachment:scroll}
a{color:inherit}
.wrap{max-width:1000px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1,h2,h3{margin:0;font-weight:600;line-height:1.2;text-wrap:balance}
.lbl{font-family:var(--mono);font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:#0a1824;border-bottom:1px solid var(--line)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:30;background:#0a1824}
.bar .wrap{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-block:11px}
.logo{text-decoration:none;font-weight:700;letter-spacing:.01em;font-size:clamp(1.1rem,4.6vw,1.65rem);line-height:1.15}
.logo b{color:var(--gold)}
.tel{border:1px solid var(--gold);color:var(--gold);text-decoration:none;padding:8px 14px;border-radius:6px;font-family:var(--mono);font-size:clamp(.9rem,3.4vw,1.05rem);white-space:nowrap}
.hero{padding-block:48px 40px}
.hero .wrap{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:30px;align-items:center}
.hero h1{font-size:clamp(2rem,7vw,3.4rem);margin:12px 0 16px}
.hero p{color:var(--muted);max-width:44ch;margin:0 0 24px}
.btns{display:flex;flex-wrap:wrap;gap:10px}
.btn{display:inline-flex;align-items:center;min-height:50px;padding:0 22px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid var(--line)}
.btn.gold{background:var(--gold);color:var(--gold-ink);border-color:var(--gold)}
.btn:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.key{width:100%;height:auto;color:var(--gold)}
.state{margin-top:22px;font-family:var(--mono);font-size:.85rem;color:var(--muted)}
@media (max-width:700px){.hero .wrap{grid-template-columns:1fr}.key{max-width:420px}}
section{padding-block:40px}
h2{font-size:clamp(1.5rem,4.5vw,2rem);margin:8px 0 22px}
.rows{display:grid;gap:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel)}
.row{display:grid;grid-template-columns:130px minmax(0,1fr);gap:16px;padding:18px 20px;border-top:1px solid var(--line)}
.row:first-child{border-top:0}
.row h3{font-size:1.1rem}
.row p{margin:4px 0 0;color:var(--muted)}
.row .lbl{padding-top:3px}
@media (max-width:560px){.row{grid-template-columns:1fr;gap:4px}}
.tags{display:flex;flex-wrap:wrap;gap:8px}
.tag{border:1px solid var(--line);background:var(--panel);padding:10px 16px;border-radius:6px}
.vrow{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:28px;align-items:center}
.vbox{position:relative;aspect-ratio:9/16;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#06101a;width:100%}
.vbox iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.vplay{position:absolute;inset:0;width:100%;border:0;background:linear-gradient(160deg,var(--panel),#06101a);color:var(--fg);font:600 1rem var(--body);cursor:pointer;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center}
.vplay i{width:62px;height:62px;border-radius:50%;border:2px solid var(--gold);display:grid;place-items:center}
.vplay i::after{content:"";border-left:17px solid var(--gold);border-top:10px solid transparent;border-bottom:10px solid transparent;margin-left:4px}
.vrow p{color:var(--muted);margin:0 0 16px}
@media (max-width:640px){.vrow{grid-template-columns:1fr}.vbox{max-width:270px;margin:0 auto}}
footer{background:#0a1824;border-top:1px solid var(--line);padding-block:40px 28px}
.info{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:26px}
.info p{margin:6px 0 0}
.info a{color:var(--gold);text-underline-offset:3px}
.hrs{width:100%;border-collapse:collapse;margin-top:6px}
.hrs td{padding:3px 0}.hrs td:last-child{text-align:right;font-family:var(--mono);font-size:.9rem}
.copy{margin-top:30px;color:var(--muted);font-size:.88rem}

.goods{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
.good{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
.good .t{padding:12px 14px 14px;display:flex;flex-direction:column;gap:4px;flex:1}
.good h3{font-size:1.02rem}
.good p{margin:0;color:var(--muted);font-size:.9rem}
.good .pr{margin-top:auto;padding-top:6px;font-family:var(--mono);color:var(--gold);font-weight:600}
.good .pr.ask{color:var(--muted);font-weight:400;font-size:.85rem}
.empty{color:var(--muted)}

.lead{max-width:520px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:20px}
.lead label{display:block;margin:14px 0 6px;font-weight:600}
.lead label:first-child{margin-top:0}
.lead input[type=text],.lead input[type=tel],.lead textarea{width:100%;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:12px;font:inherit}
.lead textarea{min-height:84px;resize:vertical}
.lead input:focus-visible,.lead textarea:focus-visible{outline:3px solid var(--gold);outline-offset:1px}
.lead .btn{margin-top:18px;width:100%;cursor:pointer;font:inherit;font-weight:700;border:0}
.lead .btn:disabled{opacity:.6;cursor:default}
.lead .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}

.gal-wrap{position:relative}
.gal{position:relative}
.gal-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.gal-track::-webkit-scrollbar{display:none}
.gal-track img{flex:0 0 100%;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;scroll-snap-align:start;background:var(--bg);display:block}
.gal-cnt{position:absolute;right:8px;bottom:8px;background:rgba(6,16,26,.75);color:var(--fg);font:.75rem var(--mono);padding:3px 8px;border-radius:99px}
.ph{aspect-ratio:4/3;background:repeating-linear-gradient(135deg,var(--bg) 0 12px,var(--line) 12px 13px);display:grid;place-items:center;color:var(--muted);font-size:.8rem}
.badge{position:absolute;left:8px;top:8px;font:700 .72rem var(--mono);letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:5px}
.badge.sale{background:var(--gold);color:var(--gold-ink)}
.badge.out{top:auto;bottom:8px;left:8px;background:#3a4650;color:#dfe6ec}
.is-out .gal-track,.is-out .ph{filter:grayscale(.8);opacity:.7}
.good .pr s{color:var(--muted);font-weight:400;font-size:.85rem;margin-right:4px}
.vc{position:relative}
.vc-track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:4px}
.vc-track::-webkit-scrollbar{display:none}
.vcard{flex:0 0 min(70vw,250px);scroll-snap-align:start;display:flex;flex-direction:column;gap:8px}
.vcard .vbox{max-width:none;margin:0}
.vplay img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9}
.vplay i{position:relative}
.vlink{font-size:.88rem;color:var(--gold);text-underline-offset:3px}
.vc-btn{position:absolute;top:42%;z-index:2;width:42px;height:42px;border-radius:50%;border:1px solid var(--line);background:rgba(10,24,36,.88);color:var(--fg);font-size:1.5rem;line-height:1;cursor:pointer}
.vc-btn.prev{left:-6px}.vc-btn.next{right:-6px}
.vc-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px}

.vfs{position:absolute;top:8px;right:8px;z-index:3;width:38px;height:38px;border-radius:8px;border:1px solid rgba(255,255,255,.35);background:rgba(6,16,26,.7);color:#fff;font-size:1.15rem;line-height:1;cursor:pointer}
.vfs:hover{background:rgba(6,16,26,.9)}
.vfs:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.vbox:fullscreen,.vbox.vfull{width:100vw;height:100vh;max-width:none;aspect-ratio:auto;border-radius:0;border:0;background:#000}
.vbox.vfull{position:fixed;inset:0;z-index:100;width:auto;height:auto}
.vbox:fullscreen .vfs,.vbox.vfull .vfs{top:max(12px,env(safe-area-inset-top,0px));right:max(12px,env(safe-area-inset-right,0px))}
html.vlock{overflow:hidden}

.lf-status{margin:16px 0 0;display:flex;gap:14px;align-items:center;border-radius:8px;padding:14px 16px;border:1px solid var(--gold);background:rgba(226,180,79,.08)}
.lf-status[hidden]{display:none}
.lf-status .ico{flex:none;width:38px;height:38px;border-radius:50%;background:var(--gold);color:var(--gold-ink);display:grid;place-items:center}
.lf-status b{display:block}
.lf-status span>span{color:var(--muted);font-size:.92rem}
.lf-status.bad{border-color:#b5584a;background:rgba(181,88,74,.12)}
.lf-status.bad .ico{background:#b5584a;color:#fff;font-size:1.2rem}

.cw-btn{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));z-index:50;display:flex;align-items:center;gap:10px;height:56px;padding:0 17px;border-radius:99px;border:0;background:var(--gold);color:var(--gold-ink);font:700 1rem var(--body);cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45)}
.cw-btn.cw-hide{display:none}
.cw-label{display:none}
@media (min-width:720px){.cw-label{display:inline}}
.cw-btn:focus-visible,.cw-panel button:focus-visible,.cw-panel textarea:focus-visible,.cw-panel input:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.cw-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#e5533d;border:2px solid var(--bg)}
.cw-panel{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));z-index:60;width:min(360px,calc(100vw - 32px));height:min(520px,calc(100dvh - 32px));display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.55);overflow:hidden}
.cw-panel[hidden]{display:none}
.cw-panel header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#0a1824;border-bottom:1px solid var(--line)}
.cw-panel header b{display:block}
.cw-panel header small{color:var(--muted)}
.cw-panel header button{width:40px;height:40px;border-radius:8px;border:0;background:none;color:var(--fg);font-size:1.6rem;line-height:1;cursor:pointer}
.cw-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
.cw-msg{max-width:84%;padding:9px 12px;border-radius:12px;overflow-wrap:anywhere;white-space:pre-wrap;font-size:.96rem}
.cw-msg.them{align-self:flex-start;background:#0f2233;border:1px solid var(--line)}
.cw-msg.me{align-self:flex-end;background:var(--gold);color:var(--gold-ink)}
.cw-msg.err{align-self:stretch;max-width:none;background:rgba(181,88,74,.15);border:1px solid #b5584a;color:#ffd5cc;font-size:.9rem}
.cw-who{border-top:1px solid var(--line);padding:8px 14px;font-size:.88rem;color:var(--muted)}
.cw-who summary{cursor:pointer}
.cw-who input{width:100%;margin-top:8px;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:10px;font:inherit}
.cw-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--line);align-items:flex-end}
.cw-form textarea{flex:1;resize:none;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:10px;font:inherit;max-height:110px}
.cw-form button{flex:none;width:46px;height:44px;border-radius:8px;border:0;background:var(--gold);color:var(--gold-ink);font-size:1.15rem;cursor:pointer}
.cw-form button:disabled{opacity:.6}
@media (max-width:520px){.cw-panel{right:0;bottom:0;width:100vw;height:min(560px,88dvh);border-radius:14px 14px 0 0}}

.cw-panel header small.on{color:#7fe0a2}
.cw-from{display:block;font:700 .68rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:2px}
.cw-msg.auto .cw-from{color:var(--muted)}
.cw-tick{margin-left:8px;font-size:.78rem;opacity:.7;float:right;padding-top:3px}
.cw-link{display:block;color:var(--gold);margin-top:6px;text-underline-offset:3px}
.cw-chips{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start}
.cw-chips button{border:1px solid var(--gold);background:none;color:var(--gold);border-radius:99px;padding:8px 14px;font:inherit;font-size:.88rem;cursor:pointer}
.cw-chips button:hover{background:rgba(226,180,79,.12)}
`;
