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
    $('g-label').textContent = t('password');
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

  async function tryUnlock(pw) {
    if (!(window.crypto && crypto.subtle)) { var e = new Error('nocrypto'); e.kind = 'nocrypto'; throw e; }
    var vault;
    try { vault = await getVault(); } catch (err) {  vaultPromise = null; err.kind = 'fail'; throw err; }
    var data;
    try { data = await decrypt(vault, pw); } catch (err) { err.kind = 'wrong'; throw err; }
    state.content = data;
    $('gate').hidden = true;
    $('app').hidden = false;
    applyChrome();
    render();
    loadComments();
    startPolling();
  }

  $('gate-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = $('g-msg'), pw = $('pw').value;
    msg.textContent = t('checking');
    try { await tryUnlock(pw); $('pw').value = ''; msg.textContent = ''; }
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
  function blocksHtml(bs) {
    return bs.map(function (b) {
      if (b.t === 'p') return '<p>' + inline(b.x) + '</p>';
      if (b.t === 'h3') return '<h3>' + inline(b.x) + '</h3>';
      if (b.t === 'q') return '<blockquote>' + inline(b.x) + '</blockquote>';
      return '<' + b.t + '>' + b.items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</' + b.t + '>';
    }).join('');
  }

  /* ---------- routing + rendering ---------- */
  function route() {
    var h = (location.hash || '').replace(/^#\/?/, '').split('/');
    var page = h[0] || 'home';
    if (page !== 'home' && PAGES.indexOf(page) < 0) page = 'home';
    return { page: page, section: h[1] || '' };
  }
  window.addEventListener('hashchange', function () { if (state.content) { render(); window.scrollTo(0, 0); } });

  function sourceFor(page) {
    var p = state.content.pages[page] || {};
    if (p[state.lang]) return { md: p[state.lang], translated: true };
    return { md: p.en || '', translated: state.lang === 'en' };
  }

  function render() {
    var r = route(), doc = $('doc');
    var src = sourceFor(r.page), pg = parse(src.md);
    var h = '';
    if (r.page !== 'home') h += '<a class="back" href="#/">← ' + esc(t('allPages')) + '</a>';
    h += '<h1>' + inline(pg.title || t('page')[r.page] || t('home')) + '</h1>';
    if (!src.translated) h += '<p class="notice-inline" style="color:var(--soft);font-size:15px">' + esc(t('untranslated')) + '</p>';
    h += blocksHtml(pg.intro);
    if (r.page === 'home') {
      h += '<ul class="pages">' + PAGES.map(function (p, i) {
        return '<li><a href="#/' + p + '">' + esc(t('page')[p]) + '</a></li>';
      }).join('') + '</ul>';
    }
    pg.sections.forEach(function (s) {
      h += '<section class="sec" id="sec-' + esc(s.id) + '"><h2>' + inline(s.title) + '</h2>' + blocksHtml(s.blocks);
      if (r.page !== 'home') h += commentsShell(r.page + '/' + s.id);
      h += '</section>';
    });
    doc.innerHTML = h;
    document.title = (pg.title ? pg.title + ' · ' : '') + 'the end of foreign';
    paintComments();
    if (r.section) { var el = $('sec-' + r.section); if (el) el.scrollIntoView(); }
  }

  /* ---------- comments ---------- */
  function cfg() { return (state.content && state.content.config) || {}; }
  function remote() { return !!cfg().endpoint; }

  function commentsShell(key) {
    return '<div class="comments" data-key="' + esc(key) + '"><details>' +
      '<summary><span class="clabel">' + esc(t('comments')) + '</span> (<span class="count">0</span>)</summary>' +
      '<div class="cbody">' +
      (remote() ? '' : '<p class="pending-note">' + esc(t('local')) + '</p>') +
      '<div class="clist-wrap"></div>' +
      '<form class="cform" novalidate>' +
      '<label>' + esc(t('name')) + '<input type="text" name="name" maxlength="80" autocomplete="name"></label>' +
      '<label>' + esc(t('comment')) + '<textarea name="text" maxlength="4000"></textarea></label>' +
      '<div class="row"><button type="submit">' + esc(t('post')) + '</button><span class="cstatus" role="status" aria-live="polite"></span></div>' +
      '</form></div></details></div>';
  }

  function fmtDate(ts) {
    var d = new Date(ts);
    if (isNaN(d)) return '';
    try { return new Intl.DateTimeFormat(state.lang, { dateStyle: 'medium', timeStyle: 'short' }).format(d); }
    catch (e) { return d.toLocaleString(); }
  }
  function commentHtml(c) {
    return '<li class="c"><div class="c-head"><b>' + esc(c.name) + '</b> · ' + esc(fmtDate(c.ts)) +
      (c.lang ? '<span class="c-tag">' + esc(c.lang) + '</span>' : '') + '</div>' +
      '<p class="c-text">' + esc(c.text) + '</p>' +
      (c.reply ? '<p class="c-reply"><b>' + esc(t('rony')) + '</b><br>' + esc(c.reply) + '</p>' : '') + '</li>';
  }
  function paintComments() {
    var by = {};
    state.comments.forEach(function (c) { (by[c.section] = by[c.section] || []).push(c); });
    Array.prototype.forEach.call(document.querySelectorAll('.comments'), function (box) {
      var list = (by[box.getAttribute('data-key')] || []).slice().sort(function (a, b) { return new Date(a.ts) - new Date(b.ts); });
      box.querySelector('.count').textContent = list.length;
      var wrap = box.querySelector('.clist-wrap');
      wrap.innerHTML = list.length ? '<ul class="clist">' + list.map(commentHtml).join('') + '</ul>'
        : '<p class="cempty">' + esc(state.commentsOk ? t('none') : t('loadFail')) + '</p>';
    });
  }

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

  async function postComment(key, name, text) {
    var c = { section: key, name: name, text: text, lang: state.lang };
    if (!remote()) {
      c.id = 'l' + Date.now(); c.ts = new Date().toISOString();
      state.comments.push(c); store(localKey(), JSON.stringify(state.comments)); return;
    }
    var r = await fetch(cfg().endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // a "simple" request: no CORS preflight
      body: JSON.stringify({ token: cfg().token || '', section: key, name: name, text: text, lang: state.lang })
    });
    var d = await r.json();
    if (!d || !d.ok) throw new Error((d && d.error) || 'post');
  }

  document.addEventListener('submit', async function (e) {
    var form = e.target.closest && e.target.closest('.cform');
    if (!form) return;
    e.preventDefault();
    var box = form.closest('.comments'), key = box.getAttribute('data-key');
    var status = form.querySelector('.cstatus'), btn = form.querySelector('button');
    var name = form.elements.name.value.trim(), text = form.elements.text.value.trim();
    status.className = 'cstatus';
    if (!name || !text) { status.textContent = t('needBoth'); status.className = 'cstatus err'; return; }
    btn.disabled = true; status.textContent = t('posting');
    try {
      await postComment(key, name, text);
      store('eof-name', name);
      form.elements.text.value = '';
      status.textContent = t('posted');
      await loadComments();
    } catch (err) {
      status.textContent = t('postFail'); status.className = 'cstatus err';
    }
    btn.disabled = false;
  });

  // keep the name between visits; Ctrl/Cmd+Enter posts (never while an IME is composing)
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.tagName !== 'DETAILS' || !d.open) return;
    var n = d.querySelector('input[name=name]');
    if (n && !n.value) n.value = store('eof-name') || '';
    if (remote()) loadComments();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.isComposing && e.target.tagName === 'TEXTAREA') {
      var f = e.target.closest('.cform'); if (f) { e.preventDefault(); f.requestSubmit(); }
    }
  });

  /* ---------- start ---------- */
  applyChrome();
  $('pw').focus();
})();
