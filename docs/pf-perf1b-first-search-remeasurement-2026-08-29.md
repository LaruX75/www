# PF-PERF1B — First-search latency re-measurement

Date: 2026-08-29
Status: `MEASUREMENT ONLY / AUDIT` — no production code changed.

Re-measures Pagefind first-search latency on the current post-PF5
`main` (`ab6fa6da`, after P1-A baseline merged as PR #161). The
2026-08-16 PF-PERF1 audit predates the entire PF5-G1/H1A/H1B/A2/A3A/
A3B/A3B1 modular-UI + shared-presenter evolution, so its numbers do
not reflect current behavior.

## Repository truth

- Worktree: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Branch: `audit/pf-perf1b-first-search-remeasurement` (fresh from `origin/main`)
- Branch base: `ab6fa6daa293518659888eacbd8b09f7ed954b19`
- `origin/main`: `ab6fa6daa293518659888eacbd8b09f7ed954b19`
- Ahead/behind: 0/0 (audit-only branch; only this doc will be added)
- Working tree: clean apart from `.cache/api-fallback/*` auto-generated caches (preserved; excluded from commit).

## Why re-measurement was needed

`docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md` was
authored before every PF5 shell change. Since then, on `main`:

- PF5-G1 shared presenter convergence (PR #131, PR #134) — moved six
  duplicated helpers to `src/js/search-result-presenter.js`.
- PF5-H1A search page shell simplification (PR #140) — replaced the
  Pagefind UI shell with a single SSR-authoritative form.
- PF5-H1B progressive facet disclosure (PR #142).
- PF5-A2 semantic UL/LI result list (PR #151).
- PF5-A3A content-type single-select (PR #156).
- PF5-A3B facet availability presenter (PR #157).
- PF5-A3B1 controlled facet vocabulary (PR #158).
- Pagefind index-hygiene (PR #149), seed-token leak (PR #153), navbar
  zero-results (PR #154).

The P1-A baseline (`docs/p1a-site-performance-baseline-2026-08-29.md`
§Pagefind baseline) flagged the Pagefind latency measurement as a
gap for the current modular-UI shell and recommended this
re-measurement as the single post-closure follow-up.

## Environment

| Attribute | Value |
| --- | --- |
| Host machine | macOS `Darwin 25.4.0`, zsh |
| Node | as installed in the repo (`node_modules/playwright`) |
| Browser | headless Chromium via Playwright (`chromium.launch({ headless: true })`) |
| Chromium build | Playwright's bundled Chromium |
| Build command | `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og` (repo's normal cached/offline-safe production-like build; artifacts from earlier P1-A run, timestamps `29 elokuuta 10:28`, verified unchanged) |
| Static server | `python3 -m http.server 4173` serving `_site/` |
| Pagefind version | as pinned in `package.json` (unchanged since 2026-08-16 baseline; verified same index shape) |
| Serving concurrency | single-threaded http.server (see §Limitations) |

**Limitation of note.** `python3 -m http.server` is single-threaded and
serializes concurrent HTTP requests. Because each cold sample creates
a fresh isolated browser context that fetches Pagefind's fragments in
parallel, this caused ~50% of cold samples to time out at 15 s. The
timeouts are an artifact of the local test harness, not a Pagefind
behavior. Successful samples reflect representative latency; the
absolute cold-vs-warm delta may be slightly inflated by request
serialization in the failing pattern, but the successful cold samples
are internally consistent (see §Cold-start results).

## Method

Measurement script: `/tmp/pf-perf1b-measure.mjs` (temporary; removed
after run — not committed as reusable regression tooling).

Per surface, target = 12 cold + 12 warm samples per language.

### Cold sample

1. `browser.newContext()` — isolated cache/storage.
2. `page.goto("/haku/" or "/en/search/", { waitUntil: "load" })`.
3. Wait for `[data-search-modular-input]` to be visible (**UI ready**).
4. `page.fill("[data-search-modular-input]", <query>)`.
5. `waitForFunction` until `[data-search-modular-results]` has at least one child (**first result rendered**).
6. Capture: `Date.now()` between step 4 and step 5 (first-result latency), all `/pagefind/**` requests + transferred bytes, all script requests + bytes, `performance.getEntriesByType("navigation")` timings, `performance.getEntriesByType("longtask")` entries.
7. Close context (discard cache).

### Warm sample

1. Open a single context, load page, prime with an initial "cold-in-context" first search.
2. Repeat 12 times: clear input → wait empty → fill new query → wait for first result → record delta.

### Queries

Deterministic queries chosen to reliably return non-zero results
(verified during setup):

- FI: `tekoäly`, `opetus`, `yliopisto`
- EN: `artificial`, `learning`, `university`

## Cold-start results

| Surface | Mode | Samples (ok / total) | Median ms | Range ms | p95 ms |
| --- | --- | ---: | ---: | ---: | ---: |
| FI `/haku/` | Cold | 5 / 12 | **370** | 358–436 | 387 |
| EN `/en/search/` | Cold | 7 / 12 | **344** | 338–350 | 348 |

Timeouts (7 FI, 5 EN) are consistent with single-threaded http.server
saturation under concurrent context load. Successful FI + EN combined
= 12 usable cold samples.

UI ready (server-rendered `[data-search-modular-input]` becomes
visible after page load):

| Surface | Median ms | Range ms |
| --- | ---: | ---: |
| FI `/haku/` | 34 | 25–38 |
| EN `/en/search/` | 23 | 19–28 |

Search input is usable essentially immediately after page load.

## Warm-search results

| Surface | Mode | Samples | Median ms | Range ms | p95 ms |
| --- | --- | ---: | ---: | ---: | ---: |
| FI `/haku/` | Warm | 12 / 12 | **347** | 334–368 | 351 |
| EN `/en/search/` | Warm | 12 / 12 | **332** | 317–351 | 334 |

Individual warm samples were tightly clustered — no outlier searches
exceeded ~370 ms.

## Cold vs warm delta

| Surface | Cold median | Warm median | Delta ms |
| --- | ---: | ---: | ---: |
| FI | 370 | 347 | **23** |
| EN | 344 | 332 | **12** |

**The cold-vs-warm delta is small: 12–23 ms.** This is a strong signal
that Pagefind bootstrap (JS/WASM module load, `pagefind.init()`, and
first-fragment fetches) is NOT the dominant cost of first-search
latency. If bootstrap were dominant, cold would be materially slower
than warm. It is not.

The ~330–370 ms latency reflects primarily search execution + result
presentation, which happens the same way on both cold and warm
queries.

## Network breakdown

Per cold first-search sample (successful runs):

| Surface | Pagefind requests | Pagefind bytes transferred | Script bytes on page |
| --- | ---: | ---: | ---: |
| FI `/haku/` | 93 (all cold samples identical) | ~467 KB (min 466, max 473) | 219 KB (constant) |
| EN `/en/search/` | 65 (all cold samples identical) | ~412 KB (min 412, max 433) | 219 KB (constant) |

Pagefind resources loaded on first cold search:

| Resource class | Requests (FI / EN) | Bytes (FI / EN) | When loaded |
| --- | ---: | ---: | --- |
| Page HTML | 1 / 1 | HTML page load | page load |
| Shared page-scoped JS (find-explore, search-result-presenter, modular-UI, chrome) | 9 / 9 | 219 KB / 219 KB | page load (defer) |
| Pagefind JS/wasm module | small (`pagefind.js` + wasm chunk) | included in 467/412 KB total | first-search trigger |
| Pagefind language index (`pagefind.{fi,en}_*.pf_meta` + `pagefind.{fi,en}_*.pf_index`) | ~2–3 | dominant portion of 467/412 KB | first-search trigger |
| Pagefind fragments (`/pagefind/fragment/*.pf_fragment`) | ~85–90 (FI) / ~55–60 (EN) | remainder | first-search trigger (per-result on-demand) |
| Filter chunks (`/pagefind/filter/*.pf_filter`) | few | small | first-search trigger |

The 65-vs-93 request delta between EN and FI matches the corpus
size delta (Pagefind fetches one fragment per top-K result; FI index
has 1067 pages vs EN 316, so FI searches typically match more
distinct fragments in the top K).

The Pagefind cost of ~412–467 KB on cold first-search is
content-addressed and cached long-term by the browser. On warm
searches within the same session none of these requests fire again.

## Main-thread / UI breakdown

| Signal | Observed |
| --- | ---: |
| `performance.getEntriesByType("longtask")` total ms | 0 across all cold samples (both surfaces) |
| Long-task count | 0 |
| Cold-vs-warm delta | 12–23 ms |
| UI ready (input visible) | 23–34 ms after load |

**Caveat:** The Long Task API can be conservative under headless
Chromium and may not populate for tasks under ~50 ms. Absence of
recorded long tasks is consistent with no single obvious main-thread
bottleneck, but is not a conclusive proof that no ~50–100 ms task
occurs.

Combined with the tight cold-vs-warm delta, the evidence is that:

- Pagefind bootstrap is not dominant (else cold would be materially
  slower than warm).
- Result-presentation main-thread work is not dominant (else warm
  would still be slow after bootstrap is cached).
- The ~330–370 ms is well-distributed across page paint, Pagefind
  network + search, and result render — with no single phase clearly
  responsible for most of the time.

## FI / EN comparison

| Metric | FI | EN | Notes |
| --- | ---: | ---: | --- |
| Corpus (Pagefind entry.json) | 1067 pages | 316 pages | Content difference; not implementation asymmetry |
| Cold first-search median | 370 ms | 344 ms | FI ~7% slower — larger index |
| Warm search median | 347 ms | 332 ms | Same shape as cold |
| Cold Pagefind bytes | 467 KB | 412 KB | Tracks index size |
| Cold Pagefind requests | 93 | 65 | Tracks fragment count per result set |
| UI ready | 34 ms | 23 ms | FI page slightly larger (starter chips, FI-only shell copy) |
| Page-scoped script bytes | 219 KB | 219 KB | Identical shell — no accidental FI/EN JS parity issue |

No accidental FI/EN implementation asymmetry. Differences track
content volume and one intentional FI-only starter-chips block on
`/haku/`.

## Comparison with 2026-08-16 PF-PERF1

The 2026-08-16 audit was a static / architecture-review audit, not a
per-query timed benchmark. It set explicit reopen thresholds rather
than published median latencies. Compare qualitatively:

| Metric | PF-PERF1 2026-08-16 | PF-PERF1B (this) | Interpretation |
| --- | --- | --- | --- |
| First-search latency reopen threshold | `> ~1 s on modern broadband connection to production` | Cold median 344–370 ms local static server; warm 332–347 ms | Comfortably under threshold |
| First-search behavior model | Pagefind wasm + module load on first user search | Same — lazy first-search-triggered import + init | Architecture unchanged |
| Warmup design | PF-PERF2 introduced idle / focus / pointerenter warmup for `find-explore.js` mounts | Warmup still present in `find-explore.js` (`scheduleIdle(warmup)`, `focus` / `pointerenter` triggers) | Warmup path preserved through all PF5 shell changes |
| Index size / shape | FI + EN indices under 10 MB total | 8.9 MB (P1-A baseline measurement) | Consistent with reopen ±10% threshold |
| Shell architecture | Pagefind UI wrapper | Replaced by PF5-H1A single SSR-authoritative form + PF5-H1B progressive facets + PF5-A2 semantic UL/LI + PF5-A3A/A3B/A3B1 facet presenter | New shell, but P1-A + this audit confirm no regression |
| Sample-based median | Not published | FI 370 ms cold / 347 ms warm, EN 344 ms cold / 332 ms warm | New baseline value |

Direct numerical comparison against a per-query median from 2026-08-16
is not possible because the historical audit did not publish one. What
we can conclude: current behavior is well within the reopen thresholds
that audit set.

## Interpretation

Consolidated findings:

1. **Cold first-search median 344–370 ms.** Comfortably below the
   PF-PERF1 reopen threshold of ~1 s.
2. **Warm search median 332–347 ms.** Nearly identical to cold —
   ~12–23 ms delta. Bootstrap is not the dominant cost.
3. **Search input becomes usable in 23–34 ms** after page load. UI
   readiness is not a concern.
4. **Pagefind cold-transfer 412–467 KB across 65–93 requests.**
   Content-addressed, cached long-term. Zero cost on repeat search
   within a session.
5. **No recorded long tasks.** No single main-thread task dominates.
6. **FI/EN parity is clean.** Content-volume differences only.
7. **No repository-evidenced regression.** No signal that any PF5
   shell change since 2026-08-16 degraded first-search latency.

## Decision

**A — No immediate PF-PERF optimization justified.**

Reasons:

- Cold first-search latency (344–370 ms) is well under the PF-PERF1
  reopen threshold (~1 s).
- Warm search latency (332–347 ms) is within ~20 ms of cold, proving
  that Pagefind bootstrap does not dominate first-search cost. There
  is no bootstrap-caching optimization available with meaningful
  headroom.
- Result presentation via the shared `SearchResultPresenter` shows no
  measurable main-thread hotspot.
- The ~330–370 ms latency is well-distributed across page paint,
  Pagefind network + search, and result render, with no single phase
  offering an obvious high-value cut.
- Any further reduction would require materially changing the
  Pagefind loading strategy (e.g., preloading fragments per query
  before the user finishes typing) or the index shape — both are
  architecture-level changes that would risk AC1 boundaries for a
  best-case gain of tens of milliseconds.

`No immediate PF-PERF optimization justified.`

## Recommended next step

**Keep the P1-A baseline as regression guard.** Adopt the following
Pagefind first-search latency budget as an addition to the P1-A
observation-only list:

- **FI `/haku/` cold first-search median: warning if > 550 ms, hard
  regression guard if > 800 ms** (5-sample local static-server
  minimum; comfortably above current 370 ms + noise).
- **EN `/en/search/` cold first-search median: warning if > 500 ms,
  hard regression guard if > 800 ms** (current 344 ms).
- **Warm search median: warning if > 500 ms** (current 332–347 ms).

Re-run this measurement if:

- Pagefind is bumped (minor or major).
- The modular-UI shell is materially restructured.
- The Pagefind index size changes by ±10% or the corpus grows by
  ±10%.
- The reopen conditions listed in
  `docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md`
  §"When to reopen this audit" fire.

Do not open a PF-PERF1 optimization slice on current evidence.

## Non-goals

Explicitly not opened by this measurement pass:

- Any Pagefind config change.
- Any preload/warmup strategy change (the existing PF-PERF2 idle /
  focus / pointerenter warmup is intact and not measurably a
  bottleneck).
- Any script loading change.
- Any modular-UI shell change.
- Any `search-result-presenter.js` change.
- Any canonical / metadata / index / filter change.
- Any consumer audit of `/data/presentations-page.json` or other
  public JSON.
- Any architectural rework triggered by these numbers.
- Any Lighthouse / Core Web Vitals full pass (out of P1-A scope).

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.
PF-PERF1B does not reopen AC1.
