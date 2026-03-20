/* ================================================================
   world.js — Cyberpunk Holographic Portfolio World
   Three.js r163 ES Module
   Features:
   - UnrealBloom post-processing
   - CSS2DRenderer for crisp HTML labels
   - Nanobot particle assembly intro
   - Male voice with phoneme expansion
   - Click-anywhere-stops-voice
   - Dark buildings with emissive edges only
   - Minimap
   ================================================================ */
import * as THREE              from 'three';
import { EffectComposer }      from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }          from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }     from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }          from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/* ── Guard ── */
if(!window.PD){ const m='FATAL: data.js not loaded'; console.error(m); throw new Error(m); }
const PD=window.PD;
const expand=window.expandForSpeech||(t=>t);

/* ── Helpers ── */
const $  =id=>document.getElementById(id);
const qsa=s=>document.querySelectorAll(s);
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const strip=s=>{const d=document.createElement('div');d.innerHTML=s;return d.textContent||d.innerText||'';};
const fmtD=s=>{try{return new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}catch(e){return s||'';}};
const safe=(a,fb=[])=>Array.isArray(a)?a:fb;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const rng=(a,b)=>a+Math.random()*(b-a);

/* ═══════════════════════════════════════════════════════════
   1. RENDERER + CSS2D + COMPOSER
═══════════════════════════════════════════════════════════ */
const canvas=$('world');
let W=innerWidth,H=innerHeight;

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(W,H);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
renderer.outputColorSpace=THREE.SRGBColorSpace;

/* CSS2D label renderer — mounts on #labels div */
const labelRenderer=new CSS2DRenderer();
labelRenderer.setSize(W,H);
labelRenderer.domElement.id='labels';
labelRenderer.domElement.style.cssText='position:fixed;top:0;left:0;pointer-events:none;overflow:hidden;';
document.body.appendChild(labelRenderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x02040f);
scene.fog=new THREE.FogExp2(0x02040f,0.012);

const camera=new THREE.PerspectiveCamera(55,W/H,0.1,600);
camera.position.set(0,18,38);

/* Bloom composer */
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(W,H),0.85,0.4,0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

window.addEventListener('resize',()=>{
  W=innerWidth;H=innerHeight;
  camera.aspect=W/H; camera.updateProjectionMatrix();
  renderer.setSize(W,H);
  composer.setSize(W,H);
  labelRenderer.setSize(W,H);
});

/* ═══════════════════════════════════════════════════════════
   2. ORBIT CONTROLS
═══════════════════════════════════════════════════════════ */
const O={theta:0,phi:1.05,r:38,lt:0,lp:1.05,lr:38,tx:0,ty:0,tz:0,ltx:0,lty:0,ltz:0,down:false,lmx:0,lmy:0,drag:false,dsx:0,dsy:0};
canvas.addEventListener('pointerdown',e=>{O.down=true;O.lmx=e.clientX;O.lmy=e.clientY;O.dsx=e.clientX;O.dsy=e.clientY;O.drag=false;});
canvas.addEventListener('pointerup',()=>{O.down=false;});
canvas.addEventListener('pointermove',e=>{
  if(!O.down){hoverRay(e);return;}
  if(Math.abs(e.clientX-O.dsx)>4||Math.abs(e.clientY-O.dsy)>4)O.drag=true;
  O.theta-=(e.clientX-O.lmx)*0.006;
  O.phi  -=(e.clientY-O.lmy)*0.004;
  O.phi   =clamp(O.phi,0.08,Math.PI/2.05);
  O.lmx=e.clientX;O.lmy=e.clientY;
});
canvas.addEventListener('wheel',e=>{O.r=clamp(O.r+e.deltaY*0.04,4,120);e.preventDefault();},{passive:false});
/* Touch */
let lastTouch=null;
canvas.addEventListener('touchstart',e=>{if(e.touches.length===1){const t=e.touches[0];O.down=true;O.lmx=t.clientX;O.lmy=t.clientY;O.dsx=t.clientX;O.dsy=t.clientY;O.drag=false;}},{passive:true});
canvas.addEventListener('touchend',()=>{O.down=false;});
canvas.addEventListener('touchmove',e=>{
  if(e.touches.length===1){const t=e.touches[0];if(Math.abs(t.clientX-O.dsx)>4||Math.abs(t.clientY-O.dsy)>4)O.drag=true;O.theta-=(t.clientX-O.lmx)*0.006;O.phi-=(t.clientY-O.lmy)*0.004;O.phi=clamp(O.phi,0.08,Math.PI/2.05);O.lmx=t.clientX;O.lmy=t.clientY;}
  if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY,d=Math.sqrt(dx*dx+dy*dy);if(lastTouch)O.r=clamp(O.r+(lastTouch-d)*.04,4,120);lastTouch=d;}
},{passive:true});

function orbitUpdate(){
  O.lt+=(O.theta-O.lt)*.09;O.lp+=(O.phi-O.lp)*.09;O.lr+=(O.r-O.lr)*.09;
  O.ltx+=(O.tx-O.ltx)*.07;O.lty+=(O.ty-O.lty)*.07;O.ltz+=(O.tz-O.ltz)*.07;
  camera.position.set(O.ltx+O.lr*Math.sin(O.lp)*Math.sin(O.lt),O.lty+O.lr*Math.cos(O.lp),O.ltz+O.lr*Math.sin(O.lp)*Math.cos(O.lt));
  camera.lookAt(O.ltx,O.lty,O.ltz);
}

/* ═══════════════════════════════════════════════════════════
   3. LIGHTS
═══════════════════════════════════════════════════════════ */
scene.add(new THREE.AmbientLight(0x0a0a22,5));
const sun=new THREE.DirectionalLight(0x1133aa,1.4);
sun.position.set(28,60,22);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{near:1,far:280,left:-100,right:100,top:100,bottom:-100});
scene.add(sun);
[[0x00f5ff,0,10,0,80],[0xff2d78,-40,6,-20,60],[0x7b2fff,40,6,20,60],[0x00ff9d,0,8,-50,65]].forEach(([c,x,y,z,d])=>{
  const pl=new THREE.PointLight(c,1.8,d);pl.position.set(x,y,z);scene.add(pl);
});

/* ═══════════════════════════════════════════════════════════
   4. MATERIAL FACTORIES
═══════════════════════════════════════════════════════════ */
const floaters=[],spinList=[],streamList=[],clickables=[];

/* TRUE dark building material — pure black body, zero emissive */
const darkM=()=>new THREE.MeshStandardMaterial({color:0x020608,roughness:.94,metalness:.06,emissive:0x000000,emissiveIntensity:0});
/* Neon edge material — emissive only, for caps/strips/edges */
const neonM=(c,ei=1.6)=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:ei,roughness:.15,metalness:.9});
/* Wireframe only */
const wireM=(c,op=.55)=>new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:op});
/* Transparent basic */
const basicM=(c,op=1,side=THREE.FrontSide)=>new THREE.MeshBasicMaterial({color:c,transparent:op<1,opacity:op,side});

/* ═══════════════════════════════════════════════════════════
   5. BASE WORLD
═══════════════════════════════════════════════════════════ */
/* Floor — dark, barely visible */
const floorMesh=new THREE.Mesh(new THREE.PlaneGeometry(400,400),darkM());
floorMesh.rotation.x=-Math.PI/2;floorMesh.receiveShadow=true;scene.add(floorMesh);

/* Two-level grid — only lines, no fill on floor */
const grid1=new THREE.GridHelper(400,80,0x00f5ff,0x001a2e);
grid1.material.opacity=0.35;grid1.material.transparent=true;grid1.position.y=.02;scene.add(grid1);
const grid2=new THREE.GridHelper(400,400,0x001133,0x000d1c);
grid2.material.opacity=0.12;grid2.material.transparent=true;grid2.position.y=.025;scene.add(grid2);

/* Cyberpunk city buildings — dark bodies + neon wireframe caps ONLY */
(function buildCity(){
  const PALETTE=[0x00f5ff,0xff2d78,0x7b2fff,0x00ff9d,0xffd700,0xff6b00];
  for(let i=0;i<240;i++){
    const h=rng(3,38),w=rng(1.4,5);
    const bx=(Math.random()-.5)*340,bz=(Math.random()-.5)*340;
    if(Math.abs(bx)<55&&Math.abs(bz)<75)continue;
    const col=PALETTE[Math.floor(Math.random()*PALETTE.length)];
    /* body — pure black */
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),darkM());
    body.position.set(bx,h/2,bz);body.castShadow=true;scene.add(body);
    /* neon outline only — wireframe */
    const wf=new THREE.Mesh(new THREE.BoxGeometry(w+.1,h+.1,w+.1),wireM(col,.18));
    wf.position.copy(body.position);scene.add(wf);
    /* glowing rooftop cap */
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w+.3,.12,w+.3),neonM(col,2.8));
    cap.position.set(bx,h+.06,bz);scene.add(cap);
    /* neon window strips */
    const wc=Math.floor(h/3.5);
    for(let j=0;j<wc;j++){
      const win=new THREE.Mesh(new THREE.BoxGeometry(w*.55,.1,w*.04),neonM(col,.6));
      win.position.set(bx,j*3+1.4,bz+w*.49);scene.add(win);
    }
    /* occasional point light at top */
    if(Math.random()<.3){const pl=new THREE.PointLight(col,.7,18);pl.position.set(bx,h+1.2,bz);scene.add(pl);}
  }
}());

/* Road lines — thin emissive strips */
(function buildRoads(){
  const rm=basicM(0x00f5ff,.16);
  for(let i=-9;i<=9;i++){
    const rh=new THREE.Mesh(new THREE.PlaneGeometry(400,.25),rm);
    rh.rotation.x=-Math.PI/2;rh.position.set(0,.022,i*13);scene.add(rh);
    const rv=new THREE.Mesh(new THREE.PlaneGeometry(.25,400),rm);
    rv.rotation.x=-Math.PI/2;rv.position.set(i*13,.022,0);scene.add(rv);
  }
}());

