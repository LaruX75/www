# MEGAMENU-IA-01 — Työ mega-menu information architecture audit (2026-09-06)

Audit-only. No production changes.

## 1. Repo baseline

- Working directory: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Branch: `main`
- HEAD: `f116c222b2c3376bc95f99d6af7e60b4978de932`
- origin/main: `f116c222b2c3376bc95f99d6af7e60b4978de932` (identical to HEAD; `git fetch origin` produced no updates)
- Anchor commit `f116c222b2c3376bc95f99d6af7e60b4978de932` = HEAD. `git merge-base --is-ancestor` confirms main descends from (equals) the anchor.
- `git status`: only `.cache/api-fallback/*.json` and untracked audit docs. **No modifications to `src/_data/headerNav.js`, `src/_includes/_nav-fi.njk`, `src/_includes/_nav-en.njk`, or `src/_includes/_nav-macros.njk`.** Baseline is clean for a nav audit.
- Reviewed closure docs on main:
  - `docs/architecture-closure-1-0-closure-2026-08-29.md` — AC1 = **CLOSED / GREEN / MAIN**. Reopen only on repo-evidenced architecture regression (§6).
  - `docs/opetus-ia-01-closure-2026-09-05.md` — `/opetus/` is now a real SSR landing (`src/fi/opetus.md`); no EN counterpart by design.
  - `docs/home-nav-correction-01-closure-2026-09-06.md` — FI ≠ EN parity for Opetus is intentional; no synthetic `/en/opetus/` or `/en/teaching/`.

## 2. Current FI Work mega-menu structure (verified from `src/_data/headerNav.js` on main)

Data source: `megaMenuWork.fi` (headerNav.js:806–907). Layout is `"four-columns"`; renderer branch: `_nav-fi.njk:64–109`.

Section 1 — **Yliopistotyö** (`headingHref: "/tyoni-yliopistonlehtorina/"`):

| Label | href | Note |
|---|---|---|
| Opetus | `/opetus/` | Added in OPETUS-IA-01 |
| Esitykset | `/esitykset/` | — |
| Opetusportfolio | `/portfolio/` | — |
| Ansioluettelo | `/cv/` | Also appears in `megaMenuMe.fi` |
| Opiskelijapalaute | `/opiskelijoiden-antamaa-palautetta/` | — |

Section 2 — **Tutkimus** (`headingHref: "/tutkimus/"`):

| Label | href |
|---|---|
| Väitöskirja | `/vaitoskirja/` |
| Julkaisuluettelo | `/julkaisut/` |
| Opinnäytetyöt | `/opinnaytteet/` |

Section 3 — **Yhteiskunnallinen vuorovaikutus** (`headingHref: "/yhteiskunnallinen-vuorovaikutus/"`):

| Label | href |
|---|---|
| Lausunnot ja kannanotot | `/lausunnot/#lausunnot` |
| Mediassa | `/mediassa/` |

Section 4 — **Täydennyskoulutukset (Larux t:mi)** (`headingHref: "/kouluttaja/"`):

| Label | href |
|---|---|
| Koulutuspalaute | `/koulutuspalaute/` |

Section-following CTA card (`megaMenuWork.fi.cta`, rendered at the end of the last section via `_nav-fi.njk:103–105`):

- Title: **"Larux t:mi"**
- Description: "Koulutukset tekoälystä, oppimisteknologiasta ja modernista pedagogiikasta."
- Button: **"Tutustu palveluihin"** → `/kouluttaja/`

**Palkinnot is NOT in the current Work mega-menu.** It exists only under `megaMenuMe.fi.sections[0]` → `/palkinnot/`.

## 3. Current EN Work mega-menu structure

Data source: `megaMenuWork.en` (headerNav.js:908–1005). **EN has no `layout: "four-columns"`.** Renderer takes the `else` branch (`_nav-en.njk:107–129`), which forces a **three-column layout with a `mega-right cta-card` aside**.

Section 1 — **University Work** (no `headingHref`):

| Label | href |
|---|---|
| My Work as a University Lecturer | `/en/work/` |
| Presentations | `/en/presentations/` |
| Teaching Portfolio | `/en/portfolio/` |
| Curriculum Vitae | `/en/cv/` |

Section 2 — **Research**:

| Label | href |
|---|---|
| Research | `/en/research/` |
| Doctoral dissertation | `/en/dissertation/` |
| Publication List | `/en/publications/` |
| Theses | `/en/theses/` |

Section 3 — **Societal Engagement**:

| Label | href |
|---|---|
| Societal engagement | `/en/societal-engagement/` |
| Statements and commentary | `/en/writings/#lausunnot` |
| Presentations and open materials | `/en/presentations/` |
| Media | `/en/media/` |

CTA card (`mega-right`):

- Title: **"Book me for a keynote"**
- Button: **"Request a quote"** → `/en/contact/`

**EN has no Täydennyskoulutus column.** Continuing education is folded into the CTA card only. There is also no "Awards" link in the EN Work mega-menu (`/en/awards/` exists as a page but appears only in `megaMenuMe.en`).

## 4. Problems with current grouping

1. **Column 1 conflates overview and activity.** "Yliopistotyö" as a heading behaves both as an umbrella descriptor of the whole professional profile *and* as the container for teaching-specific links (Opetus, Portfolio, Opiskelijapalaute). CV is inside it, which promotes a profile-scoped route into an activity-scoped column.
2. **Column headings are not on the same conceptual level.** "Yliopistotyö" is a role/umbrella; "Tutkimus" and "Yhteiskunnallinen vuorovaikutus" are activity domains; "Täydennyskoulutukset (Larux t:mi)" is an activity domain qualified by legal entity. Users cannot skim the four columns as "four kinds of work I do."
3. **Column landings are missing at the top of columns 2, 3, and 4.** `headingHref` covers this partially — the heading itself is a link — but the visible first link inside each column is a sub-topic (Väitöskirja, Lausunnot, Koulutuspalaute), not the domain landing. This asymmetry breaks the scan-for-overview mental model.
4. **Palkinnot is invisible from Työ.** Recognition for teaching and open-science work is a profile artefact and belongs alongside CV in a Work context, not only under Minä.
5. **Kouluttaja is only in the CTA card**, not a first-class column link. Users looking for the trainer landing from the Työ mega-menu must find it in the button rather than the link list.
6. **"Täydennyskoulutukset (Larux t:mi)" heading leaks legal-entity language.** User-facing surface should be domain-first ("Täydennyskoulutus"); the entity ("Larux t:mi") can remain in the CTA card copy.
7. **Column 4 has exactly one link.** Visually the column collapses. Adding Kouluttaja + a training-oriented Esitykset link brings it to parity with the other columns.
8. **Esitykset appears only in the teaching column** even though it is a cross-domain content type serving both teaching and continuing-education audiences. Users approaching from "Täydennyskoulutus" cannot see it.
9. **EN structure has no continuing-education presence** and is not aligned with the FI four-domain principle.

## 5. Target IA (recommendation)

**Overview strip** (top of the mega-menu, above the four columns):

- Yliopistotyö → `/tyoni-yliopistonlehtorina/`
- Ansioluettelo → `/cv/`
- Palkinnot → `/palkinnot/`

**Four parallel columns:**

| OPETUS | TUTKIMUS | YHTEISKUNNALLINEN VUOROVAIKUTUS | TÄYDENNYSKOULUTUS |
|---|---|---|---|
| Opetus (`/opetus/`) | Tutkimus (`/tutkimus/`) | Yhteiskunnallinen vuorovaikutus (`/yhteiskunnallinen-vuorovaikutus/`) | Kouluttaja (`/kouluttaja/`) |
| Opetusportfolio (`/portfolio/`) | Julkaisuluettelo (`/julkaisut/`) | Lausunnot (`/lausunnot/#lausunnot`) | Koulutuspalaute (`/koulutuspalaute/`) |
| Opiskelijapalaute (`/opiskelijoiden-antamaa-palautetta/`) | Väitöskirja (`/vaitoskirja/`) | Mediassa (`/mediassa/`) | Esitykset / koulutusmateriaalit (`/esitykset/`) |
| Esitykset (`/esitykset/`) | Opinnäytetyöt (`/opinnaytteet/`) | | |

The CTA card ("Larux t:mi" → `/kouluttaja/`) can be **retained** but demoted to a compact footer of the Täydennyskoulutus column, or **removed** since Kouluttaja is now a first-class link in that column. Recommendation: **remove the aside CTA card** to eliminate the "Kouluttaja appears twice within the same panel" duplicate. The overview strip already carries the profile CTAs.

