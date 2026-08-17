# PUB-CITE1 Phase 4 — Legacy Citation Deletion Readiness Audit

Date: 2026-08-17
Status: **AUDIT ONLY — NO PRODUCTION CODE CHANGE IN THIS TASK**
Branch: `claude/pub-cite1-impl-phase1-csl-projection`
HEAD (pre-audit): `56a34754` (`feat: PF5-IMPL-APA — full Pagefind
publications list with shared APA rows`)

## 1. Scope

Read-only inventory of every remaining publications-citation legacy
code path after PUB-CITE1 Phase 1 + Phase 2 + PF5-IMPL-APA, plus a
deletion classification and a proposed next deletion commit. This
audit does not delete, modify, or rename any production code.

## 2. Current citation architecture (after PF5-IMPL-APA)

```
canonical publication
  → publicationsPage.js
      → csl (via src/_utils/publicationCsl.js)
      → PUBLIC_PUBLICATIONS_PAGE_FIELDS allowlist
  → publicationDetails.js → detail.csl + detail.citation (server APA)
  → researchfiContent.js → content.citation + content.citationStyle
  → publicationsFindExplore.js → record.csl on F&E records

visible surfaces
  → SSR detail card:  detail.csl | publicationCitation("apa")
                       (falls back to detail.citation)
  → Find & Explore rows (FI + EN /julkaisut/, /en/publications/):
       window.publicationCitation.buildCitation({csl, "apa"})
  → Citation export modal (#citationExportModal, FI only):
       shared renderer via data-csl,
       inline formatters as fallback
  → Taxonomy pages (kategoriat / avainsanat / teemat):
       featuredItem.data.citation (server APA string)  ← still legacy
  → /api/export-data.json:
       citation + citationStyle from content items  ← public contract
```

Shared renderer:
- Source of truth: `src/js/publication-citation.js` (isomorphic UMD).
- Node accessor: `src/_utils/publicationCitation.js` (re-export shim).
- Nunjucks filter: `publicationCitation(csl, style)` registered in
  `eleventy.filters.js`.

## 3. Legacy inventory

### 3.1 Inline browser formatters in `src/julkaisut.njk`

| Function            | Purpose                              | Present |
| ------------------- | ------------------------------------ | ------- |
| `toBibtexAuthors`   | Helper for BibTeX author formatting  | Yes     |
| `buildApaCitation`  | Client APA composer (fallback)       | Yes     |
| `buildMlaCitation`  | Client MLA composer (fallback)       | Yes     |
| `buildChicagoCitation` | Client Chicago composer (fallback) | Yes     |
| `buildBibtexEntry`  | Client BibTeX composer (fallback)    | Yes     |
| `buildRisEntry`     | Client RIS composer (fallback + Zotero + Mendeley) | Yes     |

Fallback guard in `getCitationByFormat`:
```
if (payload.csl && window.publicationCitation) {
  ...shared renderer...
}
// legacy composers reached only when the guard is false
```

**Zotero/Mendeley bypass**: the two `citationZoteroBtn` and
`citationMendeleyBtn` handlers call `buildRisEntry(currentCitationPayload)`
DIRECTLY, unconditionally. They do NOT check `payload.csl` or
`window.publicationCitation`. That means the legacy RIS composer is
reached on every Zotero/Mendeley download regardless of csl
availability — a deletion blocker until the two handlers migrate to
the shared renderer.

Rough deletion size in `src/julkaisut.njk`: ~140 lines
(from `toBibtexAuthors` through the last download-file handler that
touches the legacy composers).

### 3.2 Server-side APA on `src/_data/researchfiContent.js`

```js
function buildApaCitation(publication) { … }   // ~40 LOC
mapPublication(...) → item.citation = buildApaCitation(publication);
                     item.citationStyle = "APA 7";
```

Consumers of `contentItem.citation` / `data.citation`:
- `src/_data/publicationDetails.js` — `detail.citation` fallback field.
- `src/_includes/publication-item-body.njk` — falls back when
  `detail.csl` is missing.
- `src/teemat.njk` — renders `publication.citation` directly on topic
  pages.
- `src/kategoriat.njk` — renders `featuredItem.data.citation` /
  `item.data.citation` on category pages (4 code paths).
- `src/avainsanat.njk` — same on keyword pages.
- `src/api/export-data.json.11ty.js` — writes `citation` and
  `citationStyle` to the public export contract at
  `/api/export-data.json`.

### 3.3 `buildLegacyFiPublicationRows()` in `src/_data/publicationsPage.js`

