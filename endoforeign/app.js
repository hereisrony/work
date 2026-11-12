/* the end of foreign — private workspace
   Public shell only: the gate, the language switch, the renderer, the comment box.
   Everything that is actually written (pages, instructions, the comment endpoint)
   sits encrypted in vault.json and is decrypted in the browser with the password. */
(function () {
  'use strict';

  var LANGS = ['en', 'fr', 'ko'];
  var LANG_NAMES = { en: 'English', fr: 'Français', ko: '한국어' };
  var PAGES = ['synopsis', 'statement', 'notebook', 'characters', 'drafts', 'moodboard'];

  var UI = {
    en: {
      versionOf: 'Version of {d}', olderNote: 'You are reading an earlier version.', currentVersion: 'current version', versions: 'versions', veil: 'Hidden while this window is not active. Click to continue.', notes: 'notes', noNotes: 'No notes yet. Select a passage above to comment on it, or write a note below.', selBtn: 'comment on selection', cancel: 'cancel', pageNote: 'a note on the whole page', pageBtn: 'add note', 
      password: 'password', enter: 'enter',
      checking: 'opening…',
      wrong: 'That password does not open this page.', fail: 'Could not load the page. Try again.',
      nocrypto: 'This browser cannot decrypt the page. Use a recent browser over https.',
      wip: 'working sheets', home: 'the end of foreign',
      notice: 'Automatic translation. The original is in English, and the English version is the one that counts.',
      original: 'read the English original',
      untranslated: 'This page is not translated yet. It is shown in English.',
      comments: 'comments', none: 'No comments yet. Be the first.',
      name: 'your name', comment: 'your comment', post: 'post comment', posting: 'posting…',
      posted: 'posted', needBoth: 'Please add your name and a comment.',
      postFail: 'Could not post. Your text is still in the box. Try again.',
      loadFail: 'Could not load the comments.',
      local: 'The shared comment notebook is not connected yet. Comments are saved on this device only, and nobody else sees them.',
      rony: 'rony', page: { synopsis: 'synopsis', statement: 'director’s statement', notebook: 'development notebook', characters: 'character sheets', drafts: 'drafts', moodboard: 'moodboard' },
      allPages: 'all pages', foot: 'Private. Please do not share the link, the password or what is on these pages.'
    },
    fr: {
      versionOf: 'Version du {d}', olderNote: 'Vous lisez une version précédente.', currentVersion: 'version actuelle', versions: 'versions', veil: 'Masqué tant que cette fenêtre n’est pas active. Cliquez pour continuer.', notes: 'notes', noNotes: 'Pas encore de notes. Sélectionnez un passage pour le commenter, ou écrivez une note ci-dessous.', selBtn: 'commenter la sélection', cancel: 'annuler', pageNote: 'une note sur toute la page', pageBtn: 'ajouter la note', 
      password: 'mot de passe', enter: 'entrer',
      checking: 'ouverture…',
      wrong: 'Ce mot de passe n’ouvre pas cette page.', fail: 'Impossible de charger la page. Réessayez.',
      nocrypto: 'Ce navigateur ne peut pas déchiffrer la page. Utilisez un navigateur récent en https.',
      wip: 'feuilles de travail', home: 'the end of foreign',
      notice: 'Traduction automatique. L’original est en anglais, et c’est la version anglaise qui fait foi.',
      original: 'lire l’original en anglais',
      untranslated: 'Cette page n’est pas encore traduite. Elle s’affiche en anglais.',
      comments: 'commentaires', none: 'Pas encore de commentaire. Soyez le premier.',
      name: 'votre nom', comment: 'votre commentaire', post: 'publier le commentaire', posting: 'envoi…',
      posted: 'publié', needBoth: 'Merci d’indiquer votre nom et un commentaire.',
      postFail: 'Envoi impossible. Votre texte est toujours dans la zone. Réessayez.',
      loadFail: 'Impossible de charger les commentaires.',
      local: 'Le carnet de commentaires partagé n’est pas encore connecté. Les commentaires sont enregistrés sur cet appareil uniquement, et personne d’autre ne les voit.',
      rony: 'rony', page: { synopsis: 'synopsis', statement: 'note d’intention', notebook: 'carnet de développement', characters: 'fiches personnages', drafts: 'brouillons', moodboard: 'moodboard' },
      allPages: 'toutes les pages', foot: 'Privé. Merci de ne pas partager le lien, le mot de passe ni le contenu de ces pages.'
    },
    ko: {
      versionOf: '{d} 버전', olderNote: '이전 버전을 보고 있습니다.', currentVersion: '현재 버전', versions: '버전', veil: '이 창이 활성 상태가 아닌 동안에는 숨겨집니다. 계속하려면 클릭하세요.', notes: '메모', noNotes: '아직 메모가 없습니다. 문장을 선택해 댓글을 남기거나, 아래에 메모를 적어 주세요.', selBtn: '선택한 부분에 댓글 달기', cancel: '취소', pageNote: '페이지 전체에 대한 메모', pageBtn: '메모 추가', 
      password: '비밀번호', enter: '입장',
      checking: '여는 중…',
      wrong: '비밀번호가 맞지 않습니다.', fail: '페이지를 불러오지 못했습니다. 다시 시도해 주세요.',
      nocrypto: '이 브라우저에서는 페이지를 열 수 없습니다. https로 최신 브라우저를 사용해 주세요.',
      wip: '작업 시트', home: 'the end of foreign',
      notice: '자동 번역입니다. 원문은 영어이며, 영어 버전이 기준입니다.',
      original: '영어 원문 보기',
      untranslated: '이 페이지는 아직 번역되지 않아 영어로 표시됩니다.',
      comments: '댓글', none: '아직 댓글이 없습니다. 첫 댓글을 남겨 주세요.',
      name: '이름', comment: '댓글', post: '댓글 남기기', posting: '등록 중…',
      posted: '등록되었습니다', needBoth: '이름과 댓글을 입력해 주세요.',
      postFail: '등록하지 못했습니다. 입력한 내용은 그대로 남아 있습니다. 다시 시도해 주세요.',
      loadFail: '댓글을 불러오지 못했습니다.',
      local: '공유 댓글 노트가 아직 연결되지 않았습니다. 댓글은 이 기기에만 저장되며 다른 사람에게는 보이지 않습니다.',
      rony: 'rony', page: { synopsis: '시놉시스', statement: '연출 의도', notebook: '개발 노트', characters: '캐릭터 시트', drafts: '초안', moodboard: '무드보드' },
      allPages: '전체 페이지', foot: '비공개입니다. 링크, 비밀번호, 그리고 이 페이지의 내용을 공유하지 말아 주세요.'
    }
  };

  var $ = function (id) { return document.getElementById(id); };
  var state = { lang: 'en', content: null, comments: [], commentsOk: true };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function t(k) { return UI[state.lang][k] !== undefined ? UI[state.lang][k] : UI.en[k]; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- language ---------- */
  (function initLang() {
    var l = store('eof-lang');
    if (LANGS.indexOf(l) < 0) {
      l = ((navigator.language || 'en').slice(0, 2)).toLowerCase();
      if (LANGS.indexOf(l) < 0) l = 'en';
    }
    state.lang = l;
  })();

  function drawLangs() {
    ['gate-langs', 'app-langs'].forEach(function (id) {
      var el = $(id);
      el.innerHTML = LANGS.map(function (l) {
        return '<button type="button" data-lang="' + l + '" lang="' + l + '" aria-pressed="' + (l === state.lang) + '" title="' + LANG_NAMES[l] + '">' + l + '</button>';
      }).join('');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang]');
    if (!b) return;
    setLang(b.getAttribute('data-lang'));
  });
  function setLang(l) {
    state.lang = l; store('eof-lang', l);
    applyChrome();
    if (state.content) render();
  }
  function applyChrome() {
    document.documentElement.lang = state.lang;
    $('g-name-label').textContent = t('name');
    $('g-label').textContent = t('password');
    $('ct-label').textContent = t('comment');
    $('cpost').textContent = t('post');
    $('ccancel').textContent = t('cancel');
    $('selbtn').textContent = t('selBtn');
    $('g-enter').textContent = t('enter');
    $('wip').textContent = t('wip');
    $('foot').textContent = t('foot');
    drawLangs();
    var n = $('notice');
    if (state.lang === 'en') { n.hidden = true; n.innerHTML = ''; }
    else {
      n.hidden = false;
      n.innerHTML = esc(t('notice')) + ' <button type="button" data-lang="en">' + esc(t('original')) + '</button>';
    }
  }

  /* ---------- decryption ---------- */
  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  async function decrypt(vault, pw) {
    var enc = new TextEncoder();
    var base = await crypto.subtle.importKey('raw', enc.encode(pw.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64(vault.salt), iterations: vault.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    var plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(vault.iv) }, key, b64(vault.ct));
    return JSON.parse(new TextDecoder().decode(plain));
  }
  var vaultPromise = null;
  function getVault() {
    if (!vaultPromise) vaultPromise = fetch('vault.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('vault ' + r.status); return r.json();
    });
    return vaultPromise;
  }

  async function tryUnlock(pw, name) {
    if (!(window.crypto && crypto.subtle)) { var e = new Error('nocrypto'); e.kind = 'nocrypto'; throw e; }
    var vault;
    try { vault = await getVault(); } catch (err) {  vaultPromise = null; err.kind = 'fail'; throw err; }
    var data;
    try { data = await decrypt(vault, pw); } catch (err) { err.kind = 'wrong'; throw err; }
    state.content = data; state.name = name;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawMark); drawMark();
    $('gate').hidden = true;
    $('app').hidden = false;
    applyChrome();
    render();
    loadComments();
    startPolling();
  }

  $('gate-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = $('g-msg'), pw = $('pw').value, name = $('nm').value.trim();
    if (!name) { $('nm').focus(); return; }
    store('eof-name', name);
    msg.textContent = t('checking');
    try { await tryUnlock(pw, name); $('pw').value = ''; msg.textContent = ''; }
    catch (err) {
      msg.textContent = err.kind === 'wrong' ? t('wrong') : err.kind === 'nocrypto' ? t('nocrypto') : t('fail');
      if (err.kind === 'wrong') { $('pw').select(); }
    }
  });

  /* ---------- tiny markdown ---------- */
  function inline(s) {
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    return s;
  }
  // returns { title, sub, intro:[blocks], sections:[{id,title,blocks}] }
  function parse(md) {
    var out = { title: '', intro: [], sections: [] };
    var target = out.intro, para = [], list = null;
    function flush() {
      if (para.length) { target.push({ t: 'p', x: para.join(' ') }); para = []; }
      if (list) { target.push(list); list = null; }
    }
    String(md).replace(/\r/g, '').split('\n').forEach(function (line) {
      var m;
      if (/^\s*$/.test(line)) { flush(); return; }
      if ((m = line.match(/^# (.*)$/))) { flush(); out.title = m[1].trim(); return; }
      if ((m = line.match(/^## (.*?)(?:\s*\{#([a-z0-9-]+)\})?\s*$/))) {
        flush();
        var sec = { id: m[2] || ('s' + (out.sections.length + 1)), title: m[1].trim(), blocks: [] };
        out.sections.push(sec); target = sec.blocks; return;
      }
      if ((m = line.match(/^!\[([^\]]*)\]\(img:([a-z0-9-]+)\)\s*$/))) { flush(); target.push({ t: 'img', alt: m[1], key: m[2] }); return; }
      if ((m = line.match(/^### (.*)$/))) { flush(); target.push({ t: 'h3', x: m[1].trim() }); return; }
      if ((m = line.match(/^> ?(.*)$/))) { flush(); target.push({ t: 'q', x: m[1] }); return; }
      if ((m = line.match(/^\s*[-*] +(.*)$/))) {
        if (!list || list.t !== 'ul') { flush(); list = { t: 'ul', items: [] }; }
        list.items.push(m[1]); return;
      }
      if ((m = line.match(/^\s*\d+[.)] +(.*)$/))) {
        if (!list || list.t !== 'ol') { flush(); list = { t: 'ol', items: [] }; }
        list.items.push(m[1]); return;
      }
      if (list) flush();
      para.push(line.trim());
    });
    flush();
    return out;
  }
  function blocksHtml(bs, sec) {
    return bs.map(function (b, i) {
      var a = sec ? ' data-sec="' + sec + '" data-b="' + i + '"' : '';
      if (b.t === 'img') {
        var uri = (state.content.images || {})[b.key];
        return uri ? '<figure class="fig"' + a + '><img src="' + uri + '" alt="' + esc(b.alt) + '" draggable="false"></figure>' : '';
      }
      if (b.t === 'p') return '<p' + a + '>' + inline(b.x) + '</p>';
      if (b.t === 'h3') return '<h3' + a + '>' + inline(b.x) + '</h3>';
      if (b.t === 'q') return '<blockquote' + a + '>' + inline(b.x) + '</blockquote>';
      return '<' + b.t + a + '>' + b.items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</' + b.t + '>';
    }).join('');
  }

  /* ---------- routing + rendering ---------- */
  function route() {
    var h = (location.hash || '').replace(/^#\/?/, '').split('/');
    var page = h[0] || 'home';
    if (page !== 'home' && PAGES.indexOf(page) < 0) page = 'home';
    var ver = '', sec = '';
    if (h[1] === 'v' && h[2]) ver = h[2]; else sec = h[1] || '';
    return { page: page, section: sec, version: ver };
  }
  window.addEventListener('hashchange', function () { if (state.content) { render(); window.scrollTo(0, 0); } });

  function versionsOf(page) { return ((state.content.pages[page] || {}).versions) || []; }
  function sourceFor(v) {
    v = v || {};
    if (v[state.lang]) return { md: v[state.lang], translated: true };
    return { md: v.en || '', translated: state.lang === 'en' };
  }
  var LOCALES = { en: 'en-US', fr: 'fr-FR', ko: 'ko-KR' };
  function fmtVersion(v) {
    var d = new Date(v.date + 'T12:00:00');
    try { return new Intl.DateTimeFormat(LOCALES[state.lang], { dateStyle: 'long' }).format(d); } catch (e) { return v.date; }
  }
  function verNow() { return state.ver || ''; }
  // a comment belongs to one version of a page; comments saved before versions existed belong to the oldest
  function verOf(c) {
    if (c.version) return c.version;
    var vs = versionsOf(c.page);
    return vs.length ? vs[vs.length - 1].id : '';
  }

  function render() {
    var r = route(), doc = $('doc'), on = r.page !== 'home';
    var vs = versionsOf(r.page), v = vs.filter(function (x) { return x.id === r.version; })[0] || vs[0];
    state.ver = v ? v.id : '';
    var src = sourceFor(v), pg = parse(src.md);
    state.sections = {}; pg.sections.forEach(function (x) { state.sections[x.id] = x.title; });
    var h = '';
if (on) h += '<div class="pagebar">' +     '<a class="back" href="#/" aria-label="' + esc(t('allPages')) + '" title="' + esc(t('allPages')) + '"><svg viewBox="0 0 24 20" width="30" height="25" aria-hidden="true" focusable="false"><path d="M8 4 L3 9 L8 14 M3 9 H16 Q21 9 21 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter"/></svg></a>' +
      '<nav class="menu" aria-label="' + esc(t('home')) + '">' + PAGES.filter(function (p) { return p !== r.page; }).map(function (p) {
        return '<a href="#/' + p + '">' + esc(t('page')[p]) + '</a>';
      }).join('') + '</nav></div>';
    h += '<h1>' + inline(pg.title || t('page')[r.page] || t('home')) + '</h1>';
    if (on && v && v.date) {
      h += '<p class="soft vline">' + esc(t('versionOf').replace('{d}', fmtVersion(v))) + '</p>';
      if (v !== vs[0]) h += '<p class="soft">' + esc(t('olderNote')) + ' <a href="#/' + r.page + '">' + esc(t('currentVersion')) + '</a></p>';
    }
    if (!src.translated) h += '<p class="soft">' + esc(t('untranslated')) + '</p>';
    h += blocksHtml(pg.intro, on ? '_intro' : '');
    if (!on) {
      h += '<ul class="pages">' + PAGES.map(function (p) {
        return '<li><a href="#/' + p + '">' + esc(t('page')[p]) + '</a></li>';
      }).join('') + '</ul>';
    }
    pg.sections.forEach(function (s) {
      h += '<section class="sec" id="sec-' + esc(s.id) + '"><h2>' + inline(s.title) + '</h2>' + blocksHtml(s.blocks, on ? s.id : '') + '</section>';
    });
    if (on) {
      h += '<section class="notes" id="notes"><h2>' + esc(t('notes')) + ' (<span id="ncount">0</span>)</h2>' +
        '<ul class="nlist" id="nlist"></ul>' +
        '<form class="cform" id="pageform" novalidate><label for="pagetext">' + esc(t('pageNote')) + '</label>' +
        '<textarea id="pagetext" maxlength="4000"></textarea>' +
        '<div class="row"><button type="submit">' + esc(t('pageBtn')) + '</button><span class="cstatus" id="pagestat" role="status" aria-live="polite"></span></div></form></section>';
      var others = vs.filter(function (x) { return v && x.id !== v.id && x.date; });
      if (others.length) {
        h += '<section class="versions"><h2>' + esc(t('versions')) + '</h2><ul class="vlist">' + others.map(function (x) {
          var cur = x === vs[0];
          return '<li><a class="vbtn" href="#/' + r.page + (cur ? '' : '/v/' + x.id) + '">' + esc((cur ? t('currentVersion') + ' · ' : '') + fmtVersion(x)) + '</a></li>';
        }).join('') + '</ul></section>';
      }
    }
    doc.innerHTML = h;
    closeComposer(); hideSel();
    document.title = (pg.title ? pg.title + ' · ' : '') + 'the end of foreign';
    paintComments(true);
    if (r.section) { var el = $('sec-' + r.section); if (el) el.scrollIntoView(); }
  }

  /* ---------- comments: highlight a passage, note at the end of the page ---------- */
  function cfg() { return (state.content && state.content.config) || {}; }
  function remote() { return !!cfg().endpoint; }
  function norm(x) { return String(x).replace(/\s+/g, ' ').trim(); }
  function pageNow() { return route().page; }

  function fmtDate(ts) {
    var d = new Date(ts);
    if (isNaN(d)) return '';
    try { return new Intl.DateTimeFormat(state.lang, { dateStyle: 'medium', timeStyle: 'short' }).format(d); }
    catch (e) { return d.toLocaleString(); }
  }

  // --- highlights in the text
  function textNodes(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), a = [], n;
    while ((n = w.nextNode())) a.push(n);
    return a;
  }
  function highlight(el, quote, id) {
    var nodes = textNodes(el), full = nodes.map(function (n) { return n.nodeValue; }).join('');
    var idx = full.indexOf(quote);
    if (idx < 0 || !quote) return false;
    var end = idx + quote.length, pos = 0;
    nodes.forEach(function (n) {
      var len = n.nodeValue.length, s = Math.max(idx, pos) - pos, e = Math.min(end, pos + len) - pos;
      pos += len;
      if (e <= s) return;
      var mid = n;
      if (s > 0) mid = n.splitText(s);
      if (e - s < mid.nodeValue.length) mid.splitText(e - s);
      var m = document.createElement('mark');
      m.className = 'hl'; m.setAttribute('data-c', id);
      mid.parentNode.replaceChild(m, mid); m.appendChild(mid);
    });
    return true;
  }
  function clearMarks() {
    Array.prototype.forEach.call(document.querySelectorAll('mark.hl'), function (m) {
      var p = m.parentNode;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      p.removeChild(m); p.normalize();
    });
  }
  function blockEl(c) {
    return document.querySelector('[data-sec="' + c.section + '"][data-b="' + c.block + '"]');
  }

  // --- the notes at the end
  function noteHtml(c) {
    var q = '';
    if (c.quote) {
      var secTitle = c.section && state.sections && state.sections[c.section];
      q = '<button type="button" class="cite" data-jump="' + esc(c.id) + '">' +
        (secTitle ? '<span class="csec">' + esc(secTitle) + '</span>' : '') +
        '<span class="cq">' + esc(c.quote.length > 220 ? c.quote.slice(0, 220) + '…' : c.quote) + '</span></button>';
    }
    return '<li class="note" id="n-' + esc(c.id) + '"><div class="nhead"><b>' + esc(c.name) + '</b> · ' + esc(fmtDate(c.ts)) +
      (c.lang ? '<span class="tag">' + esc(c.lang) + '</span>' : '') + '</div>' + q +
      '<p class="ntext">' + esc(c.text) + '</p>' +
      (c.reply ? '<p class="nreply"><b>' + esc(t('rony')) + '</b><br>' + esc(c.reply) + '</p>' : '') + '</li>';
  }
  var lastSig = '';
  function paintComments(force) {
    var list = $('nlist');
    if (!list) return;
    var mine = state.comments.filter(function (c) { return c.page === pageNow() && verOf(c) === verNow(); })
      .sort(function (a, b) { return new Date(a.ts) - new Date(b.ts); });
    var sig = mine.map(function (c) { return c.id + (c.reply || '') + state.lang; }).join('|');
    if (!force && sig === lastSig) return;
    lastSig = sig;
    clearMarks();
    $('ncount').textContent = mine.length;
    list.innerHTML = mine.length ? mine.map(noteHtml).join('')
      : '<li class="nempty">' + esc(state.commentsOk ? t('noNotes') : t('loadFail')) + '</li>';
    mine.forEach(function (c) {
      if (c.quote && c.lang === state.lang && c.block !== '' && c.block != null) {
        var el = blockEl(c); if (el) highlight(el, norm(c.quote), c.id);
      }
    });
  }

  function flash(els) {
    els.forEach(function (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); });
    setTimeout(function () { els.forEach(function (el) { el.classList.remove('flash'); }); }, 1800);
  }
  function jumpTo(id) {
    var c = state.comments.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    var marks = Array.prototype.slice.call(document.querySelectorAll('mark.hl[data-c="' + id + '"]'));
    var els = marks.length ? marks : [blockEl(c) || $('sec-' + c.section)].filter(Boolean);
    if (!els.length) return;
    els[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    flash(els);
  }
  document.addEventListener('click', function (e) {
    var j = e.target.closest && e.target.closest('[data-jump]');
    if (j) { jumpTo(j.getAttribute('data-jump')); return; }
    var m = e.target.closest && e.target.closest('mark.hl');
    if (m) {
      var sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      var n = $('n-' + m.getAttribute('data-c'));
      if (n) { n.scrollIntoView({ block: 'center', behavior: 'smooth' }); flash([n]); }
    }
  });

  // --- storage
  function localKey() { return 'eof-comments-local'; }
  async function loadComments() {
    if (!remote()) {
      try { state.comments = JSON.parse(store(localKey()) || '[]'); } catch (e) { state.comments = []; }
      state.commentsOk = true; paintComments(); return;
    }
    try {
      var r = await fetch(cfg().endpoint + (cfg().endpoint.indexOf('?') < 0 ? '?' : '&') + 'token=' + encodeURIComponent(cfg().token || '') + '&t=' + Date.now());
      var d = await r.json();
      if (!d || !d.comments) throw new Error('bad');
      state.comments = d.comments; state.commentsOk = true;
    } catch (e) { state.commentsOk = false; }
    paintComments();
  }
  var pollTimer = null;
  function startPolling() {
    if (pollTimer || !remote()) return;
    pollTimer = setInterval(function () { if (!document.hidden) loadComments(); }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loadComments(); });
  }
  async function postComment(c) {
    c.page = pageNow(); c.version = verNow(); c.name = state.name; c.lang = state.lang;
    if (!remote()) {
      c.id = 'l' + Date.now(); c.ts = new Date().toISOString();
      state.comments.push(c); store(localKey(), JSON.stringify(state.comments)); return;
    }
    var r = await fetch(cfg().endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // a "simple" request: no CORS preflight
      body: JSON.stringify({ token: cfg().token || '', page: c.page, version: c.version, section: c.section || '', block: c.block == null ? '' : c.block,
        name: c.name, quote: c.quote || '', text: c.text, lang: c.lang })
    });
    var d = await r.json();
    if (!d || !d.ok) throw new Error((d && d.error) || 'post');
  }

  // --- selecting a passage
  var pending = null, hideTimer = null;
  function blockOf(node) {
    var el = node && (node.nodeType === 3 ? node.parentNode : node);
    return el && el.closest ? el.closest('#doc [data-b]') : null;
  }
  function captureSelection() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    var r = sel.getRangeAt(0), a = blockOf(r.startContainer);
    if (!a || !blockOf(r.endContainer) && r.endContainer !== a) { if (!a) return null; }
    var range = r.cloneRange();
    if (!a.contains(r.endContainer)) range.setEnd(a, a.childNodes.length);   // keep to the first paragraph
    var quote = norm(range.toString());
    if (!quote) return null;
    return { section: a.getAttribute('data-sec'), block: +a.getAttribute('data-b'), quote: quote.slice(0, 600) };
  }
  function hideSel() { $('selbar').hidden = true; }
  document.addEventListener('selectionchange', function () {
    if (!state.content || !$('composer').hidden) return;
    var c = captureSelection();
    clearTimeout(hideTimer);
    if (c) { pending = c; $('selbar').hidden = false; }
    else hideTimer = setTimeout(function () { if ($('composer').hidden) { pending = null; hideSel(); } }, 700);
  });
  $('selbtn').addEventListener('mousedown', function (e) { e.preventDefault(); });
  $('selbtn').addEventListener('click', function () {
    if (!pending) return;
    $('cq').textContent = pending.quote.length > 300 ? pending.quote.slice(0, 300) + '…' : pending.quote;
    $('cstat').textContent = ''; $('cstat').className = 'cstatus';
    hideSel(); $('composer').hidden = false; $('ct').focus();
  });
  function closeComposer() { $('composer').hidden = true; $('ct').value = ''; pending = null; }
  $('ccancel').addEventListener('click', closeComposer);
  $('composer').addEventListener('submit', async function (e) {
    e.preventDefault();
    var text = $('ct').value.trim(), btn = $('cpost'), st = $('cstat');
    if (!text || !pending) return;
    btn.disabled = true; st.className = 'cstatus'; st.textContent = t('posting');
    try {
      await postComment({ section: pending.section, block: pending.block, quote: pending.quote, text: text });
      var sel = window.getSelection(); if (sel) sel.removeAllRanges();
      closeComposer(); await loadComments(); paintComments(true);
      var last = $('nlist') && $('nlist').lastElementChild; if (last) { last.scrollIntoView({ block: 'center', behavior: 'smooth' }); flash([last]); }
    } catch (err) { st.textContent = t('postFail'); st.className = 'cstatus err'; }
    btn.disabled = false;
  });
  document.addEventListener('submit', async function (e) {
    if (e.target.id !== 'pageform') return;
    e.preventDefault();
    var ta = $('pagetext'), st = $('pagestat'), btn = e.target.querySelector('button'), text = ta.value.trim();
    if (!text) return;
    btn.disabled = true; st.className = 'cstatus'; st.textContent = t('posting');
    try {
      await postComment({ section: '', block: null, quote: '', text: text });
      ta.value = ''; st.textContent = t('posted'); await loadComments(); paintComments(true);
    } catch (err) { st.textContent = t('postFail'); st.className = 'cstatus err'; }
    btn.disabled = false;
  });
  // Ctrl/Cmd+Enter posts, never while an IME is composing (Korean, Japanese, Chinese)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.isComposing && e.target.tagName === 'TEXTAREA') {
      var f = e.target.closest('form'); if (f) { e.preventDefault(); f.requestSubmit(); }
    }
    if (e.key === 'Escape' && !$('composer').hidden) closeComposer();
  });

  /* ---------- no copying ----------
     A deterrent, not a lock: it stops copy, cut, drag, the right-click menu and printing of the
     page text. Selecting stays possible because that is how passages are commented on.
     Typing and copying inside the comment boxes still works. */
  function inField(e) { var t = e.target; return t && t.closest && t.closest('textarea,input'); }
  ['copy', 'cut'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if (inField(e)) return;
      e.preventDefault();
      if (e.clipboardData) e.clipboardData.setData('text/plain', '');
    }, true);
  });
  document.addEventListener('dragstart', function (e) { if (!inField(e)) e.preventDefault(); }, true);
  document.addEventListener('contextmenu', function (e) {
    if (window.matchMedia && matchMedia('(pointer: fine)').matches && !inField(e)) e.preventDefault();
  }, true);

  /* ---------- watermark + shield ----------
     Neither can stop a screenshot (the operating system takes those). The watermark makes a
     leaked screenshot traceable to the name typed at the gate; the shield hides the page when
     the window loses focus or a screenshot shortcut is pressed, which catches some tools. */
  var wm = $('wm'), wmStyle = '';
  function drawMark() {
    if (!state.name) return;
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var label = state.name.slice(0, 40) + ' · ' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    var font = '700 16px "CMU Sans","Noto Sans KR",sans-serif', dpr = 2;
    var probe = document.createElement('canvas').getContext('2d'); probe.font = font;
    var w = Math.max(360, Math.ceil(probe.measureText(label).width) + 90), h = 230;
    var c = document.createElement('canvas'); c.width = w * dpr; c.height = h * dpr;
    var x = c.getContext('2d'); x.scale(dpr, dpr); x.translate(w / 2, h / 2); x.rotate(-Math.PI / 9);
    x.font = font; x.fillStyle = 'rgba(0,0,0,0.09)'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(label, 0, 0);
    wm.hidden = false;
    wm.style.backgroundImage = 'url(' + c.toDataURL() + ')';
    wm.style.backgroundSize = w + 'px ' + h + 'px';
    wmStyle = wm.getAttribute('style');
  }
  // put the watermark back if someone removes it or restyles it in the developer tools
  new MutationObserver(function () {
    if (!state.content) return;
    if (!document.body.contains(wm)) document.body.appendChild(wm);
    if (wm.getAttribute('style') !== wmStyle) wm.setAttribute('style', wmStyle);
    if (wm.hidden) wm.hidden = false;
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden'] });

  var veil = $('veil'), holdUntil = 0, holdTimer = null;
  function shield(on) {
    if (!state.content) return;
    document.body.classList.toggle('shielded', on);
    veil.hidden = !on;
    if (on) { veil.textContent = t('veil'); }
  }
  function hold(ms) {
    shield(true); holdUntil = Date.now() + ms;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function () { if (document.hasFocus() && !document.hidden) shield(false); }, ms);
  }
  window.addEventListener('blur', function () { shield(true); });
  window.addEventListener('focus', function () { if (Date.now() >= holdUntil && !document.hidden) shield(false); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) shield(true); else if (Date.now() >= holdUntil && document.hasFocus()) shield(false); });
  veil.addEventListener('click', function () { if (Date.now() >= holdUntil) shield(false); });
  document.addEventListener('keydown', function (e) {
    // Cmd/Win + Shift (Mac screenshots, Windows Snipping Tool), or Print Screen
    if ((e.key === 'Shift' && e.metaKey) || (e.key === 'Meta' && e.shiftKey) || e.key === 'PrintScreen') hold(8000);
  }, true);
  document.addEventListener('keyup', function (e) {
    if (e.key === 'PrintScreen') {
      hold(8000);
      try { navigator.clipboard.writeText(' ').catch(function () {}); } catch (err) {}   // replace whatever the screenshot put on the clipboard
    }
  }, true);

  /* ---------- start ---------- */
  applyChrome();
  $('nm').value = store('eof-name') || '';
  (($('nm').value) ? $('pw') : $('nm')).focus();
})();
