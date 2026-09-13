# PRESENTATIONS-RUNTIME-DATA-01

Baseline: `origin/main` at `777b06ba42db73ae1c9f90504fc861e451ce9534`.

## Closure

`/data/presentations-page.json` is not an external public contract. It remains
in this change for build-only consumers: Pagefind presentation inventory and
existing built-output audits. The FI and EN presentation archives no longer
fetch it in the browser.

The canonical build model remains `presentationsPage.js`. SSR continues to
render every card. Each card now carries a compact JSON search record, and the
existing `ContentPresets.queryPreset` semantics filter those same DOM nodes.
The record includes the current search fields: title, description, publication,
event, presentation type, media type, categories, keywords, topics, and year.
It is necessary because visible descriptions are truncated and only three topic
chips are rendered.

`content-engine.js` and `pe-list-render.js` were removed only from the FI/EN
presentation archive script lists; they remain available to their other
consumers. No Canonical Content v1, contexts, course contexts, Pagefind role,
or endpoint build consumer changed.

## Comparable Measurements

Both sides used fresh `npm run build:no-og` builds from the same baseline and
the same offline cache-fallback environment. Each archive had 221 SSR cards.

| Payload | Before raw / gzip | After raw / gzip | Delta gzip |
| --- | ---: | ---: | ---: |
| FI HTML | 1,440,018 B / 138,187 B | 1,778,258 B / 202,465 B | +64,278 B |
| EN HTML | 1,170,404 B / 113,991 B | 1,508,644 B / 178,930 B | +64,939 B |
| FI page-specific JS | 42,914 B / 13,119 B | 31,010 B / 8,795 B | -4,324 B |
| EN page-specific JS | 39,281 B / 11,778 B | 27,377 B / 7,454 B | -4,324 B |
| Runtime presentations JSON request | 790,869 B / 118,167 B | 0 B / 0 B | -118,167 B |
| FI archive HTML + archive JS + runtime JSON | 2,273,801 B / 269,473 B | 1,809,268 B / 211,260 B | -58,213 B |
| EN archive HTML + archive JS + runtime JSON | 2,000,554 B / 243,936 B | 1,536,021 B / 186,384 B | -57,552 B |

The JSON output itself is intentionally unchanged at 790,869 B raw / 118,167 B
gzip; it is no longer a presentation-archive runtime transfer.

## Verification

- `npm run build:no-og`: PASS, 1,493 files; Pagefind presentation inventory and
  Research.fi integrity PASS.
- Focused Playwright archive/source/starter suite: PASS, 28/28.
- The network assertion confirms no `/data/presentations-page.json` request for
  FI or EN archive hydration.
- FI and EN each contain 221 SSR cards and 221 parseable metadata records.
- Filtering preserves the existing SSR DOM order, reuses the same card nodes,
  and keeps local/external landing behaviour. JS-off retains the full archive
  with no hidden cards.
- `git diff --check`: PASS.

The legacy F3C/P6 built-output audit has an unrelated stale fixed-count
expectation (`218`; current clean main produces `221`). Its failure reproduces
on clean main. This workstream updates only its presentation-page script
expectation to reflect the removed browser-only dependencies.

## Follow-up Boundary

The endpoint can only be removed after a separate consumer migration proves
that Pagefind and all build audits use a build-only manifest or direct model.
That work is intentionally out of scope here.
