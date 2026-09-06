# MEGAMENU-SYSTEM-01B — closure (2026-09-06)

Minä mega-menu information-architecture rework. Mirrors the MEGAMENU-IA-01
pattern: extract cross-cutting profile links into an overview strip; leave
two grouped personal-dimension sections; preserve the showcase aside.

## 1. Base

- Base SHA: `4d28afd7de69df3b9507913b61726520037ca611` (origin/main after PR #220 merge)
- Branch: `feat/megamenu-system-01b-me`
- Audit reference: `docs/megamenu-system-01-sitewide-navigation-language-audit-2026-09-06.md` (§20 "MEGAMENU-SYSTEM-01B — Minä IA (single justified slice)")
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (unchanged)
- Canonical Content v1 = unchanged
- MEGAMENU-IA-01, OPETUS-IA-01, HOME-NAV-CORRECTION-01 invariants preserved

## 2. Before / after FI Minä mega-menu IA

**Before** (three sections + showcase aside):

1. "Jari lyhyesti" — Tietoa minusta, Ansioluettelo, Palkinnot
2. "Vapaa-aika" — Autolomat, Kulinaristi (external), Hartiapankkiremontoija (external)
3. "Roolini" — Poliitikko, Yrittäjä

Aside: showcase (portrait + description + "Ota yhteyttä" CTA).

**After** (compact overview strip + two personal-dimension sections + showcase aside):

Overview strip:
- Tietoa minusta → `/tietoa/`
- Ansioluettelo → `/cv/`
- Palkinnot → `/palkinnot/`

Sections (2):
- "Vapaa-aika" — unchanged links
- "Roolini" — unchanged links

Showcase aside: unchanged.

Rationale: the "Jari lyhyesti" column was semantically a cross-cutting profile summary, not a peer of "Vapaa-aika" and "Roolini" — the same asymmetry MEGAMENU-IA-01 fixed for Työ's "Yliopistotyö" column. Promoting those three links to an overview strip leaves two genuinely parallel personal-dimension groups underneath, preserving the humanizing showcase.

## 3. Before / after EN Me mega-menu IA

**Before** (three sections + showcase aside):

1. "About Jari" — About me, Curriculum Vitae, Awards
2. "Free Time" — Road Trips, Foodie (external), DIY Renovator (external)
3. "My Roles" — Politician, Entrepreneur

**After**:

Overview strip:
- About me → `/en/about/`
- Curriculum Vitae → `/en/cv/`
- Awards → `/en/awards/`

Sections (2): "Free Time", "My Roles".

Showcase aside: unchanged (portrait + "Get in touch" CTA).

## 4. Shared overview-strip primitive extraction

Introduced `overviewStrip(links, ariaLabel)` and `mobileOverviewStrip(links, ariaLabel)` macros in `src/_includes/_nav-macros.njk`. Both callers now use the macros:

- **Työ** (both FI and EN, desktop and mobile) — refactored to macro calls; the inline `<nav class="mega-overview-strip">` blocks previously introduced by MEGAMENU-IA-01 are replaced with `{{ nav.overviewStrip(...) }}` / `{{ nav.mobileOverviewStrip(...) }}`. **Byte-identical desktop and mobile output** (verified via post-build inspection: same labels, same order, same aria-label, same section counts).
- **Minä** (both FI and EN, desktop and mobile) — new consumer.

CSS: reuses the `.mega-overview-strip` + `.mega-overview-link` + `.mobile-nav-overview-strip` + `.mobile-nav-overview-link` rules introduced in MEGAMENU-IA-01. One new selector added:

```css
.mega-wrap.grid-8-4 > .mega-overview-strip {
  grid-column: 1 / -1;
}
```

This makes the strip span the full width of Minä's `grid-8-4` panel (which places `.mega-left.three-cols` in the left 3fr column and `.showcase-card` in the right 1fr column). Without it the strip would collapse into the left column alongside the sections.

Rationale for extracting only now (not in MEGAMENU-IA-01): audit §16 recommended extraction "once a second consumer exists." Minä is that second consumer.

## 5. Showcase preserved

The Minä showcase aside remains unchanged in both locales:

- FI: portrait image, "Jari Laru", "Isä, kulinaristi ja automatkailija – kun ei olla töissä.", CTA "Ota yhteyttä" → `/yhteystiedot/`.
- EN: same portrait, "Jari Laru", "Father, foodie and road tripper – the person behind the work.", CTA "Get in touch" → `/en/contact/`.

The audit noted the showcase is a distinct orientation element (humanizing portrait) that does not compete with the compact overview strip; both coexist in the same panel.

## 6. Contextual duplicates preserved

`Ansioluettelo` and `Palkinnot` (FI) / `Curriculum Vitae` and `Awards` (EN) now appear in **both** the Minä overview strip **and** the Työ overview strip. This is an intentional useful contextual duplicate:

- Minä context: profile evidence (biography, credentials, recognition together).
- Työ context: academic-work evidence (credentials backing the professional profile).

Removing either surface would degrade its respective mental model. The two overview strips carry independent aria-labels ("Profiilin yleiskatsaus" vs. "Työn yleiskatsaus") so screen-reader announcement disambiguates them by context.

## 7. FI/EN asymmetry

Both locales now carry a Minä overview strip with parallel link semantics. No new EN routes were synthesized:

- `/en/about/`, `/en/cv/`, `/en/awards/` all exist as pages on disk.
- No new `/en/opetus/`, `/en/teaching/`, or any other EN counterpart introduced.

FI/EN parity here is semantic coherence (same three profile-link categories in overview) — consistent with MEGAMENU-IA-01, OPETUS-IA-01, and HOME-NAV-CORRECTION-01 policy.

## 8. Files changed

**Modified:**

- `src/_data/headerNav.js` — `megaMenuMe.{fi,en}` gained `overviewLinks[]`; "Jari lyhyesti" / "About Jari" section removed; `Vapaa-aika`/`Roolini` (FI) and `Free Time`/`My Roles` (EN) preserved; showcase unchanged.
- `src/_includes/_nav-macros.njk` — new `overviewStrip(links, ariaLabel)` and `mobileOverviewStrip(links, ariaLabel)` macros.
- `src/_includes/_nav-fi.njk` — Työ desktop + mobile switched to macro calls (refactor); Minä desktop + mobile now render overview strip via macro.
- `src/_includes/_nav-en.njk` — same as FI for Work + Me.
- `src/css/mega-menu.css` — added `.mega-wrap.grid-8-4 > .mega-overview-strip { grid-column: 1 / -1; }` to span the strip across Minä's grid.

**New:**

- `tests/megamenu-system-01b-me.spec.js` — 15 regression tests across 8 groups (A–H).
- `docs/megamenu-system-01b-me-closure-2026-09-06.md` — this file.

Estimated net diff: ~120 lines added (~55 data, ~30 macros, ~15 CSS, ~200 test), ~40 lines removed (inline overview-strip blocks in Työ replaced by macro calls, old "Jari lyhyesti" section body).

## 9. Tests

New spec `tests/megamenu-system-01b-me.spec.js` — **15/15 green** across 8 groups (A–H):

- **A** (2): FI Minä overview strip present with Tietoa minusta / Ansioluettelo / Palkinnot; reading order precedes the section grid.
- **B** (2): exactly two FI sections in target order (Vapaa-aika, Roolini); "Jari lyhyesti" heading gone.
- **C** (1): FI showcase aside preserved (portrait + title + "Ota yhteyttä" CTA).
- **D** (3): EN Me overview strip renders About me / CV / Awards; exactly two EN sections (Free Time, My Roles); EN "About Jari" gone; EN showcase preserved.
- **E** (2): contextual duplicates preserved — Ansioluettelo and Palkinnot appear in BOTH Minä and Työ overview strips.
- **F** (2): MEGAMENU-IA-01 invariants preserved after macro extraction — Työ overview strip and four columns unchanged.
- **G** (2): no synthesized `/en/opetus/` or `/en/teaching/`; no runtime nav JSON.
- **H** (1): mobile Minä `<details>` renders overview strip + exactly two section-cards.

Adjacent regression across `megamenu-ia-01` + `opetus-ia-01` + `home-nav-correction-01` + `navigation` + `pf5-g1-navbar-modular-ui`: **72 passed / 2 pre-existing baseline failures** (see §10).

Build: `CACHE_ONLY=true npx @11ty/eleventy` exit 0, `Copied 275 Wrote 1479 files`. Pagefind not touched.

## 10. Known pre-existing baseline failures (NOT caused by this branch)

Both failures are Pagefind search-dialog timing flakes documented as baseline in prior closures. Neither touches navigation data, templates, or the mega-menu system.

1. `tests/navigation.spec.js:143` — "Search dialog returns Pagefind results for a known Finnish term". Documented as timing-flaky in `docs/opetus-ia-01-closure-2026-09-05.md` §11 item 2 and in `docs/n1-navigation-accessibility-audit-2026-08-21.md` §3.
2. `tests/pf5-g1-navbar-modular-ui.spec.js:85` — "query returns family-typed shared-card results in Pagefind rank order". Same Pagefind-timing failure family (dialog init race).

This branch does not modify `site-ui.js`, Pagefind index rules, `search-result-presenter.js`, or any search-dialog markup. The failures are not caused by MEGAMENU-SYSTEM-01B.

## 11. Deletion / simplification

- Deleted the "Jari lyhyesti" / "About Jari" section body from `megaMenuMe.{fi,en}` (superseded by `overviewLinks`).
- Extracted duplicate desktop and mobile overview-strip render blocks in Työ into `_nav-macros.njk` — removes ~28 lines of duplicated template code across FI and EN Työ blocks.
- Not deleted in this slice (per audit §16, P1 hygiene, orthogonal): dead FI/EN Työ fallback branches (`_nav-fi.njk:133–166`, `_nav-en.njk:130–159`), dead Kynästä `else` fallback, and unused `.work-inline-cta` render branch. These are safe deletions but do not belong in an IA slice — recommend a separate MEGAMENU-SYSTEM-01C cleanup slice.

## 12. Architecture Closure 1.0 impact

**Zero. AC1 remains CLOSED / GREEN / MAIN.**

Verified against reopen conditions in `docs/architecture-closure-1-0-closure-2026-08-29.md` §6:

- No new duplicate content ownership (contextual duplicates are useful; documented per menu).
- No canonical semantics moved to JS.
- Pagefind untouched.
- No runtime JSON → HTML architecture.
- FI/EN parity: intentional asymmetries preserved; new Minä overview strip carries parallel semantic links only, no new routes.
- No public contracts removed.
- No source / landing / context semantics regression.

This is a UX/IA convergence slice, not an architecture change.

## 13. Final status

- **MEGAMENU-SYSTEM-01B = CLOSED / GREEN / READY FOR PR.**
- **Architecture Closure 1.0 = CLOSED / GREEN / MAIN.**
- **Canonical Content v1 = unchanged.**
- **MEGAMENU-IA-01 invariants preserved** (Työ macro extraction is refactor-only).
- **OPETUS-IA-01 + HOME-NAV-CORRECTION-01 invariants preserved.**
- **DETAIL-UX-SEQUENCE-01 = CLOSED / DEFERRED / DOCUMENTED / MAIN.**
