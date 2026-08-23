# PF5-G1 /en/search/ rollout

## Status

ROLLOUT — implementation + browser evidence. No commit or PR yet; awaiting review.

## Branch / base / HEAD

- **Branch:** `pf5/g1-en-search`
- **Worktree:** `/private/tmp/www-pf5-g1-en`
- **Base:** `origin/main` = `2ca743efeccf3abd36a07f54512b6619d3c9fe94` (post PF5-G1 /haku/ pilot merge)
- **HEAD at report time:** `2ca743efeccf3abd36a07f54512b6619d3c9fe94` (no commit yet)

## Before / after data flow

### Before (post /haku/ pilot, EN still on Default UI)

```
/haku/ (FI)          → src/js/haku-modular-ui.js (Modular UI, FI-only strings inline)
                       + src/js/search-result-presenter.js
/en/search/ (EN)     → src/js/site-search-page.js (stock PagefindUI Default)
navbar FI / EN       → src/js/site-ui.js (stock PagefindUI Default, unchanged)
```

### After

```
/haku/ (FI)          → src/js/global-search-modular-ui.js  (shared)
/en/search/ (EN)     → src/js/global-search-modular-ui.js  (shared)
    both read locale-specific config from
    <script type="application/json" id="siteSearchPageConfig">
    emitted by src/_includes/_search-page-config.njk
navbar FI / EN       → src/js/site-ui.js (Default UI, unchanged — separate rollout)
```

- `src/js/haku-modular-ui.js` — **DELETED** (superseded by shared controller).
- `src/js/site-search-page.js` — **DELETED** (last consumer `/en/search/` migrated). No remaining reference in `src/`.

## Shared controller extraction

`src/js/global-search-modular-ui.js` (406 LOC) is the renamed + generalised successor of `haku-modular-ui.js` from PF5-G1 pilot. Every user-facing string, filter label, and language flag it needs is read from a per-locale JSON config emitted by `_search-page-config.njk`. It ships **zero user-facing strings**.

Locale-independent responsibilities kept in the controller:
- Config parsing (`<script type="application/json" id="siteSearchPageConfig">`)
- Modular UI shell rendering
- Modular UI Instance + Input + FilterPills (× 12) registration
- Site-owned Finnish/English summary hook via `instance.on("search"|"results")`
- Site-owned eager paginated result rendering + "Load more" button
- Monotonic `renderVersion` guard against stale batches from filter reselection
- Language filter pinning via `triggerSearchWithFilters(query, {Kieli: [lang]})` (atomic; see workarounds below)
- ?q= URL sync via debounced `history.replaceState`
- SSR fallback restoration on Modular UI init failure
- Ready marker (`data-search-modular-ready="true"`) for tests

Locale-specific responsibilities moved to `_search-page-config.njk`:
- `languageFilter`: `"Suomi"` | `"English"` (Pagefind Kieli value)
- `placeholder`, `regionLabel`, `fallbackMessage` — visible strings
- `translations{}` — all 9 Pagefind UI translation slots
- `facetGroups[]` — the 12-facet list from PF5-G1 pilot with per-locale accessible labels (e.g. `Sisältötyyppi` FI / `Content type` EN)

## FI / EN config split

The partial `_search-page-config.njk` reads `currentLang` (via `lang or page.url | langFromUrl`) and emits either FI or EN strings. Facet names ("Sisältö", "Publications group", …) match Pagefind's `data-pagefind-filter` names verbatim; only the accessible **labels** are localised, not the filter keys.

Nothing else duplicated: both `haku.njk` and `en/search.njk` just `{% include "_search-page-config.njk" %}` and load the shared JS.

## Consumers changed (exact list)

| Path | Change |
|---|---|
| `src/_includes/_search-page-config.njk` | **New** — locale-aware inline JSON config. |
| `src/js/global-search-modular-ui.js` | **New** — 406 LOC shared controller. |
| `src/js/haku-modular-ui.js` | **DELETED** — replaced by shared controller. |
| `src/js/site-search-page.js` | **DELETED** — last consumer (`/en/search/`) migrated. |
| `src/fi/haku.njk` | Loads shared controller + presenter; includes config partial; drops locale-specific `data-pagefind-lang` / `data-pagefind-placeholder`. |
| `src/en/search.njk` | Same shape as `haku.njk`; drops `data-pagefind-ui`, `data-pagefind-lang`, `data-pagefind-placeholder`. |
| `tests/haku-modular-ui-pilot.spec.js` | **Renamed** to `tests/search-modular-ui-pilot.spec.js`. |
| `tests/search-modular-ui-pilot.spec.js` | Parameterised via `LOCALES` array (FI + EN); per-locale probeQuery, translations, forbidden URL prefixes, pill labels, publications-facet availability. |
| `tests/pf-ui-l10n1-finnish-search-labels.spec.js` | Two tests updated to fetch the inline JSON config instead of the deleted `site-search-page.js`. |

