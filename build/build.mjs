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

// Addresses that appear on several pages, kept in one place.
//
// The application for food aid is the platform's form (aide.centreespoir.ca, since
// 2026-09-24, David). The volunteer form is still on Wix, reached through its free
// address because centreespoir.ca now serves this site; when it is replaced,
// change it here and nowhere else.
export const URLS = {
  'url.form_aide': 'https://aide.centreespoir.ca/demande',
  // Who can receive help: the income limits, kept current in the platform's Réglages.
  // The table on /aide-alimentaire copies them: update it when the limits change (each year).
  'url.admissibilite': 'https://aide.centreespoir.ca/admissibilite',
  'url.form_benevole': 'https://centreespoir.wixsite.com/accueil/embauche',
  'url.don': 'https://www.zeffy.com/fr-CA/donation-form/faire-un-don-en-ligne-3',
  'url.etats_financiers': 'https://drive.google.com/drive/folders/174pVZCi2dR_dj7QNkUAm2wepAFVV2odh?usp=sharing',
  'url.rapports_annuels': 'https://drive.google.com/drive/folders/1IR1wQ3CXVYM0lJXzO0_vBQ0pJwWTFGYS?usp=sharing',
  'url.maps': 'https://maps.google.com/?q=791+Boulevard+Maloney+E,+Gatineau,+QC+J8P+1H8',
  'url.facebook': 'https://www.facebook.com/centreespoirgatineau',
  'url.instagram': 'https://www.instagram.com/centreespoirgatineau',
  // The surplus platform for the region's organisations. /demande is its join
  // request form, /presentation the two-minute slideshow.
  'url.spp': 'https://spp.centreespoir.ca',
  'url.spp_demande': 'https://spp.centreespoir.ca/demande',
  'url.spp_presentation': 'https://spp.centreespoir.ca/presentation',
  // No form for schools, by David's decision (2026-09-22): the button opens an
  // e-mail with the subject line he chose, and nothing else.
  'url.ecoles': 'mailto:info@centreespoir.ca?subject=' + encodeURIComponent('J’aimerais inscrire mon école'),
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

// ---- assets: every file gets its content hash in its name -------------------
// A changed file is a new file the browser has never seen, so it is fetched at
// once, while unchanged ones stay cached for a year. HTML itself is never
// cached (see deploy/nginx.conf), so a visitor always gets the current names.
// Nobody ever has to "clear their cache". Fonts and images are hashed first,
// then the stylesheet (which refers to them) is rewritten and hashed in turn.
const assetMap = {};
const hashedName = (rel, buf) => {
  const ext = path.extname(rel);
  return rel.slice(0, -ext.length) + '.' + hash(buf) + ext;
};
const assetFiles = walk(path.join(SRC, 'assets'))
  .filter((f) => !/\.md$/i.test(f))
  .map((f) => ({ file: f, rel: path.relative(SRC, f).split(path.sep).join('/') }));

for (const { file, rel } of assetFiles.filter((a) => !/\.(css|js)$/.test(a.rel))) {
  const buf = fs.readFileSync(file);
  const outRel = hashedName(rel, buf);
  assetMap['/' + rel] = '/' + outRel;
  write(path.join(OUT, outRel), buf);
}
// Replace every `/assets/...` reference in a text with its hashed twin.
function rewriteAssets(text) {
  return text.replace(/\/assets\/[\w./-]+/g, (m) => assetMap[m] ?? m);
}
for (const { file, rel } of assetFiles.filter((a) => /\.(css|js)$/.test(a.rel))) {
  const buf = Buffer.from(rewriteAssets(read(file)), 'utf8');
  const outRel = hashedName(rel, buf);
  assetMap['/' + rel] = '/' + outRel;
  write(path.join(OUT, outRel), buf);
}

// Files that must sit at the root under a fixed name.
const rootVersion = {};
for (const file of walk(path.join(SRC, 'root'))) {
  const name = path.basename(file);
  const buf = fs.readFileSync(file);
  write(path.join(OUT, name), buf);
  rootVersion[name] = hash(buf);
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
    css: assetMap['/assets/css/site.css'],
    js: assetMap['/assets/js/site.js'],
    // Fixed-name files carry a version tag so a changed icon or card is refetched.
    favicon_v: rootVersion['favicon.svg'] ?? '0',
    touch_v: rootVersion['apple-touch-icon.png'] ?? '0',
    // Each page may name its own share card (og_image in the front matter);
    // the home card is the fallback. The version tag makes social networks
    // refetch a redrawn card instead of showing the one they cached.
    og_image: `${SITE_URL}/${meta.og_image ?? 'og.png'}?v=${rootVersion[meta.og_image ?? 'og.png'] ?? '0'}`,
    og_alt: meta.og_alt ?? 'Le phare du Centre Espoir de Gatineau sur fond terracotta, et les mots « Nourrir le corps, ce n’est que la moitié du travail »',
    year: String(new Date().getFullYear()),
    content: render(body, { ...URLS }),
    ...URLS,
    // Nav highlighting: `{{ nav.<slug> }}` renders ` aria-current="page"` or ''.
  };
  for (const s of ['index', 'aide-alimentaire', 'benevolat', 'initiatives', 'dons', 'a-propos', 'nous-joindre']) {
    vars[`nav.${s}`] = s === slug ? ' aria-current="page"' : '';
  }
  const html = rewriteAssets(render(layout, vars));
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
