# F4-R2 Presentation Context Projection Audit

Date: 2026-08-15
Worktree: `temporary clean worktree snapshot`
Branch: `codex/f4-r1-research-eligibility`

## 1. Scope

This checkpoint applies one projection-only change for presentations:

- preserve existing matched local-detail `contexts` on canonical presentation records
- preserve the same `contexts` on Pagefind presentation records
- do not change `/tutkimus/`
- do not change Research mount scopes
- do not change `resolveContexts()`
- do not change presentation topic mapping
- do not infer contexts for unmatched or external-only canonical presentations

## 2. R1 Starting State

R1 already preserved existing Research eligibility for publications, theses, and writings. Presentation topic mapping already existed, but presentation `contexts` were not surviving the canonical/Pagefind projection path.

## 3. Existing Presentation Context Mechanism

Authoritative presentation `contexts` already existed on matched local presentation detail content. Those values came from the existing content-context pipeline and were already used on the detail-side source data before canonical archive projection.

No new context model was introduced in R2.

## 4. Detail-Level Context Counts

- Canonical presentations: 218
- Local presentation details: 139
- Local details with any `contexts`: 140 canonical matches after projection
- Local details with `research` context: 33

The `140` projected canonical count reflects all canonical records matched from local detail provenance, including alternate local representations that resolve to canonical archive identities.

## 5. Canonical-Level Context Counts Before

Before the R2 projection fix:

- canonical presentations with `research` context: 0
- Pagefind presentation records with `research` context: 0

## 6. Data-Flow Trace

Existing flow before fix:

1. local presentation details were read with existing `contexts`
2. canonical archive items were rebuilt into a public shape
3. presentation Pagefind records were built from canonical/public items
4. `contexts` were dropped at the canonical public projection seam

## 7. Exact Context-Loss Point

The loss happened in the canonical presentation projection path in [`src/_data/presentationsPage.js`](../src/_data/presentationsPage.js), where matched local-detail context values were not copied onto the canonical/public records later used by Pagefind.

## 8. Diagnosis

Diagnosis: **B**

- existing semantics were already authoritative enough for matched local details: **YES**
- the bug was a projection gap, not a missing classification
- recomputing canonical contexts from the public archive shape would have been unsafe because that shape carries extra non-authoritative signals

## 9. Implementation

Changed files:

- [`src/_data/presentationsPage.js`](../src/_data/presentationsPage.js)
- [`scripts/_lib/presentationPagefind.js`](../scripts/_lib/presentationPagefind.js)
- [`scripts/audit-presentation-detail-parity.js`](../scripts/audit-presentation-detail-parity.js)
- [`scripts/audit-f4-research-built-output.js`](../scripts/audit-f4-research-built-output.js)
- [`scripts/audit-presentation-context-projection.js`](../scripts/audit-presentation-context-projection.js)
- [`tests/unit/presentationsPage.test.js`](../tests/unit/presentationsPage.test.js)
- [`tests/unit/presentationResearchTopics.test.js`](../tests/unit/presentationResearchTopics.test.js)

Implementation details:

- matched local-detail `contexts` are normalized once and preserved onto canonical presentation items
- unmatched/external-only canonical presentations keep unknown membership and receive no inferred `contexts`
- Pagefind presentation records now carry preserved `PresentationContext` metadata when present
- parity audit now verifies `contexts` preservation too

## 10. Why No New Classification Was Created

- new classification created: **NO**
- new membership rule created: **NO**
- `resolveContexts()` modified: **NO**
- Research topic mapping changed: **NO**

R2 only projects already-existing matched local-detail `contexts`.

## 11. Canonical Context Counts After

- canonical presentations: 218
- canonical presentations with any preserved `contexts`: 140
- canonical presentations with `research` context: 33
- Pagefind presentation records with `research` context: 33
- unmatched canonical presentations with inferred `contexts`: 0

## 12. Research-Eligible Presentation Count

Under the existing context rule:

- Research-eligible presentations: 33
- Research-ineligible or unknown presentations: 185
- Research-eligible local-first: 33
- Research-eligible external-first: 0

## 13. Multi-Context Behavior

All 33 Research-context presentations preserved their multi-context values.

Research-context combinations after projection:

- `education|research|teaching`: 31
- `research|teaching`: 1
- `business|research|teaching`: 1

Multi-context Research presentations: 33

## 14. Topic Mapping vs Membership

Research membership is not the same thing as safe Research topic mapping.

After projection:

- Research-eligible + safe Research topic mapping: 32
- Research-eligible without safe Research topic mapping: 1
- safe-topic-mapped but non-Research: 136

This is expected. Topic mapping remains evidence for discovery/filtering readiness, not authoritative Research membership.

## 15. Eligibility Samples

Evidence classes after projection:

- matched local-detail Research-context presentations now project deterministically into canonical/Pagefind records
- unmatched or external-only canonical presentations remain outside authoritative Research membership unless they already had matched local detail provenance

## 16. Provenance Evidence

Verified by `node scripts/audit-presentation-context-projection.js`:

- local details with `research`: 33
- canonical with `research`: 33
- Pagefind with `research`: 33
- `/tutkimus/` scopes remain `publications,theses,writings`

## 17. Presentation Regressions

Passed:

- `node scripts/audit-presentations-page-projection.js`
- `node scripts/audit-presentation-detail-parity.js`
- `node scripts/audit-presentations-page-client-parity.js`
- `node scripts/audit-presentations-f3c-p3-integration.js`
- `node scripts/audit-presentations-f3c-p6-built-output.js`
- `node scripts/audit-presentation-pagefind.js` from isolated temp cwd
- `node scripts/audit-presentation-topic-mapping.js` from isolated temp cwd
- `PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test --workers=1 tests/presentations-research-smoke.spec.js tests/presentations-archive.spec.js`

## 18. F4 Regressions

Passed:

- `node scripts/audit-f4-research-built-output.js`
- `PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test --workers=1 tests/f4-research-find-explore.spec.js`

Result:

- presentations still do **not** mount into `/tutkimus/`
- Research contextual Find & Explore remains scoped to `publications,theses,writings`

## 19. Existing-Scope Regressions

Passed:

- `npm run build:no-og`
- `npm run test:unit`
- `node scripts/audit-writings-built-output.js`
- `node scripts/audit-writings-page-projection.js`
- `node scripts/audit-writings-pagefind.js`
- `node scripts/audit-thesis-details-parity.js`
- `node scripts/audit-thesis-pagefind.js`
- `node scripts/audit-publication-details-parity.js`
- `node scripts/audit-publications-page-projection.js`
- `node scripts/audit-publication-pagefind.js`

## 20. Readiness for Research Rollout

This R2 checkpoint is ready for review because it restores authoritative presentation context provenance to canonical and Pagefind records without changing Research membership semantics or `/tutkimus/` scope.

## 21. Remaining Gaps

- external-only or unmatched canonical presentations still have no authoritative context membership
- safe Research topic mapping still exceeds authoritative Research membership
- `/tutkimus/` remains intentionally unchanged in this checkpoint

## 22. R3 Recommendation

R3 should decide whether presentation Research rollout, if desired later, must require authoritative canonical membership from preserved local-detail contexts only, or some separately approved broader provenance rule.
