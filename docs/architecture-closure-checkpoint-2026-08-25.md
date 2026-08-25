# Architecture Closure Checkpoint — Next Workstream Decision

**Mode:** AUDIT / DECISION ONLY  
**Date:** 2026-08-25  
**Baseline `origin/main` SHA:** `1d4a42def281eb5a5b7a61b4801151f51b858c18`  
**Audit branch:** `audit/architecture-closure-checkpoint`

## 0. Decision (top-of-file summary)

```
NEXT WORKSTREAM:  PF5 Global Result Parity — audit-only slice
DECISION:         REDUCE
WHY:              Roadmap gates PF5 as AUDIT FIRST. Recent Pagefind index hygiene
                  + G2 shared-presenter + H1A/H1B closures give fresh evidence
                  to answer GO / REDUCE / NO-GO cheaply. No other candidate has
                  repo-evidenced justification right now.
FIRST SLICE:      Read-only inventory of result-card variants and presenter code
                  paths across navbar Pagefind, /haku/, /en/search/, and
                  domain-specific presenters (Presentations, Media,
                  Publications, Theses, Writings). Deliver GO/REDUCE/NO-GO with
                  per-variant evidence.
EXPECTED DELETION:TBD by audit. Possible: duplicated result-card composition,
                  parallel excerpt sanitizers, redundant presenter shims. Zero
                  if audit lands on NO-GO.
INTENTIONALLY RETAINED:
                  Canonical Content v1, per-domain UX differences that are
                  intentional (media role/outlet, presentation source badge,
                  publication CSL), Pagefind attribute-based metadata contract,
                  main[data-pagefind-body] universal scoping, F&E seed queries,
                  /data/*.json public contracts.
```

## 1. Baseline

- `origin/main` at prompt creation: `1d4a42def281eb5a5b7a61b4801151f51b858c18`
- Actual `origin/main` at audit start: `1d4a42def281eb5a5b7a61b4801151f51b858c18` — matches
- Two commits since the last roadmap doc (2026-08-20) that shape this checkpoint:
  - `3003ec10` — Presentations SSR-P1 (source sections, featured, year/topic options moved to build-time)
  - `965c735b` — Pagefind index hygiene hotfix (universal `<main data-pagefind-body>`, presentation injection converted to attribute-only meta, presentation chrome ignored)
- Latest closure just landed via `1d4a42de` (docs-only): Pagefind index hygiene evidence marked CLOSED / GREEN / MAIN

## 2. Docs reviewed (authoritative)

- `docs/site-architecture-closure-roadmap-2026-08-20.md` — current operational roadmap
- `docs/presentations-ssr-p1-implementation-2026-08-25.md` — post-P1 state (JS 616→327 LOC, JSON kept for archive interactivity, deferred: FULL Pagefind, JSON removal, EN redesign)
- `docs/search-pagefind-index-hygiene-hotfix-2026-08-25.md` — post-hotfix state (universal body scope, attribute-form meta, F&E seed retained via seedText span + custom records)
- `docs/writings-legacy-runtime-audit-2026-08-11.md` and `docs/writings-architecture-audit-2026-08-11.md` — W1–W4 closure
- `docs/publications-full-pagefind-pub-cite1-closure-2026-08-17.md` and `docs/publications-archive-convergence-implementation-2026-08-20.md`
- `docs/th-cite1-phase3-ssr-archive-closure-2026-08-18.md` and `docs/theses-archive-convergence-implementation-2026-08-20.md`
- `docs/m1-media-pagefind-compatibility-audit-2026-08-15.md` and `docs/m2-media-find-explore-closure-2026-08-16.md` — critical: M2 §10 documents the very Pagefind site-wide body-gate that the index-hygiene hotfix later normalized site-wide
- `docs/pf5-g2-presentations-pagefind-projection-2026-08-24.md`, `docs/pf5-h1a-search-page-shell-simplification-2026-08-24.md`, `docs/pf5-h1b-progressive-facet-disclosure-2026-08-24.md`, `docs/pf5-g1-shared-presenter-convergence-2026-08-23.md`, `docs/pf5-g1-navbar-modular-ui-implementation-2026-08-23.md`

## 3. Current architecture map

