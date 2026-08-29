# R1-B1 — Thesis Related-Content Surface Convergence

Date: 2026-08-29
Status: `IMPLEMENTED / TESTS GREEN`

Adds the existing shared `content-context-sidebar.njk` include to Thesis
detail pages. Reuses the current production related-content infrastructure
without any scoring, semantic-infrastructure, canonical-content, or
client-side change. Follows R1-ADR1's decision to retain the pre-closure
semantic layer as bounded auxiliary ranking infrastructure.

## Baseline

- Branch: `feat/r1b1-thesis-related-content` (fresh from `origin/main`)
- Base HEAD: `95cf84ce8ae9787f87a8d6b945a6ed97b07307d0`
- Reference audits driving this change:
  - `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md` — Decision C, R1-B1 originally blocked pending R1-B0.
  - `docs/r1b0-semantic-related-content-reconciliation-audit-2026-08-29.md` — Decision B, escalated to R1-ADR1.
  - `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md` — Retain semantic layer as bounded auxiliary ranking infrastructure; R1-B1 unblocked.

## Exact template changed

**One file, one added include (plus a small explanatory comment):**

- `src/_includes/thesis-detail-body.njk` — added `{% include "content-context-sidebar.njk" %}` inside the existing `<aside class="col-lg-4">`, after the existing Thesis-specific metadata cards ("Details / Perustiedot", "Keywords / Avainsanat", "Research themes / Tutkimusteemat"), matching the placement pattern used by `publication-item-body.njk:122`.

## Why `thesis-detail-body.njk` is the correct integration point

`src/opinnaytteet/thesis-details.njk` is the paginated wrapper that provides `eleventyComputed` (categories, keywords, contexts, type, tags, lang) and ends with `{% include "thesis-detail-body.njk" %}`. The actual two-column layout with the right-hand `<aside class="col-lg-4">` lives in `src/_includes/thesis-detail-body.njk`. That aside is the semantically equivalent location to the Publications, Media, Blog, and Writings detail templates that already carry the shared sidebar. Adding the include inside the wrapper would place the sidebar outside the layout container; the correct scope is the body include.

## Reused shared include

The include is the same `src/_includes/content-context-sidebar.njk` used by:

- `src/_includes/publication-item-body.njk:122` — Publication detail
- `src/_includes/presentation-item.njk:109` — Presentation detail
- `src/_includes/media-item.njk:127` — Media detail
- `src/_includes/blog-post.njk:130` — Blog detail
- `src/_includes/writing-post.njk:188` — Writing detail

No new file was created. No new markup was added. No thesis-specific renderer was introduced.

## Data contract

The include reads page-scope variables:

- `categories`, `keywords`, `contexts`, `tags`, `type`, `lang`, `page.url`, `collections`.

`src/opinnaytteet/thesis-details.njk` already exposes these via `eleventyComputed`:

- `categories: data => data.thesisDetail?.categories || []`
- `keywords: data => data.thesisDetail?.keywords || []`
- `contexts: data => data.thesisDetail?.contexts || []`
- `type: () => "artikkeli"`
- `tags: () => ["publications", "thesis-detail"]`
- `lang: data => data.thesisDetail?.lang || "fi"`

`page.url` is provided by Eleventy from the wrapper's `permalink: data => data.thesisDetail?.pageUrl || false`. `collections` is a global Eleventy binding available to every template.

**Verified: the include receives the identical page-level data shape as on the other five consuming domains.** No new canonical field, no computed data shim, no thesis-specific adapter.

## No scoring changes

Unchanged files (grep verified):

- `eleventy.filters.js` (`computeRelatedContent`, `SEM_MIN`, `SEM_WEIGHT`, all weights, all tie-break logic)
- `src/_data/semanticRelated.json` (unchanged 641 KB)
- `scripts/build-semantic-related.js`
- `src/_includes/content-context-sidebar.njk`

Per R1-ADR1: R1-B1 is a surface-convergence slice only. Semantic ranking remains auxiliary; canonical candidates and destinations remain authoritative.

