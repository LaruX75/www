# DETAIL-UX-01C-B-COURSE — closure (2026-09-05)

Bundle: "Samalla kurssilla" SSR peer-section on Presentation detail
pages + Kempele semantic verification. The Kempele slice was
re-checked and expanded on 2026-09-05 to expose the third
independent canonical field (`location` → **Paikka**) so that
place, usage-context type and organiser never conflate.

## Status
- Branch: `feat/detail-ux-01c-b-course` (rebased onto `origin/main` = `96607768` after PR #211 merge)
- Baseline before rebase: `b975998f` (Architecture Closure 1.0 = CLOSED/GREEN/MAIN)
- Result: 17/17 dedicated Playwright tests green (13 → 17 after Paikka-slice)
- Build: `CACHE_ONLY=true npx @11ty/eleventy` → exit 0, `Copied 275 Wrote 1480 files`
- Canonical Content v1: **not extended** (uses existing §3 `location`, `kategoria`, `jarjestaja` + `courseContexts[].courseId`)
- Content Graph: **not called at render time** (kept as modeling/verification tool only, per R1 ADR1)

## Files changed
- `src/_data/presentationsPage.js` — added `kategoria`, `jarjestaja` to the canonical Presentation page record (fields already exist on the Canva projection; this only routes them to the detail template).
- `src/presentations/presentations.11tydata.js` — new `selectPeerPresentationsByCourse(data)` helper + three `eleventyComputed` fields (`peerPresentationsByCourse`, `kategoria`, `jarjestaja`).
- `src/_includes/presentation-item.njk` — two additions inside the existing `presentation-detail-support` region: (a) two new `<dl>` rows (`Käyttöyhteys`, `Järjestäjä`) inserted BEFORE the existing rows so the type/organiser semantics never conflate; (b) `content-detail-course-peers` `<section>` rendered ONLY when peers exist.
- `tests/detail-ux-01c-b-course.spec.js` — new regression suite (13 tests, 5 groups A–E).

## Canonical peer-selection rule (exact)

Peer presentation is included iff it shares at least one
`courseContexts[].courseId` with the current presentation. No graph
traversal, no similarity heuristic, no runtime JS.

- **Source of truth:** `buildCanonicalPresentationPageLookup(data)` (canonical projection, fully resolved before `eleventyComputed`). Peer `courseContexts` is read from the canonical record — never from `item.data.courseContexts` on `collections.presentations`, because that field is itself computed and is not guaranteed to be resolved on other items at compute time.
- **Sort:** `date` DESC (newer lectures first), then `title` ASC (fi collation) for stability.
- **Cap:** `PEER_LIMIT = 6` (caller-side hard cap).
- **Self-exclusion:** current `page.url` excluded.
- **Empty state:** section omitted entirely — no "ei muita sisältöjä" placeholder.
- **Language:** section heading and lead sentence flip on `currentLang`.

## Verification results

| Case | Course | Expected | Observed |
|---|---|---|---|
| 405040Y positive (three luento pages) | 405040Y (3-item group) | 2 peers each (self excluded) | 2/2/2 ✓ |
| 410014Y bounded | 410014Y (19-item group, capped) | exactly `PEER_LIMIT=6` | 6 ✓ |
| Kempele negative control | none (`courseReview.status=rejected`) | section OMITTED | 0 course-peer sections ✓ |

## Kempele semantic verification (bundled)

Contract: three INDEPENDENT canonical Presentation type-specific
fields (Canonical Content v1 §3) MUST render under three separate
`<dt>` labels so their semantics never conflate.

| Label | Canonical field | Kempele value | Semantics |
|---|---|---|---|
| Paikka | `location` | Kempele | geographic place |
| Käyttöyhteys | `kategoria` | Täydennyskoulutus | usage-context type |
| Järjestäjä | `jarjestaja` | Kempeleen kunta (VESO-koulutus) | organiser entity |

All three fields already exist on the canonical Presentation
projection (`location` via `withPresentationSemantics` + `inferLocation`
fallback; `kategoria` and `jarjestaja` directly on the Canva projection).
This workstream only **routes** them to the detail template. **No new
canonical field. No new taxonomy. `jarjestaja` is NOT relabeled as
Paikka.**

### Non-conflation regressions (D-group in `tests/detail-ux-01c-b-course.spec.js`)

- `<dt>Käyttöyhteys</dt><dd>Kempeleen kunta …</dd>` — MUST NOT match (organiser leaked into type)
- `<dt>Käyttöyhteys</dt><dd>Kempele</dd>` — MUST NOT match (place leaked into type)
- `<dt>Paikka</dt><dd>Kempeleen kunta …</dd>` — MUST NOT match (`jarjestaja` relabeled as Paikka)
- Reading order: Paikka BEFORE Käyttöyhteys BEFORE Järjestäjä (semantic hierarchy)

## Playwright regression suite (`tests/detail-ux-01c-b-course.spec.js`)

- **A. Positive — 405040Y peer group:** for each of the three luento pages, exactly 2 peers rendered, and self URL not present in peer `<ul>`.
- **B. Bounded — 410014Y peer group:** cap enforced at PEER_LIMIT=6.
- **C. Negative control — Kempele:** no `content-detail-course-peers` section and no "Samalla kurssilla" heading.
- **D. Kempele semantic verification (three independent labels):**
  - `<dt>Paikka</dt><dd>Kempele</dd>` (canonical `location`)
  - `<dt>Käyttöyhteys</dt><dd>Täydennyskoulutus</dd>` (canonical `kategoria`)
  - `<dt>Järjestäjä</dt><dd>Kempeleen kunta (VESO-koulutus)</dd>` (canonical `jarjestaja`)
  - three non-conflation checks + reading-order check
- **E. Meaningful without JavaScript:** peer section and all three Kempele rows present in SSR HTML with `javaScriptEnabled: false`.

Result: **17/17 green** in `PLAYWRIGHT_USE_STATIC_SERVER=true`.

## Unrelated pre-existing test failures noted

Both are present on baseline and untouched by this PR:

1. `tests/detail-ux-01a.spec.js` › `D` › `JSON-LD contains DOI destination` fails on `/julkaisut/0669729323/`. DOI is present in the page (sidebar, APA citation, pagefind meta) but not in the JSON-LD script. Out of scope; DETAIL-UX-01A follow-up.
2. `tests/presentations-source-ssr.spec.js` › `FI source sections stay usable when browser JS is unavailable` fails on the Canva design `DAHI6X6dR_g` link expected in the FI `/esitykset/` "Alkuperäiset lähteet" section. Not touched by this PR (no changes to `esitykset.njk` or source-archive templates); pre-existing rendering regression in the source-archive projection.

## Deletion candidates
- None. The additions live inside existing regions (`presentation-detail-support`, `<dl>`). No dead code produced.

## Architecture Closure 1.0
Remains **CLOSED/GREEN/MAIN**. This workstream did not extend the
canonical contract, did not add runtime JS, did not add new taxonomies,
and did not route Content Graph traversal into template render. Ready
for PR review (no auto-merge).
