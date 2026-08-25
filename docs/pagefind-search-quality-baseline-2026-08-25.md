# Pagefind Search Quality Baseline — 2026-08-25

Branch: `audit/search-quality-regression-benchmark`
Baseline SHA: `1d4a42def281eb5a5b7a61b4801151f51b858c18`
Baseline run date: `2026-08-25`

## Corpus

- Pagefind version: `1.5.2`
- HTML documents indexed: `1459`
- Language pages in `pagefind-entry.json`: `fi=1068`, `en=316`
- Presentation scope local documents: `139`
- Presentation scope custom records: `79`
- Presentation canonical total: `218`
- Presentation local landing total: `138`
- Presentation external landing total: `80`

## Benchmark Query Set

Exact-title:

- `Assessing Digital Competence of K1-12 Teachers in Kosovo`
- `Computational thinking in collaborative programming discourse`
- `Edtech Info English07`
- `Lausunto Uutta suuntaa Suomen digitaaliseen kompassiin`
- `Pieni kielikone tekoäly-ymmärryksen rakentajana`
- `Tekoäly tekee petoksen koulutehtävissä helpoksi`
- `Generation AI projekti`

Presentation quality:

- `tekoälylukutaito`
- `mobiilioppiminen`
- `webinaari`
- `slideshare`
- `canva`

Generic pages:

- `Kosovo`
- `tekoäly`
- `citizen science`
- `mobile learning`

FI/EN:

- `Assessing Digital Competence of K1-12 Teachers in Kosovo`
- `Edtech Info English07`
- `How Can Higher Education Institutions Facilitate Open Science and Citizen Science Practices`
- `mobile learning`

Leak-token scan:

- `tekoälylukutaito`
- `mobiilioppiminen`
- `webinaari`
- `slideshare`
- `canva`
- `Kosovo`
- `tekoäly`
- `citizen science`
- `mobile learning`

## Findings

### Exact-title findings

- `7/7` audited exact-title fixtures resolved within the accepted top-3 window.
- All audited fixtures ranked `#1`, including publication, presentation, writing, thesis, media, and mixed writing/publication queries.

### Presentation quality findings

- `5/5` presentation-oriented topical queries met the benchmark contract.
- `tekoälylukutaito` kept presentation-like results in the top 3 with a local presentation at rank 1.
- `mobiilioppiminen` kept local presentation detail pages dominant at the top.
- `webinaari` surfaced presentation-source URLs in the top 3, but see P1 leak-token finding below.
- `slideshare` and `canva` both stayed anchored in presentation/archive surfaces rather than drifting to unrelated generic pages.

### Generic-page findings

- `Kosovo` stayed anchored in a concrete publication at rank 1, with supporting media and taxonomy pages behind it.
- `mobile learning` stayed anchored in concrete publications rather than archive shells.
- `citizen science` showed taxonomy/theme dominance over the intended media result; see P2 FI/EN finding below.
- No audited query returned `/api/*` or `/data/*` URLs in the top results.

### FI/EN findings

- Pagefind exposes both language bundles in `_site/pagefind/pagefind-entry.json`: `fi=1068`, `en=316`.
- English publication exact-title discovery is healthy: `Assessing Digital Competence...` ranked `#1`.
- English presentation exact-title discovery is healthy: `Edtech Info English07` ranked `#1`.
- English topical discovery is healthy for `mobile learning`, with concrete English-language publications at the top.
- Exact English media-title discovery is weak: `How Can Higher Education Institutions Facilitate Open Science and Citizen Science Practices` did **not** return `/mediassa/inos-project-interview-heis-open-science/` in the top 10; taxonomy and theme pages dominated instead.

### Leak-token result

Forbidden tokens audited:

- `slideshare|`
- `localDetail`
- `externalUrl`
- `landingUrl`
- `pageUrl`
- `sourceUrl`
- `education|research`
- `__find_explore_presentations__`

Result:

- `P1` failure: `__find_explore_presentations__` leaks into user-visible excerpts.
- Confirmed leak hits:
- query `webinaari`, rank `#2`, `https://www.youtube.com/watch?v=U4iFFFY3rhM`
- query `webinaari`, rank `#3`, `https://www.youtube.com/watch?v=fcDjAZZZs4U`
- query `tekoäly`, rank `#10`, `https://www.canva.com/d/F5-Wd95VzJy0JoP`

## Automated Tests Added

- `scripts/audit-search-quality-regression-benchmark.js`
- `tests/unit/searchQualityRegressionBenchmark.test.js`

Coverage:

- corpus/language bundle presence
- exact-title rank contracts
- presentation-result quality contracts
- English publication/presentation exact-title discovery
- internal `/api` and `/data` URL regression gate
- leak-token regression gate

## Priority Findings

### P1

- `search-leak-token-visible`: internal presentation seed token `__find_explore_presentations__` leaks into user-visible Pagefind excerpts for topical searches.

### P2

- `en-media-title-undiscoverable`: the exact English media title `How Can Higher Education Institutions Facilitate Open Science and Citizen Science Practices` was not discoverable in the top 10 despite being present in taxonomy/theme excerpts.

## Scope

No production search behavior, ranking logic, Pagefind metadata generation, canonical content, or result rendering was modified in this baseline task. Changes are limited to audit/test infrastructure and this report.

SEARCH QUALITY BASELINE STATUS: ACTION REQUIRED
