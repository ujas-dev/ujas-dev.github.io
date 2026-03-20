/* ================================================================
   world.js — ES Module · Three.js r163
   data.js loads as classic <script> BEFORE this module, so
   window.PD is always available when this executes.
   ================================================================ */
import * as THREE from 'three';

/* ── Safety check with detailed error ───────────────────── */
if (!window.PD) {
  const msg = 'FATAL: window.PD is undefined. Ensure data.js is loaded as a classic <script> BEFORE this module in index.html';
  console.error(msg);
  const el = document.getElementById('speech-text');
  if (el) el.textContent = 'ERROR: data.js not loaded. Check file paths.';
  throw new Error(msg);
}

const PD = window.PD;

/* ── Helpers ─────────────────────────────────────────────── */
const $   = id => document.getElementById(id);
const qsa = s  => document.querySelectorAll(s);
const esc = s  => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const strip = s => { const d = document.createElement('div'); d.innerHTML = s; return d.textContent || d.innerText || ''; };
const fmtDate = s => { try { return new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); } catch(e) { return s || ''; }};
const safe = (arr, fallback=[]) => Array.isArray(arr) ? arr : fallback;

/* ═══════════════════════════════════════════════════════════
   1. RENDERER
═══════════════════════════════════════════════════════════ */
const canvas = $('world');
if (!canvas) throw new Error('Canvas #world not found');

let W = innerWidth, H = innerHeight;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x000511);
scene.fog        = new THREE.FogExp2(0x000511, 0.016);

const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 600);
camera.position.set(0, 18, 38);
camera.lookAt(0, 0, 0);

window.addEventListener('resize', () => {
  W = innerWidth; H = innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
});

/* ═══════════════════════════════════════════════════════════
   2. ORBIT CONTROLS (manual)
═══════════════════════════════════════════════════════════ */
const O = {
  theta: 0, phi: 1.0, r: 38,
  lt: 0, lp: 1.0, lr: 38,
  tx: 0, ty: 0, tz: 0,
  ltx: 0, lty: 0, ltz: 0,
  down: false, lmx: 0, lmy: 0,
  drag: false, dsx: 0, dsy: 0
};

canvas.addEventListener('pointerdown', e => {
  O.down = true; O.lmx = e.clientX; O.lmy = e.clientY;
  O.dsx  = e.clientX; O.dsy = e.clientY; O.drag = false;
});
canvas.addEventListener('pointerup',   () => { O.down = false; });
canvas.addEventListener('pointermove', e => {
  if (!O.down) { hoverRay(e); return; }
  if (Math.abs(e.clientX - O.dsx) > 4 || Math.abs(e.clientY - O.dsy) > 4) O.drag = true;
  O.theta -= (e.clientX - O.lmx) * 0.006;
  O.phi   -= (e.clientY - O.lmy) * 0.004;
  O.phi    = Math.max(0.08, Math.min(Math.PI / 2.05, O.phi));
  O.lmx = e.clientX; O.lmy = e.clientY;
});
canvas.addEventListener('wheel', e => {
  O.r = Math.max(5, Math.min(100, O.r + e.deltaY * 0.04));
  e.preventDefault();
}, { passive: false });

function orbitUpdate() {
  O.lt  += (O.theta - O.lt ) * 0.09;
  O.lp  += (O.phi   - O.lp ) * 0.09;
  O.lr  += (O.r     - O.lr ) * 0.09;
  O.ltx += (O.tx    - O.ltx) * 0.07;
  O.lty += (O.ty    - O.lty) * 0.07;
  O.ltz += (O.tz    - O.ltz) * 0.07;
  camera.position.set(
    O.ltx + O.lr * Math.sin(O.lp) * Math.sin(O.lt),
    O.lty + O.lr * Math.cos(O.lp),
    O.ltz + O.lr * Math.sin(O.lp) * Math.cos(O.lt)
  );
  camera.lookAt(O.ltx, O.lty, O.ltz);
}

/* ═══════════════════════════════════════════════════════════
   3. LIGHTS
═══════════════════════════════════════════════════════════ */
scene.add(new THREE.AmbientLight(0x001133, 3.2));

const sun = new THREE.DirectionalLight(0x0055bb, 1.6);
sun.position.set(25, 55, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { near: 1, far: 260, left: -90, right: 90, top: 90, bottom: -90 });
scene.add(sun);

[[0x00ffff,  0,  9,   0,  65],
 [0xff00aa,-38,  5, -18,  52],
 [0x0088ff, 38,  5,  18,  52],
 [0x00ff88,  0,  8, -45,  58]].forEach(([c,x,y,z,d]) => {
  const pl = new THREE.PointLight(c, 1.8, d);
  pl.position.set(x, y, z);
  scene.add(pl);
});

/* ═══════════════════════════════════════════════════════════
   4. SCENE OBJECT LISTS
═══════════════════════════════════════════════════════════ */
const floaters   = [];
const spinList   = [];
const streamList = [];
const clickables = [];

/* ── Material factories ── */
const neon  = (c, ei = 0.5) => new THREE.MeshStandardMaterial({
  color: c, emissive: c, emissiveIntensity: ei, roughness: 0.25, metalness: 0.7
});
const dark  = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0.1 });
const basic = (c, op = 1, wire = false) => new THREE.MeshBasicMaterial({
  color: c, transparent: op < 1, opacity: op, wireframe: wire
});

/* ── Floor ── */
const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), dark(0x000814));
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

/* ── Grids ── */
const g1 = new THREE.GridHelper(320, 64, 0x00ffff, 0x001a33);
g1.material.opacity = 0.42; g1.material.transparent = true; g1.position.y = 0.01;
scene.add(g1);
const g2 = new THREE.GridHelper(320, 320, 0x002244, 0x001022);
g2.material.opacity = 0.18; g2.material.transparent = true; g2.position.y = 0.015;
scene.add(g2);

/* ── Tron city buildings ── */
(function buildCity() {
  const COLS = [0x00ffff, 0xff00aa, 0x0088ff, 0x00ff88, 0xffaa00, 0xff4400];
  for (let i = 0; i < 200; i++) {
    const h = 2 + Math.random() * 30;
    const w = 1 + Math.random() * 3.8;
    const bx = (Math.random() - 0.5) * 290;
    const bz = (Math.random() - 0.5) * 290;
    if (Math.abs(bx) < 44 && Math.abs(bz) < 65) continue;
    const col = COLS[Math.floor(Math.random() * COLS.length)];
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), dark(0x000d1e));
    body.position.set(bx, h / 2, bz);
    body.castShadow = true;
    scene.add(body);
    const wire = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, w + 0.06), basic(col, 0.18, true));
    wire.position.copy(body.position);
    scene.add(wire);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.14, w + 0.2), neon(col, 2.0));
    cap.position.set(bx, h + 0.07, bz);
    scene.add(cap);
    /* windows */
    const winCount = Math.floor(h / 2.5);
    for (let j = 0; j < winCount; j++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 0.18, w * 0.05), neon(col, 0.7));
      win.position.set(bx, j * 2.2 + 1.2, bz + w * 0.48);
      scene.add(win);
    }
  }
}());

/* ── Road grid ── */
(function buildRoads() {
  const rm = basic(0x00ffff, 0.2);
  for (let i = -7; i <= 7; i++) {
    const rh = new THREE.Mesh(new THREE.PlaneGeometry(320, 0.3), rm);
    rh.rotation.x = -Math.PI / 2; rh.position.set(0, 0.02, i * 12);
    scene.add(rh);
    const rv = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 320), rm);
    rv.rotation.x = -Math.PI / 2; rv.position.set(i * 12, 0.02, 0);
    scene.add(rv);
  }
}());

/* ── Ambient particles ── */
(function buildParticles() {
  const N = 2800;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const pal = [[0,1,1],[1,0,0.67],[0,0.53,1],[0,1,0.53],[1,0.53,0]];
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 260;
    pos[i*3+1] = Math.random() * 38;
    pos[i*3+2] = (Math.random() - 0.5) * 260;
    const c = pal[Math.floor(Math.random() * pal.length)];
    col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.14, vertexColors: true, transparent: true,
    opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false
  })));
}());

/* ═══════════════════════════════════════════════════════════
   5. ZONE BUILDER HELPERS
═══════════════════════════════════════════════════════════ */

