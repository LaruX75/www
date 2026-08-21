# F4-R0 Existing Research / Cross-Content Semantics Audit

Date: 2026-08-15
Status: Audit only. No implementation.

> Historical audit preserved from the pre-F4 closure workstream. This document records analysis evidence and is not the active roadmap. F4 was subsequently scoped and closed on `main` via [f4-r1-research-eligibility-2026-08-15.md](./f4-r1-research-eligibility-2026-08-15.md), [f4-r2-presentation-context-projection-2026-08-15.md](./f4-r2-presentation-context-projection-2026-08-15.md), [f4-r3-presentations-research-rollout-2026-08-15.md](./f4-r3-presentations-research-rollout-2026-08-15.md), and [f4-research-find-explore-closure-2026-08-15.md](./f4-research-find-explore-closure-2026-08-15.md).

## 1. Executive Finding

As of August 15, 2026, the shipped `/tutkimus/` route is not a dedicated Find & Explore runtime. The current Finnish research page is a curated `CollectionPage` in `src/fi/tutkimus.md`, and the English route `/en/research/` is a curated page in `src/en/research.md`. The built HTML for `/tutkimus/` contains the global site-search Pagefind UI, but it does not contain `data-find-explore`, `data-find-explore-kinds`, `FindExplore:presentations`, or `PresentationResearchPreset`.

So the prompt premise needs one correction:

- there is no currently shipped `/tutkimus/` Find & Explore page to inspect on August 15, 2026
- there is no current route-level research discovery implementation that selects publications, theses, writings, and excludes presentations

What does exist today is split across three different mechanisms:

- curated research-page composition for `/tutkimus/` and `/en/research/`
- build-time topic/profile composition on theme pages via `topicItems` and `curatedResearchForTopic`
- archive/discovery infrastructure for specific scopes such as writings, theses, publications, media, and presentations

The strongest repository-level conclusion is:

- publications and theses already have explicit research-specific semantics
- writings do not have an equivalent research-membership layer and are structurally over-broad
- presentations now have meaningful semantics for teaching, some inferred research signals, and rich topic metadata, but they still do not have an authoritative research-membership field comparable to publications/theses

## 2. Existing Content Types And Canonical Relationships

The current canonical content-type resolver is `src/_utils/resolveContentMeta.js`.

| Scope | Canonical contentType | Current broad section | Main source |
| --- | --- | --- | --- |
| Blog | `blogPost` | `blog` | `src/blog/blog.11tydata.js` |
| Opinion | `opinion` | `writings` | `src/publications/publications.11tydata.js` |
| Column | `column` | `writings` | `src/publications/publications.11tydata.js` |
| Statement | `statement` | `writings` | `src/publications/publications.11tydata.js` |
| Speech | `speech` | `writings` | `src/publications/publications.11tydata.js` |
| Initiative | `initiative` | `politics` | `src/politics/politics.11tydata.js` |
| Presentation | `presentation` | `presentations` | `src/presentations/presentations.11tydata.js` |
| Scientific publication | `scientificPublication` | `publications` | `src/_data/researchfiContent.js` |
| Thesis | `thesis` | `publications` | `src/_utils/toThesesCollectionItems.js`, `src/data/theses.json.11ty.js` |
| Media item | `mediaItem` / `video` / `expertAssignment` | `media` | `src/media/media.11tydata.js` |

Important current relationship facts:

- blog is a canonical content type, not just a label
- blog also participates in the broader writings aggregate through `src/_data/writingsPage.js`
- theses are canonical content, but they are grouped into the same broad `publications` section in `resolveContentMeta.js`
- writings is an aggregate projection, not a pure canonical domain object
- presentations have their own canonical page projection in `/data/presentations-page.json`

## 3. Existing Site Contexts

The current shared context vocabulary is implemented in `src/_data/contentContext.js`.

Current normalized context keys:

- `research`
- `teaching`
- `education`
- `media`
- `politics`
- `open-science`
- `business`
- `personal`

Current top-level context pages or page families in the repository:

- Research: `src/fi/tutkimus.md`, `src/en/research.md`
- Teaching / university work: `src/fi/tyoni-yliopistonlehtorina.njk`
- Societal interaction: `src/fi/yhteiskunnallinen-vuorovaikutus.njk`, `src/en/societal-engagement.njk`
- Politics: `src/fi/politiikka.md`, `src/en/politics.md` and `src/politics/`
- Theme profiles: `src/teemat.njk`, `src/teemat-index.njk`, `src/politics/theme-page.njk`

