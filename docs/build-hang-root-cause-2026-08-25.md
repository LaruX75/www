# Build Hang Root Cause

Date: 2026-08-25
Branch: `fix/build-data-loader-memoization`

## Root Cause

Two heavy Eleventy `_data` loaders restarted multiple times during the same build process:

- `src/_data/theses.js`
- `src/_data/researchfi.js`

Current consumer fan-out meant separate callers launched the same network/cache-backed work independently during one Eleventy run.

Observed repeated local diagnostic sequences before the fix:

- `theses`: `6` loader starts in one sampled run
- `researchfi`: `3` loader starts in one sampled run

## Fix

Both loaders now use module-lifetime Promise memoization for the current Node process only.

Behavior:

- first caller creates the Promise
- concurrent and later callers in the same build receive the same Promise object
- resolved data shape is unchanged
- no cross-build persistence was added
- if an unexpected rejection escapes the loader, the memoized Promise is cleared so a later explicit retry can start fresh

## Consumer Scope

Examples of unchanged callers that now share one loader execution:

- `theses`: `researchProgram`, `thesisDetails`, `thesesArchivePagesFi`, `thesesArchivePagesEn`, `thesesFindExplorePage`
- `researchfi`: `publicationDetailPages`, `researchfiContent`, other existing direct consumers

## Verification

Focused unit coverage added:

- `tests/unit/buildDataLoaderMemoization.test.js`

Local diagnostic evidence after the fix:

- `theses`: `1` loader start in the sampled run
- `researchfi`: `1` loader start in the sampled run
- Eleventy progressed beyond the previous repeated loader phase into normal template/permalink rendering
- `npm run build:no-og` completed locally; Eleventy copied `273` and wrote `1471` files in `258.53` seconds, then Pagefind, SEO dashboard, and `check:researchfi-integrity` passed
- PR `#152` CI passed on 2026-08-25: `Staging checks / build-and-verify` and `Accessibility and navigation tests`

No data-contract changes:

- no returned-record schema changes
- no canonical normalization changes
- no public JSON changes
- no fallback-path redesign
