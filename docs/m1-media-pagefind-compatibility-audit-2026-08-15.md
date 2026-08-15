# M1 — Media Pagefind Compatibility Audit

Date: 2026-08-15
Status: Audit only. No implementation. No product code touched.
Generator: `scripts/audit-media-pagefind-compatibility-m1.js`
Machine data: `docs/data/media-pagefind-compatibility-audit-2026-08-15.json`

## 1. Scope

This checkpoint audits the current state of the media section and asks a single
question: what is the minimal safe path to make `/mediassa/` (and the paired
`/en/media/`) participate in the same Pagefind / Find & Explore architecture
used by publications, theses, writings, presentations, and the emerging
research contextual discovery?

The audit is read-only. It inspects:

- media source content
- media page templates and layout
- the public media JSON projection
- current Pagefind attributes present in built output
- existing context and taxonomy semantics
- how media currently participates (or does not participate) in the shared
  content engine

It does not modify data, metadata, templates, routes, CSS, JS, canonical
contracts, presentations, theses, writings, publications, research rollout,
or global navigation.

## 2. Repository state

- Current branch: `feat/canva-analysis-data-driven`
- HEAD: `506e1211ae3360647fa9518fa66acf72b561b750`
- `origin/main` HEAD: `0ee12e7b983df0abbe5e5d188c66a37b67aba77e`
- Merge-base: `d7dd44ea` (this branch diverges from main before the F2/F3A
  work landed on main)

Ahead / behind:

- Ahead of main: 4 commits, all presentations-related (route-card,
  Pagefind hardening, topic mapping, coverage reconciliation).
- Behind main: 15+ commits, including the theses Find & Explore pilot
  (`face314c`), the writings Find & Explore pilot (`b8475336`), the
  Find & Explore architecture audit (`7594fd98`), the canonical content
  v1 closure (`9aee5cc8`), and multiple docs commits.

Working tree:

- Presentations-related modified sources (`src/_includes/presentations/*`,
  `src/_utils/contentPresets.js`, `src/css/presentations-page.css`,
  `src/en/presentations.njk`, `src/esitykset.njk`,
  `src/js/presentations-page.js`).
- Modified `.cache/api-fallback/*` and modified `docs/data/*` for the
  in-flight F3C P5/P6 presentation work.
- Untracked F3C P6 and F4 R0/R0b docs, an untracked audit script, an
  untracked `src/_includes/presentations/result-card.njk`, and an
  untracked `tests/presentations-archive.spec.js`.

None of the above modifies media data, media templates, media data
projections, or media-adjacent shared code. The audit deliverables
introduced by this M1 checkpoint (`scripts/audit-media-pagefind-…m1.js`,
`docs/m1-…-2026-08-15.md`, `docs/data/media-…-2026-08-15.json`) are the
only additions related to media.

**Important:** because this branch is behind `main`, this audit describes
the media stack that exists on this branch. The Theses/Writings F&E
patterns that landed on main were reviewed via `git log`, not read at
their current source paths. Any prerequisite that references those
patterns must be re-verified against `main` before implementation.

Unrelated dirty files excluded from the audit commit? YES.

## 3. Media source files

Authoritative media sources on this branch:

- `src/media/*.md` — 73 markdown items (one per media appearance).
- `src/media/media.11tydata.js` — directory-level Eleventy computed
  data: `layout: media-item.njk`, `contexts: resolveContexts(data)`,
  computed tags (`media`, `media_<role>`, `media_type_<type>`),
  date-based permalink `/mediassa/YYYY/MM/DD/slug/` with flat
  `/mediassa/{slug}/` fallback for undated items.
- `src/_data/mediaArchive.js` — global data. Reads all
  `src/media/*.md`, parses frontmatter, sorts by date desc then
  `mediaOrder` desc then title, and returns
  `{ all, about, expertAssignments, guest, interviewer }`. This is
  the array actually rendered by `/mediassa/` and `/en/media/`.
- `src/data/media.json.11ty.js` — public JSON projection at
  `/data/media.json`. Delegates to `serializeItems(collections.media)`
  from `src/data/_shared.js`, which routes each item through
  `src/_utils/toPublicContentRecord.js`.
- `src/fi/mediassa.njk` — FI archive page with hero, feature grid,
  browser (client-side filter + pagination), and cross-links.
