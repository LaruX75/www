# IMPACT-UX-01 — homepage recognition block

STATUS: PROVEN / READY FOR PR

## Goal

Add one compact SSR homepage block that answers what the work has led to or been recognised for without creating a new impact model, KPI wall, or client-side aggregation layer.

## Evidence selection

- 2020: National Open Science Award / Kansallinen avoimen tieteen palkinto
- 2014: Teacher of the Year in Educational Technology / Vuoden tieto- ja viestintätekniikkaopettaja

These were chosen because they are the clearest personal, historically stable recognitions already reconciled in `IMPACT-RECOGNITION-01`. The 2025 and 2026 awards remain valuable, but they are primarily project or team recognitions and were therefore not used as the main homepage proof.

## Deliberate exclusions

- No new impact or awards data model
- No reach aggregation for this block
- No testimonial duplication
- No outcome or adoption claims
- No timeline redesign

## Placement

- FI: after the role cards and before the timeline
- EN: after the main overview section and before testimonials

This keeps the section out of the hero KPI area, preserves orientation, and avoids competing with the existing testimonial section.

## Implementation

- `src/index.njk`: adds a compact FI SSR recognition section with two curated items and one canonical CTA to `/palkinnot/`
- `src/en/index.njk`: adds the EN counterpart with the same evidence and CTA to `/en/awards/`
- `src/css/modules/_home.css`: adds shared layout and card styles for the recognition section
- `tests/impact-ux-01-home-recognition.spec.js`: verifies SSR presence, canonical links, placement, compact mobile layout, desktop grid stability, and overflow safety

## Canonical ownership

The homepage block is only an SSR projection. The authoritative content remains on:

- FI: `/palkinnot/`
- EN: `/en/awards/`

No new content ownership layer was introduced.

## Accessibility and layout

- Heading hierarchy remains sequential under the homepage structure
- Cards are non-nested static content; the only action is a clear section CTA
- Native list semantics are used for the recognition items
- The section is designed to remain single-column on mobile and two-column on desktop

## Duplication review

The timeline still includes award-related milestones, but its purpose remains chronological context rather than compact proof. For this bounded PR the timeline stays unchanged.

## Architecture

IMPACT-UX-01 remains a bounded post-closure homepage UX refinement:

- canonical recognition pages remain authoritative
- the homepage is only an SSR projection
- Nunjucks remains the renderer
- no taxonomy or contexts changed
- no JavaScript was added
- Pagefind is not involved

## Verification

Pending final local verification and PR/CI closure:

- `git diff --check`
- `npm run test:unit`
- `npm run build:local:full`
- `npm run check:i18n-seo`
- `npm run check:researchfi-integrity`
- `npm run check:jsonld`
- focused Playwright coverage, including the new homepage recognition spec
