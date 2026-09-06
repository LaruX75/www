# CI-PERF-02-IMPL — closure (2026-09-06)

Smallest correct implementation of the CONDITIONAL GO recommended by
`docs/ci-perf-02-playwright-gating-audit-2026-09-06.md`. Split the
current PR Playwright gate into a fast smoke gate + a weekly full
regression, without weakening browser coverage of proven merge-blocker
invariants.

## 1. Base

- Base SHA: `0a0670f2da7d2a940fd1b42103ffc557e25a9ecf` (origin/main after PR #218 merge)
- Branch: `feat/ci-perf-02-impl`
- Audit reference: `docs/ci-perf-02-playwright-gating-audit-2026-09-06.md`
- Prior CI work: `docs/ci-perf-01a-build-once-2026-09-04.md`, `docs/ci-closure-1-2026-08-20.md`
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (unchanged; CI-only slice)

## 2. What changed

- 7 test titles gained a trailing ` @smoke` tag in existing specs.
  No test bodies changed. No assertion weakened. No test deleted.
- `.github/workflows/staging.yml` PR Playwright step now runs
  `--grep "@smoke"` (single line change to the run command).
- `.github/workflows/weekly-playwright.yml` (new file) runs the full
  set on Mondays 03:17 UTC and via `workflow_dispatch`.

## 3. PR smoke gate content (verified via `--list`)

Exactly 7 tests selected by `--grep "@smoke"`:

| # | Spec | Line | Test title |
|---|---|---|---|
| 1 | accessibility.spec.js | 7 | Homepage passes basic axe-core accessibility tests @smoke |
| 2 | contrast.spec.js | 21 | Homepage buttons meet contrast requirements @smoke |
| 3 | contrast.spec.js | 34 | Site changes KPI text meets contrast requirements in both themes @smoke |
| 4 | navigation.spec.js | 5 | Desktop mega menu supports keyboard opening and focus return @smoke |
| 5 | navigation.spec.js | 36 | Search dialog traps focus and returns it to the trigger @smoke |
| 6 | navigation.spec.js | 158 | EN search dialog: same open/traversal/close/return lifecycle as FI @smoke |
| 7 | navigation.spec.js | 208 | Theme selection persists across page navigation @smoke |

Coverage cross-check against the audit's six required invariant groups:

- ✅ mega menu keyboard → test #4
- ✅ FI search focus trap → test #5
- ✅ EN search focus trap → test #6
- ✅ theme persistence → test #7
- ✅ homepage axe → test #1
- ✅ homepage contrast + KPI text → tests #2 + #3

No extra tests are selected beyond the six invariant groups. Test #3
(KPI text) is included as it belongs to the "homepage contrast + KPI
text" group per audit §11.

**Pagefind FI search-term test (navigation.spec.js:143) is NOT tagged.**
Confirmed absent from the `--list --grep "@smoke"` output. Weekly-only,
matching audit §7 classification.

## 4. Weekly regression scope

`.github/workflows/weekly-playwright.yml` runs the exact current PR
regression set (no scope expansion, no scope reduction):

- `tests/accessibility.spec.js` — 13 axe scans
- `tests/navigation.spec.js` — 5 tests (including the Pagefind FI
  search-term test excluded from PR smoke)
- `tests/contrast.spec.js` — 14 tests (including the heavy
  `/esitykset/` + `/en/presentations/` button-contrast walks)

Total: **32 tests**. Verified via `--list` (unfiltered) = 32 tests.

Domain-specific specs (`tests/detail-ux-*`, `tests/course-relation-ux-01`,
`tests/opetus-ia-01`, `tests/home-nav-correction-01`, `tests/o1-*`, etc.)
are **not** part of the weekly workflow. Audit §12 recommended keeping
weekly identical to today's PR set unless separate evidence justified
broader scope — no such evidence in this slice.

## 5. Weekly schedule

```yaml
on:
  schedule:
    - cron: "17 3 * * 1"   # Mondays 03:17 UTC
  workflow_dispatch:
```

- Once per week is the audit-recommended cadence (§13).
- 03:17 UTC = a low-traffic slot; the odd minute reduces the chance of
  colliding with other org-wide cron pileups on the top of the hour.
- `workflow_dispatch` allows ad-hoc reruns.
- `concurrency` group with `cancel-in-progress: false` prevents a manual
  dispatch from cancelling a running scheduled regression.

## 6. Weekly workflow build

- Uses `npm run build:no-og` (existing supported command).
- `ELEVENTY_PATH_PREFIX=""` — weekly does not deploy, so root-relative
  Playwright navigation works against the static-served `_site`.
- No artifact upload, no deploy step. Weekly runs against `main` and
  its only purpose is to fail loudly.
- Failure surfaces as a normal red Actions run in the tab.

## 7. staging.yml changes (scope preserved)

Only the Playwright invocation step was touched. Explicitly preserved:

- Single shared `_site` artifact from CI-PERF-01A (no rebuild).
- `build → verify` / `build → playwright` / `[build, verify] → deploy`
  job graph.
- `docs/**` in `paths-ignore` for both `push:staging` and `pull_request`.
- `if: github.event_name == 'pull_request'` on the playwright job.
- `PLAYWRIGHT_USE_STATIC_SERVER=true`, `PLAYWRIGHT_A11Y_OFFLINE=true`.
- Chromium-only (per `playwright.config.js`).
- `retries: 2`, `workers: 1` in `playwright.config.js` — **unchanged**
  (audit §6 rejected parallelism change for this slice).

## 8. Local verification

Fresh build:

- `CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --quiet` — exit 0, 1479 files written.

Smoke (grep):

- `--grep "@smoke" --reporter=list` → **7 passed / 0 failed / 7.3s** (4 workers).

Full regression (unfiltered):

- 32 tests → **31 passed / 1 failed / 1m 12s** (4 workers).
- Sole failure: `navigation.spec.js:143` Pagefind FI search-term test
  — the exact test the audit identified as flaky and moved to
  weekly-only. Pre-existing flake, not introduced by this slice; not
  in the PR smoke selection.

Timing evidence (from full-suite `--reporter=list`, workers=4 local):

| Test | Local wall-clock |
|---|---:|
| contrast Presentations FI | 57.1s |
| contrast Presentations EN | 37.8s |
| contrast Publications | 13.8s |
| contrast Publications EN | 6.5s |
| contrast Theses | 5.2s |
| contrast Site Changes | 3.8s |
| accessibility Presentations | 3.7s |
| accessibility Publications | 3.7s |
| accessibility Publications EN | 3.6s |
| accessibility Homepage | 3.3s |
| accessibility Theses | 3.2s |
| contrast Homepage | 3.2s |
| **All 7 smoke tests (workers=4)** | **7.3s aggregate** |
| **Sum of all 32 tests (workers=4)** | **1m 12s** |

## 9. Expected CI impact

Median PR Playwright job before: **~5m 51s** (CI-PERF-02 audit §4 across
5 sampled runs). Split by phase:

| Phase | Before | After (projected) |
|---|---|---|
| Setup / checkout / npm ci / artifact | ~15s | ~15s |
| Playwright browser install | ~23s | ~23s |
| Test execution (CI, workers=1) | ~5m 0s | ~15–30s (7 smoke tests) |
| **Playwright job total** | **~5m 51s** | **~53–70s (target)** |

Actual PR CI numbers will be captured at the PR checkpoint step below.

## 10. Explicitly out of scope (audit §9, §10 rejects)

- No Playwright browser cache added. Browser install (~23s) is not the
  bottleneck.
- No `workers` change — stays at `1` on CI.
- No path-based conditional Playwright skipping. Shared templates make
  path filters unsafe.
- No custom apt/Docker/artifact layering.
- No test deletion. No assertion weakening. The Pagefind FI test kept
  intact — it just moves from PR gate to weekly gate via non-selection
  (not by tagging).

## 11. Public-contract impact

- **Runtime JS added:** **zero.**
- **Canonical Content v1 impact:** **zero.**
- **Public JSON impact:** **zero.**
- **JSON-LD impact:** **zero.**
- **Pagefind impact:** **zero.**
- **Site behavior impact:** **zero** — CI-only slice.

## 12. Architecture Closure 1.0 impact

**Zero. AC1 remains CLOSED / GREEN / MAIN.**

- No canonical semantics moved to JS.
- No runtime JSON → HTML duplication.
- No Pagefind acting as canonical storage.
- No source/landing/context regression.
- No new taxonomy.
- SSR-first preserved.
- No architectural abstraction added or removed.

## 13. F3C Presentations impact

**Zero. F3C remains CLOSED / GREEN / MAIN.** Presentations contrast
tests still exist and still run weekly; they are just no longer on
the PR critical path (audit §7).

## 14. Files changed

**Modified:**

- `tests/accessibility.spec.js` — conditional ` @smoke` suffix when
  `auditPage.name === 'Homepage'` (2-line change).
- `tests/contrast.spec.js` — conditional ` @smoke` suffix when
  `auditPage.name === 'Homepage'` + ` @smoke` on the KPI-text test
  title (3-line change).
- `tests/navigation.spec.js` — ` @smoke` suffix on 4 test titles
  (mega menu, FI focus trap, EN focus trap, theme persistence).
  The Pagefind FI search-term test title is deliberately unchanged.
- `.github/workflows/staging.yml` — PR playwright step name + `run`
  command line updated to `--grep "@smoke"`; explanatory comment added.

**New:**

- `.github/workflows/weekly-playwright.yml` — weekly full regression.
- `docs/ci-perf-02-playwright-gating-closure-2026-09-06.md` — this file.

**Also added earlier (audit deliverable):**

- `docs/ci-perf-02-playwright-gating-audit-2026-09-06.md`.

## 15. Deletion / simplification

- No new PR workflow file was added — the smoke gate reuses the existing
  `staging.yml` PR playwright job; only its `run` command changed.
- No duplicate PR execution remains: PR runs smoke only; weekly owns
  the broader scheduled regression role.
- The unused-branch cleanup / helper refactor was NOT performed
  (out of scope).

## 16. Final status

- **CI-PERF-02-IMPL = READY FOR MERGE (pending PR + CI verification).**
- **PR browser protection = PRESERVED** (7 tests / 6 invariant groups).
- **Weekly full regression = ADDED** (32 tests / cron + dispatch).
- **Architecture Closure 1.0 = CLOSED / GREEN / MAIN.**
- **Canonical Content v1 = unchanged.**
- **F3C Presentations Find & Explore = CLOSED / GREEN / MAIN.**
- **DETAIL-UX-SEQUENCE-01 = CLOSED / DEFERRED / DOCUMENTED / MAIN.**