- `src/en/media.njk` — EN archive page. Curated (no client-side
  filtering / no PE hydration); simply loops `mediaArchive.all` and
  renders cards.
- `src/_includes/media-item.njk` — detail-page layout used by every
  `src/media/*.md`.
- `src/_includes/_media-macros.njk` — shared macros
  `mediaTypeLabel(type, lang)`, `mediaRoleLabel(role, lang)`,
  `itemUrl(item)`.
- `src/css/media-page.css` — media-specific styling.
- `src/js/external-media-consent.js` — embed consent helper (used
  for external iframe embeds; not related to media collection).

Eleventy config: `.eleventy.js` does not `addCollection("media", …)`
explicitly. `data.collections.media` is populated automatically by the
`media_*` tags set in `src/media/media.11tydata.js` (`tags: ["media", …]`).

## 4. Current media model

Classification (per Section 5 of the prompt): **A — proper Eleventy
collection**, plus a global data mirror.

- Each media appearance is a first-class markdown file in `src/media/`
  with normalized frontmatter.
- The Eleventy `media` collection is auto-derived from the `media` tag
  applied in `media.11tydata.js`.
- `src/_data/mediaArchive.js` is a parallel read of the same files
  used at render time for the archive pages (rather than
  `collections.media`, because the archive page needs role-based
  buckets computed at data time).
- Each item has a stable local detail page under
  `/mediassa/YYYY/MM/DD/slug/` (70 items) or `/mediassa/{slug}/`
  (3 undated items).
- Frontmatter fields observed across the 73 items:
  `title`, `description`, `date`, `mediaRole`, `mediaType`,
  `mediaOutlet`, `mediaOrder`, `sourceUrl`, `thumbnail`,
  `categories`, `keywords` (plus per-item optional
  `roleTitle`, `appointingBody` on expert-assignment items).

Field coverage per item (source, `src/media/*.md`):

| Field | Coverage |
| --- | --- |
| title | 73 / 73 |
| description | 73 / 73 |
| date | 73 / 73 |
| mediaType | 73 / 73 |
| mediaRole | 73 / 73 |
| mediaOutlet | 73 / 73 |
| sourceUrl (external) | 73 / 73 |
| url (local detail page) | 73 / 73 |
| categories | 73 / 73 |
| keywords | 73 / 73 |
| contexts (resolved) | 73 / 73 |
| thumbnail | 67 / 73 |
| body content | 73 / 73 (avg ~200-400 chars; short summaries, not transcripts) |

## 5. Media item counts

Counts from the built public projection at `_site/data/media.json`
(`count: 73`, schema version 1):

- Total items: **73**
- Finnish (`lang: fi`): **72**
- English (`lang: en`): **1** (`inos-project-interview-heis-open-science`)
- Items with local detail page (unique `url` under `/mediassa/…`): **73**
- Items with external `sourceUrl`: **73**
- External-only items (no local detail page): **0**
- Items with date/year: **73**
- Items missing date/year: **0**
- Items with `mediaType`: **73**
- Items missing `mediaType`: **0**
- Items with explicit or inferred `contexts`: **73**
- Items with `research` context: **2**
- Items with `teaching` context: **30**
- Items with `education` context: **39**
- Items with `politics` context: **3**
- Items with `open-science` context: **6**
- Items with `business` context: **4**
- Items with `personal` context: **1**
- Items with `media` context: **73** (baseline: `resolveContexts`
  always adds `media` when `inputPath.includes("/media/")`)
- Items with categories: **73**
- Items with keywords: **73**

Enough text for meaningful Pagefind indexing:

- Each detail page renders the media hero (title, description /
  subtitle), a full metadata sidebar (type, role, outlet, date, plus
  `roleTitle`/`appointingBody` where applicable), the short markdown
  body (typically 1–3 short paragraphs), and a context sidebar. This
  is thin but non-empty per page (roughly 200–400 characters of
  authored body per item, plus ~1 KB of surrounding metadata text).
- The archive landing page currently exposes the full 73-item
  archive plus curated highlights, and its `<body>` includes every
  card label, title, description, and category strip — which means
  Pagefind currently over-indexes it (see §7).

## 6. Field coverage (projection)

The public projection at `/data/media.json` currently emits these
fields per item (sample keys, all present on every item unless noted):

