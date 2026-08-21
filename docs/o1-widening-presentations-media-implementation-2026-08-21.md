# O1 Widening — Presentations + Media Implementation

Date: 2026-08-21

Status: IMPLEMENTED / GREEN / BRANCH

Base `origin/main` SHA: `1d82d6387c6c97c86a6af990766e419e152230b7`
Audit worktree: `/private/tmp/www-o1-widening-audit`
Audit branch: `docs/o1-widening-suitability-audit`
Reference audit: [o1-widening-presentations-media-suitability-audit-2026-08-21.md](./o1-widening-presentations-media-suitability-audit-2026-08-21.md)

Both audit verdicts (Presentations = GO, Media = GO) are implemented in this pass. Active-discovery `returnTo` plumbing was implemented for both domains within the existing O1 URL-state model — no new navigation, storage, or history-API state was introduced.

## 1. Exact changed files

Production (source, template, JS):

- `src/_includes/presentation-item.njk` — replaces the hardcoded `Kaikki esitykset` back-link with the shared O1 primitive
- `src/_includes/media-item.njk` — replaces the hardcoded `Kaikki mediaosumat` back-link with the shared O1 primitive
- `src/js/presentations-page.js` — appends `?returnTo=<current URL>` to the local `/presentations/…` card URL in `archiveCardHtml`, only when the item is not external-first
- `src/fi/mediassa.njk` — adds a small `detailUrlWithReturn(rawUrl)` helper inside the existing inline archive script and uses it for the `Lisätiedot` link in `renderCard`; also hardcodes `?returnTo=%2Fmediassa%2F` on the two SSR `Lisätiedot` links (main highlight + opening cards)
- `src/en/media.njk` — hardcodes `?returnTo=%2Fen%2Fmedia%2F` on the SSR EN `Details (FI)` link that lands on the FI media detail page

Tests:

- `tests/o1-orientation.spec.js` — extended with 7 new tests covering Presentations + Media (SSR + no-JS + returnTo behavior + external-first non-decoration + EN → FI cross-locale returnTo)
- `tests/presentations-archive.spec.js` — two href assertions widened from `[href="…"]` (exact) to `[href^="…"]` (prefix) to accommodate the returnTo suffix; navigation URL assertion widened to match with or without a trailing query

Documentation:

- `docs/o1-widening-presentations-media-suitability-audit-2026-08-21.md` — the pre-implementation audit (added in same branch)
- `docs/o1-widening-presentations-media-implementation-2026-08-21.md` — this file

No other file was touched. No canonical content, Pagefind config, `/data/*.json` projection, CSS, or CI workflow changed.

## 2. Presentations SSR orientation behavior

Before:

```njk
<a href="/esitykset/" class="btn btn-outline-secondary rounded-pill px-4">Kaikki esitykset</a>
```

After:

```njk
{% set orientationLang = currentLang %}
{% set orientationHubHref = "/esitykset/" %}
{% set orientationHubLabel = "Kaikki esitykset" %}
{% set orientationReturnPrefixes = ["/esitykset/", "/en/presentations/"] %}
{% include "detail-orientation.njk" %}
```

Behavior:

- SSR `<nav aria-label="Detaljisivun orientaatio">` landmark added
- SSR hub-return link `<a href="/esitykset/">Kaikki esitykset</a>` (visible, `data-detail-hub-link`)
- Client-only `<a class="d-none" href="/esitykset/" data-detail-return-link>Takaisin hakutuloksiin</a>` revealed by `site-ui.js` only when a validated `?returnTo=` matches one of the allowed prefixes AND differs from the hub fallback and from the current detail URL
- Applies to all 139 local presentation detail pages — external-first canonicals do not render through this template

No `history.back()` was introduced. Preferred landing (`landingUrl`) is unchanged. `pageUrl`, `sourceUrl`, `externalUrl` are untouched.

## 3. Media SSR orientation behavior

Before:

```njk
<a href="/mediassa/" class="btn btn-outline-secondary rounded-pill px-4">Kaikki mediaosumat</a>
```

After:

```njk
{% set orientationLang = currentLang %}
{% set orientationHubHref = "/mediassa/" %}
{% set orientationHubLabel = "Kaikki mediaosumat" %}
{% set orientationReturnPrefixes = ["/mediassa/", "/en/media/"] %}
{% include "detail-orientation.njk" %}
```

Behavior:

- Same primitive contract as presentations
- The `Avaa alkuperäinen lähde` `btn-primary` external CTA remains visually dominant, placed above the orientation nav (existing template order preserved)
- Applies to all 73 local media detail pages
- M2 boundaries respected: no new canonical media model, no Research inference, no `data-pagefind-body`, no archive redesign, no `/data/media.json` contract change, no changes to `mediaRole` / `mediaType` / `mediaOutlet` / hidden Pagefind metadata

## 4. Active-discovery returnTo decision

Decision: **implemented for both domains, within the existing O1 URL-state model.**

Reasoning: the existing O1 model already treats `?returnTo=<local discovery URL>` as the single source of truth for optional discovery return, validated by an allowlist prefix set on the target detail page. Both Presentations and Media archives can produce this query parameter with small, bounded changes to their existing renderers — no new state ownership, no browser storage, no history-API navigation, and no serialized result-set state.