## 6. Overview-strip recommendation

- Render as a compact horizontal set of link chips (existing `.menu-link` styling with a small container wrapper), placed inside `.mega-wrap` before `.mega-left.four-cols`.
- Each item = icon + label + optional micro-description; no aside CTA panel, no images.
- **Not a fifth column** — visually a strip that spans full width above the four columns.
- SSR-only. No new JS. Existing dropdown open/close handles focus and Escape.
- Data extension: add `megaMenuWork.fi.overviewLinks: []` (small array of `{ title, href, icon, description }` entries). Extend `_nav-fi.njk`'s four-columns branch to render this before the `<div class="mega-left four-cols">` when present. Backwards-compatible — if absent, template renders four columns as today.
- Reading order (see §14): overview strip → column 1 → column 2 → column 3 → column 4.

This is the **smallest data + template extension**; it does not introduce a parallel navigation model, does not require menu state, and reuses existing CSS chip / menu-link styling.

## 7. Opetus column recommendation

Column heading: **Opetus** (drops "Yliopistotyö" umbrella; explicit domain naming).

Ordered links:

1. **Opetus** — `/opetus/` — landing, one-line desc "Julkiset kurssisivut ja opetukseen liittyvät kokonaisuudet."
2. **Opetusportfolio** — `/portfolio/`
3. **Opiskelijapalaute** — `/opiskelijoiden-antamaa-palautetta/`
4. **Esitykset** — `/esitykset/` — desc scoped to teaching context, e.g. "Luennot ja opetusmateriaalit julkisen esitysarkiston kautta." — **link goes to the canonical `/esitykset/` archive** (option A of audit task 3).

Rationale for option A (over B or C):
- No stable teaching-filtered subroute exists. `src/esitykset.11tydata.js` does not define a teaching-filtered variant; `src/esitykset.njk`'s permalink is a single canonical `/esitykset/`.
- Inventing `/esitykset/?context=teaching` would create a new discovery/filter classification for a mega-menu need — explicitly disallowed by the audit rules.
- A **context-specific description** in the mega-menu is enough to signal intent without redefining canonical membership. The link label stays "Esitykset."

## 8. Tutkimus column recommendation

Column heading: **Tutkimus** (unchanged).

Ordered links (**adds Tutkimus landing as the first link**):

1. **Tutkimus** — `/tutkimus/` — desc: "Tutkimushankkeet, aiheet ja koottu julkaisukuva."
2. **Julkaisuluettelo** — `/julkaisut/`
3. **Väitöskirja** — `/vaitoskirja/`
4. **Opinnäytetyöt** — `/opinnaytteet/` (kept as "Opinnäytetyöt" per current copy)

Rationale:
- `/tutkimus/` exists (`src/fi/tutkimus.md`) but is currently reachable in Työ only via the small `headingHref` on the section heading — visually not a link in the list. Promoting it to the top of the column gives users an actual research landing to open.
- Order: overview (Tutkimus) → primary comprehensive list (Julkaisuluettelo) → distinct research artefact (Väitöskirja) → supervised work (Opinnäytetyöt). This descends from breadth to specific artefact.
- **No change to Research canonical membership.**

## 9. Yhteiskunnallinen vuorovaikutus column recommendation

Column heading: **Yhteiskunnallinen vuorovaikutus** (unchanged).

Ordered links (**adds landing as the first link**; renames the statement link):

1. **Yhteiskunnallinen vuorovaikutus** — `/yhteiskunnallinen-vuorovaikutus/` — desc: "Miten tutkimus ja opetus jatkuvat lausunnoissa, mediassa ja päätöksenteossa."
2. **Lausunnot** — `/lausunnot/#lausunnot` — shorter label ("Lausunnot" instead of "Lausunnot ja kannanotot"). The word "kannanotot" is not modelled as a distinct content type in taxonomy; the shorter label matches the actual `/lausunnot/` page semantics.
3. **Mediassa** — `/mediassa/`

Nothing is lost. No route disappears. The section stays semantically separate from Research and Teaching.

## 10. Täydennyskoulutus column recommendation

Column heading: **Täydennyskoulutus** (drops parenthetical "(Larux t:mi)"; entity name moves into copy only).

