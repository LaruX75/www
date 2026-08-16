# PF-STARTER-CHIPS — User-Triggered Discovery Shortcuts

Date: 2026-08-16
Status: Implementation. Additive, page-local, no new query model.
Basis:
- `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md` §13
- `docs/pf2-shared-sisalto-facet-closure-2026-08-16.md`
- `docs/pf3-result-card-consistency-closure-2026-08-16.md`
Machine data: `docs/data/pf-starter-chips-audit-2026-08-16.json`
Audit script: `scripts/audit-pf-starter-chips.js`

## 1. Scope

Add a small "Aloita tästä" starter-chip strip to the three Finnish
discovery pages PF1 §13 identified as the best places for
user-triggered shortcuts:

- `/tutkimus/`
- `/esitykset/`
- `/mediassa/`

Every chip must wrap an existing filter, topic, or search mechanism
already understood by the page. No chip triggers automatic search on
page load, and no chip introduces a second query model. Publications,
theses, writings, Research membership, Pagefind metadata, and
`data-pagefind-body` are all untouched.

## 2. Starting point

- Branch created from `main` @ `3a7841cc1f07f8bb477915f0f5df6760244e2b42`
  (`docs: close PF3 result-card consistency rollout`).
- PF1, PF2, PF3 all landed on main. All closure docs present.
- All existing Find & Explore browser smokes green pre-PF-STARTER.

## 3. PF1 / PF2 / PF3 basis

- **PF1 §13** recommended starter chips on `/tutkimus/`,
  `/esitykset/`, `/mediassa/` — as explicit user actions, never
  automatic, and always wrapping the page's existing filter /
  topic / query mechanisms.
- **PF2** landed the shared `Sisältö:*` Pagefind vocabulary,
  which the chip labels align with (Julkaisut / Opinnäytteet /
  Esitykset / Kirjoitukset ja puheenvuorot / Mediassa is the
  vocabulary the result-family badge now displays after PF3;
  chip labels stay per-page-topical rather than repeating the
  content-family label).
- **PF3** added the family badge on result cards. That gave chips
  a natural visual home right above the archive controls
  (family badge below, chip strip above the search input).

## 4. What starter chips are

Chips are small clickable shortcut buttons rendered as an
`<ul class="starter-chips-list">` inside `<div class="starter-chips"
data-starter-chips>`, near the search / filter UI.

Each chip is a `<button type="button" data-starter-chip …>` with
one of two behaviors:

1. **Target-mode**: sets an existing form field's `value` and
   dispatches an `input` / `change` event (inferred, override via
   `data-starter-chip-event="change|input|blur"`). Used for
   `/tutkimus/` and `/esitykset/` because their runtimes already
   listen to their own controls.
2. **Click-mode**: proxies a click to an already-existing filter
   button (`data-starter-chip-click="<css-selector>"`). Used for
   `/mediassa/` where the archive already ships button-based
   filters like `data-media-filter="type:video"`.

Runtime lives in `src/js/starter-chips.js`. It binds click handlers
on DOMContentLoaded, applies the chip, and manages an ARIA
single-select toggle inside the containing `[data-starter-chips]`
group (`aria-pressed="true"` on the last clicked chip, `"false"` on
siblings). No chip is pre-pressed on load.

## 5. What starter chips do not replace

- Free-text search — the page's existing search input remains the
  primary entry point.
- Advanced filtering — the full filter/select set beside the search
  input is unchanged.
- Result cards — no card is touched.
- Pagefind filters — no `data-pagefind-filter`, no
  `data-pagefind-meta`, no `data-pagefind-sort` added by chips.
- Archive navigation — no route change.
- Research membership logic — chips can only fill an existing topic
  or query control the Research contextual mount already accepts.
- Content-family labels — the `Sisältö:*` vocabulary is untouched.
- Canonical content models — no new taxonomy, no new frontmatter.

## 6. Page-specific behavior

Chip click always follows the same three steps:

1. Set the target field's value (or dispatch click on the existing
   filter button in `/mediassa/`).
2. Dispatch the appropriate DOM event so the page's existing
   runtime picks it up through its normal handler.
