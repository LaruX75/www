# TH-CITE1 Phase 4 — Thesis modal / export migration readiness audit

Date: 2026-08-18

Repository: `LaruX75/www`

Branch at audit time: `audit/th-cite1-phase4-modal-export-readiness`

Verified `main` HEAD at audit time: `e26bc8a1f3f00b5c3b2fda3b18386f5098c17f92`

Post-Phase-3 workstream status:

```text
TH-CITE1 Phase 1  DONE
TH-CITE1 Phase 2  DONE
TH-CITE1 Phase 3  CLOSED / GREEN / MAIN
TH-CITE1 Phase 4  NOT STARTED  ← this audit
TH-CITE1 Phase 5  NOT STARTED
TH-CITE1 Phase 6  NOT STARTED
```

Scope of this audit: read-only readiness assessment for Phase 4 (thesis modal / export migration). No implementation. Ends with a phased Phase 4 plan and a `READY / READY WITH CONDITIONS / BLOCKED` decision.

Out of scope for this audit:

- Phase 5 PF5 GLOBAL RESULT PARITY
- Phase 6 legacy build-time formatter deletion (`src/_data/theses.js#buildApaCitation` etc.)
- Any Presentations-domain work
- Any Canonical Content v1 change
- Any change to the `/data/theses.json` public contract

---

## 1. Verified dataflow after Phase 3

```text
canonical thesis (OuluREPO fetch → src/_data/theses.js)
   │
   ├─ withCitation()   ── legacy path, still populates public citationApa
   │    └─ buildApaCitation()      ← Phase 6 removal target
   │
   └─ buildThesisCslItem() (Phase 1)
        └─ internal CSL
             ├─ thesisDetail.csl          (SSR templates)
             ├─ collection item data.csl  (Eleventy collections)
             └─ shared renderer publicationCitation.buildCitation({csl, style, lang})
                  └─ Nunjucks filter `publicationCitation`
                       ├─ thesis-detail-body.njk (Phase 3 migrated)
                       └─ thesis-archive-table.njk (Phase 3)
```

Not yet on the CSL → shared renderer path:

- **Browser thesis citation modal + export composers** (`src/js/thesis-hub-actions.js`) — still compose citations from raw fields.
- **JSON-LD `citation` property** on thesis detail pages — still reads `thesisDetail.citationApa` via `thesisSchemaCitation` computed. (Phase 6 target; not Phase 4.)
- **Public `/data/theses.json.citationApa`** — still populated by `buildApaCitation`. (Phase 6 target.)

---

## 2. Consumer inventory

### 2.1 Thesis citation surfaces (SSR)

| Surface | File | Line | Source |
|---|---|---|---|
| Archive compact table citation | `src/_includes/thesis-archive-table.njk` | 77 | `thesis.csl \| publicationCitation("apa", thesisSectionLang)` |
| Detail page citation card | `src/_includes/thesis-detail-body.njk` | 46 | `thesisDetail.csl \| publicationCitation("apa", currentLang)` |
| JSON-LD `citation` property | `src/opinnaytteet/thesis-details.njk` + `src/_includes/_ldschema.njk:238` | | `thesisDetail.citationApa` (legacy string) |
| Public JSON `citationApa` field | `src/data/theses.json.11ty.js:98` | | `pickString(t?.citationApa)` (legacy string) |

Only the JSON-LD path and the public JSON still route through the legacy `citationApa` field. Both are **Phase 6** targets, not Phase 4.

### 2.2 Modal / export UI

| Component | File | Status after Phase 3 |
|---|---|---|
| Modal templates | `src/_includes/thesis-hub-modals.njk` (78 lines, 2 modals) | Included by `src/opinnaytteet.njk` and `src/en/theses.njk`; **not** included by `src/_includes/thesis-detail-body.njk` |
| Browser interaction + composers | `src/js/thesis-hub-actions.js` (239 lines) | Loaded on `/opinnaytteet/` and `/en/theses/`; **not loaded** on thesis detail pages |
| `[data-thesis-abstract-trigger]` | Was on rich curated card | **Removed** by Phase 3 compact-table redesign — no producer in current templates |
| `[data-thesis-citation-trigger]` | Was on rich curated card | **Removed** by Phase 3 — no producer in current templates |
| `.thesis-bib-btn` class hooks | `src/_includes/thesis-table.njk` (dead include) | Dead code — the include has no callers |
| Modal `#thesisAbstractModal` + `#thesisCitationModal` | `thesis-hub-modals.njk` | Present in DOM but **unreachable** from the current archive UI |

**Consequence:** The Phase 3 archive has functioning SSR citations (bracket APA 7, FI/EN aware) but no way for a visitor to open the abstract modal, copy a citation, download BibTeX/RIS, or hand off to Zotero/Mendeley. The modal HTML ships with the page but is inert. This is the user-facing regression Phase 4 must resolve.

