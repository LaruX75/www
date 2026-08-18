# TH-CITE1 Phase 4C — Delete legacy browser citation composition

Date: 2026-08-18

Repository: `LaruX75/www`

Branch: `feat/th-cite1-phase4a-shared-thesis-renderer` (Phase 4A + 4B + 4C share one branch)

Base commit (Phase 4B tip): `338b51545382c6050d624f03f0c657cd915f159a`

Phase 4C completes the browser-side deletion that Phase 4B's readiness noted was safe. After this commit, `src/js/thesis-hub-actions.js` contains zero bibliographic composers. The shared renderer `src/js/publication-citation.js` is the sole browser-side implementation for every thesis citation/export format.

## 1. Scope

- Delete all raw-field browser thesis composers.
- Delete abstract-modal DOM wiring (Phase 4B didn't restore the abstract modal; 4C removes the vestigial code).
- Delete no-CSL fallback branches in every action handler.
- Simplify the detail-page trigger payload to only `data-thesis-csl` + `data-thesis-lang`.
- Delete two orphan template files (`thesis-hub-modals.njk`, `thesis-table.njk`).
- Delete the one dead CSS rule tied to the removed table template.
- Add MIME types per download format.
- Add a hard static-deletion audit script + a browser regression test proving no raw-field fallback is possible.

Explicit non-goals (preserved for Phase 6):

- `src/_data/theses.js#buildApaCitation`, `#withCitation`, server `#getThesisLevelLabel` — retained; still populate `/data/theses.json.citationApa` and the JSON-LD `citation` property.
- `thesisDetail.citationApa`, collection-item `data.citationApa`, `/data/theses.json.citationApa`, JSON-LD `citation` — untouched.

Explicit non-goals (preserved for Phase 5):

- PF5 GLOBAL RESULT PARITY, navbar Pagefind, `/haku/`, `/en/search/`, Find & Explore result presenter — untouched.

## 2. Deleted browser composers

From `src/js/thesis-hub-actions.js`:

| Symbol | Fate |
|---|---|
| `getThesisLevelLabel(payload)` | DELETED |
| `buildThesisApa(payload)` | DELETED |
| `buildThesisMla(payload)` | DELETED |
| `buildThesisChicago(payload)` | DELETED |
| `buildThesisBibTeX(payload)` | DELETED |
| `buildThesisRis(payload)` | DELETED |
| `getCitationByFormat(payload, format)` | DELETED |
| `pickString(value)` | DELETED (only consumed by the deleted composers) |

Post-4C grep verification:

```text
src/js/thesis-hub-actions.js  buildThesisApa            0
src/js/thesis-hub-actions.js  buildThesisMla            0
src/js/thesis-hub-actions.js  buildThesisChicago        0
src/js/thesis-hub-actions.js  buildThesisBibTeX         0
src/js/thesis-hub-actions.js  buildThesisRis            0
src/js/thesis-hub-actions.js  getCitationByFormat       0
src/js/thesis-hub-actions.js  getThesisLevelLabel       0
```

Enforced by the new audit script `scripts/audit-th-cite1-phase4c-browser-citation-deletion.js` (see §7).

## 3. Deleted abstract-modal wiring

Removed from `src/js/thesis-hub-actions.js`:

- `const abstractModalEl / abstractTitleEl / abstractTextEl / abstractApaEl / abstractOpenEl / abstractExportBtn` DOM lookups.
- `function openAbstractModal(payload)`.
- `abstractExportBtn?.addEventListener("click", ...)` listener.
- The `[data-thesis-abstract-trigger]` branch inside the document-level click listener.
- The Phase 4B early-return comment that made abstract-modal wiring optional (no longer needed).

Post-4C grep verification: 0 occurrences of `thesisAbstractModal`, `openAbstractModal`, or `data-thesis-abstract-trigger` in `src/js/thesis-hub-actions.js`.

## 4. Deleted templates

- `src/_includes/thesis-hub-modals.njk` — the pre-4B two-modal bundle; superseded by `src/_includes/thesis-citation-modal.njk`. Zero remaining consumers.
- `src/_includes/thesis-table.njk` — orphaned since F3A + Phase 3. Zero remaining consumers.

## 5. Deleted dead CSS

`src/css/modules/_articles.css` line 2616:

```css
/* Piilotetaan "Vie viite" -nappi — tilaa otsikkosolun tekstille */
.pub-table .thesis-bib-btn { display: none !important; }
```

The `.thesis-bib-btn` class was defined only inside the just-deleted `thesis-table.njk` template. Rule removed with a small comment cleanup.

## 6. Simplified trigger payload

Before 4C (7 data attributes):

```text
data-thesis-csl
data-thesis-title
data-thesis-authors
data-thesis-year
data-thesis-type
data-thesis-url
data-thesis-lang
```

After 4C (2 data attributes):

```text
data-thesis-csl
data-thesis-lang
```

Rationale:

- `data-thesis-csl` carries the sole bibliographic source of truth (Phase 1 CSL projection).
- `data-thesis-lang` controls UI messaging (unavailable state, Copy label, filename inference).
- `data-thesis-title / authors / year / type / url` existed only to feed the deleted raw-field composers. Their only remaining role — download filename generation — now derives from `csl.title` / `csl.author[0].family` via a new `filenameBase(payload)` helper.

Verified in the built detail page (`/opinnaytteet/62699/`): the trigger fragment contains `data-thesis-csl` + `data-thesis-lang` and no `data-thesis-title / authors / year / type / url` attributes.

## 7. thesis-hub-actions.js responsibilities after cleanup

Pure interaction layer. The file now owns:

- Modal open/close.
- Focus return via `hidden.bs.modal` listener.
- Format selection change handler.
- `sharedCitation(payload, format)` — thin wrapper around `window.publicationCitation.buildCitation({csl, style, lang})`.
- `renderCitationPreview` — reads the format select, dispatches to `sharedCitation`, writes text to the preview textarea, disables buttons on empty renderer output.
- Clipboard copy handler with localised label + `execCommand("copy")` fallback.
- Download handler with format-appropriate MIME type + filename.
- `downloadRisFor(payload, filenameSuffix, button)` — reused by Zotero + Mendeley (identical RIS text, only filename suffix differs).
- `flashUnavailable(button, label)` — brief visual feedback when a CSL-bearing payload can't be rendered.
- `filenameBase(payload)` — new helper that derives a filename from `csl.title` / `csl.author[0].family` / literal `"citation"` fallback.
- `sanitizeFilenamePart` — retained; ASCII/diacritic sanitisation for filenames.

No bibliographic composition. No raw-field parallel content model. No abstract-modal wiring.

## 8. Raw-field citation fallback: removed

Every action handler had a branch that fell back to `getCitationByFormat(payload, format)` when the shared renderer returned empty. Those branches are gone. New rule:

- `sharedCitation.empty === true` → controlled unavailable state (`Lähdeviite ei saatavilla` / `Citation unavailable`) + disable Copy / Download / Zotero / Mendeley + optional `flashUnavailable` feedback on the button that was clicked.
- Missing / malformed / empty CSL → same path (all four cases return `{empty: true}` from `sharedCitation`).

Regression test: `tests/th-cite1-phase4c-no-raw-field-fallback.spec.js` (7 tests, 7 pass) explicitly injects synthetic triggers with:

1. missing `data-thesis-csl` (still with populated raw title/authors/year/type/url attributes)
2. malformed `data-thesis-csl` JSON
3. `data-thesis-csl="{}"` (empty CSL object)
4. CSL missing id + title but full genre/publisher/authors
5. same as #1 with `lang="en"`

Each asserts the modal shows the unavailable message + all four action buttons disabled + the preview contains NONE of the raw-field values (`Nuorten kokemuksia`, `Kurki, Suvi`, `2026`, `oulurepo.oulu.fi`). Also two static-inspection tests:

6. `/js/thesis-hub-actions.js` served to the browser contains 0 occurrences of any deleted symbol.
7. `/opinnaytteet/62699/` HTML: trigger has `data-thesis-csl` + `data-thesis-lang` and no `data-thesis-title / authors / year / type / url`.

## 9. MIME type decision

Downloads now use format-appropriate MIME:

| format | MIME |
|---|---|
| APA / MLA / Chicago | `text/plain;charset=utf-8` |
| BibTeX | `application/x-bibtex;charset=utf-8` |
| RIS (Copy / Download / Zotero / Mendeley) | `application/x-research-info-systems;charset=utf-8` |

Reference managers already accept `text/plain` for RIS + BibTeX historically — the change is additive and gives correct content-type to any downstream consumer that inspects it. No user-facing behaviour change; the file extension (`.bib` / `.ris`) remains the authoritative signal for browser handling. Reason for changing casually: Phase 4C was already rewriting the download path.

## 10. Static deletion audit

New: `scripts/audit-th-cite1-phase4c-browser-citation-deletion.js`. **37 hard gates, 37 pass**.

Gate summary:

- **7** — thesis-hub-actions.js has zero occurrences of each deleted composer + `getCitationByFormat` + `getThesisLevelLabel`.
- **8** — thesis-hub-actions.js has zero abstract-modal DOM lookups / handlers (`thesisAbstractModal`, `openAbstractModal`, `data-thesis-abstract-trigger`, etc.).
- **2** — orphan templates `thesis-hub-modals.njk` + `thesis-table.njk` do not exist.
- **2** — detail modal include `thesis-citation-modal.njk` exists and is included from `thesis-detail-body.njk`.
- **7** — detail trigger carries `data-thesis-csl` + `data-thesis-lang` and no `data-thesis-title / authors / year / type / url`.
- **1** — `publication-citation.js` loads BEFORE `thesis-hub-actions.js` on the thesis detail template.
- **4** — archive templates (FI + EN) do not `pageScripts`-load `thesis-hub-actions.js` and do not include the legacy modal template.
- **3** — built output check: detail page has trigger + citation modal + no abstract modal + loads both scripts. Archive HTML has no citation trigger / no modal / no abstract-modal / doesn't ship `thesis-hub-actions.js`.
- **3** — server-side Phase 6 formatter path retained (`buildApaCitation`, `withCitation`, server-side `getThesisLevelLabel` all still exist in `src/_data/theses.js`).

Audit output: `docs/data/th-cite1-phase4c-browser-citation-deletion-2026-08-18.json`.

## 11. Test results

- `node --test tests/unit/*.test.js` — **527 / 527 pass** (unchanged from Phase 4B baseline; Phase 4C is browser-only cleanup).
- `npm run build:no-og` — clean; 1472 pages; SEO dashboard `missingDescription=0 missingOgImage=0`.
- `node scripts/audit-th-cite1-phase1-thesis-csl-parity.js` — canonical 169, parity **169 / 169 IDENTICAL**.
- `node scripts/audit-th-cite1-phase3-ssr-archive.js` — **10 / 10 gates** on clean rebuild (documented intermittent Eleventy-cache flake still applies but passes on a fresh `rm -rf _site && npm run build:no-og`).
- `node scripts/audit-th-cite1-phase4c-browser-citation-deletion.js` — **37 / 37 gates** green.
- Playwright regression bundle (retries=1):
  - `tests/th-cite1-phase3-thesis-pagination.spec.js` — 8/8
  - `tests/th-cite1-phase4b-thesis-detail-modal.spec.js` — 11/11
  - `tests/th-cite1-phase4c-no-raw-field-fallback.spec.js` — **7/7 (new)**
  - `tests/f3a-theses-find-explore.spec.js` — 2/2 + 1 skip (unchanged — Phase 4D target)
  - `tests/f3b-publications-find-explore.spec.js` — 2/2 (Pagefind cold-start flake documented; retries handle it)
  - `tests/pf-cite-modal-failure-path.spec.js` — 2/2
  - `tests/accessibility.spec.js` + `tests/contrast.spec.js` + `tests/navigation.spec.js` — 27/27 + others
  - Bundle total: **63 pass + 1 skip / 0 fail**.

## 12. LOC / byte reduction

- `src/js/thesis-hub-actions.js`:
  - Before Phase 4C: **380 lines**, **15,139 bytes**.
  - After Phase 4C: **238 lines**, **9,421 bytes**.
  - Delta: **−142 lines, −5,718 bytes (−37.8 % file size)**.
- Deleted templates:
  - `src/_includes/thesis-hub-modals.njk` — 78 lines.
  - `src/_includes/thesis-table.njk` — inspected pre-delete at ~200 lines (dead since F3A).
- Deleted CSS: 2 lines from `src/css/modules/_articles.css`.
- Detail-page trigger data attributes reduced from 7 → 2.

JS payload on thesis detail page (`/opinnaytteet/{id}/`):

- Before 4C: `/js/thesis-hub-actions.js` = 15,139 B.
- After 4C: `/js/thesis-hub-actions.js` = 9,421 B.
- Net saving to each of 169 detail-page loads: **−5,718 B** ≈ **−5.6 KB** per page (before gzip).

Archive page payload: unchanged (archive does not load `/js/thesis-hub-actions.js` — Phase 4B removed it).

## 13. Retained Phase 6 legacy path

`src/_data/theses.js` unchanged:

- `getThesisLevelLabel(type)` — server-side genre label.
- `buildApaCitation(thesis)` — populates `thesis.citationApa`.
- `withCitation(thesis)` — wraps `buildApaCitation`.

Downstream consumers unchanged:

- `thesisDetail.citationApa` (build model) — still populated.
- Collection-item `data.citationApa` — still populated.
- Public `/data/theses.json.citationApa` — unchanged shape and bytes.
- JSON-LD `citation` property on thesis detail pages via `thesisSchemaCitation` computed field — unchanged.

Phase 4C did NOT close the citation architecture. It closed the **browser-side** citation architecture. Phase 6 will re-source `citationApa` from the shared renderer (CSL → publication-citation.js) and delete `buildApaCitation` from `src/_data/theses.js`.

## 14. Remaining Phase 4D work

- Rewrite the skipped test in `tests/f3a-theses-find-explore.spec.js` (the "FI theses curated cards preserve abstract and citation actions" test that was skipped at Phase 3 closure). Phase 4C's `tests/th-cite1-phase4c-no-raw-field-fallback.spec.js` + `tests/th-cite1-phase4b-thesis-detail-modal.spec.js` together already cover the essential post-Phase-4B modal behaviour. The remaining Phase 4D work is to formally delete the F3A skip and close its readiness note.
- Optional: retire the legacy `scripts/audit-theses-built-output.js` verification script that checks the pre-Phase-3 archive-card structure (`hasAbstractModal`, `hasAbstractTriggers`, `hasThesisHubScript`). It already reports `ok:false` on `main` and is not wired into CI or npm scripts. Flagged for Phase 4D cleanup.
- Roadmap + closure doc entry moving the whole TH-CITE1 Phase 4 workstream (A + B + C + D) from `BRANCH` to `MAIN` after PR.

## 15. Public-contract audit

Unchanged in Phase 4C:

- `/data/theses.json.citationApa` — same shape, same values (still populated by the server-side legacy path).
- JSON-LD `citation` property — unchanged.
- Canonical Content v1 — unchanged.
- Pagefind thesis-tagged fragments — 169, unchanged.
- Sitemap — landings present, 0 paginated URLs.
- Phase 1 canonical citation parity — 169/169 IDENTICAL.
- Phase 2 shared-renderer APA thesis output — unchanged.
- Phase 3 SSR archive — unchanged (bytes ≈ same; DOM structure identical; sitemap discipline preserved).

END OF PHASE 4C NOTE.
