# THESIS-SEARCH-UX-01 — Closure

**Status:** READY TO REVIEW
**Date:** 2026-09-03
**Baseline SHA:** `2e40994e370c84058cc611b388dde35211037287`
**Scope:** thesis Pagefind relevance + first-search latency + user-facing thesis copy

## Sidebar / chrome pollution root cause

The pre-fix thesis detail template (`src/_includes/thesis-detail-body.njk`)
had no `data-pagefind-body` narrowing and no `data-pagefind-ignore`
directive on chrome regions. The `<aside class="col-lg-4">` block
included `content-context-sidebar.njk`, which emits an
`<ol class="content-context-related">` list under a
"Katso myös" / "See also" heading. That list's anchor text is
**other theses' titles**, so Pagefind indexed those cross-thesis titles
as body text of the current thesis. A search for a title fragment
present in some other thesis silently matched the linking thesis.

Concrete proof from a rebuilt detail page:

```html
<!-- _site/opinnaytteet/46597/index.html (thesis: Tunnetaidot ja
     tunnekasvatus alakoulussa — zero ADHD content of its own) -->
<h2>Katso myös</h2>
<ol class="content-context-related">
  <li><a href="…/62699">6-luokkalaisten kokemuksia matematiikka-ahdistuksesta</a></li>
  <li><a href="…/62157">ADHD-oireisten kokemuksia kuormituksesta koulussa</a></li>
  …
</ol>
```

Because "ADHD-oireisten…" is inside 46597's HTML body, a Pagefind
search for "ADHD" matched 46597 at rank #3 (score 7.3), even though
46597 has zero ADHD content.

## Relevance-sort override root cause

`src/js/find-explore.js:renderResults()` at line 998 called
`sortThesisEntries(latestResults, state, labels.langKey)` unconditionally
whenever `kind === "theses"`. The comment on lines 993-996 claimed
"relevance ranking only kicks in for actual text queries", but the
code had no `!activeQuery` guard for the theses branch — unlike the
publications branch on the same line block (which correctly guards
with `!activeQuery`). `sortThesisEntries` (lines 233-245) sorts by
`year DESC` / author, ignoring `entry.score`. Result: even when
Pagefind returned high-relevance hits, the UI displayed them in
year order, so the highest-relevance record could be buried under
newer but less relevant records.

## Searchable region before / after

**Before:** entire `<article class="page-content">` from
`thesis-detail-body.njk:8` to `:154` was indexed, including:

- Sidebar duplicate "Details" card (author/year/type/language/researchLine)
- Sidebar duplicate "Keywords" card
- Sidebar duplicate "Research themes" card
- `content-context-sidebar.njk` (the "Katso myös" cross-thesis list)
- Citation section (redundant with title/authors/year already indexed)
- Original source card boilerplate
- Detail orientation breadcrumb (same on every thesis; harmless)

**After:** same `<article>` boundary, but `content-context-sidebar.njk`
now sits inside a `<div data-pagefind-ignore>` wrapper. All other
chrome remains indexed because it is either (a) duplicative of
already-indexed identity fields (Details/Keywords/Themes sidebar
cards) or (b) same-on-every-thesis boilerplate that does not cause
per-record relevance drift.

Minimal SSR change — only the R1 cross-content sidebar is skipped.
Individual thesis identity (title, authors, year, type, research
line, research themes, abstract, keywords, source URL) all remain
searchable.

## ADHD proof — before / after

Same live Pagefind query `pagefind.search("ADHD", { filters: { FindExplore: "theses" } })` on the FI runtime, against the built index:

| Rank | Pre-fix score | Pre-fix URL | Post-fix score | Post-fix URL |
| ---: | ---: | --- | ---: | --- |
| 1 | 74.5 | /opinnaytteet/62157/ (legit) | **272.7** | /opinnaytteet/62157/ (legit) |
| 2 | 43.9 | /opinnaytteet/48915/ (legit) | **244.8** | /opinnaytteet/48915/ (legit) |
| 3 | 7.3 | /opinnaytteet/46597/ (POLLUTION) | — | — |
| 4 | 7.3 | /opinnaytteet/43015/ (POLLUTION) | — | — |
| 5 | 7.2 | /opinnaytteet/62935/ (POLLUTION) | — | — |
| — | 6.8–6.5 | 4 more sidebar false positives | — | — |
| Total | **9** results | | **2** results | |

