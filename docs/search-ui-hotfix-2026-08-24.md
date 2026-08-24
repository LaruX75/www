# Search UI hotfix — post PF5-H1B closure

## Status

**CLOSED / GREEN / MAIN.** Merged 2026-08-24 as PR [#144](https://github.com/LaruX75/www/pull/144); merge commit `b2b45ef0dab6dd054f572710ea04989f6acd96df` is the current `origin/main`. Post-merge Actions run [32763183901](https://github.com/LaruX75/www/actions/runs/32763183901) — build / deploy / smoke all success. Production HTTP + headless-Chrome behaviour verified on merged main.

Small hotfix restoring three regressions reported on `main` after PF5-H1B closure. Does NOT reopen PF5-H1A or PF5-H1B architecture.

## Closure / merged state (2026-08-24)

| | |
|---|---|
| PR | [#144](https://github.com/LaruX75/www/pull/144) — MERGED |
| mergedAt | 2026-08-24T18:34:24Z |
| Implementation head SHA | `659af879f4908f94375e315e393ef1733462effd` |
| Merge commit SHA | `b2b45ef0dab6dd054f572710ea04989f6acd96df` |
| Resulting `origin/main` | `b2b45ef0dab6dd054f572710ea04989f6acd96df` |
| Previous `origin/main` | `62395c5a1695790538f0ce1a5b7b722a2f0aff63` (post PF5-H1B closure) |
| Pre-merge PR CI | build-and-verify PASS (5m49s), playwright PASS (8m14s), CLEAN |
| Post-merge Actions run | [32763183901](https://github.com/LaruX75/www/actions/runs/32763183901) — build ✓ / deploy ✓ / smoke ✓ |
| Production `/`, `/haku/`, `/en/search/` | all HTTP/2 200 |
| Production hotfix CSS shipped | `pagefind-modular-filter-pill` overrides present in `/css/modules/_components.css` (PROVEN via curl) |

## Root causes + exact fixes

### 1. Dark theme FilterPills text unreadable
- **Root cause:** Pagefind's own `pagefind-modular-ui.css` uses fixed `--pagefind-ui-fade: #707070` grey for pill text — near-invisible on the dark theme's near-black surface. Measured baseline: `color: rgb(112, 112, 112)` on `rgba(184, 220, 255, 0.12)` = ~2.5:1 contrast (WCAG fail).
- **Fix:** site-owned CSS in `src/css/modules/_components.css` overrides `.pagefind-modular-filter-pill` colours with Bootstrap theme tokens (`--bs-body-color`, `--bs-tertiary-bg`, `--bs-secondary-bg`, `--bs-border-color`, `--bs-primary-rgb`). Selected `[aria-pressed="true"]` inverts to `--bs-body-bg` on `--bs-body-color`. Inner `<span>` inherits.
- **Verified on merged main (dark theme, `/haku/?q=tekoäly`):**
  - Unselected pill contrast: **11.57:1** (was ~2.5:1) — WCAG AAA
  - Selected pill contrast: **13.20:1** — WCAG AAA

### 2. Result cards show bullet + no vertical spacing
- **Root cause:** `renderSharedCard` emits `<li class="find-explore-result">` inside `<div data-search-modular-results>` (not `<ol>`/`<ul>`). Browsers apply default `list-style: disc` on `<li>` regardless of parent; container has no `gap`. Measured baseline: `list-style: disc` on li, `gapBetweenLi: 0 px`.
- **Fix:** site-owned CSS on `[data-search-modular-results]` sets `list-style: none; padding-left: 0; margin: 0; display: grid; gap: 1rem;` and belt-and-suspenders `list-style: none` on direct `> li`.
- **Verified on merged main:** container `display: grid`, `gap: 16px`, `list-style: none`; li `list-style: none`; gap between li = **16 px**.

### 3. Navbar search field "disappears" after first search
- **Root cause chain:**
  1. Desktop-XL user submits inline `<form class="site-nav-search" action="/haku/">`.
  2. Pre-hotfix `runSearchForm` unconditionally navigated to `form.action` (`/haku/`) — pre-PF5-G1 behaviour that survived unchanged.
  3. On `/haku/`, PF5-H1A CSS rule `body[data-translation-key="search"] .site-nav-search { display: none !important; }` hides the navbar inline form (deliberate per H1A — page's own SSR search is authoritative).
  4. User perception: "navbar field disappeared after search".
- **Fix:** `src/js/site-ui.js` `runSearchForm` now prefers dialog when a `searchOverlay` element exists in DOM — matches the PF5-G1 intended navbar model (navbar = dialog/overlay, `/haku/` = explicit full search page). Full-page navigation via `form.action` retained ONLY as ultimate fallback (no `searchOverlay` in DOM). `action="/haku/"` on the SSR form is preserved verbatim so the JS-disabled fallback still works via native browser submit.
- **Verified on merged main:**
  - First navbar submit on `/`: URL stays `/`, dialog opens with query prefilled (`tekoäly`).
  - Escape closes dialog, navbar form remains visible on `/`.
  - Second navbar submit: dialog reopens with new query (`oppiminen`), no navigation.
  - EN parity on `/en/`: same behaviour with `learning` query.
  - Fallback contract preserved: form still ships `action="/haku/"` `method="get"`.

## Files changed (3)

| File | Change | LOC |
|---|---|---|
| `src/css/modules/_components.css` | CSS hotfix block for result-list marker/gap + FilterPill theme-adaptive colours | +57 |
| `src/js/site-ui.js` | `runSearchForm` prefers dialog when `searchOverlay` present; `form.action` retained as no-dialog / JS-disabled fallback | +19 / −7 |
| `tests/pf5-hotfix-search-ui-regressions.spec.js` | new — 7 regression cases (bullet+gap, dark unselected/selected contrast ≥ 4.5:1, navbar no-navigation, post-Escape visibility, fallback action preserved, EN parity) | +176 |

## Tests

| Check | Result |
|---|---|
| `git diff --check` | clean |
| `npm run test:unit` | 612 pass / 0 fail |
| `npm run build:no-og` | PASS |
| New hotfix spec (7 cases) | 7/7 PASS |
| Full browser regression (8 spec files) | 128 pass / 6 documented-skip / 1 pre-existing baseline flake (`navigation.spec.js:143` — cleared 5/5 on isolated re-run; same flake documented across PF5-G1/G2/H1A/H1B closures) |
| Pre-merge PR CI | build-and-verify PASS, playwright PASS |
| Post-merge Actions | build ✓ / deploy ✓ / smoke ✓ |

## H1A / H1B invariants preserved (verified on merged main)

- **H1A:** `/haku/` visible search inputs = `["siteSearchPageInput"]` (one input); `injectedInMount = 0` (no duplicate); navbar hidden on search page.
- **H1B:** default visible facets = `["Sisältö"]`; 11 secondary slots hidden.
- **PF5-G1 navbar Modular UI dialog lifecycle:** intact (Escape closes, focus returns, dialog reopens cleanly).
- **SSR fallback form** `action="/haku/"` / `action="/en/search/"` `method="get"` preserved verbatim on both search pages and the navbar inline form.
- **Pagefind ranking / metadata / filters / taxonomy / canonical semantics:** all unchanged.
- **`SearchResultPresenter`** / renderSharedCard DOM: unchanged.

## Deferred (not fixed here, recorded for future consideration)

**Semantic `<li>` inside non-list container.** `SearchResultPresenter.renderSharedCard` currently emits `<li class="find-explore-result">` into `<div data-search-modular-results>` — not a proper `<ol>`/`<ul>`. This hotfix resolves the *visible* symptom (bullet + gap) via CSS but does not fix the underlying semantic mismatch. Candidate for a later small cleanup: either wrap the container as `<ol data-search-modular-results>` or change the presenter to emit `<div class="find-explore-result">`. Not opened here — CSS fix is sufficient for the user-facing regression.

## Not started

- ❌ PF5-H1C — result-content hierarchy refinement.
- ❌ PF5-G3 — media Pagefind projection.
- ❌ PF5-G4 — writings meta widening.
- ❌ BBS / Gopher / theme workstreams.
- ❌ Any broader architecture change.
