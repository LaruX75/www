# OPETUS-CATALOG-UX-01 — closure (2026-09-06)

Presentation-layer redesign of `/opetus/`. Preserves the SSR-derived course
catalog and its data flow. Replaces the oversized single-course card layout
with a compact course-group card + list-group implementation rows pattern,
following the repo UI/UX playbook.

## 1. Baseline

- Branch: `feat/opetus-catalog-ux-01`
- Base SHA: `7c0b95bb07312c19cb1a70456367de132f07f88e` (origin/main after UI/UX playbook PR #225)
- Playbook: `docs/ui-ux-playbook.md` (ACTIVE / REPO-GROUNDED GUIDANCE)
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (unchanged)
- Canonical Content v1 = unchanged
- OPETUS-IA-01, OPETUS-CATALOG-01A, OPETUS-CURATION-01B2, COURSE-RELATION-UX-01, HOME-NAV-CORRECTION-01 invariants preserved

## 2. UX problem

The `/opetus/` catalog rendered by OPETUS-CATALOG-01A grew into two courses
(405040Y current + 410014Y 2013 historical) but retained the pre-catalog
single-course visual language. Each course rendered as `<article class="card
shadow-sm"><div class="card-body p-4 p-lg-5">…` with:

- nested `h3` course heading + `h4` implementation heading
- three metadata badges (courseId, credits, academicYear, Periodi)
- a full-width `.btn btn-primary.rounded-pill.px-4` "Avaa kurssisivu" CTA per implementation
- large vertical gap between courses (`.vstack.gap-4`)

Playbook §"Landing, archive, and catalog pages" (line 217) already called the
current `/opetus/` presentation out as **not a density precedent**: repeated
`p-4 p-lg-5` cards, large vertical gaps, and a full pill CTA are too spacious
for a growing implementation catalog. Two courses × one implementation each
consumed roughly half a desktop viewport with almost no data density.

Playbook anti-patterns triggered by the old presentation (line 238–248):

- Giant full-width cards for tiny amounts of repeated metadata.
- Defaulting repetitive catalog items to `p-4 p-lg-5`.
- Oversized or duplicated CTAs in repetitive lists.
- Badge overload obscuring title, date, and action.

## 3. VISUAL PRECEDENTS

**1. `src/_includes/presentations/context-group-card.njk` + `src/css/presentations-page.css:169–288` (PRIMARY)**

- Reused pattern: **group-first linked rows**. A parent article carries the
  group heading (kicker + title) and the group's items render as an inline
  linked list — each row is `<a>title</a>` on the left and small muted meta
  on the right, separated by a border-top divider.
- Reused in `/opetus/`: course = group (courseName + courseId chip);
  implementations = compact list rows (semesterLabel link + inline meta).
- Not blindly reused: the presentation-context-group-card mandates a
  decorative icon and a count badge in its head. Courses in `/opetus/`
  don't have per-course icons and today have count=1. The `/opetus/`
  variant uses Bootstrap `.list-group.list-group-flush` for the divider
  behavior instead of a page-local class, so no new CSS is needed.

**2. `src/_includes/thesis-archive-table.njk:24–32` (SECONDARY)**

- Reused pattern: **outer card wrapper convention**. `<div class="card
  shadow-sm border-0"><div class="card-body">…` without oversized padding.
  Section-header row: `d-flex flex-wrap align-items-start
  justify-content-between gap-3 mb-3` with an h-level title, a muted
  description, and a count badge on the right (`.badge.text-bg-light.border
  .text-dark`).
- Reused in `/opetus/`: the section header carries the same shape (h2 +
  description + "N kurssia" badge), and each course card uses the same
  restrained shadow/border/padding language.

## 4. Alternatives considered

- **A. Course card + compact implementation rows** — SELECTED.
- **B. Grouped table** — rejected: a table (thesis-archive-table shape at
  the row level) would rank implementations across courses as peers. The
  natural /opetus/ browsing task is course-first, then implementations.
  Pinning implementations under their course card preserves the required
  hierarchy.
- **C. Compact archive-card composition** — rejected: each implementation
  as an independent presentation-archive-card breaks the visible "these
  four implementations belong to 410014Y" grouping requirement (task §5).

## 5. Selected component model

Section-level:

- `.card.shadow-sm.border-0` wrapper per course (reused from thesis-archive-table wrapper style).
- `.card-body` with default padding (no `p-4 p-lg-5`).
- `.vstack.gap-3` (down from `gap-4`) for the catalog course list.
- Course head: `d-flex flex-wrap align-items-baseline gap-2 mb-2` — h5 course name + `.badge.text-bg-light.border.text-dark` course code.

Implementation-level:

- `.list-group.list-group-flush` for the implementations list — reused Bootstrap primitive that gives borderless top/bottom edges and thin `border-top` dividers between rows, without any new page CSS.
- Each row is an `<a class="list-group-item list-group-item-action px-0 py-3 d-flex flex-wrap align-items-baseline justify-content-between gap-3" href="{{ implementation.pageUrl }}">` — the anchor **is** the list-group-item. Bootstrap `list-group-item-action` gives the whole row a hover/focus surface and a click target that spans the full row width. The `data-opetus-implementation` and `data-period-id` markers live on this `<a>`. Repo precedent: `src/en/keywords.njk` uses the identical `<a class="list-group-item list-group-item-action ...">` pattern.
- Primary interaction: the linked implementation title (semesterLabel or academicYear fallback) — no separate primary-pill button.
- Meta right-aligned: `academicYear · Periodi X · credits · teaching unit`, only rendering the parts that exist in the local frontmatter. Inline `<span aria-hidden="true"> · </span>` separators are hidden from screen readers so the meta reads as a natural comma-less list.

Section header:

- `.d-flex.flex-wrap.align-items-start.justify-content-between.gap-3.mb-3` with h2 + description + count badge — mirrors thesis-archive-table section header shape.

No new CSS file. Zero new selectors. All styling reuses existing Bootstrap
utilities and previously loaded classes.

## 6. Why selected

Course grouping is the primary browsing axis, so a per-course container is
correct. Individual implementations carry limited meta and one action
(open the course page), so a full card each is over-scaled. The
presentation-context-group linked-row pattern is the site's established
"group-first" primitive; the thesis-archive-table wrapper is the site's
established "compact card containing tabular data" primitive. Combining
them keeps `/opetus/` visually inside the jarilaru.fi vocabulary while
letting it scale as more historical implementations are added.

## 7. Density changes (before → after)

| Aspect | Before | After |
|---|---|---|
| Wrapper per course | `.card.shadow-sm` + `.card-body.p-4.p-lg-5` | `.card.shadow-sm.border-0` + `.card-body` (default padding) |
| Course heading | `h3.h4.fw-bold.mb-3` | `h3.h5.fw-bold.mb-0` (in flex row with badge) |
| Course code chip | Own row (`.d-flex.flex-wrap.gap-2.mb-4`) with single badge | Inline in course head row, one badge |
| Implementation container | `<section>` per impl inside `.vstack.gap-3` | `<a class="list-group-item list-group-item-action">` inside `.list-group.list-group-flush` — the anchor **is** the row, giving a full-width interactive target |
| Implementation heading | `h4.h5.fw-bold.mb-2` (semesterLabel as heading, then h4-style meta below, then button) | Linked semesterLabel `<span class="fw-semibold">` in one row with inline meta |
| Implementation meta | Three separate badges (creditsLabel + academicYear + Periodi) | Inline dot-separated muted text |
| Teaching-unit kicker | `<p class="text-uppercase small text-muted fw-semibold mb-2">` per impl | Inline in meta segment |
| Implementation CTA | Full-width `.btn.btn-primary.rounded-pill.px-4` per impl | Full-row interactive `list-group-item-action` link (no separate button) |
| Catalog vertical gap | `.vstack.gap-4` | `.vstack.gap-3` |
| Section header | h2 + description only | h2 + description + grammatically-agreeing count badge (`kurssi` / `kurssia`) |

Measured outcome for the current 2-course × 1-implementation catalog at
1440 × 900 viewport: the catalog container (`[data-opetus-catalog]`) is
**301 px** tall including the inter-course gap. Each implementation link
`<a>` is **952 × 64 px** on desktop and **272 × 64–128 px** on 390 px
mobile — well above the WCAG 2.5.5 Level AAA minimum of 44 × 44 CSS px.

Note: an earlier draft of this closure reported "~180 px" and the PR body
reported "~619 px". Both were wrong. The 619 figure was inflated by DOM
soup introduced by the Markdown processor wrapping the raw HTML in stray
`<p>` tags (before `templateEngineOverride` was tightened to `njk`); that
DOM soup also confused the browser's HTML5 parser into constructing extra
phantom `<a>` fixup elements. The pre-merge fixes (a) switch
`templateEngineOverride` from `md,njk` to pure `njk` so the source HTML
passes through cleanly, and (b) upgrade the implementation row from a
plain `<li>` to a full-row interactive `<a>` link. The **301 px** figure
is the measured value after those fixes.

## 8. Desktop QA (1440 × 900)

Captured to `outputs/opetus-catalog-ux-01/opetus_desktop_1440_*.png` via
`node scripts/screenshot-opetus-catalog.js`. Metrics dumped to
`outputs/opetus-catalog-ux-01/metrics.json`.

- Number of course cards visible above fold: **1** (the first `[data-opetus-course]` card sits at y = 880 px and peeks into the 900 px viewport). Once scrolled by ~one card height, both courses are visible simultaneously (`catalogHeight = 301 px < 900 px viewport`).
- Course grouping is obvious: each course renders as its own bounded card
  with courseName + courseId chip, and the implementation row sits inside
  that card's list-group.
- Implementation link geometry: `<a>` element **952 × 64 px** — the whole row is one interactive Bootstrap `list-group-item-action` surface with visible hover/focus feedback.
- Whitespace: appropriate. No repeated `p-4 p-lg-5`. Vertical rhythm
  between courses uses `gap-3` (1 rem) instead of the previous `gap-4`.
- Actions: not oversized. No repeated pill CTA per implementation. The
  primary interaction is the full-row link — matches archive-card
  precedent guidance in the playbook.
- Metadata: restrained. `2026–2027 · Periodi A · 4 op · Opettajankoulutus`
  reads as one muted line. The 410014Y row simply reads `2013–2014` because
  the historical page only carries the academic year — the meta helper
  omits absent fields rather than filling placeholders.
- Visual fit: page belongs to jarilaru.fi. Card border/radius/shadow and
  chip/badge treatment match the existing site language.

Caveat: the site-wide hero band + section header still push most of the
catalog below the initial fold. This is a site convention shared with
`/opinnaytteet/`, `/julkaisut/`, `/esitykset/`. This slice does not tune
the hero band because that would ripple beyond `/opetus/`.

## 9. Mobile QA (390 × 844)

Captured to `outputs/opetus-catalog-ux-01/opetus_mobile_390_*.png`.

- Grouping clarity: each course still renders as its own card. Course head
  wraps naturally to `courseName / courseId badge` and the implementation
  row wraps to `linked semester label / inline meta` (two-line row for
  4-meta-segment implementations; one-line row for compact ones).
- Readability: strong. Linked semester label first, inline dot-separated
  meta below on narrow widths via `flex-wrap`.
- **Touch-target usability**: the implementation link **is** the entire row
  (`<a class="list-group-item list-group-item-action ...">`). Measured
  link hit area on mobile: **272 × 128 px** (405040Y row with wrapping
  meta) and **272 × 64 px** (410014Y row). Both easily exceed WCAG 2.5.5
  Level AAA minimum (44 × 44 CSS px). Verified programmatically via
  `metrics.json` (`allLinksMeet44px: true`) and pinned by the
  `each implementation row is a full-row interactive link with sufficient
  touch area` regression test.
- Whitespace: appropriate. Both courses visible in the second viewport
  after the site hero.
- Overflow: none. `document.scrollWidth === document.clientWidth = 390`
  (verified via metrics capture).
- Hierarchy preserved on mobile: course > implementation link > meta.

## 10. Stale copy removed

Removed:

> "Tällä hetkellä julkinen kurssisivu on avattu vain yhdelle toteutukselle. Aiempien vuosien opetusmateriaaleja on selattavissa erikseen esitysten kokoelmasta."

The first sentence was already false as of OPETUS-CURATION-01B2 (two course
pages exist, not one). Any hard-coded count is fragile because it will
become false whenever another implementation ships.

Replaced with an evergreen pointer that doesn't state a count:

> "Aiempien vuosien opetusmateriaalit ovat selattavissa myös [esitysten kokoelmasta](/esitykset/)."

The section header carries a live count badge computed at build time from
`coursePages.catalog.length`. The label is grammatically robust:
`{{ N }} kurssi` when `N === 1`, `{{ N }} kurssia` otherwise. The
conditional is inline in the Nunjucks template because no shared
pluralize helper exists in the repo; the presence of both branches is
pinned by the `course count label agrees in number` regression test.

## 11. Data flow preserved

- `src/opetus/*.md` frontmatter → `src/_data/coursePages.js` →
  `coursePages.catalog` → Nunjucks SSR → `/opetus/` HTML.
- Course grouping (by `courseId`) and deterministic ordering (courseName
  ASC, then academicYear DESC, then semesterLabel, then periodId) are
  unchanged.
- `data-opetus-catalog`, `data-opetus-course`, `data-opetus-implementation`,
  `data-course-id`, `data-period-id` markers preserved.
- Canonical implementation URL (`{{ implementation.pageUrl }}`) still the
  only source of course-page URLs — no handwritten href in the landing.
- 405040Y invariant: `/opetus/teknologiatuettu-oppiminen/2026-2027-a/`
  route, `periodId: 2026-2027-a`, Peppi link, FI-only status, Presentation
  exact-implementation peer + backlink semantics all preserved.
- 410014Y invariant: `/opetus/tieto-ja-viestintatekniikka-pedagogisena-tyovalineena/2013-2014-a/`
  route and its four confirmed Presentation records unchanged.

## 12. Architecture boundaries

**AC1 remains CLOSED / GREEN / MAIN.**

Verified against reopen conditions in `docs/architecture-closure-1-0-closure-2026-08-29.md` §6:

- No new duplicate content ownership (catalog is a Nunjucks projection of local frontmatter, unchanged).
- No canonical semantics moved to browser JS.
- No Pagefind ownership change.
- No runtime JSON → HTML architecture.
- No new taxonomy.
- FI/EN parity: unchanged (FI-only).
- No public JSON contract change.
- No canonical schema change (`courseContexts[]`, `periodId` semantics, Canonical Content v1 all untouched).
- No source/landing/context semantics regression.

This is a presentation-layer redesign only.

## 13. Build + tests

Build: `npm run build:local` — exit 0.

Test batch (Playwright, static _site serve):

- `tests/opetus-catalog-ux-01.spec.js` — new: **12 tests. 12/12 green.**
  (10 original + 2 pre-merge: full-row interactive link geometry with
  WCAG 44 × 44 CSS px check, and grammar `kurssi`/`kurssia` conditional.)
- `tests/opetus-catalog-01a.spec.js` — adjacent: 4/4 green.
- `tests/opetus-ia-01.spec.js` — adjacent: 17/17 green (one test updated to
  invariant-only assertion; see §14).
- `tests/course-relation-ux-01.spec.js` — adjacent: 20/20 green.
- `tests/opetus-curation-01b2.spec.js` — adjacent: 4/4 green.

Combined batch: **57/57 green.**

## 14. Test invariant preservation notes

`tests/opetus-ia-01.spec.js` line 170 "primary CTA to course is a real SSR
link with expected text" was updated. The prior assertion required an
exact `.btn.btn-primary.rounded-pill` button per implementation with text
"Avaa kurssisivu". This slice replaces that pattern with a linked
implementation title (playbook-recommended archive-card behavior; task
§8). The renamed test "primary SSR link to the course page exists" now
asserts the invariant that actually matters — a real SSR anchor from
`/opetus/` to the course page — without pinning the specific button
styling that was replaced. The test rationale is inline in a leading
comment.

## 15. Changed files

**Modified:**

- `src/fi/opetus.md` — catalog section rewritten; `templateEngineOverride` tightened from `md,njk` to pure `njk` (matches sibling course-implementation pages under `src/opetus/`) so the source HTML passes through without markdown paragraphization; stale count copy removed; evergreen presentation pointer added; grammatically-agreeing count badge (`kurssi` / `kurssia`) in section header; implementation rows are now full-row Bootstrap `<a class="list-group-item list-group-item-action">` interactive links with `py-3` for adequate touch area.
- `tests/opetus-ia-01.spec.js` — one CTA-text assertion updated to invariant-only anchor check (see §14).

**New:**

- `tests/opetus-catalog-ux-01.spec.js` — 10 regression tests covering: SSR data flow preserved, coursePages.catalog projection consumption unchanged, canonical identity attributes preserved, both courses render as separate groups, 410014Y implementations grouped under 410014Y card, compact list-group density (no oversized presentation), stale copy removed, deterministic ordering preserved, no runtime JSON, no synthesized EN routes.
- `scripts/screenshot-opetus-catalog.js` — developer-only visual QA tool. Serves `_site/` on a local port and captures `/opetus/` screenshots at 1440×900 and 390×844. Not part of the build or CI pipeline.
- `docs/opetus-catalog-ux-01-closure-2026-09-06.md` — this file.
- `outputs/opetus-catalog-ux-01/` — desktop + mobile screenshots and metrics (developer artifacts).

## 16. Deleted / simplified

- Deleted from `/opetus/`: the per-implementation `<section>` wrapper carrying a `<h4>` heading, a three-badge row, and a `.btn.btn-primary.rounded-pill.px-4` CTA. Replaced by a single `<li.list-group-item>` row per implementation.
- Deleted from `/opetus/`: the `.d-flex.flex-wrap.gap-2.mb-4` course-code badge row (moved into the course-head flex row inline with the h5).
- Deleted from `/opetus/`: the per-implementation uppercase teaching-unit kicker (moved into inline meta segment).
- Deleted from `/opetus/`: the outdated one-implementation copy line.
- No CSS file changes. No new selectors. No new page CSS registered via `pageStyles`.

## 17. Final status

- **OPETUS-CATALOG-UX-01 = CLOSED / GREEN / READY FOR PR.**
- **Architecture Closure 1.0 = CLOSED / GREEN / MAIN.**
- **Canonical Content v1 = unchanged.**
- **OPETUS-CATALOG-01A + OPETUS-CURATION-01B2 invariants preserved.**
- **OPETUS-IA-01 invariant preserved** (real SSR link to course page).
- **COURSE-RELATION-UX-01 semantics preserved.**
- **DETAIL-UX-SEQUENCE-01 = CLOSED / DEFERRED / DOCUMENTED / MAIN.**
- **OPETUS-CURATION-01C2 explicitly NOT resumed in this slice.**