Consumers (grep across `src/ scripts/ tests/`):
- `scripts/audit-pub-cite1-publication-citation-csl.js`  (reflection
  test that the export still exists).
- `scripts/audit-publications-page-projection.js` (parity check
  between legacy rows and canonical rows).
- `scripts/audit-publications-page-client-parity.js` (parity between
  legacy SSR rows and rendered publications-page-client output).

No production template consumes it. `_site/data/publications-page.json`
serves the canonical items directly.

### 3.4 Thesis citation surfaces (separate domain)

- `src/js/thesis-hub-actions.js` — `buildThesisApa`, `buildThesisMla`,
  `buildThesisChicago`, `buildThesisBibtex`, `buildThesisRis`.
- `src/_data/theses.js` — `buildApaCitation(thesis)` → `citationApa`.
- `src/_includes/thesis-detail-body.njk` — renders `thesisDetail.citationApa`.

Thesis citations are structurally different (theses have `level`,
"Master's" vs "Doctoral", University of Oulu institutional wrapper)
and were explicitly out-of-scope for the publications CSL architecture
per PF5-IMPL-APA closure §22.

## 4. Consumer matrix

| Legacy item                                          | Runtime | Build | Test/Audit | Replacement                                        | Parity proven | Fallback reachable                                                                 | Safe to delete now?                             | Prerequisite                                                                                       |
| ---------------------------------------------------- | :-----: | :---: | :--------: | -------------------------------------------------- | :-----------: | ---------------------------------------------------------------------------------- | :---------------------------------------------: | -------------------------------------------------------------------------------------------------- |
| `buildApaCitation` in `julkaisut.njk`                | ✓       |       |            | `window.publicationCitation.buildCitation({apa})`  | Yes (Phase 2 parity 4 identical / 49 improved / 0 regression) | Yes — when shared renderer script missing or `payload.csl` absent | **No**                                          | Migrate Zotero + Mendeley handlers off the legacy branch; add a "shared-renderer-not-loaded" test  |
| `buildMlaCitation` in `julkaisut.njk`                | ✓       |       |            | `.buildCitation({mla})`                            | Yes (unit)     | Same guard                                                                          | **No**                                          | Same                                                                                              |
| `buildChicagoCitation` in `julkaisut.njk`            | ✓       |       |            | `.buildCitation({chicago})`                        | Yes (unit)     | Same guard                                                                          | **No**                                          | Same                                                                                              |
| `buildBibtexEntry` in `julkaisut.njk`                | ✓       |       |            | `.buildCitation({bibtex})`                         | Yes (unit)     | Same guard                                                                          | **No**                                          | Same                                                                                              |
| `buildRisEntry` in `julkaisut.njk`                   | ✓       |       |            | `.buildCitation({ris})`                            | Yes (unit)     | Yes — AND Zotero + Mendeley buttons call this unconditionally                        | **No**                                          | Migrate Zotero + Mendeley handlers first                                                          |
| `researchfiContent.buildApaCitation()`               |         | ✓     |            | `csl | publicationCitation("apa")` (Nunjucks)      | Yes (Phase 2 parity)  | Yes — 3 taxonomy templates + 1 public JSON contract read `content.citation`         | **No**                                          | (a) Migrate `teemat.njk`, `kategoriat.njk`, `avainsanat.njk` to `csl | publicationCitation("apa")`; (b) decide export-data policy (see §7) |
| `content.citation` / `content.citationStyle` fields  |         | ✓     |            | `content.csl` + shared renderer                    | Yes (Phase 2)  | Yes — same 3 taxonomy templates + export-data                                       | **No**                                          | Same as above                                                                                     |
| `buildLegacyFiPublicationRows()`                     |         |       | ✓          | `_site/data/publications-page.json` canonical rows | Yes (canonical is authoritative) | No production consumer                                                              | **No** (only because 3 audits still call it)   | Migrate `audit-pub-cite1-publication-citation-csl.js` + `audit-publications-page-projection.js` + `audit-publications-page-client-parity.js` to use canonical rows or retire the pre-canonical parity |
| `thesis-hub-actions.js` `buildThesisApa/...`         | ✓       |       |            | (none)                                             | N/A            | Yes                                                                                 | **No** (permanent — thesis domain)             | Not a publications-legacy duplicate                                                               |
| `theses.js` `buildApaCitation(thesis)` → citationApa |         | ✓     |            | (none)                                             | N/A            | Yes                                                                                 | **No** (permanent — thesis domain)             | Not a publications-legacy duplicate                                                               |

## 5. CSL coverage

