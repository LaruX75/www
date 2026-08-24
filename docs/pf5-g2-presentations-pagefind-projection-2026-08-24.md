# PF5-G2 Presentations Pagefind metadata projection

## Status

IMPLEMENTATION SLICE — implements the REDUCE (GO with constraints) decision from the PF5-G2 suitability audit. Adds the missing `resolvePagefindPresentations(data)` projector to `src/src.11tydata.js` so the shared `SearchResultPresenter`'s dormant presentations kind branches (which existed since PF5-G1) now activate on real Pagefind results. Zero renderer/CSS change.

## Branch / base / HEAD

- **Branch:** `pf5/g2-presentations-metadata`
- **Worktree:** `/private/tmp/www-pf5-g2-impl`
- **Base:** `origin/main` = `8798e7d2a431d0fddc9468df08910aa364cfec0d` (post PF5-G1 navbar closure)
- **HEAD at report time:** `8798e7d2a431d0fddc9468df08910aa364cfec0d` (no commit yet — pending review)

## Audit reference

`docs/pf5-g2-presentations-shared-result-suitability-audit-2026-08-24.md` (on the audit branch `audit/pf5-g2-presentations`) — decision: **REDUCE (GO with constraints)**.

## Before state (PROVEN on `8798e7d2`)

- `src/src.11tydata.js:127-133` `resolvePagefindDocument` had NO presentations branch.
- 135 presentation detail pages in `_site/presentations/` emitted **only** `data-pagefind-filter="Kieli:Suomi"` — zero `Presentation*` meta, zero `Sisältö:Esitykset`.
- Shared presenter's `detectKind` for presentations (`src/js/search-result-presenter.js:82`) checked `PresentationYear || PresentationType || PresentationEvent || PresentationId` — **all four dead-code paths** because no page ever emitted the meta.
- Global search on FI + EN + navbar rendered presentations as kind `unknown`: no family badge, no year, no primary-meta line.
- F&E Research context on `/tutkimus/` (mixed-kind `publications,theses,writings,presentations`) rendered presentations with empty resultMeta for the same reason.

## Metadata gap → G2 minimal projection

Following the existing `resolvePagefindWritings` / `resolvePagefindPublications` pattern:

- Added `presentationsLookupCache` (WeakMap keyed by `data.collections`).
- Added `getPresentationsLookup(data)` that calls `buildPresentationsPageSourceData(data)` + `buildCanonicalPresentationItems(sourceData)` and indexes enriched canonical items by both `pageUrl` and `localPageUrl` (following the pattern at `_data/presentationsPage.js:1058-1063`). External-first records without a local pageUrl are naturally absent from the lookup and cannot match `data.page.url`.
- Extracted `projectPresentationRecord(item)` as a **pure** helper (no filesystem I/O) — the unit-testable projection from an enriched canonical item to the Pagefind `{filters, meta}` shape.
- Added `resolvePagefindPresentations(data)` — a thin wrapper that does the page-URL lookup then delegates to `projectPresentationRecord`.
- Wired into `resolvePagefindDocument` before publications/writings fallthrough.

## Emitted filters / meta (contract)

Every matched presentation detail page emits:

- `Sisältö: Esitykset`
- `FindExplore: presentations`

Conditionally:

- `PresentationYear: {year}` — when the canonical record has a year.
- `PresentationType: {presentationType}` — when the canonical record has a type (via `normalizePresentationType`).
- `PresentationTopic: {topic}` × up to 6 (via `normalizeFilterValues`, dedup + cap).
- `Research context: research` — **only** when canonical `contexts.includes("research")`. No topic/type/event/sourceKey inference.

Pagefind meta (readable via `data.meta.*` in the shared presenter):

- `PresentationYear: "{year}"` (string)
- `PresentationType: "{type}"`
- `PresentationEvent: "{event}"` — omitted when the canonical record has no event (per audit contract: "no undefined values in Pagefind meta").

## Landing semantics

Unchanged. Pagefind's `data.url` for a matched detail page IS the local canonical landing (e.g. `/presentations/generation-ai-yleisesitys-sovellukset-2026/`). The shared presenter's title link uses `data.url` directly — no client-side landing resolution added.

External-first Canva/YouTube/AOE records without a local detail page:
- Not present in the lookup Map (they lack a local `pageUrl`).
- Never reach `projectPresentationRecord`.
- Continue to be discoverable ONLY via the SSR `/esitykset/` archive.
- SSR archive card's `landingUrl` / `pageUrl` / `sourceUrl` / `externalUrl` semantics untouched.