```
canonical content (src/**/*.md + src/_data/*)
  -> Eleventy computed data (11tydata + presenters in _data)
  -> Nunjucks SSR (src/_includes/**, hub templates)
  -> Pagefind index (attribute-based meta + universal main[data-pagefind-body])
  -> Find & Explore (ContentEngine + presets) + navbar Pagefind + /haku/ + /en/search/
  -> canonical detail page or approved landing
```

Cross-cutting rules verified in place:
- `main[data-pagefind-body]` is universal (base.njk line 82) — no domain-specific body-gate skew
- `pagefindDocument.seedText` has its own `data-pagefind-body` span (base.njk line 67) — find-explore seed queries still resolve
- Publication + thesis citations flow through shared isomorphic renderer (`src/js/publication-citation.js` UMD; 640 LOC)
- Detail orientation uses shared `detail-orientation.njk` include across publications/theses/writings/presentations/media (O1 closed)

## 4. Per-domain debt table

| Domain | SSR truth | Browser JS | Runtime JSON | Pagefind | Duplicate rendering | Remaining debt |
| --- | --- | --- | --- | --- | --- | --- |
| Presentations | source sections, featured, year/topic options, first 12 archive cards | 327 LOC = archive search/filter/pagination + utils | 1 fetch `/data/presentations-page.json` | attribute-form meta + filters via hotfix; G2 preserved | none (SSR archive + JS-hydrated full set replace same container) | none justified (post-P1 is architecturally complete) |
| Media | FI hero+18 opening cards; EN 73 cards | 247 LOC INLINE in `src/fi/mediassa.njk` | 1 fetch `/data/media.json` (FI only) | full per-item meta/filter/sort (M2) | **YES** — `renderCard()` (inline) re-implements SSR card HTML (mediassa.njk 371–402 vs 212–236) | duplicate card composer + hard-coded 4-key topic aliases + FI/EN hydration asymmetry (intentional) |
| Writings | fully SSR hubs; F&E replaces same container | shared find-explore only | public `/data/writings-page.json` (no primary consumer) | site-wide + attribute-form | none | none |
| Publications | grouped SSR tables; F&E replaces rows | shared find-explore + `publication-citation.js` (isomorphic) | public `/data/publications-page.json` (no primary consumer) | FULL Pagefind (pub-cite1); site-wide | none | none |
| Theses | SSR paginated tables (20/page, build-time) | `thesis-hub-actions.js` (citation modal only) | none | site-wide + attribute-form | none | none |
| Research | shared F&E surfacing via canonical contexts | shared find-explore only | none of its own | attribute-form via base.njk | none | none |
| Global Search | SSR shell + Pagefind modular UI | `global-search-modular-ui.js` 688 LOC + `search-result-presenter.js` 208 LOC | Pagefind fragments | universal body scope, per-domain meta | to be audited — result-card variants and presenter divergence across navbar / haku / en-search / domain-F&E cards | PF5 audit output determines |

## 5. Presentations post-P1

- `src/js/presentations-page.js` = **327 LOC** (was 616 pre-P1; -289 net delete already banked)
- Retained blocks (all justified as archive interactivity):
  - utilities (escHtml, locale/labels, isExternalUrl, truncate, normalizeForMatch, toIsoDate/formatDate, landingUrl, iconFor, exactTopicMap)
  - `archiveCardHtml()` — pagination card composer
  - `renderPagination()` — dynamic page nav
  - `updateArchiveStatus()` — X-Y/Z summary
  - `archiveItemsForState()` + `wireArchive()` — search/year/topic state + event wiring
  - `init()` — one prefetch of `/data/presentations-page.json`
- Runtime fetch count: **1** (unchanged; archive interactivity)
- Detail page (`presentation-item.njk`): fully SSR, no runtime augmentation
- No duplicated SSR + JS surfaces
- **P2 candidate?** No. Every remaining block is either (A) genuine interaction, (D) pagination, or (E) search/filter over a pre-rendered SSR list. Nothing left classifies as (B) deterministic logic wrongly in browser or (C) legacy/dead code.

Verdict: Presentations is architecturally at target. Deferred items from the P1 closure (FULL Pagefind decision, JSON removal, EN redesign) are separate semantic decisions, not "architecture debt" in the closure sense.

## 6. Media suitability

