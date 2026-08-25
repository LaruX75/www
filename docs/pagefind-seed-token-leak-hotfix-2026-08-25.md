# Pagefind seed-token leak hotfix — Find & Explore excerpts

**STATUS: CLOSED / GREEN / MAIN** (2026-08-25)

PR: `#153 — fix(search): keep Find & Explore seed tokens out of Pagefind excerpts`
Implementation HEAD: `b7bf0b1dce9da0d1a9586c2aa06ba232adad8999`
Merge commit: `6ee91750189ebc3a58e0e6cfc8dd5ade06261ff3`
Base before merge: `47072646cbac40e6b6da5b11ded138a26702c516`

## Root cause

`Find & Explore` presentation discovery depended on a synthetic searchable seed token:

- `__find_explore_presentations__`

That token was injected into queryable Pagefind presentation custom-record content. When topical user
queries such as `webinaari` or `tekoäly` surfaced those records, Pagefind could include the internal
seed token in user-visible excerpts.

## Implementation

The hotfix keeps Find & Explore discovery but removes the need for queryable seed text:

- `scripts/_lib/presentationPagefind.js`
  - removes `__find_explore_presentations__` from presentation custom-record `content`
- `src/js/find-explore.js`
  - replaces seed-query activation with filter-only discovery
  - queryless active states now use Pagefind `null` query + existing `FindExplore:{kind}` filter
- `src/_utils/publicationsFindExplore.js`
  - removes publication `seedText`
- `src/_utils/thesesFindExplore.js`
  - removes thesis `seedText`
- page templates / mount attributes
  - stop emitting `findExploreSeedQuery`

The internal discovery identity still exists in filters (`FindExplore:presentations` etc.), but it no
longer lives in excerptable text.

## Why the leak is closed

- Pagefind filters are exact-match metadata, not user-visible excerpt text.
- Presentation discovery still resolves through `FindExplore:presentations`.
- Because `__find_explore_presentations__` is no longer searchable page/custom-record body text, it
  cannot be emitted in result snippets.

## Before / after evidence

Before baseline (`docs/pagefind-search-quality-baseline-2026-08-25.md`):

- `webinaari` and `tekoäly` could surface `__find_explore_presentations__` in visible excerpts
- benchmark finding code: `search-leak-token-visible` (`P1`)

After hotfix on rebased branch and merged `main`:

- benchmark `status`: `GREEN`
- `blockingFindings`: `[]`
- `leakTokenResult.findings`: `[]`
- `webinaari`: visible token occurrences `0`
- `tekoäly`: visible token occurrences `0`

## Production verification

Main deployment workflow for merge commit `6ee91750189ebc3a58e0e6cfc8dd5ade06261ff3`:

- GitHub Actions workflow: `Build and Deploy`
- build: **PASS** in `7m41s`
- deploy: **PASS**
- smoke: **PASS**

Live production search verification on Tuesday, August 25, 2026:

- `/haku/?q=webinaari`
  - top 20 visible results inspected
  - visible `__find_explore_presentations__` occurrences: `0`
  - visible `__find_explore_` occurrences: `0`
  - visible `find_explore_` occurrences: `0`
  - result list rendered as `UL` with direct `LI.find-explore-result` children
  - list styling remained clean: `list-style-type: none`, `padding-left: 0px`
- `/haku/?q=tekoäly`
  - top 20 visible results inspected
  - visible `__find_explore_presentations__` occurrences: `0`
  - visible `__find_explore_` occurrences: `0`
  - visible `find_explore_` occurrences: `0`
  - result list rendered as `UL` with direct `LI.find-explore-result` children
  - list styling remained clean: `list-style-type: none`, `padding-left: 0px`

Production HTML verification from `www.jarilaru.fi`:

- `/tutkimus/`
  - `data-find-explore-kind="researchContext"` present
  - `data-find-explore-kinds="publications,theses,writings,presentations"` present
  - no `data-find-explore-seed-query` attribute emitted
- `/julkaisut/`, `/opinnaytteet/`, `/kirjoitukset/`
  - canonical local archive targets still present in SSR output
  - Find & Explore query controls and shared results mounts still present
- `/mediassa/`
  - media browser markup present
  - archive section still excluded from Pagefind via `data-pagefind-ignore`
- `/` and `/en/search/`
  - search-nav/search-page config present
  - `fullSearchPageUrl` still points to `/haku/` and `/en/search/`
  - `data-pagefind-body` still present on the full-search shell

## Presentation discovery parity

Representative presentation discovery parity remains intact for:

- `webinaari`
- `tekoälylukutaito`
- `mobiilioppiminen`
- `slideshare`
- `canva`

The filter-only discovery model is now the active production behavior:

- production Research Find & Explore markup no longer emits `data-find-explore-seed-query`
- presentation discovery remains driven by existing `FindExplore:presentations` filter metadata
- no hidden seed token is required in user-facing/custom-record excerpt content

The benchmark still reports presentation-quality findings as green. Remaining benchmark drift is
limited to known non-blocking ranking issues, not seed leakage.

## Current-main test reconciliation

Two test updates were required because current `main` already changed behavior independently of this
hotfix:

- `tests/f4-research-find-explore.spec.js`
  - allow canonical detail URLs with optional `?returnTo=...` suffix from O1 navigation decoration
- `tests/unit/searchQualityRegressionBenchmark.test.js`
  - align assertions with the benchmark contract:
    - `P1` leaks/internal URLs are blocking
    - known exact-title rank slippage remains a documented non-blocking `P2`

## Build / verification

- `npm run build:no-og`
  - **PASS**
  - Eleventy: `Copied 273 Wrote 1471 files in 255.08 seconds`
- Pagefind postbuild summary
  - `ok: true`
  - `htmlDocumentsIndexed: 1458`
  - `presentationScopeCustomRecords: 79`
- `node scripts/audit-search-quality-regression-benchmark.js`
  - **GREEN**
  - no seed-token excerpt leaks
  - `blockingFindings: []`
- Focused Playwright sweep
  - 62 passed, 4 skipped, 3 failed on first broad run
  - failures classified as:
    - F4 canonical URL expectation: current-main test drift, not production regression
    - navbar FI zero-result cases: unstable / unrelated to touched production files
  - isolated rerun: 11 passed, 1 failed (`PF5-G1` repeat-open FI timing case), reinforcing that the
    remaining navbar issue is not specific to the seed hotfix

## CI and current-main reconciliation

- PR `#153` required checks:
  - `Staging checks` — **PASS**
  - `Accessibility and navigation tests` — **PASS**
- Current-main compatibility retained:
  - universal `data-pagefind-body`
  - O1 `?returnTo=` decoration
  - PF5-A2 result-list semantics
  - build-loader memoization from PR `#152`

## Remaining non-blockers

- known local FI navbar repeat-open flake remained intermittently reproducible during focused local reruns
- required GitHub accessibility/navigation CI was green, so GitHub CI remained authoritative for merge
- deferred Media `P2` benchmark issue remains unrelated:
  - exact English media-title discoverability is still weaker than desired
  - not a blocker for this seed-token leak closure

## Scope guard

No changes to:

- SearchResultPresenter
- ranking tuning
- media workstreams
- canonical content model
- Pagefind seed-token handling outside this leak closure
