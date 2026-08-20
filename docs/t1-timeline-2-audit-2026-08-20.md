# T1A Timeline 2.0 Audit

Date: 2026-08-20

Status: CLOSED / GREEN / AUDIT

Branch: `audit/t1-timeline-2`

## 1. Repo / main HEAD

- Audit base: `origin/main`
- Verified main snapshot: `9e881b7735148458fdbdba86fa1ee0cd9cf474c4`
- Audit worktree: clean detached snapshot first, then docs-only branch
- Validation run: `npm run build:no-og`

Current repo/docs state overrides stale prompt assumptions where they disagree. In particular, the repository already contains post-merge media closure docs on `main`; this audit does not start any media work or reinterpret that status.

## 2. Current timeline routes

Current user-facing timeline/history/chronology surfaces on `main`:

- `/` -> home milestones timeline
- `/politiikka/vaalikaudet/` -> Finnish election-history / term timeline
- `/vaalihistoria/` -> legacy redirect to `/politiikka/vaalikaudet/`
- `/en/election-history/` -> English election-history page
- `/politiikka/kaupunginvaltuusto/` -> council-meeting timeline
- `/politiikka/kampus-raksila-linnanmaa/`
- `/politiikka/palveluverkko/`
- `/politiikka/avoin-valmistelu/`
- `/politiikka/sivistys-ja-koulutus/`
- `/koulutuspalaute/` -> training-feedback timeline
- `/sivuston-muutokset/`
- `/en/site-changes/`

Excluded from Timeline 2.0 scope:

- `/donation-history/` is only a noindex redirect, not a current timeline surface
- generic `/haku/`, `/en/search/`, Find & Explore hubs, and Pagefind indexes are discovery surfaces, not current timeline implementations

## 3. Current data-flow diagram

Current repo state is not one timeline system. It is a set of separate flows:

```text
HOME MILESTONES
src/_data/milestones.js
  -> src/index.njk
  -> /
  -> SSR horizontal milestone timeline
  -> CSS-only scrolling hint

FI ELECTION HISTORY
manual termPeriods array in src/fi/vaalihistoria.md
+ collections.pub_puhe
+ collections.politics
+ collections.pub_mielipide
+ collections.pub_kolumni
+ collections.blog
+ collections.publications
+ councilMeetings
  -> src/fi/vaalihistoria.md
  -> /politiikka/vaalikaudet/
  -> SSR term cards + inline browser pagination per list

EN ELECTION HISTORY
manual content in src/en/election-history.md
  -> /en/election-history/
  -> SSR cards only

POLITICS THEME TIMELINES
src/_data/politicsThemePages.js
  -> src/politics/theme-page.njk
  -> 4 SSR theme routes

COUNCIL TIMELINE
content collections (blog + publications + politics + media + presentations)
+ src/_data/councilMeetingMeta.js
+ src/_data/councilMeetingYoutubeVideos.json
  -> buildCouncilMeetings()
  -> buildCouncilMeetingTimeline()
  -> src/fi/valtuusto.njk
  -> /politiikka/kaupunginvaltuusto/
  -> SSR grouped year blocks

TRAINING FEEDBACK
src/_data/trainingFeedback.json
  -> src/fi/koulutuspalaute.md
  -> /koulutuspalaute/
  -> SSR ordered timeline list

SITE CHANGES
GitHub commits API or cache
  -> src/_data/githubchanges.js
  -> src/fi/sivuston-muutokset.njk
  -> src/en/site-changes.njk
  -> large SSR commit table
  -> inline browser pagination
```

Important architectural observation:

- current timeline/history surfaces mix canonical projections, manual editorial curation, and one external-history projection
- no current timeline page is generated from Pagefind
- no current timeline page fetches a dedicated timeline JSON feed in the browser

## 4. Source inventory

