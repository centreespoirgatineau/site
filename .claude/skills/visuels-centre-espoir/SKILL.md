---
name: visuels-centre-espoir
description: "Use whenever making an image for Centre Espoir de Gatineau outside Canva: a Facebook page or event banner, a square post, a story, a link preview card, or a printable poster. Carries the measured social dimensions, the logo and illustration rules, and the image studio that draws them in the brand's colours."
---

# Les images du Centre Espoir — bannières, publications, cartes de partage

The method that produced centreespoir.ca, turned into something reusable. Same
palette, same two typefaces, same illustrations as the website, so the Centre
looks like one organisation across every surface.

Companion skills: **site-centreespoir** for the website itself,
**redaction-centre-espoir** for the words, **infographies-centre-espoir** for the
Canva poster system (see §8: the two are not the same identity yet).

## 1. The studio

`C:\Dev\site\media\studio.html` **opens with a double-click**. It works offline
and needs nothing installed, because `media/build-studio.mjs` inlines the fonts,
the illustrations and the logos into it as data.

Pick a format, pick the colours, type the text, press *Télécharger l'image*.
Text that is too long shrinks to fit rather than overflowing; if a title turns
tiny, that is the signal to cut words.

Rebuild it after changing any illustration, font or logo:

```bash
"/c/Program Files/Adobe/Adobe Creative Cloud Experience/libs/node.exe" media/build-studio.mjs
```

It can also be driven from the address, which is how a batch gets rendered
headlessly:

```
studio.html?format=fb-evenement&theme=encre&titre=...&illustration=loving#image
```

Parameters: `format`, `theme`, `surtitre`, `titre`, `soustitre`, `pastille`,
`illustration`, `logo`. Adding `#image` strips the interface and shows the image
alone at full size, which a headless Chrome screenshot then captures exactly.

## 2. Sizes, measured not remembered

| Use | File to produce |
|---|---|
| **Facebook page cover** | **1640 × 924 (16:9)** — use `media/couverture-facebook.mjs` |
| Facebook event banner | 1920 × 1005 |
| Square post, Facebook or Instagram | 1080 × 1080 |
| Story or Reel | 1080 × 1920 |
| Link preview card | 1200 × 630 |
| Poster, 8.5 × 11 in at 300 dpi | 2550 × 3300 |

### The Facebook page cover

**Do not lay one out by hand. Run this:**

```bash
"/c/Program Files/Adobe/Adobe Creative Cloud Experience/libs/node.exe" media/couverture-facebook.mjs
```

It writes three files into `media/exemples/`: the cover to upload, **a phone
simulation** and a computer simulation. The wording, the theme and the
illustrations are the `COUVERTURE` object at the top of that script; edit it and
run again. The geometry below is baked into it, with the reasoning, so it cannot
be forgotten.

**Always look at the phone simulation, and always show it to David.** A flat
banner looks fine every single time; that is precisely how four wrong versions
reached him.

#### Deux dispositions, et pourquoi celle en ligne n'a aucun texte

`disposition: 'foule'` — **la bannière installée**. Dix personnages sur une
rangée, rien d'autre. David l'a choisie le 22 septembre 2026 après avoir constaté
que **la place et la taille de l'avatar changent d'un téléphone à l'autre** : la
géométrie mesurée ci-dessous est juste pour l'appareil qui a servi à la mesurer,
pas pour tous. Un fichier sans un seul mot ne peut pas se faire couper une
phrase. C'est la réponse robuste au problème, et non un compromis.

`disposition: 'texte'` — la version à surtitre, titre et sous-titre, conservée
telle quelle. Elle reste juste dans sa bande sûre et resservira le jour où une
bannière devra dire quelque chose.

#### Dessiner une rangée de personnages

Trois choses, apprises en se trompant :

1. **Une seule échelle pour toute la rangée.** Chaque figure d'Open Peeps est
   dessinée dans un canevas serré sur elle : la hauteur de son `viewBox` **est**
   sa taille, de 617 à 713 unités selon le personnage. On multiplie tout le monde
   par le même facteur et les écarts de taille restent ceux du dessin. La
   première version tirait en plus une taille au hasard par position, et le
   personnage de gauche héritait toujours du plus petit tirage : un grand
   gaillard s'est retrouvé plus court que tous ses voisins. David l'a vu
   immédiatement. **Ne jamais remettre de facteur par position.**