Important distinction:

- page/context areas already exist in site structure
- record-level membership in those areas is only partly explicit
- some areas are curated landing pages, not archive/discovery systems

## 4. Existing Classification Mechanisms

### 4.1 Canonical Content-Type And Section Resolution

Implemented in `src/_utils/resolveContentMeta.js`.

This gives the site a shared semantic layer for:

- `contentType`
- `contentTypeLabel`
- `section`

This is reusable and already active.

### 4.2 Shared Cross-Content Context Layer

Implemented in `src/_data/contentContext.js` and consumed by:

- `src/presentations/presentations.11tydata.js`
- `src/publications/publications.11tydata.js`
- `src/blog/blog.11tydata.js`
- `src/media/media.11tydata.js`
- `src/politics/politics.11tydata.js`
- `src/_data/researchfiContent.js`
- `src/_utils/thesisDerivedMetadata.js`

`resolveContexts(data)` is the closest thing the repository currently has to a shared cross-context membership system.

Important limitations:

- it is partly inferred from heuristics
- it is not consistently surfaced in all public archive projections
- it is not the same thing as the curated research-program model

### 4.3 Research-Specific Curated Metadata

Implemented through:

- `src/_data/researchProgram.js`
- `src/_data/researchfiContent.js`
- `src/_utils/toThesesCollectionItems.js`
- curated data under `src/curated/research-program.json`

Current research-specific fields already in use:

- `researchLine`
- `researchThemes`
- `researchAudience`
- `researchPriority`
- `researchSummary`
- `researchExcluded`

This is the strongest existing research-membership model in the repository, but it currently applies to publications and theses, not writings or presentations.

### 4.4 Writings Aggregate Projection

Implemented in `src/_data/writingsPage.js`.

This projection uses:

- canonical `contentType`
- `sectionKeys`
- `recordOrigin`
- `source`, `sourceKey`, `sourceLabel`
- `writingRoles`
- `opinionRoles`
- speech metadata
- publication metadata

This is a good aggregate model for writings as a browsing scope, but it is not a research-membership model.

### 4.5 Theme-Based Cross-Content Selection

Implemented in `eleventy.filters.js`:

- `topicItems`
- `groupByContentType`
- `curatedResearchForTopic`

`topicItems` scores items by:

- explicit `topics`
- `categories`
- `keywords`
- inferred/explicit `contexts`
- title/description/event/source text

`curatedResearchForTopic` separately pulls research publications by matching `researchThemes`.

This means current theme pages already distinguish:

- topical relatedness across mixed content
- curated research-program membership for research items

That distinction is important and already present.

### 4.6 Shared Discovery Architecture

The current shared discovery stack is:

- `/js/pe-list-render.js`
- `/js/content-presets.js`
- `/js/content-engine.js`

Source definitions live in:

- `src/_utils/contentPresets.js`
- `src/js/content-engine.js`
- `src/js/pe-list-render.js`

Current discovery facts:

- `src/_utils/contentPresets.js` defines many filterable fields
- those fields include `contexts`, `writingRoles`, `researchLine`, `researchThemes`, and `researchAudience`
- the only named preset currently defined is `FindExplore:presentations`
- there is no `FindExplore:research` preset in current code

## 5. Writings

Current canonical built count from `_site/data/writings-page.json`:

- total: `290`

Breakdown by `contentType`:

- `blogPost`: `70`
- `speech`: `92`
- `statement`: `6`
- `initiative`: `10`
- `scientificPublication`: `56`
- `opinion`: `47`
- `column`: `9`

Breakdown by `sectionKeys`:

- `blog`: `70`
- `speeches`: `92`
- `publicSpeeches`: `13`
- `statements`: `6`
- `initiatives`: `10`
- `publications`: `56`
- `opinions`: `47`
- `columns`: `9`

Breakdown by `writingRoles`:

- `political`: `74`
- `expert`: `52`
- `personal`: `8`

### Answers About Writings

- Are blogs part of writings: Yes. `src/_data/writingsPage.js` maps canonical `blogPost` into writings `sectionKeys: ["blog"]`.
- Are all writings currently exposed in Research Find & Explore: No shipped route-level Research Find & Explore exists on August 15, 2026.
- If F4 enabled the entire writings scope, would that include all writings: Yes, because the projection is scope-wide and not research-only.
- Would that be because writings are explicitly classified as research: No. The writings projection is not research-qualified before inclusion.
- Do writings include non-research material: Yes, heavily.
- Do writings include societal-interaction material: Yes, clearly.
- Do writings include political, personal, teaching, and other material: Yes.