`id, url, title, description, date, year, lang, contentType,
contentTypeLabel, section, categories, keywords, contexts, mediaType,
mediaRole, mediaOutlet, sourceUrl, thumbnail, taxonomyTypeKey,
taxonomyTypeLabel`.

Notable observations:

- `contentType = "mediaItem"` is derived from `inputPath.includes("/media/")`
  in `src/_utils/contentPresets.js` (line 89) since the frontmatter does
  not set a canonical `contentType`.
- `contexts` are the resolver output — `media` on all 73 items, plus
  additional contexts inferred from categories, keywords, roles, and
  free-text signals (`inferContexts` in `src/_data/contentContext.js`).
- `mediaType` values seen: `video`, `article`, `podcast`, `pressRelease`,
  `assignment`, `radio` (see §10).
- `mediaRole` values seen: `about`, `guest`, `expertAssignment`,
  `interviewer` (see §10).
- 28 distinct `mediaOutlet` values (see machine data for the full
  list; includes `MuOulu`, `Kaleva`, `Rantapohja`, `Acatiimi`,
  `Oulun yliopisto`, `MTV Uutiset`, `YouTube`, `Radio Kaleva`,
  `SoundCloud / Jari Laru`, `INOS Project / YouTube`, …).

## 7. Current Pagefind status

Pagefind currently indexes every built media page **by default** (no
`data-pagefind-body` scope narrowing anywhere in the site — the entire
`<body>` is indexed, matching how presentations, writings, and
publications are indexed today).

Scan of built media HTML (76 files: 73 dated detail pages + 3 flat-slug
detail pages + `/mediassa/index.html` + `/en/media/index.html`):

| Pagefind attribute | Presence |
| --- | --- |
| `data-pagefind-body` | 0 files (nothing anywhere in `_site`) |
| `data-pagefind-meta` (custom metadata) | 0 files |
| `data-pagefind-filter="Sisältö:…"` (content-type filter) | 0 files |
| `data-pagefind-filter="Kieli:…"` (language filter) | 76 files (comes from `src/_includes/base.njk:24`) |
| `data-pagefind-sort` | 0 files |
| `data-pagefind-lang="Suomi"` / `="English"` | 76 files (nav search UI) |
| `data-pagefind-ui` | 76 files (nav search UI) |
| `data-pagefind-placeholder` | 76 files (nav search UI) |

Findings:

- Media items **are** in the Pagefind index: 73 individual detail pages
  and the two landing pages are all built and picked up by the
  `postbuild:no-og` `run-pagefind.js` step. `_site/pagefind/` is
  populated (see `_site/pagefind/pagefind.fi_*.pf_meta` /
  `pagefind.en_*.pf_meta`).
- The only filter Pagefind sees for media is `Kieli:Suomi` (or
  `Kieli:English` for `/en/media/`).
- There is **no per-item Pagefind metadata**: no `data-pagefind-meta`
  for `mediaType`, `mediaRole`, `mediaOutlet`, `date`, or `contexts`.
- There is **no shared `Sisältö:` filter** letting a user narrow global
  search to media. This is not unique to media — the wider site also
  does not currently emit a content-type Pagefind filter.
- The archive page (`/mediassa/index.html`) is a heavy record: because
  no `data-pagefind-body` narrows the indexed region, Pagefind captures
  the entire 73-card grid as one large document. This produces one
  very broad hit for almost any media-related query, rather than
  well-targeted per-item hits.

Conclusion: media is currently indexed at the same level as every
other section (baseline Pagefind body indexing + `Kieli` filter), but
has zero item-level Pagefind metadata. No content-type filter exists.

Currently indexed by Pagefind? **YES** (baseline).
Item-level Pagefind records? **PARTIAL** (per-URL records exist, but
they carry no per-item metadata beyond language and page title).

## 8. Current Find & Explore status

Shared discovery stack inspected on this branch:

- `src/_utils/contentPresets.js` — isomorphic filter/query engine.
  - `ENDPOINTS.media = "/data/media.json"` is registered.
  - `SOURCE_TO_COLLECTION.media = "media"` is registered.
  - `FIELD_RULES` includes `mediaType` (oneOf) that reads
    `r.mediaType` from records but returns `null` from Eleventy items.
  - `PRESETS` contains **only one preset**:
    `"FindExplore:presentations"`. **No media preset exists.**
