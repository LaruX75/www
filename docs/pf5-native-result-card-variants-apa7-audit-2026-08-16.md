# PF5 — Native Result-Card Variants + APA7 Readiness Audit

Date: 2026-08-16
Status: **PF5 NATIVE RESULT-CARD VARIANTS + APA7 READINESS = DECIDED / GREEN**
Mode: audit only — no source code, no Pagefind metadata, no result-card
change.
Basis:
- `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md`
- `docs/pf2-shared-sisalto-facet-closure-2026-08-16.md`
- `docs/pf3-result-card-consistency-closure-2026-08-16.md`
- `docs/pf-starter-chips-closure-2026-08-16.md`
- `docs/pf4-result-card-hierarchy-closure-2026-08-16.md`
- `docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md`
- `docs/pf-perf2-first-search-latency-2026-08-16.md`
- `docs/pf-perf2-enter-scroll-hotfix-closure-2026-08-16.md`
- `docs/pf-ui-l10n1-finnish-search-labels-closure-2026-08-16.md`

## 1. Status

Recommendation: **C — PF5-SPLIT**. Ship publications + theses APA7-style
citation rows first (data is already in the shared renderer's entry
object; APA formatter already exists in `src/julkaisut.njk`). Ship
presentation horizontal variant as a second, smaller step against the
existing `find-explore.js` `presentations` kind. Defer media horizontal
variant behind the deferred decision on how `/haku/` PagefindUI
customization interacts with a bespoke media renderer. Rationale in §17.

## 2. Repository state

- Branch: `claude/pf5-audit-native-result-card-variants-apa7`
- HEAD before audit: `e0662dce84c31beecc1562822a77ee7036095213`
  (`docs: close PF-UI-L10N1 Finnish search labels`)
- All prior PF closure docs present on `main`.
- Worktree clean for the PF5 scope; only unrelated pre-existing dirty
  `.cache/api-fallback/*.json` and legacy F3C P4 audit-data JSONs
  remain unstaged.

## 3. User direction

Recorded verbatim from the prompt:

- Pagefind result cards should better match the existing presentation
  patterns already used on the site.
- Publications and theses should be rendered as APA7-style citation
  rows.
- Media and presentations should use horizontal, compact result
  variants inspired by the existing `/mediassa/` and `/esitykset/`
  cards.
- Other content types may use the current / default lightweight
  result-card model.
- PF5 should build on PF4, not undo it.
- PF5 is a rendering / design-readiness task, not a new search model.

## 4. Prior PF baseline

- **PF2** shipped the shared `Sisältö:*` facet vocabulary across 750
  detail records (publications 56 + theses 169 + writings-only 234 +
  publication-backed writings 56 + presentations 218 + media 73).
- **PF3** rendered `Sisältö:*` as a visible content-family badge on
  every shared Find & Explore result card.
- **PF4** trimmed the shared card to a four-line default hierarchy
  (family badge · year / title / single primary meta line / excerpt /
  publication-only action row) and demoted the publication quality
  badges into a single subdued micro-copy line.
- **PF-PERF2** added Pagefind warmup so the first-search import cost
  is amortized ahead of the user's typed query.
- **PF-PERF2 hotfix** added an Enter-scroll form-submit interceptor so
  Enter no longer reloads the discovery page.
- **PF-UI-L10N1** extended the nav-bar PagefindUI translations bundle
  to include the missing Finnish strings (`filters_label`,
  `alt_search`, `search_suggestion`).

Cumulative effect: PF4 gave every result the same four-line rhythm.
PF5's job is to swap the primary-meta line for a **content-type-native
render body** — APA7 citation on publications and theses; horizontal
compact variant on media and presentations — without changing the four-
line frame around it.

## 5. Current result-card baseline

From `src/js/find-explore.js` (post-PF4):

- Line 1 `[data-find-explore-card-line="family"]` — `Sisältö:*` badge +
  optional `[data-find-explore-card-year]` suffix.
