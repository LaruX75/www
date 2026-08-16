# PF-PERF1 — Pagefind Startup Performance Audit

Date: 2026-08-16
Status: **PF-PERF1 = DECIDED / GREEN**
Mode: audit only — no source code, no Pagefind metadata, no chip
runtime, no result-card touched.
Basis:
- `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md`
- `docs/pf2-shared-sisalto-facet-closure-2026-08-16.md`
- `docs/pf3-result-card-consistency-closure-2026-08-16.md`
- `docs/pf-starter-chips-closure-2026-08-16.md`
- `docs/pf4-result-card-hierarchy-closure-2026-08-16.md`
Machine data: `docs/data/pf-perf1-pagefind-startup-audit-2026-08-16.json`
Audit script: `scripts/audit-pf-perf1-pagefind-startup.js`

## 1. Status

Decision: **A — NO ACTION REQUIRED NOW.**

Every measurable signal points the same direction: Pagefind loads
lazily, no discovery page runs a search on load, no starter chip
invokes the search pipeline directly, the Pagefind index size is
identical to the plain-main baseline, and all shipped safety audits
remain green. No concrete slow-startup evidence exists on `main` or
in the PF closure record. Documented monitoring signals in §15 tell
future PF-PERF work what to watch for.

## 2. Repository state

- Branch: `main`
- HEAD before this commit: `3b52d8ce1ac8c5f1a4722d1c61fcebf53cac60dd`
  (`docs: close PF4 result-card hierarchy rollout`)
- `origin/main` in sync with local main
- Worktree clean for closure scope; only unrelated
  `.cache/api-fallback/*.json` remain dirty and are not staged
- All required closure docs present:
  - `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md`
  - `docs/pf2-shared-sisalto-facet-closure-2026-08-16.md`
  - `docs/pf3-result-card-consistency-closure-2026-08-16.md`
  - `docs/pf-starter-chips-closure-2026-08-16.md`
  - `docs/pf4-result-card-hierarchy-closure-2026-08-16.md`
- Find & Explore runtime + audit scripts all present
- No active source modifications outside the audit deliverables

## 3. Background: PF1 → PF2 → PF3 → PF-STARTER → PF4

- PF1 audited the user-facing discovery model and named PF-PERF1 as
  the deferred performance workstream to run only if concrete slow-
  startup evidence surfaced.
- PF2 landed the shared `Sisältö:*` Pagefind facet across all five
  content families (750 detail records).
- PF3 rendered that facet as a visible content-family badge above
  every shared Find & Explore result card, without any new Pagefind
  facet or index change.
- PF-STARTER-CHIPS shipped 14 user-triggered chips on `/tutkimus/`,
  `/esitykset/`, `/mediassa/`, wrapping existing filter / topic /
  query controls with a reverse gate that verifies the chip runtime
  has no `fetch(` / `pagefind.search` / `ContentEngine.query` /
  `runSearch(` call.
- PF4 trimmed the shared result-card hierarchy to a four-line default
  and demoted publication quality badges into one subdued micro-copy
  line, again with no Pagefind metadata or index change.

Cumulative effect on Pagefind: the index reached the current
baseline `fi:1163 / en:346` before PF-STARTER, and every subsequent
change was renderer-only.

## 4. Audit scope

Read-only inspection of the built `_site/` at HEAD `3b52d8ce`.
The audit answers:

- Does Pagefind actually load eagerly, or only on demand?
- Does any discovery page auto-search on load?
- Have PF2 → PF4 changed the Pagefind index shape?
- Are the shared discovery bundles growing unbounded?
- Is there any concrete regression / incident on record?

