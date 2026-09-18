# Le système visuel du site

Ce qui suit n'est pas une théorie : c'est ce qui est réellement dans
`src/assets/css/site.css`, et pourquoi. À lire avant de changer une couleur, une
taille ou une animation, et avant de fabriquer une affiche ou une bannière
(voir `media/README.md`, qui applique les mêmes règles).

---

## 1. La règle qui prime sur toutes les autres

**Le site ne doit pas avoir l'air fabriqué à la chaîne.** Tout le reste en
découle. Concrètement, ce qui trahit un site fait à la va-vite, et ce qu'on fait
à la place :

| Ce qui trahit | Ce qu'on fait ici |
|---|---|
| Des dégradés violets, du verre dépoli, des ombres portées partout | Une seule couleur d'accent, des ombres à peine visibles, du blanc cassé |
| Trois polices, ou une seule police sans personnalité | Deux polices, un serif pour les titres, un sans pour le texte |
| Tout centré, tout symétrique | Des titres alignés à gauche, des grilles déséquilibrées (7/5, 3/2) |
| Des icônes emoji | Des icônes dessinées au trait, toutes de la même famille |
| Des photos de bureaux et de poignées de main | Des illustrations du domaine public, recolorées, ou rien |
| Du texte de remplissage enthousiaste | Des phrases courtes, des chiffres exacts, le ton de David |
| Des animations qui sautent aux yeux | Une apparition de 14 pixels, une fois, et jamais pour un lecteur qui n'en veut pas |

Une bonne question à se poser devant un écran : **est-ce que quelqu'un a décidé
de ça, ou est-ce que c'est sorti d'un gabarit ?** Si la deuxième réponse est
plausible, il y a du travail.

---

## 2. Les couleurs

Toutes déclarées en haut de `site.css`, et employées uniquement par leur nom
(`var(--accent)`), jamais en clair dans une règle.

| Jeton | Valeur | À quoi ça sert |
|---|---|---|
| `--bg` | `#FAF9F5` | Le fond de toutes les pages. Un blanc cassé chaud, jamais du blanc pur. |
| `--surface` | `#FFFFFF` | Les cartes et les panneaux, qui ressortent ainsi sur le fond. |
| `--surface-2` | `#F3F1EA` | Les sections alternées (sable). |
| `--ink` | `#141413` | Le texte, les sections d'encre et le pied de page. Un noir chaud, tiré du logo. |
| `--ink-2` | `#55534E` | Le texte secondaire, les paragraphes d'accompagnement. |
| `--ink-3` | `#85837C` | Les étiquettes, les mentions légales. |
| `--line` | `#E8E6DF` | Les séparations. |
| `--accent` | `#DA7757` | Le terracotta du logo. Boutons, chiffres, puces. |
| `--accent-ink` | `#B4573A` | Le même, assombri, pour du texte sur fond clair. |
| `--accent-soft` | `#F8EDE6` | Les pastilles d'icône, les encadrés. |
| `--focus` | `#1F5FBF` | Le contour de mise au point au clavier. Bleu **exprès** : il doit se distinguer de la marque. |

Trois choses à retenir :

- **Le terracotta est `#DA7757`**, la valeur exacte du logo d'Illustrator. La
  plateforme des surplus utilise `#D97757`, un chiffre de différence, hérité
  d'avant le logo. Si les deux doivent un jour s'aligner, c'est `#DA7757` qui
  gagne.
- **L'accent en fond de section, oui, mais une fois par page.** Une bande
  terracotta pleine largeur (les chiffres de l'accueil, le dernier appel d'une
  page) rythme la lecture et rappelle les bannières. Deux bandes sur la même
  page, et il ne veut plus rien dire. Les sections d'encre (`.section-ink`) et
  le pied de page, foncé lui aussi, complètent la gamme : crème, sable, blanc,
  encre, terracotta. Cinq fonds, pas davantage.
- **Le texte sur terracotta est blanc**, jamais gris ni crème, pour garder le
  contraste au-dessus de 4,5:1.

