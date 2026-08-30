# R1-A — Canonical Related Content Suitability Audit

Date: 2026-08-29
Status: `AUDIT ONLY` — no production code changed.

Answers whether the current canonical content model has enough
authoritative relationships and metadata to support useful
related-content projections, and what the safest first bounded slice
would be. **Key finding: R1 is already implemented and deployed on
five domain detail surfaces via the `relatedContent` Eleventy filter +
`content-context-sidebar.njk`. Only one repository-evidenced gap
remains.** Architecture Closure 1.0 stays closed.

## Repository truth

- Worktree: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Branch: `audit/r1a-related-content-suitability` (fresh from `origin/main`)
- Branch base: `76a4b25b6b2e58701f37fb95f6c1b9728bbe3528`
- `origin/main`: `76a4b25b6b2e58701f37fb95f6c1b9728bbe3528`
- Ahead/behind: 0/0 (audit-only branch; only this doc will be added)
- Working tree: clean apart from `.cache/api-fallback/*` auto-generated caches (preserved; excluded from commit).
- Confirmed on `main`: P1-A baseline, PF-PERF1B re-measurement, Architecture Closure 1.0 (`architecture-closure-1-0` tag → `41b88d25`).

## Architecture constraints

Target architecture (R1 rule set):

```text
canonical content
  → Eleventy / Nunjucks
  → server-rendered related-content projection
  → canonical cards / canonical landing pages
```

- Nunjucks renders truth. Pagefind discovers, filters, orders. JavaScript handles genuine interaction.
- Related-content logic should be deterministic and build-time where practical.
- Hard boundaries from roadmap §4.R1: no new taxonomy; no Research inference from topic mapping; no embedding / LLM recommender for NEW work; no parallel knowledge-graph content model.

## Existing canonical data model

Content sources on `main`:

| Domain | Source | Item count | Detail template |
| --- | --- | ---: | --- |
| Publications | `src/publications/*.md` + Research.fi + citation enrichers | 164 (built projection) | `src/_includes/publication-item.njk` + `publication-item-body.njk` |
| Presentations | `src/presentations/*.md` + Canva/SlideShare/YouTube/AOE aggregation via `src/_data/presentationsPage.js` | 218 canonical items | `src/_includes/presentation-item.njk` |
| Theses | `src/_data/theses.js` + OuluREPO cache; virtual collection via `src/_utils/toThesesCollectionItems.js` | 169 (built projection) | `src/opinnaytteet/thesis-details.njk` |
| Media | `src/media/*.md` | 73 | `src/_includes/media-item.njk` |
| Writings | Composed from `src/blog/*.md` (499) + `src/politics/*.md` (10) + presentations-writings + council speeches via find-explore projection | ~500+ shared items | `src/_includes/blog-post.njk`, `src/_includes/writing-post.njk` |
| Research | Not a separate content type; a canonical `contexts` membership overlay across the above | — | not a discrete detail template |

## Existing related-content infrastructure on `main`

R1 is **NOT green-field**. The following already exist and are in production use:

### `relatedContent` Eleventy filter

Location: `eleventy.filters.js:1153` (implementation at `computeRelatedContent` around line 100).

- Metadata-based deterministic scoring across all content collections (blog, publications, politics, media, presentations, theses).
- Weights: categories × 5, keywords × 3, tags × 2, contexts × 4, type × 2.
- Excludes self by URL; sorts by score desc, tie-break by date desc.
- Returns array of `{ url, title, description, date, typeLabel, score }`. Default limit 4.
- Optionally boosted by `src/_data/semanticRelated.json` (see below).

### `content-context-sidebar.njk`

Location: `src/_includes/content-context-sidebar.njk`.

- Renders a "Katso myös" / "See also" list of up to N related items produced by `relatedContent`.
- Included on **five** detail-page templates today:
  - `src/_includes/publication-item-body.njk:122` — Publication detail
  - `src/_includes/presentation-item.njk:109` — Presentation detail
  - `src/_includes/media-item.njk:127` — Media detail
  - `src/_includes/blog-post.njk:130` — Blog detail
  - `src/_includes/writing-post.njk:188` — Writing detail
- Falls back to `noRelated` text ("Ei läheisiä…" / "No closely related items found yet.") when the filter returns 0.

### `related-presentations.njk`

