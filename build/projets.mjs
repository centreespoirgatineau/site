// Les projets à financer : chargés depuis src/projets/, un fichier par projet,
// puis rendus deux fois à partir de la même source : la carte de la page
// /projets et la fiche PDF qu'on remet à une entreprise. Comme les deux sortent
// d'ici, elles ne peuvent pas se contredire.
//
// Ajouter un projet : copier un fichier de src/projets/, le modifier, puis
//   node build/make-fiches.mjs     (redessine les PDF)
//   node build/build.mjs
// Ajouter un partenaire : une ligne dans `partenaires` du projet (et son logo
// dans src/assets/img/partenaires/ pour une commandite), puis la même chose.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'src', 'projets');

export const STATUTS = { 'a-financer': 'À financer', 'en-cours': 'En cours', 'realise': 'Réalisé' };
export const ETATS = { 'fait': 'Réalisé', 'commande': 'Commandé', 'en-attente': 'En attente', 'a-venir': 'À venir' };

// Le format que David a choisi pour les montants : $1,115.26. Écrit à la main
// plutôt qu'avec Intl, pour ne dépendre d'aucune donnée de langue du serveur.
export function argent(n) {
  const c = Math.round(n * 100);
  const a = Math.abs(c);
  const ent = String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (c < 0 ? '-' : '') + '$' + ent + '.' + String(a % 100).padStart(2, '0');
}
const cents = (n) => Math.round(n * 100);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function chargerProjets() {
  const fichiers = fs.readdirSync(DIR).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));
  const projets = [];
  for (const f of fichiers) {
    const p = { ...(await import(pathToFileURL(path.join(DIR, f)).href)).default, slug: f.replace(/\.mjs$/, '') };
    p.objectif = p.budget ? p.budget.flatMap((g) => g.postes).reduce((s, x) => s + cents(x.montant), 0) / 100 : null;
    p.reuni = (p.financement ?? []).reduce((s, x) => s + cents(x.montant), 0) / 100;
    p.reste = p.objectif == null ? null : Math.max(0, cents(p.objectif) - cents(p.reuni)) / 100;
    projets.push(p);
  }
  return projets.sort((a, b) => a.ordre - b.ordre);
}

// L'empreinte d'une fiche : si le projet ou la mise en page change, elle change,
// et le test signale une fiche PDF à redessiner.
export const empreinte = (html) => crypto.createHash('sha256').update(html).digest('hex').slice(0, 16);

const mailto = (sujet) => 'mailto:direction@centreespoir.ca?subject=' + encodeURIComponent(sujet);

// ---- Le camion, avec la place des logos -------------------------------------
// Un dessin au trait dans le style du site : le logo du Centre en haut de la
// caisse, huit emplacements en pointillé pour les partenaires en dessous.
export function camionSVG(logoHref) {
  const cases = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const x = 64 + c * 92, y = 138 + r * 48;
    cases.push(`<rect x="${x}" y="${y}" width="80" height="38" rx="6" fill="#FBF3EE" stroke="#DA7757" stroke-width="2" stroke-dasharray="6 5"/>`
      + `<text x="${x + 40}" y="${y + 24}" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="12" font-weight="600" fill="#B4573A">Votre logo</text>`);
  }
  return `<svg class="camion" viewBox="0 0 640 292" role="img" aria-label="Le camion réfrigéré, avec la place réservée aux logos des partenaires" xmlns="http://www.w3.org/2000/svg">
  <line x1="12" y1="278" x2="628" y2="278" stroke="#D9D6CD" stroke-width="3" stroke-linecap="round"/>
  <rect x="40" y="36" width="400" height="196" rx="10" fill="#FFFFFF" stroke="#141413" stroke-width="3.5"/>
  <image href="${logoHref}" x="64" y="62" width="236" height="54"/>
  ${cases.join('\n  ')}
  <rect x="440" y="46" width="30" height="58" rx="5" fill="#F3F1EA" stroke="#141413" stroke-width="3"/>
  <path d="M446 62h18M446 74h18M446 86h18" stroke="#141413" stroke-width="2" stroke-linecap="round"/>
  <path d="M440 108H538Q556 108 564 122L592 172Q600 180 600 192V232H440Z" fill="#FFFFFF" stroke="#141413" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M470 122H534Q545 122 550 132L568 166H470Z" fill="#F3F1EA" stroke="#141413" stroke-width="3" stroke-linejoin="round"/>
  <path d="M466 178V226M490 190H506" stroke="#141413" stroke-width="3" stroke-linecap="round"/>
  <rect x="596" y="206" width="12" height="26" rx="3" fill="#141413"/>
  <rect x="34" y="230" width="574" height="14" rx="5" fill="#141413"/>
  <circle cx="120" cy="252" r="25" fill="#141413"/><circle cx="120" cy="252" r="10" fill="#FAF9F5"/>
  <circle cx="176" cy="252" r="25" fill="#141413"/><circle cx="176" cy="252" r="10" fill="#FAF9F5"/>
  <circle cx="530" cy="252" r="25" fill="#141413"/><circle cx="530" cy="252" r="10" fill="#FAF9F5"/>
</svg>`;
}

