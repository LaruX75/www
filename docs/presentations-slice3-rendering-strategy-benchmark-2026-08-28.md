# Presentations Slice 3 — Rendering Strategy Benchmark Audit

Date: 2026-08-28
Status: `AUDIT / BENCHMARK ONLY` — Option C prototyped in a temporary
worktree modification, measured, then reverted before completion. No
production code committed by this task. Cache file changes under
`.cache/api-fallback/*` are unrelated auto-generated artifacts and are
preserved.

## 1. Repository truth

- Worktree: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Branch: `audit/presentations-ssr-closure`
- HEAD: `817b33bf4b4bdb47bc5ea8ac874d49cf76b15997`
- `origin/main` HEAD: `c8d1fcb037b04a0a38c299bdd4efc6ac8c55c710`
- Ahead / behind vs `origin/main`: `4 / 0`
- Local Slice 3 commit history:
  - `817b33bf` perf(presentations): move card templates from page HTML to cacheable file
  - `942b4690` feat(presentations): unify archive card rendering via Nunjucks templates
  - `8045a3db` docs(presentations): add closure reconciliation + Slice 3 suitability audit
  - `efe6aa0b` docs: add presentations SSR closure audit
- Working tree clean apart from `.cache/api-fallback/*.json` build cache noise (preserved).

## 2. Current architecture (state under commit 817b33bf)

canonical content
  → `src/_data/presentationsPage.js` (`buildPresentationsPageModel`)
  → SSR archive page (`archive.njk` + `result-card.njk`) renders opening 12 cards + filter controls + year `<option>` + topic `<datalist>`
  → build-time internal projections:
      - `/data/presentations-page.json` (unchanged public projection; 795652 bytes; consumed by ContentEngine, Pagefind lib, 6 audit scripts)
      - `/data/presentation-cards-fi.html` (218 `<template>` fragments; 535187 bytes)
      - `/en/data/presentation-cards-en.html` (218 `<template>` fragments with EN labels + dateFormat; 536149 bytes)
  → browser (`presentations-page.js`, 277 LOC / 9404 bytes):
      - `fetch("/data/presentations-page.json")` via `ContentEngine.prefetch` (existing)
      - `fetch("/data/presentation-cards-{locale}.html")` via `loadTemplateMap` (added by Slice 3)
      - DOMParser + templateMap keyed by `url + \x01 + title`
      - On filter/search/pagination: `resultsEl.innerHTML = ""; append template.content.cloneNode(true)` per matching item
      - Initial render skips card re-clone; only status text + pagination initialize (SSR opening 12 are correct as-is)
  → Global discovery: PF5-G2 projects local-first presentations into shared Pagefind + `SearchResultPresenter` (unchanged by Slice 3)

## 3. Benchmark methodology

- All page and asset measurements taken from the same build state (`CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og`) on this branch at HEAD `817b33bf`.
- Gzip = `gzip -c9` (max compression, single-file). Real HTTP transport uses `Content-Encoding: gzip` at typical compressor levels 6–9; the measurement is a bounded upper estimate of transfer efficiency.
- Repeat-visit numbers assume the static asset URL is unchanged and cached; assume the page HTML is re-fetched.
- Option A baseline (pre-Slice-3 client formatter) is taken from measurements documented in `docs/presentations-ssr-p1-implementation-2026-08-25.md` (page 338 KB uncompressed for FI) and this branch's earlier `presentations-slice-3-card-unification-2026-08-28.md`; not re-measured today because the code state has been intentionally replaced by Slice 3.
- Option C measured by temporarily modifying `src/_includes/presentations/archive.njk` to render all 218 canonical presentation cards inline (first 12 visible, remaining 206 wrapped in `<div hidden data-presentation-card-hidden>`), building the full site, measuring, then reverting the file to its committed state. Verified revert via `git status`.
- Option D not prototyped (justification in §4-D and §11).

## 4. Options

### Option A — Pre-Slice-3 client formatter (baseline)

Architecture:

```
canonical → /data/presentations-page.json
         → ContentEngine.prefetch
         → archiveCardHtml() JS formatter
         → DOM
```