Location: `src/_includes/related-presentations.njk`.

- Uses the canonical `sivuyhteys` field (explicit page-connection tag on presentations) to render "Aiheeseen liittyviä esityksiä" per page-connection key (`kouluttaja-sivu`, `tutkimus`, `mediassa`, `tyoni-yliopistonlehtorina`).
- **Original claim**: `Currently orphaned`. **Correction (RP-CONVERGE-01A audit, 2026-08-30):** the original claim was factually stale — `src/fi/yritys.md` still includes this partial for the "Viimeisimpiä koulutusesityksiä" strip on `/kouluttaja/`. RP-CONVERGE-01A audited whether the legacy `sivuyhteys="kouluttaja-sivu"` selection could be replaced by an existing authoritative canonical relationship and **did not find a strong replacement** (see Decision C in `docs/rp-converge-01-company-presentations-convergence-2026-08-30.md`). The legacy include and its consumer therefore remain on `main` pending an editorial/architecture decision. This partial is not orphan; it is a live legacy path with a documented canonical-relationship gap.

### `semanticRelated.json`

Location: `src/_data/semanticRelated.json` (641 KB, committed).

- Generated by `scripts/build-semantic-related.js` — reads a previously-cached embedding set (PR #77 embedding cache), computes cosine similarity between all URL pairs, writes top-K per anchor URL as `{ url, sim }`.
- Consumed by `computeRelatedContent` with `SEM_WEIGHT = 5` and `SEM_MIN = 0.6`.
- Was authored during pre-closure v4.4 semantic pilot; predates the roadmap §4.R1 "no embedding / LLM recommender" boundary. This is an existing production system whose reinterpretation is a separate closure question and is **not opened by this R1-A audit**.

## Canonical relationship inventory

Signals actually present in `main` per built projections and templates:

| Signal | Source | Authority | Safe use | Unsafe use |
| --- | --- | --- | --- | --- |
| `contexts` | `src/_data/contentContext.js` `resolveContexts()` (frontmatter + inference from path/role/keywords) | Authoritative for Research membership only when frontmatter is explicit; inferred for Media (see M1/M2 closures) | Ranking signal for related-content when `contexts.includes(...)` intersects | **Do NOT** infer Research membership from topic overlap; **do NOT** use inferred Media contexts as authoritative membership |
| `categories` | Per-item frontmatter across all domains | Canonical descriptive metadata | Ranking signal (100% coverage on Publications and Media; high elsewhere) | Not a membership authority |
| `keywords` | Per-item frontmatter | Canonical descriptive metadata | Ranking signal (91–100% coverage across most domains) | Not a membership authority |
| `topics` | Presentations (`src/_data/presentationSources.js` + derived) | Canonical for Presentations; not universal | Presentations-specific ranking signal (198/218) | Do not cross-derive to non-Presentations domains as-is |
| `sivuyhteys` | Presentation frontmatter (Canva-source-derived) | **Explicit canonical page-connection** — closest thing to an authoritative link | Direct projection ("presentations related to page X"). 75/218 presentations carry it. | Do not invent additional `sivuyhteys` values purely to boost related-content |
| `researchLine` | Theses (`researchLine`), Publications (`researchThemes`) | Canonical research classification | Ranking signal within theses (110/169) and cross-domain filtering when a research surface asks for it | Do not derive `researchLine` values from other signals |
| `researchThemes` | Theses (77/169), Publications | Canonical research classification | Ranking signal within theses / cross-research surfaces | Same as `researchLine` |
| `representations` | Presentations (218/218) | Canonical multi-representation (Canva + local page + external source) | Deduplication key when building cross-representation cards | Not a similarity signal |
| `sourceKey` | Presentations (218/218) | Canonical source-type (`aoe`, `canva`, `slideshare`, `youtube*`) | Domain-facet or grouping | Not a semantic-similarity signal |
| `authors` / `authorsAll` | Publications (100% via Research.fi/manual) | Canonical | Publication-to-publication ranking when domain semantics justify | Weak signal cross-domain without explicit publication co-authorship |
| Semantic similarity (`semanticRelated.json`) | Embedding-derived (v4.4 pre-closure) | **Not a new canonical relationship** — additive boost to existing metadata score | Existing production behavior (SEM_WEIGHT=5) | R1 hard boundary discourages NEW embedding recommenders; do not extend the semantic layer as part of R1-A |

Signal classification per the audit's A/B/C/D taxonomy:

- **A — Canonical authoritative relationship**: `sivuyhteys` (Presentations); `representations` (Presentations, for cross-representation dedup).
- **B — Canonical metadata useful for ranking**: `contexts` (except Research membership determination); `categories`; `keywords`; `topics` (Presentations); `researchLine`, `researchThemes` (Theses/Publications within Research surfaces).
- **C — Discovery-only metadata**: `sourceKey`, `authors` when cross-domain, freeform `tags` where used.
- **D — Unsafe inference**: deriving `contexts` from topic overlap; treating Pagefind result similarity as canonical relationship; treating shared author alone as topical relationship (outside Publications); introducing a NEW embedding/LLM recommender.

## Domain-by-domain audit

### Publications

- **Canonical source**: `src/publications/*.md` + `src/_data/researchfi.js` + citation enrichment.
- **Useful signals**: contexts, categories, keywords, authors, researchThemes.
- **Detail surface**: `publication-item.njk` via `publication-item-body.njk:122` — **currently renders `content-context-sidebar` → up to 4 related items**. Verified: sample publication detail rendered 4 candidates (3 theses on adjacent AI-literacy topics + 1 blog post on structurally-related learning topic).
- **Shared cards**: `publication-item-body.njk` renders card; related items link to canonical local landing (`/julkaisut/{slug}/`) or external OuluREPO for theses candidates.
- **FI/EN parity**: `_meta.njk` locale-aware; sidebar `txt` object switches on locale.
- **Landing/source semantics**: preserved (title link → canonical `url` which is `.publicUrl` for local publications).
- **SSR at build time**: yes, current implementation is entirely SSR via `relatedContent` filter.
- **Runtime JSON / Pagefind dependency**: none for the related-content path.
- **Useful**: **Yes, already deployed.** No repo-evidenced R1 gap on Publications.

### Presentations

- **Canonical source**: `src/presentations/*.md` + `src/_data/presentationsPage.js` aggregation.
- **Useful signals**: contexts, categories, topics (Presentations-specific), sivuyhteys (explicit canonical relationship, 75/218 coverage), keywords (partial).
- **Detail surface**: `presentation-item.njk:109` — **currently renders `content-context-sidebar`** with local-first semantics preserved by the outer template (external-first presentations don't get a local detail page).
- **Shared cards**: yes via `presentation-item.njk`.
- **FI/EN parity**: same include on both locales.
- **Landing semantics**: external-first presentations don't reach this template; related-content on local detail correctly stays within local canonical space.
- **SSR at build time**: yes.
- **Useful**: **Yes, already deployed.** The `sivuyhteys` signal is *not* used by `content-context-sidebar` today — it is consumed only by the orphaned `related-presentations.njk` include. See "Duplication / deletion opportunities" below.

### Theses

- **Canonical source**: `src/_data/theses.js` (OuluREPO cache) + virtual collection via `src/_utils/toThesesCollectionItems.js`.
- **Useful signals**: contexts (100%), categories (90%), keywords (71%), researchLine (65%), researchThemes (46%).
- **Detail surface**: `src/opinnaytteet/thesis-details.njk` — **does NOT include `content-context-sidebar`**. Verified: sample thesis detail (`_site/opinnaytteet/63335/index.html`) has zero `content-context-related` / `noRelated` / `Katso myös` / `See also` / `content-context-sidebar` markers.
- **Shared cards**: `thesis-details.njk` uses domain-specific rendering; card format for related-picks would come from `content-context-sidebar`'s minimal `<li><a>title</a> <span>typeLabel</span></li>`.
- **FI/EN parity**: same template; per-item `lang` respected.
- **Landing semantics**: canonical thesis `pageUrl` present; related picks would link to canonical local detail.
- **SSR at build time**: yes — the theses virtual collection is already consumed by `computeRelatedContent`, so *thesis pages already produce candidates for OTHER domains' related lists* (see Publications sample); they just don't consume them on the thesis side.
- **Useful**: **Yes, and this is the single repo-evidenced R1 gap.** Adding the include is the smallest bounded implementation candidate (see §First bounded R1 implementation candidate).

### Media

- **Canonical source**: `src/media/*.md`.
- **Useful signals**: contexts (100% incl. inferred `media` context; note M1/M2 warned against treating inferred contexts as authoritative for Research), categories (100%), keywords (100%).
- **Detail surface**: `media-item.njk:127` — **currently renders `content-context-sidebar`**.
- **Shared cards**: yes.
- **FI/EN parity**: same include.
- **Landing semantics**: preserved; media detail has external source CTA as visually primary action (per M2/O1), related sidebar is secondary.
- **SSR at build time**: yes.
- **Useful**: **Yes, already deployed.** No repo-evidenced R1 gap on Media.

### Writings

- **Canonical source**: composed from `src/blog/*.md` (499) + `src/politics/*.md` (10) + council speeches + other via find-explore-writings pipeline.
- **Useful signals**: contexts (89% blog), categories (100% blog), keywords (99% blog).
- **Detail surfaces**: `blog-post.njk:130` and `writing-post.njk:188` — **both render `content-context-sidebar`**.
- **FI/EN parity**: blog-post template is bilingual-aware.
- **Landing semantics**: preserved.
- **Useful**: **Yes, already deployed.** No repo-evidenced R1 gap.

### Research

- Not a separate content type. Research membership = canonical `contexts.includes("research")` overlay across Publications, Theses, Writings, Presentations (33/218 presentations, per PF5-G2), plus F4 rollout evidence.
- Research does not need a discrete Research detail page for R1. Cross-domain research discovery is served by `/tutkimus/` + `/en/research/` mixed-kind Find & Explore mounts.
- **Not an R1-A gap.**

## Coverage measurements

Fields measured from built JSON projections (`_site/data/*.json`) — the same shapes `relatedContent` sees at build time.

### Field coverage

| Domain | Items | contexts | categories | keywords | topics | sivuyhteys | researchLine | researchThemes | representations | sourceKey |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Publications | 164 | 161 (98%) | 164 (100%) | 157 (96%) | 0 | 0 | 0 | 0 | 0 | 0 |
| Presentations | 218 | 140 (64%) | 193 (89%) | 116 (53%) | 198 (91%) | 75 (34%) | 0 | 0 | 218 (100%) | 218 (100%) |
| Theses | 169 | 169 (100%) | 153 (90%) | 120 (71%) | 0 | 0 | 110 (65%) | 77 (46%) | 0 | 0 |
| Media | 73 | 73 (100%) | 73 (100%) | 73 (100%) | 0 | 0 | 0 | 0 | 0 | 0 |
| Writings (blog frontmatter approximation) | 499 | ~445 (89%) | 499 (100%) | 494 (99%) | 13 | 0 | 0 | 0 | 0 | 0 |

`writings.json` is not published as a single projection; measurement uses `src/blog/*.md` frontmatter as the representative sample. Actual coverage on the writings collection may be higher because `resolveContexts()` normalizes at build time.

### Candidate reach ("can this item produce at least one related-content candidate?")

Matching rule: item X has at least one candidate if there exists another item Y (in any of the domain collections `relatedContent` iterates) sharing at least one category, keyword, or context term.

| Domain | Items | ≥1 by category | ≥1 by keyword | ≥1 by context |
| --- | ---: | ---: | ---: | ---: |
| Publications | 164 | 161 (98%) | 151 (92%) | 161 (98%) |
| Presentations | 218 | 190 (87%) | 110 (50%) | 140 (64%) |
| Theses | 169 | 153 (90%) | 84 (50%) | 169 (100%) |
| Media | 73 | 73 (100%) | 73 (100%) | 73 (100%) |

At the deployed weight (categories×5 + keywords×3 + contexts×4 + tags×2 + type×2), any item that shares a category with a peer will score ≥5 and therefore pass `score > 0` inclusion. **≥3 candidates** is essentially guaranteed on Publications, Theses, and Media given the observed cross-domain overlap. Presentations' lower keyword coverage (53%) is not a limitation because categories + topics + contexts sustain candidate reach.

## Representative quality sample

One Publications detail sample (`_site/julkaisut/rf-rf-structuring-and-regulating-collaborative-learning-in-higher-education-with-wireless-networks-and-mobile-tools/index.html`, an old shared-writing publication on collaborative learning + mobile tools) rendered by the current `content-context-sidebar` + `relatedContent`:

| # | Title (truncated) | URL | Type | Quality |
| --- | --- | --- | --- | --- |
| 1 | Kuinka opettajaopiskelijoiden tekoälytaidot näkyvät heidän t… | `oulurepo.oulu.fi/handle/10024/62907` | Thesis (Bachelor's) | Clearly relevant (learning + teacher-student technology overlap) |
| 2 | Tekoälylukutaidon ilmeneminen luokanopettajaopiskelijoiden p… | `oulurepo.oulu.fi/handle/10024/64139` | Thesis (Bachelor's) | Clearly relevant (same subject cluster) |
| 3 | Animaatioita ja Ipadeja : luokanopettajaopiskelijoiden ajatu… | `oulurepo.oulu.fi/handle/10024/13035` | Thesis (Master's) | Plausible (mobile-tools / classroom subject) |
| 4 | Introduction: Scaffolding learning activities with collabora… | `/2012/10/04/introduction-scaffolding-learning-activities-with-collaborative-scripts-and-mobile-devices/` | Blog / Writing | Clearly relevant (same original CSCL + mobile-tools thread) |

- 4 candidates surfaced, of which 3 clearly relevant + 1 plausible on domain-adjacent terms.
- Deterministic result: order is stable across builds.
- No self-linking observed. No obvious duplicate destination (thesis URLs are OuluREPO externals; the local publication URL is not repeated).

Sample of one is not statistical proof of quality across the corpus, but confirms:

1. The signal set (categories/keywords/contexts) surfaces meaningful adjacencies at least on this well-tagged item.
2. Cross-domain routing works (publication → theses + blog).
3. Landing semantics are preserved (OuluREPO externals link out; local blog post links locally).

## FI / EN parity

- `content-context-sidebar.njk` is locale-aware via `txt` block (FI: "Katso myös" / "Ei läheisiä…" — EN: "See also" / "No closely related items found yet.").
- `relatedContent` treats items language-agnostically at scoring time; per-item `lang` is not used to gate candidacy. The user may see a mixed-language related list. This matches how Publications / Theses / Blog corpora already blend across languages.
- Detail templates are shared across FI and EN; label switches happen inside the include.
- No accidental implementation asymmetry surfaced during this audit.

## Existing related-content-like paths

| Path | Consumer | Source of truth | SSR / runtime | Overlaps with R1? | Notes |
| --- | --- | --- | --- | --- | --- |
| `content-context-sidebar.njk` + `relatedContent` filter | 5 detail templates (Publications, Presentations, Media, Blog, Writings) | Canonical metadata (categories/keywords/tags/contexts/type) + optional `semanticRelated.json` boost | **SSR** (Nunjucks include at build) | This IS R1 in production | Deployed; no rework needed |
| `related-presentations.njk` | **Original claim: "No active consumer on `main`". Corrected 2026-08-30 (RP-CONVERGE-01A audit):** `src/fi/yritys.md` is a live FI-only consumer of this partial for `/kouluttaja/`'s "Viimeisimpiä koulutusesityksiä" strip. RP-CONVERGE-01A audit **did not find a strong canonical replacement** (Decision C — see `docs/rp-converge-01-company-presentations-convergence-2026-08-30.md`). Partial and consumer remain on `main`. | Legacy `sivuyhteys` (page-connection editorial marker in `canva-presentations.json`) — not proven to be canonical relationship authority | SSR | Convergence blocked at RP-CONVERGE-01A pending canonical-relationship definition | Deletion held; audit findings shipped as documentation only |
| `topic-profile-links.njk` | `esitykset.njk` and possibly others via `seoTopics` filter | Curated `seoTopics` list | SSR | Adjacent (topic aggregator, not related-item) | Not R1; leave in place |
| `contentTermCloud` filter | Detail pages (via templates) | Canonical categories + keywords | SSR | Adjacent term-cloud, not related-item list | Not R1; leave |
| `sameCouncilMeetingGroup` filter | Council-meeting pages | Explicit council-meeting relationship | SSR | Domain-specific relationship projection | Not R1 scope |
| `topicItems` filter | `teemat/{slug}.njk` | Canonical topic assignment | SSR | Topic-page aggregator, not per-item related | Not R1 scope |
| `topic-profile-links.njk` on `esitykset.njk` | Presentations archive | Curated theme profiles | SSR | Adjacent | Not R1 |

## Duplication / deletion opportunities

Two repo-evidenced opportunities. Neither is opened for deletion by this audit.

1. **`src/_includes/related-presentations.njk` — original claim was "orphaned"; corrected 2026-08-30 by the RP-CONVERGE-01A semantic-source audit.** The original R1-A grep missed the FI-only consumer in `src/fi/yritys.md` (the `/kouluttaja/` page's "Viimeisimpiä koulutusesityksiä" strip that reads `canva.tableRows` filtered by the non-canonical `sivuyhteys="kouluttaja-sivu"` editorial marker). RP-CONVERGE-01A audited whether an authoritative canonical relationship exists to replace this selection and reached **Decision C (canonical signal exists but parity is weak / ambiguous)**: the canonical `contexts.includes("business")` map covers only 7 of the 57 legacy items (12 %) and its membership is itself text-inferred by `inferContexts` in `src/_data/contentContext.js`. Deletion is therefore held pending an editorial/architecture decision (explicit `contexts:` declarations on presentation MDs, an amendment to `inferContexts`, or a Canonical Content v1 change). See `docs/rp-converge-01-company-presentations-convergence-2026-08-30.md`.

2. **`semanticRelated.json` embedding boost** in `computeRelatedContent`. The v4.4 semantic-related layer predates the 2026-08-20 roadmap R1 boundary "no embedding / LLM recommender". Not a violation retroactively — the roadmap boundary was written to prevent NEW embedding recommenders, not to remove an existing one. Classification: **needs consumer/convergence audit** if a future workstream wants to align the codebase with the R1 boundary strictly. **This R1-A audit does not recommend touching it.** Removing it would be a separate architecture-level decision with the same rigor as any AC1-boundary reopen.

## Candidate strategies (repo-evidence supported)

| Strategy | Repo evidence today | Fit |
| --- | --- | --- |
| 1 — Explicit canonical links | `sivuyhteys` field on Presentations (75/218) | Strong within Presentations; not a site-wide primitive today |
| 2 — Shared canonical context | 89–100% coverage on 4 of 5 domains; already used with weight ×4 in `relatedContent` | **Deployed** |
| 3 — Shared canonical topics/categories | 87–100% coverage on categories across domains; already used with weight ×5 in `relatedContent` | **Deployed** |
| 4 — Shared projects | No explicit canonical `project`/`projects` field on `main` | Not available today; would require canonical authoring first |
| 5 — Shared authors/presenters | Publications carry authors; not exposed on other domains | Publication-to-publication ranking possible; cross-domain author-based ranking is weak |
| 6 — Mixed deterministic score | `relatedContent` already implements this | **Deployed** |

## SSR feasibility

Already SSR:

- `relatedContent` runs at Eleventy build time.
- `content-context-sidebar.njk` is a Nunjucks include; no runtime fetch, no browser JS involvement for the related-content path.
- Failure mode is graceful: `noRelated` copy renders when zero candidates.

Extending the include to `thesis-details.njk` is a single-line SSR change; no browser-side machinery, no runtime JSON, no Pagefind involvement.

## User-value assessment

| Surface | User value | Rationale |
| --- | --- | --- |
| Publication detail | **High (already deployed)** | Publications frequently link to teaching + thesis contexts users want to continue exploring. Sample confirms clearly-relevant picks. |
| Presentation detail | **High (already deployed)** | Presentations often cluster around teaching / research contexts. |
| Media detail | **Medium (already deployed)** | Media items are typically short; related picks add exploration value. |
| Blog / Writing detail | **High (already deployed)** | Blog is the largest corpus and benefits most from cross-references. |
| **Thesis detail** | **High (repo-evidenced gap)** | Theses are dense canonical items with 100% contexts / 90% categories coverage; related picks would surface adjacent Publications, other Theses, and Writings on the same research line — a natural cross-content continuation. Currently absent. |
| Homepage | Low | Site-wide navigation already covers primary exploration. Adding per-topic related lists to homepage duplicates existing topic-profile-links + topic aggregation. |
| Archive pages | Low | Users on archive pages are browsing lists; related-content on the list itself is redundant. |
| `/tutkimus/` cross-domain surface | Low | Handled by Find & Explore mixed-kind mount; not a related-content-per-item surface. |

## Decision

**C — Partial suitability.**

Rationale:

- R1 is already implemented in production via `relatedContent` + `content-context-sidebar`, deployed on Publications, Presentations, Media, Blog, and Writings detail pages.
- Coverage on the deployed surfaces is strong (98–100% categories, 89–100% contexts on most domains).
- Quality sample confirms deterministic, meaningful picks with correct landing semantics preserved.
- The one repo-evidenced gap is **thesis detail pages**, which have zero related-content rendering today despite thesis items already contributing candidates *into other domains' lists*.
- The one "duplication" opportunity (`related-presentations.njk` orphan) is convergence, not new implementation.
- No site-wide R1 rollout is justified. Adding related-content to homepage / archive / topic pages would duplicate existing aggregators.

### R1 hard-boundary observation — constrains the next slice

The current production `relatedContent` path adds an embedding-derived contribution from `src/_data/semanticRelated.json` at `SEM_WEIGHT = 5` (see §"Existing related-content infrastructure on `main`" and §"Canonical relationship inventory"). The current R1 roadmap boundary explicitly states:

> `no embedding / LLM recommender`

The production semantic layer predates the current R1 boundary and is not a retroactive violation, but any **new** related-content surface added under R1 today would extend an embedding-derived recommender to that surface. Thesis detail is exactly such a new surface.

Therefore the immediate next implementation cannot be a thesis-side extension. R1 must first converge onto its own canonical-only contract before expanding coverage. See §"First bounded R1 next step" below.

## First bounded R1 next step

The immediate next step is **not** an implementation slice. The R1 hard boundary (`no embedding / LLM recommender`) currently conflicts with the production `relatedContent` semantic contribution (see §"R1 hard-boundary observation" above). Extending R1 to a new surface today would extend that contribution to that surface. R1 must first converge onto its own contract via one bounded audit.

### R1-B0 — Semantic related-content reconciliation audit (audit-only)

**Purpose:** determine whether the legacy embedding-derived `src/_data/semanticRelated.json` contribution can be removed from `computeRelatedContent` without materially degrading related-content quality, so R1 can converge onto its canonical-only architecture contract before expanding to Theses.

**Scope of R1-B0:**

- Compare two ranking configurations across the five domains that currently consume `content-context-sidebar` (Publications, Presentations, Media, Blog, Writings):
  - **Current ranking** — categories ×5, keywords ×3, contexts ×4, tags ×2, type ×2, semantic similarity ×5 (`SEM_WEIGHT = 5`, `SEM_MIN = 0.6`), plus any explicit relationship logic currently present in `computeRelatedContent`.
  - **Canonical-only ranking** — the exact same weights except `SEM_WEIGHT = 0`. Do not change any other weight during the comparison.
- Use representative samples from each currently consuming domain. Sample size and selection method to be defined by the audit; must be reproducible.
- For each sample item record:
  - top-4 candidate overlap between the two rankings
  - ordering changes (position swaps, drop-outs, new entries)
  - each candidate classified as clearly relevant / plausible / weak / misleading
  - cases where semantic similarity uniquely rescues a useful candidate (present in current, absent in canonical-only)
  - cases where semantic similarity introduces a weaker candidate (present in current, weak/misleading vs. canonical-only)
  - coverage change (did any item drop from ≥1 candidate to 0?)
- Do NOT modify `computeRelatedContent`, `relatedContent`, `content-context-sidebar.njk`, or `src/_data/semanticRelated.json` during the audit. Use a read-only harness (temporary script under `/tmp/` or similar) that instantiates the same `computeRelatedContent` logic twice with the two weight configurations against built collection data.
- Do NOT reinterpret semantic similarity as a canonical relationship. The comparison is a quality/coverage measurement, not a taxonomy claim.

**R1-B0 decision output — exactly one:**

- **A — Semantic layer removable.** Canonical-only ranking maintains acceptable quality. Next implementation: remove `semanticRelated.json` from the `computeRelatedContent` path (and the associated build helper `scripts/build-semantic-related.js` and the committed JSON) where consumer proof permits, then proceed to R1-B1 (Thesis).
- **B — Semantic layer materially useful but conflicts with current R1 contract.** Do not expand R1 to new surfaces. Escalate for an explicit architecture decision (either amend the R1 boundary to permit the existing semantic layer, or accept the coverage/quality cost of removing it) before further R1 rollout.
- **C — Inconclusive.** More evidence required.

Estimated scope of R1-B0: **SMALL–MEDIUM audit** (harness + representative samples + comparison table + closure decision).

### R1-B1 — deferred, BLOCKED on R1-B0

**Slice R1-B1: Add `content-context-sidebar` to `src/opinnaytteet/thesis-details.njk`** (details below) remains the natural surface-coverage next step but is **BLOCKED** on the outcome of R1-B0:

- If R1-B0 concludes **A**, R1-B1 becomes safe to schedule as a small template edit that inherits only the canonical-only ranking.
- If R1-B0 concludes **B**, R1-B1 waits for the escalated architecture decision — no new surface should inherit the embedding boost while the boundary conflict is open.
- If R1-B0 concludes **C**, R1-B1 waits for the additional evidence.

Specification of R1-B1 for future reference (not implementation):

- **Domain**: Theses.
- **Exact surface**: `src/opinnaytteet/thesis-details.njk` (renders `/opinnaytteet/{id}/`).
- **Canonical inputs**: `thesisDetail` already exposes `categories`, `keywords`, `contexts` via `eleventyComputed`. No new canonical fields required.
- **Matching / ranking rule**: whatever `relatedContent` state R1-B0 leaves on `main`. No new scoring rule.
- **Maximum results**: default 4 (matches every other deployed surface).
- **Deterministic tie-break**: score desc, then date desc.
- **Canonical destination semantics**: `content-context-sidebar` uses candidate `.url`; preserves landing/source semantics.
- **SSR rendering path**: single-line `{% include "content-context-sidebar.njk" %}` inside `thesis-details.njk` — same shape as `publication-item-body.njk:122`. No `data-*` attributes, no runtime JSON, no Pagefind involvement.
- **FI / EN handling**: existing sidebar copy switches on locale.
- **Tests required**: extend an existing thesis regression spec to assert `content-context-related` (or `noRelated`) is present on a sample built thesis detail page.
- **Non-goals**: no new canonical fields, no thesis-specific weighting, no research-membership inference, no changes to `relatedContent` filter internals, no `related-presentations.njk` deletion in the same commit.

Estimated scope of R1-B1 (once unblocked): **SMALL** (one template edit + one test extension + one closure doc).

## Deferred domains

- **Homepage and archive pages**: user value low; duplicates existing topic-profile-links / archive aggregators.
- **`/tutkimus/` cross-domain research surface**: served by the shared Find & Explore mount; not a per-item related-content surface.
- **Media outlet-based related items**: outlet normalization (28 distinct strings) still pending per M2 closure; do not introduce outlet-driven relationships here.
- **Explicit project / project-membership fields**: not present in canonical model; would require canonical authoring first. Do not add here.

## Non-goals

Per the R1-A hard boundaries and the AC1 architecture rules:

- No new canonical fields on any content type.
- No modifications to `computeRelatedContent` weights, semantics, or the `semanticRelated.json` layer **inside R1-A**. R1-B0 (audit-only) analyzes them read-only; any change is a separate follow-up commit gated by R1-B0's decision.
- No new Pagefind involvement in related-content.
- No **new** embedding / LLM / vector similarity work. The existing pre-closure semantic layer is analyzed by R1-B0, not extended by R1-A.
- No taxonomy inventions.
- No Research membership derivation from topics / authors / similarity.
- No parallel client-side content model.
- No SPA architecture.
- No public JSON deletion (e.g., `/data/presentations-page.json`, `/data/media.json`).
- No delete of `related-presentations.njk` in this branch — flagged as separate convergence.
- No touch to shared presenter, Presentations Slice 3 SSR path, or any other closed lane.
- No implementation of R1-B0 or R1-B1 in this branch or PR.
- No thesis-detail template edit before R1-B0 concludes (R1-B1 is BLOCKED).

## Architecture status

**Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. R1-A identifies a post-closure semantic reconciliation requirement but does not reopen AC1.**

The reconciliation is post-closure convergence / deletion work: the production semantic layer predates the current R1 hard boundary and is not a retroactive AC1 violation. R1-B0 (audit-only) exists to determine whether removing the semantic contribution costs quality, and R1-B1 (Thesis coverage) waits for R1-B0's answer. Neither step reopens the AC1 architecture; both are post-closure planning that respects the current R1 contract.