3. Update ARIA pressed state for the chip group.

The page runtimes handle everything downstream — no chip runtime
knows about Pagefind, archive JSON, or Research eligibility.

## 7. `/tutkimus/` chips

Target: `#researchEvidenceExploreTopic` (existing Find & Explore
topic `<select>` on the Research contextual mount).

Chips (values already present in `findExploreTopicOptions`):

| Label | Existing option value |
| --- | --- |
| Tekoäly | `tekoäly` |
| Opettajankoulutus | `opettajankoulutus` |
| Koulutusteknologia | `koulutusteknologia` |
| Yhteisöllinen oppiminen | `yhteisöllinen oppiminen` |

Not added: **Mobiilioppiminen** and **Data ja toimijuus** — PF1 §13
qualified those as "only if already supported by existing
topic/preset vocabulary". They are not in the current Research
`findExploreTopicOptions`, so per PF-STARTER §5 they cannot be
chips without inventing a new vocabulary. Documented as remaining
work.

Behavior: chip click fills the topic `<select>` and dispatches
`change`. The Find & Explore runtime's existing `topicSelect
change` listener runs the normal Research pipeline via
`filtersForKind` (which already maps `state.topic="tekoäly"` to
`PresentationResearchPreset=ai-literacy` for the presentations
kind, and to the family-specific `topic` filter for other kinds).
Research membership rule is unchanged: still
`contexts.includes("research")`.

## 8. `/esitykset/` chips

Target: `#presentation-archive-topic` (existing presentation
archive topic input with datalist autocomplete).

Chips (matching presentation `topics` values in the archive data):

- AI literacy
- Tekoäly
- Koulutusteknologia
- Opettajankoulutus
- Mobiilioppiminen

Behavior: chip click fills the topic search input and dispatches
`change`. The presentations-page runtime's existing topic listener
runs its normal narrow/expand pipeline against
`/data/presentations-page.json`. Canonical presentation model,
local vs external semantics, and Research eligibility are all
untouched.

Scoping: chip markup is emitted only when `archiveLocale == "fi"`
in `src/_includes/presentations/archive.njk`. English `/en/presentations/`
does not render the chips (deferred as remaining work).

## 9. `/mediassa/` chips

Target: existing media archive filter buttons
(`data-media-filter="type:article|type:video|type:podcast|topic:tekoaly|topic:avoin"`).

Chips (proxy the existing button click; no new filter values):

- Lehtijutut → clicks `data-media-filter="type:article"`
- Videot → clicks `data-media-filter="type:video"`
- Podcastit → clicks `data-media-filter="type:podcast"`
- Tekoäly ja koulutus → clicks `data-media-filter="topic:tekoaly"`
- Avoin tiede → clicks `data-media-filter="topic:avoin"`

Behavior: chip click dispatches `.click()` on the existing
filter button; the existing media archive runtime handles the rest
(sets `activeFilter`, resets `currentPage`, calls `render()`, and
updates the `is-active` class on the existing button).

Boundary: `mediaOutlet` is deliberately NOT chipped and NOT
promoted to a user-facing facet — same PF2 deferral remains.

## 10. Accessibility notes

- All chips are `<button type="button">` — keyboard focusable and
  natively announced.
- Each chip has a visible Finnish text label; no icon-only chips.
- `aria-pressed` toggles between `"false"` (default) and `"true"`
  (last clicked chip in the group) so screen readers announce the
  current selection.
- `.starter-chip:focus-visible` uses a 2px primary-color outline
  with 2px offset — matches existing site focus styling.
- Chip group carries `aria-label="Aloita tästä: …"` on the
  containing `[data-starter-chips]` for context.
- Chips are rendered as `<li>` items inside a `<ul>` for structural
  grouping without imposing a list role change.

## 11. Search / state behavior

- No search runs on page load solely because chips exist. The
  audit gate `runtimeDoesNotAutoSearch` verifies the runtime source
  contains no `fetch(`, `pagefind.search`, `ContentEngine.query`,
  or `runSearch(` calls — the runtime only sets values and
  dispatches events.
