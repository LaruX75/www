# PF5-A3A Content-Type Single-Select

STATUS: READY FOR MERGE

Date: 2026-08-26
Baseline main SHA: `5235a1ca56201f4fd357ab28ca7b819200ff1504`
Working branch: `pf5/a3a-content-type-single-select`
Audit source: `/private/tmp/www-pf5-a3-audit/docs/pf5-a3-facet-semantics-availability-audit-2026-08-26.md`

## Previous behavior

The PF5-A3 audit confirmed that the top-level `Sisältö` FilterPills were mounted with `selectMultiple:true` and that Pagefind combines same-group values with `AND`.

That made states such as:

- `Sisältö=Esitykset + Mediassa`
- `Sisältö=Julkaisut + Opinnäytteet`

semantically invalid for discovery, because Pagefind interpreted them as intersecting content types instead of cross-domain broadening.

At the same time PF5-H1B exposed secondary facet groups as the union of every active top-level `Sisältö` value. This created two bad states:

- mixed-domain secondary visibility that only existed because multi-select was possible
- hidden stale secondary filters that could remain active after a domain switch or after returning to `Kaikki`

## New behavior

PF5-A3A changes only the top-level `Sisältö` facet semantics.

- `Sisältö` is now single-select.
- Selecting a new content type replaces the previous one.
- Selecting `Kaikki` / `All` clears the domain scope and returns to cross-domain discovery.
- Only the currently selected domain's secondary facet groups are visible.
- Before a secondary group is hidden, any active non-reset pills inside it are toggled off through Pagefind's own UI so Pagefind remains the state owner.

This keeps the current architecture intact:

search page config
-> Modular UI instance
-> top-level `Sisältö` FilterPills
-> Pagefind filter state
-> DOM-only secondary facet visibility

No custom filter engine was introduced.

## Implementation slice

Changed files:

- `src/js/global-search-modular-ui.js`
- `src/_includes/_search-page-config.njk`
- `tests/pf5-h1b-progressive-facets.spec.js`

Implementation details:

- `FilterPills` now uses `selectMultiple: filterName !== "Sisältö"`.
- The old Set-based mixed-domain union visibility path was removed.
- Secondary visibility now derives from one `activeDomain` instead of a union of selected domains.
- Hidden domain-specific active filters are cleared by clicking Pagefind's own active pills before hiding the slot.
- Visibility updates are scheduled with `requestAnimationFrame` to avoid transient stale states during Pagefind DOM churn.

## Deleted logic

Removed / simplified in this slice:

- mixed-domain active-content Set handling
- UNION secondary-facet visibility logic
- multi-select-specific comments and regression expectations
- stale hidden-secondary behavior after `Sisältö` switch or `Kaikki`

Current patch size after cleanup:

- `3 files changed`
- `310 insertions`
- `143 deletions`

## Kaikki behavior

`Kaikki` now means genuine unscoped cross-domain discovery again.

Verified sequence:

- `Esitykset`
- activate a presentation secondary pill
- `Kaikki`

Result:

- only the top-level `Sisältö` control remains visible
- hidden presentation secondary state is cleared
- result set parity matches raw Pagefind with only the language pin applied

## FI / EN

Verified on both:

- `/haku/`
- `/en/search/`

Confirmed behaviors:

- single-select top-level content type
- switching content types replaces, never combines
- query text remains intact
- correct secondary group appears for the active domain only
- hidden previous-domain secondaries do not continue constraining results
- `Kaikki` restores cross-domain state

Important: canonical Pagefind filter values remain unchanged across FI and EN. This slice did not rename or translate the underlying filter values.

## Accessibility

Keyboard interaction verified:

- focus top-level `Sisältö` pill
- activate `Esitykset`
- move to `Mediassa`
- activate by keyboard

Result:

- only one active top-level pill remains
- focus stays on the activated button
- no redundant ARIA was added
- PF5-A2 `UL -> LI.find-explore-result` semantics remain intact

## Verification

Required local verification:

- `git diff --check`
  - PASS
- `npm run test:unit`
  - PASS
  - `630 pass, 0 fail`
- `npm run build:no-og`
  - PASS
  - `Copied 273 Wrote 1471 files in 336.69 seconds`
- `node scripts/audit-search-quality-regression-benchmark.js`
  - GREEN
  - `blockingFindings: []`

Focused A3A browser suite:

- `tests/pf5-h1b-progressive-facets.spec.js`
  - `15 passed, 1 skipped`

Broader regression set:

- PF5-H1A
- PF5-H1B / A3A
- PF5-A2
- PF5-G1 navbar modular UI
- PF5 hotfix search UI regressions
- PF5 hotfix search state / facet counts
- PF5-G3A media shared result
- navigation
- accessibility
- accessibility tools

Result:

- `100 passed, 1 skipped`

The single skip was data-conditional, not a deterministic regression.

## Preserved behavior

Confirmed unchanged:

- PF5-A2 semantic result list structure (`UL` with direct `LI.find-explore-result`)
- navbar zero-result / modular UI hotfix path from `#154`
- seed-token leak hotfix behavior from `#153`
- G3A media shared-result enrichment and thumbnail behavior
- `SearchResultPresenter` implementation
- Pagefind ranking and body/index hygiene
- existing `?q=` hydration behavior

No visible `__find_explore_` / `find_explore_` token leakage was reintroduced.

## Deferred work

Still intentionally out of scope:

- PF5-A3B raw-API facet availability / impossible-value suppression
- PF5-A3C URL facet state serialization and reload restoration

This slice creates the clean semantic base for those later changes without absorbing them here.
