---
name: site-centreespoir
description: "Use whenever working on centreespoir.ca, the public website of Centre Espoir de Gatineau: changing a page, the design, the wording, the share cards, the search-engine setup, or deploying. Carries the repository layout, the deploy loop, the facts the site states, and the traps that each cost real time."
---

# centreespoir.ca — the public website

Built and put online on 17 September 2026. Static pages, no database, **zero npm
dependencies**, deployed as an nginx container on the same VPS as the surplus
platforms. Everything below was learned by shipping it; the traps section is a
list of things that already went wrong once.

## The initiatives page, added 2026-09-22

`/initiatives` (nav label **Initiatives**, footer label *Écoles et organismes*)
presents the two things the Centre does beyond the food bank, each with its
own call to action:

- **Elementary schools** come once a week for the surplus fruit, vegetables and
  snacks, and hand them to children from struggling families and to those who
  arrive without a lunch. There is no form yet, so *Inscrire mon école* opens a
  prepared e-mail to info@centreespoir.ca (`url.ecoles` in `build/build.mjs`,
  built with `encodeURIComponent`, never with `
` escapes typed through a
  heredoc, which arrive as real line breaks). David may want a real form later.
- **The surplus network for organisations**, the Système de Prévention de
  Pertes at spp.centreespoir.ca (the *wps* codebase, `BRAND=spp`). *Demander
  l'accès* goes to `/demande`, its join-request form; *Voir la présentation*
  to `/presentation`, its two-minute deck. Both verified live before linking.
  Wording rules there: no religious vocabulary of any kind on that platform,
  and the fairness rules exist, so "des règles simples font tourner les lots"
  is accurate.

Adding a page means: the file in `src/pages/`, its slug in the `nav.*` list in
`build/build.mjs`, a link in the header and the footer, a card in
`build/make-images.mjs`, its own `og_image` in the front matter, and the slug
in `test/site.test.js`. Adding a **fifth** header link pushed the menu-button
breakpoint from 900 to **1024 px**: below that the links wrapped onto two lines.

## 1. Where everything is

| Thing | Where |
|---|---|
| Code | `C:\Dev\site` → GitHub `centreespoirgatineau/site`, branch `main` |
| Server | Hostinger VPS `srv1161077`, 72.60.112.197, folder `/opt/site` |
| Container | `site` (nginx), listening only on `127.0.0.1:8089` |
| Reverse proxy | the existing Traefik `root-traefik-1`, network `root_default`, resolver `mytlschallenge` |
| Domain | Cloudflare: root and `www` are A records to 72.60.112.197, **grey cloud** |
| Auto-deploy | `bash /opt/site/autoupdate.sh` every 2 min in root's crontab |
| Deploy log | `/var/log/site-autoupdate.log` |
| SSH | `ssh -i "C:/Users/david/.ssh/id_ed25519_wps_vps" root@72.60.112.197` |

**This is a different repository from `wps`** (the surplus platforms, jc. and
spp.). They share only the VPS and the Traefik in front of it. Never touch the
`wps`, `wps-spp`, `psc`, `hermes`, `root-n8n-1` or `root-traefik-1` containers.

```
src/pages/          one file per page, front matter then HTML
src/partials/       layout.html, header.html, footer.html
src/assets/         css, js, img (logos + illustrations), fonts
src/root/           favicon, share cards, apple-touch-icon, webmanifest
build/build.mjs     assembles everything into public/
build/serve.mjs     local server, behaves like the nginx config
build/make-images.mjs   redraws the share cards and the iOS icon (headless Chrome)
media/              the image studio: see the visuels-centre-espoir skill
deploy/             nginx.conf, security.inc, the Traefik override
test/site.test.js   8 tests over the built output
DESIGN.md           the visual system, and why
DEPLOYMENT_GUIDE.md operator documentation written for David, in English
```

## 2. Working on it

Node is not on PATH on David's machine. Use the one Adobe ships:

```bash
NODE="/c/Program Files/Adobe/Adobe Creative Cloud Experience/libs/node.exe"
"$NODE" build/build.mjs                    # → public/
"$NODE" build/serve.mjs                    # http://localhost:8090
"$NODE" --test "test/**/*.test.js"         # 8 tests, all must pass
```

There is nothing to install, ever. **Do not add an npm dependency** without
asking; the whole point is that the server has no install step.

## 3. Deploying, and what David expects

**A push to `main` is the deploy.** The cron notices within two minutes, rebuilds,
and the change is live. David's standing expectation, stated plainly on
18 September: *a change must be visible on the next visit, with nobody clearing
anything.* That holds today because every page is `Cache-Control: no-store` and
every asset carries its content hash in its name.

Confirm a deploy landed before saying it did:

```bash
ssh -i <key> root@72.60.112.197 "cd /opt/site && cat .deployed | cut -c1-7"
curl -sS https://centreespoir.ca/ | grep -o 'site\.[0-9a-f]*\.css'
```

During the container swap Traefik answers 404 for a few seconds. That is normal
and self-healing; do not diagnose it as a broken deploy.

## 4. The traps

Each cost time once. All are fixed in the repository; this list exists so they
are never reintroduced.

1. **nginx refuses braces in an unquoted regex.** The hashed-asset rule must be
   written `location ~* "\.[0-9a-f]{10}\.(css|js|svg|png|jpg|webp|woff2)$"`.