- `src/js/content-engine.js` — client-side query facade. Referenced by
  `/mediassa/`. Direct call in `src/fi/mediassa.njk:316`:
  `window.ContentEngine.query({ source: 'media' })`.
- `src/js/pe-list-render.js` — progressive-enhancement list renderer.
  Comment in the file lists `mediassa` among expected callers, but the
  current media page renders its cards with its own inline template
  (`renderCard(item)` inside `src/fi/mediassa.njk`) rather than
  delegating to `pe-list-render`.
- There is **no `src/js/find-explore.js`** on this branch (the
  Find & Explore runtime shipped by writings/theses landed on `main`
  after this branch's merge-base).
- `src/js/site-search-page.js` exists and is the standalone site-search
  page controller (`/hae/`), not media-specific.

Media-specific UI today:

- FI page has its own client-side filter bar with three axes:
  `type:…` (article, podcast, video, radio, assignment), `role:…`
  (about, expertAssignment, guest, interviewer), and `topic:…`
  (`politiikka`, `tekoaly`, `avoin`, `paikallinen`) with alias arrays
  hard-coded in the page script. This UI is not built on Find &
  Explore contracts; it filters the raw `/data/media.json` array
  in-page.
- The EN page has no client-side filter and no PE hydration — it is a
  server-rendered grid of all 73 items.

Media preset? **NO**.
Media public JSON? **YES** (`/data/media.json`, 73 items, schema v1).
Client-side filters? **YES**, but ad-hoc and page-local (not a shared
Find & Explore preset).
Pagefind scope/filter for media? **NO** (only baseline `Kieli:`).
Included in global or contextual discovery? **NO** dedicated preset;
media items appear in generic Pagefind global search only.

## 9. Existing context semantics

`src/_data/contentContext.js` defines the canonical context vocabulary
and the `resolveContexts(data, inputPath)` API:

- Vocabulary: `research`, `education`, `teaching`, `politics`,
  `open-science`, `business`, `media`, `personal` (with FI/EN
  aliases including `mediassa` → `media`).
- Called from `src/media/media.11tydata.js` for every media item.
- Media always gets `media` context (line 128–130: any file under
  `/media/` or with `mediaRole` / `mediaType` adds `media`).
- Expert-assignment items always add `education` + `teaching`
  (line 132–135).
- Additional contexts are **inferred** from category strings, keyword
  strings, and free-text signals in title/description/event/venue.

Context coverage across the 73 media items:

| Context | Count | % of media |
| --- | --- | --- |
| media | 73 | 100 % |
| education | 39 | 53 % |
| teaching | 30 | 41 % |
| open-science | 6 | 8 % |
| business | 4 | 5 % |
| politics | 3 | 4 % |
| research | 2 | 3 % |
| personal | 1 | 1 % |

Suitability judgement:

- Suitable for a page-specific "Hae mediasta" filter? **YES** — the
  context field is populated on 100 % of items and is derivable
  deterministically from source frontmatter without any additional
  labelling.
- Suitable as-is for later Research (`research` context) discovery?
  **NO** at scale — only 2 items carry the `research` context, and
  both are inferred from keyword strings (`inferContexts` scanning
  title/description/keywords for `"tutkimus" / "research"` etc.).
  This is not an authoritative research-membership signal.
- Politics: only 3 items. If media is to feed politics discovery
  later, the same inference limitations apply.
- Media contexts are a mixture of explicit (frontmatter `contexts:`
  is present on 0 items) and inferred (100 % come from `inferContexts`
  via file-path + role + free-text signals). This is fine for page-local
  search but must not be treated as authoritative membership for
  cross-content discovery.

`resolveContexts()` is not modified in this checkpoint.

## 10. Media type terminology

Observed `mediaType` values across 73 items (deterministic from source):

| mediaType value | Count | UI label FI | UI label EN |
| --- | --- | --- | --- |
| `article` | 55 | Lehtijuttu | Article |
| `video` | 9 | Video | Video |
| `podcast` | 4 | Podcast | Podcast |
| `pressRelease` | 2 | Tiedote | Press release |
| `assignment` | 2 | Asiantuntijatehtävä | Expert assignment |
| `radio` | 1 | Radio | Radio |

Observed `mediaRole` values:

| mediaRole value | Count | UI label FI | UI label EN |
| --- | --- | --- | --- |
| `about` | 65 | Minusta tehty | About my work |
| `expertAssignment` | 3 | Asiantuntijarooli | Expert role |
| `interviewer` | 3 | Haastattelijana | As interviewer |
| `guest` | 2 | Vieraana | As guest |

Findings:

- `mediaType` and `mediaRole` are stable, small, closed vocabularies
  and every item carries both.
- The FI archive page exposes an additional `type:tv` and `role:*`
  buttons that map to values in the label macro (`tv`) that do not
  currently exist in any source item. That is a minor UI-only gap
  (dead buttons for now, no user-visible harm).
- `pressRelease` is exposed in the label macro and JS label map but
  not exposed as a filter button on the FI archive UI (2 items are
  reachable only via the "Kaikki" tab). Small consistency gap.
- All values are already user-facing (the label macros translate
  every value to both FI and EN strings). None are ambiguous.
- Outlets: 28 distinct `mediaOutlet` values. Includes some
  publisher / channel combinations (`Generation AI / YouTube`,
  `INOS Project / YouTube`, `YouTube / Jari Laru`, etc.) that are
  legitimately distinct but would benefit from a normalization pass
  if outlet were to become a search facet.

No normalization performed in this checkpoint.

## 11. User-facing filter readiness

Filters supported by existing frontmatter data on every item:

- Media type (`article`, `video`, `podcast`, `radio`, `pressRelease`,
  `assignment`) — 100 % coverage.
- Media role (`about`, `guest`, `interviewer`, `expertAssignment`) —
  100 % coverage.
- Year / date facet — 100 % coverage (all items have `date`).
- Outlet — 100 % coverage (28 distinct values; would benefit from
  normalization if surfaced as a first-class filter).
- Language — 100 % coverage (72 FI, 1 EN).

Filters partially supported but weak:

- Topic (`politiikka`, `tekoaly`, `avoin`, `paikallinen`) — currently
  driven by hard-coded alias lists in the FI page script matching
  against `_topicText` (concatenation of categories + keywords +
  title + description). The alias lists are not in a shared
  taxonomy source.
- Research membership — only 2 items carry the `research` context,
  and both via free-text inference. Not fit for a "media × research"
  filter yet.

Filters not currently supported by media data:

- Any research-line facet, teaching-unit facet, funding facet, or
  thesis-style role facet.

## 12. Page-specific search readiness ("Hae mediasta")

Requirements for a page-scoped Pagefind search that searches only
media content, evaluated against current state:

| Requirement | Current state |
| --- | --- |
| Pagefind indexes each media page | YES (baseline body indexing) |
| Content-type Pagefind filter to scope search to media | NO |
| Per-item Pagefind metadata (mediaType, mediaRole, outlet, date) | NO |
| Public JSON projection | YES (`/data/media.json`) |
| Item-level detail pages | YES (73/73) |
| Sufficient authored text per page | PARTIAL (short descriptions + short bodies; 200–400 chars authored per item, no transcripts) |
| Client-side Find & Explore preset for media | NO |
| SSR fallback | YES (FI archive SSRs an opening set of 18 cards; EN archive SSRs all 73) |
| Pagination / list rendering | YES on FI (client-side); EN renders everything at once |
| Language handling | YES (per-item `lang`, `Kieli:` filter, and paired `/mediassa/` and `/en/media/` routes) |

Readiness classification (per Section 12 of the prompt):
**B — ready after metadata cleanup**.

Media data is structurally complete (100 % type/role/outlet/date/URL
coverage), the JSON projection exists, and detail pages exist. What
is missing is the Pagefind metadata layer (a content-type filter for
scoping and per-item metadata for filters/facets), plus a shared
Find & Explore preset if we want the same UI shell used by
presentations. No canonical media model change is required.

Blocking a full "A" classification is not any single piece of the
canonical layer — it is the absence of the Pagefind metadata and the
absence of a media preset in `contentPresets.js`, both of which are
purely additive changes.

## 13. Canonical / projection gap analysis

Comparing the media stack to the pattern used elsewhere
(source → canonical → public projection → Pagefind metadata →
Find & Explore UI):

| Layer | Present? | Location |
| --- | --- | --- |
| 1. Authoritative source | YES | `src/media/*.md` (73 items) |
| 2. Canonical internal representation | YES | Eleventy `media` collection + `src/_utils/toPublicContentRecord.js` |
| 3. Public projection | YES | `src/data/media.json.11ty.js` → `/data/media.json` |
| 4. Built HTML per item | YES | `_site/mediassa/**/index.html` (73 detail pages + landings) |
| 5. Pagefind metadata (item-level) | NO | needs `data-pagefind-meta` and `data-pagefind-filter="Sisältö:Mediassa"` on detail pages |
| 6. Client-side Find & Explore preset | NO | needs entry in `PRESETS` in `src/_utils/contentPresets.js` and, if desired, a shared runtime module |
| 7. Tests / audits | PARTIAL | this M1 audit exists; no dedicated media Pagefind test yet, no equivalent of `tests/presentations-archive.spec.js` for media |

Layers 1–4 are complete. Layers 5 and 6 are the only true missing
pieces. Layer 7 depends on scope of M2.

## 14. Language behavior

- FI route: `/mediassa/` (source `src/fi/mediassa.njk`, uses PE
  hydration). Detail pages under `/mediassa/YYYY/MM/DD/slug/` (or
  `/mediassa/slug/` when undated).
- EN route: `/en/media/` (source `src/en/media.njk`). No PE
  hydration; renders all 73 items server-side.
- Detail pages are the same physical URLs used by both routes — the
  EN page's card "Details (FI)" button links to the same
  `/mediassa/{…}/` detail page (there is no separate EN detail page).
- Per-item `lang` metadata exists: 72 items are `lang: fi`, 1 item is
  `lang: en` (`inos-project-interview-heis-open-science`). The
  `resolveContexts` and public projection honor this.
- Landing pages themselves inherit their template's `lang` (`fi` for
  `/mediassa/`, `en` for `/en/media/`), and the `Kieli:` Pagefind
  filter on each landing reflects the template language, not the
  language of the items listed. Both landing pages list the same
  73 items.
