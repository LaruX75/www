# O1 Orientation — implementation

Date: 2026-08-20

Status: CLOSED / GREEN / BRANCH

Branch: `feat/o1-orientation`

## Scope

O1 ships the smallest coherent orientation layer for mature canonical detail pages:

- publications
- theses
- writings

This implementation does not start PF5, T1, presentations, or media work. Canonical Content v1 remains authoritative, and no content-model, taxonomy, or Research semantics were changed.

## Audit summary

| Domain | Breadcrumb | Hub return | Discovery return | Prev/next | Related | SSR/client | Issues before O1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Publications detail | Yes | Yes, ad hoc | No | No | Yes | SSR + client | no shared primitive; no explicit return from active Find & Explore |
| Theses detail | Yes | No clear detail-level control | No | No | No dedicated detail block | SSR + client | weakest orientation surface among mature domains |
| Writings detail | Yes | Yes, mixed ad hoc routes | No explicit carryover | No | Yes | SSR + client | footer back control depended on `history.back()` enhancement |
| Presentations detail | Yes | Yes | Not carried | No | Yes | SSR + client | audited only; separate cleanup still warranted |
| Research/context landings | Yes | N/A | current contextual Find & Explore URL state exists | N/A | N/A | SSR + client | audited only; not part of O1 implementation |

## Implemented primitives

### 1. Shared SSR orientation include

Added `src/_includes/detail-orientation.njk`.

It provides:

- SSR canonical hub return
- optional client-revealed `Back to results` / `Takaisin hakutuloksiin`
- semantic `nav` landmark with localized label

Applied to:

- `src/_includes/publication-item-body.njk`
- `src/_includes/thesis-detail-body.njk`
- `src/_includes/writing-post.njk`

### 2. Canonical hub return

Every changed mature detail page now has an explicit SSR hub route that works without JavaScript:

- publications → canonical publications archive / anchor target
- theses → `/opinnaytteet/` or `/en/theses/`
- writings → existing authoritative archive route from `sidebarContext`

### 3. Discovery return from explicit URL state only

`src/js/find-explore.js` now decorates local detail links in active Find & Explore result surfaces with:

- `?returnTo=<current local discovery URL>`

This is limited to local canonical detail links on:

- publications archive rows / cards
- thesis archive rows
- writings result titles

No full result-set serialization, browser storage, or history hijacking was introduced.

`src/js/site-ui.js` now:

- validates `returnTo` as same-origin
- restricts it to allowed hub prefixes
- suppresses duplicate return links when `returnTo` equals the canonical hub fallback
- hides invalid or missing discovery context safely

## Explicitly deferred

- canonical prev/next
- discovery-result adjacency
- new related-content heuristics
- presentation-specific O1 cleanup
- media-specific O1 cleanup

O1 closes successfully without inventing new adjacency or recommendation logic.

## FI / EN parity

Implemented and verified:

- FI publications detail from FI discovery state
- EN thesis detail from EN discovery state
- FI writings detail from FI discovery state
- no-JS canonical thesis hub return

Known existing architecture boundary retained:

- EN publications archive still resolves to canonical FI publication detail pages

## Accessibility and no-JS

- breadcrumbs remain SSR with `aria-current="page"`
- canonical hub return works without JavaScript
- `Back to results` appears only when valid explicit context exists
- invalid `returnTo` falls back silently to canonical hub return
- writings no longer depend on `history.back()` for the visible return path

## SEO / schema impact

- canonical URLs unchanged
- hreflang unchanged
- existing breadcrumb JSON-LD architecture preserved
- no discovery-state URL became canonical
- no new schema type or taxonomy added

## Deletions / simplification

- removed the visible writings footer back control that relied on `data-history-back`
- removed the global `history.back()` enhancer from `src/js/site-ui.js`
- converged publication and writing detail return controls onto one shared include

## Metrics

- shared orientation includes: `0 -> 1`
- mature detail templates converged onto the shared include: `3`
- JS-dependent orientation actions: `1 -> 0`
- explicit discovery-return mechanism: `0 -> 1`

## Verification

Green on this branch:

- `npm run build:no-og`
- `npm run test:unit` → `574/574`
- `npx playwright test --workers=1 tests/o1-orientation.spec.js` → `4/4`
- `npx playwright test --workers=1 tests/f3b-publications-find-explore.spec.js tests/f3a-theses-find-explore.spec.js tests/f2-find-explore-smoke.spec.js` → `9/9`

Retained unrelated baseline failure:

- `tests/navigation.spec.js`

This failure reproduces on:

- `feat/o1-orientation`
- clean `origin/main` at `2724669d6f22dc41247b017fdc62001c6af6673f`

The failing case is the existing home-page search dialog focus-trap flow, not any changed O1 detail-page code.

## Boundaries preserved

- Canonical Content v1 unchanged
- PF5 NOT STARTED
- T1 NOT STARTED
- presentations not force-fit into O1
- media not force-fit into O1
