# PUB-CITE1 — Publication Citation Pipeline + CSL-JSON Readiness Audit

Date: 2026-08-16
Status: **DECIDED / GREEN** — audit complete; single next action queued.
Mode: audit only — no production source touched.

## 0. Scope and constraints

Read-only architectural audit of the publication data + citation
pipeline. Preserves every non-negotiable rule from the prompt:

- Research.fi and manual publication sources both remain.
- Source priority (`researchfi > manual`) and dedup precedence
  (`DOI → stable identifier → normalized title + year`) unchanged.
- CSL-JSON must be a **consumer-specific projection** of the canonical
  publication object, not a replacement for it.
- Public JSON contracts (`/data/publications-page.json`,
  `/data/publications.json`, `/data/researchfi.json`) may only gain
  additive fields in an eventual implementation, never lose or rename
  existing ones without a versioned migration.
- Pagefind stays a discovery layer, not the bibliographic source of
  truth.
- Deletion is part of success — but only after every consumer of a
  candidate legacy path has migrated.

## 1. Authoritative publication sources

### 1a. Research.fi (primary)

- Adapter: `src/_data/researchfi.js` (loader / normalizer /
  enrichers).
- Enrichment adapters: CrossRef (volume/issue/pages/publisher/ISBN
  fill-in), JUFO REST API (`jufoLevel`). Both cached under
  `.cache/api-fallback/*.json` with configurable TTLs.
- Content mapper: `src/_data/researchfiContent.js` — `mapPublication()`
  at line 319 transforms each raw record into an enriched content
  item (description, `citation`, `citationStyle`, categories,
  keywords, contexts, entities, researchLine, researchThemes,
  researchAudience).
- Authoritative fields exposed:
  - `publicationName` → title
  - `authorsText` → authors
  - `publicationYear` → year
  - `journalName` → journal / container
  - `doi`, `url`, `publicationTypeCode` (Finnish OKM code A1–G5)
  - `peerReviewed`, `openAccess` (booleans or shaped objects)
  - `volume`, `issue`, `pages`, `articleNumber`, `publisher`,
    `isbn`, `issn`
  - `jufoLevel`, `citationCount`
- Stable identifier: `publicationId` (ORCID-linked), plus `DOI`, plus
  a derived `anchorId` slug.

### 1b. Curated manual publications JSON

- File: `src/_data/curated/researchfi-manual.json` — a `manual[]`
  array in the **same shape** as the Research.fi records, so it can
  flow through the same `normalizePublication()` +
  `mergeNormalizedPublications()` (lines 93–103 of
  `src/_data/researchfi.js`).
- Fields: same set as Research.fi (title, authors, year, journal,
  DOI, typeCode, peerReviewed, openAccess, volume, articleNumber,
  publisher, issn, keywords).
- Stable identifier: `publicationId` when present; otherwise `DOI`.
- Purpose: fill Research.fi gaps for records that never made it into
  the API export.

### 1c. Editorial manual records under `src/publications/`

- 165 markdown files with frontmatter (title, date, description,
  publicationType, publication, publicationCollection, source_url,
  categories, keywords, writingRoles, …).
- Serves **two** distinct downstream purposes:
  1. The base `publications` Eleventy collection used by writings
     surfaces (opinion / column / statement / speech / blog piece
     / scientific article).
  2. A very small subset (3 slugs, hard-coded in
     `MANUAL_PUBLICATION_RULES` at `src/_data/publicationsPage.js:64–80`)
     promoted into the canonical publications page as
     `generalAudiencePublication` / `professionalPublication`.
- No stable bibliographic identifier: no DOI, no ISBN, no ISSN, no
  synthetic canonical ID.

## 2. Canonical publication model + dedup/priority

- Builder: `buildCanonicalPublicationCandidates()` in
  `src/_data/publicationsPage.js:486`. Returns
  `{ sourceData, researchfiCandidates, manualCandidates,
  dedupedCandidates }`.
