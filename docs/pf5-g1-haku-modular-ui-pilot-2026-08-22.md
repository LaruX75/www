# PF5-G1 /haku/ Modular UI Pilot

## Status

PILOT — implementation + browser evidence, revised after review round 3 (filter parity restored). No commit or PR yet; awaiting review.

## Branch / base / HEAD

- **Branch:** `pf5/g1-haku-pilot`
- **Worktree:** `/private/tmp/www-pf5-g1-haku`
- **Base:** `origin/main` = `ba54c0704e3c7fb73ba0a2fef755c84f78770374` (post PF5-G1 suitability audit merge)
- **HEAD at report time:** `ba54c0704e3c7fb73ba0a2fef755c84f78770374` (no commit made)

## Architecture (unchanged since review round 2 → KEEP PILOT VARIANT)

Approved in review round 2: **Instance + Input + FilterPills + site-owned summary + site-owned eager paginated rendering.** Not changed in this round. Media stays reduced to family badge only. Presentations meta shape unchanged (direct pre-G1 reuse). Shared presenter architecture unchanged.

## What round 3 changed

Round 2 accepted the pilot's architecture but flagged one blocking regression: the initial pilot dropped **all** Default UI facet groups except a single Sisältö pill panel. Pre-G1 `/haku/` exposed a **multi-facet panel** auto-populated by Default UI. G1 is a result-presentation migration, not a filter-UX reduction.

Round 3 restores functional facet parity, adds FI accessible-name localisation, and adds browser gates that prove the parity.

## Baseline: pre-G1 visible filter groups on `/haku/`

Method (documented): stashed pilot changes on this branch, rebuilt with `haku.njk`'s original `pageScripts: [/js/site-search-page.js]`, opened `/haku/`, typed the query "tekoäly", and enumerated every `.pagefind-ui__filter-block` label rendered by stock PagefindUI Default. **PROVEN via that probe**, not inferred from indexed metadata.

Default UI renders **34 filter groups** on the "tekoäly" corpus. Categorising:

**User-meaningful, cross-domain or domain-specific (12):**
`Sisältö`, `Publications group`, `Publications quality`, `Writings content type`, `Writings topic`, `Theses type`, `Theses role`, `Mediatyyppi`, `Rooli`, `Vuosi`, `PresentationYear`, `PresentationTopic`

**Additional domain-specific that Default UI also rendered (11):**
`Publications topic`, `Publications type`, `Publications year`, `Publications research line`, `Writings role`, `Writings year`, `Theses topic`, `Theses author`, `Theses year`, `PresentationEvent`, `PresentationMediaType`, `PresentationSourceType`, `PresentationContext`, `PresentationLandingType`, `PresentationResearchPreset`

