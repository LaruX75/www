# Canonical Content v1 -> Find & Explore Roadmap

Date: 2026-08-12
Synchronized: 2026-08-14
Publications FULL update: 2026-08-17
TH-CITE1 Phase 1–3 update: 2026-08-18

This roadmap is the shared source of truth after Canonical Content v1, Find & Explore Writings v1, Find & Explore Theses v1, Find & Explore Publications v1, F4 Research contextual Find & Explore v1, the 2026-08-17 Publications FULL Pagefind + PUB-CITE1 closure, and the 2026-08-18 TH-CITE1 Phase 1–3 thesis CSL + SSR-first archive closure.

## 1. Current State

Canonical Content v1 is closed and tagged.

```text
canonical-content-v1
status: CLOSED / GREEN
PR: #82
merge commit: db2432d1239e3c1553939958be468923fb19c4b7
closure report: docs/canonical-content-v1-closure-2026-08-12.md
```

Find & Explore has two proven independent consumers.

```text
F2 Writings Find & Explore
status: CLOSED / GREEN
tag: find-explore-writings-v1
PR: #83
merge commit: 0b7524636ab99c5debb8a9833aaead9517db699b
closure report: docs/find-explore-writings-v1-closure-2026-08-12.md

F3A Theses Find & Explore
status: CLOSED / GREEN
tag: find-explore-theses-v1
PR: #84
PR title: Theses Find & Explore v1
head commit: face314c8b518aa5286527969722d56511e08e6b
merge commit: a18011f596f139395e48536f3292b66dd900c072
merge timestamp: 2026-08-14T09:06:54Z
tag target: a18011f596f139395e48536f3292b66dd900c072
unit tests: 389/389
combined writings + theses browser smoke: 5 passed
accessibility/navigation/contrast: 31 passed
closure report: docs/find-explore-theses-v1-closure-2026-08-14.md

TH-CITE1 Phase 1–3 — thesis CSL + SSR-first archive
status: CLOSED / GREEN / MAIN
scope: thesis CSL projection + shared APA 7 renderer + SSR-first archive with bounded per-section pagination (supersedes the F3A archive implementation scope, does not rewrite F3A history)
PR: #101
PR title: TH-CITE1 Phase 1–3: thesis CSL, shared APA renderer and SSR-first archive
head commit: 1d461d873d237c0de00ea3d09483cdef6516e29f
merge commit: 0068b49bf7f6cd4c759aa317f1c0db8d558e6cbc
merge timestamp: 2026-08-18T07:52:28Z
raw source records: 170 (one duplicate URL in data.gradut, handle/10024/7879)
canonical unique theses: 169
citation architecture: canonical thesis → buildThesisCslItem → CSL → shared publicationCitation renderer → Eleventy/Nunjucks (APA 7 bracket notation, FI/EN display map)
citation parity vs legacy formatter (canonical unique): 169/169 IDENTICAL
SSR-first archive: /opinnaytteet/ and /en/theses/ render a compact three-section table (Year | Citation (APA 7) | Open) from canonical thesis data at build time; Pagefind is no longer required to make the initial archive visible
Eleventy pagination: bounded 16 SSR permalinks per locale (1 landing + 8 masters + 2 bachelors + 5 reviewed) — not cartesian
SSR archive union per locale: 169/169 FI, 169/169 EN
max rows any single SSR URL: 30 (10 per section × 3 sections)
section pagination: independent between tables, synchronised within each table (top + bottom paginator); JS enabled uses fragment swap to preserve other sections; JS disabled uses real anchor navigation and accepts other-section reset to page 1
Pagefind boundary: Pagefind indexes 169 thesis-tagged fragments and handles active search/filter state only; empty-query archive generation not used
one visible result surface: body.find-explore-active toggles between archive state and Pagefind search state; reset returns to archive state
sitemap: /opinnaytteet/ and /en/theses/ present; 0 paginated URLs across all six per-section route families (three-layer exclusion: eleventyExcludeFromCollections + sitemap.ignore + robots noindex)
detail template: thesisDetail.citationApa surface migrated to thesisDetail.csl | publicationCitation("apa", lang)
public JSON contract: /data/theses.json.citationApa preserved byte-identically; no full internal CSL exposed publicly
JS/no-JS behaviour: SSR archive fully browsable without JavaScript through real pagination anchors; enhanced-state fragment swap does not push misleading single-section URLs
unit tests: 488/488
Phase 3 pagination browser tests: 8/8 (independent state, top+bottom sync, JS-off nav, no full-page reload, no misleading pushState)
F3A theses Find & Explore browser regression: 2/2 + 1 skip (abstract/citation modal triggers deferred to Phase 4)
accessibility/contrast/navigation Playwright bundle: 41/41 + 1 skip
post-merge CI on main 0068b49b: Build and Deploy pass, Accessibility and navigation tests pass, Generate OG Images pass
deletions in Phase 3 scope: src/_includes/thesis-curated-list.njk (removed), pageModel.opening thesis archive slices (removed), obsolete archive filter hooks (not carried forward)
retained for later phases: Phase 4 modal/export migration (src/js/thesis-hub-actions.js still composes browser-side citations), Phase 5 PF5 GLOBAL RESULT PARITY, Phase 6 legacy formatter deletion (src/_data/theses.js#buildApaCitation still populates the public citationApa contract)
Canonical Content v1: unchanged
closure report: docs/th-cite1-phase3-ssr-archive-closure-2026-08-18.md

F3B Publications Find & Explore
status: CLOSED / GREEN
scope: PARTIAL Find & Explore migration
tag: find-explore-publications-v1
PR: #85
PR title: Publications partial Find & Explore
head commit: 7d36d81bbefbe94be426c38cb959a4271854f8a9
merge commit: 00b6e370cf745b946b4f7b962ec56cfe3d2c9955
merge timestamp: 2026-08-14T11:20:57Z
tag target: 00b6e370cf745b946b4f7b962ec56cfe3d2c9955
unit tests: 389/389
combined writings + theses + publications browser smoke: 7 passed
accessibility/navigation/contrast: 38 passed
closure report: docs/find-explore-publications-v1-closure-2026-08-14.md

Publications FULL Pagefind + PUB-CITE1
status: CLOSED / GREEN / MAIN
scope: FULL Pagefind list + canonical CSL citation architecture (supersedes F3B PARTIAL scope, not F3B history)
PR: #99
PR title: Publications FULL Pagefind and citation architecture closure
head commit: 7efcca8ccdc904f456c805b11c9abd8ec489921d
merge commit: 2f752a42f6625dcbfe7761a8d99d4c9e611c37da
merge timestamp: 2026-08-17T10:44:32Z
unit tests: 460/460
default visible publications: 56/56 (FI + EN)
canonical / Pagefind / FI hub / EN hub parity: 56 each; missing=0 extra=0 dup=0
grouping: A / B / C / D / E / G + unclassified (semantic section > h3 > ol)
default ordering: deterministic bibliographic (year DESC → title ASC)
text-query ordering: Pagefind relevance within canonical groups
publication browser smoke: 13/13
regression audit sweep: 14/14
post-merge CI on main 2f752a42: Build and Deploy pass, Accessibility and navigation tests pass, Generate OG Images pass
citation architecture: canonical CSL is the sole publication citation source across list rows, detail card, taxonomy pages, citation modal, Zotero + Mendeley RIS downloads, /api/export-data.json
keyword audit: CLOSED — no implementation (Research.fi own 0/56, OpenAlex enrichment 30/56 not surfaced as author/source keywords)
closure report: docs/publications-full-pagefind-pub-cite1-closure-2026-08-17.md

F4 Research contextual Find & Explore
status: CLOSED / GREEN
scope: PARTIAL contextual MVP
tag: f4-research-find-explore-v1
PR: #87
PR title: Research contextual Find & Explore
head commit: bd580fa75ae8cb4e10e4d3886ada405a01f1b6a2
merge commit: be16a7f352eeb4b817a96ed229b9817a63d57834
merge timestamp: 2026-08-14T13:07:52Z
tag target: be16a7f352eeb4b817a96ed229b9817a63d57834
unit tests: 389/389
combined writings + theses + publications + research browser smoke: 9 passed
accessibility/navigation/contrast: 31 passed as split serial suites
closure report: docs/find-explore-research-f4-closure-2026-08-14.md
```

