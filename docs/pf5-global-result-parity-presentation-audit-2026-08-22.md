# PF5 Global Result Parity + Result Presentation Quality Audit

## Status

AUDIT.

No production code changed. This document proposes a recommendation for review.

## Baseline

- **origin/main SHA at audit time:** `d7d4f5f555c49322f74f01eb2ab0be155aa33f96` (merge of C1 accessibility native Popover, 2026-08-22)
- **Audit worktree:** `/private/tmp/www-pf5-audit` on branch `pf5/audit` (tracks `origin/main`)
- **Relevant current search surfaces (13 total):**
  1. Navbar Pagefind search — FI header (`src/_includes/_nav-fi.njk:396`, `_nav-fi.njk:688`)
  2. Navbar Pagefind search — EN header (`src/_includes/_nav-en.njk:384`, `_nav-en.njk:657`)
  3. `/haku/` global FI search page (`src/fi/haku.njk`)
  4. `/en/search/` global EN search page (`src/en/search.njk`)
  5. `/kirjoitukset/` Writings Find & Explore (`src/kirjoitukset.njk`)
  6. `/en/writings/` Writings Find & Explore (`src/en/writings.njk`)
  7. `/julkaisut/` Publications Find & Explore over archive (`src/julkaisut.njk`)
  8. `/en/publications/` Publications Find & Explore over archive (`src/en/publications.njk`)
  9. `/opinnaytteet/` Theses Find & Explore over archive (`src/opinnaytteet.njk`)
  10. `/en/theses/` Theses Find & Explore over archive (`src/en/theses.njk`)
  11. `/tutkimus/` Research context mixed-kind Find & Explore (`src/fi/tutkimus.md`)
  12. `/esitykset/` + `/en/presentations/` presentations archive (SSR-only, no F&E mount)
  13. `/mediassa/` + `/en/media/` media archive (SSR-only, no F&E mount)
- **Current presenter ownership:**
  - **`src/js/find-explore.js`** (1233 LOC) — owns every Find & Explore surface's client-side result rendering: mount registration, Pagefind wiring, per-kind config, sorting, and result HTML generation.
  - **`src/js/site-search-page.js`** (137 LOC) — instantiates stock `window.PagefindUI` for `/haku/` + `/en/search/`. No custom result renderer.
  - **`_nav-fi.njk` / `_nav-en.njk`** — navbar Pagefind mount (also stock `PagefindUI`).
  - **Nunjucks archive partials** — `publication-archive-groups.njk`, `thesis-archive-table.njk`, `presentations/result-card.njk` (+ `archive.njk`), `writings-curated-list.njk`, `media/_media-macros.njk` and `src/fi/mediassa.njk` inline features.

## Current data flow

canonical Nunjucks record
→ Pagefind indexed body + `data-pagefind-meta` / `data-pagefind-filter` projections
→ Pagefind result data (`{ url, meta, excerpt, filters }`)
→ Presenter (branch by surface):
  - Global (navbar, `/haku/`, `/en/search/`): **stock PagefindUI** default template (title link + excerpt + filter pills)
  - Publications F&E: `find-explore.js#renderPublicationCardResult` (APA card) OR `#renderPublicationArchiveRow` (archive `<tr>`)
  - Theses F&E: `find-explore.js#renderResultEntry` (theses branch — archive `<tr>` inline)
  - Writings F&E: `find-explore.js#renderResultEntry` (generic `<li class="find-explore-result">`)
  - Research context: mixed use of generic + publication card via kind branching
→ DOM injected at the surface's target (archive `<tbody>` for publications/theses; result `<ol>` for writings/research)

## Surface matrix