| Surface | Route(s) | Template / page | Data source(s) | Helper(s) | Browser JS | Runtime/public JSON | Pagefind involvement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home milestones | `/` | `src/index.njk` | `src/_data/milestones.js` | none | none timeline-specific | none | global site search assets only |
| FI election history | `/politiikka/vaalikaudet/` | `src/fi/vaalihistoria.md` | manual `termPeriods` + content collections + `councilMeetings` | collection filters, `toTimestamp`, `dateFormat` | inline per-list pagination | none | global search UI present, not timeline-owned |
| EN election history | `/en/election-history/` | `src/en/election-history.md` | manual page content | none | none timeline-specific | none | global search UI present, not timeline-owned |
| Politics theme pages | 4 `/politiikka/.../` routes | `src/politics/theme-page.njk` | `src/_data/politicsThemePages.js` | topic item count helper in template | none | none | global search UI present, not timeline-owned |
| Council timeline | `/politiikka/kaupunginvaltuusto/` | `src/fi/valtuusto.njk` | `src/_data/councilMeetings.js`, `src/_data/councilMeetingTimeline.js`, `src/_data/councilMeetingMeta.js`, `src/_data/councilMeetingYoutubeVideos.json` | `buildCouncilMeetings`, `buildCouncilMeetingTimeline` in `eleventy.filters.js` | none timeline-specific | public `/data/council-speeches.json` exists for other pages, not this page | global search UI present, not timeline-owned |
| Training feedback | `/koulutuspalaute/` | `src/fi/koulutuspalaute.md` | `src/_data/trainingFeedback.json` | none | none timeline-specific | none | global search UI present, not timeline-owned |
| Site changes | `/sivuston-muutokset/`, `/en/site-changes/` | `src/fi/sivuston-muutokset.njk`, `src/en/site-changes.njk` | `src/_data/githubchanges.js` -> GitHub API/cache | cache helpers | inline table pagination | none browser-fetched; build-time external API/cache only | global search UI present, not timeline-owned |

## 5. Canonical coverage classification

Classification legend:

- A = canonical projection
- B = derivable from canonical
- C = manual but legitimate unique content
- D = duplicate / legacy
- E = orphan / unknown authority

| Item family | Count | Current authority | Class | Notes |
| --- | --- | --- | --- | --- |
| FI election derived speeches | 83 | canonical content items | A | direct collection projection by date range + event whitelist |
| FI election derived initiatives | 10 | canonical content items | A | direct collection projection by date range |
| FI election derived opinion pieces / columns | 49 | canonical content items | A | direct collection projection by date range |
| FI election derived other political items | 34 | canonical content items | A | build-time selection from canonical blog/publication items with `politicalProfiles` |
| FI election term-level council counts | 53 linked meetings across terms | `councilMeetings` projection | B | derivable from canonical council-meeting projection rather than authored per term |
| FI election manual term shells | 4 term cards | page-local array | C/D mixed | term boundaries, result grouping and archive grouping are legitimate; summaries/titles are a parallel editorial layer |
| FI election manual results / roles / archive links | 6 / 12 / 5 | page-local array | C | legitimate contextual aggregation not represented as single canonical objects elsewhere |
| EN election manual cards and role bullets | 10 entries | page-local content | D | separate manual copy instead of shared projection; FI/EN parity gap is structural |
| Home milestone cards | 26 cards | `src/_data/milestones.js` | B/D mixed | all links are local canonical URLs, but year/title/description live in a parallel curated array |
| Home milestone phase markers | 4 | `src/_data/milestones.js` | C | legitimate high-level era framing not present as canonical content objects |
| Politics theme timeline entries | 19 entries | `src/_data/politicsThemePages.js` | C | editorial synthesis is unique and useful |
| Politics theme support links | 45 links | mostly canonical local URLs | B | 43 local canonical detail/landing links, 1 external, 1 disclosure landing |
| Council active meeting cards | 53 meetings | build-time meeting projection | A | strongest current Timeline 2.0-shaped implementation |
| Council quiet markers / annual-cycle markers | 48 meetings | manual meeting meta + video evidence | C | legitimate unique structure showing absence / annual cycle, not duplicate content pages |
| Training-feedback timeline entries | 4 entries | `trainingFeedback.json` | C | legitimate page-native dataset, not duplicated from another canonical object family |
| Site-changes commit rows | 1,112 rows | GitHub commits API/cache | C | authoritative external history, but not a canonical-content timeline and should remain separate from T1 |

## 6. Item counts by domain

Counts below describe current displayed timeline/history items, not deduplicated canonical entities across the whole site.

### Home milestones

- total milestone cards: 26
- phase markers: 4
- categories:
  - tausta: 1
  - tutkimus: 11
  - opetus: 6
  - politiikka: 7
  - palkinto: 1

### FI election history