- Line 2 `.find-explore-result-title` — title link.
- Line 3 `[data-find-explore-card-line="primary-meta"]` — single
  primary sentence composed by each kind's `resultMeta(entry)`:
  - Publications: `authors · type · venue`
  - Theses: `authorLine · thesesTypeLabel`
  - Writings: `writingsTypeLabel`
  - Presentations: `presentationType · presentationEvent`
- Line 4 `[data-find-explore-card-line="quality"]` — publications
  only; subdued uppercase `peer-reviewed · open access · JUFO N ·
  N citations` line.
- Line 5 `[data-find-explore-card-line="excerpt"]` — snippet.
- Line 6 `[data-find-explore-card-line="actions"]` — publications
  only; Open + Source + Citation-export buttons.

Pagefind data fields already available inside `createResultEntry`
(`data.meta.*`, `data.filters.*`, and the per-page `recordsByUrl` for
publications only):

- Publications: `authors`, `typeLabel`, `year`, `venue`, `journal`,
  `volume`, `issue`, `pages`, `doi`, `doiUrl`, `sourceUrl`, `isbn`,
  `publisher`, `peerReviewed`, `openAccess`, `jufoLevel`,
  `citationCount`.
- Theses: `thesesType`, `thesesYear`, `thesesLang`,
  `thesesAuthorLine`, `thesesRole`, `thesesDescription`, plus
  `title` from `data.meta.title`.
- Presentations: `PresentationType`, `PresentationYear`,
  `PresentationEvent`, `PresentationRole`, `PresentationLanguage`,
  `PresentationLandingType`, `PresentationSourceType`.
- Writings: `writingsContentType`, `writingsYear`, plus title.
- Media: **not currently a shared Find & Explore `kind`** — media
  hits reach users via `/haku/` PagefindUI (default UI) rather than
  through `find-explore.js`.

## 6. Existing native publication list pattern

Publication list rendering happens in three places:

- `src/julkaisut.njk` — full archive with per-item card + citation
  export modal (the modal lives inside this template).
- `src/_includes/publications-opening-list.njk` — reused opening set.
- Shared Find & Explore result `renderPublicationResult()` in
  `src/js/find-explore.js` — for search hits on `/julkaisut/`,
  `/en/publications/`, and `/tutkimus/`.

Native list rows currently look like:

- Bold title
- Authors, year, venue on separate lines
- Quality badges (peer-reviewed, open-access, JUFO, citations)
- Action buttons (Open / Source / Cite)

They're **almost APA7 already** — the fields are all there, just
stacked as separate strips rather than composed into a single
citation sentence.

## 7. Publication APA7 readiness — **READY**

- **APA formatter exists**: `src/julkaisut.njk` line 433 defines
  `buildApaCitation(payload)`. Consumes `authors, year, title,
  journal, doi, url, volume, issue, pages`. Also `buildMlaCitation`,
  `buildChicagoCitation`, `buildBibtexEntry` for completeness.
- **Every payload field is already on the F&E publication record**:
  `record.authors, record.year, record.title, record.journal,
  record.doi, record.sourceUrl, record.doiUrl, record.volume,
  record.issue, record.pages` — all sourced from
  `buildPublicationFindExploreRecord()` in
  `src/_utils/publicationsFindExplore.js`.
- **Constraint**: `buildApaCitation` is currently defined **inside**
  `src/julkaisut.njk`'s inline `<script>`. It is not exported. To
  reuse it in `find-explore.js`, PF5 should extract it into a shared
  module `src/js/citation-formatters.js` (or similar) and load it on
  the discovery pages that already load `find-explore.js`. The
  existing `citation-export-modal` binding in `julkaisut.njk` can
  continue to work by importing from the same shared module.
- **No new Pagefind metadata required** — everything needed is
  already on `entry.record` (the same store the current PF4
  publication card reads).
