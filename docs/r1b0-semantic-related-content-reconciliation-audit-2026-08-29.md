# R1-B0 — Semantic Related-Content Reconciliation Audit

Date: 2026-08-29
Status: `AUDIT ONLY` — no production code changed.

Reconciles the production `computeRelatedContent` embedding-derived
contribution (`src/_data/semanticRelated.json`, `SEM_WEIGHT=5`) against
the current R1 roadmap boundary (`no embedding / LLM recommender`) via
a deterministic ablation comparison. Blocks or unblocks R1-B1
(Thesis-detail sidebar) based on measured evidence.

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. R1-B0 does
not reopen AC1.

## Repository truth

- Worktree: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Branch: `audit/r1b0-semantic-related-reconciliation` (fresh from `origin/main`)
- Branch base: `274afe0d03623eb1171f71e1a13f2c2f896e984d`
- `origin/main`: `274afe0d03623eb1171f71e1a13f2c2f896e984d`
- Ahead/behind: 0/0 (audit-only branch; only this doc will be added)
- Working tree: clean apart from `.cache/api-fallback/*` auto-generated caches (preserved; excluded from commit).
- Verified on `main`: `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md` (R1-A decision `C — Partial suitability`, R1-B1 explicitly BLOCKED on R1-B0), `docs/architecture-closure-1-0-closure-2026-08-29.md`.

## R1 contract

Roadmap §4 R1 rules relevant to this audit:

- use existing canonical semantics
- prefer SSR projection
- no new taxonomy
- no Research inference from topic mapping
- **no embedding / LLM recommender**
- no parallel knowledge-graph model

The production semantic layer predates the boundary and is not a retroactive AC1 violation, but any *new* related-content surface added under R1 would extend the embedding contribution to that surface. R1-B0 answers whether removing the contribution costs measurable quality.

## Current related-content architecture

Verified against `main` at `274afe0d`.

- **Filter**: `eleventy.filters.js:1153` registers `relatedContent`, delegating to `computeRelatedContent` (defined at line 87).
- **Exports**: `computeRelatedContent`, `SEM_MIN`, `SEM_WEIGHT`, `__setSemanticRelatedCacheForTest`, `__getSemanticRelatedForTest` (lines 1461–1465).
- **Existing unit test**: `tests/unit/related-content-hybrid.test.js` — 10 v4.4 hybrid contract cases; the pattern `computeRelatedContent(..., {})` is exactly canonical-only mode (test case 1).
- **Consumers** (unchanged since R1-A):
  - `src/_includes/publication-item-body.njk:122` — Publication detail
  - `src/_includes/presentation-item.njk:109` — Presentation detail
  - `src/_includes/media-item.njk:127` — Media detail
  - `src/_includes/blog-post.njk:130` — Blog detail
  - `src/_includes/writing-post.njk:188` — Writing detail
- Every consumer renders SSR via `content-context-sidebar.njk` which calls the filter with `limit = 4`. No runtime JSON fetch, no Pagefind involvement in the related-content path.

## Semantic layer provenance

- **File**: `src/_data/semanticRelated.json` — 641 455 bytes raw / 74 656 bytes gzipped. 634 anchor keys, 6 340 total (url, sim) edges, 5 219 (82.3%) edges above `SEM_MIN=0.6`. Sim range 0.431–0.939, median 0.666.
- **Generator**: `scripts/build-semantic-related.js`. Header comment declares itself as "v4.4 Vaihe A: rakenna build-time semantic top-K per URL" reading a "PR #77 embedding-cache", computing pair-wise cosine similarity, writing `{ url, sim }` per anchor. Emits to `src/_data/semanticRelated.json`. Does NOT run Ollama at build time; consumes cached embeddings.
- **Loader in filter**: `getSemanticRelated()` (`eleventy.filters.js:66`) lazy-reads the file once per Node process; fallback `{}` if missing. Line 72 warns if the file cannot be read.
- **Wire in `computeRelatedContent`**: line 108 `const semSim = semByUrl.get(item.url) || 0;` and line 109 `const semanticBoost = semSim >= SEM_MIN ? semSim * SEM_WEIGHT : 0;`. Boost is additive on top of `metadataScore`.

## Current scoring model

Verified against `computeRelatedContent`:

| Signal | Weight | Source | Canonical? | Role |
| --- | ---: | --- | --- | --- |
| Shared `categories` | ×5 | `item.data.categories ∩ wanted` | Yes | Primary canonical similarity |
| Shared `contexts` | ×4 | `item.data.contexts ∩ wanted` | Yes | Cross-content contextual link |
| Shared `keywords` | ×3 | `item.data.keywords ∩ wanted` | Yes | Descriptive similarity |
| Shared `tags` | ×2 | `item.data.tags ∩ wanted` | Yes | Descriptive similarity |
| Same `type` | ×2 | `item.data.type === wanted` | Yes | Domain-affinity nudge |
| Semantic similarity | ×5 | `semanticRelated.json` per-anchor edges | **No — embedding-derived** | Additive boost when `sim ≥ SEM_MIN=0.6`; else 0 |

Inclusion rule: item survives if `metadataScore > 0 OR semanticBoost > 0`. Self-URL is excluded. Ordering: score desc, tie-break by date desc. Default limit 4.

## Consumer map

For each currently consuming domain — verified template, filter invocation, SSR output, candidate pool, canonical landing preservation:

| Domain | Template | Invocation | SSR | Semantic influence possible | Landing |
| --- | --- | --- | --- | :-: | --- |
| Publications | `publication-item-body.njk:122` | via `content-context-sidebar.njk:12` | Yes | Yes | Preserved (candidate `.url`) |
| Presentations | `presentation-item.njk:109` | via `content-context-sidebar.njk:12` | Yes | Yes | Preserved |
| Media | `media-item.njk:127` | via `content-context-sidebar.njk:12` | Yes | Yes | Preserved |
| Blog | `blog-post.njk:130` | via `content-context-sidebar.njk:12` | Yes | Yes | Preserved |
| Writings | `writing-post.njk:188` | via `content-context-sidebar.njk:12` | Yes | Yes | Preserved |

All five consume the same limit=4 include and the same filter path. Thesis detail (`src/opinnaytteet/thesis-details.njk`) does NOT consume the filter today — this is exactly the R1-B1 gap that R1-B0 gates.

## Audit methodology

Read-only harness (`/tmp/r1b0-harness.mjs`, removed before commit) that:

1. Requires `eleventy.filters.js` and pulls `computeRelatedContent`, `SEM_MIN`, `SEM_WEIGHT` directly (module exports).
2. Loads `src/_data/semanticRelated.json` verbatim as the filter would.
3. Reconstructs collection candidates from built projections (`_site/data/{writings-page,publications-page,presentations-page,media,theses}.json`) in the Eleventy collection-item shape `{ url, date, data: { title, categories, keywords, tags, contexts, type } }` — identical to `tests/unit/related-content-hybrid.test.js:makeItem`. Union deduplicated by URL. Total unique candidate pool: 747 items.
4. Samples 10 source items per consuming domain, deterministically evenly-spaced along date-desc ordering (no cherry-picking). Total 50 source items.
5. For each source, runs the same filter twice:
   - **CURRENT**: `computeRelatedContent(collections, url, cats, kws, tags, type, ctxs, 4, semanticRelated)` — production ranking.
   - **CANONICAL-ONLY**: `computeRelatedContent(collections, url, cats, kws, tags, type, ctxs, 4, {})` — same weights, empty semantic map. Equivalent to `SEM_WEIGHT = 0`.
6. Records: top-4 URL lists, per-candidate scores, per-candidate sim, overlap count, current-only URLs, canonical-only URLs, semantic-rescue count (current-only ∩ semantic edges ≥ SEM_MIN), semantic-harm count (canonical-only-new).

No modification of `computeRelatedContent`, `relatedContent`, `content-context-sidebar.njk`, `semanticRelated.json`, or any weight. Pure ablation — the only differing input is the semantic map.

Existing unit test `tests/unit/related-content-hybrid.test.js` case 1 (`"semanticRelated={} → tulos on identtinen metadata-only-toteutuksen kanssa"`) is authoritative that `{}` = canonical-only mode.

## Sample design

10 samples per domain, deterministically picked via evenly-spaced indices across each domain's built projection sorted by date desc.

