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
  for (const p of ['index', 'aide-alimentaire', 'benevolat', 'initiatives', 'projets', 'dons', 'a-propos', 'nous-joindre', 'confidentialite', '404']) {
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

test('titles fit a search result and descriptions fit a preview', () => {
  for (const [f, h] of Object.entries(html)) {
    const title = h.match(/<title>([^<]+)<\/title>/)[1];
    const desc = h.match(/<meta name="description" content="([^"]+)"/)[1];
    assert.ok(title.length <= 60, `${f}: title is ${title.length} chars, max 60`);
    assert.ok(desc.length >= 110 && desc.length <= 158, `${f}: description is ${desc.length} chars, want 110 to 158`);
    const og = h.match(/<meta property="og:image" content="https:\/\/centreespoir\.ca\/([^"?]+)\?v=[0-9a-f]{10}"/);
    assert.ok(og, `${f}: og:image must be an absolute, versioned address`);
    assert.ok(fs.existsSync(path.join(OUT, og[1])), `${f}: share card ${og[1]} does not exist`);
    assert.match(h, /"@type": \["NGO", "LocalBusiness"\]/, `${f}: structured data`);
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

test('the income calculator reads the platform\'s current limits, with a copy to fall back on', () => {
  const page = html['aide-alimentaire.html'];
  assert.ok(page.includes('data-calc-src="https://aide.centreespoir.ca/seuils.json"'));
  const copy = JSON.parse(page.match(/data-calc='([^']+)'/)[1]);
  assert.equal(typeof copy[1][0], 'number', 'the fallback copy is there');
  assert.ok(page.includes('<span data-calc-pct>'));
  const csp = fs.readFileSync(path.join(ROOT, 'deploy/security.inc'), 'utf8');
  assert.match(csp, /connect-src[^;]*https:\/\/aide\.centreespoir\.ca/, 'the policy lets the page read the platform');
});

test('every project is complete, adds up, and has an up-to-date PDF fiche', async () => {
  const { chargerProjets, ficheHTML, empreinte, STATUTS, ETATS } = await import('../build/projets.mjs');
  const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/fiches.lock.json'), 'utf8'));
  const projets = await chargerProjets();
  assert.ok(projets.length > 0);
  for (const p of projets) {
    for (const k of ['court', 'titre', 'accroche', 'pourquoi', 'statut', 'partenaires']) assert.ok(p[k] != null, `${p.slug}: ${k} missing`);
    assert.ok(p.statut in STATUTS, `${p.slug}: unknown status ${p.statut}`);
    if (p.offres) {
      const total = p.offres.reduce((s, o) => s + Math.round(o.montant * 100) * o.places, 0);
      assert.equal(total, Math.round(p.reste * 100), `${p.slug}: the sponsorship tiers must add up to what is left to raise`);
      for (const x of p.partenaires) assert.ok(p.offres.some((o) => o.id === x.palier), `${p.slug}: ${x.nom} has an unknown tier`);
      for (const o of p.offres) assert.ok(o.prises <= o.places, `${p.slug}: too many partners at ${o.nom}`);
    }
    for (const x of (p.budget ?? []).flatMap((g) => g.postes)) {
      assert.ok(x.montant > 0, `${p.slug}: ${x.poste} has no amount`);
      if (x.etat) assert.ok(x.etat in ETATS, `${p.slug}: unknown state ${x.etat}`);
    }
    if (p.objectif != null) assert.ok(p.reuni <= p.objectif + 0.005, `${p.slug}: more raised than the budget`);
    if (p.statut !== 'a-financer' && p.objectif != null) assert.equal(Math.round(p.reuni * 100), Math.round(p.objectif * 100), `${p.slug}: a project in progress should be fully funded`);
    for (const x of p.partenaires) if (x.logo) assert.ok(fs.existsSync(path.join(ROOT, 'src/assets/img/partenaires', x.logo)), `${p.slug}: logo ${x.logo} missing`);
    assert.ok(fs.existsSync(path.join(ROOT, 'src/assets/fiches', `${p.slug}.pdf`)), `${p.slug}: no PDF fiche, run node build/make-fiches.mjs`);
    assert.equal(lock[p.slug], empreinte(ficheHTML(p)), `${p.slug}: the PDF fiche is out of date, run node build/make-fiches.mjs`);
    assert.ok(html['projets.html'].includes(`id="${p.slug}"`), `${p.slug}: not on the page`);
  }
  // Amounts are written the way David chose: $1,115.26.
  assert.match(text(html['projets.html']), /\$10,000\.00/);
});

test('the souper announcement is on every page, from the first paint', () => {
  for (const [f, h] of Object.entries(html)) {
    assert.match(h, /class="ce-souper-bar"/, `${f}: no announcement`);
    assert.match(h, /\/assets\/css\/souper\.[0-9a-f]{10}\.css/, `${f}: souper.css missing or not hashed`);
    assert.match(h, /\/assets\/js\/souper\.[0-9a-f]{10}\.js/, `${f}: souper.js missing or not hashed`);
    assert.match(h, /href="https:\/\/www\.zeffy\.com\/fr-CA\/ticketing\/souper-saveurs-dafrique"/, `${f}: ticket link`);
  }
  const css = fs.readFileSync(path.join(OUT, html['index.html'].match(/\/assets\/css\/souper\.[0-9a-f]{10}\.css/)[0]), 'utf8');
  for (const m of css.matchAll(/url\("(\/[^"]+)"\)/g)) assert.ok(fs.existsSync(path.join(OUT, m[1])), `souper.css: ${m[1]} does not exist`);
});
