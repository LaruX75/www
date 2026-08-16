# PF3 — Result-Card Consistency (Find & Explore)

Date: 2026-08-16
Status: Implementation. Additive, renderer-only, no data-model change.
Decision-audit basis: `docs/pf3-result-card-vs-starter-chips-decision-audit-2026-08-16.md`
PF2 basis: `docs/pf2-shared-sisalto-facet-2026-08-16.md`
PF1 §14 basis: `docs/pf1-user-facing-discovery-model-audit-2026-08-16.md`
PF3 machine data: `docs/data/pf3-result-card-consistency-audit-2026-08-16.json`

## 1. Scope

Show the shared PF2 `Sisältö:*` content-family label as a visible badge
at the top of every non-empty Find & Explore result card, so that users
who filter by `Sisältö:Julkaisut` etc. get immediate visual confirmation
of what family a result belongs to — without redesigning archive
layouts, splitting writings, changing Research membership, touching
bespoke archive card runtimes (`/esitykset/`, `/mediassa/`), or
introducing `data-pagefind-body`.

## 2. Starting point

- Branch created from `main` @ `7c21e3858c6e66f00de2891cc3de33ace2410eaf`
  (`docs: audit next Pagefind discovery workstream`).
- All PF1 / PF2 artifacts present on main.
- Research population 317, media not in Research (verified pre-PF3).
- Post-PF2 Pagefind index size `fi:1163 / en:346` (verified pre-PF3).

## 3. Decision audit basis

The decision audit (`docs/pf3-result-card-vs-starter-chips-…-2026-08-16.md`)
picked **result-card consistency** as the next workstream over PF3
starter chips or PF-PERF1, because:

- PF2 supplied every Pagefind result with a `Sisältö:*` filter, but no
  result card visibly rendered it.
- The Find & Explore renderer is a single shared surface used by
  `/tutkimus/`, `/kirjoitukset/`, `/opinnaytteet/`, `/julkaisut/`, and
  the site-wide search pages — one change amplifies PF2 across all
  five families simultaneously.
- Publications keep their rich cards; other families gain the missing
  visible family cue.
- No concrete performance regression exists to justify PF-PERF1
  ahead of this work.

## 4. Implementation summary

Changes in `src/js/find-explore.js`:

- New `SISALTO_LABELS` map mirroring PF2's Finnish vocabulary:
  `publications → Julkaisut`, `theses → Opinnäytteet`,
  `writings → Kirjoitukset ja puheenvuorot`,
  `presentations → Esitykset`, `media → Mediassa`.
- New `contentFamilyLabelFromData(kind, data)` helper that prefers the
  `data.filters["Sisältö"][0]` value emitted by PF2 and falls back to
  the kind → label map.
- New `renderFamilyHeader(entry)` helper that returns a small
  `<div class="find-explore-result-family"><span
  class="find-explore-result-family-badge"
  data-find-explore-family="{kind}">{label}</span></div>` block.
  Returns empty string if no label — cards without a resolvable
  family degrade gracefully.
- `createResultEntry` now stores `contentFamilyLabel` on the returned
  entry so both the publication renderer and the generic renderer
  read the same value.
- Both `renderPublicationResult` and the generic branch in
  `renderResults` now emit `renderFamilyHeader(entry)` at the top of
  the card — publication badges / source / citation buttons remain
  intact.

Changes in `src/css/find-explore.css`:

- Adds `.find-explore-result-family` (spacing wrapper) and
  `.find-explore-result-family-badge` (small pill: tertiary bg,
  border, secondary text, 0.72rem font, uppercase, 0.55rem padding).
  Deliberately visually lighter than the publication badges so it
  reads as a category marker, not a metric.

New audit + test:

- `scripts/audit-pf3-result-card-consistency.js` — static audit that
  inspects the passthrough-copied `_site/js/find-explore.js` and
  verifies the label map, helpers, and CSS hooks exist; also
  reverse-guards against `Sisältö:Tutkimus` and any
  `FindExplore:*` token leaking into the visible family scope.
- `tests/pf3-result-card-consistency.spec.js` — Playwright browser
  smoke exercising each family's Find & Explore mount and asserting
  the correct visible label.
- `docs/pf3-result-card-consistency-2026-08-16.md` — this report.
- `docs/data/pf3-result-card-consistency-audit-2026-08-16.json` —
  machine-readable audit output.

