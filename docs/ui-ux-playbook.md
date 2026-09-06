# Jarilaru.fi UI/UX Playbook

Status: **ACTIVE / REPO-GROUNDED GUIDANCE**

## Purpose and scope

This playbook records the visual language already implemented on jarilaru.fi.
It is the required decision aid for significant layout, component, archive,
landing, catalog, detail, or navigation work. It is not a generic design guide
and it does not prescribe universal markup for all content domains.

It covers visual hierarchy, cards, tables, lists, grids, spacing, typography,
CTAs, metadata, responsive composition, and information density. It does not
change Canonical Content v1, Pagefind, public JSON, runtime data ownership,
domain semantics, context membership, source/landing semantics, or AC1. AC1
remains `CLOSED / GREEN / MAIN`.

## Visual language summary

Jarilaru.fi is intentionally card-heavy, Bootstrap-based, and editorial rather
than dashboard-like. It combines soft bordered surfaces, restrained shadows,
rounded corners, blue accent treatment, muted metadata, and strong content
headings. Cards are a family, not one fixed component: a home focal panel, a
route card, a presentation archive card, and an archive table row serve
different density needs while remaining recognizably part of the same site.

The recurring reading order is:

```text
what is this -> primary content -> primary action -> essential metadata
-> relationships/context -> orientation
```

Use the existing Bootstrap utility vocabulary first (`py-*`, `p-*`, `g-*`,
`vstack`, `row`, `col-*`, `card`, `badge`, `btn`) and page-specific classes
only when an existing page pattern needs a documented variant.

## Precedent-first rule

Before implementing a significant new layout, an agent **MUST** write this in
its task record or PR description:

```text
VISUAL PRECEDENTS

1. <repo path / route>
   - what is reused

2. <repo path / route>
   - what is reused
```

Two precedents are a minimum. If fewer than two suitable precedents exist,
write `NO SUITABLE EXISTING PRECEDENT` and justify the new pattern. Do not
introduce a one-off component language, typography scale, shadow, border
treatment, or button style merely to solve a local layout problem.

## Repo evidence and precedent index

The audit covered 14 representative surfaces: home, publications,
presentations, theses, Kynästä/writings, media, research, university work,
portfolio, CV, teaching, presentation detail, publication detail, and thesis
detail.