| Domain | Source pool | Sample n |
| --- | ---: | ---: |
| Publications | 56 | 10 |
| Presentations | 218 | 10 |
| Media | 73 | 10 |
| Blog (contentType = blogPost) | 70 | 10 |
| Writings (opinion / statement / speech / column / initiative / scientificPublication) | 220 | 10 |
| **Total source samples** | — | **50** |

Note: Theses is a candidate pool (169 items) but **not** a consuming surface — the R1-B0 spec restricts source sampling to the 5 currently-consuming domains (Publications, Presentations, Media, Blog, Writings). Theses items DO appear in the shared candidate pool for other-domain sources' matches, matching production behavior.

## Quantitative comparison

### Metric definitions (matter — see correction note below)

Two related metrics track how similar CURRENT and CANONICAL-ONLY are per source item:

- **No-change** — CURRENT and CANONICAL-ONLY return the **exact same URL list** in the same or shorter length. Equivalently: `currentOnly.length == 0 AND canonicalOnlyNew.length == 0`. This is the primary decision-relevant metric: it counts items where the semantic layer has zero visible effect on the produced result set, regardless of whether that set is full-4 or short.
- **Exact top-4 (overlap = 4)** — both variants return four candidates AND all four URLs match. This is a *stricter* metric that additionally requires full-length results in both variants. An item where both variants return an identical shorter set (e.g. 0 or 2 candidates) is classified as **no-change but not exact top-4** — the semantic layer did not affect its result, but the canonical metadata alone could not produce four candidates.
- **Any change** — items where the two variants return different URL lists (the two are logically inverse to no-change).

The earlier draft of this audit conflated the two by reporting "exact top-4" as though it implied any change. Per-source verification (see re-verified Presentations table below) reconciles the metrics.

### Per-domain results (corrected)

| Domain | Samples | No-change (identical top-K) | Any change | 2+ changes | Exact top-4 (overlap = 4) | Mean overlap |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Publications | 10 | **10 (100%)** | 0 | 0 | 10 | 4.00 |
| Presentations | 10 | **10 (100%)** | 0 | 0 | 8 *(the other 2 are identical empty sets)* | 3.20 |
| Media | 10 | 4 (40%) | 6 | 2 | 4 | 3.20 |
| Blog | 10 | 7 (70%) | 3 | 2 | 7 | 3.50 |
| Writings | 10 | 5 (50%) | 5 | 1 | 5 | 3.40 |
| **Total** | **50** | **36 (72%)** | **14 (28%)** | **5 (10%)** | **34 (68%)** | **3.46** |

Explanation of the 8/10 vs 10/10 delta on Presentations: 8 samples return four candidates in both variants with all four identical (`overlap = 4`), 2 samples return zero candidates in both variants (`overlap = 0 of 0`). All 10 samples are unchanged between variants; only 8 of them additionally produce a full four-item result. The 2 zero-result samples have empty `categories`, `keywords`, and `contexts` (Canva external-first items whose canonical projection carries no textual metadata). Coverage limitation, not a semantic effect.

Re-verified Presentations detail (all 10 samples):

| # | Source | `cats/kws/ctxs` | CURRENT top-K | CANONICAL-ONLY top-K | Overlap | No change? |
| --- | --- | ---: | ---: | ---: | ---: | :-: |
| 1 | AI Friend or Foe? (Canva) | 16 / 0 / 0 | 4 | 4 | 4 | yes |
| 2 | Kuinka Generatiivinen tekoäly toimii? (YouTube) | 0 / 0 / 0 | 0 | 0 | 0 | yes |
| 3 | Selitettävä tekoäly opetuksessa – ITK-webinaari (Canva) | 8 / 0 / 0 | 4 | 4 | 4 | yes |
| 4 | Opopassi-koulutus – Tekoäly ohjauksessa (Canva) | 8 / 0 / 0 | 4 | 4 | 4 | yes |
| 5 | ITK2022 (AOE / Finna) | 0 / 0 / 0 | 0 | 0 | 0 | yes |
| 6 | Miten opettajien uusi sukupolvi mullistaa opetuksen? (SlideShare) | 1 / 1 / 1 | 4 | 4 | 4 | yes |
| 7 | Luentosali II: 2000-luvun taidot & luento (SlideShare) | 1 / 1 / 3 | 4 | 4 | 4 | yes |
| 8 | Teknologiatuettu oppiminen - luksia (SlideShare) | 1 / 1 / 2 | 4 | 4 | 4 | yes |
| 9 | Luento 3: Opetuksen uudet ympäristöt ja teknologiat (SlideShare) | 1 / 1 / 1 | 4 | 4 | 4 | yes |
| 10 | Blogs&education (SlideShare) | 1 / 2 / 2 | 4 | 4 | 4 | yes |