Evidence from built public content:

- writings plus blog in `_site/data/content.json`: `238` local records
- those records carry contexts such as `politics: 190`, `education: 110`, `teaching: 43`, `research: 9`, `personal: 5`, `open-science: 3`, `business: 2`

This is the key over-breadth finding:

- if Research discovery consumes writings as a whole scope, it will necessarily include a large amount of non-research material unless another eligibility layer is applied first

## 6. Blogs

Blog is not merely a label.

Current repository evidence shows that blog is:

- a canonical content type: `blogPost`
- its own broad section: `blog`
- a tag family: `blog`, `blog_<role>`, `writing_<role>`
- also a writings subsection in the writings aggregate

Evidence:

- `src/blog/blog.11tydata.js`
- `src/_utils/resolveContentMeta.js`
- `src/_data/writingsPage.js`

Built counts:

- blog total in `_site/data/writings-page.json`: `70`
- blog total in `_site/data/content.json`: `70`

Built blog contexts from `_site/data/content.json`:

- `politics`: `50`
- `education`: `17`
- `teaching`: `9`
- `personal`: `5`
- `open-science`: `1`
- `business`: `1`
- `research`: `1`

Conclusion:

- blogs are currently part of writings structurally
- blogs are not currently a research-only subset
- if blogs appear in any future Research discovery based on entire writings scope, that will be because the whole writings scope was enabled, not because blog entries are already research-classified

## 7. Research Implementation Today

### 7.1 What The Shipped Research Pages Actually Are

The current shipped research routes are curated landing pages:

- Finnish: `src/fi/tutkimus.md`
- English: `src/en/research.md`

They are not progressive-enhanced archive pages built on the shared discovery engine.

Built HTML verification from August 15, 2026:

- `/tutkimus/` has Pagefind site-search assets only
- `/tutkimus/` has no `data-find-explore`
- `/tutkimus/` has no `data-find-explore-kinds`
- `/tutkimus/` has no `FindExplore:presentations`
- `/tutkimus/` has no `PresentationResearchPreset`

This matches the explicit P6 closure note in `docs/presentations-find-explore-f3c-p6-report-2026-08-14.md`:

- on August 14, 2026, no presentation rollout had been added to `/tutkimus/`

### 7.2 How Publications Are Selected On The Current Research Page

Current route-level research-page publication selection is curated, not discovery-driven.

Main path:

- `src/_data/researchProgram.js` loads `researchfiContent()`
- publications are assigned to research lines via `item.researchLine === line.key`
- `src/fi/tutkimus.md` renders `currentResearchLine.publications` and `line.publications`

So current research-page publications are selected by curated research-program metadata.

### 7.3 How Theses Are Selected On The Current Research Page

There are two different thesis-related facts:

- `src/_data/researchProgram.js` does build line-specific thesis arrays from thesis `researchLine`
- the shipped `/tutkimus/` page does not currently render that thesis discovery/feed

Instead, the visible thesis area in `src/fi/tutkimus.md` is a manually curated dissertation/pro-gradu section, not a discovery result from `/data/theses.json`.

### 7.4 How Writings Are Selected On The Current Research Page

They are not currently selected on the shipped `/tutkimus/` route through a dedicated discovery runtime.

So the answer to "which preset/filter currently selects writings on the Research page" is:

- no current route-level implementation exists to inspect

### 7.5 Whether Semantic Eligibility Filtering Happens Before Pagefind

For current `/tutkimus/`:

- no route-level research discovery preset exists
- therefore there is no current research-specific pre-Pagefind filter pipeline in that route

For theme pages:

- yes, there is build-time topical selection through `topicItems`
- and a separate research-program publication selection through `curatedResearchForTopic`

## 8. Societal Interaction

Current pages:

- `src/fi/yhteiskunnallinen-vuorovaikutus.njk`
- `src/en/societal-engagement.njk`

This area is already represented as a real page family.

Current implementation characteristics:

- it is curated
- it pulls from multiple content types
- it mixes direct collection pulls and topic-based composition

Repository evidence from the Finnish page:

- statements from `collections.publications`
- featured presentation from `canva.fiRows` or `canva.tableRows`
- council speech from `collections.pub_puhe`
- initiative from `collections.politics`
- topical mixed-content groups from `collections | topicItems(topic, 200)`
- research publications from `researchfi | curatedResearchForTopic(topic.researchThemes or [], 200)`

This is strong proof that cross-context membership already exists in practice:

- the same expertise can appear as research publication, statement, presentation, media item, or initiative
- the societal-interaction page already assembles those together without requiring a new taxonomy layer

But there is still an important limitation:

- there is no single explicit record-level `societalInteraction: true` field

## 9. Presentations

P6 baseline remains intact and was not modified in this audit.

Current canonical built counts from `_site/data/presentations-page.json`:

- canonical presentations: `218`
- with topics: `198`
- topicless: `20`
- with courseContexts: `39`
- without courseContexts: `179`
- local-first: `138`
- external-first: `80`
- local detail records in `content.json`: `139`

Current presentation semantics already present in the repository:

- `topics`
- `categories`
- `keywords`
- `presentationType`
- `event`
- `eventType`
- `role`
- `sourceType`
- `sourceLanguage`
- `courseContexts`
- `teachingUnit`
- inferred `contexts` on local detail pages via `resolveContexts(data)`

Important findings:

- `src/presentations/presentations.11tydata.js` already computes `contexts`
- presentation local detail content in `_site/data/content.json` carries contexts
- built local presentation detail contexts include `teaching: 139`, `education: 102`, `research: 33`, `business: 9`, `open-science: 3`
- the canonical archive projection `_site/data/presentations-page.json` does not currently expose a shared authoritative `research` membership field

Research-related presentation signals do exist, but they are mixed-strength:

- explicit course-context evidence strongly supports teaching
- a few research-like categories/topics exist
- research-like topical signals include `tutkimus: 1`, `tutkimusprosessi: 1`, `laadullinen tutkimus: 3`, `mixed methods: 1`, `väitöskirja: 3`
- there are `33` local presentation detail records with inferred `research` context
- there are `0` presentation-page records with explicit category `Tutkimus`

Conclusion:

- presentation metadata is already rich enough to identify some research-related candidates using existing semantics
- presentation metadata is not yet equivalent to the explicit publication/thesis research-program model

## 10. Research Topics Are Not Research Membership

This distinction already matters in current code.

`src/_data/presentationResearchTopics.js` and `src/curated/presentation-research-topic-mapping.json` answer a topic-mapping question:

- which research topic preset a presentation can safely map to

They do not answer a membership question:

- whether a presentation belongs to the Research context as a site area

The repository already separates these concerns elsewhere:

- `topicItems` is about topical relatedness across mixed content
- `curatedResearchForTopic` is about research-program publication membership

So the prompt caution is correct:

- research topic mapping is not proof of research-context membership
- the same warning applies to writings

## 11. Current Shared Discovery Architecture

Current discovery architecture facts:

- `src/_utils/contentPresets.js` is the current source of shared filter semantics
- `src/js/content-engine.js` fetches source data and executes preset queries
- `src/js/pe-list-render.js` provides the shared enhancement/render utility

Current shared filter fields already supported in `contentPresets`:

- `contentType`
- `year`
- `lang`
- `categories`
- `keywords`
- `topics`
- `contexts`
- `writingRoles`
- `publication`
- `speechContext`
- `initiativeType`
- `presentationType`
- `mediaType`
- `event`
- `thesisRole`
- `thesisType`
- `researchLine`
- `researchThemes`
- `researchAudience`

Important architectural constraint:

- only `FindExplore:presentations` is currently declared as a named preset
- so the shared engine is ready for richer research filters, but the actual Research preset/wiring is not currently shipped

## 12. Existing Reusable Semantics Assessment

