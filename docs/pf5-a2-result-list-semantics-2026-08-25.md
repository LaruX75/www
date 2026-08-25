# PF5-A2 Result-List Semantics Closure

Date: 2026-08-25
Branch: `pf5/a2-result-list-semantics`
Worktree: `/private/tmp/www-pf5-a2-result-list-semantics`

## Scope

Small accessibility closure for the shared global Modular Search result owner:

- navbar dialog on `/`
- full search page on `/haku/`
- full search page on `/en/search/`

Goal: replace the invalid shared `DIV > LI` result structure with a semantic list container while preserving the existing shared card presenter, spacing, and layout.

## Source Baseline Confirmed Before Change

Shared owner:

- `src/js/global-search-modular-ui.js`

Before patch, both mount branches emitted:

```html
<div class="site-search-page-results" data-search-modular-results></div>
```

Shared cards already came from `SearchResultPresenter.renderSharedCard()` as:

```html
<li class="find-explore-result ...">...</li>
```

That meant the shared global search surfaces mounted invalid `div > li` DOM.

Find & Explore was intentionally left untouched because it already uses semantic list wrappers in its own surfaces.

## Change Made

### 1. Shared owner changed to semantic list

File:

- `src/js/global-search-modular-ui.js`

Both branches now emit:

```html
<ul class="site-search-page-results" data-search-modular-results></ul>
```

No presenter change was required. Shared cards remain `<li>` items, which now land in a valid owner.

### 2. Obsolete CSS workaround simplified

File:

- `src/css/modules/_components.css`

Kept:

- `list-style: none`
- zero list padding/margin
- `display: grid`
- `gap: 1rem`

Removed:

- the old direct-child `> li` workaround that only existed to mask the former `div > li` structure

## Browser Verification That Passed

Focused regression suite added:

- `tests/pf5-a2-result-list-semantics.spec.js`

Verified against a built static site:

- navbar dialog on `/`
- `/haku/?q=tekoäly`
- `/en/search/?q=learning`

Assertions:

- `[data-search-modular-results]` is `UL`
- direct children are `LI`
- result count is non-zero
- list markers are suppressed
- left padding is zero
- grid spacing remains non-zero between result cards

Result:

- `3 passed (10.0s)`

This is the after-change browser proof for the shared global search surfaces.

## Other Checks

Passed:

- `git diff --check`
- `npm run test:unit`

## Build / Suite Blocker

Attempted:

- `npm run build:no-og`
- `CACHE_ONLY=true npm run build:no-og`

Observed on Tuesday, August 25, 2026 in this environment:

- Eleventy started, consumed cached fallbacks as expected, then remained running without completing.
- After `clean-output-dir`, `_site` did not recover to a finished built state before the process had to be stopped.

## Branch vs. Main Build Comparison

Compared:

- PF5-A2 worktree: `/private/tmp/www-pf5-a2-result-list-semantics`
- clean current-main worktree: `/private/tmp/www-pf5-a2-main-compare`

Git baseline:

- branch HEAD: `1d4a42def281eb5a5b7a61b4801151f51b858c18`
- `origin/main`: `1d4a42def281eb5a5b7a61b4801151f51b858c18`
- main had not moved since branch creation

Result:

- both worktrees followed the same `npm run build:no-og` path
- both worktrees reached the same fallback/cache-heavy Eleventy phase
- both then became log-silent while Eleventy stayed alive and CPU-active
- neither worktree produced a finished rebuilt `_site/pagefind/pagefind.js`
- neither worktree produced finished rebuilt `/haku/` or `/en/search/` output before the process had to be stopped

Measured comparison snapshot:

- PF5-A2: after about `01:32`, `node .../www-pf5-a2-result-list-semantics/node_modules/.bin/eleventy` remained `R` and used about `96.9%` CPU
- current-main: after about `01:40`, `node .../www-pf5-a2-main-compare/node_modules/.bin/eleventy` remained `R` and used about `77.3%` CPU

Classification:

- `LOCAL BUILD ENVIRONMENT BLOCKER — NOT PF5-A2 CAUSED`

## PR / CI State

PR:

- `#151` — `fix(a11y): use semantic lists for global search results`

Head commit pushed for CI:

- `978c7ac7d739cce53c5721d55c79c858d27d683e`

Observed on GitHub Actions on Tuesday, August 25, 2026:

- `Staging checks` — `in_progress`
- `Accessibility and navigation tests` — `in_progress`

Authoritative verification has therefore moved to CI, but CI was not yet green at the time of this note.

Because of that blocker, I could not truthfully claim completion of the remaining requested full-build-driven suites from the same final build state:

- PF5-H1A
- PF5-H1B
- PF5-G1
- PF5 hotfix regression suite
- `npm run test:a11y`

## Files Changed

- `src/js/global-search-modular-ui.js`
- `src/css/modules/_components.css`
- `tests/pf5-a2-result-list-semantics.spec.js`
- `docs/pf5-a2-result-list-semantics-2026-08-25.md`

## Current Assessment

Code change is small, targeted, and the new focused browser regression passed on all three required shared search surfaces.

Local build comparison against clean current-main indicates the unresolved `build:no-og` problem is baseline/environmental, not introduced by PF5-A2.

Authoritative merge readiness therefore depends on repository CI for the final full-build and broader regression coverage.

STATUS: BLOCKED

PF5-A2 RESULT LIST SEMANTICS STATUS: BLOCKED ON BUILD VERIFICATION
