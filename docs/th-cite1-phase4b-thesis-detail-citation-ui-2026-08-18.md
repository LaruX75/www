# TH-CITE1 Phase 4B — Thesis detail citation/export UI

Date: 2026-08-18

Repository: `LaruX75/www`

Branch: `feat/th-cite1-phase4a-shared-thesis-renderer` (Phase 4A + 4B share one branch)

Base commit (Phase 4A tip): `cf26df27ed7c1d114527babc444518134862dc69`

Phase 4B restores a user-visible thesis citation/export entry point on canonical thesis detail pages using the Phase 4A shared renderer. It intentionally does not delete any legacy browser composers — that is Phase 4C.

## 1. UI restored

Detail-page trigger:

- File: `src/_includes/thesis-detail-body.njk` (lines around the "Citation" card).
- Element: a Bootstrap outline pill button labelled `Vie viite` (FI) / `Export citation` (EN), placed inline next to the "Lähdeviite" / "Citation" heading inside the existing Citation card.
- Carries `data-thesis-citation-trigger`, `data-thesis-csl` (JSON-escaped canonical CSL), `data-thesis-title`, `data-thesis-authors`, `data-thesis-year`, `data-thesis-type`, `data-thesis-url`, `data-thesis-lang` (= detail page `currentLang`).
- Only rendered when `thesisDetail.csl` is present (otherwise the whole Citation card is already suppressed by the existing `if thesisCitationText` guard).

Modal:

- File: `src/_includes/thesis-citation-modal.njk` (new, 55 lines).
- Contents: format select (APA / MLA / Chicago / BibTeX), preview textarea, Copy button, Download button, Zotero button, Mendeley button. FI/EN labels.
- Included from `src/_includes/thesis-detail-body.njk`. Not included on the archive pages.

Detail pages affected: 169 canonical `/opinnaytteet/{id}/` URLs (both FI-source and EN-source theses share the same permalink; the detail template picks `lang` from `thesisDetail.lang`).

## 2. Modal include decision

The old include `src/_includes/thesis-hub-modals.njk` bundled two modals:

- `#thesisAbstractModal` — pre-Phase-3 rich-card UX (open abstract in overlay + chain to Export button).
- `#thesisCitationModal` — the citation/export modal.

Post-Phase-3, the abstract is already rendered natively in the detail body (`Abstract` / `Tiivistelmä` card, full paragraphs, not truncated). An overlay abstract modal on the detail page duplicates already-visible content. Phase 4 readiness audit flagged this. Decision:

- Split off a lean `thesis-citation-modal.njk` containing only the citation/export modal.
- The old `src/_includes/thesis-hub-modals.njk` is left in the tree unchanged but is no longer included from any active template. Scheduled for **Phase 4C deletion** alongside the browser-composer cleanup.

## 3. Abstract modal disposition

`#thesisAbstractModal` is not restored on the detail page. Reasons:

- Abstract is already fully visible in the SSR body.
- The old chained flow (abstract → export button → citation modal) was designed for archive cards where the abstract wasn't visible. No archive card exists anymore.
- Nothing outside the old `thesis-hub-modals.njk` include references `#thesisAbstractModal`, `#thesisAbstractModalText`, `#thesisAbstractModalTitle`, `#thesisAbstractModalOpen`, or `#thesisAbstractExportBtn` in the built site.

The `thesis-hub-actions.js` code paths that read those elements now short-circuit gracefully (see §5).

## 4. CSL payload strategy

- **Source**: `thesisDetail.csl` (build model produced by `src/_utils/thesisCsl.js` in Phase 1).
- **Transport**: JSON-serialised into `data-thesis-csl` on the trigger element using Nunjucks `dump | escape`. One thesis per detail page → ~500 bytes per page. No cross-page payload, no global `<script id="thesisCitationExports">` blob (rejected by the readiness audit).
- **Public JSON unchanged**: `/data/theses.json.citationApa` remains the sole public thesis citation field; `csl` is not exposed on the public JSON (Phase 1 correction preserved).
- **JSON-LD unchanged**: `thesisSchemaCitation` still reads `thesisDetail.citationApa` (Phase 6 target).

