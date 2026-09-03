# KNOWLEDGE-GRAPH-SSR-01 — Closure

**Status:** READY TO REVIEW
**Date:** 2026-09-03
**Baseline SHA:** `68dd48ef63cb65d5a43f6e0200e11986d6e61e54`
**Branch:** `refactor/knowledge-graph-ssr-01`
**Scope:** SSR the `/tutkimus/tietograafi/` PoC + delete the `/data/knowledge-graph.json` runtime transport (Option C from the audit)

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. R1 (`CLOSED / MAINTENANCE`) is untouched. Canonical taxonomy is untouched.

## 1. Branch / base / head

- Branch: `refactor/knowledge-graph-ssr-01`
- Base SHA: `68dd48ef63cb65d5a43f6e0200e11986d6e61e54` (== origin/main)
- Head SHA: (pre-commit)

## 2. Original runtime flow

```
canonical / Eleventy data
  → buildKnowledgeGraph(data)                     src/_data/knowledgeGraph.js
  → JSON.stringify()                              src/data/knowledge-graph.json.11ty.js
  → /data/knowledge-graph.json  (526,917 bytes on disk)
  → runtime fetch() on DOMContentLoaded           src/js/knowledge-graph-page.js:98
  → JS builds KPI text, node-kind cards, edge-type cards,
    coverage strip, filter <option>s, node list, edge list
  → 4 "Ladataan…" placeholders replaced at runtime
```

JS-off users saw four `Ladataan…` placeholders, four `-` KPI values, and empty filter/list containers.

## 3. Final SSR flow

```
canonical / Eleventy data
  → buildKnowledgeGraph(data)                     src/_data/knowledgeGraph.js  (UNCHANGED)
  → buildProjection(graph)                        src/fi/tietograafi.11tydata.js  (NEW)
  → Eleventy eleventyComputed → data.knowledgeGraphPage
  → Nunjucks renders every KPI, card, badge,
    filter <option>, node <article>, edge <article>  src/fi/tietograafi.njk
  → Client JS reads existing SSR DOM and toggles
    `hidden` on each item based on filters/search   src/js/knowledge-graph-page.js
```

No fetch. No inline JSON transport. No client-side HTML construction.

## 4. Endpoint consumer evidence (repo-wide before deletion)

Before deletion, `/data/knowledge-graph.json` had exactly one runtime consumer:

| Path:line | Role |
| --- | --- |
| `src/data/knowledge-graph.json.11ty.js:7,14` | Producer (`permalink` + render) |
| `src/js/knowledge-graph-page.js:98` | Runtime `fetch()` |
| `src/js/knowledge-graph-page.js:326` | Error-fallback link |
| `src/fi/tietograafi.njk:22` | "Avaa JSON" badge link |

Zero references in `tests/`, `scripts/`, `.eleventy.js`, other templates, or docs beyond the audit itself. Zero external contract.

Classification (from audit §13): **B — INTERNAL RUNTIME TRANSPORT.** Safe to delete.

## 5. Why endpoint deletion was safe

- Zero external consumers (grep across `src/`, `tests/`, `scripts/`, `.eleventy.js`, and doc corpus)
- Zero navigation links to the PoC page itself (page not surfaced through UI)
- Zero public contract or version-negotiation SLA
- The "Avaa JSON" affordance was developer-inspection convenience, not a documented API
- Post-SSR, the PoC page contains 100% of the analytical content directly in HTML — anyone wanting the raw view-model can inspect the `data-kg-node` / `data-kg-edge` attributes

## 6. Before / after measurements

