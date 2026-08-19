# Theses archive convergence — readiness audit

Date: 2026-08-19

Repository: `LaruX75/www`

Branch: `audit/theses-archive-convergence`

Base main SHA (audit HEAD): `c78bbfa6c82fe8aad5683aed1f4b15e25c699d24` (post-Phase-6 MAIN closure)

Status: **READY WITH CONDITIONS**

Machine-readable evidence: `docs/data/theses-archive-convergence-audit-2026-08-19.json`.

Scope: **audit only**. No production template, JS, CSS, canonical data, Pagefind configuration, or archive-redesign implementation. Recommends a target architecture + phased implementation plan.

Out of scope:

- PF5 GLOBAL RESULT PARITY (Phase 5) — remains NOT STARTED. This audit's conclusion informs Phase 5 but does not start it.
- Publications citation architecture (already closed).
- Presentations, Media.
- Canonical Content v1.

---

## 1. Verified state

```text
git branch:      audit/theses-archive-convergence
base main HEAD:  c78bbfa6c82fe8aad5683aed1f4b15e25c699d24
                 (Merge PR #106 — docs(theses): close TH-CITE1 Phase 6 on main)
git status:      clean (only .cache/ + docs/data/*.json build artefacts)
```

TH-CITE1 Phase 1–6 all CLOSED / GREEN / MAIN. Shared renderer at `src/js/publication-citation.js` is the sole bibliographic composer.

---

## 2. Current /opinnaytteet/ (+ /en/theses/) architecture

Producer chain, verified in source:

```text
src/_data/theses.js               raw OuluREPO fetch + withCitation() enrichment
  ├─ raw records:                  gradut (88 incl. 1 duplicate) + kandit (29) + reviewerOnly (53) = 170
  └─ withCitation attaches:        pageUrl, citationApa (via shared renderer), citationStyle,
                                   researchLine/Themes/Audience/Priority/Summary/Excluded, featuredOn

src/_data/thesisDetails.js        canonical dedup → 169 unique thesisDetail items
  └─ thesisRole:                   "advised" (gradut+kandit) OR "reviewed" (reviewerOnly)

src/_data/thesesArchivePagesFi.js pagination data source
  └─ 16 permalinks per locale:     1 landing (all 3 sections at page 1) +
                                   8 masters/page/2..9 + 2 kandit/page/2..3 + 5 tarkastetut/page/2..6

src/opinnaytteet.njk              paginated template (Eleventy pagination.data = thesesArchivePagesFi.pages)
  └─ includes:                     find-explore-writings.njk + thesis-archive-sections.njk

src/_includes/thesis-archive-sections.njk
  └─ Loops 3 sections, calls thesis-archive-table.njk for each

src/_includes/thesis-archive-table.njk
  └─ Top pager + <table class="thesis-archive-table"> + Bottom pager
  └─ Row columns: Year | Citation (APA 7) | Open (OuluREPO)
  └─ Citation source (line 77):    thesis.csl | publicationCitation("apa", thesisSectionLang)
  └─ Slice locally by page:        currentPage → items.slice(start, end)

src/_includes/thesis-archive-pager.njk
  └─ Pagination controls; both top and bottom instances render identically

src/js/thesis-archive-pagination.js   3,767 bytes
  └─ Fragment-swap PE: intercept [data-thesis-pager-link] click,
     fetch target SSR URL, replace matching [data-thesis-section] fragment.
  └─ No pushState (Phase 3 architecture decision — enhanced multi-section
     state cannot be represented by a single-section SSR URL).

src/js/find-explore.js (theses branch)   35,686 bytes
  └─ Mounts on data-find-explore (theses kind).
  └─ Results container:            [data-find-explore-results] inside
                                    find-explore-writings.njk (SEPARATE div).
  └─ Row render:                   renderResultEntry(entry) → <li> with
                                    family header + title link + primary-meta line
                                    (authorLine, typeLabel) + excerpt.
  └─ Hides SSR archive:            document.body.classList.add("find-explore-active")
                                    when query/filter non-empty (line ~707).

src/css/theses-page.css
  └─ body.find-explore-active .thesis-archive-sections { display: none; }
     (SSR archive is hidden when F&E shows an active-state result list.)
```

