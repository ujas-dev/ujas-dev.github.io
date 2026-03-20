/* ================================================================
   world.js — ES Module · Three.js r163 · Tron world rebuild
   Fixed: platform visuals, section labels, male voice, cursor,
          click-to-stop-voice, logo clickable, news Tron tiles
   ================================================================ */
import * as THREE from 'three';

/* ── Safety guard ─────────────────────────────────────────── */
if (!window.PD) {
  const e = 'FATAL: window.PD undefined. Check data.js loads as classic <script> before this module.';
  console.error(e);
  const el = document.getElementById('speech-text');
  if (el) el.textContent = 'ERROR: data.js not loaded. Check console.';
  throw new Error(e);
}
const PD = window.PD;

/* ── Helpers ──────────────────────────────────────────────── */
const $    = id => document.getElementById(id);
const qsa  = s  => document.querySelectorAll(s);
const esc  = s  => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const strip = s => { const d=document.createElement('div'); d.innerHTML=s; return d.textContent||d.innerText||''; };
const fmtDate = s => { try{return new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}catch(e){return s||'';} };
const safe  = (a,fb=[]) => Array.isArray(a)?a:fb;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

/* ═══════════════════════════════════════════════════════════
   1. RENDERER + SCENE
═══════════════════════════════════════════════════════════ */
const canvas = $('world');
if (!canvas) throw new Error('Canvas #world not found');

let W = innerWidth, H = innerHeight;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000511);
scene.fog        = new THREE.FogExp2(0x000511, 0.013);

const camera = new THREE.PerspectiveCamera(55, W/H, 0.1, 600);
camera.position.set(0, 18, 38);

window.addEventListener('resize', () => {
  W = innerWidth; H = innerHeight;
  camera.aspect = W/H; camera.updateProjectionMatrix();
  renderer.setSize(W, H);
});

/* ═══════════════════════════════════════════════════════════
   2. ORBIT CONTROLS (manual smooth)
═══════════════════════════════════════════════════════════ */
const O = {
  theta:0, phi:1.05, r:38,
  lt:0, lp:1.05, lr:38,
  tx:0, ty:0, tz:0,
  ltx:0, lty:0, ltz:0,
  down:false, lmx:0, lmy:0,
  drag:false, dsx:0, dsy:0
};
canvas.addEventListener('pointerdown',e=>{ O.down=true; O.lmx=e.clientX; O.lmy=e.clientY; O.dsx=e.clientX; O.dsy=e.clientY; O.drag=false; });
canvas.addEventListener('pointerup',  ()=>{ O.down=false; });
canvas.addEventListener('pointermove',e=>{
  if(!O.down){ hoverRay(e); return; }
  if(Math.abs(e.clientX-O.dsx)>4||Math.abs(e.clientY-O.dsy)>4) O.drag=true;
  O.theta-=(e.clientX-O.lmx)*0.006;
  O.phi  -=(e.clientY-O.lmy)*0.004;
  O.phi   =clamp(O.phi,0.08,Math.PI/2.05);
  O.lmx=e.clientX; O.lmy=e.clientY;
});
canvas.addEventListener('wheel',e=>{ O.r=clamp(O.r+e.deltaY*0.04,5,110); e.preventDefault(); },{passive:false});

function orbitUpdate(){
  O.lt +=(O.theta-O.lt )*0.09; O.lp +=(O.phi  -O.lp )*0.09; O.lr +=(O.r   -O.lr )*0.09;
  O.ltx+=(O.tx  -O.ltx)*0.07; O.lty+=(O.ty   -O.lty)*0.07; O.ltz+=(O.tz  -O.ltz)*0.07;
  camera.position.set(
    O.ltx+O.lr*Math.sin(O.lp)*Math.sin(O.lt),
    O.lty+O.lr*Math.cos(O.lp),
    O.ltz+O.lr*Math.sin(O.lp)*Math.cos(O.lt)
  );
  camera.lookAt(O.ltx,O.lty,O.ltz);
}

/* ═══════════════════════════════════════════════════════════
   3. LIGHTS
═══════════════════════════════════════════════════════════ */
scene.add(new THREE.AmbientLight(0x001122, 4));

const sun=new THREE.DirectionalLight(0x002255,1.2);
sun.position.set(25,55,20); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{near:1,far:260,left:-90,right:90,top:90,bottom:-90});
scene.add(sun);

[[0x00ffff,0,9,0,70],[0xff00aa,-38,5,-18,55],[0x0088ff,38,5,18,55],[0x00ff88,0,8,-45,60]].forEach(([c,x,y,z,d])=>{
  const pl=new THREE.PointLight(c,1.5,d); pl.position.set(x,y,z); scene.add(pl);
});

/* ═══════════════════════════════════════════════════════════
   4. OBJECT LISTS
═══════════════════════════════════════════════════════════ */
const floaters=[], spinList=[], streamList=[], clickables=[];

/* ── Material factories ─────────────────────────────── */
/* DARK body — near-black, zero emissive — this is what platforms/building bodies use */
const darkBody = () => new THREE.MeshStandardMaterial({
  color:0x000814, roughness:0.92, metalness:0.08,
  emissive:0x000000, emissiveIntensity:0
});
/* Neon emissive — for edges, caps, wires only */
const neon = (c,ei=1.4) => new THREE.MeshStandardMaterial({
  color:c, emissive:c, emissiveIntensity:ei, roughness:0.2, metalness:0.8
});
/* Basic wireframe */
const wire = (c,op=0.55) => new THREE.MeshBasicMaterial({ color:c, wireframe:true, transparent:true, opacity:op });
/* Basic solid transparent */
const basic = (c,op=1) => new THREE.MeshBasicMaterial({ color:c, transparent:op<1, opacity:op });

/* ═══════════════════════════════════════════════════════════
   5. BASE WORLD — floor, grids, city, particles
═══════════════════════════════════════════════════════════ */

/* Floor — pure dark */
const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(360,360), darkBody());
floorMesh.rotation.x=-Math.PI/2; floorMesh.receiveShadow=true; scene.add(floorMesh);

/* Tron grid — ONLY lines, no fill */
const g1=new THREE.GridHelper(360,72,0x00ffff,0x002233);
g1.material.opacity=0.4; g1.material.transparent=true; g1.position.y=0.02; scene.add(g1);
const g2=new THREE.GridHelper(360,360,0x001122,0x000d1c);
g2.material.opacity=0.15; g2.material.transparent=true; g2.position.y=0.025; scene.add(g2);

/* Tron city buildings — dark body + neon wireframe + glowing cap only */
(function buildCity(){
  const COLS=[0x00ffff,0xff00aa,0x0088ff,0x00ff88,0xffaa00,0xff4400];
  const rng=(a,b)=>a+Math.random()*(b-a);
  for(let i=0;i<220;i++){
    const h=rng(3,35), w=rng(1.2,4.5);
    const bx=(Math.random()-0.5)*320, bz=(Math.random()-0.5)*320;
    if(Math.abs(bx)<50&&Math.abs(bz)<70) continue;
    const col=COLS[Math.floor(Math.random()*COLS.length)];
    /* dark body */
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,w), darkBody());
    body.position.set(bx,h/2,bz); body.castShadow=true; scene.add(body);
    /* neon wireframe overlay */
    const wf=new THREE.Mesh(new THREE.BoxGeometry(w+0.08,h+0.08,w+0.08), wire(col,0.22));
    wf.position.copy(body.position); scene.add(wf);
    /* glowing cap only */
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w+0.25,0.16,w+0.25), neon(col,2.5));
    cap.position.set(bx,h+0.08,bz); scene.add(cap);
    /* neon window lines */
    const wc=Math.floor(h/3);
    for(let j=0;j<wc;j++){
      const win=new THREE.Mesh(new THREE.BoxGeometry(w*0.6,0.12,w*0.04), neon(col,0.65));
      win.position.set(bx,j*2.8+1.4,bz+w*0.49); scene.add(win);
    }
    /* point light at top */
    if(Math.random()<0.35){
      const pl=new THREE.PointLight(col,0.6,14); pl.position.set(bx,h+1,bz); scene.add(pl);
    }
  }
}());

/* Road network */
(function buildRoads(){
  const rm=basic(0x00ffff,0.18);
  for(let i=-8;i<=8;i++){
    const rh=new THREE.Mesh(new THREE.PlaneGeometry(360,0.28),rm);
    rh.rotation.x=-Math.PI/2; rh.position.set(0,0.022,i*12); scene.add(rh);
    const rv=new THREE.Mesh(new THREE.PlaneGeometry(0.28,360),rm);
    rv.rotation.x=-Math.PI/2; rv.position.set(i*12,0.022,0); scene.add(rv);
  }
}());

/* Ambient particles */
(function buildParticles(){
  const N=3200, pos=new Float32Array(N*3), col=new Float32Array(N*3);
  const pal=[[0,1,1],[1,0,.67],[0,.53,1],[0,1,.53],[1,.53,0]];
  for(let i=0;i<N;i++){
    pos[i*3]=(Math.random()-.5)*280; pos[i*3+1]=Math.random()*40; pos[i*3+2]=(Math.random()-.5)*280;
    const c=pal[Math.floor(Math.random()*pal.length)];
    col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',   new THREE.BufferAttribute(col,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({
    size:0.16,vertexColors:true,transparent:true,
    opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false
  })));
}());

