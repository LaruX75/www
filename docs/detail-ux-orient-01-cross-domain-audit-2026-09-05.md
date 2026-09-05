# DETAIL-UX-ORIENT-01 — Cross-domain detail orientation UX audit

Date: 2026-09-05
Scope: **AUDIT ONLY**, no production code changes.

---

## 1. Repo state at audit time

- Branch: `audit/detail-ux-orient-01`
- HEAD: `457b8f061888b48b0562e95eb5f542cabe5f96d9` (audit branch based off main; no changes)
- `origin/main`: `457b8f061888b48b0562e95eb5f542cabe5f96d9`
- Main includes PR #212 (DETAIL-UX-01C-B-COURSE + Kempele Paikka slice) merged 2026-09-05
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN**

Working tree carries only pre-existing untracked `.cache/api-fallback/*` diffs and old audit docs; no code changes on this branch.

## 2. Docs read

- `docs/architecture-closure-1-0-closure-2026-08-29.md`
- `docs/architecture-closure-current-state-reconciliation-2026-08-29.md`
- `docs/canonical-content-contract-v1.md` (indexed via consumers)
- `docs/o1-detail-orientation-closure-2026-08-21.md` — **the O1 closure that owns the shared partial**
- `docs/detail-hero-01-closure-2026-09-04.md`
- `docs/detail-ux-01a-closure-2026-09-04.md`
- `docs/detail-ux-01c-relevant-next-content-audit-2026-09-04.md`
- `docs/detail-ux-01c-b-content-graph-suitability-audit-2026-09-04.md`
- `docs/detail-ux-01c-b-course-closure-2026-09-05.md`

## 3. O1 original intent (verbatim + inferred)

From `o1-detail-orientation-closure-2026-08-21.md`:

- **Purpose:** deliver *"a shared, SSR-first detail-orientation contract covering the mature canonical detail surfaces of the site"* (Publications, Theses, Writings, Presentations, Media).
- **Model:** `canonical hub return → SSR / no-JS` PLUS `active discovery context → explicit same-origin returnTo → prefix allowlist → progressive enhancement`.
- **Deletion delivered with O1:** removed hardcoded per-domain `<a href="/esitykset/">Kaikki esitykset</a>` and `<a href="/mediassa/">Kaikki mediaosumat</a>`, replaced by the shared primitive.
- **What O1 explicitly took a position on:** consolidation of the primitive, hub semantics, returnTo semantics, SSR-first behaviour, and per-domain landing rules preserved.
- **What O1 did NOT take a position on:** exact placement of the primitive on the page. The closure describes the *primitive* and where it should exist (all mature detail domains) but does not defend hero-action placement as a UX decision. The current placement is a consequence of the pre-O1 markup layout, standardised by O1 without a placement re-evaluation.

**Invariants that must be preserved from O1:**

1. Shared partial `src/_includes/detail-orientation.njk` remains the single source of truth.
2. Hub-link href logic + `returnTo` prefix allowlist + JS validator behaviour unchanged.
3. SSR-first, no-JS support.
4. FI/EN parity and per-domain hub label freedom.
5. No re-introduction of `history.back()`.
6. No per-domain duplicate orientation markup.

Nothing in O1 forbids moving the *include site* to a different semantic region on a domain-by-domain basis.

## 4. Current shared architecture

Runtime consumers of `src/_includes/detail-orientation.njk`:

| # | Consumer | Line | Container class |
|---|---|---|---|
| 1 | `media-item.njk` | 79 | `.content-detail-actions` (inside `heroShell`) |
| 2 | `publication-item-body.njk` | 30 | `.content-detail-actions mt-3` (inside `heroShell`) |
| 3 | `presentation-item.njk` | 94 | `.content-detail-actions` (inside `heroShell`) |
| 4 | `thesis-detail-body.njk` | 46 | `.content-detail-actions mt-4` (inside its own card+badge hero — Thesis does NOT consume `detail-hero.njk`) |
| 5 | `writing-post.njk` | 97 | `.content-detail-actions` (inside `heroShell`) |

**Blog is not a consumer of the shared partial** (`blog-post.njk` implements its own card-footer back link: `<a href="{{ txt.backHref }}" class="btn btn-outline-primary">&larr; {{ txt.back }}</a>` at line 137). So Blog is already a precedent for the "trailing site orientation" pattern.

