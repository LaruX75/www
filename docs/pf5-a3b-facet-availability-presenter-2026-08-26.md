# PF5-A3B Facet Availability Presenter

STATUS: CLOSED / GREEN / MAIN

Date: 2026-08-27
PR: `#157`
PR title: `fix(search): add deterministic facet availability presenter`
Implementation branch: `pf5/a3b-facet-availability-presenter`
Implementation HEAD: `cb138190cd2c1181f12a53c9355ee680adbaae6b`
Merged at: `2026-08-27T05:13:29Z`
Merge commit: `e3d1beda2605f9375245b9afa4ed80db709ca3af`
Resulting `main`: `e3d1beda2605f9375245b9afa4ed80db709ca3af`
Baseline `main` before A3B: `848951a5b4db3a9563820e1498c8322738f1686e`

## Goal

Make `/haku/` and `/en/search/` expose only meaningful secondary facet choices while keeping Pagefind as the filtering engine and without introducing new canonical data or public JSON.

## Old Dataflow

Baseline before A3B:

`Pagefind search state`
-> `Pagefind filters / totalFilters`
-> visible secondary Pagefind `FilterPills`
-> H1B / A3A DOM visibility layer
-> result DOM

Important baseline properties:

- Secondary groups were user-facing Pagefind `FilterPills`.
- H1B / A3A secondary visibility depended on `aria-pressed` scraping from `Sisältö`.
- Clearing hidden secondary state depended on Pagefind-pill DOM state.
- `filters` represented counts inside the current fully constrained state.
- `totalFilters` helped same-group replacement reasoning, but was not enough on its own for the intended secondary-availability UX.

## Raw Pagefind Findings

Representative audits used FI `tekoäly` / `mobiili` and EN `learning`.

- `filters` exposes only the current active result space.
- `totalFilters` exposes broader same-group replacement-style counts.
- Standalone Node probing showed omit-target replacement logic behaving sensibly.
- In the browser runtime, an extra replacement-style `search()` path was not reliable enough for full secondary-group availability.

Stable browser-compatible rule:

- fetch one domain-scoped Pagefind result set per `{term, language, Sisältö}`
- read `raw.data().filters` for those records
- calculate current and replacement counts locally while preserving other active groups as constraints

## New Dataflow

After A3B:

`Pagefind search state`
-> hidden Pagefind `FilterPills` remain the state owner
-> site-owned secondary presenter reads memoized domain-scoped Pagefind records
-> `SearchFacetAvailability.collectFilterCounts(...)`
-> visible secondary presenter DOM
-> result DOM

Ownership after A3B:

- Pagefind still owns search, ranking, filter application, and canonical runtime values.
- The site now owns secondary labels, ordering, visibility, replacement/count semantics, and zero-result recovery UI.
- No new canonical/public JSON projection was introduced.

## Availability Rule

Secondary presenter rule:

1. The active value always remains visible.
2. A non-active value is shown only if selecting it would produce a meaningful result set.
3. Other active groups remain constraints.
4. Impossible values are hidden, not disabled.
5. Zero-result states never hide the active value.
6. The user always keeps a clear path back through `All` / `Kaikki`.

Hidden vs. disabled:

- Hidden won because it keeps the UI shorter, removes impossible focus targets, and matches the stated goal of exposing only meaningful choices.

## Count Semantics

- Inactive options show the count the user can reasonably expect after selecting that value.
- Active options show the current constrained count.
- Same-group replacement counts are calculated with the target group omitted but all other active groups preserved.
- If a group has no meaningful inactive values, the group is hidden instead of showing misleading zeros.
- No broad-corpus synthetic `All (N)` count was introduced.

Live examples on production:

- FI `PresentationYear` under `tekoäly + Esitykset` exposed constrained counts such as `2024 (19)`, `2025 (49)`, `2026 (14)`.
- EN `PresentationYear` under `learning + Esitykset` exposed constrained counts such as `2021 (1)`, `2024 (5)`, `2025 (7)`.
- Under FI `PresentationTopic=AI literacy`, `PresentationYear` narrowed to `Kaikki`, `2024`, `2025`, `2026` instead of broad stale years.

## Implementation

Changed files:

- `src/_includes/_meta.njk`
- `src/js/global-search-modular-ui.js`
- `src/js/search-facet-availability.js`
- `tests/pf5-a3b-facet-availability.spec.js`
- `tests/unit/searchFacetAvailability.test.js`
- this closure doc