| Pattern | Repo path | Representative route/page | Current classes/components | Use case | Density | Responsive behavior | Reuse status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home focal panel and KPI cards | `src/index.njk`, `src/css/home-page.css`, `src/css/modules/_components.css` | `/` | `.home-hero-panel`, `.home-hero-kpi-grid`, `.home-impact-grid` | Primary identity, selected routes, counts | Low-medium focal | KPI grid has two columns; impact grid reduces from four columns | PRIMARY PRECEDENT |
| Route cards | `src/_includes/presentations/route-card.njk`, `src/css/presentations-page.css` | `/esitykset/` | `.presentation-route-grid`, `.presentation-route-card` | Equal-weight browse routes | Medium | Four columns collapse through page media queries | PRIMARY PRECEDENT |
| Presentation archive cards | `src/_includes/presentations/archive.njk`, `src/_includes/presentations/result-card.njk`, `src/css/presentations-page.css` | `/esitykset/#kaikki-esitykset` | `.presentation-archive-grid`, `.presentation-archive-card` | Repeatable record with thumbnail, metadata, action | Compact-medium | Three columns reduce; mobile disclosure limits overload | PRIMARY PRECEDENT |
| Presentation context groups | `src/_includes/presentations/context-group-card.njk`, `src/css/presentations-page.css` | `/esitykset/` | `.presentation-context-groups`, linked rows | Group-first browsing | Medium | Grid collapses; remaining entries use `<details>` | SECONDARY PRECEDENT |
| Publication entry cards | `src/julkaisut.njk`, `src/css/publications-page.css` | `/julkaisut/` | `.publication-entry-grid`, `.publication-entry-card`, `.publication-nav-card` | Curated routes, spotlight, analytics | Medium | Mobile path is horizontally scrollable | PRIMARY PRECEDENT |
| Publication archive table | `src/_includes/publication-archive-groups.njk`, `src/css/publications-page.css` | `/julkaisut/` archive | `.publication-archive-table` | Comparative bibliographic records | Dense | Min-width columns and horizontal mobile shell | PRIMARY PRECEDENT |
| Thesis archive table and stats | `src/opinnaytteet.njk`, `src/_includes/thesis-archive-table.njk`, `src/css/theses-page.css` | `/opinnaytteet/` | `.thesis-stat-card`, `.thesis-archive-table`, pager | High-volume historical catalog | Dense | Mobile scroll path and compact pager | PRIMARY PRECEDENT |
| Kynästä grouped rows | `src/kynasta.njk`, `src/_includes/writings-curated-list.njk`, `src/css/kynasta-page.css` | `/kynasta/` | Curated list/group markup | Short hierarchical entries | Compact | Natural text-first stacking | PRIMARY PRECEDENT |
| Media result surface | `src/_includes/media-item.njk`, `src/css/media-page.css` | `/mediassa/` | Shared detail hero, metadata, source CTA | Time-based media records | Medium | Metadata/action flex-wraps | SECONDARY PRECEDENT |
| Research and university-work panels | `src/fi/tutkimus.md`, `src/_includes/training.njk` | `/tutkimus/`, university-work routes | Bootstrap cards and grouped sections | Thematic explanatory content | Medium | Bootstrap grids stack | SECONDARY PRECEDENT |
| Portfolio/CV evidence | `src/_includes/portfolio.njk`, `src/_includes/portfolio-list.njk`, `src/fi/cv.md` | `/portfolio/`, `/cv/` | Lists, sections, badges | Evidence and chronology | Compact-medium | Text-first stacking | PRIMARY PRECEDENT |
| Teaching catalog current state | `src/fi/opetus.md` | `/opetus/` | `.vstack.gap-4`, `.card.shadow-sm`, `.card-body.p-4.p-lg-5` | Course implementation catalog | Currently sparse and oversized | One-column stack | AVOID COPYING as density precedent; retain semantics only |
| Shared detail pages | `src/_includes/detail-hero.njk`, `src/_includes/content-context-sidebar.njk`, `src/css/modules/_global.css` | presentation, publication, thesis, writing, media detail | `.content-detail-hero`, `.content-detail-main`, relation sidebar | Focal content item plus context | Low-medium | Hero grid becomes one column; flex metadata wraps | PRIMARY PRECEDENT |

## Cards

Cards are a legitimate and frequent site language. Do not respond to one
oversized catalog card by abandoning cards. Ask instead: **is this the right
card type, size, and density?**

| Type | Existing examples | Padding / density | CTA | Do not use for |
| --- | --- | --- | --- | --- |
| Focal card | `.home-hero-panel`, `.content-detail-card` | `1.2rem` to `1.65rem` or purposeful large padding; rare | One primary action or small action group | Repeated archive items |
| Route card | `.presentation-route-card`, `.publication-nav-card` | About `p-4`; medium density | Whole-card link or outline CTA | Dense comparison |
| Archive card | `.presentation-archive-card` | `1.05rem 1.05rem 1rem`; thumbnail-led | Compact action or title link | A single value without identity |
| Compact metadata card | KPI, stat, context panel | `0.75rem` to `1rem`; concise label/value | Usually none | Long prose |
| Support card | `.content-detail-side-card` | Medium, secondary context | Contextual link only | Competing with the main object |
| Stat/KPI card | `.home-hero-kpi`, `.thesis-stat-card` | `0.75rem 1rem`; number + label | Optional value link | Repeated catalog data |

Archive cards already protect density: presentation titles clamp at three lines,
copy at four lines, chips are compact, and actions sit after content. Reuse
those constraints for visually browsable archives.

## Tables, lists, and rows

Tables are first-class site patterns, not a failure to make cards. Use them
when attributes align naturally in columns and scanning year, author, title,
type, status, or source is the task. Publications and theses establish the
main precedent: top-aligned cells, about `0.6rem` to `0.65rem` vertical cell
padding, linked titles, grouped sections where useful, and explicit column
widths/min-widths.

On small screens preserve comparison semantics with the established horizontal
scroll shell and meaningful minimum widths. A table should retain headers,
readable linked cells, and concise rows; it should not become a card grid
disguised as a table.

Use a list or linked row where hierarchy, parent-to-child grouping, chronology,
or quick scanning is more important than individually framed identity. Kynästä
curated lists, presentation context-group linked rows, and archive-table rows
are the main precedents. Group before choosing a component: identify page,
group, item, metadata, and action first.

