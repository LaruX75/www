# PF2 — Shared Sisältö Facet Across Pagefind Detail Pages

Date: 2026-08-16
Status: Implementation. Additive, filter-only, no UI redesign.
PF1 basis: `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md`
PF2 machine data: `docs/data/pf2-shared-sisalto-facet-audit-2026-08-16.json`
PF2 audit script: `scripts/audit-pf2-sisalto-facet.js`

## 1. Scope

Add a shared user-facing Pagefind content-family facet, `Sisältö:*`, to
every Pagefind-indexed detail record across the five families audited
by PF1. This narrows the site-wide Pagefind vocabulary to a coherent,
Finnish, user-shaped label set — without redesigning archive layouts,
introducing starter chips, changing Research membership, or touching
outlet normalization or Pagefind startup performance.

## 2. PF1 basis

PF1 (`docs/pf1-user-facing-discovery-model-audit-2026-08-16.md`)
established:

- The user-facing `Sisältö:` facet exists properly only for media
  (`Sisältö:Mediassa`, from M2).
- The other four families rely on technical filter names
  (`FindExplore:publications`, `Writings content type`, etc.) that are
  implementation-shaped rather than user-shaped.
- The narrowest useful next step is a shared `Sisältö:` vocabulary
  before starter chips, card refactors, or performance work.
- Research is a *contextual discovery view*, not a content family, and
  must not appear as a `Sisältö:` value.
- Writings is technically valid but too broad as a user mental model;
  its visible content-family label is `Kirjoitukset ja puheenvuorot`.
  Writings does not get restructured in PF2.

PF2 follows PF1's recommendation and vocabulary verbatim.

## 3. Vocabulary implemented

Finnish site-wide `Sisältö` values registered as Pagefind filters:

| `Sisältö:*` value | Content family |
| --- | --- |
| `Julkaisut` | scientific publications |
| `Opinnäytteet` | theses (supervised + reviewed) |
| `Esitykset` | presentations |
| `Kirjoitukset ja puheenvuorot` | writings (blog, opinions, columns, statements, speeches) |
| `Mediassa` | media appearances (already live from M2) |

Explicitly **not** added:

- `Sisältö:Tutkimus` — Research is a contextual view label on
  `/tutkimus/`, not a content family. Research membership stays
  `contexts.includes("research")`.

English display equivalents are documented in PF1; PF2 does not
duplicate the Pagefind filter values in English because no bilingual
facet pattern is already established in the codebase for site-wide
filter groups (only `Kieli:Suomi | English` is bilingual today, and
that is a language-metadata filter, not a content-family label).

## 4. Family-to-Sisältö mapping

Each family's detail records emit exactly one canonical `Sisältö:*`
filter, via the family's existing Pagefind document builder — no new
data-source shape, no new template surface.

| Family | Builder / injection site | Sisältö value |
| --- | --- | --- |
| Publications | `src/_utils/publicationsFindExplore.js` → `buildPublicationFindExploreDocument` → emitted via `pagefindDocument.filters` in `src/_includes/base.njk` | `Sisältö:Julkaisut` |
| Theses | `src/_utils/thesesFindExplore.js` → `buildThesisFindExploreDocument` → same base.njk path | `Sisältö:Opinnäytteet` |
| Writings (writings-only) | `src/src.11tydata.js` → `resolvePagefindWritings` → same base.njk path | `Sisältö:Kirjoitukset ja puheenvuorot` |
| Presentations | `scripts/_lib/presentationPagefind.js` → `buildPresentationPagefindFilters` (both HTML injection and custom Pagefind records) | `Sisältö:Esitykset` |
| Media | `src/_includes/media-item.njk` (from M2) | `Sisältö:Mediassa` |

Publications/writings overlap handling: `resolvePagefindDocument` in
`src/src.11tydata.js` prefers publications over writings, so a page
that appears in both feeds (all 56 scientific publications shown in
the writings archive) carries `Sisältö:Julkaisut` — never both. The
PF2 audit reflects this by expecting `Sisältö:Kirjoitukset ja
puheenvuorot` only on the 234 writings-only URLs (writings pageUrls
minus publications pageUrls).

## 5. Files changed