The audit deliberately does not run browser timing tests —
per prompt §9 ("Do not create brittle exact timing tests that fail
randomly in CI"). Timing observations, where relevant, are
recorded qualitatively in §7–§8.

## 5. Measurement method

- Read `_site/pagefind/pagefind-entry.json` for language page counts.
- Read the eight discovery HTML pages (Homepage, `/tutkimus/`,
  `/kirjoitukset/`, `/opinnaytteet/`, `/julkaisut/`, `/esitykset/`,
  `/mediassa/`, `/haku/`) for script tags, `data-find-explore*`
  hooks, `data-starter-chips` hooks, and `data-pagefind-body`
  presence.
- Read shared bundle sizes:
  `_site/js/find-explore.js`, `js/starter-chips.js`,
  `js/presentations-page.js`, `js/site-search-page.js`,
  `js/content-engine.js`, `js/content-presets.js`,
  `js/pe-list-render.js`, `pagefind/pagefind.js`,
  `pagefind/pagefind-ui.js`,
  `pagefind/wasm.fi.pagefind`, `pagefind/wasm.en.pagefind`.
- Inspect the source of `src/js/find-explore.js` +
  `src/js/starter-chips.js` for the lazy-import + no-auto-search
  invariants (both mirrored in the audit script's gates).
- Cross-check against the shipped safety audits from PF2, PF3, M2,
  F4, PF4, and PF-STARTER.

All measurements are deterministic (no timing dependency).

## 6. Build-time Pagefind findings

Pagefind index at `_site/pagefind/pagefind-entry.json`:

| Language | Page count | Baseline | Delta |
| --- | --- | --- | --- |
| `fi` | **1163** | 1163 | 0 |
| `en` | **346** | 346 | 0 |

- Version: Pagefind `1.5.2`.
- 89 sharded `.pf_index` files (28 en + 61 fi) totalling roughly 2.5 MB.
- 53 filter files, 1509 fragment files.
- wasm bundles: `wasm.fi.pagefind` **71 098 bytes**, `wasm.en.pagefind` **72 740 bytes**.

Index did not collapse or expand relative to the post-PF4 baseline
recorded in `docs/pf4-result-card-hierarchy-closure-2026-08-16.md §7`.

Build duration was not measured here; the shipped Pagefind step in
`scripts/run-pagefind.js` runs synchronously after the Eleventy
build and completes within the normal CI budget on
`Build and Deploy` (< ~1 minute against the whole site — evidence
from post-merge runs on `d4cde07e`, `18deec80`, `3d63a609`,
`5a7cb08e`, `69ad319e`, all green).

## 7. Runtime startup findings

Pagefind runtime loading pattern (`src/js/find-explore.js`):

- The main Pagefind bundle is loaded via a **dynamic import inside
  `createSearch(language)`**:
  `await import(\`/pagefind/pagefind.js?findExploreLang=${searchLanguage}\`)`.
  This means the wasm/index files do NOT load on discovery-page
  page load — they load only after the first search request from a
  user (or the first auto-triggered search from a filter that came
  in via URL parameters).
- `runSearch()` returns early when there is no effective query and
  no filters (`if (!effectiveQuery && config.requiresQueryForSearch)`
  and the subsequent bare `if (!effectiveQuery)` gate). Fresh
  page loads with no URL parameters do NOT initiate a Pagefind
  request.
- `createSearch` caches per-language results in `searchCache`, so
  repeat searches reuse the loaded module. First-search latency
  therefore dominates over subsequent searches by design.
- Static site-search entrypoint (`_site/js/pagefind-ui.js` from
  Pagefind 1.5.2, loaded with `defer` from `_includes/_meta.njk`)
  builds the UI shell only; per Pagefind's default behavior it
  loads the wasm on first user interaction with the search input.

Reverse gates from the audit script (`gates` field of the machine
data — all pass):

- `pagefindEntryPresent`
- `pagefindFiCountAtBaseline` (fi = 1163)
- `pagefindEnCountAtBaseline` (en = 346)
- `findExploreLazyLoadsPagefind` (dynamic import present)
- `findExploreCreateSearchDefined`
- `findExploreEarlyReturnsWhenIdle`
- `starterChipsRuntimeDoesNotAutoSearch`
- `noDiscoveryPageCarriesPagefindBody`

No console-error probing was performed here; the shipped browser
smokes (`pf4-result-card-hierarchy`, `pf-starter-chips`,
`pf3-result-card-consistency`, `pf2-sisalto-facet`, plus
`f4-research-find-explore` etc.) all pass on `main`, giving
indirect evidence that no runtime error blocks the discovery
runtimes.

## 8. Page-by-page observations

Deterministic script inventory per discovery page (from the
audit's `discoveryPages` array):

| Page | Script tags | `find-explore*` attrs | Starter-chip groups | data-pagefind-body |
| --- | ---: | ---: | ---: | :---: |
| Homepage (`/`) | 7 | 0 | 0 | no |
| `/tutkimus/` | 9 | 16 | 1 | no |
| `/kirjoitukset/` | 7 | 14 | 0 | no |
| `/opinnaytteet/` | 8 | 15 | 0 | no |
| `/julkaisut/` | 8 | 17 | 0 | no |
| `/esitykset/` | 12 | 0 | 1 | no |
| `/mediassa/` | 11 | 0 | 1 | no |
| `/haku/` | 8 | 0 | 0 | no |

- `find-explore-*` attribute count is not the mount count; each
  Find & Explore mount emits multiple `data-find-explore*`
  attributes (kind, scope, lang, query, results, etc.), so a
  page with one mount shows 14–17.
- Script counts include the shared runtime (Bootstrap, a11y,
  site-ui, external-media-consent) plus family-specific runtimes.
  `/esitykset/` and `/mediassa/` carry the largest script bill
  because they run bespoke JSON archives on top of
  `pe-list-render.js` / `content-engine.js` / `content-presets.js`.
- No discovery page auto-searches — verified structurally in §7.
- Starter chips are present on the three PF-STARTER pages and are
  never pre-pressed on load (see PF-STARTER audit's
  `noChipPrePressed` gate — still green in this run).

Shared bundle sizes:

| File | Bytes |
| --- | ---: |
| `pagefind/pagefind.js` | 45 555 |
| `pagefind/pagefind-ui.js` | 119 987 |
| `pagefind/wasm.fi.pagefind` | 71 098 |
| `pagefind/wasm.en.pagefind` | 72 740 |
| `js/find-explore.js` | 23 901 |
| `js/starter-chips.js` | 3 633 |
| `js/presentations-page.js` | 25 207 |
| `js/site-search-page.js` | 5 190 |
| `js/content-presets.js` | 18 979 |
| `js/pe-list-render.js` | 7 984 |
| `js/content-engine.js` | 3 497 |

Only the site-wide `pagefind-ui.js` (~120 KB) qualifies as
non-trivial, and it is `defer`-loaded and does not fetch the wasm
until first search interaction. All PF-authored assets are small
(< 30 KB each). PF-STARTER's runtime is tiny (~3.6 KB).

## 9. Starter chip interaction

Verified by re-running `scripts/audit-pf-starter-chips.js` on the
current build:

- `runtimeDoesNotAutoSearch` — pass. No `fetch(`, `pagefind.search`,
  `ContentEngine.query`, or `runSearch(` call inside
  `_site/js/starter-chips.js`.
- Every chip either fills an existing form field and dispatches a
  standard `input` / `change` event, or proxies a `.click()` on an
  already-existing filter button.
- No chip is pre-pressed on page load.

Chip → runtime cost path: chip click → set value → dispatch event
→ existing debounced handler fires → `runSearch()` → `createSearch(lang)`
→ dynamic `import('/pagefind/pagefind.js')` (first time only) →
`pagefind.search(query, {filters})`. Each step is standard event
dispatch or lazy import; there is no extra layer that adds
per-chip work.

## 10. Result-card rendering interaction

PF4 trimmed the card to a four-line default and demoted the
publication colored badges to one subdued line. Rendering cost
per hit dropped slightly (fewer DOM nodes per result) and per-render
JS work is unchanged (the same `renderResults()` loop was already
shipping — PF3/PF4 changed only the string it produces).

No result-card change introduced additional network or Pagefind
work. Renderer helpers (`renderFamilyHeader`,
`renderPrimaryMetaLine`, `publicationQualityLine`, `citationButton`,
`sourceLink`) are pure string operations.

## 11. Research boundary verification

Verified via `scripts/audit-f4-research-built-output.js` on the
current build:

| Kind | Eligible |
| --- | --- |
| publications | 53 |
| theses | 169 |
| writings | 62 |
| presentations | 33 |
| **total** | **317** |

- Research population unchanged from the F4 closure baseline.
- Media is not enumerated in any Research surface.
- `contexts.includes("research")` remains the sole membership rule.
- No topic-mapping-as-membership introduced.
- No `Sisältö:Tutkimus` in any renderer (PF3/PF4 reverse gates).

## 12. Pagefind body-gate verification

- No `data-pagefind-body` anywhere on the eight discovery HTML
  pages (audit gate `noDiscoveryPageCarriesPagefindBody` +
  per-page `hasPagefindBody: false`).
- M2 `noDetailUsesPagefindBody` reverse gate — pass.
- PF2 `noHtmlDetailUsesPagefindBody` reverse gate — pass.
- PF3 `noForbiddenTokenInFamilyBlock` reverse gate — pass.
- PF4 `noDataPagefindBodyInRenderer` reverse gate — pass.
- Pagefind index size at post-PF4 baseline (fi 1163 / en 346) —
  the site-wide gate has not accidentally activated.

## 13. Risks

- **False confidence**: no browser timing tests were run in this
  audit. The audit reasons from architecture ("Pagefind loads
  lazily") rather than measured wall-clock. If a future incident
  reports observed slowness, re-open PF-PERF1 with browser-timing
  evidence and consider Option B / C / D below.
- **`pagefind-ui.js` bundle growth**: the 120 KB `pagefind-ui.js`
  is a third-party asset; a Pagefind version bump could enlarge
  it. Watch for regressions after Pagefind minor/major upgrades.
- **`_site/js/presentations-page.js` growth**: bespoke archive
  runtime is 25 KB. If the presentation archive gains more
  bespoke behavior it could become the largest single asset on
  `/esitykset/`. Not urgent.
- **`data-pagefind-body` re-introduction**: the M2 site-wide gate
  incident dropped the index from `fi:1163 / en:346` to
  `fi:135 / en:15` before the fix. Any future change adding this
  attribute to a detail template would repeat the incident.
  Protected by four independent reverse gates in the shipped
  audits (M2, PF2, PF3, PF4), and PF-PERF1 adds
  `noDiscoveryPageCarriesPagefindBody` as a fifth reverse gate on
  the discovery-page side.

## 14. Decision

**A — NO ACTION REQUIRED NOW.**

Concrete evidence supporting A:

- Pagefind index at exact post-PF4 baseline (`fi:1163 / en:346`).
- Pagefind wasm/index loaded via dynamic `import()` inside
  `createSearch(language)` — no eager wasm cost on page load.
- `runSearch()` returns early when there is no query and no
  filters — no auto-search on fresh loads.
- Starter chips runtime contains no direct Pagefind / fetch /
  search call.
- All eight discovery pages carry NO `data-pagefind-body`.
- All shipped safety audits still green:
  build-no-og / unit 401 / PF4 / PF-STARTER / PF3 / PF2 / M2 media /
  F4 Research (317) / presentation Pagefind (`ok: true`).
- No incident, no user report, no CI regression on record.

Options B / C / D would need concrete measurements. None are
justified today.

## 15. Recommendation

Ship PF-PERF1 as **NO ACTION REQUIRED NOW**. Add the machine data
+ this report + the deterministic audit script to `main` so future
work can compare against a documented baseline. Do not implement
any Pagefind lazy-load / filter-work / JS-split changes without
concrete evidence.

Monitoring signals that should trigger a follow-up PF-PERF2:

- User reports of visibly slow search on `/tutkimus/`,
  `/haku/`, `/en/search/`, `/kirjoitukset/`, `/opinnaytteet/`,
  or `/julkaisut/`.
- A CI regression in `Accessibility and navigation tests` or
  `Staging checks / build-and-verify` that is traceable to
  Pagefind duration.
- A first-search latency observation > ~1 s on a modern
  broadband connection to production.
- An unexpected Pagefind index size delta (fi or en varying by
  more than ±10 % vs the current baseline) surfaced by the
  PF-PERF1 audit re-run.
- Pagefind minor/major version bump landing on `main` — re-run
  the PF-PERF1 audit script to catch bundle-size or index-shape
  regressions.
- A future feature that adds `data-pagefind-body` to any detail
  template — the four M2/PF2/PF3/PF4 reverse gates should catch
  this, but if any of them are ever disabled or modified,
  re-verify Pagefind index size at the same time.

## 16. Explicitly out of scope

- Bespoke media / presentation archive card visual harmonization.
- Writings segmentation (`scientificPublication` visibility inside
  `/kirjoitukset/`).
- Media outlet / source normalization.
- English starter-chip parity (`/en/research/`, `/en/presentations/`,
  `/en/media/`).
- Adding media as a shared Find & Explore `kind`.
- Any Pagefind metadata / filter / body-scope change.
- Any Research semantic change.
- Any starter-chip runtime / label / config change.
- Any result-card renderer change.
- SEO / social sharing / scroll-hint work — separate Codex UXSEO
  line, not part of the Pagefind PF closure chain.

## 17. Next prompt outline

Not required. Decision A does not schedule a follow-up
implementation prompt.

If a future incident triggers PF-PERF2, the shape of the follow-up
prompt should be one of:

- **PF-PERF2 — LAZY LOAD / DEFER PAGEFIND INIT** (if the incident
  shows the initial `defer`-loaded `pagefind-ui.js` still blocks
  interaction);
- **PF-PERF2 — REDUCE STARTUP FILTER WORK** (if the incident
  shows `pagefind.filters()` becoming the bottleneck);
- **PF-PERF2 — SPLIT / DEFER DISCOVERY JS** (if a specific
  discovery page's script bundle grows past the current sizes).

Each of those would consume the machine data in
`docs/data/pf-perf1-pagefind-startup-audit-2026-08-16.json` as its
baseline.

STOP.