| Metric | Before | After |
| --- | ---: | ---: |
| Runtime graph JSON requests | 1 | **0** |
| Runtime JSON bytes downloaded | 526,917 | **0** |
| `Ladataan…` placeholders in built HTML | 4 | **0** |
| `-` KPI placeholders in built HTML | 4 | **0** |
| `data-kg-*` targets awaiting hydration | 7 | **0** |
| `/data/knowledge-graph.json` producers | 1 | **0** |
| `/data/knowledge-graph.json` runtime consumers | 1 | **0** |
| Built `_site/data/knowledge-graph.json` file | 526,917 B | **absent** |
| Client-side deterministic HTML builders | 5 (`renderKindCards`, `renderEdgeCards`, `renderCoverage`, `populateSelect`, list renderers) | **0** |
| `src/js/knowledge-graph-page.js` LOC | 336 | **119** (−217, −64.6%) |
| Built `_site/js/knowledge-graph-page.js` bytes | ~10,700 | **4,402** |
| `src/fi/tietograafi.njk` LOC | 219 | 286 (+67) |
| `src/fi/tietograafi.11tydata.js` LOC | 0 | **267** (new) |
| Built `_site/tutkimus/tietograafi/index.html` raw bytes | 105,134 | **2,104,499** |
| Built HTML gzipped bytes | ~18,000 | **223,118** |
| Total wire bytes (HTML+JSON gzip) | ~88 KB | **~223 KB HTML gzip** |
| SSR node items in HTML | 0 (JS-hydrated) | **582** |
| SSR edge items in HTML | 0 (JS-hydrated) | **1200** |
| SSR node kinds represented | 0 | **10 / 10** |
| SSR edge types represented | 0 | **15 / 15** |

The wire cost went up (~135 KB extra gzip) because the full graph now ships as SSR HTML instead of runtime JSON. This is the deliberate trade-off: zero fetch, works without JS, no orphaned transport. The PoC page is not user-facing navigation (per its own copy at `src/fi/tietograafi.njk:206-208`).

## 7. Deleted code

**File deleted:**
- `src/data/knowledge-graph.json.11ty.js` (26 LOC producer)

**Client JS removed** (from `src/js/knowledge-graph-page.js`):
- `loadGraph()` fetch helper
- `renderKindCards()` (19 LOC card grid builder)
- `renderEdgeCards()` (19 LOC card grid builder)
- `renderCoverage()` (13 LOC coverage strip builder)
- `populateSelect()` (12 LOC filter dropdown builder)
- `escHtml()` (7 LOC — Nunjucks auto-escapes at build)
- `buildNodeMeta()` (9 LOC — moved to build-time projection)
- `compactDate()` (14 LOC — replaced by build-time `formatTimestamp`)
- `summarize()` (5 LOC — moved to build-time projection)
- `setText()` (5 LOC — no longer needed)
- Setup-time KPI text writes (`setText("[data-kg-summary='nodes']", …)` etc.)
- Runtime `nodeById` / `degrees` Map construction (moved to build-time)
- Runtime node/edge list rendering (`nodeHost.innerHTML = …` × 2, ~40 LOC)
- Runtime graph fetch + error fallback link ("Datan lataus epäonnistui. Tarkista JSON-endpoint.")
- Constants `MAX_NODE_ITEMS`, `MAX_EDGE_ITEMS` (all items now SSR-rendered)

**Template removed** (from `src/fi/tietograafi.njk`):
- `data-kg-summary="nodes"` / `data-kg-summary="edges"` / `data-kg-summary="generated"` badges with `Ladataan…` text
- "Avaa JSON" `<a href="/data/knowledge-graph.json">` link
- `data-kg-kpi="…"` placeholder `-` values
- `data-kg-coverage` empty container
- `data-kg-node-kinds` empty container
- `data-kg-edge-types` empty container
- `data-kg-status="Ladataan dataa…"` initial state text
- Empty `data-kg-node-list` / `data-kg-edge-list` containers

## 8. Graph semantic parity

`src/_data/knowledgeGraph.js` was **NOT modified**. The graph identity is unchanged:

| Metric | Value |
| --- | ---: |
| Node count | 582 (matches audit baseline) |
| Edge count | 1200 (matches audit baseline) |
| Node kinds | 10 (course, person, presentation, presentationContext, project, publication, researchLine, theme, thesis, topic) |
| Edge types | 15 (advised, authorOf, belongsToResearchLine, coversTheme, hasTheme, hasTopic, linkedPresentation, linkedPresentationContext, linkedPublication, linkedThesis, participatesIn, presented, presentedIn, supportsResearchLine, usedInCourse) |

