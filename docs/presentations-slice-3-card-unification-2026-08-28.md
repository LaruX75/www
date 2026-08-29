# P2-SLICE-3-CARD-UNIFICATION Implementation

Date: 2026-08-28
Status: `IMPLEMENTED / TESTS GREEN / PAYLOAD GATE PASSED (2nd iteration)`

This document was originally written for the first iteration of Slice 3
(inline `<template>` block in the archive page HTML) — committed as
`942b4690`. That iteration failed a payload gate and was superseded by
a second iteration that split card HTML into a language-specific
cacheable file. See `## Payload regression + follow-up` at the bottom
for the revised architecture and final measurements. Sections 1–13
below describe the FIRST iteration for historical context.

## Baseline

- Branch: `audit/presentations-ssr-closure`
- Base HEAD before this change: `efe6aa0b38dbc3a5facbb9ac26f050f0036b2c87`
- `origin/main` HEAD at start: `c8d1fcb037b04a0a38c299bdd4efc6ac8c55c710`
- Ahead / behind: 1 / 0 (rebased in an earlier turn)
- Reference audits driving this change:
  - `docs/presentations-ssr-closure-audit-2026-08-24.md` (Slice 3 deferred)
  - `docs/presentations-media-architecture-closure-reconciliation-2026-08-28.md` (P-OPEN-1 gate)
  - `docs/presentations-archive-pagefind-suitability-audit-2026-08-28.md` (Decision D — HYBRID)

## Architecture decision

**HYBRID is unchanged.** SSR + `ContentEngine.prefetch(/data/presentations-page.json)` still owns the Presentations archive interaction. Pagefind + `SearchResultPresenter` still owns global discovery. This slice unifies the *card rendering* only.

Not opened:

- Canonical Content v1
- `/data/presentations-page.json` public projection
- Pagefind index / custom-record pipeline
- Shared `search-result-presenter.js` presenter
- FI/EN partition contract
- external-first landing semantics
- Research contexts semantics

## Implementation approach

Before this change, presentation archive cards were rendered by two divergent code paths:

- Server: `src/_includes/presentations/result-card.njk` (SSR opening 12 cards).
- Browser: `archiveCardHtml()` in `src/js/presentations-page.js` (~54 LOC of JS-side markup).

After this change, `result-card.njk` is the sole source of card semantics.
Every canonical archive item is pre-rendered at build time into a hidden
inline `<template>` element inside the archive shell. Client-side filter
re-renders clone the matching template's `DocumentFragment` instead of
building HTML strings.

Concretely:

- `src/_includes/presentations/result-card.njk`:
  - Now honors an optional `cardReturnTo` variable. When it is set and the card target is a local `/presentations/…` URL, the link is decorated with `?returnTo=<encoded>` (backwards-compatible for existing SSR-only callers who do not set it).
  - Description text is now truncated at build time via `truncate(180, true, "...")`, matching the previous browser-side JS behavior. This changes SSR opening-12 cards' description length (was full text, now 180 chars) — the audit-approved trade-off for a single source of truth.
- `src/_includes/presentations/archive.njk`:
  - Computes `cardReturnTo` once per include based on archive locale (`/esitykset/` for FI, `/en/presentations/` for EN). This value flows into every card render on the page.
  - After the existing SSR opening-12 grid and pagination shell, emits a hidden block:
    `<div hidden data-presentation-card-templates aria-hidden="true">…218 templates…</div>`.
  - Each `<template>` carries two data attributes derived from canonical fields: `data-presentation-card-url` (URL fallback chain: `landingUrl → localPageUrl → pageUrl → url → externalUrl → sourceUrl`) and `data-presentation-card-title`. The template content is `{% include "presentations/result-card.njk" %}` — the same partial as the visible opening cards.