/* Star field */
(function buildStars(){
  const N=4000,pos=new Float32Array(N*3),col=new Float32Array(N*3);
  const pal=[[0,1,1],[1,.18,.47],[.48,.18,1],[0,1,.62],[1,.85,0]];
  for(let i=0;i<N;i++){
    const r=150+Math.random()*200,th=Math.random()*Math.PI*2,ph=Math.random()*Math.PI;
    pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=20+r*Math.cos(ph);pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
    const c=pal[Math.floor(Math.random()*pal.length)];
    col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:.22,vertexColors:true,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false})));
}());

/* ═══════════════════════════════════════════════════════════
   6. CSS2D LABEL FACTORY — crisp HTML labels in 3D space
═══════════════════════════════════════════════════════════ */
function makeLabel(text,cls='zone-label'){
  const div=document.createElement('div');
  div.className=cls; div.textContent=text;
  const obj=new CSS2DObject(div);
  return obj;
}
function makeSubLabel(text){
  return makeLabel(text,'sub-label');
}

/* ═══════════════════════════════════════════════════════════
   7. ZONE BUILDER HELPERS
═══════════════════════════════════════════════════════════ */

/* Tron platform: near-black base + neon edge strips + wireframe grid ONLY */
function mkPlatform(x,z,rx,rz,col,hexCol){
  /* base — almost invisible, dark */
  const base=new THREE.Mesh(new THREE.BoxGeometry(rx*2,.28,rz*2),
    new THREE.MeshStandardMaterial({color:0x030912,roughness:.96,metalness:0,emissive:0x000000,emissiveIntensity:0}));
  base.position.set(x,.14,z);base.receiveShadow=true;scene.add(base);
  /* four edge neon strips */
  const edgeM=neonM(col,2.4);
  [[rx*2+.1,.06,.1,0,.32,z+rz],[rx*2+.1,.06,.1,0,.32,z-rz]].forEach(([w,h,d,_x,py,pz])=>{
    const e=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),edgeM);e.position.set(x,py,pz);scene.add(e);});
  [[.1,.06,rz*2+.1,x-rx,.32,0],[.1,.06,rz*2+.1,x+rx,.32,0]].forEach(([w,h,d,px,py,_])=>{
    const e=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),edgeM);e.position.set(px,py,z);scene.add(e);});
  /* thin wireframe overlay */
  const wf=new THREE.Mesh(new THREE.BoxGeometry(rx*2+.14,.3,rz*2+.14),wireM(col,.28));
  wf.position.set(x,.15,z);scene.add(wf);
  /* surface grid */
  const sg=new THREE.GridHelper(Math.max(rx,rz)*2,Math.round(Math.max(rx,rz)),col,col);
  sg.material.opacity=.1;sg.material.transparent=true;sg.position.set(x,.3,z);scene.add(sg);
  /* corner beacons */
  for(const cx of [-rx+.9,rx-.9])for(const cz of [-rz+.9,rz-.9]){
    const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,5.5,6),neonM(col,1.1));
    pillar.position.set(x+cx,3,z+cz);scene.add(pillar);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),neonM(col,3.0));
    tip.position.set(x+cx,6,z+cz);scene.add(tip);
    const pl=new THREE.PointLight(col,1.0,9);pl.position.set(x+cx,6.2,z+cz);scene.add(pl);
    floaters.push({mesh:tip,baseY:6,speed:.7+Math.random()*.4,amp:.2,phase:Math.random()*Math.PI*2});
  }
}

/* Dark neon tower — body black, wireframe + cap glow only */
function mkTower(x,z,h,col,info){
  if(!info)info={};
  const body=new THREE.Mesh(new THREE.BoxGeometry(2,h,2),darkM());
  body.position.set(x,h/2,z);body.castShadow=true;scene.add(body);
  const wf=new THREE.Mesh(new THREE.BoxGeometry(2.06,h+.06,2.06),wireM(col,.65));
  wf.position.copy(body.position);scene.add(wf);
  /* horizontal neon bands */
  for(let i=1;i<=Math.ceil(h/3);i++){
    const band=new THREE.Mesh(new THREE.BoxGeometry(2.1,.08,2.1),neonM(col,1.5));
    band.position.set(x,i*3,z);scene.add(band);
  }
  const cap=new THREE.Mesh(new THREE.BoxGeometry(2.4,.24,2.4),neonM(col,3.0));
  cap.position.set(x,h+.12,z);scene.add(cap);
  /* spinning halo */
  const halo=new THREE.Mesh(new THREE.TorusGeometry(1.7,.065,6,36),neonM(col,2.0));
  halo.rotation.x=Math.PI/2;halo.position.set(x,h*.6,z);
  spinList.push({mesh:halo,axis:'y',speed:.018});scene.add(halo);
  const pl=new THREE.PointLight(col,1.2,11);pl.position.set(x,h+1.6,z);scene.add(pl);
  const proxy=new THREE.Mesh(new THREE.BoxGeometry(3,h+1.4,3),new THREE.MeshBasicMaterial({visible:false}));
  proxy.position.set(x,h/2,z);proxy.userData.info=info;proxy.userData.capRef=cap;
  scene.add(proxy);clickables.push(proxy);
  floaters.push({mesh:cap,baseY:h+.12,speed:.5+Math.random()*.3,amp:.13,phase:Math.random()*Math.PI*2});
  return proxy;
}

/* Spinning gem */
function mkGem(x,y,z,col,info){
  if(!info)info={};
  const body=new THREE.Mesh(new THREE.OctahedronGeometry(1.05,0),darkM());
  const wf  =new THREE.Mesh(new THREE.OctahedronGeometry(1.08,0),wireM(col,.85));
  const inn =new THREE.Mesh(new THREE.OctahedronGeometry(.62,0),neonM(col,.9));
  [body,wf,inn].forEach(m=>{m.position.set(x,y,z);scene.add(m);});
  const pl=new THREE.PointLight(col,1.3,6.5);pl.position.set(x,y,z);scene.add(pl);
  const proxy=new THREE.Mesh(new THREE.SphereGeometry(1.55,8,8),new THREE.MeshBasicMaterial({visible:false}));
  proxy.position.set(x,y,z);proxy.userData.info=info;scene.add(proxy);clickables.push(proxy);
  [body,wf,inn].forEach((m,i)=>{
    floaters.push({mesh:m,baseY:y,speed:.7+Math.random()*.3,amp:.3,phase:i*.5+Math.random()*Math.PI});
    spinList.push({mesh:m,axis:'y',speed:i===2?-.025:.019});
  });
  return proxy;
}

/* Hex skill pillar */
function mkHexSkill(x,yb,z,col,pct,info){
  if(!info)info={};
  const barH=Math.max(.4,pct/20);
  const outer=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,.22,6),wireM(col,.85));
  outer.position.set(x,yb,z);scene.add(outer);
  const fillR=clamp(pct/108,.04,.98);
  const fill=new THREE.Mesh(new THREE.CylinderGeometry(fillR,fillR*.8,.24,6),neonM(col,2.4));
  fill.position.set(x,yb+.01,z);scene.add(fill);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(.44,barH,.44),neonM(col,1.6));
  bar.position.set(x,yb-barH/2-.14,z);scene.add(bar);
  const barW=new THREE.Mesh(new THREE.BoxGeometry(.48,barH+.08,.48),wireM(col,.55));
  barW.position.copy(bar.position);scene.add(barW);
  const pl=new THREE.PointLight(col,.8,5.5);pl.position.set(x,yb+.5,z);scene.add(pl);
  const proxy=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,barH+1.2,6),new THREE.MeshBasicMaterial({visible:false}));
  proxy.position.set(x,yb-barH/2,z);proxy.userData.info=info;scene.add(proxy);clickables.push(proxy);
  floaters.push({mesh:outer,baseY:yb,speed:.55+Math.random()*.3,amp:.1,phase:Math.random()*Math.PI*2});
  floaters.push({mesh:fill,baseY:yb+.01,speed:.55,amp:.1,phase:Math.random()*Math.PI*2});
  spinList.push({mesh:outer,axis:'y',speed:.009});
  return proxy;
}

/* Data stream particle */
function mkStream(x1,z1,x2,z2,col){
  const from=new THREE.Vector3(x1,.1,z1),to=new THREE.Vector3(x2,.1,z2);
  const dir=new THREE.Vector3().subVectors(to,from),len=dir.length();
  const road=new THREE.Mesh(new THREE.BoxGeometry(.26,.04,len),basicM(col,.2));
  road.position.copy(from).addScaledVector(dir.clone().normalize(),len/2);
  road.lookAt(to.clone().add(new THREE.Vector3(0,.1,0)));scene.add(road);
  const pt=new THREE.Mesh(new THREE.SphereGeometry(.2,6,6),neonM(col,4.5));
  const light=new THREE.PointLight(col,1.6,7);scene.add(pt);scene.add(light);
  streamList.push({pt,light,from:from.clone(),to:to.clone(),t:Math.random(),speed:.005+Math.random()*.006});
}

/* ═══════════════════════════════════════════════════════════
   8. BUILD ALL 7 ZONES
═══════════════════════════════════════════════════════════ */

