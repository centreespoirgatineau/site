# Fabriquer une image : bannières, publications, affiches

La méthode employée pour le site, rendue réutilisable. Elle sert à produire une
bannière de page Facebook, une bannière d'événement, une publication carrée, une
story ou une affiche, **avec les mêmes couleurs, les mêmes polices et les mêmes
illustrations que centreespoir.ca**. Une organisation qui se ressemble d'un
support à l'autre paraît solide; une qui change de tête à chaque affiche paraît
improvisée.

Les règles visuelles sont dans `../DESIGN.md`. Les règles d'écriture, dans le
carnet de rédaction du Centre : phrases courtes, un chiffre exact plutôt qu'un
adjectif, une seule demande par message.

---

## 1. S'en servir, sans rien installer

**Ouvrez `studio.html` d'un double-clic.** C'est tout. Le fichier contient déjà
les polices, les illustrations et le logo : il fonctionne hors ligne, rien n'est
envoyé sur Internet, et il n'y a pas de compte à créer.

1. Choisissez **où l'image sera publiée**. Les dimensions se règlent toutes
   seules.
2. Choisissez **les couleurs** : crème, encre ou terracotta.
3. Écrivez le **surtitre**, le **titre**, le **sous-titre** et la **pastille**.
   La pastille porte ce qu'il faut retenir : une date, des heures, un lieu.
4. Choisissez une **illustration** et la forme du **logo**.
5. **Télécharger l'image.** Le fichier PNG arrive dans vos téléchargements.

Le texte trop long ne déborde jamais : la taille diminue d'elle-même jusqu'à ce
que tout tienne. Si le titre devient minuscule, c'est le signe qu'il faut
couper des mots, pas agrandir l'image.

### La zone sûre

Facebook ne montre pas la même chose sur un téléphone et sur un ordinateur.
Mesuré **trois fois** le 18 septembre 2026, les deux premières fois à tort : la
seule méthode fiable a été d'installer un fichier connu sur la page et de lire
une capture d'écran de l'application.

- **Ordinateur** : l'image entière, en 16:9, l'avatar en bas à gauche.
- **Téléphone** : presque toute l'image aussi, légèrement agrandie pour remplir,
  ce qui **rogne environ 4 % de chaque côté**. Mais deux choses la recouvrent :
  les **commandes de l'application** (retour, partage, recherche, menu) flottent
  sur les **222 premiers pixels**, et l'**avatar**, centré, large de **44 %**
  (cercle blanc compris), monte jusqu'à **y 420**.

Il reste donc une bande au milieu, **y 240 à 412 dans un fichier de 1640 x 924**,
soit environ 170 px : un surtitre, un titre sur une seule ligne et une ligne de
sous-titre, pas davantage.
Tout le texte y va. Les illustrations descendent de part et d'autre du cercle de
l'avatar, sans entrer dans les 4 % rognés. Une pastille d'heures n'y tient
généralement pas, et les heures figurent déjà dans les informations de la page.

La case **Afficher la zone sûre** trace tout cela. **Avant de livrer une
couverture, simuler le téléphone** : rogner 4 % de chaque côté, assombrir les
222 premiers pixels, poser un cercle centré de 44 % à partir de y 420, et
regarder.

---

## 2. Les formats disponibles

| Choix | Dimensions | Pour |
|---|---|---|
| Bannière de page Facebook | 1640 × 924 | L'en-tête de la page du Centre. Un ordinateur la montre entière (16:9), un téléphone n'en garde que la bande du milieu : les mots y restent, sans logo, l'avatar le montre déjà. |
| Bannière d'événement Facebook | 1920 × 1005 | Un événement, une collecte, un souper |
| Publication carrée | 1080 × 1080 | Une publication Facebook ou Instagram |
| Story ou Reel | 1080 × 1920 | Les stories, à lire à la verticale |
| Carte d'aperçu d'un lien | 1200 × 630 | Ce qui s'affiche quand on envoie un lien |
| Affiche 8,5 × 11 po | 2550 × 3300 | À imprimer, 300 points par pouce |

---

## 3. Les trois habillages, et quand les employer

| Habillage | Effet | Quand |
|---|---|---|
| **Crème** | Fond blanc cassé, texte foncé | Par défaut. Information, aide alimentaire, remerciements. |
| **Encre** | Fond presque noir, texte blanc | Quand il faut de la gravité, ou se démarquer dans un fil d'actualité. |
| **Terracotta** | Fond de la couleur du logo | Les appels : bénévoles, dons, collectes. À employer avec parcimonie. |

Sur les fonds foncés, l'illustration et le logo passent automatiquement en
version claire. Il n'y a rien à faire.

---

## 4. D'où viennent les illustrations, et comment en ajouter

Deux collections de Pablo Stanley, toutes deux sous licence **CC0**, c'est-à-dire
domaine public : usage commercial permis, aucune mention obligatoire, rien à
signer.

- **Open Doodles** — https://www.opendoodles.com — des personnages dessinés au
  trait, en mouvement.
- **Open Peeps** — https://www.openpeeps.com — des personnages debout ou assis,
  d'âges et d'allures variés.

**La transformation tient en deux remplacements de couleur**, et c'est là toute
la méthode :