- **Field reliability**: publications sourced from Research.fi carry
  all fields consistently; manually curated publications may miss
  `pages` / `volume` / `issue`. The `buildApaCitation` implementation
  already handles missing fields cleanly (`if (journal)`, `if
  (volume)`, `if (pages)` guards).

Target rendering:

```
[JULKAISUT] · 2024
Author, A. A., Author, B. B., & Author, C. C. (2024). Title in sentence case. Journal Title, 12(3), 45–67. https://doi.org/10.xxxx/xxxxx
VERTAISARVIOITU · OPEN ACCESS · JUFO 1 · 12 VIITTAUSTA
[snippet]
[Avaa] [Lähde] [Viite]
```

Quality signals stay as the subdued PF4 line. Actions stay unchanged.
The APA sentence **replaces** the current `authors · type · venue`
primary-meta line.

## 8. Existing native thesis list pattern

Thesis rendering happens in:

- `src/opinnaytteet.njk` + `src/_includes/thesis-curated-list.njk`
  — archive.
- `src/opinnaytteet/thesis-details.njk` + thesis detail body — the
  per-thesis detail page displays a full APA citation via
  `thesisDetail.citationApa`.
- `src/js/thesis-hub-actions.js` — client-side citation export modal
  with its own thesis APA formatter (`${authors} (${year}). ${title}
  [${level}, University of Oulu].`).
- Shared Find & Explore renderer generic branch — thesis hits
  currently render as `authorLine · thesesTypeLabel` primary meta.

`src/_data/thesisDetails.js` line 119 exposes `citationApa` on every
`thesisDetail`. `src/_utils/toThesesCollectionItems.js` line 91
carries it into the theses collection.

## 9. Thesis APA7 readiness — **READY**

Two viable paths, both without any new Pagefind metadata:

- **Client-side reconstruction**: use `data.meta.thesesAuthorLine`,
  `data.meta.thesesType`, `data.meta.thesesYear`, and
  `data.meta.title` — all already emitted by
  `buildThesisFindExploreDocument`. Compose in `find-explore.js` via
  a small `buildThesisApaCitation({author, year, title, level})`
  helper matching the pattern in `src/js/thesis-hub-actions.js` line
  61: `${authors} (${year}). ${title} [${level}, University of Oulu].`.
- **Add `citationApa` to Pagefind meta**: extend
  `buildThesisFindExploreDocument()` in
  `src/_utils/thesesFindExplore.js` to include
  `thesesCitationApa: thesisDetail.citationApa || ""`. Requires a
  build to regenerate Pagefind meta; not a new *facet*, just a new
  meta field.

**Recommendation**: client-side reconstruction (path 1). It avoids
any Pagefind metadata change, matches the format used elsewhere, and
degrades gracefully when a field is missing.

Finnish thesis-type labels: `pro gradu -tutkielma`,
`kandidaatintutkielma`, `väitöskirja`, `diplomityö`. The current
`thesesType` values are `masterThesis`, `bachelorThesis`,
`doctoralThesis`, `licentiateThesis` — a small display-label map
already lives (partially) in `src/_utils/thesesFindExplore.js`'s
`thesisRoleLabel` helper; PF5 should extend a `thesisTypeLabel(type,
lang)` helper mirroring that pattern.

Target rendering:

```
[OPINNÄYTTEET] · 2023
Riikonen, A. (2023). Title in sentence case [Pro gradu -tutkielma, Oulun yliopisto].
[snippet]
```

No action row on thesis cards (matches PF4).

## 10. Existing media card pattern

`/mediassa/` uses a bespoke horizontal card via
`article.media-archive-card` (see `src/css/media-page.css` line 366+).
Structure:

- Left: `<span class="media-thumb">` with lazy-loaded image (or empty
  placeholder icon).
- Right body: meta row (media type · role · outlet · date) → title
  → optional description → topic chips → open + local-detail
  actions.

`data-media-type` and `data-media-role` on the article enable the
inline filter runtime.

Data availability per M2 audit:

- `mediaType`: 73 / 73 (article / video / podcast / radio / assignment / pressRelease)
- `mediaRole`: 73 / 73 (about / expertAssignment / interviewer / guest)
- `mediaOutlet`: 73 / 73 but **fragmented** across 28 distinct strings
  (`Generation AI / YouTube`, `INOS Project / YouTube`, `YouTube /
  Jari Laru`, …). PF2/PF3/PF-STARTER/PF4 all kept `mediaOutlet` as
  Pagefind meta only, not a user-facing facet, pending normalization.
- `thumbnail`: 67 / 73 items carry an authored thumbnail URL; the
  rest fall back to a placeholder icon.
- `sourceUrl`: 73 / 73 (external link).

## 11. Media horizontal search-result readiness — **PARTIAL**

The **data** is ready: thumbnails 67/73, media type + role 100 %,
outlet 100 % (raw), date 100 %, sourceUrl 100 %. The **rendering
surface** is the blocker.

- Media is not a `kind` in the shared Find & Explore renderer today
  (per PF4 §5). PF3 stubbed `SISALTO_LABELS.media = "Mediassa"` for
  a future shared surface, but no code path currently creates a
  `kind: "media"` entry.
- Media reaches users through `/haku/` PagefindUI (default UI) or
  the `/mediassa/` inline runtime. PagefindUI's default result
  template is a title + snippet + meta strip — it does not support
  arbitrary per-result HTML variants without a custom
  `processResult` callback that returns a DOM fragment.
- Options for PF5:
  - **11a**: leave `/haku/` alone for media (users see the default
    PagefindUI card); make no horizontal variant. Simplest, but
    contradicts the user directive.
  - **11b**: add `kind: "media"` to `find-explore.js` and mount it on
    a new search surface. Requires design of where the mount lives
    (nav overlay is PagefindUI-based; there is no shared F&E page
    that includes media today).
  - **11c**: register a PagefindUI `processResult` callback on
    `/haku/` that swaps the media hit's DOM for a horizontal
    variant. PagefindUI supports `processResult` but the template
    must be built entirely in JS.
- **Outlet visibility caveat**: showing raw `mediaOutlet` on cards
  makes fragmentation visible. If PF5 renders outlet, it should
  either normalize a small allowlist client-side (safe) or omit
  outlet by default and expose it only via the excerpt/detail page.

Recommendation for PF5-SPLIT: **defer** the media horizontal variant
to a follow-up mini-checkpoint that first decides between 11b and
11c. This is the reason C (SPLIT) is chosen over A (do-everything).

## 12. Existing presentation card pattern

`/esitykset/` uses `article.presentation-archive-card` (see
`src/_includes/presentations/result-card.njk` and matching CSS in
`src/css/presentations-page.css`). Structure:

- Left: `.presentation-archive-card-thumb` — placeholder icon
  behind a lazy-loaded thumbnail image. Icon varies by source key
  (Canva / SlideShare / YouTube / AOE / generic).
- Right body: meta strip (source label · Local/External badge) →
  title link → optional description → topic chips → actions.

Data availability per M2 / PF-PERF1 evidence:

- `PresentationType`, `PresentationEvent`, `PresentationYear`,
  `PresentationRole`, `PresentationLanguage`,
  `PresentationLandingType`, `PresentationSourceType` — all in
  Pagefind meta via `buildPresentationPagefindMeta` in
  `scripts/_lib/presentationPagefind.js`.
- Thumbnails: many presentations carry a Canva/SlideShare-derived
  thumbnail URL in the source record; the presentation card falls
  back to a placeholder icon when missing.
- 218 canonical presentations with Pagefind coverage (per
  `scripts/audit-presentation-pagefind.js` `ok: true`).

## 13. Presentation horizontal search-result readiness — **READY**

- Presentations **are** a `kind` in the shared Find & Explore
  renderer (`researchContext` mount surfaces them).
