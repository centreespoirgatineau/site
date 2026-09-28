// Les projets à financer : chargés depuis src/projets/, un fichier par projet,
// puis rendus deux fois à partir de la même source : la carte de la page
// /projets et la fiche PDF qu'on remet à une entreprise. Comme les deux sortent
// d'ici, elles ne peuvent pas se contredire.
//
// Ajouter un projet : copier un fichier de src/projets/, le modifier, puis
//   node build/make-fiches.mjs     (redessine les PDF)
//   node build/build.mjs
// Ajouter un partenaire : une ligne dans `partenaires` du projet (et son logo
// dans src/assets/img/partenaires/ pour une commandite), le montant dans
// `financement`, puis la même chose.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'src', 'projets');

export const STATUTS = { 'a-financer': 'À financer', 'en-cours': 'En cours', 'realise': 'Réalisé' };
export const ETATS = { 'fait': 'Réalisé', 'commande': 'Commandé', 'en-attente': 'En attente', 'a-venir': 'À venir' };
export const CATEGORIES = { 'denrees': 'Denrées pour les paniers', 'visibilite': 'Visibilité du Centre', 'equipement': 'Équipement' };

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
const somme = (xs) => xs.reduce((s, x) => s + cents(x), 0) / 100;

export async function chargerProjets() {
  const fichiers = fs.readdirSync(DIR).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));
  const projets = [];
  for (const f of fichiers) {
    const p = { ...(await import(pathToFileURL(path.join(DIR, f)).href)).default, slug: f.replace(/\.mjs$/, '') };
    const postes = p.budget ? p.budget.flatMap((g) => g.postes) : [];
    p.objectif = p.budget ? somme(postes.map((x) => x.montant)) : null;
    p.reuni = somme((p.financement ?? []).map((x) => x.montant));
    p.reste = p.objectif == null ? null : Math.max(0, cents(p.objectif) - cents(p.reuni)) / 100;
    // La répartition par catégorie, seulement quand il y en a plusieurs.
    const cats = {};
    for (const x of postes) if (x.categorie) cats[x.categorie] = (cats[x.categorie] ?? 0) + cents(x.montant);
    p.repartition = Object.keys(cats).length > 1
      ? Object.entries(cats).map(([c, v]) => ({ categorie: c, montant: v / 100, pct: (100 * v) / cents(p.objectif) }))
          .sort((a, b) => b.montant - a.montant)
      : null;
    // Les places de commandite encore libres, palier par palier.
    for (const o of p.offres ?? []) o.prises = p.partenaires.filter((x) => x.palier === o.id).length;
    projets.push(p);
  }
  return projets.sort((a, b) => a.ordre - b.ordre);
}

// L'empreinte d'une fiche : si le projet ou la mise en page change, elle change,
// et le test signale une fiche PDF à redessiner.
export const empreinte = (html) => crypto.createHash('sha256').update(html).digest('hex').slice(0, 16);

const mailto = (sujet) => 'mailto:direction@centreespoir.ca?subject=' + encodeURIComponent(sujet);

