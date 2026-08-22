# C1 — Accessibility toolbar native primitive experiment

**Date:** 2026-08-22
**Branch:** `c1/a11y-native-panel` (worktree `/private/tmp/www-c1-a11y-native`)
**Base:** `origin/main` @ `52bc5416bcc4bdc17ce0d1d147dda8bdcee097e2`
**Scope:** only `#a11yPanel` accessibility toolbar. No changes to search overlay, mega menu, mobile disclosure, Find & Explore, Pagefind, Bootstrap, canonical content, or taxonomy.
**Status:** GREEN — Popover API selected, applied on branch.

---

## 1. Baseline (CONTROL) — pre-experiment ownership

`src/js/a11y.js` @ baseline is **302 LOC**. The open/close/dismiss/focus responsibilities carried by JS:

- `let previouslyFocused = null` — snapshot of focus before open.
- `getFocusable(container)` — focusable selector filter (~5 LOC).
- `trapPanelFocus(event)` — manual first/last cyclic Tab wrap (~15 LOC).
- `openPanel()` — sets `panel.hidden=false`, `aria-expanded='true'`, attaches trap, focuses first (~9 LOC).
- `closePanel()` — reverses above; restores `previouslyFocused` or trigger (~11 LOC).
- Trigger click handler — toggles open/close (~6 LOC).
- Close button click handler — calls `closePanel` (~1 LOC).
- Document-level click listener — outside-click → `closePanel` (~4 LOC).
- Document-level keydown listener — Escape → `closePanel` (~3 LOC).
- Four DOM lookups: `#a11yToolbar`, `#a11yTrigger`, `#a11yPanel`, `#a11yClose` (~4 LOC).

Markup contract at baseline: `<div role="dialog" aria-modal="true" hidden>` guarded by manual `hidden` toggle.

**Observed UX behavior:** small anchored corner panel; outside click closes; Escape closes; no visual backdrop; focus moves into panel on open. The manual focus trap is present, but the outside-click close contradicts the modal contract asserted by `aria-modal="true"` — this is a **non-modal light-dismiss** UX presented with modal markup.

**Lifecycle probe (new spec `tests/a11y-panel-lifecycle.spec.js`), × 20 iterations, Chromium:**

| Scenario | CONTROL |
|---|---|
| Trigger opens + outside click closes | 20/20 |
| Escape closes + focus returns to trigger | 20/20 |
| Close button closes | 20/20 |
| Interior click keeps open + toggle registers | 20/20 |
| Focus retained (trigger or inside panel) | 20/20 |
| 10-cycle open/close deterministic | 20/20 |
| **Total** | **120/120** |

Wall-clock: 3.2 min. Zero flake.

## 2. Test surface

New file: `tests/a11y-panel-lifecycle.spec.js` (~103 LOC). It asserts **observable browser behavior** (not implementation details) so that CONTROL, Popover, and Dialog can all run against the identical spec unmodified. The one non-obvious framing:

- `open retains focus on trigger or inside panel` — passes for both modal (focus inside) and non-modal (focus stays on trigger). The real UX invariant is that focus is not lost to `<body>`; the exact-target contract is implementation-specific and would improperly favor one primitive over another.

## 3. Candidate A — Popover API

**Markup change** (`src/_includes/_a11y-toolbar.njk`, 6 line diff):

```njk
<button id="a11yTrigger" popovertarget="a11yPanel" ...>
<div id="a11yPanel" popover="auto" aria-labelledby="a11yPanelTitle">
<button id="a11yClose" popovertarget="a11yPanel" popovertargetaction="hide" ...>
```

Removed attributes: `aria-expanded`, `aria-controls`, `aria-haspopup="dialog"`, `role="dialog"`, `aria-modal="true"`, `hidden`.

**CSS change** (`src/css/a11y.css`, +5/−4 net):

```css
.a11y-panel { ... margin: 0; padding: 0; inset: auto 1rem 5rem auto; }
.a11y-panel:not(:popover-open) { display: none; }
```

The `inset` override anchors the popover to the bottom-right corner (browser default is centered in the viewport when placed in the top layer).

**JS change** (`src/js/a11y.js`, −69 LOC, no additions):

Deleted entirely:
- `toolbar`, `trigger`, `panel`, `closeBtn` DOM lookups (4 LOC)
- `previouslyFocused` state (1 LOC)
- `getFocusable()` helper (5 LOC)
- `trapPanelFocus()` handler (15 LOC)
- `openPanel()` / `closePanel()` (25 LOC)
- Trigger click handler (6 LOC)
- Close-button click handler (1 LOC)
- Document-level click listener (outside-close) (4 LOC)
- Document-level keydown listener (Escape) (3 LOC)

**Net JS delta:** 302 → 233 LOC (−22.8 %). The remaining code is the orthogonal settings surface (font size, toggles, swatches, TTS, reset) — unchanged.

**Lifecycle probe, × 20:**

| Scenario | POPOVER |
|---|---|
| Trigger opens + outside click closes | 20/20 |
| Escape closes + focus returns to trigger | 20/20 |
| Close button closes | 20/20 |
| Interior click keeps open + toggle registers | 20/20 |
| Focus retained (trigger or inside panel) | 20/20 |
| 10-cycle open/close deterministic | 20/20 |
| **Total** | **120/120** |