/* HOME */
mkPlatform(0,0,13,13,0x00f5ff,'#00f5ff');
{
  /* triple portal rings */
  const r1=new THREE.Mesh(new THREE.TorusGeometry(5.8,.16,12,64),neonM(0x00f5ff,2.6));
  r1.position.set(0,5,0);spinList.push({mesh:r1,axis:'y',speed:.008});scene.add(r1);
  const r2=new THREE.Mesh(new THREE.TorusGeometry(4,.11,12,64),neonM(0xff2d78,2.6));
  r2.position.set(0,5,0);r2.rotation.x=Math.PI/3;spinList.push({mesh:r2,axis:'y',speed:-.013});scene.add(r2);
  const r3=new THREE.Mesh(new THREE.TorusGeometry(7.4,.09,8,64),neonM(0x7b2fff,1.9));
  r3.position.set(0,5,0);r3.rotation.z=Math.PI/4.5;spinList.push({mesh:r3,axis:'y',speed:.006});scene.add(r3);
  /* stat orbs */
  safe(PD.stats).forEach((s,i)=>{
    const a=(i/PD.stats.length)*Math.PI*2,ox=Math.cos(a)*8.2,oz=Math.sin(a)*8.2;
    const orb=new THREE.Mesh(new THREE.SphereGeometry(.9,12,12),neonM(0x00f5ff,.75));
    orb.position.set(ox,4,oz);
    orb.userData.info={type:'stat',v:s.v,l:s.l,speech:expand(s.v+' — '+s.l)};
    scene.add(orb);clickables.push(orb);
    floaters.push({mesh:orb,baseY:4,speed:.65+i*.1,amp:.28,phase:i*1.45});
    const disc=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.08,16),neonM(0x00f5ff,.6));
    disc.position.set(ox,.55,oz);scene.add(disc);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,2,0),new THREE.Vector3(ox,4,oz)]),new THREE.LineBasicMaterial({color:0x00f5ff,transparent:true,opacity:.14})));
    /* CSS2D stat label */
    const lbl=makeLabel(s.v,'zone-label');lbl.position.set(ox,5.4,oz);scene.add(lbl);
    const sub=makeSubLabel(s.l);sub.position.set(ox,4.7,oz);scene.add(sub);
  });
  /* main zone label */
  const ml=makeLabel('UJAS DUBAL');ml.position.set(0,11,0);scene.add(ml);
  const ms=makeSubLabel('AWS DATA ENGINEER · TECHNICAL LEAD');ms.position.set(0,10,0);scene.add(ms);
  ml.userData.info={type:'home',title:'UJAS DUBAL',lines:[PD.title,PD.tagline],stats:safe(PD.stats),
    speech:expand('Welcome to my cyberpunk portfolio world! I am Oo-jas Doo-bal, Amazon Web Services Data Engineer and Technical Lead with 8.5 years building cloud native data platforms.')};
  ml.element.style.cursor='pointer';
  clickables.push(ml);
}

mkStream(0,0,-28,-12,0x00ff9d);mkStream(0,0,28,-12,0xff2d78);
mkStream(0,-12,0,-32,0xffd700);mkStream(-28,-12,-28,-32,0x7b2fff);
mkStream(28,-12,28,-32,0xff6b00);mkStream(0,-32,0,-52,0xff2d78);

/* ABOUT */
mkPlatform(-28,-12,10,9,0x00ff9d,'#00ff9d');
{
  const ml=makeLabel('ABOUT','zone-label green');ml.position.set(-28,9,-12);scene.add(ml);
  const ms=makeSubLabel('PROFILE & BACKGROUND');ms.position.set(-28,8,-12);scene.add(ms);
  ml.userData.info={type:'about',title:'◈ ABOUT UJAS DUBAL',
    lines:[PD.title,'📍 '+PD.location],
    points:['8.5 plus years IT — 5 years Data Engineering','Technical Lead — team of 9 engineers','Master of Science I T — G L S University Ahmedabad 2019','Bachelor of Engineering Electronics — G T U 2015','Tata Consultancy Services On the Spot Award 2023'],
    speech:expand('I am Ujas Dubal, Amazon Web Services Data Engineer and Technical Lead from Ahmedabad, India with 8.5 years of experience specialising in cloud native data engineering.')};
  ml.element.style.cursor='pointer';clickables.push(ml);
  /* DNA */
  for(let i=0;i<28;i++){
    const a=i*.48,r=1.9;
    const s1=new THREE.Mesh(new THREE.SphereGeometry(.15,6,6),neonM(0x00ff9d,1.8));
    s1.position.set(-28+Math.cos(a)*r,.6+i*.3,-12+Math.sin(a)*r);scene.add(s1);
    const s2=new THREE.Mesh(new THREE.SphereGeometry(.15,6,6),neonM(0x00f5ff,1.8));
    s2.position.set(-28+Math.cos(a+Math.PI)*r,.6+i*.3,-12+Math.sin(a+Math.PI)*r);scene.add(s2);
    if(i%3===0){
      const pts=[new THREE.Vector3(-28+Math.cos(a)*r,.6+i*.3,-12+Math.sin(a)*r),new THREE.Vector3(-28+Math.cos(a+Math.PI)*r,.6+i*.3,-12+Math.sin(a+Math.PI)*r)];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x004422,transparent:true,opacity:.5})));
    }
  }
  mkTower(-30,-12,3.2,0x00ff9d,{type:'about_detail',title:'◈ EXPERIENCE',speech:expand('8.5 plus years total I T experience, 5 years specialising in Data Engineering on Amazon Web Services.')});
  mkTower(-26,-12,3.2,0x00f5ff,{type:'about_detail',title:'◈ EDUCATION',speech:expand('Master of Science I T from G L S University Ahmedabad 2019 and Bachelor of Engineering Electronics from G T U 2015.')});
}

/* SKILLS */
mkPlatform(28,-12,12,10,0xff2d78,'#ff2d78');
{
  const ml=makeLabel('SKILLS MATRIX','zone-label pink');ml.position.set(28,9,-12);scene.add(ml);
  const ms=makeSubLabel('CLICK ANY TOWER · HEIGHT = PROFICIENCY');ms.position.set(28,8,-12);scene.add(ms);
  ml.userData.info={type:'skills_ov',title:'◉ SKILLS MATRIX',speech:expand('Skills matrix. Each hexagonal tower height equals proficiency percentage. Click any tower to inspect.')};
  ml.element.style.cursor='pointer';clickables.push(ml);
  safe(PD.skills).forEach((sk,i)=>{
    const cols5=5,row=Math.floor(i/cols5),col=i%cols5;
    const sx=28-5+col*2.8,sz=-12-row*5;
    mkHexSkill(sx,1.6,sz,sk.col,sk.pct,{type:'skill',title:(sk.icon||'◉')+' '+sk.name,pct:sk.pct,speech:expand(sk.name+', '+sk.pct+' percent. '+( sk.pct>=90?'Expert level.':sk.pct>=80?'Advanced level.':'Proficient.'))});
    const sub=makeSubLabel(sk.name);sub.position.set(sx,1.6+sk.pct/20+1.4,sz);scene.add(sub);
  });
}

/* CAREER */
mkPlatform(0,-32,19,10,0xffd700,'#ffd700');
{
  const ml=makeLabel('CAREER TIMELINE','zone-label amber');ml.position.set(0,9,-32);scene.add(ml);
  const ms=makeSubLabel('8.5+ YEARS · 4 COMPANIES');ms.position.set(0,8,-32);scene.add(ms);
  ml.userData.info={type:'exp_ov',title:'▲ CAREER TIMELINE',speech:expand('Career timeline. Four companies spanning 8.5 years. Click each tower for company details, role, and achievements.')};
  ml.element.style.cursor='pointer';clickables.push(ml);
  const tlPts=safe(PD.experience).map((_,i)=>new THREE.Vector3((i-1.5)*7.8,.3,-32));
  if(tlPts.length>1)scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(tlPts),new THREE.LineBasicMaterial({color:0xffd700,transparent:true,opacity:.55})));
  safe(PD.experience).forEach((e,i)=>{
    const ex=(i-1.5)*7.8;
    mkTower(ex,-32,3.8+i*1.8,e.col,{type:'exp',title:'▲ '+e.company,company:e.company,role:e.role,period:e.period,location:e.location,logo:e.logo,fb:e.fb,points:safe(e.points),speech:expand(e.speech||e.company)});
    /* CSS2D company name label below tower */
    const sub=makeSubLabel(e.company.split(' ')[0]);sub.position.set(ex,8.5,-32);scene.add(sub);
    const per=makeSubLabel(e.period);per.position.set(ex,7.8,-32);scene.add(per);
  });
}

/* CERTS */
mkPlatform(-28,-32,11,9,0x7b2fff,'#7b2fff');
{
  const ml=makeLabel('CERTIFICATIONS','zone-label blue');ml.position.set(-28,9,-32);scene.add(ml);
  const ms=makeSubLabel('4 ACTIVE CREDENTIALS');ms.position.set(-28,8.3,-32);scene.add(ms);
  ml.userData.info={type:'cert_ov',title:'◆ CERTIFICATIONS',speech:expand('Four certifications including Amazon Web Services Certified Developer Associate 2023 and three University of Michigan Coursera certifications.')};
  ml.element.style.cursor='pointer';clickables.push(ml);
  safe(PD.certifications).forEach((c,i)=>{
    const a=(i/PD.certifications.length)*Math.PI*2;
    const cx=-28+Math.cos(a)*5.5,cz=-32+Math.sin(a)*5.5;
    mkGem(cx,3,cz,c.col,{type:'cert',title:'◆ '+c.title,lines:[c.issuer,c.year],speech:expand(c.speech||c.title)});
    const sub=makeSubLabel(c.year);sub.position.set(cx,5.5,cz);scene.add(sub);
    const nam=makeSubLabel(c.title.split('–')[0].trim().slice(0,22));nam.position.set(cx,4.9,cz);scene.add(nam);
  });
  /* golden spinning AWS badge */
  const badge=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,.25,6),neonM(0xffd700,2.8));
  badge.position.set(-28,1.2,-32);spinList.push({mesh:badge,axis:'y',speed:.012});scene.add(badge);
  const badgeW=new THREE.Mesh(new THREE.CylinderGeometry(2.28,2.28,.28,6),wireM(0xffd700,.7));
  badgeW.position.copy(badge.position);scene.add(badgeW);
  scene.add(new THREE.PointLight(0xffd700,1.4,12));
}

