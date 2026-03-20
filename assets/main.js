// ================================================================
// UJAS DUBAL PORTFOLIO — main.js
// WebGL particles, 4D Tesseract, holographic cards, cursor, keyboard
// ================================================================

const C = window.PORTFOLIO_CONFIG;

// ─── Populate from config ──────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('avatar-img').src = C.avatarUrl;
document.getElementById('hero-name').textContent = C.name;
document.getElementById('hero-title').textContent = C.title;
document.getElementById('hero-tagline').textContent = C.tagline;

// Stats counters
const statsRow = document.getElementById('stats-row');
C.stats.forEach(s => {
  const el = document.createElement('div');
  el.className = 'stat-item';
  el.innerHTML = `<span class="stat-val" data-target="${s.value}" data-suffix="${s.suffix}">0${s.suffix}</span><span class="stat-label">${s.label}</span>`;
  statsRow.appendChild(el);
});

function animateCounters() {
  document.querySelectorAll('.stat-val').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix;
    let start = 0;
    const step = () => {
      start += target / 60;
      if (start >= target) { el.textContent = target + suffix; return; }
      el.textContent = (target % 1 !== 0 ? start.toFixed(1) : Math.floor(start)) + suffix;
      requestAnimationFrame(step);
    };
    step();
  });
}
setTimeout(animateCounters, 800);

// Skills
const orbsWrap = document.getElementById('skills-orbs-wrap');
const barsWrap = document.getElementById('skills-bars-wrap');
C.skills.forEach(s => {
  const orb = document.createElement('div');
  orb.className = 'skill-orb';
  orb.textContent = s.name;
  orb.style.setProperty('--orb-color', s.color + '33');
  orb.style.borderColor = s.color + '55';
  orbsWrap.appendChild(orb);

  const row = document.createElement('div');
  row.className = 'skill-bar-row';
  row.innerHTML = `
    <div class="skill-bar-name">${s.name}</div>
    <div class="skill-bar-track"><div class="skill-bar-fill" style="background:linear-gradient(to right,${s.color},${s.color}88)" data-width="${s.level}"></div></div>
    <div class="skill-bar-pct">${s.level}%</div>`;
  barsWrap.appendChild(row);
});

