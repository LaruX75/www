# TH-CITE1 — Thesis Citation CSL Readiness Audit

Date: 2026-08-17
Mode: **AUDIT ONLY — no source code, no data-layer change**
Branch: `docs/th-cite1-readiness-audit`
Base main: `135f849e` (`Merge pull request #100 from LaruX75/docs/publications-full-pagefind-pub-cite1-closure`)

## 0. Status

- **TH-CITE1**: AUDIT COMPLETE
- **TH-CITE1 implementation**: NOT STARTED

## 1. Architectural target (per user directive, 2026-08-17 corrections)

```
canonical thesis
  → thesis CSL projection            (new — thesis-side adapter)
  → existing shared citation renderer  (src/js/publication-citation.js —
                                        already thesis-capable)
    ├── Eleventy / Nunjucks SSR initial list
    │     (/opinnaytteet/, /en/theses/, curated archive rows)
    ├── detail / JSON-LD / /data/theses.json
    ├── citation / export consumers (modal + Copy + Download + Zotero + Mendeley)
    └── ready display projection in Pagefind metadata
          → SHARED Pagefind result presentation across every surface
              (domain F&E, Research F&E, navbar search, /haku/,
               /en/search/, and any future Pagefind surface)
          → browser JS never composes citations
```

Three explicit architectural rules from the 2026-08-17 corrections:

**(a) Precise CSL status.** The shared CSL infrastructure exists and is
already thesis-capable at the renderer layer (`src/js/publication-citation.js`
handles `type: "thesis"` in every style branch). What is missing is a
thesis-side **CSL adapter** that projects the canonical OuluREPO thesis object
into a CSL item. Phase 1 adds ONLY that adapter (`buildThesisCslItem`) —
reusing existing helpers (`parseAuthors` is already exported from
`publicationCsl.js`). The publications CSL builder `buildCslItem` stays
publication-only and is NOT extended.

**(b) SSR-first.** The initial `/opinnaytteet/` and `/en/theses/` archive
must be rendered by Eleventy / Nunjucks at build time from
`canonical thesis → CSL → shared renderer`. Pagefind must not generate the
initial visible thesis archive. Pagefind takes over only when the user
interacts — query, filter, ranking.

**(c) PF5 GLOBAL RESULT PARITY.** The `thesesCitationApa` display projection
and the thesis-domain result presentation must be inherited by **every**
Pagefind surface: domain F&E on `/opinnaytteet/` + `/en/theses/`, Research
F&E on `/tutkimus/`, navbar search overlay, `/haku/`, `/en/search/`, and
any future Pagefind surface. New search surfaces must not invent their own
result-card renderer. Context may only change density — never citation
semantics, never composition.

- **CSL is the bibliographic source** and remains the sole citation truth.
- **Shared citation renderer** is the sole citation composer.
- **Nunjucks + Node shim** consume the shared renderer at build time.
- **Pagefind** carries the ready-made display string as meta so browser JS
  can display without composing.
- **Browser JS**: no citation composition. Query + filter + interaction only.

## 2. Current thesis pipeline (evidence from branch state)

### 2.1 Data flow (as of main `135f849e`)

```
Oulu Repo API / curated JSON
  → src/_data/theses.js
       ↳ buildApaCitation(thesis)  ← BESPOKE SERVER APA COMPOSER
       ↳ withCitation(thesis) → thesis.citationApa + thesis.citationStyle "APA 7"
  → src/_data/thesisDetails.js → thesisDetail.citationApa (forwarded)
  → src/_utils/toThesesCollectionItems.js → collection item.citationApa (forwarded)
  → src/_includes/thesis-detail-body.njk:46 → displays thesisDetail.citationApa on detail page
  → src/opinnaytteet/thesis-details.njk:29 → thesisSchemaCitation for JSON-LD
  → src/data/theses.json.11ty.js:98 → public /data/theses.json.citationApa field
```

Browser side:

```
src/js/thesis-hub-actions.js
  ↳ buildThesisApa / buildThesisMla / buildThesisChicago / buildThesisBibTeX / buildThesisRis
  → #thesisCitationModal preview + copy + download + Zotero + Mendeley
  ↳ uses English institution ("University of Oulu") + English genre labels
    ("Master's thesis", "Bachelor's thesis")
  ↳ CURRENT DIVERGENCE — server APA uses Finnish institution + Finnish genre,
    browser APA uses English institution + English genre.
```

Pagefind:

```
src/_utils/thesesFindExplore.js#buildThesisFindExploreDocument
  → Pagefind meta {thesesAuthorLine, thesesType, thesesYear, thesesLang, thesesRole, thesesDescription, title}
  → NO citation string in Pagefind meta
```

Find & Explore renderer:

```
src/js/find-explore.js
  → generic PF4 default: authorLine · thesesType primary meta
  → NO thesis citation composition
```

### 2.2 Current CSL wiring (publications-only)

```
canonical publication
  → src/_utils/publicationCsl.js#buildCslItem  ← CALLED FROM 3 PUBLICATION BUILDERS ONLY
       ↳ src/_data/publicationDetails.js:6,82
       ↳ src/_data/researchfiContent.js:6,236
       ↳ src/_data/publicationsPage.js:4
  → CSL object with type: article-journal | paper-conference | article-magazine |
                             chapter | book | thesis | article-newspaper
    (thesis type reserved for OKM G1–G5 records surfaced by Research.fi
     — i.e. thesis-shaped publications on the publications page,
     NOT the OuluREPO thesis pipeline)
  → src/js/publication-citation.js#buildCitation → APA / MLA / Chicago / BibTeX / RIS
```

**The thesis pipeline has no CSL projection today.** The shared renderer already
supports `type: "thesis"` output; only the input projection is missing.

## 3. Current citation implementations — inventory

| # | Location | Lang runtime | Formats | Institution label | Genre label(s) | Consumers |
| - | -------- | ------------ | ------- | ----------------- | -------------- | --------- |
| 1 | `src/_data/theses.js#buildApaCitation` | Node (build) | APA 7 only | `Oulun yliopisto` (FI only) | `Pro gradu -tutkielma` / `Kandidaatintutkielma` / `Opinnäytetyö` (FI only) | Detail page, JSON-LD, `/data/theses.json`, curated archive rows, thesis modal payload seed |
| 2 | `src/js/thesis-hub-actions.js#buildThesisApa/Mla/Chicago/BibTeX/Ris` | Browser | APA / MLA / Chicago / BibTeX / RIS | `University of Oulu` (EN only) | `Master's thesis` / `Bachelor's thesis` (EN only) | `#thesisCitationModal` preview + Copy + Download + Zotero + Mendeley |
| 3 | Shared renderer thesis branch in `src/js/publication-citation.js#apa/mla/chicago/bibtex/ris` | Isomorphic (Node + browser) | APA / MLA / Chicago / BibTeX / RIS | `csl.publisher` (source-faithful) | `csl.genre` (source-faithful) | Publications ONLY (thesis-typed publications from Research.fi G-codes) — no thesis pipeline consumer today |

