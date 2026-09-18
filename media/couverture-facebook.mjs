// La bannière de page Facebook du Centre Espoir, et les deux simulations qui
// permettent de la juger avant de la téléverser.
//
//   node media/couverture-facebook.mjs
//
// Écrit dans media/exemples/ :
//   couverture-facebook.png              le fichier à téléverser, 1640 x 924
//   couverture-facebook-telephone.png    ce qu'un téléphone en montre
//   couverture-facebook-ordinateur.png   ce qu'un ordinateur en montre
//
// ---------------------------------------------------------------------------
// LA GÉOMÉTRIE, ET POURQUOI ELLE EST ÉCRITE ICI
//
// Elle a été fausse quatre fois le 18 septembre 2026. Ni les tailles publiées en
// ligne (« 820 x 312 », périmées depuis 2023), ni la mesure faite sur la page
// affichée dans un navigateur d'ordinateur ne donnent la bonne réponse. La seule
// méthode qui a fonctionné :
//
//   1. téléverser un fichier dont on connaît exactement la géométrie ;
//   2. demander à David une capture d'écran de la page dans l'application ;
//   3. résoudre la correspondance entre les pixels du fichier et ceux de l'écran.
//
// Ce que cela a donné, pour un fichier de 1640 x 924 :
//
//   • ORDINATEUR : l'image entière, en 16:9. L'avatar est en bas à gauche.
//   • TÉLÉPHONE  : presque toute l'image aussi, légèrement agrandie pour
//     remplir, ce qui rogne environ 4 % de chaque côté. Ce n'est PAS une bande
//     étroite prise au milieu. Par-dessus viennent deux choses :
//       – les commandes de l'application (retour, partage, recherche, menu)
//         flottent sur les 222 premiers pixels ;
//       – l'avatar est un cercle CENTRÉ de 44 % de la largeur, cercle blanc
//         compris, dont le bord supérieur tombe à y 420.
//
// Il ne reste donc qu'une bande d'environ 170 px, entre y 240 et y 412, pour
// tout ce qui doit se lire. Cela tient : un surtitre, un titre SUR UNE SEULE
// LIGNE, et une ligne de sous-titre. Pas de pastille d'heures. Les
// illustrations descendent plus bas, de part et d'autre du cercle.
//
// Et pas de logo : l'avatar de la page le montre déjà.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'media', 'exemples');

// ---- Ce qu'il y a sur la bannière -----------------------------------------
// Le contenu approuvé par David le 18 septembre 2026. Changez ce bloc, relancez.
const COUVERTURE = {
  theme: 'encre',                  // 'creme' | 'encre' | 'terracotta'
  surtitre: 'Banque alimentaire du quartier Notre\u2011Dame, Gatineau',
  titre: 'Nourrir le corps, ce n\u2019est que la moiti\u00e9 du travail.',
  soustitre: 'Plus de 250 familles aid\u00e9es chaque mois, depuis 1984.',
  gauche: ['unboxing'],                                             // une figure
  droite: ['peep-standing-30', 'peep-standing-5', 'peep-standing-25'], // un trio
};

// ---- La géométrie mesurée --------------------------------------------------
const W = 1640, H = 924;
const ROGNAGE = Math.round(W * 0.04);   // ce que le téléphone coupe de chaque côté
const NAV_BAS = 222;                    // les commandes de l'application par-dessus
const AV_D = Math.round(W * 0.44);      // l'avatar, cercle blanc compris
const AV_HAUT = 420;
const TEXTE_HAUT = 240, TEXTE_BAS = 412;

const THEMES = {
  creme:      { fond: '#FAF9F5', titre: '#141413', soustitre: '#55534E', surtitre: '#B4573A',
                trait: '#DA7757', halo: 'rgba(218,119,87,.16)', fonce: false },
  encre:      { fond: '#141413', titre: '#FFFFFF', soustitre: '#C9C6BC', surtitre: '#F2B79F',
                trait: '#F2B79F', halo: 'rgba(218,119,87,.34)', fonce: true },
  terracotta: { fond: '#DA7757', titre: '#FFFFFF', soustitre: '#FBE7DE', surtitre: '#FBE7DE',
                trait: '#FBE7DE', halo: 'rgba(255,255,255,.18)', fonce: true },
};

const CREME = '#FAF9F5';
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const svgUri = (s) => 'data:image/svg+xml;base64,' + Buffer.from(s, 'utf8').toString('base64');
const illustration = (n) => lire(`src/assets/img/illustrations/${n}.svg`);

