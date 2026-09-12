# esitykset — 405040Y B1 non-duplicating luentos description/tags authority (follow-up, 2026-09-12)

Follow-up ticket from ESITYKSET-DUPLICATES-01. Not fixed in that
workstream. Documents an open UX-consistency question exposed by the
narrow rule the main PR shipped.

## Symptom

After ESITYKSET-DUPLICATES-01 landed, the eight canonical 405040Y
lecture Presentations render with visibly different card metadata on
`/esitykset/` depending on whether they had a curation decision at
build time:

| Slug | Card description source | Card tags |
|---|---|---|
| `/presentations/405040y-luento-1-johdanto-2026-a/` | local `.md` (short) | local `.md` categories |
| `/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a/` | local `.md` (short) | local `.md` categories |
| `/presentations/405040y-luento-3-tekoalylukutaito-2026-a/` | local `.md` (short) | local `.md` categories |
| `/presentations/405040y-luento-4-media-ja-informaatiolukutaito-2026-a/` | canvaRow projection (longer) | empty |
| `/presentations/405040y-luento-1-johdanto-2026-b/` | canvaRow projection (longer) | empty |
| `/presentations/405040y-luento-2-digitaalinen-osaaminen-2026-b/` | canvaRow projection (longer) | empty |
| `/presentations/405040y-luento-3-ohjelmointiosaaminen-2026-b/` | canvaRow projection (longer) | empty |
| `/presentations/405040y-luento-4-medialukutaito-2026-b/` | canvaRow projection (longer) | empty |

The first three are canonically identical to the other five (same
course, same period contract, same `courseContexts` shape in the
`.md`), yet only they get the tighter local `.md` description and
categories as tags. The other five keep the canvaRow projection's
longer/less-tight text and render no tags at all. On the archive page
this looks inconsistent — the "same" content type presents itself
differently across lectures.

## Root cause (as known)

Direct consequence of the narrow rule shipped by
ESITYKSET-DUPLICATES-01 in `src/_data/presentationsPage.js`
`projectLocalDetailContextsToCanonicalItems`:

```js
if (matchingDetail && item.curationStatus === "human-approved-local-detail-match") {
  // description / categories / topics from local .md
}
```

Only items whose `curationStatus === "human-approved-local-detail-match"`
receive the local `.md` overrides. That status is set by
`applyAcceptedPresentationCuration` on the `MATCHES_EXISTING_CANONICAL`
branch. The three autumn 2026-A luentos reach that branch via the
supersede path added by ESITYKSET-DUPLICATES-01 (P2-22/23/24). The
five other 405040Y luentos have no P2 decision at all, so they never
pass through that branch and keep the canvaRow projection copy.

Why the rule is narrow: the audit against BEFORE/AFTER built HTML
showed that a blanket "any matched local detail wins on
description/tags" would regress ~10 unrelated public presentation
cards to weaker copy (five SlideShare items would even render
`description: "SlideShare-esitys"` as visible boilerplate). See
`docs/presentations-local-detail-curation-schema-2026-09-12.md` and
the ESITYKSET-DUPLICATES-01 PR discussion.

## What is NOT investigated

- Whether the five non-duplicating luentos SHOULD share the same
  description/tags behaviour as the three duplicating ones. The most
  obvious mechanical fix ("supersede all five with fabricated
  MATCHES_EXISTING_CANONICAL decisions") would be dishonest audit
  history: no human ever made a `MATCHES_EXISTING_CANONICAL` verdict
  for those five, so writing one now — even with `supersededReason`
  copy — pretends a curation event happened that never happened.
- The deeper open question the inconsistency exposes: **where should
  a course-lecture Presentation's description and tags come from?**
  Today the same "canonical Canva record for a course lecture"
  concept has two authorities:
  - the local `.md` (author-written description, categories) that
    lives under `src/presentations/`, and
  - the Canva projection record in
    `src/_data/canva-presentations.json` (curated summary,
    jarjestaja, thumbnail).
  Which is authoritative for user-visible copy on the archive card is
  not currently a repo-wide policy — it's decided per-record by
  whether a P2 curation decision was written for it.

## Relevant files / lines

- `src/_data/presentationsPage.js` — `projectLocalDetailContextsToCanonicalItems`
  (the narrow rule).
- `src/_data/canva-presentations.json` — 8 canonical Canva records
  for 405040Y luentos (added by OPETUS-CANVA-THUMBNAILS-01A, PR #240).
- `src/presentations/405040y-luento-*.md` — 8 local `.md` files.
- `docs/data/presentations-local-detail-curation-f3c-p2-accepted-decisions.json`
  — P2-22/23/24 (superseded), no entries for luentos 4-A or any B.
- `docs/presentations-local-detail-curation-schema-2026-09-12.md`
  — supersede semantics.
- `docs/opetus-canva-thumbnails-01a-implementation-2026-09-09.md`
  — provenance of the Canva projections.

## Explicitly no fix proposed

The obvious mechanical patches (adding fabricated
`MATCHES_EXISTING_CANONICAL` decisions for the five, or expanding the
narrow rule) both trade one problem for another (dishonest audit,
regressions elsewhere). A real fix requires a repo-wide policy call
on canonical authority for course-lecture card copy. That is out of
this workstream's scope.
