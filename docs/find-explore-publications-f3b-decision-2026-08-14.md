# F3B — Publications Find & Explore Decision Gate

Date: 2026-08-14  
Baseline: `origin/main` at `c504d8d822d988d516a88a63dde7803fb4b61a15`  
Scope: `/julkaisut/`, `/en/publications/`, publication-specific runtime, public projection, detail HTML, Pagefind evidence.

## Executive Decision

Recommendation: **PARTIAL**

Publications should not be migrated wholesale to the shared Find & Explore browser yet. The evidence supports a smaller publication-specific implementation gate: migrate the archive discovery layer toward the shared Find & Explore core while preserving the current publication domain semantics.

The reason is not architectural hesitation. The publication canonical layer is mature and local detail coverage is strong. The limiting factor is that publication pages are not just discovery lists: they carry bibliographic, citation, DOI/source, JUFO, open access, peer-review and analytics semantics that are materially different from writings and theses.

## Verification

Commands run:

```bash
npm run build:no-og
npm run test:unit
node scripts/audit-publications-page-projection.js
node scripts/audit-publications-page-client-parity.js
node scripts/audit-publication-details-parity.js
node scripts/audit-publication-pagefind.js
node scripts/audit-find-explore-f3.js
```

Results:

- `npm run build:no-og`: passed, Pagefind indexed 1434 pages, 42665 words, 21 filters.
- `npm run test:unit`: passed, 389/389.
- Research.fi integrity: passed, 56 archive publications, 56 metadata records, 56 with research line, 55 with curated themes.
- Publication projection audit: passed, no unexplained parity differences, no field leakage.
- Publication client parity: passed, SSR and hydration use the same canonical dataset.
- Publication detail parity: passed, 53/53 canonical Research.fi detail pages, 53 unique detail URLs.

## Current Dataset

Canonical publication count: **56**

- Research.fi records: **53**
- Manual fallback publication records: **3**
- Local `pageUrl`: **56/56**
- Research.fi local detail HTML: **53/53**
- Descriptions: **56/56**
- DOI/DOI URL: **32/56**
- External source or DOI URL: **35/56**
- Authors: **52/56**
- Language in public projection: **56 fi**

Group counts:

- `A`: 28
- `B`: 9
- `C`: 1
- `D`: 6
- `E`: 5
- `G`: 1

## Current FI Baseline

`/julkaisut/` is canonical, but still heavy as an archive UI:

- HTML size: **350585 bytes**
- Elements: **2079**
- Search inputs: **8**
- Selects: **19**
- Buttons: **107**
- Tables: **7**
- Rows in SSR opening view: **29**
- Cards: **13**
- Local scripts: **8**
- Inline JS: **74561 bytes**
- Runtime JSON endpoints detected: **10**

Important nuance: only `/data/publications-page.json` is the publication page projection. The other endpoint URLs are exposed by the shared `content-engine` endpoint map and should not be counted as removable public contracts. Deletion benefit should be assessed as runtime/page-code simplification, not public JSON removal.

## Current EN Baseline

`/en/publications/` uses the same canonical publication dataset, but remains table/search specific:

- HTML size: **282735 bytes**
- Elements: **2155**
- Search inputs: **8**
- Selects: **0**
- Buttons: **33**
- Tables: **7**
- Rows in SSR output: **57**
- Cards: **11**
- Local scripts: **5**
- Inline JS: **36755 bytes**
- Runtime JSON endpoints detected: **0**

EN is already SSR-heavy and avoids FI's canonical JSON hydration cost. Its deletion benefit is therefore mostly template/runtime unification, not network reduction.

## User Task Inventory

User-facing publication tasks observed:

- Find by title: discovery.
- Find by author/coauthor: discovery and bibliographic lookup.
- Find by topic/theme/keyword: discovery.
- Filter by year and publication type: discovery and navigation.
- Open local detail page: detail action.
- Open DOI/original source: source semantic action.
- Inspect journal, publisher, volume, issue, pages, ISBN, DOI, JUFO, peer review, open access and citations: bibliographic semantic.
- Export citation in APA/BibTeX/MLA/Chicago/RIS/Zotero/Mendeley-oriented forms: bibliographic semantic.
- Understand research line, themes and audiences: curation/navigation.
- Compare publication output over time/type/coauthor/topic: curation/analytics.

Classification:

- `DISCOVERY`: title, author, topic, year, publication type filtering.
- `DETAIL_ACTION`: local publication page and original source/DOI actions.
- `BIBLIOGRAPHIC_SEMANTIC`: citation export, DOI, journal, publisher, volume, issue, pages, ISBN, JUFO, peer review, open access, citation count.
- `SOURCE_SEMANTIC`: Research.fi authoritative source, manual fallback, DOI/source URL, original source.
- `CURATION`: research line, curated themes, audiences, manual fallback inclusion.
- `NAVIGATION`: FI/EN archive sections, publication groups, taxonomy/theme links.

## Pagefind Quality

Publication detail Pagefind is already good for normal title search:

- Plain title audit: **8/8 detail found**, **8/8 detail rank #1**, aggregate ahead **0/8**.
- Exact quoted title audit: **6/8 detail found**, **1/8 detail rank #1**, aggregate ahead **7/8**.
- F3 baseline sample: **4/4 title found**, **4/4 title rank #1**.

Author/topic search is weaker and more ambiguous:

- F3 baseline author sample: **1/2 expected detail found**.
- F3 baseline topic sample: **2/2 had results**, but top results often point to category, keyword, thesis, media or presentation pages before publication details.

Interpretation: Pagefind does not require a publication Find & Explore migration for title findability. A publication-specific browser could improve in-page author/topic discovery, but global search already has strong title behavior.

## Deletion Potential

High-confidence removal candidates from a partial migration:

- Per-table duplicate search inputs and per-table pagination logic can likely be replaced by one shared browser state.
- Repeated FI/EN table filtering code can likely be reduced.
- FI page-specific canonical hydration/rendering code can likely shrink if the visible archive is rendered by a shared browser component.
- Some `table-filters.js` dependency may become unnecessary for the publication archive if all table filtering is retired.

Keep:

- `/data/publications-page.json` as the page projection contract.
- `/data/publications.json` as the generic public feed.
- `/data/researchfi.json` as the scientific publication feed.
- Research.fi canonical resolver and dedup/source-priority logic.
- Publication detail pages.
- DOI/source URL semantics.
- Citation export semantics.
- Bibliographic analytics/KPIs unless a separate analytics redesign is explicitly approved.

Unknown / not a deletion benefit yet:

- Removing Chart.js/dashboard code. It is user-facing analytics, not mere discovery runtime.
- Removing citation export. It is domain-specific value, not archive clutter.
- Removing public JSON endpoints. Those are public contracts and shared consumers, not page-local implementation details.

## Risk Assessment

Bibliographic/domain-semantic risk: **HIGH**

Full migration risks flattening publication-specific concepts into generic cards and filters. DOI, citation export, JUFO, peer review, open access, publisher/journal metadata and manual fallback semantics must remain first-class.

SEO risk: **LOW for partial, MEDIUM for full**

Local detail coverage is already complete for the canonical publication set (`pageUrl` 56/56, Research.fi detail 53/53). A partial archive-browser migration can preserve detail URLs and canonical metadata. A full rewrite would need careful noindex/canonical/Pagefind parity checks.

Accessibility risk: **MEDIUM**

Current pages contain many controls: FI has 8 search inputs, 19 selects and 107 buttons; EN has 8 search inputs and 33 buttons. A shared browser could reduce control sprawl, but it must preserve keyboard navigation, labels, result counts and progressive enhancement.

Performance risk/opportunity: **MEDIUM**

FI currently ships a large HTML page plus 74561 bytes of inline JS and page-local hydration. EN ships large SSR HTML plus 36755 bytes of inline JS. There is credible simplification potential, but not enough evidence to justify replacing all publication-specific affordances.

## Shared-Core Compatibility

Compatible with shared Find & Explore:

- Single search box over title, author, description, keywords and journal/publisher.
- Facets for year, publication type/group, peer-reviewed, open access, research line/theme/audience.
- Sort by year/title/type.
- Result cards that link to local `pageUrl`.
- Progressive enhancement pattern with SSR opening state.

Not suitable for generic shared-core ownership:

- Citation export formatting and download actions.
- DOI/source URL fallback behavior.
- JUFO and citation badges.
- Publication-specific KPI/dashboard semantics.
- Research.fi vs manual fallback source priority.
- Bibliographic JSON-LD/detail semantics.

## Final Recommendation

Final recommendation: **PARTIAL**

Do not keep the current model unchanged: there is real deletion and usability potential in simplifying the archive discovery layer, especially FI. But do not do a full publications Find & Explore migration either. The publication hub needs a publication-specific browser adapter on top of the shared Find & Explore core.

## F3B Implementation Gate

If implementation is approved, use this gate:

1. Build a publication-specific Find & Explore view model from canonical `publicationsPage.items`.
2. Replace archive discovery controls only: search, year/type/group/research filters, sorting and result rendering.
3. Preserve current publication detail URLs, DOI/source actions, citation export, bibliographic badges and analytics semantics.
4. Keep `/data/publications-page.json`, `/data/publications.json` and `/data/researchfi.json` contracts unchanged.
5. Preserve JS-off opening view and current FI/EN content scope.
6. Prove parity:
   - canonical count 56
   - local pageUrl 56/56
   - Research.fi detail 53/53
   - manual fallback records 3
   - FI/EN visible count and group counts unchanged
   - title Pagefind 8/8 rank #1 retained
   - citation export still works
   - DOI/source links preserved
   - a11y/navigation/contrast green

## F4 Dependency

F4 Main-page Find & Explore is **not blocked** by F3B.

Reason: publication detail pages and Pagefind title discovery are already strong enough for main-page surfacing. F4 can link to canonical publication detail pages now. A later partial publication-hub migration may improve the archive experience, but it is not a prerequisite for homepage-level Find & Explore.

## Conclusion

The publication architecture is ready, but the user-facing publication hub is semantically richer than writings or theses. The correct next move is a partial, evidence-gated implementation: shared discovery core, publication-specific bibliographic shell.
