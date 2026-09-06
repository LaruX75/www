# OPETUS-CATALOG-01A - Derived SSR teaching catalog

Date: 2026-09-06
Status: `CLOSED / GREEN / READY FOR PR`

## 1. Baseline

The work starts from `5d4c3c4db89c4540cada00716f89f80c60c92a48`, the merge
commit for PEPPI-BROWSER-CURATION-01. Architecture Closure 1.0 remains
`CLOSED / GREEN / MAIN`.

## 2. Previous assumption

`/opetus/` was SSR, but its only course card duplicated 405040Y's name, URL,
year, period, credits, and teaching unit directly in the landing template.
That made a second local implementation require another handwritten card.

## 3. Authority and flow

Only `src/opetus/*.md` frontmatter is authoritative for catalog membership.
`src/_data/coursePages.js` reads that local metadata once, then projects it as:

```text
local course implementation frontmatter -> coursePages.catalog
-> courseId grouping and deterministic order -> Nunjucks SSR -> /opetus/
```

No presentation, Pagefind, content graph, filename, URL, Peppi output, or
network response participates in catalog membership.

## 4. Grouping and ordering

The catalog groups by canonical `courseId`; each group carries its trustworthy
local `courseName` and its local implementation pages. Course groups sort by
course name (then code). Implementations sort newest `academicYear` first,
then local `semesterLabel` and opaque `periodId`. No period or year is guessed.

## 5. Academic-year orientation

No separate current-academic-year UI is needed for the current one-item view,
so no manually maintained current-year constant was introduced. Existing local
`course.academicYear` remains implementation metadata, not identity.

## 6. 405040Y invariants

The catalog preserves `405040Y`, `periodId: "2026-2027-a"`, and
`/opetus/teknologiatuettu-oppiminen/2026-2027-a/`. The course page, its Peppi
link, its FI-only status, and Presentation exact-implementation backlink and
peer semantics are unchanged.

## 7. Simplification

The hardcoded one-course card and its duplicated course inventory were removed.
The landing has one `coursePages.catalog` Nunjucks loop, which remains natural
with one implementation and grows into course -> implementation structure when
future local pages are added.

## 8. Peppi and language boundary

Peppi is dev-only external curation evidence. It is not a build dependency,
runtime dependency, catalog source, canonical store, or updater. The catalog
remains FI-only: no `/en/opetus/` or `/en/teaching/` route is created.

## 9. Public surfaces

Pagefind has no new facet or ownership role. Public JSON and the content graph
are unchanged. The catalog is rendered in HTML at build time; it adds no
runtime JavaScript, JSON fetch, client grouping, or client sorting.

## 10. Tests

`tests/opetus-catalog-01a.spec.js` verifies the local metadata projection,
SSR course -> implementation hierarchy, removal of the handwritten inventory,
FI-only and no-fetch scope guards. Existing OPETUS-IA, course relation, and
home navigation specs remain the adjacent regression coverage.

## 11. Explicit non-goals

This slice does not create historical pages or infer implementation membership
for 410014Y, 410017Y, or any other historical course. It does not migrate
`periodId`, add implementation IDs, persist teaching periods, or expand Peppi
integration.

## 12. Architecture status

- Canonical Content v1: unchanged
- `courseContexts[]`: unchanged
- `periodId` semantics: unchanged
- Pagefind: unchanged
- Public JSON: unchanged
- Runtime JS content model: none
- Peppi production dependency: none
- Architecture Closure 1.0: `CLOSED / GREEN / MAIN`
