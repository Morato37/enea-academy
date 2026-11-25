/**
 * Blühkalender – Aquarell-Renderer (Enea)
 * Eigenständiges ES-Modul ohne Abhängigkeiten. Zeichnet das A3-Querformat-Poster (2480 × 1754 px bei scale 1)
 * auf ein <canvas>. Schrift «Josefin Sans» (300/400, auch kursiv) muss auf der Seite geladen sein.
 *
 * API
 *   await bluehkalenderReady();                         // Icons, Logo und Schrift laden
 *   renderBluehkalender(canvas, { plants, climate, options }, scale)
 *   plantFromDb(row)                                    // Zeile aus plants_flat → Kalender-Pflanze
 *
 * Kalender-Pflanze: { bot, en, bloom, leaf, traits?: string[], rem?: string, m: Array(12) }
 *   m[i] = null | ['f', laubHex] | ['b', blüteHex] | ['b', blüteHex, laubHex]   (Zweitfarbe = geteilter Monat)
 * traits: 'bee' | 'butterfly' | 'bird' | 'edible' | 'medicinal' | 'native' | 'wellness' | 'climate'
 * climate: { loc, tmax[12], tmin[12], prec[12] (mm), wind[12] (Tage > 10 km/h), th:{frost, warm, wet, windy} }
 */
let plants = [];
let climate = null;
let O = {};
export const DEFAULT_OPTIONS = { language:'de', title:'', centerText:'PFLANZKONZEPT\nFÜR DAS\nGANZE JAHR', showLogo:true, showPlantList:false,
  showMonths:true, showFauna:false, showSide:false, showClimate:false };
const MONTHS_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MSHORT_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MSHORT_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SAGE = '#d2dccd';
const LOGO = null;