// ---- Les dessins ------------------------------------------------------------------
// Des dessins au trait de ce qu'on finance réellement, dans le style du site :
// l'encre #141413, la crème, le terracotta. Pas d'illustration d'ambiance.
//
// Le camion montre la place de chaque partenaire, palier par palier : une grande
// case pour le partenaire principal, six pour les partenaires. Une case prend le
// logo du partenaire dès qu'il y en a un (voir `partenaires`).
export function camionSVG(logoHref, logoDe = () => null, partenaires = []) {
  const occupant = (palier, i) => partenaires.filter((x) => x.palier === palier && x.logo)[i];
  const cadre = (x, y, w, h, etiquette, qui) => {
    const src = qui && logoDe(qui.logo);
    return src
      ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#FFFFFF" stroke="#D9D6CD" stroke-width="1.5"/><image href="${src}" x="${x + 6}" y="${y + 5}" width="${w - 12}" height="${h - 10}"/>`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#FBF3EE" stroke="#DA7757" stroke-width="2" stroke-dasharray="6 5"/>`
        + `<text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-family="'Source Sans 3', 'Segoe UI', Arial, sans-serif" font-size="15" font-weight="600" fill="#B4573A">${etiquette}</text>`;
  };
  const cases = [cadre(284, 56, 138, 54, 'Principal', occupant('principal', 0))];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    cases.push(cadre(62 + c * 123, 128 + r * 52, 112, 42, 'Partenaire', occupant('partenaire', r * 3 + c)));
  }
  return `<svg class="dessin" viewBox="0 0 640 292" role="img" aria-label="Le camion réfrigéré : le logo du Centre, la place du partenaire principal et celles des six partenaires" xmlns="http://www.w3.org/2000/svg">
  <line x1="12" y1="278" x2="628" y2="278" stroke="#D9D6CD" stroke-width="3" stroke-linecap="round"/>
  <rect x="40" y="36" width="400" height="196" rx="10" fill="#FFFFFF" stroke="#141413" stroke-width="3.5"/>
  <image href="${logoHref}" x="60" y="60" width="200" height="46"/>
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

// Le nouveau local : l'enseigne du Centre, un auvent terracotta, l'entrepôt
// derrière la vitrine de gauche et l'espace café derrière celle de droite.
export function batimentSVG(logoHref) {
  return `<svg class="dessin" viewBox="0 0 640 292" role="img" aria-label="Le nouveau local : l’enseigne du Centre, l’entrepôt à gauche, l’espace café à droite" xmlns="http://www.w3.org/2000/svg">
  <line x1="12" y1="278" x2="628" y2="278" stroke="#D9D6CD" stroke-width="3" stroke-linecap="round"/>
  <rect x="90" y="30" width="460" height="248" rx="6" fill="#FFFFFF" stroke="#141413" stroke-width="3.5"/>
  <path d="M90 50H550" stroke="#141413" stroke-width="2.5"/>
  <rect x="150" y="64" width="340" height="60" rx="8" fill="#FFFFFF" stroke="#141413" stroke-width="3"/>
  <image href="${logoHref}" x="222" y="72" width="196" height="45"/>
  <path d="M110 142H530V160H110Z" fill="#DA7757" stroke="#141413" stroke-width="3" stroke-linejoin="round"/>
  <path d="M110 160q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0q17.5 16 35 0" fill="#DA7757" stroke="#141413" stroke-width="3" stroke-linejoin="round"/>
  <rect x="122" y="186" width="132" height="70" rx="4" fill="#F3F1EA" stroke="#141413" stroke-width="3"/>
  <path d="M130 212H246M130 238H246" stroke="#141413" stroke-width="2.5"/>
  <rect x="138" y="196" width="22" height="16" fill="#FFFFFF" stroke="#141413" stroke-width="2"/><rect x="166" y="200" width="18" height="12" fill="#DA7757" stroke="#141413" stroke-width="2"/><rect x="198" y="194" width="26" height="18" fill="#FFFFFF" stroke="#141413" stroke-width="2"/>
  <rect x="142" y="220" width="30" height="18" fill="#DA7757" stroke="#141413" stroke-width="2"/><rect x="180" y="224" width="20" height="14" fill="#FFFFFF" stroke="#141413" stroke-width="2"/><rect x="208" y="222" width="24" height="16" fill="#FFFFFF" stroke="#141413" stroke-width="2"/>
  <rect x="282" y="180" width="76" height="98" rx="4" fill="#F3F1EA" stroke="#141413" stroke-width="3"/>
  <path d="M320 180V278" stroke="#141413" stroke-width="2.5"/><circle cx="312" cy="232" r="3" fill="#141413"/><circle cx="328" cy="232" r="3" fill="#141413"/>
  <rect x="386" y="186" width="132" height="70" rx="4" fill="#F3F1EA" stroke="#141413" stroke-width="3"/>
  <path d="M416 234H488M452 234V252M436 252H468" stroke="#141413" stroke-width="3" stroke-linecap="round"/>
  <path d="M424 226h14v8h-14zM466 226h14v8h-14z" fill="#FFFFFF" stroke="#141413" stroke-width="2"/>
  <path d="M430 220q3-6 0-10M472 220q3-6 0-10" stroke="#85837C" stroke-width="2" fill="none" stroke-linecap="round"/>
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

