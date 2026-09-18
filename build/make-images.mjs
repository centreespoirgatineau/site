// The raster images the site needs, drawn in headless Chrome and committed to
// src/root/:
//   og.png and og-<page>.png   1200x630, the card shown when an address is shared
//   apple-touch-icon.png       180x180, the icon iOS uses when the site is saved
//
//   node build/make-images.mjs
//
// One card per page, so a shared link to /dons talks about giving and a link to
// /benevolat about volunteering. Same design for all, the one David chose on
// 2026-09-18 among six: the compact logo, the words on cream, and the page's own
// illustration on a soft terracotta wash, exactly like the site. Rerun when the logo or the wording changes.
// Chrome first, then Edge: Edge's headless mode has been known to exit 0 without
// writing the file.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'root');
fs.mkdirSync(OUT, { recursive: true });

const b64 = (p) => fs.readFileSync(p).toString('base64');
const logoHeader = b64(path.join(ROOT, 'src/assets/img/logo-header.svg'));
const icon = b64(path.join(ROOT, 'src/assets/img/icon.svg'));
const illustration = (name) => b64(path.join(ROOT, 'src/assets/img/illustrations', `${name}.svg`));
const serif = b64(path.join(ROOT, 'src/assets/fonts/SourceSerif4-normal-400-700.woff2'));
const sans = b64(path.join(ROOT, 'src/assets/fonts/SourceSans3-normal-400-700.woff2'));

// ---- The cards ------------------------------------------------------------
// Short on purpose: a share card is read in a second, in a feed, on a phone.
const CARDS = {
  'og.png': {
    illu: 'loving',
    eyebrow: 'Banque alimentaire, Gatineau',
    title: 'Nourrir le corps, ce n’est que la moitié du travail.',
    line: 'Depuis 1984, plus de 250 familles du quartier Notre‑Dame reçoivent chaque mois un supplément alimentaire.',
    pill: 'Du mardi au jeudi, 9H30 à 12H30',
  },
  'og-aide-alimentaire.png': {
    illu: 'unboxing',
    eyebrow: 'Aide alimentaire',
    title: 'Un panier pour passer le mois. Sans jugement.',
    line: 'Pour les résidents du quartier Notre‑Dame et des secteurs environnants de Gatineau.',
    pill: 'Du mardi au jeudi, 9H30 à 12H30',
  },
  'og-benevolat.png': {
    illu: 'peep-standing-30|peep-standing-5|peep-standing-25',
    eyebrow: 'Bénévolat',
    title: 'Quelques heures de votre semaine, des centaines de paniers remplis.',
    line: 'Trier, préparer les paniers, accueillir. Aucune expérience nécessaire.',
    pill: 'Dès 14 ans',
  },
  'og-dons.png': {
    illu: 'plant',
    eyebrow: 'Faire un don',
    title: 'Votre don se retrouve directement dans les paniers.',
    line: 'En ligne, par virement Interac ou en denrées.',
    pill: 'Reçu officiel pour fins d’impôt',
  },
  'og-a-propos.png': {
    illu: 'sitting-reading',
    eyebrow: 'À propos',
    title: 'Plus de 40 ans au cœur du quartier Notre‑Dame.',
    line: 'Fondé en 1984. Plus de 250 familles aidées chaque mois, soit environ 1 000 personnes.',
    pill: 'Organisme de bienfaisance enregistré',
  },
  'og-nous-joindre.png': {
    illu: 'chilling',
    eyebrow: 'Nous joindre',
    title: '791, boulevard Maloney Est, Gatineau.',
    line: '819‑663‑3238 · info@centreespoir.ca',
    pill: 'Du mardi au jeudi, 9H30 à 12H30',
  },
};

const fonts = `
  @font-face { font-family: "Source Serif 4"; font-weight: 400 700; src: url(data:font/woff2;base64,${serif}) format("woff2"); }
  @font-face { font-family: "Source Sans 3"; font-weight: 400 700; src: url(data:font/woff2;base64,${sans}) format("woff2"); }`;