- Canonical publications: **56 / 56** have `csl` with valid `id` + `title`.
- Publication F&E records (FI + EN hubs): **56 / 56** carry `csl`.
- Pagefind publication fragments: **56 / 56** correspond to canonical
  publications; `data-csl` reaches every export button emitted by
  `renderPublicationResult`.
- No missing / degraded CSL records found.

Machine data:
`docs/data/pub-cite1-phase4-legacy-citation-deletion-readiness-2026-08-17.json`.

## 6. Surface parity

| Surface                        | Current renderer                                    | Fallback                                       | Parity status                                | Deletion blocker?                          |
| ------------------------------ | --------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- | ------------------------------------------ |
| FI archive list rows           | `window.publicationCitation.buildCitation({apa})`   | `entry.title` (safe degrade)                   | 56 / 56 canonical, no regressions            | No                                         |
| EN archive list rows           | Same                                                | Same                                           | 56 / 56                                      | No                                         |
| Publication detail card        | `detail.csl | publicationCitation("apa")`           | `detail.citation` (server APA)                  | Identical / improved on all Research.fi records | Yes for `researchfiContent.buildApaCitation` — the fallback IS reachable and is the only citation source when csl is missing today (it never is missing, but the guard remains) |
| Citation export modal preview  | `window.publicationCitation.buildCitation({style})` (guarded)                                        | `buildApaCitation`/`buildMlaCitation`/`buildChicagoCitation`/`buildBibtexEntry`/`buildRisEntry` | Parity proven per style (26 renderer unit tests + Phase 2 parity) | Yes for the 5 inline formatters — the guard reaches them if `window.publicationCitation` is unset |
| Citation export modal download | Same                                                | Same                                           | Same                                          | Same                                       |
| Zotero download button         | **Legacy `buildRisEntry` (unguarded)**              | —                                              | Missing shared-renderer branch entirely      | **Yes** — hard blocker for RIS deletion    |
| Mendeley download button       | **Legacy `buildRisEntry` (unguarded)**              | —                                              | Same                                         | **Yes** — hard blocker for RIS deletion    |
| Topic pages (`teemat.njk`)     | `publication.citation` (server APA)                 | —                                              | Server APA is the only path                  | **Yes** — blocker for `researchfiContent.buildApaCitation` deletion |
| Category pages (`kategoriat.njk`) | `featuredItem.data.citation` / `item.data.citation` | —                                              | Same                                         | **Yes** — same                             |
| Keyword pages (`avainsanat.njk`) | `item.data.citation`                               | —                                              | Same                                         | **Yes** — same                             |
| `/api/export-data.json`        | `item.citation` + `item.citationStyle`              | —                                              | Public JSON contract                         | **Yes** — see §7                           |

## 7. Public JSON / export contract impact

- `_site/data/publications-page.json` — does **not** expose `citation`
  or `citationStyle`; only `csl` (see §5). Safe.
- `_site/api/export-data.json` — exposes `citation` and `citationStyle`
  for each Research.fi content item under `rfContent[]`. Documented in
  the source as "used by admin/export page for PDF export."
  `admin/export/index.html` fetches the file but does not currently
  reference `citation` or `citationStyle` in its own script — so the
  admin UI itself does not rely on these fields today, but external
  consumers of the JSON payload cannot be audited. Field deletion
  would need either (a) a documented contract version bump, or (b)
  keeping the fields but populating them from the shared renderer.
- No RSS/feed, sitemap, JSON-LD, or Pagefind metadata surface exposes
  `citation` or `citationStyle`.
- Knowledge-graph JSON does not include `citation`.

## 8. Offline / cache / failure paths

- **CSL projection missing on a single record.** `renderPublicationResult`
  calls `publicationCitationBody(entry)`, which checks
  `record.csl && renderer && renderer.buildCitation`. If csl is
  missing, the row degrades to the plain title link + author line —
  no crash, no empty row.
- **Shared renderer script fails to load in browser.** The modal's
  `getCitationByFormat` reaches the legacy inline formatters via the
  `else` branch — the export flow keeps working. The Find & Explore
  publication row uses the `else` branch inside
  `publicationCitationBody` and renders the plain title / author line.
- **Cache-only build (`CACHE_ONLY=true`).** Canonical publications are
  still built from cached Research.fi + manual sources; csl is
  computed from the canonical shape, so parity is unchanged (audit
  ran with cache-only mode).
- **Detail page rendered at build time without browser JS.** The
  detail template SSR-renders the shared APA output via the Nunjucks
  filter. The `detail.citation` fallback fires only when a
  publication has no csl (currently never — 56/56 have csl).
- **External publication fetch failure.** Research.fi loader falls
  back to `.cache/api-fallback/researchfi-publications.json`; csl is
  still computed from the cached shape. Nothing new to preserve.

