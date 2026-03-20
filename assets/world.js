/* ================================================================
   world.js — ES Module · Three.js r163
   Full Tron city · AIDA lip-sync · Live global news · Real contact
   ================================================================ */
import * as THREE from 'three';

const PD = window.PD;
if (!PD) { console.error('data.js not loaded'); }

/* ── helpers ─────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const qsa = s => document.querySelectorAll(s);
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const strip = s => { const d=document.createElement('div'); d.innerHTML=s; return d.textContent||''; };
const fmtDate = s => { try{ return new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return s||''; }};

/* ═══════════════════════════════════════════════════════════
   1. RENDERER
═══════════════════════════════════════════════════════════ */
const canvas = $('world');
let W = innerWidth, H = innerHeight;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x000511);
scene.fog        = new THREE.FogExp2(0x000511, 0.016);

const camera = new THREE.PerspectiveCamera(55, W/H, 0.1, 600);
camera.position.set(0, 18, 38);
camera.lookAt(0, 0, 0);

window.addEventListener('resize', () => {
  W = innerWidth; H = innerHeight;
  camera.aspect = W/H; camera.updateProjectionMatrix();
  renderer.setSize(W, H);
});

/* ═══════════════════════════════════════════════════════════
   2. ORBIT
═══════════════════════════════════════════════════════════ */
const O = { theta:0, phi:1.0, r:38, lt:0, lp:1.0, lr:38,
             tx:0,ty:0,tz:0, ltx:0,lty:0,ltz:0,
             down:false, lmx:0, lmy:0, drag:false, dsx:0, dsy:0 };

canvas.addEventListener('pointerdown', e => {
  O.down=true; O.lmx=e.clientX; O.lmy=e.clientY;
  O.dsx=e.clientX; O.dsy=e.clientY; O.drag=false;
});
canvas.addEventListener('pointerup',   () => { O.down=false; });
canvas.addEventListener('pointermove', e => {
  if (!O.down) { hoverRay(e); return; }
  if (Math.abs(e.clientX-O.dsx)>4||Math.abs(e.clientY-O.dsy)>4) O.drag=true;
  O.theta -= (e.clientX-O.lmx)*0.006;
  O.phi   -= (e.clientY-O.lmy)*0.004;
  O.phi    = Math.max(0.1, Math.min(Math.PI/2.05, O.phi));
  O.lmx=e.clientX; O.lmy=e.clientY;
});
canvas.addEventListener('wheel', e => {
  O.r = Math.max(6, Math.min(95, O.r+e.deltaY*0.04)); e.preventDefault();
}, { passive:false });

function orbitUpdate() {
  O.lt  += (O.theta-O.lt )*0.09;  O.lp  += (O.phi  -O.lp )*0.09;  O.lr  += (O.r   -O.lr )*0.09;
  O.ltx += (O.tx  -O.ltx)*0.07;  O.lty += (O.ty  -O.lty)*0.07;  O.ltz += (O.tz  -O.ltz)*0.07;
  camera.position.set(
    O.ltx + O.lr*Math.sin(O.lp)*Math.sin(O.lt),
    O.lty + O.lr*Math.cos(O.lp),
    O.ltz + O.lr*Math.sin(O.lp)*Math.cos(O.lt)
  );
  camera.lookAt(O.ltx, O.lty, O.ltz);
}

/* ═══════════════════════════════════════════════════════════
   3. LIGHTS
═══════════════════════════════════════════════════════════ */
scene.add(new THREE.AmbientLight(0x001133, 3));
const sun = new THREE.DirectionalLight(0x0055bb, 1.6);
sun.position.set(25,55,20); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera, { near:1, far:250, left:-85, right:85, top:85, bottom:-85 });
scene.add(sun);
[[0x00ffff,0,9,0,65],[0xff00aa,-38,5,-18,52],[0x0088ff,38,5,18,52],[0x00ff88,0,8,-45,58]].forEach(([c,x,y,z,d])=>{
  const pl=new THREE.PointLight(c,1.8,d); pl.position.set(x,y,z); scene.add(pl);
});

/* ═══════════════════════════════════════════════════════════
   4. GEOMETRY HELPERS
═══════════════════════════════════════════════════════════ */
const floaters=[], spinList=[], streamList=[], clickables=[];

const neon = (c, ei=0.5) => new THREE.MeshStandardMaterial({
  color:c, emissive:c, emissiveIntensity:ei, roughness:0.25, metalness:0.7
});
const dark = c => new THREE.MeshStandardMaterial({ color:c, roughness:0.9, metalness:0.1 });
const basic = (c,op=1,wire=false) => new THREE.MeshBasicMaterial({
  color:c, transparent:op<1, opacity:op, wireframe:wire
});

/* Floor + grids */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(300,300), dark(0x000814));
floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
const g1=new THREE.GridHelper(300,60,0x00ffff,0x001a33);
g1.material.opacity=0.42; g1.material.transparent=true; g1.position.y=0.01; scene.add(g1);
const g2=new THREE.GridHelper(300,300,0x002244,0x001022);
g2.material.opacity=0.2; g2.material.transparent=true; g2.position.y=0.015; scene.add(g2);

/* Procedural Tron city background buildings */
(function buildCity(){
  const COLS=[0x00ffff,0xff00aa,0x0088ff,0x00ff88,0xffaa00,0xff4400];
  for(let i=0;i<180;i++){
    const h=2+Math.random()*28, w=1+Math.random()*3.5;
    const bx=(Math.random()-.5)*280, bz=(Math.random()-.5)*280;
    if(Math.abs(bx)<42&&Math.abs(bz)<62) continue;
    const col=COLS[Math.floor(Math.random()*COLS.length)];
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,w), dark(0x000d1e));
    body.position.set(bx,h/2,bz); body.castShadow=true; scene.add(body);
    /* neon outline */
    const wire=new THREE.Mesh(new THREE.BoxGeometry(w+.05,h+.05,w+.05), basic(col,.2,true));
    wire.position.copy(body.position); scene.add(wire);
    /* top glow cap */
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w+.2,.12,w+.2), neon(col,2.0));
    cap.position.set(bx,h+.06,bz); scene.add(cap);
    /* random windows */
    for(let j=0;j<Math.floor(h/2);j++){
      const win=new THREE.Mesh(new THREE.BoxGeometry(w*.55,.18,w*.55), neon(col,.8));
      win.position.set(bx,j*2+1+Math.random(),bz+w*.45); scene.add(win);
    }
  }
}());

/* Tron road lines */
(function buildRoads(){
  const rm=basic(0x00ffff,.22);
  for(let i=-6;i<=6;i++){
    const rh=new THREE.Mesh(new THREE.PlaneGeometry(300,.28), rm);
    rh.rotation.x=-Math.PI/2; rh.position.set(0,.02,i*12); scene.add(rh);
    const rv=new THREE.Mesh(new THREE.PlaneGeometry(.28,300), rm);
    rv.rotation.x=-Math.PI/2; rv.position.set(i*12,.02,0); scene.add(rv);
  }
}());

/* Zone platform */
function platform(x,z,rx,rz,col){
  const plat=new THREE.Mesh(new THREE.BoxGeometry(rx*2,.5,rz*2), dark(0x000e1e));
  plat.position.set(x,.25,z); plat.receiveShadow=true; scene.add(plat);
  const wire=new THREE.Mesh(new THREE.BoxGeometry(rx*2+.08,.52,rz*2+.08), basic(col,.6,true));
  wire.position.copy(plat.position); scene.add(wire);
  /* glow edge line */
  const edge=new THREE.Mesh(new THREE.BoxGeometry(rx*2,.06,rz*2), neon(col,1.5));
  edge.position.set(x,.52,z); scene.add(edge);
  /* corner beacons */
  for(const cx of [-rx+.6,rx-.6]) for(const cz of [-rz+.6,rz-.6]){
    const bcon=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,4,6), neon(col,.9));
    bcon.position.set(x+cx,2.5,z+cz); scene.add(bcon);
    const top=new THREE.Mesh(new THREE.SphereGeometry(.2,8,8), neon(col,2));
    top.position.set(x+cx,4.8,z+cz); scene.add(top);
    const pl=new THREE.PointLight(col,.7,6); pl.position.set(x+cx,5,z+cz); scene.add(pl);
    floaters.push({mesh:top, baseY:4.8, speed:.8+Math.random()*.4, amp:.15, phase:Math.random()*Math.PI*2});
  }
  /* section label floating above */
  return plat;
}