const pct = (x) => `${Math.round(x)} %`;
function repartition(p) {
  if (!p.repartition) return '';
  const barre = p.repartition.map((r) => `<span class="rep-${r.categorie}" style="width:${r.pct.toFixed(2)}%"></span>`).join('');
  const lignes = p.repartition.map((r) => `<li><i class="rep-${r.categorie}"></i><strong>${pct(r.pct)}</strong><span>${CATEGORIES[r.categorie]}</span><em>${argent(r.montant)}</em></li>`).join('');
  return `<div class="repartition">
        <p class="bloc-titre">Où va l’argent</p>
        <div class="rep-barre" role="img" aria-label="${p.repartition.map((r) => `${pct(r.pct)} ${CATEGORIES[r.categorie]}`).join(', ')}">${barre}</div>
        <ul class="rep-legende">${lignes}</ul>
      </div>`;
}

// Le bloc de chiffres en tête de carte : ce qu'il reste à réunir, en grand.
function chiffres(p) {
  const ouvert = p.statut === 'a-financer';
  if (p.objectif == null) {
    return `<p class="grand grand--texte">Budget à établir</p><p class="sous">avec vous, selon la forme d’aide</p>`;
  }
  const part = Math.min(100, (100 * p.reuni) / p.objectif);
  if (!ouvert) {
    const qui = p.financement.map((x) => esc(x.source)).join(', ');
    return `<p class="grand">${argent(p.objectif)}</p><p class="sous">financé par ${qui}${p.duree ? `, ${esc(p.duree)}` : ''}</p>
        <div class="barre barre--plein"><span style="width:100%"></span></div>`;
  }
  const acquis = p.financement.map((x) => `${argent(x.montant)} déjà engagés par ${esc(x.source.replace(/^Le /, 'le '))}`).join('<br>');
  return `<p class="grand">${argent(p.reste)}</p><p class="sous">à réunir, sur ${argent(p.objectif)}</p>
        <div class="barre" role="img" aria-label="${Math.round(part)} % déjà réuni"><span style="width:${part.toFixed(1)}%"></span></div>
        ${acquis ? `<p class="acquis">${acquis}</p>` : ''}`;
}

const NOTE_COMMANDITE = 'Ces places sont des commandites : la visibilité est de la publicité, elles ne donnent donc pas de reçu officiel et se déduisent généralement comme une dépense d’entreprise. Vous préférez un reçu? Un don de tout montant reste possible, et votre nom figure parmi les donateurs.';

function paliers(p) {
  if (!p.offres) return '';
  const blocs = p.offres.map((o) => {
    const libres = o.places - o.prises;
    return `<div class="palier">
          <div class="palier-tete"><strong>${esc(o.nom)}</strong><span>${argent(o.montant)}</span></div>
          <p class="palier-places">${o.places === 1 ? 'Une seule place' : `${o.places} places`}${libres < o.places ? ` · ${libres === 0 ? 'complet' : `${libres} encore libre${libres > 1 ? 's' : ''}`}` : ''}</p>
          <ul class="checks">${o.avantages.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        </div>`;
  }).join('');
  return `<p class="bloc-titre">Ce que vous recevez</p>${blocs}<p class="small note-offre">${NOTE_COMMANDITE}</p>`;
}

