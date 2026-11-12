#!/usr/bin/env node
// Seals / opens the private content of /endoforeign/.
//
//   node tools/endoforeign.mjs pack      private/endoforeign/*  ->  endoforeign/vault.json
//   node tools/endoforeign.mjs unpack    endoforeign/vault.json ->  private/endoforeign/*
//   node tools/endoforeign.mjs release <page> [date]   keeps the current text as an older version, dates the new one
//   node tools/endoforeign.mjs token     prints a random token for the comment endpoint
//
// The password comes from $ENDOFOREIGN_PASSWORD, or is asked for. Zero dependencies.
// private/ is git-ignored: the repository is public, so only the encrypted
// vault.json is ever committed.

import { webcrypto as crypto, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'private', 'endoforeign');
const VAULT = join(root, 'endoforeign', 'vault.json');
const ITER = 600000;
const LANGS = ['en', 'fr', 'ko'];
const PAGES = ['home', 'synopsis', 'statement', 'characters', 'drafts', 'moodboard'];

const b64 = (u) => Buffer.from(u).toString('base64');

function ask(q) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const w = rl._writeToOutput;
    rl._writeToOutput = (s) => { if (s.startsWith(q)) w.call(rl, s); };
    rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); res(a); });
  });
}
async function password() {
  return process.env.ENDOFOREIGN_PASSWORD || (await ask('password: '));
}
async function keyFor(pw, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// every page must have the same ## {#ids} in every language, or comments drift apart
function ids(md) { return [...md.matchAll(/^## .*?(?:\{#([a-z0-9-]+)\})?\s*$/gm)].map((m) => m[1] || '(no id)'); }

const readJson = (f, d) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : d);
const DATES = join(SRC, 'dates.json');            // { page: id of its current version } — an id is a date, "2026-11-12", or "2026-11-12-2" for a second one that day
const IMGDIR = join(SRC, 'images');                // images/<name>.webp|jpg|png, used in pages as ![alt](img:<name>)
const MIME = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif' };
const VDIR = (p) => join(SRC, 'versions', p);     // versions/<page>/<id>/<lang>.md  = the older versions
function readLangs(base) {
  const o = {};
  for (const l of LANGS) { const f = base(l); if (existsSync(f)) o[l] = readFileSync(f, 'utf8'); }
  return o;
}

// English on this site is American. These are the British spellings and words that slip in most often.
const BRITISH = /\b(\w*(colour|honour|favour|behaviour|neighbour|labour|humour|rumour|harbour|flavour)\w*|\w*(centre|metre|litre|theatre|fibre)s?|\w*(realis|organis|recognis|apologis|emphasis|criticis|analys|summaris|memoris|prioritis)(e|ed|es|ing|ation|ations)\b|towards|whilst|amongst|learnt|spelt|judgement|licence|defence|offence|programme|grey|cheque|travell\w+|cancell\w+|pupils?|lift|mum|maths|autumn|fortnight|cinema)\b/gi;
function britishCheck(name, md) {
  md.split('\n').forEach((line, i) => { for (const m of line.matchAll(BRITISH)) console.warn(`American English? ${name}:${i + 1}: "${m[0]}"`); });
}

async function pack() {
  const config = readJson(join(SRC, 'config.json'), {});
  const dates = readJson(DATES, {});
  const pages = {};
  for (const p of PAGES) {
    const versions = [];
    const cur = readLangs((l) => join(SRC, `${p}.${l}.md`));
    if (!cur.en) throw new Error(`missing ${p}.en.md — English is the original`);
    versions.push({ id: dates[p] || '', date: (dates[p] || '').slice(0, 10), ...cur });
    if (existsSync(VDIR(p)))
      for (const id of readdirSync(VDIR(p)).sort().reverse()) {
        const v = readLangs((l) => join(VDIR(p), id, `${l}.md`));
        if (!v.en) throw new Error(`versions/${p}/${id}/en.md is missing`);
        if (id >= versions[0].id) console.warn(`warning: ${p} version ${id} is not older than the current one (${versions[0].id})`);
        versions.push({ id, date: id.slice(0, 10), ...v });
      }
    for (const v of versions) britishCheck(`${p}${v.id ? ' ' + v.id : ''}.en`, v.en);
    for (const v of versions) for (const l of LANGS.slice(1)) {
      if (v[l] && JSON.stringify(ids(v[l])) !== JSON.stringify(ids(v.en)))
        console.warn(`warning: ${p} ${v.id || 'current'} (${l}) has different section ids than English — comments would not line up`);
      if (!v[l]) console.warn(`note: ${p} ${v.id || 'current'} has no ${l} version, readers will see English`);
    }
    pages[p] = { versions };
  }
  const images = {};
  if (existsSync(IMGDIR))
    for (const f of readdirSync(IMGDIR)) {
      const m = /^([a-z0-9-]+)\.(webp|jpe?g|png|gif)$/i.exec(f);
      if (m) images[m[1]] = `data:${MIME[m[2].toLowerCase()]};base64,${readFileSync(join(IMGDIR, f)).toString('base64')}`;
    }
  for (const p of Object.values(pages)) for (const v of p.versions) for (const l of LANGS) for (const m of (v[l] || '').matchAll(/\(img:([a-z0-9-]+)\)/g))
    if (!images[m[1]]) console.warn(`warning: an image called "${m[1]}" is used but images/${m[1]}.* does not exist`);
  const pw = await password();
  const salt = randomBytes(16), iv = randomBytes(12);
  const key = await keyFor(pw, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ config, pages, images })));
  writeFileSync(VAULT, JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) }) + '\n');
  console.log('wrote endoforeign/vault.json');
}