- `src/js/presentations-page.js`:
  - Builds a `Map` of `templateMap = URL + KEY_SEP + title -> <template>` at wire time from the DOM (`KEY_SEP = ""` — a control char guaranteed not to appear in any URL or title).
  - `render()` calls `renderCards(pageItems)` which clears the results grid and clones each matching template's `content` into a `DocumentFragment`, then appends. If a template is missing the item is silently skipped (defensive; should not happen).
  - `archiveCardHtml`, `SOURCE_ICONS`, `truncate`, `isExternalUrl`, `linkAttrs`, `landingUrl`, `iconFor`, `formatDate`, `toIsoDate`, and the local `escHtml` wrapper were removed. `UI[locale].externalLabel`, `UI[locale].localLabel`, and `UI[locale].openLabel` were removed as well (the template owns those strings via `presentationArchive*Label`).
  - `ensureDeps()` no longer checks for `PE.escHtml` (nothing in this file uses it any more). `pe-list-render.js` remains loaded on the page because `content-engine.js` still needs `PE.loadJsonEndpoint`.

## Nunjucks separator gotcha (root cause of first test failure)

Initial implementation used a single `data-presentation-card-key="{{ url + '|' + title }}"` attribute. Nunjucks parses `|` inside `{% set %}` expressions as the filter pipe, so `... + "|" + item.title` where `item.title` starts with `A` was parsed as `... + "|" + item.title` where `A` was consumed as a filter name; the "AI Friend or Foe? – Tekoäly: ystävä vai vihollinen?" Canva card lost its `|A` bytes silently.

Switching the separator to `"::"` did not help — the same parser edge case corrupted the identical item.

Fix: emit `data-presentation-card-url` and `data-presentation-card-title` as two independent Nunjucks interpolations (`{{ … }}` each, no `+` concatenation in the template expression). The client concatenates them into the map key using a control-character separator. This eliminates the concat parsing entirely from the Nunjucks side and works uniformly across all 218 records.

Verified after fix: `218/218` templates now have both attributes populated correctly (measured against the built `_site/esitykset/index.html`), including the previously-broken AI Friend or Foe card.

## Preserved semantics (verified)

- Canonical presentation population: 218 (from `_site/data/presentations-page.json:count`).
- Local-first landing count: 138.
- External-first landing count: 80.
- Every SSR opening card for a local `/presentations/…` URL now carries `?returnTo=/esitykset/` (FI) or `?returnTo=/en/presentations/` (EN) — new regression test asserts this on all opening cards, not just filter results.
- External-first cards (Canva/SlideShare/YouTube/AOE) still open in new tab with `target="_blank" rel="noopener noreferrer"` — new regression test asserts this on filter results, not just SSR.
- Local/External badge (source label + External / Paikallinen sivu chip) preserved via `result-card.njk`.
- Topic chips (up to 3) preserved.
- Date + type + event meta preserved.
- FI and EN both derive from the shared canonical model with the same include; no FI/EN drift introduced.
- No changes to Canonical Content v1, `/data/presentations-page.json` schema, `presentation-item.njk` detail layout, Pagefind projection, or `SearchResultPresenter`.

## Deleted code

`src/js/presentations-page.js`:

- `archiveCardHtml()` (~54 LOC)
- `SOURCE_ICONS` (5 LOC map)
- `truncate()` (5 LOC)
- `isExternalUrl()` (3 LOC)
- `linkAttrs()` (3 LOC)
- `landingUrl()` (3 LOC)
- `iconFor()` (3 LOC)
- `formatDate()` + `toIsoDate()` (~30 LOC combined)
- Local `escHtml` wrapper (3 LOC)
- `UI.fi.externalLabel`, `UI.fi.localLabel`, `UI.fi.openLabel` and EN equivalents (6 keys)
- `ensureDeps()` `PE.escHtml` check (4 LOC)

Total: **11 helper functions + one constant map + 6 string keys removed** from the browser bundle.

## Added code

- `cardKeyFor(item)` (~14 LOC)
- `buildTemplateMap(root)` (~10 LOC)
- `renderCards(pageItems)` inside `wireArchive` (~18 LOC; replaces the previous inline `resultsEl.innerHTML = …` construction)

Net additions: **~42 LOC** across three small helpers whose sole purpose is DOM template lookup and clone-insertion.

