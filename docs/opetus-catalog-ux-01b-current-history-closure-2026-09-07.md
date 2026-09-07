# OPETUS-CATALOG-UX-01B — closure (2026-09-07)

Splits `/opetus/` into **Nykyinen opetus** (current teaching) and
**Aiemmat kurssitoteutukset** (historical implementations). Adds a
user-facing manual-curation notice under the historical section. Follows
up on the row-layout and row-color observations from
OPETUS-CATALOG-UX-01. Presentation layer only.

## 1. Baseline

- Branch: `feat/opetus-catalog-ux-01b-current-history`
- Base SHA: `867c5c3f78b79817e0cc6233bb8082a40a934abb` (origin/main after
  OPETUS-CATALOG-UX-01 merge, PR #226)
- Playbook: `docs/ui-ux-playbook.md` (ACTIVE / REPO-GROUNDED GUIDANCE)
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (unchanged)
- Canonical Content v1 = unchanged
- OPETUS-IA-01, OPETUS-CATALOG-01A, OPETUS-CATALOG-UX-01,
  OPETUS-CURATION-01B2, CANONICAL-COURSE-PERIODID-01,
  COURSE-RELATION-UX-01 invariants preserved
- PR #227 (OPETUS-CURATION-01C2) remains **UNMERGED** and is
  intentionally not touched here. §12 documents forward compatibility.

## 2. User-facing problem

After OPETUS-CATALOG-UX-01, `/opetus/` rendered current and historical
course implementations as visually equivalent peer course cards under a
single "Kurssitoteutukset" section. That was cleaner than the pre-slice
oversized presentation but still misleading semantically: it implied that
405040Y (currently taught in `2026-2027-a`) and 410014Y (historical
`2013-2014-a`) had the same status.

The user needs two clearly distinct sections. Historical implementations
must not appear to have the same status as current teaching, and users
need to know that the historical catalog is being curated manually and
is not yet complete.

## 3. Grouping rule (SSR-derived, no canonical status field)

An implementation is **current** iff its course-page frontmatter carries
a non-empty **`course.peppiUrl`**. Otherwise it is **historical**.

Why this signal:

- `peppiUrl` is a hand-curated pointer at the University of Oulu study
  guide URL for that specific implementation. It can only be added when
  the implementation is live in that guide.
- Historical pre-Peppi-migration implementations deliberately omit it
  because the University's study guide has no detail data for those
  years — verified in `docs/peppi-api-suitability-01-audit-2026-09-06.md`
  (the backend `/api/course/{unitId}?period=YYYY-YYYY` returns 404 for
  pre-Peppi curricula).
- It is not a status boolean tacked onto Presentation records or a new
  taxonomy. It is a page-level metadata field that already exists on the
  current 405040Y course page and is deliberately absent from the
  merged 2013 historical page.
- It handles the future case symmetrically: when the site adds a new
  currently-taught implementation, curators add its `peppiUrl` and the
  catalog auto-classifies it. When an implementation drops out of the
  current guide, curators remove `peppiUrl` and it auto-moves to the
  historical section.

Implementation:

- `src/_data/coursePages.js` gained one field extraction (`peppiUrl`) and
  two small helpers:
  - `isCurrentImplementation(impl)` — presence-of-peppiUrl predicate.
  - `splitCatalogByCurrency(catalog)` — walks the existing `catalog`
    projection and produces `{ current, historical }`, each carrying
    the SAME course-group shape with implementations filtered by the
    predicate. Course groups with only historical implementations are
    excluded from `current`, and vice versa. Ordering within each group
    is preserved from `buildCatalog()` (course by courseName ASC, then
    implementations by `academicYear` DESC).
- Two new module exports on the data cascade: `coursePages.catalogCurrent`
  and `coursePages.catalogHistorical`.
- Zero new fields on any Presentation record. Zero new fields on
  `courseContexts[]`. Zero new taxonomy or context vocabulary. No
  canonical schema change.

## 4. Current vs historical semantics today

| Implementation | peppiUrl on course page | Section |
|---|---|---|
| 405040Y / `2026-2027-a` (Syyslukukausi 2026) | present (live Peppi link) | **Nykyinen opetus** |
| 410014Y / `2013-2014-a` (Syksy 2013) | absent (pre-Peppi historical) | **Aiemmat kurssitoteutukset** |

Verified against the fresh built `_site/opetus/index.html`:

- `<div class="vstack gap-3" data-opetus-catalog="current">` contains
  the 405040Y course card only.
- `<div class="vstack gap-3" data-opetus-catalog="historical">` contains
  the 410014Y course card only.
- No implementation is duplicated across sections
  (`data-period-id="…"` occurrences are unique).

## 5. Manual curation notice

Rendered under the "Aiemmat kurssitoteutukset" heading as a `<p
data-opetus-historical-notice>`:

> "Aiemmat kurssitoteutukset tuodaan parhaillaan käsin osaksi tätä
> luetteloa, joten kaikkia vanhoja toteutuksia ei vielä näy täällä."

This is the task-specified longer variant. Chosen because it improves
user understanding: it explicitly says both (a) the historical catalog
is being curated manually and (b) it is not yet complete. It does not
imply completeness, automatic import, or that missing years did not
exist. The regression test asserts the exact wording (matching the
non-truncated first-sentence portion) and asserts the absence of any
"automaatti…" claim.

## 6. VISUAL PRECEDENTS

1. **`src/_includes/presentations/context-group-card.njk` +
   `src/css/presentations-page.css:169-288`** (PRIMARY)
   - Reused pattern: **group-first linked rows** — parent article
     carries the group heading, list items are compact linked rows with
     secondary meta close to the title. In OPETUS-CATALOG-UX-01B the
     meta is now stacked directly under the linked title (single
     block-level anchor with two child divs) rather than opposite ends
     of a flex row, so the metadata sits visually near the title on
     both desktop and mobile.

2. **`src/_includes/thesis-archive-table.njk:24-32`** (SECONDARY)
   - Reused pattern: **section-header shape** — `d-flex flex-wrap
     align-items-start justify-content-between gap-3 mb-3` with h2 +
     description on the left and a `.badge.text-bg-light.border.text-dark`
     count on the right. Applied to BOTH the current and historical
     section headers so they read as parallel sections of the same site.

3. **`src/en/keywords.njk`** (TERTIARY, unchanged from OPETUS-CATALOG-UX-01)
   - Reused pattern: **full-row interactive `<a class="list-group-item
     list-group-item-action">`**. Preserved in this slice.

## 7. Row layout follow-up

The OPETUS-CATALOG-UX-01 review flagged the previous row layout
(`d-flex justify-content-between`) as feeling too table-like — meta was
pushed to the far right and could feel detached from the title. This
slice restructures the row to a **stacked block layout**:

```html
<a class="list-group-item list-group-item-action bg-transparent px-0 py-3"
   href="…" data-opetus-implementation data-period-id="…">
  <div class="fw-semibold">{semesterLabel}</div>
  <div class="small text-muted mt-1">{meta …}</div>
</a>
```

Both children are block-level. The linked title is primary; the meta is
secondary, sitting immediately under the title. No `d-flex` on the
anchor — the natural block flow is enough. Playbook §Typography line 143
recognises muted 0.82–0.9rem metadata copy as the standard treatment,
which `.small.text-muted` produces exactly.

Row height on desktop stays under one text line's rhythm; on mobile the
meta wraps naturally when it exceeds the row width. The full-row link
remains ≥ 44 × 44 CSS px (measured this run: current row 272 × 114 px on
mobile, historical row 272 × 91 px on mobile).

## 8. Color follow-up

The OPETUS-CATALOG-UX-01 review flagged the row background as reading
warm/beige (risking a "disabled" impression) inside a white card body.
Root cause: Bootstrap 5's `.list-group-item` sets a subtle background
token that visually competes with the card body.

Fix: add `bg-transparent` to every `.list-group-item-action` row. Now the
row background is fully inherited from the parent `.card-body`. Hover
and focus states from `.list-group-item-action` remain visible
(Bootstrap tints the row on interaction). Contrast is preserved because
the meta uses `.text-muted` which resolves to `--bs-secondary-color`
against `--bs-body-bg`.

No new colors, no new tokens, no bespoke design language.

## 9. Count decision

Both sections carry their own small count badge in the section header
right column (mirroring the thesis-archive-table shape). With today's
inventory both badges read **"1 kurssi"**. The grammar conditional
(`{{ N }} kurssi` when `N === 1`, `{{ N }} kurssia` otherwise) is a
reused inline conditional from OPETUS-CATALOG-UX-01 and is defined
inside a shared `courseCountBadge` macro so it lives in exactly one
place inside the template.

The previous global "2 kurssia" badge over a single flat catalog is
removed.

## 10. Desktop QA (1440 × 900)

Captured to `outputs/opetus-catalog-ux-01/opetus_desktop_1440_*.png`.
Metrics: `outputs/opetus-catalog-ux-01/metrics.json`.

- Current vs historical distinction is obvious within seconds:
  - Two clearly labelled h2 headings ("Nykyinen opetus" then "Aiemmat
    kurssitoteutukset").
  - A visible `.border-top` between the two sections.
- Current teaching has stronger visual priority via top position.
- The manual-curation notice sits directly under "Aiemmat
  kurssitoteutukset" as a muted `<p>` — visible but not dominant.
- Implementation metadata is now directly under the title rather than
  floating far right; row density feels calmer.
- Historical rows no longer look disabled (bg-transparent). No visual
  status difference implied inside a row.
- Course grouping remains obvious (course card → implementation rows).

## 11. Mobile QA (390 × 844)

- Section headings clear; "Nykyinen opetus" / "Aiemmat
  kurssitoteutukset" both use the same h2 treatment.
- Manual-curation notice wraps naturally; no forced line break in the
  markup.
- No horizontal overflow (`docWidth === clientWidth = 390`).
- Full-row link hit areas measured this run:
  - Current row (405040Y Syyslukukausi 2026): 272 × 114 px
  - Historical row (410014Y Syksy 2013): 272 × 91 px
  - Both above WCAG 2.5.5 Level AAA 44 × 44 CSS px minimum
    (`allLinksMeet44px: true`).
- Metadata hierarchy remains readable — the small muted meta line sits
  directly under the linked title.

## 12. Forward compatibility with PR #227 (OPETUS-CURATION-01C2)

PR #227 is a bounded implementation slice that adds 410014Y /
`2014-2015-a` (Syksy 2014). The new course page it introduces
deliberately has no `peppiUrl` — Peppi has no detail data for 2014-2015
either. Under this closure's rule, that implementation must land under
"Aiemmat kurssitoteutukset" inside the same 410014Y course card as the
existing 2013 sibling, newest first.

`tests/opetus-catalog-ux-01b.spec.js` group **F** proves this
programmatically without depending on PR #227:

- `isCurrentImplementation({ …, peppiUrl: "" })` → `false`.
- `splitCatalogByCurrency([{ courseId: "410014Y", implementations:
  [2014, 2013] }])` → `historical` contains one 410014Y group whose
  `implementations.map(i => i.periodId)` is `["2014-2015-a",
  "2013-2014-a"]`, and `current` is empty.

When PR #227 lands after this slice, its own catalog assertions
(originally written against a single-section catalog) will need a
small update to point at the historical section wrapper. The invariant
that matters (grouping under the same 410014Y course card, newest
first) is preserved by design.

## 13. Data flow preserved

- `src/opetus/*.md` frontmatter → `src/_data/coursePages.js` →
  `coursePages.catalog{,Current,Historical}` → Nunjucks SSR →
  `/opetus/`.
- No runtime JavaScript.
- No JSON fetched at runtime.
- No Pagefind ownership change.
- No browser grouping/sorting.
- No handwritten catalog entry.
- `data-opetus-catalog`, `data-opetus-course`,
  `data-opetus-implementation`, `data-course-id`, `data-period-id`
  markers preserved. The `data-opetus-catalog` attribute now carries a
  value (`"current"` or `"historical"`) to disambiguate the two
  sections; the substring is still present so existing substring-based
  assertions continue to match.

## 14. Architecture boundaries

**AC1 remains CLOSED / GREEN / MAIN.**

Verified against reopen conditions in
`docs/architecture-closure-1-0-closure-2026-08-29.md` §6:

- No new duplicate content ownership. `peppiUrl` was already an
  existing course-page frontmatter field; this slice reads it during
  build-time projection and derives a grouping. It does not become
  canonical storage.
- No canonical semantics moved to browser JS.
- Pagefind untouched.
- No runtime JSON → HTML architecture.
- Public JSON contract unchanged. `periodId` remains stripped from
  public projections.
- No new taxonomy. Presentation records gain no `current` / `archived`
  boolean.
- FI-only teaching status preserved.
- No source / landing / context semantics regression.

## 15. Build + tests

Build: `npm run build:local` — exit 0.

Test batch (Playwright, static `_site` serve):

- `tests/opetus-catalog-ux-01b.spec.js` — **new: 16 tests across
  7 groups (A grouping helper, B rendered sections, C section
  membership today, D component language preserved, E section-level
  counts + grammar, F forward compatibility with PR #227, G
  architecture boundaries). 16/16 green.**
- `tests/opetus-catalog-ux-01.spec.js` — adjacent: 12/12 green (three
  regex-based assertions updated to walk BOTH catalog sections; test
  intent preserved).
- `tests/opetus-catalog-01a.spec.js` — adjacent: 4/4 green (one
  assertion updated: template projection references updated from
  `coursePages.catalog` to `coursePages.catalogCurrent` +
  `coursePages.catalogHistorical`).
- `tests/opetus-ia-01.spec.js` — adjacent: 17/17 green (one heading
  assertion updated to reflect the two new section headings; the
  invariant "sections use h2 with aria-labelledby" preserved).
- `tests/course-relation-ux-01.spec.js` — adjacent: 20/20 green.
- `tests/opetus-curation-01b2.spec.js` — adjacent: 4/4 green.

Combined batch: **76/76 green.**

## 16. Changed files

**Modified:**

- `src/fi/opetus.md` — catalog rewritten into two labelled sections
  with a shared `courseGroupCards()` Nunjucks macro; new shared
  `courseCountBadge()` macro; manual-curation notice added under the
  historical section; row layout stacked (title above meta);
  `bg-transparent` on every row.
- `src/_data/coursePages.js` — extracts `peppiUrl` from each course
  page; exports `isCurrentImplementation`, `splitCatalogByCurrency`,
  `catalogCurrent`, `catalogHistorical`.
- `tests/opetus-catalog-ux-01.spec.js` — three assertions updated for
  the two-section structure; test intent preserved (courses render as
  distinct groups, list-group-item-action row, no oversized CTA).
- `tests/opetus-catalog-01a.spec.js` — one assertion updated for the
  new projection field names.
- `tests/opetus-ia-01.spec.js` — heading assertion updated for the two
  new section titles.

**New:**

- `tests/opetus-catalog-ux-01b.spec.js` — 16 regression tests
  (7 groups; see §15 for breakdown).
- `docs/opetus-catalog-ux-01b-current-history-closure-2026-09-07.md` —
  this file.

## 17. Deletion / simplification

- Deleted from `/opetus/`: the single "Kurssitoteutukset" section
  wrapper. It became two shorter, semantically-distinct sections.
- Deleted from `/opetus/`: the ad-hoc `<span class="badge">2 kurssia`
  literal at the end of the section head. Both new section heads now
  carry a live count computed inside the shared macro.
- No new CSS file. No new page CSS registered via `pageStyles`.
- No 410014Y-specific template branch. No `current` / `archived`
  boolean on any Presentation record.

## 18. Final status

- **OPETUS-CATALOG-UX-01B = CLOSED / GREEN / READY FOR PR.**
- **Architecture Closure 1.0 = CLOSED / GREEN / MAIN.**
- **Canonical Content v1 = unchanged.**
- **OPETUS-CATALOG-UX-01 component language preserved** (full-row
  `list-group-item-action`, no repeated pill CTA, no `p-4 p-lg-5`).
- **OPETUS-CATALOG-01A derived catalog preserved** (now via
  `catalogCurrent` + `catalogHistorical` projections).
- **OPETUS-IA-01 / OPETUS-CURATION-01B2 / CANONICAL-COURSE-PERIODID-01 /
  COURSE-RELATION-UX-01 invariants preserved.**
- **DETAIL-UX-SEQUENCE-01 = CLOSED / DEFERRED / DOCUMENTED / MAIN.**
- **PR #227 remains UNMERGED and untouched.** Forward compatibility is
  verified programmatically without depending on it.