- Recommendation for M2: index media detail pages per item's actual
  `lang`, and keep both landing pages indexed as `Kieli:Suomi`
  vs `Kieli:English` respectively (matching current behavior). Do
  not attempt to separate FI and EN item pools until there is an
  authored EN pool worth splitting.

## 15. Relation to Research

Per `src/_data/contentContext.js`, the `research` context is inferred
from free-text signals — not authoritative like the publication /
thesis research-membership fields.

- Media items with `research` context today: **2 / 73** (≈3 %).
- Those 2 items are inferred by `inferContexts` matching
  keyword-level signals against tokens like `tutkimus`, `research`,
  `journal`, `conference`, etc.
- There is no `researchLine`, `researchTheme`, or
  `researchAudience` frontmatter on media items.
- Some media items (e.g. `oulun-yliopisto-mukana-generation-ai-hankkeessa`,
  `okm-kansallinen-viitekehys-tekoalyosaamiselle-2026`,
  `oulun-yliopiston-tutkijoita-mukana-palkitussa-tekoalylukutaidon-oppimisratkaisussa`)
  are plainly research-adjacent and are not currently tagged as
  `research` because the inference heuristic misses them.

Recommendation:

- **Do not add media as a fifth Research scope in M2.**
  Research contextual discovery needs authoritative membership.
  The current `contexts` field on media is not authoritative for
  research.
