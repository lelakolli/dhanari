/* ============================================================
   MAISON HYDERABAD — MOTION LAYER (JS)
   Progressive enhancement. Every effect is optional: if this
   file fails to load, or the visitor prefers reduced motion,
   the site behaves exactly as before.
   ------------------------------------------------------------
   Nothing here touches the site's data or state. It only
   decorates what the main script has already rendered.
   ============================================================ */
(function(){
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  if (!body) return;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
  if (reduce) return;               /* leave the page perfectly still */

  var fine = true;
  try { fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches; } catch(e){}

  root.classList.add('fx-on');

  var $  = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var raf = window.requestAnimationFrame || function(f){ return setTimeout(f, 16); };

  /* ----------------------------------------------------------
     0. Split headings into animatable words
     Runs on a Node so it is safe before <body> children exist.
     ---------------------------------------------------------- */
  function splitWords(el){
    if (!el || el.dataset.fxSplit === '1') return;
    var kids = Array.prototype.slice.call(el.childNodes);
    var made = false;
    kids.forEach(function(node){
      if (node.nodeType === 3){
        var words = node.nodeValue.split(/(\s+)/);
        if (!node.nodeValue.trim()) return;
        var frag = document.createDocumentFragment();
        words.forEach(function(w){
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          var outer = document.createElement('span');
          outer.className = 'fx-word';
          var inner = document.createElement('i');
          inner.textContent = w;
          outer.appendChild(inner);
          frag.appendChild(outer);
          made = true;
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && !node.classList.contains('fx-word')){
        splitWords(node);           /* recurse into <span class="gold"> etc. */
      }
    });
    if (made) el.dataset.fxSplit = '1';
  }

  function prepHeadings(){
    $$('.sec-head .h2').forEach(function(h){
      h.classList.add('fx-head');
      splitWords(h);
      /* the base sheet slides the whole sec-head in; once the words
         carry the motion, that outer slide just makes it muddy */
      var head = h.closest('.sec-head');
      if (head) head.classList.add('fx-head-parent');
    });
    /* Hero headline choreography stays with the base CSS; it is
       held paused by stylesheet until body.fx-loaded is set. */
    /* The gold line inside each split heading gets its travelling sheen.
       Painting it per word is what makes it work (see the note in
       fx.css); a phrase that was never split is left on the base gold. */
    $$('.sec-head .h2 .gold').forEach(function(g){
      if (g.querySelector('.fx-word')) g.classList.add('fx-sheen');
    });
  }

  /* ----------------------------------------------------------
     1. Scroll progress bar
     ---------------------------------------------------------- */
  var bar;
  function mountProgress(){
    bar = document.createElement('div');
    bar.className = 'fx-progress';
    body.appendChild(bar);
  }
  var lastY = -1, ticking = false, activeId = null;
  function onScrollFrame(){
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (bar) bar.style.transform = 'scaleX(' + Math.min(1, y / max) + ')';

    /* parallax: the hero drifts slower than the page. Only touched
       while the hero is still on screen, so the rest of the page
       never pays for it. */
    if (y !== lastY && y < window.innerHeight * 1.6){
      root.style.setProperty('--fx-shift', Math.min(y * 0.16, 110).toFixed(1) + 'px');
      lastY = y;
    }
    markActiveNav();
  }
  function onScroll(){
    if (!ticking){ ticking = true; raf(onScrollFrame); }
  }

  /* ----------------------------------------------------------
     2. Active nav section
     ---------------------------------------------------------- */
  var navLinks = [];
  function mapNav(){
    navLinks = $$('.nav a[href^="#"]').map(function(a){
      return { a: a, id: a.getAttribute('href').slice(1) };
    });
  }
  function markActiveNav(){
    if (!navLinks.length) return;
    var best = null, bestD = 1e9;
    navLinks.forEach(function(n){
      var el = document.getElementById(n.id);
      if (!el) return;
      var d = Math.abs(el.getBoundingClientRect().top - 120);
      if (d < bestD){ bestD = d; best = n; }
    });
    var id = best ? best.id : null;
    if (id === activeId) return;
    activeId = id;
    navLinks.forEach(function(n){ n.a.classList.toggle('is-active', n === best); });
  }

  /* ----------------------------------------------------------
     3. Rich scroll reveals
     Adds a direction variant to deeper grids and observes them.
     ---------------------------------------------------------- */
  function variantize(){
    /* Small editorial grids (2–4 cards) get a gold wipe instead of a
       fade. The big data grids keep the app's own fadeUp: dozens of
       clip-path animations at once would cost more than they add. */
    $$('.section .grid').forEach(function(grid){
      if (grid.id === 'projectGrid' || grid.id === 'insightGrid' ||
          grid.id === 'localityGrid' || grid.id === 'builderList') return;
      var kids = $$(':scope > .card.reveal, :scope > .frame.reveal', grid);
      if (kids.length < 2 || kids.length > 6) return;
      kids.forEach(function(el, i){
        if (!el.dataset.fx){
          el.dataset.fx = 'wipe';
          el.dataset.fxWipeDelay = String(i * 90);
        }
      });
    });
  }

  /* A gold curtain across the card, retracting to reveal it. The
     clip-path is driven frame by frame and then *dropped*, so the
     card cannot keep a stale clip when it re-renders or grows. */
  function runWipe(el){
    if (!el.classList.contains('fx-wipe')) return;
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
    if (reduce){ el.classList.remove('fx-wipe'); return; }
    var delay = +(el.dataset.fxWipeDelay || 0);
    if (delay) { setTimeout(function(){ runWipeNow(el); }, delay); return; }
    runWipeNow(el);
  }

  function runWipeNow(el){
    if (!el.classList.contains('fx-wipe')) return;
    var t0 = null, dur = 900;
    el.classList.add('fx-wiping');
    el.dataset.fxWipeDone = '1';
    function step(now){
      if (t0 === null) t0 = now;
      var k = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      el.style.setProperty('--fx-w', (eased * 100).toFixed(2) + '%');
      if (k < 1) raf(step);
      else {
        el.classList.remove('fx-wipe', 'fx-wiping');
        el.style.removeProperty('--fx-w');
      }
    }
    raf(step);
    /* If the tab is hidden or rAF is throttled we may never finish;
       never leave a card clipped. */
    setTimeout(function(){
      if (!el.classList.contains('fx-wipe')) return;
      el.classList.remove('fx-wipe', 'fx-wiping');
      el.style.removeProperty('--fx-w');
    }, dur + 900);
  }

  var io = null, ruleIO = null;
  /* Split headings start hidden. If an observer never reports them
     (page restored from cache, tab backgrounded during boot, a layout
     shift), reveal them on a timer rather than leaving a blank line. */
  function armHeadingFallback(){
    $$('.fx-head').forEach(function(h){
      if (h.dataset.fxFallback) return;
      h.dataset.fxFallback = '1';
      setTimeout(function(){
        if (!h.classList.contains('in-view')) h.classList.add('in-view');
      }, 1400);
    });
  }

  function observeAll(){
    if (!('IntersectionObserver' in window)){
      $$('.reveal').forEach(function(el){ el.classList.add('in-view'); });
      $$('.fx-rule').forEach(function(el){ el.classList.add('in-view'); });
      return;
    }
    if (!io){
      io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (!en.isIntersecting) return;
          en.target.classList.add('in-view');
          runWipe(en.target);
          io.unobserve(en.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    }
    if (!ruleIO){
      ruleIO = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (!en.isIntersecting) return;
          en.target.classList.add('in-view');
          ruleIO.unobserve(en.target);
        });
      }, { threshold: 0.6 });
    }
    $$('.reveal:not(.in-view)').forEach(function(el){
      if (el.dataset.fx === 'wipe' && !el.classList.contains('fx-wipe')) el.classList.add('fx-wipe');
      io.observe(el);
    });
    $$('.fx-rule:not(.in-view)').forEach(function(el){ ruleIO.observe(el); });
    /* anything already on screen when we start: reveal immediately */
    $$('.reveal').forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0){
        el.classList.add('in-view');
        if (el.classList.contains('fx-wipe')){
          el.classList.remove('fx-wipe', 'fx-wiping');
          el.style.removeProperty('--fx-w');
        }
      }
    });
  }

  /* ----------------------------------------------------------
     4. Section hairlines
     ---------------------------------------------------------- */
  function addRules(){
    $$('main > .section').forEach(function(sec, i){
      if (i === 0) return;                 /* hero already has weight */
      if (sec.previousElementSibling && sec.previousElementSibling.classList.contains('fx-rule-wrap')) return;
      var wrap = document.createElement('div');
      wrap.className = 'fx-rule-wrap';
      var rule = document.createElement('div');
      rule.className = 'fx-rule';
      wrap.appendChild(rule);
      sec.parentNode.insertBefore(wrap, sec);
    });
  }

  /* ----------------------------------------------------------
     5. Card spotlight + tilt (pointer only)
     ---------------------------------------------------------- */
  function bindCardFx(){
    if (!fine) return;
    $$('.p-card, .l-card, .i-card').forEach(function(card){
      card.addEventListener('pointermove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        if (card.classList.contains('p-card')){
          /* unitless on purpose — the stylesheet appends the deg */
          card.style.setProperty('--ry', ((px - 0.5) * 5).toFixed(2));
          card.style.setProperty('--rx', ((0.5 - py) * 4).toFixed(2));
        }
      }, { passive: true });
      if (card.classList.contains('p-card')){
        card.addEventListener('pointerenter', function(){ card.classList.add('fx-tilt'); });
        card.addEventListener('pointerleave', function(){
          card.classList.remove('fx-tilt');
          card.style.setProperty('--ry', '0');
          card.style.setProperty('--rx', '0');
        });
      }
    });
  }

  /* ----------------------------------------------------------
     5b. Pointer-reactive hero glow
     ---------------------------------------------------------- */
  /* Calculator outputs re-run constantly on slider drag, so a quick
     gold flash on the new figure makes the change legible — and the
     row it sits in catches a matching sweep. */
  function flashCalcs(){
    var ids = ['outBudget', 'outTotal', 'outLoan', 'outEmi', 'outDuty', 'outCorpus', 'outBuffer', 'outInterest'];
    ids.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      var prev = el.textContent;
      new MutationObserver(function(){
        if (el.textContent === prev) return;
        prev = el.textContent;
        var target = el.closest('.calc__row') || el;
        target.classList.remove('fx-flash', 'fx-row');
        void target.offsetWidth;
        target.classList.add('fx-flash', 'fx-row');
        clearTimeout(target.__fxT);
        target.__fxT = setTimeout(function(){
          target.classList.remove('fx-flash', 'fx-row');
        }, 700);
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });

    /* Drag state gives the panel a subtle lift */
    $$('.calc__form input[type="range"]').forEach(function(r){
      r.addEventListener('pointerdown', function(){
        var out = $('#calc .calc__out');
        if (out) out.classList.add('fx-live');
      });
      var end = function(){
        var out = $('#calc .calc__out');
        if (out) out.classList.remove('fx-live');
      };
      r.addEventListener('pointerup', end);
      r.addEventListener('pointercancel', end);
      r.addEventListener('blur', end);
    });
  }

  function bindHeroGlow(){
    if (!fine) return;
    var hero = $('.hero');
    if (!hero) return;
    hero.addEventListener('pointermove', function(e){
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty('--gx', (dx * -46).toFixed(1) + 'px');
      hero.style.setProperty('--gy', (dy * -30).toFixed(1) + 'px');
    }, { passive: true });
  }

  /* A second, tighter gold light that follows the pointer across the
     hero. `translate` again, so it composes with the floatGlow animation. */
  function bindHeroSpot(){
    if (!fine) return;
    var hero = $('.hero');
    if (!hero) return;
    var spot = document.createElement('div');
    spot.className = 'fx-hero-spot';
    spot.setAttribute('aria-hidden', 'true');
    hero.appendChild(spot);
    var tx = 50, ty = 40, cx = 50, cy = 40, raf1 = 0;
    function tick(){
      raf1 = 0;
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      spot.style.setProperty('--sx', cx.toFixed(2) + '%');
      spot.style.setProperty('--sy', cy.toFixed(2) + '%');
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf1 = raf(tick);
    }
    hero.addEventListener('pointermove', function(e){
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf1) raf1 = raf(tick);
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     6. Magnetic buttons
     ---------------------------------------------------------- */
  function bindMagnet(){
    if (!fine) return;
    $$('.btn').forEach(function(btn){
      btn.addEventListener('pointermove', function(e){
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.setProperty('--tx', (dx * 5).toFixed(2) + 'px');
        btn.style.setProperty('--ty', (dy * 3.5).toFixed(2) + 'px');
      }, { passive: true });
      btn.addEventListener('pointerleave', function(){
        btn.style.setProperty('--tx', '0px');
        btn.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ----------------------------------------------------------
     7. Shortlist badge pop
     ---------------------------------------------------------- */
  function watchBadge(){
    if (!('MutationObserver' in window)) return;
    ['shortlistCount', 'shortCount'].forEach(function(id){
      var badge = document.getElementById(id);
      if (!badge) return;
      var prev = badge.textContent;
      new MutationObserver(function(){
        if (badge.textContent === prev) return;
        prev = badge.textContent;
        badge.classList.remove('fx-pop');
        void badge.offsetWidth;           /* restart the animation */
        badge.classList.add('fx-pop');
      }).observe(badge, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ----------------------------------------------------------
     8. Loader halo — a 1.2s ceiling, no matter what
     ---------------------------------------------------------- */
  function mountHalo(){
    var c = document.createElement('div');
    c.className = 'fx-halo';
    var ring = document.createElement('div');
    ring.className = 'fx-halo__ring';
    var m = document.createElement('span');
    m.className = 'fx-halo__mark';
    m.textContent = 'M';
    ring.appendChild(m);
    var word = document.createElement('span');
    word.className = 'fx-halo__word';
    word.textContent = 'Maison Hyderabad';
    var bar = document.createElement('span');
    bar.className = 'fx-halo__bar';
    bar.appendChild(document.createElement('i'));
    var stack = document.createElement('div');
    stack.className = 'fx-halo__stack';
    stack.appendChild(ring); stack.appendChild(word); stack.appendChild(bar);
    c.appendChild(stack);
    body.appendChild(c);

    var dropped = false;
    function drop(){
      if (dropped) return;
      dropped = true;
      c.classList.add('gone');
      body.classList.add('fx-loaded');
      retractBars();
      setTimeout(function(){ if (c.parentNode) c.parentNode.removeChild(c); }, 620);
    }
    setTimeout(drop, 1400);                       /* hard ceiling */
    setTimeout(retractBars, 1800);                /* absolute backstop */
    if (document.readyState === 'complete') setTimeout(drop, 260);
    else window.addEventListener('load', function(){ setTimeout(drop, 260); }, { once: true });
  }

  /* ----------------------------------------------------------
     9. Re-bind after the app re-renders the DOM
     ---------------------------------------------------------- */
  var rebindT;
  function rebind(){
    clearTimeout(rebindT);
    rebindT = setTimeout(function(){
      variantize();
      observeAll();
      bindCardFx();
      bindMagnet();
      watchTabs();
      armSectionPasses();
    }, 90);
  }

  /* Filter tabs pulse when the selection moves. The app owns the
     aria-selected state, so watch it rather than intercept clicks. */
  function watchTabs(){
    if (!('MutationObserver' in window)) return;
    $$('.tabs button[role="tab"]').forEach(function(btn){
      if (btn.dataset.fxTab) return;
      btn.dataset.fxTab = '1';
      var prev = btn.getAttribute('aria-selected');
      new MutationObserver(function(){
        var now = btn.getAttribute('aria-selected');
        if (now === prev) return;
        prev = now;
        if (now !== 'true') return;
        btn.classList.remove('fx-pick');
        void btn.offsetWidth;
        btn.classList.add('fx-pick');
      }).observe(btn, { attributes: true, attributeFilter: ['aria-selected'] });
    });
  }

  /* Cinematic letterbox: bars close in at load, then retract with
     the halo. It is purely ornamental and never intercepts input. */
  var bars;
  function mountBars(){
    bars = document.createElement('div');
    bars.className = 'fx-bars on';
    bars.setAttribute('aria-hidden', 'true');
    bars.appendChild(document.createElement('i'));
    bars.appendChild(document.createElement('i'));
    body.appendChild(bars);
    retractBars();
  }
  function retractBars(){
    if (!bars) return;
    var b = bars; bars = null;
    b.classList.remove('on');
    b.classList.add('gone');
    setTimeout(function(){ if (b.parentNode) b.parentNode.removeChild(b); }, 1200);
  }

  /* ----------------------------------------------------------
     9b. Cinematic layer
     ---------------------------------------------------------- */

  /* Floating dust in the hero. Canvas, capped DPR, ~26 motes, and it
     stops entirely when the hero leaves the viewport or the tab is
     hidden. Nothing here is load-bearing. */
  function mountParticles(){
    var hero = $('.hero');
    if (!hero || !window.HTMLCanvasElement) return;
    var cv = document.createElement('canvas');
    cv.className = 'fx-particles';
    cv.setAttribute('aria-hidden', 'true');
    hero.appendChild(cv);
    var ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return;

    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var motes = [], running = false, visible = true;

    function size(){
      var r = hero.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    function seed(){
      var n = w < 720 ? 14 : 26;
      motes = [];
      for (var i = 0; i < n; i++){
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.5 + Math.random() * 1.6,
          sx: (Math.random() - 0.5) * 0.16,
          sy: -0.08 - Math.random() * 0.22,
          a: 0.12 + Math.random() * 0.4,
          ph: Math.random() * Math.PI * 2
        });
      }
    }
    var lastT = 0;
    function draw(t){
      if (!running) return;
      /* ~30fps is plenty for drifting dust and halves the paint cost */
      if (t - lastT < 32){ raf(draw); return; }
      var dt = lastT ? Math.min(48, t - lastT) : 16;
      lastT = t;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < motes.length; i++){
        var m = motes[i];
        m.x += m.sx * dt * 0.06;
        m.y += m.sy * dt * 0.06;
        if (m.y < -8) { m.y = h + 8; m.x = Math.random() * w; }
        if (m.x < -8) m.x = w + 8;
        if (m.x > w + 8) m.x = -8;
        var tw = 0.55 + 0.45 * Math.sin(t / 1400 + m.ph);
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(232,211,166,' + (m.a * tw).toFixed(3) + ')';
        ctx.fill();
      }
      raf(draw);
    }
    function start(){ if (running || !visible) return; running = true; raf(draw); }
    function stop(){ running = false; }

    size();
    start();

    var onResize = function(){ size(); };
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', function(){
      if (document.hidden) stop(); else start();
    });

    /* only animate while the hero is actually on screen */
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(en){
        visible = en[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.05 }).observe(hero);
    }
  }

  /* Soft moving nebulae behind the hero scrim */
  function mountNebulae(){
    var hero = $('.hero');
    if (!hero || hero.querySelector('.fx-nebulae')) return;
    var box = document.createElement('div');
    box.className = 'fx-nebulae';
    box.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 3; i++) box.appendChild(document.createElement('span')).className = 'fx-nebula';
    hero.insertBefore(box, hero.firstChild);
  }

  /* Each section gets one light pass as it first arrives */
  var passIO = null;
  function armSectionPasses(){
    if (!('IntersectionObserver' in window)) return;
    if (!passIO){
      passIO = new IntersectionObserver(function(en){
        en.forEach(function(e){
          if (!e.isIntersecting) return;
          var el = e.target;
          el.classList.add('fx-pass');
          passIO.unobserve(el);
          setTimeout(function(){ el.classList.remove('fx-pass'); }, 1800);
        });
      }, { threshold: 0.35 });
    }
    $$('main > .section:not(.fx-pass-armed)').forEach(function(sec){
      sec.classList.add('fx-pass-armed');
      passIO.observe(sec);
    });
  }

  /* Re-run the hero counters if they were behind the loader */
  function replayCounters(){
    var nums = $$('.hero__stats [data-count]');
    if (!nums.length) return;
    /* The app's own initCounters fires on an IntersectionObserver that
       sits behind the loader, so its result is trustworthy. Only step
       in if a figure is still empty once the loader is gone. */
    setTimeout(function(){
      nums.forEach(function(el){
        var target = +el.dataset.count;
        if (!target) return;
        if (el.textContent !== '0') return;
        var t0 = null, dur = 1100;
        function step(now){
          if (t0 === null) t0 = now;
          var k = Math.min(1, (now - t0) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN');
          if (k < 1) raf(step);
        }
        raf(step);
      });
    }, 1400);
  }

  /* Footer settles its columns once it comes into view */
  function watchFooter(){
    var f = $('.site-footer');
    if (!f) return;
    if (!('IntersectionObserver' in window)) { f.classList.add('in-view'); return; }
    var o = new IntersectionObserver(function(en){
      if (!en[0].isIntersecting) return;
      f.classList.add('in-view');
      o.unobserve(f);
    }, { threshold: 0.15 });
    o.observe(f);
  }

  /* ----------------------------------------------------------
     10. Boot
     ---------------------------------------------------------- */
  var booted = false;
  function boot(){
    if (booted) return;
    booted = true;
    mapNav();
    addRules();
    variantize();
    prepHeadings();
    mountProgress();
    observeAll();
    bindCardFx();
    bindHeroGlow();
    bindHeroSpot();
    bindMagnet();
    watchBadge();
    flashCalcs();
    mountNebulae();
    mountParticles();
    watchTabs();
    armSectionPasses();
    watchFooter();
    replayCounters();
    onScrollFrame();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function(){ onScroll(); }, { passive: true });

    /* The app renders inside its own scope; watch for list rebuilds. */
    if ('MutationObserver' in window){
      var mo = new MutationObserver(function(muts){
        for (var i = 0; i < muts.length; i++){
          var t = muts[i].target;
          if (t && t.nodeType === 1 &&
              (t.id === 'projectGrid' || t.id === 'localityGrid' ||
               t.id === 'builderList' || t.id === 'insightGrid' ||
               t.id === 'faqList')) { rebind(); return; }
        }
      });
      ['projectGrid','localityGrid','builderList','insightGrid','faqList'].forEach(function(id){
        var el = document.getElementById(id);
        if (el) mo.observe(el, { childList: true });
      });
    }

    /* Deep-linked detail sheets and late map pins */
    window.addEventListener('hashchange', rebind);
    setTimeout(rebind, 700);
    setTimeout(rebind, 1800);
    armHeadingFallback();

    /* Absolute safety net: nothing on this page may stay invisible
       because an animation never started. */
    setTimeout(function(){
      $$('.reveal:not(.in-view), .fx-head:not(.in-view)').forEach(function(el){
        el.classList.add('in-view');
      });
      $$('.fx-wipe').forEach(function(el){
        el.classList.remove('fx-wipe', 'fx-wiping');
        el.style.removeProperty('--fx-w');
      });
    }, 4000);
  }

  mountHalo();                    /* earliest possible: before first paint */
  mountBars();
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once: true });
    window.addEventListener('load', boot, { once: true });   /* belt and braces */
  } else {
    boot();
  }
})();
