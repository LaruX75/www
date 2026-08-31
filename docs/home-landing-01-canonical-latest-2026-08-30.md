# HOME-LANDING-01 — Homepage Latest-Content Canonical Landing Convergence

Date: 2026-08-30 (branch), reconciliation authored 2026-08-31.
Status: `IMPLEMENTED / SSR / TESTS GREEN`

Routes the FI homepage "Uusin julkaisu" and "Uusin esitys" role
cards through canonical local detail pages instead of raw source
URLs (DOI / Canva). Consumes existing canonical projections; no new
`_data` reader, no new URL resolver, no Markdown/YAML parser
introduced.

**Update 2026-08-31 (post PRES-YT-DATE-01 rebase):** the initial
implementation contained a template-level `_presWithDate` push-loop
that filtered out `collections.presentations` items without an
explicit `data.date`. That filter was a **workaround** for a
now-fixed canonical metadata defect (`larun-pikkuvinkit.md` had no
frontmatter date; Eleventy fell back to file mtime, surfacing a 2020
videosarja as if it were 2026 content). PRES-YT-DATE-01
(`docs/pres-yt-date-01-youtube-date-reconciliation-2026-08-31.md`)
repaired the canonical Presentation date. This branch was rebased
onto PRES-YT-DATE-01 and the eligibility filter was **removed**. The
homepage now consumes `collections.presentations` directly via
`sort(true, false, "date") | first` — no malformed-data eligibility
rule, no template-level chronology guard. Chronology ownership stays
in canonical Presentation frontmatter.

## Repository state

- Branch: `ux/home-landing-01-canonical-latest`
- Base: `origin/main` at `7d45001d8809c17fd8910003ec6b91be00f10bc1`.
- Reference: `docs/post-closure-next-workstream-selection-audit-2026-08-29.md`, `docs/rp-converge-01-company-presentations-convergence-2026-08-30.md` (canonical Presentation pipeline / `collections.presentations` model).

## User-visible problem

Two of the FI homepage role cards previously sent users directly to third-party sources rather than the site's canonical detail pages:

### Before

```
Uusin julkaisu
  title: Co-constructing adaptive lesson plans with GenAI: Pre-service teachers' Intelligent-TPACK
  href:  https://doi.org/10.1016/j.compedu.2025.105485  (target=_blank, external)

Uusin esitys
  title: AI Friend or Foe? – Tekoäly: ystävä vai vihollinen?
  href:  https://www.canva.com/design/DAHI6X6dR_g/_Jy-hfDeDZU5UA6DVkWjrQ/view  (target=_blank, external)
```

Data source:
- `roleLatestResearch = (researchfi or [])[0]` — raw Research.fi API row (source-oriented).
- `roleLatestPresentation = ((canva.fiRows or canva.tableRows or [])[0])` — raw Canva ingest row (source-oriented).

Effect: homepage bypassed the site's canonical detail pages even when local canonical landings existed. Inconsistent with the established architecture:

```
canonical content → Eleventy/Nunjucks → canonical detail page → optional source CTA
```

### After

```
Uusin julkaisu
  title: Assessing Digital Competence of K1-12 Teachers in Kosovo: A Study through the Lens of…
  href:  /julkaisut/rf-a1-10-1016-j-caeo-2026-100396/          (canonical local landing)
  meta:  2026 · Computers and Education Open

Uusin esitys
  title: Arjen tekoälyhaaste
  href:  /presentations/arjen-tekoalyhaaste/                   (canonical local landing)
  meta:  6. toukokuuta 2026
```

Data source:
- `roleLatestResearch = (publicationDetailPages.items or []) | sort(true, false, "date") | first` — existing canonical Publications projection; each item exposes `pageUrl` = `/julkaisut/{id}/`.
- `roleLatestPresentation = (collections.presentations or []) | sort(true, false, "date") | first` — existing canonical Presentations collection; item URL comes from Eleventy's canonical permalink. Direct sort, no eligibility filter (PRES-YT-DATE-01 repaired the underlying `larun-pikkuvinkit.md` date defect that previously required the workaround).

Both hrefs verified against the built site by resolving the URL via `page.request.get(href)`.

## Authoritative sources

