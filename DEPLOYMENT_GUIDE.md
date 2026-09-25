# Putting centreespoir.ca online

Written for David. Every command is meant to be pasted as is. The site runs on
the same VPS as the surplus platforms, behind the same Traefik, and updates
itself the same way: a push to `main` is live within two minutes.

> **The site has been online since 17 September 2026.** Sections 1 to 4 are done
> and are kept as a record of how it was set up, and of what to redo if the
> server is ever rebuilt. For day-to-day work, go to section 5.

## What is where

| Thing | Where |
|---|---|
| Code | GitHub, `centreespoirgatineau/site`, branch `main` |
| Server | Hostinger VPS `srv1161077`, 72.60.112.197, folder `/opt/site` |
| Container | `site` (nginx), listening only on `127.0.0.1:8089` |
| Reverse proxy | the existing Traefik (`root-traefik-1`), which also serves jc. and spp. |
| Domain | Cloudflare, `centreespoir.ca` |
| Auto-update log | `/var/log/site-autoupdate.log` |

## 1. Create the GitHub repository (done)

1. Go to https://github.com/new while signed in as `centreespoirgatineau`.
2. Repository name: `site`. Visibility: Public. Leave every checkbox empty
   (no README, no .gitignore, no licence). Click **Create repository**.
3. Tell Claude it is created. Claude pushes the code from `C:\Dev\site`.

## 2. Install on the VPS (done)

Open a terminal on the VPS (Hostinger panel → Browser terminal, or PuTTY), as
root, and paste this block:

```bash
cd /opt && git clone https://github.com/centreespoirgatineau/site.git site && cd site \
  && chmod +x update.sh autoupdate.sh && ./update.sh
```

You should see `✓ site updated and healthy`. Then the auto-update, every two
minutes:

```bash
( crontab -l 2>/dev/null; echo '*/2 * * * * bash /opt/site/autoupdate.sh >> /var/log/site-autoupdate.log 2>&1' ) | sort -u | crontab -
```

Note the `bash` in front: it makes the line work even if the checkout arrives
without the executable bit, which is what happens when the code is pushed from
Windows.

At this point the site answers on the VPS but nobody can reach it yet: Traefik
only routes `centreespoir.ca` once the domain points at the server.

## 3. Point the domain at the VPS (done)

What was changed, and what to put back to return to Wix: the root record was
`A 185.230.63.171` and `www` was `CNAME www27.wixdns.net`.

1. Cloudflare → `centreespoir.ca` → **DNS** → **Records**.
2. Delete the existing records for the root (`@` or `centreespoir.ca`) and for
   `www` that point to Wix (they are `A` records to Wix addresses and/or a
   `CNAME` to `*.wixdns.net`).
3. Add: **A**, name `@`, IPv4 `72.60.112.197`, proxy status **DNS only (grey
   cloud)**, TTL Auto.
4. Add: **A**, name `www`, IPv4 `72.60.112.197`, proxy status **DNS only (grey
   cloud)**, TTL Auto.
5. The `jc` and `spp` records, and the `*` wildcard, are not touched.

The grey cloud matters: Traefik obtains its certificate with a TLS challenge that
does not work through Cloudflare's proxy. It is the same setting as `jc`.

Within a few minutes Traefik notices the domain resolves to the server, issues a
certificate, and https://centreespoir.ca shows the new site. `www.centreespoir.ca`
redirects to it. If it does not after ten minutes:

```bash
docker logs root-traefik-1 --tail 50 | grep -i centreespoir
```

## 4. The two forms

The "Demande d'aide alimentaire" buttons open the platform's form,
https://aide.centreespoir.ca/demande (since 24 September 2026). The "Devenir
bénévole" form still lives on Wix, reached through the free Wix address because
`centreespoir.ca` now serves this site:

- https://centreespoir.wixsite.com/accueil/embauche

**Keep that Wix site published**, or the volunteer form stops working.

These are meant to be replaced by something built here. When that day comes, the
two addresses live in `URLS` at the top of `build/build.mjs`, and nowhere else.

## 5. Everyday changes

Text, hours, names, links: tell Claude, or edit the file yourself on GitHub
(`src/pages/<page>.html`, click the pencil, **Commit changes**). The site
rebuilds and is live in about two minutes. `update.sh` copies the reverse-proxy
file from `deploy/` on every deploy, so routing changes ship the same way.

