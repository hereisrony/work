/* ---------------------------------------------------------------------------
   /endof/ — behaviour local to this one page.
   No dependencies, degrades to a static page without it.
   --------------------------------------------------------------------------- */

(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $  = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

    /* ---- running timecode: the page's only counter, and it counts footage --- */
    var t0 = performance.now();
    var tcEl = $('#tc-clock');
    function pad(n, w) { n = String(Math.floor(n)); while (n.length < w) n = '0' + n; return n; }
    function tickClock() {
        var el = (performance.now() - t0) / 1000;
        var h = el / 3600, m = (el % 3600) / 60, s = el % 60, f = (el % 1) * 24;
        if (tcEl) tcEl.textContent = pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2) + ':' + pad(f, 2);
        requestAnimationFrame(tickClock);
    }
    if (tcEl) requestAnimationFrame(tickClock);

    /* ---- leader countdown + hero language cycle + strike ---- */
    var frames = $$('#leader-frames i');
    frames.forEach(function (f, i) {
        setTimeout(function () { f.classList.add('hit'); }, reduced ? 0 : 260 * (i + 1));
    });

    var words = ['étranger', 'extranjero', 'straniero', 'ausländisch', 'yabancı', 'foreign'];
    var cycleEl = $('#cycle-word');
    var heroH1 = $('#hero-h1');
    if (heroH1) {
        if (reduced) {
            heroH1.classList.add('struck');
        } else {
            var wi = 0;
            var iv = setInterval(function () {
                wi++;
                cycleEl.textContent = words[wi];
                if (wi >= words.length - 1) {
                    clearInterval(iv);
                    setTimeout(function () { heroH1.classList.add('struck'); }, 260);
                }
            }, 150);
        }
    }

    /* ---- generic scroll reveal (wipes + leader scenes) ---- */
    var revealEls = $$('[data-reveal]');
    if (!revealEls.length) { /* nothing */ }
    else if (reduced || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (e) { e.classList.add('in'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
        revealEls.forEach(function (e) { io.observe(e); });
    }

    /* ---- decode/glitch: the founder's quote ---- */
    var CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@*/\\';
    function scramble(len) {
        var s = ''; for (var i = 0; i < len; i++) s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
        return s;
    }
    function decodeTo(el, text, duration, onDone) {
        if (reduced) { el.textContent = text; if (onDone) onDone(); return; }
        var start = null;
        function frame(ts) {
            if (!start) start = ts;
            var p = Math.min(1, (ts - start) / duration);
            var lock = Math.floor(p * text.length);
            var out = text.slice(0, lock) + scramble(text.length - lock);
            el.textContent = out;
            if (p < 1) requestAnimationFrame(frame); else { el.textContent = text; if (onDone) onDone(); }
        }
        requestAnimationFrame(frame);
    }
    var decodeMain = $('#decode-main');
    if (decodeMain) {
        var decodeDone = false;
        function runDecode() {
            if (decodeDone) return; decodeDone = true;
            decodeTo(decodeMain, '“the end of foreign.”', 900);
        }
        var decodeTarget = decodeMain.closest('.scene');
        if (reduced || !('IntersectionObserver' in window)) runDecode();
        else {
            var io2 = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) { if (e.isIntersecting) { runDecode(); io2.disconnect(); } });
            }, { threshold: .5 });
            io2.observe(decodeTarget);
        }
    }

    /* ---- the inventory: keeps tick in, then the drop gets crossed out ---- */
    var inventory = $('#inventory');
    if (inventory) {
        var invDone = false;
        function runInventory() {
            if (invDone) return; invDone = true;
            var keepRows = $$('.inv-row:not(.inv-row--drop)', inventory);
            var dropRow = $('#inv-drop');
            if (reduced) {
                keepRows.forEach(function (r) { r.classList.add('checked'); });
                if (dropRow) dropRow.classList.add('dropped');
                return;
            }
            keepRows.forEach(function (row, i) {
                setTimeout(function () { row.classList.add('checked'); }, 260 * (i + 1));
            });
            setTimeout(function () { if (dropRow) dropRow.classList.add('dropped'); }, 260 * (keepRows.length + 1) + 260);
        }
        if (reduced || !('IntersectionObserver' in window)) runInventory();
        else {
            var io6 = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) { if (e.isIntersecting) { runInventory(); io6.disconnect(); } });
            }, { threshold: .5 });
            io6.observe(inventory);
        }
    }

    /* ---- the transformation set-piece: paper becomes machine, scroll-scrubbed ---- */
    var tfWrap = $('#tf-wrap');
    if (tfWrap) {
        var tfRows = $$('.tf-row');
        var tfScan = $('#tf-scan');
        var tfBar = $('#tf-progress-bar');
        var tfTagPaper = $('#tf-tag-paper'), tfTagMachine = $('#tf-tag-machine');

        function paintRow(row, localP) {
            var paper = row.dataset.paper, machine = row.dataset.machine;
            var cursor = row.querySelector('.cursor');
            if (localP <= 0) {
                row.classList.remove('active');
                row.textContent = ''; row.appendChild(document.createTextNode(paper + ' ')); row.appendChild(cursor);
                return;
            }
            if (localP >= 1) {
                row.classList.remove('active');
                row.textContent = ''; row.appendChild(document.createTextNode(machine + ' ')); row.appendChild(cursor);
                return;
            }
            row.classList.add('active');
            var len = Math.max(paper.length, machine.length);
            var lock = Math.floor(localP * machine.length);
            var text = reduced ? machine : (machine.slice(0, lock) + scramble(Math.max(0, len - lock)));
            row.textContent = ''; row.appendChild(document.createTextNode(text + ' ')); row.appendChild(cursor);
        }

        function onTfScroll() {
            var rect = tfWrap.getBoundingClientRect();
            var total = tfWrap.offsetHeight - window.innerHeight;
            var progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : (rect.top < 0 ? 1 : 0);
            tfBar.style.width = (progress * 100) + '%';
            tfScan.style.top = (progress * 100) + '%';
            tfTagPaper.classList.toggle('on', progress < 0.5);
            tfTagMachine.classList.toggle('on', progress >= 0.5);
            tfRows.forEach(function (row, i) {
                var start = i / tfRows.length, end = (i + 1) / tfRows.length;
                var localP = (progress - start) / (end - start);
                localP = Math.min(1, Math.max(0, localP));
                paintRow(row, localP);
            });
        }
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(function () { onTfScroll(); ticking = false; }); }
        }, { passive: true });
        onTfScroll();
    }

    /* ---- subtitle cards ---- */
    var subs = $$('.subtitle-card');
    if (reduced || !('IntersectionObserver' in window)) subs.forEach(function (s) { s.classList.add('in'); });
    else {
        var io3 = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io3.unobserve(e.target); } });
        }, { threshold: .4 });
        subs.forEach(function (s, i) { s.style.transitionDelay = (i * 90) + 'ms'; io3.observe(s); });
    }

    /* ---- call sheet: fill in as you pass it ---- */
    var csRows = $$('.cs-row');
    if (reduced || !('IntersectionObserver' in window)) csRows.forEach(function (r) { r.classList.add('passed'); });
    else {
        var io4 = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('passed'); });
        }, { rootMargin: '0px 0px -40% 0px', threshold: 0 });
        csRows.forEach(function (r) { io4.observe(r); });
    }

    /* ---- closing type-out ---- */
    var typeEl = $('#type-line'), typeCursor = $('#type-cursor');
    if (typeEl && typeCursor) {
        var typeText = 'What survives once foreignness becomes optional?';
        var typed = false;
        function runType() {
            if (typed) return; typed = true;
            if (reduced) { typeEl.insertBefore(document.createTextNode(typeText), typeCursor); return; }
            var i = 0;
            (function step() {
                typeEl.textContent = '';
                typeEl.appendChild(document.createTextNode(typeText.slice(0, i)));
                typeEl.appendChild(typeCursor);
                if (i < typeText.length) { i++; setTimeout(step, 26 + Math.random() * 40); }
            })();
        }
        var closeScene = $('.close-scene');
        if (reduced || !('IntersectionObserver' in window)) runType();
        else {
            var io5 = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) { if (e.isIntersecting) { runType(); io5.disconnect(); } });
            }, { threshold: .5 });
            io5.observe(closeScene);
        }
    }

})();
