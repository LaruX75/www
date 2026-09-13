# Thesis Archive Convergence implementation

Date: 2026-08-20

Status: **CLOSED / GREEN / MAIN**

Repository: `LaruX75/www`

Branch: `feat/theses-archive-convergence`

Base main SHA: `c78bbfa6c82fe8aad5683aed1f4b15e25c699d24`

This document records the CONV-A → CONV-G implementation state first on the feature branch and now, after merge verification, on `main`.

## 0. Main closure

Implementation PR `#107` merged to `main`.

```text
feature HEAD                 b0f50f335329bdd4490bd5f87a427288840e88c2
merge SHA                    50df0cfcfad1b3f6c4f63e81b6934273778b6ca2
merge timestamp              2026-08-20T08:20:47Z
post-merge main HEAD         50df0cfcfad1b3f6c4f63e81b6934273778b6ca2
```

Post-merge GitHub CI on merge commit `50df0cfcfad1b3f6c4f63e81b6934273778b6ca2`:

- `Build and Deploy` — `success`
- `Accessibility and navigation tests` — `success`
- `Generate OG Images` — `success`

Post-merge local verification on `main`:

```text
npm run build:no-og                                           PASS
npm run test:unit                                             PASS (565 / 565)
node scripts/audit-thesis-pagefind.js                         PASS
node scripts/audit-th-cite1-phase3-ssr-archive.js            PASS
node scripts/audit-th-cite1-phase4c-browser-citation-deletion.js  PASS
node scripts/audit-th-cite1-phase4-modal-export-parity.js    PASS
node scripts/audit-th-cite1-phase6-legacy-server-citation-deletion.js PASS
npx playwright test --workers=1 \
  tests/f3a-theses-find-explore.spec.js \
  tests/th-cite1-phase3-thesis-pagination.spec.js \
  tests/th-cite1-phase4b-thesis-detail-modal.spec.js \
  tests/f3b-publications-find-explore.spec.js \
  tests/pf-cite-modal-failure-path.spec.js \
  tests/f4-research-find-explore.spec.js                      PASS (26 / 26)
main-only thesis archive semantic smoke                       PASS (2 / 2)
```

Main closure evidence:

- The archive remains one SSR thesis table with one visible shared `<tbody>` on both `/opinnaytteet/` and `/en/theses/`.
- Active Pagefind query/filter state keeps the same table surface and repopulates the same `<tbody>` with `<tr>` rows; no thesis-specific `<li>`/card surface becomes visible.
- Reset returns the canonical SSR landing state with pagers restored.
- No `Pagefind.search("")` archive reconstruction exists.
- No runtime `/data/theses.json` archive fallback exists.
- No hidden 169-row DOM archive exists; SSR pages still cap at 20 rows.
- Title links still point to the local canonical `pageUrl`.
- OuluREPO remains a separate external action pointing to the explicit canonical `sourceUrl`.
- `pageUrl != sourceUrl` remains true and `sourceUrl` is not derived from `pageUrl`.
- The old three-section template, independent thesis pagination runtime, APA archive-row citation cell, and separate thesis Pagefind result list remain deleted on `main`.
- Publications regression smoke remained green on the merged `main`.
- PF5 GLOBAL RESULT PARITY is still separate future work and remains **NOT STARTED**.

## 1. Delivered scope

The thesis archive now follows the convergence target from the 2026-08-19 readiness audit:

```text
canonical theses
→ shared archive-row projection
→ one SSR archive table
→ one visible tbody

active query / filter
→ Pagefind
→ same row identity model
→ same visible tbody
```

Delivered on this branch:

- `src/_utils/thesisArchiveRow.js` preserves the authoritative thesis archive row contract as a presentation-only projection.
- `src/_utils/thesesFindExplore.js` now emits `Theses role` as a Pagefind filter and `thesesSourceUrl` as explicit metadata.
- `src/_utils/thesesArchivePages.js` replaces the old three-section archive pagination model with one flat 20-row archive pager per locale.
- `/opinnaytteet/` and `/en/theses/` now render one converged thesis table:
  - `Year`
  - `Author`
  - `Title`
  - `Type / role`
  - `Source`
