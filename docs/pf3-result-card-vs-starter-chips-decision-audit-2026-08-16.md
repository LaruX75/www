# PF3 / Result-Card Consistency — Decision Audit

Date: 2026-08-16
Status: **NEXT PAGEFIND DISCOVERY WORKSTREAM = DECIDED / GREEN**
Mode: audit only — no source code, no Pagefind metadata, no tests added.
Related basis:
- `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md`
- `docs/pf2-shared-sisalto-facet-2026-08-16.md`
- `docs/pf2-shared-sisalto-facet-closure-2026-08-16.md`

## 1. Status

Two of the three shortlisted follow-up workstreams that PF2 explicitly
enables have been on the table:

- **A** — PF3 starter chips / "Aloita tästä" on `/tutkimus/`,
  `/esitykset/`, `/mediassa/` (PF1 §13).
- **B** — Result-card consistency across Pagefind result surfaces
  (PF1 §14).
- **C** — PF-PERF1 Pagefind startup performance audit (PF1 §17).

This audit picks **B — result-card consistency** as the next
workstream. A and C are documented as deliberately deferred, with
reasons.

## 2. Repository state

- Branch: `main`
- HEAD before this commit: `3c14af6b9f126d7eb30135cdb1e591db4e9c2f23`
  (`docs: close PF2 shared Sisältö facet rollout`).
- `origin/main` in sync with local main.
- Worktree clean for closure scope; only pre-existing local
  `.cache/api-fallback/*.json` remain dirty and are not staged.
- All PF2 artifacts present on main:
  - `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md`
  - `docs/pf2-shared-sisalto-facet-2026-08-16.md`
  - `docs/pf2-shared-sisalto-facet-closure-2026-08-16.md`
  - `docs/data/pf2-shared-sisalto-facet-audit-2026-08-16.json`
  - `scripts/audit-pf2-sisalto-facet.js`
  - `tests/pf2-sisalto-facet.spec.js`
- PR #91 closed and merged (merge commit `18deec80`).
- Post-merge workflows on `18deec80`: all three green
  (Build and Deploy, Generate OG Images, Accessibility and navigation
  tests).

## 3. Background: PF1 → PF2 sequence

- **F4** closed with Research contextual Find & Explore rolled out;
  Research population 317 (publications 53 + theses 169 + writings
  62 + presentations 33).
- **M2** brought media into the Pagefind / Find & Explore
  architecture and discovered Pagefind's site-wide
  `data-pagefind-body` gate (M2 closure §10).
- **PF1** audited the user-facing discovery model site-wide, decided
  that only media exposed a real user-facing content-family label,
  and recommended a shared `Sisältö:*` Finnish vocabulary before
  starter chips or result-card work.
- **PF2** landed that vocabulary as a Pagefind filter across all
  five families' detail records (750 records total). No canonical
  model change, no data-pagefind-body, no Research semantic change.

## 4. Current discovery model after PF2

Verified against the built main HEAD `3c14af6b`:

- Every Pagefind-indexed detail record carries exactly one
  `Sisältö:*` value (`Julkaisut` | `Opinnäytteet` | `Esitykset` |
  `Kirjoitukset ja puheenvuorot` | `Mediassa`).
- Global Pagefind can filter results by `Sisältö:*` alongside
  `Kieli:Suomi | English`.
- Page-specific Find & Explore mounts on `/tutkimus/`,
  `/kirjoitukset/`, `/opinnaytteet/`, `/julkaisut/` share
  `src/js/find-explore.js` and render Pagefind hits into a common
  `data-find-explore-results` list.
- `/esitykset/` uses `src/js/presentations-page.js`, its own runtime
  driven by `/data/presentations-page.json`, rendering
  `article.presentation-archive-card` cards. Not on the Find &
  Explore runtime.
- `/mediassa/` uses its own inline runtime (from M2), rendering
  `article.media-archive-card` cards from `/data/media.json`. Not
  on the Find & Explore runtime.
- Cross-check: `_site/*/index.html` shows result-card HTML shapes
  differ per family (see §9).

Result: users can now filter by content family, but the cards those
results render into still look different depending on which archive
or global-search view they came from.

