# Find & Explore Publications v1 Closure

Date: 2026-08-14

## 1. Scope

F3B closes the publications partial Find & Explore migration. The scope was limited to publication archive discovery for FI `/julkaisut/` and EN `/en/publications/`, plus one separately committed accessibility unblock for a pre-existing `/esitykset/` colour-mode regression exposed by the shared closure gate.

F3B did not start F3C Presentations, F3D Media, F4 main-page discovery, external enrichment, or unrelated cleanup.

## 2. PARTIAL Migration Decision

The migration is intentionally partial. Find & Explore owns archive discovery, search, discovery filters, sorting, and result rendering. Bibliographic semantics remain in the publication canonical architecture.

## 3. Implementation Summary

The FI and EN publication archive discovery views now consume the shared Find & Explore runtime through the publications adapter while preserving the canonical publications dataset, existing publication detail pages, public JSON contracts, and current user-facing UI structure.

## 4. Canonical Invariants

- Canonical publications: 56
- Research.fi records: 53
- Manual fallback records: 3
- Local pageUrl coverage: 56/56
- Research.fi local detail pages: 53/53
- Source priority and deduplication remain before public/runtime projection.

## 5. Shared Find & Explore Architecture

Publications use `FindExplore:publications` and the shared `find-explore.js` runtime. This avoids a third independent discovery engine while keeping publication-specific semantics outside the generic discovery layer.

## 6. Publication-Specific Adapter

The publication adapter maps canonical publication page records into the shared discovery view model. It does not become the canonical publication model and does not own Research.fi, DOI, citation, JUFO, peer-review, open-access, manual fallback, or source-priority semantics.

## 7. FI Behavior

FI `/julkaisut/` keeps the current page structure and discovery behavior while using the shared Find & Explore runtime for archive interaction. Local detail links, source links, citation affordances, analytics, KPIs, and the quality filter remain available.

## 8. EN Behavior

EN `/en/publications/` keeps the current page structure and uses the same canonical publication set through the shared publications adapter. EN publication discovery remains aligned with FI without introducing a separate source pipeline.

## 9. Pagefind Metadata

Publication Pagefind verification confirms normal title search works as the primary evidence path:

- 8/8 sampled publication detail documents found
- 8/8 ranked first
- 8/8 ranked in top 3

Exact phrase search remains a documented Pagefind limitation and was not used as a reason for broader aggregate-page ignore changes.

## 10. Progressive Enhancement

The publication hubs retain useful server-rendered HTML and enhance archive discovery with JavaScript. The migration does not make public JSON contracts or canonical content dependent on Pagefind.

## 11. Bibliographic Semantics Retained

Publication-specific semantics remain in the canonical publication layer and detail templates, including bibliographic metadata, publication types, source priority, deduplication, Research.fi authority, manual fallback behavior, peer-review, open-access, JUFO, and KPI/analytics data.

## 12. Citation / DOI / Source Verification

F3B built-output verification confirmed DOI/source links, local detail links, and FI citation modal/export affordances remain present. EN had no broken citation buttons.

## 13. Analytics Retained

Publication analytics and KPI outputs remain intact. Verified KPI values in the client parity audit:

- total: 56
- peer reviewed: 36
- open access: 32
- articles: 12
- conferences: 23
- books: 2

## 14. Public Contracts Retained

The public JSON contracts remain available in built output:

- `/data/publications-page.json`
- `/data/publications.json`
- `/data/researchfi.json`

The publication hubs may stop consuming redundant JSON at runtime, but these public contracts were not deleted.

## 15. Runtime/Code Removed

F3B removes redundant publication archive runtime complexity from the FI and EN archive interaction path by routing discovery through the shared Find & Explore runtime.

## 16. Runtime/Code Intentionally Retained

The publication canonical model, publication detail pages, citation/export behavior, DOI/source handling, public JSON contracts, analytics/KPIs, and Research.fi/manual fallback semantics are intentionally retained outside generic Find & Explore.

## 17. Before/After Complexity Metrics

`node scripts/audit-publications-f3b-built-output.js` passed.

FI `/julkaisut/` deltas:

- HTML bytes: 351370 -> 238690, delta -112680
- DOM elements: 2087 -> 1282, delta -805
- search inputs: 8 -> 3, delta -5
- selects: 19 -> 5, delta -14
- buttons: 107 -> 54, delta -53
- tables: 7 -> 1, delta -6
- local scripts: 8 -> 5, delta -3