/* Platform with glowing edge + corner beacons */
function mkPlatform(x, z, rx, rz, col) {
  const plat = new THREE.Mesh(new THREE.BoxGeometry(rx*2, 0.5, rz*2), dark(0x000e1e));
  plat.position.set(x, 0.25, z); plat.receiveShadow = true;
  scene.add(plat);
  const wire = new THREE.Mesh(new THREE.BoxGeometry(rx*2+0.1, 0.52, rz*2+0.1), basic(col, 0.55, true));
  wire.position.copy(plat.position); scene.add(wire);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(rx*2, 0.07, rz*2), neon(col, 1.6));
  edge.position.set(x, 0.53, z); scene.add(edge);
  for (const cx of [-rx+0.7, rx-0.7]) {
    for (const cz of [-rz+0.7, rz-0.7]) {
      const bcon = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.2, 6), neon(col, 0.9));
      bcon.position.set(x+cx, 2.6, z+cz); scene.add(bcon);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), neon(col, 2.2));
      top.position.set(x+cx, 5.0, z+cz); scene.add(top);
      const pl = new THREE.PointLight(col, 0.8, 7); pl.position.set(x+cx, 5.2, z+cz); scene.add(pl);
      floaters.push({ mesh: top, baseY: 5.0, speed: 0.8 + Math.random()*0.4, amp: 0.14, phase: Math.random()*Math.PI*2 });
    }
  }
}

/* Large floating neon sign plate with section label */
function mkSign(x, y, z, col, info) {
  if (!info || typeof info.title === 'undefined') {
    console.warn('[mkSign] info.title is undefined', info);
    info = info || {};
    info.title = info.title || 'SECTION';
  }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.8, 0.2), neon(col, 0.55));
  plate.position.set(x, y, z);
  plate.userData.info = info;
  scene.add(plate);
  clickables.push(plate);
  floaters.push({ mesh: plate, baseY: y, speed: 0.32, amp: 0.22, phase: Math.random()*Math.PI*2 });
  spinList.push({ mesh: plate, axis: 'y', speed: 0.0015 });
  /* aura glow plane */
  const aura = new THREE.Mesh(new THREE.BoxGeometry(10.8, 2.1, 0.06), basic(col, 0.1));
  aura.position.set(x, y, z); scene.add(aura);
  floaters.push({ mesh: aura, baseY: y, speed: 0.32, amp: 0.22, phase: plate.userData.basePhase || 0 });
  return plate;
}

/* Neon tower */
function mkTower(x, z, h, col, info) {
  if (!info) info = {};
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, h, 1.8), dark(0x000d1e));
  body.position.set(x, h/2, z); body.castShadow = true; scene.add(body);
  const wire = new THREE.Mesh(new THREE.BoxGeometry(1.85, h+0.05, 1.85), basic(col, 0.65, true));
  wire.position.copy(body.position); scene.add(wire);
  /* horizontal rings on tower */
  for (let i = 1; i <= 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.065, 6, 32), neon(col, 1.2));
    ring.rotation.x = Math.PI/2; ring.position.set(x, h*0.26*i, z); scene.add(ring);
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 2.2), neon(col, 2.2));
  cap.position.set(x, h+0.15, z); scene.add(cap);
  /* spinning halo */
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.065, 6, 36), neon(col, 1.6));
  halo.rotation.x = Math.PI/2; halo.position.set(x, h*0.6, z);
  spinList.push({ mesh: halo, axis: 'y', speed: 0.016 }); scene.add(halo);
  /* point light at top */
  const pl = new THREE.PointLight(col, 0.9, 9); pl.position.set(x, h+1.2, z); scene.add(pl);
  /* invisible proxy for raycasting */
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, h+0.8, 2.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  proxy.position.set(x, h/2, z);
  proxy.userData.info   = info;
  proxy.userData.capRef = cap;
  scene.add(proxy); clickables.push(proxy);
  floaters.push({ mesh: cap, baseY: h+0.15, speed: 0.5+Math.random()*0.3, amp: 0.13, phase: Math.random()*Math.PI*2 });
  return proxy;
}

/* Spinning gem */
function mkGem(x, y, z, col, info) {
  if (!info) info = {};
  const body  = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), dark(0x000d1e));
  const wire  = new THREE.Mesh(new THREE.OctahedronGeometry(0.97, 0), basic(col, 0.85, true));
  const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), neon(col, 0.7));
  [body, wire, inner].forEach(m => { m.position.set(x, y, z); scene.add(m); });
  const pl = new THREE.PointLight(col, 1.0, 5.5); pl.position.set(x, y, z); scene.add(pl);
  const proxy = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  proxy.position.set(x, y, z); proxy.userData.info = info;
  scene.add(proxy); clickables.push(proxy);
  [body, wire, inner].forEach((m, i) => {
    floaters.push({ mesh: m, baseY: y, speed: 0.7+Math.random()*0.3, amp: 0.26, phase: i*0.5+Math.random()*Math.PI });
    spinList.push({ mesh: m, axis: 'y', speed: i===2 ? -0.022 : 0.017 });
  });
  return proxy;
}

/* Hexagonal skill icon tower */
function mkHexSkill(x, y_base, z, col, pct, info) {
  if (!info) info = {};
  const barH = Math.max(0.3, pct / 26);
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.18, 6), neon(col, 0.9));
  outer.position.set(x, y_base, z); scene.add(outer);
  const fill  = new THREE.Mesh(new THREE.CylinderGeometry(pct/115, 0.02, 0.19, 6), neon(col, 1.9));
  fill.position.set(x, y_base+0.01, z); scene.add(fill);
  const bar   = new THREE.Mesh(new THREE.BoxGeometry(0.4, barH, 0.4), neon(col, 1.3));
  bar.position.set(x, y_base - barH/2 - 0.1, z); scene.add(bar);
  const barW  = new THREE.Mesh(new THREE.BoxGeometry(0.43, barH+0.06, 0.43), basic(col, 0.55, true));
  barW.position.copy(bar.position); scene.add(barW);
  const proxy = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, barH+0.5, 6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  proxy.position.set(x, y_base - barH/2, z);
  proxy.userData.info = info; scene.add(proxy); clickables.push(proxy);
  floaters.push({ mesh: outer, baseY: y_base, speed: 0.55+Math.random()*0.3, amp: 0.1, phase: Math.random()*Math.PI*2 });
  floaters.push({ mesh: fill,  baseY: y_base+0.01, speed: 0.55, amp: 0.1, phase: Math.random()*Math.PI*2 });
  spinList.push({ mesh: outer, axis: 'y', speed: 0.009 });
  return proxy;
}

/* Data stream particle */
function mkStream(x1, z1, x2, z2, col) {
  const from = new THREE.Vector3(x1, 0.1, z1);
  const to   = new THREE.Vector3(x2, 0.1, z2);
  const dir  = new THREE.Vector3().subVectors(to, from);
  const len  = dir.length();
  const road = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, len), basic(col, 0.28));
  road.position.copy(from).addScaledVector(dir.normalize(), len/2);
  road.lookAt(to); scene.add(road);
  const pt    = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), neon(col, 3.5));
  const light = new THREE.PointLight(col, 1.3, 5.5);
  scene.add(pt); scene.add(light);
  streamList.push({ pt, light, from: from.clone(), to: to.clone(), t: Math.random(), speed: 0.005+Math.random()*0.005 });
}

/* ═══════════════════════════════════════════════════════════
   6. BUILD ALL 7 ZONES
═══════════════════════════════════════════════════════════ */

/* ── ZONE 0: HOME (0, 0) ── */
mkPlatform(0, 0, 11, 11, 0x00ffff);
mkSign(0, 8.0, 0, 0x00ffff, {
  type: 'home',
  title: 'UJAS DUBAL · AWS DATA ENGINEER',
  lines: [PD.title || '', PD.tagline || ''],
  stats: safe(PD.stats),
  speech: 'Welcome to the Ujas Tron Data World! I am Ujas Dubal, AWS Data Engineer and Technical Lead with 8.5 years experience building cloud native data platforms on AWS.'
});

/* Triple portal rings */
const r1 = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.16, 12, 64), neon(0x00ffff, 2.2));
r1.position.set(0, 5, 0); spinList.push({ mesh: r1, axis: 'y', speed: 0.008 }); scene.add(r1);
const r2 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.11, 12, 64), neon(0xff00aa, 2.2));
r2.position.set(0, 5, 0); r2.rotation.x = Math.PI/3; spinList.push({ mesh: r2, axis: 'y', speed: -0.012 }); scene.add(r2);
const r3 = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.09, 8, 64), neon(0x0088ff, 1.7));
r3.position.set(0, 5, 0); r3.rotation.z = Math.PI/4.5; spinList.push({ mesh: r3, axis: 'y', speed: 0.006 }); scene.add(r3);

