/* ============================================================
   UJAS DUBAL PORTFOLIO — main.js  (No GSAP, No scrollTo conflict)
   ============================================================ */

(function () {
  'use strict';

  /* ── Shorthand helpers ──────────────────────────────────── */
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return document.querySelectorAll(sel); };
  var CFG = window.PORTFOLIO_CONFIG;

  /* ─────────────────────────────────────────────────────────
     1. POPULATE DOM FROM CONFIG
  ───────────────────────────────────────────────────────── */
  $('#yr').textContent = new Date().getFullYear();
  $('#ava-img').src     = CFG.avatarUrl;
  $('#hname').textContent   = CFG.name;
  $('#htitle').textContent  = CFG.title;
  $('#htagline').textContent = CFG.tagline;

  /* Stats */
  CFG.stats.forEach(function (s) {
    var d = document.createElement('div');
    d.className = 'sitem reveal';
    d.innerHTML = '<span class="sv" data-target="' + s.value +
                  '" data-suffix="' + s.suffix + '">0' + s.suffix + '</span>' +
                  '<span class="sl">' + s.label + '</span>';
    $('#stats').appendChild(d);
  });

  /* Skills */
  CFG.skills.forEach(function (s) {
    var o = document.createElement('div');
    o.className = 'orb reveal';
    o.textContent = s.name;
    o.style.setProperty('--oc', s.color + '30');
    o.style.borderColor = s.color + '55';
    $('#orbs-wrap').appendChild(o);

    var r = document.createElement('div');
    r.className = 'bar-row reveal';
    r.innerHTML = '<div class="bar-name">' + s.name + '</div>' +
                  '<div class="bar-track"><div class="bar-fill" style="background:linear-gradient(to right,' +
                  s.color + ',' + s.color + '88)" data-w="' + s.level + '"></div></div>' +
                  '<div class="bar-pct">' + s.level + '%</div>';
    $('#bars-wrap').appendChild(r);
  });

  /* Experience */
  CFG.experience.forEach(function (e) {
    var el = document.createElement('div');
    el.className = 'exp-item';
    el.innerHTML = '<div class="exp-meta"><div class="ec">' + e.company + '</div>' +
                   '<div class="ep">' + e.period + '</div>' +
                   '<div class="el">' + e.location + '</div></div>' +
                   '<div class="exp-body reveal"><div class="er">' + e.role + '</div>' +
                   '<ul class="ehl">' + e.highlights.map(function (h) {
                     return '<li>' + h + '</li>';
                   }).join('') + '</ul></div>';
    $('#exp-tl').appendChild(el);
  });

  /* Certifications */
  CFG.certifications.forEach(function (c) {
    var el = document.createElement('div');
    el.className = 'cflip reveal';
    el.innerHTML =
      '<div class="cflipper">' +
        '<div class="cfront">' +
          '<div class="cbglow" style="--cc:' + c.color + '"></div>' +
          '<img src="' + c.badgeUrl + '" alt="' + c.title +
               '" onerror="this.src=\'https://placehold.co/76x76/0f172a/38bdf8?text=CERT\'" />' +
          '<div class="ctitle">' + c.title + '</div>' +
          '<div class="cissuer">' + c.issuer + '</div>' +
          '<div class="cyear">' + c.year + '</div>' +
        '</div>' +
        '<div class="cback" style="border-color:' + c.color + '44">' +
          '<div class="cbglow" style="--cc:' + c.color + '"></div>' +
          '<h4>' + c.title + '</h4>' +
          '<p>' + c.issuer + ' · ' + c.year + '</p>' +
          '<a href="' + c.verifyUrl + '" target="_blank" rel="noopener">Verify Certificate ↗</a>' +
        '</div>' +
      '</div>';
    $('#cert-grid').appendChild(el);
  });

  /* Projects */
  CFG.projects.forEach(function (p) {
    var el = document.createElement('article');
    el.className = 'pcard reveal';
    el.style.setProperty('--pc', p.color);
    el.innerHTML = '<div class="ptitle">' + p.title + '</div>' +
                   '<div class="pclient">' + p.client + '</div>' +
                   '<div class="pdesc">' + p.desc + '</div>' +
                   '<div class="ptags">' +
                   p.tags.map(function (t) { return '<span class="ptag">' + t + '</span>'; }).join('') +
                   '</div>';
    $('#proj-grid').appendChild(el);
  });

  /* Contact links */
  $('#clinks').innerHTML =
    '<a href="mailto:' + CFG.email + '" class="clink">✉ ' + CFG.email + '</a>' +
    '<a href="' + CFG.linkedin + '" target="_blank" rel="noopener" class="clink">🔗 linkedin.com/in/ujasdubal</a>' +
    '<a href="' + CFG.github + '" target="_blank" rel="noopener" class="clink">⬡ github.com/ujas-dev</a>' +
    '<span class="clink">📍 ' + CFG.location + '</span>';

  /* ─────────────────────────────────────────────────────────
     2. NAVIGATION  — named goTo(), NEVER scrollTo()
  ───────────────────────────────────────────────────────── */
  function goTo(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Wire data-goto buttons */
  $$('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () { goTo(btn.dataset.goto); });
  });

  /* Wire nav links */
  $$('.nl').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var id = a.getAttribute('href').replace('#', '');
      goTo(id);
    });
  });

  /* Logo */
  var logoWrap = $('.logo-wrap');
  if (logoWrap) {
    logoWrap.addEventListener('click', function (e) {
      e.preventDefault();
      goTo('hero');
    });
  }

  /* Keyboard */
  var SECS = ['hero','about','skills','experience','certifications','projects','contact'];
  var sidx  = 0;

  function gotoIdx(i) {
    sidx = Math.max(0, Math.min(SECS.length - 1, i));
    goTo(SECS[sidx]);
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); gotoIdx(sidx + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); gotoIdx(sidx - 1); }
    else if (e.key >= '1' && e.key <= '7') { gotoIdx(parseInt(e.key, 10) - 1); }
    else if (e.key === 'Escape') { gotoIdx(0); }
  });

  /* Track current section */
  var secIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        var si = en.target.dataset.si;
        if (si !== undefined) sidx = parseInt(si, 10);
      }
    });
  }, { threshold: 0.4 });
  $$('.sec[data-si]').forEach(function (s) { secIO.observe(s); });

  /* ─────────────────────────────────────────────────────────
     3. SCROLL REVEAL (pure IntersectionObserver, zero GSAP)
  ───────────────────────────────────────────────────────── */
  var revIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        /* Trigger skill bars when the skills section enters */
        if (en.target.closest('#skills')) {
          $$('.bar-fill').forEach(function (b) {
            b.style.width = b.dataset.w + '%';
          });
        }
        /* Animate stat counters when visible */
        if (en.target.classList.contains('sitem')) {
          var sv = en.target.querySelector('.sv');
          if (sv && !sv.dataset.done) {
            sv.dataset.done = '1';
            var target = parseFloat(sv.dataset.target);
            var suffix = sv.dataset.suffix || '';
            var decimal = target % 1 !== 0;
            var cur = 0, inc = target / 60;
            (function step() {
              cur += inc;
              if (cur >= target) { sv.textContent = (decimal ? target.toFixed(1) : target) + suffix; return; }
              sv.textContent = (decimal ? cur.toFixed(1) : Math.floor(cur)) + suffix;
              requestAnimationFrame(step);
            })();
          }
        }
        revIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });

  /* Observe all .reveal elements (including dynamically created ones) */
  function observeReveal() {
    $$('.reveal').forEach(function (el) { revIO.observe(el); });
  }
  /* Run after DOM population */
  setTimeout(observeReveal, 50);

  /* ─────────────────────────────────────────────────────────
     4. CUSTOM CURSOR
  ───────────────────────────────────────────────────────── */
  var cdot  = $('#cdot');
  var cglow = $('#cglow');
  var cmx = -300, cmy = -300, cgx = -300, cgy = -300;

  if (cdot && cglow) {
    document.addEventListener('pointermove', function (e) {
      cmx = e.clientX; cmy = e.clientY;
      cdot.style.left = cmx + 'px';
      cdot.style.top  = cmy + 'px';
    });
    (function glowLoop() {
      cgx += (cmx - cgx) * 0.13;
      cgy += (cmy - cgy) * 0.13;
      cglow.style.left = cgx + 'px';
      cglow.style.top  = cgy + 'px';
      requestAnimationFrame(glowLoop);
    })();

    $$('a, button, .hcard, .cflip, .pcard, .orb, .nl').forEach(function (el) {
      el.addEventListener('pointerenter', function () { document.body.classList.add('hov'); });
      el.addEventListener('pointerleave', function () { document.body.classList.remove('hov'); });
    });
  }

  /* ─────────────────────────────────────────────────────────
     5. MAGNETIC BUTTONS
  ───────────────────────────────────────────────────────── */
  $$('.mag').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width  / 2) / 5;
      var y = (e.clientY - r.top  - r.height / 2) / 5;
      btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
  });

  /* ─────────────────────────────────────────────────────────
     6. HOLOGRAPHIC 3D TILT  (per-card, real-time)
  ───────────────────────────────────────────────────────── */
  $$('[data-holo]').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r    = card.getBoundingClientRect();
      var xp   = (e.clientX - r.left)  / r.width;
      var yp   = (e.clientY - r.top)   / r.height;
      var rotX = (yp - 0.5) * -22;
      var rotY = (xp - 0.5) *  22;
      card.style.transform =
        'perspective(700px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale3d(1.04,1.04,1.04)';
      var gl = card.querySelector('.glare');
      if (gl) gl.style.background =
        'radial-gradient(circle at ' + (xp * 100) + '% ' + (yp * 100) + '%, rgba(255,255,255,.11) 0%, transparent 55%)';
    });
    card.addEventListener('pointerleave', function () {
      card.style.transform = '';
      var gl = card.querySelector('.glare');
      if (gl) gl.style.background = '';
    });
  });

  /* ─────────────────────────────────────────────────────────
     7. TERMINAL TYPING
  ───────────────────────────────────────────────────────── */
  (function () {
    var el = $('#ttext');
    if (!el) return;
    var lines = [
      'whoami  # ' + CFG.name,
      'aws s3 ls s3://ujas-data-pipelines/',
      'spark-submit pipeline.py --master yarn',
      'SELECT COUNT(*) FROM analytics.fact_sales;',
      'git push origin feature/etl-optimization',
      'airflow dags trigger daily_redshift_load'
    ];
    var li = 0, ci = 0, typing = true;
    function tick() {
      if (li >= lines.length) li = 0;
      var line = lines[li];
      if (typing) {
        if (ci < line.length) { el.textContent += line[ci++]; setTimeout(tick, 46 + Math.random() * 28); }
        else { typing = false; setTimeout(tick, 1600); }
      } else {
        if (ci > 0) { el.textContent = line.slice(0, --ci); setTimeout(tick, 14); }
        else { typing = true; li++; setTimeout(tick, 320); }
      }
    }
    setTimeout(tick, 800);
  })();

  /* ─────────────────────────────────────────────────────────
     8. THREE.JS  — 50k PARTICLE FIELD  (no scrollTo anywhere)
  ───────────────────────────────────────────────────────── */
  (function () {
    if (!window.THREE) return;
    var canvas = $('#bg');
    if (!canvas) return;

    var W = window.innerWidth, H = window.innerHeight;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 150);
    camera.position.z = 30;

    var N   = 50000;
    var pos = new Float32Array(N * 3);
    var vel = new Float32Array(N * 3);
    var col = new Float32Array(N * 3);

    for (var i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - .5) * 80;
      pos[i*3+1] = (Math.random() - .5) * 80;
      pos[i*3+2] = (Math.random() - .5) * 60;
      vel[i*3]   = (Math.random() - .5) * .01;
      vel[i*3+1] = (Math.random() - .5) * .01;
      vel[i*3+2] = (Math.random() - .5) * .008;
      var m = Math.random();
      if (m > .66) { col[i*3]=.22; col[i*3+1]=.74; col[i*3+2]=.98; }        // cyan
      else if (m > .33) { col[i*3]=.65; col[i*3+1]=.47; col[i*3+2]=.98; }   // purple
      else { col[i*3]=.88; col[i*3+1]=.11; col[i*3+2]=.28; }                 // pink
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    var pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: .13, vertexColors: true, transparent: true, opacity: .72,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(pts);

    var mxn = 0, myn = 0;
    document.addEventListener('pointermove', function (e) {
      mxn = (e.clientX / window.innerWidth  - .5) * 2;
      myn = -(e.clientY / window.innerHeight - .5) * 2;
    });
    window.addEventListener('resize', function () {
      W = window.innerWidth; H = window.innerHeight;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    });

    var t = 0;
    (function loop() {
      requestAnimationFrame(loop);
      t += .0007;
      for (var j = 0; j < N; j++) {
        pos[j*3]   += vel[j*3]   + Math.sin(t + j*.011)*.002 + mxn*.003;
        pos[j*3+1] += vel[j*3+1] + Math.cos(t + j*.013)*.002 + myn*.003;
        pos[j*3+2] += vel[j*3+2];
        if (pos[j*3]   >  40) pos[j*3]   = -40;
        if (pos[j*3]   < -40) pos[j*3]   =  40;
        if (pos[j*3+1] >  40) pos[j*3+1] = -40;
        if (pos[j*3+1] < -40) pos[j*3+1] =  40;
        if (pos[j*3+2] >  30) pos[j*3+2] = -30;
        if (pos[j*3+2] < -30) pos[j*3+2] =  30;
      }
      geo.attributes.position.needsUpdate = true;
      pts.rotation.y += .00012 + mxn * .0004;
      pts.rotation.x += myn * .0002;
      camera.position.x += (mxn * 5   - camera.position.x) * .04;
      camera.position.y += (myn * 3.5  - camera.position.y) * .04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    })();
  })();

  /* ─────────────────────────────────────────────────────────
     9. 4D TESSERACT  (mathematically correct, drag+scroll)
  ───────────────────────────────────────────────────────── */
  (function () {
    if (!window.THREE) return;
    var canvas = $('#t4d');
    if (!canvas) return;

    var SZ = 340;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(SZ, SZ);

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, .01, 100);
    camera.position.z = 4.5;
    scene.add(new THREE.AmbientLight(0xffffff, .5));

    /* 16 vertices of a 4D hypercube */
    var V4 = [];
    for (var i = 0; i < 16; i++) {
      V4.push([ (i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1, (i&8)?1:-1 ]);
    }

    /* Edges: pairs differing in exactly 1 bit */
    var E4 = [];
    for (var a = 0; a < 16; a++) {
      for (var b = a+1; b < 16; b++) {
        var d = 0;
        for (var k = 0; k < 4; k++) { if (V4[a][k] !== V4[b][k]) d++; }
        if (d === 1) E4.push([a,b]);
      }
    }

    /* 4D rotation in plane (ii,jj) */
    function rot4(v, ii, jj, ang) {
      var u = v.slice(), c = Math.cos(ang), s = Math.sin(ang);
      u[ii] = c*v[ii] - s*v[jj];
      u[jj] = s*v[ii] + c*v[jj];
      return u;
    }

    /* 4D → 3D perspective */
    function proj4(v) {
      var w = 2.5 / (2.5 - v[3]);
      return new THREE.Vector3(v[0]*w, v[1]*w, v[2]*w);
    }

    /* Build line objects */
    var lines = E4.map(function (e) {
      var col = (V4[e[0]][3] + V4[e[1]][3]) > 0 ? 0x38bdf8 : 0xe11d48;
      var mat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .9 });
      var geo = new THREE.BufferGeometry();
      geo.setFromPoints([ new THREE.Vector3(), new THREE.Vector3() ]);
      var ln  = new THREE.Line(geo, mat);
      scene.add(ln);
      return { ln: ln, geo: geo };
    });

    /* Vertex spheres */
    var sg = new THREE.SphereGeometry(.055, 8, 8);
    var spheres = V4.map(function (v) {
      var sm = new THREE.MeshBasicMaterial({ color: v[3] > 0 ? 0x38bdf8 : 0xe11d48 });
      var ms = new THREE.Mesh(sg, sm);
      scene.add(ms);
      return ms;
    });

    /* Drag state */
    var drag = false, ldx = 0, ldy = 0, drx = 0, dry = 0, zoom = 1;

    canvas.addEventListener('pointerdown', function (e) {
      drag = true; ldx = e.clientX; ldy = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointerup',   function () { drag = false; });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      dry += (e.clientX - ldx) * .012;
      drx += (e.clientY - ldy) * .012;
      ldx = e.clientX; ldy = e.clientY;
    });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoom = Math.max(.5, Math.min(3, zoom + e.deltaY * .002));
      camera.position.z = 4.5 * zoom;
    }, { passive: false });

    var tt = 0;
    (function loop() {
      requestAnimationFrame(loop);
      tt += .007;

      /* 4 simultaneous 4D hyperplane rotations */
      var rv = V4.map(function (v) {
        var u = v;
        u = rot4(u, 0, 3, tt * .55);
        u = rot4(u, 1, 2, tt * .40);
        u = rot4(u, 0, 2, tt * .28);
        u = rot4(u, 1, 3, tt * .35);
        return u;
      });

      /* Project to 3D */
      var p3 = rv.map(proj4);

      /* Apply drag rotation */
      var cx = Math.cos(drx), sx = Math.sin(drx);
      var cy = Math.cos(dry), sy = Math.sin(dry);
      p3 = p3.map(function (p) {
        var y1 = cx*p.y - sx*p.z, z1 = sx*p.y + cx*p.z;
        var x2 = cy*p.x + sy*z1, z2 = -sy*p.x + cy*z1;
        return new THREE.Vector3(x2, y1, z2);
      });

      /* Update edges */
      E4.forEach(function (e, i) {
        lines[i].geo.setFromPoints([ p3[e[0]], p3[e[1]] ]);
      });

      /* Update spheres */
      p3.forEach(function (p, i) { spheres[i].position.copy(p); });

      renderer.render(scene, camera);
    })();
  })();

})(); // end IIFE
