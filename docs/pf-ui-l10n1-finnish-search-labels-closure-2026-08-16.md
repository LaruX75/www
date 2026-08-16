# PF-UI-L10N1 — Finnish Search UI Labels Closure

Date: 2026-08-16
Status: **PF-UI-L10N1 FINNISH SEARCH LABELS = CLOSED / GREEN**

## 1. Status

PF-UI-L10N1 is closed. `fix: localize Finnish search UI labels` is on
`main`, PF-UI-L10N1 code is present in the shipped
`src/js/site-ui.js` PagefindUI init, and the current main HEAD's
post-merge workflows all completed successfully.

## 2. Merge

- PR: [#98 fix: localize Finnish search UI labels](https://github.com/LaruX75/www/pull/98) — merged 2026-08-16T15:02:30Z by LaruX75.
- PR #98 merge commit: **`343738a6776f9b10ea6e36e7b3afa4fc6a58d1a4`**.
- Head SHA at merge time: `dc0615b7a52e7d3a3a4365ba1564981d35d45c2c` — protected via `gh pr merge --match-head-commit`.
- Note: **two** of the three workflows on the exact merge commit
  `343738a6` were cancelled (see §3), so closure verification uses
  the current main HEAD instead, which contains PF-UI-L10N1 as
  part of the same tree state.
- Closure verification uses current main HEAD:
  **`c2960539ec812741295057392215d54e5e30c09a`**
  (`docs: close SEO2 social sharing metadata rollout`).

## 3. Superseded workflow note

Post-merge workflows on the PF-UI-L10N1 merge commit `343738a6`:

- `Build and Deploy` (run `31954466394`) — completed / **SUCCESS**.
- `Generate OG Images` (run `31954466315`) — completed / **CANCELLED**.
- `Accessibility and navigation tests` (run `31954466262`) — completed / **CANCELLED**.

The cancellation was **not a failure**. A follow-up docs-only push
(`c2960539 docs: close SEO2 social sharing metadata rollout`)
landed on `main` moments after PR #98 merged, and GitHub Actions
cancels superseded in-progress runs on the same branch to keep
newer content authoritative.

- The current main HEAD `c2960539` contains PF-UI-L10N1 code in
  full (`git show origin/main:src/js/site-ui.js | grep -c
  'Suodattimet\|filters_label' = 2`; the local checkout matches
  with 4 matches across `Suodattimet` / `filters_label` /
  `Hae sivustolta` / `Tyhjennä haku`).
- All three workflows on current main HEAD `c2960539` completed
  **SUCCESS**:
  - `Build and Deploy` (run `31954561006`) — completed / SUCCESS.
  - `Generate OG Images` (run `31954561023`) — completed / SUCCESS.
  - `Accessibility and navigation tests` (run `31954561011`) — completed / SUCCESS.
- PF-UI-L10N1 is therefore verified transitively on the current
  main HEAD.

## 4. User-observed issue

> Pagefindin kentät sisältöineen vasemmassa reunassa ovat englanniksi.

The Finnish nav-bar PagefindUI overlay showed English strings —
most visibly the **"Filters"** heading above the left-side facet
panel, plus the alt-search / suggestion strings that surface when
Pagefind spell-corrects a zero-result query.

## 5. Root cause

`src/js/site-ui.js` initialized the nav-bar PagefindUI overlay
with a **partial** `translations` object — only 8 of PagefindUI's
11 translatable strings. The missing three fell back to
PagefindUI's built-in English defaults:

- `filters_label` → "Filters"
- `alt_search` → alt-search message
- `search_suggestion` → suggestion header

The `/haku/` full-page PagefindUI (initialized separately in
`src/js/site-search-page.js`) already shipped all 11 strings, so
the bug was invisible on `/haku/` and visible only via the nav-bar
overlay.

## 6. Scope delivered

- Full FI/EN PagefindUI translations bundle for the nav-bar
  search overlay in `src/js/site-ui.js`.
- `/haku/` and `/en/search/` remained unchanged because they
  were already correct.
- Find & Explore pages (`/tutkimus/`, `/kirjoitukset/`,
  `/opinnaytteet/`, `/julkaisut/`) remained unchanged because
  their labels come from Nunjucks templates with per-page
  variables and were already Finnish on Finnish pages.

## 7. Boundaries preserved

- No Pagefind metadata change.
- No Pagefind index change (`fi:1163 / en:346` unchanged).
- No Research semantic change.
- Research population **317** unchanged.
- Media not in Research.
- No `Sisältö:*` value change.
- No `Sisältö:Tutkimus`.
- No `FindExplore:*` visible.
- No starter-chip change.
- No result-card change.
- No SEO2 source change (SEO2 is a separate rollout landed on
  `c2960539`'s predecessor `3b36a71a` from PR #97).
- No scroll hints.
- No `data-pagefind-body` reintroduced.

## 8. Verification

### Current main HEAD `c2960539` workflow statuses

- `Build and Deploy` (run `31954561006`) — completed / **SUCCESS**.
- `Generate OG Images` (run `31954561023`) — completed / **SUCCESS**.
- `Accessibility and navigation tests` (run `31954561011`) — completed / **SUCCESS**.

### PR #98 pre-merge verification (recorded in the PF-UI-L10N1 report)

- `npm run build:no-og` — green (Pagefind entry `fi:1163 / en:346`).
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf-ui-l10n1-finnish-search-labels.js` — **10 / 10 gates green**.
- PF-UI-L10N1 browser smoke `tests/pf-ui-l10n1-finnish-search-labels.spec.js` — **6 / 6 pass**.
- PF-PERF2 Enter-scroll smoke `tests/pf-perf2-first-search-latency.spec.js` — **5 / 5 pass** (regression check).
- `node scripts/audit-pf-perf1-pagefind-startup.js` — all 8 gates green.
- `node scripts/audit-pf4-result-card-hierarchy.js` — all 19 gates green.
- `node scripts/audit-pf-starter-chips.js` — all 11 gates green.
- `node scripts/audit-pf3-result-card-consistency.js` — all 9 gates green.
- `node scripts/audit-pf2-sisalto-facet.js` — all 9 gates green (750 detail records).
- `node scripts/audit-media-pagefind-m2.js` — all gates green including reverse `noDetailUsesPagefindBody`.
- `node scripts/audit-f4-research-built-output.js` — `totalResearchPopulation: 317`; media not enumerated.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.

## 9. Remaining work

- **PF5-AUDIT — native result-card variants + APA7 citation
  readiness**: future Pagefind-quality workstream. Not scheduled
  yet.
- **UX2 scroll hints**: deferred; separate track outside PF.

## 10. Next recommendation

**Start PF5-AUDIT — native result-card variants and APA7
citation readiness**, after no open closure tasks remain.
