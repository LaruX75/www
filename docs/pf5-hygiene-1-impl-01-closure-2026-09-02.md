# PF5-HYGIENE-1-IMPL-01 — Closure

**Status:** PROVEN
**Date:** 2026-09-02
**Base SHA:** `8cdbf4a04ad31253cba0bdde0b6e09fc489ebfd1`
**Authoritative audit:** `docs/pf5-hygiene-1-presentation-pagefind-metadata-ownership-audit-2026-09-02.md`

## Authorized change (per audit decision)

> `PF5-HYGIENE-1 READY — remove local postbuild Pagefind metadata injection; retain only justified external custom-record generation`

## Before / after architecture

### Before

Two independent metadata-ownership paths for the same 135 local presentation URLs:

```
Path 1 (SSR):
canonical presentation data
 → src/src.11tydata.js resolvePagefindPresentations()
 → Eleventy/Nunjucks
 → data-pagefind-filter / data-pagefind-meta baked into rendered HTML

Path 2 (postbuild, DELETED):
built local presentation HTML on disk
 → run-pagefind.js addHtmlFiles loop
 → injectPresentationPagefindMetadata()
 → <div hidden data-pagefind-ignore="all" data-presentation-pagefind-scope="presentations">
     <span data-pagefind-filter=…></span>
     <span data-pagefind-meta=…></span>
   </div>
 → in-memory content string handed to Pagefind
```

