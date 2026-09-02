# THESIS-HUB-02 — Closure

**Status:** READY TO MERGE
**Date:** 2026-09-02
**Base SHA:** `c4a59116245e62a43e025e1e2769908f0ec5c19b`
**Final UX contract:** hub landing + hub Find & Explore (all theses) + three
scoped subarchives per language with scoped Find & Explore.

## Final Pagefind contract

### Hub Find & Explore

- Scope: **complete canonical thesis set** (advised master's + advised
  bachelor's + reviewer-only combined)
- Label: `Hae opinnäytteistä` (FI) / `Search theses` (EN)
- Filters: `FindExplore = theses`, plus scope + language; **no pinned
  type, no pinned role**
- Guarantees:
  - Cannot leak publications / presentations / writings / media into
    results (kind filter is `theses`).
  - Specific results navigate to the canonical thesis detail page
    `/opinnaytteet/{id}/` (never to an archive landing).
  - Reset restores the resting-state 3 × latest-five SSR hub sections
    (which were never removed — the FE results container is its own
    element).

### Subarchive Find & Explore

Same shared FE mechanism with hard scope pinning enforced client-side
via `data-find-explore-pinned-type` / `data-find-explore-pinned-role`:

| Subarchive | Pinned type | Pinned role |
| --- | --- | --- |
| `/opinnaytteet/gradut/` | `masterThesis` | `advised` |
| `/opinnaytteet/kandit/` | `bachelorThesis` | `advised` |
| `/opinnaytteet/tarkastetut/` | *(none — reviewed may span types)* | `reviewed` |
| `/en/theses/masters/` | `masterThesis` | `advised` |
| `/en/theses/bachelors/` | `bachelorThesis` | `advised` |
| `/en/theses/reviewed/` | *(none)* | `reviewed` |

Specific results still navigate to `/opinnaytteet/{id}/`. Old
`/opinnaytteet/sivu/N/` + `/en/theses/page/N/` pagination has been
removed with `_redirects` 301s to the corresponding hub.

## Architecture invariants

- **Canonical grouping + chronology single-owner**: `src/_data/thesisDetails.js` produces `{ advisedMasters, advisedBachelors, reviewed }` arrays plus a `compareThesisDetailChronology` comparator that is precision-aware (`issuedDate` sort key with `day`/`month`/`year`/`none` precision — **no fabricated January 1 for year-only records**).
- **Pagination + FE model factories in shared utilities**: `src/_utils/thesesArchivePages.js` (`buildThesesArchivePages`, unchanged) + `src/_utils/thesesFindExplore.js` (new `buildScopedFindExploreModel`). All twelve `_data` wrappers are configuration-only delegates. Thin per-route data adapters are intentionally retained — they make Eleventy route ownership + data dependencies explicit and contain zero independent filtering/grouping/sorting/pagination or FE model logic.
- **One shared subarchive rendering shell**: `src/_includes/thesis-subarchive-page.njk` owns hero + FE include + archive-table include + footer. Each of the six subarchive route templates is a thin config file: frontmatter + `{% set ... %}` block + `{% include "thesis-subarchive-page.njk" %}`.
- **Pagefind = discovery, SSR = archive/list/latest-five owner**: no runtime JSON → HTML archive path (verified by Playwright — no `/data/theses*` fetches happen during search).

## File-set inventory

### Production (13 modified + 12 new + 2 deleted)

Modified (10):
- `src/_data/theses.js` — preserve full `dc.date.issued` string as `issuedDate`
- `src/_data/thesisDetails.js` — precision-aware normalize + canonical comparator + `{advisedMasters, advisedBachelors, reviewed}` groupings
- `src/_utils/thesesFindExplore.js` — `buildScopedFindExploreModel` factory
- `src/_includes/find-explore-writings.njk` — emits `data-find-explore-pinned-{type,role}` when the caller supplies them
- `src/_includes/thesis-archive-table.njk` — gates FE-driven header dropdowns behind `thesisArchiveWithFindExplore`
- `src/_redirects` — 301 `/opinnaytteet/sivu/*` + `/en/theses/page/*` → hub
- `src/js/find-explore.js` — pinned filter enforcement in `filtersFor()` + `filtersForKind()`
- `src/opinnaytteet.njk` — rewritten as standalone hub (3×5 sections + hub FE + CTAs)
- `src/en/theses.njk` — rewritten as standalone EN hub (mirror)
- `src/_data/thesisDetails.js` — canonical model (double-counted above)

New (13):
- `src/_includes/thesis-subarchive-page.njk` — shared subarchive shell (47 LOC)
- `src/_data/thesesArchivePages{Gradut,Kandit,Tarkastetut}Fi.js` (3)
- `src/_data/thesesArchivePages{Masters,Bachelors,Reviewed}En.js` (3)
- `src/_data/thesesFindExplorePage{Gradut,Kandit,Tarkastetut}Fi.js` (3)
- `src/_data/thesesFindExplorePage{Masters,Bachelors,Reviewed}En.js` (3)

New (6 thin route templates):
- `src/opinnaytteet/{gradut,kandit,tarkastetut}.njk` (avg ~62 LOC after consolidation, down from ~84)
- `src/en/theses/{masters,bachelors,reviewed}.njk` (same reduction)

Deleted (2):
- `src/_data/thesesArchivePagesFi.js` — old monolithic FI pagination (zero remaining consumers)
- `src/_data/thesesArchivePagesEn.js` — old monolithic EN pagination (zero remaining consumers)

### Tests (7 modified + 2 new + 1 deleted)

Modified (7):
- `tests/f3a-theses-find-explore.spec.js` — rewritten for hub + subarchive FE contract
- `tests/o1-orientation.spec.js` — EN thesis discovery-return retargeted to `/en/theses/masters/`; FI hub-nav retargeted to hub-section title click
- `tests/pf-perf2-first-search-latency.spec.js` — first-query retargeted to `/opinnaytteet/tarkastetut/` (where the known record lives)
- `tests/pf3-result-card-consistency.spec.js` — thesis-scope subtest retargeted to `/opinnaytteet/tarkastetut/`
- `tests/pf4-result-card-hierarchy.spec.js` — same retarget
- `tests/th-cite1-phase4b-thesis-detail-modal.spec.js` — hub row-count updated 20 → 15 (3×5 sections)
- `tests/unit/searchQualityRegressionBenchmark.test.js` — `pageCountEn` baseline 316 → 318 (net +2 from EN thesis subarchive split)

New (2):
- `tests/thesis-hub-02-hub-and-subarchives.spec.js` — full 12-point contract spec including hub FE assertions
- `tests/unit/thesisChronology.test.js` — `normalizeIssuedDate` + `compareThesisDetailChronology` + groupings + hub-first-5 invariant + 61633 classification

Deleted (1):
- `tests/th-cite1-phase3-thesis-pagination.spec.js` — its premise (monolithic `/opinnaytteet/sivu/N/` + hub-level FE with type-role dropdowns) was retired as intended

### Documentation (1 new)

- `docs/thesis-hub-02-closure-2026-09-02.md` (this file)

### Explicitly NOT staged (unrelated existing state)

- `.cache/api-fallback/{crossref-enrichments,finna-aoe,jufo-enrichments}-v1.json` — build-time cache drift
- `docs/modern-web-eleventy-audit-2026-08-31.md`, `docs/post-closure-next-workstream-selection-2-2026-08-30.md`, `docs/post-closure-user-visible-ux-selection-2026-08-31.md`, `docs/web-capabilities-2026-suitability-audit-2026-08-31.md` — prior-session documents

## Template consolidation metric

Before shared shell: 6 subarchive templates × ~84 LOC = **502 LOC**, each with duplicated hero + FE + archive-table + footer markup.

After shared shell: 6 route templates × ~62 LOC + 47 LOC shell = **423 LOC total (−79 LOC, −15.7%)**. Each route template is config-only; the shared rendering path lives in one include.

Duplicated markup eliminated: hero, FE wiring, archive-table wiring, footer.

Route-specific values that remain in each thin template: pagination data key, permalink base, pinned type/role, tbody id, localized strings, breadcrumb + intro + footer copy.

## Coverage against the user-supplied 12-point contract

| # | Assertion | Test |
| --- | --- | --- |
| 1 | Hub has no full archive pagination | `thesis-hub-02` — "no pagination markers" |
| 2 | Hub renders exactly 3×5 groups | `thesis-hub-02` — "15 total title links" |
| 3 | Latest-five ordering uses canonical issued date | `thesisChronology.test.js` unit + hub-first-5 invariant in Playwright |
| 4 | Each CTA reaches its correct archive | Playwright — 3 CTA selectors visible per hub |
| 5 | Each subarchive has SSR pagination | Playwright — 6 subarchives with pagers; `/sivu/2/` + `/page/2/` reachable |
| 6 | Each subarchive FE correctly scoped | Playwright — `data-find-explore-pinned-{type,role}` attribute checks |
| 7 | Reset restores archive's SSR rows | Playwright — search then reset comparison |
| 8 | Cross-group leakage prevented | Playwright — kandi title on gradut returns 0 Kandi-typed rows |
| 9 | Search results still navigate to canonical detail | Playwright — result href matches `/opinnaytteet/\d+/` |
| 10 | FI/EN parity | Playwright — EN masters mirrors FI gradut pinning + tbody target |
| 11 | Legacy pagination URLs removed | Playwright — `/opinnaytteet/sivu/{2,3}/` + `/en/theses/page/{2,3}/` all non-200 |
| 12 | No runtime JSON → HTML archive path | Playwright — `/data/theses*` never fetched during search |

Plus the hub FE subcontract (new tests in `thesis-hub-02-hub-and-subarchives.spec.js`):
- FI hub mount is `data-find-explore-kind="theses"` + `scope="fi"` + no pinned type/role + label `Hae opinnäytteistä`
- EN hub mount is `data-find-explore-kind="theses"` + `scope="en"` + no pinned type/role + label `Search theses`
- Hub search across all theses returns thesis-detail hrefs only (no `/julkaisut/`, `/kirjoitukset/`, `/mediassa/`, `/presentations/` leakage)
- Hub search reaches records that scoped subarchives cannot (e.g. reviewer-only "Riikonen" is reachable from hub but not from gradut)
- Hub reset preserves the 3×5 SSR sections intact

## Verification

- `npm run test:unit` → **721 / 721 pass**
- `npm run check:i18n-seo` → OK for 1458 HTML files
- `npm run check:jsonld` → 0 errors (only pre-existing `article-headline-length: 63` baseline)
- `CACHE_ONLY=true node scripts/check-researchfi-integrity.js` → OK
- `npx @11ty/eleventy` → 1471 files written
- `node scripts/run-pagefind.js` → indexes 1458 HTML documents; presentation invariants unchanged (135 local / 79 custom)
- Focused Playwright — **54 / 54 pass** on thesis-touching specs (hub-and-subarchives, f3a, phase4b, pf3, pf4)
- o1-orientation thesis subset — 2 / 2 pass (`-g "thesis"`)
- pf-perf2 first-explicit-query — 1 / 1 pass alone

**Two pre-existing failures** in unrelated specs (`o1-orientation:109 FI presentation archive returnTo` and `pf-perf2:101 no data-pagefind-body on publication detail`) also fail on the unmodified base `c4a59116` — confirmed via `git stash` + re-run. Not caused by THESIS-HUB-02 and out of scope for this workstream.

## Cache dependency (chronological sort visibility)

The `issuedDate`-based chronological sort is **code-complete**. The OuluREPO cache (`.cache/api-fallback/theses-oulurepo-v2.json`) was serialized before the field existed, so cached records currently lack `issuedDate` and the comparator falls back to `year` (producing the same year-DESC + title-ASC behavior as before). The next live OuluREPO fetch regenerates the cache and the ordering improvement takes effect immediately. Unit tests exercise the correct code path directly against synthetic records with explicit `issuedDate` values.

## Not measured / not changed

- `/data/theses.json` public JSON — untouched. All consumer contracts intact.
- Detail route `/opinnaytteet/{id}/` — unchanged. Detail model / citation modal / share menu preserved exactly as after TH-CITE1 Phase 4B.

## Architecture

- `THESIS-HUB-02 = READY TO MERGE`
- Hub FE (all theses) + scoped subarchive FE — implemented and tested
- 12 thin per-route `_data` adapters intentionally retained; business logic remains single-owner in shared canonical utilities
- Shared subarchive rendering shell reduces template duplication by ~16% while keeping each route file config-only
- No parallel client content model; no runtime JSON → HTML path introduced
- Old monolithic `/opinnaytteet/sivu/N/` pagination removed with `_redirects`
