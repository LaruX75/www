# esitykset dup — simo-veso-2024 (follow-up, 2026-09-12)

Follow-up ticket from ESITYKSET-DUPLICATES-01. Not fixed in that
workstream because the root cause is different from the 405040Y P2
supersede pattern the main PR addressed.

## Symptom

`/esitykset/` renders TWO `.presentation-archive-card` articles for
the same canonical URL:

- `/presentations/simo-veso-2024/` — 2 cards, both linking to the
  same local landing.

The two cards differ in title, description and thumbnail. Both are
tagged `sourceKey: canva`. See
`tests/esitykset-no-duplicate-cards.spec.js` — this URL is on the
known-failure allowlist and is exempted from the duplicate assertion.

## Root cause (as known)

Two different Canva design records both project to the SAME local
`pageUrl`:

- Canva item `id=i5qAHZkGYqjOGZV`, title `"VESO 2024 – Tekoäly opetuksessa"`
- Canva item `id=H8tSyhG_9jcwRpr`, title `"VESO elokuu 2024 – Tekoäly koulussa"`

Both records live in `src/_data/canva-presentations.json`. Whichever
mechanism assigns `pageUrl` to `/presentations/simo-veso-2024/` on
each of them (likely via `data/canva/content-slug-to-designid.json`
or via the local `.md`'s title/URL match) makes them collide on the
archive page.

`docs/data/presentations-local-detail-curation-f3c-p2-accepted-decisions.json`
records case P2-17:

```json
{
  "detailUrl": "/presentations/simo-veso-2024/",
  "humanDecision": "ALTERNATE_REPRESENTATION",
  "humanCanonicalId": "H8tSyhG_9jcwRpr"
}
```

The `ALTERNATE_REPRESENTATION` branch in
`applyAcceptedPresentationCuration` (`src/_data/presentationsPage.js`
around line 1011) attaches a representation to the H8tSyhG_9jcwRpr
canonical item but does NOT merge or remove the i5qAHZkGYqjOGZV
canonical item that shares the same pageUrl. Both remain in the
canonical items list.

## Relevant files / lines

- `src/_data/canva-presentations.json` — both Canva records.
- `data/canva/content-slug-to-designid.json` — mapping from local slug to designId.
- `src/_data/presentationsPage.js` around lines 540–582 (`buildCanvaMaterialLookup`) and 989–1046 (`applyAcceptedPresentationCuration`).
- `docs/data/presentations-local-detail-curation-f3c-p2-accepted-decisions.json` P2-17.
- `tests/esitykset-no-duplicate-cards.spec.js` — known-failure entry with `addedAt: "2026-09-12"`.

## What is NOT investigated

- Whether one of the two Canva records is stale and should be removed
  from `canva-presentations.json`.
- Whether the intent of P2-17 was that i5qAHZkGYqjOGZV should be
  DROPPED (merged into H8tSyhG_9jcwRpr) rather than kept as a
  separate canonical item with an added representation.
- Whether `buildCanvaMaterialLookup` is silently promoting a second
  Canva row to the same pageUrl (via title match) when only one
  should reach it.
- Whether the two Canva designs represent genuinely different
  presentation events (August VESO vs. later VESO 2024) that should
  each have their OWN local `.md` and slug rather than sharing one.

## Explicitly no fix proposed

Root cause requires (a) an editorial decision from the site owner on
which Canva record is authoritative for the slug, and (b) analysis of
`buildCanvaMaterialLookup`'s dedup semantics. Neither is proposed
here.
