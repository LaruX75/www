# PF-STARTER-CHIPS — Closure

Date: 2026-08-16
Status: **PF-STARTER-CHIPS = CLOSED / GREEN**

## 1. Status

PF-STARTER-CHIPS is closed. `feat: add starter chips to discovery
pages` is on `main`, all post-merge workflows are green, and every
Finnish discovery page identified by PF1 §13 (`/tutkimus/`,
`/esitykset/`, `/mediassa/`) now carries a small user-triggered
"Aloita tästä" chip strip that wraps existing filter, topic, or
query controls.

## 2. Repository state

- PR: [#93 feat: add starter chips to discovery pages](https://github.com/LaruX75/www/pull/93) — merged 2026-08-16T09:50:11Z by LaruX75.
- Merge commit: `3d63a609b3037136450589e87daa24a8fa6ead83`.
- PF-STARTER implementation commit: `88107ebfc2e4095c429a3bcf619acf3d7c2a1074` (amended contrast fix folded in).
- Main HEAD at closure time: `3d63a609b3037136450589e87daa24a8fa6ead83`.
- Merge method: merge commit (repo convention).
- Head SHA at merge time: `88107ebf…` — protected via `gh pr merge --match-head-commit`.
- No conflicts at merge.
- Post-merge GitHub Actions on `3d63a609`:
  - `Build and Deploy` — completed / success (run `31940086704`).
  - `Generate OG Images` — completed / success (run `31940086705`).
  - `Accessibility and navigation tests` — completed / success (run `31940086724`).

Prior related work already on main:

- `3a7841cc docs: close PF3 result-card consistency rollout`
- `d87bf586 docs: close M2 Media Find and Explore rollout`
- `80487bc0 docs: close F4 Research Find and Explore rollout`

## 3. Scope delivered

- User-triggered "Aloita tästä" starter chip strips on:
  - `/tutkimus/` (Find & Explore runtime, Research contextual mount)
  - `/esitykset/` (presentation archive runtime, FI only via `archiveLocale == "fi"`)
  - `/mediassa/` (inline media archive runtime)
- Chips wrap existing search / filter / topic mechanisms exposed by
  each page's runtime. No new query pipeline, no new Pagefind filter,
  no new metadata surface, no result-card change.
- No chip triggers automatic search on page load.
- No second query model introduced.
- Existing search / filter UI on every affected page is preserved
  unchanged; chips sit above the existing controls.
- Runtime is a small page-agnostic `src/js/starter-chips.js` that
  only sets values on existing fields OR proxies clicks on existing
  filter buttons; the audit gate `runtimeDoesNotAutoSearch` verifies
  the runtime source has no `fetch(`, `pagefind.search`,
  `ContentEngine.query`, or `runSearch(` call.
- English page parity (`/en/research/`, `/en/presentations/`,
  `/en/media/`) not implemented — documented as remaining work.
- No PF-PERF1, no writings restructuring, no Research semantic
  change, no outlet/source normalization, no `data-pagefind-body`.

## 4. Chips delivered

`/tutkimus/` (4 chips, target `#researchEvidenceExploreTopic`):

- Tekoäly
- Opettajankoulutus
- Koulutusteknologia
- Yhteisöllinen oppiminen

`/esitykset/` (5 chips, target `#presentation-archive-topic`):

- AI literacy
- Tekoäly
- Koulutusteknologia
- Opettajankoulutus
- Mobiilioppiminen

`/mediassa/` (5 chips, proxy `.click()` on existing
`data-media-filter` buttons):

- Lehtijutut → `[data-media-filter='type:article']`
- Videot → `[data-media-filter='type:video']`
- Podcastit → `[data-media-filter='type:podcast']`
- Tekoäly ja koulutus → `[data-media-filter='topic:tekoaly']`
- Avoin tiede → `[data-media-filter='topic:avoin']`

Total: **14 chips**. Audit gate confirms exactly `{ /tutkimus/: 4,
/esitykset/: 5, /mediassa/: 5 }` on the merged main build.

## 5. Intentional omissions

- **No Mobiilioppiminen chip on `/tutkimus/`** — `mobiilioppiminen`
  is not in the current Research `findExploreTopicOptions` on
  `src/fi/tutkimus.md`.
- **No "Data ja toimijuus" chip on `/tutkimus/`** — same reason;
  PF1 §13 explicitly qualified this chip as "only if already
  supported by existing topic/preset vocabulary".
- **No new topics invented** — chips reuse the exact string values
  already recognised by the target runtimes.
- **English chip parity not implemented** — English discovery
  pages (`/en/research/`, `/en/presentations/`, `/en/media/`) do
  NOT render chips. The `/esitykset/` chips are gated
  `{% if archiveLocale == "fi" %}` inside
  `src/_includes/presentations/archive.njk`. Deferred as
  remaining work.

## 6. Contrast / accessibility reconciliation

The initial PR head (`e4b4cdad`) failed CI on `tests/contrast.spec.js`
for the Presentations page: the chip's default fill
(`--bs-body-bg`, near white) sat on the archive's
`bg-body-tertiary` container with a component-fill ratio of
~1.08:1 vs the required 3:1 (`MIN_COMPONENT_CONTRAST` in
`tests/helpers/contrast.js`).

Fix applied in the amended commit `88107ebf` (CSS-only, in
`src/css/starter-chips.css`):

- Chip default: `background-color: transparent` +
  `border: 1px solid var(--bs-body-color)`. Fill alpha below the
  audit's 0.5 `hasVisibleFill` threshold, so the check falls to
  border-mode where `--bs-body-color` gives ≥15:1 contrast on
  light theme and ≥14:1 on dark.
- Hover: adds a 6% `--bs-body-color` overlay (still below the
  0.5 alpha threshold — remains border-mode).
- Pressed (`aria-pressed="true"`): border and text swap to
  `--bs-primary`, keeping fill transparent. Primary is a
  Bootstrap ≥3:1 non-text-contrast token on both themes.

No runtime, no chip config, no chip label, no target selector
changed. The navigation "Search dialog traps focus" failure
observed on the initial run was `1 flaky` (Playwright's
classification for tests that pass on retry) and unrelated to
PF-STARTER. Accessibility workflow (`Accessibility and navigation
tests`) is green on both the amended PR head SHA and the
post-merge main SHA.

## 7. Research boundary

Verified via `scripts/audit-f4-research-built-output.js` on the
merged main build:

| Kind | Eligible |
| --- | --- |
| publications | 53 |
| theses | 169 |
| writings | 62 |
| presentations | 33 |
| **total** | **317** |

- Research population unchanged from the F4 closure baseline.
- Research membership rule unchanged:
  `contexts.includes("research")`.
- Media is not enumerated in any Research surface.
- No `Sisältö:Tutkimus` chip anywhere (audit gate
  `noChipEmitsSisaltoTutkimus`).
- No topic mapping is used as Research membership.
- Browser smoke asserts `[data-find-explore-results]
  a[href^='/mediassa/']` count is 0 inside the Research mount
  even after a chip click.
- No chip on `/tutkimus/` introduces a topic value that is not
  already in `findExploreTopicOptions`.

## 8. Pagefind boundary

- No Pagefind metadata changed by chips (audit gate
  `noChipEmitsNewPagefindFacet`).
- No new Pagefind filter, meta, or sort added.
- No `data-pagefind-body` introduced (audit gates
  `noChipEmitsDataPagefindBody`, `noHtmlDetailUsesPagefindBody`
  from PF2, and `noDetailUsesPagefindBody` from M2 all pass).
- Pagefind index size after PF-STARTER: `fi:1163 / en:346` —
  identical to the plain-main baseline (from
  `_site/pagefind/pagefind-entry.json`). No collapse.
- Runtime does not call `pagefind.search` — audit gate
  `runtimeDoesNotAutoSearch`.

## 9. Archive boundary

- **Media archive cards unchanged** — chips sit above the existing
  filter groups inside `[data-media-browser]`; runtime unchanged
  (audit reverse-gate implicit via file-scope: only page templates
  + starter-chips runtime touched).
- **Presentation archive cards unchanged** — chips sit inside
  `[data-presentation-find-explore]` above the existing controls
  form. `src/js/presentations-page.js` unchanged.
- Chips are visually secondary (small pill buttons in a
  `.starter-chips-list`), not a replacement for search / filter.
- No archive card component redesign.

## 10. Verification

GitHub post-merge workflows on `3d63a609`:

- `Build and Deploy` — completed / success (`31940086704`).
- `Generate OG Images` — completed / success (`31940086705`).
- `Accessibility and navigation tests` — completed / success
  (`31940086724`).

Pre-merge local verification (on the exact PF-STARTER commit
`88107ebf`, run during the PF-STARTER implementation and
contrast-fix checkpoints):

- `npm run build:no-og` — green.
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf-starter-chips.js` — all 11 gates green;
  chips per page `{ /tutkimus/: 4, /esitykset/: 5, /mediassa/: 5 }`,
  no rogue chip on `/en/*`, no chip pre-pressed, no chip emits a
  Pagefind facet or `mediaOutlet` or `Sisältö:Tutkimus` or
  `data-pagefind-body`, runtime does not auto-search.
- `node scripts/audit-pf3-result-card-consistency.js` — all 9
  gates green.
- `node scripts/audit-pf2-sisalto-facet.js` — all 9 gates green
  (750 detail records).
- `node scripts/audit-media-pagefind-m2.js` — all gates green
  including the reverse `noDetailUsesPagefindBody` guard.
- `node scripts/audit-f4-research-built-output.js` —
  `totalResearchPopulation: 317`.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `tests/contrast.spec.js` — **14 / 14 pass** including
  Presentations (contrast-fix reconciliation).
- `tests/pf-starter-chips.spec.js` — **3 / 3 pass**.
- Sibling smokes (`f2-find-explore-smoke`,
  `f3a-theses-find-explore`, `f3b-publications-find-explore`,
  `f4-research-find-explore`, `pf2-sisalto-facet`,
  `pf3-result-card-consistency`, `media-archive`,
  `presentations-archive`, `presentations-research-smoke`) —
  **27 / 27 pass**.

Post-merge local re-verification was skipped because the merge is
a straight fast-forward of the identical tree that was already
pre-merge-verified at `88107ebf`, and the GitHub Pages deploy on
`3d63a609` completed successfully.

## 11. Remaining work

- **PF-PERF1 — Pagefind startup performance audit**: still queued.
  Keep audit-only until concrete slow-startup evidence lands.
- **Result-card hierarchy / card trim**: PF3 landed the visible
  content-family badge, but the per-family meta strip on the
  shared Find & Explore result cards still varies (theses show
  author line + type + year; writings show type + year;
  publications retain their rich card). Trimming or aligning the
  meta strip is a follow-up UX audit + implementation checkpoint.
- **Writings segmentation**: the PF1 open question about whether
  `scientificPublication` should remain visible inside
  `/kirjoitukset/` now that `Sisältö:Julkaisut` exists globally
  is still deferred.
- **Media outlet / source normalization**: `mediaOutlet` remains
  Pagefind meta only pending a normalization decision on the 28
  distinct outlet strings.
- **English starter-chip parity**: `/en/research/`,
  `/en/presentations/`, `/en/media/` do not yet render chips.
  Requires per-page English chip labels while keeping the same
  Finnish underlying filter values.

## 12. Next recommendation

**PF4 — Result-card hierarchy / card trim.**

Chips are now in place, but the earlier UX observation from PF1
§14 remains partially open: PF3 gave every result a visible
content-family badge, and PF-STARTER gave the top of each
discovery page a first-touch entry point. What's still noisy is
the per-family meta strip on Find & Explore result cards — the
information density varies from a bare year to a four-string row
(authors + type + year + venue for publications) with badges
below. The next user-facing improvement should audit the shared
result-card information hierarchy and decide which fields can be
trimmed or aligned without regressing publication richness.

PF-PERF1 remains queued behind PF4 unless concrete slow-startup
evidence appears.
