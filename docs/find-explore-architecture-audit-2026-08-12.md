# Find & Explore Architecture + Deletion Audit

Date: 2026-08-12

Scope: F1 audit-only after `canonical-content-v1`. No production UI, runtime, ranking, metadata, canonical contract, or Pagefind indexing changes were made.

Baseline data: `docs/data/find-explore-f1-baseline.json`

## 1. Executive Summary

The current site is ready for a Pagefind-first discovery layer, but not for a Pagefind-only architecture. The right direction is a hybrid model:

- Pagefind should own free-text discovery, cross-content result sets, user-facing search states, and most broad archive exploration.
- Canonical data must remain authoritative for identity, URLs, source URLs, JSON-LD, counts, API/public projection contracts, detail pages, and content-type semantics.
- Client-side archive runtimes can be reduced substantially, especially where pages currently do `JSON -> normalize -> filter -> paginate -> render` only to support local discovery.

The best F2 pilot is `/kirjoitukset/` and `/en/writings/`. Writings has the largest combination of duplicate mini-searches, section-specific filters, repeated paginators, and canonical readiness, while carrying less citation/detail-risk than publications and theses.

Final recommendation: `HYBRID RECOMMENDED`

## 2. Baseline / Repository State

F1 started from a clean temporary main worktree because the primary workspace contained unrelated dirty work.

- Worktree: `temporary clean worktree snapshot`
- Branch: `codex/find-explore-f1-audit`
- Baseline commit: `9aee5cc850eeeb1d7a067fd87e2fee814e9ca97c`
- `git describe`: `canonical-content-v1-1-g9aee5cc8`
- Canonical tag: `canonical-content-v1`
- Build command: `npm run build:no-og`
- Build result: green, cache-only fallbacks used for remote sources

Build output:

- Eleventy wrote 1455 files.
- Pagefind indexed 1434 pages and 43068 words.
- Pagefind reported 2 filters and 0 sorts.
- SEO dashboard completed with `missingDescription=0` and `missingOgImage=0`.
- Research.fi integrity check completed with 56 archive publications and 56 metadata records.

## 3. Current Discovery Architecture

There are currently three overlapping discovery layers.

First, global search is already Pagefind-based. The navigation overlay and `/haku/` plus `/en/search/` load Pagefind UI and pass a language filter through `data-pagefind-filter="Kieli:..."`.

Second, canonical archive pages expose curated and typed data through SSR and public JSON projections. The most important projections are `/data/publications-page.json`, `/data/presentations-page.json`, `/data/theses.json`, and `/data/writings-page.json`.

Third, several archive pages still carry their own local discovery runtimes: search inputs, filter selects, role buttons, pagination, DOM row hiding, and in some cases client-side JSON loading and row rendering.

This means the site has canonical content contracts and Pagefind, but the user-facing archive pages still behave like separate small search applications.

## 4. Responsibility Matrix

| Feature | Classification | Rationale |
| --- | --- | --- |
| Global free-text search | PAGEFIND | Already implemented with Pagefind and works across built HTML. |
| Cross-content discovery | PAGEFIND | Pagefind naturally spans publications, theses, writings, presentations, topics, and main pages. |
| Content type filtering | HYBRID | Pagefind can expose the UI filter, but canonical data should define the content type. |
| Language filtering | PAGEFIND | Already present as the only observed Pagefind filter family. |
| Year filtering | HYBRID | Useful in Pagefind UI, but year remains canonical metadata. |
| Theme, keyword, category filtering | HYBRID | Pagefind can navigate result sets; taxonomy pages remain SEO and orientation surfaces. |
| Authoritative IDs | CANONICAL_DATA | Pagefind must not become an identity source. |
| `pageUrl`, `sourceUrl`, `externalUrl` semantics | CANONICAL_DATA | Locked by canonical-content-v1 contract and C3 audit. |
| JSON-LD and citation metadata | CANONICAL_DATA | Needs deterministic structured data, not search result extraction. |
| KPI/count cards | CANONICAL_DATA | Counts should be deterministic and build-time verifiable. |
| Archive mini-search inputs | REDUNDANT/HYBRID | Many duplicate Pagefind's role, but some filters are still specialized. |
| Citation tools | KEEP_CLIENT | Publications and theses citation helpers are not search features. |
| Table sorting for visible rows | KEEP_CLIENT or HYBRID | Useful only where the table remains a primary UI. |
| Related content sidebars | CANONICAL_DATA | These are contextual navigation and should stay deterministic. |
| Orientation rails and topic hubs | HYBRID | Curated orientation plus Pagefind-powered evidence/result exploration. |

## 5. Deletion Audit