- Source priority: `sourcePriority()` at line 193 —
  **Research.fi = 0**, **manual = 1**. Lower wins.
- Dedup: `deduplicatePublicationCandidates()` (line 265) uses
  `matchPublicationCandidates()` (line 246) → returns match reason
  `["doi"]`, `["identifier"]`, or `["title-year"]`.
  Winner picked by `chooseWinningPublicationCandidate()` (line 242).
- Canonical field set: `PUBLIC_PUBLICATIONS_PAGE_FIELDS` (lines
  7–43). Includes bibliographic (title, authors, year, journal,
  publisher, volume, issue, pages, isbn, doi, doiUrl),
  classification (type, typeCode, publicationGroup,
  publicationKind), quality (peerReviewed, openAccess, jufoLevel,
  citationCount), routing (pageUrl, url, sourceKey, sourceLabel,
  recordOrigin), taxonomy (categories, keywords, contexts,
  researchLine, researchThemes, researchAudience).
- Detail model adds `citation` and `citationStyle` on top —
  `publicationDetails.js:90–91` forwards them from the enriched
  contentItem.

Ownership boundary (what belongs where):

| Layer | Fields |
| --- | --- |
| Authoritative source | ORCID/DOI/publicationId, publicationName, authorsText, publicationYear, journalName, publicationTypeCode, peerReviewed, openAccess, volume, issue, pages, publisher, isbn, issn, jufoLevel, citationCount |
| Canonical publication | Everything above, normalized + typed + deduped + routed (`pageUrl`, `anchorId`, `sourceKey`, `sourceLabel`, `recordOrigin`, publicationGroup, publicationKind) |
| Citation projection (proposed CSL) | `id, type, title, container-title, author[], publisher, volume, issue, page, DOI, ISBN, URL, issued.date-parts, language, note` — **all derived from canonical** |
| Enrichment projection | `citation` string, `citationStyle` label (currently pre-computed at content-item build time; should become a render of the citation projection) |
| UI projection | list-row shape, detail hero, Find & Explore result record, Pagefind meta — each takes what it needs from canonical |
| Pagefind projection | discovery-only fields (title, description, filters, sort keys) — never the bibliographic source of truth |

## 3. Manual publication model

Two independent "manual" concepts share the word:

1. `src/_data/curated/researchfi-manual.json` — bibliographically
   complete, same shape as Research.fi, merged in
   `src/_data/researchfi.js`. **CSL-ready** by field coverage.
2. `src/publications/*.md` — 165 editorial writings; only 3 slugs
   promoted to the canonical publications page via
   `MANUAL_PUBLICATION_RULES`. These are missing DOI, ISBN, page,
   volume, issue, structured authors. **CSL-partial** by field
   coverage.

CSL-JSON mapping coverage for group (2):

| CSL field | Present in editorial `.md`? |
| --- | --- |
| `title` | YES |
| `author[]` (surname/given) | NO — free-text `author` string only |
| `container-title` | PARTIAL — `publication` / `publicationCollection` free text |
| `publisher` | PARTIAL — same free-text field |
| `DOI` | NO |
| `ISBN` | NO |
| `volume`, `issue`, `page` | NO (not applicable to opinion pieces / speeches) |
| `URL` | YES (`source_url`) |
| `issued.date-parts` | YES (`date`) |
| `type` | PARTIAL — `publicationType` is Finnish OKM code, not CSL vocabulary |

Implication: for the 3 promoted editorial records, either extend
their frontmatter with the CSL-relevant fields or accept a
degraded CSL projection (title, author string, issued, URL only).
Neither breaks canonical semantics.

## 4. Consumer matrix

