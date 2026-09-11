# DETAIL-HERO-UX-03-OPINION closure

Date: 2026-09-11
Baseline: `9d82f3ab84a758a0b0eca2ed63fc2eda1b43c17a`
Status: `READY FOR REVIEW`

## Scope

Only Writing records with `type: mielipide` use the refined hero composition:

```text
eyebrow -> title -> qualified lead -> publication/date -> source CTA -> optional editorial image
```

The shared hero API and CSS are unchanged. Other Writing types and all other
detail domains retain their existing composition.

## Presentation rules

- A `subtitle` is always eligible as the opinion lead. Otherwise `description`
  is eligible only when non-empty, at most 260 characters, without URLs,
  truncation ellipses, or markup-like characters. Rejected archive metadata
  produces no lead.
- Existing `titleMode="compact"` applies only when an opinion has a thumbnail
  and a title of at least 100 characters. The threshold addresses the audited
  long-title, two-column imbalance without changing shared typography.
- Existing `publication` and `date` render in the hero meta row. Their
  duplicated opinion-only body rows are removed, as is the original-source row
  when the hero already renders the external-source CTA.
- An opinion with both `publication` and an external source uses
  `Lue alkuperäinen kirjoitus — {publication}`. Other source cases retain the
  existing generic label. No hostname parsing or publisher mapping was added.
- Writing thumbnails remain editorial, non-clickable images with `imageAlt` or
  title fallback.

Authored opinion bodies remain unchanged; the new Kaleva opening provenance
sentence is a separate future content-cleanup candidate.

## Verification

- `npm run build:local` passed: 1492 files and Research.fi integrity checks.
- Focused Playwright coverage passed: 5/5 for the new Kaleva opinion, older
  expert opinion, truncated political no-thumbnail opinion, no-JS rendering,
  and adjacent non-opinion domains.
- Local visual QA passed at 1440 x 900 and 390 x 844 for the Kaleva opinion,
  a no-thumbnail opinion, and a Presentation reference; no horizontal
  overflow. The Kaleva desktop hero reduced from 1105 px to 792 px.
- Adjacent hero specs: 48 passed. One existing `detail-ux-01a` expectation
  remains stale because its named no-thumbnail Presentation reference now has
  a thumbnail; this slice does not touch Presentation data or rendering.
- `git diff --check` passed.

Canonical Content v1, local canonical URLs, source URL semantics, Pagefind,
public/runtime JSON, and Architecture Closure 1.0 remain unchanged.
