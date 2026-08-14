# F3B Publications Find & Explore report

Date: 2026-08-14

Status: GREEN / ready for PR

Branch: `codex/f3b-publications-find-explore`

Base: `origin/main` at `c504d8d822d988d516a88a63dde7803fb4b61a15`

## Scope

F3B implements a partial Find & Explore migration for publications only. It does not start F3C presentations work, does not change presentation architecture, and does not alter public publication feed contracts.

Final publication discovery path:

```text
publicationsPage.items
  -> publications Find & Explore page model
  -> inline page records + shared find-explore runtime
  -> FI /julkaisut/
  -> EN /en/publications/
```

Preserved contracts:

- `/data/publications-page.json` remains canonical public projection.
- `/data/publications.json` remains the general publications collection feed.
- `/data/researchfi.json` remains the Research.fi feed.
- Publication detail URLs, DOI/source links, FI citation export, analytics/KPI data, and current visual design are preserved.
- EN publication page does not render broken citation export buttons because it has no citation modal.

Intentional F3B simplification:

- FI and EN archive discovery now use shared `find-explore.js`.
- Old publication archive table/runtime hydration was removed from FI/EN publication pages.
- One table remains on each page for coauthor analytics; it is not archive discovery UI.

## Implementation

Files changed for F3B:

- `src/_utils/publicationsFindExplore.js`
- `src/_includes/find-explore-writings.njk`
- `src/_includes/publications-opening-list.njk`
- `src/js/find-explore.js`
- `src/src.11tydata.js`
- `src/julkaisut.11tydata.js`
- `src/julkaisut.njk`
- `src/en/publications.11tydata.js`
- `src/en/publications.njk`
- `scripts/audit-publications-f3b-built-output.js`
- `scripts/audit-writings-pagefind.js`
- `tests/f2-find-explore-smoke.spec.js`
- `tests/f3b-publications-find-explore.spec.js`

Shared runtime notes:

- `find-explore.js` now supports `kind="publications"` alongside writings and theses.
- Publication result rendering is enriched from inline canonical records keyed by `pageUrl`.
- Publication filters include group, year, topic/research-line, and quality.
- Multi-language Pagefind searches are run sequentially. This prevents a race where EN initialization could make an EN publications page miss FI-indexed local publication detail documents.

## Built Output

Command:

```bash
node scripts/audit-publications-f3b-built-output.js
```

Result: PASS

Key metrics:

- Canonical publications total: 56
- FI HTML bytes: 351370 -> 238690, delta -112680
- EN HTML bytes: 285640 -> 203250, delta -82390
- Combined FI+EN HTML byte reduction: -195070
- FI element count: 2087 -> 1282, delta -805
- EN element count: 2177 -> 1114, delta -1063
- FI archive tables: 7 -> 1
- EN archive tables: 7 -> 1
- FI local runtime scripts: 8 -> 5
- EN local runtime scripts: 5 -> 5
- FI JSON hydration refs: 10 -> 0
- EN JSON hydration refs: 0 -> 0

## Publication Parity

Commands:

```bash
node scripts/audit-publications-page-projection.js
node scripts/audit-publications-page-client-parity.js
node scripts/audit-publication-details-parity.js
node scripts/audit-publication-pagefind.js
```

Results:

- Public projection parity: PASS
- Client/canonical parity: PASS
- Detail parity: PASS
- Publication Pagefind audit: PASS with documented exact-phrase limitation

Publication counts:

- Canonical total: 56
- Research.fi records: 53
- Manual fallback records: 3
- Detail count: 53/53 Research.fi details
- Unique detail URLs: 53
- Detail mismatches: 0

Runtime parity:

- Source dataset count: 56
- Hydrated count: 56
- Manual publications present: 3
- Research.fi publications present: 53
- Same dataset for SSR and hydration: true

Pagefind:

- Normal title audit: 8/8 detail found, 8/8 rank #1, 8/8 top3
- Exact-phrase audit: 5/8 detail found, 0/8 rank #1
- Exact-phrase behavior remains a documented Pagefind limitation and was not used as a reason for risky aggregate `data-pagefind-ignore` changes.

## Cross-Pilot Regression

Commands:

```bash
node scripts/audit-writings-built-output.js
node scripts/audit-theses-built-output.js
node scripts/audit-writings-pagefind.js
node scripts/audit-thesis-pagefind.js
PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/f2-find-explore-smoke.spec.js tests/f3a-theses-find-explore.spec.js tests/f3b-publications-find-explore.spec.js
```

Results:

- Writings built output: PASS, canonical total 290
- Theses built output: PASS, canonical total 169
- Writings Pagefind: FI 3/3 found top1, EN 6/6 found top1, topics 4/4 found
- Thesis Pagefind: title 8/8 found top1, author 4/4 found top1, filter-only 4/4 found
- Combined browser smoke: 7 passed

Note: the writings Pagefind audit no longer samples `scientificPublication` as a writings EN type. After F3B, publication discovery belongs to `FindExplore:publications`; writings remains responsible for writing-like content.

## Accessibility Unblock

F3B itself did not cause the presentation regression. Before the narrow accessibility fix, `git diff --name-only origin/main...HEAD` showed only the F3B audit document on the branch, and the failing page was `/esitykset/` with presentation-specific CSS and mobile presentation navigation behavior.

The global closure gate exposed an existing `/esitykset/` colour-mode issue:

- `Accessibility colour modes › high contrast controls shared colours on Presentations`
- `Accessibility colour modes › background colour mode uses light readable surfaces`

Failure details before fix:

- High contrast expected plain link color `rgb(255, 255, 0)` but received `rgb(255, 255, 255)`.
- Background colour mode test selector `main a:not(.btn):not(.badge)` resolved first to the hidden mobile presentation path link `<a href="#reitit">Aloita</a>`.

Exact cause:

- `/css/presentations-page.css` had page-specific link/card colour rules that could beat shared accessibility colour-mode plain-link styling.
- Hidden mobile path navigation links on `/esitykset/` were visually button/chip controls but were not marked as `.btn`, so the existing plain-link colour-mode test selected them.

Narrow fix applied:

- `src/_includes/presentations/hero.njk`
- `src/css/a11y-hc-overrides.css`

The fix only classifies the mobile path navigation anchors as button-style links and strengthens final shared plain-link colour-mode overrides. It does not redesign presentations, does not alter presentation architecture, and does not weaken tests.

Verification:

```bash
PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/accessibility-tools.spec.js -g "high contrast controls shared colours on Presentations|background colour mode uses light readable surfaces"
```

Result: 2 passed

```bash
PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/accessibility.spec.js tests/accessibility-tools.spec.js tests/navigation.spec.js tests/contrast.spec.js
```

Result: 38 passed

## Build And Unit Gate

Commands:

```bash
npm run build:no-og
npm run test:unit
```

Results:

- Build: PASS
- Pagefind indexed: 1434 pages, 42616 words, 28 filters
- Research.fi integrity: OK, 56 archive publications, 56 metadata records, 56 research-line records, 55 curated-theme records
- Unit tests: 389/389 passing

The build used offline/cache fallback for external APIs where network access was unavailable.

## Not Staged

The following cache files changed as build side effects and are intentionally not part of F3B:

- `.cache/api-fallback/crossref-enrichments-v1.json`
- `.cache/api-fallback/jufo-enrichments-v1.json`

## Closure Readiness

F3B is ready for:

```text
commit
push
PR
CI
merge
tag find-explore-publications-v1
```

F3B should be closed only after PR merge and tag. F3C Presentations remains a separate evidence-gated workstream and was not started here.