2. **L'ordre compte.** Sur un téléphone l'avatar recouvre le milieu de la rangée;
   il ne reste que trois personnages à gauche et quatre à droite. Les plus
   reconnaissables vont aux extrémités, le milieu prend ceux dont l'absence se
   remarque le moins, et les figures qui se ressemblent (les deux afros) sont
   écartées l'une de l'autre.
3. **Un léger chevauchement**, une marge négative d'environ 30 px, permet de
   dessiner les personnages grands sans dépasser la largeur visible. Sans lui,
   dix figures tiennent dans la largeur mais font la moitié de la hauteur et les
   deux tiers de l'image restent vides.

Le casting est **dix personnages tous différents** — âges, genres, origines,
silhouettes — parce que c'est la demande de David et parce qu'une série où tout
le monde se ressemble est l'un des plus sûrs indices d'une image fabriquée sans
regard humain. Aucune des figures qui portent une prothèse (1, 2, 7, 8, 28, 29).

#### Le JPG

Chrome sans tête n'écrit que du PNG. Le script convertit en lui faisant dessiner
le PNG dans un canevas puis le renvoyer en JPEG à un petit serveur `node:http`
local — plutôt que d'ajouter une bibliothèque d'images, qui serait la première
dépendance du projet. **Le serveur est lancé avec `execFile`, jamais
`execFileSync`** : la version synchrone bloque la boucle d'événements, le serveur
n'accepte jamais le POST de Chrome, et les deux s'attendent indéfiniment.

#### The constraints, and where they come from

Measured on 18 September 2026 by uploading a file of known geometry and solving
the mapping from a screenshot of the page in the iOS app. For a **1640 × 924**
file:

| | |
|---|---|
| **Computer** | the whole 16:9 image, avatar bottom-left |
| **Phone** | nearly the whole image too, zoomed to fill, so about **4 % is cropped off each side** |
| **App controls** (back, share, search, menu) | float over the **top 222 px** |
| **Avatar** | a **centred** circle, **44 % of the width** including its white ring, top edge at **y 420** |

That leaves **one safe band: y 240 to 412**, roughly 170 px. It holds an eyebrow,
a title **on a single line**, and one line of subtitle. Not two lines of title,
and not an hours pill. Illustrations go below, in the columns either side of the
circle, where being covered costs nothing.

**No logo, ever.** The page avatar already shows the mark. David's instruction,
and correct.

#### The four wrong answers, so nobody repeats them

1. **1640 × 624** from the published specifications. Those describe the layout
   Facebook retired in 2023. Every guide online still repeats them.
2. Text centred **vertically**. The avatar sits over the middle of the phone view
   and swallowed the title.
3. A **narrow 2.38:1 middle band**. The phone does not crop to a band; it shows
   almost the whole image.
4. Text at the very **top**. That is where the app's own controls float.

Each was closer than the last, and none was settled by reasoning. What settled it
every time was a fresh screenshot from David with a known file installed.
**If Facebook changes its layout again, ask for that screenshot rather than
iterating on a guess.**

#### Before delivering, check

1. The phone simulation, looked at, not merely produced.
2. Nothing readable under the top 222 px or behind the centred circle.
3. Nothing important in the outer 4 % of the width.
4. No logo.
5. Title on one line — or, in the 'foule' layout, no text at all.
6. Delivered as PNG **and JPG**, at exactly 1640 × 924, ready to upload. The
   script writes both.
7. Say that Facebook will offer to reposition the image, and that it should be
   left centred.

## 3. The three colour schemes

| Scheme | When |
|---|---|
| **Crème** `#FAF9F5` | The default. Information, food aid, thanks. |
| **Encre** `#141413` | Gravity, or standing out in a white feed. |
| **Terracotta** `#DA7757` | Appeals: volunteers, donations, collections. Sparingly. |

On the dark schemes the illustration and the logo switch to their light versions
automatically. Text on terracotta is white, never cream, to hold the contrast.

## 4. Illustrations

Two collections by Pablo Stanley, both **CC0**: no attribution, no licence to
sign, commercial use allowed.

- **Open Doodles** — https://www.opendoodles.com — figures in movement.
- **Open Peeps** — https://www.openpeeps.com — figures standing or seated.