- **Publications**: `publicationDetailPages` global data function (`src/_data/publicationDetailPages.js`). Its `.items` array is the canonical projection that unifies Research.fi + local `src/publications/` MDs through `buildCanonicalPublicationDetailsModel(...)`. Each item exposes `pageUrl` = `canonicalPublicationDetailUrl(publicationId)` = `/julkaisut/{id}/`. Same authority as the `/julkaisut/` "Julkaisuluettelo" index page and all `/julkaisut/{id}/` detail pages.
- **Presentations**: `collections.presentations` (produced by `src/presentations/*.md` + `presentations.11tydata.js` with `tags: "presentations"`). Item `.url` is the canonical Eleventy permalink (`/presentations/{slug}/`). Same authority as the Presentations archive, the /kouluttaja/ strip (RP-CONVERGE-01), and the R1 shared sidebar consumers.

## Selection semantics

- **Sorting**: date descending in both cases.
  - Publications: `sort(true, false, "date")` on the projection's `.date` field (ISO-like `YYYY-01-01` from `publication.year`).
  - Presentations: `sort(true, false, "date")` on the Eleventy item's canonical `date`. Every Presentation MD carries an explicit frontmatter `date:` after PRES-YT-DATE-01 (the last date-less file, `larun-pikkuvinkit.md`, was repaired with its authoritative source date `2020-03-23`). No template-side eligibility filter is required.
- **Eligibility**: publication items must have `pageUrl` (canonical local landing). No presentation-side eligibility filter — every canonical Presentation MD declares a frontmatter date.
- **Cardinality**: `first` — a single item per role card.
- **Determinism**: at build time, from canonical fields. No inference, no title/filename regex, no city-name heuristic, no source-oriented ordering.

## Landing / source semantics

- **Publications**: canonical local `/julkaisut/{id}/` per `canonicalPublicationDetailUrl` (line 84 of `src/_data/publicationsPage.js`). The DOI / journal source URL remains available on the canonical detail page (the detail page carries source CTAs — verified by a follow-up assertion in the regression test).
- **Presentations**: canonical local `/presentations/{slug}/` per Eleventy's Presentation permalink. The external source URL (Canva/YouTube/OuluREPO) remains available on the canonical detail page via the standard source CTA — this preserves Presentation Slice 3 closure semantics.
- **No `target="_blank"` on either card**: both are internal navigations. Verified by regression test.

## O1 orientation