/* PROJECTS */
mkPlatform(28,-32,11,10,0xff6b00,'#ff6b00');
{
  const ml=makeLabel('PROJECTS','zone-label orange');ml.position.set(28,9,-32);scene.add(ml);
  const ms=makeSubLabel('DATA ENGINEERING AT SCALE');ms.position.set(28,8.3,-32);scene.add(ms);
  ml.userData.info={type:'proj_ov',title:'⬟ DATA PROJECTS',speech:expand('Three major data engineering projects. Real time analytics on Amazon Web Services, Salesforce Redshift pipeline, and secure banking A P Is.')};
  ml.element.style.cursor='pointer';clickables.push(ml);
  safe(PD.projects).forEach((p,i)=>{
    const a=(i/PD.projects.length)*Math.PI*2+Math.PI/6;
    const px=28+Math.cos(a)*5.8,pz=-32+Math.sin(a)*5.8;
    mkTower(px,-32,4.2+i*.9,p.col,{type:'project',title:'⬟ '+p.title,lines:[p.client,p.desc],tags:safe(p.tags),speech:expand(p.speech||p.title)});
    const sub=makeSubLabel(p.title.slice(0,20));sub.position.set(px,7.2+i*.9,-32);scene.add(sub);
  });
  /* floating data cubes orbiting the zone */
  for(let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2,r=8.5;
    const cube=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.6),wireM(0xff6b00,.65));
    cube.position.set(28+Math.cos(a)*r,.8,-32+Math.sin(a)*r);
    spinList.push({mesh:cube,axis:'y',speed:.02+i*.003});
    floaters.push({mesh:cube,baseY:.8+i*.12,speed:.45+i*.08,amp:.35,phase:i*1.2});
    scene.add(cube);
  }
}

/* CONTACT */
mkPlatform(0,-52,12,10,0xff2d78,'#ff2d78');
{
  const ml=makeLabel('CONTACT','zone-label pink');ml.position.set(0,9,-52);scene.add(ml);
  const ms=makeSubLabel('CLICK THE PORTAL TO TRANSMIT');ms.position.set(0,8.3,-52);scene.add(ms);
  ml.userData.info={type:'contact',title:'⟡ CONTACT',speech:expand('Contact zone. Click the spinning portal ring to open the message form and transmit directly to Ujas Dubal.')};
  ml.element.style.cursor='pointer';clickables.push(ml);
  /* Big spinning contact portal */
  const ring1=new THREE.Mesh(new THREE.TorusGeometry(5,.22,14,64),neonM(0xff2d78,3.0));
  ring1.position.set(0,5,-52);spinList.push({mesh:ring1,axis:'y',speed:.014});scene.add(ring1);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(3.5,.14,12,64),neonM(0x00f5ff,2.4));
  ring2.position.set(0,5,-52);ring2.rotation.x=Math.PI/2.5;spinList.push({mesh:ring2,axis:'z',speed:-.018});scene.add(ring2);
  const ring3=new THREE.Mesh(new THREE.TorusGeometry(6.5,.1,8,64),neonM(0x7b2fff,1.8));
  ring3.position.set(0,5,-52);ring3.rotation.z=Math.PI/4;spinList.push({mesh:ring3,axis:'x',speed:.01});scene.add(ring3);
  /* Center contact orb — clickable */
  const corb=new THREE.Mesh(new THREE.SphereGeometry(1.8,14,14),neonM(0xff2d78,.55));
  corb.position.set(0,5,-52);floaters.push({mesh:corb,baseY:5,speed:.9,amp:.4,phase:0});scene.add(corb);
  const corbProxy=new THREE.Mesh(new THREE.SphereGeometry(2.8,8,8),new THREE.MeshBasicMaterial({visible:false}));
  corbProxy.position.set(0,5,-52);corbProxy.userData.info={type:'contact',title:'⟡ CONTACT',speech:expand('Opening contact form. Transmit a message directly to Ujas Dubal.')};
  scene.add(corbProxy);clickables.push(corbProxy);
  scene.add(new THREE.PointLight(0xff2d78,2.0,18));
  /* email / socials orbs */
  [['ujasdubal@gmail.com',0x00f5ff,-5,3,-52],[' LinkedIn ',0x38bdf8,5,3,-52]].forEach(([lbl,col,x,y,z])=>{
    const o=new THREE.Mesh(new THREE.SphereGeometry(.65,10,10),neonM(col,.9));
    o.position.set(x,y,z);floaters.push({mesh:o,baseY:y,speed:.8,amp:.2,phase:Math.random()*Math.PI*2});scene.add(o);
    const sub=makeSubLabel(lbl);sub.position.set(x,y+1.4,z);scene.add(sub);
  });
}

/* ═══════════════════════════════════════════════════════════
   9. AIDA ROBOT — 2D canvas (HUD element)
═══════════════════════════════════════════════════════════ */
const aidaCanvas2d=$('aida-canvas');
const aidaCtx=aidaCanvas2d?aidaCanvas2d.getContext('2d'):null;
let blinkOpen=true,blinkTimer=0,lsActive=false,lsBars=new Float32Array(9).fill(0);

function tickLS(){
  lsBars=lsBars.map(b=>{
    const target=lsActive?(0.15+Math.random()*.8):0.05;
    return b+(target-b)*0.18;
  });
}

function startLS(){ lsActive=true; }
function stopLS(){  lsActive=false; }

function blinkTick(dt){
  blinkTimer+=dt;
  if(blinkTimer>180){ blinkTimer=0; blinkOpen=!blinkOpen; }
}

function drawAIDA(t){
  if(!aidaCtx) return;
  const W=110,H=150,cx=W/2;
  aidaCtx.clearRect(0,0,W,H);
  /* bg */
  aidaCtx.fillStyle='#02040f';aidaCtx.fillRect(0,0,W,H);
  /* scan line */
  const scanY=(t*38)%H;
  const sg=aidaCtx.createLinearGradient(0,scanY-8,0,scanY+8);
  sg.addColorStop(0,'rgba(0,245,255,0)');sg.addColorStop(.5,'rgba(0,245,255,.07)');sg.addColorStop(1,'rgba(0,245,255,0)');
  aidaCtx.fillStyle=sg;aidaCtx.fillRect(0,scanY-8,W,16);
  /* head */
  aidaCtx.strokeStyle='#00f5ff';aidaCtx.lineWidth=1.5;
  aidaCtx.shadowColor='#00f5ff';aidaCtx.shadowBlur=8;
  aidaCtx.strokeRect(22,12,66,54);
  /* face */
  aidaCtx.fillStyle='rgba(0,245,255,0.06)';aidaCtx.fillRect(23,13,64,52);
  /* eyes */
  if(blinkOpen){
    aidaCtx.fillStyle='#00f5ff';
    aidaCtx.shadowBlur=14;
    [[cx-16,36,7,5],[cx+16,36,7,5]].forEach(([ex,ey,rw,rh])=>{
      aidaCtx.beginPath();aidaCtx.ellipse(ex,ey,rw,rh,0,0,Math.PI*2);aidaCtx.fill();
    });
    const iris=Math.sin(t*.8)*4;
    aidaCtx.fillStyle='#020814';
    [[cx-16+iris,36,3,3],[cx+16+iris,36,3,3]].forEach(([ex,ey,rw,rh])=>{
      aidaCtx.beginPath();aidaCtx.ellipse(ex,ey,rw,rh,0,0,Math.PI*2);aidaCtx.fill();
    });
  } else {
    aidaCtx.strokeStyle='#00f5ff';aidaCtx.lineWidth=2;aidaCtx.shadowBlur=10;
    [[cx-16,36],[cx+16,36]].forEach(([ex,ey])=>{
      aidaCtx.beginPath();aidaCtx.moveTo(ex-7,ey);aidaCtx.lineTo(ex+7,ey);aidaCtx.stroke();
    });
  }
  /* mouth — eq bars when speaking */
  if(lsActive){
    aidaCtx.shadowBlur=10;
    lsBars.forEach((b,i)=>{
      const bx=cx-18+i*4.5,bh=Math.max(1.5,b*12);
      const gr=aidaCtx.createLinearGradient(0,52,0,52-bh);
      gr.addColorStop(0,'#00f5ff');gr.addColorStop(1,'#ff2d78');
      aidaCtx.fillStyle=gr;
      aidaCtx.fillRect(bx,52-bh,3,bh);
    });
  } else {
    aidaCtx.strokeStyle='rgba(0,245,255,.55)';aidaCtx.lineWidth=1.5;aidaCtx.shadowBlur=6;
    aidaCtx.beginPath();aidaCtx.moveTo(cx-14,52);
    for(let i=0;i<28;i++) aidaCtx.lineTo(cx-14+i,52+Math.sin(t*2.4+i*.5)*1.2);
    aidaCtx.stroke();
  }
  /* neck */
  aidaCtx.fillStyle='#00f5ff';aidaCtx.shadowBlur=4;
  aidaCtx.fillRect(cx-6,66,12,8);
  /* body */
  aidaCtx.strokeStyle='#00f5ff';aidaCtx.lineWidth=1.5;aidaCtx.shadowBlur=8;
  aidaCtx.strokeRect(16,74,78,48);
  aidaCtx.fillStyle='rgba(0,245,255,0.04)';aidaCtx.fillRect(17,75,76,46);
  /* chest arc reactor */
  aidaCtx.strokeStyle=lsActive?'#ff2d78':'#00f5ff';aidaCtx.lineWidth=1.5;aidaCtx.shadowBlur=lsActive?16:8;
  aidaCtx.beginPath();aidaCtx.arc(cx,98,9,0,Math.PI*2);aidaCtx.stroke();
  aidaCtx.fillStyle=(lsActive?'rgba(255,45,120,':'rgba(0,245,255,')+(0.3+Math.sin(t*5)*.12)+')';
  aidaCtx.beginPath();aidaCtx.arc(cx,98,6,0,Math.PI*2);aidaCtx.fill();
  /* arms */
  [[10,74,6,32],[94,74,6,32]].forEach(([ax,ay,aw,ah])=>{
    aidaCtx.strokeRect(ax,ay,aw,ah);
    aidaCtx.strokeRect(ax,ay+ah,aw+2,8);
  });
  /* antenna */
  aidaCtx.beginPath();aidaCtx.moveTo(cx,12);aidaCtx.lineTo(cx,4);aidaCtx.stroke();
  aidaCtx.beginPath();aidaCtx.arc(cx,3,3,0,Math.PI*2);
  aidaCtx.fillStyle='rgba(0,245,255,'+(0.7+Math.sin(t*4)*.3)+')';aidaCtx.fill();
  aidaCtx.shadowBlur=0;
}

