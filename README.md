# 🍼 Milk Tracer

A cozy, offline-first web app to track how much milk your newborn drinks — **no login, no account, no cloud**. Everything lives locally in your browser via IndexedDB. Log a feed in a couple of taps and get a warm, graphics-rich dashboard: daily totals, waste tracking, time-of-day patterns, and a smart suggestion for how much to prepare next time to reduce waste.

Built for a tired parent holding a phone at the crib. 💤

## Features

- **Two-tap logging** — pick a bottle type (**small**: 30/60/90/120/150 ml, **big**: 60/120/180/240 ml) → pick the size → pick how much was drunk (¼, 2/4, ¾, 4/4). Timestamp and prepared / drunk / wasted ml are all recorded.
- **Rich analytics dashboard**
  - KPI cards: drunk & wasted today, feeds today, average per feed, average frequency, waste rate
  - **Drunk vs wasted** donut, **bottle-size distribution** pie
  - **Daily totals** stacked bars, **feeding-by-hour** pattern, **intake over time** line chart
  - Grand totals + full, editable feed history table
- **Adaptive recommendation** — predicts the next feed time and suggests a prepared volume (recent average appetite + small buffer, rounded up to a real bottle size) to cut habitual over-pouring.
- **All 24 official EU languages**, auto-detected from the browser, with a manual override.
- **Dark mode** (auto / light / dark) — gentle on the eyes for night feeds.
- **JSON export / import** — back up and restore your data.
- **Installable PWA** — add to home screen, works fully offline.
- **Cozy AI-generated art** — warm nursery illustrations, icons and background (generated with `gpt-image-1`).

## Tech stack

React + TypeScript + Vite · Tailwind CSS · Dexie (IndexedDB) · Recharts · date-fns · vite-plugin-pwa · Playwright.

## Getting started

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # preview the production build
npm run test:e2e   # Playwright screenshot validation of every screen
```

## Project layout

```
src/
  db/db.ts            Dexie schema + feed/backup helpers
  lib/stats.ts        aggregation + adaptive recommendation math
  lib/presets.ts      bottle sizes & fraction options
  i18n/               24-locale catalog + auto-detection
  components/         LogFeed flow, Dashboard, charts, table, data panel
tests/                Playwright screenshots + IndexedDB seeding
scripts/              art generation (gpt-image-1) + optimization
```

## Art pipeline

Cozy illustrations are generated from prompts and optimized to small WebP/PNG:

```bash
node scripts/gen-art.mjs        # → art-src/*.png  (needs OPENAI_KEY)
node scripts/optimize-art.mjs   # → public/art/*.webp + PWA icons
```

The optimized assets are committed, so the app builds without regenerating them.

## Privacy

All data stays on your device in IndexedDB. Nothing is uploaded anywhere.
