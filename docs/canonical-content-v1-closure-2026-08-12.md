# Canonical Content v1 Closure Report

Date: 2026-08-12
Status: CLOSED / GREEN

## Scope closed

Canonical content architecture v1 is now closed for the four piloted content domains:

- presentations
- publications
- theses
- writings

The v1 target state is now live in the merged codebase:

- canonical content objects
- allowlist-based public page projections
- FI and EN archive/list views on canonical datasets
- detail HTML where introduced by the pilot
- Pagefind and existing downstream consumers reading canonical HTML / projections

## Final merge and release point

- PR: #82
- PR title: `Canonical content architecture v1: presentations, publications, theses and writings`
- PR merge commit on `main`: `db2432d1239e3c1553939958be468923fb19c4b7`
- Release tag: `canonical-content-v1`
- Tag message: `Canonical content architecture v1`
- Tag target commit: `db2432d1239e3c1553939958be468923fb19c4b7`

## Included docs verified on main

The merged `main` state includes the architecture and follow-up documents required for closure, including:

- `docs/canonical-content-contract-v1.md`
- `docs/canonical-content-contract-c2-report-2026-08-11.md`
- `docs/canonical-url-source-semantics-audit-2026-08-11.md`
- `docs/find-explore-roadmap-2026-08-12.md`

## Final validation evidence

Local validation before final merge completion:

- `npm run build:no-og` -> passed
- `npx playwright test tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js` -> 31/31 passed

Final GitHub required checks on PR head `d7dd44ea2fe187ed4121d98e64c3ac715f6fe9ef`:

- `build-and-verify` -> passed in 7m45s
- `playwright` -> passed in 4m14s

Additional earlier pilot gates already documented in the repo remained green:

- canonical projection parity
- client parity
- detail parity
- thesis Pagefind detail ranking parity
- shared contract validation

## Release note

One final post-PR fix was required before closure:

- `fix: include slideshare analysis data in canonical build`
- `fix: add accessible sort labels to writings archive`

These fixes did not change the canonical architecture target. They closed CI/runtime packaging and accessibility regressions discovered during release gating.

## What is intentionally not part of v1

Canonical content v1 is closed before any new Find & Explore runtime work.

Not included in this release closure:

- F1 / Find & Explore implementation
- C4 follow-up migrations
- new URL cleanup beyond the C3 audit
- broader content-quality curation outside already completed pilot scopes

## Next state

Canonical content v1 is now frozen as a tagged release baseline.

Next work starts from the published post-v1 roadmap:

- `docs/find-explore-roadmap-2026-08-12.md`
