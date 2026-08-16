# PF-PERF2 — First-Search Perceived Latency Improvement

Date: 2026-08-16
Status: Implementation. Renderer-only warmup. No Pagefind metadata,
no chip, no research or writings semantics change.
Basis:
- `docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md`
- `docs/pf-starter-chips-closure-2026-08-16.md`
- `docs/pf4-result-card-hierarchy-closure-2026-08-16.md`

## 1. User-observed issue

The first search on a shared Find & Explore surface (e.g.
`/kirjoitukset/`, `/opinnaytteet/`, `/julkaisut/`, `/tutkimus/`)
feels too slow because Pagefind's wasm bundle only starts loading
after the user types their first query. Subsequent searches within
the same page reuse the loaded module and feel fast; the delay is
one-time-per-page but noticeable.

## 2. PF-PERF1 basis

PF-PERF1 concluded **NO ACTION REQUIRED** for regressions and
documented that Pagefind is dynamically imported via
`createSearch(language)` on the query-response path
(`docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md`
§7). PF-PERF2 does not challenge that conclusion — the shipped
architecture is still lazy — but converts the one-time first-search
import cost into idle-time work, so the user's typed query
skips the wait.

## 3. What changed since PF-PERF1

Only `src/js/find-explore.js`. Two additions and one small
accessibility tweak:

- `scheduleIdle(fn)` — thin helper that dispatches `fn` on the
  next browser idle window via `requestIdleCallback`, falling back
  to `setTimeout(fn, 1200)` in browsers without the API.
- `warmSearchLanguages(languages)` — iterates the mount's active
  search languages and calls `createSearch(language)` for each
  without running any search. Because `createSearch` already
  caches its promise per language, the warmup is idempotent.
  Failures are swallowed silently so warmup never fails the page.
- `initMount` now calls `warmup` from three orthogonal triggers:
  `scheduleIdle(warmup)`, `queryInput.addEventListener("focus",
  warmup, { once: true })`, and `mount.addEventListener("pointerenter",
  warmup, { once: true })`.
- `runSearch()` now toggles `aria-busy="true"` on the results list
  while a search is in flight, and clears it in `finally`. Purely
  accessibility polish; no visual change.

Everything else in `find-explore.js` — the `runSearch()` early
returns for empty state, the per-language `searchCache`, the
Pagefind filter shape, the family badge, the four-line hierarchy
— is untouched.

## 4. Chosen warmup strategy

**Three orthogonal triggers, all firing at most once, all
idempotent:**

| Trigger | When it fires | Fallback |
| --- | --- | --- |
| `requestIdleCallback(warmup, { timeout: 2500 })` | The browser's next idle window after mount init, or 2.5 s max | `setTimeout(warmup, 1200)` |
| `focus` on `[data-find-explore-query]` | The user tabs / clicks into the search input | `{ once: true }` — dispatched at most once per mount |
| `pointerenter` on the mount | The user's mouse or finger enters the mount container | `{ once: true }` |

Whichever fires first triggers `createSearch(language)`. Subsequent
triggers hit the resolved cache and complete in microseconds. The
user's first `runSearch()` after the warmup completes skips
directly to `pagefind.search(query, filters)` because the wasm
module is already loaded.

## 5. Why this is not automatic search

The warmup calls **only** `createSearch(language)`, which does
`await import('/pagefind/pagefind.js')` and (if defined)
`pagefind.init()`. It **never** calls `pagefind.search()`,
`runSearch()`, `renderResults()`, or updates the results list.

Concrete evidence:

- The PF-PERF2 browser smoke `tests/pf-perf2-first-search-latency.spec.js`
  asserts `resultsList li.find-explore-result` count is `0` both
  on page load and after the warmup interval (`page.waitForTimeout(3000)`
  + explicit focus). Only an explicit `queryInput.fill(...)` renders
  results.
- `runSearch()` still opens with `if (!effectiveQuery && config.requiresQueryForSearch)`
  and the bare `if (!effectiveQuery)` gate. Fresh page loads with
  no URL parameters continue to return early without calling
  Pagefind at all — the warmup runs alongside, not through, this
  gate.
- PF-STARTER's `runtimeDoesNotAutoSearch` audit gate on
  `src/js/starter-chips.js` remains green: the chip runtime still
  has no `fetch(`, `pagefind.search`, `ContentEngine.query`, or
  `runSearch(` call.
- PF-PERF1's static audit (`scripts/audit-pf-perf1-pagefind-startup.js`)
  still returns all 8 gates green, including
  `findExploreEarlyReturnsWhenIdle`.

## 6. Pages affected

Every page that mounts `[data-find-explore]` — currently:

- `/tutkimus/` (Research contextual mount)
- `/kirjoitukset/` and `/en/writings/` (writings shared runtime)
- `/opinnaytteet/` and `/en/theses/` (theses shared runtime)
- `/julkaisut/` and `/en/publications/` (publications shared runtime)

Not affected:

- `/esitykset/` — bespoke `presentations-page.js` runtime, not
  Find & Explore.