- All meta fields (`presentationType`, `presentationEvent`,
  `presentationYear`) already flow into `createResultEntry` via
  PF4's addition. Thumbnail URL needs to be either (a) added to
  `buildPresentationPagefindMeta` as a `presentationThumbnail`
  meta field (small data-layer change) OR (b) pulled from the
  existing `data.meta` if the presentation Pagefind pipeline
  already emits a thumbnail hint.
- Currently the presentation Pagefind meta does **not** include a
  thumbnail URL. That's the one gap between the archive card and
  a shared-renderer horizontal variant.
- Options:
  - **13a**: ship a horizontal variant with icon-only left column
    (matching the presentation-archive-card fallback). No data
    change required. All data ready.
  - **13b**: add `presentationThumbnail` to
    `buildPresentationPagefindMeta` and render the image. Requires a
    minimal data-layer change and a Pagefind rebuild.

Recommendation for PF5-SPLIT: **ship 13a first** (icon-only
horizontal variant, no data change) inside `find-explore.js`'s
`presentations` render branch. If usage shows the icon-only
variant is not distinctive enough, 13b can follow later.

## 14. Writings / default recommendation

Preserve the PF4 default. Writings is a broad technical family; PF1
§13 warned against restructuring it. PF5 should keep the current
four-line default (`Kirjoitukset ja puheenvuorot · year / title /
writingsTypeLabel / excerpt`) unchanged for writings and use it as
the fallback for any future kind that doesn't have a native variant.

## 15. Data field inventory

| Family | Required for target | Available? | Source | Reliability | Fallback |
| --- | --- | --- | --- | --- | --- |
| Publications | `authors`, `year`, `title`, `journal`, `volume`, `issue`, `pages`, `doi`, `sourceUrl` | YES on `entry.record` | `buildPublicationFindExploreRecord()` | HIGH (Research.fi curated) | `buildApaCitation` guards on empty fields; existing behaviour |
| Publications | quality signals (peerReviewed / openAccess / JUFO / citations) | YES on `entry.record` | Research.fi | HIGH | omit line when all empty |
| Theses | `authorLine`, `year`, `title`, `thesesType` | YES on `data.meta` + entry | `buildThesisFindExploreDocument` | HIGH | omit missing parts from citation |
| Theses | `thesesTypeLabel` in Finnish | needs display-map helper (`thesisTypeLabel(type, lang)`) | new client helper | HIGH once mapped | fall back to raw `thesesType` |
| Presentations | `PresentationType`, `PresentationYear`, `PresentationEvent`, `title`, url | YES on `data.meta` | `buildPresentationPagefindMeta` | HIGH | omit empty parts |
| Presentations | thumbnail URL | **NOT emitted** | would need addition to `buildPresentationPagefindMeta` | MEDIUM if added | icon-only fallback (recommended) |
| Media | `mediaType`, `mediaRole`, `date`, `title`, `sourceUrl` | YES on `data.meta` (M2) | media detail Pagefind attrs | HIGH | `mediaOutlet` fragmented — omit by default |
| Media | thumbnail URL | media detail pages emit thumbnails only in HTML; NOT in Pagefind meta today | would need addition | MEDIUM if added | icon-only fallback |
| Media | shared-renderer kind | **NO** shared-renderer `kind: media` exists | none | — | decision needed (§11) |
| Writings | `writingsContentType`, `writingsYear`, `title` | YES on `data.meta` | `resolvePagefindWritings` | HIGH | current PF4 default is enough |

**New Pagefind metadata required for the recommended split (C):** —
**NONE**. Publications + theses can render APA7 entirely from existing
`entry.record` and `data.meta`. Presentation horizontal variant can
ship icon-only (13a) without any data change. Only if a later
checkpoint chooses 13b or 11b/c would Pagefind meta need to grow.

## 16. Architectural options (evaluated)

