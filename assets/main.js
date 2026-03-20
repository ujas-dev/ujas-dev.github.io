/* ================================================================
   UJAS DUBAL PORTFOLIO — main.js  COMPLETE FINAL VERSION
   No GSAP. No ScrollTrigger. No scrollTo conflict. Ever.
   ================================================================ */
(function () {
  'use strict';

  var CFG = window.CFG;

  /* ── helpers ────────────────────────────────────────────── */
  function qs(s)  { return document.querySelector(s); }
  function qsa(s) { return document.querySelectorAll(s); }

  /* ── Safe scroll — NEVER named scrollTo ─────────────────── */
  function goTo(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ═══════════════════════════════════════════════════════════
     1. LOADER
  ═══════════════════════════════════════════════════════════ */
  var loaderBar = qs('#loader-bar');
  var loadPct = 0;
  var loadTimer = setInterval(function () {
    loadPct += Math.random() * 18;
    if (loadPct > 100) loadPct = 100;
    if (loaderBar) loaderBar.style.width = loadPct + '%';
    if (loadPct >= 100) {
      clearInterval(loadTimer);
      setTimeout(function () {
        var loader = qs('#loader');
        if (loader) {
          loader.classList.add('done');
          setTimeout(function () { loader.style.display = 'none'; }, 700);
        }
        showBot("Hey! I'm AIDA 🤖 Your AI Data guide. Scroll or press ↓ to explore Ujas's 3D world!", true);
      }, 400);
    }
  }, 120);

  /* ═══════════════════════════════════════════════════════════
     2. TEXT-TO-SPEECH (Web Speech API)
  ═══════════════════════════════════════════════════════════ */
  var synth = window.speechSynthesis || null;
  var selectedVoice = null;

  function loadVoice() {
    if (!synth) return;
    var voices = synth.getVoices();
    selectedVoice =
      voices.find(function (v) { return v.name.includes('Google US English'); }) ||
      voices.find(function (v) { return v.lang === 'en-US' && !v.localService; }) ||
      voices.find(function (v) { return v.lang && v.lang.startsWith('en'); }) ||
      voices[0] || null;
  }
  loadVoice();
  if (synth && synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoice;

  function speak(text) {
    if (!synth || !text) return;
    synth.cancel();
    loadVoice();
    var utt    = new SpeechSynthesisUtterance(String(text));
    utt.lang   = 'en-US';
    utt.rate   = 0.91;
    utt.pitch  = 1.05;
    utt.volume = 1;
    if (selectedVoice) utt.voice = selectedVoice;
    synth.speak(utt);
  }

  /* ═══════════════════════════════════════════════════════════
     3. ROBOT GUIDE (AIDA)
  ═══════════════════════════════════════════════════════════ */
  var botGuide  = qs('#bot-guide');
  var botText   = qs('#bot-text');
  var botSpeak  = qs('#bot-speak');
  var botDismiss= qs('#bot-dismiss');
  var currentBotMsg = '';
  var typeTimer = null;

  function showBot(msg, autoSpeak) {
    currentBotMsg = msg;
    if (!botText) return;
    botText.textContent = '';
    clearTimeout(typeTimer);
    var i = 0;
    (function typeLoop() {
      if (i < msg.length) {
        botText.textContent += msg[i++];
        typeTimer = setTimeout(typeLoop, 20);
      }
    })();
    if (autoSpeak) setTimeout(function () { speak(msg); }, 350);
  }

  if (botSpeak)   botSpeak.addEventListener('click', function () { speak(currentBotMsg); });
  if (botDismiss) botDismiss.addEventListener('click', function () {
    if (botGuide) { botGuide.style.transform = 'translateY(120px)'; botGuide.style.opacity = '0'; }
    if (synth) synth.cancel();
  });

  /* ═══════════════════════════════════════════════════════════
     4. WEB AUDIO — generative ambient sci-fi music (no files)
  ═══════════════════════════════════════════════════════════ */
  var audioCtx  = null;
  var musicNodes= [];
  var musicMaster = null;
  var musicOn   = false;
  var musicBtn  = qs('#music-btn');

  function buildReverb(ctx) {
    var conv  = ctx.createConvolver();
    var len   = ctx.sampleRate * 2.5;
    var buf   = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    conv.buffer = buf;
    return conv;
  }

  function startMusic() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }

    musicMaster = audioCtx.createGain();
    musicMaster.gain.setValueAtTime(0.07, audioCtx.currentTime);
    musicMaster.connect(audioCtx.destination);

    var reverb = buildReverb(audioCtx);
    reverb.connect(musicMaster);

    var delay = audioCtx.createDelay(1.0);
    delay.delayTime.setValueAtTime(0.38, audioCtx.currentTime);
    var delayFb = audioCtx.createGain();
    delayFb.gain.setValueAtTime(0.35, audioCtx.currentTime);
    delay.connect(delayFb);
    delayFb.connect(delay);
    delay.connect(musicMaster);

    /* Pentatonic scale — ambient drone */
    var freqs = [65.41, 98.00, 130.81, 164.81, 196.00, 261.63, 329.63, 392.00];
    var types = ['sine','triangle','sine','triangle','sine','triangle','sine','sine'];

    freqs.forEach(function (freq, idx) {
      var osc  = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = types[idx];
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      /* Detune slightly for richness */
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, audioCtx.currentTime);

      /* LFO for breathing swell */
      var lfo  = audioCtx.createOscillator();
      var lfog = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, audioCtx.currentTime);
      lfog.gain.setValueAtTime(0.03, audioCtx.currentTime);
      lfo.connect(lfog);
      lfog.connect(gain.gain);
      lfo.start();

      gain.gain.setValueAtTime(0.05 + Math.random() * 0.04, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(reverb);
      gain.connect(delay);
      osc.start();

      musicNodes.push(osc, lfo);
    });
  }

  function stopMusic() {
    if (musicMaster) {
      musicMaster.gain.setValueAtTime(0, audioCtx.currentTime);
    }
    musicNodes.forEach(function (n) { try { n.stop(); } catch (e) {} });
    musicNodes = [];
    musicMaster = null;
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', function () {
      if (!musicOn) {
        startMusic();
        musicBtn.textContent = '🔊';
        musicBtn.classList.add('playing');
      } else {
        stopMusic();
        musicBtn.textContent = '🎵';
        musicBtn.classList.remove('playing');
      }
      musicOn = !musicOn;
    });
  }

  /* ═══════════════════════════════════════════════════════════
     5. CLICK-TO-SPEAK on [data-speech] elements + ripple
  ═══════════════════════════════════════════════════════════ */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-speech]');
    if (!el) return;
    speak(el.dataset.speech);
    /* visual ripple */
    var rip = document.createElement('div');
    rip.className = 'speak-ripple';
    el.style.position = el.style.position || 'relative';
    el.appendChild(rip);
    setTimeout(function () { if (rip.parentNode) rip.parentNode.removeChild(rip); }, 700);
  });

  /* ═══════════════════════════════════════════════════════════
     6. POPULATE DOM FROM CONFIG
  ═══════════════════════════════════════════════════════════ */
  var yrEl = qs('#yr');
  if (yrEl) yrEl.textContent = new Date().getFullYear();

  var avaEl = qs('#ava');
  if (avaEl) avaEl.src = CFG.avatar;

  var hnameEl = qs('#hname');
  if (hnameEl) hnameEl.textContent = CFG.name;

  var htitleEl = qs('#htitle');
  if (htitleEl) htitleEl.textContent = CFG.title;

  var htagEl = qs('#htagline');
  if (htagEl) htagEl.textContent = CFG.tagline;

  /* ── Stats ── */
  var statsEl = qs('#stats');
  if (statsEl) {
    CFG.stats.forEach(function (s) {
      var d = document.createElement('div');
      d.className = 'sitem reveal speak-target';
      d.dataset.speech = s.label + ': ' + s.value + s.suffix;
      d.innerHTML =
        '<span class="sv" data-target="' + s.value + '" data-suffix="' + s.suffix + '">0' + s.suffix + '</span>' +
        '<span class="sl">' + s.label + '</span>';
      statsEl.appendChild(d);
    });
  }

  /* ── Skills ── */
  var orbsEl = qs('#orbs');
  var barsEl = qs('#bars');
  if (orbsEl && barsEl) {
    CFG.skills.forEach(function (s) {
      var o = document.createElement('div');
      o.className = 'orb reveal speak-target';
      o.textContent = s.name;
      o.dataset.speech = s.speech;
      o.style.setProperty('--oc', s.color + '30');
      o.style.borderColor = s.color + '55';
      orbsEl.appendChild(o);

      var r = document.createElement('div');
      r.className = 'bar-row reveal';
      r.innerHTML =
        '<div class="bar-name">' + s.name + '</div>' +
        '<div class="bar-track">' +
          '<div class="bar-fill" style="background:linear-gradient(to right,' + s.color + ',' + s.color + '88)" data-w="' + s.level + '"></div>' +
        '</div>' +
        '<div class="bar-pct">' + s.level + '%</div>';
      barsEl.appendChild(r);
    });
  }

  /* ── Experience ── */
  var expEl = qs('#exp-tl');
  if (expEl) {
    CFG.experience.forEach(function (e) {
      var el = document.createElement('div');
      el.className = 'exp-item speak-target';
      el.dataset.speech = e.speech;
      el.innerHTML =
        '<div class="exp-meta">' +
          '<div class="ec" style="color:' + e.color + '">' + e.company + '</div>' +
          '<div class="ep">' + e.period + '</div>' +
          '<div class="eloc">' + e.location + '</div>' +
        '</div>' +
        '<div class="exp-body reveal">' +
          '<div class="er">' + e.role + '</div>' +
          '<ul class="ehl">' + e.highlights.map(function (h) { return '<li>' + h + '</li>'; }).join('') + '</ul>' +
        '</div>';
      expEl.appendChild(el);
    });
  }

  /* ── Certifications ── */
  var certEl = qs('#cert-grid');
  if (certEl) {
    CFG.certifications.forEach(function (c) {
      var el = document.createElement('div');
      el.className = 'cflip reveal speak-target';
      el.dataset.speech = c.speech;
      el.innerHTML =
        '<div class="cflipper">' +
          '<div class="cfront">' +
            '<div class="cbglow" style="--cc:' + c.color + '"></div>' +
            '<img src="' + c.badge + '" alt="' + c.title + '" onerror="this.src=\'https://placehold.co/72x72/0f172a/38bdf8?text=CERT\'"/>' +
            '<div class="ctitle">' + c.title + '</div>' +
            '<div class="cissuer">' + c.issuer + '</div>' +
            '<div class="cyear">' + c.year + '</div>' +
          '</div>' +
          '<div class="cback" style="border-color:' + c.color + '44">' +
            '<div class="cbglow" style="--cc:' + c.color + '"></div>' +
            '<h4>' + c.title + '</h4>' +
            '<p>' + c.issuer + ' · ' + c.year + '</p>' +
            '<a href="' + c.url + '" target="_blank" rel="noopener">Verify Certificate ↗</a>' +
          '</div>' +
        '</div>';
      certEl.appendChild(el);
    });
  }

  /* ── Projects ── */
  var projEl = qs('#proj-grid');
  if (projEl) {
    CFG.projects.forEach(function (p) {
      var el = document.createElement('article');
      el.className = 'pcard reveal speak-target';
      el.dataset.speech = p.speech;
      el.style.setProperty('--pc', p.color);
      el.innerHTML =
        '<div class="ptitle">' + p.title + '</div>' +
        '<div class="pclient">' + p.client + '</div>' +
        '<div class="pdesc">' + p.desc + '</div>' +
        '<div class="ptags">' + p.tags.map(function (t) { return '<span class="ptag">' + t + '</span>'; }).join('') + '</div>';
      projEl.appendChild(el);
    });
  }

  /* ── Contact links ── */
  var clinksEl = qs('#clinks');
  if (clinksEl) {
    clinksEl.innerHTML =
      '<a href="mailto:' + CFG.email + '" class="clink">✉ ' + CFG.email + '</a>' +
      '<a href="' + CFG.linkedin + '" target="_blank" rel="noopener" class="clink">🔗 linkedin.com/in/ujasdubal</a>' +
      '<a href="' + CFG.github + '" target="_blank" rel="noopener" class="clink">⬡ github.com/ujas-dev</a>' +
      '<span class="clink">📍 ' + CFG.location + '</span>';
  }

  /* ── Wire Google Form from config ── */
  var gform = qs('#gform');
  if (gform) {
    gform.action = CFG.googleFormAction;
    var nameIn  = gform.querySelector('input[type=text]');
    var emailIn = gform.querySelector('input[type=email]');
    var msgIn   = gform.querySelector('textarea');
    if (nameIn)  nameIn.name  = CFG.googleFormEntries.name;
    if (emailIn) emailIn.name = CFG.googleFormEntries.email;
    if (msgIn)   msgIn.name   = CFG.googleFormEntries.message;
  }

  /* ── Google Form success callback (called from onsubmit) ── */
  window.formSent = function () {
    setTimeout(function () {
      var s = qs('#form-success');
      if (s) s.style.display = 'block';
      speak("Thank you! Your message has been sent to Ujas. He will reply shortly!");
      showBot("Message sent! 🎉 Ujas will get back to you very soon.", true);
      var gf = qs('#gform');
      if (gf) gf.reset();
    }, 600);
  };

  /* ═══════════════════════════════════════════════════════════
     7. NAVIGATION — goTo, nav links, keyboard
  ═══════════════════════════════════════════════════════════ */
  function goToSection(id) {
    goTo(id);
    qsa('.nl').forEach(function (n) {
      n.classList.toggle('active', n.dataset.sec === id);
    });
  }

  /* data-goto buttons */
  qsa('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () { goToSection(b.dataset.goto); });
  });

  /* Nav links */
  qsa('.nl').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      goToSection(a.dataset.sec);
    });
  });

  /* Logo → hero */
  var logoLink = qs('#logo-link');
  if (logoLink) {
    logoLink.addEventListener('click', function (e) {
      e.preventDefault();
      goToSection('hero');
    });
  }

  /* Keyboard navigation */
  var SECS = ['hero','about','skills','experience','certifications','projects','contact'];
  var sidx  = 0;

  function gotoIdx(i) {
    sidx = Math.max(0, Math.min(SECS.length - 1, i));
    goToSection(SECS[sidx]);
    var sec = qs('#' + SECS[sidx]);
    if (sec && sec.dataset.bot) showBot(sec.dataset.bot, true);
  }

  window.addEventListener('keydown', function (e) {
    /* Don't hijack typing in form fields */
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); gotoIdx(sidx + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); gotoIdx(sidx - 1); }
    else if (e.key >= '1' && e.key <= '7') { gotoIdx(parseInt(e.key, 10) - 1); }
    else if (e.key === 'Escape') { gotoIdx(0); }
  });

  /* Track active section via IntersectionObserver */
  var secIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var si = en.target.dataset.si;
      if (si !== undefined) {
        sidx = parseInt(si, 10);
        var secId = en.target.id;
        qsa('.nl').forEach(function (n) { n.classList.toggle('active', n.dataset.sec === secId); });
        if (en.target.dataset.bot) showBot(en.target.dataset.bot, false);
      }
    });
  }, { threshold: 0.35 });
  qsa('.wsec').forEach(function (s) { secIO.observe(s); });

  /* ═══════════════════════════════════════════════════════════
     8. SCROLL REVEALS (IntersectionObserver — zero GSAP)
  ═══════════════════════════════════════════════════════════ */
  var revIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;

      /* Stagger siblings */
      var siblings = en.target.parentElement
        ? Array.from(en.target.parentElement.querySelectorAll('.reveal'))
        : [en.target];
      var idx = siblings.indexOf(en.target);
      en.target.style.transitionDelay = (idx * 65) + 'ms';
      en.target.classList.add('in');

      /* Animate skill bars */
      if (en.target.closest && en.target.closest('#skills')) {
        setTimeout(function () {
          qsa('.bar-fill').forEach(function (b) { b.style.width = b.dataset.w + '%'; });
        }, 200);
      }

      /* Animate stat counters */
      if (en.target.classList.contains('sitem')) {
        var sv = en.target.querySelector('.sv');
        if (sv && !sv.dataset.done) {
          sv.dataset.done = '1';
          var target  = parseFloat(sv.dataset.target);
          var suffix  = sv.dataset.suffix || '';
          var decimal = target % 1 !== 0;
          var cur = 0, inc = target / 55;
          (function step() {
            cur += inc;
            if (cur >= target) {
              sv.textContent = (decimal ? target.toFixed(1) : target) + suffix;
              return;
            }
            sv.textContent = (decimal ? cur.toFixed(1) : Math.floor(cur)) + suffix;
            requestAnimationFrame(step);
          })();
        }
      }
      revIO.unobserve(en.target);
    });
  }, { threshold: 0.12 });

  setTimeout(function () {
    qsa('.reveal').forEach(function (el) { revIO.observe(el); });
  }, 80);

  /* ═══════════════════════════════════════════════════════════
     9. CUSTOM CURSOR
  ═══════════════════════════════════════════════════════════ */
  var cdot  = qs('#cdot');
  var cglow = qs('#cglow');
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
    qsa('a,button,.wcard,.cflip,.pcard,.orb,.nl,.exp-item,.sitem').forEach(function (el) {
      el.addEventListener('pointerenter', function () { document.body.classList.add('hov'); });
      el.addEventListener('pointerleave', function () { document.body.classList.remove('hov'); });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     10. MAGNETIC BUTTONS
  ═══════════════════════════════════════════════════════════ */
  qsa('.mag').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width  / 2) / 5;
      var y = (e.clientY - r.top  - r.height / 2) / 5;
      btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    btn.addEventListener('pointerleave', function () {
      btn.style.transform = '';
    });
  });

  /* ═══════════════════════════════════════════════════════════
     11. HOLOGRAPHIC 3D TILT CARDS
  ═══════════════════════════════════════════════════════════ */
  qsa('.holo').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r  = card.getBoundingClientRect();
      var xp = (e.clientX - r.left) / r.width;
      var yp = (e.clientY - r.top)  / r.height;
      card.style.transform =
        'perspective(700px) rotateX(' + ((yp - 0.5) * -22) + 'deg) rotateY(' + ((xp - 0.5) * 22) + 'deg) scale3d(1.04,1.04,1.04)';
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

  /* ═══════════════════════════════════════════════════════════
     12. TERMINAL TYPING EFFECT
  ═══════════════════════════════════════════════════════════ */
  (function () {
    var el = qs('#ttext');
    if (!el) return;
    var lines = [
      'whoami  # ' + CFG.name,
      'aws s3 ls s3://ujas-data-pipelines/',
      'spark-submit etl_pipeline.py --master yarn',
      'SELECT COUNT(*) FROM analytics.fact_sales;',
      'git push origin feature/redshift-optimization',
      'airflow dags trigger daily_glue_load'
    ];
    var li = 0, ci = 0, typing = true;
    function tick() {
      if (li >= lines.length) li = 0;
      var ln = lines[li];
      if (typing) {
        if (ci < ln.length) { el.textContent += ln[ci++]; setTimeout(tick, 46 + Math.random() * 26); }
        else { typing = false; setTimeout(tick, 1600); }
      } else {
        if (ci > 0) { el.textContent = ln.slice(0, --ci); setTimeout(tick, 14); }
        else { typing = true; li++; setTimeout(tick, 320); }
      }
    }
    setTimeout(tick, 900);
  })();

  /* ═══════════════════════════════════════════════════════════
     13. THREE.JS — 50k GPU PARTICLE FIELD
  ═══════════════════════════════════════════════════════════ */
  (function () {
    if (!window.THREE) return;
    var canvas = qs('#bg3d');
    if (!canvas) return;
    var W = innerWidth, H = innerHeight;
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
      vel[i*3]   = (Math.random() - .5) * .010;
      vel[i*3+1] = (Math.random() - .5) * .010;
      vel[i*3+2] = (Math.random() - .5) * .008;
      var m = Math.random();
      if (m > .66)      { col[i*3]=.22; col[i*3+1]=.74; col[i*3+2]=.98; }
      else if (m > .33) { col[i*3]=.65; col[i*3+1]=.47; col[i*3+2]=.98; }
      else              { col[i*3]=.88; col[i*3+1]=.11; col[i*3+2]=.28; }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    var pMat = new THREE.PointsMaterial({
      size: .13, vertexColors: true, transparent: true, opacity: .72,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    var pts = new THREE.Points(geo, pMat);
    scene.add(pts);

    var mxN = 0, myN = 0;
    document.addEventListener('pointermove', function (e) {
      mxN = (e.clientX / innerWidth  - .5) * 2;
      myN = -(e.clientY / innerHeight - .5) * 2;
    });
    window.addEventListener('resize', function () {
      W = innerWidth; H = innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    });

    var pTime = 0;
    (function pLoop() {
      requestAnimationFrame(pLoop);
      pTime += .0007;
      for (var j = 0; j < N; j++) {
        pos[j*3]   += vel[j*3]   + Math.sin(pTime + j * .011) * .002 + mxN * .003;
        pos[j*3+1] += vel[j*3+1] + Math.cos(pTime + j * .013) * .002 + myN * .003;
        pos[j*3+2] += vel[j*3+2];
        if (pos[j*3]   >  40) pos[j*3]   = -40;
        if (pos[j*3]   < -40) pos[j*3]   =  40;
        if (pos[j*3+1] >  40) pos[j*3+1] = -40;
        if (pos[j*3+1] < -40) pos[j*3+1] =  40;
        if (pos[j*3+2] >  30) pos[j*3+2] = -30;
        if (pos[j*3+2] < -30) pos[j*3+2] =  30;
      }
      geo.attributes.position.needsUpdate = true;
      pts.rotation.y += .00012 + mxN * .0004;
      pts.rotation.x += myN * .0002;
      camera.position.x += (mxN * 5   - camera.position.x) * .04;
      camera.position.y += (myN * 3.5  - camera.position.y) * .04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    })();
  })();

  /* ═══════════════════════════════════════════════════════════
     14. MATHEMATICALLY CORRECT 4D TESSERACT
         16 vertices, 32 edges, 4 simultaneous hyperplane rotations
         Drag to rotate · Scroll to zoom
  ═══════════════════════════════════════════════════════════ */
  (function () {
    if (!window.THREE) return;
    var canvas = qs('#t4d');
    if (!canvas) return;
    var SZ = 320;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(SZ, SZ);

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, .01, 100);
    camera.position.z = 4.5;
    scene.add(new THREE.AmbientLight(0xffffff, .5));

    /* 16 vertices of a 4D unit hypercube */
    var V4 = [];
    for (var i = 0; i < 16; i++) {
      V4.push([ (i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1, (i&8)?1:-1 ]);
    }

    /* 32 edges: pairs differing in exactly 1 bit */
    var E4 = [];
    for (var a = 0; a < 16; a++) {
      for (var b = a + 1; b < 16; b++) {
        var diff = 0;
        for (var k = 0; k < 4; k++) { if (V4[a][k] !== V4[b][k]) diff++; }
        if (diff === 1) E4.push([a, b]);
      }
    }

    /* 4D rotation in a given hyperplane */
    function rot4(v, ii, jj, ang) {
      var u = v.slice();
      var c = Math.cos(ang), s = Math.sin(ang);
      u[ii] = c * v[ii] - s * v[jj];
      u[jj] = s * v[ii] + c * v[jj];
      return u;
    }

    /* 4D → 3D perspective projection */
    function proj4to3(v) {
      var w = 2.5 / (2.5 - v[3]);
      return new THREE.Vector3(v[0] * w, v[1] * w, v[2] * w);
    }

    /* Build edge line objects — cyan = outer cube, pink = inner */
    var lineObjs = E4.map(function (e) {
      var avgW = (V4[e[0]][3] + V4[e[1]][3]);
      var col  = avgW > 0 ? 0x38bdf8 : 0xe11d48;
      var mat  = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .92 });
      var geo  = new THREE.BufferGeometry();
      geo.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      var ln = new THREE.Line(geo, mat);
      scene.add(ln);
      return { ln: ln, geo: geo };
    });

    /* Vertex spheres */
    var vGeo = new THREE.SphereGeometry(.055, 8, 8);
    var vSpheres = V4.map(function (v) {
      var col = v[3] > 0 ? 0x38bdf8 : 0xe11d48;
      var ms  = new THREE.Mesh(vGeo, new THREE.MeshBasicMaterial({ color: col }));
      scene.add(ms);
      return ms;
    });

    /* Drag + zoom state */
    var dragging = false, ldx = 0, ldy = 0;
    var drx = 0, dry = 0, zoom = 1;

    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; ldx = e.clientX; ldy = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointerup',   function () { dragging = false; });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dry += (e.clientX - ldx) * .012;
      drx += (e.clientY - ldy) * .012;
      ldx = e.clientX; ldy = e.clientY;
    });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoom = Math.max(.5, Math.min(3.0, zoom + e.deltaY * .002));
      camera.position.z = 4.5 * zoom;
    }, { passive: false });

    var tTime = 0;
    (function tLoop() {
      requestAnimationFrame(tLoop);
      tTime += .007;

      /* 4 simultaneous 4D hyperplane rotations */
      var rotated = V4.map(function (v) {
        var u = v;
        u = rot4(u, 0, 3, tTime * .55);
        u = rot4(u, 1, 2, tTime * .40);
        u = rot4(u, 0, 2, tTime * .28);
        u = rot4(u, 1, 3, tTime * .35);
        return u;
      });

      /* Project 4D → 3D */
      var p3 = rotated.map(proj4to3);

      /* Apply drag rotation in 3D */
      var cx = Math.cos(drx), sx = Math.sin(drx);
      var cy = Math.cos(dry), sy = Math.sin(dry);
      p3 = p3.map(function (p) {
        var y1 = cx * p.y - sx * p.z;
        var z1 = sx * p.y + cx * p.z;
        var x2 = cy * p.x + sy * z1;
        var z2 = -sy * p.x + cy * z1;
        return new THREE.Vector3(x2, y1, z2);
      });

      /* Update edge geometries */
      E4.forEach(function (e, i) {
        lineObjs[i].geo.setFromPoints([p3[e[0]], p3[e[1]]]);
      });

      /* Update vertex sphere positions */
      p3.forEach(function (p, i) {
        vSpheres[i].position.copy(p);
      });

      renderer.render(scene, camera);
    })();
  })();

  /* ── All done ────────────────────────────────────────────── */

})(); // end IIFE — nothing leaks to global scope