Path 2 was **redundant** on local-first pages (same keys already in SSR) and **ineffective** on the 3 external-first + local-representation gap records (block sat under `data-pagefind-ignore="all"` and was skipped by Pagefind's indexer).

### After

Single metadata owner for local HTML plus untouched custom-record path for external-first items with no suitable local HTML:

```
LOCAL PRESENTATION HTML
canonical presentation data
 → Eleventy/Nunjucks
 → SSR HTML + Pagefind metadata (unchanged from PF5-G2)
 → Pagefind

EXTERNAL-FIRST WITHOUT SUITABLE LOCAL HTML  (unchanged)
canonical presentation data
 → buildPresentationCustomRecord()
 → Pagefind custom record
```

## Deleted functions / call sites

### `scripts/_lib/presentationPagefind.js`

- `escapeHtml` (7 LOC)
- `escapeAttribute` (3 LOC)
- `buildPresentationPagefindInjection` (14 LOC)
- `injectPresentationPagefindMetadata` (7 LOC)
- Exports of both `buildPresentationPagefindInjection` and `injectPresentationPagefindMetadata`

Net: **−36 LOC**.

### `scripts/run-pagefind.js`

- Removed `injectPresentationPagefindMetadata` from destructured `require(…)` at top of file.
- Removed the `presentationScopeByUrl` parameter from `addHtmlFiles`.
- Removed the `presentationScope` lookup + `injectPresentationPagefindMetadata` call inside the file loop.
- Removed the `presentationScopeByUrl` argument at the `addHtmlFiles` call site inside `main()`. `localScopeRecords` remains computed because it is still used for the `presentationScopeLocalDocuments` summary metric.

Added: 5-line comment header on `addHtmlFiles` explaining the deletion and pointing to PF5-G2 as the single metadata owner.

Net: **~−6 LOC** after subtracting the comment header (`+11` insertion, `−15` deletion, 4 of which were argument-relocations).

Verified via `rg` — **zero remaining references** to `buildPresentationPagefindInjection`, `injectPresentationPagefindMetadata`, or `data-presentation-pagefind-scope` in `scripts/`, `src/`, or `tests/`.

### Retained (per audit)

- `buildPresentationCustomRecord` — sole discovery path for 77 external-first + no-suitable-local items.
- `buildPresentationPagefindFilters` / `buildPresentationPagefindMeta` — still consumed by `buildPresentationCustomRecord`.
- `buildPresentationExistingHtmlAudit` / `buildHtmlRouteMap` / `collectLocalHtmlDocuments` / `chooseIndexCandidate` / `extractTextFromHtml` — required for custom-record generation + summary metrics.

## Counts before / after (invariant proof)

Same canonical dataset (main @ `8cdbf4a0…` → branch head).

| Metric | Before | After | Δ | Notes |
| --- | ---: | ---: | ---: | --- |
| `htmlDocumentsIndexed` | 1454 | **1454** | 0 | Same HTML set indexed |
| `presentationScopeLocalDocuments` | 135 | **135** | 0 | Metric preserved via `localScopeRecords.size` |
| `presentationScopeCustomRecords` | 79 | **79** | 0 | **Critical invariant** — custom-record path untouched |
| `presentationCanonicalTotal` | 214 | **214** | 0 | |
| `presentationLocalLandingTotal` | 134 | **134** | 0 | |
| `presentationExternalLandingTotal` | 80 | **80** | 0 | |
| `EXTERNAL_PREFERRED_WITH_USABLE_LOCAL_HTML` gap | 3 | **3** | 0 | Pre-existing debt, unchanged |

## 3 known gap records — unchanged / out of scope

The three external-first + usable-local-HTML records identified in the audit remain unchanged on current main. Because the deleted injection was already ineffective for them (its output sat under `data-pagefind-ignore="all"`), removing it cannot regress their state:

1. Canva `sdrdv3W33qRpdA8` — *Tekoäly, ystävä vai vihollinen? (FIN)* (2025)
2. Canva `o2KsaiK39PKEN2g` — *AVI-koulutus – Tekoäly opetuksessa* (2024)
3. YouTube playlist `PLDG0jxUrk8z19_ThqBiynpYG4g-mjwgpt` — *Jari Larun verkkolive* (2020)

Fixing these gaps is deliberately out of scope for PF5-HYGIENE-1 per the audit.

## `/data/presentations-page.json` unchanged

Not touched — retains 11+ live consumers per the audit's consumer table. Public contract intact.

## Pagefind parity

- `presentationScopeCustomRecords` count identical: **79 = 79** (custom records generated + indexed).
- `pf5-g2-presentations-shared-result.spec.js` — 5/5 pass. This is the shared presenter test for PF5-G2 presentations, exercising the exact metadata that SSR now uniquely owns.
- `presentations-archive.spec.js` — 26/26 pass.
- `presentations-source-ssr.spec.js` — 2/2 pass.
- Total focused presentation-related Playwright: **33/33 pass**.

No duplicate result regression, no filter regression, no research-context regression, no canonical landing URL change.

## Built HTML marker proof

Post-deletion:

```
rg 'data-presentation-pagefind-scope="presentations"' _site  → 0 matches
```

(Was also 0 before, because the injection was in-memory only and never written to disk — the marker only ever appeared in Pagefind's index. Its absence from the index is what proves the deletion took effect; verified indirectly via the `pf5-g2` presenter test still passing.)

## Verification

- `git diff --check`: clean
- `npm run test:unit`: **704 / 704 pass**
- `npm run build:local` + `run-pagefind.js`: succeeds
- `npm run check:i18n-seo`: OK for 1454 HTML files
- `npm run check:jsonld`: exit 0 (only `article-headline-length: 63` baseline; `html-entity-leak: 0` still preserved from JSONLD-ENTITY-01)
- `npm run check:researchfi-integrity`: OK
- Focused Playwright (presentation + Pagefind): 33/33 pass

## Deletion metrics

- **Production LOC deleted (net):** ~42 (36 from `presentationPagefind.js` + ~6 from `run-pagefind.js`)
- **Functions deleted:** 4 (`escapeHtml`, `escapeAttribute`, `buildPresentationPagefindInjection`, `injectPresentationPagefindMetadata`)
- **Local HTML mutation passes before:** 135 per build
- **Local HTML mutation passes after:** **0**
- **Custom records before/after:** 79 / 79 (invariant preserved)

## Not measured

Timing of `run-pagefind.js` — not framed as a performance win. Primary benefit is architectural (single metadata owner for local HTML, less postbuild mutation, less duplicate responsibility) rather than latency.

## Architecture

- `PF5-HYGIENE-1 = CLOSED / GREEN / MAIN` (after this PR merges)
- `Presentations = CLOSED / MAINTENANCE`
- `PF5 = CLOSED / MAINTENANCE`
- `Architecture Closure 1.0 = CLOSED / GREEN / MAIN`

No canonical, taxonomy, contexts, source/landing, or public JSON semantics changed. No client-side content model touched. Deletion-only implementation.