// Sur fond foncé, le traitement dépend de la collection. Une figure d'Open Peeps
// a ses vêtements remplis de blanc : on garde son dessin à l'encre, on éclaircit
// les vêtements, et on la cerne d'un contour crème, sans quoi ses cheveux et ses
// pantalons foncés se perdent dans le fond. Un dessin d'Open Doodles n'a pas
// d'aplat blanc : son encre devient crème, et il n'a pas besoin de contour.
const aDesAplatsBlancs = (svg) => /#FFFFFF/i.test(svg);
function pourFondFonce(svg) {
  return aDesAplatsBlancs(svg)
    ? svg.replace(/#FFFFFF/gi, CREME).replace(/#4F66AF/gi, '#141413')
    : svg.replace(/#141413/gi, CREME);
}
// Huit ombres portées sans flou : un contour qui suit tout ce qui est opaque,
// cheveux compris. 1,5 px pour une figure de 110 px, soit 1,36 % de sa largeur.
function contourCreme(largeurFigure) {
  const px = Math.max(1, largeurFigure * 0.0136);
  return Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 8;
    return `drop-shadow(${(Math.cos(a) * px).toFixed(2)}px ${(Math.sin(a) * px).toFixed(2)}px 0 ${CREME})`;
  }).join(' ');
}

function groupe(noms, t, largeurTotale) {
  const largeurFigure = largeurTotale / noms.length;
  return noms.map((n) => {
    const brut = illustration(n);
    const svg = t.fonce ? pourFondFonce(brut) : brut;
    const cerner = t.fonce && aDesAplatsBlancs(brut);
    const f = cerner ? `filter:${contourCreme(largeurFigure)};` : '';
    return `<img style="width:${(100 / noms.length).toFixed(2)}%;${f}" src="${svgUri(svg)}">`;
  }).join('');
}

function banniere(c) {
  const t = THEMES[c.theme];
  if (!t) throw new Error(`thème inconnu : ${c.theme}`);
  const serif = fs.readFileSync(path.join(ROOT, 'src/assets/fonts/SourceSerif4-normal-400-700.woff2')).toString('base64');
  const sans = fs.readFileSync(path.join(ROOT, 'src/assets/fonts/SourceSans3-normal-400-700.woff2')).toString('base64');
  return `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: "Source Serif 4"; font-weight: 400 700; src: url(data:font/woff2;base64,${serif}) format("woff2"); }
  @font-face { font-family: "Source Sans 3"; font-weight: 400 700; src: url(data:font/woff2;base64,${sans}) format("woff2"); }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body { background: ${t.fond}; color: ${t.titre}; font-family: "Source Sans 3", sans-serif; position: relative; }
  .halo { position: absolute; left: 50%; top: ${(TEXTE_HAUT + TEXTE_BAS) / 2}px; transform: translate(-50%, -50%);
          width: 1500px; height: 620px; border-radius: 50%;
          background: radial-gradient(ellipse, ${t.halo} 0%, rgba(0,0,0,0) 68%); }
  .texte { position: absolute; left: 50%; transform: translateX(-50%); top: ${TEXTE_HAUT}px;
           height: ${TEXTE_BAS - TEXTE_HAUT}px; width: 1240px; text-align: center;
           display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .surtitre { display: inline-flex; align-items: center; gap: 15px; font-size: 20px; font-weight: 600;
              letter-spacing: .15em; text-transform: uppercase; color: ${t.surtitre}; }
  .surtitre::before, .surtitre::after { content: ""; width: 36px; height: 3px; background: ${t.trait}; border-radius: 2px; }
  h1 { font-family: "Source Serif 4", Georgia, serif; font-weight: 500; font-size: 46px; line-height: 1.1;
       letter-spacing: -.02em; margin: 16px 0 10px; white-space: nowrap; }
  p { font-size: 23px; line-height: 1.35; color: ${t.soustitre}; }
  .art { position: absolute; display: flex; align-items: flex-end; }
  .gauche { left: 150px;  top: 448px; width: 268px; }
  .droite { right: 128px; top: 428px; width: 330px; gap: 8px; }
</style>
<div class="halo"></div>
<div class="art gauche">${groupe(c.gauche, t, 268)}</div>
<div class="art droite">${groupe(c.droite, t, 330)}</div>
<div class="texte">
  <div class="surtitre">${c.surtitre}</div>
  <h1>${c.titre}</h1>
  <p>${c.soustitre}</p>
</div>`;
}

