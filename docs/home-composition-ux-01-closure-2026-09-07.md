# HOME-COMPOSITION-UX-01 closure

## Scope

- Base: `a2a7301ebd0cefc061d4b4dcd011ed38f9e74473`
- Decision source: `docs/home-composition-ux-01-audit-2026-09-07.md`
- Implemented slice: EN homepage hierarchy only.

## Change

Removed the redundant EN `home-intro-section` from `src/en/index.njk`.
The existing `#start` route-choice section now follows the hero directly:

```text
hero -> Four ways into the site -> domain orientation -> current content
```

The deleted intro repeated the hero's scope statement and repeated its
`Presentations` and `About me` CTAs. No new component, CSS, JavaScript, data
model, route, or taxonomy was introduced.

## Visual QA

| Viewport | Before | After | Result |
| --- | --- | --- | --- |
| 1440 x 900 | `#start` began at 912 px | `#start` begins at 669 px | Route choice appears directly after hero |
| 390 x 844 | `#start` began at 1,283 px | `#start` begins at 950 px | 333 px of repeated intro removed |

At 390 px the EN hero remains 889 px, keeps its role links, two intended hero
CTAs, and six KPI proof links, and has no horizontal overflow. The four route
cards remain SSR-rendered. Built EN homepage link count decreased from 217 to
215 because only the redundant intro CTA pair was deleted.

## Preserved differences

- FI remains unchanged, including its real FI-only `/opetus/` route.
- EN still has no synthetic `/en/opetus/` or `/en/teaching/` route.
- EN keeps its own later domain and current-content surfaces; this is shared
  hierarchy, not artificial content parity.

## Verification

- `node --check tests/home-composition-ux-01.spec.js`
- `git diff --check`
- `npm run build:local` passed: Eleventy wrote 1,481 files in 246.02 seconds;
  Research.fi integrity passed.
- Focused static-server Playwright suite passed: 22/22.
  - `tests/home-composition-ux-01.spec.js`
  - `tests/ux1c-mobile-home-hero-proof.spec.js`
  - `tests/home-nav-correction-01.spec.js`

The static local build intentionally does not include Pagefind output; Pagefind
asset 404 log lines during the smoke are expected and unrelated to this SSR
composition change.

## Architecture status

- Canonical Content v1: unchanged.
- SSR ownership: unchanged.
- Runtime JS and homepage runtime JSON: unchanged.
- Public JSON, Pagefind, routes, and content semantics: unchanged.
- AC1: CLOSED / GREEN / MAIN.
