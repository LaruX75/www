# O1 Widening — Presentations + Media Suitability Audit

Date: 2026-08-21

Status: DOCS-ONLY AUDIT. No production code, template, JS, Pagefind, canonical content, or public JSON changed.

Audit worktree: `/private/tmp/www-o1-widening-audit`
Audit branch: `docs/o1-widening-suitability-audit`
Base `origin/main` SHA: `1d82d6387c6c97c86a6af990766e419e152230b7`

Presentations and Media are audited in one docs but each domain receives its own independent verdict.

## 1. O1 Core Recap

Core primitive on `main` (`src/_includes/detail-orientation.njk`, 23 lines):

- SSR canonical hub-return link (`data-detail-hub-link`) that works with JavaScript off
- Optional client-revealed `Back to results` / `Takaisin hakutuloksiin` link (`data-detail-return-link`) that appears only when a validated `returnTo` query parameter matches the allowed prefix list
- Semantic `<nav>` landmark with a localized aria-label
- Inputs: `orientationHubHref`, `orientationHubLabel`, `orientationReturnLabel`, `orientationReturnPrefixes`, `orientationLang`

Currently applied on `main` at:

- `src/_includes/publication-item-body.njk` line 31
- `src/_includes/thesis-detail-body.njk` line 33
- `src/_includes/writing-post.njk` line 84

Roadmap rules:

- no `history.back()` dependency
- no parallel browser navigation model
- no forced one-size-fits-all orientation component
- Presentations + Media were explicitly deferred pending this suitability audit

## 2. Presentations — Current Detail Flow

Verified against `origin/main` on the audit worktree.

Local detail route: `/presentations/{slug}/` (FI-only). 139 local Markdown files in `src/presentations/*.md`, each with `pageUrl: /presentations/{slug}/` frontmatter. Data layer: `src/_data/presentationsPage.js` with `withPresentationSemantics()` producing `localPageUrl`, `sourceUrl`, `externalUrl`, `hasLocalDetail`, `landingUrl`. F3C closure numbers: 218 canonical presentations, 138 local-first, 80 external-first, 139 built local detail pages.

External-first canonical presentations (Canva, SlideShare, YouTube, AOE that live only on the external platform) get no local detail page — they land directly on the external URL from the archive.

Detail template: `src/_includes/presentation-item.njk` (109 lines).

Current orientation on the presentation detail page (lines 44–49):

```njk
<div class="content-detail-actions">
  {% if publicSourceHref %}
    <a href="{{ publicSourceHref }}" target="_blank" rel="noopener noreferrer" class="btn btn-primary rounded-pill px-4">…</a>
  {% endif %}
  <a href="/esitykset/" class="btn btn-outline-secondary rounded-pill px-4">Kaikki esitykset</a>
</div>
```

- No breadcrumb
- No SSR discovery-return link
- No `history.back()` usage
- Hardcoded FI-only hub button
- No returnTo attributes; `site-ui.js` return logic is inert on presentation detail pages
- No presentation-specific JS on detail pages; `presentations-page.js` only loads on the archive

Archive / hub: `/esitykset/` (FI) via `src/esitykset.njk`, `/en/presentations/` (EN) via `src/en/presentations.njk`. Both mount the shared Find & Explore content-engine stack (`content-engine.js`, `content-presets.js`, `pe-list-render.js`) with the `FindExplore:presentations` preset. Archive is F&E-enabled but does not currently emit `?returnTo=` on card clicks to detail pages.

FI/EN parity: FI has 139 local detail pages; EN has zero. `src/en/` contains only `presentations.njk` (archive) + `presentations.11tydata.js`, no `.md` detail files. Both archives filter the same canonical dataset; EN archive links to FI local detail pages (existing architecture boundary) or to external URLs for external-first items.

## 3. Media — Current Detail Flow

Verified against `origin/main` on the audit worktree.