Verified by regex-counting `data-kg-node ` (582) and `data-kg-edge ` (1200) attribute matches in the built `_site/tutkimus/tietograafi/index.html`.

No new node kinds. No new edge types. No new curated data. No new mapping tables. `PROJECT_LINE_MAP`, `presentationContexts`, and `curated/projectLinks.json` are all unchanged.

## 9. JS-off result

Verified against built `_site/tutkimus/tietograafi/index.html`:

| Element | JS-off state |
| --- | --- |
| Hero KPI badges (nodes/edges/generated) | Real values (582 solmua, 1 200 suhdetta, Päivitetty …) |
| Yhteenveto section 4 KPI cards | Real values (582, 1 200, 10, 15) |
| Coverage badge strip | 10 badges with counts |
| Solmutyypit section | 10 SSR cards sorted by count |
| Suhdetyypit section | 15 SSR cards sorted by count |
| Selain filter dropdowns | Populated with 10/15 options each |
| Kytkeytyneimmät solmut list | 582 SSR `<article>` items sorted by degree DESC |
| Esimerkkisuhteet list | 1200 SSR `<article>` items sorted by (type, from, to) |
| Status text | "Näytetään kaikki solmut · kaikki suhteet" |
| `Ladataan…` placeholders | **0** |

The page provides complete analytical content without JavaScript.

## 10. Interaction parity (JS-on)

The interactive filter surface is preserved with the same 3 controls:
- `#kg-node-kind-filter` — filters node items by `data-kg-kind`; also constrains edges to those touching the selected kind
- `#kg-edge-type-filter` — filters edges by `data-kg-edge-type`
- `#kg-search-filter` — case-insensitive substring match against `data-kg-haystack` (build-time-precomputed lowercased haystack)

Behavior changes vs. legacy:
- Items are shown/hidden via the `hidden` attribute rather than being rebuilt via `innerHTML`
- No pagination cap — all matching nodes/edges become visible (legacy: MAX_NODE_ITEMS=24 / MAX_EDGE_ITEMS=32 shown; overflow silently dropped)
- Empty-state placeholders (`[data-kg-node-empty]`, `[data-kg-edge-empty]`) appear when no items match
- Status line updates the same way ("Rajaus: {kind} · {type}")

## 11. Tests

New Playwright spec at `tests/knowledge-graph-ssr-01.spec.js` covering 11 guards:
1. JS-off SSR completeness (KPI, cards, coverage, node/edge items)
2. No `Ladataan…` placeholders
3. No "Avaa JSON" affordance
4. Zero runtime `/data/knowledge-graph.json` requests
5. `/data/knowledge-graph.json` returns 404 (endpoint deleted)
6. Built JS contains no fetch() call or endpoint reference
7. Node-kind filter narrows visible SSR items
8. Edge-type filter narrows visible SSR items
9. Search input narrows both lists
10. Empty-state placeholder appears on nonsense query
11. All 10 canonical node kinds + 15 canonical edge types represented in SSR

Unit test suite results (`npm run test:unit`):
- Full-suite failures on branch: 2 (pageCountEn 319 vs 318 baseline drift + og-cache prune race)
- Full-suite failures on `git stash`ed baseline: 2 (identical failures)
- **Zero new failures introduced by this workstream.**

Adjacent verification runs (all pass):
- `check:i18n-seo` — OK (1458 HTML files)
- `check:jsonld` — 63 baseline issues (article-headline-length), no new errors
- `node scripts/run-pagefind.js` — 1458 HTML documents indexed; presentation invariants preserved
- Full Eleventy build — 1470 files written, no errors

## 12. R1 non-impact

