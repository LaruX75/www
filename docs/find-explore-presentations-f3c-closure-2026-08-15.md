# F3C Presentations Find & Explore v1 Closure

Date: 2026-08-15

Status: CLOSED / GREEN

## 1. Scope

F3C implemented the Presentations Find & Explore v1 archive and discovery surface for the Finnish and English presentation pages. The closure scope is limited to the merged presentation implementation, presentation-specific tests and audits, and this final closure report.

Out of scope for this closure: Research semantic expansion, F3D media work, new presentation features, taxonomy redesign, embeddings, LLM behavior, API additions, or unrelated cleanup.

## 2. Final merged state

PR #88, "Presentations Find & Explore v1", was merged to `main`.

- PR head: `e0611a029d9203b969a2b42f5d8bb824707de19b`
- Merge commit: `fabad8f0631e7f51a5b436bf78654d044e366643`
- Verified `origin/main`: `fabad8f0631e7f51a5b436bf78654d044e366643`
- Closure branch base: `fabad8f0631e7f51a5b436bf78654d044e366643`

## 3. F3C phase history

F3C was completed through staged implementation and verification passes: discovery scope, topic mapping, count reconciliation, built-output migration, main-branch reconciliation, PR packaging, merge gate, merge, and final closure.

The final implementation is the merged PR #88 state plus this docs-only closure commit.

## 4. Canonical invariants

Canonical presentation invariants are green.

- Canonical presentations: 218
- Local-first canonical presentations: 138
- External-first canonical presentations: 80
- Local detail pages: 139
- Reconciled local detail total: 139
- Duplicate canonical ids: 0
- Unresolved local details: 0
- Representation total: 231

## 5. P2 curation outcome

P2 identity curation remains reconciled.

- `IS_DISTINCT_LOCAL_PRESENTATION`: 8
- `ALTERNATE_REPRESENTATION`: 12
- `MATCHES_EXISTING_CANONICAL`: 1
- `CANNOT_DETERMINE`: 0
- `UNDECIDED`: 0

## 6. Identity vs representation model

The archive uses canonical presentation identity as the primary unit. Alternate URLs, local HTML pages, Canva pages, SlideShare entries, and other source forms are treated as representations of a canonical presentation unless curated as distinct.

The model prevents duplicate archive cards while preserving approved representation metadata.

## 7. Canva linkage

Canva linkage is preserved in the canonical data and search contract.

- Canva canonical records: 79
- Canva records with design id: 79
- Canva records with page URL: 16
- Canva records with existing local HTML: 18
- Restored Canva mappings: 12
- Restored Canva mappings with existing local HTML: 12

## 8. Pagefind discovery

Pagefind indexes the merged presentation scope successfully.

- HTML documents indexed: 1442
- Presentation local documents: 139
- Presentation custom records: 92
- Presentation canonical total: 218
- Presentation local landing total: 138
- Presentation external landing total: 80

## 9. Topic mapping

Topic mapping is closed for F3C and remains a presentation-side mapping, not a Research inclusion change.

- Presentation count: 218
- Presentations with topics: 198
- Presentations without topics: 20
- Topic-present but Research-unmapped presentations: 30
- Unique presentation topics: 406
- Safely mapped topic count: 27
- Intentionally unmapped topic count: 379
- Presentations covered by Research mapping: 168
- Mapped local-first: 121
- Mapped external-first: 47
- Research presets with coverage: 3
- Structured filter quality: PASS

Count reconciliation holds: `198 + 20 = 218` and `168 + 30 + 20 = 218`.

## 10. FI archive migration

The Finnish presentation archive is migrated to the F3C Find & Explore projection.

- Page: `_site/esitykset/index.html`
- HTML bytes: 336628
- DOM elements: 2797
- Search inputs: 4
- Selects: 1
- Buttons: 34
- Tables: 3
- Inline JavaScript bytes: 6181

## 11. EN archive migration

The English presentation archive is migrated to the same F3C projection.

- Page: `_site/en/presentations/index.html`
- HTML bytes: 272279
- DOM elements: 1824
- Search inputs: 4
- Selects: 1
- Buttons: 34
- Tables: 3
- Inline JavaScript bytes: 5391

## 12. Shared architecture

The presentation pages use the presentation archive architecture:

- `/js/pe-list-render.js`
- `/js/content-presets.js`
- `/js/content-engine.js`
- `/js/presentations-page.js`

The broader Research/writings/theses/publications Find & Explore runtime remains separate through `/js/find-explore.js`.

## 13. Filters

F3C first-pass presentation filters are intentionally narrow.

- Free-text archive search: present
- Year filter: present
- Topic filter/search behavior: present through the structured presentation archive UI
- Source-type first-pass filter: not added
- Role first-pass filter: not added
- Research semantic filters: not added

## 14. Topicless records

Topicless records remain first-class archive records.

- Topicless canonical presentations: 20
- Topicless records are included by default.
- Choosing a specific topic narrows the set and can exclude topicless records.

## 15. Local-first behavior

Local-first behavior is preserved.

- Local-first canonical presentations: 138
- Local landing total: 138
- Local detail pages available: 139
- Preferred local records continue to land on approved local pages.

## 16. External-first behavior

External-first behavior is preserved.

- External-first canonical presentations: 80
- External landing total: 80
- Preferred external records continue to land on approved external pages.
- External-first records with usable local HTML remain represented without changing the preferred landing rule.

