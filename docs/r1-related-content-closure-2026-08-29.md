# R1 — Related-Content Closure

Date: 2026-08-29

## Status

`CLOSED / MAINTENANCE`

Post-closure convergence completed to a justified stopping point per the R1
evidence chain (R1-A → R1-B0 → R1-ADR1 → R1-B1). Related-content
production model is now consistent across every consuming detail surface
under a single shared SSR include, with a documented and bounded semantic
ranking boundary. This closure record does not reopen AC1.

## Repository state

- `origin/main`: `707be9155db48e289b859ae40755815716862a85` (after PR #166 R1-B1 merged as `707be915`).
- R1 evidence chain on `main`:
  - `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md`
  - `docs/r1b0-semantic-related-content-reconciliation-audit-2026-08-29.md`
  - `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md`
  - `docs/r1b1-thesis-related-content-surface-convergence-2026-08-29.md`
- `docs/architecture-closure-1-0-closure-2026-08-29.md` — unchanged. `architecture-closure-1-0` tag → `41b88d25`.

## Original R1 target

Per the 2026-08-20 roadmap §4:

> Make content relationships more visible, using only existing canonical semantics, preferring SSR projections.

Hard-boundary shorthand at the time: `no embedding / LLM recommender`. That shorthand later required precise revision under ADR1 because the production `computeRelatedContent` path already carried a pre-closure embedding-derived boost.

## R1-A — suitability audit (2026-08-29)

Established that R1 was **not green-field**. The `relatedContent` Eleventy filter + `content-context-sidebar.njk` were already deployed on five detail templates (Publications, Presentations, Media, Blog, Writings), producing deterministic SSR related-content projections. Coverage measurements on the built projections showed 87–100 % category-based sibling reach across Publications / Presentations / Media / Theses.

Identified **one repo-evidenced gap**: Thesis detail pages (`src/opinnaytteet/thesis-details.njk`, actually rendered via `src/_includes/thesis-detail-body.njk`) had zero related-content markers despite theses already contributing candidates into other domains' lists.

R1-A decision: **C — Partial suitability.** R1-B1 (add sidebar to thesis detail) proposed as the smallest bounded next slice.

Amendment: R1-B1 marked **BLOCKED pending R1-B0** because extending the current filter to a new template would extend the embedding contribution to that template.

## R1-B0 — semantic reconciliation (2026-08-29)

Read-only ablation of `computeRelatedContent` with production `semanticRelated` map vs `semanticRelated = {}` (equivalent to `SEM_WEIGHT = 0`, per `tests/unit/related-content-hybrid.test.js:1`). Sample n = 50 items (10 per consuming domain), deterministic evenly-spaced date-desc picks. Candidate pool 747 items.

Headline result:

| Metric | Value |
| --- | --- |
| No-change (identical top-K) | 36/50 (72 %) |
| Any change | 14/50 (28 %) |
| Semantic rescues (manual quality classification) | 7 |
| Semantic harms (manual quality classification) | 1 |
| Coverage difference | 0 (48/48 items ≥ 1 result in both variants) |
| Publications semantic effect | zero (10/10 no-change) |
| Presentations semantic effect | zero (10/10 no-change) |
| Media clear rescue rate | 30 % |
| Blog clear rescue rate | ~10 % |
| Writings clear rescue rate | 30 % |

R1-B0 decision: **B — Semantic layer materially useful but conflicts with current R1 contract.** Escalated to R1-ADR1.

## R1-ADR1 — architecture decision (2026-08-29)

Retained the existing pre-closure semantic layer (`src/_data/semanticRelated.json` + `scripts/build-semantic-related.js` + the `SEM_WEIGHT` branch in `computeRelatedContent`) as **bounded auxiliary ranking infrastructure**.

Old R1 hard-boundary shorthand replaced with the precise formulation:

> No embedding- or LLM-derived signal may define canonical identity, taxonomy, `contexts`, Research membership, source/landing semantics, content ownership, or candidate eligibility. Existing pre-closure semantic similarity may remain as bounded auxiliary ranking infrastructure where measured user value exists, provided canonical candidates and destinations remain authoritative.
>
> New embedding/LLM infrastructure is not authorized by this decision. Any change adding or extending embedding/LLM infrastructure requires a separate architecture decision backed by new measurement evidence.

R1-B1 unblocked after ADR1. See `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md` for the full ADR.

## R1-B1 — Thesis surface convergence (PR #166)

- One include added to `src/_includes/thesis-detail-body.njk:151` — the shared `{% include "content-context-sidebar.njk" %}` inside the existing `<aside class="col-lg-4">`, matching the placement pattern at `publication-item-body.njk:122`.
- One regression spec added (`tests/r1b1-thesis-related-content.spec.js`, 3 cases): FI thesis sidebar with canonical destinations and no self-reference; no-JS SSR proof (`javaScriptEnabled: false`); EN thesis sidebar renders.
- FI + EN parity verified on 5 representative built theses (rich, rich-2, sparse, multi-context, EN).
- Canonical destinations verified on every rendered link (local `/opinnaytteet/…` / `/julkaisut/…` / `/mediassa/…` / `/YYYY/…` or OuluREPO handle URLs — no URL fabricated only from `semanticRelated.json`).
- CI on the PR: **Staging checks PASS (5m32s)**, **Accessibility and navigation tests PASS (10m55s)**.
- Merged as `707be9155db48e289b859ae40755815716862a85` at `2026-08-29T17:43:37Z`.

No canonical fields added. No scoring change. No embedding change. No Pagefind change. No browser JS added. No runtime JSON fetch introduced.

## Final production model

```text
canonical content + canonical relationships
        ↓
canonical candidate pool  (uniqueContentItems in computeRelatedContent)
        ↓
canonical scoring         (categories ×5, keywords ×3, contexts ×4, tags ×2, type ×2)
     +
bounded retained          (SEM_WEIGHT ×5 when sim ≥ SEM_MIN = 0.6, sourced from
semantic ranking boost     src/_data/semanticRelated.json — auxiliary only)
        ↓
Eleventy / Nunjucks       (relatedContent filter → content-context-sidebar.njk)
        ↓
SSR related-content       (build-time; no browser JS, no runtime fetch)
sidebar
        ↓
canonical landing / approved source destination
```

Semantic similarity is **ranking infrastructure, not canonical relationship authority.** Every candidate that appears in a related-content sidebar exists in the canonical candidate pool; the semantic boost affects the order in which those canonical candidates surface within the default top-4 limit.

## Canonical authority boundary

Canonical semantics remain authoritative. Under this closure the following remain the exclusive property of the canonical content layer:

- identity
- URLs
- content type
- `contexts`
- topics / categories / keywords semantics
- source / landing semantics
- metadata
- JSON-LD
- domain-specific semantics
- Research membership

No R1 slice modified any of these. `Canonical Content v1` (per `docs/canonical-content-v1-closure-2026-08-12.md`) is untouched by R1.

## Semantic ranking boundary

Per ADR1, the retained semantic layer may:

- contribute an additive ranking boost inside `computeRelatedContent`
- retain current `SEM_WEIGHT = 5` and `SEM_MIN = 0.6`
- retain the current per-anchor top-K structure
- be regenerated from the existing embedding cache when URL churn exceeds a documented staleness threshold

It may NOT:

- define canonical identity, taxonomy, `contexts`, Research membership, source/landing semantics, or content ownership
- decide candidate eligibility (the pool is canonical-only)
- create new canonical items or URLs
- be exposed as a public knowledge-graph JSON contract
- introduce browser-side embedding, runtime inference, runtime vector search, or client-side parallel content models

Any future change that would extend the semantic surface, add new embedding/LLM infrastructure, or introduce runtime inference requires a **separate architecture decision backed by new measurement evidence** (per ADR1).

## Domain coverage

Verified consumers of the shared `content-context-sidebar.njk` include on `main` after R1-B1:

| Domain | Consumer template | Rendering | Status |
| --- | --- | --- | --- |
| Publications | `src/_includes/publication-item-body.njk:122` | SSR | CLOSED / stable since PR #85 F3B era |
| Presentations | `src/_includes/presentation-item.njk:109` | SSR | CLOSED / stable |
| Media | `src/_includes/media-item.njk:127` | SSR | CLOSED / stable (M2 closure) |
| Blog | `src/_includes/blog-post.njk:130` | SSR | CLOSED / stable |
| Writings | `src/_includes/writing-post.njk:188` | SSR | CLOSED / stable |
| **Theses** | `src/_includes/thesis-detail-body.njk:151` | SSR | **CLOSED via R1-B1 (PR #166, merge `707be915`)** |
| Generic markdown pages | `src/_includes/page.njk:37` | SSR | Pre-existing generic consumer; not a discrete R1 domain |

R1-B1 evidence for Theses specifically:

- R1-B1 merged via **PR #166** (merge commit `707be9155db48e289b859ae40755815716862a85`).
- **Shared include reused** unchanged (`content-context-sidebar.njk`).
- **FI / EN tested**: FI (`/opinnaytteet/62699/`, rich; also rich-2, sparse, multi-context) and EN (`/opinnaytteet/48497/`) verified on built pages.
- **SSR / no-JS tested**: the sidebar renders with `javaScriptEnabled: false` in Playwright — assertion enforced in `tests/r1b1-thesis-related-content.spec.js`.
- **Canonical destinations verified**: 5 representative built theses inspected; every related href resolves to either a local site path or an OuluREPO handle URL, never a URL fabricated only from `semanticRelated.json`.
- **CI green** on both required workflows.

## SSR / client boundary

Related content remains build-time / SSR-first. There is no browser JS that fetches candidates, constructs cards, sorts candidates, or renders related-content HTML on any consuming surface. There is no runtime JSON → related-content HTML path. This boundary is preserved by every R1 slice and enforced by ADR1.

## Deletion assessment

**No deletion is required to close R1.**

- Per ADR1: `src/_data/semanticRelated.json`, `scripts/build-semantic-related.js`, and the semantic branch in `computeRelatedContent` are retained pending future re-measurement.
- R1-B1 introduced no duplicate Thesis renderer — it reused the shared include, so nothing became obsolete.
- No R1 slice created deletable dead code.

### Independent cleanup candidate (not bundled into R1 closure)

- `src/_includes/related-presentations.njk` — **original R1 closure claim: "remains orphaned on `main`"; corrected 2026-08-30 by RP-CONVERGE-01.** Both this line and R1-A missed a live FI-only consumer in `src/fi/yritys.md` (the `/kouluttaja/` "Viimeisimpiä koulutusesityksiä" strip). The next post-closure workstream selection audit (`docs/post-closure-next-workstream-selection-audit-2026-08-29.md`) re-verified the consumer and selected RP-CONVERGE-01 as the next slice; RP-CONVERGE-01 converged the legacy `canva.tableRows` + `sivuyhteys` path onto the canonical `presentationContextGroups` projection (group id `veso-taydennyskoulutus`), then deleted the partial and its unique CSS selector. See `docs/rp-converge-01-company-presentations-convergence-2026-08-30.md`. R1's substantive closure conclusions are unchanged; this correction is factual only.

## Maintenance / reopen conditions

R1 should reopen only on new repo evidence such as:

- a new detail domain needing related-content suitability review
- duplicate related-content ownership appearing
- browser JS beginning to construct canonical related-content lists
- semantic similarity beginning to control candidate eligibility
- semantic infrastructure beginning to define canonical semantics
- source / landing / context semantics regressing
- material related-content quality regression measured against the R1-B0 baseline

R1 should NOT reopen for:

- cosmetic card tweaks
- optional ranking experimentation
- generic taxonomy expansion
- embeddings experimentation (would be a new architecture decision, not an R1 slice)
- unrelated cleanup work (e.g., the `related-presentations.njk` FI-only legacy path that RP-CONVERGE-01 subsequently converged and deleted on 2026-08-30)

## Architecture Closure status

**Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.** R1 closure does not reopen AC1. This is post-closure convergence completed to a justified stopping point, respecting AC1's reopen conditions and Canonical Content v1's authority.

Next-workstream rule: future work should be selected independently from current repo evidence as regression, maintenance, cleanup (e.g., the `related-presentations.njk` orphan), performance, UX, or new feature work — not chosen mechanically as an "R2" or a semantic-recommender extension.
