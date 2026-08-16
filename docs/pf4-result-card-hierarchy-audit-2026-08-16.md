# PF4 — Result-Card Hierarchy / Card Trim Audit

Date: 2026-08-16
Status: **PF4 RESULT-CARD HIERARCHY AUDIT = DECIDED / GREEN**
Mode: audit only — no source code touched, no Pagefind metadata
touched, no chip changes, no research or writings semantics changed.
Basis:
- `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md` §14
- `docs/pf2-shared-sisalto-facet-closure-2026-08-16.md`
- `docs/pf3-result-card-consistency-closure-2026-08-16.md`
- `docs/pf-starter-chips-closure-2026-08-16.md`

## 1. Status

Recommendation: **B — Publication badge trim**, coupled with the
Option-A minimal shape for non-publication cards. Rationale in §16.

## 2. Repository state

- Branch: `main`
- HEAD before this commit: `cb70af904692346bb04ec5124d2c0e6043af2d41`
  (`docs: close PF-STARTER-CHIPS rollout`).
- `origin/main` in sync with local main.
- Worktree clean for closure scope; only unrelated
  `.cache/api-fallback/*.json` remain dirty and are not staged.
- All required PF closure docs present:
  - `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md`
  - `docs/pf2-shared-sisalto-facet-closure-2026-08-16.md`
  - `docs/pf3-result-card-consistency-closure-2026-08-16.md`
  - `docs/pf-starter-chips-closure-2026-08-16.md`
- Shared renderer present: `src/js/find-explore.js`.
- CSS present: `src/css/find-explore.css`.
- PF2/PF3/PF-STARTER audit scripts all present.

## 3. Background: PF1 → PF2 → PF3 → PF-STARTER sequence

- **PF1** identified user-facing discovery gaps; §14 spelled out
  "Result Card Consistency" with the target minimal shared
  vocabulary: visible content-family label, year/date, one
  secondary metadata line, local-vs-external cue when relevant,
  short snippet.
- **PF2** landed the shared `Sisältö:*` Pagefind facet across all
  five families (750 detail records).
- **PF3** rendered that `Sisältö:*` label as a visible badge above
  every non-empty shared Find & Explore result card. PF3 was
  strictly additive to preserve publication-card richness —
  authors, publication type/group, year, venue, plus peer-reviewed
  / open-access / JUFO / citation badges plus source + citation
  buttons all still shown.
- **PF-STARTER-CHIPS** placed a first-touch shortcut strip on
  `/tutkimus/`, `/esitykset/`, `/mediassa/`, each chip wrapping an
  existing filter/topic/query control the runtime already
  understood.

Everything above is on `main` and passes CI.

## 4. Current problem

The additive strategy across PF2 → PF3 → PF-STARTER means the
shared Find & Explore result card, particularly on `/julkaisut/`
and `/tutkimus/`, can now render up to five stacked information
strips per hit:

1. Family badge (PF3)
2. Title
3. Meta strip (authors + type + year + venue for publications)
4. Colored quality badges (peer-reviewed + open-access + JUFO + citations)
5. Excerpt
6. Action button row (open + source + citation-export)

Non-publication cards are the opposite problem: family badge +
title + a bare 1–3 element meta strip + excerpt — visually thin
compared to publications, so users see a jarring density delta
when a search returns mixed kinds (typical on `/tutkimus/`).

Neither shape breaks anything, but PF1 §14 called out "same
title / meta / URL / thumbnail treatment" as the ideal, and PF3
deliberately stopped short of that.

## 5. Current card inventory by family

Data derived from reading `src/js/find-explore.js` (post-PF3)
without changing it.

### Publications (`renderPublicationResult`, `kind === "publications"`)

- Family badge: `Julkaisut` (from PF3)
- Title: `<a class="find-explore-result-title">` linking to `pageUrl`
- Meta strip (`resultMeta`): authors + typeCode/group + year + venue
- Quality badges: `<span class="badge text-bg-primary">peer-reviewed</span>`,
  `text-bg-success">open-access</span>`,
  `text-bg-light text-dark border">JUFO N</span>`,
  `text-bg-warning text-dark">citations N</span>`
- Excerpt: `record.description || meta.publicationDescription || excerpt`
- Actions: `Open` button (primary), `Source` (outline-primary,
  external), `Citation export` (outline-secondary, opens modal)
