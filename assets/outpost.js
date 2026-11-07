/*
 * XDC Outpost shared behaviour for tool pages
 *  - draws the lattice field behind the page hero (same motif as the home page)
 *  - gives the floating header its glass background once the page scrolls
 * Self-contained, no dependencies. Safe to load with `defer`.
 */
(function () {
  var doc = document.documentElement;
  doc.classList.add('outpost-js');

  // Pages still declare the old dark theme-color; match the light theme instead.
  var tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', '#FFFFFF');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* ---------- Header state ---------- */
    var header = document.querySelector('.site-header');
    if (header) {
      var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* ---------- Lattice ---------- */
    var hero = document.querySelector('.hero');
    if (!hero || !window.HTMLCanvasElement) return;
    // Installed PWA view keeps things lean
    if (window.matchMedia && matchMedia('(display-mode: standalone)').matches) return;

    var cv = document.createElement('canvas');
    cv.className = 'outpost-lattice';
    cv.setAttribute('aria-hidden', 'true');
    hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var W = 0, H = 0, pts = [], cols = 0, rows = 0, beacons = [];
    var running = false, visible = true, t0 = performance.now();
    var ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    function build() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      if (!W || !H) return;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var step = W < 640 ? 46 : 54, rowH = step * 0.86;
      cols = Math.ceil(W / step) + 4; rows = Math.ceil(H / rowH) + 2;
      pts = [];
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++)
        pts.push({ bx: (i - 2) * step + (j % 2) * step * 0.5, by: j * rowH - step * 0.4, ph: Math.random() * 6.28, x: 0, y: 0, a: 0 });
      beacons = [];
      for (var k = 0; k < 4; k++) beacons.push({ i: (Math.random() * pts.length) | 0, ph: Math.random() * 6.28 });
    }

    function edge(p, q) {
      if (!q) return;
      var a = Math.max(p.a, q.a);
      ctx.strokeStyle = a > 0.02 ? 'rgba(29,92,150,' + (0.08 + a * 0.3) + ')' : 'rgba(15,30,51,0.06)';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    }

    function frame(now) {
      var t = (now - t0) / 1000, i, j, p;
      ptr.x += (ptr.tx - ptr.x) * 0.12; ptr.y += (ptr.ty - ptr.y) * 0.12;
      ctx.clearRect(0, 0, W, H);
      var R = Math.min(240, W * 0.35);
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        var x = p.bx + Math.sin(t * 0.35 + p.ph) * 3, y = p.by + Math.cos(t * 0.3 + p.ph * 1.3) * 3;
        var dx = x - ptr.x, dy = y - ptr.y, d = Math.sqrt(dx * dx + dy * dy), a = 0;
        if (d < R) { var f = 1 - d / R; a = f * f; var push = a * 24; x += dx / (d || 1) * push; y += dy / (d || 1) * push; }
        p.x = x; p.y = y; p.a = a;
      }
      ctx.lineWidth = 1;
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
        p = pts[j * cols + i];
        if (i + 1 < cols) edge(p, pts[j * cols + i + 1]);
        if (j + 1 < rows) {
          var off = j % 2, l = i - 1 + off, r = i + off;
          if (l >= 0) edge(p, pts[(j + 1) * cols + l]);
          if (r < cols) edge(p, pts[(j + 1) * cols + r]);
        }
      }
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        ctx.fillStyle = p.a > 0.02 ? 'rgba(29,92,150,' + (0.3 + p.a * 0.5) + ')' : 'rgba(15,30,51,0.16)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.1 + p.a * 1.5, 0, 6.283); ctx.fill();
      }
      for (i = 0; i < beacons.length; i++) {
        p = pts[beacons[i].i]; if (!p) continue;
        var s = (Math.sin(t * 0.9 + beacons[i].ph) + 1) / 2;
        ctx.fillStyle = 'rgba(176,132,51,' + (0.35 + s * 0.5) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(176,132,51,' + ((1 - s) * 0.35) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 + s * 14, 0, 6.283); ctx.stroke();
      }
      if (running) requestAnimationFrame(frame);
    }
    function start() { if (!running && !reduce && visible && !document.hidden && W) { running = true; requestAnimationFrame(frame); } }
    function stop() { running = false; }

    build();
    if (reduce) { if (W) frame(performance.now()); } else start();

    var rz;
    addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () { build(); if (reduce && W) frame(performance.now()); else start(); }, 150);
    });
    // Heroes can change height as content loads; rebuild when they do.
    if (window.ResizeObserver) {
      var lastH = 0;
      new ResizeObserver(function () {
        var h = hero.getBoundingClientRect().height;
        if (Math.abs(h - lastH) > 24) { lastH = h; build(); if (reduce && W) frame(performance.now()); else start(); }
      }).observe(hero);
    }
    if (window.IntersectionObserver)
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    hero.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect(); ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top;
      if (ptr.x < -999) { ptr.x = ptr.tx; ptr.y = ptr.ty; }
    });
    hero.addEventListener('pointerleave', function () { ptr.tx = ptr.ty = -9999; });
  });
})();