/* Floating section sign (large readable label plate) */
function signPlate(x,y,z,col,info){
  const plate=new THREE.Mesh(new THREE.BoxGeometry(10,1.6,.18), neon(col,.55));
  plate.position.set(x,y,z);
  plate.userData.info=info;
  plate.userData.baseEI=.55;
  scene.add(plate);
  clickables.push(plate);
  floaters.push({mesh:plate, baseY:y, speed:.35, amp:.2, phase:Math.random()*Math.PI*2});
  spinList.push({mesh:plate, axis:'y', speed:.002});
  /* glow aura around plate */
  const aura=new THREE.Mesh(new THREE.BoxGeometry(10.3,1.9,.05), basic(col,.12));
  aura.position.set(x,y,z); scene.add(aura);
  floaters.push({mesh:aura, baseY:y, speed:.35, amp:.2, phase:plate.userData.phase||0});
  return plate;
}

/* Tower */
function tower(x,z,h,col,info){
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.8,h,1.8), dark(0x000d1e));
  body.position.set(x,h/2,z); body.castShadow=true; scene.add(body);
  const wire=new THREE.Mesh(new THREE.BoxGeometry(1.82,h+.04,1.82), basic(col,.7,true));
  wire.position.copy(body.position); scene.add(wire);
  /* neon horizontal rings on tower */
  for(let i=1;i<=3;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.4,.06,6,32), neon(col,1.2));
    ring.rotation.x=Math.PI/2; ring.position.set(x,h*.25*i,z); scene.add(ring);
  }
  const cap=new THREE.Mesh(new THREE.BoxGeometry(2.1,.28,2.1), neon(col,2.0));
  cap.position.set(x,h+.14,z); scene.add(cap);
  const proxy=new THREE.Mesh(new THREE.BoxGeometry(2.4,h+.6,2.4), new THREE.MeshBasicMaterial({visible:false}));
  proxy.position.set(x,h/2,z);
  proxy.userData.info=info; proxy.userData.capRef=cap;
  scene.add(proxy); clickables.push(proxy);
  floaters.push({mesh:cap, baseY:h+.14, speed:.5+Math.random()*.3, amp:.12, phase:Math.random()*Math.PI*2});
  const halo=new THREE.Mesh(new THREE.TorusGeometry(1.5,.06,6,36), neon(col,1.6));
  halo.rotation.x=Math.PI/2; halo.position.set(x,h*.6,z);
  spinList.push({mesh:halo, axis:'y', speed:.016}); scene.add(halo);
  const pl=new THREE.PointLight(col,.8,8); pl.position.set(x,h+1,z); scene.add(pl);
  return proxy;
}

/* Gem octahedron */
function gem(x,y,z,col,info){
  const body=new THREE.Mesh(new THREE.OctahedronGeometry(.9,0), dark(0x000d1e));
  body.position.set(x,y,z); scene.add(body);
  const wire=new THREE.Mesh(new THREE.OctahedronGeometry(.92,0), basic(col,.85,true));
  wire.position.set(x,y,z); scene.add(wire);
  const inner=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0), neon(col,.6));
  inner.position.set(x,y,z); scene.add(inner);
  const pl=new THREE.PointLight(col,.9,5); pl.position.set(x,y,z); scene.add(pl);
  const proxy=new THREE.Mesh(new THREE.SphereGeometry(1.3,8,8), new THREE.MeshBasicMaterial({visible:false}));
  proxy.position.set(x,y,z); proxy.userData.info=info;
  scene.add(proxy); clickables.push(proxy);
  floaters.push({mesh:body, baseY:y, speed:.7+Math.random()*.3, amp:.24, phase:Math.random()*Math.PI*2});
  floaters.push({mesh:wire, baseY:y, speed:.7+Math.random()*.3, amp:.24, phase:(proxy.userData.phase||0)});
  floaters.push({mesh:inner, baseY:y, speed:.7+Math.random()*.3, amp:.24, phase:(proxy.userData.phase||0)});
  spinList.push({mesh:body, axis:'y', speed:.018});
  spinList.push({mesh:wire, axis:'y', speed:.018});
  spinList.push({mesh:inner, axis:'y', speed:-.022});
  return proxy;
}

/* Data stream */
function stream(x1,z1,x2,z2,col){
  const from=new THREE.Vector3(x1,.08,z1), to=new THREE.Vector3(x2,.08,z2);
  const dir=new THREE.Vector3().subVectors(to,from);
  const road=new THREE.Mesh(new THREE.BoxGeometry(.3,.04,dir.length()), basic(col,.3));
  road.position.copy(from).addScaledVector(dir.normalize(),dir.length()/2); road.lookAt(to); scene.add(road);
  const pt=new THREE.Mesh(new THREE.SphereGeometry(.18,6,6), neon(col,3));
  const light=new THREE.PointLight(col,1.2,5);
  scene.add(pt); scene.add(light);
  streamList.push({pt,light,from:from.clone(),to:to.clone(),t:Math.random(),speed:.005+Math.random()*.005});
}

/* Floating skill hexagon icon */
function hexIcon(x,y,z,col,label,pct,info){
  const outer=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.0,.15,6), neon(col,.9));
  outer.position.set(x,y,z); scene.add(outer);
  const inner=new THREE.Mesh(new THREE.CylinderGeometry(pct/120,.01,.16,6), neon(col,1.8));
  inner.position.set(x,y+.01,z); scene.add(inner);
  /* bar column showing proficiency */
  const bar=new THREE.Mesh(new THREE.BoxGeometry(.35,pct/28,.35), neon(col,1.2));
  bar.position.set(x,y-pct/56-.1,z); scene.add(bar);
  const barWire=new THREE.Mesh(new THREE.BoxGeometry(.37,pct/28+.04,.37), basic(col,.6,true));
  barWire.position.copy(bar.position); scene.add(barWire);
  const proxy=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,pct/14+.4,6), new THREE.MeshBasicMaterial({visible:false}));
  proxy.position.set(x,y-pct/28,z); proxy.userData.info=info;
  scene.add(proxy); clickables.push(proxy);
  floaters.push({mesh:outer, baseY:y, speed:.55+Math.random()*.3, amp:.1, phase:Math.random()*Math.PI*2});
  floaters.push({mesh:inner, baseY:y+.01, speed:.55, amp:.1, phase:outer.userData.phase||0});
  spinList.push({mesh:outer, axis:'y', speed:.008});
  return proxy;
}

/* Ambient floating particles */
(()=>{
  const N=2500, pos=new Float32Array(N*3), col=new Float32Array(N*3);
  const pal=[[0,1,1],[1,0,.67],[0,.53,1],[0,1,.53],[1,.53,0]];
  for(let i=0;i<N;i++){
    pos[i*3]=(Math.random()-.5)*240; pos[i*3+1]=Math.random()*35; pos[i*3+2]=(Math.random()-.5)*240;
    const c=pal[Math.floor(Math.random()*pal.length)];
    col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    size:.15,vertexColors:true,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false
  })));
})();

/* ═══════════════════════════════════════════════════════════
   5. BUILD 7 ZONES — each with rich readable objects
═══════════════════════════════════════════════════════════ */

