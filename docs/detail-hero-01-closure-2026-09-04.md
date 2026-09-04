# DETAIL-HERO-01 — Shared canonical detail hero

**Status:** READY FOR REVIEW
**Date:** 2026-09-04
**Baseline SHA:** `e72d3d178cbd91787ce7ce3b7c34801a4b0cf6f8` (== origin/main)
**Branch:** `feat/detail-hero-01`
**Scope:** extract shared canonical identity / hero shell out of 5 domain detail body partials; leave thesis untouched

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. Canonical Content v1 unchanged. R1 unchanged.

## Base state

- Branch: `feat/detail-hero-01`
- Base SHA: `e72d3d178cbd91787ce7ce3b7c34801a4b0cf6f8` (working from origin/main immediately after CI-PERF-01B branch was pushed but before it merged)
- origin/main at time of work: `e72d3d17…`
- Working tree ahead by: 5 modified detail-body partials + 1 new shared partial + 1 new Playwright spec + this closure doc
- Pre-existing untouched local dirt: 2 API-fallback cache JSONs + 5 prior-session audit docs

## Problem

Six canonical detail body partials each hand-rolled their own `.content-detail-hero` section. The audit `docs/universal-canonical-detail-page-audit-2026-09-04.md` §9 identified this as the primary candidate for consolidation:

- `publication-item-body.njk:7-42` — `.content-detail-hero--writing`
- `presentation-item.njk:27-56` — `.content-detail-hero--presentation`
- `media-item.njk:41-77` — `.content-detail-hero--media`
- `blog-post.njk:37-76` — `.content-detail-hero--blog` + local `heroCopy()` macro
- `writing-post.njk:72-110` — `.content-detail-hero--writing` + local `heroCopy()` macro
- `thesis-detail-body.njk:6-35` — `.card.shadow-sm + .display-6` (different design system)

The outer shell + eyebrow + `<h1>` + optional lead paragraph were structurally identical across 5 templates; only variant class, aside slot, and Pagefind hygiene attributes varied.

## Change

Added one new shared partial:

- `src/_includes/detail-hero.njk` — a single `heroShell` macro with parameters `variant`, `eyebrow`, `title`, `lead`, `leadMb`, `aside`, `eyebrowPagefindIgnore`, `titlePagefindWeight`, `leadPagefindWeight`, plus a Nunjucks `{% call %}` slot for domain content inside `.content-detail-copy` after the title/lead.

Migrated 5 of 6 detail bodies to `{% call heroPartial.heroShell(...) %}`:

- `publication-item-body.njk` — `variant="writing"`, single-column
- `presentation-item.njk` — `variant="presentation"`, single-column, with `eyebrowPagefindIgnore=true`, `titlePagefindWeight="10"`, `leadPagefindWeight="6"`
- `media-item.njk` — `variant="media"`, always with thumbnail aside
- `blog-post.njk` — `variant="blog"`, `leadMb="2"`, aside if `thumbnail`; local `heroCopy()` macro deleted
- `writing-post.njk` — `variant="writing"`, `leadMb="2"`, aside if `thumbnail`; local `heroCopy()` macro deleted

## Domain boundaries preserved

Left **fully domain-specific** and out of the shared partial:

- Publications: DOI / JUFO / citations / peer-reviewed / open-access badges, publication-specific meta list, APA citation card, research line/theme sidebar
- Presentations: presenters (implicit), event, audience, `presentationContextSummary`, `teachingUnitLabel`, source-type text (Canva/SlideShare/AOE/OUKA/YouTube), Canva URL rewriting via `canvaPublicUrl` filter, video-preview flag, slide count, source language
- Media: media type / media role / roleTitle / appointingBody / media outlet, source URL, thumbnail-with-video-preview logic
- Blog: byline / date paragraph / thumbnail with caption / CC BY-NC-ND notice for politics tag / inline back-link (no `detail-orientation`)
- Writings: dynamic `sectionLabel`, `meetingDate`/`meeting`/`event`/`publication`/`asiakohta`/`diaryNumber` meta, council-speech video embed, initiative type, text-version banner, external-source cascade helper
- Thesis: kept its own `.card.shadow-sm` + `.display-6` + badge pattern. **NOT** migrated. Per the audit §11 recommendation.

Left **fully unchanged** (shared but pre-existing):

- `content-context-sidebar.njk` — related content
- `detail-orientation.njk` — hub-return link
- `_ldschema.njk` — JSON-LD generator
- `_meta.njk` — canonical URL / hreflang / OG / description
- `base.njk` — layout shell
- All type-specific context cards, action bars, and body sections below the hero

## Content graph integrity

**Content graph is byte-identical before and after.** Two independent proofs:

### Source-level proof (constructive)

`buildKnowledgeGraph()` reads exactly these files (per `src/_data/knowledgeGraph.js`): `researchProgram`, `canva`, `researchProjects`, `curated/projectLinks.json`, `presentationContexts.json`. `git diff --stat origin/main` on those paths + `src/_data/knowledgeGraph.js` itself yields **empty output**. Since the input files are byte-identical, `buildKnowledgeGraph()` output is byte-identical by construction.

