# DETAIL-UX-01C-B-COURSE — closure (2026-09-05)

Bundle: "Samalla kurssilla" SSR peer-section on Presentation detail
pages + Kempele semantic verification for `kategoria` / `jarjestaja`.

## Status
- Branch: `feat/detail-ux-01c-b-course`
- Baseline: `origin/main` = `b975998f` (Architecture Closure 1.0 = CLOSED/GREEN/MAIN)
- Result: 13/13 dedicated Playwright tests green
- Build: `CACHE_ONLY=true npx @11ty/eleventy` → exit 0, `Copied 275 Wrote 1480 files`
- Canonical Content v1: **not extended** (uses existing §3 `kategoria`, `jarjestaja` + `courseContexts[].courseId`)
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

Contract: `Käyttöyhteys` (type) MUST NOT conflate with `Paikka/organisaatio` (organiser).

Kempele VESO 2026 renders:
```
<dt>Käyttöyhteys</dt> <dd>Täydennyskoulutus</dd>
<dt>Järjestäjä</dt>   <dd>Kempeleen kunta (VESO-koulutus)</dd>
```

Both fields already exist on the canonical Canva projection
(`kategoria: "täydennyskoulutus"`, `jarjestaja: "Kempeleen kunta
(VESO-koulutus)"`); this workstream only routes them to the detail
template. No new canonical field. No new taxonomy.

## Playwright regression suite (`tests/detail-ux-01c-b-course.spec.js`)

- **A. Positive — 405040Y peer group:** for each of the three luento pages, exactly 2 peers rendered, and self URL not present in peer `<ul>`.
- **B. Bounded — 410014Y peer group:** cap enforced at PEER_LIMIT=6.
- **C. Negative control — Kempele:** no `content-detail-course-peers` section and no "Samalla kurssilla" heading.
- **D. Kempele semantic verification:** `<dt>Käyttöyhteys</dt><dd>Täydennyskoulutus</dd>`, `<dt>Järjestäjä</dt><dd>Kempeleen kunta (VESO-koulutus)</dd>`, and non-conflation check.
- **E. Meaningful without JavaScript:** peer section and both Kempele rows present in SSR HTML with `javaScriptEnabled: false`.

Result: **13/13 green** in `PLAYWRIGHT_USE_STATIC_SERVER=true`.

## Unrelated pre-existing test failure noted

`tests/detail-ux-01a.spec.js` › `D. Publication DOI is protected
metadata` › `JSON-LD contains DOI destination` fails on
`/julkaisut/0669729323/`. Verified this failure is present on
baseline (working tree = stashed, i.e. `origin/main` behavior). The
DOI is present in the page (sidebar, APA citation, pagefind meta) but
not in the JSON-LD script. Out of scope for this workstream — filed
implicitly for a later DETAIL-UX-01A follow-up if needed.

## Deletion candidates
- None. The additions live inside existing regions (`presentation-detail-support`, `<dl>`). No dead code produced.

## Architecture Closure 1.0
Remains **CLOSED/GREEN/MAIN**. This workstream did not extend the
canonical contract, did not add runtime JS, did not add new taxonomies,
and did not route Content Graph traversal into template render. Ready
for PR review (no auto-merge).
