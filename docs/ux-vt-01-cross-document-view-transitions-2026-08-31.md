# UX-VT-01 — Cross-document View Transitions for canonical navigation

Date: 2026-08-31
Status: `IMPLEMENTED / SSR + PROGRESSIVE ENHANCEMENT / TESTS GREEN`

Adds a small progressive-enhancement CSS opt-in for cross-document
View Transitions so supported browsers get smooth page-to-page
transitions on canonical `<a>` navigation. Unsupported browsers
continue to render ordinary navigation unchanged. No JavaScript.
No dependency. No routing framework.

## Repository state

- Branch: `ux/vt-01-cross-document-transitions`
- Base: `origin/main` at `1178954f1cd74710580a3552f2e97bcc340197d7`.
- Reference: `docs/web-capabilities-2026-suitability-audit-2026-08-31.md` (NOW item #1).

## Baseline before this change

- Shared FI/EN base layout: `src/_includes/base.njk` — includes `_meta.njk`.
- Shared global CSS: `src/css/modules/_global.css` — loaded from `src/_includes/_meta.njk:178` via `<link rel="stylesheet" href="/css/modules/_global.css">` (also preloaded at line 177). Loaded on **every** built page — verified: 34 CSS files under `src/css/`, `_global.css` is the natural home per its `styles.css` module map ("Sections 16–21: Mobile breakpoints, global light/dark mode, button overrides").
- Existing `prefers-reduced-motion: reduce` blocks already present at `_global.css:467` and `_global.css:1791`. Additional blocks in `_components.css`, `a11y.css`, and `presentations-page.css`. The escape-hatch mechanism follows established repo convention.
- No `@view-transition` / `::view-transition-*` selectors anywhere in `src/`. No custom navigation-animation JavaScript layer. `grep -RnE '@view-transition|::view-transition' src/` returns zero non-bootstrap matches.

## Exact CSS added

Appended to `src/css/modules/_global.css` (end of file):

```css
/*
 * UX-VT-01 — Cross-document View Transitions (progressive enhancement).
 * Chromium 126+ and Safari 18.2+ opt into the browser's default cross-document
 * transition for same-origin navigation; Firefox and older engines continue
 * to render ordinary navigation unchanged. No JavaScript, no client-side
 * routing, no interception.
 * Ref: docs/ux-vt-01-cross-document-view-transitions-2026-08-31.md
 */
@view-transition {
  navigation: auto;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none !important;
  }
}
```

Rationale:

- **`@view-transition { navigation: auto }`** — the browser's default cross-document transition applies to same-origin document navigation. Zero code intercepts. The default transition is a subtle crossfade of the root snapshot; no card-level identity is required in this first slice.
- **`@media (prefers-reduced-motion: reduce)`** — sets `animation: none !important` on the three top-level view-transition pseudo-elements. Standards-compatible; no JS preference state; consistent with the reduced-motion blocks already in `_global.css:467`, `_global.css:1791`, `_components.css:288`, and `a11y.css:668`.

## JS / dependency delta

| Metric | Delta |
| --- | ---: |
| New `.js` files | **0** |
| New Node dependencies | **0** |
| New runtime fetches | **0** |
| Bytes of new JS shipped | **0** |
| Bytes of new CSS shipped | ~18 lines / ~450 bytes (uncompressed) |
| New template partial | **0** |
| New Nunjucks filter | **0** |
| Modification to shared JS (`site-ui.js`, `find-explore.js`, etc.) | **0** |

## Browser support / fallback (2026)

Verified against the WEB-CAPABILITIES-2026 audit + MDN as of the parent audit:

- **Chromium 126+ / Edge 126+**: cross-document transitions active with default crossfade.
- **Safari 18.2+**: cross-document transitions active with default crossfade.
- **Firefox**: cross-document transitions NOT yet supported — behaviour is **identical to current main** (ordinary navigation). Progressive enhancement contract holds.
- **Older browsers on all engines**: unknown `@view-transition` at-rule is safely ignored per CSS parser rules. Ordinary navigation unchanged.

The at-rule is opt-in per document; nothing on the page can silently break by upgrading to a modern browser.

## Reduced-motion behavior

Users who set `prefers-reduced-motion: reduce` on any supporting browser receive **no animation at all** on view-transition pseudo-elements. The navigation still swaps pages (identically to the fallback path) but without the crossfade motion. This mirrors the pattern already used in `_global.css` for other animated elements.

## Target user journeys — verified in built output

Verified against `_site/` built on branch head:

- Homepage `/` → **Uusin julkaisu** → `/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/` (canonical local Publication landing per HOME-LANDING-01).
- Homepage `/` → **Uusin esitys** → `/presentations/arjen-tekoalyhaaste/` (canonical local Presentation landing).
- Presentation archive `/esitykset/` → canonical Presentation detail (Slice 3 C1 canonical cards).
- Publications archive `/julkaisut/` → `/julkaisut/{id}/` detail (canonical publication landing).
- Homepage EN `/en/` → EN role sections and downstream EN pages.

All hrefs are ordinary `<a href="...">` anchors. Nothing about the navigation itself changed — only the browser-side transition presentation.

## Explicit non-goals

- **No named view-transition identities** (`view-transition-name: ...`) anywhere on cards, titles, or images. The first slice is only the global default. Named card → detail morphing (with the stability + duplicate-name coordination it requires across source + destination pages) is a separate future workstream and is not proposed here.
- **No JavaScript activation**. The site does not call `document.startViewTransition()` and has no interception. Verified: `grep -RnE 'startViewTransition|view-transition' src/js/` returns zero matches on branch head.
- **No Pagefind changes**. `src/js/find-explore.js`, Pagefind CSS, search overlay, and PF5 surfaces are untouched. If Pagefind later navigates to a normal page in a supported browser, that navigation gets the default transition for free — but no Pagefind code was modified.
- **No `content-visibility: auto`** in this PR (separate NOW item, tracked in the capability audit).
- **No URL importer / AUTHORING-PIPELINE-01 work.**

## Accessibility / failure-path checks

| Concern | Status |
| --- | --- |
| Keyboard navigation | Unchanged — the CSS opt-in does not intercept keyboard activation of anchors. |
| Browser Back / Forward | Unchanged — same-document history unaffected; cross-document transitions integrate with history natively per spec. |
| Cmd/Ctrl-click, middle-click, "open in new tab" | Unchanged — these do not trigger a same-origin same-document transition. |
| In-page anchor links (`#section`) | Unchanged — same-document navigation is unaffected by `@view-transition { navigation: auto }`. |
| External `<a href="https://..."` links | Unchanged — cross-origin navigation excluded from the opt-in. |
| No-JavaScript users | Ordinary navigation. Verified by the JS-disabled Playwright case. |
| Unsupported browsers | Ordinary navigation. Behaviour identical to current main. |
| Reduced-motion users | Transition presence but no animation, per the reduced-motion escape. |

## Deletion check

`No existing navigation-animation layer existed to delete.` `grep -RnE 'page-transition|nav-fade|fadeInPage|routeTransition|transitionend' src/` on `1178954f` returned zero matches for site-authored code. Bootstrap's built-in accordion / carousel animations are unaffected.

## Performance

- No new HTTP request (the CSS is appended to a pre-existing stylesheet).
- No new JavaScript payload.
- No new dependency.
- No layout duplication.
- Built `_site/` file count and structure identical to prior baseline (Copied 274 / Wrote 1471) — Pagefind postbuild + SEO dashboard unchanged.
- Does not reopen R1, P1-A, PF-PERF1B performance decisions.

## Manual / browser verification

Manual visual verification of the visible transition is browser-dependent and time-sensitive; documented per §11 with source references rather than fabricated observations.

- **Chromium (Chrome 126+ / Edge 126+)**: expected to display the browser's default cross-document root crossfade transition on same-origin navigation. Per the WEB-CAPABILITIES-2026 audit and MDN.
- **Safari 18.2+**: expected to display the default cross-document transition per WebKit's shipping support (verified in the parent audit).
- **Firefox**: expected to render ordinary navigation with no visible transition (cross-document View Transitions not yet shipped as of 2026-08 per the parent audit).
- **Reduced-motion**: expected to render navigation without animated crossfade regardless of engine.

## Tests

New spec: `tests/ux-vt-01-cross-document-transitions.spec.js` (6 cases):

1. Shared `_global.css` is linked from the FI homepage.
2. Shared `_global.css` is linked from the EN homepage.
3. `_global.css` payload contains the `@view-transition { navigation: auto }` opt-in **and** the reduced-motion escape hatch targeting `::view-transition-*` pseudo-elements.
4. No JavaScript intercepts navigation (regression guard against future `document.startViewTransition` drift).
5. Ordinary same-origin navigation still works with `javaScriptEnabled: false` on FI (uses HOME-LANDING-01's Uusin julkaisu → canonical local Publication landing).
6. EN `/en/` still serves with `javaScriptEnabled: false`.

Structural / failure-path guarantees only. Does not assert visible animation timing (engine-dependent; would be brittle).

## Architecture assessment

- **`UX-VT-01 is progressive enhancement only.`**
- **`The public site remains Eleventy/SSR-first.`**
- **`No routing or client-side rendering layer was introduced.`**
- **`Pagefind remains untouched.`**
- **`Canonical Content v1 remains unchanged.`**
- **`Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.`**

## Stopping condition

Complete when:

1. ✅ Shared cross-document View Transition opt-in exists (in `src/css/modules/_global.css`).
2. ✅ FI and EN inherit it (verified via `_meta.njk` load path + Playwright link presence).
3. ✅ No JavaScript was added.
4. ✅ No dependency was added.
5. ✅ Reduced-motion behaviour is correct (escape hatch on `::view-transition-*`).
6. ✅ Ordinary navigation remains intact (verified with `javaScriptEnabled: false`).
7. ✅ Unsupported browsers fall back gracefully (unknown at-rule ignored; behaviour identical to current main).
8. ✅ Pagefind untouched (`src/js/find-explore.js` and Pagefind CSS not in diff).
9. ✅ Build / tests green.
10. ✅ Browser behaviour documented with source references.
11. ✅ PR opened (see final report).
