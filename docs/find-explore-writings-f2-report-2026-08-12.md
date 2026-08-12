# F2 — Writings Find & Explore Pilot Report

Date: 2026-08-12

## 1. Scope

F2 piloted the Find & Explore model on the writings hub only:

- `/kirjoitukset/`
- `/en/writings/`
- shared Find & Explore UI/runtime used by those pages
- canonical-derived Pagefind metadata for writings documents

No canonical content contract changes were made. No F3 work was started.

## 2. F1 Baseline

F1 identified writings as the best first Find & Explore pilot because the FI and EN writings hubs carried substantial duplicated archive UI and runtime while already having a canonical `writingsPage.items` projection.

Baseline built-output snapshot:

| Page | HTML bytes | Elements | Search inputs | Selects | Buttons | Tables | Local JS bytes | Runtime JSON |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| FI `/kirjoitukset/` | 165441 | 1247 | 5 | 5 | 52 | 3 | 289116 | 427482 |
| EN `/en/writings/` | 207412 | 1575 | 8 | 1 | 43 | 8 | 289116 | 427482 |

## 3. User-Task Parity

The pilot preserves the agreed content scopes:

- canonical total remains `290`
- FI compatibility subset remains `126`
- FI counts remain `opinion=47`, `column=9`, `blogPost=70`
- EN visible scope remains `290`
- `/data/writings-page.json` remains the public canonical projection contract

## 4. Pagefind Metadata Added

Canonical writings detail documents now emit hidden Pagefind filters derived from canonical writings data:

- `FindExplore:writings`
- `Writings scope:fi`
- `Writings scope:en`
- `Writings content type:<type>`
- `Writings year:<year>`
- `Writings role:<role>`
- `Writings topic:<category>`

The metadata is derived in `src/src.11tydata.js`; it does not change the public projection shape.

## 5. Find & Explore Implementation

F2 adds a small Pagefind-backed shared UI:

- `src/_includes/find-explore-writings.njk`
- `src/css/find-explore.css`
- `src/js/find-explore.js`

The runtime imports Pagefind directly from the built `/pagefind/pagefind.js` index and applies writings-specific filters. It does not fetch `/data/writings-page.json`.

## 6. FI Behavior

FI `/kirjoitukset/` now keeps the curated JS-off opening view and moves interactive discovery to Find & Explore.

FI scope remains intentionally limited to compatibility writings:

- opinion
- column
- blogPost

The old table/search/pagination archive runtime was removed from the FI page.

## 7. EN Behavior

EN `/en/writings/` keeps the materials overview and curated opening sections, while Find & Explore searches the full canonical writings set.

EN visible scope remains `290`. The UI is English, but the Pagefind language filter targets `Suomi` because the canonical local writing documents are primarily Finnish-language documents. This preserves the agreed EN visibility rule without introducing a new source pipeline.

## 8. Progressive Enhancement

JS-off remains useful:

- hero and overview content are server-rendered
- curated opening groups remain server-rendered
- canonical links remain ordinary HTML links

JS-on adds Pagefind search and filters. The page no longer depends on client-side canonical JSON hydration to become useful.

## 9. Runtime Removed

Removed from FI/EN writings pages:

- old archive tables
- old table filters on writings pages
- `pe-list-render.js`
- `content-presets.js`
- `content-engine.js`
- runtime references to `/data/writings-page.json`
- client-side source mappers for the writings archive UI

## 10. Runtime Retained

Retained intentionally:

- global site UI scripts
- global Pagefind default UI assets used elsewhere
- `/data/writings-page.json` as public canonical projection
- curated SSR opening content
- page-level links to canonical writing detail pages

## 11. Public Contracts Retained

`/data/writings-page.json` remains available and unchanged as the canonical public projection contract:

- item count: `290`
- built JSON size: `427482` bytes

F2 removes runtime consumption from the hub pages; it does not remove the contract.

## 12. Before/After Metrics

Final built-output snapshot:

| Page | HTML bytes | Elements | Search inputs | Selects | Buttons | Tables | Local JS bytes | Runtime JSON |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| FI `/kirjoitukset/` | 120447 | 1136 | 3 | 2 | 35 | 0 | 103350 | 0 |
| EN `/en/writings/` | 145537 | 1397 | 3 | 2 | 35 | 0 | 103350 | 0 |

Delta from F1:

| Page | HTML bytes | Elements | Search inputs | Selects | Buttons | Tables | Local JS bytes | Runtime JSON |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| FI | -44994 (-27.2%) | -111 (-8.9%) | -2 (-40.0%) | -3 (-60.0%) | -17 (-32.7%) | -3 (-100%) | -185766 (-64.3%) | -427482 (-100%) |
| EN | -61875 (-29.8%) | -178 (-11.3%) | -5 (-62.5%) | +1 (+100.0%) | -8 (-18.6%) | -8 (-100%) | -185766 (-64.3%) | -427482 (-100%) |

The EN select count intentionally increases from one to two because Find & Explore exposes type and year filters instead of table-driven archive controls.

## 13. Pagefind Quality Results

Pagefind build:

- indexed pages: `1434`
- indexed words: `43047`
- filters: `8`

Writings Pagefind audit:

- FI samples: `3/3` found, `3/3` top 1, `3/3` top 3
- EN samples: `7/7` found, `7/7` top 1, `7/7` top 3
- topic samples: `4/4` found

## 14. Accessibility

Playwright accessibility/navigation/contrast suite passed:

- `31/31` passed

The first run hit an existing local port conflict on `4173`; the successful run used `PLAYWRIGHT_PORT=4174`.

## 15. SEO Verification

SEO dashboard passed after build:

- pages: `1442`
- missing descriptions: `0`
- missing OG images: `0`

Research.fi integrity remained green:

- archive publications: `56`
- metadata records: `56`
- research line: `56`
- curated themes: `55`

## 16. JS-Off Verification

Built-output audits confirm that both writings pages retain server-rendered opening content and ordinary links without the old JSON runtime.

The Find & Explore section is progressive enhancement: without JavaScript, the curated opening content remains the useful entry point.

## 17. Built-Output Inspection

Built-output audit passed:

- FI and EN writings pages contain no old archive tables
- FI and EN writings pages do not reference `/data/writings-page.json`
- FI and EN writings pages do not load `/js/table-filters.js`
- FI and EN writings pages load only the new writings Find & Explore runtime among page-specific scripts
- curated opening links remain present

## 18. Risks / Remaining Limitations

- F2 Find & Explore is query-driven; filter-only empty-query browsing is not introduced in this checkpoint.
- EN uses the Finnish Pagefind language filter to preserve the canonical source-document set. This is explicit and should be revisited only if EN-local detail documents are introduced.
- Pagefind metadata is now part of the built HTML discovery layer, but canonical JSON remains the authoritative data contract.

## 19. Architecture Decision

F2 validates the recommended hybrid model:

```text
canonical writingsPage.items
        ↓
public projection retained
        ↓
SSR curated opening
        ↓
Pagefind metadata on documents
        ↓
Find & Explore UI
```

This removes redundant writings archive runtime without weakening the canonical projection contract.

## 20. F2 Closure Status

F2 is closed as a green pilot.

Recommended next step after this commit: plan F3 separately, audit-first, using the same evidence gates. Do not start F3 inside the F2 branch.

F2 WRITINGS PILOT = GREEN
