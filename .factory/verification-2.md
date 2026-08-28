# Retrieval Rhythm — independent verification 2

**Verdict: FAIL**

Verified on 2026-08-28 for candidate commit
`bc76ef50e0f5676194471208fe7fd7d6c3c0941e` (`main`) and production URL
<https://retrieval-rhythm.sociobot.in>.

The prior external rate-limit blocker is resolved: a fresh 150-request burst
started returning HTTP 429 after 30 accepted requests and supplied
`Retry-After: 4`. The live PWA matches the candidate and the core product works
end to end. This candidate nevertheless fails the attached non-negotiable
accessibility baseline because several visible mobile targets are smaller than
44×44 CSS px (Medium-1).

## Clean checkout and repository gates

- Started with a clean checkout exactly at the candidate; `git status` was
  clean and `origin/main` pointed to the same commit.
- Runtime: Node `v22.23.2`, npm `10.9.8`.
- `npm ci`: PASS — 159 packages installed from the lockfile, 160 audited, zero
  vulnerabilities.
- `npm run lint`: PASS — ESLint, zero warnings.
- `npm run typecheck`: PASS — `tsc --noEmit`.
- `npm test`: PASS — 10/10 Vitest scheduler, answer, and import-integrity tests.
- `npm run build`: PASS — the exact production command (`tsc && vite build`)
  produced `dist/`.
- `npm run test:e2e`: PASS — 10/10 Playwright tests across desktop and 390×844
  mobile, including persistence, keyboard navigation, axe, offline reload,
  orphan-import rejection, valid replacement, and import rollback.
- Package/consumer install is not applicable: this is a static browser PWA,
  not a published library or CLI. Backend health/concurrency/build endpoints
  are likewise not applicable. There is no sign-in, so Entra authority
  validation is not applicable.

## Independent product exercise

- Created, edited, and deleted facts; cancellation preserved the fact and the
  named confirmation allowed deletion. Blank prompt/answer and a malformed
  bulk line produced specific recoverable errors.
- Added multiple tab-separated facts and a 100-fact boundary set. All 100 were
  persisted and rendered at 390 px with document width exactly 390 px.
- A punctuation/accent-insensitive alternate answer matched. A normal first
  match showed the one-day reason. A wrong answer showed “returns in 1 minute”;
  after making that card due in the test profile, the correct retry showed
  “Matched after 1 retry” and an eight-hour return. This is transparent timing,
  not a learning diagnosis.
- Blank recall submission announced “Type an answer before checking.” and
  returned focus to the answer input. Review results persisted after reload;
  Progress showed the expected practice day, 100% match rate, and fact count.
- JSON and CSV downloads contained the entered facts; JSON included the review
  array. Invalid/orphan imports were rejected before replacement, and a valid
  replacement could be restored from the automatically saved prior snapshot.
- Free export remained available. Rhythm+ clearly states `$12 one-time`, links
  only to the Sociobot checkout endpoint, offers token restore, and links the
  live Privacy and Terms pages. A query-string license was stored under
  `sb_license:retrieval-rhythm`, stripped from the URL, and verified against
  the Sociobot endpoint; an invalid verdict locked the paid state.

## Accessibility, responsive behavior, and motion

- Desktop 1440×1000 and mobile 390×844 had no horizontal document overflow,
  clipped core controls, console errors, page errors, or failed product
  requests in the tested flows. Visual inspection confirmed the product-
  specific luminous-glass treatment and readable mobile stacking.
- Axe WCAG 2 A/AA: zero serious/critical findings on populated desktop,
  populated 100-fact mobile, and the live empty state. Lighthouse accessibility
  was 100.
- Semantics: `lang=en`, descriptive title, one H1, main landmark, labelled
  controls, image alt text, ordered/list structures, and live error/status
  regions. `/opt/fleet/lib/verify-url.sh` reported HTTP 200, 633 ms load, one
  H1, main present, no missing alt text/unlabelled buttons, and zero console or
  page errors.
- Keyboard-only smoke: `2` opened Library; Tab reached collection and Prompt;
  typing, Tab, and Enter created a fact. The skip link and numbered navigation
  passed the repository E2E test. Focus used a visible 3 px amber outline.
- Under `prefers-reduced-motion: reduce`, transition and animation duration
  computed to `1e-05s`, iteration count to `1`, and smooth scrolling to `auto`.
- A 200% text-resize smoke retained Library, prompt/answer fields, export, and
  navigation without document-level horizontal overflow at 390 px.
