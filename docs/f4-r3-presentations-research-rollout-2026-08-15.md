# F4-R3 Presentations Research Rollout

Date: 2026-08-15

## 1. Scope

R3 extends the existing F4 Research Find & Explore scope from `publications,theses,writings` to `publications,theses,writings,presentations` without changing Research membership semantics, presentation topic mapping, archive behavior, or canonical presentation rules.

## 2. R1/R2 baseline

R1 established the existing Research eligibility counts and preserved writings semantics.

R2 established deterministic projection of matched local-detail presentation contexts onto canonical/Pagefind presentation records:

- canonical presentations: 218
- local presentation details: 139
- local details with research context: 33
- canonical presentations with research context: 33
- Pagefind presentation records with research context: 33
- research-eligible local-first presentations: 33
- research-eligible external-first presentations: 0

## 3. Existing eligibility rule

Research membership remains:

`contexts.includes("research")`

This same existing rule is used for publications, theses, writings, and presentations.

No new classification or membership model was introduced.

## 4. Before counts

- publications: 53
- theses: 169
- writings: 62
- presentations: 0
- total: 284

## 5. Presentation eligibility verification

Current authoritative presentation eligibility recomputed from the built canonical data:

- canonical presentations: 218
- authoritative Research-eligible presentations: 33
- Research-eligible local-first presentations: 33
- Research-eligible external-first presentations: 0
- eligible + safe Research topic mapping: 32
- eligible without safe Research topic mapping: 1
- safe-topic-mapped but non-Research: 136

Research-context combinations for eligible presentations:

- `business|research|teaching`: 1
- `education|research|teaching`: 31
- `research|teaching`: 1

## 6. Topic mapping vs membership

Membership and topic mapping remain separate:

- the 33 eligible presentations are admitted only by existing `research` context membership
- 32 eligible presentations also have safe Research topic mapping and may participate in Research topic preset matching
- 1 eligible presentation has no safe Research topic mapping and must still appear in generic Research results
- 136 safe-topic-mapped but non-Research presentations remain excluded

No presentation is admitted to Research through topic mapping alone.

## 7. Implementation

Current R3 implementation changes in the worktree:

- [src/fi/tutkimus.md](/private/tmp/www-f4-r1-research-eligibility/src/fi/tutkimus.md) adds presentations to the Research Find & Explore scope and content-type selector
- [src/js/find-explore.js](/private/tmp/www-f4-r1-research-eligibility/src/js/find-explore.js) adds presentation labels, filters, year handling, and Research presentation topic-preset routing
- [scripts/_lib/presentationPagefind.js](/private/tmp/www-f4-r1-research-eligibility/scripts/_lib/presentationPagefind.js) exposes existing presentation `research` context to Pagefind and includes presentation metadata in injected/custom records
- [scripts/run-pagefind.js](/private/tmp/www-f4-r1-research-eligibility/scripts/run-pagefind.js) reuses built local HTML text for presentation custom records
- [scripts/audit-f4-research-built-output.js](/private/tmp/www-f4-r1-research-eligibility/scripts/audit-f4-research-built-output.js) extends the F4 audit to presentations and Research-specific presentation checks
- [scripts/audit-presentation-context-projection.js](/private/tmp/www-f4-r1-research-eligibility/scripts/audit-presentation-context-projection.js) now asserts the Research mount includes presentations
- [tests/f4-research-find-explore.spec.js](/private/tmp/www-f4-r1-research-eligibility/tests/f4-research-find-explore.spec.js) extends Research smoke coverage to authoritative presentations
- [tests/unit/presentationResearchTopics.test.js](/private/tmp/www-f4-r1-research-eligibility/tests/unit/presentationResearchTopics.test.js) asserts the shared `Research context` Pagefind filter
- [src/_includes/presentation-item.njk](/private/tmp/www-f4-r1-research-eligibility/src/_includes/presentation-item.njk) adds Pagefind weight hints to the visible presentation title/lead

## 8. Research scope before/after

- before: `publications,theses,writings`
- after: `publications,theses,writings,presentations`

## 9. Content-type selector behavior

The Research content-type selector now includes:

- publications
- theses
- writings
- presentations

No presentation-specific archive-only controls were added to Research.

## 10. Generic unmapped eligible presentation behavior

PASS.