/* ═══════════════════════════════════════════════════════════
   10. SPEECH — MALE VOICE + PHONEME EXPANSION
       Priority: Google UK English Male → Microsoft David
       → any en male → en-GB → en-US → first en
═══════════════════════════════════════════════════════════ */
const synth=window.speechSynthesis||null;
let selVoice=null,isSpeaking=false,curText='',speechVol=0.9;

function loadVoice(){
  if(!synth) return;
  const vs=synth.getVoices();if(!vs.length) return;
  selVoice=
    vs.find(v=>v.name==='Google UK English Male')||
    vs.find(v=>v.name==='Google US English Male')||
    vs.find(v=>/Microsoft David/i.test(v.name))||
    vs.find(v=>/Microsoft Mark/i.test(v.name))||
    vs.find(v=>/Microsoft James/i.test(v.name))||
    vs.find(v=>/Daniel/i.test(v.name)&&/en/i.test(v.lang))||
    vs.find(v=>/male/i.test(v.name)&&v.lang.startsWith('en'))||
    vs.find(v=>v.lang==='en-GB'&&!v.localService)||
    vs.find(v=>v.lang==='en-US'&&!v.localService)||
    vs.find(v=>v.lang.startsWith('en'))||
    vs[0];
  console.log('[AIDA voice]',selVoice?.name||'default');
}
loadVoice();
if(synth&&typeof synth.onvoiceschanged!=='undefined') synth.onvoiceschanged=loadVoice;

const volSlider=$('vol-slider');
if(volSlider){ volSlider.addEventListener('input',e=>{ speechVol=+e.target.value; }); }

function stopSpeech(){
  if(synth) synth.cancel();
  stopLS(); isSpeaking=false;
}

function aidaSay(rawText,zone){
  if(!rawText) return;
  const text=expand(rawText);
  curText=text;
  /* typewriter effect */
  const el=$('speech-text');
  if(el){
    el.textContent='';let i=0;
    (function tw(){ if(i<text.length){ el.textContent+=text[i++]; setTimeout(tw,16); } })();
  }
  const zEl=$('speech-zone');
  if(zEl&&zone) zEl.textContent='// '+(zone||'').toUpperCase();
  startLS();
  if(!synth) return;
  synth.cancel();
  setTimeout(()=>{
    loadVoice();
    isSpeaking=true;
    const u=new SpeechSynthesisUtterance(text);
    u.lang='en-GB';
    u.rate=0.86;   /* slightly slow = more authoritative */
    u.pitch=0.82;  /* lower pitch = masculine */
    u.volume=speechVol;
    if(selVoice) u.voice=selVoice;
    u.onend =()=>{ stopLS(); isSpeaking=false; };
    u.onerror=()=>{ stopLS(); isSpeaking=false; };
    synth.speak(u);
  },80);
}

/* ── Click anywhere on canvas stops voice ── */
canvas.addEventListener('pointerdown',()=>{ if(isSpeaking) stopSpeech(); });

const btnRepeat=$('btn-repeat');if(btnRepeat) btnRepeat.onclick=()=>aidaSay(curText);
const btnStop  =$('btn-stop');  if(btnStop)   btnStop.onclick  =()=>stopSpeech();

/* ═══════════════════════════════════════════════════════════
   11. AMBIENT MUSIC — Cyberpunk drone
═══════════════════════════════════════════════════════════ */
let audioCtx=null,musicOn=false,musicNodes=[],masterGain=null;