Repository evidence confirms that F3A and F3B have been formally merged and tagged. There is no disagreement between the repository and this synchronized roadmap.

## 2. Architectural Invariants

Canonical data is authoritative. Canonical objects and projections feed server-rendered HTML, public JSON, JSON-LD, Pagefind metadata, knowledge graph, feeds, exports, and future integrations.

Pagefind is discovery infrastructure. It is not canonical storage, not an identity source, and not the archive generator.

Eleventy remains server-rendered first. Pages should provide useful HTML at build time and remain useful without JavaScript where practical. JavaScript and Pagefind enhance discovery.

The intended Find & Explore model is:

```text
canonical content
      ↓
SSR useful opening/context
      ↓
Pagefind metadata
      ↓
Find & Explore
      ↓
detail pages
```

Deletion is part of success. Find & Explore should replace redundant archive/runtime complexity, not merely add another interface layer. For each migration ask: what can now be deleted?

Measure where useful:

- HTML bytes
- DOM elements
- controls
- local JS
- runtime JSON
- duplicated templates/runtime

Shared architecture does not mean identical UX. Preserve domain semantics:

- publications are bibliographic objects
- presentations have local/external/media source semantics
- theses have author/supervision semantics
- writings have editorial/content-type semantics

## 3. Completed Checkpoints

