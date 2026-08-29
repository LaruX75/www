# P1-A Site Performance Baseline 1.0

Date: 2026-08-29
Status: `BASELINE ESTABLISHED / AUDIT ONLY` — no production code changed.

Records the first repository-evidenced site performance baseline after
Architecture Closure 1.0 (`architecture-closure-1-0` tag on `main`
`41b88d25`). Establishes regression guardrails for the current
post-closure architecture. Does not reopen AC1.

## Repository truth

- Worktree: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Branch: `audit/p1a-site-performance-baseline` (created from `origin/main` for this audit)
- HEAD (branch base): `41b88d25e9b59023eabf65f5b502b9f631ef207f`
- `origin/main`: `41b88d25e9b59023eabf65f5b502b9f631ef207f`
- Ahead/behind: 0/0 (audit branch is a snapshot; only this doc will be added)
- `git status`: clean apart from `.cache/api-fallback/*` auto-generated caches (preserved; excluded from commit).

## Environment and methodology

- Local machine: macOS `Darwin 25.4.0`, `zsh`.
- Node/Playwright as installed in the repo (`node_modules/playwright`).
- Build: `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og` (repo's normal cached/offline-safe production-like build). Wall time captured with `time`.
- Static payload measurements: computed directly from `_site/**` after full build (raw bytes, `gzip -c9` bytes, opening-tag count via regex, script/link counts).
- Runtime measurements: headless Chromium via Playwright against a local `python3 -m http.server 4173` serving `_site/`, sample size 5 per interaction metric, median + min/max reported. Browser context reused across route measurements so "load ms" reflects a warm HTTP cache — not a cold-cache first-visit number. Cold-cache assumptions are noted where relevant.
- Pagefind latency measurements attempted with the same script but the selector for the current modular-UI search input did not resolve in this run (0 samples for both FI and EN Pagefind first/second-search latency). The existing PF-PERF1/PF-PERF2 audits stand as the current Pagefind-latency evidence baseline; a dedicated measurement of the modular-UI shell is deferred (see §Findings E and §Recommended next performance slice).

Not measured deliberately:

- CDN-cached third-party assets (`chart.js`, `popperjs`) as a first-visit cost, since caching behavior is out of the repository's control.
- LCP / CLS / INP / TTI via Lighthouse — not established repo tooling; would require ad-hoc install and inflate scope.

## Build baseline

- Command: `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og`
- Result: PASS. `[researchfi-integrity] OK: 56 arkistojulkaisua`. `[seo-dashboard] OK | pages=1458 missingDescription=0 missingOgImage=0`.
- **Wall time: 238s** (3m58s, `user 224.55s, system 16.87s`).
- Eleventy: `Copied 273 Wrote 1471 files`.
- Pagefind postbuild output: `htmlDocumentsIndexed: 1458`, `presentationScopeLocalDocuments: 139`, `presentationScopeCustomRecords: 79`, `presentationCanonicalTotal: 218`, `presentationLocalLandingTotal: 138`, `presentationExternalLandingTotal: 80`.
- Pagefind index: **8.9 MB** (1513 files under `_site/pagefind/`). `pagefind-entry.json`: FI page count = 1067, EN page count = 316.
- Generated `_site` total: **187 MB** (including images, feeds, JSON projections, per-item HTML). Dominated by static image assets which are out of P1-A scope.

Warnings/errors: none (offline network fetches expected and cached; not a site issue).

## Route matrix

Routes selected match the current `main` deployed shape.

| Surface | Route |
| --- | --- |
| FI Home | `/` |
| EN Home | `/en/` |
| FI Publications archive | `/julkaisut/` |
| EN Publications archive | `/en/publications/` |
| FI Presentations archive | `/esitykset/` |
| EN Presentations archive | `/en/presentations/` |
| FI Media archive | `/mediassa/` |
| EN Media archive | `/en/media/` |
| FI global search | `/haku/` |
| EN global search | `/en/search/` |
| FI Research | `/tutkimus/` |
| EN Research | `/en/research/` |
| Publication detail | `/julkaisut/rf-rf-10-1080-09523980701847131/` |
| Presentation detail | `/presentations/generation-ai-yleisesitys-sovellukset-2026/` |
| Media detail | `/mediassa/2026/03/29/tekoaly-tekee-petoksen-koulutehtavissa-helpoksi/` |

## HTML / DOM baseline

Static-file measurement of the built HTML for each surface. `Cards` counts SSR `article.presentation-archive-card` elements.

| Surface | HTML raw KB | HTML gzip KB | Opening-tag count | Elements with `hidden` | Script tags | CSS links | Presentation cards |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| FI Home | 144.1 | 22.4 | 1308 | 1 | 13 | 14 | 0 |
| EN Home | 145.8 | 21.0 | 1333 | 1 | 14 | 13 | 0 |
| FI Publications | 347.2 | 44.0 | 1838 | 1 | 16 | 14 | 0 |
| EN Publications | 211.7 | 30.9 | 1572 | 1 | 16 | 14 | 0 |
| FI Presentations | **1393.0** | **135.6** | **11504** | 2 | 18 | 14 | **218** |
| EN Presentations | **1147.3** | **113.5** | **9532** | 2 | 17 | 13 | **218** |
| FI Media | 151.7 | 25.2 | 1390 | 1 | 18 | 14 | 0 |
| EN Media | 221.5 | 34.6 | 1752 | 1 | 13 | 12 | 0 |
| FI Search | 97.5 | 16.7 | 885 | 1 | 14 | 12 | 0 |
| EN Search | 90.3 | 15.4 | 824 | 1 | 14 | 12 | 0 |
| FI Research | 123.9 | 21.4 | 1223 | 1 | 15 | 15 | 0 |
| EN Research | 91.1 | 15.3 | 870 | 1 | 13 | 12 | 0 |
| Presentation detail | 102.8 | 17.5 | 969 | 12 | 13 | 12 | 0 |
| Publication detail | 109.7 | 18.7 | 1028 | 38 | 13 | 12 | 0 |
| Media detail | 104.3 | 17.9 | 987 | 15 | 13 | 12 | 0 |

Post-JS DOM node counts (Playwright, warm context, `document.getElementsByTagName("*").length`):

| Surface | DOM nodes post-JS |
| --- | ---: |
| FI Home | 1606 |
| EN Home | 1367 |
| FI Publications | 2192 |
| EN Publications | 1666 |
| FI Presentations | **11936** |
| EN Presentations | **9700** |
| FI Media | 1540 |
| EN Media | 1786 |
| FI Search | 2122 |
| EN Search | 1154 |
| Details (Presentation / Publication / Media) | 1267–1330 |

Presentations SSR-all-cards signature: 218 cards × ≈54 elements/card ≈ 11.8k nodes on FI, tracking with the AC1 closure record's documented trade-off. Visible cards after JS enhancement: **12** on FI and EN Presentations, matching the intended pagination.

## JavaScript baseline

Page-scoped scripts loaded per surface (repo-local `/js/*.js` only; excludes CDN `chart.js` / `popperjs`):

Home + Publications + Media + Search all pre-load the modular-UI global-search cluster:

- `/js/search-result-presenter.js` — 11 KB raw / **3 KB gz** (shared owner since PF5-G1)
- `/js/search-facet-availability.js` — 3 KB raw / **1 KB gz**
- `/js/global-search-modular-ui.js` — 43 KB raw / **10 KB gz**

Plus common site chrome:

- `/js/bootstrap.min.js`, `/js/external-media-consent.js`, `/js/site-ui.js` (36 KB raw / **9 KB gz**), `/js/a11y.js`

Archive-specific additions:

- Publications archive adds: `/js/find-explore.js` (54 KB raw / **13 KB gz**), `/js/publication-citation.js` (24 KB raw / **5 KB gz**).
- Presentations archive adds: `/js/pe-list-render.js` (2 KB gz), `/js/content-presets.js`, `/js/content-engine.js` (small), `/js/presentations-page.js` (**2 KB gz** — post-Slice-3 C1).
- Media archive adds: `/js/pe-list-render.js`, `/js/content-presets.js`, `/js/content-engine.js`. No dedicated `media-page.js`.
- Global search pages add: `/js/find-explore.js`, `/js/starter-chips.js`.
- Detail pages load only common site chrome.

Total repo JS budget on the heaviest archive page (Publications): **~46 KB gzipped** of repo-local JS. Details: **~15 KB gzipped**.

## Runtime data baseline

Runtime JSON transfer per surface (measured in Playwright as `response.body().length` summed by resource type, may include repeated resources across the reused browser context):

| Surface | JSON transferred KB (Playwright, includes repeats) | Note |
| --- | ---: | --- |
| Home / details / most archives | 116.7 | Shared: news ticker + a11y state + global chrome JSONs |
| Presentations archive (FI + EN) | **893.7** | `/data/presentations-page.json` = **795 KB raw / 118 KB gz** on the wire, plus shared ticker/etc. |
| Media archive (FI) | 224.9 | `/data/media.json` + shared |
| Search pages | 116.7 | No archive-specific JSON; Pagefind loaded on interaction |

**Only Presentations archive carries a large per-page JSON payload today**: `/data/presentations-page.json` at 795 KB raw / 118 KB gzipped. It serves as filter/state data for the archive; the Slice 3 C1 closure explicitly retained the JSON contract. After first visit, the browser HTTP cache eliminates repeat-visit transfer of this file.

## Network baseline

Playwright request counts + transferred bytes per surface (warm browser context):

| Surface | Requests | Total transferred KB | Docs | JS KB | JSON KB | Pagefind KB | Fonts KB | Images KB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| FI Home | 33 | 1720 | 1 | 214 | 117 | 7 | ~130 | rest = images/logos |
| EN Home | 32 | 1686 | 1 | 214 | 117 | 7 | ~130 | rest |
| FI Publications | 47 | 2481 | 1 | 488 | 117 | 330 | ~130 | rest |
| EN Publications | 45 | 2339 | 1 | 488 | 117 | 326 | ~130 | rest |
| FI Presentations | 39 | 3775 | 1 | 256 | 894 | 7 | ~130 | rest — thumbnails dominate |
| EN Presentations | 67 | 3886 | 1 | 252 | 894 | 7 | ~130 | rest — thumbnails dominate |
| FI Media | 50 | 1831 | 1 | 247 | 225 | 7 | ~130 | rest |
| EN Media | 48 | 1746 | 1 | 214 | 117 | 7 | ~130 | rest |
| FI Search | 111 | 1756 | 1 | 214 | 117 | 394 | ~130 | rest |
| EN Search | 83 | 1704 | 1 | 214 | 117 | 349 | ~130 | rest |
| Details (Presentation / Publication / Media) | 31–32 | 1627–1635 | 1 | 214 | 117 | 7 | ~130 | rest |

Notes:

- The JS column includes `chart.js` from CDN (~200 KB uncompressed transferred once, typically HTTP-cached). Repo-local JS is a small fraction (see §JavaScript baseline).
- On Publications and Search surfaces, Pagefind assets download eagerly: `find-explore.js` initialises Pagefind; ~330–394 KB of `.pf_meta` and language index chunks arrive on first visit. On repeat visits these cache long-term (content-addressed URLs).
- Presentations transferred-KB is dominated by thumbnail images (`/images/canva-thumbnails/*.png`), not by architecture code/data. Same for the 67 EN requests — image-heavy.
- FI Search hits 111 requests because Pagefind's fragment fetches happen on first-search interaction; this is the reason the number is highest.

## Pagefind baseline

Direct latency measurements against the modular-UI shell failed in this run (0 samples for FI and EN first/second-search latency — the measurement script's selector did not resolve on the current search page).

Reference baseline (unchanged since 2026-08-16):

- `docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md` — cold-start audit, backlog item.
- `docs/pf-perf2-first-search-latency-2026-08-16.md` + `docs/pf-perf2-enter-scroll-hotfix-closure-2026-08-16.md` — first-search latency + scroll fix.
- `docs/pagefind-search-quality-baseline-2026-08-25.md` — regression baseline for search quality, includes documented benchmark non-blockers P1 (previously-observed `__find_explore_presentations__` leak, since resolved by PR #153) and P2 (EN media title exact-match discoverability).

Pagefind index sizes measured today:

- `_site/pagefind/`: **8.9 MB** total, 1513 files.
- FI Pagefind reports **1067 indexed pages**; EN reports **316**.

## Interaction baseline

### Presentations archive filter (measured)

Filter latency from search-input event to visible-card recount, on `/esitykset/`, 5 samples:

| Metric | Value |
| --- | ---: |
| Samples | 5 |
| **Median** | **11 ms** |
| Min | 7 ms |
| Max | 23 ms |

This is the post-Slice-3 C1 pattern: JS toggles the `hidden` attribute on 218 SSR-rendered card DOM nodes; no innerHTML rebuild, no template clone, no DOMParser. **The archive filter is essentially instant.**

### Other interactions

- **Publications filter/search**: not separately measured in this run; the existing Publications F3B closure regression tests + PF5-A2/A3 closures cover UX correctness. Filter interaction on the `find-explore.js` mount is bounded by Pagefind first-search latency (measurement gap noted above).
- **Media filter**: measurement gap (single Playwright script did not extend to Media inline filter chips); Media archive is small (73 items) and its inline `renderCard` filter latency is not expected to be a user-facing issue based on the M2 closure's inspection.
- **Global Find & Explore interaction**: measurement gap (see Pagefind baseline).

## FI / EN comparison

FI generally carries slightly more content and correspondingly higher payload:

- Presentations: FI 1393 KB / 135.6 KB gz vs EN 1147 KB / 113.5 KB gz. Difference driven by FI-locale strings (all cards' localized labels + `cardReturnTo`) and FI-only starter-chips block on `/esitykset/`. Expected content difference; not accidental.
- Media: EN Media archive is heavier (34.6 KB gz) than FI (25.2 KB gz), which is surprising at first — because EN renders all 73 items SSR while FI SSRs an opening subset and hydrates via ContentEngine. This is a documented per-domain UX choice (M2 closure §5). Not accidental.
- Publications: FI archive is heavier (44.0 KB gz vs EN 30.9 KB gz) because it carries the FI-locale publication citations rendered by `publication-citation.js`. Expected content difference.

No accidental implementation asymmetry surfaced between FI and EN in this baseline — the differences track content volume and documented per-domain UX choices.

## Findings classification

| # | Finding | Evidence | Class | User impact | Complexity | Action |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Presentations archive SSR = 218 cards, 11936 DOM nodes, 135.6 KB gzipped HTML | Route matrix, DOM count | **C — Accepted trade-off** | Neutral (median filter 11 ms) | N/A — architecture closure decision | None; documented in `architecture-closure-1-0-closure-2026-08-29.md` and Slice 3 C1 closure |
| 2 | `/data/presentations-page.json` = 795 KB raw / 118 KB gzipped, ~893 KB in Playwright transfer (includes shared JSONs) | Runtime data baseline | **E — needs consumer/suitability audit first** | Small on cold visit; zero on warm cache | Medium — 6+ non-browser consumers on record | Deferred; consumer audit required before any schema change |
| 3 | Publications archive Pagefind pre-load = ~330 KB transferred on first visit | Network baseline | **C — Accepted trade-off** | Small on cold visit; zero on warm | N/A — Publications F&E is the primary discovery on that page | None; expected by F3B closure |
| 4 | Home + all non-detail pages pre-load global-search modular-UI JS (~10–14 KB gz combined) | JS baseline | **C — Accepted trade-off** | Small (~14 KB gz over the site) | N/A — required for navbar search | None; PF5-A2/A3 documented owner |
| 5 | Presentations archive filter interaction = 11 ms median | Interaction baseline | **C — Accepted trade-off** proven optimal | Positive — instant filter | N/A | None; regression guard proposed below |
| 6 | Pagefind first-search latency for the current modular-UI shell not directly re-measured in this baseline | Pagefind baseline | **E — measurement gap** | Unknown (existing PF-PERF1/PF-PERF2 audits are the reference) | Small — measurement task | Recommend PF-PERF1 re-measurement as the follow-up; **do not implement optimization** without evidence |
| 7 | FI Presentations image transfer (~2.4 MB thumbnails) dominates network total | Network baseline | **D — low-value optional polish** | Small on repeat visit (browser cache); only noticeable on cold mobile | Medium (asset pipeline) | Not opened by this baseline |
| 8 | Home total transfer 1720 KB warm / EN Home 1686 KB warm | Network baseline | **D — low-value optional polish** | Dominated by CDN-cached `chart.js`; no repo-local optimization obvious | N/A | Not opened |
| 9 | No repository-evidenced regression identified across measured surfaces | All measurements | **A — none** | N/A | N/A | None |

## Proposed performance budgets

Baseline guardrails derived from the current healthy measurements. Purpose is regression detection, not aspirational tightening.

### HTML gzip per major surface

| Surface | Current gzip KB | Proposed budget KB | Kind |
| --- | ---: | ---: | --- |
| Home (FI/EN) | 21–22 | ≤ 30 | Warning threshold |
| Publications archive (FI) | 44.0 | ≤ 60 | Warning threshold |
| Publications archive (EN) | 30.9 | ≤ 45 | Warning threshold |
| Presentations archive (FI) | 135.6 | ≤ 155 | **Hard regression guard** (SSR-all-cards intentional) |
| Presentations archive (EN) | 113.5 | ≤ 135 | **Hard regression guard** |
| Media archive (FI/EN) | 25–35 | ≤ 50 | Warning threshold |
| Global search shell (FI/EN) | 15–17 | ≤ 25 | Warning threshold |
| Any detail page | 17–19 | ≤ 30 | Warning threshold |

### DOM nodes post-JS

| Surface | Current | Proposed budget | Kind |
| --- | ---: | ---: | --- |
| Presentations archive (FI) | 11936 | ≤ 13500 | **Hard regression guard** (218 cards × ~54 elements, growth tracks canonical count) |
| Presentations archive (EN) | 9700 | ≤ 11000 | **Hard regression guard** |
| Publications archive (FI) | 2192 | ≤ 3000 | Warning threshold |
| Any detail | 1330 | ≤ 1600 | Warning threshold |
| Home | 1606 | ≤ 2000 | Warning threshold |

### Initial JS

- Repo-local JS on the heaviest archive page (Publications): ~46 KB gzipped. Proposed **warning threshold: ≤ 60 KB gzipped**.
- Details / Home / Media: ~15–20 KB gzipped. Proposed **warning threshold: ≤ 25 KB gzipped**.

### Runtime JSON

- Presentations archive `/data/presentations-page.json`: 118 KB gzipped. Proposed **hard regression guard: ≤ 140 KB gzipped**. Growth beyond this signals model bloat.
- Other archives: JSON payload is small or absent. Proposed **observation-only**.

### Initial request count

- Presentations archive: 39 requests (warm). Proposed **observation-only** (thumbnail-image dominated).
- Global search cold: 111 requests. Proposed **observation-only** (Pagefind fragment fetches are content-addressed and cacheable).
- Details / Home: 31–33 requests. Proposed **warning threshold: ≤ 40**.

### Pagefind first-search latency

- Not re-measured in this run. Existing PF-PERF2 reference stands.
- Proposed **observation-only** until a re-measurement pass (see recommended next slice).

### Warm second-search latency

- Not re-measured. Existing PF-PERF2 reference stands. Observation-only pending re-measurement.

### Build time

- Current: 238 s wall / 224 s user for `npm run build:no-og` with `CACHE_ONLY=true`.
- Proposed **warning threshold: ≤ 300 s**. Beyond that, investigate. Historical build-hang was resolved by PR #152 memoization; further data-loader growth should trigger review.

### Presentations archive filter interaction

- Current: 11 ms median. Proposed **hard regression guard: ≤ 50 ms median** on 5-sample runs against the local `python3 -m http.server` shell. Growth beyond this signals a fundamental shift in the visibility-toggle path.

## Recommended next performance slice

**PF-PERF1 first-search cold latency re-measurement — measurement-only.**

Reason:

- Every other measured surface is inside a healthy budget. Presentations filter is essentially instant (11 ms median). Static and network payloads track the documented AC1 architecture trade-offs. No repository-evidenced regression exists to justify an implementation slice today.
- The one measured gap is Pagefind first-search cold latency on the current modular-UI shell. The 2026-08-16 PF-PERF1 audit exists but predates the entire PF5-G1/H1A/H1B/A2/A3A/A3B/A3B1 shell evolution — its numbers do not reflect current `main`. A dedicated re-measurement pass would produce the data required to decide whether Pagefind bootstrap needs optimization or whether current behavior is already fast enough post-PF5.
- This is a bounded audit-only follow-up (write a small selector-correct Playwright harness, run 10–20 samples cold + warm on `/haku/` and `/en/search/`, compare against PF-PERF2 reference numbers). It does not touch production code, it does not reopen AC1, and it produces the evidence a real optimization slice would need.

If the re-measurement shows Pagefind cold latency is well inside a reasonable budget (say, < 500 ms median first search on typical connections), the honest recommendation from that follow-up would be:

`No immediate optimization justified; keep baseline as regression guard.`

If not, the follow-up would define a bounded PF-PERF1 optimization package.

Do not skip the re-measurement in favor of pre-guessing the optimization.

## Non-goals / deferred items

Explicitly not opened by this baseline. Each is documented elsewhere and is not a repo-evidenced regression:

- **`content-visibility: auto` on the Presentations 218-card grid** — noted in the Slice 3 C1 closure debt list as optional paint polish. Would only matter for scroll performance on cold render; not indicated by current filter latency.
- **`/data/presentations-page.json` schema reduction** — requires the deferred consumer audit; 6+ non-browser consumers on record.
- **PF5-G2 vs `presentationPagefind.js` injection reconciliation** — hygiene, non-blocker.
- **Media list-render consolidation** — bounded out by M2 closure.
- **Home page total transfer** — dominated by CDN `chart.js`; no repo-local architecture lever.
- **Image / thumbnail optimization** — Presentations network dominated by canva-thumbnail PNGs; is a content-pipeline concern outside AC1.
- **Lighthouse / Core Web Vitals full pass** — no established repo tooling; would require ad-hoc install and is out of P1-A scope.

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. P1-A does not reopen AC1.
