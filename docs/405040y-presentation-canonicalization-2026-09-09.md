# 405040Y Presentation Canonicalization — 2026-09-09

## Status

IMPLEMENTED ON BRANCH / CI PENDING

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
