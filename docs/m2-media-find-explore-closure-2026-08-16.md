# M2 — Media Pagefind + Find & Explore Closure

Date: 2026-08-16
Status: Rollout closed. `feat: add media Find and Explore support` is on `main`.

## 1. Scope

Closure of the M2 workstream that made `/mediassa/` (FI) and `/en/media/`
participate in the shared Pagefind / Find & Explore architecture used
elsewhere on the site — additively, without redesigning the media page,
migrating media content, adding media to Research, or introducing a new
canonical model.

This document records what merged, what verified, and what did not
change.

## 2. PR and merge information

- PR: [#90 feat: add media Find and Explore support](https://github.com/LaruX75/www/pull/90)
- Merged: 2026-08-15T21:23:35Z by LaruX75
- Merge commit: `d4cde07e9fbe0ed6653b84bc8dcc60a3fc3155f6`
- Merge method: merge commit (repo convention).
- Head SHA at merge time: `335bc2d44011018e277adafbdc12bef8b2decef4`
  — protected via `gh pr merge --match-head-commit`.
- Included commits (in order):
  1. `b51b6bea docs: audit media Pagefind compatibility` (M1)
  2. `335bc2d4 feat: add media Find and Explore support` (M2)

## 3. Main / head verification

- `origin/main` HEAD at closure time: `d4cde07e9fbe0ed6653b84bc8dcc60a3fc3155f6`
- Local main worktree HEAD: `d4cde07e9fbe0ed6653b84bc8dcc60a3fc3155f6`
- `git log --oneline -4` on origin/main:
  - `d4cde07e Merge pull request #90 from LaruX75/codex/m2-media-find-explore-main`
  - `335bc2d4 feat: add media Find and Explore support`
  - `b51b6bea docs: audit media Pagefind compatibility`
  - `80487bc0 docs: close F4 Research Find and Explore rollout`
- No unexpected commits between the F4 close and the M2 merge.

## 4. Post-merge GitHub checks

All three post-merge workflows on `d4cde07e` completed successfully:

| Workflow | Status | Conclusion |
| --- | --- | --- |
| Build and Deploy | completed | success |
| Generate OG Images | completed | success |
| Accessibility and navigation tests | completed | success |

Started 2026-08-15T21:23:37Z, all completed within minutes.

## 5. M1 audit summary

The M1 audit (`docs/m1-media-pagefind-compatibility-audit-2026-08-15.md`)
established the current media stack against the shared Pagefind / Find &
Explore pattern:

- Model: proper Eleventy `media` collection (`src/media/*.md`) + a
  parallel global data mirror (`src/_data/mediaArchive.js`) used by the
  archive pages.
- 73 items, 100 % coverage on `mediaType`, `mediaRole`, `mediaOutlet`,
  `sourceUrl`, `categories`, `keywords`, `contexts` — no source
  migration needed.
- Pagefind baseline: every detail page indexed by default with only the
  `Kieli:` filter from `base.njk`; no `Sisältö:` filter, no per-item
  metadata; no shared preset.
- Research eligibility: only 2 / 73 items carry the `research` context
  (both inferred from free-text signals) — not authoritative for
  Research membership.
- Recommended M2 classification: **B — ready after metadata cleanup**
  (add per-item Pagefind attrs + a `Sisältö` scope; no data migration
  needed).

## 6. M2 implementation summary

Additive template + preset + tests changes. Files changed by the PR (11):

- `src/_includes/media-item.njk` — hidden Pagefind filter / meta / sort
  spans on the media detail layout.
- `src/fi/mediassa.njk` — `data-pagefind-ignore` on `#media-arkisto`;
  archive UI reads through the shared `FindExplore:media` preset via
  `ContentEngine.query('FindExplore:media')`.
- `src/en/media.njk` — `data-pagefind-ignore` on `#media-archive`.
- `src/_utils/contentPresets.js` — `+4` lines registering
  `"FindExplore:media": { source: "media", sort: "date-desc" }` alongside
  the existing `FindExplore:presentations` entry.
- `scripts/audit-media-pagefind-m2.js` — deterministic verification
  script (reverse-gates the site-wide `data-pagefind-body` regression;
  see §10).
- `tests/media-archive.spec.js` — Playwright smoke covering FI archive
  filters, per-item Pagefind attrs, and the EN archive ignore attribute.
- `docs/m2-media-pagefind-find-explore-2026-08-15.md`,
  `docs/data/m2-media-pagefind-audit-2026-08-15.json` — implementation
  report and machine-readable audit data.
- `docs/m1-media-pagefind-compatibility-audit-2026-08-15.md`,
  `docs/data/media-pagefind-compatibility-audit-2026-08-15.json`,
  `scripts/audit-media-pagefind-compatibility-m1.js` — M1 audit
  artifacts.

No production JS (`content-engine.js`, `pe-list-render.js`,
`content-presets.js` browser copy), no CSS, no data-layer utility other
than `contentPresets.js` was touched.

## 7. Media counts

Verified on `d4cde07e` from `src/media/*.md`, `_site/data/media.json`,
and the built `_site/mediassa/**` HTML:

| Metric | Value |
| --- | --- |
| Media items (source `src/media/*.md`) | 73 |
| Public projection (`/data/media.json`) items | 73 |
| Built detail pages under `/mediassa/…/` | 73 |
| Alias redirect (permalink typo shim) | 1 |
| Landings (FI `/mediassa/`, EN `/en/media/`) | 2 |
| External-only items (no local page) | 0 |

## 8. Pagefind metadata added

Each of the 73 built media detail pages emits these hidden attributes at
page-level (values from frontmatter and the language-aware macros in
`_media-macros.njk`):

- `data-pagefind-filter="Sisältö:Mediassa"`
- `data-pagefind-filter="Mediatyyppi:{{ FI or EN label }}"`
- `data-pagefind-filter="Rooli:{{ FI or EN label }}"`
- `data-pagefind-filter="Vuosi:YYYY"` — 70 / 73 items (see the note in
  the M2 report about 3 flat-slug items without authored dates)
- `data-pagefind-meta="mediaType:{{ raw value }}"`
- `data-pagefind-meta="mediaRole:{{ raw value }}"`
- `data-pagefind-meta="mediaOutlet:{{ raw value }}"`
- `data-pagefind-meta="year:YYYY"` — 70 / 73 items
- `data-pagefind-meta="date:YYYY-MM-DD"` — 70 / 73 items
- `data-pagefind-sort="date:YYYY-MM-DD"` — 70 / 73 items

`Kieli:Suomi` / `Kieli:English` continues to come from `base.njk` on
every page; not duplicated by M2.

## 9. FindExplore media preset

Registered in `src/_utils/contentPresets.js`:

```js
"FindExplore:media": {
  source: "media",
  sort: "date-desc"
}
```

Consumed by `src/fi/mediassa.njk` via
`ContentEngine.query('FindExplore:media')`. Same shape as
`FindExplore:presentations`. No new fields, no new endpoints, no engine
changes.

## 10. Pagefind body-gate finding

The **most important lesson** from this rollout, captured here so it is
not forgotten:

- The initial M2 implementation wrapped the media detail layout in
  `<div data-pagefind-body>` to give the per-item Pagefind record a
  narrow scope. On the isolated feature branch this looked fine.
- When the same change was reconciled onto current main, Pagefind's
  **site-wide body gate** kicked in: once any HTML file in the site is
  tagged with `data-pagefind-body`, Pagefind treats every page WITHOUT
  the marker as intentionally excluded and drops it from the index.
- Observed regression: Pagefind index dropped from `fi:1163 / en:346`
  pages to `fi:135 / en:15` pages; free-text search on Writings,
  Theses, Publications, and Research Find & Explore mounts stopped
  returning any results.
- Fix folded into the M2 commit that merged:
  - Removed the `<div data-pagefind-body>` wrapper from
    `src/_includes/media-item.njk`.
  - Kept all the hidden filter / meta / sort spans — they are
    page-scoped and do not trigger the site-wide gate.
  - Added a **reverse audit gate** `noDetailUsesPagefindBody` in
    `scripts/audit-media-pagefind-m2.js` that fails if any media detail
    page re-introduces `data-pagefind-body`.
  - Added a matching in-browser reverse assertion in
    `tests/media-archive.spec.js`.
  - Documented in the M2 report §18 "Main reconciliation".

Trade-off, deliberately accepted: media detail Pagefind records
continue to include header / footer / nav / news-ticker text, matching
how every other section indexes today. A coherent site-wide Pagefind
body scope belongs to a broader cross-archive workstream, not Media M2.

## 11. Archive over-indexing

Both `/mediassa/` (FI) and `/en/media/` used to be indexed as one large
document each, because the archive card grid was inside the default
Pagefind indexing region. After M2:

- FI `<section id="media-arkisto" data-pagefind-ignore>` excludes the
  card-grid region (18 SSR cards + 73 hydrated cards) from the FI
  landing's Pagefind record.
- EN `<section id="media-archive" data-pagefind-ignore>` excludes the
  73 SSR cards on the EN landing.
- Landings still appear as low-signal hero-only Pagefind records, so
  they remain discoverable without competing against per-item hits.

`data-pagefind-ignore` is region-scoped, not site-wide, so it does not
affect other pages.

## 12. Research boundary

Research is not changed by M2. Verified via
`scripts/audit-f4-research-built-output.js` on `d4cde07e`:

| Kind | Eligible |
| --- | --- |
| publications | 53 |
| theses | 169 |
| writings | 62 |
| presentations | 33 |
| **total** | **317** |

- Media is not enumerated in any Research scope.
- No `resolveContexts()` change.
- No `researchLine`, `researchTheme`, or `researchAudience` frontmatter
  added to any media item.
- The 2 media items with inferred `research` context remain classified
  by `inferContexts` free-text signal only — not authoritative Research
  membership.

## 13. Verification

GitHub post-merge workflows on `d4cde07e`:

- Build and Deploy — completed / success
- Generate OG Images — completed / success
- Accessibility and navigation tests — completed / success

Local gates on `d4cde07e` (clean main worktree, 2026-08-16):

- `npm run build:no-og` — green (1442 HTML documents indexed;
  `_site/pagefind/pagefind-entry.json` shows `fi:1163 / en:346` pages,
  matching plain-main baseline).
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-media-pagefind-m2.js` — all gates green, including
  the reverse `noDetailUsesPagefindBody` gate.
- `PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test
  tests/media-archive.spec.js --workers=1` — **3 / 3 pass**.
- `node scripts/audit-f4-research-built-output.js` —
  `totalResearchPopulation: 317`, media not enumerated.
- Sibling Find & Explore browser smokes via Eleventy dev server —
  **13 / 13 pass**:
  - `tests/f2-find-explore-smoke.spec.js`
  - `tests/f3a-theses-find-explore.spec.js`
  - `tests/f3b-publications-find-explore.spec.js`
  - `tests/f4-research-find-explore.spec.js`
  - `tests/presentations-archive.spec.js`
  - `tests/presentations-research-smoke.spec.js`

Sample media detail page (`/mediassa/2023/11/13/munoulu-tekoaly-…/`)
confirmed to carry all four expected filters:
`Sisältö:Mediassa`, `Mediatyyppi:Lehtijuttu`, `Rooli:Minusta tehty`,
`Vuosi:2023` — and zero occurrences of `data-pagefind-body`.

## 14. Known non-goals

- No media Research rollout. Media is not added as a fifth Research
  scope.
- No new canonical media model. The existing `src/media/*.md`
  collection, layout, and `/data/media.json` projection were reused.
- No outlet / source user-facing facet. `mediaOutlet` remains as
  Pagefind meta only pending a normalization decision.
- No Pagefind startup performance optimization (PF-PERF1 is a separate,
  queued workstream).
- No visual redesign of the FI or EN media archive.
- No presentations / F3C changes.

## 15. Remaining limitations

- Outlet / source strings (28 distinct values, some compound like
  `Generation AI / YouTube`, `INOS Project / YouTube`,
  `YouTube / Jari Laru`) still need normalization before a user-facing
  outlet facet can be published without fragmenting.
- Media `contexts` remain inferred, not authoritative — do not use them
  as Research membership signals downstream.
- Global Pagefind body strategy is unchanged. All detail pages across
  the site index full `<body>` (including nav / footer / news ticker).
  Introducing a coherent site-wide `data-pagefind-body` scope is a
  cross-archive project; the M2 reverse gate only protects media
  from single-handedly triggering the gate.
- Item body text on media detail pages is short (200–400 characters
  authored per item); Pagefind quality remains best on
  title / description / metadata rather than long-form text.
- Media detail pages for the 3 flat-slug items
  (`inos-project-interview-heis-open-science`,
  `ep-115-dr-jari-laru`,
  `kuinka-koulutus-vastaa-aikamme-haasteisiin-…`) intentionally lack
  `Vuosi:` / `year` / `date` metadata because their frontmatter has no
  authored publication date.

## 16. Next recommended step

**PF1 — user-facing discovery model audit.** Now that media is
conformant with the same Pagefind attribute vocabulary as the other
archives (`Sisältö:…`), audit the site-wide discovery UX: which
`Sisältö` values should exist, which filters should appear on the
global search, and whether writings / theses / publications /
presentations should adopt the same `Sisältö:…` filter shape media
now uses. This is prerequisite work for a coherent global-search
experience.

**PF-PERF1 — Pagefind startup performance audit** remains queued and
should follow PF1 unless startup slowness becomes urgent independently.
