# PF5-A3B Facet Availability Presenter

STATUS: READY FOR REVIEW / BRANCH

Date: 2026-08-27
Branch: `pf5/a3b-facet-availability-presenter`
Worktree: `/private/tmp/www-pf5-a3b`
Baseline `origin/main`: `848951a5b4db3a9563820e1498c8322738f1686e`
Current `HEAD`: `848951a5b4db3a9563820e1498c8322738f1686e`

## Goal

Make `/haku/` and `/en/search/` expose only meaningful secondary facet choices while keeping Pagefind as the filtering engine and without introducing new canonical data or public JSON.

## Old Dataflow

Current-main baseline before A3B:

`Pagefind search state`
-> `Pagefind filters / totalFilters`
-> visible `FilterPills` for both top-level and secondary groups
-> H1B/A3A DOM visibility layer
-> result DOM

Important baseline properties:

- Secondary groups were user-facing Pagefind `FilterPills`.
- H1B/A3A visibility depended on `aria-pressed` scraping from `Sisältö`.
- Clearing hidden secondary state also depended on Pagefind-pill DOM state.
- `filters` represented counts inside the fully active current filter set.
- `totalFilters` was useful for same-group replacement semantics, but not sufficient on its own for the full secondary-availability UX.

## Raw Pagefind Findings

Representative audits used FI `tekoäly` / `mobiili` and EN `learning`.

- `filters` exposes the current active result space only.
- `totalFilters` exposes broader same-group replacement-style counts, but does not directly solve cross-group secondary availability.
- In a standalone Node harness, `totalFilters` and omit-target replacement logic behaved as expected for FI same-group replacement.
- In the browser runtime, an extra replacement-style `search()` path was not reliable enough for secondary-group availability because it could collapse back to current-state counts.

The stable browser-compatible solution was:

- fetch one domain-scoped Pagefind result set per `{term, language, Sisältö}`
- read `raw.data().filters` for those records
- calculate current and replacement counts locally while preserving other active groups as constraints

## Chosen Availability Rule

Secondary presenter rule:

1. The active value always remains visible.
2. A non-active value is shown only if selecting it would produce a meaningful result set.
3. Other active groups remain constraints.
4. Impossible values are hidden, not disabled.
5. Zero-result states never hide the active value.
6. The user always keeps a clear path back through `All` / `Kaikki`.

Hidden vs. disabled decision:

- Hidden won because it keeps the UI shorter, removes impossible focus targets, and matches the stated goal of exposing only meaningful choices.

## Count Semantics

- Inactive options show the count the user can reasonably expect after selecting that value.
- Active options show the current constrained count.
- Same-group replacement counts are calculated with the target group omitted but all other active groups preserved.
- If a group has no meaningful inactive values, the group is hidden instead of showing misleading zeros.

## New Dataflow

`Pagefind search state`
-> hidden Pagefind `FilterPills` remain the filter-state owner
-> site-owned secondary presenter reads domain-scoped Pagefind records
-> `SearchFacetAvailability.collectFilterCounts(...)`
-> visible secondary presenter DOM
-> result DOM

Ownership after A3B:

- Pagefind still owns search, ranking, filter application, and canonical runtime values.
- The site now owns secondary labels, ordering, visibility, replacement/count semantics, and zero-result recovery UI.
- No new canonical/public JSON projection was introduced.

## Implementation

Changed files:

- `src/_includes/_meta.njk`
- `src/js/global-search-modular-ui.js`
- `src/js/search-facet-availability.js`
- `tests/pf5-a3b-facet-availability.spec.js`
- `tests/unit/searchFacetAvailability.test.js`

Key implementation points:

- Added `search-facet-availability.js` helper for count derivation and presenter-option building.
- Secondary user-facing controls are now site-owned presenter buttons.
- Hidden Pagefind `FilterPills` remain mounted as the underlying state owner.
- Domain-scoped Pagefind search data is memoized per `{term, language, Sisältö}` during the page session.
- Switching domains now clears hidden secondary state and clears stale hidden presenter DOM at the same time.

