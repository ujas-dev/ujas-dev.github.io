/* ================================================================
   UJAS DUBAL PORTFOLIO — main.js  v3 (FULLY FIXED + TRUE 3D/4D)
   ================================================================ */

'use strict';

// ── 0. CONFIG ────────────────────────────────────────────────────
const CFG = window.PORTFOLIO_CONFIG;

// ── 1. BOOT: populate DOM from config ───────────────────────────
(function boot() {
  document.getElementById('year').textContent = new Date().getFullYear();

  const avatarImg = document.getElementById('avatar-img');
  if (avatarImg) avatarImg.src = CFG.avatarUrl;

  const heroName = document.getElementById('hero-name');
  if (heroName) heroName.textContent = CFG.name;

  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) heroTitle.textContent = CFG.title;

  const heroTagline = document.getElementById('hero-tagline');
  if (heroTagline) heroTagline.textContent = CFG.tagline;

  // ── Stats counters
  const statsRow = document.getElementById('stats-row');
  if (statsRow) {
    CFG.stats.forEach(s => {
      const el = document.createElement('div');
      el.className = 'stat-item';
      el.innerHTML = `<span class="stat-val" data-target="${s.value}" data-suffix="${s.suffix}">0${s.suffix}</span>
                      <span class="stat-label">${s.label}</span>`;
      statsRow.appendChild(el);
    });
    setTimeout(animateCounters, 900);
  }

  // ── Skills orbs + bars
  const orbsWrap = document.getElementById('skills-orbs-wrap');
  const barsWrap = document.getElementById('skills-bars-wrap');
  if (orbsWrap && barsWrap) {
    CFG.skills.forEach(s => {
      const orb = document.createElement('div');
      orb.className = 'skill-orb';
      orb.textContent = s.name;
      orb.style.setProperty('--orb-color', s.color + '33');
      orb.style.borderColor = s.color + '66';
      orbsWrap.appendChild(orb);

      const row = document.createElement('div');
      row.className = 'skill-bar-row';
      row.innerHTML = `
        <div class="skill-bar-name">${s.name}</div>
        <div class="skill-bar-track">
          <div class="skill-bar-fill"
               style="background:linear-gradient(to right,${s.color},${s.color}88)"
               data-width="${s.level}"></div>
        </div>
        <div class="skill-bar-pct">${s.level}%</div>`;
      barsWrap.appendChild(row);
    });
  }

  // ── Experience timeline
  const expEl = document.getElementById('exp-timeline');
  if (expEl) {
    CFG.experience.forEach(e => {
      const el = document.createElement('div');
      el.className = 'exp-item';
      el.innerHTML = `
        <div class="exp-meta">
          <div class="exp-company">${e.company}</div>
          <div class="exp-period">${e.period}</div>
          <div class="exp-location">${e.location}</div>
        </div>
        <div class="exp-body">
          <div class="exp-role">${e.role}</div>
          <ul class="exp-highlights">
            ${e.highlights.map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>`;
      expEl.appendChild(el);
    });
  }

  // ── Certifications (3D flip cards)
  const certGrid = document.getElementById('cert-grid');
  if (certGrid) {
    CFG.certifications.forEach(cert => {
      const el = document.createElement('div');
      el.className = 'cert-flip';
      el.innerHTML = `
        <div class="cert-flipper">
          <div class="cert-front">
            <div class="cert-badge-glow" style="--cert-color:${cert.color}"></div>
            <img src="${cert.badgeUrl}" alt="${cert.title}"
                 onerror="this.src='https://placehold.co/80x80/0f172a/38bdf8?text=CERT'" />
            <div class="cert-title">${cert.title}</div>
            <div class="cert-issuer">${cert.issuer}</div>
            <div class="cert-year">${cert.year}</div>
          </div>
          <div class="cert-back" style="border-color:${cert.color}44">
            <div class="cert-badge-glow" style="--cert-color:${cert.color}"></div>
            <h4>${cert.title}</h4>
            <p>${cert.issuer} · ${cert.year}</p>
            <a href="${cert.credlyUrl}" target="_blank" rel="noopener">Verify Certificate ↗</a>
          </div>
        </div>`;
      certGrid.appendChild(el);
    });
  }

  // ── Projects
  const projGrid = document.getElementById('projects-grid');
  if (projGrid) {
    CFG.projects.forEach(p => {
      const el = document.createElement('article');
      el.className = 'proj-card';
      el.style.setProperty('--proj-color', p.color);
      el.innerHTML = `
        <div class="proj-title">${p.title}</div>
        <div class="proj-client">${p.client}</div>
        <div class="proj-desc">${p.desc}</div>
        <div class="proj-tags">
          ${p.tags.map(t => `<span class="proj-tag">${t}</span>`).join('')}
        </div>`;
      projGrid.appendChild(el);
    });
  }

  // ── Contact links
  const clEl = document.getElementById('contact-links');
  if (clEl) {
    clEl.innerHTML = `
      <a href="mailto:${CFG.email}" class="contact-link">✉ ${CFG.email}</a>
      <a href="${CFG.linkedin}" target="_blank" rel="noopener" class="contact-link">🔗 LinkedIn: ujasdubal</a>
      <a href="${CFG.github}" target="_blank" rel="noopener" class="contact-link">⬡ GitHub: ujas-dev</a>
      <span class="contact-link">📍 ${CFG.location}</span>`;
  }
})();

