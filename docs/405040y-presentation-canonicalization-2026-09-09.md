# 405040Y Presentation Canonicalization — 2026-09-09

## Status

CLOSED / GREEN / MAIN

## Scope

Canonicalize Jari Laru's own public 405040Y lecture slide sets that were still linked directly from course implementation pages:

- 2026-2027-a lecture 4: Media- ja informaatiolukutaito tekoälyn aikakaudella
- 2025-2026-b lectures 1–4: Johdanto, Digitaalinen osaaminen, Ohjelmointiosaaminen, Medialukutaito

Kopiosto guest lectures remain external/non-canonical because source/ownership semantics differ.

## Architecture

Canonical Presentation records under `src/presentations/` now own presentation identity, source URL, date, topics/categories, and `courseContexts` membership. Course implementation pages point to canonical detail URLs via `presentationPageUrl`. Existing build-time hydration resolves those URLs into canonical Presentation records for SSR.

No browser-side content model, runtime JSON lookup, Pagefind authority, or new taxonomy was introduced.

## Deletion / simplification

The direct Canva `material` blocks were removed from the five course-lecture rows once canonical detail URLs became authoritative. The Canva source remains only on the canonical Presentation record/detail page.

## Preserved semantics

- `courseId` and `periodId` are unchanged.
- `courseContexts[].periodId` matches the corresponding course-page implementation.
- Panopto recordings remain course-page links.
- Kopiosto lecture material remains external.
- Canonical Content v1 remains unchanged.
- AC1 remains CLOSED / GREEN / MAIN.

## Validation

Focused Playwright coverage now requires:

- 2026-A lecture 4 to route through its canonical Presentation detail.
- 2025-2026-B lectures 1–4 to route through canonical Presentation details.
- Direct Canva shortcuts to be absent from course pages when canonical detail pages exist.
- Canonical detail pages to retain the Canva source URLs.
- Kopiosto guest lectures to remain non-canonical.

Full build / verify / Playwright validation is delegated to GitHub CI on the draft PR.

## Closure

PR [#238](https://github.com/LaruX75/www/pull/238) merged to `main` with
normal merge commit `366a1f96f31f1c989b4338faa08dca9227fd9977`. The feature
head `8e6d5c6a5bd69bb88d4f766a893d510ef7abea7f` is preserved in merge history.

- Autumn 2026 lecture 4 and spring 2026 lectures 1-4 have canonical
  Presentation detail pages.
- Course pages route to those details through `presentationPageUrl`; direct
  Canva duplication was removed from the corresponding course rows.
- Canva remains the canonical Presentation source, while Panopto remains
  course-page-owned.
- Kopiosto remains external and non-canonical.
- The periodId regression test now validates semantic invariants rather than
  a historical repository-wide count.

Validation completed on the merged head:

- `canonicalCoursePeriodId`: 16/16 PASS.
- PeriodId validator: 0 warnings, 15/15 backlinks resolvable.
- GitHub Staging checks: build, verify, and Playwright PASS.

Architecture status:

```text
Canonical Content v1: UNCHANGED
Pagefind: UNCHANGED
Public JSON: UNCHANGED
Runtime JSON: UNCHANGED
AC1: CLOSED / GREEN / MAIN
```

No further implementation is required. Any thumbnail work, metadata
expansion, taxonomy change, Pagefind change, sequence semantics, or Kopiosto
canonicalization would require a separately justified bounded workstream.

## PeriodId validator reconciliation

The original count-based regression fixture reflected the first three autumn
2026 Presentation records only. Later canonically curated 410014Y history and
the verified 405040Y autumn lecture 4 and spring lectures 1–4 legitimately
expanded `periodId` usage. The validator now checks optionality and verifies
each explicit `(courseId, periodId)` against authoritative course-page
frontmatter instead of enforcing a repository-wide historical count.
