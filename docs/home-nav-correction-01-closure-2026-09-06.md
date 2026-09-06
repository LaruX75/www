# HOME-NAV-CORRECTION-01 — closure (2026-09-06)

Small, bounded homepage navigation/copy correction addressing the two
proven UX-CORNERS-01 findings that survived the F3C Presentations
reconciliation. Additive on FI; label-only fix on EN. No architecture
impact.

## 1. Base

- Base SHA: `e299d0d41181e34b640970c8d2e75889482c5f33` (origin/main after PR #217 merge)
- Branch: `feat/home-nav-correction-01`
- Audit references: `docs/ux-corners-01-audit-2026-09-06.md`, `docs/ux-corners-01-presentations-f3c-reconciliation-2026-09-06.md`
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (unchanged)
- Canonical Content v1 = unchanged
- F3C Presentations Find & Explore = **CLOSED / GREEN / MAIN** (unchanged; UX-CORNERS-01 F1 was retracted as false positive)

## 2. F3 correction (FI)

Added a fifth `home-path-card` tile to the homepage "Mitä etsit?" discovery section in `src/_data/pageContent/etusivu.json`:

```json
{
  "icon": "bi-mortarboard",
  "title": "Opetus",
  "desc": "Julkiset kurssisivut ja opetukseen liittyvät kokonaisuudet: kurssitoteutukset, luentomateriaalit, opetusportfolio ja opiskelijapalaute.",
  "cta": "Opetus-sivulle →",
  "href": "/opetus/"
}
```

- Placed immediately after the existing "Työ" tile so the ordering reads Työ → Opetus → Kynästä → Mediassa → Politiikka. This preserves the Työ-first umbrella semantics while surfacing Opetus as a first-class discovery destination.
- Reused the existing `home-path-card` markup (`src/index.njk:120-127`) and data shape. No new component. No new CSS.
- Verified on the built page: FI home renders exactly 5 `home-path-card` tiles; Opetus tile is present with correct href, title, description, and CTA.

## 3. F4 correction (EN)

Changed one link label in `src/en/index.njk:220`:

```diff
- <a href="/en/portfolio/" class="btn btn-outline-primary rounded-pill px-4">Teaching</a>
+ <a href="/en/portfolio/" class="btn btn-outline-primary rounded-pill px-4">Teaching portfolio</a>
```

- Destination is unchanged (`/en/portfolio/`).
- The naked "Teaching" label was semantically wrong: it implied a teaching offerings / course landing, but the destination is the teaching portfolio (pedagogical evidence).
- Relabelling to "Teaching portfolio" makes destination and promise agree. No routing change. No new page.

## 4. Exact FI/EN semantics

| Language | Home affordance | Destination | Rationale |
|---|---|---|---|
| FI | "Opetus" tile in "Mitä etsit?" | `/opetus/` (real SSR landing, OPETUS-IA-01) | Real teaching landing exists on FI side |
| EN | "Teaching portfolio" button | `/en/portfolio/` (existing) | No EN teaching landing exists; label matches destination |

**FI ≠ EN parity here is intentional.** OPETUS-IA-01 explicitly kept the 405040Y course page FI-only (`translationKey: course_405040y_2026_a_fi_only`) and did not synthesize any `/en/opetus/`. This correction preserves that policy — it does NOT create an EN teaching landing to match the FI tile.

## 5. Why no EN Opetus surface was created

Per OPETUS-IA-01 closure §5 ("EN handling and rationale"):

> **No EN counterpart added.** The FI course page is FI-only … Adding an empty or synthetic `/en/opetus/` shell would misrepresent the content.

This correction re-affirms that policy. Synthetic `/en/opetus/` or `/en/teaching/` remains OUT OF SCOPE.

## 6. Public-contract impact

- **Runtime JS added:** **zero.** No new page-JS. No new event handlers.
- **Canonical Content v1 impact:** **zero.**
- **Public JSON impact:** **zero.** No `/data/*` endpoint changed.
- **JSON-LD impact:** **zero.** No template metadata change.
- **Pagefind impact:** **zero.** No new meta attributes; homepage indexing rule unchanged.

## 7. Architecture Closure 1.0 impact

**Zero. AC1 remains CLOSED / GREEN / MAIN.**

- No canonical semantics moved to JS.
- No runtime JSON → HTML duplication.
- No Pagefind acting as canonical storage.
- No source/landing/context regression.
- No new taxonomy.
- SSR-first preserved.

## 8. F3C Presentations impact

**Zero. F3C remains CLOSED / GREEN / MAIN.** This slice does not touch `/esitykset/`, `/en/presentations/`, or the presentation-archive JS stack (`presentations-page.js`, `content-engine.js`, `pe-list-render.js`, `content-presets.js`).

## 9. Files changed

**Modified:**
- `src/_data/pageContent/etusivu.json` — added the Opetus tile (5 lines JSON).
- `src/en/index.njk` — relabelled one button (single-word change on line 220).

**New:**
- `tests/home-nav-correction-01.spec.js` — regression suite (11 tests across 5 groups).
- `docs/home-nav-correction-01-closure-2026-09-06.md` — this file.

## 10. Tests

New spec `tests/home-nav-correction-01.spec.js` — **11/11 green** across 5 groups:

- **F3 (4 tests):** FI home has Opetus tile with href `/opetus/`; existing Työ / Kynästä / Mediassa / Politiikka tiles retained; `/opetus/` resolves to a real SSR landing (not a redirect stub); exactly 5 tiles rendered.
- **F4 (4 tests):** EN home button now labelled exactly "Teaching portfolio" pointing at `/en/portfolio/`; old naked "Teaching" label for the same destination removed; no `/en/opetus/` or `/en/teaching/` link on EN home; those routes do NOT exist as real pages (404-class response); existing Research + Societal engagement buttons retained.
- **Lang-switch (2 tests):** FI home does not gain `/en/opetus/` in hreflang or nav; `/opetus/` page carries no `hreflang="en"` alternate to `/en/opetus/`.
- **No runtime JS (1 test):** FI home does not fetch any runtime JSON for the new Opetus tile.

Adjacent regression: `tests/opetus-ia-01.spec.js` remains green (17 tests). `tests/navigation.spec.js` remains green. Full suite spot-check across `home-nav-correction-01` + `opetus-ia-01` + `navigation`: 33 passed.

Build: `CACHE_ONLY=true npx @11ty/eleventy` exit 0, 1479 files. Pagefind regenerated.

## 11. Deletion / simplification

- No deletion. Additive change on FI (one JSON entry). Label-only fix on EN.
- No obsolete label or duplicate nav entry became redundant.
- Homepage refactoring explicitly out of scope.

## 12. Final status

- **HOME-NAV-CORRECTION-01 = READY FOR MERGE.**
- **Architecture Closure 1.0 = CLOSED / GREEN / MAIN.**
- **Canonical Content v1 = unchanged.**
- **F3C Presentations Find & Explore = CLOSED / GREEN / MAIN.**
- **DETAIL-UX-SEQUENCE-01 = CLOSED / DEFERRED / DOCUMENTED / MAIN.**
