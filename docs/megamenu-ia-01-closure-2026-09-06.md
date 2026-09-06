# MEGAMENU-IA-01 — closure (2026-09-06)

Työ mega-menu information-architecture rework. Overview strip + four
parallel activity-domain columns, replacing the previous 1-umbrella + 3
mixed-abstraction structure. Data + template only. No new routes, no
canonical or taxonomy changes.

## 1. Base

- Base SHA: `f116c222b2c3376bc95f99d6af7e60b4978de932` (origin/main HEAD at branch cut)
- Branch: `feat/megamenu-ia-01`
- Audit reference: `docs/megamenu-ia-01-work-navigation-audit-2026-09-06.md`
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (unchanged)
- Canonical Content v1 = unchanged
- OPETUS-IA-01, HOME-NAV-CORRECTION-01 invariants preserved

## 2. Before / after FI Työ mega-menu IA

**Before** (four sections + aside CTA card, in this order):

1. Yliopistotyö — Opetus, Esitykset, Opetusportfolio, Ansioluettelo, Opiskelijapalaute
2. Tutkimus — Väitöskirja, Julkaisuluettelo, Opinnäytetyöt
3. Yhteiskunnallinen vuorovaikutus — Lausunnot ja kannanotot, Mediassa
4. Täydennyskoulutukset (Larux t:mi) — Koulutuspalaute
5. CTA card: "Larux t:mi" / "Tutustu palveluihin" → `/kouluttaja/`

**After** (compact overview strip above four parallel columns):

Overview strip:
- Yliopistotyö → `/tyoni-yliopistonlehtorina/`
- Ansioluettelo → `/cv/`
- Palkinnot → `/palkinnot/`

