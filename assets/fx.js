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
    /* Every other gold phrase in a heading picks up the sheen */
    $$('.sec-head .h2 .gold, .section--ink .h2 .gold').forEach(function(g){
      g.classList.add('fx-sheen');
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
    /* Small editorial grids (2–4 cards) get the diagonal wipe. The
       big data grids keep the app's own fadeUp: dozens of clip-path
       animations at once would cost more than they add. */
    $$('.section .grid').forEach(function(grid){
      var kids = $$(':scope > .card.reveal, :scope > .frame.reveal', grid);
      if (kids.length < 2 || kids.length > 4) return;
      kids.forEach(function(el){
        if (!el.dataset.fx) el.dataset.fx = 'mask';
      });
    });
  }

  var io = null, ruleIO = null;
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
    $$('.reveal:not(.in-view)').forEach(function(el){ io.observe(el); });
    $$('.fx-rule:not(.in-view)').forEach(function(el){ ruleIO.observe(el); });
    /* anything already on screen when we start: reveal immediately */
    $$('.reveal').forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add('in-view');
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
     gold flash on the new figure makes the change legible. */
  function flashCalcs(){
    ['outBudget','outEmi','outLoan','outInterest'].forEach(function(id){
      var el = document.getElementById(id);
      if (!el || el.id !== id) return;
      var prev = el.textContent;
      new MutationObserver(function(){
        if (el.textContent === prev) return;
        prev = el.textContent;
        el.classList.remove('fx-flash');
        void el.offsetWidth;
        el.classList.add('fx-flash');
      }).observe(el, { childList: true, characterData: true, subtree: true });
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
    c.appendChild(ring);
    body.appendChild(c);

    var dropped = false;
    function drop(){
      if (dropped) return;
      dropped = true;
      c.classList.add('gone');
      body.classList.add('fx-loaded');
      setTimeout(function(){ if (c.parentNode) c.parentNode.removeChild(c); }, 620);
    }
    setTimeout(drop, 1200);                       /* hard ceiling */
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
    }, 90);
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
    bindMagnet();
    watchBadge();
    flashCalcs();
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
  }

  mountHalo();                    /* earliest possible: before first paint */
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once: true });
    window.addEventListener('load', boot, { once: true });   /* belt and braces */
  } else {
    boot();
  }
})();