C1-C3 Canonical Content v1: closed green.

F1 Find & Explore Architecture + Deletion Audit: completed.

```text
report: docs/find-explore-architecture-audit-2026-08-12.md
baseline: docs/data/find-explore-f1-baseline.json
recommendation: HYBRID RECOMMENDED
```

F2 Writings Find & Explore: closed green.

F3 Expansion Suitability Analysis: completed.

```text
report: docs/find-explore-f3-suitability-audit-2026-08-12.md
baseline: docs/data/find-explore-f3-baseline.json
decision: theses selected before publications/presentations
```

F3A Theses Find & Explore: closed green.

TH-CITE1 Phase 1–3 (thesis CSL + SSR-first archive): closed green, on `main`. Supersedes the F3A archive implementation scope while preserving F3A history; retained Phase 4–6 workstreams remain separate.

F3B Publications Find & Explore: closed green as a PARTIAL migration.

## 4. Active Gate

F4 Research contextual Find & Explore is closed green as a PARTIAL contextual MVP.

F3C Presentations remains future and evidence-gated. Before any migration, resolve:

- canonical presentation count: 210
- local detail coverage: 118
- local vs external presentation semantics
- source/media relationships
- Pagefind document coverage
- current archive runtime
- external-source semantics
- media semantics
- whether Find & Explore provides meaningful deletion benefit

Do not assume the writings/theses model can simply be copied. Only migrate presentations if the evidence supports it.

F3D Media / Mediassa is future and needs a suitability audit before implementation. Treat media appearances as their own content/discovery domain. Audit canonical media model, local-detail coverage, external-first items, outlet, date, format, role, topic, source URL, podcast/video/article semantics, existing archive/runtime complexity, and potential deletion benefit. Do not automatically merge Media into Writings or Presentations.

F4 Main-page Find & Explore has closed its Research contextual partial MVP. F3C Presentations and F3D Media remain explicit workstreams, but they did not block F4 and remain separate future gates.

## 5. Find & Explore Roadmap

Current proof:

```text
Find & Explore
├── Writings       CLOSED / GREEN
├── Theses         CLOSED / GREEN
├── Publications   CLOSED / GREEN, PARTIAL
├── Research        CLOSED / GREEN, PARTIAL
├── Presentations  EVIDENCE-GATED
└── Media          SUITABILITY AUDIT NEEDED
```

Recommended order:

```text
O1 Orientation
  │
  ▼
T1 Timeline 2.0
```

F3C Presentations and F3D Media remain explicit workstreams. They can be scheduled when evidence supports them, but neither needs to block F4.

## 6. F4 Main-Page Discovery

F4 Research contextual Find & Explore is closed green as a partial MVP. The homepage remains orientation-first and links to the Research contextual discovery route without mounting Find & Explore itself.

Candidate pages:

- home
- research
- work
- politics
- writings / editorial surfaces

Main pages should explain, interpret, curate, and provide discovery entry points. They should not become miniature archive implementations.

Examples:

```text
home
  -> browse routes
  -> Find & Explore when the user knows the topic

research
  -> evidence about a topic
  -> publications + theses + presentations + writings

politics
  -> what have I done about this issue?
  -> speeches + initiatives + opinions + statements + writings

work
  -> role/topic evidence links

writings/editorial surfaces
  -> combined writings/speeches/opinions discovery
```

