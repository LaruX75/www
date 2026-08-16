# PF4-IMPL — Result-Card Hierarchy Trim (Find & Explore)

Date: 2026-08-16
Status: Implementation. Renderer + CSS only. No Pagefind metadata,
no chip, no archive-card, no research-membership change.
Audit basis: `docs/pf4-result-card-hierarchy-audit-2026-08-16.md`
Machine data: `docs/data/pf4-result-card-hierarchy-audit-2026-08-16.json`
Audit script: `scripts/audit-pf4-result-card-hierarchy.js`

## 1. Scope

Apply the PF4 audit's chosen direction — **Option B: publication
badge trim + Option-A minimal shape for non-publication cards** — to
the shared Find & Explore result renderer. Every shared card now
renders the four-line default hierarchy:

```
Line 1: family badge · year
Line 2: title
Line 3: single primary metadata sentence
Line 4: excerpt / snippet (when useful)
Line 5: publication-only action row (Open / Source / Citation export)
```

Publication quality signals (peer-reviewed / open-access / JUFO /
citations) move from four colored Bootstrap badges into one
subdued uppercase micro-copy line. All existing publication actions
remain unchanged.

## 2. Starting point

- Branch created from `main` @ `30e1ae60f0fcbc4345d1ccc32701487410fa6f2b`
  (`docs: audit PF4 result-card hierarchy`).
- PF1 / PF2 / PF3 / PF-STARTER-CHIPS all closed on main.
- PF4 audit report present on main.
- Pre-PF4 Pagefind index size verified: `fi:1163 / en:346` — matches plain-main baseline.
- Research population verified: publications 53 + theses 169 + writings 62 + presentations 33 = **317**.

## 3. PF4 audit basis

The PF4 audit (`docs/pf4-result-card-hierarchy-audit-2026-08-16.md`)
compared four candidate directions against the ten criteria in the
prompt. Option B scored highest (§16 comparison table). Rationale
summary:

- Option A (minimal trim) leaves the publication density problem.
- Option B unifies non-publication cards to the §6 default AND
  demotes publication colored badges to one micro-copy line.
- Option C (spacing only) reduces perceived clutter but keeps the
  same information stack.
- Option D (blocked) is unnecessary; risk is bounded by preserving
  existing selectors.

## 4. Implementation summary

Files changed (5):

- `src/js/find-explore.js` — replaced per-family `resultMeta` array
  shapes with a single primary-meta sentence per family, moved
  `year` onto the family-header line, replaced the colored
  `publicationBadges()` helper with `publicationQualityLine()`
  (single subdued line), added `renderPrimaryMetaLine()` helper,
  added stable `data-find-explore-card-line="{family|primary-meta|quality|excerpt|actions}"`
  hooks on every rendered card region.
- `src/css/find-explore.css` — new rules for
  `.find-explore-result-year`,
  `.find-explore-result-primary-meta`,
  `.find-explore-result-publication-quality`. Family-header now
  uses `display: flex; align-items: baseline` so the year sits
  cleanly next to the family badge.
- `scripts/audit-pf4-result-card-hierarchy.js` (new) — 19-gate
  static audit that inspects the passthrough-copied
  `_site/js/find-explore.js` + `_site/css/find-explore.css` and
  proves the new helpers exist, the old colored badge helper is
  gone, publication actions are preserved, no forbidden
  `Sisältö:Tutkimus` / `FindExplore:*` visible label was
  introduced, no `data-pagefind-body` was added, and the
  starter-chip + bespoke archive card runtimes were NOT touched.
- `tests/pf4-result-card-hierarchy.spec.js` (new) — 6-case
  Playwright browser smoke asserting the four-line hierarchy on
  publications / theses / writings / Research contextual mount,
  the absence of technical labels, and the preservation of
  starter chips and bespoke archive cards.
- `docs/pf4-result-card-hierarchy-trim-2026-08-16.md` — this
  report.
- `docs/data/pf4-result-card-hierarchy-audit-2026-08-16.json` (new) —
  machine-readable audit output.

No detail template touched. No `.11tydata.js` touched. No family
document builder touched. No Pagefind filter emission changed. No
bespoke archive card runtime (`src/js/presentations-page.js`, the
inline media runtime in `src/fi/mediassa.njk`) modified. No chip
runtime / CSS / config touched.

## 5. Four-line card hierarchy

Every non-empty shared Find & Explore result card renders in this
order:

1. **Family header** — `data-find-explore-card-line="family"`:
   `<span class="find-explore-result-family-badge"
   data-find-explore-family="{kind}">{Sisältö label}</span>`
   optionally followed by
   `<span class="find-explore-result-year">{year}</span>`.
2. **Title** — `<a class="find-explore-result-title" href="{url}">`.
3. **Primary meta line** — `<p class="find-explore-result-primary-meta"
   data-find-explore-card-line="primary-meta">` containing a single
   family-specific sentence joined by ` · `. Empty parts drop
   cleanly so no orphan separator appears.
4. **Quality micro-copy** (publications only) —
   `<p class="find-explore-result-publication-quality"
   data-find-explore-card-line="quality">` when peer-reviewed /
   open-access / JUFO / citation data exists.
5. **Excerpt** — `<p class="find-explore-result-excerpt"
   data-find-explore-card-line="excerpt">` when non-empty.
6. **Action row** (publications only) —
   `<div class="d-flex flex-wrap gap-2 mt-2"
   data-find-explore-card-line="actions">` with the existing
   Open / Source / Citation-export buttons.

Non-publication cards stop after line 5. Publication cards close
with line 6.

## 6. Publication badge trim

Before (per hit, up to 4 colored badges):

```html
<span class="badge text-bg-primary">Vertaisarvioitu</span>
<span class="badge text-bg-success">Open access</span>
<span class="badge text-bg-light text-dark border">JUFO 3</span>
<span class="badge text-bg-warning text-dark">42 viittausta</span>
```

After (per hit, single subdued line):

```html
<p class="find-explore-result-publication-quality"
   data-find-explore-card-line="quality">
  VERTAISARVIOITU · OPEN ACCESS · JUFO 3 · 42 VIITTAUSTA
</p>
```

- Same underlying data.
- Same label strings from the shared `labels` bundle.
- One CSS-driven line instead of four differently-colored badges.
- Uppercase via CSS (`text-transform: uppercase`), so future
  localization of the label bundle doesn't need JS changes.
- Absence of any quality signal collapses the whole line (no empty
  paragraph rendered).

## 7. Thesis card behavior

- Family badge: `Opinnäytteet`.
- Year sits on line 1 (moved out of the meta strip).
- Primary meta line: `authorLine · thesesTypeLabel` (single
  sentence, both fields skipped safely when empty).
- Excerpt: `meta.thesesDescription || excerpt`.
- No action row.
- `data-find-explore-card-line="actions"` intentionally absent for
  theses (asserted in the browser smoke).

## 8. Writing card behavior

- Family badge: `Kirjoitukset ja puheenvuorot` for writings-only
  pages; `Julkaisut` for publication-backed writings (PF2
  publications-first priority preserved).
- Year sits on line 1.
- Primary meta line: `writingsTypeLabel` (single sentence — the
  writing type is now the one prominent metadata cue).
- Excerpt: `excerpt`.
- No action row.

## 9. Presentation result behavior

- Family badge: `Esitykset`.
- Year sits on line 1 (`PresentationYear` from Pagefind meta).
- Primary meta line: `presentationType · presentationEvent`,
  either field can be missing safely. Both fields already exist
  in the Pagefind meta from `scripts/_lib/presentationPagefind.js`
  (no metadata change).
- Excerpt: `record.description || excerpt`.
- No action row.
- `/esitykset/` bespoke archive cards (`presentation-archive-card`)
  are unchanged (audit gate `presentationArchiveCardUntouched`).

## 10. Media / shared-renderer boundary

- Media is still NOT a `kind` in the shared Find & Explore
  renderer. PF4 did not add one (out-of-scope per PF4 audit §11).
- `SISALTO_LABELS.media = "Mediassa"` from PF3 remains as a
  fallback for any future shared-renderer surface, but no path
  actually creates a `kind: "media"` entry today.
- `/mediassa/` bespoke media archive cards
  (`media-archive-card`) unchanged (audit gate
  `mediaArchiveCardUntouched`).

## 11. Research boundary

- Research membership rule unchanged: `contexts.includes("research")`.
- Research population unchanged: **317** (publications 53 + theses
  169 + writings 62 + presentations 33). Verified post-PF4 via
  `scripts/audit-f4-research-built-output.js`.
- No `Sisältö:Tutkimus` introduced anywhere (audit gate
  `noForbiddenTokenInFamilyBlock`).
- No topic mapping used as Research membership.
- Media not enumerated in any Research surface.