## 17. SSR/progressive enhancement

The archive renders usable server-side output and enhances on the client. JavaScript augments list rendering, filtering, and interaction, but the built HTML remains present and auditable.

The built-output audit verified canonical count, duplicate absence, and page structure for both FI and EN pages.

## 18. Public contracts

Presentation public data contracts are preserved.

- `_site/data/presentations-page.json`: `count = 218`, `items = 218`, `contexts = 5`, `canvaPageUrls = 26`
- `_site/data/presentations.json`: `count = 139`, `items = 139`

The new canonical page contract and legacy compatibility contract coexist.

## 19. Runtime removed

No obsolete presentation archive runtime is required for the migrated pages. The implementation avoids duplicate client-side presentation identity logic in favor of the canonical data projection and the presentation page runtime.

## 20. Runtime retained

Existing non-presentation Find & Explore runtime remains retained and verified.

- `/js/find-explore.js` remains used by existing Research/writings/theses/publications surfaces.
- `/js/table-filters.js`, `/js/site-ui.js`, `/js/a11y.js`, and Pagefind UI assets remain loaded where expected.
- The writings legacy runtime contract remains behavior-neutral and audit-passing.

## 21. Performance metrics

Built presentation page metrics are within the verified F3C baseline.

- FI page: 336628 HTML bytes, 2797 DOM elements, 6181 inline JS bytes
- EN page: 272279 HTML bytes, 1824 DOM elements, 5391 inline JS bytes
- FI and EN local scripts: `/pagefind/pagefind-ui.js`, `/js/bootstrap.min.js`, `/js/external-media-consent.js`, `/js/site-ui.js?v=20260801-search-submit-2`, `/js/table-filters.js`, `/js/a11y.js`, `/js/pe-list-render.js`, `/js/content-presets.js`, `/js/content-engine.js`, `/js/presentations-page.js`
- Inline runtime JSON refs in built HTML: none

## 22. Pagefind quality

Presentation Pagefind quality gate passed.

- Sample size: 20
- Found: 20/20
- Top 1: 19/20
- Top 3: 20/20
- Correct landing: 20/20

Readiness matrix: Title READY, MediaType READY, SourceType READY, PreferredLanding READY, CanonicalDeduplication READY, ExistingHtmlReuse READY; Year, Topic, Event, Type, Role, Language, and ExternalFirstIndexing remain PARTIAL by design for v1.

## 23. Browser verification

Browser smoke verification passed.

- Command group: F2 smoke, F3A theses, F3B publications, F4 Research, presentation Research smoke, and presentation archive specs.
- Result: 12 passed.

## 24. Accessibility/navigation/contrast

Accessibility, navigation, and contrast verification is green.

- First full run: 30 passed, 1 focus-trap flake in the global search dialog.
- Targeted rerun of the failed focus test: 1 passed.
- Full rerun: 31 passed.

The final accepted gate result is PASS.

## 25. Existing-scope regressions

Existing scope audits are green.

- Writings: built output, page projection, FI client parity, EN client parity, legacy runtime, and Pagefind passed.
- Theses: built output, detail parity, and Pagefind passed.
- Publications: built output, detail parity, page projection, and Pagefind passed.
- Research: F4 built-output audit passed.

## 26. F4 preservation

Research semantics are unchanged.

- Research scopes remain `publications,theses,writings`.
- Presentations are not included in Research.
- `src/fi/tutkimus.md` retains `findExploreKinds = "publications,theses,writings"`.
- `#tutkimusnaytto` remains the Research mount target.
- Homepage Research link remains `/tutkimus/#tutkimusnaytto`.

## 27. Research follow-up boundary

F3C makes presentation discovery technically ready for future consideration, but it does not decide Research membership semantics.

Any future Research inclusion of presentations requires a separate semantic review. Writings whole-scope eligibility also remains a separate Research question.

## 28. F3D dependency

F3D media work was not started and has no closure dependency on this F3C tag. Media remains an independent future scope.

## 29. PR/merge information

- PR: #88
- Title: Presentations Find & Explore v1
- Base: `main`
- Head: `e0611a029d9203b969a2b42f5d8bb824707de19b`
- Merge commit: `fabad8f0631e7f51a5b436bf78654d044e366643`
- Merge verified: yes

## 30. Tag information

The F3C tag follows prior repo practice: an annotated tag targets the PR merge commit, not the later docs-only closure commit.

- Tag name: `find-explore-presentations-v1`
- Tag type: annotated tag
- Tag object: `1e59b70d60257f16c6ac7377a8564ba5ad03793f`
- Peeled target: `fabad8f0631e7f51a5b436bf78654d044e366643`
- Tag message: `Presentations Find & Explore v1`
- Remote push: performed after the docs-only closure commit

## 31. Remaining limitations

Known v1 limitations are intentional and documented by the audits.

- Some Pagefind dimensions remain PARTIAL by design.
- Topic mapping intentionally leaves 379 presentation topics unmapped to Research semantics.
- 20 presentations remain topicless.
- Presentations are not part of Research.
- No new semantic filters, embeddings, LLM discovery, or Research architecture changes were introduced.

## 32. Explicit closure status

All required F3C closure gates are green. The merged presentation implementation is verified on current `main`, existing scopes are preserved, the closure report is docs-only, and the annotated v1 tag identifies the verified PR #88 merge commit.

F3C Presentations Find & Explore v1 is closed.