- Authoritative source: `src/media/*.md` (73 items). `src/_data/mediaArchive.js` (80 LOC) is a build-time aggregation, not a parallel source.
- Public JSON: `/data/media.json` — FI hub only consumer (1 fetch via ContentEngine).
- Archive rendering: **FI = hybrid SSR + JS hydration**, **EN = pure SSR (all 73 cards)**. Intentional per M2, but architecturally inconsistent.
- Domain JS: **no dedicated `media-*.js`** — 247 LOC of filtering + pagination + card render lives INLINE in `src/fi/mediassa.njk` (283–529).
- Duplicate rendering: **YES**. `renderCard()` (mediassa.njk 371–402) re-implements the SSR card structure (212–236) via string concatenation. If the SSR template moves, JS must be manually re-synced. DRY violation, no shared template.
- Hard-coded topic aliases (mediassa.njk 306–310, 4 map entries × ~6 aliases) block a shared taxonomy path.
- Pagefind metadata: per-item Sisältö / Mediatyyppi / Rooli / Vuosi filters + meta + sort — full coverage per M2.
- FI/EN feature parity: intentional asymmetry (FI has filter+pagination; EN is curated static).

**Suitability outcome:** `SSR MORE FIRST`, but the payoff is bounded (~100–150 LOC net delete + shared-template win) and depends on cross-archive Find & Explore unification (PF5 audit outcome). Not the right time to open Media G3 as a standalone workstream.

## 7. Writings state

- Archive hubs FI (`src/kirjoitukset.njk`) + EN (`src/en/writings.njk`) — fully SSR
- Domain-specific JS: none (only shared find-explore.js)
- Runtime JSON: `/data/writings-page.json` exists as public contract; no primary browser consumer
- Duplicate rendering: none
- Detail page: fully SSR (`src/_includes/writing-post.njk`)
- Legacy mini-searches: removed in F2 closure

Verdict: **at target architecture**. G4 is not justified — the roadmap already treats writings as foundation-closed.

## 8. Publications / Theses / Research sanity

- Publications: grouped SSR tables (`publication-archive-groups.njk`); F&E replaces rows in-place; citation via shared isomorphic renderer; FULL Pagefind migration closed
- Theses: SSR paginated tables (build-time pagination via `thesesArchivePagesFi.js` / `thesesArchivePagesEn.js`); domain JS = `thesis-hub-actions.js` (citation modal only, no archive rendering); no `/data/theses-page.json` (Pagefind-only discovery)
- Research: shared F&E surfacing via canonical contexts; no separate rendering path

Verdict: **all mature**. Do not reopen.

## 9. Global search state

- Universal `<main data-pagefind-body>` (added in Pagefind index hygiene hotfix)
- `pagefindDocument.seedText` has its own `data-pagefind-body` (find-explore seed retained: `__find_explore_publications__` 57, `__find_explore_theses__` 139, `__find_explore_presentations__` 195)
- `src/js/global-search-modular-ui.js` (688 LOC): modular UI factory with MutationObserver decorators (localise All→Kaikki, strip Sisältö counts) + syncFullSearchLinks
- `src/js/search-result-presenter.js` (208 LOC): emits `<li class="find-explore-result find-explore-result--{kind}">`
- `src/js/find-explore.js` (1203 LOC): shared F&E engine used by Publications/Theses/Writings/Media/Presentations F&E surfaces; contains 4 markup builders (renderPublicationCardResult, renderPublicationArchiveRow, renderResultEntry, renderPublicationArchiveGroups)
- Recent PF5 work: G1 shared presenter convergence, G2 presentations Pagefind projection, H1A search page shell simplification, H1B progressive facet disclosure, navbar modular UI
- Two hotfixes since G2: search state + facet counts (2026-08-24), search UI dark contrast + navbar submit dialog (2026-08-24), index hygiene (2026-08-25)

Open architecture question: with G2 (presentation shared result presenter) + H1A/H1B (search page shell) + index hygiene (attribute-only meta + universal body scope) all landed, is the surface consistent enough across navbar / haku / en-search / domain-F&E cards to declare PF5 done? **This is exactly what the PF5 audit needs to answer.**

Separate UX polish (result density, keyboard nav specifics, mobile behavior) is out of scope of the PF5 architecture audit.

