# PF2 — Shared Sisältö Facet Closure

Date: 2026-08-16
Status: **PF2 SHARED SISÄLTÖ FACET = CLOSED / GREEN**

## 1. Status

PF2 is closed. `feat: add shared Sisältö facet to Pagefind details` is
on `main`, all post-merge workflows are green, and every Pagefind-
indexed detail record now carries a user-facing `Sisältö:*` filter
value from the PF1-approved vocabulary.

## 2. Repository state

- PR: [#91 feat: add shared Sisältö facet to Pagefind details](https://github.com/LaruX75/www/pull/91) — merged 2026-08-16T07:23:50Z by LaruX75.
- Merge commit: `18deec801fe3771b467e0a4825251e1134755244`.
- PF2 implementation commit: `b4c4fa7e188214caafbf7b9cf591ed4398b3c5c2`.
- Main HEAD at closure time: `18deec801fe3771b467e0a4825251e1134755244`.
- Merge method: merge commit (repo convention).
- Head SHA at merge time: `b4c4fa7e…` — protected via `gh pr merge --match-head-commit`.
- No conflicts at merge.
- Post-merge GitHub Actions on `18deec80`:
  - `Build and Deploy` — completed / success.
  - `Generate OG Images` — completed / success.
  - `Accessibility and navigation tests` — completed / success.

Prior related closures already on main:

- `d87bf586 docs: close M2 Media Find and Explore rollout`
- `70af3d7c docs: land PF1 user-facing discovery model audit`

## 3. Scope delivered

- Shared user-facing `Sisältö:` Pagefind facet emitted on every detail
  record across publications, theses, writings-only, presentations,
  and media.
- Additive-only change: no data-source shape modified, no canonical
  content model introduced, no archive templates or result cards
  redesigned, no starter chips added, no `data-pagefind-body`
  introduced (M2 site-wide gate guard preserved and reinforced by a
  matching PF2 reverse gate).
- No PF-PERF1, no writings restructuring, no Research semantic
  change, no outlet/source normalization.

## 4. Final vocabulary

Finnish site-wide `Sisältö` values now registered as a Pagefind
filter group:

- `Sisältö:Julkaisut`
- `Sisältö:Opinnäytteet`
- `Sisältö:Esitykset`
- `Sisältö:Kirjoitukset ja puheenvuorot`
- `Sisältö:Mediassa`

`Sisältö:Tutkimus` was deliberately **not** added — Research is a
contextual view on `/tutkimus/`, not a content family.

## 5. Coverage

Deterministic PF2 audit (`scripts/audit-pf2-sisalto-facet.js`)
verified on the merge commit build:

| Family | Coverage |
| --- | --- |
| Publications | 56 / 56 (`Sisältö:Julkaisut`) |
| Theses | 169 / 169 (`Sisältö:Opinnäytteet`) |
| Writings-only pages | 234 / 234 (`Sisältö:Kirjoitukset ja puheenvuorot`) |
| Publication-backed writings | 56 / 56 as `Sisältö:Julkaisut` via publications-first resolver priority |
| Presentations | 218 / 218 (`Sisältö:Esitykset`) — both HTML-injected records and custom Pagefind records via a single `buildPresentationPagefindFilters` source |
| Media | 73 / 73 (`Sisältö:Mediassa`) — pre-existing from M2 |
| **PF2 audit total** | **750 detail records** |

`noDuplicateSisaltoPerDetailPage` gate confirms no page carries more
than one `Sisältö:*` value.

## 6. Writings boundary

- `writings` remains a technical family — not restructured by PF2.
- User-facing content-family label for pure writings is
  `Kirjoitukset ja puheenvuorot`.
- Writing genres (blog, opinion, column, statement, speech) were not
  split into new archives, not renamed, not removed.
- Publication-backed writing pages (the 56 scientific publications
  also displayed in the writings archive) resolve to
  `Sisältö:Julkaisut` via `resolvePagefindDocument` in
  `src/src.11tydata.js`, which checks publications before writings.
  No page carries both `Sisältö:Julkaisut` and
  `Sisältö:Kirjoitukset ja puheenvuorot`.
- The deeper PF1 question — whether `scientificPublication` should
  remain visible inside `/kirjoitukset/` now that `Sisältö:Julkaisut`
  exists globally — remains a later task.

## 7. Research boundary

Verified against `scripts/audit-f4-research-built-output.js` on the
merge commit:

| Kind | Eligible |
| --- | --- |
| publications | 53 |
| theses | 169 |
| writings | 62 |
| presentations | 33 |
| **total** | **317** |

- Research population unchanged from the F4 closure baseline.
- Research membership rule unchanged: `contexts.includes("research")`.
- No `Sisältö:Tutkimus` filter anywhere in the site.
- Media not enumerated in Research; no page in the media family
  carries a Research-context Pagefind filter.
- Topic mapping is not used as Research membership.
- `resolveContexts()` untouched.

## 8. Pagefind body-gate boundary

- No `data-pagefind-body` introduced on any publication, thesis,
  writing, presentation, or media detail page.
- The M2 reverse gate (`noDetailUsesPagefindBody` in
  `scripts/audit-media-pagefind-m2.js`) continues to pass.
- The PF2 audit adds a matching site-wide reverse gate
  (`noHtmlDetailUsesPagefindBody`) that fails if any family
  re-introduces the marker.
- Pagefind index size (`_site/pagefind/pagefind-entry.json`) verified
  at `fi:1163 / en:346` pages — identical to the plain-main
  baseline. No index collapse.

## 9. Verification

GitHub post-merge workflows on `18deec80`:

- `Build and Deploy` — completed / success (`31933770512`).
- `Generate OG Images` — completed / success (`31933770474`).
- `Accessibility and navigation tests` — completed / success (`31933770459`).

Pre-merge local verification (on the exact PF2 commit `b4c4fa7e`, run
during the PF2 implementation checkpoint):

- `npm run build:no-og` — green (1442 HTML documents indexed;
  Pagefind entry `fi:1163 / en:346`).
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf2-sisalto-facet.js` — all 9 gates green;
  750 detail records covered.
- `node scripts/audit-media-pagefind-m2.js` — all gates green
  including the reverse `noDetailUsesPagefindBody` guard.
- `node scripts/audit-f4-research-built-output.js` —
  `ok: true`, `totalResearchPopulation: 317`, media not enumerated.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `DISABLE_OG_IMAGES=true npx playwright test tests/pf2-sisalto-facet.spec.js
  --workers=1` — **6 / 6 pass** (Pagefind runtime `filters()` API
  reports all five `Sisältö` values with positive record counts;
  every family's Sisältö filter narrows real Pagefind search to the
  expected URL pattern).
- Sibling smokes (`media-archive`, `f2-find-explore-smoke`,
  `f3a-theses-find-explore`, `f3b-publications-find-explore`,
  `f4-research-find-explore`, `presentations-archive`,
  `presentations-research-smoke`) — **16 / 16 pass**.

Post-merge local re-verification was skipped because the merge is a
straight fast-forward of the identical tree that was already
pre-merge-verified at `b4c4fa7e`, and GitHub Pages deploy on
`18deec80` completed successfully.

## 10. Remaining work

- **PF3 — starter chips / "Aloita tästä"**: give the shared
  `Sisältö:*` facet a first-touch discovery entry point on the site
  shell / global search. Not started; separate workstream.
- **PF1 §14 — result-card consistency across families**: align how
  a Pagefind hit renders across archives so that a `Sisältö:Julkaisut`
  result and a `Sisältö:Mediassa` result share the same title / meta
  / URL / thumbnail treatment. Template / partial refactor; no data
  changes.
- **PF-PERF1 — Pagefind startup performance audit**: still queued.
- **Writings segmentation**: the deeper PF1 question about whether
  `scientificPublication` should remain visible inside
  `/kirjoitukset/` now that `Sisältö:Julkaisut` exists globally is
  deferred.
- **Media outlet / source normalization**: `mediaOutlet` remains
  Pagefind meta only pending a normalization decision on the 28
  distinct outlet strings; still not a user-facing facet.

## 11. Next recommendation

**PF3 / result-card consistency decision audit** — a small
audit-only checkpoint that decides which of the two next
workstreams to run first (PF3 starter chips vs PF1 §14 result-card
consistency), based on current repository state and the discovery
surfaces that most immediately benefit from the newly landed
`Sisältö:*` vocabulary. Do not start either implementation until
that decision is on record.

PF-PERF1 stays queued after that decision unless startup slowness
becomes urgent independently.
