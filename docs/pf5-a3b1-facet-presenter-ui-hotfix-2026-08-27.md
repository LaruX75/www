# PF5-A3B.1 - Facet presenter layout + localization hotfix

STATUS: LOCAL GREEN / READY FOR PR

Date: Thursday, August 27, 2026
Base `origin/main`: `ba0dadb5ae0f1acc7aaf73031bd969c28e086ed2`
Hotfix branch: `hotfix/pf5-a3b-facet-presenter-ui`

## Scope

PF5-A3B had already closed the semantic availability problem on `main`.
This hotfix stays in the presenter layer only:

- restore compact secondary-facet layout
- separate raw Pagefind values from visible localized labels
- preserve A3B availability semantics
- preserve PF5-A2 result-list semantics
- preserve PF5-G1 navbar search behavior

No Canonical Content v1 changes.
No Pagefind filter-name/value changes.
No public JSON contract changes.
No API-endpoint changes.

## Proven before-state on current main

Reproduced on:

- FI: `/haku/?q=tekoäly`
- EN: `/en/search/?q=learning`

Representative domains:

- `Esitykset`
- `Mediassa`
- `Julkaisut`
- `Opinnäytteet`
- `Kirjoitukset ja puheenvuorot`

Observed before the hotfix:

- visible secondary facet groups rendered one below another on desktop
- group wrappers resolved to block layout instead of compact wrapped rows
- EN top-level `Sisältö` values leaked Finnish raw values such as `Esitykset`, `Mediassa`, `Opinnäytteet`
- FI controlled-vocabulary values leaked raw tokens such as `peer-reviewed`, `open-access`, `masterThesis`, `reviewed`, `blogPost`
- presentation topics contained mixed real content names; those are not forcibly translated in this hotfix because no authoritative locale map exists for arbitrary topic values

## Root cause

Two presenter-layer regressions were active after A3B:

1. The site-owned presenter wrappers were no longer using the compact wrapping layout expected by the existing search UI.
2. Visible labels were reading raw Pagefind values directly in multiple presenter paths instead of going through a locale-aware display-label layer.

Additionally, broad regression coverage surfaced a shared-navbar preservation issue:

- filterless navbar searches needed to replay typed queries through the atomic pinned-language Pagefind API path
- this was fixed without reopening A3B semantics

## Implementation

### 1. One visible-label ownership layer

Added `src/_data/searchFacetLabels.js` as the single presenter-facing label source for controlled vocabularies.

Sources reused instead of inventing parallel ownership:

- `publicationGroupLabel()` from `src/_utils/publicationsFindExplore`
- `contentTypeLabel()` from `src/_utils/contentTypeLabel`

Localized value maps now cover:

- `Sisältö`
- `Publications group`
- `Publications quality`
- `Writings content type`
- `Theses type`
- `Theses role`

Counts:

- 6 localized facet families
- 26 visible value mappings per locale
- duplicate mapping tables removed: 0
- new presenter-visible mapping layer added: 1

### 2. Raw value vs visible label separation

`src/js/global-search-modular-ui.js` now keeps:

- raw Pagefind value in `data-search-modular-raw-label`
- localized user-visible text in the rendered span text / aria label

That preserves:

- stable filter engine/state values
- stable single-select semantics
- stable availability recomputation
- stable hidden FilterPills ownership

### 3. Layout restoration

`src/css/modules/_components.css` restores compact wrapping behavior for the presenter surface:

- `[data-search-modular-filters]` uses flex layout
- `[data-search-modular-filter-slot]` uses flex-column layout
- `.pagefind-modular-filter-pills-wrapper` wraps naturally with gaps
- group heading spacing was simplified for the presenter shell

Desktop result:

- groups stay compact
- pills sit next to one another
- wrapping happens only when width runs out
- one-pill-per-row is no longer the default desktop behavior

Mobile result:

- natural wrapping remains allowed
- no horizontal page overflow was observed at ~375 px

### 4. Preservation-only navbar adjustment

The shared factory keeps the stock Modular UI input path and replays filterless/navbar typed queries through the atomic pinned-language search path so PF5-G1 stays green.

Effect:

- user-visible navbar behavior preserved
- query-transfer link preserved
- result semantics preserved
- accepted tradeoff: navbar input can cause one additional supported Pagefind dispatch per typed query event on filterless surfaces

## After-state verification

### FI visible labels

Representative proofs:

- `Publications quality`: `Open access`, `Vertaisarvioitu`
- `Theses type`: `Kandidaatintyöt`, `Pro gradu -tutkielmat`
- `Theses role`: `Ohjatut`, `Tarkastetut`
- `Writings content type`: `Blogi`, `Kolumnit`, `Puheenvuorot`, `Lausunnot`

### EN visible labels

Representative proofs:

- `Sisältö`: `All`, `Presentations`, `Media`, `Theses`
- `Theses type`: `Bachelor's theses`, `Master's theses`
- `Theses role`: `Supervised`, `Reviewed`
- media values remained correctly localized from indexed data

### Presentation-topic rule

`PresentationTopic` remains raw-content/proper-name driven where no authoritative locale map exists.
Examples such as `AI literacy` were preserved instead of being force-translated.

## Measurements

LOC:

- `src/css/modules/_components.css`: `860 -> 887`
- `src/js/global-search-modular-ui.js`: `954 -> 999`
- `src/_includes/_search-page-config.njk`: `66 -> 67`
- `src/_data/searchFacetLabels.js`: `0 -> 115`

Runtime / contract deltas:

- Pagefind filter names changed: `0`
- Pagefind raw values changed: `0`
- public JSON schema delta: `0`
- canonical content schema delta: `0`
- network request delta in full search: `0`
- network request delta in navbar: `0`
- supported Pagefind query-dispatch delta on filterless/navbar input events: `+1` replay dispatch accepted to preserve pinned-language behavior

## Verification run on Thursday, August 27, 2026

Command results:

- `git diff --check` passed
- `npm run test:unit` passed
- `node scripts/audit-search-quality-regression-benchmark.js` returned `status: GREEN` and `blockingFindings: []`
- `npm run build:no-og` passed repeatedly after the hotfix
- focused Playwright:
  - `tests/pf5-a3b1-facet-presenter-ui.spec.js` passed
  - `tests/pf5-a3b-facet-availability.spec.js` passed
- broad Playwright regression:
  - 76 passed, 1 skipped across the relevant search/a11y/navigation stack after the presenter hotfix
- rebuilt navbar/a2/navigation rerun:
  - 31 passed, 1 local FI-navbar kind-assert flake in a combined run
  - isolated rerun of that single FI navbar query test passed immediately

Benchmark residuals stayed unchanged and non-blocking:

- `exact-title-rank-slippage`
- `en-media-title-undiscoverable`

## Files changed

- `src/_data/searchFacetLabels.js`
- `src/_includes/_search-page-config.njk`
- `src/css/modules/_components.css`
- `src/js/global-search-modular-ui.js`
- `tests/unit/searchFacetLabels.test.js`
- `tests/pf5-a3b1-facet-presenter-ui.spec.js`
- `tests/pf5-a3b-facet-availability.spec.js`
- `tests/pf5-h1b-progressive-facets.spec.js`

## Deferred / not in scope

- Mobile Search UX redesign
- new taxonomy or canonical vocabularies
- Presentation-topic translation ownership for arbitrary content names
- benchmark P2 items already outside the A3B.1 contract