## 5. Candidate A: starter chips

PF1 §13 recommendation, narrow:

- Applies only to `/tutkimus/`, `/esitykset/`, `/mediassa/`.
- Chips set an existing filter or topic preset; never trigger
  automatic search on page load; never introduce a second query
  model.
- Suggested labels: Research (`Tekoäly`, `Opettajankoulutus`,
  `Koulutusteknologia`), Presentations (`AI literacy`,
  `Koulutusteknologia`, `Opettajankoulutus`), Media (`Lehtijutut`,
  `Videot`, `Avoin tiede`, `Tekoäly ja koulutus`).

Assessment:

- Utility: nice-to-have first-touch shortcut on 3 pages.
- Implementation risk: moderate — must wrap **existing** filters
  cleanly on three different runtimes (Find & Explore for
  `/tutkimus/`, presentations-page for `/esitykset/`, inline
  media runtime for `/mediassa/`). Risk of divergent
  implementations if the three runtimes each get their own chip
  wrapper.
- Semantic risk: low if PF1's "never a second query model" rule is
  respected.
- Reuse across families: **only 3 pages benefit**; publications and
  theses gain nothing.
- Depends on further vocabulary work? Chip labels are per-page;
  Research and Presentations chips would want topic labels aligned
  to the same source of truth, but PF2 did not deliver that.
- Sisältö amplification: **none direct** — chips would set
  page-specific filters, not the new `Sisältö:*` filter that PF2
  just landed globally.

## 6. Candidate B: result-card consistency

PF1 §14 recommendation, narrow:

Minimal shared result-card vocabulary:

- visible content-family label (now trivially available via
  `Sisältö:*` from PF2)
- year or date
- one secondary metadata line
- local vs external cue when relevant
- short description / snippet when available

Assessment:

- Utility: applies to **every** Pagefind result on **every** page —
  global `/haku/`, `/en/search/`, `/tutkimus/`, `/kirjoitukset/`,
  `/opinnaytteet/`, `/julkaisut/`. Amplifies PF2 directly: users
  who filter by `Sisältö:Mediassa` should visually see "Mediassa"
  on the result card; today they don't.
- Current inconsistencies visible in
  `src/js/find-explore.js`:
  - `renderPublicationResult` (publications) already has badges
    (peer-reviewed, open-access, JUFO, citations), source link,
    citation button, structured metadata.
  - All other kinds fall through to a bare
    `find-explore-result` template (title + meta strip + excerpt).
    Theses, writings, and presentations shown in Research get this
    thin shape.
  - No family currently prints a visible content-family label on
    the Pagefind result card, despite PF2 emitting it as a filter.
  - Presentations archive and media archive render their own SSR
    cards (`presentation-archive-card`, `media-archive-card`) with
    bespoke vocabularies — outside the Find & Explore runtime.
- Implementation risk: low–moderate. Two paths:
  - **Narrow**: only touch `src/js/find-explore.js` and add a
    small shared header showing the `Sisältö:*` value and a
    consistent secondary meta line for all non-publication kinds.
    Leaves archive-SSR cards alone.
  - **Broad**: unify the archive-SSR card vocabulary
    (presentation-archive-card / media-archive-card) to match. Much
    larger; NOT recommended for the first result-card checkpoint.
- Semantic risk: low. Cards are visual; no data-model change.
- Reuse across families: **all five families** benefit
  simultaneously.
- Depends on further vocabulary work? No — PF2 supplied the
  content-family label; year and language are already in Pagefind
  meta on every family's records.
- Sisältö amplification: **direct**. This is the reason PF1 §14
  said "That is enough to unify meaning without forcing one card
  component in PF2." — meaning the intended sequel to PF2.

## 7. Candidate C: PF-PERF1

PF1 §17 recommendation, deferred:

Assessment:

- No concrete performance regression is documented anywhere on
  `main` or in the PF1/PF2 evidence set. PF2 preserved the plain-
  main Pagefind index size (`fi:1163 / en:346`), so no index
  bloat.
