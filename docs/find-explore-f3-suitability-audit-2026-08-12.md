# F3 — Find & Explore Expansion Suitability Audit

## 1. Executive summary

F3 was run as an audit-only gate on a clean `origin/main` worktree rooted at closure commit `e9ae44dc`, after `canonical-content-v1` and `find-explore-writings-v1` were already green.

Main result:

| Candidate | Status |
| --- | --- |
| Theses / opinnäytteet | `MIGRATE NEXT` |
| Publications / julkaisut | `MIGRATE LATER` |
| Presentations / esitykset | `NEEDS MORE EVIDENCE` |

Overall recommendation:

`F3 EXPANSION PARTIALLY RECOMMENDED`

Why:

- Theses already have `169/169` local canonical detail pages, strong title/author Pagefind behavior, and a heavy archive runtime whose discovery responsibilities can plausibly be reduced without moving thesis semantics into Pagefind.
- Publications have strong canonical maturity, but the archive still carries bibliographic, citation and analytics semantics that are not good Find & Explore targets.
- Presentations have high runtime complexity, but only partial local detail coverage (`118/210`) and strong source/media semantics, so migration should not start before evidence around local-detail coverage and scope is stronger.

`PRODUCTION RUNTIME CHANGES = NONE`

## 2. Repository baseline

F3 was executed in a clean temporary worktree to avoid unrelated dirty changes in the main workspace.

| Check | Result |
| --- | --- |
| `git status --short` | clean before F3 work |
| baseline HEAD | `e9ae44dc` |
| closure commit present | yes |
| `git describe --tags --always` | `find-explore-writings-v1-1-ge9ae44dc` |
| F3 branch | `codex/find-explore-f3-suitability` |

Latest baseline history captured before F3 work:

```text
e9ae44dc docs: close find explore writings v1
0b752463 Merge pull request #83 ...
c0df2950 fix: align writings find explore search index
```

Primary evidence read:

- [docs/find-explore-roadmap-2026-08-12.md](./find-explore-roadmap-2026-08-12.md)
- [docs/find-explore-architecture-audit-2026-08-12.md](./find-explore-architecture-audit-2026-08-12.md)
- [docs/find-explore-writings-f2-report-2026-08-12.md](./find-explore-writings-f2-report-2026-08-12.md)
- [docs/find-explore-writings-v1-closure-2026-08-12.md](./find-explore-writings-v1-closure-2026-08-12.md)
- [docs/theses-architecture-audit-2026-08-11.md](./theses-architecture-audit-2026-08-11.md)
- [docs/publications-architecture-audit-2026-08-11.md](./publications-architecture-audit-2026-08-11.md)
- [docs/presentations-architecture-alignment-2026-08-11.md](./presentations-architecture-alignment-2026-08-11.md)

## 3. Writings v1 reference architecture

Writings remains the F3 reference implementation, not a mandatory template.

Reference flow:

```text
canonical writingsPage.items
        ↓
/data/writings-page.json public projection
        ↓
canonical-derived HTML metadata
        ↓
Pagefind
        ↓
Find & Explore
```

Important F3 interpretation:

- canonical content stays authoritative
- public JSON stays a distribution contract
- Pagefind absorbs discovery, not content normalization
- client JS is interaction, not canonical archive reconstruction

## 4. Writings reference metrics

Final closure values from `docs/find-explore-writings-v1-closure-2026-08-12.md`:

| Page | HTML bytes | Elements | Search inputs | Selects | Buttons | Tables | Runtime JSON fetched by page | Independent discovery runtimes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/kirjoitukset/` | 120447 | 1136 | 3 | 2 | 35 | 0 | 0 | 0 |
| `/en/writings/` | 145537 | 1397 | 3 | 2 | 35 | 0 | 0 | 0 |

Reference qualitative outcome:

- Pagefind quality: strong
- JS-off: useful curated opening remains
- accessibility/navigation/contrast: green
- runtime deletion: real
- public JSON retained: yes

This is the bar for a worthwhile expansion candidate: meaningful discovery/runtime simplification without collapsing domain semantics into search.

## 5. Candidate baseline measurements

Freshly built `_site` measurements were captured into [docs/data/find-explore-f3-baseline.json](./data/find-explore-f3-baseline.json) with [scripts/audit-find-explore-f3.js](../scripts/audit-find-explore-f3.js).

| Page | HTML bytes | Elements | Search inputs | Selects | Buttons | Tables | Rows | Cards | Local scripts | Inline JS bytes | Runtime JSON fetched by page-local archive logic |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/opinnaytteet/` | 280338 | 1631 | 5 | 9 | 180 | 3 | 18 | 8 | 8 | 49692 | `/data/theses.json` |
| `/en/theses/` | 260845 | 1488 | 5 | 1 | 165 | 3 | 18 | 8 | 8 | 43639 | `/data/theses.json` |
| `/julkaisut/` | 350585 | 2079 | 8 | 19 | 107 | 7 | 29 | 13 | 8 | 74561 | `/data/publications-page.json` |
| `/en/publications/` | 282735 | 2155 | 8 | 0 | 33 | 7 | 57 | 11 | 5 | 36755 | none; SSR-heavy page-specific logic |
| `/esitykset/` | 305195 | 2520 | 2 | 1 | 52 | 3 | 3 | 8 | 6 | 6181 | `/data/presentations-page.json` |
| `/en/presentations/` | 440574 | 1440 | 2 | 0 | 33 | 3 | 3 | 4 | 5 | 237729 | none; large inline SSR/runtime logic |

Candidate dataset facts:

| Dataset | Canonical items | With local `pageUrl` | With description | With lang |
| --- | ---: | ---: | ---: | ---: |
| theses | 169 | 169 | 49 | 169 |
| publications | 56 | 56 | 56 | 56 |
| presentations | 210 | 118 | 210 | 75 |

Notes:

- “Runtime JSON fetched by page-local archive logic” is the F3 decision metric. Shared site scripts may reference other feeds, but they are not counted as archive-specific migration benefit.
- “Visible records” and “total records represented in aggregate HTML” are only partially measurable from mixed SSR + hydration pages. Where exact parity would be false precision, F3 relies on canonical item counts plus measured SSR row counts.

## 6. User-task inventory

| Content type | Verified current user tasks |
| --- | --- |
| Theses | find thesis by title, find by author, browse by year, browse by thesis role bucket, browse by research facet, inspect abstract, export citation, open local thesis detail, open OuluREPO source |
| Publications | find publication by title, find by author, browse by year, browse by publication group/type, browse by topic/keyword, inspect KPI/analytics, export citation, open canonical detail, open DOI/source |
| Presentations | find presentation by title, browse by source section, browse by year/date where present, browse by topic/keyword, open local detail when available, open external slides/video/source, inspect source-specific metadata |

Tasks intentionally not counted as “discovery only”:

- citation export
- DOI/source resolution
- video/slide opening
- source-priority and dedup behavior
- curated section design

## 7. Discovery vs domain semantics

| Task | Class |
| --- | --- |
| search title | `DISCOVERY` |
| search author/person | `DISCOVERY` |
| browse by year | `DISCOVERY` |
| browse by thesis/publication/presentation type | `DISCOVERY` |
| browse topic/keyword/theme | `DISCOVERY` |
| open canonical detail page | `NAVIGATION` |
| open OuluREPO / DOI / SlideShare / YouTube / source record | `DETAIL_ACTION` |
| export citation | `DETAIL_ACTION` + `DOMAIN_SEMANTIC` |
| read abstract / bibliographic metadata / presentation description | `DETAIL_ACTION` via canonical detail content |
| KPI dashboard / citation charts | `DOMAIN_SEMANTIC` |
| source merge / dedup / fallback resolution | `CURATION` + `DOMAIN_SEMANTIC` |

F3 conclusion:

- Find & Explore is a candidate replacement for discovery controls.
- It is not a candidate replacement for detail semantics, canonical resolution or source actions.

## 8. Theses architecture

Current evidence:

- authoritative source: `src/_data/theses.js`
- public projection: `/data/theses.json`
- detail projection: `/opinnaytteet/<id>/`
- archive pages: [src/opinnaytteet.njk](../src/opinnaytteet.njk), [src/en/theses.njk](../src/en/theses.njk)

Current flow:

```text
theses.js canonical objects
      ↓
/data/theses.json
      ↓
FI/EN archive SSR skeleton
      ↓
ContentEngine query(/data/theses.json)
      ↓
inline thesis page logic
      ↓
table fill + local filters + year/type/keyword UI
```

Architecture characteristics:

- FI and EN both ship archive-specific inline JS
- both hydrate from the same public thesis dataset
- both still render tables and multiple filter controls
- local detail pages already exist for every thesis
- abstract/citation/source semantics already live on the canonical detail path

