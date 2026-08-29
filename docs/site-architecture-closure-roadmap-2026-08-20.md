# Site Architecture Closure Roadmap

Date: 2026-08-20
Status: ACTIVE

Canonical Content v1 and the primary Find & Explore domain migrations are closed.

The active site-wide phase is now **Architecture Closure**:
convergence, deletion, orientation, accessibility, navigation,
performance, and measured simplification.

This roadmap is intentionally shorter than the historical Find & Explore roadmap. It is the operational handoff for the current phase, not a full replay of earlier migration history.

## 1. Architectural Principle

Target model:

```text
canonical content
  -> Eleventy / Nunjucks
  -> server-rendered HTML + metadata
  -> Pagefind index / metadata
  -> Find & Explore
  -> canonical detail page or approved landing
```

Rule:

- Nunjucks renders the truth.
- Pagefind finds, filters, and orders.
- JavaScript connects those layers for the user.

Guardrails:

- do not turn Pagefind into canonical storage
- do not change Canonical Content v1 semantics casually
- do not reinterpret `contexts`
- do not collapse `pageUrl`, `sourceUrl`, `externalUrl`
- do not remove public JSON contracts without consumer evidence
- preserve justified per-domain UX differences

## 2. Foundation — Closed

The following belong to the completed foundation phase and should now be treated primarily as closure evidence rather than the active planning lane:

- Canonical Content v1
  - [canonical-content-v1-closure-2026-08-12.md](./canonical-content-v1-closure-2026-08-12.md)
- Writings Find & Explore
  - [find-explore-writings-v1-closure-2026-08-12.md](./find-explore-writings-v1-closure-2026-08-12.md)
- Theses Find & Explore
  - [find-explore-theses-v1-closure-2026-08-14.md](./find-explore-theses-v1-closure-2026-08-14.md)
- Publications Find & Explore / FULL Pagefind
  - [find-explore-publications-v1-closure-2026-08-14.md](./find-explore-publications-v1-closure-2026-08-14.md)
  - [publications-full-pagefind-pub-cite1-closure-2026-08-17.md](./publications-full-pagefind-pub-cite1-closure-2026-08-17.md)
- Research contextual Find & Explore
  - [f4-research-find-explore-closure-2026-08-15.md](./f4-research-find-explore-closure-2026-08-15.md)
- Presentations Find & Explore
  - [find-explore-presentations-f3c-closure-2026-08-15.md](./find-explore-presentations-f3c-closure-2026-08-15.md)
- Media Find & Explore
  - [m2-media-find-explore-closure-2026-08-16.md](./m2-media-find-explore-closure-2026-08-16.md)
- Publication / thesis citation convergence
  - [th-cite1-phase3-ssr-archive-closure-2026-08-18.md](./th-cite1-phase3-ssr-archive-closure-2026-08-18.md)
  - [th-cite1-phase4-modal-export-closure-2026-08-18.md](./th-cite1-phase4-modal-export-closure-2026-08-18.md)
  - [th-cite1-phase6-legacy-server-citation-closure-2026-08-18.md](./th-cite1-phase6-legacy-server-citation-closure-2026-08-18.md)
- Publications / theses archive convergence
  - implementation evidence exists in:
    - [publications-archive-convergence-implementation-2026-08-20.md](./publications-archive-convergence-implementation-2026-08-20.md)
    - [theses-archive-convergence-implementation-2026-08-20.md](./theses-archive-convergence-implementation-2026-08-20.md)

Some closure evidence in this area is still branch-state documentation rather than a dedicated main-closure cycle. That is acceptable here: the point is that these are no longer the primary site-wide planning frontier.

## 3. Architecture Closure — Active

### T1 — Timeline 2.0

Status: CLOSED / MAINTENANCE

Current evidence:

- T1A audit is closed on `main`
  - [t1-timeline-2-audit-2026-08-20.md](./t1-timeline-2-audit-2026-08-20.md)