| Mechanism | Status | Notes |
| --- | --- | --- |
| `resolveContentMeta` canonical `contentType` and `section` | `REUSE AS-IS` | Stable cross-content normalization already used widely. |
| `resolveContexts` / `contentContext.js` | `REUSE WITH SMALL EXTENSION` | Strong shared cross-context layer, but partly heuristic and not surfaced consistently in all public projections. |
| `researchLine`, `researchThemes`, `researchAudience`, `researchPriority` | `REUSE AS-IS` | Strong existing research-membership model for publications and theses. |
| `writingsPage.sectionKeys` | `REUSE AS-IS` | Good for writings subtype navigation, not for research membership. |
| `writingRoles` / `opinionRoles` | `REUSE WITH SMALL EXTENSION` | Useful for expert/political/personal distinctions, not enough alone for Research membership. |
| `topicItems` scoring | `REUSE WITH SMALL EXTENSION` | Useful for topical cross-content relatedness, but not authoritative context membership. |
| `curatedResearchForTopic` | `REUSE AS-IS` | Correct current method for theme-page research publication pulls. |
| `courseContexts` on presentations | `REUSE AS-IS` | Strong existing teaching signal. |
| presentation topic mapping (`presentationResearchTopics`) | `NOT SUITABLE` | Topic routing, not context membership. |
| `FindExplore:presentations` preset | `UNRELATED` | Archive preset for presentation scope, not research-membership logic. |
| whole-scope writings inclusion | `NOT SUITABLE` | Too broad for Research without another eligibility layer. |

## 13. Architectural Answers

### A. Is there already an existing mechanism that can determine whether a record belongs to Research?

Yes for publications and theses.

Evidence:

- curated research-program fields in `researchfiContent` and thesis metadata
- `researchLine`, `researchThemes`, `researchAudience`, `researchPriority`

No single equally strong universal mechanism exists yet for writings and presentations.

`contexts` is the closest shared mechanism, but today it is heuristic/inferred and weaker than the curated research-program layer.

### B. Is there already an existing mechanism for Societal Interaction?

Partly.

There is already:

- a real societal-interaction page family
- curated multi-source composition
- topic-based mixed-content assembly
- reusable context and role signals

There is not yet a single explicit record-level societal-membership flag across all content types.

### C. Can one record already belong to multiple site contexts?

Yes.

`resolveContexts()` returns an array, not a single value. Built data already shows multi-context membership for:

- writings
- blogs
- presentations
- media
- theses

### D. Are writings currently over-broad in Research?

Yes, if the future Research discovery consumes the whole writings scope.

Evidence:

- writings total: `290`
- blogs inside writings: `70`
- speeches: `92`
- initiatives: `10`
- political-role writings: `74`
- personal-role writings: `8`

That scope is clearly not equivalent to research-only material.

### E. Are blogs currently included in Research, and why?

As of August 15, 2026, no shipped route-level Research Find & Explore currently includes them, because that route-level system does not exist yet.

If a future F4 implementation includes whole-scope writings, then blogs would be included because:

- blog is part of writings structurally
- not because blog entries already have authoritative research membership

### F. Could presentations be added to Research using existing semantics without inventing a new classification layer?

Partly, but only with weaker semantics than publications/theses.

Existing semantics already support:

- teaching-oriented inclusion through `courseContexts`
- topic-oriented matching through `topics`, `categories`, `keywords`
- some inferred research-context signals through `resolveContexts`

What is still missing is a projection-level authoritative research-membership rule for presentations comparable to publication/thesis `researchLine` and `researchThemes`.

So the answer is:

- yes for heuristic or curated inclusion
- not yet at the same semantic strength as publications/theses

### G. Could the same existing semantics later support Societal Interaction discovery?

Yes.

The current best candidates are:

- `contexts`
- `writingRoles`
- `courseContexts`
- topic/theme composition
- existing curated page relationships

### H. Is any actual semantic gap left?

Yes.

The real remaining gap is not lack of metadata in general. The real gap is:

- lack of one equally strong, explicit, projection-level context-membership rule for writings and presentations that matches the current publication/thesis research-program model

In other words:

- the repository already has reusable semantics
- but it does not yet have a fully authoritative research-membership decision layer across every content family

## 14. Final Recommendation Boundary

This audit does not recommend a redesign and does not propose new taxonomy.

The repository already contains reusable semantics worth preserving:

- canonical `contentType`
- shared `contexts`
- curated research-program fields
- writings subtyping via `sectionKeys`
- presentation teaching signals via `courseContexts`
- theme-level topic composition

The most important boundary for later F4 work is:

- do not treat whole-scope writings as research by default
- do not treat research-topic mapping as proof of research membership
- do not discard existing `contexts` and research-program metadata in favor of a brand-new layer before proving a real gap

## 15. Bottom Line

The repository already knows how to model:

- what a record is
- what broad site contexts it can relate to
- what publications and theses belong to the curated research program
- how one topic can gather mixed content from multiple families

The repository does not yet ship a route-level Research Find & Explore implementation on `/tutkimus/`, and it does not yet give writings and presentations a publication/thesis-strength research-membership rule.

That is the real current boundary.
