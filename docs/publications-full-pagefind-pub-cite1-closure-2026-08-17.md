# Publications FULL Pagefind + PUB-CITE1 Closure

Date: 2026-08-17

## Status

- **PUB-CITE1**: CLOSED / GREEN / MAIN
- **Publication keyword audit**: CLOSED — NO IMPLEMENTATION
- **Publications FULL Pagefind parity**: CLOSED / GREEN / MAIN

Supersedes the *scope* of `find-explore-publications-v1` (F3B PARTIAL
Find & Explore migration, 2026-08-14, PR #85, merge commit
`00b6e370cf745b946b4f7b962ec56cfe3d2c9955`) which remains closed at
its historical scope. This document closes the follow-up FULL Pagefind
migration + citation-architecture consolidation landed on 2026-08-17.

## Git evidence

```text
PR: #99
PR title: Publications FULL Pagefind and citation architecture closure
head commit: 7efcca8ccdc904f456c805b11c9abd8ec489921d
merge commit: 2f752a42f6625dcbfe7761a8d99d4c9e611c37da
merged at: 2026-08-17T10:44:32Z
merge strategy: merge commit (repository convention)
merged into: main
final main HEAD used for verification: 2f752a42
```

Commits merged (11 single-concern, fast-forward on top of `cae90cd7`):

| # | SHA | Subject |
| - | --- | ------- |
| 1 | `9112b74a` | Phase 1 — canonical publication CSL-JSON projection |
| 2 | `170e1e46` | Phase 2 — shared CSL citation renderer + SSR publications list v2 |
| 3 | `56a34754` | PF5-IMPL-APA — full Pagefind publications list with shared APA rows |
| 4 | `8b8414eb` | Phase 4 readiness audit |
| 5 | `cb48e612` | Phase 4a — Zotero/Mendeley RIS via shared renderer |
| 6 | `1042a192` | Phase 4b — delete inline citation formatters, modal shared-renderer-only |
| 7 | `2972fb86` | Phase 4c — taxonomy citations via shared renderer |
| 8 | `c5cb2e75` | Phase 4d — export API citations via shared renderer |
| 9 | `c73bc20c` | Phase 4e — delete legacy server APA composer + fallbacks |
| 10 | `fe27b482` | Publications FULL parity — grouped complete list + Topic facet removal |
| 11 | `7efcca8c` | Publications FULL final — deterministic ordering + semantic grouped list |

## Post-merge CI on main `2f752a42`

- **Build and Deploy** (run `32021594007`): completed / **SUCCESS**.
- **Accessibility and navigation tests** (run `32021594026`): completed / **SUCCESS**.
- **Generate OG Images** (run `32021594003`): completed / **SUCCESS**.

All three required post-merge workflows on the actual main merge SHA
passed. The PR checks (`playwright`, `build-and-verify`) both passed
pre-merge as well.

## Final architecture

```
canonical publication
  ├── Eleventy / Nunjucks
  │     ├── SSR page shell (hero, KPIs, orientation)
  │     └── canonical detail page (JSON-LD, sitemap, hreflang)
  │
  ├── canonical CSL projection (buildCslItem)
  │     └── shared publicationCitation renderer (isomorphic UMD)
  │           ├── publication list rows (Find & Explore, browser)
  │           ├── publication detail card (SSR, Nunjucks filter)
  │           ├── taxonomy pages (teemat / kategoriat / avainsanat, SSR)
  │           ├── citation export modal (APA / MLA / Chicago / BibTeX preview)
  │           ├── Zotero + Mendeley RIS downloads
  │           └── /api/export-data.json (rfContent[].citation + citationStyle)
  │
  └── Pagefind metadata / index
        └── Publications FULL Pagefind list
              └── canonical detail page
```

## Final publication UI (main HEAD `2f752a42`)

- 56 / 56 canonical publications visible on `/julkaisut/` initial load.
- 56 / 56 canonical publications visible on `/en/publications/` initial load.
- Grouping: A / B / C / D / E / G + explicit "unclassified" trailing
  bucket, emitted as `<section aria-labelledby>` +
  `<h3 id="publications-group-*">` + `<ol>` semantic markup.