The fallbacks are **load-bearing** in three cases:
1. Zotero / Mendeley downloads (unguarded — RIS legacy is always
   reached today).
2. Taxonomy pages (topic / category / keyword) which read `citation`
   directly, never csl.
3. `/api/export-data.json` public payload (external consumers).

All other fallbacks are historical safety — deletion could be
scheduled after the three surfaces above are migrated.

## 9. FI / EN parity

- Shared renderer loaded on both hubs.
- APA rows identical on both.
- Citation export modal is FI-only (`#citationExportModalLabel`,
  `Vie lähdeviite`, single hero card in `src/julkaisut.njk`) — the EN
  hub deliberately does not offer the export modal today.
- Taxonomy pages (kategoriat / avainsanat / teemat) are FI-only —
  their EN counterparts do not render `.data.citation`.

No FI-only or EN-only legacy path was found that would block a Phase
4 deletion asymmetrically. The FI-only Zotero + Mendeley + taxonomy
consumers are the only remaining hard blockers, and they are FI-only
because the corresponding EN surfaces do not exist yet.

## 10. Test results

- `npm run test:unit` — **458 / 458 pass**.
- `npm run build:no-og` — green (Pagefind fi:1163 / en:346;
  Research.fi integrity 56/56).
- New audit `audit-pub-cite1-phase4-legacy-citation-deletion-readiness.js`
  — 12 / 12 hard gates green; deletion classes:
  `KEEP TEMPORARILY: 3, KEEP PERMANENTLY: 2`.
- Regression audits, all green:
  - `audit-pf5-impl-apa-full-list-parity.js` (canonical/hub/Pagefind parity 56=56=56).
  - `audit-pub-cite1-phase2-shared-csl-renderer.js` (53 parity records — 4 identical, 49 improved).
  - `audit-pub-cite1-phase1-csl-projection.js` (19/19).
  - `audit-pub-cite1-publication-citation-csl.js` (all gates).
  - `audit-publications-page-projection.js` (0 unexpected fields, 0 leakage).
  - `audit-pf-perf1-pagefind-startup.js` (8/8).
  - `audit-pf4-result-card-hierarchy.js` (19/19).
  - `audit-pf-starter-chips.js` (11/11).
  - `audit-pf3-result-card-consistency.js` (9/9).
  - `audit-pf2-sisalto-facet.js` (9/9; publications:56 unchanged).
  - `audit-media-pagefind-m2.js` (reverse `noDetailUsesPagefindBody` still green).
  - `audit-presentation-pagefind.js` (`ok: true`).
  - `audit-pf5-native-result-card-variants-apa7.js` (all gates green).
  - `audit-pf-ui-l10n1-finnish-search-labels.js` (10/10).
- Publication browser smokes:
  - `tests/f3b-publications-find-explore.spec.js` — 2/2.
  - `tests/pf5-impl-apa-full-list.spec.js` — 5/5 on retry (one
    Pagefind wasm cold-start flake on first attempt, self-resolves —
    documented in PF5-IMPL-APA closure §21).
- Accessibility CI (`test:a11y`) — **not re-run in this audit** per
  repo policy that it triggers post-push. No production change was
  made here, so a11y state is unchanged from the PF5-IMPL-APA merge
  baseline.

## 11. Deletion classification

| Class                | Item                                                        |
| -------------------- | ----------------------------------------------------------- |
| **DELETE NOW**       | (none)                                                      |
| **KEEP TEMPORARILY** | Inline browser formatters in `src/julkaisut.njk` (5 fns)    |
| **KEEP TEMPORARILY** | `researchfiContent.buildApaCitation()` + `citation` / `citationStyle` fields |
| **KEEP TEMPORARILY** | `buildLegacyFiPublicationRows()`                            |
| **KEEP PERMANENTLY** | `thesis-hub-actions.js` thesis formatters                   |
| **KEEP PERMANENTLY** | `theses.js` server thesis APA composer                      |
| **UNKNOWN / NEEDS TEST** | (none)                                                  |

Nothing is DELETE NOW today because every publications-legacy
formatter still has at least one reachable consumer.

## 12. Recommended next deletion commit (Phase 4a)

The smallest safe first step is to **migrate the two hard-unguarded
Zotero + Mendeley download handlers to the shared renderer**, then
delete `buildRisEntry` alone. That single step:

- removes ~20 LOC from `src/julkaisut.njk`;
- leaves the other four inline formatters intact (still reachable via
  the guarded `getCitationByFormat` fallback);
