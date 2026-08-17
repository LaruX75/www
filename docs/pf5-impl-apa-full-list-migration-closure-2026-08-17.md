# PF5-IMPL-APA — Full Pagefind Publications List Migration Closure

Date: 2026-08-17
Status: **PF5-IMPL-APA = LANDED / GREEN (local)**
Branch: `claude/pub-cite1-impl-phase1-csl-projection`

## 1. Branch

`claude/pub-cite1-impl-phase1-csl-projection` — the same branch the
prior two PUB-CITE1 phases landed on. Head base commit for this
migration: `170e1e46` (Phase 2 shared CSL renderer + SSR list v2).

## 2. Commit SHA(s)

Single commit to be applied: see §14 in the final tool run.

## 3. Files modified

- `src/js/find-explore.js` — publications kind now (a) leads each row
  with the shared CSL APA sentence via `publicationCitationBody`,
  (b) opts in to `showAllByDefault: true` so an empty query + empty
  filter list falls back to the publications seed query and Pagefind
  returns the entire canonical set, (c) raises `maxResults` to 200 so
  the 56-item canonical set is never silently truncated, and
  (d) attaches `data-csl="<json>"` to the export-citation button so
  the citation modal reaches the shared browser renderer without
  re-parsing raw strings.
- `src/julkaisut.njk` — loads `/js/publication-citation.js`, replaces
  the "Uusimmat julkaisut" duplicate SSR opening list with a short
  A–G orientation card, adds a Finnish loading / no-script message
  that states the interactive list requires JavaScript and that
  individual detail pages remain server-rendered.
- `src/en/publications.njk` — loads `/js/publication-citation.js`,
  replaces the "Latest publications" duplicate SSR opening list with
  a short A–G orientation card, updates loading / no-script message.
- `src/_utils/publicationsFindExplore.js` — removes `openingItems` from
  the page model output (no remaining consumer).
- `scripts/audit-pub-cite1-phase2-shared-csl-renderer.js` — replaces
  the now-superseded "opening list still present" gates with
  post-PF5-IMPL gates: `openingListPartialDeleted`,
  `findExploreRendererUsesSharedRenderer`,
  `findExploreCitationButtonEmitsCsl`,
  `findExploreRendererReadsCsl`,
  `enPublicationsLoadsSharedRenderer`.

## 4. Files / code paths deleted

- `src/_includes/publications-opening-list.njk` — the SSR partial that
  previously drove the "opening list" on both hub pages. No other
  consumer references it (grep across `src/ scripts/ tests/`).
- `publicationsFindExplorePage.openingItems` — the page-model field
  that fed the deleted partial's `slice(0, 8)`.
- The `<section id="julkaisuluokat">` block in `src/julkaisut.njk`
  and the `<section id="researchfi-julkaisut">` block in
  `src/en/publications.njk` that contained the duplicate SSR list
  (replaced with a short A–G orientation card).

### Explicitly not deleted in this migration

- Inline legacy `buildApaCitation/buildMlaCitation/buildChicagoCitation/
  buildBibtexEntry/buildRisEntry` (5 functions, ~130 lines) inside
  `src/julkaisut.njk` — they remain as export-modal fallback per
  PUB-CITE1 Phase 2 §H rule ("KEEP legacy fallback in Phase 2").
  Phase 4 candidates, listed in §20.
- `buildLegacyFiPublicationRows()` in `src/_data/publicationsPage.js`
  (unrelated consumer path; not touched).
- Server-side `buildApaCitation` in `src/_data/researchfiContent.js`
  (used as `detail.citation` fallback on the detail page).
- Publication detail templates, JSON-LD, sitemap entries, Pagefind
  metadata projection, `PUBLIC_PUBLICATIONS_PAGE_FIELDS` allowlist —
  none touched.
- Charts (Chart.js), KPI cards, hero, analytics scripts on both hubs.

## 5. Before → after data flow

**Before (PARTIAL migration):**