/* ═══════════════════════════════════════════════════════════
   6. LABEL SPRITE BUILDER — billboard text always faces camera
═══════════════════════════════════════════════════════════ */
function makeLabelSprite(text, col='#00ffff', bgAlpha=0.82, fontSize=52) {
  const c=document.createElement('canvas'); c.width=512; c.height=100;
  const ctx=c.getContext('2d');
  /* background */
  ctx.fillStyle=`rgba(0,6,18,${bgAlpha})`;
  ctx.fillRect(0,0,512,100);
  /* top border line */
  ctx.fillStyle=col; ctx.fillRect(0,0,512,3);
  /* corner brackets */
  ctx.strokeStyle=col; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,3); ctx.lineTo(0,20); ctx.moveTo(0,3); ctx.lineTo(16,3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(512,3); ctx.lineTo(512,20); ctx.moveTo(512,3); ctx.lineTo(496,3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,100); ctx.lineTo(0,82); ctx.moveTo(0,100); ctx.lineTo(16,100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(512,100); ctx.lineTo(512,82); ctx.moveTo(512,100); ctx.lineTo(496,100); ctx.stroke();
  /* text */
  ctx.fillStyle=col;
  ctx.font=`bold ${fontSize}px "Orbitron",monospace`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowColor=col; ctx.shadowBlur=18;
  ctx.fillText(text,256,54);
  const tex=new THREE.CanvasTexture(c);
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const sprite=new THREE.Sprite(mat);
  sprite.scale.set(10,1.95,1);
  return sprite;
}

/* Sub-label (smaller) */
function makeSubSprite(text, col='rgba(0,255,255,0.7)') {
  const c=document.createElement('canvas'); c.width=400; c.height=56;
  const ctx=c.getContext('2d');
  ctx.fillStyle='rgba(0,6,18,0.0)'; ctx.fillRect(0,0,400,56);
  ctx.fillStyle=col; ctx.font='bold 32px "Share Tech Mono",monospace';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowColor=col; ctx.shadowBlur=10;
  ctx.fillText(text,200,28);
  const tex=new THREE.CanvasTexture(c);
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const sprite=new THREE.Sprite(mat);
  sprite.scale.set(7,0.98,1);
  return sprite;
}

/* ═══════════════════════════════════════════════════════════
   7. ZONE BUILDER HELPERS
═══════════════════════════════════════════════════════════ */

/* TRUE TRON platform: dark base + neon EDGE ONLY (no solid fill) */
function mkPlatform(x, z, rx, rz, col) {
  /* Dark flat base — barely visible, just slightly lighter than floor */
  const base=new THREE.Mesh(new THREE.BoxGeometry(rx*2,0.28,rz*2),
    new THREE.MeshStandardMaterial({color:0x000d1e,roughness:0.95,metalness:0,emissive:0x000000,emissiveIntensity:0}));
  base.position.set(x,0.14,z); base.receiveShadow=true; scene.add(base);

  /* Neon edge frame — thin top face strips only */
  const edgeW=new THREE.Mesh(new THREE.BoxGeometry(rx*2+0.08,0.055,0.1), neon(col,2.2));
  edgeW.position.set(x,0.3,z+rz);  scene.add(edgeW);
  const edgeW2=edgeW.clone(); edgeW2.position.set(x,0.3,z-rz); scene.add(edgeW2);
  const edgeL=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.055,rz*2+0.08), neon(col,2.2));
  edgeL.position.set(x-rx,0.3,z); scene.add(edgeL);
  const edgeL2=edgeL.clone(); edgeL2.position.set(x+rx,0.3,z); scene.add(edgeL2);

  /* Platform neon wireframe overlay */
  const wf=new THREE.Mesh(new THREE.BoxGeometry(rx*2+0.12,0.3,rz*2+0.12), wire(col,0.35));
  wf.position.set(x,0.15,z); scene.add(wf);

  /* Tron platform surface grid */
  const sg=new THREE.GridHelper(Math.max(rx,rz)*2,Math.round(Math.max(rx,rz)), col, col);
  sg.material.opacity=0.12; sg.material.transparent=true;
  sg.position.set(x,0.3,z); scene.add(sg);

  /* Pillar beacons at corners */
  for(const cx of [-rx+0.8,rx-0.8]){
    for(const cz of [-rz+0.8,rz-0.8]){
      const pillar=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,5,6), neon(col,0.9));
      pillar.position.set(x+cx,2.8,z+cz); scene.add(pillar);
      const tip=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8), neon(col,2.8));
      tip.position.set(x+cx,5.5,z+cz); scene.add(tip);
      const pl=new THREE.PointLight(col,0.9,8); pl.position.set(x+cx,5.7,z+cz); scene.add(pl);
      floaters.push({mesh:tip,baseY:5.5,speed:.8+Math.random()*.4,amp:.18,phase:Math.random()*Math.PI*2});
    }
  }
  return {x,z,rx,rz,col};
}

/* Neon tower — Tron dark body + neon wireframe + glowing rings */
function mkTower(x, z, h, col, info) {
  if(!info) info={};
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.9,h,1.9), darkBody());
  body.position.set(x,h/2,z); body.castShadow=true; scene.add(body);
  const wf=new THREE.Mesh(new THREE.BoxGeometry(1.95,h+0.06,1.95), wire(col,0.7));
  wf.position.copy(body.position); scene.add(wf);
  /* horizontal neon bands */
  for(let i=1;i<=Math.ceil(h/3);i++){
    const band=new THREE.Mesh(new THREE.BoxGeometry(2.05,0.1,2.05), wire(col,0.8));
    band.position.set(x,i*3,z); scene.add(band);
  }
  const cap=new THREE.Mesh(new THREE.BoxGeometry(2.3,0.28,2.3), neon(col,2.8));
  cap.position.set(x,h+0.14,z); scene.add(cap);
  /* spinning halo ring */
  const halo=new THREE.Mesh(new THREE.TorusGeometry(1.65,0.06,6,36), neon(col,1.8));
  halo.rotation.x=Math.PI/2; halo.position.set(x,h*0.6,z);
  spinList.push({mesh:halo,axis:'y',speed:0.018}); scene.add(halo);
  const pl=new THREE.PointLight(col,1.1,10); pl.position.set(x,h+1.5,z); scene.add(pl);
  /* raycaster proxy */
  const proxy=new THREE.Mesh(new THREE.BoxGeometry(2.8,h+1.2,2.8),new THREE.MeshBasicMaterial({visible:false}));
  proxy.position.set(x,h/2,z); proxy.userData.info=info; proxy.userData.capRef=cap;
  scene.add(proxy); clickables.push(proxy);
  floaters.push({mesh:cap,baseY:h+0.14,speed:.5+Math.random()*.3,amp:.12,phase:Math.random()*Math.PI*2});
  return proxy;
}

/* Spinning gem — octahedron, pure Tron */
function mkGem(x,y,z,col,info){
  if(!info) info={};
  const body =new THREE.Mesh(new THREE.OctahedronGeometry(1.0,0), darkBody());
  const wfm  =new THREE.Mesh(new THREE.OctahedronGeometry(1.02,0), wire(col,0.9));
  const inner=new THREE.Mesh(new THREE.OctahedronGeometry(0.6,0),  neon(col,0.9));
  [body,wfm,inner].forEach(m=>{m.position.set(x,y,z);scene.add(m);});
  const pl=new THREE.PointLight(col,1.2,6); pl.position.set(x,y,z); scene.add(pl);
  const proxy=new THREE.Mesh(new THREE.SphereGeometry(1.5,8,8),new THREE.MeshBasicMaterial({visible:false}));
  proxy.position.set(x,y,z); proxy.userData.info=info; scene.add(proxy); clickables.push(proxy);
  [body,wfm,inner].forEach((m,i)=>{
    floaters.push({mesh:m,baseY:y,speed:.7+Math.random()*.3,amp:.28,phase:i*.5+Math.random()*Math.PI});
    spinList.push({mesh:m,axis:'y',speed:i===2?-0.024:0.018});
  });
  return proxy;
}

/* Hex skill pillar */
function mkHexSkill(x,yb,z,col,pct,info){
  if(!info) info={};
  const barH=Math.max(0.4,pct/22);
  /* hex outer ring */
  const outer=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,0.2,6), wire(col,0.9));
  outer.position.set(x,yb,z); scene.add(outer);
  /* fill disc scaled to pct */
  const fillR=clamp(pct/105,0.05,0.98);
  const fill=new THREE.Mesh(new THREE.CylinderGeometry(fillR,fillR*0.8,0.22,6), neon(col,2.2));
  fill.position.set(x,yb+0.01,z); scene.add(fill);
  /* vertical column */
  const bar=new THREE.Mesh(new THREE.BoxGeometry(0.42,barH,0.42), neon(col,1.5));
  bar.position.set(x,yb-barH/2-0.12,z); scene.add(bar);
  const barW=new THREE.Mesh(new THREE.BoxGeometry(0.46,barH+0.08,0.46), wire(col,0.6));
  barW.position.copy(bar.position); scene.add(barW);
  /* point light */
  const pl=new THREE.PointLight(col,0.7,5); pl.position.set(x,yb+0.5,z); scene.add(pl);
  const proxy=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,barH+1.0,6),new THREE.MeshBasicMaterial({visible:false}));
  proxy.position.set(x,yb-barH/2,z); proxy.userData.info=info; scene.add(proxy); clickables.push(proxy);
  floaters.push({mesh:outer,baseY:yb,speed:.55+Math.random()*.3,amp:.1,phase:Math.random()*Math.PI*2});
  floaters.push({mesh:fill, baseY:yb+.01,speed:.55,amp:.1,phase:Math.random()*Math.PI*2});
  spinList.push({mesh:outer,axis:'y',speed:.009});
  return proxy;
}