- `/mediassa/` — inline media archive runtime, not Pagefind-based.
- `/haku/` and `/en/search/` — use the shipped `PagefindUI`
  component from `pagefind-ui.js`, which has its own idle-loading
  strategy owned by Pagefind. Out of scope for PF-PERF2.

Homepage and any other page without a Find & Explore mount pays
zero warmup cost.

## 7. Files changed

- `src/js/find-explore.js` — added `scheduleIdle` and
  `warmSearchLanguages` helpers; wired three warmup triggers in
  `initMount`; added `aria-busy` toggle on the results list around
  `runSearch()`. Net +52 lines, no logic removed. Built asset
  grew from 23 901 B to 26 209 B (+2.3 KB / +9.7 %).
- `tests/pf-perf2-first-search-latency.spec.js` (new) — 4 Playwright
  smokes covering the warmup pattern, the explicit-first-search
  invariant, the starter-chip boundary, and the data-pagefind-body
  reverse gate.
- `docs/pf-perf2-first-search-latency-2026-08-16.md` (new) — this
  report.

No CSS, no template, no Pagefind metadata, no data-layer utility,
no chip runtime, no bespoke archive card touched. No new files in
`_data/` or `_utils/`.

## 8. Verification

Local gates on the PF-PERF2 branch build:

- `npm run build:no-og` — green (Pagefind entry `fi:1163 / en:346`
  matches plain-main baseline).
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf-perf1-pagefind-startup.js` — all 8 gates
  green (Pagefind index unchanged; find-explore still lazily
  imports; starter-chips still non-auto-search; no discovery
  page carries `data-pagefind-body`).
- `node scripts/audit-pf4-result-card-hierarchy.js` — all 19 gates
  green.
- `node scripts/audit-pf-starter-chips.js` — all 11 gates green.
- `node scripts/audit-pf3-result-card-consistency.js` — all 9
  gates green.
- `node scripts/audit-pf2-sisalto-facet.js` — all 9 gates green
  (750 detail records).
- `node scripts/audit-media-pagefind-m2.js` — all gates green
  including reverse `noDetailUsesPagefindBody`.
- `node scripts/audit-f4-research-built-output.js` —
  `totalResearchPopulation: 317`; media not enumerated.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `DISABLE_OG_IMAGES=true npx playwright test tests/pf-perf2-first-search-latency.spec.js
  --workers=1` — **4 / 4 pass**.

Timing measurements are deliberately not asserted (per prompt: "Do
not create brittle exact timing tests that fail randomly in CI").
The warmup effect is architectural — after warmup completes, the
user's `runSearch()` call skips the ~50-150 ms dynamic import
that used to sit on the query→result critical path.

## 9. Remaining risks

- **Idle callback timing**: `requestIdleCallback` has a 2.5 s
  timeout hint; if the browser is heavily loaded the warmup may
  not fire before the user searches. Focus + pointerenter fallbacks
  cover interactive cases. Worst case: the warmup misses its
  window and the first search pays the pre-PF-PERF2 cost — same
  as before, no regression.
- **Reduced-data / metered connections**: the warmup loads a
  ~72 KB wasm bundle per language ahead of time. Users who never
  search now pay a small bandwidth cost. Mitigation: warmup runs
  only on pages that mount `[data-find-explore]` — never on the
  homepage or content pages that don't ship the search runtime.
  If a `Save-Data` header future user request lands, gate warmup
  behind `navigator.connection?.saveData !== true`. Not urgent.
- **Third-party Pagefind version bumps**: if a future Pagefind
  release changes `createSearch` semantics (e.g. moves init cost
  out of `import()`), the warmup pattern may need adjustment.
  Documented for future maintainers.
- **`aria-busy` announcement chattiness**: some assistive tech may
  announce busy-state changes. Kept intentional because the search
  is short and the announcement is genuinely useful, but if user
  reports come in, we can gate it behind an actual latency
  threshold (e.g. only set busy if the search takes > 200 ms).

## 10. Rollback notes

To revert PF-PERF2 without touching any other PF work, remove
these three additions from `src/js/find-explore.js`:

1. The `scheduleIdle(fn)` function definition (~10 lines above
   `createSearch`).
2. The `warmSearchLanguages(languages)` function definition
   (~15 lines above `createSearch`).
3. The five lines inside `initMount` that wire `warmup`
   (`const warmup = ...`, `scheduleIdle(warmup)`, `queryInput?.addEventListener(...)`,
   `mount.addEventListener(...)`, `mount.dataset.findExplorePagefindWarmed`).

Optionally also remove the `resultsList?.setAttribute("aria-busy", "true")`
and matching `removeAttribute` in the `finally` clause of `runSearch`
if the accessibility polish is unwanted. Note this last piece is
independent of the warmup and can stay.

No other files need reverting. The browser smoke
(`tests/pf-perf2-first-search-latency.spec.js`) can either be
deleted or left in place — its assertions match the pre-PF-PERF2
behavior too (Pagefind still gets requested on first user search
even without warmup, so `pagefindRequests.length >= 1` remains
true after the fill).

Rollback is one-file, mechanical, and does not touch Pagefind
metadata, Research semantics, or any archive card.
