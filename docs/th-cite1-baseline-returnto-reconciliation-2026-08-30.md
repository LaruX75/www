# TH-CITE1-BASELINE — Thesis Find & Explore Pagination Test Reconciliation

Date: 2026-08-30
Status: `IMPLEMENTED / TEST DRIFT RECONCILED`

Reconciles a stale byte-for-byte href assertion in
`tests/th-cite1-phase3-thesis-pagination.spec.js` with the existing
O1 `returnTo` decoration contract in `src/js/find-explore.js`. This
is a test-only change; no production code was modified.

## Repository state

- Branch: `test/th-cite1-baseline-returnto-reconciliation`
- Base: `origin/main` at `5b5b58a8b68f978ae3991d582c4a3ba95243f18e` (post PR #172 RP-CONVERGE-01B merge).

## Reproduced failure

Test: `active thesis search replaces the same tbody and reset restores SSR rows and pagers` (`tests/th-cite1-phase3-thesis-pagination.spec.js:123`).

Failing assertion (line 133 pre-fix):

```js
await expect(
  resultsLocator(page)
    .locator(".thesis-archive-title-link")
    .first()
).toHaveAttribute("href", "/opinnaytteet/62699/");
```

- **Expected**: `"/opinnaytteet/62699/"`
- **Received**: `"/opinnaytteet/62699/?returnTo=%2Fopinnaytteet%2F%3Fq%3DRiikonen"`

Decoded `returnTo` = `/opinnaytteet/?q=Riikonen` — the active discovery URL.

Because this assertion failed, the four subsequent assertions on the
same test case (`find-explore-active` body class, top pager hide,
bottom pager hide, reset restoration) never executed. Real regression
coverage for the pager-hide behaviour was silently dark.

## Why `returnTo` is intentional

`src/js/find-explore.js:633` explicitly sets
`targetUrl.searchParams.set("returnTo", currentReturnTo())` on every
internal discovery-result URL. This is the O1 orientation contract:

- canonical Thesis destination remains `/opinnaytteet/62699/`.
- `returnTo` is orientation state only.
- decoded `returnTo` encodes the current search-active URL so the
  detail-page "back to search" resumes the discovery state.
- Thesis detail-page canonical identity is unchanged.

Classification: **TEST DRIFT — NOT PRODUCTION REGRESSION.**

The test was written before the O1 `returnTo` decoration rolled out
to Thesis search results; its byte-for-byte href expectation is stale.

## Updated assertion strategy

Replace the single stale equality with three semantic assertions that
prove the actual contract:

```js
const searchHref = await resultsLocator(page).locator(".thesis-archive-title-link").first().getAttribute("href");
expect(searchHref).not.toBeNull();
const searchUrl = new URL(searchHref, "http://localhost");
expect(searchUrl.pathname).toBe("/opinnaytteet/62699/");
const returnTo = searchUrl.searchParams.get("returnTo");
expect(returnTo, "search-active result link must carry returnTo orientation state").not.toBeNull();
const returnToUrl = new URL(returnTo, "http://localhost");
expect(returnToUrl.pathname).toBe("/opinnaytteet/");
expect(returnToUrl.searchParams.get("q")).toBe("Riikonen");
```

- Correct Thesis destination (pathname `/opinnaytteet/62699/`).
- Correct orientation decoration (`returnTo` param exists).
- Correct active query state (decoded `returnTo` pathname is `/opinnaytteet/` with `q=Riikonen`).

No loose regex, no accidental permissiveness. No new helper /
abstraction introduced (small local `new URL()` parse inline).

## Coverage restored

With the stale assertion corrected, the case now exercises **all** of
its intended assertions end-to-end:

- ✅ `body.find-explore-active` added on search.
- ✅ Top SSR pager hidden while search is active (CSS
  `src/css/theses-page.css:295-298`).
- ✅ Bottom SSR pager hidden while search is active.
- ✅ Reset removes `find-explore-active`.
- ✅ SSR rows restored (20 rows).
- ✅ First result href restored to the pre-search value.
- ✅ Top pager visible again.
- ✅ Bottom pager visible again.

## Exact test result

`PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/th-cite1-phase3-thesis-pagination.spec.js` — **6/6 pass** (was 4 pass / 1 fail / 1 unreached).

The failing case (`active thesis search replaces the same tbody and
reset restores SSR rows and pagers`) now passes with all seven
in-case assertions executed.

FI + EN pagination assertions in the sibling tests remain unchanged
and still pass.

## Production diff

**None.** `git diff --stat -- src/` returns empty. Only
`tests/th-cite1-phase3-thesis-pagination.spec.js` was modified
(+12/-1 lines).

## Non-regressions

- `src/js/find-explore.js` unchanged.
- Thesis templates unchanged.
- Thesis CSS unchanged.
- Pagefind metadata unchanged.
- Canonical Thesis content unchanged.
- O1 orientation contract unchanged.

## Architecture status

- `Canonical Content v1 remains unchanged.`
- `O1 remains CLOSED / MAINTENANCE.`
- `Theses architecture remains CLOSED / MAINTENANCE.`
- `R1 remains CLOSED / MAINTENANCE.`
- **`Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.`**