## Research context (canonical only)

- 33 of the 135 emitting detail pages carry `data-pagefind-filter="Research context:research"` — **matches the audit's stated `33/218` canonical-research-eligible count exactly.**
- `/tutkimus/` mixed-kind F&E mount now sees presentations with populated `data.meta.PresentationType` + `PresentationEvent` on the researchContext path. F&E's existing `kindConfig.presentations.resultMeta` (`find-explore.js:370-372`) then composes the type · event line.
- No topic/type/event/sourceKey heuristic path added or altered.

## FI / EN parity

- FI partition: 135 detail pages emit the new metadata.
- EN partition: 0 detail pages — because the site currently has only `/en/presentations/index.html` (the archive index) under `_site/en/presentations/`, no per-presentation EN detail pages exist. This is pre-existing site structure, not a G2 regression. My projector correctly does nothing on the EN archive page (no canonical record has its `pageUrl`).
- `Kieli` pin unchanged — base.njk emits `Kieli:Suomi|English` per page language.
- PF3 decision preserved: family label `"Esitykset"` (Finnish) reused on EN surface via `SISALTO_LABELS.presentations`. Not reopened here.

## Deletion

Only one code deletion, per the audit's ledger:

- `src/js/search-result-presenter.js:82` — dropped the dead `meta.PresentationId` term from `detectKind`. Zero emitters exist for `PresentationId` in `src/` or `tests/`. Line changed from:
  ```js
  if (meta.PresentationYear || meta.PresentationType || meta.PresentationEvent || meta.PresentationId) return "presentations";
  ```
  to:
  ```js
  if (meta.PresentationYear || meta.PresentationType || meta.PresentationEvent) return "presentations";
  ```

No SSR archive change. No renderer/CSS change. No parallel formatter. G2 is additive projection + one dead-code term removal.

## Tests

### Unit — new spec `tests/unit/resolvePagefindPresentations.test.js`

Tests the pure `projectPresentationRecord(item)` helper + `resolvePagefindPresentations(data)` wrapper. Covers:
- null/undefined item guard
- always emits `Sisältö:Esitykset` + `FindExplore:presentations`
- projects `PresentationYear/Type/Topic` filters + `PresentationYear/Type/Event` meta
- Research context filter emitted **only** for canonical `contexts.includes("research")`
- **NO topic/type/event/sourceKey inference for Research** (proven with a "looks-like-research" fixture that has research-themed topic + event but empty canonical contexts → no Research filter)
- missing optional fields → keys ABSENT from meta (never projected as `undefined`)
- missing year → no `PresentationYear` filter, no meta key
- topics capped at 6, deduplicated
- wrapper returns null when no page.url or no matching record

Result: **10 new tests, all pass.** `npm run test:unit` = **612 pass / 0 fail** (was 602 → +10).

### Build evidence

`_site/` after `npm run build:no-og`:

| Emission | Count |
|---|---|
| Presentation detail pages with `data-pagefind-meta="Presentation*"` (FI + EN) | **135** |
| Pages with `PresentationYear` | 135 |
| Pages with `PresentationType` | 135 |
| Pages with `PresentationEvent` (sparse — canonical field is optional) | **11** |
| Pages with `Sisältö:Esitykset` | 135 |
| Pages with `Research context:research` | **33** (matches audit's canonical-research count exactly) |
| Distinct `PresentationType` values in the build | 8 (`kansainvälinen-konferenssi`, `konferenssi-keynote`, `Koronakevään pikkuvinkit`, `presentation`, `recording`, `täydennyskoulutus`, `Verkkohaaste`, `Verkkoluennon tallenne`) |
| FI archive `/esitykset/` unchanged | verified — still only `Kieli:Suomi`, no new attrs on the archive itself |
| EN presentations HTML output | 1 file (`/en/presentations/index.html` archive index, unchanged) |

Sample enriched detail page `_site/presentations/international-conference-on-the-advancement-of-steam-2024/index.html` emits:
```
data-pagefind-filter="Sisältö:Esitykset"
data-pagefind-filter="FindExplore:presentations"
data-pagefind-filter="PresentationYear:2024"
data-pagefind-filter="PresentationType:kansainvälinen-konferenssi"
data-pagefind-filter="PresentationTopic:AI literacy"
data-pagefind-filter="PresentationTopic:data agency"
data-pagefind-filter="PresentationTopic:Generation AI"
data-pagefind-filter="PresentationTopic:interdisciplinary"
data-pagefind-filter="PresentationTopic:K-12"
data-pagefind-filter="PresentationTopic:STEAM"
data-pagefind-filter="Research context:research"
data-pagefind-meta="PresentationYear:2024"
data-pagefind-meta="PresentationType:kansainvälinen-konferenssi"
data-pagefind-meta="PresentationEvent:International Conference on the Advancement of STEAM (ICAS 2024)"
```

### Browser evidence

New spec `tests/pf5-g2-presentations-shared-result.spec.js` (parameterised FI `/haku/` + EN `/en/search/`, 6 scenarios × 2 = 12 tests):

- ≥ 1 result carries `data-search-result-kind="presentations"`
- family badge renders text `"Esitykset"` with `data-find-explore-family="presentations"`
- `.find-explore-result-year` renders 4-digit year in the family header
- `.find-explore-result-primary-meta` non-empty (type / type · event)
- title href non-empty (deliberately NOT locked to `/presentations/…` path — Pagefind may surface anchor-based sub-results on archive pages; per audit, no client-side landing resolution is added)
- Kieli pin still excludes other-locale results

Result: **12/12 PASS** in 12.1 s.

### Full regression suite

`tests/pf5-g2-...` + `tests/search-modular-ui-pilot.spec.js` + `tests/pf5-g1-navbar-modular-ui.spec.js` + `tests/pf-ui-l10n1-…` + navigation + accessibility + accessibility-tools + contrast + F2 + F3a + F3b + PF2 + PF3 + PF4 = **13 spec files, 144 test cases**.

- Result: **140 pass / 2 documented-skip / 2 non-reproducing flake** in 1.3 min.
- Isolated re-run of the 2 flakes: **7/7 PASS** — cleared.
- Both flakes are the same pre-existing baseline flakes documented in the PF5-G1 navbar rollout closure (`tests/navigation.spec.js:143` Modular UI Input dispatch timing under parallel workers, and `tests/f3b-publications-find-explore.spec.js:36` unrelated F&E publication linkage). Neither is caused by G2.

### Baseline pipeline

- `git diff --check` — clean.
- `npm run test:unit` — 612 pass / 0 fail.
- `npm run build:no-og` — PASS (1472 files, postbuild OK).

### FilterPills regression audit

The audit called out the risk that `Sisältö` FilterPills would gain a new `Esitykset` pill (from 0 to 135 records emitting it). Test outcome:
- `tests/search-modular-ui-pilot.spec.js` (which includes the `sisaltoNarrowPill` assertion — `/Julkaisut/` on FI, `/Opinnäytteet/` on EN) — **PASS unchanged.** The assertion checks presence of a specific pill, not absence of `Esitykset`, so it does not conflict.
- `tests/pf2-sisalto-facet.spec.js` — PASS.
- `tests/pf3-result-card-consistency.spec.js` — PASS.
- `tests/pf4-result-card-hierarchy.spec.js` — PASS.

## Regressions / flakes

None caused by G2. Two known baseline flakes reproduced in the combined run (both proven pre-existing during the PF5-G1 rollout), both cleared on isolated re-run.

## LOC delta

| File | Change | LOC |
|---|---|---|
| `src/src.11tydata.js` | +presenter projector (getPresentationsLookup + projectPresentationRecord + resolvePagefindPresentations + wiring) + named exports for tests | +65 |
| `src/js/search-result-presenter.js` | drop dead `PresentationId` term in `detectKind` | +0 / −0 (in-place edit) |
| `tests/unit/resolvePagefindPresentations.test.js` | new | +148 |
| `tests/pf5-g2-presentations-shared-result.spec.js` | new | +112 |
| `docs/pf5-g2-presentations-pagefind-projection-2026-08-24.md` | this evidence doc | new |

Net production runtime: **≈ +65 LOC** in `src.11tydata.js`. Zero JS/CSS/renderer change on the client.

## Final status

**READY FOR MERGE.**

Pagefind metadata projection PROVEN; unit tests + browser regression + build evidence + FI/EN parity + Research canonical-only eligibility + deletion (dead `PresentationId` term) all satisfied. G2 activates a dormant shared-presenter capability without adding a parallel renderer or changing the SSR archive.

Follow-ups explicitly out of scope (unchanged from audit):
- `renderExcerpt` non-convergence
- FilterPills MutationObserver
- generated unused `pagefind-ui.{js,css}`
- external-first records without local detail — remain SSR-archive-only
- thumbnails / source icons on shared card
- FULL Pagefind on `/esitykset/`
- F&E mount on `/esitykset/`