// ---- Chrome, sans tête -----------------------------------------------------
const navigateurs = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter((p) => fs.existsSync(p));
if (!navigateurs.length) throw new Error('ni Chrome ni Edge sur cette machine');

function capturer(html, sortie, w, h) {
  const tmp = path.join(os.tmpdir(), `couv-${process.pid}-${path.basename(sortie)}.html`);
  fs.writeFileSync(tmp, html);
  for (const navigateur of navigateurs) {
    try { fs.unlinkSync(sortie); } catch {}
    execFileSync(navigateur, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
      '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--virtual-time-budget=6000',
      `--screenshot=${sortie}`, 'file:///' + tmp.replace(/\\/g, '/')], { stdio: 'ignore' });
    if (fs.existsSync(sortie) && fs.statSync(sortie).size > 0) {
      fs.unlinkSync(tmp);
      console.log(`\u00e9crit ${path.relative(ROOT, sortie)}`);
      return;
    }
  }
  throw new Error(`aucun navigateur n'a produit ${sortie}`);
}

// ---- Les deux simulations : c'est elles qu'il faut regarder ----------------
// Une bannière à plat a l'air correcte à chaque fois. Ce sont ces deux images
// qui disent la vérité, et c'est elles qu'il faut montrer à David.
const icone = lire('src/assets/img/icon.svg');

function simulationTelephone(html) {
  const interieur = W - ROGNAGE * 2;
  return `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;width:${interieur}px;height:${H}px;overflow:hidden;position:relative;background:#fff}
  .cadre{position:absolute;left:-${ROGNAGE}px;top:0;width:${W}px;height:${H}px}
  iframe{border:0;width:${W}px;height:${H}px}
  .voile{position:absolute;left:0;top:0;width:100%;height:${NAV_BAS}px;
         background:linear-gradient(to bottom, rgba(90,90,90,.5), rgba(90,90,90,0))}
  .cmd{position:absolute;color:#fff;font:600 44px/1 sans-serif;top:96px}
  .avatar{position:absolute;left:50%;top:${AV_HAUT}px;transform:translateX(-50%);
          width:${AV_D}px;height:${AV_D}px;border-radius:50%;background:#DA7757;
          border:20px solid #fff;display:grid;place-items:center;overflow:hidden}
  .avatar img{width:102%}
</style>
<div class="cadre"><iframe srcdoc="${html.replace(/"/g, '&quot;')}"></iframe></div>
<div class="voile"></div>
<div class="cmd" style="left:40px">&#8249;</div>
<div class="cmd" style="right:340px">&#10148;</div>
<div class="cmd" style="right:200px">&#9906;</div>
<div class="cmd" style="right:60px">&#8943;</div>
<div class="avatar"><img src="${svgUri(icone)}"></div>`;
}

function simulationOrdinateur(html) {
  const d = Math.round(W * 0.21);
  return `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;position:relative;background:#fff}
  iframe{border:0;width:${W}px;height:${H}px;position:absolute;left:0;top:0}
</style><iframe srcdoc="${html.replace(/"/g, '&quot;')}"></iframe>
<div style="position:absolute;left:${Math.round(W * 0.045)}px;top:${H - Math.round(d * 0.62)}px;
     width:${d}px;height:${d}px;border-radius:50%;background:#DA7757;border:12px solid #fff;
     display:grid;place-items:center;overflow:hidden"><img src="${svgUri(icone)}" style="width:102%"></div>`;
}

// ---- Allons-y ---------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });
const html = banniere(COUVERTURE);
capturer(html, path.join(OUT, 'couverture-facebook.png'), W, H);
capturer(simulationTelephone(html), path.join(OUT, 'couverture-facebook-telephone.png'), W - ROGNAGE * 2, H);
capturer(simulationOrdinateur(html), path.join(OUT, 'couverture-facebook-ordinateur.png'), W, H);
console.log(`\ntexte entre y ${TEXTE_HAUT} et ${TEXTE_BAS} | commandes jusqu'\u00e0 y ${NAV_BAS} | avatar \u00d8 ${AV_D} \u00e0 partir de y ${AV_HAUT} | rognage lat\u00e9ral ${ROGNAGE} px`);
console.log('Regardez la simulation t\u00e9l\u00e9phone avant de livrer quoi que ce soit.');
