# T1B2A — Election History Convergence

Date: 2026-08-20
Branch: `feat/t1b2a-election-history-convergence`
Base main SHA: `806014ca4610b951c83c5109b89cd62e6e4cb0b9`

## Status

`T1B2A = CLOSED / GREEN / BRANCH`

This slice converges Finnish and English election-history pages onto one shared build-time term model without starting T1B2B, T1B3, PF5, Pagefind timeline behavior, or new canonical/taxonomy work.

## Before

Current FI flow on base `main`:

```text
manual termPeriods
+ page-local collection filters
+ councilMeetings helper
-> src/fi/vaalihistoria.md
-> SSR term cards
-> inline per-list pagination
```

Current EN flow on base `main`:

```text
manual standalone cards
+ manual election facts
+ manual role bullets
+ manual archive links
-> src/en/election-history.md
-> SSR cards
```

Observed before-state facts:

- FI rendered terms: `4`
- EN manual election cards: `5`
- EN other-civic-roles section: `1`
- FI page owned the mixed term structure locally
- EN duplicated the same chronology as separate manual content
- runtime JSON requests: `0`
- Pagefind timeline requests: `0`
- FI browser pagination groups: `15` at page size `3`

## A/B/C/D/E Classification

| Surface | Classification | Notes |
| --- | --- | --- |
| Canonical speeches | A | Derived from authoritative canonical items + preserved FI event whitelist |
| Canonical initiatives | A | Derived from authoritative politics collection + full-date term membership |
| Canonical opinions / columns | A | Derived from authoritative publication/blog items + full-date term membership |
| Canonical other political items | A | Derived from authoritative canonical political content only |
| Council meeting references | B | Derived from existing domain helper and term boundaries |
| Term boundaries | C | Explicit companion facts for election-history projection |
| Election results | C | Legitimate election-history companion facts |
| Trust-role bullets | C | Legitimate election-history companion facts |
| Campaign/archive links | C | Legitimate election-history companion facts |
| FI page-local `termPeriods` ownership | D | Removed as page-local owner |
| EN standalone election card structure | D | Removed and replaced with shared term consumer |
| Topic/keyword/category-based political inference | E | Rejected explicitly; not used |

## Selected Shared Model

Implementation locations:

- `src/_utils/electionHistory.js`
- `src/_data/electionHistory.js`
- `src/_includes/election-history-page.njk`

Final build-time flow:

```text
canonical political content
+ council meeting domain helper
+ explicit election-history companion facts
-> shared electionHistory projection
-> localized FI/EN SSR consumer
-> /politiikka/vaalikaudet/
-> /en/election-history/
```

Boundary rule:

- Canonical remains authoritative for `id`, `pageUrl`, `title`, full `date`, `contentType`, `contexts`, and political canonical membership.
- Companion facts remain authoritative for term shells, election results, trust roles, summaries, archive links, and localized editorial framing.
- No election facts were forced into Canonical Content v1.
- No new taxonomy, Pagefind timeline model, or public election-history JSON was created.

## After

Shared-structure proof:

- FI and EN render the same term IDs in the same newest-to-oldest order:
  - `2025-2029`
  - `2021-2025`
  - `2017-2021`
  - `2013-2017`
- FI route remains `/politiikka/vaalikaudet/`
- EN route remains `/en/election-history/`
- Legacy FI redirect remains `/vaalihistoria/ -> /politiikka/vaalikaudet/`

Canonical counts by family:

| Family | Total |
| --- | ---: |
| Speeches | 83 |
| Initiatives | 10 |
| Opinions / columns | 49 |
| Other political items | 34 |
| Council meeting references | 53 |

Counts by term:

| Term | Speeches | Initiatives | Opinions | Other political | Council refs | Results | Roles | Archives |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2025-2029 | 4 | 1 | 2 | 2 | 3 | 2 | 3 | 1 |
| 2021-2025 | 38 | 6 | 11 | 25 | 25 | 2 | 4 | 2 |
| 2017-2021 | 40 | 3 | 26 | 7 | 25 | 1 | 4 | 1 |
| 2013-2017 | 1 | 0 | 10 | 0 | 0 | 1 | 2 | 1 |

Companion fact totals preserved:

- election-result facts: `6`
- role facts: `13`
- archive links: `5`
- other civic roles: `3`

## Pagination Disposition

Decision: retain deterministic client-side per-list pagination for this slice, but move it behind the shared FI/EN SSR consumer instead of keeping it page-local to the old FI page.

Reason:

- it is still deterministic and SSR-first
- it avoids introducing Pagefind or runtime JSON
- removing it safely would have enlarged this slice beyond convergence

Runtime result:

- FI pagination groups after convergence: `15`
- EN pagination groups after convergence: `15`
- runtime JSON requests: `0`
- timeline Pagefind requests: `0`

## Deletion

Removed or replaced:

- page-local FI `termPeriods` ownership in `src/fi/vaalihistoria.md`
- EN standalone election-history card structure in `src/en/election-history.md`
- duplicated localized structural arrays split across FI and EN
- page-local FI collection-filter ownership for election-history rendering

Intentionally retained:

- existing political speech event whitelist
- existing council meeting helper path
- deterministic browser pagination behavior
- route, breadcrumb, hreflang, sitemap, and canonical URL semantics

## Validation

- `npm ci`
- `npm run build:no-og`
- `npm run test:unit` -> `589/589`
- `node scripts/audit-t1b2a-election-history.js`
- `npm run check:i18n-seo`
- `npm run check:seo-health`
- `git diff --check`
- `npx playwright test --workers=1 tests/t1b2a-election-history.spec.js`

Focused audit result:

- route parity: OK
- term count: `4`
- FI term count: `4`
- EN term count: `4`
- duplicate canonical IDs/pageUrls: none
- unresolved/orphan fields: none
- baseline family totals: all matched

## Explicitly Out Of Scope

- `T1B2B` home milestone convergence
- politics theme convergence
- council timeline rewrite
- Pagefind timeline behavior
- `T1B3`
- `PF5`
- Presentations work
- Media work
- Canonical Content v1 changes
- Research membership or taxonomy changes

## Confirmations

- Canonical Content v1 unchanged: `YES`
- T1B2B started: `NO`
- T1B3 started: `NO`
- PF5 started: `NO`
- Presentations modified: `NO`
- Media modified: `NO`