| Surface | Presenter | Metadata surfaced | Visual pattern | Issues (observable) |
|---|---|---|---|---|
| Navbar FI | stock PagefindUI | title + Pagefind excerpt + `Kieli` filter pill | vertical stack, Pagefind-native | Presenter is not from the site design system. All content types flatten to the same text row. |
| Navbar EN | stock PagefindUI | same as FI | same | same |
| `/haku/` FI | stock PagefindUI | same | same | same |
| `/en/search/` EN | stock PagefindUI | same | same | same |
| `/kirjoitukset/` (FI writings) | `find-explore.js` generic renderer | family badge, year, title, `writingsTypeLabel`, excerpt | generic `<li class="find-explore-result">` | Does NOT match SSR curated-list Bootstrap card (`writings-curated-list.njk`). Divergence from own archive. |
| `/en/writings/` | same as FI | same | same | same |
| `/julkaisut/` (FI publications) | `find-explore.js#renderPublicationArchiveRow` (in archive) / `#renderPublicationCardResult` (otherwise) | full APA authors line, year in family header, type, source button, citation-export button | archive `<tr>` (replaces SSR row) or APA `<li>` card | Converged. Matches PF4/PF5-APA7 sanctioned model. |
| `/en/publications/` | same as FI | same | same | Converged. |
| `/opinnaytteet/` (FI theses) | `find-explore.js#renderResultEntry` theses branch | year, author, title, type+role, OuluREPO source button | archive `<tr>` (replaces SSR row) | Converged. Matches PF4 sanctioned model. |
| `/en/theses/` | same as FI | same | same | Converged. |
| `/tutkimus/` research context | `find-explore.js` (mixed kinds via `researchContext`) | per-kind meta line via generic renderer + publication card variant | list of mixed kinds, `<li class="find-explore-result">` (or publication card) | Publications there render via the generic path (no Open/Source/Citation actions); noted in PF4 closure §11. |
| `/esitykset/`, `/en/presentations/` | SSR only, `presentations/result-card.njk` | thumbnail, source label, external/local badge, title, description, date, presentation type, event, up to 3 topics, CTA | horizontal card | No F&E mount. Global search reaches these pages but presents them via stock PagefindUI, losing the horizontal-card semantics entirely. |
| `/mediassa/`, `/en/media/` | SSR only, inline in `src/fi/mediassa.njk` + `_media-macros.njk` | thumbnail, media type, media role, outlet, date, title | media-archive card, role-grouped grid | No F&E mount. Global search flattens as with presentations. |

## Domain presenter matrix

| Content type | Current global result (navbar / `/haku/`) | Existing site presenter | Missing characteristics in global result | Density strategy | Reuse strategy (candidate) |
|---|---|---|---|---|---|
| Publications | title + excerpt + `Kieli` pill (stock PagefindUI) | `publication-archive-groups.njk` grouped `<table>`; F&E APA `<li>` card | authors, year, type code, source (Research.fi/DOI), citation export, peer-reviewed/OA/JUFO badges | Small→medium: APA card. Large (archive context): grouped compact `<tr>`. | ADAPT: on global, emit the same PF4/PF5-APA7 shared card the F&E already emits. |
| Theses | title + excerpt + `Kieli` pill (stock PagefindUI) | `thesis-archive-table.njk` archive `<table>` | year, author, title, type+role, OuluREPO source | Small: card. Large (archive context): compact `<tr>`. | ADAPT: shared card with year·author·type+role primary line + source action. |
| Presentations | title + excerpt + `Kieli` pill (stock PagefindUI) | `presentations/result-card.njk` horizontal card | thumbnail, source/media label, external/local landing badge, date, presentation type, event, topics | Horizontal card is the sanctioned family across sizes; per PF5-APA7 §17 Phase 2, icon-only variant is prepped for shared renderer. | SHARED PRIMITIVES: PF5-APA7 Phase 2 icon-only horizontal card (already audited). |
| Writings | title + excerpt + `Kieli` pill (stock PagefindUI) | `writings-curated-list.njk` Bootstrap card grid | date, title, truncated description, up-to-2 categories + publication badge | Vertical Bootstrap card; no domain-owned dense variant | REUSE-or-ADAPT: converge F&E card + global card to the curated-list card. |
| Media | title + excerpt + `Kieli` pill (stock PagefindUI) | `src/fi/mediassa.njk` + `_media-macros.njk` role-grouped card/grid | thumbnail, media type, media role, outlet, date | Card with thumbnail; roles group SSR side | PF5-APA7 Phase 3 (deferred): decide between shared-renderer `kind` vs PagefindUI `processResult`. |

## Publications

