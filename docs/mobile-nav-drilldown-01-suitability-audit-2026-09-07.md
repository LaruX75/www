# MOBILE-NAV-DRILLDOWN-01 - Suitability audit

Date: 2026-09-07
Baseline: `b946878a95175ebb59007718903855a251f368a3` (`origin/main`)
Mode: audit only; no production navigation change and no prototype.

## 1. Decision

**MOBILE-NAV-DRILLDOWN-01 = PARTIALLY SUITABLE / HYBRID RECOMMENDED.**

The Finnish **Työ** menu is a strong fit for one bounded progressive-enhancement
slice. Its four real activity domains are already canonical navigation data:
`workMegaMenu.fi.sections[]` has a human heading, a `headingHref`, and its
existing destination links. A mobile level can therefore be rendered by
Nunjucks from the same data used by desktop; JavaScript would only select a
visible level and manage focus.

The other five menus must not be forced into the same interaction. Their
groups are often presentation groupings, compact link groups, contact actions,
or editorial supporting content rather than stable navigable parent levels.

## 2. Baseline and boundaries

The audit started on the current `origin/main` above. The governing ownership
contract remains:

```text
headerNav.js -> Nunjucks -> SSR navigation HTML -> interaction-only JavaScript
```

No evidence shows browser-generated navigation semantics, a runtime navigation
JSON request, or a competing navigation data owner. This is a mobile UX and
interaction opportunity, not an Architecture Closure 1.0 reopening condition.

Relevant evidence read:

- `docs/architecture-closure-1-0-closure-2026-08-29.md`
- `docs/ui-ux-playbook.md`
- `docs/megamenu-system-01-sitewide-navigation-language-audit-2026-09-06.md`
- `docs/megamenu-ia-01-work-navigation-audit-2026-09-06.md`
- `docs/megamenu-ia-01-closure-2026-09-06.md`
- `docs/home-nav-correction-01-closure-2026-09-06.md`
- `docs/n1-navigation-accessibility-audit-2026-08-21.md`
- `docs/native-html-primitives-suitability-audit-2026-08-22.md`

## 3. Current mobile architecture

### Shared and deterministic SSR content

`src/_data/headerNav.js` owns the top-level links and the six menu data
objects. Both `src/_includes/_nav-fi.njk` and `_nav-en.njk` render the desktop
mega menus and a mobile Bootstrap offcanvas from that source. The mobile
offcanvas contains:

- header, search fallback form, language switcher, and theme button;
- five direct feature cards: home, work, politics, writings, media;
- six `<details class="mobile-nav-card">` sections: Me/Minä, Work/Työ,
  Politics/Politiikka, Writings/Kynästä, Media/Mediassa, and Contact/Ota
  yhteyttä;
- explicit parent landing-page links such as `Avaa Työ-sivu`;
- existing grouped links, counts, external-link semantics, and mobile overview
  strips.

All of that markup is deterministic at build time. Mobile and desktop are
separate renderers, which is template duplication but not duplicate semantic
ownership: both read `headerNav.js`.

### Mobile-specific interaction and presentation

- Bootstrap owns offcanvas opening, closing, focus containment, backdrop, and
  Escape at the offcanvas level.
- Native `<details>` owns each current accordion's open state. There is no
  mobile drill-down state or mobile navigation model in `site-ui.js`.
- `src/css/mega-menu.css` provides the 430 px max-width panel, 44 px controls,
  five-card feature grid, and the detail-card treatment. Kynästä is rendered
  `open` by default.
- `mobileJumpLink` is deterministic SSR desktop-mega-menu markup exposed only
  by the mobile media query. It is not a browser-built link and must remain
  correct if future work replaces only the offcanvas interaction.

## 4. Current FI and EN flows

At 390 x 844, the first decision is split between five direct feature cards
and the detailed accordion stack below them. A user can reach a top-level
landing directly in two actions (open menu, choose a feature card). To reach a
grouped destination through the current detail card, the path is three
actions: open menu, open the `<details>` card, choose a destination link.

For FI Työ, opening the card reveals three overview links plus four groups and
their 14 child-link occurrences. The user sees all of those choices in one
long expanding document region, not one decision level. The parent landing is
available as a clear `Avaa Työ-sivu` link, but group identity and the next
choice compete with all siblings. The same general long-link-wall risk occurs
when the default-open Kynästä card is reached.

Representative current paths:

| Path | Current route | Current interaction observation |
| --- | --- | --- |
| FI Työ -> Opetus | `/opetus/` | Open menu -> open Työ details -> first Opetus link; parent landing is separately present. |
| FI Työ -> Tutkimus | `/tutkimus/` | Same pattern; all four domain groups remain simultaneously visible. |
| FI Työ -> Täydennyskoulutus | `/kouluttaja/` | Same pattern; the lower group requires reading/scanning through earlier groups. |
| FI Kynästä -> Valtuustotyö | `/valtuustotyo/` | One details panel contains editorial columns, counts, and related links; its headings are not stable landing parents. |
| FI Minä -> CV | `/cv/` | Available from the overview strip as well as contextual routes; no material hierarchy problem. |
| FI Mediassa -> all appearances | `/mediassa/#media-arkisto` | A compact direct route; another level would add a tap without resolving ambiguity. |
| FI Contact -> action | mail, phone, Zoom, or contact page | A task/action chooser, not a destination hierarchy. |
| EN Work equivalent | real `/en/work/`, `/en/research/`, etc. | Three real groups exist, but none has FI-style `headingHref`; do not invent an EN teaching parent. |

The actual choices differ by locale intentionally. FI's `/opetus/` remains
FI-only; the audit found no `/en/opetus/` or `/en/teaching/` route and does not
recommend creating either.

## 5. Data-shape feasibility

| Menu | Existing data shape | Drill-down suitability | Reason |
| --- | --- | --- | --- |
| Minä | `overviewLinks`, `sections`, showcase | C. Partial / hybrid | Two small groups and a showcase can remain an accordion; a new level adds little over direct overview links. |
| Työ (FI) | `overviewLinks`, four `sections`, `headingHref`, children | A. Strong fit | The four headings are real destination parents with canonical landing URLs and ordered child links. |
| Työ (EN) | `overviewLinks`, three `sections`, children | B. Possible with existing data | Interaction can match FI, but section headings have no explicit landing ownership. Start FI-only instead of inferring one. |
| Politiikka | description, spotlight, sections, counts | C. Partial / hybrid | Some grouped routes fit, but the spotlight is supporting content and section headings are not landing pages. |
| Kynästä | description, `groupHeading`, `contentColumns`, `seeAlso` | D. Poor fit | Editorial columns and count-bearing archive routes are not a reliable parent/child hierarchy. |
| Mediassa | description and three compact sections | D. Poor fit | Each group is a small direct route set; a level change adds a tap with little decision-load benefit. |
| Ota yhteyttä | description and action-oriented `columns` | E. Not suitable | Email, phone, Zoom, external social links, and form access are immediate actions, not a drill-down taxonomy. |

## 6. SSR, no-JS, and ownership verdict

**SSR ownership: suitable.** A future Työ renderer can render root, level 1,
and level 2 links from `headerNav.js` in HTML. It must not add `mobileNav.js`,
copy the data object, derive labels/URLs in JavaScript, or fetch JSON.

**No-JS: current baseline is incomplete.** Although all link markup exists in
the server response, the current mobile entry button relies on Bootstrap
offcanvas JavaScript. At a mobile breakpoint, a JS-free user cannot open that
offcanvas. This is an existing progressive-enhancement gap, not evidence that
navigation semantics are client-owned.

Any implementation must explicitly improve or preserve a credible fallback:

1. SSR renders all Työ links and semantic groups in source order.
2. Without enhancement, those groups must remain available as expanded/native
   disclosure content through an accessible mobile entry path.
3. With JavaScript, only the visual active panel changes; hidden panels must
   be non-focusable and no link HTML is constructed in the browser.

A second Nunjucks renderer is acceptable if it consumes the same objects. A
second JavaScript navigation tree is a no-go.

## 7. Accessibility and interaction requirements

The existing offcanvas already establishes the modal boundary. A drill-down
inside it needs a smaller, explicit state contract:

- entering Työ moves focus to the panel heading or a labelled back control;
- `Back` returns focus to the exact row that opened the panel;
- the distinct `Avaa Työ-sivu` action remains a normal link, separate from the
  disclosure row;
- Escape closes the active offcanvas rather than ambiguously changing levels,
  unless a future prototype proves a level-first rule clearer and testable;
- offcanvas close clears its active-level state; reopening starts at root;
- hidden levels use `hidden`/`inert`-equivalent semantics so their links are
  not in the keyboard or screen-reader order;
- headings, visible focus, 44 px targets, high contrast, reduced motion, zoom,
  320 px width, and `aria-current` remain covered.

