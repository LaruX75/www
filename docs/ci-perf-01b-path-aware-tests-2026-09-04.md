# CI-PERF-01B — Path-aware test selection

**Status:** READY FOR REVIEW
**Date:** 2026-09-04
**Baseline SHA:** `e72d3d178cbd91787ce7ce3b7c34801a4b0cf6f8`
**Branch:** `perf/ci-path-aware-tests`
**Scope:** run scoped Playwright when a PR touches only `src/opetus/**/*.md`; keep full regression for anything else

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. CI-PERF-01A (single-build artifact reuse) is preserved. This is a CI/performance change, not an architecture reopen.

## Problem

After CI-PERF-01A, Playwright still ran the full `accessibility.spec.js + navigation.spec.js + contrast.spec.js` suite on every PR — even a single-file content change under `src/opetus/`. That's ~10–15 min of browser regression for a PR whose blast radius is one course page.

## Before

```
staging.yml (PR)
├─ build       (single Eleventy build → _site artifact)
├─ verify      (SEO/i18n/sitemap/feed/homepage checks)
└─ playwright  (needs: build, if: PR)
     └─ ALWAYS runs:
          tests/accessibility.spec.js
          tests/navigation.spec.js
          tests/contrast.spec.js
```

Every PR paid the full-regression cost regardless of blast radius.

## After

```
staging.yml (PR)
├─ build
├─ verify                        (unchanged — cheap, universal invariants)
└─ playwright
     ├─ classify step:
     │    diff base..head → is every changed path src/opetus/**/*.md?
     │       yes → course_content_only=true
     │       no  → course_content_only=false  (fail-safe default)
     │
     ├─ if course_content_only == true:
     │    npx playwright test tests/course-page-01.spec.js
     │
     └─ else:
          npx playwright test tests/accessibility.spec.js \
                              tests/navigation.spec.js \
                              tests/contrast.spec.js
```

## Path classification

The classification lives inline in the Playwright job (no separate job overhead). It uses `git diff --name-only $BASE_SHA $HEAD_SHA` from the PR's own event payload.

**LOW-RISK allowlist (course_content_only=true):**
- `src/opetus/**/*.md` — course-page markdown files

**HIGH-RISK / triggers full regression (course_content_only=false):**
- Anything NOT matching `src/opetus/**/*.md`, including:
  - `src/opetus/**/*.11tydata.js`, `src/opetus/**/*.png` (non-md files inside the same directory)
  - `src/_includes/**` — shared Nunjucks templates and partials
  - `src/_data/**` — data pipeline
  - `src/_utils/**` — shared utilities
  - `src/js/**` — client JavaScript
  - `src/css/**` — styles
  - `.eleventy.js` — build config
  - `package.json`, `package-lock.json` — dependency changes
  - `.github/workflows/**` — workflow logic changes
  - All other content directories (`src/fi/**`, `src/en/**`, `src/blog/**`, `src/presentations/**`, `src/publications/**`, `src/opinnaytteet/**`, `src/politics/**`, `src/portfolio/**`, `src/media/**`, `src/training/**`, `src/api/**`, `src/data/**`, `src/curated/**`, `src/images/**`, `src/img/**`, `src/julkaisut/**`, `src/legacy-redirects/**`)
  - Any repo-root path, any unknown directory, any hidden file
  - Any file added under a brand-new directory that wasn't in the allowlist

The allowlist is deliberately narrow: single-directory, .md only. Adding a new low-risk allowlist entry is a conscious future workstream, not a passive default.

## Fail-safe behavior

- If `git diff` fails to produce output for any reason → `course_content_only=false` → **full regression**.
- If the shell classification step exits non-zero → still `course_content_only=false` because `set +e` and empty output default. Full regression runs.
- If any changed path fails the allowlist regex (e.g., unknown directory, new file type) → **full regression**.
- Unknown ⇒ full. Ambiguous ⇒ full. Empty diff ⇒ full.

The fallback direction is always toward *more* testing, never less. Unknown paths never sneak through as content-only.

## What still runs for every PR