Ordered links (**adds Kouluttaja + Esitykset**):

1. **Kouluttaja** — `/kouluttaja/` — desc: "Koulutus- ja asiantuntijapalvelut Larux t:mi:n kautta."
2. **Koulutuspalaute** — `/koulutuspalaute/`
3. **Esitykset / koulutusmateriaalit** — `/esitykset/` — desc: "Puheenvuorot ja koulutusmateriaalit julkisen esitysarkiston kautta." — Label may keep the compound "Esitykset / koulutusmateriaalit" to disambiguate from the teaching-context Esitykset link, but the destination is the same canonical `/esitykset/`.

Verification:
- `/kouluttaja/` is served by `src/fi/yritys.md` (title "Kouluttaja ja keynote-puhuja / Larux t:mi", `permalink: /kouluttaja/`). Confirmed on disk.
- `/koulutuspalaute/` is served by `src/fi/koulutuspalaute.md`. Confirmed.
- `src/training/training.11tydata.json` defines individual training detail pages under `/koulutukset/{fileSlug}/`, but there is **no `/koulutukset/` archive landing**. No stable training-materials subroute exists.

If the label duplication ("Esitykset" appears in both Opetus and Täydennyskoulutus columns) is judged confusing, an acceptable smaller variant is:

- **Omit** the Täydennyskoulutus-side Esitykset link and rely on the description of the Kouluttaja link to reference "puheenvuorot ja materiaalit."

Recommendation: **include the link with the compound label** — user navigation value wins over technical uniqueness per audit rule for duplicates.

## 11. Duplicate-link analysis

Explicit cross-menu / intra-menu duplicates in the target IA:

| Route | Locations | Classification | Verdict |
|---|---|---|---|
| `/cv/` | `megaMenuMe.fi` **and** Työ overview strip | A — useful contextual duplicate | **Retain both.** CV is profile evidence in Minä and academic-work evidence in Työ. Removing from either context degrades that context. |
| `/palkinnot/` | `megaMenuMe.fi` **and** Työ overview strip (new) | A — useful contextual duplicate | **Retain both.** Rationale matches CV. |
| `/esitykset/` | Työ→Opetus column **and** Työ→Täydennyskoulutus column | A — useful contextual duplicate within the same panel | **Retain both, use distinct descriptions.** Presentations are a cross-domain content type. Both contexts have real user intents. Must NOT create new taxonomy/canonical distinction. |
| `/mediassa/` | top-level nav, Työ→Yhteiskunnallinen vuorovaikutus, `megaMenuMedia.fi` (self) | A — useful contextual duplicate | **Retain.** Media is a discovery destination in three orientations. |
| `/kouluttaja/` | Työ→Täydennyskoulutus column (new) **and** current Työ CTA card | C — unnecessary duplicate if both retained | **Remove the CTA card** (see §5). Kouluttaja as a first-class link in the column supersedes it. |
| `/lausunnot/#lausunnot` | Työ→Yhteiskunnallinen vuorovaikutus **and** `megaMenuWritings.fi` | A — useful contextual duplicate | **Retain.** Statements are both self-authored writing and expert societal engagement. |

No B (confusing) duplicates identified in the target IA.

## 12. Copy recommendations

Headings (data-driven):

- Column 1 heading: `"Opetus"` (was `"Yliopistotyö"`)
- Column 2 heading: `"Tutkimus"` (unchanged)
- Column 3 heading: `"Yhteiskunnallinen vuorovaikutus"` (unchanged)
- Column 4 heading: `"Täydennyskoulutus"` (was `"Täydennyskoulutukset (Larux t:mi)"`)
- **Do NOT use "Akateeminen profiili"** as any heading — the entire menu is the academic/professional profile; a subcolumn with that name would be self-referential.

Descriptions (per-link `description` fields):

- Prefer concrete user-facing phrasing over architecture language ("koontisivu", "hub", "arkkitehtuuri", "engine" → no).
- Rewrite the current "Esitykset" description ("Luentoja, opetussisältöjä ja avoimia opetusmateriaaleja yliopistotyön näkökulmasta.") to the two context-scoped variants proposed in §7 and §10. This avoids claiming that all presentations are teaching content.
- The current Väitöskirja description ("Lectio-video, väitöskirja ja neljä osajulkaisua samassa kokonaisuudessa.") is good — keep.

