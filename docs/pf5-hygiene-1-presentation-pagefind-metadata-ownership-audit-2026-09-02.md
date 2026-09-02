# PF5-HYGIENE-1 — Presentation Pagefind metadata ownership audit

**Status:** AUDIT ONLY — no production changes made.
**Handoff:** Prior audit performed in a parallel Codex session ran out of context before the audit document could be written. This document consolidates Codex's reported findings + current-main reconciliation performed in this session.

## Baseline

| Stage | SHA | Purpose |
| --- | --- | --- |
| Initial evidence baseline (Codex) | `8568c5834240d7f53d45600d70eb10aee62e3bb8` | Source scan + clean build + Pagefind index inspection |
| Post JSONLD reconciliation | `f7a4a15946e276061fdb3cc6bacfc4f71b47301e` | PR #191 merged (`transcriptExcerpt` decode); did not touch Pagefind ownership |
| **Current final audit baseline** | **`7480945d9c9df250f9a0a53a58ce54c7b9e1fd08`** | PR #192 merged (removed 4 non-authored SlideShare records); did not touch Pagefind ownership |

### PR #191 impact on PF5 paths
`git diff` restricted to `scripts/_lib/presentationPagefind.js`, `scripts/run-pagefind.js`, `src/_includes/base.njk`, `src/_includes/_ldschema.njk`, `src/_data/presentationSources.js`: **empty**. Only `src/_data/presentationsPage.js` changed (added `decodeHtmlEntities` + `transcriptExcerpt` update) — description-decode fix, not Pagefind ownership.

### PR #192 impact on PF5 paths
`git diff` restricted to the same paths: **empty**. Deletion of four `src/presentations/ss-*.md` files affects inventory counts only.

**Therefore:** architectural / behavioral findings carry forward. Only counts require re-verification.

## Source ownership finding (carried from Codex)

Codex's source scan on `8568c583` confirmed the split ownership of Pagefind metadata for presentation URLs:

- Eleventy/Nunjucks base templates emit Pagefind `data-pagefind-filter` and `data-pagefind-meta` attributes during SSR render of local presentation detail pages (routes under `/presentations/ss-*/`).
- `scripts/run-pagefind.js` still consumes `scripts/_lib/presentationPagefind.js` to run a **postbuild mutation pass** that injects an equivalent block of metadata into built HTML before Pagefind indexes the tree.

Same local presentation HTML therefore has metadata attached via two independent paths:
1. In-flow SSR (Eleventy)
2. Postbuild in-memory injection (`presentationPagefind.js#injectPresentationPagefindMetadata`)

Verified on current main by inspecting `scripts/run-pagefind.js:56–59` (calls `injectPresentationPagefindMetadata`) and `src/src.11tydata.js` (adds `resolvePagefindPresentations()` metadata during SSR — PF5-G2 landing).

Carried forward: **duplicate local metadata ownership**.

## Current-main count reconciliation

Run via `rm -rf _site && DISABLE_OG_IMAGES=true CACHE_ONLY=true npm run build:local && DISABLE_OG_IMAGES=true node scripts/run-pagefind.js`:

| Metric | Codex (8568c583) | Current (7480945d) | Δ | Interpretation |
| --- | ---: | ---: | ---: | --- |
| `htmlDocumentsIndexed` | (not stated) | **1454** | — | −4 vs. pre-#192 total (1458) |
| `presentationScopeLocalDocuments` | 139 | **135** | −4 | Matches the 4 deleted local `.md` files |
| `presentationScopeCustomRecords` | 79 | **79** | 0 | Unchanged — 4 deletions were not external-first custom records |
| `presentationCanonicalTotal` | (218 baseline) | **214** | −4 | Matches PR #192 |
| `presentationLocalLandingTotal` | 138 | **134** | −4 | Matches 4 deletions |
| `presentationExternalLandingTotal` | (not stated) | **80** | 0 (assumed) | Unchanged — no external-first impact |
| `existingHtmlClassification.LOCAL_PREFERRED_WITH_LOCAL_HTML` | (not stated) | **134** | — | Consistent with local landings |
| `existingHtmlClassification.EXTERNAL_PREFERRED_WITH_USABLE_LOCAL_HTML` | 3 | **3** | 0 | **Same 3-record gap; identity preserved** |
| `existingHtmlClassification.EXTERNAL_PREFERRED_WITH_NO_SUITABLE_LOCAL_HTML` | (implied 77) | **77** | 0 | Custom-record set unchanged |