function card({ eyebrow, title, line, pill, illu }) {
  // Long titles get a smaller size, so every card keeps the same margins.
  const titleSize = title.length > 58 ? 46 : title.length > 46 ? 50 : 54;
  // Several names separated by | stand side by side, like the volunteer trio.
  const names = illu.split('|');
  const imgs = names.map((n) => `<img src="data:image/svg+xml;base64,${illustration(n)}" alt="" style="width:${names.length > 1 ? Math.floor(92 / names.length) : 100}%">`).join('');
  return `<!doctype html><meta charset="utf-8">
<style>
  ${fonts}
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { background: #FAF9F5; color: #141413; font-family: "Source Sans 3", sans-serif; display: grid; grid-template-columns: 1fr 460px; padding: 56px 64px 56px 72px; column-gap: 16px; }
  .text { display: flex; flex-direction: column; justify-content: center; }
  .logo { height: 50px; width: auto; align-self: flex-start; margin-bottom: 34px; }
  .eyebrow { display: flex; align-items: center; gap: 14px; font-size: 20px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #B4573A; }
  .eyebrow::before { content: ""; width: 34px; height: 3px; background: #DA7757; border-radius: 2px; }
  h1 { font-family: "Source Serif 4", Georgia, serif; font-weight: 500; font-size: ${titleSize}px; line-height: 1.1; letter-spacing: -.02em; margin: 20px 0 16px; text-wrap: balance; }
  p { font-size: 23px; line-height: 1.42; color: #55534E; max-width: 24em; }
  .pill { margin-top: 24px; align-self: flex-start; background: #141413; color: #fff; border-radius: 999px; padding: 13px 24px; font-size: 21px; font-weight: 600; }
  /* The illustration on a soft terracotta wash, as on the site's own pages. */
  .art { position: relative; display: flex; align-items: ${names.length > 1 ? 'flex-end' : 'center'}; justify-content: center; gap: 4%; }
  .art::before { content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 520px; height: 520px; border-radius: 50%; background: radial-gradient(circle, #F8EDE6 0%, rgba(248,237,230,0) 70%); }
  .art img { position: relative; max-height: 500px; }
</style>
<div class="text">
  <img class="logo" src="data:image/svg+xml;base64,${logoHeader}" alt="">
  <div class="eyebrow">${eyebrow}</div>
  <h1>${title}</h1>
  <p>${line}</p>
  ${pill ? `<div class="pill">${pill}</div>` : ''}
</div>
<div class="art">${imgs}</div>`;
}

const touch = `<!doctype html><meta charset="utf-8">
<style>
  * { margin: 0; } html, body { width: 180px; height: 180px; overflow: hidden; }
  body { background: #FAF9F5; display: grid; place-items: center; }
  img { width: 136px; height: 136px; }
</style>
<img src="data:image/svg+xml;base64,${icon}" alt="">`;

const browsers = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter((p) => fs.existsSync(p));
if (!browsers.length) throw new Error('no Chrome or Edge found');

function shoot(html, w, h, out) {
  const tmp = path.join(os.tmpdir(), `site-img-${process.pid}-${path.basename(out)}.html`);
  fs.writeFileSync(tmp, html);
  for (const browser of browsers) {
    try { fs.unlinkSync(out); } catch {}
    execFileSync(browser, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      `--window-size=${w},${h}`, '--virtual-time-budget=4000', `--screenshot=${out}`,
      'file:///' + tmp.replace(/\\/g, '/'),
    ], { stdio: 'ignore' });
    if (fs.existsSync(out) && fs.statSync(out).size > 0) { fs.unlinkSync(tmp); console.log(`wrote ${path.relative(ROOT, out)}`); return; }
  }
  throw new Error(`no browser produced ${out}`);
}

for (const [file, data] of Object.entries(CARDS)) shoot(card(data), 1200, 630, path.join(OUT, file));
shoot(touch, 180, 180, path.join(OUT, 'apple-touch-icon.png'));