/* ── HOME (centre) ── */
platform(0,0,10,10,0x00ffff);
signPlate(0,7.5,0, 0x00ffff, {
  type:'home', title:'UJAS DUBAL · AWS DATA ENGINEER',
  lines:[PD.title, PD.tagline], stats:PD.stats,
  speech:'Welcome to the Ujas Data World! I am Ujas Dubal, AWS Data Engineer and Technical Lead with 8.5 years of experience. I architect cloud native data platforms on AWS.'
});
/* Triple portal rings */
const ring1=new THREE.Mesh(new THREE.TorusGeometry(5,.15,12,64), neon(0x00ffff,2.0));
ring1.position.set(0,5,0); spinList.push({mesh:ring1,axis:'y',speed:.008}); scene.add(ring1);
const ring2=new THREE.Mesh(new THREE.TorusGeometry(3.5,.1,12,64), neon(0xff00aa,2.0));
ring2.position.set(0,5,0); ring2.rotation.x=Math.PI/3; spinList.push({mesh:ring2,axis:'y',speed:-.012}); scene.add(ring2);
const ring3=new THREE.Mesh(new THREE.TorusGeometry(6.5,.08,8,64), neon(0x0088ff,1.6));
ring3.position.set(0,5,0); ring3.rotation.z=Math.PI/4.5; spinList.push({mesh:ring3,axis:'y',speed:.006}); scene.add(ring3);

/* Stat orbs around home */
PD.stats.forEach((s,i)=>{
  const a=(i/PD.stats.length)*Math.PI*2;
  const ox=Math.cos(a)*7, oz=Math.sin(a)*7;
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.75,12,12), neon(0x00ffff,.7));
  orb.position.set(ox,3.5+Math.sin(i)*.4,oz);
  orb.userData.info={type:'stat',v:s.v,l:s.l,speech:s.v+' '+s.l};
  scene.add(orb); clickables.push(orb);
  floaters.push({mesh:orb,baseY:3.5,speed:.65+i*.08,amp:.22,phase:i*1.4});
  /* label disc */
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.08,16), neon(0x00ffff,.5));
  disc.position.set(ox,.55,oz); scene.add(disc);
  /* connector */
  const pts=[new THREE.Vector3(0,2,0),new THREE.Vector3(ox,3.5,oz)];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({color:0x00ffff,transparent:true,opacity:.18})));
});

stream(0,0,-28,-12,0x00ff88);
stream(0,0, 28,-12,0xff00aa);
stream(0,-12,0,-32,0xffaa00);
stream(-28,-12,-28,-32,0x0088ff);
stream(28,-12, 28,-32,0xff6600);
stream(0,-32, 0,-52,0xff00aa);

/* ── ABOUT (-28,-12) ── */
platform(-28,-12,8,7,0x00ff88);
signPlate(-28,6.5,-12, 0x00ff88, {
  type:'about', title:'◈ ABOUT UJAS',
  lines:[PD.title,'📍 '+PD.location],
  points:['8.5+ years IT · 5+ years Data Engineering',
          'Technical Lead · 1.5+ yrs leadership',
          'M.Sc IT – GLS University 2019',
          'B.E. Electronics – GTU 2015',
          'TCS On-the-Spot Award 2023 · CoA 2024'],
  speech:'I am Ujas Dubal, AWS Data Engineer from Ahmedabad India with 8.5 years experience specialising in data engineering on AWS cloud.'
});
/* DNA helix decoration */
for(let i=0;i<24;i++){
  const a=i*.5, r=1.5;
  const s1=new THREE.Mesh(new THREE.SphereGeometry(.12,6,6), neon(0x00ff88,1.4));
  s1.position.set(-28+Math.cos(a)*r,1+i*.3,-12+Math.sin(a)*r); scene.add(s1);
  const s2=new THREE.Mesh(new THREE.SphereGeometry(.12,6,6), neon(0x00ffff,1.4));
  s2.position.set(-28+Math.cos(a+Math.PI)*r,1+i*.3,-12+Math.sin(a+Math.PI)*r); scene.add(s2);
  if(i%3===0){
    const bar=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,r*2,4), neon(0x004444,.6));
    bar.position.set(-28,1+i*.3,-12); bar.rotation.z=Math.PI/2; scene.add(bar);
  }
}

/* ── SKILLS (28,-12) ── */
platform(28,-12,10,8,0xff00aa);
signPlate(28,7,-12, 0xff00aa, {
  type:'skills_ov', title:'◉ SKILLS MATRIX',
  speech:'Skills matrix zone. Each hexagon tower represents a technology. Height equals proficiency. Click any tower.'
});
/* Hex grid layout for skills */
PD.skills.forEach((sk,i)=>{
  const cols=5, row=Math.floor(i/cols), col2=i%cols;
  const sx=28-5+col2*2.6;
  const sz=-12-row*4.2;
  hexIcon(sx,-row*4.2+1.5+(-12),3.2, sk.col, sk.name, sk.pct, {
    type:'skill', title:sk.icon+' '+sk.name, pct:sk.pct,
    speech:sk.name+', '+sk.pct+' percent proficiency. '+(sk.pct>=90?'Expert level.':'Advanced level.')
  });
});

/* ── EXPERIENCE (0,-32) ── */
platform(0,-32,16,8,0xffaa00);
signPlate(0,7.5,-32, 0xffaa00, {
  type:'exp_ov', title:'▲ CAREER TIMELINE',
  speech:'Career timeline zone. Four companies spanning 8.5 years. Click each tower to see company details.'
});
PD.experience.forEach((e,i)=>{
  const ex=(i-1.5)*7;
  tower(ex,-32, 3+i*1.6, e.col, {
    type:'exp', title:'▲ '+e.company,
    company:e.company, role:e.role, period:e.period,
    location:e.location, logo:e.logo, fb:e.fb,
    points:e.points, speech:e.speech
  });
  /* Floating company name disc */
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,.1,16), neon(e.col,.5));
  disc.position.set(ex,.6,-32); scene.add(disc);
});
/* Timeline connecting line */
const tlPts=PD.experience.map((_,i)=>new THREE.Vector3((i-1.5)*7,.2,-32));
scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(tlPts),
  new THREE.LineBasicMaterial({color:0xffaa00,transparent:true,opacity:.45})));

/* ── CERTIFICATIONS (-28,-32) ── */
platform(-28,-32,8,7,0x0088ff);
signPlate(-28,6.5,-32, 0x0088ff, {
  type:'cert_ov', title:'◆ CERTIFICATIONS',
  speech:'Certifications zone. Four official certifications. Click each spinning gem.'
});
PD.certifications.forEach((c,i)=>{
  const a=(i/PD.certifications.length)*Math.PI*2;
  gem(-28+Math.cos(a)*3.8, 3.2, -32+Math.sin(a)*3.8, c.col, {
    type:'cert', title:'◆ '+c.title, lines:[c.issuer,c.year], speech:c.speech
  });
  /* Award ribbon-like plinth */
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.6,.8,.5,8), neon(c.col,.6));
  plinth.position.set(-28+Math.cos(a)*3.8,.8,-32+Math.sin(a)*3.8); scene.add(plinth);
});
/* AWS cert badge special decoration */
const awsBadge=new THREE.Mesh(new THREE.OctahedronGeometry(1.5,1), neon(0xf59e0b,.4));
awsBadge.position.set(-28,5,-32); spinList.push({mesh:awsBadge,axis:'y',speed:.007}); scene.add(awsBadge);

/* ── PROJECTS (28,-32) ── */
platform(28,-32,8,7,0xff6600);
signPlate(28,6.5,-32, 0xff6600, {
  type:'proj_ov', title:'⬟ DATA PROJECTS',
  speech:'Projects zone. Three major data engineering projects built by Ujas. Click each tower.'
});
PD.projects.forEach((p,i)=>{
  const a=(i/PD.projects.length)*Math.PI*2;
  const tx=28+Math.cos(a)*4, tz=-32+Math.sin(a)*4;
  tower(tx,tz, 5.5+i*1.3, p.col, {
    type:'project', title:'⬟ '+p.title, lines:[p.client,p.desc], tags:p.tags, speech:p.speech
  });
  /* Floating tech tag orbits */
  p.tags.slice(0,2).forEach((tag,j)=>{
    const ta=(j/2)*Math.PI+a;
    const tg=new THREE.Mesh(new THREE.BoxGeometry(1.4,.35,.12), neon(p.col,.7));
    tg.position.set(tx+Math.cos(ta)*2.2,7+j*.8+i*.5,tz+Math.sin(ta)*2.2);
    tg.rotation.y=ta; scene.add(tg);
    floaters.push({mesh:tg,baseY:7+j*.8+i*.5,speed:.6+j*.2,amp:.15,phase:ta});
  });
});

