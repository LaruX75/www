# AUTHORING-PIPELINE-02 DOI Publications

Date: 2026-08-31
Status: `PROVEN / AUTHOR-TIME ONLY / READY FOR PR`
Post-#178 base SHA: `c42ec4e63dd734dea1a5568f403cc35f955682a7`
Branch: `prototype/authoring-pipeline-02-doi-publications`

## Current Publication architecture

Scientific Publication detail pages do not originate from Markdown files.
The current canonical path is:

```text
Research.fi + researchfiContent
-> buildCanonicalPublicationCandidates()
-> buildCanonicalPublicationDetailsModel()
-> src/julkaisut/researchfi-details.njk
-> src/_includes/publication-item-body.njk
```

Manual `src/publications/*.md` items still exist, but for scientific detail
pages they participate only through canonical dedup / redirect logic, not as
the primary detail-page authority.

Identity remains owned by the existing Publication pipeline:

- stable detail id: `publicationId`, else `anchorId`
- canonical URL: `canonicalPublicationDetailUrl(publicationId, anchorId)`
- DOI participates in duplicate detection, not as a new identity authority

This means AUTHORING-PIPELINE-02 can reuse current Publication identity safely
without inventing `doi -> slug -> canonical id`.

## DOI normalization and metadata source

DOI input is normalized with the existing Publication identity normalizer in
`src/_data/publicationsPage.js`, then validated with the shared strict DOI
checker in `src/_utils/canonicalContentValidation.js`.

Accepted input shapes:

- raw `10.xxxx/...`
- `https://doi.org/...`
- `http://dx.doi.org/...`

Malformed non-URL DOI input now fails fast as:

```text
AUTHORING-PIPELINE-02

Error: Virheellinen DOI
```

Metadata source is one bounded provider:

- Crossref `works/<doi>`

External DOI metadata remains proposal/evidence only.
Canonical content remains the source of truth.

## Data flow

```text
DOI
-> Crossref proposal
-> findExistingPublicationByDoi()
-> canonical-shaped Publication draft
-> shared validateCollectionItem()
-> real src/julkaisut/researchfi-details.njk
-> Eleventy preview HTML
```

Shared engine pieces reused:

- `scripts/author-preview.js` dispatch / reporting
- `src/_utils/canonicalContentValidation.js`
- `scripts/_lib/authoring/eleventyPreview.js`
- `.eleventy.js` and Eleventy 3 programmatic `toJSON()`

Domain-specific pieces kept domain-specific:

- `youtubeMetadata.js`
- `presentationDraft.js`
- `doiMetadata.js`
- `publicationDraft.js`

No parallel Publication model, schema, bibliography engine, or renderer was
introduced.

## Canonical mapping and allowlist

The DOI adapter only projects the minimal canonical Publication shape already
used by the existing detail pipeline:

- `title`
- `authors`
- `date`
- `year`
- `doi`
- `doiUrl`
- `journal`
- `publisher`
- `volume`
- `issue`
- `pages`
- `typeCode`
- `type`
- `pageUrl`
- `externalUrl`

It intentionally does not infer or invent:

- `categories`
- `keywords`
- `contexts`
- Research membership
- editorial description text

Provider-only fields such as `crossrefType`, raw `language`, and `evidenceUrl`
are kept out of the canonical draft/detail object.

## Duplicate detection and parity proof

Live duplicate proof command:

```bash
npm run author:preview -- "10.1016/j.compedu.2025.105485"
```

Observed result:

- `Canonical duplicate: YES`
- canonical page: `/julkaisut/02254916YJ/`
- no new draft created

Observed proposal vs canonical comparison:

- `title`: MATCH
- `doi`: MATCH
- `year`: MATCH
- `authors`: MATCH
- `publisher`: MATCH
- `journal`: DIFF

The journal difference was editorial/normalization-level only:

- proposed: `Computers &amp; Education`
- canonical: `Computers and education`

This is acceptable and important proof.
Imported DOI metadata proposes; canonical editorial content decides.

## Preview evidence

Publication preview now renders through the real production template:

- input template: `src/julkaisut/researchfi-details.njk`
- body partial: `src/_includes/publication-item-body.njk`
- Eleventy config: `.eleventy.js`

For author-time preview only, `src/_data/publicationDetailPages.js` accepts a
temporary override module path via environment variable so the real template
can render one draft detail object without touching canonical source files or
public JSON outputs.

Fixture-based new-draft preview measurement:

- pages processed: `2`
- HTML bytes: `94150`
- Eleventy import: `593.0 ms`
- Eleventy init: `344.1 ms`
- Eleventy render: `3800.5 ms`
- Eleventy total: `4737.6 ms`

Live duplicate metadata fetch measurement:

- Crossref fetch: `695.8 ms`

## Tests and verification

Focused AUTHORING-PIPELINE tests:

- `node --test tests/unit/authoringPipeline.test.js tests/unit/authoringPipelinePublications.test.js`
- result: `19/19 PASS`

Full unit suite:

- `npm run test:unit`
- result: `664 PASS / 0 FAIL`

Local builds:

- `npm run build:local` -> PASS
- `npm run build:local:full` -> PASS
- Eleventy wrote `1471` files in about `223.7s`

Other checks:

- `git diff --check` -> PASS

Focused DOI coverage now includes:

- raw DOI normalization
- `doi.org` normalization
- malformed DOI fail-fast
- mocked Crossref fetch
- duplicate detection
- canonical page identification
- allowlisted draft mapping
- strict Publication validation
- production-template preview smoke
- AP-01 YouTube regression remained green

## Duplication / deletion audit

- shared validator reused, not copied
- existing Publication identity reused, not replaced
- existing Publication template reused, not duplicated
- existing CSL projection reused through `buildResearchfiDetail()`
- no Pagefind code touched
- no public `/data/*` or `/api/*` contract changed
- no Sveltia or SvelteKit changes

The only new Publication-specific layer is the DOI proposal-to-canonical-draft
adapter, which is the minimal domain-specific mapping required by the current
architecture.

## Limitations

- AUTHORING-PIPELINE-02 remains author-time only; it does not write canonical
  Publication content automatically.
- Live network proof was used for an existing canonical DOI duplicate case.
- New DOI preview proof is fixture-backed for deterministic tests and render
  measurement; no random non-canonical live DOI was introduced just to satisfy
  a demo case.

## Architecture statements

AUTHORING-PIPELINE-01 is `PROVEN / MERGED / MAINTENANCE`.

AUTHORING-PIPELINE-02 extends the same author-time engine to Publications.

Canonical content remains the source of truth.

External DOI metadata remains proposal/evidence.

Existing Publication identity and landing semantics remain authoritative.

Eleventy/Nunjucks remains the sole production and preview rendering authority.

No parallel Publication model, schema, bibliography engine, or renderer was introduced.

Pagefind remains untouched.

Public JSON remains unchanged.

SvelteKit was not introduced.

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.

AUTHORING-PIPELINE-02 PROVEN — ready for PR/CI
