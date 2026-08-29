# Architecture Closure Current-State Reconciliation

Date: 2026-08-29
Status: `RECONCILIATION` — no production code changed.

Purpose: answer *"what does Architecture Closure 1.0 still genuinely require
on the current `main`, after all work merged through PR #159?"* — using
current repo evidence, not the status text of the 2026-08-20 roadmap.

## Repository truth

- Worktree: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Branch: `main`
- HEAD: `0ad01743bed3733e62b659fa6151790ae81d9a7a` (merge of PR #159)
- `origin/main` HEAD: `0ad01743bed3733e62b659fa6151790ae81d9a7a`
- Ahead / behind: `0 / 0`
- `git status`: clean apart from `.cache/api-fallback/*` auto-generated cache noise (preserved; excluded from any commit that comes out of this task).

## What changed since the 2026-08-20 roadmap

Merged into `main` between `2026-08-20` and this reconciliation (chronological, condensed):

| Date | Merge | Lane | Effect |
| --- | --- | --- | --- |
| 2026-08-20 | PR #118 architecture closure phase | roadmap | Roadmap authored |
| 2026-08-20 | PR #119 T1B2C politics theme convergence | T1 | Closed T1's last active slice |
| 2026-08-20 | CI-CLOSE1 | CI/build | paths-ignore + duplicate Pagefind runs removed |
| 2026-08-20 | OG-CLOSE1 | OG images | OG closure |
| 2026-08-21 | PR #122 O1 widening presentations + media | O1 | Closed O1 including widening |
| 2026-08-21 | PR #123 O1 closure | O1 | Roadmap marker |
| 2026-08-21 | PR #124 native dialog for search focus containment | N1 | Fixes proven WCAG focus-trap defect |
| 2026-08-21 | PR #125 N1 workstream closure | N1 | Roadmap marker updated (line 167 → `CLOSED / GREEN / MAIN`) |
| 2026-08-22 | PR #127 native popover for a11y toolbar (C1 experiment) | C1 | −69 LOC in `a11y.js`; native primitive shipped |
| 2026-08-23 | PR #131 EN search rollout | PF5-G1 | `/en/search/` shipped |
| 2026-08-23 | PR #134 shared presenter convergence | PF5-G1 | 6 duplicated helpers extracted to `search-result-presenter.js` |
| 2026-08-24 | PR #138 PF5-G2 presentations Pagefind metadata | PF5-G2 | Local-first presentations projected into shared presenter |
| 2026-08-24 | PR #140 search page shell simplification | PF5-H1A | Single SSR-authoritative form |
| 2026-08-24 | PR #142 progressive facet disclosure | PF5-H1B | Secondary facets progressive; union semantics multi-select |
| 2026-08-24 | PR #144 search UI regressions hotfix | PF5 | UI hardening |
| 2026-08-24 | PR #146 navbar → full search + Sisältö counts | PF5 | State handoff correctness |
| 2026-08-24 | PR #148 Presentations SSR-P1 source sections | Presentations | Deterministic source-section SSR |
| 2026-08-25 | PR #149 Pagefind index-hygiene metadata leak | PF5 | Detail-page leak fix + `data-pagefind-body` scope |
| 2026-08-25 | PR #151 semantic UL/LI for global search results | PF5-A2 | A11y regression fixed |
| 2026-08-25 | PR #152 memoize heavy Eleventy loaders | build health | Build-hang root cause resolved |
| 2026-08-25 | PR #153 seed-token leak hotfix | PF5 | `__find_explore_*__` leak removed |
| 2026-08-26 | PR #154 navbar Pagefind zero-result hotfix | PF5 | Restore navbar results |
| 2026-08-26 | PR #155 PF5-G3A media result enrichment | PF5-G3A | Localized primary meta + thumbnails |
| 2026-08-26 | PR #156 content-type facet single-select | PF5-A3A | Sisältö single-select |
| 2026-08-27 | PR #157 facet availability presenter | PF5-A3B | Site-owned secondary presenter |
| 2026-08-27 | PR #158 facet presenter UI hotfix + `searchFacetLabels.js` | PF5-A3B1 | Controlled vocabulary; layout/localization fix |
| 2026-08-29 | PR #159 Presentations Slice 3 C1: SSR all cards | Presentations | Single Nunjucks card renderer; runtime cards asset deleted |

Total: **~25 merges** to `main` in nine days, spanning every named Architecture Closure lane.

## Lane-by-lane status

### T1 — Timeline

**Status: `CLOSED / MAINTENANCE`** (unchanged from roadmap).

Evidence: roadmap §3 T1 already says `CLOSED / MAINTENANCE`. T1B2C (PR #119) was the last active slice. T1B3 explicitly deferred without repo-evidenced trigger. Council timeline / training feedback / site changes intentionally stay in current implementations. No newer repo evidence justifies reopening.

### O1 — Detail orientation

**Status: `CLOSED / MAINTENANCE`** (unchanged from roadmap).

Evidence: `docs/o1-detail-orientation-closure-2026-08-21.md`. O1 core + widening shipped for Publications, Theses, Writings, Presentations, Media detail surfaces via shared `detail-orientation.njk`. External-first landing semantics preserved. C1 deletion of two hardcoded hub controls landed alongside.

### N1 — Navigation + accessibility

**Status: `CLOSED / GREEN / MAIN`** (roadmap line 167 already reflects this).

Evidence: PR #124 (native `<dialog>` + focus containment) + PR #125 (closure). The `n1-navigation-accessibility-audit-2026-08-21.md` was retitled in-place to *"AUDIT COMPLETE; IMPLEMENTATION GREEN / REVIEW (PR #124)"*. Roadmap section 8 sequencing diagram (line 373) still calls N1 `NEXT` — that is a doc-only staleness in the same file that already declares N1 closed at line 167.

Post-merge validation recorded in the closure commit:
- `tests/navigation.spec.js --repeat-each=20` = **100/100 PASS**
- accessibility + accessibility-tools + contrast suites = **34/34 PASS**
- unit tests = 602/602 (that build date)

### C1 — Runtime / convergence cleanup

**Status: `EFFECTIVELY CLOSED` — cross-cutting, evidenced via lane-attached deletions.**

C1 was designed as cross-cutting rather than a single lane. Deletions have landed alongside every implementation lane on the same or adjacent PRs:

- O1 widening (PR #122): removed the two hardcoded per-domain hub controls in `presentation-item.njk` and `media-item.njk`.
- C1 native popover experiment (PR #127): −69 LOC in `src/js/a11y.js` after adopting the native Popover API for the a11y toolbar.
- Presentations Slice 3 (PR #159): deleted `archiveCardHtml()` + 10 formatter helpers; deleted the 4 build inputs generating `/data/presentation-cards-*.html`; deleted `CARD_ENDPOINTS`, `loadTemplateMap`, `DOMParser`/templateMap runtime. Single semantic card renderer for the archive now.
- Build memoization (PR #152): removed redundant heavy-loader re-execution.
- Pagefind index-hygiene (PR #149): removed leaking metadata injection pattern.

No repo-evidenced C1 blocker remains. The 2026-08-22 native-primitives audit identified further candidates (search overlay, disclosure widget, tooltips, dropdown, dialog); those are POTENTIAL future experiments, not AC1 blockers.

### Presentations

**Status: `CLOSED / GREEN / MAIN`** (PR #159 merged as `0ad01743`).

Evidence: `docs/presentations-slice3-c1-closure-2026-08-29.md`. Single semantic card renderer (`result-card.njk`). 218 canonical cards rendered once in SSR. JS toggles visibility on existing DOM only. Full no-JS archive. Failure-fallback tested. FI/EN parity via same include + `cardReturnTo` locale switch. `/data/presentations-page.json` schema unchanged.

Debt items from the closure doc's §"Remaining Presentations architecture debt" are explicitly repository-evidenced non-blockers:

1. PF5-G2 vs `presentationPagefind.js` injection duplication — hygiene, non-blocker.
2. Shared presenter external-URL hardening — only relevant if a later audit routes external-first presentations through the shared presenter.
3. `data-pagefind-sort` absent from presentation detail pages — only relevant if a later discovery workstream needs date sorting.
4. `/data/presentations-page.json` public-contract consumer audit — only relevant if a workstream wants to reduce/remove the runtime dependency.
5. `content-visibility: auto` polish — optional paint optimization.

None of the five blocks AC1.

### Media

**Status: `CLOSED / GREEN / MAIN`** (unchanged; M1 + M2 + PF5-G3A shipped).

Evidence: `docs/m2-media-find-explore-closure-2026-08-16.md` + `docs/pf5-g3a-media-result-enrichment-2026-08-26.md`. Every canonical media item participates in the shared discovery pipeline with `Sisältö:Mediassa` + `Mediatyyppi/Rooli/Vuosi` facets + `mediaType/mediaRole/mediaOutlet/date/year/thumbnail` metadata + localized labels for the shared presenter. No repo-evidenced Media closure debt remains.

### PF5 — Global result parity

**Status: `EFFECTIVELY CLOSED` (roadmap §5 text is STALE at `GATED / AUDIT FIRST`).**

The 2026-08-20 roadmap called PF5 gated pending an audit that would return `GO`, `REDUCE`, or `NO-GO`. What actually happened was an implementation-first evolution: 10 PF5-scoped PRs landed between 2026-08-22 and 2026-08-27 covering every material aspect the audit would have decided.

Landed under the PF5 umbrella:

| ID | Concern | Status |
| --- | --- | --- |
| PF5-G1 (PR #131, #134) | EN search rollout + shared-presenter convergence | CLOSED |
| PF5-G2 (PR #138) | Presentations Pagefind projection into shared presenter | CLOSED |
| PF5-G3A (PR #155) | Media result enrichment | CLOSED |
| PF5-H1A (PR #140) | Search page shell simplification | CLOSED |
| PF5-H1B (PR #142) | Progressive facet disclosure | CLOSED |
| PF5-A2 (PR #151) | Semantic UL/LI result list | CLOSED |
| PF5-A3A (PR #156) | Content facet single-select | CLOSED |
| PF5-A3B (PR #157) | Facet availability presenter | CLOSED |
| PF5-A3B1 (PR #158) | Presenter layout + `searchFacetLabels.js` | CLOSED |
| Pagefind index-hygiene (PR #149) | Metadata excerpt leak fix + `data-pagefind-body` on `<main>` | CLOSED |
| Pagefind seed-token leak hotfix (PR #153) | `__find_explore_*__` visible leak | CLOSED |
| Navbar zero-results hotfix (PR #154) | Restore navbar Pagefind results | CLOSED |

Non-blocking items called out by `docs/pagefind-search-quality-baseline-2026-08-25.md`:

- P1: previously-observed `__find_explore_presentations__` leak. Fixed via PR #153.
- P2: EN media title exact-match discoverability. Documented as a benchmark non-blocker; unchanged by any subsequent PR; a specific corpus-shape observation, not an architecture defect.

Roadmap section §5 (line 283, `GATED / AUDIT FIRST`) is now a documentation-only staleness item. It does not reflect the state on `main`.

### R1 — Related content

**Status: `INTENTIONALLY LATER`** (unchanged).

No newer repo evidence justifies activating R1. Roadmap §4.R1 rules still hold: no new taxonomy, no Research inference from topic mapping, no embedding recommender, no parallel knowledge graph.

### P1 — Performance

**Status: `INTENTIONALLY LATER`** (unchanged; baseline captured but no active workstream).

Evidence: `docs/pagefind-search-quality-baseline-2026-08-25.md` captures search-quality regressions to prevent slippage; `docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md` remains a queued audit. Presentations Slice 3 C1 intentionally traded FI archive page gzip (~50 → 139 KB) for architecture closure; this is documented and accepted, not a P1 gate. `content-visibility: auto` for the 218-card SSR grid is a documented optional follow-up. No repo-evidenced trigger to move P1 out of LATER.

### UX1 — Content experience refinement

**Status: `INTENTIONALLY LATER`** (unchanged).

Roadmap places UX1 explicitly post-closure. No newer repo evidence changed its status.

### AC1 — Architecture Closure 1.0

Roadmap §7 lists the AC1 closure expectations. Cross-checking against actual `main`:

| AC1 expectation | Current evidence | Met? |
| --- | --- | --- |
| Active T1 slices completed to a justified stopping point | T1 = CLOSED / MAINTENANCE (roadmap §3); T1B3 deferred with evidence | Yes |
| O1 widened, deferred, or bounded with explicit repo evidence | O1 = CLOSED / MAINTENANCE across five detail surfaces | Yes |
| N1 baseline accessibility/navigation issues closed | N1 = CLOSED / GREEN / MAIN (PR #124, #125) | Yes |
| C1 deletions landed alongside the work they replace | 10+ C1-scoped deletions land inside their host PRs (list above) | Yes |
| PF5 audit resolved to GO/REDUCE/NO-GO | Effectively resolved as *REDUCE, incremental* — 10 PF5 slices closed on `main`; no PF5 audit-first blocker remaining | Yes (functionally; roadmap text stale) |
| R1, P1, UX1 either deferred or advanced with evidence | All three remain LATER with explicit reasoning | Yes |

Every AC1 expectation is met on current `main`. The only unmet item is the roadmap's own documentation, which still contains PF5 `GATED / AUDIT FIRST` text at §5 and an `-> N1 NEXT` line in the section-8 sequencing diagram — both were superseded by merged PRs before this reconciliation.

## Architecture debt scan

Grep-based scan for evidence of remaining parallel layers, on the current
`main` tree, using the candidate list from the task prompt:

| Candidate | Instance | Classification |
| --- | --- | --- |
| Runtime `fetch(...json...)` → client HTML generation | Presentations archive fetches `/data/presentations-page.json` for filter data only; card HTML is now SSR. **No JS card generation remaining after PR #159.** | Intentional / justified |
| Client-side card / list HTML formatters | `presentations-page.js` no longer contains one (deleted in Slice 3). Media archive uses SSR + `data-pagefind-ignore` on the grid; filter path uses ContentEngine + inline `renderCard()` in `src/fi/mediassa.njk`. | Worthwhile cleanup but non-blocking (M-OPEN-1 in reconciliation `2026-08-28`) |
| Duplicate SSR + JS render paths | None on Presentations after PR #159. Media has an equivalent inline `renderCard()` in `mediassa.njk` but M2 closure explicitly bounded that surface. | Worthwhile after AC1, non-blocking |
| Deterministic browser grouping/sorting | Removed from Presentations by SSR-P1 (PR #148) + Slice 3 (PR #159). | Closed |
| Duplicate archive/list presenters | Global-search results are converged on `SearchResultPresenter`. Archive pages retain domain-specific presenters (Publications/Theses/Writings each with their own view models) — intentional per each closure doc. | Intentional / justified |
| Legacy pagination | Presentations pagination now toggles `hidden` on existing DOM nodes; no legacy path. Publications/Theses use `find-explore.js` mount. | Closed |
| Duplicate Pagefind metadata injection paths | PF5-G2 Eleventy computed projection AND `scripts/_lib/presentationPagefind.js` postbuild injection both emit for local-first presentations. Reconciliation `2026-08-28` §3 documented this. Neither breaks; owner choice is unfinished hygiene. | Worthwhile after AC1, non-blocking |
| Public JSON with unclear consumers | `/data/presentations-page.json` (795 KB) has 6 audit-script consumers + Pagefind lib + `presentations-page.js`. All enumerated. Any reduction requires its own consumer audit. | Requires separate consumer audit if ever attempted |

**No candidate rises to the level of architecture blocker.** The two "worthwhile after AC1" items are already documented as debt in the Presentations reconciliation and its closure doc, and neither prevents declaring AC1.

## Required before AC1

**None with repository evidence.**

Every AC1 expectation from the roadmap is met on `main`. The only remaining
concrete work item that touches AC1's documentation surface is:

- **AC1-DOC-SYNC** *(docs-only)* — Update `docs/site-architecture-closure-roadmap-2026-08-20.md` so:
  - §5 PF5 status is no longer `GATED / AUDIT FIRST` (line 283); replace with an evidence-driven summary of the 10 landed PF5 slices and mark the lane as `CLOSED / MAINTENANCE`.
  - §8 sequencing diagram (line 373) no longer says `-> N1 NEXT` (line 167 already says N1 is closed).
  - §9 status snapshot is refreshed against current lane statuses.
  - Add an explicit `AC1 = READY FOR FINAL GATE` marker or supersede the roadmap with this reconciliation doc, per repository convention.

This is documentation reconciliation, not architecture work. Whether it belongs to the AC1 final gate itself or to a lightweight pre-gate touch-up is a repository-practice decision, not an architecture decision.

## Worthwhile after AC1

Only repository-supported items:

- **PF5-hygiene-1** — reconcile the PF5-G2 Eleventy computed projection with `scripts/_lib/presentationPagefind.js` postbuild injection. Choose one owner; delete the other. Neither breaks anything today. Documented in Presentations reconciliation `2026-08-28` §3 and Slice 3 C1 closure `2026-08-29` debt item 1.
- **Media-list-render-consolidation (M-OPEN-1)** — mirror the Presentations Slice 3 C1 pattern on the FI `/mediassa/` archive if a later audit finds the duplicate-runtime pattern worth resolving. Non-blocking; M2 closure explicitly bounded media out of Slice 3 scope. Documented in reconciliation `2026-08-28` §M-OPEN-1.
- **Media outlet normalization (M-OPEN-2)** — 28 distinct outlet strings could be normalized before becoming a user-facing facet. Authoring / vocabulary decision. Documented in reconciliation `2026-08-28` §M-OPEN-2.
- **`content-visibility: auto` polish** — optional paint optimization for the 218-card Presentations SSR grid. Not required for correctness. Slice 3 C1 closure debt item 5.
- **`data-pagefind-sort` on Presentations detail pages** — only relevant if a later discovery workstream needs presentation date sorting. Slice 3 C1 closure debt item 3.
- **Shared presenter external-URL hardening** — only relevant if a later audit routes external-first presentations through the shared presenter (`target="_blank"` + rel + external badge). Slice 3 C1 closure debt item 2.
- **PF-PERF1 startup performance audit** — queued in `docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md`. Post-closure optimization, not gate.
- **Search benchmark P2** — EN media title exact-match discoverability. Corpus-shape observation, not architecture defect.
- **Native-primitives further experiments** (dialog, tooltips, disclosure) — future C1-style cleanups per `docs/native-html-primitives-suitability-audit-2026-08-22.md`. Non-blocking.

## Maintenance / reopen only on evidence

Lanes that should not be reopened without new repo evidence:

- **T1** — CLOSED / MAINTENANCE. Reopen only for a new repo-evidenced active-discovery trigger.
- **O1** — CLOSED / MAINTENANCE. Reopen only for a new orientation regression or a new domain requiring explicit suitability review.
- **N1** — CLOSED / GREEN / MAIN. Reopen only on a new repo-evidenced navigation/accessibility regression on gates recorded in the closure doc.
- **Presentations** — CLOSED / GREEN / MAIN. Slice 3 C1 supersedes the four-iteration chain; do not reopen without a new architecture-level trigger.
- **Media** — CLOSED / GREEN / MAIN. Reopen only for a repo-evidenced regression or a new domain requirement.
- **PF5** — CLOSED / MAINTENANCE (per this reconciliation; roadmap doc text still stale). Reopen only for a new discovery-parity regression or a new domain joining the shared presenter.
- **R1 / P1 / UX1** — LATER. Activate only on new repo evidence.

## Roadmap drift

Compact drift table comparing the 2026-08-20 roadmap text against actual current-`main` state:

| Lane | Roadmap status (in file) | Current repo status | Evidence | Roadmap stale? |
| --- | --- | --- | --- | --- |
| T1 | CLOSED / MAINTENANCE (§3, l.76) | CLOSED / MAINTENANCE | T1B2C PR #119; roadmap already reflects | **No** |
| O1 | CLOSED / MAINTENANCE (§3, l.124) | CLOSED / MAINTENANCE | O1 core + widening merged | **No** |
| N1 | CLOSED / GREEN / MAIN (§3, l.167) — but §8 line 373 still `-> N1 NEXT` | CLOSED / GREEN / MAIN | PR #124 + #125 | **Partial** — §3 correct; §8 sequencing stale |
| C1 | CROSS-CUTTING (§3, l.223) | Effectively closed via lane-attached deletions | O1 widening + PR #127 popover + PR #159 Slice 3 + PR #152 memoize + PR #149 hygiene | **No** — roadmap treats C1 as cross-cutting; correct |
| Presentations | Not a named roadmap lane; embedded in F3C closure | CLOSED / GREEN / MAIN | Slice 3 C1 via PR #159 | **N/A** |
| Media | Not a named roadmap lane; foundation-closed | CLOSED / GREEN / MAIN | M1 + M2 + PF5-G3A | **N/A** |
| PF5 | `GATED / AUDIT FIRST` (§5, l.283) | Effectively CLOSED / MAINTENANCE across 10 slices | PR #131, #134, #138, #140, #142, #151, #155, #156, #157, #158 | **YES — significant staleness** |
| R1 | LATER (§4) | LATER | No new evidence | **No** |
| P1 | LATER / BASELINE FIRST (§7) | LATER; baseline captured | `pagefind-search-quality-baseline-2026-08-25.md` | **No** |
| UX1 | POST-CLOSURE (§6) | POST-CLOSURE | No new evidence | **No** |
| AC1 | FINAL GATE (§7) | **READY FOR FINAL GATE** per this reconciliation | Every AC1 expectation met | Slightly — sequencing text needs refresh |

The dominant drift is at PF5 §5 (`GATED / AUDIT FIRST` no longer accurate). Minor drift at §8 sequencing (N1 still called `NEXT` despite §3 declaring it closed).

## AC1 readiness decision

**C — READY FOR FINAL GATE.**

Justification:

- Every AC1 expectation enumerated in roadmap §7 is met on current `main` (see the AC1 table above).
- No repository-evidenced architecture blocker remains under any lane.
- The debt scan (§Architecture debt scan) turned up only "worthwhile after AC1" items or "intentional / justified" state — no blocker.
- The two remaining staleness items are in the roadmap DOCUMENT itself, not in the architecture: PF5 `GATED / AUDIT FIRST` text and §8 `-> N1 NEXT` sequencing text. Fixing the roadmap document is documentation reconciliation, not architecture work.
- Choosing `B — NEARLY READY` would imply there are 1–3 bounded closure packages remaining. There are not. What remains is either post-closure work (already listed as such in every relevant closure doc) or documentation reconciliation.

The user's decision guidance explicitly says: *"Future improvements are not automatically Architecture Closure blockers."*

## Recommended next action

**AC1-FINAL-GATE — declare Architecture Closure 1.0 and reconcile the roadmap document with current `main`.**

Exactly one task, docs-only:

- Author `docs/architecture-closure-1-0-closure-2026-08-29.md` (or similar dated closure doc):
  - Records the AC1 decision, the evidence per lane, the specific merged PRs that satisfy each roadmap §7 expectation, and the specific non-blocker debt kept as post-closure work.
  - References this reconciliation doc as the current-state audit.
- Update `docs/site-architecture-closure-roadmap-2026-08-20.md` in place:
  - §5 PF5 status changed from `GATED / AUDIT FIRST` to `CLOSED / MAINTENANCE` with a short list of the 10 landed slice IDs.
  - §8 sequencing diagram: replace `-> N1 NEXT` with a post-closure marker.
  - §9 status snapshot refreshed.
  - Add an AC1 = CLOSED / GREEN / MAIN line, consistent with the current N1/O1/T1 rows.
- Optional: annotate the AC1 closure with a git tag (e.g., `architecture-closure-1-0`) per repository practice from the F3B closure precedent (`find-explore-publications-v1` tag).

Not implementation. Not code. Not another audit. The next work is the formal
closure of the Architecture Closure lane itself.

This document (the current-state reconciliation) is the input evidence for
that closure. It is not the closure itself; the closure decision belongs to
a separate short docs-only PR that references this reconciliation and marks
the roadmap current.

No push, no PR from this task.