The alternative would have been to defer plumbing (as the audit allowed). We did not defer because the actual changes required are strictly additive query-string decoration on already-existing links, and the site-wide `site-ui.js` return-link resolver already handles the semantics.

### Presentations — where returnTo is appended

- `src/js/presentations-page.js` `archiveCardHtml`: the local landing URL only. External-first canonical presentations and non-`/presentations/…` URLs are explicitly not decorated. Both the title-anchor and the CTA-anchor share the same `url` variable, so the returnTo is emitted on both.
- Guard: `!external && url && url.startsWith("/presentations/")` — no external Canva / SlideShare / YouTube / AOE URL receives a returnTo rewrite.

### Media — where returnTo is appended

- `src/fi/mediassa.njk` inline archive script `renderCard`: appends `?returnTo=<window.location.pathname + window.location.search>` via a new `detailUrlWithReturn(rawUrl)` helper, only on the `Lisätiedot` link which targets `/mediassa/<slug>/`. External source links (`sourceUrl` / `externalUrl`) are untouched.
- `src/fi/mediassa.njk` SSR opening cards + main highlight `Lisätiedot`: hardcoded `?returnTo=%2Fmediassa%2F`
- `src/en/media.njk` SSR `Details (FI)` link: hardcoded `?returnTo=%2Fen%2Fmedia%2F`

### site-ui.js reveal behavior (unchanged from O1 core)

The client-only return link stays hidden when:

- `?returnTo=` is missing, invalid, cross-origin, or fails the prefix allowlist
- `returnTo` equals the hub fallback (same pathname, search, and hash) — this is the "bare returnTo suppression" that keeps the hub button from being duplicated as a second link
- `returnTo` equals the current detail page itself

It is revealed when `returnTo` carries state that differs from the hub — the cross-locale case (EN archive → FI detail), or a filter/query-carrying case, or a hash-carrying case.

## 5. Deletion accomplished (C1)

Two hardcoded orientation controls were removed as part of the widening, not layered on top:

- `src/_includes/presentation-item.njk:48` (previously the sole `<a href="/esitykset/">Kaikki esitykset</a>`)
- `src/_includes/media-item.njk:49` (previously the sole `<a href="/mediassa/">Kaikki mediaosumat</a>`)

No new duplicate SSR + shared-orientation controls exist. No presentation- or media-specific back-control helper existed before this pass, so nothing else was deletable.

## 6. FI / EN implications

Both domains have FI-only detail pages today (0 EN detail routes for presentations, 0 EN detail routes for media). Visible orientation UI change is therefore FI-only.

The `orientationReturnPrefixes` allowlist includes both the FI and the EN archive prefix in each domain:

- Presentations: `["/esitykset/", "/en/presentations/"]`
- Media: `["/mediassa/", "/en/media/"]`

This lets the EN archive link to the FI detail page (existing publications pattern) with a valid returnTo that the shared primitive accepts. The EN media test covers this exact cross-locale case.

No new EN detail route was created. No preferred-landing semantics were altered.

## 7. No-JS behavior

- SSR hub-return link is present in built HTML with the correct `href` for both domains
- Verified in built output at `_site/presentations/arjen-tekoalyhaaste/index.html` and `_site/mediassa/2025/12/24/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/index.html`
- Clicking the hub-return link with JavaScript disabled navigates to `/esitykset/` or `/mediassa/` respectively — tested by two dedicated no-JS Playwright cases
- Discovery return link stays `d-none` without JavaScript, so no dangling control appears
- Source / external CTA remains intact on media (`youtube.com` link present in no-JS render — asserted in test)

## 8. Preserved landing / source semantics

- Preferred presentation landing (`landingUrl` = local-first if `hasLocalDetail`, else external) is unchanged
- External-first canonical presentations continue to link directly to their external source from the archive — no returnTo rewrite is applied to external URLs
- Media items continue to expose `sourceUrl` / `externalUrl` as the primary external destination with an unchanged `Avaa alkuperäinen lähde` CTA on the detail page

## 9. Test results

Local runs in the audit worktree (`/private/tmp/www-o1-widening-audit`):

- `DISABLE_OG_IMAGES=true npm run build:no-og` → PASS (1,458 HTML documents built)
- `npm run test:unit` → **602 / 602** PASS
- `npx playwright test --workers=1 tests/o1-orientation.spec.js` → **11 / 11** PASS (4 pre-existing + 7 new)
- `npx playwright test --workers=1 tests/presentations-archive.spec.js tests/media-archive.spec.js tests/presentations-research-smoke.spec.js` → **6 / 6** PASS

Existing N1 baseline focus-trap regression (in `tests/navigation.spec.js`) is a known separate issue and was intentionally not touched in this workstream, per the roadmap boundary.

## 10. Roadmap disposition

Not updated in this pass. The site-architecture roadmap on `main` currently states `O1 widening = ACTIVE`. This implementation closes the Presentations + Media widening slice; a follow-up roadmap docs commit can update the status once this branch is merged. That is intentionally out of the current implementation scope.

## 11. Explicit non-actions

- No change to Canonical Content v1
- No change to `contexts`
- No Research membership inferred for Presentations or Media
- No archive redesign
- No PF5 or N1 work
- No new EN detail pages created
- No preferred presentation landing semantics changed
- No `data-pagefind-body` added to media
- No new public JSON contract
- No CI workflow change
- No `history.back()` introduced