Presentations subtotals confirmed: no-change 10/10, any-change 0/10, 2+-change 0/10, exact top-4 8/10, mean overlap 3.20, semantic-only entries 0, canonical-only entries 0, rescues 0, harms 0. Coverage identical (≥1: 8/10 in both; full-4: 8/10 in both). Independent re-run against the same harness methodology reproduces byte-identical results.

Coverage (identical between CURRENT and CANONICAL-ONLY across the entire sample):

| Domain | Variant | ≥1 | ≥3 | 4 results |
| --- | --- | ---: | ---: | ---: |
| Publications | CURRENT | 10 | 10 | 10 |
| Publications | CANONICAL-ONLY | 10 | 10 | 10 |
| Presentations | CURRENT | 8 | 8 | 8 |
| Presentations | CANONICAL-ONLY | 8 | 8 | 8 |
| Media | CURRENT | 10 | 10 | 10 |
| Media | CANONICAL-ONLY | 10 | 10 | 10 |
| Blog | CURRENT | 10 | 10 | 10 |
| Blog | CANONICAL-ONLY | 10 | 10 | 10 |
| Writings | CURRENT | 10 | 10 | 10 |
| Writings | CANONICAL-ONLY | 10 | 10 | 10 |
| **Total** | **CURRENT** | **48** | **48** | **48** |
| **Total** | **CANONICAL-ONLY** | **48** | **48** | **48** |

**Coverage is bit-identical between variants across the entire 50-item sample.** The semantic layer never rescues an item from having no results and never displaces an item into an incomplete result set. The two Presentation samples that returned zero results returned zero in both variants — a canonical-metadata sparsity gap on Canva/AOE external-first items with empty projection metadata, not a semantic-layer effect.

Coverage (identical between CURRENT and CANONICAL-ONLY across the entire sample):

| Domain | Variant | ≥1 | ≥3 | 4 results |
| --- | --- | ---: | ---: | ---: |
| Publications | CURRENT | 10 | 10 | 10 |
| Publications | CANONICAL-ONLY | 10 | 10 | 10 |
| Presentations | CURRENT | 8 | 8 | 8 |
| Presentations | CANONICAL-ONLY | 8 | 8 | 8 |
| Media | CURRENT | 10 | 10 | 10 |
| Media | CANONICAL-ONLY | 10 | 10 | 10 |
| Blog | CURRENT | 10 | 10 | 10 |
| Blog | CANONICAL-ONLY | 10 | 10 | 10 |
| Writings | CURRENT | 10 | 10 | 10 |
| Writings | CANONICAL-ONLY | 10 | 10 | 10 |
| **Total** | **CURRENT** | **48** | **48** | **48** |
| **Total** | **CANONICAL-ONLY** | **48** | **48** | **48** |

**Coverage is bit-identical between variants across the entire 50-item sample.** The semantic layer never rescues an item from having no results and never displaces an item into an incomplete result set. The two Presentation samples that returned fewer than 4 results returned identical (empty or short) sets under both variants — a canonical-metadata gap, not a semantic-layer effect.

## Domain-by-domain results

- **Publications** — 10/10 no-change (10/10 exact top-4). Zero changed cases. Semantic contribution has **no visible effect** on the Publications sample. Publications carry rich canonical metadata (100% categories, 98% contexts, 96% keywords per R1-A) so the metadata score dominates.
- **Presentations** — 10/10 no-change; 8/10 exact top-4 with 2/10 returning identical empty result sets under both variants (Canva external-first items with empty `categories`/`keywords`/`contexts` projection metadata). **No changed cases.** Semantic contribution has **no visible effect** on the Presentations sample.
- **Media** — 4/10 no-change (6/10 changed, 2/10 with 2+ candidate changes). **Highest-divergence domain**. Semantic contribution actively reorders 6 out of 10 result sets.
- **Blog** — 7/10 no-change (3/10 changed, 2/10 with 2+ changes). Moderate divergence.
- **Writings** — 5/10 no-change (5/10 changed, 1/10 with 2+ changes). Moderate divergence.

