# MEGAMENU-SYSTEM-01 — Site-wide mega-menu design-language audit (2026-09-06)

Audit-only. No production changes.

## 1. Repo / branch baseline

- Working directory: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Current branch: **`feat/megamenu-ia-01`** (this branch is the audit basis for the Työ mega-menu)
- HEAD: `a69d7e486eb15a6432c92830ef5738ffc30c51b8`
- origin/main: `f116c222b2c3376bc95f99d6af7e60b4978de932`
- `git status`: only `.cache/api-fallback/*.json` modifications; **no navigation files locally modified beyond the committed PR #220 diff.**
- Docs reviewed on branch: `docs/architecture-closure-1-0-closure-2026-08-29.md`, `docs/megamenu-ia-01-work-navigation-audit-2026-09-06.md`, `docs/megamenu-ia-01-closure-2026-09-06.md`, `docs/home-nav-correction-01-closure-2026-09-06.md`, `docs/opetus-ia-01-closure-2026-09-05.md`, `docs/n1-navigation-accessibility-audit-2026-08-21.md`, and adjacent workstream docs.

## 2. MEGAMENU-IA-01 (PR #220) status

`gh pr view 220`:

- `state`: **OPEN**
- `mergeStateStatus`: **CLEAN**
- `headRefName`: `feat/megamenu-ia-01`
- `headRefOid`: `a69d7e486eb15a6432c92830ef5738ffc30c51b8`
- `baseRefName`: `main`

PR #220 is **not merged**. Per user directive, this audit treats the branch state (`feat/megamenu-ia-01` at `a69d7e48`) as the authoritative current state of the Työ mega-menu. Old main's Työ structure is not used as reference. The PR branch is not modified during this audit.

## 3. Current mega-menu rendering architecture

### Data — `src/_data/headerNav.js` (1284 lines)

Six mega-menu data objects, each with independent shape:

| Menu | Object | Signature fields |
|---|---|---|
| Minä | `megaMenuMe.{fi,en}` | `sections[]` + `showcase{}` |
| Työ | `megaMenuWork.{fi,en}` | `overviewLinks[]` (post-IA-01) + `sections[]` + optional `layout` + optional `cta` (EN only) |
| Politiikka | `megaMenuPolitics.{fi,en}` | `description` + `spotlight{}` + `sections[]` |
| Kynästä | `megaMenuWritings.{fi,en}` | `heading` + `description` + `groupHeading` + `contentColumns[]` + optional `seeAlso{}` |
| Mediassa | `megaMenuMedia.{fi,en}` | `heading` + `description` + `sections[]` |
| Ota yhteyttä | `megaMenuContact.{fi,en}` | `heading` + `description` + `layout` + `columns[]` (with `type: "links"` \| `"form"`) |

**No single shared schema.** Every menu has evolved its own vocabulary as it was added.

### Templates — `src/_includes/_nav-fi.njk` (735 lines) + `src/_includes/_nav-en.njk` (704 lines)

Each mega-menu has its own inline `<div class="dropdown-menu mega-menu-panel">` render block. Shared building blocks:

- `_nav-macros.njk`:
  - `megaNavTrigger(url, title, icon, isActive, menuId, toggleId, openLabel)` — the disclosure trigger
  - `mobileJumpLink(url, title, jumpPrefix)` — mobile-only "jump to top-level page"
- CSS layout primitives (from `src/css/mega-menu.css`):
  - `.mega-wrap` — universal panel container
  - `.mega-left.three-cols` / `.four-cols` — grouped-route grid
  - `.grid-8-4` — grid split for `mega-left` + `mega-right` aside (3fr / 1fr)
  - `.mega-right.showcase-card` / `.cta-card` — aside variants
  - `.menu-link` + `.menu-link-desc` + `.menu-link-with-count` + `.menu-link-count`
  - `.mega-section-heading-link` — heading-as-link
- CSS per-menu primitives:
  - `.writings-mega-layout` / `.writings-group-head` / `.writings-main-col` / `.writings-side-col` — Kynästä only
  - `.contact-mega-cols` / `.contact-mega-form` — Ota yhteyttä only
  - `.mega-role-list` — Politiikka spotlight only
  - `.mega-overview-strip` / `.mega-overview-link` — Työ + EN Work (MEGAMENU-IA-01)
  - `.work-inline-cta` — Työ (dead in FI post-IA-01; still used by any menu with `link.cta`)

