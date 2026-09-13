# Pagefind migration handoff — presentations archive (2026-09-13)

Compact handoff brief for a fresh session that needs to pick up the
"should `/esitykset/` archive move from custom `ContentPresets`
runtime to shared Pagefind search-result-presenter?" question.

Read this file first. Deep detail lives in the two audit docs linked
at the bottom.

## Purpose

Answer: **no migration today**. Decision has been re-audited on
2026-09-13 and stays at HYBRID. Three of six migration prerequisites
are still hard blockers. This brief tells a new session what has been
done, what remains, and in what order the remaining work is cheapest
to tackle if the migration ever proceeds.

## Repo state at handoff

- `origin/main` HEAD: **`538b15b138c074d0e5dc5a1f45731b235660e849`**
  (Merge PR #255, 2026-09-13T07:56Z).
- Live production: https://www.jarilaru.fi/ served from that HEAD.
- No open PR blocks or dependencies on the migration question.

## Recent PRs relevant to this question (2026-09-12 – 2026-09-13)

| PR | Merge SHA | What it did to the archive |
|---|---|---|
| #250 | `0b3eaf5d` | Deduped 3 duplicated 405040Y luento cards on `/esitykset/`. Curation supersede mechanism added. |
| #251 | `87dce973` | Docs-only. Records CI coverage gaps for the new duplicate-cards spec. |
| #253 | `7d8bbf22` | (Not mine.) Resolved 2 YouTube-playlist duplicates on live production. |
| #254 | `777b06ba` | Removed 2 unpublished Canva presentation records + 2 curated stubs. |
| #255 | `538b15b1` | **Slice 3.** Removed `archiveCardHtml()` from `src/js/presentations-page.js`; moved card metadata into DOM `data-*` attributes on SSR cards; dropped the runtime `/data/presentations-page.json` fetch. FI + EN. Slice 3 was the "immediate implementation package" from Audit 1 and shipped independently of the FULL-migration prerequisites. |

## The two authoritative audit docs

- `docs/presentations-archive-pagefind-suitability-audit-2026-08-28.md`
  — **Audit 1.** 573 lines. Original decision `D — HYBRID`, defined
  the six prerequisites for reopening as `B — SUITABLE AFTER SMALL
  PREREQUISITES`, and specified Slice 3 as an independent HYBRID-
  closure step.
- `docs/presentations-archive-pagefind-suitability-audit-2-2026-09-13.md`
  — **Audit 2 (this session).** Re-evaluates each of the six
  prerequisites against post-Slice-3 `origin/main`. Confirms
  Decision D. Documents the cheapest-first order for the remaining
  work.

## Current architecture (what HYBRID means today)

- `/esitykset/` and `/en/presentations/` archives:
  - **SSR-first.** 221 cards rendered by `src/_includes/presentations/result-card.njk`
    per canonical presentation, both FI and EN.
  - **Client interaction:** `src/js/presentations-page.js` (214 LOC
    post-Slice-3) reads `data-*` attributes from the SSR cards and
    calls `window.ContentPresets.queryPreset(items, "FindExplore:presentations", {search, filters})`
    to hide/show cards for filter + search. No runtime JSON fetch.
    Pagination = 12/page.
- Global search (`/haku/`, `/en/search/`, navbar):
  - **Pagefind-driven.** `src/js/search-result-presenter.js` (283
    LOC) renders results uniformly. Presentations already flow
    through this path via PF5-G2 projection on detail pages plus
    `scripts/_lib/presentationPagefind.js` custom records for
    external-first cases.
- **The two paths do not overlap on the archive page today.**

## The six migration prerequisites — current status

| # | Prerequisite | Status | Where it lives |
|---|---|:---:|---|
| 1 | Live external-first custom-record coverage verified end-to-end | not verified | code path exists: `scripts/run-pagefind.js:102` + `scripts/_lib/presentationPagefind.js:479` |
| 2 | PF5-G2 Eleventy projection vs postbuild custom records reconciled | partial — index-time paths are mutually exclusive, schema ownership open | `src/src.11tydata.js:resolvePagefindPresentations` vs `scripts/_lib/presentationPagefind.js:buildPresentationCustomRecord` |
| 3 | Shared presenter distinguishes external vs local URLs | **still blocking** | `src/js/search-result-presenter.js` has zero external/target/_blank/noopener/hasLocalDetail references |
| 4 | `data-pagefind-sort="date:..."` emitted for presentations | **still blocking** | zero occurrences in `src/_includes/presentation-item.njk`, `src/src.11tydata.js`, `scripts/_lib/presentationPagefind.js`; only `src/_includes/media-item.njk` uses `data-pagefind-*` for a different content type |
| 5 | Topic UX (406 vocabulary vs facet chip UI) | still open | `<datalist>` handles the 406 today; `src/js/starter-chips.js` (103 LOC) is a curated 5-chip start-point mechanism, not a facet system |
| 6 | `returnTo` semantics under Pagefind | compatible — F&E shell already implements the wanted shape | `src/js/find-explore.js:withReturnTo` (~line 662) + `decorateResultLinks` (~line 675) |

Three hard blockers: **#3, #4, #5**. Two partial downgrades: **#2, #6**.
One unverified: **#1** (code exists, live query not scripted).

## Cheapest-first order if migration ever proceeds

Each step is bounded and independent of the others.

1. **Step 2** — schema parity between the Eleventy projection and the
   postbuild custom-record builder. Either a shared helper or a
   build-time cross-check. No UX commitment. Small.
2. **Step 3** — emit `data-pagefind-sort="date:..."` on presentation
   detail pages (`resolvePagefindPresentations` output) and in
   `buildPresentationCustomRecord`. Small.
3. **Step 1** — scripted end-to-end verification of live custom-record
   hits for external-first canonical ids. Own workstream (Playwright
   or equivalent). Small.
4. **Step 4** — extend `search-result-presenter.js` to distinguish
   external vs local URLs and render `target="_blank" rel="noopener noreferrer"`
   + external badge. Not presentations-specific — cleans up global
   search for all external-first content. Small–medium.
5. **Step 5** — topic UX design decision. "Keep `<datalist>`, no
   chips" is free. "Curated facet chips" requires a documented sync
   policy with the 406-topic vocabulary.
6. **Audit 3** — full re-audit against the state produced by steps
   1–5. Decision then A / B / C / D based on evidence at that time.

If none of these is scheduled, HYBRID is stable. No maintenance action
is needed to keep the current state healthy.

## Anchors (paths + PR URLs)

**Docs:**
- Audit 1: `docs/presentations-archive-pagefind-suitability-audit-2026-08-28.md`
- Audit 2: `docs/presentations-archive-pagefind-suitability-audit-2-2026-09-13.md`
- Slice 3 closure: `docs/presentations-runtime-data-01-2026-09-13.md`
- Earlier context: `docs/pf5-g2-presentations-pagefind-projection-2026-08-24.md`,
  `docs/pf5-hygiene-1-presentation-pagefind-metadata-ownership-audit-2026-09-02.md`,
  `docs/presentations-pagefind-quality-f3c-p4-report-2026-08-14.md`

**Code (verification breadcrumbs):**
- Archive template: `src/_includes/presentations/result-card.njk`
- Archive runtime: `src/js/presentations-page.js`
- Shared presenter: `src/js/search-result-presenter.js`
- F&E shell: `src/js/find-explore.js`
- Starter chips: `src/js/starter-chips.js`
- Pagefind projection: `src/src.11tydata.js` (function `resolvePagefindPresentations`)
- Pagefind custom records: `scripts/_lib/presentationPagefind.js`
- Pagefind runner: `scripts/run-pagefind.js`
- Presentation detail template: `src/_includes/presentation-item.njk`

**GitHub PRs (LaruX75/www):**
- #250 esitykset-duplicates-01: https://github.com/LaruX75/www/pull/250
- #251 CI-coverage-gaps docs: https://github.com/LaruX75/www/pull/251
- #253 youtube-playlist-card-dedup: https://github.com/LaruX75/www/pull/253
- #254 canva-presentation-removal-01: https://github.com/LaruX75/www/pull/254
- #255 presentations-runtime-dom-filtering (Slice 3): https://github.com/LaruX75/www/pull/255

## What this session did not touch

- No production code changes (Audit 2 is docs-only).
- Primary repo working tree stays on its WIP branch; this session
  worked in a separate worktree.
- No Pagefind pipeline change. No canonical content change. No public
  contract change.

## How to hand this to a new session

Open `docs/pagefind-migration-handoff-2026-09-13.md` (this file). It
links Audit 2 for the reasoning and Audit 1 for the original decision
frame. A new session needs both audit docs + this brief to reconstruct
the state without replaying the investigation.