- T1B1 projection foundation is closed evidence
  - [t1b1-timeline-projection-foundation-2026-08-20.md](./t1b1-timeline-projection-foundation-2026-08-20.md)
- T1B2A election-history convergence is closed on `main`
  - [t1b2a-election-history-convergence-2026-08-20.md](./t1b2a-election-history-convergence-2026-08-20.md)
- T1B2B home milestone convergence is closed on `main`
  - [t1b2b-home-milestone-convergence-2026-08-20.md](./t1b2b-home-milestone-convergence-2026-08-20.md)
- T1B2C politics-theme convergence is closed on `main` (PR #119)
  - [t1b2c-politics-theme-convergence-2026-08-20.md](./t1b2c-politics-theme-convergence-2026-08-20.md)
- T1 post-B2C closure audit
  - [t1-post-b2c-next-step-audit-2026-08-21.md](./t1-post-b2c-next-step-audit-2026-08-21.md)

Current model:

```text
canonical/domain facts
  + legitimate editorial companion facts
  -> build-time projection
  -> SSR timeline/history surface
```

Rules:

- only justified editorial companion metadata remains manual
- no runtime JSON -> timeline render path
- Pagefind is optional enhancement, not a timeline generator

Closure semantics:

- T1B2C is closed on `main`
- T1B3 is deferred unless a future repo-evidenced active-discovery trigger appears
- remaining T1A surfaces intentionally stay as current domain-specific implementations:
  - council timeline is already build-time projected via `buildCouncilMeetingTimeline()` and offers no duplicate-ownership win
  - training feedback is a legitimate page-native dataset with no canonical source to converge onto
  - site changes is external GitHub history and stays outside T1; any future DOM/perf work belongs to C1 / P1 / UX1
- reopen T1 only on new repo evidence, not on roadmap inertia

### O1 — Detail orientation

Status:

- O1 core = CLOSED / GREEN / MAIN
- O1 widening = CLOSED / GREEN / MAIN
- O1 = CLOSED / MAINTENANCE

Current evidence:

- O1 core implementation is on `main` and covers publications, theses, and writings detail pages via the shared `src/_includes/detail-orientation.njk` include, an explicit `returnTo` discovery context, and removal of the `history.back()` dependency
  - [o1-orientation-implementation-2026-08-20.md](./o1-orientation-implementation-2026-08-20.md)
- Presentations suitability audit = GO
- Media suitability audit = GO
  - [o1-widening-presentations-media-suitability-audit-2026-08-21.md](./o1-widening-presentations-media-suitability-audit-2026-08-21.md)
- Widening implementation merged via PR #122
  - [o1-widening-presentations-media-implementation-2026-08-21.md](./o1-widening-presentations-media-implementation-2026-08-21.md)
- Shared `detail-orientation.njk` now covers Publications, Theses, Writings, Presentations, and Media detail surfaces where canonical/local detail semantics permit it
- Explicit `returnTo` discovery context implemented for Presentations and Media without new state ownership (no browser storage, no history-API navigation, no serialized result-set state)
- External-first Presentations semantics preserved — external-first canonicals continue to bypass the local detail template
- Media external source CTA (`Avaa alkuperäinen lähde`) semantics preserved — remains the visually primary action above the orientation nav
- C1 deletion completed for the two hardcoded domain-specific hub controls (`presentation-item.njk` `/esitykset/` link and `media-item.njk` `/mediassa/` link)
- Closure record: [o1-detail-orientation-closure-2026-08-21.md](./o1-detail-orientation-closure-2026-08-21.md)

Final model:

```text
canonical hub return
  -> SSR / no-JS

active discovery context
  -> explicit same-origin returnTo
  -> prefix allowlist
  -> progressive enhancement
```

Rules:

- no `history.back()` dependency
- no parallel browser navigation model
- no forced one-size-fits-all orientation component

Closure semantics:

- O1 reopens only on new repo-evidenced orientation regressions or a new domain requiring explicit suitability review
- Domain landing/source semantics remain authoritative; the shared contract does not flatten preferred-landing rules or force EN detail routes into existence where they do not exist today

### N1 — Navigation + accessibility closure

Status: CLOSED / GREEN / MAIN

Baseline regression (home/search-dialog keyboard focus / focus-trap) is fixed on `main` via PR #124. The final tested head `d4bbfd3cd0a1a6414fcc4c3fdbd1c4346dd6be68` passed both required PR workflows (Staging checks + Accessibility and navigation tests) and was then merged unchanged via SHA-guarded merge (`--match-head-commit d4bbfd3c…`) as `main` commit `43bf9de192814c36e5201b682f2e41d470d2bc16`. The repository does not re-run those PR workflows against the merge commit itself; the tested code equals the merged code because the head was not modified between the CI run and the merge.

Final implementation model on `main`:

- native `<dialog>` owns modality, top layer, background inertness, and native Escape/cancel
- `site-ui.js` owns only Chromium's cyclic Tab boundary wrap, initial Pagefind input focus, and exact focus return to the trigger
- Pagefind keeps ownership of its own UI content and internal focusable controls
- FI and EN nav templates share the same `<dialog id="searchOverlay">` markup and JS

C1 deletions landed on `main`:

- custom close-animation timer + reduced-motion branch
- body overflow lock
- manual `hidden` / `display` / `aria-hidden` modal state
- `.is-open` overlay state + related CSS transitions
- manual `z-index` modal ownership
- document-level Escape branch for the search overlay
- redundant `role="dialog"` / `aria-modal` / `aria-hidden` on markup
- interior per-Tab deterministic focus traversal (interior traversal is now native)

Evidence:

- [o1-orientation-implementation-2026-08-20.md](./o1-orientation-implementation-2026-08-20.md)
- [n1-navigation-accessibility-audit-2026-08-21.md](./n1-navigation-accessibility-audit-2026-08-21.md) — full audit including experiments A–I (rejected timing/perturbation experiments and the accepted native `<dialog>` + boundary-wrap solution)
- `tests/navigation.spec.js` — updated for native `<dialog>` semantics; new explicit EN parity lifecycle test

Goals met on `main`:

- relevant accessibility/navigation tests green without a baseline exception ✓
- FI / EN parity ✓
- keyboard focus order ✓
- focus trap ✓
- focus return ✓
- search-dialog recovery behavior ✓

Final pre-merge branch validation (evidence recorded in the audit doc):

- isolated `Search dialog traps focus` × 30 = 30/30 PASS
- full `tests/navigation.spec.js` × 20 (100 test invocations incl. new EN parity) = 100/100 PASS
- zero focus escape, zero lost Tab presses, zero order corruption
- `tests/accessibility.spec.js` + `tests/accessibility-tools.spec.js` + `tests/contrast.spec.js` = 34/34 PASS
- `npm run test:unit` = 602/602 PASS
- `npm run build:no-og` = PASS
- `git diff --check` = clean

PR #124 final tested head `d4bbfd3c…` — required workflows:

- Staging checks (build-and-verify) = PASS (1m45s)
- Accessibility and navigation tests (playwright) = PASS (4m15s)

That exact head was merged unchanged via SHA-guarded merge as `main` commit `43bf9de1…`. The repository does not re-run those PR workflows on the merge commit.

N1 reopens only on new repo-evidenced regression on any of the above gates.

### C1 — Runtime / convergence cleanup

Status: CROSS-CUTTING

Every future workstream must ask:

```text
what can be deleted now?
```

Audit and delete where proven safe:

- browser-side deterministic grouping/sorting that can move to build time
- DOM filtering over already-rendered long lists
- duplicate SSR + JS list surfaces
- runtime JSON -> render paths
- client-side HTML formatters
- legacy pagination
- duplicate templates / presenters / adapters

Deletion is part of completion, not a separate cleanup phase.

## 4. Cross-Domain Related Content

### R1 — Canonical related-content projection

Status: `ACTIVE / BOUNDED POST-CLOSURE`

Historical framing (superseded): the 2026-08-20 roadmap listed R1 as `LATER`. The R1-A audit ([r1a-canonical-related-content-suitability-audit-2026-08-29.md](./r1a-canonical-related-content-suitability-audit-2026-08-29.md)) then established that R1 is not green-field — the `relatedContent` Eleventy filter + `content-context-sidebar.njk` are already deployed on five detail templates (Publications, Presentations, Media, Blog, Writings), producing deterministic SSR related-content projections. R1-B0 ([r1b0-semantic-related-content-reconciliation-audit-2026-08-29.md](./r1b0-semantic-related-content-reconciliation-audit-2026-08-29.md)) measured the pre-closure embedding-derived semantic contribution and escalated the boundary conflict. R1-ADR1 ([r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md](./r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md)) resolves the conflict.

Target:

- make content relationships more visible
- **canonical relationships remain authoritative**
- prefer SSR projections

Possible UI forms:

- `Aiheesta lisää`
- `Samaan hankkeeseen liittyvät`
- `Julkaisuja tästä aiheesta`
- `Esityksiä tästä aiheesta`

Allowed inputs:

- `contexts`
- topics
- categories
- keywords
- explicit canonical relationships
- retained pre-closure semantic-similarity contribution as **auxiliary ranking only** (see hard boundaries and ADR1)

Hard boundaries (revised by ADR1):

- no new taxonomy
- no Research inference from topic mapping
- **No embedding- or LLM-derived signal may define canonical identity, taxonomy, `contexts`, Research membership, source/landing semantics, content ownership, or candidate eligibility. Existing pre-closure semantic similarity may remain as bounded auxiliary ranking infrastructure where measured user value exists, provided canonical candidates and destinations remain authoritative.**
- **New embedding/LLM infrastructure is not authorized. Any change adding or extending embedding/LLM infrastructure requires a separate architecture decision backed by new measurement evidence.**
- no parallel knowledge-graph content model
- no runtime / client-side inference or vector search; related content stays build-time / SSR

R1-B1 (add `content-context-sidebar.njk` to `src/opinnaytteet/thesis-details.njk`) is **unblocked** after ADR1 merges. R1-B1 is a surface-convergence slice only; it must not modify semantic scoring, generate new embeddings, change `SEM_WEIGHT`, or redesign related-content ranking. See ADR1 §"R1-B1 consequence".

## 5. PF5 Global Result Parity

### PF5 — GLOBAL RESULT PARITY

Status: `CLOSED / MAINTENANCE`

Historical framing (superseded): the original 2026-08-20 plan gated PF5 behind an audit that would return `GO`, `REDUCE`, or `NO-GO`. The lane instead resolved as **REDUCE, incremental** — 10 PF5-scoped PRs landed between 2026-08-22 and 2026-08-27 covering every material aspect the audit would have decided. See [architecture-closure-1-0-closure-2026-08-29.md](./architecture-closure-1-0-closure-2026-08-29.md) §2 for the closure evidence and [architecture-closure-current-state-reconciliation-2026-08-29.md](./architecture-closure-current-state-reconciliation-2026-08-29.md) §"PF5 — Global result parity" for the reconciliation.

Closed under the PF5 umbrella:

- PF5-G1 shared presenter convergence + EN search rollout (PR #131, PR #134)
- PF5-G2 Presentations Pagefind projection (PR #138)
- PF5-G3A Media result enrichment (PR #155)
- PF5-H1A search page shell simplification (PR #140)
- PF5-H1B progressive facet disclosure (PR #142)
- PF5-A2 semantic UL/LI result list (PR #151)
- PF5-A3A content-type single-select (PR #156)
- PF5-A3B facet availability presenter (PR #157)
- PF5-A3B1 presenter layout + `searchFacetLabels.js` (PR #158)
- Pagefind index-hygiene (PR #149), seed-token leak (PR #153), navbar zero-results (PR #154)

Reference evidence:

- [pf1-user-facing-discovery-model-audit-2026-08-16.md](./pf1-user-facing-discovery-model-audit-2026-08-16.md)
- [pf-perf1-pagefind-startup-performance-audit-2026-08-16.md](./pf-perf1-pagefind-startup-performance-audit-2026-08-16.md) — remains queued for P1 (post-closure)
- [pf4-result-card-hierarchy-closure-2026-08-16.md](./pf4-result-card-hierarchy-closure-2026-08-16.md)
- [pagefind-search-quality-baseline-2026-08-25.md](./pagefind-search-quality-baseline-2026-08-25.md) — regression baseline

Reopen conditions: new repo-evidenced discovery-parity regression, or a new domain joining the shared presenter. Otherwise `MAINTENANCE`.

## 6. UX / Content Experience

### UX1 — Content experience refinement

Status: POST-CLOSURE

This comes after the current Architecture Closure priorities, not before them.

Candidate areas:

- homepage information architecture refinement
- clearer Research / Teaching / Societal impact / Expert work orientation
- award presentation so personal and project/team recognition do not blur together
- stronger impact visibility
- possible content role for feedback/testimonial material
- cross-domain related-content surfaces

These are valid future improvements, but they should not reopen the closed foundation architecture casually.

## 7. Performance and Final Gate

### P1 — Performance budgets

Status: LATER / BASELINE FIRST

This lane starts only after architecture-closure baselines are measured clearly enough to distinguish real regressions from accepted domain complexity.

Measure first:

- Pagefind startup and first-interaction latency
- search-dialog readiness and recovery behavior
- archive/table interaction cost on converged surfaces
- build-time cost where convergence moves work away from runtime

Do not use performance language to protect duplicate architecture from deletion.

### AC1 — Architecture Closure 1.0

Status: `CLOSED / GREEN / MAIN`

AC1 was the closure decision after the active architecture workstreams were proven, simplified, and documented. Every closure expectation is met on current `main`. See [architecture-closure-1-0-closure-2026-08-29.md](./architecture-closure-1-0-closure-2026-08-29.md).

Closure expectations (all met):

- active T1 slices completed to a justified stopping point → T1 = `CLOSED / MAINTENANCE`
- O1 widened, deferred, or bounded with explicit repo evidence → O1 = `CLOSED / MAINTENANCE`
- N1 baseline accessibility/navigation issues closed → N1 = `CLOSED / GREEN / MAIN`
- C1 deletions landed alongside the work they replace → C1 = `EFFECTIVELY CLOSED` (cross-cutting, lane-attached)
- PF5 audit resolved to `GO`, `REDUCE`, or `NO-GO` → resolved as `REDUCE, incremental` across 10 slices; PF5 = `CLOSED / MAINTENANCE`
- later lanes such as R1, P1, and UX1 either intentionally deferred or advanced with evidence → all three remain `LATER / POST-CLOSURE` with reasoning

Reopen conditions: new duplicate content ownership; canonical semantics moved into browser JS; Pagefind becoming canonical storage; new runtime JSON → HTML architecture duplicating SSR; loss of FI/EN parity in shared architecture; removal of a public contract without consumer proof; regression in source/landing/context semantics.

## 8. Sequencing (historical)

Operational model at closure:

```text
Foundation                     CLOSED
  -> Architecture Closure      CLOSED / GREEN / MAIN
     -> T1                     CLOSED / MAINTENANCE
     -> O1                     CLOSED / MAINTENANCE
     -> N1                     CLOSED / GREEN / MAIN
     -> C1                     CROSS-CUTTING (effectively closed)
     -> PF5                    CLOSED / MAINTENANCE
     -> Presentations Slice 3  CLOSED / GREEN / MAIN
  -> R1 / P1 / UX1             POST-CLOSURE / LATER
  -> AC1                       CLOSED / GREEN / MAIN
```

Historical execution order (all now closed):

1. `T1` Timeline 2.0 closed on `main` at T1B2C. Maintenance only.
2. `O1` detail-orientation closed on `main` at Presentations + Media widening (PR #122).
3. `N1` closed on `main` via native `<dialog>` focus containment (PR #124, PR #125).
4. `C1` resolved cross-cutting: deletions landed alongside every host workstream (O1 widening removed two hardcoded hub links; PR #127 replaced the custom a11y toolbar with the native Popover API; PR #159 Presentations Slice 3 deleted `archiveCardHtml()` + 10 helpers + the runtime cards asset; PR #152 memoized heavy build loaders; PR #149 removed leaking Pagefind metadata injection).
5. `PF5` resolved implementation-first as `REDUCE, incremental` — 10 slices from PF5-G1 through PF5-A3B1 (PR #131 through PR #158).
6. Presentations Slice 3 closed via PR #159; single Nunjucks card renderer.
7. `R1`, `P1`, `UX1` remain intentionally post-closure / later.
8. `AC1` closed via this reconciliation + closure doc chain ([architecture-closure-current-state-reconciliation-2026-08-29.md](./architecture-closure-current-state-reconciliation-2026-08-29.md), [architecture-closure-1-0-closure-2026-08-29.md](./architecture-closure-1-0-closure-2026-08-29.md)).

The Architecture Closure execution sequence is complete. This roadmap is now historical / maintenance guidance rather than an active migration queue.

## 9. Status Snapshot

- Canonical Content v1 = CLOSED / GREEN / MAIN
- primary Find & Explore domain migrations = CLOSED / GREEN
- Research contextual discovery = CLOSED / GREEN / MAIN
- Presentations Find & Explore = CLOSED / GREEN / MAIN
- Presentations Slice 3 (SSR-all-cards) = CLOSED / GREEN / MAIN (PR #159)
- Media Find & Explore = CLOSED / GREEN / MAIN
- Architecture Closure = CLOSED / GREEN / MAIN
- T1 = CLOSED / MAINTENANCE
- T1A = CLOSED / GREEN / MAIN
- T1B1 = foundation evidence complete
- T1B2A = CLOSED / GREEN / MAIN
- T1B2B = CLOSED / GREEN / MAIN
- T1B2C = CLOSED / GREEN / MAIN (PR #119)
- T1B3 = DEFER (no repo-evidenced trigger)
- O1 core = CLOSED / GREEN / MAIN
- O1 widening = CLOSED / GREEN / MAIN (PR #122)
- O1 = CLOSED / MAINTENANCE
- N1 = CLOSED / GREEN / MAIN (PR #124, PR #125)
- C1 = CROSS-CUTTING (effectively closed via lane-attached deletions)
- R1 = ACTIVE / BOUNDED POST-CLOSURE (per [r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md](./r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md); R1-B1 unblocked)
- PF5 = CLOSED / MAINTENANCE (10 slices PR #131 through PR #158)
- P1 = LATER / BASELINE FIRST
- UX1 = POST-CLOSURE
- AC1 = CLOSED / GREEN / MAIN

This roadmap is now historical / maintenance guidance. Active planning has ended for Architecture Closure 1.0; see [architecture-closure-1-0-closure-2026-08-29.md](./architecture-closure-1-0-closure-2026-08-29.md) for the closure record and [architecture-closure-current-state-reconciliation-2026-08-29.md](./architecture-closure-current-state-reconciliation-2026-08-29.md) for the underlying current-state audit. Reopen conditions are listed in the AC1 section above.
