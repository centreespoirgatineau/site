# Le site du Centre Espoir de Gatineau

Le site public, https://centreespoir.ca. Sept pages en français, sans base de
données, sans dépendance : du HTML, une feuille de style, un petit script.

```
src/pages/          une page par fichier, avec un en-tête (title, description)
src/partials/       layout.html, header.html, footer.html
src/assets/css      site.css : la palette du logo, Source Serif 4 et Source Sans 3
src/assets/js       site.js : le menu mobile, l'ombre de l'en-tête, les vidéos
src/assets/img      les logos officiels (copie de brand/logo du dépôt wps) et les illustrations
src/assets/fonts    les polices, hébergées ici (licence OFL)
src/root/           favicon, og.png, apple-touch-icon.png, site.webmanifest
build/build.mjs     assemble tout dans public/
build/serve.mjs     un serveur local pour regarder le résultat
build/make-images.mjs  redessine og.png et apple-touch-icon.png (Chrome, sans tête)
deploy/             nginx.conf, security.inc, l'override Traefik du serveur
test/               vérifie ce qui sort de la construction
media/              l'atelier d'images : bannières, publications, affiches
```

Deux documents à lire avant de toucher à l'allure du site ou d'une affiche :

- **`DESIGN.md`** — les couleurs, les polices, les espacements, les composants,
  le mouvement, l'accessibilité, et la règle qui prime sur toutes les autres :
  le site ne doit pas avoir l'air fabriqué à la chaîne.
- **`media/README.md`** — la même méthode appliquée aux bannières Facebook, aux
  publications et aux affiches. Ouvrez `media/studio.html` d'un double-clic.

## Travailler dessus

```bash
node build/build.mjs        # → public/
node build/serve.mjs        # http://localhost:8090
node --test "test/**/*.test.js"           # les vérifications
```

Il n'y a rien à installer. Node 22 suffit.

## Les décisions à connaître

- **Le contenu vient de David** : les chiffres (1984, 250 familles, 1 000
  personnes), les heures (du mardi au jeudi, 9H30 à 12H30), les critères
  d'admissibilité (territoire et revenu), les administrateurs. Rien n'est inventé.
  Ce qui reste à confirmer est noté dans `DEPLOYMENT_GUIDE.md`.
- **Les adresses externes sont au même endroit**, dans `URLS` au début de
  `build/build.mjs` : les deux formulaires Wix (temporaires), la page de don Zeffy,
  les dossiers Google Drive, les réseaux sociaux. Une adresse change : un seul
  fichier à modifier.
- **Les illustrations** viennent d'Open Doodles et d'Open Peeps (Pablo Stanley,
  CC0). Leur rose d'origine (`#FF5678`) a été remplacé par le terracotta du logo
  (`#DA7757`), et le noir par l'encre (`#141413`). Pas de photos pour l'instant.
- **Les vidéos YouTube** ne se chargent qu'au clic (`youtube-nocookie.com`) :
  page rapide, et rien de YouTube tant qu'on ne regarde pas.
- **La feuille de style et le script ont un nom haché** (`site.<hash>.css`). Le
  HTML n'est jamais mis en cache. Un style périmé dans un cache a déjà cassé une
  mise en page ailleurs ; ici, c'est impossible.
- **Les règles d'écriture** sont celles de David : pas de tiret cadratin, les
  heures en `9H30`, le téléphone en `819‑663‑3238`. Un test les vérifie.

## Déploiement

Voir `DEPLOYMENT_GUIDE.md` (en anglais, écrit pour David). En résumé : un
conteneur nginx sur le VPS, derrière le Traefik déjà en place, mis à jour
automatiquement quand on pousse sur `main`.
