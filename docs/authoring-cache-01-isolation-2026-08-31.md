# AUTHORING-CACHE-01 — API fallback cache isolation for authoring previews

STATUS: PROVEN / LOCAL

## Baseline

- Base `main`: `494c0ee1c112cce212603f82666b262f6fabcbd4`
- Branch: `fix/authoring-cache-isolation-01`
- Scope: `www` only

## Blocker

`src/_data/_apiCache.js` previously resolved its cache root unconditionally to:

```text
<process.cwd()>/.cache/api-fallback
```

That is correct for normal `www` builds, but it makes isolated authoring previews mutate tracked cache files inside the preview worktree.

Observed tracked mutations in authoring-related local runs:

- `.cache/api-fallback/crossref-enrichments-v1.json`
- `.cache/api-fallback/jufo-enrichments-v1.json`

## Change

Add one optional environment contract:

```text
API_FALLBACK_CACHE_DIR
```

Semantics:

- unset, empty, or whitespace-only: keep exact existing behavior
- configured: both cache reads and cache writes use the configured directory
- relative override: resolved with `path.resolve(...)` against the current working directory
- write failure: warn and keep existing bounded failure behavior
- configured failure does not fall back to the repo cache root

## Consumer audit

Existing `_apiCache` consumers remain unchanged:

- authoring helpers: YouTube metadata, DOI metadata
- build/data loaders: Research.fi, Research.fi content, Semantic Scholar, Finna, Finna AOE, theses, SlideShare, GitHub changes, Oulu council videos
- build/support scripts: publication abstract enrichment, related integrity/build flows
- offline/CI callers: unchanged because default path remains `<cwd>/.cache/api-fallback`

No domain-specific cache fork was introduced.

## Verification

Focused cache tests:

- default path round-trip uses `<cwd>/.cache/api-fallback`
- absolute override redirects read and write
- empty override uses default
- whitespace-only override uses default
- relative override resolves deterministically
- configured write failure warns and does not fall back into repo cache

Focused authoring regressions:

- AP-01 presentation preview: PASS
- AP-02 DOI publication preview: PASS
- AP-03 canonical writer: PASS

Additional verification:

- `git diff --check`: PASS
- `npm run test:unit`: first run reported `591` pass / `6` fail; all six failures were the known benchmark tests in `tests/unit/searchQualityRegressionBenchmark.test.js` because `_site/pagefind/pagefind-entry.json` did not yet exist in that worktree
- `npm run build:local:full`: attempted; local run progressed through Eleventy output generation (`1745` rendered files observed under `_site`) but did not terminate within the observed window, so it is not used as the primary proof for this slice

## Real smoke

Authoring-style preview proof was run with:

- proof commit: `2ff83c8d96d009acdc59b20a78d8726668e5e8d7`
- preview clone: `/private/tmp/www-authoring-cache-01-smoke-2ff83c8d`
- override root: `/var/folders/kd/2r7zkgr12_l4h1h4y7s10_ch0000gq/T/authoring-cache-smoke-6qwi5t/api-fallback`
- path exercised: real programmatic presentation Eleventy preview
- preview result: `pagesProcessed=2`, `htmlBytes=92740`, `elapsedMs=1784`
- external cache evidence: `16` JSON files present, including `crossref-enrichments-v1.json` and `jufo-enrichments-v1.json`
- worktree cache status after preview: `git status --short -- .cache/api-fallback` returned empty output

Required outcome:

- cache files resolved under the external override root
- preview did not dirty `<worktree>/.cache/api-fallback`

## Deletion / duplication audit

No workaround removal was needed.

Expected answer:

```text
none — APP-02 correctly stopped before adding one
```

## Out of scope

- `jarilaru-authoring` changes
- `node_modules` worktree provisioning
- cache schema / TTL / network semantics
- Pagefind
- canonical content semantics

## Architecture

- Canonical content remains the source of truth.
- Eleventy/Nunjucks remains the rendering authority.
- `_apiCache` remains the single API fallback cache authority.
- The new contract changes only cache location ownership when explicitly configured.
- Default `www` cache behavior remains unchanged.
- No private-app cache implementation or cleanup workaround was introduced.
- Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.
