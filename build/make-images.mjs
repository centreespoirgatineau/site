// The two raster images the site needs, drawn in headless Chrome from the
// official logo and committed to src/root/:
//   og.png               1200x630, the card shown when the address is shared
//   apple-touch-icon.png 180x180, the icon iOS uses when the site is saved
//
//   node build/make-images.mjs
//
// Everything else on the site is SVG. Rerun this when the logo or the wording
// on the card changes. Chrome first, then Edge: Edge's headless mode has been
// known to exit 0 without writing the file.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'root');
fs.mkdirSync(OUT, { recursive: true });

const b64 = (p) => fs.readFileSync(p).toString('base64');
const logoV = b64(path.join(ROOT, 'src/assets/img/logo-vertical.svg'));
const icon = b64(path.join(ROOT, 'src/assets/img/icon.svg'));
const serif = b64(path.join(ROOT, 'src/assets/fonts/SourceSerif4-normal-400-700.woff2'));
const sans = b64(path.join(ROOT, 'src/assets/fonts/SourceSans3-normal-400-700.woff2'));

const fonts = `
  @font-face { font-family: "Source Serif 4"; font-weight: 400 700; src: url(data:font/woff2;base64,${serif}) format("woff2"); }
  @font-face { font-family: "Source Sans 3"; font-weight: 400 700; src: url(data:font/woff2;base64,${sans}) format("woff2"); }`;

const og = `<!doctype html><meta charset="utf-8">
<style>
  ${fonts}
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { background: #FAF9F5; color: #141413; font-family: "Source Sans 3", sans-serif; position: relative;
         display: grid; grid-template-columns: 1fr 340px; align-items: center; gap: 48px; padding: 72px 72px 72px 80px; }
  body::after { content: ""; position: absolute; right: -200px; top: -220px; width: 760px; height: 760px; border-radius: 50%;
                background: radial-gradient(circle, #F8EDE6 0%, rgba(248,237,230,0) 68%); }
  .text { position: relative; z-index: 1; }
  .eyebrow { display: flex; align-items: center; gap: 14px; font-size: 20px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #B4573A; }
  .eyebrow::before { content: ""; width: 34px; height: 3px; background: #DA7757; border-radius: 2px; }
  h1 { font-family: "Source Serif 4", Georgia, serif; font-weight: 500; font-size: 60px; line-height: 1.1; letter-spacing: -.02em; margin: 26px 0 22px; max-width: 12.5em; }
  p { font-size: 26px; line-height: 1.45; color: #55534E; max-width: 26em; }
  .hours { margin-top: 34px; display: inline-flex; align-items: center; gap: 12px; background: #141413; color: #fff; border-radius: 999px; padding: 14px 26px; font-size: 21px; font-weight: 600; }
  .hours b { color: #F2B79F; font-weight: 600; }
  img { position: relative; z-index: 1; width: 340px; justify-self: center; }
</style>
<div class="text">
  <div class="eyebrow">Banque alimentaire, Gatineau</div>
  <h1>Nourrir le corps, ce n’est que la moitié du travail.</h1>
  <p>Depuis 1984, le Centre Espoir de Gatineau offre chaque mois un supplément alimentaire à plus de 250 familles du quartier Notre‑Dame.</p>
  <div class="hours"><b>Distribution</b> du mardi au jeudi, 9H30 à 12H30</div>
</div>
<img src="data:image/svg+xml;base64,${logoV}" alt="">`;

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
  const tmp = path.join(os.tmpdir(), `site-img-${process.pid}-${w}.html`);
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

shoot(og, 1200, 630, path.join(OUT, 'og.png'));
shoot(touch, 180, 180, path.join(OUT, 'apple-touch-icon.png'));