- **SSR presenter:** `src/_includes/publication-archive-groups.njk:43` — grouped `<table>` with `.publication-archive-row` (year, authors, title `<th scope="row">`, typeDisplay, source `<a>`).
- **F&E card:** `src/js/find-explore.js:783` — `renderPublicationCardResult` emits `<li class="find-explore-result find-explore-result--publication">` with family header, `publicationCitationBody` (APA), `publicationQualityLine` (peer-reviewed / OA / JUFO), excerpt, action row (Open / Source / Citation-export).
- **F&E archive row:** `find-explore.js:826` — `renderPublicationArchiveRow` emits the same `<tr>` shape as `publication-archive-groups.njk` with class `--search` suffix, so search replaces archive rows in place.
- **Sanctioned model:** PF5-APA7 closure (2026-08-17) — APA7 citation body, full 56-item list, no truncation.
- **Domain characteristics:** OKM publication types A–G ordering; DOI/Research.fi source distinction; peer-reviewed / OA / JUFO quality signals.
- **In global search:** all of the above is lost. A publication returns as `<a>title</a><p>excerpt</p><span>Kieli:Suomi</span>` — indistinguishable from any other content type at a glance.

## Theses

- **SSR presenter:** `src/_includes/thesis-archive-table.njk:42` — single `<table class="table table-sm thesis-archive-table">` with year/author/title/type/source columns; header dropdowns for year-order + author-sort; pagination.
- **F&E row:** `find-explore.js:933` — emits `<tr class="thesis-archive-row thesis-archive-row--search">` with the same 5-column shape; search replaces archive `<tbody>` rows in place.
- **Sanctioned model:** PF4 hierarchy applied to theses; year + author + type-role are the "must show" fields.
- **Domain characteristics:** Master's vs Bachelor's; supervised vs reviewed role; OuluREPO as the standard source.
- **In global search:** collapses to stock PagefindUI row; role/type/author distinction lost.

## Presentations

- **SSR presenter:** `src/_includes/presentations/result-card.njk` — horizontal `<article class="presentation-archive-card">` with `-thumb`, `-body`, `-header` (source label + external/local badge + title + description), `-meta--details` (calendar, type, event icons), `-meta--secondary` (topics), `-actions` (CTA button).
- **Landing semantics:** URL selection in `result-card.njk` prefers `landingUrl`, then `localPageUrl`, then `externalUrl`/`sourceUrl`; `cardIsExternal` flag drives the external/local badge and target.
- **F&E mount:** NONE on `/esitykset/`. `find-explore.js:388` declares a `presentations` kind, but only Research context (`/tutkimus/`) mounts it.
- **Sanctioned model:** PF5-APA7 §17 Phase 2 audited a shared-renderer horizontal card (icon-only, no thumbnail) — ready to ship, not yet implemented.
- **Domain characteristics:** distinction between locally hosted (`/presentations/…`) and externally sourced (SlideShare / YouTube / AOE / Canva) presentations; thumbnails on some, not all; event/venue is a real information cue.
- **In global search:** presentations collapse to stock PagefindUI text row. External/local distinction disappears. Event and type disappear.

## Writings

- **SSR presenter:** `src/_includes/writings-curated-list.njk` — Bootstrap `.card` grid, 3 columns on XL, with date/year, title (`.stretched-link`), truncated description (135 chars), up to 2 category badges + publication badge.
- **F&E:** generic `<li class="find-explore-result">` (`find-explore.js:945`) — family badge, year, title, `writingsTypeLabel` (single string), excerpt.
- **Divergence:** the F&E card is minimal; the SSR curated card carries date, description, categories, publication. Same domain, two different presentation quality tiers depending on how you arrived at the list.
- **In global search:** further reduced to stock PagefindUI row.

## Media

- **SSR presenter:** `src/fi/mediassa.njk` + `src/en/media.njk` + `src/_includes/_media-macros.njk` — feature cards (primary + smalls), role-grouped grid; each card: thumbnail, media type label, media role label, outlet, date, title.
- **F&E:** NONE. `find-explore.js` has no `media` kind (per M2 closure and PF5-APA7 §11 Phase 3 deferral).
- **Sanctioned model:** PF5-APA7 §17 Phase 3 explicitly deferred pending decision between 11b (shared-renderer `kind` extension) vs 11c (PagefindUI `processResult` extension).
- **Domain characteristics:** media type (Article/Podcast/Video/Radio) and media role (About-my-work / Expert / Guest / Interviewer) are load-bearing; outlet is important but has been non-normalised (PF2 deferred outlet-as-facet).
- **In global search:** everything collapses to stock PagefindUI text row.