function aides(p) {
  if (!p.aides) return '';
  return `<p class="bloc-titre">Comment aider</p>
        <ul class="aides">${p.aides.map((a) => `<li><strong>${esc(a.titre)}</strong><span>${esc(a.texte)}</span></li>`).join('')}</ul>
        ${p.noteAides ? `<p class="small note-offre">${esc(p.noteAides)}</p>` : ''}`;
}

function listePartenaires(p) {
  if (!p.partenaires.length) return '';
  const items = p.partenaires.map((x) => x.logo
    ? `<li><img src="/assets/img/partenaires/${esc(x.logo)}" alt="${esc(x.nom)}"></li>`
    : `<li>${esc(x.nom)}</li>`).join('');
  return `<p class="bloc-titre">${p.statut === 'a-financer' ? 'Partenaires' : 'Financé par'}</p><ul class="partenaires">${items}</ul>`;
}

function dessin(p, logo, logoDe) {
  if (p.illustration === 'camion') return camionSVG(logo, logoDe, p.partenaires);
  if (p.illustration === 'batiment') return batimentSVG(logo);
  return '';
}

// ---- L'aperçu du haut de page -------------------------------------------------------
export function apercuHTML(projets) {
  const ligne = (p) => {
    const quoi = p.statut !== 'a-financer' ? 'Financé' : p.objectif == null ? 'Budget à établir' : `${argent(p.reste)} à réunir`;
    return `<li${p.statut !== 'a-financer' ? ' class="fait"' : ''}><a href="#${p.slug}"><span>${esc(p.court ?? p.titre)}</span><strong>${quoi}</strong></a></li>`;
  };
  const ouverts = projets.filter((p) => p.statut === 'a-financer');
  const faits = projets.filter((p) => p.statut !== 'a-financer');
  return [...ouverts.map(ligne), `<li><a href="#parrain"><span>Parrain du Centre</span><strong>À convenir</strong></a></li>`, ...faits.map(ligne)].join('\n            ');
}

// ---- La carte, sur la page /projets ----------------------------------------------
export function carteHTML(p) {
  const ouvert = p.statut === 'a-financer';
  const logoDe = (f) => `/assets/img/partenaires/${f}`;
  const art = dessin(p, '/assets/img/logo-header.svg', logoDe);
  const fiche = `<a class="lien-fiche" href="/assets/fiches/${p.slug}.pdf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>${ouvert ? 'Télécharger la fiche' : 'Voir la fiche'} (PDF)</a>`;
  const cote = [paliers(p), aides(p), repartition(p), listePartenaires(p)].filter(Boolean).join('\n        ');
  return `<article class="projet reveal" id="${p.slug}">
      <header class="projet-tete">
        <div class="projet-intro">
          <span class="statut statut--${p.statut}">${STATUTS[p.statut]}</span>
          <h3>${esc(p.titre)}</h3>
          <p class="projet-accroche">${esc(p.accroche)}</p>
        </div>
        <div class="projet-chiffres">
          ${chiffres(p)}
          ${ouvert ? `<a class="btn btn-primary" href="${esc(mailto(p.sujet ?? 'Financer un projet : ' + p.titre))}">${esc(p.bouton ?? 'Financer ce projet')}</a>` : ''}
          ${fiche}
        </div>
      </header>
      <div class="projet-corps">
        <div class="projet-recit">
          ${art ? `<div class="projet-art">${art}</div>` : ''}
          ${p.pourquoi.map((x) => `<p>${esc(x)}</p>`).join('\n          ')}
          ${p.budget ? `<p class="bloc-titre bloc-titre--budget">Budget détaillé</p>
          ${tableBudget(p)}` : ''}
        </div>
        <aside class="projet-cote">
        ${cote}
        </aside>
      </div>
    </article>`;
}

