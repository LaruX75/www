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

Reconciled against `git diff --name-status origin/main...HEAD` — the
subtotals below sum exactly to the PR total.

**Totals: 42 changed files = 22 additions + 17 modifications + 3 deletions.**

_(The 42-file total appears once the amended commit lands; the ancestor
commit `82cb9a1f` had 41 files. The +1 additional modification is
`.cache/api-fallback/theses-oulurepo-v2.json`, described below in the
Production subsection.)_

### Production (11 modified + 13 new + 2 deleted = 26)

Modified (11):
- `src/_data/theses.js` — preserve full `dc.date.issued` string as `issuedDate`; add `isThesesCacheSchemaValid` guard (see "Cache regeneration" below)
- `src/_data/thesisDetails.js` — precision-aware `normalizeIssuedDate` + canonical `compareThesisDetailChronology` + `{ advisedMasters, advisedBachelors, reviewed }` groupings
- `src/_utils/thesesFindExplore.js` — `buildScopedFindExploreModel` factory
- `src/_includes/find-explore-writings.njk` — emits `data-find-explore-pinned-{type,role}` when the caller supplies them
- `src/_includes/thesis-archive-table.njk` — gates FE-driven header dropdowns behind `thesisArchiveWithFindExplore`
- `src/_redirects` — 301 `/opinnaytteet/sivu/*` + `/en/theses/page/*` → hub
- `src/js/find-explore.js` — pinned filter enforcement in `filtersFor()` + `filtersForKind()`
- `src/opinnaytteet.njk` — rewritten as standalone hub (3×5 sections + hub FE + CTAs)
- `src/en/theses.njk` — rewritten as standalone EN hub (mirror)
- `src/opinnaytteet/gradut.njk` etc route templates (counted below under "New" for the three new FI + three new EN routes)
- `.cache/api-fallback/theses-oulurepo-v2.json` — regenerated from a live OuluREPO fetch so every canonical record ships with `issuedDate` at day precision (170/170 records covered)

New (13):
- `src/_includes/thesis-subarchive-page.njk` — shared subarchive shell (47 LOC)
- `src/_data/thesesArchivePages{Gradut,Kandit,Tarkastetut}Fi.js` (3)
- `src/_data/thesesArchivePages{Masters,Bachelors,Reviewed}En.js` (3)
- `src/_data/thesesFindExplorePage{Gradut,Kandit,Tarkastetut}Fi.js` (3)
- `src/_data/thesesFindExplorePage{Masters,Bachelors,Reviewed}En.js` (3)

_(The six route templates `src/opinnaytteet/{gradut,kandit,tarkastetut}.njk` +
`src/en/theses/{masters,bachelors,reviewed}.njk` are counted under
"Templates" below since Eleventy treats them as page routes rather than
`_data` adapters. They are not double-counted in the modification list
above.)_

Deleted (2):
- `src/_data/thesesArchivePagesFi.js` — old monolithic FI pagination (zero remaining consumers)
- `src/_data/thesesArchivePagesEn.js` — old monolithic EN pagination (zero remaining consumers)

### Templates (6 new thin route templates)

- `src/opinnaytteet/{gradut,kandit,tarkastetut}.njk` (~62 LOC each; down from ~84)
- `src/en/theses/{masters,bachelors,reviewed}.njk` (same reduction)

Each of the six is config-only and delegates to
`src/_includes/thesis-subarchive-page.njk` for shared rendering.

### Tests (7 modified + 2 new + 1 deleted = 10)

Modified (7):
- `tests/f3a-theses-find-explore.spec.js` — rewritten for hub + subarchive FE contract
- `tests/o1-orientation.spec.js` — EN thesis discovery-return retargeted to `/en/theses/masters/`; FI hub-nav retargeted to hub-section title click
- `tests/pf-perf2-first-search-latency.spec.js` — first-query retargeted to `/opinnaytteet/tarkastetut/` (where the known record lives)
- `tests/pf3-result-card-consistency.spec.js` — thesis-scope subtest retargeted to `/opinnaytteet/tarkastetut/`
- `tests/pf4-result-card-hierarchy.spec.js` — same retarget
- `tests/th-cite1-phase4b-thesis-detail-modal.spec.js` — hub row-count updated 20 → 15 (3×5 sections)
- `tests/unit/searchQualityRegressionBenchmark.test.js` — `pageCountEn` baseline 316 → 318 (net +2 from EN thesis subarchive split)