```
canonical publication
  → publicationsPage.items / publicationsFindExplorePage.records
     ├── SSR publications-opening-list.njk (first 8, bibliographic APA rows)
     └── <script id="publicationFindExploreRecords"> (all 56)
            → Find & Explore + Pagefind
                → renderPublicationResult (authors · type · venue meta line)
```

**After (FULL migration):**

```
canonical publication
  → publicationsPage.items / publicationsFindExplorePage.records
     ├── SSR hub shell (hero + KPIs + A–G orientation card, no list rows)
     └── <script id="publicationFindExploreRecords"> (all 56)
            → Find & Explore + Pagefind
                → renderPublicationResult
                    → publicationCitationBody
                       → window.publicationCitation.buildCitation({csl, "apa"})
```

The shared renderer is the same UMD module used at build time by the
Nunjucks `publicationCitation` filter and by the detail page's
"Lähdeviite" card, so SSR/client formatter drift remains
architecturally impossible.

## 6. Canonical publication count

**56** (unchanged from Phase 1 / Phase 2 baseline).

## 7. Pagefind publication count

**56** publication-tagged fragments in
`_site/pagefind/fragment/*.pf_fragment`.

## 8. ID parity

| Compared set                | Missing | Extra | Duplicate | Wrong landing URL |
| --------------------------- | ------- | ----- | --------- | ----------------- |
| Canonical ↔ FI hub records  | 0       | 0     | 0         | 0                 |
| Canonical ↔ EN hub records  | 0       | 0     | 0         | 0                 |
| Canonical ↔ Pagefind        | 0       | 0     | 0         | 0                 |

Machine data:
`docs/data/pf5-impl-apa-full-list-parity-2026-08-17.json`.

The three promoted editorial `.md` records (approved via
`MANUAL_PUBLICATION_RULES`) legitimately point at
`/2025/02/05/faktabaari-generation-ai-projekti/`,
`/2025/02/05/faktabaari-tekoalytaitojen-opettaminen-generation-ai-sovellusten-avulla/`,
and `/2020/04/15/etaopetuksen-nayton-paikka/` — Pagefind indexes them
correctly under their canonical URLs and the parity audit accepts
them without special-casing.

## 9. FI / EN Pagefind global counts

- FI HTML documents indexed: **1163**
- EN HTML documents indexed: **346**

Unchanged from the Phase 1 / Phase 2 baseline.

## 10. A–G facet counts (full-list default)

Both canonical and Pagefind agree:

| Group        | Count |
| ------------ | ----- |
| A            | 29    |
| B            | 9     |
| C            | 1     |
| D            | 6     |
| E            | 5     |
| G            | 1     |
| (none)       | 5     |

The `(none)` bucket is the three promoted editorial records plus two
Research.fi records that lack an OKM `publicationGroup` — this is
Phase 1's canonical data shape, not a PF5-IMPL regression.

## 11. Publication APA renderer data flow (visible surface)

`src/js/publication-citation.js` (UMD isomorphic) →
`window.publicationCitation.buildCitation({csl, style})` →
`renderPublicationResult` in `src/js/find-explore.js` →
`<p class="find-explore-result-publication-citation">` in the DOM.

Detail page still uses:
`csl | publicationCitation("apa")` Nunjucks filter (Node re-export of
the same module) → `<p class="mb-0">` inside the "Lähdeviite" card.

## 12. All test results

- `npm run test:unit` — **458 / 458 pass** (Phase 1: 28 CSL + Phase 2:
  29 renderer/parser + baseline).