/* Data stream */
function mkStream(x1,z1,x2,z2,col){
  const from=new THREE.Vector3(x1,.1,z1), to=new THREE.Vector3(x2,.1,z2);
  const dir=new THREE.Vector3().subVectors(to,from), len=dir.length();
  const road=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.045,len), basic(col,0.22));
  road.position.copy(from).addScaledVector(dir.clone().normalize(),len/2);
  road.lookAt(to.clone().add(new THREE.Vector3(0,.1,0))); scene.add(road);
  const pt=new THREE.Mesh(new THREE.SphereGeometry(0.22,6,6), neon(col,4.0));
  const light=new THREE.PointLight(col,1.5,6); scene.add(pt); scene.add(light);
  streamList.push({pt,light,from:from.clone(),to:to.clone(),t:Math.random(),speed:.005+Math.random()*.006});
}

/* ═══════════════════════════════════════════════════════════
   8. SECTION LABEL SYSTEM
   Each zone gets: large billboard sprite + neon arch above platform
═══════════════════════════════════════════════════════════ */
function mkZoneLabel(x, z, col, text, subtext, info){
  const y=9.5;
  const sprite=makeLabelSprite(text, col);
  sprite.position.set(x,y,z);
  sprite.userData.info=info;
  sprite.userData.isLabel=true;
  scene.add(sprite);
  clickables.push(sprite);
  floaters.push({mesh:sprite,baseY:y,speed:.28,amp:.22,phase:Math.random()*Math.PI*2});
  if(subtext){
    const sub=makeSubSprite(subtext,col);
    sub.position.set(x,y-1.6,z); scene.add(sub);
    floaters.push({mesh:sub,baseY:y-1.6,speed:.28,amp:.22,phase:Math.random()*Math.PI*2});
  }
  /* neon arch */
  const arch=new THREE.Mesh(new THREE.TorusGeometry(5.5,.1,8,48,Math.PI), neon(col,1.4));
  arch.position.set(x,0.5,z); arch.rotation.z=Math.PI; scene.add(arch);
  spinList.push({mesh:arch,axis:'y',speed:.003});
  return sprite;
}

/* ═══════════════════════════════════════════════════════════
   9. BUILD ALL 7 ZONES
═══════════════════════════════════════════════════════════ */

/* ── ZONE 0: HOME (0,0) ── */
mkPlatform(0,0,12,12,0x00ffff);
mkZoneLabel(0,0,0x00ffff,'UJAS DUBAL','AWS DATA ENGINEER',{
  type:'home', title:'UJAS DUBAL · AWS DATA ENGINEER',
  lines:[PD.title||'',PD.tagline||''],
  stats:safe(PD.stats),
  speech:'Welcome to the Tron Data World! I am Ujas Dubal, AWS Data Engineer and Technical Lead with 8.5 years building cloud native data platforms. Click any glowing object to explore.'
});
/* Triple portal rings */
['y',0x00ffff,.008,5.5,.14],[Math.PI/3,0xff00aa,-.013,3.8,.1],['z_rot',0x0088ff,.006,7.2,.08]
/* manual as below: */
;
const r1=new THREE.Mesh(new THREE.TorusGeometry(5.5,.15,12,64), neon(0x00ffff,2.4));
r1.position.set(0,5,0); spinList.push({mesh:r1,axis:'y',speed:.008}); scene.add(r1);
const r2=new THREE.Mesh(new THREE.TorusGeometry(3.8,.11,12,64), neon(0xff00aa,2.4));
r2.position.set(0,5,0); r2.rotation.x=Math.PI/3; spinList.push({mesh:r2,axis:'y',speed:-.013}); scene.add(r2);
const r3=new THREE.Mesh(new THREE.TorusGeometry(7.2,.08,8,64), neon(0x0088ff,1.8));
r3.position.set(0,5,0); r3.rotation.z=Math.PI/4.5; spinList.push({mesh:r3,axis:'y',speed:.006}); scene.add(r3);
/* stat orbs */
safe(PD.stats).forEach((s,i)=>{
  const a=(i/safe(PD.stats).length)*Math.PI*2;
  const ox=Math.cos(a)*7.8, oz=Math.sin(a)*7.8;
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.85,12,12), neon(0x00ffff,.7));
  orb.position.set(ox,3.8,oz);
  orb.userData.info={type:'stat',v:s.v||'',l:s.l||'',speech:(s.v||'')+' — '+(s.l||'')};
  scene.add(orb); clickables.push(orb);
  floaters.push({mesh:orb,baseY:3.8,speed:.65+i*.1,amp:.26,phase:i*1.45});
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.08,16), neon(0x00ffff,.55));
  disc.position.set(ox,.55,oz); scene.add(disc);
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,2,0),new THREE.Vector3(ox,3.8,oz)]),
    new THREE.LineBasicMaterial({color:0x00ffff,transparent:true,opacity:.15})
  ));
});
/* streams */
mkStream(0,0,-28,-12,0x00ff88); mkStream(0,0,28,-12,0xff00aa);
mkStream(0,-12,0,-32,0xffaa00); mkStream(-28,-12,-28,-32,0x0088ff);
mkStream(28,-12,28,-32,0xff6600); mkStream(0,-32,0,-52,0xff00aa);

/* ── ZONE 1: ABOUT (-28,-12) ── */
mkPlatform(-28,-12,10,9,0x00ff88);
mkZoneLabel(-28,-12,'#00ff88','ABOUT','PROFILE & BACKGROUND',{
  type:'about', title:'◈ ABOUT UJAS DUBAL',
  lines:[PD.title||'','📍 '+(PD.location||'')],
  points:['8.5+ years IT · 5+ years Data Engineering','Technical Lead · Team of 9','M.Sc IT – GLS University 2019 · B.E. Electronics – GTU 2015','TCS On-the-Spot Award 2023'],
  speech:'I am Ujas Dubal, AWS Data Engineer and Technical Lead from Ahmedabad India with 8.5 years of experience specialising in cloud native data engineering on AWS.'
});
/* DNA helix */
for(let i=0;i<28;i++){
  const a=i*.48,r=1.8;
  const s1=new THREE.Mesh(new THREE.SphereGeometry(.14,6,6), neon(0x00ff88,1.7));
  s1.position.set(-28+Math.cos(a)*r,.6+i*.29,-12+Math.sin(a)*r); scene.add(s1);
  const s2=new THREE.Mesh(new THREE.SphereGeometry(.14,6,6), neon(0x00ffff,1.7));
  s2.position.set(-28+Math.cos(a+Math.PI)*r,.6+i*.29,-12+Math.sin(a+Math.PI)*r); scene.add(s2);
  if(i%3===0){
    const pts=[
      new THREE.Vector3(-28+Math.cos(a)*r,.6+i*.29,-12+Math.sin(a)*r),
      new THREE.Vector3(-28+Math.cos(a+Math.PI)*r,.6+i*.29,-12+Math.sin(a+Math.PI)*r)
    ];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({color:0x004444,transparent:true,opacity:.5})));
  }
}
mkTower(-30,-12,3.2,0x00ff88,{type:'about_detail',title:'◈ EXPERIENCE',speech:'8.5 plus years total IT experience, 5 years specialising in Data Engineering on AWS.'});
mkTower(-26,-12,3.2,0x00ffff,{type:'about_detail',title:'◈ EDUCATION',speech:'M.Sc IT from GLS University Ahmedabad 2019 and B.E. Electronics from GTU 2015.'});

/* ── ZONE 2: SKILLS (28,-12) ── */
mkPlatform(28,-12,12,10,0xff00aa);
mkZoneLabel(28,-12,'#ff00aa','SKILLS','TECHNOLOGY MATRIX',{
  type:'skills_ov', title:'◉ SKILLS MATRIX',
  speech:'Skills matrix zone. Each glowing hexagonal tower height equals proficiency percentage. Click any tower to inspect the skill.'
});
safe(PD.skills).forEach((sk,i)=>{
  const cols5=5, row=Math.floor(i/cols5), col=i%cols5;
  mkHexSkill(28-5+col*2.7,1.5,-12-row*4.8, sk.col||0x00ffff, sk.pct||50,{
    type:'skill', title:(sk.icon||'◉')+' '+(sk.name||'Skill'), pct:sk.pct||50,
    speech:(sk.name||'Skill')+', '+(sk.pct||50)+' percent. '+((sk.pct||50)>=90?'Expert level.':((sk.pct||50)>=80?'Advanced level.':'Proficient.'))
  });
});

/* ── ZONE 3: CAREER (0,-32) ── */
mkPlatform(0,-32,18,10,0xffaa00);
mkZoneLabel(0,-32,'#ffaa00','CAREER','TIMELINE · 8.5+ YEARS',{
  type:'exp_ov', title:'▲ CAREER TIMELINE',
  speech:'Career timeline. Four companies over 8.5 years. Click each tower for company details, role, and achievements.'
});
const tlPts=safe(PD.experience).map((_,i)=>new THREE.Vector3((i-1.5)*7.5,.3,-32));
if(tlPts.length>1) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(tlPts),
  new THREE.LineBasicMaterial({color:0xffaa00,transparent:true,opacity:.55})));
