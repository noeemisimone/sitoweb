// ============================================================================
// OVERVIEW — "Deep Field" motion engine (vanilla, no deps).
// Animated cosmos background, hero galaxy, cursor star-trail, scroll reveals,
// magnetic buttons and animated counters. Presentation only — every canvas is
// pointer-events:none and everything respects prefers-reduced-motion + pauses
// when the tab is hidden.
// ============================================================================
(function () {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var ACCENT = [142, 162, 255];
    var VIOLET = [185, 140, 255];

    // Flag the profile page so the decorative cosmos steps aside.
    if (document.querySelector('.profile-bg')) {
        document.body.classList.add('has-profile-bg');
    }

    var mx = 0, my = 0;          // normalized mouse (-0.5..0.5)
    if (fine && !reduce) {
        window.addEventListener('mousemove', function (e) {
            mx = e.clientX / window.innerWidth - 0.5;
            my = e.clientY / window.innerHeight - 0.5;
        }, { passive: true });
    }

    // ------------------------------------------------------------------
    // 1) Background starfield + drifting nebula (#space-bg)
    // ------------------------------------------------------------------
    (function background() {
        var c = document.getElementById('space-bg');
        if (!c || !c.getContext) return;
        var ctx = c.getContext('2d');
        var w, h, stars = [], neb = [], t = 0, raf = null, alive = false;

        function size() {
            w = c.width = Math.floor(innerWidth * DPR);
            h = c.height = Math.floor(innerHeight * DPR);
            c.style.width = innerWidth + 'px';
            c.style.height = innerHeight + 'px';
            build();
        }
        function build() {
            var n = Math.min(200, Math.floor((innerWidth * innerHeight) / 8000));
            stars = [];
            for (var i = 0; i < n; i++) {
                stars.push({
                    x: Math.random() * w, y: Math.random() * h,
                    r: (Math.random() * 1.1 + 0.25) * DPR,
                    p: Math.random() * Math.PI * 2,
                    s: Math.random() * 0.02 + 0.004,
                    d: Math.random() * 0.8 + 0.2,
                    warm: Math.random() < 0.12
                });
            }
            neb = [
                { x: w * 0.8, y: h * 0.1, r: Math.max(w, h) * 0.5, col: ACCENT, a: 0.10 },
                { x: w * 0.1, y: h * 0.9, r: Math.max(w, h) * 0.45, col: VIOLET, a: 0.09 }
            ];
        }
        function frame(animate) {
            ctx.clearRect(0, 0, w, h);
            // soft drifting nebula blobs
            for (var k = 0; k < neb.length; k++) {
                var b = neb[k];
                var dx = Math.cos(t * 0.0003 + k) * 30 * DPR + mx * 40 * DPR;
                var dy = Math.sin(t * 0.0004 + k) * 30 * DPR + my * 40 * DPR;
                var g = ctx.createRadialGradient(b.x + dx, b.y + dy, 0, b.x + dx, b.y + dy, b.r);
                g.addColorStop(0, 'rgba(' + b.col.join(',') + ',' + b.a + ')');
                g.addColorStop(1, 'rgba(' + b.col.join(',') + ',0)');
                ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
            }
            // stars
            for (var i = 0; i < stars.length; i++) {
                var st = stars[i];
                var a = 0.5;
                if (animate) { st.p += st.s; a = 0.35 + Math.sin(st.p) * 0.4; }
                ctx.globalAlpha = a < 0 ? 0 : a;
                ctx.beginPath();
                ctx.arc(st.x + mx * st.d * 30 * DPR, st.y + my * st.d * 30 * DPR, st.r, 0, 6.2832);
                ctx.fillStyle = st.warm ? '#ffd6a6' : '#e6ecff';
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            if (animate) { t++; raf = requestAnimationFrame(function () { frame(true); }); }
        }
        function start() { if (alive || reduce) return; alive = true; frame(true); }
        function stop() { alive = false; if (raf) cancelAnimationFrame(raf); raf = null; }

        addEventListener('resize', function () { size(); if (reduce) frame(false); }, { passive: true });
        document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
        size();
        reduce ? frame(false) : start();
    })();

    // ------------------------------------------------------------------
    // 2) Hero galaxy — spiral (canvas.hero-galaxy, home only)
    // ------------------------------------------------------------------
    (function galaxy() {
        var c = document.querySelector('canvas.hero-galaxy');
        if (!c || !c.getContext) return;
        var ctx = c.getContext('2d');
        var w, h, cx, cy, parts = [], stars = [], ang = 0, raf = null, alive = false;
        var ARMS = 4, TWIST = 3.6;

        function size() {
            var rect = c.getBoundingClientRect();
            w = c.width = Math.max(1, Math.floor(rect.width * DPR));
            h = c.height = Math.max(1, Math.floor(rect.height * DPR));
            cx = w / 2; cy = h / 2; build();
        }
        function build() {
            var maxR = Math.min(w, h) * 0.46;
            var n = Math.min(820, Math.floor((w * h) / (3000 * DPR)));
            parts = [];
            for (var i = 0; i < n; i++) {
                var tt = Math.pow(Math.random(), 0.62);
                var radius = tt * maxR;
                var arm = Math.floor(Math.random() * ARMS);
                var spiral = (arm / ARMS) * 6.2832 + (radius / maxR) * TWIST * Math.PI;
                // Tighter scatter packs the stars closer to each arm's ridge, so
                // the spiral arms read as crisp, defined lanes rather than a haze.
                var scatter = (1 - tt) * 0.11 + 0.03;
                var theta = spiral + (Math.random() - 0.5) * scatter * Math.PI;
                var core = 1 - tt;
                parts.push({
                    r: radius, theta: theta,
                    size: (Math.random() * 1.1 + 0.4) * DPR * (0.6 + core),
                    alpha: 0.42 + Math.random() * 0.5,
                    rr: Math.round(ACCENT[0] + (255 - ACCENT[0]) * core),
                    gg: Math.round(ACCENT[1] + (255 - ACCENT[1]) * core),
                    bb: Math.round(ACCENT[2] + (255 - ACCENT[2]) * core),
                    // Higher floor so even the outer arms visibly sweep round;
                    // the centre still turns faster (differential rotation).
                    speed: 0.18 + core * 0.24
                });
            }
            var s = Math.min(160, Math.floor((w * h) / (11000 * DPR)));
            stars = [];
            for (var j = 0; j < s; j++) stars.push({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 0.9 + 0.3) * DPR, p: Math.random() * 6.28, s: Math.random() * 0.02 + 0.004 });
        }
        function glow() {
            var px = cx + mx * 16 * DPR, py = cy + my * 16 * DPR, maxR = Math.min(w, h) * 0.46;
            var g1 = ctx.createRadialGradient(px, py, 0, px, py, maxR * 1.2);
            g1.addColorStop(0, 'rgba(142,162,255,0.28)'); g1.addColorStop(0.4, 'rgba(142,162,255,0.07)'); g1.addColorStop(1, 'rgba(142,162,255,0)');
            ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);
            var cr = maxR * 0.14;
            var g2 = ctx.createRadialGradient(px, py, 0, px, py, cr);
            g2.addColorStop(0, 'rgba(255,255,255,0.95)'); g2.addColorStop(0.5, 'rgba(142,162,255,0.5)'); g2.addColorStop(1, 'rgba(142,162,255,0)');
            ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
        }
        function frame(animate) {
            ctx.clearRect(0, 0, w, h);
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i]; var a = 0.5;
                if (animate) { s.p += s.s; a = 0.35 + Math.sin(s.p) * 0.35; }
                ctx.globalAlpha = a < 0 ? 0 : a;
                ctx.beginPath(); ctx.arc(s.x + mx * 26 * DPR, s.y + my * 26 * DPR, s.r, 0, 6.2832);
                ctx.fillStyle = '#dfe6ff'; ctx.fill();
            }
            glow();
            var ox = cx + mx * 16 * DPR, oy = cy + my * 16 * DPR;
            ctx.globalCompositeOperation = 'lighter';
            for (var p = 0; p < parts.length; p++) {
                var pt = parts[p]; var th = pt.theta + ang * pt.speed;
                ctx.globalAlpha = pt.alpha;
                ctx.beginPath();
                ctx.arc(ox + Math.cos(th) * pt.r, oy + Math.sin(th) * pt.r * 0.62, pt.size, 0, 6.2832);
                ctx.fillStyle = 'rgb(' + pt.rr + ',' + pt.gg + ',' + pt.bb + ')';
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
            // Faster than before so the rotation is clearly visible, yet slow
            // enough to stay smooth and elegant.
            if (animate) { ang += 0.007; raf = requestAnimationFrame(function () { frame(true); }); }
        }
        function start() { if (alive || reduce) return; alive = true; frame(true); }
        function stop() { alive = false; if (raf) cancelAnimationFrame(raf); raf = null; }
        addEventListener('resize', function () { size(); if (reduce) frame(false); }, { passive: true });
        document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
        size();
        reduce ? frame(false) : start();
    })();

    // ------------------------------------------------------------------
    // 3) Cursor star-trail (#cursor-fx)
    // ------------------------------------------------------------------
    (function cursorTrail() {
        if (reduce || !fine) return;
        var c = document.getElementById('cursor-fx');
        if (!c || !c.getContext) return;
        var ctx = c.getContext('2d');
        var w, h, trail = [], last = 0;
        function size() {
            w = c.width = Math.floor(innerWidth * DPR);
            h = c.height = Math.floor(innerHeight * DPR);
            c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
        }
        addEventListener('resize', size, { passive: true }); size();
        addEventListener('mousemove', function (e) {
            var now = performance.now();
            if (now - last < 16) return; last = now;
            trail.push({ x: e.clientX * DPR, y: e.clientY * DPR, life: 1, r: (Math.random() * 1.6 + 0.8) * DPR });
            if (trail.length > 60) trail.shift();
        }, { passive: true });
        (function loop() {
            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'lighter';
            for (var i = 0; i < trail.length; i++) {
                var p = trail[i]; p.life -= 0.03;
                if (p.life <= 0) continue;
                ctx.globalAlpha = p.life * 0.6;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, 6.2832);
                ctx.fillStyle = 'rgba(170,190,255,1)'; ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
            trail = trail.filter(function (p) { return p.life > 0; });
            requestAnimationFrame(loop);
        })();
    })();

    // ------------------------------------------------------------------
    // 4) Scroll reveal + animated counters
    // ------------------------------------------------------------------
    (function reveal() {
        var els = document.querySelectorAll('[data-reveal]');
        if (!els.length) { runCounters(document); return; }
        if (reduce || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('in'); });
            runCounters(document);
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('in');
                    runCounters(en.target);
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        els.forEach(function (el) { io.observe(el); });
        // counters that aren't inside a reveal still animate on load
        runCounters(document, true);
    })();

    function runCounters(scope, onlyOrphans) {
        var nums = scope.querySelectorAll('[data-count]');
        nums.forEach(function (el) {
            if (el.dataset.done) return;
            if (onlyOrphans && el.closest('[data-reveal]')) return;
            el.dataset.done = '1';
            var target = parseInt(el.getAttribute('data-count'), 10) || 0;
            if (reduce) { el.textContent = target; return; }
            var start = performance.now(), dur = 1100;
            (function tick(now) {
                var t = Math.min(1, (now - start) / dur);
                var eased = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.round(target * eased);
                if (t < 1) requestAnimationFrame(tick);
                else el.textContent = target;
            })(start);
        });
    }

    // ------------------------------------------------------------------
    // 5) Magnetic buttons
    // ------------------------------------------------------------------
    (function magnetic() {
        if (reduce || !fine) return;
        var btns = document.querySelectorAll('.btn, .auth-submit');
        btns.forEach(function (b) {
            b.addEventListener('mousemove', function (e) {
                var r = b.getBoundingClientRect();
                var x = e.clientX - r.left - r.width / 2;
                var y = e.clientY - r.top - r.height / 2;
                b.style.transform = 'translate(' + (x * 0.25) + 'px,' + (y * 0.35) + 'px)';
            });
            b.addEventListener('mouseleave', function () { b.style.transform = ''; });
        });
    })();
})();
