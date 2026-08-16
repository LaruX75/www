# PUB-CITE1 Phase 1 — CSL-JSON Projection Landing Closure

Date: 2026-08-16
Status: **PUB-CITE1 PHASE 1 CSL PROJECTION = LANDED / GREEN (local)**
Branch: `claude/pub-cite1-impl-phase1-csl-projection`
Base: main HEAD `cae90cd7` (`docs: audit PUB-CITE1 publication citation + CSL-JSON readiness`)

## 1. Scope delivered

Phase 1 is an **additive projection**. The canonical publication model,
the source ordering, the dedup logic, the server APA composer, and the
inline citation/BibTeX/RIS composers in `src/julkaisut.njk` are all
unchanged. What is new:

- New module `src/_utils/publicationCsl.js` implements
  `buildCslItem(canonicalPublication)` — a deterministic, side-effect
  free projection from the current canonical publication shape onto
  CSL-JSON.
- `PUBLIC_PUBLICATIONS_PAGE_FIELDS` allowlist gains one field: `"csl"`.
- Canonical publication assembly in `createResearchfiPageItems()` and
  `createManualPageItems()` computes `csl` from the assembled record and
  attaches it before whitelisting.
- Publication detail model in `buildResearchfiDetail()` exposes the
  same `csl` field alongside the pre-existing server APA
  `citation` + `citationStyle` fields.
- Research.fi content item mapper (`researchfiContent.mapPublication`)
  exposes `csl` alongside `citation`.
- Find & Explore publication record builder
  (`buildPublicationFindExploreRecord`) forwards `item.csl` (defaults to
  null when absent).

## 2. CSL mapping table (implemented)

| Canonical field                                | CSL field                    |
| ---------------------------------------------- | ---------------------------- |
| `anchorId` (or `publicationId`, or `id`)       | `id`                         |
| `typeCode` (OKM A1–G5) via `OKM_TO_CSL_TYPE`   | `type`                       |
| `typeCode` (G1–G5) via `OKM_TO_CSL_GENRE`      | `genre` (thesis subtype)     |
| `title`                                        | `title`                      |
| `authors` (free-text, `;`-separated)           | `author[]` (`{family,given}` with `{literal}` fallback) |
| `journal`                                      | `container-title`            |
| `publisher`                                    | `publisher`                  |
| `volume`, `issue`                              | `volume`, `issue`            |
| `pages` (dash-normalized)                      | `page`                       |
| `doi` (prefix-stripped, lower-cased, `10.*` guarded) | `DOI`                  |
| `doiUrl` \|\| `url` (must be http/https)       | `URL`                        |
| `isbn`                                         | `ISBN`                       |
| `year`                                         | `issued.date-parts [[year]]` |
| `lang` (only `fi`/`en`/`sv`)                   | `language`                   |

Empty / missing values are omitted (not invented). The function returns
`null` when `id` or `title` is missing, or when input is not a plain
object.

### OKM → CSL type table (per audit §6)

| OKM code(s) | CSL type            |
| ----------- | ------------------- |
| A1, A2, A3  | `article-journal`   |
| A4          | `paper-conference`  |
| B1          | `article-magazine`  |
| B2, B3      | `chapter`           |
| C1, C2      | `book`              |
| D1–D6       | `article-magazine`  |
| E1–E3       | `article-newspaper` |
| F1–F3       | `chapter`           |
| G1–G5       | `thesis`            |

Unknown / missing codes fall back to `article-journal` (CSL's most
generic type). Callers that need OKM specifics still read `typeCode`
directly.

## 3. Consumers touched (four surfaces)

1. `src/_data/publicationsPage.js` — canonical projection carries `csl`
   through `PUBLIC_PUBLICATIONS_PAGE_FIELDS`.
2. `src/_data/publicationDetails.js` — `buildResearchfiDetail()` returns
   `csl` alongside `citation` / `citationStyle`.
3. `src/_data/researchfiContent.js` — `mapPublication()` stores `csl`
   on the content item.
4. `src/_utils/publicationsFindExplore.js` —
   `buildPublicationFindExploreRecord()` forwards `csl` (or `null`).

**Not touched in Phase 1** (per prompt):

- `src/julkaisut.njk` — inline BibTeX/RIS/APA/MLA/Chicago composers
  and `#citationExportModal` remain the visible citation renderer.
- `src/js/find-explore.js` — the shared renderer does not read `csl`.
- Pagefind metadata / index — no facet, filter, or meta added.
- Thesis or presentation surfaces — CSL is publication-only.

## 4. Boundaries preserved

- Canonical model shape, source-priority ordering (`researchfi` < `manual`),
  and dedup unchanged.
- Server-side APA composer (`buildApaCitation` in `researchfiContent.js`)
  unchanged.
- Inline client composers in `src/julkaisut.njk` (APA/MLA/Chicago/BibTeX/RIS)
  unchanged.
- Detail model `citation` / `citationStyle` unchanged.
- Pagefind index unchanged (`fi:1163 / en:346` — matches PF-UI-L10N1
  baseline).
- Find & Explore renderer output unchanged (CSL is projection-only in
  Phase 1; no chip, no formatter switch, no per-card mutation).
- Research population unchanged: **317** (F4 gate).
- No `Sisältö:Tutkimus`, no `data-pagefind-body` reintroduced, PF3
  family badge and PF4 hierarchy hooks intact, PF-PERF2 warmup +
  Enter-scroll handler intact.

## 5. Verification

### Local build

- `npm run build:no-og` — **green**. Pagefind entries: `fi:1163 / en:346`.
  Research.fi integrity check: 56 archive publications, 55 with
  research line, 54 with curated themes.

