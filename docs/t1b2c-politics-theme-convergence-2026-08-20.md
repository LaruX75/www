# T1B2C — Politics Theme Timeline Convergence

Date: 2026-08-20

Status: GREEN / IMPLEMENTED / BRANCH

Branch: `feat/t1b2c-politics-theme-convergence`

PR: #119

## 1. Selected Surface

Selected T1B2C surface:

- politics theme timelines
  - `/politiikka/kampus-raksila-linnanmaa/`
  - `/politiikka/palveluverkko/`
  - `/politiikka/avoin-valmistelu/`
  - `/politiikka/sivistys-ja-koulutus/`

## 2. Why This Surface Now

This surface is the smallest remaining T1A candidate that satisfies all T1B2C selection criteria:

- clear duplicate/manual ownership exists in `src/_data/politicsThemePages.js`
- authoritative local canonical source items already exist
- no Canonical Content v1 change is required
- SSR/build-time convergence is realistic
- deletion/repoint opportunity is explicit
- scope fits one focused PR

Why other remaining surfaces were not selected now:

- council timeline already has the strongest current SSR/build-time architecture and does not offer a comparably clear deletion win for this slice
- training feedback is a legitimate page-native dataset rather than an obvious duplicate-ownership problem
- site changes is a separate external-history surface with materially higher DOM/performance risk and is not the smallest justified T1B2C slice

## 3. Authoritative Source

Authoritative existing facts for local timeline links:

- canonical local content records projected from existing source collections
- canonical `pageUrl`
- canonical `title`
- canonical `date`
- canonical `contentType`

Current suitable source families for canonical local timeline projection in this slice:

- `blog`
- `politics`
- `publications`

Explicitly out of scope for authoritative projection in T1B2C:

- `media`
- any other local family not already part of the existing shared timeline projection contract

Legitimate editorial companion facts that stay manual:

- theme titles, principles, focus text, lead text, evidence notes, editorial note
- year-bucket structure per theme timeline entry
- explanatory per-year narrative text
- any approved non-canonical landing links
- any external links that are intentionally part of the timeline
- any intentional local links that currently live outside the selected authoritative source families for this slice

## 4. Before Data Flow

Current flow:

```text
src/_data/politicsThemePages.js
  -> manual theme metadata
  -> manual timeline entries
  -> manual duplicate local link labels
  -> manual duplicate local href ownership
  -> src/politics/theme-page.njk
  -> 4 SSR theme timeline routes
```

Current duplication/problem:

- local canonical items are re-entered by hand inside timeline arrays
- canonical item titles/URLs are owned in two places
- timeline link lists are not projected from existing canonical source records
- the file mixes unique editorial framing with replaceable canonical-link ownership

## 5. Target Data Flow

Target flow:

```text
canonical/domain items
  + minimal politics-theme companion metadata
  -> build-time politics-theme projection
  -> src/politics/theme-page.njk
  -> same 4 SSR theme timeline routes
```

Projected local timeline links should come from build-time resolution of canonical page URLs, not from hand-maintained duplicate label/href objects.

## 6. Keep / Repoint / Delete

Keep:

- editorial theme framing
- theme route structure
- SSR-only rendering model
- FI-only domain scope
- approved external / special landing links where they are genuinely not canonical detail items
- approved local media links that remain outside the T1B2C authoritative projection boundary

Repoint:

- politics theme timeline link ownership
- local timeline item metadata from manual arrays to canonical build-time projection

Delete or reduce:

- duplicate local link labels where canonical titles are sufficient
- duplicate manual local href objects inside politics theme timeline arrays
- mixed ownership of editorial framing and canonical item identity inside one raw data file

## 7. FI / EN Implications

- no new EN route is created in this slice
- no existing FI/EN parity contract is widened here
- politics theme pages remain intentionally FI-only unless repo evidence later justifies broader parity work

## 8. Public JSON / API Implications

- no new public JSON contract
- no existing public JSON contract removed
- no runtime API fetch added
- no GitHub/site-changes contract touched

## 9. Pagefind Role

- none for untouched timeline rendering
- no Pagefind-driven timeline generation
- no Pagefind scope expansion in this slice

## 10. JS Role

- no timeline-specific runtime JS should be introduced
- no browser-owned deterministic ordering or grouping
- SSR remains authoritative

## 11. Expected Deletion / Simplification

Expected simplification:

- `src/_data/politicsThemePages.js` stops being the raw owner of duplicate local timeline link metadata
- local canonical timeline references move behind a build-time projection boundary
- editorial companion data becomes smaller and more clearly separated from canonical item ownership

## 12. Validation Plan

Planned validation:

- focused unit tests for politics-theme projection behavior
- `npm run build:no-og`
- targeted route verification for the 4 politics theme pages
- targeted SEO/i18n sanity only if touched implicitly
- `git diff --check`

Metrics to compare before/after:

- HTML bytes on selected politics theme routes
- approximate DOM/tag count
- inline JS bytes
- runtime JSON requests
- Pagefind involvement

Success condition for T1B2C:

- one remaining timeline/history surface is measurably simplified
- canonical ownership is clearer
- editorial synthesis is preserved
- no new timeline framework or taxonomy is introduced

## 13. Implementation Result

Implemented outcome:

- politics theme local canonical links now resolve through a build-time projection helper
- authoritative projection remains intentionally limited to the existing shared timeline source families:
  - `blog`
  - `politics`
  - `publications`
- stale manual local URLs were corrected to current authoritative canonical `pageUrl` values where applicable
- two politics-theme links pointing to local `media` detail pages remain explicit manual links on purpose
  - this preserves the current surface scope without silently expanding T1B2C into media convergence

Observed result in current build-time data:

- total politics-theme timeline links: `45`
- authoritative projected links: `41`
- preserved manual links: `4`
  - manual local links: `3`
  - manual external links: `1`

Route-level rendering contract after implementation:

- same 4 FI routes
- same SSR rendering surface
- no new public JSON
- no new Pagefind role
- no new timeline-specific runtime JS

Measured route output result:

- tag counts unchanged on all 4 routes
- inline script bytes unchanged on all 4 routes
- runtime JSON references unchanged at `0` on all 4 routes
- HTML bytes changed only where canonical title/href ownership now comes from projection instead of duplicated manual literals