| Consumer | File | Current input | Formatter/adapter | Fields required | Candidate future input | Legacy dependency? |
| --- | --- | --- | --- | --- | --- | --- |
| FI publications archive | `src/julkaisut.njk` | `publicationsPage.items` | inline `buildApaCitation` / MLA / Chicago / BibTeX / RIS (lines 396–517) | all bibliographic + quality | shared `renderCsl()` | no |
| EN publications archive | `src/en/publications.njk` | `publicationsPage.items` | same inline formatters | same | shared `renderCsl()` | no |
| Publication detail (Research.fi) | `src/julkaisut/researchfi-details.njk` + `src/_includes/publication-item-body.njk` | `publicationDetail` (with pre-computed `citation` + `citationStyle`) | server-precomputed `citation` string | reads whatever detail exposes | canonical + CSL projection | **YES** — reads `citation` string built server-side by `researchfiContent.js` |
| Opening list component | `src/_includes/publications-opening-list.njk` | `publicationItems` array | server-precomputed badges + inline meta | subset of canonical | canonical → CSL → renderer | no |
| Find & Explore (publications kind) | `src/js/find-explore.js` render path + `src/_utils/publicationsFindExplore.js:buildPublicationFindExploreRecord` (line 84) | F&E record | none today (PF4 shows authors · type · venue) | authors, year, journal, doi, typeCode, group, quality flags | CSL row from F&E record | no |
| Find & Explore (Research contextual mount) | same file, `researchContext` kind | same F&E record | same | same | same | no |
| Writings (`scientificPublication`) integration | `src/_data/writingsPage.js:381–388`, `src/kirjoitukset.njk`, `src/en/writings.njk` | `publicationsPage.items` filtered | inherits archive citation UI | canonical subset | canonical → CSL | no |
| JSON-LD `ScholarlyArticle` | `src/_includes/_ldschema.njk` (via `schemaType: ScholarlyArticle`) | detail data | Nunjucks emits Schema.org fields | title, authors, doi, year, journal | canonical | no |
| Public JSON `/data/publications-page.json` | `src/data/publications-page.json.11ty.js` | `buildPublicationsPageModel` output | JSON serializer | canonical fields (no citation string) | canonical + optional `csl` (additive) | no |
| Public JSON `/data/researchfi.json` | `src/data/researchfi.json.11ty.js` | Research.fi content items subset | JSON serializer | Research.fi-specific field set | canonical + optional `csl` (additive) | no |
| Public JSON `/data/publications.json` | `src/data/publications.json.11ty.js` | `collections.publications` (editorial `.md`) | `serializeItems()` in `src/data/_shared.js` | frontmatter | canonical for the 3 promoted records; frontmatter for the rest | no |
| Citation export modal | `src/julkaisut.njk` (modal `#citationExportModal`) | data-* attributes on export button | inline `buildApa` / MLA / Chicago / BibTeX / RIS | payload (authors, year, title, journal, doi, url, volume, issue, pages, publisher, isbn) | shared `renderCsl()` fed from CSL projection | **YES** — inline formatters are the only implementation |
| Thesis citation | `src/_data/theses.js` (line 80 `buildApaCitation`) + `src/js/thesis-hub-actions.js` (client APA/MLA/Chicago) | thesis detail | server-precomputed `citationApa`, plus client APA composer | authors, year, title, level, university | out of scope for PUB-CITE1 (thesis path separate) | no |
| Pagefind filter/meta emission | `src/_utils/publicationsFindExplore.js:buildPublicationFindExploreDocument` (line 154) | canonical item | `resolvePagefindDocument` in `src/src.11tydata.js` | filters (year, group, type, topic, quality, scope, contexts) + meta (year, type, group, authors, venue, description) | unchanged | no |
| Homepage / research / topic curated rollups | `src/_data/researchProgram.js`, hub pages | `publicationsPage.items` slice | same list-row treatment | canonical subset | canonical | no |
| Audits & tests | `scripts/audit-publications-page-projection.js`, `scripts/audit-publications-page-client-parity.js`, `scripts/audit-publications-f3b-built-output.js`, `tests/unit/publicationsPage.test.js` | model output | assertions on canonical shape | canonical | canonical | reads `buildLegacyFiPublicationRows` for parity comparison only |

## 5. Current citation implementations

Server-side (build time):