**Le logo, en trois formes.** L'en-tête porte `logo-header.svg`, le
verrouillage compact « Centre Espoir » sans la mention « Banque alimentaire »,
parce qu'à 42 px de haut la mention devenait illisible. Le pied de page, foncé,
porte `logo-vertical-blanc.svg`, où l'encre est devenue blanche. Les bannières
et les affiches emploient le verrouillage complet. Aucun n'est retapé : ce sont
les fichiers de David, et rien d'autre.

---

## 3. Les polices

Deux familles, les mêmes que le logo, hébergées sur notre serveur et non chez
Google : la page reste rapide, et personne n'est pisté au chargement.

| Famille | Emploi | Graisse |
|---|---|---|
| **Source Serif 4** | Les titres `h1` à `h4`, les grands chiffres, les numéros d'étape | 500 |
| **Source Sans 3** | Tout le reste | 400, et 600 pour l'emphase |

Les tailles ne sont pas fixes : elles glissent entre un téléphone et un grand
écran grâce à `clamp()`. Le titre principal passe de 34 à 60 pixels sans palier
visible, et le texte courant de 17 à 19.

```css
--h1:   clamp(2.125rem, 1.4rem + 3.2vw, 3.75rem);
--text: clamp(1.0625rem, 1rem + .25vw, 1.1875rem);
```

Règles de composition :

- Les titres sont serrés (`letter-spacing: -.02em`, interligne 1.08 à 1.15), le
  texte est aéré (interligne 1.6).
- `text-wrap: balance` sur les titres : les lignes se répartissent d'elles-mêmes,
  et aucun mot ne reste seul en fin de titre.
- Un paragraphe ne dépasse jamais **36 caractères de large** environ (`.lead`) ou
  42 (`.measure`). Au-delà, l'œil perd la ligne.
- **Les surtitres** (`.eyebrow`) sont en majuscules, interlettrés à `.12em`,
  précédés d'un petit trait. C'est la seule chose en majuscules du site.

---

## 4. L'espace

- La largeur utile est de **1120 px**, avec des marges de 20 px sur téléphone et
  32 px au-delà de 700 px.
- L'espace entre deux sections est lui aussi fluide :
  `--section: clamp(3.5rem, 2.5rem + 5vw, 7rem)`. Sur téléphone il vaut 56 px,
  sur grand écran 112.
- Les rayons : **16 px** pour les cartes, 10 pour les petits éléments, 24 pour
  les grands blocs, et un cercle complet pour les boutons.
- Les ombres sont presque invisibles : deux couches, la seconde très diffuse et
  décalée vers le haut (`0 6px 20px -12px`). Une ombre qu'on remarque est une
  ombre ratée.

---

## 5. Les composants, et quand s'en servir

| Classe | Ce que c'est | Quand |
|---|---|---|
| `.btn-primary` | Bouton terracotta | **Une seule action principale par écran.** |
| `.btn-secondary` | Bouton contour | L'action de second rang, à côté du premier. |
| `.btn-ink` / `.btn-light` | Noir / blanc | Sur un fond clair / sur un fond foncé. |
| `.card` | Carte cliquable, qui se soulève de 3 px au survol | Un choix parmi deux ou trois. |
| `.panel` | Encadré blanc, non cliquable | Un formulaire, une liste de coordonnées. |
| `.callout` | Bloc teinté avec une icône | Une précision utile, jamais une alerte. |
| `.hours` | Bloc noir | **Un seul par page**, réservé au fait qu'on vient chercher : les heures. |
| `.steps` | Liste numérotée en pastilles | Une marche à suivre, trois ou quatre étapes. |
| `.stats` | Trois grands chiffres | Uniquement des chiffres vrais et vérifiables. |
| `.cta-band` | Bandeau en fin de page, encre ou terracotta (`.terracotta`) | Le dernier appel. Un par page, jamais deux. |
| `.section-ink` / `.section-terracotta` | Une section entière sur fond foncé ou terracotta | Une par page au plus. L'illustration y passe en version claire (`-clair.svg`). |
| `.timeline` | Frise verticale | L'histoire, les étapes dans le temps. |

Les icônes sont des SVG au trait, **1,8 px d'épaisseur, bouts arrondis**, dans
une grille de 24. Elles sont écrites directement dans la page : pas de police
d'icônes, pas de fichier à charger. Toute nouvelle icône doit suivre exactement
ces réglages, sinon elle se voit.

