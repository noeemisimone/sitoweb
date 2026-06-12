// ============================================================================
// OVERVIEW — "Deep Field" motion engine (vanilla, no deps).
// Animated cosmos background, 3D hero galaxy, cursor star-trail, scroll
// reveals, magnetic buttons and animated counters. Presentation only — every
// canvas is pointer-events:none and everything respects prefers-reduced-motion
// + pauses when the tab is hidden. No external libraries, 60fps-minded:
// particle counts and devicePixelRatio are capped and scaled down on mobile.
// ============================================================================
(function () {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var ACCENT = [142, 162, 255];   // blue
    var VIOLET = [185, 140, 255];   // nebula violet
    var PINK = [255, 150, 205];     // nebula pink (arm edges)

    function isMobile() { return Math.min(window.innerWidth, window.innerHeight) < 760; }

    // Flag the profile page so the decorative cosmos steps aside.
    if (document.querySelector('.profile-bg')) {
        document.body.classList.add('has-profile-bg');
    }

    // Normalised mouse (-0.5..0.5) for parallax + a smoothed copy the cosmos
    // eases toward, so motion feels weighty rather than twitchy.
    var mx = 0, my = 0, smx = 0, smy = 0;
    if (fine && !reduce) {
        window.addEventListener('mousemove', function (e) {
            mx = e.clientX / window.innerWidth - 0.5;
            my = e.clientY / window.innerHeight - 0.5;
        }, { passive: true });
    }
    function easeMouse() { smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06; }

    // Small colour-ramp helper: blends a list of [pos,[r,g,b]] stops at t∈[0,1].
    function rampAt(stops, t) {
        if (t <= stops[0][0]) return stops[0][1];
        for (var i = 1; i < stops.length; i++) {
            if (t <= stops[i][0]) {
                var a = stops[i - 1], b = stops[i];
                var u = (t - a[0]) / (b[0] - a[0]);
                return [
                    Math.round(a[1][0] + (b[1][0] - a[1][0]) * u),
                    Math.round(a[1][1] + (b[1][1] - a[1][1]) * u),
                    Math.round(a[1][2] + (b[1][2] - a[1][2]) * u)
                ];
            }
        }
        return stops[stops.length - 1][1];
    }

    // ------------------------------------------------------------------
    // 1) Background: layered-parallax starfield + drifting nebula +
    //    occasional shooting stars + gentle gravitational pull to cursor.
    //    (#space-bg)
    // ------------------------------------------------------------------
    (function background() {
        var c = document.getElementById('space-bg');
        if (!c || !c.getContext) return;
        var ctx = c.getContext('2d');
        var w, h, stars = [], neb = [], meteors = [], t = 0, raf = null, alive = false;

        function size() {
            w = c.width = Math.floor(innerWidth * DPR);
            h = c.height = Math.floor(innerHeight * DPR);
            c.style.width = innerWidth + 'px';
            c.style.height = innerHeight + 'px';
            build();
        }
        function build() {
            var mob = isMobile();
            // Three depth layers → real parallax. Nearer layers are bigger,
            // brighter and drift further with the mouse; far layers barely move.
            var area = innerWidth * innerHeight;
            var n = mob ? Math.min(150, Math.floor(area / 11000))
                        : Math.min(340, Math.floor(area / 6500));
            stars = [];
            for (var i = 0; i < n; i++) {
                var layer = i % 3;                 // 0 far … 2 near
                var depth = 0.35 + layer * 0.32;   // parallax + size factor
                stars.push({
                    x: Math.random() * w, y: Math.random() * h,
                    r: (Math.random() * 0.8 + 0.25) * DPR * (0.6 + depth),
                    p: Math.random() * Math.PI * 2,
                    s: Math.random() * 0.02 + 0.004,
                    d: depth,
                    warm: Math.random() < 0.10,
                    cold: Math.random() < 0.10
                });
            }
            // Soft, large nebula clouds: blue, violet and a touch of pink.
            neb = [
                { x: w * 0.80, y: h * 0.08, r: Math.max(w, h) * 0.55, col: ACCENT, a: 0.11 },
                { x: w * 0.08, y: h * 0.92, r: Math.max(w, h) * 0.50, col: VIOLET, a: 0.10 },
                { x: w * 0.55, y: h * 0.65, r: Math.max(w, h) * 0.40, col: PINK, a: 0.05 }
            ];
        }
        function spawnMeteor() {
            // Enter from the top band, streak down-right across the screen.
            var fromLeft = Math.random();
            meteors.push({
                x: fromLeft * w * 0.9,
                y: -0.05 * h,
                vx: (2.2 + Math.random() * 1.6) * DPR,
                vy: (3.4 + Math.random() * 2.0) * DPR,
                len: (90 + Math.random() * 120) * DPR,
                life: 1
            });
        }
        function frame(animate) {
            easeMouse();
            ctx.clearRect(0, 0, w, h);

            // drifting nebula blobs
            for (var k = 0; k < neb.length; k++) {
                var b = neb[k];
                var dx = Math.cos(t * 0.0003 + k) * 30 * DPR + smx * 45 * DPR;
                var dy = Math.sin(t * 0.0004 + k) * 30 * DPR + smy * 45 * DPR;
                var g = ctx.createRadialGradient(b.x + dx, b.y + dy, 0, b.x + dx, b.y + dy, b.r);
                g.addColorStop(0, 'rgba(' + b.col.join(',') + ',' + b.a + ')');
                g.addColorStop(1, 'rgba(' + b.col.join(',') + ',0)');
                ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
            }

            // gravitational-lens pull toward the cursor (desktop only)
            var pull = (fine && !reduce);
            var mpx = (smx + 0.5) * w, mpy = (smy + 0.5) * h;
            var R2 = (150 * DPR) * (150 * DPR);

            // stars, by depth layer
            for (var i = 0; i < stars.length; i++) {
                var st = stars[i];
                var a = 0.55;
                if (animate) { st.p += st.s; a = 0.4 + Math.sin(st.p) * 0.4; }
                var px = st.x + smx * st.d * 42 * DPR;
                var py = st.y + smy * st.d * 42 * DPR;
                if (pull) {
                    var gx = mpx - px, gy = mpy - py;
                    var f = R2 / (gx * gx + gy * gy + R2) * 0.32 * st.d;
                    px += gx * f; py += gy * f;
                }
                ctx.globalAlpha = a < 0 ? 0 : a;
                ctx.beginPath();
                ctx.arc(px, py, st.r, 0, 6.2832);
                ctx.fillStyle = st.warm ? '#ffd6a6' : (st.cold ? '#bfe9ff' : '#e6ecff');
                ctx.fill();
                // a faint bloom halo on the nearest, brightest stars
                if (st.d > 0.9 && st.r > 1.1 * DPR) {
                    ctx.globalAlpha = (a < 0 ? 0 : a) * 0.5;
                    ctx.beginPath();
                    ctx.arc(px, py, st.r * 2.6, 0, 6.2832);
                    ctx.fillStyle = 'rgba(170,190,255,0.10)';
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;

            // shooting stars
            if (animate && !reduce) {
                if (meteors.length < 2 && Math.random() < 0.006) spawnMeteor();
                ctx.globalCompositeOperation = 'lighter';
                for (var m = meteors.length - 1; m >= 0; m--) {
                    var me = meteors[m];
                    me.x += me.vx; me.y += me.vy; me.life -= 0.006;
                    var tx = me.x - me.vx / Math.hypot(me.vx, me.vy) * me.len;
                    var ty = me.y - me.vy / Math.hypot(me.vx, me.vy) * me.len;
                    var mg = ctx.createLinearGradient(me.x, me.y, tx, ty);
                    mg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * me.life) + ')');
                    mg.addColorStop(0.3, 'rgba(170,200,255,' + (0.5 * me.life) + ')');
                    mg.addColorStop(1, 'rgba(170,200,255,0)');
                    ctx.strokeStyle = mg; ctx.lineWidth = 1.7 * DPR; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(tx, ty); ctx.stroke();
                    if (me.life <= 0 || me.y > h * 1.1 || me.x > w * 1.1) meteors.splice(m, 1);
                }
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
            }

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
    // 2) Hero galaxy — a real 3D point cloud projected in perspective, with
    //    a slow camera drift so it feels like floating in deep space.
    //    Spiral arms, differential rotation, bloom core that breathes, and a
    //    blue→violet→pink colour ramp from core to arm edges.
    //    (canvas.hero-galaxy, home only)
    // ------------------------------------------------------------------
    (function galaxy() {
        var c = document.querySelector('canvas.hero-galaxy');
        if (!c || !c.getContext) return;
        var ctx = c.getContext('2d');
        var w, h, cx, cy, S, parts = [], stars = [], ang = 0, t = 0, raf = null, alive = false;
        var ARMS = 4, TWIST = 3.4, CAM = 2.7, TILT = 1.02;
        var RAMP = [
            [0.00, [255, 255, 255]],
            [0.16, [170, 195, 255]],
            [0.50, VIOLET],
            [1.00, PINK]
        ];

        function size() {
            var rect = c.getBoundingClientRect();
            w = c.width = Math.max(1, Math.floor(rect.width * DPR));
            h = c.height = Math.max(1, Math.floor(rect.height * DPR));
            cx = w / 2; cy = h / 2; S = Math.min(w, h) * 0.46; build();
        }
        function build() {
            var mob = isMobile();
            var n = mob ? Math.min(520, Math.floor((w * h) / (4200 * DPR)))
                        : Math.min(1200, Math.floor((w * h) / (2400 * DPR)));
            parts = [];
            for (var i = 0; i < n; i++) {
                var tt = Math.pow(Math.random(), 0.6);   // radial density (denser core)
                var r = tt;                              // unit radius 0..1
                var arm = Math.floor(Math.random() * ARMS);
                var spiral = (arm / ARMS) * 6.2832 + r * TWIST * Math.PI;
                // Tight scatter near the ridge → crisp, defined arms.
                var scatter = (1 - tt) * 0.10 + 0.025;
                var theta0 = spiral + (Math.random() - 0.5) * scatter * Math.PI;
                // Disk thickness with a fat central bulge (spherical-ish core).
                var bulge = 0.04 + 0.16 * Math.exp(-r * 4.2);
                var z = (Math.random() - 0.5) * 2 * bulge;
                var core = 1 - tt;
                var col = rampAt(RAMP, Math.min(1, r * (0.9 + Math.random() * 0.2)));
                parts.push({
                    r: r, th0: theta0, z: z,
                    size: (Math.random() * 1.0 + 0.45) * DPR * (0.6 + core),
                    alpha: 0.42 + Math.random() * 0.5,
                    rr: col[0], gg: col[1], bb: col[2],
                    speed: 0.20 + core * 0.30        // differential rotation
                });
            }
            // Faint twinkle backdrop within the hero canvas.
            var s = mob ? Math.min(90, Math.floor((w * h) / (16000 * DPR)))
                        : Math.min(170, Math.floor((w * h) / (10000 * DPR)));
            stars = [];
            for (var j = 0; j < s; j++) {
                stars.push({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 0.9 + 0.3) * DPR, p: Math.random() * 6.28, s: Math.random() * 0.02 + 0.004 });
            }
        }
        function glow(breath, ox, oy) {
            // Outer aura that irradiates light, then a hot pulsing core.
            var g1 = ctx.createRadialGradient(ox, oy, 0, ox, oy, S * 1.35 * breath);
            g1.addColorStop(0, 'rgba(150,170,255,0.30)');
            g1.addColorStop(0.35, 'rgba(150,140,255,0.10)');
            g1.addColorStop(0.7, 'rgba(255,150,205,0.05)');
            g1.addColorStop(1, 'rgba(142,162,255,0)');
            ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);
            var cr = S * 0.16 * breath;
            var g2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, cr);
            g2.addColorStop(0, 'rgba(255,255,255,0.98)');
            g2.addColorStop(0.45, 'rgba(180,190,255,0.55)');
            g2.addColorStop(1, 'rgba(142,162,255,0)');
            ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
        }
        function frame(animate) {
            easeMouse();
            ctx.clearRect(0, 0, w, h);

            // backdrop twinkle
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i]; var a = 0.5;
                if (animate) { s.p += s.s; a = 0.35 + Math.sin(s.p) * 0.35; }
                ctx.globalAlpha = a < 0 ? 0 : a;
                ctx.beginPath(); ctx.arc(s.x + smx * 26 * DPR, s.y + smy * 26 * DPR, s.r, 0, 6.2832);
                ctx.fillStyle = '#dfe6ff'; ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Slow camera drift: the whole galaxy tips and yaws gently over time,
            // plus a little extra lean toward the mouse → "floating in space".
            var tiltX = TILT + Math.sin(t * 0.00035) * 0.12 + smy * 0.5;
            var yaw = Math.sin(t * 0.00028) * 0.22 + smx * 0.6;
            var cT = Math.cos(tiltX), sT = Math.sin(tiltX);
            var cY = Math.cos(yaw), sY = Math.sin(yaw);
            var breath = 1 + Math.sin(t * 0.0016) * 0.06;       // core pulse
            var ox = cx + smx * 14 * DPR, oy = cy + smy * 14 * DPR;

            glow(breath, ox, oy);

            ctx.globalCompositeOperation = 'lighter';
            for (var p = 0; p < parts.length; p++) {
                var pt = parts[p];
                var th = pt.th0 + ang * pt.speed;
                var x = Math.cos(th) * pt.r;
                var y = Math.sin(th) * pt.r;
                var z = pt.z;
                // tilt around X, then yaw around Y
                var y2 = y * cT - z * sT;
                var z2 = y * sT + z * cT;
                var x2 = x * cY + z2 * sY;
                var z3 = -x * sY + z2 * cY;
                // perspective projection
                var scale = CAM / (CAM - z3);
                var sx = ox + x2 * scale * S;
                var sy = oy + y2 * scale * S;
                var depth = (scale - 0.6) / 1.3;                // ~0..1 near→far inv
                ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha * (0.5 + depth)));
                ctx.beginPath();
                ctx.arc(sx, sy, pt.size * scale, 0, 6.2832);
                ctx.fillStyle = 'rgb(' + pt.rr + ',' + pt.gg + ',' + pt.bb + ')';
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

            // Maestic but smooth spin (differential via per-particle speed).
            if (animate) { ang += 0.006; t++; raf = requestAnimationFrame(function () { frame(true); }); }
        }
        function start() { if (alive || reduce) return; alive = true; frame(true); }
        function stop() { alive = false; if (raf) cancelAnimationFrame(raf); raf = null; }
        addEventListener('resize', function () { size(); if (reduce) frame(false); }, { passive: true });
        document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
        size();
        reduce ? frame(false) : start();
    })();

    // ------------------------------------------------------------------
    // 3) Cursor star-trail (#cursor-fx) — brighter, with a soft blue→violet
    //    glow that fades as it falls behind the pointer.
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
            trail.push({ x: e.clientX * DPR, y: e.clientY * DPR, life: 1, r: (Math.random() * 1.8 + 0.9) * DPR, hue: Math.random() });
            if (trail.length > 64) trail.shift();
        }, { passive: true });
        (function loop() {
            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'lighter';
            for (var i = 0; i < trail.length; i++) {
                var p = trail[i]; p.life -= 0.028;
                if (p.life <= 0) continue;
                var col = p.hue < 0.5 ? '190,205,255' : '205,170,255';
                // soft halo
                ctx.globalAlpha = p.life * 0.28;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life * 3.2, 0, 6.2832);
                ctx.fillStyle = 'rgba(' + col + ',1)'; ctx.fill();
                // bright core
                ctx.globalAlpha = p.life * 0.7;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, 6.2832);
                ctx.fillStyle = 'rgba(' + col + ',1)'; ctx.fill();
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
