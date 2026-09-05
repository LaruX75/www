# OPETUS-IA-01 — closure (2026-09-05)

Slice 1 of the OPETUS-IA-01 audit: SSR `/opetus/` landing + navigation
wiring. Turns the previously-redirected `/opetus/` route into a real
teaching landing that exposes the existing 405040Y course-implementation
page and clearly separates course structure from teaching-adjacent
surfaces (portfolio, student feedback, university-work profile).

## 1. Base

- Base SHA: `33af97fd0541aa7e1481f3f3b517e597502704df` (PR #214 merge on main)
- Branch: `feat/opetus-ia-01`
- Audit reference: `docs/opetus-ia-01-audit-2026-09-05.md` (already on main via this PR)
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (preserved)
- Canonical Content v1 = **unchanged**

## 2. Final route ownership for `/opetus/`

Before this PR:
- `/opetus/` = **legacy redirect** to `/tyoni-yliopistonlehtorina/` (`src/legacy-redirects/opetus.njk`).
- No teaching landing.

After this PR:
- `/opetus/` = **real SSR landing page** (`src/fi/opetus.md`).
- Legacy redirect removed. No client-side refresh. No conflicting redirect anywhere.
- Verified: `_site/opetus/index.html` contains `<h1>Opetus</h1>` and zero `http-equiv="refresh"` markers.

## 3. Verified 405040Y course URL

Canonical/local route: **`/opetus/teknologiatuettu-oppiminen/2026-2027-a/`**.

- Verified by inspecting `src/opetus/teknologiatuettu-oppiminen-2026-a.md` frontmatter permalink.
- The alias `/opetus/teknologiatuettu-oppiminen/2026-a/` remains as a separate legacy redirect (`src/legacy-redirects/opetus-teknologiatuettu-oppiminen-2026-a.njk`) — out of scope for this slice, unchanged.
- The Opetus landing links to the canonical URL, not the alias.

## 4. Final FI navigation structure

`src/_data/headerNav.js` `megaMenuWork.fi.sections[0]` ("Yliopistotyö") gains a new first link:

```
Opetus                (/opetus/)                — new
Esitykset             (/esitykset/)             — unchanged
Opetusportfolio       (/portfolio/)             — unchanged
Ansioluettelo         (/cv/)                    — unchanged
Opiskelijapalaute     (/opiskelijoiden-antamaa-palautetta/) — unchanged
```

Rationale:
- `Opetus` is the new entry point for teaching structure (course implementations).
- `Esitykset`, `Opetusportfolio` and `Opiskelijapalaute` retain their pre-existing places — they remain semantically distinct surfaces and are cross-linked from the Opetus landing itself (in the "Opetukseen liittyvät kokonaisuudet" section).
- The mega-menu section heading is data-driven ("Yliopistotyö") and unchanged. The audit had considered renaming the historical "Opetus & portfoliot" fallback heading; that heading is only in the hardcoded else branch of `_nav-fi.njk` for the non-four-columns layout, which the FI nav does not currently use.

The `Työ` mega-menu trigger's active-URL match list already includes `/opetus/` — no change needed.

## 5. EN handling and rationale

**No EN counterpart added.** The FI course page is FI-only (its frontmatter carries `translationKey: course_405040y_2026_a_fi_only`). Adding an empty or synthetic `/en/opetus/` shell would misrepresent the content.

Explicit FI-only asymmetry:
- Opetus landing frontmatter: `translationKey: teaching_fi_only`.
- No changes to `src/_data/headerNav.js` `megaMenuWork.en.sections`.
- Regression test asserts `/en/opetus/` and `/en/teaching/` do NOT exist as routes and are NOT linked from the EN home nav.

This asymmetry is intentional and documented. When EN teaching content ships in the future, an EN counterpart can be added as a separate slice.

## 6. Deleted legacy redirect / other cleanup

- **Deleted**: `src/legacy-redirects/opetus.njk` (redirect from `/opetus/` to `/tyoni-yliopistonlehtorina/`). The new landing owns the route; no consumer or inbound reference of that redirect remains.
- No other deletions. All other legacy redirects preserved (including `/opetus/teknologiatuettu-oppiminen/2026-a/` → `/2026-2027-a/`).

## 7. SSR / runtime-JS status

- **Runtime JS added: 0.** The landing is pure Nunjucks/Markdown, no `pageScripts`, no data-attribute JS handlers.
- **No `pageStyles` added** — uses existing Bootstrap utility classes only.
- **No `pageShell` gymnastics** — `pageShell: true` follows the same convention as `src/fi/tutkimus.md`.
- Regression test asserts no runtime course-related JSON fetch happens on landing load.

## 8. Canonical impact

**Zero.** No changes to:
- `docs/canonical-content-contract-v1.md`
- Presentation `courseContexts[]` schema
- Any canonical projection helper (`presentationsPage.js`, `presentations.11tydata.js`, etc.)
- Public JSON contracts
- Pagefind indexing rules

## 9. Architecture Closure 1.0 impact

**Zero.** AC1 stays **CLOSED / GREEN / MAIN**:
- No Content Graph runtime integration.
- No new taxonomy.
- No new context membership.
- No parallel client-side content model.
- No SPA.
- No `document.referrer` reliance.

## 10. Tests and measurements

New spec `tests/opetus-ia-01.spec.js` — **17/17 green** across 8 groups (A–H):

- **A** (2): `/opetus/` is a real SSR landing (not a redirect); meaningful SSR content with JS disabled.
- **B** (2): landing links to the verified 405040Y course; that link resolves to the real course page.
- **C** (4): teaching-adjacent surfaces present but distinct (portfolio, student feedback, työprofiili); explicit copy invariant "eivät ole kurssirakenteen korvikkeita".
- **D** (2): no meta-refresh; not the legacy stub.
- **E** (1): FI home nav includes `/opetus/`.
- **F** (2): no synthesized `/en/opetus/` or `/en/teaching/`.
- **G** (1): no runtime course JSON fetch.
- **H** (3): exactly one `<h1>`; labelled `<h2>` section headings; primary CTA is a real SSR link.

Adjacent regression suite across `detail-ux-orient-01`, `detail-ux-01c-b-course`, `detail-hero-01`, `navigation`, `o1-orientation`: **118 passed**, 1 flaky-recovered (Pagefind search dialog — historical timing flake), 1 pre-existing baseline failure (`o1-orientation:119` presentation archive brittle "first non-local" locator).

Build: `CACHE_ONLY=true npx @11ty/eleventy` exit 0, `Copied 275 Wrote 1479 files`.
Pagefind: index regenerated post-build.

## 11. Known pre-existing baseline failures (NOT caused by this branch)

Verified stable across recent workstreams:

1. `tests/o1-orientation.spec.js:119` — brittle "first non-local link on presentation archive" locator; bit-rotted as more local /presentations/ lectures were added.
2. `tests/navigation.spec.js:143` — Pagefind search dialog Finnish-term test is timing-flaky. Playwright marks it as `flaky` (passes on first retry). Documented in PR #200 rerun.

None worsened by this branch. Not fixed here (out of scope).

## 12. IA-2 remains explicitly NOT implemented

The OPETUS-IA-01 audit identified a canonical schema gap (`periodId` on Presentation `courseContexts[]`) that would enable a presentation → course-implementation reverse link. **This slice does not touch that gap.**

- No `periodId` added to Canonical Content v1.
- No presentation-side course-implementation backlink.
- No archive surface for historical 410014Y / 410017Y content.
- DETAIL-UX-SEQUENCE-01 remains CLOSED / DEFERRED / DOCUMENTED / MAIN — unchanged by this slice.

IA-2 would be a separate audit + PR + closure sequence, gated on the independent canonical-content justification already documented in the audit doc.

## 13. Files changed

**New:**
- `src/fi/opetus.md` — the real Opetus landing (SSR).
- `tests/opetus-ia-01.spec.js` — regression suite (17 tests).
- `docs/opetus-ia-01-closure-2026-09-05.md` — this file.

**Modified:**
- `src/_data/headerNav.js` — added `Opetus` link to `megaMenuWork.fi.sections[0].links[]`.

**Deleted:**
- `src/legacy-redirects/opetus.njk` — obsolete redirect superseded by the real landing.

**Also included (from audit branch):**
- `docs/opetus-ia-01-audit-2026-09-05.md` — the audit that authorized this slice.

Estimated net diff: ~250 lines added (mostly test spec + landing), ~15 lines removed (legacy redirect + 2 lines of dead nav copy replaced by new nav entry).