## Grids

Use grids for parallel peers rather than vertical chronology. Existing values
are deliberate and modest: presentation route cards use four equal desktop
columns with `1rem` gaps; presentation archive cards use three columns with
`1rem` gaps; route support and analysis links use two columns; home impact
cards use four columns with `0.75rem` gaps. Bootstrap `row g-4` is the normal
medium route-card grid.

On narrow widths, grids stack or reduce columns. Do not let a mobile stack
merely become a very tall desktop column. When preserving a comparison row is
more useful than stacking, use the established publication/thesis scroller.

## Typography

| Role | Current expression | Guidance |
| --- | --- | --- |
| Page hero title | Bootstrap `.display-6.fw-bold` or `.content-detail-title` | Page-level identity only |
| Detail hero title | Heading font, `clamp(2.4rem, 6vw, 4.4rem)` | Rare, focal content only |
| Section title | `.h3.fw-bold`, `.presentation-section-title` | Divide meaningful groups |
| Route/card heading | `.h5.fw-bold`, `.presentation-route-title` | Keep headings scannable |
| Archive-card title | `Bree Serif`, `1.12rem`, 1.2 line-height | Compact clamped repeated title |
| Eyebrow/kicker | Uppercase, `0.74rem` to `0.78rem`, weight 700-800, `0.08em` tracking | One meaningful classifier |
| Metadata/support copy | Muted, `0.82rem` to `0.9rem` | Secondary to title/action |

`Bree Serif` appears in archive-card and editorial heading treatments. It is
not a license to introduce another heading system. Preserve the existing
heading font variable and Bootstrap weight/size patterns.

## Spacing and density

Prefer existing Bootstrap and component values; do not create a token system.

| Context | Existing range / precedent | Guidance |
| --- | --- | --- |
| Page sections | `py-5` on page bands | Distinct page sections, not each list item |
| Focal panel | `1.2rem` to `1.65rem`, sometimes large Bootstrap padding | Rare focal content |
| Route card | Usually `p-4` | Medium content and clear route action |
| Compact archive card | About `1rem` body padding | Repeated catalog browsing |
| Grid gap | `0.75rem` or `1rem` | Default peer-card separation |
| Detail hero grid gap | `clamp(1.5rem, 4vw, 3rem)` | Focal split layout only |
| Metadata gap | `0.4rem` to `0.65rem` | Dense wrapping chips/meta |
| CTA/action gap | `0.45rem` to `0.85rem` | Only genuinely distinct actions |

Large `p-4 p-lg-5` is **not** a default for repeated catalog items. Compact
catalog entries should show several records in a desktop viewport. A small
amount of metadata must not consume half a desktop viewport.

## Buttons, CTAs, badges, and metadata

Use a filled `.btn-primary.rounded-pill` for the one clear primary action:
opening an external source, a course page, or another intentional focal action.
Use `.btn-outline-primary.rounded-pill` for a secondary route. Plain linked
titles and inline links are preferable when the user is simply scanning an
archive.

Do not put oversized pill CTAs on every repeated entry. Do not turn site
orientation into a peer primary CTA. The detail UX audit separates direct
content action, relationships, discovery, and site orientation; preserve that
distinction.

Use badges/chips for high-signal short classifiers: content type, year, course
code, status, route, or source. Existing chips use compact padding (`0.25rem
0.55rem` to `0.42rem 0.72rem`), rounded pills, subdued backgrounds, and
muted/primary colors. If a value needs a sentence, table cell, definition list,
or supporting copy, it is not a badge. Avoid badge overload.

## Responsive behavior

- Use Bootstrap rows/columns and existing CSS grid breakpoints before a bespoke layout.
- Collapse peer grids to fewer columns or one column; do not retain narrow cards.
- Preserve comparative tables with horizontal scrolling and minimum widths.
- Detail hero grids become single-column and metadata/actions wrap through flex.
- Presentation archive mobile disclosure is valid when secondary material would dominate initial context.
- Keep archive cards compact after stacking. Mobile does not justify turning every result into a hero.

## Detail pages

The shared detail precedent is `detail-hero.njk` plus
`content-context-sidebar.njk`: recognisable identity, optional source action,
essential metadata, primary prose, direct relationships, discovery/context,
then orientation. `.content-detail-hero` uses a subtle blue radial/linear
surface; focal cards use a `1.45rem` radius and restrained shadow.