safe(PD.experience).forEach((e,i)=>{
  const ex=(i-1.5)*7.5;
  mkTower(ex,-32,3.8+i*1.8,e.col||0xffaa00,{
    type:'exp', title:'▲ '+(e.company||''),
    company:e.company||'',role:e.role||'',period:e.period||'',
    location:e.location||'',logo:e.logo||'',fb:e.fb||'🏢',
    points:safe(e.points), speech:e.speech||''
  });
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.7,.1,16), neon(e.col||0xffaa00,.7));
  disc.position.set(ex,.55,-32); scene.add(disc);
  const yr=new THREE.Mesh(new THREE.TorusGeometry(2,.07,6,32), neon(e.col||0xffaa00,.9));
  yr.rotation.x=Math.PI/2; yr.position.set(ex,.6,-32);
  spinList.push({mesh:yr,axis:'y',speed:.013}); scene.add(yr);
  /* sub label per company */
  const sub=makeSubSprite(e.company||'', '#'+((e.col||0xffaa00).toString(16).padStart(6,'0')));
  sub.position.set(ex,3.2+i*1.8+1.4,-32); scene.add(sub);
});

/* ── ZONE 4: CERTIFICATIONS (-28,-32) ── */
mkPlatform(-28,-32,10,9,0x0088ff);
mkZoneLabel(-28,-32,'#0088ff','CERTIFICATIONS','AWS · MICHIGAN',{
  type:'cert_ov', title:'◆ CERTIFICATIONS',
  speech:'Certifications zone. Four official certifications from Amazon Web Services and University of Michigan. Click each gem for full details.'
});
safe(PD.certifications).forEach((c,i)=>{
  const a=(i/safe(PD.certifications).length)*Math.PI*2;
  mkGem(-28+Math.cos(a)*4.2,3.6,-32+Math.sin(a)*4.2,c.col||0x0088ff,{
    type:'cert', title:'◆ '+(c.title||''),
    lines:[c.issuer||'',c.year||''], speech:c.speech||''
  });
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.7,.9,.55,8), neon(c.col||0x0088ff,.7));
  plinth.position.set(-28+Math.cos(a)*4.2,.9,-32+Math.sin(a)*4.2); scene.add(plinth);
  const cl=makeSubSprite(c.title?.split(' ').slice(0,3).join(' ')||'','#0088ff');
  cl.position.set(-28+Math.cos(a)*4.2,6.4,-32+Math.sin(a)*4.2);
  cl.scale.set(5.5,0.85,1); scene.add(cl);
});
const awsBadge=new THREE.Mesh(new THREE.OctahedronGeometry(1.7,1), neon(0xf59e0b,.55));
awsBadge.position.set(-28,6,-32); spinList.push({mesh:awsBadge,axis:'y',speed:.007}); scene.add(awsBadge);

/* ── ZONE 5: PROJECTS (28,-32) ── */
mkPlatform(28,-32,10,9,0xff6600);
mkZoneLabel(28,-32,'#ff6600','PROJECTS','DATA ENGINEERING',{
  type:'proj_ov', title:'⬟ DATA PROJECTS',
  speech:'Projects zone. Three major data engineering projects. Click each tower for tech stack and impact metrics.'
});
safe(PD.projects).forEach((p,i)=>{
  const a=(i/safe(PD.projects).length)*Math.PI*2;
  const tx=28+Math.cos(a)*4.5, tz=-32+Math.sin(a)*4.5;
  mkTower(tx,tz,5.8+i*1.5,p.col||0xff6600,{
    type:'project', title:'⬟ '+(p.title||''),
    lines:[p.client||'',p.desc||''], tags:safe(p.tags), speech:p.speech||''
  });
  const sub=makeSubSprite(p.title?.split(' ').slice(0,2).join(' ')||'','#ff6600');
  sub.position.set(tx,5.8+i*1.5+2.2,tz); sub.scale.set(5.5,.85,1); scene.add(sub);
});

/* ── ZONE 6: CONTACT (0,-52) ── */
mkPlatform(0,-52,10,10,0xff00aa);
mkZoneLabel(0,-52,'#ff00aa','CONTACT','SEND A MESSAGE',{
  type:'contact', title:'⟡ CONTACT UJAS',
  speech:'Contact zone! Click the spinning pink warp portal to open the direct transmission form.'
});
const warpR=new THREE.Mesh(new THREE.TorusGeometry(4.5,.28,12,64), neon(0xff00aa,2.6));
warpR.position.set(0,5.5,-52);
warpR.userData.info={type:'contact',title:'⟡ CONTACT',speech:'Opening message transmission form to contact Ujas Dubal.'};
spinList.push({mesh:warpR,axis:'y',speed:.024}); scene.add(warpR); clickables.push(warpR);
const warpD=new THREE.Mesh(new THREE.CircleGeometry(4.5,48), basic(0xff00aa,.06));
warpD.material.side=THREE.DoubleSide; warpD.position.set(0,5.5,-52); scene.add(warpD);
/* extra inner ring */
const warpI=new THREE.Mesh(new THREE.TorusGeometry(2.5,.1,8,48), neon(0x00ffff,1.8));
warpI.position.set(0,5.5,-52); warpI.rotation.x=Math.PI/3;
spinList.push({mesh:warpI,axis:'y',speed:-.018}); scene.add(warpI);
[['✉ EMAIL',0x00ffff,-4.5,-48],['◈ LINKEDIN',0xff00aa,4.5,-48]].forEach(([lbl,col,ox,oz])=>{
  const panel=new THREE.Mesh(new THREE.BoxGeometry(3.2,.65,.12), neon(col,.75));
  panel.position.set(ox,3.2,oz); scene.add(panel);
  floaters.push({mesh:panel,baseY:3.2,speed:.5,amp:.14,phase:ox});
  const sub=makeSubSprite(lbl,'#'+col.toString(16).padStart(6,'0'));
  sub.position.set(ox,4.2,oz); sub.scale.set(4,.75,1); scene.add(sub);
});

/* ═══════════════════════════════════════════════════════════
   10. AIDA 2D CANVAS AVATAR + LIP SYNC
═══════════════════════════════════════════════════════════ */
const aidaCanvas2d=$('aida-canvas');
const ac2d=aidaCanvas2d?aidaCanvas2d.getContext('2d'):null;
const AW=110,AH=150;

let lsMouth=0,lsTarget=0,lsBlink=1,lsBlinkT=0,lsActive=false;
let lsSchedule=[],lsStartMs=0;

const phonMap={a:.9,e:.7,i:.5,o:.8,u:.65,b:.1,p:.1,m:.1,f:.3,v:.3,n:.2,d:.3,t:.3,l:.4,s:.25,r:.35,' ':0,'.':.0,',':.0};
function buildSchedule(text){ return [...String(text||'')].map((ch,i)=>({t:i*72,v:phonMap[ch.toLowerCase()]??0.14})); }
function startLS(text){ lsSchedule=buildSchedule(text); lsStartMs=performance.now(); lsActive=true; }
function stopLS(){ lsActive=false; lsTarget=0; }
function tickLS(){
  if(!lsActive){lsMouth+=(0-lsMouth)*.18; return;}
  const el=performance.now()-lsStartMs; let cur=0;
  for(const p of lsSchedule){if(p.t<=el)cur=p.v;else break;}
  if(el>lsSchedule.length*80+250){stopLS();cur=0;}
  lsTarget=cur; lsMouth+=(lsTarget-lsMouth)*.32;
}
function blinkTick(dt){
  lsBlinkT+=dt;
  if(lsBlinkT>4+Math.random()*2){
    lsBlinkT=0; const bs=performance.now();
    (function bl(){const e=(performance.now()-bs)/1000;lsBlink=e<.06?e/.06:e<.12?1-(e-.06)/.06:1;if(e<.12)requestAnimationFrame(bl);else lsBlink=1;}());
  }
}

