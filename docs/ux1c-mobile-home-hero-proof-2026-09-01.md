# UX1-C — Mobile homepage hero orientation & proof

Date: 2026-09-01
Branch: `ux/ux1c-mobile-home-hero-proof`
Base: `88c726121df2b9fe9c18a0f148b85d12fcb1c056`

## Problem

UX1-A identified a mobile homepage regression in the hero layer:

- FI mobile kept identity, lead and CTAs, but hid the existing hero proof panel.
- EN mobile hid the KPI column behind `d-none`.
- The first short scroll therefore lost too much credibility and orientation context.

UX1-B already solved FI top-level routing with `Aloita tästä`. UX1-C does not
move or duplicate that section; it restores a compact amount of existing hero
evidence on mobile.

## Current ownership

### FI

- `src/index.njk` owns the Finnish hero markup and existing `heroStats`.
- `src/css/home-page.css` owns the FI page-specific hero panel presentation.

### EN

- `src/en/index.njk` owns the English hero markup, role links and existing
  `heroStats`.
- `src/css/modules/_home.css` is the stylesheet EN actually loads.

### Shared CSS

- Shared hero structure, role-link base styling and responsive hero background
  live in `src/css/modules/_home.css`.
- FI overrides and orientation-section styling live in `src/css/home-page.css`.

## Before

### FI mobile

- `H1`
- lead
- 2 CTAs
- hero proof panel hidden by `.home-hero-panel { display: none; }`
- `Aloita tästä` followed only after the missing proof layer

### EN mobile

- `H1`
- lead
- role links already present in hero markup
- 2 CTAs
- KPI column hidden by Bootstrap `d-none`

## Implementation

### FI

- Kept the existing SSR `heroStats` structure and panel markup unchanged.
- Stopped hiding the panel on mobile.
- Condensed the mobile presentation to a KPI-only surface by hiding the longer
  explanatory kicker/text on small screens.
- Reused the existing semantic `<dl>` with a compact 2 × 2 KPI layout.

### EN

- Removed the blocking `d-none` utility from the KPI column.
- Kept the same SSR KPI markup and links.
- Reused the existing `.home-hero-roles` links and turned them into compact
  wrapping chips on mobile through shared CSS.
- Added a compact mobile KPI grid in shared hero CSS without introducing new
  data or client rendering.

### CSS cleanup

- Removed the contradictory mobile `.home-hero-roles { display: none; }` rule
  from `src/css/home-page.css`.
- Moved the useful mobile role-chip presentation into the shared home stylesheet
  that EN actually loads.
- Replaced the EN blocking visibility utility pattern with normal responsive
  flow by deleting `d-none`.

## After

### FI mobile

- `H1`
- lead
- 2 CTAs
- compact KPI proof visible in the hero flow
- `Aloita tästä` remains immediately after the hero

### EN mobile

- `H1`
- lead
- compact role links
- 2 CTAs
- compact KPI proof visible in the hero flow

## Mobile measurements

| Width | FI hero | EN hero | Overflow | Result |
| --- | --- | --- | --- | --- |
| 375 | 775 px | 889 px | none | proof/orientation visible |
| 390 | 757 px | 889 px | none | proof/orientation visible |
| 430 | 714 px | 825 px | none | proof/orientation visible |

The English hero stays taller because it carries both role chips and a larger
six-metric proof set. The added vertical cost remained readable in browser
verification and did not create horizontal overflow.

## Desktop parity

- `1280px`: FI hero `600 px`, EN hero `600 px`
- `1440px`: FI hero `600 px`, EN hero `600 px`
- Existing desktop two-column hero structure remains intact in both languages.

## Accessibility

- Existing role links remain links.
- Existing KPI values remain links.
- Semantic KPI structure remains `<dl>` / `<dt>` / `<dd>`.
- No duplicate mobile-only focus targets were introduced.
- Reading order remains SSR order.

## SSR / architecture

- All restored orientation/proof remains SSR.
- New JavaScript: `0`
- Pagefind involvement: `0`
- Runtime JSON/API: `0`

## Performance

- Built FI homepage HTML remains `151275` bytes.
- Built EN homepage HTML is `150352` bytes.
- HTML growth is limited to one EN class change; FI HTML is unchanged.
- CSS grows slightly to activate already-existing hero content on mobile.
- JS delta: `0`
- Request delta: `0`

## Deleted / simplified

- Deleted FI mobile hero-role hiding that conflicted with the intended compact
  chip model.
- Deleted EN's mobile `d-none` blocker from the KPI column.
- Simplified ownership so shared hero mobile behavior lives in the stylesheet
  both homepages load.

## Verification

- `git diff --check` ✅
- `npm run build:local:full` ✅
- `npm run test:unit` ✅ (`688/688`)
- `npm run check:i18n-seo` ✅
- `npm run check:researchfi-integrity` ✅ (included in `build:local:full`)
- `npm run check:jsonld` ⚠️ baseline only:
  `presentations/ss-koe-oppimisymparistona-osa-i/index.html`
  → `html-entity-leak`
- `PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/ux1c-mobile-home-hero-proof.spec.js tests/ux1b-fi-home-orientation-paths.spec.js tests/home-landing-01-canonical-latest.spec.js tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js` ✅ (`53/53`)
