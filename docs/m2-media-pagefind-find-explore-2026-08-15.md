# M2 — Media Pagefind Metadata + Find & Explore Preset

Date: 2026-08-15
Status: Implementation. Additive, template + preset + tests only.
Baseline audit: `docs/m1-media-pagefind-compatibility-audit-2026-08-15.md`
M2 verification data: `docs/data/m2-media-pagefind-audit-2026-08-15.json`
M2 verification script: `scripts/audit-media-pagefind-m2.js`

## 1. Scope

Add item-level Pagefind metadata to media detail pages and register the
`FindExplore:media` shared preset so `/mediassa/` participates in the
same discovery architecture as other archives — without redesigning the
media page, migrating content, changing URLs, changing Research
membership, or introducing a new canonical model.

Explicit non-goals: no research-scope changes (media is not added to
`/tutkimus/`), no data normalization beyond display labels, no fork of
the shared discovery stack, no removal of the existing archive
filter UI, no change to the FI/EN both-list-all-73 behavior.

## 2. M1 baseline

M1 established (unchanged after M2):

- 73 media items in `src/media/*.md`
- 73 / 73 local detail pages (70 date-partitioned, 3 flat-slug)
- 72 items `lang: fi`, 1 item `lang: en`
- 0 external-only items
- Contexts populated on all 73 (2 with `research`, inferred)
- 100 % coverage for `mediaType`, `mediaRole`, `mediaOutlet`,
  `categories`, `keywords`
- Baseline Pagefind indexing existed via full-body indexing, but no
  content-type filter, no per-item metadata, no shared preset

M2 preserves each of these facts; the counts in
`docs/data/m2-media-pagefind-audit-2026-08-15.json` under `counts`
confirm the projection still emits 73 items.

## 3. Current branch / repo state

- Branch: `feat/canva-analysis-data-driven`
- HEAD before M2: `eef968bf` (the M1 audit commit)
- HEAD after M2 commit: see final response below
- `origin/main` HEAD: `0ee12e7b`
- Merge-base with main: `d7dd44ea`