The share cards (`og.png` for the home page, `og-<page>.png` for each other
page: what Facebook, Messenger or a text message shows when a link is sent) and
the iOS icon are generated files. Their wording lives in `build/make-images.mjs`.
When the logo or that wording changes:

```bash
node build/make-images.mjs
```

then commit everything in `src/root/`. Facebook keeps its own copy of a card;
paste the address in https://developers.facebook.com/tools/debug/ and press
"Scrape again" to make it fetch the new one.

## 6. Facts on the site still to confirm

These were written from what you told me and from the old site. Read them once:

- **The hours disagree.** You told me Tuesday to Thursday, 9H30 to 12H30. Your
  intake form says "les mardi, mercredi et jeudi, de 9h30 à 12h00". The site says
  12H30 everywhere. One of the two is wrong and it needs settling.
- Aide alimentaire, step 2: "Un membre de l'équipe vérifie votre demande et vous
  revient rapidement" describes the process as I understood it. If the intake
  works differently (for example an appointment or documents to bring), say so.
- Aide alimentaire, the contribution (10 $ / 30 $ / 40 $) is taken word for word
  from your intake form. If those amounts change, they are on that page.
- Aide alimentaire, "Ce que contient un panier": a generic description. Adjust if
  the panier is different.
- Bénévolat: the task list matches your own volunteer form, so it is right.
  "Jumelé à quelqu'un d'expérience" is still my assumption.
- Dons, "En denrées": the list of most-needed items is generic apart from pasta.
  "Appelez-nous avant de passer" is a safe instruction until you decide otherwise.
- Dons: `direction@centreespoir.ca` is given for questions about legacies and
  corporate sponsorships.
- Confidentialité: "Le responsable de la protection des renseignements personnels
  est le directeur des opérations." Quebec's Law 25 requires naming one; change
  if it is someone else.

## 7. Being found on Google (your part, about 20 minutes)

The site does its share: every page has a title under 60 characters and a
description under 160, a sitemap at `/sitemap.xml`, and structured data that
tells Google it is a food bank in Gatineau, with the address, the coordinates,
the hours and the charity number. Google itself still shows the old Wix result
until it recrawls; the old Wix addresses it lists (`/aide`, the privacy policy)
redirect to the right pages, so nobody lands on an error. Three things only you
can do will speed it up and put the Centre in the map results:

**A. Google Search Console.** Your domain is already verified there (a
`google-site-verification` record exists in Cloudflare). Go to
https://search.google.com/search-console, pick the `centreespoir.ca` property,
then:
1. **Sitemaps** (left menu) → enter `sitemap.xml` → **Submit**.
2. **URL inspection** (top bar) → paste `https://centreespoir.ca/` → **Request
   indexing**. Repeat for `/aide-alimentaire`, `/dons`, `/benevolat`,
   `/a-propos`, `/nous-joindre`. Each request takes a minute; Google usually
   recrawls within a day or two.

**B. Google Business Profile.** This is what puts the Centre on the map when
someone searches "banque alimentaire Gatineau". Go to
https://business.google.com, claim or open the profile for Centre Espoir de
Gatineau, and check:
- **Website**: `https://centreespoir.ca` (not the Wix address).
- **Hours**: Tuesday, Wednesday, Thursday, 9:30 to 12:30, closed the other days.
- **Category**: "Banque alimentaire" first, then "Organisme sans but lucratif".
- **Description**: paste the first paragraph of the home page.
- **Photos**: a photo of the entrance and one of the shelves. Profiles with
  photos get chosen far more often, and this is the one place illustrations
  cannot stand in.
- Turn on **messages** or leave the phone as the contact, your choice.

**C. Hide the Wix site from Google.** It is still published for the two forms,
and Google may keep listing it next to the new site. In the Wix dashboard:
Settings → SEO → uncheck "Let search engines index your site" (the wording
varies). The forms keep working; only the listing disappears.

Optional, five minutes: https://www.bing.com/webmasters, import the site from
Search Console, and Bing (and so Copilot and DuckDuckGo) follows.

## 8. If something breaks

```bash
cd /opt/site && docker compose ps && docker compose logs --tail=40 site
tail -n 30 /var/log/site-autoupdate.log
```

To roll back to the previous version: on GitHub, open the last commit and click
**Revert**, then **Create pull request** → **Merge**. Two minutes later the
previous site is back.