| Approach | Maintain. | Risk | A11y | Testability | Consistency | Duplication | Data readiness | Size |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A. Extend `find-explore.js` with kind switch | HIGH | LOW | HIGH | HIGH | HIGH (single renderer) | LOW | READY for pubs/theses/presentations | small |
| B. Reusable helpers between archive + search | HIGHEST | LOW | HIGH | HIGH | HIGHEST | NEG (reuse) | READY | medium (helper extraction) |
| C. Reuse archive templates directly | MEDIUM | HIGH (couples archive to search) | HIGH | MEDIUM | LOW (couples layouts) | HIGH | READY | small but risky |
| D. Enrich PF4 data lines only | HIGH | LOW | HIGH | HIGH | LOW (still generic) | NONE | READY | tiny — but no APA output |

**Preferred**: **A** for the render surface, augmented by **B** for
the citation formatter helper (extract `buildApaCitation` and a new
`buildThesisApaCitation` into `src/js/citation-formatters.js` so both
`julkaisut.njk` and `find-explore.js` share the same source of
truth). Option C is explicitly avoided per prompt §11: "Do NOT
directly reuse full archive cards."

## 17. Recommended PF5 implementation strategy

**Chosen direction: C — PF5-SPLIT.**

**Phase 1 — Publications + Theses APA7 (`PF5-IMPL-APA`)**

- Extract `buildApaCitation` from `src/julkaisut.njk` into a shared
  module `src/js/citation-formatters.js`.
- Add `buildThesisApaCitation({author, year, title, level, university})`
  mirroring `src/js/thesis-hub-actions.js` line 61.
- Add `thesisTypeLabel(type, lang)` helper (map `masterThesis` → `Pro
  gradu -tutkielma` etc.).
- In `src/js/find-explore.js`, replace the publications and theses
  primary-meta line with the APA sentence when the citation formatter
  yields a non-empty string. Keep quality micro-copy on publications.
  Keep publication actions.
- Add `tests/pf5-native-result-card-variants-apa7.spec.js` asserting
  that publication and thesis result cards render an APA-shaped
  sentence (title, year, and either DOI/URL or `[Pro gradu…]` bracket
  visible).
- Add `scripts/audit-pf5-native-result-card-variants-apa7.js`
  verifying the citation-formatters module is emitted and referenced.

**Phase 2 — Presentation horizontal variant (`PF5-IMPL-PRES`)**

