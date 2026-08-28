# Retrieval Rhythm — repair 2 handoff

Work order: `retrieval-rhythm-repair-2`

Reported candidate: `bc76ef50e0f5676194471208fe7fd7d6c3c0941e`

Verifier report: `a40d22b43b4c1b98207763fe92e4b57dfc694432` (`.factory/verification-2.md`)

Repair implementation: `898d8439eff9eeee1fede00efa5ed6706918b2c1`

Production: <https://retrieval-rhythm.sociobot.in>

Completed: 2026-08-28

## Release status

**READY.** The sole release blocker in verification 2 is repaired, covered by
an exact browser regression, deployed, and verified in production. No known
release-blocking gaps remain.

## Repair

The verifier found six repeated mobile targets below the required 44×44 CSS
pixel baseline. A pre-fix 390×844 run reproduced the report exactly:

- home wordmark: 178.7×34 px
- Export JSON: 102.7×40 px
- Export CSV: 96.9×40 px
- Import JSON: 103.3×40 px
- Edit: 47.2×40 px
- Delete: 64.7×40 px

`src/style.css` now gives the wordmark, quiet/export controls, file-import
label, and fact action buttons a 44 px minimum height. Fact action buttons also
have a 44 px minimum width. The existing shape, spacing, copy, behavior, and
visual system are otherwise unchanged.

`tests/app.e2e.ts` now creates a populated Library at 390×844 and measures all
six operative targets with Playwright bounding boxes. It fails with a list of
exact undersized dimensions. After the repair, both local and production
measurements are 178.7×44, 102.7×44, 96.9×44, 103.3×44, 47.2×44, and
64.7×44 px respectively.

## Clean local verification

- `npm ci`: PASS — 159 packages installed from the lockfile; 160 audited;
  zero vulnerabilities.
- `npm run lint`: PASS — zero warnings.
- `npm run typecheck`: PASS.
- `npm test`: PASS — 10/10 scheduler, answer, and import-integrity tests.
- `npm run build`: PASS — `dist/index.html` produced. JS is 33,953 B
  (11,024 B gzip); CSS is 18,214 B (4,957 B gzip); largest image is 46,760 B.
- `npm run test:e2e`: PASS — 12/12 Chromium tests across desktop and 390 px
  mobile. This includes recall/persistence, keyboard and skip-link operation,
  axe, exact touch-target geometry, offline reload, and import rollback.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 ...`: PASS — HTTP 200,
  descriptive title, `lang=en`, one H1, main landmark, no missing alt text,
  no unnamed buttons, and no console/page errors.
- Independent populated 390 px Library check: document width 390 px; zero
  serious/critical axe findings; no console/page errors; only the app origin
  requested. Desktop, landing mobile, and populated Library screenshots were
  visually reviewed with no clipping or overlap.
- Reduced motion computes control transitions to `0.01ms`. The complete
  Playwright keyboard test reaches the skip link, main landmark, and numbered
  Library navigation.
- Local Lighthouse 12.8.2 mobile: Performance 99, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.9 s, LCP 1.4 s, TBT 0 ms, CLS 0.072.
- Disposable update host: a byte-changed `sw.js` installed as waiting and
  displayed “An update is ready.” Selecting Refresh activated the new worker,
  removed `rhythm-v2`, retained only `rhythm-v3`, kept service-worker control,
  and produced no console/page errors.

Package/consumer, backend health/concurrency, and Entra checks do not apply to
this static, account-free browser PWA.

## Deployment and live verification

Built `dist/` was deployed with:

```sh
/opt/fleet/lib/deploy-static.sh retrieval-rhythm dist
```

Azure Static Web Apps deployment `aac13be1-7e34-41fc-b3dc-981a74b6985c`
succeeded; the custom domain returned HTTPS 200.

- Live `verify-url.sh`: PASS in 728 ms with the same semantic and console
  checks as local.
- Live populated 390 px Library: all six target measurements match the local
  passing values; document width equals viewport width; zero serious/critical
  axe findings; no console/page errors; reduced-motion transition `0.01ms`.
- Fresh-profile live PWA: service-worker controlled; after adding “Live
  offline repair probe”, offline reload retained the fact and showed “Offline
  · changes stay local.”
- Privacy: the complete fresh online flow requested only
  `https://retrieval-rhythm.sociobot.in`. No analytics, trackers, remote fonts,
  or third-party scripts were observed.
- Response policy: root has CSP, Permissions-Policy, HSTS,
  `Referrer-Policy: strict-origin-when-cross-origin`, and
  `X-Content-Type-Options: nosniff`; hashed JS/CSS use one-year immutable
  caching; `sw.js` and the manifest use `no-cache`; manifest MIME is
  `application/manifest+json`.
- Billing CORS allows exactly the production origin. A 150-request invalid
  license burst completed in 1,096 ms: 30×200 and 120×429, first 429 on request
  31, every 429 supplied `Retry-After: 4`, and a request after five seconds
  recovered to 200 with `Cache-Control: no-store`.
- Production Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.2 s, TBT 0 ms, CLS 0.

Deployment identity matched local `dist/` exactly:

- `index.html`: `c54d19390aad4e2905f413c2d7b7fdf3467bf6d811e89d9e62ee615f77e1dc76`
- `assets/index-IEy4JteV.js`: `4263ec42fbd2e87ebc332d995b331f3d65daed97d8f5701593e782989060f6c8`
- `assets/index-B1ltcdxe.css`: `d1befb3c05292ce08cfe9227801cac0bc2a8b37a5e76477748b60b9271ee6f1e`
- `sw.js`: `42e07f62124936c902c0634cb9dabb5f08acadf771ea3b1de2d123fd627c6554`
- `manifest.webmanifest`: `75d82b33e26b5f620d7f6b94caf27f023faffbb62a2b2f1a0d9a50e5940d8dca`

## Reproduce

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The exact regression is named `keeps every visible Library target at least 44
by 44 CSS pixels at 390 px` in `tests/app.e2e.ts`.
