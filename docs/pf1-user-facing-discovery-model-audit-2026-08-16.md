# PF1 User-Facing Discovery Model Audit

Requested filename date: `2026-08-16`  
Actual audit execution date: `2026-08-15`  
Mode: audit only -> report -> stop

## 1. Scope

This audit reviews the current Pagefind / Find & Explore discovery model on the post-F4 and post-M2 `main` snapshot, without changing UI, Pagefind metadata, Research semantics, or media Research membership.

In scope:

- Research contextual discovery
- Publications
- Theses
- Writings
- Presentations
- Media
- Global search
- Shared discovery infrastructure

Out of scope:

- PF2 implementation
- PF-PERF1
- any taxonomy redesign
- media normalization
- any Research rule change

## 2. Repository State

Authoritative snapshot used for the audit:

- repo root: `temporary clean worktree snapshot`
- branch for this report commit: `codex/pf1-user-facing-discovery-model-audit`
- audited `main` snapshot HEAD: `d87bf58669018befac040623e1a2c9f1c54c7d16`
- `origin/main` HEAD at audit time: `d87bf58669018befac040623e1a2c9f1c54c7d16`
- recent merged milestones visible in `git log`:
  - `d4cde07e` Merge pull request `#90` (M2 media)
  - `ef4d948f` Merge pull request `#89` (F4 Research rollout)

Expected closure docs are present:

- `docs/f4-research-find-explore-closure-2026-08-15.md`
- `docs/m2-media-find-explore-closure-2026-08-16.md`
- `docs/f4-r1-research-eligibility-2026-08-15.md`
- `docs/f4-r2-presentation-context-projection-2026-08-15.md`
- `docs/f4-r3-presentations-research-rollout-2026-08-15.md`
- `docs/m2-media-pagefind-find-explore-2026-08-15.md`

Verified rollout state:

- F4 closed and green
- M2 closed and green
- Research population remains `317`
- media participates in Pagefind / Find & Explore
- media does not participate in Research

## 3. Current Discovery Inventory

### Shared Infrastructure

| Layer | Current role | Key evidence |
| --- | --- | --- |
| `src/_includes/base.njk` | injects page-level Pagefind filters and meta | all pages get `Kieli:*`; detail pages add family-specific hidden spans |
| `src/_utils/contentPresets.js` | named shared presets | only `"FindExplore:presentations"` and `"FindExplore:media"` are registered as named presets |
| `src/js/content-engine.js` | browser fetch + preset facade | page-local archive UIs query JSON endpoints through presets or raw specs |
| `src/js/pe-list-render.js` | generic PE list rendering | used by presentations and media archive layers |
| `src/js/find-explore.js` | Pagefind-backed archive runtime | powers writings, theses, publications, and `/tutkimus/` |
| `scripts/run-pagefind.js` | built Pagefind index generation | indexes `1442` HTML documents; presentation scope adds `139` reused local HTML records + `79` custom records |

### Content Families

| Family | Source / collection | User-facing routes | Preset | Main technical filters | Page-specific search | Research | Global search |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Publications | `publications-page.json`, Research.fi + manual records | `/julkaisut/`, `/en/publications/` | no named preset; Pagefind via detail-page metadata | `FindExplore:publications`, `Publications scope/group/type/year/topic/quality`, `Research context` | yes, Pagefind | yes, `53` | yes |
| Theses | `theses.json` | `/opinnaytteet/`, `/en/theses/` | no named preset; Pagefind via detail-page metadata | `FindExplore:theses`, `Theses scope/type/year/topic/author/language`, `Research context` | yes, Pagefind | yes, `169` | yes |
| Writings | `writings-page.json` | `/kirjoitukset/`, `/en/writings/` | no named preset; Pagefind via detail-page metadata | `FindExplore:writings`, `Writings scope/content type/year/topic/role`, optional `Research context` | yes, Pagefind | yes, `62` | yes |
| Presentations | `presentations-page.json` | `/esitykset/`, `/en/presentations/` | `FindExplore:presentations` | `FindExplore:presentations`, `PresentationYear`, `PresentationTopic`, `PresentationContext`, `PresentationType`, `PresentationLanguage`, `PresentationSourceType`, optional `ResearchContext` | yes, local JSON archive UI | yes, `33` | yes |
| Media | `media.json` | `/mediassa/`, `/en/media/` | `FindExplore:media` | `Sisältö:Mediassa`, `Mediatyyppi:*`, `Rooli:*`, `Vuosi:*`, `mediaType/mediaRole/mediaOutlet/date` meta | FI yes, local JSON archive UI; EN no | no | yes |
| Research contextual view | mixed Pagefind scope across publications/theses/writings/presentations | `/tutkimus/` | no named preset; runtime kind `researchContext` | `Research context:research` + family filters + topic preset bridge for presentations | yes, Pagefind | n/a, it is the cross-content view | n/a |

