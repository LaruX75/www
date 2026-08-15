# F3C-P6 — Presentations Find & Explore Partial Migration

Date: 2026-08-14

## 1. Scope

- This checkpoint implements the authorized partial Find & Explore migration for the presentation archives at `/esitykset/` and `/en/presentations/`.
- It does not reopen canonical presentation identity, representation semantics, preferred landing rules, P5 topic mapping, F3D media work, or F4 Research rollout.

## 2. P5 decision basis

- P5 approved a partial migration mode where shared Find & Explore owns the archive discovery layer and presentation-specific semantics stay outside the generic core.
- Required first-pass filters were `free-text`, `year`, and `topic`, with the archive label `Aihe` in Finnish.
- `event`, `presentationType`, `language`, and `mediaType` stayed optional; `role` stayed deferred; `sourceType` stayed explicitly non-public.

## 3. Architecture

- The implementation reuses the existing shared client stack already used by other scopes: `/js/pe-list-render.js`, `/js/content-presets.js`, and `/js/content-engine.js`.
- Presentation-specific behavior stays in a thin adapter in [src/js/presentations-page.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/js/presentations-page.js) plus presentation templates under [src/_includes/presentations](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_includes/presentations).
- The repo does not currently contain `src/js/find-explore.js`; the shared discovery equivalent in this codebase is the `content-engine` plus `content-presets` stack, and P6 was implemented against that existing shared path rather than creating a new presentation-specific engine.

## 4. Canonical invariants

- Canonical presentations: `218`
- Built local detail pages: `139`
- Local-first canonical presentations: `138`
- External-first canonical presentations: `80`
- Topicless canonical presentations: `20`
- Representations: `231`
- Duplicate canonical discovery identities: `0`

## 5. FI migration

- `/esitykset/` now mounts one shared archive root with shared discovery controls and SSR result cards.
- The previous archive-specific role/course/runtime bindings were removed from the main archive surface.
- Presentation-specific source sections remain visible below the shared archive.

## 6. EN migration

- `/en/presentations/` now uses the same shared archive architecture and no longer carries the previous giant inline archive runtime.
- The shared archive is inserted above the existing source-specific presentation sections.
- EN preserves intentional English labels and page structure while using the same canonical dataset and landing rules.

## 7. Shared-core reuse

- Added `FindExplore:presentations` preset and `presentationsPage` endpoint in [src/_utils/contentPresets.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_utils/contentPresets.js).
- Reused shared query/render/pagination machinery rather than shipping another bespoke presentation archive app.
- The adapter only handles presentation card markup, locale copy, preferred landing consumption, and source-specific support tables.

## 8. Filters included

- `free-text`
- `year`
- `topic`

## 9. Filters deferred

- `event`: retained as result metadata, not exposed as a control
- `presentationType`: retained as result metadata, not exposed as a control
- `language`: retained as metadata, not exposed as a control
- `mediaType`: retained as metadata, not exposed as a control
- `role`: deferred
- `sourceType`: not exposed

## 10. Topic handling

- P5 kept `406` raw topic labels, so P6 avoids a giant select.
- The archive uses a compact searchable topic input with a datalist backed by canonical topic metadata.
- Finnish archive control label is `Aihe`, not `Tutkimusteema`.

## 11. Topicless records

- `20` canonical presentations remain topicless.
- They remain discoverable through archive browsing, free-text search, and year filtering.
- `All` results include topicless items; a specific topic naturally excludes them.

## 12. Preferred landing

- The archive consumes the canonical landing decision directly from `presentations-page.json`.
- Local-first results route to the local detail page.
- External-first results route to the approved external landing and are not recalculated from source or representation order.

## 13. Local-first behavior

- Verified canonical local-first total remains `138`.
- Focused Playwright coverage verified a local-first canonical result opens its local detail page.
- Existing local presentation links remain present in built output and SSR cards.

## 14. External-first behavior

- Verified canonical external-first total remains `80`.
- Focused Playwright coverage verified an external-first canonical result remains discoverable once and exposes the correct external landing.
- No new fake local details were introduced for external-first records.

## 15. Canva behavior

- Verified Canva canonical total remains `79`.
- Verified `79/79` Canva items still carry a `designId`.
- Verified `16` Canva items still carry `pageUrl`, `18` have actual local HTML, and `12/12` restored slug-to-designId mappings remain valid from the P4 baseline.
- The focused archive test covered both a local-first Canva result and an external-first Canva result.

## 16. Source/media semantics retained

- Result cards show compact presentation metadata such as title, year/date, source label, local/external indicator, event, presentation type, and topics.
- Source/media/embed behavior remains outside the generic shared discovery core.
- Existing AOE, Canva, SlideShare, and YouTube support surfaces remain on the pages.

## 17. SSR/progressive enhancement

- Both archives now render useful SSR content before JavaScript enhancement.
- The shared archive renders an initial SSR result set and ordinary links.
- JavaScript enhances the archive with search, year/topic filtering, pagination, and live status instead of replacing an empty shell.

## 18. Public contracts

- `_site/data/presentations-page.json` remains the authoritative canonical archive contract with `218` items.
- `_site/data/presentations.json` remains available and unchanged as a public compatibility projection with `139` items.
- P6 removes runtime dependence on the legacy projection for the shared archive without deleting the public contract.

## 19. Runtime removed

- `REPLACE`: the old main-archive discovery runtime on `/esitykset/` and `/en/presentations/` was replaced by the shared Find & Explore stack.
- `REMOVE FROM PAGE`: legacy `data-presentation-filter` bindings, role/course-oriented archive controls, and the EN inline canonical archive runtime.
- `REMOVE FROM PAGE`: the dead JS-only showcase mount from the presentation page.

