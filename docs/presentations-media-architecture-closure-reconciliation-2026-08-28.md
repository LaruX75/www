# Presentations + Media Architecture Closure Reconciliation

Date: 2026-08-28
Status: `RECONCILIATION` — no production code changed.

This document does not re-audit Presentations or Media. It reconstructs the
real current state of both workstreams from repository evidence, classifies
every earlier finding, and recommends exactly one next implementation
package. It supersedes the branch-local
`docs/presentations-ssr-closure-audit-2026-08-24.md` as the primary
Presentations planning document, because the audit's recommended Slice 1 and
Slice 2 have already merged to `main`.

## 1. Repository truth

- Worktree: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Branch: `audit/presentations-ssr-closure`
- HEAD (post-rebase): `efe6aa0b38dbc3a5facbb9ac26f050f0036b2c87`
- `origin/main` HEAD: `c8d1fcb037b04a0a38c299bdd4efc6ac8c55c710`
- Ahead / behind vs `origin/main`: `1 / 0`
- `git status`: clean apart from
  - `.cache/api-fallback/crossref-enrichments-v1.json`
  - `.cache/api-fallback/jufo-enrichments-v1.json`

The branch was 1 commit ahead / 86 commits behind at the start of this
reconciliation and was rebased onto `origin/main` after stashing the two
auto-generated `.cache` files. The stash was restored unchanged; the cache
files are excluded from any commit that comes out of this task. Only local
docs commit on this branch is the earlier `docs: add presentations SSR
closure audit`.

## 2. Docs and commits consulted

Foundation and roadmap:

- `docs/site-architecture-closure-roadmap-2026-08-20.md`
- `docs/canonical-content-v1-closure-2026-08-12.md`

Presentations chain:

- `docs/presentations-ssr-closure-audit-2026-08-24.md` (this branch)
- `docs/presentations-ssr-p1-implementation-2026-08-25.md`
- `docs/pf5-g2-presentations-pagefind-projection-2026-08-24.md`
- `docs/find-explore-presentations-f3c-closure-2026-08-15.md`
- `docs/f4-r3-presentations-research-rollout-2026-08-15.md`
- `docs/search-pagefind-index-hygiene-hotfix-2026-08-25.md`
- `docs/o1-widening-presentations-media-implementation-2026-08-21.md`
- `docs/o1-detail-orientation-closure-2026-08-21.md`

Media chain:

- `docs/m1-media-pagefind-compatibility-audit-2026-08-15.md`
- `docs/m2-media-find-explore-closure-2026-08-16.md`
- `docs/m2-media-pagefind-find-explore-2026-08-15.md`
- `docs/pf5-g3a-media-result-enrichment-2026-08-26.md`

Shared PF5 / discovery UI (context):

- `docs/pf5-a2-result-list-semantics-2026-08-25.md`
- `docs/pf5-a3a-content-type-single-select-2026-08-26.md`
- `docs/pf5-a3b-facet-availability-presenter-2026-08-26.md`
- `docs/pf5-g1-shared-presenter-convergence-2026-08-23.md`

Live source:

- `src/js/presentations-page.js` (327 LOC)
- `src/fi/mediassa.njk` (inline `renderCard()` at line 371 and
  `ContentEngine.query('FindExplore:media')` at line 328)
- `src/en/media.njk` (SSR, no hydration)
- `src/_data/presentationsPage.js` (1508 LOC)
- `src/_includes/presentations/source-group-content.njk` (196 LOC)
- `src/_includes/presentations/*.njk`
- `src/_includes/media-item.njk`
- `src/_utils/contentPresets.js`

Merged main-only commits since the 08-24 audit that materially change the
picture:

- `311f7dca` feat: render presentation source sections at build time (PR #148, 2026-08-24)
- `6bfeec8d` fix: keep presentation source archive open by default
- `4b3ba2f7` fix(search): stop presentation pipe-delimited metadata leaking into Pagefind excerpts (PR #149)
- `1daf6b38` feat: project presentations Pagefind metadata (PR #138)
- `e6e6199f` (PR #155) feat(search): enrich media results with metadata and thumbnails
- `pf5/a3a`, `pf5/a3b`, `pf5/a3b-facet-presenter-ui` — cross-cutting
  discovery-UI hardening

## 3. Presentations workstream chronology

1. **F3C — Presentations Find & Explore** (`find-explore-presentations-f3c-closure-2026-08-15.md`) — CLOSED / GREEN / MAIN.
2. **F4-R3 — Presentations Research rollout** (`f4-r3-...-2026-08-15.md`) — CLOSED / GREEN / MAIN. Research context comes only from canonical `contexts`.
3. **Canva Content Pipeline v4.5** (auto-memory) — CLOSED 2026-08-11.
4. **SSR closure audit** (`presentations-ssr-closure-audit-2026-08-24.md`) — this branch, `REDUCE`. Recommended Slice 1 (source sections + featured), Slice 2 (year/topic options), and DEFERRED Slice 3 (archive card consolidation).
5. **SSR-P1 implementation** (`presentations-ssr-p1-implementation-2026-08-25.md`) — MERGED as PR #148 (2026-08-24). **Slice 1 and Slice 2 both landed in a single PR.** Removed 5 client-side HTML formatters, reduced `presentations-page.js` from 616 → 327 LOC, projected `sourceSections.fi/en`, `filterYears`, and `filterTopics` from the build model. FI archive is now open by default; SSR source sections + featured cards + year/topic controls all present pre-JS.
6. **PF5-G2 — Presentations Pagefind projection** (`pf5-g2-presentations-pagefind-projection-2026-08-24.md`) — MERGED as PR #138 (2026-08-24). Added `resolvePagefindPresentations()` to `src/src.11tydata.js`, activating the shared presenter's dormant `presentations` kind branch. 135 local-first detail pages now carry `Sisältö:Esitykset`, `PresentationYear`, `PresentationType`, `PresentationTopic`, `PresentationEvent`, `Research context:research`. **External-first (Canva/YouTube/AOE without local detail) remain SSR-archive-only by design.**
7. **Pagefind hygiene hotfix** (`search-pagefind-index-hygiene-hotfix-2026-08-25.md`) — MERGED as PR #149. Fixed pipe-delimited metadata leaking into Pagefind excerpts on presentation detail pages; introduced page-scope `data-pagefind-body` on `<main>` in `base.njk` + `data-pagefind-ignore` on chrome regions in `presentation-item.njk`.
8. **O1 orientation widening** (`o1-widening-presentations-media-implementation-2026-08-21.md`) — MERGED as PR #122. Detail-orientation `returnTo` decoration now covers presentations; external-first canonical semantics preserved.

## 4. Media workstream chronology

1. **M1 — Media Pagefind Compatibility Audit** (`m1-...-2026-08-15.md`) — audit only, classification **B (ready after metadata cleanup)**. Media stack was structurally complete (73 items, 100% coverage on mediaType/mediaRole/mediaOutlet/sourceUrl/date), but had no per-item Pagefind metadata and no shared preset.
2. **M2 — Media Pagefind + Find & Explore rollout** (`m2-media-find-explore-closure-2026-08-16.md`) — MERGED as PR #90 (2026-08-15). Added `data-pagefind-filter="Sisältö:Mediassa"` + `Mediatyyppi`, `Rooli`, `Vuosi` filters + item-level meta on `src/_includes/media-item.njk`; registered `FindExplore:media` preset in `src/_utils/contentPresets.js`; added `data-pagefind-ignore` on archive card grids to prevent over-indexing; discovered and mitigated the site-wide Pagefind body-gate regression with a reverse audit gate. Research boundary preserved (media not added as a fifth Research scope; contexts remain inferred).
3. **PF5-G3A — Media result enrichment** (`pf5-g3a-media-result-enrichment-2026-08-26.md`) — MERGED as PR #155 (2026-08-26). Projected localized `mediaTypeLabelFi/En`, `mediaRoleLabelFi/En`, and `thumbnail` into Pagefind meta; extended `src/js/search-result-presenter.js` (208 → 283 LOC) to render primary meta (`type · role · outlet`) and decorative thumbnails for media results in both navbar and full-search surfaces. No parallel media renderer. No canonical change.
4. **O1 orientation widening** — as above; media detail pages received the shared `detail-orientation.njk` primitive with prefix allowlist; external source CTA (`Avaa alkuperäinen lähde`) preserved as visually primary action.

## 5. Current data flow

### Presentations

```text
src/presentations/*.md
  + canva tableRows + finnaAoe rows + youtube rows + curated constants
    -> src/_data/presentationSources.js
    -> src/_utils/presentationDerivedMetadata.js
    -> src/_data/presentationsPage.js
         buildCanonicalPresentationItems() (authoritative 218-item model)
         buildPresentationsPageModel() adds:
           - filterYears
           - filterTopics
           - sourceSections.fi / .en
           - highlightedContextItems

Two consumer branches:

A. Archive pages (interactive)
   -> src/esitykset.njk + src/en/presentations.njk
      -> src/_includes/presentations/archive.njk (SSR: 12 opening cards,
         21 year <option>s, 406 topic <datalist> entries on FI)
      -> src/_includes/presentations/source-group-content.njk (SSR
         featured cards + source rows/cards)
   -> src/js/presentations-page.js (327 LOC): ONLY archive interactive
      filter/search/pagination re-render, still fetches
      /data/presentations-page.json via ContentEngine.prefetch
   -> archiveCardHtml() still writes card HTML client-side for filtered
      results (Slice 3, deferred)

B. Detail pages (per-item)
   -> src/_includes/presentation-item.njk
      -> data-pagefind-body on <main>, data-pagefind-ignore on chrome
      -> Pagefind projection via src/src.11tydata.js
         resolvePagefindPresentations(): filters + meta for local-first
         presentations only
   -> src/js/search-result-presenter.js renders presentations branch
      with family badge + year + type · event
   -> Detail navigation uses shared detail-orientation.njk with
      returnTo query decoration
```

Public projections still emitted:

- `/data/presentations-page.json` — consumed by `ContentEngine.prefetch("presentationsPage")` for archive interactivity only. Public contract retained.
- `/data/presentations.json` — no browser consumer; used by tests and Pagefind build helpers. Retained.

### Media

```text
src/media/*.md (73 items)
  -> src/media/media.11tydata.js (contexts, tags, permalinks)
  -> src/_data/mediaArchive.js (role buckets for archive pages)
  -> src/data/media.json.11ty.js -> /data/media.json (73 items)

Two consumer branches:

A. Archive pages
   FI: src/fi/mediassa.njk
       - SSR opens 18 cards from mediaArchive
       - <section id="media-arkisto" data-pagefind-ignore>
       - Inline JS calls window.ContentEngine.query('FindExplore:media')
       - Inline renderCard() (page-local function, ~85 LOC in template)
         re-renders full 73-item grid + client-side filter chips
         (mediaType, mediaRole, topic aliases)
   EN: src/en/media.njk
       - SSR-renders all 73 items via mediaArchive
       - <section id="media-archive" data-pagefind-ignore>
       - No PE hydration, no filter bar, no runtime JSON fetch

B. Detail pages (per-item)
   -> src/_includes/media-item.njk
      - data-pagefind-filter="Sisältö:Mediassa"
      - data-pagefind-filter="Mediatyyppi/Rooli/Vuosi"
      - data-pagefind-meta with mediaType, mediaRole, mediaOutlet, year,
        date, mediaTypeLabelFi/En, mediaRoleLabelFi/En, thumbnail
      - No data-pagefind-body wrapper (M2 reverse gate protects this)
   -> src/js/search-result-presenter.js media branch:
      family badge + primary meta (type · role · outlet) + decorative
      thumbnail (PF5-G3A)
   -> Detail orientation via shared detail-orientation.njk + external
      source CTA as visually primary action
```

Neither Presentations nor Media has a parallel content model. All rendering,
whether SSR or runtime, reads from the canonical build layer or from
`/data/*.json` projections of it.

## 6. Delta against the branch-local Presentations audit

The 2026-08-24 audit is the last uncommitted audit relevant to Presentations
architecture closure. Each of its numbered findings is classified below
against current `origin/main` state.

| Audit section | Item | State |
| --- | --- | --- |
| §5 Grouping | source `sourceKey` grouping in browser | **DONE / MERGED** — moved to `buildPresentationSourceSections()` in `src/_data/presentationsPage.js`; browser helper `sourceItemsByKey()` removed. |
| §6 Sorting | source-bucket date sort in browser | **DONE / MERGED** — build-time ordering via `SOURCE_SECTION_KEYS`. |
| §7 Featured | `sourceFeaturedHtml()` | **DONE / MERGED** — SSR featured cards in initial HTML; browser helper removed. |
| §8 Source-specific | Canva/SlideShare/YouTube/AOE runtime construction | **DONE / MERGED** — all four source archive partials now render SSR via `source-group-content.njk`. |
| §9 Desktop/Mobile duplication | FI mobile source list JS render | **DONE / MERGED** — one SSR source representation path; `renderMobileSourceList()` removed. |
| §10 Year/topic options | runtime generation | **DONE / MERGED** — 21 year `<option>` + 406 topic `<datalist>` entries in SSR (FI). |
| §11 Runtime JSON | `/data/presentations-page.json` fetch | **STILL VALID + NOT IMPLEMENTED** — retained by design for archive filter/search/pagination re-render. |
| §12 Client HTML formatters | `archiveCardHtml()` (54 LOC) | **STILL VALID + NOT IMPLEMENTED (Slice 3)** — remaining client renderer; audit deferred pending archive interaction decision. |
| §12 | `keywordBadges`, `sourceFeaturedHtml`, `renderSourceTableRows`, `renderMobileSourceList` | **DONE / MERGED** — 4 of 5 formatters removed. |
| §14 FI/EN | EN language asymmetry | **DEFERRED INTENTIONALLY** — audit and P1 both preserved accepted asymmetry. |
| §15 Accessibility | empty source headings before JS | **DONE / MERGED** — SSR source headings present pre-JS. |
| §16 SEO | source-specific rows JS-only | **DONE / MERGED** — rows crawlable in SSR HTML. |
| §17 Complexity | 616 LOC in `presentations-page.js` | **DONE / MERGED** — now 327 LOC; ContentEngine dependency reduced to archive-only. |
| §18 Deletion ledger | all Slice 1 + Slice 2 rows | **DONE / MERGED**. |
| §18 | `archiveCardHtml()` (Slice 3) | **STILL VALID + NOT IMPLEMENTED**. |
| §19 Slice 1 (source sections) | recommendation | **DONE / MERGED** as PR #148. |
| §19 Slice 2 (year/topic options) | recommendation | **DONE / MERGED** as PR #148 (folded in). |
| §19 Slice 3 (archive card consolidation) | recommendation | **NEEDS RECHECK** — audit deferred pending interaction decision. PF5-G2 (2026-08-24) has since routed local-first presentations through the shared presenter globally, which materially changes the picture: the archive is now the last non-converged Presentations surface. See §9. |
| §20 Pagefind readiness | future Pagefind Presentations decision | **PARTIALLY SUPERSEDED** — PF5-G2 shipped a minimal Pagefind projection for local-first presentations. FULL Pagefind on `/esitykset/` remains explicitly deferred. |
| §21 Conflicts | search hotfix lane risks | **RESOLVED** — hotfixes landed (PR #149, #153, #154); no conflicts remain. |
| §22 Final decision | `REDUCE` (minimum slice, not full shutdown) | **RESPECTED** — landed as scoped. |

The branch-local audit's `## Recommended next move` said "take Slice 1 and
Slice 2 only" — that recommendation is fully delivered.

## 7. Closed / Valid decisions per domain

### Presentations

| Decision | Evidence |
| --- | --- |
| Canonical Content v1 authoritative for identity, URLs, landing, contexts | `docs/canonical-content-v1-closure-2026-08-12.md` |
| F&E rollout complete | `find-explore-presentations-f3c-closure-2026-08-15.md` |
| Research eligibility only from canonical `contexts` (33 items) | `f4-r3-...-2026-08-15.md`, PF5-G2 build evidence |
| SSR-owned source grouping/featured/table rows | `presentations-ssr-p1-implementation-2026-08-25.md` |
| SSR-owned year/topic option controls | same |
| Shared discovery presenter for local-first detail pages | `pf5-g2-presentations-pagefind-projection-2026-08-24.md` |
| External-first records remain SSR-archive-only (no Pagefind lookup entry) | PF5-G2 §"External-first" |
| Detail-orientation `returnTo` decoration | `o1-widening-presentations-media-implementation-2026-08-21.md` |
| Pagefind index scoped away from chrome | `search-pagefind-index-hygiene-hotfix-2026-08-25.md` |
| `/data/presentations-page.json` + `/data/presentations.json` public contracts retained | P1 §"Runtime JSON Retained" |

### Media

| Decision | Evidence |
| --- | --- |
| Canonical Media stack authoritative; no new model needed | M1 §12–14 |
| Per-item Pagefind metadata + `Sisältö:Mediassa` scope | M2 §8 |
| `FindExplore:media` preset registered | M2 §9 |
| `data-pagefind-ignore` on archive card grids prevents landing over-indexing | M2 §11 |
| Reverse gate: no detail page may re-introduce `data-pagefind-body` | M2 §10 |
| Media excluded from Research; contexts remain inferred, not authoritative | M2 §12 |
| Shared presenter handles Media results with localized primary meta + decorative thumbnails; no parallel renderer | PF5-G3A |
| Eleventy Image intentionally not introduced for thumbnails | PF5-G3A §"Eleventy Image decision" |
| Detail-orientation for media detail pages preserves external source CTA primacy | O1 widening closure |
| `/data/media.json` public contract retained | M2 §5 |

## 8. Genuinely open work

Each item below is supported by current repository evidence, not by earlier
audit inertia.

### P-OPEN-1 — Presentations archive Pagefind suitability audit (blocks Slice 3)

Type: **audit only**.

The SSR audit deferred Slice 3 (removing `archiveCardHtml()`) pending an
"interaction decision." PF5-G2 has since materially changed the input to
that decision:

- 135 local-first presentations are now first-class Pagefind records with `Sisältö`, year, type, event, topic, and Research metadata.
- The shared `SearchResultPresenter` renders presentations end-to-end with family badge + year + primary meta.
- `Sisältö:Esitykset` is available as a global-search facet.
- External-first (Canva/YouTube/AOE without local detail) is documented as **not** a Pagefind participant by design.

The open question is: given local-first coverage via Pagefind + shared
presenter, does the `/esitykset/` and `/en/presentations/` archive still
need a client-side `ContentEngine.prefetch` + `queryPreset` + custom
`archiveCardHtml()` renderer, or can it converge onto the same shared
presenter used everywhere else (like Publications' FULL Pagefind did)?

Both outcomes are legitimate. The audit must answer, not assume.

### P-OPEN-2 — Presentations Slice 3 (archive card consolidation)

Type: **implementation, gated by P-OPEN-1**.

If P-OPEN-1 concludes `NO-GO` (keep ContentEngine), the smaller move is a
template unification: emit the SSR `result-card.njk` with `returnTo`
support (currently the SSR archive card ignores `returnTo` decoration) and
have `presentations-page.js` reuse the same markup shape via a data
attribute or a small JS renderer generated from the SSR partial. Removes
`archiveCardHtml()` (~54 LOC).

If P-OPEN-1 concludes `GO` (full Pagefind archive), the deletion is much
larger: `presentations-page.js` shrinks to near-zero (only what shared
presenter mounts don't already do), the ContentEngine prefetch call
disappears, and `/data/presentations-page.json` becomes a candidate for
removal after consumer audit.

### M-OPEN-1 — FI media archive runtime rendering closure

Type: **audit + small implementation**.

`src/fi/mediassa.njk` still hosts an inline JS renderer identical in
pattern to Presentations before SSR-P1:

- `window.ContentEngine.query('FindExplore:media')` at line 328
- inline `renderCard(item)` at line 371
- client-side filter chips for `mediaType`, `mediaRole`, `topic` aliases

The M2 closure explicitly said "no visual redesign," and unlike
Presentations, the media archive already renders all 73 items with `<section
data-pagefind-ignore>` — search is not broken by the current design. But
this is the same duplicate-runtime-rendering pattern that SSR-P1 dissolved
on the Presentations side. Whether it warrants the same treatment is not
answered by any existing audit.

Boundaries an audit must honor:

- media `contexts` remain inferred, not authoritative — do not promote to
  Research
- outlet strings still need normalization before becoming a user-facing
  facet (M2 §15)
- FI `topicAliases` (`politiikka`, `tekoäly`, `avoin`, `paikallinen`) are
  page-local; migrating them into shared taxonomy is a separate question
- EN media archive has no filter bar and is intentionally simpler

### M-OPEN-2 — Media outlet normalization decision

Type: **decision only**.

M2 §15 identified 28 distinct outlet strings, some compound
(`Generation AI / YouTube`, `INOS Project / YouTube`, `YouTube / Jari
Laru`). PF5-G3A now surfaces the raw `mediaOutlet` value in the primary
meta line of every media result card. Whether the compound outlets are the
right unit for a future user-facing facet is unresolved. This is a small
authoring / vocabulary decision, not an architecture question.

## 9. Deferred intentionally

- **Presentations `/data/presentations-page.json` removal.** Deferred by both the SSR audit §11 and the SSR-P1 implementation §"Deferred Work." Any removal is contingent on P-OPEN-1.
- **Presentations `/data/presentations.json` removal.** No browser consumer, but tests and Pagefind helpers depend on it. Do not delete.
- **EN language-model redesign.** Both the SSR audit §14 and SSR-P1 §"FI / EN Decision" preserved the accepted asymmetry. No new evidence justifies reopening.
- **FULL Pagefind on `/esitykset/`.** PF5-G2 §"Follow-ups" lists this explicitly. The gate is P-OPEN-1.
- **F&E mount on `/esitykset/`.** Same PF5-G2 §"Follow-ups."
- **Media as a fifth Research scope.** M1 §15 and M2 §12 both closed this: media contexts are inferred, not authoritative membership.
- **Site-wide `data-pagefind-body` scope.** M2 §10 (Pagefind body-gate finding) documents why this cannot be done piecemeal. Cross-archive project, out of Presentations/Media scope.
- **Media outlet facet.** Blocked by M-OPEN-2 authoring decision.
- **Timeline T1B3 slice.** Explicitly deferred by roadmap; not Presentations/Media.

## 10. Superseded

- The SSR audit's Slice 1 and Slice 2 individual recommendations — replaced by the actual PR #148 implementation. The audit remains valuable as the analysis that produced them; refer to it for reasoning, not for planning.
- The SSR audit's "audit does not recommend a Pagefind Presentations decision now" boundary — narrowly superseded by PF5-G2 which shipped a minimal metadata projection. The broader FULL-Pagefind archive question is still open.
- The M1 audit's Section 12 open questions on `Sisältö` vocabulary — answered by M2's `Sisältö:Mediassa` label + PF5-A3A single-select content facet.
- The M1 §7 finding that the archive landing over-indexes — resolved by M2 `data-pagefind-ignore`.

## 11. Deletion candidates

These are ordered by strength of evidence for safe removal. None are being
deleted in this task.

| Candidate | File / function | Current consumer(s) | Existing replacement | Depends on |
| --- | --- | --- | --- | --- |
| `archiveCardHtml()` in `src/js/presentations-page.js` (~54 LOC) | archive filter re-render | archive interactive path | `src/_includes/presentations/result-card.njk` (needs `returnTo` support added) | P-OPEN-1 → P-OPEN-2 |
| `ContentEngine.prefetch("presentationsPage")` call site (~5 LOC) + downstream state | archive interactive path | Pagefind + shared presenter (if P-OPEN-1 = GO) | P-OPEN-1 = GO |
| Most of `wireArchive()` in `presentations-page.js` (~150 LOC) | archive interactive path | Pagefind + shared presenter (if P-OPEN-1 = GO) | P-OPEN-1 = GO |
| `/data/presentations-page.json` public projection | `ContentEngine`, audits, Pagefind helpers | audits and helpers can migrate to canonical build model; ContentEngine no longer needed if P-OPEN-1 = GO | P-OPEN-1 = GO + consumer audit |
| Inline `renderCard()` in `src/fi/mediassa.njk` (~85 LOC in template) | FI media archive hydration | full-list SSR + `data-pagefind-ignore` (if M-OPEN-1 = GO) | M-OPEN-1 |
| `window.ContentEngine.query('FindExplore:media')` in `src/fi/mediassa.njk` | FI media archive hydration | same as above | M-OPEN-1 |
| Local `topicAliases` in `src/fi/mediassa.njk` | FI media topic chips | shared taxonomy (if migrated) | M-OPEN-1 + taxonomy decision |

Not deletion candidates in this reconciliation:

- `src/js/content-engine.js` and `src/_utils/contentPresets.js` — infrastructure serving multiple domains beyond Presentations/Media (audits, tests). Do not scope deletion here.
- Any Nunjucks source-archive partial — actively used by SSR-P1.
- Any `src/_data/presentationsPage.js` block — build authority.

## 12. Regression / test dependencies

Existing coverage that must stay green through any next slice:

- `tests/presentations-archive.spec.js` — FI + EN archive filter interactivity, SSR opening cards, `returnTo` prefix behavior
- `tests/presentations-source-ssr.spec.js` — SSR source sections default-open + no-JS visibility
- `tests/presentations-research-smoke.spec.js` — Research context surface
- `tests/pf5-g2-presentations-shared-result.spec.js` — 12/12 shared presenter kind detection + family badge + year + primary meta on both `/haku/` and `/en/search/`
- `tests/unit/resolvePagefindPresentations.test.js` — pure projector unit tests (10 cases)
- `tests/unit/presentationsPage.test.js` — build model unit tests
- `tests/media-archive.spec.js` — FI archive filters + per-item Pagefind attrs + EN `data-pagefind-ignore`
- `tests/pf5-g3a-media-shared-result.spec.js` + `tests/pf5-g3a-media-presenter-browser.spec.js` — shared presenter media branch (localized primary meta + thumbnail)
- `tests/unit/searchResultPresenter.test.js` — 6/6 presenter branches
- `scripts/audit-media-pagefind-m2.js` — includes the `noDetailUsesPagefindBody` reverse gate

New coverage required before any implementation on the open items:

- P-OPEN-1 → P-OPEN-2 path (GO):
  - browser smoke covering shared-presenter mount on `/esitykset/` and `/en/presentations/`
  - Pagefind facet regression: `Sisältö:Esitykset` counts, `PresentationYear`, `PresentationType`, `Research context:research`
  - no-JS assertion: external-first archive cards still crawlable via SSR
  - accessibility parity vs current filter bar (year select, topic combobox)
- P-OPEN-1 → P-OPEN-2 path (NO-GO / template unification):
  - `returnTo` decoration parity between SSR archive card and interactive-filter card
  - truncation parity for description text
- M-OPEN-1:
  - equivalent of `presentations-source-ssr.spec.js` for media archive filter chips
  - no-JS filter parity assertion (if any filter behavior moves to SSR)

## 13. Value / effort / risk ranking

| Package | Architecture value | Implementation effort | Risk | Value / effort |
| --- | --- | --- | --- | --- |
| P-OPEN-1 (Presentations archive Pagefind suitability audit) | HIGH — decides the entire remaining Presentations runtime story and gates the largest available deletion | SMALL — audit only, no code | LOW — audit-only | **HIGH** |
| P-OPEN-2 (Slice 3 — template unification, `NO-GO` path) | MEDIUM — deletes ~54 LOC duplicate renderer, unifies `returnTo` semantics | SMALL–MEDIUM | LOW–MEDIUM (interaction parity risk) | MEDIUM |
| P-OPEN-2 (Slice 3 — FULL Pagefind path) | HIGH — potentially deletes ~200+ LOC browser JS and unlocks `/data/presentations-page.json` removal after consumer audit | MEDIUM–LARGE | MEDIUM (facet/no-JS/accessibility parity) | MEDIUM |
| M-OPEN-1 (FI media archive runtime closure) | MEDIUM — removes the last duplicate-runtime pattern in the Presentations/Media surface family | MEDIUM — new SSR structure, `topicAliases` decision, no-JS filter question | MEDIUM (visual redesign was explicitly out of M2 scope) | MEDIUM |
| M-OPEN-2 (Media outlet normalization) | LOW–MEDIUM — enables a future outlet facet, no immediate user problem | SMALL (authoring) | LOW | LOW–MEDIUM |

Cross-domain reminders from the site roadmap
(`site-architecture-closure-roadmap-2026-08-20.md`) that outrank
Presentations/Media at the site level right now:

- N1 accessibility/navigation closure (`NEXT`)
- C1 cross-cutting deletion (applies to whichever lane runs next)
- PF5 audit gating for global result parity is `GATED / AUDIT FIRST`

Any Presentations/Media package must be assessed against N1's priority
before it is scheduled. This reconciliation is scoped to Presentations +
Media only per the task; the site-wide sequencing is not being changed.

## 14. Recommended next implementation package

## Recommended next implementation package

**P-OPEN-1 — Presentations archive Pagefind suitability audit** (audit only, no code changes).

Why this and not a fresh implementation:

- It is the highest-value single move available in the Presentations lane and it has the smallest cost, because it is an audit.
- The branch-local SSR closure audit explicitly deferred Slice 3 pending an "interaction decision." That decision has never been made, and every deletion listed in §11 that touches `presentations-page.js`, the archive ContentEngine call, or `/data/presentations-page.json` is downstream of it.
- The input to that decision has materially changed since the SSR audit was written. PF5-G2 (merged 2026-08-24) routed 135 local-first presentations through the same shared presenter used by Publications, Theses, Writings, Media, and Research. External-first records are documented as archive-only by design. The picture PF5-G2 produced is exactly the picture a Presentations Pagefind decision needs.
- It is bounded: it must produce a single `GO`, `REDUCE`, or `NO-GO` recommendation for FULL Pagefind on `/esitykset/` and `/en/presentations/`, with an explicit assessment of no-JS behavior, accessibility parity vs the current filter bar, external-first coverage, and the fate of `/data/presentations-page.json`.
- It does not duplicate the SSR closure audit. The SSR audit answered: what deterministic browser logic can move to SSR? This audit answers a different question: given the SSR floor now in place plus the shared presenter, does the archive need any bespoke Presentations runtime at all?

Why not the alternatives:

- **P-OPEN-2 directly**: the SSR audit already flagged that Slice 3 is coupled to the interaction decision. Doing template unification without answering P-OPEN-1 either wastes the work (if the answer turns out to be `GO` and the whole renderer disappears) or commits by omission to `NO-GO` without evidence.
- **M-OPEN-1 (media archive closure)**: media has an equivalent pattern, but the M2 closure explicitly bounded that surface as "no visual redesign." There is no repo evidence of a user-visible regression or a shared-infrastructure blocker on the media archive today. Slice 3 (or the audit that gates it) is a stronger candidate because the Presentations audit already told us the deferral is deliberate and unfinished.
- **M-OPEN-2 (outlet normalization)**: low-value, authoring only, not architecture.
- **A fresh Presentations SSR audit**: the existing SSR audit is still valid for the surfaces it covered; running it again would duplicate work without new information.
- **A fresh Media suitability audit**: M1 answered the compatibility question sufficiently. M2 delivered on it. PF5-G3A closed the presenter enrichment gap.

Deliverables expected from P-OPEN-1:

1. Decision line: `GO`, `REDUCE`, or `NO-GO` for FULL Pagefind on `/esitykset/` + `/en/presentations/`.
2. Explicit treatment of external-first presentations (Canva / YouTube / AOE without local detail): they must remain discoverable via SSR archive under all outcomes.
3. Accessibility and no-JS parity assessment vs the current archive.
4. Consumer audit of `/data/presentations-page.json`: what removal would break (audits, tests, external tools) and what stays.
5. Whether the shared `Sisältö:Esitykset` + `PresentationYear` + `PresentationType` + `PresentationTopic` facet set is sufficient, or whether a page-scoped Pagefind mount needs additional facets.
6. Expected deletion ledger by outcome:
   - `GO`: `archiveCardHtml`, `wireArchive`, `renderPagination`, `updateArchiveStatus`, `archiveItemsForState`, `exactTopicMap`, the `ContentEngine.prefetch` call, and eventually `/data/presentations-page.json`.
   - `REDUCE`: `archiveCardHtml` unification with SSR `result-card.njk` (Slice 3 minimum).
   - `NO-GO`: rationale and closure of the SSR audit's deferred slice as intentionally kept.
7. Explicit statement that the recommendation does not modify Canonical Content v1, does not add taxonomy, does not infer Research from topics, does not delete public projections without consumer audit, and does not copy the Publications FULL Pagefind decision automatically.

Boundaries preserved regardless of outcome:

- Canonical Content v1 untouched
- No Research inference from topics
- `pageUrl` / `sourceUrl` / `externalUrl` / `landingUrl` semantics untouched
- External-first records remain discoverable
- `/data/presentations.json` (non-browser consumers) is not on the table
- FI/EN accepted asymmetry preserved
- No parallel content model

This is the smallest possible package that unblocks the largest available
Presentations-lane deletion.
