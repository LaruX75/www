# UX1-B — FI homepage "Aloita tästä" orientation paths

Date: 2026-09-01
Branch: `ux/ux1b-fi-home-orientation-paths`
Base: `e14000ca8eced86171e85d68099fbf38c5184803`

## Problem

The Finnish homepage already had authoritative editorial orientation data in
`pageContent.etusivu.paths`, but `src/index.njk` did not render it. As a
result, the first-scroll FI experience jumped from the hero directly into the
three role cards, leaving `Kynästä` and `Mediassa` underrepresented in the
primary orientation layer.

## Existing data source

Authoritative source:

- `src/_data/pageContent/etusivu.json`
- `pageContent.etusivu.paths.sectionLabel`
- `pageContent.etusivu.paths.cards[].icon`
- `pageContent.etusivu.paths.cards[].title`
- `pageContent.etusivu.paths.cards[].desc`
- `pageContent.etusivu.paths.cards[].cta`
- `pageContent.etusivu.paths.cards[].href`

No strings were duplicated into template logic.

## Before

FI flow:

`Hero -> role cards -> timeline -> themes -> Larux CTA -> testimonials -> closing CTA`

## After

FI flow:

`Hero -> Aloita tästä -> Työ / Kynästä / Mediassa / Politiikka -> role cards -> timeline -> themes -> Larux CTA -> testimonials -> closing CTA`

## Implementation

- Added a new SSR section in `src/index.njk` immediately after `#heroSection`
  and before `#roolit`.
- Reused the existing homepage path-card pattern and Bootstrap icon classes.
- Kept one interactive target per card by rendering each card as a single link.
- Scoped the FI styling in `src/css/home-page.css` so the new section reads as
  a lighter orientation layer than the richer role cards.
- Kept EN homepage structure unchanged; EN remains a regression/reference
  surface only.

## SSR proof

Built `/_site/index.html` contains:

- `#aloita`
- `#home-paths-heading`
- visible `Aloita tästä`
- all four cards
- canonical links:
  - `/tyoni-yliopistonlehtorina/`
  - `/kynasta/`
  - `/mediassa/`
  - `/politiikka/`

No client-side rendering, Pagefind dependency, runtime JSON fetch, or new
network dependency was introduced for this section.

## Mobile and desktop behavior

- `375px`: all four cards visible in a single-column stack, no horizontal
  overflow.
- `390px`: same as above.
- `430px`: same as above.
- `1280px`: desktop grid stays within one or two rows.
- `1440px`: desktop grid stays within one or two rows.

The role-card section still follows clearly after the orientation layer.

## Accessibility

- Heading hierarchy preserved: homepage `H1` remains the hero, new section uses
  `H2`, existing role section remains `H2`.
- Icons are decorative only and marked `aria-hidden="true"`.
- Cards expose clear link purpose through visible title, description, and CTA.
- Visible focus is preserved through `.home-path-card:focus-visible`.
- No redundant ARIA was added.

## FI/EN rationale

FI changed because the authoritative orientation data already existed but was
not surfaced. EN already exposes its own orientation section, so it was left
structurally unchanged.

## Performance

- Built homepage HTML: `151275` bytes
- Added orientation section markup: `2793` bytes
- Estimated prior homepage HTML without the inserted section: `148482` bytes
- Delta: `+2793` bytes
- New JS: `0`
- New JSON fetch: `0`
- New network dependency: `0`

## Reuse / deletion

- Reused the existing home path card markup pattern already present on EN.
- Simplified older FI-only path-card CSS by scoping it to the new orientation
  section and removing the obsolete primary-card/orphan selectors from the
  active path-card surface.

## Verification

- `git diff --check` ✅
- `npm run build:local:full` ✅
- `npm run test:unit` ✅ (`688/688`)
- `npm run check:i18n-seo` ✅
- `npm run check:researchfi-integrity` ✅
- `npm run check:jsonld` ⚠️ baseline unrelated error remains at
  `presentations/ss-koe-oppimisymparistona-osa-i/index.html`
  (`html-entity-leak`)
- `PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/ux1b-fi-home-orientation-paths.spec.js tests/home-landing-01-canonical-latest.spec.js tests/navigation.spec.js tests/accessibility.spec.js`
  ⚠️ one known navbar-search flake reproduced once
- `PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/navigation.spec.js`
  ✅ isolated rerun passed (`5/5`)

Homepage-specific browser verification passed with the focused UX1-B spec after
locator tightening.

## Architecture status

UX1 remains a post-closure content-experience lane.

The four homepage paths are editorial orientation, not new taxonomy.

Canonical content semantics are unchanged.

Nunjucks renders the entire orientation section.

No client-side content model is introduced.

Pagefind is not involved.

AC1 remains CLOSED / GREEN / MAIN.