## 20. Runtime retained

- `KEEP`: presentation source/media support sections and their tables
- `KEEP`: presentation-specific detail/local-vs-external semantics
- `KEEP`: compatibility projection `/data/presentations.json`
- `UNKNOWN`: repo-wide removal of shared utilities such as `table-filters.js` was not attempted because broader usage remains
- `REMOVE FROM REPOSITORY`: none in P6; no safe repo-wide dead-code proof was established

## 21. Before/after metrics

| Page | Phase | HTML bytes | DOM elements | Search inputs | Selects | Buttons | Tables | Local scripts | Inline JS bytes | Runtime JSON refs | Discovery scripts |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| FI | Before | 305169 | 2520 | 2 | 1 | 52 | 3 | 7 | 6181 | 0 | `/js/presentations-page.js` |
| FI | After | 336451 | 2796 | 2 | 1 | 1 | 3 | 9 | 6181 | 0 | `/js/pe-list-render.js`, `/js/content-presets.js`, `/js/content-engine.js`, `/js/presentations-page.js` |
| EN | Before | 890705 | 1488 | 2 | 0 | 33 | 3 | 6 | 661788 | 0 | none |
| EN | After | 272270 | 1823 | 2 | 1 | 1 | 3 | 9 | 5391 | 0 | `/js/pe-list-render.js`, `/js/content-presets.js`, `/js/content-engine.js`, `/js/presentations-page.js` |

- The largest concrete win is EN inline JavaScript dropping from `661788` bytes to `5391` bytes.
- FI grew moderately in HTML/DOM because the new archive now SSRs the shared result surface rather than leaving discovery logic mostly to page-local runtime controls.

## 22. Pagefind quality

- Presentation title gate: `20/20` found, `20/20` top3, `19/20` top1, `20/20` correct landing
- Canonical deduplication: `218` identities, `0` duplicates
- Topic mapping structured membership: `PASS`
- Presentation Pagefind quality gate from P4/P5 remained green after P6

## 23. Browser smoke

- Focused P6 presentation archive coverage: `2 passed`
- Combined smoke across writings, theses, publications, presentations, and research: `16 passed`
- Additional Pagefind overlay smoke from navigation suite: `1 passed`

## 24. Accessibility

- Established suite status: `PASS`
- Accessibility tests: `13`
- Navigation/focus tests: `4`
- Contrast tests: `14`
- Combined established a11y suite total: `31 passed`
- Focused archive cards expose labelled controls, live filtering status, keyboard-operable reset/search interactions, and external-link indication without weakening existing suites.

## 25. Writings regression

- Built-output audit: `PASS`
- Projection audit: `PASS`
- FI client parity: `PASS`
- EN client parity: `PASS`
- Note: the repo does not currently contain a dedicated writings-only Pagefind audit script; Pagefind evidence was instead covered by the existing navigation Pagefind smoke plus the unchanged writings shared-runtime audits.

## 26. Theses regression

- Detail parity: `PASS`
- Pagefind audit: `PASS`
- Thesis Pagefind sample summary: `8/8` found, `8/8` top1, `8/8` top3

## 27. Publications regression

- Detail parity: `PASS`
- Page projection audit: `PASS`
- Pagefind audit: `PASS`
- Publication plain-title Pagefind sample summary: `8/8` found, `8/8` top1, `8/8` top3

## 28. F4 Research regression

- No presentation rollout was added to `/tutkimus/`.
- Built HTML check confirmed `/tutkimus/` contains no `PresentationResearchPreset` and no `FindExplore:presentations` wiring.
- Existing research browser smoke passed.
- Note: the repo does not currently contain a dedicated research built-output audit script; P6 used built HTML verification plus the existing research smoke test.

## 29. Build/unit results

- `npm run build:no-og`: `PASS`
- `npm run test:unit`: `PASS (400/400)`
- `node scripts/audit-presentations-f3c-p3-integration.js`: `PASS`
- `node scripts/audit-presentations-page-projection.js`: `PASS`
- `node scripts/audit-presentation-detail-parity.js`: `PASS`
- `node scripts/audit-presentations-page-client-parity.js`: `PASS`
- `node scripts/audit-presentation-pagefind.js`: `PASS`
- `node scripts/audit-presentation-topic-mapping.js`: `PASS`
- `node scripts/audit-presentations-f3c-p6-built-output.js`: `PASS`

## 30. Remaining limitations

- The first-release archive intentionally exposes only `free-text`, `year`, and `topic`.
- `event`, `presentationType`, `language`, and `mediaType` remain metadata-only for now.
- Topic vocabulary remains intentionally broad and long-tail; P6 does not normalize or merge it.
- Writings and Research still lack dedicated built-output/Pagefind audit scripts for every requested line item, so some regression evidence is assembled from the nearest existing audits plus browser smoke instead of one exact-purpose command per scope.

## 31. Research follow-up readiness

- P5 topic mapping outputs remain valid and reusable for the later F4 work.
- Research fourth-scope rollout is still `YES WITH LIMITED TOPIC PRESETS`, but it remains explicitly out of scope for P6.
- P6 leaves the research UI and selector wording untouched, which is the correct precondition for that later follow-up.

## 32. Closure readiness

- Decision: `GREEN / READY FOR CLOSURE`
- Reasoning: the partial migration shipped on both target routes, canonical counts and landing rules stayed intact, Pagefind quality stayed within gate, focused archive coverage passed, established accessibility/navigation/contrast suites passed, and existing shared-core consumers showed no unexplained regressions.
