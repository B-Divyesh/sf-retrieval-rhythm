# Retrieval Rhythm

Retrieval Rhythm is an offline-first recall practice for self-learners with a small, important fact set. Instead of asking people to grade every card as “hard” or “easy”, it observes a typed match, response time, and retries, then states why the fact is due next.

Live product: <https://retrieval-rhythm.sociobot.in>

## What v1 does

- Creates, edits, and deletes prompt/answer facts, individually or from tab-separated lines.
- Accepts semicolon-separated alternate answers and ignores case, accents, and punctuation.
- Schedules from typed correctness, answer latency, and retries with a visible “Due because…” reason.
- Shows practice days, match rate, and upcoming work without streak pressure or learning diagnoses.
- Stores collections, cards, and review events in IndexedDB; no account or remote sync.
- Imports JSON backups and exports JSON or CSV for every user, including the free tier.
- Installs as a PWA and keeps the application and practice data available offline.
- Offers a $12 one-time Rhythm+ license for multiple collections and detailed review history.

The free tier has one full collection and unlimited core recall. Data portability and accessibility are never paid features. The researched brief mentioned paid local export, but the paid-unlock safety contract requires core export to stay free; v1 follows that stricter rule.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Vite prints the local URL. No environment variables or external service are required for the free app. License verification uses the production Sociobot endpoint only after a license is present.

## Test and build

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm test` runs deterministic scheduler, answer-matching, and import-integrity tests. `npm run typecheck` runs TypeScript without emitting files; `npm run lint` runs ESLint. `npm run test:e2e` builds the production app and runs the full recall, persistence, keyboard, accessibility, 390 px mobile, offline, and import-recovery flows in Chromium. Playwright is pinned to 1.58.2.

The exact deploy command is:

```sh
npm run build
```

Static output lands in `dist/`, with `dist/index.html` at its root. Deploy that directory as-is; the service worker and manifest use root-relative URLs.

## Data and scheduling

IndexedDB database `retrieval-rhythm` contains `collections`, `cards`, and append-only `reviews` stores. A first quick match returns in one day; later quick matches grow through 3, 7, 14, 30, and 60 days. A thoughtful match uses smaller steps. A mismatch returns in one minute, and a match after a retry returns in eight hours. This transparent heuristic is practice support, not a diagnosis or retention guarantee.

JSON import validates every collection, fact, review, and their links before it can ask for confirmation. A confirmed replacement also preserves the previous local snapshot until you restore it from the Library. Export before clearing site data or moving browsers.

## Product files

- `.factory/brief.json` — researched opportunity and scope.
- `.factory/design.md` — product-specific visual system, art prompt, and provenance.
- `.factory/handoff.md` — verification record and known gaps.
- `assets/src/` — original generated landscape source and hand-authored icon source.
- `public/privacy/` and `public/terms/` — data and purchase policies.

## License

MIT. See [LICENSE](LICENSE).
