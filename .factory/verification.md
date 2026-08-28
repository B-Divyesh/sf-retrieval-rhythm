# Retrieval Rhythm — independent verification

**Verdict: FAIL**

Verified on 2026-08-28 for candidate commit
`0dff36430016ee79cefc35f4704837fb4d8f8f14` (`main`) and production URL
<https://retrieval-rhythm.sociobot.in>.

The production deployment matches the candidate exactly for the app shell and
the tested primary PWA flow works. This candidate must not be accepted because
it has destructive import validation and its product-unlock API did not rate
limit a 120-request burst.

## Environment and repository gates

- Clean checked-out `main` at the candidate commit; only pre-existing ignored
  `graphify-out/` was present. Installed from the lockfile with `npm ci` on
  Node `v22.23.2` / npm `10.9.8`; 59 packages audited, zero vulnerabilities.
- `npm test`: PASS — 7/7 Vitest scheduler/answer tests.
- `npm run build`: PASS — TypeScript plus Vite produced `dist/`.
- `npm run test:e2e`: PASS — 6/6 Chromium tests across desktop and 390 px
  mobile, including the project's own offline test.
- There is no separate lint or typecheck script. `npm run build` executes
  `tsc`; `npm run` exposes only dev, build, preview, test, and test:e2e.
- Independent Lighthouse mobile run against the production build preview:
  Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s,
  LCP 1.4 s, TBT 0 ms, CLS 0.078.
- Build payload: JS 30,735 B (10.32 KB gzip per Vite), CSS 18,183 B (4.95 KB
  gzip), largest shipped image 46,760 B. The 200 KB JS / 50 KB CSS budgets
  pass.

## Independent functional and accessibility checks

- Desktop 1440x1000 and mobile 390x844: PASS. Mobile document width equalled
  viewport width (390 px); visual review found no clipped controls. The
  product-specific landscape, readable hierarchy, touch-size controls, and
  footer/legal links render as intended.
- Keyboard: PASS. First Tab lands on the skip link with a visible 3 px amber
  focus outline; Enter works; shortcut `2` opens Library. Empty answer
  recovery announces “Type an answer before checking.” and returns focus to
  the answer input.
- Core loop: PASS. Added a fact, rejected blank answer, recorded a mismatch
  with the one-minute transparent reason, made it due again, then recovered
  with a correct typed match and the visible eight-hour-after-one-retry
  reason. JSON and CSV downloads included the tested fact; source inspection
  confirms the JSON payload also includes its review array.
- Invalid input: PASS for missing prompt/answer, missing bulk delimiter, blank
  review answer, invalid JSON backup, and cancellation/confirmation boundary.
- Import data integrity: **FAIL**; see High-1 below.
- Axe WCAG 2 A/AA serious/critical scan: zero findings on empty, Library,
  Review, and 390 px mobile views. Semantics checked: `lang=en`, one h1,
  one main landmark, title, labels, and alt text.
- Reduced motion: PASS. Under `prefers-reduced-motion: reduce`, button
  transition duration computed as `0.01ms` and no animation loop was present.
- Local preview and live deployment: zero browser console errors, page errors,
  or failed requests in the tested empty/product flows.

## PWA, privacy, and deployment evidence

- Local and live: PASS for service-worker-controlled offline reload. Cache
  `rhythm-v2` controlled the page; an offline reload retained the app and
  showed “Offline · changes stay local.”
- Update path: PASS. Against a disposable unchanged-build test host, a
  deliberately changed `sw.js` caused `updatefound`, installed a waiting
  worker, and displayed the app's “An update is ready. Refresh” toast. No
  product source was modified for this check.
- Empty live session outbound requests were only to
  `retrieval-rhythm.sociobot.in` for the document, image, JS, and CSS. Source
  inspection found no analytics, trackers, remote fonts, or third-party
  scripts. Data uses IndexedDB; only an entered license causes a Sociobot API
  verification request. No sign-in exists, so Entra tenant validation is not
  applicable.
- `OPTIONS` to the billing verify endpoint allowed only
  `https://retrieval-rhythm.sociobot.in` for this origin. Invalid-license GET
  responses are `Cache-Control: no-store`.
- Deployment identity: PASS. SHA-256 matched candidate `dist/index.html`,
  `assets/index-D5LQ6cEG.js`, `assets/index-DjPjmDuO.css`, `sw.js`, and
  `manifest.webmanifest` exactly.
- Deployment response headers include HSTS, `Referrer-Policy:
  strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`.
  CSP/Permissions-Policy are absent; hashed static assets are delivered with
  `Cache-Control: public, must-revalidate, max-age=30`, not long-lived
  immutable caching. See Medium-1.

## Defects

### High-1 — confirmed import can discard usable local data

`src/main.ts` accepts a JSON payload when each card merely has an ID,
collection ID, prompt, answer, and finite due timestamp. It does not ensure a
card's `collectionId` exists in `collections` before calling destructive
`replaceAll`.

Reproduction in a clean browser profile:

1. Add a local fact, then import and confirm this structurally accepted backup:
   one collection with id `only`, and one complete card with
   `collectionId: "missing"`.
2. The app says `Imported 1 facts.`.
3. The selected imported collection shows zero facts; both the original fact
   and imported orphan are inaccessible in the UI.

This violates the product contract that imports validate before replacing
local data and is destructive without an automatic recovery copy. Validate
collection records and all card/review referential integrity before the
confirmation/replacement transaction; reject the payload without changing
local storage.

### High-2 — required API rate limiting absent/unverified

The product uses `GET https://api.sociobot.in/api/v1/products/retrieval-rhythm/verify`.
Fresh evidence: one invalid token returned 200 with `{valid:false}`. A
concurrent burst of 120 distinct invalid-token verification requests completed
in 1,148 ms and returned **120 x HTTP 200**, **0 x 429**, and no
`Retry-After`. The observed limit threshold is therefore **not reached at
120 rapid requests** (or is absent). The required gate is specifically 429
plus Retry-After for an API burst; it fails for this deployed endpoint.

Add effective per-client/product rate limiting to the verification endpoint
and repeat the burst test until a 429 response with `Retry-After` is observed.

### Medium-1 — static delivery does not meet immutable-cache policy and lacks CSP

Live `/assets/index-D5LQ6cEG.js`, `/assets/index-DjPjmDuO.css`, and `/sw.js`
all use `Cache-Control: public, must-revalidate, max-age=30`; the hashed JS/CSS
assets should be long-lived immutable. The live response also has no
Content-Security-Policy or Permissions-Policy. Configure host headers, for
example immutable cache for hashed assets and an app-appropriate restrictive
CSP, then reverify.

### Low-1 — manifest MIME type is generic

`/manifest.webmanifest` is served as `application/octet-stream` rather than
`application/manifest+json`. Chromium still installed/used the service worker
path in this verification, but the host should serve the standard manifest
media type for interoperable PWA delivery.

## Retest command set

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Then verify production at the URL above, including a fresh-profile offline
reload, update toast, malformed/orphan import attempt, headers, and a rapid
invalid-license verification burst.