- Post-merge deploy workflow on `d4cde07e` (M2) and `18deec80`
  (PF2) both completed in normal time.
- No accessibility regression, no failing gate.
- Nothing in `docs/pf1*.md`, `docs/pf2*.md`, or
  `docs/m2*.md` cites a startup-slowness incident.
- Should stay queued; jump only if a concrete slow-startup
  incident lands.

## 8. Comparison table

| Criterion | A: Starter chips | **B: Result cards** | C: PF-PERF1 |
| --- | --- | --- | --- |
| 1. User benefit now that `Sisältö:*` exists | moderate on 3 pages | high on every page | none direct |
| 2. Implementation risk | moderate (3 runtimes) | low–moderate (one shared renderer) | unknown until measured |
| 3. Semantic risk | low if strict | low | low |
| 4. Pagefind performance risk | very low | very low | this IS a perf audit |
| 5. Reuse across families | 3 / 5 pages | 5 / 5 families | site-wide but not user-visible |
| 6. Risk of confusing Research boundaries | needs care on `/tutkimus/` | none — visual only | none |
| 7. Writings impact | none direct | writings cards gain visible family label | none |
| 8. Depends on further vocabulary work | Yes for chip labels alignment | No — PF2 supplied it | No |
| 9. Can be implemented narrowly | Yes if scoped to filter presets | Yes if scoped to Find & Explore renderer | Yes if scoped to measurements |
| 10. Preserves PF2 behavior | Yes | Yes | Yes |

## 9. Page-by-page observations

Result-card shapes today (spot-checked from built HTML):

| Route | Archive-SSR card | Find & Explore result card |
| --- | --- | --- |
| `/tutkimus/` | `article.card border-0 shadow-sm h-100` (opening set) | shared `find-explore-result` (bare title+meta+excerpt) |
| `/julkaisut/` | Find & Explore mount only | `find-explore-result--publication` (rich: badges + source + citation) |
| `/opinnaytteet/` | `article.card border-0 shadow-sm h-100 thesis-curated-card` | shared `find-explore-result` (bare) |
| `/kirjoitukset/` | `article.card h-100 border-0 shadow-sm` | shared `find-explore-result` (bare) |
| `/esitykset/` | `article.presentation-archive-card` (bespoke) | not on the Find & Explore runtime |
| `/mediassa/` | `article.media-archive-card`, `article.media-feature-primary`, `article.media-feature-small` | not on the Find & Explore runtime |

Conclusion: the Find & Explore renderer has two shapes — a rich
publication card and a bare "everything else" card. Publications
already show badges, source link, citation. Everything else shows
title + meta + excerpt only. None of them prints a visible
content-family label — even though PF2 provides one for free.

## 10. Writings-specific note

- Writings-only Find & Explore results render as bare cards; users
  now filter by `Sisältö:Kirjoitukset ja puheenvuorot` but the
  result card does not visibly say so.
- Publication-backed writings (56 pages) show `Sisältö:Julkaisut`
  and get the rich publication card. This is the correct behavior
  per PF2's publications-first resolver priority, but the visual
  contrast between the two "writings" flavors is stark today. A
  visible content-family label on the card would make that
  contrast intelligible to a user.
- Writings segmentation (should `scientificPublication` remain
  visible inside `/kirjoitukset/`?) is orthogonal and stays
  deferred as PF1 already noted.

## 11. Research-specific note

- `/tutkimus/` uses the shared Find & Explore contextual runtime.
- Research results currently fall through to the bare card renderer
  because each result is scoped to one of publications / theses /
  writings / presentations. Publication hits get the rich card;
  other kinds get the bare one. Card consistency would give every
  Research hit the same visible family label and secondary meta
  line — a genuine improvement without changing Research
  membership.
- Chips on `/tutkimus/` would give a topic-first entry point but
  would not fix the visible card divergence.

## 12. Media-specific note

- `/mediassa/` doesn't render Find & Explore result cards; it
  renders its own bespoke archive cards from `/data/media.json`.
- Global Pagefind search results that filter to `Sisältö:Mediassa`
  come back through the site-wide search UI (`/haku/`,
  `/en/search/`), not through the media archive UI.
