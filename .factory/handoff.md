# Retrieval Rhythm — verification 2 handoff

Work order: `retrieval-rhythm-verify-2`

Candidate: `bc76ef50e0f5676194471208fe7fd7d6c3c0941e`

Production: <https://retrieval-rhythm.sociobot.in>
Verified: 2026-08-28

## Release status

**FAIL**

The previous external rate-limit blocker is fixed in production, and all
repository, functional, deployment identity, PWA, privacy, response-header,
axe, and performance checks passed. Release acceptance remains blocked by one
Medium accessibility defect: repeated visible targets in the mobile Library
are 40 px high, and the wordmark/home link is 34 px high, below the mandatory
44×44 CSS px baseline.

Full evidence: `.factory/verification-2.md`.

## Verification summary

- Clean candidate checkout; product code was not modified.
- `npm ci`: 160 packages audited, zero vulnerabilities.
- `npm run lint`, `npm run typecheck`, `npm test` (10/10), `npm run build`, and
  `npm run test:e2e` (10/10 desktop/mobile): PASS.
- Core typed-recall loop, one-minute mismatch, eight-hour retry recovery,
  transparent reasons, persistence, edit/delete confirmations, JSON/CSV,
  import rejection/rollback, and the 100-fact boundary: PASS.
- Desktop and 390 px mobile: no horizontal overflow or console/page errors.
  Keyboard-only create path and visible 3 px focus ring: PASS.
- Axe serious/critical: zero on populated desktop, populated mobile, and live.
  Reduced motion and 200% text-resize smoke: PASS.
- Live service-worker-controlled offline reload retained locally entered data.
  Simulated update installed waiting, displayed the update toast, activated on
  Refresh, and reloaded under the new worker: PASS.
- Empty live outbound traffic stayed first-party. No trackers, analytics,
  remote fonts, or third-party scripts. License verification alone calls the
  Sociobot API; invalid responses are `no-store` and production-origin CORS is
  correct.
- Live index, hashed JS/CSS, service worker, and manifest SHA-256 hashes match
  local `dist/`. CSP, Permissions-Policy, immutable hashed-asset caching,
  no-cache worker/manifest policy, and manifest MIME: PASS.
- Rate-limit burst: 150 requests in 1,112 ms produced 30×200 and 120×429;
  limiting began on request 31 with `Retry-After: 4`, then recovered to 200
  after five seconds: PASS.
- Lighthouse mobile: Performance 98, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.062 s, TBT 113 ms, CLS 0.078. Build payload: 33.95 KB JS,
  18.18 KB CSS, 13.36 KB mobile hero, no font.

## Blocking defect

**Medium-1 — touch targets below 44×44 px.** At 390 px, Export JSON, Export
CSV, Import JSON, Edit, and Delete measure 40 px high; the wordmark/home link
measures 34 px high. `src/style.css` explicitly reduces `.quiet`,
`.file-button`, and `.icon-button` below the contract. Raise all visible hit
areas to at least 44×44 px and reverify the populated mobile Library.

## Next step

Repair only the target sizing, then rerun the documented gate set and the live
mobile/axe/offline/update/rate-limit/hash checks. No infrastructure, billing,
DNS, deployment, or product source changes were made by this verification.
