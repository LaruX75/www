# VALTUUSTOTYO-SSR-01 — Closure

**Status:** READY TO REVIEW
**Date:** 2026-09-03
**Baseline SHA:** `b459853703cefa4dcdf1b0a1f92bb48ab29716bd`
**Scope:** convert `/valtuustotyo/` from runtime JSON → JS render to full SSR

## Old vs new data flow

**Before**
```
canonical publications/politics
  → /data/council-speeches.json.11ty.js (with enrichment)
  → /data/initiatives.json.11ty.js
  → 4 × fetch() on DOMContentLoaded
    ( council-speeches + initiatives + publications + content )
  → JS normalization + filtering + sort + row HTML string building
  → tbody.innerHTML = <tr>… (renderPuheet / renderAloitteet)
```
Plus dead-code KPI/chart section that fetched `/data/publications.json` + `/data/content.json` but wrote to element IDs (`kpi-mielipiteet`, `kynasta-summary-donut`, `kynasta-summary-trend`) that were never rendered by any template — silent no-op.

**After**
```
canonical collections (pub_puhe_valtuusto, politics, etc.)
  + councilMeetingMeta / oukaCouncilSpeechProtocols / councilSpeechVideos
  → src/_utils/councilSpeech.js       (canonical classification)
  → src/_utils/councilEnrichment.js   (canonical meeting/protocol/video enrichment)
  → src/_utils/valtuustotyoPage.js    (single-owner projection)
  → src/valtuustotyo.11tydata.js      (thin eleventyComputed adapter)
  → src/valtuustotyo.njk              (thin SSR renderer)
  → complete SSR archive HTML (every speech + every initiative, in canonical order)
  → JS only filters/sorts/paginates existing DOM rows (no fetch, no innerHTML)
```
Zero runtime archive JSON fetches. Zero row-builder JS. Zero loading placeholders.

## Canonical ownership

| Concern | Owner (single) |
| --- | --- |
| Council-speech classification (`isCouncilSpeech`) | `src/_utils/councilSpeech.js` |
| Council chronology (`compareByCouncilChronology`) | same |
| Initiative chronology (`compareByInitiativeChronology`) | same |
| Meeting label / protocol URL / video enrichment (`enrichCouncilSpeech`) | `src/_utils/councilEnrichment.js` |
| SSR projection (rows + filter options + counts + dashboard shell) | `src/_utils/valtuustotyoPage.js` |
| Public JSON `/data/council-speeches.json` (enriched, unchanged) | `src/data/council-speeches.json.11ty.js` (imports councilEnrichment) |
| Public JSON `/data/initiatives.json` (unchanged) | `src/data/initiatives.json.11ty.js` |

Previously duplicated:
- `isCouncilSpeech()` lived in **three** places (eleventy.collections.js + kynastaHubPage.js + valtuustotyo.njk inline). All three now delegate to `councilSpeech.js`. `kynastaHubPage.js` re-exports the function so existing importers stay stable.
- `enrichWithCouncilMeta()` lived only in the JSON producer. Now extracted to `councilEnrichment.js` and consumed identically by the JSON producer + SSR projection.

## Chronology / tie-break

**Council speeches**
```
date DESC
  → title fi-locale ASC
  → canonical URL ASC
```
**Initiatives**
```
meetingDate (fallback date) DESC
  → title fi-locale ASC
  → canonical URL ASC
```
Enforced by comparators in `councilSpeech.js`. Same rule used by both the SSR projection and (via re-export) the Kynästä hub — guaranteeing the `Kynästä.first5 === Valtuustotyö.first5` invariant. No January-1 dates fabricated; year-only records honor Node `Date` parsing without normalization.

## Enrichment ownership

`enrichCouncilSpeech(record, item, deps)` in `src/_utils/councilEnrichment.js` produces:
```
{ event, asiakohta, meetingDate, meetingNumber, meetingLabel,
  protocolUrl, councilVideos }
```
from three canonical data files (`councilMeetingMeta.byDate`, `oukaCouncilSpeechProtocols.overrides`/`.protocolsByDate`, `councilSpeechVideos.byUrl`). Both consumers (SSR projection + JSON producer) call the same helper with the same dependencies, so the enriched fields are byte-identical between them.

## Full SSR row counts (built)

