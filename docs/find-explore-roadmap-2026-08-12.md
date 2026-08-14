# Canonical Content v1 -> Find & Explore Roadmap

Date: 2026-08-12
Synchronized: 2026-08-14

This roadmap is the shared source of truth after Canonical Content v1, Find & Explore Writings v1, and Find & Explore Theses v1.

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
merge commit: a18011f596f139395e48536f3292b66dd900c072
closure report: docs/find-explore-theses-v1-closure-2026-08-14.md
```

Repository evidence confirms that F3A has been formally merged and tagged. There is no disagreement between the repository and this synchronized roadmap.

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

## 4. Active Gate

The active gate is F3B Publications decision gate.

F3B is future and decision-gated. Do not assume publications must migrate merely for architectural symmetry.

Start with a suitability/deletion-benefit decision:

- Can Pagefind discovery replace meaningful duplicated runtime?
- Can bibliographic functions remain intact?
- Can citation, type, coauthor, source, DOI, open-access, Research.fi, and JSON-LD semantics remain canonical-data responsibilities?
- Is there enough deletion, UX, SEO, or maintenance benefit to justify a migration?

If yes, implement F3B as a focused checkpoint. If no, explicitly skip or defer; retaining the existing publication implementation is acceptable.

F3C Presentations remains future and evidence-gated. Before any migration, resolve:

- canonical presentation count
- local detail coverage
- external-source semantics
- media semantics
- whether Find & Explore provides meaningful deletion benefit

F4 Main-page Find & Explore is future and high value. It does not have to wait until every archive type has migrated. Writings plus theses are sufficient architectural evidence once both are formally closed.

## 5. Find & Explore Roadmap

Current proof:

```text
writings
  -> independent canonical consumer

theses
  -> independent canonical consumer
```

Recommended order:

```text
CURRENT
  │
  ▼
F3B Publications decision gate
  │
  ├─ implement if deletion/user benefit is demonstrated
  └─ skip/defer if not
  │
  ▼
F4 Main-page Find & Explore
  │
  ▼
O1 Orientation
  │
  ▼
T1 Timeline 2.0
```

F3C Presentations can be scheduled when source/detail/media semantics are understood. It does not need to block F4.

## 6. F4 Main-Page Discovery

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