Four columns (each column's first link IS its domain landing):

| OPETUS | TUTKIMUS | YHTEISKUNNALLINEN VUOROVAIKUTUS | TÄYDENNYSKOULUTUS |
|---|---|---|---|
| Opetus (`/opetus/`) | Tutkimus (`/tutkimus/`) | Yhteiskunnallinen vuorovaikutus (`/yhteiskunnallinen-vuorovaikutus/`) | Kouluttaja (`/kouluttaja/`) |
| Opetusportfolio (`/portfolio/`) | Julkaisuluettelo (`/julkaisut/`) | Lausunnot (`/lausunnot/#lausunnot`) | Koulutuspalaute (`/koulutuspalaute/`) |
| Opiskelijapalaute (`/opiskelijoiden-antamaa-palautetta/`) | Väitöskirja (`/vaitoskirja/`) | Mediassa (`/mediassa/`) | Esitykset / koulutusmateriaalit (`/esitykset/`) |
| Esitykset (`/esitykset/`) | Opinnäytetyöt (`/opinnaytteet/`) | | |

CTA card removed. Kouluttaja is now a first-class column link instead of a CTA button; the overview strip carries the profile-scoped CTAs.

## 3. Overview-strip semantics

- The three overview links describe the whole academic/professional profile: role, credentials, recognition.
- They are **not a fifth column**. Rendered as a compact horizontal chip row inside `.mega-wrap` above `.mega-left.four-cols` on desktop, and inside the mobile `<details>` block above the section grid on mobile.
- Data extension: new `overviewLinks: []` field on `megaMenuWork.fi` (and `.en`). Templates check for its presence and skip the render block when absent — backwards-compatible with any future absence.
- SSR only. No new JS. Bootstrap dropdown owns open/close. Keyboard focus and Escape are handled by the existing mega-dropdown primitive (`_nav-macros.njk:megaNavTrigger`).
- Reading order: overview strip → Opetus → Tutkimus → Yhteiskunnallinen vuorovaikutus → Täydennyskoulutus. Verified in the built HTML by string-index ordering.

## 4. Four-domain model

- Column headings are now parallel activity domains (Opetus / Tutkimus / Yhteiskunnallinen vuorovaikutus / Täydennyskoulutus) — same abstraction level, scannable side-by-side.
- Every column's first link is the domain landing. This gives users a real "open the whole thing" affordance without hunting through sub-topics.
- Column-heading link (`headingHref` on the section) is retained; the top link duplicates it inside the list. This double affordance is intentional — headings are visually distinct, list items carry descriptions.
- "Täydennyskoulutukset (Larux t:mi)" was renamed to "Täydennyskoulutus". The legal-entity name stays in body copy (e.g. Kouluttaja-link description "Larux t:mi:n kautta") — not in a heading.
- "Lausunnot ja kannanotot" was shortened to "Lausunnot" — the noun "kannanotot" is not modelled as a distinct content type in taxonomy.

## 5. Intentional Presentation duplication

`/esitykset/` appears twice inside the FI Työ mega-menu — once in the Opetus column and once in the Täydennyskoulutus column — with two distinct descriptions:

- Opetus context: "Luentoja ja opetusmateriaaleja julkisen esitysarkiston kautta."
- Täydennyskoulutus context: "Esityksiä ja asiantuntijasisältöjä, joita hyödynnän myös täydennyskoulutuksissa. Sama julkinen esitysarkisto."

This is an intentional contextual duplicate. It does **NOT**:

- create a new Presentation `context` in the canonical content model
- create a new Pagefind facet or metadata
- filter `/esitykset/` to a teaching-only or continuing-education-only subset
- add a new taxonomy term
- add a new route or redirect

The destination is the same canonical `/esitykset/` archive. The two descriptions communicate contextual relevance without redefining canonical membership. The Täydennyskoulutus-side description explicitly points to "Sama julkinen esitysarkisto" so a user reading both link descriptions understands the destination is identical.

## 6. FI/EN asymmetry

Deliberately preserved and documented in the audit:

- **FI**: full target IA (overview strip + four columns).
- **EN**: three columns retained (University Work / Research / Societal Engagement) with the existing aside CTA card ("Book me for a keynote"). **No fourth "Teaching" column, no `/en/opetus/`, no `/en/teaching/`.**
- **EN overview strip added** with three links: My Work as a University Lecturer (`/en/work/`), Curriculum Vitae (`/en/cv/`), Awards (`/en/awards/`). Awards was already published as `/en/awards/` but was previously absent from the EN Work mega-menu. This is a small copy/structure adjustment identified in the audit, not a new route.

FI/EN parity is semantic coherence (both share the same activity-domain naming for the shared domains) — **not structural identity**. Per OPETUS-IA-01 and HOME-NAV-CORRECTION-01 policy, no synthetic EN teaching surface was introduced.

## 7. Files changed

**Modified:**

- `src/_data/headerNav.js` — `megaMenuWork.fi` rewritten to overview-strip + four target sections; `megaMenuWork.en` gained `overviewLinks`; FI `cta` field removed; heading "Täydennyskoulutukset (Larux t:mi)" → "Täydennyskoulutus"; "Lausunnot ja kannanotot" → "Lausunnot".
- `src/_includes/_nav-fi.njk` — desktop four-columns branch renders `overviewLinks` above `.mega-left.four-cols`; mobile Työ `<details>` renders `overviewLinks` above the section grid.
- `src/_includes/_nav-en.njk` — desktop `else` branch renders `overviewLinks` above `.mega-left.three-cols`; mobile Work `<details>` renders `overviewLinks` above the section grid.
- `src/css/mega-menu.css` — new `.mega-overview-strip` / `.mega-overview-link` rules for the desktop chip row; new `.mobile-nav-overview-strip` / `.mobile-nav-overview-link` rules for mobile.

**New:**

- `tests/megamenu-ia-01.spec.js` — 17 regression tests across 8 groups (A–H).
- `docs/megamenu-ia-01-work-navigation-audit-2026-09-06.md` — the audit that authorized this slice (already on disk from audit-only phase; ships with this PR).
- `docs/megamenu-ia-01-closure-2026-09-06.md` — this file.

Estimated net diff: ~180 lines added (~90 data, ~35 templates, ~45 CSS, ~230 tests), ~50 lines removed (old FI section structure + CTA field).

## 8. Tests

New spec `tests/megamenu-ia-01.spec.js` — **17/17 green** across 8 groups (A–H):

- **A** (2): FI overview strip present with the three profile links; reading order precedes the four-column grid.
- **B** (6): exactly four sections in target order and headings; each column's first link is the domain landing; each column contains its expected supplementary links; no legacy "Lausunnot ja kannanotot" or "(Larux t:mi)" copy remains.
- **C** (2): `/esitykset/` appears twice inside the FI Työ panel; the two Esitykset links carry distinct contextual descriptions.
- **D** (1): FI Työ panel contains no accent CTA button and no "Tutustu palveluihin" copy.
- **E** (2): OPETUS-IA-01 invariant (`/opetus/` link in FI Työ) preserved; HOME-NAV-CORRECTION-01 invariant (no synthesized `/en/opetus/` or `/en/teaching/`) preserved.
- **F** (2): EN Work keeps exactly three data-driven columns; EN overview strip renders University Work / CV / Awards.
- **G** (1): no runtime JSON fetch triggered for the mega-menu.
- **H** (1): mobile Työ `<details>` renders the overview strip and exactly four section-cards.

Adjacent regression across `opetus-ia-01`, `home-nav-correction-01`, `navigation`, `pf5-g1-navbar-modular-ui`: **57 passed** in the batch.

Build: `CACHE_ONLY=true npx @11ty/eleventy` exit 0, `Copied 275 Wrote 1479 files`. Pagefind not touched.

## 9. Known pre-existing baseline failures (NOT caused by this branch)

- `tests/ux1b-fi-home-orientation-paths.spec.js:28` — asserts `toHaveCount(4)` on `.home-path-card` inside `[data-home-orientation-paths]`. The FI home has carried **5** tiles since HOME-NAV-CORRECTION-01 added the "Opetus" tile on 2026-09-06 (see `docs/home-nav-correction-01-closure-2026-09-06.md` §2 and §10). The spec was last touched by commit `8ae4e221` (before HOME-NAV-CORRECTION-01). This branch does not modify `src/index.njk`, `src/_data/pageContent/etusivu.json`, or anything under home-path-card rendering — the failure is pre-existing and out of scope for MEGAMENU-IA-01.

## 10. Deletion / simplification

- **Removed:** `megaMenuWork.fi.cta` object (title/description/href/label) — Kouluttaja is now a first-class link in the Täydennyskoulutus column; the aside CTA button became redundant.
- **Removed (copy):** "(Larux t:mi)" from the column heading; "kannanotot" from the statements link label.
- **Not removed in this slice** (per audit §16, deferred to a separate hygiene slice): the FI/EN hardcoded fallback branches in `_nav-fi.njk:133–166` and `_nav-en.njk:130–159`. These branches only fire if `workMegaMenu.sections` is falsy — currently dead code, but their removal is orthogonal to this IA slice.

No routes deleted. No canonical content touched. No Pagefind index change. No public JSON contract change.

## 11. Architecture Closure 1.0 impact

**Zero. AC1 remains CLOSED / GREEN / MAIN.**

Checked against `docs/architecture-closure-1-0-closure-2026-08-29.md` §6 reopen conditions:

- No new duplicate content ownership (the two Esitykset links resolve to the same canonical archive with two descriptions — no new content model).
- No canonical semantics moved to browser JS.
- Pagefind untouched.
- No runtime JSON → HTML architecture introduced.
- FI/EN parity: deliberate semantic asymmetries preserved and documented.
- No public contracts removed.
- No source / landing / context semantics regression.

This is a UX/navigation IA change, not an architecture change.

## 12. Final status

- **MEGAMENU-IA-01 = CLOSED / GREEN / READY FOR PR.**
- **Architecture Closure 1.0 = CLOSED / GREEN / MAIN.**
- **Canonical Content v1 = unchanged.**
- **OPETUS-IA-01 invariant preserved.**
- **HOME-NAV-CORRECTION-01 invariant preserved.**
- **DETAIL-UX-SEQUENCE-01 = CLOSED / DEFERRED / DOCUMENTED / MAIN.**