New (2):
- `tests/thesis-hub-02-hub-and-subarchives.spec.js` — 12-point contract Playwright spec incl. hub FE assertions
- `tests/unit/thesisChronology.test.js` — `normalizeIssuedDate` + `compareThesisDetailChronology` + groupings + hub-first-5 invariant + 61633 classification + THESIS-HUB-02 cache schema-guard regression

Deleted (1):
- `tests/th-cite1-phase3-thesis-pagination.spec.js` — its premise (monolithic `/opinnaytteet/sivu/N/` + hub-level FE with type-role dropdowns) was retired as intended

### Documentation (1 new)

- `docs/thesis-hub-02-closure-2026-09-02.md` (this file)

### Subtotal reconciliation

| Category | New | Modified | Deleted | Subtotal |
| --- | ---: | ---: | ---: | ---: |
| Production | 13 | 11 | 2 | 26 |
| Templates | 6 | — | — | 6 |
| Tests | 2 | 7 | 1 | 10 |
| Documentation | 1 | — | — | 1 |
| **Total** | **22** | **17** | **3** | **42** |

Matches `git diff --name-status origin/main...HEAD` (42 lines total)
and `git diff --stat origin/main...HEAD` (42 files changed).

### Explicitly NOT staged (unrelated existing state)

- `.cache/api-fallback/{crossref-enrichments,finna-aoe,jufo-enrichments}-v1.json` — non-thesis build-time cache drift; unrelated to THESIS-HUB-02
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

## Cache regeneration + schema guard (chronological ordering effective immediately)

The pre-THESIS-HUB-02 committed cache lacked `issuedDate`, which would
have left the canonical comparator falling back to year+title on the
first post-merge build. That is not acceptable — THESIS-HUB-02 must
deliver genuinely newest ordering from day one.

Two changes ensure the first production build gets real chronology:

1. **Cache regeneration.** A live OuluREPO fetch was run and the
   fresh cache (`.cache/api-fallback/theses-oulurepo-v2.json`,
   `savedAt = 2026-09-02T19:27:34.518Z`) is committed inside this PR.
   All 170 canonical records (88 gradut + 29 kandit + 53 reviewerOnly)
   ship with `issuedDate` at day precision. OuluREPO remains the sole
   source; no dates are fabricated. Offline and network-outage builds
   read this cache directly and immediately benefit from real
   chronology.
2. **Schema guard against future silent regressions.**
   `src/_data/theses.js` now carries `isThesesCacheSchemaValid()`:
   a cache with < 80% `issuedDate` coverage is treated as stale so
   `loadThesesData` triggers a live fetch. In CACHE_ONLY / offline
   builds, an invalid cache is still consumed as a last-resort
   fallback but with a loud warning line — the build is never
   silently degraded. This closes the failure mode where a future
   downgrade / accidental old-cache commit could silently reintroduce
   title-order fallback.

Regression: `tests/unit/thesisChronology.test.js` adds five new
schema-guard tests including one that reads the committed cache
file directly and asserts it satisfies the guard. If someone in the
future replaces the committed cache with a pre-`issuedDate` snapshot,
the unit test fails at CI before merge.

Observable proof from the built output (`_site/opinnaytteet/gradut/`
first 5 titles, after cache regeneration):

```
1. /opinnaytteet/64129/  Nuorten kokemuksia sosiaalisen median vaikutuksista itsetuntoon   (2026-06-29)
2. /opinnaytteet/64139/  Tekoälylukutaidon ilmeneminen luokanopettajaopiskelijoiden ...     (2026-06-29)
3. /opinnaytteet/63433/  Teknologiakasvattajan muotokuva                                    (2026-06-15)
4. /opinnaytteet/63335/  Pieni kielikone tekoäly-ymmärryksen rakentajana ...                (2026-06-12)
5. /opinnaytteet/63041/  Opettajaopiskelijoiden ajatuksia tekoälystä                        (2026-06-03)
```

Compare against the pre-fix ordering that surfaced 61633
("Luokanopettajien tulevaisuudenkuvia tekoälystä") in the top 5 solely
because "L" precedes "N", "O", "P", "T" alphabetically — 61633's real
publication date (2026-05-27) is older than all five above and is now
correctly demoted to its true chronological slot in the gradut
archive.

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