- **Target-size baseline: FAIL.** See Medium-1.

## PWA and local-first behavior

- Chromium parsed the live manifest without errors. It has name/short name,
  standalone display, scoped versioned start URL, matching theme/background,
  real 192×192 and 512×512 icons, and a maskable 512 icon.
- A live reload became service-worker controlled with cache `rhythm-v2`.
  After adding “Offline persistence probe,” `context.setOffline(true)` plus a
  reload at `/#library` retained the fact, rendered the complete app, displayed
  “Offline · changes stay local,” and had no console/page errors.
- Update path: on a disposable host serving the unchanged production build, a
  byte-changed service-worker response installed as `waiting`; the in-app
  “An update is ready.” toast appeared. Activating its Refresh action removed
  the waiting worker, activated the new worker, reloaded the app, and retained
  service-worker control with no errors.
- IndexedDB contains collections/cards/reviews (and import backups); empty live
  use made no data request. State survived refresh and tab/profile persistence
  checks.

## Privacy, network, response policy, and deployment identity

- A fresh live session requested only the product origin: document, hashed JS
  and CSS, responsive local WebP art, and manifest. Source inspection found no
  analytics, trackers, remote fonts, CDN scripts, WebSockets, or sync API.
  License entry is the sole product path to `api.sociobot.in`.
- The live root supplies restrictive CSP, Permissions-Policy, HSTS,
  `Referrer-Policy: strict-origin-when-cross-origin`, and
  `X-Content-Type-Options: nosniff`. CSP allows connections only to self and
  the Sociobot API.
- Hashed JS/CSS use `Cache-Control: public, max-age=31536000, immutable`;
  `sw.js` and the manifest use `no-cache`; manifest MIME is
  `application/manifest+json`.
- Billing verification responses use `Cache-Control: no-store`. CORS preflight
  for the production origin returned that exact `Access-Control-Allow-Origin`.
- The live deployment matches the candidate production build byte-for-byte:
  `index.html` SHA-256 `1ce9f217…d13f14`, JS `4263ec42…60f6c8`, CSS
  `6a0de49b…66ceec`, service worker `42e07f62…c6554`, and manifest
  `75d82b33…0d8dca` all matched local `dist/`.

## Rate limiting

Endpoint tested:
`GET https://api.sociobot.in/api/v1/products/retrieval-rhythm/verify`.

A concurrent burst of 150 distinct invalid licenses completed in 1,112 ms:

- 30 × HTTP 200 invalid verdict (`Cache-Control: no-store`)
- 120 × HTTP 429
- first observed 429 at submitted request index 30 (the 31st request)
- every 429 had `Retry-After: 4` and body `Too Many Requests! Wait for 4s`

After five seconds, a fresh request recovered to HTTP 200. The required
rate-limit gate therefore passes, and the earlier deployment-only failure is
not reproducible.

## Performance and budgets

- Build: 33,953 B JS (11.08 KB gzip), 18,183 B CSS (4.95 KB gzip), no shipped
  font, 13,356 B mobile hero WebP, 46,760 B largest image. All static budgets
  pass.
- Fresh Lighthouse 12.8.2 mobile against production: Performance 98,
  Accessibility 100, Best Practices 100, SEO 100; FCP 998 ms, LCP 1,062 ms,
  TBT 113 ms, CLS 0.078, Speed Index 1,103 ms, total transfer 99,559 B.

## Defects

### Medium-1 — visible mobile targets violate the 44×44 px baseline

At a 390×844 viewport, computed target rectangles included:

- wordmark/home link: 178.7×34 px
- Export JSON: 102.7×40 px
- Export CSV: 96.9×40 px
- Import JSON label: 103.3×40 px
- every Edit button: approximately 47.2×40 px
- every Delete button: approximately 64.7×40 px

The hidden file input itself was excluded because its visible label is the
operative target. The failure comes from `.quiet, .file-button { min-height:
40px }`, `.icon-button { min-height: 40px }`, and the unconstrained 34 px
wordmark link in `src/style.css`. This is repeated across the primary Library
management workflow and directly violates the attached accessibility and
design contracts requiring all touch/click targets to be at least 44×44 CSS
px. Increase the visible hit areas to 44 px or more and remeasure on 390 px
mobile. No Critical, High, or other Medium defects were found.

## Retest

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Then remeasure every visible Library and header target at 390×844, rerun axe
and Lighthouse, repeat live offline/update checks, verify deployment hashes,
and repeat the 150-request invalid-license burst.