No product template or `.njk` file was touched. No `.11tydata.js`
was touched. No family document builder was touched. No Pagefind
filter emission was changed. No `data-pagefind-body` was introduced.
No `Sisältö:*` value was added or removed. No bespoke archive card
runtime (`src/js/presentations-page.js`, the inline media runtime
in `src/fi/mediassa.njk`) was modified.

## 5. Result-card vocabulary

Rendered inside a `<span class="find-explore-result-family-badge"
data-find-explore-family="{kind}">…</span>` at the top of every
non-empty Find & Explore result card:

- `Julkaisut` (kind `publications`)
- `Opinnäytteet` (kind `theses`)
- `Kirjoitukset ja puheenvuorot` (kind `writings`)
- `Esitykset` (kind `presentations`)
- `Mediassa` (kind `media`)

Deliberately Finnish across FI and EN mounts — matches the actual
PF2 Pagefind filter value so a user who reads `Sisältö:Julkaisut`
in the search UI sees the same string on the card. English display
translations are a separate follow-up in the PF3 remaining
limitations list.

## 6. Family behavior

- **Publications**: family header appears above the existing rich
  card. Peer-reviewed / open-access / JUFO / citation badges,
  source link, citation button — all unchanged.
- **Theses**: family header appears above title. Existing
  `resultMeta` (author line + type label + year) is unchanged.
- **Writings**: family header shows the content-family label
  users could not previously see. Existing meta strip (type +
  year) is unchanged. Publication-backed writings still resolve
  to `Julkaisut` per PF2's publications-first priority — the
  badge reflects that automatically.
- **Presentations inside Research**: family header appears on
  the `researchContext` mount because `researchContext` entries
  carry the inner family kind. Existing kindLabel meta strip
  behavior is preserved.
- **Media in shared search**: shared renderer maps to `Mediassa`
  via the `SISALTO_LABELS` fallback. Media is not currently a
  first-class Find & Explore kind, so this fires only if a
  future kind gains `kind: "media"`. No behavior change in the
  media archive itself.

## 7. Publications boundary

- `renderPublicationResult` continues to render
  `find-explore-result--publication` with:
  - title
  - meta strip (authors + type/group + year + venue)
  - badges: peer-reviewed, open-access, JUFO, citations
  - excerpt
  - open button + source button + citation-export button
- PF3 adds only the family header above the title. No other
  metric, badge, or button was removed, reordered, or restyled.
- Verified by the Playwright smoke:
  `firstPublicationCard.locator(".find-explore-result-title")`
  visible, open button visible.

## 8. Writings boundary

- Writings-only pages continue to render as writings; the
  family badge reads `Kirjoitukset ja puheenvuorot`.
- Publication-backed writing pages continue to resolve to
  `publications` in `resolvePagefindDocument` (PF2 priority) and
  therefore render as publications with the `Julkaisut` badge and
  the rich card — unchanged.
- No writings genre split, no archive route change, no
  frontmatter field mutation.
- The PF1 open question about `scientificPublication` visibility
  inside `/kirjoitukset/` remains explicitly deferred.

## 9. Research boundary

- `/tutkimus/` contextual mount continues to search publications,
  theses, writings, and presentations under the Research context
  filter — unchanged.
- Research population (from `scripts/audit-f4-research-built-output.js`):
  publications 53 + theses 169 + writings 62 + presentations 33 =
  **317**. Unchanged.
- Media is not enumerated in Research; PF3 does not add media to
  any Research surface.
- No `Sisältö:Tutkimus` badge (guarded by the PF3 audit's
  `noForbiddenVisibleTokens` gate).
- No `resolveContexts()` change.
- No topic mapping change.

## 10. Media / presentations archive boundary

- `src/js/presentations-page.js` untouched by PF3 (verified via
  audit gate `presentationsArchiveUntouched`).
- The inline media archive runtime in `src/fi/mediassa.njk`
  untouched by PF3 (verified via audit gate
  `mediaArchiveUntouched`).
- `article.presentation-archive-card`,
  `article.media-archive-card`, and their feature variants keep
  their bespoke design. Result-card consistency in those archives
  belongs to a later, larger checkpoint.

## 11. Pagefind body-gate boundary