### Unit tests

- `npm run test:unit` — **429 / 429 pass** (was 401 pre-Phase-1;
  +28 new CSL tests).
- New file: `tests/unit/publicationCsl.test.js` — 28 assertions
  covering journal article, conference, book/chapter, thesis genre,
  DOI/URL/pages normalization, structured + free-text authors,
  missing fields, unknown OKM fallback, input immutability,
  determinism, and OKM coverage.

### Static + runtime audits (all green)

| Audit                                                        | Result                     |
| ------------------------------------------------------------ | -------------------------- |
| `audit-pub-cite1-phase1-csl-projection.js`                   | 19 / 19 gates green (new)  |
| `audit-pub-cite1-publication-citation-csl.js`                | all gates green (updated `cslProjectionImplemented` gate now green) |
| `audit-publications-page-projection.js`                      | 0 unexpected fields, 0 leakage |
| `audit-pf-perf1-pagefind-startup.js`                         | all 8 gates green          |
| `audit-pf4-result-card-hierarchy.js`                         | all 19 gates green         |
| `audit-pf-starter-chips.js`                                  | all 11 gates green         |
| `audit-pf3-result-card-consistency.js`                       | all 9 gates green          |
| `audit-pf2-sisalto-facet.js`                                 | all 9 gates green (750 detail records) |
| `audit-media-pagefind-m2.js`                                 | all gates green incl. reverse `noDetailUsesPagefindBody` |
| `audit-f4-research-built-output.js`                          | `totalResearchPopulation: 317` (unchanged) |
| `audit-presentation-pagefind.js`                             | `ok: true`                 |
| `audit-pf5-native-result-card-variants-apa7.js`              | all gates green (readiness unchanged: publicationsApa/thesesApa/presentationsHorizontal all READY) |
| `audit-pf-ui-l10n1-finnish-search-labels.js`                 | 10 / 10 gates green        |

### Browser smokes

- `tests/pf-perf2-first-search-latency.spec.js` — **5 / 5 pass**
  (Enter-scroll handler + warmup intact).
- `tests/pf-ui-l10n1-finnish-search-labels.spec.js` — **6 / 6 pass**.

### Runtime spot-check

- Built `_site/data/publications-page.json`: **56 / 56** canonical items
  carry a `csl` object.
- Built F&E record via `buildPublicationsFindExplorePageModel`:
  `csl` object present on the sample record with the expected `id` /
  `type` / `container-title` / `DOI` shape.

## 6. Known behaviour notes

- Research.fi delivers `authors` as a `;`-separated string in
  "Given Family" order (no comma). The parser preserves each name as
  `{literal}` in that case — this is the specified fallback, not a
  regression. When the string contains "Family, Given" the structured
  form is emitted. When the field is empty, `author` is omitted.
- The three promoted editorial `.md` records that lack a structured
  `author` field currently fall back to `"Jari Laru"` (existing behaviour
  in `createManualPageItems`) — the CSL projection therefore emits a
  single `{literal: "Jari Laru"}` author for those, which matches the
  visible archive rendering today.
- `language` is populated from the canonical record's `lang` field
  (`"fi"` for Research.fi items, `"fi"` or `"en"` for manual items,
  restricted to ISO 639-1 codes `fi`/`en`/`sv`).

## 7. What Phase 1 unlocks (not delivered here)

- **Shared client CSL renderer** — a single formatter that reads `csl`
  and produces APA/MLA/Chicago/BibTeX/RIS from one source of truth,
  replacing the five inline composers in `src/julkaisut.njk`.
- **PF5-IMPL-APA** — Find & Explore publication rows can render a
  proper APA string directly from `entry.record.csl` (no additional
  Pagefind metadata needed; PF5 audit already confirmed readiness).
- **Publications list v2** — templates can hydrate from `csl` instead
  of the ad-hoc per-field DOM composition.
- **Legacy inline composer deletion** — after PF5-IMPL-APA + list v2
  ship, `src/julkaisut.njk` inline composers can be removed.

## 8. Files changed

- **New**
  - `src/_utils/publicationCsl.js` — projection module.
  - `tests/unit/publicationCsl.test.js` — 28 assertions.
  - `scripts/audit-pub-cite1-phase1-csl-projection.js` — landing audit.
  - `docs/data/pub-cite1-phase1-csl-projection-audit-2026-08-16.json`
    — audit machine data.
  - `docs/pub-cite1-phase1-csl-projection-closure-2026-08-16.md`
    — this closure report.
- **Modified (additive)**
  - `src/_data/publicationsPage.js` — allowlist gains `"csl"`,
    both assembly sites attach `csl`.
  - `src/_data/publicationDetails.js` — detail model exposes `csl`.
  - `src/_data/researchfiContent.js` — content mapper exposes `csl`.
  - `src/_utils/publicationsFindExplore.js` — F&E record forwards `csl`.
  - `scripts/audit-pub-cite1-publication-citation-csl.js` — the
    pre-implementation `cslProjectionNotYetImplemented` gate is
    replaced by the post-implementation `cslProjectionImplemented`
    gate; readiness label flipped to
    `"READY (PUB-CITE1 Phase 1 landed)"`.

## 9. Remaining work

- **PUB-CITE1 Phase 2** — shared client CSL renderer (not scheduled).
- **PF5-IMPL-APA** — F&E publication row APA rendering (not scheduled).
- **Publications list v2** — hydrate from `csl` (not scheduled).

## 10. Next recommendation

Ship Phase 1 as-is (no PR — implementation commits land directly on
main per prior pattern). Do not proceed to Phase 2 or PF5-IMPL until
this closure is acknowledged.
