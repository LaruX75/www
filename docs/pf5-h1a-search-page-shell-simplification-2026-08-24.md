# PF5-H1A Search page shell simplification

## Status

**CLOSED / GREEN / MAIN.** Merged 2026-08-24 as PR [#140](https://github.com/LaruX75/www/pull/140); merge commit `444e818c0048387e5691cb5af3c0c37bc36390e6` is the current `origin/main`. Post-merge Actions run [32726937885](https://github.com/LaruX75/www/actions/runs/32726937885) — build / deploy / smoke all success. Production HTTP smoke verified: `/haku/`, `/en/search/` HTTP/2 200; body carries `data-translation-key="search"`; exactly 1 `#siteSearchPageInput`; zero `content-detail-eyebrow` occurrences.

Implementation slice for the first slice recommended by the PF5-H1 audit's GO decision. Collapses `/haku/` and `/en/search/` from a two-input dual-form shell (content-detail-hero + SSR fallback card + Modular-UI-injected input) to a single SSR-authoritative search form that Modular UI enhances in place. No renderer/CSS card change, no result-card change, no facet change (H1B territory).

## Closure / merged state (2026-08-24)

| | |
|---|---|
| PR | [#140](https://github.com/LaruX75/www/pull/140) — MERGED |
| mergedAt | 2026-08-24T12:24:29Z |
| mergedBy | LaruX75 (via `gh pr merge --match-head-commit`) |
| Implementation head SHA | `6f75a88dbac3d6a2561d230871829497cce15dee` |
| Merge commit SHA | `444e818c0048387e5691cb5af3c0c37bc36390e6` |
| Resulting `origin/main` | `444e818c0048387e5691cb5af3c0c37bc36390e6` |
| Previous `origin/main` (audit baseline) | `0c307f34761e594aa12fd553cbcb0bda8c7a0390` (post PF5-G2 closure) |
| Pre-merge PR CI | build-and-verify PASS (5m41s), playwright PASS (8m1s), mergeStateStatus CLEAN |
| Post-merge Actions run | [32726937885](https://github.com/LaruX75/www/actions/runs/32726937885) — build ✓ / deploy ✓ / smoke ✓ |
| Production `/haku/` | HTTP/2 200 |
| Production `/en/search/` | HTTP/2 200 |
| Production body attribute | `data-translation-key="search"` (PROVEN) |
| Production duplicate input | 0 `content-detail-eyebrow`; 1 `#siteSearchPageInput` (PROVEN via curl) |

## Merged-main baseline measurements (headless Chrome on `/haku/?q=tekoäly`, PROVEN 2026-08-24)

| Metric | Pre-H1A (baseline `0c307f34`) | Post-H1A (merged `444e818c`) | Delta |
|---|---|---|---|
| Visible page search inputs desktop 1280×900 | 2 | **1** | −1 |
| Injected duplicate input inside `#siteSearchPageUi` | 1 | **0** | −1 |
| First result top offset desktop | 1 694 px | **1 237 px** | **−457 px (−27%)** |
| First result top offset mobile 375×667 | 1 599 px | **1 234 px** | **−365 px** |
| Screenfuls before first result mobile | 2.40 | **1.85** | **−0.55 screenfuls** |
| DOM nodes on `/haku/?q=tekoäly` | 2 244 | 2 232 | −12 |
| Rendered filter groups (H1B baseline) | 12 | 12 | 0 (unchanged — H1B territory) |
| Rendered filter-pill buttons (H1B baseline) | 441 | 441 | 0 (unchanged — H1B territory) |
| Body `data-translation-key` attribute | absent | `search` (on FI + EN search page) | added |
| Desktop navbar `.site-nav-search` visible on `/haku/` | true | **false** (CSS-hidden by body attribute) | hidden |
| Desktop navbar `.site-nav-search` visible on `/` home (control) | true | **true** | unchanged |

## Failure path verification (merged main, PROVEN via headless Chrome)

- **A. JS enabled normal path:** 1 visible page search input; Modular UI mounts (`data-search-modular-ready="true"`); results render (10 for `tekoäly` FI, 10 for `learning` EN).
- **B. JS disabled:** SSR `<form action="/haku/" method="get">` submits `?q=` via native browser. Form + input + submit all remain in SSR HTML (PROVEN via `curl` grep).
- **C. Modular UI init failure (script 404 via Playwright route):** SSR form remains visible + usable (`formVisible=true`, `inputVisible=true`, `submitVisible=true`); `fallbackMessage` renders inside the mount (`fallbackMessageShown=true`). User is never left without a search control.
- **?q= URL hydration:** on `/en/search/?q=learning` the SSR input value is populated to `"learning"` on load; 10 results render.

## Navbar search-page context decision (PROVEN)

- Body carries `data-translation-key="search"` on `/haku/` and `/en/search/` only.
- CSS rule `body[data-translation-key="search"] .site-nav-search { display: none !important; }` in `src/css/modules/_global.css`.
- Element remains in DOM (`present=true`) but not visible (`visible=false`) on `/haku/`.
- Element visible (`visible=true`) on `/` home page as control.
- Mobile search-dialog trigger `#searchToggleBtn` unaffected — it's a different navbar element and remains visible on all pages.

## FI / EN parity

Both `src/fi/haku.njk` and `src/en/search.njk` restructured identically:
- Same `<section class="py-4">` shell
- Same `h1.h2` + short intro sentence
- Same `<form class="input-group site-search-page-shell" data-search-page-fallback>` shape
- Same input attributes (`data-search-page-fallback-input`, `data-search-modular-input`, `aria-label`)
- Same `<div id="siteSearchPageUi">` mount sibling
- Same `<noscript>` warning
- Locale strings differ per source; behaviour identical
- Same `translationKey: search` → same CSS rule hides navbar inline search on both

## Accessibility

- One visible search control per page under normal JS-path — no landmark duplication in the search region.
- SSR input carries associated `<label>` element (`for="siteSearchPageInput"`) + belt-and-suspenders `aria-label` (matches pre-H1A pilot assertion).
- `role="search"` on the SSR form; native `<button type="submit">` for the Hae/Search action.
- Focus order preserved: h1 → intro → input → submit → filters → results.
- Live result summary (`aria-live="polite" aria-atomic="true"`) unchanged.
- Navbar accessibility on non-search pages unaffected (CSS-hide only under `body[data-translation-key="search"]`).
- Combined regression suite (`accessibility.spec.js` + `accessibility-tools.spec.js` + `contrast.spec.js` + `navigation.spec.js`) — all pass in pre-merge CI and re-verified on merged main.

## Deletion inventory (verified on production/merged main)

| Removed | Notes |
|---|---|
| `.content-detail-eyebrow` occurrences on `/haku/` | **0** (was 1) — production `curl` grep verified |
| Long lead paragraph (189 chars, content-type list) | replaced by 1 short intro sentence |
| `<p class="form-text">` duplicate content-type list | removed |
| `<form class="…site-search-page-fallback card…">` visually-distinct card wrapping | removed (shell form now uses `.input-group site-search-page-shell`) |
| Injected `<input>` inside `#siteSearchPageUi` | 0 (was 1) — verified via `document.querySelectorAll('#siteSearchPageUi input[type="search"]').length === 0` |
| `[data-search-modular-input-container]` inside `#siteSearchPageUi` | 0 |
| `#siteSearchFallbackInputFi` / `#siteSearchFallbackInputEn` IDs | 0 (unified as `#siteSearchPageInput` on both surfaces) |
| Desktop `.site-nav-search` inline form **visible** on `/haku/` + `/en/search/` | 0 visible (hidden via CSS `body[data-translation-key="search"]`) — **element remains in DOM**, visibility toggled via CSS only |

**Explicitly NOT deleted (element visibility only):**
- Desktop `.site-nav-search` remains in DOM on the search page; only visibility hidden via CSS. This is a CSS toggle, not a template removal.

**Explicitly NOT changed:**
- SSR fallback form itself — it IS the shell now (one form serves both roles).
- `SearchResultPresenter` code.
- Pagefind emitters.
- Facet config `_search-page-config.njk` (12 facets still mounted; H1B territory).
- Any taxonomy or canonical semantics.
- Mobile search-dialog trigger `#searchToggleBtn`.
- Mobile offcanvas inline search form in navbar drawer.

## H1B authoritative starting baseline (recorded here for handoff)

Current merged-main `/haku/?q=tekoäly` measurements are the **authoritative H1B starting point**:
- 12 facet groups rendered simultaneously (`Sisältötyyppi`, `Julkaisutyyppi (OKM)`, `Julkaisun laatu`, `Kirjoituksen tyyppi`, `Kirjoituksen aihe`, `Opinnäytteen tyyppi`, `Rooli opinnäytteessä`, `Mediatyyppi`, `Rooli mediassa`, `Media: vuosi`, `Esityksen vuosi`, `Esityksen aihe`).
- 441 filter-pill buttons visible post-query.
- 1 visible search input (H1A win preserved).
- 1 237 px desktop / 1 234 px mobile first-result offset (H1A win preserved).

**PF5-H1B — progressive facet disclosure**
**status: NEXT CANDIDATE, NOT STARTED.**

H1B target (per H1 audit §19): show `Sisältö` row only by default; reveal domain secondary facets after Sisältö selection; DOM `hidden`-attribute layer; zero Pagefind state change; zero new controller; parameterised FI + EN.

## Follow-ups still deferred (unchanged from H1 audit)

- Media Pagefind projection gap → would be a G3 slice.
- `renderExcerpt` non-convergence (F&E escapes vs presenter preserves `<mark>`) — untouched.
- FilterPills MutationObserver aria-label workaround — CONTINGENT DELETION when Pagefind exposes translation API.
- Generated unused `pagefind-ui.{js,css}` — build-ownership question.

## Pre-merge implementation state (historical)

- **Branch (during implementation):** `pf5/h1a-search-shell`
- **Worktree (during implementation):** `/private/tmp/www-pf5-h1a-impl`
- **Base at implementation time:** `0c307f34761e594aa12fd553cbcb0bda8c7a0390`
- **Implementation commit created after review:** `6f75a88dbac3d6a2561d230871829497cce15dee` — fast-forward-merged into `main` as part of merge commit `444e818c` (PR #140).

## Audit reference

`docs/pf5-h1-global-search-ux-result-content-audit-2026-08-24.md` (on the audit branch `audit/pf5-h1-global-search-ux`) — decision: **GO**. This slice = H1A only. H1B (progressive facet disclosure) explicitly deferred.

## Before flow (PROVEN, pre-H1A on `0c307f34`)

```
<header nav>                                       ← desktop XL: inline search input #siteNavSearchInputFi
<section content-detail-hero py-5 border-bottom>
  p.content-detail-eyebrow "Sivuston haku"
  h1.content-detail-title "Hae sivustolta"
  p.content-detail-lead (189 chars, lists content types)
</section>
<section py-4>
  <form.card.site-search-page-fallback data-search-page-fallback> ← SSR fallback CARD
    <label>Hakusana</label>
    <input#siteSearchFallbackInputFi>
    <button>Hae</button>
    <p.form-text> (duplicate content-type list)
  </form>
  <script id=siteSearchPageConfig>
  <div id=siteSearchPageUi>                        ← Modular UI mount, renderShell() INJECTS its OWN input:
    <label for=siteSearchPageInput>
    <input#siteSearchPageInput data-search-modular-input>  ← SECOND visible input
    <div data-search-modular-filters>×12
    <div data-search-modular-summary>
    <div data-search-modular-results>
  </div>
  <noscript>
</section>
```

Result on desktop 1280×900: **2 visible search inputs**, first result at **1 694 px**. On mobile 375×667: first result at **1 599 px = 2.40 screenfuls**.

## After flow (PROVEN, this slice)

```
<header nav>                                       ← CSS hides .site-nav-search when body[data-translation-key="search"]
<section py-4>
  h1.h2 "Hae sivustolta"                          ← single short heading
  p.text-body-secondary                            ← one short intro line
  <script id=siteSearchPageConfig>
  <form.input-group data-search-page-fallback>    ← the ONLY search form, SSR-authoritative
    <label for=siteSearchPageInput>Hakusana</label>
    <input#siteSearchPageInput
        name=q
        aria-label="Hae sivustolta"
        data-search-page-fallback-input
        data-search-modular-input>                 ← ONE visible input; both fallback wiring AND enhancement target
    <button type=submit>Hae</button>
  </form>
  <div id=siteSearchPageUi>                        ← factory renderShell() detects existing input and injects ONLY filters/summary/results
    <div data-search-modular-filters>×12
    <div data-search-modular-summary>
    <div data-search-modular-results>
  </div>
  <noscript>
</section>
```

Result on desktop 1280×900: **1 visible search input**, first result at **1 237 px** (measured post-build). On mobile 375×667: first result at **1 234 px = 1.85 screenfuls**.

## One-input ownership

- SSR emits a single `<form data-search-page-fallback>` on `/haku/` and `/en/search/` containing `<input id="siteSearchPageInput" data-search-page-fallback-input data-search-modular-input>`.
- The input carries BOTH attribute markers so the factory recognises it as the fallback input (for query hydration + fallback submit interception) AND as the Modular UI Input enhancement target.
- Factory `renderShell()` (`global-search-modular-ui.js`) new behaviour:
  ```js
  const existingInput = document.getElementById(inputId);
  if (existingInput && existingInput.matches("input[type='search']")) {
    // enhance in place — inject ONLY filters + summary + results into the mount
  } else {
    // pre-H1A behaviour — inject the whole shell including a new input (navbar case)
  }
  ```
- Factory `inputElement` lookup (`global-search-modular-ui.js`) now prefers the exact ID:
  ```js
  inputElement = document.getElementById(inputId) || mount.querySelector("[data-search-modular-input]");
  ```
- Modular UI's `Input` component targets the SSR input by CSS selector — no wrapping/replacement.
- Navbar path unchanged: `<div id="siteSearchUi">` in the navbar template has no SSR input, so `document.getElementById("siteSearchNavInput")` returns null at renderShell time, and the factory takes the pre-H1A "inject full shell" branch. Same behaviour, byte-for-byte identical to pre-H1A navbar path.

## Failure path

- **JS disabled** → SSR `<form action="/haku/" method="get">` submits `?q=<query>` via native browser navigation. Server-side page reload lands on `/haku/?q=...` — the same page, no results (needs JS to render them), but the form and query remain usable. Unchanged behaviour from pre-H1A.
- **Pagefind unavailable / Modular UI script 404** → factory `.catch()` renders `fallbackMessage` inside the mount. The SSR form remains visible (H1A change: `fallbackFormEl.hidden = true` now only runs when the input is NOT inside the fallback form, i.e. only on pre-H1A layouts and navbar). User can still submit `?q=` via GET on the same URL — page reloads and either recovers or shows the same failure state.
- **Slow load** → SSR form is immediately usable. Modular UI upgrades in place when it arrives; no visual replacement, no re-flow of the input.

Failure semantics: preserved.

## FI / EN parity

Both `src/fi/haku.njk` and `src/en/search.njk` restructured identically:
- Same `<section class="py-4">` shell
- Same `h1.h2` + short intro sentence
- Same `<form class="input-group site-search-page-shell" data-search-page-fallback>` shape
- Same input attributes (`data-search-page-fallback-input`, `data-search-modular-input`, `aria-label`)
- Same `<div id="siteSearchPageUi">` mount sibling
- Same `<noscript>` warning
- Locale strings differ (Hakusana / Search term; Kirjoita hakusana… / Type a search term…; Hae / Search; long intro adapted to EN)
- Same `translationKey: search` in front-matter → same CSS rule hides navbar inline search on both

## Navbar decision (audit §10 → H1A implementation)

- Added `data-translation-key="{{ translationKey }}"` to `<body>` in `base.njk` when the page has a `translationKey`.
- Added CSS rule `body[data-translation-key="search"] .site-nav-search { display: none !important; }` in `src/css/modules/_global.css`.
- **CSS-only mechanism** — no runtime pathname hack, no navbar template branch, no JS. Preferred over the alternative per the audit's guidance.
- Mobile search-dialog trigger (`#searchToggleBtn`) is unaffected — it's a different navbar element (button, not the inline form) and remains visible on all pages.
- The FI navbar mobile offcanvas inline search form (visible only inside the mobile drawer) is also unaffected — different scope.

## Accessibility

- **One visible search input** on the search page under normal JS-path — no landmark duplication in the region.
- Input carries an associated `<label>` element (`for="siteSearchPageInput"`) plus a redundant `aria-label` (belt-and-suspenders — the pre-H1A pilot spec asserts `aria-label` on the enhancement target, so we retain it explicitly).
- `role="search"` on the SSR form; native `<button type="submit">` for the Hae/Search action.
- Focus order unchanged: navbar → h1 → intro → input → submit → (filters) → results.
- Live result summary (`[data-search-modular-summary]` with `aria-live="polite" aria-atomic="true"`) unchanged.
- Navbar accessibility unchanged on non-search pages — the CSS hide only applies when `body[data-translation-key="search"]`.
- No new duplicate accessible search landmarks.

## Measurements (real, before → after, measured with headless Chrome)

| Metric | Before (`0c307f34`) | After (this slice) | Delta |
|---|---|---|---|
| Visible page search inputs on `/haku/` desktop XL 1280×900 | 2 (navbar inline + page) | **1** (page only; navbar hidden by CSS) | **−1** |
| `input[data-search-modular-input]` count (avoiding duplicate enhancement targets) | 1 (injected) | **1** (SSR-only, no injection) | 0 net; DOM origin changed from JS to SSR |
| DOM nodes on `/haku/?q=tekoäly` desktop | 2 244 | 2 232 | −12 |
| First result top offset desktop 1280×900 | 1 694 px | **1 237 px** | **−457 px (−27%)** |
| First result top offset mobile 375×667 | 1 599 px | **1 234 px** | **−365 px** |
| Screenfuls before first result on mobile 375×667 | 2.40 | **1.85** | **−0.55 screenfuls** |
| `/haku/` served HTML size | 99 186 B | 98 533 B | −653 B raw |
| `?q=learning` hydrates SSR input value on `/en/search/` | via injected input (pre-H1A) | **directly on SSR input** | preserved |

**Not real-user-perf claims.** Measurements are structural.

## Deletion evidence (what actually went away)

Verified on built `_site/haku/index.html`:

| Removed | Count on this build | Notes |
|---|---|---|
| `.content-detail-eyebrow` occurrences | 0 (was 1) | hero eyebrow "Sivuston haku" gone |
| Duplicate long lead + form-text (content-type list twice) | 1 short intro sentence remains, no form-text | single instructional voice |
| `<form class="…site-search-page-fallback card…">` (visually-distinct fallback card) | 0 | shell form now uses `.input-group.site-search-page-shell` |
| Injected `<input>` inside `#siteSearchPageUi` | 0 | verified by test `no duplicate injected input inside #siteSearchPageUi` |
| Injected `[data-search-modular-input-container]` inside `#siteSearchPageUi` | 0 | same |
| Redundant `#siteSearchFallbackInputFi` / `#siteSearchFallbackInputEn` IDs | 0 | replaced by single `#siteSearchPageInput` on both surfaces |
| Desktop `.site-nav-search` inline form visible on `/haku/` + `/en/search/` | 0 visible (hidden by CSS on `body[data-translation-key="search"]`) | element remains in DOM for symmetry; visibility toggled via CSS only |

Explicitly **NOT deleted:**
- SSR fallback form itself (it IS the shell now — one form serves both roles).
- `SearchResultPresenter` — unchanged.
- Pagefind emitters — unchanged.
- Facet config `_search-page-config.njk` — unchanged (12 facets still mounted; H1B territory).
- Any taxonomy or canonical semantics.
- Mobile search-dialog trigger (`#searchToggleBtn`) — unaffected.
- Mobile offcanvas inline search form in navbar drawer — unaffected.

## Tests

### Unit
- `npm run test:unit` — **all pass** (existing tests, no new unit tests added — H1A is markup + factory-detection only).

### New browser spec — `tests/pf5-h1a-search-shell.spec.js`
Parameterised FI + EN, 7 scenarios × 2 = **14 test cases**, all PASS in 10.2 s isolated run:

- SSR shell exists before JS enhancement: single form with one input + submit
- After Modular UI init: exactly one visible search input on the page shell (the SSR input)
- No duplicate injected input inside `#siteSearchPageUi`
- `?q=` hydrates the SSR input value on load
- Desktop navbar inline search form is hidden on the search page (CSS via `body[data-translation-key="search"]`)
- Desktop navbar inline search form remains visible on non-search pages (control assertion)
- Hero eyebrow removed

### Updated existing spec
- `tests/search-modular-ui-pilot.spec.js` `Modular UI init failure falls back to the SSR form (no dead skeleton)` — updated to reflect that the SSR input EXISTS regardless of init state (it IS the shell now). Assertion "count = 0" replaced by asserting the SSR fallback input is visible and usable. All 40 pilot tests still pass.

### Full browser regression
- `pf5-h1a-search-shell.spec.js` + `search-modular-ui-pilot.spec.js` + `pf5-g1-navbar-modular-ui.spec.js` + `pf5-g2-presentations-shared-result.spec.js` + `pf-ui-l10n1-finnish-search-labels.spec.js` + `navigation.spec.js` + `accessibility.spec.js` + `accessibility-tools.spec.js` + `contrast.spec.js` = **128 pass / 2 documented-skip / 2 flake** (isolated re-runs of pilot pass 40/40).
- The 2 remaining flakes in the combined run are the **known baseline flakes** in `pf5-g1-navbar-modular-ui.spec.js` (`query returns family-typed shared-card results` and `N1: repeat open`). Verified against unchanged `origin/main`: **same tests flake at ~33% rate on baseline** (`--repeat-each=3` → 4/12 fail). These are pre-existing baseline flakes unrelated to H1A.
- `git diff --check` — clean.
- `npm run build:no-og` — PASS.

## Deferred for H1B (do NOT implement here)

Per the H1 audit's slice sequencing:
- Progressive facet disclosure (`Sisältö`-only default, secondary facets appear on domain choice) — H1B.
- Restructure `_search-page-config.njk` `facetGroups` into `global` + `secondaryFacetsByContentType` — H1B.
- Add DOM hide/show layer keyed on `Sisältö` selection — H1B.
- New URL-sync param for pre-selected `Sisältö` — H1B (or later).

Per H1A stop rule: **no facet-disclosure work in this slice**.

## Follow-ups also deferred (documented in H1 audit)

- Media Pagefind projection gap (would be a G3 slice).
- `renderExcerpt` non-convergence (F&E escapes vs presenter preserves `<mark>`) — untouched.
- FilterPills MutationObserver aria-label workaround — CONTINGENT DELETION when Pagefind exposes translation API.
- Generated unused `pagefind-ui.{js,css}` — build-ownership question.

## Final status

**PF5-H1A IMPLEMENTATION STATUS: READY FOR MERGE.**

Measured structural improvement: **-27% vertical distance to first result desktop, -0.55 screenfuls mobile, -1 visible search input on desktop XL**. Failure path preserved. FI/EN parity. Zero renderer/CSS-card change. Zero facet change. Zero taxonomy or canonical change.
