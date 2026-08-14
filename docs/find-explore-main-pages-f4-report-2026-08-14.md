# F4 Research Contextual Find & Explore Report

Date: 2026-08-14

## 1. Scope

F4 implements the approved partial MVP for main-page Find & Explore.

Implemented:

- FI `/tutkimus/`: one contextual cross-content Find & Explore surface.
- FI `/`: one curated discovery entry to `/tutkimus/#tutkimusnaytto`.
- Search scopes: publications, theses, writings.

Not implemented:

- Presentations scope.
- Media scope.
- Politics, Work, Societal Engagement, or Orientation discovery.
- EN contextual discovery.
- New taxonomy, new master JSON dataset, embeddings, LLM, OpenAlex, or Finto work.

## 2. Audit Decision

The F4 audit decision remains unchanged:

- Research page: Pattern D, cross-content hub.
- Homepage: Pattern B, discovery entry.
- Implementation status: partial MVP.

F4 uses only the three closed Find & Explore scopes: writings, theses, and publications. Presentations and media remain explicit future workstreams, not hidden dependencies of this checkpoint.

## 3. Research Architecture

The Research contextual surface is a view over existing Pagefind-backed scopes, not a new content model:

```text
FindExplore:publications
FindExplore:theses
FindExplore:writings
        |
shared find-explore.js
        |
researchContext mount
        |
/tutkimus/#tutkimusnaytto
```

No `/data/research-find-explore.json`, `/data/find-explore.json`, or equivalent master endpoint was added.

## 4. Shared-Core Extension

The shared `find-explore.js` runtime now supports a contextual mount with `data-find-explore-kinds`.

The extension keeps the existing single-scope behavior intact and adds only the minimum needed for one mount to query multiple existing scopes.

## 5. Multi-Scope Behavior

The Research mount is configured with:

```text
publications,theses,writings
```

Each scope keeps its own Pagefind filter semantics. The contextual mount fans out into the configured scopes and combines the results for the Research page.

## 6. Mixed Result Model

Mixed results expose a neutral content-type label:

- Publication
- Thesis
- Writing

The contextual list prioritizes discovery and local detail navigation. Content-type-specific actions, such as publication citation details, DOI/JUFO affordances, or thesis source actions, remain on their existing archive/detail surfaces.

## 7. Topic Preset Mapping

F4 does not introduce a second topic taxonomy.

The Research presets map to existing scope-specific Pagefind filters:

- `Publications topic`
- `Theses topic`
- `Writings topic`

Initial presets:

- Tekoäly ja tekoälylukutaito
- Opettajankoulutus
- Koulutusteknologia
- Yhteisöllinen oppiminen
- Ohjelmoinnillinen ajattelu
- TPACK

## 8. Research SSR Preservation

The built-output audit confirms that existing Research page content remains present:

- Research narrative.
- Research-line cards.
- Projects.
- Curated research highlights.
- External profile links.
- Existing ordinary links and crosslinks.

JS-off remains useful because the contextual Find & Explore surface is an enhancement, not a replacement for the page.

## 9. Homepage Discovery Entry

The homepage received only a compact route into Research discovery:

```text
/tutkimus/#tutkimusnaytto
```

The homepage does not embed a Find & Explore mount, filters, contextual result list, or `find-explore.js`.

## 10. Mobile Behavior

The contextual UI uses the existing compact Find & Explore layout: one search region, compact type/year/topic controls, result count, and readable cards.

Focused browser smoke covered the Research contextual surface. No horizontal overflow or mobile-specific layout expansion was introduced by F4.

## 11. Accessibility

F4 reuses the existing Find & Explore accessibility model:

- Labelled search.
- Labelled filters.
- Live result count/status.
- Keyboard-operable controls.
- Existing focus behavior.
- Existing colour/contrast behavior.

The full accessibility/navigation/contrast gate initially hit four parallel Playwright timeouts in the contrast suite. The failures were timeouts, not contrast assertion failures. The suite was rerun without weakening tests:

- `tests/contrast.spec.js --workers=1`: 14/14 passed.
- `tests/accessibility.spec.js tests/navigation.spec.js --workers=1`: 17/17 passed.

Effective accessibility/navigation/contrast result: 31/31 passed.

## 12. Performance

Measured against a fresh baseline build from `origin/main`:

Research page:

- HTML bytes: 120,387 -> 125,998, delta +5,611.
- DOM elements: 1,152 -> 1,205, delta +53.
- Search inputs: 2 -> 3, delta +1.
- Local scripts: 5 -> 6, delta +1.
- Local script bytes: 139,320 -> 158,922, delta +19,602.
- Inline script bytes: 6,241 -> 6,241, delta 0.
- `/data/*.json` references: 0.
- Embedded publication records: 0.

Homepage:

- HTML bytes: 146,386 -> 146,515, delta +129.
- DOM elements: 1,304 -> 1,305, delta +1.
- Search inputs: unchanged.
- Local scripts: unchanged.
- Local script bytes: unchanged.
- Inline script bytes: unchanged.
- Find & Explore mounts: 0.

The first F4 implementation briefly embedded publication records in the Research page. That was removed before closure readiness because Pagefind already provides the required local detail URLs.

## 13. Cross-Content Quality Results

Focused F4 browser coverage passed:

- Publication query `Kosovo` returns the local publication detail URL `/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/`.
- Thesis query `Riikonen` returns a local thesis detail URL under `/opinnaytteet/`.
- Writing query `Kampuspohdintaa` returns a local writing URL.
- Only publications, theses, and writings appear in the contextual result set.
- Homepage discovery link routes to the Research contextual surface.
- Homepage does not load the Find & Explore runtime.

Result: `tests/f4-research-find-explore.spec.js` passed 2/2.

## 14. Writings Regression

Writings regression gates passed:

- `node scripts/audit-writings-built-output.js`: passed, canonical total 290.
- `node scripts/audit-writings-pagefind.js`: passed.

Pagefind result summary:

- FI sample: 3/3 found, 3/3 top 1.
- EN sample: 6/6 found, 6/6 top 1.
- Topic sample: 4/4 found.

## 15. Theses Regression

Theses regression gates passed:

- `node scripts/audit-theses-built-output.js`: passed, canonical total 169.
- `node scripts/audit-thesis-pagefind.js`: passed.

Pagefind result summary:

- Title sample: 8/8 detail found, 8/8 top 1.
- Author sample: 4/4 detail found, 4/4 top 1.
- Filter-only sample: 4/4 detail found, 3/4 top 3.

## 16. Publications Regression

Publications regression gates passed:

- `node scripts/audit-publications-f3b-built-output.js`: passed, canonical total 56.
- `node scripts/audit-publication-pagefind.js`: passed with the known P4c limitation unchanged.

Pagefind result summary:

- Plain title sample: 8/8 detail found, 8/8 top 1.
- Exact-title sample remains weaker and is documented as a pre-existing Pagefind quality limitation, not an F4 regression.

## 17. Build / Unit Results

Validation commands completed:

- `npm run build:no-og`: passed.
- `npm run test:unit`: 389/389 passed.
- `node scripts/audit-f4-research-built-output.js`: passed.
- Combined browser smoke for writings, theses, publications, and F4: 9/9 passed.
- Accessibility/navigation/contrast serial rerun: 31/31 passed.

The build used existing cache-fallback behavior for external enrichment calls under the sandboxed network environment.

## 18. Remaining Limitations

Known limitations after F4:

- EN contextual discovery is not implemented because language/subset semantics require a separate decision.
- Presentations remain out of scope for F4 despite improved detail parity in the prior presentation branch.
- Media remains out of scope and still needs a suitability audit.
- Publication exact-phrase Pagefind ranking remains weaker than normal title search, as documented in the publication P4c audit.
- The contextual Research surface intentionally does not expose every archive-level advanced filter or content-type-specific action.

## 19. EN Decision

F4 is FI-first.

No EN Research contextual surface was added because the prompt explicitly required stopping before silently choosing a new language policy. A future EN checkpoint should define whether Finnish records appear in EN contextual discovery, whether EN uses a subset, and how labels should be localized.

## 20. Closure Readiness

F4 is ready for formal closure.

Evidence:

- Research uses only publications, theses, and writings.
- Homepage remains orientation-first and does not load Find & Explore.
- No new master JSON dataset was created.
- Shared Find & Explore core remains the single runtime.
- Writings, theses, and publications regressions remain green.
- Build, unit, browser smoke, built-output audit, and accessibility/navigation/contrast gates are green.

F4 should stop here. Do not start F3C, F3D, O1, or another main-page rollout inside this checkpoint.