- `npm run build:no-og` — green. Pagefind `fi:1163 / en:346`.
- Static + runtime audits (all green):
  - `audit-pf5-impl-apa-full-list-parity.js` — 8 / 8 gates.
  - `audit-pub-cite1-phase2-shared-csl-renderer.js` — 20 / 20 gates
    (updated to reflect deletion of the SSR partial).
  - `audit-pub-cite1-phase1-csl-projection.js` — 19 / 19 gates.
  - `audit-pub-cite1-publication-citation-csl.js` — all gates green.
  - `audit-publications-page-projection.js` — 0 unexpected fields,
    0 leakage.
  - `audit-pf-perf1-pagefind-startup.js` — 8 / 8 gates.
    Shared JS bytes: `find-explore` 29625, `starter-chips` 3633,
    `pagefind-ui` 119987. `find-explore.js` grew ~2.7KB (from 26938
    to 29625) for the shared-renderer wiring + full-list ceiling.
  - `audit-pf4-result-card-hierarchy.js` — 19 / 19 gates.
  - `audit-pf-starter-chips.js` — 11 / 11 gates.
  - `audit-pf3-result-card-consistency.js` — 9 / 9 gates.
  - `audit-pf2-sisalto-facet.js` — 9 / 9 gates, coverage
    `publications:56 writings:234 theses:169 media:73 presentations:218`.
  - `audit-media-pagefind-m2.js` — all gates including reverse
    `noDetailUsesPagefindBody`.
  - `audit-presentation-pagefind.js` — `ok: true`.
  - `audit-pf5-native-result-card-variants-apa7.js` — all gates green,
    readiness `publicationsApa=READY`.
  - `audit-pf-ui-l10n1-finnish-search-labels.js` — 10 / 10 gates.

## 13. Browser smoke results

`tests/pf5-impl-apa-full-list.spec.js` — **5 / 5 pass**:

1. FI full-list initial load — `Status = "56 tulosta"`,
   `.find-explore-result-publication-citation` visible, first title
   link points at a canonical landing.
2. EN full-list initial load — `Status = "56 results"`,
   `.find-explore-result-publication-citation` visible.
3. FI A-group filter — `Status = "29 tulosta"`.
4. FI reset — returns to `"56 tulosta"`.
5. FI citation modal — export button carries `data-csl`, modal opens,
   preview textarea contains the shared renderer's output.

Regression smokes (also 18 / 18 in the combined sweep):
- `tests/pf-perf2-first-search-latency.spec.js` — 5 / 5.
- `tests/pf-ui-l10n1-finnish-search-labels.spec.js` — 6 / 6.
- `tests/f3b-publications-find-explore.spec.js` — 2 / 2.

## 14. Accessibility results

Not re-run in this local session — matches the site policy that the
full `test:a11y` sweep runs post-push. The changes here:
- reduce the DOM element count on both hub pages (SSR list rows go
  from 8 to 0);
- keep the `[data-find-explore-status]` `role="status" aria-live="polite"`
  element that announces the loading state, the initial "Loading
  publications list..." message, and the result count once Pagefind
  returns;
- keep the `<noscript>` fallback text now explicitly directing users
  to the site search / sitemap / search engines;
- keep the Pagefind result region as an `<ol data-find-explore-results>`
  so keyboard/screen reader traversal is unchanged;
- keep semantic `<a>` for the citation title link inside the APA row.

## 15. Research population

`audit-f4-research-built-output.js` was not re-run in this closure
sweep (no Research-side code was touched), but the last recorded
value is **317** and the Pagefind `Sisältö:*` coverage in
`audit-pf2-sisalto-facet` is unchanged.

## 16. HTML bytes /julkaisut/ before → after

| Page                      | Before (bytes) | After (bytes) | Δ         |
| ------------------------- | -------------- | ------------- | --------- |
| `/julkaisut/`             | 276 838        | 252 517       | −24 321   |
| `/en/publications/`       | 233 162        | 222 889       | −10 273   |
| Combined                  | 510 000        | 475 406       | **−34 594** |

## 17. DOM element count before → after

- `.publication-opening-item` in `/julkaisut/`: 8 → **0**
- `.publication-opening-item` in `/en/publications/`: 8 → **0**
- Combined initial SSR publication list rows: 16 → **0**

