// Assemble the site: src/pages/*.html wrapped in src/partials/layout.html,
// assets copied with a content hash in their name, sitemap and robots written.
//
//   node build/build.mjs            → public/
//
// Zero dependencies, on purpose: the same rule as the surplus platform. There
// is nothing to install, on a laptop or on the server.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'public');
const SITE_URL = 'https://centreespoir.ca';

// Addresses that appear on several pages, kept in one place. The two forms are
// still the old Wix ones: once centreespoir.ca points at this site, they must be
// reached through the free *.wixsite.com address (or rebuilt), so change them here.
export const URLS = {
  'url.form_aide': 'https://www.centreespoir.ca/aide',
  'url.form_benevole': 'https://www.centreespoir.ca/embauche',
  'url.don': 'https://www.zeffy.com/fr-CA/donation-form/faire-un-don-en-ligne-3',
  'url.etats_financiers': 'https://drive.google.com/drive/folders/174pVZCi2dR_dj7QNkUAm2wepAFVV2odh?usp=sharing',
  'url.rapports_annuels': 'https://drive.google.com/drive/folders/1IR1wQ3CXVYM0lJXzO0_vBQ0pJwWTFGYS?usp=sharing',
  'url.maps': 'https://maps.google.com/?q=791+Boulevard+Maloney+E,+Gatineau,+QC+J8P+1H8',
  'url.facebook': 'https://www.facebook.com/centreespoirgatineau',
  'url.instagram': 'https://www.instagram.com/centreespoirgatineau',
};

// ---- helpers ---------------------------------------------------------------
const read = (p) => fs.readFileSync(p, 'utf8');
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
function write(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
}
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// Front matter: a leading block of `key: value` lines between `---` fences.
function parsePage(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error('page without front matter');
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

// `{{ name }}` substitution, plus `{{> partial }}` includes.
function render(tpl, vars, depth = 0) {
  if (depth > 10) throw new Error('partial recursion');
  return tpl
    .replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) =>
      render(read(path.join(SRC, 'partials', `${name}.html`)), vars, depth + 1))
    .replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
      if (!(key in vars)) throw new Error(`unknown variable {{ ${key} }}`);
      return vars[key];
    });
}

// ---- start clean -------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---- assets: copy, hashing CSS and JS ---------------------------------------
// Fonts, images and the like keep their names (they are referenced from the CSS
// and change rarely); the stylesheet and the script get a hash, because a stale
// cached stylesheet once broke a live layout and it is not going to happen twice.
const assetMap = {};
for (const file of walk(path.join(SRC, 'assets'))) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  const buf = fs.readFileSync(file);
  let outRel = rel;
  if (/\.(css|js)$/.test(rel)) {
    const ext = path.extname(rel);
    outRel = rel.slice(0, -ext.length) + '.' + hash(buf) + ext;
  }
  assetMap[rel] = '/' + outRel;
  write(path.join(OUT, outRel), buf);
}

// Files that must sit at the root under a fixed name.
for (const name of ['favicon.svg', 'og.png', 'apple-touch-icon.png', 'site.webmanifest']) {
  const p = path.join(SRC, 'root', name);
  if (fs.existsSync(p)) write(path.join(OUT, name), fs.readFileSync(p));
}

// ---- pages -----------------------------------------------------------------
const layout = read(path.join(SRC, 'partials', 'layout.html'));
const pages = [];
for (const file of walk(path.join(SRC, 'pages'))) {
  if (!file.endsWith('.html')) continue;
  const { meta, body } = parsePage(read(file));
  const slug = meta.slug ?? path.basename(file, '.html');
  const url = slug === 'index' ? '/' : `/${slug}`;
  const vars = {
    title: meta.title,
    description: meta.description,
    canonical: SITE_URL + (url === '/' ? '' : url),
    page: slug,
    body_class: meta.body_class ?? '',
    css: assetMap['assets/css/site.css'],
    js: assetMap['assets/js/site.js'],
    year: String(new Date().getFullYear()),
    content: render(body, { ...URLS }),
    ...URLS,
    // Nav highlighting: `{{ nav.<slug> }}` renders ` aria-current="page"` or ''.
  };
  for (const s of ['index', 'aide-alimentaire', 'benevolat', 'dons', 'a-propos', 'nous-joindre']) {
    vars[`nav.${s}`] = s === slug ? ' aria-current="page"' : '';
  }
  const html = render(layout, vars);
  write(path.join(OUT, `${slug}.html`), html);
  if (meta.sitemap !== 'no') pages.push({ url, priority: meta.priority ?? '0.7' });
}

// ---- sitemap and robots ----------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
write(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map((p) => `  <url><loc>${SITE_URL}${p.url}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`).join('\n') +
  `\n</urlset>\n`);
write(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`built ${pages.length} pages → ${path.relative(ROOT, OUT)}/`);