// ---- Noise ----
function hash(ix, iy, s){
  let h = Math.imul(ix,374761393) + Math.imul(iy,668265263) + Math.imul(s,982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function vnoise(x, y, s){
  const ix = Math.floor(x), iy = Math.floor(y), fx = x-ix, fy = y-iy;
  const ux = fx*fx*(3-2*fx), uy = fy*fy*(3-2*fy);
  const a = hash(ix,iy,s), b = hash(ix+1,iy,s), c = hash(ix,iy+1,s), d = hash(ix+1,iy+1,s);
  return a + (b-a)*ux + (c-a)*uy + (a-b-c+d)*ux*uy;
}
function fbm(x, y, s, oct=4){
  let v=0, amp=.5, f=1, n=0;
  for(let i=0;i<oct;i++){ v += amp*vnoise(x*f, y*f, s+i*17); n+=amp; amp*=.5; f*=2.03; }
  return v/n;
}

// ---- Farben ----
const hex2rgb = h => { h=h.replace('#',''); return [0,2,4].map(i=>parseInt(h.substr(i,2),16)); };
function avg(list){
  if(!list.length) return null;
  const s=[0,0,0]; list.forEach(c=>{const v=hex2rgb(c); s[0]+=v[0]*v[0]; s[1]+=v[1]*v[1]; s[2]+=v[2]*v[2];});
  return s.map(x=>Math.sqrt(x/list.length));
}
function isLeafHex(h){ const [r,g,b]=hex2rgb(h), hu=hueOf(r,g,b); return hu>=55 && hu<=175 && !(r>238&&g>238&&b>238); }
function monthColors(){
  const outer=[], inner=[];
  for(let m=0;m<12;m++){
    const bl=[], lf=[];
    plants.forEach(p=>{ const c=p.m[m]; if(!c) return; (c[0]==='b'?bl:lf).push(c[1]); if(c[2]) (isLeafHex(c[2])?lf:bl).push(c[2]); });
    outer.push(avg(bl) || hex2rgb(SAGE));
    inner.push(avg(lf) || hex2rgb(SAGE));
  }
  return {outer, inner};
}

// ---- Rendering ----
const W = 2480, H = 1754;
const skyCache = {};

function makeSky(scale){
  if(skyCache[scale]) return skyCache[scale];
  const q = 4, w = Math.ceil(W*scale/q), h = Math.ceil(H*scale/q);
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const x2 = c.getContext('2d'), img = x2.createImageData(w,h), d = img.data;
  const blue=[208,234,236], white=[251,253,253];
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const px = x*q/scale, py = y*q/scale;
    const nx = (px/W-.5), ny=(py/H-.5);
    const rad = Math.sqrt(nx*nx*1.1+ny*ny*1.6);
    const t = fbm(px*.0016, py*.0022, 7, 5);
    const cloud = fbm(px*.004+10, py*.005, 31, 5);
    let a = Math.max(0, Math.min(1, (t-.36)*1.9)) * Math.max(0, 1 - Math.pow(rad*1.35, 2.2));
    a *= 1 - Math.max(0, cloud-.52)*2.2;
    a = Math.max(0, Math.min(.85, a));
    const i=(y*w+x)*4;
    for(let k=0;k<3;k++) d[i+k] = white[k]*(1-a)+blue[k]*a;
    d[i+3]=255;
  }
  x2.putImageData(img,0,0);
  const out = document.createElement('canvas'); out.width=Math.round(W*scale); out.height=Math.round(H*scale);
  const o = out.getContext('2d'); o.imageSmoothingEnabled=true; o.imageSmoothingQuality='high';
  o.filter='blur('+(6*scale)+'px)'; o.drawImage(c,0,0,out.width,out.height);
  return skyCache[scale]=out;
}

function renderBand(R, Rin, cols, seed, scale){
  const Rs = R*scale, S = Math.ceil(Rs*2+4), c = document.createElement('canvas');
  c.width=S; c.height=S;
  const x2=c.getContext('2d'), img=x2.createImageData(S,S), d=img.data, cc=S/2;
  const sigma=.42, Rins=Rin*scale;
  for(let y=0;y<S;y++) for(let x=0;x<S;x++){
    const dx=x-cc+.5, dy=y-cc+.5, rr=Math.sqrt(dx*dx+dy*dy);
    if(rr>Rs+1 || rr<Rins-1) continue;
    const px=dx/scale, py=dy/scale;
    const aEdge = Math.max(0,Math.min(1,Rs-rr+.5))*Math.max(0,Math.min(1,rr-Rins+.5));
    const phi = Math.atan2(dy,dx)*180/Math.PI;
    let u = (phi+90)/30;
    u += (fbm(px*.006+seed, py*.006, seed, 4)-.5)*1.1;
    let sr=0,sg=0,sb=0,sw=0;
    const k0=Math.floor(u);
    for(let k=k0-2;k<=k0+3;k++){
      const w=Math.exp(-((u-k)*(u-k))/(2*sigma*sigma)), col=cols[((k%12)+12)%12];
      sr+=col[0]*w; sg+=col[1]*w; sb+=col[2]*w; sw+=w;
    }
    sr/=sw; sg/=sw; sb/=sw;
    const gran = fbm(px*.012, py*.012, seed+5, 3);
    const blot = fbm(px*.0035, py*.0035, seed+9, 3);
    const edgeDist = Math.min(R-rr/scale, rr/scale-Rin);
    let s = .34 + .14*gran + .26*blot + .12*Math.exp(-edgeDist/6);
    s = Math.max(.2, Math.min(.85, s));
    const i=(y*S+x)*4;
    d[i]=255*(1-s)+sr*s; d[i+1]=255*(1-s)+sg*s; d[i+2]=255*(1-s)+sb*s; d[i+3]=255*aEdge;
  }
  x2.putImageData(img,0,0);
  const o=document.createElement('canvas'); o.width=S; o.height=S;
  const ox=o.getContext('2d'); ox.drawImage(c,0,0);
  ox.globalCompositeOperation='source-atop'; ox.filter='blur('+(2.5*scale)+'px)'; ox.drawImage(c,0,0);
  return o;
}

function drawCurved(ctx, text, cx, cy, rad, theta, fs, spacing){
  ctx.save();
  ctx.font = `300 ${fs}px "Josefin Sans", sans-serif`;
  ctx.textBaseline='middle'; ctx.textAlign='center';
  const chars=[...text], ws=chars.map(ch=>ctx.measureText(ch).width+spacing);
  const total=ws.reduce((a,b)=>a+b,0)-spacing, aw=total/rad;
  const lower = Math.sin(theta) > .02;
  let a = lower ? theta + aw/2 : theta - aw/2;
  chars.forEach((ch,i)=>{
    const da = ws[i]/rad, mid = lower ? a - (ws[i]-spacing)/2/rad : a + (ws[i]-spacing)/2/rad;
    ctx.save();
    ctx.translate(cx+Math.cos(mid)*rad, cy+Math.sin(mid)*rad);
    ctx.rotate(lower ? mid-Math.PI/2 : mid+Math.PI/2);
    ctx.fillText(ch,0,0);
    ctx.restore();
    a += lower ? -da : da;
  });
  ctx.restore();
}

function drawShadowed(ctx, img, x, y, blur, ox, oy, alpha){
  ctx.save();
  ctx.shadowColor=`rgba(40,62,60,${alpha})`; ctx.shadowBlur=blur; ctx.shadowOffsetX=ox; ctx.shadowOffsetY=oy;
  ctx.drawImage(img,x,y);
  ctx.restore();
}

function drawPoster(target, scale){
  const ctx = target.getContext('2d');
  target.width = Math.round(W*scale); target.height = Math.round(H*scale);
  ctx.drawImage(makeSky(scale),0,0);
  ctx.save(); ctx.scale(scale,scale);
  const s = scale;
  const side = O.showSide;
  const cx=W*(side?.405:.49), cy=H*.545, R=H*.31;
  let wx=cx, wy=cy;
  {
  const {outer, inner} = monthColors();
  
    // äusserer Ring (Blüte)
    const ob = renderBand(R, R*.74, outer, 3, s);
    ctx.restore();
    drawShadowed(ctx, ob, (cx-R)*s-2, (cy-R)*s-2, 34*s, 5*s, 12*s, .28);
    // innerer Ring (Laub), leicht versetzt wie aufgelegtes Papier
    const Ri=R*.835, ix=cx+R*.012, iy=cy+R*.022;
    const ib = renderBand(Ri, R*.6, inner, 11, s);
    drawShadowed(ctx, ib, (ix-Ri)*s-2, (iy-Ri)*s-2, 26*s, 3*s, 8*s, .26);
  
    ctx.save(); ctx.scale(s,s);
    // weisse Mitte
    wx=ix-R*.004; wy=iy-R*.006; const Rw=R*.705;
    ctx.save();
    ctx.shadowColor='rgba(40,62,60,.22)'; ctx.shadowBlur=18; ctx.shadowOffsetX=2; ctx.shadowOffsetY=5;
    ctx.beginPath(); ctx.arc(wx,wy,Rw,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
    ctx.restore();
  
  }
  // Monatsnamen
  if(O.showMonths){
    ctx.fillStyle='#55605c';
    const months = O.language==='en' ? MONTHS_EN : MONTHS_DE;
    months.forEach((name,m)=>{
      const th=(-90+m*30)*Math.PI/180;
      drawCurved(ctx, name, cx, cy, R*.905, th, R*.046, R*.006);
    });
  }

  const showPoll = O.showFauna;
  const showClim = O.showClimate;
  const tm = traitMonths(), usedMonthTraits = TRAITS.filter(t=>t.month && tm.some(set=>set.has(t.key)));
  if(showPoll && usedMonthTraits.length){
    const isz=R*.1, rr=R*1.13, n=usedMonthTraits.length;
    track(ctx,cx,cy,rr);
    tm.forEach((set,m)=>{
      const th=(-90+m*30)*Math.PI/180, span=26*Math.PI/180;
      usedMonthTraits.forEach((t,ui)=>{ if(!set.has(t.key)) return;
        const a=th-span/2+span*(ui+.5)/n; badge(ctx, t.icon, cx+Math.cos(a)*rr, cy+Math.sin(a)*rr, isz); });
    });
  }
  const cm = climateMonths(), usedClim = CLIM.filter(c=>cm.some(set=>set.has(c.key)));
  if(showClim && usedClim.length){
    const isz=R*.1, rr=R*((showPoll&&usedMonthTraits.length)?1.3:1.13), n=usedClim.length;
    track(ctx,cx,cy,rr);
    cm.forEach((set,m)=>{
      const th=(-90+m*30)*Math.PI/180, span=24*Math.PI/180;
      usedClim.forEach((c,ui)=>{ if(!set.has(c.key)) return;
        const a=th-span/2+span*(ui+.5)/n; badge(ctx, c.icon, cx+Math.cos(a)*rr, cy+Math.sin(a)*rr, isz); });
    });
  }
  if(side) drawSide(ctx, R, usedMonthTraits, usedClim, showPoll, showClim);

  const lines = String(O.centerText||'').split('\n').filter(l=>l.trim()!=='');
  const title = String(O.title||'').trim();
  const logo = O.showLogo;
  const showList = O.showPlantList;
  const shift = showList ? -R*.14 : 0;
  ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#4b4f4e';
  const fs=R*.058, lh=fs*1.28;
  const setSpacing = v => { if('letterSpacing' in ctx) ctx.letterSpacing = v+'px'; };
  if(title){
    ctx.font=`400 ${R*.05}px "Josefin Sans", sans-serif`; setSpacing(R*.008);
    ctx.fillText(title.toUpperCase(), wx, wy - R*.38 + shift*.4);
  }
  ctx.font=`300 ${fs}px "Josefin Sans", sans-serif`; setSpacing(R*.004);
  const top = wy - R*.03 - (lines.length-1)*lh + shift;
  lines.forEach((l,i)=>ctx.fillText(l, wx, top + i*lh));
  if(logo){
    ctx.save();
    ctx.font=`600 ${R*.13}px Georgia, serif`;
    ctx.fillStyle='#555a58';
    ctx.fillText('enea', wx, wy + R*.24 + shift);
    ctx.restore();
  }
  if(showList){
    const names = plants.map(p => p.bot || p.en).filter(Boolean);
    const lfs = Math.min(R*.04, R*.36/Math.max(names.length,1)/1.25);
    ctx.font=`italic 300 ${lfs}px "Josefin Sans", sans-serif`; setSpacing(0); ctx.fillStyle='#5a625f';
    names.forEach((n,i)=>ctx.fillText(n, wx, wy + R*.22 + i*lfs*1.3));
  }
  setSpacing(0);
  ctx.restore();
}

// ---- Icons (loaded from public directory) ----
const ICON_PATHS = {
  bee:'/icons/BEE_ICON.png', bird:'/icons/BIRD_ICON.png', butterfly:'/icons/BUTTERFLY_ICON.png',
  apple:'/icons/Apple_grau_1.jpg', native:'/icons/EVERGREEN_ICON.png', flower:'/icons/FLOWER.png',
  garden:'/icons/GARDEN.png', climate:'/icons/image.png', medicinal:'/icons/MEDICINAL.png',
  snow:'/icons/snowflake_grau_1.jpg', sun:'/icons/sonnig.png', tree:'/icons/TREE_2.png',
  water:'/icons/WATER_-_BLUE.png', wellness:'/icons/WELLNESS.png', wind:'/icons/WIND.png',
};
const ICON = {};
Object.entries(ICON_PATHS).forEach(([k, src]) => { const im = new Image(); im.src = src; ICON[k] = im; });

// ---- Traits ----
const TRAITS = [
  {key:'bee',       icon:'bee',       de:'Bienen, Hummeln, Schwebfliegen', en:'Bees, bumblebees, hoverflies', month:'bloom', re:/bees?\b|bumble|hover\s*-?fl|bienen?|hummel|schwebflieg|insect|insekt/i},
  {key:'butterfly', icon:'butterfly', de:'Schmetterlinge',                 en:'Butterflies',                 month:'bloom', re:/butterfl|moth|schmetterling|falter/i},
  {key:'bird',      icon:'bird',      de:'Vögel',                          en:'Birds',                       month:'any',   re:/bird|vögel|vogel/i},
  {key:'edible',    icon:'apple',     de:'Essbar / Früchte',               en:'Edible / Fruit',              re:/edible|fruit|berr|essbar|obst|frucht|früchte|beere/i},
  {key:'medicinal', icon:'medicinal', de:'Heilpflanze',                    en:'Medicinal herb',              re:/medicin|herbal|heilpflanz|heilkraut|arznei/i},
  {key:'native',    icon:'native',    de:'Einheimisch',                    en:'Native',                      re:/native|indigen|einheimisch|heimisch/i},
  {key:'wellness',  icon:'wellness',  de:'Wellness / Duft',                en:'Wellness / Fragrance',        re:/wellness|fragran|scent|aroma|duft|therap/i},
  {key:'climate',   icon:'climate',   de:'Klimaresistent',                 en:'Climate-resilient',           re:/climate|drought|heat|klima|trocken|hitze/i},
];
const CLIM = [
  {key:'snow',  icon:'snow',  de:'Frost', en:'Frost'},
  {key:'sun',   icon:'sun',   de:'Warm',  en:'Warm'},
  {key:'water', icon:'water', de:'Nass',  en:'Wet'},
  {key:'wind',  icon:'wind',  de:'Windig',en:'Windy'},
];
const DEFAULT_CLIMATE = {
  loc:'Maienfeld GR',
  tmax:[2,4,8,12,16,20,21,21,17,13,7,3],
  tmin:[-6,-5,-2,2,6,10,11,11,8,5,0,-4],
  prec:[115,104,121,127,193,211,210,228,151,117,123,124],
  wind:[3.3,3.3,3.8,3.4,3.5,2.3,1.7,0.7,1.1,1.9,2.0,2.8],
  th:{frost:0, warm:20, wet:180, windy:3}
};
const plantTraits = p => TRAITS.filter(t=> Array.isArray(p.traits) ? p.traits.includes(t.key) : (p.rem && t.re.test(p.rem)));
function traitMonths(){
  return Array.from({length:12},(_,m)=>{
    const set=new Set();
    plants.forEach(p=>{ const c=p.m[m]; if(!c) return;
      plantTraits(p).forEach(t=>{ if(t.month==='any' || (t.month==='bloom' && c[0]==='b')) set.add(t.key); }); });
    return set;
  });
}
function climateMonths(){
  const c=climate, t=c.th;
  return Array.from({length:12},(_,m)=>{
    const set=new Set();
    if(c.tmin[m]<=t.frost) set.add('snow');
    if(c.tmax[m]>=t.warm) set.add('sun');
    if(c.prec[m]>=t.wet) set.add('water');
    if(c.wind[m]>=t.windy) set.add('wind');
    return set;
  });
}
function track(ctx,cx,cy,rr){
  ctx.save(); ctx.strokeStyle='rgba(80,100,95,.22)'; ctx.lineWidth=1.4; ctx.setLineDash([2,7]);
  ctx.beginPath(); ctx.arc(cx,cy,rr,0,Math.PI*2); ctx.stroke(); ctx.restore();
}
function icon(ctx,k,x,y,s){ const im=ICON[k]; if(im && im.complete && im.naturalWidth) ctx.drawImage(im,x-s/2,y-s/2,s,s); }
function badge(ctx,k,x,y,s){
  ctx.save(); ctx.fillStyle='rgba(255,255,255,.85)'; ctx.shadowColor='rgba(40,62,60,.15)'; ctx.shadowBlur=6; ctx.shadowOffsetY=2;
  ctx.beginPath(); ctx.arc(x,y,s*.56,0,Math.PI*2); ctx.fill(); ctx.restore();
  icon(ctx,k,x,y,s*.72);
}
function drawSide(ctx, R, usedMonthTraits, usedClim, showPoll, showClim){
  const x0=W*.735, xmax=W*.965, ink='#4b4f4e', muted='#6b7571';
  ctx.save(); ctx.textAlign='left'; ctx.textBaseline='middle';
  const head=(t,y)=>{ ctx.fillStyle=ink; ctx.font=`400 ${R*.052}px "Josefin Sans", sans-serif`; ctx.fillText(t,x0,y); };
  const fit=(t,maxW)=>{ if(ctx.measureText(t).width<=maxW) return t; while(t.length>3 && ctx.measureText(t+'…').width>maxW) t=t.slice(0,-1); return t+'…'; };
  let y=H*.1;
  const list=plants.filter(p=>p.en||p.bot);
  if(list.length){
    head(O.language==='en'?'Plants':'Pflanzen',y); y+=R*.1;
    const rowH=Math.min(R*.15, (H*.46)/list.length), fs=Math.min(R*.042,rowH*.34), isz=Math.min(R*.075,rowH*.5);
    list.forEach(p=>{
      const tr = showPoll ? plantTraits(p) : [];
      const iw = tr.length*isz*1.1, tw = xmax-x0-iw-R*.03;
      ctx.fillStyle=ink; ctx.font=`italic 400 ${fs}px "Josefin Sans", sans-serif`;
      ctx.fillText(fit(p.bot||p.en,tw), x0, y-fs*.45);
      if(p.bot && p.en && p.en!==p.bot){ ctx.fillStyle=muted; ctx.font=`300 ${fs*.85}px "Josefin Sans", sans-serif`; ctx.fillText(fit(p.en,tw), x0, y+fs*.6); }
      tr.forEach((t,i)=>icon(ctx,t.icon, xmax-isz*.55-(tr.length-1-i)*isz*1.1, y, isz));
      y+=rowH;
    });
    y+=R*.06;
  }
  const L = O.language==='en';
  const items = [['flower', L?'Bloom (outer ring)':'Blüte (äusserer Ring)'],['tree', L?'Foliage (inner ring)':'Laub (innerer Ring)']];
  if(showPoll){
    usedMonthTraits.forEach(t=>items.push([t.icon, L?(t.en||t.de):t.de]));
    TRAITS.filter(t=>!t.month && plants.some(p=>plantTraits(p).includes(t))).forEach(t=>items.push([t.icon, L?(t.en||t.de):t.de]));
  }
  head(L?'Legend':'Legende',y); y+=R*.1;
  const lh=R*.095, fs2=R*.04;
  items.forEach(([k,t])=>{ icon(ctx,k,x0+R*.04,y,R*.07); ctx.fillStyle=ink; ctx.font=`300 ${fs2}px "Josefin Sans", sans-serif`; ctx.fillText(t,x0+R*.12,y+fs2*.08); y+=lh; });
  if(showClim && usedClim.length){
    y+=R*.05; head((L?'Climate ':'Klima ')+climate.loc,y); y+=R*.1;
    const th=climate.th, lbl=L
      ? {snow:`Frost (min ≤ ${th.frost} °C)`, sun:`Warm (max ≥ ${th.warm} °C)`, water:`Wet (≥ ${th.wet} mm)`, wind:`Windy (≥ ${th.windy} days > 10 km/h)`}
      : {snow:`Frost (Tiefstwert ≤ ${th.frost} °C)`, sun:`Warm (Höchstwert ≥ ${th.warm} °C)`, water:`Nass (≥ ${th.wet} mm)`, wind:`Windig (≥ ${th.windy} Tage über 10 km/h)`};
    usedClim.forEach(c=>{ icon(ctx,c.icon,x0+R*.04,y,R*.07); ctx.fillStyle=ink; ctx.font=`300 ${fs2}px "Josefin Sans", sans-serif`; ctx.fillText(lbl[c.key],x0+R*.12,y+fs2*.08); y+=lh; });
  }
  ctx.restore();
}

function hueOf(r,g,b){
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; if(d<18) return -1;
  let h = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4;
  return (h*60+360)%360;
}
const MONTHS = MONTHS_DE;
export { DEFAULT_CLIMATE, MONTHS, MONTHS_DE, MONTHS_EN, MSHORT_DE, MSHORT_EN, TRAITS, W as POSTER_WIDTH, H as POSTER_HEIGHT };

export function renderBluehkalender(target, data = {}, scale = 1){
  if (!target) throw new Error('Ein Canvas-Ziel ist erforderlich.');
  plants = (data.plants || []).map(p => ({ ...p, m: (p.m || []).slice(0,12).concat(Array(12).fill(null)).slice(0,12) }));
  climate = { ...DEFAULT_CLIMATE, ...(data.climate || {}), th: { ...DEFAULT_CLIMATE.th, ...((data.climate || {}).th || {}) } };
  O = { ...DEFAULT_OPTIONS, ...(data.options || {}) };
  drawPoster(target, scale);
  return target;
}

export async function bluehkalenderReady(){
  const imgs = Object.values(ICON);
  await Promise.all(imgs.map(im => im.complete ? null : new Promise(resolve => {
    const timer = window.setTimeout(resolve, 2500);
    im.onload = () => { window.clearTimeout(timer); resolve(); };
    im.onerror = () => { window.clearTimeout(timer); resolve(); };
  })));
  if (document.fonts) {
    await Promise.all(['300 40px "Josefin Sans"', '400 40px "Josefin Sans"', 'italic 300 40px "Josefin Sans"']
      .map(f => document.fonts.load(f).catch(() => null)));
  }
}

const MKEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const cleanHex = v => { const s = String(v || '').trim(); return /^#?[0-9a-f]{6}$/i.test(s) ? (s[0]==='#' ? s : '#'+s).toLowerCase() : null; };
export function monthEntry(c1, c2){
  const a = cleanHex(c1), b = cleanHex(c2);
  if (!a && !b) return null;
  if (!a || !b || a === b) { const c = a || b; return [isLeafHex(c) ? 'f' : 'b', c]; }
  const la = isLeafHex(a), lb = isLeafHex(b);
  if (la && !lb) return ['b', b, a];
  if (lb && !la) return ['b', a, b];
  return [la ? 'f' : 'b', b, a];
}
const T = v => v === true || v === 'true' || v === 1 || v === 't';
// Herbstfärbung: Die Datenbank kennt pro Monat nur Farben, nicht «Blüte» oder «Laub». Rot/Orange/Braun im Herbst
// würde deshalb als Blüte gelten. Bei Gehölzen zählt ein warmer Farbton ab September als Laub (innerer Ring),
// wenn vorher grünes Laub da war und danach ein leerer Monat folgt (Laubfall) oder die Farbe über den Winter bleibt.
// Immergrüne sind ausgenommen: dort ist ein warmer Farbton im Herbst/Winter eine Blüte (z. B. Kamelie).
const isWarmHex = h => { const [r,g,b]=hex2rgb(h), hu=hueOf(r,g,b); return hu>=0 && (hu<55 || hu>=340); };
const hasLeaf = c => !!c && (c[0]==='f' || (!!c[2] && isLeafHex(c[2])));
const autumnHex = c => { if(!c || c[0]!=='b') return null; const cols=[c[1],c[2]].filter(x=>x && !isLeafHex(x)); return cols.length && cols.every(isWarmHex) ? cols[0] : null; };
function autumnFoliage(m){
  if(!m.slice(0,8).some(hasLeaf)) return m;
  const out = m.slice();
  for(let i=8;i<12;i++){
    if(!autumnHex(m[i]) || (i>8 && autumnHex(m[i-1]))) continue;
    // Lauf darf über den Jahreswechsel reichen (Laub, das braun am Gehölz bleibt, z. B. Hainbuche)
    let n=1; while(n<12 && autumnHex(m[(i+n)%12])) n++;
    const wraps = i+n>12;
    if(!wraps && m[(i+n)%12]) continue;
    for(let k=0;k<n;k++){ const x=(i+k)%12; out[x] = ['f', autumnHex(m[x])]; }
  }
  return out;
}
export function plantFromDb(row){
  const woody = (T(row.category_tree) || T(row.category_shrub) || T(row.category_climbing_plant)) && !T(row.characteristic_evergreen);
  const raw = MKEYS.map(k => monthEntry(row['color_'+k], row['color2_'+k]));
  const m = woody ? autumnFoliage(raw) : raw;
  const traits = [];
  if (['characteristic_bees','characteristic_bumblebees','characteristic_honeybees','characteristic_hoverflies'].some(k => T(row[k]))) traits.push('bee');
  if (T(row.characteristic_butterflies)) traits.push('butterfly');
  if (T(row.characteristic_birds)) traits.push('bird');
  if (T(row.characteristic_native)) traits.push('native');
  if (T(row.category_medicinal_herbs) || T(row.usage_medicinal_herbs)) traits.push('medicinal');
  if (T(row.category_culinary_plant)) traits.push('edible');
  if (T(row.tree_of_the_future) || T(row.tree_of_the_future_drought)) traits.push('climate');
  // Laubfarbe = das Grün, das die meisten Monate belegt (nicht einfach das erste). Hat die Pflanze keine erkannte
  // Blüte, aber ein zweites, selteneres Grün (grüne Blüte, z. B. Helleborus), dient dieses als Blütenfarbe im Editor.
  const greens = new Map();
  m.forEach(c => { if(!c) return; const g = c[0]==='f' ? c[1] : c[2]; if(g && isLeafHex(g)) greens.set(g, (greens.get(g)||0)+1); });
  const ranked = [...greens.entries()].sort((a,z) => z[1]-a[1]).map(e => e[0]);
  const b = m.find(c => c && c[0]==='b'), f = m.find(c => c && c[0]==='f');
  return { id: row.id, bot: row.botanical_name || '', en: row.common_name_de || row.common_name_en || '',
    bloom: b ? b[1] : (ranked[1] || '#e8bafa'), leaf: ranked[0] || (f ? f[1] : '#6f9a5a'), traits, m };
}
