# Native HTML primitives suitability audit

Date: 2026-08-22

Status: AUDIT ONLY. No production code changed. No new workstream started.

Audit worktree: `/private/tmp/www-c1-audit`
Audit branch: `audit/c1-native-primitives`
Base main SHA: `5ca4a617b738095689857f1faf26a547937206f3`

## Executive summary

Five most important findings (evidence in § Detailed findings):

1. **Accessibility toolbar (`#a11yPanel`) is the strongest native-primitive deletion candidate.** It duplicates the same pattern N1 already replaced for the search overlay: custom `role="dialog" aria-modal="true"` + `hidden` toggle + manual focus trap + document-level Escape + document-level outside-click + focus return. `src/js/a11y.js` currently owns all of this in ~50 LOC that native `<dialog>.showModal()` (or the Popover API) would collapse to a two-attribute markup change plus a single `close` event listener for focus return. This is the strongest candidate and matches N1's proven architectural pattern.
2. **Mobile-disclosure system is mostly KEEP CUSTOM.** Ten `[data-*-mobile-collapse]` groups in `src/js/site-ui.js:238-249` wrap native `<details>` with responsive open/close policy, hash-aware opening, `keepOpen` overrides, and only conditional peer-exclusivity (`closePeersOnHash` on the `kynasta` group). Native `<details name="…">` provides only *always-exclusive* accordion behavior — no responsive policy, no hash-aware opening, no keep-open logic. The custom code is doing work that has no native equivalent; only one micro-slice (`kynasta` peer-exclusive) is a marginal OPTIONAL SEMANTIC UPGRADE.
3. **Mega menu is KEEP CUSTOM.** The desktop keyboard model (arrows, Home/End, split parent-link vs. toggle, focusout-close, Bootstrap integration) has no native primitive that would delete more code than it would move. Popover API would strip parent-anchor semantics and Bootstrap dropdown integration; the LOC saved would immediately be re-added elsewhere.
4. **Bootstrap `.modal` uses (`thesisCitationModal`, `chartZoomModal`) are NEEDS EXPERIMENT, not obvious wins.** Bootstrap remains loaded for other components (offcanvas mobile menu, dropdowns), so converting these two modals to native `<dialog>` doesn't drop the Bootstrap dependency. The event chain (`shown.bs.modal` triggering chart-instance rebuild) requires rework, and the animation contract shifts. Real deletion is smaller than headline.
5. **`<input type="search">` is already universal on this site; `<search>` wrapper is a low-priority OPTIONAL SEMANTIC UPGRADE.** Every search input already uses `type="search"` (verified in nav FI + EN, blog-list, find-explore-writings, presentations/archive). `role="search"` is on every relevant form; wrapping those forms in a `<search>` element is a semantic tidy that deletes zero JS and zero state.

## Evidence conventions

- **PROVEN** — directly observed in current source (file paths, line ranges, grep output). Used throughout the Detailed findings for markup structure, current JS ownership, and the "Already native" verifications.
- **INFERENCE** — likely architectural implication drawn from the source but not directly executed. Applied to LOC-deletion estimates (labeled *estimates*), to the ownership-transfer claims for the accessibility toolbar candidate, and to the "moves complexity rather than deletes it" verdicts on KEEP CUSTOM items.
- **NEEDS BROWSER TEST** — cannot be determined from source alone. Called out explicitly for: (a) whether Chromium's dialog Tab-wrap gap that N1 encountered manifests on the a11y panel (candidate 1); (b) whether Popover vs. `<dialog>` matches intended UX for the a11y panel; (c) whether the `shown.bs.modal` → Chart.js re-init lifecycle can be replaced by a `showModal()`-then-`requestAnimationFrame` chain without visual regression (candidate 2).

Numeric LOC counts are labeled *estimates*; treat them as INFERENCE, not measurement.

## Current architecture context

