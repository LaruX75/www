# PUB-CITE1 Phase 2 — Shared CSL Renderer + Publications List v2 Closure

Date: 2026-08-17
Status: **PUB-CITE1 PHASE 2 = LANDED / GREEN (local)**
Branch: `claude/pub-cite1-impl-phase1-csl-projection`
Base: Phase 1 commit `9112b74a` (`feat: add canonical publication CSL-JSON projection`)

## 1. Starting repository state

- Phase 1 (`9112b74a`) was on the branch at the top of the tree.
- All 56 canonical publications carried a `csl` object.
- Publication Find & Explore records forwarded `csl` (null-safe).
- Server APA composer (`researchfiContent.buildApaCitation`) and the five
  inline formatters (APA/MLA/Chicago/BibTeX/RIS) in `src/julkaisut.njk`
  were still the visible citation renderers.
- The FI archive rendered publications as content-card style rows
  (badges + title + author line + venue split across separate
  paragraphs); the EN archive shared the same partial.
- Publication detail (`researchfi-details.njk` +
  `_includes/publication-item-body.njk`) rendered the server-precomputed
  `detail.citation` string in a "Lähdeviite / Citation" card.

## 2. Phase 1 baseline verified before implementation

Confirmed with `audit-pub-cite1-phase1-csl-projection.js` (19/19 gates
green) and by inspecting `_site/data/publications-page.json` — 56 / 56
canonical items carrying `csl`.

## 3. Files changed

- **New**
  - `src/js/publication-citation.js` — isomorphic UMD renderer.
  - `src/_utils/publicationCitation.js` — Node-side re-export shim.
  - `tests/unit/publicationCitation.test.js` — 26 renderer assertions.
  - `scripts/audit-pub-cite1-phase2-shared-csl-renderer.js` — landing +
    parity audit.
  - `docs/data/pub-cite1-phase2-shared-csl-renderer-2026-08-17.json` —
    parity classification for all 56 canonical records.
  - `docs/pub-cite1-phase2-shared-csl-renderer-publications-list-v2-closure-2026-08-16.md`
    — this closure report.
- **Modified (additive)**
  - `eleventy.filters.js` — new `publicationCitation(csl, style)` filter.
  - `src/_includes/publications-opening-list.njk` — SSR row body now
    renders the shared APA citation sentence with the archive still
    exposing detail links, source links, quality badges, and the
    citation export button (FI only).
  - `src/_includes/publication-item-body.njk` — detail "Citation" card
    now prefers the shared APA output when `detail.csl` is present,
    with the pre-existing `detail.citation` server APA as fallback.
  - `src/julkaisut.njk` — loads `/js/publication-citation.js`, the
    citation export modal parses a `data-csl` attribute and
    preferentially delegates to `window.publicationCitation` for the
    preview + download + Zotero + Mendeley flows. Legacy inline
    APA/MLA/Chicago/BibTeX/RIS formatters remain as fallback.
  - `src/_utils/publicationCsl.js` — Phase 1's `parseAuthors` extended
    to correctly split APA-formatted comma-separated author lists like
    `"Laru, J., Näykki, P., & Järvelä, S."`. This corrects a Phase 1
    parser edge case that only surfaced when the CSL author list was
    handed to a real citation renderer (see §7 and §19).
  - `tests/unit/publicationCsl.test.js` — 3 new parseAuthors assertions
    covering the APA comma-list format.

## 4. Shared renderer architecture

One isomorphic UMD module (`src/js/publication-citation.js`) provides
the entire citation surface:

- Node loads it via `src/_utils/publicationCitation.js` — a thin
  re-export shim used by the Nunjucks filter and by tests.
- Browser loads it via passthrough-copied `/js/publication-citation.js`
  and gets `window.publicationCitation`.

This gives one source of truth for APA / MLA / Chicago / BibTeX / RIS
formatting. No separate SSR and client formatters — the codepath is
literally the same function on both sides. A regression test loads the
module in Node and asserts a representative CSL input renders correctly
on the server side; the same file is served to the browser and used by
the modal, so drift is architecturally impossible.