Overview strip descriptions can be one-line, e.g.:

- Yliopistotyö → "Roolikuvaus yliopistonlehtorina."
- Ansioluettelo → "Koulutus, kokemus ja keskeiset akateemiset meriitit."
- Palkinnot → "Saadut tunnustukset opetuksesta ja avoimesta tieteestä."

## 13. FI/EN handling

**FI = full target IA** (overview strip + four columns as above).

**EN = semantic mirror where routes exist; explicit asymmetries preserved elsewhere.**

Existing EN routes (verified):

- `/en/work/`, `/en/research/`, `/en/portfolio/`, `/en/cv/`, `/en/awards/`, `/en/publications/`, `/en/dissertation/`, `/en/theses/`, `/en/presentations/`, `/en/societal-engagement/`, `/en/media/`, `/en/company/` — all exist as directories.

Non-existent EN routes (verified):

- `/en/opetus/`, `/en/teaching/` — explicitly do not exist per OPETUS-IA-01 §5 and HOME-NAV-CORRECTION-01 §5.
- No EN equivalent of `/opiskelijoiden-antamaa-palautetta/` on disk.
- No EN equivalent of `/koulutuspalaute/` on disk.
- No EN equivalent of `/kouluttaja/` on disk (`/en/company/` is the closest — the trainer landing in EN is the company landing).

Recommended EN structure (three-column, aligned semantics, no synthesis):

**Overview strip** (EN):

- University Work → `/en/work/`
- Curriculum Vitae → `/en/cv/`
- Awards → `/en/awards/`

**Three columns** (Opetus column deliberately absent on EN):

| Research | Societal Engagement | Continuing Education |
|---|---|---|
| Research (`/en/research/`) | Societal engagement (`/en/societal-engagement/`) | Company / Trainer (`/en/company/`) |
| Publication List (`/en/publications/`) | Statements and commentary (`/en/writings/#lausunnot`) | Presentations and materials (`/en/presentations/`) |
| Doctoral dissertation (`/en/dissertation/`) | Media (`/en/media/`) | |
| Theses (`/en/theses/`) | | |

Rationale:
- Awards is added to the EN overview (currently missing from EN Work mega-menu even though `/en/awards/` exists) — this is a small copy/structure fix, not a new route.
- Teaching Portfolio (`/en/portfolio/`) currently sits in the EN "University Work" column. In the semantic-mirror model it is the closest EN equivalent to Finnish "Opetus" and can move to the top of the Continuing Education column **only if** there is a clear EN pedagogical narrative; otherwise it stays as a link inside the Research column. Recommendation: **keep Teaching Portfolio inside a lightweight fourth "Teaching resources" column with a single link** rather than forcing a full four-column parity. This is a judgment call for implementation.
- EN column count may legitimately be **three (not four)** because the teaching column would be underpopulated. This is a deliberate FI/EN asymmetry consistent with existing site policy.
- **FI/EN parity is semantic coherence, not identical routes.**

## 14. Mobile / accessibility impact

**Desktop wide (`≥ md`):** overview strip renders as a horizontal chip row above the four-column grid. Existing `_nav-fi.njk` mega-menu wrapper (`div.mega-wrap` + `div.mega-left.four-cols`) accommodates a leading `<nav class="mega-overview-strip">` sibling.

**Narrow desktop / tablet:** the four columns already wrap via existing `.four-cols` CSS grid; the overview strip wraps identically. No new breakpoints required.

**Mobile:** the offcanvas mobile panel (`_nav-fi.njk:528–548`) currently iterates `workMegaMenu.sections` inside the "Työ" `<details>`. Add a small `<section>` above the section grid to render `overviewLinks` as a compact list. No accordion behavior change; existing `<details>` element owns disclosure.

**Keyboard order (target):**

1. Työ trigger (opens dropdown)
2. Overview strip: Yliopistotyö → Ansioluettelo → Palkinnot
3. Opetus column heading (linked) → Opetus → Opetusportfolio → Opiskelijapalaute → Esitykset
4. Tutkimus column heading → Tutkimus → Julkaisuluettelo → Väitöskirja → Opinnäytetyöt
5. Yhteiskunnallinen vuorovaikutus column heading → Yhteiskunnallinen vuorovaikutus → Lausunnot → Mediassa
6. Täydennyskoulutus column heading → Kouluttaja → Koulutuspalaute → Esitykset / koulutusmateriaalit

