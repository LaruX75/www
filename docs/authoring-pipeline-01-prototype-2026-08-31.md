# AUTHORING-PIPELINE-01 Prototype

Date: 2026-08-31
Status: `PROTOTYPE / PROVEN / AUTHOR-TIME ONLY`
AUTHORING-PIPELINE-01 = `PROTOTYPE PROVEN`
Post-#177 base SHA: `bfd5d3a3004e2a4cbcd0d8b113b83d82255c6ee4`
Branch: `prototype/authoring-pipeline-01`

## Problem

The repository already has a canonical Presentation model, canonical
validation rules, and a production Eleventy/Nunjucks rendering pipeline.
What was missing was the smallest author-time path from one external
YouTube URL to a reviewable canonical draft preview without inventing a
second Presentation model, a second renderer, a server, or a CMS rewrite.

## Architecture

The prototype keeps the existing authority boundaries intact:

```text
YouTube URL
-> metadata proposal / evidence
-> canonical Presentation draft
-> canonical validation
-> Eleventy 3 programmatic preview
-> production-fidelity HTML
-> human review
```

Canonical Markdown/YAML remains the content authority.
Eleventy/Nunjucks remains the rendering authority.
Imported metadata remains proposal/evidence only.

## Existing infrastructure reused

- `src/_data/contentSchema.js` for current Presentation field semantics and controlled vocabularies
- `src/_data/contentContext.js` through the shared validator, while authoring validation explicitly disables inferred contexts
- `src/presentations/presentations.11tydata.js` for the real Presentation computed data pipeline
- `src/_includes/presentation-item.njk` for the real production layout
- `.eleventy.js` and the installed Eleventy 3.x programmatic API
- `src/_data/_apiCache.js` `fetchWithTimeout` for source fetching
- `src/_data/metadata-normalization.js` `slugifyTerm` for slug generation

## New code added

- `scripts/author-preview.js`
- `scripts/_lib/authoring/youtubeMetadata.js`
- `scripts/_lib/authoring/presentationDraft.js`
- `scripts/_lib/authoring/eleventyPreview.js`
- `src/_utils/canonicalContentValidation.js`
- `tests/unit/authoringPipeline.test.js`
- `tests/fixtures/authoring-pipeline/youtube-watch-larun-pikkuvinkit.html`

The old validation logic in `scripts/audit-content-schema.mjs` was
deduplicated into the shared helper instead of copied into a second schema.

## Metadata semantics

The YouTube adapter accepts one URL and proposes:

- `title`
- `date`
- `sourceUrl`
- `thumbnail`
- `sourceType`
- `description`

It normalizes `watch`, `youtu.be`, `shorts`, and `embed` URLs into one
canonical YouTube watch URL, preserving `list=` when present.

The adapter does not infer:

- `contexts`
- taxonomy
- research membership
- landing semantics not already supported by canonical rules

## Canonical draft and validation

The draft uses the real Presentation semantics already present in the repo:

- `title`
- `description`
- `date`
- `url`
- `sourceUrl`
- `thumbnail`
- `source`
- `type`
- `permalink`
- `contexts`

Validation happens before preview.
For authoring mode the validator keeps current collection rules and adds
strict Presentation checks for:

- required `title`, `date`, `type`
- ISO `YYYY-MM-DD` date shape
- absolute http(s) `sourceUrl`
- YouTube URL contract for YouTube presentations
- `/presentations/<slug>/` permalink shape
- explicit non-empty `contexts`
- rejection of local-path `sourceUrl`

Contexts are intentionally not resolved or guessed during authoring.

## Preview implementation

Preview uses Eleventy 3 programmatic `toJSON()` against a temporary input
file written under the OS temp directory, not under `src/presentations`.
That avoids accidental canonical content pollution and avoids test/build
cross-talk with repo files.

The temp Markdown draft sets the production Presentation layout directly:

- `layout: "presentation-item.njk"`
- `templateEngineOverride: "md"`

Preview output is written to:

`.tmp/authoring-preview/<slug>/index.html`

Temp input is deleted after success unless `--keep-temp` is used.
No permanent `/preview/` route, HTTP server, `_site` build, or Git action is introduced.

## Measurements

Live pass command:

```bash
npm run author:preview -- "https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY" --type esitys --contexts teaching --slug authoring-pipeline-proof
```

Observed result:

- Eleventy API: `toJSON()`
- Pages processed: `2`
- Import: `148.2 ms`
- Init: `203.4 ms`
- Render: `3238.7 ms`
- Total cold start: `3590.3 ms`
- Rendered HTML bytes: `93202`
- Preview path: `.tmp/authoring-preview/authoring-pipeline-proof/index.html`

Production-fidelity evidence:

- the preview HTML comes from the real Eleventy config
- the page is rendered through `presentation-item.njk`
- the preview smoke test asserts the rendered HTML contains the production `<h1>` output and Presentation chrome text

## Known parity case: Larun pikkuvinkit

The controlled test case confirms the source evidence still proposes the
canonical date `2020-03-23`.

It also surfaced an important editorial distinction:

- proposed live YouTube title: `Pikkuvinkki: näin teet ruututallenteen powerpointissa`
- canonical Presentation title: `Larun pikkuvinkit`

This is acceptable and useful.
It proves the imported metadata cannot be treated as automatic canonical truth.
The prototype correctly reports the difference while keeping preview and
validation on the proposed draft only.

## Invalid cases

Malformed URL CLI result:

```text
AUTHORING-PIPELINE-01

Error: Virheellinen URL
```

Missing canonical fields CLI result:

```text
Canonical validation:
FAIL

Missing / invalid:
type: pakollinen kentta puuttuu
contexts: kontekstia ei saa arvata; anna vahintaan yksi eksplisiittinen contexts-arvo
```

In the validation-fail path no preview is rendered.

## Tests

- `node --test tests/unit/authoringPipeline.test.js` -> `9/9 PASS`
- `node --test tests/unit/authoringPipeline.test.js tests/unit/presentationsF3cP3.test.js tests/unit/pres-yt-date-01-chronology.test.js tests/unit/presentationSources.test.js` -> `16/16 PASS`
- `npm run test:unit` -> `654 PASS / 0 FAIL`
- `git diff --check` -> PASS

Focused authoring test coverage includes:

- valid YouTube URL normalization
- invalid URL fast-fail
- title extraction
- date extraction
- mocked metadata fetch
- canonical-match detection
- draft shape
- contexts are not inferred
- validation failure
- production-layout Eleventy preview
- temp cleanup

## Duplication / deletion audit

- Existing validation was extracted and reused, not copied into a second validator.
- Existing Presentation computed data and Nunjucks layout are reused directly.
- No duplicate Presentation schema was introduced.
- No duplicate renderer was introduced.
- No generic provider/plugin framework was added.
- No Pagefind code was touched.

## Sveltia relationship

Current Sveltia already handles direct Markdown authoring on the canonical
content tree.
AUTHORING-PIPELINE-01 adds a pre-commit author-time helper for metadata
proposal, validation, and production-fidelity preview before any canonical
file is saved.

If later desired, Sveltia-adjacent tooling could call the same authoring
engine, but the engine would still feed the same canonical model and the
same Eleventy preview path.

## SvelteKit boundary

SvelteKit was not introduced.
If a future authoring UI shell were ever justified, it would need to sit
in front of this same engine and the same Eleventy preview, not replace the
canonical model or the renderer.

## Limitations

- one provider only: YouTube
- one content family only: Presentations
- manual completion still required for `type`, `contexts`, and any missing editorial fields
- metadata proposal quality depends on the source page metadata
- the prototype does not write or commit canonical files automatically

## Explicit non-goals

- DOI support
- Publications authoring
- Canva adapter
- Sveltia modification
- SvelteKit
- HTTP API or server
- browser admin UI
- Git automation
- canonical-file publishing