## 10. Runtime JSON ledger

| Endpoint | Domain | Browser consumer | Purpose | Public contract | Deletable? |
| --- | --- | --- | --- | --- | --- |
| `/data/presentations-page.json` | Presentations | `src/js/presentations-page.js:316` (only) | Archive search/filter/pagination | Yes | No — archive interactivity requires it |
| `/data/media.json` | Media | `src/fi/mediassa.njk` inline (only) | FI archive filter/pagination | Yes | No — FI archive interactivity requires it |
| `/data/writings-page.json` | Writings | none primary; public contract only | Public data contract | Yes | No (public contract) |
| `/data/publications-page.json` | Publications | none primary; public contract only | Public data contract | Yes | No (public contract) |
| `/data/content.json` | Cross | `src/kategoriat.njk:204`, `src/avainsanat.njk:160`, `src/_includes/blog-list.njk:361` | Taxonomy/blog list hydration | Yes | No — 3 archive pages |
| `/data/taxonomy-index.json` | Cross | `src/_includes/blog-list.njk:362` | Badge linkability lookup | Yes | No |
| `/data/knowledge-graph.json` | Knowledge Graph | `src/js/knowledge-graph-page.js:98` (only) | Explorer UI | Yes | Maybe (if page becomes non-interactive) |
| `/data/publications.json` | Council work | `src/valtuustotyo.njk:417` (only) | KPI charts + timeline | Yes | Maybe (charts could SSR) |
| `/data/initiatives.json` | Council work | `src/valtuustotyo.njk:417` (only) | KPI charts | Yes | Maybe |
| `/data/council-speeches.json` | Council work | `src/valtuustotyo.njk:417` (only) | KPI charts | Yes | Maybe |
| `/js/ticker-data.json` | Global | `src/js/site-ui.js:229` | News ticker | No (internal) | No — dynamic ticker |

**Note:** every endpoint is a public contract per the roadmap's guardrails. "Deletable" here means the FETCH could be removed and the DATA could flow via SSR, not that the endpoint should be removed.

## 11. Client-side HTML ledger

| Function/file | Domain | Renders | Deterministic? | SSR equivalent? | Delete candidate? |
| --- | --- | --- | --- | --- | --- |
| `src/js/presentations-page.js:133` `archiveCardHtml()` | Presentations | archive card for JS pagination | No (dynamic) | `_includes/presentations/result-card.njk` exists but pagination is JS | No — genuine pagination |
| `src/fi/mediassa.njk:371–402` `renderCard()` (inline) | Media | archive card for JS pagination | No (dynamic) | Inline SSR loop at 212–236 emits same structure | **Yes** — duplicate composer; could delegate to shared template |
| `src/_includes/blog-list.njk:425` `renderRow()` | Blog | blog table row for filter/sort | No (dynamic) | SSR shows initial 15 rows | No — genuine filter/sort |
| `src/_includes/blog-list.njk:412` `renderTaxonomyBadge()` | Blog | taxonomy badge link | Yes | `pe-list-render.js:198` also has same | Maybe — consolidate to single utility |
| `src/js/find-explore.js:748` `renderPublicationCardResult()` | Publications F&E | search result card | No (dynamic) | `publication-item.njk` for detail only | No — F&E result-card |
| `src/js/find-explore.js:781` `renderPublicationArchiveRow()` | Publications | archive table row | No (dynamic filter/sort) | `publication-archive-groups.njk` for SSR | No — genuine filter/sort |
| `src/js/find-explore.js:890` `renderResultEntry()` | Theses F&E | thesis result entry | No | SSR pagination shows initial | No — F&E interaction |
| `src/js/find-explore.js:929` `renderGroupedResults()` | Cross F&E | grouped result list | No | no inline grouping template | No — dynamic grouping |
| `src/js/find-explore.js:945` `renderPublicationArchiveGroups()` | Publications | grouped archive | No | `publication-archive-groups.njk` exists | No — grouping varies by state |
| `src/js/knowledge-graph-page.js:118–271` (4 fns) | Knowledge Graph | explorer cards + node/edge lists | No (explorer UI) | none | Maybe (if page becomes static) |
| `src/js/site-ui.js:213` (ticker) | Homepage | ticker items | No | none | No — dynamic ticker |