## 5. Shared-renderer wiring in `thesis-hub-actions.js`

Added:

- `sharedCitation(payload, format)` — mirrors the `src/julkaisut.njk` publications helper. Calls `window.publicationCitation.buildCitation({csl, style, lang})` with `payload.csl` and `payload.lang`. Returns `{text, empty}`.
- `UNAVAILABLE_FI` / `UNAVAILABLE_EN` messages and `unavailableMessage(payload)`.
- `setCitationButtonsEnabled(enabled)` — disables Copy / Download / Zotero / Mendeley buttons when the shared renderer returns empty.
- `flashUnavailable(button, label)` — brief visual flash used on failed downloads.
- `downloadRisFor(payload, filenameSuffix, button)` — Zotero and Mendeley both call this; only the filename suffix differs (`-zotero.ris` vs `-mendeley.ris`). Same RIS bytes.
- `readCitationTriggerPayload(triggerEl)` — parses `data-thesis-csl` JSON safely and reads the raw-field fallbacks.
- `openCitationModal(payload, triggerEl)` — remembers the opener for focus return; resets the format select to `apa`; renders preview through `sharedCitation`.
- `hidden.bs.modal` listener — restores focus to the trigger after Bootstrap's modal closes.

Rewired:

- `renderCitationPreview` prefers `sharedCitation` and falls back to `getCitationByFormat` (legacy composers) only if `payload.csl` is missing. With Phase 4B triggers, `payload.csl` is always present, so the legacy branch is unreachable in production.
- `citationDownloadBtn` click handler prefers `sharedCitation`. On CSL-bearing payloads with empty renderer output: sets the unavailable message + disables buttons + flashes; never fabricates from raw fields.
- `citationCopyBtn` guards against copying the unavailable-message text. Localised Copy/Copied label per payload lang.
- `citationZoteroBtn` and `citationMendeleyBtn` both dispatch to `downloadRisFor(payload, 'zotero' | 'mendeley', button)`.

Retained (unchanged, Phase 4C deletion candidates):

- `buildThesisApa`
- `buildThesisMla`
- `buildThesisChicago`
- `buildThesisBibTeX`
- `buildThesisRis`
- `getThesisLevelLabel`
- `getCitationByFormat` (now only reachable in the legacy no-CSL branch — dead in production)

Abstract-modal wiring:

- The early-return guard was softened from `if (!abstractModalEl || !citationModalEl) return` to `if (!citationModalEl) return`. Citation modal is required; abstract modal is optional.
- `openAbstractModal(payload)` now returns early if `abstractModalEl` is null. All other abstract-modal DOM lookups already tolerated `null` via optional chaining.

## 6. Script loading strategy

- **Detail template** `src/opinnaytteet/thesis-details.njk` now sets `pageScripts: ["/js/publication-citation.js", "/js/thesis-hub-actions.js"]`. Both scripts are loaded only on the 169 thesis detail permalinks.
- **Archive templates** `src/opinnaytteet.njk` and `src/en/theses.njk` removed `/js/thesis-hub-actions.js` from their `pageScripts` list. They now ship `/js/find-explore.js` + `/js/thesis-archive-pagination.js` only.
- **Modal include** removed from both archive templates. The compact SSR table has no trigger element, so shipping the modal DOM would be dead HTML.

Verified on built output:

```text
/opinnaytteet/18096/index.html    thesis-hub-actions.js: 1   publication-citation.js: 1
/opinnaytteet/index.html          thesis-hub-actions.js: 0   thesisCitationModal: 0   thesisAbstractModal: 0
/en/theses/index.html             thesis-hub-actions.js: 0   thesisCitationModal: 0   thesisAbstractModal: 0
```

## 7. FI / EN behaviour