**Three parallel thesis citation formatters exist.** Two are thesis-domain
bespoke (Node #1 + browser #2). One (#3) is the target shared renderer that
should absorb both.

Additional divergences:
- **APA bracket convention**: #1 uses `Author (Year). Title [Genre, Publisher].` (APA 7 compliant). #3 currently produces `Author (Year). Title. Genre, Publisher.` (period-comma-period without brackets). This is a small deviation in the shared renderer's thesis branch that should be aligned to APA 7 during Phase 2.
- **Institution language**: #1 always emits Finnish `Oulun yliopisto`. #2 always emits English `University of Oulu`. Users on `/en/theses/` see the detail-page card render `Oulun yliopisto` and then the modal preview render `University of Oulu` for the same thesis. This is a semantic bug the audit surfaces.

## 4. Authoritative thesis object

Current canonical thesis fields (from `src/_data/theses.js` + `thesisDetails.js`):

| Canonical field | Type | Source | Notes |
| --------------- | ---- | ------ | ----- |
| `link` / `sourceUrl` | string | Oulu Repo | Also serves as stable identity |
| `pageUrl` | string | derived | `/opinnaytteet/<id>/` canonical detail URL |
| `title` | string | Oulu Repo | |
| `authors[]` / `authorLine` | array/string | Oulu Repo | authorLine is a joined display string |
| `year` | int | Oulu Repo | |
| `date` | ISO date | derived | year-based |
| `type` | enum | Oulu Repo | `masterThesis` / `bachelorThesis` / (uncommon: `doctoralThesis`, `licentiateThesis`) |
| `thesisRole` | enum | curated | `advised` (default) / `reviewed` |
| `lang` | ISO 639-1 | Oulu Repo | `fi` / `en` |
| `abstract` | string | Oulu Repo | Full text |
| `abstractSnippet` | string | derived | 260-char snippet |
| `categories[]` | array | derived | topic strings |
| `thesisTypeLabel` | string | derived | Finnish thesis-type label |
| `institution` | (implicit) | — | Always "Oulun yliopisto" / "University of Oulu" |

Non-standard / relationship records:
- `thesisRole === "reviewed"` — these are thesis review activities, not
  authorships. They still describe a bibliographic thesis object, so they
  qualify for CSL projection. The relationship (Laru as reviewer vs. Laru as
  supervisor) is out of scope for CSL and lives in the archive-side
  presentation as today.
- No non-bibliographic records identified.

## 5. CSL suitability + proposed mapping

CSL-JSON supports theses as first-class citations. Proposed thesis→CSL projection:

```js
buildThesisCslItem(thesis) {
  return {
    id: thesis.pageUrl || thesis.link,
    type: "thesis",
    title: thesis.title,
    author: parseAuthors(thesis.authors || thesis.authorLine),
    issued: thesis.year ? { "date-parts": [[ thesis.year ]] } : undefined,
    genre: canonicalGenre(thesis.type),  // "Master's thesis" | "Bachelor's thesis" | "Doctoral dissertation" | "Licentiate thesis" | "Thesis"
    publisher: "University of Oulu",     // source-faithful English (see §7)
    URL: thesis.sourceUrl,               // Oulu Repo landing
    language: thesis.lang || "fi"
  };
}
```

Mapping table:

| Canonical thesis field | CSL field | Notes |
| ---------------------- | --------- | ----- |
| `pageUrl` or `link` | `id` | Stable identity |
| — | `type` | Always `"thesis"` |
| `title` | `title` | |
| `authors[]` / `authorLine` | `author[]` | Reuse the same `parseAuthors` heuristic as `publicationCsl.js` |
| `year` | `issued.date-parts[[year]]` | |
| `type` (`masterThesis` etc.) | `genre` | Canonical English label (see §7) |
| — | `publisher` | `"University of Oulu"` — source-faithful institutional identity |
| `sourceUrl` / `link` | `URL` | Oulu Repo landing |
| `lang` | `language` | ISO 639-1 |

Genre map:

| `thesis.type` | CSL `genre` |
| ------------- | ----------- |
| `masterThesis` | `Master's thesis` |
| `bachelorThesis` | `Bachelor's thesis` |
| `doctoralThesis` | `Doctoral dissertation` |
| `licentiateThesis` | `Licentiate thesis` |
| other / missing | `Thesis` |

**Coverage** (measured on current main via `src/_data/theses.js` loader):

- Inventory: **170 theses** (141 master's + 29 bachelor's; 117 advised, 53 reviewer-only; 139 Finnish, 31 English).
- Current `citationApa` coverage: **170 / 170** (100%).
- Missing year: 0 / 170.
- Missing authors: 0 / 170.
- `thesis.type` reliability: 100 % (Oulu Repo schema-enforced — `masterThesis` or `bachelorThesis` on this branch; no doctoral / licentiate records surfaced today via this pipeline).
- `title` + `sourceUrl` reliability: 100 %.
- `year` reliability: 100 % on this snapshot (renderer already handles `year: undefined` by omitting the clause for safety).
- `authors` reliability: high; the free-text `authorLine` fallback yields a safe `{literal}` CSL author when structured parse is not possible (existing `parseAuthors` heuristic in `publicationCsl.js` already handles this).

Blockers / edge cases:
- **APA bracket convention divergence**: shared renderer thesis APA branch currently uses `Genre, Publisher.` (period). Legacy `theses.js#buildApaCitation` uses `[Genre, Publisher].` (bracket). APA 7 mandates brackets. Align the shared renderer during Phase 2 (small, safe — the branch has zero production consumers today).
- **Institution language divergence** (§3): Current dual behaviour is a display bug. CSL projection resolves it by using one canonical `publisher` value; localization can happen inside the display layer only if the audit explicitly decides so (see §7).
- **Non-standard records** (§4): all thesis records are bibliographic; no non-CSL exclusions needed.

## 6. Consumer matrix — before / after TH-CITE1

| # | Consumer | Current source | Desired future source | Can migrate? | Blocker / prerequisite |
| - | -------- | -------------- | --------------------- | ------------ | ---------------------- |
| 1 | Detail page card (`thesis-detail-body.njk:46`) | `thesisDetail.citationApa` (server APA #1) | `thesisDetail.csl | publicationCitation("apa")` | YES | Add thesis CSL projection + Nunjucks filter already registered |
| 2 | Detail page JSON-LD (`thesis-details.njk:29`) | `thesisDetail.citationApa` | shared renderer output | YES | Same |
| 3 | Public `/data/theses.json` `citationApa` field | `thesisDetail.citationApa` | shared renderer output | YES (contract-preserving — same field name, same shape) | Populate from shared renderer |
| 4 | Curated archive row (`thesis-curated-list.njk`) — displayed text | `thesis.title` + `thesis.authorLine` + type badge (no citation string yet) | Optionally the shared APA sentence via Nunjucks | YES | Small template change; still SSR |
| 5 | Curated archive row → citation modal button (`data-thesis-*` attrs) | Attribute payload consumed by browser modal formatter | Attribute payload → shared renderer (browser) OR pre-rendered display strings from Pagefind meta | YES | Publications Phase 4a-b pattern: modal reads csl attribute + calls shared renderer |
| 6 | Citation modal preview + Copy + Download | Browser #2 formatters | Shared renderer (isomorphic UMD) | YES | Attribute must carry csl JSON |
| 7 | Zotero download | Browser #2 `buildThesisRis` | Shared renderer `style: "ris"` | YES | Same |
| 8 | Mendeley download | Browser #2 `buildThesisRis` | Shared renderer `style: "ris"` | YES | Same |
| 9 | Pagefind result row (`find-explore.js` generic default) | No citation — `authorLine · thesesType` meta line | `data.meta.thesesCitationApa` (Pagefind meta) → dumb display | YES | Add `thesesCitationApa` (from shared renderer output) to `buildThesisFindExploreDocument` meta |
| 10 | Nunjucks SSR "initial thesis list" (new — currently curated archive + Find & Explore paging) | — | `thesisDetail.csl | publicationCitation("apa")` inside a new full-list template following Publications FULL pattern | Optional | Design decision — theses may or may not want a full-list SSR similar to publications |

## 7. FI / EN semantics

Current state diverges (§3). Options:

**Option A — canonical English institution + English genre in CSL; FI display equivalent computed at render time**
- `publisher: "University of Oulu"`, `genre: "Master's thesis"` in CSL (source-faithful).
- Shared renderer accepts an optional `lang` argument that maps English CSL genres/publisher to Finnish equivalents when the caller passes `lang: "fi"`.
- Preserves CSL as language-neutral bibliographic truth; UI localizes.
- Requires a small map in the shared renderer (`{ "Master's thesis": "Pro gradu -tutkielma", "University of Oulu": "Oulun yliopisto" }`).
- ✅ Matches Publications architecture (CSL is source-faithful; renderer localizes).

**Option B — Finnish CSL when thesis was authored in Finnish, English CSL otherwise**
- `publisher` and `genre` reflect the thesis's source language.
- No renderer localization needed; each thesis carries its own bibliographic language.
- More faithful to source (Finnish master's thesis really IS "Pro gradu -tutkielma", not translated).
- Requires deciding what to render on `/en/theses/` for a Finnish-language thesis (source-faithful "Pro gradu -tutkielma" vs. translated "Master's thesis").

**Option C — canonical Finnish institution + Finnish genre in CSL; English display equivalent computed at render time**
- Symmetric to Option A but Finnish-native. Rest of `publicationCsl.js` is source-faithful (publisher fields never translated), so this fits the existing house style.

**Recommendation**: **Option C** — canonical Finnish institution (`Oulun yliopisto`) + Finnish canonical genres (`Pro gradu -tutkielma` / `Kandidaatintutkielma` / `Väitöskirja` / `Lisensiaatintutkielma`) in CSL, matching the site's home country and matching the current server-side APA output the detail page already displays. Shared renderer gains a small `lang: "en"` display map that flips these to English on `/en/theses/`.

## 8. Public JSON / API findings

- `/data/theses.json` currently emits `citationApa` per thesis (`src/data/theses.json.11ty.js:98`).
- Under TH-CITE1: **preserve the field name and string shape**; only the origin of the string changes (shared renderer via CSL, not `theses.js#buildApaCitation`).
- No other public thesis JSON/API surface exposes citation strings.
- No knowledge-graph consumer identified.

## 9. Pagefind integration target (PF5 GLOBAL RESULT PARITY)

Preferred flow (matches user directive):

```
canonical thesis
  → buildThesisCslItem(thesis)             (new Phase 1 adapter)
  → thesisDetail.csl                       (attached to thesis detail model)
  → SSR (Nunjucks + Node shim):
    ├── /opinnaytteet/ + /en/theses/ initial thesis archive rows
    ├── thesis detail card + JSON-LD
    └── /data/theses.json citationApa field
  → build-time shared-renderer APA string
    → src/_utils/thesesFindExplore.js#buildThesisFindExploreDocument
       adds thesesCitationApa meta alongside existing thesis meta
  → Pagefind indexes the string as searchable + carries it in meta
  → EVERY Pagefind surface reads data.meta.thesesCitationApa and
    DISPLAYS it — same result-card presentation across:
      · src/js/find-explore.js result rows on /opinnaytteet/, /en/theses/, /tutkimus/
      · nav-bar Pagefind overlay (site-ui.js PagefindUI)
      · /haku/ + /en/search/ full-page PagefindUI
      · any future Pagefind surface added later
    (Density may vary per surface — density is layout, not semantics.
     Citation composition NEVER happens on any surface.)
```

**Critical invariants** (all surfaces):
- No surface composes a thesis citation in JavaScript.
- No surface has its own thesis-specific composer.
- Every surface reads the shared build-time output from Pagefind meta
  and displays it verbatim.
- CSL is the sole bibliographic truth. Shared renderer is the sole
  composer. Nunjucks is the sole SSR renderer.

## 10. Deletion opportunities after TH-CITE1 lands

Once every consumer above reads the shared renderer output, the following become deletion candidates (each in its own single-concern commit, after parity proof):

- `src/_data/theses.js#buildApaCitation` (bespoke server APA composer).
- `src/_data/theses.js#formatAuthorsApa` / `formatAuthorApa` / `formatAuthorInitials` (helper stack).
- `src/_data/theses.js#getThesisLevelLabel` (Finnish genre map — CSL takes over).
- `src/js/thesis-hub-actions.js#buildThesisApa` / `buildThesisMla` / `buildThesisChicago` / `buildThesisBibTeX` / `buildThesisRis` (5 browser formatters).
- `thesisDetail.citationApa` FIELD — if all consumers switch to `thesisDetail.csl | publicationCitation("apa")`. **Keep** as a Pagefind-meta-parity fallback contract if that field is depended on externally.

## 11. FI / EN parity gates for future implementation

The audit defines the required parity target for TH-CITE1 phased implementation:

- Thesis identity count unchanged (canonical thesis inventory unaffected).
- Detail landing URLs unchanged.
- `/opinnaytteet/` and `/en/theses/` render the same set of theses.
- Citation string parity classification per thesis:
  - **IDENTICAL** — byte-for-byte match with current `citationApa`.
  - **EXPECTED IMPROVEMENT** — differs but shared renderer output is
    demonstrably more correct (e.g. APA 7 bracket convention, cross-language
    consistency).
  - **UNEXPLAINED REGRESSION** — expected to be **0**.
- Modal / Copy / Download / Zotero / Mendeley all produce the same styles the shared renderer produces (APA / MLA / Chicago / BibTeX / RIS).
- Coverage:
  - Master's theses (bulk of inventory).
  - Bachelor's theses.
  - Doctoral / licentiate theses if present in inventory.
  - Reviewer-only records (thesisRole === "reviewed").
  - Records missing author / year (renderer must degrade gracefully).
  - FI + EN.
  - Pagefind result row on `/opinnaytteet/` + `/en/theses/`.

## 12. Phased implementation recommendation

Do NOT implement in this task. Phase plan for a future authorization:

### TH-CITE1 Phase 1 — thesis CSL projection (Node-side, build-time)
- Add `buildThesisCslItem(thesis)` to a new `src/_utils/thesisCsl.js`.
  This is a **thin thesis-side adapter** that projects the canonical
  OuluREPO thesis object into a CSL item. It reuses `parseAuthors` from
  `publicationCsl.js` (already exported). The publications CSL builder
  `buildCslItem` is not extended — thesis and publication remain
  separate adapters that both feed the same shared renderer.
- Wire into `src/_data/thesisDetails.js` so every `thesisDetail` object gets `thesisDetail.csl`.
- Wire into `src/_utils/toThesesCollectionItems.js` so collection items carry csl too.
- Unit tests + a parity audit comparing shared renderer output against current `citationApa`.
- Additive; no deletion. `citationApa` field stays. No display change on any surface.

### TH-CITE1 Phase 2 — shared renderer thesis APA compliance
- Update `src/js/publication-citation.js` thesis APA branch to emit APA 7 `[Genre, Publisher].` bracket format.
- Add optional `lang: "en"` display map for FI→EN genre + publisher translation.
- Publications regression: the ONE thesis-typed publication in the current inventory (`rf-g5-*` doctoral dissertation article-based) gets bracket-format APA — categorized as EXPECTED IMPROVEMENT.
- Unit tests updated; Phase 2 shared renderer parity audit re-run.

### TH-CITE1 Phase 3 — migrate SSR-first display path to shared renderer
- Change `thesis-detail-body.njk` from `{{ thesisDetail.citationApa }}` to `{{ thesisDetail.csl | publicationCitation("apa") }}`.
- Change `thesis-details.njk:29` JSON-LD citation similarly.
- **Migrate the initial /opinnaytteet/ and /en/theses/ thesis archive**
  (currently curated cards via `thesis-curated-list.njk` + Find & Explore
  paging) so the visible rows are rendered at build time by Nunjucks
  from `thesisDetail.csl | publicationCitation("apa")`. Pagefind is not
  the initial-render source. This step follows Publications FULL Pagefind's
  precedent: SSR provides useful initial HTML; Pagefind is for query /
  filter / ranking interaction only.
- Preserve `citationApa` field emission as defence-in-depth for one release cycle.

### TH-CITE1 Phase 4 — migrate curated archive + citation modal
- `thesis-curated-list.njk`: pass `data-csl="{{ thesis.csl | jsonSafe | escape }}"` on the citation button.
- `thesis-hub-actions.js`: parse `data-csl`, call the shared renderer (like publications Phase 4a-b). Retain legacy browser formatters as fallback while wiring converges.
- New browser smoke tests mirror the Publications `pf-cite-modal-failure-path` shape.

### TH-CITE1 Phase 5 — PF5 GLOBAL RESULT PARITY
- Extend `buildThesisFindExploreDocument` with a `thesesCitationApa`
  meta field, populated at build time from the shared renderer.
- Every Pagefind surface must inherit the same thesis result-card
  presentation:
  - `src/js/find-explore.js` result rows on `/opinnaytteet/`,
    `/en/theses/`, `/tutkimus/` — dispatch on `entry.kind === "theses"`,
    display `entry.meta.thesesCitationApa`. **Zero composition.**
  - nav-bar Pagefind overlay (`src/js/site-ui.js` PagefindUI
    `processResult` callback or template config) — render the same
    thesis citation string from meta.
  - `/haku/` + `/en/search/` full-page PagefindUI — same `processResult`
    contract.
  - Any future Pagefind surface added later — reuse the same shared
    thesis-result renderer helper. New surfaces must not invent their
    own thesis result-card renderer.
- Context may only vary density (list-item vs card, compact vs
  expanded). Citation semantics and composition are shared.
- Extend `pf5-result-card-variants.spec.js` with thesis assertions
  mirroring the presentation smokes. Add browser smoke coverage for
  the nav-bar overlay and `/haku/` thesis result rendering.

### TH-CITE1 Phase 6 — delete legacy formatters after parity proof
- Once phases 1–5 land, all consumers read the shared renderer output.
- Delete `src/_data/theses.js` bespoke APA composer + helpers.
- Delete `src/js/thesis-hub-actions.js` browser formatters + their fallback branches.
- Delete `thesisDetail.citationApa` field emission if no external consumer remains (parity proven by audit script similar to `audit-pub-cite1-phase4d-export-data-citation-parity.js`).

## 13. Recommended next single-concern implementation step

**TH-CITE1 Phase 1 — thesis CSL projection (thin adapter, reuses
existing infrastructure).**

- New `src/_utils/thesisCsl.js` with `buildThesisCslItem(thesis)`.
  Reuses `parseAuthors` from `publicationCsl.js` (already exported).
  Does NOT extend the publications `buildCslItem`; thesis and
  publication remain separate adapters feeding the same shared
  renderer.
- Wire into `src/_data/thesisDetails.js` so every `thesisDetail` gets
  `thesisDetail.csl`.
- Wire into `src/_utils/toThesesCollectionItems.js`.
- Unit tests covering: master, bachelor, doctoral, licentiate,
  missing-author, missing-year, reviewer-only, FI + EN language,
  missing url, deterministic + input immutability.
- Node-side parity script comparing shared renderer output vs
  current `citationApa` on all 170 theses; classify each row
  IDENTICAL / EXPECTED IMPROVEMENT / UNEXPLAINED REGRESSION.
- **Additive only.** No template change. No deletion. No display
  change on any surface. `thesisDetail.csl` field added; every
  existing field preserved byte-identically.

This mirrors PUB-CITE1 Phase 1's shape: introduce the CSL projection,
prove parity via audit, ship, then let subsequent phases migrate
consumers one at a time — Phase 3 for SSR-first display, Phase 5 for
PF5 GLOBAL RESULT PARITY across every Pagefind surface.

## 14. Public-contract statement

**No public contract change proposed by this audit.** `/data/theses.json.citationApa` field remains. Detail-page JSON-LD field name remains. Any migration keeps the field names and string shapes; only the origin of the string changes.

## 15. Deliverables

- This document: `docs/th-cite1-thesis-citation-csl-readiness-audit-2026-08-17.md`.
- Machine-readable summary: `docs/data/th-cite1-thesis-citation-csl-readiness-2026-08-17.json`.

## Status

**TH-CITE1: AUDIT COMPLETE**
**TH-CITE1 implementation: NOT STARTED**
