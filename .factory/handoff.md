# Retrieval Rhythm — verification 3 handoff

Work order: `retrieval-rhythm-verify-3`

Live URL: <https://retrieval-rhythm.sociobot.in>

Verification date: 2026-09-05

**Verdict: FAIL — 7 findings and 19 untested public claims.**

The full independent report is `.factory/verification-3.md`. Product code was
not changed.

## Candidate identity

- Implementation reviewed:
  `898d8439eff9eeee1fede00efa5ed6706918b2c1`
- Documentation candidate reviewed:
  `37d27024e604d054e5a55a0b82916d59ec09e8ad`
- The only change between them is the prior handoff report.
- Live `index.html`, JS, CSS, service worker, and manifest matched the clean
  build byte for byte.

## Blocking findings

- High: no one-click sample, no persistent demo controls, no isolated demo
  namespace, and no `.factory/demo.md`.
- High: no `.factory/claims.json`, zero `@claim:` tests, and 19 public claim
  groups without declared sandbox commands.
- Medium: first screen omits the audience, uses the product name as `h1`, and
  retains metaphor headings; `.factory/copy-audit.md` is absent.
- Medium: hash deep links fail on fresh load, route titles do not change, and
  unknown paths return the ordinary app with HTTP 200 instead of a designed
  404.
- Medium: canonical/social metadata, sitemap, legal-page skeleton, landing
  sections, and build/version footer details are incomplete.
- Medium: mobile footer and legal-page links are only 15–20 CSS px high.
- Medium: a rejected license relocks paid content but leaves the header saying
  **Unlocked**.

## What passed

- Clean checkout: `npm ci`, lint, typecheck, 10/10 unit tests, production
  build, and 12/12 E2E tests.
- Normal recall, invalid forms, mismatch/retry recovery, progress, JSON/CSV
  export, orphan rejection, valid replacement, and import restore.
- A 100-fact mobile boundary with no overflow, serious/critical axe result, or
  console error.
- Fresh desktop and 390 px layouts, keyboard navigation, reduced motion, 200%
  zoom, independent axe scans, and `verify-url.sh`.
- Fresh-profile offline persistence and a disposable changed-service-worker
  update/Refresh cycle.
- Same-origin privacy for the free workflow, legal and checkout links, security
  headers, caching, manifest MIME, billing CORS, 429/Retry-After, and recovery.
- Lighthouse mobile: 99 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; FCP 1.0 s, LCP 1.2 s, TBT 10 ms, CLS 0.072.
- The six targets named in verification 2 are now at least 44 px live. The two
  footer targets above prevent the broader claim from passing.

This is a static local-first PWA, so backend tenant/database restart/health and
CLI/library consumer checks do not apply. All browser work used disposable
profiles; no existing user data was read or changed.

## Reproduce the declared repository gates

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

There are no claim commands to reproduce until `.factory/claims.json` and
matching `@claim:<id>` tests are added.