### Mobile — offcanvas in each nav template

Each locale has a single `<div class="offcanvas ... mobile-nav-panel">` block with:

- `.mobile-nav-feature-grid` — the 5 top-level primary links (rendered manually, hardcoded)
- `.mobile-nav-card-stack` — one `<details>` per top-level menu (Minä, Työ, Politiikka, Kynästä, Mediassa, Ota yhteyttä)

Each `<details>` iterates over the same data object as its desktop counterpart. Työ's `<details>` gained an overview-strip render in MEGAMENU-IA-01. Other menus have no overview-strip primitive on mobile.

## 4. Current FI menu inventory

### 4.1 Minä (`megaMenuMe.fi`)

Renderer: `_nav-fi.njk:17–58` — `grid-8-4` + `three-cols` + `mega-right showcase-card` aside.

Sections (3):

1. **Jari lyhyesti** — `Tietoa minusta` (`/tietoa/`), `Ansioluettelo` (`/cv/`), `Palkinnot` (`/palkinnot/`)
2. **Vapaa-aika** — `Autolomat` (`/autolomat/`), `Kulinaristi` (Instagram external), `Hartiapankkiremontoija` (Instagram external)
3. **Roolini** — `Poliitikko` (`/politiikka/`), `Yrittäjä` (`/kouluttaja/`)

Aside: `showcase` — portrait image, title "Jari Laru", description "Isä, kulinaristi ja automatkailija – kun ei olla töissä.", CTA "Ota yhteyttä" → `/yhteystiedot/`.

### 4.2 Työ (`megaMenuWork.fi`, post-MEGAMENU-IA-01)

Renderer: `_nav-fi.njk:60–169` — `four-columns` layout branch, overview-strip above `.mega-left.four-cols`.

Overview strip: `Yliopistotyö`, `Ansioluettelo`, `Palkinnot`.

Sections (4): `Opetus`, `Tutkimus`, `Yhteiskunnallinen vuorovaikutus`, `Täydennyskoulutus`.