From the built `_site/valtuustotyo/index.html`:
- **79 council speeches** as `<tr data-council-row>` rows
- **10 initiatives** as `<tr data-initiative-row>` rows
- 2 empty-state rows (`data-council-empty` + `data-initiative-empty`, hidden until search returns 0)
- 0 loading placeholders (`Ladataan puheita` / `Ladataan aloitteita` — grep-verified count = 0)

100 % of the canonical archive corpus is present in SSR HTML.

## JS-off proof

With JavaScript disabled:
- Both tables render every SSR row (79 + 10 = 89 canonical items)
- All canonical title links work (SSR anchors)
- Meeting label / protocol link / video timestamp / event badge / category + keyword badges all render
- Filter dropdowns exist but are non-interactive (accepted degradation)
- Sort headers exist but do not toggle (accepted degradation)
- Pagination controls exist but are not populated by JS (accepted; all rows visible anyway)

## Runtime request measurements

**Before**
```
/valtuustotyo/ makes 4 fetches on DOMContentLoaded:
  /data/publications.json
  /data/initiatives.json
  /data/council-speeches.json
  /data/content.json
+ 2 fetches later inside per-table IIFEs:
  /data/council-speeches.json (puheet reload path)
  /data/initiatives.json      (aloitteet reload path)
```
Total: **4 unique endpoints, 6 fetch call sites.**

**After**
```
/valtuustotyo/ makes 0 fetches for archive rendering.
```
Playwright `Runtime request elimination` test asserts zero requests to any of the 4 endpoints on page load. `waitForLoadState("networkidle")` used to catch any deferred fetch.

## Deleted JS / runtime code

From `src/valtuustotyo.njk`:
- `_valtLoadItems()` helper (fetches JSON) — deleted
- `_loadItems()` helper (fetches JSON, puheet path) — deleted
- `_loadJsonItems()` helper (fetches JSON, aloitteet path) — deleted
- `_puheetRaw` normalization pipeline + `formattedDate` / `isExternal` mapping — moved to build-time projection
- `_rawInitiatives` normalization + `formattedMeetingDate` etc. — moved to build-time projection
- `puheetData.map()` transform block — moved to build-time projection
- `aloitteetData.map()` transform block — moved to build-time projection
- `shortTitle()` helper — moved to `valtuustotyoPage.stripCouncilTitlePrefix()`
- `secondsToClock()` helper — moved to `valtuustotyoPage.secondsToClock()`
- `renderPuheet()` (52-line HTML string builder) — deleted; SSR renders once
- `renderAloitteet()` (40-line HTML string builder) — deleted; SSR renders once
- `applyPuheetFilters()` — replaced by generic `applyFilters()` in `makeArchive()`
- `applyAloitteetFilters()` — same
- `sortPuheetData()` — replaced by generic `toggleSort()`
- `sortAloitteetData()` — same
- `renderPuheetPagination()` / `renderAloitteetPagination()` — inlined into `makeArchive()`
- Two `escHtml()` / `slugify()` duplicates — deleted; SSR outputs correctly-escaped HTML
- Dashboard KPI/chart section (~250 lines): `setText('kpi-*', …)`, `drawCharts()`, `addYear()`, `yearly` aggregator, Chart.js instantiation — **all deleted as dead code** (target DOM IDs never rendered by any template; grep confirmed zero consumers site-wide)
- 2 × "Ladataan puheita..." / "Ladataan aloitteita..." placeholder cells — replaced by SSR content

Template size: **1028 lines → 322 lines** (−706 lines, −68.7 %).

New template JS: **~110 lines** of `makeArchive()` DOM-based filter/sort/paginate logic, shared between both tables via one factory function. No fetch, no innerHTML row construction.

## Dashboard convergence result

Attempt succeeded via **deletion** — the entire KPI + Chart.js block was dead code. `<span id="kpi-mielipiteet">` etc. and `<canvas id="kynasta-summary-donut">` were never rendered by any template. `setText()` silently no-op'd; `drawCharts()` returned early when the canvas wasn't found. Removed the whole section, which incidentally removes the 4-fetch parallel batch that fed it.

Result: `4 runtime JSON requests → 0`. Target met without needing SSR KPI plumbing or inlined chart JSON (there was nothing to inline).

## Kynästä parity