- term cards: 4
- results: 6
- trust-role bullets: 12
- archive/campaign links: 5
- derived content totals:
  - speeches: 83
  - initiatives: 10
  - opinion pieces / columns: 49
  - other political items: 34
- derived per-term council-meeting references: 53 meetings across the four terms

Per term:

| Term | Speeches | Initiatives | Opinions / columns | Other political items |
| --- | --- | --- | --- | --- |
| 2025–2029 | 4 | 1 | 2 | 2 |
| 2021–2025 | 38 | 6 | 11 | 25 |
| 2017–2021 | 40 | 3 | 26 | 7 |
| 2013–2017 | 1 | 0 | 10 | 0 |

### EN election history

- current-role cards: 2
- election/term cards: 5
- other civic-role bullets: 3

### Politics theme timelines

- theme routes: 4
- manual timeline entries: 19
- supporting links inside entries: 45
  - local canonical / local landing links: 43
  - external links: 1
  - other local disclosure/context landing: 1

### Council timeline

- active meeting cards with own content: 53
- quiet / annual-cycle markers: 48
- total timeline meetings: 101
- year groups rendered in template: 10

### Training feedback timeline

- timeline entries: 4
- broader page session count (`meta.tilaisuuksia`): 7

### Site changes

- FI commit rows: 1,112
- EN commit rows: 1,112

### Content-family coverage gaps in current timeline architecture

No shared current timeline surface treats these as first-class timeline entities across the site:

- theses
- publications as a standalone timeline family
- presentations
- research-context landings
- media suitability / media-specific chronology
- trips / travel
- projects as their own shared chronological projection

## 7. Year / sort / grouping logic

| Surface | Current logic | Where it happens | Notes |
| --- | --- | --- | --- |
| Home milestones | ascending manual chronology by array order; alternating above/below cards | `src/_data/milestones.js` + `src/index.njk` | no derived sorting |
| FI election history | manual term order newest -> oldest; within term, canonical items filtered by date range; lists initially in reverse chronological collection order | `src/fi/vaalihistoria.md` | 15 browser-paginated groups at page size 3 |
| EN election history | fully manual display order | `src/en/election-history.md` | not strictly reverse chronological because 2021 municipal elections appear before 2022 wellbeing-area elections |
| Politics theme pages | manual item order per theme | `src/_data/politicsThemePages.js` | no helper-based chronology |
| Council timeline | build-time date normalization and reverse chronological grouping by year | `buildCouncilMeetingTimeline()` + `src/fi/valtuusto.njk` | strongest deterministic chronology |
| Training feedback | manual ascending year order | `src/_data/trainingFeedback.json` | ordered list only |
| Site changes | newest-first from GitHub commit feed; browser paginates 10 rows per page | `src/_data/githubchanges.js` + inline JS | huge SSR table retained for no-JS crawlability |

Deterministic browser logic that could move or shrink later:

- FI election per-list pagination in `src/fi/vaalihistoria.md`
- FI/EN site-changes pagination inline scripts

Deterministic browser logic that is already build-time:

- council timeline year grouping
- home milestone ordering
- training-feedback ordering
- politics theme ordering

## 8. Theme / context semantics

Current site semantics that Timeline 2.0 can legitimately reuse:

- canonical `contexts`
- canonical dates / years on content items
- existing topic pages and `linkedTopic` references where a route already exists
- politics-specific `politicalProfiles`
- council-meeting membership from existing council helpers

Semantics that are domain-specific and should not be promoted into a new global timeline taxonomy:

- `politicalProfiles`
- page-local milestone categories (`tausta`, `tutkimus`, `opetus`, `politiikka`, `palkinto`)
- page-local training-feedback themes
- hand-authored politics theme-page labels

Research rule verification:

- Research membership must come from canonical `contexts`
- current timeline/history surfaces do not define or infer Research membership
- no evidence supports deriving Research membership from topic mapping
- Timeline 2.0 must not introduce a new Research rule

## 9. Pagefind suitability

### Evidence from current main

- every audited route includes the global Pagefind UI assets from the base layout
- none of the current timeline/history pages use Pagefind to generate their untouched timeline DOM
- none of the current timeline/history pages fetch a dedicated timeline JSON feed at runtime
- current deterministic timeline structures are SSR, even when some pages still add small browser-side pagination

### Model assessment

#### A. SSR only

Evidence:

- already how home milestones, politics themes, council timeline, training feedback, and EN election history work
- simplest mental model
- strongest no-JS and crawlability story

Weakness:

- no active search/filter within a timeline surface

#### B. SSR + Pagefind enhancement

Evidence:

- best fit for a future timeline that projects canonical content by year/theme/type
- aligns with existing Find & Explore architecture
- preserves canonical SSR landing while enabling active discovery only when the user asks for it

Verdict:

- recommended

#### C. Pagefind-driven timeline

Evidence against:

- no current timeline page uses Pagefind this way
- would move chronology, grouping, and identity into runtime search responses
- would create a second model for item membership and ordering

Verdict:

- not appropriate on current evidence

## 10. Knowledge graph overlap

Current repo already has other relationship layers:

- canonical contexts
- canonical topic pages
- council-meeting aggregation
- knowledge-graph JSON for a separate graph surface

Audit finding:

- no current timeline/history surface consumes `/data/knowledge-graph.json`
- a timeline-specific relationship model would duplicate existing semantic ownership
- Timeline 2.0 should reuse canonical dates, contexts, topic links, and existing domain helpers instead of creating a second graph

## 11. FI / EN parity

Current parity is uneven:

- home milestones timeline exists on `/` but not on `/en/`
- FI election history is a mixed manual + canonical projection
- EN election history is separate manual content, not a projection from the FI term model
- council timeline is FI-only
- training-feedback timeline is FI-only
- site-changes history has FI + EN parity
- politics theme timelines are FI-only

Important nuance:

- parity does not require every individual linked item to have a translated detail page
- parity does require the timeline architecture itself to avoid maintaining two disconnected copies when the underlying structure is the same

Highest-priority parity gap:

- `src/en/election-history.md` is not fed by the same term/chronology structure as `src/fi/vaalihistoria.md`

## 12. Public JSON / API consumers

No current timeline page fetches a timeline-specific browser JSON feed.

Relevant datasets and contracts:

| Dataset / source | Current consumers | Classification |
| --- | --- | --- |
| `src/_data/milestones.js` | home page only | KEEP FOR NOW |
| `src/_data/trainingFeedback.json` | `/koulutuspalaute/`, home stats, testimonials | KEEP |
| `src/_data/politicsThemePages.js` | politics landing + 4 theme pages | KEEP / REPOINT LATER |
| `src/_data/councilMeetings.js` | council timeline, council meeting detail pages, FI politics landing references | KEEP |
| `src/_data/councilMeetingTimeline.js` | council timeline | KEEP |
| `src/_data/councilMeetingMeta.js` | council timeline helper layer | KEEP / TARGETED REPOINT LATER |
| `src/_data/githubchanges.js` | FI/EN site-changes pages | KEEP SEPARATE |
| `/data/council-speeches.json` | `src/valtuustotyo.njk`, tests, public JSON feed | KEEP |
| `/data/content.json` | taxonomy pages, writings/runtime tooling, tests, embeddings/debug scripts | KEEP |
| `/data/knowledge-graph.json` | knowledge-graph page only | KEEP |

External/build-time API dependency relevant to history but not to Timeline 2.0:

- GitHub commits API in `src/_data/githubchanges.js`

## 13. JS / DOM duplication audit

### Browser responsibilities now

- FI election history: list pagination only
- site changes: table pagination only
- everything else: no timeline-specific rendering JS

### Classification

| Responsibility | Current location | Class |
| --- | --- | --- |
| FI election per-list pagination | inline script in `src/fi/vaalihistoria.md` | BUILD-TIME CANDIDATE |
| site-changes pagination | inline scripts in FI/EN templates | LEGITIMATE INTERACTION, but also DELETE-CANDIDATE if route is later simplified |
| home timeline rendering | SSR only | correct today |
| council timeline rendering | SSR only | correct today |
| training-feedback rendering | SSR only | correct today |
| politics theme rendering | SSR only | correct today |

Duplication findings:

- no runtime JSON -> timeline DOM renderer exists today
- no hidden full-timeline DOM filtered in the browser was found on timeline routes
- no separate mobile/desktop duplicate timeline markup was found beyond responsive CSS and `<details>` disclosures
- FI election and site-changes still use inline browser logic for deterministic pagination that could be reduced in a future cleanup

## 14. Performance baseline

Build baseline from `npm run build:no-og` on `main`:

- build result: PASS
- output: 1,471 files written, Pagefind indexed 1,458 HTML documents
- no focused timeline browser tests exist on `main`

Approximate per-route HTML / DOM baseline from built output:

| Route | HTML bytes | Approx. tag count | Inline script bytes | Notable DOM payload |
| --- | --- | --- | --- | --- |
| `/` | 146,577 | 1,305 | 5,530 | 26 milestone cards + 4 phase markers |
| `/politiikka/vaalikaudet/` | 258,585 | 2,038 | 8,885 | 4 term cards + 15 paginated content groups |
| `/en/election-history/` | 95,053 | 928 | 6,062 | 5 term/election cards + 2 current-role cards |
| `/politiikka/kaupunginvaltuusto/` | 222,744 | 2,174 | 6,491 | 53 active meeting cards + 48 quiet markers |
| `/koulutuspalaute/` | 119,014 | 1,065 | 6,197 | 4 timeline entries, broader feedback content |
| `/sivuston-muutokset/` | 859,114 | 8,694 | 8,274 | 1,112 commit rows SSR |
| `/en/site-changes/` | 842,540 | 8,633 | 7,240 | 1,112 commit rows SSR |

Network/runtime observations:

- timeline pages do not make extra runtime JSON requests for their own content
- global Pagefind assets load on these pages, but not as timeline data sources
- site changes depend on build-time GitHub API/cache rather than browser fetches

## 15. Accessibility findings

Positive findings:

- all audited routes retain SSR reading order
- council timeline uses real headings, cards, and `<details>` year groups
- training feedback uses an ordered list for its timeline
- site changes remains readable without JavaScript because the full table is SSR
- FI election disclosures use `<details>` / `<summary>` rather than custom script widgets

Issues / risks:

- home milestones rely on horizontal scrolling and a text hint, but offer no stronger keyboard-oriented timeline navigation model
- FI election page is very dense; inline per-list pagination adds repeated controls inside a long page
- site-changes pages expose extremely large SSR tables; accessible but heavy
- no dedicated timeline accessibility tests exist today; only incidental coverage exists for `/en/site-changes/` through general contrast tests

## 16. SEO findings

Verified on built output:

- canonical URLs present
- hreflang present where routes have translations
- JSON-LD present on audited routes
- timeline/history pages are crawlable without JavaScript
- site-changes rows are SSR and link directly to authoritative GitHub commits

Findings:

- FI election history and EN election history have proper reciprocal hreflang links, but not shared source parity
- council timeline and training feedback are intentionally FI-only and therefore correctly lack EN alternate links
- no evidence of timeline pages duplicating full detail-page text wholesale; they link out to canonical details or approved campaign/archive landings

## 17. Deletion candidates

Deletion is viable later, but not in T1A.

| Candidate | Current consumer(s) | Replacement path | Proof required before deletion |
| --- | --- | --- | --- |
| `src/en/election-history.md` manual duplicate structure | EN election-history route | shared projection from the same authoritative term structure as FI, plus EN copy where uniquely needed | FI/EN parity audit + URL/content parity proof |
| `src/_data/milestones.js` parallel milestone array | home page | shared chronological projection plus a much smaller companion file for true phase markers/manual exceptions | proof that milestone cards can be rebuilt from canonical items without losing the home editorial story |
| manual duplicate parts of `termPeriods` in `src/fi/vaalihistoria.md` | FI election-history route | split into true unique election metadata vs derived projection helper | proof that summaries/results/roles/archives still render correctly |
| inline pagination script in `src/fi/vaalihistoria.md` | FI election-history route | SSR-first or lighter interaction model | no-JS parity and long-page usability proof |
| `timeline` arrays inside `src/_data/politicsThemePages.js` | politics theme pages | helper-fed projection over canonical items plus retained editorial notes where needed | proof that editorial synthesis survives without manual duplicate link lists |
| site-changes inline pagination JS | site-changes pages | optional lighter history UI, separate from T1 | prove route remains usable at current 1,112-row scale |

Not deletion candidates for T1:

- `/data/council-speeches.json`
- `/data/content.json`
- `/data/knowledge-graph.json`
- council meeting detail pages or their build helpers

## 18. Target options

### Option A — Surface-by-surface SSR hardening

- keep per-domain timelines separate
- remove the most obvious duplicates one surface at a time
- no shared timeline helper yet
- Pagefind role: none or tiny per-surface enhancement

