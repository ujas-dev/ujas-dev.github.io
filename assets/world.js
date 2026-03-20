/* ================================================================
   world.js — Ujas Dubal 3D Tron Portfolio
   • Tron-style neon city built procedurally in Three.js
   • AIDA avatar with 2D canvas lip-sync
   • Real contact form via Google Apps Script (no CORS)
   • Live AI news via rss2json free API
   • Web Speech API with phoneme-approximated mouth animation
   ================================================================ */

window.addEventListener('load', function () {

  /* ── Guards ─────────────────────────────────────────────── */
  if (typeof THREE === 'undefined') {
    document.getElementById('speech-text').textContent =
      'ERROR: Three.js CDN failed. Check internet.';
    return;
  }
  if (typeof window.PD === 'undefined') {
    document.getElementById('speech-text').textContent =
      'ERROR: data.js failed to load.';
    return;
  }

  var PD = window.PD;
  var T  = THREE;

  function $$(s) { return document.getElementById(s); }
  function qs(s) { return document.querySelector(s); }
  function qsa(s){ return document.querySelectorAll(s); }

  /* ═══════════════════════════════════════════════════════════
     1.  RENDERER
  ═══════════════════════════════════════════════════════════ */
  var canvas   = $$('world');
  var W = window.innerWidth, H = window.innerHeight;

  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = T.PCFSoftShadowMap;

  var scene  = new T.Scene();
  scene.background = new T.Color(0x000511);
  scene.fog        = new T.FogExp2(0x000511, 0.018);

  var camera = new T.PerspectiveCamera(58, W / H, 0.1, 600);
  camera.position.set(0, 22, 46);
  camera.lookAt(0, 0, 0);

  window.addEventListener('resize', function () {
    W = window.innerWidth; H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  /* ═══════════════════════════════════════════════════════════
     2.  ORBIT (manual — no OrbitControls import)
  ═══════════════════════════════════════════════════════════ */
  var O = {
    theta: 0, phi: Math.PI / 3.1, r: 46,
    lt: 0, lp: Math.PI / 3.1, lr: 46,
    tx: 0, ty: 0, tz: 0,
    ltx: 0, lty: 0, ltz: 0,
    down: false, lmx: 0, lmy: 0,
    dragging: false, dsx: 0, dsy: 0
  };

  canvas.addEventListener('pointerdown', function (e) {
    O.down = true; O.lmx = e.clientX; O.lmy = e.clientY;
    O.dsx = e.clientX; O.dsy = e.clientY; O.dragging = false;
  });
  canvas.addEventListener('pointerup', function () { O.down = false; });
  canvas.addEventListener('pointermove', function (e) {
    if (!O.down) {
      /* Tooltip on hover */
      doHoverRay(e);
      return;
    }
    if (Math.abs(e.clientX - O.dsx) > 4 || Math.abs(e.clientY - O.dsy) > 4) O.dragging = true;
    O.theta -= (e.clientX - O.lmx) * 0.006;
    O.phi   -= (e.clientY - O.lmy) * 0.004;
    O.phi    = Math.max(0.1, Math.min(Math.PI / 2.05, O.phi));
    O.lmx = e.clientX; O.lmy = e.clientY;
  });
  canvas.addEventListener('wheel', function (e) {
    O.r = Math.max(8, Math.min(90, O.r + e.deltaY * 0.04));
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
     3.  LIGHTS
  ═══════════════════════════════════════════════════════════ */
  scene.add(new T.AmbientLight(0x001133, 2.5));

  /* Strong directional */
  var sun = new T.DirectionalLight(0x0066cc, 1.5);
  sun.position.set(25, 55, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near   = 1;
  sun.shadow.camera.far    = 250;
  sun.shadow.camera.left   = -80;
  sun.shadow.camera.right  =  80;
  sun.shadow.camera.top    =  80;
  sun.shadow.camera.bottom = -80;
  scene.add(sun);

  /* Neon point lights — Tron colours */
  [[0x00ffff,  0, 8,  0,  60],
   [0xff00aa, -35, 5,-15, 50],
   [0x0088ff,  35, 5, 15, 50],
   [0x00ff88,   0, 8,-40, 55]
  ].forEach(function (l) {
    var pl = new T.PointLight(l[0], 1.6, l[4]);
    pl.position.set(l[1], l[2], l[3]);
    scene.add(pl);
  });

  /* ═══════════════════════════════════════════════════════════
     4.  TRON WORLD GEOMETRY
  ═══════════════════════════════════════════════════════════ */
  var clickables = [];
  var floaters   = [];
  var spinList   = [];
  var streamList = [];

  /* ── Materials ── */
  function neonMat(col, ei) {
    return new T.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: ei !== undefined ? ei : 0.5,
      roughness: 0.3,
      metalness: 0.7
    });
  }
  function darkMat(col) {
    return new T.MeshStandardMaterial({
      color: col, roughness: 0.9, metalness: 0.1
    });
  }

  /* ── Tron floor + grid ── */
  var floor = new T.Mesh(
    new T.PlaneGeometry(280, 280),
    darkMat(0x000814)
  );
  floor.rotation.x  = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* Primary grid */
  var grid1 = new T.GridHelper(280, 56, 0x00ffff, 0x001a33);
  grid1.material.opacity     = 0.45;
  grid1.material.transparent = true;
  grid1.position.y = 0.01;
  scene.add(grid1);

  /* Secondary fine grid */
  var grid2 = new T.GridHelper(280, 280, 0x002244, 0x001133);
  grid2.material.opacity     = 0.25;
  grid2.material.transparent = true;
  grid2.position.y = 0.015;
  scene.add(grid2);

  /* ── TRON CITY BUILDINGS (background atmosphere) ── */
  (function buildCity() {
    var cols  = [0x00ffff, 0xff00aa, 0x0088ff, 0x00ff88, 0xffaa00];
    var count = 120;
    for (var i = 0; i < count; i++) {
      var h  = 3 + Math.random() * 22;
      var w  = 1.2 + Math.random() * 3;
      var bx = (Math.random() - .5) * 220;
      var bz = (Math.random() - .5) * 220;
      /* Skip the centre zones */
      if (Math.abs(bx) < 35 && Math.abs(bz) < 55) continue;

      var col = cols[Math.floor(Math.random() * cols.length)];
      var bld = new T.Mesh(
        new T.BoxGeometry(w, h, w),
        darkMat(0x000e1f)
      );
      bld.position.set(bx, h / 2, bz);
      bld.castShadow  = true;
      bld.receiveShadow = true;
      scene.add(bld);

      /* Neon edge lines on building */
      var edges = new T.Mesh(
        new T.BoxGeometry(w + .02, h + .02, w + .02),
        new T.MeshBasicMaterial({
          color: col, wireframe: true,
          transparent: true, opacity: 0.18
        })
      );
      edges.position.copy(bld.position);
      scene.add(edges);

      /* Top glow */
      var topGlow = new T.Mesh(
        new T.BoxGeometry(w + .1, 0.1, w + .1),
        neonMat(col, 1.5)
      );
      topGlow.position.set(bx, h + .05, bz);
      scene.add(topGlow);
    }
  }());

  /* ── Road lines (Tron grid roads) ── */
  (function buildRoads() {
    var roadCol = 0x00ffff;
    var roadMat = new T.MeshBasicMaterial({ color: roadCol, transparent: true, opacity: 0.2 });
    for (var i = -5; i <= 5; i++) {
      var roadH = new T.Mesh(new T.PlaneGeometry(280, 0.3), roadMat);
      roadH.rotation.x = -Math.PI / 2;
      roadH.position.set(0, 0.02, i * 12);
      scene.add(roadH);
      var roadV = new T.Mesh(new T.PlaneGeometry(0.3, 280), roadMat);
      roadV.rotation.x = -Math.PI / 2;
      roadV.position.set(i * 12, 0.02, 0);
      scene.add(roadV);
    }
  }());

  /* ── Zone platform builder ── */
  function makePlatform(x, z, rx, rz, col) {
    /* Main platform */
    var plat = new T.Mesh(
      new T.BoxGeometry(rx * 2, 0.4, rz * 2),
      darkMat(0x000e20)
    );
    plat.position.set(x, 0.2, z);
    plat.receiveShadow = true;
    scene.add(plat);

    /* Neon border */
    var border = new T.Mesh(
      new T.BoxGeometry(rx * 2 + .1, 0.5, rz * 2 + .1),
      new T.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.5 })
    );
    border.position.set(x, 0.2, z);
    scene.add(border);

    /* Corner pillars */
    var cxs = [-rx + 0.5, rx - 0.5];
    var czs = [-rz + 0.5, rz - 0.5];
    cxs.forEach(function (cx) {
      czs.forEach(function (cz) {
        var pill = new T.Mesh(
          new T.BoxGeometry(0.3, 3, 0.3),
          neonMat(col, 1.0)
        );
        pill.position.set(x + cx, 1.7, z + cz);
        scene.add(pill);
      });
    });
  }

  /* ── Section label plane (floating text proxy) ── */
  function makeLabel(x, y, z, col, infoData) {
    var mesh = new T.Mesh(
      new T.BoxGeometry(8.5, 1.2, 0.15),
      neonMat(col, 0.6)
    );
    mesh.position.set(x, y, z);
    mesh.userData.info     = infoData;
    mesh.userData.isLabel  = true;
    mesh.userData.baseEI   = 0.6;
    scene.add(mesh);
    clickables.push(mesh);
    floaters.push({ mesh: mesh, baseY: y, speed: 0.4, amp: 0.18, phase: Math.random() * Math.PI * 2 });
    return mesh;
  }

  /* ── Tower ── */
  function makeTower(x, z, height, col, infoData) {
    var h = height;
    /* Dark body */
    var body = new T.Mesh(
      new T.BoxGeometry(1.6, h, 1.6),
      darkMat(0x000e22)
    );
    body.position.set(x, h / 2, z);
    body.castShadow = true;
    scene.add(body);

    /* Neon wire edges */
    var wire = new T.Mesh(
      new T.BoxGeometry(1.62, h + .02, 1.62),
      new T.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.65 })
    );
    wire.position.copy(body.position);
    scene.add(wire);

    /* Glowing cap */
    var cap = new T.Mesh(
      new T.BoxGeometry(2.0, 0.25, 2.0),
      neonMat(col, 1.8)
    );
    cap.position.set(x, h + .12, z);
    scene.add(cap);

    /* Clickable proxy */
    var proxy = new T.Mesh(
      new T.BoxGeometry(2.2, h + 0.5, 2.2),
      new T.MeshBasicMaterial({ visible: false })
    );
    proxy.position.set(x, h / 2, z);
    proxy.userData.info   = infoData;
    proxy.userData.baseEI = 0.0;
    proxy.userData.capRef = cap;
    scene.add(proxy);
    clickables.push(proxy);
    floaters.push({ mesh: cap, baseY: h + .12, speed: 0.5 + Math.random() * .3, amp: 0.12, phase: Math.random() * Math.PI * 2 });

    /* Spin halo */
    var halo = new T.Mesh(
      new T.TorusGeometry(1.3, 0.055, 6, 36),
      neonMat(col, 1.5)
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.set(x, h * .55, z);
    spinList.push({ mesh: halo, speed: 0.014 });
    scene.add(halo);

    /* Point light glow at top */
    var glow = new T.PointLight(col, 1.0, 8);
    glow.position.set(x, h + 1, z);
    scene.add(glow);

    return proxy;
  }

  /* ── Gem (octahedron) ── */
  function makeGem(x, y, z, col, infoData) {
    var body = new T.Mesh(
      new T.OctahedronGeometry(0.85, 0),
      darkMat(0x000e22)
    );
    body.position.set(x, y, z);
    body.castShadow = true;
    scene.add(body);

    var wire = new T.Mesh(
      new T.OctahedronGeometry(0.87, 0),
      new T.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.8 })
    );
    wire.position.set(x, y, z);
    scene.add(wire);

    var light = new T.PointLight(col, 0.8, 5);
    light.position.set(x, y, z);
    scene.add(light);

    var proxy = new T.Mesh(
      new T.SphereGeometry(1.1, 8, 8),
      new T.MeshBasicMaterial({ visible: false })
    );
    proxy.position.set(x, y, z);
    proxy.userData.info   = infoData;
    proxy.userData.baseEI = 0;
    proxy.userData.wireRef = wire;
    scene.add(proxy);
    clickables.push(proxy);
    floaters.push({ mesh: body, baseY: y, speed: 0.7 + Math.random() * .3, amp: 0.25, phase: Math.random() * Math.PI * 2 });
    floaters.push({ mesh: wire, baseY: y, speed: 0.7 + Math.random() * .3, amp: 0.25, phase: Math.random() * Math.PI * 2 });
    spinList.push({ mesh: body, speed: 0.015 });
    spinList.push({ mesh: wire, speed: 0.015 });
    return proxy;
  }

  /* ── Data stream ── */
  function makeStream(x1, z1, x2, z2, col) {
    var from = new T.Vector3(x1, 0.06, z1);
    var to   = new T.Vector3(x2, 0.06, z2);
    var dir  = new T.Vector3().subVectors(to, from);
    var len  = dir.length();

    /* Glowing road line */
    var road = new T.Mesh(
      new T.BoxGeometry(0.25, 0.04, len),
      new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.38 })
    );
    road.position.copy(from).addScaledVector(dir.normalize(), len / 2);
    road.lookAt(to);
    scene.add(road);

    /* Moving particle */
    var pt = new T.Mesh(
      new T.SphereGeometry(0.15, 6, 6),
      neonMat(col, 3.0)
    );
    var light = new T.PointLight(col, 1.2, 5);
    scene.add(pt);
    scene.add(light);
    streamList.push({
      pt: pt, light: light,
      from: from.clone(), to: to.clone(),
      t: Math.random(), speed: 0.005 + Math.random() * 0.005
    });
  }

  /* ── Ambient particles ── */
  (function () {
    var N   = 2200;
    var pos = new Float32Array(N * 3);
    var col = new Float32Array(N * 3);
    var pal = [[0,1,1],[1,0,.67],[0,.53,1],[0,1,.53]];
    for (var i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - .5) * 200;
      pos[i*3+1] = Math.random() * 32;
      pos[i*3+2] = (Math.random() - .5) * 200;
      var c = pal[Math.floor(Math.random() * pal.length)];
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('color',    new T.BufferAttribute(col, 3));
    scene.add(new T.Points(g, new T.PointsMaterial({
      size: 0.14, vertexColors: true, transparent: true,
      opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false
    })));
  }());

  /* ═══════════════════════════════════════════════════════════
     5.  BUILD THE 7 ZONES
  ═══════════════════════════════════════════════════════════ */

  /* ── ZONE 0: HOME  (centre) ── */
  makePlatform(0, 0, 9, 9, 0x00ffff);
  makeLabel(0, 5.5, 0, 0x00ffff, {
    type: 'home', title: 'UJAS DUBAL',
    lines: [PD.title, PD.tagline],
    stats: PD.stats,
    speech: 'Welcome! I am Ujas Dubal, AWS Data Engineer and Technical Lead. I build real time data platforms handling billions of records on AWS.'
  });

  /* Portal rings */
  (function () {
    var ring1 = new T.Mesh(
      new T.TorusGeometry(4.5, 0.12, 10, 60),
      neonMat(0x00ffff, 1.8)
    );
    ring1.position.set(0, 4, 0);
    spinList.push({ mesh: ring1, speed: 0.008 });
    scene.add(ring1);
    var ring2 = new T.Mesh(
      new T.TorusGeometry(3.2, 0.09, 10, 60),
      neonMat(0xff00aa, 1.8)
    );
    ring2.position.set(0, 4, 0);
    ring2.rotation.x = Math.PI / 3;
    spinList.push({ mesh: ring2, speed: -0.011 });
    scene.add(ring2);
    var ring3 = new T.Mesh(
      new T.TorusGeometry(5.8, 0.07, 8, 60),
      neonMat(0x0088ff, 1.4)
    );
    ring3.position.set(0, 4, 0);
    ring3.rotation.z = Math.PI / 4;
    spinList.push({ mesh: ring3, speed: 0.006 });
    scene.add(ring3);
  }());

  /* Stats orbs at home */
  PD.stats.forEach(function (s, i) {
    var a = (i / PD.stats.length) * Math.PI * 2;
    var ox = Math.cos(a) * 6.5;
    var oz = Math.sin(a) * 6.5;
    var orb = new T.Mesh(
      new T.SphereGeometry(0.7, 12, 12),
      neonMat(0x00ffff, 0.7)
    );
    orb.position.set(ox, 2.5 + Math.sin(i) * 0.4, oz);
    orb.userData.info = { type:'stat', v:s.v, l:s.l, speech: s.v + ' — ' + s.l };
    orb.userData.baseEI = 0.7;
    scene.add(orb);
    clickables.push(orb);
    floaters.push({ mesh:orb, baseY: 2.5, speed:0.6+i*.1, amp:.2, phase: i * 1.3 });

    /* Connecting line to centre */
    var lineGeo = new T.BufferGeometry().setFromPoints([
      new T.Vector3(0, 2, 0),
      new T.Vector3(ox, 2.5, oz)
    ]);
    var line = new T.Line(lineGeo, new T.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2 }));
    scene.add(line);
  });

  /* ── ZONE 1: ABOUT  (-28, -12) ── */
  makePlatform(-28, -12, 7, 6, 0x00ff88);
  makeLabel(-28, 5, -12, 0x00ff88, {
    type: 'about', title: '◈ ABOUT UJAS',
    lines: [PD.title, PD.location],
    points: [
      '8.5+ years IT · 5+ years Data Engineering',
      'Technical Lead · 1.5+ years leadership',
      'M.Sc IT – GLS University 2019',
      'B.E. Electronics – GTU 2015',
      'TCS On-the-Spot Award 2023 · CoA 2024'
    ],
    speech: 'I am Ujas Dubal, AWS Data Engineer and Technical Lead from Ahmedabad, India. I have 8.5 years of IT experience with 5 years specialising in data engineering on AWS.'
  });
  makeStream(0, 0, -28, -12, 0x00ff88);

  /* ── ZONE 2: SKILLS  (28, -12) ── */
  makePlatform(28, -12, 8, 6, 0xff00aa);
  makeLabel(28, 5, -12, 0xff00aa, {
    type: 'skills_overview', title: '◉ SKILLS MATRIX',
    speech: 'Here is the skills matrix. Each tower height represents proficiency. Click any tower for details.'
  });
  PD.skills.forEach(function (sk, i) {
    var cols   = PD.skills.length;
    var perRow = 5;
    var row    = Math.floor(i / perRow);
    var col2   = i % perRow;
    var sx     = 28 - (perRow - 1) * 1.4 + col2 * 2.8;
    var sz     = -12 - row * 3.2;
    makeTower(sx, sz, 0.8 + sk.pct / 24, sk.col, {
      type: 'skill',
      title: sk.icon + ' ' + sk.name,
      pct: sk.pct,
      speech: sk.name + ', ' + sk.pct + ' percent proficiency. ' + (sk.pct >= 90 ? 'Expert level.' : 'Advanced level.')
    });
  });
  makeStream(0, 0, 28, -12, 0xff00aa);

  /* ── ZONE 3: EXPERIENCE  (0, -32) ── */
  makePlatform(0, -32, 14, 7, 0xffaa00);
  makeLabel(0, 5.5, -32, 0xffaa00, {
    type: 'exp_overview', title: '▲ CAREER TIMELINE',
    speech: 'Career timeline zone. Four companies, 8.5 years. Click each tower to explore.'
  });
  PD.experience.forEach(function (e, i) {
    var ex = (i - 1.5) * 6.2;
    makeTower(ex, -32, 2.5 + i * 1.4, e.col, {
      type: 'exp',
      title: '▲ ' + e.company,
      company: e.company, role: e.role, period: e.period,
      location: e.location, logo: e.logo,
      logoFallback: e.logoFallback,
      points: e.points, speech: e.speech
    });
  });
  makeStream(0, -12, 0, -32, 0xffaa00);

  /* ── ZONE 4: CERTIFICATIONS  (-28, -32) ── */
  makePlatform(-28, -32, 7, 6, 0x0088ff);
  makeLabel(-28, 5, -32, 0x0088ff, {
    type: 'cert_overview', title: '◆ CERTIFICATIONS',
    speech: 'Certifications zone. Click each gem to hear about the certification.'
  });
  PD.certifications.forEach(function (c, i) {
    var a = (i / PD.certifications.length) * Math.PI * 2;
    makeGem(-28 + Math.cos(a) * 3.5, 3.0, -32 + Math.sin(a) * 3.5, c.col, {
      type: 'cert',
      title: '◆ ' + c.title,
      lines: [c.issuer, c.year],
      speech: c.speech
    });
  });
  makeStream(-28, -12, -28, -32, 0x0088ff);

  /* ── ZONE 5: PROJECTS  (28, -32) ── */
  makePlatform(28, -32, 7, 6, 0xff6600);
  makeLabel(28, 5, -32, 0xff6600, {
    type: 'proj_overview', title: '⬟ PROJECTS',
    speech: 'Projects zone. Three major data engineering projects. Click each tower.'
  });
  PD.projects.forEach(function (p, i) {
    var a = (i / PD.projects.length) * Math.PI * 2;
    makeTower(28 + Math.cos(a) * 3.8, -32 + Math.sin(a) * 3.8, 4.5 + i * 1.2, p.col, {
      type: 'project',
      title: '⬟ ' + p.title,
      lines: [p.client, p.desc], tags: p.tags, speech: p.speech
    });
  });
  makeStream(28, -12, 28, -32, 0xff6600);

  /* ── ZONE 6: CONTACT  (0, -52) ── */
  makePlatform(0, -52, 7, 7, 0xff00aa);
  makeLabel(0, 5, -52, 0xff00aa, {
    type: 'contact', title: '⟡ CONTACT',
    speech: "Let's connect! Ujas is open to Data Engineering and Technical Lead roles. Click the portal to transmit a message directly."
  });
  /* Warp portal */
  var warpRing = new T.Mesh(
    new T.TorusGeometry(3.8, 0.22, 12, 64),
    neonMat(0xff00aa, 2.0)
  );
  warpRing.position.set(0, 4, -52);
  spinList.push({ mesh: warpRing, speed: 0.018 });
  scene.add(warpRing);
  var warpDisc = new T.Mesh(
    new T.CircleGeometry(3.8, 48),
    new T.MeshBasicMaterial({ color: 0xff00aa, transparent: true, opacity: 0.07, side: T.DoubleSide })
  );
  warpDisc.position.set(0, 4, -52);
  scene.add(warpDisc);
  /* Clickable proxy for portal */
  var contactProxy = new T.Mesh(
    new T.CylinderGeometry(4, 4, 8, 16),
    new T.MeshBasicMaterial({ visible: false })
  );
  contactProxy.position.set(0, 4, -52);
  contactProxy.userData.info = {
    type: 'contact', title: '⟡ CONTACT',
    speech: "Transmit a message directly to Ujas."
  };
  scene.add(contactProxy);
  clickables.push(contactProxy);
  makeStream(0, -32, 0, -52, 0xff00aa);

  /* ── Zone-to-zone streams ── */
  makeStream(-28, -12, -28, -32, 0x0088ff);
  makeStream( 28, -12,  28, -32, 0xff6600);

  /* ═══════════════════════════════════════════════════════════
     6.  AIDA — 2D Canvas Avatar with Lip Sync
  ═══════════════════════════════════════════════════════════ */
  var aidaCanvas = $$('aida-canvas');
  var ac         = aidaCanvas.getContext('2d');
  var AW = aidaCanvas.width;
  var AH = aidaCanvas.height;

  /* Lip sync state */
  var lsActive  = false;
  var lsMouth   = 0;     /* 0=closed, 1=wide open */
  var lsTarget  = 0;
  var lsBlink   = 1;
  var lsBlinkT  = 0;
  var lsHeadY   = 0;     /* bob offset */
  var lsEmotion = 'idle'; /* idle | talking | happy | thinking */

  /* Phoneme → mouth openness table (approximation — no Azure needed) */
  var phonemeMap = {
    'a': .9, 'e': .7, 'i': .5, 'o': .8, 'u': .65,
    'b': .1, 'p': .1, 'm': .1, 'f': .3, 'v': .3,
    'n': .2, 'd': .3, 't': .3, 'l': .4, 's': .25,
    'r': .35, ' ': 0, '.': 0, ',': 0
  };

  /* Parse speech into phoneme schedule */
  function buildPhonemeSchedule(text, msPerChar) {
    var schedule = [];
    var t = 0;
    for (var i = 0; i < text.length; i++) {
      var ch  = text[i].toLowerCase();
      var val = phonemeMap[ch];
      if (val === undefined) val = 0.15;
      schedule.push({ time: t, val: val });
      t += msPerChar;
    }
    return schedule;
  }

  function drawAIDA(t) {
    ac.clearRect(0, 0, AW, AH);

    /* Background */
    var bg = ac.createLinearGradient(0, 0, 0, AH);
    bg.addColorStop(0, '#000c1e');
    bg.addColorStop(1, '#000511');
    ac.fillStyle = bg;
    ac.fillRect(0, 0, AW, AH);

    /* Scanlines */
    for (var sy = 0; sy < AH; sy += 4) {
      ac.fillStyle = 'rgba(0,0,0,.15)';
      ac.fillRect(0, sy, AW, 1);
    }

    var cx = AW / 2;
    var cy = AH / 2 + lsHeadY;

    /* Head shadow / glow */
    var grd = ac.createRadialGradient(cx, cy, 10, cx, cy, 46);
    grd.addColorStop(0, 'rgba(0,255,255,.12)');
    grd.addColorStop(1, 'rgba(0,255,255,0)');
    ac.fillStyle = grd;
    ac.fillRect(0, 0, AW, AH);

    /* Head */
    ac.save();
    ac.translate(cx, cy);
    ac.beginPath();
    ac.roundRect(-28, -35, 56, 62, 10);
    ac.fillStyle = '#0a1a2e';
    ac.fill();
    ac.strokeStyle = '#00ffff';
    ac.lineWidth = 1.5;
    ac.stroke();
    ac.restore();

    /* Eyes */
    var eyeH = lsBlink > 0.5 ? 6 : lsBlink * 12;
    [[cx - 10, cy - 10], [cx + 10, cy - 10]].forEach(function (ep) {
      /* Outer glow */
      var eg = ac.createRadialGradient(ep[0], ep[1], 0, ep[0], ep[1], 10);
      eg.addColorStop(0, 'rgba(0,255,255,.4)');
      eg.addColorStop(1, 'rgba(0,255,255,0)');
      ac.fillStyle = eg;
      ac.fillRect(ep[0] - 10, ep[1] - 10, 20, 20);

      ac.save();
      ac.beginPath();
      ac.ellipse(ep[0], ep[1], 5, eyeH, 0, 0, Math.PI * 2);
      ac.fillStyle = '#00ffff';
      ac.fill();
      ac.restore();
    });

    /* Antenna */
    ac.save();
    ac.strokeStyle = '#00ffff';
    ac.lineWidth = 2;
    ac.beginPath();
    ac.moveTo(cx, cy - 35);
    ac.lineTo(cx, cy - 50);
    ac.stroke();
    /* Antenna ball */
    var ab = 2.5 + Math.sin(t * 3) * 1;
    ac.beginPath();
    ac.arc(cx, cy - 50, ab, 0, Math.PI * 2);
    ac.fillStyle = '#00ffff';
    ac.shadowColor = '#00ffff';
    ac.shadowBlur  = 12;
    ac.fill();
    ac.restore();

    /* Chest panel */
    ac.save();
    ac.translate(cx, cy);
    ac.fillStyle = 'rgba(0,255,255,.08)';
    ac.strokeStyle = 'rgba(0,255,255,.35)';
    ac.lineWidth = 1;
    ac.beginPath();
    ac.roundRect(-14, 6, 28, 20, 3);
    ac.fill();
    ac.stroke();
    /* Screen lines (animated) */
    for (var li = 0; li < 3; li++) {
      var lw = 10 + Math.sin(t * 2 + li) * 6;
      ac.fillStyle = 'rgba(0,255,255,' + (lsActive ? .8 : .3) + ')';
      ac.fillRect(-12, 9 + li * 5, lw, 2);
    }
    ac.restore();

    /* Mouth */
    var mOpen  = lsMouth * 14;
    var mWidth = 18;
    ac.save();
    ac.translate(cx, cy + 16);
    /* Mouth glow */
    if (lsActive) {
      ac.shadowColor = '#00ffff';
      ac.shadowBlur  = 8;
    }
    ac.strokeStyle = '#00ffff';
    ac.lineWidth   = 2;
    ac.beginPath();
    if (mOpen < 2) {
      /* Closed smile */
      ac.moveTo(-mWidth / 2, 0);
      ac.quadraticCurveTo(0, 5, mWidth / 2, 0);
    } else {
      /* Open mouth */
      ac.ellipse(0, 0, mWidth / 2, mOpen / 2, 0, 0, Math.PI * 2);
      ac.fillStyle = 'rgba(0,20,40,.9)';
      ac.fill();
    }
    ac.stroke();
    ac.restore();

    /* Cheek dots */
    [[cx - 18, cy + 8], [cx + 18, cy + 8]].forEach(function (cp) {
      ac.beginPath();
      ac.arc(cp[0], cp[1], 3, 0, Math.PI * 2);
      ac.fillStyle = 'rgba(255,0,170,.5)';
      ac.fill();
    });

    /* Border glow */
    ac.save();
    ac.strokeStyle = 'rgba(0,255,255,' + (.3 + Math.sin(t * 1.5) * .15) + ')';
    ac.lineWidth = 1;
    ac.strokeRect(1, 1, AW - 2, AH - 2);
    ac.restore();
  }

  /* Blink loop */
  function updateBlink(dt) {
    lsBlinkT += dt;
    if (lsBlinkT > 3.5 + Math.random() * 2) {
      lsBlinkT = 0;
      var blinkStart = performance.now();
      (function doBlink() {
        var elapsed = (performance.now() - blinkStart) / 1000;
        if (elapsed < 0.06)       lsBlink = elapsed / 0.06;
        else if (elapsed < 0.12)  lsBlink = 1 - (elapsed - 0.06) / 0.06;
        else { lsBlink = 1; return; }
        requestAnimationFrame(doBlink);
      }());
    }
  }

  /* ── Phoneme-based lip sync engine ── */
  var lsSchedule = [];
  var lsStartMs  = 0;
  var lsActive2  = false;

  function startLipSync(text) {
    /* Approx: 80ms per char for normal speaking rate */
    lsSchedule = buildPhonemeSchedule(text, 80);
    lsStartMs  = performance.now();
    lsActive2  = true;
    lsActive   = true;
  }
  function stopLipSync() {
    lsActive2 = false;
    lsActive  = false;
    lsTarget  = 0;
  }
  function tickLipSync() {
    if (!lsActive2) { lsMouth += (0 - lsMouth) * 0.25; return; }
    var elapsed = performance.now() - lsStartMs;
    /* Find current phoneme */
    var cur = 0;
    for (var i = 0; i < lsSchedule.length; i++) {
      if (lsSchedule[i].time <= elapsed) cur = lsSchedule[i].val;
      else break;
    }
    if (elapsed > lsSchedule.length * 80) { stopLipSync(); cur = 0; }
    lsTarget  = cur;
    lsMouth  += (lsTarget - lsMouth) * 0.35;
  }

  /* ═══════════════════════════════════════════════════════════
     7.  WEB SPEECH API  (TTS + lip sync)
  ═══════════════════════════════════════════════════════════ */
  var synth    = window.speechSynthesis || null;
  var selVoice = null;

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
  if (synth && synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoice;

  var currentSpeechText = '';

  function aidaSay(text, zoneTag) {
    if (!text) return;
    currentSpeechText = text;

    /* Typewriter in HUD */
    var el = $$('speech-text');
    if (el) {
      el.textContent = '';
      var i = 0;
      (function tw() { if (i < text.length) { el.textContent += text[i++]; setTimeout(tw, 16); } }());
    }

    /* Zone tag */
    var zt = $$('speech-zone-tag');
    if (zt && zoneTag) zt.textContent = '// ' + zoneTag;

    /* Start lip sync */
    startLipSync(text);

    /* TTS */
    if (!synth) return;
    synth.cancel();
    loadVoice();
    var utt    = new SpeechSynthesisUtterance(text);
    utt.lang   = 'en-US';
    utt.rate   = 0.88;
    utt.pitch  = 1.0;
    utt.volume = 1;
    if (selVoice) utt.voice = selVoice;
    utt.onend = function () { stopLipSync(); };
    utt.onerror = function () { stopLipSync(); };
    synth.speak(utt);
  }

  $$('btn-repeat').addEventListener('click', function () { aidaSay(currentSpeechText); });
  $$('btn-stop').addEventListener('click', function () {
    if (synth) synth.cancel();
    stopLipSync();
  });

  /* ═══════════════════════════════════════════════════════════
     8.  WEB AUDIO — Tron ambient music
  ═══════════════════════════════════════════════════════════ */
  var audioCtx   = null;
  var musicOn    = false;
  var musicOscs  = [];
  var masterGain = null;

  function startMusic() {
    if (musicOn) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.055, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    /* Reverb */
    var conv = audioCtx.createConvolver();
    var blen = audioCtx.sampleRate * 3.2;
    var buf  = audioCtx.createBuffer(2, blen, audioCtx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < blen; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/blen, 2.0);
    }
    conv.buffer = buf;
    conv.connect(masterGain);

    /* Delay */
    var delay = audioCtx.createDelay(1.5);
        delay.delayTime.setValueAtTime(0.44, audioCtx.currentTime);
    var dfb = audioCtx.createGain();
    dfb.gain.setValueAtTime(0.3, audioCtx.currentTime);
    delay.connect(dfb); dfb.connect(delay); delay.connect(masterGain);

    /* Tron pentatonic drone */
    var freqs = [55, 82.41, 110, 146.83, 164.81, 220, 293.66, 329.63];
    var types = ['sine','triangle','sine','triangle','sine','triangle','sine','sine'];
    freqs.forEach(function (freq, i) {
      var osc = audioCtx.createOscillator();
      var gn  = audioCtx.createGain();
      osc.type = types[i];
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, audioCtx.currentTime);
      var lfo  = audioCtx.createOscillator();
      var lfog = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.06 + i * 0.02, audioCtx.currentTime);
      lfog.gain.setValueAtTime(0.025, audioCtx.currentTime);
      lfo.connect(lfog); lfog.connect(gn.gain); lfo.start();
      gn.gain.setValueAtTime(0.038 + Math.random() * 0.028, audioCtx.currentTime);
      osc.connect(gn); gn.connect(conv); gn.connect(delay); osc.start();
      musicOscs.push(osc, lfo);
    });

    musicOn = true;
    var bm = $$('btn-music');
    if (bm) { bm.textContent = '◉ MUSIC ON'; bm.classList.add('on'); }
  }

  function stopMusic() {
    if (!musicOn || !audioCtx) return;
    if (masterGain) masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    musicOscs.forEach(function (n) { try { n.stop(); } catch (e) {} });
    musicOscs = [];
    masterGain = null;
    musicOn = false;
    var bm = $$('btn-music');
    if (bm) { bm.textContent = '⬡ MUSIC'; bm.classList.remove('on'); }
  }

  $$('btn-music').addEventListener('click', function () {
    if (musicOn) stopMusic(); else startMusic();
  });

  /* ═══════════════════════════════════════════════════════════
     9.  LIVE AI NEWS — rss2json free (no API key needed)
         Multiple RSS sources as fallback chain
  ═══════════════════════════════════════════════════════════ */
  var newsCache = [];

  var NEWS_FEEDS = [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index'
  ];

  function fetchNews(feedIdx, callback) {
    feedIdx = feedIdx || 0;
    if (feedIdx >= NEWS_FEEDS.length) { callback([]); return; }
    var url = 'https://api.rss2json.com/v1/api.json?rss_url=' +
      encodeURIComponent(NEWS_FEEDS[feedIdx]) + '&count=8';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.items && d.items.length) {
          callback(d.items.slice(0, 8));
        } else {
          fetchNews(feedIdx + 1, callback);
        }
      })
      .catch(function () { fetchNews(feedIdx + 1, callback); });
  }

  function renderNews(items) {
    var list = $$('news-list');
    if (!list) return;
    list.innerHTML = '';
    if (!items || !items.length) {
      /* Fallback static headlines */
      items = [
        { title: 'AWS re:Invent 2025: Redshift Serverless gets 40% cost reduction', link: '#', pubDate: '2025-12-01' },
        { title: 'Apache Spark 4.0 lands with 3x performance boost for PySpark', link: '#', pubDate: '2025-11-15' },
        { title: 'Databricks Unity Catalog now GA across AWS, Azure, GCP', link: '#', pubDate: '2025-11-10' },
        { title: 'Apache Airflow 3.0 ships with new DAG authoring UI', link: '#', pubDate: '2025-10-28' },
        { title: 'GitHub Copilot gains SQL + PySpark autocomplete in VS Code', link: '#', pubDate: '2025-10-15' }
      ];
    }
    newsCache = items;
    items.forEach(function (item, i) {
      var div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML =
        '<div class="news-item-title">' + escHtml(item.title) + '</div>' +
        '<div class="news-item-meta">' + formatDate(item.pubDate) + '</div>' +
        '<div class="news-item-btns">' +
        '<button class="ni-btn ni-listen" data-idx="' + i + '">▶ AIDA READS</button>' +
        (item.link && item.link !== '#' ?
          '<button class="ni-btn ni-open" data-url="' + escHtml(item.link) + '">↗ OPEN</button>' : '') +
        '</div>';
      list.appendChild(div);
    });

    /* Listen buttons */
    list.querySelectorAll('.ni-listen').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx  = parseInt(btn.getAttribute('data-idx'), 10);
        var item = newsCache[idx];
        if (!item) return;
        var text = 'Here is the news: ' + item.title + '. ' +
          (item.description
            ? stripHtml(item.description).slice(0, 320) + '...'
            : '');
        aidaSay(text, 'AI NEWS FEED');
        btn.textContent = '◉ READING...';
        setTimeout(function () { btn.textContent = '▶ AIDA READS'; }, 3000);
      });
    });

    /* Open article buttons */
    list.querySelectorAll('.ni-open').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.open(btn.getAttribute('data-url'), '_blank', 'noopener');
      });
    });
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }
  function stripHtml(s) {
    var d = document.createElement('div');
    d.innerHTML = s; return d.textContent || d.innerText || '';
  }
  function formatDate(s) {
    if (!s) return '';
    try { return new Date(s).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
    catch (e) { return s; }
  }

  $$('btn-news').addEventListener('click', function () {
    var panel = $$('news-panel');
    if (!panel) return;
    var isHidden = panel.classList.contains('hidden');
    if (!isHidden) { panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden');
    var list = $$('news-list');
    if (list && !list.children.length) {
      list.innerHTML = '<div class="news-loading">◉ FETCHING DATA FEED...</div>';
      aidaSay('Fetching the latest technology news from the data grid. Stand by.', 'AI NEWS');
      fetchNews(0, function (items) {
        renderNews(items);
        if (items.length) {
          var titles = items.slice(0,2).map(function (it) { return it.title; }).join('. Also, ');
          aidaSay('News loaded. Top stories: ' + titles, 'AI NEWS FEED');
        }
      });
    }
  });

  $$('news-close').addEventListener('click', function () {
    var panel = $$('news-panel');
    if (panel) panel.classList.add('hidden');
  });

  /* ═══════════════════════════════════════════════════════════
     10. CONTACT FORM — real POST to Google Apps Script
         No CORS issue because Apps Script sets the header
  ═══════════════════════════════════════════════════════════ */
  $$('cf-send').addEventListener('click', function () {
    var name  = ($$('cf-name')  || {}).value  || '';
    var email = ($$('cf-email') || {}).value  || '';
    var msg   = ($$('cf-msg')   || {}).value  || '';
    var status= $$('cf-status');

    if (!name.trim() || !email.trim() || !msg.trim()) {
      if (status) { status.textContent = '✕ All fields required.'; status.className = 'err'; }
      return;
    }

    var btn = $$('cf-send');
    btn.disabled = true;
    btn.textContent = '◉ TRANSMITTING...';
    if (status) { status.textContent = ''; status.className = ''; }

    /* If Apps Script URL is not configured, fall back to mailto */
    var scriptUrl = (PD.appsScriptUrl || '').replace('YOUR_DEPLOYMENT_ID', '');
    if (!scriptUrl || scriptUrl.indexOf('YOUR_DEPLOYMENT') !== -1 || scriptUrl.length < 40) {
      /* Mailto fallback */
      var body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + msg);
      window.open('mailto:ujasdubal@gmail.com?subject=' + encodeURIComponent('Portfolio: Message from ' + name) + '&body=' + body);
      btn.disabled = false;
      btn.textContent = '⟡ TRANSMIT →';
      if (status) { status.textContent = '✓ Email client opened. Send from there.'; status.className = 'ok'; }
      aidaSay('Email client opened. Please send the message from your mail app.', 'CONTACT');
      return;
    }

    /* Real fetch POST to Google Apps Script */
    fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',   /* Apps Script returns opaque response — this is correct */
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, message: msg })
    })
    .then(function () {
      /* no-cors → response is opaque, we assume success if no network error */
      btn.disabled    = false;
      btn.textContent = '⟡ TRANSMIT →';
      if (status) { status.textContent = '✓ Transmission successful! Ujas will reply soon.'; status.className = 'ok'; }
      aidaSay('Message transmitted successfully! Ujas Dubal will reply to you very soon.', 'CONTACT');
      /* Clear fields */
      if ($$('cf-name'))  $$('cf-name').value  = '';
      if ($$('cf-email')) $$('cf-email').value = '';
      if ($$('cf-msg'))   $$('cf-msg').value   = '';
    })
    .catch(function (err) {
      btn.disabled    = false;
      btn.textContent = '⟡ TRANSMIT →';
      if (status) { status.textContent = '✕ Transmission failed. Try the email link below.'; status.className = 'err'; }
      aidaSay('Network error. Please use the email link below to contact Ujas directly.', 'CONTACT');
    });
  });

  $$('contact-close').addEventListener('click', function () {
    $$('contact-modal').classList.add('hidden');
  });

  /* ═══════════════════════════════════════════════════════════
     11. RAYCASTER — click + hover on 3D objects
  ═══════════════════════════════════════════════════════════ */
  var ray    = new T.Raycaster();
  var mouse2 = new T.Vector2();
  var tip    = $$('obj-tooltip');

  /* Hover tooltip */
  function doHoverRay(e) {
    mouse2.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse2.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(mouse2, camera);
    var hits = ray.intersectObjects(clickables, false);
    if (hits.length && hits[0].object.userData.info) {
      var info = hits[0].object.userData.info;
      var label = info.title || info.v || '';
      if (tip) {
        tip.textContent = label;
        tip.style.left  = (e.clientX + 14) + 'px';
        tip.style.top   = (e.clientY - 28) + 'px';
        tip.classList.remove('hidden');
      }
    } else {
      if (tip) tip.classList.add('hidden');
    }
  }

  /* Click handler */
  canvas.addEventListener('click', function (e) {
    if (O.dragging) return;
    mouse2.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse2.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(mouse2, camera);
    var hits = ray.intersectObjects(clickables, false);
    if (!hits.length) return;
    var obj  = hits[0].object;
    var info = obj.userData.info;
    if (!info) return;

    /* Flash cap/wire ref if present */
    var ref = obj.userData.capRef || obj.userData.wireRef;
    if (ref && ref.material) {
      var origEI = ref.material.emissiveIntensity || 1;
      ref.material.emissiveIntensity = 6;
      setTimeout(function () { if (ref.material) ref.material.emissiveIntensity = origEI; }, 350);
    }

    if (info.type === 'contact') {
      $$('contact-modal').classList.remove('hidden');
      aidaSay(info.speech, 'CONTACT ZONE');
      return;
    }

    buildInfoPanel(info);
    aidaSay(info.speech, info.title);
  });

  /* ═══════════════════════════════════════════════════════════
     12. INFO PANEL BUILDER — rich content per type
  ═══════════════════════════════════════════════════════════ */
  function buildInfoPanel(info) {
    var panel = $$('info-panel');
    var body  = $$('info-body');
    var titleEl = $$('info-title-txt');
    if (!panel || !body) return;

    if (titleEl) titleEl.textContent = info.title || '';
    var html = '';

    /* Speak button reads the full speech text */
    var speakBtn = $$('info-speak-btn');
    if (speakBtn) {
      speakBtn.onclick = function () { aidaSay(info.speech || info.title, info.title); };
    }

    if (info.type === 'home') {
      html += '<div class="stat-grid">';
      info.stats.forEach(function (s) {
        html += '<div class="stat-chip">' +
          '<span class="sv">' + escHtml(s.v) + '</span>' +
          '<span class="sl">' + escHtml(s.l) + '</span></div>';
      });
      html += '</div>';
      info.lines.forEach(function (l) { html += '<p>' + escHtml(l) + '</p>'; });
      html += '<div class="tag-row">' +
        ['AWS', 'PySpark', 'Redshift', 'Glue', 'Python', 'Airflow'].map(function(t){
          return '<span class="tag">' + t + '</span>';
        }).join('') + '</div>';

    } else if (info.type === 'stat') {
      html = '<p style="font-family:var(--head);font-size:42px;font-weight:900;color:var(--cyan);text-shadow:var(--glow);text-align:center;padding:16px 0">' +
        escHtml(info.v) + '</p>' +
        '<p style="text-align:center;font-size:13px;letter-spacing:.1em">' + escHtml(info.l) + '</p>';

    } else if (info.type === 'about') {
      html += '<p class="info-sub">' + escHtml(info.lines[0]) + '</p>';
      html += '<p>' + escHtml(info.lines[1]) + '</p>';
      html += '<ul>';
      info.points.forEach(function (p) { html += '<li>' + escHtml(p) + '</li>'; });
      html += '</ul>';

    } else if (info.type === 'skills_overview') {
      html = '<p>Each tower height = proficiency level. Click any tower for details.</p>' +
        '<ul>' + PD.skills.map(function (sk) {
          return '<li>' + escHtml(sk.icon + ' ' + sk.name) + ' — ' + sk.pct + '%</li>';
        }).join('') + '</ul>';

    } else if (info.type === 'skill') {
      html = '<span class="skill-pct">' + info.pct + '%</span>' +
        '<div class="skill-bar-wrap"><div class="skill-bar-fill" id="sbfill"></div></div>' +
        '<p style="margin-top:10px;font-size:11px">Proficiency level: <strong style="color:var(--cyan)">' +
        (info.pct >= 90 ? 'Expert' : info.pct >= 80 ? 'Advanced' : 'Proficient') + '</strong></p>';
      setTimeout(function () {
        var bf = $$('sbfill');
        if (bf) bf.style.width = info.pct + '%';
      }, 60);

    } else if (info.type === 'exp') {
      /* Company logo + meta */
      html += '<div class="co-logo-row">';
      if (info.logo) {
        html += '<img class="co-logo" src="' + escHtml(info.logo) + '" alt="' + escHtml(info.company) +
          '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
          '<div class="co-logo-fallback" style="display:none">' + escHtml(info.logoFallback) + '</div>';
      } else {
        html += '<div class="co-logo-fallback">' + escHtml(info.logoFallback) + '</div>';
      }
      html += '<div class="co-meta">' +
        '<div class="co-name">' + escHtml(info.company) + '</div>' +
        '<div class="co-period">' + escHtml(info.period) + '</div>' +
        '<div class="co-location">📍 ' + escHtml(info.location) + '</div>' +
        '</div></div>';
      html += '<p class="info-sub">' + escHtml(info.role) + '</p>';
      html += '<ul>';
      info.points.forEach(function (p) { html += '<li>' + escHtml(p) + '</li>'; });
      html += '</ul>';

    } else if (info.type === 'exp_overview') {
      html = '<p>Click each tower to explore Ujas\'s career at each company.</p><ul>';
      PD.experience.forEach(function (e) {
        html += '<li>' + escHtml(e.company) + ' — ' + escHtml(e.period) + '</li>';
      });
      html += '</ul>';

    } else if (info.type === 'cert') {
      html = '<p class="info-sub">' + escHtml(info.lines[0]) + '</p>';
      html += '<p style="color:var(--cyan)">' + escHtml(info.lines[1]) + '</p>';

    } else if (info.type === 'cert_overview') {
      html = '<ul>';
      PD.certifications.forEach(function (c) {
        html += '<li>' + escHtml(c.title) + ' · ' + escHtml(c.year) + '</li>';
      });
      html += '</ul>';

    } else if (info.type === 'project') {
      info.lines.forEach(function (l) { html += '<p class="info-sub">' + escHtml(l) + '</p>'; });
      html += '<div class="tag-row">';
      info.tags.forEach(function (t) { html += '<span class="tag">' + escHtml(t) + '</span>'; });
      html += '</div>';

    } else if (info.type === 'proj_overview') {
      html = '<ul>';
      PD.projects.forEach(function (p) { html += '<li>' + escHtml(p.title) + ' — ' + escHtml(p.client) + '</li>'; });
      html += '</ul>';
    }

    body.innerHTML = html;
    panel.classList.remove('hidden');
  }

  $$('info-close').addEventListener('click', function () {
    $$('info-panel').classList.add('hidden');
  });

  /* ═══════════════════════════════════════════════════════════
     13. ZONE CAMERA NAVIGATION
  ═══════════════════════════════════════════════════════════ */
  var ZONES = [
    { cx:  0,  cy: 22, cz: 46,  lx:  0, ly: 0, lz:  0,   ax:  0, az: 9,   name: 'HOME',     speech: "Welcome to Ujas's Data World! I'm AIDA, your AI guide. Click any glowing object to explore. Press keys 1 through 7 to jump between zones!" },
    { cx: -38, cy: 16, cz:  -4, lx: -28, ly:0, lz: -12,  ax: -24, az:-10, name: 'ABOUT',    speech: "About zone. Ujas Dubal is an AWS Data Engineer from Ahmedabad, India. Click the glowing label tower for full details." },
    { cx:  40, cy: 16, cz:  -4, lx:  28, ly:0, lz: -12,  ax:  24, az:-10, name: 'SKILLS',   speech: "Skills matrix. Each tower represents a technology. Taller means higher proficiency. Click any tower to inspect." },
    { cx:   0, cy: 20, cz: -18, lx:   0, ly:0, lz: -32,  ax:   0, az:-28, name: 'CAREER',   speech: "Career timeline. Four companies spanning 8.5 years. Click each tower for company details, logo, location, and highlights." },
    { cx: -38, cy: 16, cz: -24, lx: -28, ly:0, lz: -32,  ax: -24, az:-30, name: 'CERTS',    speech: "Certifications zone. These spinning gems represent AWS and Python certifications. Click each one." },
    { cx:  40, cy: 16, cz: -24, lx:  28, ly:0, lz: -32,  ax:  24, az:-30, name: 'PROJECTS', speech: "Projects zone. Three major data engineering projects. Click each tower for full tech stack details." },
    { cx:   0, cy: 18, cz: -44, lx:   0, ly:0, lz: -52,  ax:   0, az:-48, name: 'CONTACT',  speech: "Contact zone! Click the warp portal ring to open the transmission form and send a direct message to Ujas." }
  ];

  var currentZone = -1;

  /* AIDA 3D proxy in scene */
  var aidaProxy = (function () {
    var g = new T.Group();
    /* Body */
    var body = new T.Mesh(new T.BoxGeometry(0.9, 1.1, 0.6), neonMat(0x0a2a5a, 0.3));
    body.castShadow = true; g.add(body);
    /* Head */
    var head = new T.Mesh(new T.BoxGeometry(0.7, 0.65, 0.6), neonMat(0x0d2b55, 0.25));
    head.position.set(0, 0.9, 0); head.castShadow = true; g.add(head);
    /* Eyes */
    [[-0.16, 0.95, 0.32], [0.16, 0.95, 0.32]].forEach(function (p) {
      var eye = new T.Mesh(new T.SphereGeometry(0.07, 8, 8), new T.MeshBasicMaterial({ color: 0x00ffff }));
      eye.position.set(p[0], p[1], p[2]); g.add(eye);
    });
    /* Antenna */
    var ant = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.45, 6), neonMat(0x00ffff, 1.2));
    ant.position.set(0, 1.44, 0); g.add(ant);
    var antBall = new T.Mesh(new T.SphereGeometry(0.07, 8, 8), new T.MeshBasicMaterial({ color: 0x00ffff }));
    antBall.position.set(0, 1.68, 0); g.add(antBall);
    var antGlow = new T.PointLight(0x00ffff, 1.6, 3.5);
    antGlow.position.set(0, 1.68, 0); g.add(antGlow);
    g.scale.setScalar(0.8);
    g.position.set(0, 1.4, 9);
    scene.add(g);
    return { group: g, head: head, antGlow: antGlow, targetPos: new T.Vector3(0, 1.4, 9) };
  }());

  function setZone(idx) {
    idx = Math.max(0, Math.min(6, idx));
    if (idx === currentZone) return;
    currentZone = idx;
    var zd = ZONES[idx];

    /* Compute orbit spherical from desired camera pos + look target */
    var dx = zd.cx - zd.lx, dy = zd.cy - zd.ly, dz = zd.cz - zd.lz;
    O.r   = Math.sqrt(dx*dx + dy*dy + dz*dz);
    O.phi = Math.acos(Math.max(-1, Math.min(1, dy / O.r)));
    O.theta = Math.atan2(dx, dz);
    O.tx = zd.lx; O.ty = zd.ly; O.tz = zd.lz;

    /* Move AIDA 3D to zone */
    aidaProxy.targetPos.set(zd.ax, 1.4, zd.az);

    /* Zone label */
    var zlEl = $$('zone-lbl');
    if (zlEl) {
      zlEl.textContent = '// ZONE ' + (idx + 1) + ' · ' + zd.name;
      zlEl.style.opacity = '1';
      setTimeout(function () { zlEl.style.opacity = '0'; }, 2800);
    }

    /* Nav active state */
    qsa('.znav').forEach(function (b, i) { b.classList.toggle('active', i === idx); });

    /* AIDA speaks */
    aidaSay(zd.speech, zd.name);
  }

  /* Zone nav buttons */
  qsa('.znav').forEach(function (b) {
    b.addEventListener('click', function () {
      setZone(parseInt(b.getAttribute('data-zone'), 10));
    });
  });

  /* Keyboard */
  window.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key >= '1' && e.key <= '7') { setZone(parseInt(e.key, 10) - 1); return; }
    if (e.key === 'ArrowRight' || e.key === 'd') { setZone(currentZone + 1); return; }
    if (e.key === 'ArrowLeft'  || e.key === 'a') { setZone(currentZone - 1); return; }
    if (e.key === 'Escape') {
      $$('info-panel').classList.add('hidden');
      $$('contact-modal').classList.add('hidden');
      $$('news-panel').classList.add('hidden');
    }
  });

  /* ═══════════════════════════════════════════════════════════
     14. START OVERLAY
  ═══════════════════════════════════════════════════════════ */
  $$('start-btn').addEventListener('click', function () {
    startMusic(); /* Must be inside user gesture for autoplay policy */
    var so = $$('start-overlay');
    if (so) {
      so.classList.add('gone');
      setTimeout(function () { so.style.display = 'none'; }, 750);
    }
    setZone(0);
  });

  /* ═══════════════════════════════════════════════════════════
     15. MAIN RENDER LOOP
  ═══════════════════════════════════════════════════════════ */
  var clock   = new T.Clock();
  var lastT   = 0;
  var aCanvas2DT = 0;

  (function loop() {
    requestAnimationFrame(loop);
    var t  = clock.getElapsedTime();
    var dt = t - lastT; lastT = t;

    /* Floaters */
    floaters.forEach(function (f) {
      f.mesh.position.y = f.baseY + Math.sin(t * f.speed + f.phase) * f.amp;
    });

    /* Spinners */
    spinList.forEach(function (s) { s.mesh.rotation.y += s.speed; });

    /* Data stream particles */
    streamList.forEach(function (ds) {
      ds.t += ds.speed;
      if (ds.t >= 1.0) ds.t -= 1.0;
      ds.pt.position.lerpVectors(ds.from, ds.to, ds.t);
      ds.pt.position.y += Math.sin(t * 2.5 + ds.t * 12) * 0.1;
      ds.light.position.copy(ds.pt.position);
    });

    /* AIDA 3D proxy animation */
    aidaProxy.group.position.x += (aidaProxy.targetPos.x - aidaProxy.group.position.x) * 0.035;
    aidaProxy.group.position.z += (aidaProxy.targetPos.z - aidaProxy.group.position.z) * 0.035;
    aidaProxy.group.position.y = aidaProxy.targetPos.y + Math.sin(t * 1.7) * 0.15;
    var adx = aidaProxy.targetPos.x - aidaProxy.group.position.x;
    var adz = aidaProxy.targetPos.z - aidaProxy.group.position.z;
    if (Math.abs(adx) + Math.abs(adz) > 0.05) {
      aidaProxy.group.rotation.y = Math.atan2(adx, adz);
    }
    aidaProxy.head.rotation.y      = Math.sin(t * 0.5) * 0.28;
    aidaProxy.antGlow.intensity    = 1.4 + Math.sin(t * 3) * 0.55;
    /* AIDA glow pulses when speaking (lip sync active) */
    aidaProxy.antGlow.intensity   += lsActive ? Math.sin(t * 14) * 0.4 : 0;

    /* AIDA 2D canvas — redraw ~30fps to save CPU */
    aCanvas2DT += dt;
    if (aCanvas2DT > 0.033) {
      aCanvas2DT = 0;
      updateBlink(dt * 30);
      tickLipSync();
      drawAIDA(t);
    }

    /* Camera orbit */
    orbitUpdate();

    renderer.render(scene, camera);
  }());

}); /* end window.addEventListener('load') */

