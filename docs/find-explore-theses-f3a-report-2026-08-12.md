# F3A — Theses Find & Explore Migration

## 1 Scope
F3A covered only the theses archive routes `/opinnaytteet/` and `/en/theses/`, the shared Find & Explore runtime needed by those routes, canonical-derived Pagefind metadata for thesis detail documents, and the related audits, browser tests, and closure notes.

## 2 Baseline
The baseline came from `docs/data/find-explore-f3-baseline.json`. Before F3A, the thesis archive pages were legacy table- and JSON-hydration driven, while the thesis detail pilot had already proven that `theses.js` could serve authoritative canonical detail HTML.

## 3 User-task parity
The delivered user path is now: open the thesis archive, browse curated opening sections without JavaScript, use Find & Explore when JavaScript is available, open a local thesis detail page, and follow the original OuluREPO source link from the detail page. FI and EN archives now expose the same canonical thesis set and the same local-detail landing pattern.

## 4 Canonical invariants
Canonical thesis count stayed at `169`, and the build still generates `169` local thesis detail pages. No thesis records were added, dropped, or re-keyed during F3A.

## 5 Pagefind metadata
Thesis detail pages now emit canonical Pagefind filters and metadata through the shared base template. The thesis document contract adds `FindExplore=theses`, scope filters for FI and EN, thesis type, year, language, topic and author filters, plus thesis-specific meta such as author line, role, year, language and description.

## 6 Shared-core decision
F3A did not create a thesis-only discovery runtime. Instead it generalized the Find & Explore core so writings and theses share the same client path, while thesis-specific shaping lives in `src/_utils/thesesFindExplore.js` and `src/_data/thesesFindExplorePage.js`.

## 7 FI implementation
`src/opinnaytteet.njk` now consumes the canonical thesis page model, renders the shared Find & Explore mount, keeps SSR-first curated opening sections, and adds thesis-specific modal actions for abstract and citation handling. Legacy table rendering and `/data/theses.json` hydration were removed from the FI archive page.

## 8 EN implementation
`src/en/theses.njk` now uses the same canonical thesis page model and the same local-detail landing pattern as FI. The EN archive keeps its own copy and labels, but no longer has a separate thesis runtime path.

## 9 Progressive enhancement
JS-off still exposes ordinary HTML opening sections and local thesis links. JS-on enhances the same page with Find & Explore search, type/year/topic filters, modal actions, and result pagination without replacing the SSR opening content model.

## 10 Runtime removed
Removed from thesis archive runtime: legacy table UX, `/data/theses.json` hydration on archive pages, independent thesis-only archive scripting, and the old table-filter/content-engine path on the thesis hubs.

## 11 Runtime retained
Retained runtime: Pagefind, the shared `find-explore.js` client, normal SSR archive sections, local thesis detail pages, and the thesis action layer for abstract/citation interactions.

## 12 Public contracts retained
`/data/theses.json` stayed intact as a public feed and was not repurposed for the archive UI runtime. Thesis detail pages still preserve the original OuluREPO source link and existing thesis canonical IDs.

## 13 Before/after metrics
FI archive moved from `280338` bytes / `1631` elements / `3` tables / `9` JSON requests in the baseline to `171860` bytes / `1314` elements / `0` tables / `0` JSON requests after F3A. EN archive moved from `260845` bytes / `1488` elements / `3` tables / `9` JSON requests to `163830` bytes / `1253` elements / `0` tables / `0` JSON requests.

## 14 Pagefind quality
`scripts/audit-thesis-pagefind.js` is green. Title queries: `8/8` detail documents found and `8/8` ranked top 1. Author queries: `4/4` found and `4/4` ranked top 1. Filter-only browsing: `4/4` found, `4/4` top 3, `1/4` top 1.

## 15 Author search
Author search now resolves to thesis detail documents rather than leaving the archive hub as the only meaningful hit. The sampled author queries all landed on the expected thesis detail page at rank 1.

## 16 Filter-only browsing
Filter-only browsing works through a dedicated seed query on thesis documents, so users can narrow by type, year, topic and language even without typing a search phrase. The audit confirms retrieval parity, while also documenting that filter-only ranking is broader than exact title or author search.

## 17 Accessibility
The accessibility/navigation/contrast suite stayed green at `31 passed`. F3A also fixed the stretched-link interference on thesis card action buttons by isolating the action layer above the card link surface.

## 18 SEO
Full build plus SEO dashboard stayed green: `pages=1442`, `missingDescription=0`, `missingOgImage=0`. Thesis detail pages now provide page-level HTML documents for search, sharing and indexing rather than relying only on the aggregate archive page.

## 19 JS-off
JS-off parity is preserved through curated SSR lists, headings, badges and normal links on both thesis archives. The opening view still works as plain HTML without depending on Pagefind or client hydration.

## 20 Writings regression
Writings remained green during the shared-core migration. `scripts/audit-writings-built-output.js` and `scripts/audit-writings-pagefind.js` both pass, and the combined browser smoke suite for writings plus theses now passes `5/5`.

## 21 Built-output inspection
`scripts/audit-theses-built-output.js` is green with `canonicalTotal: 169`, `jsonRefCount: 0` on both thesis hubs, and checks confirming Find & Explore mounts, absence of legacy tables/runtime, presence of thesis modals, thesis action triggers, local detail links and source links.

## 22 Risks / limitations
Filter-only browsing is intentionally broader than title/author search, so the expected thesis is not always rank 1 even though it remains discoverable. Abstract coverage is unchanged from the canonical thesis source and still depends on source-backed OuluREPO data rather than generated text.

## 23 Architecture decision
F3A confirms the site-wide pattern for theses: canonical thesis objects in `theses.js` drive both thesis detail HTML and the archive-level Find & Explore projection, while shared discovery behavior stays in one reusable runtime. No thesis-specific JSON-first side path is needed for archive search.

## 24 F3A closure status
Closure gate is green: full `npm run build:no-og` succeeded, thesis built-output audit passed, thesis Pagefind audit passed, writings audits stayed green, the accessibility suite passed, and the combined writings + theses Playwright smoke suite passed `5/5`.

F3A THESES PILOT = GREEN