---

## 6. Le mouvement

Trois animations en tout, et c'est voulu.

1. **L'apparition au défilement.** Un élément `.reveal` monte de 14 px en
   passant de transparent à opaque, sur 0,6 s. Une seule fois. Les classes `d1`,
   `d2`, `d3` décalent de 80 ms pour donner un ordre de lecture.
2. **Le survol.** Une carte se soulève de 3 px, une flèche avance de 3 px, un
   bouton s'enfonce de 1 px au clic. Rien de plus.
3. **L'en-tête** gagne une ombre quand la page défile, et le menu du téléphone
   s'ouvre en fondu de 0,22 s.

Deux garde-fous à ne jamais enlever :

- **Sans JavaScript, tout est visible.** La page s'ouvre avec la classe `no-js`,
  qu'un script d'une ligne remplace par `js`. Les règles d'apparition ne
  s'appliquent qu'à `.js .reveal`. Si le script ne s'exécute pas, le contenu est
  simplement là, sans animation. Un site dont le texte disparaît quand le
  JavaScript échoue est un site cassé.
- **`prefers-reduced-motion`** annule tout. Certaines personnes ont mal au cœur
  devant une page qui bouge, et c'est un réglage de leur système.

---

## 7. L'accessibilité, en pratique

Ce n'est pas une case à cocher, c'est une partie du public : des bénéficiaires
âgés, des gens qui lisent sur un vieux téléphone, au soleil, dans l'autobus.

- **Le contraste** du texte courant dépasse 7:1, celui du texte secondaire 4,5:1.
- **Les zones tactiles** font 52 px de haut pour les boutons, 44 au minimum.
- **La mise au point au clavier** est visible partout : contour bleu de 3 px,
  décalé de 3 px. Elle n'est jamais supprimée.
- **Un lien d'évitement** en tête de page mène directement au contenu.
- **Un seul `h1` par page**, et les niveaux se suivent sans saut.
- **Les illustrations portent `alt=""`** : elles n'ajoutent rien au texte, et un
  lecteur d'écran doit les ignorer plutôt que de les décrire.
- **Sans JavaScript et sur téléphone**, le menu ne s'ouvre pas, mais le pied de
  page contient tous les liens. Il y a toujours un chemin.
- La langue est déclarée `fr-CA`, ce qui change la prononciation d'un lecteur
  d'écran et la coupure des mots.

---

## 8. Les tailles d'écran

Conçu pour le téléphone d'abord, puis élargi. Les points de bascule utiles :

| Largeur | Ce qui change |
|---|---|
| 640 px | Les trois chiffres passent côte à côte, l'équipe sur deux colonnes |
| 700 px | Les marges passent à 32 px, l'en-tête à 76 px de haut |
| 760 px | Les cartes se mettent en ligne, le bandeau d'infos sur trois colonnes |
| 860 px | Les pages intérieures passent en deux colonnes avec un panneau collant |
| 900 px | Le menu complet remplace le bouton **Menu** |

**Toute modification se vérifie à 360 px, 440 px et 1280 px avant d'être déclarée
finie.** Le 360 est le vieux téléphone, le 440 le téléphone récent, le 1280 le
portable.

Note technique pour les captures : Chrome refuse une fenêtre de moins de 500 px
de large. Pour photographier une vraie largeur de téléphone, on charge la page
dans une `<iframe>` de 360 px à l'intérieur d'une page plus grande. C'est ainsi
que les vérifications ont été faites.

---

## 9. Ce que tout ça donne comme poids

Une page complète, avec ses polices et ses illustrations, tient sous **300 Ko**.
Il n'y a aucune bibliothèque, aucun cadriciel, aucun traqueur. Chaque fichier
(style, script, police, illustration) porte son empreinte dans son nom
(`site.a1b2c3d4e5.css`) et se garde un an; le HTML n'est jamais mis en cache,
alors un changement se voit à la visite suivante, sans rien vider. Les vidéos YouTube ne se
chargent qu'au moment où l'on appuie sur lecture.