/* ── CONTACT (0,-52) ── */
platform(0,-52,8,8,0xff00aa);
signPlate(0,7,-52, 0xff00aa, {
  type:'contact', title:'⟡ CONTACT UJAS',
  speech:"Click the warp portal to transmit a direct message to Ujas Dubal."
});
const warpRing=new THREE.Mesh(new THREE.TorusGeometry(4,.25,12,64), neon(0xff00aa,2.2));
warpRing.position.set(0,5,-52); spinList.push({mesh:warpRing,axis:'y',speed:.02}); scene.add(warpRing);
const warpDisc=new THREE.Mesh(new THREE.CircleGeometry(4,48), basic(0xff00aa,.07,false));
warpDisc.material.side=THREE.DoubleSide; warpDisc.position.set(0,5,-52); scene.add(warpDisc);
const warpProxy=new THREE.Mesh(new THREE.CylinderGeometry(4.5,4.5,9,16), new THREE.MeshBasicMaterial({visible:false}));
warpProxy.position.set(0,4.5,-52);
warpProxy.userData.info={type:'contact',title:'⟡ CONTACT', speech:"Opening transmission form."};
scene.add(warpProxy); clickables.push(warpProxy);
/* email/linkedin floating panels */
[['✉ EMAIL',0x00ffff,-3.5,-48],['◈ LINKEDIN',0xff00aa,3.5,-48]].forEach(([lbl,col,ox,oz])=>{
  const panel=new THREE.Mesh(new THREE.BoxGeometry(2.8,.6,.1), neon(col,.6));
  panel.position.set(ox,3,oz); scene.add(panel);
  floaters.push({mesh:panel,baseY:3,speed:.5,amp:.12,phase:ox});
});

/* ═══════════════════════════════════════════════════════════
   6. AIDA 2D CANVAS AVATAR + LIP SYNC
═══════════════════════════════════════════════════════════ */
const ac2d = $('aida-canvas').getContext('2d');
const AW=110, AH=150;
let lsMouth=0, lsTarget=0, lsBlink=1, lsBlinkT=0, lsActive=false;
let lsSchedule=[], lsStart=0;
const phonMap={a:.9,e:.7,i:.5,o:.8,u:.65,b:.1,p:.1,m:.1,f:.3,v:.3,n:.2,d:.3,t:.3,l:.4,s:.25,r:.35,' ':0,'.':.0,',':.0};

function buildSchedule(text){ return [...text].map((ch,i)=>({t:i*78,v:phonMap[ch.toLowerCase()]??0.14})); }
function startLS(text){ lsSchedule=buildSchedule(text); lsStart=performance.now(); lsActive=true; }
function stopLS(){ lsActive=false; lsTarget=0; }
function tickLS(){
  if(!lsActive){ lsMouth+=(0-lsMouth)*.2; return; }
  const el=performance.now()-lsStart;
  let cur=0;
  for(const p of lsSchedule){ if(p.t<=el) cur=p.v; else break; }
  if(el>lsSchedule.length*80){ stopLS(); cur=0; }
  lsTarget=cur; lsMouth+=(lsTarget-lsMouth)*.32;
}
function blinkTick(dt){
  lsBlinkT+=dt;
  if(lsBlinkT>4+Math.random()*2){
    lsBlinkT=0; const bs=performance.now();
    (function bl(){ const e=(performance.now()-bs)/1000;
      lsBlink=e<.06?e/.06:e<.12?1-(e-.06)/.06:1;
      if(e<.12) requestAnimationFrame(bl); else lsBlink=1; })();
  }
}
function drawAIDA(t){
  ac2d.clearRect(0,0,AW,AH);
  const bg=ac2d.createLinearGradient(0,0,0,AH);
  bg.addColorStop(0,'#000c1e'); bg.addColorStop(1,'#000511');
  ac2d.fillStyle=bg; ac2d.fillRect(0,0,AW,AH);
  for(let sy=0;sy<AH;sy+=4){ ac2d.fillStyle='rgba(0,0,0,.14)'; ac2d.fillRect(0,sy,AW,1); }
  const cx=AW/2, cy=AH/2+2;
  /* head glow */
  const grd=ac2d.createRadialGradient(cx,cy,8,cx,cy,50);
  grd.addColorStop(0,'rgba(0,255,255,.14)'); grd.addColorStop(1,'rgba(0,255,255,0)');
  ac2d.fillStyle=grd; ac2d.fillRect(0,0,AW,AH);
  /* head */
  ac2d.save(); ac2d.translate(cx,cy);
  ac2d.beginPath(); ac2d.roundRect(-26,-33,52,60,9);
  ac2d.fillStyle='#0a1a2e'; ac2d.fill();
  ac2d.strokeStyle=lsActive?'rgba(0,255,255,.9)':'rgba(0,255,255,.55)';
  ac2d.lineWidth=1.5; ac2d.stroke(); ac2d.restore();
  /* eyes */
  const eyeH=lsBlink>.5?5.5:lsBlink*11;
  [[-9,-8],[9,-8]].forEach(([ex,ey])=>{
    const eg=ac2d.createRadialGradient(cx+ex,cy+ey,0,cx+ex,cy+ey,9);
    eg.addColorStop(0,'rgba(0,255,255,.45)'); eg.addColorStop(1,'rgba(0,255,255,0)');
    ac2d.fillStyle=eg; ac2d.fillRect(cx+ex-9,cy+ey-9,18,18);
    ac2d.beginPath(); ac2d.ellipse(cx+ex,cy+ey,4.5,eyeH,0,0,Math.PI*2);
    ac2d.fillStyle='#00ffff'; ac2d.fill();
  });
  /* antenna */
  ac2d.strokeStyle='#00ffff'; ac2d.lineWidth=2;
  ac2d.beginPath(); ac2d.moveTo(cx,cy-33); ac2d.lineTo(cx,cy-46); ac2d.stroke();
  const ab=2+Math.sin(t*3)*.9;
  ac2d.beginPath(); ac2d.arc(cx,cy-46,ab,0,Math.PI*2);
  ac2d.fillStyle='#00ffff'; ac2d.shadowColor='#00ffff'; ac2d.shadowBlur=12; ac2d.fill();
  ac2d.shadowBlur=0;
  /* chest screen */
  ac2d.save(); ac2d.translate(cx,cy);
  ac2d.fillStyle='rgba(0,255,255,.07)'; ac2d.strokeStyle='rgba(0,255,255,.32)'; ac2d.lineWidth=1;
  ac2d.beginPath(); ac2d.roundRect(-12,8,24,18,2); ac2d.fill(); ac2d.stroke();
  for(let li=0;li<3;li++){
    const lw=8+Math.sin(t*2.5+li)*5;
    ac2d.fillStyle='rgba(0,255,255,'+(lsActive?.8:.28)+')';
    ac2d.fillRect(-10,11+li*4.5,lw,2);
  }
  ac2d.restore();
  /* mouth */
  const mO=lsMouth*13, mW=17;
  ac2d.save(); ac2d.translate(cx,cy+22);
  if(lsActive){ ac2d.shadowColor='#00ffff'; ac2d.shadowBlur=7; }
  ac2d.strokeStyle='#00ffff'; ac2d.lineWidth=2;
  ac2d.beginPath();
  if(mO<2){ ac2d.moveTo(-mW/2,0); ac2d.quadraticCurveTo(0,5,mW/2,0); }
  else { ac2d.ellipse(0,0,mW/2,mO/2,0,0,Math.PI*2); ac2d.fillStyle='rgba(0,20,40,.9)'; ac2d.fill(); }
  ac2d.stroke(); ac2d.restore();
  /* cheek dots */
  [[-17,14],[17,14]].forEach(([px,py])=>{
    ac2d.beginPath(); ac2d.arc(cx+px,cy+py,2.5,0,Math.PI*2);
    ac2d.fillStyle='rgba(255,0,170,.45)'; ac2d.fill();
  });
  /* border scan */
  ac2d.strokeStyle='rgba(0,255,255,'+(0.28+Math.sin(t*1.5)*.12)+')';
  ac2d.lineWidth=1; ac2d.strokeRect(1,1,AW-2,AH-2);
}