Details may use more whitespace than archives because one item is focal. They
must not duplicate card-within-card layers without a distinct semantic purpose.
Preserve SSR-first links, clear source action labels, and relationship sections
as direct context rather than decorative metadata.

## Landing, archive, and catalog pages

Landing pages may use focal panels, route cards, and KPI/stat cards because
they direct people among sections. Archive and catalog pages must prioritize
scanability, record count above the fold, filters, grouping, and concise
metadata. Publications and theses prove that dense tables belong to the site;
presentations prove that visually browsable records can be compact cards.

The current `/opetus/` catalog preserves semantic grouping but is not a density
precedent: repeated `p-4 p-lg-5` cards, large vertical gaps, and a full pill
CTA are too spacious for a growing implementation catalog. Do not fix it in
this playbook slice.

## Component decision matrix

| Choose | When | Existing precedent |
| --- | --- | --- |
| CARD | Item has identity, meaningful metadata, and action; grouping improves comprehension | Route and presentation archive cards |
| COMPACT CARD | Repeated entry with limited metadata and many scan targets | `.presentation-archive-card` |
| TABLE | Records share comparable attributes and column scanning matters | Publication and thesis archives |
| LIST / ROW | Hierarchy or short grouped entries dominate | Kynästä lists, context rows |
| GRID | Parallel equal-weight routes/options support visual browsing | Route, analysis, and archive grids |
| HERO / PANEL | One page-level focal item needs emphasis | Home panel, detail hero |

Shared component language does not mean shared component size. Use the smallest
existing pattern that preserves hierarchy and readability.

## Anti-patterns

- Giant full-width cards for tiny amounts of repeated metadata.
- Defaulting repetitive catalog/archive items to `p-4 p-lg-5`.
- One non-focal record consuming half a desktop viewport.
- Card inside card without a meaningful parent/child distinction.
- Oversized or duplicated CTAs in repetitive lists.
- Badge overload that obscures title, date, and action.
- Empty vertical space used as a substitute for hierarchy.
- Treating every item as a hero.
- Plain-text fallback that abandons a suitable established table, row, card, or grid.
- New CSS where an existing Bootstrap/repository pattern resolves the need.
- Using a card merely because the site uses cards, without matching its density and job.
- Treating desktop as a stretched mobile stack.

## Visual QA checklist

For significant layout work, green tests alone are insufficient. Before a PR,
capture and inspect screenshots at:

- Desktop: approximately `1440px` viewport.
- Mobile: approximately `390px` viewport.

For archive, catalog, and landing changes also inspect above-the-fold record
density, repeated-item height, total vertical rhythm, and visible item count
before scrolling. Report screenshot paths, viewport sizes, and actual visual
findings in the PR or task report.

## Agent implementation checklist

Before implementation:

- [ ] Checked current main.
- [ ] Read newest relevant docs.
- [ ] Identified authoritative content source.
- [ ] Identified at least two visual precedents.
- [ ] Chosen component type from content hierarchy.
- [ ] Checked information density.
- [ ] Checked desktop layout.
- [ ] Checked mobile layout.
- [ ] Reused existing spacing, typography, and button conventions.
- [ ] Avoided a new one-off component language.
- [ ] Considered what can be removed.

Before PR:

- [ ] Build/tests green.
- [ ] Desktop screenshot reviewed.
- [ ] Mobile screenshot reviewed.
- [ ] No excessive vertical whitespace.
- [ ] Repetitive items are appropriately compact.
- [ ] Page visually belongs to jarilaru.fi.
- [ ] Accessibility preserved.
- [ ] FI/EN parity checked where applicable.

## Recommended next bounded UX slice

Recommend **OPETUS-CATALOG-UX-01** as the next bounded slice, without
starting it here. It should preserve the existing SSR catalog semantics and
use these precedents:

1. `src/_includes/thesis-archive-table.njk` and `src/css/theses-page.css` for
   dense catalog scanning with responsive table overflow.
2. `src/_includes/presentations/result-card.njk` and
   `src/css/presentations-page.css` for compact metadata-constrained cards.
3. `src/_includes/presentations/context-group-card.njk` for group-first linked
   rows between a parent course and implementations.

The future slice must choose compact cards, grouped rows, or a table based on
the actual catalog shape. It must not merely restyle the current spacious card.
