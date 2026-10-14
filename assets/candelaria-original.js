// Texto, cartografía, estadísticas y secuencia de indexv1; aislados del mapa de distritos.
(() => {
'use strict';
const currentLang='es';
const localeCode=()=> 'es-ES';
const tr=(es,en)=>es;
const formatDecimal=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const cmTimeouts=new Set();
function scheduleCm(fn,delay){const id=setTimeout(()=>{cmTimeouts.delete(id);fn();},delay);cmTimeouts.add(id);return id;}
function stopCmTimers(){clearInterval(cmTimer);cmTimeouts.forEach(clearTimeout);cmTimeouts.clear();}
function getAvatarSVG(profile,scale=1){
  const s=scale;
  const inkColor='#1a1815';
  if(profile==='pedestrian')return`<svg width="${28*s}" height="${46*s}" viewBox="0 0 28 46" fill="none"><circle cx="14" cy="6" r="5" fill="${inkColor}"/><rect x="10" y="13" width="8" height="16" rx="4" fill="${inkColor}"/><rect x="10" y="27" width="4" height="14" rx="2" fill="${inkColor}"/><rect x="14" y="27" width="4" height="14" rx="2" fill="#333"/><rect x="4" y="14" width="3" height="12" rx="1.5" fill="${inkColor}"/><rect x="21" y="14" width="3" height="12" rx="1.5" fill="${inkColor}"/></svg>`;
  if(profile==='stroller')return `
	<svg width="${48*s}" height="${48*s}">
	  <use href="#icon-stroller"></use>
	</svg>`;
  if(profile==='double')return`
	<svg width="${60*s}" height="${50*s}" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">

	  <!-- Person -->
	  <circle cx="48" cy="6" r="5" fill="#1a1815"/>
	  <rect x="44" y="12" width="8" height="14" rx="4" fill="#1a1815"/>
	  <rect x="45" y="24" width="3" height="12" rx="1.5" fill="#1a1815"/>
	  <rect x="49" y="24" width="3" height="12" rx="1.5" fill="#333"/>

	  <!-- Handlebar -->
	  <rect x="36" y="14" width="12" height="3" rx="1.5" fill="#4a4540"/>

	  <!-- Twin stroller body -->
	  <rect x="4" y="18" width="34" height="14" rx="4" fill="#4a4540"/>

	  <!-- Two seats (separated visually) -->
	  <rect x="6" y="18" width="14" height="12" rx="3" fill="#5a544e"/>
	  <rect x="22" y="18" width="14" height="12" rx="3" fill="#5a544e"/>

	  <!-- Babies -->
	  <circle cx="13" cy="24" r="3.5" fill="#c9a98c"/>
	  <circle cx="29" cy="24" r="3.5" fill="#c9a98c"/>

	  <!-- Canopy hint (like real stroller) -->
	  <path d="M6 18 Q13 10 20 18" fill="#3f3a35"/>
	  <path d="M22 18 Q29 10 36 18" fill="#3f3a35"/>

	  <!-- Wheels (realistic 4-wheel layout) -->
	  <circle cx="8" cy="34" r="3.5" fill="#1a1815"/>
	  <circle cx="18" cy="34" r="3.5" fill="#1a1815"/>
	  <circle cx="26" cy="34" r="3.5" fill="#1a1815"/>
	  <circle cx="34" cy="34" r="3.5" fill="#1a1815"/>

	</svg>`;
  // wheelchair
  return`<svg width="${46*s}" height="${50*s}" viewBox="0 0 46 50" fill="none" xmlns="http://www.w3.org/2000/svg">
	  <!-- person -->
	  <circle cx="28" cy="6" r="5" fill="#1a1815"/>
	  <rect x="24" y="12" width="9" height="13" rx="4" fill="#1a1815"/>

	  <!-- backrest and seat -->
	  <rect x="26" y="17" width="4" height="14" rx="2" fill="#0055a0"/>
	  <rect x="14" y="27" width="19" height="4" rx="2" fill="#0055a0"/>

	  <!-- legs / footrest -->
	  <path d="M24 28 L33 36" stroke="#1a1815" stroke-width="3" stroke-linecap="round"/>
	  <rect x="30" y="36" width="12" height="3" rx="1.5" fill="#0055a0"/>

	  <!-- arm -->
	  <path d="M25 19 L17 27" stroke="#1a1815" stroke-width="3" stroke-linecap="round"/>

	  <!-- big wheel -->
	  <circle cx="17" cy="36" r="12" fill="none" stroke="#1a1815" stroke-width="3"/>
	  <circle cx="17" cy="36" r="2" fill="#1a1815"/>
	  <line x1="17" y1="24" x2="17" y2="48" stroke="#1a1815" stroke-width="1"/>
	  <line x1="5" y1="36" x2="29" y2="36" stroke="#1a1815" stroke-width="1"/>
	  <line x1="9" y1="28" x2="25" y2="44" stroke="#1a1815" stroke-width="1"/>
	  <line x1="25" y1="28" x2="9" y2="44" stroke="#1a1815" stroke-width="1"/>

	  <!-- front small wheel -->
	  <circle cx="38" cy="42" r="4" fill="none" stroke="#1a1815" stroke-width="2"/>
	</svg>`;
}

const CM_THRESHOLD = 1.8;

const CM_CENTER = {lat:40.386525, lon:-3.69349};
const CM_ZOOM = 19;

const CM_GEOJSON_FILES = [
  {name:'C. Candelaria Mora', url:'./Candelaria_Mora.geojson', main:true},
  {name:'C. Julián Rabanedo', url:'./julianRabanedo.geojson', main:false},
  {name:'C. Ricardo Goizueta', url:'./ricardoGoizueta.geojson', main:false},
  {name:'C. Jesús Goldero', url:'./jesusGoldero.geojson', main:false},
  {name:'C. Ricardo Damas', url:'./ricardoDamas.geojson', main:false}
];

let cmLayers = [];
let cmPoints = [];
let cmAllPoints = [];
let cmRoutePoints = [];
let cmBreakIndex = -1;
let cmStarted = false;
let cmTimer = null;
let cmDataLoaded = false;
let cmLoadingPromise = null;

function cmWidthColor(w){
  if(!Number.isFinite(w)) return '#1a7a5e';
  if(w >= 1.8) return '#1a7a5e';
  if(w >= 1.5) return '#e67e22';
  if(w >= 1.2) return '#d35400';
  return '#c0392b';
}

function fmtComma(n,d=1){
  return Number(n).toLocaleString(localeCode(),{minimumFractionDigits:d,maximumFractionDigits:d});
}

function detectWidth(props={}){
  const keys=['anchura_m','width_m','width','meters','metres','ancho_m','ancho','anchura'];
  for(const k of keys){
    const v=Number(props[k]);
    if(Number.isFinite(v)) return v;
  }
  return null;
}

async function loadGeoJSON(url){
  const response = await fetch(url, {cache:'no-store'});
  if(!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
  return await response.json();
}

async function loadCandelariaData(){
  if(cmDataLoaded) return cmLayers;
  if(cmLoadingPromise) return cmLoadingPromise;

  cmLoadingPromise = Promise.all(
    CM_GEOJSON_FILES.map(async layer => {
      try{
        const data = await loadGeoJSON(layer.url);
        return {...layer, data};
      }catch(err){
        console.warn(err);
        return {...layer, data:{type:'FeatureCollection', features:[]}, error:err};
      }
    })
  ).then(layers => {
    cmLayers = layers;
    cmDataLoaded = true;
    return cmLayers;
  });

  return cmLoadingPromise;
}

function lonLatToWorldPx(lon,lat,z){
  const sin=Math.sin(lat*Math.PI/180);
  const scale=256*Math.pow(2,z);
  return {
    x:(lon+180)/360*scale,
    y:(0.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*scale
  };
}

function utm30ToLonLat(x,y){
  const a=6378137, f=1/298.257223563, k0=0.9996, e=Math.sqrt(f*(2-f));
  const e1=(1-Math.sqrt(1-e*e))/(1+Math.sqrt(1-e*e));
  const x0=x-500000, M=y/k0, mu=M/(a*(1-e*e/4-3*Math.pow(e,4)/64-5*Math.pow(e,6)/256));
  const J1=3*e1/2-27*Math.pow(e1,3)/32, J2=21*Math.pow(e1,2)/16-55*Math.pow(e1,4)/32, J3=151*Math.pow(e1,3)/96, J4=1097*Math.pow(e1,4)/512;
  const fp=mu+J1*Math.sin(2*mu)+J2*Math.sin(4*mu)+J3*Math.sin(6*mu)+J4*Math.sin(8*mu);
  const ep2=e*e/(1-e*e), C1=ep2*Math.pow(Math.cos(fp),2), T1=Math.pow(Math.tan(fp),2);
  const R1=a*(1-e*e)/Math.pow(1-e*e*Math.pow(Math.sin(fp),2),1.5), N1=a/Math.sqrt(1-e*e*Math.pow(Math.sin(fp),2));
  const D=x0/(N1*k0);
  const lat=fp-(N1*Math.tan(fp)/R1)*(D*D/2-(5+3*T1+10*C1-4*C1*C1-9*ep2)*Math.pow(D,4)/24+(61+90*T1+298*C1+45*T1*T1-252*ep2-3*C1*C1)*Math.pow(D,6)/720);
  const lon0=-3*Math.PI/180;
  const lon=lon0+(D-(1+2*T1+C1)*Math.pow(D,3)/6+(5-2*C1+28*T1-3*C1*C1+8*ep2+24*T1*T1)*Math.pow(D,5)/120)/Math.cos(fp);
  return {lon:lon*180/Math.PI, lat:lat*180/Math.PI};
}

function coordToLonLat(coord){
  const x=+coord[0], y=+coord[1];
  if(Math.abs(x)<=180 && Math.abs(y)<=90) return {lon:x, lat:y};
  return utm30ToLonLat(x,y);
}

function flattenGeoJSONPoints(geojson,sourceName='',main=false){
  const out=[];
  const feats=(geojson && geojson.features) || [];
  function pushPoint(coord,props={},idx=0){
    if(!Array.isArray(coord) || coord.length<2) return;
    const ll=coordToLonLat(coord);
    const aceraId = props.acera_id ?? props.sidewalk_id ?? null;
    const dist = Number.isFinite(+props.dist_m) ? +props.dist_m : idx;
    out.push({
      lon:ll.lon,
      lat:ll.lat,
      width:detectWidth(props),
      dist,
      aceraId,
      source:sourceName,
      main,
      order:idx,
      uid:`${sourceName}-${aceraId ?? 'na'}-${dist}-${idx}`
    });
  }
  feats.forEach((f,fi)=>{
    const g=f.geometry, props=f.properties||{};
    if(!g) return;
    if(g.type==='Point') pushPoint(g.coordinates,props,fi);
    if(g.type==='MultiPoint') g.coordinates.forEach((c,i)=>pushPoint(c,props,fi*100000+i));
    if(g.type==='LineString') g.coordinates.forEach((c,i)=>pushPoint(c,props,fi*100000+i));
    if(g.type==='MultiLineString') g.coordinates.flat().forEach((c,i)=>pushPoint(c,props,fi*100000+i));
  });
  out.sort((a,b)=>{
    if(a.aceraId !== b.aceraId) return String(a.aceraId).localeCompare(String(b.aceraId));
    if(Number.isFinite(a.dist) && Number.isFinite(b.dist)) return a.dist-b.dist;
    return a.order-b.order;
  });
  return out;
}

function projectToCard(points,cardW,cardH){
  const center=lonLatToWorldPx(CM_CENTER.lon,CM_CENTER.lat,CM_ZOOM);
  points.forEach(p=>{
    const wp=lonLatToWorldPx(p.lon,p.lat,CM_ZOOM);
    p.sx=cardW/2+(wp.x-center.x);
    p.sy=cardH/2+(wp.y-center.y);
  });
  return points;
}

function drawSatelliteTiles(){
  const layer=document.getElementById('cm-satellite');
  const card=document.getElementById('candelaria-card');
  if(!layer || !card) return;
  const w=card.clientWidth||1000, h=card.clientHeight||620;
  layer.innerHTML='';
  const c=lonLatToWorldPx(CM_CENTER.lon,CM_CENTER.lat,CM_ZOOM);
  const left=c.x-w/2, top=c.y-h/2;
  const x0=Math.floor(left/256), x1=Math.floor((left+w)/256);
  const y0=Math.floor(top/256), y1=Math.floor((top+h)/256);
  for(let x=x0;x<=x1;x++) for(let y=y0;y<=y1;y++){
    const img=document.createElement('img');
    img.src=`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${CM_ZOOM}/${y}/${x}`;
    img.alt='';
    img.style.left=(x*256-left)+'px';
    img.style.top=(y*256-top)+'px';
    layer.appendChild(img);
  }
}

function getCandelariaPoints(){
  cmAllPoints = cmLayers.flatMap(layer => flattenGeoJSONPoints(layer.data, layer.name, !!layer.main));
  cmPoints = cmAllPoints.filter(p => p.main && Number.isFinite(p.width));
  return cmPoints;
}

const CM_START_ACERA_ID = 8467;
const CM_START_DIST = 91;
const CM_FIRST_TARGET_DIST = 72;
const CM_SECOND_TARGET_DIST = 122;

function buildRoutePoints(){
  const startCandidate = cmPoints.find(p =>
    String(p.aceraId) === String(CM_START_ACERA_ID) &&
    Math.round(p.dist) === CM_START_DIST
  );

  if(!startCandidate) return [];

  cmRoutePoints = cmPoints
    .filter(p => String(p.aceraId) === String(CM_START_ACERA_ID))
    .sort((a,b)=>a.dist-b.dist);

  return cmRoutePoints;
}

function getNearestRouteIndexByDist(targetDist){
  if(!cmRoutePoints.length) return -1;
  let bestIdx=0, bestDiff=Infinity;
  cmRoutePoints.forEach((p,i)=>{
    const diff=Math.abs(p.dist-targetDist);
    if(diff<bestDiff){bestDiff=diff;bestIdx=i;}
  });
  return bestIdx;
}

function longestAccessibleStretch(points){
  let best=0,cur=0,bestStart=0,bestEnd=0,curStart=0;
  points.forEach((p,i)=>{
    if(p.width>=CM_THRESHOLD){
      if(cur===0) curStart=i;
      cur++;
      if(cur>best){best=cur;bestStart=curStart;bestEnd=i;}
    }else cur=0;
  });
  if(best===0) return 0;
  const a=points[bestStart], b=points[bestEnd];
  if(a.dist!==null && b.dist!==null) return Math.max(best, Math.round(Math.abs(b.dist-a.dist)+1));
  return best;
}

function updateCandelariaStats(points){
  const normalWidths=points.map(p=>p.width).filter(w=>w>0&&w<8);
  const avg=normalWidths.reduce((s,w)=>s+w,0)/Math.max(1,normalWidths.length);
  const below=points.filter(p=>p.width<CM_THRESHOLD).length;
  const longest=longestAccessibleStretch(points);
  cmBreakIndex=points.findIndex(p=>p.width<CM_THRESHOLD);
  document.getElementById('cm-avg').textContent=fmtComma(avg,1)+' m';
  document.getElementById('cm-below').textContent=fmtComma((below/Math.max(1,points.length))*100,1)+'%';
  document.getElementById('cm-longest').textContent=longest+' m';
  document.getElementById('cm-first').textContent=cmBreakIndex>=0&&points[cmBreakIndex].dist!==null?Math.round(points[cmBreakIndex].dist)+' m':'—';
}

function drawPath(svg,points,cls){
  if(points.length<2) return;
  const ns='http://www.w3.org/2000/svg';
  const path=document.createElementNS(ns,'path');
  const d=points.map((p,i)=>(i?'L':'M')+p.sx.toFixed(1)+' '+p.sy.toFixed(1)).join(' ');
  path.setAttribute('d',d);
  path.setAttribute('class',cls);
  svg.appendChild(path);
}

async function drawCandelaria(){
  await loadCandelariaData();
  const svg=document.getElementById('candelaria-svg');
  const card=document.getElementById('candelaria-card');
  if(!svg || !card) return;

  const w=card.clientWidth||1000, h=card.clientHeight||620;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  svg.innerHTML='';
  drawSatelliteTiles();

  getCandelariaPoints();
  projectToCard(cmAllPoints,w,h);
  projectToCard(cmPoints,w,h);
  buildRoutePoints();

  if(!cmPoints.length){
    setCandelariaMessage(tr('No se ha podido cargar Candelaria_Mora.geojson. Ponlo en la misma carpeta que este HTML y ábrelo mediante un servidor local.','Could not load Candelaria_Mora.geojson. Put it in the same folder as this HTML and open it through a local server.'),true);
    return;
  }

  updateCandelariaStats(cmPoints);

  // Main Candelaria geometry only. Context streets are shown as dots, not as green surfaces or lines.
  const bySidewalk={};
  cmPoints.forEach(p=>{(bySidewalk[p.aceraId ?? 'main'] ||= []).push(p);});
  Object.values(bySidewalk).forEach(arr=>drawPath(svg,arr,'candelaria-base-line'));

  const ns='http://www.w3.org/2000/svg';

  // Context dots from the three other GeoJSONs: visible but visually secondary.
  cmAllPoints.filter(p=>!p.main).forEach((p)=>{
    const c=document.createElementNS(ns,'circle');
    c.setAttribute('cx',p.sx);
    c.setAttribute('cy',p.sy);
    c.setAttribute('r',3.6);
    c.setAttribute('fill',cmWidthColor(p.width));
    c.setAttribute('class','candelaria-point context');
    svg.appendChild(c);
  });

  // Main Candelaria dots: stronger hierarchy, categorized by width.
  cmPoints.forEach((p,i)=>{
    const c=document.createElementNS(ns,'circle');
    c.setAttribute('cx',p.sx);
    c.setAttribute('cy',p.sy);
    c.setAttribute('r',5.4);
    c.setAttribute('fill',cmWidthColor(p.width));
    c.setAttribute('class','candelaria-point main');
    c.dataset.uid=p.uid;
    c.dataset.width=Number.isFinite(p.width)?p.width.toFixed(2):'';
    c.dataset.dist=Number.isFinite(p.dist)?Math.round(p.dist):'';
    c.dataset.idx=i;
    svg.appendChild(c);
  });

  const avatar=document.getElementById('cm-avatar');
  setCmAvatarSvg(false);
  placeCandelariaOverlayByPoint(cmRoutePoints[getNearestRouteIndexByDist(CM_START_DIST)] || cmPoints[0], false);
}


function setCmAvatarSvg(useSecond=false){
  const avatar=document.getElementById('cm-avatar');
  avatar.innerHTML=getAvatarSVG('wheelchair',.06);
  avatar.firstElementChild.style.transform=useSecond?'scaleX(-1)':'';
}

function placeCandelariaOverlayByPoint(p,showBreak){
  if(!p) return;
  const avatar=document.getElementById('cm-avatar');
  avatar.style.left=p.sx+'px';
  avatar.style.top=p.sy+'px';
  const label=document.getElementById('cm-break-label');
  label.style.left=p.sx+'px';
  label.style.top=p.sy+'px';
  label.classList.toggle('show',!!showBreak);
}

function setCandelariaMessage(htmlText,show=true){
  const msg=document.getElementById('cm-blocked-msg');
  msg.innerHTML=htmlText;
  msg.classList.toggle('show',!!show);
}

function setBreakLabelForPoint(point,text,show=true){
  const label=document.getElementById('cm-break-label');
  if(!point) return;
  label.textContent=text;
  label.style.left=point.sx+'px';
  label.style.top=point.sy+'px';
  label.classList.toggle('show',!!show);
}

function clearRouteDotState(){
  document.querySelectorAll('.candelaria-point.main').forEach(el=>{
    el.classList.remove('before-break','active-point','bad-stop');
    el.setAttribute('r',5.4);
  });
}

function markDot(point,cls,r=8){
  if(!point) return;
  const safeUid = CSS.escape(point.uid);
  const dot=document.querySelector(`.candelaria-point.main[data-uid="${safeUid}"]`);
  if(dot){
    dot.classList.add(cls);
    dot.setAttribute('r',r);
  }
}

function unmarkActive(point){
  if(!point) return;
  const safeUid = CSS.escape(point.uid);
  const dot=document.querySelector(`.candelaria-point.main[data-uid="${safeUid}"]`);
  if(dot){
    dot.classList.remove('active-point');
    dot.classList.add('before-break');
    dot.setAttribute('r',5.4);
  }
}

function getRouteBetweenRouteIndexes(startIndex,targetIndex){
  if(startIndex<0 || targetIndex<0) return [];
  const step=startIndex<=targetIndex ? 1 : -1;
  const route=[];
  for(let i=startIndex; step>0 ? i<=targetIndex : i>=targetIndex; i+=step){
    route.push(cmRoutePoints[i]);
  }
  return route;
}

function animateRouteSequence(route,message,onEnd){
  clearInterval(cmTimer);

  const avatar=document.getElementById('cm-avatar');
  avatar.classList.add('moving');
  avatar.classList.remove('blocked');
  document.getElementById('cm-break-label').classList.remove('show');
  setCandelariaMessage(message,true);

  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    const point=route.find(p=>p.width<CM_THRESHOLD)||route[route.length-1];
    if(point){placeCandelariaOverlayByPoint(point,false);markDot(point,'bad-stop',10);setBreakLabelForPoint(point,`${Math.round(point.dist)} m · ${formatDecimal(point.width,2)} m`,true);}
    avatar.classList.remove('moving');
    if(onEnd)scheduleCm(()=>onEnd(!!point&&point.width<CM_THRESHOLD),1600);
    return;
  }
  let step=0;

  cmTimer=setInterval(()=>{
    const point=route[step];

    if(!point){
      clearInterval(cmTimer);
      avatar.classList.remove('moving');
      scheduleCm(()=>{if(onEnd)onEnd(false);},850);
      return;
    }

    placeCandelariaOverlayByPoint(point,false);
    markDot(point,'active-point',8);

    if(step>0) unmarkActive(route[step-1]);

    // AQUÍ ESTÁ LA LÓGICA IMPORTANTE:
    // parar en el primer punto menor de 1.8 m
    if(Number.isFinite(point.width) && point.width < CM_THRESHOLD){
      clearInterval(cmTimer);
      avatar.classList.remove('moving');
      avatar.classList.add('blocked');

      markDot(point,'bad-stop',10);

      setBreakLabelForPoint(
        point,
        `${tr('Corte','Break')} · ${Math.round(point.dist)} m · ${formatDecimal(point.width,2)} m`,
        true
      );

      setCandelariaMessage(
        currentLang==='en' ? `Blocked at meter ${Math.round(point.dist)}: the sidewalk is ${formatDecimal(point.width,2)} m wide, below ${formatDecimal(CM_THRESHOLD,1)} m.` : `Bloqueado en el metro ${Math.round(point.dist)}: la acera mide ${formatDecimal(point.width,2)} m, por debajo de ${formatDecimal(CM_THRESHOLD,1)} m.`,
        true
      );

      scheduleCm(()=>{if(onEnd)onEnd(true);},1600);
      return;
    }

    // si llega al final del target sin romper
    const isLast=step===route.length-1;
    if(isLast){
      clearInterval(cmTimer);
      avatar.classList.remove('moving');

      setBreakLabelForPoint(
        point,
        `${tr('Alcanza','Reaches')} · ${Math.round(point.dist)} m`,
        true
      );

      setCandelariaMessage(
        currentLang==='en' ? `This direction reaches meter ${Math.round(point.dist)} without finding a point below ${formatDecimal(CM_THRESHOLD,1)} m.` : `Este sentido alcanza el metro ${Math.round(point.dist)} sin encontrar un punto por debajo de ${formatDecimal(CM_THRESHOLD,1)} m.`,
        true
      );

      scheduleCm(()=>{if(onEnd)onEnd(false);},1000);
      return;
    }

    step++;
  },400);
}

async function animateCandelariaRoute(){
  stopCmTimers();
  if(!cmDataLoaded || !cmPoints.length) await drawCandelaria();
  if(!cmRoutePoints.length) return;

  clearRouteDotState();

  const startIndex=getNearestRouteIndexByDist(CM_START_DIST);
  const firstTarget=getNearestRouteIndexByDist(CM_FIRST_TARGET_DIST);
  const secondTarget=getNearestRouteIndexByDist(CM_SECOND_TARGET_DIST);

  const startPoint=cmRoutePoints[startIndex];
  const firstPoint=cmRoutePoints[firstTarget];
  const secondPoint=cmRoutePoints[secondTarget];

  const avatar=document.getElementById('cm-avatar');
  avatar.classList.remove('moving','blocked');
  setCmAvatarSvg(false);

  placeCandelariaOverlayByPoint(startPoint,false);
  markDot(startPoint,'active-point',9);
  setBreakLabelForPoint(startPoint,tr('Punto de inicio','Starting point'),true);
  setCandelariaMessage(tr('Calle Candelaria Mora 7. Primero se prueba el recorrido hacia arriba.','Candelaria Mora 7. First, the route is tested uphill.'),true);

  const firstRoute=getRouteBetweenRouteIndexes(startIndex,firstTarget);
  const secondRoute=getRouteBetweenRouteIndexes(startIndex,secondTarget);

  scheduleCm(()=>{
    setCmAvatarSvg(false);
    animateRouteSequence(firstRoute,tr('Primer intento: de Candelaria Mora 7 hacia arriba','First attempt: from Candelaria Mora 7 uphill'),()=>{
      avatar.classList.remove('blocked');
      clearRouteDotState();
      placeCandelariaOverlayByPoint(startPoint,false);
      markDot(startPoint,'active-point',9);
      setBreakLabelForPoint(startPoint,tr('Vuelta al inicio','Back to start'),true);
      setCandelariaMessage(tr('Vuelta al punto inicial. Ahora se prueba el recorrido en sentido contrario.','Back to the starting point. Now the route is tested in the opposite direction.'),true);

      scheduleCm(()=>{
        clearRouteDotState();
        setCmAvatarSvg(true);
        animateRouteSequence(secondRoute,tr('Segundo intento: de Candelaria Mora 7 hacia abajo','Second attempt: from Candelaria Mora 7 downhill'),()=>{
          setCandelariaMessage(tr('Demostración terminada: la accesibilidad se decide en el primer punto donde el itinerario se rompe.','Demo complete: accessibility is decided at the first point where the route breaks.'),true);
        });
      },1150);
    });
  },850);
}

const cmObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting && !cmStarted){
      cmStarted=true;
      drawCandelaria().then(()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)scheduleCm(animateCandelariaRoute,650);});
    }
  });
},{threshold:.2});

const cmSection=document.getElementById('candelaria');
if(cmSection) cmObs.observe(document.getElementById('candelaria-card'));

document.getElementById('cm-replay')?.addEventListener('click',animateCandelariaRoute);

window.addEventListener('resize',()=>{
  if(cmDataLoaded){
    stopCmTimers();
    scheduleCm(()=>{
      drawCandelaria().then(()=>{
        const startIndex=getNearestRouteIndexByDist(CM_START_DIST);
        placeCandelariaOverlayByPoint(cmRoutePoints[startIndex],false);
      });
    },260);
  }
});



})();
