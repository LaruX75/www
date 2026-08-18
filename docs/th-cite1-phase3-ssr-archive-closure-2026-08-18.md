# TH-CITE1 Phase 3 — SSR-first thesis archive closure

Date: 2026-08-18

Status: **CLOSED / GREEN / BRANCH**

Branch: `feat/th-cite1-phase1-thesis-csl`

Implementation HEAD reported and pushed: `54c518792...`

PR / merge status: **not opened / not merged** at closure time.

This document closes TH-CITE1 Phase 3 only. Phase 4, Phase 5 and Phase 6 remain separate later workstreams.

## 1. Closure decision

TH-CITE1 Phase 3 is closed green on the feature branch.

The thesis archive has moved to the intended SSR-first architecture:

```text
canonical thesis
→ buildThesisCslItem()
→ CSL
→ shared citation renderer
→ Eleventy / Nunjucks
→ compact SSR thesis archive + bounded archive pagination

canonical / CSL-derived metadata
→ Pagefind
→ active search / filter discovery state

JavaScript
→ progressive enhancement only
```

The final archive invariant is:

> **Eleventy owns the archive. Pagefind owns discovery. JavaScript owns interaction. One result surface, two states: archive ↔ search.**

The Phase 3 implementation does not use the complete SSR archive as a browser-side dataset.

## 2. Canonical population and source evidence

Current thesis source evidence:

```text
raw source records:                 170
canonical unique theses:            169
SSR archive union FI:               169
SSR archive union EN:               169
Pagefind thesis-tagged fragments:   169
citation parity:                    169 / 169 IDENTICAL
```

The raw source contains one duplicated OuluREPO URL (`handle/10024/7879`). Canonical/downstream archive behaviour remains deduplicated at 169 unique theses.

Production logic must not hardcode these counts; they are closure evidence for the current source tree.

## 3. SSR archive presentation

`/opinnaytteet/` and `/en/theses/` now use compact server-rendered archive tables rather than requiring Pagefind to generate the initial visible archive.

Each thesis section is rendered as a compact semantic table with approximately:

```text
Year | APA 7 citation | Open
```

The citation is rendered at build time through:

```text
thesis.csl
→ publicationCitation("apa", lang)
→ Nunjucks HTML
```

The thesis title links to the local canonical detail page, while the source action links to OuluREPO.

No browser-side thesis citation composer was introduced in Phase 3.

## 4. Three-section archive model

The archive preserves the established three-domain-section UX:

```text
Masters / Pro gradu theses
Bachelor's theses
Reviewed theses
```

Each section has its own independent archive page state.

Each section page renders at most 10 thesis rows and carries two synchronized pagination controls:

```text
section
├─ top paginator
├─ 10-row SSR table
└─ bottom paginator
```

The top and bottom paginator for a section are generated from the same SSR state and therefore represent the same current page.

The three section states are independent during JavaScript-enhanced use. For example:

```text
Masters     = page 4
Bachelors   = page 2
Reviewed    = page 5
```

Changing Masters to page 6 leaves Bachelors and Reviewed unchanged.

## 5. Bounded SSR pagination

Phase 3 deliberately rejected a Cartesian `(masters × bachelors × reviewed)` permalink space.

Instead, Eleventy emits a bounded archive URL set per locale:

```text
landing                              1
Masters additional pages             8
Bachelors additional pages           2
Reviewed additional pages            5
---------------------------------------
total archive URLs / locale          16
```

FI and EN together therefore produce 32 thesis archive URLs, of which 30 are additional pagination pages beyond the two pre-existing landing archive URLs.

Representative FI routes:

```text
/opinnaytteet/
/opinnaytteet/ohjatut-gradut/page/N/
/opinnaytteet/kandityot/page/N/
/opinnaytteet/tarkastetut/page/N/
```

Representative EN routes:

```text
/en/theses/
/en/theses/masters/page/N/
/en/theses/bachelors/page/N/
/en/theses/reviewed/page/N/
```

Normal archive pagination is Eleventy-owned deterministic content logic.

No empty-query Pagefind archive pagination is used.

## 6. Progressive enhancement

With JavaScript disabled, all archive pagination controls remain real `<a href>` links to real SSR documents.