## Mixed result sets

**Composition:** a query like "opettajankoulutus" or "tutkimus" returns a heterogeneous mix — publications, theses, presentations, writings, media — in Pagefind rank order.

Under **stock PagefindUI (global surfaces)**:
- All rows look identical. Users cannot distinguish content types at a glance beyond skimming URLs / titles.
- Family badge (`Sisältö:` filter value) is exposed only as a Pagefind filter pill on hover / when filters open, not as a persistent per-row badge.
- Result set feels coherent (same visual weight per row) but at the cost of losing the domain hierarchy that PF4 established for F&E surfaces.

Under a **PF4-style shared card model** (already used by F&E):
- Each row leads with `family badge · year`, then title, then family-specific primary meta line, then optional excerpt.
- Users can distinguish types by the badge and the meta shape (e.g. authors·venue for publications vs date·event for presentations) at a glance.
- Ranking is preserved — no grouping.

**Grouping vs interleaving:** grouping mixed results by content type in the global surface would conflict with Pagefind's rank order and hide the "best match regardless of family" answer. **The audit recommends interleaving with strong per-row family typing**, not grouping. This matches PF4's stance and preserves ranking semantics.

## Result density strategy

**PROVEN from source:**
- Publications F&E uses `<li>` APA card for standalone mount and `<tr>` for archive mount. Chosen by kind config (`groupedArchiveTables: true`, `renderAllResults: true`) at `find-explore.js:386`.
- Theses F&E uses `<tr>` inside the archive `<tbody>` — always. Search set size is bounded by 169 canonical items.
- Writings F&E uses `<li>` — always. No compact/dense variant.
- Presentations SSR uses `<article>` horizontal card — always. No F&E surface exists.
- Media SSR uses cards + role grid — always. No F&E surface exists.

**INFERENCE:** result-density mode-switching is already implicit in the codebase for publications+theses (card outside archive, table inside archive). For presentations and writings, no density switching exists yet.

**Recommendation without over-reach:**
- **Small result set (≤~10 for a domain-scoped view):** rich card is fine; SSR-style domain cards remain most legible.
- **Medium result set (10–50):** family-typed shared card (PF4 model) is the right density.
- **Large result set (50+):** compact `<tr>` is only justified where the domain already has a table (publications, theses). Do not invent tables for presentations, writings, media — their information doesn't fit table columns naturally.
- **Global mixed set:** shared PF4 card. Do not switch density based on total count — count is arbitrary and mixes families.

Thresholds should NOT be hard-coded. They already emerge from surface choice: F&E-in-archive uses dense; F&E-standalone uses card; global uses card.

## Semantic HTML

- **Publications archive:** `<table>` + `<th scope="row">` for titles — correct tabular semantics. Search branch inherits, correct.
- **Theses archive:** `<table>` with sortable columns via `<select>` in `<thead>` — correct, if slightly unusual header markup. Search branch inherits, correct.
- **Writings F&E:** `<ol data-find-explore-results>` with `<li>` — correct list semantics.
- **Publications F&E card mode:** `<li>` with `<h3>` inside the family/citation body — verify heading hierarchy across the surrounding page; likely correct.
- **Presentations archive:** `<article>` per card with `<h3>` — correct.
- **Media archive:** `<article>` per feature + role-grouped grid — correct.
- **Global search (stock PagefindUI):** Pagefind emits `<a>` at the row level; excerpt as `<p>`; heading semantics inside PagefindUI are the UI library's, not the site's. This is a semantic-quality concern for global surfaces.

## Accessibility