**Only architecturally-clear delete candidate:** the Media `renderCard()` duplicate.

## 12. Duplication ledger

- **Media** — `renderCard()` in `src/fi/mediassa.njk` (inline JS at 371–402) duplicates the SSR card structure at 212–236. Two representations of the same card. Estimate ~30 LOC deletable if delegated to a shared template or Nunjucks-driven client render helper.
- **Blog** — `renderTaxonomyBadge()` in `src/_includes/blog-list.njk:412` overlaps with `pe-list-render.js:198`. Minor.
- **Presentations** — none (P1 deleted `renderMobileSourceList`, `wireSourceSections`, dual desktop/mobile clones).
- **Publications, Theses, Writings, Research, Global search** — no duplicate content-rendering paths.

## 13. JavaScript budget (measured)

| File | LOC | Category |
| --- | --- | --- |
| `src/js/find-explore.js` | 1203 | shared F&E engine (all domains) |
| `src/js/site-ui.js` | 856 | navigation + dialog + ticker + a11y toolbar wiring |
| `src/js/global-search-modular-ui.js` | 688 | Pagefind modular UI factory + decorators |
| `src/js/publication-citation.js` | 640 | isomorphic CSL renderer (SSR + browser share) |
| `src/js/knowledge-graph-page.js` | 336 | knowledge-graph explorer |
| `src/js/presentations-page.js` | 327 | archive interactivity (post-P1) |
| `src/js/thesis-hub-actions.js` | 268 | thesis citation modal opener |
| `src/js/a11y.js` | 233 | a11y utilities |
| `src/js/pe-list-render.js` | 232 | shared list renderer |
| `src/js/table-filters.js` | 215 | shared table sort/filter UI |
| `src/js/search-result-presenter.js` | 208 | shared PF5 result-card DOM |
| `src/js/content-engine.js` | 107 | shared client engine |
| `src/js/starter-chips.js` | 103 | shared chips |
| `src/js/external-media-consent.js` | 99 | consent wrapper |
| `src/js/bootstrap.min.js` | 6 | vendored Bootstrap |
| **Total src/js** | **5521** | |

Inline JS budget worth noting (not in `src/js/`):
- `src/fi/mediassa.njk` inline archive block: **~247 LOC** (single largest inline JS in a hub template)
- `src/valtuustotyo.njk` inline KPI/chart block: **~200+ LOC** (fetches 3 JSONs)

## 14. Pagefind readiness per domain

| Domain | Canonical meta | SSR body | Pagefind meta | Result-card | Landing | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| Presentations | full | full | full (post G2 + hygiene) | shared PF5 presenter | canonical (localDetail / externalSource preserved) | KEEP CURRENT |
| Media | full (per M2) | full (73 items on both hubs) | full | native card variant | canonical (source-first preserved) | KEEP CURRENT |
| Writings | full | full | full | shared PF5 | canonical | KEEP CURRENT |
| Publications | full | full | full (FULL Pagefind) | shared PF5 + CSL | canonical | KEEP CURRENT |
| Theses | full | full | full | shared PF5 + citation | canonical | KEEP CURRENT |

**No domain currently justifies a FULL Pagefind migration decision.** All are on shared attribute-form meta + universal body scope. The remaining question is PRESENTER consistency, not per-domain Pagefind ownership — that's the PF5 audit scope.

## 15. User-visible problems

Measured/observed (not theoretical):
- Media FI archive filter-panel + card duplication risk if templates drift (structural risk, not user-visible today)
- Presentations archive first-page pagination requires JS (P1 documented)
- No-JS behavior for archive filter/search on all hubs (documented as intentional across the roadmap)

Not currently causing user-facing problems that would justify a new workstream on their own.

## 16. Deletion opportunities (ranked by leverage)

1. Media `renderCard()` duplicate composer (~30 LOC) — clean deletion; blocked on shared client-render decision
2. `valtuustotyo.njk` runtime KPI fetches (3 endpoints → SSR aggregation) — potentially large but non-architecture-closure surface
3. Knowledge-graph runtime rendering (~4 fns, ~336 LOC) — only viable if graph page becomes static
4. Blog `renderTaxonomyBadge()` overlap with `pe-list-render.js` — minor