Key implementation points:

- Added `search-facet-availability.js` helper for count derivation and presenter-option building.
- Secondary user-facing controls are now site-owned presenter buttons.
- Hidden Pagefind `FilterPills` remain mounted as the underlying state owner.
- Domain-scoped Pagefind search data is memoized per `{term, language, Sisältö}` during the page session.
- Switching domains clears hidden secondary state and stale presenter DOM together.

## CI And Main Pipeline

PR CI:

- `Staging checks / build-and-verify` PASS
- `Accessibility and navigation tests / playwright` PASS

Merged-main pipeline on `e3d1beda2605f9375245b9afa4ed80db709ca3af`:

- `build` SUCCESS
  - started `2026-08-27T05:13:35Z`
  - completed `2026-08-27T05:21:35Z`
  - `npm run build` step completed `2026-08-27T05:21:08Z`
- `deploy` SUCCESS
  - started `2026-08-27T05:21:40Z`
  - completed `2026-08-27T05:22:05Z`
- `smoke` SUCCESS
  - started `2026-08-27T05:22:09Z`
  - completed `2026-08-27T05:22:17Z`

Observed workflow annotation:

- Node 20 deprecation notice on GitHub Actions dependencies
- non-blocking and unrelated to A3B logic

## Local Verification

- `git diff --check` PASS
- `npm run test:unit` PASS (`635` tests)
- `npm run build:no-og` PASS
  - latest local full build: `Copied 274 Wrote 1471 files in 295.87 seconds`
- focused A3B Playwright PASS (`2/2`)
- selected regression stack PASS (`63 passed, 1 skipped`)
- `node scripts/audit-search-quality-regression-benchmark.js` GREEN
  - `blockingFindings: []`

## Live Production Proof

Production host verified: `https://www.jarilaru.fi`

### FI Proof

Path: `/haku/?q=tekoäly`

- `Sisältö -> Esitykset` produced visible groups:
  - `Sisältö`
  - `PresentationYear`
  - `PresentationTopic`
- impossible presentation years were hidden from the initial visible set
  - visible set included `2024`, `2025`, `2026`
  - visible set did not collapse to stale broad-state leftovers
- after `PresentationYear=2025`
  - active year stayed visible
  - `PresentationTopic` recalculated under the year constraint
  - visible topics included `AI literacy` and `Generation AI`
- after `PresentationTopic=AI literacy`
  - `PresentationYear` replacement set narrowed to `Kaikki`, `2024`, `2025`, `2026`
  - stale broader-state years were not shown

FI zero-result recovery:

- domain-valid zero-result probe on production:
  - query `mobiilioppiminen`
  - `Esitykset` domain count: `24`
  - relaxed count after clearing `PresentationTopic`: `1`
  - fully constrained `PresentationYear=2025 + PresentationTopic=AI literacy`: `0`
- zero state showed:
  - summary `Ei tuloksia haulla mobiilioppiminen`
  - active `PresentationYear=2025`
  - active `PresentationTopic=AI literacy`
- clearing `PresentationTopic` via `Kaikki` restored results:
  - summary `1 tulos haulla mobiilioppiminen`

### EN Proof

Path: `/en/search/?q=learning`

- `Sisältö -> Esitykset` produced visible groups:
  - `Sisältö`
  - `PresentationYear`
  - `PresentationTopic`
- visible years included `2021`
- impossible `2007` was not exposed
- after `PresentationYear=2021`
  - active year stayed visible
  - visible groups narrowed to:
    - `Sisältö`
    - `PresentationYear`
  - `PresentationTopic` disappeared because there were no meaningful topic choices in that constrained state
  - summary became `1 result for learning`

EN zero-result recovery:

- domain-valid zero-result probe on production:
  - query `social media`
  - `Esitykset` domain count: `9`
  - relaxed count after clearing `PresentationYear`: `9`
  - fully constrained `PresentationYear=2021`: `0`
- zero state showed:
  - summary `No results for social media`
  - active `PresentationYear=2021`
- clearing `PresentationYear` via `All` restored results:
  - summary `9 results for social media`

## Domain Switch And Cross-Group Behavior

Production verified:

- `Esitykset + PresentationYear + PresentationTopic -> Mediassa`
  - visible groups became:
    - `Sisältö`
    - `Mediatyyppi`
    - `Rooli`
    - `Vuosi`
  - presentation-secondary state did not survive into media
