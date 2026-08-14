# Find & Explore Theses v1 Closure

Date: 2026-08-14

## 1. Scope

This closes F3A only: Find & Explore for thesis archive routes `/opinnaytteet/` and `/en/theses/`, canonical-derived thesis Pagefind metadata, shared runtime integration, and the verification evidence needed to publish the pilot.

Out of scope: F3B publications, presentations, main-page Find & Explore, external enrichment, politics/maps/trips/social distribution, embeddings, and LLM features.

## 2. Implementation Summary

Theses are now the second independent Find & Explore consumer after writings. The implementation adds a thesis page model, thesis-specific Pagefind document projection, shared Find & Explore rendering, SSR curated thesis sections, and lightweight thesis card actions for abstracts and citations.

## 3. Canonical Invariants

Canonical thesis count remains `169`. The local detail model remains authoritative for thesis HTML projection, and `src/_data/theses.js` / cache-backed thesis data still provide the source-backed content. No thesis IDs were re-keyed, added, or removed during F3A.

## 4. Find & Explore Architecture

The pilot reuses the shared Find & Explore include and `find-explore.js` runtime. Thesis-specific shaping lives in `src/_utils/thesesFindExplore.js` and `src/_data/thesesFindExplorePage.js`; the shared runtime is not forked into a thesis-only client.

## 5. FI Behavior

`/opinnaytteet/` keeps SSR-first curated opening sections, local detail links, abstract/citation actions, and the original OuluREPO source path from the detail/card context. Legacy archive tables and `/data/theses.json` archive-page hydration are removed.

## 6. EN Behavior

`/en/theses/` uses the same canonical thesis set and local detail landing pattern as FI. EN copy and labels remain route-specific, but there is no separate EN thesis data pipeline or archive runtime.

## 7. Pagefind Metadata

Thesis detail pages emit hidden Pagefind filters/meta through the shared base template. Metadata includes `FindExplore=theses`, thesis scope, language, year, thesis type, author, topic, role, and thesis description fields.

## 8. Progressive Enhancement

JS-off users still receive ordinary HTML sections, badges, card links, and source links. JS-on enhances the same content with Pagefind search, filters, pagination, and modal actions without replacing the SSR opening model.

## 9. Shared-Core Result

Writings and theses now share one Find & Explore runtime path. The thesis work confirmed that the shared component model can support multiple content types while keeping content-specific semantics in canonical view-model utilities.

## 10. Writings Regression Verification

Writings stayed green after the shared-core expansion. `node scripts/audit-writings-built-output.js` passed with `canonicalTotal: 290`, and `node scripts/audit-writings-pagefind.js` passed with FI `3/3` top1, EN `7/7` top1, and topics `4/4` found.

## 11. Before/After Complexity Metrics

Baseline before F3A: FI `280338` bytes, `1631` elements, `3` tables, `9` JSON refs; EN `260845` bytes, `1488` elements, `3` tables, `9` JSON refs.

Verified closure output: FI `160985` bytes, `1307` elements, `0` tables, `0` JSON refs; EN `152970` bytes, `1246` elements, `0` tables, `0` JSON refs.

## 12. Build Results

`npm run build:no-og` passed. Eleventy wrote `1455` files, Pagefind indexed `1434` pages across `2` languages with `21` filters, and the SEO dashboard reported `pages=1442`, `missingDescription=0`, `missingOgImage=0`.

## 13. Unit-Test Results

`npm run test:unit` passed with `389/389` tests green across `80` suites.

## 14. Pagefind Audit

`node scripts/audit-thesis-pagefind.js` passed. Title queries: `8/8` detail documents found and `8/8` ranked top1. Author queries: `4/4` found and `4/4` top1. Filter-only queries: `4/4` found and `3/4` top3.

## 15. Browser Smoke Results

Combined writings + theses smoke passed: `PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_PORT=4175 npx playwright test --workers=1 tests/f2-find-explore-smoke.spec.js tests/f3a-theses-find-explore.spec.js` returned `5 passed`.

## 16. Accessibility Results

`npm run test:a11y` passed with `31 passed`. This covers accessibility, navigation, and contrast regression checks.

## 17. CI / GitHub Status

GitHub connector status for PR head commit `face314c8b518aa5286527969722d56511e08e6b` returned an empty status list: `statuses: []`. No failing GitHub checks were exposed through the connector. PR #84 was mergeable and was merged after the local verification gate passed.

## 18. PR And Merge Information

PR: #84, `Theses Find & Explore v1`, https://github.com/LaruX75/www/pull/84.

Merged: yes. PR head commit: `face314c8b518aa5286527969722d56511e08e6b`. Merge commit: `a18011f596f139395e48536f3292b66dd900c072`. Merge timestamp: `2026-08-14T09:06:54Z`.

## 19. Tag And Verified Target

Annotated tag: `find-explore-theses-v1`. Verified target: `a18011f596f139395e48536f3292b66dd900c072`, exactly the F3A merge commit.

## 20. Remaining Limitations

Filter-only thesis browsing is intentionally broader than exact title/author search, so the expected document is not guaranteed to rank first, although it remains discoverable. Abstract coverage remains source-backed; missing abstracts are not AI-generated. No F3B publication expansion decision is included in this closure.

## 21. Explicit Closure Status

The F3A gate is closed: build, unit tests, thesis built-output audit, thesis Pagefind audit, writings regression audit, combined browser smoke, accessibility/navigation/contrast, PR merge, and annotated tag are green.

FIND & EXPLORE THESES V1 = CLOSED / GREEN
