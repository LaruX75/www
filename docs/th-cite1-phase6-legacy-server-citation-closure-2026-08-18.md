# TH-CITE1 Phase 6 — Legacy server citation deletion closure

Date: 2026-08-18

Status: **CLOSED / GREEN / BRANCH**

Repository: `LaruX75/www`

Branch: `feat/th-cite1-phase6-legacy-server-citation-deletion`

Base main SHA: `946f553270e3bebeb81edc470b79ca12ca732c83`

Phase 6 is not yet on `main`. This document closes the workstream **on the feature branch**. Roadmap will move to `CLOSED / GREEN / MAIN` after PR + merge + post-merge verification.

---

## 1. Architectural result

Before:

```text
raw thesis fields
  → src/_data/theses.js#buildApaCitation()   (server-side parallel APA composer)
  → thesis.citationApa
```

After:

```text
raw thesis fields
  → src/_data/theses.js#withCitation()
     → buildThesisCslItem()  (src/_utils/thesisCsl.js — Phase 1 CSL adapter)
     → publicationCitation.buildCitation({csl, style: "apa", lang: "fi"})
     → thesis.citationApa
```

**The shared renderer (`src/js/publication-citation.js`) is now the sole bibliographic composer in the site.** No parallel server-side APA composer remains.

`citationApa` propagates through the same downstream projections as before:

```text
withCitation-attached citationApa
  ├→ /data/theses.json.items[].citationApa       (PUBLIC contract)
  ├→ thesisDetail.citationApa                    (INTERNAL build model)
  ├→ collection item data.citationApa            (INTERNAL build model)
  └→ JSON-LD `citation` property                 (PUBLIC schema contract)
```

All four are **byte-identical** to the pre-Phase-6 baseline (see §4).

---

## 2. Deletions

### `src/_data/theses.js`

Removed (LOC in the pre-change file):

- `getThesisLevelLabel(type)` — 5 lines
- `buildApaCitation(thesis)` — 12 lines
- `formatAuthorInitials(value)` — 7 lines (only consumed by deleted composers)
- `formatAuthorApa(author)` — 17 lines (only consumed by deleted composers)
- `formatAuthorsApa(authors)` — 10 lines (only consumed by deleted composers)

Total: **~51 production LOC removed** from `src/_data/theses.js`. The file grew back by ~14 LOC for the new `citationApaFromCsl` helper + imports + explanatory comments. Net: `src/_data/theses.js` LOC 435 → 416 (−19); byte size 17,569 → 16,761 (−808 B).

### `scripts/audit-th-cite1-phase1-thesis-csl-parity.js` — DELETED (223 LOC)

After Phase 6, this audit is tautological — it compares `thesis.citationApa` against `publicationCitation.buildCitation({csl, style: "apa"})`, but Phase 6 makes those two the SAME derivation. Only historical closure docs mentioned it (no npm/CI/script consumer). The historical output snapshot `docs/data/th-cite1-phase1-thesis-csl-parity-2026-08-17.json` remains in the repo as period evidence.

---

## 3. Retained public/internal contracts

Unchanged:

- `/data/theses.json` items[].citationApa — 169 items, byte-identical to baseline.
- JSON-LD `citation` property on all 169 thesis detail pages — byte-identical to baseline.
- `thesisDetail.citationApa` build model — same shape, same value.
- Collection item `data.citationApa` — same shape, same value (no template reads it after Phase 3, but retained for symmetry with other projections).
- `withCitation()` function — retained. Still attaches: `pageUrl`, `citationStyle: "APA 7"`, `researchLine`, `researchExcluded`, `researchThemes`, `researchAudience`, `featuredOn`, `researchPriority`, `researchSummary`. Only the citation derivation changed.
- Canonical Content v1 — unchanged.
- Public JSON does NOT expose `csl` — verified.
- `src/js/publication-citation.js` — unchanged.

---

## 4. Parity evidence

### citationApa (169 / 169 byte-identical)

Baseline captured on main `946f5532` (pre-repoint) at `docs/data/th-cite1-phase6-citationApa-baseline-2026-08-18.json` — 169 items keyed by OuluREPO URL.

Post-Phase-6 rebuild → compared against baseline → **169 / 169 identical, 0 differ**.

Sample:

```text
Riikonen, H. (2026). 6-luokkalaisten kokemuksia matematiikka-ahdistuksesta [Pro gradu -tutkielma, Oulun yliopisto]. https://oulurepo.oulu.fi/handle/10024/62699
```

### JSON-LD `citation` (169 / 169 match public JSON)

Corpus-level check reads every canonical detail page HTML, parses its `<script type="application/ld+json">` block, walks to `@type: "Thesis"` node, extracts `citation` property, and compares to the corresponding public JSON `citationApa`.

Result: **169 match, 0 mismatch, 0 absent.**

### Language rule (lang="fi")

Per Phase 6 language contract: `citationApa` uses `lang="fi"` regardless of thesis source language, page UI locale, or browser locale.

Reason:

- The pre-Phase-6 legacy composer emitted FI (hardcoded `"Oulun yliopisto"` + FI level labels).
- Phase 2 shared renderer with `lang="fi"` is byte-identical to the legacy output for all 169 canonical unique theses.
- Changing the language rule for `citationApa` would be a **public contract change** and is not in Phase 6 scope.

Template-level visible citation on the detail page remains independent (`{{ thesisDetail.csl | publicationCitation("apa", currentLang) }}`), so an English-source thesis still displays "Master's thesis, University of Oulu" on its detail page while its persisted `citationApa` remains the FI representation. This dual behaviour is intentional and matches Phase 3/4 design.

---

## 5. `withCitation()` retention rationale

`withCitation(thesis)` was NOT deleted. It does two logically-independent things:

1. Derive `citationApa` from thesis fields (Phase 6 target).
2. Attach curated research-program metadata (`researchLine`, `researchThemes`, `featuredOn`, `researchPriority`, `researchSummary`, `researchExcluded`, `researchAudience`) from `CURATED_THESIS_META`.

Task 1 was repointed to the shared renderer. Task 2 remains. Deleting `withCitation()` would strip research-program metadata attachment from ~169 thesis objects and break `researchLine` filtering, `researchThemes` badges, `featuredOn` chips, and `researchPriority` ordering across the site. Not a Phase 6 change.

---

## 6. Failure semantics

`citationApaFromCsl(thesis)` returns `""` when `buildThesisCslItem` returns null (missing id + title). This is a **controlled empty state**, matching the shared-renderer contract that Phase 2/4 established.

On the current production corpus (169 canonical unique theses) the empty path is not exercised — every canonical record has `title` + `authors` + `link`. Confirmed by post-Phase-6 corpus check: 169/169 items have non-empty `citationApa`.

Phase 6 does NOT introduce a fallback to raw-field composition. If shared renderer returns empty, the field is empty (same as pre-Phase-6 behaviour where the legacy composer would have produced `"(n.d.). ."` — the shape difference on truly-empty records is irrelevant to production data).

---

## 7. Duplicate handling

Raw source contains 170 records including one duplicate URL (`handle/10024/7879`) in `data.gradut`. `withCitation()` runs on all 170 raw records — both duplicate instances receive the SAME `citationApa` string (deterministic derivation on identical inputs).

Downstream dedup:

- `src/data/theses.json.11ty.js` — `seen.has(record.url)` → 169 items.
- `src/_data/thesisDetails.js#collectCanonicalTheses` — `seen.add(link)` → 169 items.
- `src/_utils/toThesesCollectionItems.js` — `seen.add(item.url)` → 169 items.

No leak of 170 into any public/build object. Verified via Phase 6 audit corpus check.

---

## 8. Test / audit matrix

### Unit tests

- Baseline: 527 / 527 pre-Phase-6.
- Post-Phase-6: **535 / 535** (+8 new `tests/unit/thesesWithCitation.test.js` covering shared-renderer derivation, language rule, missing authors → controlled fallback, deterministic behaviour, no legacy composer symbol leaks through module exports).

### Build

- `npm run build:no-og` — clean; 1472 pages; SEO dashboard `missingDescription=0 missingOgImage=0`.

### Audits