- `Mediassa + Mediatyyppi=Video -> Julkaisut`
  - visible groups became:
    - `Sisältö`
    - `Publications group`
    - `Publications quality`
  - stale media facet state did not survive into publications

This preserves the A3A stale-state fix while moving secondary availability ownership to the presenter layer.

## Accessibility

What was verified live:

- result root is native `UL`
- direct result children are native `LI.find-explore-result`
- no redundant explicit `role` attribute was added to the results list or its direct `LI` children
- hidden impossible secondary values are absent from the visible presenter DOM
- secondary controls remain native buttons with visible pressed state
- navbar search Escape returns focus to the search trigger button
  - FI return target: `BUTTON[aria-label="Hae"]`
  - EN return target: `BUTTON[aria-label="Search"]`

Harness note:

- the Playwright accessibility snapshot API was not available in this environment
- live accessibility verification therefore used DOM semantics, button state, and focus-return checks rather than AX-tree snapshots

## PF5-A3A Preservation

Verified preserved:

- `Sisältö` remains single-select
- switching domain replaces the previous domain selection
- `Kaikki` clears domain scope
- hidden old secondary state does not survive domain switches

## PF5-A2 Preservation

Verified live:

- `[data-search-modular-results]` renders as `UL`
- direct children render as `LI.find-explore-result`
- no direct `DIV` or `P` children were observed

## Navbar #154 Preservation

Verified live on FI and EN homepage overlays:

- cold-start navbar search opens the overlay
- second query works on the warm overlay instance
- Escape closes the overlay
- focus returns to the search trigger button
- reopening works
- full-results query transfer is preserved
  - FI: `/haku/?q=teko%C3%A4ly`
  - EN: `/en/search/?q=learning`

## Seed-Token #153 Preservation

Visible internal-token leak check on production:

- FI `/haku/?q=webinaari`
- FI `/haku/?q=tekoäly`
- top visible results and excerpts contained:
  - `__find_explore_` occurrences: `0`
  - `find_explore_` occurrences: `0`

## G3A Preservation

Verified on live media results:

- media result with thumbnail preserved canonical local detail link and no empty thumbnail shell
- media result without thumbnail preserved canonical local detail link and no empty thumbnail shell

Representative production examples:

- with image:
  - `/mediassa/2026/05/06/tekoalylukutaito-on-uusi-kansalaistaito-arjen-tekoalyhaaste/`
- without image:
  - `/mediassa/2026/05/11/okm-kansallinen-viitekehys-tekoalyosaamiselle-2026/`

## Benchmark And Unit

- `npm run test:unit` PASS (`635/635`)
- `node scripts/audit-search-quality-regression-benchmark.js` GREEN
- `blockingFindings: []`

Known non-blocking benchmark items stayed non-blocking and were not reclassified as A3B regressions.

## Measurements

- `src/js/global-search-modular-ui.js`
  - baseline LOC: `715`
  - merged-main LOC: `954`
- `src/js/search-facet-availability.js`
  - LOC: `129`
- `tests/pf5-a3b-facet-availability.spec.js`
  - LOC: `194`
- `tests/unit/searchFacetAvailability.test.js`
  - LOC: `124`
- merged implementation delta vs baseline:
  - `6 files changed, 971 insertions(+), 93 deletions(-)`
- visible user-facing secondary Pagefind `FilterPills`
  - before: `11`
  - after: `0`
- total hidden + primary Pagefind `FilterPills` instances
  - before: `12`
  - after: `12`
- runtime presenter search work introduced
  - `1` memoized domain-scoped Pagefind search per `{term, language, Sisältö}`
  - `raw.data()` reads over the returned records
- canonical/public JSON delta
  - new public JSON endpoints: `0`
  - canonical schema delta: `0`

## Architecture Debt

Intentional non-closure left for later search work:

- hidden Pagefind `FilterPills` still own actual filter state
- visible secondary presenter is an adapter over that hidden state owner
- direct `aria-pressed` scraping remains only in the top-level domain adapter path

Recorded explicitly:

- page-search visible secondary `FilterPills`: `11 -> 0`
- total hidden `FilterPills` instances: still `12`

Deferred follow-up for broader Search Closure:

- replace hidden `FilterPills` + DOM-state coupling with a simpler supported Pagefind API adapter if possible

## Deferred A3C Scope

Not included in A3B:

- URL serialization of facet state
- reload restoration
- back/forward restoration
- broader mobile search UX work

A3B shipped only deterministic secondary facet availability and presenter behavior on the full search page.