None of these are large enough to justify an entire workstream ahead of PF5 audit.

## 17. Candidate scoring

Scoring 1–5 (5 = strongest / lowest-risk).

| Candidate | User value | Debt removed | Deletion | Runtime simpl. | A11y/SEO | Pagefind readiness | Risk (5=low) | Independence | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A. Presentations P2 | 1 | 1 | 1 | 1 | 1 | 1 | 5 | 5 | 16 |
| B. Media G3 | 2 | 3 | 3 | 2 | 1 | 2 | 3 | 2 | 18 |
| C. Writings G4 | 1 | 1 | 1 | 1 | 1 | 1 | 5 | 5 | 16 |
| D. PF5 audit-only | 3 | 3 | 3 | 2 | 2 | 4 | 5 | 5 | 27 |
| E. /valtuustotyo/ SSR KPI | 3 | 4 | 4 | 5 | 3 | 1 | 3 | 5 | 28 |

Evidence:
- **A (Presentations P2)**: post-P1 audit shows nothing left worth deleting. Rejected on Debt removed = 1.
- **B (Media G3)**: real duplicate composer + hard-coded aliases, but Media inventory agent explicitly says "defer until cross-archive PF1 unification". Dependency = 2.
- **C (Writings G4)**: agent verdict "None". Rejected.
- **D (PF5 audit)**: gated in the roadmap as AUDIT FIRST. Fresh evidence (G2 + H1A/H1B + index hygiene) makes the audit cheap. Independence = 5 (self-contained doc-only slice). Unblocks Media G3 recommendation.
- **E (/valtuustotyo/ SSR)**: high runtime simplification (3 fetches → 0) and large concrete deletion. But scope is Political / Council work — outside the roadmap's Architecture Closure lanes. Not on the user's explicit candidate list; would need a separate semantic decision.

Total arithmetic slightly favours E, but E's scope sits outside the roadmap's active Architecture Closure lanes, and rule 22 explicitly requires the audit to choose ONE next workstream aligned with the roadmap. Between D and E, **D wins on independence, roadmap alignment, and blocking-relationship value.**

## 18. Recommended next workstream

**PF5 Global Result Parity — audit-only slice.**

- **Why now:** roadmap gates PF5 as `AUDIT FIRST`. Post-index-hygiene, post-G2 shared presenter, post-H1A/H1B, the recent evidence is fresh and stable enough that the audit is cheap. The audit output (GO / REDUCE / NO-GO) is the input needed to decide whether Media G3 (or any other cross-archive presenter cleanup) should follow.
- **Exact problem:** result-card variants and presenter code paths are spread across `src/js/search-result-presenter.js` (208 LOC shared PF5), `src/js/find-explore.js` (4 result-builder fns, 1203 LOC), `src/js/global-search-modular-ui.js` (688 LOC factory + decorators), and domain-specific inline card composers (Media renderCard, Presentations archiveCardHtml). The audit needs to say which differences are real user problems, which are intentional domain differences, what can be unified, and what would add abstraction without user benefit.
- **Authoritative source:** current live navbar Pagefind + `/haku/` + `/en/search/` + domain F&E mounts on `origin/main`.
- **Intended architecture after the slice:** one PF5 audit doc with GO/REDUCE/NO-GO; the AC1 final-gate roadmap can then declare architecture closure or open the smallest PF5 implementation slice.
- **What gets deleted:** decided by audit outcome. If GO: possible removal of duplicated result-card composition. If REDUCE: smaller shared-presenter tightening only. If NO-GO: nothing.
- **What remains intentionally:** Canonical Content v1, per-domain UX differences that are intentional (media role/outlet chips, presentation source badge, publication CSL rendering, thesis citation modal), attribute-based Pagefind metadata contract, universal `<main data-pagefind-body>`, F&E seedText span mechanism, all `/data/*.json` public contracts.
- **Why other candidates wait:**
  - Presentations P2: architecturally complete post-P1; no debt to remove.
  - Writings G4: mature; nothing to close.
  - Publications/Theses: mature; nothing to close.
  - Media G3: has real duplicate-composer debt but depends on PF5 audit outcome for the right target model; opening it now risks re-doing the media card composer after PF5 tells us what the target shared component is.
  - /valtuustotyo/ SSR KPI: real leverage but outside roadmap's Architecture Closure lanes; requires a separate semantic decision.