## 7. O1 Orientation

Goal: users should understand where they are, how they arrived there, what is adjacent, and how to return to discovery.

Potential components:

- canonical breadcrumbs
- discovery-context return
- result position
- previous/next
- related content
- desktop orientation rail
- compact mobile equivalent
- bottom orientation for continuation

Conceptual model:

```text
breadcrumb
  -> where this content belongs

discovery context
  -> where the user came from

previous / next
  -> adjacent result or curated sequence

related content
  -> continue by theme/context
```

Do not implement O1 inside F3B. Treat it as its own UX/accessibility checkpoint.

## 8. T1 Timeline 2.0

Timeline should evolve from a chronological list into another projection of canonical content.

Conceptually:

```text
year
  ↓
theme
  ↓
content types
  ↓
Find & Explore
```

Potential future content:

- research
- writings
- presentations
- theses
- political activity
- projects
- travel
- media/social material

Timeline must not become an independent data silo.

## 9. E1 External Enrichment

External enrichment is future work. It is not a dependency for Find & Explore v1.

General API rule:

> Add an external API only when it provides new user-visible information, a new relation, verification, normalization, historical recovery, or meaningful automation.

E1A OpenAlex:

- citation counts
- cited/citing works where useful
- related works
- topics/concepts
- authors
- institutions
- collaboration relationships

OpenAlex is enrichment. It is not the authoritative canonical publication source and must not replace Research.fi/canonical publication logic.

E1B Finto / YSO:

```text
localTheme
    ↓ relatedConcept
YSO URI
```

Possible benefits:

- concept normalization
- FI/EN/SV terminology
- semantic linking
- knowledge graph enrichment
- improved discovery

YSO does not replace the site's own taxonomy.

Lower-priority enrichment/verification candidates:

- Crossref
- Unpaywall
- ORCID
- ROR
- DataCite
- OpenAIRE
- DBLP

## 10. POL1 Politics Context

Oulu municipal / KTWeb / council material is already represented on the site. Do not create a roadmap task whose purpose is simply to ingest the same Oulu council material again.

Future value should come from contextual enrichment.

POL1A Finlex:

```text
local political issue
  <-> legislation
  <-> government proposal
  <-> legal change
```

POL1B Parliament open data:

```text
local issue
  <-> national parliamentary process
```

POL1C POHTIVA:

```text
site theme / political issue
  <-> party programmes
```

POL1D historical election-machine answers:

Candidate sources may include Yle, MTV, Kaleva / Alma, other election machines, Wayback, and old personal web archives.

Potential future canonical object:

```text
electionAnswer
  - election
  - year
  - provider
  - question
  - answer
  - explanation
  - source URL/archive evidence
```

Do not invent data or assume API availability. Recovery feasibility must be investigated separately.

## 11. GEO1 Spatial Layer

Oulu provides potentially useful authoritative geospatial sources, including WMS/WFS-type services.

Possible uses:

- districts
- service network
- schools/services
- planning
- voting districts
- election-result geography
- geographically linked political content

Principles:

- For Oulu-specific geography, prefer authoritative Oulu geospatial data when appropriate.
- Do not make Google Maps the canonical geographic authority for local Oulu administrative geography.
- Maps are projections.
- Place/location relationships belong in canonical data.

Do not implement GEO1 now.

## 12. TR1 Trips

Trips are a future canonical-content candidate. Do not create the schema yet.

Core principle:

```text
Trip is the entity.
External services and devices are evidence for the trip.
```

Conceptually:

```text
Trip
  - dates
  - places
  - route/tracks
  - purpose
  - events
  - related content
  - evidence
```

Potential evidence sources:

- Garmin DriveAssist 51, GPX, Trip Log, GPX archives, dashcam location/time evidence
- Apple Photos, Google Photos, EXIF, GPS, timestamps, Takeout/export data
- Instagram posts, Bluesky posts, Facebook historical posts where available
- calendar, email, reservations, presentations, conferences/events, phone GPX, historical web pages

Garmin, Instagram, Google, and social services do not define the trip. They provide observations/evidence.