### Result Card Behavior

| Family | Visible metadata today |
| --- | --- |
| Publications | authors, type/group, year, venue, badges for peer review/open access/JUFO/citations, excerpt, source button, citation export |
| Theses | author line, thesis type, year, excerpt |
| Writings | year by default, type only when a type filter is already selected, excerpt |
| Presentations in `/esitykset/` | source, local/external badge, date/year, presentation type, event, top topics |
| Presentations inside Research | year only, no local/external badge, no source-type cue |
| Media | local page exposes `Mediatyyppi`, `Rooli`, outlet, date; archive cards expose source/detail CTAs |

## 4. Current Pagefind Facets

Current user-visible facet situation is not coherent site-wide.

What exists today:

- all indexed pages expose `Kieli:Suomi` or `Kieli:English`
- media detail pages expose a real user-facing content facet: `Sisältö:Mediassa`
- publications, theses, writings, and presentations mostly expose technical family filters instead of a shared user-facing content facet
- Research uses `Research context:research` internally, which is semantically correct but not user-facing copy

Current audit conclusion:

- user-facing `Sisältö:` facet exists today only for media
- other families rely on technical `FindExplore:*` or family-specific technical filter names
- global search can technically filter results, but not with one coherent content-type vocabulary
- current global content-type support is therefore partial and implementation-shaped rather than user-shaped

## 5. Proposed Site-Wide `Sisältö:` Vocabulary

Recommended Finnish vocabulary:

| Label | Underlying family | Global search | Page-specific search | UI role | Readiness |
| --- | --- | --- | --- | --- | --- |
| `Julkaisut` | publications | yes | yes | filter + result cue | ready |
| `Opinnäytteet` | theses | yes | yes | filter + result cue | ready |
| `Esitykset` | presentations | yes | yes | filter + result cue | ready |
| `Kirjoitukset ja puheenvuorot` | writings | yes | yes | filter + heading | ready, but see writings overload |
| `Mediassa` | media | yes | page-local optional | filter + heading | already live |
| `Tutkimus` | Research contextual view only | no as a duplicate content type | yes on `/tutkimus/` as a view label | heading / route label, not content facet | ready as contextual label only |

Recommended English equivalents:

- `Publications`
- `Theses`
- `Presentations`
- `Writings and Talks`
- `In the Media`
- `Research` only as a contextual route label

Recommendation:

- use `Sisältö:` only for content families
- do not treat `Tutkimus` as another item type
- keep `Research` as a contextual discovery view over eligible items

## 6. Writings Model

Current canonical writings population: `290`

Breakdown by `contentType`:

- `speech`: `92`
- `blogPost`: `70`
- `scientificPublication`: `56`
- `opinion`: `47`
- `initiative`: `10`
- `column`: `9`
- `statement`: `6`

Other current facts:

- language: `290/290 fi`
- Research-eligible: `62`
- top contexts: `politics 189`, `education 155`, `teaching 84`, `research 62`
- role coverage is uneven: `175` items have no explicit role; `113 political`; `76 expert`
- top visible topics are dominated by politics and civic topics, not by Research

Assessment:

- `writings` is technically valid, but too broad as a user mental model
- the clearer visible label is `Kirjoitukset ja puheenvuorot`
- individual genres should become filters, not top-level parallel archives inside PF2

Recommended user-facing filters:

- genre
- year
- topic
- role only where meaningful

Genres large and clear enough to expose:

- `Puheet`
- `Blogikirjoitukset`
- `Mielipiteet`
- `Julkaisut` only if kept clearly separate from the main publications archive

Genres better kept as metadata only for now:

- `Kolumnit`
- `Lausunnot`
- `Valtuustoaloitteet`

Main writings recommendation:

- keep the technical family, but rename the visible family label toward `Kirjoitukset ja puheenvuorot`
- do not let the overloaded `writings` bucket define the global vocabulary

## 7. Theses Model

Current theses population: `169`

Reliable current metadata:

- `thesisType`: `169/169`
- `thesisRole`: `169/169`
- `year`: `169/169`
- `lang`: `169/169`
- `contexts`: `169/169`
- categories/topics: `153/169`
- `researchLine`: `110/169`
- `researchAudience`: `110/169`
- `researchThemes`: `77/169`

Current distribution:

- type: `140 masterThesis`, `29 bachelorThesis`
- role: `116 advised`, `53 reviewed`
- language: `139 fi`, `30 en`
- every thesis carries `research`

Assessment:

- `Opinnäytteet` is a strong, clean user-facing category
- the most useful current user filters are type, year, and topic
- `researchLine` is already useful as a secondary thematic filter
- `researchThemes` and `researchAudience` are useful where populated, but not yet reliable enough to be the first thing users see

Main theses recommendation:

- keep theses primarily discoverable by type and year
- add theme-level vocabulary only after the broader facet harmonization

## 8. Publications Model

Current publications population: `56`

Reliable current metadata:

- year: `56/56`
- language: `56/56`
- source/origin: `56/56`
- contexts: `56/56`
- `researchLine`: `53/56`
- `researchThemes`: `52/56`
- `researchAudience`: `52/56`
- publication group/type code: `50/56`

Current distribution highlights:

- source: `53 researchfi`, `3 manual`
- groups: mostly `A`, `B`, `D`, `E`
- all but three items sit cleanly inside the Research model

Assessment:

- publications already have the strongest structured metadata after theses
- user-facing filters should be group, year, topic, and quality
- the current `Aihe` abstraction is useful here and should align with Research where possible
- internal distinctions such as raw `typeCode`, `recordOrigin`, or `sourceKey` should stay internal unless they solve a user problem

Main publications recommendation:

- keep `Aihe` as the user abstraction
- keep Research.fi vs manual as metadata, not a front-row filter

## 9. Presentations Model

Current canonical presentations population: `218`

Current structure:

- local landing: `138`
- external-first landing: `80`
- Research-eligible: `33`
- safe Research topic mapping: `168`
- safe-topic-mapped but not Research: `136`

Reliable current metadata:

- `presentationType`: `218/218`
- year: `216/218`
- topics: `198/218`
- contexts: `140/218`
- explicit language metadata: `75/218`

Assessment:

- `/esitykset/` is already a good archive-level discovery page
- the right visible filters there are text, year, and topic
- presentation `role` should not be exposed in Research; it is too sparse and too presentation-specific
- `source type` is useful archive metadata, but not the first PF2 global facet

Research boundary that must remain explicit:

- `Research membership` = authoritative `contexts.includes("research")`
- `Research topic mapping` = safe preset bridge for topic discovery only
- a presentation may have safe Research topic mapping without Research membership

Main presentations recommendation:

- keep archive filters on `/esitykset/` as year + topic + text
- keep Research inclusion strictly membership-based
- let generic Research queries still surface the `1` authoritative but unmapped Research presentation

## 10. Media Model

Current media population: `73`

Reliable current metadata:

- `mediaType`: `73/73`
- `mediaRole`: `73/73`
- `mediaOutlet`: `73/73`
- year: `73/73`
- language: `73/73`
- contexts, categories, keywords: `73/73`

Current distribution:

- type: `55 article`, `9 video`, `4 podcast`, `2 assignment`, `2 pressRelease`, `1 radio`
- role: `65 about`, `3 expertAssignment`, `3 interviewer`, `2 guest`
- language: `72 fi`, `1 en`
- Research contexts exist on `2` items, but remain explicitly excluded from Research

Assessment:

- media is now the only family with a live user-facing `Sisältö:` facet
- `mediaType` and `mediaRole` are strong enough for user-facing use
- `mediaOutlet` is populated, but too unstable and too heterogeneous to expose globally yet

Main media recommendation:

- keep outlet/source deferred
- keep media type and role user-facing
- use starter chips only as wrappers around existing local filters, not as new outlet taxonomy

## 11. Research Contextual Model

Current verified Research population:

- publications: `53`
- theses: `169`
- writings: `62`
- presentations: `33`
- total: `317`

Current model quality:

- Research is already best when presented topic-first with content-type refinement
- the current `/tutkimus/` selector set is directionally correct: query, content type, year, topic
- presentations should remain a visible content type inside Research
- generic Research results must continue to include eligible items without topic mapping

Main Research recommendation:

- keep `Aihe` as the primary selector
- keep content type as the secondary selector
- never turn `Research` itself into a duplicate item type facet

## 12. Page-Specific Search Model

| Page | Current state | Recommended class | Recommendation |
| --- | --- | --- | --- |
| `/tutkimus/` | strong contextual Pagefind search | `B` | keep structure; harmonize labels and visible result cues |
| `/esitykset/` | strong local archive search | `A` | already close; add chips later only if they wrap existing topic/year behavior |
| `/en/presentations/` | same archive UI, mixed-language content | `B` | harmonize labeling before adding more controls |
| publications page | strong local Pagefind search | `A` | already close to target |
| theses page | strong local Pagefind search | `A` | already close to target |
| writings page | broad mixed-content archive | `C` | needs label and structural simplification before more facets |
| `/mediassa/` | strong local filter UI | `A` | already close; can gain starter chips without new model |
| `/en/media/` | static SSR archive only | `D` | keep simple for now |

