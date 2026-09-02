# JSONLD-ENTITY-01 — Remove presentation html-entity-leak

**Status:** PROVEN
**Date:** 2026-09-02
**Base SHA at implementation:** `8568c5834240d7f53d45600d70eb10aee62e3bb8`

## Reproduction

On `main`, `npm run check:jsonld` reported one persistent baseline error:

```
[check-jsonld] ongelmasäännöt:
  article-headline-length: 63
  html-entity-leak: 1
[check-jsonld] raportti: reports/jsonld-validation.json
```

The single html-entity-leak was in:

```
presentations/ss-koe-oppimisymparistona-osa-i/index.html
PresentationDigitalDocument: HTML-entiteettejä JSON-arvoissa (&quot;/&amp;)
```

Reproduced with `rm -rf _site && DISABLE_OG_IMAGES=true CACHE_ONLY=true npm run build:local && DISABLE_OG_IMAGES=true node scripts/run-pagefind.js && npm run check:jsonld` before any code change.

## Offending JSON-LD

Inside the `PresentationDigitalDocument` `@graph` node of that page's JSON-LD block:

```
"description":"Koe oppimisympäristönä1. osaEtäopettajapäivät20.11.2009Panu KelaOulun aikuislukio Arviointi lukiolaissa&quot;Opiskelijan arvioinnilla pyritään ohjaamaan ja..."
```

A literal `&quot;` sequence appeared inside the JSON string value where the source intended a double-quote character. JSON strings should not contain HTML entities; the character should be a plain `"` escaped as `\"`.

The same leak also appeared (in double-encoded form `&amp;quot;`) in the page's `<meta name="description">`, `og:description`, `twitter:description`, and the visible `.content-detail-lead` paragraph.

## Root cause

Trace:

1. `slideshare-content.json` (root-level captured content file) entry index `[104]` for URL `https://www.slideshare.net/slideshow/koe-oppimisymparistona-osa-i/2542679` contains a `transcript` field where the original SlideShare quotes were **scraped as HTML entities** (`&quot;`). Five files in that JSON contain `&quot;` in transcripts (only one currently produces a leak visible to `check:jsonld` because only its description ends up inside a JSON-LD block).
2. `src/_utils/presentationDerivedMetadata.js` — `derivePresentationMetadata()` is spread into every local presentation record inside `src/_data/presentationSources.js:65`. For slideshare items whose local `description` is a generic placeholder (`"SlideShare-esitys"`), the module's `deriveSlideshareDescription()` falls through to `transcriptExcerpt(match?.transcript || "")` and returns the transcript text **without decoding HTML entities**. This becomes the presentation's `description`.
3. That description then flows through `buildCanonicalPresentationPageRecords` and `presentations.11tydata.js:90` `eleventyComputed.description` into the template, where:
   - Nunjucks HTML-escapes it for `<meta content="…">` → `&amp;quot;` (double-encoded, ugly)
   - It goes into JSON-LD (`_ldschema.njk:141`) as a JSON string value → the raw `&quot;` bytes remain
4. `check:jsonld` flags the raw `&quot;` in JSON as `html-entity-leak`.

A second duplicate `transcriptExcerpt` existed in `src/_data/presentationsPage.js:450` (used by `createSlideshareItems` for the canonical projection layer) with the same bug, but was masked because `buildCanonicalPresentationPageRecords:1212` prefers `item?.description` (already set by `derivePresentationMetadata`) over `canonicalItem?.description`.

Classification per §5 audit categories: **A — canonical source (transcript) contains HTML entities where plain text belongs**, combined with **B/C — helper does not normalize**.

## Authoritative source

- Root-level `slideshare-content.json` is the captured transcript source. It should ideally contain plain text; the entities are a scraper artefact.
- The fix belongs at the **narrowest correct helper layer** (per §7): decode entities where transcript text is consumed for presentation descriptions.

## Current data flow

```
slideshare-content.json (contains &quot;)
  ↓
src/_data/presentationSources.js:65
  → ...derivePresentationMetadata(baseRecord)
    ↓
src/_utils/presentationDerivedMetadata.js
  → deriveSlideshareDescription(item, match)
  → transcriptExcerpt(match?.transcript)    ← fixed here
    ↓
sourceData.presentations[].description
  ↓
buildCanonicalPresentationPageRecords → record.description
  ↓
presentations.11tydata.js eleventyComputed.description
  ↓
presentation-item.njk `content-detail-lead` + _meta.njk meta/og/twitter + _ldschema.njk JSON-LD
```

## Fix

Two-file editorial-narrow fix:

