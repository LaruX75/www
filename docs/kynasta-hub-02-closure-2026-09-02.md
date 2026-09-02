# KYNÄSTÄ-HUB-02 — Closure

**Status:** READY TO MERGE
**Date:** 2026-09-02
**Baseline SHA:** `c3b1b733bac8ad8bbc35cb2c59517daf0b3f5259`
**Scope:** Redesign `/kynasta/` + `/en/kynasta/` into content-rich SSR hubs

## What changed

Replaced the pre-KYNÄSTÄ-HUB-02 three-card route grid at `/kynasta/`
with a content-rich hub that renders, per user-spec §1:

```
KYNÄSTÄ

KIRJOITUKSET
  Blogi                             5 newest → /kirjoitukset/#blogi
  Mielipidekirjoitukset             5 newest → /kirjoitukset/#mielipiteet
  Kolumnit ja blogivierailut        5 newest → /kirjoitukset/#kolumnit

VALTUUSTOTYÖ
  Valtuustopuheet                   5 newest → /valtuustotyo/#puheet
  Valtuustoaloitteet                5 newest → /valtuustotyo/#aloitteet

ASIANTUNTIJATYÖ
  Lausunnot                         5 newest → /lausunnot/#lausunnot
  Julkiset puheet                   5 newest → /lausunnot/#julkiset-puheet
```

Total FI SSR items on the hub: **7 × 5 = 35** canonical latest links.

EN handling per user-approved Option A: partial EN hub at
`/en/kynasta/` replaces the previous 301 redirect. Writings section
fully populated from the canonical writings corpus with EN UI framing
(same convention as `/en/writings/`); Council + Expert sections
render an honest "Available only in Finnish" note with buttons that
link to the FI archives (`/valtuustotyo/#puheet`, `#aloitteet`,
`/lausunnot/#lausunnot`, `#julkiset-puheet`). No fabricated EN
content is introduced.

## Authoritative data source per group (audited)

| # | Group | Canonical collection | Filter | Date field |
| ---: | --- | --- | --- | --- |
| 1 | Blogi | `collections.blog` | — | `item.date` |
| 2 | Mielipidekirjoitukset | `collections.pub_mielipide` | `type == "mielipide"` | `data.date` |
| 3 | Kolumnit / blogivierailut | `collections.pub_kolumni` | `type == "kolumni"` | `data.date` |
| 4 | Valtuustopuheet | `collections.pub_puhe` | `isCouncilSpeech()` — `speechContext ∈ {valtuusto, kyselytunti}` OR `event ~ "Oulun kaupunginvaltuusto"` OR `forum ~ "Kaupunginvaltuusto"` | `data.date` |
| 5 | Valtuustoaloitteet | `collections.politics` | — | **`data.meetingDate`** → `data.date` fallback |
| 6 | Lausunnot | `collections.publications` | `type == "lausunto"` | `data.date` |
| 7 | Julkiset puheet | `collections.pub_puhe` | NOT `isCouncilSpeech()` | `data.date` |

No new canonical taxonomy was introduced. Every group already existed
as a canonical collection.

## Date / order semantics

All groups sort newest-first. Group 5 (initiatives) preserves
`/valtuustotyo/` archive semantics by preferring `data.meetingDate`
with `data.date` as fallback — this keeps the hub-first-5 items
aligned with what the initiatives table shows on the archive.
Deterministic tie-break: title asc (fi locale) then item id.

## Final hub information architecture

FI `/kynasta/`:

- 3 major sections (`#kirjoitukset`, `#valtuustotyo`, `#asiantuntijatyo`)
- 7 populated subsections (35 SSR items total)
- 7 "Näytä kaikki" CTAs, each targeting the pre-existing archive anchor
- Legacy anchor redirect stubs preserved (`#blogi`, `#mielipiteet`,
  `#kolumnit`, `#puheet`, `#aloitteet`, `#lausunnot`, `#julkiset-puheet`)
  so external inbound links continue to route to the correct archive

EN `/en/kynasta/`:

- 3 major sections (`#writings`, `#council-work`, `#expert-work`)
- 3 populated subsections in Writings (15 SSR items total)
- 2 "Available only in Finnish" notes for Council + Expert with
  4 direct links to the FI archives (`hreflang="fi"` + `lang="fi"`
  attributes for language-signalling)

## Canonical destinations

