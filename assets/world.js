/* ================================================================
   UJAS DUBAL — world.js
   Full procedural 3D cartoon data world. No GSAP. No scrollTo.
   Three.js r152 · WebGL · Web Audio · Web Speech · Fetch news
   ================================================================ */
(function () {
'use strict';

var PD = window.PD;
if (!PD || !window.THREE) { console.error('Missing PD or THREE'); return; }
var T = THREE;

/* ── DOM refs ─────────────────────────────────────────────── */
function qs(s) { return document.querySelector(s); }
function qsa(s){ return document.querySelectorAll(s); }

var canvas     = qs('#world');
var aidaMsg    = qs('#aida-msg');
var aidaMouth  = qs('#aida-mouth');
var zoneLbl    = qs('#zone-label');
var infoPanel  = qs('#info-panel');
var infoCont   = qs('#info-content');
var startOvl   = qs('#start-overlay');
var contactMod = qs('#contact-modal');
var btnMusic   = qs('#btn-music');
var btnNews    = qs('#btn-news');

/* ═══════════════════════════════════════════════════════════
   1. THREE.JS RENDERER + SCENE
═══════════════════════════════════════════════════════════ */
var renderer = new T.WebGLRenderer({ canvas:canvas, antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = T.PCFSoftShadowMap;
renderer.outputEncoding    = T.sRGBEncoding;
renderer.toneMapping       = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

var scene  = new T.Scene();
scene.background = new T.Color(0x020617);
scene.fog = new T.FogExp2(0x020617, 0.025);

var camera = new T.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 500);
camera.position.set(0, 18, 38);
camera.lookAt(0, 0, 0);

window.addEventListener('resize', function(){
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ═══════════════════════════════════════════════════════════
   2. ORBIT CONTROLS (manual — no import needed)
═══════════════════════════════════════════════════════════ */
var orbit = {
  spherical: { theta: 0, phi: Math.PI/3, r: 38 },
  target: new T.Vector3(0, 0, 0),
  down: false, lx: 0, ly: 0, lerp: { theta:0, phi:Math.PI/3, r:38 }
};

canvas.addEventListener('pointerdown', function(e){ orbit.down=true; orbit.lx=e.clientX; orbit.ly=e.clientY; });
canvas.addEventListener('pointerup',   function(){ orbit.down=false; });
canvas.addEventListener('pointermove', function(e){
  if (!orbit.down) return;
  orbit.spherical.theta -= (e.clientX - orbit.lx) * 0.006;
  orbit.spherical.phi   -= (e.clientY - orbit.ly) * 0.004;
  orbit.spherical.phi    = Math.max(0.15, Math.min(Math.PI/2.1, orbit.spherical.phi));
  orbit.lx=e.clientX; orbit.ly=e.clientY;
});
canvas.addEventListener('wheel', function(e){
  orbit.spherical.r = Math.max(8, Math.min(80, orbit.spherical.r + e.deltaY * 0.04));
  e.preventDefault();
}, { passive:false });

function updateCamera() {
  orbit.lerp.theta += (orbit.spherical.theta - orbit.lerp.theta) * 0.08;
  orbit.lerp.phi   += (orbit.spherical.phi   - orbit.lerp.phi  ) * 0.08;
  orbit.lerp.r     += (orbit.spherical.r     - orbit.lerp.r    ) * 0.08;
  var s = orbit.lerp;
  camera.position.set(
    orbit.target.x + s.r * Math.sin(s.phi) * Math.sin(s.theta),
    orbit.target.y + s.r * Math.cos(s.phi),
    orbit.target.z + s.r * Math.sin(s.phi) * Math.cos(s.theta)
  );
  camera.lookAt(orbit.target);
}

/* ═══════════════════════════════════════════════════════════
   3. LIGHTS
═══════════════════════════════════════════════════════════ */
scene.add(new T.AmbientLight(0x112244, 1.2));

var sun = new T.DirectionalLight(0x88ccff, 1.6);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far  = 200;
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top   = 60;
sun.shadow.camera.bottom= -60;
scene.add(sun);

/* Coloured point lights for atmosphere */
[[0x00ffff,0,10,0, 40],
 [0xff00ff,-30,8,-15,35],
 [0x00ff88, 30,8, 15,35]].forEach(function(l){
  var pl = new T.PointLight(l[0],1.2,l[4]);
  pl.position.set(l[1],l[2],l[3]);
  scene.add(pl);
});

/* ═══════════════════════════════════════════════════════════
   4. PROCEDURAL 3D WORLD GEOMETRY
   All built with Three.js primitives — no external models
═══════════════════════════════════════════════════════════ */

/* Helper: toon material */
function mat(col, rough) {
  return new T.MeshToonMaterial({ color:col, roughness:rough||0.8 });
}
function matL(col, emissive, intensity) {
  return new T.MeshStandardMaterial({ color:col, emissive:emissive||col, emissiveIntensity:intensity||0.3, roughness:.7 });
}

var clickables = [];   // objects that respond to raycaster clicks
var floating   = [];   // objects that bob up/down
var spinners   = [];   // objects that spin

/* ── Grid floor ── */
(function buildFloor(){
  var g = new T.PlaneGeometry(200, 200, 40, 40);
  var m = new T.MeshStandardMaterial({
    color: 0x020c1e, roughness: 1,
    wireframe: false, metalness: 0.1
  });
  var mesh = new T.Mesh(g, m);
  mesh.rotation.x = -Math.PI/2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  /* Grid lines on top */
  var gl = new T.GridHelper(200, 40, 0x00ffff, 0x002244);
  gl.material.opacity = 0.35;
  gl.material.transparent = true;
  gl.position.y = 0.01;
  scene.add(gl);
})();

/* ── Floating island builder ── */
function makeIsland(x, z, radius, color, height) {
  var h = height || 1.2;
  var g = new T.CylinderGeometry(radius, radius*1.3, h, 7);
  var m = new T.Mesh(g, mat(color || 0x0a1a3a));
  m.position.set(x, -0.4, z);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  /* Top ring glow */
  var rg = new T.TorusGeometry(radius*1.02, 0.07, 8, 40);
  var rm = new T.Mesh(rg, matL(0x00ffff, 0x00ffff, 0.8));
  rm.rotation.x = Math.PI/2;
  rm.position.set(x, h/2 - 0.4, z);
  scene.add(rm);
  return m;
}

/* ── Glowing data tower builder ── */
function makeTower(x, z, h, color, label, userData) {
  var g  = new T.BoxGeometry(1.4, h, 1.4);
  var m  = new T.Mesh(g, matL(color, color, 0.4));
  m.position.set(x, h/2, z);
  m.castShadow = true;
  if (label)    m.userData.label    = label;
  if (userData) m.userData.info     = userData;
  m.userData.baseY = h/2;
  m.userData.baseColor = color;
  scene.add(m);
  clickables.push(m);
  floating.push({ mesh:m, speed:0.5+Math.random()*0.5, amp:0.15, phase:Math.random()*Math.PI*2 });

  /* Top cap */
  var cg = new T.BoxGeometry(1.8, 0.25, 1.8);
  var cm = new T.Mesh(cg, matL(color, color, 0.8));
  cm.position.set(x, h + 0.12, z);
  scene.add(cm);

  /* Glow ring around tower */
  var tg = new T.TorusGeometry(1.1, 0.05, 6, 32);
  var tm = new T.Mesh(tg, matL(color, color, 1.2));
  tm.rotation.x = Math.PI/2;
  tm.position.set(x, h*0.5, z);
  spinners.push({ mesh:tm, axis:'y', speed:0.012 });
  scene.add(tm);

  return m;
}

/* ── Floating ring portal ── */
function makePortal(x, y, z, col, rInner, rOuter) {
  var g = new T.TorusGeometry(rInner||2.5, rOuter||0.18, 12, 60);
  var m = new T.Mesh(g, matL(col, col, 1.5));
  m.position.set(x, y, z);
  spinners.push({ mesh:m, axis:'y', speed:0.007 });
  scene.add(m);
  /* Inner glow disc */
  var dg = new T.CircleGeometry(rInner||2.5, 32);
  var dm = new T.Mesh(dg, new T.MeshBasicMaterial({ color:col, transparent:true, opacity:0.07, side:T.DoubleSide }));
  dm.position.set(x, y, z);
  scene.add(dm);
  return m;
}

/* ── Data stream tubes (animated) ── */
var dataStreams = [];
function makeDataStream(from, to, col) {
  var dir = new T.Vector3().subVectors(to, from);
  var len = dir.length();
  var g = new T.CylinderGeometry(0.04, 0.04, len, 6);
  var m = new T.Mesh(g, matL(col, col, 2.0));
  m.position.copy(from).addScaledVector(dir.normalize(), len/2);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), dir);
  scene.add(m);
  /* Moving particle along stream */
  var pg = new T.SphereGeometry(0.12, 6, 6);
  var pm = new T.Mesh(pg, matL(col, col, 3));
  scene.add(pm);
  dataStreams.push({ particle:pm, from:from.clone(), to:to.clone(), t:Math.random(), speed:0.004+Math.random()*0.006 });
}

/* ── AIDA robot character (procedural geometry) ── */
var AIDA = (function buildAIDA() {
  var group = new T.Group();

  /* Body */
  var body = new T.Mesh(
    new T.BoxGeometry(1.2, 1.4, 0.8),
    matL(0x0a2a5a, 0x00ffff, 0.3)
  );
  body.castShadow = true;
  group.add(body);

  /* Chest screen glow */
  var screen = new T.Mesh(
    new T.BoxGeometry(0.7, 0.5, 0.05),
    matL(0x001133, 0x00ffff, 1.2)
  );
  screen.position.set(0, 0.1, 0.43);
  group.add(screen);

  /* Head */
  var head = new T.Mesh(
    new T.BoxGeometry(0.9, 0.85, 0.8),
    matL(0x0d2b55, 0x00ffff, 0.25)
  );
  head.position.set(0, 1.12, 0);
  head.castShadow = true;
  group.add(head);

  /* Eyes */
  [[-.22,1.18,.41],[.22,1.18,.41]].forEach(function(p){
    var eye = new T.Mesh(
      new T.SphereGeometry(0.12, 8, 8),
      new T.MeshBasicMaterial({ color:0x00ffff })
    );
    eye.position.set(p[0],p[1],p[2]);
    group.add(eye);
    /* Eye glow */
    var eg = new T.PointLight(0x00ffff, 0.8, 2.5);
    eg.position.copy(eye.position);
    group.add(eg);
  });

  /* Antenna */
  var ant = new T.Mesh(
    new T.CylinderGeometry(0.04, 0.04, 0.6, 6),
    matL(0x00ffff, 0x00ffff, 1)
  );
  ant.position.set(0, 1.87, 0);
  group.add(ant);
  var antBall = new T.Mesh(
    new T.SphereGeometry(0.12, 8, 8),
    new T.MeshBasicMaterial({ color:0x00ffff })
  );
  antBall.position.set(0, 2.22, 0);
  group.add(antBall);
  var antLight = new T.PointLight(0x00ffff, 1.5, 4);
  antLight.position.set(0, 2.2, 0);
  group.add(antLight);

  /* Arms */
  [[-0.72, 0.15, 0], [0.72, 0.15, 0]].forEach(function(p, i){
    var arm = new T.Mesh(
      new T.CylinderGeometry(0.15, 0.12, 0.9, 6),
      matL(0x0a2a5a, 0x00ffff, 0.2)
    );
    arm.position.set(p[0], p[1], p[2]);
    arm.rotation.z = (i===0 ? 1 : -1) * 0.3;
    arm.castShadow = true;
    group.add(arm);
  });

  /* Legs */
  [[-0.3,-0.9,0],[0.3,-0.9,0]].forEach(function(p){
    var leg = new T.Mesh(
      new T.CylinderGeometry(0.18, 0.14, 0.85, 6),
      matL(0x061428, 0x00ffff, 0.15)
    );
    leg.position.set(p[0],p[1],p[2]);
    leg.castShadow = true;
    group.add(leg);
  });

  /* Scale and position */
  group.scale.setScalar(0.75);
  group.position.set(0, 1.5, 8);
  scene.add(group);

  return {
    group: group,
    head:  head,
    antLight: antLight,
    screen: screen,
    targetPos: new T.Vector3(0, 1.5, 8),
    phase: 0
  };
})();

/* ── BUILD ZONES ────────────────────────────────────────── */

/* Zone 0: HOME — central launch pad */
makeIsland(0, 0, 7, 0x061830, 1.5);
makePortal(0, 5, 0, 0x00ffff, 3, 0.22);
makePortal(0, 5, 0, 0xff00ff, 4.5, 0.12);

/* Hero name floating text (using 3D box proxies — text mesh needs font) */
var heroBox = new T.Mesh(
  new T.BoxGeometry(8, 1.5, 0.2),
  matL(0x001133, 0x00ffff, 0.5)
);
heroBox.position.set(0, 8, 0);
heroBox.userData.label = "Ujas Dubal";
heroBox.userData.info  = {
  type: 'home',
  name: PD.name, title: PD.title, tagline: PD.tagline, stats: PD.stats
};
clickables.push(heroBox);
floating.push({ mesh:heroBox, speed:0.4, amp:0.3, phase:0 });
spinners.push({ mesh:heroBox, axis:'y', speed:0.003 });
scene.add(heroBox);

/* Stats orbs around center */
PD.stats.forEach(function(s, i){
  var a = (i/PD.stats.length)*Math.PI*2;
  var orb = new T.Mesh(
    new T.SphereGeometry(0.6, 8, 8),
    matL(0x00ffff, 0x00ffff, 0.6)
  );
  orb.position.set(Math.cos(a)*5.5, 3 + Math.sin(i)*0.5, Math.sin(a)*5.5);
  orb.userData.label = s.v + ' ' + s.l;
  orb.userData.info  = { type:'stat', v:s.v, l:s.l };
  orb.userData.speech= s.v + ' ' + s.l;
  clickables.push(orb);
  floating.push({ mesh:orb, speed:0.6+i*0.1, amp:0.25, phase:i*1.2 });
  scene.add(orb);
});

/* Zone 1: ABOUT — island at -25, 0, -10 */
var aboutIsland = makeIsland(-25, -10, 5, 0x0a1f0a, 1.3);
makeTower(-25, -10, 4.5, 0x00ff88, "Who I Am", {
  type:'about',
  name: PD.name,
  title: PD.title,
  tagline: PD.tagline,
  speech: "I am Ujas Dubal, AWS Data Engineer and Technical Lead from Ahmedabad India with 8.5 years of experience.",
  points: [
    "8.5+ years IT · 5+ years Data Engineering",
    "Technical Lead · 1.5+ years leadership",
    "M.Sc IT – GLS University 2019",
    "B.E. Electronics – GTU 2015",
    "TCS On-the-Spot Award 2023 · CoA 2024"
  ]
});
makeDataStream(new T.Vector3(0,2,0), new T.Vector3(-25,2,-10), 0x00ff88);

/* Zone 2: SKILLS — island at 25, 0, -10 */
makeIsland(25, -10, 6, 0x1a0a2a, 1.3);
PD.skills.forEach(function(sk, i){
  var a = (i/PD.skills.length)*Math.PI*2;
  var r = 3.5 + (i%2)*1.2;
  makeTower(
    25 + Math.cos(a)*r, -10,
    1.5 + sk.level/30,
    sk.col,
    sk.name,
    { type:'skill', name:sk.name, level:sk.level, speech:sk.name + ' — ' + sk.level + ' percent proficiency.' }
  );
});
makeDataStream(new T.Vector3(0,2,0), new T.Vector3(25,2,-10), 0xff00ff);

/* Zone 3: EXPERIENCE — island at 0, 0, -30 */
makeIsland(0, -30, 8, 0x1a0f00, 1.5);
PD.experience.forEach(function(e, i){
  var x = (i - 1.5) * 5;
  makeTower(x, -30, 3 + i*1.2, e.color, e.company, {
    type: 'experience', data: e, speech: e.speech
  });
});
makeDataStream(new T.Vector3(0,2,0), new T.Vector3(0,2,-30), 0xffaa00);

/* Zone 4: CERTIFICATIONS — island at -25, 0, -30 */
makeIsland(-25, -30, 5, 0x000a20, 1.2);
PD.certifications.forEach(function(c, i){
  var a = (i/PD.certifications.length)*Math.PI*2;
  var cert = new T.Mesh(
    new T.OctahedronGeometry(1, 0),
    matL(c.color, c.color, 0.6)
  );
  cert.position.set(-25 + Math.cos(a)*3, 2.5, -30 + Math.sin(a)*3);
  cert.userData.label = c.title;
  cert.userData.info  = { type:'cert', data:c, speech:c.speech };
  clickables.push(cert);
  floating.push({ mesh:cert, speed:0.7+i*0.15, amp:0.3, phase:i*1.5 });
  spinners.push({ mesh:cert, axis:'y', speed:0.018+i*0.003 });
  scene.add(cert);
});
makeDataStream(new T.Vector3(0,2,-30), new T.Vector3(-25,2,-30), 0x00aaff);

/* Zone 5: PROJECTS — island at 25, 0, -30 */
makeIsland(25, -30, 6, 0x1a0500, 1.3);
PD.projects.forEach(function(p, i){
  var a = (i/PD.projects.length)*Math.PI*2;
  makeTower(
    25 + Math.cos(a)*3.5, -30,
    4 + i*0.8,
    p.color, p.title,
    { type:'project', data:p, speech:p.speech }
  );
});
makeDataStream(new T.Vector3(0,2,-30), new T.Vector3(25,2,-30), 0xff6600);

/* Zone 6: CONTACT — island at 0, 0, -50 */
makeIsland(0, -50, 5, 0x1a0020, 1.2);
var contactPortal = makePortal(0, 5, -50, 0xff0088, 3.5, 0.25);
var contactTower  = makeTower(0, -50, 5, 0xff0088, "Contact Ujas", {
  type:'contact',
  speech:"Let's connect! Ujas is open to Data Engineering and Technical Lead roles. Click to send a message."
});
makeDataStream(new T.Vector3(0,2,-30), new T.Vector3(0,2,-50), 0xff0088);

/* Ambient floating particles */
(function buildParticles(){
  var N = 2000;
  var pos = new Float32Array(N*3);
  var col = new Float32Array(N*3);
  var colors = [[0,1,1],[1,0,1],[0,1,.5]];
  for (var i=0;i<N;i++){
    pos[i*3]   = (Math.random()-.5)*160;
    pos[i*3+1] = Math.random()*25;
    pos[i*3+2] = (Math.random()-.5)*160;
    var c = colors[Math.floor(Math.random()*3)];
    col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos,3));
  g.setAttribute('color', new T.BufferAttribute(col,3));
  scene.add(new T.Points(g, new T.PointsMaterial({
    size:.18, vertexColors:true, transparent:true, opacity:.65,
    blending:T.AdditiveBlending, depthWrite:false
  })));
})();

/* ═══════════════════════════════════════════════════════════
   5. ZONE CAMERA POSITIONS
═══════════════════════════════════════════════════════════ */
var zoneCams = [
  { pos:new T.Vector3(0,18,38),   tgt:new T.Vector3(0,0,0)   },   // home
  { pos:new T.Vector3(-35,14,-3), tgt:new T.Vector3(-25,2,-10)},  // about
  { pos:new T.Vector3(38,14,-3),  tgt:new T.Vector3(25,2,-10) },  // skills
  { pos:new T.Vector3(0,18,-18),  tgt:new T.Vector3(0,2,-30)  },  // experience
  { pos:new T.Vector3(-34,14,-22),tgt:new T.Vector3(-25,2,-30)},  // certs
  { pos:new T.Vector3(34,14,-22), tgt:new T.Vector3(25,2,-30) },  // projects
  { pos:new T.Vector3(0,16,-42),  tgt:new T.Vector3(0,2,-50)  }   // contact
];

var aidaPositions = [
  new T.Vector3(0,1.5,8),
  new T.Vector3(-22,1.5,-8),
  new T.Vector3(22,1.5,-8),
  new T.Vector3(0,1.5,-26),
  new T.Vector3(-22,1.5,-28),
  new T.Vector3(22,1.5,-28),
  new T.Vector3(0,1.5,-46)
];

var currentZone   = 0;
var camTargetPos  = new T.Vector3().copy(zoneCams[0].pos);
var camTargetLook = new T.Vector3().copy(zoneCams[0].tgt);

function goToZone(idx) {
  idx = Math.max(0, Math.min(6, idx));
  currentZone = idx;
  var zc = zoneCams[idx];
  camTargetPos.copy(zc.pos);
  camTargetLook.copy(zc.tgt);
  orbit.target.copy(zc.tgt);
  orbit.spherical.theta = 0;

  /* Update orbit to match */
  var diff = new T.Vector3().subVectors(zc.pos, zc.tgt);
  orbit.spherical.r   = diff.length();
  orbit.spherical.phi = Math.acos(diff.y / orbit.spherical.r);

  /* Move AIDA */
  AIDA.targetPos.copy(aidaPositions[idx]);

  /* Zone label */
  var zd = PD.zones[idx];
  zoneLbl.textContent = zd.label;
  zoneLbl.style.opacity = '1';
  setTimeout(function(){ zoneLbl.style.opacity='0'; }, 3200);

  /* AIDA speech */
  var speeches = [
    "Welcome! This is the Home zone. I'm AIDA, your guide. Click any glowing object to learn about Ujas!",
    "This is the About zone. Ujas is an AWS Data Engineer with 8.5 years of experience. Click the tower!",
    "Welcome to the Skills arena! Each tower represents a technology. Taller tower means higher proficiency!",
    "Experience zone! Four towers, four companies. Click each one to read Ujas's career story.",
    "Certifications! These spinning gems represent Ujas's certifications. Click each one!",
    "Projects zone! Three projects built by Ujas. Each tower holds a different data engineering story.",
    "Contact zone! This warp gate connects you directly to Ujas. Click the tower to send a message!"
  ];
  aidaSpeak(speeches[idx]);

  /* Update nav active state */
  qsa('.znav').forEach(function(b, i){ b.classList.toggle('active', i===idx); });
}

/* ═══════════════════════════════════════════════════════════
   6. WEB SPEECH API
═══════════════════════════════════════════════════════════ */
var synth = window.speechSynthesis || null;
var selVoice = null;
var isSpeaking = false;

function loadVoice() {
  if (!synth) return;
  var v = synth.getVoices();
  selVoice =
    v.find(function(x){ return x.name.includes('Google US English'); }) ||
    v.find(function(x){ return x.lang==='en-US' && !x.localService; }) ||
    v.find(function(x){ return x.lang && x.lang.startsWith('en'); }) ||
    v[0] || null;
}
loadVoice();
if (synth && synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoice;

function aidaSpeak(text) {
  if (!text) return;
  /* Update HUD bubble */
  aidaMsg.textContent = '';
  var i = 0;
  (function t(){ if(i<text.length){ aidaMsg.textContent+=text[i++]; setTimeout(t,16); } })();

  if (!synth) return;
  synth.cancel();
  loadVoice();
  var utt    = new SpeechSynthesisUtterance(text);
  utt.lang   = 'en-US';
  utt.rate   = 0.88;
  utt.pitch  = 1.08;
  utt.volume = 1;
  if (selVoice) utt.voice = selVoice;
  utt.onstart = function(){ isSpeaking=true; aidaMouth.classList.add('talking'); };
  utt.onend   = function(){ isSpeaking=false; aidaMouth.classList.remove('talking'); };
  synth.speak(utt);
}

/* AIDA repeat / skip */
qs('#aida-repeat').addEventListener('click', function(){
  aidaSpeak(aidaMsg.textContent);
});
qs('#aida-skip').addEventListener('click', function(){
  if (synth) synth.cancel();
  isSpeaking = false;
  aidaMouth.classList.remove('talking');
});

/* ═══════════════════════════════════════════════════════════
   7. WEB AUDIO — ambient music (starts on first user click)
═══════════════════════════════════════════════════════════ */
var audioCtx   = null;
var musicNodes = [];
var musicOn    = false;

function initAudio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){ return; }
}

function startMusic() {
  initAudio();
  if (!audioCtx || musicOn) return;

  var master = audioCtx.createGain();
  master.gain.setValueAtTime(0.06, audioCtx.currentTime);
  master.connect(audioCtx.destination);

  /* Reverb */
  var conv = audioCtx.createConvolver();
  var len  = audioCtx.sampleRate * 3;
  var buf  = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
  for (var ch=0;ch<2;ch++){
    var d=buf.getChannelData(ch);
    for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);
  }
  conv.buffer=buf;
  conv.connect(master);

  /* Delay echo */
  var delay=audioCtx.createDelay(1.5);
  delay.delayTime.setValueAtTime(0.42,audioCtx.currentTime);
  var dfb=audioCtx.createGain(); dfb.gain.setValueAtTime(0.28,audioCtx.currentTime);
  delay.connect(dfb); dfb.connect(delay); delay.connect(master);

  /* Sci-fi pentatonic drone */
  [65.41,98,130.81,164.81,196,261.63,329.63,392].forEach(function(freq,i){
    var osc=audioCtx.createOscillator();
    var g=audioCtx.createGain();
    osc.type = i%2===0?'sine':'triangle';
    osc.frequency.setValueAtTime(freq,audioCtx.currentTime);
    osc.detune.setValueAtTime((Math.random()-.5)*6,audioCtx.currentTime);
    var lfo=audioCtx.createOscillator();
    var lg=audioCtx.createGain();
    lfo.frequency.setValueAtTime(0.07+i*.025,audioCtx.currentTime);
    lg.gain.setValueAtTime(0.03,audioCtx.currentTime);
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    g.gain.setValueAtTime(0.04+Math.random()*.035,audioCtx.currentTime);
    osc.connect(g); g.connect(conv); g.connect(delay); osc.start();
    musicNodes.push(osc,lfo,g);
  });
  musicNodes.push(master,conv,delay,dfb);
  musicOn=true;
  btnMusic.textContent='🔊 Music';
  btnMusic.classList.add('on');
}

