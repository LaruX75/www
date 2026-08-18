# TH-CITE1 Phase 6 — Legacy server citation deletion readiness audit

Date: 2026-08-18

Repository: `LaruX75/www`

Branch at audit time: `audit/th-cite1-phase6-legacy-server-citation`

Verified `main` HEAD: `946f553270e3bebeb81edc470b79ca12ca732c83`

Post-Phase-4 workstream status:

```text
TH-CITE1 Phase 1  DONE
TH-CITE1 Phase 2  DONE
TH-CITE1 Phase 3  CLOSED / GREEN / MAIN
TH-CITE1 Phase 4  CLOSED / GREEN / MAIN
TH-CITE1 Phase 5  NOT STARTED
TH-CITE1 Phase 6  NOT STARTED  ← this audit
```

Scope: **read-only** readiness assessment for Phase 6 (legacy server citation composer deletion). No implementation. Ends with a phased Phase 6 plan and a `READY / READY WITH CONDITIONS / BLOCKED` decision.

Out of scope:

- Canonical Content v1.
- PF5 GLOBAL RESULT PARITY (Phase 5).
- Navbar Pagefind, `/haku/`, `/en/search/`, thesis Pagefind card layout.
- Publications citation architecture (already closed by PUB-CITE1).
- Presentations, Media.

---

## 1. Current producer graph

Sole legacy composer, `src/_data/theses.js`:

```text
raw thesis fields
  ├─ getThesisLevelLabel(type)   →  "Pro gradu -tutkielma"        (masterThesis)
  │                                  "Kandidaatintutkielma"        (bachelorThesis)
  │                                  "Opinnäytetyö"                (fallback)
  │
  └─ buildApaCitation(thesis)
       ├─ formatAuthorsApa(thesis.authors)
       ├─ year (or "n.d.")
       ├─ title
       ├─ getThesisLevelLabel(thesis.type)
       └─ URL (thesis.link)
       →  "Authors (Year). Title [Level, Oulun yliopisto]. URL"
```

Wrapped by `withCitation(thesis)` which sets:

```text
{...thesis,
  pageUrl,
  citationApa: buildApaCitation(thesis),
  citationStyle: "APA 7",
  researchLine, researchExcluded, researchThemes, researchAudience,
  featuredOn, researchPriority, researchSummary}
```

`withCitation` is called in three raw-record buckets inside `theses.js` (`gradut`, `kandit`, `reviewerOnly`). Every raw record therefore receives `citationApa` before dedup.

**Language rule (legacy):** hardcoded FI institution `"Oulun yliopisto"` and FI genre labels. No dependency on thesis source language or on the rendering page. The public field is deterministic FI regardless of consumer surface.

Post-Phase-4-2 shared renderer produces byte-identical output for `csl.type === "thesis"` with `lang = "fi"` (Phase 1 parity audit re-verified 2026-08-18: 169/169 IDENTICAL).

---

## 2. Consumer inventory

### 2.1 Consumers (classified)

| Consumer | Path | Classification | Notes |
|---|---|---|---|
| `/data/theses.json` `items[].citationApa` | `src/data/theses.json.11ty.js:98` | **PUBLIC CONTRACT** | Read-only public JSON contract. Byte-identical text required. |
| `src/opinnaytteet/thesis-details.njk` `thesisSchemaCitation` computed | line 29 → `data.thesisDetail?.citationApa \|\| ""` | **PUBLIC SEO / SCHEMA CONTRACT** | Feeds JSON-LD `citation` property on all 169 detail pages. |
| `src/_includes/_ldschema.njk:238` | `if thesisSchemaCitation → merge into thesisNode.citation` | **PUBLIC SEO / SCHEMA CONTRACT** | Renders `<script type="application/ld+json">` `"citation": "…"`. |
| `src/_data/thesisDetails.js:120` `citationApa: pickString(thesis.citationApa)` | detail build model | **INTERNAL BUILD CONTRACT** | Used by JSON-LD path above. |
| `src/_utils/toThesesCollectionItems.js:92` `citationApa: thesis.citationApa \|\| null` | virtual `theses` collection data | **INTERNAL BUILD CONTRACT** | No production template reads it after Phase 3/4 (the SSR archive migrated to `data.csl \| publicationCitation`). Retained for symmetry. |
| `tests/unit/thesisDetails.test.js:31` fixture `citationApa: "Turunen, P., & Annola, M. (2026). Example."` | unit test | **TEST / AUDIT** | Fixture; update when field derivation changes. |