`detail-hero.njk` documents (in a Nunjucks comment) an *example* usage with orientation inside `.content-detail-actions`, but does not itself include the orientation partial. The macro is placement-agnostic.

**Additional pre-existing "back to hub"-shaped link on every domain:**
`content-context-sidebar.njk:309` renders:
```njk
<a class="content-context-archive-link" href="{{ archiveHref }}">{{ archiveLabel }}</a>
```
This link appears at the END of the shared related-content sidebar on every domain that includes it. Verified on live pages (see §6). It resolves to different destinations than the hero orientation link on Publication/Thesis (`/kynasta/` umbrella vs. domain hub) and to the SAME destination on Media/Presentation/Blog/Writing.

## 5. Four UX roles (audit vocabulary)

| Role | Question it answers | Example labels |
|---|---|---|
| PRIMARY ACTION | *What can I do with this specific piece of content?* | `Avaa esitys Canvassa`, `Katso tallenne YouTubessa`, `Avaa DOI:ssa`, `Avaa OuluREPOssa`, `Avaa alkuperäinen lähde — Kaleva` |
| DIRECT RELATIONSHIP | *What is this content directly connected to?* | `Samalla kurssilla` (Presentation post-COURSE) |
| DISCOVERY | *What else might I find?* | `Selaa samaa aineistoa`, `Tämä sisältö liittyy`, `Aihepolut`, `Katso myös` |
| SITE ORIENTATION | *Where am I on the site, how do I return to this content type's hub?* | `Kaikki esitykset`, `Takaisin julkaisuihin`, `Kaikki mediaosumat`, `Takaisin blogiin` |

The audit's central concern: hero-action placement mixes **PRIMARY ACTION** and **SITE ORIENTATION** in a single flex row with shared pill styling.

## 6. Six-domain matrix

| Domain | Template | Order within `.content-detail-actions` | Primary CTA strength | Sidebar archive-link href | Hero orientation href | Distinct destinations? |
|---|---|---|---|---|---|---|
| **Blog** | `blog-post.njk` | (no orientation include; primary CTA only when `externalSourceHref`) | conditional (`externalSourceHref`) | `/blogi/` | *(none in hero — card-footer back link at line 137)* | same domain hub |
| **Media** | `media-item.njk` | CTA → orientation | conditional (`sourceHref`); when present, always a strong external source | `/mediassa/` | `/mediassa/` | same |
| **Publication** | `publication-item-body.njk` | **orientation → CTA** (opposite of others!) | conditional (`externalHref`); DOI is protected metadata (§7.D DOI rule) | `/kynasta/` (Kynästä-hub) | `/julkaisut/` | **different** |
| **Presentation** | `presentation-item.njk` | CTA → orientation | conditional (`publicSourceHref`); strong source-specific label | `/esitykset/` | `/esitykset/` | same |
| **Thesis** | `thesis-detail-body.njk` | CTA → orientation | conditional (`sourceUrl`); strong OuluREPO CTA + DUPLICATE btn-primary inside body card lines 96–103 | `/kynasta/` | `/opinnaytteet/` | **different** |
| **Writing** | `writing-post.njk` | **orientation → CTA** | often ABSENT (`externalSourceHref` optional) — many `lausunto` and speech records have no external source, so the hero action row becomes orientation-only | `/lausunnot/#lausunnot` (per sidebarContext) | dynamic per `orientationCtx.archiveHref` | may be same or different depending on `sidebarContext` |

Order inconsistency inside `.content-detail-actions`:
- **CTA → orientation:** Media, Presentation, Thesis (3 consumers)
- **orientation → CTA:** Publication, Writing (2 consumers)
- **no orientation in hero:** Blog

This is by itself evidence that hero-placement was never a considered UX decision — five consumers cannot agree on the order of two elements. It is a *template-author-local* choice, not a shared pattern.

## 7. Representative pages examined