Branch is still behind main by ~15 commits (theses/writings Find &
Explore v1 landed there after this branch's merge-base). M2 was
implemented directly on this branch, as the prompt instructed, using
the media stack that exists here today. No shared-discovery patterns
from main are relied on. A future rebase onto main will interact only
with `src/_utils/contentPresets.js` (a single dictionary entry) and
with `src/_includes/media-item.njk` (a scope wrapper); neither is
expected to conflict with what landed on main.

Unrelated dirty presentations / F3C P6 / F4 work in the tree was NOT
staged in the M2 commit.

## 4. Implementation summary

Files changed by M2 (all additive):

- `src/_includes/media-item.njk` — wrap the two content sections in
  `<div data-pagefind-body>…</div>`; add hidden spans at the top of
  the wrapper for `data-pagefind-filter` (Sisältö, Mediatyyppi, Rooli,
  Vuosi), `data-pagefind-meta` (mediaType, mediaRole, mediaOutlet,
  year, date), and `data-pagefind-sort` (date). Values come from
  existing frontmatter and the existing `_media-macros.njk` label
  functions — no data mutation, no new frontmatter, no new labels.
- `src/fi/mediassa.njk` — mark the archive-browser section
  `data-pagefind-ignore` so the 18-card SSR opening set (which the
  client-side loader expands to all 73) is not indexed as one giant
  landing record. Also switch
  `ContentEngine.query({ source: 'media' })` to
  `ContentEngine.query('FindExplore:media')` so the page consumes the
  shared preset by name.
- `src/en/media.njk` — mark the `#media-archive` section
  `data-pagefind-ignore` for the same reason as the FI landing (the
  EN page SSRs all 73 items directly). No behavior change beyond
  Pagefind scoping.
- `src/_utils/contentPresets.js` — register a new preset entry:
  `"FindExplore:media": { source: "media", sort: "date-desc" }`.
  Mirrors the shape of the existing `FindExplore:presentations`
  preset. No FIELD_RULES, ENDPOINTS, or matcher changes.

New files:

- `scripts/audit-media-pagefind-m2.js` — deterministic verification
  script.
- `tests/media-archive.spec.js` — Playwright browser smoke test.
- `docs/m2-media-pagefind-find-explore-2026-08-15.md` — this report.
- `docs/data/m2-media-pagefind-audit-2026-08-15.json` — machine data
  emitted by the verification script.

No production JS files (`content-engine.js`, `pe-list-render.js`,
`content-presets.js`) were touched. No CSS was touched. No
`_data/*` or `_utils/*` module other than `contentPresets.js` was
touched.

## 5. Pagefind metadata added

Each of the 73 built media detail pages now emits, before the visible
hero section, hidden spans with the following attributes (values are
derived from frontmatter and language-aware macros; the FI value
below is illustrative for a Finnish article by MuOulu):

- `data-pagefind-filter="Sisältö:Mediassa"`
- `data-pagefind-filter="Mediatyyppi:{{ FI or EN label }}"`
  (FI examples: `Lehtijuttu`, `Video`, `Podcast`, `Radio`,
  `Asiantuntijatehtävä`, `Tiedote`; EN mirrors the shared macro)
- `data-pagefind-filter="Rooli:{{ FI or EN label }}"`
  (FI examples: `Minusta tehty`, `Vieraana`, `Haastattelijana`,
  `Asiantuntijarooli`)
- `data-pagefind-filter="Vuosi:YYYY"` — emitted only when
  frontmatter carries a `date` (70 / 73 items; the 3 flat-slug items
  without authored dates intentionally get no `Vuosi:` filter rather
  than a misleading value derived from file mtime)
- `data-pagefind-meta="mediaType:{{ raw value }}"`
- `data-pagefind-meta="mediaRole:{{ raw value }}"`
- `data-pagefind-meta="mediaOutlet:{{ raw value }}"` (metadata only —
  not user-facing as a filter; see §9)
- `data-pagefind-meta="year:YYYY"` — 70 / 73 items
- `data-pagefind-meta="date:YYYY-MM-DD"` — 70 / 73 items
- `data-pagefind-sort="date:YYYY-MM-DD"` — 70 / 73 items

`Kieli:` filter is still supplied by `src/_includes/base.njk` on
every page; not duplicated by M2.

Coverage on the 73 built detail pages (from the M2 verification
audit):

| Attribute | Coverage |
| --- | --- |
| `data-pagefind-body` | 0 / 73 (reverse gate — see §18) |
| `Sisältö:Mediassa` filter | 73 / 73 |
| `Mediatyyppi:` filter | 73 / 73 |
| `Rooli:` filter | 73 / 73 |
| `mediaType` meta | 73 / 73 |
| `mediaRole` meta | 73 / 73 |
| `mediaOutlet` meta | 73 / 73 |
| `Vuosi:` filter | 70 / 73 (3 undated) |
| `year` / `date` meta + `date` sort | 70 / 73 (3 undated) |

The 3 items without year/date meta are exactly the 3 flat-slug items
identified in M1 (`inos-project-interview-heis-open-science`,
`ep-115-dr-jari-laru`, `kuinka-koulutus-vastaa-aikamme-haasteisiin-…`)
whose frontmatter has `mediaOrder` but no `date`. Emitting a `Vuosi`
value based on file mtime would misrepresent them.

## 6. FindExplore:media preset

Registered in `src/_utils/contentPresets.js`:

```js
"FindExplore:media": {
  source: "media",
  sort: "date-desc"
}
```

Mirrors the existing `FindExplore:presentations` entry in shape and
sort semantics. Uses the already-registered `ENDPOINTS.media`
(`/data/media.json`) and `SOURCE_TO_COLLECTION.media` mappings — no
additional plumbing was needed.

The FI archive page now consumes it via the shared engine facade:

```js
const { items } = await window.ContentEngine.query('FindExplore:media');
```

`content-engine.js` already handled both raw-spec and named-preset
inputs, so no engine change was required.

## 7. Media archive behavior

FI (`/mediassa/`):

- Hero, KPIs, feature grid, and cross-link section unchanged
  visually.
- Archive browser section now carries `data-pagefind-ignore` on the
  outer `<section id="media-arkisto">`. The filter buttons, card
  grid, and pagination controls behave exactly as before; only their
  presence in the landing's Pagefind record is removed.
- The client-side data fetch goes through the shared preset name
  (`FindExplore:media`) instead of a raw spec. Same fetch target,
  same sorting, same items.
- SSR opening set (18 cards) still renders identically.
- Progressive-enhancement fallback (no-JS) still shows the SSR
  opening set and the `/data/media.json` link, unchanged.

EN (`/en/media/`):

- Hero, roles-panel, and related-routes sections unchanged.
- `#media-archive` section (which SSRs all 73 cards) is now
  `data-pagefind-ignore`. No layout, no ordering, no wording change.

Neither page's URL, title, description, structured-data, or nav
integration changed.

## 8. User-facing filters

Required M2 filters status:

- Free-text search: available via the global Pagefind search
  (results now carry the `Sisältö:Mediassa` filter, so a global
  search can be narrowed to media). The FI archive's own filter UI
  still supports its topic/type/role buttons page-locally.
- Media type: exposed as Pagefind filter `Mediatyyppi:…` (FI/EN
  labels) and as `mediaType:` meta (raw values).
- Year: exposed as Pagefind filter `Vuosi:YYYY` on the 70 dated
  items.
- Language: `Kieli:Suomi` / `Kieli:English` from `base.njk`
  unchanged.

Recommended optional filters:

- Media role: exposed as Pagefind filter `Rooli:…` (FI/EN labels)
  and as `mediaRole:` meta.

Deferred:

- Outlet as user-facing filter — kept as `mediaOutlet:` meta only
  (see §9).
- Research / Politics context filters — intentionally not exposed
  (M1 finding: too few items, inference-only, not authoritative).

## 9. Outlet / source decision

M2 preserves 100 % outlet coverage in `mediaOutlet:` Pagefind meta on
all 73 detail pages, but does not expose outlet as a Pagefind filter
or a Find & Explore control. Reason: outlet values are 100 % populated
but partially fragmented across 28 distinct strings (M1 §10) including
compound forms like `Generation AI / YouTube`, `INOS Project /
YouTube`, `YouTube / Jari Laru`. A user-facing outlet filter would
fragment the facet and confuse users. Emitting meta keeps the data
available for future UI or analytics use without publishing a
half-normalized facet.

## 10. Language behavior

Preserved from M1:

- FI `/mediassa/` and EN `/en/media/` both list all 73 items.
- Each item has one canonical detail page at
  `/mediassa/…/` regardless of item `lang`.
- Detail pages inherit `lang: fi` from the layout data, except for
  the 1 English item which sets `lang: en` explicitly. `base.njk`
  emits `Kieli:Suomi` or `Kieli:English` accordingly on each page.
- M2 does not add per-item language routing and does not split the
  archive by item language.

## 11. Global search behavior

Before M2:

- Media pages were indexed by default (whole `<body>`).
- No filter could narrow global search to media.
- The landing page was indexed as one large document covering the
  full 73-card archive, competing with per-item results.

After M2:

- Media detail pages contribute cleanly scoped per-item records
  (`data-pagefind-body` limits indexed content to the item content).
- Global search can filter to `Sisältö:Mediassa` and further to
  `Mediatyyppi:…`, `Rooli:…`, `Vuosi:…`, `Kieli:…`.
- The FI and EN landings still appear as low-signal hero-only
  records (only the hero, KPIs, feature grid, and cross-link
  sections are indexed; the archive card grid is `data-pagefind-ignore`).
- No media page was removed from Pagefind. The Pagefind entry
  metadata (`_site/pagefind/pagefind-entry.json`) reports index
  presence for both fi and en with existing page counts.

## 12. Research non-inclusion verification

- Media items with `research` context (from inference): still 2 /
  73. Not authoritative.
- `/tutkimus/` (FI) and `/en/research/` (EN) were not touched.
- No preset named `FindExplore:research` was created; the only new
  preset entry is `FindExplore:media`.
- No `researchLine`, `researchTheme`, `researchAudience` frontmatter
  was added to any media item.
- No `data-find-explore` mount, `data-find-explore-kinds` list, or
  Research runtime module was added or changed.
- Media is not enumerated as a Research scope anywhere. Current
  Research scopes on this branch remain as documented in
  `docs/f4-r0-existing-cross-content-semantics-audit-2026-08-15.md`
  (no live `/tutkimus/` Find & Explore runtime on this branch, only
  curated pages and topic composition).

Constraint restated: inferred media contexts are still not used for
Research membership. This M2 changes nothing about Research.

## 13. Audits / tests

Ran:

- `npm run build:no-og` — full Eleventy build + Pagefind + SEO
  dashboard + researchfi integrity check. Green.
- `npm run test:unit` — 400 / 400 pass, 0 fail.
- `node scripts/audit-media-pagefind-m2.js` — all 14 gates green
  (see `docs/data/m2-media-pagefind-audit-2026-08-15.json`).
- Playwright `tests/media-archive.spec.js` against a static
  `_site` server — 3 / 3 pass (FI filter interactions + FI detail
  page metadata + EN landing ignore).

Global search sanity:

- `_site/pagefind/pagefind-entry.json` present with fi and en
  language entries.
- Strings scan of `_site/pagefind/filter/*.pf_filter` confirms the
  new filter labels (`Sisältö` value `Mediassa`, `Mediatyyppi`,
  `Rooli`) reached the Pagefind index.

Research regression:

- Not run: no Research code paths, templates, or presets touched.

Other archive regressions:

- `tests/presentations-archive.spec.js` — this test file was
  already in the working tree as an untracked, in-progress F3C P6
  artifact **before** M2 began (see M1 report §2). Running it here
  reproduces its pre-existing failure. M2 did not touch any
  presentations template, presentation preset, or presentation JS
  beyond the additive `FindExplore:media` PRESETS entry. The
  presentations test failure is unrelated to M2 and is inherited
  from the in-progress work already on the branch.
- Unit tests covering canonical content, publications, theses, and
  writings continue to pass.

## 14. Accessibility

- Every Pagefind metadata element added by M2 is a `<span hidden …>`
  or a `data-pagefind-ignore` attribute — none are focusable, none
  affect visual layout, none change ARIA semantics.
- The archive browser filter UI (buttons, live-region status,
  pagination) is unchanged; keyboard order, focus visibility,
  labelling, and `aria-live="polite"` behavior are preserved.
- The `data-pagefind-body` wrapper is a plain `<div>` with no
  role / ARIA change; sighted and screen-reader flow is unaffected.
- `data-pagefind-ignore` on landing archive sections does not hide
  content from users — it only excludes those regions from the
  Pagefind index.

Full a11y suite (`test:a11y`) was not re-run because no visible UI
or ARIA change was introduced. If future M2-adjacent work touches
the archive filter UI, running the full suite is recommended.

## 15. Performance

Measured post-M2 HTML sizes (bytes):

| Page | Bytes |
| --- | --- |
| `/mediassa/2023/11/13/…-luova-luokka-…/` | 106 044 |
| `/mediassa/index.html` (FI landing) | 152 393 |
| `/en/media/index.html` | 223 949 |

Delta introduced by M2 (source-side):

- Media detail: +1 opening `<div data-pagefind-body>`, +1 closing
  `</div>`, 6 hidden spans (Sisältö + Mediatyyppi + Rooli + Vuosi
  + up to 3 meta lines + date sort). Approximate per-page increase:
  ≈ 800 bytes (≈ 0.75 % of a typical detail page).
- FI landing: +1 `data-pagefind-ignore` attribute on one existing
  section (≈ 20 bytes).
- EN landing: +1 `data-pagefind-ignore` attribute on one existing
  section (≈ 20 bytes).
- No new stylesheet, no new script, no new inline JS blob, no new
  server-rendered card, no additional client-side fetch.
- Total across 73 detail pages: ≈ 58 KB added to built HTML.

Result: modest, matches the "modest change" expectation of the M2
prompt.

## 16. Remaining limitations

- Item body text is short (typically 200–400 characters of authored
  content per detail page). Pagefind hits will remain best-quality
  for title / description / metadata queries; free-text quality is
  bounded by source content, unfixable in M2.
- 3 flat-slug items lack authored dates and therefore lack `Vuosi:`
  / `year` / `date` metadata. This is deliberate (avoiding
  file-mtime-derived misinformation) and matches how M1 already
  documented the shape of the source.
- Outlet remains meta-only (not user-facing) pending a
  normalization decision on the 28 distinct outlet strings.
- The FI archive still uses its own client-side topic aliases
  (`politiikka`, `tekoaly`, `avoin`, `paikallinen`). Not touched by
  M2 — that lives inside the existing archive UI and is unrelated
  to Pagefind scoping.
- Media is still not a Research scope; that constraint is a
  deliberate M2 boundary and is documented in §12.
- The presentations-archive Playwright spec that ships in this
  branch's working tree (from unfinished F3C P6 work) fails
  independently of M2. Reproducing and fixing it belongs to the
  presentations workstream, not M2.

## 17. Recommended next step

Rebase this branch on `origin/main` before further Find & Explore
work: main carries the Theses / Writings F&E v1 patterns that the
M2 preset can align with (shared Sisältö vocabulary in particular).
After the rebase, the smallest useful follow-up is to introduce the
`Sisältö:` filter vocabulary consistently on writings, theses,
publications, and presentations detail pages so global Pagefind
search offers a coherent content-type facet across all archives. Media
is now ready to fit into that shared vocabulary without further
migration.

## 18. Main reconciliation

M2 was ported onto `origin/main` at
`80487bc0 docs: close F4 Research Find and Explore rollout` as part
of the M2-BR1 checkpoint on 2026-08-16.

- Base main SHA: `80487bc0f112a28854bf380a0e107c7a39c47f94`
- Cherry-picks: `eef968bf` (M1 audit) and `4ebaa616` (M2 impl); one
  additive conflict in `src/_utils/contentPresets.js` where main's
  `FindExplore:presentations` preset from F4 needed to coexist with
  the new `FindExplore:media` — resolved by keeping both entries.
- F4 Research rollout was present on main before M2 was applied.
- F4 audit `scripts/audit-f4-research-built-output.js` post-M2:
  `publicationsEligible: 53`, `thesesEligible: 169`,
  `writingsEligible: 62`, `presentationsEligible: 33`,
  `totalResearchPopulation: 317`. **Unchanged** by M2. Media is
  not a Research scope.
- Pagefind index population on main baseline (before M2):
  `fi: 1163` pages, `en: 346` pages.
- Pagefind index population on main after M2 with the fixed
  media layout: `fi: 1163` pages, `en: 346` pages. **Unchanged.**

**Reconciliation fix: removed `data-pagefind-body` from media
detail pages.** The original M2 wrapped the media detail layout in
`<div data-pagefind-body>` to scope the per-item Pagefind record. On
the feature branch that used a build state where many detail pages
were already using page-scoped indexing, the effect went unnoticed.
On the full main site, however, Pagefind treats `data-pagefind-body`
as a **site-wide gate**: once any HTML file in the site is tagged,
Pagefind assumes pages missing the marker are not intended to be
indexed and drops them. Applying the original M2 to main dropped the
Pagefind index from 1163 fi / 346 en pages down to 135 fi / 15 en
pages, and broke the free-text search on the Writings, Theses,
Publications, and Research Find & Explore mounts.

Fix (kept the visible layout and all metadata):

- Removed the `<div data-pagefind-body>` wrapper (and its closing
  `</div>`) from `src/_includes/media-item.njk`.
- Left the hidden `data-pagefind-filter`, `data-pagefind-meta`, and
  `data-pagefind-sort` spans in place — they work at page-level
  without triggering Pagefind's site-wide body gate.
- `data-pagefind-ignore` on the FI/EN archive card grids is
  unaffected (that attribute is region-scoped, not site-wide).
- `scripts/audit-media-pagefind-m2.js` now enforces a **reverse
  gate**: `noDetailUsesPagefindBody` fails if any media detail page
  re-introduces `data-pagefind-body`, protecting the site-wide
  Pagefind index from a similar regression in future.
- `tests/media-archive.spec.js` asserts the same reverse invariant
  in-browser.

Trade-off: media detail Pagefind records still include header /
footer / nav / news-ticker text (the pre-M2 M1 baseline). This is
identical to how the Writings, Theses, Publications, and
Presentations detail pages are currently indexed on main — none of
them uses `data-pagefind-body` either. Introducing a site-wide
Pagefind body scope belongs to a broader cross-archive workstream,
not to Media M2.

Final verification on this main-based branch:

- `npm run build:no-og`: green (1442 HTML documents indexed).
- `npm run test:unit`: 401 / 401 pass.
- `node scripts/audit-media-pagefind-m2.js`: all gates green.
- `PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test
  tests/media-archive.spec.js --workers=1`: 3 / 3 pass.
- `DISABLE_OG_IMAGES=true npx playwright test
  tests/f2-find-explore-smoke.spec.js
  tests/f3a-theses-find-explore.spec.js
  tests/f3b-publications-find-explore.spec.js
  tests/f4-research-find-explore.spec.js
  tests/presentations-archive.spec.js
  tests/presentations-research-smoke.spec.js --workers=1`:
  13 / 13 pass.
- `node scripts/audit-f4-research-built-output.js`: Research
  population 317 unchanged; media not included.