Local detail route: `/mediassa/{slug}/` (FI-only). 73 local Markdown files in `src/media/*.md`, each rendered via `src/media/media.11tydata.js` (`lang: fi`, layout `media-item.njk`). Content types: `mediaRole` ∈ {about, guest, interviewer, expertAssignment}, `mediaType` ∈ {article, video, podcast, radio, tv, assignment}. Every media item gets a detail page. Per M2 closure: 100% coverage on mediaType/mediaRole/mediaOutlet/sourceUrl/categories/keywords.

Media items are wrappers over external content — the primary user destination is the external outlet, and the local page records the appearance with a `sourceUrl` link plus contextual metadata.

Detail template: `src/_includes/media-item.njk` (121 lines).

Current orientation on the media detail page (lines 45–50):

```njk
<div class="content-detail-actions">
  {% if sourceHref %}
    <a href="{{ sourceHref }}" target="_blank" rel="noopener noreferrer" class="btn btn-primary rounded-pill px-4">Avaa alkuperäinen lähde</a>
  {% endif %}
  <a href="/mediassa/" class="btn btn-outline-secondary rounded-pill px-4">Kaikki mediaosumat</a>
</div>
```

Media detail pages also emit hidden Pagefind item-level metadata (`Sisältö:Mediassa`, `Mediatyyppi:…`, `Rooli:…`, `Vuosi:…`) added by M2. That is a Pagefind-only surface, not a JS-runtime orientation dependency.

- No breadcrumb
- No SSR discovery-return link
- No `history.back()` usage
- Hardcoded FI-only hub button
- No returnTo attributes; `site-ui.js` return logic is inert on media detail pages
- External source button is visually primary (`btn-primary`) and comes first in the actions block

Archive / hub: `/mediassa/` (FI) via `src/fi/mediassa.njk`, `/en/media/` (EN) via `src/en/media.njk`. Both archives exist with M2 F&E support. Archives use `data-pagefind-ignore` on the card grid so per-item detail records win over the landing.

FI/EN parity: FI has 73 local detail pages; EN has zero. Both archives exist and list all 73 items with filtering UI, but EN detail pages are not part of M2.

## 4. Current Orientation / Back Controls Inventory

| Domain | Detail template | Line | Current back control | Type | JS-dependent? | History.back() |
| --- | --- | ---: | --- | --- | --- | --- |
| Publications | `publication-item-body.njk` | 31 | `detail-orientation.njk` (O1 core) | Shared primitive | No (SSR fallback) | No |
| Theses | `thesis-detail-body.njk` | 33 | `detail-orientation.njk` (O1 core) | Shared primitive | No (SSR fallback) | No |
| Writings | `writing-post.njk` | 84 | `detail-orientation.njk` (O1 core) | Shared primitive | No (SSR fallback) | No |
| **Presentations** | `presentation-item.njk` | 48 | Hardcoded `<a href="/esitykset/">Kaikki esitykset</a>` | Ad-hoc | No | No |
| **Media** | `media-item.njk` | 49 | Hardcoded `<a href="/mediassa/">Kaikki mediaosumat</a>` | Ad-hoc | No | No |

Neither Presentations nor Media has a discovery-return control today. Both would gain one only through the shared primitive.

## 5. Canonical / Source / Landing Semantics

### Presentations

- Identity: canonical presentation record from `presentationsPage.js`
- Preferred landing: `landingUrl` = `localPageUrl` when `hasLocalDetail` is true, else `sourceUrl`
- Local detail page exists only for the 138 local-first canonicals — external-first canonicals never reach `presentation-item.njk`, so the shared primitive would never be rendered on their behalf
- `pageUrl`, `sourceUrl`, `externalUrl` remain distinct fields; the primitive touches none of them
- Widening cannot force external-first canonicals through a local detail page because they have no local detail page to widen

### Media

- Identity: canonical local content wrapping an external appearance
- Preferred landing model: `sourceUrl` is the external primary destination; `/mediassa/{slug}/` is the local record page
- Every media item has a local detail page (per current M2 model)
- The shared primitive would render on the local record page and points back to the local hub `/mediassa/` — not to `sourceUrl`. The "Avaa alkuperäinen lähde" button remains the primary CTA above the primitive, preserving external-primary semantics
- The primitive does not touch `sourceUrl`, `externalUrl`, or `data-pagefind-*` metadata