- `src/_data/researchfiContent.js:237` — `buildApaCitation(publication)`
  returns an APA-7 string. Stored on the enriched content item as
  `citation` + `citationStyle: "APA 7"` (lines 329–330). Forwarded
  to the detail model via `publicationDetails.js:90–91`.
- `src/_data/theses.js:80` — thesis APA composer; stored as
  `citationApa` on thesis detail.

Client-side (runtime, inline in `src/julkaisut.njk`):

- Line 396 `buildBibtexEntry(payload)`
- Line 433 `buildApaCitation(payload)`
- Line 455 `buildMlaCitation(payload)`
- Line 477 `buildChicagoCitation(payload)`
- Line 499 `buildRisEntry(payload)`
- Payload shape (line 558–570): `title, authors, year, journal,
  doi, url, volume, issue, pages, publisher, isbn`. All fed from
  `data-*` attributes on `.export-citation-btn` buttons.
- Scoped inside a single `<script>`; not exported. `find-explore.js`
  cannot reuse them today.

Client-side (thesis, in `src/js/thesis-hub-actions.js` lines 61–98):

- Independent APA / MLA / Chicago composers for thesis records.

**Duplication observations**:

- Server APA (`researchfiContent.js:buildApaCitation`) and client
  APA (`julkaisut.njk:buildApaCitation`) implement the same
  algorithm but on different payload shapes (server: normalized
  publication object; client: `data-*` attribute payload).
- MLA / Chicago / BibTeX / RIS have no server-side counterpart —
  client-only.
- Thesis APA has its own server + client pair, not shared with
  publications.

## 6. CSL-JSON field mapping (target design, not implemented)

Canonical field → CSL-JSON field, with lossy/ambiguous notes:

| Canonical | CSL-JSON | Notes |
| --- | --- | --- |
| `anchorId` (or `publicationId`) | `id` | Stable per canonical id. |
| `publicationTypeCode` (OKM A1–G5) | `type` | **Lossy mapping**. See mapping table below. |
| `title` | `title` | 1:1. |
| `authorsText` (free string) | `author[]` (`{family, given}`) | **Parser required** — server-side split by comma / `and` / `&`, best-effort surname detection. |
| `journal` / `publicationCollection` | `container-title` | Prefer `journal`; fall back to `publicationCollection`. |
| `publisher` | `publisher` | 1:1. |
| `volume` | `volume` | 1:1. |
| `issue` | `issue` | 1:1. |
| `pages` / `articleNumber` | `page` | Prefer `pages` (range); fall back to `articleNumber`. |
| `doi` | `DOI` | 1:1 (bare DOI, no prefix). |
| `doiUrl` / `url` | `URL` | Prefer `doiUrl`; fall back to `url`. |
| `isbn` | `ISBN` | 1:1. |
| `year` | `issued.date-parts` | `[[year]]` when only year is known. |
| `lang` | `language` | 1:1 (`fi` / `en`). |
| `jufoLevel`, `citationCount` | `note` | Not standard CSL fields; embed as annotations or keep out of CSL projection. |

Proposed OKM → CSL type table (best-effort, not authoritative):

| OKM code | CSL type |
| --- | --- |
| A1, A2, A3 | `article-journal` |
| A4 | `paper-conference` |
| B1 | `article-magazine` (or `article-newspaper` for popular pieces) |
| B2, B3 | `chapter` (book chapter) |
| C1, C2 | `book` |
| D1, D2, D3, D4, D5, D6 | `article-magazine` / `article` (professional pieces) |
| E1, E2, E3 | `article-newspaper` / `entry` (general audience) |
| F1, F2, F3 | `chapter` (artistic contributions) |
| G1, G2, G3, G4, G5 | `thesis` |

Notes:

- **OKM → CSL is lossy** because OKM classifies both content type and
  audience/context; CSL classifies form only. The canonical
  publication object retains `publicationTypeCode`,
  `publicationGroup`, `publicationKind` for accurate display.