function stopMusic() {
  if (!musicOn) return;
  musicNodes.forEach(function(n){ try{n.stop&&n.stop();}catch(e){} });
  try{ if(musicNodes[musicNodes.length-4]) musicNodes[musicNodes.length-4].gain.setValueAtTime(0,audioCtx.currentTime); }catch(e){}
  musicNodes=[];
  musicOn=false;
  btnMusic.textContent='🎵 Music';
  btnMusic.classList.remove('on');
}

btnMusic.addEventListener('click', function(){
  if (musicOn) stopMusic(); else startMusic();
});

/* ═══════════════════════════════════════════════════════════
   8. AI NEWS — fetch from free RSS-to-JSON API
═══════════════════════════════════════════════════════════ */
btnNews.addEventListener('click', function(){
  aidaSpeak("Fetching latest AI and tech news for you...");
  /* Use rss2json.com free tier — converts any RSS to JSON */
  var rssUrl = encodeURIComponent('https://feeds.feedburner.com/TechCrunch');
  var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl + '&count=3';
  fetch(apiUrl)
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data && data.items && data.items.length) {
        var titles = data.items.slice(0,3).map(function(item,i){
          return (i+1) + '. ' + item.title;
        }).join('. ');
        aidaSpeak("Here are today's top tech headlines: " + titles);
        showInfo({
          type:'news',
          title:'📰 Latest Tech News (via TechCrunch)',
          items: data.items.slice(0,5).map(function(it){ return it.title; })
        });
      } else {
        aidaSpeak("I couldn't fetch news right now. Check your internet connection.");
      }
    })
    .catch(function(){
      /* Fallback to hardcoded relevant AI/data news snippets */
      var fallbacks = [
        "AWS announces new Redshift Serverless pricing improvements for 2026.",
        "PySpark 4.0 brings major performance improvements for large scale data.",
        "Apache Airflow 3.0 released with improved DAG authoring experience.",
        "Databricks Unity Catalog now generally available across all cloud providers.",
        "GitHub Copilot gains new features for data engineering workflows."
      ];
      aidaSpeak("Here are some recent highlights in the data engineering world: " + fallbacks.slice(0,3).join('. '));
      showInfo({ type:'news', title:'📰 Data Engineering Headlines', items: fallbacks });
    });
});