// Experience timeline
const expEl = document.getElementById('exp-timeline');
C.experience.forEach(e => {
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
      <ul class="exp-highlights">${e.highlights.map(h=>`<li>${h}</li>`).join('')}</ul>
    </div>`;
  expEl.appendChild(el);
});

// Certifications
const certGrid = document.getElementById('cert-grid');
C.certifications.forEach(cert => {
  const el = document.createElement('div');
  el.className = 'cert-flip';
  el.innerHTML = `
    <div class="cert-flipper">
      <div class="cert-front">
        <div class="cert-badge-glow" style="--cert-color:${cert.color}"></div>
        <img src="${cert.badgeUrl}" alt="${cert.title}" onerror="this.src='https://placehold.co/80x80/0f172a/38bdf8?text=CERT'" />
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

// Projects
const projGrid = document.getElementById('projects-grid');
C.projects.forEach(p => {
  const el = document.createElement('article');
  el.className = 'proj-card';
  el.style.setProperty('--proj-color', p.color);
  el.innerHTML = `
    <div class="proj-title">${p.title}</div>
    <div class="proj-client">${p.client}</div>
    <div class="proj-desc">${p.desc}</div>
    <div class="proj-tags">${p.tags.map(t=>`<span class="proj-tag">${t}</span>`).join('')}</div>`;
  projGrid.appendChild(el);
});

// Contact links
const clEl = document.getElementById('contact-links');
clEl.innerHTML = `
  <a href="mailto:${C.email}" class="contact-link">✉ ${C.email}</a>
  <a href="${C.linkedin}" target="_blank" rel="noopener" class="contact-link">🔗 LinkedIn: ujasdubal</a>
  <a href="${C.github}" target="_blank" rel="noopener" class="contact-link">⬡ GitHub: ujas-dev</a>
  <span class="contact-link">📍 ${C.location}</span>`;

// ─── Utility ──────────────────────────────────────────────────
function scrollTo(hash) {
  const el = document.querySelector(hash);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.scrollTo = scrollTo;

// ─── Custom Cursor ────────────────────────────────────────────
const dot = document.getElementById('cursor-dot');
const glow = document.getElementById('cursor-glow');
let mx = -200, my = -200, glx = -200, gly = -200;

document.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
document.addEventListener('pointerleave', () => { mx = -200; my = -200; });

;(function cursorLoop() {
  glx += (mx - glx) * 0.14;
  gly += (my - gly) * 0.14;
  dot.style.left = mx + 'px';
  dot.style.top = my + 'px';
  glow.style.left = glx + 'px';
  glow.style.top = gly + 'px';
  requestAnimationFrame(cursorLoop);
})();

document.querySelectorAll('a,button,.holo-card,.cert-flip,.proj-card,.skill-orb,.mag-btn').forEach(el => {
  el.addEventListener('pointerenter', () => document.body.classList.add('hovering'));
  el.addEventListener('pointerleave', () => document.body.classList.remove('hovering'));
});

// ─── Magnetic Buttons ─────────────────────────────────────────
document.querySelectorAll('.mag-btn').forEach(btn => {
  btn.addEventListener('pointermove', e => {
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / 4;
    const y = (e.clientY - r.top - r.height / 2) / 4;
    btn.style.transform = `translate(${x}px, ${y}px) translateY(-2px)`;
  });
  btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
});

// ─── Holographic 3D Tilt Cards ────────────────────────────────
document.querySelectorAll('[data-holo]').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rotX = (y - 0.5) * -20;
    const rotY = (x - 0.5) * 20;
    card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`;
    card.style.boxShadow = `${(x - 0.5) * -20}px ${(y - 0.5) * -20}px 40px rgba(0,0,0,0.5), var(--glow-cyan)`;
    const glare = card.querySelector('.holo-glare');
    if (glare) {
      glare.style.background = `radial-gradient(circle at ${x*100}% ${y*100}%, rgba(255,255,255,0.1) 0%, transparent 55%)`;
    }
  });
  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
    card.style.boxShadow = '';
    const glare = card.querySelector('.holo-glare');
    if (glare) glare.style.background = '';
  });
});

// ─── Keyboard Navigation ──────────────────────────────────────
const SECTIONS = ['#hero','#about','#skills','#experience','#certifications','#projects','#contact'];
let secIdx = 0;
function jumpSec(i) {
  const c = Math.max(0, Math.min(SECTIONS.length - 1, i));
  secIdx = c;
  scrollTo(SECTIONS[c]);
}
window.addEventListener('keydown', e => {
  const k = e.key;
  if (k === 'ArrowDown' || k === 's') { e.preventDefault(); jumpSec(secIdx + 1); }
  else if (k === 'ArrowUp' || k === 'w') { e.preventDefault(); jumpSec(secIdx - 1); }
  else if (k >= '1' && k <= '7') jumpSec(parseInt(k) - 1);
  else if (k === 'Escape') jumpSec(0);
});
const secObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) secIdx = parseInt(e.target.dataset.sec || 0); });
}, { threshold: 0.4 });
document.querySelectorAll('.section[data-sec]').forEach(s => secObserver.observe(s));

// ─── GSAP ScrollTrigger Reveals ──────────────────────────────
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.holo-card,.exp-item,.cert-flip,.proj-card').forEach((el, i) => {
    gsap.from(el, {
      opacity: 0, y: 30, rotateX: -8, duration: 0.7,
      delay: (i % 4) * 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    });
  });

  // Skill bar animation
  ScrollTrigger.create({
    trigger: '#skills',
    start: 'top 70%',
    onEnter: () => {
      document.querySelectorAll('.skill-bar-fill').forEach(b => {
        b.style.width = b.dataset.width + '%';
      });
    }
  });
}

// ─── Terminal Typing Effect ───────────────────────────────────
const lines = [
  `whoami`,
  `echo "${C.name} | ${C.title}"`,
  `aws s3 ls s3://ujas-data-pipelines/ | wc -l`,
  `spark-submit --master yarn pipeline.py --env prod`,
];
let lineIdx = 0, charIdx = 0, typing = true;
const tText = document.getElementById('t-text');

function typeNext() {
  if (lineIdx >= lines.length) { lineIdx = 0; }
  const line = lines[lineIdx];
  if (typing) {
    if (charIdx < line.length) {
      tText.textContent += line[charIdx++];
      setTimeout(typeNext, 55 + Math.random() * 30);
    } else {
      typing = false;
      setTimeout(typeNext, 1400);
    }
  } else {
    if (charIdx > 0) {
      tText.textContent = line.slice(0, --charIdx);
      setTimeout(typeNext, 18);
    } else {
      typing = true;
      lineIdx++;
      setTimeout(typeNext, 300);
    }
  }
}
setTimeout(typeNext, 600);

// ─── THREE.JS GPU PARTICLE FIELD (50k particles) ─────────────
(function initParticleField() {
  if (!window.THREE) return;
  const canvas = document.getElementById('bg');
  const w = window.innerWidth, h = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 150);
  camera.position.z = 30;

  const COUNT = 50000;
  const positions = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 80;
    positions[i*3+1] = (Math.random() - 0.5) * 80;
    positions[i*3+2] = (Math.random() - 0.5) * 60;
    velocities[i*3]   = (Math.random() - 0.5) * 0.01;
    velocities[i*3+1] = (Math.random() - 0.5) * 0.01;
    velocities[i*3+2] = (Math.random() - 0.5) * 0.008;
    const mix = Math.random();
    colors[i*3]   = mix > 0.6 ? 0.22 : (mix > 0.3 ? 0.65 : 0.88);
    colors[i*3+1] = mix > 0.6 ? 0.74 : (mix > 0.3 ? 0.47 : 0.11);
    colors[i*3+2] = mix > 0.6 ? 0.98 : (mix > 0.3 ? 0.98 : 0.27);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.12, vertexColors: true, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // Mouse influence
  let mxN = 0, myN = 0;
  document.addEventListener('pointermove', e => {
    mxN = (e.clientX / window.innerWidth - 0.5) * 2;
    myN = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Resize
  window.addEventListener('resize', () => {
    const w2 = window.innerWidth, h2 = window.innerHeight;
    renderer.setSize(w2, h2);
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
  });

  // Animate
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.0008;
    const pos = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   += velocities[i*3]   + Math.sin(t + i * 0.01) * 0.002 + mxN * 0.003;
      pos[i*3+1] += velocities[i*3+1] + Math.cos(t + i * 0.013) * 0.002 + myN * 0.003;
      pos[i*3+2] += velocities[i*3+2];
      // Wrap particles
      if (pos[i*3] > 40) pos[i*3] = -40;
      if (pos[i*3] < -40) pos[i*3] = 40;
      if (pos[i*3+1] > 40) pos[i*3+1] = -40;
      if (pos[i*3+1] < -40) pos[i*3+1] = 40;
      if (pos[i*3+2] > 30) pos[i*3+2] = -30;
      if (pos[i*3+2] < -30) pos[i*3+2] = 30;
    }
    geo.attributes.position.needsUpdate = true;
    particles.rotation.y += 0.00015 + mxN * 0.0005;
    camera.position.x += (mxN * 6 - camera.position.x) * 0.04;
    camera.position.y += (myN * 4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  animate();
})();

// ─── 4D TESSERACT (mathematically correct) ────────────────────
(function initTesseract() {
  if (!window.THREE) return;
  const wrap = document.getElementById('tesseract-wrap');
  const canvas = document.getElementById('tesseract-canvas');
  const W = 340, H = 340;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.z = 4;

  // Ambient
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  // 4D tesseract: 16 vertices in R^4
  function makeVerts4D() {
    const v = [];
    for (let i = 0; i < 16; i++) {
      v.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1,
      ]);
    }
    return v;
  }

  // Edges: pairs that differ in exactly 1 bit
  function makeEdges4D(verts) {
    const edges = [];
    for (let a = 0; a < 16; a++)
      for (let b = a+1; b < 16; b++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) if (verts[a][k] !== verts[b][k]) diff++;
        if (diff === 1) edges.push([a, b]);
      }
    return edges;
  }

  const verts4D = makeVerts4D();
  const edges4D = makeEdges4D(verts4D);

  // 4D rotation matrices
  function rot4D(v, plane, angle) {
    const [i,j] = plane;
    const c = Math.cos(angle), s = Math.sin(angle);
    const u = [...v];
    u[i] = c * v[i] - s * v[j];
    u[j] = s * v[i] + c * v[j];
    return u;
  }

  // Project 4D → 3D via perspective
  function project4to3(v) {
    const w = 2.0 / (2.0 - v[3]);
    return new THREE.Vector3(v[0] * w, v[1] * w, v[2] * w);
  }

  // Build line objects
  const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
  const lineObjs = edges4D.map(() => {
    const geo = new THREE.BufferGeometry();
    const pts = [new THREE.Vector3(), new THREE.Vector3()];
    geo.setFromPoints(pts);
    const line = new THREE.Line(geo, lineMat.clone());
    scene.add(line);
    return { line, geo };
  });

  // Vertex glow spheres
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
  const sphereGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const spheres = verts4D.map(() => {
    const mesh = new THREE.Mesh(sphereGeo, sphereMat.clone());
    scene.add(mesh);
    return mesh;
  });

  // Orbit Controls (manual for zero-dependency)
  let isDragging = false, lastMX = 0, lastMY = 0;
  let rotX = 0, rotY = 0, zoom = 1;

  canvas.addEventListener('pointerdown', e => { isDragging = true; lastMX = e.clientX; lastMY = e.clientY; });
  canvas.addEventListener('pointerup', () => { isDragging = false; });
  canvas.addEventListener('pointermove', e => {
    if (!isDragging) return;
    rotY += (e.clientX - lastMX) * 0.01;
    rotX += (e.clientY - lastMY) * 0.01;
    lastMX = e.clientX; lastMY = e.clientY;
  });
  canvas.addEventListener('wheel', e => {
    zoom = Math.max(0.5, Math.min(3, zoom + e.deltaY * 0.002));
    camera.position.z = 4 * zoom;
  });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.006;

    // Auto 4D rotations in multiple planes
    let rotated = verts4D.map(v => {
      let u = v;
      u = rot4D(u, [0,3], t * 0.7);
      u = rot4D(u, [1,2], t * 0.5);
      u = rot4D(u, [0,2], t * 0.3);
      u = rot4D(u, [1,3], t * 0.4);
      return u;
    });

    // Manual 3D rotation overlay from drag
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    const projected = rotated.map(v => {
      let p = project4to3(v);
      // Apply drag rotation
      let y2 = cosX * p.y - sinX * p.z;
      let z2 = sinX * p.y + cosX * p.z;
      let x2 = cosY * p.x + sinY * z2;
      let z3 = -sinY * p.x + cosY * z2;
      return new THREE.Vector3(x2, y2, z3);
    });

    // Update edges
    edges4D.forEach(([a,b], i) => {
      const { line, geo } = lineObjs[i];
      geo.setFromPoints([projected[a], projected[b]]);
    });

    // Update vertex spheres
    projected.forEach((p, i) => { spheres[i].position.copy(p); });

    renderer.render(scene, camera);
  }
  animate();
})();