- The thesis title is the primary local link to `pageUrl`.
- The source action is a separate explicit `sourceUrl` link to OuluREPO.
- Active thesis search/filter state now repopulates the same shared `<tbody>` instead of switching to a separate list surface.
- The legacy three-section template and `src/js/thesis-archive-pagination.js` are deleted.

## 2. Preserved boundaries

These constraints remain intact:

- Canonical Content v1 remains authoritative.
- `thesisType` and `thesisRole` remain separate canonical dimensions.
- Combined labels such as `Gradu · ohjattu` are presentation-only.
- `pageUrl` remains the local canonical thesis detail page.
- `sourceUrl` remains the original OuluREPO source link.
- No logic derives `sourceUrl` from `pageUrl`.
- No APA 7 citation text is rendered in the archive table.
- No global browser JSON blob of all 169 theses was introduced.
- No `Pagefind.search("")` archive reconstruction was introduced.
- No hidden 169-row DOM filtering architecture was introduced.
- PF5 GLOBAL RESULT PARITY remains out of scope and not started here.

## 3. Corpus and archive shape

Current branch evidence after build:

```text
canonical unique theses            169
FI archive URLs                    9  (/opinnaytteet/ + /sivu/2..9/)
EN archive URLs                    9  (/en/theses/ + /page/2..9/)
rows per SSR archive page          <= 20
FI SSR archive union               169 / 169
EN SSR archive union               169 / 169
Pagefind thesis fragments          169
```

The role/type matrix is unchanged:

```text
advised / masterThesis    87
advised / bachelorThesis  29
reviewed / masterThesis   53
reviewed / bachelorThesis  0
```

## 4. Verification

Local verification completed on this branch:

```text
npm run build:no-og
  PASS

npm run test:unit
  PASS
  565 / 565

node scripts/audit-thesis-pagefind.js
  PASS
  titles: 8 / 8 detailFound, 8 / 8 top1
  authors: 4 / 4 detailFound, 4 / 4 top1
  filter-only: 4 / 4 detailFound

node scripts/audit-th-cite1-phase3-ssr-archive.js
  PASS
  FI union 169 / 169
  EN union 169 / 169
  max rows per page 20
  sitemap paginated URL hits 0

node scripts/audit-th-cite1-phase4-modal-export-parity.js
  PASS
  gates checked: 54
  gate failures: none

npx playwright test --workers=1 \
  tests/f3a-theses-find-explore.spec.js \
  tests/th-cite1-phase3-thesis-pagination.spec.js \
  tests/th-cite1-phase4b-thesis-detail-modal.spec.js \
  tests/f4-research-find-explore.spec.js
  PASS
  22 / 22
```

The only implementation defect discovered during verification was a real runtime search race in `src/js/find-explore.js`: earlier async Pagefind searches could finish after later filter changes and overwrite the final thesis tbody. The fix is request-order gating so only the latest search run can update the DOM.

## 4.1. Main post-merge parity

The merged `main` state retained the same convergence contracts:

```text
canonical unique theses            169
public /data/theses.json items     169
FI SSR archive union               169 / 169
EN SSR archive union               169 / 169
Pagefind thesis fragments          169
citationApa parity                 169 / 169
JSON-LD citation parity            169 / 169
public CSL fields exposed          0
```

Representative archive-row semantics were re-verified on `main` across advised master's, advised bachelor's, reviewed master's, and English-source examples:

- title → local canonical `pageUrl`
- same-tab local navigation retained
- OuluREPO action → explicit canonical `sourceUrl`
- external link semantics retained (`target="_blank"`, `rel="noopener noreferrer"`)
- `pageUrl` and `sourceUrl` remain distinct

Branch verification above is preserved as historical branch evidence; the workstream is now also closed on `main`.

## 5. Result

The branch now satisfies the convergence target from the readiness audit:

- one SSR archive table instead of three section tables
- one visible thesis result surface instead of archive table vs separate result list
- explicit local-title vs external-source link semantics
- authoritative thesis role filtering in Pagefind
- deterministic SSR pagination without cartesian route growth

## 6. Remaining work

The next action is straightforward:

- validate representative production thesis archive URLs if a post-release smoke is desired; do not start PF5 in the same workstream
