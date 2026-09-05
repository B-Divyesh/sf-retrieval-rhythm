# Verify typed recall practice for self-learners — verification 3

**Verdict: FAIL**

Finding count: **7**. Untested public claim count: **19**.

Verified on 2026-09-05 at <https://retrieval-rhythm.sociobot.in>.

- Implementation reviewed: `898d8439eff9eeee1fede00efa5ed6706918b2c1`
  (`fix: enforce accessible touch targets`).
- Documentation candidate reviewed: `37d27024e604d054e5a55a0b82916d59ec09e8ad`.
  The only change between these commits is `.factory/handoff.md`.
- The live HTML, hashed JavaScript, hashed CSS, service worker, and manifest
  match the clean candidate build byte for byte.

The main recall workflow works. This candidate cannot be accepted because the
required demo sandbox and claims contract are absent, and five other required
site, accessibility, copy, and paid-state checks fail.

## Cold first-screen read

- Job: remember a small set of facts by typing answers and seeing why each fact
  returns. The screen communicates this.
- Audience: the brief names self-learners with a small fact set. The first
  screen does not name that audience.
- First action: **Add your first facts** is visible before scrolling on desktop
  and at 390 px. There is no **Try it with sample data** action.

The visible job headline is an `h2`. The only `h1` is the product name in the
header, so the page does not use a job-naming `h1`.

## Findings

### High-1 — the required sample demo and isolated sandbox do not exist

There is no **Try it with sample data** action on the first screen. `/demo`
returns HTTP 200 but renders the ordinary empty app. `?demo=1` also renders the
ordinary app. Neither entry point provides realistic sample facts, the
persistent **Demo — sample data, nothing is saved** label, **Reset demo**, or
**Start for real**.

Isolation also fails. In a fresh QA profile, I created one ordinary fact and
then opened `?demo=1`; the same IndexedDB database still contained that card.
The app has only the `retrieval-rhythm` database and `rhythm:*` local-storage
keys, with no `demo:` namespace. `.factory/demo.md` is missing.

All checks used disposable browser profiles. No existing user data was read or
changed.

### High-2 — public claims have no registry or claim tests

`.factory/claims.json` is missing and the repository contains zero
`@claim:<id>` tags. A clean checkout therefore exposes zero declared claim
commands. The normal unit and E2E suite passes, but those unregistered tests do
not satisfy the rule that each public claim has one named sandbox test.

The claim audit found 19 distinct untested claim groups in the live copy,
legal pages, or README:

1. Create, edit, and delete individual facts.
2. Add tab-separated facts in bulk.
3. Accept alternate answers and ignore case, accents, and punctuation.
4. Infer timing from correctness, response time, and retries.
5. Explain every next due time.
6. Show practice days, match rate, and upcoming work without diagnosis.
7. Store facts and reviews in IndexedDB with no account or remote sync.
8. Validate imported collections, facts, reviews, and their links.
9. Save and restore the snapshot from before an import.
10. Export a JSON backup.
11. Export CSV.
12. Keep the app and practice data available offline.
13. Install as a PWA.
14. Send no practice data to analytics, trackers, or remote services.
15. Provide one complete free collection with unlimited core recall.
16. Sell multiple collections and detailed history for $12 one-time.
17. Capture, strip, store, and verify a license at most daily with cached
    offline access.
18. Run recall without hard/easy confidence controls.
19. Use the published one-minute, eight-hour, and staged day intervals.

Some outcomes were independently observed during this verification. They
remain untested claims under the attached contract until they are declared and
tagged in `.factory/claims.json`.

### Medium-1 — the first screen and product headings do not meet the plain-copy contract

The first screen does not name the audience. Its job headline is not the page
`h1`, and the primary action does not state what appears after clicking.
Several product headings use brand metaphor instead of naming the section,
including **Rhythm clear**, **Your rhythm**, and **Keep more subjects in
rhythm**. The required `.factory/copy-audit.md` is missing.

### Medium-2 — routing, route titles, and the 404 path are incomplete

