// YEAR
document.getElementById("year").textContent = new Date().getFullYear();

// Custom cursor
const cursorDot = document.querySelector(".cursor-dot");
const cursorOutline = document.querySelector(".cursor-outline");
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let outlineX = mouseX;
let outlineY = mouseY;

document.addEventListener("pointermove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursorDot) {
    cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  }
});

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

function animateCursor() {
  outlineX = lerp(outlineX, mouseX, 0.16);
  outlineY = lerp(outlineY, mouseY, 0.16);
  if (cursorOutline) {
    cursorOutline.style.transform = `translate3d(${outlineX}px, ${outlineY}px, 0)`;
  }
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Hover state
const hoverTargets = document.querySelectorAll("a, button, .magnetic, .nav-link, .logo");
hoverTargets.forEach((el) => {
  el.addEventListener("pointerenter", () => {
    document.body.classList.add("cursor-hover");
  });
  el.addEventListener("pointerleave", () => {
    document.body.classList.remove("cursor-hover");
  });
});

// Magnetic buttons
document.querySelectorAll(".magnetic").forEach((btn) => {
  const strength = 20;
  btn.addEventListener("pointermove", (e) => {
    const rect = btn.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${relX / strength}px, ${relY / strength}px)`;
  });
  btn.addEventListener("pointerleave", () => {
    btn.style.transform = "translate(0,0)";
  });
});

// Smooth scroll for buttons with data-scroll-target
document.querySelectorAll("[data-scroll-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.querySelector(btn.dataset.scrollTarget);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// Keyboard navigation between sections
const sections = Array.from(document.querySelectorAll(".section"));
let currentSectionIndex = 0;

function scrollToSection(index) {
  const clamped = Math.max(0, Math.min(sections.length - 1, index));
  const section = sections[clamped];
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    currentSectionIndex = clamped;
  }
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "arrowdown" || key === "s") {
    scrollToSection(currentSectionIndex + 1);
  } else if (key === "arrowup" || key === "w") {
    scrollToSection(currentSectionIndex - 1);
  } else if (key >= "1" && key <= "6") {
    const targetIndex = parseInt(key, 10) - 1;
    scrollToSection(targetIndex);
  } else if (key === "escape") {
    scrollToSection(0);
  }
});

// Track current section by scroll
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idxAttr = entry.target.getAttribute("data-section-index");
        if (idxAttr) currentSectionIndex = parseInt(idxAttr, 10) - 1;
      }
    });
  },
  { threshold: 0.5 }
);

sections.forEach((section) => io.observe(section));

// Parallax on mouse move
const parallaxEls = document.querySelectorAll("[data-parallax]");
window.addEventListener("pointermove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;
  parallaxEls.forEach((el, i) => {
    const depth = (i + 1) * 8;
    el.style.transform = `translate3d(${-(x * depth)}px, ${-(y * depth)}px, 0)`;
  });
});

// Scroll-based reveal using GSAP
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray(".section").forEach((section) => {
    const items = section.querySelectorAll(
      ".about-card, .skill-column, .timeline-item, .project-card, .contact-card, .contact-form"
    );
    if (items.length === 0) return;
    gsap.from(items, {
      opacity: 0,
      y: 24,
      duration: 0.7,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });
  });
}

// THREE.JS 3D BACKGROUND
let scene, camera, renderer, planet, ring, orbitingCubes;

function initThree() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas || !window.THREE) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
  camera.position.set(0, 0, 8);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);

  // Atmosphere-like background fog
  scene.fog = new THREE.FogExp2(0x020617, 0.12);

  // Lighting
  const ambient = new THREE.AmbientLight(0x64748b, 0.8);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
  dirLight.position.set(3, 6, 4);
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0xe11d48, 0.8);
  rimLight.position.set(-4, -5, -3);
  scene.add(rimLight);

  // Data planet
  const planetGeo = new THREE.IcosahedronGeometry(2.2, 1);
  const planetMat = new THREE.MeshStandardMaterial({
    color: 0x020617,
    emissive: 0x0f172a,
    roughness: 0.4,
    metalness: 0.8,
    wireframe: false,
  });
  planet = new THREE.Mesh(planetGeo, planetMat);
  scene.add(planet);

  // Wireframe overlay
  const wireGeo = new THREE.IcosahedronGeometry(2.22, 3);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  const wireframe = new THREE.Mesh(wireGeo, wireMat);
  planet.add(wireframe);

  // Ring / orbit
  const ringGeo = new THREE.TorusGeometry(3.5, 0.06, 16, 100);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    roughness: 0.35,
    metalness: 0.9,
  });
  ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.4;
  scene.add(ring);

  // Orbiting data cubes
  orbitingCubes = [];
  const cubeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  for (let i = 0; i < 18; i++) {
    const cubeMat = new THREE.MeshStandardMaterial({
      color: i % 3 === 0 ? 0xe11d48 : 0x38bdf8,
      emissive: i % 3 === 0 ? 0x9f1239 : 0x0284c7,
      metalness: 0.9,
      roughness: 0.2,
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    const angle = (i / 18) * Math.PI * 2;
    const radius = 3.5 + (Math.random() - 0.5) * 0.4;
    cube.userData = { angle, radius, speed: 0.25 + Math.random() * 0.3 };
    cube.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 0.6,
      Math.sin(angle) * radius
    );
    scene.add(cube);
    orbitingCubes.push(cube);
  }

  // Subtle starfield
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 700;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3 + 0] = (Math.random() - 0.5) * 60;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.045,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Resize
  window.addEventListener("resize", () => {
    const w2 = window.innerWidth;
    const h2 = window.innerHeight;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });

  // Mouse-based camera parallax
  let targetRotX = 0;
  let targetRotY = 0;
  window.addEventListener("pointermove", (e) => {
    const normX = e.clientX / window.innerWidth - 0.5;
    const normY = e.clientY / window.innerHeight - 0.5;
    targetRotY = normX * 0.4;
    targetRotX = normY * 0.2;
  });

  function render() {
    requestAnimationFrame(render);

    // Planet rotation
    planet.rotation.y += 0.0018;
    planet.rotation.x += 0.0005;

    // Ring slow tilt
    ring.rotation.z += 0.0006;

    // Orbiting cubes animation
    const t = performance.now() / 1000;
    orbitingCubes.forEach((cube) => {
      const { radius, speed } = cube.userData;
      const a = cube.userData.angle + t * speed * 0.4;
      cube.position.x = Math.cos(a) * radius;
      cube.position.z = Math.sin(a) * radius;
      cube.position.y = Math.sin(a * 2.0) * 0.5;
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.015;
    });

    // Camera parallax
    camera.position.x += (targetRotY * 4 - camera.position.x) * 0.05;
    camera.position.y += (-targetRotX * 3 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  render();
}

initThree();