| Couleur d'origine | Devient | Pourquoi |
|---|---|---|
| `#FF5678` (le rose d'Open Doodles) | `#DA7757` | Le terracotta du logo |
| `#000000` (le noir) | `#141413` | L'encre du site, un noir chaud |

Sur les fonds foncés, l'atelier fait un troisième geste, et il dépend de la
collection :

- **Open Doodles** : `#141413` devient `#FAF9F5`, et c'est tout.
- **Open Peeps** : le dessin reste à l'encre, seuls les vêtements s'éclaircissent,
  et l'atelier **trace un contour crème autour de la silhouette** pour que les
  cheveux et les pantalons foncés ne se perdent pas dans le fond.

### Ajouter une illustration

1. Téléchargez le SVG depuis le site d'origine.
2. Ouvrez-le dans un éditeur de texte et faites les deux remplacements ci-dessus.
3. Déposez le fichier dans `../src/assets/img/illustrations/`.
4. Ajoutez son nom dans la liste `ILLUSTRATIONS` au début de `build-studio.mjs`,
   avec une description en français.
5. Reconstruisez : `node media/build-studio.mjs`.

### Le choix des personnages

Le Centre sert un quartier varié, et ses bénévoles le sont aussi. Sur une série
d'images, **les personnages doivent l'être également** : des âges différents, des
origines différentes, des allures différentes. **Aucune prothèse ni membre
appareillé**, en revanche : ce n'est pas la réalité du Centre, et plusieurs
figures d'Open Peeps en portent une. Les vérifier avant de les retenir. Les images générées automatiquement, elles, ramènent
toujours le même visage; c'est une des choses qui trahissent le plus vite une
communication fabriquée sans regard humain. Les illustrations retenues ici
couvrent volontairement plusieurs âges et plusieurs silhouettes.

---

## 4b. La bannière de page Facebook : un script à part

Elle a trop de contraintes pour être faite à la main, alors elle a son propre
générateur :

```bash
node media/couverture-facebook.mjs
```

Il écrit trois fichiers dans `media/exemples/` : la bannière à téléverser, **une
simulation du téléphone** et une simulation de l'ordinateur. Le texte, les
couleurs et les illustrations se changent dans l'objet `COUVERTURE` au début du
script.

**Regardez la simulation du téléphone avant de livrer.** Une bannière à plat a
l'air correcte à chaque fois : c'est exactement comme cela que quatre versions
fautives sont passées. La géométrie mesurée et les raisons de chaque contrainte
sont écrites en tête du script.

Il produit aussi le **JPG** à téléverser, à côté du PNG.

### La bannière installée ne porte aucun texte

`disposition: 'foule'` : dix personnages sur une rangée, et rien d'autre. Ce
choix vient d'un constat de David le 22 septembre 2026 — **la place et la taille
de l'avatar changent d'un téléphone à l'autre**. Une bannière sans un seul mot ne
peut pas se faire couper une phrase, quel que soit l'appareil.

Les dix personnages sont tous différents : des âges, des genres, des origines et
des silhouettes qui ne se répètent pas. Les plus reconnaissables sont placés aux
extrémités, parce que l'avatar recouvre le milieu de la rangée sur un téléphone.

L'autre disposition, `'texte'`, reste disponible dans le script pour le jour où
la bannière devra dire quelque chose.

---

## 5. Refabriquer l'atelier

`studio.html` est un fichier **fabriqué**. On ne le modifie pas à la main.

```bash
node media/build-studio.mjs
```

Le script prend `studio.template.html`, puis y incruste les polices, les
illustrations et les deux verrouillages du logo, sous forme de données. C'est ce
qui permet d'ouvrir le fichier d'un double-clic, sans serveur. Le résultat pèse
environ 1,2 Mo : c'est un outil, pas une page web.

À refaire chaque fois qu'une illustration, une police ou le logo change.

---

## 6. Piloter l'atelier par l'adresse

Utile pour préparer une image d'avance, l'envoyer toute faite à quelqu'un, ou en
produire une série.

```
studio.html?format=fb-evenement&theme=encre&titre=Collecte%20du%2012%20octobre
```

Les paramètres acceptés : `format`, `theme`, `surtitre`, `titre`, `soustitre`,
`pastille`, `illustration`, `logo`. En ajoutant `#image` à la toute fin, la page
n'affiche plus que l'image, à sa taille réelle : pratique pour la projeter ou
pour la capturer depuis un script.

---

## 7. Ce qu'il ne faut pas faire

- **Ne pas retaper le nom du Centre à la main.** Le logo vient du fichier, jamais
  d'un texte composé à la ressemblance.
- **Ne pas changer le terracotta.** `#DA7757` vient du fichier maître d'Adobe
  Illustrator. Toute autre valeur est une erreur, pas une variante.
- **Ne pas empiler les informations.** Une image porte une idée et une date. Le
  reste appartient au texte de la publication.
- **Ne pas déformer une illustration.** Elle est mise à l'échelle en conservant
  ses proportions, et il n'y a aucune raison d'y toucher.
- **Ne pas employer le terracotta en fond pour tout.** Il perd son sens dès qu'il
  couvre tout.

---

## 8. Et le matériel fait dans Canva ?

Les affiches produites dans Canva suivent un autre système : la police Lazydog,
un corail `#FF7950`, de l'ambre, et des illustrations engendrées par Magic Media.
**Ce n'est pas la même identité visuelle que le site et que ce dossier.**

Les deux peuvent cohabiter un temps, mais il faudra trancher : soit les affiches
passent aux couleurs et aux polices du logo, soit le site s'aligne sur Canva. Le
logo officiel dit `#DA7757` et Source Serif 4, ce qui plaide pour la première
solution. À décider quand vous voudrez.