Confirms Codex's central architectural claim: **the 4 deletions changed local inventory only. The custom-record set (79) and the gap-record set (3) are unaffected.**

## 3-record external-first + usable-local-HTML gap — identified on current main

Reconstructed from `buildPresentationExistingHtmlAudit()` on current `main`:

| # | canonicalPresentationId | canonicalTitle | Year | sourceType | preferredLandingUrl | Codex hit |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `sdrdv3W33qRpdA8` | Tekoäly, ystävä vai vihollinen? (FIN) | 2025 | canva | `https://www.canva.com/d/sdrdv3W33qRpdA8` | not previously named |
| 2 | `o2KsaiK39PKEN2g` | AVI-koulutus – Tekoäly opetuksessa | 2024 | canva | `https://www.canva.com/d/o2KsaiK39PKEN2g` | **matches Codex's `tekoaly-opetuskaytto-avi-webinaari-2024` reference** |
| 3 | `videoSeries|https://www.youtube.com/playlist?list=PLDG0jxUrk8z19_ThqBiynpYG4g-mjwgpt|Jari Larun verkkolive` | Jari Larun verkkolive | 2020 | youtube (videoSeries) | `https://www.youtube.com/playlist?list=PLDG0jxUrk8z19_ThqBiynpYG4g-mjwgpt` | not previously named |

All three are `landingType === "externalSource"` with `candidate` present (i.e., there is a discoverable local HTML representation on the site), so their preferred landing points off-site (Canva or YouTube) while an internal detail-like page also exists. Codex reported the injected local-only Pagefind fields do **not** survive indexing because the injection sits under `<div hidden data-pagefind-ignore="all">…</div>` — verified in `scripts/_lib/presentationPagefind.js#buildPresentationPagefindInjection`.

**Carried forward:** these 3 records are not discoverable as `FindExplore:presentations` records; their internal pages index only as generic pages. **This is a pre-existing gap unrelated to PR #191/#192**, so it cannot be created or worsened by a decision to remove the local injection layer.

## Duplication observation (carried from Codex)

Codex tested the built Pagefind index against local-first detail pages and reported the duplicate ownership does NOT cause duplicate result rows or doubled facet counts (Pagefind coalesces metadata on the same URL).

Classification: **maintenance / build hygiene**, not a discovery regression today.

## Custom-record requirement (carried from Codex)

Codex verified that `buildPresentationCustomRecord` is the ONLY discovery path for the 77 items classified as `EXTERNAL_PREFERRED_WITH_NO_SUITABLE_LOCAL_HTML` (79 custom-record total minus 2 items that are external-first + custom-record + also has minimal HTML at odd shapes). Removing the custom-record path would break their discoverability entirely.

Any bounded simplification of the postbuild layer **must retain `buildPresentationCustomRecord`**.

Current-main custom-record count: **79** (unchanged from Codex baseline).

## `/data/presentations-page.json` consumer audit

Grep pattern: `presentations-page` in `src/`, `scripts/`, `tests/`.

| Consumer | Path | Type | Removal impact |
| --- | --- | --- | --- |
| Runtime browser | `src/_utils/contentPresets.js:50` (endpoint declaration `/data/presentations-page.json`) | ACTIVE | Removes the ContentEngine "presentationsPage" key. |
| Runtime browser | `src/js/presentations-page.js` (via `ContentEngine.prefetch("presentationsPage")`) | ACTIVE | Loses async filter/sort/paginate data. SSR archive fallback still renders, but interactive filter chips lose their data source. Playwright `tests/presentations-archive.spec.js:203–208` explicitly asserts fallback path. |
| Runtime browser | `src/esitykset.njk:15`, `src/en/presentations.njk:14` (loads `presentations-page.js`) | ACTIVE | Same as above. |
| Playwright test | `tests/presentations-archive.spec.js:208` (`page.route('**/data/presentations-page.json', …)`) | ACTIVE — tests fallback behaviour | Test would need rewrite if endpoint disappears. |
| Build-time Pagefind | `scripts/_lib/presentationPagefind.js:11, 84` (reads `_site/data/presentations-page.json`) | ACTIVE | If this file is removed, `readBuiltPresentationData()` fails. |
| Build-time audit | `scripts/audit-presentation-topic-mapping.js:73` | ACTIVE | Reports on topic coverage. |
| Build-time audit | `scripts/audit-presentation-context-projection.js:77` | ACTIVE | Reports on context projection. |
| Build-time audit | `scripts/audit-find-explore-f3.js:65` | ACTIVE | F&E regression audit. |
| Build-time audit | `scripts/audit-f4-research-built-output.js:319` | ACTIVE | Research-page audit. |
| Build-time audit | `scripts/audit-presentations-f3c-p6-built-output.js:91` | ACTIVE | Verifies canonical output. |
| Build-time audit | `scripts/audit-pf2-sisalto-facet.js:16` | ACTIVE (comment ref) | Sisältö facet audit. |
| Documented public contract | `docs/architecture-closure-1-0-closure-2026-08-29.md:142`, `presentations-media-architecture-closure-reconciliation-2026-08-28.md`, and multiple older docs | PUBLIC CONTRACT | Consumer audit required before any removal per AC1 closure §142. |