The no-JS degradation is explicit and accepted:

- the selected section opens the requested SSR page;
- the other two sections return to page 1;
- the complete canonical thesis archive remains reachable through server-rendered links.

With JavaScript enabled, archive pagination is progressively enhanced:

```text
click real SSR pagination link
→ fetch(target SSR URL)
→ DOMParser
→ extract target section SSR fragment
→ replace target section fragment in place
```

The section fragment contains its top paginator, 10-row table and bottom paginator, so the two pagination controls cannot drift out of synchronization.

The implementation does **not**:

- hide/show a resident 169-row DOM collection;
- client-side slice the canonical thesis collection;
- reorder the full SSR DOM collection;
- maintain a second browser-side thesis content model.

A single built archive URL contains at most 30 thesis rows: 10 per section.

## 7. Browser proof: independent and synchronized pagination

Focused Playwright coverage proves the progressive-enhancement contract.

The Phase 3 browser suite contains 8 passing tests, including:

1. real SSR pagination anchors and corresponding server-rendered documents exist;
2. an enhanced `(Masters=4, Bachelors=2, Reviewed=5)` state can be reached, after which Masters can move to page 6 while Bachelors and Reviewed rows remain unchanged;
3. equivalent independence checks for Bachelors and Reviewed;
4. Masters top and bottom paginators stay synchronized across multiple page changes;
5. Bachelors top and bottom paginators stay synchronized;
6. EN archive supports the same independent section enhancement;
7. JS-disabled navigation follows real SSR links and demonstrates the documented reset-to-page-1 degradation for the other sections;
8. no misleading single-section `pushState` URL is written for a mixed enhanced state.

The tests also prove:

- each visible section remains at or below 10 rows after swaps;
- enhanced clicks do not cause a full-page reload;
- non-target section rows remain materially unchanged, not merely their page-number labels.

## 8. Archive/search result-surface coordination

The thesis archive and Pagefind discovery state follow the two-state result-surface model:

```text
NO ACTIVE QUERY / FILTER
→ SSR three-section archive visible

ACTIVE QUERY / FILTER
→ Pagefind result state visible

RESET
→ SSR three-section archive visible again
```

The archive is not generated by Pagefind.

The complete SSR archive is not DOM-filtered when Pagefind activates.

Phase 3 only establishes the archive/search state boundary. PF5 GLOBAL RESULT PARITY remains Phase 5 work.

## 9. Sitemap and indexing contract

Paginated thesis archive URLs are intentionally support documents rather than canonical index surfaces.

The final implementation uses explicit exclusion rather than relying on robots metadata alone:

- `eleventyExcludeFromCollections` excludes paginated archive pages from the general collection path;
- `sitemap.ignore` is the explicit sitemap exclusion signal;
- `robots: noindex, follow` remains a search-engine hint, not the sitemap exclusion mechanism.

The built sitemap was verified to contain:

```text
/opinnaytteet/
/en/theses/
```

and zero matches for all six FI/EN pagination route families.

A Nunjucks/YAML truthiness issue found during the gate was corrected: rendering literal string `"false"` is truthy, so landing pages now use an empty string as the falsy `sitemap.ignore` value while paginated pages use a truthy value.

## 10. Public JSON contract

The public thesis projection remains controlled.

`/data/theses.json.citationApa` is preserved as the existing public citation contract.

Full internal CSL is not added to the public JSON projection.

The internal thesis CSL projection remains available to build-time consumers.

The legacy server formatter is intentionally retained until the later consumer-parity/deletion phase changes the source of the public `citationApa` field safely.

## 11. Deletion completed in Phase 3

Phase 3 removed superseded archive implementation rather than layering the SSR archive on top of it.

Deleted / simplified:

- `src/_includes/thesis-curated-list.njk` after its archive consumers were migrated;
- `pageModel.opening.advisedMasterItems`;
- `pageModel.opening.advisedBachelorItems`;
- `pageModel.opening.reviewedItems`;
- old archive-mode filter-hook attributes are not present in the new table templates.

This removes the old curated opening-list path from the thesis archive.

## 12. Intentionally retained for later phases

Phase 3 does **not** delete citation/export code whose consumers have not yet been migrated.

