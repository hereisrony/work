/* ---------------------------------------------------------------------------
   ronyefrat.work — behaviour
   No dependencies. Everything degrades to plain links if JS is unavailable.
   --------------------------------------------------------------------------- */

(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

    /* --- load bar --------------------------------------------------------- */

    var bar = $('.loadbar');
    if (bar && !reduced) {
        requestAnimationFrame(function () { bar.classList.add('run'); });
        window.addEventListener('load', function () {
            bar.classList.add('done');
        });
    }

    /* --- mobile drawer ---------------------------------------------------- */

    var toggle = $('.nav-toggle');
    var drawer = $('#drawer');

    function setDrawer(open) {
        document.body.classList.toggle('drawer-open', open);
        document.body.classList.toggle('no-scroll', open);
        if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (drawer) drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    if (toggle && drawer) {
        toggle.addEventListener('click', function () {
            setDrawer(!document.body.classList.contains('drawer-open'));
        });
        $$('a', drawer).forEach(function (a) {
            a.addEventListener('click', function () { setDrawer(false); });
        });
    }

    /* --- mobile header retract on scroll ---------------------------------- */

    var lastY = window.pageYOffset;
    var ticking = false;

    function onScroll() {
        var y = window.pageYOffset;
        if (window.innerWidth <= 740 && !document.body.classList.contains('drawer-open')) {
            if (y > lastY && y > 120) {
                document.body.classList.add('nav-hidden');
            } else if (y < lastY - 4) {
                document.body.classList.remove('nav-hidden');
            }
        } else {
            document.body.classList.remove('nav-hidden');
        }
        lastY = y;
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });

    /* --- staggered tile reveal -------------------------------------------- */

    var tiles = $$('.tile');

    if (!tiles.length) { /* nothing to reveal */ }
    else if (reduced || !('IntersectionObserver' in window)) {
        tiles.forEach(function (t) { t.classList.add('in'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            // stagger within the batch that came into view together
            entries.filter(function (e) { return e.isIntersecting; })
                .sort(function (a, b) { return a.target.dataset.i - b.target.dataset.i; })
                .forEach(function (e, i) {
                    e.target.style.setProperty('--stagger', Math.min(i, 8) * 70 + 'ms');
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

        tiles.forEach(function (t, i) { t.dataset.i = i; io.observe(t); });

        // safety net: never leave a tile invisible
        window.setTimeout(function () {
            tiles.forEach(function (t) { t.classList.add('in'); });
        }, 1500);
    }

    /* --- video: the host's player only on request ------------------------- */

    $$('.embed[data-player]').forEach(function (box) {
        var poster = $('.embed-poster', box);
        if (!poster) return;
        poster.addEventListener('click', function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;   // let it open the video page
            e.preventDefault();
            var f = document.createElement('iframe');
            f.src = box.dataset.player;
            f.title = 'Video';
            f.allow = 'autoplay; fullscreen; picture-in-picture';
            f.setAttribute('allowfullscreen', '');
            box.innerHTML = '';
            box.appendChild(f);
        });
    });

    /* --- the prompt that types itself ------------------------------------- */

    $$('.typebox').forEach(function (box) {
        var out = $('.typebox-out', box);
        var text = box.dataset.type || '';
        if (!out || !text) return;

        if (reduced) { out.textContent = text; return; }

        var i = 0, started = false;

        function type() {
            out.textContent = text.slice(0, ++i);
            // uneven, the way typing is
            if (i < text.length) window.setTimeout(type, 30 + Math.random() * 55);
            // and then nothing: the line stays, the caret goes on blinking
        }

        function start() {
            if (started) return;
            started = true;
            type();
        }

        if (!('IntersectionObserver' in window)) { start(); return; }
        var io = new IntersectionObserver(function (entries) {
            if (entries.some(function (e) { return e.isIntersecting; })) {
                io.disconnect();
                start();
            }
        }, { threshold: 0.25 });
        io.observe(box);
    });

})();