EN `/en/publications/` deltas:

- HTML bytes: 285640 -> 203250, delta -82390
- DOM elements: 2177 -> 1114, delta -1063
- search inputs: 8 -> 3, delta -5
- tables: 7 -> 1, delta -6

Inline script bytes increased because the shared discovery runtime is now embedded for publication discovery. This is accepted inside the partial migration because duplicated archive controls and table/runtime surface were reduced.

## 18. Publication Pagefind Results

`node scripts/audit-publication-pagefind.js` passed:

- normal title audit sample size: 8
- detail found: 8/8
- detail top 1: 8/8
- detail top 3: 8/8
- exact title audit: documented limitation, no gating change

## 19. Writings Regression

Writings regression audits passed:

- `node scripts/audit-writings-built-output.js`
- `node scripts/audit-writings-pagefind.js`

Writings Pagefind results:

- FI: 3/3 found, 3/3 top 1, 3/3 top 3
- EN: 6/6 found, 6/6 top 1, 6/6 top 3
- topics: 4/4 found

## 20. Theses Regression

Theses regression audits passed:

- `node scripts/audit-theses-built-output.js`
- `node scripts/audit-thesis-pagefind.js`

Thesis Pagefind results:

- title samples: 8/8 detail found, 8/8 top 1, 8/8 top 3
- author samples: 4/4 detail found, 4/4 top 1, 4/4 top 3
- filter-only samples: accepted known behavior

## 21. Browser Smoke

Combined F2 + F3A + F3B Playwright smoke passed:

```text
PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/f2-find-explore-smoke.spec.js tests/f3a-theses-find-explore.spec.js tests/f3b-publications-find-explore.spec.js
7 passed
```

## 22. Accessibility/Navigation/Contrast

The full accessibility, navigation, and contrast suite passed:

```text
PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/accessibility.spec.js tests/accessibility-tools.spec.js tests/navigation.spec.js tests/contrast.spec.js
38 passed
```

## 23. Presentation Colour-Mode Unblock Note

The global F3B closure gate exposed a pre-existing `/esitykset/` colour-mode accessibility regression. F3B did not cause it.

The narrow unblock fix was committed separately as `fix: unblock accessibility colour-mode gate` and was limited to:

- `src/_includes/presentations/hero.njk`
- `src/css/a11y-hc-overrides.css`

It did not start F3C, did not change presentation architecture, and did not weaken, skip, or delete accessibility tests.

Focused verification passed:

```text
PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/accessibility-tools.spec.js -g "high contrast controls shared colours on Presentations|background colour mode uses light readable surfaces"
2 passed
```

## 24. Build/Unit-Test Results

Final local verification before merge:

- `npm run build:no-og`: passed
- `npm run test:unit`: passed, 389/389
- `node scripts/audit-publications-page-projection.js`: passed
- `node scripts/audit-publications-page-client-parity.js`: passed
- `node scripts/audit-publication-details-parity.js`: passed
- `node scripts/audit-publication-pagefind.js`: passed
- `node scripts/audit-publications-f3b-built-output.js`: passed

## 25. GitHub Status

GitHub status checks were returned and both were successful:

- `playwright`: SUCCESS
- `build-and-verify`: SUCCESS

## 26. PR/Merge Information

- PR: #85
- PR URL: `https://github.com/LaruX75/www/pull/85`
- PR title: `Publications partial Find & Explore`
- PR head: `7d36d81bbefbe94be426c38cb959a4271854f8a9`
- merge commit: `00b6e370cf745b946b4f7b962ec56cfe3d2c9955`
- merge timestamp: `2026-08-14T11:20:57Z`

## 27. Tag + Verified Target

- annotated tag: `find-explore-publications-v1`
- tag target: `00b6e370cf745b946b4f7b962ec56cfe3d2c9955`

The tag points exactly to the F3B PR merge commit, not to this closure documentation commit.

## 28. Remaining Limitations

Known and accepted limitations:

- Publications Find & Explore is partial by design; publication-specific semantics remain outside shared Pagefind/discovery.
- Pagefind exact phrase searches can still surface aggregate documents ahead of detail pages in some cases.
- F3C Presentations and F3D Media remain future evidence-gated/suitability-gated streams.
- F4 main-page Find & Explore remains a future high-value UX stream.

## 29. Explicit Closure Status

F3B Publications Find & Explore v1 is closed green.

```text
FIND & EXPLORE PUBLICATIONS V1 = CLOSED / GREEN
```
