// ---- Cosmic loader ----
// An honest loading screen: the counter starts at 0 the moment the page begins
// loading and climbs in step with the page's *real* readiness — how many images
// have actually loaded plus the document's readyState — reaching 100 only when
// everything is ready (window 'load'). It then holds for a short minimum so it
// doesn't flash away, fades out, and is pulled from the layout so it never
// blocks clicks or scroll. No fixed timer driving a fake last-second sprint.
(function initCosmicLoader() {
    var loader = document.getElementById('cosmicLoader');
    if (!loader) return;

    var pctEl = loader.querySelector('.loader-percent');
    var barEl = loader.querySelector('.loader-bar-fill');

    var start = Date.now();
    var MIN_VISIBLE = 1100; // ms — keep it on screen at least this long
    var loaded = false;     // becomes true on window 'load'
    var shown = 0;          // displayed fraction 0..1 (eased toward the real target)
    var finished = false;
    var raf = null;

    // The real, honest target the counter is chasing right now (0..1).
    function targetProgress() {
        if (loaded) return 1;

        var t = 0.06; // a sliver as soon as we start, so it reads as "begun"
        if (document.readyState === 'interactive') t = Math.max(t, 0.35);
        if (document.readyState === 'complete') t = Math.max(t, 0.9);

        var imgs = document.images;
        if (imgs && imgs.length) {
            var done = 0;
            for (var i = 0; i < imgs.length; i++) {
                if (imgs[i].complete) done++;
            }
            // Images are the heavy part of these pages: weight them 0.25→0.95.
            t = Math.max(t, 0.25 + 0.7 * (done / imgs.length));
        }
        return Math.min(t, 0.98); // never claim 100% before window 'load'
    }

    function render() {
        var v = Math.round(shown * 100);
        if (pctEl) pctEl.textContent = v;
        if (barEl) barEl.style.width = v + '%';
    }

    function tick() {
        var target = targetProgress();
        // Ease toward the real target so motion stays smooth but always honest.
        shown += (target - shown) * 0.09;

        if (loaded && shown >= 0.995) {
            shown = 1;
            render();
            finish();
            return;
        }
        render();
        raf = requestAnimationFrame(tick);
    }

    function finish() {
        if (finished) return;
        finished = true;
        if (raf) cancelAnimationFrame(raf);
        var wait = Math.max(0, MIN_VISIBLE - (Date.now() - start));
        setTimeout(function () {
            loader.classList.add('is-hidden');
        }, wait);
    }

    // Once the fade-out finishes, drop it from the layout entirely.
    loader.addEventListener('transitionend', function () {
        if (loader.classList.contains('is-hidden')) {
            loader.style.display = 'none';
        }
    });

    if (document.readyState === 'complete') {
        loaded = true;
    } else {
        window.addEventListener('load', function () { loaded = true; });
    }

    render();
    raf = requestAnimationFrame(tick);
})();

// ---- Custom file picker ----
// Show the chosen filename next to the styled "Carica una foto" button. The
// native <input type="file"> stays in the DOM with its name= intact, so the
// upload keeps working exactly as before — this is presentation only.
(function initFilePickers() {
    var inputs = document.querySelectorAll('[data-file-input]');
    Array.prototype.forEach.call(inputs, function (input) {
        var picker = input.closest('.file-picker');
        var nameEl = picker && picker.querySelector('[data-file-name]');
        if (!nameEl) return;
        var placeholder = nameEl.textContent;
        input.addEventListener('change', function () {
            if (input.files && input.files.length) {
                nameEl.textContent = input.files[0].name;
                nameEl.classList.add('has-file');
            } else {
                nameEl.textContent = placeholder;
                nameEl.classList.remove('has-file');
            }
        });
    });
})();

// ---- Cookie banner: "a probe delivers the cookie" event ----
// Orchestrates the cinematic (probe flies across, drops the capsule, the pod
// blooms open) and the exit when a choice is made. Pure presentation: the
// consent form, its button values and the /cookie_consent route are untouched.
// No-JS and reduced-motion fall back to a static, immediately-usable pod.
(function initCookiePod() {
    var stage = document.querySelector('.cookie-stage');
    if (!stage) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pod = stage.querySelector('.cookie-pod');
    var form = stage.querySelector('.cookie-actions');

    // Decide how to reveal the pod.
    if (reduce) {
        stage.classList.add('is-static');
    } else {
        var seen = false;
        try { seen = sessionStorage.getItem('ov_cookie_ship') === '1'; } catch (e) {}
        if (seen) {
            // Already saw the probe this session — just show the pod.
            stage.classList.add('is-static');
        } else {
            try { sessionStorage.setItem('ov_cookie_ship', '1'); } catch (e) {}
            // The full-screen cosmic loader (z-index 9999) sits ABOVE the banner
            // (9990) during load. If we start the open now it plays hidden behind
            // it and is already open by the time the loader fades — so wait until
            // the loader is gone, then play the capsule cinematic in full view.
            var loader = document.getElementById('cosmicLoader');
            var started = false;
            function play() {
                if (started) return;
                started = true;
                stage.classList.add('is-playing');
            }
            var loaderVisible = loader &&
                !loader.classList.contains('is-hidden') &&
                getComputedStyle(loader).display !== 'none';
            if (loaderVisible) {
                loader.addEventListener('transitionend', function (e) {
                    if (e.propertyName === 'opacity' && loader.classList.contains('is-hidden')) play();
                });
                // Fallbacks in case the fade transition never reports.
                window.addEventListener('load', function () { setTimeout(play, 1800); });
                setTimeout(play, 6000);
            } else {
                play();
            }
        }
    }

    // Exit animation on choice (only when motion is allowed). Without JS, or in
    // reduced-motion, the buttons submit natively with their own name/value.
    if (!reduce && form) {
        form.addEventListener('click', function (e) {
            var btn = e.target.closest('button[name="choice"]');
            if (!btn) return;
            e.preventDefault();
            if (stage.classList.contains('is-leaving')) return;

            // Carry the chosen value through a programmatic submit (form.submit()
            // would otherwise drop the clicked button's name/value).
            var hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'choice';
            hidden.value = btn.value;
            form.appendChild(hidden);

            stage.classList.add('is-leaving');
            var done = false;
            function go() { if (done) return; done = true; form.submit(); }
            pod.addEventListener('animationend', go, { once: true });
            setTimeout(go, 700); // fallback if animationend doesn't fire
        });
    }
})();