/* Stat orbs */
safe(PD.stats).forEach((s, i) => {
  const a = (i / PD.stats.length) * Math.PI * 2;
  const ox = Math.cos(a) * 7.2, oz = Math.sin(a) * 7.2;
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), neon(0x00ffff, 0.7));
  orb.position.set(ox, 3.5 + Math.sin(i)*0.5, oz);
  orb.userData.info = { type: 'stat', v: s.v || '', l: s.l || '', speech: (s.v||'') + ' — ' + (s.l||'') };
  scene.add(orb); clickables.push(orb);
  floaters.push({ mesh: orb, baseY: 3.5, speed: 0.65+i*0.1, amp: 0.24, phase: i*1.45 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 16), neon(0x00ffff, 0.5));
  disc.position.set(ox, 0.6, oz); scene.add(disc);
  const pts = [new THREE.Vector3(0,2,0), new THREE.Vector3(ox,3.5,oz)];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.17 })));
});

/* Streams from home to all zones */
mkStream(0,0,-28,-12,0x00ff88);
mkStream(0,0, 28,-12,0xff00aa);
mkStream(0,-12, 0,-32,0xffaa00);
mkStream(-28,-12,-28,-32,0x0088ff);
mkStream( 28,-12, 28,-32,0xff6600);
mkStream(0,-32, 0,-52,0xff00aa);

/* ── ZONE 1: ABOUT (-28, -12) ── */
mkPlatform(-28,-12, 9, 8, 0x00ff88);
mkSign(-28, 7.0, -12, 0x00ff88, {
  type: 'about',
  title: '◈ ABOUT UJAS DUBAL',
  lines: [PD.title || '', '📍 ' + (PD.location || '')],
  points: [
    '8.5+ years IT · 5+ years Data Engineering',
    'Technical Lead · 1.5+ yrs leadership · Team of 9',
    'M.Sc IT – GLS University, Ahmedabad 2019',
    'B.E. Electronics – GTU 2015',
    'TCS On-the-Spot Award 2023 · Certificate of Appreciation 2024'
  ],
  speech: 'I am Ujas Dubal, AWS Data Engineer and Technical Lead from Ahmedabad India. 8.5 years IT experience, 5 years specialising in data engineering on AWS cloud.'
});
/* DNA helix decoration */
for (let i = 0; i < 26; i++) {
  const a = i * 0.48, r = 1.6;
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.13,6,6), neon(0x00ff88, 1.5));
  s1.position.set(-28+Math.cos(a)*r, 0.8+i*0.28, -12+Math.sin(a)*r); scene.add(s1);
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.13,6,6), neon(0x00ffff, 1.5));
  s2.position.set(-28+Math.cos(a+Math.PI)*r, 0.8+i*0.28, -12+Math.sin(a+Math.PI)*r); scene.add(s2);
  if (i%3===0) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,r*2,4), neon(0x004444, 0.5));
    bar.position.set(-28,0.8+i*0.28,-12); bar.rotation.z=Math.PI/2; scene.add(bar);
  }
}
/* About info towers */
[['EXPERIENCE',0x00ff88,-2],['EDUCATION',0x00ffff,2]].forEach(([lbl,col,ox],i)=>{
  mkTower(-28+ox,-12, 2.8, col, {
    type:'about_detail', title:'◈ '+lbl,
    speech: i===0 ? '8.5 plus years total IT experience, 5 of which in Data Engineering on AWS.' : 'M.Sc IT from GLS University 2019 and B.E. Electronics from GTU 2015.'
  });
});

/* ── ZONE 2: SKILLS (28, -12) ── */
mkPlatform(28,-12, 11, 9, 0xff00aa);
mkSign(28, 7.5, -12, 0xff00aa, {
  type: 'skills_ov',
  title: '◉ SKILLS MATRIX',
  speech: 'Skills matrix zone. Each glowing hexagonal tower represents a technology skill. Tower height equals proficiency percentage. Click any hex tower to inspect the skill detail.'
});
/* Hex skill towers */
safe(PD.skills).forEach((sk, i) => {
  const cols5 = 5, row = Math.floor(i/cols5), col = i%cols5;
  const sx = 28 - 5 + col * 2.6;
  const sz = -12 - row * 4.5;
  const yBase = 1.5;
  mkHexSkill(sx, yBase, sz, sk.col || 0x00ffff, sk.pct || 50, {
    type: 'skill',
    title: (sk.icon||'◉') + ' ' + (sk.name||'Skill'),
    pct:   sk.pct || 50,
    speech: (sk.name||'Skill') + ', ' + (sk.pct||50) + ' percent proficiency. ' +
            ((sk.pct||50) >= 90 ? 'Expert level.' : (sk.pct||50) >= 80 ? 'Advanced level.' : 'Proficient.')
  });
});

/* ── ZONE 3: EXPERIENCE (0, -32) ── */
mkPlatform(0,-32, 17, 9, 0xffaa00);
mkSign(0, 8.0, -32, 0xffaa00, {
  type: 'exp_ov',
  title: '▲ CAREER TIMELINE',
  speech: 'Career timeline zone. Four companies spanning 8.5 years. Click each glowing tower to see company details, logo, location and key achievements.'
});
/* Timeline base line */
const tlPts = safe(PD.experience).map((_,i) => new THREE.Vector3((i-1.5)*7.2, 0.22, -32));
if (tlPts.length > 1) {
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(tlPts),
    new THREE.LineBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.5 })
  ));
}
safe(PD.experience).forEach((e, i) => {
  const ex = (i - 1.5) * 7.2;
  mkTower(ex, -32, 3.5 + i*1.7, e.col || 0xffaa00, {
    type: 'exp',
    title: '▲ ' + (e.company||'Company'),
    company: e.company||'', role: e.role||'', period: e.period||'',
    location: e.location||'', logo: e.logo||'', fb: e.fb||'🏢',
    points: safe(e.points), speech: e.speech||''
  });
  /* base disc under each tower */
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 16), neon(e.col||0xffaa00, 0.6));
  disc.position.set(ex, 0.6, -32); scene.add(disc);
  /* year label ring */
  const yrRing = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.07, 6, 32), neon(e.col||0xffaa00, 0.8));
  yrRing.rotation.x = Math.PI/2; yrRing.position.set(ex, 0.65, -32);
  spinList.push({ mesh: yrRing, axis: 'y', speed: 0.012 }); scene.add(yrRing);
});

/* ── ZONE 4: CERTIFICATIONS (-28, -32) ── */
mkPlatform(-28,-32, 9, 8, 0x0088ff);
mkSign(-28, 7.0, -32, 0x0088ff, {
  type: 'cert_ov',
  title: '◆ CERTIFICATIONS',
  speech: 'Certifications zone. Four official certifications from Amazon Web Services and University of Michigan. Click each spinning gem for details.'
});
safe(PD.certifications).forEach((c, i) => {
  const a = (i / PD.certifications.length) * Math.PI * 2;
  mkGem(-28 + Math.cos(a)*4.0, 3.4, -32 + Math.sin(a)*4.0, c.col || 0x0088ff, {
    type: 'cert',
    title: '◆ ' + (c.title||'Cert'),
    lines: [c.issuer||'', c.year||''],
    speech: c.speech||''
  });
  /* award plinth */
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.55, 8), neon(c.col||0x0088ff, 0.65));
  plinth.position.set(-28+Math.cos(a)*4.0, 0.82, -32+Math.sin(a)*4.0); scene.add(plinth);
});
/* Central AWS badge */
const awsBadge = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 1), neon(0xf59e0b, 0.45));
awsBadge.position.set(-28, 5.5, -32);
spinList.push({ mesh: awsBadge, axis: 'y', speed: 0.007 }); scene.add(awsBadge);

/* ── ZONE 5: PROJECTS (28, -32) ── */
mkPlatform(28,-32, 9, 8, 0xff6600);
mkSign(28, 7.0, -32, 0xff6600, {
  type: 'proj_ov',
  title: '⬟ DATA PROJECTS',
  speech: 'Projects zone. Three major data engineering projects. Click each tower for tech stack and impact metrics.'
});
safe(PD.projects).forEach((p, i) => {
  const a = (i / PD.projects.length) * Math.PI * 2;
  const tx = 28 + Math.cos(a)*4.2, tz = -32 + Math.sin(a)*4.2;
  mkTower(tx, tz, 5.8 + i*1.4, p.col || 0xff6600, {
    type: 'project',
    title: '⬟ ' + (p.title||'Project'),
    lines: [p.client||'', p.desc||''],
    tags: safe(p.tags),
    speech: p.speech||''
  });
  /* floating tech tag panels */
  safe(p.tags).slice(0,2).forEach((tag, j) => {
    const ta = (j/2)*Math.PI + a;
    const tg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.38, 0.12), neon(p.col||0xff6600, 0.7));
    tg.position.set(tx+Math.cos(ta)*2.3, 7.5+j*0.9+i*0.5, tz+Math.sin(ta)*2.3);
    tg.rotation.y = ta; scene.add(tg);
    floaters.push({ mesh: tg, baseY: 7.5+j*0.9+i*0.5, speed: 0.6+j*0.18, amp: 0.15, phase: ta });
  });
});