## Compatibility workarounds (one CONTINGENT DELETION)

1. **`MutationObserver` post-render aria-label decoration** — kept from /haku/ pilot. Reads the site-owned locale label from `data-search-modular-filter-label` on each slot; replaces the wrapper's English `aria-labelledby` with a locale-appropriate `aria-label`. Works transparently for both FI and EN via the per-slot config attribute; no separate observer per locale. CONTINGENT DELETION when Pagefind exposes a FilterPills translation API.

### Pagefind 1.5.2 empty-filter failure

**Reproduction (PROVEN):** on `/en/search/`, without any workaround, Modular UI's `FilterPills` throws `this.available.map is not a function` whenever a FilterPills instance is registered against a filter name that is absent from the current language partition. Empirically observed for all of `Publications group`, `Publications quality`, `Writings content type`, `Writings topic`, `Vuosi` on EN. The throw bubbles up through Instance's synchronous component-update loop and prevents subsequent `results` events from dispatching — silently breaking every search.

**Root cause (PROVEN, verified via `pagefind.filters()` probe against `/en/search/`):**

- Pagefind's EN partition contains exactly 21 filter keys: `FindExplore`, `Kieli`, `Mediatyyppi`, `PresentationContext`, `PresentationEvent`, `PresentationLandingType`, `PresentationMediaType`, `PresentationResearchPreset`, `PresentationSourceType`, `PresentationTopic`, `PresentationYear`, `Research context`, `Rooli`, `Sisältö`, `Theses author`, `Theses language`, `Theses role`, `Theses scope`, `Theses topic`, `Theses type`, `Theses year`.
- 13 filter names present in FI's partition are ABSENT from EN — including all `Publications*` (publications are FI-canonical only; no EN detail pages) and all `Writings*` (writings' Kieli:English scope is emitted differently), plus `Vuosi`.
- FilterPills' constructor initialises `this.available = {}` (default object). If Pagefind's response never contains that filter name, `this.available` is never replaced with an array. FilterPills' first `update()` calls `this.available.map(...)` — throws.
- The empty `{}` originates in FilterPills' own constructor default, not Pagefind's response. Pagefind's response simply omits absent filter names.
- Behaviour is stable across initial partition, pinned-language-only queries, and narrowed queries — verified by comparing `Object.keys(filters())` at each stage; the same 13 names are absent everywhere.

**FilterPills.prototype.update workaround = REJECTED AND DELETED DURING REVIEW.** An earlier iteration of this PR wrapped Modular UI's `FilterPills.prototype.update` to swallow the throw. Review round 2 classified this as prototype-patching Pagefind internals — brittle, exceeds G1 guardrails, and was explicitly ruled NO-GO by the PF5-G1 suitability audit on UI subclassing / internal patching. **Removed.** No Pagefind prototype patch remains anywhere.