// ── 2. SAFE NAVIGATION (never named scrollTo) ───────────────────
// CRITICAL: Do NOT name any function scrollTo.
// GSAP ScrollTrigger calls window.scrollTo(0, y) internally.
// Naming your own function scrollTo will override window.scrollTo and crash GSAP.

function jumpToSection(hash) {
  if (!hash || typeof hash !== 'string') return;
  try {
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    // silently ignore invalid selectors
  }
}

// Wire data-nav buttons (no inline onclick needed)
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-nav]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      jumpToSection(btn.dataset.nav);
    });
  });
});

// ── 3. COUNTER ANIMATION ────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('.stat-val').forEach(function (el) {
    var target = parseFloat(el.dataset.target);
    var suffix = el.dataset.suffix || '';
    var current = 0;
    var isDecimal = target % 1 !== 0;
    var increment = target / 60;
    function step() {
      current += increment;
      if (current >= target) {
        el.textContent = (isDecimal ? target.toFixed(1) : target) + suffix;
        return;
      }
      el.textContent = (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
      requestAnimationFrame(step);
    }
    step();
  });
}

// ── 4. CUSTOM CURSOR ────────────────────────────────────────────
(function initCursor() {
  var dot   = document.getElementById('cursor-dot');
  var glow  = document.getElementById('cursor-glow');
  if (!dot || !glow) return;

  var mx = -300, my = -300;
  var glx = -300, gly = -300;

  document.addEventListener('pointermove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function glowLoop() {
    glx += (mx - glx) * 0.13;
    gly += (my - gly) * 0.13;
    glow.style.left = glx + 'px';
    glow.style.top  = gly + 'px';
    requestAnimationFrame(glowLoop);
  })();

  var hoverTargets = document.querySelectorAll(
    'a, button, .holo-card, .cert-flip, .proj-card, .skill-orb, .mag-btn, .nav-link'
  );
  hoverTargets.forEach(function (el) {
    el.addEventListener('pointerenter', function () { document.body.classList.add('hovering'); });
    el.addEventListener('pointerleave', function () { document.body.classList.remove('hovering'); });
  });
})();

// ── 5. MAGNETIC BUTTONS ─────────────────────────────────────────
(function initMagnet() {
  document.querySelectorAll('.mag-btn').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width  / 2) / 5;
      var y = (e.clientY - r.top  - r.height / 2) / 5;
      btn.style.transform = 'translate(' + x + 'px, ' + y + 'px) translateY(-2px)';
    });
    btn.addEventListener('pointerleave', function () {
      btn.style.transform = '';
    });
  });
})();