- No `data-pagefind-body` introduced anywhere.
- No detail template touched.
- Existing reverse guards remain green:
  - `scripts/audit-media-pagefind-m2.js`:
    `noDetailUsesPagefindBody` — pass.
  - `scripts/audit-pf2-sisalto-facet.js`:
    `noHtmlDetailUsesPagefindBody` — pass.
- Pagefind index size after PF3: `fi:1163 / en:346` — identical
  to the plain-main baseline (from
  `_site/pagefind/pagefind-entry.json`). No collapse.

## 12. Files changed

Source:

- `src/js/find-explore.js` — added `SISALTO_LABELS`,
  `contentFamilyLabelFromData`, `renderFamilyHeader`;
  `createResultEntry` now stores `contentFamilyLabel`;
  `renderPublicationResult` and the generic branch of
  `renderResults` emit the family header.
- `src/css/find-explore.css` — added
  `.find-explore-result-family` and
  `.find-explore-result-family-badge` rules.

New:

- `scripts/audit-pf3-result-card-consistency.js`
- `tests/pf3-result-card-consistency.spec.js`
- `docs/pf3-result-card-consistency-2026-08-16.md`
- `docs/data/pf3-result-card-consistency-audit-2026-08-16.json`

No other file was staged. No product template was modified.

## 13. Verification

Local gates on the PF3 branch build:

- `npm run build:no-og` — green.
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf3-result-card-consistency.js` — all 9
  gates green.
- `node scripts/audit-pf2-sisalto-facet.js` — all gates green
  (750 detail records).
- `node scripts/audit-media-pagefind-m2.js` — all gates green
  (73 media detail pages).
- `node scripts/audit-f4-research-built-output.js` —
  `totalResearchPopulation: 317`.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `DISABLE_OG_IMAGES=true npx playwright test tests/pf3-result-card-consistency.spec.js
  --workers=1` — **5 / 5 pass**:
  - FI writings card shows `Kirjoitukset ja puheenvuorot`.
  - FI theses card shows `Opinnäytteet`.
  - FI publications card shows `Julkaisut` and preserves the rich
    UI (title + open button visible).
  - Research contextual mount exposes family badges for
    publications when queried with a real publication title.
  - No shared result card visibly leaks a `FindExplore:*` token.
- Sibling smokes (`f2-find-explore-smoke`,
  `f3a-theses-find-explore`, `f3b-publications-find-explore`,
  `f4-research-find-explore`, `pf2-sisalto-facet`,
  `media-archive`, `presentations-archive`,
  `presentations-research-smoke`) — **22 / 22 pass**.

Pagefind index verification:

- `_site/pagefind/pagefind-entry.json`: `fi:1163 / en:346` — unchanged.

## 14. Remaining limitations

- **Starter chips (PF3 §13 of PF1)** not implemented — still queued;
  now more feasible because the shared card gives chips a natural
  visual home.
- **PF-PERF1** not implemented; still queued. No performance
  regression detected in PF3 build/index.
- **Writings segmentation** not implemented; the PF1
  `scientificPublication` open question remains.
- **Media archive cards** (`article.media-archive-card`) not
  redesigned.
- **Presentation archive cards** (`article.presentation-archive-card`)
  not redesigned.
- **English label variants**: family badge reads Finnish across FI
  and EN mounts to match the underlying Pagefind filter value. A
  bilingual UX pattern (badge label localized while filter value
  stays Finnish) is a follow-up UX decision, not landed here.
- **Secondary meta line richness** varies per family (theses show
  author + type + year; writings show type + year; publications
  keep authors + type + year + venue). PF3 did not equalize the
  meta strip beyond adding the family header — that would risk
  regressing family-specific richness. Any further alignment is a
  separate checkpoint.

## 15. Next recommendation

**PF-STARTER-CHIPS** — implement PF1 §13 starter chips on
`/tutkimus/`, `/esitykset/`, `/mediassa/`, wrapping existing
filter/topic mechanisms. The chip labels can now safely rely on the
same content-family / topic vocabulary the shared result card
displays, which was the blocker cited by the PF3 decision audit.
Keep chip semantics user-triggered (never search on page load), and
do not invent a second query model.

PF-PERF1 remains queued behind chips unless a concrete slow-startup
event lands.