Wall-clock: 2.4 min (25 % faster than CONTROL). Zero flake.

**Regression check** — `tests/accessibility-tools.spec.js` (5) + `tests/navigation.spec.js` (7): **12/12 pass**.

## 4. Candidate B — native `<dialog>.showModal()`

**Markup change:** replace `<div class="a11y-panel">` with `<dialog class="a11y-panel">`. Retain `aria-haspopup="dialog"` on trigger, drop `hidden`.

**CSS change:** `.a11y-panel { margin: 0; padding: 0; inset: auto 1rem 5rem auto; }`, `.a11y-panel:not([open]) { display: none; }`, `.a11y-panel::backdrop { background: transparent; }`.

**JS change** — kept:
- All four DOM lookups (trigger, panel, closeBtn, toolbar).
- `getFocusable()` helper.
- **Boundary Tab wrap** (`wrapPanelTab`, ~13 LOC) — the N1 experiment proved Chromium's native `<dialog>` does not wrap Tab back into the dialog; this is a deterministic Chromium gap that requires JS to close.
- Trigger click handler — `panel.showModal()` / `panel.close()`.
- Close-button click handler.
- **Backdrop-click handler** on the dialog element (`event.target === panel` → close) — attempts to imitate CONTROL's light-dismiss UX, but see §5.

**Net JS delta:** 302 → 286 LOC (−5.3 %).

**Lifecycle probe, × 20:**

| Scenario | DIALOG |
|---|---|
| Trigger opens + outside click closes | **0/20** ❌ |
| Escape closes + focus returns to trigger | 20/20 |
| Close button closes | 20/20 |
| Interior click keeps open + toggle registers | 20/20 |
| Focus retained (trigger or inside panel) | 20/20 |
| 10-cycle open/close deterministic | 20/20 |
| **Total** | **100/120** |

The failure is **deterministic, not flaky**. Root cause: `<dialog>.showModal()` places a `::backdrop` pseudo-element in the top layer that intercepts pointer events. A user click on `<main>` never dispatches — the click target under the backdrop is unreachable. The custom `event.target === panel` handler only fires when the user hits the dialog element itself (i.e. the backdrop region), not when they click on the real page content. This is a fundamental modal-vs-non-modal semantic mismatch.