Baseline measurements (built `_site/` on this branch):

```text
/opinnaytteet/         167,137 bytes / 1,718 DOM tags / 30 SSR rows / 3 sections / 120 pager elements
/en/theses/            158,812 bytes / 1,658 DOM tags / 30 SSR rows / 3 sections / 120 pager elements
Total SSR thesis files  201 (169 detail pages + 32 archive permalinks)
Pagefind fragments      169 thesis-tagged
JS payload
  thesis-archive-pagination.js    3,767 B
  find-explore.js                35,686 B
```

Corpus:

```text
role/type matrix (canonical unique 169)
  advised/masterThesis    87
  advised/bachelorThesis  29
  reviewed/masterThesis   53
  reviewed/bachelorThesis  0

multi-role overlap        0
```

---

## 3. Confirmed UX defects

### 3.1 Two parallel result surfaces

Verified in code + built output:

- **SSR surface**: `.thesis-archive-sections > 3× [data-thesis-section]`, each with pager + table + pager (120 pager elements per landing across 6 pagers).
- **F&E surface**: `[data-find-explore-results]` inside `find-explore-writings.njk`, populated by `find-explore.js#renderResultEntry` when the user types a query or picks a filter.

Coordination: when a query/filter is active, `find-explore.js` sets `body.find-explore-active`, CSS hides `.thesis-archive-sections` via `display: none`. Reset removes the class.

**Compliant with the "one visible surface, two states" invariant?** Partially. The visible-at-a-time contract is met (either archive OR results, never both). But the two surfaces are **not the same DOM tree** — the archive is 3 tables, the F&E result set is a flat `<ol>` of custom result-list `<li>` cards. Same-location, but a completely different information architecture. A user sees:

- No-query: 3 tables, columns Year / Citation (APA 7) / Open
- Query-active: 1 flat list, title + author line + excerpt (no year column, no thesis-type badge in a scannable column)

This is the reported "second result surface" defect. The archive-hidden trick masks the duplication rather than solving it.

### 3.2 APA 7 citation as the primary archive column

Verified `src/_includes/thesis-archive-table.njk:66,77`:

```njk
<th scope="col" class="thesis-archive-col-citation">Lähdeviite (APA 7)</th>
...
<a class="thesis-archive-title-link fw-semibold" href="{{ thesis.pageUrl }}">{{ thesis.title }}</a>
<p class="small font-monospace mb-0 thesis-archive-citation">
  {{ thesis.csl | publicationCitation("apa", thesisSectionLang) }}
</p>
```

Every row shows: title (link) + APA 7 citation string underneath. That's ~200 characters of citation text per row, mostly redundant with the title/author already visible. Costs:

- Scan cost: APA citations are long strings; the eye has to jump over redundant author-year-title text to find the year (which repeats in the citation).
- Duplication cost: citation text is already available on the detail page's Citation card, and via the modal export UI. Repeating it on the archive doubles the citation surface.
- Mobile cost: APA line wraps to 4+ visual lines on narrow screens, pushing rows apart.
- Accessibility cost: the `<p class="font-monospace">` inside `<td>` creates a two-line row content model that assistive tech reads as separate paragraphs per row.

APA does **not** serve an archive browsing need. It's a bibliographic export format, not a table column.

### 3.3 Three tables + six pagers

Verified in `thesis-archive-sections.njk` — the three sections (`advisedMasters`, `advisedBachelors`, `reviewed`) each render a separate `<table>` with its own top+bottom pager, 3 independent page states, and 16 bounded SSR permalinks per locale (32 total).

Justification for three separate tables would need to be: **users navigate the sections independently**. But:

- All three tables carry the same columns.
- All three have the same information hierarchy.
- The distinguishing information (thesis type + role) is a per-row property that a `Type / Role` column would express directly.
- Advised/bachelor items are 29 rows across 3 pages — a size that easily fits alongside advised/master + reviewed in one paginated table.