/* ── ZONE 6: CONTACT (0, -52) ── */
mkPlatform(0,-52, 9, 9, 0xff00aa);
mkSign(0, 7.5, -52, 0xff00aa, {
  type: 'contact',
  title: '⟡ CONTACT UJAS',
  speech: 'Contact zone! Click the spinning warp portal to open the direct transmission form and send a message to Ujas.'
});
/* Warp portal */
const warpR = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.26, 12, 64), neon(0xff00aa, 2.4));
warpR.position.set(0, 5.5, -52);
spinList.push({ mesh: warpR, axis: 'y', speed: 0.022 }); scene.add(warpR);
const warpD = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), basic(0xff00aa, 0.07));
warpD.material.side = THREE.DoubleSide; warpD.position.set(0, 5.5, -52); scene.add(warpD);
const warpProxy = new THREE.Mesh(
  new THREE.CylinderGeometry(4.8, 4.8, 10, 16),
  new THREE.MeshBasicMaterial({ visible: false })
);
warpProxy.position.set(0, 5, -52);
warpProxy.userData.info = { type: 'contact', title: '⟡ CONTACT', speech: 'Opening transmission form to contact Ujas.' };
scene.add(warpProxy); clickables.push(warpProxy);
/* Social link panels */
[['✉ EMAIL', 0x00ffff, -4, -48], ['◈ LINKEDIN', 0xff00aa, 4, -48]].forEach(([lbl, col, ox, oz]) => {
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.65, 0.12), neon(col, 0.65));
  panel.position.set(ox, 3.2, oz); scene.add(panel);
  floaters.push({ mesh: panel, baseY: 3.2, speed: 0.5, amp: 0.12, phase: ox });
});

/* ═══════════════════════════════════════════════════════════
   7. AIDA 2D CANVAS AVATAR + LIP SYNC
═══════════════════════════════════════════════════════════ */
const aidaCanvas2d = $('aida-canvas');
const ac2d = aidaCanvas2d ? aidaCanvas2d.getContext('2d') : null;
const AW = 110, AH = 150;

let lsMouth = 0, lsTarget = 0, lsBlink = 1, lsBlinkT = 0, lsActive = false;
let lsSchedule = [], lsStartMs = 0;

const phonMap = {
  a:0.9,e:0.7,i:0.5,o:0.8,u:0.65,b:0.1,p:0.1,m:0.1,f:0.3,v:0.3,
  n:0.2,d:0.3,t:0.3,l:0.4,s:0.25,r:0.35,' ':0,'.':0,',':0
};

function buildSchedule(text) {
  return [...String(text||'')].map((ch, i) => ({ t: i*78, v: phonMap[ch.toLowerCase()] ?? 0.14 }));
}
function startLS(text) { lsSchedule = buildSchedule(text); lsStartMs = performance.now(); lsActive = true; }
function stopLS()      { lsActive = false; lsTarget = 0; }
function tickLS() {
  if (!lsActive) { lsMouth += (0 - lsMouth) * 0.2; return; }
  const el = performance.now() - lsStartMs;
  let cur = 0;
  for (const p of lsSchedule) { if (p.t <= el) cur = p.v; else break; }
  if (el > lsSchedule.length * 80 + 200) { stopLS(); cur = 0; }
  lsTarget = cur; lsMouth += (lsTarget - lsMouth) * 0.33;
}
function blinkTick(dt) {
  lsBlinkT += dt;
  if (lsBlinkT > 4 + Math.random()*2) {
    lsBlinkT = 0; const bs = performance.now();
    (function bl() {
      const e = (performance.now()-bs)/1000;
      lsBlink = e<0.06 ? e/0.06 : e<0.12 ? 1-(e-0.06)/0.06 : 1;
      if (e < 0.12) requestAnimationFrame(bl); else lsBlink = 1;
    }());
  }
}

function drawAIDA(t) {
  if (!ac2d) return;
  ac2d.clearRect(0, 0, AW, AH);
  const bg = ac2d.createLinearGradient(0,0,0,AH);
  bg.addColorStop(0,'#000c1e'); bg.addColorStop(1,'#000511');
  ac2d.fillStyle = bg; ac2d.fillRect(0,0,AW,AH);
  for (let sy=0;sy<AH;sy+=4) { ac2d.fillStyle='rgba(0,0,0,.14)'; ac2d.fillRect(0,sy,AW,1); }
  const cx = AW/2, cy = AH/2+2;
  /* glow */
  const grd = ac2d.createRadialGradient(cx,cy,8,cx,cy,52);
  grd.addColorStop(0,'rgba(0,255,255,.15)'); grd.addColorStop(1,'rgba(0,255,255,0)');
  ac2d.fillStyle=grd; ac2d.fillRect(0,0,AW,AH);
  /* head */
  ac2d.save(); ac2d.translate(cx,cy);
  ac2d.beginPath(); ac2d.roundRect(-26,-33,52,60,9);
  ac2d.fillStyle='#0a1a2e'; ac2d.fill();
  ac2d.strokeStyle=lsActive?'rgba(0,255,255,.95)':'rgba(0,255,255,.55)';
  ac2d.lineWidth=1.6; ac2d.stroke(); ac2d.restore();
  /* eyes */
  const eyeH = lsBlink>0.5 ? 5.5 : lsBlink*11;
  [[-9,-8],[9,-8]].forEach(([ex,ey]) => {
    const eg = ac2d.createRadialGradient(cx+ex,cy+ey,0,cx+ex,cy+ey,9);
    eg.addColorStop(0,'rgba(0,255,255,.5)'); eg.addColorStop(1,'rgba(0,255,255,0)');
    ac2d.fillStyle=eg; ac2d.fillRect(cx+ex-9,cy+ey-9,18,18);
    ac2d.beginPath(); ac2d.ellipse(cx+ex,cy+ey,4.5,eyeH,0,0,Math.PI*2);
    ac2d.fillStyle='#00ffff'; ac2d.fill();
  });
  /* antenna */
  ac2d.strokeStyle='#00ffff'; ac2d.lineWidth=2;
  ac2d.beginPath(); ac2d.moveTo(cx,cy-33); ac2d.lineTo(cx,cy-46); ac2d.stroke();
  const ab = 2+Math.sin(t*3)*0.9;
  ac2d.beginPath(); ac2d.arc(cx,cy-46,ab,0,Math.PI*2);
  ac2d.fillStyle='#00ffff'; ac2d.shadowColor='#00ffff'; ac2d.shadowBlur=14;
  ac2d.fill(); ac2d.shadowBlur=0;
  /* chest */
  ac2d.save(); ac2d.translate(cx,cy);
  ac2d.fillStyle='rgba(0,255,255,.07)'; ac2d.strokeStyle='rgba(0,255,255,.3)'; ac2d.lineWidth=1;
  ac2d.beginPath(); ac2d.roundRect(-12,8,24,18,2); ac2d.fill(); ac2d.stroke();
  for (let li=0;li<3;li++) {
    const lw = 8+Math.sin(t*2.5+li)*5;
    ac2d.fillStyle='rgba(0,255,255,'+(lsActive?0.82:0.28)+')';
    ac2d.fillRect(-10,11+li*4.6,lw,2);
  }
  ac2d.restore();
  /* mouth */
  const mO = lsMouth*13, mW = 17;
  ac2d.save(); ac2d.translate(cx,cy+22);
  if (lsActive) { ac2d.shadowColor='#00ffff'; ac2d.shadowBlur=8; }
  ac2d.strokeStyle='#00ffff'; ac2d.lineWidth=2;
  ac2d.beginPath();
  if (mO<2) { ac2d.moveTo(-mW/2,0); ac2d.quadraticCurveTo(0,5,mW/2,0); }
  else { ac2d.ellipse(0,0,mW/2,mO/2,0,0,Math.PI*2); ac2d.fillStyle='rgba(0,20,40,.9)'; ac2d.fill(); }
  ac2d.stroke(); ac2d.restore();
  /* cheeks */
  [[-17,14],[17,14]].forEach(([px,py])=>{
    ac2d.beginPath(); ac2d.arc(cx+px,cy+py,2.5,0,Math.PI*2);
    ac2d.fillStyle='rgba(255,0,170,.45)'; ac2d.fill();
  });
  /* border */
  ac2d.strokeStyle='rgba(0,255,255,'+(0.28+Math.sin(t*1.5)*0.12)+')';
  ac2d.lineWidth=1; ac2d.strokeRect(1,1,AW-2,AH-2);
}

