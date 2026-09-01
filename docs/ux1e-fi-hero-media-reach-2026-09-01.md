# UX1-E — FI hero media reach parity

**Status:** PROVEN
**Date:** 2026-09-01
**Base SHA:** `f02278e8e52a437bfc087d47f3e9c4c14487dca2` (post UX1-C merge)

## Problem

UX1-D established that the FI homepage hero exposed only OUTPUT signals (presentations, publications, speeches, theses) while EN already exposed six KPIs including `heroMediaCount` as a REACH signal. The FI page had `heroMediaCount` calculated at build time (`src/index.njk:54`) but never displayed. This was an accidental FI/EN asymmetry, not a design choice — the data was already fully derived from the canonical `mediaArchive` domain.

## Existing source

- `src/index.njk:54`: `{% set heroMediaCount = ((mediaArchive and mediaArchive.all) or []) | length %}`
- Data source: `src/_data/mediaArchive.js` which scans `src/media/*.md` (73 files as of this commit).
- The same variable is displayed on EN at `src/en/index.njk:59` inside `heroStats` as `label: "media appearances"`, `href: "/en/media/"`.

## FI/EN asymmetry before UX1-E

| Hero KPI | FI | EN |
| --- | :---: | :---: |
| presentations | ✓ | ✓ |
| publications | ✓ | ✓ |
| speeches | ✓ | ✓ |
| theses | ✓ | ✓ |
| media appearances | **missing** | ✓ |
| expert statements | not present | ✓ |

## Implementation

One-line addition to `src/index.njk:66–71`:

```njk
{% set heroStats = [
    { count: heroPresentationCount, label: "Esitystä tai oppimateriaalia", href: "/esitykset/" },
    { count: heroPublicationCount, label: "tieteellistä julkaisua", href: "/julkaisut/" },
    { count: heroSpeechCount, label: "puheenvuoroa", href: "/valtuustotyo/#puheet" },
    { count: theses.stats.total, label: "ohjattua opinnäytettä", href: "/opinnaytteet/" },
    { count: heroMediaCount, label: "mediaosumaa", href: "/mediassa/" }
] %}
```

FI wording: **"mediaosumaa"** (partitive singular). Matches existing site terminology used by `src/_data/headerNav.js` ("Haastattelut, mediaosumat ja julkinen keskustelu."), `src/_data/hubs.js` ("Kaikki mediaosumat", "Haastattelut, podcastit, videot ja muut mediaosumat"), and multiple `_data/*.js` context strings. No new taxonomy term introduced.

Rendered order after Nunjucks `sort(true, false, "count")` (count DESC):
1. **230** Esitystä tai oppimateriaalia
2. **117** ohjattua opinnäytettä
3. **92** puheenvuoroa
4. **73** mediaosumaa  ← new
5. **56** tieteellistä julkaisua

## Mobile layout

Verified via `tests/ux1c-mobile-home-hero-proof.spec.js` (updated to expect count=5 and to assert the `/mediassa/` link visible):

| Width | Layout | Overflow | Result |
| ----: | ------ | -------- | ------ |
|   375 | 2×2 + 1 (5th KPI wraps to new row, spans column 1) | none | PASS |
|   390 | 2×2 + 1 | none | PASS |
|   430 | 2×2 + 1 | none | PASS |

Grid uses the existing UX1-C mobile rule `.home-hero-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) }` (`src/css/home-page.css:661–668`). No CSS change was required: the 5th KPI wraps as a single card in a new row. Playwright confirms no horizontal overflow and hero remains within viewport.

## Desktop

| Width | Result |
| ----: | ------ |
|   1280 | Two-column hero preserved; KPI grid renders 5 items in the right column; no overflow. |
|   1440 | Same. |

Verified via `tests/ux1c-mobile-home-hero-proof.spec.js:54–66` (updated). No CSS change needed for desktop.

## Accessibility

- `<dl>` / `<dt>` / `<dd>` semantics preserved for KPI structure.
- The count value is a real `<a class="home-hero-kpi-link">` link (matches existing pattern from UX1-C).
- New link `href="/mediassa/"` matches the canonical media archive landing.
- Focus visible via existing `.home-hero-kpi-link:focus-visible { text-decoration: underline; }` (`src/css/modules/_home.css:122–125`).
- Touch target ≥ 44 px preserved by existing `.home-hero-kpi { padding: 0.68rem 0.6rem; border-radius: 0.85rem }` mobile rule.

## Performance

- **FI HTML `_site/index.html`:** 151,275 → **151,600 B** (Δ +325 B; one new KPI DOM row in SSR).
- **EN HTML `_site/en/index.html`:** 150,352 B (unchanged).
- **JS delta:** 0.
- **Runtime JSON delta:** 0.
- **Pagefind delta:** 0.
- **Network delta:** 0 new request.

## CSS cleanup

None. The UX1-C grid rules already handle the 5th item cleanly (2×2 + 1 wrap on mobile; auto-flow on desktop).

## Architecture

- **Existing `mediaArchive` data remains authoritative.** No new taxonomy, no new contexts, no new content type, no new JSON endpoint.
- **Nunjucks remains the renderer.** No new JavaScript. No Pagefind touch.
- **Canonical semantics unchanged.** The KPI is a REACH visibility surface for existing OUTPUT (media appearances catalogued under `src/media/`).
- **UX1-B and UX1-C remain PROVEN / MERGED / MAINTENANCE.** Aloita tästä orientation section untouched. Compact mobile proof untouched.
- **UX1-D remains AUDIT COMPLETE.** UX1-E implements the single compact recommendation from that audit.
- **P1-A remains COMPLETE / NO MATERIAL PERFORMANCE WORKSTREAM.** 325 B of extra SSR HTML is well within accepted budgets.
- **PF5 remains CLOSED / MAINTENANCE.**
- **AC1 remains CLOSED / GREEN / MAIN.**
