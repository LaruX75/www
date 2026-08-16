# PF3 — Result-Card Consistency Closure

Date: 2026-08-16
Status: **PF3 RESULT-CARD CONSISTENCY = CLOSED / GREEN**

## 1. Status

PF3 is closed. `feat: show content family on Find & Explore result
cards` is on `main`, all post-merge workflows are green, and every
shared Find & Explore result card now visibly renders the PF2
`Sisältö:*` content-family label as a small badge above the title.

## 2. Repository state

- PR: [#92 feat: show content family on Find & Explore result cards](https://github.com/LaruX75/www/pull/92) — merged 2026-08-16T08:04:11Z by LaruX75.
- Merge commit: `5a7cb08efd0fe7a1837a68f89039112b2e837a6c`.
- PF3 implementation commit: `1fe4b2ad87881665b4a83285af31de0208b90a1b`.
- Main HEAD at closure time: `5a7cb08efd0fe7a1837a68f89039112b2e837a6c`.
- Merge method: merge commit (repo convention).
- Head SHA at merge time: `1fe4b2ad…` — protected via `gh pr merge --match-head-commit`.
- No conflicts at merge.
- Post-merge GitHub Actions on `5a7cb08e`:
  - `Build and Deploy` — completed / success (run `31935514464`).
  - `Generate OG Images` — completed / success (run `31935514474`).
  - `Accessibility and navigation tests` — completed / success (run `31935514473`).

Prior related work already on main:

- `3c14af6b docs: close PF2 shared Sisältö facet rollout`
- `70af3d7c docs: land PF1 user-facing discovery model audit`
- `d87bf586 docs: close M2 Media Find and Explore rollout`
- `80487bc0 docs: close F4 Research Find and Explore rollout`

## 3. Scope delivered

- Visible content-family badge derived from PF2's `Sisältö:*`
  vocabulary at the top of every non-empty Find & Explore result
  card.
- Publication rich card preserved: peer-reviewed / open-access /
  JUFO / citations badges + open + source + citation-export button
  all unchanged; the family badge sits above the title.
- No technical `FindExplore:*` labels visible to users (reverse-gated
  by the PF3 audit's `noForbiddenVisibleTokens` gate + the browser
  smoke's "no FindExplore leak" assertion).
- No Research semantic change.
- No writings restructuring.
- No starter chips added.
- No PF-PERF1 work started.
- No `data-pagefind-body` introduced (M2 + PF2 reverse gates continue
  to hold; PF3 added its own reverse gates against bespoke archives
  gaining the family hook).
- No detail template touched.
- No Pagefind filter emission changed.

## 4. Labels rendered

Rendered as `<span class="find-explore-result-family-badge"
data-find-explore-family="{kind}">…</span>` above the title on every
non-empty shared Find & Explore result card:

- `Julkaisut` (kind `publications`)
- `Opinnäytteet` (kind `theses`)
- `Kirjoitukset ja puheenvuorot` (kind `writings`)
- `Esitykset` (kind `presentations`)
- `Mediassa` (kind `media`)

Deliberately Finnish across FI and EN mounts to match the underlying
PF2 Pagefind filter value the user can see in URL state. English
label localization is noted as a future UX decision, not part of PF3.

## 5. Files / implementation summary

Source (committed by PF3 implementation `1fe4b2ad`):

- `src/js/find-explore.js` — new `SISALTO_LABELS` map,
  `contentFamilyLabelFromData(kind, data)` helper (prefers
  `data.filters["Sisältö"][0]` from PF2 with a `kind → label`
  fallback), `renderFamilyHeader(entry)` helper;
  `createResultEntry` now stores `contentFamilyLabel` on the entry;
  both `renderPublicationResult` and the generic branch of
  `renderResults` emit the family header.
- `src/css/find-explore.css` — new `.find-explore-result-family`
  spacing wrapper and `.find-explore-result-family-badge` pill
  (tertiary-bg, 1px border, secondary text, 0.72rem uppercase,
  0.55rem padding). Deliberately lighter than publication badges
  so it reads as a category marker, not a metric.

Audit + tests:

- `scripts/audit-pf3-result-card-consistency.js` — static audit of
  the passthrough-copied `_site/js/find-explore.js` verifying the
  Sisältö label map + helpers exist and that no forbidden token
  (`Sisältö:Tutkimus`, `FindExplore:*` inside the family scope,
  bespoke archive card runtimes gaining the family hook) is
  present.
- `tests/pf3-result-card-consistency.spec.js` — Playwright browser
  smoke exercising each family's shared Find & Explore mount and
  asserting the correct visible label.
- `docs/pf3-result-card-consistency-2026-08-16.md` — implementation
  report.
- `docs/data/pf3-result-card-consistency-audit-2026-08-16.json` —
  machine-readable audit output.

No product template or `.njk` file was touched. No `.11tydata.js`
was touched. No family document builder was touched. No Pagefind
filter emission was changed. No bespoke archive card runtime
(`src/js/presentations-page.js`, the inline media runtime in
`src/fi/mediassa.njk`) was modified.

## 6. Publications boundary

- `renderPublicationResult` continues to render
  `find-explore-result--publication` with the full metadata /
  buttons set:
  - title
  - meta strip (authors + type/group + year + venue)
  - badges: peer-reviewed, open-access, JUFO, citations
  - excerpt
  - open button + source button + citation-export button
- PF3 adds only the family header above the title. No other
  metric, badge, or button was removed, reordered, or restyled.
- Verified by the Playwright smoke:
  `firstPublicationCard.locator(".find-explore-result-title")`
  visible + open button visible.
- The family badge on a publication reads `Julkaisut`.

## 7. Writings boundary

- Writings-only pages render the badge `Kirjoitukset ja
  puheenvuorot`.
- Publication-backed writing pages continue to resolve to
  `publications` in `resolvePagefindDocument` per PF2 priority and
  render as publications with the `Julkaisut` badge and the rich
  card — unchanged.
- No writings genre split, no archive route change, no frontmatter
  field mutation.
- The PF1 open question about whether `scientificPublication`
  should remain visible inside `/kirjoitukset/` remains explicitly
  deferred to a later workstream.

## 8. Research boundary

- Research population verified via
  `scripts/audit-f4-research-built-output.js` on the merged main:
  - publications: **53**
  - theses: **169**
  - writings: **62**
  - presentations: **33**
  - **total: 317**
- Unchanged from the F4 closure baseline.
- Research membership rule unchanged:
  `contexts.includes("research")`.
- Media is not enumerated in Research; PF3 does not add media to
  any Research surface.
- No `Sisältö:Tutkimus` badge (guarded by the PF3 audit).
- No `resolveContexts()` change.
- No topic mapping change.

## 9. Archive boundary

- `src/js/presentations-page.js` untouched by PF3 (verified via
  audit gate `presentationsArchiveUntouched`).
- The inline media archive runtime in `src/fi/mediassa.njk`
  untouched by PF3 (verified via audit gate
  `mediaArchiveUntouched`).
- `article.presentation-archive-card`,
  `article.media-archive-card`, and their feature variants keep
  their bespoke design. A future visual harmonization across those
  archives is a separate, larger workstream.
- PF3 scope was strictly the shared Find & Explore / Pagefind
  result renderer.

## 10. Pagefind body-gate boundary

- No `data-pagefind-body` introduced anywhere.
- No detail template touched.
- Existing reverse guards remain green:
  - `scripts/audit-media-pagefind-m2.js` —
    `noDetailUsesPagefindBody` (pass).
  - `scripts/audit-pf2-sisalto-facet.js` —
    `noHtmlDetailUsesPagefindBody` (pass).
- Pagefind index size after PF3: `fi:1163 / en:346` — identical to
  the plain-main baseline (from
  `_site/pagefind/pagefind-entry.json`). No collapse.

## 11. Verification

GitHub post-merge workflows on `5a7cb08e`:

- `Build and Deploy` — completed / success (`31935514464`).
- `Generate OG Images` — completed / success (`31935514474`).
- `Accessibility and navigation tests` — completed / success
  (`31935514473`).

Pre-merge local verification (on the exact PF3 commit `1fe4b2ad`,
run during the PF3 implementation checkpoint):

- `npm run build:no-og` — green.
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf3-result-card-consistency.js` — all 9
  gates green (SISALTO labels present, helpers defined, forbidden
  tokens absent, bespoke archives untouched).
- `node scripts/audit-pf2-sisalto-facet.js` — all 9 gates green
  (750 detail records; no `data-pagefind-body` on any family).
- `node scripts/audit-media-pagefind-m2.js` — all gates green
  including the reverse `noDetailUsesPagefindBody` guard.
- `node scripts/audit-f4-research-built-output.js` —
  `totalResearchPopulation: 317` unchanged.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `DISABLE_OG_IMAGES=true npx playwright test tests/pf3-result-card-consistency.spec.js
  --workers=1` — **5 / 5 pass**.
- Sibling smokes (`f2-find-explore-smoke`,
  `f3a-theses-find-explore`, `f3b-publications-find-explore`,
  `f4-research-find-explore`, `pf2-sisalto-facet`,
  `media-archive`, `presentations-archive`,
  `presentations-research-smoke`) — **22 / 22 pass**.

Post-merge local re-verification was skipped because the merge is
a straight fast-forward of the identical tree that was already
pre-merge-verified at `1fe4b2ad`, and the GitHub Pages deploy on
`5a7cb08e` completed successfully.

## 12. Remaining work

- **PF-STARTER-CHIPS**: implement PF1 §13 starter chips on
  `/tutkimus/`, `/esitykset/`, `/mediassa/`, wrapping existing
  filter/topic mechanisms. The shared family badge landed by PF3
  now gives chips a natural visual home. Do not invent a second
  query model; chip labels can reuse the same content-family and
  topic vocabulary the result card already renders.
- **PF-PERF1**: Pagefind startup performance audit remains queued
  behind chips unless a concrete slow-startup event lands.
- **Writings segmentation**: the PF1 open question about
  `scientificPublication` visibility inside `/kirjoitukset/` now
  that `Sisältö:Julkaisut` exists globally is deferred.
- **Media outlet / source normalization**: `mediaOutlet` remains
  Pagefind meta only; still not a user-facing facet.
- **Media / presentation archive visual harmonization**:
  `article.media-archive-card` and `article.presentation-archive-card`
  still use bespoke shapes. A future refactor could align them with
  the shared Find & Explore result card vocabulary — larger
  workstream, not scheduled here.
- **English label variants for the family badge**: PF3 renders
  Finnish across FI and EN mounts to match the actual Pagefind
  filter value. A bilingual UX pattern (badge label localized while
  filter value stays Finnish) is a follow-up UX decision.

## 13. Next recommendation

**PF-STARTER-CHIPS** — implement PF1 §13 starter chips on
`/tutkimus/`, `/esitykset/`, `/mediassa/`, wrapping existing
filter/topic mechanisms. Keep chip semantics user-triggered (never
search on page load) and reuse the existing family / topic
vocabulary the shared result card already displays. Do not start it
here.
