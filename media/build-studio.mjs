// Fabrique media/studio.html à partir de studio.template.html, en y incrustant
// les polices, les illustrations et les logos sous forme de données. Le fichier
// obtenu s'ouvre d'un double-clic, sans Internet, sans serveur et sans rien
// installer : c'est la seule façon qu'un outil comme celui-là serve vraiment.
//
//   node media/build-studio.mjs
//
// À refaire quand une illustration, une police ou le logo change.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'src', 'assets');

// Les illustrations retenues, et le mot qui les décrit dans la liste déroulante.
// Choisies pour couvrir ce dont une communication a besoin : quelqu'un qui donne,
// qui reçoit, qui range, qui accueille. Les plus lourdes sont écartées.
const ILLUSTRATIONS = [
  ['loving', 'Personne qui tient son cœur'],
  ['coffee', 'Personne avec une grande tasse'],
  ['unboxing', 'Personne dans une boîte'],
  ['chilling', 'Personne assise, détendue'],
  ['sitting-reading', 'Personne assise qui lit'],
  ['reading-side', 'Personne qui lit, de côté'],
  ['peep-standing-30', 'Homme âgé debout'],
  ['peep-standing-5', 'Femme debout, foulard'],
  ['peep-standing-25', 'Personne debout, cheveux afro'],
  ['peep-standing-16', 'Femme qui pointe du doigt'],
  ['peep-standing-17', 'Femme âgée qui pointe du doigt'],
  ['peep-standing-26', 'Personne debout, de profil'],
  ['peep-sitting-17', 'Personne assise, jambes croisées'],
];

// Allège un SVG pour l'incrustation : les coordonnées d'Illustrator et de Sketch
// portent six décimales, ce qui ne se voit à aucune taille et pèse le double.
function alleger(svg) {
  return svg
    .replace(/(-?\d+\.\d{3,})/g, (m) => String(Math.round(parseFloat(m) * 10) / 10))
    .replace(/\s+/g, ' ')
    .trim();
}

const svgData = (p, transformer = (s) => s) =>
  'data:image/svg+xml;base64,' + Buffer.from(transformer(alleger(fs.readFileSync(p, 'utf8'))), 'utf8').toString('base64');

// ---- Les polices ----------------------------------------------------------
const police = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ASSETS, 'fonts', f)).toString('base64');
const polices = {
  serif: { famille: 'Source Serif 4', graisse: '400 700', data: police('SourceSerif4-normal-400-700.woff2') },
  sans: { famille: 'Source Sans 3', graisse: '400 700', data: police('SourceSans3-normal-400-700.woff2') },
};

// La même déclaration sert à la page de l'atelier elle-même.
const fontface = Object.values(polices).map((p) =>
  `@font-face{font-family:"${p.famille}";font-weight:${p.graisse};font-display:swap;src:url(${p.data}) format("woff2");}`).join('\n  ');

// ---- Les illustrations ----------------------------------------------------
const illustrations = {};
// Chaque illustration existe en deux versions : à l'encre pour les fonds clairs,
// et une version pour les fonds foncés. Le terracotta, lui, ne change jamais :
// c'est la couleur de la marque.
//
// Attention : remplacer seulement l'encre par la crème suffit pour un dessin
// d'Open Doodles, mais transforme une figure d'Open Peeps en silhouette blanche,
// parce que ses vêtements sont remplis de blanc. Il faut alors échanger les deux,
// l'encre ET le blanc, ce qui redonne un dessin au trait clair sur fond foncé.
const eclaircir = (s) => s.includes('#FFFFFF') || s.includes('#ffffff')
  ? s.replace(/#141413/gi, '@@I@@').replace(/#FFFFFF/gi, '#141413').replace(/@@I@@/g, '#FAF9F5')
  : s.replace(/#141413/gi, '#FAF9F5');
for (const [cle, nom] of ILLUSTRATIONS) {
  const p = path.join(ASSETS, 'img', 'illustrations', `${cle}.svg`);
  if (!fs.existsSync(p)) throw new Error(`illustration absente : ${cle}.svg`);
  illustrations[cle] = { nom, data: svgData(p), clair: svgData(p, eclaircir) };
}

// ---- Les logos, en deux versions ------------------------------------------
// Sur un fond foncé, l'encre du logo disparaîtrait : on la remplace par du
// blanc. Le terracotta, lui, ne bouge jamais.
const blanchir = (s) => s.replace(/#141413/gi, '#FFFFFF');
const logos = {};
for (const [cle, fichier] of [['horizontal', 'logo-horizontal.svg'], ['vertical', 'logo-vertical.svg']]) {
  const p = path.join(ASSETS, 'img', fichier);
  logos[`${cle}-couleur`] = svgData(p);
  logos[`${cle}-blanc`] = svgData(p, blanchir);
}

// ---- Assemblage -----------------------------------------------------------
const gabarit = fs.readFileSync(path.join(ROOT, 'media', 'studio.template.html'), 'utf8');
const sortie = gabarit
  .replace('__FONTFACE__', fontface)
  .replace('__ASSETS__', JSON.stringify({ polices, illustrations, logos }));

const cible = path.join(ROOT, 'media', 'studio.html');
fs.writeFileSync(cible, sortie);
console.log(`studio.html écrit : ${(sortie.length / 1024 / 1024).toFixed(2)} Mo, ${Object.keys(illustrations).length} illustrations`);