- Group counts (canonical): A 29 · B 9 · C 1 · D 6 · E 5 · G 1 · unclassified 5.
- Default ordering (empty query, with or without structured filters):
  deterministic bibliographic — year DESC → title ASC in the "fi" locale.
  Matches `src/_data/publicationsPage.js#sortCanonicalItems`.
- Non-empty free-text query: Pagefind relevance order preserved
  within each canonical group.
- Full result-area width (publication-scoped CSS on
  `.find-explore--publications` only; other Find & Explore kinds
  keep the shared 8/12 layout).
- No local Topic / Aihe facet on the publication hub.
- Publication controls: search, group, year, quality, reset.
- FI / EN parity: identical structure, localized labels via
  `record.groupLabelFi` / `record.groupLabelEn`.

## Deletion achieved

Publication citation legacy stack:

- `researchfiContent.buildApaCitation()` composer removed.
- `formatAuthorsApa` / `formatAuthorApa` / `formatAuthorInitials` /
  `buildReferenceLabel` helpers removed.
- `content.citation` and `content.citationStyle` field emission removed
  from `researchfiContent.mapPublication`.
- `detail.citation` and `detail.citationStyle` forwarding removed from
  `publicationDetails.buildResearchfiDetail`.
- 4 inline browser composers in `src/julkaisut.njk`
  (`buildApaCitation` / `buildMlaCitation` / `buildChicagoCitation` /
  `buildBibtexEntry`) and `buildRisEntry` + `toBibtexAuthors` helper
  removed.
- All `or ...citation` legacy fallback branches removed from taxonomy
  and detail templates.

Publications archive UX:

- Partial-list behaviour bypassed for the publications kind
  (`renderAllResults: true` opt-in).
- Duplicate SSR opening list (`publications-opening-list.njk`) removed.
- Local topic facet removed from FI + EN publication hubs.
- Fake heading `<li>` list-item structure removed; replaced with
  semantic nested `<section>` + `<h3>` + `<ol>` markup.

## Public contracts preserved

- `/api/export-data.json` `researchfiContentItems[].citation` +
  `citationStyle` field names / shape unchanged; values now come from
  the shared CSL renderer.
- `publications-page.json` public endpoint unchanged in shape.
- Canonical topic metadata unchanged on every publication object.
- Canonical Content v1: no breaking change.
- No public JSON field removed. No field type change. No version bump.

## Keyword audit conclusion

- **Research.fi own / source keywords**: 0 / 56 (Research.fi ES source
  contains no keyword field).
- **OpenAlex keyword / topic enrichment** (via
  `publication-abstract-enrichments-v2` cache): 30 / 56 publications
  (57 %). External enrichment. Currently flows into
  `researchfiContent.inferKeywords` and blends into the canonical
  site-wide keyword taxonomy.
- **Not presented as author or source keywords**.
- **No keyword facet** on the publication hub.
- **No CSL keyword projection** populated.
- **No `bibliographicKeywords` field** added.
- **Canonical Content v1**: unchanged.

Future OpenAlex enrichment decisions belong to a separate
enrichment / semantic workstream.

## Tests (final HEAD used for verification)

Local (pre-push, HEAD `7efcca8c`):

- `npm run test:unit` — **460 / 460 pass**.
- `npm run build:no-og` — green. Pagefind `fi:1163 / en:346`.
  Research.fi integrity 56 / 56.
- 14 regression audits, all green.
- Browser sweep 13 / 13.

CI (main HEAD `2f752a42`):

- Build and Deploy — success.
- Accessibility and navigation tests — success.
- Generate OG Images — success.

## References

- PR: https://github.com/LaruX75/www/pull/99
- Historical F3B closure (preserved): `docs/find-explore-publications-v1-closure-2026-08-14.md`
- Roadmap: `docs/find-explore-roadmap-2026-08-12.md`
- PUB-CITE1 Phase closures (branch-only, superseded by this main-level
  closure but preserved as-is):
  `docs/pub-cite1-phase1-csl-projection-closure-2026-08-16.md`,
  `docs/pub-cite1-phase2-shared-csl-renderer-publications-list-v2-closure-2026-08-16.md`,
  `docs/pf5-impl-apa-full-list-migration-closure-2026-08-17.md`,
  `docs/pub-cite1-phase4-legacy-citation-deletion-readiness-audit-2026-08-17.md`.