- Keep media outside Research for now. Revisit only after either
  (a) explicit `researchProfiles`-style frontmatter is authored on
  the media items that belong to research, or (b) a separate
  checkpoint decides to broaden Research membership using explicit
  cross-content topics (not free-text inference).
- Do not use topic similarity or category overlap as Research
  membership — this constraint from the prompt is unchanged.

## 16. Relation to global search

- Global Pagefind currently returns hits for media pages (the pages
  are indexed by default). The user can already type any media-
  related query into the site search and get media results.
- Because there is no `data-pagefind-filter="Sisältö:…"`, results
  cannot be scoped or grouped by media in the global UI. A media
  hit is indistinguishable from a writings hit in the search dropdown
  except by URL.
- Because there is no `data-pagefind-body` on any detail page, the
  archive landing (`/mediassa/`) is indexed as one very large
  document covering all 73 cards. This produces low-precision hits
  and can outrank the actual per-item page for broad queries.
- Minimum metadata to fix scoping without changing UX:
  `data-pagefind-filter="Sisältö:Mediassa"` on media detail pages
  (or on a wrapping element in the layout). Optional but low-cost:
  add `data-pagefind-meta` for `mediaType`, `mediaOutlet`, and
  publication `date` so future UI can group and sort. All of this
  is a template-only change in `src/_includes/media-item.njk`.

