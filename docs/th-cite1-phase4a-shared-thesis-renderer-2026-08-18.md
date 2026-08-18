# TH-CITE1 Phase 4A — Shared thesis citation/export renderer extensions

Date: 2026-08-18

Repository: `LaruX75/www`

Branch: `feat/th-cite1-phase4a-shared-thesis-renderer`

Base main HEAD: `e26bc8a1f3f00b5c3b2fda3b18386f5098c17f92`

Phase 4A completes the "extend the shared renderer first" precondition that the Phase 4 readiness audit (`docs/th-cite1-phase4-modal-export-readiness-audit-2026-08-18.md`) required before any browser migration in Phase 4B/4C. It is purely build-time work in the shared isomorphic UMD renderer.

## 1. Scope

- Add thesis-specific behaviour to the four remaining shared-renderer formats: **MLA**, **Chicago**, **BibTeX**, **RIS**.
- Preserve the existing Phase 2 **APA** thesis output byte-for-byte.
- Do not migrate any browser or template surface (Phase 4B/4C).
- Do not touch the public `/data/theses.json.citationApa` contract or JSON-LD `citation` property (Phase 6).
- Do not delete the legacy browser composers in `src/js/thesis-hub-actions.js` (Phase 4C).

## 2. Files changed

```text
src/js/publication-citation.js            +90 production LOC (net)
tests/unit/publicationCitation.test.js    +214 test LOC
```

No template, data, script, style, JSON, sitemap, Pagefind or public-JSON changes.

## 3. Shared renderer additions

All additions live in `src/js/publication-citation.js`. Each thesis branch is gated on `csl.type === "thesis"`; every non-thesis code path is unchanged.

### 3.1 Two new module-scope helpers

- `normalizedThesisGenre(genre)` — maps a FI or EN thesis genre string to a small stable enum: `"master" | "bachelor" | "doctoral" | "licentiate" | "other"`. Used by the BibTeX entry-type selector and reusable by any future consumer that needs to distinguish thesis level independent of display language.
- `bibtexThesisKey(csl)` — deterministic, human-readable, ASCII-safe citation key of shape `familyName + year + firstTitleWord`. NFD-normalised and stripped of combining marks so diacritics survive as ASCII (`Öysti` → `oysti`, `Ääniä` → `aania`). Only invoked when `csl.type === "thesis"`; publication BibTeX keeps the existing `bibtexKey` behaviour.
- `bibtexThesisEntryType(csl)` — thesis-only entry-type selector driven by `normalizedThesisGenre`. Mapping:

  | normalized genre | BibTeX entry type |
  |---|---|
  | master | `@mastersthesis` |
  | doctoral | `@phdthesis` |
  | licentiate | `@phdthesis` (closest valid representation) |
  | bachelor | `@misc` (BibTeX has no `@bachelorsthesis`) |
  | other | `@phdthesis` (safe fallback) |

The Phase 2 helpers `displayThesisGenre(genre, lang)` and `displayThesisPublisher(publisher, lang)` are already at module scope and consumed unchanged by all four new thesis branches. No duplication of the FI→EN display map.

### 3.2 MLA thesis branch (`mla(csl, lang)`)

Format:

```text
Authors. "Title." Genre, Publisher, Year. URL.
```

FI on `lang="fi"`:

```text
Mattila, Teemu. "Professional development of technology integration into teaching." Pro gradu -tutkielma, Oulun yliopisto, 2021. https://oulurepo.oulu.fi/handle/10024/18096.
```

EN on `lang="en"`:

```text
Mattila, Teemu. "Professional development of technology integration into teaching." Master's thesis, University of Oulu, 2021. https://oulurepo.oulu.fi/handle/10024/18096.
```

Publisher and URL are omitted when absent. No period is doubled. No comma is left dangling.

### 3.3 Chicago thesis branch (`chicago(csl, lang)`)

Chicago author-date variant, matching the browser-era output shape (year second):

```text
Authors. Year. "Title." Genre, Publisher. URL.
```

FI:

```text
Mattila, Teemu. 2021. "Professional development of technology integration into teaching." Pro gradu -tutkielma, Oulun yliopisto. https://oulurepo.oulu.fi/handle/10024/18096.
```

EN:

```text
Mattila, Teemu. 2021. "Professional development of technology integration into teaching." Master's thesis, University of Oulu. https://oulurepo.oulu.fi/handle/10024/18096.
```

### 3.4 BibTeX thesis branch (`bibtex(csl, lang)`)

FI master's:

```text
@mastersthesis{mattila2021professional,
  author = {Mattila, Teemu},
  title = {Professional development of technology integration into teaching},
  year = {2021},
  school = {Oulun yliopisto},
  url = {https://oulurepo.oulu.fi/handle/10024/18096},
}
```

EN master's:

```text
@mastersthesis{mattila2021professional,
  author = {Mattila, Teemu},
  title = {Professional development of technology integration into teaching},
  year = {2021},
  school = {University of Oulu},
  url = {https://oulurepo.oulu.fi/handle/10024/18096},
}
```

FI bachelor's:

```text
@misc{latvala2026emotionaalisen,
  author = {Latvala, L.},
  title = {Emotionaalisen älykkyyden ja koulukiusaamisen väliset yhteydet},
  year = {2026},
  howpublished = {Kandidaatintutkielma, Oulun yliopisto},
  url = {...},
}
```

Notes:

- `@mastersthesis` and `@phdthesis` use `school = {...}` (correct BibTeX convention for thesis entries), NOT `publisher =`.
- `@misc` uses `howpublished = {Level, Institution}` so the record stays self-descriptive even without a `school` field — BibTeX does not recognise `school` inside `@misc`.
- Doctoral and licentiate both emit `@phdthesis` with `school =`.
- Publication BibTeX (`@article`, `@book`, `@inbook`, `@inproceedings`, `@misc` for other CSL types) keeps `publisher =` and the existing `bibtexKey` opaque key policy — unchanged.

### 3.5 RIS thesis branch (`ris(csl, lang)`)

Additive: adds `M3  - <genre display>` line for `csl.type === "thesis"`, and routes `PB` through the FI/EN display map so Zotero and Mendeley consume the same institution string that the human-readable citations show.

FI:

```text
TY  - THES
AU  - Mattila, Teemu
PY  - 2021
TI  - Professional development of technology integration into teaching
PB  - Oulun yliopisto
M3  - Pro gradu -tutkielma
UR  - https://oulurepo.oulu.fi/handle/10024/18096
ER  - 
```

EN:

```text
TY  - THES
...
PB  - University of Oulu
M3  - Master's thesis
...
```

Non-thesis RIS records are unchanged (no `M3`, publisher passed through verbatim). Zotero and Mendeley both consume this same RIS text — no serialization-layer differentiation.

### 3.6 `buildCitation` wiring

`buildCitation({csl, style, lang})` now threads `lang` into every style, not just APA. This is safe by construction because MLA / Chicago / BibTeX / RIS only consult `lang` inside their `csl.type === "thesis"` branches.

## 4. FI / EN / thesis-language semantics

Unchanged from Phase 2:

- **UI locale** (the `lang` argument) controls thesis-genre + institution display strings. Same FI→EN map for all five styles (APA, MLA, Chicago, BibTeX, RIS).
- **Canonical thesis source language** (`csl.language`) remains a separate concept and is not used to switch citation display.
- No new translation map. All four new branches call the same `displayThesisGenre` / `displayThesisPublisher` helpers that APA has used since Phase 2.

## 5. Bugs from the legacy browser composer NOT preserved

Per the readiness audit's directive (#10) — do not copy known browser bugs:

- **EN-only hardcoding** — none. All five styles respect `lang`.
- **Fabricated author `"Laru, Jari"` fallback in BibTeX** — none. Missing `csl.author` yields `Tuntematon Tekija` (the shared renderer's existing controlled fallback).
- **RIS dispatch omission** (browser's `getCitationByFormat` fell through to BibTeX for `"ris"`) — not applicable here; `buildCitation` correctly dispatches `"ris"` to `ris()`.
- **Same MIME + `.txt` extension for BibTeX + RIS** — not applicable in Phase 4A (this is browser-Blob concern for Phase 4C).
- **Genre / institution hardcoded to EN even on FI page** — corrected by the shared display map.

## 6. Test evidence

Unit tests (`tests/unit/publicationCitation.test.js`):

```text
Before Phase 4A: 34 tests
Added:           39 Phase 4A tests
After Phase 4A:  73 tests, 21 suites
```

Full unit suite:

```text
node --test tests/unit/*.test.js
tests: 527 / 527 pass
suites: 129
duration: ~900 ms
```

Test breakdown (Phase 4A additions):

- Phase 4A — APA thesis regression: 2 (byte-identical FI + EN)
- Phase 4A — MLA thesis branch: 8 (FI/EN master + FI/EN bachelor + FI/EN doctoral + missing-author + missing-publisher + missing-URL)
- Phase 4A — Chicago thesis branch: 4 (FI/EN master + FI bachelor + missing-author)
- Phase 4A — BibTeX thesis entry-type mapping: 12 (master FI/EN, bachelor FI/EN, doctoral, licentiate, unknown-genre fallback, key format, diacritic key, key stability, missing-author, URL preservation, absence of `publisher =` on master, absence of `school =` on bachelor)
- Phase 4A — RIS thesis M3 + display map: 6 (FI master full, EN master translated, FI bachelor, EN bachelor, FI doctoral, no-genre M3-omission)
- Phase 4A — publication regression: 7 (journal APA, book BibTeX still `@book`+`publisher =`, chapter BibTeX still `@inbook`, journal RIS no M3, book RIS PB unchanged, journal MLA unchanged, journal Chicago unchanged)

## 7. Publication regression proof

Explicitly verified on `main` baseline before Phase 4A and on this branch after:

- Journal, book, chapter, conference, and thesis (G5 publication-type) records emit identical APA, MLA, Chicago, BibTeX, RIS output.
- The G5 publication with `type="thesis"` + genre `"Doctoral dissertation (article-based)"` still routes to `@phdthesis` (unknown-genre fallback), matches the pre-existing `RIS TY THES for thesis` unit test, matches the pre-existing `BibTeX @phdthesis for thesis` unit test — both pass unchanged.
- Node smoke run on canonical CSL fixtures confirmed publication text is identical byte-for-byte:
  - `cslJournal()` APA / MLA / Chicago / BibTeX / RIS — unchanged
  - `cslBook()` APA / MLA / Chicago / BibTeX / RIS — unchanged
  - `cslChapter()` APA / MLA / Chicago / BibTeX / RIS — unchanged

Additional dedicated regression tests inside `Phase 4A — non-thesis regression: publication paths unchanged` describe block assert:

- Journal APA still shows `Computers & Education, 42(3), 101-115`.
- Book BibTeX is `@book{...}` with `publisher = {Some Publisher}` and no `school`/`howpublished`.
- Chapter BibTeX is `@inbook{...}` with `booktitle`.
- Journal RIS starts `TY  - JOUR` and has no `M3` line anywhere.
- Book RIS `PB - Some Publisher` (raw publisher, not routed through thesis display map).
- Journal MLA and Chicago produce the same volumes/issues/pages structure as before.

## 8. Build + audit regression gates

```text
rm -rf _site && npm run build:no-og                  clean (1472 pages, no missing description / og-image)
node scripts/audit-th-cite1-phase1-thesis-csl-parity.js
  raw 170, canonical unique 169
  parity 169 / 169 IDENTICAL, no gate failures
node scripts/audit-th-cite1-phase3-ssr-archive.js
  16 / 16 FI SSR URLs, 16 / 16 EN SSR URLs, union 169 / 169
  sitemap landings present, 0 paginated URLs
  10 / 10 gates green
Playwright regression bundle:
  th-cite1-phase3-thesis-pagination.spec.js         8 / 8
  f3a-theses-find-explore.spec.js                   2 / 2 + 1 skip (Phase 4B/4C target — unchanged from main)
  f3b-publications-find-explore.spec.js             2 / 2 (Pagefind cold-start flake documented; green on retry)
  pf-cite-modal-failure-path.spec.js                2 / 2
  accessibility.spec.js + contrast.spec.js + navigation.spec.js  27 / 27
```

Preexisting `filterCallsBuildCitation` gate failure in `scripts/audit-pub-cite1-phase2-shared-csl-renderer.js` is a stale audit regex (Phase 2 added `lang` to the filter call; audit regex was not updated). Confirmed to reproduce on `main` before Phase 4A, so this is NOT a Phase 4A regression. Suggest updating the audit regex in Phase 4C or Phase 6 alongside broader legacy-formatter cleanup.

## 9. Deletions

None in Phase 4A. Explicit non-deletions:

- `src/js/thesis-hub-actions.js#buildThesisApa / Mla / Chicago / BibTeX / Ris / getThesisLevelLabel / getCitationByFormat` — kept, no consumers migrated yet.
- `src/_data/theses.js#buildApaCitation / withCitation / getThesisLevelLabel` — kept (Phase 6).
- `src/_includes/thesis-hub-modals.njk` — kept.
- `src/_includes/thesis-table.njk` (orphaned since F3A + Phase 3) — kept for now; scheduled for Phase 4C cleanup alongside the browser-composer removal.

## 10. Remaining Phase 4B/4C work (unchanged by this phase)

- **Phase 4B — restore detail-page export UI.** Include `thesis-hub-modals.njk` in `thesis-detail-body.njk`; add trigger element carrying `data-thesis-csl`; load `/js/thesis-hub-actions.js` on detail pages. Now safe to do because MLA/Chicago/BibTeX/RIS output through shared renderer no longer regresses vs the browser composer.
- **Phase 4C — migrate `thesis-hub-actions.js` to `sharedCitation(payload, format)` mirroring `src/julkaisut.njk`.** Delete the five browser composers + `getThesisLevelLabel` + `getCitationByFormat`. Delete orphaned `src/_includes/thesis-table.njk`. Empty CSL → unavailable state (no silent raw-field fallback).
- **Phase 4D — rewrite skipped F3A test as a detail-page modal export test.** Add new `tests/th-cite1-phase4-thesis-modal-export.spec.js` covering FI + EN, all five formats, copy, download, Zotero, Mendeley, missing-data path, keyboard. Roadmap + closure updates on merge.

Phase 5 (PF5 GLOBAL RESULT PARITY) and Phase 6 (legacy formatter deletion + `citationApa` migration to CSL-sourced text) are unchanged.

## 11. Canonical / public contract audit

Public surfaces this phase touches: **none**.

- `/data/theses.json.citationApa` — unchanged.
- JSON-LD `citation` property on thesis detail pages — unchanged.
- `thesisDetail.csl` build model — unchanged shape.
- `thesisDetail.citationApa` build model — unchanged.
- Pagefind thesis-tagged fragments — unchanged (169).
- Sitemap — unchanged.
- Canonical Content v1 — unchanged.

No new canonical taxonomy or CSL fields were introduced.

END OF PHASE 4A NOTE.
