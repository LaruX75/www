# PF5-H1B Progressive facet disclosure

## Status

**CLOSED / GREEN / MAIN.** Merged 2026-08-24 as PR [#142](https://github.com/LaruX75/www/pull/142); merge commit `a9f8d4a4cd557891042042b4e03439ceb0c25b37` is the current `origin/main`. Post-merge Actions run [32735130086](https://github.com/LaruX75/www/actions/runs/32735130086) — build / deploy / smoke all success. Production HTTP smoke verified: `/haku/`, `/en/search/` HTTP/2 200; inline config carries `secondaryFacetsByContentType`; merged-main headless-Chrome behavior verified (default 1 wrapper / 6 pills / 11 hidden secondary; Julkaisut reveals publication facets only; union works; All resets).

Implementation slice for the second slice recommended by the PF5-H1 audit's GO decision. On `/haku/` and `/en/search/` only the truly-global `Sisältö` facet is shown by default. Domain-specific secondary facets stay mounted in the DOM (Pagefind still computes their hit counts and owns their state) but are `hidden` until the matching `Sisältö` value is selected. Zero Pagefind state change, zero new controller, zero taxonomy change, zero result-presenter change.

## Closure / merged state (2026-08-24)

| | |
|---|---|
| PR | [#142](https://github.com/LaruX75/www/pull/142) — MERGED |
| mergedAt | 2026-08-24T13:51:09Z |
| mergedBy | LaruX75 (via `gh pr merge --match-head-commit`) |
| Implementation head SHA | `577fbd1b9a49c46192139745db557d64055ef85c` |
| Merge commit SHA | `a9f8d4a4cd557891042042b4e03439ceb0c25b37` |
| Resulting `origin/main` | `a9f8d4a4cd557891042042b4e03439ceb0c25b37` |
| Previous `origin/main` (H1A closure baseline) | `0b9e4722dc532eb655a3c297352bacf3b7b5ebaa` |
| Pre-merge PR CI | build-and-verify PASS (3m32s), playwright PASS (7m43s), mergeStateStatus CLEAN |
| Post-merge Actions run | [32735130086](https://github.com/LaruX75/www/actions/runs/32735130086) — build ✓ / deploy ✓ / smoke ✓ |
| Production `/haku/` | HTTP/2 200 |
| Production `/en/search/` | HTTP/2 200 |
| Production inline config | ships `"secondaryFacetsByContentType":{"Julkaisut":[…]}` (PROVEN via curl) |

## Merged-main behavior verification (headless Chrome on `/haku/?q=tekoäly`, PROVEN 2026-08-24)

**FI /haku/:**

| Action | Visible filter slots | Notes |
|---|---|---|
| Default (post-query) | `["Sisältö"]` — 1 wrapper, 6 pills, 11 hidden secondary | ✓ |
| Click `Sisältö = Julkaisut` | `["Sisältö", "Publications group", "Publications quality"]` — results narrow to `kinds=["publications"]` | ✓ Pagefind ranking preserved |
| Add `Sisältö = Esitykset` (union) | `["Sisältö", "Publications group", "Publications quality", "PresentationYear", "PresentationTopic"]` — 5 wrappers | ✓ union PROVEN |
| Click `All` (reset) | `["Sisältö"]` — back to default | ✓ |

**EN /en/search/ (parity):**

| Action | Visible filter slots | Notes |
|---|---|---|
| Default (post-query `learning`) | `["Sisältö"]` | ✓ same shell as FI |
| Click `Sisältö = Esitykset` | `["Sisältö", "PresentationYear", "PresentationTopic"]` | ✓ same disclosure semantics |

**Structural measurements on merged main:**

| Metric | H1A baseline | H1B (merged main) | Delta |
|---|---|---|---|
| Visible FilterPills wrappers on load | 12 | **1** | −11 |
| Visible pill buttons on load | 441 | **6** | **−98.6%** |
| First result top offset desktop 1280×900 | 1 237 px | **467 px** | **−770 px (−62%)** |
| First result top offset mobile 375×667 | 1 234 px | **465 px** | **−769 px** |
| Screenfuls before first result mobile | 1.85 | **0.70** | **−1.15 screenfuls** |
| Filter slot count in DOM (Pagefind still sees) | 12 | 12 | 0 |
| Hidden secondary slots on load | 0 | **11** | +11 |

Identical to pre-merge implementation baseline — zero drift.

## State ownership + observer model

**Pagefind remains the sole owner of filter state.** The H1B visibility layer:
- Reads Pagefind's own `aria-pressed` attribute on each `Sisältö` pill via `MutationObserver` (`attributeFilter: ["aria-pressed"], subtree: true, childList: true`).
- On any mutation: reads all `[aria-pressed="true"]` pill buttons in the `Sisältö` slot; extracts their `<span aria-label>` value; filters out the "All"/"Kaikki" reset marker; toggles `slot.hidden` on each secondary slot whose `data-search-modular-secondary-for` matches the current selection set.
- No parallel `selectedDomain` state, no Pagefind API misuse, no query re-dispatch.

**Removability:** the observer is a compatibility shim over Pagefind's DOM-based selection signal. It is **safe to remove later** if Pagefind 1.6+ (or a successor) exposes a supported filter-state event/API (e.g. `instance.on("filterChanged", …)` or `instance.getSelectedFilters()`). At that point the observer would be replaced by an event handler with identical semantics, and the `MutationObserver` can be deleted.

## Multi-selection UX decision (documented + PROVEN)

FilterPills is `selectMultiple: true` (unchanged from PF5-G1). H1B chose **UNION** semantics: multi-selecting `Sisältö` values reveals the union of the selected domains' secondary facets. Matches Pagefind's own OR semantics across content types. Verified on merged main: Julkaisut + Esitykset → 5 wrappers (Sisältö + Publications group + Publications quality + PresentationYear + PresentationTopic); no writings/theses/media leak.

## Failure path (unchanged from H1A)

- **JS disabled** → SSR search form remains authoritative; native GET submit works.
- **Pagefind / Modular UI init failure** → factory `.catch()` renders fallback message inside the mount; SSR form remains visible + usable. H1B visibility logic never runs.
- **Sisältö pill missing** in current Pagefind partition (e.g. no publications indexed for EN `learning`) → the FilterPills simply doesn't render that value; user can't select it; test skips gracefully.
- **Slow load** → SSR form usable immediately; secondary facets stay hidden regardless.

## Accessibility

- Hidden facet groups use native `hidden` attribute on the outer slot `<div>`. Screen readers skip hidden regions; focus never lands in hidden facet controls.
- Region label unchanged (`Rajaa hakua` / `Narrow the search`).
- No new ARIA introduced.
- No new live-region announcements added (Pagefind's own summary live region unchanged).
- Native `<button>` keyboard interactions on Sisältö pills unchanged.
- Pre-merge combined a11y regression suite (`accessibility.spec.js` + `accessibility-tools.spec.js` + `contrast.spec.js` + `navigation.spec.js`) — all pass.

## FI / EN parity

- Same `_search-page-config.njk` partial emits both locale configs.
- `Sisältö` VALUES stay Finnish per PF3 decision — configuration keys are Finnish tokens (`"Julkaisut"`, `"Esitykset"`, …) on both partitions.
- On EN partition, `Julkaisut`/`Kirjoitukset ja puheenvuorot`/`Opinnäytteet` may not surface for a given probe query (publications/writings/theses are FI-canonical only). Documented from PF5-G1 as "publications-only-facet EN skips".
- `Esitykset` and `Mediassa` surface on both partitions.
- Merged-main verification: EN `learning` query default = `["Sisältö"]`; picking `Esitykset` reveals `PresentationYear`, `PresentationTopic` — identical semantics to FI.

## Deletion

Zero code deletion. Display-visibility layer added over existing filter infrastructure. What went down for the user:
- Default filter visibility: 12 wrappers → 1 wrapper
- Default pill button count: 441 → 6 (−98.6%)
- Desktop first-result offset: 1 237 → 467 px (−62%)
- Mobile screenfuls before first result: 1.85 → 0.70 (−1.15)

No Pagefind filter, no metadata, no taxonomy, no canonical semantics changed. Secondary facets remain fully functional — just hidden until relevant.

## Pre-merge implementation state (historical)

- **Branch (during implementation):** `pf5/h1b-progressive-facets`
- **Worktree (during implementation):** `/private/tmp/www-pf5-h1b-impl`
- **Base at implementation time:** `0b9e4722dc532eb655a3c297352bacf3b7b5ebaa`
- **Implementation commit created after review:** `577fbd1b9a49c46192139745db557d64055ef85c` — fast-forward-merged into `main` as part of merge commit `a9f8d4a4` (PR #142).

## Next-workstream stop rules

- **PF5-H1C — Result-content hierarchy refinement:** **DOES NOT AUTO-START.** Per H1 audit §19, H1C is only opened if H1A + H1B reveal a specific per-domain problem, or if a G3 Media slice re-opens the media card shape. Neither trigger has fired.
- **G3 (Media Pagefind projection) / G4 (Writings meta widening):** DO NOT AUTO-START. Next workstream is chosen separately based on latest `main`, roadmap, and closure evidence.
- **BBS / Gopher / theme work:** DO NOT AUTO-START.

## Audit reference

`docs/pf5-h1-global-search-ux-result-content-audit-2026-08-24.md` — slice H1B per §19. H1A shipped separately as PR #140 / merge `444e818c` and is now on `main` as `docs/pf5-h1a-search-page-shell-simplification-2026-08-24.md` (CLOSED / GREEN / MAIN).

## H1A baseline (before this slice, PROVEN on `0b9e4722`)

Measured `/haku/?q=tekoäly` via headless Chrome:

| Metric | H1A baseline |
|---|---|
| Visible FilterPills wrappers | **12** (all groups shown always) |
| Visible pill buttons | **441** |
| DOM nodes before results list | **1 667** |
| First result top offset desktop 1280×900 | **1 237 px** |
| First result top offset mobile 375×667 | **1 234 px** |
| Screenfuls before first result mobile | **1.85** |

## Selected-domain → visible-facets mapping

The Pagefind `Sisältö` filter VALUES (unchanged Finnish tokens per PF3 decision — same values on FI and EN partitions) map to secondary facet groups as follows:

| Sisältö value | Secondary facets revealed |
|---|---|
| `Julkaisut` | `Publications group`, `Publications quality` |
| `Kirjoitukset ja puheenvuorot` | `Writings content type`, `Writings topic` |
| `Opinnäytteet` | `Theses type`, `Theses role` |
| `Mediassa` | `Mediatyyppi`, `Rooli`, `Vuosi` |
| `Esitykset` | `PresentationYear`, `PresentationTopic` |
| `All` (Pagefind reset) OR no selection | none (all secondary facets hidden) |

Filter names match `data-pagefind-filter` names emitted by canonical Eleventy projectors verbatim. Labels are localised accessible names — no taxonomy change.

## Multi-selection UX decision (PROVEN)

FilterPills is mounted with `selectMultiple: true` (unchanged from PF5-G1). The user can select more than one `Sisältö` value simultaneously. The audit called out that this behaviour needed a documented decision:

**Decision: show the UNION of the selected domains' secondary facets.** Rationale:
- Matches Pagefind's own semantics: multi-selecting `Sisältö` values narrows results via OR across content types → union facet visibility follows the same "wider view" mental model.
- Alternative (single-select-only) would require overriding Pagefind's multi-select AND removing the OR semantics of the results — a larger UX change.
- Alternative (empty union — hide everything if more than one Sisältö selected) would hide useful narrowing on legitimate multi-domain queries.

Verified: selecting Julkaisut + Esitykset shows `Sisältö`, `Publications group`, `Publications quality`, `PresentationYear`, `PresentationTopic` (5 wrappers). No writings/theses/media facets leak.

## State ownership

**Pagefind remains the sole owner of filter state.** This slice observes Pagefind's own `aria-pressed` attribute on each `Sisältö` pill via `MutationObserver`. No parallel `selectedDomain` state, no Pagefind API misuse, no query re-dispatch.

The `MutationObserver` watches the `Sisältö` slot for `aria-pressed` attribute changes (`attributes: true, attributeFilter: ["aria-pressed"], subtree: true, childList: true`). On any mutation it:
1. Reads all `[aria-pressed="true"]` pill buttons inside the Sisältö slot.
2. Extracts their inner `<span aria-label>` value.
3. Filters out the "All"/"Kaikki" reset pill (Pagefind's own zero-filter marker).
4. Toggles `slot.hidden` on each secondary slot based on whether its `data-search-modular-secondary-for` value is in the current selection set.

## Failure path (unchanged from H1A)

- **JS disabled** → SSR search form remains authoritative; native GET submit works. Progressive facet disclosure is enhancement only — no facets rendered in SSR anyway.
- **Pagefind / Modular UI init failure** → factory `.catch()` renders fallback message inside the mount; SSR form remains visible + usable. Facet disclosure logic never runs.
- **Sisältö pill missing** in current Pagefind partition (e.g. no publications indexed) → the `Sisältö` FilterPills simply doesn't render that value. Test verifies this via `test.skip` when a partition-specific value is absent.
- **Slow load** → SSR form usable immediately; secondary facets stay hidden until the user makes their first selection anyway.

## Measurements (headless Chrome on `/haku/?q=tekoäly`, PROVEN 2026-08-24)

### Default state (page load, before user interaction with Sisältö)

| Metric | H1A baseline | H1B (this slice) | Delta |
|---|---|---|---|
| Visible FilterPills wrappers | 12 | **1** (Sisältö only) | **−11** |
| Visible pill buttons | 441 | **6** (Sisältö: All + 5 domain values) | **−435 (−98.6%)** |
| Rendered filter slot count in DOM | 12 | 12 | 0 (all still mounted for Pagefind) |
| Hidden secondary slots | 0 | **11** | +11 |
| First result top offset desktop | 1 237 px | **467 px** | **−770 px (−62%)** |
| First result top offset mobile | 1 234 px | **465 px** | **−769 px** |
| Screenfuls before first result mobile | 1.85 | **0.70** | **−1.15 screenfuls** |
| DOM total (post-query) | 2 244 | 2 232 | −12 |

### After selecting Sisältö = Julkaisut

- Visible wrappers: 3 (Sisältö, Publications group, Publications quality)
- Results narrow to publications (`kinds = ["publications"]`)
- Pagefind ranking preserved
- Union with Esitykset adds PresentationYear + PresentationTopic → 5 wrappers total; no writings/theses/media leak

### After clearing (Sisältö "All" pill)

- Visible wrappers: 1 (back to default)
- First result offset: 467 px (unchanged from default) — no scroll shift

**Not real-user-perf claims.** Measurements are structural DOM/layout.

## Accessibility

- Hidden facet groups use native `hidden` attribute on the outer slot `<div>`. Screen readers skip hidden regions; focus never lands in hidden facet controls.
- Region label "Rajaa hakua"/"Narrow the search" unchanged.
- No new ARIA introduced. Existing `aria-label` on each FilterPills wrapper (via MutationObserver localise decoration) still applied.
- Selection state changes announced by Pagefind's own live region behaviour (no new live-region announcements added).
- Keyboard interactions with `Sisältö` pills unchanged (native `<button>`). When a domain is chosen, secondary facets appear immediately in the tab order.
- Combined a11y regression suite (`accessibility.spec.js` + `accessibility-tools.spec.js` + `contrast.spec.js` + `navigation.spec.js`) PASS.

## FI / EN parity

- Same `_search-page-config.njk` partial emits both locale configs. Same `facetGroups` + `secondaryFacetsByContentType` structure.
- `Sisältö` VALUES stay Finnish across both partitions per PF3 decision — configuration keys are Finnish tokens (`"Julkaisut"`, `"Esitykset"`, …). Not translated.
- On EN partition, `Julkaisut`/`Kirjoitukset ja puheenvuorot`/`Opinnäytteet` pills may not surface for a given probe query because publications/writings/theses are FI-canonical only. This is a pre-existing PF5-G1 documented behaviour ("publications-only-facet EN documented-skip") — the H1B test suite handles it via `test.skip` when the pill is absent.
- `Esitykset` and (potentially) `Mediassa` surface on both partitions.

## Deep links / URL sync

- `?q=` URL sync preserved (unchanged from H1A).
- No new URL serialization for `Sisältö` selection introduced. If a user shares a URL, they share the query; the receiving user starts in the default facet state (only Sisältö visible). This matches Pagefind's own filter-state behaviour today (filters were never in URL).

## Deletion

Nothing deleted from code. This slice ADDS a small display-visibility layer over the existing filter infrastructure. What DID change is what the user sees:

- **Default filter visibility**: 12 wrappers → 1 wrapper (98.6% pill reduction post-query)
- **Cognitive load**: 441 pills → 6 pills on first paint
- **First-result offset**: 62% closer on desktop, 1.15 fewer screenfuls on mobile

No Pagefind filter, no metadata, no taxonomy, no canonical semantics changed. Secondary facets remain fully functional — just hidden until relevant.

## Tests

### New spec — `tests/pf5-h1b-progressive-facets.spec.js`

Parameterised FI + EN, 11 scenarios × 2 = **22 test cases**:

- Default state shows only Sisältö; 11 secondary slots hidden
- Selecting each of the 5 domain values (Julkaisut, Kirjoitukset ja puheenvuorot, Opinnäytteet, Mediassa, Esitykset) reveals only that domain's secondary facets
- Julkaisut + Esitykset multi-select shows the UNION of both domains' facets
- Clicking the "All" reset pill re-hides all secondary facets
- Selecting Julkaisut narrows results (Pagefind state preserved)
- Kieli pin still excludes other-locale results
- `?q=` URL hydrates SSR input value and triggers initial search under H1B

Result: **18 pass / 4 documented-skip** (EN partition doesn't surface Publications/Writings/Theses for `learning` probe query — matches PF5-G1 rollout's documented "publications-only-facet EN skips").

### Updated existing spec — `tests/search-modular-ui-pilot.spec.js`

`domain-specific facet (Publications group) narrows results by publication group` — added a prep step to first click `Sisältö = Julkaisut` (which under H1B reveals the `Publications group` slot). Same test intent, H1B-aware.

### Full regression

`pf5-h1b + pf5-h1a + search-modular-ui-pilot + pf5-g1-navbar + pf5-g2-presentations + pf-ui-l10n1 + navigation + accessibility + accessibility-tools + contrast` = **10 spec files, 154 test cases**:

- **147 pass / 6 documented-skip / 1 flake** in 1.5 min.
- Isolated re-run of the 1 flake (`navigation.spec.js:143` search dialog Finnish term) — **5/5 PASS**. Same pre-existing baseline flake documented in PF5-G1/G2/H1A closures. Not caused by H1B.
- `git diff --check` — clean.
- `npm run test:unit` — 612 pass / 0 fail.
- `npm run build:no-og` — PASS.

## Files changed

| File | Type | LOC delta |
|---|---|---|
| `src/_includes/_search-page-config.njk` | edit — restructure `facetGroups` → global; add `secondaryFacetsByContentType` map | +30 / −13 |
| `src/js/global-search-modular-ui.js` | edit — `SECONDARY_FACETS` derivation, `renderShell` secondary slots with `hidden`, `MutationObserver` visibility layer | +75 / −6 |
| `tests/search-modular-ui-pilot.spec.js` | edit — add Julkaisut prep step to `domain-specific facet (Publications group)` test | +11 |
| `tests/pf5-h1b-progressive-facets.spec.js` | new spec | +205 |
| `docs/pf5-h1b-progressive-facet-disclosure-2026-08-24.md` | new evidence doc | new |

**Net production runtime delta: +99 LOC** (mostly comment-heavy visibility layer + config restructure). Zero renderer / CSS-card change. Zero Pagefind change. Zero taxonomy change.

## Remaining issues / follow-ups

- **`renderExcerpt` non-convergence** — F&E escapes vs presenter preserves `<mark>`. Unchanged, deferred.
- **FilterPills MutationObserver aria-label workaround** — same CONTINGENT DELETION status; the H1B visibility-toggle observer is a separate observer with narrower scope (only Sisältö slot), unrelated.
- **Media Pagefind projection gap** — G3 territory, not H1B.
- **URL sync for Sisältö selection** — deferred (audit §8). Users sharing a search URL share query only; recipient lands in default facet state. Same as pre-H1B.
- **Generated unused `pagefind-ui.{js,css}`** — build-ownership question.

## H1C — not started

Per H1 audit §19, H1C (Result-content hierarchy refinement) is deferred and would only be opened if H1A + H1B reveal a specific per-domain problem, or if a G3 Media slice re-opens the media card shape. Neither trigger has fired — H1C remains in reserve.

## Final status

**PF5-H1B IMPLEMENTATION STATUS: READY FOR MERGE.**

Measured structural improvement over H1A baseline:
- **12 → 1 visible facet wrappers on load** (−11)
- **441 → 6 pill buttons on load** (−98.6%)
- **1 237 → 467 px desktop first-result offset** (−62%)
- **1.85 → 0.70 screenfuls mobile** (−1.15 screenfuls)
- Union multi-select PROVEN, clear-via-All PROVEN, Pagefind ranking preserved, FI/EN parity PROVEN.