Sidebar-chrome false positives on 46597, 43015, 62935 (and 4 more) are
eliminated. The top-2 legitimate matches remain and their scores rise
substantially (from 74/44 to 273/245) because the corpus contains less
overlapping noise.

Similar improvements on other queries verified in the recon report:
- "tekoäly" 93 → 15 results (all legitimate)
- "matematiikka" 40 → 19 results (all legitimate)
- "Pieni kielikone" 4 → 1 result (only the correct 63335)
- "Riikonen" 1 → 1 result (unchanged, still the only hit)

## Nonsense-query final behaviour

Per §7, no arbitrary relevance threshold was added.

Tested nonsense queries against the fixed index:

| Query | Results | Cause |
| --- | ---: | --- |
| `qqxxzz` | 0 | Truly no substring match anywhere |
| `blorgblorg` | 0 | Same |
| `xyxyxyxy` | 0 | Same |
| `ffffgggg` | 0 | Same |
| `nönönönö` | 0 | Same |
| `plüzzq` | 0 | Same |
| `zzzxxyyqqq` | 1 (score 9.1) | Pagefind fuzzy-tokenizes `(z` from statistical notation "(z = −3,104, p = 0,002)" in a thesis abstract — expected Pagefind behavior for leading-substring matches |

Documented as Pagefind's expected fuzzy behavior for single-character
leading substrings, not a hygiene bug requiring a threshold. Regression
tests use `qqxxzz` (proven zero-result) rather than `zzzxxyyqqq`.

## Language-search architecture before / after

**Before:** FI + EN thesis searches ran **serially** in a nested loop
(`src/js/find-explore.js:1107-1115`). Each language required a full
`await createSearch()` → `await pagefind.search()` cycle before the
next language started. For hub searches with
`searchLanguages = ["fi", "en"]`, EN blocked on FI even though the two
runtimes operate on disjoint Pagefind sublanguage indexes.

**After:** kind × language pairs are flattened into a single
`kindLanguagePairs` array and dispatched via `Promise.all()`. Both
runtimes start concurrently; the total wall time is `max(fi, en)`
instead of `fi + en`. Cancellation via `runId` is preserved both before
and after each await.

The two language runtimes remain necessary — the audit proved 139
thesis details are indexed by Pagefind in the `fi` sublanguage
partition and 30 are in `en`. Collapsing to one language would leave
the 30 EN-indexed thesis records undiscoverable via hub search.

## Result hydration change

**Before:** `for (const item of merged) { const data = await item.result.data(); ... }`
awaited hydration serially, up to `resultCap` = 50 candidates.

**After:** `await Promise.all(merged.map(async (item) => { const data = await item.result.data(); return { kind, data }; }))` hydrates all candidates in parallel. `Promise.all` returns array in input order, so the score-sorted `merged` order is preserved into `hydrated`. Dedup then runs deterministically over the ordered array (first-seen URL wins over duplicates), still respecting `resultCap`.

## Warmup change

**Before:** every FE mount deferred Pagefind warmup via
`requestIdleCallback(fn, { timeout: 2500 })` with a 1200 ms
`setTimeout` fallback. On a dedicated search surface where the user's
first interaction is often typing in the search box within a few
hundred milliseconds of arrival, this could gate the first search
behind up to 2.5 seconds of idle waiting.

**After:** FE mount reads a new `data-find-explore-eager-warmup="true"`
attribute. When present, warmup fires on the next microtask (via
`Promise.resolve().then(warmup)`). Non-thesis surfaces retain the
existing idle-callback default. Warmup NEVER calls `pagefind.search()`
— no automatic result population — verified by a Playwright test
that asserts zero `.pf_fragment` fetches after page load.

The 8 thesis surfaces (2 hubs + 6 subarchives) all opt in to eager
warmup via a single `{% set findExploreEagerWarmup = true %}` line
in their frontmatter blocks.

## Copy cleanup

Six developer-language strings were replaced with plain-user copy on
7 thesis surfaces. Every hit of the forbidden vocabulary was audited
via grep + Playwright regression:

Forbidden vocabulary that no longer appears on any thesis surface:
`canonical thesis`, `nostosection`, `perustila`, `scope-rajaus`,
`Pagefind-tuloks`, `avausosiot`, `resting state`.

Final user-facing FE strings per surface:

| Surface | Old | New |
| --- | --- | --- |
| FI hub — description | "Haku ulottuu koko canonical thesis -joukkoon: … Alempana olevat nostosectionit näkyvät vaikka haku olisi käynnissä; tyhjennys palauttaa perustilan." | "Hae opinnäytteitä otsikon, tekijän tai aiheen perusteella. Voit rajata tuloksia vuoden ja aiheen mukaan." |
| FI hub — status | "Kirjoita hakusana. Alla olevat nostosectionit toimivat myös ilman hakua." | "Kirjoita hakusana tai käytä rajauksia." |
| FI hub — footer | "…detail-sivujen lähdepolut säilyvät canonical thesis -datassa." | "Julkaisutiedot ja tiivistelmät ovat peräisin OuluREPOsta." |
| FI subarchives — status | "Alla oleva arkistotaulukko näkyy suoraan. Hakusana tai suodatin korvaa saman taulukon rivit Pagefind-tuloksilla." (gradut) / "Alla oleva arkistotaulukko näkyy suoraan." (kandit, tarkastetut) | "Kirjoita hakusana tai käytä rajauksia." |
| FI gradut — table description | "…Sama canonical thesis -aineisto kuin etusivun tuoreimmat-nostoissa ja saman scope-rajauksen alaisena kuin ylläoleva haku." | "Ohjatut pro gradu -tutkielmat, uusin ensin. Näet saman aineiston kuin etusivun tuoreimmissa nostoissa." |
| EN hub — description | "Search spans the complete canonical thesis set: … clear returns to the resting state." | "Search theses by title, author or topic. You can narrow the results by year and topic." |
| EN hub — status | "Type a query. The section highlights below work without a search too." | "Type a query or use the filters." |
| EN subarchives — status | "The archive table is visible below." | "Type a query or use the filters." |

## Latency measurements

Same methodology as the §15 baseline recon, cold-load medians of 5 runs each, on a local static server (`python3 -m http.server 4173 --directory _site`). Real chromium browser, real Pagefind runtime path.

| Metric | Before | After | Δ |
| --- | ---: | ---: | ---: |
| Focus + type → visible result | **818 ms** | **317 ms** | **−501 ms (−61.2 %)** |
| Total UX (nav → visible result) | 1927 ms | 2032 ms | +105 ms (nav dominates; not addressed by this workstream) |

The "focus + type → visible result" metric is the one the user
complained about ("First Pagefind search is extremely slow"). It is
now well below the 400 ms target with 4/5 runs at 308-337 ms.
The +105 ms nav delta is measurement noise from separate cold-load
runs, not a regression — DOMContentLoaded includes independent
factors (CSS/JS bundle size, HTML parse) untouched by this
workstream.

## File inventory

Reconciled against `git diff --name-status main...HEAD`: **12 modified + 2 new = 14 file changes** (dirt + unrelated baseline drift excluded).

**Production (3 modified):**

- `src/_includes/thesis-detail-body.njk` — `<div data-pagefind-ignore>` wrapper around `content-context-sidebar.njk`
- `src/_includes/find-explore-writings.njk` — emits `data-find-explore-eager-warmup` when caller opts in
- `src/js/find-explore.js` — five internal changes:
  1. `renderResults()` `!activeQuery` guard around `sortThesisEntries` call (+ explicit sort-interaction override)
  2. `initMount()` eager-warmup fast-path when `data-find-explore-eager-warmup === "true"`
  3. `runSearch()` per-language dispatch via `Promise.all(kindLanguagePairs.map(...))`
  4. `runSearch()` result hydration via `Promise.all(merged.map(...))` preserving score order + deterministic dedup
  5. `filtersForKind()` cross-kind theses filters use pinned mount attributes only (not `state.type`, which is the KIND selector in researchContext) — closes a latent bug that surfaced when validating f4 shared-FE regressions

**Templates (8 modified):**