The three-table split is a **presentation choice**, not a canonical semantic distinction.

---

## 4. Canonical type/role semantics

Verified authoritative fields:

- `thesis.type` (raw) → `"masterThesis"` | `"bachelorThesis"` | (fallback `"Opinnäytetyö"`). Corpus: 140 master + 29 bachelor.
- `thesis.thesisRole` (assigned in `thesisDetails.js:66-68` and `toThesesCollectionItems.js:126-128`) → `"advised"` | `"reviewed"`. Corpus: 116 advised + 53 reviewed.
- **Overlap between advised + reviewed buckets: 0.** Verified via `src/_data/theses.js` output — the raw source disjointly places each URL in either `gradut`/`kandit` (advised) or `reviewerOnly` (reviewed).

Combined role×type matrix on the current corpus:

| combo | count | UI label (proposal) |
|---|---:|---|
| advised / masterThesis | 87 | `Gradu · ohjattu` / `Master's · advised` |
| advised / bachelorThesis | 29 | `Kandi · ohjattu` / `Bachelor's · advised` |
| reviewed / masterThesis | 53 | `Gradu · tarkastettu` / `Master's · reviewed` |
| reviewed / bachelorThesis | 0 | — (empty combo; UI must still handle it) |

**Multi-role handling:** the current data model does not represent a thesis with both advised AND reviewed roles. If future OuluREPO fetches ever surface a shared record, the dedup in `thesisDetails.js#collectCanonicalTheses` (line 71: `if (!link || seen.has(link)) continue`) picks the FIRST occurrence — which is `advised` since gradut/kandit are enumerated before reviewerOnly. This is a silent policy. Any future one-table convergence should document this and add a small audit gate that alerts if a URL ever appears in more than one bucket.

**Convergence rule:** UI may present a combined label (`Gradu · ohjattu`) but MUST NOT create a new canonical field. The label is a build-time derivation from `(thesisType, thesisRole)`.

---

## 5. Pagefind metadata suitability

Verified by decompressing a real Pagefind fragment on `_site`:

```json
{
  "url": "/opinnaytteet/14304/",
  "meta": {
    "title": "…",
    "thesesAuthorLine": "Shinwari, Fawad",
    "thesesType": "masterThesis",
    "thesesRole": "reviewed",
    "thesesYear": "2019",
    "thesesLang": "en",
    "thesesDescription": "…"
  },
  "filters": {
    "FindExplore", "Sisältö", "Theses scope", "Theses type",
    "Theses year", "Theses language", "Theses topic",
    "Theses author", "Research context", "Kieli"
  }
}
```

