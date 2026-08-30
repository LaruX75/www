# RP-CONVERGE-01 → RP-CONVERGE-01A → PRES-CONTEXT1 → RP-CONVERGE-01 (resumed) → RP-CONVERGE-01B

Date: 2026-08-30
Status: `COMPLETED AFTER RP-CONVERGE-01B`

**Chronology of this workstream (single log; earlier sections retained
as historical audit evidence):**

1. Original RP-CONVERGE-01 attempt (commit `45db10db`, PR #169) —
   replaced the `/kouluttaja/` legacy strip with
   `presentationContextGroups.veso-taydennyskoulutus`.
2. RP-CONVERGE-01A semantic-source audit — found the replacement
   promoted a regex-derived UI grouping into canonical-authority
   position. **Decision C.** Production reverted inside PR #169.
3. PRES-CONTEXT1 (PR #170, merged `62327af0` on 2026-08-30) — completed
   canonical `contexts` metadata: 12 canonical Presentation MDs now
   explicitly declare `contexts: - business`. Canonical Content v1
   unchanged.
4. RP-CONVERGE-01 resumed (PR #171) — the company strip selected
   explicit business membership, but did so via a new file
   `src/_data/presentationBusiness.js` that re-read canonical MDs,
   re-parsed YAML, and re-derived URLs. Accidental duplicate
   projection layer.
5. **RP-CONVERGE-01B (this PR)** — deletes `presentationBusiness.js`
   and routes explicit-business selection through the existing
   canonical Presentation pipeline: a minimal generic
   `declaredContexts` field is preserved by
   `src/_data/presentationsPage.js` alongside the existing resolved
   `contexts`, exposed on `collections.presentations` items via
   `presentations.11tydata.js`, and filtered in the yritys.md
   template. No parallel Presentation reader / parser / normalizer /
   URL resolver remains.

The rest of this document preserves the RP-CONVERGE-01A Decision-C
history for archaeological clarity; the "Final resumed implementation
(2026-08-30)" section below records the RP-CONVERGE-01 resume; the
"RP-CONVERGE-01B correction (2026-08-30)" section at the very bottom
records the duplicate-projection removal.

RP-CONVERGE-01 originally shipped a production replacement of the FI
`/kouluttaja/` "Viimeisimpiä koulutusesityksiä" strip using
`presentationContextGroups.groups["veso-taydennyskoulutus"]`. The
follow-up semantic-source audit (RP-CONVERGE-01A) found that both the
original and the intended canonical alternative rely on **text-regex
inference** rather than any repo-documented canonical relationship
authority. The production change is reverted in the same PR (#169);
the audit is preserved as documentation. The legacy consumer, the
partial, and the CSS remain on `main`.

## Repository state

- Branch: `cleanup/rp-converge-01-company-presentations`
- PR: [#169](https://github.com/LaruX75/www/pull/169)
- Base: `origin/main` at `6b44c950918be5b719bf37da75251212f0ccf1ba` (post PR #168 selection-audit merge).
- Reference documents:
  - `docs/post-closure-next-workstream-selection-audit-2026-08-29.md` — selection audit that scoped RP-CONVERGE-01.
  - `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md`, `docs/r1-related-content-closure-2026-08-29.md`, `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md` — amended to reflect that the "orphan" claim was stale and that RP-CONVERGE-01A left the include in place under Decision C.

## Correction summary

The first RP-CONVERGE-01 implementation attempt (commit `45db10db`) replaced the legacy `canva.tableRows + sivuyhteys="kouluttaja-sivu"` selection with `presentationContextGroups.groups["veso-taydennyskoulutus"].featured | take(3)`. That commit was **reverted inside the same PR** after the RP-CONVERGE-01A audit found the replacement's authority basis was insufficient. This document records the audit; the production files return to their pre-PR state.

## Semantic-source audit — legacy set

Legacy selection: `canva.tableRows` filtered by `sivuyhteys` containing `"kouluttaja-sivu"`.

- **Total legacy items** on `main`: 57 (of 138 canva imports).
- Nature of `sivuyhteys`: editorial page-connection marker in `src/_data/canva-presentations.json`. Not documented as canonical relationship authority in any closure doc; not part of the `contexts` vocabulary; not shipped to templates as a canonical field.

## Semantic-source audit — canonical fields inspected

| Candidate field | Coverage on `main` | Meaning | Canonical authority? | Suitable for company strip? |
| --- | ---: | --- | --- | --- |
| `contexts` (via `resolveContexts` in `src/_data/contentContext.js`) | 7 / 139 presentation MDs resolve to `contexts.includes("business")` | Vocabulary member; `CONTEXT_META.business.href === "/kouluttaja/"` explicitly maps `business` to the company page. | **Vocabulary IS canonical** (used by R1 sidebar, AC1 content context sidebar, hub navigation). **Membership is text-inferred** via `inferContexts()` lines 189–199 matching titles/descriptions/categories/keywords against `veso|täydennyskoulutus|kouluttaja|keynote|webinaari|workshop`. Zero MDs declare `contexts:` in frontmatter for business-family. | **Weak parity** — 7/57 (~12 %) coverage. Same inference category as the group approach. |
| `type` | 139/139 = `"esitys"` (three outliers only) | Presentation kind marker. | Field is canonical but degenerate — no discriminator. | Not suitable. |
| `source` | 115/139 = `"slideshare"`, 2 youtube, 1 ouka | Import origin. | Canonical origin marker but degenerate for the company-page semantic. | Not suitable. |
| `categories` (declared frontmatter) | Sparse and inconsistent — no single "training-audience" category; nearest are `"VESO"` (few), `"Koulutus"` (6), `"Opettajankoulutus"` (~21) | Declared taxonomy on individual MDs. | Canonical, declared, but not curated for the company-page selection. | Weak parity; even the union of the closest labels covers only a partial subset and drifts by editorial inconsistency. |
| `contexts.includes("teaching")` | 139/139 (added unconditionally for `/presentations/` inputPath in `inferContexts` line 137–139) | Broad presentation classifier. | Field is canonical, membership is derived from inputPath alone. | Not a discriminator — matches all presentations. |
| `presentationContextGroups.groups["veso-taydennyskoulutus"]` | 10 items | Build-time UI grouping over presentation title + basename via regex + Finnish city-name prefixes + training-context keywords. | **Not documented as canonical authority.** Currently consumed only by `src/_includes/presentations/background-and-sources.njk` (the `/esitykset/` archive's grouping section). | Uses the same text-regex authority-substitution the audit spec warns against. |
| `paakortti` (`item.paakortti` in `canva-presentations.json`) | Marker on a subset of legacy imports | Legacy "flagship version" marker used by the deleted-style renderer. | Legacy-only; not preserved on canonical presentation MDs. | Not canonical. |

## Comparison — legacy set vs canonical alternatives

- Legacy `sivuyhteys="kouluttaja-sivu"`: 57 items — curated editorial selection.
- Canonical `contexts.includes("business")`: 7 items — text-regex overlap only.
- `presentationContextGroups.veso-taydennyskoulutus`: 10 items — different text-regex overlap; broader than `business` (matches VESO / DigiErko / city+training keywords) but narrower than the editorial set.

Neither canonical alternative recovers the majority of the legacy selection. The two "canonical-looking" alternatives (`contexts=business`, `presentationContextGroups`) are both **text-inference** — they differ only in which regex owns membership, and only one (`contexts`) is a documented vocabulary. The `contexts` vocabulary IS canonical for R1 / AC1 discovery, but its `business`-membership resolution on presentations is not editorially curated today.

## Role of `presentationContextGroups`

**`presentationContextGroups` is a derived UI grouping layer, not canonical membership authority.** It builds group buckets deterministically at build time by matching regexes against presentation titles and basenames (plus city-name prefixes), and it is currently consumed only by the `/esitykset/` archive's "Esitykset käyttötavan mukaan" browsing section (`src/_includes/presentations/background-and-sources.njk:52`). Its groups are useful for archive navigation. They are not documented as canonical presentation-to-hub membership. This audit does not delete or modify `presentationContextGroups`; it only classifies it correctly.

## Decision

**`DECISION = C — CANONICAL SIGNAL EXISTS BUT PARITY IS WEAK / AMBIGUOUS.`**

Rationale:

1. `contexts.includes("business")` is a defensible canonical vocabulary map (`CONTEXT_META.business.href === "/kouluttaja/"`), but its membership is text-inferred via `inferContexts` line 189–199, and it recovers only 7 of 57 legacy items (~12 % coverage).
2. Zero presentation MDs declare `contexts:` explicitly for business-family; the entire canonical-business set is derived from title/description keywords matching `veso|täydennyskoulutus|kouluttaja|keynote|webinaari|workshop`.
3. The correction spec explicitly warns against `translate sivuyhteys into another hidden heuristic` and against inferring membership from title regex. Switching authorities from `sivuyhteys` to `presentationContextGroups.veso-taydennyskoulutus` OR to `inferContexts`-derived `contexts=business` both fall under that warning.
4. No explicit canonical relationship field on presentation MDs identifies the `/kouluttaja/` audience today.

**`The legacy path cannot yet be safely deleted without defining or identifying an authoritative canonical relationship.`**

## Actions taken in this PR

Production files: **reverted to pre-PR state.**

- `src/_includes/related-presentations.njk` — **restored** (delete undone).
- `src/css/larux-page.css` — `.larux-section--presentations .related-presentations { ... }` selector **restored**.
- `src/fi/yritys.md` — `#viimeisimmat-esitykset` section **restored** to `{% include "related-presentations.njk" %}` with the original `relatedSivuyhteys="kouluttaja-sivu"` selection.
- `tests/rp-converge-01-company-presentations.spec.js` — **removed** (its assertions targeted the reverted production behavior).

Documentation: **kept as the audit outcome.**

- This implementation record (rewritten as an audit-only record).
- Three R1 doc amendments — updated to reflect Decision C and the fact that the legacy path remains on `main` under a documented canonical-relationship gap.

## Prevented regression

Shipping the original RP-CONVERGE-01 change would have made `presentationContextGroups.veso-taydennyskoulutus` — a regex-derived UI grouping — the authoritative membership rule for the `/kouluttaja/` presentation strip. That would have promoted a text-regex classification into a canonical-relationship position without any documented contract. RP-CONVERGE-01A prevents that regression.

## Non-goals reaffirmed

Neither RP-CONVERGE-01 nor RP-CONVERGE-01A changed any of the following:

- Canonical Content v1 (no field added / removed / redefined).
- The `contexts` vocabulary (`CONTEXT_ORDER`, `CONTEXT_META`, aliases, or `resolveContexts` logic).
- `inferContexts` behavior (specifically the `veso|täydennyskoulutus|kouluttaja|keynote|webinaari|workshop → business` rule).
- `presentationContextGroups.js` (kept as a UI-grouping layer for `/esitykset/`).
- The R1 shared `content-context-sidebar.njk` / `computeRelatedContent` filter.
- `semanticRelated.json`, `SEM_WEIGHT`, `SEM_MIN`, or the semantic layer boundary.
- Pagefind projections or the discovery pipeline.
- Public JSON contracts.
- Presentation URL/landing semantics (canonical `/presentations/{slug}/` for local, external URL for external-first — untouched).
- Any browser JS; the strip remains SSR / no-JS.

## Follow-up options (not part of this PR)

Options for a future, deliberately scoped decision:

1. **Editorial curation**: add explicit `contexts: ["business"]` declarations to the intended presentation MDs. This would move the `contexts=business` set from text-inference to editorial curation without any code change. RP-CONVERGE-01 could then re-use `contexts.includes("business")` as authority with strong coverage.
2. **Amend `inferContexts`**: broaden or narrow the business-context regex in `src/_data/contentContext.js` lines 189–199 based on documented editorial intent. Requires an architecture note because it changes canonical inference for other consumers (not just this strip).
3. **Retain the legacy strip indefinitely**: accept that `sivuyhteys="kouluttaja-sivu"` on the raw Canva import remains the operative selection. Document `sivuyhteys` as a scoped legacy editorial marker (not canonical membership) and leave the FI-only strip as-is.
4. **Remove the strip**: decide the marketing surface no longer needs a dynamic "latest coach presentations" section (the sibling `#esimerkit` curated section already shows examples). Deletion becomes justified because the section is dropped, not because the include was replaced.

None of these is a bounded slice on its own until an editorial owner picks an option.

## Tests

- Unit: `npm run test:unit` — **637 pass / 0 fail** (unchanged baseline; no production code changed relative to `origin/main`).
- Full build: still passes with unchanged baseline metrics (production restored to pre-PR state matches `origin/main` behavior).
- Targeted regression test removed (its assertions targeted the reverted production behavior).

## Architecture assessment

- **`presentationContextGroups` remains a derived UI grouping layer and is not used as canonical membership authority for the company presentation strip.**
- No parallel content-ownership path was removed; the legacy `canva.tableRows` + `sivuyhteys` path remains on `main` for now, documented as a live legacy consumer with a canonical-relationship gap (not orphan).
- No new content model, no new taxonomy, no new inferred-membership authority introduced.
- No AC1 reopen condition was triggered by either the original attempt (reverted before merge) or by this correction.

## AC1 assessment

**Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.** No reopen condition triggered:

- Duplicate content ownership: no new duplicate introduced (production reverted).
- Canonical semantics in browser JS: none added.
- Pagefind canonical storage regression: no change.
- Runtime JSON → HTML duplicating SSR: none added.
- Source / landing / context / public-contract regression: none.
- FI/EN parity: unchanged from `origin/main`.

**R1 remains `CLOSED / MAINTENANCE`.** R1's substantive conclusions are unchanged; only three factually stale "orphan" claims in R1-A / R1 closure / R1-ADR1 were corrected to reflect the discovered FI consumer and the Decision-C outcome.

## Stopping point

RP-CONVERGE-01A audit is complete when all six are true:

1. ✅ Legacy consumer identity on `main` verified (`src/fi/yritys.md:290`, `sivuyhteys="kouluttaja-sivu"`, 57 items).
2. ✅ Canonical alternative fields inspected (`contexts`, `type`, `source`, `categories`, `presentationContextGroups`) and coverage recorded.
3. ✅ Decision made and justified (Decision C, weak parity).
4. ✅ Production changes reverted; no unsafe replacement shipped.
5. ✅ R1-A / R1 closure / R1-ADR1 amendments updated to reflect Decision C (not the earlier "deletion completed" wording).
6. ✅ `presentationContextGroups` correctly classified as UI grouping, not canonical authority.

**No further RP-CONVERGE follow-up is scheduled in this workstream.** Any resumption depends on an explicit editorial or architecture decision per the "Follow-up options" section above.

---

## Final resumed implementation (2026-08-30)

PRES-CONTEXT1 (PR #170, merge `62327af0f2ac09c9e15c09b8cf5dd66995b50eb7`) supplied the previously missing editorial authority: 12 canonical Presentation MDs now explicitly declare `contexts: - business` in frontmatter. That closed the Decision-C blocker.

This section records the completed RP-CONVERGE-01 resume.

### Explicit membership authority

**The `/kouluttaja/` company Presentation strip selects only from Presentation MDs whose RAW frontmatter explicitly contains `contexts: - business`.** Inference-only business items (i.e., items that match `inferContexts()` line 189–199 text patterns but do not declare `business` in frontmatter) are **not eligible**.

The distinction between explicit and resolved contexts is preserved by reading raw frontmatter directly, not by consuming the eleventyComputed `data.contexts` (which is the union of explicit + inferred).

### Authoritative source

- New global data file `src/_data/presentationBusiness.js` reads every `src/presentations/*.md` frontmatter block via `js-yaml`, filters where `Array.isArray(fm.contexts) && fm.contexts.includes("business")`, sorts date-desc, and exposes `{ items, total }`.
- Each item exposes `{ file, baseName, title, date, pageUrl, externalUrl, sourceUrl }`. `pageUrl` defaults to `/presentations/{baseName}/` when frontmatter does not set it.
- No inference. No regex over titles. No `sivuyhteys` dependency. No consumption of `presentationContextGroups`.

### Selection semantics

```text
canonical Presentation Markdown
  → raw frontmatter contexts array
    → filter: explicit "business" member
      → sort: date descending
        → take: 3
          → inline SSR strip on /kouluttaja/
```

### Dataflow

**Before this resume**: `canva.tableRows | filter sivuyhteys.includes("kouluttaja-sivu") | sort by paakortti+date | related-presentations.njk (bespoke card + inline CSS)`.

**After this resume**: `presentationBusiness.items | take(3) | inline larux-example-card SSR loop`.

### Rendering

- Inline Nunjucks loop in `src/fi/yritys.md` §`#viimeisimmat-esitykset`. No new template partial introduced.
- Reuses the existing site-wide `larux-example-card` visual pattern (the same component already used by the sibling `#esimerkit` section on the same page).
- Card renders only: date (via `dateFormat`), title, canonical local landing link with `?returnTo=%2Fkouluttaja%2F` decoration.
- No category inference, no external/local URL resolution logic, no fallback chain, no presentation normalisation — all upstream in `presentationBusiness.js`.

### Landing / source semantics

- Every rendered `href` uses `item.pageUrl` — the canonical local `/presentations/{slug}/` detail landing per the Presentations Slice 3 closure.
- All 12 explicit-business MDs have a local canonical detail page (verified in build).
- External / source URLs (Canva, YouTube) are NOT surfaced on the strip. They remain accessible via each detail page's CTAs (source-first / local-first semantics preserved per Presentation closure).
- `?returnTo=%2Fkouluttaja%2F` is the site-wide O1 orientation contract used by `find-explore.js:633` and other returnTo-decorated flows. Not new.

### Deleted implementation

- `src/_includes/related-presentations.njk` — **deleted** (185 LOC including inline `<style>` block, 6 template parameters, `canva.tableRows` traversal, category-label map, external/local href fallback chain).
- `.larux-section--presentations .related-presentations` — **deleted** from `src/css/larux-page.css` (proven safe: no other consumer of `.related-presentations` class anywhere in the repo).
- Retained: `.larux-section--presentations` background rule + dark-mode variant — still consumed by the FI `#viimeisimmat-esitykset` section wrapper class.

Verified via repo-wide grep on `related-presentations`, `relatedSivuyhteys`, `relatedTitle`, `relatedLimit`, `relatedLinkHref`, `relatedLinkLabel`: no live production consumers remain (the `taxonomyProfiles.js` / `kategoriat.njk` `relatedTitle` references belong to a different domain — the taxonomy profile pages — and are not related to the deleted include).

### FI / EN parity

Deliberate FI-only asymmetry, documented:

- **FI `/kouluttaja/`**: canonical explicit-business strip renders 3 items.
- **EN `/en/company/`**: no equivalent dynamic strip; retains its manually curated "Examples of talks" section (mirroring the FI `#esimerkit`, not `#viimeisimmat-esitykset`).
- **Reason**: canonical presentation MDs are Finnish-only (0 files under `src/en/presentations/`). A dynamic EN strip would either link to Finnish landings or require fabricating EN presentation routes — both prohibited by the RP-CONVERGE spec non-goals. The FI/EN gap is a content-language-availability constraint, not accidental architecture drift.

### Retained legacy

- **`sivuyhteys` field processing** in `src/_data/canva.js`, `src/_data/canva-presentations.json`, `src/_data/presentationsPage.js`, and `src/_data/canvaMerged.js` — **retained**. This resume proves only that `/kouluttaja/` no longer depends on `sivuyhteys` for Presentation membership. Broader `sivuyhteys` consumer/public-contract audit is a separate future scope; not bundled here per §10 non-goals.
- **`presentationContextGroups.js`** — **retained and unmodified**. Continues to serve as derived SSR UI grouping for `/esitykset/` archive browsing (via `src/_includes/presentations/background-and-sources.njk`). Not consumed by `/kouluttaja/`.
- **`inferContexts()` in `src/_data/contentContext.js`** — **retained and unmodified**. Continues to add fallback context inference across the site (business, teaching, media, etc.). The 2 inference-only business items (`ss-designing-…`, `ss-lito2018-workshop-…`) documented in PRES-CONTEXT1 as REVIEW still resolve to `business` via inference for R1's `content-context-sidebar.njk` — but they are NOT eligible for the `/kouluttaja/` strip because the strip reads raw explicit frontmatter only.

### Tests

- **Unit** (`npm run test:unit`): all pass. Metadata regression from PRES-CONTEXT1 still valid.
- **Full build** (`CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og`): PASS. `[researchfi-integrity] OK`. `[seo-dashboard] OK`. Pagefind postbuild OK. Metric baseline unchanged (`presentationCanonicalTotal`, `presentationLocalLandingTotal`, `presentationExternalLandingTotal`).
- **Targeted Playwright** (`tests/rp-converge-01-resume-company-presentations.spec.js`, 5 assertions):
  1. FI `/kouluttaja/` renders exactly 3 `article.larux-example-card` items inside `#viimeisimmat-esitykset`.
  2. Every rendered href starts with `/presentations/` and contains `returnTo=%2Fkouluttaja%2F`.
  3. `javaScriptEnabled: false` — the strip and its 3 cards render without JS (SSR proof).
  4. The rendered file base-names are a subset of the known-explicit-business set (structural inference guard — proves inference-only items are excluded from the strip).
  5. No deleted-class remnants (`related-presentations-list` / `related-presentations-item`) appear in the built HTML.

### Documentation

- This document — updated to `COMPLETED AFTER PRES-CONTEXT1`.
- `docs/pres-context1-presentation-business-context-reconciliation-2026-08-30.md` — unchanged, preserved as the metadata-completion evidence.
- No stale "convergence blocked" wording remains on `main`.

### Architecture

- **Explicit canonical membership is now the sole authority for `/kouluttaja/` Presentation selection.**
- No inference, no regex, no legacy marker, no group projection determines membership.
- Duplicate content-ownership path removed (`canva.tableRows + sivuyhteys → bespoke card` → gone).
- Canonical Content v1 unchanged (metadata completion in PRES-CONTEXT1 only).
- R1 remains `CLOSED / MAINTENANCE`.
- **Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.**

### Stopping condition

RP-CONVERGE-01 resume is complete when all twelve are true:

1. ✅ Company strip membership uses explicit canonical `business` (raw frontmatter).
2. ✅ No title/filename regex determines membership.
3. ✅ No `sivuyhteys` determines membership.
4. ✅ No inference-only `business` item is eligible for the strip.
5. ✅ Section renders SSR/no-JS.
6. ✅ Landing semantics preserved (canonical local `/presentations/{slug}/` with O1 returnTo decoration).
7. ✅ FI/EN decision explicit (justified asymmetry).
8. ✅ `src/_includes/related-presentations.njk` deleted.
9. ✅ Legacy CSS selector safely deleted (proven no other consumer).
10. ✅ Unit tests / build / targeted Playwright green.
11. ✅ Docs updated (this document + no stale blocked-status wording elsewhere).
12. ✅ No broader Canva cleanup bundled (`sivuyhteys` ingest untouched).

---

## RP-CONVERGE-01B correction (2026-08-30)

RP-CONVERGE-01 resume (§"Final resumed implementation (2026-08-30)" above) introduced `src/_data/presentationBusiness.js` as the projection driving the `/kouluttaja/` strip. That file was a parallel Presentation reader — it re-parsed YAML frontmatter, reconstructed presentation fields, and re-derived URLs — duplicating logic already owned by the canonical Presentation pipeline (`src/_data/presentationSources.js` → `presentationsPage.js` → `presentations.11tydata.js`). Adding a second reader is exactly the parallel-content-ownership pattern that AC1 and Canonical Content v1 are meant to prevent.

**RP-CONVERGE-01B removes the parallel projection rather than replacing it.**

### Removed

- `src/_data/presentationBusiness.js` — **deleted** (69 LOC: file-walking + YAML parsing + URL derivation + date-sort duplicated the canonical pipeline).
- All template references to `presentationBusiness` in `src/fi/yritys.md`.
- All doc references retained only as historical description of the removed layer.

### Existing pipeline used

The `/kouluttaja/` strip now reads from the existing canonical Presentation collection (`collections.presentations`). The eleventyComputed layer on presentations (`src/presentations/presentations.11tydata.js`) exposes a new generic field:

```
declaredContexts = raw frontmatter contexts on the canonical Presentation record
```

This field is sourced from the existing canonical Presentation pipeline:

1. `src/_data/presentationSources.js` — `readLocalPresentationSources()` parses each `src/presentations/*.md` frontmatter once (canonical MD read; nothing added).
2. `src/_data/presentationsPage.js` — `enrichLocalPresentationDetailContexts()` was modified to preserve `declaredContexts` as a copy of the raw frontmatter `contexts` **before** the same function replaces `contexts` with the resolved (union) value. One-line addition.
3. `src/_data/presentationsPage.js` — `buildCanonicalPresentationPageRecords()` was modified to propagate `declaredContexts` through the record. Two-line addition mirroring the pattern already used for `contexts`.
4. `src/presentations/presentations.11tydata.js` — one new eleventyComputed line: `declaredContexts: (data) => getPresentationRecord(data)?.declaredContexts || []`. Uses the existing `getPresentationRecord()` accessor.
5. `src/fi/yritys.md` — filters `collections.presentations` where `item.data.declaredContexts` includes `"business"`, reverses (default collection order is date-asc), takes 3.

**No new file. No second YAML parse. No second URL resolver. No business-specific projection layer.**

### `declaredContexts` field semantics

`declaredContexts` is a **generic** projection field: it is the raw frontmatter `contexts` array as authored, without inference and without normalization applied by `resolveContexts()`. It is not business-specific and can be used by any downstream consumer that needs editorial-authority (declared) canonical context membership. It complements the existing `contexts` field (which continues to expose the resolved union).

**This is projection completeness within the canonical Presentation pipeline; not a new canonical field, not a Canonical Content v1 change.** The vocabulary and semantics of `contexts` are unchanged; `declaredContexts` merely preserves the pre-`resolveContexts` value so consumers that need explicit editorial authority (as `/kouluttaja/` does) do not fall back to inference.

### URL / landing semantics

The template uses `_p.url` — the canonical Eleventy page URL produced by the Presentation pipeline (permalink + input path resolution). No local-fallback reconstruction, no `"/presentations/" + basename` string building. The `?returnTo=%2Fkouluttaja%2F` O1 orientation decoration is appended as before.

### Deletion status (post-01B)

- ✅ `src/_data/presentationBusiness.js` — deleted.
- ✅ `src/_includes/related-presentations.njk` — remains deleted (from resume PR #171).
- ✅ `.larux-section--presentations .related-presentations` CSS selector — remains deleted.
- ✅ No replacement reader / parser / URL resolver / business-specific projection introduced.
- ✅ `sivuyhteys` ingest and `presentationContextGroups.js` untouched.
- ✅ `inferContexts()` untouched.
- ✅ Canonical Content v1 vocabulary and semantics unchanged.

### Tests

- Unit: `npm run test:unit` — pass. The PRES-CONTEXT1 metadata test remains valid (asserts on the same MDs, independent of the projection layer).
- Full build: `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og` — PASS. `[researchfi-integrity] OK`. `[seo-dashboard] OK`.
- Targeted Playwright (`tests/rp-converge-01-resume-company-presentations.spec.js`): pass. The **INFERENCE GUARD** test still holds — the rendered basenames are a strict subset of the known-explicit-business set. The test is independent of which projection layer supplies the items; it asserts the semantic outcome against the built HTML.

### Architecture (final)

```
canonical Presentation Markdown
  → src/_data/presentationSources.js (existing)
    → src/_data/presentationsPage.js (existing pipeline, +declaredContexts pass-through)
      → src/presentations/presentations.11tydata.js (existing, +declaredContexts eleventyComputed)
        → collections.presentations
          → src/fi/yritys.md (filter by declaredContexts includes "business", reverse, take 3)
            → SSR company presentation strip
              → canonical local /presentations/{slug}/ landing + O1 returnTo
```

**No parallel Presentation reader or business-specific data projection remains.**

- **The duplicate `presentationBusiness` projection has been removed rather than replaced.**
- **Canonical Content v1 remains unchanged.**
- **R1 remains `CLOSED / MAINTENANCE`.**
- **Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.**
