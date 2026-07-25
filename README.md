# twitchAddons

A collection of small addons/overlays for streaming, hosted as static pages on GitHub Pages.
Each addon lives at its own path (e.g. `/valorant/badge`) as a separate Vite entry point — no
client-side router.

## Structure

```
apps/
  web/   Vite + React + TS frontend, deployed to GitHub Pages
```

## Addons

- **Valorant rank badge** — `/valorant/badge?name=Name&tag=Tag` displays a rank-tier badge
  image for the given Riot ID, looked up directly from HenrikDev's Valorant API (which allows
  cross-origin browser requests, unlike tracker.gg — no backend needed).

## Development

```bash
npm install

npm run dev -w apps/web

# lint / format (repo-wide)
npm run lint
npm run format
```

HenrikDev's API requires a key on every request (their docs say otherwise, but a keyless request
returns `401`). Get a free one from their Discord (linked at docs.henrikdev.xyz) and set it in
`apps/web/.env` locally (see `.env.example`), and as the `HENRIK_API_KEY` GitHub Actions secret
for the Pages build.
