# PF5-G3A Media Result Enrichment

STATUS: CLOSED / GREEN / MAIN

Date: 2026-08-26
Baseline main SHA: `10e7818e6c23a1d23c041f5ac8ea19a9267bfa07`
Working branch: `pf5/g3a-media-result-enrichment`

## Previous gap

PF5-A1 parity work had already converged the shared global-search result renderer onto `src/js/search-result-presenter.js`, but the `media` branch still rendered only:

- family badge
- year
- title
- excerpt

Media-specific primary metadata and thumbnails were already authoritative in canonical content, but they were not projected all the way through Pagefind into the shared presenter.

## Dataflow

Current G3A dataflow after this slice:

1. Canonical media frontmatter
   - `mediaType`
   - `mediaRole`
   - `mediaOutlet`
   - `thumbnail`
   - `date`
   - `lang`
2. `src/_includes/media-item.njk`
   - keeps existing Pagefind filters/meta
   - now also emits:
     - `mediaTypeLabelFi`
     - `mediaTypeLabelEn`
     - `mediaRoleLabelFi`
     - `mediaRoleLabelEn`
     - `thumbnail`
3. Pagefind result `meta`
   - remains discovery-only
   - carries localized media labels plus existing raw enum values
4. `src/js/search-result-presenter.js`
   - detects `media`
   - renders primary meta as:
     - media type
     - media role
     - media outlet
   - renders a small decorative thumbnail when `meta.thumbnail` is valid
5. Shared global-search result card
   - still uses the canonical detail-page URL as the title link target
   - does not create a new media card model

## Thumbnail availability

Current media corpus scan:

- total media items: `73`
- items with thumbnail: `67`
- items without thumbnail: `6`
- thumbnail URLs:
  - external: `66`
  - local: `1`
- languages:
  - FI: `72`
  - EN: `1`

Representative thumbnail-bearing items:

- `24-myyttia-tekoalysta-ja-datasta-joulukalenteri.md`
- `acatiimi-tekoaly-valloittaa-yliopistot.md`
- `inos-project-interview-heis-open-science.md`

Representative no-thumbnail items:

- `anna-liisa-vatjus-anttila-muistelee.md`
- `okm-kansallinen-viitekehys-tekoalyosaamiselle-2026.md`
- `tkaedite-kosovon-opettajien-digiosaamista-kasitteleva-artikkeli-julkaistiin.md`

## Eleventy Image decision

Decision: `NO`

Reason:

- `66/67` existing thumbnails are already external URLs
- media archive/detail pages already consume existing thumbnail URLs directly
- a new Eleventy Image layer here would create a second parallel image pipeline
- the G3A thumbnail is intentionally small and decorative
- there is no need for runtime metadata discovery or a separate optimized derivative pipeline in this slice

This slice keeps the existing thumbnail source authoritative and reuses it directly.

## Implementation

Changed behavior:

- Media detail pages now project localized type/role labels and thumbnail URL into Pagefind metadata.
- The shared presenter now renders media primary metadata in both FI and EN search surfaces.
- The shared presenter now renders a small decorative thumbnail only when a valid thumbnail exists.
- Absolute thumbnail URLs now remain valid even when the browser context has no useful base origin.

Preserved invariants:

- canonical media content remains authoritative
- Pagefind remains discovery metadata only
- title link remains the canonical navigation target
- no `sourceUrl` retargeting
- no runtime API fetch for thumbnail metadata
- no separate navbar/full-search media renderer
- no changes to archive/detail-page media architecture

## FI / EN semantics

The presenter resolves the search-surface language from `document.documentElement.lang`:

- FI surface uses `mediaTypeLabelFi` / `mediaRoleLabelFi`
- EN surface uses `mediaTypeLabelEn` / `mediaRoleLabelEn`

If a localized label is missing or collapses to the generic fallback `Media`, the presenter degrades to a humanized raw enum value instead of emitting an empty separator chain.

## Tests and verification

Focused unit coverage added:

- `tests/unit/searchResultPresenter.test.js`

Local result:

- `node --test tests/unit/searchResultPresenter.test.js`
- `6/6 PASS`
- covered:
  - FI localized primary meta
  - EN localized primary meta
  - unknown enum fallback
  - thumbnail present
  - thumbnail absent / malformed thumbnail
  - known type/role label pass-through

Focused browser harness added:

- `tests/pf5-g3a-media-presenter-browser.spec.js`

Local browser harness result:

- `3/3 PASS`
- verified:
  - `UL` container
  - direct `LI` media result
  - localized primary metadata
  - decorative thumbnail rendering
  - clean no-thumbnail fallback
  - mobile `~375px` single-column card behavior
  - dark-theme mount remains semantically clean with stable thumbnail aspect ratio