- **Publications + Theses archive rows:** `<th scope="row">` for title, `small.text-muted` on secondary columns — readable, if dense on small screens.
- **Presentations archive card:** `aria-label="Presentation metadata"` on the details meta row; `aria-hidden="true"` on icon `<i>`. Good.
- **Media archive:** thumbnails have `alt="{{ item.data.title }}"` — passes; but decorative thumbnails would be better with empty alt. Not audited exhaustively.
- **Focus order across F&E:** primary action button is at the end of the publication card row — Tab flow reaches title → source → citation. OK.
- **PagefindUI stock:** filter pills are toggleable focusable pills; result title is the primary link. Basic keyboard/SR support exists via the library.
- **Reduced-motion, high-contrast, zoom/reflow:** F&E cards inherit site-wide tokens (verified via `find-explore.css` sharing `--bs-*` custom properties). Stock PagefindUI has its own stylesheet at `/pagefind/pagefind-ui.css` — visually consistent tokens are NOT guaranteed there. This is a concrete gap.

## FI/EN parity

- `/haku/` and `/en/search/` use the same `site-search-page.js` with only translation strings and language filter differing. Parity is functional; visual parity is 100% because both are stock PagefindUI.
- Navbar FI vs EN: same mount pattern, same stock PagefindUI. Parity is intentional and preserved.
- Domain F&E surfaces: publications + theses + writings use the same `find-explore.js` for FI and EN; templates set `findExploreScope="fi"|"en"` and `findExploreLanguageFilter="Suomi"|"English"`. Parity is intentional. EN writings deliberately searches the Finnish index (per `find-explore-writings-v1-closure`).
- Presentations + Media: separate FI and EN Nunjucks templates share partials; label translation is via `currentLang` conditionals or macro `lang` parameter. Parity is preserved with minor content-side divergences (topics translated, dates formatted per locale).
- PF3 renders family badge in Finnish across FI+EN by design (matches Pagefind filter value). This is durable, per PF3 closure §4.

**No accidental parity gaps discovered** at the presenter level. All divergences trace to intentional decisions.

## Presenter duplication

- **Publications:** two renderers for one domain (`renderPublicationCardResult` and `renderPublicationArchiveRow` in `find-explore.js`) — intentional density switch. Not duplication.
- **Theses:** one renderer inline in `renderResultEntry` — no duplication.
- **Writings F&E vs `writings-curated-list.njk`:** the SSR card and F&E `<li>` render the same domain with different information density — **this IS duplication of ownership**: both know how to display a writing but produce different HTML.
- **Global (stock PagefindUI) vs any domain F&E card:** all four domains are re-rendered by PagefindUI's own template on the global surface — a hidden third presenter per domain that no one on the team edits. **This is duplication by omission.**
- **Presentations `presentations/result-card.njk` vs `find-explore.js` presentations kind config:** the JS kind config exists but is only exercised by Research context; the SSR card is the sanctioned family. No duplication yet, but the PF5-APA7 §17 Phase 2 icon-only variant would introduce a JS-side renderer that must not diverge from the SSR card semantics.
- **`_media-macros.njk` + inline `mediassa.njk` HTML:** no JS-side renderer today. Adding one would introduce duplication risk (Phase 3 decision).

## C1 deletion opportunities

If PF5 executes REFINE:
- **Delete:** the ad-hoc "generic PagefindUI stock row" as the primary DOM on global surfaces — replaced by shared card renderer via `processResult`. PagefindUI stays (owns input, count, filters, pagination).
- **Delete (potential):** the writings F&E generic `<li>` branch of `renderResultEntry`, IF writings F&E converges to a shared writings card that matches `writings-curated-list.njk`. Requires audit of Research context to confirm no other consumer depends on the generic branch.
- **Delete (potential):** hand-written per-domain title/date formatting scattered across kind configs, IF a shared `card primitives` module (metadata-row, family-badge, action-row) is extracted. Only worth doing if 3+ surfaces adopt it — otherwise premature abstraction.
- **Do NOT promise:** deletion of `pagefind-ui.css` — it still owns input styling, filter pills, count text, pagination on all Pagefind surfaces.
- **Do NOT promise:** deletion of any SSR archive partial — those remain the canonical presentation for no-query archive view, and search-time rendering inherits from them.

## Performance implications