- `src/_includes/content-context-sidebar.njk` — untouched
- `src/_utils/relatedContent*.js` — untouched
- `computeRelatedContent` semantic scoring — untouched
- No R1 surface consumes any knowledge-graph edge type in this workstream
- `linkedPublication`, `linkedThesis`, `linkedPresentation`, `linkedPresentationContext`, `supportsResearchLine` (curated companion edges) remain graph-only

R1 remains `CLOSED / MAINTENANCE`.

## 13. Canonical authority non-impact

- Canonical Content v1 unchanged
- No new frontmatter fields
- No new taxonomy (categories, keywords, contexts, tags all untouched)
- No new curated data files
- No changes to `researchProgram`, `researchProjects`, `presentationContexts`, `curated/projectLinks.json`, or `PROJECT_LINE_MAP`
- No changes to any canonical scoring, matching, or classification code path

The knowledge graph remains a **derived build-time projection**, never authoritative for any content surface.

## 14. AC1 status

**`Architecture Closure 1.0 = CLOSED / GREEN / MAIN` — unchanged.**

- No parallel knowledge-graph content model introduced (audit boundary respected)
- No graph edge became an R1 input in this workstream
- No new taxonomy or semantic layer
- No embeddings, LLM inference, similarity scoring, or cross-page recommendation model

## 15. Deferred provenance work

The audit identified three ownership classes in the current graph (§5 of audit):

| Class | Edge types | Count | Handled? |
| --- | --- | ---: | :---: |
| Canonical (from frontmatter or deterministic derivation) | 11 | 1123 | Kept as-is |
| Technical URL/title matching | 1 (`presentedIn`) | 19 | Kept as-is |
| Curated companion data | 5 (`linkedPublication`, `linkedThesis`, `linkedPresentation`, `linkedPresentationContext`, `supportsResearchLine`) | 41 | Kept as-is |

**Explicitly deferred:** no `provenance`, `authority`, `confidence`, or `edgeSource` fields were added. This workstream ships SSR + endpoint deletion only. Provenance modelling is a separate potential follow-up that would need its own scope discussion.

## 16. Files changed

| File | Change |
| --- | --- |
| `src/data/knowledge-graph.json.11ty.js` | **Deleted** (26 LOC) |
| `src/fi/tietograafi.11tydata.js` | **New** (267 LOC) — projection adapter |
| `src/fi/tietograafi.njk` | Modified (219 → 286 LOC) — SSR-rendered lists, cards, coverage, filter options, KPI numbers, generatedAt |
| `src/js/knowledge-graph-page.js` | Modified (336 → 119 LOC) — pure filter/search over SSR DOM |
| `tests/knowledge-graph-ssr-01.spec.js` | **New** — 11-guard Playwright regression |
| `docs/knowledge-graph-ssr-01-closure-2026-09-03.md` | **New** — this document |

**Total: 4 modified/new + 1 deleted + 1 new test + 1 new doc = 7 file operations.**

## Architecture summary

Final data flow:

```
canonical / curated data
  → buildKnowledgeGraph()                          [unchanged]
  → build-time projection in tietograafi.11tydata.js
  → Nunjucks SSR graph surface                     [tietograafi.njk]
  → JS filter/search over SSR DOM                  [knowledge-graph-page.js]
```

No runtime graph JSON transport remains anywhere in the codebase.

- `KNOWLEDGE-GRAPH-SSR-01 = READY TO REVIEW`
- `Architecture Closure 1.0 = CLOSED / GREEN / MAIN` (unaffected)
- `R1 = CLOSED / MAINTENANCE` (unaffected)
- `VALTUUSTOTYO-SSR-01 = CLOSED / GREEN / MAIN / DEPLOYED` (unaffected)
- `POLITIIKKA-SSR-01 = CLOSED / GREEN / MAIN` (unaffected)
- `KYNÄSTÄ-HUB-02 = CLOSED / GREEN / MAIN` (unaffected)
- `THESIS-SEARCH-UX-01 = CLOSED / GREEN / MAIN / DEPLOYED` (unaffected)