CTA aside: **removed** (each column's first link is the domain landing; Kouluttaja is a first-class link in the Täydennyskoulutus column).

### 4.3 Politiikka (`megaMenuPolitics.fi`)

Renderer: `_nav-fi.njk:181–222` — `mega-wrap grid-8-4` (conditional on spotlight) + `three-cols` + `mega-right cta-card` with role list.

Description: "Poliittinen profiili, kaupunginvaltuuston kokoukset, vaalikaudet ja avoimuustiedot samasta näkymästä."

Aside: `spotlight`

- title: "Poliittisen työn kokonaiskuva"
- description
- roles[]: 3 roles (varavaltuutettu, sivistyslautakunta, aluevaltuusto varajäsen)
- cta: → `/politiikka/`

Sections (3):

1. **Politiikan pääreitit** — Kaupunginvaltuusto, Sivistyslautakunta, Vaalikaudet
2. **Päälinjat** — Sivistys ja koulutus, Kampus/Raksila/Linnanmaa, Palveluverkko, Avoin valmistelu
3. **Aineistot ja läpinäkyvyys** — Valtuustopuheenvuorot, Valtuustoaloitteet, Sidonnaisuudet

### 4.4 Kynästä (`megaMenuWritings.fi`)

Renderer: `_nav-fi.njk:226–342` — special `writings-mega-layout` with `writings-group-head` (full-width) + N × `writings-main-col`.

Full-width `groupHead` section: heading "Kirjoitukset, puheet ja kannanotot" + description.

contentColumns (3):

1. **Kirjoitukset** — Kirjoitukset koontisivu, Blogi, Kolumnit, Mielipidekirjoitukset
2. **Valtuustotyö** — Valtuustotyö koontisivu, Puheenvuorot, Aloitteet
3. **Lausunnot ja julkiset puheet** — koontisivu, Lausunnot, Julkiset puheet, Teemaprofiilit

Optional `seeAlso` panel — **not populated** in FI.

Every link carries a `countKey` or `countData` and renders a numeric badge.

### 4.5 Mediassa (`megaMenuMedia.fi`)

Renderer: `_nav-fi.njk:347–367` — `mega-wrap` with header `<section class="w-100 mb-3">` + `.mega-left.three-cols`.

Full-width intro: heading "Mediassa" + description.

Sections (3):

1. **Aloita tästä** — Mediassa-sivu, Nostot, Kaikki mediaosumat
2. **Sisältötyypit** — Lehtijutut, Podcastit, Videot (filter URLs)
3. **Liittyvät sivut** — Yhteiskunnallinen vuorovaikutus, Kynästä, Esitykset

### 4.6 Ota yhteyttä (`megaMenuContact.fi`)

Renderer: `_nav-fi.njk:371–411` — `mega-wrap` with full-width intro + `.mega-left.three-cols.contact-mega-cols`.

Full-width intro: heading "Ota yhteyttä" + description.

Three columns by role: **Yliopisto & tutkimus**, **Koulutukset & puheenvuorot**, **Politiikka & julkisuus**.

## 5. Current EN menu inventory

Semantic-mirror model where content supports it; deliberate asymmetries preserved.

| Menu | EN shape |
|---|---|
| Me | `sections[]` (3) + `showcase{}` — parallel to FI |
| Work | `overviewLinks[]` (3) + `sections[]` (3) + `cta{}` — three columns retained (no Teaching column), overview strip added in MEGAMENU-IA-01 (adds Awards) |
| Politics | `description` + `spotlight{}` + `sections[]` (3) — parallel to FI |
| Writings | `heading` + `description` + `groupHeading` + `contentColumns[]` (3) — no `seeAlso` |
| Media | `heading` + `description` + `sections[]` (3) — parallel to FI |
| Contact | `heading` + `description` + `layout` + `columns[]` (3) — parallel to FI |

## 6. Shared structural patterns already in use

Extracted from the six menus, every mega-menu today has **some form of orientation layer**, but they are all **different primitives**:

| Menu | Orientation primitive (current) | Grouped-route primitive | CTA/aside |
|---|---|---|---|
| Minä | showcase aside (image + description + CTA) | 3 sections | showcase CTA button |
| Työ | `overviewLinks` chip strip (new) | 4 sections | removed |
| Politiikka | `spotlight` aside (title + description + roles[] + CTA) | 3 sections | via spotlight CTA |
| Kynästä | `writings-group-head` (heading + description, full-width top) | 3 contentColumns | none |
| Mediassa | full-width heading + description + `Aloita tästä` section | 3 sections | none |
| Ota yhteyttä | full-width heading + description | 3 columns (by role) | inline form + button |

So the **conceptual shared pattern already exists** — orientation → grouped routes → optional CTA — but is expressed differently per menu and stored under different field names.

## 7. Minä assessment

**Current problem** (semantically identical to the pre-IA-01 Työ problem):

- "Jari lyhyesti" is the first column heading but its links (`Tietoa minusta`, `Ansioluettelo`, `Palkinnot`) are **cross-cutting profile links**, not a peer domain to "Vapaa-aika" and "Roolini".
- This makes column-1 conceptually different from columns 2 and 3 — the same asymmetry MEGAMENU-IA-01 fixed for Työ.
- CV and Awards already appear in Työ's overview strip. Retaining them in a *column* on Minä works, but promoting them to a Minä overview strip would (a) make Minä structurally consistent with Työ and (b) leave columns 2–3 (Vapaa-aika, Roolini) as parallel personal-dimension groups.

**Showcase** — a strong humanizing element. It is not a "call to action" as much as a portrait card with an incidental CTA. Two viable models:

- **A (preferred)**: keep the showcase aside as-is; add `overviewLinks` above the columns (or above the section grid). Overview + showcase coexist as distinct orientation elements (compact profile links + humanizing portrait).
- **B**: fold the showcase into a broader orientation block, replacing image + CTA with an overview-only strip. Loses the portrait — likely worse.

Recommendation: **A**. This is a bounded IA improvement that mirrors MEGAMENU-IA-01.

**Duplicates**: `Ansioluettelo` (Minä + Työ overview), `Palkinnot` (Minä + Työ overview), `Poliitikko` → `/politiikka/` (Minä + top-level nav), `Yrittäjä` → `/kouluttaja/` (Minä + Työ Täydennyskoulutus). Per audit rules, all are **useful contextual duplicates**. Keep.

Classification: **IA IMPROVEMENT OPPORTUNITY** (bounded, single slice).

## 8. Työ reference model

Already at target per MEGAMENU-IA-01. See `docs/megamenu-ia-01-closure-2026-09-06.md`.

Classification: **GOOD AS-IS** (until PR #220 merges — do not modify on this branch).

## 9. Politiikka assessment

Already close to the target model:

- `spotlight` **is** the orientation layer (equivalent to `overviewLinks`, richer — includes role list + CTA).
- Three sections at parallel abstraction level (routes / topics / materials).
- Every heading has `headingHref`; every link has a description.
- Data is well-structured (`countKey` on materials).

Minor observations:

- The `Päälinjat` section (4 themes with individual URLs) may over-index the menu: it is denser than the other two sections. The rendering handles it; not a defect.
- Spotlight and overviewLinks are two different orientation primitives. Politics' spotlight is deliberately richer (role list); this is content-justified.
- Political links are not duplicated across mega-menus in ways that harm scanability.

Classification: **GOOD AS-IS**. No IA change needed. Only shared-primitive convergence (Question 6) would touch this menu, and even then only in a future refactor slice.

## 10. Kynästä assessment

Already strong on content-type grouping:

- `writings-group-head` acts as an orientation layer (full-width intro + description).
- `contentColumns` are semantically parallel content-type groups (Kirjoitukset / Valtuustotyö / Lausunnot ja julkiset puheet).
- Every link renders a count badge (real user value — signals corpus size).
- `seeAlso` schema exists but is unused on FI — safe dormant field.

The `else` fallback branch in the template (`_nav-fi.njk:332–340`) renders `writingsMegaMenu.links` — dead code since every current data instance provides `contentColumns`.

Classification: **GOOD AS-IS**. No IA change needed. Cleanup opportunities are template-only (see §17).

## 11. Mediassa assessment

Three-section model is already parallel:

- "Aloita tästä" — orientation-oriented three links (hub + highlights + full archive)
- "Sisältötyypit" — content-type filters
- "Liittyvät sivut" — cross-domain related pages

Full-width intro renders heading + description.

Assessment of the "Aloita tästä" section:

- It behaves like an orientation strip already, but is rendered as an equal-weight column.
- Two viable models:
  - **A (preferred, no change)**: keep as-is. The three sections read as three genuinely parallel user tasks. "Aloita tästä" is fine as an oriented first column and works well on mobile.
  - **B**: promote "Aloita tästä" into an `overviewLinks` chip strip and drop the section. Would leave only 2 columns (types + related), which risks visual sparseness on wide viewports and reads slightly weaker.

Classification: **GOOD AS-IS**. Media architecture is CLOSED / maintenance per AC1 — no reason to reopen. The current three-section model is well-motivated.

## 12. Desktop / mobile relationship

Reading order per menu:

| Menu | Desktop order | Mobile `<details>` order |
|---|---|---|
| Minä | showcase-aside is right of columns; column order = source order | primary-link → sections grid (no showcase) |
| Työ | overview strip → 4 columns (no aside) | primary-link → **overview strip** → sections grid |
| Politiikka | 3 columns + right-side spotlight aside | primary-link → **spotlight card (accent)** → sections grid |
| Kynästä | group-head (full-width) → contentColumns | primary-link → note → sections grid (contentColumns become section cards) |
| Mediassa | intro (full-width) → 3 columns | primary-link → note → **hardcoded Aloita/Sisältötyypit cards** (does NOT iterate mediaMegaMenu.sections) |
| Ota yhteyttä | intro (full-width) → 3 role columns | primary-link → columns grid |

**Findings:**

1. **Mediassa mobile drift.** The mobile `<details>` for Mediassa in `_nav-fi.njk:641–666` renders hardcoded links (Kolme reittiä, Nostot, Kaikki mediaosumat, Lehtijutut, Podcastit, Videot) that partially reflect the data but do not iterate `mediaMegaMenu.sections`. This is legitimate duplication debt — mobile has custom copy divergent from desktop data. Not a defect that breaks reading order, but P2 hygiene.
2. **Mobile Feature Grid** (5 top-level cards at the top of the offcanvas panel) is fully hardcoded, not data-driven. This is consistent with a fast-access affordance, but it means Mediassa is only wired through the feature grid + hardcoded details; no `mediaMegaMenu` mobile pass exists.
3. **Overview-strip mobile parity:** only Työ implements it on mobile (added in MEGAMENU-IA-01). If Minä gains an overview strip, the mobile Minä `<details>` needs the same treatment.

## 13. Accessibility

Building on N1 (CLOSED / GREEN / MAIN) findings, current state relevant to MEGAMENU-SYSTEM-01:

- Dropdown triggers use `_nav-macros.njk:megaNavTrigger` — a shared macro with `aria-haspopup`, `aria-controls`, `aria-expanded` (Bootstrap-managed), and a `<span class="visually-hidden">{{ openLabel }} {{ title }}</span>`. Focus and Escape behavior owned by Bootstrap dropdown.
- Each panel has `aria-labelledby="megaToggle..."`.
- Overview strip in Työ uses `<nav aria-label="Työn yleiskatsaus">` — labeled without an `<h5>` to avoid competing with column headings. Good.
- Column headings (`<h5>`) are consistent per menu. Kynästä's `writings-group-head` uses `<h5>` for the top intro — fine because the columns also use `<h5>` at the same level; the intro reads first.
- Menu-link icons are decorative (font icons) rendered adjacent to text. Accessible name = link text. Consistent.
- Duplicate accessible names across menus: **Ansioluettelo** appears in Minä and Työ overview; **Palkinnot** same. Both surface in one distinct context (Minä vs. Työ trigger button), so they are naturally disambiguated by the trigger label. Descriptions add further disambiguation.
- Touch targets: `.menu-link` reaches Bootstrap's 44 px minimum through padding; `.mega-overview-link` uses 0.35rem × 0.7rem chip padding — visually correct but the flat chip height is smaller than 44 px on desktop; usability is fine because it's a mouse-first target. Mobile overview strip uses 40 px min-height explicitly. **No accessibility regression.**

## 14. FI / EN asymmetries

Deliberate:

- **Työ**: EN 3 columns / FI 4 columns; no synthetic `/en/opetus/` (OPETUS-IA-01, HOME-NAV-CORRECTION-01).
- **Työ CTA**: EN retains `cta` ("Book me for a keynote"); FI removed (MEGAMENU-IA-01). Consistent with EN's absent Täydennyskoulutus column — the CTA carries training/keynote intent instead.

Accidental / candidate for cleanup:

- **Kynästä**: FI has `Teemaprofiilit` in "Lausunnot" column; EN has no equivalent link even though `/teemat/` exists as a FI-only route. This is an acceptable FI-only route (no `/en/themes/`) — semantic parity, not identity.
- **Kynästä**: FI omits `Kirjoitukset koontisivu` on EN. EN sections have no `headingHref`. Minor gap, not blocking.
- **Ota yhteyttä**: FI + EN structures are near-parallel. Contact-mega-form is a shared future extension surface (`type: "form"`) not currently used in data.

No new synthesized routes recommended for any menu.

## 15. CTA inventory

| Menu | CTA element(s) | Verdict |
|---|---|---|
| Minä.fi | showcase CTA → `/yhteystiedot/` | **A — keep**: true user task (contact) not covered by any Minä column route |
| Minä.en | showcase CTA → `/en/contact/` | **A — keep** |
| Työ.fi | none (post-IA-01) | **B — removed already** |
| Työ.en | aside CTA → `/en/contact/` ("Book me for a keynote") | **A — keep**: EN has no Täydennyskoulutus column; CTA carries intent |
| Politiikka.fi | spotlight CTA → `/politiikka/` | **C — orientation content already**: CTA is the same as the trigger; harmless but low signal — see below |
| Politiikka.en | spotlight CTA → `/en/politics/` | Same as FI |
| Kynästä.fi | none | — |
| Kynästä.en | none | — |
| Mediassa.fi | none | — |
| Mediassa.en | none | — |
| Ota yhteyttä.fi | form column with submit button | **E — special domain feature**: preserve |
| Ota yhteyttä.en | form column with submit button | **E — special domain feature**: preserve |

Politiikka spotlight CTA points to the same URL as the Politiikka trigger (`/politiikka/`), which the dropdown wraps around. Technically redundant with the trigger anchor, but users benefit from a large touch target inside the panel. **Keep as-is.**

**No CTA changes recommended in this slice.**

## 16. Template / data duplication

Classified per audit rule set.

### A. Beneficial explicit domain difference

- Politiikka spotlight is richer (roles list) than Työ overview strip — content-justified.
- Kynästä `count` badges — content-justified corpus-size signal.
- Contact form column — genuine per-menu specialty.

### B. Safe shared-primitive candidates

- **`overviewLinks` rendering** is currently inlined only in Työ (both desktop and mobile blocks). If Minä adopts the same primitive, extract to a `_nav-macros.njk` macro (`overviewStrip(links, ariaLabel, mode)` where mode ∈ `desktop`/`mobile`). Extraction saves ~14 lines per menu per template, per locale.
- **Section list rendering** (menu-link + description) is inlined per menu; near-identical across Minä, Työ, Politiikka, Contact. A tiny macro (`sectionLinkList(section)`) would remove ~10 duplicated lines per menu, but the variations (link.cta handling in Työ, count handling in Kynästä/Politiikka, inlineLinks in Minä) argue against forcing convergence. **Small win; not worth doing until at least three menus agree.**
- **Mobile `<details>` rendering** is per-menu hardcoded (~40–90 lines each). A shared macro would encode: primary-link + optional intro + optional overview-strip + section-grid iteration. Requires careful design (Politiikka spotlight is rendered inside a special `--accent` card, Mediassa hardcoded, Ota yhteyttä has form-column). **Deferred until at least Minä IA lands.**

### C. Legacy duplication

- Overlay `<dialog id="searchOverlay">` markup duplicated across FI/EN nav templates (~24 lines each). Documented as a legitimate C1 opportunity in N1 audit (§ 2.1). Not blocking; not part of MEGAMENU-SYSTEM-01 scope but sits in the same files.
- `.mobile-nav-feature-grid` (5 hardcoded top-level cards) duplicated FI/EN. Structural duplication.

### D. Dead code

- **Hardcoded FI `else` fallback branch** in `_nav-fi.njk:133–166` — renders "Opetus & portfoliot / Tutkimus & julkaisut / Palkinnot & sosiaalinen media" when `workMegaMenu.sections` is falsy. Data always provides sections. **Dead.** (Documented in MEGAMENU-IA-01 §16.)
- **Hardcoded EN `else` fallback branch** in `_nav-en.njk:130–159` — same shape. **Dead.**
- **Kynästä `else` fallback** in `_nav-fi.njk:332–340` and `_nav-en.njk` — renders `writingsMegaMenu.links` when `contentColumns` is falsy. Data always provides `contentColumns`. **Dead.**
- **`.work-inline-cta`** rendering branch in FI four-columns section loop (`_nav-fi.njk:84–95`) — activates only if a link has `link.cta`. Post-MEGAMENU-IA-01 no FI Työ link uses `cta`. Dead unless another menu future-adopts inline CTA. EN Työ four-columns branch has the same code path — also unused (EN Työ uses `else` grid-8-4).

## 17. Deletion opportunities

Ranked:

**P1 — Safe / high value**

- Delete FI hardcoded fallback in `_nav-fi.njk:133–166` (Työ old three-section fallback). Zero risk once tests confirm `workMegaMenu.sections` is always truthy in production data. ~34 lines.
- Delete EN hardcoded fallback in `_nav-en.njk:130–159`. ~30 lines.
- Delete Kynästä `else` fallback in both templates. ~10 lines total.

**P2 — Safe / low value**

- Delete unused `.work-inline-cta` render branch in both templates (`_nav-fi.njk:84–95`, `_nav-en.njk` equivalents). Only if no future data plans to use `link.cta`. ~22 lines total.
- Delete `contact-mega-form` render branch if the form column is confirmed unused in data (currently no `type: "form"` in any `megaMenuContact` data). ~15 lines per locale.
- Reconcile Mediassa mobile hardcoded links (`_nav-fi.njk:641–666`) into a data-driven pass over `mediaMegaMenu.sections`. Small refactor; content-visible → test carefully.

**P3 — Needs reconciliation**

- Overlay `<dialog>` deduplication across FI/EN nav templates (N1 debt).
- `.mobile-nav-feature-grid` deduplication (5 hardcoded top-level cards).

**DO NOT TOUCH**

- Politiikka spotlight rendering (content-justified).
- Kynästä `count` computation blocks (semantically important, refactoring to a helper is possible but out of scope).
- Contact form column code path (future contact experience surface).

## 18. Proposed shared mega-menu language

**Design language (conceptual):**

```
MEGA MENU
├── ORIENTATION LAYER (optional)
│   └── one of:
│       ├── overviewLinks  ── compact chip strip of cross-cutting/profile links
│       ├── spotlight      ── aside with title + description + roles[] + CTA
│       ├── showcase       ── aside with image + description + CTA
│       └── intro          ── full-width heading + description
│
├── GROUPED ROUTES LAYER (required)
│   └── 2–4 sections, each with:
│       ├── heading + optional headingHref
│       ├── links[] with {title, href, icon, description, optional countKey|countData, optional external}
│       └── optional per-section semantics (form column, inline links)
│
└── CTA LAYER (optional)
    └── only when it represents a distinct user task not covered by the grouped routes
```

**Realized as a data vocabulary (conceptual only — not implemented in this audit):**

```js
{
  overviewLinks: [...],   // optional; used by Työ.fi/en (post IA-01)
  spotlight:    {...},    // optional; used by Politiikka.fi/en
  showcase:     {...},    // optional; used by Minä.fi/en
  intro:        {         // optional; used implicitly by Kynästä (groupHeading + description)
    heading, description
  },
  sections:     [...],    // required; universal
  cta:          {...}     // optional; used by Työ.en, Ota yhteyttä (form)
}
```

**Deliberate non-goals:**

- Do **not** collapse `spotlight` + `showcase` + `overviewLinks` into a single "orientation" primitive — each carries distinct UX weight (rich metadata / humanizing portrait / compact route strip). Force-collapsing would rename differences, not remove them (audit question 6, verdict B).
- Do **not** force all menus onto the same grid (three-cols vs four-cols vs grid-8-4 are content-justified variations).
- Do **not** unify FI + EN sections cross-locale beyond current per-menu shape.

## 19. Menu-by-menu target model

| Menu | Current pattern | Proposed pattern | Verdict | Reason |
|---|---|---|---|---|
| **Minä.fi** | showcase aside + 3 sections (col 1 is cross-cutting) | `overviewLinks` (Tietoa minusta, Ansioluettelo, Palkinnot) + 2 sections (Vapaa-aika, Roolini) + showcase aside | **CHANGE** | Extract cross-cutting profile links from the first column into an overview strip; leaves Vapaa-aika + Roolini as parallel personal-dimension groups. Direct mirror of MEGAMENU-IA-01. |
| **Minä.en** | showcase aside + 3 sections | `overviewLinks` (About me, CV, Awards) + 2 sections (Free Time, My Roles) + showcase aside | **CHANGE** | Same rationale. |
| **Työ.fi** | overview strip + 4 sections | as-is | **KEEP** | MEGAMENU-IA-01 reference. |
| **Työ.en** | overview strip + 3 sections + CTA aside | as-is | **KEEP** | MEGAMENU-IA-01. |
| **Politiikka.fi** | spotlight aside + 3 sections | as-is | **KEEP** | Spotlight already serves the orientation role richly. |
| **Politiikka.en** | spotlight aside + 3 sections | as-is | **KEEP** | Parallel to FI. |
| **Kynästä.fi** | group-head intro + 3 contentColumns (counts) | as-is | **KEEP** | Strong content-type model. |
| **Kynästä.en** | group-head intro + 3 contentColumns | as-is | **KEEP** | Parallel to FI. |
| **Mediassa.fi** | intro + 3 sections (Aloita tästä / Sisältötyypit / Liittyvät) | as-is | **KEEP** | Genuinely parallel three-section model. |
| **Mediassa.en** | intro + 3 sections | as-is | **KEEP** | Parallel to FI. |
| **Ota yhteyttä.fi** | intro + 3 role columns | as-is | **KEEP** | Role-based columns work; not part of MEGAMENU-SYSTEM-01. |
| **Ota yhteyttä.en** | intro + 3 role columns | as-is | **KEEP** | Parallel to FI. |

**One menu changes. Five menus stay.**

## 20. Recommended implementation slices

**MEGAMENU-SYSTEM-01B — Minä IA (single justified slice)**

- Add `overviewLinks[]` to `megaMenuMe.{fi,en}` with:
  - FI: Tietoa minusta (`/tietoa/`), Ansioluettelo (`/cv/`), Palkinnot (`/palkinnot/`)
  - EN: About me (`/en/about/`), Curriculum Vitae (`/en/cv/`), Awards (`/en/awards/`)
- Remove the three overview links from the "Jari lyhyesti" section.
- Rename the leading column heading — likely drop the "Jari lyhyesti" column entirely (it becomes empty) and keep 2 grouped sections (Vapaa-aika, Roolini).
- Update `_nav-fi.njk:17–58` and `_nav-en.njk:17–58`: render `meMegaMenu.overviewLinks` above `.mega-left.three-cols` (or `.two-cols` if two remaining columns visually look sparse — consider a 2-col grid variant).
- Update mobile Minä `<details>` in both templates to render the overview strip above the section grid.
- Retain showcase aside.
- Add regression tests (`tests/megamenu-me-ia-01.spec.js`): overview strip renders, exactly 2 remaining sections (Vapaa-aika, Roolini), showcase preserved, mobile parity.
- Estimated diff: ~110 lines across data + template + CSS (minimal — overview-strip CSS already exists from MEGAMENU-IA-01) + ~150 lines test.

**MEGAMENU-SYSTEM-01A — shared overview-strip macro (deferred / optional)**

- Extract the desktop overview-strip render block to `_nav-macros.njk` as `overviewStrip(links, ariaLabel)`.
- Extract the mobile overview-strip render block to `_nav-macros.njk` as `mobileOverviewStrip(links, ariaLabel)`.
- Replace inline usage in Työ (both templates) and Minä (both templates, post-01B).
- **Justified only if 01B lands** — a single-user macro is over-engineering. Two-user macro is worth extracting. **Recommend combining 01A into 01B as an internal refactor step**, not a separate slice.

**MEGAMENU-SYSTEM-01C — dead fallback branch cleanup (deferred)**

- P1 deletions from §17 (three `else` fallback branches across the two templates).
- Small, safe, orthogonal to IA slices. Can ship any time.

**MEGAMENU-SYSTEM-01D through E — Politiikka / Kynästä / Mediassa / Ota yhteyttä IA changes**

- **Not recommended.** No IA improvement identified. Marked **MAINTENANCE / NO CHANGE.**

## 21. AC1 impact

**Zero. Architecture Closure 1.0 remains CLOSED / GREEN / MAIN** under the recommended slice set (01B + optional 01A/01C).

Verified against `docs/architecture-closure-1-0-closure-2026-08-29.md` §6 reopen conditions:

- No new duplicate content ownership (contextual duplicates are useful; documented per menu).
- No canonical semantics moved to browser JS.
- No Pagefind change.
- No runtime JSON → HTML architecture introduced.
- FI/EN parity: deliberate semantic asymmetries preserved and documented.
- No public contracts removed.
- No source / landing / context semantics regression.

This is a UX/IA convergence audit, not an architecture change.

## 22. Verdict

**MEGAMENU-SYSTEM-01 = PARTIAL GO.**

- **Change**: MEGAMENU-SYSTEM-01B (Minä IA — mirror the Työ pattern).
- **Keep as-is**: Työ (reference), Politiikka, Kynästä, Mediassa, Ota yhteyttä.
- **Extract shared primitive**: the desktop and mobile overview-strip render blocks — but do this **inside 01B** as a natural refactor step once a second consumer exists. Not a separate slice.
- **Optional cleanup**: MEGAMENU-SYSTEM-01C (dead fallback branch deletion) — safe, low value, ship any time.
- **Blocking gate**: MEGAMENU-IA-01 (PR #220) should merge first so that Työ = merged reference. Not strictly required (branch state is authoritative during this audit), but preferred to avoid stacked branches.

Single best next implementation slice: **MEGAMENU-SYSTEM-01B — Minä overview-strip + two grouped columns**, gated on MEGAMENU-IA-01 merge.

---

**MEGAMENU-SYSTEM-01 = AUDIT COMPLETE.**

Waiting for explicit implementation authorization.
