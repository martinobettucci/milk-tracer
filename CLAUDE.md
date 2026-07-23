# Milk Tracer — agent guide

Cozy, offline-first newborn feeding tracker. React + TypeScript + Vite + Tailwind,
Dexie (IndexedDB, no backend), Recharts, vite-plugin-pwa. All UI art is
AI-generated (OpenAI `gpt-image-1`) — **do not use emoji or icon fonts in the UI;
generate artwork instead** and reference the optimized WebP under `public/art/`.

## Layout
- `src/db/db.ts` — Dexie schema (v2), feed/breast/reclaim/backup helpers.
- `src/lib/stats.ts` — bottle + breast analytics, recommendation, active-bottle timer.
- `src/lib/presets.ts` — bottle sizes, fractions, breast slots, timer options.
- `src/i18n/` — 24 EU locales; `en` is the full canonical catalog, others are
  `Partial<Catalog>` and fall back to English. Add new keys to `StringKey` and to
  `en` at minimum (FR/IT translated for prominent strings).
- `src/components/` — `LogFeed`, `Dashboard`, `ActiveBottleCard`, `BreastSection`,
  `FeedTable`, `DataPanel`, `Wizard`, and `charts/`.
- `scripts/gen-art.mjs` → `art-src/*.png` (raw, git-ignored; needs `OPENAI_KEY`).
- `scripts/optimize-art.mjs` → `public/art/*.webp` + PWA icons (committed).
- `scripts/wizard-shots.mjs` → `public/wizard/*.webp` real in-app screenshots.
- `scripts/wizard-insights-gif.mjs` → `public/wizard/insights.gif` — a square,
  looping scroll tour of the stats dashboard (the wizard "insights" slide).

## Onboarding wizard — KEEP SCREENSHOTS CURRENT
`src/components/Wizard.tsx` shows a first-launch tour (re-openable via the "Guide"
button in the bottom bar). Each functionality slide pairs an **AI artwork** badge
with a **real in-app screenshot** from `public/wizard/`.

**Whenever the UI of a wizard-covered screen changes (log flow, breast flow,
active-bottle timer, or the dashboard), regenerate the wizard screenshots so the
tour never shows stale UI:**

```bash
npm run build
npm run preview &            # serve the fresh build
npm run wizard:shots         # rewrites public/wizard/*.webp
npm run wizard:gif           # rewrites public/wizard/insights.gif (square stats tour)
kill %1
```

If you add or reorder wizard slides, update `SLIDES` in `Wizard.tsx`, the
`shot(...)` calls in `scripts/wizard-shots.mjs`, and the `wizN_*` i18n keys
together, then rerun the capture above and commit the new `public/wizard/*.webp`.

## Validation & deploy
- `npm run build` then `npm run screenshots` (Playwright, `tests/screenshots.spec.ts`)
  seeds IndexedDB via `window.milkDb` and screenshots every screen.
- Netlify deploy goes through the MCP `deploy-site` proxy. The emitted
  `--proxy-path` contains a double slash (`…netlify.app//proxy/…`) that this
  environment's egress proxy turns into a 404 — **replace it with a single slash**
  before running the `npx @netlify/mcp` command. Slim the tree first
  (move `art-src/`, `screenshots/`, `dist/`, `test-results/` aside) to keep the
  upload small. Site id: `db0e2252-8034-4ee8-8c7a-69178bd86c4f` (milk-tracer.netlify.app).

## Conventions
- Warm palette: the app-wide accent is `milk-*` (coral) and neutrals are `stone`/
  `cream`; charts use the warm palette in `src/components/charts/palette.ts`.
- Disable Recharts animations (`isAnimationActive={false}`) so charts render fully
  in screenshots.