// ---- Les morceaux communs aux deux rendus ------------------------------------
function tableBudget(p) {
  if (!p.budget) return `<p class="projet-vide">Le budget s’établit avec vous, selon la forme d’aide.</p>`;
  const groupes = p.budget.map((g) => {
    const tete = g.titre ? `<tr class="groupe"><th colspan="3" scope="colgroup">${esc(g.titre)}</th></tr>` : '';
    const lignes = g.postes.map((x) => `<tr>
          <td><strong>${esc(x.poste)}</strong>${x.note ? `<span class="note">${esc(x.note)}</span>` : ''}</td>
          <td class="etat-cell">${x.etat ? `<span class="pastille pastille--${x.etat}">${ETATS[x.etat]}</span>` : ''}</td>
          <td class="montant">${argent(x.montant)}</td>
        </tr>`).join('');
    return tete + lignes;
  }).join('');
  return `<table class="budget">
        <tbody>${groupes}</tbody>
        <tfoot><tr><th colspan="2" scope="row">Total</th><td class="montant">${argent(p.objectif)}</td></tr></tfoot>
      </table>`;
}

function avancement(p) {
  if (p.objectif == null) return '';
  const pct = Math.min(100, Math.round((100 * p.reuni) / p.objectif));
  const reste = p.reste > 0
    ? `<p class="reste">Reste à réunir : <strong>${argent(p.reste)}</strong></p>`
    : `<p class="reste">Entièrement financé.</p>`;
  return `<div class="avancement">
        <p class="chiffres"><strong>${argent(p.reuni)}</strong> sur ${argent(p.objectif)}</p>
        <div class="barre" role="img" aria-label="${pct} % du projet financé"><span style="width:${pct}%"></span></div>
        ${reste}
      </div>`;
}

function partenaires(p) {
  const titre = p.statut === 'a-financer' ? 'Partenaires' : 'Financé par';
  if (!p.partenaires.length) {
    return `<p class="partenaires-titre">${titre}</p><p class="small muted">Aucun pour l’instant. Soyez le premier.</p>`;
  }
  const items = p.partenaires.map((x) => x.logo
    ? `<li><img src="/assets/img/partenaires/${esc(x.logo)}" alt="${esc(x.nom)}"></li>`
    : `<li>${esc(x.nom)}</li>`).join('');
  return `<p class="partenaires-titre">${titre}</p><ul class="partenaires">${items}</ul>`;
}

const RECONNAISSANCE = {
  commandite: '<strong>Votre logo sur le camion.</strong> C’est une commandite : elle ne donne pas de reçu officiel de don, et se déduit généralement comme une dépense de publicité. Un don avec reçu reste possible; votre nom figure alors parmi les partenaires.',
  don: '<strong>Un reçu officiel pour fins d’impôt</strong> pour le montant total, et votre nom parmi les donateurs du projet.',
};

// ---- La carte, sur la page /projets ----------------------------------------------
export function carteHTML(p) {
  const ouvert = p.statut === 'a-financer';
  const art = p.illustration === 'camion' ? `<div class="projet-art">${camionSVG('/assets/img/logo-header.svg')}</div>` : '';
  const boutons = [
    ouvert ? `<a class="btn btn-primary" href="${esc(mailto('Financer un projet : ' + p.titre))}">Financer ce projet</a>` : '',
    `<a class="btn btn-secondary" href="/assets/fiches/${p.slug}.pdf">${ouvert ? 'Télécharger la fiche' : 'Voir la fiche'} (PDF)</a>`,
  ].join('');
  return `<article class="projet reveal" id="${p.slug}">
      <div class="projet-main">
        <span class="statut statut--${p.statut}">${STATUTS[p.statut]}</span>
        <h3>${esc(p.titre)}</h3>
        <p class="projet-accroche">${esc(p.accroche)}</p>
        ${art}
        ${p.pourquoi.map((x) => `<p>${esc(x)}</p>`).join('')}
        ${p.offre ? `<p>${esc(p.offre)}</p>` : ''}
        ${tableBudget(p)}
      </div>
      <aside class="projet-side">
        ${avancement(p)}
        ${partenaires(p)}
        ${ouvert ? `<p class="small reconnaissance">${RECONNAISSANCE[p.reconnaissance]}</p>` : ''}
        <div class="btn-col">${boutons}</div>
      </aside>
    </article>`;
}

