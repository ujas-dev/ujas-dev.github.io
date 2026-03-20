/* ================================================================
   world.js  — Ujas Dubal 3D Portfolio
   Zero GSAP · Zero ScrollTrigger · Zero scrollTo conflict
   Wraps in window.onload to guarantee THREE + PD are ready
   ================================================================ */

window.addEventListener('load', function () {

  /* ── Guard: confirm libraries loaded ─────────────────────── */
  if (typeof THREE === 'undefined') {
    document.getElementById('aida-msg').textContent =
      'THREE.js failed to load. Check internet connection.';
    return;
  }
  if (typeof window.PD === 'undefined') {
    document.getElementById('aida-msg').textContent =
      'Portfolio data failed to load.';
    return;
  }

  var PD = window.PD;
  var T  = THREE;

  /* ── DOM helpers ──────────────────────────────────────────── */
  function qs(s)  { return document.querySelector(s); }
  function qsa(s) { return document.querySelectorAll(s); }
  function el(id) { return document.getElementById(id); }

  /* ── Safe navigation (NEVER named scrollTo) ───────────────── */
  function flyToZone(idx) { setZone(idx); }

  /* ═══════════════════════════════════════════════════════════
     1.  RENDERER + SCENE + CAMERA
  ═══════════════════════════════════════════════════════════ */
  var canvas   = el('world');
  var W = window.innerWidth, H = window.innerHeight;

  var renderer = new T.WebGLRenderer({
    canvas: canvas, antialias: true, alpha: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = T.PCFSoftShadowMap;
  /* NOTE: outputEncoding and toneMapping removed — causes warnings in r152 */

  var scene  = new T.Scene();
  scene.background = new T.Color(0x020617);
  scene.fog        = new T.FogExp2(0x020617, 0.022);

  var camera = new T.PerspectiveCamera(55, W / H, 0.1, 500);
  camera.position.set(0, 20, 42);
  camera.lookAt(0, 0, 0);

  window.addEventListener('resize', function () {
    W = window.innerWidth; H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  /* ═══════════════════════════════════════════════════════════
     2.  MANUAL ORBIT CONTROLS (no import needed)
  ═══════════════════════════════════════════════════════════ */
  var orb = {
    theta: 0, phi: Math.PI / 3.2, r: 42,
    ltheta: 0, lphi: Math.PI / 3.2, lr: 42,
    tx: 0, ty: 0, tz: 0,
    ltx: 0, lty: 0, ltz: 0,
    down: false, lmx: 0, lmy: 0,
    isDragging: false, dragStartX: 0, dragStartY: 0
  };

  canvas.addEventListener('pointerdown', function (e) {
    orb.down      = true;
    orb.lmx       = e.clientX;
    orb.lmy       = e.clientY;
    orb.dragStartX = e.clientX;
    orb.dragStartY = e.clientY;
    orb.isDragging = false;
  });
  canvas.addEventListener('pointerup', function () { orb.down = false; });
  canvas.addEventListener('pointermove', function (e) {
    if (!orb.down) return;
    var dx = e.clientX - orb.lmx;
    var dy = e.clientY - orb.lmy;
    if (Math.abs(e.clientX - orb.dragStartX) > 4 || Math.abs(e.clientY - orb.dragStartY) > 4) {
      orb.isDragging = true;
    }
    orb.theta -= dx * 0.006;
    orb.phi   -= dy * 0.004;
    orb.phi    = Math.max(0.12, Math.min(Math.PI / 2.05, orb.phi));
    orb.lmx = e.clientX; orb.lmy = e.clientY;
  });
  canvas.addEventListener('wheel', function (e) {
    orb.r = Math.max(8, Math.min(85, orb.r + e.deltaY * 0.04));
    e.preventDefault();
  }, { passive: false });

  function updateOrbit() {
    orb.ltheta += (orb.theta - orb.ltheta) * 0.09;
    orb.lphi   += (orb.phi   - orb.lphi  ) * 0.09;
    orb.lr     += (orb.r     - orb.lr    ) * 0.09;
    orb.ltx    += (orb.tx    - orb.ltx   ) * 0.07;
    orb.lty    += (orb.ty    - orb.lty   ) * 0.07;
    orb.ltz    += (orb.tz    - orb.ltz   ) * 0.07;
    camera.position.set(
      orb.ltx + orb.lr * Math.sin(orb.lphi) * Math.sin(orb.ltheta),
      orb.lty + orb.lr * Math.cos(orb.lphi),
      orb.ltz + orb.lr * Math.sin(orb.lphi) * Math.cos(orb.ltheta)
    );
    camera.lookAt(orb.ltx, orb.lty, orb.ltz);
  }

  /* ═══════════════════════════════════════════════════════════
     3.  LIGHTS
  ═══════════════════════════════════════════════════════════ */
  scene.add(new T.AmbientLight(0x112244, 1.4));

  var sun = new T.DirectionalLight(0x88ccff, 1.8);
  sun.position.set(30, 55, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.width  = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near    = 1;
  sun.shadow.camera.far     = 220;
  sun.shadow.camera.left    = -70;
  sun.shadow.camera.right   =  70;
  sun.shadow.camera.top     =  70;
  sun.shadow.camera.bottom  = -70;
  scene.add(sun);

  var atmoLights = [
    [0x00ffff,  0, 10,   0,  45],
    [0xff00ff, -30,  8, -18, 38],
    [0x00ff88,  30,  8,  18, 38]
  ];
  atmoLights.forEach(function (l) {
    var pl = new T.PointLight(l[0], 1.4, l[4]);
    pl.position.set(l[1], l[2], l[3]);
    scene.add(pl);
  });

  /* ═══════════════════════════════════════════════════════════
     4.  GEOMETRY HELPERS
  ═══════════════════════════════════════════════════════════ */
  function toonMat(col) {
    return new T.MeshToonMaterial({ color: col });
  }
  function emissiveMat(col, intensity) {
    return new T.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: intensity !== undefined ? intensity : 0.35,
      roughness: 0.75,
      metalness: 0.1
    });
  }

  /* Lists for animation loop */
  var floaters  = [];   /* { mesh, baseY, speed, amp, phase } */
  var spinnerList = []; /* { mesh, axis, speed } */
  var streamList  = []; /* { particle, from, to, t, speed } */
  var clickables  = []; /* meshes responding to raycaster */

  /* ── Floor ── */
  var floorMesh = new T.Mesh(
    new T.PlaneGeometry(200, 200),
    new T.MeshStandardMaterial({ color: 0x020c1e, roughness: 1, metalness: 0 })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  var grid = new T.GridHelper(200, 42, 0x00ffff, 0x002244);
  grid.material.opacity     = 0.32;
  grid.material.transparent = true;
  grid.position.y           = 0.01;
  scene.add(grid);

  /* ── Island ── */
  function makeIsland(x, z, radius, color) {
    var mesh = new T.Mesh(
      new T.CylinderGeometry(radius, radius * 1.35, 1.3, 7),
      toonMat(color || 0x061830)
    );
    mesh.position.set(x, -0.35, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    var ring = new T.Mesh(
      new T.TorusGeometry(radius * 1.02, 0.07, 8, 48),
      emissiveMat(0x00ffff, 0.9)
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.3, z);
    scene.add(ring);
  }

  /* ── Tower ── */
  function makeTower(x, z, height, color, infoData) {
    var h = height;
    var mesh = new T.Mesh(
      new T.BoxGeometry(1.5, h, 1.5),
      emissiveMat(color, 0.38)
    );
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.userData.info = infoData;
    mesh.userData.baseEI = 0.38;
    scene.add(mesh);
    clickables.push(mesh);
    floaters.push({ mesh: mesh, baseY: h / 2, speed: 0.55 + Math.random() * 0.4, amp: 0.14, phase: Math.random() * Math.PI * 2 });

    var cap = new T.Mesh(
      new T.BoxGeometry(1.9, 0.22, 1.9),
      emissiveMat(color, 0.9)
    );
    cap.position.set(x, h + 0.11, z);
    scene.add(cap);

    var halo = new T.Mesh(
      new T.TorusGeometry(1.15, 0.055, 6, 32),
      emissiveMat(color, 1.4)
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.set(x, h * 0.5, z);
    spinnerList.push({ mesh: halo, axis: 'y', speed: 0.013 });
    scene.add(halo);

    return mesh;
  }

  /* ── Portal ring ── */
  function makePortal(x, y, z, col, ri, ro) {
    var mesh = new T.Mesh(
      new T.TorusGeometry(ri || 2.5, ro || 0.18, 12, 60),
      emissiveMat(col, 1.6)
    );
    mesh.position.set(x, y, z);
    spinnerList.push({ mesh: mesh, axis: 'y', speed: 0.007 });
    scene.add(mesh);

    var disc = new T.Mesh(
      new T.CircleGeometry(ri || 2.5, 32),
      new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.06, side: T.DoubleSide })
    );
    disc.position.set(x, y, z);
    scene.add(disc);
  }

  /* ── Data stream ── */
  function makeStream(fx, fy, fz, tx2, ty2, tz2, col) {
    var from = new T.Vector3(fx, fy, fz);
    var to   = new T.Vector3(tx2, ty2, tz2);

    /* Tube */
    var dir = new T.Vector3().subVectors(to, from);
    var len = dir.length();
    var tube = new T.Mesh(
      new T.CylinderGeometry(0.04, 0.04, len, 5),
      emissiveMat(col, 0.6)
    );
    tube.position.copy(from).addScaledVector(dir.normalize(), len / 2);
    tube.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    scene.add(tube);

    /* Moving particle */
    var p = new T.Mesh(
      new T.SphereGeometry(0.13, 6, 6),
      emissiveMat(col, 3.0)
    );
    scene.add(p);
    streamList.push({ particle: p, from: from.clone(), to: to.clone(), t: Math.random(), speed: 0.004 + Math.random() * 0.006 });
  }

  /* ── Orb ── */
  function makeOrb(x, y, z, col, infoData) {
    var mesh = new T.Mesh(
      new T.SphereGeometry(0.65, 12, 12),
      emissiveMat(col, 0.6)
    );
    mesh.position.set(x, y, z);
    mesh.userData.info = infoData;
    mesh.userData.baseEI = 0.6;
    scene.add(mesh);
    clickables.push(mesh);
    floaters.push({ mesh: mesh, baseY: y, speed: 0.6 + Math.random() * 0.4, amp: 0.22, phase: Math.random() * Math.PI * 2 });
    return mesh;
  }

  /* ── Gem (octahedron) ── */
  function makeGem(x, y, z, col, infoData) {
    var mesh = new T.Mesh(
      new T.OctahedronGeometry(0.9, 0),
      emissiveMat(col, 0.65)
    );
    mesh.position.set(x, y, z);
    mesh.userData.info = infoData;
    mesh.userData.baseEI = 0.65;
    scene.add(mesh);
    clickables.push(mesh);
    floaters.push({ mesh: mesh, baseY: y, speed: 0.7 + Math.random() * 0.4, amp: 0.28, phase: Math.random() * Math.PI * 2 });
    spinnerList.push({ mesh: mesh, axis: 'y', speed: 0.016 + Math.random() * 0.006 });
    return mesh;
  }

  /* ── Ambient particles ── */
  (function () {
    var N   = 1800;
    var pos = new Float32Array(N * 3);
    var col = new Float32Array(N * 3);
    var palette = [[0,1,1],[1,0,1],[0,1,.53]];
    for (var i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - .5) * 160;
      pos[i*3+1] = Math.random() * 28;
      pos[i*3+2] = (Math.random() - .5) * 160;
      var c = palette[Math.floor(Math.random() * 3)];
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('color',    new T.BufferAttribute(col, 3));
    scene.add(new T.Points(g, new T.PointsMaterial({
      size: 0.17, vertexColors: true, transparent: true,
      opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false
    })));
  }());

  /* ═══════════════════════════════════════════════════════════
     5.  AIDA ROBOT CHARACTER  (procedural geometry, no files)
  ═══════════════════════════════════════════════════════════ */
  var AIDA = (function buildAIDA() {
    var g = new T.Group();

    /* Body */
    var body = new T.Mesh(
      new T.BoxGeometry(1.25, 1.5, 0.85),
      emissiveMat(0x0a2a5a, 0.28)
    );
    body.castShadow = true;
    g.add(body);

    /* Chest screen */
    var screen = new T.Mesh(
      new T.BoxGeometry(0.72, 0.52, 0.06),
      emissiveMat(0x001133, 1.3)
    );
    screen.position.set(0, 0.12, 0.45);
    g.add(screen);

    /* Head */
    var head = new T.Mesh(
      new T.BoxGeometry(0.95, 0.88, 0.82),
      emissiveMat(0x0d2b55, 0.26)
    );
    head.position.set(0, 1.18, 0);
    head.castShadow = true;
    g.add(head);

    /* Eyes */
    var eyePositions = [[-0.22, 1.24, 0.43], [0.22, 1.24, 0.43]];
    eyePositions.forEach(function (ep) {
      var eye = new T.Mesh(
        new T.SphereGeometry(0.11, 8, 8),
        new T.MeshBasicMaterial({ color: 0x00ffff })
      );
      eye.position.set(ep[0], ep[1], ep[2]);
      g.add(eye);
      var eLight = new T.PointLight(0x00ffff, 0.9, 2.8);
      eLight.position.set(ep[0], ep[1], ep[2]);
      g.add(eLight);
    });

    /* Antenna */
    var ant = new T.Mesh(
      new T.CylinderGeometry(0.04, 0.04, 0.62, 6),
      emissiveMat(0x00ffff, 1.1)
    );
    ant.position.set(0, 1.93, 0);
    g.add(ant);

    var antBall = new T.Mesh(
      new T.SphereGeometry(0.13, 8, 8),
      new T.MeshBasicMaterial({ color: 0x00ffff })
    );
    antBall.position.set(0, 2.27, 0);
    g.add(antBall);

    var antLight = new T.PointLight(0x00ffff, 1.8, 4.5);
    antLight.position.set(0, 2.26, 0);
    g.add(antLight);

    /* Arms */
    [[-0.74, 0.18, 0], [0.74, 0.18, 0]].forEach(function (ap, ai) {
      var arm = new T.Mesh(
        new T.CylinderGeometry(0.15, 0.12, 0.92, 6),
        emissiveMat(0x0a2a5a, 0.2)
      );
      arm.position.set(ap[0], ap[1], ap[2]);
      arm.rotation.z = (ai === 0 ? 1 : -1) * 0.28;
      arm.castShadow = true;
      g.add(arm);
    });

    /* Legs */
    [[-0.3, -0.94, 0], [0.3, -0.94, 0]].forEach(function (lp) {
      var leg = new T.Mesh(
        new T.CylinderGeometry(0.18, 0.14, 0.88, 6),
        emissiveMat(0x061428, 0.15)
      );
      leg.position.set(lp[0], lp[1], lp[2]);
      leg.castShadow = true;
      g.add(leg);
    });

    g.scale.setScalar(0.72);
    g.position.set(0, 1.5, 9);
    scene.add(g);

    return {
      group:    g,
      head:     head,
      screen:   screen,
      antLight: antLight,
      targetPos: new T.Vector3(0, 1.5, 9)
    };
  }());

  /* ═══════════════════════════════════════════════════════════
     6.  BUILD THE 3D WORLD  (7 zones)
  ═══════════════════════════════════════════════════════════ */

  /* ── ZONE 0: HOME ── */
  makeIsland(0, 0, 7, 0x061830);
  makePortal(0, 5.5, 0, 0x00ffff, 3.2, 0.22);
  makePortal(0, 5.5, 0, 0xff00ff, 4.8, 0.12);

  /* Hero orb */
  makeOrb(0, 7.5, 0, 0x00ffff, {
    type: 'home',
    title: PD.name,
    lines: [PD.title, PD.tagline],
    stats: PD.stats,
    speech: 'Welcome! I am Ujas Dubal, AWS Data Engineer and Technical Lead with 8.5 years of experience turning billions of records into real time insights.'
  });

  /* Stats orbs */
  PD.stats.forEach(function (s, i) {
    var a = (i / PD.stats.length) * Math.PI * 2;
    makeOrb(
      Math.cos(a) * 5.5, 2.8 + Math.sin(i) * 0.4, Math.sin(a) * 5.5,
      0x00ffff,
      { type: 'stat', v: s.v, l: s.l, speech: s.v + ' ' + s.l }
    );
  });

  /* Streams from home to other zones */
  makeStream(0,2,0,   -26,2,-10, 0x00ff88);
  makeStream(0,2,0,    26,2,-10, 0xff00ff);
  makeStream(0,2,-10,   0,2,-30, 0xffaa00);
  makeStream(0,2,-30, -26,2,-30, 0x00aaff);
  makeStream(0,2,-30,  26,2,-30, 0xff6600);
  makeStream(0,2,-30,   0,2,-50, 0xff0088);

  /* ── ZONE 1: ABOUT ── */
  makeIsland(-26, -10, 5.5, 0x0a1f0a);
  makeTower(-26, -10, 4.5, 0x00ff88, {
    type: 'about',
    title: '👤 About Ujas',
    lines: [PD.title, PD.location],
    points: [
      '8.5+ years IT · 5+ years Data Engineering',
      'Technical Lead · 1.5+ years leadership',
      'M.Sc IT – GLS University 2019',
      'B.E. Electronics – GTU 2015',
      'TCS On-the-Spot Award 2023 · CoA 2024'
    ],
    speech: 'I am Ujas Dubal, AWS Data Engineer from Ahmedabad India. I architect cloud native data platforms that handle billions of records on AWS.'
  });

  /* ── ZONE 2: SKILLS ── */
  makeIsland(26, -10, 6.5, 0x1a0a2a);
  PD.skills.forEach(function (sk, i) {
    var a = (i / PD.skills.length) * Math.PI * 2;
    var r = 3.4 + (i % 2) * 1.2;
    makeTower(
      26 + Math.cos(a) * r, -10,
      1.4 + sk.pct / 28,
      sk.col,
      {
        type: 'skill',
        title: '⚡ ' + sk.name,
        pct: sk.pct,
        speech: sk.name + ' — ' + sk.pct + ' percent proficiency. ' + (sk.pct >= 90 ? 'Expert level.' : 'Advanced level.')
      }
    );
  });

  /* ── ZONE 3: EXPERIENCE ── */
  makeIsland(0, -30, 8.5, 0x1a0f00);
  PD.experience.forEach(function (e, i) {
    var x = (i - 1.5) * 5.5;
    makeTower(x, -30, 3 + i * 1.3, e.col, {
      type: 'exp',
      title: '🚀 ' + e.role,
      lines: [e.company, e.period],
      points: e.points,
      speech: e.speech
    });
  });

  /* ── ZONE 4: CERTIFICATIONS ── */
  makeIsland(-26, -30, 5.5, 0x000a22);
  PD.certifications.forEach(function (c, i) {
    var a = (i / PD.certifications.length) * Math.PI * 2;
    makeGem(
      -26 + Math.cos(a) * 3.2, 2.8, -30 + Math.sin(a) * 3.2,
      c.col,
      { type: 'cert', title: '🏅 ' + c.title, lines: [c.issuer], speech: c.speech }
    );
  });

  /* ── ZONE 5: PROJECTS ── */
  makeIsland(26, -30, 6, 0x1a0500);
  PD.projects.forEach(function (p, i) {
    var a = (i / PD.projects.length) * Math.PI * 2;
    makeTower(
      26 + Math.cos(a) * 3.8, -30,
      4.2 + i * 0.9,
      p.col,
      { type: 'project', title: '🛠 ' + p.title, lines: [p.client, p.desc], tags: p.tags, speech: p.speech }
    );
  });

  /* ── ZONE 6: CONTACT ── */
  makeIsland(0, -50, 5.5, 0x1a0020);
  makePortal(0, 5.5, -50, 0xff0088, 3.5, 0.24);
  makeTower(0, -50, 5.5, 0xff0088, {
    type: 'contact',
    title: '📬 Contact Ujas',
    speech: "Let's connect! Ujas is open to Data Engineering and Technical Lead roles. Click to send a message."
  });

  /* ═══════════════════════════════════════════════════════════
     7.  ZONE CAMERA + AIDA POSITIONS
  ═══════════════════════════════════════════════════════════ */
  var zoneData = [
    { cx: 0,   cy: 20, cz: 42,  lx: 0,   ly: 0,  lz: 0,   ax: 0,   az: 9,   label: '🏠 Home · Launch Pad' },
    { cx: -37, cy: 15, cz: -2,  lx: -26, ly: 2,  lz: -10, ax: -22, az: -8,  label: '👤 About · Personal Core' },
    { cx:  40, cy: 15, cz: -2,  lx:  26, ly: 2,  lz: -10, ax:  22, az: -8,  label: '⚡ Skills · Tech Arsenal' },
    { cx:  0,  cy: 20, cz: -18, lx:  0,  ly: 2,  lz: -30, ax:  0,  az: -26, label: '🚀 Experience · Career' },
    { cx: -36, cy: 15, cz: -22, lx: -26, ly: 2,  lz: -30, ax: -22, az: -28, label: '🏅 Certs · Badges' },
    { cx:  36, cy: 15, cz: -22, lx:  26, ly: 2,  lz: -30, ax:  22, az: -28, label: '🛠 Projects · Data City' },
    { cx:  0,  cy: 18, cz: -42, lx:  0,  ly: 2,  lz: -50, ax:  0,  az: -46, label: '📬 Contact · Warp Gate' }
  ];

  var zoneSpeeches = [
    "Welcome to Ujas's Data World! I'm AIDA, your AI Data guide. Click any glowing object to learn about Ujas. Press 1 to 7 to jump between zones!",
    "This is the About zone. Ujas is an AWS Data Engineer with 8.5 years of experience. Click the glowing tower to learn more!",
    "Welcome to the Skills arena! Each tower represents a technology. Taller tower means higher proficiency. Click any tower!",
    "This is the Experience zone! Four towers, four companies. Click each one to hear Ujas's career story.",
    "Certifications zone! These spinning gems are Ujas's certifications. Click each one to hear about it!",
    "Projects zone! Three data engineering projects built by Ujas. Click each tower for details.",
    "Contact zone! This is the warp gate to Ujas. Click the tower to open the contact form and send a message directly!"
  ];

  var currentZone = -1;

  function setZone(idx) {
    if (idx === currentZone) return;
    idx = Math.max(0, Math.min(6, idx));
    currentZone = idx;

    var zd = zoneData[idx];
    orb.tx = zd.lx; orb.ty = zd.ly; orb.tz = zd.lz;

    /* Compute spherical coords from camera position relative to target */
    var dx = zd.cx - zd.lx, dy = zd.cy - zd.ly, dz = zd.cz - zd.lz;
    orb.r     = Math.sqrt(dx*dx + dy*dy + dz*dz);
    orb.phi   = Math.acos(Math.max(-1, Math.min(1, dy / orb.r)));
    orb.theta = Math.atan2(dx, dz);

    /* Move AIDA */
    AIDA.targetPos.set(zd.ax, 1.5, zd.az);

    /* Zone label */
    var zlEl = el('zone-lbl');
    if (zlEl) {
      zlEl.textContent = zd.label;
      zlEl.style.opacity = '1';
      setTimeout(function () { zlEl.style.opacity = '0'; }, 3000);
    }

    /* Nav highlight */
    qsa('.znav').forEach(function (b, i) {
      b.classList.toggle('active', i === idx);
    });

    /* AIDA speaks */
    aidaSay(zoneSpeeches[idx]);
  }

  /* ═══════════════════════════════════════════════════════════
     8.  WEB SPEECH API (TTS)
  ═══════════════════════════════════════════════════════════ */
  var synth    = window.speechSynthesis || null;
  var selVoice = null;
  var speaking = false;

  function loadVoice() {
    if (!synth) return;
    var voices = synth.getVoices();
    if (!voices.length) return;
    selVoice =
      voices.find(function (v) { return v.name.indexOf('Google US English') !== -1; }) ||
      voices.find(function (v) { return v.lang === 'en-US' && !v.localService; }) ||
      voices.find(function (v) { return v.lang && v.lang.indexOf('en') === 0; }) ||
      voices[0] || null;
  }
  loadVoice();
  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoice;
  }

  function aidaSay(text) {
    if (!text) return;

    /* Update HUD bubble via typewriter */
    var msgEl = el('aida-msg');
    if (msgEl) {
      msgEl.textContent = '';
      var i = 0;
      (function typeIt() {
        if (i < text.length) {
          msgEl.textContent += text[i++];
          setTimeout(typeIt, 18);
        }
      }());
    }

    if (!synth) return;
    synth.cancel();
    loadVoice();

    var utt     = new SpeechSynthesisUtterance(text);
    utt.lang    = 'en-US';
    utt.rate    = 0.88;
    utt.pitch   = 1.08;
    utt.volume  = 1;
    if (selVoice) utt.voice = selVoice;

    var mouth = el('aida-mouth');
    utt.onstart = function () {
      speaking = true;
      if (mouth) mouth.classList.add('talking');
    };
    utt.onend = function () {
      speaking = false;
      if (mouth) mouth.classList.remove('talking');
    };
    utt.onerror = function () {
      speaking = false;
      if (mouth) mouth.classList.remove('talking');
    };
    synth.speak(utt);
  }

  var repeatBtn = el('btn-repeat');
  var skipBtn   = el('btn-skip');
  var aidaMsgEl = el('aida-msg');
  if (repeatBtn) repeatBtn.addEventListener('click', function () {
    if (aidaMsgEl) aidaSay(aidaMsgEl.textContent);
  });
  if (skipBtn) skipBtn.addEventListener('click', function () {
    if (synth) synth.cancel();
    speaking = false;
    var mouth = el('aida-mouth');
    if (mouth) mouth.classList.remove('talking');
  });

  /* ═══════════════════════════════════════════════════════════
     9.  WEB AUDIO — generative ambient music
         Starts only after user gesture (fixes autoplay policy)
  ═══════════════════════════════════════════════════════════ */
  var audioCtx   = null;
  var musicActive = false;
  var masterGain  = null;
  var musicOscList = [];

  function buildReverb(ctx) {
    var conv  = ctx.createConvolver();
    var len   = ctx.sampleRate * 2.8;
    var buf   = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.1);
      }
    }
    conv.buffer = buf;
    return conv;
  }

  function startMusic() {
    if (musicActive) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      return;
    }

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.065, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    var reverb = buildReverb(audioCtx);
    reverb.connect(masterGain);

    var delay = audioCtx.createDelay(1.5);
    delay.delayTime.setValueAtTime(0.4, audioCtx.currentTime);
    var dfb = audioCtx.createGain();
    dfb.gain.setValueAtTime(0.28, audioCtx.currentTime);
    delay.connect(dfb);
    dfb.connect(delay);
    delay.connect(masterGain);

    var freqs = [65.41, 98.0, 130.81, 164.81, 196.0, 261.63, 329.63, 392.0];
    var types = ['sine','triangle','sine','triangle','sine','triangle','sine','sine'];

    freqs.forEach(function (freq, i) {
      var osc = audioCtx.createOscillator();
      var gn  = audioCtx.createGain();
      osc.type = types[i];
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 7, audioCtx.currentTime);

      var lfo  = audioCtx.createOscillator();
      var lfog = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.07 + i * 0.022, audioCtx.currentTime);
      lfog.gain.setValueAtTime(0.028, audioCtx.currentTime);
      lfo.connect(lfog);
      lfog.connect(gn.gain);
      lfo.start();

      gn.gain.setValueAtTime(0.042 + Math.random() * 0.032, audioCtx.currentTime);
      osc.connect(gn);
      gn.connect(reverb);
      gn.connect(delay);
      osc.start();

      musicOscList.push(osc, lfo);
    });

    musicActive = true;
    var bm = el('btn-music');
    if (bm) { bm.textContent = '🔊 Music'; bm.classList.add('on'); }
  }

  function stopMusic() {
    if (!musicActive) return;
    if (masterGain) {
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    }
    musicOscList.forEach(function (n) { try { n.stop(); } catch (e) {} });
    musicOscList = [];
    masterGain   = null;
    musicActive  = false;
    var bm = el('btn-music');
    if (bm) { bm.textContent = '🎵 Music'; bm.classList.remove('on'); }
  }

  var musicBtn = el('btn-music');
  if (musicBtn) {
    musicBtn.addEventListener('click', function () {
      if (musicActive) stopMusic(); else startMusic();
    });
  }

  /* ═══════════════════════════════════════════════════════════
     10. AI NEWS (free RSS-to-JSON, no API key needed)
  ═══════════════════════════════════════════════════════════ */
  var newsBtn = el('btn-news');
  if (newsBtn) {
    newsBtn.addEventListener('click', function () {
      aidaSay("Fetching the latest tech and AI news for you. One moment...");
      var rssUrl = 'https://feeds.feedburner.com/TechCrunch';
      var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl) + '&count=5';
      fetch(apiUrl)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.items && data.items.length) {
            var items = data.items.slice(0, 5);
            var titles = items.slice(0, 3).map(function (it, i) {
              return (i + 1) + '. ' + it.title;
            }).join('. ');
            aidaSay('Today\'s top tech headlines: ' + titles);
            showPanel({
              type: 'news',
              title: '📰 Latest Tech News',
              points: items.map(function (it) { return it.title; })
            });
          } else {
            aidaSay("Couldn't load live news right now. Here's what's trending in data engineering.");
            showNewsPlaceholder();
          }
        })
        .catch(function () {
          showNewsPlaceholder();
          aidaSay("No live news available, but here are highlights from the data world.");
        });
    });
  }

  function showNewsPlaceholder() {
    showPanel({
      type: 'news',
      title: '📰 Data Engineering Headlines',
      points: [
        'AWS Redshift Serverless continues to reduce cost per query.',
        'PySpark 4.0 brings major performance improvements.',
        'Apache Airflow 3.0 released with improved DAG authoring.',
        'Databricks Unity Catalog now GA across all cloud providers.',
        'GitHub Copilot gains data engineering workflow support.'
      ]
    });
  }

  /* ═══════════════════════════════════════════════════════════
     11. INFO PANEL BUILDER
  ═══════════════════════════════════════════════════════════ */
  function showPanel(info) {
    var body = el('info-body');
    if (!body) return;
    var html = '';

    if (info.type === 'home') {
      html = '<h2>' + info.title + '</h2>';
      info.lines.forEach(function (l) { html += '<p>' + l + '</p>'; });
      html += '<div class="stat-grid">';
      info.stats.forEach(function (s) {
        html += '<div class="stat-chip"><span class="sv">' + s.v + '</span><span class="sl">' + s.l + '</span></div>';
      });
      html += '</div>';

    } else if (info.type === 'stat') {
      html = '<h2>' + info.l + '</h2><p style="font-size:36px;font-weight:900;color:#00ffff">' + info.v + '</p>';

    } else if (info.type === 'about') {
      html = '<h2>' + info.title + '</h2>';
      info.lines.forEach(function (l) { html += '<p>' + l + '</p>'; });
      if (info.points) {
        html += '<ul>';
        info.points.forEach(function (p) { html += '<li>' + p + '</li>'; });
        html += '</ul>';
      }

    } else if (info.type === 'skill') {
      html = '<h2>' + info.title + '</h2>' +
        '<p>Proficiency: <strong style="color:#00ffff;font-size:18px">' + info.pct + '%</strong></p>' +
        '<div class="bar-wrap"><div class="bar-fill" id="bfill" style="width:0%"></div></div>';
      setTimeout(function () {
        var bf = el('bfill');
        if (bf) bf.style.width = info.pct + '%';
      }, 80);

    } else if (info.type === 'exp') {
      html = '<h2>' + info.title + '</h2>';
      info.lines.forEach(function (l) { html += '<p style="color:#00ffff">' + l + '</p>'; });
      html += '<ul>';
      info.points.forEach(function (p) { html += '<li>' + p + '</li>'; });
      html += '</ul>';

    } else if (info.type === 'cert') {
      html = '<h2>' + info.title + '</h2>';
      info.lines.forEach(function (l) { html += '<p>' + l + '</p>'; });

    } else if (info.type === 'project') {
      html = '<h2>' + info.title + '</h2>';
      info.lines.forEach(function (l) { html += '<p>' + l + '</p>'; });
      if (info.tags) {
        html += '<div class="tag-row">';
        info.tags.forEach(function (t) { html += '<span class="tag">' + t + '</span>'; });
        html += '</div>';
      }

    } else if (info.type === 'contact') {
      html = '<h2>' + info.title + '</h2><p>Use the form to send a direct message to Ujas\'s email.</p>';

    } else if (info.type === 'news') {
      html = '<h2>' + info.title + '</h2><ul>';
      info.points.forEach(function (p) { html += '<li>' + p + '</li>'; });
      html += '</ul>';
    }

    body.innerHTML = html;
    var panel = el('info-panel');
    if (panel) panel.classList.remove('hidden');
  }

  var infoClose = el('info-close');
  if (infoClose) {
    infoClose.addEventListener('click', function () {
      var panel = el('info-panel');
      if (panel) panel.classList.add('hidden');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     12. RAYCASTER — click 3D objects
  ═══════════════════════════════════════════════════════════ */
  var raycaster = new T.Raycaster();
  var mouse2    = new T.Vector2();

  canvas.addEventListener('click', function (e) {
    /* Skip if it was a drag gesture */
    if (orb.isDragging) return;

    mouse2.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse2.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse2, camera);
    var hits = raycaster.intersectObjects(clickables, false);
    if (!hits.length) return;

    var hit  = hits[0].object;
    var info = hit.userData.info;
    if (!info) return;

    /* Pulse emissive */
    if (hit.material && hit.material.emissiveIntensity !== undefined) {
      var orig = hit.userData.baseEI || 0.38;
      hit.material.emissiveIntensity = 4.0;
      setTimeout(function () {
        if (hit.material) hit.material.emissiveIntensity = orig;
      }, 380);
    }

    /* Contact zone opens modal */
    if (info.type === 'contact') {
      var cm = el('contact-modal');
      if (cm) cm.classList.remove('hidden');
      aidaSay(info.speech || "Let's connect! Fill the form to message Ujas.");
      return;
    }

    /* Show panel + speak */
    showPanel(info);
    if (info.speech) aidaSay(info.speech);
  });

  /* ═══════════════════════════════════════════════════════════
     13. CONTACT FORM
  ═══════════════════════════════════════════════════════════ */
  var contactClose = el('contact-close');
  if (contactClose) {
    contactClose.addEventListener('click', function () {
      var cm = el('contact-modal');
      if (cm) cm.classList.add('hidden');
    });
  }

  var gform = el('gform');
  if (gform) {
    gform.action = PD.formAction;
    var fName  = el('f-name');
    var fEmail = el('f-email');
    var fMsg   = el('f-msg');
    if (fName)  fName.name  = PD.formName;
    if (fEmail) fEmail.name = PD.formEmail;
    if (fMsg)   fMsg.name   = PD.formMsg;

    gform.addEventListener('submit', function () {
      setTimeout(function () {
        var ok = el('form-ok');
        if (ok) ok.textContent = '✅ Sent! Ujas will reply soon.';
        aidaSay("Message sent! Ujas will reply to you very soon. Thank you!");
        if (gform) gform.reset();
      }, 700);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     14. KEYBOARD + ZONE NAV BUTTONS
  ═══════════════════════════════════════════════════════════ */
  qsa('.znav').forEach(function (b) {
    b.addEventListener('click', function () {
      flyToZone(parseInt(b.getAttribute('data-zone'), 10));
    });
  });

  window.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    var k = e.key;
    if (k >= '1' && k <= '7')       flyToZone(parseInt(k, 10) - 1);
    else if (k === 'ArrowRight' || k === 'd') flyToZone(currentZone + 1);
    else if (k === 'ArrowLeft'  || k === 'a') flyToZone(currentZone - 1);
    else if (k === 'Escape') {
      var panel = el('info-panel');
      var cm    = el('contact-modal');
      if (panel) panel.classList.add('hidden');
      if (cm)    cm.classList.add('hidden');
    }
  });

  /* ═══════════════════════════════════════════════════════════
     15. START OVERLAY — first click starts audio (autoplay fix)
  ═══════════════════════════════════════════════════════════ */
  var startBtn = el('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      /* AudioContext must start inside user gesture */
      startMusic();
      var so = el('start-overlay');
      if (so) {
        so.classList.add('gone');
        setTimeout(function () { so.style.display = 'none'; }, 700);
      }
      flyToZone(0);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     16. MAIN RENDER LOOP
  ═══════════════════════════════════════════════════════════ */
  var clock  = new T.Clock();
  var tmpVec = new T.Vector3();

  (function loop() {
    requestAnimationFrame(loop);
    var t = clock.getElapsedTime();

    /* Floating objects */
    floaters.forEach(function (f) {
      f.mesh.position.y = f.baseY + Math.sin(t * f.speed + f.phase) * f.amp;
    });

    /* Spinners */
    spinnerList.forEach(function (s) {
      if (s.axis === 'y') s.mesh.rotation.y += s.speed;
      else if (s.axis === 'x') s.mesh.rotation.x += s.speed;
    });

    /* Data stream particles */
    streamList.forEach(function (ds) {
      ds.t += ds.speed;
      if (ds.t >= 1.0) ds.t -= 1.0;
      ds.particle.position.lerpVectors(ds.from, ds.to, ds.t);
      ds.particle.position.y += Math.sin(t * 2.2 + ds.t * 10) * 0.12;
    });

    /* AIDA movement + animations */
    AIDA.group.position.x += (AIDA.targetPos.x - AIDA.group.position.x) * 0.032;
    AIDA.group.position.z += (AIDA.targetPos.z - AIDA.group.position.z) * 0.032;
    AIDA.group.position.y  = AIDA.targetPos.y + Math.sin(t * 1.8) * 0.17;

    /* AIDA faces direction of motion */
    var adx = AIDA.targetPos.x - AIDA.group.position.x;
    var adz = AIDA.targetPos.z - AIDA.group.position.z;
    if (Math.abs(adx) + Math.abs(adz) > 0.05) {
      AIDA.group.rotation.y = Math.atan2(adx, adz);
    }

    /* AIDA head look-around */
    AIDA.head.rotation.y = Math.sin(t * 0.48) * 0.28;

    /* Antenna pulse */
    AIDA.antLight.intensity = 1.5 + Math.sin(t * 3.2) * 0.55;

    /* Chest screen pulses when speaking */
    AIDA.screen.material.emissiveIntensity = speaking
      ? 0.7 + Math.sin(t * 16) * 0.65
      : 0.28;

    /* Orbit camera update */
    updateOrbit();

    renderer.render(scene, camera);
  }());

}); /* end window.onload */
