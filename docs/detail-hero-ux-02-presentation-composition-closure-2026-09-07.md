# DETAIL-HERO-UX-02 + PRESENTATION-COMPOSITION-01 closure

Date: 2026-09-07
Branch: `feat/detail-hero-ux-02-presentation-composition`
Baseline: `64b9ea1e451842efca5595e93d2a30c4b4da26ef`

## Scope and decision

This bounded slice improves Presentation detail-page composition only. It does
not change canonical source content, public JSON, Pagefind architecture,
runtime JavaScript, routes, or the shared detail-hero default.

The shared-hero inventory was classified as follows:

| Consumer | Classification | Result |
| --- | --- | --- |
| Presentations | Domain-specific issue | Opts into a compact title variant. |
| Publications | Good as is | Keeps the default title scale. |
| Media | Good as is | Keeps the default title scale. |
| Blog posts | Good as is | Keeps the default title scale. |
| Writings | Good as is | Keeps the default title scale. |
| Theses | Good as is | Uses its existing domain composition. |

Only Presentations have the observed combination of exceptionally long titles
and optional media. The shared include therefore exposes an explicit
`titleMode="compact"` opt-in; it does not change the default class or other
domains. The no-thumbnail composition remained balanced in desktop and mobile
QA, so no new media-area exception was added.

## Description and relationship composition

The dirty historical lead was traced through this flow:

`Presentation source -> presentationSources.js -> derivePresentationMetadata()
-> deriveSlideshareDescription() -> transcriptExcerpt() -> Presentation
description -> hero lead`.

The user-facing transcript fallback was removed in both derivation paths:
`getSlideshareDescription()` in `src/_data/presentationsPage.js` and
`deriveSlideshareDescription()` in
`src/_utils/presentationDerivedMetadata.js`. Real non-generic SlideShare
analysis descriptions remain eligible. Generic values (`SlideShare-esitys`,
`SlideShare presentation`, `.`, and `-`) are suppressed by
`presentations.11tydata.js` before hero rendering.

The historical `ss-luento-3-suunnittelu-ja-pedagogiset-mallit-410014y-tieto-ja-viestintatekniikka-p`
case was the regression target: its raw transcript excerpt no longer appears
as the hero lead. SlideShare transcripts remain usable as a discovery signal:
`src/_utils/buildEmbeddingInput.js` still consumes `transcriptByUrl` and emits
`slideshareTranscript` input for the existing discovery pipeline.

Course implementation backlink and implementation peers are now one
`Kurssitoteutus` section. The UI uses course name, academic year and human
semester label rather than raw `periodId`; the implementation URL remains the
canonical route. `Käyttöyhteys` is suppressed when that verified exact
implementation backlink is present, avoiding duplicate relationship summary.

## Verification

`npm run build:local` completed successfully from a clean `_site` and cache.
The generated historical page retained its canonical URL and JSON-LD, and its
hero lead is absent rather than transcript-derived.

Focused automated results:

- `npx playwright test` over hero, relationship, thumbnail and archive specs: 114 passed.
- `tests/detail-hero-ux-02.spec.js`: 12 focused checks passed within that run.
- `node --test` over Presentation derived metadata and source lookup: 11 passed.

Visual QA used `scripts/screenshot-presentation-detail.js` at 1440 x 900 and
390 x 844 for historical SlideShare long titles, a genuine 2013 lead, current
405040Y implementation material, Canva, YouTube and no-thumbnail variants.
All seven local routes returned HTTP 200. No mobile horizontal overflow was
observed; primary CTA controls were at least 44 px high. Screenshots are local
QA artifacts under `outputs/detail-hero-ux-02/` and are intentionally
uncommitted.

Known unrelated baseline observations were left untouched: the existing
`presentations-source-ssr` Canva source-link count expectation and the prior
Find & Explore orientation failures. They are outside this slice.

## Architecture status

Canonical Content v1: unchanged.
Pagefind and discovery architecture: unchanged.
Public JSON contract: unchanged.
Runtime JavaScript and CI wiring: unchanged.
Presentation identity, canonical URLs and JSON-LD: preserved.
AC1: CLOSED / GREEN / READY FOR PR.
