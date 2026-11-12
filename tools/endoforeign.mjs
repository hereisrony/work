#!/usr/bin/env node
// Seals / opens the private content of /endoforeign/.
//
//   node tools/endoforeign.mjs pack      private/endoforeign/*  ->  endoforeign/vault.json
//   node tools/endoforeign.mjs unpack    endoforeign/vault.json ->  private/endoforeign/*
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
const PAGES = ['home', 'synopsis', 'statement', 'notebook', 'characters', 'drafts', 'moodboard'];

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

async function pack() {
  const config = existsSync(join(SRC, 'config.json')) ? JSON.parse(readFileSync(join(SRC, 'config.json'), 'utf8')) : {};
  const pages = {};
  for (const p of PAGES) {
    pages[p] = {};
    for (const l of LANGS) {
      const f = join(SRC, `${p}.${l}.md`);
      if (existsSync(f)) pages[p][l] = readFileSync(f, 'utf8');
    }
    if (!pages[p].en) throw new Error(`missing ${p}.en.md — English is the original`);
    for (const l of LANGS.slice(1)) {
      if (pages[p][l] && JSON.stringify(ids(pages[p][l])) !== JSON.stringify(ids(pages[p].en)))
        console.warn(`warning: ${p}.${l}.md has different section ids than ${p}.en.md — comments would not line up`);
      if (!pages[p][l]) console.warn(`note: ${p}.${l}.md missing, readers will see English`);
    }
  }
  const pw = await password();
  const salt = randomBytes(16), iv = randomBytes(12);
  const key = await keyFor(pw, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ config, pages })));
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
  for (const [p, langs] of Object.entries(data.pages)) for (const [l, md] of Object.entries(langs)) writeFileSync(join(SRC, `${p}.${l}.md`), md);
  console.log('unpacked to private/endoforeign/');
}

const cmd = process.argv[2];
if (cmd === 'pack') await pack();
else if (cmd === 'unpack') await unpack();
else if (cmd === 'token') console.log(randomBytes(18).toString('base64url'));
else console.log('usage: node tools/endoforeign.mjs pack | unpack | token');