Potential future UI: `/trips/` or `/matkat/` with map, timeline, year, country/place, purpose, route, photos, social reports, and related presentations/events.

TR1 requires a separate audit/design phase.

## 13. D1 Distribution And Social

Keep a strict distinction:

```text
INGEST
  external -> canonical/evidence

DISTRIBUTION
  canonical -> external
```

Channels may include:

- RSS
- JSON Feed
- Web Share
- Cite / citation export
- Facebook
- Bluesky

Bluesky is interesting because of open AT Protocol/API:

```text
canonical content -> Bluesky publishing
Bluesky -> social archive / evidence
```

Selective historical publishing to Bluesky may be technically possible using historical `createdAt` values, but the order remains:

```text
canonical archive first
  -> selective distribution second
```

Instagram Professional API ingest may be useful for travel evidence, photos/media, and short reports. Do not assume Instagram should be mirrored wholesale.

Facebook should remain controlled or semi-automatic distribution:

```text
canonical item
  -> generated share text
  -> preview/edit
  -> publish
```

Avoid making Facebook authoritative.

## 14. HR1 Historical Recovery

Historical recovery is separate from normal production build/runtime.

Candidate sources:

- Internet Archive / Wayback
- CDX
- old `cc.oulu.fi` pages
- previous personal websites
- old blogs
- old SlideShare material
- historical election-machine material
- historical social content

Cheerio may be useful for parsing server-rendered historical HTML.

Conceptual pipeline:

```text
source/archive
      ↓
recovery crawler
      ↓
inventory
      ↓
compare with canonical
      ↓
classification
```

Inventory states:

```text
EXISTS
MISSING
DUPLICATE
ARCHIVE ONLY
```

Only after review should material enter canonical content. Do not make a Wayback crawler part of normal Eleventy builds.

## 15. S1 SEO Closure

SEO is not generic filler text. Validate the canonical discovery model:

```text
hub
  -> explains and organizes

topic
  -> aggregates subject authority

detail
  -> canonical document

Pagefind
  -> discovery
```

Audit:

- title
- description
- canonical URL
- JSON-LD
- OG
- sitemap
- hreflang
- internal links
- indexability

Pay special attention to large archive pages. Ask whether the hub still contains large quantities of detail content unnecessarily now that canonical detail pages exist.

## 16. P1 Performance Closure

Compare final states against F1/F3 baselines.

Measure:

- HTML
- DOM
- JS
- runtime JSON
- Pagefind index
- controls
- network behavior
- build characteristics

Deletion and simplification should remain visible in measured output, not just in implementation style.

## 17. L1 Listen / Radio

Architectural principle:

```text
Pagefind determines:
  what content belongs in a result set

Canonical content provides:
  readable source content

TTS provides:
  audio
```

Possible future actions:

- Listen to this
- Listen to these results
- Continue listening

Do not implement until discovery architecture is stable.

## 18. AI1 Semantic / LLM

This remains deliberately late.

First evaluate:

- canonical metadata
- Pagefind
- knowledge graph
- Finto / YSO
- OpenAlex enrichment
- related-content relationships

Only introduce embeddings if a demonstrated discovery problem remains. Only introduce an LLM / "Ask this site" layer when it solves a clear user task that structured discovery cannot.

Do not add AI merely because the architecture could support it.

## 19. Explicit Non-Goals

Do not use this roadmap synchronization task to:

- modify production runtime
- change canonical schemas
- install dependencies
- implement F3B
- implement F4
- add OpenAlex
- add Finto
- add Finlex
- add Parliament APIs
- scrape election machines
- add Oulu maps
- create Trip objects
- access personal email/calendar/photos
- add Instagram
- add Bluesky
- add Facebook publishing
- create Wayback crawlers
- add embeddings
- add an LLM

## 20. Gate Rules

Project-wide checkpoint rule:

```text
implementation
  -> local verification
  -> focused commit
  -> PR
  -> available CI/checks
  -> merge
  -> annotated version/checkpoint tag
  -> closure report
  -> next phase
```

Do not start the next implementation phase inside the previous phase's branch.

Do not force every archive into identical architecture before improving main user experience. Once writings and theses are closed, the project can move from proving architecture toward visible user value:

- discovery
- orientation
- connections between content
- temporal context
- geographic context
- research context
- political context

while continuing to reduce unnecessary implementation complexity.