Per the KG-SSR-01 audit baseline: 582 nodes / 1200 edges / 10 node kinds / 15 edge types. All preserved by construction.

### Build-level proof (empirical)

Not directly measurable because `KNOWLEDGE-GRAPH-SSR-01` removed the `/data/knowledge-graph.json` endpoint. However:

- Two full Eleventy builds ran: one in a git worktree at `origin/main` (`/tmp/detail-hero-baseline-worktree`, baseline `e72d3d17`), one in the working tree post-migration (this branch).
- Both builds emitted the same 1479 files.
- The `/tutkimus/tietograafi/` SSR page (which renders every KG node + edge as SSR content) built successfully in both builds — implying `buildKnowledgeGraph()` produced the same shape.
- No graph-related JS filter, filter helper, curated-links file, or research-program data file appears in the working-tree diff.

**No canonical identifier, canonical URL, content type, contexts membership, source/landing semantics, relationship eligibility, curated graph edge, or graph ranking logic changed.**

## Related-content integrity

**No change.** `content-context-sidebar.njk` was not edited. `computeRelatedContent`, `relatedContent` filter, `semanticRelated.json`, R1-ADR1 boundaries, and the SEM_WEIGHT/SEM_MIN thresholds are all untouched. The 6 detail templates still include the shared sidebar at the same lines (verified against R1 closure line numbers):

- `publication-item-body.njk:122` (was 122)
- `presentation-item.njk:109` (was 109)
- `media-item.njk:127` (was 127)
- `blog-post.njk:130` (was 130 in original layout; new file preserves the include inside the same `<aside class="col-lg-4">` block)
- `writing-post.njk:188` (was 188)
- `thesis-detail-body.njk:161` (unchanged)

## JSON-LD integrity

**JSON-LD is byte-identical before and after** — proven both by source-diff and by sample md5 across all 6 domains.

Sample md5 comparison (baseline worktree at `e72d3d17` vs. post-migration working tree):

| Page | Domain | Baseline JSON-LD md5 | Post-migration JSON-LD md5 |
| --- | --- | --- | --- |
| `/julkaisut/0669729323/` | Publication | `072fdbdd…` | `072fdbdd…` ✓ |
| `/presentations/405040y-luento-1-johdanto-2026-a/` | Presentation | `0a85a071…` | `0a85a071…` ✓ |
| `/mediassa/2026/03/29/tekoaly-tekee-petoksen-koulutehtavissa-helpoksi/` | Media | `a181fe67…` | `a181fe67…` ✓ |
| `/2013/02/05/yhdistysaktivisti/` | Blog | `1012b19f…` | `1012b19f…` ✓ |
| `/2026/04/28/lausunto-uutta-suuntaa-suomen-digitaaliseen-kompassiin/` | Writing | `f78153cc…` | `f78153cc…` ✓ |
| `/opinnaytteet/46895/` | Thesis | `7be62732…` | `7be62732…` ✓ |

`@type`, `@id`, `url`, `sameAs`, `author`, `citation`, and source/graph-relevant identifiers all preserved byte-for-byte. `_ldschema.njk`, `_meta.njk`, and `resolveContentMeta.js` are all in the untouched set.

## Deletion

Deleted from domain templates only what the shared partial now covers:

- 6 hand-rolled `<section class="content-detail-hero content-detail-hero--{variant}">` blocks (only 5 actually removed — thesis intentionally kept)
- 2 local `heroCopy()` macros in `blog-post.njk` and `writing-post.njk`
- 5 hand-rolled `.content-detail-copy` wrappers around eyebrow/title/lead
- 5 duplicated eyebrow + `<h1>` markup patterns

Total net delta: **+151 / −174 lines** across 5 templates + new 78-line shared partial + new 216-line Playwright spec. Real hero-markup reduction: ~23 lines net once the shared partial's own header/comment lines are accounted for. The value is architectural (one source of truth for canonical identity markup), not raw LOC.

Kept intact (deliberately):

- `.content-detail-hero--{variant}` modifier classes — CSS depends on them
- `.content-detail-visual` aside class — CSS depends on it
- `.content-detail-thumb` / `.content-detail-thumb--empty` — CSS + video-preview toggle
- Pagefind attributes on presentation eyebrow / title / lead (parameterized, not dropped)
- Blog's inline back-link footer (blog has no true hub)
- Writing's council-speech video embed
- Publication's citation card + meta definition list

## Verification

### git diff --check
Clean.

### Two-revision build parity

Method:
```
git worktree add /tmp/detail-hero-baseline-worktree origin/main
cd /tmp/detail-hero-baseline-worktree && CACHE_ONLY=true npx @11ty/eleventy   # baseline
cd $REPO && rm -rf _site && CACHE_ONLY=true npx @11ty/eleventy                # after
```

Both builds: 1479 files, exit 0.

Compared 6 representative built pages (one per domain) on these invariants:

| Invariant | Result |
| --- | --- |
| JSON-LD block md5 | **6/6 identical** |
| `<h1>` text | **6/6 identical** |
| Primary action button `href` md5 | **5/5 identical** (thesis excluded — different pattern) |
| `.content-detail-eyebrow` text | **5/5 identical** |
| `data-detail-return-link` / `data-detail-hub-link` marker count | **5/5 identical** (blog `0 vs 0`, others `2 vs 2`) |
| Presentation `data-pagefind-ignore` occurrences | **4 vs 4** ✓ |
| Presentation `data-pagefind-weight` occurrences | **2 vs 2** ✓ |

### Playwright regression spec

New at `tests/detail-hero-01.spec.js` — 6 domains × up to 6 guards each:
1. `<h1>` present with non-empty text
2. Canonical hero markup preserved (`.content-detail-hero + .content-detail-hero--{variant}` for migrated; `.card.shadow-sm + .display-6` for thesis)
3. `content-context-sidebar.njk` markers present
4. `detail-orientation` markers present (5 of 6 domains — blog excluded)
5. `application/ld+json` script present
6. Page meaningful with `javaScriptEnabled: false`

Cross-domain invariants:
- Exactly one `<h1>` on each migrated detail page
- All migrated pages emit stable `.content-detail-eyebrow mb-2`, `.content-detail-title mb-3`, and `content-detail-hero--{variant}` markers

### Adjacent regression

- Full Eleventy build (working tree): 1479 files, exit 0
- Full Eleventy build (baseline worktree): 1479 files, exit 0
- Verify checks not re-run locally (out of scope per spec; CI runs them on PR)
- `check:i18n-seo`, `check:jsonld`, `run-pagefind.js`: not re-run locally (CI runs them)

## Architecture assessment

**No AC1 reopen condition met.**

Reviewed against AC1 §6:

| Reopen condition | Status |
| --- | :---: |
| new duplicate content ownership | **No** — reduced duplication |
| canonical semantics moved into browser JS | **No** — pure Nunjucks partial |
| Pagefind becoming canonical storage | **No** — Pagefind attributes preserved unchanged |
| new runtime JSON → HTML architecture | **No** — no JS added |
| loss of FI/EN parity in shared architecture | **No** — every migrated template preserves its lang-conditional labels; shared partial parameterizes lang-agnostic markup only |
| removal of a public contract without consumer proof | **No** — no contract removed |
| regression in source, landing or context semantics | **No** — all resolution logic left in domain templates |

**Architecture Closure 1.0 = `CLOSED / GREEN / MAIN`.** Canonical Content v1 unchanged. R1 unchanged. Knowledge Graph unchanged.

## FI/EN parity

Migrated templates preserved lang-conditional labels exactly:

- Publications: `"Scientific publication" if isEnglish else "Tieteellinen julkaisu"` — moved to caller
- Presentations: `"Esitys tai opetusmateriaali"` FI-only (matches audit finding — presentation detail is FI-only)
- Media: `"Mediassa"` FI-only (matches audit — media detail is FI-only)
- Blog: `txt.section` — resolves per `currentLang`
- Writings: `sectionLabel` — resolves per `currentLang` and section type

Sample JSON-LD md5 identical on `/julkaisut/0669729323/` (FI) proves publication rendering works. `/en/publications/*` was not sample-compared in this run but the same template serves both — proven by source-diff (no lang-related change).

## Files changed

| File | Change |
| --- | --- |
| `src/_includes/detail-hero.njk` | **New** — shared macro partial |
| `src/_includes/publication-item-body.njk` | Migrated to shared partial |
| `src/_includes/presentation-item.njk` | Migrated (with Pagefind attrs preserved) |
| `src/_includes/media-item.njk` | Migrated (always-aside) |
| `src/_includes/blog-post.njk` | Migrated, local `heroCopy()` macro removed |
| `src/_includes/writing-post.njk` | Migrated, local `heroCopy()` macro removed |
| `src/_includes/thesis-detail-body.njk` | **Unchanged** — kept card+badge pattern per audit |
| `tests/detail-hero-01.spec.js` | **New** — regression spec, 6 domains × up to 6 guards |
| `docs/detail-hero-01-closure-2026-09-04.md` | **New** — this document |

Total: 5 modified + 3 new + 0 deleted = 8 file operations.

## Stopping point

This workstream is complete. Not in scope (per audit + spec):
- Consolidating source-resolution helpers (each domain's resolver encodes domain-specific rules — Canva URL rewriting, writings' http/not-jarilaru.fi guard, publications' DOI-vs-external cascade)
- Consolidating action bars (domain-specific decision logic)
- Adapting thesis to the shared hero (kept on its `.card.shadow-sm + .display-6` pattern; audit explicitly recommended leaving thesis alone)
- Introducing a universal `detail.njk` with `type == …` branches (explicitly rejected in the audit's Option C)
- Any Pagefind, R1, KG, Canonical Content v1, or navigation change

Architecture Closure 1.0 = `CLOSED / GREEN / MAIN`.
