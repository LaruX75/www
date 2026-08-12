# Find & Explore Writings v1 Closure

Date: 2026-08-12

Status: CLOSED / GREEN

## Scope

Find & Explore Writings v1 closes the writings reference implementation for the canonical content architecture:

- `/kirjoitukset/` uses a canonical writings view model and Pagefind-powered Find & Explore UI.
- `/en/writings/` uses the same canonical writings dataset and Pagefind-powered Find & Explore UI.
- `/data/writings-page.json` remains the public canonical projection contract.
- Writings hubs no longer depend on runtime JSON feed fetching for their primary user experience.
- Local canonical `pageUrl` links are primary in curated sections and search results.

## GitHub

- Branch: `codex/find-explore-f2-writings`
- Pull request: https://github.com/LaruX75/www/pull/83
- PR head: `c0df29507c64ad4b696d5e7686d41a798e8a602e`
- Merge commit: `0b7524636ab99c5debb8a9833aaead9517db699b`
- Merged at: `2026-08-12T19:01:20Z`
- Tag: `find-explore-writings-v1`
- Tag target: `0b7524636ab99c5debb8a9833aaead9517db699b`

GitHub returned no commit status checks for the PR head through the status API. The merge was allowed by repository settings and the local closure gate was green before merge.

## Architecture

```text
canonical writingsPage.items
        ↓
public projection: /data/writings-page.json
        ↓
Pagefind metadata on canonical HTML pages
        ↓
FI /kirjoitukset/ Find & Explore
EN /en/writings/ Find & Explore
```

Key contract decisions:

- `writingsPage.items` is the authoritative writings dataset for the hubs.
- `/data/writings-page.json` is retained as public projection, not used as a hidden runtime dependency by the hubs.
- Pagefind is discovery infrastructure, not a new canonical source.
- EN Find & Explore uses an English UI shell but explicitly searches the Finnish Pagefind index because the canonical writing documents are indexed as Finnish.
- The materials section remains a documented non-canonical writings exception.

## Verification

Branch gate before merge:

- `npm run build:no-og`: passed.
- `npm run test:unit`: passed, `389/389`.
- `node scripts/audit-writings-page-projection.js`: passed.
- `node scripts/audit-writings-fi-client-parity.js`: passed.
- `node scripts/audit-writings-en-client-parity.js`: passed.
- `node scripts/audit-writings-legacy-runtime.js`: passed.
- `node scripts/audit-writings-built-output.js`: passed.
- `node scripts/audit-writings-pagefind.js`: passed.
- `tests/f2-find-explore-smoke.spec.js`: passed, `2/2`.
- `tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js`: passed, `31/31`.

Post-merge main gate:

- `npm run build:no-og`: passed.
- Pagefind: indexed `1434` pages, `43047` words, `8` filters, `2` languages.
- SEO dashboard: `pages=1442`, `missingDescription=0`, `missingOgImage=0`.
- Research.fi integrity: `56` archive publications, `56` metadata records, `56` research line records, `55` curated themes.
- Writings projection audit: passed.
- FI client parity audit: passed.
- EN client parity audit: passed.
- Legacy runtime audit: passed.
- Built-output audit: passed.
- Writings Pagefind audit: passed.
- F2 browser smoke test: passed, `2/2`.

## Counts

Canonical writings projection:

- Total: `290`.
- `statement`: `6`.
- `speech`: `92`.
- `initiative`: `10`.
- `scientificPublication`: `56`.
- `opinion`: `47`.
- `blogPost`: `70`.
- `column`: `9`.

View scopes:

- FI compatibility subset: `126`.
- EN visible set: `290`.
- Public JSON items: `290`.

Pagefind quality:

- FI title samples: `3/3` found, `3/3` top 1.
- EN title samples: `7/7` found, `7/7` top 1.
- Topic samples: `4/4` found.
- Browser smoke confirmed EN Find & Explore returns canonical local publication detail URLs from the FI Pagefind index.

## Runtime Inspection

FI `/kirjoitukset/` after F2:

- HTML bytes: `120447`.
- Element count: `1136`.
- Search inputs: `3`.
- Selects: `2`.
- Buttons: `35`.
- Tables: `0`.
- Runtime JSON bytes: `0`.
- Curated canonical links: `17`.
- Public JSON exists: yes, `290` items.

EN `/en/writings/` after F2:

- HTML bytes: `145537`.
- Element count: `1397`.
- Search inputs: `3`.
- Selects: `2`.
- Buttons: `35`.
- Tables: `0`.
- Runtime JSON bytes: `0`.
- Curated canonical links: `40`.
- Public JSON exists: yes, `290` items.

JS-off inspection:

- FI has main content, Find & Explore shell, curated opening links and ordinary writing links.
- EN has main content, Find & Explore shell, curated opening links and ordinary writing links.
- Noscript copy limits JavaScript requirement to interactive search only.

## Non-Goals

This closure did not introduce:

- F3 orientation mode.
- F4 recommendations.
- Timeline.
- Listen/radio interface.
- Facebook/distribution architecture.
- Embeddings or LLM changes.
- New canonical URL semantics.
- Publications, theses or presentations architecture changes.
- Taxonomy architecture changes.
- Unrelated visual redesign.

## Final Decision

Find & Explore Writings v1 is closed as the reference implementation for:

- canonical content objects as source,
- public projection as contract,
- Pagefind as discovery layer,
- local HTML pages as primary result targets,
- JS-off curated access as baseline.

Do not continue F2. Any next work should start as a new checkpoint, most likely F3 Orientation Mode or a site-wide Pagefind quality hardening audit.

Final status: `FIND & EXPLORE WRITINGS V1 = CLOSED / GREEN`