**Conclusion:** `/data/presentations-page.json` is **NOT a candidate for removal** in PF5-HYGIENE-1. It is a live runtime dependency (ContentEngine prefetch), a live build-time dependency (Pagefind postbuild + 6+ audit scripts), and a documented public contract. Its removal is contingent on P-OPEN-1 / P-OPEN-2 (SSR-full-Pagefind decision), explicitly deferred by earlier closure.

## `presentationPagefind.js` responsibility classification

| Function | Purpose | Consumers | Classification |
| --- | --- | --- | --- |
| `SITE_ROOT`, `PRESENTATIONS_PAGE_JSON`, `PRESENTATIONS_JSON` | Path constants | Internal | **KEEP** |
| `normalizeLocalUrl`, `normalizeAnyUrl`, `canonicalPresentationId`, `toArray`, `hasValue`, `uniqueStrings`, `buildPlainIndexText` | Helpers | Internal | **KEEP** |
| `walkHtmlFiles`, `buildHtmlRouteMap` | Enumerates built HTML files | `run-pagefind.js:120`, `buildPresentationExistingHtmlAudit` | **KEEP** — used by both custom-record and audit paths. |
| `readBuiltPresentationData` | Reads `_site/data/presentations-page.json` + `_site/data/presentations.json` | `buildPresentationExistingHtmlAudit` | **KEEP** — pagefind audit needs it. |
| `siteUrlForHtmlPath`, `collectRepresentationUrls`, `collectLocalHtmlDocuments`, `indexCandidatePriority`, `chooseIndexCandidate`, `buildIndexCandidateReason`, `buildExistingHtmlClassification`, `presentationLanguageFor`, `looksEnglishTitle`, `pagefindLanguageFor`, `sharedLocalHtmlResolutionScore`, `resolveSharedIndexCandidateConflicts`, `buildPresentationExistingHtmlRecord`, `localDetailStatus`, `buildPresentationExistingHtmlAudit` | Audit + classification | `run-pagefind.js` uses summary; internal to record construction | **KEEP** — required for custom-record generation targeting decisions, and for surfaced diagnostics `presentationCanonicalTotal`, `presentationLocalLandingTotal`, `presentationExternalLandingTotal`. |
| `buildPresentationPagefindFilters`, `buildPresentationPagefindMeta` | Compute filter/meta keys | Used by both the injection block AND the custom-record path | **REVIEW** — inputs to two different outputs. Deletion would need surgical extraction of the custom-record path. |
| `escapeHtml`, `escapeAttribute` | HTML escaping | Injection block | **DELETE IF OPTION A** — only used to build the injection HTML. |
| `buildPresentationPagefindInjection` | Emits `<div hidden data-pagefind-ignore="all">…</div>` block | `injectPresentationPagefindMetadata` | **DELETE IF OPTION A** — this is the block that doesn't survive Pagefind indexing on external-first pages and duplicates SSR meta on local-first pages. |
| `injectPresentationPagefindMetadata` | Mutates built HTML string | `run-pagefind.js:59` (per local HTML file) | **DELETE IF OPTION A** — the 135-pass postbuild HTML mutation on current main. |
| `extractTextFromHtml` | Strips HTML → text | Used by custom-record generation to derive `content` field | **KEEP** — required for custom records. |
| `buildPresentationCustomRecord` | Constructs custom Pagefind index record | `run-pagefind.js` custom-record loop (79 records on current main) | **KEEP** — this is the discovery path for the 77+ external-first + no-suitable-local items. Codex explicitly warned "any safe deletion will need to preserve this." |

