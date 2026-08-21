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

Status: IMPLEMENTATION GREEN / REVIEW (branch)

Baseline regression (home/search-dialog keyboard focus / focus-trap) is fixed on the N1 implementation branch pending review + merge. Roadmap status becomes `CLOSED / GREEN / MAIN` only after merge.

Current implementation model:

- native `<dialog>` owns modality, top layer, background inertness, and native Escape/cancel
- `site-ui.js` owns only Chromium's cyclic Tab boundary wrap, initial Pagefind input focus, and exact focus return to the trigger
- Pagefind keeps ownership of its own UI content and internal focusable controls
- FI and EN nav templates share the same `<dialog id="searchOverlay">` markup and JS

Deletions accomplished vs prior custom-overlay implementation:

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

Goal — all met on branch:

- relevant accessibility/navigation tests green without a baseline exception ✓
- FI / EN parity ✓
- keyboard focus order ✓
- focus trap ✓
- focus return ✓
- search-dialog recovery behavior ✓

Branch-level validation:

- isolated `Search dialog traps focus` × 30 = 30/30 PASS
- full `tests/navigation.spec.js` × 20 (100 test invocations incl. new EN parity) = 100/100 PASS
- zero focus escape, zero lost Tab presses, zero order corruption
- `tests/accessibility.spec.js` + `tests/accessibility-tools.spec.js` + `tests/contrast.spec.js` = 34/34 PASS
- `npm run test:unit` = 602/602 PASS
- `npm run build:no-og` = PASS
- `git diff --check` = clean

This is an architecture-closure priority, not a cosmetic polish item.

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

Status: LATER

Target:

- make content relationships more visible
- use only existing canonical semantics
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

Hard boundaries:

- no new taxonomy
- no Research inference from topic mapping
- no embedding / LLM recommender
- no parallel knowledge-graph content model

## 5. PF5 Global Result Parity

### PF5 — GLOBAL RESULT PARITY

Status: `GATED / AUDIT FIRST`

Do not start PF5 implementation automatically.

Audit first across:

- navbar Pagefind
- `/haku/`
- `/en/search/`
- domain-specific Pagefind result presenters

The audit must answer:

- which differences are real user problems?
- which differences are intentional domain differences?
- what can be unified at shared projection / presenter level?
- what would add abstraction with no real user benefit?

Allowed outcomes:

- `GO`
- `REDUCE`
- `NO-GO`

Reference evidence:

- [pf1-user-facing-discovery-model-audit-2026-08-16.md](./pf1-user-facing-discovery-model-audit-2026-08-16.md)
- [pf-perf1-pagefind-startup-performance-audit-2026-08-16.md](./pf-perf1-pagefind-startup-performance-audit-2026-08-16.md)
- [pf4-result-card-hierarchy-closure-2026-08-16.md](./pf4-result-card-hierarchy-closure-2026-08-16.md)

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

Status: FINAL GATE

This final gate is not a feature lane of its own. It is the closure decision after the active architecture workstreams have been proven, simplified, and documented.

Closure expectations:

- active T1 slices completed to a justified stopping point
- O1 widened, deferred, or bounded with explicit repo evidence
- N1 baseline accessibility/navigation issues closed
- C1 deletions landed alongside the work they replace
- PF5 audit resolved to `GO`, `REDUCE`, or `NO-GO`
- later lanes such as R1, P1, and UX1 either intentionally deferred or advanced with evidence

## 8. Current Sequencing

Operational model:

```text
Foundation                     CLOSED
  -> Architecture Closure      ACTIVE
     -> T1                     CLOSED / MAINTENANCE
     -> O1                     CLOSED / MAINTENANCE
     -> N1                     NEXT
     -> C1                     CROSS-CUTTING
  -> R1 / PF5 audit / P1
  -> UX1
  -> AC1 final gate
```

Current operating order:

1. `T1` Timeline 2.0 is closed on `main` at T1B2C. It stays in maintenance until repo evidence triggers a further slice; do not reopen for `T1B3` without such evidence.
2. `O1` detail-orientation is closed on `main` at the Presentations + Media widening (PR #122). Core covers Publications, Theses, and Writings; widening extends the same primitive to Presentations and Media local detail pages while preserving external-first identity and external-source primacy respectively. O1 reopens only on new repo-evidenced orientation regressions or a new domain requiring explicit suitability review.
3. `N1` is now the active Architecture Closure workstream for known accessibility/navigation baseline issues, starting from the home/search-dialog keyboard focus and focus-trap regression.
4. `C1` applies to every real implementation lane above rather than waiting as a separate finishing pass. O1 closure already landed the two hardcoded domain-specific hub-control deletions alongside the widening.
5. `R1`, `PF5`, and `P1` stay behind the active closure lanes unless repo evidence justifies earlier movement.
6. `UX1` belongs after closure pressure has reduced architectural duplication.
7. `AC1` is the final closure gate, not an immediate build lane.

## 9. Status Snapshot

- Canonical Content v1 = CLOSED / GREEN / MAIN
- primary Find & Explore domain migrations = CLOSED / GREEN
- Research contextual discovery = CLOSED / GREEN / MAIN
- Presentations Find & Explore = CLOSED / GREEN / MAIN
- Media Find & Explore = CLOSED / GREEN / MAIN
- Architecture Closure = ACTIVE
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
- N1 = IMPLEMENTATION GREEN / REVIEW (branch; CLOSED / GREEN / MAIN only after merge)
- C1 = CROSS-CUTTING
- R1 = LATER
- PF5 = GATED / AUDIT FIRST
- P1 = LATER / BASELINE FIRST
- UX1 = POST-CLOSURE
- AC1 = FINAL GATE

This is the active roadmap until repo evidence shows a new primary phase.