- `scripts/audit-th-cite1-phase3-ssr-archive.js` — **10 / 10 gates green** on clean rebuild.
- `scripts/audit-th-cite1-phase4c-browser-citation-deletion.js` — **38 / 38 gates green** (three server-side gates updated: `serverBuildApaCitationDeleted`, `serverGetThesisLevelLabelDeleted`, `serverWithCitationUsesSharedRenderer`).
- `scripts/audit-th-cite1-phase4-modal-export-parity.js` — **52 / 52 gates green** (three server-side gates updated to match Phase 6 architecture).
- `scripts/audit-th-cite1-phase6-legacy-server-citation-deletion.js` (new) — **18 / 18 gates green**. Covers: legacy composer + helper deletion, no live production calls anywhere in `src/`, `withCitation` retained and uses shared renderer + CSL adapter, `citationApa` language is FI, public JSON has 169 items with non-empty citation + no `csl`, citationApa parity vs baseline 169/169, JSON-LD citation present + byte-identical for all 169 details, corpus parity, no parallel server composer file introduced.

### Retired

- `scripts/audit-th-cite1-phase1-thesis-csl-parity.js` — DELETED. Tautological after Phase 6.

### Browser tests

- `tests/th-cite1-phase3-thesis-pagination.spec.js` — 8 / 8 pass.
- `tests/th-cite1-phase4b-thesis-detail-modal.spec.js` — 11 / 11 pass.
- `tests/th-cite1-phase4c-no-raw-field-fallback.spec.js` — 7 / 7 pass.
- `tests/f3a-theses-find-explore.spec.js` — 3 / 3 pass, 0 skips.
- `tests/f3b-publications-find-explore.spec.js` — 2 / 2 pass (documented Pagefind cold-start flake handled by `--retries=1`).
- `tests/pf-cite-modal-failure-path.spec.js` — 2 / 2 pass.
- `tests/accessibility.spec.js` + `tests/contrast.spec.js` + `tests/navigation.spec.js` — all green (+ 1 pre-existing unrelated flake in `navigation.spec.js "Search dialog focus trap"` — passes on retry).

**Bundle: 64 pass, 0 skips.**

---

## 9. Corpus parity

```text
canonical unique theses      : 169
public JSON items            : 169
FI SSR archive union         : 169 (via Phase 4D audit)
EN SSR archive union         : 169 (via Phase 4D audit)
Pagefind thesis fragments    : 169 (via Phase 4D audit)
citationApa parity           : 169 / 169 byte-identical
JSON-LD citation parity      : 169 / 169 byte-identical (matches public JSON citationApa)
```

---

## 10. Publication regression

- `src/js/publication-citation.js` — unchanged in Phase 6.
- `src/julkaisut.njk` publication modal wiring — untouched.
- `src/_data/researchfiContent.js` — untouched (was already using the shared renderer post-PUB-CITE1).
- Publication unit tests continue to pass (part of the 535 total).
- F3B publications Find & Explore browser regression: 2/2 pass.
- pf-cite-modal-failure-path: 2/2 pass.

No unexplained publication output change.

---

## 11. Accessibility / navigation

- `tests/accessibility.spec.js` — green.
- `tests/contrast.spec.js` — green.
- `tests/navigation.spec.js` — green (+ 1 pre-existing unrelated flake documented in earlier phases).

Phase 3 archive HTML unchanged; Phase 4B modal HTML unchanged; Phase 4C interaction wiring unchanged. No accessibility surface touched.

---

## 12. Explicit non-goals (preserved)

- **Phase 5 PF5 GLOBAL RESULT PARITY — NOT started.** Navbar Pagefind, `/haku/`, `/en/search/`, thesis Pagefind card layout, Pagefind meta/filter/fragment content all unchanged.
- **Canonical Content v1 — unchanged.**
- Presentations, Media — untouched.
- Publications citation architecture — untouched.

---

## 13. Post-closure sequence (not part of Phase 6)

Recommended (mirrors Phase 3 / Phase 4 pattern):

1. Open PR `feat/th-cite1-phase6-legacy-server-citation-deletion` → `main`.
2. Wait for CI (Build and Deploy, Accessibility and navigation tests, Generate OG Images).
3. Merge after all three green.
4. Fast-forward `main`; rerun Phase 6 audit + full regression on main HEAD.
5. Update roadmap `docs/find-explore-roadmap-2026-08-12.md` with a new status block:
   ```
   TH-CITE1 Phase 6 — legacy server citation deletion
   status: CLOSED / GREEN / MAIN
   ```
6. Flip this closure doc from `CLOSED / GREEN / BRANCH` → `CLOSED / GREEN / MAIN` in a separate docs PR.

END OF PHASE 6 CLOSURE.