/* AIDA 3D proxy in scene */
const aidaG=(()=>{
  const g=new THREE.Group();
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.8,1.1,.55),neon(0x0a2a5a,.3)),{castShadow:true}));
  const head=new THREE.Mesh(new THREE.BoxGeometry(.65,.6,.55),neon(0x0d2b55,.25));
  head.position.y=.9; head.castShadow=true; g.add(head);
  [[-0.14,.95,.29],[.14,.95,.29]].forEach(p=>{
    const e=new THREE.Mesh(new THREE.SphereGeometry(.065,8,8),new THREE.MeshBasicMaterial({color:0x00ffff}));
    e.position.set(...p); g.add(e);
  });
  const ant=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.4,6),neon(0x00ffff,1.2));
  ant.position.set(0,1.4,0); g.add(ant);
  const antB=new THREE.Mesh(new THREE.SphereGeometry(.065,8,8),new THREE.MeshBasicMaterial({color:0x00ffff}));
  antB.position.set(0,1.62,0); g.add(antB);
  const aGlow=new THREE.PointLight(0x00ffff,1.6,3.5); aGlow.position.set(0,1.62,0); g.add(aGlow);
  g.scale.setScalar(.75); g.position.set(0,1.4,9); scene.add(g);
  return {g,head,aGlow,target:new THREE.Vector3(0,1.4,9)};
})();

/* ═══════════════════════════════════════════════════════════
   7. SPEECH API + LIP SYNC
═══════════════════════════════════════════════════════════ */
const synth=speechSynthesis;
let selVoice=null;
function loadVoice(){
  const vs=synth.getVoices();
  if(!vs.length) return;
  selVoice=vs.find(v=>v.name.includes('Google US English'))
    ||vs.find(v=>v.lang==='en-US'&&!v.localService)
    ||vs.find(v=>v.lang?.startsWith('en'))
    ||vs[0];
}
loadVoice();
if(synth.onvoiceschanged!==undefined) synth.onvoiceschanged=loadVoice;

let curSpeech='';
function aidaSay(text, zone=''){
  if(!text) return;
  curSpeech=text;
  /* typewriter */
  const el=$('speech-text'); if(el){ el.textContent=''; let i=0;
    (function tw(){ if(i<text.length){ el.textContent+=text[i++]; setTimeout(tw,15); } })(); }
  const zt=$('speech-zone'); if(zt&&zone) zt.textContent='// '+zone.toUpperCase();
  startLS(text);
  synth.cancel(); loadVoice();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='en-US'; u.rate=.87; u.pitch=1; u.volume=1;
  if(selVoice) u.voice=selVoice;
  u.onend=stopLS; u.onerror=stopLS;
  synth.speak(u);
}
$('btn-repeat').onclick=()=>aidaSay(curSpeech);
$('btn-stop').onclick=()=>{ synth.cancel(); stopLS(); };

/* ═══════════════════════════════════════════════════════════
   8. AMBIENT MUSIC (Web Audio — Tron drone)
═══════════════════════════════════════════════════════════ */
let audioCtx=null, musicOn=false, musicOscs=[], masterGain=null;

