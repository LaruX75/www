# F3C-P4 — Presentation Pagefind discovery quality

Date: 2026-08-14

## 1. Scope

This report covers the canonical `FindExplore:presentations` Pagefind scope only. It does not migrate the `/esitykset/` UI, does not add presentations to Research, and does not reopen P2 or P3 curation decisions.

## 2. P3 historical baseline

- P3 commit: `f1f5cebd4382147df7022221e765bf59e78886e7`
- Historical canonical total: 218
- Historical local detail pages: 139
- Historical representation total: 231

## 3. Post-P3 Canva linkage fix

- Verified current Canva canonical total: 79
- Canva with verified designId: 79
- Canva with local pageUrl: 16
- Restored designId-based local mappings verified in current build: 12/12

## 4. Current-state baseline

- Canonical presentations: 218
- Built local detail pages: 139
- Reconciled local details: 139/139
- Preferred local landings: 138
- Preferred external landings: 80
- Representations: 231
- Discovery identities: 218
- Duplicate discovery identities: 0

## 5. Differences from P3 baseline

- Canonical identity remains 218.
- Representation total remains 231.
- Preferred local landings increased to 138 and external-first decreased to 80 because current Canva linkage restores verified local relationships.
- Local-detail reconciliation remains complete.

## 6. Existing HTML audit

- Local preferred + local HTML: 138
- External preferred + usable local HTML: 3
- External preferred + no suitable local HTML: 77
- No valid index candidate: 0
- Multiple local HTML representations: 1

## 7. Canva HTML/linkage audit

- Canva canonical total: 79
- Canva with actual local HTML: 18
- Canva preferred-local / preferred-external: 16 / 63
- Canva using local HTML as index document: 17
- Canva requiring another indexing mechanism: 62
- Canva duplicate discovery identities: 0

## 8. Identity vs HTML vs landing distinction

- Canonical identity count remains 218.
- Existing local HTML is reused where present, but result destination is carried separately in `PresentationLandingUrl`.
- External-first items remain external-first even when indexed through existing local HTML.

## 9. Pagefind indexing architecture

- Existing HTML documents indexed: 1442
- Presentation scope local index documents: 139
- Presentation scope custom records: 79
- New generated public HTML documents solely for P4: 0

## 10. FindExplore:presentations implementation

- Scope filter: `FindExplore:presentations`
- Filter keys present in Pagefind: FindExplore, Kieli, PresentationEvent, PresentationLandingType, PresentationMediaType, PresentationSourceType, PresentationTopic, PresentationYear
- Local HTML candidates carry injected Pagefind metadata at indexing time only.
- Missing external-first identities are supplied as Pagefind custom records without creating public HTML pages.

## 11. Index document vs result destination

- Current title sample with correct preferred destination metadata: 20/20
- External-first records with local HTML index documents remain externally routed via `PresentationLandingUrl`.

## 12. Metadata contract

| field | classification | notes |
| --- | --- | --- |
| FindExplore | FILTER | canonical presentation scope selector |
| PresentationId | META | canonical discovery identity |
| PresentationYear | BOTH | useful, low-cardinality archive filter |
| PresentationTopic | FILTER | reliable enough for future explicit archive filters |
| PresentationEvent | FILTER | kept structured, but future exposure should stay optional |
| PresentationType | META | captured, but not exposed yet |
| PresentationRole | META | coverage too sparse for exposed filter |
| PresentationLanguage | META | kept for future UI logic and auditability |
| PresentationMediaType | BOTH | stable controlled vocabulary |
| PresentationSourceType | BOTH | stable technical provenance field |
| PresentationLandingType | BOTH | needed to preserve local vs external routing |
| PresentationLandingUrl | META | authoritative result destination |

## 13. Canonical deduplication

- Discovery identities: 218
- Duplicate discovery identities: 0
- Shared local HTML conflicts resolved via custom-record fallback: 2

## 14. Title quality

| sample | found | top3 | top1 | correctLanding |
| --- | --- | --- | --- | --- |
| 20 | 20 | 20 | 19 | 20 |

## 15. Topic quality

| value | expected | found | missing | unexpected |
| --- | --- | --- | --- | --- |
| Koulutusteknologia | 96 | 87 | 9 |  |
| koulutusteknologia | 56 | 48 | 8 |  |
| Opettajankoulutus | 41 | 39 | 2 |  |
| Generation AI | 27 | 20 | 7 |  |
| TVT | 27 | 27 |  |  |
| tekoälylukutaito | 25 | 21 | 4 |  |

## 16. Event quality

| value | expected | found | missing | unexpected |
| --- | --- | --- | --- | --- |
| ITK 2026 (Tampere) | 2 | 2 |  |  |
| KTPK 2025 (Kasvatustieteen päivät) | 2 | 1 | 1 |  |
| Kulosaaren yhteiskoulu (KYK) | 2 | 1 | 1 |  |
| OPH-hanke kieltenopettajille (Kieli 2025) | 2 | 2 |  |  |

## 17. Year quality

| value | expected | found | missing | unexpected |
| --- | --- | --- | --- | --- |
| 2025 | 41 | 33 | 8 |  |
| 2024 | 27 | 19 | 8 |  |
| 2014 | 21 | 19 | 2 |  |
| 2013 | 18 | 14 | 4 |  |