2. **`absolute_redirect off;` is required** behind Traefik, or nginx writes its
   own listen port into the `Location` header.
3. **`try_files` serves the file inside the current `location` without matching
   another one.** Headers declared only in a `~* \.html$` block never reached
   `/benevolat` and friends, so browsers kept stale inner pages for hours and
   David saw yesterday's site twice. `Cache-Control` and the security headers are
   declared **inside `location /` itself**.
4. **Git must carry the executable bit** on `update.sh` and `autoupdate.sh`
   (`git update-index --chmod=+x`). A checkout pushed from Windows arrives
   without it, `git reset --hard` strips it, and cron then fails with
   "Permission denied". The cron line also calls `bash /opt/site/autoupdate.sh`.
5. **A failed deploy must not mark itself done.** `autoupdate.sh` records the
   commit actually serving in `.deployed`, not in `HEAD`, and holds a `flock`.
6. **Chrome clamps its window to 500 px wide.** To screenshot a true phone
   viewport, load the page in a 360 px `<iframe>` inside a wider page.
7. **Every asset is content-hashed at build**, including fonts and
   illustrations, and the stylesheet is rewritten to point at the hashed names.
   Fixed-name root files carry `?v=<hash>`.
8. **Python heredocs in Bash break on Windows paths and quotes.** A `u"..."`
   string containing `C:\Users\...` raises a unicode escape error. Write the
   script to the scratchpad and run it from there.
9. **A `&&` chain stops at the first non-zero exit.** A patch script that throws
   silently skips the build and the verification that follow it, and the
   screenshot you then look at is of a dead server. Check the output of each
   step, not just the last one.

## 5. Verifying before claiming

David has been given wrong assurances more than once, and he notices. The bar:

- `node --test "test/**/*.test.js"` passes.
- Screenshots at **360, 440 and 1280 px** for any visual change, looked at, not
  merely produced.
- The **live** address checked after the deploy, not the local build.
- For anything that renders inside someone else's app (a Facebook cover, a share
  card), **simulate that app's overlays and crop**, or ask for a screenshot.
- If something could not be verified, say so first.

## 6. The facts the site states

All from David or from his own intake forms. Do not invent, and do not quietly
change one.

- Founded **1984**, quartier Notre-Dame, Gatineau. Registered charity
  **848106365RR0001**.
- **791, boulevard Maloney Est, Gatineau (Québec) J8P 1H8**, 819-663-3238,
  info@centreespoir.ca. Coordinates 45.4830815, -75.614716.
- **More than 250 families** helped each month, about **1 000 people**.
- Distribution **Tuesday to Thursday, 9H30 to 12H30**.
- Food aid is monthly and costs **10 $ per person, 30 $ per family up to four,
  40 $ for five or more**.
- Volunteers must be **14 or older**, with parental permission.

> **Unresolved, ask before touching:** David said 9H30 to 12H30; his own intake
> form says "les mardi, mercredi et jeudi, de 9h30 à 12h00". The site says
> 12H30 in four places. One of the two is wrong.

**External addresses live in `URLS` at the top of `build/build.mjs`, and nowhere
else.** The two forms are still on Wix and are temporary:
`centreespoir.wixsite.com/accueil/aide` and `/embauche`. That Wix site must stay
published or the forms stop working.

## 7. Search engines

The site's side is done: titles at most 60 characters, descriptions between 110
and 158 (a test enforces both), a sitemap, per-page share cards, redirects from
the old Wix addresses, and JSON-LD declaring an `["NGO","LocalBusiness"]` with
the address, coordinates, opening hours, charity number and territory.

**Three things only David can do**, in section 7 of `DEPLOYMENT_GUIDE.md`:
submit the sitemap and request indexing in Search Console, update the Google
Business Profile, and untick "let search engines index this site" on Wix.

## 8. Writing for the site

French (Quebec), and the house conventions from the `redaction-centre-espoir`
skill apply: hours as `9H30`, phone as `819-663-3238`, **no em dashes**, one idea
per sentence. A test fails the build on an em dash or a badly formatted hour.

David asked on 18 September for **less text**: paragraphs were cut by about a
third. Keep it that way. When adding a section, ask what it replaces.

## 9. The visual system

`DESIGN.md` in the repository is the reference and is kept current. The short
version:

- Five backgrounds: cream `#FAF9F5`, sand `#F3F1EA`, white cards, ink `#141413`,
  terracotta `#DA7757`. **At most one terracotta band per page.**
- Source Serif 4 for headings at weight 500, Source Sans 3 for text, both
  self-hosted, sizes fluid with `clamp()`.
- The header is glass: 55 % opacity, 20 px blur, opaque fallback where
  `backdrop-filter` is unsupported. Its blur lives on a pseudo-element, because a
  backdrop filter on the header itself would clip the fixed mobile menu.
- The footer is ink, with the white vertical logo.
- Three animations only, all disabled under `prefers-reduced-motion`, and the
  page is fully readable with JavaScript off (`no-js` / `js` class swap).
- The overriding rule, in David's words: **the site must not look like it was
  made by AI.** `DESIGN.md` opens with a table of what gives that away.

For logos, illustrations and anything shared on social media, see the
**visuels-centre-espoir** skill.