**Option A = "remove local postbuild Pagefind metadata injection".** Under Option A, the DELETE-IF-OPTION-A functions become dead once `run-pagefind.js:56–59` drops the `injectPresentationPagefindMetadata` call. `buildPresentationPagefindFilters` and `buildPresentationPagefindMeta` would need to be retained (still called by `buildPresentationCustomRecord`).

Estimated deletion under Option A: **~50–70 LOC** in `presentationPagefind.js` (`buildPresentationPagefindInjection` + `injectPresentationPagefindMetadata` + `escapeHtml` + `escapeAttribute`) plus ~5 LOC in `run-pagefind.js` (the injection loop). Also removes **135 postbuild HTML DOM-mutation passes per full build** (parse + inject + serialize each local presentation HTML file).

## Performance context (from Codex)

- `node scripts/run-pagefind.js ≈ 7.06 s` on the previous baseline (Codex measurement).
- 139 local HTML mutation passes (was) → 135 on current main.
- 79 custom records (unchanged).
- **Do not claim 7.06 s savings** — that is the total run-pagefind time, most of which is Pagefind indexing itself. Actual Option A savings are the 135 DOM parse+serialize passes, which is a fraction of the total.

Safe simplification claim under Option A:
- Remove 135 unnecessary local HTML mutation passes per build
- Remove their DOM parsing / mutation / serialization work
- Retain full 79 custom-record generation

## Discovery gap risk under Option A

Codex's interpretation stands: because the 3-record external-first + usable-local-HTML gap already exists on current main under the injection layer (metadata sits under `data-pagefind-ignore="all"`), **removing the injection layer cannot create this gap**. The gap is pre-existing and unrelated to whether the injection runs.

If Option A is later executed, the 3 records will remain not-discoverable-as-`FindExplore:presentations` **exactly as they are today**, until a separate future workstream chooses to fix that gap. That is out of scope for PF5-HYGIENE-1.

## Deletion / simplification opportunities NOT taken in this audit

- `/data/presentations-page.json` public projection: **retained** — active consumers exist (ContentEngine + audits + tests + public contract).
- `slideshare-content.json` root file: **retained** — captured scraper data.
- Curated stubs `src/curated/slideshare/{id}.md`: **retained** — auto-regenerate from API cache anyway; orphan pointers with no active consumer.
- Fixing the 3-record discovery gap: **out of scope** — pre-existing, requires separate design decision.

## Bounded decision

**Choice:** `PF5-HYGIENE-1 READY — remove local postbuild Pagefind metadata injection; retain only justified external custom-record generation`

Justification:
- **Duplicate local metadata ownership** — Eleventy SSR already emits the same `data-pagefind-filter` / `data-pagefind-meta` keys that the postbuild injection re-adds.
- **Ineffective on external-first + local-representation pages** — injection sits under `<div hidden data-pagefind-ignore="all">…</div>` and does not survive Pagefind indexing (Codex-verified). It provides zero discovery value for the 3-record gap set on current main.
- **Custom-record path is orthogonal** — `buildPresentationCustomRecord` operates on a different set of items (77 external-first + no-suitable-local) and remains necessary.
- **No count regression from PR #191/#192** — architectural findings survive both merges; only inventory counts shifted.

## Not implemented

Per audit scope, no production changes. A future bounded PR (`PF5-HYGIENE-1-IMPL-01` or similar) would:
1. Remove `injectPresentationPagefindMetadata` call from `scripts/run-pagefind.js:56–59`
2. Delete the four functions marked **DELETE IF OPTION A** in `presentationPagefind.js`
3. Verify byte-parity for local presentation HTML (except the injected `<div hidden>…</div>` block)
4. Confirm custom-record count stays at 79
5. Confirm Pagefind result rows + facet counts unchanged
6. Update the `scripts/audit-presentation-pagefind.js` baseline if needed

## Architecture

- **Canonical presentation content remains authoritative.**
- **Eleventy/Nunjucks remains the SSR Pagefind metadata authority.**
- **`buildPresentationCustomRecord` remains the discovery path for external-first + no-suitable-local items.**
- **`/data/presentations-page.json` remains a public projection with active consumers.**
- **PF5 remains CLOSED / MAINTENANCE.**
- **AC1 remains CLOSED / GREEN / MAIN.**

## Verdict

`PF5-HYGIENE-1 READY — remove local postbuild Pagefind metadata injection; retain only justified external custom-record generation`

No production changes made. Implementation deferred to a bounded follow-up workstream.