- `src/_utils/publicationsFindExplore.js` — prepend `{ name: "Sisältö", value: "Julkaisut" }` to `buildPublicationFindExploreDocument`'s filter list.
- `src/_utils/thesesFindExplore.js` — prepend `{ name: "Sisältö", value: "Opinnäytteet" }` to `buildThesisFindExploreDocument`'s filter list.
- `src/src.11tydata.js` — prepend `{ name: "Sisältö", value: "Kirjoitukset ja puheenvuorot" }` to `resolvePagefindWritings`'s filter list.
- `scripts/_lib/presentationPagefind.js` — add `"Sisältö": ["Esitykset"]` to `buildPresentationPagefindFilters`. Same filter map is consumed by both `injectPresentationPagefindMetadata` (HTML pages) and `buildPresentationCustomRecord` (custom Pagefind records for presentations without local HTML), so both surfaces gain the value in one edit.
- Media detail template (`src/_includes/media-item.njk`) — unchanged; already emits `Sisältö:Mediassa` from M2.

New audit and test:

- `scripts/audit-pf2-sisalto-facet.js` — deterministic verification script.
- `tests/pf2-sisalto-facet.spec.js` — Playwright smoke exercising Pagefind's runtime filter API against a real build.
- `docs/pf2-shared-sisalto-facet-2026-08-16.md` — this report.
- `docs/data/pf2-shared-sisalto-facet-audit-2026-08-16.json` — machine-readable audit output.

No product JS, no CSS, no data-layer utility other than the four
builders listed above was touched. No archive templates, no result
cards, no starter chips.

## 6. Pagefind metadata changes

Only one Pagefind attribute shape was introduced. Each detail page /
custom record now emits an additional hidden span (or filter map
entry) of the form:

```html
<span hidden data-pagefind-filter="Sisältö:{value}"></span>
```

where `{value}` is one of the five vocabulary members. No
`data-pagefind-meta`, no `data-pagefind-sort`, and — critically — no
`data-pagefind-body` were added.

The full existing family-specific filter set (`FindExplore:*`,
`Publications *`, `Theses *`, `Writings *`, `Presentation*`,
`Research context`) is unchanged. `Sisältö:*` sits alongside them as
a new, orthogonal, user-facing filter group; nothing is removed.

## 7. Research boundary

Verified against `scripts/audit-f4-research-built-output.js` on the
PF2-modified build:

| Kind | Eligible |
| --- | --- |
| publications | 53 |
| theses | 169 |
| writings | 62 |
| presentations | 33 |
| **total** | **317** |

- Research population is exactly the F4 closure number, unchanged.
- No `Sisältö:Tutkimus` filter was added anywhere.
- `Research context:research` still comes from `contexts.includes("research")`
  in each family's document builder — PF2 did not touch that logic.
- Media has 0 items with `Sisältö:Julkaisut / Opinnäytteet / Esitykset / Kirjoitukset ja puheenvuorot`, so media is not accidentally
  reclassified into another family. It stays `Sisältö:Mediassa` and
  outside Research.

## 8. Media boundary

- Media detail pages continue to carry `Sisältö:Mediassa` (73 / 73
  coverage, verified via the PF2 audit).
- `mediaOutlet` remains as Pagefind meta only — PF2 did not promote
  it to a user-facing facet.
- No outlet-string normalization was performed.
- Media remains absent from Research; the M2 media browser smoke
  continues to pass in this build.

## 9. Writings boundary

- Writings-only URLs (234) carry `Sisältö:Kirjoitukset ja puheenvuorot`.
- Writings that are also publications (56) carry `Sisältö:Julkaisut`
  via the publications-first resolver priority — matching what a
  human reader would expect ("this is a scientific publication").
- No writings genres were removed, split, or renamed.
- Writings visible archive label was NOT changed in PF2 — that
  belongs to a follow-up UI checkpoint. Only the Pagefind facet
  value is aligned with PF1's vocabulary.
- Open PF1 question about whether `scientificPublication` should
  remain visible inside `/kirjoitukset/` now that `Sisältö:Julkaisut`
  exists globally is **not resolved by PF2** — deferred as a
  discovery/UX decision.

## 10. Presentation boundary

- Every presentation record (both HTML-mapped detail pages and
  custom Pagefind records for presentations without local HTML)
  emits `Sisältö:Esitykset`. Audit reports 218 / 218 coverage on the
  canonical presentation set.
- Presentation topic mapping is unchanged.
- Presentation Research membership is unchanged (33 eligible via
  `contexts.includes("research")`).
- F3C archive behavior is unchanged; the presentation archive
  browser smokes continue to pass.
- No duplicate presentation results were introduced — the same
  `buildPresentationPagefindFilters` function feeds both HTML
  injection and custom records, so a presentation record has one
  Sisältö value in whichever Pagefind entry Pagefind indexes.

## 11. Pagefind body-gate guard

M2 discovered that `data-pagefind-body` is a **site-wide** gate:
once any HTML file uses it, pages missing the marker are dropped
from the Pagefind index. PF2 preserves the guard:

- No `data-pagefind-body` was added on any publication, thesis,
  writing, presentation, or media detail page.