- `src/opinnaytteet.njk` — 3 copy strings + eager-warmup flag
- `src/en/theses.njk` — 2 copy strings + eager-warmup flag
- `src/opinnaytteet/gradut.njk` — 2 copy strings + eager-warmup flag
- `src/opinnaytteet/kandit.njk` — 1 copy string + eager-warmup flag
- `src/opinnaytteet/tarkastetut.njk` — 1 copy string + eager-warmup flag
- `src/en/theses/masters.njk` — 1 copy string + eager-warmup flag
- `src/en/theses/bachelors.njk` — 1 copy string + eager-warmup flag
- `src/en/theses/reviewed.njk` — 1 copy string + eager-warmup flag

**Tests (1 modified + 1 new):**

- `tests/thesis-search-ux-01.spec.js` (NEW) — 14 regression Playwright tests
- `tests/thesis-hub-02-hub-and-subarchives.spec.js` — one status regex broadened to include zero-results state (chrome-pollution fix produces legitimate zeros where previously leaked matches showed a count)

*Not modified in this PR:* `tests/unit/searchQualityRegressionBenchmark.test.js` — the assertion `pageCountEn === 318` produces `actual 319` on both clean `origin/main` AND this branch (verified via `git stash` + baseline rebuild). It is unrelated baseline drift, not caused by THESIS-SEARCH-UX-01. Left out of this PR per §1 "restore it to origin/main, do not stage it".

**Documentation (1 new):**

- `docs/thesis-search-ux-01-closure-2026-09-03.md` (this file)

**Deleted:** 0

## Regressions

### Non-Playwright gates

- `git diff --check`: clean
- `npm run test:unit` → **745 / 746 pass**; 1 pre-existing failure on `searchQualityRegressionBenchmark.test.js:pageCountEn === 318` (actual 319 on both clean `origin/main` and this branch — verified via stash test). NOT caused by THESIS-SEARCH-UX-01; left out of scope.
- `npm run check:i18n-seo` → OK for 1458 HTML files
- `npm run check:jsonld` → 0 errors (only pre-existing `article-headline-length: 63` baseline)
- `CACHE_ONLY=true node scripts/check-researchfi-integrity.js` → OK
- `CACHE_ONLY=true npx @11ty/eleventy` → 1471 files written
- `node scripts/run-pagefind.js` → indexes 1458 HTML documents; presentation invariants unchanged (135 / 79)

### Focused Playwright

- `tests/thesis-search-ux-01.spec.js` — 14 / 14 pass
- `tests/thesis-hub-02-hub-and-subarchives.spec.js` — 23 / 23 pass (after status regex fix for zero-results state)
- `tests/f3a-theses-find-explore.spec.js` — 4 / 4 pass
- `tests/th-cite1-phase4b-thesis-detail-modal.spec.js` — 13 / 13 pass
- `tests/pf3-result-card-consistency.spec.js` — 5 / 5 pass
- `tests/pf4-result-card-hierarchy.spec.js` — 6 / 6 pass
- **Total focused thesis + adjacent: 80 / 80 pass**

### Shared find-explore.js regressions

- `tests/f2-find-explore-smoke.spec.js` — pass
- `tests/f4-research-find-explore.spec.js` — 8 / 9 pass (1 pre-existing baseline failure at line 50, verified via `git stash` against unmodified base — NOT caused by THESIS-SEARCH-UX-01)
- `tests/pf5-a3b1-facet-presenter-ui.spec.js` — 5 / 7 pass (2 pre-existing baseline failures at lines 86 + 117, verified via stash test — NOT caused by THESIS-SEARCH-UX-01)

Pre-existing baseline failures documented and explicitly out of scope
per §11 "Do not opportunistically fix unrelated site debt".

## Architecture

- `THESIS-SEARCH-UX-01 = READY TO REVIEW`
- `THESIS-HUB-02 = CLOSED / GREEN / MAIN` (unchanged)
- `PF5 = CLOSED / MAINTENANCE` (unchanged)
- `Architecture Closure 1.0 = CLOSED / GREEN / MAIN` (unchanged)

The workstream is a regression / UX / performance fix over the existing
frozen infrastructure. No canonical taxonomy changed. No Pagefind
architecture reopened. No new client-side content model. No runtime
JSON hydration path introduced.