Every field a compact archive-row projection needs (year, author, title, type, role, `pageUrl`, `sourceUrl` derivable via the detail page's canonical URL) is already indexed.

**Gap: `Theses role` is NOT indexed as a Pagefind filter.** It IS available in `meta.thesesRole`, so a JS renderer can consume it, but a user cannot **filter** by role from the F&E controls today. Convergence should add a `Theses role` filter emission in `src/_utils/thesesFindExplore.js#buildThesisFindExploreDocument` — this is a build-time Pagefind index projection from existing canonical `thesisRole`, not a canonical data change.

**Missing for compact row rendering: none.** Existing meta is sufficient. No new field.

---

## 6. Proposed target architecture

```text
canonical theses (169 unique)
  └─ Eleventy/Nunjucks
       ├─ deterministic ordered thesis archive model
       │    order: year DESC → title ASC (existing)
       │    projection: {year, authorLine, title, thesisType, thesisRole, pageUrl, sourceUrl}
       ├─ ONE SSR table on /opinnaytteet/ and /en/theses/
       └─ SSR pagination (Eleventy) — bounded permalinks with page size 20

Interaction state:
  ├─ user query / filter
  ├─ Pagefind returns matching canonical identities + order
  ├─ Same table surface: JS repopulates <tbody> from Pagefind meta
  │    (uses meta.thesesType + meta.thesesRole + meta.thesesAuthorLine
  │     + meta.thesesYear + result.url + result.meta.title)
  └─ Reset restores canonical SSR archive (page 1, empty query)

Rules:
  - Same DOM table stays in place (<table> + <tbody>).
  - No parallel `[data-find-explore-results]` div beside the archive.
  - No DOM filtering / hide-show of 169 canonical rows.
  - Pagefind supplies canonical identities; the row projection is the same
    build-time projection the SSR table uses.
  - No empty-query Pagefind archive generation — SSR owns page 1.
```

Evaluation of Option A / B / C / D from the readiness spec:

| Option | Rating | Notes |
|---|---|---|
| A — SSR table + JS row renderer with shared projection contract | **Preferred** | Single row shape rendered by both SSR (Nunjucks) and JS (find-explore.js). The projection lives in `src/_utils/thesisArchiveRow.js` (new). SSR passes the projection to Nunjucks; JS builds it from Pagefind meta (fields already indexed). Both emit the SAME `<tr>` structure. No hidden 169-row DOM. |
| B — Expose an allowlisted canonical row projection as a JSON blob for JS | Rejected | Would add a global browser-side thesis dataset. User directives from Phase 3 explicitly forbid this. |
| C — Pagefind metadata sufficient without any shared projection contract | Rejected | JS-side would compute the row layout independently of SSR-side; drift risk. |
| D — Any better | Not found | Option A is the smallest correct model. |

---

## 7. Proposed table information architecture

Columns:

| Column | Content | Notes |
|---|---|---|
| Year | `thesis.year` | 4-char numeric, sorts descending |
| Author | `thesis.authorLine` | e.g. `Kurki, Suvi; Komulainen, Anna` — semicolon-separated |
| Title | `<a href="{{ pageUrl }}">{{ title }}</a>` | Local canonical detail link, no APA text |
| Type / role | `{{ typeRoleLabel }}` | e.g. `Gradu · ohjattu` (FI), `Master's · advised` (EN); build-time derivation from `(thesisType, thesisRole)` |
| Open | `<a href="{{ sourceUrl }}" target="_blank">↗ OuluREPO</a>` | External source action |

Responsive collapse (narrow screens): combine `Author` and `Title` into a single stacked cell with the title on line 1 and author line beneath in `.small.text-muted`. Preserve semantic table headers via `visually-hidden` or `scope="row"` cell markup. Do not `display:none` header rows.

Sort order: **year DESC → title ASC** (matches existing `thesisDetails.js#sortThesisDetails`). Preserved.

APA 7 citation removed from archive row. It remains:

- On the thesis detail page's Citation card (SSR via `thesisDetail.csl | publicationCitation("apa", currentLang)`).
- In the citation/export modal (JS via shared renderer).
- In `/data/theses.json.citationApa` and JSON-LD `citation` — PUBLIC contracts preserved. Phase 6 delivered these unchanged.

---

## 8. Pagination model

Recommendation:

- **One SSR archive pagination.** Eleventy pagination over 169 canonical unique thesis rows, page size **20** (chosen: 169/20 = 9 pages per locale — bounded, matches the current 16 permalinks per locale in total but for one archive instead of three sections).
- URL shape: `/opinnaytteet/` (page 1) + `/opinnaytteet/sivu/2..9/` (or existing convention). EN mirrors as `/en/theses/` + `/en/theses/page/2..9/`.
- Sitemap: only landing pages indexed; paginated pages `noindex, follow` + `sitemap.ignore` (matches Phase 3 discipline).
- SSR pagination controls: single top-and-bottom pager pair per archive page (not per section). If the row count is short, one pager (bottom only) may suffice.
- Reset: clicking "Clear" in F&E controls navigates to `/opinnaytteet/` (empty query, SSR archive page 1). Do NOT run an empty Pagefind query to regenerate the archive.
- Active F&E state: Pagefind owns the ordering + pagination. JS overwrites `<tbody>` with matching rows; a compact "showing N of M" status line replaces the SSR pager (SSR pager is hidden when `body.find-explore-active`, symmetric with the current archive-hide behaviour).

Page-size evidence:

- Current per-section pagination page size = 10 → landing shows 30 SSR rows (10 per section × 3).
- Convergence to page size 20 → landing shows 20 SSR rows in one table.
- HTML byte impact: ~167 KB current → estimated ~110–125 KB post-convergence (removing 2 sections' worth of table + pager scaffolding, minus a slightly wider single-table row structure).

---

## 9. FI / EN parity implications

- Row shape identical for both locales; only labels differ.
- Type/role label mapping table lives in one build-time helper. FI and EN mappings sit next to each other.
- No canonical field is created for the combined label; both locales derive it at build time.
- Detail permalink policy unchanged (`/opinnaytteet/{id}/` for all theses regardless of source language).
- JSON-LD `citation` and public JSON `citationApa` unchanged.

---

## 10. Accessibility implications

- One `<table>` with `<caption>` + `<thead>` + `<tbody>` per archive page. Bootstrap table-sm.
- Column headers use `scope="col"`. Row-header cell (title) uses `scope="row"` if the row-header pattern is adopted for responsive collapse.
- Pagination pager: `<nav aria-label="…">` around the pagination list.
- F&E active-state announcement: `role="status"` + `aria-live="polite"` on the "showing N of M matches" caption update.
- The current three-table + six-pager structure is 3× the ARIA landmark noise of one table + one pager pair. Convergence reduces this.

---

## 11. Deletion inventory

If Option A implementation lands:

| Component | Status | Notes |
|---|---|---|
| `src/_includes/thesis-archive-sections.njk` | **DELETE** | Replaced by single-table include |
| `src/_includes/thesis-archive-table.njk` | **SIMPLIFY** | Reduced to one-section shape; APA column removed; row projection consumed |
| `src/_includes/thesis-archive-pager.njk` | **RETAIN** (simplified) | Same pager, one instance per page instead of 6 |
| `src/_data/thesesArchivePagesFi.js` | **SIMPLIFY** | Single-archive pagination model; no per-section splits; `SECTIONS` constant removed |
| `src/_data/thesesArchivePagesEn.js` | **SIMPLIFY** | Same as FI |
| `src/js/thesis-archive-pagination.js` | **DELETE** (~3.7 KB) | Fragment-swap PE no longer needed when only ONE table exists — SSR navigation is sufficient. Or repurpose to a minimal "swap tbody" progressive enhancement if smoother UX is required. |
| `src/js/find-explore.js` theses branch | **SIMPLIFY** | `renderResultEntry` for `kind==="theses"` becomes a `<tr>` renderer that writes into the archive `<tbody>`. `find-explore-active` body-class toggle stays; CSS rule changes from "hide archive" to "hide SSR pager + swap tbody". `[data-find-explore-results]` div becomes unused for theses — either deleted from `find-explore-writings.njk` when kind=theses or repurposed as a lightweight status/count line. |
| `src/_includes/find-explore-writings.njk` | **AUDIT** | Shared include used by writings + publications too. Do not delete; theses-branch handling of `data-find-explore-results` must not break other consumers. |
| `src/css/theses-page.css` `body.find-explore-active .thesis-archive-sections` | **SIMPLIFY** | Rule targets the archive-container. If archive becomes a `<table>` with `<tbody data-find-explore-target>`, the rule becomes a `tbody`-swap coordinator. |
| `src/_utils/thesesFindExplore.js#buildThesisFindExploreDocument` | **EXTEND** (small) | Add `Theses role` filter emission from existing `thesisDetail.thesisRole`. Not a canonical change. |
| Bounded per-section SSR permalink families (`ohjatut-gradut/page/N/`, `kandityot/page/N/`, `tarkastetut/page/N/`) | **DELETE** | Replaced by a single `/opinnaytteet/sivu/N/` (or equivalent) family. Retain redirects if any external link uses them. |
| Old per-section anchors `#ohjatut-gradut`, `#kandityot`, `#tarkastetut` | **RETAIN as redirects** | Anchors are cheap; scroll-to-behavior in the single table can accept these anchors as `?filter=type-role` shortcuts. |

Public contracts NOT deleted:

- `/data/theses.json` — no shape change; still 169 items with `citationApa`, `thesisRole`, `thesisType`, etc.
- JSON-LD `citation` on 169 detail pages.
- `/opinnaytteet/{id}/` canonical detail permalinks.
- `withCitation()` server function.

---

## 12. Test impact map

| Test / audit | Impact | Action after convergence |
|---|---|---|
| `tests/th-cite1-phase3-thesis-pagination.spec.js` (8 tests) | Assumes 3 independent section paginators with top+bottom sync and section-scoped URLs. **Assumption changes** — one archive, one pager. | Rewrite to assert single-archive pagination + reset behaviour. |
| `tests/f3a-theses-find-explore.spec.js` (3 tests, 0 skips post-Phase-4D) | 1 test asserts "archive has no citation triggers + ≤30 rows". Row cap changes to 20; other assertions stay. | Update row cap constant; other tests remain. |
| `tests/th-cite1-phase4b-thesis-detail-modal.spec.js` (11 tests) | Detail-page modal; unaffected by archive convergence. | Keep as-is. |
| `tests/th-cite1-phase4c-no-raw-field-fallback.spec.js` (7 tests) | Modal fallback; unaffected. | Keep as-is. |
| `scripts/audit-th-cite1-phase3-ssr-archive.js` (10 gates) | Asserts 16 permalinks/locale, 30 rows/URL, per-section structure. **Assumption changes** — 9 or so permalinks/locale, 20 rows/URL, one archive. | Rewrite gates for the new bounded model. Keep sitemap-discipline gates. |
| `scripts/audit-th-cite1-phase4-modal-export-parity.js` (52 gates) | Includes 30-row/URL SSR archive gate + 3-section structural gates. | Update rows/URL gate + drop 3-section-specific gates. Keep Phase 4 modal + deletion + parity gates unchanged. |
| `scripts/audit-th-cite1-phase4c-browser-citation-deletion.js` (38 gates) | Independent of archive shape. | Keep as-is. |
| `scripts/audit-th-cite1-phase6-legacy-server-citation-deletion.js` (18 gates) | Independent of archive shape. | Keep as-is. |
| Accessibility / contrast / navigation | Sensitive to table shape + label changes. | Re-run after implementation; expect green with new labels. |
| Pagefind corpus parity | Still 169 fragments; `Theses role` filter added → 1 new filter type indexed. | Update audit gate to expect the new filter. |

**Permanent invariants that must never weaken:**

- Canonical unique 169 = public JSON 169 = Pagefind thesis fragments 169.
- `/data/theses.json.citationApa` byte-identical to Phase 6 baseline (169/169).
- JSON-LD `citation` byte-identical to public JSON (169/169).
- No public CSL exposure.
- Legacy composer symbol absence in the shipped JS.
- Phase 4B modal open + shared-renderer preview.
- Phase 4C no-raw-field-fallback.
- Sitemap: only landing archives indexed; paginated pages `noindex, follow` + `sitemap.ignore`.

---

## 13. Risks / conditions

Conditions (READY WITH CONDITIONS):

1. **Convergence must not create a global browser-side JSON blob of all 169 thesis rows.** JS must consume canonical identity + meta from Pagefind results only. Shared row projection contract lives in a build-time helper AND is duplicated inside the SSR template + F&E result renderer — both call the same projection function, not the same runtime data.
2. **The `body.find-explore-active` class toggle must be preserved but its CSS rule changes:** from "hide entire archive-sections div" to "swap `<tbody>` content + hide SSR pager". The archive-container stays visible; only its rows change.
3. **Reset behaviour must never call `Pagefind.search("")`** to reconstruct the archive. Reset navigates to `/opinnaytteet/` (real SSR page 1) or clears the JS state to re-render the SSR-baked rows if the client already loaded them.
4. **Multi-role handling documented + audited.** If any future thesis appears in both advised + reviewed buckets, the current silent-dedup policy must be surfaced (via a new small audit gate) instead of silently picking one role.
5. **PF5 GLOBAL RESULT PARITY sequencing.** Phase 5's cross-domain result-card unification should NOT freeze the current separate-`<li>`-card thesis format. Convergence changes the thesis result presentation to a `<tr>` renderer. Phase 5 must consume the post-convergence contract, not the pre-convergence one. Sequencing: **convergence → then Phase 5**.
6. **Bounded permalink policy.** New pagination emits ~9 SSR pages per locale (169 rows / 20 per page ≈ 9) versus current 16. All non-landing pages carry `robots: "noindex, follow"` + `sitemap.ignore` per Phase 3 discipline.
7. **Detail page + Pagefind fragment content is unchanged.** No canonical, no Pagefind meta content change (only one new `Theses role` filter emission, additive).

---

## 14. Recommended implementation phases

Each phase is independently reviewable and reversible. Modeled on the TH-CITE1 Phase 3 / Phase 4 pattern.

- **CONV-A — Build the shared archive-row projection contract** (`src/_utils/thesisArchiveRow.js` new; pure function taking a thesisDetail or Pagefind meta and returning `{year, authorLine, title, typeRoleLabel, pageUrl, sourceUrl}`). Unit tests. No template change.
- **CONV-B — Add `Theses role` filter to `buildThesisFindExploreDocument`.** Rebuild; expect 169 Pagefind fragments to gain the new filter. No template change.
- **CONV-C — Replace SSR three-section archive with one-table archive.** New `thesis-archive-list.njk` include; new `src/_data/thesesArchivePages{Fi,En}.js` structure with a single flat pagination. Update `opinnaytteet.njk` and `en/theses.njk`. Delete `thesis-archive-sections.njk`. Update SSR audit + browser tests to expect new row cap + pagination shape.
- **CONV-D — Migrate F&E theses branch to `<tbody>`-swap.** Update `find-explore.js#renderResultEntry` for `kind==="theses"` to emit `<tr>` and write into the archive `<tbody>`. Update `body.find-explore-active` CSS rule to hide the SSR pager instead of the whole archive. Delete the theses branch of `[data-find-explore-results]` list rendering.
- **CONV-E — Delete `src/js/thesis-archive-pagination.js`** if the new one-table SSR pagination doesn't need progressive enhancement (or repurpose to a `<tbody>` fetch-swap if UX benefit demonstrated).
- **CONV-F — Full parity + accessibility + Pagefind + sitemap regression.** Re-run all TH-CITE1 audits with updated Phase 3 + Phase 4D gates.
- **CONV-G — MAIN closure** (implementation PR + docs PR pattern from Phase 4 / Phase 6).
- **THEN, and only then, PF5 GLOBAL RESULT PARITY.** Phase 5 consumes the post-convergence thesis result contract.

Each phase should ship as one commit on a shared feature branch `feat/theses-archive-convergence` following the Phase 4 A-D pattern.

---

## 15. Explicit PF5 boundary

PF5 GLOBAL RESULT PARITY remains **NOT STARTED**. This audit's conclusion is that Phase 5 should be **sequenced after** the archive convergence, not before, because Phase 5 needs to know the post-convergence thesis result contract in order to unify the cross-domain result card layer. Starting Phase 5 first would freeze the current separate-`<li>`-card thesis result surface, which the convergence intentionally deletes.

---

## 16. Decision

**READY WITH CONDITIONS** (see §13). All prerequisites for the recommended target architecture are present:

- Canonical role/type semantics are clean (§4).
- Pagefind meta already carries every field a compact row needs (§5) with one additive filter emission (`Theses role`) to add.
- No canonical field or public contract needs to change.
- No canonical Content v1 change.
- Legacy citation composers are all deleted (Phase 4C + Phase 6) — no bibliographic-authority conflict.

Implementation, when scheduled, should proceed in the CONV-A → CONV-G sequence in §14. PF5 GLOBAL RESULT PARITY strictly follows convergence, not the other way around.

END OF AUDIT.
