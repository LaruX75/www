# esitykset dup — canva.link/vqtdccorb3yxb9h (follow-up, 2026-09-12)

Follow-up ticket from ESITYKSET-DUPLICATES-01. Not fixed in that
workstream because the duplication is in a different code path
(external Canva `pageUrl` values) than the local-`.md`-vs-Canva-
projection collision that the main PR resolved.

## Symptom

The `pageUrl` field `https://canva.link/vqtdccorb3yxb9h` (an
external Canva short URL, NOT a local `/presentations/…/` path)
appears in `_site/data/presentations-page.json` items **3 times**.
Verified via:

```
$ python3 -c "import json; d=json.load(open('_site/data/presentations-page.json')); \
  from collections import Counter; c=Counter([it.get('pageUrl','') for it in d['items']]); \
  print([(k,v) for k,v in c.items() if v>1])"
```

Yielded: `[('https://canva.link/vqtdccorb3yxb9h', 3), …]`.

The `tests/esitykset-no-duplicate-cards.spec.js` invariant filters to
paths that start with `/presentations/`, so this URL is NOT covered
by that spec. It is documented here because the underlying pipeline
still emits three items sharing a pageUrl, which suggests a dedupe
bug even when the pageUrl is external.

## Root cause (as known)

Not fully diagnosed in the audit. Best current hypothesis:

- Three separate Canva rows in `src/_data/canva-presentations.json`
  (or three curatedVideos/videoSeries entries) carry the same
  Canva short-URL as their `link` / `publicUrl`, causing three
  canonical items to end up with the same external `pageUrl` after
  `withPresentationSemantics` / projection.
- `applyAcceptedPresentationCuration` does not deduplicate on
  external `pageUrl`.
- Unlike the local case, the archive UI does not show this as a
  visible duplicate card row (external items may render differently
  or be routed via a different section), so it did not surface as
  the user-visible bug the parent workstream fixed.

## Relevant files / lines

- `src/_data/canva-presentations.json` — grep for `vqtdccorb3yxb9h`.
- `_site/data/presentations-page.json` — 3 items with this pageUrl.
- `src/_data/presentationsPage.js`:
  - `createCanonicalCanvaItems` (~line 1108).
  - `buildCanonicalPresentationItems` (~line 1183).
  - `withPresentationSemantics` (~line 873).

## What is NOT investigated

- Whether the three items refer to the same underlying design or to
  distinct designs that coincidentally share a short URL.
- Whether the correct fix is data cleanup (deduplicate at source) or
  code-level dedupe on pageUrl (which could conflict with other
  intended multi-item cases such as `simo-veso-2024`).
- Whether this duplication has any user-facing effect on the
  archive rendering, on Pagefind, on public JSON consumers, or on
  the `/data/presentations-page.json` allowlist contract.

## Explicitly no fix proposed

Root cause requires further tracing and an editorial decision (which
of the three items is authoritative). Not part of this PR's scope.
