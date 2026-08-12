## Publications P4d Audit - EN Legacy Route

Date: 2026-08-11

## Scope

This audit resolves the role of the legacy English route:

- `/en/scientific-publications/`

against the canonical English publications page:

- `/en/publications/`

## Findings

### 1. The legacy EN page was a separate publication model

Before this checkpoint, the legacy English route rendered its own table from a dedicated page template instead of the canonical publications dataset.

- `collections.pub_tieteellinen`

It did not use:

- `publicationsPage.items`

So it was outside the canonical publications architecture proven in P1-P4c.

### 2. The legacy EN page did not have a unique current role

The canonical English page [src/en/publications.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/publications.njk):

- already uses `publicationsPage.items`
- already covers the same publication domain
- is the route linked from EN navigation and EN landing pages

By contrast, the legacy route was not the main navigational destination anymore.

### 3. Keeping both routes would preserve avoidable duplication

Leaving `/en/scientific-publications/` live as an indexable content page would keep:

- a third publication-specific route
- a second EN publication rendering path
- a duplicate search/SEO surface for the same content area

That would conflict with the canonical publications model.

## Decision

The legacy route is now treated as a deprecated entry point, not as a separate publication page.

Implemented change:

- `/en/scientific-publications/`
  - now redirects to `/en/publications/`
  - has `noindex, follow`
  - is excluded from collections
  - is marked `data-pagefind-ignore` in the redirect body

File changed:

- [src/en/scientific-publications.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/scientific-publications.njk)

## Result

This closes the EN-side legacy branch without changing the canonical EN publications UI.

Publication architecture status after P4d:

- FI `/julkaisut/` -> canonical
- EN `/en/publications/` -> canonical
- Research.fi detail pages -> canonical
- Pagefind detail discoverability -> proven in P4c
- EN legacy `/en/scientific-publications/` -> deprecated redirect

## Bottom line

`/en/scientific-publications/` no longer acts as an independent publication page.

The canonical English publication route is now unambiguously:

- `/en/publications/`