## No embedding changes

No embedding regeneration. No new embedding infrastructure. No online inference. No client-side vector work. Fully consistent with the R1-ADR1 boundary "New embedding/LLM infrastructure is not authorized".

## FI / EN validation

Both locales render the shared sidebar. Sample built pages:

- FI rich thesis `/opinnaytteet/62699/` (Riikonen 2026, 6-luokkalaisten matematiikka-ahdistus; 3 categories, 5 keywords, 2 contexts): sidebar present, 4 related items.
- FI rich thesis (5 categories, 7 keywords, 3 contexts): sidebar present, 4 related items.
- FI sparse thesis (1 category, 0 keywords, 2 contexts): sidebar present, 4 related items (contexts + type score still produce candidates).
- FI multi-context thesis (1 category, 4 keywords, 3 contexts): sidebar present, 4 related items.
- EN thesis (4 categories, 6 keywords, 3 contexts): sidebar present, 4 related items.

Locale labels (Katso myös / See also, Ei läheisiä… / No closely related items found yet.) come from the shared include's own `txt` block driven by `<html lang>`. No thesis-side translation duplication.

## Representative built-output validation

Full build (`CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og`) PASSED:

- Eleventy: `Copied 274 Wrote 1471 files`.
- `[researchfi-integrity] OK: 56 arkistojulkaisua`.
- `[seo-dashboard] OK | pages=1458 missingDescription=0 missingOgImage=0`.
- Postbuild Pagefind: unchanged (`presentationLocalLandingTotal: 138`, `presentationExternalLandingTotal: 80`).

Sample check across 5 representative thesis detail pages (rich / rich-2 / sparse / multi-context / EN) — all show `.content-context-sidebar` present, 4 related items rendered, zero self-references, all destinations canonical (either local `/opinnaytteet/…`, `/julkaisut/…`, `/mediassa/…`, `/YYYY/…` or OuluREPO handle URLs — never a URL fabricated only from `semanticRelated.json`).

## Tests

- `npm run test:unit` — **637 pass / 0 fail**.
- New spec `tests/r1b1-thesis-related-content.spec.js` — **3 pass / 0 fail**:
  1. FI thesis detail renders shared related-content sidebar with canonical destinations (asserts sidebar present, 1–4 related items, no self-reference, all hrefs are canonical destinations).
  2. Thesis related-content sidebar is present in server-rendered HTML with `javaScriptEnabled: false` (no-JS SSR proof).
  3. EN thesis detail also renders the shared sidebar.
- Existing `tests/th-cite1-phase4b-thesis-detail-modal.spec.js` — **11 pass / 0 fail** (thesis citation modal path still intact).
- Existing `tests/th-cite1-phase3-thesis-pagination.spec.js` — **4 pass / 1 pre-existing baseline failure** on `active thesis search replaces the same tbody and reset restores SSR rows and pagers` (line 123). Verified pre-existing by stashing the R1-B1 change and re-running against the base `main` at `95cf84ce`: same failure reproduces. Not caused by R1-B1 and not opened for fixing here.

## Deletion assessment

**No safe deletion opportunity was identified in R1-B1.**

- Per R1-ADR1: `src/_data/semanticRelated.json`, `scripts/build-semantic-related.js`, and the semantic branch in `computeRelatedContent` are retained pending future re-measurement. Not touched.
- `src/_includes/related-presentations.njk` orphan remains flagged for a separate convergence audit; not bundled with R1-B1 per the R1-A / ADR1 guidance.
- No thesis-side markup replaced; only additive one-line include.

## Architecture status

**R1-B1 reuses the existing SSR related-content infrastructure. No canonical, scoring, semantic-infrastructure, Pagefind, or client-side content-model changes were introduced.**

**Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.** R1-ADR1's boundary is respected: no new embedding / LLM infrastructure, canonical candidates and destinations remain authoritative, related content stays build-time / SSR.