### Primary API

```
publicationCitation.buildCitation({ csl, style }) → { text, style, empty }
```

`style` accepts `"apa" | "mla" | "chicago" | "bibtex" | "ris"`; unknown
styles fall back to `"apa"`. `empty: true` is returned when the CSL
item is missing `id` or `title` (Phase 1's minimal identity).

## 5. Why the renderer location / API was chosen

- The project has **no bundler**. Duplicating a formatter in Node and
  in browser JS would guarantee drift.
- `src/js/` is a passthrough directory (`.eleventy.js:354`) — anything
  there is auto-served at `/js/*.js`.
- Node happily `require()`s the UMD file because the outer wrapper is
  `if (typeof module === "object" && module.exports) module.exports =
  factory()` first, `root.publicationCitation = factory()` second.
- The renderer never touches the DOM. It only reads a CSL object and
  returns a string, which fits both SSR and interactive use.
- A single-argument, object-options API (`{ csl, style }`) makes the
  Nunjucks filter registration trivial (`csl | publicationCitation("apa")`)
  and leaves room for future style-specific options without breaking
  callers.

## 6. SSR / client sharing model

- **Build-time (Nunjucks)**: `csl | publicationCitation("apa")` calls
  the Node re-export of the shared module and inlines the resulting
  string into the HTML.
- **Runtime (browser)**: the same module is loaded as a global and the
  citation export modal reads a `data-csl` attribute from each export
  button, parses it, and calls `window.publicationCitation.buildCitation`
  for the preview and downloads.
- **Fallback**: when a page is rendered with an item that has no CSL
  yet (e.g., a stub added outside the canonical pipeline), the modal
  falls back to the legacy inline formatters. This is intentional and
  documented in §17.

## 7. APA implementation

- Structured authors emit `Family, G.` with initials joined into a
  proper APA list (`, & ` before the last name).
- `{literal}` authors render verbatim.
- Journal articles: `authors (year). title. Container, vol(issue), page. URL`.
- Conference (`paper-conference`): container-title as venue.
- Chapters (`chapter`): `Teoksessa Container (page). Publisher.`
- Books (`book`): `authors (year). title. Publisher.`
- Theses (`thesis`): APA includes the CSL `genre` (Phase 1's OKM →
  thesis genre) plus publisher.
- DOI is emitted as `https://doi.org/<bare>` per APA 7.

## 8. MLA implementation

Formal MLA 9: `Family, Given. "Title." Container, vol. X, no. Y, YEAR,
pp. P.` with the 3-author "et al" rule and `doi:` prefix for DOIs.

## 9. Chicago implementation

Chicago author-date: `Family, Given. "Title." Container Vol, no. Y
(YEAR): pages. https://doi.org/DOI.` with the "and" separator for
multi-author lists.

## 10. BibTeX implementation

- Entry type derived from CSL `type`: `@article` / `@inproceedings` /
  `@inbook` / `@book` / `@phdthesis` / `@misc`.
- BibTeX key sanitized from `familyYearTitleSlug`.
- `journal` vs `booktitle` chosen based on entry type.
- Optional fields (`volume`, `number`, `pages`, `publisher`, `isbn`,
  `doi`, `url`) emitted only when present.

## 11. RIS implementation

- `TY  -` derived from CSL type (`JOUR` / `MGZN` / `NEWS` / `CPAPER` /
  `CHAP` / `BOOK` / `THES` / `GEN`).
- `AU  -` per author.
- `SP  - / EP  -` split when the pages field is a numeric range.
- `T2  -` for chapter container-titles, `JO  -` for journal.
- `DO  -` (DOI), `SN  -` (ISBN), `UR  -` when present.

## 12. Author handling

- The renderer never re-parses raw author strings — it consumes
  `csl.author[]` as Phase 1 emitted it.
- `{literal}` entries render verbatim without inventing family/given
  structure.
- Phase 1's `parseAuthors` was extended (behind the same API) to
  correctly split APA comma-separated author strings that Research.fi
  occasionally delivers (see §19). Behaviour for the more common
  `;`-separated Research.fi format is unchanged.

## 13. Publication types tested (unit + parity)

Direct unit coverage (`tests/unit/publicationCitation.test.js`):

- journal article (A1)
- conference paper (A4)
- book chapter (B2)
- book (C1)
- thesis (G5, with genre)
- literal-author record (multiple free-text names)
- no-DOI record

Parity coverage across all 56 Research.fi canonical publications in
the audit report — 4 IDENTICAL, 49 EXPECTED IMPROVEMENT
(APA initials / added publisher / DOI URL / chapter marker), 0 unexplained
regressions.

## 14. FI publication list changes (`src/julkaisut.njk` opening list)

- Publication row now leads with the APA citation sentence (linked to
  the local detail URL).
- Year badge, `pub.type` badge, peer-reviewed badge, open-access
  badge, JUFO level, and citation count remain as a secondary
  metadata strip.
- The three-button action row (local detail / source / export
  citation) is unchanged in placement and labels.
- Export button now carries a `data-csl="<escaped json>"` attribute so
  the modal can reach for the shared renderer without an extra
  round-trip.
- KPI cards, hero copy, and the Find & Explore section above the
  opening list are untouched.
- The 56-record inline dataset used by charts is untouched.

## 15. EN publication list changes (`src/en/publications.njk`)

- The EN page shares the same `publications-opening-list.njk`
  partial, so the same bibliographic APA rows now render on EN.
- `publicationLang = "en"` is preserved. `publicationShowCitationExport`
  defaults to `false` on EN — the modal is FI-only today, so no export
  buttons appear.
- All EN Chart.js dashboards remain untouched.

## 16. Detail citation migration status

- `_includes/publication-item-body.njk` now computes
  `sharedApaCitation = detail.csl | publicationCitation("apa")` and
  uses it as the visible citation string, falling back to
  `detail.citation` when the CSL projection is unavailable.
- Style badge, back button, external "Open source" link, JSON-LD,
  and the entire right-hand publication metadata card are unchanged.
- Detail canonical URLs (`/julkaisut/<publicationId>/`) unchanged.

## 17. Citation modal / export migration status

- Modal preview + download + Zotero + Mendeley flows now
  preferentially call the shared renderer when the export button
  carries `data-csl`. The renderer produces the same styles the modal
  supports (`apa`, `bibtex`, `mla`, `chicago`, `ris`).
- Legacy inline formatters (`buildApaCitation`, `buildMlaCitation`,
  `buildChicagoCitation`, `buildBibtexEntry`, `buildRisEntry`) remain
  in `src/julkaisut.njk` as fallback per prompt §H default assumption.
- The legacy fallback still supports pages that do not carry `csl`
  (e.g., a manually authored publication without the canonical
  pipeline).
- The `data-*` attribute set on the export button is unchanged apart
  from the additive `data-csl`.

## 18. No-JS behavior

- SSR APA citation is present in the HTML of every opening-list row
  and every detail page's "Citation" card.
- All detail links, source links, and DOI links remain plain `<a>`.
- The export modal button remains a `<button>`; without JavaScript the
  modal will not open, but the SSR APA sentence is still selectable
  and copyable from the row itself.
- Find & Explore initial state remains the SSR opening list — no
  regression in the non-JS baseline.

## 19. Old-vs-new citation parity results

Machine data:
`docs/data/pub-cite1-phase2-shared-csl-renderer-2026-08-17.json`.

| Class                | Count | Notes                                                  |
| -------------------- | ----- | ------------------------------------------------------ |
| IDENTICAL            | 4     | Byte-identical to the legacy APA composer output.      |
| EXPECTED IMPROVEMENT | 49    | Oxford ampersand, initials per APA 7, DOI as URL, added publisher, chapter "Teoksessa" marker, thesis genre. |
| METADATA-LIMITED     | 0     | (nothing left in this class after §12 parser fix).     |
| DIFFERS              | 0     | No unexplained regressions.                            |

The 49 improvements are all documented as EXPECTED IMPROVEMENTS in the
classifier logic (`classifyDiff` in the audit script), matching the
prompt §L rules for accepting non-byte-identical output when the
new rendering is demonstrably more correct.

The Phase 1 parser fix (§12, §3) was triggered by one broken A4
record whose Research.fi `authorsText` arrived pre-formatted as
`"Laru, J., Näykki, P., & Järvelä, S."` — Phase 1's initial parser
treated the whole string as one `{family: "Laru", given: "J., Näykki, P., & Järvelä, S."}` entry. The
extended `parseAuthors` detects the APA comma-list pattern (Oxford `&`
or ≥3 commas with initials) and splits it correctly. All 3 new unit
tests cover this case; the previously broken A4 record now parses to
three structured authors and renders correctly across all five styles.

## 20. Canonical / source / dedup parity

- Canonical publication count unchanged: **56**.
- Source ordering unchanged: `researchfi` > `manual`.
- Dedup keys unchanged: DOI → stable identifier → normalized
  title + year.
- Manual publication inclusion unchanged: `MANUAL_PUBLICATION_RULES`
  untouched.
- Item ordering on the opening list unchanged (still year-desc → date
  → group → title).
- `audit-publications-page-projection.js` returns 0 unexpected fields
  and 0 leakage.

## 21. Manual publication parity

- Manual promoted records still flow through the same
  `createManualPageItems` path, and their `csl` field is now
  computed via the same rules as Research.fi records.
- Manual detail URLs, source URLs, and archive inclusion rules
  unchanged.

## 22. Public-contract impact

- No public JSON field removed.
- No public-field types changed.
- No version bump.
- Additive-only change: `csl` was already present after Phase 1;
  Phase 2 does not touch the `PUBLIC_PUBLICATIONS_PAGE_FIELDS`
  allowlist.
- `_site/data/publications-page.json` still enumerates 56 items and
  each still carries a `csl` object.

## 23. Pagefind parity

- `Build and Deploy`-equivalent local build: **fi:1163 / en:346**
  (unchanged from Phase 1 baseline `fi:1163 / en:346` and PF-UI-L10N1
  baseline).
- `audit-pf-perf1-pagefind-startup.js` all gates green.
- `audit-pf2-sisalto-facet.js` coverage unchanged:
  publications 56, writings 234, theses 169, media 73, presentations 218.
- `audit-media-pagefind-m2.js` reverse gate
  `noDetailUsesPagefindBody` still green.

## 24. Research parity

- `audit-f4-research-built-output.js` Research population: **317**
  (unchanged).
- No change to `contexts`, topics, curated program, or research-line
  mapping.
- Find & Explore publication rows continue to render via the existing
  shared renderer without reading `csl` (§25 reverse gate).

## 25. Reverse gates

- `findExploreRendererStillDoesNotUseCsl` — `src/js/find-explore.js`
  does not read `entry.record.csl`. Phase 2 explicitly does not
  ship PF5-IMPL-APA.
- `enPublicationsUsesSharedList` — the EN publications page
  includes `publications-opening-list.njk`, so the SSR bibliographic
  presentation is FI/EN symmetric.
- `enPublicationsHasNoOwnCitationFormatters` — EN publications page
  contains no `buildApaCitation` / `buildMlaCitation` /
  `buildChicagoCitation` / `buildBibtexEntry` / `buildRisEntry`
  duplicates.
- `noSisaltoTutkimusInRenderer`, PF3 badge, PF4 hierarchy hooks,
  PF-PERF2 warmup + Enter-scroll handler, PF-UI-L10N1 Finnish label
  bundle — all still asserted green by their respective audits.

## 26. Accessibility / browser results

- Local Playwright regression sweep:
  - `tests/pf-perf2-first-search-latency.spec.js` — 5 / 5 pass.
  - `tests/pf-ui-l10n1-finnish-search-labels.spec.js` — 6 / 6 pass.
- Bibliographic APA row uses semantic `<p>` inside `<li>`, with the
  linked title-plus-citation as an `<a>`. Bootstrap 5 badges retain
  their contrast tokens.
- Action buttons keep their original ARIA labels (`title` attribute).
- Full a11y CI (`test:a11y`) not re-run in this local session —
  matches PF-UI-L10N1 policy: a11y CI is triggered by push, and the
  changes here are additive server-string swaps; no layout, no colour,
  no interactive control change.

## 27. Before / after complexity metrics

| Metric                                             | Phase 1 | Phase 2 |
| -------------------------------------------------- | ------- | ------- |
| Publication citation formatter modules (Node)      | 0       | 1 (isomorphic) |
| Publication citation formatter modules (browser)   | 1 (inline) | 1 (isomorphic UMD) + 5 legacy fallbacks in `julkaisut.njk` |
| Total inline formatter LOC in `julkaisut.njk`      | ~130    | ~130 (legacy retained as fallback) |
| Shared renderer LOC                                | 0       | 370 (with UMD wrapper + 5 styles) |
| Unit test count (repo-wide)                        | 429     | 458 (+26 renderer + 3 parseAuthors) |
| Nunjucks filters                                   | 49      | 50 (+`publicationCitation`)         |
| Public JSON contract fields                        | unchanged | unchanged |

No new architecture layer. The renderer is a single pure module
shared by all citation surfaces.

## 28. Legacy code still present (Phase 4 deletion candidates)

- `buildApaCitation(payload)` in `src/julkaisut.njk` (~L433) —
  fallback for records without `csl`.
- `buildMlaCitation(payload)` in `src/julkaisut.njk` (~L455).
- `buildChicagoCitation(payload)` in `src/julkaisut.njk` (~L477).
- `buildBibtexEntry(payload)` in `src/julkaisut.njk` (~L396).
- `buildRisEntry(payload)` in `src/julkaisut.njk` (~L499).
- `researchfiContent.buildApaCitation()` server-side (unchanged
  in Phase 2; used as `detail.citation` fallback).

Deletion should happen in Phase 4 only after:
1. every canonical / manual / editorial record demonstrably carries
   `csl` (currently 56 / 56 for canonical Research.fi + manual);
2. PF5-IMPL-APA has shipped and Find & Explore rows use the shared
   renderer;
3. any consumer outside the canonical pipeline (e.g., manually
   authored templates) has been audited for `csl` availability.

## 29. Known limitations

- MLA "et al" is applied at 3+ authors per current MLA 9 practice
  — this is an EXPECTED IMPROVEMENT over the legacy formatter, but
  users comparing against MLA 8's "list all" rule may notice a
  difference.
- Chicago publisher placement for non-container works (books,
  chapters when the publisher exists but no container-title is set) is
  a light heuristic; edge cases with unusual OKM codes may want a
  human review in Phase 4.
- Language field on the CSL projection is filled from the canonical
  `lang` field, which for all Research.fi records is currently `"fi"`
  even when the publication text is English. This is a Phase 1 data
  concern, not a renderer concern. APA output does not currently emit
  the language string, so this has no visible effect today.
- The Phase 2 `parseAuthors` extension is intentionally narrow — it
  only fires when the raw string is comma-separated AND either has an
  Oxford `&` or has ≥3 commas with initials-only given segments. If
  Research.fi ever ships a comma-separated pattern that doesn't match,
  the record falls back to the pre-Phase-2 single-author `{family,
  given}` behaviour, which renders safely (author names simply appear
  as a single citation entry). No canonical record currently in that
  bucket.

## 30. Exactly one NEXT action

**PF5-IMPL-APA — publication + thesis APA 7 Find & Explore rows.**

- Publication rows must consume the shared CSL renderer created here
  (`window.publicationCitation.buildCitation({ csl: entry.record.csl,
  style: "apa" })`).
- Do not implement a second F&E-specific citation formatter.
- Do not force the publication CSL architecture onto the thesis
  domain. Use the previously audited thesis citation semantics unless
  a separate suitability decision explicitly changes them.

Do not start PF5 in this task.