Not measured (out of PF-perf scope). Directional expectations:
- Adding a `processResult` callback on global PagefindUI: negligible cost per result (function invocation + string interpolation). Comparable to F&E.
- Shared card renderer emits richer DOM per result (~5–15 nodes vs Pagefind stock ~3–5 nodes). At default page size (10 results/page) the DOM cost is trivial.
- Global surfaces already render Pagefind excerpts (which are the largest string). Adding structured meta doesn't materially increase HTML weight.
- Presentation horizontal card + thumbnail on global search would add image cost. **Recommendation:** ship the PF5-APA7 §17 Phase 2 **icon-only** variant on global first; defer thumbnails on global search.
- No proposed change increases the Pagefind wasm/index cost — indexing semantics unchanged.

## Proposed target architecture

```
canonical Nunjucks record
  → Pagefind index + projected meta (unchanged)
  → shared result-presentation semantics (existing PF4/PF5 contract)
      ├── consumers:
      │    - F&E kinds (publications/theses/writings/presentations) via find-explore.js — unchanged
      │    - Global surfaces (navbar FI/EN, /haku/, /en/search/) via the smallest supported
      │      Pagefind 1.5.2 presentation mechanism — TBD by the PF5-G1 micro-audit
      └── kind-specific projections (existing kindConfig; media + shared-presentation
          extension only if a downstream slice justifies it after its own decision)
```

Key constraints:
- **Nunjucks still owns canonical presentation** for archive views and detail pages. Shared card renderer is a JS *projection* that mirrors the sanctioned card shape — it does not become the source of truth.
- **The renderer is small.** Extract only the family header + primary meta line + (family-specific) action row that PF4/PF5-APA7 already codify.
- **No new taxonomy, no new content types, no new Pagefind meta.** Only reuse what canonical + Pagefind already project.
- **Ranking preserved.** Global surfaces do NOT group by kind.
- **Density switching stays kind-specific.** Publications+theses continue their card-vs-`<tr>` switch inside their own F&E; global surfaces always render the shared card.

## Decision

**PARITY DECISION: REDUCE**

- The most-cited "parity" gap is between global surfaces (stock PagefindUI) and F&E surfaces (PF4/PF5-APA7 shared card). Closing that gap is high value.
- Full unification (single card across all content types) is not warranted — publications' APA + theses' archive-row + presentations' horizontal card + writings' description card are all justified domain differences.
- Reducing the gap means: **global surfaces adopt the same PF4/PF5 result-presentation semantics that F&E already uses,** via whatever the smallest supported Pagefind 1.5.2 mechanism is (to be determined by the PF5-G1 micro-audit). Writings F&E is re-evaluated separately — the current reduced variant may be intentional and does not automatically converge with `writings-curated-list.njk`.

**RESULT PRESENTATION DECISION: REFINE**

- The design system, the domain semantics, the F&E kind model, and the PF4/PF5-APA7 shared-card contract are all in place. No redesign is needed.
- The refinement direction is:
  1. Extend the PF4/PF5 result-presentation semantics to the four global surfaces (navbar FI/EN, `/haku/`, `/en/search/`) — via whichever Pagefind 1.5.2 presentation mechanism the PF5-G1 micro-audit identifies as the smallest supported one.
  2. Reassess the already-audited PF5-APA7 Phase 2 (presentations horizontal, icon-only) after G1's evidence — the delivery path depends on the mechanism selected in step 1.
  3. Reassess the deferred PF5-APA7 Phase 3 media decision (11b vs 11c) in light of that same mechanism; do not pre-commit here.
  4. Re-evaluate Writings F&E separately after G1's evidence — convergence with `writings-curated-list.njk` is one option, not the default.
- REDESIGN WITHIN EXISTING ARCHITECTURE is not warranted — nothing in the sanctioned architecture is wrong; it just isn't fully applied on global surfaces.

## Recommended implementation slices

Only slices with clear evidence and bounded scope. **These are proposals for review, not commitments.**

The *next actual checkpoint* after this audit is **PF5-G1 micro-audit / implementation suitability** (below), **not** an automatic G1–G5 rollout. G2–G4 must be re-evaluated after G1's evidence lands — their shape, mechanism, and even necessity may change once the Pagefind 1.5.2 presentation surface is characterised.

**PF5-G1 — Global surface shared result presentation**
Replace the stock generic PagefindUI result presentation on navbar FI/EN, `/haku/`, and `/en/search/` with a shared global result presentation that reuses the existing PF4/PF5 result-presentation semantics (family header + kind-specific primary meta line + optional excerpt, per PF4 hierarchy and the PF5-APA7 shared-card contract). Goal: eliminate the "generic PagefindUI stock row" as the visible presenter on those four surfaces.