function drawAIDA(t){
  if(!ac2d) return;
  ac2d.clearRect(0,0,AW,AH);
  const bg=ac2d.createLinearGradient(0,0,0,AH);
  bg.addColorStop(0,'#000c1e'); bg.addColorStop(1,'#000511');
  ac2d.fillStyle=bg; ac2d.fillRect(0,0,AW,AH);
  for(let sy=0;sy<AH;sy+=4){ac2d.fillStyle='rgba(0,0,0,.14)';ac2d.fillRect(0,sy,AW,1);}
  const cx=AW/2,cy=AH/2+2;
  const grd=ac2d.createRadialGradient(cx,cy,8,cx,cy,52);
  grd.addColorStop(0,'rgba(0,255,255,.15)'); grd.addColorStop(1,'rgba(0,255,255,0)');
  ac2d.fillStyle=grd; ac2d.fillRect(0,0,AW,AH);
  ac2d.save(); ac2d.translate(cx,cy);
  ac2d.beginPath(); ac2d.roundRect(-26,-33,52,60,9);
  ac2d.fillStyle='#0a1a2e'; ac2d.fill();
  ac2d.strokeStyle=lsActive?'rgba(0,255,255,.95)':'rgba(0,255,255,.55)';
  ac2d.lineWidth=1.6; ac2d.stroke(); ac2d.restore();
  const eyeH=lsBlink>.5?5.5:lsBlink*11;
  [[-9,-8],[9,-8]].forEach(([ex,ey])=>{
    const eg=ac2d.createRadialGradient(cx+ex,cy+ey,0,cx+ex,cy+ey,9);
    eg.addColorStop(0,'rgba(0,255,255,.5)'); eg.addColorStop(1,'rgba(0,255,255,0)');
    ac2d.fillStyle=eg; ac2d.fillRect(cx+ex-9,cy+ey-9,18,18);
    ac2d.beginPath(); ac2d.ellipse(cx+ex,cy+ey,4.5,eyeH,0,0,Math.PI*2);
    ac2d.fillStyle='#00ffff'; ac2d.fill();
  });
  ac2d.strokeStyle='#00ffff'; ac2d.lineWidth=2;
  ac2d.beginPath(); ac2d.moveTo(cx,cy-33); ac2d.lineTo(cx,cy-46); ac2d.stroke();
  const ab=2+Math.sin(t*3)*.9;
  ac2d.beginPath(); ac2d.arc(cx,cy-46,ab,0,Math.PI*2);
  ac2d.fillStyle='#00ffff'; ac2d.shadowColor='#00ffff'; ac2d.shadowBlur=14; ac2d.fill(); ac2d.shadowBlur=0;
  ac2d.save(); ac2d.translate(cx,cy);
  ac2d.fillStyle='rgba(0,255,255,.07)'; ac2d.strokeStyle='rgba(0,255,255,.3)'; ac2d.lineWidth=1;
  ac2d.beginPath(); ac2d.roundRect(-12,8,24,18,2); ac2d.fill(); ac2d.stroke();
  for(let li=0;li<3;li++){
    const lw=8+Math.sin(t*2.5+li)*5;
    ac2d.fillStyle='rgba(0,255,255,'+(lsActive?.82:.28)+')';
    ac2d.fillRect(-10,11+li*4.6,lw,2);
  }
  ac2d.restore();
  const mO=lsMouth*13,mW=17;
  ac2d.save(); ac2d.translate(cx,cy+22);
  if(lsActive){ac2d.shadowColor='#00ffff';ac2d.shadowBlur=8;}
  ac2d.strokeStyle='#00ffff'; ac2d.lineWidth=2;
  ac2d.beginPath();
  if(mO<2){ac2d.moveTo(-mW/2,0);ac2d.quadraticCurveTo(0,5,mW/2,0);}
  else{ac2d.ellipse(0,0,mW/2,mO/2,0,0,Math.PI*2);ac2d.fillStyle='rgba(0,20,40,.9)';ac2d.fill();}
  ac2d.stroke(); ac2d.restore();
  [[-17,14],[17,14]].forEach(([px,py])=>{
    ac2d.beginPath();ac2d.arc(cx+px,cy+py,2.5,0,Math.PI*2);
    ac2d.fillStyle='rgba(255,0,170,.45)';ac2d.fill();
  });
  ac2d.strokeStyle='rgba(0,255,255,'+(0.28+Math.sin(t*1.5)*.12)+')';
  ac2d.lineWidth=1; ac2d.strokeRect(1,1,AW-2,AH-2);
}

/* AIDA 3D robot proxy */
const aidaG=(()=>{
  const g=new THREE.Group();
  const bm=new THREE.Mesh(new THREE.BoxGeometry(.82,1.1,.55),
    new THREE.MeshStandardMaterial({color:0x0a2a5a,roughness:.6,emissive:0x001133,emissiveIntensity:.4}));
  bm.castShadow=true; g.add(bm);
  const hm=new THREE.Mesh(new THREE.BoxGeometry(.65,.6,.55),
    new THREE.MeshStandardMaterial({color:0x0d2b55,roughness:.6,emissive:0x001133,emissiveIntensity:.4}));
  hm.position.y=.9; hm.castShadow=true; g.add(hm);
  [[-0.14,.95,.29],[.14,.95,.29]].forEach(p=>{
    const e=new THREE.Mesh(new THREE.SphereGeometry(.065,8,8),new THREE.MeshBasicMaterial({color:0x00ffff}));
    e.position.set(...p); g.add(e);
  });
  const ant=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.42,6), neon(0x00ffff,1.2));
  ant.position.set(0,1.42,0); g.add(ant);
  const antB=new THREE.Mesh(new THREE.SphereGeometry(.065,8,8),new THREE.MeshBasicMaterial({color:0x00ffff}));
  antB.position.set(0,1.64,0); g.add(antB);
  const aGlow=new THREE.PointLight(0x00ffff,1.8,4); aGlow.position.set(0,1.64,0); g.add(aGlow);
  g.scale.setScalar(.76); g.position.set(0,1.4,9); scene.add(g);
  return {g,head:hm,aGlow,target:new THREE.Vector3(0,1.4,9)};
})();

/* ═══════════════════════════════════════════════════════════
   11. SPEECH — MALE VOICE PRIORITY
       Order: Google UK English Male → Microsoft David Desktop
              → any en male → any en → first available
═══════════════════════════════════════════════════════════ */
const synth=window.speechSynthesis||null;
let selVoice=null;

function loadVoice(){
  if(!synth) return;
  const vs=synth.getVoices(); if(!vs.length) return;
  selVoice=
    vs.find(v=>v.name==='Google UK English Male') ||
    vs.find(v=>v.name==='Google US English Male') ||
    vs.find(v=>/Microsoft David/i.test(v.name)) ||
    vs.find(v=>/Microsoft Mark/i.test(v.name)) ||
    vs.find(v=>/male/i.test(v.name)&&v.lang.startsWith('en')) ||
    vs.find(v=>v.lang==='en-GB'&&!v.localService) ||
    vs.find(v=>v.lang==='en-US'&&!v.localService) ||
    vs.find(v=>v.lang.startsWith('en')) ||
    vs[0];
  console.log('[AIDA voice]',selVoice?.name||'default');
}
loadVoice();
if(synth&&synth.onvoiceschanged!==undefined) synth.onvoiceschanged=loadVoice;

let curSpeech='', isSpeaking=false;

function stopSpeech(){
  if(synth) synth.cancel();
  stopLS(); isSpeaking=false;
}

function aidaSay(text,zone){
  if(!text) return;
  curSpeech=text;
  /* typewriter */
  const el=$('speech-text');
  if(el){ el.textContent=''; let i=0;
    (function tw(){ if(i<text.length){ el.textContent+=text[i++]; setTimeout(tw,14); } })(); }
  const zt=$('speech-zone');
  if(zt&&zone) zt.textContent='// '+String(zone).toUpperCase();
  startLS(text);
  if(!synth) return;
  synth.cancel(); loadVoice(); isSpeaking=true;
  const u=new SpeechSynthesisUtterance(text);
  u.lang='en-GB'; u.rate=0.88; u.pitch=0.88; u.volume=1;
  if(selVoice) u.voice=selVoice;
  u.onend =()=>{ stopLS(); isSpeaking=false; };
  u.onerror=()=>{ stopLS(); isSpeaking=false; };
  synth.speak(u);
}

/* ── Stop voice on ANY canvas click (including orbit drags) ── */
canvas.addEventListener('pointerdown',()=>{ if(isSpeaking) stopSpeech(); });

const btnRepeat=$('btn-repeat'); if(btnRepeat) btnRepeat.onclick=()=>aidaSay(curSpeech);
const btnStop  =$('btn-stop');   if(btnStop)   btnStop.onclick  =()=>stopSpeech();

/* ═══════════════════════════════════════════════════════════
   12. AMBIENT MUSIC — Tron drone
═══════════════════════════════════════════════════════════ */
let audioCtx=null,musicOn=false,musicOscs=[],masterGain=null;