## 9. Theses suitability

Assessment:

- Discovery replacement potential: high
- Detail readiness: high
- Runtime deletion potential: high
- Domain-semantic coupling risk: medium-low

Why theses is strong:

- `169/169` canonical items already have local detail URLs
- title queries: `4/4` found, `4/4` top1
- author queries: `2/2` found, `2/2` top1
- archive carries many discovery controls: 5 search inputs, 9 selects, 180 buttons
- current page still hydrates from `/data/theses.json`
- thesis-specific semantics are comparatively contained: abstract, authorship, type and OuluREPO link are already canonical detail concerns

What Pagefind could plausibly replace:

- title search
- author search
- large parts of topic discovery
- some year/type navigation if surfaced as Find & Explore filters instead of table UI

What it should not replace:

- authoritative thesis metadata
- abstract provenance
- source repository link logic
- citation generation

Suitability verdict:

`MIGRATE NEXT`

## 10. Publications architecture

Current evidence:

- authoritative source: `researchfiContent.js` + manual fallbacks
- page projection: `/data/publications-page.json`
- detail projection: `/julkaisut/<canonical-id>/`
- archive pages: [src/julkaisut.njk](../src/julkaisut.njk), [src/en/publications.njk](../src/en/publications.njk)

Current flow:

```text
Research.fi + manual fallbacks
      ↓
source priority + dedup
      ↓
canonical publication objects
      ↓
publicationsPage.items
      ↓
FI SSR + JSON hydration
EN SSR-heavy grouped archive
      ↓
tables + KPI analytics + citation/export behavior
```

Architecture characteristics:

- canonical detail coverage is complete
- FI still fetches `/data/publications-page.json`
- EN remains SSR-heavy with publication-group views
- archive logic includes analytics, citation export, bibliographic formatting and multiple group tables
- canonical/publication semantics are much richer than writings or theses

## 11. Publications suitability

Assessment:

- Discovery replacement potential: medium
- Detail readiness: high
- Runtime deletion potential: medium
- Domain-semantic coupling risk: high

Measured evidence:

- title queries: `4/4` found, `4/4` top1
- person queries: mixed, `1/2` sample found as expected
- archive UI remains large: 8 search inputs, 19 selects, 7 tables, 107 buttons
- canonical details exist for all `56/56` items

Why publications is not first:

- the archive is not only discovery UI; it is also a bibliographic dashboard
- DOI/source provenance, manual fallback handling, Research.fi priority, dedup and citation formatting are central semantics
- Find & Explore can help access publications, but it cannot replace the publication archive’s semantic role without substantial scope negotiation

What still makes it viable later:

- local detail pages are strong
- title discovery already maps well to Pagefind
- FI still contains a removable runtime fetch layer

Suitability verdict:

`MIGRATE LATER`

## 12. Presentations architecture

Current evidence:

- authoritative source layer: presentation source merge in `presentationsPage` pipeline
- public projection: `/data/presentations-page.json`
- local details: partial, source-dependent
- archive pages: [src/esitykset.njk](../src/esitykset.njk), [src/en/presentations.njk](../src/en/presentations.njk)
- FI runtime: [src/js/presentations-page.js](../src/js/presentations-page.js)

Current flow:

```text
heterogeneous source inputs
      ↓
canonical presentation objects
      ↓
/data/presentations-page.json
      ↓
FI async client archive
EN grouped SSR/archive logic
      ↓
source-specific rendering + media/source actions
```

Architecture characteristics:

- strongest source heterogeneity of the three candidates
- only `118/210` canonical items currently expose local `pageUrl`
- language coverage is partial (`75/210`)
- FI uses one dedicated archive runtime fetch
- EN still contains large inline page logic and source-grouped rendering
- local detail semantics are uneven because many items remain external-first

## 13. Presentations suitability

Assessment:

- Discovery replacement potential: medium
- Detail readiness: partial
- Runtime deletion potential: medium-high
- Domain-semantic coupling risk: high

Measured evidence:

- title queries: `4/4` found, `4/4` top1 for sampled local details
- topic queries are broad and collide with cross-site material
- archive carries fewer controls than publications/theses, but much heavier source/media semantics
- only partial local-detail coverage makes “one result = one local landing page” unproven site-wide

Why evidence is not yet enough:

- Find & Explore would be strongest when every important item resolves to a local canonical detail page
- presentations still mix local detail items, external media items and source-section semantics
- migration risks flattening source distinctions that currently matter to users

Suitability verdict:

`NEEDS MORE EVIDENCE`

## 14. FI / EN differences

| Content type | Same canonical set? | Same visible scope? | Same runtime model? | Same detail coverage? | F3 reading |
| --- | --- | --- | --- | --- | --- |
| theses | yes | near-same canonical scope | no, but close | yes | manageable |
| publications | yes | same dataset, different presentation emphasis | no | yes | more fragile |
| presentations | no practical parity at interaction level | no, EN is more source-grouped | no | no | highest divergence |

F3 conclusion:

- FI/EN symmetry is not required.
- Theses already behaves close enough to one canonical discovery surface.
- Publications and especially presentations still encode meaningful FI/EN and source-structure differences.

## 15. Pagefind readiness

| Metadata | Theses | Publications | Presentations |
| --- | --- | --- | --- |
| title | `READY` | `READY` | `READY` |
| contentType | `PARTIAL` | `PARTIAL` | `PARTIAL` |
| lang | `READY` | `READY` | `PARTIAL` |
| year | `PARTIAL` | `READY` | `PARTIAL` |
| topic | `PARTIAL` | `PARTIAL` | `PARTIAL` |
| type | `PARTIAL` | `PARTIAL` | `PARTIAL` |
| author/person | `READY` | `PARTIAL` | `NOT_NEEDED` |
| source semantics | `PARTIAL` | `PARTIAL` | `PARTIAL` |
| canonical pageUrl | `READY` | `READY` | `PARTIAL` |

Interpretation:

- theses and publications are Pagefind-ready for detail-first discovery
- presentations is only partially ready because local canonical destination coverage is incomplete

## 16. Pagefind quality

Sample audit summary from [docs/data/find-explore-f3-baseline.json](./data/find-explore-f3-baseline.json):

| Candidate | Title queries found | Title queries top1 | Person queries found | Topic queries found |
| --- | ---: | ---: | ---: | ---: |
| theses | 4/4 | 4/4 | 2/2 | 2/2 |
| publications | 4/4 | 4/4 | 1/2 | 2/2 |
| presentations | 4/4 | 4/4 | n/a | 2/2 |

Observed collisions:

- theses topic queries often surface taxonomy/theme pages above or alongside details
- publication person search is not consistently as direct as title search
- presentation topical queries compete with media/news/topic pages and not only presentation details

F3 reading:

- detail-title search is already good for all three sampled candidates
- discovery broadening beyond title search is strongest for theses, less direct for publications, and noisier for presentations

## 17. Deletion potential

| Candidate | Remove from page | Keep | Replace | Share | Unknown |
| --- | --- | --- | --- | --- | --- |
| theses | repeated search boxes, some year/type keyword controls, JSON hydration, table-fill logic | local details, citation modal, source links | table-first discovery with Find & Explore | Pagefind UI core later | exact retained SSR opening shape |
| publications | part of title/topic discovery UI, FI runtime fetch layer | KPI analytics, citation export, DOI/source logic, bibliographic detail | some archive entry search | possible shared query/result UI | how much group-table UI can disappear safely |
| presentations | FI source-archive fetch/search, some grouped discovery controls | media/source actions, local detail cards, source semantics | some archive browse/search | possible later | whether partial local-detail coverage is enough |

Important distinction:

- public JSON retention is not counted as a deletion loss
- page-local runtime deletion is the real migration benefit

## 18. Progressive enhancement

| Candidate | Suitability |
| --- | --- |
| theses | `GOOD` |
| publications | `ACCEPTABLE` |
| presentations | `WEAK` |

Reasoning:

- theses can plausibly keep a curated opening plus canonical detail links without rendering full discovery tables
- publications can keep strong SSR hub content, but removing too much archive structure risks weakening bibliographic overview value
- presentations currently relies heavily on source-grouped archive structure, especially in EN

## 19. SEO suitability

| Candidate | SEO migration risk | Why |
| --- | --- | --- |
| theses | `LOW` | strong local detail pages already exist and Pagefind already resolves to them well |
| publications | `MEDIUM` | detail pages are strong, but aggregate archive still carries bibliographic overview and type-group value |
| presentations | `HIGH` | local detail coverage is partial and aggregate/source pages still carry substantial indexable role |

F3 conclusion:

- theses is the only candidate whose local detail layer is clearly ready to shoulder discovery traffic

## 20. Accessibility suitability

| Candidate | Likely effect |
| --- | --- |
| theses | `IMPROVE` |
| publications | `NEUTRAL` |
| presentations | `RISK` |

Why:

- theses has dense repeated controls and table interaction that could be simplified
- publications may shrink some controls, but much of the archive complexity is meaningful and will remain
- presentations risks replacing understandable source-grouped navigation with a weaker generic layer unless detail coverage improves first

## 21. Maintenance impact

| Candidate | Current maintenance burden | F3 impact if migrated |
| --- | --- | --- |
| theses | duplicated FI/EN archive JS, JSON hydration, table filling, keyword/year/type logic | meaningful reduction |
| publications | FI hydration + EN grouped SSR + citation/chart logic | moderate reduction only |
| presentations | dedicated FI runtime + large EN inline grouping logic + source-specific rendering | potentially large later, but not yet safe |

Important note:

- A migration is valuable when it removes a parallel discovery architecture.
- It is not valuable if it merely hides a content-type-specific domain UI behind a generic search shell.

## 22. Candidate scorecard

| Dimension | Theses | Publications | Presentations |
| --- | --- | --- | --- |
| Canonical maturity | `HIGH` | `HIGH` | `MEDIUM` |
| Detail coverage | `HIGH` | `HIGH` | `MEDIUM` |
| Pagefind readiness | `HIGH` | `MEDIUM` | `MEDIUM` |
| Current UI complexity | `HIGH` | `HIGH` | `MEDIUM` |
| Runtime complexity | `HIGH` | `MEDIUM` | `HIGH` |
| Runtime JSON removal potential | `HIGH` | `MEDIUM` | `MEDIUM` |
| DOM reduction potential | `MEDIUM` | `MEDIUM` | `LOW` |
| UI deletion potential | `HIGH` | `LOW` | `MEDIUM` |
| Maintenance benefit | `HIGH` | `MEDIUM` | `MEDIUM` |
| Progressive enhancement | `HIGH` | `MEDIUM` | `LOW` |
| SEO risk | `LOW` | `MEDIUM` | `HIGH` |
| Accessibility risk | `LOW` | `MEDIUM` | `HIGH` |
| Domain-semantic complexity | `MEDIUM` | `HIGH` | `HIGH` |
| Migration risk | `LOW-MEDIUM` | `MEDIUM-HIGH` | `HIGH` |
| Expected user benefit | `HIGH` | `MEDIUM` | `MEDIUM` |

## 23. Comparison with Writings v1

| Dimension | Writings v1 | Theses | Publications | Presentations |
| --- | --- | --- | --- | --- |
| Legacy discovery complexity | `HIGH` | `HIGH` | `HIGH` | `MEDIUM-HIGH` |
| JSON runtime | `REMOVED` | `PRESENT` | `PRESENT in FI` | `PRESENT in FI` |
| DOM burden | `LOW after F2` | `HIGH` | `HIGH` | `MEDIUM-HIGH` |
| Pagefind readiness | `HIGH` | `HIGH` | `MEDIUM-HIGH` | `MEDIUM` |
| Domain semantics | `LOW-MEDIUM` | `MEDIUM` | `HIGH` | `HIGH` |
| Deletion potential | `PROVEN` | `HIGH` | `MEDIUM` | `MEDIUM` |
| Migration risk | `LOW` | `LOW-MEDIUM` | `MEDIUM-HIGH` | `HIGH` |

Why theses is the closest successor:

- like writings, it has strong local details and a real parallel discovery runtime
- unlike publications and presentations, its archive semantics are less entangled with source-specific or bibliographic behavior

## 24. Recommended migration order

Evidence-based order:

1. `THESES`
2. `PUBLICATIONS`
3. `PRESENTATIONS`

Interpretation:

- `THESES` is justified now.
- `PUBLICATIONS` is reasonable only after a narrowly scoped discovery-only plan.
- `PRESENTATIONS` should wait for stronger local-detail parity evidence.

## 25. Selected F3A candidate

`F3A = THESES`

Best benefit ÷ risk ratio because:

- complete local detail coverage already exists
- Pagefind quality is already strong for title and author lookup
- archive runtime is heavy and duplicated
- thesis semantics can stay canonical/detail-local without asking Pagefind to become a thesis engine