The app uses `#library`, `#progress`, and `#upgrade` for real product places.
In a brand-new browser page, each direct hash URL displays the Review landing
screen rather than its named place. Internal navigation never changes the
document title; it remains `Retrieval Rhythm — recall without rating yourself`
for Review, Library, Progress, and Rhythm+.

An unknown URL such as `/definitely-missing-verification-3` returns HTTP 200
and the ordinary app, including the current local state. There is no designed
404 document or response override. This is a missing required 404, not a
finding against an intentional HTTP 404.

Route changes focus `main`, not a new `h1`, and the app has no route-title live
announcement.

### Medium-3 — required metadata and the standard site skeleton are incomplete

The root page has no canonical link, Open Graph metadata, Twitter card,
apple-touch icon, SVG favicon, or product social image. `/sitemap.xml` returns
404 and `robots.txt` does not name a sitemap.

Privacy and Terms have useful content and correct route titles, but neither has
the common skip link or navigation. Their footers omit the required Privacy,
Terms, and build/version links. The app footer also omits **Built by Param
Factory** and a build identifier. The landing page does not include the
required privacy/non-goals and paid-tier sections in the standard order.

### Medium-4 — footer and legal-page targets are below 44×44 CSS pixels

At an exact 390×844 viewport, the visible footer targets measured:

- Privacy: 47.08×15 px
- Terms: 38.30×15 px

The legal routes repeat the issue. At 390 px, the Privacy back link is
187.17×20 and its email link is 171.89×20; the Terms back link is 187.17×20
and its email link is 174.77×20 px.

This violates the attached 44×44 baseline. The six targets named in
verification 2 now pass live: wordmark 178.72×44, Export JSON 102.73×44,
Export CSV 96.92×44, Import JSON 103.33×44, Edit 47.19×44, and Delete
64.72×44 px. The earlier specific repair is real, but the handoff claim that
all mobile targets were fixed is incomplete.

### Medium-5 — an invalid license leaves a false “Unlocked” navigation state

In a fresh profile, opening the app with an invalid `?license=` value stores
the token, strips it from the URL, and receives HTTP 200 with
`{"valid":false,"reason":"invalid"}` from the product verification endpoint.
The paid screen correctly relocks and shows **Buy Rhythm+**, but the header
continues to say **Unlocked**. `renderShell()` writes the label once and the
background verdict only rerenders `main`.

The paid state is therefore contradictory after a rejected license. The same
one-time header rendering can leave **Unlock +** stale after a valid license is
restored in the current session.

## Passing product evidence

### Clean checkout and declared commands

The clean checkout was detached at documentation commit `37d2702`, with a
clean worktree. Node was `v22.23.2` and npm was `10.9.8`.

- `npm ci`: PASS — 159 packages installed; zero vulnerabilities.
- `npm run lint`: PASS — zero warnings.
- `npm run typecheck`: PASS.
- `npm test`: PASS — 10/10 tests.
- `npm run build`: PASS — `dist/index.html` produced.
- `npm run test:e2e`: PASS — 12/12 Chromium tests across desktop and 390 px.
- Declared claim commands: none, because `.factory/claims.json` is absent.

Build sizes pass the static budgets: JavaScript 33,953 B raw / 11.08 KB gzip,
CSS 18,214 B raw / 4.95 KB gzip, no shipped font, 13,356 B mobile hero, and
46,760 B largest image.

### Normal, invalid, boundary, and recovery paths

- Added a realistic fact, cancelled an edit and deletion, and retained the
  fact. JSON and CSV downloads contained it; JSON included review history.
- Blank fact and recall forms showed specific live errors. Blank recall moved
  focus back to the answer input.
- A mismatch produced the one-minute reason. After making the disposable test
  card due, an accent-and-punctuation variant matched and produced the
  eight-hour-after-one-retry reason. Progress then showed one practice day,
  50% typed matches, and one fact.
- An orphan import was rejected without replacement. A valid import replaced
  the test data and exposed the restore action; restore brought the original
  fact back.
- A 100-fact bulk boundary run at 390 px rendered all 100 items with no
  horizontal overflow, no serious/critical axe result, and no console error.

### Desktop, mobile, keyboard, accessibility, and motion

- Fresh 1440×1000 and 390×844 contexts had no console or page errors. The
  populated mobile page had no horizontal overflow.