function startMusic(){
  if(musicOn) return;
  try{ audioCtx=new(window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  masterGain=audioCtx.createGain();masterGain.gain.value=0.055;masterGain.connect(audioCtx.destination);
  const rev=audioCtx.createConvolver();
  const bl=audioCtx.sampleRate*4;const rb=audioCtx.createBuffer(2,bl,audioCtx.sampleRate);
  for(let c=0;c<2;c++){const d=rb.getChannelData(c);for(let i=0;i<bl;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/bl,1.8);}
  rev.buffer=rb;rev.connect(masterGain);
  const del=audioCtx.createDelay(1.2);del.delayTime.value=0.38;
  const dfb=audioCtx.createGain();dfb.gain.value=0.24;del.connect(dfb);dfb.connect(del);del.connect(masterGain);
  /* bass tones + harmonics */
  [40,55,82.41,110,146.83,164.81,220,293.66,329.63,440].forEach((freq,i)=>{
    const osc=audioCtx.createOscillator(),gn=audioCtx.createGain();
    osc.type=['sine','triangle','sine','triangle','sine','triangle','sine','triangle','sine','sine'][i];
    osc.frequency.value=freq;osc.detune.value=(Math.random()-.5)*9;
    const lfo=audioCtx.createOscillator(),lfog=audioCtx.createGain();
    lfo.frequency.value=.04+i*.015;lfog.gain.value=.018;
    lfo.connect(lfog);lfog.connect(gn.gain);lfo.start();
    gn.gain.value=.025+Math.random()*.022;
    osc.connect(gn);gn.connect(rev);gn.connect(del);osc.start();
    musicNodes.push(osc,lfo);
  });
  musicOn=true;
  const b=$('btn-music');if(b){b.textContent='◉ MUSIC ON';b.classList.add('on');}
}
function stopMusic(){
  if(!musicOn||!audioCtx) return;
  if(masterGain) masterGain.gain.value=0;
  musicNodes.forEach(n=>{try{n.stop();}catch(e){}});musicNodes=[];
  musicOn=false;
  const b=$('btn-music');if(b){b.textContent='⬡ MUSIC';b.classList.remove('on');}
}
const btnMusic=$('btn-music');if(btnMusic) btnMusic.onclick=()=>musicOn?stopMusic():startMusic();

/* ═══════════════════════════════════════════════════════════
   12. GLOBAL LIVE NEWS — with progress bar + image extraction
═══════════════════════════════════════════════════════════ */
const NEWS_FEEDS={
  tech:   ['https://feeds.feedburner.com/TechCrunch','https://www.wired.com/feed/rss'],
  ai:     ['https://www.marktechpost.com/feed/','https://feeds.feedburner.com/venturebeat/SZYF'],
  data:   ['https://towardsdatascience.com/feed','https://feeds.feedburner.com/oreilly/radar/atom'],
  world:  ['https://feeds.bbci.co.uk/news/world/rss.xml','https://rss.nytimes.com/services/xml/rss/nyt/World.xml'],
  science:['https://www.sciencedaily.com/rss/top/science.xml']
};
const FALLBACK={
  tech:[
    {title:'Apple Vision Pro 2 ships with M4 chip and redesigned spatial UI',link:'#',pubDate:'2026-03-15',description:'Apple unveils Vision Pro 2, 40% better performance, dramatically improved micro-OLED displays.',enclosure:{link:''}},
    {title:'GitHub Copilot now supports 50+ languages including Scala and PySpark',link:'#',pubDate:'2026-03-12',description:'GitHub Copilot expands to 50+ languages with enterprise-grade security and multi-repo context.',enclosure:{link:''}}
  ],
  ai:[
    {title:'OpenAI GPT-5 surpasses PhD level on all major benchmarks',link:'#',pubDate:'2026-03-18',description:'GPT-5 achieves record MMLU and MATH scores with real-time web access and 10M token memory built in.',enclosure:{link:''}},
    {title:'Anthropic Claude 4 Opus hits 500K context window with constitutional AI v3',link:'#',pubDate:'2026-03-16',description:'Claude 4 features 500K context, enhanced multi-step reasoning and dramatically improved code generation.',enclosure:{link:''}},
    {title:'Meta Llama 4 open-source 400B model outperforms GPT-4 on coding',link:'#',pubDate:'2026-03-10',description:'Meta Llama 4 with 400B parameters under fully open license beats GPT-4 on HumanEval benchmarks.',enclosure:{link:''}},
    {title:'DeepSeek R2 matches o3 at 10x lower API cost — stuns industry',link:'#',pubDate:'2026-03-01',description:'DeepSeek R2 matches OpenAI o3 on AIME and GPQA while costing ten times less via A P I.',enclosure:{link:''}}
  ],
  data:[
    {title:'Apache Spark 4.0 — PySpark rewritten for 3x faster shuffle performance',link:'#',pubDate:'2026-03-14',description:'Spark 4.0 rewrites the shuffle engine with a Python-first A P I delivering up to 3x faster PySpark.',enclosure:{link:''}},
    {title:'AWS Redshift Serverless auto-suspend slashes idle costs by 40 percent',link:'#',pubDate:'2026-03-11',description:'Redshift Serverless intelligent auto-suspend reduces idle compute spend by up to 40 percent.',enclosure:{link:''}}
  ],
  world:[
    {title:'G20 agrees on historic global AI regulation framework in Geneva',link:'#',pubDate:'2026-03-17',description:'G20 nations reach binding consensus on AI regulation covering model safety and transparency.',enclosure:{link:''}},
    {title:'India overtakes Japan to become the world third largest economy',link:'#',pubDate:'2026-03-15',description:'India surpasses Japan driven by rapid tech, manufacturing and services sector growth.',enclosure:{link:''}}
  ],
  science:[
    {title:'Room-temperature superconductivity at ambient pressure confirmed by MIT',link:'#',pubDate:'2026-03-16',description:'MIT peer-verified room-temperature superconductor at standard atmospheric pressure marks physics breakthrough.',enclosure:{link:''}},
    {title:'James Webb detects potential biosignature gases on Kepler-452b',link:'#',pubDate:'2026-03-08',description:'JWST detects methane and oxygen signatures on the most Earth-like exoplanet yet studied.',enclosure:{link:''}}
  ]
};

let newsCache=[],curCat='tech';

/* Extract image from RSS item — checks enclosure, media, thumbnail, og */
function extractImg(item){
  if(item.enclosure?.link&&/\.(jpg|jpeg|png|webp|gif)/i.test(item.enclosure.link)) return item.enclosure.link;
  if(item.thumbnail) return item.thumbnail;
  if(item['media:thumbnail']?.['$']?.url) return item['media:thumbnail']['$'].url;
  /* parse HTML content for first img */
  const html=item.content||item.description||'';
  const m=html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?m[1]:'';
}

function setProgress(show,pct,txt){
  const wrap=$('news-progress-wrap');
  if(!wrap) return;
  if(!show){wrap.classList.add('hidden');return;}
  wrap.classList.remove('hidden');
  const pt=$('news-progress-txt');
  if(pt) pt.textContent=txt||'FETCHING…';
}

async function fetchNews(cat){
  const feeds=NEWS_FEEDS[cat]||NEWS_FEEDS.tech;
  for(const feed of feeds){
    try{
      const url='https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(feed)+'&count=12';
      const r=await fetch(url,{signal:AbortSignal.timeout(6000)});
      const d=await r.json();
      if(d?.items?.length>2) return d.items.slice(0,12);
    }catch(e){}
  }
  return null;
}

function renderNewsGrid(items,cat){
  const grid=$('news-grid');if(!grid) return;
  grid.innerHTML='';newsCache=items;
  const isAI=(cat==='ai');
  items.forEach((item,idx)=>{
    const card=document.createElement('div');
    card.className='news-card'+(isAI?' ai-card':'');
    const imgUrl=extractImg(item);
    const title=esc(item.title||'Untitled');
    const date=fmtD(item.pubDate);
    card.innerHTML=
      `<img class="nc-img" alt="" data-src="${esc(imgUrl)}"/>`+
      `<div class="nc-cat">${esc(cat.toUpperCase())}</div>`+
      `<div class="nc-title">${title}</div>`+
      `<div class="nc-date">${date}</div>`+
      `<div class="nc-btns">`+
        `<button class="nc-btn nb-hear" data-idx="${idx}">▶ HEAR</button>`+
        `<button class="nc-btn nb-art"  data-idx="${idx}">◈ ARTICLE</button>`+
        (item.link&&item.link!=='#'?`<button class="nc-btn nb-ext" data-url="${esc(item.link)}">↗ SOURCE</button>`:'')+
      `</div>`;
    grid.appendChild(card);
    /* lazy load image */
    if(imgUrl){
      const img=card.querySelector('.nc-img');
      const io=new IntersectionObserver(entries=>{
        entries.forEach(e=>{ if(e.isIntersecting){ img.src=imgUrl; img.onload=()=>img.classList.add('loaded'); io.disconnect(); } });
      });
      io.observe(img);
    }
    card.querySelector('.nb-hear').onclick=()=>{
      const it=newsCache[+card.querySelector('.nb-hear').dataset.idx];
      if(it) aidaSay('News. '+strip(it.title||'')+'. '+strip(it.description||'').slice(0,280),'LIVE NEWS');
    };
    card.querySelector('.nb-art').onclick=()=>{
      const it=newsCache[+card.querySelector('.nb-art').dataset.idx];
      if(it) openArticle(it,cat);
    };
    const extBtn=card.querySelector('.nb-ext');
    if(extBtn) extBtn.onclick=()=>window.open(extBtn.dataset.url,'_blank','noopener');
  });
}

async function loadNews(cat){
  curCat=cat;
  const grid=$('news-grid');if(!grid) return;
  grid.innerHTML='<div class="news-empty">◉ CONNECTING TO GLOBAL DATA FEEDS…</div>';
  setProgress(true,0,'INITIALISING FEED');
  aidaSay('Connecting to global '+cat+' news data streams. Fetching live feed.','LIVE NEWS');
  await new Promise(r=>setTimeout(r,300));
  setProgress(true,30,'AUTHENTICATING…');
  await new Promise(r=>setTimeout(r,300));
  setProgress(true,65,'PARSING ARTICLES…');
  const items=await fetchNews(cat);
  setProgress(true,90,'RENDERING TILES…');
  await new Promise(r=>setTimeout(r,150));
  setProgress(false);
  const final=(items&&items.length)?items:(FALLBACK[cat]||FALLBACK.ai);
  renderNewsGrid(final,cat);
  const heads=final.slice(0,2).map(i=>strip(i.title||'')).join('. Also, ');
  setTimeout(()=>aidaSay('Feed loaded with '+final.length+' articles. Top story: '+heads,'LIVE NEWS'),400);
}

/* Article modal */
let curArticle=null;
function openArticle(item,cat){
  curArticle=item;
  const src=$('article-src');if(src) src.textContent=cat.toUpperCase()+' · '+fmtD(item.pubDate)+(item.author?' · '+item.author:'');
  const ttl=$('article-title');if(ttl) ttl.textContent=item.title||'';
  const meta=$('article-meta');if(meta) meta.textContent=item.author?'By '+item.author:'';
  /* image */
  const img=$('article-img');
  const imgUrl=extractImg(item);
  if(img){ if(imgUrl){img.src=imgUrl;img.style.display='block';}else{img.style.display='none';} }
  /* body */
  const body=$('article-body');
  if(body){
    const clean=strip(item.content||item.description||'');
    body.textContent=clean.length>80?clean:'Full content available at the original source. Click Source to read the complete article.';
  }
  const am=$('article-modal');if(am) am.classList.remove('hidden');
}
const artHear =$('art-hear'); if(artHear)  artHear.onclick =()=>{ if(curArticle) aidaSay(($('article-title')||{textContent:''}).textContent+'. '+strip(($('article-body')||{textContent:''}).textContent).slice(0,420),'NEWS'); };
const artOpen =$('art-open'); if(artOpen)  artOpen.onclick =()=>{ if(curArticle?.link&&curArticle.link!=='#') window.open(curArticle.link,'_blank','noopener'); };
const artClose=$('art-close');if(artClose) artClose.onclick=()=>{ const m=$('article-modal');if(m) m.classList.add('hidden'); };

const newsCat    =$('news-cat');    if(newsCat)     newsCat.onchange    =e=>loadNews(e.target.value);
const newsRefresh=$('news-refresh');if(newsRefresh)  newsRefresh.onclick =()=>loadNews(curCat);
const newsClose  =$('news-close');  if(newsClose)    newsClose.onclick   =()=>{ const p=$('news-panel');if(p) p.classList.add('hidden'); };
const btnNews    =$('btn-news');    if(btnNews) btnNews.onclick=()=>{
  const p=$('news-panel');if(!p) return;
  if(!p.classList.contains('hidden')){p.classList.add('hidden');return;}
  p.classList.remove('hidden');
  if(!newsCache.length) loadNews(curCat);
};

/* ═══════════════════════════════════════════════════════════
   13. CONTACT FORM
═══════════════════════════════════════════════════════════ */
const cfSend=$('cf-send');
if(cfSend) cfSend.onclick=()=>{
  const name =($('cf-name') ||{value:''}).value.trim();
  const email=($('cf-email')||{value:''}).value.trim();
  const msg  =($('cf-msg')  ||{value:''}).value.trim();
  const status=$('cf-status');
  if(!name||!email||!msg){if(status){status.textContent='✕ All fields required.';status.className='err';}return;}
  cfSend.disabled=true;cfSend.textContent='◉ TRANSMITTING…';
  if(status){status.textContent='';status.className='';}
  const url=PD.appsScriptUrl||'';
  if(!url||url.includes('YOUR_DEPLOYMENT')){
    window.open(`mailto:${PD.email}?subject=${encodeURIComponent('Portfolio: '+name)}&body=${encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+msg)}`);
    cfSend.disabled=false;cfSend.textContent='⟡ TRANSMIT →';
    if(status){status.textContent='✓ Email client opened.';status.className='ok';}
    aidaSay('Email client opened. Please send the pre-filled message from your mail application.','CONTACT');
    return;
  }
  fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message:msg})})
  .then(()=>{ cfSend.disabled=false;cfSend.textContent='⟡ TRANSMIT →'; if(status){status.textContent='✓ Transmitted!';status.className='ok';} aidaSay('Message transmitted to Ujas Dubal successfully.','CONTACT'); ['cf-name','cf-email','cf-msg'].forEach(id=>{const el=$(id);if(el)el.value='';}); })
  .catch(()=>{ cfSend.disabled=false;cfSend.textContent='⟡ TRANSMIT →'; if(status){status.textContent='✕ Error. Use email link below.';status.className='err';} });
};
const contClose=$('contact-close');if(contClose) contClose.onclick=()=>{const m=$('contact-modal');if(m) m.classList.add('hidden');};

/* ═══════════════════════════════════════════════════════════
   14. RAYCASTER
═══════════════════════════════════════════════════════════ */
const raycaster=new THREE.Raycaster();
const mouse2=new THREE.Vector2();
const tip=$('tooltip');