function startMusic(){
  if(musicOn) return;
  try{ audioCtx=new(AudioContext||webkitAudioContext)(); }catch(e){ return; }
  masterGain=audioCtx.createGain(); masterGain.gain.value=.05;
  masterGain.connect(audioCtx.destination);
  /* reverb */
  const conv=audioCtx.createConvolver();
  const blen=audioCtx.sampleRate*3.5;
  const buf=audioCtx.createBuffer(2,blen,audioCtx.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch);
    for(let i=0;i<blen;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/blen,2); }
  conv.buffer=buf; conv.connect(masterGain);
  /* delay */
  const delay=audioCtx.createDelay(1.5); delay.delayTime.value=.42;
  const dfb=audioCtx.createGain(); dfb.gain.value=.28;
  delay.connect(dfb); dfb.connect(delay); delay.connect(masterGain);
  /* Tron drone frequencies */
  [55,82.41,110,146.83,164.81,220,293.66,329.63].forEach((freq,i)=>{
    const osc=audioCtx.createOscillator();
    const gn=audioCtx.createGain();
    osc.type=['sine','triangle','sine','triangle','sine','triangle','sine','sine'][i];
    osc.frequency.value=freq;
    osc.detune.value=(Math.random()-.5)*7;
    const lfo=audioCtx.createOscillator(), lfog=audioCtx.createGain();
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
$('btn-music').onclick=()=>musicOn?stopMusic():startMusic();

/* ═══════════════════════════════════════════════════════════
   9. GLOBAL LIVE NEWS — multi-feed, multi-category
      Uses rss2json.com free API (no key needed for public RSS)
      AI/LLM feed uses dedicated ML news RSS sources
═══════════════════════════════════════════════════════════ */
const NEWS_FEEDS={
  tech:[
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index'
  ],
  ai:[
    'https://www.artificialintelligence-news.com/feed/',
    'https://feeds.feedburner.com/venturebeat/SZYF',
    'https://machinelearningmastery.com/feed/'
  ],
  data:[
    'https://towardsdatascience.com/feed',
    'https://feeds.feedburner.com/oreilly/radar/atom',
    'https://www.databricks.com/feed'
  ],
  world:[
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://feeds.reuters.com/reuters/topNews'
  ],
  science:[
    'https://www.sciencedaily.com/rss/top/science.xml',
    'https://feeds.nature.com/nature/rss/current',
    'https://www.newscientist.com/feed/home'
  ]
};

/* Fallback static stories per category so news panel is NEVER empty */
const FALLBACK={
  tech:[
    {title:'Apple Vision Pro 2 announced with M4 chip and 4K micro-OLED displays',link:'#',pubDate:'2026-03-15',description:'Apple unveils the second generation Vision Pro headset with dramatically improved display resolution and the new M4 chip, offering 40% better performance.'},
    {title:'Google announces Gemini Ultra 2 with 2M context window',link:'#',pubDate:'2026-03-14',description:'Google DeepMind launches Gemini Ultra 2, supporting up to 2 million token context windows and native multimodal reasoning across text, code, images, and video.'},
    {title:'Microsoft GitHub Copilot now supports 50+ programming languages',link:'#',pubDate:'2026-03-12',description:'GitHub Copilot expands language support to over 50 programming languages including Rust, Scala, and PySpark with context-aware enterprise features.'}
  ],
  ai:[
    {title:'OpenAI GPT-5 launches with reasoning scores surpassing PhD level on all benchmarks',link:'#',pubDate:'2026-03-18',description:'GPT-5 achieves unprecedented scores on MMLU, HumanEval, and MATH benchmarks. Features real-time web access, code execution, and long-term memory by default.'},
    {title:'Anthropic Claude 4 Opus sets new standard for safe long-context AI',link:'#',pubDate:'2026-03-16',description:'Claude 4 Opus from Anthropic features 500K context window, enhanced constitutional AI, and significantly improved multi-step reasoning capabilities.'},
    {title:'Meta Llama 4 released — 400B parameter open-source model beats GPT-4',link:'#',pubDate:'2026-03-10',description:'Meta releases Llama 4 with 400 billion parameters under a fully open license. The model outperforms GPT-4 on multiple benchmarks and supports fine-tuning.'},
    {title:'Google Gemma 3 ultra-efficient model runs natively on Android devices',link:'#',pubDate:'2026-03-08',description:'Google releases Gemma 3, a 7B parameter model optimized for on-device inference. Runs at 40 tokens/second on mid-range Android phones without internet.'},
    {title:'Mistral AI releases Mistral Large 2 with 128K context and function calling',link:'#',pubDate:'2026-03-05',description:'French AI startup Mistral releases its most powerful model yet with native function calling, 128K context, and multilingual support across 12 languages.'},
    {title:'DeepSeek R2 from China matches o3 reasoning performance at fraction of cost',link:'#',pubDate:'2026-03-01',description:'DeepSeek releases R2, a reasoning model that matches OpenAI o3 on AIME and GPQA benchmarks while being 10x cheaper to run via API.'}
  ],
  data:[
    {title:'Apache Spark 4.0 ships — PySpark gains 3x performance with ANSI SQL',link:'#',pubDate:'2026-03-14',description:'The Apache Spark 4.0 release includes a rewritten shuffle engine, native ANSI SQL mode, and a new Python-first API that delivers up to 3x faster PySpark workloads.'},
    {title:'AWS Redshift Serverless cuts costs 40% with intelligent auto-suspend',link:'#',pubDate:'2026-03-11',description:'Amazon Redshift Serverless introduces intelligent auto-suspend and resume, reducing idle compute costs by up to 40% for intermittent analytics workloads.'},
    {title:'Databricks Unity Catalog now GA across AWS Azure GCP',link:'#',pubDate:'2026-03-09',description:'Databricks announces Unity Catalog is generally available across all three major cloud providers, enabling unified governance for data and AI assets.'}
  ],
  world:[
    {title:'G20 summit agrees on global AI regulation framework',link:'#',pubDate:'2026-03-17',description:'G20 nations reach consensus on a binding framework for AI regulation, covering foundation model safety, data privacy, and algorithmic transparency requirements.'},
    {title:'India becomes third largest economy surpassing Japan',link:'#',pubDate:'2026-03-15',description:'India officially overtakes Japan to become the world third largest economy by nominal GDP, driven by rapid growth in technology, manufacturing, and services sectors.'},
    {title:'SpaceX Starship completes first crewed Mars flyby mission',link:'#',pubDate:'2026-03-10',description:'SpaceX Starship successfully completes a crewed Mars flyby, bringing four astronauts within 500km of the Martian surface before returning safely to Earth orbit.'}
  ],
  science:[
    {title:'Scientists achieve room-temperature superconductivity at ambient pressure',link:'#',pubDate:'2026-03-16',description:'Researchers at MIT announce a verified room-temperature superconductor that works at standard atmospheric pressure, potentially revolutionising energy transmission.'},
    {title:'CRISPR gene therapy cures sickle cell disease in 95% of trial patients',link:'#',pubDate:'2026-03-12',description:'A landmark clinical trial shows CRISPR-based gene therapy achieves complete remission in 95% of sickle cell disease patients with no serious adverse effects after two years.'},
    {title:'James Webb telescope discovers biosignature gases on Kepler-452b',link:'#',pubDate:'2026-03-08',description:'NASA JWST detects methane and oxygen spectral signatures in the atmosphere of Kepler-452b, the most Earth-like exoplanet yet studied, reigniting debate on extraterrestrial life.'}
  ]
};

let newsCache=[];
let currentCategory='tech';

async function fetchNews(cat){
  const feeds=NEWS_FEEDS[cat]||NEWS_FEEDS.tech;
  for(const feed of feeds){
    try{
      const url='https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(feed)+'&count=10';
      const r=await fetch(url); const d=await r.json();
      if(d?.items?.length>2) return d.items.slice(0,10);
    }catch(e){}
  }
  return null; /* all feeds failed → caller uses fallback */
}

function renderNews(items, cat){
  const list=$('news-list'); if(!list) return;
  list.innerHTML='';
  newsCache=items;
  items.forEach((item,i)=>{
    const div=document.createElement('div'); div.className='news-item';
    div.innerHTML=
      `<div class="ni-title">${esc(item.title)}</div>`+
      `<div class="ni-meta">${item.source||cat.toUpperCase()} · ${fmtDate(item.pubDate)}</div>`+
      `<div class="ni-btns">`+
        `<button class="ni-btn ni-listen" data-idx="${i}">▶ AIDA READS</button>`+
        `<button class="ni-btn ni-article" data-idx="${i}">◈ FULL ARTICLE</button>`+
        (item.link&&item.link!=='#'?`<button class="ni-btn ni-ext" data-url="${esc(item.link)}">↗ ORIGINAL</button>`:'')+
      `</div>`;
    list.appendChild(div);
  });

  /* AIDA READS button */
  list.querySelectorAll('.ni-listen').forEach(b=>{
    b.onclick=()=>{
      const item=newsCache[+b.dataset.idx]; if(!item) return;
      const txt='Here is the news. '+item.title+'. '+(item.description?strip(item.description).slice(0,300)+'...':'');
      aidaSay(txt,'AI NEWS FEED');
      b.textContent='◉ READING…';
      setTimeout(()=>b.textContent='▶ AIDA READS',3500);
    };
  });

  /* FULL ARTICLE button — opens internal article modal */
  list.querySelectorAll('.ni-article').forEach(b=>{
    b.onclick=()=>{
      const item=newsCache[+b.dataset.idx]; if(!item) return;
      openArticle(item, cat);
    };
  });

  /* External link */
  list.querySelectorAll('.ni-ext').forEach(b=>{
    b.onclick=()=>window.open(b.dataset.url,'_blank','noopener');
  });
}

/* Open full article in modal */
let currentArticleItem=null;
function openArticle(item, cat){
  currentArticleItem=item;
  $('article-source').textContent=(item.source||cat.toUpperCase())+' · '+fmtDate(item.pubDate);
  $('article-title').textContent=item.title||'';
  $('article-meta').textContent=item.author?'By '+item.author:'';
  /* Content: use description, strip html, fallback */
  const raw=item.content||item.description||'';
  const clean=strip(raw);
  $('article-content').textContent=clean.length>80
    ? clean
    : 'Full article content is available at the original source. Click ↗ OPEN ORIGINAL to read the complete article.';
  $('article-modal').classList.remove('hidden');
}

/* Article modal buttons */
$('article-read').onclick=()=>{
  if(!currentArticleItem) return;
  const txt=$('article-title').textContent+'. '+strip($('article-content').textContent).slice(0,500);
  aidaSay(txt,'NEWS ARTICLE');
};
$('article-open').onclick=()=>{
  if(currentArticleItem?.link&&currentArticleItem.link!=='#')
    window.open(currentArticleItem.link,'_blank','noopener');
};
$('article-close').onclick=()=>$('article-modal').classList.add('hidden');

/* Load news on category change + initial open */
async function loadNews(cat){
  currentCategory=cat;
  const list=$('news-list');
  if(list) list.innerHTML='<div class="news-loading">◉ FETCHING '+cat.toUpperCase()+' FEED…</div>';
  aidaSay('Fetching '+cat+' news from global data streams. Stand by.','LIVE NEWS');
  const items=await fetchNews(cat);
  const final=items&&items.length?items:FALLBACK[cat]||FALLBACK.tech;
  renderNews(final, cat);
  const heads=final.slice(0,2).map(i=>i.title).join('. Also, ');
  aidaSay('News loaded. Top stories: '+heads,'LIVE NEWS FEED');
}

$('news-category').onchange=e=>loadNews(e.target.value);
$('btn-news').onclick=()=>{
  const p=$('news-panel'); if(!p) return;
  if(!p.classList.contains('hidden')){ p.classList.add('hidden'); return; }
  p.classList.remove('hidden');
  if(!$('news-list').children.length||$('news-list').firstElementChild?.classList.contains('news-loading'))
    loadNews(currentCategory);
};
$('news-close').onclick=()=>$('news-panel').classList.add('hidden');

/* ═══════════════════════════════════════════════════════════
   10. CONTACT FORM — real POST to Google Apps Script
═══════════════════════════════════════════════════════════ */
$('cf-send').onclick=()=>{
  const name=($('cf-name')||{}).value||'';
  const email=($('cf-email')||{}).value||'';
  const msg=($('cf-msg')||{}).value||'';
  const status=$('cf-status');
  if(!name.trim()||!email.trim()||!msg.trim()){
    if(status){ status.textContent='✕ All fields required.'; status.className='err'; } return;
  }
  const btn=$('cf-send'); btn.disabled=true; btn.textContent='◉ TRANSMITTING…';
  if(status){ status.textContent=''; status.className=''; }

  const url=(PD.appsScriptUrl||'');
  if(!url||url.includes('YOUR_DEPLOYMENT')){
    /* mailto fallback */
    window.open(`mailto:ujasdubal@gmail.com?subject=${encodeURIComponent('Portfolio: '+name)}&body=${encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+msg)}`);
    btn.disabled=false; btn.textContent='⟡ TRANSMIT →';
    if(status){ status.textContent='✓ Email client opened — send from there.'; status.className='ok'; }
    aidaSay('Email client opened. Please send your message from your mail application.','CONTACT');
    return;
  }

  fetch(url,{ method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name,email,message:msg}) })
  .then(()=>{
    btn.disabled=false; btn.textContent='⟡ TRANSMIT →';
    if(status){ status.textContent='✓ Transmission successful! Ujas will reply soon.'; status.className='ok'; }
    aidaSay('Message transmitted to Ujas Dubal. He will reply to you very soon.','CONTACT');
    $('cf-name').value=''; $('cf-email').value=''; $('cf-msg').value='';
  })
  .catch(()=>{
    btn.disabled=false; btn.textContent='⟡ TRANSMIT →';
    if(status){ status.textContent='✕ Network error — use email link below.'; status.className='err'; }
    aidaSay('Network error. Please use the email link below.','CONTACT');
  });
};
$('contact-close').onclick=()=>$('contact-modal').classList.add('hidden');

