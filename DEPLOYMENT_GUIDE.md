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

## 4. The two forms (done, but temporary)

The "Demande d'aide alimentaire" and "Devenir bénévole" forms still live on Wix.
Since `centreespoir.ca` now serves this site, they are reached through the free
Wix address instead:

- https://centreespoir.wixsite.com/accueil/aide
- https://centreespoir.wixsite.com/accueil/embauche

Both buttons on the site point there. **Keep that Wix site published**, or the
two forms stop working.

These are meant to be replaced by something built here. When that day comes, the
two addresses live in `URLS` at the top of `build/build.mjs`, and nowhere else.

## 5. Everyday changes

Text, hours, names, links: tell Claude, or edit the file yourself on GitHub
(`src/pages/<page>.html`, click the pencil, **Commit changes**). The site
rebuilds and is live in about two minutes. `update.sh` copies the reverse-proxy
file from `deploy/` on every deploy, so routing changes ship the same way.

The share-card image (`og.png`) and the iOS icon are generated files. When the
logo or the card wording changes:

```bash
node build/make-images.mjs
```

then commit `src/root/og.png` and `src/root/apple-touch-icon.png`.

## 6. Facts on the site still to confirm

These were written from what you told me and from the old site. Read them once:

- Aide alimentaire, step 2: "Un membre de l'équipe vérifie votre demande et vous
  revient rapidement" describes the process as I understood it. If the intake
  works differently (for example an appointment or documents to bring), say so.
- Aide alimentaire, "Ce que contient un panier": a generic description. Adjust if
  the panier is different.
- Bénévolat: the list of tasks (tri, paniers, accueil, cueillettes, événements)
  and "jumelé à quelqu'un d'expérience" come from how food banks generally run.
- Dons, "En denrées": the list of most-needed items is generic apart from pasta.
  "Appelez-nous avant de passer" is a safe instruction until you decide otherwise.
- Dons: `direction@centreespoir.ca` is given for questions about legacies and
  corporate sponsorships.
- Confidentialité: "Le responsable de la protection des renseignements personnels
  est le directeur des opérations." Quebec's Law 25 requires naming one; change
  if it is someone else.

## 7. If something breaks

```bash
cd /opt/site && docker compose ps && docker compose logs --tail=40 site
tail -n 30 /var/log/site-autoupdate.log
```

To roll back to the previous version: on GitHub, open the last commit and click
**Revert**, then **Create pull request** → **Merge**. Two minutes later the
previous site is back.