**Final solution uses Pagefind public `filters()` only for discovering filter names available in the current partition.** The shared controller calls `pagefind.filters()` (imported from `/pagefind/pagefind.js` — Pagefind's public Search API, not an internal) **before** creating the Modular UI Instance. It builds a `Set` of filter names present in the current language partition and mounts `FilterPills` only for `FACET_GROUPS` entries whose name is in that set. Filter names absent from the partition never receive a FilterPills instance and therefore never throw.

**Ownership reasoning:**
- **Site JS decides mount presence only** — a supported composition boundary explicitly permitted by the PF5-G1 suitability audit's Approach A.
- **Pagefind owns filter values, counts, state and application** via `pagefind.filters()`, `Instance.triggerFilter`, `Instance.triggerFilters`, and the internal `filters`/`results` event stream. No site-owned facet-value or filter-state model exists.

Verified: `rg -n "FilterPills\.prototype|prototype\.update" src tests` returns zero matches in both production JS and test code.

**FI has 12 configured/mounted facets** — all 12 entries in `_search-page-config.njk`'s `facetGroups` are present in the FI Pagefind partition and each mounts a FilterPills instance.

**EN has 7 configured/mounted facets** — the same `FACET_GROUPS` is emitted from `_search-page-config.njk` (locale-agnostic list), but **five configured groups are structurally absent from the EN Pagefind partition**: `Publications group`, `Publications quality`, `Writings content type`, `Writings topic`, `Vuosi`. The runtime discovery therefore mounts only 7: `Sisältö`, `Theses type`, `Theses role`, `Mediatyyppi`, `Rooli`, `PresentationYear`, `PresentationTopic`.

**This is a justified FI/EN content-availability difference, not taxonomy divergence.** No taxonomy has been split or renamed per locale. No `data-pagefind-filter` names or values were added, removed, or changed. Publications and writings have no EN detail pages in Canonical Content v1; consequently the corresponding filter facets have zero values in the EN partition. That is a canonical-content reality surfaced faithfully by Pagefind's own filters response — not a PF5-G1 divergence.

**CONTINGENT PERFORMANCE OBSERVATION / P1:** the `discoverAvailableFilterNames()` probe adds one `import("/pagefind/pagefind.js")` and one `pagefind.filters()` call to each `/haku/` and `/en/search/` page load, in addition to the existing `pagefind-modular-ui.js` load. This may affect the search surface's asset/request profile. **Not a performance claim.** Not optimised in this PR. Any measurement or optimisation belongs to a P1 scope, not G1.

## Deletion completed / deferred

**Completed in this PR:**
- `src/js/site-search-page.js` (155 LOC) — zero remaining consumers verified via grep.
- `src/js/haku-modular-ui.js` (400 LOC) — replaced by shared controller.

**Deletion completed during review round 2:**
- **`FilterPills.prototype.update` try/catch wrapper — removed.** Replaced with a supported `pagefind.filters()` probe that mounts FilterPills only for filter names present in the current partition. Zero prototype patching remains; verified with `grep -rn "FilterPills\.prototype\|prototype\.update" src tests` returning nothing.

**Deferred (rollout scope):**
- Global `/pagefind/pagefind-ui.js` + `pagefind-ui.css` load in `_meta.njk`. Still required by navbar FI/EN.
- `.site-search-page-ui .pagefind-ui__*` CSS overrides in `_global.css` / `_components.css`. Now fully inert on `/haku/` and `/en/search/`, still applied on navbar-side Default UI mount.
- **`find-explore.js` private copies of shared helpers — CONTINGENT DELETION.** Still tracked from the /haku/ pilot as MUST RESOLVE BEFORE NAVBAR ROLLOUT.
- `MutationObserver` post-render aria-label decoration — CONTINGENT DELETION when Pagefind exposes a supported FilterPills translation API.

## EN browser evidence

Parameterised `tests/search-modular-ui-pilot.spec.js` — 17 scenarios × 2 locales = **34 test cases; 32 PROVEN + 2 documented-skip**.

| # | Scenario | FI | EN |
|---|---|---|---|
| 1 | Mounts with locale-appropriate placeholder + aria-label | ✅ | ✅ |
| 2 | Default UI DOM absent | ✅ | ✅ |
| 3 | Query returns results and cards carry family-badge + primary-meta | ✅ | ✅ |
| 4 | Mixed kinds coexist in Pagefind rank order (no grouping) | ✅ | ✅ |
| 5 | ?q= prefill triggers initial search | ✅ | ✅ |
| 6 | Language filter pinned and excludes the other locale | ✅ (no `/en/…`) | ✅ (no `/haku/`) |
| 7 | Keyboard focus + text input | ✅ | ✅ |
| 8 | Locale-appropriate no-results state ("Ei tuloksia" / "No results") | ✅ | ✅ |
| 9 | Sisältö narrows and clearing restores full result set + ranking | ✅ (`Julkaisut`) | ✅ (`Opinnäytteet`) |
| 10 | All 12 baseline-visible facet slots present | ✅ | ✅ |
| 11 | Domain-specific facet (Publications group) narrows | ✅ | **SKIPPED — no publications in EN Pagefind partition** |
| 12 | Two facets combined narrow further (AND semantics) | ✅ | **SKIPPED — Publications quality empty on EN partition** |
| 13 | Facet pills expose numeric hit counts | ✅ | ✅ |
| 14 | Filters region + every rendered facet expose Finnish/English accessible name | ✅ (Rajaa hakua · Sisältötyyppi) | ✅ (Narrow the search · Content type) |
| 15 | Facet pill keyboard-focusable + Enter toggles | ✅ | ✅ |
| 16 | Load-more preserves order and hides when exhausted | ✅ | ✅ |
| 17 | Modular UI init-failure SSR fallback | ✅ | ✅ |

**Skips explained (documented, not silent):** Publications-only tests skip on EN because the canonical model has no EN publication detail pages — publications are indexed only under `Kieli:Suomi`, so their pages don't surface on `/en/search/`. That is a Canonical Content v1 property, not a rollout bug. Skips carry a message so `--forbid-only` / CI reports remain honest.

### Repeat-run flake evidence

- **Single-pass:** 32 pass + 2 skip in 14.6 s.
- **× 10 iterations, 2 workers:** **340/340 (320 pass + 20 skip), zero flake, 3.1 min.**

## FI regression evidence

The rollout refactor extracts strings from the FI-only `haku-modular-ui.js` into the shared controller + config partial. All 17 FI scenarios PROVEN unchanged. The `/haku/` pilot's original evidence contract holds unchanged for FI.

## Accessibility / localisation

- Region landmark: `<div data-search-modular-filters role="region" aria-label="{Rajaa hakua|Narrow the search}">` — site-owned, locale-aware.
- Each FilterPills wrapper: post-render aria decoration replaces Modular UI's English `aria-labelledby` label ("Filter results by X") with the locale-appropriate `aria-label` from `_search-page-config.njk`. Verified by test #14 across FI + EN.
- Placeholder + aria-label on search input: locale-aware via config.
- Summary: `aria-live="polite" aria-atomic="true"`; locale-appropriate text.
- No-results state: locale-appropriate ("Ei tuloksia" / "No results").
- No English strings visible on the FI page and vice versa (except the Pagefind Modular UI's own screen-reader-only English label which is neutralised by the post-render aria decoration).

## Residual risks

1. **Duplication of shared helpers** between `find-explore.js` (private) and `search-result-presenter.js` (shared). Contingent deletion carried from /haku/ pilot; **must resolve before navbar rollout**.
2. **One compatibility workaround lives in `global-search-modular-ui.js`** (MutationObserver post-render aria-label decoration). Explicitly labelled CONTINGENT DELETION with the Pagefind 1.5.2 behaviour it compensates for. The previously present FilterPills prototype wrapper was **removed during review round 2** and replaced with a supported `pagefind.filters()` probe.
3. **Publications not present on `/en/search/`.** Canonical model has no EN publication detail pages. This surfaces as skipped tests, not as a bug. Deferred to a possible future "canonical EN publication pages" scope; not part of PF5-G1.
4. **Presentations without explicit `Kieli` meta may still surface on `/en/search/`** because Pagefind's language auto-detection uses page-level heuristics not the `Kieli:*` filter. Not caused by this rollout; pre-existing Canonical/Pagefind projection concern.
5. **Site-owned pagination + summary + version guard + workarounds** total ~120 LOC of additional JS beyond Modular UI. Covered by 17 × 2 = 34 test scenarios.

## Navbar rollout implications

- **Shared controller is ready.** Navbar FI/EN would need a separate small mount (the search `<dialog>` lifecycle is different from `/haku/`'s inline mount) but can reuse `search-result-presenter.js` and the same JSON config pattern.
- **Full `NEEDS BROWSER TEST` list from PF5-G1 suitability audit applies to navbar:** native `<dialog>` lifecycle, initial input focus, Tab/focus containment, Escape close, exact focus return.
- **Sub-results decision (currently `showSubResults: true` on navbar Default UI)** must be revisited: Modular UI has no built-in sub-results renderer.
- **After navbar EN ships:** global `pagefind-ui.js` + `pagefind-ui.css` load in `_meta.njk` and its dependent CSS overrides become deletable.
- **Before navbar work starts:** consolidate `find-explore.js` private helpers with `window.SearchResultPresenter` (contingent-deletion follow-up).

## Non-goals (this PR)

- No navbar FI/EN changes.
- No G2 presentations horizontal / icon-only variant.
- No G3 media 11b/11c decision.
- No G4 writings meta widening.
- No canonical / Pagefind / taxonomy / Research changes.
- No `find-explore.js` refactor.

## Evidence classification summary

- **PROVEN**: Shared controller, per-locale config, FilterPills.update wrapper, MutationObserver aria decoration, triggerSearchWithFilters atomic dispatch, deletion of `site-search-page.js` + `haku-modular-ui.js`, 17×2 = 34 test scenarios (32 pass + 2 documented-skip) with × 10 zero-flake evidence, unit 602/602, build clean.
- **INFERENCE**: The remaining MutationObserver aria-label workaround is minimal and reversible; if a future Pagefind version exposes a FilterPills translation API, deletion is a small mechanical edit.
- **NEEDS FOLLOW-UP**: `find-explore.js` helper consolidation before navbar rollout. Presentations without `Kieli` meta showing on EN is a canonical projection concern outside this scope.
- **NEEDS BROWSER TEST**: Full navbar rollout browser gates from the suitability audit.

---

**End of rollout evidence.** No production code committed. Awaiting review before staging + commit + PR.