## 17. Risks

- Archive landing over-indexing. `/mediassa/index.html` currently
  has no `data-pagefind-body`, so Pagefind ingests the entire archive
  grid as one document. Any narrow Pagefind scoping added to detail
  pages must be coordinated with a `data-pagefind-body` scope (or an
  exclusion) on the landing page to avoid duplicate low-precision
  results. Same risk applies to `/en/media/`, which SSRs all 73
  items in one page.
- External-only body text. Detail pages carry short (≈1–3 paragraph)
  summaries, not transcripts of the external content. Pagefind quality
  will therefore stay bounded by frontmatter fields (title,
  description, categories, keywords, outlet) — good for facet-style
  search, weaker for free-text discovery. This is intrinsic to media
  and unfixable in M2.
- Hard-coded topic aliases. `src/fi/mediassa.njk` embeds a local
  `topicAliases` object (`politiikka`, `tekoaly`, `avoin`,
  `paikallinen`) driving the "Politiikka / Tekoäly ja koulutus /
  Avoin tiede / Paikallinen vaikuttaminen" filter buttons. These
  duplicate logic that would ideally live in shared taxonomy.
  Not a blocker for Pagefind compatibility, but worth flagging
  for later normalization.
- Unused filter surface. The FI filter bar exposes `type:radio`,
  `type:assignment`, and role buttons for combinations with very few
  or zero items (`radio`: 1 item; `assignment`: 2 items;
  `pressRelease`: no button but 2 items). Not a data problem, just
  UI-vs-data drift.
- Outlet normalization. 28 distinct outlet strings include multiple
  compound values (`Generation AI / YouTube`, `INOS Project /
  YouTube`, `YouTube / Jari Laru`). If outlet becomes a search
  facet, these need normalization; otherwise a raw facet will
  fragment.
- Thumbnail dependency. 67 / 73 items carry a `thumbnail` that is a
  fully external URL (mostly to `munoulu.fi`, `youtube.com`,
  `soundcloud.com`, etc.). Any Pagefind result UI that renders
  thumbnails inherits that external hotlink risk (URL rot,
  performance, and privacy).
- Contexts on media are inferred, not authored. Any downstream
  system that treats media contexts as authoritative membership
  (Research discovery in particular) will misclassify. Documented
  above; do not build on this in M2.
- Duplicate results with writings/publications/presentations. If
  media gains a shared `Sisältö:` filter, take care that the
  content-type value is distinct from any existing writings /
  publications / presentation values so multi-scope search remains
  unambiguous.
- Branch drift. This branch is behind `main` and does not include the
  writings / theses Find & Explore v1 patterns. Any M2 implementation
  that borrows from those patterns must first rebase (or the audit
  must be re-run) on top of `main`.

## 18. Recommended M2 implementation path

Recommendation: **A — Media Pagefind compatibility can be implemented
directly**, on the following minimal M2 scope:

Minimal M2 steps (all additive, template + preset only, no data
migration required):

1. **Rebase this branch on `main`** (or run M2 from a fresh branch off
   `main`). The Pagefind and preset patterns you want to reuse
   (`FindExplore:presentations`, writings F&E, theses F&E) landed on
   main after this branch's merge-base.
2. In `src/_includes/media-item.njk`, add Pagefind metadata to the
   root of the detail-page layout:
   - `data-pagefind-body` on the main article region (limit the
     indexed area so Pagefind gets a clean per-item record rather
     than nav / footer chrome).
   - `data-pagefind-filter="Sisältö:Mediassa"` (or the site-wide
     `Sisältö` label used elsewhere once main is merged in).
   - `data-pagefind-meta` for `mediaType`, `mediaRole`,
     `mediaOutlet`, and `date` (using existing label macros so FI
     and EN facet values match `_media-macros.njk`).
   - `data-pagefind-sort="date"` for chronological sort in Pagefind
     UI where used.
