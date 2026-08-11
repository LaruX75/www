# Writings Architecture Parity Report — 2026-08-11

## Scope

This report closes the writings pilot after checkpoints W1-W5.

- W1: canonical writings dataset + allowlist public projection
- W2: FI `/kirjoitukset/` on canonical dataset
- W3: EN `/en/writings/` on canonical dataset
- W4: legacy cleanup + materials exception audit
- W5: full parity gate (build, built output, accessibility, navigation, contrast)

## Final architecture

Shared local writings + canonical publications page data
→ canonical `writingsPage.items`
→ allowlist public projection
→ `/data/writings-page.json`
→ FI `/kirjoitukset/`
→ EN `/en/writings/`

The endpoint is the public runtime contract. FI uses a documented compatibility subset view model. EN uses the full canonical writings dataset with the already-audited materials summary-only exception.

## Parity outcome

- Canonical total: `290`
- FI compatibility subset: `126`
- EN visible total: `290`
- FI parity: `126 == 126`
- EN parity: `290 == 290`
- No unexplained missing or extra runtime items remain
- EN scientific-publication differences remain intentional:
  - 3 deduped Research.fi legacy rows removed
  - 3 manual fallback publications included by canonical rule

## Runtime audit

- FI runtime reads only `/data/writings-page.json`
- EN runtime reads only `/data/writings-page.json`
- No direct runtime fetches remain to `content.json`, `publications.json`, `initiatives.json`, or `researchfi.json`
- No raw heterogeneous source branching remains in the writings clients
- Materials remains a page-level summary/navigation block, not an itemized writings section

## EN mapper note

`_enMapCanonicalWritingsRecord` and `_enMapCanonicalPublicationRecord` remain in `src/en/writings.njk`, but they are now view mappers, not legacy normalization.

They:

- read canonical items only
- do not fetch or merge heterogeneous sources
- do not contain source-specific branching
- derive display fields needed by the EN table rendering

Because of that, they are acceptable in W5 and do not block pilot closure.

## Verification

Passed on 2026-08-11:

- `CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --quiet`
- `node --test tests/unit/writingsPage.test.js`
- `node scripts/audit-writings-page-projection.js`
- `node scripts/audit-writings-fi-client-parity.js`
- `node scripts/audit-writings-en-client-parity.js`
- `node scripts/audit-writings-legacy-runtime.js`
- `node scripts/audit-writings-built-output.js`
- `PLAYWRIGHT_PORT=4183 PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js`

Playwright result: `31/31 passed`

## Note on the repo-level wrapper

`npm run test:a11y` still fails earlier in the repo-wide pipeline because `check:researchfi-integrity` reports unrelated publication metadata issues. That is outside the writings pilot scope.

For W5, the UX gate was therefore validated directly against the built `_site` with the full Playwright accessibility, navigation, and contrast suite.

## Closure decision

Writings pilot status: `CLOSED`

Canonical object → public projection → page/runtime model has now been demonstrated end-to-end for writings in both FI and EN without UI redesign.
