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
        var seen = 0;
        var io = new IntersectionObserver(function (entries) {
            // stagger within the batch that came into view together
            entries.filter(function (e) { return e.isIntersecting; })
                .sort(function (a, b) { return a.target.dataset.i - b.target.dataset.i; })
                .forEach(function (e, i) {
                    e.target.style.setProperty('--stagger', Math.min(i, 8) * 70 + 'ms');
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                    seen++;
                });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

        tiles.forEach(function (t, i) { t.dataset.i = i; io.observe(t); });

        // safety net: never leave a tile invisible
        window.setTimeout(function () {
            tiles.forEach(function (t) { t.classList.add('in'); });
        }, 1500);
    }

    /* --- project modal ----------------------------------------------------- */

    var modal = $('#modal');
    if (!modal || !tiles.length) return;

    var mMedia = $('.modal-media', modal);
    var mCaption = $('.modal-caption', modal);
    var mInner = $('.modal-inner', modal);
    var mPrev = $('.m-prev', modal);
    var mNext = $('.m-next', modal);
    var mClose = $('.modal-close', modal);

    var items = tiles.map(function (t) {
        return {
            el: t,
            slug: t.dataset.slug,
            href: t.getAttribute('href'),
            title: t.dataset.title,
            subtitle: t.dataset.subtitle,
            body: $('template', t) ? $('template', t).innerHTML : '',
            src: t.dataset.full,
            srcset: t.dataset.fullset,
            alt: $('img', t) ? $('img', t).alt : ''
        };
    });

    var current = -1;
    var pushed = false;
    var lastFocus = null;
    var entryUrl = location.pathname + location.search;

    function render(i, direction) {
        var it = items[i];
        if (!it) return;
        current = i;

        mMedia.innerHTML = '';
        var img = new Image();
        img.src = it.src;
        if (it.srcset) { img.srcset = it.srcset; img.sizes = '(max-width: 740px) 100vw, 60vw'; }
        img.alt = it.alt;
        img.decoding = 'async';
        mMedia.appendChild(img);

        mCaption.innerHTML =
            '<h2>' + it.title + '</h2>' +
            (it.subtitle ? '<h2 class="subtitle">' + it.subtitle + '</h2>' : '') +
            it.body +
            '<a class="permalink" href="' + it.href + '">Open page</a>';

        mPrev.disabled = i <= 0;
        mNext.disabled = i >= items.length - 1;

        if (direction && !reduced) {
            mInner.classList.remove('step-next', 'step-prev');
            void mInner.offsetWidth;
            mInner.classList.add(direction > 0 ? 'step-next' : 'step-prev');
        }

        modal.setAttribute('aria-label', it.title);
        try { history.replaceState({ modal: it.slug }, '', it.href); } catch (e) {}
    }

    function openUI() {
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('no-scroll');
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        mClose.focus();
    }

    function closeUI() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('no-scroll');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
        current = -1;
        pushed = false;
        window.setTimeout(function () {
            if (!modal.classList.contains('open')) { mMedia.innerHTML = ''; }
        }, 500);
    }

    function open(i) {
        lastFocus = document.activeElement;
        // One history entry per visit: stepping between projects replaces it,
        // so closing lands the reader back where they came from.
        try {
            history.pushState({ modal: items[i].slug }, '', items[i].href);
            pushed = true;
        } catch (e) { pushed = false; }
        render(i, 0);
        openUI();
    }

    function close() {
        if (pushed) {
            history.back();   // popstate runs closeUI
        } else {
            closeUI();
            try { history.replaceState({}, '', entryUrl); } catch (e) {}
        }
    }

    function step(delta) {
        var next = current + delta;
        if (next < 0 || next >= items.length) return;
        render(next, delta);
    }

    tiles.forEach(function (t, i) {
        t.addEventListener('click', function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            open(i);
        });
    });

    mClose.addEventListener('click', function () { close(); });
    mPrev.addEventListener('click', function () { step(-1); });
    mNext.addEventListener('click', function () { step(1); });

    // a click anywhere that isn't the image, the caption or a control closes
    modal.addEventListener('click', function (e) {
        if (!e.target.closest('.modal-media, .modal-caption, button')) { close(); }
    });

    document.addEventListener('keydown', function (e) {
        if (!modal.classList.contains('open')) return;
        if (e.key === 'Escape') { close(); }
        else if (e.key === 'ArrowLeft') { step(-1); }
        else if (e.key === 'ArrowRight') { step(1); }
        else if (e.key === 'Tab') {
            // keep focus inside the dialog
            var f = $$('a[href], button:not([disabled])', modal);
            if (!f.length) return;
            var first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    window.addEventListener('popstate', function () {
        if (modal.classList.contains('open')) { closeUI(); }
    });

    // touch: swipe between projects
    var tx = 0, ty = 0;
    modal.addEventListener('touchstart', function (e) {
        tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY;
    }, { passive: true });
    modal.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - tx;
        var dy = e.changedTouches[0].clientY - ty;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) { step(dx < 0 ? 1 : -1); }
    }, { passive: true });
})();