## 19. Smallest implementation slice (of the recommendation)

Since the recommendation IS an audit, "implementation" means "produce the audit deliverable."

Single slice (one deliverable, no code changes):

**Slice PF5-A1 — Result-card variant + presenter code-path inventory**

- Goal: for each real user-facing search surface (navbar Pagefind dialog, `/haku/`, `/en/search/`, domain F&E mounts on Presentations / Media / Publications / Theses / Writings) record the presenter code path that renders each result-card variant, the canonical fields it consumes, the visual differences vs the shared PF5 presenter, and whether the differences are (a) intentional domain UX (b) legacy shim (c) accidental drift.
- Likely files touched by the audit (READ ONLY): `src/js/search-result-presenter.js`, `src/js/global-search-modular-ui.js`, `src/js/find-explore.js`, `src/js/pe-list-render.js`, `src/js/content-engine.js`, `src/_utils/contentPresets.js`, hub templates (`src/haku.njk`, `src/en/search.njk`, `src/fi/mediassa.njk`, `src/kirjoitukset.njk`, `src/julkaisut.njk`, `src/opinnaytteet.njk`, `src/esitykset.njk`), presenter partials under `src/_includes/`.
- Code/paths that could be removed if audit lands GO: duplicate result-card composers (e.g., Media renderCard), redundant presenter shims, parallel excerpt sanitizers (none currently, but audit should confirm).
- Canonical invariants to preserve: Canonical Content v1, per-domain UX differences that are intentional, attribute-based Pagefind metadata contract, main[data-pagefind-body] universal scoping, F&E seed queries, /data/*.json public contracts.
- FI/EN requirements: audit both partitions; no changes to language rules.
- Pagefind implications: no config changes; no per-domain FULL migration decision inside this audit.
- Tests: none required for audit-only.
- Measurable success criteria: audit doc lands with (a) full per-surface presenter code path map, (b) explicit GO/REDUCE/NO-GO decision, (c) if GO: named deletion list, (d) if REDUCE: named smaller slice, (e) if NO-GO: explicit rationale and closure signal for PF5.

## 20. Deferred / not started

- Presentations P2 (no debt post-P1)
- Writings G4 (mature)
- Publications / Theses re-open (mature)
- Media G3 (dependency on PF5 outcome)
- /valtuustotyo/ SSR KPI migration (roadmap scope; separate semantic decision)
- FULL Pagefind per-domain decisions (roadmap: not blocked, but not next)
- R1 Canonical related-content projection (roadmap: LATER)
- P1 Performance budgets (roadmap: baselines first)
- UX1 content-experience refinement (roadmap: post-closure)
- BBS / Gopher / themes (out-of-scope forever unless explicitly commissioned)

## 21. Final decision

```
NEXT WORKSTREAM:  PF5 Global Result Parity — audit-only slice
DECISION:         REDUCE
WHY:              Roadmap gates PF5 as AUDIT FIRST. Recent Pagefind index hygiene
                  + G2 shared presenter + H1A/H1B closures give fresh evidence
                  to answer GO/REDUCE/NO-GO cheaply. Every other candidate
                  either has no justified architectural debt (Presentations P2,
                  Writings G4, Publications, Theses, Research) or depends on
                  the PF5 outcome (Media G3) or sits outside the current
                  Architecture Closure lane (/valtuustotyo/ SSR).
FIRST SLICE:      PF5-A1 — Result-card variant + presenter code-path inventory
                  across navbar Pagefind, /haku/, /en/search/, and domain F&E
                  mounts. Deliverable = one audit doc with GO/REDUCE/NO-GO
                  and, if GO, a named deletion list.
EXPECTED DELETION:TBD by audit (0 if NO-GO; possible duplicate result-card
                  composers + presenter shims if GO)
INTENTIONALLY RETAINED:
                  Canonical Content v1, per-domain UX differences that are
                  intentional, Pagefind attribute-based metadata contract,
                  universal main[data-pagefind-body], F&E seed queries, all
                  /data/*.json public contracts.
```

STOP. This document is a decision, not an implementation.