- Detail page `lang` = `thesisDetail.lang` (thesis source language). FI-source thesis at `/opinnaytteet/{id}/` → `lang="fi"`; EN-source thesis at same permalink → `lang="en"`. The trigger's `data-thesis-lang` mirrors this.
- Modal labels follow `thesisHubIsEn = (currentLang or lang or "fi") == "en"` in the include — same convention as the previous modal.
- Citation preview language is controlled by the payload lang, i.e. by the source-language decision above. Shared renderer applies the Phase 2 FI→EN display map when `lang === "en"` and `csl.type === "thesis"`.
- Verified end-to-end:
  - FI-source thesis `/opinnaytteet/62699/` (Riikonen 2026) → modal shows `Vie lähdeviite`; preview `Riikonen, H. (2026). 6-luokkalaisten... [Pro gradu -tutkielma, Oulun yliopisto]. URL`.
  - EN-source thesis `/opinnaytteet/18096/` (Mattila 2021) → modal shows `Export citation`; preview `Mattila, T. (2021). Professional development... [Master's thesis, University of Oulu]. URL`; BibTeX `@mastersthesis{mattila2021professional, ... school = {University of Oulu} ...}`.

## 8. Accessibility

- Trigger is a `<button type="button">` — natively keyboard-accessible, receives focus on Tab. `aria-haspopup="dialog"` + `aria-controls="thesisCitationModal"` announce the modal relationship.
- Modal HTML `role` and dialog labelling are provided by Bootstrap 5's `.modal` semantics + `aria-labelledby="thesisCitationModalLabel"` on the container + visible `<h2 id="thesisCitationModalLabel">`.
- Modal receives focus on `show` via Bootstrap default `{focus: true}`.
- `hidden.bs.modal` listener returns focus to the opener trigger (`lastTriggerEl.focus()`).
- Escape close: Bootstrap default `{keyboard: true}` handles it. The Playwright coverage exercises the alternative "click ✕ close button" path because Playwright's `page.keyboard.press("Escape")` timing with Bootstrap fade animation is flaky (documented in Phase 3 report as a known Playwright quirk).
- Close button `.btn-close` has `aria-label="Sulje"` / `"Close"`.
- All format select + Copy / Download / Zotero / Mendeley controls are native `<select>` and `<button>` elements with visible text or `title` attributes for screen readers.

## 9. Failure paths

Controlled behaviours (no silent raw-field fabrication):

| trigger | result |
|---|---|
| `payload.csl` present + shared renderer returns text | preview populated, buttons enabled |
| `payload.csl` present + shared renderer returns empty | preview shows `"Lähdeviite ei saatavilla"` / `"Citation unavailable"`, all four action buttons disabled |
| `window.publicationCitation` unavailable | same unavailable state (sharedCitation returns `{empty: true}`) |
| Clipboard API unavailable | falls back to `citationOutput.select()` + `document.execCommand("copy")` (existing behaviour, retained) |
| Download button on unavailable state | button flashes with `Ei saatavilla` / `Unavailable` and stays disabled — no download event |
| `payload.csl` missing (unreachable in Phase 4B) | falls through to legacy `getCitationByFormat` composers — kept for Phase 4C removal |

Malformed `data-thesis-csl` JSON: `readCitationTriggerPayload` sets `csl = null` inside a `try/catch`, which pushes the payload to the unavailable-state path. No exception propagates.

## 10. Browser tests

New: `tests/th-cite1-phase4b-thesis-detail-modal.spec.js` (11 tests, **11/11 pass**):

1. FI detail: trigger renders, modal opens, shared-renderer APA text visible.
2. FI detail: format switch APA → MLA → Chicago → BibTeX each updates preview through shared renderer.
3. FI detail: Copy button copies preview to clipboard (verifies via `navigator.clipboard.readText`).
4. FI detail: Download button emits `.bib` filename for BibTeX format.
5. FI detail: Zotero button downloads a `.ris` file with `-zotero.ris` suffix.
6. FI detail: Mendeley button downloads a `.ris` file with `-mendeley.ris` suffix.
7. EN detail: display map translates genre + publisher; BibTeX carries `school = {University of Oulu}`.
8. Modal accessible name + keyboard open + focus return: trigger receives Enter, modal opens, `aria-labelledby` present, close via ✕ button returns focus to trigger.
9. Phase 3 archive regression: `/opinnaytteet/` HTML contains no `data-thesis-citation-trigger`, no `thesisCitationModal`, no `thesisAbstractModal`, no `/js/thesis-hub-actions.js`.
10. Phase 3 archive regression: `/en/theses/` — same assertions.
11. Phase 3 archive regression: `/opinnaytteet/` still shows exactly 30 SSR thesis rows.