The eligible presentation without safe Research topic mapping still appears in generic Research results:

- `Quali lecture 1: Understanding the research process`
- landing: `/presentations/ss-quali-lecture-1-understanding-the-research-process/`

## 11. Safe-topic-mapped non-member exclusion

PASS.

Safe topic mapping does not admit non-Research presentations. The verified non-member sample remains excluded from Research:

- `3. luento tieto- ja viestintätekniikan pedagogiset perusteet: tietokoneavusteinen yhteisöllinen oppiminen (CSCL)`

## 12. Preferred landing

PASS.

The authoritative eligible presentation sample resolves to its canonical local landing, and the authoritative eligibility split remains:

- local-first: 33
- external-first: 0

## 13. Result rendering

Presentation results use the existing shared mixed-result rendering. The Research surface continues to show neutral mixed-result metadata without introducing archive-specific presentation controls or redesigning cards.

## 14. After counts

- publications: 53
- theses: 169
- writings: 62
- presentations: 33
- total: 317

## 15. Leakage audit

PASS.

No safe-topic-mapped but non-Research presentation leakage was detected in the current F4 audit.

## 16. Presentation archive regressions

PASS on the existing presentation regression set that was rerun:

- canonical presentations: 218
- local details: 139
- local-first: 138
- external-first: 80
- representations: 231
- duplicate discovery identities: 0
- Pagefind title sample: 20/20 found, 19/20 top1, 20/20 top3, 20/20 correct landing

## 17. Writings/theses/publications regressions

PASS.

Current verified counts and regression status:

- writings eligible: 62
- blogs total / eligible: 70 / 1
- writings eligible by content type:
  - `blogPost`: 1
  - `opinion`: 3
  - `scientificPublication`: 53
  - `speech`: 5
- theses eligible: 169
- publications eligible: 53

Other audit gates rerun successfully:

- writings built output
- writings page projection
- thesis detail parity
- thesis Pagefind
- publication detail parity
- publications page projection
- publication Pagefind

## 18. Other-context preservation

PASS.

Existing multi-context semantics remain intact:

- research writings with multiple contexts: 61
- research presentations with multiple contexts: 33
- societal interaction overlap remains visible
- education/teaching overlap remains visible
- politics/business overlaps remain visible where already present

No flattening or recomputation of contexts was introduced.

## 19. Browser verification

PASS.

`PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/f4-research-find-explore.spec.js tests/presentations-research-smoke.spec.js --config playwright.config.js`

Result: 4 passed.

## 20. Accessibility/navigation/contrast

PASS.

`npm run test:a11y`

Result: 31 passed.

## 21. Performance

Research page before/after:

- HTML bytes: `126103 -> 126221` (`+118`)
- element count: `1205 -> 1206` (`+1`)
- search inputs: `3 -> 3`
- selects: `3 -> 3`
- buttons: `35 -> 35`
- local scripts: `6 -> 6`
- local script bytes: `159048 -> 160329` (`+1281`)
- inline JS bytes: `6241 -> 6241`
- Find & Explore mounts: `16 -> 16`

Homepage remained unchanged in the earlier baseline comparison.

## 22. Missing-presentation trace and resolution

The previously missing authoritative presentation was traced end-to-end:

- canonical/build eligibility data: present with existing `research` context
- presentation Pagefind fragment corpus: present as `en_3da8e1e`
- Pagefind browser runtime: discoverable when both configured search languages are queried
- failing path: the audit's Node-side Pagefind simulation

Root cause:

- the audit used `createInstance({ language })`
- Pagefind 1.5.2 does not honor that `language` field on `createInstance()`
- instead, it derives the active corpus language from `document.documentElement.lang`
- the browser runtime already handled this correctly by loading separate module instances for `fi,en`
- the audit did not, so it searched the Finnish corpus twice and falsely reported the English presentation missing

Verified target after the audit fix:

- title: `The role and importance of social media in science`
- landing: `/presentations/ss-the-role-and-importance-of-social-media-in-science/`
- corpus language: `en`
- authoritative Research membership: preserved
- generic Research presentation discoverability: PASS

## 23. Closure readiness

GREEN.

The semantics, counts, browser verification, accessibility checks, and non-presentation regressions are green, and all 33 authoritative Research-context presentations are now verified discoverable under the existing R3 rules.