## 18. Type quality

- Coverage: 218/218
- Recommendation: DEFER

## 19. Role quality

- Coverage: 75/218
- Recommendation: DO NOT EXPOSE

## 20. Language quality

- Coverage: 190/218
- Recommendation: DEFER

## 21. MediaType assessment

- Vocabulary: slides (194), video (11), document (9), videoSeries (3), webMaterial (1)
- Recommendation: OPTIONAL

## 22. SourceType assessment

- Vocabulary: slideshare (115), canva (79), youtube (14), aoe (9), ouka (1)
- Recommendation: DO NOT EXPOSE

## 23. External-first behavior

- External-first canonical total: 80
- External-first with usable local HTML: 3
- External-first requiring custom records: 77

## 24. Local-first behavior

- Local-first canonical total: 138
- Local-first with reusable existing HTML: 138

## 25. Canva-specific behavior

- Restored 12 mappings verified in built HTML: 12/12
- Canva with pageUrl: 16
- Canva with actual local HTML: 18

## 26. Aggregate competition

| archiveOrTaxonomyHitsInTitleSample | archiveAheadOfExpectedInTitleSample |
| --- | --- |
|  |  |

## 27. Ranking/index changes

- Narrow change only: Pagefind service indexing replaced raw CLI indexing to allow canonical presentation scope metadata and targeted custom records.
- No client-side search UI code changed.

## 28. Presentation regressions

- Canonical total remains 218.
- Local detail reconciliation remains complete.
- No duplicate discovery identities were introduced.

## 29. Writings regressions

- Closed-scope audit status: PASS (`node scripts/audit-writings-built-output.js`, `node scripts/audit-writings-page-projection.js`)

## 30. Theses regressions

- Closed-scope audit status: PASS (`node scripts/audit-thesis-details-parity.js`, `node scripts/audit-thesis-pagefind.js`)

## 31. Publications regressions

- Closed-scope audit status: PASS (`node scripts/audit-publication-details-parity.js`, `node scripts/audit-publications-page-projection.js`, `node scripts/audit-publication-pagefind.js`)

## 32. F4 Research regression

- Closed-scope audit status: PASS (no dedicated `/tutkimus/` built-output audit script in repo; browser smoke passed and P4 introduced no research-scope code changes)

## 33. Build/unit/browser results

- `npm run build:no-og`: PASS
- `npm run test:unit`: PASS (395/395)
- Presentation browser smoke: PASS (`PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/presentations-research-smoke.spec.js --config playwright.config.js`)

## 34. Performance/build-output impact

- Generated HTML page count: 1442
- Pagefind indexed HTML documents: 1442
- Presentation discovery local documents: 139
- Presentation discovery custom records: 79
- New public HTML pages for P4: 0
- Public JSON delta: 0 new public JSON endpoints
- Client JS delta: 0 client JS changes

## 35. Readiness matrix

| aspect | status | evidence |
| --- | --- | --- |
| Title | READY | 20/20 found, 19 top1 |
| Year | PARTIAL | 2025:33/41, 2024:19/27, 2014:19/21, 2013:14/18 |
| Topic | PARTIAL | Koulutusteknologia:87/96, koulutusteknologia:48/56, Opettajankoulutus:39/41, Generation AI:20/27, TVT:27/27, tekoälylukutaito:21/25 |
| Event | PARTIAL | ITK 2026 (Tampere):2/2, KTPK 2025 (Kasvatustieteen päivät):1/2, Kulosaaren yhteiskoulu (KYK):1/2, OPH-hanke kieltenopettajille (Kieli 2025):2/2 |
| Type | PARTIAL | 218/218 carry presentationType |
| Role | PARTIAL | 75/218 carry role |
| Language | PARTIAL | 190/218 carry language metadata |
| MediaType | READY | 5-value controlled vocabulary |
| SourceType | READY | 5-value controlled vocabulary |
| PreferredLanding | READY | 20/20 title-sample destinations correct |
| CanonicalDeduplication | READY | 218 identities, 0 duplicates |
| ExistingHtmlReuse | READY | 139 reused local HTML documents, 0 new public pages |
| ExternalFirstIndexing | PARTIAL | 3 reuse local HTML, 77 use custom records |

## 36. Recommended future filters

| field | recommendation |
| --- | --- |
| freeTextSearch | INCLUDE |
| year | INCLUDE |
| topic | INCLUDE |
| event | OPTIONAL |
| presentationType | DEFER |
| role | DO NOT EXPOSE |
| language | DEFER |
| mediaType | OPTIONAL |
| sourceType | DO NOT EXPOSE |

## 37. F3C migration decision

- Decision: PARTIAL

## 38. F4 Research readiness

- Decision: YES AFTER TOPIC-MAPPING REVIEW

## 39. F3D dependency

- Decision: NO

## 40. Remaining limitations

- Presentation scope result destination metadata is ready, but the archive UI has not yet been migrated to consume it.
- Role and language semantics are retained as metadata but are not yet strong enough to justify exposed filters.

## 41. Closure readiness

- P4 discovery scope is implemented and auditable.
- Canonical identity and landing semantics remain intact.
- The smallest future archive migration should expose free-text search, year, and topic first.
