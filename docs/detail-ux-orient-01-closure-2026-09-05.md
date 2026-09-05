# DETAIL-UX-ORIENT-01 — closure (2026-09-05)

Post-closure UX improvement in three semantic layers:

1. **PRIMARY ACTION** — hero-actions row, only when a real action exists.
2. **SITE ORIENTATION** — always-visible SSR link to the domain hub. Delivered by sidebar `content-context-archive-link` on Media / Presentation / Writing / Blog; delivered by trailing `<footer class="content-detail-orientation">` on Publication / Thesis (whose sidebar link points at the `/kynasta/` topical umbrella, not the domain archive).
3. **RETURN TO ORIGIN** — contextual, JS-revealed. Trailing `<footer class="content-detail-origin">` on Media / Presentation / Writing. Anchor label comes from a new `returnLabel` URL param, so the visible text can name the origin ("Takaisin kurssille 405040Y", "Takaisin esityksiin", "Takaisin mediaan") instead of the generic default.

## 1. Base

- Base SHA: `457b8f061888b48b0562e95eb5f542cabe5f96d9` (PR #212 merge on main)
- Branch: `feat/detail-ux-orient-01`
- Audit reference: `docs/detail-ux-orient-01-cross-domain-audit-2026-09-05.md`
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (preserved, no reopen)
- Canonical Content v1 = **unchanged**

## 2. UX invariants enforced

> **PRIMARY ACTION ≠ SITE ORIENTATION ≠ RETURN TO ORIGIN ≠ SEQUENCE NAVIGATION.** Each layer answers a different user question. Do not collapse them into a single control.

> **Hero-actions row hosts only true primary actions.** If no source exists (Writing lausunto), the wrapper is dropped entirely — no empty div, no lone leaving link.

> **Return-to-origin renders only when the origin is known.** If the current URL carries no valid `?returnTo=` state, the return-link stays hidden and the SSR site-orientation link (sidebar / trailing hub-link) is the sole navigation affordance. Canonical domain hub is NEVER a return-to-origin fallback — no synthetic "Takaisin domainiin" appears without a real origin.

> **Return-to-origin label names the destination when possible.** Never generic "Takaisin". If origin is derivable in the linking context, pass a `returnLabel` in the URL state. Missing `returnLabel` on legacy Find & Explore links falls back to the localized "Takaisin hakutuloksiin" / "Back to results" default (accepted for backward compatibility).

> **One semantic purpose → one link.** Sidebar archive-link and return-to-origin may resolve to the same URL only when they answer different questions in the user's flow. When they would truly duplicate, the JS suppresses the return-link (via `data-detail-return-fallback` peer check — see §5).

## 3. Return-to-origin URL contract (new)

```
?returnTo=<local-url>&returnLabel=<contextual label>
```

- **`returnTo`** — same-origin URL. Existing O1 semantics unchanged (allowlist, non-duplicate, JS-side deduplication vs. fallback and self).
- **`returnLabel`** — contextual anchor textContent. New in this workstream.
  - Sanitized in `src/js/site-ui.js`: length-cap 80, whitespace collapsed, `textContent`-only injection (XSS-safe).
  - Optional. When absent, JS falls back to the SSR default label stored on the anchor as `data-detail-return-default-label`.
- **`data-detail-return-default-label`** — new attribute on every return-link anchor. Preserves the SSR default so JS can restore it after a returnLabel is invalidated.

## 4. Source-side generators (all updated)

| Source | Location | Return label emitted |
|---|---|---|
| Find & Explore search (JS-side) | `src/js/find-explore.js` `withReturnTo()` | `"Takaisin hakutuloksiin"` (FI) / `"Back to results"` (EN), auto-derived from `<html lang>` |
| Presentation archive cards (SSR) | `src/_includes/presentations/result-card.njk` | `"Takaisin esityksiin"` (FI) / `"Back to presentations"` (EN), overridable via `cardReturnLabel` param |
| Media FI archive (SSR + inline JS) | `src/fi/mediassa.njk` (SSR opening cards + `detailUrlWithReturn` helper) | `"Takaisin mediaan"` (FI) |
| Media EN archive (SSR) | `src/en/media.njk` | `"Back to media"` (EN) |

## 5. Consumer (JS)

`src/js/site-ui.js:93-148`:

- Iterates `[data-detail-return-link]`.
- Reads `returnTo` + `returnLabel` from current page URL.
- Validates returnTo: same-origin + allowlist prefix (`data-detail-return-prefixes`) + non-duplicate of the suppression peer (`data-detail-return-fallback`) + non-self.
- On valid: unhides link, sets `href = returnTo`, sets `textContent = returnLabel || defaultLabel`.
- On invalid: hides link (`d-none`), restores `textContent = defaultLabel`. **Does NOT assign the fallback as the anchor's href** — canonical domain hub is not a return-to-origin destination.

### `data-detail-return-fallback` — semantics narrowed

Purpose: **DUPLICATE-SUPPRESSION ONLY.** The value is a canonical hub URL that the JS compares against the incoming `returnTo` to prevent rendering a return-link that would duplicate the always-visible SSR site-orientation link (sidebar `content-context-archive-link` or trailing hub-link). Example: user arrives on Publication detail with `?returnTo=/julkaisut/`; since the trailing footer hub-link also points at `/julkaisut/`, the return-link is suppressed (already covered by the always-visible hub-link).

Not a destination: JS never assigns this URL to the anchor's `href`. The anchor SSR placeholder is `href="#"`.

### Anchor SSR default (`href="#"`)

Both `detail-return-link.njk` and the return-link inside `detail-orientation.njk` ship with `href="#"` as the SSR value. This is a deliberate placeholder — the anchor is `d-none` at SSR, and the real href is only assigned by JS when a valid return context exists. If JS is unavailable the anchor stays hidden and no synthetic "back to hub" link is presented.

## 6. Files changed

### New

- `src/_includes/detail-return-link.njk` — slim return-link partial (return-link only, no hub-link, no `<nav>`).

### Modified

- `src/js/site-ui.js` — added `returnLabel` support with sanitizer + `data-detail-return-default-label` fallback.
- `src/js/find-explore.js` — `withReturnTo()` now appends `returnLabel` derived from `<html lang>`.
- `src/_includes/detail-orientation.njk` — return-link now exposes `data-detail-return-default-label` so JS can restore it.
- `src/_includes/presentations/result-card.njk` — appends `returnLabel` alongside `returnTo`.
- `src/fi/mediassa.njk` — SSR + inline JS return links append `returnLabel=Takaisin mediaan`.
- `src/en/media.njk` — SSR Details (FI) link appends `returnLabel=Back to media`.
- `src/_includes/presentation-item.njk` — hero-actions holds only CTA; new trailing `<footer class="content-detail-origin">` renders `detail-return-link.njk`.
- `src/_includes/media-item.njk` — same pattern.
- `src/_includes/writing-post.njk` — same pattern; return-link works even on no-source Writing (independent of hero-actions wrapper).
- `src/_includes/publication-item-body.njk` — hero orientation removed; trailing `<footer class="content-detail-orientation">` renders `detail-orientation.njk` (hub-link + return-link) → different destination from sidebar `/kynasta/`.
- `src/_includes/thesis-detail-body.njk` — same trailing footer pattern.
- `src/_includes/blog-post.njk` — removed card-footer `Takaisin blogiin` (duplicate of sidebar). Removed dead `txt.back` / `txt.backHref` entries.
- `tests/detail-hero-01.spec.js` — `expectsOrientation` flags updated: `true` for Publication/Thesis (trailing footer has hub-link), `false` for Presentation/Media/Writing (no hub-link — sidebar covers orientation).
- `tests/o1-orientation.spec.js` — 4 tests updated to reflect hub-link vs return-link separation. Return-link mechanism still exercised on all domains.

### New tests

- `tests/detail-ux-orient-01.spec.js` — 41 tests across 10 groups (A–J), covering hero purity, site-orientation placement, return-to-origin trailing region, URL label contract, primary CTA preservation, DETAIL-UX-01C-B-COURSE invariants, SSR-only render, Blog cleanup.

### Docs

- `docs/detail-ux-orient-01-cross-domain-audit-2026-09-05.md` (pre-existing audit — reference)
- `docs/detail-ux-orient-01-closure-2026-09-05.md` (this file)

## 7. Domain-by-domain matrix

| Domain | Hero primary CTA | Hero orientation/return | Site orientation | Return-to-origin | Duplicate? |
|---|---|---|---|---|---|
| **Presentation** | conditional (`publicSourceHref`) | ❌ none | sidebar → `/esitykset/` | trailing `<footer.content-detail-origin>` with return-link | **NO** |
| **Media** | conditional (`sourceHref`) | ❌ none | sidebar → `/mediassa/` | trailing `<footer.content-detail-origin>` with return-link | **NO** |
| **Writing (with source)** | conditional (`externalSourceHref`) | ❌ none | sidebar (dynamic per type) | trailing `<footer.content-detail-origin>` with return-link | **NO** |
| **Writing (no source)** | (dropped wrapper) | ❌ none | sidebar (dynamic per type) | trailing `<footer.content-detail-origin>` with return-link (independent) | **NO** |
| **Publication** | conditional (DOI) | ❌ none | trailing `<footer.content-detail-orientation>` → `/julkaisut/` | same footer (hub+return via shared partial) | **NO** — sidebar `/kynasta/` = different destination |
| **Thesis** | OuluREPO CTA | ❌ none | trailing `<footer.content-detail-orientation>` → `/opinnaytteet/` | same footer | **NO** — sidebar `/kynasta/` = different destination |
| **Blog** | conditional (external source) | ❌ none | sidebar → `/blogi/` | (no return-link — Blog is not a Find & Explore surface) | **NO** — card-footer duplicate REMOVED |

## 8. `detail-orientation.njk` consumer count

| Before | After |
|---|---|
| 5 (media, presentation, publication, thesis, writing) — all in hero-actions | **2** (publication, thesis) — both in trailing footer |

New partial `detail-return-link.njk` = 3 runtime consumers (media, presentation, writing).

## 9. Semantic gate: `/kynasta/` vs domain hub

Per user semantic-gate directive:

- `/kynasta/` (Kynästä-umbrella) = content-context / topical discovery. Answered by sidebar `content-context-archive-link`.
- `/julkaisut/` or `/opinnaytteet/` = SITE ORIENTATION domain hub. Answered by trailing `<footer>` on Publication / Thesis.

Two links, two questions, no duplicate.

## 10. Empty-wrapper verification

`empty-wrapper=0` on all 7 verified pages. Writing-no-source drops `.content-detail-actions` entirely. Trailing `content-detail-origin` region is independent — it does not require a primary CTA.

## 11. FI / EN parity

- All labels sourced via `orientationLang` / `currentLang` / `isEnglish` / `isEn` per template convention.
- JS `find-explore.js` reads `<html lang>` and emits `"Takaisin hakutuloksiin"` (FI) / `"Back to results"` (EN).
- SSR label overrides in Media/Presentation archives are per-locale template.
- Return-link fallback labels default to language-appropriate defaults.
- All existing hub labels + `orientationReturnPrefixes` preserved.

## 12. Accessibility

- Heading hierarchy unchanged.
- Reading order improved: primary CTA (hero) → content → context → direct relationships → discovery → SITE ORIENTATION → RETURN-TO-ORIGIN.
- Keyboard tab order: primary CTA reached first in hero on all 5 domains (previously violated on Publication + Writing where orientation was first).
- Return-link anchor keeps its own `data-detail-return-default-label` fallback — no dangling "back to something" text when JS invalidates the returnTo.
- Label sanitization: `textContent`-only injection, length-cap 80, whitespace normalization. No HTML injection surface via URL.
- JS-disabled: SSR test coverage in `tests/detail-ux-orient-01.spec.js` group I verifies sidebar orientation + hidden (`d-none`) trailing return-link across 5 domains.

## 13. Regression tests

New spec `tests/detail-ux-orient-01.spec.js` — 41 tests across 10 groups.

Test groups:
- **A** (6): hero holds no orientation/return markers.
- **B** (7): SITE ORIENTATION placement per domain.
- **C** (5): RETURN-TO-ORIGIN trailing region + writing-no-source independence.
- **D** (5): return label URL contract (label rendered / sanitized / fallback / cross-origin blocked / find-explore emits returnLabel).
- **E** (1): presentation archive cards carry returnLabel=Takaisin+esityksiin.
- **F** (2): Publication/Thesis dual link (Kynästä + domain hub).
- **G** (5): primary CTAs preserved.
- **H** (3): DETAIL-UX-01C-B-COURSE invariants.
- **I** (5): meaningful without JS.
- **J** (2): Blog card-footer duplicate removal + sidebar preservation.

Full regression suite across `detail-ux-orient-01`, `detail-ux-01c-b-course`, `detail-ux-01a`, `detail-hero-01`, `o1-orientation`, `presentations-archive`, `media-archive`: **129 passed, 2 failed** (both pre-existing baseline).

## 14. Known pre-existing baseline failures (NOT caused by this branch)

Verified present on baseline (`origin/main` = `457b8f06`) via `git stash` + rebuild in prior iteration:

1. `tests/detail-ux-01a.spec.js:114:3 › D › JSON-LD contains DOI destination` — Publication DOI absent from JSON-LD script. Documented in PR #212 closure.
2. `tests/o1-orientation.spec.js:119:1 › FI presentation archive decorates local card links with returnTo` — brittle "first non-local link" locator, bit-rotted as more local /presentations/ lectures were added.
3. Unit tests (untouched): `presentationsPage.test.js` × 2 (PR #212 field-addition leftover), `searchQualityRegressionBenchmark.test.js` × 2 (corpus size drift).

None worsened by this branch.

## 15. Deletion / simplification

Applied:

- Blog card-footer back-link + wrapper: 4 lines.
- Blog `txt.back` + `txt.backHref` dead entries: 2 lines.
- Hero orientation include + set-vars in 5 templates removed (each ~5 lines).

Not deleted (correctly retained):

- `src/_includes/detail-orientation.njk` — 2 runtime consumers (Publication/Thesis trailing footers).
- `.content-detail-actions .btn.btn-primary` CSS — still used by primary CTAs.
- `content-context-sidebar.njk` / `content-context-archive-link` — orthogonal.
- `orientationCtx` in writing-post.njk — used for return-link fallback (dynamic per writing type).

## 16. Architecture Closure 1.0 status

**CLOSED / GREEN / MAIN.**

- Canonical Content v1 unchanged.
- Pagefind unchanged.
- Content Graph unchanged.
- O1 primitives preserved and extended with contextual label support (URL-state contract, not canonical content).
- Public JSON unchanged.
- No runtime JS additions beyond return-label read + sanitize (~20 lines) and the dead-code removal of the fallback-href-set (~2 lines).
- No new abstraction beyond the slim `detail-return-link.njk` partial (justified by decomposition of two independent O1 concerns).
- No SPA routing, no history-back magic, no `document.referrer` reliance.

## 17. Candidate follow-up workstream (NOT implemented in this PR)

### DETAIL-UX-SEQUENCE-01 — Sequence navigation

**Goal:** ordered prev/next navigation between detail pages when — and only when — canonical data proves a meaningful ordered whole. Distinct from RETURN TO ORIGIN and SITE ORIENTATION.

**First audit candidate:** Presentation → same-course lectures. Data source: `courseContexts[].courseId` (already canonical, used by DETAIL-UX-01C-B-COURSE `Samalla kurssilla`). Same peers, but ordered (by lecture date ASC or explicit lecture number) and rendered as prev/next controls with contextual labels.

Example (405040Y luento 2):

```
← Luento 1 — Johdanto                    Luento 3 — Tekoälylukutaito →
```

paired with the DETAIL-UX-ORIENT-01 return-to-origin:

```
← Takaisin kurssille 405040Y
```

**Semantic separation:**

| Layer | Answers |
|---|---|
| PRIMARY ACTION | *What can I do with this content?* |
| SITE ORIENTATION | *Where does this content live in the site structure?* |
| RETURN TO ORIGIN | *Where did I come from and how do I return?* |
| SEQUENCE NAVIGATION | *Where can I go within the ordered whole this content is part of?* |

**Explicit non-goals for the first slice:**

- Search-result prev/next (Find & Explore result pagination) does NOT belong here — that would be a separate contract based on JS-side search state, not canonical data.
- Cross-domain sequences (e.g. "next publication in this research line") — not in scope for the first slice.
- Automatic sequence inference from taxonomy — must be canonical-proven.

**Boundary preserved:**

- Canonical Content v1 unchanged. Uses existing `courseContexts[].courseId` + date ordering.
- No new taxonomy, no runtime JS, SSR-only.
- Content Graph continues as modeling/verification tool only.

This is a candidate — implementation gated on user approval and repo evidence that same-course lecture ordering is unambiguous (date DESC/ASC choice, tie-breaks, missing dates).