function startMusic(){
  if(musicOn) return;
  try{ audioCtx=new(window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  masterGain=audioCtx.createGain(); masterGain.gain.value=0.05;
  masterGain.connect(audioCtx.destination);
  const conv=audioCtx.createConvolver();
  const blen=audioCtx.sampleRate*3.5;
  const buf=audioCtx.createBuffer(2,blen,audioCtx.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<blen;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/blen,2); }
  conv.buffer=buf; conv.connect(masterGain);
  const delay=audioCtx.createDelay(1.5); delay.delayTime.value=0.42;
  const dfb=audioCtx.createGain(); dfb.gain.value=0.28;
  delay.connect(dfb); dfb.connect(delay); delay.connect(masterGain);
  [55,82.41,110,146.83,164.81,220,293.66,329.63].forEach((freq,i)=>{
    const osc=audioCtx.createOscillator(),gn=audioCtx.createGain();
    osc.type=['sine','triangle','sine','triangle','sine','triangle','sine','sine'][i];
    osc.frequency.value=freq; osc.detune.value=(Math.random()-.5)*7;
    const lfo=audioCtx.createOscillator(),lfog=audioCtx.createGain();
    lfo.frequency.value=.05+i*.018; lfog.gain.value=.022;
    lfo.connect(lfog); lfog.connect(gn.gain); lfo.start();
    gn.gain.value=.032+Math.random()*.025;
    osc.connect(gn); gn.connect(conv); gn.connect(delay); osc.start();
    musicOscs.push(osc,lfo);
  });
  musicOn=true;
  const b=$('btn-music'); if(b){ b.textContent='◉ MUSIC ON'; b.classList.add('on'); }
}
function stopMusic(){
  if(!musicOn||!audioCtx) return;
  if(masterGain) masterGain.gain.value=0;
  musicOscs.forEach(n=>{ try{n.stop();}catch(e){} }); musicOscs=[];
  musicOn=false;
  const b=$('btn-music'); if(b){ b.textContent='⬡ MUSIC'; b.classList.remove('on'); }
}
const btnMusic=$('btn-music'); if(btnMusic) btnMusic.onclick=()=>musicOn?stopMusic():startMusic();

/* ═══════════════════════════════════════════════════════════
   13. GLOBAL LIVE NEWS
═══════════════════════════════════════════════════════════ */
const NEWS_FEEDS={
  tech:   ['https://feeds.feedburner.com/TechCrunch','https://www.wired.com/feed/rss','https://feeds.arstechnica.com/arstechnica/index'],
  ai:     ['https://www.artificialintelligence-news.com/feed/','https://feeds.feedburner.com/venturebeat/SZYF','https://www.marktechpost.com/feed/'],
  data:   ['https://towardsdatascience.com/feed','https://feeds.feedburner.com/oreilly/radar/atom'],
  world:  ['https://feeds.bbci.co.uk/news/world/rss.xml','https://rss.nytimes.com/services/xml/rss/nyt/World.xml'],
  science:['https://www.sciencedaily.com/rss/top/science.xml','https://feeds.nature.com/nature/rss/current']
};

const FALLBACK={
  tech:[
    {title:'Apple Vision Pro 2 announced with M4 chip',link:'#',pubDate:'2026-03-15',description:'Apple unveils Vision Pro 2 with M4 chip, 40% better performance and dramatically improved micro-OLED displays.'},
    {title:'Google Gemini Ultra 2 supports 2M token context window',link:'#',pubDate:'2026-03-14',description:'DeepMind launches Gemini Ultra 2 with 2 million token context and native multimodal reasoning.'},
    {title:'GitHub Copilot now supports 50+ programming languages',link:'#',pubDate:'2026-03-12',description:'GitHub Copilot expands language support to 50+ including Rust, Scala and PySpark with enterprise features.'}
  ],
  ai:[
    {title:'OpenAI GPT-5 surpasses PhD level on all benchmarks',link:'#',pubDate:'2026-03-18',description:'GPT-5 achieves record scores on MMLU, HumanEval and MATH with real-time web access and long-term memory built in.'},
    {title:'Anthropic Claude 4 Opus — 500K context window',link:'#',pubDate:'2026-03-16',description:'Claude 4 Opus features 500K context, enhanced constitutional AI and dramatically improved multi-step reasoning.'},
    {title:'Meta Llama 4 — 400B open-source model beats GPT-4',link:'#',pubDate:'2026-03-10',description:'Meta Llama 4 with 400B parameters under fully open license outperforms GPT-4 across multiple benchmarks.'},
    {title:'Mistral Large 2 — 128K context and native function calling',link:'#',pubDate:'2026-03-05',description:'Mistral releases its most powerful model with function calling and 128K context across 12 languages.'},
    {title:'DeepSeek R2 matches OpenAI o3 at 10x lower cost',link:'#',pubDate:'2026-03-01',description:'DeepSeek R2 matches o3 on AIME and GPQA benchmarks while being 10 times cheaper via API.'},
    {title:'Google Gemma 3 runs at 40 tokens/sec on Android devices',link:'#',pubDate:'2026-03-08',description:'Gemma 3 7B model runs natively on mid-range Android phones without internet at 40 tokens per second.'}
  ],
  data:[
    {title:'Apache Spark 4.0 — PySpark 3x faster',link:'#',pubDate:'2026-03-14',description:'Spark 4.0 rewritten shuffle engine and Python-first API delivers up to 3x faster PySpark workloads.'},
    {title:'AWS Redshift Serverless cuts costs 40% with auto-suspend',link:'#',pubDate:'2026-03-11',description:'Redshift Serverless intelligent auto-suspend reduces idle compute costs by up to 40%.'},
    {title:'Databricks Unity Catalog now GA across AWS Azure GCP',link:'#',pubDate:'2026-03-09',description:'Unity Catalog is generally available across all three major clouds enabling unified data and AI governance.'}
  ],
  world:[
    {title:'G20 agrees on global AI regulation framework',link:'#',pubDate:'2026-03-17',description:'G20 nations reach consensus on binding AI regulation covering model safety and algorithmic transparency.'},
    {title:'India becomes third largest economy surpassing Japan',link:'#',pubDate:'2026-03-15',description:'India overtakes Japan driven by rapid growth in technology, manufacturing and services sectors.'},
    {title:'SpaceX Starship completes first crewed Mars flyby',link:'#',pubDate:'2026-03-10',description:'SpaceX Starship brings four astronauts within 500km of the Martian surface before returning safely to Earth orbit.'}
  ],
  science:[
    {title:'Room-temperature superconductivity at ambient pressure achieved',link:'#',pubDate:'2026-03-16',description:'MIT researchers verify a room-temperature superconductor at standard atmospheric pressure.'},
    {title:'CRISPR cures sickle cell disease in 95% of trial patients',link:'#',pubDate:'2026-03-12',description:'CRISPR gene therapy achieves complete remission in 95% of sickle cell patients after two years with no adverse effects.'},
    {title:'James Webb detects biosignature gases on Kepler-452b',link:'#',pubDate:'2026-03-08',description:'JWST detects methane and oxygen signatures on the most Earth-like exoplanet yet studied.'}
  ]
};

let newsCache=[],currentCat='tech';

async function fetchNews(cat){
  const feeds=NEWS_FEEDS[cat]||NEWS_FEEDS.tech;
  for(const feed of feeds){
    try{
      const url='https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(feed)+'&count=10';
      const r=await fetch(url,{signal:AbortSignal.timeout(5000)});
      const d=await r.json();
      if(d?.items?.length>2) return d.items.slice(0,12);
    }catch(e){}
  }
  return null;
}

function renderNews(items,cat){
  const list=$('news-list'); if(!list) return;
  list.innerHTML=''; newsCache=items;
  items.forEach((item,i)=>{
    const div=document.createElement('div'); div.className='news-item';
    div.innerHTML=
      `<div class="ni-title">${esc(item.title||'')}</div>`+
      `<div class="ni-meta">${esc(cat.toUpperCase())} · ${fmtDate(item.pubDate)}</div>`+
      `<div class="ni-btns">`+
        `<button class="ni-btn ni-listen" data-idx="${i}">▶ HEAR</button>`+
        `<button class="ni-btn ni-article" data-idx="${i}">◈ ARTICLE</button>`+
        (item.link&&item.link!=='#'?`<button class="ni-btn ni-ext" data-url="${esc(item.link)}">↗ OPEN</button>`:'')+
      `</div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('.ni-listen').forEach(b=>{
    b.onclick=()=>{
      const item=newsCache[+b.dataset.idx]; if(!item) return;
      const txt='Here is the news. '+(item.title||'')+'. '+strip(item.description||'').slice(0,320);
      aidaSay(txt,'AI NEWS FEED');
      b.textContent='◉ READING'; setTimeout(()=>b.textContent='▶ HEAR',4000);
    };
  });
  list.querySelectorAll('.ni-article').forEach(b=>{
    b.onclick=()=>{ const item=newsCache[+b.dataset.idx]; if(item) openArticle(item,cat); };
  });
  list.querySelectorAll('.ni-ext').forEach(b=>{
    b.onclick=()=>window.open(b.dataset.url,'_blank','noopener');
  });
}

let curArticle=null;
function openArticle(item,cat){
  curArticle=item;
  const src=$('article-source'); if(src) src.textContent=cat.toUpperCase()+' · '+fmtDate(item.pubDate);
  const ttl=$('article-title');  if(ttl) ttl.textContent=item.title||'';
  const meta=$('article-meta'); if(meta) meta.textContent=item.author?'By '+item.author:'';
  const clean=strip(item.content||item.description||'');
  const cont=$('article-content');
  if(cont) cont.textContent=clean.length>60?clean:'Full article available at original source. Click ↗ OPEN ORIGINAL to read.';
  const am=$('article-modal'); if(am) am.classList.remove('hidden');
}
const artRead =$('article-read');  if(artRead)  artRead.onclick =()=>{ if(curArticle) aidaSay(($('article-title')||{textContent:''}).textContent+'. '+strip(($('article-content')||{textContent:''}).textContent).slice(0,500),'NEWS'); };
const artOpen =$('article-open');  if(artOpen)  artOpen.onclick =()=>{ if(curArticle?.link&&curArticle.link!=='#') window.open(curArticle.link,'_blank','noopener'); };
const artClose=$('article-close'); if(artClose) artClose.onclick=()=>{ const am=$('article-modal'); if(am) am.classList.add('hidden'); };

async function loadNews(cat){
  currentCat=cat;
  const list=$('news-list');
  if(list) list.innerHTML='<div class="news-loading">◉ FETCHING '+cat.toUpperCase()+' FEED…</div>';
  aidaSay('Fetching '+cat+' news from global data streams.','LIVE NEWS');
  const items=await fetchNews(cat);
  const final=(items&&items.length)?items:(FALLBACK[cat]||FALLBACK.tech);
  renderNews(final,cat);
  const heads=final.slice(0,2).map(i=>i.title||'').join('. Also, ');
  setTimeout(()=>aidaSay('Feed loaded. Top stories: '+heads,'LIVE NEWS'),400);
}

const newsCat  =$('news-category'); if(newsCat)  newsCat.onchange =e=>loadNews(e.target.value);
const newsClose=$('news-close');    if(newsClose) newsClose.onclick=()=>{ const p=$('news-panel'); if(p) p.classList.add('hidden'); };
const btnNews  =$('btn-news');
if(btnNews) btnNews.onclick=()=>{
  const p=$('news-panel'); if(!p) return;
  if(!p.classList.contains('hidden')){ p.classList.add('hidden'); return; }
  p.classList.remove('hidden');
  const list=$('news-list');
  if(!list||!list.children.length||list.firstElementChild?.classList.contains('news-loading'))
    loadNews(currentCat);
};

/* ═══════════════════════════════════════════════════════════
   14. CONTACT FORM
═══════════════════════════════════════════════════════════ */
const cfSend=$('cf-send');
if(cfSend) cfSend.onclick=()=>{
  const name =($('cf-name') ||{value:''}).value.trim();
  const email=($('cf-email')||{value:''}).value.trim();
  const msg  =($('cf-msg')  ||{value:''}).value.trim();
  const status=$('cf-status');
  if(!name||!email||!msg){ if(status){status.textContent='✕ All fields required.';status.className='err';} return; }
  cfSend.disabled=true; cfSend.textContent='◉ TRANSMITTING…';
  if(status){status.textContent='';status.className='';}
  const url=PD.appsScriptUrl||'';
  if(!url||url.includes('YOUR_DEPLOYMENT')){
    window.open(`mailto:${PD.email}?subject=${encodeURIComponent('Portfolio: '+name)}&body=${encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+msg)}`);
    cfSend.disabled=false; cfSend.textContent='⟡ TRANSMIT →';
    if(status){status.textContent='✓ Email client opened.';status.className='ok';}
    aidaSay('Email client opened. Please send from your mail application.','CONTACT');
    return;
  }
  fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message:msg})})
  .then(()=>{
    cfSend.disabled=false; cfSend.textContent='⟡ TRANSMIT →';
    if(status){status.textContent='✓ Transmission successful!';status.className='ok';}
    aidaSay('Message transmitted to Ujas Dubal successfully.','CONTACT');
    ['cf-name','cf-email','cf-msg'].forEach(id=>{const el=$(id);if(el)el.value='';});
  })
  .catch(()=>{
    cfSend.disabled=false; cfSend.textContent='⟡ TRANSMIT →';
    if(status){status.textContent='✕ Network error — use email link below.';status.className='err';}
    aidaSay('Network error. Please use the email link below.','CONTACT');
  });
};
const contClose=$('contact-close'); if(contClose) contClose.onclick=()=>{ const cm=$('contact-modal'); if(cm) cm.classList.add('hidden'); };

/* ═══════════════════════════════════════════════════════════
   15. RAYCASTER — hover + click
═══════════════════════════════════════════════════════════ */
const raycaster=new THREE.Raycaster();
const mouse2  =new THREE.Vector2();
const tip     =$('tooltip');

function hoverRay(e){
  mouse2.x=(e.clientX/W)*2-1; mouse2.y=-(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2,camera);
  const hits=raycaster.intersectObjects(clickables,false);
  if(hits.length&&hits[0].object.userData.info){
    const lbl=hits[0].object.userData.info.title||'';
    if(tip){ tip.textContent='◈ '+lbl; tip.style.left=(e.clientX+16)+'px'; tip.style.top=(e.clientY-28)+'px'; tip.classList.remove('hidden'); }
    canvas.style.cursor='url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpolygon points=\'4,2 4,26 10,20 14,30 17,29 13,19 20,19\' fill=\'%23ff00aa\' stroke=\'%23440022\' stroke-width=\'1\'/%3E%3Ccircle cx=\'22\' cy=\'10\' r=\'4\' fill=\'none\' stroke=\'%23ff00aa\' stroke-width=\'1.5\' opacity=\'.8\'/%3E%3C/svg%3E") 4 2, pointer';
  } else {
    if(tip) tip.classList.add('hidden');
    canvas.style.cursor='url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpolygon points=\'4,2 4,26 10,20 14,30 17,29 13,19 20,19\' fill=\'%2300ffff\' stroke=\'%23003344\' stroke-width=\'1\'/%3E%3Cline x1=\'20\' y1=\'10\' x2=\'28\' y2=\'10\' stroke=\'%2300ffff\' stroke-width=\'1.5\' opacity=\'.6\'/%3E%3Cline x1=\'22\' y1=\'14\' x2=\'28\' y2=\'14\' stroke=\'%2300ffff\' stroke-width=\'1\' opacity=\'.4\'/%3E%3C/svg%3E") 4 2, crosshair';
  }
}

canvas.addEventListener('click',e=>{
  if(O.drag) return;
  mouse2.x=(e.clientX/W)*2-1; mouse2.y=-(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2,camera);
  const hits=raycaster.intersectObjects(clickables,false);
  if(!hits.length) return;
  const obj=hits[0].object, info=obj.userData.info; if(!info) return;
  const ref=obj.userData.capRef;
  if(ref?.material){ const ei=ref.material.emissiveIntensity||1; ref.material.emissiveIntensity=8; setTimeout(()=>{ if(ref.material) ref.material.emissiveIntensity=ei; },300); }
  if(info.type==='contact'){ const cm=$('contact-modal'); if(cm) cm.classList.remove('hidden'); aidaSay(info.speech||'Opening contact form.','CONTACT'); return; }
  buildPanel(info);
  aidaSay(info.speech||info.title||'',info.title||'');
});

/* ─── Logo click → go to ABOUT zone ─── */
const avaImg=$('ava-img');
if(avaImg) avaImg.addEventListener('click',()=>{
  setZone(1);
  aidaSay('About Ujas Dubal — AWS Data Engineer and Technical Lead from Ahmedabad India.','ABOUT');
});

/* ═══════════════════════════════════════════════════════════
   16. INFO PANEL BUILDER
═══════════════════════════════════════════════════════════ */
function buildPanel(info){
  if(!info) return;
  const panel=$('info-panel'),body=$('info-body'),titleEl=$('info-title');
  if(!panel||!body) return;
  if(titleEl) titleEl.textContent=info.title||'';
  const rb=$('info-read'); if(rb) rb.onclick=()=>aidaSay(info.speech||info.title||'',info.title||'');
  let h='';

  switch(info.type){
    case 'home':
      h+=`<div class="stat-grid">${safe(info.stats).map(s=>`<div class="stat-chip"><span class="sv">${esc(s.v)}</span><span class="sl">${esc(s.l)}</span></div>`).join('')}</div>`;
      safe(info.lines).forEach(l=>{ h+=`<p>${esc(l)}</p>`; });
      h+=`<div class="tag-row">${['AWS','PySpark','Redshift','Glue','Airflow','Python','Scala','Terraform'].map(t=>`<span class="tag">${t}</span>`).join('')}</div>`;
      break;
    case 'stat':
      h=`<p style="font-family:var(--fh);font-size:48px;font-weight:900;color:var(--c);text-shadow:0 0 16px var(--c);text-align:center;padding:16px 0">${esc(info.v||'')}</p>
         <p style="text-align:center;font-size:13px;color:var(--mu)">${esc(info.l||'')}</p>`;
      break;
    case 'about':
    case 'about_detail':
      safe(info.lines).forEach(l=>{ h+=`<p class="isub">${esc(l)}</p>`; });
      if(safe(info.points).length) h+=`<ul>${safe(info.points).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;
      break;
    case 'skills_ov':
      h=`<p>Click any hex tower — height = proficiency %.</p><ul>${safe(PD.skills).map(s=>`<li>${esc((s.icon||'')+(s.name||''))} — ${s.pct||0}%</li>`).join('')}</ul>`;
      break;
    case 'skill':
      h=`<span class="spct">${info.pct||0}%</span>
         <div class="sbar-wrap"><div class="sbar-fill" id="sbf"></div></div>
         <p style="margin-top:9px;font-size:11px">Level: <strong style="color:var(--c)">${(info.pct||0)>=90?'Expert':(info.pct||0)>=80?'Advanced':'Proficient'}</strong></p>`;
      setTimeout(()=>{ const f=$('sbf'); if(f) f.style.width=(info.pct||0)+'%'; },55);
      break;
    case 'exp_ov':
      h=`<p>Career timeline — click each tower for details.</p><ul>${safe(PD.experience).map(e=>`<li>${esc(e.company||'')} · ${esc(e.period||'')}</li>`).join('')}</ul>`;
      break;
    case 'exp':
      h+=`<div class="co-row">`;
      if(info.logo) h+=`<img class="co-logo" src="${esc(info.logo)}" alt="${esc(info.company||'')}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="co-fb" style="display:none">${esc(info.fb||'🏢')}</div>`;
      else h+=`<div class="co-fb">${esc(info.fb||'🏢')}</div>`;
      h+=`<div><div class="co-name">${esc(info.company||'')}</div><div class="co-period">${esc(info.period||'')}</div><div class="co-loc">📍 ${esc(info.location||'')}</div></div></div>`;
      h+=`<p class="isub">${esc(info.role||'')}</p><ul>${safe(info.points).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;
      break;
    case 'cert_ov':
      h=`<ul>${safe(PD.certifications).map(c=>`<li>${esc(c.title||'')} · ${esc(c.year||'')}</li>`).join('')}</ul>`;
      break;
    case 'cert':
      safe(info.lines).forEach(l=>{ h+=`<p class="isub">${esc(l)}</p>`; });
      break;
    case 'proj_ov':
      h=`<ul>${safe(PD.projects).map(p=>`<li>${esc(p.title||'')} — ${esc(p.client||'')}</li>`).join('')}</ul>`;
      break;
    case 'project':
      safe(info.lines).forEach(l=>{ h+=`<p class="isub">${esc(l)}</p>`; });
      h+=`<div class="tag-row">${safe(info.tags).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`;
      break;
    default:
      h=`<p>${esc(info.speech||info.title||'')}</p>`;
  }
  body.innerHTML=h;
  panel.classList.remove('hidden');
}
const infoClose=$('info-close'); if(infoClose) infoClose.onclick=()=>{ const p=$('info-panel'); if(p) p.classList.add('hidden'); };

/* ═══════════════════════════════════════════════════════════
   17. ZONE NAVIGATION
═══════════════════════════════════════════════════════════ */
const ZONES=[
  {cx:0,cy:18,cz:38,  lx:0,  ly:0,lz:0,   ax:0,  az:9,  name:'HOME',
   speech:"Welcome to Ujas's Tron Data World! I am AIDA, your AI guide. Click any glowing object to explore all 7 zones. Use keys 1 through 7 to teleport, drag to orbit, scroll to zoom."},
  {cx:-38,cy:14,cz:-4,lx:-28,ly:0,lz:-12, ax:-25,az:-10,name:'ABOUT',
   speech:"About zone. Ujas Dubal is an AWS Data Engineer and Technical Lead from Ahmedabad, India. Over 8.5 years of experience building cloud-native data platforms."},
  {cx:40,cy:14,cz:-4, lx:28, ly:0,lz:-12, ax:25, az:-10,name:'SKILLS',
   speech:"Skills matrix. Each hexagonal tower height equals proficiency percentage. Python 95%, SQL 93%, PySpark 92%, AWS Redshift 90%. Click any tower to inspect."},
  {cx:0,cy:18,cz:-18, lx:0,  ly:0,lz:-32, ax:0,  az:-26,name:'CAREER',
   speech:"Career timeline. TCS, Mind Inventory, Tiny ERP and iSquare — four companies spanning 8.5 years. Click each tower for company details and achievements."},
  {cx:-40,cy:14,cz:-24,lx:-28,ly:0,lz:-32,ax:-25,az:-30,name:'CERTS',
   speech:"Certifications. AWS Certified Developer Associate 2023, plus three University of Michigan Coursera certifications. Click each gem for details."},
  {cx:40,cy:14,cz:-24, lx:28,ly:0,lz:-32, ax:25, az:-30,name:'PROJECTS',
   speech:"Data projects. Real-Time Analytics Platform on AWS, Salesforce Redshift Pipeline, and Secure Banking APIs. Click each tower for full tech stack."},
  {cx:0,cy:16,cz:-42,  lx:0, ly:0,lz:-52, ax:0,  az:-46,name:'CONTACT',
   speech:"Contact zone! Click the spinning pink portal ring to open the direct message form and send a message straight to Ujas Dubal."}
];
let curZone=-1;

function setZone(idx){
  idx=Math.max(0,Math.min(6,idx)); if(idx===curZone) return;
  curZone=idx; const zd=ZONES[idx];
  const dx=zd.cx-zd.lx,dy=zd.cy-zd.ly,dz=zd.cz-zd.lz;
  O.r    =Math.sqrt(dx*dx+dy*dy+dz*dz);
  O.phi  =Math.acos(clamp(dy/O.r,-1,1));
  O.theta=Math.atan2(dx,dz);
  O.tx=zd.lx; O.ty=zd.ly; O.tz=zd.lz;
  aidaG.target.set(zd.ax,1.4,zd.az);
  const zl=$('zone-lbl');
  if(zl){ zl.textContent='// ZONE '+(idx+1)+' · '+zd.name; zl.style.opacity='1'; setTimeout(()=>zl.style.opacity='0',3200); }
  qsa('.znav').forEach((b,i)=>b.classList.toggle('active',i===idx));
  setTimeout(()=>aidaSay(zd.speech,zd.name),220);
}

qsa('.znav').forEach(b=>b.addEventListener('click',()=>setZone(+(b.dataset.zone))));
window.addEventListener('keydown',e=>{
  const tag=e.target?.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA') return;
  if(e.key>='1'&&e.key<='7'){ setZone(+e.key-1); return; }
  if(e.key==='ArrowRight'||e.key==='d'){ setZone(curZone+1); return; }
  if(e.key==='ArrowLeft' ||e.key==='a'){ setZone(curZone-1); return; }
  if(e.key==='n'||e.key==='N') toggleNight();
  if(e.key==='Escape'){
    [$('info-panel'),$('contact-modal'),$('news-panel'),$('article-modal')]
      .forEach(el=>{ if(el) el.classList.add('hidden'); });
  }
});

/* ═══════════════════════════════════════════════════════════
   18. EXTRA FEATURES
═══════════════════════════════════════════════════════════ */
let nightMode=true;
function toggleNight(){
  nightMode=!nightMode;
  scene.fog=new THREE.FogExp2(nightMode?0x000511:0x050d22,nightMode?.013:.008);
  scene.background=new THREE.Color(nightMode?0x000511:0x050d22);
  aidaSay(nightMode?'Night mode. Full Tron darkness activated.':'Dawn mode. Grid brightens.','WORLD');
}

const FUN_FACTS=[
  "Ujas has processed over 10 billion records using PySpark on AWS EMR.",
  "The GitHub Actions pipeline Ujas built reduced deployment time by 34 percent!",
  "Ujas's TCS analytics platform processes real-time streams across 9 cloud services simultaneously.",
  "Ujas secured 100 percent transaction safety using AES-256 and RSA encryption in banking APIs.",
  "The Salesforce Redshift pipeline improved data accuracy by 35 percent for the client.",
  "Ujas leads a team of 9 engineers building real-time data analytics on AWS at TCS.",
  "Ujas holds AWS Certified Developer Associate certification from 2023.",
  "Ujas reduced query latency by 20 percent using PySpark partition optimisation.",
  "CloudWatch alert automation built by Ujas reduced support tickets by 20 percent."
];
let ffIdx=0;
if(aidaCanvas2d) aidaCanvas2d.addEventListener('click',()=>{
  aidaSay(FUN_FACTS[ffIdx%FUN_FACTS.length],'AIDA FUN FACT'); ffIdx++;
});

/* Double-click floor → neon waypoint */
const markers=[];
canvas.addEventListener('dblclick',e=>{
  mouse2.x=(e.clientX/W)*2-1; mouse2.y=-(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2,camera);
  const hits=raycaster.intersectObject(floorMesh,false);
  if(!hits.length) return;
  const pt=hits[0].point;
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,3.5,8), neon(0x00ffff,2.4));
  m.position.set(pt.x,1.75,pt.z); scene.add(m);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.95,.065,6,24), neon(0x00ffff,1.8));
  ring.rotation.x=Math.PI/2; ring.position.set(pt.x,.12,pt.z); scene.add(ring);
  const gl=new THREE.PointLight(0x00ffff,1.3,6); gl.position.set(pt.x,1,pt.z); scene.add(gl);
  spinList.push({mesh:ring,axis:'y',speed:.026});
  floaters.push({mesh:m,baseY:1.75,speed:1.2,amp:.18,phase:Math.random()*Math.PI*2});
  markers.push(m,ring,gl);
  if(markers.length>18){ const old=markers.splice(0,3); old.forEach(o=>scene.remove(o)); }
});

/* ═══════════════════════════════════════════════════════════
   19. START OVERLAY
═══════════════════════════════════════════════════════════ */
const startBtn=$('start-btn');
if(startBtn) startBtn.addEventListener('click',()=>{
  startMusic();
  const so=$('start-overlay');
  if(so){ so.classList.add('gone'); setTimeout(()=>so.style.display='none',750); }
  setZone(0);
});

/* ═══════════════════════════════════════════════════════════
   20. RENDER LOOP
═══════════════════════════════════════════════════════════ */
const clock=new THREE.Clock(); let lastT=0,aidaDrawT=0;

(function loop(){
  requestAnimationFrame(loop);
  const t=clock.getElapsedTime(), dt=t-lastT; lastT=t;

  floaters.forEach(f=>{ f.mesh.position.y=f.baseY+Math.sin(t*f.speed+f.phase)*f.amp; });
  spinList.forEach(s=>{
    if(s.axis==='y') s.mesh.rotation.y+=s.speed;
    else if(s.axis==='x') s.mesh.rotation.x+=s.speed;
    else if(s.axis==='z') s.mesh.rotation.z+=s.speed;
  });
  streamList.forEach(ds=>{
    ds.t+=ds.speed; if(ds.t>=1) ds.t-=1;
    ds.pt.position.lerpVectors(ds.from,ds.to,ds.t);
    ds.pt.position.y+=Math.sin(t*2.5+ds.t*12)*.1;
    ds.light.position.copy(ds.pt.position);
  });

  aidaG.g.position.x+=(aidaG.target.x-aidaG.g.position.x)*.035;
  aidaG.g.position.z+=(aidaG.target.z-aidaG.g.position.z)*.035;
  aidaG.g.position.y=aidaG.target.y+Math.sin(t*1.7)*.16;
  const adx=aidaG.target.x-aidaG.g.position.x,adz=aidaG.target.z-aidaG.g.position.z;
  if(Math.abs(adx)+Math.abs(adz)>.05) aidaG.g.rotation.y=Math.atan2(adx,adz);
  aidaG.head.rotation.y=Math.sin(t*.5)*.27;
  aidaG.aGlow.intensity=1.6+Math.sin(t*3)*.55+(lsActive?Math.sin(t*14)*.4:0);

  /* billboard sprites always face camera */
  scene.children.forEach(obj=>{
    if(obj.isSprite) obj.quaternion.copy(camera.quaternion);
  });

  aidaDrawT+=dt;
  if(aidaDrawT>.033){ aidaDrawT=0; blinkTick(dt*30); tickLS(); drawAIDA(t); }

  orbitUpdate();
  renderer.render(scene,camera);
}());