/* AIDA 3D proxy */
const aidaG = (() => {
  const g = new THREE.Group();
  const bodyM = new THREE.Mesh(new THREE.BoxGeometry(0.82,1.1,0.55), neon(0x0a2a5a,0.3));
  bodyM.castShadow=true; g.add(bodyM);
  const headM = new THREE.Mesh(new THREE.BoxGeometry(0.65,0.6,0.55), neon(0x0d2b55,0.25));
  headM.position.y=0.9; headM.castShadow=true; g.add(headM);
  [[-0.14,0.95,0.29],[0.14,0.95,0.29]].forEach(p => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.065,8,8), new THREE.MeshBasicMaterial({color:0x00ffff}));
    e.position.set(...p); g.add(e);
  });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.42,6), neon(0x00ffff,1.2));
  ant.position.set(0,1.42,0); g.add(ant);
  const antB = new THREE.Mesh(new THREE.SphereGeometry(0.065,8,8), new THREE.MeshBasicMaterial({color:0x00ffff}));
  antB.position.set(0,1.64,0); g.add(antB);
  const aGlow = new THREE.PointLight(0x00ffff,1.7,3.8); aGlow.position.set(0,1.64,0); g.add(aGlow);
  g.scale.setScalar(0.76); g.position.set(0,1.4,9); scene.add(g);
  return { g, head: headM, aGlow, target: new THREE.Vector3(0,1.4,9) };
})();

/* ═══════════════════════════════════════════════════════════
   8. SPEECH API
═══════════════════════════════════════════════════════════ */
const synth = window.speechSynthesis || null;
let selVoice = null;

function loadVoice() {
  if (!synth) return;
  const vs = synth.getVoices();
  if (!vs.length) return;
  selVoice = vs.find(v => v.name.includes('Google US English'))
    || vs.find(v => v.lang === 'en-US' && !v.localService)
    || vs.find(v => v.lang && v.lang.startsWith('en'))
    || vs[0];
}
loadVoice();
if (synth && synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoice;

let curSpeech = '';
function aidaSay(text, zone) {
  if (!text) return;
  curSpeech = text;
  const el = $('speech-text');
  if (el) { el.textContent=''; let i=0;
    (function tw(){ if(i<text.length){ el.textContent+=text[i++]; setTimeout(tw,14); } })(); }
  const zt = $('speech-zone');
  if (zt && zone) zt.textContent = '// ' + String(zone).toUpperCase();
  startLS(text);
  if (!synth) return;
  synth.cancel(); loadVoice();
  const u = new SpeechSynthesisUtterance(text);
  u.lang='en-US'; u.rate=0.87; u.pitch=1; u.volume=1;
  if (selVoice) u.voice = selVoice;
  u.onend = stopLS; u.onerror = stopLS;
  synth.speak(u);
}

const btnRepeat = $('btn-repeat'); if (btnRepeat) btnRepeat.onclick = () => aidaSay(curSpeech);
const btnStop   = $('btn-stop');   if (btnStop)   btnStop.onclick   = () => { if(synth) synth.cancel(); stopLS(); };

/* ═══════════════════════════════════════════════════════════
   9. AMBIENT MUSIC
═══════════════════════════════════════════════════════════ */
let audioCtx = null, musicOn = false, musicOscs = [], masterGain = null;

function startMusic() {
  if (musicOn) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
  masterGain = audioCtx.createGain(); masterGain.gain.value = 0.05;
  masterGain.connect(audioCtx.destination);
  const conv = audioCtx.createConvolver();
  const blen = audioCtx.sampleRate * 3.5;
  const buf  = audioCtx.createBuffer(2, blen, audioCtx.sampleRate);
  for (let ch=0;ch<2;ch++) { const d=buf.getChannelData(ch); for (let i=0;i<blen;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/blen,2); }
  conv.buffer=buf; conv.connect(masterGain);
  const delay=audioCtx.createDelay(1.5); delay.delayTime.value=0.42;
  const dfb=audioCtx.createGain(); dfb.gain.value=0.28;
  delay.connect(dfb); dfb.connect(delay); delay.connect(masterGain);
  [55,82.41,110,146.83,164.81,220,293.66,329.63].forEach((freq,i) => {
    const osc=audioCtx.createOscillator(), gn=audioCtx.createGain();
    osc.type=['sine','triangle','sine','triangle','sine','triangle','sine','sine'][i];
    osc.frequency.value=freq; osc.detune.value=(Math.random()-0.5)*7;
    const lfo=audioCtx.createOscillator(), lfog=audioCtx.createGain();
    lfo.frequency.value=0.05+i*0.018; lfog.gain.value=0.022;
    lfo.connect(lfog); lfog.connect(gn.gain); lfo.start();
    gn.gain.value=0.032+Math.random()*0.025;
    osc.connect(gn); gn.connect(conv); gn.connect(delay); osc.start();
    musicOscs.push(osc,lfo);
  });
  musicOn=true;
  const b=$('btn-music'); if(b){ b.textContent='◉ MUSIC ON'; b.classList.add('on'); }
}
function stopMusic() {
  if (!musicOn || !audioCtx) return;
  if (masterGain) masterGain.gain.value=0;
  musicOscs.forEach(n=>{ try{n.stop();}catch(e){} }); musicOscs=[];
  musicOn=false;
  const b=$('btn-music'); if(b){ b.textContent='⬡ MUSIC'; b.classList.remove('on'); }
}
const btnMusic = $('btn-music'); if (btnMusic) btnMusic.onclick = () => musicOn ? stopMusic() : startMusic();

/* ═══════════════════════════════════════════════════════════
   10. GLOBAL LIVE NEWS
═══════════════════════════════════════════════════════════ */
const NEWS_FEEDS = {
  tech:    ['https://feeds.feedburner.com/TechCrunch','https://www.wired.com/feed/rss','https://feeds.arstechnica.com/arstechnica/index'],
  ai:      ['https://www.artificialintelligence-news.com/feed/','https://feeds.feedburner.com/venturebeat/SZYF'],
  data:    ['https://towardsdatascience.com/feed','https://feeds.feedburner.com/oreilly/radar/atom'],
  world:   ['https://feeds.bbci.co.uk/news/world/rss.xml','https://rss.nytimes.com/services/xml/rss/nyt/World.xml'],
  science: ['https://www.sciencedaily.com/rss/top/science.xml','https://feeds.nature.com/nature/rss/current']
};

const FALLBACK = {
  tech:[
    {title:'Apple Vision Pro 2 announced with M4 chip',link:'#',pubDate:'2026-03-15',description:'Apple unveils the second generation Vision Pro with dramatically improved M4 chip display and 40% better performance.'},
    {title:'Google announces Gemini Ultra 2 with 2M context window',link:'#',pubDate:'2026-03-14',description:'Google DeepMind launches Gemini Ultra 2 supporting 2 million token context windows and native multimodal reasoning.'},
    {title:'Microsoft GitHub Copilot now supports 50+ languages',link:'#',pubDate:'2026-03-12',description:'GitHub Copilot expands to 50+ programming languages including Rust, Scala and PySpark.'}
  ],
  ai:[
    {title:'OpenAI GPT-5 surpasses PhD level on all benchmarks',link:'#',pubDate:'2026-03-18',description:'GPT-5 achieves unprecedented scores on MMLU, HumanEval and MATH with real-time web access and long-term memory.'},
    {title:'Anthropic Claude 4 Opus — 500K context safe AI',link:'#',pubDate:'2026-03-16',description:'Claude 4 Opus features 500K context window, enhanced constitutional AI and improved multi-step reasoning.'},
    {title:'Meta Llama 4 — 400B open-source model beats GPT-4',link:'#',pubDate:'2026-03-10',description:'Meta releases Llama 4 with 400 billion parameters under fully open license, outperforming GPT-4 on multiple benchmarks.'},
    {title:'Mistral Large 2 — 128K context and native function calling',link:'#',pubDate:'2026-03-05',description:'Mistral releases its most powerful model with native function calling and 128K context across 12 languages.'},
    {title:'DeepSeek R2 matches o3 reasoning at fraction of cost',link:'#',pubDate:'2026-03-01',description:'DeepSeek R2 matches OpenAI o3 on AIME and GPQA benchmarks while being 10x cheaper via API.'},
    {title:'Google Gemma 3 runs natively on Android devices',link:'#',pubDate:'2026-03-08',description:'Gemma 3, a 7B on-device model runs at 40 tokens per second on mid-range Android phones without internet.'}
  ],
  data:[
    {title:'Apache Spark 4.0 — PySpark 3x faster with ANSI SQL',link:'#',pubDate:'2026-03-14',description:'Spark 4.0 rewritten shuffle engine and Python-first API delivers up to 3x faster PySpark workloads.'},
    {title:'AWS Redshift Serverless cuts costs 40% with auto-suspend',link:'#',pubDate:'2026-03-11',description:'Redshift Serverless intelligent auto-suspend reduces idle compute costs by up to 40%.'},
    {title:'Databricks Unity Catalog now GA across AWS Azure GCP',link:'#',pubDate:'2026-03-09',description:'Unity Catalog is generally available across all three major clouds, enabling unified governance.'}
  ],
  world:[
    {title:'G20 agrees on global AI regulation framework',link:'#',pubDate:'2026-03-17',description:'G20 nations reach consensus on binding AI regulation covering model safety and algorithmic transparency.'},
    {title:'India becomes third largest economy surpassing Japan',link:'#',pubDate:'2026-03-15',description:'India overtakes Japan driven by rapid growth in technology, manufacturing and services.'},
    {title:'SpaceX Starship completes first crewed Mars flyby',link:'#',pubDate:'2026-03-10',description:'SpaceX Starship brings four astronauts within 500km of Mars before returning safely to Earth orbit.'}
  ],
  science:[
    {title:'Room-temperature superconductivity at ambient pressure achieved',link:'#',pubDate:'2026-03-16',description:'MIT researchers verify a room-temperature superconductor at standard atmospheric pressure.'},
    {title:'CRISPR cures sickle cell disease in 95% of trial patients',link:'#',pubDate:'2026-03-12',description:'CRISPR gene therapy achieves complete remission in 95% of sickle cell patients after two years.'},
    {title:'James Webb detects biosignature gases on Kepler-452b',link:'#',pubDate:'2026-03-08',description:'JWST detects methane and oxygen in atmosphere of Kepler-452b, the most Earth-like exoplanet studied.'}
  ]
};

let newsCache = [], currentCat = 'tech';

async function fetchNews(cat) {
  const feeds = NEWS_FEEDS[cat] || NEWS_FEEDS.tech;
  for (const feed of feeds) {
    try {
      const url = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed) + '&count=10';
      const r = await fetch(url); const d = await r.json();
      if (d && d.items && d.items.length > 2) return d.items.slice(0,10);
    } catch(e) {}
  }
  return null;
}