- **Author parsing risk**: the current `authorsText` is free text.
  A parser will make heuristic choices. Provide a
  `authorsRaw` fallback in the CSL note field so downstream
  citation-quality audits can detect misparses.
- **Editorial `.md` records** (the 3 promoted ones) can produce a
  degraded CSL row (title, author-as-single-literal, issued, URL,
  type=`article-newspaper` or `article-magazine`). Not
  bibliographically complete, but formatable.

## 7. Manual publication CSL readiness

- `curated/researchfi-manual.json` records: **READY**. Same shape as
  Research.fi.
- `src/publications/*.md` promoted records (3 total): **PARTIAL**.
  Would benefit from optional frontmatter extensions
  (`csl.authors: [{family, given}]`, `csl.container-title`,
  `csl.type`) but a fallback CSL row is derivable from existing
  fields.
- `src/publications/*.md` non-promoted records (162): not in scope
  for canonical publications; still consumed via writings; no CSL
  need today.

## 8. Publication list v2 recommendation

**Target**: `/julkaisut/` and `/en/publications/` render each row
via the same client-side renderer that Find & Explore, the
citation export modal, and detail pages will all use.

Recommended shape:

1. Server emits canonical publications + a per-item CSL-JSON
   projection (either inline in the page's JSON blob or via the
   existing `publicationFindExploreRecords` payload).
2. Client renderer takes a CSL-JSON item + a target style
   (APA / MLA / Chicago / BibTeX / RIS) and returns a formatted
   string.
3. The archive row = family badge + CSL-formatted citation line +
   quality micro-copy + action row (open / source / cite). The
   detail page = same citation string + expanded fields + JSON-LD.
4. Once the archive uses the same renderer, `julkaisut.njk`'s
   inline `buildApaCitation` / `buildMlaCitation` etc. can be
   deleted.

**What can disappear** after list-v2 lands and every consumer
migrates:

- Inline citation formatters in `src/julkaisut.njk` (lines 396–517).
- Server-precomputed `citation` + `citationStyle` on the detail
  model — becomes a client render from CSL.

## 9. Legacy code deletion candidates

| Candidate | File | Verdict | Consumers today |
| --- | --- | --- | --- |
| `buildLegacyFiPublicationRows()` | `src/_data/publicationsPage.js:507` | **DELETE AFTER PARITY** | Only `scripts/audit-publications-page-projection.js:147` and `scripts/audit-publications-page-client-parity.js:189`. Zero production consumers. Safe to delete after the two audits either migrate their comparison to a canonical-only baseline or are retired. |
| Inline `buildApaCitation` in `src/julkaisut.njk` | line 433 | **MIGRATE → DELETE AFTER PARITY** | The citation export modal uses it; also the FI archive's list-row rendering path (indirect via the same script). Delete after the shared CSL renderer lands and covers all APA cases. |
| Inline `buildMlaCitation` / `buildChicagoCitation` / `buildBibtexEntry` / `buildRisEntry` in `src/julkaisut.njk` | lines 455 / 477 / 396 / 499 | **MIGRATE → DELETE AFTER PARITY** | Same modal. Move into shared `citation-formatters.js` first (or its CSL-driven successor). |
| Server-precomputed `citation` + `citationStyle` in `researchfiContent.js:329–330` and forwarded via `publicationDetails.js:90–91` | | **MIGRATE → DELETE AFTER PARITY** | The publication detail page (`publication-item-body.njk`) renders `detail.citation` directly today. Once client renders from CSL, this precomputation and the forwarding line can be removed. Keep meanwhile as a legacy backstop for search-engine snippets that don't run JS. |
| MANUAL_PUBLICATION_RULES gating in `publicationsPage.js:64–80` | | **KEEP** | Editorial governance decision, not a citation-pipeline artifact. |
| Thesis-side `buildApaCitation` in `src/_data/theses.js:80` and `src/js/thesis-hub-actions.js:61+` | | **KEEP (out of scope)** | Separate thesis pipeline. PUB-CITE1 does not touch it. |

## 10. Public contract impact