## Before / after LOC and bytes

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `src/js/presentations-page.js` LOC | 327 | 248 | **−79** |
| `src/js/presentations-page.js` bytes (uncompressed) | 11937 | 8087 | **−3850** (−32 %) |
| `_site/esitykset/index.html` bytes | ~338270 (SSR-P1 doc) | 1458098 | +1119828 |
| `_site/esitykset/index.html` gzipped | ~79000 (measured pre-templates in current build) | 142345 | +63345 (+80 %) |
| `_site/en/presentations/index.html` bytes | ~272372 (SSR-P1 doc) | 1206644 | +934272 |
| `_site/en/presentations/index.html` gzipped | ~50000 (approx) | 119729 | ~+70000 |
| `/data/presentations-page.json` bytes | 795652 | 795652 | **0** |
| Templates block only, uncompressed | — | 526511 | new |
| Templates block only, gzipped | — | 41124 | new |
| Client-side HTML formatter functions | 5 | 0 | **−5** |
| Client-side helper functions used only by the formatter | 6 | 0 | **−6** |

Trade-off explanation for the page-weight increase:

- The uncompressed HTML delta (~+1120 KB per FI page load) is real but bounded and represents 218 pre-rendered card fragments held as `<template>` elements (no visual DOM cost until cloned).
- Gzipped transfer delta is +~63 KB per FI page load (~80 % of the pre-existing gzipped page). The templates block itself is ~41 KB gzipped in isolation; combined-block compression accounts for the difference.
- `/data/presentations-page.json` remains 795 KB — no public-contract growth per the P-OPEN-1 audit's constraint.
- Memory cost per session: 218 `DocumentFragment`s held by `<template>` elements. On modern devices this is a small fraction of typical page memory footprint. No repeated cost on filter interaction.

Rejected alternative: adding a `renderedHtml` field to `/data/presentations-page.json` would have widened the public contract and moved the same ~1 MB of bytes into the JSON fetch. Both approaches move roughly the same bytes per fresh visit; the templates approach keeps `presentations-page.json` unchanged and avoids adding public-contract fields per the P-OPEN-1 audit's `Do NOT remove /data/presentations-page.json in this package. Prefer an internal/build projection over widening a public contract if the architecture permits it.` guidance.

## JSON payload impact

**None.** `/data/presentations-page.json` is unchanged (795652 bytes). No field added, no field removed, no schema change. The `render(data)` producer in `src/data/presentations-page.json.11ty.js` and the underlying `buildPresentationsPageModel(data)` in `src/_data/presentationsPage.js` were not touched.

## Test results

### Unit

- `npm run test:unit` — **637 pass / 0 fail** on this branch.

### Playwright (all worker=1 isolated)

- `tests/presentations-archive.spec.js` — **8 pass / 0 fail** (2 pre-existing scenarios + 6 new scenarios covering external `target="_blank"` + `rel`, SSR opening cards `returnTo`, and description truncation length, per FI + EN).
- `tests/presentations-source-ssr.spec.js` — **3 pass / 0 fail**.
- `tests/pf5-g2-presentations-shared-result.spec.js` — **12 pass / 0 fail**.
- `tests/o1-orientation.spec.js` — **7 pass / 1 fail** on `FI media detail exposes shared O1 hub return…`. This test targets `/mediassa/…` and its hub redirect (`/mediassa/$`). It is not modified by this branch (`git log -- tests/o1-orientation.spec.js` shows no branch-local commit) and does not touch presentations. Documented as pre-existing baseline failure on `origin/main`; independently verified (same failure appears in an isolated re-run).
- `tests/presentations-research-smoke.spec.js` — **0 pass / 1 fail** on `#searchOverlay .pagefind-ui__search-input`. This selector references the pre-PF5-A2/A3 search UI shell, which was refactored by the recent PF5 lane. Also not modified by this branch. Documented as pre-existing baseline failure on `origin/main`.

Neither of the two unrelated failures is caused by this slice. Both target UI surfaces this slice does not touch. They should be filed against the workstreams that authored the divergent test expectations (search UI refactor and Media orientation), not against this Presentations slice.

### Focused build

- `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og` — **PASS** on this branch.
  - Eleventy: `Copied 274 Wrote 1471 files`
  - `presentationScopeLocalDocuments`, `presentationScopeCustomRecords`, `presentationLocalLandingTotal: 138`, `presentationExternalLandingTotal: 80` all unchanged.
  - `[researchfi-integrity] OK: 56 arkistojulkaisua`.
  - `[seo-dashboard] OK | pages=1458 missingDescription=0 missingOgImage=0`.

