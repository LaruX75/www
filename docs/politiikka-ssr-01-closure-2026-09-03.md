# POLITIIKKA-SSR-01 — Closure

**Status:** READY TO REVIEW
**Date:** 2026-09-03
**Baseline SHA:** `dd32618b8c548f32a83eab54667562f045424cd6`
**Scope:** delete orphaned runtime `/data/publications.json` pipeline from `/politiikka/`

## What the audit actually found

`/politiikka/` was NOT a missing SSR migration. It was an **orphaned runtime rendering pipeline** — the page fetched `/data/publications.json` at runtime, filtered it client-side by `politicalSpeechEvents`, sorted by date, and built `<tr>` template strings via `renderPoliticalSpeeches()`. But the three target DOM elements the render function wrote to (`#political-speeches-table-body`, `#political-speeches-info`, `#political-speeches-pagination`) **never existed** in the rendered HTML.

Repo-wide grep (`grep 'id="political-speeches-…"' src/ _site/`) confirmed **zero** consumers. `_site/politiikka/index.html` before the cleanup contained the fetch + row-builder JS but zero target elements. The pipeline silently no-op'd — same dead-code pattern as the KPI/chart section removed in VALTUUSTOTYO-SSR-01.

**No visible political-speeches archive was removed. The runtime code already rendered to nonexistent DOM targets.**

## Fix shape

Deletion-only. No new SSR markup added. No new build-time projection. `/politiikka/` looks pixel-identical to the user before and after this workstream — the removed code produced zero visible output.

## Retained

- `/data/publications.json` — public JSON endpoint retained. Producer at `src/data/publications.json.11ty.js` unchanged. `tests/unit/json-feeds.test.js` still passes.
- Build-time `politicalSpeechEvents` (7-event allowlist) + `politicalSpeeches` derivation in `src/fi/politiikka.md:118-132` — still consumed by SSR evidence-showcase card via `sortedPoliticalSpeeches[0]` at line 246-247 (renders "latest political speech" tile).
- `isCouncilSpeech()` semantics in `src/_utils/councilSpeech.js` — unchanged. The council-speech domain (79 items via `speechContext∈{valtuusto,kyselytunti}` + fallbacks) remains distinct from the political-speech domain (~84 items via event allowlist). Do NOT merge them.
- Mobile-disclosure JS (`applyPoliticsMobileDisclosureState`) — preserved unchanged; the only genuine user-interaction JS on the page.

## Removed dead code

From `src/fi/politiikka.md` (lines 524-656 pre-cleanup):

- `<script id="political-speech-events" type="application/json">…</script>` — runtime JSON serialization of the event allowlist (build-time consumer already had it)
- `_loadItems(url)` — fetch helper
- Runtime `politicalSpeechEvents` `Set` reconstruction via `JSON.parse(document.getElementById(...))` — no longer needed
- `_fiDateFormatter` — `Intl.DateTimeFormat` instance, only used by the dead render
- `_pubs` fetch call to `/data/publications.json`
- `politicalSpeechesData` filter/sort/normalize pipeline
- References to `politicalSpeechesTableBody`, `politicalSpeechesInfo`, `politicalSpeechesPagination` (missing DOM targets)
- `escHtml()` helper (Nunjucks auto-escape handles this at build)
- `formatFiDate()` — dead-in-dead code (defined but never called even by the orphaned render)
- `shortPoliticalSpeechTitle()` title-prefix stripper
- `currentPoliticalSpeechPageSize()` viewport-based page-size helper
- `renderPoliticalSpeeches()` — 35-line row + pagination HTML builder
- Initial render call + pagination click listener + `mobileQuery.change` re-render trigger

**Approximately −110 LOC** removed. Only ~25 LOC of the original IIFE retained (mobile-disclosure interaction).

## Public JSON contract

`/data/publications.json` retained. All 164 items still emitted. Endpoint still serves 200 with `items` payload. The Playwright test `/data/publications.json endpoint still resolves` explicitly asserts this after the cleanup.