function hoverRay(e){
  mouse2.x=(e.clientX/W)*2-1;mouse2.y=-(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2,camera);
  const hits=raycaster.intersectObjects(clickables,false);
  if(hits.length&&hits[0].object.userData.info){
    const lbl=hits[0].object.userData.info.title||'';
    if(tip){tip.textContent='◈ '+lbl;tip.style.left=(e.clientX+16)+'px';tip.style.top=(e.clientY-26)+'px';tip.classList.remove('hidden');}
    canvas.style.cursor='pointer';
  } else {
    if(tip) tip.classList.add('hidden');
    canvas.style.cursor='crosshair';
  }
}

canvas.addEventListener('click',e=>{
  if(O.drag) return;
  mouse2.x=(e.clientX/W)*2-1;mouse2.y=-(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2,camera);
  const hits=raycaster.intersectObjects(clickables,false);
  if(!hits.length) return;
  const obj=hits[0].object,info=obj.userData.info;if(!info) return;
  const cap=obj.userData.capRef;
  if(cap?.material){const ei=cap.material.emissiveIntensity;cap.material.emissiveIntensity=10;setTimeout(()=>{if(cap.material)cap.material.emissiveIntensity=ei;},320);}
  if(info.type==='contact'){const m=$('contact-modal');if(m) m.classList.remove('hidden');aidaSay(info.speech||'Opening contact form.','CONTACT');return;}
  buildPanel(info);
  aidaSay(info.speech||info.title||'',info.title||'');
});

/* CSS2D label clicks via pointerdown (works with CSS2DRenderer) */
document.addEventListener('pointerdown',e=>{
  const el=e.target.closest('.zone-label,.sub-label');
  if(el){const obj=[...scene.children].find(c=>c.isCSS2DObject&&c.element===el);if(obj?.userData?.info){buildPanel(obj.userData.info);aidaSay(obj.userData.info.speech||obj.userData.info.title||'',obj.userData.info.title||'');}}
});

/* Logo → about */
const avaWrap=$('ava-wrap');
if(avaWrap) avaWrap.addEventListener('click',()=>{ setZone(1);aidaSay(expand('About Ujas Dubal. Amazon Web Services Data Engineer and Technical Lead from Ahmedabad, India.'),'ABOUT'); });

/* ═══════════════════════════════════════════════════════════
   15. INFO PANEL BUILDER
═══════════════════════════════════════════════════════════ */
function buildPanel(info){
  if(!info) return;
  const panel=$('info-panel'),body=$('info-body'),titleEl=$('info-title');
  if(!panel||!body) return;
  if(titleEl) titleEl.textContent=info.title||'';
  const hearBtn=$('info-hear');if(hearBtn) hearBtn.onclick=()=>aidaSay(info.speech||info.title||'',info.title||'');
  let h='';
  switch(info.type){
    case 'home':
      h+=`<div class="stat-grid">${safe(info.stats).map(s=>`<div class="stat-chip"><span class="sv">${esc(s.v)}</span><span class="sl">${esc(s.l)}</span></div>`).join('')}</div>`;
      safe(info.lines).forEach(l=>{h+=`<p>${esc(l)}</p>`;});
      h+=`<div class="tag-row">${['Amazon Web Services','PySpark','Redshift','Airflow','Python','Scala','Terraform','Databricks'].map(t=>`<span class="tag">${t}</span>`).join('')}</div>`;
      break;
    case 'stat':
      h=`<p style="font-family:var(--fh);font-size:52px;font-weight:900;color:var(--c);text-align:center;padding:16px 0;text-shadow:0 0 20px var(--c)">${esc(info.v||'')}</p><p style="text-align:center;font-size:13px;color:var(--mu)">${esc(info.l||'')}</p>`;
      break;
    case 'about':case 'about_detail':
      safe(info.lines).forEach(l=>{h+=`<p class="isub">${esc(l)}</p>`;});
      if(safe(info.points).length) h+=`<ul>${safe(info.points).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;
      break;
    case 'skills_ov':
      h=`<p>Click any hexagonal pillar — height equals proficiency.</p><ul>${safe(PD.skills).map(s=>`<li>${esc((s.icon||'')+(s.name||''))} — ${s.pct||0}%</li>`).join('')}</ul>`;
      break;
    case 'skill':
      h=`<span class="spct">${info.pct||0}%</span><div class="sbar-wrap"><div class="sbar-fill" id="sbf"></div></div><p style="margin-top:9px;font-size:11px">Level: <strong style="color:var(--c)">${(info.pct||0)>=90?'Expert':(info.pct||0)>=80?'Advanced':'Proficient'}</strong></p>`;
      setTimeout(()=>{const f=$('sbf');if(f)f.style.width=(info.pct||0)+'%';},60);
      break;
    case 'exp_ov':
      h=`<p>Career timeline. Click each tower for details.</p><ul>${safe(PD.experience).map(e=>`<li>${esc(e.company||'')} · ${esc(e.period||'')}</li>`).join('')}</ul>`;
      break;
    case 'exp':
      h+=`<div class="co-row">`;
      if(info.logo) h+=`<img class="co-logo" src="${esc(info.logo)}" alt="${esc(info.company||'')}" onerror="this.style.display='none'"/>`;
      else h+=`<div class="co-fb">${esc(info.fb||'🏢')}</div>`;
      h+=`<div><div class="co-name">${esc(info.company||'')}</div><div class="co-period">${esc(info.period||'')}</div><div class="co-loc">📍 ${esc(info.location||'')}</div></div></div>`;
      h+=`<p class="isub">${esc(info.role||'')}</p><ul>${safe(info.points).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;
      break;
    case 'cert_ov':
      h=`<ul>${safe(PD.certifications).map(c=>`<li>${esc(c.title||'')} · ${esc(c.year||'')}</li>`).join('')}</ul>`;
      break;
    case 'cert':
      safe(info.lines).forEach(l=>{h+=`<p class="isub">${esc(l)}</p>`;});
      break;
    case 'proj_ov':
      h=`<ul>${safe(PD.projects).map(p=>`<li>${esc(p.title||'')} — ${esc(p.client||'')}</li>`).join('')}</ul>`;
      break;
    case 'project':
      safe(info.lines).forEach(l=>{h+=`<p class="isub">${esc(l)}</p>`;});
      h+=`<div class="tag-row">${safe(info.tags).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`;
      break;
    default:
      h=`<p>${esc(info.speech||info.title||'')}</p>`;
  }
  body.innerHTML=h;
  panel.classList.remove('hidden');
}
const infoClose=$('info-close');if(infoClose) infoClose.onclick=()=>{const p=$('info-panel');if(p)p.classList.add('hidden');};

/* ═══════════════════════════════════════════════════════════
   16. ZONE NAVIGATION
═══════════════════════════════════════════════════════════ */
const ZONES=[
  {cx:0,cy:14,cz:34, lx:0, ly:0,lz:0,  ax:0, az:9,  name:'HOME',
   speech:expand('Welcome to the cyberpunk data world of Ujas Dubal! I am Ay-da, your A I guide. Click any glowing object to explore all 7 zones. Press keys 1 through 7 to teleport instantly.')},
  {cx:-38,cy:12,cz:4,lx:-28,ly:0,lz:-12,ax:-25,az:-10,name:'ABOUT',
   speech:expand('About zone. Ujas Dubal is an Amazon Web Services Data Engineer and Technical Lead from Ahmedabad, India with 8.5 years of experience.')},
  {cx:42,cy:12,cz:4, lx:28, ly:0,lz:-12,ax:25, az:-10,name:'SKILLS',
   speech:expand('Skills matrix zone. Hexagonal pillars — height equals proficiency. Python 95 percent. S Q L 93 percent. Pie Spark 92 percent. Click any pillar to inspect.')},
  {cx:0,cy:14,cz:-14,lx:0,  ly:0,lz:-32,ax:0,  az:-26,name:'CAREER',
   speech:expand('Career timeline. Four companies spanning 8.5 years. Tata Consultancy Services, Mind Inventory, Tiny E R P and iSquare. Click each tower for full details.')},
  {cx:-42,cy:12,cz:-18,lx:-28,ly:0,lz:-32,ax:-25,az:-30,name:'CERTS',
   speech:expand('Certifications. Amazon Web Services Certified Developer Associate 2023 plus three University of Michigan Coursera credentials. Click each gem for details.')},
  {cx:42,cy:12,cz:-18, lx:28,ly:0,lz:-32,ax:25,az:-30,name:'PROJECTS',
   speech:expand('Data engineering projects. Real time analytics platform on Amazon Web Services, Salesforce Redshift pipeline, and secure banking A P Is. Click each tower for full tech stack.')},
  {cx:0,cy:14,cz:-40, lx:0, ly:0,lz:-52,ax:0,  az:-46,name:'CONTACT',
   speech:expand('Contact zone. Click the spinning portal ring to open the transmission form and send a direct message to Ujas Dubal.')}
];
let curZone=-1;

function setZone(idx){
  idx=Math.max(0,Math.min(6,idx));if(idx===curZone) return;
  curZone=idx;const zd=ZONES[idx];
  const dx=zd.cx-zd.lx,dz=zd.cz-zd.lz,dy=zd.cy-zd.ly;
  O.r=Math.sqrt(dx*dx+dy*dy+dz*dz)+4;
  O.phi=Math.acos(clamp(dy/(O.r||1),-1,1));
  O.theta=Math.atan2(dx,dz);
  O.tx=zd.lx;O.ty=zd.ly;O.tz=zd.lz;
  const zf=$('zone-flash');
  if(zf){zf.textContent='// ZONE '+(idx+1)+' · '+zd.name;zf.style.opacity='1';setTimeout(()=>zf.style.opacity='0',2800);}
  qsa('.znav').forEach((b,i)=>b.classList.toggle('active',i===idx));
  setTimeout(()=>aidaSay(zd.speech,zd.name),200);
}

qsa('.znav').forEach(b=>b.addEventListener('click',()=>setZone(+(b.dataset.zone))));
window.addEventListener('keydown',e=>{
  const tag=e.target?.tagName;if(tag==='INPUT'||tag==='TEXTAREA') return;
  if(e.key>='1'&&e.key<='7'){setZone(+e.key-1);return;}
  if(e.key==='ArrowRight'||e.key==='d') setZone(curZone+1);
  else if(e.key==='ArrowLeft'||e.key==='a') setZone(curZone-1);
  else if(e.key==='Escape'){ [$('info-panel'),$('contact-modal'),$('news-panel'),$('article-modal')].forEach(m=>{if(m)m.classList.add('hidden');}); }
});

/* ═══════════════════════════════════════════════════════════
   17. MINIMAP
═══════════════════════════════════════════════════════════ */
const mmCanvas=$('minimap-canvas');
const mmCtx=mmCanvas?mmCanvas.getContext('2d'):null;
function drawMinimap(){
  if(!mmCtx) return;
  mmCtx.clearRect(0,0,200,200);
  mmCtx.fillStyle='#02040f';mmCtx.fillRect(0,0,200,200);
  mmCtx.strokeStyle='rgba(0,245,255,.12)';mmCtx.lineWidth=.5;
  for(let i=0;i<=10;i++){mmCtx.beginPath();mmCtx.moveTo(i*20,0);mmCtx.lineTo(i*20,200);mmCtx.stroke();mmCtx.beginPath();mmCtx.moveTo(0,i*20);mmCtx.lineTo(200,i*20);mmCtx.stroke();}
  /* zone dots */
  ZONES.forEach((z,i)=>{
    const mx=(z.lx+100)/1.2,(my=(z.lz+60)/0.65);
    mmCtx.fillStyle=i===curZone?'#00f5ff':'rgba(0,245,255,.4)';
    mmCtx.beginPath();mmCtx.arc(mx,my,i===curZone?5:3,0,Math.PI*2);mmCtx.fill();
    mmCtx.fillStyle='rgba(0,245,255,.7)';mmCtx.font='8px Share Tech Mono';mmCtx.fillText(z.name,mx+6,my+3);
  });
  /* camera dot */
  const cp=camera.position;
  const cmx=(cp.x+100)/1.2,cmy=(cp.z+60)/0.65;
  mmCtx.fillStyle='#ff2d78';mmCtx.beginPath();mmCtx.arc(cmx,cmy,4,0,Math.PI*2);mmCtx.fill();
}
const btnMinimap=$('btn-minimap');if(btnMinimap) btnMinimap.onclick=()=>{const m=$('minimap');if(m)m.classList.toggle('hidden');};
const mmClose=$('minimap-close');if(mmClose) mmClose.onclick=()=>{const m=$('minimap');if(m)m.classList.add('hidden');};
if(aidaCanvas2d) aidaCanvas2d.addEventListener('click',()=>{
  const facts=expand('Ujas has processed over 10 billion records using Pie Spark on Amazon Web Services E M R.')+'||'+expand('The C I C D pipeline Ujas built reduced deployment time by 34 percent.')+
    '||'+expand('Ujas secured 100 percent transaction safety using A E S 256 and R S A encryption.')+
    '||'+expand('The Salesforce Redshift pipeline improved data accuracy by 35 percent.')+
    '||'+expand('Ujas leads a team of 9 engineers at Tata Consultancy Services building real time data analytics.');
  const arr=facts.split('||');
  aidaSay(arr[Math.floor(Math.random()*arr.length)],'AIDA FACT');
});

/* ═══════════════════════════════════════════════════════════
   18. NANOBOT ASSEMBLY INTRO
═══════════════════════════════════════════════════════════ */
const nanoCanvas=$('nano-canvas');
const nanoCtx=nanoCanvas?nanoCanvas.getContext('2d'):null;
let nanoBots=[],nanoActive=true,nanoRAF=null;

function initNanobots(){
  if(!nanoCanvas||!nanoCtx) return;
  nanoCanvas.width=innerWidth;nanoCanvas.height=innerHeight;
  const N=380;nanoBots=[];
  const cx=innerWidth/2,cy=innerHeight/2;
  /* target: form "UD" letterform with particles */
  for(let i=0;i<N;i++){
    const a=Math.random()*Math.PI*2,r=30+Math.random()*Math.min(cx,cy)*.9;
    nanoBots.push({
      x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,
      tx:cx+(Math.random()-.5)*innerWidth*.7,
      ty:cy+(Math.random()-.5)*innerHeight*.7,
      sx:Math.random()*innerWidth,sy:Math.random()*innerHeight,
      vx:0,vy:0,
      r:1+Math.random()*2.2,
      col:['#00f5ff','#ff2d78','#7b2fff','#00ff9d','#ffd700'][Math.floor(Math.random()*5)],
      phase:Math.random()*Math.PI*2,
      trail:[]
    });
  }
}

function animateNanobots(t,progress){
  if(!nanoCtx) return;
  const W=nanoCanvas.width,H=nanoCanvas.height;
  nanoCtx.fillStyle='rgba(2,4,15,0.22)';nanoCtx.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2;
  nanoBots.forEach(b=>{
    /* move from start → orbit → converge to center */
    const tx=progress<0.5?b.tx:cx+(b.tx-cx)*(1-progress*2);
    const ty=progress<0.5?b.ty:cy+(b.ty-cy)*(1-progress*2);
    b.vx+=(tx-b.x)*.045;b.vy+=(ty-b.y)*.045;
    b.vx*=.84;b.vy*=.84;
    b.x+=b.vx;b.y+=b.vy;
    b.trail.push({x:b.x,y:b.y});if(b.trail.length>8)b.trail.shift();
    /* trail */
    nanoCtx.strokeStyle=b.col+'44';nanoCtx.lineWidth=.7;nanoCtx.beginPath();
    b.trail.forEach((p,i)=>i?nanoCtx.lineTo(p.x,p.y):nanoCtx.moveTo(p.x,p.y));
    nanoCtx.stroke();
    /* dot */
    nanoCtx.fillStyle=b.col;nanoCtx.shadowColor=b.col;nanoCtx.shadowBlur=6;
    nanoCtx.beginPath();nanoCtx.arc(b.x,b.y,b.r,0,Math.PI*2);nanoCtx.fill();
    nanoCtx.shadowBlur=0;
  });
  /* connecting lines between close nanobots */
  for(let i=0;i<nanoBots.length;i+=4){
    for(let j=i+1;j<Math.min(i+8,nanoBots.length);j++){
      const dx=nanoBots[i].x-nanoBots[j].x,dy=nanoBots[i].y-nanoBots[j].y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<70){nanoCtx.strokeStyle=`rgba(0,245,255,${0.12*(1-dist/70)})`;nanoCtx.lineWidth=.4;nanoCtx.beginPath();nanoCtx.moveTo(nanoBots[i].x,nanoBots[i].y);nanoCtx.lineTo(nanoBots[j].x,nanoBots[j].y);nanoCtx.stroke();}
    }
  }
}