### Phase 4

Migrate thesis citation modal and export actions, including Zotero/Mendeley-related paths, away from bespoke browser citation composition and onto the shared citation architecture.

`src/js/thesis-hub-actions.js` remains a Phase 4 concern.

A historical F3A browser test that expected an archive-card abstract trigger is currently skipped because the compact Phase 3 table intentionally removed that archive-card trigger. Phase 4 must either replace that assertion with the approved modal/export behaviour or remove the obsolete test with explicit evidence; it must not remain an unexplained permanent skip.

### Phase 5

Implement PF5 GLOBAL RESULT PARITY for thesis Pagefind-generated results across all Pagefind search surfaces.

Target:

```text
canonical thesis
→ CSL
→ shared renderer at build time
→ controlled ready-made thesis citation display metadata
→ Pagefind
→ shared domain-specific result presenter
```

Browser JavaScript must not compose thesis citations.

### Phase 6

After every consumer is proven migrated:

- repoint `/data/theses.json.citationApa` to CSL → shared renderer output while preserving the public field contract;
- delete `src/_data/theses.js#buildApaCitation` and related legacy helpers;
- remove remaining obsolete thesis citation formatters only after parity and failure-path proof.

## 13. Performance and footprint

Measured Phase 3 trade-off:

```text
FI landing HTML                    ~171,167 bytes
EN landing HTML                    ~162,844 bytes
FI landing DOM tags                ~1,788
EN landing DOM tags                ~1,728
max SSR thesis rows / URL          30
canonical SSR reachability         169 / 169
additional SSR HTML files          30
additional enhancement JS          ~3.7 KB
Pagefind cold-start for archive     no longer required
```

Compared with the previous opening-list state, landing HTML bytes remained essentially flat while DOM tag count increased modestly and no-JS canonical archive coverage increased from the curated opening subset to the complete canonical corpus.

The additional 30 bounded SSR files are an accepted build-time cost. A Cartesian 324-page archive solution was explicitly rejected as unnecessary complexity.

## 14. Verification evidence

Final reported local verification at Phase 3 closure:

```text
node --test tests/unit/*.test.js
→ 488 / 488 pass

node scripts/audit-th-cite1-phase1-thesis-csl-parity.js
→ raw 170
→ canonical 169
→ 169 / 169 IDENTICAL

node scripts/audit-th-cite1-phase3-ssr-archive.js
→ 10 / 10 gates green
→ FI + EN SSR archive parity green
→ sitemap gates green

Playwright thesis Phase 3 pagination suite
→ 8 / 8 pass

accessibility + contrast
→ 27 / 27 pass

navigation suite
→ pass

npm run build:no-og
→ clean build
```

The repository was reported clean after the final Phase 3 gate commit and pushed to the feature branch.

## 15. Closure invariant

Phase 3 closes with the following architecture:

```text
Canonical content defines truth.

CSL defines thesis bibliographic structure.

Eleventy / Nunjucks renders deterministic archive HTML,
section membership, ordering and archive pagination.

Pagefind finds, filters, ranks and paginates active discovery results.

JavaScript owns only genuine interaction and progressive enhancement.

Archive and search share one visible result area,
but the complete archive is never treated as one persistent browser dataset.
```

Hard invariants:

```text
No parallel archive list.
No DOM filtering.
No DOM pagination.
No 169-row browser-side archive dataset.
No client-side archive slicing.
No browser-side citation composition introduced in Phase 3.
No empty-query Pagefind archive generation.
No Cartesian archive URL explosion.
No public full-CSL exposure.
```

## 16. Status after closure

```text
TH-CITE1 Phase 1 — thesis CSL projection             DONE
TH-CITE1 Phase 2 — shared APA thesis renderer        DONE
TH-CITE1 Phase 3 — SSR-first thesis archive          CLOSED / GREEN / BRANCH
TH-CITE1 Phase 4 — modal/export migration            NOT STARTED
TH-CITE1 Phase 5 — PF5 GLOBAL RESULT PARITY          NOT STARTED
TH-CITE1 Phase 6 — legacy formatter deletion         NOT STARTED
```

Do not mark Phase 3 as `MAIN` until the feature branch has been reviewed and merged.