- keeps every publication-domain fallback for the case where
  `window.publicationCitation` fails to load;
- lets a follow-up commit remove the four remaining browser
  formatters once the modal's fallback branch is confirmed
  unreachable in production (via an explicit "shared renderer failed
  to load" browser smoke).

### Files to change in Phase 4a

- `src/julkaisut.njk`
  - Rewrite `citationZoteroBtn` handler to call
    `window.publicationCitation.buildCitation({csl, style: "ris"}).text`
    when `currentCitationPayload.csl` is present, with a
    plain-text fallback if the renderer is unavailable.
  - Same for `citationMendeleyBtn`.
  - Delete `buildRisEntry(payload)` and its call sites inside
    `getCitationByFormat` (the `else` branch still returns a graceful
    empty string when csl is missing — acceptable for Zotero/Mendeley
    since those downloads only make sense when csl exists).
  - Delete `toBibtexAuthors` if it is no longer referenced (it is
    used only by `buildBibtexEntry`, which is still kept).
- `scripts/audit-pub-cite1-publication-citation-csl.js`
  - Remove the `inlineClientRisInJulkaisut` gate assertion.
- `scripts/audit-pub-cite1-phase2-shared-csl-renderer.js`
  - Remove the `buildRisEntry` term from `modalKeepsLegacyFallback`
    (it now checks only APA/MLA/Chicago/BibTeX).
- `tests/pf5-impl-apa-full-list.spec.js`
  - Add an assertion that clicking the Zotero button downloads a
    file whose contents start with `TY  - JOUR` (or the appropriate
    RIS type for the sampled publication).

### Files NOT to change in Phase 4a

- `src/_data/researchfiContent.js` (still feeds taxonomy pages +
  export-data JSON).
- `src/_data/publicationDetails.js` (still forwards `citation` as
  fallback, and there is no cost to keeping it).
- `src/_includes/publication-item-body.njk`.
- `src/teemat.njk`, `src/kategoriat.njk`, `src/avainsanat.njk`.
- `src/api/export-data.json.11ty.js` (public contract).
- `src/_data/publicationsPage.js` — `buildLegacyFiPublicationRows`
  stays until the 3 audit scripts migrate off it.
- Thesis surfaces.

## 13. Risks

- **Zotero / Mendeley download regression.** The RIS output from the
  shared renderer is not byte-identical to the legacy `buildRisEntry`
  for every field (e.g. the RIS TY tag is derived from CSL type
  today, not hardcoded `JOUR`). Zotero/Mendeley accept both, but a
  smoke test that opens the downloaded file in a reference-manager
  test harness would catch surprises. In the meantime, the
  `tests/pf5-impl-apa-full-list.spec.js` extension proposed in §12
  covers the download flow.
- **Taxonomy migration.** Migrating `teemat.njk` / `kategoriat.njk` /
  `avainsanat.njk` from `data.citation` to the shared renderer
  changes the visible text on ~250 taxonomy pages. Should ship as its
  own commit with a parity comparison.
- **`/api/export-data.json` field deletion**. Any external consumer
  relying on `citation` will break silently. Prefer keeping the field
  and populating from the shared renderer to changing the shape.
- **Audit script migration** (three scripts using
  `buildLegacyFiPublicationRows`) — retiring the pre-canonical parity
  check removes a safety net for future refactors of the canonical
  builder. Only delete the helper after the audit scripts are re-based
  on the canonical rows.

## 14. Rollback strategy

- Every deletion should land as a **single-file, single-concern
  commit** that removes only the specific formatter + its call sites.
- Revert is `git revert <sha>` — because the legacy formatters are
  local (not imported), rollback is a mechanical restore.
- The Phase 4a step touches only `src/julkaisut.njk` +
  two audit scripts + one Playwright spec. If the RIS download
  regresses in production, revert the single commit and re-add the
  Playwright coverage upstream of the retry.

## 15. Explicit no-production-change statement

**No production source file was modified by this audit.** The only
files added are:

- `scripts/audit-pub-cite1-phase4-legacy-citation-deletion-readiness.js`
- `docs/data/pub-cite1-phase4-legacy-citation-deletion-readiness-2026-08-17.json`
- `docs/pub-cite1-phase4-legacy-citation-deletion-readiness-audit-2026-08-17.md`
  (this document)

None of them are imported by any production template, data loader,
Nunjucks page, or public JSON endpoint.

## 16. Suggested next step

Phase 4a as described in §12: migrate the two Zotero + Mendeley
handlers to the shared renderer and delete `buildRisEntry`.
Everything else stays for a separate commit after its own migration
step (§12, §13).
