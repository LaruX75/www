# LEGACY-BLOG-CLEANUP-01

Baseline: `becfffad8446e6cf4e8c796a70b7202a20343107`

## Decision

The 80 legacy `src/blog/` sources keep their routes and source files, but no
longer share one discovery role. `legacyBlogProjection.js` is an explicit,
build-validated map: 55 semantic class A records are active blog writings and
25 B/C/D/F records are historical archive material.

## Projection

- `collections.blog` remains the complete historical source collection.
- `collections.activeBlog` is the 55-item active writing projection.
- `collections.historicalBlog` is the 25-item historical projection.
- `/blogi/` and `/en/blog/` SSR-render the active archive and a neutral,
  Pagefind-ignored historical archive section.
- Kynästä, writings, EN recent content, theme aggregation and related-content
  candidates consume the active projection.
- Historical routes remain available, but do not receive active
  `FindExplore:writings` Pagefind metadata and resolve to neutral `WebPage`
  JSON-LD instead of `BlogPosting`.

## Verification

- `npm run build:local:full`: PASS; 1,493 files; Research.fi integrity PASS.
- Pagefind: PASS; 1,481 HTML documents indexed.
- `/blogi/`: 55 active rows and 25 historical rows.
- Focused Playwright `tests/pagefind-blog-list.spec.js`: PASS, 4/4.
- Focused unit tests: PASS, including the exact 80/55/25 validation and
  historical Pagefind/JSON-LD behavior.
- `git diff --check`: PASS.

Fixtures: the 2020 open-science award and 2013 TVT presentation are historical;
the 2008 `Kehuttua` commentary remains active and is the sole blog card on the
Opettajankoulutus theme fixture.

## Boundaries

Canonical Content v1, public JSON schema, routes, source files, Pagefind
architecture, taxonomy thresholds and FI/EN route semantics remain unchanged.
No duplicate redirect decision is included in this slice.

AC1 = CLOSED / GREEN