## 26. F3A acceptance gate

Theses expansion should be accepted only if all of these stay true:

- canonical parity: no unexplained item drift from `theses.js`
- user-task parity: title, author, year/type/topic discovery remain possible
- domain semantics: abstract, source link, thesis metadata and citation stay canonical/detail responsibilities
- Pagefind quality: known thesis detail documents remain findable and remain top results for exact title queries
- deletion: at least one meaningful redundant discovery/runtime layer is removed from FI/EN archives
- performance measured before/after: HTML, DOM, controls, inline JS, page-local runtime JSON
- progressive enhancement: useful SSR intro + canonical thesis links remain
- accessibility: existing gate remains green
- SEO: no material regression in thesis detail discoverability
- public contract: `/data/theses.json` remains unless separately justified

## 27. Do-not-migrate boundaries

### Theses

- authoritative thesis metadata
- abstract provenance
- OuluREPO source resolution
- citation generation
- thesis-type semantics beyond discovery labeling

### Publications

- DOI/source resolution
- bibliographic formatting
- citation generation/export
- Research.fi source priority
- manual fallback vs Research.fi dedup semantics
- publication-group analytics logic

### Presentations

- source merge
- local-vs-external media resolution
- SlideShare/Canva/YouTube/source semantics
- event/source-specific action logic
- curated source grouping where it remains user-meaningful

## 28. Shared FindExplore assessment

Current writings implementation should not yet be generalized as a universal component.

Classification:

| Area | Classification |
| --- | --- |
| Pagefind query/state/result loop | `GENERIC` |
| writings result labeling and filters | `WRITINGS-SPECIFIC` |
| EN writings FI-index bridging | `SHOULD REMAIN LOCAL` |
| candidate-level extraction after a second consumer | `POTENTIAL F3 EXTRACTION` |

Smallest plausible future shared boundary:

```text
FindExplore core
    ↓
Pagefind query, state, result hydration

consumer config
    ↓
scope, labels, filters, metadata chips, result subtitle rules
```

No extraction is justified in F3 itself.

## 29. Future architecture implications

F3 does not change the later roadmap order directly, but it does sharpen one principle:

- main-page or topic-hub discovery should prefer content types whose canonical detail layer is already complete
- theses is now the strongest next proof point for a second real Find & Explore consumer
- publications and presentations should not be used as generic-component forcing functions

Implication for later hubs such as home, research, work, politics, Kynästä and timeline:

- favor detail-first discovery surfaces
- do not pull in domain-heavy archives until their local detail role is clear

## 30. Embeddings/LLM assessment

`EMBEDDINGS / LLM = NOT JUSTIFIED`

Reason:

- current F3 candidates do not expose a discovery failure that Pagefind clearly cannot handle
- title-based detail retrieval is already strong
- topic collisions are real, but still belong first to content architecture and Find & Explore scope decisions, not to an LLM layer

Future research question only:

- whether cross-content topical intent ranking later needs semantic help after a second Find & Explore consumer exists

## 31. Risks / unresolved questions

- presentations local-detail coverage is partial; a migration recommendation there would currently be premature
- publication person-search quality is weaker than title-search quality
- thesis archive references `/js/content-presets.js`; the built asset exists, but the repository-level source path is atypical and worth a later cleanup audit
- exact “visible records in aggregate HTML” is not uniformly measurable across mixed SSR/hydration pages without overfitting audit logic
- publications still need a narrow scope definition if they are ever chosen later, otherwise archive semantics will sprawl into the migration

## 32. Final decision

Candidate statuses:

- Theses / opinnäytteet: `MIGRATE NEXT`
- Publications / julkaisut: `MIGRATE LATER`
- Presentations / esitykset: `NEEDS MORE EVIDENCE`

Overall recommendation:

`F3 EXPANSION PARTIALLY RECOMMENDED`

Rationale:

- There is one clearly justified next consumer for Find & Explore: theses.
- Publications remain promising but should not be the next implementation because bibliographic/archive semantics are heavier.
- Presentations should not move next because local-detail parity is not yet complete enough.

Audit outputs created:

- [docs/find-explore-f3-suitability-audit-2026-08-12.md](./find-explore-f3-suitability-audit-2026-08-12.md)
- [docs/data/find-explore-f3-baseline.json](./data/find-explore-f3-baseline.json)
- [scripts/audit-find-explore-f3.js](../scripts/audit-find-explore-f3.js)