Neither widening introduces a new canonical model, invents a local detail route, collapses representation URLs, decorates external links with `returnTo`, or invents new taxonomy. All roadmap-listed hard constraints (Canonical Content v1 untouched, no Research inference, no `data-pagefind-body`, no archive redesign, no removal of `/data/*` contracts) are respected.

## 6. C1 Deletion Candidates

### Presentations

- `src/_includes/presentation-item.njk:48` — hardcoded `<a href="/esitykset/">Kaikki esitykset</a>` becomes redundant once the shared primitive renders the hub button. **DELETE-CANDIDATE alongside widening.**
- No other duplicate orientation logic exists on presentation detail pages.

### Media

- `src/_includes/media-item.njk:49` — hardcoded `<a href="/mediassa/">Kaikki mediaosumat</a>` becomes redundant once the shared primitive renders the hub button. **DELETE-CANDIDATE alongside widening.**
- No other duplicate orientation logic exists on media detail pages.

Both widenings *replace* an existing control rather than merely *adding* a new layer — they satisfy the C1 rule "deletion is part of completion, not a separate cleanup phase".

## 7. FI / EN Implications

Both Presentations and Media have FI-only detail pages today. Adding the shared primitive is a **FI-only visible change** in both domains. No new EN detail route is created by widening; the audit does not recommend inventing EN detail pages as part of O1 widening.

`orientationReturnPrefixes` should include both `/esitykset/` and `/en/presentations/` (or `/mediassa/` and `/en/media/`) so a validated `?returnTo=` from either archive is accepted when EN archive links to a FI detail page — the existing pattern already used by publications where the EN archive links to canonical FI publication detail pages.

The primitive's language switch (`orientationLang`) is already localized ("Back" / "Takaisin", "Back to results" / "Takaisin hakutuloksiin"). Since detail pages are FI-only, `currentLang` will resolve to `fi` for both domains.

## 8. No-JS / Accessibility Implications

- Current hardcoded buttons: single visible SSR `<a>`. No JS dependency.
- Post-widening: SSR `<nav aria-label="Detaljisivun orientaatio">` containing the same visible hub link (identical no-JS behavior) plus a hidden `.d-none` "Back to results" link that JS reveals only after allowlist validation.
- No `history.back()` is introduced.
- No `role`, `aria-current`, or landmark contract is regressed.
- Net accessibility change: neutral to positive (proper `<nav>` landmark added).

## 9. O1 Primitive Fit Check — Per Domain

| Question | Presentations | Media |
| --- | --- | --- |
| Clear canonical local detail page suitable as orientation anchor? | Yes (139 local pages) | Yes (73 local pages) |
| One clear canonical hub route (per locale)? | Yes: `/esitykset/`, `/en/presentations/` | Yes: `/mediassa/`, `/en/media/` |
| Is active-discovery `returnTo` semantically valid? | Yes (F&E-enabled archive) | Yes (M2 F&E-enabled archive) |
| Can the existing allowlist/prefix validation be reused? | Yes (identical model to publications) | Yes (identical model to publications) |
| Is there already a back/archive control? | Yes, hardcoded FI-only | Yes, hardcoded FI-only |
| Any current control JS-only or `history.back()`? | No | No |
| Widening replaces existing markup vs merely adding a layer? | Replaces | Replaces |
| Does the shared include need a bounded variant? | No — direct include with parameters | No — direct include with parameters |

## 10. Verdicts

### PRESENTATIONS = **GO**

The shared O1 primitive fits directly. The 139 local detail pages have a clear canonical hub (`/esitykset/`), an F&E-enabled discovery surface, and an existing hardcoded back-control that the primitive replaces. The identity-vs-representation model is preserved because external-first canonicals never render through `presentation-item.njk` in the first place. No bounded variant is needed.