3. In `src/fi/mediassa.njk` and `src/en/media.njk`, either add
   `data-pagefind-body` scoped to the hero/intro region **only** (so
   Pagefind indexes the landing page description, not the 73-card
   grid), or exclude the archive card grid from Pagefind with
   `data-pagefind-ignore` on the grid wrapper. This prevents the
   landing from swallowing all per-item queries.
4. In `src/_utils/contentPresets.js`, register a
   `"FindExplore:media"` preset:
   `{ source: "media", sort: "date-desc" }`. Optional extensions
   (`filters: { lang: … }`, `filters: { contentType: ["mediaItem"] }`)
   only if a specific scoping is required.
5. Add a minimal Playwright audit `tests/media-archive.spec.js`
   (mirroring `tests/presentations-archive.spec.js` from this
   branch) that verifies the Pagefind attributes are present on
   built media pages and that the FI/EN landings render the
   expected counts. Deterministic, does not need network access.

No canonical model changes, no metadata normalization pre-work, and
no research-membership frontmatter are required for M2. Research
integration (making media a fifth Research scope) is explicitly
out of scope and deferred until authoritative research membership
signals exist for media items.

## 19. Files inspected

Source and layout:

- `src/media/*.md` (73 files, listed in machine data)
- `src/media/media.11tydata.js`
- `src/fi/mediassa.njk`
- `src/en/media.njk`
- `src/_includes/media-item.njk`
- `src/_includes/_media-macros.njk`
- `src/css/media-page.css` (not modified, presence only)
- `src/js/external-media-consent.js` (embed helper, not audit-relevant)

Data layer:

- `src/_data/mediaArchive.js`
- `src/_data/contentContext.js`
- `src/_data/contentSchema.js`
- `src/_data/seoTopics.js`
- `src/_data/headerNav.js`
- `src/_data/taxonomyProfiles.js`
- `src/_data/councilMeetings.js`, `src/_data/educationCommitteeMeetings.js`
  (cross-refs to `SOURCE_DIRECTORIES` containing `"media"`)
- `src/data/media.json.11ty.js`
- `src/data/_shared.js`

Shared utilities:

- `src/_utils/contentPresets.js`
- `src/_utils/toPublicContentRecord.js`
- `src/_utils/resolveContentMeta.js` (indirect — legacy type map)

Config / build:

- `.eleventy.js` (Pagefind / media references)
- `package.json` (Pagefind build scripts)

Built output:

- `_site/data/media.json` (73 items)
- `_site/mediassa/**/index.html` (75 detail + landing pages scanned)
- `_site/en/media/index.html`
- `_site/pagefind/**` (index artifacts confirming media is indexed)

Prior audits and reports read for context:

- `docs/f4-r0-existing-cross-content-semantics-audit-2026-08-15.md`
- Filenames only (not opened) for other F3C P4/P5/P6 audits.

Git introspection:

- `git status`, `git log`, `git diff main HEAD`,
  `git merge-base HEAD main`, `git log HEAD..main`.

## 20. Open questions

- Should M2 introduce a site-wide `Sisältö:` Pagefind filter
  (with vocabulary `Kirjoituksia | Opinnäytteitä | Esitykset |
  Julkaisut | Mediassa | …`) or should media only add its own
  filter and defer the vocabulary decision to a broader search-UX
  checkpoint? This audit assumes the vocabulary will be defined
  when M2 runs on top of `main`, where the writings / theses F&E
  patterns already inform the naming.
- Should the landing pages be excluded from Pagefind entirely, or
  kept as low-signal hero-only records? Both approaches are safe;
  the choice depends on how much traffic the landing pages
  themselves deserve as search hits.
- Should the FI archive filter bar's topic aliases
  (`politiikka`, `tekoaly`, `avoin`, `paikallinen`) migrate into
  shared taxonomy at the same time, or stay local until a broader
  taxonomy refactor? Not blocking Pagefind work.
- Is any subset of the 73 items in scope for authoring an EN
  translation soon? If yes, item-level `lang` handling in the
  Pagefind metadata (per-item, not per-landing) becomes more
  useful. Today: 1 EN item vs 72 FI, so per-item language filter is
  low value.
- When Research (F4) rollout starts, will media be considered again
  as a fifth Research scope on the basis of authored membership
  frontmatter? Documented as deferred; do not act in M1.