- **origin/main SHA**: `5ca4a617b738095689857f1faf26a547937206f3`
- **N1**: `CLOSED / GREEN / MAIN` (PR #124). Search overlay uses native `<dialog>` + minimal boundary-only cyclic Tab wrap; interior traversal is native; focus return is centralized in the native `close` event.
- **C1**: CROSS-CUTTING. This audit is a C1 suitability sweep, not a new implementation workstream.
- Other closed lanes (informational): T1, O1, primary Find & Explore migrations, presentations/media F&E, canonical content v1.
- Later lanes (informational): PF5, R1, P1, UX1, AC1.

## Inventory

| Current component | Current implementation | Native primitive | Classification | Deletion potential | Risk |
| --- | --- | --- | --- | --- | --- |
| Accessibility toolbar (`#a11yPanel`) | Custom `role="dialog" aria-modal="true"` + `hidden` + manual JS trap/Escape/outside-click/focus-return in `src/js/a11y.js` | native `<dialog>.showModal()` OR Popover API | **NATIVE CANDIDATE** | ~50 LOC + 3 document listeners + `trapPanelFocus`/`getFocusable` helpers | Low (N1 proved the pattern) |
| Mobile disclosure groups (10 `[data-*-mobile-collapse]` families) | Native `<details>` wrapped by responsive/hash-aware JS in `src/js/site-ui.js:238-249` | `<details name="…">` (always-exclusive) covers a tiny subset only | **KEEP CUSTOM** (one micro-slice = OPTIONAL SEMANTIC UPGRADE) | ~0 LOC. `kynasta` peer-closing only if you accept always-exclusive semantics — even then hash-aware opening remains custom | Medium if forced (semantics regression on 9/10 groups) |
| Mega menu | Custom desktop keyboard nav (arrows/Home/End/Escape), split parent-link/toggle, Bootstrap integration, focusout-close in `src/js/site-ui.js:347-520` | Popover API would remove parent-anchor semantics + Bootstrap integration | **KEEP CUSTOM** | ~0 LOC. Any conversion moves complexity, does not delete it | High (regression risk on established UX contract) |
| Search overlay (`#searchOverlay`) | Native `<dialog>` + minimal boundary-only trap (N1 landed) | Already native | **ALREADY NATIVE** | 0 (done) | 0 |
| Thesis citation modal (`#thesisCitationModal`) | Bootstrap `.modal` + `bootstrap.Modal.getOrCreateInstance` in `src/js/thesis-hub-actions.js` | native `<dialog>` | **NEEDS EXPERIMENT** | Small — Bootstrap stays loaded for other components; event chain rework required | Medium |
| Chart zoom modal (`#chartZoomModal`) | Bootstrap `.modal` + `shown.bs.modal` event-driven chart rebuild in `src/julkaisut.njk:685+` | native `<dialog>` | **NEEDS EXPERIMENT** | Small — same Bootstrap-still-loaded caveat; `shown.bs.modal` lifecycle drives Chart.js re-init and needs a replacement event | Medium |
| Site nav search forms (both locales) + Find & Explore forms + site search page fallback | `<form role="search">` | `<search>` element wrapping the form | **OPTIONAL SEMANTIC UPGRADE** | 0 LOC of JS; small markup improvement | 0 |
| All text search inputs (nav FI + EN + mobile, blog-list, find-explore-writings, presentations/archive) | `<input type="search">` | Already native | **ALREADY NATIVE** | 0 (done) | 0 |
| Datalist autocomplete on presentation topic filter | `<input list=…>` + `<datalist>` | Already native | **ALREADY NATIVE** | 0 (done) | 0 |
| `inert` for background suppression | Not currently used | Native `inert` attribute | **N/A now** (bundled inside `<dialog>.showModal()` if a11y panel is converted) | 0 standalone | 0 |
| `hidden="until-found"` | No current use case | Native attribute | **N/A now** (no SSR-collapsed content requires browser Find-in-page opening) | 0 | 0 |
| `<time>` semantic | Not used; dates rendered via `dateFormat` filter as plain text | Native `<time datetime="…">` | **OPTIONAL SEMANTIC UPGRADE** (low priority; SEO/machine-reading only) | 0 LOC of JS; Nunjucks template tweak | 0 |

## Detailed findings

### 1. Accessibility toolbar (`#a11yPanel`) — NATIVE CANDIDATE

#### Current implementation

- Markup: `src/_includes/_a11y-toolbar.njk`. Trigger `<button id="a11yTrigger" aria-expanded="false" aria-controls="a11yPanel" aria-haspopup="dialog">`. Panel `<div id="a11yPanel" role="dialog" aria-modal="true" aria-labelledby="a11yPanelTitle" hidden>`.
- State + interaction JS: `src/js/a11y.js` lines 22 (grab elements), 95-99 (`getFocusable`), 102-116 (`trapPanelFocus`), 118-126 (`openPanel`), 128-138 (`closePanel`), 194-200 (trigger click toggle), 202 (close button), 204-207 (document-level outside-click), 209-211 (document-level Escape).

#### Current ownership

| Concern | Owner |
| --- | --- |
| Markup | Nunjucks |
| Open/close state | `a11y.js` (manual `hidden` toggle + `aria-expanded` sync) |
| Focus trap (Tab/Shift+Tab) | `a11y.js` `trapPanelFocus` + `getFocusable` |
| Escape close | `a11y.js` document-level listener |
| Outside-click close | `a11y.js` document-level listener |
| Focus return | `a11y.js` `previouslyFocused` capture + restore in `closePanel` |
| ARIA state | `a11y.js` manually toggles `aria-expanded` |

#### Native alternative

Two credible options; the choice depends on intended UX:

- **Native `<dialog>.showModal()`** — matches the current `aria-modal="true"` markup. Gets browser top-layer + background inertness + native Escape/cancel. Same pattern N1 landed for the search overlay. Interior Tab is native; only the same Chromium boundary-wrap gap (Shift+Tab from first / Tab from last) needs a minimal JS wrap, if any (the panel has enough focusables that this may or may not matter — needs browser test).
- **Popover API** (`popover="auto"` on the panel, `popovertarget` on the trigger). Browser handles light dismiss (Escape + outside-click + backdrop click). No inert background. Anchor positioning naturally fits an anchored settings panel. Deletes ARIA-expanded sync automatically (browser reflects it).

The observable behavior of the current panel is closer to **Popover** (outside-click dismisses; no visual/functional page blocking). The markup's `aria-modal="true"` is misleading vs. that actual behavior. **Recommend evaluating Popover first** in the experiment, with `<dialog>` as fallback if Popover's non-modal semantics don't match the intended UX.

#### What would disappear

Estimates (verified against `src/js/a11y.js`):

- `getFocusable(container)` helper (~5 LOC)
- `trapPanelFocus(event)` handler (~15 LOC)
- Document-level `click` outside-close listener (~4 LOC)
- Document-level `keydown` Escape-close listener (~3 LOC)
- Manual `aria-expanded` synchronization inside `openPanel`/`closePanel` (~2 LOC)
- Manual `panel.hidden = true/false` toggling (~2 LOC)
- `previouslyFocused` variable + capture/restore (~4 LOC) if focus return is handled by browser (Popover) or by native `close` event (`<dialog>`)

Total: ~35 LOC of JS + 3 event listeners removed. `openPanel`/`closePanel` shrink to trivial calls (`panel.showPopover()`/`panel.hidePopover()`, or `panel.showModal()`/`panel.close()`).

Additionally: `role="dialog"`, `aria-modal="true"`, `aria-haspopup="dialog"`, `aria-expanded` all become redundant with either native primitive.

#### What would remain

- All the settings toggle logic (text size, high contrast, reduced motion, dyslexia font, spacing, reading guide, focus assist, background swatches, TTS play/stop, reset)
- The panel content markup
- Domain-appropriate visual CSS (positioning, background, borders)
- Language-appropriate labels (already localized in the template)

#### Accessibility implications

Both `<dialog>.showModal()` and Popover API are accessible-by-default. `<dialog>` supplies the `dialog` role and modal semantics natively; Popover supplies `role="dialog"` implicitly for `popover="auto"` targets. Focus return is either automatic (Popover) or trivially wired on the `close` event (`<dialog>`).

Risk: Popover changes semantic from modal to non-modal. If a screen-reader user was relying on modal-blocking semantics via `aria-modal="true"`, that behavior is intentionally dropped (because the actual UX was never blocking to begin with).

#### FI/EN parity

The template already localizes all labels via `currentLang`. Neither native primitive introduces per-locale JS. Same JS handles both.

#### Browser support / test requirements

- `<dialog>`: broad support (Chromium, Firefox, Safari) since 2022; already deployed on this site via N1.
- Popover API: broad support (Chromium 114+, Firefox 125+, Safari 17+). This is close to but not identical to `<dialog>` support. Verify against site's supported browser baseline in `docs/` if there is one, or accept the 2024/2025 baseline.
- **NEEDS BROWSER TEST**: Chromium's Tab-wrap gap that N1 encountered may or may not apply to the a11y panel depending on focusable count. Verify in experiment.
- Existing tests in `tests/navigation.spec.js:110-137` already cover the a11y trigger → panel-visible → focus-assist toggle → TTS play sequence. Assertion updates would be minimal (remove `aria-hidden` / `hidden` toggles if going to Popover; keep for `<dialog>` in the same shape N1 used).

#### Verdict

**NATIVE CANDIDATE**. Strongest deletion opportunity in the audit. Same architectural pattern that N1 proved. Two viable primitives; Popover is likely semantically more correct given observed light-dismiss UX, but `<dialog>` is a safer replay of the N1 pattern.

---

### 2. Mobile disclosure system (`[data-*-mobile-collapse]`) — KEEP CUSTOM

#### Current implementation

`src/js/site-ui.js:235-345`:

- Ten groups configured at lines 238-249: `home`, `larux`, `mobile`, `kynasta`, `presentation`, `portfolio`, `term`, `council`, `about`, `research`.
- All markup already uses native `<details>` (JS reads/writes `disclosure.open`).
- Custom behavior wrapped on top:
  - Responsive open/close policy: `mobileDisclosureMq` matches `(max-width: 767.98px)`, `desktopOpen` per group
  - `alwaysSync`: overwrite `open` on every viewport change
  - `keepOpenAttr`: keep certain disclosures open (`termCurrent`, `councilCurrent`)
  - `preparedAttr`: one-shot mobile prep flag (don't re-close if user opened)
  - `hashAware`: open the containing `<details>` when URL hash targets an element inside it
  - `closePeersOnHash` (only `kynasta`): when hash-opening one, close the siblings

#### Current ownership

- Markup: Nunjucks (native `<details>`/`<summary>`)
- Interior show/hide: **native `<details>`** (already)
- Responsive policy: `site-ui.js`
- Hash-aware opening: `site-ui.js`
- Peer exclusivity (conditional): `site-ui.js`

#### Native alternative

`<details name="group">` (grouped exclusive-open accordion) has been stable across Chromium/Firefox/Safari since 2024. It provides *always-exclusive* group opening — at most one open per name group.

This matches only the `kynasta` group's `closePeersOnHash: true` behavior, and even then imperfectly: `kynasta` only forces exclusivity when hash-opening, not always. Nothing in the audit source suggests users want always-exclusive kynasta behavior (that would prevent a user from having two kynasta sections open simultaneously, which the current code intentionally allows).

The other nine behaviors have **no native equivalent**:

- responsive open/close policy
- keep-open-attr special cases
- prepared-attr one-shot mobile prep
- hash-aware opening (native does not open ancestor `<details>` on hash navigation)

#### What would disappear

If we force `<details name="kynasta-group">`, we get always-exclusive at markup level. Then the `closePeersOnHash: true` flag becomes redundant — but the removed JS is a handful of lines inside one branch, not a group-level deletion. Zero net JS deletion because the group still needs the responsive-policy + hash-aware machinery.

#### What would remain

Everything except that one flag.

#### Accessibility implications

Neutral. `<details>` semantics are unchanged.

#### FI/EN parity

Neutral.

#### Browser support / test requirements

`<details name="…">` is well-supported now. But the concrete deletion is negligible.

#### Verdict

**KEEP CUSTOM**. The custom code is doing work the native primitive does not do. Forcing `<details name>` on `kynasta` is possible as an OPTIONAL SEMANTIC UPGRADE that would delete perhaps one flag and one `closePeersOnHash` branch, but the responsive/hash-aware/keep-open architecture stays. Not worth an experiment.

---

### 3. Bootstrap modals (`#thesisCitationModal`, `#chartZoomModal`) — NEEDS EXPERIMENT

#### Current implementation

- `src/_includes/thesis-citation-modal.njk`: Bootstrap `.modal` class, `tabindex="-1"`, `aria-labelledby`, `aria-hidden="true"`, `modal-dialog modal-lg modal-dialog-centered`. Triggered via `data-bs-target="#thesisCitationModal"` and JS `bootstrap.Modal.getOrCreateInstance(el).show()` in `src/js/thesis-hub-actions.js:177-178`.
- `src/julkaisut.njk:92+` and `src/julkaisut.njk:685+`: `#chartZoomModal` uses Bootstrap `.modal`, opens via `bootstrap.Modal.getOrCreateInstance(zoomModalEl).show()`, listens to `shown.bs.modal` to rebuild a zoomed Chart.js instance in a fresh canvas.

#### Current ownership

- Markup: Nunjucks (Bootstrap class conventions)
- Show/hide: Bootstrap Modal API
- Backdrop, focus trap, Escape, focus return: Bootstrap Modal
- Chart-instance lifecycle (`chartZoomModal` only): domain JS in `julkaisut.njk`

#### Native alternative

Both are candidates for `<dialog>.showModal()` / `.close()`. Precedent: N1 search overlay.

#### What would disappear

- `bootstrap.Modal.getOrCreateInstance(el).show()` calls (~2 sites) become `el.showModal()`
- `.modal fade` classes + Bootstrap-authored modal CSS
- `data-bs-dismiss` etc. attributes on close buttons (become plain `<button>` with a click handler that calls `.close()`, or a `<form method="dialog"><button>Close</button></form>`)

#### What would remain

- The `shown.bs.modal` → Chart.js re-init event chain needs replacement. Native `<dialog>` fires a `close` event but no "shown" event; we'd wire a `showModal()` call site to trigger the chart rebuild synchronously or on next `requestAnimationFrame`.
- Bootstrap dependency stays loaded for offcanvas mobile menu, dropdowns, and (per site-ui.js:544-549) `closeContainingOffcanvas` helper. So this experiment does not remove Bootstrap.
- Backdrop styling switches from Bootstrap conventions to `<dialog>::backdrop`.

#### Accessibility implications

Neutral to positive. Native `<dialog>` provides the same modal semantics. N1 experience: Chromium Tab-wrap gap requires a small boundary handler — same caveat here.

#### FI/EN parity

Neutral.

#### Browser support / test requirements

Broad support. Needs test coverage for citation modal open/close/focus-return, and for chart zoom modal open → chart rebuild → close.

#### Verdict

**NEEDS EXPERIMENT**. Feasible but the deletion is bounded (Bootstrap stays; only these two modals convert). Lower confidence than the a11y toolbar candidate. Defer until after the a11y toolbar candidate is either landed or rejected, so we don't multiply architectural changes in one closure sweep.

---

### 4. Mega menu — KEEP CUSTOM

#### Current implementation

`src/js/site-ui.js:347-520`:

- Split "parent link" (`.mega-nav-link` — real anchor to a canonical page) + "toggle" (`.mega-nav-toggle[data-bs-toggle="dropdown"]` — opens the submenu)
- Custom desktop keyboard handling: ArrowUp/ArrowDown/Enter/Space to open/close, arrow keys to navigate items, Home/End, Escape to close and return focus
- Bootstrap dropdown integration for mobile (`show.bs.dropdown`/`hide.bs.dropdown` sync animation classes)
- `focusout` listener closes the menu when focus leaves the dropdown
- Mobile-only "go to top-level page" jump link injected into each menu
- Stagger animation delays on menu items

#### Current ownership

- Markup: `src/_includes/_nav-fi.njk`, `_nav-en.njk`
- Desktop open/close: `site-ui.js` direct manipulation
- Keyboard nav: `site-ui.js`
- Focus lifecycle: `site-ui.js` (open focuses first item, Escape returns to toggle)
- Mobile: Bootstrap Dropdown API
- Animation: CSS + JS class toggling

#### Native alternative

Popover API could handle the show/hide state and outside-click dismiss. But it does not:

- provide the split parent-anchor / trigger-button pattern (Popover expects a single `popovertarget` invoker)
- provide arrow-key traversal between items
- provide Home/End navigation
- integrate with Bootstrap Dropdown on mobile
- provide focus-return-on-Escape

Every one of those would need custom JS anyway.

#### What would disappear

Very little. The `openMegaMenuDirect` visibility toggle could delegate to `showPopover()`/`hidePopover()`. But the keyboard handlers, focus lifecycle, focusout close, parent-link semantics, Bootstrap-on-mobile bridge, and stagger animation all stay. Net deletion: ~10-15 LOC out of ~170.

#### What would remain

Everything else.

#### Accessibility implications

Popover changes ARIA-expanded ownership (browser reflects it). But since we already manage `aria-expanded` correctly, no accessibility gain.

#### FI/EN parity

Neutral (same JS handles both).

#### Browser support / test requirements

Popover supported. But not worth testing.

#### Verdict

**KEEP CUSTOM**. Native conversion moves complexity rather than deleting it. The split parent-link/toggle pattern is a real UX contract (parent link stays a real link to the section page) that native primitives do not model. No conversion until repo evidence shows a specific UX regression.

---

### 5. `<search>` semantic wrapper — OPTIONAL SEMANTIC UPGRADE

#### Current implementation

Six forms use `role="search"` (verified via grep):

- `_nav-fi.njk:396` — site nav search FI
- `_nav-en.njk:384` — site nav search EN
- `find-explore-writings.njk:13` — F&E search form
- `fi/haku.njk:26`, `en/search.njk:26` — full search page fallback forms

Every form's search input is already `<input type="search">`.

#### Native alternative

Wrap the `<form role="search">` in `<search>…</search>` (the native semantic wrapper). Optionally drop `role="search"` (native `<search>` implies it).

#### What would disappear

`role="search"` on 6 forms. No JS. No state.

#### What would remain

Everything else.

#### Accessibility implications

Neutral. Native `<search>` and `role="search"` are equivalent for assistive tech.

#### FI/EN parity

Both locales already use identical patterns.

#### Browser support / test requirements

`<search>` element: Chromium 118+, Firefox 118+, Safari 17+. Broad enough.

#### Verdict

**OPTIONAL SEMANTIC UPGRADE**. Zero deletion of JS/state/CSS. Low priority. Do only if bundled with another Nunjucks edit in the area.

---

### 6. `<input type="search">` — ALREADY NATIVE

Verified: every text search input on the site is `type="search"`. Nothing to do.

---

### 7. `inert` — bundled inside `<dialog>` conversion (not standalone)

Repo does not currently use `inert`. There is no custom "tabindex-rewriting to disable a subtree" pattern that could be replaced by `inert` on its own. The only prospective use is bundled inside `<dialog>.showModal()` (which supplies inertness for the a11y panel candidate). Not a standalone opportunity.

---

### 8. `hidden="until-found"` — no current use case

Repo has no SSR-collapsed content that would benefit from browser Find-in-page opening it. The existing mobile-disclosure `<details>` are already discoverable by Find-in-page when open (mobile prep only forces the initial state; user Find-in-page interaction reopens as needed via native `<details>` behavior when browsers do that). No experiment recommended.

---

### 9. `<time>`, `<output>`, `<progress>`, `<meter>` — not present in current markup

`<time>`: zero uses in Nunjucks. Dates rendered via `dateFormat` filter as plain text. Wrapping key dates in `<time datetime="…">` would improve SEO/schema/machine reading. **OPTIONAL SEMANTIC UPGRADE**; not urgent.

`<output>`, `<progress>`, `<meter>`: no repo use case.

## Ranked implementation candidates

1. **Accessibility toolbar (`#a11yPanel`) → native `<dialog>` or Popover API.** Strongest deletion signal (~35 LOC + 3 document listeners + several ARIA attributes). Same architectural pattern as N1's search overlay. Similar test surface already exists (`tests/navigation.spec.js:110-137`). Easy to roll back (single file for markup + one JS file). Popover is likely semantically more correct for the observed light-dismiss UX; `<dialog>` is safer replay.
2. **Bootstrap modals (`#thesisCitationModal`, `#chartZoomModal`) → native `<dialog>`.** Feasible, moderate benefit, Bootstrap dependency stays. Only after candidate #1 either lands or is rejected.

(No other candidates worth ranking.)

## KEEP CUSTOM findings

Explicitly not recommended for native conversion:

- **Mobile disclosure system** — nine of ten behaviors have no native equivalent; forcing native `<details name>` would delete ~1 flag and regress semantics for groups that should not be always-exclusive.
- **Mega menu** — custom desktop keyboard model, split parent-link/toggle, Bootstrap dropdown mobile bridge. Native Popover cannot express these; conversion moves complexity rather than deletes it.
- **All other Bootstrap non-modal components** (offcanvas mobile menu, dropdowns, collapse) — not audited as candidates. No native replacement would delete more than it costs to rewrite.

## Deletion ledger

| Candidate | JS deletion | CSS deletion | state/ARIA deletion | new code required |
| --- | ---: | ---: | ---: | ---: |
| 1. A11y toolbar → `<dialog>` or Popover | ~35 LOC (`trapPanelFocus`, `getFocusable`, `openPanel`/`closePanel` inner bodies, 2 document listeners, `aria-expanded` sync, `hidden` toggling, `previouslyFocused` return) | none required; visual CSS preserved. Panel positioning may need small adjustment for `<dialog>` (Popover natively anchors) | `role="dialog"`, `aria-modal="true"`, `aria-haspopup="dialog"`, `aria-expanded` — all redundant with native | 1 `close`-event listener (`<dialog>`) or 0 (Popover); possibly a small boundary Tab wrap if N1's Chromium gap manifests |
| 2. Bootstrap modals → `<dialog>` | ~2-4 LOC (`bootstrap.Modal.getOrCreateInstance().show()` calls become `.showModal()`); `data-bs-dismiss` markup on close buttons | `.modal fade` Bootstrap conventions become `<dialog>::backdrop` + minor local styles | `role="dialog"`, `aria-modal`, `aria-hidden` on markup — redundant with native | `close` event listener; `shown.bs.modal` → Chart-init handler needs a native equivalent (call chart rebuild after `showModal()` synchronously or on rAF); possible boundary Tab wrap |

## Recommended next action

**Single next experiment: Convert the accessibility toolbar (`#a11yPanel`) to native `<dialog>` (or, after brief prototype comparison, Popover API).**

Rationale against the criteria:

1. **Less JavaScript** — ~35 LOC + 3 document listeners deletable from `src/js/a11y.js`. `openPanel`/`closePanel` collapse to trivial browser-primitive calls.
2. **Less duplicated state ownership** — `aria-expanded`, `role="dialog"`, `aria-modal`, `hidden` all become browser-owned.
3. **Equal/better accessibility** — native primitives are accessible-by-default; N1 precedent shows the pattern preserves keyboard/screen-reader UX.
4. **No canonical/Pagefind architecture change** — this touches only a11y toolbar markup, `a11y.js`, and possibly one CSS positioning tweak. No content, no taxonomy, no Pagefind.
5. **Easy rollback** — single markup file + single JS file. Bounded diff.
6. **Strong FI/EN parity** — template already localizes; single JS handles both.

Additional benefit: this exercises the same architectural pattern N1 successfully proved, so the risk profile is well-understood.

Do **not** start any other candidate in the same experiment. If accessibility toolbar conversion lands cleanly, the Bootstrap-modal candidate is the natural follow-up in a separate experiment.

## Explicit non-actions

- No production files modified in this audit
- No tests modified
- No new taxonomy introduced
- Canonical Content v1 unchanged
- Pagefind metadata contracts unchanged
- Pagefind not replaced
- No SPA introduced
- No Bootstrap components converted for novelty
- Mega menu not converted
- No JS fallbacks added
- No polyfills added
- No new UI abstraction layer
- No new roadmap workstream started
- Nothing deleted yet