## Political vs council semantics — explicitly preserved

| Domain | Rule | Count |
| --- | --- | ---: |
| Council speech (`isCouncilSpeech`) | `speechContext ∈ {valtuusto, kyselytunti}` OR event/forum fallback | 79 |
| Political speech (`politicalSpeechEvents` allowlist) | event ∈ 7-item political-forum allowlist | ~84 |

Political ⊃ Council. The workstream did NOT merge them, did NOT replace one with the other, and did NOT introduce a shared classifier where the domains legitimately differ.

## No new archive introduced

Deliberate: this workstream ships a deletion, not a feature. If the missing political-speeches archive turns out to be a wanted feature, it should be a separate follow-up workstream (potential name: `POLITIIKKA-SPEECHES-ARCHIVE-01` — Slice B in the audit).

## Files changed

| File | Change |
| --- | --- |
| `src/fi/politiikka.md` | Delete orphan `<script id="political-speech-events">` block + shrink the trailing `<script>` IIFE from ~127 LOC to ~25 LOC (mobile disclosure only) |
| `tests/valtuustotyo-ssr-01.spec.js` | Flip regression: was "MUST fetch `/data/publications.json`", now "MUST NOT fetch"; adds explicit SSR-content and public-contract sub-assertions |
| `docs/politiikka-ssr-01-closure-2026-09-03.md` | New closure doc (this file) |

**Total: 2 modified + 1 new + 0 deleted = 3 file changes.** No new production files, no deleted files.

## Measurements

| Metric | Before | After |
| --- | ---: | ---: |
| `src/fi/politiikka.md` LOC | 656 | ~547 |
| Inline `<script>` LOC on `/politiikka/` | ~127 | ~25 |
| `fetch()` call sites on `/politiikka/` | 1 | **0** |
| `/data/publications.json` runtime consumers site-wide | 1 (`/politiikka/`) | **0** |
| Runtime JSON payload downloaded by `/politiikka/` visitors | ~221 KB | **0 KB** |
| Rendered HTML size delta | — | 0 bytes added (no SSR replacement) |

## Verification

- `git diff --check`: clean
- `npm run test:unit` → all pass except 1 pre-existing pageCountEn baseline drift (out of scope, verified stale on origin/main in prior workstreams)
- `CACHE_ONLY=true npx @11ty/eleventy` → 1471 files written
- `node scripts/run-pagefind.js` → 1458 HTML documents; presentation invariants unchanged
- `check:i18n-seo` → OK
- `check:jsonld` → 0 errors (only baseline `article-headline-length: 63`)
- `check:researchfi-integrity` → OK
- Focused Playwright: `valtuustotyo-ssr-01.spec.js` (which now includes the 3 `/politiikka/` cleanup assertions) — all pass
- Built HTML verification:
  - `fetch("/data/publications.json")` in `_site/politiikka/index.html` = 0
  - `/data/publications.json` runtime references in `_site/politiikka/index.html` = 0
  - `id="political-speech-events"` = 0
  - Orphan render functions (`renderPoliticalSpeeches`, `_loadItems`, `politicalSpeechesData`) = 0

## Architecture

- `POLITIIKKA-SSR-01 = READY TO REVIEW`
- `Architecture Closure 1.0 = CLOSED / GREEN / MAIN` (unaffected)
- `VALTUUSTOTYO-SSR-01 = CLOSED / GREEN / MAIN / DEPLOYED` (unaffected; regression contract updated to reflect the new `/politiikka/` state)
- `KYNÄSTÄ-HUB-02 = CLOSED / GREEN / MAIN` (unaffected)
- `THESIS-SEARCH-UX-01 = CLOSED / GREEN / MAIN / DEPLOYED` (unaffected)
- `PF5 = CLOSED / MAINTENANCE` (unaffected)

This workstream is **post-closure cleanup** — dead runtime code removed without functional change. No canonical taxonomy modified, no public JSON contract broken, no new client-side content model introduced, no new SSR markup added.