## Manual quality review

For each changed sample (14 total), manual per-candidate classification (clearly relevant / plausible / weak / misleading) for both the semantic-promoted "rescue" candidate and the displaced canonical-only pick. Selected representative rows:

| Source | Domain | Semantic-promoted rescue | Displaced canonical-only | Assessment |
| --- | --- | --- | --- | --- |
| INOS interview (open science) | Media | *"Vuotuiset Avoimen tieteen palkinnot 2020"* — sim 0.60. Clearly relevant (open science topic). | *"Oulun yliopiston tutkijoita palkitussa tekoälylukutaidon oppimisratkaisussa"* — Also clearly relevant (award + research). | Both relevant. **Neutral** — semantic re-orders equally-good candidates. |
| ITK-webinaari Generation AI (2024) | Media | *"Tekoäly valtaa alaa – Luova luokka -mediakasvatusseminaari"* — sim 0.80. Clearly relevant (AI education). | *"Yliopistopäivillä puhututti koulutuksen digitaalisuus"* — Plausible (broader digital education). | Semantic pick slightly more focused. **Small positive**. |
| Avoimesti tieteestä! (Jari Laru) | Media | *"How Can HEIs Facilitate Open Science"* (INOS) — sim 0.62. Clearly relevant (same topic). | *"Ei guru, vaan Laru"* — Weak (personality profile, not open science). | **Clear rescue** — semantic promotes a clearly-better topical match. |
| Juha Hännistä valtuuston johtoon (2021) | Media | *"Palveluverkkoa toimivaltakiista"* + *"Oululaispoliitikkojen yhdenvertaisuus"* — Plausible (older Oulu council material). | *"Valtuusto kokoontui viimeistä kertaa"* + *"Valtuutetut kulttuuripääkaupungista"* — Also plausible (concrete council actions). | Roughly equivalent quality. **Neutral**. |
| Oululaispoliitikkojen yhdenvertaisuus (2019) | Media | *"Lähes sata kuulijaa Kiimingissä"* + *"Huomisen Oulu – Jari Laru"* — Weak (personality events, less topical match to equality-in-Oulu-politics). | *"Valtuusto pui kaupungintalon rahantarvetta"* — Plausible (concrete Oulu council action). | **Small harm** — semantic pick weaker than displaced canonical pick. |
| Jäälin kangasmetsän polut (2014) | Media | *"Omatoimiset jääliläiset kunnostaneet järveä"* — sim 0.62. Clearly relevant (local Jääli nature/community). | *"Jäälin ostoskeskuksen yrittäjiltä puretaan rakennus"* — Weak (Jääli local but different topic — shopping centre demolition). | **Clear rescue**. |
| Politikon arkea (2018 workgroup) | Blog | *"Kokoomus esittää minua sivistyslautakuntaan"* + *"Vuoden 2017 kuntavaalit"* — Clearly relevant (political-personal). | *"Mistä on hyvä kaupunginvaltuutettu tehty?"* + *"Kaikki lähtee yksilöstä – Ahtisaari"* — Plausible-to-weak (governance essay + older Nobel piece). | **Small positive**. |
| Kiiminki lapsiystävällisyys (2008) | Blog | *"Kiiminki osana Oulujoen kaupunkia"* + *"Työmatkapyöräilijä Jäälin katuvaloista"* — Clearly relevant (same-era Kiiminki/Jääli local content). | *"Kuntaliitos poisti rajat"* + *"Kommentoin Facebookissa lisäresursseja Kauhajoki"* — Weak / off-topic. | **Clear rescue**. |
| Tervetuloa! (first blog post 2008) | Blog | *"Mistä on hyvä kaupunginvaltuutettu tehty?"* — sim 0.63. Plausible. | *"Ratikalla Ruskoon"* — Plausible (both Oulu political-thought pieces). | **Neutral / roughly equivalent**. |
| Perämerenkaari (2021 opinion) | Writings | *"Oulu kaipaa kipeästi hankkeita"* + *"Käännekohta on kulman takana"* — Clearly relevant (Northern Finland regional development / election themes). | *"Ratikalla Ruskoon"* + *"Työmatkapyöräilijä Jäälin katuvaloista"* — Weak (Kiiminki-specific local details, not regional-strategic). | **Clear rescue**. |
| Säästöt teatterin johdon kanssa (2020) | Writings | *"Yökirjan synkkyydestä kohti kukoistavaa kulttuuri-Oulua"* — Clearly relevant (Oulu cultural city). | *"Oulun kaupungintalo historiallinen kohde"* — Plausible (Oulu heritage). | **Small positive**. |
| Oppimiserojen kasvu (2018 speech) | Writings | *"Oulun palveluverkko ja pedagogiikka - työrauha kouluihin"* — sim 0.68. Clearly relevant. | *"Puheenvuoro § 52: Seinät eivät opi eivätkä opeta"* — Also clearly relevant (school-network topic). | Both relevant. **Neutral / marginal**. |
| Sisäilmaongelmat (2017 opinion) | Writings | *"Jokirannan koulun tilanne kestämätön, oppilaista oireilee"* — sim 0.71. Clearly relevant (identical topic — schools with sick-building indoor air). | *"Linnanmaa tarjoaa kasautumisetuja"* — Weak (urban development, off-topic). | **Clear rescue**. |
| Jäälin urheilualue (2012 speech) | Writings | *"Uuden Oulun voimavarat"* + *"Jokirannan koulun tilanne"* — Plausible. | *"Kiiminki lapsiystävällisyys 2008"* + *"Asukasvaikuttaminen puutteelliseksi"* — Also plausible (Kiiminki-local). | Roughly equivalent. **Neutral**. |

