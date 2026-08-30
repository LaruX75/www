# RP-CONVERGE-01 — Company Presentations Convergence

Date: 2026-08-30
Status: `IMPLEMENTED / TESTS GREEN`

Converges the FI `/kouluttaja/` (yritys.md) legacy "Viimeisimpiä
koulutusesityksiä" strip from the parallel `canva.tableRows` +
`sivuyhteys` content-ownership path to the canonical Presentations
projection exposed by `src/_data/presentationContextGroups.js`.
Removes the legacy shared partial and its unique CSS. Corrects three
prior R1 closure docs whose "orphan" claim about the legacy include
was factually stale on `main`.

## Repository state

- Branch: `cleanup/rp-converge-01-company-presentations`
- Base: `origin/main` at `6b44c950918be5b719bf37da75251212f0ccf1ba` (post PR #168 selection-audit merge).
- Reference documents:
  - `docs/post-closure-next-workstream-selection-audit-2026-08-29.md` — selection audit that scoped this slice.
  - `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md`, `docs/r1-related-content-closure-2026-08-29.md`, `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md` — amended for the corrected "orphan" claim.

## Problem

Three concrete post-closure defects on `main` before this slice:

1. **Parallel content-ownership path**: `src/fi/yritys.md:290` included `src/_includes/related-presentations.njk`, which sourced items from `canva.tableRows` (raw legacy Canva import) and filtered by the non-canonical `sivuyhteys="kouluttaja-sivu"` editorial marker on 57 of ~138 imports. This ran alongside the canonical Presentations collection + `presentationContextGroups` projection.
2. **Stale documentation**: R1-A, R1 closure, and R1-ADR1 all described `related-presentations.njk` as "orphan"; on `main` it had a live consumer.
3. **FI/EN asymmetry**: `/kouluttaja/` (FI) had the dynamic strip; `/en/company/` had no equivalent. The EN page has a manually curated "Examples of talks" section only (mirroring the FI `#esimerkit`, not the FI `#viimeisimmat-esitykset`).

## Legacy flow

```text
canva.tableRows                                    (legacy raw Canva import)
  ↓
filter by item.sivuyhteys contains "kouluttaja-sivu" (editorial marker, non-canonical)
  ↓
sort by item.paakortti desc, then item.date desc    (legacy "featured" marker + date)
  ↓
related-presentations.njk                           (partial with its own inline card markup + inline CSS block)
  ↓
href from item.url OR item.pageUrl OR "/esitykset/" (bespoke URL fallback chain)
  ↓
rendered strip on /kouluttaja/
```

Rendered typical output pre-slice: three top items by date under the `kouluttaja-sivu` selection.

## Canonical flow

```text
canonical presentation MDs                          (139 files under src/presentations/)
  ↓
src/presentations/presentations.11tydata.js         (tags: "presentations", eleventyComputed applied)
  ↓
src/_data/presentationContextGroups.js              (build-time canonical projection; regex-classified
                                                     into 7 canonical groups over canonical title +
                                                     basename; date-desc sort; each group exposes
                                                     .featured (top-N) + .rest)
  ↓
group id "veso-taydennyskoulutus" — "VESO ja kuntien opettajakoulutus / Täydennyskoulutus"
  ↓
.featured (top-4 by date)                           (present at build time; ready for template use)
  ↓
Nunjucks inline projection on yritys.md             (take(3) of .featured; direct render, no separate partial)
  ↓
href = item.url (already the canonical local /presentations/{slug}/ landing per the group projection)
                + "?returnTo=%2Fkouluttaja%2F" O1 orientation decoration
  ↓
SSR strip on /kouluttaja/
```

Rendered post-slice on `300bec5f`-plus-this-slice: three latest VESO / continuing-education items.

- 2026-01-22 → `/presentations/riihim-ki-veso-2026/` — "Riihimäki VESO 2026"
- 2026-01-21 → `/presentations/kempele-veso-2026/` — "Kempele VESO 2026"
- 2026-01-20 → `/presentations/konen-k-vibe-robotiikka-riihim-ki-robokampus-2026/` — "Koneäkö + vibe + robotiikka – Riihimäki Robokampus 2026"

## Authoritative source

- `src/_data/presentationContextGroups.js` — canonical build-time projection over `src/presentations/*.md`. Already deployed and consumed by `src/_includes/presentations/background-and-sources.njk` (the `/esitykset/` archive's "Esitykset käyttötavan mukaan" section). No new data source introduced; no new field added.
- Group `veso-taydennyskoulutus`: "VESO ja kuntien opettajakoulutus" — kicker "Täydennyskoulutus". Classifier regex matches `veso`, `digierko`, `täydennyskoulut`, `osaava.*(digi|veso|hanke)`, plus Finnish city-name prefixes with training-context keywords. On `300bec5f`, `totalCount = 10` items.

## Selection semantics

- **Group**: `veso-taydennyskoulutus` — direct canonical map for "coach / continuing-education presentations" surface intent.
- **Order**: date-descending (already applied inside `presentationContextGroups`).
- **Cardinality**: top-3 via the existing `take` filter (Eleventy `eleventy.filters.js:1143`).
- **No new taxonomy**: uses the existing canonical group id and canonical `.featured` output. Does not recreate `sivuyhteys` under a new name. Does not add a new canonical field to presentation MDs.
- **No `paakortti` inheritance**: `paakortti` was legacy-only; canonical MDs never received it, so the new selection uses recency alone. Documented shift.

## Landing / source semantics

- Every card renders `href = item.url + "?returnTo=%2Fkouluttaja%2F"`.
- `item.url` is set inside `presentationContextGroups` as `data.pageUrl || "/presentations/{baseName}/"` — the canonical local detail landing per the Presentations Slice 3 closure.
- All 139 canonical presentation MDs have a local `/presentations/{slug}/` detail page (verified by build: `presentationLocalLandingTotal: 138` + 1 additional in the same collection).
- `?returnTo=%2Fkouluttaja%2F` is the site-wide O1 orientation decoration — the detail page's "Back to hub" resolves back to `/kouluttaja/`. Same pattern as `find-explore.js:633` uses for archive-search results.
- External / source URLs (Canva, YouTube, OuluREPO) are NOT surfaced on the strip. They remain accessible via the canonical detail landing's CTAs — no external-first shortcut on this hub marketing surface.

## FI / EN parity

Deliberate asymmetry, documented:

- **FI `/kouluttaja/`**: dynamic canonical strip renders (3 VESO/täydennyskoulutus items).
- **EN `/en/company/`**: no equivalent dynamic strip. Reason: the canonical presentation MDs are Finnish-only (no `/en/presentations/…` routes on the site — `find src/en/presentations -name '*.md'` returns 0). A dynamic EN strip would either (a) link to Finnish `/presentations/{slug}/` landings, degrading EN UX, or (b) require fabricating EN presentation detail routes, which is out of scope and prohibited by the audit's non-goals.
- **EN retains its manual "Examples of talks"** curated section (mirroring the FI `#esimerkit` section, not the FI `#viimeisimmat-esitykset`). No change to that section in this slice.

## Renderer reuse

- **Visual language**: reuses the site's existing `larux-example-card` component — the same visual pattern already used by the FI `#esimerkit` (Esimerkkipuheenvuoroja) section immediately above `#viimeisimmat-esitykset`. Reduces to a familiar site-wide card pattern; no bespoke card markup created.
- **No new template partial introduced**. The strip is inline in `src/fi/yritys.md` as a small Nunjucks loop — it does not warrant a shared include (single consumer, single canonical projection input, small markup).
- **Nunjucks group lookup**: uses an explicit `{% for %}{% if _g.id == "veso-taydennyskoulutus" %}...{% endif %}{% endfor %}` with the standard mutable-array `push` pattern (same pattern the deleted `related-presentations.njk` used). Chosen because `selectattr("id", "equalto", ...) | first` returned unexpected results in this Nunjucks version on the specific group set — the explicit loop is deterministic and self-contained.

## Deleted implementation

- **File**: `src/_includes/related-presentations.njk` — deleted (was 185 LOC including inline `<style>` block, 6 template parameters, 2 duplicated card renderers for featured / others, category-label map, external-vs-internal href heuristic).
- **CSS rule**: `.larux-section--presentations .related-presentations { margin-top: 0 !important; padding-top: 0 !important; border-top: 0 !important; }` in `src/css/larux-page.css:23` — deleted (was the only selector referencing the removed `.related-presentations` class).
- **Retained**: `.larux-section--presentations` background rule in `src/css/larux-page.css:16-21` and the dark-mode variant at line ~375 — still consumed by the FI `#viimeisimmat-esitykset` section wrapper class. Not dead.
- **Retained**: `sivuyhteys` field processing paths in `src/_data/canva.js`, `src/_data/canva-presentations.json`, and `src/_data/presentationsPage.js`. These are legacy import-side pipelines with a broader footprint than the `kouluttaja-sivu` marker; a follow-up audit can evaluate whether to reduce them. Out of scope for RP-CONVERGE-01 (spec §16 non-goals prohibit broader `canva.tableRows` refactors).

## CSS deletion

- Only the single `.larux-section--presentations .related-presentations` selector was removed (proven safe by `grep`: no other consumer of the `.related-presentations` class anywhere in the repo).
- The inline `<style>` block that lived inside `related-presentations.njk` (~55 lines of `.related-presentations-*` selectors) was deleted with the file — those selectors have zero consumers repo-wide (verified by grep).
- `.larux-section--presentations` (parent) and its dark-mode variant are retained — still consumed by yritys.md.

## Correction of stale documentation

Three docs contained the "orphan" claim; amended:

- `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md` — §"related-presentations.njk", table §"Existing related-content-like paths", §"Duplication / deletion opportunities".
- `docs/r1-related-content-closure-2026-08-29.md` — §"Deletion assessment / Independent cleanup candidate" and §"Maintenance / reopen conditions" bullet.
- `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md` — §"Deletion clause" paragraph.

Substantive R1 closure and ADR1 conclusions are unchanged. Only the factual "orphan" claim was corrected. R1 remains `CLOSED / MAINTENANCE`.

## Tests

- Unit tests: `npm run test:unit` — **637 pass / 0 fail** (same baseline as prior slices).
- Full build: `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og` — PASS. Postbuild: `htmlDocumentsIndexed=1458`, `presentationScopeLocalDocuments=139`, `presentationCanonicalTotal=218`, `presentationLocalLandingTotal=138`, `presentationExternalLandingTotal=80` (unchanged from prior baseline). `[researchfi-integrity] OK`. `[seo-dashboard] OK | pages=1458 missingDescription=0 missingOgImage=0`.
- Regression coverage: `tests/rp-converge-01-company-presentations.spec.js` — 4 cases:
  1. FI `/kouluttaja/` renders canonical strip: `#viimeisimmat-esitykset` section, `Viimeisimpiä koulutusesityksiä` eyebrow, exactly 3 `article.larux-example-card`, all hrefs start with `/presentations/` and contain `returnTo=%2Fkouluttaja%2F`, "Kaikki esitykset ja materiaalit" link present.
  2. `javaScriptEnabled: false` — same strip with 3 cards renders without JS (SSR proof).
  3. EN `/en/company/` has zero `#viimeisimmat-esitykset` sections (intentional asymmetry assertion).
  4. Built page contains no `related-presentations-list` or `related-presentations-item` class remnants (deletion proof).

## Architecture assessment

- **Removed** one parallel content-ownership path (`canva.tableRows + sivuyhteys` → bespoke card markup). Reinforces AC1 + Canonical Content v1 by making canonical Presentation data the single source of truth for the strip.
- **Reused** an existing canonical projection (`presentationContextGroups`) already deployed for the `/esitykset/` archive's "Esitykset käyttötavan mukaan" section. No new data model; no new field; no new taxonomy.
- **No canonical semantics changed**: no field added to presentation MDs, no `contexts` inference, no Research membership inference, no scoring change, no semantic layer change, no Pagefind projection change.
- **No client-side content ownership introduced**: strip is fully SSR; no browser JS, no runtime JSON fetch.
- **No public JSON contract changed**: `/data/presentations-page.json` untouched; no consumer contract change.
- **No new URL routes created**: uses existing canonical `/presentations/{slug}/` local landings.
- **FI/EN parity gap** explicitly evaluated and documented as justified asymmetry (EN presentations aren't localized site content).

## AC1 assessment

Explicit reopen-condition scan:

| Reopen condition | Triggered? | Reason |
| --- | --- | --- |
| Duplicate content ownership introduced | **No** — this slice removes a duplicate ownership path. |
| Canonical semantics moved to browser JS | **No** — no browser JS added or modified. |
| Pagefind becoming canonical storage | **No** — Pagefind not touched. |
| Runtime JSON → HTML duplicating SSR | **No** — no runtime JSON introduced; canonical projection is build-time SSR. |
| Source / landing / context / public-contract regression | **No** — landing uses canonical `pageUrl`; context semantics unchanged; no public JSON contract changed. |
| Loss of FI/EN shared-architecture parity | **No** — FI/EN parity is explicitly evaluated and the FI-only asymmetry is documented and justified (canonical presentations are FI-only). |

**Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.**

**R1 remains `CLOSED / MAINTENANCE`.** R1's substantive conclusions and boundaries are unchanged; only three stale factual claims about the `related-presentations.njk` include being "orphan" were corrected.

## Stopping point

RP-CONVERGE-01 is complete when all six are true:

1. ✅ `src/_includes/related-presentations.njk` is deleted.
2. ✅ `src/fi/yritys.md` `#viimeisimmat-esitykset` still renders a "Latest coach presentations" strip driven by canonical `presentationContextGroups`.
3. ✅ FI/EN parity decision is explicit (documented justified asymmetry — no EN strip).
4. ✅ R1-A / R1 closure / R1-ADR1 stale orphan claims are amended.
5. ✅ Unit tests pass; full build passes; regression test added.
6. ✅ Deletion of the CSS selector and inline styles proven safe by grep.

No further RP-CONVERGE follow-up is scheduled. The remaining `sivuyhteys` field processing in `canva.js` / `canva-presentations.json` / `presentationsPage.js` is a separate, larger scope (touches multiple canva-ingest paths) and is deferred to a future audit rather than bundled here.
