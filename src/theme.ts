/**
 * Автоматическая смена светлой и тёмной темы по московскому времени.
 * Код для браузера лежит строкой, чтобы одна и та же формула работала и на сайте, и в админке.
 * Писать его надо без обратных кавычек, `${` и обратных косых черт.
 */

export interface ThemeCfg { mode: 'sun' | 'hours' | 'light' | 'dark'; from: string; to: string }

/**
 * sunMsk(y, m, d) даёт восход и закат Липецка (52,6° с. ш., 39,57° в. д.) в миллисекундах UTC
 * для даты по Москве (m от 0). dayState(c, now) отвечает, день ли сейчас и когда ближайшая смена.
 * fmtMsk(ms) печатает время по Москве как ЧЧ:ММ.
 */
export const SUN_LIB = `
function sunMsk(y,m,d){
  var R=Math.PI/180,n=Math.round(Date.UTC(y,m,d,12)/864e5+2440587.5-2451545),js=n-39.57/360,
  M=(357.5291+0.98560028*js)%360,
  C=1.9148*Math.sin(M*R)+0.02*Math.sin(2*M*R)+0.0003*Math.sin(3*M*R),
  L=(M+C+180+102.9372)%360,
  jt=2451545+js+0.0053*Math.sin(M*R)-0.0069*Math.sin(2*L*R),
  sd=Math.sin(L*R)*Math.sin(23.4397*R),cd=Math.sqrt(1-sd*sd),
  cw=(Math.sin(-0.833*R)-Math.sin(52.6*R)*sd)/(Math.cos(52.6*R)*cd),
  w=Math.acos(Math.max(-1,Math.min(1,cw)))/R/360;
  return [(jt-w-2440587.5)*864e5,(jt+w-2440587.5)*864e5];
}
function hmMs(s){var a=String(s).split(':');return(+a[0]*60+ +a[1])*6e4}
function dayState(c,now){
  var H=3*36e5,t=new Date(now+H),y=t.getUTCFullYear(),m=t.getUTCMonth(),d=t.getUTCDate(),a,b,e;
  if(c.m==='light')return{day:true,next:0};
  if(c.m==='dark')return{day:false,next:0};
  if(c.m==='hours'&&hmMs(c.t)>hmMs(c.f)){
    var base=Date.UTC(y,m,d)-H;a=base+hmMs(c.f);b=base+hmMs(c.t);e=base+864e5+hmMs(c.f);
  }else{
    var s0=sunMsk(y,m,d),s1=sunMsk(y,m,d+1);a=s0[0];b=s0[1];e=s1[0];
  }
  if(now<a)return{day:false,next:a};
  if(now<b)return{day:true,next:b};
  return{day:false,next:e};
}
function fmtMsk(ms){var t=new Date(ms+3*36e5),p=function(x){return(x<10?'0':'')+x};return p(t.getUTCHours())+':'+p(t.getUTCMinutes())}
`;

/**
 * Скрипт в <head> публичной страницы: ставит тему до первой отрисовки, сам меняет её на восходе и закате
 * и обслуживает кнопку в шапке. Ручной выбор посетителя действует до ближайшей смены дня и ночи.
 */
export function themeHead(cfg: ThemeCfg): string {
  const c = JSON.stringify({ m: cfg.mode, f: cfg.from, t: cfg.to }).replace(/</g, '\\u003c');
  return `<script>(function(){${SUN_LIB}
var C=${c},R=document.documentElement,K='theme2',tm=0,btn=null;
try{localStorage.removeItem('theme')}catch(e){}
function read(){try{var o=JSON.parse(localStorage.getItem(K)||'null');return o&&(o.t==='light'||o.t==='dark')?o:null}catch(e){return null}}
function clear(){try{localStorage.removeItem(K)}catch(e){}}
function pick(){
  var n=Date.now(),s=dayState(C,n),th=s.day?'light':'dark',o=read();
  if(o){if(o.m===C.m&&o.u>n)th=o.t;else clear()}
  return{th:th,s:s};
}
function label(){
  if(!btn)return;
  btn.setAttribute('aria-label',R.getAttribute('data-theme')==='light'?'Включить тёмную тему':'Включить светлую тему');
  btn.title=(C.m==='sun'||C.m==='hours')?'Сайт сам переключается: днём светлая, ночью тёмная. Нажмите, чтобы сменить вручную':'Сменить тему';
}
function put(th){
  if(R.getAttribute('data-theme')===th)return;
  var set=function(){R.setAttribute('data-theme',th);label()};
  if(R.hasAttribute('data-theme')&&document.startViewTransition&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    try{document.startViewTransition(set);return}catch(e){}
  }
  set();
}
function tick(){
  var p=pick();put(p.th);clearTimeout(tm);
  if(p.s.next)tm=setTimeout(tick,Math.min(Math.max(p.s.next-Date.now()+1500,1000),2147483647));
}
tick();
document.addEventListener('visibilitychange',function(){if(!document.hidden)tick()});
addEventListener('pageshow',function(e){if(e.persisted)tick()});
document.addEventListener('DOMContentLoaded',function(){
  btn=document.getElementById('theme-btn');if(!btn)return;label();
  btn.addEventListener('click',function(){
    var n=Date.now(),s=dayState(C,n),nx=R.getAttribute('data-theme')==='light'?'dark':'light';
    if(nx===(s.day?'light':'dark'))clear();
    else{try{localStorage.setItem(K,JSON.stringify({t:nx,m:C.m,u:s.next||n+2592e6}))}catch(e){}}
    put(nx);
  });
});
})()</script>`;
}
