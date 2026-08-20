# F4-R1 Research Eligibility

Date: 2026-08-15
Branch: `codex/f4-r1-research-eligibility`
Worktree: `temporary clean worktree snapshot`
Status: verified

## 1. Scope

- Resume only the already authorized F4-R1 work.
- Do not modify F3C implementation or presentation archive behavior.
- Do not add presentations to Research discovery.
- Do not create any new context model, taxonomy, or presentation-research membership rule.

## 2. Exact implementation diff

The implementation diff is limited to exposing the existing `contexts` field to the public projections and reusing that existing field for the contextual Research filter.

- `src/_data/publicationsPage.js`
  - adds `contexts` to `PUBLIC_PUBLICATIONS_PAGE_FIELDS`
  - passes through existing `contexts` for both Research.fi items and manual publication items
- `src/_data/writingsPage.js`
  - adds `contexts` to `PUBLIC_WRITINGS_PAGE_FIELDS`
  - passes through existing `contexts` for shared writings records and publication-backed writings records
- `src/_utils/publicationsFindExplore.js`
  - adds `Research context=research` Pagefind filter only when `item.contexts` already contains `research`
- `src/_utils/thesesFindExplore.js`
  - adds `Research context=research` Pagefind filter only when `thesisDetail.contexts` already contains `research`
- `src/src.11tydata.js`
  - adds the same `Research context=research` Pagefind filter for writings only when `item.contexts` already contains `research`
- `src/js/find-explore.js`
  - when the mount kind is `researchContext`, adds the filter `Research context = research`

## 3. Existing Research membership rule

Actual rule used:

- a record is Research-eligible only if its existing `contexts` array contains `research`

Important non-rule:

- safe Research topic mapping for presentations is not used as Research membership
- presentation topic mapping remains evidence only in R1

## 4. New classification created

- NO

Evidence:

- `src/_data/contentContext.js` was not modified
- `src/_data/presentationResearchTopics.js` was not modified
- no new context keys, no new taxonomy, and no new presentation eligibility logic were introduced

## 5. Authoritative eligibility counts

- publications eligible: `53`
- theses eligible: `169`
- writings eligible: `62`
- total Research discovery population: `284`

## 6. Writings breakdown

Total writings by content type:

- `blogPost`: `70`
- `column`: `9`
- `initiative`: `10`
- `opinion`: `47`
- `scientificPublication`: `56`
- `speech`: `92`
- `statement`: `6`

Research-eligible writings by content type:

- `scientificPublication`: `53`
- `speech`: `5`
- `opinion`: `3`
- `blogPost`: `1`

Other writings subtype counts within Research-eligible writings:

- `speech`: `5`
- `opinion`: `3`
- `blogPost`: `1`

## 7. Blogs

- blogs total: `70`
- blogs Research-eligible: `1`

Verified eligible blog:

- `/2008/10/08/punaisenladonkankaan-kompostialue-vs-tutkimus-jonka-mukaan-madatys-on-ymparistoystavallisempaa/`
  - canonical title in data: `Punaisenladonkankaan kompostialue vs. tutkimus jonka mukaan mädätys on kompostointia ympäristöystävällisempää`
  - contexts: `politics`, `research`

## 8. Multi-context behavior

Research-eligible writings are mostly multi-context, not research-only:

- multi-context Research writings: `61 / 62`
- research-only writings: `1 / 62`

Research-eligible writings by context overlap:

- with `education`: `59`
- with `teaching`: `43`
- with `politics`: `8`
- with `business`: `1`

Observed Research-writing context combinations:

- `education|research|teaching`: `41`
- `education|research`: `11`
- `education|politics|research`: `5`
- `education|politics|research|teaching`: `1`
- `business|education|research|teaching`: `1`
- `politics|research`: `2`
- `research`: `1`

This confirms the filter keeps existing overlapping semantics instead of flattening them into a new research-only model.

## 9. Presentations evidence only

- canonical presentations total: `218`
- Research-eligible under the existing `contexts` rule: `0`
- presentations with safe Research topic mapping: `168`

R1 interpretation:

- `0 / 218` Research-eligible presentations is evidence, not a bug
- `168 / 218` safe topic-mapped presentations do not become Research members in R1
- Research membership is not inferred from presentation topic mapping

## 10. Societal-interaction and teaching/education preservation

Preservation result: yes

Evidence:

- `resolveContexts` logic was not changed
- contextual Research search reuses existing `research` context only
- Research-eligible writings still retain overlapping `education`, `teaching`, `politics`, and `business` contexts
- no new route-level semantic model was introduced

## 11. F4 audit and browser smoke

F4 Research built-output audit:

- script: `node scripts/audit-f4-research-built-output.js`
- result: `OK`
- eligibility checks: all green

Browser smoke:

- script: `npx playwright test tests/f4-research-find-explore.spec.js`
- result: `3 passed`

Coverage added in the browser smoke:

- homepage route to `/tutkimus/#tutkimusnaytto`
- contextual Research search for publications, theses, and writings
- verified Research-eligible blog discovery
- verified multi-context publication discovery

## 12. Build, unit, and regression gates

Build and unit:

- `npm run build:no-og`: `PASS`
- `npm run test:unit`: `PASS (400/400)`

Writings regressions:

- `node scripts/audit-writings-built-output.js`: `PASS`
- `node scripts/audit-writings-page-projection.js`: `PASS`
- `node scripts/audit-writings-fi-client-parity.js`: `PASS`
- `node scripts/audit-writings-en-client-parity.js`: `PASS`
- `node scripts/audit-writings-pagefind.js`: `PASS`

Publications regressions:

- `node scripts/audit-publications-page-projection.js`: `PASS`
- `node scripts/audit-publications-page-client-parity.js`: `PASS`
- `node scripts/audit-publication-pagefind.js`: `PASS`

Theses regressions:

- `node scripts/audit-theses-built-output.js`: `PASS`
- `node scripts/audit-thesis-details-parity.js`: `PASS`
- `node scripts/audit-thesis-pagefind.js`: `PASS`

Presentations regressions:

- `node scripts/audit-presentations-f3c-p3-integration.js`: `PASS`
- `node scripts/audit-presentation-detail-parity.js`: `PASS`
- `node scripts/audit-presentations-page-client-parity.js`: `PASS`
- `node scripts/audit-presentation-pagefind.js`: `PASS`
- `node scripts/audit-presentations-f3c-p6-built-output.js`: `PASS`

## 13. R2 recommendation

- Keep R2 narrow: if Research should ever include presentations, decide that through an explicit new membership rule instead of reusing safe topic mapping as a proxy.