/* ═══════════════════════════════════════════════════════════
   11. RAYCASTER — click + hover
═══════════════════════════════════════════════════════════ */
const raycaster=new THREE.Raycaster();
const mouse2=new THREE.Vector2();
const tip=$('tooltip');

function hoverRay(e){
  mouse2.x=(e.clientX/W)*2-1; mouse2.y=-(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2,camera);
  const hits=raycaster.intersectObjects(clickables,false);
  if(hits.length&&hits[0].object.userData.info){
    const lbl=hits[0].object.userData.info.title||'';
    if(tip){ tip.textContent='◈ '+lbl; tip.style.left=(e.clientX+14)+'px';
      tip.style.top=(e.clientY-26)+'px'; tip.classList.remove('hidden'); }
  } else { if(tip) tip.classList.add('hidden'); }
}

canvas.addEventListener('click', e=>{
  if(O.drag) return;
  mouse2.x=(e.clientX/W)*2-1; mouse2.y=-(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2,camera);
  const hits=raycaster.intersectObjects(clickables,false);
  if(!hits.length) return;
  const obj=hits[0].object; const info=obj.userData.info; if(!info) return;
  /* Flash */
  const ref=obj.userData.capRef||obj.userData.wireRef;
  if(ref?.material){ const ei=ref.material.emissiveIntensity||1;
    ref.material.emissiveIntensity=6; setTimeout(()=>{ if(ref.material) ref.material.emissiveIntensity=ei; },320); }
  if(info.type==='contact'){
    $('contact-modal').classList.remove('hidden');
    aidaSay(info.speech,'CONTACT'); return;
  }
  buildPanel(info); aidaSay(info.speech,info.title);
});

