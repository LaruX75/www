# PF5-G1 navbar Modular UI implementation

## Status

**CLOSED / GREEN / MAIN.** Merged 2026-08-24 as PR [#136](https://github.com/LaruX75/www/pull/136); merge commit `786024be9bbca628ef903dd993a16120f0bbd11e` is the current `origin/main`. Post-merge Actions run [32690302247](https://github.com/LaruX75/www/actions/runs/32690302247) — build / deploy / smoke all success. Production HTTP verified.

Post-audit implementation slice following the GO WITH CONSTRAINTS decision recorded in the navbar audit doc (audit branch). Migrated the FI + EN navbar search overlay from PagefindUI Default → Pagefind Modular UI via the shared factory, retired Default UI globally, and preserved the N1 dialog contract.

## Closure / merged state (2026-08-24)

| | |
|---|---|
| PR | [#136](https://github.com/LaruX75/www/pull/136) — MERGED |
| mergedAt | 2026-08-24T04:30:55Z |
| mergedBy | LaruX75 (via `gh pr merge --match-head-commit`) |
| Merged head SHA | `e70b9b951c2444eb3f7fcc2b92f3112da1250e09` |
| Merge commit SHA | `786024be9bbca628ef903dd993a16120f0bbd11e` |
| Resulting `origin/main` | `786024be9bbca628ef903dd993a16120f0bbd11e` |
| Previous `origin/main` | `be4404a62c54b61ae2719a4dc95d182a10c1f9f0` |
| Post-merge Actions run | [32690302247](https://github.com/LaruX75/www/actions/runs/32690302247) — build ✓ / deploy ✓ / smoke ✓ |
| Production `/haku/` | HTTP/2 200 (PROVEN via curl) |
| Production `/en/search/` | HTTP/2 200 (PROVEN via curl) |
| Production FI home Modular UI CSS | 3× occurrences (preload + non-blocking + noscript) — PROVEN |
| Production FI home Default UI references | **0×** — PROVEN |
| Production FI home nav config script | 1× `siteSearchNavConfig` — PROVEN |
| Repo-wide `PagefindUI\|pagefind-ui\.js\|pagefind-ui\.css\|data-pagefind-ui` in `src/` + `tests/` | **0 matches** on merged tree |
| Rollout worktree `/private/tmp/www-pf5-navbar-rollout` | to be removed at cleanup |
| Local branch `pf5/g1-navbar-modular-ui` | to be deleted at cleanup |
| Remote branch `origin/pf5/g1-navbar-modular-ui` | to be deleted at cleanup |

## Pre-merge implementation state (historical)

- **Branch (during implementation):** `pf5/g1-navbar-modular-ui`
- **Worktree (during implementation):** `/private/tmp/www-pf5-navbar-rollout`
- **Base at implementation time:** `be4404a62c54b61ae2719a4dc95d182a10c1f9f0` (post presenter-convergence closure PR #135)
- **Implementation commit created after review approval:** `e70b9b951c2444eb3f7fcc2b92f3112da1250e09` — fast-forward-merged into `main` as part of merge commit `786024be` (PR #136).

## Ownership before / after

### Before (PagefindUI Default, PR #135 tree)

```
_meta.njk (global, every SSR page)
  <link preload pagefind-ui.css>
  <link stylesheet pagefind-ui.css media=print onload>
  <noscript><link stylesheet pagefind-ui.css></noscript>
  <script pagefind-ui.js defer>

_nav-{fi,en}.njk
  <div id="siteSearchUi" data-pagefind-ui data-pagefind-lang="Suomi|English" data-pagefind-placeholder="…">

site-ui.js:556-658 (~100 LOC)
  getPagefindInput() polls '.pagefind-ui__search-input, .pf-input'
  focusPagefindInput() manual focus + input event
  waitForPagefindInput() 20×50ms polling
  initPagefindUi() 40×50ms window.PagefindUI polling, hardcoded FI+EN translation bundles

7 F&E consumer templates + /haku/ + /en/search/ pageScripts:
  - /js/search-result-presenter.js
  - /js/find-explore.js (7 F&E templates only)
  - /js/global-search-modular-ui.js (/haku/ + /en/search/ only)

/haku/ + /en/search/ pageStyles:
  - /pagefind/pagefind-modular-ui.css (page-scoped only)

find-explore.css (page-scoped on 7 F&E templates + not on /haku/, /en/search/):
  All .find-explore-result-* rules (family/badge/year/title/primary-meta/excerpt) —
  shared presenter DOM but page-scoped stylesheet meant /haku/ + /en/search/
  rendered these classes UNSTYLED (pre-existing under-styling gap)
```

### After (Modular UI navbar, this slice)

```
_meta.njk (global, every SSR page)
  <link preload pagefind-modular-ui.css>
  <link stylesheet pagefind-modular-ui.css media=print onload>
  <noscript><link stylesheet pagefind-modular-ui.css></noscript>
  <script /js/search-result-presenter.js defer>
  <script /js/global-search-modular-ui.js defer>

_components.css (globally loaded via _meta.njk:180)
  Shared presenter DOM styling (.find-explore-result base + focus/hover,
  -family, -family-badge, -year, -title, -primary-meta, -excerpt,
  @media prefers-reduced-motion hover transition) — moved from find-explore.css

find-explore.css (still page-scoped on 7 F&E templates)
  F&E-only rules kept: .find-explore container, .find-explore-card,
  .find-explore-status, .find-explore-results grid, .find-explore-result-group
  (publications A–G semantic groups), .find-explore-result-list,
  .find-explore--publications archive width override, .find-explore-result-
  publication-quality (F&E-only micro-copy)

_nav-{fi,en}.njk
  {% include "_search-nav-config.njk" %}
  <div id="siteSearchUi" class="site-search-ui"></div>

_search-nav-config.njk (new)
  Locale-aware inline JSON <script id="siteSearchNavConfig">
  Emits: languageFilter, placeholder, regionLabel, fallbackMessage,
  translations {clear_search, load_more, search_label, filters_label,
  zero/one/many_results, alt_search, search_suggestion, searching},
  pageSize:6, enableFilters:false, enableUrlSync:false, fullSearchPageUrl.
  Serialised with existing jsonSafe|safe filter (same security discipline
  as _search-page-config.njk).

site-ui.js:555-591 (~40 LOC, ~60 LOC removed)
  Navbar adapter around window.createModularSearchUI:
    initPagefindUi() — lazy one-shot promise calling factory with
      navbar options (pageSize:6, enableFilters:false, enableUrlSync:false)
    openSearch() → showModal() + initPagefindUi().then(api => api.focusInput(query))
  Dialog lifecycle (showModal/close/lastSearchTrigger/trapSearchFocus/backdrop
    click/close-event focus return/trigger + form handlers) UNCHANGED — that
    block is Chrome's <dialog> model, not Pagefind's.

global-search-modular-ui.js (refactored, same file, ~500 LOC)
  Exposes window.createModularSearchUI(options) factory.
  Factory options: mountEl, configEl, inputId, pageSize, enableFilters,
    enableUrlSync, fallbackFormEl, getInitialQuery, onReady.
  Returns API: ready promise, getInput(), focusInput(prefill),
    triggerSearchWithPin(query).
  Uses atomic instance.triggerSearchWithFilters(query, {Kieli:[lang]}) for
    initial query dispatch and .focusInput(prefill) — proven necessary
    during audit browser experiment for EN dispatch reliability.
  Retains the DOMContentLoaded page bootstrapper (guarded by presence of
    #siteSearchPageUi) that calls the factory with page defaults
    (pageSize:10, filters+URL sync on, SSR fallback wired).

7 F&E consumer templates
  Removed: - /js/search-result-presenter.js entry (now globally loaded)
  Retained: - /js/find-explore.js (F&E-specific)

/haku/ + /en/search/
  Removed page-scoped pageStyles: /pagefind/pagefind-modular-ui.css
  Removed page-scoped pageScripts: /js/search-result-presenter.js AND
    /js/global-search-modular-ui.js (now globally loaded)
```

### Ownership contract preserved

Nunjucks owns markup and inline config. Pagefind owns search / filter / ranking. `search-result-presenter.js` owns presentation. `createModularSearchUI` factory owns Pagefind Modular UI composition. `site-ui.js` owns `<dialog>` lifecycle. Zero duplicate ownership.

## Script load order (global, every SSR page)

```
<head>
  ...
  <link preload pagefind-modular-ui.css>            <-- non-blocking
  <script src="/js/search-result-presenter.js" defer>   <-- installs window.SearchResultPresenter
  <script src="/js/global-search-modular-ui.js" defer>  <-- installs window.createModularSearchUI + runs page bootstrap (no-op on non-search pages)
</head>
<body>
  ...
  <script src="/js/bootstrap.min.js" defer>
  <script src="/js/site-ui.js" defer>               <-- navbar adapter uses window.createModularSearchUI on first openSearch()
  {% for pageScripts %}                             <-- e.g. F&E: find-explore.js consumes window.SearchResultPresenter
</body>
```

Deferred scripts execute in document order: presenter defined before factory before adapter. On F&E pages, presenter is defined before `find-explore.js` (F&E's fail-fast guard on `window.SearchResultPresenter` never trips).

## Search-page parity (PROVEN)

Refactor of `global-search-modular-ui.js` into a factory + thin page bootstrapper was gated on `tests/search-modular-ui-pilot.spec.js` (34 scenarios × 2 locales = parameterised) + `tests/pf-ui-l10n1-finnish-search-labels.spec.js`.

Immediately after the factory refactor (before touching navbar): **40 pass / 2 documented-skip / 0 fail** in 24.8 s. Same result as pre-refactor origin/main pilot run. `/haku/` and `/en/search/` behavior byte-equivalent.

## Navbar migration (PROVEN)

`tests/pf5-g1-navbar-modular-ui.spec.js` — parameterised FI + EN, 12 scenarios × 2 = 24 test cases:

- Modular UI mounts inside dialog (`#siteSearchUi[data-search-modular-ready="true"]`)
- Default UI DOM absent (`#siteSearchUi [class*="pagefind-ui__"]` count = 0)
- Initial focus on `#siteSearchNavInput`
- Query returns family-typed shared-card results in Pagefind rank order (kinds > 0)
- Kieli pin excludes other-locale results
- N1: Shift+Tab from input → close button; wrap keeps focus inside dialog
- N1: Escape closes + focus returns to trigger
- N1: close button closes + focus returns to trigger
- N1: repeat open → close → reopen — mount + input counts remain 1
- Page size 6 initial batch; load-more preserves order + label + hides when exhausted
- No-results state emits locale-appropriate message
- Init failure via `pagefind-modular-ui.js` 404: dialog closable, fallback link visible, reopen safe
- Full-search-page fallback link visible inside dialog

Combined result: **24/24 PASS**.

### Stress: pure N1 lifecycle ×20 per locale

`npx playwright test tests/pf5-g1-navbar-modular-ui.spec.js -g "N1: Escape|N1: close button|N1: Shift\+Tab from input" --repeat-each=20`

Result: **120 passed / 0 failed** in 2.7 min. Zero lifecycle flake across Escape / close-button / Shift+Tab across FI + EN × 20 iterations × 3 tests each.

Query-poll flake seen in the wider stress (3/40 iterations of a *different* test that combined repeat-open + query dispatch) is a test-suite timing issue on Modular UI Input's search dispatch under contended parallel workers — NOT a lifecycle bug and does not reproduce in isolated re-runs.

## CSS ownership move

Moved from `src/css/find-explore.css` → `src/css/modules/_components.css` (existing global-load owner):

- `.find-explore-result` (border, radius, background, padding)
- `.find-explore-result:focus-within` (outline)
- `.find-explore-result-family` (flex layout for badge+year row)
- `.find-explore-result-family-badge` (pill visual)
- `.find-explore-result-year` (year suffix)
- `.find-explore-result-title` (title bolding + underline offset)
- `.find-explore-result-primary-meta` (meta line color/size)
- `.find-explore-result-excerpt` (excerpt color/size)
- `@media (prefers-reduced-motion: no-preference) .find-explore-result` (transition) + `.find-explore-result:hover` (border color + translate)

Retained in `src/css/find-explore.css` (F&E-only, page-scoped on 7 F&E templates):

- `.find-explore` (F&E container)
- `.find-explore-card` (F&E card gradient wrapper)
- `.find-explore-status` (status line height/color)
- `.find-explore-results` (F&E grid layout)
- `.find-explore-result-group*` (publications A–G semantic groups)
- `.find-explore-result-list` (F&E list layout)
- `.find-explore--publications .find-explore-card` (publications archive width override)
- `.find-explore-result-publication-quality` (F&E-only publication quality micro-copy — emitted by find-explore.js `kindConfig`, not by presenter's `renderSharedCard`)

No duplicate CSS ownership. F&E surfaces render unchanged (`f2` + `f3a` + `f3b` + `pf2` + `pf3` + `pf4` regression specs PASS).

## Deletion summary

### Repo-wide `PagefindUI | pagefind-ui.js | pagefind-ui.css | data-pagefind-ui | new window.PagefindUI` under `src/` and `tests/`:

**Zero matches.** No Default UI runtime consumer remains on `src/` or `tests/`.

### Deleted from `_meta.njk`

```diff
-<link rel="preload" href="/pagefind/pagefind-ui.css" as="style">
-<link href="/pagefind/pagefind-ui.css" rel="stylesheet" media="print" onload="this.media='all'">
-<noscript>
-  <link href="/pagefind/pagefind-ui.css" rel="stylesheet">
-</noscript>
-<script src="/pagefind/pagefind-ui.js" defer></script>
+<link rel="preload" href="/pagefind/pagefind-modular-ui.css" as="style">
+<link href="/pagefind/pagefind-modular-ui.css" rel="stylesheet" media="print" onload="this.media='all'">
+<noscript>
+  <link href="/pagefind/pagefind-modular-ui.css" rel="stylesheet">
+</noscript>
+<script src="/js/search-result-presenter.js" defer></script>
+<script src="/js/global-search-modular-ui.js" defer></script>
```

### Deleted from `_nav-{fi,en}.njk`

```diff
-<div id="siteSearchUi" class="site-search-ui"
-  data-pagefind-ui
-  data-pagefind-lang="Suomi|English"
-  data-pagefind-placeholder="…"
-></div>
+{% include "_search-nav-config.njk" %}
+<div id="siteSearchUi" class="site-search-ui"></div>
```

### Deleted from `site-ui.js`

- `getPagefindInput`, `focusPagefindInput`, `waitForPagefindInput` (Default UI poll helpers) — ~22 LOC
- `initPagefindUi()` Default-UI-specific body (mount poll + 40×50ms window.PagefindUI wait + hardcoded FI/EN translation objects + `.triggerFilters({Kieli:string})` call) — ~80 LOC
- Total: ~100 LOC removed
- Replacement: ~40 LOC navbar adapter (thin `initPagefindUi()` returning shared-factory promise + `openSearch` now awaits `api.focusInput`)
- **Net −60 LOC in site-ui.js**

### Deleted from `/haku/` + `/en/search/` front-matter

```diff
-pageStyles:
-  - /pagefind/pagefind-modular-ui.css
-pageScripts:
-  - /js/search-result-presenter.js
-  - /js/global-search-modular-ui.js
```

All three assets are now globally loaded.

### Deleted from 7 F&E consumer templates

```diff
 pageScripts:
-  - /js/search-result-presenter.js
   - /js/find-explore.js
```

Presenter is globally loaded. `find-explore.js` remains page-scoped (F&E-only).

### Kept (semantic reasons)

- `_site/pagefind/pagefind-ui.{js,css}` build output — Pagefind's own build still emits them. The requirement is zero site consumption (met); trimming the Pagefind build itself is a separate ownership decision.
- Historical audit files under `docs/data/*.json` that mention Default UI internals — historical, no runtime impact.
- `docs/pf5-g1-navbar-modular-ui-suitability-audit-2026-08-23.md` — audit doc on the audit branch, not part of this PR's tree.

## Performance measurement (raw + gzip + brotli)

**Assets removed from global critical path:**

| Asset | Raw bytes | gzip | brotli |
|---|---|---|---|
| `/pagefind/pagefind-ui.js` | 119 987 | 29 965 | 24 592 |
| `/pagefind/pagefind-ui.css` | 14 482 | 2 610 | 2 215 |
| **Removed total** | **134 469** | **32 575** | **26 807** |

**Assets added to global critical path:**

| Asset | Raw bytes | gzip | brotli |
|---|---|---|---|
| `/pagefind/pagefind-modular-ui.css` | 7 336 | 1 706 | 1 396 |
| `/js/search-result-presenter.js` | 8 502 | 2 867 | 2 374 |
| `/js/global-search-modular-ui.js` | 20 418 | 5 991 | 5 009 |
| **Added total** | **36 256** | **10 564** | **8 779** |

**Kept lazy-loaded (on first dialog open only, off critical path):**
- `/pagefind/pagefind-modular-ui.js`: raw 14 634 / gzip ~4 KB / brotli ~3.5 KB

**Net delta per SSR page on critical path:**

| Metric | Delta |
|---|---|
| **Raw** | **−98 213 B = −96 KB** |
| **gzip transfer** | **−22 011 B = −21.5 KB** |
| **brotli transfer** | **−18 028 B = −17.6 KB** |
| Blocking requests | −1 (was `pagefind-ui.js` defer; now `pagefind-modular-ui.js` is lazy on user action, not on page load) |

**HTML footprint per page** (additional inline `#siteSearchNavConfig` script minus removed `data-pagefind-*` attributes):
- FI `/` index: baseline 147 326 → after 147 394 = **+68 B raw / +16 B gzip**
- EN `/en/` index: baseline 149 575 → after 149 642 = **+67 B raw / +18 B gzip**
- `/haku/`: baseline 99 321 → after 99 186 = **−135 B raw** (pageStyles + pageScripts removals)
- `/en/search/`: baseline 92 068 → after 91 932 = **−136 B raw** (same)

**Audit correction:** the audit estimated ~−112 KB per page raw. **Actual measured raw delta is −96 KB.** The audit estimate was optimistic — it counted only the removed 134 KB and missed the 36 KB of newly-added global assets. Real browser transfer is dominated by gzip (~−21.5 KB per page).

## N1 compatibility

Every previously ✅ N1 invariant PROVEN unchanged under Modular UI navbar:

- Native `<dialog>` (`_nav-*.njk`) unchanged
- `dialog.showModal()` unchanged (site-ui.js:660-669 openSearch)
- Native Escape/cancel (site-ui.js:748-757 delegates to browser)
- Initial focus on search input — now via `api.focusInput()` awaiting Modular UI ready
- Shift+Tab from input → close button, PROVEN 40× (stress ×20 FI + EN)
- Tab from last → first cyclic wrap, PROVEN by `wrap keeps focus inside dialog` test 40×
- Interior Tab traversal — browser native
- Backdrop click closes (site-ui.js:773-775)
- `close` event → exact focus return to `lastSearchTrigger`, PROVEN 40×
- Repeated open → close → reopen, PROVEN 24× — mount + input counts remain 1
- No `history.back()` / no body-scroll-lock / no manual aria-hidden / no duplicate Escape / no parallel focus-trap library — unchanged
- FI + EN parity — both PASS all 12 scenarios

Selectors updated in `tests/navigation.spec.js` (5 mechanical: `.pagefind-ui__search-input` → `#siteSearchNavInput`; `.pagefind-ui__result` → `[data-search-modular-results] li[data-search-result-kind]`; `.pagefind-ui__message` → `[data-search-modular-summary]`).

## Failure behavior

Modular UI init failure via `/pagefind/pagefind-modular-ui.js` route 404 (Playwright `route.fulfill`):

- Dialog remains open (site-ui.js showModal already ran)
- Fallback message rendered inside mount (`config.fallbackMessage` from `_search-nav-config.njk`)
- Full search page link visible: `<a href="/haku/">Näytä koko sivulla</a>` (FI) / `<a href="/en/search/">Open full search page</a>` (EN)
- Escape closes + focus returns to trigger
- Close button closes
- Reopen safe (no crash, factory re-attempts init)
- No permanent loading state
- No stuck focus trap (fallback message is text; input never mounted; tab traversal remains inside dialog on close button + full-search-page link + fallback message content)

PROVEN by `PF5-G1 navbar Modular UI — {FI,EN} › init failure via /pagefind/pagefind-modular-ui.js 404: dialog remains fully closable` test.

## Test results (current, all runs)

| Check | Command | Result |
|---|---|---|
| Diff hygiene | `git diff --check` | clean |
| Unit | `npm run test:unit` | 602 pass / 0 fail |
| Build | `npm run build:no-og` | PASS |
| Combined browser (navbar spec + pilot + pf-ui-l10n1 + navigation + accessibility + accessibility-tools + contrast + F2 + F3a + F3b + PF2 + PF3 + PF4) | Playwright | **128 pass / 2 documented-skip / 2 flake** (self-cleared on isolated re-run) |
| Pure N1 lifecycle stress ×20 (FI + EN) | Playwright `--repeat-each=20 -g "N1: Escape\|N1: close button\|N1: Shift\+Tab from input"` | **120 pass / 0 fail** — zero flake |
| Isolated re-run of the 2 flaky specs | Playwright | 7 pass / 0 fail — flakes cleared |
| Repo-wide Default UI runtime consumer grep | `rg` | **0 matches** in `src/` + `tests/` |
| HTML output verification (per-page: FI `/`, EN `/en/`, `/haku/`, `/en/search/`, `/kirjoitukset/`) | grep | Modular UI CSS 3× (preload + main + noscript); presenter globally loaded 1×; factory globally loaded 1×; nav config 1×; Default UI 0× |

## Remaining follow-ups

- **`renderExcerpt`** behavioral non-convergence (F&E escapes vs presenter preserves Pagefind `<mark>`) — untouched by this slice, remains a separate future decision.
- **MutationObserver aria decoration** — CONTINGENT DELETION when Pagefind exposes a supported FilterPills translation API. Currently only used on page filters (`/haku/` + `/en/search/`); navbar has no visible filters so the workaround is not active there.
- **Optional post-rollout cleanup:** trim the Pagefind build itself to stop emitting `pagefind-ui.{js,css}` if the Pagefind build config exposes it. Zero site consumption is met either way. NOT in this slice.
- **Pre-existing baseline failures** (`tests/pf-perf2-first-search-latency.spec.js:49`, `tests/pf5-impl-apa-full-list.spec.js:67`, `tests/f4-research-find-explore.spec.js:38`) — not caused by this slice; not re-verified as part of this task's scope.

## Guardrails held (all PROVEN)

- No Canonical Content v1 changes.
- No Pagefind metadata / taxonomy / contexts / filter value changes.
- No ranking changes.
- No `renderExcerpt` behavior change.
- No `<dialog>` lifecycle change.
- No manual `aria-hidden` / body-scroll-lock / `inert` / duplicate Escape / parallel focus-trap library.
- No new navbar-specific presenter or CSS token family.
- Navbar Modular UI v1: NO visible FilterPills (only Kieli pinned invisibly).
- G2 / G3 / G4 not started.
