# IMPACT-CITATION-DISPLAY-01

Status: `PROVEN`

## Problem

The English homepage rendered a historical `600+` fallback in the citation KPI failure path.

Current repo evidence showed the loader cache already held a materially different real value (`profileTotalCitations: 1022`), so the fallback understated known evidence and looked like a live numeric claim.

## Citation data flow

```text
OpenAlex + Semantic Scholar
→ src/_data/semanticscholar.js
→ .cache/api-fallback/citations-openalex-semanticscholar.json
→ semanticscholar.metrics
→ src/en/index.njk
→ SSR HTML
```

Observed current loader behavior:

- fresh cache exists: return cached `data`
- fresh cache missing: try both live providers in parallel
- either live provider succeeds: merge maxima into `metrics`, write cache, return data
- both live providers fail and any cache exists: return the last successful cached `data`
- no live success and no cache: return `{ metrics }` with no usable citation count

## Failure behavior before

- `src/_data/semanticscholar.js` exposes `metrics.profileTotalCitations`
- `src/en/index.njk` incorrectly read `metrics.totalCitations`
- the lookup therefore fell through to `"600+"` in two homepage locations
- baseline built `/en/` HTML contained two visible `600+` citation claims

This was a template-field mismatch plus an untruthful numeric fallback, not a provider-architecture failure.

## Duplicate display review

The same citation metric appeared twice on the EN homepage:

- University Lecturer card
- Publications card

Only the Publications card had distinct narrative value for citations. The University card already retains its own local KPI (`theses supervised`), so the duplicate citation display was removed instead of fixing the same fallback twice.

## Implementation

- `src/en/index.njk`
  - derives `homeCitationCount` from `semanticscholar.metrics.profileTotalCitations`
  - removes the duplicate citation KPI from the University Lecturer card
  - renders the remaining Publications citation KPI only when a real count exists
- `tests/unit/homeCitationDisplay.test.js`
  - locks out the stale `600+` fallback
  - asserts the template uses `profileTotalCitations`
  - verifies the KPI renders only when a usable metric exists

No JavaScript, runtime fetch, JSON endpoint, or content-model change was introduced.

## Failure behavior after

- truthful metric available from live/cache path: render the actual count
- no usable metric available: omit the citation KPI entirely
- no fabricated numeric fallback remains in the homepage failure path

The existing loader cache fallback still returns the last successful cached metric when live providers fail. This may be older than a fresh live fetch, but it remains a real previously observed value rather than an invented replacement number.

## Tests

- `git diff --check` passed
- `npm run build:local:full` passed
  - current branch: `[11ty] Copied 275 Wrote 1471 files in 319.72 seconds`
- `npm run test:unit` passed after build: `695/695`
- `npm run check:i18n-seo` passed
- `npm run check:researchfi-integrity` passed
- `npm run check:jsonld` remained on the known unrelated baseline:
  - `errors=1 warnings=63`
  - rules: `article-headline-length: 63`, `html-entity-leak: 1`
- Focused browser regression set passed:
  - `tests/impact-ux-01-home-recognition.spec.js`
  - `tests/ux1c-mobile-home-hero-proof.spec.js`
  - `tests/accessibility.spec.js`
  - `tests/navigation.spec.js`
  - `tests/contrast.spec.js`
  - result: `47 passed`

## Performance

Built EN homepage HTML:

- baseline `main`: `152025` bytes
- fixed branch: `151829` bytes
- delta: `-196` bytes

Baseline built HTML contained two visible `600+` citation claims.

Fixed built HTML contains one visible citation KPI with the real cached value (`1022`) and no `600+` occurrence.

## Architecture

Citation data remains build-time derived.

Nunjucks remains the renderer.

No hardcoded historical citation fallback remains in the homepage failure path.

No JavaScript or runtime API fetch was introduced.

IMPACT-UX-01 remains `CLOSED / GREEN / MAIN`.

PF5 remains `CLOSED / MAINTENANCE`.

AC1 remains `CLOSED / GREEN / MAIN`.

## Verdict

IMPACT-CITATION-DISPLAY-01 PROVEN — homepage citation evidence now fails truthfully when live/cached data is unavailable