**Internal / infra facets Default UI auto-exposed but which are not user-facing filters (7):**
`FindExplore`, `Publications scope`, `Theses scope`, `Theses language`, `Writings scope`, `Research context`, `Kieli` (Kieli is pinned to `Suomi` on `/haku/`; exposing it would let users unpin the surface's language contract).

The reviewer's own list matches the 12 in the first block. Restoring those 12 is the target.

## Pilot filter groups after parity fix (12)

The pilot mounts one `PagefindModularUI.FilterPills` per group in this list:

| Facet name (Pagefind filter) | Finnish accessible label | Empty behaviour |
|---|---|---|
| Sisältö | Sisältötyyppi | hidden when 0 hits |
| Publications group | Julkaisutyyppi (OKM) | hidden when 0 hits |
| Publications quality | Julkaisun laatu | hidden when 0 hits |
| Writings content type | Kirjoituksen tyyppi | hidden when 0 hits |
| Writings topic | Kirjoituksen aihe | hidden when 0 hits |
| Theses type | Opinnäytteen tyyppi | hidden when 0 hits |
| Theses role | Rooli opinnäytteessä | hidden when 0 hits |
| Mediatyyppi | Mediatyyppi | hidden when 0 hits |
| Rooli | Rooli mediassa | hidden when 0 hits |
| Vuosi | Media: vuosi | hidden when 0 hits |
| PresentationYear | Esityksen vuosi | hidden when 0 hits |
| PresentationTopic | Esityksen aihe | hidden when 0 hits |

Modular UI's `FilterPills` `alwaysShow: false` default hides the wrapper when a facet has zero values in the current result set, matching Default UI's `showEmptyFilters: false`.

The additional 11 domain-specific facets Default UI auto-populated are **not** re-exposed in this pilot. Publications-topic / Writings-topic have 86 / 6 values on the "tekoäly" corpus; PresentationTopic alone has 294. Rendering all of these as pill lists is unusable UX. Default UI shipped them by default; the pilot omits them and defers the decision. If review requires them, adding is a one-line-per-facet edit to `FACET_GROUPS` — none needs new taxonomy or index changes.

## Pagefind vs site ownership (final)

| Concern | Owner |
|---|---|
| Search state, WASM, index loading | Pagefind `Instance` |
| Search term dispatch, filter dispatch, event bus | Pagefind `Instance` |
| Ranking order (never re-ordered on this surface) | Pagefind |
| Filter application (`triggerFilters`, `triggerFilter`) | Pagefind `Instance` |
| Facet UI per group (pill labels, hit counts, aria-pressed toggles) | Pagefind `FilterPills` × 12 |
| Per-result data (`rawResult.data()`) | Pagefind |
| Search input DOM + focus + Escape-to-clear + auto-search-on-input | Pagefind `Input` |
| Filter region label (site-wide "Rajaa hakua") | Site JS (aria-label on wrapper region) |
| Per-facet Finnish accessible name | Site JS (post-render aria-label decoration) |
| Per-result HTML rendering | Site JS (`window.SearchResultPresenter.renderSharedCard`) |
| Result-list DOM insertion + eager pagination + load-more button | Site JS (with monotonic version guard) |
| Summary text formatting | Site JS (via `instance.on("search"/"results")`) |
| ?q= URL sync | Site JS (`history.replaceState`, debounced) |
| SSR fallback restore on Modular UI init failure | Site JS |

**Nothing was moved out of Pagefind's ownership** in the parity restoration. Filter state remains Pagefind's; the pilot only added more `FilterPills` instances to expose more of that state to the user.

## FI localisation of accessible names

Assessment of the round-2 report finding "English aria-labelledby / accessible-name residual":

**Supported translation surface investigation.** Verified in the pinned Pagefind 1.5.2 Modular UI bundle: `Instance` accepts a `translations` option, but the individual `Input`, `Summary`, `FilterPills`, `ResultList` components do NOT. There is no supported translations knob for FilterPills-emitted labels in 1.5.2. **PROVEN** from bundle grep.

**Nature of the gap.** Modular UI's `FilterPills` emits, per group:
```
<div class="pagefind-modular-filter-pills-label" data-pfmod-sr-hidden="true">
  Filter results by <name>
</div>
```
The wrapper `<div class="pagefind-modular-filter-pills-wrapper" role="group" aria-labelledby="pagefind_modular_filter_pills_<name>">` references that label via `aria-labelledby`. Modular UI CSS puts `[data-pfmod-sr-hidden]` behind `clip-path: inset(100%)` — visually hidden but still exposed to screen readers via `aria-labelledby`. So a screen reader on the Finnish page announces "Filter results by Sisältö" — mixed FI/EN.

**Real WCAG concern or cosmetic?** Real, though small. The accessible name of a group landmark should be in the page's `lang`. Pill button labels are already Finnish content, and users navigating by pill focus experience Finnish; the group-level heading being English is a localisation gap, not a functional failure.

**Fix applied — Pagefind 1.5.2 compatibility workaround.** Post-render aria decoration on each rendered `.pagefind-modular-filter-pills-wrapper` inside our own filter region:
- `aria-labelledby` removed
- `aria-label` set to the Finnish site-owned label (e.g. `aria-label="Sisältötyyppi"`)

Implemented via a `MutationObserver` on the filters container. Explicit ownership boundary:
- The observer **does NOT own filter state.**
- The observer **does NOT modify filter values or hit counts.**
- The observer **does NOT alter Pagefind ranking or search semantics.**
- The observer **does NOT patch Modular UI's rendering logic or reach into internal template functions.**
- It corrects only the Finnish accessible name of each `FilterPills` wrapper.

Idempotent via a `data-haku-modular-i18n="done"` marker. Every rendered wrapper is Finnish-labelled by the time the pilot spec's accessible-name assertion polls.

**Status: CONTINGENT DELETION.** The MutationObserver + post-render aria decoration is a compatibility workaround for a Pagefind 1.5.2 limitation. Remove it once the Pagefind version in use provides a supported `FilterPills` translation / accessibility-label API. Do not evolve this into a permanent silent DOM-patch layer.

Also: the outer facet region is `<div data-haku-modular-filters role="region" aria-label="Rajaa hakua">` — Finnish landmark label, site-owned from the start.

## Browser tests (added in round 3)

`tests/haku-modular-ui-pilot.spec.js` now has **17 scenarios** covering the round-3 requirements plus the earlier ones. All PROVEN by explicit assertions.

| # | Scenario | Status |
|---|---|---|
| 1 | Modular UI mounts with Finnish input | PROVEN |
| 2 | Default UI DOM absent on /haku/ | PROVEN |
| 3 | Query returns results and cards carry family-badge + primary-meta | PROVEN |
| 4 | Mixed kinds coexist in Pagefind rank order (no grouping) | PROVEN |
| 5 | ?q= prefill triggers initial search | PROVEN |
| 6 | Pinned Kieli:Suomi excludes EN | PROVEN |
| 7 | Keyboard focus + text input | PROVEN |
| 8 | Finnish no-results state | PROVEN |
| **9** | **Sisältö facet narrows and clearing restores full result set + ranking** | **PROVEN** |
| **10** | **All 12 baseline-visible facet slots present (rendered or documented absent when 0 hits)** | **PROVEN** |
| **11** | **Domain-specific facet (Publications group) narrows to only publications / unknown** | **PROVEN** |
| **12** | **Two facets combined narrow further (AND semantics)** | **PROVEN** |
| **13** | **Facet pills expose numeric hit counts** | **PROVEN** |
| **14** | **Facet region + every rendered facet expose a Finnish accessible name** | **PROVEN** |
| **15** | **Facet pill is keyboard-focusable and Enter toggles it** | **PROVEN** |
| 16 | Load-more preserves order and hides when exhausted | PROVEN |
| 17 | Modular UI init failure falls back to SSR form | PROVEN |

### Repeat-run flake evidence

- **Single-pass:** 17/17 pass in ~18 s.
- **× 20 iterations, 2 workers:** **340/340 pass, zero flake, 4.9 min.**
- Isolated per-test × 20 (load-more, Sisältö-clear): 20/20 each.
- History: prior full-parallel × 20 runs (default 4 workers) surfaced 3–15 flakes across iterations traced to two real races (fixed):
  1. Initial `triggerSearch` firing before Pagefind's WASM/`__pagefind__` was ready. Fixed by deferring `triggerSearch(initialQuery)` inside an `instance.on("filters", …)` handler — Modular UI's Instance dispatches `filters` only after WASM + index initialisation.
  2. Same-term rerender (filter change) allowing an in-flight batch to append to a newer result set. Fixed by a monotonic `renderVersion` incremented on every `search`/`results` event; `renderBatch` captures the version at start and discards its HTML if the version changed by resolve time.

## Filter parity classification: **REDUCED / APPROVED**

This is a deliberate PF5 PARITY: REDUCE outcome for the global search surface, not an accidentally covered-up regression.

- Stock Default UI auto-generated **34 filter groups** on `/haku/` from indexed metadata.
- **7** of those 34 were internal/infra facets, not intended as user-facing filters (`FindExplore`, `Publications scope`, `Theses scope`, `Theses language`, `Writings scope`, `Research context`, `Kieli` — the last of which is pinned to `Suomi` on this surface and must not be user-selectable).
- The pilot deliberately retains **12** user-meaningful global-search facets — the reviewer-listed cross-domain and domain-specific subset (Sisältö · Publications group · Publications quality · Writings content type · Writings topic · Theses type · Theses role · Mediatyyppi · Rooli · Vuosi · PresentationYear · PresentationTopic).
- The remaining **15** domain-specific auto-generated facets are NOT copied onto the global Modular UI surface. Some of them (e.g. `PresentationTopic` with 294 values, `Publications topic` with 86 values, `PresentationEvent` with 57 values) are not sensible pill surfaces on a global search — they were only tolerable in Default UI because that UI hid them behind a filter drawer.
- **No Pagefind metadata, no taxonomy, and no indexed filter value has been removed.** The 15 omitted facets remain indexed and available to domain-specific discovery surfaces (Find & Explore on `/julkaisut/`, `/opinnaytteet/`, `/kirjoitukset/`, and Research contextual view). They are only absent from the global `/haku/` pill panel.
- Round 2's finding — "initial pilot dropped all facet UI → blocking regression" — is fully resolved. Round 3 restores 12 user-meaningful facets, all Finnish-labelled, all verified by browser tests (slot inventory, narrowing, AND-semantics, hit counts, keyboard).

**Filter UI's visual structure has changed** vs Default UI's stock filter panel (pills instead of checkboxes; grouped by our labels). Reviewer explicitly allowed this — functionality is the invariant, not visual identity.

**Indexed taxonomy / facet values unchanged.** No `data-pagefind-filter` names or values were added, renamed, or removed. `SISALTO_LABELS`, canonical projections, Pagefind config — all untouched.

**Pagefind still owns filter state.** `triggerFilter` / `triggerFilters` / `filters` event are unchanged; site JS only wires DOM containers and localises accessible names.

**Ranking preserved within a facet-narrowed set.** Test #9 proves clearing the facet returns the identical initial URL sequence.

## Shared presenter duplication ledger

Unchanged from round 2. `find-explore.js` still carries private copies of `escapeHtml`, `resultTitle`, `SISALTO_LABELS`, `contentFamilyLabelFromData`, `renderFamilyHeader`, `renderPrimaryMetaLine`. New `search-result-presenter.js` re-declares them.

- **Status: CONTINGENT DELETION — MUST RESOLVE BEFORE FULL GLOBAL ROLLOUT.**
- Deliberately not consolidated in this pilot (unwind-ability).
- Before `/en/search/`, navbar FI, or navbar EN migrate to Modular UI, `find-explore.js` must import from `window.SearchResultPresenter` and drop its private copies.

## Changed files (exactly 5)

| Path | Change |
|---|---|
| `src/fi/haku.njk` | `pageScripts:` swap + `data-pagefind-ui` removed. |
| `src/js/search-result-presenter.js` | **New** — pure shared PF4/PF5 result presentation projection. Media returns `[]` for primary meta (family badge only). Presentation meta shape is direct pre-G1 reuse. |
| `src/js/haku-modular-ui.js` | **New** — `/haku/`-specific Modular UI mount. Instance + Input + FilterPills × 12 + site-owned summary + site-owned eager paginated rendering + post-render FI accessible-name decoration + monotonic version guard + filters-ready-gated initial query. |
| `tests/haku-modular-ui-pilot.spec.js` | **New** — 17 scenarios: mount, absence of Default UI DOM, mixed-kind rendering, ?q= prefill, Kieli pinning, keyboard, no-results, **Sisältö narrow+clear+ranking**, **all baseline facets present**, **domain facet narrows**, **two-facet AND**, **hit counts**, **Finnish accessible names**, **keyboard-focus pill**, load-more, init-failure. |
| `docs/pf5-g1-haku-modular-ui-pilot-2026-08-22.md` | **New** — this document. |

**Total: 3 production files + 1 test file + 1 evidence doc = 5 in-scope changed files.**

## Not changed (invariants held)

- `src/js/site-search-page.js` — untouched; still loaded by `/en/search/`.
- `src/js/site-ui.js` — untouched; navbar Default UI mount unchanged (FI + EN).
- `src/js/find-explore.js` — untouched (private helper copies remain — contingent deletion).
- `src/en/search.njk` — untouched.
- `src/_includes/_meta.njk` — global `pagefind-ui.js` + `pagefind-ui.css` load remain because navbar FI/EN and `/en/search/` still depend on Default UI.
- Canonical projections (`src/src.11tydata.js`, `src/_utils/*`, `scripts/_lib/presentationPagefind.js`, `src/_includes/media-item.njk`) — untouched. No new Pagefind meta.
- Taxonomy, `contexts`, Research membership, `pageUrl`/`sourceUrl`/`externalUrl` semantics — untouched.
- All SSR archive partials — untouched.
- All CSS files — untouched (shared presenter reuses `.find-explore-result*` tokens; Modular UI shell uses Bootstrap classes; `FilterPills` uses `.pagefind-modular-*` classes).

## Unit / build / regression evidence

| Suite | Result |
|---|---|
| `npm run test:unit` | **602 / 602 PASS**, 1.05 s |
| `npm run build:no-og` | Clean (researchfi integrity 56/56/56/55) |
| `tests/haku-modular-ui-pilot.spec.js` (17) × 20, 2 workers | **340 / 340 PASS**, 4.9 min, **zero flake** |
| Combined regression (pilot + `pf-ui-l10n1` + `pf3` + `pf4` + `navigation` + `accessibility-tools` + `accessibility` + `f2-find-explore-smoke`) | **61 / 61 PASS**, 23.2 s |

Two pre-existing failures on `origin/main` (`pf-perf2-first-search-latency`, `pf5-impl-apa-full-list:67`) are not caused by this pilot — previously verified against clean base with pilot stashed.

## Deletion completed / deferred

**Completed in this pilot:**
- `data-pagefind-ui` attribute on `#siteSearchPageUi` in `haku.njk`.

**Deferred (rollout scope):**
- `src/js/site-search-page.js` — still loaded by `/en/search/`.
- Global `/pagefind/pagefind-ui.js` + `pagefind-ui.css` load in `_meta.njk`.
- `.site-search-page-ui .pagefind-ui__*` overrides in `_global.css`/`_components.css`.
- **`find-explore.js` private copies of the shared helpers — CONTINGENT DELETION / MUST RESOLVE BEFORE FULL GLOBAL ROLLOUT.**
- **`MutationObserver` post-render aria decoration in `haku-modular-ui.js` — CONTINGENT DELETION.** Compatibility workaround for Pagefind 1.5.2's missing `FilterPills` translation/accessibility-label API. Remove once a supported API is available.

## Residual risks

1. **Contingent duplication of shared helpers.** Must consolidate before EN/navbar rollout.
2. **Facet parity is partial (12 of Default UI's 34).** The 11 additional domain-specific facets are omitted for scope + UX (some had hundreds of values). Reviewer may still require any subset added.
3. **Modular UI's built-in Summary and FilterPills' internal SR label are English-only in 1.5.2.** Summary is bypassed by site-owned handler. FilterPills SR label is replaced by post-render aria decoration on the rendered wrapper.
4. **Site-owned pagination + summary + version guard** are ~90 LOC of additional JS on `/haku/`. Bounded and covered by browser tests.
5. **URL sync uses `replaceState`, not `pushState`.** Same as pre-G1.

## Impact on subsequent slices

- **`/en/search/` rollout.** Straightforward swap. Before shipping: consolidate `find-explore.js` helpers into `window.SearchResultPresenter` (contingent deletion).
- **Navbar FI rollout.** Full `NEEDS BROWSER TEST` list from suitability audit applies (native `<dialog>` lifecycle, Escape, focus return). Sub-results decision (Modular UI has none) must be revisited.
- **Navbar EN rollout.** After it ships, Default UI load in `_meta.njk` and dependent CSS become deletable.
- **G2 (presentations).** Pilot reuses pre-G1 PF4 shape (type + event). PF5-APA7 §17 Phase 2 icon-only horizontal remains a separate deferred decision.
- **G3 (media 11b/11c).** Pilot renders media with family badge only (no primary meta line). The G3 decision is untouched; both 11b and 11c remain valid options.
- **G4 (writings).** Pilot uses reduced PF4 writings (content type only). Confirms empirically that G4-A remains blocked at the metadata layer.

## Non-goals (this pilot)

- No `/en/search/`, navbar FI, or navbar EN changes.
- No PF5-APA7 Phase 2 presentation horizontal variant.
- No G3 media 11b/11c decision.
- No G4 writings meta widening.
- No canonical / Pagefind / taxonomy / Research changes.
- No global CSS refactor.
- No refactor of `find-explore.js`.
- No performance measurement (P1 territory).

## Evidence classification summary

- **PROVEN**: Modular UI capability + Instance/Input/FilterPills wiring; Finnish UI strings via site-owned summary; language pinning; ?q= prefill (via `filters`-gated `triggerSearch`); Sisältö narrow-and-restore; all 12 facets present in DOM; domain facet narrowing; two-facet AND semantics; numeric hit counts; Finnish accessible names on region + every rendered facet; keyboard-focusable pill with Enter toggle; load-more; init-failure fallback. 340/340 × 20 zero flake. 602/602 unit. 61/61 regression subset.
- **INFERENCE**: The shared presenter's absence from `find-explore.js` is temporary; consolidation in rollout will be low-risk given the pure-helper shape.
- **NEEDS FOLLOW-UP**: `find-explore.js` helper consolidation before EN/navbar rollout. Reviewer decision on the 11 additional domain-specific facets.
- **NEEDS BROWSER TEST**: Full navbar rollout browser gates (native `<dialog>`, Escape, focus return) from the suitability audit.

---

**End of pilot evidence.** No production code committed. Awaiting review before staging + commit + PR.