/* ═══════════════════════════════════════════════════════════
   9. RAYCASTER — click 3D objects
═══════════════════════════════════════════════════════════ */
var raycaster = new T.Raycaster();
var mouse2d   = new T.Vector2();

canvas.addEventListener('click', function(e){
  /* Ignore if it was a drag */
  if (Math.abs(e.clientX - orbit.lx) > 5 || Math.abs(e.clientY - orbit.ly) > 5) return;

  mouse2d.x =  (e.clientX / innerWidth)  * 2 - 1;
  mouse2d.y = -(e.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse2d, camera);
  var hits = raycaster.intersectObjects(clickables, true);
  if (!hits.length) return;

  var obj = hits[0].object;
  /* Walk up to find the root with userData */
  var root = obj;
  while (root && !root.userData.info && root.parent) root = root.parent;
  var info = root.userData.info || obj.userData.info;
  if (!info) return;

  /* Pulse the object */
  if (obj.material && obj.material.emissiveIntensity !== undefined) {
    var origEI = obj.material.emissiveIntensity;
    obj.material.emissiveIntensity = 3;
    setTimeout(function(){ if(obj.material) obj.material.emissiveIntensity = origEI; }, 400);
  }

  if (info.type === 'contact') {
    contactMod.classList.remove('hidden');
    aidaSpeak(info.speech || "Let's connect! Fill in the form to message Ujas.");
  } else {
    showInfo(info);
    if (info.speech) aidaSpeak(info.speech);
    else if (info.data && info.data.speech) aidaSpeak(info.data.speech);
  }
});