The N1 evidence is a warning against introducing a broad custom focus trap.
Use native tab order inside the Bootstrap offcanvas and write only narrowly
scoped focus transitions/restoration for the level change.

## 8. Accordion versus drill-down

| Criterion | Current details accordion | FI Työ drill-down candidate |
| --- | --- | --- |
| First meaningful choice | Top feature card offers landing; grouped task begins lower in stack | Työ row becomes the first explicit area choice. |
| Simultaneously visible choices | Four groups and all children become one link wall when open | One level exposes four domains; one chosen domain exposes only its links. |
| Taps to `/opetus/` | 3: menu, open Työ, choose Opetus | 3: menu, Työ, Opetus landing; equal taps but lower cognitive load. |
| Parent landing | Clear separate button, but competes with all links | Clear separate `Avaa Työ-sivu` action at level 1. |
| Back/orientation | Native close, but no level concept | Must be introduced explicitly and focus-tested. |
| Risk | Low, current native disclosure | Moderate, but bounded because the data hierarchy is explicit. |

The benefit is not a cleaner visual alone: it is the reduction from a
simultaneous four-domain, 14-link choice wall to a single four-domain decision
level. That benefit is material only for FI Työ at this point.

## 9. Deletion opportunities and limits

No code was deleted in this audit. If a successful FI Työ implementation
replaces the current card rather than layering over it, likely deletions are:

- one mobile Työ `<details>` wrapper and its accordion-only selector;
- its mobile overview-strip presentation if the first panel makes the landing
  and contextual profile links clearer elsewhere;
- a small amount of mobile-only card CSS.

Do not promise large deletion: the offcanvas, other five detail cards,
desktop mega menu, `mobileJumpLink`, and Bootstrap offcanvas glue remain in
scope for their current responsibilities.

## 10. Recommended bounded follow-up

**Candidate: MOBILE-NAV-DRILLDOWN-01A - FI Työ only.**

Scope:

```text
Root -> Työ
Työ -> Opetus / Tutkimus / Yhteiskunnallinen vuorovaikutus / Täydennyskoulutus
Chosen domain -> existing canonical links
```

Constraints and estimate:

| Area | Expected bounded change |
| --- | --- |
| Data | 0 LOC; use `headerNav.js` as-is. |
| Templates | One FI mobile Työ renderer, approximately 70-110 LOC, ideally extracted into a shared macro only if that reduces rather than increases duplication. |
| JavaScript | Approximately 80-130 LOC for interaction state, focus movement, reset, and Escape coordination. No link creation. |
| CSS | Approximately 80-140 LOC for panels, row controls, and reduced-motion-safe transitions; delete the replaced Työ accordion styles. |
| Tests | SSR links/no runtime JSON; forward/back/Escape/reset/focus restoration; 320 and 390 px; no-JS fallback; desktop regression; mobileJumpLink regression. |
| Accessibility risk | Moderate and reviewable because one panel family is changed. |
| Rollback | Simple: restore the current one-card Työ `<details>` renderer and remove interaction classes/handler. |

Do not include EN in 01A. The FI implementation should first prove the
interaction against the only menu with explicit group landing URLs. An EN
follow-up may use the same interaction only after separately deciding whether
its existing section fields express enough landing semantics.

## 11. Verification performed

- `npm run build:local` completed: Eleventy copied 275 and wrote 1,481 files;
  Research.fi integrity check passed.
- Existing mega-menu and mobile SSR coverage was run. The combined suite
  yielded 34 passing tests. Three `navigation.spec.js` search-dialog tests
  could not mount `#siteSearchNavInput` because `build:local` intentionally
  does not generate Pagefind postbuild assets. This is unrelated to mobile
  navigation markup and is not treated as a drill-down regression.
- Existing tests specifically assert FI Työ's four mobile section cards,
  overview links, SSR link presence, no runtime nav JSON, and preservation of
  no synthetic EN teaching routes.

## 12. Architecture status

Canonical Content v1: **UNCHANGED**
Navigation data ownership: **UNCHANGED; one SSR owner confirmed**
Pagefind: **UNCHANGED**
Public JSON: **UNCHANGED**
Runtime JSON: **UNCHANGED**
Runtime JS: **UNCHANGED in this audit**
AC1: **CLOSED / GREEN / MAIN**

This audit stops here. It opens no implementation PR and does not alter the
desktop mega menu, route taxonomy, FI/EN content parity, or navigation data.