// ---- La fiche, une page Lettre à remettre en main propre ------------------------
export function ficheHTML(p) {
  const b64 = (rel) => fs.readFileSync(path.join(ROOT, rel)).toString('base64');
  const logo = 'data:image/svg+xml;base64,' + b64('src/assets/img/logo-header.svg');
  const art = p.illustration === 'camion' ? `<div class="art">${camionSVG(logo)}</div>` : '';
  const ouvert = p.statut === 'a-financer';
  return `<!doctype html><html lang="fr-CA"><meta charset="utf-8"><title>${esc(p.titre)}</title>
<style>
  @font-face { font-family: "Source Serif 4"; font-weight: 400 700; src: url(data:font/woff2;base64,${b64('src/assets/fonts/SourceSerif4-normal-400-700.woff2')}) format("woff2"); }
  @font-face { font-family: "Source Sans 3"; font-weight: 400 700; src: url(data:font/woff2;base64,${b64('src/assets/fonts/SourceSans3-normal-400-700.woff2')}) format("woff2"); }
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { width: 8.5in; height: 11in; padding: .6in .7in .5in; font: 10.5pt/1.45 "Source Sans 3", sans-serif; color: #141413; background: #FFFFFF; display: flex; flex-direction: column; }
  header { display: flex; justify-content: space-between; align-items: center; padding-bottom: .22in; border-bottom: 1.5pt solid #DA7757; }
  header img { height: .52in; }
  .statut { font-size: 8.5pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #B4573A; }
  h1 { font: 500 25pt/1.1 "Source Serif 4", Georgia, serif; letter-spacing: -.01em; margin: .3in 0 .1in; }
  .accroche { font-size: 12.5pt; color: #55534E; margin-bottom: .16in; }
  p + p { margin-top: .09in; }
  .art { margin: .12in 0 .1in; } .art svg { width: 54%; display: block; }
  h2 { font-size: 8.5pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #B4573A; margin: .24in 0 .08in; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 6pt 0; border-bottom: .75pt solid #E8E6DF; text-align: left; vertical-align: top; }
  .groupe th { padding-top: 10pt; font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: #85837C; }
  .note { display: block; font-size: 9pt; color: #85837C; }
  .montant { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .etat-cell { text-align: right; padding-right: 10pt; }
  .pastille { font-size: 8pt; font-weight: 600; color: #55534E; }
  tfoot th, tfoot td { border-bottom: 0; border-top: 1.5pt solid #141413; font-weight: 700; font-size: 11.5pt; }
  .encadre { display: flex; gap: .3in; margin-top: .2in; padding: .16in .2in; background: #FBF3EE; border-radius: 8pt; }
  .encadre div { flex: 1; } .encadre strong { display: block; font: 500 15pt/1.2 "Source Serif 4", serif; }
  .encadre span { font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: #85837C; }
  footer { margin-top: auto; padding-top: .16in; border-top: .75pt solid #E8E6DF; font-size: 8.5pt; color: #55534E; display: flex; justify-content: space-between; gap: .3in; }
  footer strong { color: #141413; }
</style>
<header><img src="${logo}" alt="Centre Espoir de Gatineau"><span class="statut">${STATUTS[p.statut]}</span></header>
<h1>${esc(p.titre)}</h1>
<p class="accroche">${esc(p.accroche)}</p>
${art}
${p.pourquoi.map((x) => `<p>${esc(x)}</p>`).join('')}
${p.offre ? `<p>${esc(p.offre)}</p>` : ''}
<h2>Budget</h2>
${tableBudget(p)}
${p.objectif != null ? `<div class="encadre">
  <div><span>Coût du projet</span><strong>${argent(p.objectif)}</strong></div>
  <div><span>${ouvert ? 'Déjà réuni' : 'Financé'}</span><strong>${argent(p.reuni)}</strong></div>
  ${p.reste > 0 ? `<div><span>Reste à réunir</span><strong>${argent(p.reste)}</strong></div>` : ''}
</div>` : ''}
${ouvert ? `<h2>Votre contribution</h2><p>${RECONNAISSANCE[p.reconnaissance]}</p>` : ''}
${p.partenaires.length ? `<h2>${ouvert ? 'Partenaires' : 'Financé par'}</h2><p>${p.partenaires.map((x) => esc(x.nom)).join(', ')}</p>` : ''}
<footer>
  <div><strong>David Hatin</strong>, directeur général<br>direction@centreespoir.ca · 819‑663‑3238</div>
  <div style="text-align:right">Centre Espoir de Gatineau · 791, boulevard Maloney Est, Gatineau<br>Organisme de bienfaisance enregistré, n<sup>o</sup> 848106365RR0001 · centreespoir.ca/projets</div>
</footer>
</html>`;
}
