# Publications Archive Convergence implementation

Date: 2026-08-20

Status: **CLOSED / GREEN / BRANCH**

Repository: `LaruX75/www`

Branch: `feat/publications-archive-convergence`

Base main SHA: `daa6d7e624044f1e8201fe7b20653cfe532598f2`

This document records the publications archive convergence implementation state on the feature branch. It does not close the work on `main`; that happens only after PR review and merge.

## 1. Delivered scope

The publications archive now follows an SSR-first grouped-table model while preserving the existing publication classification headings:

```text
canonical publications
→ archive-row projection
→ grouped SSR archive tables
→ one visible archive surface

active query / filter / order
→ Pagefind
→ same shared results container
→ grouped archive rows
```

Delivered on this branch:

- `src/_utils/publicationArchiveRow.js` creates a presentation-only archive row from canonical publication data or Pagefind metadata.
- `src/_utils/publicationsArchiveGroups.js` groups canonical publications by the existing OKM publication-group ordering.
- `/julkaisut/` and `/en/publications/` now render grouped SSR archive tables with the same columns in every group:
  - `Year`
  - `Authors`
  - `Title`
  - `Type`
  - `Source`
- Each category stays visible as its own heading directly before its table.
- The publication title remains the primary local link to the canonical detail `pageUrl`.
- External source actions remain separate and explicit through DOI or `sourceUrl`.
- Active search, filtering, and ordering now repopulate the same visible archive surface instead of switching to publication cards on the archive page.
- The old embedded `publicationFindExploreRecords` archive hydration blob is removed from both publication hubs.

## 2. User-directed archive shape

The original convergence brief mentioned pagination, but the later explicit user follow-up overrode that requirement:

- no pagination
- keep the current classification-based source presentation
- split the archive by categories
- place the category heading before each table

This branch follows that later instruction exactly. The publication archive remains one grouped SSR page per locale.

## 3. Preserved boundaries

These constraints remain intact:

- Canonical Content v1 remains authoritative.
- This is a presentation-surface convergence, not a new canonical model.
- PUB-CITE1 citation architecture remains intact.
- Publication group semantics remain the existing OKM classification.
- No new taxonomy or new membership rule was introduced.
- The archive still does not expose the publications topic facet.
- `pageUrl` remains the local publication detail page.
- External source actions remain DOI / explicit external source links.
- No source URL is inferred from `pageUrl`.
- Analytics cards and charts remain in place.
- No `Pagefind.search("")` archive reconstruction was introduced.
- No hidden full-archive DOM filtering model was introduced.
- PF5 GLOBAL RESULT PARITY remains out of scope and not started here.

## 4. Corpus and archive shape

Current branch evidence after build:

```text
canonical publications            56
FI SSR archive rows               56
EN SSR archive rows               56
Pagefind publication fragments    56
archive pagination                none
archive groups                    A, B, C, D, E, G, unclassified
```

The grouped SSR archive keeps the current classification-led surface while reducing archive-specific runtime coupling:

- no embedded archive records JSON on the hub pages
- same shared results container for SSR and active Pagefind state
- no publication-card surface on the main publication archive pages

## 5. Verification

Local verification completed on this branch:

```text
npm run build:no-og
  PASS

npm run test:unit
  PASS
  574 / 574

node scripts/audit-publications-f3b-built-output.js
  PASS
  canonicalTotal 56
  grouped SSR archive confirmed on FI + EN
  embedded archive records JSON absent

node scripts/audit-pf5-impl-apa-full-list-parity.js
  PASS
  canonical 56
  FI SSR archive rows 56
  EN SSR archive rows 56
  Pagefind publication fragments 56

npx playwright test --workers=1 tests/f3b-publications-find-explore.spec.js
  PASS

npx playwright test --workers=1 tests/pf-cite-modal-failure-path.spec.js
  PASS

npx playwright test --workers=1 tests/pf3-result-card-consistency.spec.js
  PASS

npx playwright test --workers=1 tests/pf4-result-card-hierarchy.spec.js
  PASS

npx playwright test --workers=1 tests/pf5-impl-apa-full-list.spec.js
  PASS

npx playwright test --workers=1 \
  tests/f2-find-explore-smoke.spec.js \
  tests/f3a-theses-find-explore.spec.js
  PASS
  7 / 7
```

## 6. Result

The branch now satisfies the publications archive convergence target under the later user override:

- grouped SSR archive tables instead of an archive-card result surface
- same visible result container for SSR and active Pagefind state
- classification headings preserved before each table
- no publication pagination
- local detail and external source semantics preserved
- citation export retained on the FI archive surface only

## 7. Remaining work

The next action is straightforward:

- open one implementation PR for review; do not start PF5 in the same branch