## 12. Writings boundary

- No writings restructuring.
- No writings genre split.
- No archive route change.
- PF2 publications-first resolver priority preserved: a
  publication-backed writing (56 items) continues to render as
  `Julkaisut` with the publication card path, gaining the new
  Open / Source / Citation-export action row.
- Deep PF1 open question (`scientificPublication` visibility
  inside `/kirjoitukset/`) intentionally not resolved by PF4.

## 13. Starter-chip boundary

- No chip runtime touched (`src/js/starter-chips.js`).
- No chip CSS touched (`src/css/starter-chips.css`).
- No chip HTML touched on any page.
- Audit gates `starterChipRuntimeUntouched` and
  `starterChipCssUntouched` verify that neither of those files
  gained any `find-explore-result-*` class reference in this
  PR's diff.

## 14. Pagefind body-gate boundary

- No `data-pagefind-body` introduced (audit gate
  `noDataPagefindBodyInRenderer`).
- No detail template touched.
- No Pagefind filter emission changed.
- Pagefind index size after PF4: `fi:1163 / en:346` (from
  `_site/pagefind/pagefind-entry.json`) — identical to plain-main
  baseline. M2 + PF2 reverse gates remain green.

## 15. Files changed

- `src/js/find-explore.js`
- `src/css/find-explore.css`
- `scripts/audit-pf4-result-card-hierarchy.js` (new)
- `tests/pf4-result-card-hierarchy.spec.js` (new)
- `docs/pf4-result-card-hierarchy-trim-2026-08-16.md` (new)
- `docs/data/pf4-result-card-hierarchy-audit-2026-08-16.json` (new)

## 16. Verification

Local gates on the PF4-IMPL branch build:

- `npm run build:no-og` — green.
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf4-result-card-hierarchy.js` — all 19
  gates green.
- `node scripts/audit-pf-starter-chips.js` — all 11 gates green.
- `node scripts/audit-pf3-result-card-consistency.js` — all 9
  gates green.
- `node scripts/audit-pf2-sisalto-facet.js` — all 9 gates green
  (750 detail records).
- `node scripts/audit-media-pagefind-m2.js` — all gates green
  including the reverse `noDetailUsesPagefindBody` guard.
- `node scripts/audit-f4-research-built-output.js` —
  `totalResearchPopulation: 317`, media not enumerated.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `DISABLE_OG_IMAGES=true npx playwright test tests/pf4-result-card-hierarchy.spec.js
  --workers=1` — **6 / 6 pass**.
- Sibling + contrast smokes (`tests/pf3-result-card-consistency`,
  `tests/pf-starter-chips`, `tests/pf2-sisalto-facet`,
  `tests/f2-find-explore-smoke`, `tests/f3a-theses-find-explore`,
  `tests/f3b-publications-find-explore`,
  `tests/f4-research-find-explore`, `tests/media-archive`,
  `tests/presentations-archive`,
  `tests/presentations-research-smoke`, `tests/contrast`) —
  **44 / 44 pass**.

## 17. Remaining limitations

- **PF-PERF1**: Pagefind startup performance audit still queued.
- **Writings segmentation**: PF1 open question remains.
- **Media outlet / source normalization**: still deferred.
- **Bespoke media archive cards** (`article.media-archive-card`)
  and **bespoke presentation archive cards**
  (`article.presentation-archive-card`) not redesigned — they
  still use their own visual vocabulary. A future harmonization
  is a separate, larger workstream.
- **English starter-chip parity** (`/en/research/`,
  `/en/presentations/`, `/en/media/` — chips not present) still
  deferred.
- **Publication actions on Research contextual mount** — the
  Research mount does not populate `entry.record` from a
  publications JSON store, so publication hits inside
  `/tutkimus/` still render via the generic card path (no Open /
  Source / Citation-export action row). This is pre-existing
  behavior preserved by PF4; the shared four-line hierarchy still
  applies on those hits.

## 18. Next recommendation

**PF-PERF1** — Pagefind startup performance audit, kept
audit-only until concrete slow-startup evidence lands. With PF2
(Sisältö vocabulary), PF3 (family badge), PF-STARTER (starter
chips), and PF4 (card hierarchy) all shipped, the Find & Explore
discovery surface is complete. The remaining known workstream in
PF1 §17 is the deferred performance audit. It can produce a
documented "no action required" record without any code change
if no performance regression evidence surfaces.