**The whole transformation is two colour replacements:**

| From | To |
|---|---|
| `#FF5678` (Open Doodles pink) | `#DA7757`, the logo's terracotta |
| `#000000` | `#141413`, the site's warm ink |

On a dark background a third replacement is applied on the fly, **and it differs
by collection**:

- **Open Doodles**: `#141413` becomes `#FAF9F5`. Done.
- **Open Peeps**: leave the drawing in ink and lighten only the garments,
  `#FFFFFF` to `#FAF9F5`, so the figure keeps the look it has on a light page.
  Then **trace a cream outline around the silhouette**, about **1.4 % of the
  figure's width** (1.5 px on a 110 px figure), or the hair and the dark trousers
  dissolve into the background. The studio does this itself, with eight
  drop-shadows and no blur, applied at draw time, so the source files stay usable
  on light pages.

  Two dead ends, both shown to David on 18 September 2026 and rejected:
  lightening only the outlines gives a **white silhouette with no face**, and
  swapping ink and white gives dark garments with light lines, which he read as
  inverted.

Files live in `src/assets/img/illustrations/`, and the light copies are named
`-clair.svg`.

### Choosing the cast — two rules from David

1. **Visibly diverse**: ages, origins, silhouettes, across a page and across a
   series. A set where everyone looks alike is one of the fastest tells of work
   made without a human eye.
2. **No prosthesis, no appliance.** Not the Centre's reality, and several Open
   Peeps figures have one. Standing figures **1, 2, 7, 8, 28 and 29 are excluded
   for this reason** — check any new figure before adopting it.

The volunteer trio currently used is an older man with a moustache, a woman
wearing a headscarf, and a person with an afro.

## 5. The logo, and where each form goes

| File | Use |
|---|---|
| `logo-header.svg` | The compact "Centre Espoir" lockup. Website header, share cards. |
| `logo-horizontal.svg` | The full lockup with "Banque alimentaire". Banners, posters. |
| `logo-vertical.svg` | Stacked. Footer, square formats. |
| `logo-vertical-blanc.svg` | The same with the ink turned white, for dark backgrounds. |
| `icon.svg` | The lighthouse alone, on its terracotta disc. Favicon, avatar. |

Rules that have already been broken once each:

- **Never retype the name.** The logo comes from a file, always.
- **The terracotta is `#DA7757`**, from David's Illustrator master. The surplus
  platform still uses `#D97757`, one digit off and predating the logo; `#DA7757`
  wins.
- **On a terracotta panel the whole mark must become white**, disc included.
  Turning only the ink white leaves a terracotta lighthouse on terracotta, and
  it disappears.

## 6. Share cards for the website

One per page, in `src/root/`, drawn by `build/make-images.mjs` and committed.
David chose the design on 18 September among six: **the compact logo top-left,
the words on cream, and the page's own illustration on a soft terracotta wash** —
the look of the site itself. He rejected the version with a terracotta panel.

Each page names its card in its front matter (`og_image`), and the address
carries `?v=<hash>` so a redrawn card replaces the one a social network cached.
Facebook keeps its own copy regardless: paste the address into
https://developers.facebook.com/tools/debug/ and press *Scrape again*.

## 7. Delivering to David

- **Show the simulation, not just the file.** A banner is judged with the
  platform's crop applied and the avatar on top. Twice, delivering the flat image
  is exactly what hid the problem.
- Show **all the variants at once** when he asks to choose, numbered, with a
  contact sheet if there are more than three.
- Deliver the chosen one in **PNG and JPG**, at the exact pixel size, ready to
  upload. He should never have to resize or convert anything.
- Keep a copy of anything chosen in `media/exemples/`.
- When a platform's geometry is uncertain, say so and ask for a screenshot rather
  than shipping and hoping.

## 8. The unresolved question: two visual identities

The website and this studio use **Source Serif 4 / Source Sans 3 and terracotta
`#DA7757`**. The Canva posters described in the `infographies-centre-espoir`
skill use **Lazydog, coral `#FF7950` and amber**, with illustrations generated by
Magic Media.

They can coexist for a while, but side by side they read as two organisations.
The official logo says `#DA7757` and Source Serif 4, which argues for aligning
Canva on the web system rather than the reverse. **Flagged to David twice,
not yet decided.** Raise it, do not silently pick a side.
