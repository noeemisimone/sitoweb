// ---- Cosmic loader ----
// Hide the loading overlay once the page is ready, but keep it on screen for a
// short minimum so it doesn't flash away in an instant. When it has finished
// fading out, pull it from the layout so it never blocks clicks or scroll.
(function initCosmicLoader() {
    var loader = document.getElementById('cosmicLoader');
    if (!loader) return;

    var start = Date.now();
    var MIN_VISIBLE = 900; // ms

    function hide() {
        var elapsed = Date.now() - start;
        var wait = Math.max(0, MIN_VISIBLE - elapsed);
        setTimeout(function () {
            loader.classList.add('is-hidden');
        }, wait);
    }

    loader.addEventListener('transitionend', function () {
        if (loader.classList.contains('is-hidden')) {
            loader.style.display = 'none';
        }
    });

    // Wait for everything (images, fonts, CSS) to be loaded.
    if (document.readyState === 'complete') {
        hide();
    } else {
        window.addEventListener('load', hide);
    }
})();