**Screen-reader hierarchy:** each column heading is `<h5>` today (`_nav-fi.njk:70`); the overview strip should be a peer `<nav aria-label="Työn yleiskatsaus">` without an `<h5>` (to avoid competing with the four column headings), or with a visually-hidden `<h5>` for structure. Recommend `<nav aria-label>` without visible heading.

**Touch targets:** overview strip chip = `.menu-link` styling (44×44 min via existing Bootstrap utility), no regression.

**Duplicate accessible labels:** the two Esitykset links must have distinguishable accessible names via `aria-label` or contextual copy (e.g., "Esitykset (opetus)" vs "Esitykset / koulutusmateriaalit"). Descriptions inside `<small class="menu-link-desc">` are already read after the link text by AT.

**Existing keyboard test coverage:** `tests/navigation.spec.js` and `tests/pf5-g1-navbar-modular-ui.spec.js` cover generic navbar interaction. `tests/opetus-ia-01.spec.js:118` pins that `/opetus/` link is present in the Työ mega-menu — this remains true under the target IA. No hardcoded four-column-count assertion was found in tests grepped for `four-columns`, `megaMenuWork`, or `Yliopistotyö`.

## 15. SSR / JS impact

**All navigation content remains SSR/data-driven.**

- Overview strip is a new field on `megaMenuWork.fi` (and `.en`) rendered by an extended Nunjucks template branch. No client-side content generation.
- No runtime JSON is introduced. No `/data/*` endpoint changes.
- No SPA / menu state model.
- Dropdown open/close continues to use Bootstrap's data-bs-toggle interaction (see `_nav-fi.njk:60` mega-dropdown trigger via `_nav-macros.njk:14`).
- No new runtime JS files. No `pageScripts` additions.

## 16. Deletion opportunities

Verify each before deleting:

1. **CTA card in `megaMenuWork.fi`** (`headerNav.js:901–906`) — becomes redundant once Kouluttaja is a first-class link in the Täydennyskoulutus column. Delete after verifying:
   - The `_nav-fi.njk` four-columns branch renders the CTA inline (`if loop.last and workMegaMenu.cta`, line 103–105); removing the data field automatically hides the button.
   - No test asserts the exact CTA button text "Tutustu palveluihin" in FI Työ mega-menu (spot-checked in the tests grepped for `megaMenuWork`, `Työ`, `four-columns` — none found).
2. **Hardcoded FI fallback branch in `_nav-fi.njk:133–166`** ("Opetus & portfoliot", "Tutkimus & julkaisut", "Palkinnot & sosiaalinen media") — this branch only fires when `workMegaMenu` or `workMegaMenu.sections` is falsy. Since `headerNav.js` always provides these fields, this branch is dead code. Suggest deletion in a **separate** slice to keep the IA slice minimal.
3. **Hardcoded EN fallback branch in `_nav-en.njk:130–159`** — same analysis; dead code.
4. **Copy fragment "(Larux t:mi)"** in the column-4 heading — replaced by the shorter "Täydennyskoulutus" heading and the entity name in the retained CTA copy or the Kouluttaja link description.
5. **"kannanotot"** in the current "Lausunnot ja kannanotot" label — no taxonomy concept "kannanotot" exists; shortening to "Lausunnot" removes label debt.

Deletions 2, 3, 4, 5 are cosmetic hygiene; only 1 changes visible UI meaningfully.

## 17. AC1 impact

**Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.**

Checked against the reopen conditions in `docs/architecture-closure-1-0-closure-2026-08-29.md` §6:

- No new duplicate content ownership introduced.
- No canonical semantics moved into browser JS.
- Pagefind is untouched.
- No new runtime JSON → HTML architecture.
- FI/EN parity: deliberate semantic asymmetries preserved and documented.
- No public contracts removed.
- No source / landing / context semantics regression.

This is a UX/navigation IA change, not an architecture change. AC1 is not reopened.

## 18. Exact smallest implementation slice

One PR, one branch, three files modified plus one test file:

**Modify `src/_data/headerNav.js` — `megaMenuWork.fi` only:**

