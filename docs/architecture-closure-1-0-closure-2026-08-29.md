# Architecture Closure 1.0 — Closure

Date: 2026-08-29
Status: `CLOSED / GREEN / MAIN` — pending merge of this documentation PR.

## 1. Decision

**Architecture Closure 1.0 is complete.**

This closes the architecture-convergence phase of the site. It does not close all future development; it records that the specific migration/convergence work enumerated in `docs/site-architecture-closure-roadmap-2026-08-20.md` §7 has landed on `main` and no repo-evidenced architecture blocker remains.

Resulting site architecture:

```text
canonical content
        ↓
Eleventy / Nunjucks
        ↓
server-rendered HTML + metadata
        ↓
Pagefind index / metadata
        ↓
Find & Explore
        ↓
canonical detail page or approved landing
```

Operating rule:

- **Nunjucks renders truth.**
- **Pagefind discovers, filters and orders.**
- **JavaScript handles genuine interaction.**

The current-state audit backing this decision is `docs/architecture-closure-current-state-reconciliation-2026-08-29.md` (this branch's earlier commit `ca2e9824`).

## 2. Closure evidence by lane

| Lane | Final status | Evidence |
| --- | --- | --- |
| Canonical Content v1 | `CLOSED / GREEN / MAIN` | `docs/canonical-content-v1-closure-2026-08-12.md` |
| Writings Find & Explore | `CLOSED / GREEN / MAIN` | `docs/find-explore-writings-v1-closure-2026-08-12.md` |
| Theses Find & Explore | `CLOSED / GREEN / MAIN` | `docs/find-explore-theses-v1-closure-2026-08-14.md` |
| Publications Find & Explore | `CLOSED / GREEN / MAIN` | `docs/find-explore-publications-v1-closure-2026-08-14.md` + `docs/publications-full-pagefind-pub-cite1-closure-2026-08-17.md` (domain-specific FULL Pagefind, not a site-wide model) |
| Research contextual discovery | `CLOSED / GREEN / MAIN` | `docs/f4-research-find-explore-closure-2026-08-15.md` |
| Presentations Find & Explore | `CLOSED / GREEN / MAIN` | `docs/find-explore-presentations-f3c-closure-2026-08-15.md` |
| Media Find & Explore | `CLOSED / GREEN / MAIN` | `docs/m2-media-find-explore-closure-2026-08-16.md` |
| Publications / theses citation convergence | `CLOSED / GREEN / MAIN` | `docs/th-cite1-phase{3,4,6}-*-closure-2026-08-18.md`, `docs/pub-cite1-*-closure-2026-08-17.md` |
| Publications / theses archive convergence | `CLOSED` | `docs/publications-archive-convergence-implementation-2026-08-20.md`, `docs/theses-archive-convergence-implementation-2026-08-20.md` |
| T1 — Timeline 2.0 | `CLOSED / MAINTENANCE` | `docs/t1b2c-politics-theme-convergence-2026-08-20.md` (last active slice); T1B3 deferred with evidence |
| O1 — Detail orientation | `CLOSED / MAINTENANCE` | `docs/o1-detail-orientation-closure-2026-08-21.md`; core + widening across Publications, Theses, Writings, Presentations, Media |
| N1 — Navigation + accessibility | `CLOSED / GREEN / MAIN` | PR #124 (native `<dialog>` + focus containment), PR #125 (workstream closure) |
| C1 — Runtime / convergence cleanup | `EFFECTIVELY CLOSED` — cross-cutting, resolved via lane-attached deletions | O1 widening (PR #122), C1 native popover (PR #127), Presentations Slice 3 (PR #159), build memoization (PR #152), Pagefind hygiene (PR #149) |
| Presentations Slice 3 | `CLOSED / GREEN / MAIN` | `docs/presentations-slice3-c1-closure-2026-08-29.md` (PR #159) — single Nunjucks card renderer, runtime cards asset deleted, JS interaction-only |
| Media | `CLOSED / GREEN / MAIN` — no active blocker | M1 audit + M2 closure + `docs/pf5-g3a-media-result-enrichment-2026-08-26.md` |
| PF5 — Global result parity | `CLOSED / MAINTENANCE` — implementation-first resolution across 10 slices | PF5-G1 (PR #131, #134), PF5-G2 (PR #138), PF5-G3A (PR #155), PF5-H1A (PR #140), PF5-H1B (PR #142), PF5-A2 (PR #151), PF5-A3A (PR #156), PF5-A3B (PR #157), PF5-A3B1 (PR #158), plus Pagefind index-hygiene (PR #149), seed-token leak (PR #153), navbar zero-results (PR #154) |
| R1 — Canonical related content | `INTENTIONALLY LATER` (post-closure) | Roadmap §4; no repo-evidenced trigger |
| P1 — Performance budgets | `INTENTIONALLY LATER / BASELINE FIRST` | `docs/pagefind-search-quality-baseline-2026-08-25.md`, `docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md` |
| UX1 — Content experience refinement | `INTENTIONALLY POST-CLOSURE` | Roadmap §6; no repo-evidenced trigger |
| AC1 — Architecture Closure 1.0 | **`CLOSED / GREEN / MAIN`** (this document) | Every roadmap §7 expectation met on current `main` |

## 3. What Architecture Closure removed

Major classes of duplicate architecture removed across the phase, each supported by an existing closure doc:

- **Client-side card / list HTML formatters.** `archiveCardHtml()` on `/esitykset/` and its 10 formatter helpers removed (Presentations Slice 3, `docs/presentations-slice3-c1-closure-2026-08-29.md`).
- **Runtime JSON → client HTML card path.** Presentations archive: `/data/presentation-cards-{fi,en}.html` build outputs deleted; JS no longer parses card HTML at runtime (same closure).
- **Duplicate archive renderers.** Publications, Theses, Writings, Presentations, Media each unified onto one archive renderer per domain (`docs/find-explore-{publications,theses,writings,presentations,media}-*-closure-*.md`).
- **Duplicate citation formatters.** Publications and Theses citation formatters converged via `docs/pub-cite1-*-closure-2026-08-17.md` and `docs/th-cite1-phase{3,4,6}-*-closure-2026-08-18.md`.
- **Browser-side deterministic grouping/sorting.** Presentations source-section grouping/sorting moved to build time (PR #148 SSR-P1); year/topic options generated at build time.
- **Legacy navigation / modal state.** N1 replaced the custom search-overlay focus-trap experiment with a native `<dialog>` (PR #124, #125) — modality, top layer, background inertness, Escape/cancel owned by the browser primitive.
- **Duplicated SSR + JS list ownership.** Presentations archive: single Nunjucks source of truth (`result-card.njk`) for both SSR opening set and post-hydration visibility toggling.
- **Domain-specific orientation duplication.** O1 unified detail-orientation across five domains via `src/_includes/detail-orientation.njk`; two hardcoded hub-return links removed (`presentation-item.njk`, `media-item.njk`).
- **Redundant Pagefind / result-presentation layers.** PF5-G1 extracted six duplicated helpers to `src/js/search-result-presenter.js` as a single owner. PF5-G2/G3A projected presentations and media into that shared presenter; PF5-A2/A3A/A3B/A3B1 unified list semantics and facet behavior.
- **Custom accessibility toolbar dialog.** C1 replaced the custom implementation with the native Popover API (PR #127), removing ~69 LOC from `src/js/a11y.js`.
- **Redundant build work.** PR #152 memoized two heavy Eleventy loaders (`theses.js`, `researchfi.js`) that had been running per-template.

## 4. Final architecture boundaries

### Canonical content

Owns:

- identity
- URLs
- content type
- `contexts`
- topics / categories / keywords semantics
- source / landing semantics
- metadata
- JSON-LD
- domain-specific semantics

### Eleventy / Nunjucks

Owns:

- semantic page structure
- main content
- deterministic grouping and order
- canonical cards
- detail surfaces
- orientation
- metadata projection

### Pagefind

Owns:

- discovery
- indexing
- filtering
- ordering where intentionally projected

Pagefind is NOT:

- canonical storage
- identity source
- taxonomy source
- archive generator

### JavaScript

Owns:

- query / filter state
- pagination state
- progressive enhancement
- focus and interaction
- visibility changes

JavaScript does NOT own a parallel content model.

## 5. Post-closure work

The following are valid future development areas. They do NOT keep AC1 open. Each is supported by the current-state reconciliation.

- **R1** — canonical related-content projection (roadmap §4).
- **P1** — performance baselines/budgets and optimization (roadmap §7). Baseline captured in `docs/pagefind-search-quality-baseline-2026-08-25.md`.
- **UX1** — content-experience refinement (roadmap §6).
- **`content-visibility: auto`** — optional paint optimization for the 218-card Presentations SSR grid; noted in the Presentations Slice 3 C1 closure debt item 5.
- **PF5-hygiene-1** — reconcile PF5-G2 Eleventy computed metadata projection with `scripts/_lib/presentationPagefind.js` postbuild injection. Non-blocking hygiene.
- **`/data/presentations-page.json` public-contract consumer audit** — only if a future workstream wants to reduce or drop the runtime dependency.
- **Media list-render consolidation** — mirror the Presentations Slice 3 C1 pattern on `/mediassa/` if a future audit finds the duplicate-runtime pattern worth resolving. M2 closure explicitly bounded this out of scope.
- **Media outlet normalization** — 28 distinct outlet strings before a user-facing outlet facet.
- **`data-pagefind-sort` on Presentations detail pages** — only relevant if a future discovery workstream needs date sorting.
- **Shared presenter external-URL hardening** — only relevant if a future audit routes external-first presentations through the shared presenter.
- **Further native-primitive experiments** — dialog, tooltips, disclosure candidates per `docs/native-html-primitives-suitability-audit-2026-08-22.md`.
- **PF-PERF1 startup performance audit** — queued in `docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md`.

## 6. Reopen conditions

Architecture Closure 1.0 should be reopened **only** on repo-evidenced architecture regression, such as:

- new duplicate content ownership
- canonical semantics moved into browser JS
- Pagefind becoming canonical storage
- a new runtime JSON → HTML architecture duplicating SSR
- loss of FI/EN parity in shared architecture
- removal of a public contract without consumer proof
- regression in source, landing or context semantics

Normal new features and post-closure improvements above do **not** reopen AC1.

## 7. References

- Current-state audit: `docs/architecture-closure-current-state-reconciliation-2026-08-29.md`
- Roadmap: `docs/site-architecture-closure-roadmap-2026-08-20.md` (updated by this PR to reflect closure)
- Presentations Slice 3 chain: `docs/presentations-slice3-c1-closure-2026-08-29.md`, PR #159
- N1 closure: PR #124 + PR #125
- O1 closure: `docs/o1-detail-orientation-closure-2026-08-21.md`
- T1 closure: `docs/t1b2c-politics-theme-convergence-2026-08-20.md`
- PF5 closure chain: PF5-G1 → PF5-A3B1 (PR #131/#134/#138/#140/#142/#151/#155/#156/#157/#158)
- Media closure: `docs/m2-media-find-explore-closure-2026-08-16.md`, `docs/pf5-g3a-media-result-enrichment-2026-08-26.md`
- Foundation closures: Canonical Content v1, Writings/Theses/Publications/Research/Presentations/Media Find & Explore closures (see §2).
