# TH-CITE1 Phase 4 — Modal / export migration closure

Date: 2026-08-18

Status: **CLOSED / GREEN / MAIN**

Repository: `LaruX75/www`

Branch: `feat/th-cite1-phase4a-shared-thesis-renderer` (Phase 4A + 4B + 4C + 4D all on one branch)

Ancestry (branch tip):

```text
cf26df27  Phase 4A  shared thesis MLA/Chicago/BibTeX/RIS branches
338b5154  Phase 4B  restore detail-page citation/export modal
a388aec4  Phase 4C  delete legacy browser citation composition
659bcdeb  Phase 4D  parity, skipped-test retirement, closure
```

Base main HEAD at Phase 4A start: `e26bc8a1f3f00b5c3b2fda3b18386f5098c17f92`.

**Merge to main:**

- Implementation PR: [#103 — TH-CITE1 Phase 4: shared thesis exports and detail-page citation UI](https://github.com/LaruX75/www/pull/103)
- Feature HEAD at PR time: `659bcdeb7f3767f392139e7c0ff8e18de6179238`
- Merge SHA: `3d437b3d282830458c0c890ea19155f94d338aee`
- Merge timestamp: `2026-08-18T13:09:09Z`
- Post-merge main HEAD: `3d437b3d282830458c0c890ea19155f94d338aee`

**Post-merge CI on `main` (`3d437b3d`):**

```text
Build and Deploy                       success
Accessibility and navigation tests     success
Generate OG Images                     success
```

**Post-merge local verification on `main` (`3d437b3d`):**

```text
unit tests                             527 / 527
npm run build:no-og                    clean, 1472 pages
Phase 1 canonical citation parity      169 / 169 IDENTICAL
Phase 3 SSR archive audit              10 / 10 gates
Phase 4C static deletion audit         37 / 37 gates
Phase 4D end-to-end parity audit       52 / 52 gates
FI SSR archive union                   169 / 169
EN SSR archive union                   169 / 169
Pagefind thesis-tagged fragments       169
sitemap landings present               true
sitemap paginated-URL hits             0

Playwright bundle:
  Phase 3 pagination                    8 / 8
  Phase 4B modal/export                11 / 11
  Phase 4C no-fallback                  7 / 7
  F3A theses Find & Explore             3 / 3   (0 skips)
  F3B publications F&E                  2 / 2   (Pagefind cold-start
                                                 flake handled by --retries=1)
  pf-cite-modal-failure-path            2 / 2
  accessibility + contrast + navigation green
    (+1 pre-existing unrelated flaky test in navigation.spec.js
     "Search dialog focus trap" — passes on retry)
  Total: 63 pass, 0 skips in Phase 4 scope
```

---

## 1. Phase 4 architectural result

```text
canonical thesis (OuluREPO fetch → src/_data/theses.js)
   │
   ├─ withCitation() → buildApaCitation()            ← Phase 6 target
   │      → thesis.citationApa  (public JSON, JSON-LD, build model)
   │
   └─ buildThesisCslItem()  (Phase 1)
        └─ internal CSL
             ├─ thesisDetail.csl  (SSR + detail-page modal payload)
             ├─ collection item data.csl
             └─ shared publicationCitation.buildCitation({csl, style, lang})
                  ├─ APA         (Phase 2, byte-identical parity vs legacy)
                  ├─ MLA         (Phase 4A, thesis-branch, FI/EN display map)
                  ├─ Chicago     (Phase 4A, thesis-branch, FI/EN display map)
                  ├─ BibTeX      (Phase 4A, @mastersthesis / @phdthesis /
                  │              @misc with school = or howpublished =,
                  │              deterministic human-readable citation key)
                  └─ RIS         (Phase 4A, TY - THES + M3 - <genre> line,
                                  publisher through FI/EN display map)


thesis detail page (/opinnaytteet/{id}/)
   ├─ SSR citation card (from thesisDetail.csl | publicationCitation)
   └─ "Vie viite" / "Export citation" trigger (data-thesis-csl + data-thesis-lang)
        └─ #thesisCitationModal
             ├─ format select (APA / MLA / Chicago / BibTeX)
             ├─ preview  →  sharedCitation(payload, format)
             ├─ Copy      →  clipboard
             ├─ Download  →  Blob with per-format MIME
             ├─ Zotero    →  downloadRisFor(payload, "zotero", btn)  → .ris
             └─ Mendeley  →  downloadRisFor(payload, "mendeley", btn) → .ris
```

Closure invariants met:

- **No browser raw-field citation composition.**
- **No archive citation modal.**
- **No duplicate abstract modal.**
- **No full CSL public JSON exposure.**
- **No Phase 5 Pagefind scope.**
- **No Phase 6 public-contract deletion.**

Short form: **canonical content defines truth, shared renderer composes citations, Eleventy/Nunjucks renders deterministic page content, JavaScript manages interaction only**.

---

## 2. Phase-by-phase summary

### 2.1 Phase 4A — Shared renderer thesis extensions (build-time only)

Commit: `cf26df27`. Closure: `docs/th-cite1-phase4a-shared-thesis-renderer-2026-08-18.md`.

- MLA / Chicago / BibTeX / RIS thesis branches added to `src/js/publication-citation.js`. APA branch (Phase 2) preserved byte-for-byte.
- FI/EN display map reused via `displayThesisGenre` + `displayThesisPublisher` — no new translation table.
- BibTeX thesis-genre → entry-type mapping: master → `@mastersthesis`, doctoral/licentiate → `@phdthesis`, bachelor → `@misc`; `school = {…}` for master/phd, `howpublished = {Level, Institution}` for @misc.
- Deterministic human-readable BibTeX thesis citation key: `family + year + firstTitleWord`, NFD-normalised + combining-mark stripped, ASCII lowercase.
- RIS: `M3 - <thesis-genre display>` line + PB routed through display map for `csl.type === "thesis"`.
- 39 new unit tests, 0 publication-side regressions.

### 2.2 Phase 4B — Restore detail-page citation/export UI

Commit: `338b5154`. Closure: `docs/th-cite1-phase4b-thesis-detail-citation-ui-2026-08-18.md`.

- New lean modal include `src/_includes/thesis-citation-modal.njk` (55 lines) — citation modal only.
- Abstract modal intentionally **not restored** — the abstract is already rendered natively in the SSR detail body.
- Detail-page trigger button added to `src/_includes/thesis-detail-body.njk` inline in the existing Citation card. Localised label `Vie viite` / `Export citation`.
- Trigger carries `data-thesis-csl` (JSON-escaped canonical CSL) + `data-thesis-lang`; `aria-haspopup="dialog"` + `aria-controls`.
- `src/opinnaytteet/thesis-details.njk` `pageScripts: ["/js/publication-citation.js", "/js/thesis-hub-actions.js"]` — modal JS loaded only on the 169 detail permalinks.
- Archive templates (`src/opinnaytteet.njk`, `src/en/theses.njk`) removed the old `/js/thesis-hub-actions.js` from `pageScripts` and removed the `thesis-hub-modals.njk` include.
- `thesis-hub-actions.js` gained `sharedCitation(payload, format)` mirroring the publications pattern in `src/julkaisut.njk`; legacy composers retained temporarily as unreachable fallback for 4C.
- 11 new Playwright tests, all green.

### 2.3 Phase 4C — Delete legacy browser citation composition

Commit: `a388aec4`. Closure: `docs/th-cite1-phase4c-browser-citation-deletion-2026-08-18.md`.

- Deleted from `src/js/thesis-hub-actions.js`: `getThesisLevelLabel`, `buildThesisApa`, `buildThesisMla`, `buildThesisChicago`, `buildThesisBibTeX`, `buildThesisRis`, `getCitationByFormat`, `pickString` (dead helper), plus all abstract-modal DOM lookups + `openAbstractModal` + `[data-thesis-abstract-trigger]` branch + `abstractExportBtn` listener.
- Deleted templates: `src/_includes/thesis-hub-modals.njk` (superseded), `src/_includes/thesis-table.njk` (orphaned since F3A + Phase 3).
- Deleted dead CSS `.pub-table .thesis-bib-btn { display: none !important; }` from `src/css/modules/_articles.css`.
- Trigger payload simplified: 7 data attributes → 2 (`data-thesis-csl` + `data-thesis-lang`).
- Every action handler unavailable-state path made unconditional — no `if (csl missing) → getCitationByFormat` fallback anywhere.
- Per-format MIME types on downloads: `text/plain;charset=utf-8` for APA/MLA/Chicago, `application/x-bibtex;charset=utf-8` for BibTeX, `application/x-research-info-systems;charset=utf-8` for RIS.
- `filenameBase(payload)` derives from `csl.title` / `csl.author[0].family`; no raw-field parallel model.
- 37-gate static deletion audit + 7-test browser regression proving injected raw-field triggers cannot fabricate citations.

### 2.4 Phase 4D — Skipped-test retirement, parity audit, stale audit cleanup

(this commit)

- **F3A skipped test retired.** `tests/f3a-theses-find-explore.spec.js` — the pre-Phase-3 test *"FI theses curated cards preserve abstract and citation actions"* is gone. Replacement: a smaller, current-architecture assertion that the FI archive still has no citation triggers, no citation modal, no abstract modal, and no more than 30 SSR thesis rows. F3A now runs **3 / 3, 0 skips**. Detail-page modal behaviour is not re-tested here — it's already covered by 11 Phase 4B tests + 7 Phase 4C tests.
- **Phase 4 parity audit** added: `scripts/audit-th-cite1-phase4-modal-export-parity.js` — 52 hard gates spanning renderer coverage, detail UI, archive boundary, browser deletion, public contract preservation, corpus parity. Reads live canonical thesis data + built `_site/` output; does not hardcode counts.
- **Stale audit deleted.** `scripts/audit-theses-built-output.js` was classified **ORPHANED**: 0 npm/CI/script consumers; only historical closure docs (`docs/find-explore-theses-f3a-report-2026-08-12.md` etc.) reference it as period evidence. Reported `ok: false` on `main` since Phase 3 changed the archive. Removed.
- **Stale-artifact grep sweep.** All remaining hits classified as intended test/audit EVIDENCE (regression tests asserting the strings are absent, or audit scripts checking for their absence). Zero pending cleanup.
- Full regression sweep re-run.

---

## 3. Test evidence

### Unit tests

```text
node --test tests/unit/*.test.js
527 / 527 pass  (129 suites)
```

Includes 39 Phase 4A thesis-branch tests across MLA / Chicago / BibTeX / RIS + 7 publication-regression assertions.

### Build

```text
npm run build:no-og
clean, 1472 pages
SEO dashboard: missingDescription=0 missingOgImage=0
researchfi-integrity: 56 records, no gate failures
```

### Audit scripts

```text
scripts/audit-th-cite1-phase1-thesis-csl-parity.js
  raw 170, canonical unique 169
  parity (canonical unique): identical=169 improvements=0 metadata-limited=0 regressions=0
  gate failures: (none)

scripts/audit-th-cite1-phase3-ssr-archive.js
  FI SSR union 169/169, EN SSR union 169/169
  sitemap landings present, 0 paginated URLs
  max 30 rows/URL
  10 / 10 gates green

scripts/audit-th-cite1-phase4c-browser-citation-deletion.js
  37 / 37 gates green

scripts/audit-th-cite1-phase4-modal-export-parity.js  (NEW in 4D)
  canonical unique theses: 169
  SSR archive union FI/EN: 169 / 169
  Pagefind thesis fragments: 169
  52 / 52 gates green
```

### Browser tests (Playwright)

```text
tests/th-cite1-phase3-thesis-pagination.spec.js         8 / 8
tests/th-cite1-phase4b-thesis-detail-modal.spec.js     11 / 11
tests/th-cite1-phase4c-no-raw-field-fallback.spec.js    7 / 7
tests/f3a-theses-find-explore.spec.js                   3 / 3   (0 skips — was 2 + 1 skip)
tests/f3b-publications-find-explore.spec.js             2 / 2   (Pagefind cold-start flake handled by --retries=1)
tests/pf-cite-modal-failure-path.spec.js                2 / 2
tests/accessibility.spec.js + tests/contrast.spec.js
  + tests/navigation.spec.js                            all green (+1 pre-existing flaky in navigation.spec.js "Search dialog focus trap" — unrelated to TH-CITE1, passes on retry)
```

**Zero unexplained regressions. Zero unexplained skips in the Phase 4 scope.**

---

## 4. Phase 4 impact measurement

### Shared renderer LOC

`src/js/publication-citation.js`: **+90 production LOC net** (module-scope helpers + four thesis branches + lang wiring in `buildCitation`). All additive; every non-thesis code path unchanged.

### thesis-hub-actions.js

| metric | before Phase 4 | after Phase 4C | delta |
|---|---:|---:|---:|
| Lines | 239 | 238 | −1 |
| Bytes | (baseline before 4B, `f83e91a`-era browser composers) ≈ 8,600 → grew to 15,139 at Phase 4B tip → 9,421 after 4C | 9,421 | net −38 % vs Phase 4B tip, −5,718 B on every detail-page load |

Note: line-count is nearly identical between the pre-Phase-4 file and the post-Phase-4C file because Phase 4B added `sharedCitation` + focus return + unavailable-state helpers before Phase 4C deleted the composers.

### Templates deleted

- `src/_includes/thesis-hub-modals.njk` — 78 lines.
- `src/_includes/thesis-table.njk` — ~200 lines (dead since F3A).
- Plus 2 lines of dead CSS in `src/css/modules/_articles.css` and one legacy audit script `scripts/audit-theses-built-output.js`.

### Trigger payload

Before Phase 4B: no trigger (Phase 3 removed it).
Phase 4B: 7 attributes `data-thesis-csl / -title / -authors / -year / -type / -url / -lang`.
Phase 4C: **2 attributes** `data-thesis-csl / data-thesis-lang`.

### Detail-page JS payload

Before Phase 4 (Phase 3-era archive shipped this file): `/js/thesis-hub-actions.js` was 8.6 KB and loaded on the ARCHIVE. Detail pages loaded nothing.
Phase 4B: `/js/publication-citation.js` (~15 KB) + `/js/thesis-hub-actions.js` (15.1 KB) both loaded on the 169 detail permalinks. Archive stopped loading `thesis-hub-actions.js`.
Phase 4C: `/js/publication-citation.js` unchanged + `/js/thesis-hub-actions.js` **9.4 KB** on detail pages. **Archive JS payload unchanged from Phase 4B** (still ships only `find-explore.js` + `thesis-archive-pagination.js`).

### Modal DOM location

Before Phase 4: `thesis-hub-modals.njk` (78 lines: abstract + citation modals) shipped on every FI + EN archive page.
Phase 4B: `thesis-citation-modal.njk` (55 lines: citation modal only) shipped on every detail page. Archive dropped the modal include.
Phase 4C: same as 4B.

---

## 5. Retained Phase 6 legacy path (INTENTIONAL)

Not touched by Phase 4:

- `src/_data/theses.js#buildApaCitation` — server-side APA composer.
- `src/_data/theses.js#withCitation` — wraps `buildApaCitation`, populates `thesis.citationApa`.
- `src/_data/theses.js#getThesisLevelLabel` — server-side genre label.
- `thesisDetail.citationApa` — internal build model.
- Collection item `data.citationApa` — internal build model.
- `/data/theses.json.citationApa` — **PUBLIC contract**.
- JSON-LD `citation` property on thesis detail pages via `thesisSchemaCitation` computed field — **PUBLIC schema surface**.

These serve real public consumers (Google Scholar, Zotero via JSON-LD, external RSS/API consumers of `/data/theses.json`). Phase 6 will re-source `citationApa` from the shared renderer (CSL → `publicationCitation`) and delete `buildApaCitation` after consumer-parity proof, following the pattern PUB-CITE1 Phase 4e used for publications.

Phase 4D preserves the public-contract text byte-identical.

---

## 6. Phase 5 boundary (INTENTIONAL non-goal)

Not touched by Phase 4:

- PF5 GLOBAL RESULT PARITY.
- Navbar Pagefind overlay.
- `/haku/` and `/en/search/` result presenters.
- Pagefind thesis fragment / filter / meta content — 169 fragments confirmed by Phase 4D audit.

Phase 5 will consolidate the per-domain Pagefind result presenters (publications, theses, presentations, writings, media) into one shared domain-variant presenter. Phase 4 explicitly did NOT change any Pagefind surface.

---

## 7. Public contracts unchanged

Verified by Phase 4D parity audit gates:

- `/data/theses.json` contains 169 items, each with `citationApa` (where source data provides it) and NO `csl` field.
- Sample detail page (`/opinnaytteet/18096/`) JSON-LD contains `"citation": "…"`.
- `thesisSchemaCitation` computed field retained on `src/opinnaytteet/thesis-details.njk`.
- `src/_data/theses.js` still exports `buildApaCitation`, `withCitation`, `getThesisLevelLabel`.

Canonical Content v1 unchanged.

---

## 8. Post-closure actions — completed

Executed after the branch closure:

1. Opened PR [#103](https://github.com/LaruX75/www/pull/103) `feat/th-cite1-phase4a-shared-thesis-renderer` → `main`. **DONE**.
2. Waited for CI (Build and Deploy, Accessibility and navigation tests, Generate OG Images) — all green. **DONE**.
3. Merged to `main` at `3d437b3d282830458c0c890ea19155f94d338aee` on `2026-08-18T13:09:09Z`. **DONE**.
4. Post-merge verification on `main` — 527 unit tests, all Phase 1/3/4C/4D audits green, Playwright bundle 63 pass. **DONE**.
5. Roadmap `docs/find-explore-roadmap-2026-08-12.md` updated with the new TH-CITE1 Phase 4 A–D status block. **DONE**.
6. This closure doc flipped from `CLOSED / GREEN / BRANCH` to `CLOSED / GREEN / MAIN` via a separate docs-only PR (mirrors the Phase 3 pattern). **DONE**.
7. **Phase 5 and Phase 6 remain NOT STARTED.**

END OF PHASE 4 CLOSURE.