function renderNews(items, cat) {
  const list = $('news-list'); if (!list) return;
  list.innerHTML = '';
  newsCache = items;
  items.forEach((item, i) => {
    const div = document.createElement('div'); div.className='news-item';
    div.innerHTML =
      `<div class="ni-title">${esc(item.title||'')}</div>`+
      `<div class="ni-meta">${esc(cat.toUpperCase())} · ${fmtDate(item.pubDate)}</div>`+
      `<div class="ni-btns">`+
        `<button class="ni-btn ni-listen" data-idx="${i}">▶ AIDA READS</button>`+
        `<button class="ni-btn ni-article" data-idx="${i}">◈ ARTICLE</button>`+
        (item.link&&item.link!=='#'?`<button class="ni-btn ni-ext" data-url="${esc(item.link)}">↗ OPEN</button>`:'')+
      `</div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('.ni-listen').forEach(b => {
    b.onclick = () => {
      const item = newsCache[+b.dataset.idx]; if (!item) return;
      const txt = 'Here is the news. ' + (item.title||'') + '. ' + strip(item.description||'').slice(0,320);
      aidaSay(txt, 'AI NEWS FEED');
      b.textContent='◉ READING…'; setTimeout(()=>b.textContent='▶ AIDA READS',3500);
    };
  });
  list.querySelectorAll('.ni-article').forEach(b => {
    b.onclick = () => { const item = newsCache[+b.dataset.idx]; if(item) openArticle(item, cat); };
  });
  list.querySelectorAll('.ni-ext').forEach(b => {
    b.onclick = () => window.open(b.dataset.url,'_blank','noopener');
  });
}

let curArticle = null;
function openArticle(item, cat) {
  curArticle = item;
  const src  = $('article-source'); if(src)  src.textContent  = cat.toUpperCase()+' · '+fmtDate(item.pubDate);
  const ttl  = $('article-title');  if(ttl)  ttl.textContent  = item.title||'';
  const meta = $('article-meta');   if(meta) meta.textContent = item.author ? 'By '+item.author : '';
  const raw  = item.content || item.description || '';
  const clean = strip(raw);
  const cont = $('article-content');
  if (cont) cont.textContent = clean.length > 60
    ? clean
    : 'Full article available at original source. Click ↗ OPEN ORIGINAL to read.';
  $('article-modal').classList.remove('hidden');
}
const artRead  = $('article-read');  if(artRead)  artRead.onclick  = () => { if(curArticle) aidaSay(($('article-title')||{textContent:''}).textContent+'. '+strip(($('article-content')||{textContent:''}).textContent).slice(0,500),'NEWS'); };
const artOpen  = $('article-open');  if(artOpen)  artOpen.onclick  = () => { if(curArticle?.link&&curArticle.link!=='#') window.open(curArticle.link,'_blank','noopener'); };
const artClose = $('article-close'); if(artClose) artClose.onclick = () => $('article-modal').classList.add('hidden');

async function loadNews(cat) {
  currentCat = cat;
  const list = $('news-list');
  if (list) list.innerHTML = '<div class="news-loading">◉ FETCHING '+cat.toUpperCase()+' FEED…</div>';
  aidaSay('Fetching '+cat+' news from global data streams.','LIVE NEWS');
  const items = await fetchNews(cat);
  const final = (items && items.length) ? items : (FALLBACK[cat] || FALLBACK.tech);
  renderNews(final, cat);
  const heads = final.slice(0,2).map(i=>i.title||'').join('. Also, ');
  aidaSay('News loaded. Top stories: '+heads,'LIVE NEWS FEED');
}

const newsCat   = $('news-category'); if(newsCat)   newsCat.onchange   = e => loadNews(e.target.value);
const newsClose = $('news-close');    if(newsClose)  newsClose.onclick  = () => $('news-panel').classList.add('hidden');
const btnNews   = $('btn-news');
if (btnNews) btnNews.onclick = () => {
  const p = $('news-panel'); if(!p) return;
  if (!p.classList.contains('hidden')) { p.classList.add('hidden'); return; }
  p.classList.remove('hidden');
  const list = $('news-list');
  if (!list || !list.children.length || list.firstElementChild?.classList.contains('news-loading'))
    loadNews(currentCat);
};

/* ═══════════════════════════════════════════════════════════
   11. CONTACT FORM
═══════════════════════════════════════════════════════════ */
const cfSend = $('cf-send');
if (cfSend) cfSend.onclick = () => {
  const name  = ($('cf-name') ||{value:''}).value.trim();
  const email = ($('cf-email')||{value:''}).value.trim();
  const msg   = ($('cf-msg')  ||{value:''}).value.trim();
  const status= $('cf-status');
  if (!name||!email||!msg) { if(status){status.textContent='✕ All fields required.';status.className='err';} return; }
  cfSend.disabled=true; cfSend.textContent='◉ TRANSMITTING…';
  if(status){status.textContent='';status.className='';}
  const url = (PD.appsScriptUrl||'');
  if (!url || url.includes('YOUR_DEPLOYMENT')) {
    window.open(`mailto:${PD.email}?subject=${encodeURIComponent('Portfolio: '+name)}&body=${encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+msg)}`);
    cfSend.disabled=false; cfSend.textContent='⟡ TRANSMIT →';
    if(status){status.textContent='✓ Email client opened.';status.className='ok';}
    aidaSay('Email client opened. Please send from your mail app.','CONTACT');
    return;
  }
  fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message:msg})})
  .then(()=>{
    cfSend.disabled=false; cfSend.textContent='⟡ TRANSMIT →';
    if(status){status.textContent='✓ Transmission successful! Ujas will reply soon.';status.className='ok';}
    aidaSay('Message transmitted to Ujas Dubal. He will reply very soon.','CONTACT');
    ['cf-name','cf-email','cf-msg'].forEach(id=>{const el=$(id);if(el)el.value='';});
  })
  .catch(()=>{
    cfSend.disabled=false; cfSend.textContent='⟡ TRANSMIT →';
    if(status){status.textContent='✕ Network error — use email link below.';status.className='err';}
    aidaSay('Network error. Use the email link below.','CONTACT');
  });
};
const contClose = $('contact-close'); if(contClose) contClose.onclick=()=>$('contact-modal').classList.add('hidden');

/* ═══════════════════════════════════════════════════════════
   12. RAYCASTER
═══════════════════════════════════════════════════════════ */
const raycaster = new THREE.Raycaster();
const mouse2    = new THREE.Vector2();
const tip       = $('tooltip');

function hoverRay(e) {
  mouse2.x = (e.clientX/W)*2-1; mouse2.y = -(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2, camera);
  const hits = raycaster.intersectObjects(clickables, false);
  if (hits.length && hits[0].object.userData.info) {
        const lbl = hits[0].object.userData.info.title || '';
    if (tip) {
      tip.textContent = '◈ ' + lbl;
      tip.style.left  = (e.clientX + 14) + 'px';
      tip.style.top   = (e.clientY - 26) + 'px';
      tip.classList.remove('hidden');
    }
  } else {
    if (tip) tip.classList.add('hidden');
  }
}

canvas.addEventListener('click', e => {
  if (O.drag) return;
  mouse2.x = (e.clientX/W)*2-1; mouse2.y = -(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2, camera);
  const hits = raycaster.intersectObjects(clickables, false);
  if (!hits.length) return;
  const obj  = hits[0].object;
  const info = obj.userData.info;
  if (!info) return;
  /* flash cap */
  const ref = obj.userData.capRef;
  if (ref && ref.material) {
    const ei = ref.material.emissiveIntensity || 1;
    ref.material.emissiveIntensity = 7;
    setTimeout(() => { if (ref.material) ref.material.emissiveIntensity = ei; }, 320);
  }
  if (info.type === 'contact') {
    const cm = $('contact-modal'); if(cm) cm.classList.remove('hidden');
    aidaSay(info.speech || 'Opening contact form.', 'CONTACT');
    return;
  }
  buildPanel(info);
  aidaSay(info.speech || info.title || '', info.title || '');
});

/* ═══════════════════════════════════════════════════════════
   13. INFO PANEL BUILDER
═══════════════════════════════════════════════════════════ */
function buildPanel(info) {
  if (!info) return;
  const panel   = $('info-panel');
  const body    = $('info-body');
  const titleEl = $('info-title');
  if (!panel || !body) return;
  if (titleEl) titleEl.textContent = info.title || '';
  const rb = $('info-read');
  if (rb) rb.onclick = () => aidaSay(info.speech || info.title || '', info.title || '');
  let h = '';

  switch (info.type) {

    case 'home':
      h += `<div class="stat-grid">`;
      safe(info.stats).forEach(s => {
        h += `<div class="stat-chip"><span class="sv">${esc(s.v)}</span><span class="sl">${esc(s.l)}</span></div>`;
      });
      h += `</div>`;
      safe(info.lines).forEach(l => { h += `<p>${esc(l)}</p>`; });
      h += `<div class="tag-row">${['AWS','PySpark','Redshift','Glue','Airflow','Python','Scala','Terraform'].map(t=>`<span class="tag">${t}</span>`).join('')}</div>`;
      break;

    case 'stat':
      h = `<p style="font-family:var(--fh);font-size:48px;font-weight:900;color:var(--c);
               text-shadow:0 0 16px var(--c);text-align:center;padding:16px 0">${esc(info.v||'')}</p>
           <p style="text-align:center;font-size:13px;color:var(--mu)">${esc(info.l||'')}</p>`;
      break;

    case 'about':
    case 'about_detail':
      safe(info.lines).forEach(l => { h += `<p class="isub">${esc(l)}</p>`; });
      if (safe(info.points).length) {
        h += `<ul>${safe(info.points).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;
      }
      break;

    case 'skills_ov':
      h = `<p>Click any hexagonal tower — height = proficiency %.</p>
           <ul>${safe(PD.skills).map(s=>`<li>${esc((s.icon||'')+(s.name||''))} — ${s.pct||0}%</li>`).join('')}</ul>`;
      break;

    case 'skill':
      h = `<span class="spct">${info.pct||0}%</span>
           <div class="sbar-wrap"><div class="sbar-fill" id="sbf"></div></div>
           <p style="margin-top:9px;font-size:11px">Level: <strong style="color:var(--c)">
             ${(info.pct||0)>=90?'Expert':(info.pct||0)>=80?'Advanced':'Proficient'}
           </strong></p>`;
      setTimeout(() => { const f=$('sbf'); if(f) f.style.width=(info.pct||0)+'%'; }, 55);
      break;

    case 'exp_ov':
      h = `<p>Career timeline — click each tower for company details.</p>
           <ul>${safe(PD.experience).map(e=>`<li>${esc(e.company||'')} · ${esc(e.period||'')}</li>`).join('')}</ul>`;
      break;

    case 'exp':
      h += `<div class="co-row">`;
      if (info.logo) {
        h += `<img class="co-logo" src="${esc(info.logo)}" alt="${esc(info.company||'')}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
              <div class="co-fb" style="display:none">${esc(info.fb||'🏢')}</div>`;
      } else {
        h += `<div class="co-fb">${esc(info.fb||'🏢')}</div>`;
      }
      h += `<div>
              <div class="co-name">${esc(info.company||'')}</div>
              <div class="co-period">${esc(info.period||'')}</div>
              <div class="co-loc">📍 ${esc(info.location||'')}</div>
            </div></div>`;
      h += `<p class="isub">${esc(info.role||'')}</p>`;
      h += `<ul>${safe(info.points).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;
      break;

    case 'cert_ov':
      h = `<ul>${safe(PD.certifications).map(c=>`<li>${esc(c.title||'')} · ${esc(c.year||'')}</li>`).join('')}</ul>`;
      break;

    case 'cert':
      safe(info.lines).forEach(l => { h += `<p class="isub">${esc(l)}</p>`; });
      break;

    case 'proj_ov':
      h = `<ul>${safe(PD.projects).map(p=>`<li>${esc(p.title||'')} — ${esc(p.client||'')}</li>`).join('')}</ul>`;
      break;

    case 'project':
      safe(info.lines).forEach(l => { h += `<p class="isub">${esc(l)}</p>`; });
      h += `<div class="tag-row">${safe(info.tags).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`;
      break;

    default:
      h = `<p>${esc(info.speech||info.title||'')}</p>`;
  }

  body.innerHTML = h;
  panel.classList.remove('hidden');
}

const infoClose = $('info-close'); if(infoClose) infoClose.onclick = () => $('info-panel').classList.add('hidden');

/* ═══════════════════════════════════════════════════════════
   14. ZONE NAVIGATION
═══════════════════════════════════════════════════════════ */
const ZONES = [
  { cx:  0, cy:18, cz: 38, lx:  0, ly:0, lz:  0,  ax:  0, az:  8, name:'HOME',
    speech:"Welcome to Ujas's Tron Data World! I'm AIDA your AI guide. Click any glowing object to explore. Use keys 1 through 7 to jump zones, drag to orbit, scroll to zoom!" },
  { cx:-38, cy:14, cz: -4, lx:-28, ly:0, lz:-12,  ax:-25, az:-10, name:'ABOUT',
    speech:"About zone. Ujas Dubal — AWS Data Engineer from Ahmedabad, India. Over 8.5 years of experience. Click the rotating sign plate or DNA helix for full profile details." },
  { cx: 40, cy:14, cz: -4, lx: 28, ly:0, lz:-12,  ax: 25, az:-10, name:'SKILLS',
    speech:"Skills matrix zone. Each glowing hexagonal tower is a technology. Tower height equals proficiency percentage. Click any hex tower to see the skill detail and level." },
  { cx:  0, cy:18, cz:-18, lx:  0, ly:0, lz:-32,  ax:  0, az:-26, name:'CAREER',
    speech:"Career timeline zone. Four companies spanning 8.5 years. Each tower is a company. Click any tower to see the company logo, location, role, and key achievements." },
  { cx:-40, cy:14, cz:-24, lx:-28, ly:0, lz:-32,  ax:-25, az:-30, name:'CERTS',
    speech:"Certifications zone. Four official certifications from AWS and University of Michigan. Click each spinning gem to hear details about that certification." },
  { cx: 40, cy:14, cz:-24, lx: 28, ly:0, lz:-32,  ax: 25, az:-30, name:'PROJECTS',
    speech:"Data projects zone. Three major engineering projects. Click each tower for full tech stack, client details, and measurable impact metrics." },
  { cx:  0, cy:16, cz:-42, lx:  0, ly:0, lz:-52,  ax:  0, az:-46, name:'CONTACT',
    speech:"Contact zone! Click the large spinning pink warp portal ring to open the direct transmission form and send a message straight to Ujas Dubal." }
];

let curZone = -1;

function setZone(idx) {
  idx = Math.max(0, Math.min(6, idx));
  if (idx === curZone) return;
  curZone = idx;
  const zd = ZONES[idx];
  const dx = zd.cx - zd.lx, dy = zd.cy - zd.ly, dz = zd.cz - zd.lz;
  O.r     = Math.sqrt(dx*dx + dy*dy + dz*dz);
  O.phi   = Math.acos(Math.max(-1, Math.min(1, dy / O.r)));
  O.theta = Math.atan2(dx, dz);
  O.tx = zd.lx; O.ty = zd.ly; O.tz = zd.lz;
  aidaG.target.set(zd.ax, 1.4, zd.az);
  const zl = $('zone-lbl');
  if (zl) {
    zl.textContent  = '// ZONE ' + (idx+1) + ' · ' + zd.name;
    zl.style.opacity = '1';
    setTimeout(() => { zl.style.opacity = '0'; }, 3200);
  }
  qsa('.znav').forEach((b, i) => b.classList.toggle('active', i === idx));
  setTimeout(() => aidaSay(zd.speech, zd.name), 220);
}

qsa('.znav').forEach(b => b.addEventListener('click', () => setZone(+(b.dataset.zone))));

window.addEventListener('keydown', e => {
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key >= '1' && e.key <= '7')  { setZone(+e.key - 1); return; }
  if (e.key === 'ArrowRight' || e.key === 'd') { setZone(curZone + 1); return; }
  if (e.key === 'ArrowLeft'  || e.key === 'a') { setZone(curZone - 1); return; }
  if (e.key === 'n' || e.key === 'N') toggleNight();
  if (e.key === 'Escape') {
    [$('info-panel'), $('contact-modal'), $('news-panel'), $('article-modal')]
      .forEach(el => { if(el) el.classList.add('hidden'); });
  }
});

/* ═══════════════════════════════════════════════════════════
   15. EXTRA FEATURES
═══════════════════════════════════════════════════════════ */

/* Night / Day toggle */
let nightMode = true;
function toggleNight() {
  nightMode = !nightMode;
  scene.fog   = new THREE.FogExp2(nightMode ? 0x000511 : 0x050d22, nightMode ? 0.016 : 0.010);
  scene.background = new THREE.Color(nightMode ? 0x000511 : 0x050d22);
  aidaSay(nightMode ? 'Night mode. Full Tron darkness.' : 'Dawn mode. Grid brightens.', 'WORLD');
}

/* Click AIDA 2D canvas → fun facts */
const FUN_FACTS = [
  "Ujas has processed over 10 billion records using PySpark on AWS EMR!",
  "The GitHub Actions pipeline Ujas built reduced deployment time by 34 percent!",
  "Ujas's TCS analytics platform processes real-time streams across 9 cloud services simultaneously.",
  "Ujas secured 100 percent transaction safety using AES-256 and RSA encryption in banking APIs.",
  "The Salesforce Redshift pipeline Ujas built improved data accuracy by 35 percent!",
  "Ujas leads a team of 9 engineers building real-time data analytics on AWS.",
  "Ujas holds an AWS Certified Developer Associate certification from 2023.",
  "Ujas reduced query latency by 20 percent using PySpark partition optimisation.",
  "Ujas built CloudWatch alert automation that reduced support tickets by 20 percent!"
];
let ffIdx = 0;
if (aidaCanvas2d) {
  aidaCanvas2d.addEventListener('click', () => {
    aidaSay(FUN_FACTS[ffIdx % FUN_FACTS.length], 'AIDA FUN FACT');
    ffIdx++;
  });
}

/* Double-click floor → place neon waypoint marker */
const markers = [];
canvas.addEventListener('dblclick', e => {
  mouse2.x = (e.clientX/W)*2-1; mouse2.y = -(e.clientY/H)*2+1;
  raycaster.setFromCamera(mouse2, camera);
  const hits = raycaster.intersectObject(floorMesh, false);
  if (!hits.length) return;
  const pt = hits[0].point;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,3.2,8), neon(0x00ffff,2.2));
  m.position.set(pt.x, 1.6, pt.z); scene.add(m);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9,0.065,6,24), neon(0x00ffff,1.6));
  ring.rotation.x = Math.PI/2; ring.position.set(pt.x, 0.12, pt.z); scene.add(ring);
  const glow = new THREE.PointLight(0x00ffff, 1.2, 6); glow.position.set(pt.x, 1, pt.z); scene.add(glow);
  spinList.push({ mesh: ring, axis: 'y', speed: 0.025 });
  floaters.push({ mesh: m, baseY: 1.6, speed: 1.2, amp: 0.18, phase: Math.random()*Math.PI*2 });
  markers.push(m, ring, glow);
  /* auto-remove oldest marker set if > 5 sets placed */
  if (markers.length > 15) {
    const old = markers.splice(0, 3);
    old.forEach(o => scene.remove(o));
  }
});

/* ═══════════════════════════════════════════════════════════
   16. START OVERLAY
═══════════════════════════════════════════════════════════ */
const startBtn = $('start-btn');
if (startBtn) {
  startBtn.addEventListener('click', () => {
    startMusic(); /* must be inside user gesture for browser autoplay policy */
    const so = $('start-overlay');
    if (so) { so.classList.add('gone'); setTimeout(() => so.style.display='none', 750); }
    setZone(0);
  });
}

/* ═══════════════════════════════════════════════════════════
   17. MAIN RENDER LOOP
═══════════════════════════════════════════════════════════ */
const clock = new THREE.Clock();
let lastT = 0, aidaDrawT = 0;

(function loop() {
  requestAnimationFrame(loop);
  const t  = clock.getElapsedTime();
  const dt = t - lastT; lastT = t;

  /* Float all registered objects */
  floaters.forEach(f => {
    f.mesh.position.y = f.baseY + Math.sin(t * f.speed + f.phase) * f.amp;
  });

  /* Spin all registered objects */
  spinList.forEach(s => {
    if      (s.axis === 'y') s.mesh.rotation.y += s.speed;
    else if (s.axis === 'x') s.mesh.rotation.x += s.speed;
    else if (s.axis === 'z') s.mesh.rotation.z += s.speed;
  });

  /* Data stream particles move along paths */
  streamList.forEach(ds => {
    ds.t += ds.speed;
    if (ds.t >= 1.0) ds.t -= 1.0;
    ds.pt.position.lerpVectors(ds.from, ds.to, ds.t);
    ds.pt.position.y += Math.sin(t * 2.5 + ds.t * 12) * 0.1;
    ds.light.position.copy(ds.pt.position);
  });

  /* AIDA 3D proxy smooth follow */
  aidaG.g.position.x += (aidaG.target.x - aidaG.g.position.x) * 0.035;
  aidaG.g.position.z += (aidaG.target.z - aidaG.g.position.z) * 0.035;
  aidaG.g.position.y  = aidaG.target.y + Math.sin(t * 1.7) * 0.16;
  const adx = aidaG.target.x - aidaG.g.position.x;
  const adz = aidaG.target.z - aidaG.g.position.z;
  if (Math.abs(adx) + Math.abs(adz) > 0.05) aidaG.g.rotation.y = Math.atan2(adx, adz);
  aidaG.head.rotation.y   = Math.sin(t * 0.5) * 0.27;
  aidaG.aGlow.intensity   = 1.5 + Math.sin(t * 3) * 0.55 + (lsActive ? Math.sin(t*14)*0.4 : 0);

  /* AIDA 2D canvas — throttled to ~30fps to save CPU */
  aidaDrawT += dt;
  if (aidaDrawT > 0.033) {
    aidaDrawT = 0;
    blinkTick(dt * 30);
    tickLS();
    drawAIDA(t);
  }

  orbitUpdate();
  renderer.render(scene, camera);
}());