1. **`src/_utils/presentationDerivedMetadata.js`** — added `decodeHtmlEntities()` helper next to `transcriptExcerpt()` and invoked it as the first step of `transcriptExcerpt`. This is the code path actually executed by the source-record pipeline; fixing it here is what removes the leak.
2. **`src/_data/presentationsPage.js`** — applied the identical `decodeHtmlEntities()` + updated `transcriptExcerpt()` to the second copy that lives inside the canonical projection layer. Kept in parallel with the derived-metadata copy for correctness (belt-and-suspenders): the two module-local copies mirror the existing duplicate helper pattern in the repo. Also exported `decodeHtmlEntities` and `transcriptExcerpt` from `presentationsPage.js` for unit-test coverage.

Decode order matters: `&amp;` runs LAST so a hypothetical `&amp;quot;` in source data does not get double-decoded. Named + numeric entities covered: `&#nn;`, `&#xhh;`, `&quot;`, `&apos;`, `&lt;`, `&gt;`, `&nbsp;`, `&amp;`.

Both `transcriptExcerpt` implementations now:
1. Decode entities first
2. Normalize `---` separators to spaces
3. Collapse whitespace
4. Trim + slice with ellipsis at `maxLength = 420`

## Deletion / simplification

**Duplicate `transcriptExcerpt`** exists in `src/_utils/presentationDerivedMetadata.js` and `src/_data/presentationsPage.js`. Consolidation is a code-quality opportunity but not required for this fix; the two copies now match. Deferred to a separate cleanup workstream if pursued.

## Blast radius

- `deriveSlideshareDescription` (via `transcriptExcerpt`) is the only consumer of the derivedMetadata `transcriptExcerpt`. It affects every slideshare-source presentation description whose local frontmatter description is generic. **5 files** in `slideshare-content.json` currently have `&quot;` in transcripts:
  - 3. luento tieto- ja viestintätekniikan pedagogiset
  - 2. luento tieto- ja viestintätekniikan pedagogiset
  - TVT opetuskäytön historiaa [finnish]
  - Koe oppimisymparistona osa I  ← the one flagged by check:jsonld
  - TVT-opetuskäytön historiaa: visionääreistä web2.0
- All five now produce correctly decoded descriptions (plain `"` inside JSON-LD, `&quot;` in meta tags, single-encoded in visible HTML).
- The canonical `presentationsPage.js` `transcriptExcerpt` is only called by `getSlideshareDescription` → `createSlideshareItems`; same category of consumers.
- No other consumers found (`rg transcriptExcerpt src/` returns only these two files + the new unit test).

## Tests

New focused unit test: **`tests/unit/jsonldEntityDecode.test.js`** (9 test cases).

Coverage:
- `decodeHtmlEntities` — named entities, numeric decimal, numeric hex, `&amp;`-last ordering, empty/null input, non-entity text unchanged.
- `transcriptExcerpt` — decodes entities before normalization (reproduces the ss-koe-oppimisymparistona-osa-i scenario), normalizes `---` separators + whitespace, truncates with ellipsis, handles empty.

All 704 unit tests pass on the fix branch.

## Before / after

```
check:jsonld html-entity-leak:
before: 1  (presentations/ss-koe-oppimisymparistona-osa-i/index.html)
after:  0
```

Other JSON-LD baselines unchanged (`article-headline-length: 63` remains — separate concern, out of scope).

### Sample of the JSON-LD `description` value

**Before** (raw JSON string):
```
"...Arviointi lukiolaissa&quot;Opiskelijan arvioinnilla..."
```

**After**:
```
"...Arviointi lukiolaissa\"Opiskelijan arvioinnilla..."
```

### Sample of `<meta name="description">`

**Before** (double-encoded, visible in browsers as literal `&quot;`):
```
Arviointi lukiolaissa&amp;quot;Opiskelijan arvioinnilla…
```

**After** (correctly HTML-encoded quote):
```
Arviointi lukiolaissa&quot;Opiskelijan arvioinnilla…
```

## Parallel-main reconciliation

`IMPACT-CITATION-DISPLAY-01` (PR #190) merged to main during this work, advancing origin/main from `c5eed63d` to `8568c583`. This branch was fast-forwarded to include those changes before commit. Their fix (EN homepage citation display truthfulness) is in `src/en/index.njk` — completely disjoint from this task's scope (`src/_data/presentationsPage.js`, `src/_utils/presentationDerivedMetadata.js`).

## Architecture

- **Canonical presentation content remains authoritative.**
- **Nunjucks remains the JSON-LD renderer.**
- No browser-side metadata ownership was introduced.
- Pagefind is unchanged.
- Presentations remains **CLOSED / MAINTENANCE**.
- **Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.**

This is a normal editorial/data-hygiene regression fix. Does not reopen AC1.
