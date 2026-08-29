# Presentations Slice 3 — Option C1 SSR-All-Cards Closure

Date: 2026-08-29
Status: `IMPLEMENTED / TESTS GREEN`

Follows the benchmark decision in
`docs/presentations-slice3-rendering-strategy-benchmark-2026-08-28.md`
(Option C1). Supersedes the runtime `presentation-cards-*.html` asset
mechanism introduced in `817b33bf`.

## Baseline

- Branch: `audit/presentations-ssr-closure`
- Base HEAD before this change: `817b33bf4b4bdb47bc5ea8ac874d49cf76b15997`
- `origin/main` HEAD at start: `c8d1fcb037b04a0a38c299bdd4efc6ac8c55c710`
- Ahead / behind vs `origin/main` (pre-commit): `4 / 0`
- Reference audits driving this change:
  - `docs/presentations-ssr-closure-audit-2026-08-24.md`
  - `docs/presentations-media-architecture-closure-reconciliation-2026-08-28.md`
  - `docs/presentations-archive-pagefind-suitability-audit-2026-08-28.md`
  - `docs/presentations-slice3-rendering-strategy-benchmark-2026-08-28.md`

## Architecture decision

**Option C1 — SSR all canonical presentation cards, keep `/data/presentations-page.json` for filter state, JavaScript only toggles visibility of existing DOM nodes.**

The full decision rationale and A/B/C/D/E comparison lives in the benchmark document. This closure records the implementation, verified measurements, and remaining architecture debt.

Not opened, not changed:

- Canonical Content v1
- `/data/presentations-page.json` schema (795652 bytes, unchanged)
- Pagefind projection / hygiene / custom-records path
- Shared `search-result-presenter.js` presenter
- FI/EN partition contract
- External-first landing semantics
- Research contexts semantics

## Implementation

Files changed:

- `src/_includes/presentations/result-card.njk` — outer `<article>` now carries `data-presentation-card-url="{{ cardBaseUrl }}"` and `data-presentation-card-title="{{ item.title or '' }}"` for stable JS identity. No other change (`cardReturnTo`, description truncation, external-first `target="_blank" rel="noopener noreferrer"`, source label, badges, topic chips, date/type/event meta all preserved).
- `src/_includes/presentations/archive.njk` — the SSR loop no longer gates rendering to the first 12 items. Every canonical `presentationsPage.items` entry is rendered once via `{% include "presentations/result-card.njk" %}`. Canonical date-desc ordering preserved (`sort(attribute="date", reverse=true)`).
- `src/js/presentations-page.js` — rewritten to operate exclusively on existing SSR DOM. See "JavaScript delta" below.
- `tests/presentations-archive.spec.js` — extended with C1 assertions: JS hydration reduces visible set to page size; a card outside the SSR opening 12 becomes visible via filter; the same DOM node persists across filter transitions (probe-attribute check); a runtime JSON fetch failure falls back to the complete SSR archive; the no-JS context exposes the full canonical archive with usable local + external anchors.

Files deleted:

- `src/data/presentation-cards-fi.11tydata.js`
- `src/data/presentation-cards-fi.njk`
- `src/data/presentation-cards-en.11tydata.js`
- `src/data/presentation-cards-en.njk`

Build outputs no longer produced:

- `_site/data/presentation-cards-fi.html`
- `_site/en/data/presentation-cards-en.html`

Consumer audit for the deleted machinery (regex-searched across `src/`, `scripts/`, `tests/`, `.eleventy.js`, excluding `node_modules`):

- `presentation-cards-fi` → 0 remaining references
- `presentation-cards-en` → 0 remaining references
- `CARD_ENDPOINTS` → 0 remaining references
- `loadTemplateMap` → 0 remaining references
- `archiveCardHtml` → 0 remaining references

## JavaScript delta

`src/js/presentations-page.js` before → after:

- Removed: `CARD_ENDPOINTS`, `loadTemplateMap`, `buildTemplateMap`, DOMParser usage, templateMap Map plumbing, `renderCards` (innerHTML rebuild + template clone), the `hasRendered` first-render skip gate, per-render fragment clone loop.
- Added: `cardKeyForNode(node)` (reads two data-* attrs, joins via `KEY_SEP`), `collectCards(root)` (DOM query), `applyInitialPagination(root)` (sync pre-fetch pagination), `showAllCards(root)` (fallback restore), `renderVisibility()` (toggles `hidden` on cards by visibility set) replacing the previous `renderCards`.
- Retained: `ensureDeps`, `localeFor`, `labelsFor`, `normalizeForMatch`, `exactTopicMap`, `renderPagination`, `updateArchiveStatus`, `archiveItemsForState`, filter/search/reset listener wiring.

