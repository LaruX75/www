# PF5-A2 Result-List Semantics Closure

Date: 2026-08-25
PR: `#151` — `fix(a11y): use semantic lists for global search results`
Implementation HEAD: `8f6da35ff709d3492cdd5f29b6a2765ab6e7d785`
Merge commit: `d99bfa12895c7ae11fc87780b40145f87b83990f`
Main at merge verification: `d99bfa12895c7ae11fc87780b40145f87b83990f`

## Scope

PF5-A2 closed the shared global-search result-owner semantics on:

- navbar dialog on `/`
- full search page on `/haku/`
- full search page on `/en/search/`

The implementation changed the shared result owner from a non-semantic container to a semantic list while keeping the shared card presenter unchanged.

## Implementation

Changed files in PR `#151`:

- `src/js/global-search-modular-ui.js`
- `src/css/modules/_components.css`
- `tests/pf5-a2-result-list-semantics.spec.js`

Key behavior:

- `[data-search-modular-results]` now renders as `UL`
- direct shared result cards remain `LI.find-explore-result`
- obsolete orphan-`LI` CSS workaround stayed removed
- `SearchResultPresenter` was not changed
- no ranking, Pagefind hygiene, seed-token, media, or canonical work was mixed into this PR

## Build Dependency

The earlier local `build:no-og` blocker was resolved by PR `#152` (`fix(build): memoize heavy Eleventy data loaders`).

After PR `#152`, PF5-A2 local verification completed successfully:

- `npm run test:unit` PASS
- focused semantic Playwright spec PASS (`3/3`)
- `npm run build:no-og` PASS

## CI

PR `#151` was merged only after CI was green:

- `Staging checks` PASS
- `Accessibility and navigation tests` PASS

Post-merge on `main` for merge commit `d99bfa12895c7ae11fc87780b40145f87b83990f`:

- `build` PASS
- `deploy` PASS
- `smoke` PASS

## Production Verification

Verified live on Tuesday, August 25, 2026:

- `/`
- `/haku/?q=tekoäly`
- `/en/search/?q=learning`

DOM and semantics:

- `[data-search-modular-results]` is `UL`
- direct rendered result children are `LI.find-explore-result`
- no direct `DIV` or `P` children were present inside the result list
- native list semantics are preserved without redundant ARIA
- result lists expose `list` / `listitem` semantics through native `UL` / `LI`

Full search pages:

- one authoritative visible page search input on both `/haku/` and `/en/search/`
- summary counts rendered correctly (`373` for `tekoäly`, `130` for `learning`)
- result cards rendered normally with unchanged shared presenter output

Navbar dialog:

- dialog opens normally
- focus lands in the search input
- result list owner is `UL`
- rendered result cards are `LI`
- query transfer to full-results link works (`/haku/?q=...`)
- `Escape` closes the dialog and returns focus to the navbar search button
- second search works after closing and reopening the dialog

## Visual Regression

Verified in production on desktop, dark theme, light theme, and mobile-width (`375px`) checks:

- no bullet markers
- no unwanted left padding
- card spacing preserved (`grid` layout with non-zero gap)
- navbar dialog behavior unchanged
- no regression observed from the CSS simplification

## Status

PF5-A2 is closed on `main`.

STATUS: CLOSED / GREEN / MAIN

PF5-A2 RESULT LIST SEMANTICS STATUS: CLOSED / GREEN / MAIN