Homepage role-card latest links do not carry `?returnTo=/` — that follows the current site pattern (the FI homepage's existing "Uusin valtuustopuheenvuoro" role card already uses a plain internal href without returnTo). No new orientation convention introduced. `src/js/find-explore.js` is untouched.

## FI / EN parity

**Justified FI-only asymmetry.** `src/en/index.njk` has no `roleLatest*` / `home-role-latest*` pattern — its homepage design uses different sections (for/of loops directly listing top-3 publications and top-3 presentations for archive-like discovery cards). There is no equivalent EN role-card surface to converge. This is a content-model/UI difference between the two homepages, not accidental architecture drift.

Verified by `grep -n 'roleLatest\|home-role-latest' src/en/index.njk` → zero matches.

## Renderer / template scope

Modified files:

- `src/index.njk` — three edits inside the `#roolit` (role-cards) section:
  1. Data preamble (lines 113–115): replace source-oriented `roleLatestResearch` / `roleLatestPresentation` bindings with canonical-collection queries. Preamble also removes the now-obsolete `roleLatestPresentationTitle` helper (used only inside the training-role card block).
  2. University role card (lines 165–171): `href` from external `roleLatestResearch.url` → canonical `roleLatestResearch.pageUrl`; `target="_blank" rel="noopener noreferrer"` removed (internal navigation); meta uses `roleLatestResearch.year` + `.journal`.
  3. Training role card (lines 227–233): `href` from external `roleLatestPresentation.url` → canonical `roleLatestPresentation.url` (Eleventy permalink); `target="_blank" rel="noopener noreferrer"` removed; title/meta reads `roleLatestPresentation.data.title` / `.data.date`.

No new template partial. No new helper filter. Nunjucks-native `sort(true, false, "date") | first` on both bindings. After PRES-YT-DATE-01 the initial `_presWithDate` push-loop workaround was removed — no template-level chronology guard remains.

## Deletion

- **Removed**: `{% set roleLatestPresentationTitle = roleLatestPresentation.title or "" %}` (was only used in the training role card's title text; no other consumers).
- **Removed**: `target="_blank" rel="noopener noreferrer"` attributes on the two role-card title anchors (no longer external).
- **Removed (post PRES-YT-DATE-01 update)**: the `_presWithDate` push-loop filter and its `{% for %}{% if _p.data.date %}{% endfor %}` block — no longer needed after the canonical Presentation date defect was repaired at the source of truth.
- **Retained**: `researchfi` and `canva.fiRows` / `canva.tableRows` global data — still consumed by other homepage sections (topic cards, hero counters, etc.) and by broader site surfaces. Not touched. Broader consumer audit of these two globals is out of scope for HOME-LANDING-01.

Net template diff (post PRES-YT-DATE-01 update): only replaces the two role-card data bindings and two `<a>` elements. Direct one-line canonical-collection selectors — no eligibility filter. No production JS, CSS, canonical data, or Pagefind change.

## Tests

- **Unit** (`npm run test:unit`): **642 pass / 0 fail** (baseline). One prior flaky failure of `researchfi loader shares one Promise across concurrent callers` in `tests/unit/buildDataLoaderMemoization.test.js:64` was observed once during the working session; three consecutive re-runs subsequently green. Verified as pre-existing timing flakiness (independent of HOME-LANDING-01 — reproduces on clean main via `git stash`).
- **Full build**: `CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --input=src --output=_site` — PASS. `Copied 274 Wrote 1472 files`. No template errors.
- **Targeted Playwright** (`tests/home-landing-01-canonical-latest.spec.js`): **5 pass / 0 fail** against static-server build. Assertions:
  1. "Uusin julkaisu" href starts with `/julkaisut/`, doesn't contain doi.org / researchportal, and resolves as a real built page.
  2. "Uusin esitys" href starts with `/presentations/`, doesn't contain canva.com / canva.link / youtube.com / slideshare.net, and resolves as a real built page.
  3. Neither role-card latest link has `target="_blank"` (internal navigation).
  4. SSR proof — both cards render with `javaScriptEnabled: false`.
  5. Publication detail page reached from homepage retains at least one external source CTA (`a[target="_blank"]`) — proving source access is preserved as a detail-page concern, not eliminated.
- **`git diff --check`**: clean.
- **Zero production diff outside `src/index.njk`**: `git diff --stat -- src/` shows only `src/index.njk` changed.

## Architecture assessment

Final dataflow:

```
canonical Publications                          canonical Presentations
  ↓                                               ↓
publicationDetailPages.items                    collections.presentations
(existing global data)                          (existing Eleventy collection)
  ↓                                               ↓
sort by date desc, take first                   sort by date desc, take first
  ↓                                               ↓
FI homepage SSR (src/index.njk)                 FI homepage SSR (src/index.njk)
  ↓                                               ↓
canonical /julkaisut/{id}/ detail page          canonical /presentations/{slug}/ detail page
  ↓                                               ↓
source/DOI CTA on detail (unchanged)            source CTA on detail (unchanged)
```

- **No new content reader, projection, parser, URL resolver, or runtime rendering path was introduced.**
- **No new global `_data` file.** Reuses `publicationDetailPages` (already exposed) and `collections.presentations` (already exposed).
- **No parallel content model.** Same canonical sources drive the /julkaisut/ index, all /julkaisut/{id}/ pages, /esitykset/, /kouluttaja/, and R1 sidebar.
- **No runtime JSON**, **no browser JS card construction**, **no Pagefind touched**.
- **Canonical Content v1 unchanged.**
- **O1 orientation contract unchanged.**
- **R1** and **RP-CONVERGE-01** surfaces untouched.

## AC1 assessment

| Reopen condition | Triggered? |
| --- | --- |
| Duplicate content ownership | No — reuses existing projections; no new reader. |
| Canonical semantics in browser JS | No — no browser JS added or modified. |
| Pagefind becoming canonical storage | No — Pagefind untouched. |
| Runtime JSON → HTML duplicating SSR | No — SSR only. |
| Source / landing / context / public-contract regression | No — landing improves (canonical local first). |
| FI/EN shared-architecture parity loss | Documented justified asymmetry (different EN homepage design; no equivalent EN role-card surface). |

**`HOME-LANDING-01 improves a user-visible homepage navigation path while reducing direct source-data coupling.`**

**`Canonical detail pages are the homepage destination; source links remain detail-page concerns.`**

**`No parallel content/projection layer was introduced.`**

**`Canonical Content v1 remains unchanged.`**

**`Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.`**