**Regression check:** 12/12 pass on the existing specs (which don't test outside-click).

## 5. Deletion ledger — measured

| Metric | CONTROL | POPOVER | DIALOG |
|---|---|---|---|
| `src/js/a11y.js` LOC | 302 | **233** (−69) | 286 (−16) |
| Custom focus trap | present | **removed** | replaced by boundary wrap |
| `previouslyFocused` state | present | **removed** | removed |
| Document-level Escape listener | present | **removed** (browser) | removed (browser via `cancel`) |
| Document-level outside-click listener | present | **removed** (browser light-dismiss) | replaced by dialog-target click handler |
| Manual `hidden` / `aria-expanded` sync | present | **removed** (browser) | removed (browser via `[open]`) |
| Focus return on close | manual | **automatic** (browser) | automatic (browser) |
| Lifecycle probe pass | 120/120 | **120/120** | 100/120 |
| Existing regression suite | baseline | 12/12 | 12/12 |
| Semantic role fit | mismatched (`aria-modal` claim vs light-dismiss UX) | **correct** (non-modal anchored) | mismatched (modal with hacked light-dismiss) |
| Visual UX change vs baseline | — | **none** | modal backdrop (even if transparent) blocks page interaction |

## 6. Decision — POPOVER wins

> Popover is **not** selected because it is newer. It is selected because it matches the actual interaction semantics observed at baseline (non-modal, light-dismiss, anchored) and, in doing so, deletes more custom ownership (69 LOC vs 16 LOC) without changing the visible UX.

**Rationale:**

1. **Behavior parity or better** — 120/120 vs CONTROL's 120/120, no regression on the existing 12 specs.
2. **Largest verifiable deletion** — 69 LOC of ownership removed vs Dialog's 16. All four responsibility categories (open/close, dismiss, focus return, ARIA sync) shift to the browser.
3. **Semantic correctness** — the panel is observably a non-modal anchored settings surface. Popover matches; Dialog imposes a modal contract that then requires custom handlers to walk back.
4. **No timing loops, no MutationObserver, no `setTimeout` focus hacks.** The Popover version is entirely declarative from the browser's side.
5. **No focus trap or `inert` added.** Popover's non-modal contract is respected — focus stays on the trigger on open (this matches the "focus retained" invariant without imitating a dialog).
6. **Visual parity preserved** — the panel occupies the same anchored corner position; no backdrop; no size change; no color change. CSS delta is 3 lines (`margin`, `padding`, `inset`) plus one selector rename (`[hidden]` → `:not(:popover-open)`).

**Why Dialog was rejected:**

- It fails the observable outside-click UX (0/20 on that scenario).
- It requires a custom `event.target === panel` handler to hack backdrop-click closure — reintroducing ownership Popover deletes for free.
- It carries the N1-proven Chromium Tab-wrap boundary gap; even the minimal fix (13 LOC boundary wrap) is more code than Popover keeps.
- It visually changes the surface from an anchored panel to a modal-with-backdrop, even if the backdrop is transparent.

## 7. What was NOT touched (invariant checklist)

- Search overlay (`#searchOverlay`) — untouched.
- Mega menu, mobile disclosure — untouched.
- Find & Explore, Pagefind — untouched.
- Bootstrap dependency — unchanged.
- Canonical content, taxonomy — untouched.
- All settings surface handlers (font, contrast, motion, focus assist, dyslexia font, spacing, reading guide, background, TTS, reset) — unchanged.

## 8. Verification run summary

- `npm run test:unit`: **602/602 pass**, 1.26 s.
- `npm run build:no-og`: clean build.
- `tests/a11y-panel-lifecycle.spec.js` (Popover) × 20: **120/120**, 2.4 min, zero flake.
- `tests/accessibility-tools.spec.js` + `tests/navigation.spec.js` (Popover, single-pass): **12/12**, 5.2 s.
- Combined targeted run (lifecycle + a11y + nav): **18/18**, 14.8 s.

## 9. Files changed on branch

| File | Delta |
|---|---|
| `src/_includes/_a11y-toolbar.njk` | +3 / −3 (attribute swap) |
| `src/css/a11y.css` | +5 / −4 |
| `src/js/a11y.js` | +0 / −69 |
| `tests/a11y-panel-lifecycle.spec.js` | +103 (new) |
| `docs/c1-accessibility-toolbar-native-experiment-2026-08-22.md` | +this file |

## 10. Cross-browser matrix (PR-preparation follow-up)

Ad-hoc run with a temporary `playwright.crossbrowser.tmp.js` config (deleted after use) against the same `tests/a11y-panel-lifecycle.spec.js` on the winning Popover implementation:

| Scenario | Chromium | Firefox | WebKit |
|---|---|---|---|
| Trigger opens + outside click closes | ✅ | ✅ | ✅ |
| Escape closes + focus returns to trigger | ✅ | ✅ | ❌ (see below) |
| Close button closes | ✅ | ✅ | ✅ |
| Interior click keeps open + toggle registers | ✅ | ✅ | ✅ |
| Focus retained (trigger or inside panel) | ✅ | ✅ | ❌ (see below) |
| 10-cycle open/close deterministic | ✅ | ✅ | ❌ (see below) |
| **Per-engine pass** | **6/6** | **6/6** | **3/6** |

**PROVEN** — Core Popover semantics (open/close/dismiss/interior-click) work identically on all three engines.

**PROVEN** — The three WebKit failures are all `expect(trigger).toBeFocused()` after `trigger.click()`. This reflects the macOS/WebKit platform convention where **a mouse click on a `<button>` does not move focus to it**; the platform reserves button focus for keyboard activation. A keyboard-activated flow was verified via a temporary ad-hoc test (`trigger.focus(); page.keyboard.press('Enter'); ... Escape ...`): **3/3 pass on Chromium + Firefox + WebKit**.

**INFERENCE** — This is not a Popover primitive gap; it is a Playwright test-harness assertion that only holds under browsers that focus buttons on mouse click. The repo's CI runs Chromium only (`playwright.config.js` `projects: [{ name: 'chromium' }]`), so the primary lifecycle spec ships unchanged. If Firefox/WebKit are ever added to CI, the mouse-driven focus assertion should be replaced with an engine-neutral keyboard-driven variant.

## 11. Progressive enhancement / no-JS behavior

Verified with a temporary spec (deleted after use) running Chromium with `javaScriptEnabled: false`:

- **PROVEN** — The declarative Popover contract (`popovertarget` on trigger and close button, `popover="auto"` on panel) works end-to-end without any page JS. Programmatic DOM click on the trigger toggled `:popover-open`, moved `display: none → block`, and the close button (with `popovertargetaction="hide"`) restored `display: none`. Browser owns the entire lifecycle.
- **NEEDS FOLLOW-UP** — Under headless Chromium with JS disabled, **the entire site's layout collapses to 0×0 dimensions** (verified: `body`, `main`, `.navbar-brand` all report `{width: 0, height: 0}`). This means Playwright's element-based `.click()` cannot reach the visually-rendered trigger (it computes 0×0 bounds). This is a site-wide CSS/hydration dependency unrelated to the Popover primitive. In a real user's browser with JS disabled but a real render engine, the trigger would be laid out normally. Out of scope for this experiment; recommend follow-up investigation of the site's no-JS layout invariants.
- **INFERENCE** — Preference controls (font size, contrast, motion, TTS, etc.) require JS to have effect. This is the baseline behavior — no regression.

No JS open/close wrapper was added. The panel lifecycle is 100% declarative browser-owned.

## 12. Not done (per directive)

- No push, no PR, no merge, no worktree cleanup.
- Branch `c1/a11y-native-panel` sits with the Popover winner applied and the Dialog variant fully reverted (verified by clean `git diff` against `origin/main` for the three implementation files, showing only Popover changes).