## 13. Starter Chips / Starter UI

Starter chips are recommended, but only on a few pages and only as explicit user actions.

Best pages:

- `/tutkimus/`
- `/esitykset/`
- `/mediassa/`

What they should do:

- set an existing filter or topic preset
- optionally prefill page-local text input when the page already understands that term
- never trigger automatic search on page load
- never invent a second query model separate from the existing page

Suggested chip roles:

- Research: theme chips such as `Tekoäly`, `Opettajankoulutus`, `Koulutusteknologia`
- Presentations: topic chips such as `AI literacy`, `Koulutusteknologia`, `Opettajankoulutus`
- Media: existing local filter wrappers such as `Lehtijutut`, `Videot`, `Avoin tiede`, `Tekoäly ja koulutus`

## 14. Result Card Consistency

Current result cards are informative but inconsistent.

Main inconsistencies:

- writings cards usually show only year, not type
- Research presentation results do not show local vs external landing semantics
- presentations archive cards are richer than Research presentation cards
- media archive cards use a different visual vocabulary from Pagefind results

Recommended minimal shared result-card vocabulary:

- visible content-family label
- year or date
- one secondary metadata line
- local vs external cue when relevant
- short description/snippet when available

That is enough to unify meaning without forcing one card component in PF2.

## 15. Language Model

Current language behavior is mixed by design:

- global `/haku/` filters to `Kieli:Suomi`
- global `/en/search/` filters to `Kieli:English`
- publications page searches `fi,en`
- theses page searches `fi,en`
- `/tutkimus/` searches `fi,en`
- `/kirjoitukset/` searches `fi` with `Kieli:Suomi`
- `/en/writings/` also searches `fi` with `Kieli:Suomi`, but with English UI copy
- presentations archive pages are JSON-driven and effectively bilingual, because they are not Pagefind-language-filtered
- `/mediassa/` FI archive is JSON-driven and not language-filtered; `/en/media/` is a static archive page

Assessment:

- labels are localized
- bilingual behavior is intentional for publications, theses, and Research
- bilingual behavior is mixed or leaky for writings and presentations
- global search should not search both languages by default yet; the current language-scoped behavior is safer for user expectation and lighter for performance

## 16. Global Search Model

Current state:

- media results are now distinguishable because they expose `Sisältö:Mediassa`
- archive landing pages are partially controlled: media archive regions are excluded with `data-pagefind-ignore`
- detail pages across families do not yet feel fully coherent, because the content-type vocabulary is not shared

Answering the core global-search questions:

- can users filter by content type today: only partially, and mostly through technical filters
- are media results distinguishable: yes
- do archive landing pages compete with detail pages: less than before for media, still somewhat elsewhere
- which facets should be global: `Sisältö`, `Kieli`, year where broadly available
- which should remain page-specific: thesis role, publication quality, media role, presentation topic, Research topic

## 17. Performance Implications

PF2 should preserve these constraints:

- no automatic searches on page load
- keep starter chips user-triggered
- do not broaden global search to `fi,en` by default
- avoid huge default result sets
- do not add a second heavy client-side sort layer on top of existing search behavior
- defer startup and bundle tuning to PF-PERF1

## 18. Risks

Biggest user-experience risk:

- the current writings family is too broad to read as one intuitive user-facing bucket

Biggest technical risk:

- reintroducing inconsistent Pagefind scoping, especially `data-pagefind-body`, would regress indexing site-wide

Biggest semantic risk:

- confusing Research contextual membership with topic mapping, especially for presentations

Other live risks:

- technical labels leaking into Pagefind filter UI
- too many low-value filters
- outlet/source strings creating noisy global facets
- treating Research like a content type instead of a view

## 19. PF2 Recommendation

Recommended PF2 track: `A`

Recommended title:

- `Add shared Sisältö facet across Pagefind detail pages`

Why this is the best next narrow step:

- it solves the clearest global-search gap exposed by PF1
- it does not require redesigning Research semantics
- it improves all families at once without forcing full UI refactors
- it creates the vocabulary foundation needed before starter chips, result-card refactors, or broader label harmonization

## 20. Open Questions

- Should `scientificPublication` remain visible inside writings at all once `Sisältö:Julkaisut` exists globally?
- Should `/en/writings/` stay a Finnish-only archive with English chrome, or should it become explicitly “selected writings” later?
- Should `/en/media/` remain a simple static archive, or should it eventually mirror FI-level filter behavior?
- Should presentations expose source-type as a user filter later, or remain topic/year first?
- Should Research eventually surface a visible “authoritative Research” badge on results, or is the route itself enough context?
