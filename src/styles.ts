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
.logo{text-decoration:none;font-weight:600;letter-spacing:.02em}
.logo b{color:var(--gold)}
.tel{border:1px solid var(--gold);color:var(--gold);text-decoration:none;padding:8px 14px;border-radius:6px;font-family:var(--mono);font-size:.9rem;white-space:nowrap}
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
.good .ph{aspect-ratio:4/3;background:repeating-linear-gradient(135deg,var(--bg) 0 12px,var(--line) 12px 13px);display:grid;place-items:center;color:var(--muted);font-size:.8rem}
.good img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;background:var(--bg)}
.good .t{padding:12px 14px 14px;display:flex;flex-direction:column;gap:4px;flex:1}
.good h3{font-size:1.02rem}
.good p{margin:0;color:var(--muted);font-size:.9rem}
.good .pr{margin-top:auto;padding-top:6px;font-family:var(--mono);color:var(--gold);font-weight:600}
.good .pr.ask{color:var(--muted);font-weight:400;font-size:.85rem}
.empty{color:var(--muted)}
`;