All 7 "Show all" links target pre-existing anchors on the current
archive pages (`/kirjoitukset/`, `/valtuustotyo/`, `/lausunnot/`).
No new archive/discovery ownership was created. Hub items link to
canonical detail pages (blog posts, publication detail pages, or
external landings where the item's frontmatter declares `data.url`
per the site's existing publication contract).

## What Pagefind does / does not do

**Does:** Nothing new. Pagefind's index is unchanged.

**Does not:** Add a hub-wide Find & Explore UI. Per user-spec §7, no
new Pagefind implementation is added merely because THESIS-HUB-02
uses hub Find & Explore. The existing per-archive discovery contracts
remain untouched:

- `/kirjoitukset/` — has Find & Explore scoped to writings (blog +
  opinion + column). Unchanged.
- `/valtuustotyo/` — no Find & Explore; async JSON tables. Unchanged.
- `/lausunnot/` — no Find & Explore; SSR lists. Unchanged.

Adding hub-wide Find & Explore would require architectural invention
(a new cross-domain Kynästä-scoped Pagefind facet, disambiguating
council-speech vs public-speech in the UI, etc.). Not warranted for
this workstream; the primary goal is the SSR content-rich hub.

## Removal / simplification

Deleted:

- Inline group-building block in `src/kynasta.njk` (35-78 in
  pre-refactor lines): 7 subgroup filters + 7 count computations +
  3 composite counts + 7 `.slice(0, 3)` latest-item lists — all
  replaced by the shared `kynastaHubPage` projection.
- Three route-card CSS classes in `src/css/kynasta-page.css`:
  `.kynasta-entry-card`, `.kynasta-entry-list`, `.kynasta-route-card`
  (+ their modifiers). Grep confirmed zero remaining consumers before
  removal.

Retained:

- Legacy anchor redirect stubs (`<span data-legacy-anchor>` + inline
  JS in `src/kynasta.njk`) — spec §10 discourages removing
  compatibility redirects until consumers are audited; deep external
  links may still hit `/kynasta/#lausunnot` etc.
- `.kynasta-hero-aside` + related CSS (still used by the redesigned
  hero).
- Schema.org markup (`schemaAbout`, `schemaMentions`) — unchanged.

## Tests

New:

- `tests/unit/kynastaHubPage.test.js` — 20 unit tests for the
  projection: LATEST_LIMIT + DATE_FIELDS contracts, `isCouncilSpeech`
  classification, grouping + sort + slice, initiative `meetingDate`
  preference, EN scope convention (FI corpus + EN UI), empty /
  missing collection resilience.
- `tests/kynasta-hub-02.spec.js` — 10 Playwright tests for the FI +
  EN hub contract: 3 sections × ≤5 items each, Show all anchors,
  destination href validity, no runtime `/data/*.json` fetch on
  load, JavaScript-off SSR rendering, legacy anchor preservation.

Regression coverage retained on adjacent surfaces:

- `tests/ux1b-fi-home-orientation-paths.spec.js` — still asserts the
  home-hero Kynästä link points to `/kynasta/` (unchanged href).
- `tests/o1-orientation.spec.js` (thesis subset) — untouched.
- `tests/f3a-theses-find-explore.spec.js` — untouched.

## File inventory

Reconciled against `git diff --name-status main...HEAD` — subtotals
match the PR total exactly.

| Category | New | Modified | Deleted | Subtotal |
| --- | ---: | ---: | ---: | ---: |
| Production | 4 | 3 | 0 | 7 |
| Tests | 2 | 0 | 0 | 2 |
| Documentation | 1 | 0 | 0 | 1 |
| **Total** | **7** | **3** | **0** | **10** |

**New (7):**

- `src/_utils/kynastaHubPage.js` — single-owner projection factory
- `src/_includes/kynasta-hub-subsection.njk` — shared 5-item block
- `src/kynasta.11tydata.js` — FI computed-data adapter
- `src/en/kynasta.11tydata.js` — EN computed-data adapter
- `tests/unit/kynastaHubPage.test.js` — 20 unit tests
- `tests/kynasta-hub-02.spec.js` — 10 Playwright tests
- `docs/kynasta-hub-02-closure-2026-09-02.md` — this document

**Modified (3):**

- `src/kynasta.njk` — rewritten as thin renderer of the shared model
- `src/en/kynasta.njk` — replaces the 19-line 301 redirect with a
  partial EN hub per Option A
- `src/css/kynasta-page.css` — deletes obsolete route-card CSS,
  adds hub-section + subsection styles

**Deleted (0)** — the seven archive/route pages
(`/kirjoitukset/`, `/valtuustotyo/`, `/lausunnot/`) remain intact
per spec §8. No compatibility redirect was removed.

## Deliberately retained compatibility behavior

- Legacy `/kynasta/#lausunnot`, `#julkiset-puheet`, `#puheet`,
  `#aloitteet`, `#blogi`, `#mielipiteet`, `#kolumnit` redirect stubs
  + inline JS. External inbound links continue to bounce to the
  correct archive anchor after landing on the new hub.

## Verification

- `git diff --check`: clean
- `npm run test:unit` → **746 / 746 pass** (+20 new)
- `CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy` →
  1471 files written; both hubs render with correct item counts
- `node scripts/run-pagefind.js` → indexes 1458 HTML documents;
  presentation invariants unchanged (135 / 79)
- `npm run check:i18n-seo` → OK for 1458 HTML files
- `npm run check:jsonld` → 0 errors (only pre-existing baseline
  `article-headline-length: 63`)
- `CACHE_ONLY=true node scripts/check-researchfi-integrity.js` → OK
- Focused Playwright — **10 / 10 pass** on `kynasta-hub-02.spec.js`;
  adjacent regression suite (ux1b home orientation, thesis-hub-02,
  f3a theses FE, o1 thesis subset) — **5 / 5 pass**

## Architecture

```
canonical Eleventy collections
    ↓
buildKynastaHubModel(collections, lang)   [src/_utils/kynastaHubPage.js]
    ↓
kynastaHubPage projection                 [via eleventyComputed]
    ↓
kynasta.njk / en/kynasta.njk              [thin renderers]
    ↓
kynasta-hub-subsection.njk                [shared 5-item block]
    ↓
existing canonical /kirjoitukset/ /valtuustotyo/ /lausunnot/ archives
    ↓
canonical detail pages
```

Pagefind remains discovery infrastructure where already appropriate
(unchanged on `/kirjoitukset/` and `/en/writings/`). JavaScript
handles interaction only. No parallel client-side content model.

- `KYNÄSTÄ-HUB-02 = READY TO MERGE`
- `Architecture Closure 1.0 = CLOSED / GREEN / MAIN` (unaffected)