// ── 6. HOLOGRAPHIC 3D TILT CARDS ────────────────────────────────
(function initHoloCards() {
  document.querySelectorAll('[data-holo]').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r    = card.getBoundingClientRect();
      var xPct = (e.clientX - r.left)  / r.width;
      var yPct = (e.clientY - r.top)   / r.height;
      var rotX = (yPct - 0.5) * -22;
      var rotY = (xPct - 0.5) *  22;
      card.style.transform =
        'perspective(650px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale3d(1.04,1.04,1.04)';
      var glare = card.querySelector('.holo-glare');
      if (glare) {
        glare.style.background =
          'radial-gradient(circle at ' + (xPct * 100) + '% ' + (yPct * 100) + '%, ' +
          'rgba(255,255,255,0.12) 0%, transparent 55%)';
      }
    });
    card.addEventListener('pointerleave', function () {
      card.style.transform = '';
      var glare = card.querySelector('.holo-glare');
      if (glare) glare.style.background = '';
    });
  });
})();

// ── 7. KEYBOARD NAVIGATION ──────────────────────────────────────
(function initKeyboard() {
  var SECTIONS = [
    '#hero', '#about', '#skills', '#experience',
    '#certifications', '#projects', '#contact'
  ];
  var currentIdx = 0;

  function gotoIdx(i) {
    var clamped = Math.max(0, Math.min(SECTIONS.length - 1, i));
    currentIdx = clamped;
    jumpToSection(SECTIONS[clamped]);
  }

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowDown' || k === 's') { e.preventDefault(); gotoIdx(currentIdx + 1); }
    else if (k === 'ArrowUp' || k === 'w') { e.preventDefault(); gotoIdx(currentIdx - 1); }
    else if (k >= '1' && k <= '7') { gotoIdx(parseInt(k, 10) - 1); }
    else if (k === 'Escape') { gotoIdx(0); }
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var idx = entry.target.dataset.sec;
        if (idx !== undefined) currentIdx = parseInt(idx, 10);
      }
    });
  }, { threshold: 0.45 });

  document.querySelectorAll('.section[data-sec]').forEach(function (s) { io.observe(s); });
})();

// ── 8. GSAP SCROLL REVEALS ───────────────────────────────────────
// IMPORTANT: Do NOT pass 'scrollTo' plugin. Only use ScrollTrigger.
(function initGSAP() {
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  // Reveal cards / timeline items
  gsap.utils.toArray(
    '.holo-card, .exp-item, .cert-flip, .proj-card'
  ).forEach(function (el, i) {
    gsap.from(el, {
      opacity:  0,
      y:        35,
      rotateX: -10,
      duration: 0.75,
      delay:    (i % 5) * 0.06,
      ease:     'power3.out',
      scrollTrigger: {
        trigger:      el,
        start:        'top 88%',
        toggleActions: 'play none none reverse'
      }
    });
  });

  // Skill bars fill on scroll-enter
  ScrollTrigger.create({
    trigger:  '#skills',
    start:    'top 72%',
    once:     true,
    onEnter: function () {
      document.querySelectorAll('.skill-bar-fill').forEach(function (b) {
        b.style.width = b.dataset.width + '%';
      });
    }
  });
})();

// ── 9. TERMINAL TYPING EFFECT ────────────────────────────────────
(function initTerminal() {
  var tText = document.getElementById('t-text');
  if (!tText) return;

  var lines = [
    'whoami',
    'echo "' + CFG.name + ' | Data Engineer"',
    'aws s3 ls s3://ujas-data-pipelines/',
    'spark-submit pipeline.py --master yarn --env prod',
    'SELECT COUNT(*) FROM redshift.analytics.fact_sales;',
    'git push origin feature/etl-optimization'
  ];

  var lineIdx = 0, charIdx = 0, typing = true;

  function tick() {
    if (lineIdx >= lines.length) lineIdx = 0;
    var line = lines[lineIdx];
    if (typing) {
      if (charIdx < line.length) {
        tText.textContent += line[charIdx++];
        setTimeout(tick, 48 + Math.random() * 28);
      } else {
        typing = false;
        setTimeout(tick, 1600);
      }
    } else {
      if (charIdx > 0) {
        tText.textContent = line.slice(0, --charIdx);
        setTimeout(tick, 16);
      } else {
        typing = true;
        lineIdx++;
        setTimeout(tick, 350);
      }
    }
  }
  setTimeout(tick, 700);
})();