**Pre-implementation micro-audit is required.** This audit intentionally does NOT commit to a technical mechanism. Before writing any implementation code, produce a short micro-audit (`docs/pf5-g1-suitability-audit-*.md`) answering:

- What does Pagefind 1.5.2 (the pinned dependency, per `package.json`) actually support at the global result templating / presentation layer? Enumerate the officially supported mechanisms in 1.5.x, including but not limited to: PagefindUI options (`processResult`, `processTerm`, translations), PagefindUI subclassing / rebuild, Pagefind Component UI (web components) with slots, and direct Search API consumption with an app-owned renderer.
- What result metadata is actually surfaced to the global consumer in 1.5.2? Cross-reference the `data-pagefind-meta` and `data-pagefind-filter` projections present in current source (see §"Surface matrix", "Pagefind configuration" in the surface inventory) against what each mechanism above receives.
- What is the *smallest supported mechanism* in 1.5.2 that lets the shared PF4/PF5 result-presentation semantics be reused/adapted *without* introducing a parallel Search UI architecture and *without* duplicating `find-explore.js` renderer code into JS?
- Confirm the invariants: `pageUrl` / `sourceUrl` / `externalUrl` semantics preserved; ranking not grouped or reordered; no new taxonomy; no new Pagefind meta; PF3 Finnish family badge decision respected; FI/EN parity preserved.

Do **not** commit the architecture to `processResult`, Component UI, or direct Search API until that micro-audit is complete and its recommendation is reviewed. The micro-audit's output is the authoritative input to G1's implementation shape and to any downstream reassessment of G2–G4.

Deletion at this stage: none. What can be deleted afterwards depends on the mechanism chosen and is captured in the deletion ledger under "contingent" rows.