/* ── Info panel content builder ── */
function showInfo(info) {
  var html = '';
  if (info.type === 'home') {
    html = '<h2>🚀 ' + info.name + '</h2>' +
      '<p>' + info.title + '</p>' +
      '<p style="font-style:italic;margin-bottom:14px">' + info.tagline + '</p>' +
      '<div class="stat-row">' +
      info.stats.map(function(s){
        return '<div class="stat-chip"><span class="v">' + s.v + '</span><span class="l">' + s.l + '</span></div>';
      }).join('') + '</div>';
  } else if (info.type === 'about') {
    html = '<h2>👤 About</h2>' +
      '<p>' + info.name + ' — ' + info.title + '</p>' +
      '<ul>' + info.points.map(function(p){ return '<li>' + p + '</li>'; }).join('') + '</ul>';
  } else if (info.type === 'skill') {
    html = '<h2>⚡ ' + info.name + '</h2>' +
      '<p>Proficiency: <strong style="color:#00ffff">' + info.level + '%</strong></p>' +
      '<div style="height:8px;background:rgba(0,255,255,.1);border-radius:999px;overflow:hidden;margin-top:8px">' +
      '<div style="height:100%;width:' + info.level + '%;background:linear-gradient(to right,#00ffff,#ff00ff);border-radius:999px;transition:width 1s ease"></div></div>';
  } else if (info.type === 'stat') {
    html = '<h2>' + info.l + '</h2><p style="font-size:32px;color:#00ffff;font-weight:800">' + info.v + '</p>';
  } else if (info.type === 'experience') {
    var e = info.data;
    html = '<h2>🚀 ' + e.role + '</h2>' +
      '<p style="color:#00ffff">' + e.company + '</p><p>' + e.period + '</p>' +
      '<ul style="margin-top:10px">' + e.points.map(function(p){ return '<li>'+p+'</li>'; }).join('') + '</ul>';
  } else if (info.type === 'cert') {
    var c = info.data;
    html = '<h2>🏅 ' + c.title + '</h2><p>' + c.issuer + '</p>';
  } else if (info.type === 'project') {
    var p = info.data;
    html = '<h2>🛠 ' + p.title + '</h2>' +
      '<p>' + p.client + '</p><p>' + p.desc + '</p>' +
      '<div class="tags">' + p.tags.map(function(t){ return '<span class="tag">'+t+'</span>'; }).join('') + '</div>';
  } else if (info.type === 'news') {
    html = '<h2>' + info.title + '</h2>' +
      '<ul>' + info.items.map(function(n){ return '<li>' + n + '</li>'; }).join('') + '</ul>';
  }
  infoCont.innerHTML = html;
  infoPanel.classList.remove('hidden');
}

