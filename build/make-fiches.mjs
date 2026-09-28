// Les fiches PDF des projets, une page Lettre chacune, dessinées par Chrome
// sans tête à partir des fichiers de src/projets/ et commises dans
// src/assets/fiches/ (le serveur n'a pas de Chrome, il les sert telles quelles).
//
//   node build/make-fiches.mjs
//
// À relancer après chaque changement de projet : build/fiches.lock.json garde
// l'empreinte de chaque fiche, et le test échoue si une fiche est périmée.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chargerProjets, ficheHTML, empreinte } from './projets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'assets', 'fiches');
const LOCK = path.join(ROOT, 'build', 'fiches.lock.json');
fs.mkdirSync(OUT, { recursive: true });

// Chrome d'abord : le mode sans tête d'Edge a déjà quitté sans rien écrire.
const navigateurs = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter((p) => fs.existsSync(p));
if (!navigateurs.length) throw new Error('ni Chrome ni Edge sur cette machine');

function imprimer(html, sortie) {
  const tmp = path.join(os.tmpdir(), `fiche-${process.pid}-${path.basename(sortie)}.html`);
  fs.writeFileSync(tmp, html);
  for (const n of navigateurs) {
    try { fs.unlinkSync(sortie); } catch {}
    execFileSync(n, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer',
      '--virtual-time-budget=6000', `--print-to-pdf=${sortie}`, pathToFileURL(tmp).href], { stdio: 'ignore' });
    if (fs.existsSync(sortie) && fs.statSync(sortie).size > 0) {
      fs.unlinkSync(tmp);
      console.log(`écrit ${path.relative(ROOT, sortie)}`);
      return;
    }
  }
  throw new Error(`aucun navigateur n'a produit ${sortie}`);
}

const projets = await chargerProjets();
const lock = {};
for (const p of projets) {
  const html = ficheHTML(p);
  imprimer(html, path.join(OUT, `${p.slug}.pdf`));
  lock[p.slug] = empreinte(html);
}
// Une fiche dont le projet a disparu disparaît aussi.
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith('.pdf') && !(f.replace(/\.pdf$/, '') in lock)) { fs.unlinkSync(path.join(OUT, f)); console.log(`retiré ${f}`); }
}
fs.writeFileSync(LOCK, JSON.stringify(lock, null, 2) + '\n');