## Progressive-enhancement design

Contract: **Before JavaScript successfully initializes, the complete canonical archive is usable.**

Sequence at page load:

1. Browser paints the SSR archive: 218 canonical `<article>` cards, all visible, all with usable primary links (title + primary CTA).
2. `presentations-page.js` init runs on `DOMContentLoaded`.
3. **Synchronous step (before any async work):** `applyInitialPagination(root)` walks the archive cards in canonical order and sets `hidden` on cards past `ARCHIVE_PAGE_SIZE` (12). This minimises flash between paint and enhancement.
4. Asynchronous step: `ContentEngine.prefetch("presentationsPage")` fetches `/data/presentations-page.json`.
5. On success: `wireArchive(root, items)` wires filter/search/pagination listeners and calls `renderVisibility()` (matches SSR opening 12 in default state, so no visual change).
6. On failure (network error, non-array response, empty response): `showAllCards(root)` restores every canonical card to visible, and filter listeners never attach. Documented in code and covered by a Playwright test (see below).

Without JavaScript, steps 3–6 never run; the SSR archive stays fully visible.

## Preserved semantics

Verified via existing and new tests:

- Canonical identity per card via `data-presentation-card-url` + `data-presentation-card-title` (composite key covers the 4 duplicate landing URLs in the current canonical set).
- `pageUrl`, `sourceUrl`, `externalUrl`, `landingUrl`, `landingType`, `localPageUrl` semantics untouched (still owned by `buildPresentationsPageModel`).
- Local-first archive cards: title link + primary CTA go to `/presentations/...?returnTo=/esitykset/` (FI) or `/en/presentations/` (EN). Verified by `SSR opening cards carry the same returnTo decoration`.
- External-first archive cards (Canva/SlideShare/YouTube/AOE): `target="_blank" rel="noopener noreferrer"` preserved. Verified by `filtered external-first card preserves target=_blank and rel` and the no-JS test (external Canva anchor keeps `target/rel` in raw SSR HTML).
- FI/EN parity: both include the same `result-card.njk` via `archive.njk` with only locale-specific labels + `cardReturnTo` differing.
- Research membership: unchanged; still only canonical `contexts` (no topic inference).
- Description truncation: build-time via Nunjucks `truncate(180, true, "...")`.

## Measurements

Measurements taken from `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og` on this branch.

### Network

| Metric | SSR-P1 (`main`) | Iter 1 (`942b4690`) | Iter 2 (`817b33bf`) | **C1 (this)** |
| --- | ---: | ---: | ---: | ---: |
| FI page uncompressed (bytes) | ~338270 | 1458098 | 922829 | **1426409** |
| FI page gzipped (bytes) | ~50000 (est) | 142345 | 101579 | **138891** |
| EN page uncompressed (bytes) | ~272372 | 1206644 | 670413 | **1174860** |
| EN page gzipped (bytes) | ~50000 (est) | 119729 | 79642 | **116228** |
| `/data/presentations-page.json` (bytes) | 795652 | 795652 | 795652 | **795652 (unchanged)** |
| `/data/presentations-page.json` (gzip est) | ~65 KB | ~65 KB | ~65 KB | ~65 KB |
| FI cards.html (bytes) | — | — | 535187 | **— (deleted)** |
| FI cards.html (gzipped bytes) | — | — | 41350 | **— (deleted)** |
| EN cards.html (bytes) | — | — | 536149 | **— (deleted)** |
| EN cards.html (gzipped bytes) | — | — | 41204 | **— (deleted)** |
| Runtime requests per archive load | 1 (JSON) | 1 (JSON) | 2 (JSON + cards.html) | **1 (JSON)** |
| First-visit total, FI gzip (page + JSON + cards) | ~115 KB | ~207 KB | ~208 KB | **~204 KB** |
| Repeat-visit total, FI gzip (JSON + cards cached; page re-fetched) | ~50 KB | ~142 KB | ~102 KB | **~139 KB** |

Explicit breakdown of what is HTML vs JSON vs JS on a fresh visit to `/esitykset/`:

- HTML (`_site/esitykset/index.html`): 1426 KB uncompressed / **139 KB gzipped**.
- JSON (`/data/presentations-page.json`): 795 KB uncompressed / **~65 KB gzipped**.
- JS (page-specific: `presentations-page.js`): 9 KB uncompressed. Combined with shared `content-engine.js` and `content-presets.js` (loaded on this and other archive pages) the JS payload is small compared to HTML+JSON.
- No cards HTML file, no runtime card-rendering asset.

### JavaScript

| Metric | Pre-Slice-3 | Iter 1 | Iter 2 | **C1** |
| --- | ---: | ---: | ---: | ---: |
| `src/js/presentations-page.js` LOC | 327 | 248 | 277 | **269** |
| `src/js/presentations-page.js` bytes | 11937 | 8087 | 9404 | **8821** |
| Client-side HTML formatter functions | 5 | 0 | 0 | **0** |
| DOMParser / templateMap / async cards fetch machinery | 0 | 0 | present | **0** |
| Filter/search/reset listener wiring | present | present | present | present |

The +21 LOC vs the smallest historical figure (248 in `942b4690`) is spent on: `applyInitialPagination`, `showAllCards`, the failure-fallback branch in `init`, and `cardKeyForNode`. No card HTML construction or template parsing remains.

### DOM

| Metric | Iter 2 | **C1** |
| --- | ---: | ---: |
| Cards in SSR markup (FI) | 12 | **218** |
| Cards in SSR markup (EN) | 12 | **218** |
| Cards visible before JS enhancement | 12 (SSR) | **218 (SSR)** |
| Cards visible after successful JS initialization | 12 | **12** |
| Cards inside `<template>.content` (parsed but detached) | 218 (after cards.html fetch) | **0** |
| Duplicate card renderers in shipped HTML | 1 (SSR opening 12) + 218 (cards.html file) | **1 (SSR 218)** |
| Duplicate card DOM nodes at any time | 0 | **0** |

### Architecture

Semantic card renderers remaining: **one — `src/_includes/presentations/result-card.njk`**.

`/data/presentations-page.json` remains a filter/state data source and is NOT a card renderer.

`SearchResultPresenter` (in `src/js/search-result-presenter.js`) remains the global-discovery card renderer for Pagefind results on `/haku/` and `/en/search/`. It is a distinct surface (global search) with its own contract (PF5-G2) and is unchanged by this slice.

## Test results

All tests run against the freshly built `_site/` on this branch.

### Unit

- `npm run test:unit` — **637 pass / 0 fail** in ~1.2 s.

### Playwright — Presentations archive (extended)

`tests/presentations-archive.spec.js` — **18 pass / 0 fail** (9 scenarios × 2 pages) in ~53 s.

Scenarios per page (FI + EN):

- `shared archive discovery works for canonical presentations` (existing; count assertions updated to `:not([hidden])` for the C1 visibility model)
- `filtered external-first card preserves target=_blank and rel` (existing)
- `SSR opening cards carry the same returnTo decoration as filtered cards` (existing; snapshot-based, now covers all 218 SSR cards)
- `description text on the shared card is truncated to the archive limit` (existing; `$$eval` snapshot for O(n) speed at 218 cards)
- **`JS hydration reduces visible archive to the initial page size`** (new — asserts `applyInitialPagination` runs)
- **`a card outside the initial page becomes visible via filter`** (new — proves filter reaches beyond SSR opening 12)
- **`filter interactions reuse the same SSR DOM nodes (no rebuild)`** (new — probe-attribute test proves no innerHTML rebuild)
- **`.../data/presentations-page.json fetch failure falls back to full SSR archive`** (new — `page.route` intercepts JSON fetch with 500, asserts every card becomes visible)
- **`complete canonical archive visible without JS`** (new — `test.use({ javaScriptEnabled: false })`, asserts total > 12 and ≥ 200 cards, no card SSR-hidden, external `target/rel` preserved, local `returnTo` preserved)

### Playwright — sibling regressions

- `tests/presentations-source-ssr.spec.js` — **3 pass / 0 fail** (10 s). Source-section SSR path unchanged.
- `tests/pf5-g2-presentations-shared-result.spec.js` — **12 pass / 0 fail** (7 s). Global-search presenter path unchanged.
- `tests/contrast.spec.js` (`--grep "Presentations"`) — **2 pass / 0 fail** (~1.7 min). FI + EN button contrast unchanged.

### Full build

