# T1B1 Timeline Projection Foundation

Date: 2026-08-20

Status: CLOSED / GREEN / BRANCH

Branch: `feat/t1b1-timeline-projection`

Base main SHA: `6eae9971176cb8cd1f717c0ab49aa312297cacb1`

## 1. Scope

T1B1 adds the smallest internal build-time projection layer needed to prove the Timeline 2.0 architecture:

```text
existing canonical/domain semantics
  -> build-time projection helper
  -> normalized internal timeline items
  -> deterministic ordering
  -> deterministic year grouping
  -> Nunjucks-ready internal data
```

Delivered in this phase:

- shared internal projection helper
- internal build-time data module
- focused unit tests
- representative read-only audit

Not delivered in this phase:

- no public timeline UI changes
- no Pagefind timeline behavior
- no public JSON
- no runtime JS
- no new taxonomy
- no Canonical Content v1 changes

## 2. Dependency on T1A

T1B1 starts from the merged T1A audit evidence on `main`:

- council timeline remains the strongest existing SSR/build-time reference
- current timeline surfaces mix canonical projection and legitimate manual companion facts
- no current timeline requires Pagefind for untouched SSR
- no current timeline uses a dedicated runtime timeline JSON feed
- companion/editorial chronology must not be forced into canonical ownership

Relevant source docs:

- [t1-timeline-2-audit-2026-08-20.md](./t1-timeline-2-audit-2026-08-20.md)
- [find-explore-roadmap-2026-08-12.md](./find-explore-roadmap-2026-08-12.md)
- [ci-closure-1-2026-08-20.md](./ci-closure-1-2026-08-20.md)

## 3. Authoritative Input Sources Chosen

Chosen representative canonical source collections:

- `blog`
- `politics`
- `publications`

Current canonical loader reused:

- `readCouncilMeetingCollections()` from [councilMeetings.js](../src/_data/councilMeetings.js)

Current canonical serializer reused:

- `toPublicContentRecord()` from [toPublicContentRecord.js](../src/_utils/toPublicContentRecord.js)

Why these sources were chosen:

- they already provide stable canonical identity through local canonical URL
- they already provide authoritative full dates
- they already provide canonical local `pageUrl`
- they already provide resolved canonical `contentType`
- they already carry existing `contexts` where such semantics exist

Why theses and Research.fi-driven publication detail records were not chosen in T1B1:

- their current canonical/detail architecture reliably provides authoritative year, but not consistently authoritative full date
- T1B1 must not invent approximate dates such as `YYYY-01-01`
- forcing those families into the first foundation pass would violate the explicit date-normalization boundary

That boundary is documented now rather than hidden by coercion.

Important semantic boundary:

```text
filesystem directory != canonical content domain
```

In T1B1 the collection names above are implementation provenance only. They are not projected into the generic `TimelineItem`, and they are not treated as authoritative content-domain semantics.

## 4. Projection Contract

Internal projected item shape:

```json
{
  "id": "/blog/example/",
  "pageUrl": "/blog/example/",
  "title": "Example",
  "date": "2026-08-20",
  "year": 2026,
  "contentType": "blogPost",
  "contexts": ["research", "teaching"]
}
```

Rules:

- canonical identity preserved
- canonical local `pageUrl` preserved
- canonical `contentType` preserved
- `contexts` copied only from authoritative existing semantics
- canonical `contentType` is the semantic content classification
- no whole-source-object passthrough
- no timeline-specific canonical fields added
- no labels localized into the projection
- no filesystem collection/directory value exposed as semantic domain metadata

Files:

- [timelineProjection.js](../src/_utils/timelineProjection.js)
- [timelineProjection.js](../src/_data/timelineProjection.js)

## 5. Identity Rule

- projection reuses canonical `id`
- for the chosen source families, canonical `id` is the canonical local content URL produced by the existing serializer
- no human-maintained timeline IDs were introduced
- duplicate projected identity is rejected as a structural error
- duplicate projected `pageUrl` is rejected as a structural error

Proof:

- unit tests cover duplicate `id` rejection
- unit tests cover duplicate `pageUrl` rejection
- audit result on representative corpus: both duplicate sets empty

## 6. Date Normalization Rule

T1B1 adds one controlled build-time normalization boundary:

- accepted:
  - valid `Date` objects
  - strings with authoritative full date prefix `YYYY-MM-DD`
- excluded:
  - missing date
  - invalid date
  - approximate year-only value such as `2026`

Normalization result:

- projected `date` is always `YYYY-MM-DD`
- projected `year` is derived only from that normalized authoritative date

No browser date parsing is introduced.

## 7. Ordering and Tie-Break

Deterministic ordering:

- primary: `date DESC`
- tie-break: `pageUrl ASC`

Choice rationale:

- `pageUrl` is stable, canonical, and local for the chosen source families
- no collection iteration order is used
- no Pagefind relevance is used

## 8. Year Grouping

Build-time grouping rule:

```text
project
  -> sort newest-first
  -> group by derived year
```

Output is Nunjucks-ready internal data:

- `items`
- `yearGroups`
- `itemsPerYear`
- `earliestYear`
- `latestYear`

No production HTML consumes this yet in T1B1.

## 9. Contexts Rule

- existing canonical `contexts` are copied as-is
- context order is preserved except for duplicate removal
- no new shared theme taxonomy is introduced
- no topic/category/keyword is mapped into a timeline context
- no topic -> Research inference exists anywhere in the helper

Explicit no-inference rule:

```text
Research membership
  = canonical contexts only
```

## 10. Canonical vs Companion Boundary

T1B1 implements only canonical projected items.

Conceptual boundary retained:

- canonical item = projected from canonical object
- companion item = explicit domain/page-owned editorial fact

Examples intentionally deferred as companion work:

- election results
- trust-role context
- milestone era markers
- council quiet markers
- politics editorial synthesis notes

T1B1 does not migrate those datasets and does not flatten them into a new master content model.

## 11. Council Timeline Relationship

Council timeline disposition:

- `buildCouncilMeetings()` = KEEP
- `buildCouncilMeetingTimeline()` = KEEP
- T1B1 shared projection = separate generic canonical foundation
- relationship = REUSE lower-level canonical collection reading only
- later status = LATER REPOINT if a future T1 phase proves replacement value

Important non-change:

- T1B1 does not rewrite council year-grouping semantics
- T1B1 does not create a second generic council-specific chronology model

## 12. Representative Audit Result

Audit script:

- [audit-t1b1-timeline-projection.js](../scripts/audit-t1b1-timeline-projection.js)

Representative corpus result:

- source collections: `blog`, `politics`, `publications`
- input count: `254`
- projected count: `254`
- excluded count: `0`
- duplicate identities: `0`
- duplicate pageUrls: `0`
- missing dates: `0`
- invalid dates: `0`
- year range: `1998` -> `2026`

Projected source-collection distribution:

- `publications`: `164`
- `blog`: `80`
- `politics`: `10`

Those counts are audit provenance only:

- they describe which existing source collection fed the representative T1B1 corpus
- they do not claim canonical Publications-domain / Blog-domain / Politics-domain membership
- semantic classification remains in canonical `contentType`

Projected contexts present:

- `politics`: `27`
- `expertise`: `9`
- `Valtuuston kyselytunti`: `6`
- `expert`: `1`

Items per year:

- `1998`: `1`
- `2006`: `1`
- `2007`: `2`
- `2008`: `19`
- `2011`: `2`
- `2012`: `11`
- `2013`: `3`
- `2014`: `2`
- `2015`: `1`
- `2016`: `4`
- `2017`: `22`
- `2018`: `29`
- `2019`: `10`
- `2020`: `17`
- `2021`: `40`
- `2022`: `35`
- `2023`: `16`
- `2024`: `20`
- `2025`: `14`
- `2026`: `5`

## 13. Runtime Impact

- runtime JS added: `0`
- runtime JSON added: `0`
- DOM change: `0`
- network change: `0`

T1B1 remains fully internal.

## 14. Public Surface Preservation

Unchanged in this phase:

- `/`
- `/politiikka/vaalikaudet/`
- `/en/election-history/`
- `/politiikka/kaupunginvaltuusto/`
- politics theme pages
- `/koulutuspalaute/`
- `/sivuston-muutokset/`
- `/en/site-changes/`

Also unchanged:

- Pagefind config
- Find & Explore behavior
- public `/data/*` contracts
- public `/api/*` contracts

## 15. Validation

Validation target set for T1B1:

- `npm ci`
- `npm run build:no-og`
- `npm run test:unit`
- `node scripts/audit-t1b1-timeline-projection.js`
- `git diff --check`

Focused unit coverage added:

- canonical identity preservation
- canonical pageUrl preservation
- canonical contentType preservation
- context preservation without inference
- deterministic date normalization
- year derivation
- newest-first ordering
- deterministic tie-break
- year grouping
- missing-date exclusion
- invalid-date exclusion
- duplicate identity rejection
- duplicate pageUrl rejection
- no full-source-object leakage
- no topic -> Research inference

## 16. Deferred T1B2 Deletion Candidates

Deferred only, not deleted here:

- `src/en/election-history.md` duplicate structure
- duplicate/manual parts of `src/fi/vaalihistoria.md`
- canonical-duplicate home milestone summaries/data
- replaceable manual timeline arrays in `src/_data/politicsThemePages.js`
- obsolete browser pagination on timeline/history pages if later superseded

## 17. Explicit Out of Scope

- T1B2 implementation
- T1B3 implementation
- PF5
- timeline Pagefind behavior
- public timeline rendering migration
- Presentations
- Media
- new timeline taxonomy
- public timeline JSON
- browser timeline renderer

## 18. Complexity Budget

Expected T1B1 impact remained within the foundation-only budget:

- helper LOC: `302`
- internal data adapter LOC: `31`
- unit test LOC: `192`
- audit script LOC: `63`
- runtime JS: `0`
- runtime JSON: `0`
- DOM: `0`
- network: `0`
- build-time helper/data/audit/test cost: small and internal only
