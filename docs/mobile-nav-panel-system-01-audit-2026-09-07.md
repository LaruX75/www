# MOBILE-NAV-PANEL-SYSTEM-01 - Shared panel-system audit

Date: 2026-09-07
Baseline: `b946878a95175ebb59007718903855a251f368a3` (`origin/main`)
Mode: audit and bounded prototype only; no production PR.

## 1. Final decision

**MOBILE-NAV-PANEL-SYSTEM-01 = PARTIALLY SUITABLE / LIMITED SHARED SHELL RECOMMENDED.**

One interaction grammar is viable across mobile areas:

```text
root -> area panel -> optional sub-area panel -> destination
```

The depth is intentionally content-dependent. The system does not require a
universal mega-menu schema, a client-side navigation tree, or equivalent FI/EN
content. It requires a common panel header, back affordance, distinct landing
link, direct destination rows, and an optional next-panel row.

## 2. Why this refines the previous hybrid decision

`MOBILE-NAV-DRILLDOWN-01` correctly found that only FI Työ has an explicit
deep hierarchy (`sections[]` plus `headingHref`). The word "hybrid" must not
mean six unrelated mobile interaction models. This audit proves that the same
panel shell supports:

- **Työ:** a deep, real hierarchy;
- **Mediassa:** one shallow panel of direct routes;
- **Ota yhteyttä:** one shallow panel of actions.

The shared element is interaction grammar, not equal content depth.

## 3. Current root duplication

The current mobile offcanvas presents five feature-card entry points and a
separate six-item `<details>` stack. This duplicates area discovery and makes
the user predict whether a label opens a landing page or a disclosure. The
prototype root instead has one row per area. In the validation branch, only
Työ, Mediassa, and Ota yhteyttä open prototype panels; Minä, Politiikka, and
Kynästä intentionally remain ordinary landing links to avoid claiming that
their production mapping has been validated.

## 4. Menu depth model

| Area | Area panel content | Depth verdict |
| --- | --- | --- |
| Minä | Landing, overview/profile routes, small personal groups | Shallow direct routes; no confirmed sub-area need. |
| Työ FI | Landing, four real domain rows, then existing child links | Deep; the only current strong sub-area case. |
| Politiikka | Landing, grouped direct routes, spotlight as optional support | Shallow unless a real group landing is later evidenced. |
| Kynästä | Landing and direct editorial/archive groups | Shallow; editorial columns are not parent navigation. |
| Mediassa | Landing plus flattened existing direct routes | Shallow. |
| Ota yhteyttä | Landing plus email, phone, Zoom, social, and contact actions | Shallow action panel. |

The EN interaction may later match this grammar, but EN Work does not have
FI-style `headingHref` fields. No `/en/opetus/` or `/en/teaching/` route is
created or implied.

## 5. Prototype design and result

The FI-only audit prototype changes four implementation files and adds a
focused spec:

- `src/_includes/_nav-fi.njk` SSR-renders root, area, and Työ sub-area panels
  from existing `headerNav.js` objects.
- `src/js/site-ui.js` has one generic controller for active panel, return
  trigger, focus restoration, and root reset on `hidden.bs.offcanvas`.
- `src/css/mega-menu.css` provides the common panel header, rows, and 44 px
  targets.
- `tests/mobile-nav-panel-system-01.spec.js` covers SSR ownership and the
  interaction contract.

The controller does not create anchors, labels, URLs, groups, or navigation
data. It only changes `hidden`, moves focus to the active heading, and returns
focus to the exact opening row. Bootstrap continues to own the offcanvas
boundary and Escape; Escape consistently closes the offcanvas, and closing
resets the system to root.

Prototype evidence:

| Verification | Result |
| --- | --- |
| SSR routes and no navigation JSON request | Green |
| Root -> Työ -> Opetus -> Back focus restoration | Green |
| Shared shallow Media and Contact shells | Green |
| Close -> reopen root reset | Green |
| 320 x 700 no horizontal overflow | Green |
| 390 x 844 interaction path | Green |

Focused prototype suite: **5/5 passed**.

## 6. SSR and no-JS verdict

**SSR ownership: green.** All prototype anchors are rendered by Nunjucks from
the existing navigation data. The prototype adds no runtime JSON and no
client-generated HTML.

**No-JS: not made worse, but not solved.** The panels are SSR markup and are
visible in source order before enhancement. The existing Bootstrap mobile
offcanvas itself remains the known no-JS entry limitation. Fixing that broad
offcanvas fallback requires a separate accessibility/progressive-enhancement
workstream and is not silently folded into this prototype.

## 7. Accessibility verdict

The limited shared shell is accessible in principle and has a bounded contract:

- opening a panel focuses its heading;
- Back restores the exact row that opened the active panel;
- landing links are distinct from next-panel buttons;
- hidden panels leave keyboard and screen-reader order via `hidden`;
- closing and Escape use the existing offcanvas behavior and reset to root;
- controls are at least 44 px and retain existing focus, contrast, and
  reduced-motion foundations.

Before production, test keyboard-only use, high contrast, reduced motion,
zoom, 320 px, EN parity, and the existing search/language/mobileJumpLink
regressions. Do not add a custom focus trap; N1 evidence supports narrow focus
transitions only.

## 8. Deletion opportunities

A successful production rollout can replace, rather than layer over:

- the duplicate feature-card plus `<details>` root entry model;
- the six accordion wrappers and their accordion-only CSS;
- redundant mobile landing buttons that are superseded by one panel landing
  action;
- per-menu mobile orientation blocks that do not help a mobile decision.

The validation branch deliberately keeps old markup behind the enhanced shell
so it can compare safely. That duplication is acceptable only in this audit
prototype and must not ship unchanged.

## 9. Complexity and benefit

Benefit is material: one predictable root makes it clear which rows navigate
and which reveal a next decision level. Työ reduces a simultaneous four-domain
link wall while Media and Contact avoid artificial depth.

Complexity is moderate: the shared controller is small, but a production
slice must replace each old root entry with parity-proven panel rendering and
must retain all real URLs, external semantics, counts where useful, language
switching, search, theme, desktop mega menus, and `mobileJumpLink`.

## 10. Recommended first production slice

**MOBILE-NAV-PANEL-SYSTEM-01A - FI shared root plus three validated areas.**

Scope:

```text
root: all six areas
implemented panels: Työ, Mediassa, Ota yhteyttä
Työ sub-panels: Opetus, Tutkimus, Yhteiskunnallinen vuorovaikutus,
Täydennyskoulutus
```

It must replace the prototype's duplicated root/accordion presentation, not
keep it. It should use the same `headerNav.js` source, Nunjucks-rendered
anchors, interaction-only JS, and no new route or taxonomy. Minä, Politiikka,
Kynästä, and EN remain separate follow-up decisions after parity mapping.

Required future tests: SSR all URLs/no runtime JSON; panel forward/back/Escape
and focus restoration; close/reopen reset; direct action links; 320 and 390;
desktop unchanged; language switch; global search; `mobileJumpLink`; high
contrast and reduced motion.

## 11. Architecture status

Canonical Content v1: **UNCHANGED**
Navigation data ownership: **UNCHANGED; one SSR source confirmed**
Pagefind: **UNCHANGED**
Public JSON: **UNCHANGED**
Runtime JSON: **UNCHANGED**
AC1: **CLOSED / GREEN / MAIN**

This audit stops after the prototype. It opens no production implementation PR
and does not redesign desktop navigation.