### 2.3 Server-side thesis citation code

| Component | File / line | Purpose | Phase |
|---|---|---|---|
| `getThesisLevelLabel(type)` | `src/_data/theses.js:67` | Genre label for legacy formatter | Phase 6 |
| `buildApaCitation(thesis)` | `src/_data/theses.js:77` | Populates `thesis.citationApa` | Phase 6 |
| `withCitation(thesis)` | `src/_data/theses.js:91` | Wraps `buildApaCitation` | Phase 6 |
| `buildThesisCslItem(input)` | `src/_utils/thesisCsl.js` | Phase 1 CSL adapter | KEEP |
| Nunjucks `publicationCitation` filter | `eleventy.filters.js:1449` | Shared renderer entrypoint | KEEP |

### 2.4 Tests + audits

| Test / audit | File | Relevance |
|---|---|---|
| Thesis CSL unit | `tests/unit/thesisCsl.test.js` | Phase 1 renderer contract |
| publicationCitation unit | `tests/unit/publicationCitation.test.js` | Phase 2 thesis APA branch + FI/EN map |
| Phase 1 citation parity | `scripts/audit-th-cite1-phase1-thesis-csl-parity.js` | 169/169 IDENTICAL on canonical unique |
| Phase 3 SSR archive audit | `scripts/audit-th-cite1-phase3-ssr-archive.js` | 10/10 gates |
| Phase 3 pagination browser | `tests/th-cite1-phase3-thesis-pagination.spec.js` | 8/8 |
| **F3A theses Find & Explore** | `tests/f3a-theses-find-explore.spec.js` | 2 pass + **1 test.skip** — Phase 4 target (see §7) |
| Legacy-citation deletion readiness | `scripts/audit-pub-cite1-phase4-legacy-citation-deletion-readiness.js:199-204` | Already grep-detects `buildThesisApa` — useful for Phase 4 exit gate |

---

## 3. Browser-side thesis citation composer inventory

Every composer lives in `src/js/thesis-hub-actions.js`. Signature is the same for all: input is a `payload` object with plain strings (`title`, `authors`, `year`, `type`, `url`, sometimes `abstract`) — no CSL, no language.

| Fn | Lines | Output shape | Consumer | Language | Escaping |
|---|---|---|---|---|---|
| `getThesisLevelLabel(payload)` | 49–53 | `"Master's thesis" / "Bachelor's thesis" / "Thesis"` — **EN hardcoded** | All composers below | EN only, no FI branch | none |
| `buildThesisApa(payload)` | 55–64 | `Authors (Year). Title [Level, University of Oulu]. URL.` — bracket format, EN institution hardcoded | Abstract modal preview, citation-modal preview, download `.txt` | EN only | trim only |
| `buildThesisMla(payload)` | 66–77 | `Authors. "Title." Level, University of Oulu, Year. URL.` | Modal preview + download `.txt` | EN only | trim only |
| `buildThesisChicago(payload)` | 79–88 | `Authors. Year. "Title." Level, University of Oulu. URL.` | Modal preview + download `.txt` | EN only | trim only |
| `buildThesisBibTeX(payload)` | 90–117 | `@mastersthesis{key, ...}` for `type==="masterThesis"`; `@misc{...}` otherwise. Fields: `title`, `author`, `year`, `school = {University of Oulu}`, `note = {Bachelor's thesis}` (bachelor only), `url`. Human-readable citation key `${lastname}${year}${firstword}` | Modal preview + download `.bib` | EN only; `bachelorThesis` → `note` field | `title.replace(/[{}]/g, "")` |
| `buildThesisRis(payload)` | 119–137 | `TY - THES / AU - / PY - / TI - / PB - University of Oulu / M3 - Level / UR - / ER -` | Modal preview via `getCitationByFormat` (currently NOT selectable), Zotero download `.ris`, Mendeley download `.ris` | EN only, `M3 -` uses EN genre | none; semicolon-split authors |
| `getCitationByFormat(payload, fmt)` | 139–144 | Dispatches to apa/mla/chicago/bibtex; RIS falls through to BibTeX (bug — no `ris` case) | Modal preview + download | EN only | — |

**Download implementation** (line 38): `Blob([content], {type: "text/plain;charset=utf-8"})`. Same MIME type for `.txt`, `.bib`, `.ris` — technically wrong for BibTeX (`application/x-bibtex`) and RIS (`application/x-research-info-systems`), but broadly compatible.

**Filename generation** (line 28): `sanitizeFilenamePart(title || authors || "citation")` — lowercases, strips diacritics, ASCII-only, ≤60 chars.

**Fallback authors** in BibTeX (line 92): `payload.authors || "Laru, Jari"` — this fabricates authorship if none is present. Regression risk; must not survive Phase 4.

