# PF5-G1 Shared presenter ownership convergence

## Status

ROLLOUT SLICE — post-`/en/search/`, pre-navbar. Ownership + deletion only; no behavior changes on any surface.

## Branch / base / HEAD

- **Branch:** `pf5/g1-presenter-convergence`
- **Worktree:** `/private/tmp/www-pf5-g1-presenter`
- **Original base (pre production-hotfix interruption):** `3f56c52e4aa9fae22f940ebb223e229b7babfbba` (post `/en/search/` rollout merge, PR #131)
- **Current base after main sync:** `46e2d258dc2bacbaf2c444cc70cefa662b321e6b` (post PF5 search production hotfix + closure docs, PRs #132 + #133)
- **HEAD at report time:** `46e2d258dc2bacbaf2c444cc70cefa662b321e6b` (no presenter-convergence commit yet — pending review)

### Main-sync audit (2026-08-23, after hotfix closure)

While this slice was preserved uncommitted, `main` moved 4 commits forward with the production regression hotfix and its closure documentation:

| Commit | Purpose | Files |
|---|---|---|
| `c2c1190b` | hotfix: `dump \| safe` → `jsonSafe \| safe` + Modular UI CSS load on FI/EN + regression test | `src/_includes/_search-page-config.njk`, `src/fi/haku.njk`, `src/en/search.njk`, `tests/search-modular-ui-pilot.spec.js`, `docs/pf5-search-production-regression-fix-2026-08-23.md` |
| `69cf113c` | merge #132 | — |
| `904ce1c9` | docs: closure amendment (READY FOR COMMIT REVIEW → CLOSED / GREEN / MAIN) | `docs/pf5-search-production-regression-fix-2026-08-23.md` |
| `46e2d258` | merge #133 | — |

**Overlap with presenter-convergence working tree: NONE.** The five main-changed paths are `_search-page-config.njk`, `haku.njk`, `search.njk`, `search-modular-ui-pilot.spec.js`, and `docs/pf5-search-production-regression-fix-2026-08-23.md`. The presenter slice touches `find-explore.js`, `search-result-presenter.js`, `site-ui.js`, seven F&E consumer templates, and its own evidence doc. Disjoint file sets.

**Sync procedure (safe, no rebase):**

1. `git diff > /private/tmp/pf5-g1-presenter-pre-sync.patch` — patch backup outside repo.
2. `git status --short > /private/tmp/pf5-g1-presenter-pre-sync-status.txt` — status backup.
3. `git stash push -u -m "pf5-g1-presenter-pre-main-sync"` — stash working tree + untracked evidence doc.
4. `git merge --ff-only origin/main` — clean fast-forward; branch had no local commits so ff was possible without contortion.
5. `git stash pop` — reapplied cleanly, zero conflicts.
6. `git diff > /private/tmp/pf5-g1-presenter-post-sync.patch && diff pre-sync.patch post-sync.patch` → **empty**, proving presenter-convergence diff is byte-identical across the sync.

**Result:** HEAD is now `46e2d258`, working tree still shows the same 10 M + 1 ??, and the same `+55 / −59` net LOC delta.

## Duplicate ownership before

Two independent copies of six pure helpers lived side-by-side in `src/js/find-explore.js` and `src/js/search-result-presenter.js`. The `/haku/` pilot doc had already flagged this as **CONTINGENT DELETION — MUST RESOLVE BEFORE NAVBAR ROLLOUT**; this slice resolves it.

## Helper inventory (PROVEN by direct source diff)

| Helper | In `find-explore.js` before | In `search-result-presenter.js` | Classification |
|---|---|---|---|
| `escapeHtml` | 8-line impl | 8-line impl (byte-identical) | **identical duplicate → extracted** |
| `resultTitle` | 3 lines | 3 lines (identical) | **identical duplicate → extracted** |
| `SISALTO_LABELS` | 7-line map | 7-line map (identical) | **identical duplicate → extracted** |
| `contentFamilyLabelFromData` | 7 lines | 7 lines (identical) | **identical duplicate → extracted** |
| `renderFamilyHeader` | 9 lines | 9 lines (identical) | **identical duplicate → extracted** |
| `renderPrimaryMetaLine` | 5 lines | 5 lines (identical) | **identical duplicate → extracted** |
| `debounce`, `normalizeUrl`, `normalizeSearchLanguage`, `scheduleIdle`, `warmSearchLanguages`, `createSearch`, `normalizeSearchLanguages` | F&E-only | not present | **genuinely F&E-only — kept private** |
| `text` (FI/EN translations for idle/loading/count/open/source/…) | F&E-only | not present | **genuinely F&E-only — kept private** |
| `kindConfig`, `thesisTypeRoleLabel`, `publicationRecordFromMeta`, `parseBooleanMeta`, `parseCslMeta`, `publicationGroupLabel`, sort helpers, and all `initMount`-scope helpers (`renderPublicationCardResult`, `renderPublicationArchiveRow`, `renderResultEntry`, `renderGroupedResults`, `renderPublicationArchiveGroups`, `citationButton`, `publicationCitationBody`, `publicationQualityLine`, `sourceLink`, `publicationSourceCell`) | F&E-only | not present | **genuinely F&E-only — kept private** |
| `detectKind` | not present (F&E knows kind from mount `data-find-explore-kind`) | 8 lines | **genuinely global-search-only — kept in presenter** |
| `primaryMetaFor` | not present (F&E uses `kindConfig[kind].resultMeta(entry)` which takes an already-projected entry) | present | **shape-different — kept in presenter (global-search only)** |
| `yearFor` | not present (F&E extracts year in `createResultEntry`) | present | **shape-different — kept in presenter** |
| `projectEntry` | not present (F&E's `createResultEntry` produces a richer entry with records, publicationRecord, thesisTypeRoleLabel) | present | **shape-different — kept in presenter** |
| `renderExcerpt` | inlined in F&E render sites using `escapeHtml(entry.excerpt)` (escapes markup, killing Pagefind `<mark>` highlights) | pure fn preserving raw markup | **behaviorally different — NOT converged. F&E keeps its escape-based behavior; presenter keeps its raw-preserving behavior.** |
| `renderSharedCard` | not present | present | **genuinely global-search-only — kept in presenter** |

**Why `renderExcerpt` was NOT converged:** F&E's inline excerpt fragment escapes the value, dropping Pagefind's `<mark>` highlight markup. The presenter's `renderExcerpt` preserves the markup because global search wants highlighted excerpts. Converging them would either **change F&E behavior** (against this slice's "no F&E behavior changes" guardrail) OR **regress global search's highlighting.** Deferred; both consumers keep their current behavior.

## Authoritative shared presenter after

`src/js/search-result-presenter.js` (208 LOC, was 191) is now **the single source** of the six identical helpers. Its file header comment declares authoritative ownership and lists which helpers other consumers MUST NOT re-declare.

## Consumer list

**Every production consumer of `find-explore.js` loads `search-result-presenter.js` first** — proven via `grep -rn "find-explore\.js" src` (7 templates) cross-checked line-by-line against `grep -rn "search-result-presenter\.js" src`. In every case the presenter appears on the pageScripts line immediately BEFORE find-explore.js. `<script defer>` execution order matches document order per HTML spec, so the presenter's IIFE runs first and installs `window.SearchResultPresenter`.

**7 F&E consumers, all PROVEN:**

| Template | Presenter line | find-explore line |
|---|---|---|
| `src/kirjoitukset.njk` | :11 | :12 |
| `src/opinnaytteet.njk` | :14 | :15 |
| `src/julkaisut.njk` | :13 | :14 |
| `src/fi/tutkimus.md` | :14 | :15 |
| `src/en/writings.njk` | :12 | :13 |
| `src/en/publications.njk` | :14 | :15 |
| `src/en/theses.njk` | :15 | :16 |

**2 global-search consumers** (`src/fi/haku.njk`, `src/en/search.njk`) already loaded both scripts from the previous rollout — unchanged.

**9 total pages load the shared presenter.** No consumer loads `find-explore.js` without loading the presenter first.

### Fail-fast dependency guard

`src/js/find-explore.js` already contains a small deterministic guard at file top:
```js
const presenter = window.SearchResultPresenter;
if (!presenter || typeof presenter.escapeHtml !== "function") {
  console.warn("[find-explore] SearchResultPresenter missing — load /js/search-result-presenter.js before /js/find-explore.js.");
  return;
}
```
If the presenter is missing, F&E enhancement aborts cleanly with a descriptive warning — no downstream `undefined is not a function`. **No helper logic is copied as a fallback.** The guard is fail-fast, not fail-silent-with-partial-behavior.

`src/js/find-explore.js` gains a small consumer guard at top-of-file:
```js
const presenter = window.SearchResultPresenter;
if (!presenter || typeof presenter.escapeHtml !== "function") {
  console.warn("[find-explore] SearchResultPresenter missing — load /js/search-result-presenter.js before /js/find-explore.js.");
  return;
}
const escapeHtml = presenter.escapeHtml;
const resultTitle = presenter.resultTitle;
const SISALTO_LABELS = presenter.SISALTO_LABELS;
const contentFamilyLabelFromData = presenter.contentFamilyLabelFromData;
const renderFamilyHeader = presenter.renderFamilyHeader;
const renderPrimaryMetaLine = presenter.renderPrimaryMetaLine;
```
This gives the rest of `find-explore.js` the same local names it had before, so no downstream call-site changes were needed.

## Deletions

**Completed in this slice:**
- `src/js/find-explore.js` — 6 private helper implementations removed: `escapeHtml` (8 lines), `resultTitle` (3), `SISALTO_LABELS` (7), `contentFamilyLabelFromData` (7), `renderFamilyHeader` (9), `renderPrimaryMetaLine` (5). Plus their local comments. Net removal ~50 lines; net add ~20 lines (import guard + comment) → net −30 LOC on find-explore.js.
- `src/js/site-ui.js:609` stale comment referencing the deleted `src/js/site-search-page.js` — replaced with a comment that describes current reality (post-PF5-G1 `/haku/` + `/en/search/` on Modular UI via `/js/global-search-modular-ui.js`; navbar keeps Default UI here until its own rollout).

**Nothing else deleted.** F&E-specific helpers, mount runtime, `kindConfig`, sort helpers, per-kind renderers, translations, record projection helpers all stay in `find-explore.js` per the "preserve domain differences" guardrail.

## LOC before / after

- `src/js/find-explore.js`: **1233 → 1203 LOC (−30)**
- `src/js/search-result-presenter.js`: **191 → 208 LOC (+17)** (just the expanded ownership-declaring header comment)
- Net **production JS: −13 LOC**

The absolute LOC delta is small. The important part is the **ownership convergence**: `escapeHtml`, `resultTitle`, `SISALTO_LABELS`, `contentFamilyLabelFromData`, `renderFamilyHeader`, `renderPrimaryMetaLine` now have exactly **one owner**. Future edits (e.g. new content family in `SISALTO_LABELS`) touch one file, not two.

## FI/EN search regression evidence

### Pre-hotfix run (historical, on base `3f56c52e`)

- **`tests/search-modular-ui-pilot.spec.js`** (parameterised FI + EN, 17 scenarios × 2 locales = 34 test cases):
  - Single-pass: **32 pass + 2 documented-skip** in 33.9 s.
  - **× 10 iterations, 2 workers: 340/340 (320 pass + 20 documented-skip), zero flake, 3.6 min.**
  - The 2 documented skips are the same publication-only-facet EN skips carried from the /en/search/ rollout (publications are FI-canonical only).
- `tests/pf-ui-l10n1-finnish-search-labels.spec.js`: **PASS** — Finnish/English inline config asserts intact.

**Global FI search cards unchanged**: PROVEN by pilot × 10 (`renderSharedCard` output verified against every scenario).
**Global EN search cards unchanged**: PROVEN by the same runs on EN locale.

### Post-hotfix run (current, on new base `46e2d258`)

- Combined browser suite `search-modular-ui-pilot.spec.js` + `pf-ui-l10n1-finnish-search-labels.spec.js` + F&E specs (`f2` + `f3a` + `f3b` + `pf2` + `pf3` + `pf4`): **66 pass / 2 documented-skip / 0 fail** in 30.3 s. Pilot suite now includes the hotfix regression test (Modular UI CSS link + `[data-pfmod-sr-hidden]` clip) — passes on both FI and EN.
- Isolated pilot re-run: **34 pass / 2 documented-skip / 0 fail** in 24.8 s.
- The 2 documented skips remain the same publication-only-facet EN skips.
- One flaky `toHaveAttribute` failure observed during the first combined run (EN `/en/search/` load-more scenario at `search-modular-ui-pilot.spec.js:380`), self-cleared on the isolated pilot re-run above.

### Targeted EN load-more flake repeat (bounded verification, current base `46e2d258`)

Before commit, the exact failing scenario was rerun in isolation ×10 to distinguish flake from regression:

```
PLAYWRIGHT_USE_STATIC_SERVER=true DISABLE_OG_IMAGES=true \
  npx playwright test tests/search-modular-ui-pilot.spec.js \
  -g "EN /en/search/.*load-more preserves order" \
  --repeat-each=10 --reporter=list
```

Result: **10/10 PASS** in 29.1 s. Zero reproduction.

**Classification:** observed non-reproducing flake, not a presenter-convergence regression. No implementation, test-code, timeout, or retry-count change made. Prior historical ×10 / 340-run evidence remains labelled pre-hotfix / pre-main-sync in the section above and is not being reused here as a claim about the current base.

## F&E regression evidence

### Pre-hotfix run (historical, on base `3f56c52e`)

- `tests/f2-find-explore-smoke.spec.js` — PASS
- `tests/f3a-theses-find-explore.spec.js` — PASS
- `tests/f3b-publications-find-explore.spec.js` — PASS
- `tests/pf2-sisalto-facet.spec.js` — PASS
- `tests/pf3-result-card-consistency.spec.js` — PASS
- `tests/pf4-result-card-hierarchy.spec.js` — PASS

**F&E writings result unchanged**, **thesis archive `<tr>` rendering unchanged**, **publication card unchanged**: PROVEN — every F&E spec above exercises the domain-specific renderers still owned by `find-explore.js`, all pass.

**Research mixed-kind `/tutkimus/` unchanged**: mounted verified by build, but one test in `tests/f4-research-find-explore.spec.js:38` fails with a `?returnTo=…` URL mismatch. Verified on clean `origin/main` (`3f56c52e`) via `git stash push --include-untracked` + rebuild + rerun — **the same test fails identically on base**. This is a pre-existing failure not caused by this slice, added to the baseline-known list.

### Post-hotfix run (current, on new base `46e2d258`)

All six specs above run as part of the same combined 66-pass suite recorded in the FI/EN section. F&E-specific renderers (kindConfig, publication CSL, thesis role, archive rendering, sort helpers) remain in `find-explore.js`; direct source grep confirms **16 F&E-only helper declarations** still local. Zero convergence bleed.

Baseline pre-existing `f4-research-find-explore.spec.js:38` failure is not included in the combined run (was not part of this recovery task's scope), so its baseline status is unchanged and unverified on the new base — noted as inherited baseline concern.

## Navigation + accessibility (post-hotfix)

- `tests/navigation.spec.js` + `tests/accessibility.spec.js` + `tests/accessibility-tools.spec.js`: **25 pass / 0 fail** in 15.3 s. Navbar Default UI mount unaffected.

## Build + unit (post-hotfix)

- `git diff --check`: clean.
- `npm run test:unit`: **602 pass / 0 fail** in 1.1 s (same count as pre-hotfix; presenter convergence adds no unit surface).
- `npm run build:no-og`: **PASS** — 1472 files, postbuild (Pagefind, SEO dashboard, research.fi integrity) all OK.

## Navbar unchanged

`src/js/site-ui.js` — only the stale reference comment at line 609 changed. The `PagefindUI` init block below it (Default UI navbar mount for both FI and EN) is untouched. `_meta.njk` still loads `pagefind-ui.js` / `pagefind-ui.css` because navbar still consumes them.

**Verified:** `git diff origin/main -- src/js/site-ui.js` shows only the comment change; no runtime alteration.

## Files changed (12 in-scope)

| Path | Change | LOC delta |
|---|---|---|
| `src/js/search-result-presenter.js` | header comment expanded to declare authoritative ownership | +17 |
| `src/js/find-explore.js` | 6 private helpers removed; small consumer-guard alias block added | −30 |
| `src/js/site-ui.js` | stale comment at :609 updated | +2 / −2 |
| `src/kirjoitukset.njk` | `pageScripts:` adds `/js/search-result-presenter.js` | +1 |
| `src/opinnaytteet.njk` | same | +1 |
| `src/julkaisut.njk` | same | +1 |
| `src/fi/tutkimus.md` | same | +1 |
| `src/en/writings.njk` | same | +1 |
| `src/en/publications.njk` | same | +1 |
| `src/en/theses.njk` | same | +1 |
| `docs/pf5-g1-shared-presenter-convergence-2026-08-23.md` | NEW evidence doc | new |

## Guardrails held (all PROVEN)

- No Canonical Content v1 changes.
- No Pagefind metadata / taxonomy / contexts / filter changes.
- No ranking changes.
- No FI/EN availability changes (writings/publications facet skips on EN unchanged, verified by pilot).
- `/haku/` behaviour unchanged (pilot spec + × 10).
- `/en/search/` behaviour unchanged (pilot spec + × 10).
- Navbar behaviour unchanged (no runtime touch).
- Presenter still owns only presentation semantics (no Pagefind Instance / query / filter / pagination / archive replacement / mount config / sorting).

## Remaining G1 blockers before navbar rollout

- **None from this slice.** The `find-explore.js` shared-helper duplication that the /haku/ + /en/search/ pilots labelled as MUST-RESOLVE-BEFORE-NAVBAR is now resolved.
- **Still deferred (unchanged from previous slices):**
  - `MutationObserver` post-render aria-label decoration on FilterPills — CONTINGENT DELETION when Pagefind exposes a supported translation API. Not blocking navbar.
  - Global `pagefind-ui.js` + `pagefind-ui.css` load in `_meta.njk` — still required by navbar Default UI, deleted only after navbar migrates.
  - Pre-existing baseline failures in `tests/pf-perf2-first-search-latency.spec.js:49` and `tests/pf5-impl-apa-full-list.spec.js:67` and `tests/f4-research-find-explore.spec.js:38` — not caused by any of the PF5-G1 slices; investigation is out of PF5-G1 scope.

## Hotfix inheritance (from PR #132 + #133 on new base `46e2d258`)

The main-sync brought in the production hotfix runtime changes. These are **inherited from main and MUST NOT appear in the presenter-convergence diff** (they are already committed). Verified:

- `src/_includes/_search-page-config.njk:46` — uses `{{ searchPageConfig | jsonSafe | safe }}` (was `dump | safe`).
- `src/fi/haku.njk` — front-matter includes `pageStyles: [/pagefind/pagefind-modular-ui.css]`.
- `src/en/search.njk` — same.
- `docs/pf5-search-production-regression-fix-2026-08-23.md` — present, status **CLOSED / GREEN / MAIN**.
- `tests/search-modular-ui-pilot.spec.js` — contains the sr-hidden regression test.
- Security guard `! grep -rn "| dump | safe" src/ --include="*.njk"` — **PASS, zero matches** on the current tree.

**Presenter-convergence diff overlap with hotfix files: NONE.** `git diff --name-only` on the presenter slice returns 10 paths, none of which are any of the five hotfix paths above.

## Evidence classification

- **PROVEN**: 6-helper duplication inventory (source diff), extraction correctness (pre-hotfix pilot × 10 = 340/340; post-hotfix combined 66/66 pass + 2 documented-skip on the new base `46e2d258`), F&E-only helpers preserved (16 declarations still local, verified by grep), navbar untouched (navigation + a11y 25/25 pass), LOC delta measured, stale comment removed, main-sync diff byte-identical (pre-sync patch vs post-sync patch → empty), hotfix runtime changes inherited from main and NOT part of presenter diff.
- **INFERENCE**: Future edits to shared helpers (e.g. new SISALTO_LABELS entry) will now touch exactly one file; drift risk between the two former copies is eliminated.
- **NEEDS FOLLOW-UP** (non-blocking, deferred to a later slice):
  - `renderExcerpt` behavioural gap between F&E (escaped, kills Pagefind `<mark>` highlights) and presenter (raw markup preserving highlights) — both consumers currently keep their existing behavior. Converging would be a functional change, out of this slice.
  - Pre-existing baseline failures in `tests/pf-perf2-first-search-latency.spec.js:49`, `tests/pf5-impl-apa-full-list.spec.js:67`, and `tests/f4-research-find-explore.spec.js:38` — not caused by this slice; not re-verified on the new base as part of this recovery task.

---

**End of convergence evidence.** Presenter-convergence still not committed. Awaiting review before staging + commit + PR. Navbar Modular UI rollout, G2, G3, G4 all remain deferred.