- The PF2 audit re-verifies this per-family via
  `noHtmlDetailUsesPagefindBody` and reports zero occurrences.
- The M2 reverse gate `noDetailUsesPagefindBody` on media pages
  continues to pass.

Pagefind index size after PF2 (from `_site/pagefind/pagefind-entry.json`):
`fi:1163 / en:346` pages — identical to the plain-main baseline. No
collapse.

## 12. Audit results

`node scripts/audit-pf2-sisalto-facet.js` — all gates green:

| Gate | Status |
| --- | --- |
| `publicationsAllHaveSisalto` | pass (56 / 56) |
| `writingsAllHaveSisalto` (writings-only) | pass (234 / 234) |
| `thesesAllHaveSisalto` | pass (169 / 169) |
| `mediaAllHaveSisalto` | pass (73 / 73) |
| `presentationsAllHaveSisalto` | pass (218 / 218) |
| `noHtmlDetailUsesPagefindBody` | pass (0 occurrences) |
| `noDuplicateSisaltoPerDetailPage` | pass |
| `pagefindIndexPresent` | pass |
| `pagefindIndexHasBothLanguages` | pass (fi + en) |

Also run:

- `node scripts/audit-media-pagefind-m2.js` — all gates green
  (including the reverse `noDetailUsesPagefindBody` guard).
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `node scripts/audit-f4-research-built-output.js` — Research
  population 317 unchanged; media not enumerated.

Total detail records covered by the Sisältö facet: **750** (56 + 234
+ 169 + 73 + 218).

## 13. Browser verification

`DISABLE_OG_IMAGES=true npx playwright test tests/pf2-sisalto-facet.spec.js
--workers=1` — **6 / 6 pass**:

- Pagefind exposes all five `Sisältö` values as a filter group with
  positive record counts.
- `Sisältö:Julkaisut` + query "Kosovo" returns a `/julkaisut/…` hit.
- `Sisältö:Opinnäytteet` + query "thesis" returns a
  `/opinnaytteet/{id}/` hit.
- `Sisältö:Esitykset` + query "ohjelmointi" returns a
  `/presentations/…` or `/en/presentations/…` hit.
- `Sisältö:Kirjoitukset ja puheenvuorot` + query "valtuustossa"
  returns a `/YYYY/MM/DD/…` writing hit.
- `Sisältö:Mediassa` + query "tekoäly" returns a `/mediassa/…` hit.

Sibling smokes (`f2-find-explore-smoke`, `f3a-theses-find-explore`,
`f3b-publications-find-explore`, `f4-research-find-explore`,
`presentations-archive`, `presentations-research-smoke`,
`media-archive`) — **16 / 16 pass**.

Unit suite: **401 / 401 pass**.

## 14. Remaining limitations

- Starter chips not implemented. PF1 identified starter-chip UI as a
  separate discovery-shell workstream; PF2 only adds the underlying
  Pagefind vocabulary that a future starter-chip UI could bind to.
- Result-card consistency across families not implemented. PF1
  observed inconsistent result-card behavior between archives; PF2
  changed only Pagefind filter emission, not any card layout.
- PF-PERF1 not implemented. Pagefind startup performance remains
  queued as its own workstream.
- Media outlet/source normalization still deferred. `mediaOutlet`
  remains Pagefind meta only, not a facet, pending a normalization
  decision on the 28 distinct outlet strings.
- Site-wide `data-pagefind-body` strategy remains separate. All
  detail pages continue to index full `<body>` (nav, footer, news
  ticker included). Introducing a coherent site-wide body scope is
  a cross-archive workstream.
- No English variant of the Sisältö vocabulary. The Pagefind filter
  values are Finnish only, matching the current bilingual convention
  (only `Kieli:Suomi|English` is bilingual today). English display
  labels are documented in PF1 for future UI use.
- Writings-vs-publications overlap not resolved. PF1's open question
  about whether scientific publications should remain visible in
  `/kirjoitukset/` once `Sisältö:Julkaisut` exists globally is not
  answered by PF2.

## 15. Next recommended step

**Result-card consistency across families** (from PF1 §14). With a
coherent `Sisältö:*` vocabulary in place, the next narrowest useful
step is to align how a Pagefind hit renders across archives — same
title / meta / URL / thumbnail treatment — so that a global-search
result under `Sisältö:Julkaisut` visually reads the same shape as
`Sisältö:Esitykset` or `Sisältö:Mediassa`. This is a template /
partial refactor, not a data change.

PF-PERF1 (Pagefind startup performance audit) remains queued and
should follow the result-card work unless startup slowness becomes
urgent independently.