- Chip click reuses the page's existing debounced/immediate
  handlers. No debouncing, no throttling, no second event loop.
- Reset behavior: each page's existing reset button clears the
  page state. Chip `aria-pressed` state stays until the user clicks
  another chip in the group; resetting the underlying form does not
  automatically unpress chips. This is intentional so users can
  see which shortcut they last chose while iterating.
- URL / history integration: the target-mode chips (tutkimus,
  esitykset) update the underlying form control, which each page's
  existing runtime already syncs into the URL query string. No
  chip writes to `history` directly.

## 12. Research boundary

- Research membership rule unchanged: `contexts.includes("research")`.
- Research population verified via
  `scripts/audit-f4-research-built-output.js` on the PF-STARTER build:
  publications 53 + theses 169 + writings 62 + presentations 33 =
  **317**. Unchanged.
- No `Sisältö:Tutkimus` chip anywhere (audit gate
  `noChipEmitsSisaltoTutkimus`).
- Media never appears inside the Research contextual mount even
  after a chip click — browser smoke asserts `count === 0` for
  `[data-find-explore-results] a[href^='/mediassa/']` inside the
  Research mount.
- No chip on `/tutkimus/` uses a topic value that is not already in
  `findExploreTopicOptions`.

## 13. Media boundary

- No new global user-facing facet on media (audit gate
  `noChipEmitsMediaOutletFacet`).
- `mediaOutlet` remains Pagefind meta only.
- Media chips proxy existing archive filter buttons; the runtime
  is unchanged.
- Media is not enumerated in any Research surface.

## 14. Presentation boundary

- Presentation canonical model unchanged.
- Local vs external presentation semantics unchanged.
- Presentation Research eligibility (33) unchanged.
- Chip values are strings already in the presentation topics
  dataset; no new topic values are introduced.

## 15. Pagefind body-gate boundary

- No `data-pagefind-body` introduced (audit gate
  `noChipEmitsDataPagefindBody`).
- No `data-pagefind-filter` or `data-pagefind-meta` added by chips
  (audit gate `noChipEmitsNewPagefindFacet`).
- M2 + PF2 + PF3 reverse gates remain green.
- Pagefind index size unchanged: `fi:1163 / en:346` from
  `_site/pagefind/pagefind-entry.json`.

## 16. Files changed

New:

- `src/js/starter-chips.js` — 95 lines. Runtime.
- `src/css/starter-chips.css` — 46 lines. Chip pill + focus.
- `scripts/audit-pf-starter-chips.js` — deterministic audit.
- `tests/pf-starter-chips.spec.js` — 3 browser smokes.
- `docs/pf-starter-chips-2026-08-16.md` — this report.
- `docs/data/pf-starter-chips-audit-2026-08-16.json` — machine
  data.

Modified:

- `src/fi/tutkimus.md` — pageStyles / pageScripts adds
  `starter-chips.css` + `starter-chips.js`; chip strip
  rendered inside `#tutkimusnaytto` before the F&E include.
- `src/esitykset.njk` — pageStyles / pageScripts add
  `starter-chips.css` + `starter-chips.js`.
- `src/_includes/presentations/archive.njk` — chip strip rendered
  inside `.presentation-archive-root`, gated
  `{% if archiveLocale == "fi" %}` so EN `/en/presentations/`
  stays unchanged.
- `src/fi/mediassa.njk` — pageStyles / pageScripts add
  `starter-chips.css` + `starter-chips.js`; chip strip rendered
  inside `.media-browser` before the filter groups.

No template outside these four surfaces was touched. No product
JS other than the new starter-chips runtime was modified. No CSS
outside the new starter-chips.css was modified.

## 16b. CI reconciliation — chip contrast

The initial PF-STARTER push (`e4b4cdad`) failed
`tests/contrast.spec.js` for the Presentations page: the chip fill
(`--bs-body-bg`, ≈ white) sat on the archive section's
`bg-body-tertiary` container with a component-fill contrast ratio of
~1.08:1 vs the required 3.0:1 (`MIN_COMPONENT_CONTRAST` in
`tests/helpers/contrast.js`).

Fix applied to `src/css/starter-chips.css`:

- Chip default state: `background-color: transparent` +
  `border: 1px solid var(--bs-body-color)`. With the fill alpha
  below `hasVisibleFill`'s 0.5 threshold, the audit falls to the
  border-mode check, which measures the `--bs-body-color` border
  against the surrounding — ~15:1 on light theme, ~14:1 on dark.
- Hover: adds a 6% `--bs-body-color` overlay for feedback without
  crossing the 0.5 alpha threshold (still border-mode).
- Pressed (`aria-pressed="true"`): border and text swap to
  `--bs-primary`, keeping fill transparent. Primary is a Bootstrap
  token with ≥3:1 non-text contrast on both themes.

Contrast audit is now **14 / 14 pass** including the Presentations
page. Chip smoke and sibling smokes remained green after the
tweak. No renderer / no chip config / no vocabulary changed.

## 17. Verification

Local gates on the PF-STARTER branch build:

- `npm run build:no-og` — green (1442 HTML documents indexed;
  Pagefind entry `fi:1163 / en:346` — matches plain-main baseline).
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf-starter-chips.js` — all 11 gates green:
  chips per page `{ /tutkimus/: 4, /esitykset/: 5, /mediassa/: 5 }`,
  no rogue chip on `/en/*`, no chip pre-pressed, no chip emits a
  Pagefind facet or `mediaOutlet` or `Sisältö:Tutkimus` or
  `data-pagefind-body`, runtime does not auto-search.
- `node scripts/audit-pf2-sisalto-facet.js` — all gates green
  (750 detail records; no `data-pagefind-body` on any family).
- `node scripts/audit-pf3-result-card-consistency.js` — all 9
  gates green.
- `node scripts/audit-media-pagefind-m2.js` — all gates green
  including the reverse `noDetailUsesPagefindBody` guard.
- `node scripts/audit-f4-research-built-output.js` —
  `totalResearchPopulation: 317`.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `DISABLE_OG_IMAGES=true npx playwright test tests/pf-starter-chips.spec.js
  --workers=1` — **3 / 3 pass**:
  - `/tutkimus/` chip fills topic, no pre-pressed chip, no media
    hit inside Research.
  - `/esitykset/` chip fills topic, presentation cards remain
    visible.
  - `/mediassa/` chip proxies the existing filter button, non-video
    cards drop to 0 after clicking the Videot chip.
- Sibling smokes (`f2-find-explore-smoke`,
  `f3a-theses-find-explore`, `f3b-publications-find-explore`,
  `f4-research-find-explore`, `pf2-sisalto-facet`,
  `pf3-result-card-consistency`, `media-archive`,
  `presentations-archive`, `presentations-research-smoke`) —
  **27 / 27 pass**.

## 18. Remaining limitations

- **English pages**: `/en/research/`, `/en/presentations/`,
  `/en/media/` do NOT yet render chips. English parity is deferred
  as remaining work (chip labels would need to be authored per
  page in English while continuing to target Finnish underlying
  filter values).
- **`/tutkimus/` Mobiilioppiminen and "Data ja toimijuus" chips**
  not implemented — those topic values do not exist in the current
  Research `findExploreTopicOptions` and PF-STARTER-CHIPS §5
  forbids adding new topics.
- **No automatic recommendations**: chips are strictly
  user-triggered.
- **No second query model**: chips only fill existing controls.
- **PF-PERF1**: Pagefind startup performance audit still queued.
- **Writings segmentation**: still deferred.
- **Media outlet / source normalization**: still deferred.
- **Media / presentation archive card visual harmonization**:
  still deferred.

## 19. Next recommendation

**PF-PERF1 — Pagefind startup performance audit**. With PF2 shared
vocabulary, PF3 shared result card, and PF-STARTER user-triggered
shortcuts all landed, the remaining named workstream in PF1 §17 is
the deferred performance audit. It should stay audit-only until
concrete slow-startup evidence lands; if evidence remains absent
the audit can produce a documented "no action required" record
without any code change.

The English chip parity backlog (§18) is a smaller ergonomic
follow-up that can be picked up either before or after PF-PERF1.