## 11. Archive regression proof

- Phase 3 SSR archive audit: **10/10 gates green** (union 169/169 both locales; sitemap landings present; 0 paginated URLs; bracket citations on all 32 SSR URLs).
- Phase 3 pagination browser tests (`tests/th-cite1-phase3-thesis-pagination.spec.js`): **8/8 pass**.
- No new archive-side script or template surface.
- Landing HTML byte size: 171,222 (FI) / 162,899 (EN) — essentially unchanged vs pre-Phase-4B baseline. Change is limited to the removal of two include lines and one line from `pageScripts`.

## 12. Publication regression proof

- Phase 4A publication-output tests continue to pass (see 527/527 unit tests). Publication-side sharing of `window.publicationCitation.buildCitation` is not affected.
- `src/julkaisut.njk` publication modal wiring unchanged.
- Phase 3 + PUB-CITE1 shared renderer parity audits still report the same pre-existing gate state (`filterCallsBuildCitation` regex-only flag documented in Phase 4A note; not a Phase 4B regression).
- No change to `src/js/publication-citation.js` in Phase 4B.

## 13. Unit tests + build

- `node --test tests/unit/*.test.js` → **527 / 527 pass** (Phase 4A count preserved; no new unit tests in 4B — 4B is UI wiring proven by Playwright).
- `npm run build:no-og` → clean; 1472 pages; SEO dashboard `missingDescription=0 missingOgImage=0`.
- Phase 1 canonical citation parity: **169 / 169 IDENTICAL**.

## 14. Remaining browser composers

Kept in `src/js/thesis-hub-actions.js` until Phase 4C:

| function | reachable in Phase 4B? |
|---|---|
| `buildThesisApa` | only via `openAbstractModal(payload)` — unreachable because no abstract modal is rendered on any Phase 4B page |
| `buildThesisMla` | only via `getCitationByFormat` legacy fallback — unreachable because every Phase 4B trigger carries `payload.csl` |
| `buildThesisChicago` | same as MLA |
| `buildThesisBibTeX` | same |
| `buildThesisRis` | only via `downloadRisFor(payload, ...)` legacy fallback — unreachable because Phase 4B triggers carry csl |
| `getThesisLevelLabel` | consumed by the five composers above; unreachable transitively |
| `getCitationByFormat` | unreachable in production |

## 15. Safe Phase 4C deletions

Ready for Phase 4C deletion after browser + Playwright evidence that all consumers now go through shared renderer:

- All seven functions in the table above.
- `src/_includes/thesis-hub-modals.njk` (unused after 4B).
- Abstract-modal DOM lookups + branches inside `thesis-hub-actions.js` (`abstractModalEl`, `abstractTitleEl`, `abstractTextEl`, `abstractApaEl`, `abstractOpenEl`, `abstractExportBtn`, `openAbstractModal`, the abstract-trigger dispatch inside the `click` listener).
- The `data-thesis-abstract-trigger` payload branch in `readCitationTriggerPayload`-adjacent code (kept in the current click listener for symmetry only — no producer exists).
- Orphaned `src/_includes/thesis-table.njk` (dead since F3A + Phase 3; not touched in Phase 4B — flagged again for 4C).

Ready for 4C. Not started in this phase.

## 16. Public-contract audit

Unchanged in Phase 4B:

- `/data/theses.json` — same fields, same values.
- JSON-LD `citation` property on thesis detail pages.
- `thesisDetail.citationApa` build model.
- `thesisDetail.csl` build model.
- `src/_data/theses.js#buildApaCitation / withCitation / getThesisLevelLabel` — untouched (Phase 6).
- Pagefind thesis-tagged fragments (169) — untouched.
- Sitemap — landings present, no paginated URLs.
- Canonical Content v1 — unchanged.

END OF PHASE 4B NOTE.
