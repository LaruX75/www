# Navbar search zero-result hotfix

**STATUS: READY FOR MERGE** (2026-08-26)

Suggested PR: `fix(search): restore navbar Pagefind results`
Branch: `hotfix/navbar-search-zero-results`
Base before hotfix: `c1642b807aaf834bcdcfaa7485b97bbf2774a2ef`
Implementation HEAD: `c1642b807aaf834bcdcfaa7485b97bbf2774a2ef` plus local hotfix changes

## Production symptom

On current `main`, navbar search in the modal could show zero results for ordinary queries that
were known to work immediately on the full search pages.

Exact production-style repro:

1. Open the navbar search dialog.
2. Search `tekoäly`, `mobiili`, or `oppiminen` on FI, or `learning` on EN.
3. Observe zero results in the navbar dialog.
4. Click the full-results link.
5. Observe the same query return results immediately on `/haku/?q=...` or `/en/search/?q=...`.

This proved:

- query transfer worked
- full-page Pagefind search worked
- the Pagefind corpus was not globally broken
- the regression was specific to navbar search execution/state

## Raw Pagefind API diagnostic

The hotfix was not started until raw Pagefind behavior was proven against the current built index.

Exact `await pagefind.filters()` evidence used for language pinning:

- FI `Kieli` value: `Suomi`
- EN `Kieli` value: `English`

Raw search matrix before the fix:

| Query | Raw no filter | Raw + Kieli | Navbar event before fix | Full-page event before fix |
| --- | ---: | ---: | ---: | ---: |
| `tekoäly` | 356 | 356 | 0 | 356 |
| `mobiili` | 162 | 162 | 0 | 162 |
| `oppiminen` | 179 | 179 | 0 | 179 |
| `learning` | 127 | 127 | 0 | 127 |

Representative raw search evidence:

- top raw results returned normal canonical content URLs
- raw result metadata/excerpts were non-empty
- no raw API failure, missing chunk, or broken language partition was observed

## Proven failure case

This regression was conclusively **Case A**:

- raw search `> 0`
- raw search with pinned `Kieli` `> 0`
- navbar results `= 0`
- full-page results `> 0`

Therefore the failure layer was the navbar adapter / query dispatch lifecycle, not:

- Pagefind corpus/index
- `Kieli` filter values
- PF5-A2 semantic `UL`/`LI` result owner change
- seed-token leak hotfix `#153`
- shared presenter rendering

## First failing layer

Navbar path:

`src/js/site-ui.js`
→ `initPagefindUi()`
→ `window.createModularSearchUI(...)`
→ first query dispatch

Full-page path:

`src/js/global-search-modular-ui.js`
→ shared factory bootstrap
→ initial query path
→ normal results

The first meaningful divergence was on cold-start navbar submit.

## Root cause

The navbar overlay initialized the shared Modular UI instance with no initial query and then tried
to push the first search programmatically via `focusInput(prefillQuery)` after mount.

That cold-start path differed from the full-page search path, which uses the factory's initial-query
flow. In practice:

- full-page initial query worked
- manual typing inside an already-open navbar dialog worked
- first navbar submit from the inline form produced zero results even though the query transferred
  correctly

So the bug was not "query missing"; it was "first query dispatched through the wrong lifecycle path".

## Fix

The hotfix is intentionally small and stays at the true owner:

- `src/js/site-ui.js`
  - adds build-lifetime navbar prefill state for the next dialog initialization
  - changes `initPagefindUi()` to accept an `initialQuery`
  - passes cold-start navbar queries through `getInitialQuery()`
  - avoids a second programmatic first-search dispatch by calling `focusInput('')` after cold-start
    initialization

No changes were made to:

- shared presenter output
- canonical URLs
- ranking
- Pagefind filter schema
- seed-token discovery model
- PF5-A2 list semantics

## FI / EN verification after the fix

After rebuilding `_site`, the same queries produced live navbar results on both locales.

FI:

- `tekoäly`
  - navbar summary: `356 tulosta haulla tekoäly`
  - navbar visible cards: `6`
  - full-results href: `/haku/?q=teko%C3%A4ly`
- `mobiili`
  - navbar summary: `162 tulosta haulla mobiili`
  - navbar visible cards: `6`
  - full-results href: `/haku/?q=mobiili`
- `oppiminen`
  - navbar summary: `179 tulosta haulla oppiminen`
  - navbar visible cards: `6`
  - full-results href: `/haku/?q=oppiminen`

EN:

- `learning`
  - navbar summary: `127 results for learning`
  - navbar visible cards: `6`
  - full-results href: `/en/search/?q=learning`

Full-page parity remained correct:

- `/haku/` returned the same FI counts with visible full-page result cards
- `/en/search/` returned the same EN count with visible full-page result cards

## First-open / reopen lifecycle

Verified behaviors after the fix:

- first open + search: works
- second query without closing: works
- close with `Escape` and reopen: works
- second search after reopen: works

The regression was specifically the first cold-start dispatch path, not an always-broken overlay.

## PF5-A2 interaction

PF5-A2 remained intact:

- `[data-search-modular-results]` still renders as `UL`
- direct result cards still render as `LI.find-explore-result`
- no evidence showed `results` events succeeding while cards failed to render

Because the broken case already failed at the result-event layer, the semantic `UL`/`LI` change was
not the cause.

## Seed-token hotfix interaction

PR `#153` remained intact and was not reverted.

This audit confirmed:

- raw text queries returned normal results independent of filter-only discovery
- presentation discovery still belongs to the filter model, not visible seed text
- no seed-token behavior was required for ordinary navbar text search

The navbar zero-result regression is therefore separate from the seed-token leak hotfix.

## Facet-count API observation

Raw Pagefind API inspection confirmed that `unfilteredResultCount`, `filters`, and `totalFilters`
can expose useful counting information beyond current pill semantics.

That is a separate follow-up only:

- deferred note: `PF5-A3 — Facet count semantics audit`

No facet-count redesign is included in this hotfix.

## Verification

Build / benchmark:

- `git diff --check` PASS
- `npm run build:no-og` PASS
- `node scripts/audit-search-quality-regression-benchmark.js` GREEN
- `blockingFindings: []`

Focused browser verification:

- `tests/pf5-hotfix-search-ui-regressions.spec.js` navbar submit coverage: PASS (`4 passed`)
- `tests/pf5-g1-navbar-modular-ui.spec.js` serial rerun: PASS (`24 passed`)
- `tests/pf5-h1a-search-shell.spec.js`: PASS (`14 passed`)
- `tests/pf5-hotfix-search-state-facet-counts.spec.js`: PASS (`9 passed`)
- `tests/pf5-a2-result-list-semantics.spec.js`: PASS (`3 passed`)

Unit tests:

- `npm run test:unit` currently reports 2 unrelated pre-existing failures outside this hotfix:
  - `tests/unit/buildDataLoaderMemoization.test.js`
  - `tests/unit/searchQualityRegressionBenchmark.test.js`

## Changed files

- `src/js/site-ui.js`
- `tests/pf5-hotfix-search-ui-regressions.spec.js`
- `docs/navbar-search-zero-results-hotfix-2026-08-25.md`
