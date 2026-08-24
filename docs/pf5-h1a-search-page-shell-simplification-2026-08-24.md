# PF5-H1A Search page shell simplification

## Status

IMPLEMENTATION SLICE — implements the first slice recommended by the PF5-H1 audit's GO decision. Collapses `/haku/` and `/en/search/` from a two-input dual-form shell (content-detail-hero + SSR fallback card + Modular-UI-injected input) to a single SSR-authoritative search form that Modular UI enhances in place. No renderer/CSS card change, no result-card change, no facet change (H1B territory).

## Branch / base / HEAD

- **Branch:** `pf5/h1a-search-shell`
- **Worktree:** `/private/tmp/www-pf5-h1a-impl`
- **Base:** `origin/main` = `0c307f34761e594aa12fd553cbcb0bda8c7a0390` (post PF5-G2 closure PR #139)
- **HEAD at report time:** `0c307f34761e594aa12fd553cbcb0bda8c7a0390` (no commit yet — pending review)

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