The safest deletion target is page runtime, not public contracts.

Candidates to remove from page runtime:

- Duplicate archive search boxes on publications, theses, writings, and some presentation contexts.
- Section-specific filter engines that only search text already indexed by Pagefind.
- JSON fetch plus render paths whose only purpose is user discovery, not distribution.
- Repeated pagination and DOM row show/hide logic for archive tables.
- Large always-present archive lists where the page only needs an opening sample plus a Find & Explore entry point.

Candidates not to remove completely:

- `/data/*-page.json` projections. These are public contracts and useful for future integrations even if a page stops using them for runtime search.
- Canonical detail pages. They are essential Pagefind documents.
- Taxonomy pages. They have SEO and orientation value even if Pagefind handles result exploration.
- Citation, JSON-LD, source link, and detail metadata code.

Unknown or needs investigation:

- Legacy tag-vs-keyword overlap. There are clear keyword and category pages, but tag semantics should be audited before any consolidation.
- `table-filters.js` global dependency. It is loaded broadly, but F1 did not prove which pages still require it.
- EN/FI asymmetries in archive UI. Some EN pages are more static than FI, while others carry their own inline logic.

## 6. DOM / HTML / JS / JSON Baseline

Largest page-projection JSON files:

| Endpoint | Items | Bytes |
| --- | ---: | ---: |
| `/data/writings-page.json` | 290 | 427482 |
| `/data/theses.json` | 169 | 344334 |
| `/data/presentations-page.json` | 210 | 278568 |
| `/data/publications.json` | 164 | 221354 |
| `/data/publications-page.json` | 56 | 101074 |
| `/data/researchfi.json` | 56 | 56936 |

Archive page baseline:

| Page | HTML bytes | Elements | Search inputs | Selects | Buttons | Tables | Local script bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/esitykset/` | 305186 | 2520 | 2 | 1 | 52 | 3 | 340233 |
| `/en/presentations/` | 440565 | 1440 | 2 | 0 | 33 | 3 | 259307 |
| `/julkaisut/` | 350576 | 2079 | 8 | 19 | 107 | 7 | 289116 |
| `/en/publications/` | 282726 | 2155 | 8 | 0 | 33 | 7 | 259307 |
| `/opinnaytteet/` | 280329 | 1631 | 5 | 9 | 180 | 3 | 289116 |
| `/en/theses/` | 260836 | 1488 | 5 | 1 | 165 | 3 | 289116 |
| `/kirjoitukset/` | 165441 | 1247 | 5 | 5 | 52 | 3 | 289116 |
| `/en/writings/` | 207412 | 1575 | 8 | 1 | 43 | 8 | 289116 |

The raw size winner is presentations EN, but the deletion opportunity winner is writings: its templates contain several independent mini-runtimes and the canonical dataset is already unified.

## 7. Pagefind Metadata Readiness

Pagefind currently indexes 1434 documents, but metadata is thin.

- Pagefind reports 2 filters, corresponding to language filter files.
- No `data-pagefind-body` exists, so Pagefind indexes full body content.
- No sorts are currently exposed.
- Detail pages for publications and theses are strong documents.
- Topic, category, keyword, and archive pages can compete with detail pages in exact-phrase searches.

Readiness judgement: Pagefind is ready for free-text and detail-first discovery, but not yet ready for rich faceted Find & Explore without adding controlled `data-pagefind-meta` or `data-pagefind-filter` attributes from canonical data.

## 8. Pagefind Current Quality

Publication Pagefind sample:

- Plain title search: 8/8 detail found, 8/8 detail rank #1.
- Exact phrase search: 6/8 detail found, 1/8 detail rank #1.
- Exact phrase searches are dominated by category, keyword, theme, and archive pages.

Thesis Pagefind sample:

- Plain title search: 8/8 detail found, 8/8 detail rank #1.
- Aggregate pages did not rank ahead of thesis details.

Conclusion: Pagefind is already good enough for normal title and topic discovery. Exact phrase behavior should be documented, not used as a reason for broad `data-pagefind-ignore` changes yet.

## 9. Publications

Publications are architecturally mature after the canonical v1 pilot:

- `/julkaisut/` and `/en/publications/` share canonical `publicationsPage.items`.
- 56 Research.fi/publication-page records exist in `/data/publications-page.json`.
- Research.fi detail HTML exists and Pagefind indexes details well.
- Citation, publication type, coauthor, open access, peer review, and JSON-LD semantics are canonical-data responsibilities.

Deletion opportunity:

- Some local search/filter UI could be reduced later.
- Publications should not be F2 because the page has high-value structured controls and citation workflows. The risk-to-deletion ratio is worse than writings.

## 10. Theses

Theses are also architecturally mature:

- `/data/theses.json` has 169 canonical records.
- Local detail pages exist for all theses.
- Pagefind plain title search is 8/8 top1 in the audit sample.
- 127/169 have source-backed abstracts; 42 remain explicit curation backlog, not AI-filled.

Deletion opportunity:

- Per-table local search and pagination could eventually become lighter.
- Citation output and OuluREPO source link behavior must remain canonical/client functionality.

Theses are a plausible later Find & Explore target, but they should not be the first F2 pilot because the page still has thesis-type and citation-specific behavior that could muddy the proof.

## 11. Presentations

Presentations have a canonical page projection with 210 items and detail pages resolved from canonical objects.

Current state:

- FI `/esitykset/` loads `presentations-page.js`, an 80 KB source file.
- EN `/en/presentations/` is canonical-backed but still grouped by source type in SSR.
- Media/source semantics are richer than ordinary text pages: SlideShare, Canva, AOE, YouTube, custom materials, thumbnails, embeds, course contexts.

Deletion opportunity:

- Pagefind can take broad presentation search and content discovery.
- Source-specific browsing and media-card affordances should remain curated until a shared FindExplore component understands presentation source semantics.

Presentations are not the best F2 pilot because they contain the most media-specific UI nuance.

## 12. Writings

Writings are the best F2 pilot.

Current state:

- `/data/writings-page.json` has 290 canonical items.
- FI compatibility subset remains intentional, but the canonical set is unified.
- FI and EN templates contain many repeated inline search/filter/render/pagination paths.
- `src/kirjoitukset.njk` is 57540 bytes and `src/en/writings.njk` is 74482 bytes.
- `/kirjoitukset/` has 5 search inputs, 5 selects, 52 buttons, and 3 tables.
- `/en/writings/` has 8 search inputs, 1 select, 43 buttons, and 8 tables.

F2 should use writings to prove a lighter runtime:

- Keep the curated opening sections.
- Keep public `/data/writings-page.json`.
- Move broad discovery to a Pagefind-backed Find & Explore region.
- Remove duplicated section-specific mini-searches where Pagefind gives the same user value.
- Preserve JS-off opening samples and canonical links.

## 13. Main Pages

Main pages should not become pure search pages.

Homepage:

- Keep role-based orientation, route cards, and curated latest evidence.
- A Find & Explore affordance can supplement the page but should not replace editorial framing.

Research:

- Keep research lines, evidence cards, and structured crosslinks.
- Pagefind can power "find evidence about this topic" result sets.

Work:

- Built `/tyo/` appears as a thin 425-byte shell or redirect. The real role/work architecture likely lives in other localized routes and should be checked separately before F2.

Politics:

- Keep political role framing and issue-based sections.
- Pagefind can power speeches, initiatives, opinions, and statements discovery.

Kynasta:

- Good future candidate for a combined writings/speeches/opinions search state, but writings archive is the cleaner first pilot.

## 14. Taxonomy / Topic Hubs

Taxonomy pages remain valuable.

- Themes are curated topic hubs and should stay.
- Categories are archive navigation and SEO surfaces.
- Keywords are fine-grained metadata surfaces.
- Tags need investigation before any consolidation.

Do not replace taxonomy pages wholesale with Pagefind. The safer model is taxonomy pages as durable landing pages plus Pagefind result states for deeper exploration.

## 15. Orientation Feasibility

Find & Explore can support orientation if it is stateful and shareable.

Recommended orientation model:

- Query-string state for durable filters and shareable links.
- Local/session state only for ephemeral UI position.
- Desktop side rail and mobile bottom action affordance are feasible.
- JS-off fallback must remain: curated opening content plus normal detail/taxonomy links.

Orientation should be built as progressive enhancement, not as a required app shell.

## 16. SEO Findings

SEO is currently healthy at the build level:

- SEO dashboard reports no missing descriptions or OG images.
- Detail pages are the strongest SEO units for publications and theses.
- Taxonomy pages can compete with detail pages in exact-phrase Pagefind searches, but that is internal search behavior, not necessarily external SEO harm.

SEO caution:

- Do not hide large content regions from Pagefind or crawlers without a page-type policy.
- Do not remove taxonomy pages just because Pagefind can find the same content.
- If F2 reduces archive DOM, preserve discoverable links to detail pages and keep canonical JSON/detail projections intact.

## 17. Listen / Radio Readiness

Listen/Radio is feasible as a later layer, but it should consume canonical detail/view models rather than Pagefind fragments.

Readiness by content type:

- Writings: strongest, because local full text usually exists.
- Theses: good for 127/169 source-backed abstracts, metadata-only for abstractless records.
- Publications: good for abstract-backed records, metadata-only otherwise.
- Presentations: mixed; some items have rich descriptions, but not all have transcript-level text.
- Topic hubs/main pages: useful as narrated orientation, not primary source documents.

F1 does not recommend starting Listen/Radio before the F2 Find & Explore pilot.

## 18. Distribution Readiness

Existing distribution surfaces:

- FI Atom feed: `/feed.xml`
- EN Atom feed: `/en/feed.xml`
- Public JSON projections for publications, presentations, theses, writings, content, taxonomy, media, initiatives, and council speeches.

Distribution candidates after Find & Explore:

- Shareable search URLs.
- Copy-link states for filtered discovery.
- Citation/export actions for publications and theses.
- Social share cards derived from canonical details.
- Future semi-automated social distribution from canonical items.

Do not use F2 to remove JSON endpoints. They are distribution contracts, not merely page-runtime feeds.

## 19. Shared FindExplore Feasibility

A shared FindExplore component is feasible, provided it stays a UI adapter over Pagefind and canonical metadata.

Minimum design:

- Pagefind search input and results.
- Language, type, year, and topic filters sourced from canonical metadata.
- Optional page-scope preset, for example writings-only.
- Link to canonical detail `pageUrl`.
- No authoritative data derived from Pagefind result snippets.

Non-goals for F2:

- No new canonical contract.
- No embeddings or H0 changes.
- No ranking tuning unless audit proves a regression.
- No replacement of all archive pages at once.

## 20. F2 Candidate Comparison

| Candidate | Deletion potential | Risk | Pagefind readiness | Notes |
| --- | --- | --- | --- | --- |
| Writings | High | Medium-low | Good | Best proof of deleting mini-search/runtime duplication. |
| Theses | Medium | Medium | Excellent | Strong Pagefind, but citation and thesis-type controls add complexity. |
| Publications | Medium | Medium-high | Good | Structured academic filters and citation semantics should not be collapsed first. |
| Presentations | Medium | High | Partial | Media/source-specific behavior makes this a noisy pilot. |
| Main pages | Low-medium | Medium | Partial | Better after shared component exists. |
| Taxonomy pages | Medium | High | Partial | SEO and orientation risk if touched too early. |

## 21. Recommended F2 Pilot

Recommended F2 pilot: writings.

Pilot scope:

- `/kirjoitukset/`
- `/en/writings/`
- `/data/writings-page.json` remains as public contract.
- Curated opening sections remain.
- Broad discovery moves to a Pagefind-backed Find & Explore UI.
- Remove only redundant page-runtime search/filter/pagination logic that Find & Explore demonstrably replaces.

Rationale:

- Canonical writings dataset is already complete enough: 290 items.
- Existing runtime duplication is high.
- Citation/schema risk is lower than publications and theses.
- Media/source-specific UI risk is lower than presentations.
- User-visible value is clear: one search/explore surface across opinions, columns, blog posts, speeches, initiatives, and publication-like records.

## 22. F2 Acceptance Gate

F2 should pass only if all of these are true:

- JS-off view still shows useful curated writing sections and normal links.
- JS-on Find & Explore can find writings across the intended FI/EN scope.
- Existing canonical item count remains 290.
- Public `/data/writings-page.json` contract remains valid.
- Removed runtime is demonstrably redundant and not needed by another page.
- Writings page local script/runtime and DOM complexity decrease from F1 baseline.
- Pagefind returns local content/detail URLs for sampled writing titles.
- Accessibility, navigation, and contrast tests remain green.
- No publication, thesis, presentation, taxonomy, or canonical contract changes are bundled into F2.

## 23. Risks / Unresolved Questions

- Pagefind metadata is currently thin. F2 may need canonical-derived metadata attributes before faceted filtering feels complete.
- Exact-phrase Pagefind behavior can favor taxonomy/archive pages. This should be monitored, not prematurely fixed by broad ignore rules.
- It is unclear whether `table-filters.js` is still needed globally on all pages where it loads.
- Tags and keywords may overlap semantically; do not consolidate without a separate taxonomy audit.
- EN/FI writings scope rules must remain explicit. F2 should not silently change which writings are visible.
- Future Listen/Radio needs source-backed text availability rules, especially for abstractless theses and metadata-only publications.

## 24. Final Recommendation

Use Pagefind as the user-facing discovery engine, but keep canonical data as the authoritative content and metadata layer. Start F2 with writings because it has the clearest runtime deletion upside and the least content-type-specific risk.

Final recommendation: `HYBRID RECOMMENDED`
