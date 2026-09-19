/* ID KNIT — knit renderer: pixel font, stitches, the label maker and the hero wordmark. */
(function () {
  'use strict';

  /* 5x7 pixel font, the same blocky hand as the real jacquard label */
  var FONT = {
    A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,10001,11110,10001,10001,11110',
    C: '01111,10000,10000,10000,10000,10000,01111', D: '11100,10010,10001,10001,10001,10010,11100',
    E: '11111,10000,10000,11110,10000,10000,11111', F: '11111,10000,10000,11110,10000,10000,10000',
    G: '01111,10000,10000,10011,10001,10001,01111', H: '10001,10001,10001,11111,10001,10001,10001',
    I: '00100,00100,00100,00100,00100,00100,00100', J: '00111,00010,00010,00010,00010,10010,01100',
    K: '10001,10010,10100,11000,10100,10010,10001', L: '10000,10000,10000,10000,10000,10000,11111',
    M: '10001,11011,10101,10101,10001,10001,10001', N: '10001,11001,10101,10101,10011,10001,10001',
    O: '01110,10001,10001,10001,10001,10001,01110', P: '11110,10001,10001,11110,10000,10000,10000',
    Q: '01110,10001,10001,10001,10101,10010,01101', R: '11110,10001,10001,11110,10100,10010,10001',
    S: '01111,10000,10000,01110,00001,00001,11110', T: '11111,00100,00100,00100,00100,00100,00100',
    U: '10001,10001,10001,10001,10001,10001,01110', V: '10001,10001,10001,10001,01010,01010,00100',
    W: '10001,10001,10001,10101,10101,11011,10001', X: '10001,10001,01010,00100,01010,10001,10001',
    Y: '10001,10001,01010,00100,00100,00100,00100', Z: '11111,00001,00010,00100,01000,10000,11111',
    0: '01110,10001,10011,10101,11001,10001,01110', 1: '00100,01100,00100,00100,00100,00100,01110',
    2: '01110,10001,00001,00110,01000,10000,11111', 3: '11110,00001,00001,01110,00001,00001,11110',
    4: '10010,10010,10010,11111,00010,00010,00010', 5: '11111,10000,11110,00001,00001,10001,01110',
    6: '01110,10000,11110,10001,10001,10001,01110', 7: '11111,00001,00010,00100,01000,01000,01000',
    8: '01110,10001,10001,01110,10001,10001,01110', 9: '01110,10001,10001,01111,00001,00001,01110',
    ' ': '00000,00000,00000,00000,00000,00000,00000'
  };
  Object.keys(FONT).forEach(function (k) { FONT[k] = FONT[k].split(','); });

  function clean(s) {
    s = (s || '').toUpperCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/[^A-Z0-9 ]/g, '');
  }
  function textWidth(t, scale) { return t.length ? (t.length * 6 - 1) * scale : 0; }
  function stamp(grid, cols, t, x0, y0, scale) {
    for (var i = 0; i < t.length; i++) {
      var g = FONT[t[i]]; if (!g) continue;
      for (var r = 0; r < 7; r++) for (var c = 0; c < 5; c++) if (g[r][c] === '1')
        for (var sy = 0; sy < scale; sy++) for (var sx = 0; sx < scale; sx++) {
          var x = x0 + (i * 6 + c) * scale + sx, y = y0 + r * scale + sy;
          if (x >= 0 && x < cols) grid[y * cols + x] = 1;
        }
    }
  }

  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }
  function stitch(ctx, x, y, w, h, hex) {
    var cx = x + w / 2, top = y - h * 0.3, bot = y + h * 1.02, lw = w * 0.42;
    ctx.lineCap = 'round';
    ctx.strokeStyle = shade(hex, -0.42); ctx.lineWidth = lw * 1.28;
    ctx.beginPath(); ctx.moveTo(x + w * 0.2, top); ctx.lineTo(cx - w * 0.04, bot); ctx.moveTo(x + w * 0.8, top); ctx.lineTo(cx + w * 0.04, bot); ctx.stroke();
    ctx.strokeStyle = hex; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x + w * 0.2, top); ctx.lineTo(cx - w * 0.04, bot); ctx.moveTo(x + w * 0.8, top); ctx.lineTo(cx + w * 0.04, bot); ctx.stroke();
    ctx.strokeStyle = shade(hex, 0.3); ctx.lineWidth = Math.max(0.6, lw * 0.2);
    ctx.beginPath(); ctx.moveTo(x + w * 0.16, top + h * 0.14); ctx.lineTo(cx - w * 0.14, bot - h * 0.24); ctx.moveTo(x + w * 0.76, top + h * 0.14); ctx.lineTo(cx - w * 0.02, bot - h * 0.3); ctx.stroke();
  }
  /* draws rows [0, fullRows) completely and `partial` stitches of the next row (serpentine, like a carriage) */
  function drawFabric(ctx, W, H, grid, cols, rows, ground, yarn, fullRows, partial) {
    var w = W / cols, h = H / rows;
    for (var y = 0; y < rows; y++) {
      var lim = y < fullRows ? cols : (y === fullRows ? partial : 0); if (!lim) continue;
      var ltr = y % 2 === 0;
      for (var i = 0; i < lim; i++) { var x = ltr ? i : cols - 1 - i; stitch(ctx, x * w, y * h, w, h, grid[y * cols + x] ? yarn : ground); }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Label maker                                                       */
  /* ---------------------------------------------------------------- */
  var YARNS = [
    { name: 'Cammello', ground: '#c9a673', yarn: '#f1e8d6' },
    { name: 'Ecru', ground: '#efe6d3', yarn: '#b98f57' },
    { name: 'Grigio ID', ground: '#6d6b73', yarn: '#f1e8d6' },
    { name: 'Nero', ground: '#1b1b1d', yarn: '#efe6d3' },
    { name: 'Smeraldo', ground: '#0f7d58', yarn: '#f1e8d6' },
    { name: 'Rosso', ground: '#a8232d', yarn: '#f1e8d6' }
  ];
  var cv = document.getElementById('labelCanvas');
  if (cv) (function () {
    var ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    var input = document.getElementById('nameInput'), carriage = document.getElementById('carriage');
    var note = document.getElementById('makerNote'), knitBtn = document.getElementById('knitBtn');
    var saveBtn = document.getElementById('saveBtn'), shareBtn = document.getElementById('shareBtn');
    var yarnIdx = 0, name = '', grid, cols, rows, raf = 0, running = false;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function build() {
      var t = name || 'KNIT', ns = t.length <= 5 ? 2 : 1, is = ns + 1;        // short names are knitted bigger
      cols = Math.max(35, textWidth(t, ns) + 10, textWidth('ID', is) + 10); rows = Math.round(cols * 1.22);
      grid = new Uint8Array(cols * rows);
      var x, y;
      for (x = 0; x < cols; x++) { grid[2 * cols + x] = 1; grid[(rows - 3) * cols + x] = 1; }           // border
      for (y = 2; y < rows - 2; y++) { grid[y * cols + 2] = 1; grid[y * cols + cols - 3] = 1; }
      var gap = 3 * ns, block = 7 * is + gap + 7 * ns + gap + 1, y0 = Math.round((rows - block) / 2);
      stamp(grid, cols, 'ID', Math.round((cols - textWidth('ID', is)) / 2), y0, is);                     // big “ID”
      stamp(grid, cols, t, Math.round((cols - textWidth(t, ns)) / 2), y0 + 7 * is + gap, ns);            // the name
      var ry = y0 + block - 1;
      for (x = 6; x < cols - 6; x += 2) grid[ry * cols + x] = 1;                                          // stitched rule
    }
    function paint(full, partial) {
      var y = YARNS[yarnIdx];
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = shade(y.ground, -0.72); ctx.fillRect(0, 0, W, H);
      if (full < rows) { ctx.fillStyle = 'rgba(255,255,255,.13)'; for (var n = 0; n < cols; n++) ctx.fillRect((n + 0.5) * W / cols - 1, (full + 1) * H / rows, 2, H); }
      drawFabric(ctx, W, H, grid, cols, rows, y.ground, y.yarn, full, partial || 0);
    }
    function stop() { running = false; cancelAnimationFrame(raf); carriage.classList.remove('is-on'); knitBtn.disabled = false; }
    function knit() {
      stop(); build();
      if (reduced) { paint(rows, 0); return; }
      running = true; knitBtn.disabled = true; carriage.classList.add('is-on');
      var rowTime = 62, start = performance.now(), head = carriage.firstElementChild;
      (function frame(now) {
        if (!running) return;
        var t = (now - start) / rowTime, row = Math.floor(t), f = t - row;
        if (row >= rows) { stop(); paint(rows, 0); note.textContent = 'Fatto. Salvala o condividila.'; return; }
        paint(row, Math.ceil(f * cols));
        var st = cv.getBoundingClientRect();
        carriage.style.transform = 'translateY(' + ((row + 1) / rows * st.height) + 'px)';
        head.style.transform = 'translateX(' + ((row % 2 === 0 ? f : 1 - f) * (st.width - 40)) + 'px)';
        raf = requestAnimationFrame(frame);
      })(start);
    }
    function instant() { stop(); build(); paint(rows, 0); }

    input.addEventListener('input', function () {
      var c = clean(input.value).slice(0, 9); if (c !== input.value) input.value = c;
      name = c.trim(); note.textContent = ''; instant();
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { input.blur(); knit(); } });
    knitBtn.addEventListener('click', knit);

    var box = document.getElementById('yarns');
    YARNS.forEach(function (y, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'yarn' + (i === 0 ? ' is-on' : '');
      b.style.background = 'linear-gradient(135deg,' + y.ground + ' 0 62%,' + y.yarn + ' 62%)'; b.title = y.name; b.setAttribute('aria-label', y.name);
      b.addEventListener('click', function () {
        yarnIdx = i; Array.prototype.forEach.call(box.children, function (o, j) { o.classList.toggle('is-on', j === i); }); instant();
      });
      box.appendChild(b);
    });

    /* export: the label + a small signature strip */
    function exportBlob(cb) {
      instant();
      var out = document.createElement('canvas'); out.width = 1080; out.height = 1350;
      var o = out.getContext('2d');
      o.fillStyle = '#efe7d6'; o.fillRect(0, 0, 1080, 1350);
      o.drawImage(cv, 60, 60, 960, 960);
      o.fillStyle = '#141413'; o.textAlign = 'center';
      o.font = '600 64px "Inter Tight", Arial, sans-serif'; o.fillText('ID KNIT', 540, 1150);
      o.font = 'italic 40px "Bodoni Moda", Georgia, serif'; o.fillText('Identify yourself in our knitwear', 540, 1215);
      o.font = '400 24px "JetBrains Mono", monospace'; o.fillStyle = '#7a7466'; o.fillText('TESSUTO IN ITALIA · RDE “STUDIO”', 540, 1280);
      out.toBlob(function (b) { cb(b); }, 'image/png');
    }
    function fileName() { return 'id-knit-' + (name || 'label').toLowerCase().replace(/\s+/g, '-') + '.png'; }
    saveBtn.addEventListener('click', function () {
      exportBlob(function (blob) {
        if (!blob) { note.textContent = 'Non riesco a creare l’immagine su questo browser.'; return; }
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName();
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        note.textContent = 'Immagine salvata.';
      });
    });
    if (navigator.share && navigator.canShare) {
      shareBtn.hidden = false;
      shareBtn.addEventListener('click', function () {
        exportBlob(function (blob) {
          if (!blob) return;
          var file = new File([blob], fileName(), { type: 'image/png' }), data = { files: [file], text: (window.IDKNIT || {}).shareText || 'ID KNIT' };
          if (!navigator.canShare(data)) { saveBtn.click(); return; }
          navigator.share(data).catch(function () {});
        });
      });
    }

    instant();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); knit(); } }, { threshold: 0.5 });
      io.observe(cv);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {});
  })();

  /* ---------------------------------------------------------------- */
  /* Hero wordmark: “ID KNIT” knitted across the top                   */
  /* ---------------------------------------------------------------- */
  var hero = document.getElementById('heroKnit');
  if (hero) (function () {
    var ctx = hero.getContext('2d'), cols, rows, grid, W, H, dpr, px = -9, py = -9, raf = 0, visible = true;
    var GROUND = '#c9a673', YARN = '#f1e8d6', HOT = '#ffffff';
    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight; if (!W) return;
      hero.width = Math.round(W * dpr); hero.height = Math.round(H * dpr);
      var portrait = H > W * 0.9, lines = portrait ? ['ID', 'KNIT'] : ['ID KNIT'], scale = 2;
      var tw = Math.max.apply(null, lines.map(function (l) { return textWidth(l, scale); }));
      cols = tw + (portrait ? 12 : 20);
      var sw = W / cols; rows = Math.ceil(H / (sw * 0.8));
      grid = new Uint8Array(cols * rows);
      var block = lines.length * 7 * scale + (lines.length - 1) * 4, y0 = Math.max(2, Math.round((rows - block) / 2));
      lines.forEach(function (l, i) { stamp(grid, cols, l, Math.round((cols - textWidth(l, scale)) / 2), y0 + i * (7 * scale + 4), scale); });
      draw();
    }
    var base = document.createElement('canvas');
    function draw() {                       // full fabric once, cached
      if (!W) return;
      base.width = hero.width; base.height = hero.height;
      var b = base.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.fillStyle = shade(GROUND, -0.6); b.fillRect(0, 0, W, H);
      var w = W / cols, h = w * 0.8;
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) stitch(b, x * w, y * h, w, h, grid[y * cols + x] ? YARN : GROUND);
      hot();
    }
    function glow(x, y, w, h, col, a) {       // yarn only, no shadow: no dark halo around the pointer
      var cx = x + w / 2, top = y - h * 0.3, bot = y + h * 1.02;
      ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w * 0.42;
      ctx.beginPath(); ctx.moveTo(x + w * 0.2, top); ctx.lineTo(cx - w * 0.04, bot); ctx.moveTo(x + w * 0.8, top); ctx.lineTo(cx + w * 0.04, bot); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function hot() {                        // only the stitches under the pointer are redrawn
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(base, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var w = W / cols, h = w * 0.8, R = 120;
      var x0 = Math.max(0, Math.floor((px - R) / w)), x1 = Math.min(cols - 1, Math.ceil((px + R) / w));
      var y0 = Math.max(0, Math.floor((py - R) / h)), y1 = Math.min(rows - 1, Math.ceil((py + R) / h));
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
        var dx = (x + 0.5) * w - px, dy = (y + 0.5) * h - py, d = Math.sqrt(dx * dx + dy * dy); if (d >= R) continue;
        var k = 1 - d / R, on = grid[y * cols + x];
        glow(x * w, y * h, w, h, on ? HOT : shade(GROUND, 0.45), on ? k : k * 0.8);
      }
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (visible) hot(); }); }
    hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; schedule(); });
    hero.addEventListener('pointerleave', function () { px = py = -999; schedule(); });
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(build, 150); });
    build();
  })();
})();