Scope is FI-only in visible impact (EN detail pages do not exist). No new EN routes are recommended.

### MEDIA = **GO**

The shared O1 primitive fits directly. The 73 local detail pages have a clear canonical hub (`/mediassa/`) and an M2-established F&E surface. External-primary semantics are preserved by keeping "Avaa alkuperäinen lähde" as the visually primary `btn-primary` above the orientation nav. The primitive stays fully within the M2 boundaries (no new canonical model, no Research inference, no `data-pagefind-body`, no archive redesign, no `/data/*` contract change).

Scope is FI-only in visible impact. No new EN routes are recommended.

**Both verdicts are independent.** The two domains ended up at the same verdict, but for domain-specific reasons — not because consistency was enforced.

## 11. Exact Minimum Implementation Scope (Not Executed)

### Presentations

- Edit `src/_includes/presentation-item.njk` between lines 44 and 49:
  - Remove the hardcoded `<a href="/esitykset/">Kaikki esitykset</a>` line
  - Immediately after the existing `Avaa materiaali` / `Katso tallenne` `<a>` block, add:
    ```njk
    {% set orientationLang = currentLang %}
    {% set orientationHubHref = "/esitykset/" %}
    {% set orientationHubLabel = "Kaikki esitykset" %}
    {% set orientationReturnPrefixes = ["/esitykset/", "/en/presentations/"] %}
    {% include "detail-orientation.njk" %}
    ```
- No template migration for EN detail pages (none exist).
- Optional follow-up (not part of minimum scope): teach the presentations archive to append `?returnTo=<current archive URL>` on local card links — same pattern as publications/theses/writings, would be a `src/js/find-explore.js`-adjacent change (out of O1 minimum scope; can be deferred).
- Tests: extend `tests/o1-orientation.spec.js` with one FI presentation-detail case, or add `tests/o1-orientation-presentations.spec.js` mirroring the existing 4/4 pattern (hub-return works without JS; validated `?returnTo` reveals discovery link; invalid `returnTo` stays hidden).
- FI/EN impact: FI-only visible change.
- No-JS behavior: identical (hub link SSR-visible).
- C1 deletion: `presentation-item.njk:48` hardcoded `<a>` line.

### Media

- Edit `src/_includes/media-item.njk` between lines 45 and 50:
  - Remove the hardcoded `<a href="/mediassa/">Kaikki mediaosumat</a>` line
  - Immediately after the existing `Avaa alkuperäinen lähde` `<a>` block, add:
    ```njk
    {% set orientationLang = currentLang %}
    {% set orientationHubHref = "/mediassa/" %}
    {% set orientationHubLabel = "Kaikki mediaosumat" %}
    {% set orientationReturnPrefixes = ["/mediassa/", "/en/media/"] %}
    {% include "detail-orientation.njk" %}
    ```
- Preserve `btn-primary` external-source button as the visually dominant CTA above the orientation nav.
- No template migration for EN detail pages (none exist).
- Tests: extend `tests/o1-orientation.spec.js` with one FI media-detail case, or add a dedicated `tests/o1-orientation-media.spec.js`.
- FI/EN impact: FI-only visible change.
- No-JS behavior: identical (hub link SSR-visible).
- C1 deletion: `media-item.njk:49` hardcoded `<a>` line.

### Explicit non-scope

- No `?returnTo=` plumbing for archive card links in this minimum scope
- No canonical presentation representation/identity change
- No new canonical media model
- No Presentations added to Research
- No archive redesign
- No Pagefind config or filter change
- No public JSON contract change
- No `history.back()` introduced
- No PF5 / N1 work

## 12. Validation

- `git diff --check`: clean (docs-only add)
- `git status --short` (audit worktree): single untracked audit file
- No build required — docs-only, and both domains' current templates were read directly on `origin/main`.

## 13. Non-actions Confirmation

- No production source, template, JavaScript, CSS, Pagefind config, canonical content, or public JSON changed
- No commit, push, or PR opened
- Primary worktree at `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2` untouched
- Other worktrees untouched