## FI / EN Verification

Focused browser regression:

- FI `tekoäly` -> `Sisältö=Esitykset`
  - visible groups become `Sisältö`, `PresentationYear`, `PresentationTopic`
  - visible years include `2024`, `2025`, `2026`
  - `2007` is not offered
  - after `PresentationYear=2025`, visible topics include `AI literacy` and `Generation AI`
  - after `PresentationTopic=AI literacy`, replacement years still include `2024`, `2025`, `2026`
  - switching to `Mediassa` clears stale presentation-secondary state

- EN `learning` -> `Sisältö=Esitykset`
  - visible groups become `Sisältö`, `PresentationYear`, `PresentationTopic`
  - visible years include `2021`
  - `2007` is not offered
  - after `PresentationYear=2021`, the year remains visible/active, but `PresentationTopic` disappears because there are no meaningful topic choices in that constrained state

## Zero-Result Recovery

Focused EN recovery path:

- start from `learning` + `Sisältö=Esitykset` + `PresentationYear=2021`
- change query to a domain-valid but year-invalid probe (`social media` in the observed run)
- result summary becomes `No results ...`
- active `Sisältö` and active `PresentationYear` remain visible
- clearing `PresentationYear` via `All` restores results

This preserves discoverability and recovery without waiting for A3C URL-state work.

## Accessibility

- Secondary presenter uses native buttons.
- Hidden impossible values are not focusable because they are removed from the visible presenter.
- Focus is preserved across presenter rerenders with targeted refocus on the newly relevant button.
- No redundant ARIA roles were added beyond the existing button/group structure.

## Preservation Checks

Verified unchanged or preserved:

- PF5-A3A single-select `Sisältö`
- PF5-A2 `UL -> LI.find-explore-result`
- PF5-G1 / navbar dialog lifecycle
- navbar full-results query transfer hotfix
- PF5 hotfix list-spacing / bullet / contrast behavior
- PF5-G3A media enrichment + thumbnail behavior
- search-quality benchmark contract remains GREEN

## Measurements

- `src/js/global-search-modular-ui.js`: `715` lines on baseline -> `954` lines now
- New helper `src/js/search-facet-availability.js`: `129` lines
- Relevant tracked diff: `333` insertions / `93` deletions
- Page-search Pagefind `FilterPills` instances: `12 -> 12`
- User-facing secondary Pagefind `FilterPills`: `11 -> 0`
- Secondary visible-state owner layers: Pagefind DOM-only -> site-owned presenter over hidden Pagefind state owner
- Direct `aria-pressed` scraping paths for secondary availability logic: reduced from the old secondary-slot visibility/clear path to top-level `Sisältö` domain detection only
- New runtime presenter work:
  - before: no site-owned secondary-availability search pass
  - after: 1 memoized domain-scoped Pagefind search per `{term, language, Sisältö}` plus `raw.data()` reads for those returned records
- New canonical/public JSON endpoints introduced: `0`

## Verification Log

- `git diff --check` PASS
- `npm run test:unit` PASS (`635` tests)
- `npm run build:no-og` PASS
  - latest successful run: `Copied 274 Wrote 1471 files in 295.87 seconds`
- Focused A3B Playwright PASS (`2/2`)
- Selected regression stack PASS (`63 passed, 1 skipped`)
  - PF5-A2
  - PF5-A3A / H1B
  - PF5-G1
  - search-state / navbar hotfix regressions
  - PF5-G3A
- `node scripts/audit-search-quality-regression-benchmark.js` GREEN
  - `blockingFindings: []`

## Remaining A3C Scope

Not included here:

- URL serialization of facet state
- reload restoration
- back/forward facet restoration
- broader mobile search UX work

This branch changes only secondary facet availability/presentation semantics on the full search page.