- **build** — Eleventy build → `_site` artifact (CI-PERF-01A invariant preserved: exactly one build per PR)
- **verify** — every existing check: i18n/SEO, SEO health, no null OG images, robots.txt, homepage robots/description/canonical/hreflang, no null OG on homepage, sitemap + key URLs + lastmod format, FI+EN feeds, Canva section, EN skip-link
- **playwright classify step** — always runs the classification to produce a decision (cheap; git diff only)
- **Either** the scoped course spec **or** the full regression — never neither

## What is skipped for low-risk content PRs

- `tests/accessibility.spec.js`
- `tests/navigation.spec.js`
- `tests/contrast.spec.js`

These stay in place, unmodified, but only execute when the PR carries risk they can catch (shared templates, JS, CSS, config, data, or unknown paths).

## Expected CI reduction for the common case

Baseline (any PR before CI-PERF-01B):

| Metric | Value |
| --- | ---: |
| Playwright step runtime | ~5–7 min |
| Chromium install | ~30 s |
| npm ci | ~10 s |
| Job total | ~6–8 min |

After CI-PERF-01B for a course-content-only PR (measured on `course-page-01.spec.js`, which contains ~18 focused route/HTML assertions and one JS-off browser context):

| Metric | Expected |
| --- | ---: |
| Playwright step runtime | ~30–60 s |
| Chromium install | ~30 s (unchanged — still needed) |
| npm ci | ~10 s |
| Job total | ~2–3 min |

Full regression runtime is unchanged for any HIGH-RISK PR.

## Deletion / simplification assessment

None performed. This workstream **adds** conditional test-selection logic to the Playwright job; it doesn't remove any spec, verification, or step. `accessibility.spec.js`, `navigation.spec.js`, and `contrast.spec.js` remain in the repo and run when needed. No refactoring of shared configuration was needed. Adding conditional branching to a single job is smaller than introducing a separate classify job, so the workflow topology stays flat (4 jobs, same as CI-PERF-01A).

## Scenario matrix

| Change touches | course_content_only | Playwright runs |
| --- | :---: | --- |
| Only `src/opetus/foo.md` | `true` | `course-page-01.spec.js` |
| Only `src/opetus/**/*.md` (multiple) | `true` | `course-page-01.spec.js` |
| `src/opetus/**/*.md` + `src/_includes/base.njk` | `false` | full regression |
| Only `src/_includes/**` | `false` | full regression |
| Only `src/js/**` | `false` | full regression |
| Only `src/css/**` | `false` | full regression |
| `.eleventy.js` | `false` | full regression |
| `package.json` / `package-lock.json` | `false` | full regression |
| `.github/workflows/staging.yml` | `false` | full regression |
| Unknown / brand-new directory | `false` | full regression |
| `docs/**` only | *N/A — workflow skipped entirely by `paths-ignore`* | none |

## Files changed

| File | Change |
| --- | --- |
| `.github/workflows/staging.yml` | Playwright job: added `fetch-depth: 0` on checkout, added inline classify step, replaced single "Run tests" step with two conditional steps (scoped vs. full) |
| `docs/ci-perf-01b-path-aware-tests-2026-09-04.md` | **New** — this document |

## Verification

- `git diff --check` — clean
- YAML validated with `js-yaml` — 4 jobs (`build`, `verify`, `playwright`, `deploy`), correct `needs` graph and `if` conditions preserved
- `build:no-og` appears exactly **once** across all workflows (CI-PERF-01A invariant)
- Playwright step order confirmed: checkout → classify → setup-node → npm ci → download artifact → install Chromium → conditional test steps
- Fail-safe logic reviewed inline: shell uses `set +e`; any unrecognized path stays `false`; empty diff stays `false`
- Actual acceptance test is the PR's own CI (this PR itself touches `.github/workflows/staging.yml` → HIGH-RISK → full regression, which validates the fallback path)

## Stopping point

This workstream stops at path-aware selection between two Playwright modes. Not in scope:
- Caching / dependency-install optimization (potential CI-PERF-01C)
- Test matrix expansion or splitting
- Adding new content-only allowlist entries beyond `src/opetus/**/*.md`
- Changing verify-job coverage
- Extending classification to unit or integration tests

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.