// ---- La fiche, une page Lettre à remettre en main propre ------------------------
export function ficheHTML(p) {
  const b64 = (rel) => fs.readFileSync(path.join(ROOT, rel)).toString('base64');
  const logo = 'data:image/svg+xml;base64,' + b64('src/assets/img/logo-header.svg');
  const logoDe = (f) => {
    const ext = path.extname(f).slice(1).toLowerCase();
    const type = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${type};base64,${b64('src/assets/img/partenaires/' + f)}`;
  };
  const art = dessin(p, logo, logoDe);
  const ouvert = p.statut === 'a-financer';
  const cadre = p.objectif == null ? '' : ouvert
    ? `<div class="encadre">
  <div><span>Coût du projet</span><strong>${argent(p.objectif)}</strong></div>
  <div><span>Déjà engagé</span><strong>${argent(p.reuni)}</strong></div>
  <div class="fort"><span>Reste à réunir</span><strong>${argent(p.reste)}</strong></div>
</div>`
    : `<div class="encadre">
  <div><span>Coût du projet</span><strong>${argent(p.objectif)}</strong></div>
  <div class="fort"><span>Financé par</span><strong>${p.financement.map((x) => esc(x.source)).join(', ')}</strong></div>
</div>`;
  const offre = p.offres
    ? `<h2>Ce que vous recevez</h2><div class="paliers">${p.offres.map((o) => `<div class="palier">
    <p class="palier-tete"><strong>${esc(o.nom)}</strong><span>${argent(o.montant)}</span></p>
    <p class="places">${o.places === 1 ? 'Une seule place' : `${o.places} places`}</p>
    <ul>${o.avantages.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>`).join('')}</div>
<p class="petit">${NOTE_COMMANDITE}</p>`
    : p.aides
      ? `<h2>Comment aider</h2><ul class="aides">${p.aides.map((a) => `<li><strong>${esc(a.titre)}</strong> ${esc(a.texte)}</li>`).join('')}</ul>${p.noteAides ? `<p class="petit">${esc(p.noteAides)}</p>` : ''}`
      : '';
  const rep = p.repartition
    ? `<h2>Où va l’argent</h2><div class="rep-barre">${p.repartition.map((r) => `<span class="rep-${r.categorie}" style="width:${r.pct.toFixed(2)}%"></span>`).join('')}</div>
<p class="rep-legende">${p.repartition.map((r) => `<span><i class="rep-${r.categorie}"></i><strong>${pct(r.pct)}</strong> ${CATEGORIES[r.categorie]}, ${argent(r.montant)}</span>`).join('')}</p>`
    : '';
  return `<!doctype html><html lang="fr-CA"><meta charset="utf-8"><title>${esc(p.titre)}</title>
<style>
  @font-face { font-family: "Source Serif 4"; font-weight: 400 700; src: url(data:font/woff2;base64,${b64('src/assets/fonts/SourceSerif4-normal-400-700.woff2')}) format("woff2"); }
  @font-face { font-family: "Source Sans 3"; font-weight: 400 700; src: url(data:font/woff2;base64,${b64('src/assets/fonts/SourceSans3-normal-400-700.woff2')}) format("woff2"); }
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { width: 8.5in; height: 11in; padding: .55in .7in .45in; font: 10pt/1.42 "Source Sans 3", sans-serif; color: #141413; background: #FFFFFF; display: flex; flex-direction: column; }
  header { display: flex; justify-content: space-between; align-items: center; padding-bottom: .18in; border-bottom: 1.5pt solid #DA7757; }
  header img { height: .5in; }
  .statut { font-size: 8pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #B4573A; background: #F8EDE6; padding: 4pt 9pt; border-radius: 99pt; }
  h1 { font: 500 24pt/1.1 "Source Serif 4", Georgia, serif; letter-spacing: -.01em; margin: .24in 0 .07in; }
  .accroche { font-size: 12pt; line-height: 1.4; color: #55534E; margin-bottom: .12in; }
  p + p { margin-top: .07in; }
  .art { margin: .06in 0 .1in; } .art svg { width: 48%; display: block; }
  h2 { font-size: 8pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #B4573A; margin: .18in 0 .07in; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 5pt 0; border-bottom: .75pt solid #E8E6DF; text-align: left; vertical-align: top; }
  .groupe th { padding-top: 8pt; font-size: 8pt; letter-spacing: .1em; text-transform: uppercase; color: #85837C; }
  .note { display: block; font-size: 8.5pt; color: #85837C; }
  .montant { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .etat-cell { text-align: right; padding-right: 10pt; }
  .pastille { font-size: 7.5pt; font-weight: 600; color: #55534E; }
  tfoot th, tfoot td { border-bottom: 0; border-top: 1.5pt solid #141413; font-weight: 700; font-size: 11pt; }
  .encadre { display: flex; gap: .25in; margin-top: .14in; padding: .13in .18in; background: #FBF3EE; border-radius: 8pt; }
  .encadre div { flex: 1; } .encadre strong { display: block; font: 500 14pt/1.2 "Source Serif 4", serif; }
  .encadre .fort strong { color: #B4573A; }
  .encadre span { font-size: 7.5pt; letter-spacing: .1em; text-transform: uppercase; color: #85837C; }
  .paliers { display: flex; gap: .16in; }
  .palier { flex: 1; border: .75pt solid #E8E6DF; border-radius: 8pt; padding: .1in .13in; }
  .palier-tete { display: flex; justify-content: space-between; font-size: 10.5pt; }
  .palier-tete span { font-weight: 700; color: #B4573A; }
  .places { font-size: 8pt; color: #85837C; margin: 1pt 0 3pt; }
  .palier ul, .aides { list-style: none; } .palier li, .aides li { padding-left: 11pt; position: relative; margin-top: 2pt; }
  .palier li::before, .aides li::before { content: ""; position: absolute; left: 0; top: .5em; width: 5pt; height: 5pt; border-radius: 50%; background: #DA7757; }
  .petit { font-size: 8.5pt; color: #55534E; margin-top: .08in; }
  .rep-barre { display: flex; height: 9pt; border-radius: 99pt; overflow: hidden; }
  .rep-denrees { background: #DA7757; } .rep-visibilite { background: #141413; } .rep-equipement { background: #85837C; }
  .rep-legende { display: flex; gap: .3in; margin-top: 5pt; font-size: 9pt; }
  .rep-legende i { display: inline-block; width: 7pt; height: 7pt; border-radius: 50%; margin-right: 4pt; vertical-align: 0; }
  footer { margin-top: auto; padding-top: .13in; border-top: .75pt solid #E8E6DF; font-size: 8pt; color: #55534E; display: flex; justify-content: space-between; gap: .3in; }
  footer strong { color: #141413; }
</style>
<header><img src="${logo}" alt="Centre Espoir de Gatineau"><span class="statut">${STATUTS[p.statut]}</span></header>
<h1>${esc(p.titre)}</h1>
<p class="accroche">${esc(p.accroche)}</p>
${art ? `<div class="art">${art}</div>` : ''}
${p.pourquoi.map((x) => `<p>${esc(x)}</p>`).join('')}
${rep}
${p.budget ? `<h2>Budget détaillé</h2>
${tableBudget(p)}` : `<h2>Budget</h2><p>À établir avec vous, selon la forme d’aide.</p>`}
${cadre}
${offre}
<footer>
  <div><strong>David Hatin</strong>, directeur général<br>direction@centreespoir.ca · 819‑663‑3238</div>
  <div style="text-align:right">Centre Espoir de Gatineau · 791, boulevard Maloney Est, Gatineau<br>Organisme de bienfaisance enregistré, n<sup>o</sup> 848106365RR0001 · centreespoir.ca/projets</div>
</footer>
</html>`;
}
