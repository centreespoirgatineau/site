// Builds the site into a temporary folder and checks what came out: every page
// has its title and description, no template marker was left behind, every
// internal link and asset points at a file that exists, the wording rules hold.
//
//   node --test "test/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');

execFileSync(process.execPath, [path.join(ROOT, 'build/build.mjs')], { stdio: 'ignore' });

const pages = fs.readdirSync(OUT).filter((f) => f.endsWith('.html'));
const html = Object.fromEntries(pages.map((f) => [f, fs.readFileSync(path.join(OUT, f), 'utf8')]));
const text = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');

test('the expected pages are built', () => {
  for (const p of ['index', 'aide-alimentaire', 'benevolat', 'dons', 'a-propos', 'nous-joindre', 'confidentialite', '404']) {
    assert.ok(pages.includes(`${p}.html`), `${p}.html missing`);
  }
  assert.ok(fs.existsSync(path.join(OUT, 'sitemap.xml')));
  assert.ok(fs.existsSync(path.join(OUT, 'robots.txt')));
  assert.ok(fs.existsSync(path.join(OUT, 'og.png')));
  assert.ok(fs.existsSync(path.join(OUT, 'favicon.svg')));
});

test('every page has a title, a description, one h1, and no leftover template marker', () => {
  for (const [f, h] of Object.entries(html)) {
    assert.match(h, /<title>[^<]{10,}<\/title>/, `${f}: title`);
    assert.match(h, /<meta name="description" content="[^"]{40,}"/, `${f}: description`);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, `${f}: exactly one h1`);
    assert.ok(!h.includes('{{'), `${f}: unrendered {{ }}`);
    assert.match(h, /<html lang="fr-CA"/, `${f}: lang`);
  }
});

test('internal links and local assets resolve to files', () => {
  const exists = (u) => {
    const clean = u.split(/[?#]/)[0];
    if (clean === '/') return true;
    const p = path.join(OUT, clean);
    return fs.existsSync(p) || fs.existsSync(p + '.html');
  };
  for (const [f, h] of Object.entries(html)) {
    for (const m of h.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      assert.ok(exists(m[1]), `${f}: ${m[1]} does not exist`);
    }
  }
  const css = fs.readFileSync(path.join(OUT, html['index.html'].match(/href="(\/assets\/css\/[^"]+)"/)[1]), 'utf8');
  for (const m of css.matchAll(/url\("(\/[^"]+)"\)/g)) {
    assert.ok(fs.existsSync(path.join(OUT, m[1])), `css: ${m[1]} does not exist`);
  }
});

test('external links open in a new tab and carry rel=noopener', () => {
  for (const [f, h] of Object.entries(html)) {
    for (const m of h.matchAll(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g)) {
      assert.match(m[0], /target="_blank"/, `${f}: ${m[0]}`);
      assert.match(m[0], /rel="noopener"/, `${f}: ${m[0]}`);
    }
  }
});

test('the stylesheet and the script are content-hashed and HTML never is', () => {
  assert.match(html['index.html'], /\/assets\/css\/site\.[0-9a-f]{10}\.css/);
  assert.match(html['index.html'], /\/assets\/js\/site\.[0-9a-f]{10}\.js/);
});

test('the wording follows the house rules', () => {
  for (const [f, h] of Object.entries(html)) {
    const t = text(h);
    assert.ok(!/—/.test(t), `${f}: em dash`);
    assert.ok(!/\b\d{1,2}\s?h\s?\d{2}\b/.test(t), `${f}: hours must be written 9H30, not 9 h 30`);
    assert.ok(!/\(819\)/.test(t), `${f}: phone must be 819‑663‑3238 in body text`);
  }
  // Facts that must appear exactly.
  assert.match(text(html['index.html']), /mardi au jeudi, 9H30 à 12H30/);
  assert.match(text(html['dons.html']), /848106365RR0001/);
  assert.match(text(html['nous-joindre.html']), /791, boulevard Maloney Est/);
});

test('the site-wide content security policy allows the inline bootstrap script by hash', async () => {
  const { createHash } = await import('node:crypto');
  const m = html['index.html'].match(/<script>([^<]+)<\/script>/);
  const hash = createHash('sha256').update(m[1]).digest('base64');
  const csp = fs.readFileSync(path.join(ROOT, 'deploy/security.inc'), 'utf8');
  assert.ok(csp.includes(`'sha256-${hash}'`), 'security.inc must carry the hash of the inline script');
  assert.ok(!/script-src[^;]*unsafe-inline/.test(csp));
});
