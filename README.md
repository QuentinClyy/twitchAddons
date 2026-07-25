# twitchAddons

A collection of small addons/overlays for streaming, hosted as static pages on GitHub Pages.
Each addon lives at its own path (e.g. `/valorant/badge`) as a separate Vite entry point — no
client-side router.

## Structure

```
apps/
  web/   Vite + React + TS frontend, deployed to GitHub Pages
  api/   Small Express + TS API (deployed separately, e.g. on a homelab) that does the actual
         scraping/lookups the static frontend can't do itself
```

## Addons

- **Valorant rank badge** — `/valorant/badge?player=Name%23Tag` displays a rank-tier badge
  image for the given Riot ID, fetched from `apps/api`'s `/valorant/rank` endpoint.

## Development

```bash
npm install

# frontend
npm run dev -w apps/web

# api
npm run dev -w apps/api

# lint / format (repo-wide)
npm run lint
npm run format
```