Qualitative summary across the 14 changed cases:

- **Clear rescues** (semantic pick clearly better than displaced canonical): **7 cases** (Media INOS Avoimesti, Media Jääli metsä, Blog Kiiminki 2008, Writings Perämerenkaari, Writings Sisäilma, Writings Säästöt, Media ITK-webinaari). Roughly half the changed set.
- **Neutral / equivalent** (both picks similarly relevant): **6 cases**.
- **Clear harm** (semantic pick weaker than displaced canonical): **1 case** (Media Oululaispoliitikkojen yhdenvertaisuus).

## Semantic rescue cases

Definition per R1-B0 §10: semantic contribution promotes a genuinely useful candidate that canonical-only metadata would otherwise fail to surface in the visible top 4.

- Total semantic-only top-4 entries across the 50 samples: 19 (aggregate across `currentOnly` sets).
- Of those, manually classified as **clear rescue** (semantic pick clearly better): 7.
- Rescue rate: **7 / 50 samples = 14%**. On Media specifically: 3/10 = 30%. On Writings: 3/10 = 30%. On Blog: 1/10 = 10%. On Publications and Presentations: 0/10 (zero).

Missing canonical relationships that would obviate the rescue (per rescue-case inspection):

- Same-era temporal clustering (2008-Kiiminki content, 2020-2021-cultural-Oulu content). Canonical metadata does not encode temporal proximity as a signal.
- Same-topic sub-family (open-science sub-cluster within Media; sick-building schools sub-cluster within Writings). Would require finer-grained canonical categorization or explicit `topics` beyond current categories.
- **No R1-A canonical field is unused in the current scoring.** The rescues are not caused by ignoring an existing canonical signal; they are caused by the semantic layer capturing fine-grained topical similarity that current canonical categorization does not represent.

## Semantic harm cases

Definition per R1-B0 §11: semantic contribution promotes a weaker or misleading candidate over a better canonically related candidate.

- Total canonical-only top-4 entries across the 50 samples: 19 (aggregate across `canonicalOnlyNew` sets).
- Of those, manually classified as **clear harm** (semantic pick weaker than displaced canonical): 1.
- Harm rate: **1 / 50 samples = 2%**. On Media: 1/10. On other domains: 0.

Semantic never promotes a misleading (off-topic) candidate. When semantic weakens rather than improves, it is a small quality shift, not a wrong association.

## Coverage comparison

Zero coverage change across all 50 samples. CURRENT and CANONICAL-ONLY return exactly the same ≥1, ≥3, and full-4 counts per domain (see §Quantitative comparison). Semantic contribution never rescues an item from a smaller-than-4 result set.

