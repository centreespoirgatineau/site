# Putting centreespoir.ca online

Written for David. Every command is meant to be pasted as is. The site runs on
the same VPS as the surplus platforms, behind the same Traefik, and updates
itself the same way: a push to `main` is live within two minutes.

## What is where

| Thing | Where |
|---|---|
| Code | GitHub, `centreespoirgatineau/site`, branch `main` |
| Server | Hostinger VPS `srv1161077`, 72.60.112.197, folder `/opt/site` |
| Container | `site` (nginx), listening only on `127.0.0.1:8089` |
| Reverse proxy | the existing Traefik (`root-traefik-1`), which also serves jc. and spp. |
| Domain | Cloudflare, `centreespoir.ca` |
| Auto-update log | `/var/log/site-autoupdate.log` |

## 1. Create the GitHub repository (once, 2 minutes)

1. Go to https://github.com/new while signed in as `centreespoirgatineau`.
2. Repository name: `site`. Visibility: Public. Leave every checkbox empty
   (no README, no .gitignore, no licence). Click **Create repository**.
3. Tell Claude it is created. Claude pushes the code from `C:\Dev\site`.

## 2. Install on the VPS (once, 5 minutes)

Open a terminal on the VPS (Hostinger panel → Browser terminal, or PuTTY), as
root, and paste this block:

```bash
cd /opt && git clone https://github.com/centreespoirgatineau/site.git site && cd site \
  && chmod +x update.sh autoupdate.sh && ./update.sh
```

You should see `✓ site updated and healthy`. Then the auto-update, every two
minutes:

```bash
( crontab -l 2>/dev/null; echo '*/2 * * * * /opt/site/autoupdate.sh >> /var/log/site-autoupdate.log 2>&1' ) | sort -u | crontab -
```

At this point the site answers on the VPS but nobody can reach it yet: Traefik
only routes `centreespoir.ca` once the domain points at the server.

## 3. Point the domain at the VPS (the switch from Wix)

Do this when you are ready for the new site to replace the Wix one. It takes
effect within minutes and is reversible by putting the old records back.

**Before you switch, write down the current values** of the `@` and `www`
records in Cloudflare (DNS → Records), so you can restore them.

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

## 4. The two forms: the one thing to fix right after the switch

The "Demande d'aide alimentaire" and "Devenir bénévole" forms still live on Wix,
at `www.centreespoir.ca/aide` and `www.centreespoir.ca/embauche`. **Once the
domain points at the VPS, those two addresses stop reaching Wix**, and the two
buttons on the new site would land on the new site's redirect pages instead of
the forms.

Two ways out, pick one:

- **Quick (same day).** Every Wix site keeps a free address of the form
  `https://<account>.wixsite.com/<site>`. In the Wix dashboard: Settings →
  Domains, or Site → "Free Wix domain". The forms are reachable at
  `https://<that address>/aide` and `/embauche`. Send both addresses to Claude,
  who changes them in `URLS` at the top of `build/build.mjs` and pushes.
- **Proper (later).** Rebuild the two forms elsewhere (Google Forms, Zeffy forms,
  or a small form on this site that emails `info@`), then swap the addresses the
  same way.

Until the switch happens, the current links work and nothing needs doing.

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