- Card consistency on the Find & Explore side does not force a
  media-archive redesign. That keeps the change safely narrow.
- Media outlet strings still need normalization before becoming a
  user-facing facet — unchanged, still deferred.

## 13. Performance note

- No concrete PF-PERF1 evidence surfaced in this audit. Pagefind
  index size on `3c14af6b` remains `fi:1163 / en:346` (matches
  plain-main baseline). No recent workflow ran longer than the
  historical baseline; the last three deploys on `main`
  (`d4cde07e`, `18deec80`, `3c14af6b`) all completed within
  normal window.
- Result-card work does not add new fetches, workers, or
  Pagefind index entries — it only re-templates already-fetched
  results.
- Result-card work will NOT delay a legitimate PF-PERF1 investigation
  if one becomes urgent.

## 14. Decision

**NEXT WORKSTREAM = RESULT-CARD CONSISTENCY**

Reasons:

- PF2 just supplied every Pagefind result with a `Sisältö:*` label.
  Card consistency is the sequel PF1 §14 explicitly called out for
  after PF2 — it converts the new invisible filter into a visible
  cue on the card.
- Card consistency benefits every family and every result surface
  simultaneously; starter chips would benefit only 3 pages.
- The change lives inside one renderer (`src/js/find-explore.js`)
  in its narrow form. Archive-SSR cards
  (`presentation-archive-card`, `media-archive-card`) can stay
  untouched to keep the checkpoint small.
- Semantic risk is minimal: no Pagefind metadata change, no
  Research semantic change, no writings restructuring, no
  `data-pagefind-body` change.
- PF2's shared reverse gate `noHtmlDetailUsesPagefindBody` and M2's
  `noDetailUsesPagefindBody` are protected by not touching detail
  templates.
- No further vocabulary work is required first; `Sisältö:*` is
  already the visible label.
- No concrete performance regression exists to justify jumping
  PF-PERF1.

NOT NEXT:

- **A — starter chips**: still valuable but per PF1 §13 it lives
  on only three pages and requires touching three different
  runtimes. Deferred until the result-card renderer has a shared
  header users can build chip semantics around. Doing chips first
  would decorate three pages with new UI while the underlying
  result-card divergence remains.
- **C — PF-PERF1**: no incident evidence, no measured regression.
  Result-card work does not add measurable Pagefind cost.
  PF-PERF1 stays queued and jumps only if a real slow-startup
  event lands.

## 15. Recommended next implementation prompt outline

Suggested next prompt (do not run here):

> **PF3 — RESULT-CARD CONSISTENCY (FIND & EXPLORE)**
>
> Add a visible content-family header line (from `Sisältö:*`) plus a
> single shared secondary meta line to every Find & Explore result
> across `/tutkimus/`, `/kirjoitukset/`, `/opinnaytteet/`,
> `/julkaisut/`, and the global search pages. Preserve the
> publication-specific badges / source / citation buttons. Do not
> touch `src/js/presentations-page.js`, the presentations archive,
> or the media archive. Do not add `data-pagefind-body`. Do not
> change any Pagefind filter emission. Include a browser smoke that
> verifies each family's result shows the correct `Sisältö:*` label
> visibly.

Suggested audit gates for that follow-up:

- Every non-empty `find-explore-result` in each mount renders the
  content-family label from `Sisältö:*`.
- Publications still render badges + source + citation.
- No detail-page template modified.
- No Pagefind index size change.
- Media / presentations archive-SSR unchanged.
- F4 Research population still 317.

## 16. Explicitly out of scope

- Starter chips (PF3, still queued).
- Result-card refactor for the presentations archive
  (`presentation-archive-card`) — a bespoke component that would
  merit its own checkpoint.
- Result-card refactor for the media archive
  (`media-archive-card`) — same.
- Writings segmentation (`scientificPublication` visibility inside
  `/kirjoitukset/`).
- Media outlet / source normalization.
- PF-PERF1 Pagefind startup performance work.
- Research semantic changes.
- Adding `Sisältö:Tutkimus` or any other new content-family value.
- Introducing `data-pagefind-body` on any family.