- Result: **6-strip stack + up to 4 badges + 3 action buttons**

### Theses (generic renderer, `kind === "theses"`)

- Family badge: `Opinnäytteet`
- Title
- Meta strip: `authorLine` + `thesesType` + `year`
- Excerpt: `meta.thesesDescription || excerpt`
- Actions: none from the shared renderer (title link is the only
  affordance)
- Result: **4-strip stack**

### Writings (generic renderer, `kind === "writings"`)

- Family badge: `Kirjoitukset ja puheenvuorot` for writings-only
  pages (publication-backed writings fall to the publications
  renderer via PF2 priority)
- Title
- Meta strip: `state.typeLabel` + `state.year` (2 items)
- Excerpt: `excerpt`
- Actions: none
- Result: **4-strip stack, thinnest of the four**

### Presentations inside Research (generic renderer, `researchContext` kind)

- Family badge: `Esitykset`
- Title
- Meta strip: `[year]` only (single item) — presentations kindConfig
  `resultMeta` returns exactly `[entry.year]`
- Excerpt: `record.description || excerpt`
- Actions: none
- Result: **3-strip stack + 1 meta chip — thinnest visible density**

### Media in shared renderer

- Not actually surfaced by the shared Find & Explore renderer today
  (no `kind === "media"` mount exists — media has its own inline
  archive runtime in `src/fi/mediassa.njk`). PF3 added a
  fallback `media → Mediassa` to `SISALTO_LABELS` but no shared
  runtime consumes it yet.
- On the global search UI (`/hae/`, `/en/search/`), media URLs
  come through Pagefind's default result card, which is the
  Pagefind default UI component — outside the Find & Explore
  renderer this audit targets.

Bespoke archive cards on `/esitykset/`
(`article.presentation-archive-card`) and `/mediassa/`
(`article.media-archive-card`) are explicitly out of scope. They
carry their own denser vocabulary (thumbnails, badges, meta rows,
description, actions), but that is a separate visual-harmonization
workstream, not PF4.

## 6. Proposed result-card hierarchy

Test target from §5 of the prompt, restated as the default shape
every shared Find & Explore result card should meet:

```
Line 1: [family badge]  ·  [year / date]
Line 2: title
Line 3: one primary metadata line  (family-specific text, not chips)
Line 4: excerpt / snippet (when useful)
Line 5: action row (families that truly need it — publications only)
```

Rationale:

- Line 1 collapses the two most important context anchors
  (family + when) into one lightweight strip. Currently they
  live on separate visual layers.
- Line 3 is a single sentence-shaped text line, not a chip
  row, so families with only 1–2 metadata items don't look
  stripped and families with more (publications) still have a
  natural place to hold their extra fields.
- Line 4 kept optional — excerpt drives free-text search
  comprehension, but empty excerpts should collapse cleanly.
- Line 5 restricted to publications by default; other families
  don't need it (title link is enough for theses / writings /
  presentations in a shared search context).

## 7. Publication-card recommendation

**Keep by default**:

- Family badge (`Julkaisut`) — from PF3.
- Year (in the family-badge line, per §6).
- Title.
- Primary meta line: `authors · publication type · venue`
  (drop the year from this line since it's now on line 1).
- Excerpt (short authored description, already the current
  behavior).
- Open button (primary) — the main affordance.
- Source button (outline-primary, external link) — high-value
  for academic use.
- Citation-export button — kept because it's a real academic
  workflow, already conditional on the export modal being on
  the page.

**Demote from default**:

- Colored quality badges (peer-reviewed / open-access / JUFO /
  citations). These deliver academic signal but also produce
  the density gap PF4 is trying to close.
- Recommended replacement: merge into a single small text line
  under the meta strip, using the existing labels but as
  plain uppercase micro-copy rather than colored badges. Example:
  `PEER-REVIEWED · OPEN ACCESS · JUFO 3 · 42 CITATIONS`.
- Rationale: the information stays; the visual noise drops from
  four colored pills to one grey line that reads at title +
  metadata scale.

**Do not remove**:

- Nothing else. All existing fields must remain readable —
  academic use of the page depends on peer-review / open-access
  disclosure.

## 8. Thesis-card recommendation

Adopt the §6 default shape:

```
Opinnäytteet · 2023
[title]
Author · Pro gradu / Väitöskirja  (single primary metadata line)
[excerpt]
```

- Primary meta line: **`authorLine · thesesTypeLabel`**. This
  combines the two most-discovery-relevant fields into a single
  sentence. Role (supervised / reviewed) is available in
  `meta.thesesRole` but is a less prominent user question in a
  shared search view; move it into the excerpt / detail page.
- Drop the year from the meta strip (now on line 1).
- Excerpt: keep `meta.thesesDescription || excerpt`.
- No action buttons in the shared card — title link stays the
  only affordance (a per-thesis local detail page already exists,
  so extra buttons duplicate the title link).

## 9. Writing-card recommendation

Adopt the §6 default shape:

```
Kirjoitukset ja puheenvuorot · 2022
[title]
Puhe / Blogikirjoitus / Mielipide / Kolumni / Lausunto / Aloite
[excerpt]
```

- **Primary meta line is the writing type**, promoted to a
  proper sentence line so users can tell a Puhe from a
  Blogikirjoitus without opening the card.
- Drop the year from the meta strip (line 1).
- Excerpt: kept.
- No action buttons in the shared card.
- The publications-first resolver priority is preserved (a
  publication-backed writing continues to render as
  `Julkaisut` in the badge and via `renderPublicationResult`).

Explicitly not attempted in PF4: splitting writings into
separate archives or removing `scientificPublication` from
`/kirjoitukset/`. Those remain deferred as PF1's open questions.

## 10. Presentation-result recommendation

Adopt the §6 default shape:

```
Esitykset · 2021
[title]
Presentation type · Event or venue  (fall back to just one if the other is missing)
[excerpt]
```

- Presentation cards inside `/tutkimus/` currently show only
  `[year]` on the meta line, which is the thinnest of all
  families. PF4 recommends adding `presentationType` and/or
  `presentationEvent` (both already in Pagefind meta from
  `scripts/_lib/presentationPagefind.js`) as the single meta
  sentence line.
- Local-vs-external cue: already surfaced via
  `PresentationLandingType` in Pagefind meta
  (`localDetail` / `externalSource`). Consider a small text
  suffix like `· Ulkoinen lähde` when relevant, only when
  `PresentationLandingType === "externalSource"`. Keep this
  optional to avoid visual weight duplication with the family
  badge.
- Excerpt: `record.description || excerpt` kept as-is.
- No archive card redesign; `/esitykset/` archive keeps its
  bespoke `presentation-archive-card`.

## 11. Media-result recommendation

- Media is not currently a `kind` in the shared Find & Explore
  renderer. PF4 does not need to reshape a card that isn't
  rendered.
- **Explicit recommendation**: do NOT add a `kind === "media"`
  to the shared renderer during PF4 implementation. That would
  materially change discovery scope and is out of scope.
- If media hits reach the shared renderer in a future
  refactor, the same §6 shape applies:
  `Mediassa · YYYY-MM-DD / [title] / [mediaType label] · [role
  label] / excerpt`. Outlet stays hidden by default because
  outlet normalization is deferred (PF-STARTER-CHIPS closure
  §11).

## 12. Research boundary

- Research population verified unchanged pre-PF4:
  publications 53 + theses 169 + writings 62 + presentations 33
  = **317**.
- Research membership rule unchanged:
  `contexts.includes("research")`.
- No `Sisältö:Tutkimus` recommended anywhere in PF4.
- No topic-mapping-as-membership recommended.
- Card trimming does not touch any Research filter, preset, or
  membership rule.
- On the `/tutkimus/` contextual mount, the family badge (PF3)
  already communicates "this hit is a publication / thesis /
  writing / presentation" inside the Research view. Additional
  "Research" visual cue is unnecessary and would risk making
  Research look like a duplicate content family (which PF1
  explicitly warned against).

## 13. Starter-chip interaction

- After clicking a chip, results currently render with the same
  density as any other search — which on `/julkaisut/` and
  `/tutkimus/` means the density gap between publications and
  everything else is amplified because the chip narrows scope
  but not shape.
- The family badge helps users read chip results, especially on
  the Research contextual mount which mixes 4 kinds.
- Do the cards repeat concepts implied by the chip? Sometimes,
  yes: a `Tekoäly` chip on `/tutkimus/` may narrow to hits
  whose meta strip repeats "Tekoäly" as a keyword. PF4 does
  not attempt to de-duplicate that; excerpt content is what
  the user reads.
- Trimming to the §6 shape would improve the starter-chip
  experience by giving every chip-triggered result the same
  four-line rhythm.

## 14. Performance note

- Card trimming reduces DOM node count per result but does not
  change Pagefind's index size or the runtime's query cost.
- The Pagefind index size on `main` remains `fi:1163 / en:346`
  from `_site/pagefind/pagefind-entry.json`.
- No PF-PERF1 evidence has surfaced; startup performance
  audit stays queued.
- If PF4 implementation removes DOM strips per result, incidental
  render-time savings are small (kilobytes of HTML per query at
  most).

## 15. Risks

- **Publication-badge demotion risk**: replacing colored
  badges with a compact text line risks reducing academic
  credibility signal at first glance. Mitigation: keep the
  labels themselves (Vertaisarvioitu / Open access / JUFO /
  citations) — only the visual weight drops. Preserve the exact
  same underlying data.
- **Meta-line pattern risk**: not every publication has both
  authors AND venue AND type. The renderer must gracefully
  drop empty items (`.filter(Boolean).join(" · ")`) — the
  current `resultMeta` already does this, so the pattern
  transfers safely.
- **Excerpt-collapse risk**: empty excerpts must render nothing,
  not an empty paragraph — current code already gates on
  `entry.excerpt`.
- **Presentation local/external suffix risk**: adding
  "· Ulkoinen lähde" could visually compete with the family
  badge. Mitigation: keep it as a plain grey text suffix, not a
  badge.
- **Line-1 badge + year collision risk**: some records have no
  year (e.g. thesis records with `year = ""`). Line 1 must
  degrade to badge-only when year is missing.
- **Sibling smoke risk**: PF2/PF3/PF-STARTER audits and browser
  smokes assert current markup shapes (e.g. PF3 asserts the
  publication-card open button is visible). Implementation must
  keep those assertions green — most easily by preserving the
  existing selectors and only re-ordering / restyling.

## 16. PF4 implementation recommendation

**NEXT WORKSTREAM = B — PUBLICATION BADGE TRIM (with Option-A minimal shape for non-publications).**

Adopts the §6 shape site-wide for the shared Find & Explore
result cards, plus the §7 publication badge demotion. Concretely:

- All non-publication cards adopt the §6 default:
  `family badge · year / title / one primary metadata line / excerpt`.
  The per-family primary meta line is:
  - Theses: `authorLine · thesesTypeLabel`.
  - Writings: `writingsTypeLabel` (single string).
  - Presentations (inside `researchContext`): `presentationType
    · presentationEvent` with local/external suffix when
    `PresentationLandingType === "externalSource"`.
- Publications keep authors + type + venue on the meta strip,
  drop the redundant year, and replace the colored quality
  badge row with a single small uppercase text line
  (peer-reviewed · open-access · JUFO N · citations N — only
  those that apply).
- Keep publication actions (`Open` + `Source` +
  `Citation-export`).
- Preserve every existing selector the PF3 browser smoke and
  the PF-STARTER browser smoke assert on.

Why B and not A / C / D:

- **A** (minimal trim only): leaves the publication density
  problem unfixed; the density gap between publications and
  everything else stays.
- **C** (spacing only): reduces perceived clutter but leaves
  the same information density; unlikely to close the PF1 §14
  "same title / meta / URL / thumbnail treatment" gap.
- **D** (blocked): unnecessary. The renderer is one file, the
  publication card decisions are testable, and the risk is
  bounded by preserving selectors and text.

Selection criteria (per prompt §15):

| Criterion | A | **B** | C | D |
| --- | --- | --- | --- | --- |
| 1. User comprehension | + | ++ | + | 0 |
| 2. Visual density | + | ++ | + | 0 |
| 3. Implementation risk | + | + | ++ | ++ |
| 4. Publication usefulness | + | + | + | 0 |
| 5. Research boundary safety | ++ | ++ | ++ | ++ |
| 6. Writings clarity | + | ++ | 0 | 0 |
| 7. Reuse across shared renderer | ++ | ++ | + | 0 |
| 8. Risk of hiding important academic context | ++ | + | ++ | ++ |
| 9. Accessibility / readability | + | ++ | + | 0 |
| 10. Preservation of PF2/PF3/PF-STARTER behavior | ++ | ++ | ++ | ++ |

**B** scores best on 7 / 10 with no criterion worse than +.

## 17. Explicitly out of scope

- Bespoke archive card redesigns on `/esitykset/`
  (`.presentation-archive-card`) and `/mediassa/`
  (`.media-archive-card`).
- Starter chip changes.
- Writings segmentation (`scientificPublication` visibility
  inside `/kirjoitukset/`).
- Media outlet / source normalization.
- Adding media as a shared Find & Explore `kind`.
- English chip parity.
- New Pagefind facets, filter emission, or `data-pagefind-body`.
- Research semantic change or Research member addition.
- Pagefind startup performance work (PF-PERF1 stays queued).
- Adding `Sisältö:Tutkimus`.
- Adding media to Research.

## 18. Next prompt outline

Suggested implementation prompt (do not run here):

> **PF4-IMPL — RESULT-CARD HIERARCHY TRIM (FIND & EXPLORE)**
>
> Adopt the §6 default shape site-wide for the shared Find &
> Explore result cards (line 1: family badge · year, line 2:
> title, line 3: single primary meta line, line 4: excerpt,
> line 5: publication-only action row). Trim publication badges
> to a single small uppercase text line while preserving open /
> source / citation-export buttons.
>
> Exact files likely to change:
>
> - `src/js/find-explore.js` — update each family's
>   `resultMeta`, add a small helper for the combined "family
>   badge · year" line, replace the publication badges block
>   with a compact micro-copy line, wire the presentation
>   local/external suffix.
> - `src/css/find-explore.css` — new `.find-explore-result-year`
>   suffix rule inside the family header, a
>   `.find-explore-result-publication-quality` small-caps rule,
>   optional local/external cue rule.
>
> Metadata lines to keep per family (default):
>
> - Publications: `authors · type · venue` + micro-copy quality
>   line + action row.
> - Theses: `authorLine · thesesTypeLabel`.
> - Writings: `writingsTypeLabel`.
> - Presentations (researchContext): `presentationType
>   · presentationEvent` + optional `· Ulkoinen lähde`.
>
> Metadata lines to hide or demote per family:
>
> - Publications: drop year from meta strip (moved to line 1);
>   demote 4 colored badges to 1 grey micro-copy line.
> - Theses: drop year from meta strip (moved to line 1); role
>   moves into detail page / excerpt.
> - Writings: drop year from meta strip.
> - Presentations: drop year from meta strip; presentation
>   type promoted from meta chip to sentence.
>
> Tests to add or update:
>
> - `tests/pf4-result-card-hierarchy.spec.js` — asserts each
>   family renders the four-line shape and publications keep
>   Open / Source / Citation-export buttons.
> - `tests/pf3-result-card-consistency.spec.js` — update if the
>   existing family badge selectors change (they should not);
>   otherwise leave green as-is.
>
> Audits to run:
>
> - `scripts/audit-pf3-result-card-consistency.js` — still green.
> - `scripts/audit-pf2-sisalto-facet.js` — still green.
> - `scripts/audit-media-pagefind-m2.js` — still green.
> - `scripts/audit-f4-research-built-output.js` —
>   `totalResearchPopulation: 317`.
> - `scripts/audit-presentation-pagefind.js` — still `ok: true`.
> - `scripts/audit-pf-starter-chips.js` — still green.
> - Optional new `scripts/audit-pf4-result-card-hierarchy.js`
>   that inspects the passthrough-copied `_site/js/find-explore.js`
>   for the presence of the new line-1 helper and the absence
>   of the old colored badge block.
>
> Boundaries to preserve:
>
> - No new Pagefind facet, meta, sort, or body-scope attribute.
> - No detail template touched.
> - No chip runtime touched.
> - No Research semantic change.
> - Research population stays 317.
> - Media not added to Research.
> - `Sisältö:Tutkimus` not introduced.
> - Bespoke archive cards on `/esitykset/` and `/mediassa/`
>   untouched.
> - Publication-card open / source / citation-export buttons
>   remain visible and testable via existing selectors.

STOP after committing the audit.
