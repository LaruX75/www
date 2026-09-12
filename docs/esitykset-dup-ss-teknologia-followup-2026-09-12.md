# esitykset dup — ss-teknologia-oppiminen-… (follow-up, 2026-09-12)

Follow-up ticket from ESITYKSET-DUPLICATES-01. Not fixed in that
workstream because the root cause involves TWO source families
(SlideShare + curatedVideos) sharing a `pageUrl`, whereas the main
PR addressed only the P2-curation supersede pattern.

## Symptom

`/esitykset/` renders TWO `.presentation-archive-card` articles for
the same canonical URL:

- `/presentations/ss-teknologia-oppiminen-ja-osaaminen-yhteiskunnassa-uudet-teknologiat-isannan-vai-r/`
  — 2 cards, both linking to the same local landing.

The two cards differ in title, description and sourceKey/sourceLabel:

- Card A: `sourceKey: slideshare`, title
  `"Teknologia, oppiminen ja osaaminen yhteiskunnassa - uudet teknologiat isännän vai …"`
- Card B: `sourceKey: curatedVideos`, title
  `"Teknologia, oppiminen ja osaaminen yhteiskunnassa - videotallenne"`

Both cards' `data-presentation-card-url` points to the same local
`/presentations/ss-teknologia-…/` slug. See
`tests/esitykset-no-duplicate-cards.spec.js` — this URL is on the
known-failure allowlist.

## Root cause (as known)

Two different content families feed the archive with items pointing to
the same local pageUrl:

- **SlideShare item** flows via
  `createSlideshareItems(presentations)` (`src/_data/presentationsPage.js`
  around line 510). The local `.md` at
  `src/presentations/ss-teknologia-oppiminen-…-r.md` has
  `source: slideshare` and its `pageUrl` becomes the slideshare item's
  pageUrl.
- **curatedVideos item** flows via
  `CURATED_VIDEO_ITEMS` (a module-level constant array in
  `src/_data/presentationsPage.js`) into
  `createCanonicalCuratedVideoItems`. One of those entries carries a
  `pageUrl` value identical to the SlideShare slug — apparently a
  video recording of the same talk, curated separately.

`applyAcceptedPresentationCuration` does not touch these two entries
(no P2 decision references this slug), so both reach the final items
list. `buildCanonicalPresentationItems` concatenates the source
arrays without deduping on pageUrl.

## Relevant files / lines

- `src/presentations/ss-teknologia-oppiminen-…-r.md` — the local `.md`
  with `source: slideshare`.
- `src/_data/presentationsPage.js` — `CURATED_VIDEO_ITEMS` array
  (grep for the slug) and `buildCanonicalPresentationItems` around
  line 1183–1199 (the concatenation of source arrays).
- `docs/data/presentations-local-detail-curation-f3c-p2-accepted-decisions.json`
  — no entry references this slug.
- `tests/esitykset-no-duplicate-cards.spec.js` — known-failure entry.

## What is NOT investigated

- Whether the curatedVideos entry SHOULD share the local pageUrl or
  should point to its own distinct slug (e.g. a `-video` suffix).
- Whether `curatedVideos` items in general should be merged into the
  matching SlideShare / Canva canonical item as an additional
  representation (`{ relationship: "recordedVideo" }`) rather than
  standing as their own canonical item. That would be a broader
  design change beyond one slug.
- Whether the archive template should collapse cards by pageUrl
  post-hoc (a template-level dedupe) as a safety net.

## Explicitly no fix proposed

Root cause requires an editorial decision (should recorded video be
its own canonical item, or a representation of the slide deck?) and a
data-model choice for `curatedVideos` more broadly. Neither is
proposed here.