let nanoStart=null;
function nanoLoop(ts){
  if(!nanoStart) nanoStart=ts;
  const elapsed=(ts-nanoStart)/1000;
  const progress=Math.min(elapsed/3,1);
  animateNanobots(ts,progress);
  if(nanoActive) nanoRAF=requestAnimationFrame(nanoLoop);
}
initNanobots();
nanoRAF=requestAnimationFrame(nanoLoop);

/* ═══════════════════════════════════════════════════════════
   19. START BUTTON
═══════════════════════════════════════════════════════════ */
const startBtn=$('start-btn');
if(startBtn) startBtn.addEventListener('click',()=>{
  startMusic();
  nanoActive=false;if(nanoRAF)cancelAnimationFrame(nanoRAF);
  /* wipe nanocanvas with dissolve */
  if(nanoCtx){
    let alpha=1;
    (function fade(){ alpha-=.05; if(alpha>0){ nanoCtx.fillStyle=`rgba(2,4,15,${.12+.05*(1-alpha)})`; nanoCtx.fillRect(0,0,nanoCanvas.width,nanoCanvas.height); requestAnimationFrame(fade); } })();
  }
  const so=$('start-overlay');
  if(so){so.classList.add('gone');setTimeout(()=>so.style.display='none',900);}
  setZone(0);
});

/* ═══════════════════════════════════════════════════════════
   20. RENDER LOOP
═══════════════════════════════════════════════════════════ */
const clock=new THREE.Clock();let lastT=0,aidaT=0,mmT=0;

(function loop(){
  requestAnimationFrame(loop);
  const t=clock.getElapsedTime(),dt=t-lastT;lastT=t;
  /* floaters */
  floaters.forEach(f=>{f.mesh.position.y=f.baseY+Math.sin(t*f.speed+f.phase)*f.amp;});
  /* spinners */
  spinList.forEach(s=>{
    if(s.axis==='y')s.mesh.rotation.y+=s.speed;
    else if(s.axis==='x')s.mesh.rotation.x+=s.speed;
    else if(s.axis==='z')s.mesh.rotation.z+=s.speed;
  });
  /* data streams */
  streamList.forEach(ds=>{
    ds.t+=ds.speed;if(ds.t>=1)ds.t-=1;
    ds.pt.position.lerpVectors(ds.from,ds.to,ds.t);
    ds.pt.position.y+=Math.sin(t*2.8+ds.t*14)*.08;
    ds.light.position.copy(ds.pt.position);
  });
  /* AIDA 2D */
  aidaT+=dt;if(aidaT>.033){aidaT=0;blinkTick(dt*30);tickLS();drawAIDA(t);}
  /* minimap */
  mmT+=dt;if(mmT>.2){mmT=0;drawMinimap();}
  orbitUpdate();
  composer.render();
  labelRenderer.render(scene,camera);
}());