async function unpack() {
  const v = JSON.parse(readFileSync(VAULT, 'utf8'));
  const un = (s) => new Uint8Array(Buffer.from(s, 'base64'));
  const key = await keyFor(await password(), un(v.salt));
  let data;
  try { data = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: un(v.iv) }, key, un(v.ct)))); }
  catch { console.error('wrong password'); process.exit(1); }
  mkdirSync(SRC, { recursive: true });
  writeFileSync(join(SRC, 'config.json'), JSON.stringify(data.config, null, 2) + '\n');
  const dates = readJson(DATES, {});
  mkdirSync(IMGDIR, { recursive: true });
  for (const [name, uri] of Object.entries(data.images || {})) {
    const m = /^data:image\/([a-z]+);base64,(.*)$/.exec(uri);
    if (m) writeFileSync(join(IMGDIR, `${name}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`), Buffer.from(m[2], 'base64'));
  }
  for (const [p, pg] of Object.entries(data.pages)) {
    const versions = pg.versions || [{ id: '', ...pg }];          // pages saved before versions existed
    versions.forEach((ver, i) => {
      if (i === 0) {
        if (ver.id) dates[p] = ver.id;
        for (const l of LANGS) if (ver[l]) writeFileSync(join(SRC, `${p}.${l}.md`), ver[l]);
      } else {
        const d = join(VDIR(p), ver.id); mkdirSync(d, { recursive: true });
        for (const l of LANGS) if (ver[l]) writeFileSync(join(d, `${l}.md`), ver[l]);
      }
    });
  }
  writeFileSync(DATES, JSON.stringify(dates, null, 2) + '\n');
  console.log('unpacked to private/endoforeign/');
}

// release <page> [YYYY-MM-DD]: the text now in <page>.<lang>.md becomes an older version, and the
// page gets a new current version dated today. Then write the new text into <page>.<lang>.md.
function release() {
  const page = process.argv[3], date = process.argv[4] || new Date().toISOString().slice(0, 10);
  if (!PAGES.includes(page) || page === 'home') { console.error('usage: release <page> [YYYY-MM-DD]   pages: ' + PAGES.slice(1).join(', ')); process.exit(1); }
  const dates = readJson(DATES, {}), old = dates[page];
  const taken = new Set([old, ...(existsSync(VDIR(page)) ? readdirSync(VDIR(page)) : [])].filter(Boolean));
  let id = date, n = 1;
  while (taken.has(id)) id = `${date}-${++n}`;
  if (old) {
    const d = join(VDIR(page), old); mkdirSync(d, { recursive: true });
    for (const l of LANGS) { const f = join(SRC, `${page}.${l}.md`); if (existsSync(f)) writeFileSync(join(d, `${l}.md`), readFileSync(f)); }
  }
  dates[page] = id;
  writeFileSync(DATES, JSON.stringify(dates, null, 2) + '\n');
  console.log(old ? `archived ${page} ${old}; ${page} is now version ${id}. Write the new text into private/endoforeign/${page}.<lang>.md, then pack.`
                  : `${page} is now dated ${id}.`);
}

const cmd = process.argv[2];
if (cmd === 'pack') await pack();
else if (cmd === 'unpack') await unpack();
else if (cmd === 'release') release();
else if (cmd === 'token') console.log(randomBytes(18).toString('base64url'));
else console.log('usage: node tools/endoforeign.mjs pack | unpack | release <page> [date] | token');