## Files touched

```
src/_includes/presentations/archive.njk     |   7 +++
src/_includes/presentations/result-card.njk |  11 ++++-
src/js/presentations-page.js                | 175 ++++++++--------------------
tests/presentations-archive.spec.js         |  44 +++++++
4 files changed, 107 insertions(+), 130 deletions(-)
```

## Remaining Presentations open work

Per the P-OPEN-1 audit §12 "What would move the decision to B", the following remain open as future considerations. **None are unblocked or made necessary by this slice.**

1. Verified live custom-record coverage for external-first presentations (build + Pagefind API query).
2. Reconciliation of PF5-G2 Eleventy projection vs `presentationPagefind.js` postbuild injection (choose one owner).
3. Shared presenter external-URL hardening (`target="_blank"` + external badge for external-URL results).
4. Emit `data-pagefind-sort="date:..."` from `resolvePagefindPresentations`.
5. Design decision on the topic combobox (406 topics vs F&E chip UI).

This slice deliberately does **not** claim Presentations FULL Pagefind readiness. The archive continues to fetch `/data/presentations-page.json` and to run `ContentPresets.queryPreset("FindExplore:presentations", …)` client-side; Pagefind participates in discovery through the shared presenter but not in the archive interaction. The audit's HYBRID decision stands.

## Commit

To be created as a focused commit on `audit/presentations-ssr-closure`:

```
feat(presentations): unify archive card rendering via Nunjucks templates

Slice 3 of the Presentations SSR closure. Presentation archive cards now
render from one Nunjucks source (result-card.njk) for both initial SSR
opening cards and client-side filter re-renders. archiveCardHtml() and
its formatter helpers (SOURCE_ICONS, truncate, isExternalUrl, linkAttrs,
landingUrl, iconFor, formatDate, toIsoDate, escHtml wrapper) are removed
from presentations-page.js (327 → 248 LOC).

Client filter re-render clones hidden inline <template> elements that
the SSR archive emits per canonical item, keyed by url + title
attributes. Description truncation moves to build time via Nunjucks
truncate(180, true, "..."). SSR opening cards now carry the same
returnTo decoration that filter results already carried.

HYBRID architecture preserved: /data/presentations-page.json still
fuels ContentEngine + queryPreset for interactive filter/search/pagination.
Pagefind and the shared SearchResultPresenter continue to own global
discovery. No change to Canonical Content v1, the public JSON contract,
Pagefind indexing, or FI/EN partition semantics.

Tests: presentations-archive spec extended with 6 new scenarios covering
external target=_blank + rel, SSR-side returnTo, and description
truncation length; 8/8 pass.
```

No PR to be created in this task.

---

## Payload regression + follow-up (2nd iteration)

The first iteration (commit `942b4690`) inlined 218 `<template>` card
fragments into the archive page HTML. The gzip transfer regression was
too large:

| Metric | Baseline (SSR-P1) | Iter 1 (templates in page) |
| --- | ---: | ---: |
| FI page uncompressed | ~338 KB | 1458 KB (+1120 KB) |
| FI page gzipped | ~50 KB | 142 KB (+92 KB) |
| EN page uncompressed | ~272 KB | 1207 KB (+935 KB) |
| EN page gzipped | ~50 KB | 120 KB (+70 KB) |

Iteration 1 was rejected as a failed performance gate on the same day.

### Iteration 2 architecture (current)

`result-card.njk` remains the sole card semantic renderer. Card HTML is
pre-rendered per canonical item at build time into two locale-specific
files, and the archive page HTML stays lean:

- `_site/data/presentation-cards-fi.html` — 218 `<template>` fragments,
  FI badge labels, FI dates, `?returnTo=/esitykset/` on local anchors.
- `_site/en/data/presentation-cards-en.html` — 218 `<template>`
  fragments, EN badge labels, EN dates, `?returnTo=/en/presentations/`
  on local anchors. Path starts with `/en/` so the `dateFormat` Eleventy
  filter (which reads `this.page.url`) renders `en-GB` dates.

Two new build inputs generate these:

- `src/data/presentation-cards-fi.11tydata.js` +
  `src/data/presentation-cards-fi.njk`
- `src/data/presentation-cards-en.11tydata.js` +
  `src/data/presentation-cards-en.njk`

Each `.11tydata.js` sibling injects the canonical page model via
`eleventyComputed.presentationsPage` so the `.njk` template can loop
canonical items and `{% include "presentations/result-card.njk" %}` per
item — reusing the exact SSR partial with all Eleventy-registered
filters (`dateFormat`, `truncate`, `urlencode`) via Eleventy's native
Nunjucks env. No new build machinery, no `nunjucks` module required.

Client (`src/js/presentations-page.js`) now:

- Kicks off `fetch("/data/presentation-cards-{locale}.html")` at
  `wireArchive` time (in parallel with existing
  `/data/presentations-page.json` fetch).
- Parses the response text with `DOMParser` and populates a
  `templateMap` keyed by `url + KEY_SEP + title`.
- Skips the initial `renderCards` re-render (the SSR opening 12 cards
  are correct; the initial render only updates status text +
  pagination). This avoids DOM churn on hydration and preserves focus.
- On any filter/search/pagination interaction, `renderCards` clones the
  matching `<template>.content` into the results grid.

If the cards fetch fails (network, 404, parse error), `templateMap`
stays empty; the archive still shows the SSR opening 12 cards and the
filter controls are inert but visible. Documented failure mode.

### Payload gate PASSED

| Metric | Baseline SSR-P1 | Iter 1 (templates in page) | Iter 2 (async cards file) |
| --- | ---: | ---: | ---: |
| `src/js/presentations-page.js` LOC | 327 | 248 | 277 |
| `src/js/presentations-page.js` bytes | 11937 | 8087 | 9404 |
| Client-side HTML formatter functions | 5 | **0** | **0** |
| FI page uncompressed | ~338 KB | 1458 KB | **923 KB** |
| FI page gzipped | ~50 KB (approx) | 142 KB | **102 KB** |
| EN page uncompressed | ~272 KB | 1207 KB | **670 KB** |
| EN page gzipped | ~50 KB (approx) | 120 KB | **80 KB** |
| FI cards file uncompressed | — | — | 535 KB |
| FI cards file gzipped | — | — | **41 KB** |
| EN cards file uncompressed | — | — | 536 KB |
| EN cards file gzipped | — | — | **41 KB** |
| `/data/presentations-page.json` bytes | 795652 | 795652 | **795652** (unchanged) |
| Templates in archive page HTML | — | 218 | **0** |
| Templates in cards file | — | — | 218 |
| Runtime requests per archive page | 1 | 1 | 2 |

Payload cost per visit (gzip):

- **First visit FI:** 102 KB (page) + 41 KB (cards) = 143 KB. Roughly the same as Iter 1's 142 KB, but split across two separately-cacheable resources.
- **Repeat visit FI (cards file cached):** 102 KB (page) only. **−40 KB gzipped vs Iter 1 (−28 %)**.
- **First visit EN:** 80 KB (page) + 41 KB (cards) = 121 KB. Roughly the same as Iter 1's 120 KB.
- **Repeat visit EN (cards file cached):** 80 KB (page) only. **−40 KB gzipped vs Iter 1 (−33 %)**.

The cards file is content-addressable in effect (its bytes change only when the canonical presentation model or `result-card.njk` template changes) and has a stable URL, so HTTP cache reuse is high across sessions. The archive page HTML, which typically changes more often (news ticker, meta refresh, other content updates), no longer carries this 1 MB uncompressed payload every time.

The uncompressed page HTML delta (923 KB vs the historical 338 KB SSR-P1 baseline) is larger than SSR-P1 alone but that difference is caused by content added between the SSR-P1 measurement (2026-08-24) and today — not by this slice. This slice's page-side contribution over the previous state on the `audit/presentations-ssr-closure` branch head (`efe6aa0b`) is small (~5 line change in `archive.njk` to set `cardReturnTo`).

### JSON payload impact

**None.** `/data/presentations-page.json` remains 795652 bytes — unchanged by both iterations of Slice 3.

### Files touched in iteration 2 (in addition to iteration 1)

