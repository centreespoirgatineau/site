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
//
// ---------------------------------------------------------------------------
// DEUX DISPOSITIONS
//
//   'foule' — celle qui est en ligne. Aucun texte : une rangée de personnages,
//     et c'est tout. David l'a choisie le 22 septembre 2026 parce que la place
//     et la taille de l'avatar CHANGENT d'un téléphone à l'autre ; un fichier
//     sans un seul mot ne peut pas se faire couper une phrase.
//   'texte' — un surtitre, un titre sur une ligne, un sous-titre, dans la bande
//     sûre. Elle reste ici : elle est juste, et elle resservira le jour où la
//     bannière devra dire quelque chose.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'media', 'exemples');

// ---- Ce qu'il y a sur la bannière -----------------------------------------
// Le contenu approuvé par David le 18 septembre 2026. Changez ce bloc, relancez.
const COUVERTURE = {
  disposition: 'foule',            // 'foule' (sans texte) | 'texte'
  theme: 'creme',                  // 'creme' | 'encre' | 'terracotta'

  // LA FOULE, de gauche à droite. Dix personnages choisis un par un pour être
  // visiblement différents : des âges, des origines, des silhouettes et des
  // genres qui ne se répètent pas. C'est la demande de David, et c'est aussi
  // ce qui distingue une image regardée par quelqu'un d'une image fabriquée en
  // série. Les deux afros (25 et 27) sont écartés l'un de l'autre, et aucune
  // des figures qui portent une prothèse (1, 2, 7, 8, 28, 29) n'y est.
  // L'ORDRE COMPTE. Sur un téléphone, l'avatar recouvre le milieu de la rangée :
  // il ne reste que trois personnages à gauche et quatre à droite. Les plus
  // reconnaissables vont donc aux extrémités, et le milieu prend ceux dont
  // l'absence se remarque le moins. Les deux afros sont séparés.
  foule: [
    'peep-standing-3',    // homme âgé, chapeau, moustache        │ visible
    'peep-standing-16',   // femme forte, chignon                 │ visible
    'peep-standing-5',    // personne voilée                      │ visible
    'peep-standing-25',   // afro, t-shirt foncé                  · derrière l'avatar
    'peep-standing-9',    // femme, longs cheveux raides          · derrière l'avatar
    'peep-standing-22',   // femme, lunettes, carré               · derrière l'avatar
    'peep-standing-27',   // afro, t-shirt clair                  │ visible
    'peep-standing-19',   // homme barbu, casquette, pois         │ visible
    'peep-standing-17',   // femme âgée, cheveux bouclés          │ visible
    'peep-standing-12',   // personne au bandana                  │ visible
  ],

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

// ---- La rangée de personnages ----------------------------------------------
// UNE SEULE ÉCHELLE POUR TOUT LE MONDE, et c'est la seule chose à retenir ici.
// Chaque figure d'Open Peeps est dessinée dans un canevas serré sur elle : la
// hauteur de son viewBox EST sa taille. En multipliant tout le monde par le
// même facteur, les grands restent grands et les petits petits — 617 à 713
// unités d'un personnage à l'autre, soit 15 % d'écart, exactement ce qu'on voit
// dans une vraie file d'attente.
//
// La première version tirait en plus une taille au hasard par position. Le
// personnage de gauche tombait toujours sur le plus petit tirage, si bien qu'un
// grand gaillard se retrouvait plus court que tous ses voisins. David l'a vu
// tout de suite. Ne pas remettre de facteur par position.
const HAUTEUR_MAX = 450;   // la plus grande figure, en pixels
const ESPACE = -30;        // négatif : les personnages se chevauchent un peu,
                           // comme dans une vraie file. C'est ce qui permet de les
                           // dessiner grands sans dépasser la largeur visible.

function boite(svg) {
  const m = svg.match(/viewBox="([\d.\s-]+)"/i);
  if (!m) throw new Error(`figure sans viewBox : impossible de la mettre à l’échelle`);
  const [, , l, h] = m[1].trim().split(/\s+/).map(Number);
  return { l, h };
}

function foule(noms, t) {
  const bruts = noms.map(illustration);
  const boites = bruts.map(boite);
  const k = HAUTEUR_MAX / Math.max(...boites.map((b) => b.h));
  const largeur = boites.reduce((n, b) => n + b.l * k, 0) + ESPACE * (noms.length - 1);
  const interieur = W - ROGNAGE * 2;
  if (largeur > interieur) {
    console.warn(`la rangée fait ${Math.round(largeur)} px pour ${interieur} px visibles sur un téléphone : `
      + `baissez HAUTEUR_MAX ou ESPACE, sinon quelqu’un sera coupé.`);
  }
  const img = bruts.map((brut, i) => {
    const svg = t.fonce ? pourFondFonce(brut) : brut;
    const f = t.fonce && aDesAplatsBlancs(brut) ? `filter:${contourCreme(boites[i].l * k)};` : '';
    return `<img style="height:${Math.round(boites[i].h * k)}px;${f}" src="${svgUri(svg)}">`;
  }).join('');
  return { img, largeur };
}

function banniereFoule(c) {
  const t = THEMES[c.theme];
  if (!t) throw new Error(`thème inconnu : ${c.theme}`);
  const { img, largeur } = foule(c.foule, t);
  console.log(`rangée : ${c.foule.length} personnages sur ${Math.round(largeur)} px`
    + ` (${W - ROGNAGE * 2} px visibles sur un téléphone)`);
  return `<!doctype html><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body { background: ${t.fond}; position: relative; }
  .halo { position: absolute; left: 50%; top: 78%; transform: translate(-50%, -50%);
          width: 1500px; height: 560px; border-radius: 50%;
          background: radial-gradient(ellipse, ${t.halo} 0%, rgba(0,0,0,0) 70%); }
  .sol { position: absolute; left: 50%; bottom: 56px; transform: translateX(-50%);
         width: 1360px; height: 3px; border-radius: 2px;
         background: linear-gradient(to right, rgba(0,0,0,0), ${t.trait}, rgba(0,0,0,0)); opacity: .5; }
  .rangee { position: absolute; left: 50%; bottom: 58px; transform: translateX(-50%);
            display: flex; align-items: flex-end; }
  .rangee img + img { margin-left: ${ESPACE}px; }
</style>
<div class="halo"></div>
<div class="sol"></div>
<div class="rangee">${img}</div>`;
}

function banniere(c) {
  if (c.disposition === 'foule') return banniereFoule(c);
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

// ---- Du PNG au JPG ---------------------------------------------------------
// Chrome sans tête ne sait écrire que du PNG, et Facebook préfère un JPG. Plutôt
// que d'ajouter une bibliothèque d'images — la première dépendance du projet —
// on fait faire la conversion à Chrome lui-même : un petit serveur local sert
// une page qui dessine le PNG dans un canevas, le réencode en JPEG et le
// renvoie. Tout est dans node:http, déjà là.
async function versJpeg(png, jpg, qualite = 0.92) {
  const octets = fs.readFileSync(png).toString('base64');
  const { createServer } = await import('node:http');
  const recu = await new Promise((resolve, reject) => {
    const serveur = createServer((req, rep) => {
      if (req.method === 'POST') {
        const morceaux = [];
        req.on('data', (d) => morceaux.push(d));
        req.on('end', () => {
          rep.end('ok');
          serveur.close();
          resolve(Buffer.concat(morceaux).toString());
        });
        return;
      }
      rep.setHeader('content-type', 'text/html; charset=utf-8');
      rep.end(`<!doctype html><meta charset="utf-8"><script>
        const i = new Image();
        i.onload = () => {
          const c = document.createElement('canvas');
          c.width = i.width; c.height = i.height;
          const x = c.getContext('2d');
          x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height);
          x.drawImage(i, 0, 0);
          fetch('/', { method: 'POST', body: c.toDataURL('image/jpeg', ${qualite}) });
        };
        i.src = 'data:image/png;base64,${octets}';
      <\/script>`);
    });
    serveur.on('error', reject);
    serveur.listen(0, '127.0.0.1', () => {
      const { port } = serveur.address();
      // execFile et non execFileSync : la version synchrone bloquerait la boucle
      // d'événements, le serveur n'accepterait jamais le POST de Chrome, et les
      // deux s'attendraient indéfiniment. C'est arrivé.
      execFile(navigateurs[0], ['--headless=new', '--disable-gpu', '--virtual-time-budget=8000',
        '--dump-dom', `http://127.0.0.1:${port}/`], () => {});
    });
  });
  fs.writeFileSync(jpg, Buffer.from(recu.split(',')[1], 'base64'));
  const ko = Math.round(fs.statSync(jpg).size / 1024);
  console.log(`écrit ${path.relative(ROOT, jpg)}  (${ko} Ko)`);
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
await versJpeg(path.join(OUT, 'couverture-facebook.png'), path.join(OUT, 'couverture-facebook.jpg'));
console.log(`\ntexte entre y ${TEXTE_HAUT} et ${TEXTE_BAS} | commandes jusqu'\u00e0 y ${NAV_BAS} | avatar \u00d8 ${AV_D} \u00e0 partir de y ${AV_HAUT} | rognage lat\u00e9ral ${ROGNAGE} px`);
console.log('Regardez la simulation t\u00e9l\u00e9phone avant de livrer quoi que ce soit.');