**Zotero + Mendeley** (lines 228–238): both dispatch to `downloadTextFile(base + ".ris", buildThesisRis(payload) + "\n")` — identical RIS output; only intent (which target) differs, not the file content.

**Copy** (lines 214–226): `navigator.clipboard.writeText`, fallback to `document.execCommand("copy")` after `select()`. Reasonable.

---

## 4. Shared renderer thesis capability matrix

Verified by direct Node invocation of `publicationCitation.buildCitation({csl, style, lang})` on a real thesis CSL (2-author Finnish master's thesis, Kurki & Komulainen, 2026, `/handle/10024/63000`).

| Format | Shared renderer output — thesis-branch behaviour | Usable? | Regression vs browser composer |
|---|---|---|---|
| **APA** (`lang="fi"`) | `Kurki, S., & Komulainen, A. (2026). ... [Pro gradu -tutkielma, Oulun yliopisto]. URL` | **Yes — better than browser** | None (matches Phase 2 SSR contract; browser was EN-only) |
| **APA** (`lang="en"`) | `... [Master's thesis, University of Oulu]. URL` | **Yes** | None (FI→EN display map from Phase 2) |
| **MLA** | Generic book-style output; no thesis-genre label | Partial | **Regression**: browser MLA includes `Level, University of Oulu` — shared MLA omits both |
| **Chicago** | Generic output; no thesis-genre label | Partial | **Regression**: same as MLA |
| **BibTeX** | `@phdthesis{keyhash, ... publisher = {Oulun yliopisto}, url = {...} }` — always `@phdthesis`, uses `publisher =` | **No** — two regressions | **Regression 1**: master's theses should be `@mastersthesis` not `@phdthesis`. **Regression 2**: BibTeX convention for `@mastersthesis` / `@phdthesis` is `school =`, not `publisher =`. Also citation key is an opaque hash — browser produces human-readable `${lastname}${year}${firstword}`. |
| **RIS** | `TY - THES / AU / PY / TI / PB / UR / ER` | Partial | **Regression**: browser adds `M3 - Master's thesis` (thesis-level tag). Zotero and Mendeley both consume `M3` as thesis type. |

**Consequence:** the shared renderer is currently only complete for APA-thesis. Phase 4 needs a small controlled shared-renderer extension (call it **Phase 4A**) before removing browser composers, otherwise MLA / Chicago / BibTeX / RIS output regresses when the modal is migrated.

Shared extension surface (minimal):

- `apa`: no change (Phase 2 already correct).
- `mla` thesis-branch: emit `Level, University of Oulu, Year. URL.` after title, using the same FI/EN display map when `lang="en"`.
- `chicago` thesis-branch: emit `Level, University of Oulu. URL.` after title/year, same display map.
- `bibtex` thesis-branch: pick entry type from `csl.genre`:
  - `Pro gradu -tutkielma` / `Master's thesis` → `@mastersthesis`
  - `Väitöskirja` / `Doctoral dissertation` → `@phdthesis`
  - `Lisensiaatintutkielma` / `Licentiate thesis` → `@phdthesis` (closest BibTeX equivalent)
  - `Kandidaatintutkielma` / `Bachelor's thesis` → `@misc` with `note = {Bachelor's thesis}` (BibTeX has no `@bachelorsthesis`)
  - fallback → `@phdthesis`
  Use `school = {publisher}` instead of `publisher =` for all `@mastersthesis`/`@phdthesis`. Consider a human-readable citation key policy shared with publications, or an explicit `csl["citation-key"]` field.
- `ris` thesis-branch: add `M3 - <genre display>` line for `type=thesis`.

All extensions are additive — publications behaviour is unaffected because the branches only fire when `csl.type === "thesis"`.

---

## 5. Zotero + Mendeley semantics

Both buttons currently do the same thing: **client-side RIS Blob download with `.ris` extension**. Semantics per current browser code:

- No handoff URL, no external service call, no clipboard.
- File name: `sanitize(title || authors || "citation") + ".ris"` — identical between Zotero and Mendeley.
- MIME: `text/plain;charset=utf-8` (browser code uses the same helper for `.txt`, `.bib`, `.ris`).
- Line endings: `\n` (Unix). Zotero and Mendeley both accept.
- Character set: UTF-8, no BOM. Both consumers OK.
- Authors: semicolon-split, one `AU` line per author.
- Genre / thesis level: exposed as `M3 - <English level>` (Master's/Bachelor's/Thesis).
- Publisher: hardcoded `PB - University of Oulu`.
- Language / thesis source language: **not represented** in RIS output.
- Citation key: not applicable to RIS.

Phase 4 migration preserving semantics requires:

- Shared-renderer RIS `M3` field for `type=thesis` (see §4).
- Same `.ris` filename convention.
- Same "downloads the RIS regardless of target selection" behaviour — Zotero and Mendeley emit identical files, only telemetry/UX intent differs (mirrors current publications-side pattern from `src/julkaisut.njk#downloadRisFor`).

No handoff URLs are used. If future work wants a true Zotero deep-link (`chrome-extension://…`), that is a separate UX proposal, not Phase 4.

---

## 6. FI / EN / thesis-language semantics

Distinctions to preserve:

- **UI locale**: `/opinnaytteet/` = `lang="fi"`, `/en/theses/` = `lang="en"`. Modal labels + button text follow UI locale (`thesisHubIsEn = (lang or "fi") == "en"` in `thesis-hub-modals.njk`).
- **Thesis source language**: `thesis.language` in raw data → `thesisDetail.lang` in build model → `csl.language` in CSL. Values: `fi` / `en` / (rare) `sv`.
- **Citation display language**: current Phase 2 rule — shared renderer applies FI→EN display map ONLY when `style="apa"` AND `csl.type="thesis"` AND `lang="en"`. Explicitly independent of `csl.language`.

Current Phase 3 render (verified):

- Archive `/opinnaytteet/` renders every row with `lang="fi"` → all citations in FI display (Pro gradu -tutkielma, Oulun yliopisto).
- Archive `/en/theses/` renders every row with `lang="en"` → all citations in EN display (Master's thesis, University of Oulu).
- Detail page `/opinnaytteet/{id}/` renders with `currentLang = lang or "fi"` where `lang` is `thesisDetail.lang` (thesis source language). So an English-source thesis at a Finnish-URL detail page renders in EN display, a Finnish-source thesis at same-URL renders in FI display. This is a subtle Phase 2 design choice already validated against the parity audit.

Phase 4 preserves this: the modal payload should pass the **page's current UI `lang`** into shared renderer for the citation preview (matches surrounding page copy). Download filenames may retain page language semantics. No new language logic is proposed.

**RIS + BibTeX language:**

- Neither current browser composer nor current shared renderer emits an `LA -` / `language =` field. Adding one is optional and low-priority; recommend not adding in Phase 4 to keep the migration minimal.

---

## 7. Skipped F3A test — exact disposition

File: `tests/f3a-theses-find-explore.spec.js`. Lines 26–33:

```js
test.skip("FI theses curated cards preserve abstract and citation actions", async ({ page }) => {
  // TH-CITE1 Phase 3: the archive migrated from a rich curated card
  // grid to a compact SSR table (Year | Citation | Open). The
  // abstract + citation-export modal triggers live on the thesis
  // detail page in the Phase 3 layout, and browser-side citation
  // composition is a Phase 4 target for shared-renderer migration.
  // Re-enable this test after Phase 4 migrates the modal actions.
});
```

Original assertions (git-recovered from pre-Phase-3 body, prior to the skip):

1. Click first `[data-thesis-abstract-trigger]` on archive.
2. Expect `#thesisAbstractModal` to have class `show`.
3. Expect `#thesisAbstractModalTitle` text non-empty.
4. Click `#thesisAbstractExportBtn`.
5. Expect `#thesisCitationModal` to have class `show`.
6. Expect `#thesisCitationOutput` value non-empty.

Every DOM hook the old test relied on either no longer exists on the archive (`[data-thesis-abstract-trigger]`) or is unreachable from the archive after Phase 3 (`#thesisAbstractModal` is present in DOM but no trigger opens it).

**Phase 4 recommendation:** rewrite this test to target a **thesis detail page** (`/opinnaytteet/{id}/` for a real thesis in the fixture). Assertions after Phase 4:

- Navigate to `/opinnaytteet/62699/` (or any known-good real thesis).
- Click the citation-export trigger (Phase 4B introduces this on the detail page).
- Expect `#thesisCitationModal` to show.
- Expect `#thesisCitationOutput` value non-empty AND matching APA 7 bracket format `[Pro gradu -tutkielma, Oulun yliopisto].` for a FI-source thesis (proves shared renderer path).
- Switch format select to BibTeX; expect output beginning with `@mastersthesis{` for a masters thesis.
- Click Copy; expect clipboard content matches preview.
- Click Zotero (or Mendeley) button; expect download event with `.ris` filename.
- Verify same on `/en/theses/` detail equivalent (or at least confirm EN display map on an EN-source thesis).

If the abstract modal is not restored (abstract is already fully visible on the detail page), delete assertions 1–3 and drop the abstract-trigger part of the test. Recommended.

**Do not leave the skip in place after Phase 4 closure.** The rewritten test becomes a required Phase 4 exit gate.

---

## 8. Failure paths — current + required

Current browser behaviour on missing / broken inputs:

| Failure | Current browser behaviour | Phase 4 target |
|---|---|---|
| CSL missing on payload | N/A (browser reads raw fields, not CSL) | Return `{empty: true}`; show `UNAVAILABLE_MESSAGE`; disable action buttons (mirror `src/julkaisut.njk#sharedCitation`) |
| Title missing | Filename falls back to `authors` or `"citation"`; composers emit empty title | Empty CSL → unavailable state |
| Author missing | BibTeX composes `Laru, Jari` fallback (**silent fabrication — regression risk**) | No fabrication. Shared renderer emits `"Tuntematon tekijä"` (existing Phase 2 behaviour) |
| Year missing | `"n.d."` in APA / Chicago; empty elsewhere | Shared renderer already emits `"n.d."` in APA |
| Publisher / university missing | Hardcoded `"University of Oulu"` in every composer | Omit publisher when `csl.publisher` empty; use shared renderer's genre-only bracket |
| URL missing | Omitted from output | Same |
| Type missing / unknown | Falls back to `"Thesis"` | Shared renderer already emits `"Opinnäyte"` / `"Thesis"` fallback |
| `navigator.clipboard` unavailable | Falls back to `execCommand("copy")` after `select()` | Keep pattern |
| Blob download fails | Silent (no user feedback) | Add unavailable state + `flashUnavailable` UI |
| Bootstrap Modal unavailable | Early return at file top (nothing opens) | Same |
| JavaScript disabled | Modal / export unavailable — user still reads the SSR citation on the detail card | Acceptable degradation (matches Phase 3 archive design) |

**Hard rule for Phase 4:** never silently fall back from shared renderer to raw-field composition. Either shared-renderer output or explicit unavailable state.

---

## 9. Public contract inventory

| Surface | Classification | Phase-4 action | Phase-6 action |
|---|---|---|---|
| `/data/theses.json` field `citationApa` | **PUBLIC CONTRACT** | **Preserve unchanged** | Re-source from shared renderer, then delete `buildApaCitation` |
| JSON-LD `citation` property on thesis detail (`_ldschema.njk:238` via `thesisSchemaCitation`) | **PUBLIC** (schema.org) | Preserve unchanged | Re-source |
| `thesisDetail.citationApa` (build model) | INTERNAL | No touch (only JSON-LD consumer remains) | Removed with `buildApaCitation` |
| `thesisDetail.csl` (build model) | INTERNAL | Consumed by Phase 4 modal payload | Keep — this is the Phase 2 primary source |
| `collection item data.csl` | INTERNAL | Available if any browser consumer needs it | Keep |
| `collection item data.citationApa` (`toThesesCollectionItems.js:92`) | INTERNAL | No touch | Removed with `buildApaCitation` |
| `thesisDetail.citationStyle` = `"APA 7"` | INTERNAL, informational | No touch | Consider removal (unused after Phase 6) |
| Existing test fixtures citing `citationApa` (`tests/unit/thesisDetails.test.js`) | AUDIT / TEST ONLY | No touch | Update in Phase 6 |

Phase 4 must not touch the two PUBLIC surfaces. Any Phase 4 refactor that repoints an internal consumer to CSL is fine; changing the public shape is not.

---

## 10. Deletion / readiness matrix

| Component | Current consumers | Replacement | Status | Phase |
|---|---|---|---|---|
| `src/js/thesis-hub-actions.js#buildThesisApa` | Modal preview, abstract-modal APA text, `.txt` download | Shared renderer `buildCitation({csl, style:"apa", lang})` | **DELETE IN 4C** | 4 |
| `src/js/thesis-hub-actions.js#buildThesisMla` | Modal preview, `.txt` download | Shared renderer MLA thesis branch (needs 4A) | **DELETE IN 4C** | 4 (after 4A) |
| `src/js/thesis-hub-actions.js#buildThesisChicago` | Modal preview, `.txt` download | Shared renderer Chicago thesis branch (needs 4A) | **DELETE IN 4C** | 4 (after 4A) |
| `src/js/thesis-hub-actions.js#buildThesisBibTeX` | Modal preview, `.bib` download | Shared renderer BibTeX thesis branch (needs 4A: `@mastersthesis`, `school =`, citation-key policy) | **DELETE IN 4C** | 4 (after 4A) |
| `src/js/thesis-hub-actions.js#buildThesisRis` | Modal preview, Zotero + Mendeley `.ris` download | Shared renderer RIS thesis branch (needs 4A: `M3 -` line) | **DELETE IN 4C** | 4 (after 4A) |
| `src/js/thesis-hub-actions.js#getThesisLevelLabel` | Inputs to all browser composers | Shared renderer's `THESIS_GENRE_FI_TO_EN` map | **DELETE IN 4C** | 4 |
| `src/js/thesis-hub-actions.js#getCitationByFormat` | Dispatcher (has RIS-omission bug) | Replaced by `sharedCitation(payload, format)` mirroring `src/julkaisut.njk` | **DELETE IN 4C** | 4 |
| `src/js/thesis-hub-actions.js` interaction shell (open/close, event listeners, clipboard, download, filename sanitisation) | Modal triggers | Keep; refactor payload to include `csl` | **KEEP** | — |
| `src/_includes/thesis-hub-modals.njk` | Modal HTML (both modals) | Keep; audit whether Abstract modal still adds UX value once detail page shows abstract natively | **KEEP** (minor cleanup in 4B) | 4 |
| `[data-thesis-abstract-trigger]` producers | None (removed by Phase 3) | Optional restoration on archive rows; more likely deleted along with the abstract modal | **PHASE 4B decision** | 4 |
| `[data-thesis-citation-trigger]` producers | None (removed by Phase 3) | Restore as a citation-export button on **thesis detail page**; optionally lightweight version on archive rows | **RESTORE IN 4B** | 4 |
| `src/_includes/thesis-table.njk` | **No consumers** — orphaned since F3A / Phase 3 | Delete | **DELETE IN 4C** (dead code) | 4 |
| `.thesis-bib-btn` HTML class references | Only inside the orphaned `thesis-table.njk` | Delete with the include | **DELETE IN 4C** | 4 |
| Skipped F3A test | `tests/f3a-theses-find-explore.spec.js:26` | Rewrite as detail-page modal test | **REWRITE IN 4D** | 4 |
| `src/_data/theses.js#buildApaCitation` + `#withCitation` + `#getThesisLevelLabel` | Populates `citationApa` on `thesisDetail`, `/data/theses.json`, virtual collection, JSON-LD via computed | Shared renderer via `thesisDetail.csl` | **KEEP TEMP** | **6** (public contract preservation) |
| `thesisDetail.citationApa` build-model field | JSON-LD `citation` property | Same as above | **KEEP TEMP** | **6** |
| PF5 GLOBAL RESULT PARITY presenter | Navbar / /haku/ / /en/search/ / F&E | New shared domain-variant presenter | **NEEDS EVIDENCE** | **5** |

---

## 11. Proposed Phase 4 target architecture

```text
canonical thesis
   └─ buildThesisCslItem() → CSL
        ├─ SSR (unchanged from Phase 3): archive + detail
        │    → shared publicationCitation renderer → APA 7 bracket
        │
        └─ Modal / export UI (Phase 4)
             ├─ Detail-page trigger element carries thesis CSL
             │    (as data attribute — one thesis per page → no payload bloat)
             │
             └─ src/js/thesis-hub-actions.js (interaction only)
                  ├─ open/close modal
                  ├─ format select
                  ├─ preview textarea
                  └─ sharedCitation(payload, format)
                        → window.publicationCitation.buildCitation({csl, style, lang})
                        ├─ APA / MLA / Chicago  → clipboard / .txt / preview
                        ├─ BibTeX               → .bib download
                        └─ RIS                  → .ris download (Zotero + Mendeley)
```

Constraints:

- **No new large JSON blob.** Modal triggers live on the detail page primarily (one thesis's CSL per page, ~0.5 KB). If an archive-row trigger is desired, the CSL rides on the row's own trigger element as a data attribute, no cross-row global blob.
- **No browser-side raw-field composition** for citations. Interaction JS reads CSL, hands to shared renderer, renders result.
- **No public contract change.** `citationApa` on public JSON and JSON-LD stays until Phase 6.
- **Payload target for one thesis:** `{ csl: thesisDetail.csl, title: thesisDetail.title, url: thesisDetail.sourceUrl }` (last two for filename generation and Open-in-OuluREPO buttons).

---

## 12. Payload / performance implications

| Option | Bytes per thesis | Behaviour | Verdict |
|---|---|---|---|
| Embed full CSL per trigger, detail-page only | ~0.5 KB × 1 thesis per detail page | Isolated; scales trivially | **Recommended** |
| Embed full CSL per trigger, on archive rows too | ~0.5 KB × 30 rows per SSR URL = ~15 KB per archive page | Modest bulk; per-row payloads bounded | Acceptable if archive-row trigger is required |
| Pre-render all 5 citation strings per trigger | ~2 KB × 30 rows = ~60 KB per archive page | Larger HTML; renderer runs 5× per row at build | Acceptable but heavier; avoid unless CSL-in-browser objection |
| Global `<script id="thesisCitationExports">` JSON blob with all 169 CSLs | ~85 KB gzip ~20 KB per archive page | One-time payload, shared across triggers | **Reject** — user directive forbids "the entire internal thesis model into a large browser JSON object" |
| Server-generated static downloadable `.ris` / `.bib` files per thesis | 0 KB HTML overhead, ~500 files added to `_site` | Requires build changes; no browser JS composition | Rejected for now — extra build complexity, no offset benefit |

**Recommendation:** Phase 4B places the modal trigger on the detail page with `thesisDetail.csl` embedded on the trigger element. That single change unlocks copy/download/Zotero/Mendeley without any global payload. If the UX audit later decides an archive-row trigger is needed, adopt the per-row CSL data-attribute at that time.

---

## 13. Phase 4 implementation gates

Each gate must be green at Phase 4 closure. Phase 3 gates must remain green throughout Phase 4.

### Unit / build

- `node --test tests/unit/*.test.js` — 488/488 must remain green, plus new tests for shared-renderer MLA / Chicago / BibTeX / RIS thesis branches (target: at minimum 8 new assertions per new branch, 32 total).
- `npm run build:no-og` — clean.
- `scripts/audit-th-cite1-phase1-thesis-csl-parity.js` — canonical unique 169; parity 169/169 IDENTICAL.
- `scripts/audit-th-cite1-phase3-ssr-archive.js` — 10/10 gates including sitemap discipline.
- `scripts/audit-pub-cite1-phase4-legacy-citation-deletion-readiness.js` — proves no `buildThesisApa/Mla/Chicago/BibTeX/Ris` references remain in `src/js/` after 4C.

### Browser tests (Playwright)

- Existing `tests/th-cite1-phase3-thesis-pagination.spec.js` — 8/8 unchanged.
- Existing `tests/f3a-theses-find-explore.spec.js` — rewritten test must pass, skip removed.
- New `tests/th-cite1-phase4-thesis-modal-export.spec.js` (Phase 4D) — at minimum:
  - Modal open / close (FI detail page + EN detail page).
  - Format switch: APA / MLA / Chicago / BibTeX / RIS.
  - Preview textarea populates from shared renderer.
  - Copy button writes preview to clipboard.
  - Download button emits correct filename + extension per format (`.txt` for APA/MLA/Chicago, `.bib` for BibTeX, `.ris` for Zotero/Mendeley).
  - Empty-state: with a synthetic CSL-missing payload, unavailable message + disabled action buttons.
  - Unicode: verify a title containing `Å / ä / ö / :` survives copy + download without corruption.
  - Missing-data path: year / publisher missing → shared renderer's controlled fallbacks (no `"Laru, Jari"` fabrication).
  - Keyboard: modal Esc closes, Tab traversal stays inside modal, focus returns to opener.

### Regression

- `tests/accessibility.spec.js` + `tests/contrast.spec.js` + `tests/navigation.spec.js` — no regressions.
- Pagefind integrity — thesis-tagged fragments = 169.
- Sitemap discipline — landings present, no paginated URLs.
- Public JSON parity — `/data/theses.json` diff vs main = 0 bytes (nothing changed on public contract).
- JSON-LD `citation` property parity — unchanged on all 169 detail pages.

---

## 14. Explicit non-goals

Phase 4 must not:

- Modify `src/_data/theses.js#buildApaCitation` / `#withCitation` / `#getThesisLevelLabel` (Phase 6).
- Change the `/data/theses.json.citationApa` public field (Phase 6).
- Change the `thesisSchemaCitation` JSON-LD `citation` property (Phase 6).
- Introduce a global `<script id="thesisCitationExports">` JSON blob or similar.
- Alter Canonical Content v1.
- Start PF5 GLOBAL RESULT PARITY work.
- Modify Pagefind meta / filters / fragment content for theses.
- Restructure the SSR archive or its pagination.
- Modify the shared renderer's APA thesis branch (Phase 2 contract preserved).
- Add a language field to RIS / BibTeX unless a specific consumer needs it.

---

## 15. Phase 4 phased plan

Recommended sequence — each phase is independently verifiable and reversible.

### Phase 4A — Shared-renderer thesis-branch extensions (build-time only)

- Add MLA, Chicago thesis branches (genre + publisher after title/year, FI/EN display map for `lang="en"`).
- Add BibTeX thesis-genre → entry-type mapping (`@mastersthesis` / `@phdthesis` / `@misc`) and use `school =` for thesis entries.
- Add RIS `M3 -` line for `type=thesis`.
- Consider human-readable BibTeX citation-key policy (optional; may be unified with publications).
- Unit tests: per-style parity assertions vs current browser output on a fixture set of 3–5 representative thesis CSLs.
- Node-side smoke: `publicationCitation.buildCitation({csl, style, lang})` returns non-regressed output for all 169 canonical theses.
- **Gate**: no template or browser change in this phase.

### Phase 4B — Restore detail-page export UI (SSR + minimal JS wiring)

- Include `thesis-hub-modals.njk` in `src/_includes/thesis-detail-body.njk`.
- Add an "Export citation" trigger element (button) on the detail page. Trigger element carries `data-thesis-csl` (JSON-escaped CSL), `data-thesis-title`, `data-thesis-source-url`.
- Load `src/js/thesis-hub-actions.js` on detail pages via `pageScripts` in the detail template.
- Do **not** add archive-row triggers in this phase; defer to a later UX decision.
- **Gate**: modal opens on detail page with a valid preview generated from CSL (shared renderer already handles APA; MLA/Chicago/BibTeX/RIS depend on 4A completion).

### Phase 4C — Migrate `thesis-hub-actions.js` to shared renderer and delete browser composers

- Introduce `sharedCitation(payload, format)` mirroring `src/julkaisut.njk` (empty-state → unavailable message + disable buttons).
- Rewrite `getCitationByFormat` to dispatch to `sharedCitation`. Fix the pre-existing RIS-dispatch bug.
- Delete `buildThesisApa`, `buildThesisMla`, `buildThesisChicago`, `buildThesisBibTeX`, `buildThesisRis`, `getThesisLevelLabel` from the file. Retain modal-interaction shell.
- Preserve download filenames (`.txt` / `.bib` / `.ris`) and Zotero/Mendeley wiring.
- Delete orphaned `src/_includes/thesis-table.njk` and its `.thesis-bib-btn` references.
- Optionally remove the abstract modal (`#thesisAbstractModal`) if no consumer restores an abstract trigger — the abstract is already fully visible on the detail page SSR.
- **Gate**: `grep -n 'buildThesisApa\|buildThesisMla\|buildThesisChicago\|buildThesisBibTeX\|buildThesisRis\|getThesisLevelLabel' src/js/` returns zero hits.

### Phase 4D — Parity + test rewrite + closure

- Rewrite the skipped F3A test as a detail-page modal + export test.
- Add new Playwright spec `tests/th-cite1-phase4-thesis-modal-export.spec.js` covering the full modal / copy / download / Zotero / Mendeley matrix per §13.
- Add a Phase 4 audit script `scripts/audit-th-cite1-phase4-modal-export-parity.js` that:
  - loads 169 canonical thesis CSLs;
  - renders each in APA / MLA / Chicago / BibTeX / RIS via shared renderer;
  - asserts non-empty output for every (thesis, format) pair;
  - asserts BibTeX entry type is one of `{mastersthesis, phdthesis, misc}`;
  - asserts RIS output includes `TY  - THES` and (for `type=thesis` records) `M3 - `;
  - asserts APA output includes `[Genre, Publisher].`.
- Update roadmap + closure doc pattern used in Phase 3 (BRANCH → MAIN transition on merge).
- **Gate**: 488+ unit tests, all Playwright specs green including the rewritten F3A test, Phase 4 audit script green, no `buildThesis*` functions remain in browser.

---

## 16. Decision

**READY WITH CONDITIONS.**

Conditions:

1. **Do 4A before 4C.** Removing browser composers before extending the shared renderer regresses MLA / Chicago / BibTeX / RIS output for theses.
2. **Keep the modal trigger on the detail page in 4B.** No global CSL JSON blob. Archive-row triggers are a separate future UX decision.
3. **Preserve `citationApa` public contract.** JSON-LD + `/data/theses.json` unchanged. That migration belongs to Phase 6.
4. **No silent raw-field fallback** in the browser after 4C. Empty CSL → unavailable state, mirroring the publications pattern.
5. **The skipped F3A test must be rewritten (not deleted) in 4D.** Its behavioural intent (modal opens + preview populated) is exactly the Phase 4 UX contract and belongs in the test suite.
6. **The BibTeX author fallback (`"Laru, Jari"`) must not survive the migration.** No fabricated authorship.
7. **Phase 3 stays green throughout Phase 4.** All 10 Phase 3 SSR-archive audit gates, sitemap discipline, and pagination browser tests must remain in place.

Ready to enter Phase 4 once these conditions are agreed and the phased plan is scheduled. Do not start implementation from this audit.

---

## 17. Notes for the Phase 4 implementer

- Publications solved the equivalent problem in PUB-CITE1 Phase 4a–4d. `src/julkaisut.njk` contains the reference wiring for `sharedCitation`, `downloadRisFor`, `flashUnavailable`, `setCitationButtonsEnabled`. Reuse this pattern for consistency — do not invent a new one.
- The shared renderer already exports `apa`, `mla`, `chicago`, `bibtex`, `ris` alongside `buildCitation`. Extend those functions rather than adding a parallel `thesisApa` / `thesisBibtex` / etc.
- `src/_utils/thesisCsl.js#THESIS_GENRE_FI` and `THESIS_PUBLISHER` constants exist and can be reused by any new shared-renderer thesis branch. Do not duplicate the FI→EN display map — reuse the existing one in `publication-citation.js`.
- `pageScripts` inclusion for `/js/thesis-hub-actions.js` on detail pages is a template-level change with no data-flow implications — pure Phase 4B.

END OF AUDIT.