Built HTML from local `_site/` (fresh, built after PR #212 merge).

### A. Presentation — 405040Y luento 1 (course-peer positive case)
`/presentations/405040y-luento-1-johdanto-2026-a/`

DOM order (byte offsets from `grep -bo`):
```
90125  content-detail-hero--presentation
90341  eyebrow
90442  title h1
90554  lead
90749  meta (source | date | slideCount)
90918  content-detail-actions
91104    Avaa esitys Canvassa (primary CTA)
91239    <nav aria-label="Detaljisivun orientaatio">
91282      hub-link → /esitykset/
91378      "Kaikki esitykset"
91768  content-detail-body-section
92101    content-prose (LECTURE MATERIAL)
92263    presentation-detail-support (Käyttöyhteys/Paikka/Järjestäjä)
93036    content-detail-course-peers (SAMALLA KURSSILLA — direct relations)
93082      h2 "Samalla kurssilla"
94198    content-detail-related--presentation (discovery sidebar)
94480      h2 "Selaa samaa aineistoa"
94841      h2 "Tämä sisältö liittyy"
             …
              content-context-archive-link "Kaikki esitykset" → /esitykset/
```

User meets `Kaikki esitykset` **twice**: once at byte 91378 (hero) and once inside the sidebar footer (`content-context-archive-link`). The first occurrence sits directly next to the primary CTA, competing for the reader's attention before they see the lecture, the usage-context card, and the "Samalla kurssilla" list — all of which are semantically more relevant to why they are on this page.

### B. Kempele VESO 2026 (course-peer negative control)
`/presentations/kempele-veso-2026/`

Same shape as A, but:
- Course-peers section correctly omitted
- Hero orientation still says `Kaikki esitykset`
- Sidebar archive-link `Kaikki esitykset`
- Käyttöyhteys card renders Paikka + Käyttöyhteys + Järjestäjä

Same double-orientation, same premature-exit concern.

### C. Publication with DOI — `/julkaisut/0669729323/`

Hero row order (byte offsets):
```
96355  detail-orientation include (hub-link "Takaisin julkaisuihin" → /julkaisut/)
96919  btn-primary "Avaa DOI:ssa"
```

Publication is the domain where orientation renders BEFORE the primary CTA. A user landing here through search sees the "back to publications" button positioned first in reading order, before the DOI action. Sidebar archive-link at end: `Kaikki Kynästä-sisällöt → /kynasta/` — a different destination.

### D. Thesis — `/opinnaytteet/46895/`

Hero (custom card+badge, not `detail-hero.njk`):
```
btn-primary "Avaa OuluREPOssa" (line 92423)
detail-orientation "Takaisin opinnäytteisiin" → /opinnaytteet/ (line 92843)
```

Body then repeats a duplicate primary action inside its own "Alkuperäinen lähde" card (`thesis-detail-body.njk:96-103`: btn-primary "Avaa alkuperäinen opinnäyte OuluREPOssa"). This is a pre-existing DETAIL-UX-01A pattern: the CTA is intentionally duplicated because the same href appears in the body's contextual card.

Sidebar archive-link: `Kaikki Kynästä-sisällöt → /kynasta/`.

### E. Media — `/mediassa/2026/03/29/tekoaly-tekee-petoksen-koulutehtavissa-helpoksi/`

```
btn-primary "Avaa alkuperäinen lähde — Kaleva" (93717)
detail-orientation "Kaikki mediaosumat" → /mediassa/ (93946)
```

Sidebar archive-link: `Kaikki mediaosumat → /mediassa/`. Same destination as hero orientation — pure redundancy on this domain.

### F. Writing without external source — `/2026/04/28/lausunto-uutta-suuntaa-suomen-digitaaliseen-kompassiin/`

Hero action row contains ONLY the orientation nav (`btn-primary` count in hero = 0). Rendered:
```
[Kaikki asiantuntijalausunnot]
```

This is the strongest UX-hostile case: the ONLY button in the hero of a serious expert-statement text is a "leave this page" button. A user might tap it, thinking it opens the lausunto text, and be dumped back on the archive.

### G. Blog — `/2013/02/05/yhdistysaktivisti/`

No hero orientation. Card-footer back link `Takaisin blogiin` at the END of the card. `orientation nav` count on page = 0 (only `content-context-archive-link` present in sidebar).

Blog is the domain that already implements the "SITE ORIENTATION as trailing footer" pattern that this audit will recommend generalising.

## 8. Desktop findings

- Primary CTA and orientation share pill shape + `px-4` padding. CSS differentiation is `btn-primary` (filled with box-shadow + `translateY` on hover, see `src/css/modules/_global.css:1553-1576`) vs `btn-outline-primary` (Bootstrap outline). Visual weight favours the primary, but they still read as peer actions.
- For **Publication + Writing**, orientation appears BEFORE the primary CTA in DOM order → the first tab-focused button is "leave this content."
- For **Writing without external source**, orientation is the ONLY hero button.
- For **Presentation post-COURSE**, meaningful DIRECT-RELATIONSHIP navigation (`Samalla kurssilla`) now lives further down the page, making a premature "Kaikki esitykset" at the top actively suboptimal.

## 9. Mobile findings

Not run with an actual browser at mobile viewport in this audit (per §21 STOP GATE). Reasoning based on CSS:
- `.content-detail-actions` = `display: flex; flex-wrap: wrap; gap: 0.65rem` (`_global.css:100-105`)
- On narrow viewports the two buttons wrap into a vertical stack. Whichever button is second in DOM order appears BELOW.
  - Publication/Writing: primary CTA appears BELOW orientation on mobile (worst case)
  - Media/Presentation/Thesis: orientation appears BELOW CTA (acceptable but still competing)
- Both buttons keep `px-4` padding + pill shape at mobile → orientation looks like a peer CTA at full width on narrow devices.

Any MOVE recommendation would reduce mobile hero clutter regardless of viewport. Reduces first-viewport button count by exactly one for 4 of the 5 domains (Blog already at 0).

## 10. Accessibility findings

- Heading hierarchy is preserved by both KEEP and MOVE options — orientation is a `<nav>`, not a heading.
- Keyboard tab order: skip link → nav → hero orientation `data-detail-hub-link` → (hidden `data-detail-return-link` revealed by JS if `returnTo` prefix matches) → primary CTA (in most domains) → body content. Moving orientation later shifts it *out* of the earliest tab stops and into a naturally trailing focus position, which better matches user intent.
- Link text `Kaikki esitykset` / `Takaisin julkaisuihin` etc. are standalone-understandable in all cases.
- `aria-label="Detaljisivun orientaatio"` on the `<nav>` is descriptive and can move with the partial.
- `javaScriptEnabled: false` behaviour: hub-link renders SSR regardless of position. Only the second (hidden) return-link needs JS to reveal. Moving the include does not affect either.
- Reflow/zoom: fewer competing buttons above the fold reduces visual overlap risk at 400% zoom.

## 11. MODEL A / B / C / D comparison

| Model | Where orientation sits | Clarity | Scanability | Mobile | A11y | Predictability | Impl. complexity | Cross-domain consistency |
|---|---|---|---|---|---|---|---|---|
| **A — current** | inside `.content-detail-actions` next to primary CTA (mixed order) | mixed (competes with CTA) | poor: two pill buttons look peer | poor on narrow (peer buttons stack) | acceptable but focus lands on "leave" early | inconsistent (5 templates, 2 orderings, Blog exception) | 0 | broken (Blog is exception) |
| **B — early back-link** (breadcrumb-style before body) | e.g. `← Kaikki esitykset` above `<section body>` | slight improvement (visual demotion) | ok | ok | slightly better | ok | small | uniform if all 6 adopt |
| **C — trailing site-orientation** | at end of body section, after relations + discovery | best (matches "where am I" as last layer of content-first model) | best (does not interfere with content) | best (frees hero) | best (natural end-of-document focus target) | high (predictable "look at end of page for return") | small | uniform if all 6 adopt |
| **D — domain-aware placement** | rule based on primary-action strength or domain nature | good (respects domain semantics) | ok | ok | ok | requires per-domain rule to be legible | slightly higher | intentional variance |

Model A: retained only if hero placement is defensible on UX grounds. §8/§9 show it is not.

Model B: preserves the "always visible" property but demotes visually. Still competes with primary content in first viewport.

Model C: matches the content-first mental model (`IDENTITY → PRIMARY CONTENT → PRIMARY ACTION → … → SITE ORIENTATION`). Already implemented by Blog and already partly implemented by every domain through `content-context-archive-link` at the end of the sidebar.

Model D: honest choice for domains where hero has no primary CTA (Writing lausunto). But orientation-as-hero-fallback rewards a content flaw (no external source) with a misleading button — the fix is not to keep the button, but to accept the hero being CTA-less.

## 12. Shared component vs shared placement

**Verdict: the O1 shared component `detail-orientation.njk` is still the right abstraction. Its current hero-action *placement* is a template-author-local historical convention, not a considered UX decision, and is inconsistent across the 5 consumers.**

Evidence:
1. Blog already places its equivalent in a footer position — proof that "shared placement" was never universal.
2. Order inside `.content-detail-actions` is not agreed upon (3 vs 2 vs 1).
3. `detail-hero.njk` macro is placement-agnostic.
4. `content-context-sidebar.njk` already ends with a semantic-equivalent `content-context-archive-link`.
5. O1 closure never justifies hero placement — it justifies consolidation, hub semantics, returnTo, and SSR.

Therefore MOVE is a UX-first refinement, not an architecture re-open.

## 13. Deletion opportunities (if MOVE proceeds)

- For domains where `.content-detail-actions` becomes empty when no primary CTA exists (currently Writing without external source), the wrapping `<div class="content-detail-actions">` can be conditionally omitted.
- For Media/Presentation where sidebar `content-context-archive-link` already renders the SAME hub link, the trailing site-orientation include can visually merge with (or replace) the sidebar archive-link position rather than adding a new region — reducing DOM by one link.
- `content-detail-actions .btn.btn-primary` CSS in `_global.css:1553-1576` unaffected — primary CTA styling doesn't move.
- Do NOT delete the shared partial itself.

Nothing is deleted in this audit; §13 is a report.

## 14. Implementation complexity if MOVE proceeds

Smallest slice on each of 5 templates:
1. Move the 4–5 lines that set orientation `set` vars + `{% include "detail-orientation.njk" %}` from inside `heroShell(...)` to a trailing region.
2. Optionally wrap in `<footer class="content-detail-orientation" aria-label="Site orientation">` or reuse existing `content-context-archive-link` slot in the sidebar.
3. If the sidebar-slot approach is taken, only one of the two "back to hub" surfaces needs to survive per domain.

No changes to `detail-orientation.njk` itself. No changes to `detail-hero.njk`. No CSS-file rewrites required (only additive `.content-detail-orientation` if a new wrapper class is chosen).

## 15. Architecture impact

- Canonical Content v1: **unchanged**.
- Pagefind: **unchanged**.
- Content Graph: **unchanged** (not touched, still not a render-time dependency).
- O1 primitive: **preserved** (component reused as-is).
- Public JSON: **unchanged**.
- FI/EN parity: preserved via existing `orientationLang` + hub-label vars.
- Architecture Closure 1.0: **remains CLOSED / GREEN / MAIN**. This is a post-closure UX refinement.

No AC1 reopen trigger identified.

## 16. Recommendation

### **MOVE — domain-aware, minimum-slice.**

- **Rule (single sentence):**
  > *Site orientation is always the last on-page layer. It renders after direct relationships, context, and topical discovery — never inside the hero action row.*

- **Concretely:** on all 5 current consumers (Media, Publication, Presentation, Thesis, Writing), remove the `detail-orientation.njk` include from the `.content-detail-actions` wrapper inside the hero shell and re-include it at the end of the body section (after `content-context-sidebar.njk`'s archive-link, or in place of it if the destinations are the same).

- **Why not "universal"?** Blog already implements this pattern via a card-footer back link (different markup, same intent). The recommendation is "universal semantic placement," not "identical markup" — Blog's existing footer implementation stays; the 5 shared-partial consumers converge on a shared trailing placement.

- **Why not KEEP?** §8/§9 show orientation actively competes with the primary CTA and, on Writing-without-source, becomes the only visible hero button. There is no repo evidence for hero placement being the right UX choice.

- **Why not MODIFY (restyle only)?** Restyling to reduce visual weight would only reduce the peer-action confusion, not eliminate the premature-exit invitation. A button styled as a link but still in the hero still says *"start with the exit."*

## 17. Smallest implementation slice

Proposed workstream **DETAIL-UX-ORIENT-01-IMPL** (NOT executed by this audit):

1. **Per template** (5 files):
   - `media-item.njk`, `publication-item-body.njk`, `presentation-item.njk`, `thesis-detail-body.njk`, `writing-post.njk`
   - Delete `{% set orientation* %} … {% include "detail-orientation.njk" %}` block from inside `.content-detail-actions`.
   - Re-place identical block at the end of the body region (after the last `<section>` or aside), preferring an existing structural wrapper.
2. **Optional convergence with sidebar archive-link:**
   - For domains where hero orientation and `content-context-archive-link` would resolve to the same hub (Media, Presentation, Writing when hubs align), keep only one and omit the other.
   - For Publication/Thesis where hero → `/julkaisut/` or `/opinnaytteet/` and sidebar → `/kynasta/`, keep both (they serve different orientation semantics).
3. **CSS:** no new selectors. `.content-detail-orientation` optional wrapper class only if a new region needs styling.
4. **FI/EN:** unchanged (hub label + returnTo vars already per-consumer).
5. **Content Graph, Canonical Content v1, Pagefind, JSON-LD, public JSON:** unchanged.

Expected diff size: ~10 lines moved per template + one optional wrapper class. Total ~50 lines of template moves across 5 files. Zero new abstractions.

## 18. Regression test plan (for the implementation slice — not written now)

New spec `tests/detail-ux-orient-01.spec.js` should assert:

### Shared
- A. Orientation partial (`data-detail-hub-link`) appears **exactly once** in the DOM of every representative detail page (5 consumers).
- B. Hub `href` unchanged per domain (Media: `/mediassa/`, Publication: `/julkaisut/`, Presentation: `/esitykset/`, Thesis: `/opinnaytteet/`, Writing: `orientationCtx.archiveHref`).
- C. `Detaljisivun orientaatio` / `Detail page orientation` `aria-label` preserved.
- D. Rendered SSR with `javaScriptEnabled: false`; hub button visible; return-link stays hidden until JS.
- E. Keyboard tab order: primary CTA (when present) reached before orientation on all 5 domains (currently violated on Publication + Writing).

### Primary CTA
- F. `btn-primary` count in the hero section: exactly 0 (Writing without source), exactly 1 (all others when source present). Orientation MUST NOT appear inside `content-detail-hero`.

### Presentation
- G. `Samalla kurssilla` on 405040Y luento pages: still 2 peers each, unchanged.
- H. Kempele: Paikka + Käyttöyhteys + Järjestäjä rows still present, still non-conflated, no course-peer section.
- I. Thumbnail hero aside for presentations with thumbnails unchanged.

### Publication
- J. DOI sidebar row `<dt>DOI</dt>` present and unchanged (DETAIL-UX-01A hard rule).
- K. `Avaa DOI:ssa` label preserved when DOI is the destination.

### Thesis
- L. `Avaa OuluREPOssa` hero primary preserved.
- M. Body-card "Alkuperäinen lähde" duplicate CTA preserved (DETAIL-UX-01A intentional duplication).

### Media
- N. Outlet-suffixed CTA `Avaa alkuperäinen lähde — {outlet}` preserved when outlet known.

### Blog / Writing
- O. Blog card-footer back link unchanged (not a consumer of the shared partial).
- P. Writing without external source: hero contains 0 buttons; orientation renders in trailing region.

### FI / EN
- Q. English variants (where they exist for the domain) preserve orientation label + destination parity.

### JSON-LD / metadata
- R. No change to any `<script type="application/ld+json">` block on any sampled page.

## 19. Architecture Closure 1.0 status

**CLOSED / GREEN / MAIN.** This audit does not open AC1. The recommended MOVE is a post-closure UX refinement of placement only; the O1 primitive stays intact, Canonical Content v1 stays intact, no runtime JS or Pagefind changes are proposed.

## 20. Final recommendation (one line)

> **MOVE (domain-aware, minimum-slice):** keep O1's shared `detail-orientation.njk`; move its include out of the hero action row on all 5 shared-partial consumers to a trailing site-orientation position, converging with the existing `content-context-archive-link` where destinations coincide. Blog stays as-is. Do not open Canonical Content v1, Pagefind, or Content Graph.
