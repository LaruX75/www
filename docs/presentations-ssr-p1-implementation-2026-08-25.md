# Presentations SSR-P1 Implementation

- Implementation date context: Monday, August 24, 2026.
- Requested document filename: `docs/presentations-ssr-p1-implementation-2026-08-25.md`.
- Baseline SHA: `2ef8f2871669d7078afa77f96505bb13590724a2`
- Audit reference: `audit/presentations-ssr-closure` @ `2f63f1a068786b742ba8d49936d65d57f0dc3068`

## Scope

This change implements only the SSR P1 slice agreed in the audit:

1. Source-specific presentation sections
2. Featured presentation selection/rendering
3. Year/topic option generation

The interactive archive search, filtering, and pagination runtime remains in place.

## Before Data Flow

Before this change:

1. `src/_data/presentationsPage.js` built the canonical/enriched presentation item set.
2. `/data/presentations-page.json` exposed that canonical item set to the browser.
3. `src/js/presentations-page.js` fetched the JSON and then:
   - grouped items by source
   - chose featured items
   - generated source-section HTML
   - generated duplicate desktop/mobile source markup
   - generated year `<option>` elements
   - generated topic `<datalist>` options

Result: the FI source sections rendered as empty JS mount points in initial HTML and the year/topic controls were also populated after runtime execution.

## After Data Flow

After this change:

1. `src/_data/presentationsPage.js` now builds deterministic SSR projections from the same canonical enriched records.
2. Nunjucks renders source sections, featured cards, and year/topic options directly into initial HTML.
3. `src/js/presentations-page.js` is reduced to archive-only interactivity:
   - search query state
   - year/topic state
   - canonical archive filtering
   - pagination/load more
   - archive card rendering

The runtime JSON endpoint is retained unchanged for archive interactivity.

## SSR View-Model Additions

`buildPresentationsPageModel()` now exposes:

- `filterYears`
- `filterTopics`
- `sourceSections.fi`
- `sourceSections.en`

Each source section carries stable SSR-ready metadata and projections:

- `key`
- `icon`
- `label`
- `ctaLabel`
- `detailCtaLabel`
- `count`
- `featuredItem`
- `rows`
- `items`

This remains a projection over canonical records rather than a new independent data model.

## Source Grouping Parity

Source section ordering is now owned by build-time logic through `SOURCE_SECTION_KEYS`:

1. `aoe`
2. `canva`
3. `slideshare`
4. `youtubeVideos`
5. `youtube`

The old browser-only grouping helper `sourceItemsByKey()` was removed and replaced by `buildPresentationSourceSections()` in `src/_data/presentationsPage.js`.

## Featured Parity

Featured selection now happens at build time by using the first deterministically sorted item in each projected source group as `featuredItem`.

Removed browser-side featured logic:

- `sourceFeaturedHtml()`
- the featured branch inside `wireSourceSections()`

SSR now renders featured cards in initial HTML before any runtime fetch completes.

## Year / Topic Option Parity

Year and topic option derivation moved from the browser into `src/_data/presentationsPage.js`:

- `buildPresentationFilterYears()`
- `buildPresentationFilterTopics()`

Removed browser-side option builders:

- inline year `Set + sort + appendChild` block
- `topicOptions()`
- inline topic `<option>` append loop

Archive JS still binds to the same controls, but the controls are now prepopulated in HTML.

## FI / EN Decision

Current behavior was preserved rather than redesigned.

Explicit preserved rule:

- FI and EN both derive from the shared canonical presentation model.
- EN source sections keep the current special-case behavior where only `canva` membership is filtered to `item.lang === "en"`.
- Other source-section memberships were not reinterpreted or "fixed" in P1.
- EN archive behavior was not redesigned in this slice.

This matches the audit instruction to preserve current behavior unless a broader language-model change is explicitly scoped.

## Landing Semantics

Landing behavior remains canonical-data-driven.

SSR and runtime both continue to preserve:

- `landingUrl`
- `landingType`
- `externalFirst`
- `localPageUrl`
- `pageUrl`
- `sourceUrl`
- `externalUrl`

Browser regression coverage on Monday, August 24, 2026 verified:

- local-first archive landing
- external-first Canva landing
- combined search/year/topic filtering before navigation

No client-side source landing resolver was added.

## Runtime JSON Retained

`/data/presentations-page.json` remains in place and its public contract was not changed.

Important boundary:

- source sections no longer depend on the JSON fetch for initial rendering
- archive interactivity still depends on the JSON fetch

Observed browser fetch count remained unchanged for archive runtime: one fetch to `/data/presentations-page.json` during archive initialization.

## JS Deletion Ledger

Removed from `src/js/presentations-page.js`:

- `SOURCE_PAGE_SIZE`
- `SOURCE_SECTION_KEYS`
- `SOURCE_META`
- `sortByDateDesc()`
- `directSourceUrl()`
- `topicOptions()`
- `sourceItemsByKey()`
- `keywordBadges()`
- `sourceFeaturedHtml()`
- `renderSourceTableRows()`
- `renderMobileSourceList()`
- `wireSourceSections()`
- runtime year option population block
- runtime topic option population block
- source-section init path inside `init()`

Retained in `src/js/presentations-page.js`:

- archive card rendering
- archive filtering
- archive pagination
- exact-topic normalization
- archive UI event wiring

## No-JS Behavior

After this change, with site JS unavailable:

- source section structure is present in initial HTML
- featured items are present in initial HTML
- source links are present in initial HTML
- year/topic controls are present as static form controls
- archive orientation content remains present

Interactive search/filter/pagination still degrades without JS, which is expected and still out of scope for P1.

## Accessibility / SEO Impact

Positive changes in this slice:

- meaningful source headings are now in initial HTML
- presentation titles and links are now present without waiting for browser JS
- the duplicate client-generated desktop/mobile source markup path was removed
- year/topic controls are associated with labels in SSR output

No shared Pagefind/search files were changed in this slice.

## Measurements

Measured against baseline `2ef8f2871669d7078afa77f96505bb13590724a2` on Monday, August 24, 2026:

- `src/js/presentations-page.js` LOC before: `616`
- `src/js/presentations-page.js` LOC after: `327`
- Net JS LOC removed from that file: `289`
- Git diff for that file: `12` inserted / `301` deleted lines
- Client-side presentation HTML formatter helpers before: `5`
- Client-side presentation HTML formatter helpers after: `1`
  - Before: `archiveCardHtml`, `keywordBadges`, `sourceFeaturedHtml`, `renderSourceTableRows`, `renderMobileSourceList`
  - After: `archiveCardHtml`
- Runtime JSON fetch count: unchanged at `1`
- SSR source-section item count before initial render: `0` meaningful source items in initial HTML
- SSR source-section render after on FI page:
  - `4` source section headings
  - `3` featured source cards
  - `3` source tables
- SSR year/topic options before initial render: `0 / 0`
- SSR year/topic options after on FI page: `21 / 406`
- Duplicated desktop/mobile source DOM before: `2` client render paths per populated source group
- Duplicated desktop/mobile source DOM after: `1` SSR source representation path, `0` JS source-list clones

## Tests

Verified on Monday, August 24, 2026:

- `git diff --check`
- `npm run test:unit`
  - result: `531` passing, `0` failing
- `PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/presentations-source-ssr.spec.js`
  - result: `3` passing
- `PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/presentations-archive.spec.js --grep "FI archive"`
  - result: `1` passing
- Targeted build:
  - `CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --input=src/esitykset.njk`
  - passed
- Targeted build:
  - `CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --input=src/data/presentations-page.json.11ty.js`
  - passed

Full build note:

- `npm run build:no-og` was started on Monday, August 24, 2026.
- The build repeatedly progressed through data loading and cache-backed content prep, but did not return a terminal success line before manual interruption.
- Because of that, the full build cannot be reported as cleanly completed in this implementation note.

## Deferred Work

Still explicitly out of scope after P1:

- archive search/filter implementation rewrite
- archive pagination rewrite
- full Pagefind presentations decision
- removing `/data/presentations-page.json`
- EN language-model redesign
- Media / Writings / global search follow-on work
- BBS / Gopher / theme work