- Unit test `Kynästä ↔ Valtuustotyö chronology parity` proves at the projection level: `buildKynastaHubModel(...).council.groups.speeches.latestItems.slice(0,5).map(pageUrl) === buildValtuustotyoPage(...).speeches.slice(0,5).map(url)` for the same corpus.
- Playwright test proves the SSR HTML level: fetches both `/kynasta/` and `/valtuustotyo/`, extracts the two 5-URL slices, asserts strict equality.
- Verified for both council speeches AND initiatives.

## Public JSON contracts retained

All four endpoints still resolve identically after the workstream:
- `/data/council-speeches.json` — content byte-identical (same enrichment via shared helper)
- `/data/initiatives.json` — unchanged
- `/data/publications.json` — unchanged
- `/data/content.json` — unchanged

Playwright `Public JSON endpoints retained` test asserts each still returns 200 with `items` payload.

`tests/unit/json-feeds.test.js` still passes (untouched).

## `/politiikka/` unchanged

Zero changes to `src/fi/politiikka.md`. Its `/data/publications.json` runtime consumer is retained. Playwright `/politiikka/ unaffected regression` test asserts `/politiikka/` still fetches `/data/publications.json` at runtime.

## Exact file inventory

Reconciled against `git diff --name-status` and `git ls-files --others`.

**New (6):**
- `src/_utils/councilSpeech.js` — canonical classification + comparators
- `src/_utils/councilEnrichment.js` — shared enrichment
- `src/_utils/valtuustotyoPage.js` — SSR projection factory
- `src/valtuustotyo.11tydata.js` — eleventyComputed adapter
- `tests/unit/valtuustotyoPage.test.js` — 20 unit tests
- `tests/valtuustotyo-ssr-01.spec.js` — 13 Playwright tests

**Modified (5):**
- `eleventy.collections.js` — imports shared `isCouncilSpeech`; removes local duplicate
- `src/_utils/kynastaHubPage.js` — re-exports shared `isCouncilSpeech`; removes local duplicate
- `src/data/council-speeches.json.11ty.js` — imports shared `enrichCouncilSpeech`; removes local duplicate
- `src/valtuustotyo.njk` — rewritten SSR + thin DOM-based JS (1028 → 322 LOC)
- `tests/unit/kynastaHubPage.test.js` — updated fixtures to include `type: "puhe"` explicit guard (accepts new shared-helper hardening)

**New documentation (1):**
- `docs/valtuustotyo-ssr-01-closure-2026-09-03.md` (this file)

**Deleted (0):** No files removed. Public JSON producers retained per §10.

**Total: 6 new + 5 modified + 1 doc + 0 deleted = 12 file changes.**

## Tests

- `npm run test:unit` → **774 / 775 pass**. Single failure is the pre-existing `searchQualityRegressionBenchmark.test.js:pageCountEn === 318` (actual 319) — verified on clean `origin/main` in prior workstream, not caused by VALTUUSTOTYO-SSR-01, out of scope per convention.
- Focused Playwright — 26 tests (13 new valtuustotyo + 13 kynasta-hub-02 regression) → **all pass**
- Shared find-explore.js regression — 58 tests (thesis-search-ux-01 + thesis-hub-02 + f3a-theses-find-explore) → **all pass**
- Non-Playwright gates:
  - `check:i18n-seo` → OK for 1458 HTML files
  - `check:jsonld` → 0 errors (only baseline `article-headline-length: 63`)
  - `check:researchfi-integrity` → OK
  - `git diff --check` → clean
- Build: 1471 files written; Pagefind indexes 1458 documents; presentation invariants 135 / 79 unchanged

## Architecture

- `VALTUUSTOTYO-SSR-01 = READY TO REVIEW`
- `Architecture Closure 1.0 = CLOSED / GREEN / MAIN` (unaffected; this is post-closure cleanup)
- `KYNÄSTÄ-HUB-02 = CLOSED / GREEN / MAIN` (chronology parity strengthened, contract intact)
- `THESIS-SEARCH-UX-01 = CLOSED / GREEN / MAIN` (regression suite still passes)
- `PF5 = CLOSED / MAINTENANCE` (no changes)

This workstream is **cleanup / convergence** — one shared canonical projection replaces three duplicate implementations of council-speech classification + one duplicate enrichment path + one full runtime-JSON archive rendering path.

No canonical taxonomy changed. No public JSON contract broken. No new client-side content model. `/politiikka/` untouched.