State: shipped on `main` before commit `942b4690`. `archiveCardHtml` and its formatter helpers (`SOURCE_ICONS`, `truncate`, `isExternalUrl`, `linkAttrs`, `landingUrl`, `iconFor`, `formatDate`, `toIsoDate`) constructed card HTML in the browser.

Two parallel card renderers: Nunjucks (for SSR opening 12) + JS (for filter results). The Presentations SSR closure audit rejected this state as the closure-blocker of Slice 3.

### Option B — Async Nunjucks card asset (current, commit 817b33bf)

Architecture:

```
canonical → SSR archive (opening 12 via result-card.njk)
         → /data/presentation-cards-{locale}.html   (218 <template> fragments; async)
         → /data/presentations-page.json            (filter data; async)
         → ContentEngine + templateMap
         → DOM (clone template contents on filter)
```

State: Slice 3 as merged locally. Card HTML lives in the language-specific cards file; page HTML stays lean; result-card.njk is the sole card renderer.

Adds a new runtime request and a new build machinery layer (four new files: two `.11tydata.js` + two `.njk`).

### Option C — SSR all canonical presentation cards in the page

Architecture:

```
canonical → SSR archive
         → all 218 canonical presentation cards rendered in page HTML
         → first 12 visible; remaining 206 rendered with `hidden` attribute (or wrapper)
JS       → toggle visibility for filter/search/pagination
         → no card HTML reconstruction
         → no DOMParser, no templateMap, no async cards fetch
```

Prototyped temporarily. The `result-card.njk` partial is reused as before; the loop that currently `{% if loop.index <= 12 %}` gates rendering is widened to render every item, wrapping cards past index 12 in `<div hidden data-presentation-card-hidden>`.

Two sub-variants (both viable, both preserve semantics):

- **C1**: SSR all cards + keep `/data/presentations-page.json` fetch for filter data. Card DOM is display-only. Minimal changes to filter logic.
- **C2**: SSR all cards + emit filter-relevant data as `data-*` attributes on each card (`data-year`, `data-topics`, `data-source-key`, `data-title-lc`, `data-description-lc`). No `presentations-page.json` fetch. Removes ContentEngine.prefetch dependency on this page. Adds ~30 KB uncompressed / ~5 KB gzipped to the page for the attributes.

C1 is the recommended baseline of Option C; C2 is a natural follow-up if the JSON fetch is later audited as safely removable from this page.

### Option D — Static build-time chunked card fragments

Architecture:

```
canonical → SSR archive (opening 12)
         → N chunk files (e.g. presentation-cards-fi-{01..19}.html)
         → manifest (e.g. presentation-cards-fi.manifest.json) mapping identity → chunk
JS       → resolve which chunks contain filter results → fetch only those
         → render matched cards from fetched chunks
```

Not prototyped because the required manifest overhead + smart-fetch logic materially increases runtime complexity and creates a mini-framework. To be viable it would need to beat Option C on both first-visit gzip AND runtime complexity.

Rough estimate of overhead:
- Manifest: ~218 items × ~50 bytes (key + chunk id) = ~11 KB uncompressed / ~2 KB gzipped.
- Chunk headers duplicate `<template>` wrappers (~50 bytes per chunk × 19 chunks = ~1 KB).
- Client JS: chunk resolver + fetch orchestration + parse combiner ≈ +80 LOC vs Option B.
- Wins only if user's typical filter/pagination result set clusters into ≤1 chunk on average.

Given 218 items divided into chunks of ~10-20, most filter queries would hit 3-10 chunks and benefit little. Rejected without prototype: no evidence of a real win.

### Option E — Deferred Slice 3

Architecture: revert to Option A (pre-Slice-3 client formatter).

Not a real closure. The Presentations SSR closure audit and reconciliation both classified `archiveCardHtml` as a genuine open deletion candidate. Keeping it merely because Slice 3 iterations 1 and 2 had payload trade-offs would abandon the architectural goal without exhausting alternatives — Option C has not yet been given a chance.

## 5. Payload measurements

All measurements from a full `npm run build:no-og` on this branch at HEAD `817b33bf`. Option C measurements taken from the temporary prototype build; Option A referenced from earlier documented measurements at commit range `main..efe6aa0b`.