### 2.2 Non-consumers (verified)

Explicitly checked and confirmed to have **zero** thesis-citation references:

- `src/api/export-data.json.11ty.js` — publications-only export.
- `src/api/seo-source-map.json.11ff.js` — no thesis mentions.
- `src/feeds/` — directory does not exist.
- Pagefind meta / filter / fragment — no `citationApa` in the metadata stream.
- Navbar Pagefind UI, `/haku/`, `/en/search/` — no thesis-citation consumers.
- Knowledge-graph / external integration scripts — none.
- `src/_data/theses.js`'s SSR template consumers migrated to `csl | publicationCitation` in Phase 3.
- `src/_data/thesisDetails.js`'s SSR consumer (`thesis-detail-body.njk` line 46) already reads `thesisDetail.csl | publicationCitation("apa", currentLang)` — the `citationApa` field on `thesisDetail` is used **only** by the JSON-LD computed field.
- `src/_utils/toThesesCollectionItems.js`'s `data.citationApa` field is not read by any template after Phase 3.

### 2.3 Audit/documentation consumers (informational)

- `scripts/audit-th-cite1-phase1-thesis-csl-parity.js` — compares `thesis.citationApa` vs shared renderer output on 169 canonical records. Would still work after Phase 6 (compares to shared → shared) — noise gate would become tautological but not blocking.
- `scripts/audit-th-cite1-phase4c-browser-citation-deletion.js` gates `serverBuildApaCitationRetained`, `serverWithCitationRetained`, `serverGetThesisLevelLabelRetained` — **these three gates flip meaning in Phase 6.** Update needed alongside the deletion.
- `scripts/audit-th-cite1-phase4-modal-export-parity.js` gates `publicJsonHasCitationApa` + `publicJsonHasAnyCitationApa` + `detailJsonLdCitationRetained` — must remain green after Phase 6 (they test the field's presence, not its origin).
- `scripts/audit-pub-cite1-phase4-legacy-citation-deletion-readiness.js` — PUB-CITE1 archival. Contains a stale `thesisDoesNotDependOnPublicationRenderer` gate that's already false after Phase 4B. Not blocking.
- `scripts/audit-pf5-native-result-card-variants-apa7.js:58` — checks `citationApa: pickString(thesis.citationApa)` regex in `src/_data/thesisDetails.js`. Would still hold after Phase 6 because the field is retained; only its upstream source moves.

Historical closure docs (`docs/find-explore-*`, `docs/th-cite1-phase*`) mention the functions as period evidence — no live code path.

---

## 3. Public `/data/theses.json` contract audit

Verified on the built `_site/data/theses.json` (`main` `946f5532`):

```text
{
  "count": 169,
  "items": [ 169 objects, each with keys:
      id, url, pageUrl, sourceUrl, title, description, year, lang,
      contentType, contentTypeLabel, section, thesisType, authors,
      keywords, categories, contexts, thesisRole, researchPriority,
      citationApa
  ]
}
```

- **`citationApa` present:** 169 / 169 items have non-empty string.
- **`csl` NOT exposed publicly:** verified — no item carries a `csl` field.
- **Canonical unique count:** 169 (dedupe by URL, handled by `theses.json.11ty.js` `seen.has(record.url)`).
- **Identity/URL fields unchanged.**
- **Sample citation:** `Riikonen, H. (2026). 6-luokkalaisten kokemuksia matematiikka-ahdistuksesta [Pro gradu -tutkielma, Oulun yliopisto]. https://oulurepo.oulu.fi/handle/10024/62699`

Baseline captured in `docs/data/th-cite1-phase6-citationApa-parity-2026-08-18.json` (see §5).

---

## 4. JSON-LD contract audit

Flow:

```text
raw thesis
  → src/_data/theses.js#withCitation
    → thesis.citationApa (FI string)
  → src/_data/thesisDetails.js line 120
    → thesisDetail.citationApa
  → src/opinnaytteet/thesis-details.njk line 29 eleventyComputed
    → thesisSchemaCitation = data.thesisDetail?.citationApa || ""
  → src/_includes/_ldschema.njk line 238
    → if thesisSchemaCitation, merge into thesisNode.citation
  → <script type="application/ld+json"> "citation": "…"
```

Sample built output at `/opinnaytteet/18096/`:

```text
"citation":"Mattila, T. (2021). Professional development of technology integration into teaching : the perceptions of the providers…"
```

- Present on all 169 detail pages when the source `thesis.citationApa` is non-empty.
- String is **identical** to the public JSON `citationApa` for the same thesis (both flow from `withCitation`).
- Language: **always FI** (matches legacy composer). No English variant exists in the current JSON-LD output.

Phase 6 must preserve this exact string content.

---

## 5. Shared-renderer parity audit (169 / 169)

Ran `publicationCitation.buildCitation({csl, style: "apa", lang: "fi"})` on all 169 canonical unique theses and compared against the current legacy `thesis.citationApa`.

```text
canonical unique theses:     169
identical:                   169
differ:                        0
gate failures:                 0
```

Evidence: `docs/data/th-cite1-phase6-citationApa-parity-2026-08-18.json` (169 rows, `identical: true` for every row).

This is a re-confirmation of the Phase 1 audit that already established 169 / 169 IDENTICAL. Phase 4A extensions to MLA / Chicago / BibTeX / RIS did **not** touch the APA branch — the byte-identical guarantee still holds.

---

## 6. Language semantics decision

Answer to §9 of the readiness spec:

- **`/data/theses.json.citationApa` language:** FI (`lang="fi"`). Preserves current public contract byte-identically. Phase 6 target rule.
- **JSON-LD `citation` property language:** FI. Preserves current schema output byte-identically.
- **`thesisDetail.citationApa` build-model language:** FI. Same as public JSON — it feeds JSON-LD via the computed field.
- **Should the three be identical?** Yes. All three flow from a single `withCitation()` output.

Rationale:

- The current legacy composer emits FI regardless of thesis source language. Changing this is a **public contract change** and is not in Phase 6 scope. Any move to a per-thesis-language or per-page-language variant is a separate future decision (post-Phase 6).
- The Phase 2 SSR templates (`thesis-detail-body.njk`, `thesis-archive-table.njk`) use `csl | publicationCitation("apa", currentLang)` where `currentLang` is thesis source language for detail and page UI language for archive — that is a **template-level display choice**, unrelated to the persisted `citationApa` string.
- Phase 6 keeps the persisted field FI and preserves the template-level `csl | publicationCitation` behaviour for on-page rendering.

**Hard rule:** `citationApa` (public JSON + JSON-LD + build model) uses `lang="fi"` in Phase 6. Templates continue to compute their own per-page display via `csl | publicationCitation(style, lang)`.

---

## 7. `withCitation()` analysis

`withCitation(thesis)` does much more than citation:

```text
{
  ...thesis,
  pageUrl,
  citationApa,      ← Phase 6 target: repoint to shared renderer
  citationStyle,    ← constant "APA 7"
  researchLine,     ← curated research-program metadata
  researchExcluded,
  researchThemes,
  researchAudience,
  featuredOn,
  researchPriority,
  researchSummary
}
```

Call sites: 3 inside `src/_data/theses.js` itself (`gradut`, `kandit`, `reviewerOnly` buckets). Zero external callers.

**Phase 6 outcome: KEEP `withCitation`, REPLACE its `citationApa` derivation.** Deleting `withCitation` entirely would strip research-program metadata attachment from ~169 thesis objects and break `researchLine` / `researchThemes` / `featuredOn` / `researchPriority` / `researchSummary` downstream consumers.

The minimal change:

```js
// Phase 6 form:
const { buildThesisCslItem } = require("../_utils/thesisCsl");
const publicationCitation = require("../_utils/publicationCitation");

function withCitation(thesis) {
  const meta = CURATED_THESIS_META[thesis.link] || {};
  const csl = buildThesisCslItem({
    link: thesis.link,
    title: thesis.title,
    authors: thesis.authors,
    year: thesis.year,
    type: thesis.type,
    language: thesis.language
  });
  const rendered = csl
    ? (publicationCitation.buildCitation({ csl, style: "apa", lang: "fi" }).text || "")
    : "";
  return {
    ...thesis,
    pageUrl: thesisPageUrl(thesis.link),
    citationApa: rendered,       // ← now from shared renderer
    citationStyle: "APA 7",
    researchLine: meta.researchLine || null,
    researchExcluded: meta.excludeFromResearchProgram === true,
    researchThemes: Array.isArray(meta.themes) ? meta.themes.filter(Boolean) : [],
    researchAudience: Array.isArray(meta.audience) ? meta.audience.filter(Boolean) : [],
    featuredOn: Array.isArray(meta.featuredOn) ? meta.featuredOn.filter(Boolean) : [],
    researchPriority: Number.isFinite(meta.priority) ? meta.priority : 0,
    researchSummary: normalizeText(meta.summary || "")
  };
}
```

After this change, `buildApaCitation` and `getThesisLevelLabel` become uncalled and deletable.

---

## 8. Server-side `getThesisLevelLabel()` analysis

Sole consumer: `buildApaCitation` (inside `src/_data/theses.js` itself).

Verified by grep: zero external callers. Every downstream consumer that needs a thesis-level label uses either:

- The shared FI/EN display map inside `src/js/publication-citation.js` (`THESIS_GENRE_FI_TO_EN`), or
- Locale-branched inline literals in templates (`src/data/theses.json.11ty.js:63`, `src/_data/thesisDetails.js:33`).

**Phase 6 outcome: DELETE IN PHASE 6** — no other consumer exists. The Phase 4A shared genre display map is the single source of truth for level labels.

---

## 9. Dependency direction

`src/_data/theses.js` (thesis data loader) may require `src/_utils/publicationCitation.js` (Node accessor) and `src/_utils/thesisCsl.js`.

- `src/_utils/publicationCitation.js` is a thin Node shim that re-exports `src/js/publication-citation.js` (isomorphic UMD). Under Node it's `module.exports = factory()` — pure CommonJS, no browser globals, no DOM.
- `src/_utils/thesisCsl.js` requires `parseAuthors` from `src/_utils/publicationCsl.js`. Both are stateless pure functions.

Cycle check:

- `src/js/publication-citation.js` requires nothing.
- `src/_utils/publicationCitation.js` requires `../js/publication-citation.js`.
- `src/_utils/publicationCsl.js` requires nothing thesis-related.
- `src/_utils/thesisCsl.js` requires `publicationCsl.js` only for `parseAuthors`.
- Neither publicationCitation nor thesisCsl requires anything from `src/_data/theses.js`.

**No cycle. No browser assumption. Safe to require from `src/_data/theses.js`.**

Precedent: `src/_data/researchfiContent.js` (a sibling data loader) already `require`s `src/_utils/publicationCitation.js` and calls `buildCitation` at build time. Same pattern, proven.

---

## 10. Projection design decision

Two candidate implementation shapes:

### A. Compute in `withCitation` (single enrichment stage)

Compute the CSL and citation in the same wrapper that already attaches research-program metadata. One derivation point. Byte-identical output for the 169 canonical downstream consumers (public JSON, JSON-LD, thesisDetail, collection items).

Pros: single authoritative derivation; minimal touch surface; preserves current dedup ordering (`withCitation` runs on raw records BEFORE dedup, but the citation string is deterministic per URL so both duplicate instances get the same string → downstream dedup keeps one → no leak).
Cons: computes CSL 170 times (170 raw records) instead of 169 times. Negligible cost — CSL projection is a pure O(1) transform.

### B. Compute in each consumer projection

Every projection stage (`thesisDetails.js`, `theses.json.11ty.js`, `toThesesCollectionItems.js`) calls the shared renderer itself. `withCitation` stops setting `citationApa`.

Pros: no upstream `citationApa` field on raw records.
Cons: three call sites instead of one; three places to keep in sync if language rule ever changes; more work.

**Recommendation: A.** Preserves the current architecture (one derivation, propagates through projections), minimises risk, and matches the readiness spec's "prefer one authoritative derivation, not repeated formatter calls scattered across templates/data projections."

---

## 11. Duplicate raw source handling

Verified corpus:

```text
raw source records:                 170  (including duplicate handle/10024/7879 in data.gradut)
canonical unique thesis URLs:       169
```

`withCitation()` runs on all 170 raw records → both duplicate instances receive `citationApa`. Because the derivation is deterministic (same URL/title/authors/year/type → same CSL → same shared renderer output), both instances get the **same** citation string.

Downstream dedup layers already handle uniqueness:

- `src/data/theses.json.11ty.js` uses `seen.has(record.url)` — emits 169 items to public JSON.
- `src/_data/thesisDetails.js#collectCanonicalTheses` uses `seen.add(link)` — emits 169 detail items.
- `src/_utils/toThesesCollectionItems.js` uses `seen.add(item.url)` — emits 169 collection items.

No leak of 170 into any public/build object. Phase 6 shape A does not disturb this.

---

## 12. Failure paths

Anticipated Phase 6 behaviour on incomplete inputs:

| Input | Legacy behaviour | Phase 6 shared-renderer behaviour |
|---|---|---|
| Missing `type` | `"Opinnäytetyö"` fallback → still emits string | `csl.genre` falls back to `"Opinnäyte"` → still emits bracket string |
| Missing `year` | `"n.d."` in APA position | `"n.d."` in APA position (shared renderer already emits this) |
| Missing `title` | Composes empty title → `"(year). ."` | `buildThesisCslItem` returns null → `citationApa = ""` |
| Missing `authors` | Composes `""` prefix → `" (year). Title …"` | Shared renderer emits `"Tuntematon tekijä"` |
| Missing `link` | Composes citation without URL suffix | Shared renderer omits URL |
| Missing everything | `"(n.d.). ."` string | `""` |

**Behaviour difference on truly-empty records:** legacy always emits a non-empty (possibly nonsense) string; shared renderer emits `""` when CSL identity fields (id + title) are missing.

Public contract check: `pickString(t?.citationApa)` in `src/data/theses.json.11ty.js:98` normalises to string; an empty string is allowed by the current shape. All 169 real canonical records have title + authors + URL, so this edge case does not arise on the production corpus. Confirmed by the parity audit (169 / 169 IDENTICAL — no thesis records exercise the empty path).

**No silent fallback to legacy formatter in Phase 6.** If shared renderer returns empty (never happens on production data), the field carries `""` — same as if `pickString` had received an empty legacy string.

---

## 13. Deletion matrix

| Component | Current consumers | Replacement | Phase 6 status |
|---|---|---|---|
| `src/_data/theses.js#getThesisLevelLabel(type)` | Only `buildApaCitation` (internal) | Shared FI/EN display map in `src/js/publication-citation.js` | **DELETE IN PHASE 6** |
| `src/_data/theses.js#buildApaCitation(thesis)` | Only `withCitation` (internal) | `publicationCitation.buildCitation({csl, style:"apa", lang:"fi"})` via `buildThesisCslItem` | **DELETE IN PHASE 6** |
| `src/_data/theses.js#withCitation(thesis)` | 3 internal call sites (advisor / reviewer / gradut buckets) | Same function; only the citation derivation inside changes | **KEEP — REPOINT INTERNAL** (also attaches research-program metadata) |
| `thesis.citationApa` on raw record | `thesisDetails.js`, `theses.json.11ty.js`, `toThesesCollectionItems.js` | Same field, same string, sourced from shared renderer | **REPOINT IN PHASE 6** (value derivation only) |
| `thesisDetail.citationApa` build model | `thesisSchemaCitation` computed → JSON-LD | Same field, same string | **KEEP INTERNAL CONTRACT** (source derivation only) |
| Collection item `data.citationApa` | No production template reads it after Phase 3/4 | Same field, same string | **KEEP INTERNAL CONTRACT** (retained for symmetry; could be deleted separately if a follow-up audit proves no consumer) |
| `/data/theses.json` `items[].citationApa` | External / public consumers | Same string content, sourced from shared renderer | **KEEP PUBLIC CONTRACT** (byte-identical after repoint — Phase 6 preserves the field) |
| JSON-LD `citation` property on thesis detail pages | External / SEO / schema.org consumers | Same string content, sourced from shared renderer | **KEEP PUBLIC SEO CONTRACT** (byte-identical after repoint) |
| Audit gates `serverBuildApaCitationRetained`, `serverWithCitationRetained`, `serverGetThesisLevelLabelRetained` in `scripts/audit-th-cite1-phase4c-browser-citation-deletion.js` | Phase 4C static audit | Meaning flips: expect `false` for buildApaCitation + getThesisLevelLabel, `true` for withCitation | **UPDATE IN PHASE 6** |
| Phase 1 audit `scripts/audit-th-cite1-phase1-thesis-csl-parity.js` | Standalone; still runs | Tautological after Phase 6 (compares shared → shared). Optionally retire OR retarget to compare against the parity baseline snapshot. | **DECIDE IN PHASE 6D** (retire or retarget) |
| Fixture `tests/unit/thesisDetails.test.js:31` | Unit test | Fixture data — update to shared-renderer output | **UPDATE IN PHASE 6** |

---

## 14. Hidden-consumer sweep

Explicitly searched:

- `citationApa` — 7 producers/consumers listed in §2.1. No hidden ones.
- `citation` (broader) — beyond JSON-LD, matches only in shared-renderer docs and audit scripts.
- `APA` — matches shared renderer + doc references. No hidden thesis consumers.
- `thesis citation` — no matches outside audit/doc paths.
- `src/api/` (`export-data.json.11ty.js`, `seo-source-map.json.11ty.js`) — zero thesis mentions.
- `src/feeds/` — directory does not exist.
- `.github/workflows/` — no thesis-specific workflows.
- `package.json` — no thesis-specific scripts.
- Pagefind meta/filter/fragment (via decompressed sample) — no `citationApa` field in metadata stream (Pagefind carries a description, not the APA citation).

**No hidden consumer.** The producer/consumer graph in §2.1 is complete.

---

## 15. Implementation gates (for the future Phase 6)

Hard gates before and after Phase 6 implementation:

### Before implementation

- `node scripts/audit-th-cite1-phase1-thesis-csl-parity.js` — 169 / 169 IDENTICAL (baseline captured).
- `docs/data/th-cite1-phase6-citationApa-parity-2026-08-18.json` — parity baseline for every canonical unique thesis.

### After implementation

- `node --test tests/unit/*.test.js` — 527 / 527 (plus any updated `tests/unit/thesisDetails.test.js` fixture change).
- `npm run build:no-og` — clean.
- `node scripts/audit-th-cite1-phase1-thesis-csl-parity.js` — 169 / 169 IDENTICAL (tautological but still green).
- `node scripts/audit-th-cite1-phase3-ssr-archive.js` — 10 / 10 gates green (no SSR archive regression).
- `node scripts/audit-th-cite1-phase4c-browser-citation-deletion.js` — 37 gates, with the three server-side gates updated to expect deletion (`serverBuildApaCitationRetained: false`, `serverGetThesisLevelLabelRetained: false`, `serverWithCitationRetained: true`).
- `node scripts/audit-th-cite1-phase4-modal-export-parity.js` — 52 / 52 gates green (public JSON `citationApa`, no `csl`, JSON-LD `citation`).
- **New** `scripts/audit-th-cite1-phase6-legacy-server-citation-deletion.js` — hard gates:
  - `buildApaCitation`: 0 definitions in `src/_data/theses.js`
  - `getThesisLevelLabel` inside `src/_data/theses.js`: 0 definitions
  - `withCitation`: 1 definition (retained)
  - `withCitation` requires shared renderer: `require\("../_utils/publicationCitation"\)` present
  - `withCitation` requires CSL builder: `require\("../_utils/thesisCsl"\)` present
  - No occurrence of `buildApaCitation` anywhere in the built `_site/` output (belt-and-suspenders)
- **Public parity gate**: after rebuild, `/data/theses.json`'s `citationApa` for each of 169 items must be byte-identical to the baseline snapshot in `docs/data/th-cite1-phase6-citationApa-parity-2026-08-18.json`.
- Playwright bundle: Phase 3 pagination 8/8, Phase 4B modal 11/11, Phase 4C no-fallback 7/7, F3A 3/3, F3B 2/2, pf-cite-modal-failure-path 2/2, accessibility + contrast + navigation green.
- Publications-side unchanged: `publicationCitation.test.js` still 73/73 (or however many Phase 4A left it at within the 527 total).
- Sitemap discipline preserved.

### Static deletion audit gates (hard rules)

```text
grep -n "\bfunction buildApaCitation\b" src/_data/theses.js        → 0
grep -n "\bfunction getThesisLevelLabel\b" src/_data/theses.js     → 0
grep -n "\bfunction withCitation\b" src/_data/theses.js            → 1
grep -n "publicationCitation" src/_data/theses.js                  → ≥ 1
grep -n "buildThesisCslItem" src/_data/theses.js                   → ≥ 1
```

---

## 16. Proposed Phase 6 phased implementation

### Phase 6A — Shared-renderer citationApa source + parity snapshot

- Update `withCitation()` in `src/_data/theses.js` to derive `citationApa` from `buildThesisCslItem` + shared renderer with `lang="fi"`.
- Do NOT delete legacy helpers yet.
- Add a temporary side-by-side comparison test that ensures old and new derivations remain byte-identical during the transition.
- Rebuild + rerun Phase 1 audit — expect 169 / 169 IDENTICAL.

### Phase 6B — Public / build consumer verification

- Rerun the Phase 6 parity gate script comparing the built `_site/data/theses.json` `citationApa` against the baseline snapshot.
- Rerun Phase 4 audits — 52/52 must remain green.
- Verify JSON-LD `citation` on a random sample of 5–10 detail pages is byte-identical to baseline.
- No template or JSON-LD change required.

### Phase 6C — Delete legacy composers + update audits

- Remove `buildApaCitation` and `getThesisLevelLabel` from `src/_data/theses.js`.
- Update `scripts/audit-th-cite1-phase4c-browser-citation-deletion.js` to expect `serverBuildApaCitationRetained: false` and `serverGetThesisLevelLabelRetained: false`.
- Add `scripts/audit-th-cite1-phase6-legacy-server-citation-deletion.js` with the hard gates from §15.
- Update the `tests/unit/thesisDetails.test.js` fixture to whatever byte-identical string the shared renderer produces for the fixture's synthetic data (should be trivial).
- Retire or retarget `scripts/audit-th-cite1-phase1-thesis-csl-parity.js` — after Phase 6 it compares shared-renderer output against itself.

### Phase 6D — Full closure / PR / MAIN

- Full regression sweep.
- Open PR `feat/th-cite1-phase6-legacy-server-citation-deletion` → `main`.
- Wait for CI (Build and Deploy, Accessibility and navigation tests, Generate OG Images).
- Merge; post-merge verification on main.
- Docs closure PR mirroring the Phase 3 / Phase 4 pattern (`CLOSED / GREEN / BRANCH` → `CLOSED / GREEN / MAIN` + roadmap block).

---

## 17. Explicit non-goals

Phase 6 must NOT:

- Remove `/data/theses.json.citationApa` field or change its language.
- Remove JSON-LD `citation` property.
- Expose full internal CSL publicly.
- Modify Canonical Content v1.
- Modify PF5 GLOBAL RESULT PARITY (Phase 5).
- Modify navbar Pagefind, `/haku/`, `/en/search/`, thesis Pagefind card layout.
- Modify SSR archive (Phase 3).
- Modify detail-page citation/export modal (Phase 4B/4C).
- Change the shared renderer's APA thesis branch (Phase 2 contract preserved).
- Introduce a new canonical field, taxonomy, or schema property just to make deletion easier.
- Delete `withCitation()` (multi-purpose research-program metadata attachment).

---

## 18. Decision

**READY.**

Every prerequisite is met:

- Sole legacy composer (`buildApaCitation`) is identified.
- Public + build + internal consumer graph is complete (§2).
- Public JSON contract, JSON-LD schema, and internal build models are all covered by a single field (`citationApa`) that the shared renderer already produces byte-identically for 169 / 169 canonical unique theses (§5).
- Language rule is unambiguous: `lang="fi"` for all `citationApa` derivations preserves the current public contract (§6).
- Dependency direction is safe: `src/_data/theses.js` can require `src/_utils/publicationCitation.js` + `src/_utils/thesisCsl.js` without cycles or browser assumptions (§9).
- `withCitation()` is retained (research-program metadata); only its `citationApa` derivation is repointed (§7).
- `getThesisLevelLabel()` is fully deletable — no external consumer (§8).
- No hidden consumers (§14).
- Failure paths are controlled and match current behaviour on production data (§12).
- Duplicate raw record (`handle/10024/7879`) is already handled by existing dedup layers; Phase 6 does not affect this (§11).

Recommended implementation sequence: **6A → 6B → 6C → 6D** (§16). All four phases should fit into a single feature branch and a single implementation PR, mirroring the Phase 4 pattern (A + B + C + D on one branch).

END OF AUDIT.