**PF5-G2 — Presentations shared result presentation** *(prior PF5-APA7 §17 Phase 2 — ready, but re-evaluate after G1)*
- Prior PF5-APA7 audit sanctioned an icon-only horizontal presentation variant for the shared renderer. That remains the reference intent.
- However, whether G2 is implemented on top of `find-explore.js`'s existing renderer, on top of whatever mechanism G1's micro-audit selects, or via a different surface-specific path is a **decision to make after G1**. Do not assume G1 automatically enables G2.
- Consumers, if implemented: global surfaces (via G1's mechanism) + existing `researchContext` mount.
- Does NOT add a F&E mount on `/esitykset/`; SSR horizontal card remains authoritative for that archive view.

**PF5-G3 — Media shared result presentation** *(prior PF5-APA7 §17 Phase 3 — deferred; still requires its own decision)*
- Retains the pre-existing 11b (extend shared-renderer `kind` to media) vs 11c (surface-specific presenter) decision from PF5-APA7. That decision is unchanged by this audit.
- After G1 lands its evidence, revisit whether the mechanism chosen for global surfaces makes 11b or 11c materially smaller.
- Do NOT combine G3 with G1's implementation until both G1 and the 11b/11c decision have concrete evidence.
- Consumers, if implemented: global surfaces only. No F&E on `/mediassa/` (SSR remains authoritative).

**PF5-G4 — Writings F&E result presentation — re-evaluate**
- Do NOT assume Writings F&E should converge to `writings-curated-list.njk`.
- The current reduced writings F&E result (family badge + title + `writingsTypeLabel` + excerpt) may be intentionally reduced for the F&E-in-archive density context and may be the right answer.
- Options remain open:
  - **A.** Enrich the writings F&E card toward `writings-curated-list.njk` semantics (date + title + description + categories + publication badge).
  - **B.** Keep the reduced variant and document the density rationale (short mini-doc).
  - **C.** Adopt whatever shape falls out naturally from G1's mechanism, if the shared presenter for writings already satisfies the intent on both global and F&E surfaces.
- Choose only after G1's evidence and after checking Pagefind meta availability for description on writings entries.

**PF5-G5 — Deletion pass + documentation update**
- Only after whichever of G1–G4 actually ship, and only for the code paths their evidence proves unused.
- No pre-commitment on which branches, files, or CSS is removed.

**These five slices are proposals derived from the evidence in §5–§9. Only G1 (and specifically its micro-audit) is the next scheduled checkpoint.** G2–G5 are contingent and may be reshaped by G1's evidence.

## Deletion ledger candidates

Contingent on which slices execute:

| Candidate | Depends on | Verified needed? |
|---|---|---|
| Generic stock PagefindUI row rendering (all four global surfaces) | PF5-G1 | Verified as the current presenter: `site-search-page.js` and both `_nav-*.njk` mount stock PagefindUI with no custom result-presentation override installed. Actual deletion shape depends on the mechanism the G1 micro-audit selects. |
| `find-explore.js#renderResultEntry` generic writings fallback | PF5-G4-A | NEEDS FOLLOW-UP: confirm Research context doesn't rely on it. |
| Any JS-side `writings-curated-list` duplicate that appears in slices | PF5-G4-A | NEEDS FOLLOW-UP: only if the writings F&E card converges to SSR shape via SSR + hydration rather than JS rendering. |
| Ad-hoc media label logic if consolidated with shared renderer | PF5-G3 | NEEDS FOLLOW-UP: measurement possible only after Phase 3 sub-audit. |
| No canonical partial (no `publication-archive-groups.njk`, no `thesis-archive-table.njk`, no `presentations/result-card.njk`, no `_media-macros.njk`) may be deleted | all | PROVEN: those remain the SSR canonical presenters. |

## Risks

1. **Duplication of domain HTML in JavaScript.** If the shared card renderer copies too much of the SSR partial's markup into JS, we recreate the exact anti-pattern the roadmap warns against. Mitigation: extract only the PF4/PF5-APA7 lines that already exist in JS; keep SSR partials authoritative for archive/detail views.
2. **Pagefind 1.5.2 presentation-surface constraints.** Whatever mechanism the G1 micro-audit selects, it will constrain how much of the PF4/PF5 semantics can be reused without duplicating renderer code. If the smallest supported mechanism doesn't surface the metadata the shared presenter needs, either the presenter shrinks or the audit reopens the mechanism decision — do not push toward a full replacement of the Pagefind UI layer.
3. **Ranking semantic drift.** Any grouping/reordering in the global surface breaks Pagefind rank order. Explicit constraint: do not group by kind on global surfaces.
4. **Family badge label localization.** PF3 chose Finnish across FI+EN. If the shared card is now on `/en/search/`, the Finnish badge remains — accept the durable PF3 decision or reopen it (out of PF5 scope).
5. **Presentations thumbnail cost on global search.** PF5-APA7 §17 Phase 2 already decided icon-only variant; do not add thumbnails on the global surface.
6. **Writings description availability.** PF5-G4-A depends on the description being available. If it isn't in Pagefind meta, converging risks looking worse than the generic fallback. Verify first.
7. **CSS coupling to Bootstrap.** Both F&E cards and SSR archive partials rely on Bootstrap tokens (`--bs-*`). Any shared renderer inherits this coupling — do not attempt to shed Bootstrap as part of PF5.

## Explicit non-goals

- **No new universal search card abstraction.** The audit explicitly rejects designing a "single card that fits every domain." The shared renderer is a small function with per-kind branching, not a design system.
- **No parallel content model in JS.** Renderer takes projected Pagefind meta + kind; it does not maintain its own record model.
- **No grouping by content type on global surfaces.** Preserves Pagefind ranking.
- **No taxonomy or Pagefind index changes.** All work uses what canonical + Pagefind already project.
- **No canonical metadata edits.** Presenter refinements only.
- **No forcing EN detail pages** for content types where they don't exist canonically.
- **No adding media to Research contextual view.** Guarded invariant since M2/PF1.
- **No forcing scientific publications out of `/kirjoitukset/`.** Preserved per PF4 §9.
- **No `Sisältö:Tutkimus` facet.** Guarded site-wide.
- **No English family-badge label** in this PF5 slice (would reopen PF3).
- **Not P1 (performance).** Directional notes only; no measurements or optimizations proposed here.
- **Not O1/N1/C1 territory.** Panels, toolbars, dialogs, focus behavior remain out of scope.

---

**End of audit.** No production code changed. Awaiting review before any slice is scheduled for implementation.
