/* ---------------------------------------------------------------------------
   /endof/ — behaviour local to this one page.
   No dependencies, degrades to a plain static page without it.
   --------------------------------------------------------------------------- */

(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

    /* --- scroll progress ---------------------------------------------- */

    var bar = document.querySelector('.scroll-progress');
    if (bar) {
        var setProgress = function () {
            var h = document.documentElement;
            var max = h.scrollHeight - h.clientHeight;
            var p = max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0;
            bar.style.transform = 'scaleX(' + p + ')';
        };
        setProgress();
        window.addEventListener('scroll', setProgress, { passive: true });
        window.addEventListener('resize', setProgress);
    }

    /* --- chapters rise into place --------------------------------------- */

    var chaps = $$('.chap');
    if (!chaps.length || reduced || !('IntersectionObserver' in window)) {
        chaps.forEach(function (c) { c.classList.add('in'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
        chaps.forEach(function (c) { io.observe(c); });
    }

    /* --- the hero title strikes "foreign" out once it's on screen ------- */

    var heroRedact = document.querySelector('.endof-hero .redact');
    if (heroRedact) {
        if (reduced) {
            heroRedact.classList.add('is-struck');
        } else {
            window.setTimeout(function () { heroRedact.classList.add('is-struck'); }, 900);
        }
    }

    /* --- click/tap toggles the founder's quote; hover already does it --- */

    $$('.swap').forEach(function (btn) {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', function () {
            var on = btn.classList.toggle('is-struck');
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    });

})();