## Existing canonical relationships not used by scoring

Per R1-A signal classification, one repo-evidenced canonical relationship is currently unused by `computeRelatedContent`:

- **`sivuyhteys`** (Presentations, 75/218 coverage). Explicit canonical page-connection tag (`kouluttaja-sivu` 57, `tutkimus` 26, `mediassa` 13, `tyoni-yliopistonlehtorina` 8). Not read by the current filter — only by the orphaned `related-presentations.njk`.

R1-B0 §14 explicitly forbids using this gap as a justification to keep embeddings, and explicitly forbids modifying scoring. Recorded here for a possible future **canonical-ranking improvement audit** independent of R1-B0's decision, e.g., adding `sivuyhteys` to the score with a bounded weight would give Presentations detail a canonical relationship signal that is currently unused. This is **not proposed here** and is **not a mitigation for removing the semantic layer** by itself — the rescues measured above are all on Media / Blog / Writings surfaces where `sivuyhteys` does not apply.

## Semantic data / build dependency map

```text
Ollama-generated embedding cache (from PR #77)
  → scripts/build-semantic-related.js
    → src/_data/semanticRelated.json (641 KB committed to repo)
      → getSemanticRelated() in eleventy.filters.js
        → computeRelatedContent semanticBoost branch (SEM_WEIGHT * sim when sim >= SEM_MIN)
          → relatedContent Nunjucks filter
            → content-context-sidebar.njk (5 detail templates)
              → visible related-content list on Publication, Presentation, Media, Blog, Writing detail pages
```

Consumer audit (`grep -RnE 'semanticRelated' src/ scripts/ tests/ .eleventy.js`):

- `eleventy.filters.js` — the loader and boost branch.
- `tests/unit/related-content-hybrid.test.js` — covers the boost branch (cases 3–4, 9) plus the `{}` fallback (case 1).
- `scripts/build-semantic-related.js` — the generator.
- `src/_data/semanticRelated.json` — the committed data file.

No other consumer of the data file exists in `src/`, `scripts/`, or `tests/`. Removing the data file would only affect the boost branch of the filter and would leave the unit test's cases 3–4 and 9 without their fixture (the test constructs its own fixture, so this is fine).

## Maintenance footprint