Local integration spec added for full search surfaces:

- `tests/pf5-g3a-media-shared-result.spec.js`

- added for real search-surface / CI verification
- verified in the built local corpus together with existing PF5 regression suites
- combined suite result:
  - `68 passed`
  - `4 skipped`
  - `1` PF5-A2 navbar semantics failure in each combined rerun
  - isolated rerun of that exact PF5-A2 test: `PASS`
- classification:
  - known local repeat-open/navbar-style flake
  - not a deterministic G3A regression

Raw Pagefind API proof:

- thumbnail-present FI media query:
  - query: `Tekoäly tekee petoksen koulutehtävissä helpoksi`
  - matched URL: `/mediassa/2026/03/29/tekoaly-tekee-petoksen-koulutehtavissa-helpoksi/`
  - meta includes:
    - `mediaType: article`
    - `mediaTypeLabelFi: Lehtijuttu`
    - `mediaRole: about`
    - `mediaRoleLabelFi: Minusta tehty`
    - `mediaOutlet: Kaleva`
    - `thumbnail: https://...`
    - `date: 2026-03-29`
    - `year: 2026`
- thumbnail-absent FI media query:
  - query: `vatjus`
  - matched URL: `/mediassa/1999/07/31/anna-liisa-vatjus-anttila-muistelee/`
  - meta includes:
    - `mediaType: podcast`
    - `mediaTypeLabelFi: Podcast`
    - `mediaRole: interviewer`
    - `mediaRoleLabelFi: Haastattelijana`
    - `mediaOutlet: SoundCloud / Jari Laru`
    - `date: 1999-07-31`
    - `year: 1999`
  - no `thumbnail` key present
- EN media corpus check:
  - canonical EN media item metadata is projected correctly
  - exact-title discoverability of the lone EN media item remains a pre-existing benchmark P2 and is not introduced by G3A

## Build and benchmark notes

Mandatory clean-main parity build completed.

Authoritative command:

- `time npm run build:no-og`

Clean `origin/main` worktree result:

- Eleventy: `Copied 273 Wrote 1471 files in 402.42 seconds`
- Pagefind / postbuild completed
- `_site/pagefind/pagefind-entry.json` present
- timing:
  - `real 434.68`
  - `user 336.72`
  - `sys 39.41`

G3A worktree result:

- Eleventy: `Copied 273 Wrote 1471 files in 399.61 seconds`
- Pagefind / postbuild completed
- `_site/pagefind/pagefind-entry.json` present
- timing:
  - `real 431.39`
  - `user 335.65`
  - `sys 39.68`

Blocker classification:

- `Case C`
- both clean main and G3A complete normally
- previous local full-build blocker is resolved / not G3A-caused

Full unit suite:

- `npm run test:unit`
- `630 pass, 0 fail`

Search benchmark:

- `node scripts/audit-search-quality-regression-benchmark.js`
- `GREEN`
- `blockingFindings: []`
- leak checks preserved:
  - `leakTokenResult.findings: []`
  - `internalUrlLeakResult: []`

Known non-blocking benchmark findings preserved:

- `exact-title-rank-slippage`
- `en-media-title-undiscoverable`

## Measurements

- `src/js/search-result-presenter.js`
  - before: `208` LOC
  - after: `283` LOC
  - delta: `+75` LOC net in file size
- `src/css/modules/_components.css`
  - before: `821` LOC
  - after: `860` LOC
  - delta: `+39` LOC net in file size
- new Pagefind metadata projection code:
  - `media-item.njk`: `+7` LOC
- extra runtime metadata/API fetches:
  - before: `0`
  - after: `0`
- thumbnail browser requests:
  - only the normal `<img>` request when a media result with thumbnail is actually rendered

## Deleted / simplified code

No existing rendering path was deleted in this slice.

The simplification comes from reusing the shared presenter instead of introducing:

- a parallel media result renderer
- a second image pipeline
- duplicate navbar/full-search media branches

Local-only helper removed before commit:

- `tests/playwright.local-no-server.config.js`
- reason: local diagnostic wrapper only, not required project test infrastructure

## Closure

- PR: `#155` — `feat(search): enrich media results with metadata and thumbnails`
- implementation HEAD: `e6e6199f67b8cdffaee975bdf5465cb52ff86c02`
- mergedAt: `2026-08-26T09:34:33Z`
- merge commit: `8fe91615c5973e3a5c4ef1b3991196a45418d7c5`
- resulting `main`: `8fe91615c5973e3a5c4ef1b3991196a45418d7c5`

GitHub main pipeline for merge commit `8fe91615c5973e3a5c4ef1b3991196a45418d7c5`:

- `build` success
  - completed: `2026-08-26T09:44:27Z`