Current public JSON endpoints (verified against the current build):

- `/data/publications-page.json` — root `{version, generatedAt,
  count, items[], archiveFilters}`. Item fields: canonical set,
  **no `citation`, `citationApa`, or `csl` field**.
- `/data/publications.json` — Eleventy collection projection of
  `src/publications/*.md`. Item fields: `serializeItems()`
  standard set.
- `/data/researchfi.json` — Research.fi snapshot. Item fields:
  Research.fi-specific bibliographic set. **No `citation` field**.

Impact of the PUB-CITE1 implementation on these contracts:

- **Additive only** at first: add an optional `csl` field per
  publication item (`items[i].csl = {…CSL-JSON object…}`). Version
  stays at `1`. Consumers that ignore `csl` continue unchanged.
- Once every consumer reads `csl` and the legacy `citation` /
  `citationStyle` fields on the detail model are unused, remove
  them in a versioned update (`version: 2`) with a clear closure
  note. This is a **future** step, not a PUB-CITE1 requirement.

## 11. PF5 dependency / order recommendation

**Recommendation: B — implement the CSL citation layer first, then
PF5.**

Rationale:

- PF5-IMPL-APA (per the PF5 audit's Phase 1) proposed extracting
  `buildApaCitation` from `julkaisut.njk` into a shared
  `citation-formatters.js`. That module would take the
  `{authors, year, title, journal, doi, url, volume, issue, pages}`
  payload shape used today.
- If PUB-CITE1 lands first, that "shared module" is instead a
  `renderCsl(cslItem, style)` function taking a CSL-JSON object as
  input. Publication F&E records get a `csl` field alongside the
  existing `authors / year / journal / …` fields.
- PF5-IMPL-APA then becomes a small consumer change: call
  `renderCsl(entry.record.csl, "apa")` instead of inlining APA
  composition, and drop the "extract old formatter" step entirely.
- Doing PF5 first would ship a shared formatter with a payload
  contract that PUB-CITE1 immediately replaces — churn without
  compounding value.
- The user's direction explicitly cites "deletion is part of
  success." Ordering CSL before PF5 avoids landing code we know
  we'll delete.

Cost of the reversed order: PF5 is delayed by the PUB-CITE1
implementation window (see phases below). PUB-CITE1 is not
UI-visible; PF5 is. Trade-off is deferred user-visible improvement
in exchange for a cleaner shared foundation.

If the user wants the visible improvement sooner and accepts one
throwaway extraction, choose option A instead. This audit does not
require a specific business decision on that trade-off — it only
identifies that B is the architecturally cleaner order.

## 12. Implementation phases (not to be executed here)

Preferred sequence (Option B):

### Phase 1 — PUB-CITE1-IMPL — Canonical → CSL-JSON projection

- Add `buildCslItem(canonicalPublication)` to
  `src/_utils/publicationCsl.js` (new). Consumes canonical fields;
  emits a CSL-JSON object with the OKM → CSL type mapping in §6.
- Add optional `csl` field to:
  - `PUBLIC_PUBLICATIONS_PAGE_FIELDS`.
  - `researchfiContent.js` content items.
  - `publicationDetails.js` detail model (kept alongside legacy
    `citation` / `citationStyle` until Phase 4).
  - `publicationsFindExplore.js:buildPublicationFindExploreRecord`
    → adds `csl` to the F&E record.
- Optional additive extension to `/data/publications-page.json`
  and `/data/researchfi.json` (versioned bump not needed; add
  field on same `version: 1`).
- Add unit tests for the mapping and edge cases (missing DOI,
  author-parser fallback, OKM → CSL type table).
- No consumer change yet.

### Phase 2 — Shared client renderer

- New `src/js/citation-formatters.js` module exporting
  `renderCsl(cslItem, {style: "apa"|"mla"|"chicago"|"bibtex"|"ris"})`.
- Ports the existing algorithms from `julkaisut.njk` into
  CSL-driven form. Parity-tested against the current inline
  outputs.
- Publication detail page starts reading from `renderCsl` instead
  of the server-precomputed `citation` string (with the server
  string kept as a no-JS fallback via a `<noscript>` block or an
  SSR-first / progressive-enhancement pattern).

### Phase 3 — PF5-IMPL-APA on top of the CSL renderer

- Update `src/js/find-explore.js` publication branch to call
  `renderCsl(entry.record.csl, {style: "apa"})` for the primary
  meta line.
- Update thesis branch similarly using a `buildCslItem`
  counterpart for theses (or defer thesis switchover to a
  parallel thesis-side task — audit-J shows thesis pipeline is
  independent).
- Move the citation export modal (`julkaisut.njk`) to call
  `renderCsl` for all styles. Delete inline
  `buildApaCitation` / MLA / Chicago / BibTeX / RIS.

### Phase 4 — Delete legacy paths after parity

- Remove `buildLegacyFiPublicationRows()` (audit scripts migrate to
  canonical-only comparison).
- Remove server-precomputed `citation` + `citationStyle` from
  `researchfiContent.js` and `publicationDetails.js`.
- Publish `version: 2` of `/data/publications-page.json` +
  `/data/researchfi.json` in a closure doc if the removed fields
  need to disappear from the public contract as well; otherwise
  keep both fields as deprecated-but-still-emitted for backward
  compatibility for one release cycle.

## 13. Explicit risks

- **Author parser accuracy.** Free-text `authorsText` splitting
  will not be perfect for all Finnish + English name shapes.
  Mitigation: emit `csl.author` best-effort AND keep an
  `csl.author-raw` fallback string; downstream renderers can prefer
  the parsed shape but recover to raw when parse quality is low.
- **OKM → CSL lossiness.** The type table is a design choice, not a
  standard. Mitigation: keep `publicationTypeCode`,
  `publicationGroup`, `publicationKind` on canonical for accurate
  UI badge labeling.
- **Detail-page SSR of citation.** Today `publication-item-body.njk`
  renders `detail.citation` server-side, so JS-disabled visitors
  and crawlers see an APA string. Phase 2 must preserve this
  (SSR the string; hydrate to a client renderer that can also
  switch styles, or keep both).
- **`buildLegacyFiPublicationRows` audit dependency.** The two
  audit scripts that read it compare current canonical against the
  legacy shape. Deleting it in Phase 4 requires migrating those
  audits (or retiring them as no longer meaningful).
- **Manual editorial records.** The 3 promoted `.md` publications
  will produce a degraded CSL row. Acceptable, but a follow-up
  task may want to enrich their frontmatter with structured author
  and CSL-type hints.
- **Pagefind metadata drift.** Adding `csl` to F&E records does
  NOT require any Pagefind facet change. Adding a searchable
  `Sisältö:*`-adjacent CSL type facet is out of scope; would be a
  separate discussion.
- **Version-bump timing.** If `/data/publications-page.json`
  consumers exist outside this repo (dashboards / bots),
  removing legacy fields at `version: 2` would break them.
  Additive-only in Phases 1–3 keeps the risk low.
- **Duplication window.** Between Phase 1 and Phase 4, both
  legacy `citation` string and `csl` field ship in parallel. A
  build-time audit should assert their agreement on APA output for
  every record.

## 14. Next action

**PUB-CITE1-IMPL — Add canonical → CSL-JSON projection and expose
`csl` field on the publication detail model + Find & Explore
records.**

Scope: Phase 1 only. No renderer / consumer change yet. Ships an
additive `csl` field, a `buildCslItem(canonicalPublication)`
utility, and unit tests. Public JSON contracts gain an optional
`csl` field on `version: 1` (no versioned migration). Legacy paths
(`buildLegacyFiPublicationRows`, inline formatters, server-
precomputed `citation`) all remain until Phase 4.

After Phase 1 lands and its audit is green, Phase 2 (shared client
renderer) unblocks both the citation-export modal and PF5-IMPL-APA
in a single follow-up.

STOP.
