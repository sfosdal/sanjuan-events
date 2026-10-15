# San Juan Events

Event feed and calendar for San Juan, Puerto Rico: the Coliseo de Puerto Rico
(the Choli), the Coca-Cola Music Hall, the Centro de Bellas Artes in Santurce,
the Convention Center, Vivo Beach Club in Isla Verde, the Hotel Rumbao, the
Estadio Hiram Bithorn and the Coliseo Roberto Clemente, plus the Bellas Artes
and Moneró in Caguas — with the Cangrejeros de Santurce and the Senadores de
San Juan (Liga de Béisbol Profesional Roberto Clemente) in a Teams view.

Live at **https://sanjuan.here.events/** once the domain is wired (GitHub
Pages, built by the Actions workflow once a day at noon Atlantic time).

A sister of lqa-events, built the way Cancún was: everything that makes this
San Juan's is `site/city.js` (every team, venue, type, default, share-code
registry and string), `site/index.html`, `scripts/fetch-events.mjs` (the
sources), `site/embed.js`, `outlook.json`, `scripts/data/postseason.json`,
`channels.json`, the manifest and icons (El Morro's sentry box over the
Atlantic, rendered from `favicon.svg`). Everything else is lqa-events' own,
byte for byte — copy from there, never edit here.

## Embed

```html
<div id="sanjuan-events"></div>
<script src="https://sanjuan.here.events/embed.js" data-max="8" defer></script>
```

## Sources

- **Ticketera** (ticketera.com), the island's ticketer — through
  `scripts/feeds.mjs` (city.js `feeds`, kind `ticketera`): each room's own
  listing page, every event's page for its showings, clock and sold-out
  status, and the category pages for the type; the sports page for the two
  grounds. Ticketera's Fastly edge answers Node, curl and any "Mozilla"
  client with HTTP 406 or a JavaScript challenge, but serves a Chrome TLS
  handshake in full, so the pages come through `scripts/cffi-fetch.py`
  (curl_cffi, run by `uv` — the workflow installs it). Season-ticket packages
  ("Abonados") are left out, as are church events (`isChurch`).
- **Seasons** — MLB's stats API for the Cangrejeros and the Senadores (the
  Liga Roberto Clemente is sportId 17, league 133; `scripts/schedules.mjs`,
  shared with lqa). Both clubs' home games at the Hiram Bithorn enter the
  listing from it (`inject`) until Ticketera lists each series itself. The
  league publishes its schedule to the API around opening day (early
  November), so the Teams view is empty before then.
- **Ticketmaster** — not read: one event a year on the island (the Puerto
  Rico Bowl). The code is kept for the day a room appears there (city.js `tm`).

Next to add: the BSN's Cangrejeros at the Clemente (bsnpr.com is a Next.js
app over a GraphQL API — not read yet), PRTicket's listings (Palco4 — the
Cangrejeras BSNF, the Caguas clubs; no dates in its markup), the Choli's own
calendar.

## Local run

```sh
cp .env.example .env   # TICKETMASTER_API_KEY=… (unused here, but the shared code expects it)
ALLOW_NO_ARCHIVE=1 node scripts/fetch-events.mjs   # ALLOW_NO_ARCHIVE only until the site has published once; needs uv on PATH
node --test scripts/*.test.mjs
```
