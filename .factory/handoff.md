# Retrieval Rhythm — build handoff

Work order: `retrieval-rhythm-build-1`

Completed: 2026-08-28

Artifact: static offline PWA (`dist/`)

## What shipped

- A complete local-first recall loop: create a fact, type an answer, infer correctness from normalized text, measure response time/retries, persist the review, and show a one-screen “Due because…” explanation.
- A transparent fixed scheduler with quick, thoughtful, retry, and mismatch paths. The product never asks for a confidence grade and never describes the heuristic as a learning diagnosis.
- A usable 20–100 item library: individual add/edit/delete, tab-separated bulk entry, semicolon answer alternatives, due summaries, confirmed deletion, JSON import validation, JSON backup, and CSV export.
- IndexedDB persistence for collections, facts, and append-only review events. State survives refresh, tab close, and installed/offline use.
- Progress showing distinct practice days, typed match rate, upcoming recalls, and a non-punitive 28-day rhythm view.
- Free tier with one complete collection and unlimited review. Rhythm+ ($12 one-time) adds multiple collections and the detailed review timeline.
- Sociobot paid unlock contract: hosted checkout URL, query-string license capture and cleanup, `sb_license:retrieval-rhythm` storage, cached optimistic offline access, at-most-daily verification, invalid-license relock, and paste-to-restore.
- PWA manifest, 192/512 maskable-capable icons, versioned service-worker app-shell cache, offline fallback, cache-first static assets, network-first navigation, and an update-ready toast.
- Product-specific luminous glass visual system, responsive 390 px treatment, reduced-motion fallback, designed focus states, semantic landmarks, one H1, and keyboard shortcuts (`1` Review, `2` Library, `3` Progress outside fields).
- Original generated recall landscape with source/provenance, 720 px (13 KB) and 1200 px (47 KB) WebP outputs. Hand-authored rhythm icon. No remote fonts, scripts, analytics, or copyrighted deck content.
- Privacy and terms pages, researched brief, full README, and MIT license.

## Verification

Run from a clean clone:

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Results on 2026-08-28:

- `npm test`: 7/7 Vitest tests passed (normalization, alternate answers, typo tolerance, mismatch retry, quick recall, retry recall, due formatting).
- `npm run build`: passed; `dist/index.html` is at the deploy root.
- Production bundle: 30.74 KB JS / 10.32 KB gzip; 18.18 KB CSS / 4.95 KB gzip; no font payload; largest hero 46.76 KB.
- `npm run test:e2e`: 6/6 Playwright tests passed in Chromium—full add/review/persist flow, desktop + 390 px, axe WCAG A/AA scan, and explicit `context.setOffline(true)` reload.
- `/opt/fleet/lib/verify-url.sh`: passed against the production preview; HTTP 200, title present, `lang=en`, one H1, main landmark, zero missing alt text, zero unlabeled buttons, zero console/page errors. Measured load: 538 ms locally.
- Lighthouse 12.8.2 mobile, production preview: Performance 100, Accessibility 100, Best Practices 100, SEO 100. FCP 1.0 s, LCP 1.4 s, CLS 0, total blocking time 0 ms.
- Visual review completed at 1440×1000 and 390×844. Generated art checked for text artifacts, seams, unintended marks, brands, and misleading content; none found.

## Decisions and deviations

- The brief mentioned paid local export, but the attached paid-unlock contract explicitly forbids gating core data export. JSON backup and CSV export are therefore free; Rhythm+ is limited to multiple collections and advanced review history.
- A one-minute mismatch interval is used instead of silently rotating an in-memory queue. This makes the retry timing durable across refreshes and plainly visible.
- There is no AI generation, deck sharing, note editor, account, analytics, or sync, matching the brief’s non-goals and local-first constraint.

## Release notes / known gaps

- The factory must register/configure the `retrieval-rhythm` product and its return URL in the Sociobot billing engine before checkout can complete. No product ID or payment-provider credential is embedded in this repository.
- Local-only storage intentionally does not synchronize across devices. Users should use the free JSON export/import path to move or back up data.
- The app reports practice patterns only. The timing heuristic has not been independently validated as a measure of long-term retention.

## Deploy

Build command: `npm run build`

Publish directory: `dist/`

The static host should serve `dist/index.html` at `/`. `/privacy/`, `/terms/`, `manifest.webmanifest`, `robots.txt`, and `sw.js` are already present in the build output. No infrastructure, DNS, billing, or secrets were changed by this work order.