- `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og` — **PASS**.
- Eleventy: `Copied 273 Wrote 1471 files`.
- Postbuild: `presentationScopeLocalDocuments`, `presentationScopeCustomRecords`, `presentationLocalLandingTotal: 138`, `presentationExternalLandingTotal: 80`.
- `[researchfi-integrity] OK: 56 arkistojulkaisua`.
- `[seo-dashboard] OK | pages=1458 missingDescription=0 missingOgImage=0`.

### Baseline failures

Two pre-existing baseline failures on `origin/main` remain unchanged and are not caused by this slice (documented earlier in `presentations-slice-3-card-unification-2026-08-28.md`):

- `tests/o1-orientation.spec.js:122` — `FI media detail exposes shared O1 hub return…`. Targets `/mediassa/…`, does not touch presentations.
- `tests/presentations-research-smoke.spec.js:4` — uses the pre-PF5-A2/A3 `#searchOverlay .pagefind-ui__search-input` selector.

Neither is a new regression.

## Final architecture

```text
canonical presentations
        ↓
Eleventy / Nunjucks
        ↓
src/_includes/presentations/result-card.njk
        ↓
complete SSR archive (218 cards in page HTML)
        ↓
/data/presentations-page.json  →  filter/state data only
        ↓
presentations-page.js  →  visibility / pagination / URL state only
```

## Deleted architecture

Runtime HTML / card-rendering paths removed:

- **Client-side card renderer**: `archiveCardHtml()` and its formatter helpers (removed in `942b4690`; stays removed).
- **Async cards HTML asset path**: `/data/presentation-cards-fi.html` and `/en/data/presentation-cards-en.html` (introduced in `817b33bf`, removed here). Build inputs `src/data/presentation-cards-{fi,en}.{11tydata.js,njk}` deleted.
- **Client template plumbing**: `CARD_ENDPOINTS`, `loadTemplateMap`, `DOMParser` usage, `templateMap` Map, `renderCards` innerHTML replace, `hasRendered` first-render skip gate (all removed from `presentations-page.js`).
- **`presentation-cards-fi` / `presentation-cards-en`** references — grep confirms 0 remaining references outside deleted files and this closure doc.

## Remaining Presentations architecture debt

Only items with current repository evidence, per the P-OPEN-1 audit §12 "What would move the decision to B":

1. **PF5-G2 vs `scripts/_lib/presentationPagefind.js` injection duplication**: local-first presentations get filter/meta from two producers (Eleventy computed projection and postbuild injection). Neither breaks anything, but choosing one owner is unfinished hygiene. Repository-evidenced in the P-OPEN-1 audit §3.
2. **Shared presenter external-URL hardening**: `SearchResultPresenter` still lacks `target="_blank"` / external badge for Pagefind results with external URLs. Only relevant if a future audit approves routing external-first presentations through the shared presenter. Not needed for the current Slice 3 closure. Repository-evidenced in the P-OPEN-1 audit §5 and §12.
3. **`data-pagefind-sort="date:..."` missing from Presentations detail pages**: repository-evidenced observation. Only relevant if a later discovery / Pagefind workstream needs date-based sorting for presentations. Not a Slice 3 blocker.
4. **`/data/presentations-page.json` public-contract consumer audit**: needed only if a future workstream wants to reduce or drop this runtime dependency. Currently 6 audit scripts + `scripts/_lib/presentationPagefind.js` + `presentations-page.js` consume it. No repository evidence justifies opening this now.
5. **`content-visibility: auto` polish for the archive card list**: optional paint-performance optimization for the 218-card SSR grid. Not required for correctness. If added, `contain-intrinsic-size` would pair with it for scrollbar stability. Not opened by this closure.

Items 1–4 are follow-up audit candidates; item 5 is an optional CSS polish. None of them belongs in this Slice 3 commit.

## Commit disposition

Existing commits kept as-is (per benchmark audit's "Commit disposition" recommendation):

- `efe6aa0b` docs: SSR closure audit — reasoning trail.
- `8045a3db` docs: reconciliation + suitability audit — decision inputs.
- `942b4690` feat: unify archive card rendering via Nunjucks templates — removed `archiveCardHtml` and 10 formatter helpers.
- `817b33bf` perf: move card templates from page HTML to cacheable file — payload fix for `942b4690`, superseded by C1 but valid for the timeframe.

New commit added:

- `perf(presentations): render archive cards once in SSR` — C1 implementation + closure doc.

No push, no PR.
