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
| **Facebook page cover** | **1640 × 924 (16:9)** |
| Facebook event banner | 1920 × 1005 |
| Square post, Facebook or Instagram | 1080 × 1080 |
| Story or Reel | 1080 × 1920 |
| Link preview card | 1200 × 630 |
| Poster, 8.5 × 11 in at 300 dpi | 2550 × 3300 |

### The Facebook page cover: measured four times, wrong three times

This cost David three rounds of rework on 18 September 2026. **Guessing from the
desktop page failed. Reasoning from published specifications failed** — nearly
every guide online still describes the pre-2023 layout of 820 × 312. What finally
worked, and what to do next time:

> **Install a file whose geometry you know, ask David for a screenshot of the
> page in the app, then solve the mapping from file pixels to screen pixels.**

The result, for a **1640 × 924** file:

- **Computer**: the whole 16:9 image, avatar bottom-left.
- **Phone**: also very nearly the whole image, zoomed slightly to fill, which
  **crops about 4 % off each side**. It is *not* a narrow middle band, which is
  what the second measurement wrongly concluded. Two things sit on top of it:
  - the app's own controls (back, share, search, menu) float over the **top
    222 px** of the file;
  - the **avatar** is a centred circle **44 % of the width**, white ring
    included, its top edge at **y 420**.

So the safe area for words is a band across the middle: **y 240 to 412**, inside
**x 150 to 1490** — about **170 px**, which holds an eyebrow, a **single-line**
title and one line of subtitle, and nothing more. Illustrations go below it, in
the columns either side of the avatar circle. An hours pill does not fit, and the
hours are in the page's information section anyway.

**Never put the logo or the mark on the cover** — David's instruction, and
correct: the avatar already shows it.

**Simulate before delivering.** Crop 4 % from each side, darken the top 222 px,
lay a centred circle of 44 % starting at y 420, and look at the result. The
studio's *Afficher la zone sûre* box draws the same thing. A flat file tells you
nothing: every cover that went wrong looked perfectly fine flat.

Each wrong version was wrong by a smaller margin than the last, and each time the
only thing that settled it was a fresh screenshot from David with a known file
installed. **Ask for one, rather than iterating on a guess.**

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