- Independent axe WCAG 2 A/AA scans found zero serious/critical issues on
  empty and populated desktop/mobile views.
- The skip link was first in the keyboard order; Enter focused `main`.
  Shortcut `2` opened Library. Focus rings were visible on controls.
- At 200% browser zoom, the viewport kept its 390 px layout width and the fact
  editor remained visible.
- Reduced motion computed transitions and animations to `0.01ms` and smooth
  scrolling to `auto`.
- `verify-url.sh` passed: HTTPS 200, `lang=en`, one `h1`, `main`, complete alt
  text/button names, and no console/page errors.

Screenshots are in `/work/.evidence/live-desktop-landing.png`,
`live-mobile-390-landing.png`, `live-desktop-populated.png`, and
`live-mobile-populated.png`.

### Offline, update, privacy, links, and delivery

- A fresh service-worker-controlled profile retained a new fact after an
  offline reload and showed **Offline · changes stay local**.
- A disposable host served a changed service worker. The app displayed **An
  update is ready**, Refresh activated the worker, control remained active,
  no worker remained waiting, and no console/page error occurred.
- The complete free live flow requested only the product origin. No tracker,
  remote font, CDN script, or analytics request was observed.
- Privacy and Terms return 200. Icons return 200. The Rhythm+ buy link returns
  303 to the hosted checkout. Legal mail links are explicit. The missing
  sitemap and missing 404 are recorded above.
- Root responses include CSP, Permissions-Policy, HSTS, Referrer-Policy, and
  `nosniff`. Hashed JS/CSS are one-year immutable; `sw.js` and the manifest are
  `no-cache`; the manifest MIME type is `application/manifest+json`.
- Billing CORS allows the product origin and omits the allow-origin header for
  an unrelated origin. A fresh 40-request invalid-license burst returned
  30×200 and 10×429; every 429 had `Retry-After: 4`. A request after five
  seconds recovered to 200. Successful verification responses used
  `Cache-Control: no-store`.

This is a static, account-free browser PWA. Backend tenant isolation, product
database restart persistence, backend health, CLI/library consumer install,
and desktop packaging do not apply. The only remote runtime route is the
product-specific billing verification path checked above. The brief does not
need an AI feature; bulk entry, import/export, and transparent local scheduling
are the relevant leverage points.

### Performance and deployment identity

Fresh production Lighthouse 12.8.2 mobile scores were Performance 99,
Accessibility 100, Best Practices 100, and SEO 100. FCP was 1.0 s, LCP 1.2 s,
TBT 10 ms, CLS 0.072, and total transfer 97 KiB. The earlier reported
Performance 100 is not exactly repeatable in this run, but the required budget
still passes.

Live and clean-build SHA-256 values matched:

- `index.html`: `c54d19390aad4e2905f413c2d7b7fdf3467bf6d811e89d9e62ee615f77e1dc76`
- JS: `4263ec42fbd2e87ebc332d995b331f3d65daed97d8f5701593e782989060f6c8`
- CSS: `d1befb3c05292ce08cfe9227801cac0bc2a8b37a5e76477748b60b9271ee6f1e`
- `sw.js`: `42e07f62124936c902c0634cb9dabb5f08acadf771ea3b1de2d123fd627c6554`
- manifest: `75d82b33e26b5f620d7f6b94caf27f023faffbb62a2b2f1a0d9a50e5940d8dca`

## Earlier finding disposition

- Verification 1 High-1, destructive orphan import: **fixed and independently
  passed**.
- Verification 1 High-2, missing verification rate limit: **fixed and
  independently passed**.
- Verification 1 Medium-1, CSP/Permissions-Policy and immutable caching:
  **fixed and independently passed**.
- Verification 1 Low-1, manifest MIME: **fixed and independently passed**.
- Verification 2 Medium-1, six named undersized mobile targets: **those six
  measurements pass**, but the broad “all targets” disposition is incomplete
  because the footer Privacy and Terms targets still fail.

## Acceptance result

**FAIL — 7 findings and 19 untested claims.** A successful command run does
not override the missing demo and claims contracts or the five additional
findings above.