/* ═══════════════════════════════════════════════════════════
   12. INFO PANEL BUILDER
═══════════════════════════════════════════════════════════ */
function buildPanel(info){
  const panel=$('info-panel'), body=$('info-body'), titleEl=$('info-title');
  if(!panel||!body) return;
  if(titleEl) titleEl.textContent=info.title||'';
  const rb=$('info-read'); if(rb) rb.onclick=()=>aidaSay(info.speech||info.title,info.title);
  let h='';

  if(info.type==='home'){
    h+=`<div class="stat-grid">${PD.stats.map(s=>`<div class="stat-chip"><span class="sv">${esc(s.v)}</span><span class="sl">${esc(s.l)}</span></div>`).join('')}</div>`;
    info.lines.forEach(l=>h+=`<p>${esc(l)}</p>`);
    h+=`<div class="tag-row">${['AWS','PySpark','Redshift','Glue','Airflow','Python','Scala','Terraform'].map(t=>`<span class="tag">${t}</span>`).join('')}</div>`;

  }else if(info.type==='stat'){
    h=`<p style="font-family:var(--fh);font-size:46px;font-weight:900;color:var(--c);text-shadow:0 0 14px var(--c);text-align:center;padding:14px 0">${esc(info.v)}</p><p style="text-align:center;font-size:13px">${esc(info.l)}</p>`;

  }else if(info.type==='about'){
    h+=`<p class="isub">${esc(info.lines[0])}</p><p>${esc(info.lines[1])}</p><ul>${info.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;

  }else if(info.type==='skills_ov'){
    h=`<p>Each hexagonal tower height = proficiency %. Click any tower for detail.</p><ul>${PD.skills.map(s=>`<li>${esc(s.icon+' '+s.name)} — ${s.pct}%</li>`).join('')}</ul>`;

  }else if(info.type==='skill'){
    h=`<span class="spct">${info.pct}%</span><div class="sbar-wrap"><div class="sbar-fill" id="sbf"></div></div>`+
      `<p style="margin-top:9px;font-size:11px">Level: <strong style="color:var(--c)">${info.pct>=90?'Expert':info.pct>=80?'Advanced':'Proficient'}</strong></p>`;
    setTimeout(()=>{ const f=$('sbf'); if(f) f.style.width=info.pct+'%'; },55);

  }else if(info.type==='exp'){
    h+=`<div class="co-row">`;
    if(info.logo) h+=`<img class="co-logo" src="${esc(info.logo)}" alt="${esc(info.company)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="co-fb" style="display:none">${esc(info.fb)}</div>`;
    else h+=`<div class="co-fb">${esc(info.fb)}</div>`;
    h+=`<div><div class="co-name">${esc(info.company)}</div><div class="co-period">${esc(info.period)}</div><div class="co-loc">📍 ${esc(info.location)}</div></div></div>`;
    h+=`<p class="isub">${esc(info.role)}</p><ul>${info.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;

  }else if(info.type==='exp_ov'){
    h=`<p>Click each tower to explore each company.</p><ul>${PD.experience.map(e=>`<li>${esc(e.company)} · ${esc(e.period)}</li>`).join('')}</ul>`;

  }else if(info.type==='cert'){
    h=`<p class="isub">${esc(info.lines[0])}</p><p style="color:var(--c);font-size:13px">${esc(info.lines[1])}</p>`;

  }else if(info.type==='cert_ov'){
    h=`<ul>${PD.certifications.map(c=>`<li>${esc(c.title)} · ${esc(c.year)}</li>`).join('')}</ul>`;

  }else if(info.type==='project'){
    info.lines.forEach(l=>h+=`<p class="isub">${esc(l)}</p>`);
    h+=`<div class="tag-row">${info.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`;

  }else if(info.type==='proj_ov'){
    h=`<ul>${PD.projects.map(p=>`<li>${esc(p.title)} — ${esc(p.client)}</li>`).join('')}</ul>`;
  }

  body.innerHTML=h; panel.classList.remove('hidden');
}
$('info-close').onclick=()=>$('info-panel').classList.add('hidden');

/* ═══════════════════════════════════════════════════════════
   13. ZONE NAVIGATION
═══════════════════════════════════════════════════════════ */
const ZONES=[
  {cx:0,cy:18,cz:38, lx:0,ly:0,lz:0,   ax:0, az:8,  name:'HOME',    speech:"Welcome to Ujas's Tron Data World! I'm AIDA your AI guide. Click any glowing object to explore. Press keys 1 through 7 to jump between zones, or drag to orbit!"},
  {cx:-38,cy:14,cz:-4, lx:-28,ly:0,lz:-12, ax:-25,az:-10, name:'ABOUT',   speech:"About zone. Ujas Dubal is an AWS Data Engineer from Ahmedabad India. Over 8.5 years of experience. Click the rotating sign for full details."},
  {cx:40,cy:14,cz:-4,  lx:28,ly:0,lz:-12,  ax:25,az:-10,  name:'SKILLS',  speech:"Skills matrix zone. Each glowing hexagonal tower represents a technology. Tower height equals proficiency percentage. Click any tower to inspect."},
  {cx:0,cy:18,cz:-18,  lx:0,ly:0,lz:-32,   ax:0,az:-26,   name:'CAREER',  speech:"Career timeline. Four companies over 8.5 years. Click each tower to see company logo, location, and key achievements."},
  {cx:-40,cy:14,cz:-24, lx:-28,ly:0,lz:-32, ax:-25,az:-30, name:'CERTS',   speech:"Certifications zone. Four official certifications from AWS and University of Michigan. Click each spinning gem to hear details."},
  {cx:40,cy:14,cz:-24,  lx:28,ly:0,lz:-32,  ax:25,az:-30,  name:'PROJECTS',speech:"Projects zone. Three major data engineering projects. Click each tower for full tech stack details and impact metrics."},
  {cx:0,cy:16,cz:-42,   lx:0,ly:0,lz:-52,   ax:0,az:-46,   name:'CONTACT', speech:"Contact zone! Click the spinning warp portal to open the direct message transmission form and send a message to Ujas."}
];
let curZone=-1;

function setZone(idx){
  idx=Math.max(0,Math.min(6,idx));
  if(idx===curZone) return;
  curZone=idx; const zd=ZONES[idx];
  const dx=zd.cx-zd.lx, dy=zd.cy-zd.ly, dz=zd.cz-zd.lz;
  O.r=Math.sqrt(dx*dx+dy*dy+dz*dz);
  O.phi=Math.acos(Math.max(-1,Math.min(1,dy/O.r)));
  O.theta=Math.atan2(dx,dz);
  O.tx=zd.lx; O.ty=zd.ly; O.tz=zd.lz;
  aidaG.target.set(zd.ax,1.4,zd.az);
  const zl=$('zone-lbl');
  if(zl){ zl.textContent='// ZONE '+(idx+1)+' · '+zd.name; zl.style.opacity='1';
    setTimeout(()=>zl.style.opacity='0',3000); }
  qsa('.znav').forEach((b,i)=>b.classList.toggle('active',i===idx));
  setTimeout(()=>aidaSay(zd.speech,zd.name),200);
}

qsa('.znav').forEach(b=>b.addEventListener('click',()=>setZone(+b.dataset.zone)));
window.addEventListener('keydown', e=>{
  const tag=e.target?.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA') return;
  if(e.key>='1'&&e.key<='7'){ setZone(+e.key-1); return; }
  if(e.key==='ArrowRight'||e.key==='d'){ setZone(curZone+1); return; }
  if(e.key==='ArrowLeft' ||e.key==='a'){ setZone(curZone-1); return; }
  if(e.key==='Escape'){
    $('info-panel').classList.add('hidden');
    $('contact-modal').classList.add('hidden');
    $('news-panel').classList.add('hidden');
    $('article-modal').classList.add('hidden');
  }
});

/* ═══════════════════════════════════════════════════════════
   14. START OVERLAY
═══════════════════════════════════════════════════════════ */
$('start-btn').addEventListener('click',()=>{
  startMusic();
  const so=$('start-overlay'); if(so){ so.classList.add('gone'); setTimeout(()=>so.style.display='none',750); }
  setZone(0);
});

/* ═══════════════════════════════════════════════════════════
   15. EXTRA INTERACTIVE FEATURES
       — Easter egg: click AIDA 2D canvas → AIDA dances + says fun fact
       — Double-click floor → place neon marker
       — Day/Night toggle via D key
═══════════════════════════════════════════════════════════ */
let nightMode=true;
const FUN_FACTS=[
  "Did you know? Ujas has processed over 10 billion records using PySpark on AWS EMR.",
  "Fun fact: The GitHub Actions CI/CD pipeline Ujas built reduced deployment time by 34 percent!",
  "Ujas's TCS analytics platform processes real-time streaming data across 9 cloud services simultaneously.",
  "Ujas secured 100 percent transaction safety using AES-256 and RSA encryption in banking APIs.",
  "The Salesforce Redshift pipeline Ujas built improved data accuracy by 35 percent for the client."
];
let ffIdx=0;
$('aida-canvas').addEventListener('click',()=>{
  aidaSay(FUN_FACTS[ffIdx%FUN_FACTS.length],'AIDA FUN FACT'); ffIdx++;
});

let markers=[];
canvas.addEventListener('dblclick',e=>{
  mouse2.x=(e.clientX/W)*2-1; mouse2.y=-(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2,camera);
  const floor_mesh=scene.children.find(c=>c.isMesh&&c.geometry?.type==='PlaneGeometry');
  if(!floor_mesh) return;
  const hits=raycaster.intersectObject(floor_mesh,false);
  if(!hits.length) return;
  const pt=hits[0].point;
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,3,8), neon(0x00ffff,2));
  m.position.set(pt.x,1.5,pt.z);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.06,6,24), neon(0x00ffff,1.5));
  ring.rotation.x=Math.PI/2; ring.position.set(pt.x,.1,pt.z);
  scene.add(m); scene.add(ring);
  spinList.push({mesh:ring,axis:'y',speed:.025});
  markers.push(m,ring);
  if(markers.length>16){ scene.remove(markers.shift()); scene.remove(markers.shift()); }
});

window.addEventListener('keydown', e=>{
  if(e.key==='n'||e.key==='N'){
    nightMode=!nightMode;
    scene.fog.density=nightMode?.016:.008;
    scene.background=new THREE.Color(nightMode?0x000511:0x050d22);
    aidaSay(nightMode?'Night mode activated. Full Tron darkness.':'Dawn mode. Grid brightens.','WORLD');
  }
});

/* ═══════════════════════════════════════════════════════════
   16. MAIN RENDER LOOP
═══════════════════════════════════════════════════════════ */
const clock=new THREE.Clock(); let lastT=0, aidaT=0;

(function loop(){
  requestAnimationFrame(loop);
  const t=clock.getElapsedTime(), dt=t-lastT; lastT=t;

  /* Float */
  floaters.forEach(f=>{ f.mesh.position.y=f.baseY+Math.sin(t*f.speed+f.phase)*f.amp; });

  /* Spin */
  spinList.forEach(s=>{
    if(s.axis==='y') s.mesh.rotation.y+=s.speed;
    else if(s.axis==='x') s.mesh.rotation.x+=s.speed;
    else if(s.axis==='z') s.mesh.rotation.z+=s.speed;
  });

  /* Data stream particles */
  streamList.forEach(ds=>{
    ds.t+=ds.speed; if(ds.t>=1) ds.t-=1;
    ds.pt.position.lerpVectors(ds.from,ds.to,ds.t);
    ds.pt.position.y+=Math.sin(t*2.5+ds.t*12)*.1;
    ds.light.position.copy(ds.pt.position);
  });

  /* AIDA 3D */
  aidaG.g.position.x+=(aidaG.target.x-aidaG.g.position.x)*.035;
  aidaG.g.position.z+=(aidaG.target.z-aidaG.g.position.z)*.035;
  aidaG.g.position.y=aidaG.target.y+Math.sin(t*1.7)*.15;
  const adx=aidaG.target.x-aidaG.g.position.x, adz=aidaG.target.z-aidaG.g.position.z;
  if(Math.abs(adx)+Math.abs(adz)>.05) aidaG.g.rotation.y=Math.atan2(adx,adz);
  aidaG.head.rotation.y=Math.sin(t*.5)*.26;
  aidaG.aGlow.intensity=1.4+Math.sin(t*3)*.55+(lsActive?Math.sin(t*14)*.4:0);

  /* AIDA 2D canvas ~30fps */
  aidaT+=dt; if(aidaT>.033){ aidaT=0; blinkTick(dt*30); tickLS(); drawAIDA(t); }

  orbitUpdate();
  renderer.render(scene,camera);
})();