The Find & Explore renderer builds all 56 rows client-side on load
once Pagefind's initial search returns.

## 18. JS / network / runtime JSON impact

- `src/js/find-explore.js`: 26 938 → 29 625 bytes (+2 687, ~+10%
  for the shared-renderer body, full-list ceiling, and data-csl
  emission).
- `src/js/publication-citation.js`: 14 737 bytes (added on both hubs
  — was already on `/julkaisut/` after Phase 2; new on
  `/en/publications/`).
- No new runtime JSON fetches — the Find & Explore records still ship
  inline in a `<script id="publicationFindExploreRecords">` block.
- Pagefind index size unchanged (index is generated per detail page,
  not per hub-page shape).

## 19. Legacy remaining

- Inline `buildApaCitation` / `buildMlaCitation` /
  `buildChicagoCitation` / `buildBibtexEntry` / `buildRisEntry` in
  `src/julkaisut.njk` (~130 lines) — kept as export-modal fallback.
- Server-side `buildApaCitation` in `src/_data/researchfiContent.js`
  — kept as `detail.citation` fallback.
- `buildLegacyFiPublicationRows()` in
  `src/_data/publicationsPage.js` — unrelated consumer path.

## 20. Remaining PUB-CITE1 Phase 4 deletion candidates

- Inline browser formatters in `src/julkaisut.njk`
  (`buildApaCitation`, `buildMlaCitation`, `buildChicagoCitation`,
  `buildBibtexEntry`, `buildRisEntry`) — deletion is safe once
  every export-citation button on the site is guaranteed to carry a
  usable `data-csl` attribute AND the shared renderer is loaded
  everywhere those buttons appear. After PF5-IMPL-APA both are true
  on `/julkaisut/`; verify for any future page adding the modal.
- Server APA composer `buildApaCitation` in
  `src/_data/researchfiContent.js` — safe to delete once
  `detail.citation` in `publication-item-body.njk` unconditionally
  reads from `detail.csl | publicationCitation("apa")` (currently
  falls back to `detail.citation` when `csl` is missing; Phase 4
  should audit whether any record can be missing `csl`).
- `buildLegacyFiPublicationRows()` if no external consumer touches
  it. Audit before removing.

## 21. Risks / notable observations

- The single-run Playwright execution of the smoke suite failed once
  on the "FI reset" test on cold start (Pagefind wasm import racing
  with the test's status assertion). The retry passed. This is not a
  code regression; it is Pagefind warmup timing. The smoke uses
  `timeout: 15000` on the `[data-find-explore-status]` assertions to
  absorb this; consider raising to 20000 if CI flakes.
- The full-list default is implemented as a per-kind opt-in
  (`showAllByDefault: true`). Other Find & Explore consumers
  (writings, theses, presentations, research context) are
  unchanged. Publications FULL does not imply Theses / Writings /
  Presentations / Media should adopt the same UX; that is an
  explicit publication-domain decision per prompt §13.
- Result cap raised from 50 → 200 only for the publications kind. If
  the canonical set grows past 200, revisit.
- The A–G orientation card on both hubs preserves the classification
  explanation the previous "opening list" heading used to carry, so
  users landing on either hub still see the semantics of A / B / C /
  D / E / G before interacting with the search.
- The `find-explore-result-publication-citation` class currently has
  no bespoke CSS; the row inherits the existing PF3/PF4 card
  spacing. A tiny CSS pass to slightly bump line-height / body-font
  might improve readability but is a UX polish item, not a blocker.

## 22. Suggested next step

**PUB-CITE1 Phase 4 audit** — a static + runtime audit that confirms
every citation surface (list rows, detail card, export modal) reads
from the shared renderer, that every canonical record carries `csl`,
and that no inline formatter has a code path reachable from a page
without the shared renderer loaded. Only after that audit is green
should the ~130 lines of inline formatters in `src/julkaisut.njk`
and the server-side APA composer be deleted.

Do **not** start Phase 4 in this task.