// ── 10. THREE.JS PARTICLE FIELD (50k GPU particles) ─────────────
(function initParticles() {
  if (!window.THREE) { console.warn('Three.js not loaded'); return; }

  var canvas   = document.getElementById('bg');
  if (!canvas) return;

  var W = window.innerWidth, H = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 150);
  camera.position.z = 30;

  var COUNT     = 50000;
  var positions = new Float32Array(COUNT * 3);
  var velocities= new Float32Array(COUNT * 3);
  var colors    = new Float32Array(COUNT * 3);

  for (var i = 0; i < COUNT; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 80;
    positions[i*3+1] = (Math.random() - 0.5) * 80;
    positions[i*3+2] = (Math.random() - 0.5) * 60;
    velocities[i*3]   = (Math.random() - 0.5) * 0.01;
    velocities[i*3+1] = (Math.random() - 0.5) * 0.01;
    velocities[i*3+2] = (Math.random() - 0.5) * 0.008;
    var mix = Math.random();
    if (mix > 0.66) {
      colors[i*3] = 0.22; colors[i*3+1] = 0.74; colors[i*3+2] = 0.98; // cyan
    } else if (mix > 0.33) {
      colors[i*3] = 0.65; colors[i*3+1] = 0.47; colors[i*3+2] = 0.98; // purple
    } else {
      colors[i*3] = 0.88; colors[i*3+1] = 0.11; colors[i*3+2] = 0.28; // pink
    }
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

  var mat = new THREE.PointsMaterial({
    size:         0.13,
    vertexColors: true,
    transparent:  true,
    opacity:      0.72,
    blending:     THREE.AdditiveBlending,
    depthWrite:   false
  });

  var particles = new THREE.Points(geo, mat);
  scene.add(particles);

  var mxN = 0, myN = 0;
  document.addEventListener('pointermove', function (e) {
    mxN = (e.clientX / window.innerWidth  - 0.5) * 2;
    myN = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('resize', function () {
    W = window.innerWidth; H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  var t = 0;
  var pos = geo.attributes.position.array;

  (function renderParticles() {
    requestAnimationFrame(renderParticles);
    t += 0.0007;

    for (var j = 0; j < COUNT; j++) {
      pos[j*3]   += velocities[j*3]   + Math.sin(t + j * 0.011) * 0.002 + mxN * 0.003;
      pos[j*3+1] += velocities[j*3+1] + Math.cos(t + j * 0.013) * 0.002 + myN * 0.003;
      pos[j*3+2] += velocities[j*3+2];
      if (pos[j*3]   >  40) pos[j*3]   = -40;
      if (pos[j*3]   < -40) pos[j*3]   =  40;
      if (pos[j*3+1] >  40) pos[j*3+1] = -40;
      if (pos[j*3+1] < -40) pos[j*3+1] =  40;
      if (pos[j*3+2] >  30) pos[j*3+2] = -30;
      if (pos[j*3+2] < -30) pos[j*3+2] =  30;
    }
    geo.attributes.position.needsUpdate = true;

    particles.rotation.y += 0.00012 + mxN * 0.0004;
    particles.rotation.x += myN * 0.0002;

    camera.position.x += (mxN * 5  - camera.position.x) * 0.04;
    camera.position.y += (myN * 3.5 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  })();
})();

// ── 11. MATHEMATICALLY CORRECT 4D TESSERACT ─────────────────────
(function initTesseract() {
  if (!window.THREE) return;

  var canvas = document.getElementById('tesseract-canvas');
  if (!canvas) return;

  var SIZE = 340;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(SIZE, SIZE);

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.z = 4.5;
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // ── 4D vertex set: all 16 corners of a unit hypercube
  var VERTS4 = [];
  for (var i = 0; i < 16; i++) {
    VERTS4.push([
      (i & 1) ? 1 : -1,
      (i & 2) ? 1 : -1,
      (i & 4) ? 1 : -1,
      (i & 8) ? 1 : -1
    ]);
  }

  // ── 4D edges: vertices that differ in exactly 1 bit
  var EDGES4 = [];
  for (var a = 0; a < 16; a++) {
    for (var b = a + 1; b < 16; b++) {
      var diff = 0;
      for (var k = 0; k < 4; k++) {
        if (VERTS4[a][k] !== VERTS4[b][k]) diff++;
      }
      if (diff === 1) EDGES4.push([a, b]);
    }
  }

  // ── 4D rotation: rotate in a given plane by angle
  function rotate4D(v, plane, angle) {
    var ii = plane[0], jj = plane[1];
    var c = Math.cos(angle), s = Math.sin(angle);
    var u = v.slice();
    u[ii] = c * v[ii] - s * v[jj];
    u[jj] = s * v[ii] + c * v[jj];
    return u;
  }

  // ── 4D → 3D perspective projection
  function project4to3(v) {
    var w = 2.5 / (2.5 - v[3]);
    return new THREE.Vector3(v[0] * w, v[1] * w, v[2] * w);
  }

  // ── Build inner & outer cube coloring (depth = 4th coord)
  function edgeColor(a, b) {
    var avgW = (VERTS4[a][3] + VERTS4[b][3]) / 2;
    return avgW > 0 ? 0x38bdf8 : 0xe11d48; // cyan = outer, pink = inner
  }

  // ── Create line objects with per-edge color
  var lineObjs = EDGES4.map(function (edge) {
    var mat = new THREE.LineBasicMaterial({
      color:       edgeColor(edge[0], edge[1]),
      transparent: true,
      opacity:     0.9,
      linewidth:   1
    });
    var geo  = new THREE.BufferGeometry();
    var pts  = [new THREE.Vector3(), new THREE.Vector3()];
    geo.setFromPoints(pts);
    var line = new THREE.Line(geo, mat);
    scene.add(line);
    return { line: line, geo: geo };
  });

  // ── Vertex glow spheres
  var sGeo = new THREE.SphereGeometry(0.055, 8, 8);
  var spheres = VERTS4.map(function (v) {
    var col = v[3] > 0 ? 0x38bdf8 : 0xe11d48;
    var mat  = new THREE.MeshBasicMaterial({ color: col });
    var mesh = new THREE.Mesh(sGeo, mat);
    scene.add(mesh);
    return mesh;
  });

  // ── Drag rotation state
  var dragging = false, lastDX = 0, lastDY = 0;
  var dragRotX = 0, dragRotY = 0;
  var zoomLevel = 1;

  canvas.addEventListener('pointerdown', function (e) {
    dragging = true; lastDX = e.clientX; lastDY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointerup',   function () { dragging = false; });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    dragRotY += (e.clientX - lastDX) * 0.012;
    dragRotX += (e.clientY - lastDY) * 0.012;
    lastDX = e.clientX; lastDY = e.clientY;
  });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomLevel = Math.max(0.5, Math.min(3.0, zoomLevel + e.deltaY * 0.002));
    camera.position.z = 4.5 * zoomLevel;
  }, { passive: false });

  // ── Main tesseract render loop
  var tTime = 0;
  (function renderTesseract() {
    requestAnimationFrame(renderTesseract);
    tTime += 0.007;

    // Apply 4 simultaneous 4D rotations in different hyperplanes
    var rotated = VERTS4.map(function (v) {
      var u = v;
      u = rotate4D(u, [0, 3], tTime * 0.55);
      u = rotate4D(u, [1, 2], tTime * 0.40);
      u = rotate4D(u, [0, 2], tTime * 0.28);
      u = rotate4D(u, [1, 3], tTime * 0.35);
      return u;
    });

    // Project to 3D
    var projected = rotated.map(project4to3);

    // Apply drag rotation in 3D space on top
    var cX = Math.cos(dragRotX), sX = Math.sin(dragRotX);
    var cY = Math.cos(dragRotY), sY = Math.sin(dragRotY);

    projected = projected.map(function (p) {
      // Rotate X
      var y1 = cX * p.y - sX * p.z;
      var z1 = sX * p.y + cX * p.z;
      // Rotate Y
      var x2 = cY * p.x + sY * z1;
      var z2 = -sY * p.x + cY * z1;
      return new THREE.Vector3(x2, y1, z2);
    });

    // Update edge geometries
    EDGES4.forEach(function (edge, idx) {
      lineObjs[idx].geo.setFromPoints([projected[edge[0]], projected[edge[1]]]);
    });

    // Update vertex spheres
    projected.forEach(function (p, idx) {
      spheres[idx].position.copy(p);
    });

    renderer.render(scene, camera);
  })();
})();
