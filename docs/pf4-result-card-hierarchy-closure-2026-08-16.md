# PF4 — Result-Card Hierarchy Trim Closure

Date: 2026-08-16
Status: **PF4 RESULT-CARD HIERARCHY TRIM = CLOSED / GREEN**

## 1. Status

PF4 is closed. `feat: trim Find & Explore result-card hierarchy` is on
`main`, all post-merge workflows are green, and every non-empty shared
Find & Explore result card now renders the audit-approved four-line
default hierarchy (family badge · year / title / single primary
metadata line / optional excerpt / publication-only action row).
Publication quality signals (peer-reviewed / open-access / JUFO /
citations) moved from four colored Bootstrap badges into one subdued
uppercase micro-copy line, with all publication actions preserved.

## 2. Repository state

- PR: [#94 feat: trim Find & Explore result-card hierarchy](https://github.com/LaruX75/www/pull/94) — merged 2026-08-16T13:21:47Z by LaruX75.
- Merge commit: `69ad319e753c4d6965b0ef3cc45619e92d18ae28`.
- PF4 implementation commit: `a582af126fa552550c64e084e6e764368105dd03`.
- Main HEAD at closure time: `69ad319e753c4d6965b0ef3cc45619e92d18ae28`.
- Merge method: merge commit (repo convention).
- Head SHA at merge time: `a582af12…` — protected via `gh pr merge --match-head-commit`.
- No conflicts at merge.
- Post-merge GitHub Actions on `69ad319e`:
  - `Build and Deploy` — completed / success (run `31949603043`).
  - `Generate OG Images` — completed / success (run `31949603082`).
  - `Accessibility and navigation tests` — completed / success (run `31949603055`).

Prior related work already on main:

- `cb70af90 docs: close PF-STARTER-CHIPS rollout`
- `3a7841cc docs: close PF3 result-card consistency rollout`
- `d87bf586 docs: close M2 Media Find and Explore rollout`
- `80487bc0 docs: close F4 Research Find and Explore rollout`

## 3. Scope delivered

Every non-empty shared Find & Explore result card now renders:

1. **Line 1 — family badge · year** — stable
   `data-find-explore-card-line="family"` hook; the PF3 badge sits
   inline with the year, joined by CSS `flex + align-items: baseline`
   so the year reads as a suffix, not a separate strip.
2. **Line 2 — title** — unchanged from PF3.
3. **Line 3 — single primary metadata sentence** —
   `data-find-explore-card-line="primary-meta"`, joined by ` · ` with
   empty parts dropped cleanly.
4. **Line 4 — excerpt / snippet** —
   `data-find-explore-card-line="excerpt"`, rendered only when
   non-empty.
5. **Line 5 — publication-only action row** —
   `data-find-explore-card-line="actions"` containing the pre-existing
   Open / Source / Citation-export buttons.

Publication cards additionally carry `data-find-explore-card-line="quality"`
between the primary meta and the excerpt when peer-reviewed / open-access
/ JUFO / citations data exists. Absence of quality data collapses the
whole line (no orphan paragraph).

## 4. Publication behavior

- Colored quality badges (`text-bg-primary`, `text-bg-success`,
  `text-bg-light border`, `text-bg-warning`) — **removed** from the
  renderer output.
- Same information preserved as a single subdued uppercase line via
  `.find-explore-result-publication-quality` (`text-transform:
  uppercase`, `color: var(--bs-secondary-color)`, `font-size:
  0.72rem`).
- Same labels sourced from the shared `labels` bundle
  (`labels.peerReviewed`, `labels.openAccess`, `JUFO N`,
  `labels.citations(N)`).
- **Open / Source / Citation-export buttons** unchanged.
- Publication primary meta line: `authors · type · venue`; year moved
  to line 1.
- Publication richness reduced (visual density) but not removed
  (information density retained).

## 5. Non-publication behavior

- **Theses** — primary meta line: `authorLine · thesesTypeLabel`;
  year moved to line 1. No action row on the shared card (title
  link remains the primary affordance).
- **Writings** — primary meta line: `writingsTypeLabel` alone (writing
  type is now the one prominent metadata cue); year moved to line 1.
  PF2 publications-first priority preserved — publication-backed
  writings still render via the publication card path with `Julkaisut`
  badge.
- **Presentations inside shared Find & Explore / Research mount** —
  primary meta line: `presentationType · presentationEvent` composed
  from existing Pagefind meta (`PresentationType` /
  `PresentationEvent`); either field may drop safely.
- **No bespoke archive-card redesign** — `/esitykset/`
  `article.presentation-archive-card` and `/mediassa/`
  `article.media-archive-card` are unchanged (audit gates
  `presentationArchiveCardUntouched` +
  `mediaArchiveCardUntouched` verified).

## 6. Research boundary

Verified via `scripts/audit-f4-research-built-output.js` on the merged
main build:

| Kind | Eligible |
| --- | --- |
| publications | 53 |
| theses | 169 |
| writings | 62 |
| presentations | 33 |
| **total** | **317** |

- Research population unchanged from the F4 closure baseline.
- Research membership rule unchanged: `contexts.includes("research")`.
- Media is not enumerated in any Research surface.
- No `Sisältö:Tutkimus` introduced anywhere (audit gate
  `noForbiddenTokenInFamilyBlock`).
- No topic mapping used as Research membership.

## 7. Pagefind boundary

- No Pagefind metadata changed by PF4 (audit gate
  `noDataPagefindBodyInRenderer`; no `data-pagefind-filter` /
  `-meta` / `-sort` emission touched).
- No new Pagefind facets.
- No `data-pagefind-body` introduced (M2 + PF2 + PF3 + PF4 reverse
  gates all still green).
- Pagefind index size after PF4: `fi:1163 / en:346` — identical to
  the plain-main baseline. No collapse.

## 8. Starter-chip boundary

- Starter chips unchanged (`data-starter-chips` markup untouched on
  `/tutkimus/`, `/esitykset/`, `/mediassa/`).
- Chip labels unchanged.
- Chip runtime (`src/js/starter-chips.js`) unchanged.
- Chip CSS (`src/css/starter-chips.css`) unchanged.
- Audit gates `starterChipRuntimeUntouched` +
  `starterChipCssUntouched` verified.

## 9. Archive boundary

- Media archive cards unchanged (`article.media-archive-card` on
  `/mediassa/` still uses its bespoke inline runtime and styling).
- Presentation archive cards unchanged
  (`article.presentation-archive-card` on `/esitykset/` still uses
  `src/js/presentations-page.js`).
- PF4 was scoped strictly to the shared Find & Explore renderer;
  bespoke archive card visual harmonization is a separate future
  workstream.

## 10. Verification

GitHub post-merge workflows on `69ad319e`:

- `Build and Deploy` — completed / success (`31949603043`).
- `Generate OG Images` — completed / success (`31949603082`).
- `Accessibility and navigation tests` — completed / success
  (`31949603055`).

Pre-merge local verification (on the exact PF4 commit `a582af12`,
run during the PF4-IMPL checkpoint):

- `npm run build:no-og` — green.
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf4-result-card-hierarchy.js` — all 19 gates
  green.
- `node scripts/audit-pf-starter-chips.js` — all 11 gates green.
- `node scripts/audit-pf3-result-card-consistency.js` — all 9 gates
  green.
- `node scripts/audit-pf2-sisalto-facet.js` — all 9 gates green
  (750 detail records).
- `node scripts/audit-media-pagefind-m2.js` — all gates green
  including the reverse `noDetailUsesPagefindBody` guard.
- `node scripts/audit-f4-research-built-output.js` —
  `totalResearchPopulation: 317`; media not enumerated.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `DISABLE_OG_IMAGES=true npx playwright test tests/pf4-result-card-hierarchy.spec.js
  --workers=1` — **6 / 6 pass**.
- Sibling + contrast smokes (`pf3-result-card-consistency`,
  `pf-starter-chips`, `pf2-sisalto-facet`,
  `f2-find-explore-smoke`, `f3a-theses-find-explore`,
  `f3b-publications-find-explore`, `f4-research-find-explore`,
  `media-archive`, `presentations-archive`,
  `presentations-research-smoke`, `contrast`) — **44 / 44 pass**.

Post-merge local re-verification was skipped because the merge is a
straight fast-forward of the identical tree that was already
pre-merge-verified at `a582af12`, and the GitHub Pages deploy on
`69ad319e` completed successfully.

## 11. Remaining work

- **PF-PERF1 — Pagefind startup performance audit**: still queued.
  Keep audit-only until concrete slow-startup evidence lands.
- **Writings segmentation** (PF1 open question about
  `scientificPublication` visibility inside `/kirjoitukset/`):
  still deferred.
- **Media outlet / source normalization** (`mediaOutlet` remains
  Pagefind meta only): still deferred.
- **Bespoke media / presentation archive card visual
  harmonization** — a future workstream.
- **English starter-chip parity** (`/en/research/`,
  `/en/presentations/`, `/en/media/` do not render chips): still
  deferred.
- **SEO / social sharing / scroll-hint work** may continue
  separately in the Codex UXSEO line — it is **not** part of the
  Pagefind PF closure chain.
- **Publication actions on the Research contextual mount** —
  publication hits on `/tutkimus/` still render via the generic
  card path (no Open / Source / Citation-export action row)
  because the Research mount has no publications-page record
  store. This is pre-existing behavior preserved by PF4; the
  shared four-line hierarchy still applies on those hits.

## 12. Next recommendation

**PF-PERF1 — Pagefind startup performance audit.**

With PF2 (Sisältö vocabulary), PF3 (family badge), PF-STARTER
(starter chips), and PF4 (card hierarchy) all shipped, the Find
& Explore discovery surface is complete. PF-PERF1 remains the
last named workstream in PF1 §17. Keep it strictly audit-only
until concrete slow-startup evidence surfaces; if no such
evidence appears, PF-PERF1 can produce a documented "no action
required" record without any code change.

Note: SEO / social-sharing / scroll-hint work may continue
separately in the Codex UXSEO line, but it is not part of the
Pagefind PF closure chain and does not gate PF-PERF1.