qs('#info-close').addEventListener('click', function(){ infoPanel.classList.add('hidden'); });

/* ═══════════════════════════════════════════════════════════
   10. NAVIGATION — zone buttons + keyboard
═══════════════════════════════════════════════════════════ */
qsa('.znav').forEach(function(b, i){
  b.addEventListener('click', function(){ goToZone(i); });
});

window.addEventListener('keydown', function(e){
  if (e.target && (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')) return;
  if (e.key>='1'&&e.key<='7') goToZone(parseInt(e.key,10)-1);
  else if (e.key==='ArrowRight'||e.key==='d') goToZone(currentZone+1);
  else if (e.key==='ArrowLeft' ||e.key==='a') goToZone(currentZone-1);
  else if (e.key==='Escape') { infoPanel.classList.add('hidden'); contactMod.classList.add('hidden'); }
});

/* ═══════════════════════════════════════════════════════════
   11. CONTACT FORM
═══════════════════════════════════════════════════════════ */
qs('#contact-close').addEventListener('click', function(){ contactMod.classList.add('hidden'); });

/* Wire form fields from data.js config */
var gf = qs('#gform');
if (gf) {
  gf.action = PD.formAction;
  var ni=gf.querySelector('input[type=text]');
  var ei=gf.querySelector('input[type=email]');
  var mi=gf.querySelector('textarea');
  if(ni) ni.name=PD.formFields.name;
  if(ei) ei.name=PD.formFields.email;
  if(mi) mi.name=PD.formFields.message;
}

gf && gf.addEventListener('submit', function(){
  setTimeout(function(){
    qs('#form-ok').style.display='block';
    aidaSpeak("Message sent! Ujas will reply to you very soon.");
    showInfo({type:'news',title:'✅ Message Sent!',items:['Ujas will reply within 24 hours.','You can also reach him on LinkedIn.','Email: ujasdubal@gmail.com']});
    gf.reset();
  }, 600);
});

/* ═══════════════════════════════════════════════════════════
   12. START OVERLAY — enters on first click (fixes audio autoplay)
═══════════════════════════════════════════════════════════ */
qs('#start-btn').addEventListener('click', function(){
  startMusic();
  startOvl.classList.add('gone');
  setTimeout(function(){ startOvl.style.display='none'; }, 700);
  goToZone(0);
  aidaSpeak("Welcome to Ujas's Data World! I'm AIDA. Click any glowing object to explore. Press numbers 1 through 7 to jump between zones!");
});

/* ═══════════════════════════════════════════════════════════
   13. MAIN RENDER LOOP
═══════════════════════════════════════════════════════════ */
var clock  = new T.Clock();
var camPos = new T.Vector3().copy(camera.position);

(function loop() {
  requestAnimationFrame(loop);
  var t = clock.getElapsedTime();
  var dt = clock.getDelta ? 0.016 : 0.016;

  /* Floating objects */
  floating.forEach(function(f){
    f.mesh.position.y = f.mesh.userData.baseY + Math.sin(t * f.speed + f.phase) * f.amp;
  });

  /* Spinners */
  spinners.forEach(function(s){
    if (s.axis==='y') s.mesh.rotation.y += s.speed;
    else if (s.axis==='x') s.mesh.rotation.x += s.speed;
  });

  /* Data stream particles */
  dataStreams.forEach(function(ds){
    ds.t += ds.speed;
    if (ds.t >= 1) ds.t -= 1;
    ds.particle.position.lerpVectors(ds.from, ds.to, ds.t);
    /* Slight bob */
    ds.particle.position.y += Math.sin(t * 2 + ds.t * 10) * 0.15;
  });

  /* AIDA movement — smooth walk toward target */
  AIDA.group.position.lerp(AIDA.targetPos, 0.03);
  /* AIDA bobs */
  AIDA.group.position.y = AIDA.targetPos.y + Math.sin(t * 1.8) * 0.18;
  /* AIDA faces direction of movement */
  var aidaDx = AIDA.targetPos.x - AIDA.group.position.x;
  var aidaDz = AIDA.targetPos.z - AIDA.group.position.z;
  if (Math.abs(aidaDx)+Math.abs(aidaDz) > 0.1) {
    AIDA.group.rotation.y = Math.atan2(aidaDx, aidaDz);
  }
  /* AIDA head gentle look-around */
  AIDA.head.rotation.y = Math.sin(t * 0.5) * 0.3;
  /* AIDA antenna pulse */
  AIDA.antLight.intensity = 1.2 + Math.sin(t * 3) * 0.5;
  /* AIDA speaking: chest screen pulses */
  if (isSpeaking) {
    AIDA.screen.material.emissiveIntensity = 0.8 + Math.sin(t * 18) * 0.7;
  } else {
    AIDA.screen.material.emissiveIntensity = 0.3;
  }

  /* Camera smooth lerp to target */
  camera.position.lerp(camTargetPos, 0.045);
  orbit.target.lerp(camTargetLook, 0.06);
  camera.lookAt(orbit.target);

  renderer.render(scene, camera);
})();

/* ── Year footer ── */
var yearEl = qs('#yr');
if (yearEl) yearEl.textContent = new Date().getFullYear();

})(); // end IIFE