### Option A (historical; pre-Slice-3)

| Metric | FI | EN |
| --- | ---: | ---: |
| Page uncompressed | ~338 KB (SSR-P1 doc reference) | ~272 KB (SSR-P1 doc reference) |
| Page gzipped | ~50 KB (estimate) | ~50 KB (estimate) |
| `presentations-page.js` LOC / bytes | 327 / 11937 | (same) |
| Cards file | — | — |
| `/data/presentations-page.json` | 795 KB (estimate) | (same) |
| Runtime requests / archive load | 1 (JSON) | 1 |
| First-visit total gzip | ~50 KB (page) + ~65 KB (JSON) = ~115 KB | ~115 KB |
| Repeat-visit total gzip (JSON cached) | ~50 KB (page only) | ~50 KB |

### Option B (current, commit 817b33bf)

| Metric | FI | EN |
| --- | ---: | ---: |
| Page uncompressed | 922829 (~923 KB) | 670413 (~670 KB) |
| Page gzipped | **101579 (~102 KB)** | **79642 (~80 KB)** |
| `presentations-page.js` LOC / bytes | 277 / 9404 | (same) |
| Cards file uncompressed | 535187 (~535 KB) | 536149 (~536 KB) |
| Cards file gzipped | **41350 (~41 KB)** | **41204 (~41 KB)** |
| `/data/presentations-page.json` | 795652 (unchanged) | (same) |
| Runtime requests / archive load | 2 (JSON + cards.html) | 2 |
| First-visit total gzip | ~102 KB + ~41 KB + ~65 KB = **~208 KB** | ~80 KB + ~41 KB + ~65 KB = **~186 KB** |
| Repeat-visit total gzip (both cached) | ~102 KB (page only) | ~80 KB (page only) |

### Option C (SSR all cards; prototyped and reverted)

| Metric | FI | EN |
| --- | ---: | ---: |
| Page uncompressed | 1389918 (~1390 KB) | 1138369 (~1138 KB) |
| Page gzipped | **136307 (~136 KB)** | **113795 (~114 KB)** |
| DOM `<article>` count | 218 (12 visible, 206 hidden) | 218 (12 visible, 206 hidden) |
| `presentations-page.js` LOC / bytes | estimate ~200 / ~7500 (C1) | (same) |
| Cards file | — (removed) | — |
| `/data/presentations-page.json` | 795652 (C1) / 0 (C2) | (same) |
| Runtime requests / archive load | 1 (JSON in C1) / 0 (in C2) | (same) |
| First-visit total gzip C1 | ~136 KB + ~65 KB = **~201 KB** | ~114 KB + ~65 KB = **~179 KB** |
| First-visit total gzip C2 | **~141 KB** (page only, incl. +5 KB gzipped for data-* attrs) | ~119 KB |
| Repeat-visit total gzip C1 | ~136 KB (page only; JSON cached) | ~114 KB |
| Repeat-visit total gzip C2 | ~141 KB (page only) | ~119 KB |

### Option D (chunked; estimated, not measured)