- Add `overviewLinks: [ { title: "Yliopistotyö", href: "/tyoni-yliopistonlehtorina/", icon: "bi bi-briefcase me-2", description: "..." }, { title: "Ansioluettelo", href: "/cv/", icon: "bi bi-file-person me-2", description: "..." }, { title: "Palkinnot", href: "/palkinnot/", icon: "bi bi-award me-2", description: "..." } ]`.
- Rewrite the four `sections` in the order Opetus → Tutkimus → Yhteiskunnallinen vuorovaikutus → Täydennyskoulutus with the links listed in §7–§10.
- Rename column 1 heading `"Yliopistotyö"` → `"Opetus"`.
- Rename column 4 heading `"Täydennyskoulutukset (Larux t:mi)"` → `"Täydennyskoulutus"`.
- Rename "Lausunnot ja kannanotot" → "Lausunnot".
- Add Tutkimus, Yhteiskunnallinen vuorovaikutus, Kouluttaja, and the Täydennyskoulutus-side Esitykset links.
- Remove `cta: { title: "Larux t:mi", ... }` block (see §16 item 1).

**Modify `src/_data/headerNav.js` — `megaMenuWork.en`:**

- Reorder / rename per §13.
- Add `overviewLinks` with Awards.
- No new EN routes.

**Modify `src/_includes/_nav-fi.njk`:**

- In the `four-columns` branch (line 64–109), render `workMegaMenu.overviewLinks` above `<div class="mega-left four-cols">` as a compact `<nav aria-label="Työn yleiskatsaus" class="mega-overview-strip">` with `.menu-link` styled anchors.
- In the mobile `<details>` block (line 528–548), render the same list before `mobile-nav-section-grid`.

**Modify `src/_includes/_nav-en.njk`:**

- Analogous overview-strip render. Because EN doesn't currently use `layout: "four-columns"`, either set `layout: "four-columns"` in `megaMenuWork.en` and route through the same template branch, or add the overview strip to the `else` branch. Recommendation: **set `layout: "four-columns"`** to converge templates.

**Add `src/css/styles.css` rules for `.mega-overview-strip`:**

- One flex row of chips on desktop, wraps on narrow.
- Existing color tokens; no new palette.

**Add test file `tests/megamenu-ia-01.spec.js`:**

- Assert overview strip renders and contains Yliopistotyö, Ansioluettelo, Palkinnot.
- Assert four columns in target order with correct headings.
- Assert each column's first link is the domain landing (`/opetus/`, `/tutkimus/`, `/yhteiskunnallinen-vuorovaikutus/`, `/kouluttaja/`).
- Assert Esitykset appears in both Opetus and Täydennyskoulutus columns with distinct accessible descriptions.
- Assert CTA card removed.
- Assert no synthesized `/en/opetus/` link on EN Work mega-menu.
- Regression: `/opetus/` link still present (protects `tests/opetus-ia-01.spec.js` invariant).

No changes to canonical content, taxonomies, presentations data, or the Pagefind index. No changes to routes.

## 19. GO / CONDITIONAL GO / NO-GO

**Verdict: CONDITIONAL GO.**

Conditions before implementation authorization:

1. **User confirmation** on the two open judgment calls:
   - (a) Include the Täydennyskoulutus-side Esitykset link with the compound label "Esitykset / koulutusmateriaalit" **vs** omit it and reference materials in the Kouluttaja description.
   - (b) EN column count = **three** columns without a distinct Teaching column (recommended), **or four** columns with a lightweight Teaching Portfolio-only column.
2. **CTA card removal** confirmed acceptable (§16 item 1) — Kouluttaja becomes a first-class link, and the overview strip carries the profile CTAs.
3. **Overview-strip rendering approach** confirmed: extend the existing `four-columns` template branch (no parallel model). If the user prefers a purely additive approach that leaves the current CTA card untouched, that is also feasible but preserves the "Kouluttaja appears twice" duplicate.

Everything else in the target IA is safe:
- All FI routes verified to exist on disk.
- All EN routes verified.
- No taxonomy change.
- No canonical membership change.
- No AC1 impact.
- No test breaks identified.

---

**MEGAMENU-IA-01 = AUDIT COMPLETE.**

Waiting for explicit implementation authorization.
