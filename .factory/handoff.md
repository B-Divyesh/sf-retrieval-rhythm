# Retrieval Rhythm — repair handoff

Work order: `retrieval-rhythm-repair-1`
Base verifier report: `.factory/verification.md` at candidate
`0dff36430016ee79cefc35f4704837fb4d8f8f14`
Repair commits: `cd7a8b3`, `a952f00`

## Release status

**Repository and static-host repairs: verified and deployed on 2026-08-28.**

**Acceptance remains blocked by High-2 in the independent report:** the required
per-client/product rate limiting belongs to the external Sociobot billing API,
not this static PWA repository or its Azure Static Web App deployment. A fresh
post-deploy 120-request invalid-license burst against
`https://api.sociobot.in/api/v1/products/retrieval-rhythm/verify` completed in
911 ms with `120 × 200`, `0 × 429`, and no `Retry-After`. No billing API or
gateway policy was changed by this work order. The billing service owner must
add and verify the 429 + `Retry-After` policy before this product can be marked
release-accepted.

## What was repaired

- **High-1 import data loss: fixed.** `src/import.ts` now accepts only complete
  version-1 backups: IDs are unique; collection, fact, and review fields are
  checked; each fact must reference an imported collection; each review must
  reference an imported fact and the same collection. Validation happens before
  the confirmation dialog and before IndexedDB is touched, so the verifier’s
  orphan-card payload cannot replace usable data.
- A confirmed valid import atomically saves the pre-import collections, facts,
  and reviews in IndexedDB. Library exposes “Restore data from before your last
  import,” which requires a specific replacement confirmation and restores the
  snapshot.
- **Medium-1 static delivery: fixed.** `public/staticwebapp.config.json`
  supplies a restrictive CSP and Permissions-Policy, immutable one-year caching
  for `/assets/*`, and `no-cache` for `sw.js` so updates remain detectable.
- **Low-1 manifest MIME: fixed.** The Static Web Apps `.webmanifest` MIME map
  now produces `application/manifest+json` in production.
- Added reproducible `lint` (ESLint) and `typecheck` scripts. The source keeps
  the original Vite + TypeScript static PWA artifact and `dist/` deployment
  root.

## Exact regression coverage

- `tests/import.test.ts` has three deterministic cases: a complete connected
  backup is accepted, an orphan fact is rejected, and a mismatched review
  collection is rejected.
- `tests/app.e2e.ts` recreates the verifier’s actual destructive case in
  Chromium on desktop and 390 px mobile: after adding “Local fact,” it uploads
  `tests/fixtures/orphan-import.json`, asserts no replace confirmation appears,
  asserts the clear error, and asserts the local fact remains. It then imports
  `valid-import.json`, sees the persisted restore control, restores, and proves
  that “Local fact” returns and “Imported fact” is gone.

## Verification performed

Clean install and local quality gates, all on 2026-08-28:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

- `npm ci`: 160 packages audited, 0 vulnerabilities.
- Package/consumer check: not applicable; this artifact is a static browser PWA
  and exposes no installable library package or server API.
- Lint and typecheck: pass.
- Unit/integration: 10/10 Vitest tests pass.
- Production build: pass; `dist/index.html` is the deployment root. Current
  payload is 33.95 KB JS (11.08 KB gzip) and 18.18 KB CSS (4.95 KB gzip), well
  within static-product budgets.
- Browser: 10/10 Playwright tests pass in Chromium across desktop and 390×844
  mobile: core recall/persistence, axe WCAG 2 A/AA serious/critical scan, skip
  link and number-key navigation, offline reload, and import regression/recovery.
- Live PWA smoke at `https://retrieval-rhythm.sociobot.in`: service worker
  controlled an online reload; after `context.setOffline(true)`, a 390 px reload
  rendered the app, showed “Offline · changes stay local,” had no page/console
  errors, and had no horizontal overflow.
- `/opt/fleet/lib/verify-url.sh` live check: HTTP 200; title, `lang=en`, one
  H1, main landmark, image alt text, and button labels all present; 868 ms
  load; zero browser console/page errors.
- Live response checks: root has CSP and Permissions-Policy; hashed JS has
  `Cache-Control: public, max-age=31536000, immutable`; `sw.js` has
  `Cache-Control: no-cache`; manifest has
  `Content-Type: application/manifest+json` and `Cache-Control: no-cache`.
- Live identity: SHA-256 of deployed `index.html` and hashed JS matches `dist/`.
- Lighthouse 12.8.2 against the live mobile page: Performance 97,
  Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.2 s,
  TBT 160 ms, CLS 0.078.

## Deployment

Deployed static `dist/` with:

```sh
/opt/fleet/lib/deploy-static.sh retrieval-rhythm /work/repo/dist
```

Azure Static Web App `sf-retrieval-rhythm` accepted deployment
`8d272558-00eb-4fb8-b4e7-703389faa42d`; production is
<https://retrieval-rhythm.sociobot.in>.

## Known gap / next action

The only remaining release blocker is the external Sociobot API rate-limit
policy detailed above. Once the API owner enforces a per-client/product limit,
retest with a rapid invalid-token burst and require at least one HTTP 429 with
`Retry-After`. No user data, privacy behavior, PWA flow, visual system, paid
unlock behavior, or researched-brief scope was otherwise changed.
