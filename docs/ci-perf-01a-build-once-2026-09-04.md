# CI-PERF-01A — Build once

**Status:** READY FOR CI VALIDATION
**Date:** 2026-09-04
**Baseline SHA:** `419f47581151cf5397076a6d5a89003bf4061990`
**Branch:** `perf/ci-build-once`
**Scope:** eliminate the duplicate Eleventy build in PR CI

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. This is a CI/performance/maintainability change, not an architecture reopen.

## Problem

Two PR-triggered workflows both ran `npm run build:no-og` on every pull request:

- `.github/workflows/staging.yml` — job `build-and-verify`: checkout → setup-node → npm ci → build → all SEO/i18n/sitemap/feed checks → upload artifact → (staging-only deploy)
- `.github/workflows/accessibility-navigation.yml` — job `playwright`: checkout → setup-node → npm ci → **build again** → install Playwright → run accessibility/navigation/contrast tests

Total: **2 × Eleventy build per PR**, ~5 minutes each of duplicated work.

## Before

```
staging.yml
└─ build-and-verify (single job)
     ├─ npm run build:no-og        # (1)
     ├─ verification checks
     └─ upload artifact, deploy on push:staging

accessibility-navigation.yml
└─ playwright (single job)
     ├─ npm run build:no-og        # (2) — DUPLICATE
     ├─ install Playwright
     └─ run tests
```

Eleventy build:no-og runs per PR: **2**

## After

```
staging.yml (unified)
├─ build
│    ├─ npm ci
│    ├─ npm run build:no-og        # SINGLE BUILD
│    └─ upload _site artifact
├─ verify              (needs: build)
│    ├─ download _site artifact
│    └─ all SEO/i18n/sitemap/feed checks
├─ playwright          (needs: build, if: pull_request)
│    ├─ download _site artifact
│    ├─ install Chromium
│    └─ run accessibility/navigation/contrast tests
└─ deploy              (needs: [build, verify], if: staging)
     ├─ download _site artifact
     └─ deploy to www-staging
```

Eleventy build:no-og runs per PR: **1**

## What was removed

- `.github/workflows/accessibility-navigation.yml` — deleted. Its `playwright` job is now `staging.yml → playwright`, consuming the shared `_site` artifact instead of rebuilding.
- Duplicate `npm ci` + `build:no-og` step from the accessibility workflow — replaced by artifact download.

## What remained unchanged

Coverage is preserved end-to-end. The `verify` job runs every existing check:
- i18n / SEO check
- SEO health check
- No null OG images
- robots.txt exists / blocks GPTBot
- Homepage robots meta / description / canonical / hreflang
- No null OG image on homepage
- Sitemap exists and contains key URLs (with lastmod format regex)
- FI + EN feeds exist
- Canva section on presentations pages
- EN pages have English skip-link

The `playwright` job runs the same three specs against the same artifact:
- `tests/accessibility.spec.js`
- `tests/navigation.spec.js`
- `tests/contrast.spec.js`

No test content was changed. `PLAYWRIGHT_USE_STATIC_SERVER=true` still serves `_site` via `python3 -m http.server 4173 --directory _site` — the downloaded artifact lands at exactly the path the runner expects.

## Measured build count

| Event | Build:no-og runs — Before | Build:no-og runs — After |
| --- | ---: | ---: |
| Pull request to main | 2 | **1** |
| Push to staging | 1 | **1** |

## Path prefix handling

The `ELEVENTY_PATH_PREFIX` env is now conditional:
- `push: staging` → `/www-staging/` (unchanged — preserves the existing staging-deploy semantics that live at `LaruX75/www-staging` under a sub-path)
- `pull_request` → empty (prefix-free build). This matches what the previous `accessibility-navigation.yml` used and what Playwright expects when navigating root-relative URLs against the static-served artifact.

The verify checks are prefix-insensitive (canonical URLs go through `absoluteUrl` filter which doesn't apply `pathPrefix`; sitemap loc uses raw `item.url`), so they pass under both build modes.

## YOUTUBE_API_KEY

Previously supplied only to the accessibility-navigation build. Now supplied to the unified `build` job so the single build has the same env as before. It remains optional — the build tolerates a missing secret (falls back to cached data).

## Staging behavior

Preserved. The `deploy` job:
- runs only on `push: staging` (guarded by `if: github.ref == 'refs/heads/staging'`)
- depends on both `build` and `verify` (fail-closed: bad build or failing verification blocks deploy)
- downloads the same artifact the verify job already validated
- uses the same `peaceiris/actions-gh-pages@v4` target (`LaruX75/www-staging`, `gh-pages`, `force_orphan: true`)

## Failure path

- `build` fails → `verify`, `playwright`, `deploy` all skip (they `needs: build`)
- `verify` fails → `deploy` skips (`needs: [build, verify]`)
- artifact upload missing → downstream jobs fail loudly on the `download-artifact` step; no silent green

## Deferred: CI-PERF-01B

Not in scope for this workstream:
- path-aware / changed-files test selection
- light vs. full CI matrix
- conditional Playwright based on file paths
- conditional SEO checks based on touched surfaces
- main-only full suite policy
- custom CI orchestrator scripts

Those belong to a potential `CI-PERF-01B — path-aware test selection` workstream.

## Files changed

| File | Change |
| --- | --- |
| `.github/workflows/staging.yml` | Restructured single job → 4 jobs (`build` / `verify` / `playwright` / `deploy`) with artifact reuse |
| `.github/workflows/accessibility-navigation.yml` | **Deleted** — its Playwright job is now `staging.yml → playwright` consuming the shared artifact |
| `docs/ci-perf-01a-build-once-2026-09-04.md` | **New** — this document |

## AC1 impact

**Zero.** `Architecture Closure 1.0 = CLOSED / GREEN / MAIN`. No production content changed. No architectural surface touched. Pure CI workflow restructuring.