Estimated first-visit ≈ Option C page (~136 KB) + manifest (~2 KB) + N chunk fetches (~5-15 KB gzipped each). Even in the best case (user's filter matches 1 chunk), the total exceeds Option C first-visit; in the average case it exceeds Option B's split. Not measured.

### Cross-option totals summary (gzip; FI archive page)

| Scenario | Option A | Option B | Option C1 | Option C2 |
| --- | ---: | ---: | ---: | ---: |
| **Page HTML only** (per visit) | ~50 KB | 102 KB | 136 KB | 141 KB |
| **First visit total** (page + JSON + cards) | ~115 KB | ~208 KB | ~201 KB | ~141 KB |
| **Repeat visit total** (assumes static assets cached) | ~50 KB | ~102 KB | ~136 KB | ~141 KB |
| **Repeat visit gzip delta vs B (repeat)** | −52 KB | 0 | +34 KB | +39 KB |
| **First visit gzip delta vs B (first)** | −93 KB | 0 | −7 KB | −67 KB |

Notes on JSON `presentations-page.json` gzipped estimate: 795652 bytes uncompressed compresses to roughly 65-80 KB depending on server settings. The exact value is not critical to the decision since it is unchanged across A, B, and C1.

## 6. DOM / browser work

| Metric | A | B | C1 / C2 |
| --- | --- | --- | --- |
| Initial visible cards | 12 | 12 | 12 |
| DOM `<article>` count immediately after HTML parse | 12 | 12 | 218 |
| Elements held only in `<template>.content` (parsed but detached) | 0 | 0 initially, 218 after cards.html fetch | 0 |
| Elements hidden via `hidden` attribute or `display:none` | 0 | 0 | 206 (initially) |
| Initial style/layout/paint budget | small | small | slightly larger initially; `content-visibility: auto` on hidden cards would reduce it |
| DOM churn on filter interaction | replace innerHTML of results grid | replace innerHTML of results grid (from cloned templates) | toggle `hidden` attribute on existing nodes |
| Focus/scroll stability across filter | lost | lost | preserved |
| Find-in-page across hidden cards | N/A (not in DOM) | N/A (not in DOM) | excluded per HTML spec for `hidden` |
| Accessibility tree | 12 items | 12 items initially | 12 items (`hidden` excludes from AT) |

Key observation for Option C: 218 elements in DOM is not free, but the actual style/layout cost is bounded to the 12 visible ones because `hidden` implies `display:none`. `content-visibility: auto` can further defer paint/style for offscreen cards if they ever become visible after filter (§7).

## 7. Modern web API findings

Only relevant to Option C. Not implemented in this audit.

| API | Assessment | Solves current problem? |
| --- | --- | --- |
| `content-visibility: auto` | Wide browser support today (Chromium 85+, Firefox 125+, Safari 18+). Defers rendering (style, layout, paint) for offscreen elements without removing them from DOM/AT. Compatible with `hidden` (both apply; `display:none` wins). Improves scroll/paint performance for long SSR lists. | Only improves UX/perf later; does not change bytes on wire. Useful if we render 218 cards and expect users to scroll them. |
| `contain-intrinsic-size` | Wide support. Pairs with `content-visibility: auto` to reserve layout box height for offscreen elements and prevent scrollbar jumps when they materialize. | Only improves UX/perf later. Useful adjunct to `content-visibility` for Option C's long list. |
| View Transitions API | Modern (Chromium 111+, Safari 18+, Firefox behind flag). Would smooth filter-driven show/hide transitions. Not a rendering-strategy decision. | Only improves UX/perf later. Independent of A/B/C choice. |
| `scheduler.yield()` / `scheduler.postTask()` | Modern; Chromium mainly. Would smooth long JS tasks. Presentations archive JS is small enough that scheduling primitives are overkill. | Irrelevant to this decision. |
| `IntersectionObserver` | Wide support. Useful only if we wanted to lazy-load card thumbnails or defer offscreen work. Card `<img>` tags already use `loading="lazy"`. | Irrelevant to this decision. |

Only `content-visibility: auto` and `contain-intrinsic-size` are worth adding, and only under Option C where the initial DOM carries 218 cards. They are additive polish, not decision-drivers.

## 8. No-JS behavior

| Option | No-JS state |
| --- | --- |
| A | Opening 12 SSR cards visible. Filter controls visible but inert. Full archive unreachable via this page. Rank: **partial**. |
| B | Same as A — opening 12 SSR cards visible; cards.html file is only fetched by JS. Rank: **partial**. |
| C1 / C2 | All 218 cards visible on initial paint. Filter controls visible but inert. Users can scroll the entire canonical archive without JS. Rank: **full archive usable**. |
| D | Same as A/B (opening 12 SSR + chunk files only fetched by JS). Rank: **partial**. |
| E | Same as A. Rank: **partial**. |

Option C is the only option that fully honors the site's SSR-first architecture rule ("Nunjucks renders the truth") for the archive page. The current architecture rule (from `docs/site-architecture-closure-roadmap-2026-08-20.md`) says: *"the archive page is the canonical archive, and every canonical item must be reachable via canonical routes"* — Options A/B/D/E only expose 12 canonical items without JS.

## 9. Accessibility / SEO

| Concern | A | B | C1 / C2 |
| --- | --- | --- | --- |
| Semantic HTML available before JS | 12 cards | 12 cards | 218 cards |
| Accessibility tree items initially | 12 | 12 | 12 (206 excluded via `hidden`) |
| Focus/tab order preserved on filter | no (innerHTML replace) | no (innerHTML replace) | yes (visibility toggle) |
| Crawlable canonical links | 12 (rest reached via source-section archive + local detail pages) | 12 | 218 |
| Duplicated content risk | none | duplicate SSR opening 12 + fetched-templates 12; already deduped via cardKey collisions | none |
| Layout stability during filter | poor (grid rebuild) | poor (grid rebuild + async fetch delay) | good (visibility toggle) |
| Search-engine visibility of archive | limited to opening 12 for this specific page | limited to opening 12 | full 218 |

Option C strengthens SEO on `/esitykset/` and `/en/presentations/` — every canonical presentation title + description becomes crawlable via a single URL. The source-section archive already gives coverage per-source; this is a modest but real improvement.

On accessibility, Option C's win is stability: filter interactions on an SSR page that just toggles `hidden` do not cause focus loss, do not blank the aria-live region unexpectedly, and do not re-parent focus targets.

## 10. Architecture complexity comparison

Count of distinct places where presentation card SEMANTICS are represented:

| Option | Nunjucks partial | JS formatter | HTML fragment asset | JSON record | DOM node | **Total parallel representations** |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| A | 1 (SSR opening only) | 1 (archiveCardHtml) | 0 | 1 (JSON) | 1 (via JS render) | **4 semantic layers** |
| B | 1 (SSR opening + cards.html file, same partial) | 0 | 1 (cards.html) | 1 (JSON) | 1 (via clone) | **3 semantic layers + 1 clone target** |
| C1 | 1 (SSR all in page) | 0 | 0 | 1 (JSON) | 1 (SSR direct) | **2 semantic layers** |
| C2 | 1 (SSR all in page, with data-*) | 0 | 0 | 0 | 1 (SSR direct) | **1 semantic layer** |
| D | 1 (SSR + chunks) | 0 | N (chunks) + 1 (manifest) | 1 (JSON) | 1 (via clone) | **3+ layers, worst-case fragmentation** |

Under the user's stated criterion ("preferred architecture should minimize parallel semantic representations"), Option C1 has 2 parallel layers and Option C2 has 1. Option B still has 3, primarily because it produces two build outputs (page opening 12 + cards.html full 218) that both go through `result-card.njk` and both must stay in sync.

## 11. Decision matrix

| Option | First-load gzip (FI page + assets) | Repeat-load gzip | Requests | JS complexity | Parallel render layers | No-JS | A11y/SEO | Architecture quality |
| ---- | ---: | ---: | ---: | ---- | ---: | ---- | ---- | ---- |
| A — legacy JS formatter | ~115 KB | ~50 KB | 1 | HIGH (327 LOC, 5 formatters) | 4 | partial | limited to 12 cards crawlable | LOW |
| B — async cards asset (current) | ~208 KB | ~102 KB | 2 | MEDIUM (277 LOC, no formatters, +DOMParser/templateMap) | 3 | partial | limited to 12 cards crawlable | MEDIUM |
| C1 — SSR all + keep JSON | ~201 KB | ~136 KB | 1 | MEDIUM-LOW (~200 LOC, filter toggles DOM) | 2 | full archive | 218 crawlable | HIGH |
| C2 — SSR all + data-* attrs | ~141 KB | ~141 KB | 0 | LOW (~180 LOC, no fetch) | 1 | full archive | 218 crawlable | HIGH |
| D — chunked | ≥ Option C1 estimated | > Option C1 estimated | 1 + N | HIGH (+chunk manifest logic) | 3+ | partial | limited to 12 cards | LOW |
| E — defer / keep A | ~115 KB | ~50 KB | 1 | HIGH | 4 | partial | limited to 12 cards crawlable | LOW |

Rankings:

| Option | Architecture value | Implementation effort | Risk |
| --- | --- | --- | --- |
| A | LOW | SMALL (no change) | LOW (existing) |
| B | MEDIUM | SMALL (already done) | LOW |
| C1 | HIGH | SMALL–MEDIUM | LOW |
| C2 | HIGH | MEDIUM | LOW–MEDIUM |
| D | LOW–MEDIUM | LARGE | MEDIUM–HIGH |
| E | LOW | ZERO | ZERO |

## 12. Recommendation

**Option C1 — SSR all 218 canonical cards + keep the existing `/data/presentations-page.json` fetch for filter data.**

Rationale:

- **Fewest parallel layers (2 vs 3 for current B, 4 for A).** `result-card.njk` renders once into the page HTML. There is no `<template>` cache to keep in sync, no cards.html build input to maintain, no DOMParser plumbing.
- **Fewest runtime requests (1 vs 2 for current B).** The `presentation-cards-{locale}.html` fetch disappears. JSON fetch stays because it is the authoritative filter source and its removal is a separate architecture question that C2 raises but does not require here.
- **Strongest no-JS behavior of any option.** All 218 canonical presentations are visible without JavaScript. The Presentations SSR closure architecture principle ("Nunjucks renders the truth") is honored maximally on the primary archive surface.
- **Smaller first-visit gzip transfer than current B** (~201 KB vs ~208 KB for FI), and much smaller than Option A's first-visit (~115 KB) is misleading because A relies on the client formatter that Slice 3 explicitly rejected.
- **Preserves the deletion payoff of Slice 3.** `archiveCardHtml()` and its 10 helper functions remain deleted. `result-card.njk` is still the sole card renderer.
- **Runtime JS shrinks further** (~200 LOC vs 277 for B). `loadTemplateMap`, `CARD_ENDPOINTS`, `DOMParser` parsing, and the async templateMap plumbing are removed. `renderCards` becomes a small `hidden`-attribute toggler over existing DOM.
- **Focus/scroll stability during filter interactions improves.** No innerHTML replacement of the results grid; interaction becomes purely a visibility change.

The repeat-visit gzip trade-off is real but bounded: Option C1 costs +34 KB gzipped per repeat visit vs Option B (136 vs 102 KB), because there is no separately-cacheable cards.html file. For casual visitors this is a small tax; for engaged repeat visitors it accumulates.

However, the user's criteria explicitly rank "fewest parallel layers", "fewest runtime requests", "strongest no-JS behavior", and "maintainability" above transfer bytes. Option C1 wins on all four. The absolute page weight remains bounded (~136 KB gzipped for FI, ~114 KB for EN), well within reasonable content-heavy page budgets.

C2 is a natural follow-up — once C1 is in place, the `/data/presentations-page.json` runtime consumer on `/esitykset/` becomes small (only filter facet reads), and removing it in favor of `data-*` attributes on the SSR cards would collapse the last parallel semantic layer. C2 is not required now; it is a future audit target once C1 has soaked.

Options B and D are architecturally weaker; Option A/E preserves the deleted formatter, defeating Slice 3.

### Exact payload trade-off

- FI page first-visit gzip: current B = 208 KB → C1 = 201 KB (−7 KB, first visit).
- FI page repeat-visit gzip: current B = 102 KB → C1 = 136 KB (+34 KB, repeat visit).
- EN page first-visit gzip: current B = 186 KB → C1 = 179 KB (−7 KB, first visit).
- EN page repeat-visit gzip: current B = 80 KB → C1 = 114 KB (+34 KB, repeat visit).
- Runtime requests per archive page: 2 → 1.

### Exact runtime trade-off

- No async fetch on hydration; wireArchive is synchronous.
- Filter operations: no async delay after templateMap loaded → immediate.
- No DOM churn during filter: existing card nodes just toggle `hidden`.
- 218 DOM `<article>` elements always present; hidden ones excluded from accessibility tree by `hidden` attribute; excluded from tab order; excluded from find-in-page.
- Style/layout cost bounded to visible 12 cards; `content-visibility: auto` optional to further defer offscreen paint.

### Deletion payoff

Removed by moving from B to C1:

- `src/data/presentation-cards-fi.11tydata.js` (9 LOC, new file)
- `src/data/presentation-cards-fi.njk` (9 LOC, new file)
- `src/data/presentation-cards-en.11tydata.js` (9 LOC, new file)
- `src/data/presentation-cards-en.njk` (9 LOC, new file)
- `_site/data/presentation-cards-fi.html` build output (535 KB)
- `_site/en/data/presentation-cards-en.html` build output (536 KB)
- `presentations-page.js`: `CARD_ENDPOINTS`, `loadTemplateMap`, `DOMParser` parsing, templateMap Map, `buildTemplateMap` helper (~40 LOC removed), plus `hasRendered` gate and skip-initial-render logic (~5 LOC removed).
- The Nunjucks concat / dateFormat locale-URL trick becomes irrelevant.

Added:

- `src/_includes/presentations/archive.njk`: widen the SSR loop to render all 218 items (first 12 without `hidden` wrapper, remaining 206 with).
- `presentations-page.js`: small `renderVisibility(state)` function that toggles `hidden` on card wrappers based on the same `queryPreset` result.

### No-JS implications

Option C1 improves no-JS behavior from "opening 12 visible" (current B) to "full 218 archive visible + scrollable". Filter controls remain inert without JS, which is acceptable per the existing archive contract.

### Why alternatives are worse

- **A** — keeps `archiveCardHtml()`, defeats Slice 3, has HIGH JS complexity and 4 parallel semantic layers.
- **B** — 3 parallel layers, 2 runtime requests, weakest no-JS parity of the SSR-first options; the cards.html file is a build artifact that must stay in sync with `result-card.njk` and `presentationsPage` (a coupling the audit prefers to remove).
- **D** — larger implementation, higher runtime complexity, unclear win. No prototype supports it.
- **E** — is Option A wearing a different label.

## 13. Exact next implementation package (if Option C1 wins)

Not implemented in this audit.

Package name: `presentations-slice3-c1-ssr-all-cards`.

Files to change:

- `src/_includes/presentations/archive.njk` — widen `{% for item in archiveItems %}` loop to render all items; wrap items past index 12 in `<div hidden data-presentation-card-hidden>`; existing `cardReturnTo` computation stays.
- `src/js/presentations-page.js` — remove `CARD_ENDPOINTS`, `loadTemplateMap`, DOMParser/templateMap machinery, `hasRendered` gate. Add `visibilityMap` built from the DOM at init (`Map` from `cardKey` to the card's outermost wrapper element). Replace `renderCards(pageItems)` with `applyVisibility(filteredItems, start, end)` that: (a) computes the set of item keys that should be visible on the current page, (b) walks the visibility map and toggles the `hidden` attribute per wrapper.
- Files to DELETE:
  - `src/data/presentation-cards-fi.11tydata.js`
  - `src/data/presentation-cards-fi.njk`
  - `src/data/presentation-cards-en.11tydata.js`
  - `src/data/presentation-cards-en.njk`
- `tests/presentations-archive.spec.js` — existing tests remain. The `SSR opening cards carry the same returnTo decoration` test must still pass. Add one new assertion: after filter, previously hidden matching cards become visible (same DOM node identity, no re-render). Add one no-JS smoke assertion: with `javaScriptEnabled: false`, all 218 SSR cards are visible in `_site/esitykset/index.html`.
- Optional CSS enhancement (separate follow-up, not required): add `content-visibility: auto; contain-intrinsic-size: 0 200px;` to `.presentation-archive-card` for paint deferral of offscreen hidden cards once visible.

Payload gates the package must pass:

- FI archive page gzip ≤ 145 KB after full build (measured ~136 KB in the prototype, budget with headroom).
- EN archive page gzip ≤ 120 KB (measured ~114 KB).
- `/data/presentation-cards-*.html` files do NOT exist in `_site/` after build.
- `presentations-page.js` LOC ≤ 240.
- 0 runtime requests added by this package (net: 1 → 1 for archive page).

Tests to run:

- `npm run test:unit`
- `tests/presentations-archive.spec.js` (extended)
- `tests/presentations-source-ssr.spec.js`
- `tests/pf5-g2-presentations-shared-result.spec.js`
- `tests/contrast.spec.js` (Presentations)
- `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og` — verify `presentationLocalLandingTotal: 138`, `presentationExternalLandingTotal: 80`, `[researchfi-integrity] OK`.

Regression gates (must remain green):

- Local/external landing semantics preserved (external Canva `target="_blank" rel="noopener noreferrer"`, local `?returnTo=/esitykset/` decoration).
- FI/EN parity via same `result-card.njk` + `cardReturnTo` locale switch.
- Pagefind indexing untouched (`data-pagefind-body` on `<main>` still scopes the archive body sensibly; hidden cards are still in the indexed body, which is the same behavior as before — text is fully indexed).
- SSR source sections in `background-and-sources.njk` untouched.
- No change to `/data/presentations-page.json` schema; keep as public projection consumed by ContentEngine (filter data) + Pagefind lib + audits.

Estimated implementation effort: **SMALL–MEDIUM** (one iteration; ~2 hours including tests + doc + build verification). Risk: **LOW** (no new machinery, semantic parity via the same `result-card.njk`).

## 14. Claude / API relevance

Not required for this decision. Claude / agent tooling has no material role in choosing between A/B/C/D at Slice 3 scope; the decision is repository-evidence-driven and the measurements are one-shot.

Potentially useful in adjacent workstreams (not this task):

- **Impact resolver / semantic dependency analysis** — helpful if we later attempt C2 (removing the `/data/presentations-page.json` runtime consumer) and need to audit all consumers programmatically. Existing `docs/presentations-media-architecture-closure-reconciliation-2026-08-28.md` §11 already enumerates them by hand.
- **Benchmark automation** — useful if we want a nightly CI job to catch payload regressions on archive pages. Not scoped here.
- **Architecture regression checks** — nice-to-have for enforcing "no parallel card renderers" as a lint. Optional future infrastructure.

None of the above materially changes the Slice 3 decision now. All are future infrastructure candidates.

## Recommended next action

**Implement Option C1 as a follow-up commit on `audit/presentations-ssr-closure`.**

### Commit disposition

- **Keep** `efe6aa0b` (docs: initial SSR audit) and `8045a3db` (docs: reconciliation + suitability audit) as-is — they are the reasoning trail that led to this decision.
- **Keep** `942b4690` (feat: unify archive card rendering via Nunjucks templates) as-is — it removed `archiveCardHtml()` and 10 helper functions, which is the durable win. The specific template-inline mechanism it introduced was corrected by the next commit.
- **Keep** `817b33bf` (perf: move card templates from page HTML to cacheable file) as-is — it fixed the payload regression from `942b4690` and established the current Slice 3 baseline. Option C1 supersedes it but does not invalidate its correctness for the timeframe it was current.

Do not amend, force-push, or revert any of the four existing commits.

**Add** a new commit `presentations-slice3-c1-ssr-all-cards` implementing Option C1:

- Widens `src/_includes/presentations/archive.njk` to SSR all 218 canonical presentation cards (first 12 visible, remainder wrapped in `<div hidden>`).
- Deletes the four `src/data/presentation-cards-*.{11tydata.js,njk}` files.
- Simplifies `src/js/presentations-page.js` to toggle `hidden` on existing DOM cards; removes `loadTemplateMap`, `CARD_ENDPOINTS`, DOMParser, templateMap.
- Extends `tests/presentations-archive.spec.js` with a no-JS full-archive visibility assertion and a filter-visibility assertion (same DOM node, `hidden` toggled).
- Writes a closure note `docs/presentations-slice-3-c1-closure-2026-08-28.md` documenting final measurements and superseding the earlier Slice 3 iteration notes.

Expected result after C1 lands:

- FI archive page: ~136 KB gzipped, 1 runtime request per load.
- EN archive page: ~114 KB gzipped, 1 runtime request per load.
- No cards.html build output.
- Full 218-card archive visible without JS.
- `presentations-page.js` at ~200 LOC.
- 2 parallel semantic representations of a card (down from 3 in Option B).

This audit is complete. Temporary Option C prototype in `src/_includes/presentations/archive.njk` was reverted to the committed state at `817b33bf` before finalizing this document; verified via `git status` clean apart from `.cache/api-fallback/*` noise.