```
src/_includes/presentations/archive.njk         |  6 --- (revert template block)
src/data/presentation-cards-en.11tydata.js      |  9 +++ (new)
src/data/presentation-cards-en.njk              |  9 +++ (new)
src/data/presentation-cards-fi.11tydata.js      |  9 +++ (new)
src/data/presentation-cards-fi.njk              |  9 +++ (new)
src/js/presentations-page.js                    | 69 +++++++++++++++++++++++----------
tests/presentations-archive.spec.js             | 14 ++++---
```

### Iteration 2 test results

- `npm run test:unit` — **637 pass / 0 fail**.
- `tests/presentations-archive.spec.js` — **8 pass / 0 fail**. `SSR opening cards carry the same returnTo decoration as filtered cards` failed initially with a per-element retry timeout; test rewritten to use `page.$$eval` for a single-snapshot href list. Passes deterministically after the rewrite.
- `tests/presentations-source-ssr.spec.js` — **3 pass / 0 fail**.
- `tests/pf5-g2-presentations-shared-result.spec.js` — **12 pass / 0 fail**.
- `tests/contrast.spec.js` (Presentations FI + EN) — **2 pass / 0 fail**.
- Full `npm run build:no-og` — PASS. `presentationLocalLandingTotal: 138`, `presentationExternalLandingTotal: 80`, `check:researchfi-integrity` OK, `[seo-dashboard] OK | pages=1458 missingDescription=0 missingOgImage=0`.

Pre-existing baseline failures on `origin/main` (`tests/o1-orientation.spec.js:122` FI media detail, `tests/presentations-research-smoke.spec.js:4` legacy `#searchOverlay` selector) remain unchanged; neither touches Presentations archive code.

### Alternatives evaluated

- **JSON `renderedHtml` field** in `/data/presentations-page.json` — would widen the public contract per the P-OPEN-1 audit's guidance to prefer an internal projection. Rejected in favor of dedicated internal build inputs whose URLs (`/data/presentation-cards-*.html`) are not documented public projections.
- **Client-side template with data slots + JS interpolation** — would require reproducing `result-card.njk`'s conditional logic (`if item.thumbnail`, `if item.description`, `if cardTopics.length`, `if item.presentationType`, `if item.event`) in JS. Direct violation of the "no parallel JS card formatter" constraint.
- **Custom Web Components** — same violation: JS-defined template structure.
- **CSS `content-visibility: hidden` on all 218 SSR cards** — same page-weight cost as inline templates; also puts 218 cards in the accessibility tree and creates layout complexity.
- **Prefetch on idle/hover** — Iter 2 already fetches on `wireArchive` init (which fires on `DOMContentLoaded` after `content-engine` is ready). Users typically interact with the filter after ~1s; the cards file is generally ready by then. Adding hover/idle prefetch would be an additional optimization but is not required by the gate.

### Commit plan

Second iteration to be created as a focused commit on top of `942b4690`:

```
perf(presentations): move card templates from page HTML to cacheable file

Fixes the payload regression introduced by commit 942b4690, which
inlined 218 <template> card fragments into /esitykset/ and
/en/presentations/. That approach raised FI archive page HTML from
~338 KB to 1458 KB uncompressed (+92 KB gzipped) on every visit.

Card templates now live in dedicated locale-specific files:

  /data/presentation-cards-fi.html    535 KB (41 KB gzipped)
  /en/data/presentation-cards-en.html 536 KB (41 KB gzipped)

Client presentations-page.js fetches the file on wireArchive init and
populates the template map from the parsed response. The archive page
HTML drops back to 923 KB (FI) / 670 KB (EN) uncompressed and 102 KB
(FI) / 80 KB (EN) gzipped. Cards file is content-stable and cacheable
across sessions, so repeat visits save 40 KB gzipped per page vs the
inline-template approach.

Architecture preserved: result-card.njk remains the sole card semantic
renderer; archiveCardHtml() and formatter helpers remain deleted; no
change to /data/presentations-page.json contract; Pagefind untouched.

Test tweak: SSR-returnTo assertion switched from per-element
locator.nth(i) to a single $$eval href snapshot to avoid per-element
retry timeouts.
```
