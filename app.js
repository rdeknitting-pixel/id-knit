/* ID KNIT — page behaviour: Depop links, product viewer, reel, sticky CTA, reveals. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var cfg = window.IDKNIT || {};

  /* every buy button points at the Depop listing set in config.js */
  $$('.js-depop').forEach(function (a) { a.href = cfg.depopUrl || 'https://www.depop.com/'; });

  /* product viewer: front / back + numbered hotspots */
  var img = $('#viewerImg'), spots = $('#spots'), feats = $$('#features li');
  var VIEWS = {
    davanti: { src: 'assets/indossato-davanti.webp', alt: 'Maglione ID KNIT grigio indossato, visto di fronte' },
    dietro: { src: 'assets/indossato-dietro.webp', alt: 'Maglione ID KNIT indossato visto da dietro: maglia rasata e raglan' },
    manica: { src: 'assets/indossato-profilo-manica.webp', alt: 'Maglione ID KNIT di profilo: la treccia lungo tutta la manica' },
    steso: { src: 'assets/maglione-davanti.webp', alt: 'Il maglione ID KNIT steso, foto reale' }
  };
  $$('.viewer__tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = VIEWS[b.getAttribute('data-view')]; if (!v) return;
      $$('.viewer__tabs button').forEach(function (o) { var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-selected', on); });
      img.style.opacity = 0;
      var pre = new Image();
      pre.onload = pre.onerror = function () { img.src = v.src; img.alt = v.alt; img.style.opacity = 1; };
      pre.src = v.src;
      spots.hidden = b.getAttribute('data-view') !== 'davanti';
      img.parentNode.classList.toggle('is-flat', b.getAttribute('data-view') === 'steso');
    });
  });
  function select(i, scroll) {
    $$('.spot').forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-spot') === String(i)); });
    feats.forEach(function (f) { f.classList.toggle('is-on', f.getAttribute('data-f') === String(i)); });
    if (scroll && feats[i] && window.innerWidth < 900) feats[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  $$('.spot').forEach(function (s) { s.addEventListener('click', function () { select(s.getAttribute('data-spot'), true); }); });
  feats.forEach(function (f) {
    f.addEventListener('click', function () { select(f.getAttribute('data-f'), false); });
    f.addEventListener('mouseenter', function () { select(f.getAttribute('data-f'), false); });
  });
  select(2, false);

  /* videos play only while on screen */
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); } else e.target.pause();
      });
    }, { threshold: 0.35 });
    $$('.clip video').forEach(function (v) { v.muted = true; vio.observe(v); });

    /* reveals */
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.documentElement.classList.add('js');
    $$('.kicker, h2, .sub, .maker, .viewer, .features li, .details figure, .foot__big').forEach(function (el) { el.classList.add('rv'); rio.observe(el); });
  }

  /* the eight steps: arrows, counter, progress */
  (function () {
    var reel = $('#reel'); if (!reel) return;
    var cards = $$('.clip', reel), prev = $('#stepPrev'), next = $('#stepNext'), count = $('#stepCount'), bar = $('#stepBar');
    function current() {
      var x = reel.scrollLeft + reel.clientWidth * 0.35, idx = 0;
      cards.forEach(function (c, i) { if (c.offsetLeft - reel.offsetLeft <= x) idx = i; });
      if (reel.scrollLeft + reel.clientWidth >= reel.scrollWidth - 4) idx = cards.length - 1;
      return idx;
    }
    function update() {
      var i = current();
      count.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + cards.length).slice(-2);
      bar.style.transform = 'scaleX(' + ((i + 1) / cards.length) + ')';
      prev.disabled = reel.scrollLeft < 4; next.disabled = reel.scrollLeft + reel.clientWidth >= reel.scrollWidth - 4;
    }
    function go(d) {
      var i = Math.max(0, Math.min(cards.length - 1, current() + d)), pad = parseFloat(getComputedStyle(reel).paddingLeft) || 0;
      reel.scrollTo({ left: cards[i].offsetLeft - reel.offsetLeft - pad, behavior: 'smooth' });
    }
    prev.addEventListener('click', function () { go(-1); }); next.addEventListener('click', function () { go(1); });
    reel.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update); update();
  })();

  /* step 08: drag to turn the finished sweater (front, side, back) with a little 3D tilt */
  (function () {
    var box = $('#spin'), card = $('#spinCard'); if (!box) return;
    var frames = $$('img', card), idx = 0, startX = 0, startIdx = 0, drag = false, used = false, auto = 0;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(i) { idx = Math.max(0, Math.min(frames.length - 1, i)); frames.forEach(function (f, j) { f.classList.toggle('is-on', j === idx); }); }
    function tilt(rx, ry) { card.style.transform = 'rotateY(' + ry + 'deg) rotateX(' + rx + 'deg)'; }
    box.addEventListener('pointerdown', function (e) {
      drag = true; used = true; startX = e.clientX; startIdx = idx; box.classList.add('is-drag', 'is-used'); clearInterval(auto);
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
    });
    box.addEventListener('pointermove', function (e) {
      var r = box.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      if (!reduced) tilt(-ny * 8, nx * 14);
      if (!drag) return;
      var step = Math.max(40, r.width / 4), d = Math.round((startX - e.clientX) / step);
      var n = startIdx + d, span = frames.length - 1, m = ((n % (span * 2)) + span * 2) % (span * 2);   // ping-pong: 0 1 2 1 0
      show(m > span ? span * 2 - m : m);
    });
    function end() { drag = false; box.classList.remove('is-drag'); }
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
    box.addEventListener('pointerleave', function () { if (!drag) tilt(0, 0); });
    if (!reduced && 'IntersectionObserver' in window) {
      var dir = 1;
      new IntersectionObserver(function (en) {
        clearInterval(auto);
        if (en[0].isIntersecting && !used) auto = setInterval(function () {
          if (idx + dir > frames.length - 1 || idx + dir < 0) dir = -dir;
          show(idx + dir);
        }, 1700);
      }, { threshold: 0.6 }).observe(box);
    }
  })();

  /* sticky buy bar: appears from the product on (never over the label maker), hides over the footer's own button */
  var sticky = $('#sticky'), product = $('#maglione'), foot = $('.foot');
  function onScroll() {
    var y = window.pageYOffset, show = y > product.offsetTop - window.innerHeight * 0.4 && foot.getBoundingClientRect().top > window.innerHeight * 0.75;
    sticky.classList.toggle('is-on', show);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