- Add a presentation-specific renderer branch in `find-explore.js`
  that outputs `article.find-explore-result--presentation` with a
  left-column icon (source-key-driven, mirroring
  `presentation-archive-card`'s icon logic) and right-column
  standard four-line hierarchy.
- Add CSS in `src/css/find-explore.css` for the horizontal layout
  with mobile-safe wrapping.
- No Pagefind meta change; icon-only fallback (13a).
- Extend the Phase-1 tests with a presentation horizontal-variant
  assertion.

**Phase 3 — Media horizontal variant (`PF5-DECISION-MEDIA`)**

- Do NOT implement in PF5 without a preceding decision:
  - Add media as a shared `find-explore.js` `kind` (11b) — requires
    a mount page.
  - Register a PagefindUI `processResult` callback on `/haku/`
    (11c) — customizes PagefindUI's default renderer.
- Land the decision as its own small audit before implementation.
- If 11b: add `presentationThumbnail` and `mediaThumbnail` to
  Pagefind meta only if strictly needed.
- If 11c: also decide whether to render `mediaOutlet` (raw or
  normalized allowlist).

**Files likely to change** (Phases 1 + 2):

- `src/js/find-explore.js`
- `src/js/citation-formatters.js` (new)
- `src/css/find-explore.css` (small addition for presentation
  horizontal variant)
- `src/julkaisut.njk` (swap inline `buildApaCitation` for shared
  module import — pure refactor, no behaviour change)
- `tests/pf5-native-result-card-variants-apa7.spec.js` (new)
- `scripts/audit-pf5-native-result-card-variants-apa7.js` (new)
- `docs/pf5-native-result-card-variants-apa7-2026-08-16.md` (new
  implementation report)

**Files explicitly not to touch**:

- Any Pagefind index generation (`scripts/run-pagefind.js`,
  `scripts/_lib/presentationPagefind.js`).
- Any detail template (`src/_includes/publication-item*.njk`,
  `src/_includes/thesis-detail-body.njk`,
  `src/_includes/media-item.njk`, `src/_includes/presentation-item.njk`).
- `src/js/starter-chips.js`, `src/css/starter-chips.css`.
- `src/js/presentations-page.js` (bespoke archive runtime).
- The inline media archive runtime in `src/fi/mediassa.njk`.
- `src/js/site-ui.js` (PF-UI-L10N1 boundary).
- `src/js/site-search-page.js` (unless Phase 3 chooses 11c later).
- Any `Sisältö:*` value / `_data/contentContext.js`.

**Pagefind metadata changes required**: NONE for Phases 1 + 2. Phase
3 may or may not require metadata; that decision is deferred.

**Archive cards unchanged**: YES for Phases 1–3. `/mediassa/` and
`/esitykset/` archive cards stay untouched.

## 18. Accessibility / mobile considerations

- APA sentences can grow long (7+ authors, long titles, long DOI).
  Guardrails:
  - Do NOT truncate author list — APA convention allows "et al." at
    ≥ 21 authors, but citation completeness matters for scholarly
    use; wrapping is preferred over truncation.
  - Wrap URL/DOI in a `<span>` so the browser can break long
    strings.
  - Use `overflow-wrap: anywhere` on the citation line to prevent
    horizontal overflow on narrow screens.
- Screen-reader reading order: keep the DOM order `family badge →
  title link → citation → quality line → excerpt → actions`. This
  matches PF4 and current PF3 assertions.
- Horizontal presentation variant on mobile: use CSS grid or flex
  with `flex-wrap: wrap` so the icon stacks above the text below
  a breakpoint (e.g. 480 px).
- Thumbnails (if a later phase adds them): keep `alt=""` for
  decorative images; if the thumbnail is a source cue (e.g.
  YouTube), consider `alt="YouTube"` — but decorative is usually
  correct because the source label is already text.
- Focus states: preserve the existing
  `.find-explore-result:focus-within` outline; horizontal variants
  should not break it.
- Colour is not the only cue: PF4 already dropped the coloured
  publication badges in favour of text micro-copy for the same
  reason. Maintain that.

## 19. Future test strategy

For the future PF5 implementation phases, plan tests that cover:

- Publication result renders APA-shaped citation text containing
  `Author (Year). Title.` and either a DOI URL or another source URL
  when present.
- Thesis result renders APA-shaped text with `[<type-label>,
  <university>]` bracket.
- Presentation result renders as a horizontal variant with the
  icon in the left column and the four-line hierarchy in the right
  column.
- Writings / default result still renders the PF4 four-line default
  (regression).
- Fallback: when APA fields are missing, the current PF4 primary
  meta line is shown instead of an empty or malformed citation.
- Reverse invariants: no visible `FindExplore:*` token, no
  `Sisältö:Tutkimus`, no `data-pagefind-body` on any detail page,
  PF-PERF2 Enter-scroll still holds, PF-UI-L10N1 Finnish translation
  bundle still complete, Research population still 317, no media
  hits inside Research contextual mount.

Do not include timing-threshold assertions.

## 20. Boundaries preserved

- No production source changed by PF5-AUDIT.
- No Pagefind metadata changed.
- No Pagefind index change (`fi:1163 / en:346` unchanged).
- No Research semantic change (`totalResearchPopulation: 317`,
  media not enumerated).
- No `Sisältö:*` value change; no `Sisältö:Tutkimus`.
- No `FindExplore:*` visible.
- No starter-chip change.
- No result-card change (PF4 hierarchy stays live).
- No SEO2 metadata change.
- No scroll hints.
- No `data-pagefind-body` reintroduced.

## 21. Risks and rollback notes

**Risks for the future PF5-IMPL phases**:

- **Citation-formatter extraction regressions**: pulling
  `buildApaCitation` out of `src/julkaisut.njk`'s inline script
  changes the module's load path. Mitigation: keep the same
  function signature; add a browser smoke that clicks the existing
  Citation-export button on `/julkaisut/` and asserts an APA-shaped
  output.
- **Author-list overflow**: extremely long author lists can push
  the result card past its container width. Mitigation: CSS
  `overflow-wrap: anywhere` + a maximum line count guard.
- **Presentation horizontal variant divergence**: the icon logic
  in `presentation-archive-card` uses `item.sourceKey`
  (Canva/SlideShare/YouTube/AOE). If the shared renderer doesn't
  have `sourceKey` on entries, fall back to a generic icon.
- **Media Phase-3 decision**: no rollback needed — Phase 3 is not
  in scope for PF5-IMPL Phase 1 or 2.

**Rollback plan for PF5-IMPL Phase 1** (if landed and needs
reverting): revert the changes to `src/js/find-explore.js` and
`src/julkaisut.njk`, restore the inline `buildApaCitation`, delete
`src/js/citation-formatters.js`. No template, no data-layer change
to unwind.

## 22. Explicitly out of scope

- Bespoke `/mediassa/` and `/esitykset/` archive card redesign.
- Writings segmentation (`scientificPublication` visibility inside
  `/kirjoitukset/`).
- Media outlet / source normalization.
- New Pagefind facets or filter emission.
- Research semantic change or Research member addition.
- Adding `Sisältö:Tutkimus`.
- Adding media to Research.
- Any change to Pagefind indexing.
- PagefindUI customization on `/haku/` (deferred to Phase 3
  decision).
- English chip parity.
- Scroll-hint work.
- SEO / social sharing changes.

## 23. Next prompt outline

Suggested implementation prompt for the next step (do not run here):

> **PF5-IMPL-APA — PUBLICATIONS + THESES APA7 CITATION ROWS**
>
> Extract `buildApaCitation` from `src/julkaisut.njk` into a new
> shared module `src/js/citation-formatters.js`. Add
> `buildThesisApaCitation({author, year, title, level, university})`
> and `thesisTypeLabel(type, lang)`. Update `src/js/find-explore.js`
> so the publication and thesis primary-meta lines render the APA
> sentence when the formatter yields a non-empty string. Preserve
> the publication quality micro-copy line and the Open / Source /
> Citation-export action row. Keep writings and presentations on
> the PF4 default for this phase.
>
> Boundaries: no Pagefind metadata change; no detail template touched;
> no `data-pagefind-body`; no chip runtime change; no bespoke
> archive card touched; Research population stays 317; media stays
> outside Research; PF-PERF2 Enter-scroll and PF-UI-L10N1 Finnish
> translations invariants remain green.
>
> Tests: new `tests/pf5-native-result-card-variants-apa7.spec.js`
> asserting APA-shaped publication and thesis result cards; extend
> `scripts/audit-pf5-native-result-card-variants-apa7.js` with a
> gate that the shared citation-formatters module is loaded on
> discovery pages that load `find-explore.js`.
>
> Run all existing safety gates (PF-PERF1, PF4, PF-STARTER, PF3, PF2,
> M2 media, F4 Research, presentation Pagefind, PF-PERF2 Enter-scroll
> smoke, PF-UI-L10N1 Finnish smoke). All must remain green.

Follow-up prompts (not scheduled here):

- **PF5-IMPL-PRES — PRESENTATION HORIZONTAL RESULT VARIANT**:
  add horizontal variant with icon-only left column in
  `find-explore.js` + `find-explore.css`; no Pagefind meta change.
- **PF5-DECISION-MEDIA**: small audit choosing between the shared-
  renderer-kind path (11b) and the PagefindUI-processResult path
  (11c) for a horizontal media variant on `/haku/`.

STOP.