- `deploy` success
  - completed: `2026-08-26T09:45:14Z`
- `smoke` success
  - completed: `2026-08-26T09:45:24Z`

Merged-main local verification:

- `npm run build:no-og`
  - PASS on detached `origin/main`
  - Eleventy: `Copied 273 Wrote 1471 files in 281.93 seconds`
  - Pagefind / postbuild / `check:researchfi-integrity` all PASS
- `npm run test:unit`
  - PASS
  - `630 pass, 0 fail`
- `node scripts/audit-search-quality-regression-benchmark.js`
  - `GREEN`
  - `blockingFindings: []`
  - known preserved non-blockers only:
    - `exact-title-rank-slippage`
    - `en-media-title-undiscoverable`

Live production verification on Wednesday, August 26, 2026:

- FI full search: `https://www.jarilaru.fi/haku/?q=joulukalenteri`
  - result owner: `UL`
  - direct children: `LI`
  - no direct `DIV` / `P` children inside the result list
  - native accessibility snapshot exposes `list` / `listitem`
  - exact Media card:
    - title: `24 myyttiä tekoälystä ja datasta -joulukalenteri`
    - href: `/mediassa/2025/12/24/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/`
    - visible primary meta: `Video · Haastattelijana · Generation AI / YouTube`
    - decorative thumbnail present
    - excerpt clean
    - no visible `__find_explore_` / `find_explore_` token leak
- FI thumbnail-absent case: `https://www.jarilaru.fi/haku/?q=vatjus`
  - exact Media card:
    - title: `Anna-Liisa Vatjus-Anttila muistelee`
    - href: `/mediassa/1999/07/31/anna-liisa-vatjus-anttila-muistelee/`
    - visible primary meta: `Podcast · Haastattelijana · SoundCloud / Jari Laru`
  - no empty image shell
  - no broken-image fallback
- EN full search: `https://www.jarilaru.fi/en/search/?q=open%20science`
  - result owner: `UL`
  - direct children: `LI`
  - Media result remains present in the same shared list
  - exact Media card:
    - title: `How Can Higher Education Institutions Facilitate Open Science and Citizen Science Practices?`
    - href: `/mediassa/inos-project-interview-heis-open-science/`
    - visible primary meta: `Video · About my work · INOS Project / YouTube`
    - thumbnail present
  - known exact-title EN Media discoverability P2 remains a benchmark non-blocker, not a G3A regression

Navbar live verification:

- FI navbar dialog on `https://www.jarilaru.fi/`
  - results owner: `UL`
  - direct children: `LI`
  - same shared Media card renders with thumbnail + primary meta
  - full-results transfer link: `/haku/?q=joulukalenteri`
  - `Escape` returns focus to the trigger
  - second search still returns results
- EN navbar dialog on `https://www.jarilaru.fi/en/`
  - same shared Media card path
  - full-results transfer link: `/en/search/?q=open%20science`
  - `Escape` focus return preserved
  - second search still returns results

Thumbnail semantics and layout:

- decorative thumbnails verified live with:
  - `alt=""`
  - `loading="lazy"`
  - `decoding="async"`
- title link remains the canonical navigation target
- no nested-link pattern introduced
- mobile + dark-theme spot check on `https://www.jarilaru.fi/haku/?q=joulukalenteri`
  - viewport: `375px`
  - no horizontal overflow
  - card width stayed within page width
  - thumbnail remained subordinate to title/content
  - thumbnail-absent cards stayed balanced

Label ownership and dataflow remained unchanged:

- canonical Media content stays authoritative
- `src/_includes/_media-macros.njk` remains the authoritative label source
- `src/_includes/media-item.njk` only projects localized labels + thumbnail into Pagefind metadata
- `src/js/search-result-presenter.js` remains a consumer-only shared renderer
- production path remains:
  - canonical Media
  - Nunjucks Pagefind metadata projection
  - Pagefind result meta
  - `SearchResultPresenter`
  - shared navbar/full-search card

Deliberate non-changes preserved through production:

- Eleventy Image: `NOT USED`
  - rationale preserved:
    - `67` Media items with thumbnail
    - `66` external thumbnail URLs
    - `1` local thumbnail URL
    - direct canonical/Pagefind reuse stays smaller than introducing a second image pipeline
- extra runtime metadata/API fetches:
  - before: `0`
  - after: `0`
- PF5-A2 UL/LI result-list semantics preserved
- navbar zero-result hotfix `#154` preserved
- seed-token leak hotfix `#153` preserved
- H1A single-authoritative-input shell preserved
- H1B progressive-facet default state preserved
- no Canonical Content v1 change

Deferred work remains unchanged:

- the pre-existing benchmark P2 for exact-title discoverability of the lone EN media item
