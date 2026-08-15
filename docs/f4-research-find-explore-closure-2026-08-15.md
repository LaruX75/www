# F4 Research Find & Explore Closure

Date: 2026-08-15
Status: closed

## 1. Scope

This report closes the F4 Research eligibility and presentations rollout after PR #89 was merged into `main`.

Included scope:

- R1 Research eligibility based on existing `research` context membership
- R2 presentation context projection from matched local details into canonical/Pagefind records
- R3 presentation inclusion in Research Find & Explore only when authoritative `research` context exists

Excluded scope:

- M2 media work
- broader presentation provenance expansion
- any Research semantic redesign

## 2. PR and Merge Information

- PR: `#89`
- Title: `Apply Research eligibility and add eligible presentations to Research discovery`
- PR head SHA: `599f32189fad583fad35cb4deff582e77a7666c5`
- Merge commit SHA: `ef4d948fb2f3d41889cfcfafd123b0ab12960cf2`
- Merged into: `main`

## 3. Main/Head Verification

Verified on 2026-08-15:

- GitHub PR #89 is `merged: true`
- GitHub `main` HEAD is `ef4d948fb2f3d41889cfcfafd123b0ab12960cf2`
- local clean closure worktree was created detached at `origin/main`
- local closure worktree HEAD matched `origin/main`
- merge commit message on `main` is `Merge pull request #89 from LaruX75/codex/f4-r1-research-eligibility`

## 4. Post-Merge GitHub Checks

Required post-merge `main` checks completed green:

- `generate`: `success`
- `build`: `success`
- `playwright`: `success`

Additional downstream jobs observed green:

- `deploy`: `success`
- `smoke`: `success`

## 5. Final Research Membership Rule

Final membership rule:

- `contexts.includes("research")`

This remains the only Research membership rule used by the rollout.

## 6. R1 Summary

R1 closed the broad-scope gap by reusing the existing `research` context instead of treating writings as a whole-scope Research bucket.

Result:

- Research eligibility now uses existing `research` context membership
- writings are no longer included as a whole broad scope
- writings, theses, and publications preserve existing overlapping context semantics

## 7. R2 Summary

R2 preserved matched local-detail presentation contexts into canonical and Pagefind projection layers.

Result:

- matched local-detail presentation `contexts` now project deterministically into canonical records
- the same authoritative `contexts` reach Pagefind presentation records
- unmatched or external-only canonical presentations do not receive inferred contexts

## 8. R3 Summary

R3 extended Research Find & Explore to include presentations only when authoritative `research` context exists.

Result:

- presentations are included in Research only when existing `research` context membership is present
- safe topic mapping remains evidence and filtering support, not membership
- media remains excluded from Research

## 9. Final Population

- publications: `53`
- theses: `169`
- writings: `62`
- presentations: `33`
- total: `317`

Additional verified presentation guardrails:

- safe-topic-mapped non-Research presentations excluded: `136`
- Research-eligible presentations with safe Research mapping: `32`
- Research-eligible presentations without safe Research mapping: `1`
- duplicate presentation results: none

## 10. Guardrails

- new classification: `NO`
- new membership rule: `NO`
- topic mapping used as membership: `NO`
- `resolveContexts()` semantic change: `NO`
- media included in Research: `NO`

## 11. Verification

GitHub:

- PR #89 merged into `main`
- post-merge `generate`, `build`, and `playwright` checks green on `main`

Local gates run on merge commit `ef4d948fb2f3d41889cfcfafd123b0ab12960cf2`:

- `npm run build:no-og`: `PASS`
- `npm run test:unit`: `PASS (401/401)`
- `node scripts/audit-f4-research-built-output.js`: `PASS`
- `node scripts/audit-presentation-context-projection.js`: `PASS`
- `node scripts/audit-presentation-pagefind.js`: `PASS`
- `npx playwright test --workers=1 tests/f4-research-find-explore.spec.js`: `PASS (3/3)`

Additional archive regressions run:

- `node scripts/audit-writings-built-output.js`: `PASS`
- `node scripts/audit-writings-page-projection.js`: `PASS`
- `node scripts/audit-thesis-details-parity.js`: `PASS`
- `node scripts/audit-thesis-pagefind.js`: `PASS`
- `node scripts/audit-publication-details-parity.js`: `PASS`
- `node scripts/audit-publications-page-projection.js`: `PASS`
- `node scripts/audit-publication-pagefind.js`: `PASS`

Key deterministic audit confirmations:

- Research population remains `317`
- presentations included in Research remain `33`
- safe-topic-mapped non-Research presentations remain excluded
- no duplicate presentation results
- writings did not regress to whole-scope inclusion

## 12. Known Non-Goals

- M2 media is not included
- broader presentation provenance was not introduced
- the Pagefind user-facing discovery model was not redesigned beyond the approved F4 rollout

## 13. Next Recommended Step

- M2 Media Pagefind Metadata + Find & Explore Preset