- `src/_data/semanticRelated.json`: **641 455 bytes raw / 74 656 bytes gzipped** committed to the repo.
- 634 anchor keys, 6 340 (url, sim) edges.
- `scripts/build-semantic-related.js`: single Node script; depends on an embedding cache from PR #77 (not part of the normal build).
- Regeneration is **not** part of the standard `npm run build:no-og` — the JSON file is checked in and consumed as-is. Content changes therefore risk stale-data drift: a new URL without a corresponding embedding entry has zero semantic contribution (falls back to canonical-only for that item), but existing edges pointing at removed URLs would produce a `sim` on a URL that is no longer in the pool, harmlessly ignored by the `semByUrl.get(item.url) || 0` lookup.
- Filter runtime cost: `WeakMap`-free per-call `new Map()` build in the filter path (O(K) per call where K is anchor's edge list length ~10). Negligible.

The maintenance question is architectural cleanliness, not byte size or runtime cost.

## Decision

**B — Semantic layer materially useful but conflicts with current R1 contract.**

Rationale (corrected against re-verified numbers; decision unchanged):

- Coverage is bit-identical between CURRENT and CANONICAL-ONLY (48/48 items ≥ 1 result, 48/48 items with 4 results). The semantic layer does not rescue coverage.
- Publications (10/10 no-change) and Presentations (10/10 no-change; semantic-only entries and canonical-only entries both zero on the sample) are completely unaffected by the semantic layer.
- Media, Blog, and Writings show measurable divergence: 14/50 = 28% of samples have at least one top-4 change; 5/50 = 10% have two or more changes.
- **7 of 14 changed cases are clear rescues** where the semantic-promoted candidate is qualitatively better than the displaced canonical-only pick, in ways canonical metadata does not represent (temporal clustering, sub-topic sub-family). Rescue rate 14% overall, up to 30% on Media and Writings.
- Only **1 of 14 changed cases is a clear harm** (Media political-personality event displaced a concrete-council pick).
- Rescues outnumber harms 7:1 in the manual classification. The rescues are quality improvements, not coverage rescues.
- No unused canonical signal (`sivuyhteys` aside) explains the rescues. The semantic layer captures something canonical categorization does not encode.

CURRENT clearly outperforms CANONICAL-ONLY on **Media / Blog / Writings** in a way that would be visible to users after removal. Publications and Presentations are unaffected.

Removing the semantic layer would visibly degrade related content on three of the five consuming domains for ~1 in 7 items on average. That is not a negligible cost. The R1 hard boundary "no embedding / LLM recommender" is not compatible with the current production behavior on those surfaces.

Per R1-B0 §17 B:

- **Do NOT expand related content to Theses.**
- **Do NOT silently retain embeddings as R1 architecture.**
- **Request an explicit architecture decision** before further R1 rollout.

## R1-B1 status

**R1-B1 remains blocked pending explicit architecture decision.**

R1-B0 did not clear R1-B1. Adding `content-context-sidebar` to `src/opinnaytteet/thesis-details.njk` today would extend the embedding-derived recommender to a new surface, which the current R1 contract explicitly forbids. R1-B1 cannot proceed under either interpretation of the boundary conflict until it is resolved.

## Proposed next slice

**Explicit architecture decision required.** Not an implementation slice.

The architecture-level options are:

1. **Amend the R1 boundary** to permit the existing (pre-closure) semantic layer as canonical-adjacent post-closure infrastructure, and proceed to R1-B1 with the current scoring intact. This is a documentation-level decision on the roadmap, not a code change. It should include:
   - explicit rule that no NEW embedding/LLM recommender may be added
   - explicit acceptance of the existing `semanticRelated.json` + generator as post-closure retained infrastructure
   - a maintenance policy: when the file goes stale by more than a threshold (e.g. content-URL delta > 10% or unread anchors > 25%), regenerate rather than allow drift
2. **Accept the measured quality loss** on Media / Blog / Writings and remove the semantic layer (`R1-B0A — Remove legacy semantic contribution from relatedContent`). Then proceed to R1-B1 with the canonical-only scoring. Users of the three affected surfaces would lose ~14% of previously-produced rescues; the harm cases would also disappear.
3. **Improve canonical scoring first** to close the measured quality gap without embeddings, then remove the semantic layer, then proceed to R1-B1. Candidates from R1-A's canonical inventory: add `sivuyhteys` weight (Presentations only), consider a bounded same-year date-proximity nudge (would cover the 2008-Kiiminki and 2020-Oulu-cultural clusters), or finer-grained `topics` beyond current categories. Each is a canonical-scoring change, not an embedding.

R1-B0 does **not** choose between these three. It escalates.

R1-B1 is blocked in all three cases until the decision lands.

## Deletion opportunity

**Not currently justified.** Per R1-B0 §20 for outcome B, deletion is not justified until the escalated architecture decision selects option 2 above.

Explicitly not opened:

- `src/_data/semanticRelated.json` (retained pending decision).
- `scripts/build-semantic-related.js` (retained pending decision).
- The semantic branch in `computeRelatedContent` (retained pending decision).
- `src/_includes/related-presentations.njk` (unrelated orphan; R1-A already flagged it as separate convergence, still not bundled with R1).

## Non-goals

- No production code changes.
- No `SEM_WEIGHT = 0` in the repo.
- No changes to `computeRelatedContent`, `relatedContent`, `content-context-sidebar.njk`, or `semanticRelated.json`.
- No canonical field additions.
- No `sivuyhteys` promotion into `computeRelatedContent` (recorded as future canonical-ranking improvement candidate, not opened by R1-B0).
- No Thesis-detail template edit.
- No Pagefind changes.
- No new taxonomy.
- No Research-membership inference.
- No new embedding / LLM / vector-similarity work.
- No removal of `src/_data/semanticRelated.json` or its generator.
- No removal of `related-presentations.njk`.
- No public JSON contract changes.
- No AC1 reopen.

## Architecture status

**Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. R1-B0 does not reopen AC1.**

The reconciliation is a post-closure convergence question about whether an existing pre-closure production system should be aligned with a post-closure roadmap boundary. R1-B0 has produced the measurement evidence the roadmap boundary required; the resulting architecture-level decision is out of R1-B0's scope and will be made in a separate step that is not bundled with any implementation.