Benefits:

- smallest code risk
- easiest to phase

Risks:

- duplication remains longer
- FI/EN parity issues remain likely
- less architectural convergence

### Option B — Shared build-time chronological projection with optional Pagefind enhancement

- authoritative source: existing canonical content + existing legitimate manual companion data where unique facts truly exist
- Eleventy renders: year-grouped chronological projection, then domain-appropriate theme/type sections
- Pagefind role: active search/filter only when the user leaves default untouched timeline state
- JS role: small interaction only

Benefits:

- matches current strongest evidence from council timeline + Find & Explore architecture
- preserves SSR/no-JS truth
- minimizes parallel data stores

Risks:

- requires careful separation of unique manual election/role metadata from duplicated narrative arrays
- requires explicit FI/EN parity decisions

### Option C — Pagefind-driven runtime timeline

- Pagefind would define item identity, chronology, and grouping at runtime

Benefits:

- lower initial SSR implementation pressure

Risks:

- wrong authority layer
- second semantic model
- worse no-JS and crawlability story
- not supported by current repo evidence

## 19. Recommended architecture

Recommended target: **Option B — shared build-time chronological projection with optional Pagefind enhancement.**

Timeline 2.0 should mean:

- a chronological projection of existing canonical content
- grouped deterministically by year first
- then optionally by existing domain-appropriate theme/context/type labels
- linking only to canonical detail pages or already-approved landing/archive pages

Authoritative source:

- canonical content dates and metadata
- existing domain helpers such as council-meeting projection
- small manual companion datasets only for facts that are genuinely unique and not canonical content objects, such as election results, positions of trust, phase markers, and annual-cycle markers

Eleventy renders:

- untouched timeline structure
- year groups
- default ordering
- default content grouping
- links

Pagefind does, if justified later:

- active search/filter across timeline-eligible canonical items
- never untouched timeline generation
- never item identity or chronology

JavaScript does:

- genuine interaction only
- optional active-discovery state handling
- no canonical timeline ownership

What gets deleted later:

- manual duplicate EN election-history structure
- large parallel milestone/timeline arrays where canonical projections can replace them
- deterministic inline pagination where SSR or smaller interaction can replace it

What stays:

- legitimate manual companion facts
- council helper architecture as a pattern
- training-feedback page-native data
- site-changes as a separate history surface, outside T1 content-timeline convergence

Explicitly out of scope:

- Canonical Content v1 schema changes
- new timeline taxonomy
- Research semantic changes
- Pagefind as the timeline source of truth
- PF5
- presentations cleanup
- media suitability implementation

## 20. Phased migration plan

### T1B1 — shared eligibility + projection audit boundary

- define timeline-eligible canonical item families per target surface
- extract one reusable build-time projection helper for year-first chronology
- preserve manual companion facts outside the helper
- STOP boundary: no Pagefind interaction yet

Parity gates:

- SSR route parity
- no-JS crawlability
- no new public JSON contract

### T1B2 — replace duplicate manual structures on the highest-value surfaces

- converge FI + EN election-history structure onto shared chronology inputs
- reduce or replace `milestones.js` with projection + smaller manual companion facts
- keep politics theme pages editorial, but reduce duplicate link arrays where safely derivable
- STOP boundary: no global timeline search yet

Parity gates:

- URL preservation
- hreflang parity
- counts and link-target parity

### T1B3 — optional Pagefind enhancement for active discovery only

- add search/filter only if user value is proven
- maintain SSR untouched timeline state as canonical
- ensure reset returns to SSR state, not empty-query reconstruction

Parity gates:

- no Pagefind-owned chronology
- no hidden full DOM filtering
- no browser-owned identity model

## 21. Explicit out-of-scope list

- do not change Canonical Content v1
- do not create a new timeline taxonomy
- do not infer Research from topic mapping
- do not make Pagefind the canonical timeline store
- do not build a SPA timeline
- do not add a dedicated runtime timeline JSON model
- do not fold GitHub site-changes history into content Timeline 2.0
- do not start PF5
- do not start presentations cleanup
- do not start media suitability implementation

## Validation notes

- `npm run build:no-og` -> PASS
- focused timeline-specific tests on `main`: none found
- incidental existing coverage found only through general tests, for example `/en/site-changes/` in `tests/contrast.spec.js`
