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
    davanti: { src: 'assets/maglione-davanti.webp', alt: 'Maglione ID KNIT grigio, cropped, collo alto, visto di fronte' },
    dietro: { src: 'assets/maglione-dietro.webp', alt: 'Maglione ID KNIT grigio visto da dietro, maglia rasata' }
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
    $$('.kicker, h2, .sub, .maker, .viewer, .features li, .details figure, .clip, .team, .foot__big').forEach(function (el) { el.classList.add('rv'); rio.observe(el); });
  }

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
