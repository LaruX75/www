# CI-PERF-02 — Playwright PR-gate vs weekly regression audit (2026-09-06)

## 1. Status

**AUDIT ONLY.** No workflow changes. No commits. No PR.

**Verdict: CONDITIONAL GO.** Split the current PR Playwright job into a small ~50s smoke gate + a weekly full-regression run. The bulk of current PR time (~5 min) is dominated by two contrast tests on `/esitykset/` and `/en/presentations/` that need to run against browser DOM but do NOT need to gate every merge.

## 2. Baseline (verified)

- Branch: `audit/ci-perf-02` (local; not pushed)
- HEAD / origin/main: `0a0670f2da7d2a940fd1b42103ffc557e25a9ecf` (verified)
- Docs consulted:
  - `docs/ci-perf-01a-build-once-2026-09-04.md`
  - `docs/ci-closure-1-2026-08-20.md`
  - `.github/workflows/staging.yml`
  - `playwright.config.js`
  - `package.json` Playwright scripts
- 5 recent successful PR runs (218, 217, 216, 215, 213) inspected for step-level timing.

## 3. Current workflow (verified against `.github/workflows/staging.yml`)

`staging.yml` has four jobs:

- **build** (needs: nothing) — checkout, setup-node, npm ci, cache API fallback, `npm run build:no-og`, upload `_site` artifact.
- **verify** (needs: build) — checkout, setup-node, npm ci, download artifact, SEO/i18n/robots/hreflang/sitemap/canva/skip-link checks.
- **playwright** (needs: build, `if: github.event_name == 'pull_request'`) — checkout, setup-node, npm ci, download artifact, `npx playwright install --with-deps chromium`, `npx playwright test tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js`.
- **deploy** (needs: build+verify, `if: github.ref == 'refs/heads/staging'`) — download artifact, deploy to `www-staging`.

CI-PERF-01A already collapsed the duplicate build into a single shared artifact. Docs-only PRs skip the whole workflow (`paths-ignore: docs/**`).

`playwright.config.js` sets `workers: process.env.CI ? 1 : undefined` — CI runs serialized, local runs parallelize. `retries: 2` on CI.

## 4. Recent step timing (5 successful PR runs)

Extracted via `gh api repos/LaruX75/www/actions/runs/{id}/jobs`:

| Step | Run 218 | Run 217 | Run 216 | Run 215 | Run 213 | Median |
|---|---|---|---|---|---|---|
| Set up job | 2s | 1s | 1s | 1s | 1s | ~1s |
| Checkout | 2s | 2s | 2s | 2s | 2s | 2s |
| Setup Node (cache: npm) | 6s | 5s | 5s | 5s | 6s | ~5s |
| npm ci | 5s | 4s | 5s | 8s | 6s | ~5s |
| Download artifact | 4s | 3s | 2s | 4s | 3s | ~3s |
| **Install Playwright browsers** | **22s** | **23s** | **23s** | **25s** | **24s** | **~23s** |
| **Run tests** (3 specs) | **5m 41s** | **4m 59s** | **4m 55s** | **5m 03s** | **4m 58s** | **~5m 0s** |
| Post steps + Complete | ~3s | ~3s | ~3s | ~3s | ~3s | ~3s |
| **Job total** | **6m 25s** | **5m 37s** | **5m 34s** | **5m 49s** | **5m 51s** | **~5m 51s** |

**Test execution dominates: median ~5m of ~5m 51s total job = 85%.**

## 5. Local timing (for calibration, static-server, workers=1 to mimic CI serialization)

Full PR set runs locally in **~2m 40s (160s)** on this workstation:

| Test | Local time | Runs on: |
|---|---:|---|
| Contrast: Presentations (FI) | **57.9s** | /esitykset/ |
| Contrast: Presentations (EN) | **38.0s** | /en/presentations/ |
| Contrast: Publications | 14.0s | /julkaisut/ |
| Contrast: Publications (EN) | 6.9s | /en/publications/ |
| Contrast: Theses | 5.7s | /opinnaytteet/ |
| Contrast: Site Changes | 3.9s | /sivuston-muutokset/ |
| Contrast: Homepage | 3.5s | / |
| Contrast: Writings (EN) | 2.8s | /en/writings/ |
| Contrast: CV | 2.7s | /cv/ |
| Contrast: Writings | 2.3s | /kirjoitukset/ |
| Contrast: Contact | 1.9s | /yhteystiedot/ |
| Contrast: Accessibility Statement | 1.8s | /saavutettavuus/ |
| Contrast: How This Site Is Built | 1.8s | /miten-sivusto-on-rakennettu/ |
| Contrast: KPI text (both themes) | 0.6s | /sivuston-muutokset/ |
| Accessibility: Presentations | 2.8s | /esitykset/ |
| Accessibility: Presentations (EN) | 2.0s | /en/presentations/ |
| Accessibility: Site Changes | 1.1s | /sivuston-muutokset/ |
| Accessibility: Publications | 0.9s | /julkaisut/ |
| Accessibility: Publications (EN) | 0.9s | /en/publications/ |
| Accessibility: (10 other pages) | ~0.5s each = ~5s | various |
| Accessibility: Homepage | 4.0s | / |
| **Contrast subtotal** | **~144s (60%)** | 14 tests |
| **Accessibility subtotal** | **~16s (7%)** | 13 tests |
| **Navigation subtotal** | **~3s (1%)** | 5 tests |

**The `/esitykset/` + `/en/presentations/` contrast tests alone account for 96s locally = ~60% of the local Playwright execution time.** They walk hundreds of buttons on the F3C-migrated Presentations archives.

## 6. Current test inventory

### `tests/accessibility.spec.js` — 13 axe-core scans

Auto-generated `for (const page of AXE_AUDIT_PAGES)` loop over 13 pages: Homepage, Publications FI+EN, Theses, Writings FI+EN, Presentations FI+EN, CV, Contact, Accessibility Statement, How This Site Is Built, Site Changes.

### `tests/navigation.spec.js` — 5 tests (in `Navigation and Focus Audits`)

- `Desktop mega menu supports keyboard opening and focus return` (line 5) — **PR CRITICAL** (browser-only keyboard focus behavior).
- `Search dialog traps focus and returns it to the trigger` (line 36) — **PR CRITICAL** (focus-trap regression, historically flaky per PR #200 rerun).
- `Search dialog returns Pagefind results for a known Finnish term` (line 143) — **WEEKLY** (Pagefind data + timing flake; not per-PR blocker).
- `EN search dialog: same open/traversal/close/return lifecycle as FI` (line 158) — **PR CRITICAL** (same class as FI focus trap, EN parity).
- `Theme selection persists across page navigation` (line 208) — **PR CRITICAL** (localStorage + navigation state).

### `tests/contrast.spec.js` — 14 tests

- 13 button-contrast scans across the same page set as accessibility.
- 1 site-changes KPI text contrast (both themes) — 0.6s.
- The 300s per-test timeout was documented as tight for Presentations pages on CI.

## 7. PR-critical vs weekly classification

| Test | Class | Rationale |
|---|---|---|
| navigation:5 mega menu keyboard | **A. PR CRITICAL** | Focus-return regression on nav — CSS/JS interaction, browser only |
| navigation:36 search focus trap | **A. PR CRITICAL** | Historical focus-trap regressions documented (PR #200) |
| navigation:158 EN search parity | **A. PR CRITICAL** | Same class as FI |
| navigation:208 theme persistence | **A. PR CRITICAL** | localStorage cross-nav |
| contrast:20 Homepage buttons | **A. PR CRITICAL** | Highest-visibility page; visual regression risk |
| contrast:33 KPI text both themes | **A. PR CRITICAL** | Dark-mode dual-theme guard, ~0.6s |
| accessibility:6 Homepage | **A. PR CRITICAL** | Highest-visibility page |
| navigation:143 Pagefind search FI | **B. WEEKLY** | Pagefind index timing flake; false-positive rate too high for PR gate |
| accessibility: 12 non-home pages | **B. WEEKLY** | Content-change regressions rare; template inputs stable per PR |
| contrast: 12 non-home pages | **B. WEEKLY** | Same rationale — most PRs don't change presentation-item.njk / CSS |
| **contrast: Presentations FI** | **B. WEEKLY** | 57.9s alone; F3C Presentations archive is stable; per-PR cost not justified |
| **contrast: Presentations EN** | **B. WEEKLY** | 38.0s alone |

No test classified as C (domain-specific gate) — path-based classification is fragile with shared templates.
No test classified as D (redundant / low value).

## 8. Historical regression evidence justifying browser coverage

- **Focus trap regressions in the search dialog** (`navigation.spec.js:36`) — repeatedly flaky in past PRs (PR #200 rerun). Static/unit checks cannot catch focus-trap regressions; requires real browser event model. **PR gate must retain this.**
- **Pagefind search dialog Finnish-term timing** (`navigation.spec.js:143`) — flaky enough that the PR gate is a poor place; weekly is better.
- **Theme persistence** (`navigation.spec.js:208`) — localStorage + page navigation. Not catchable by static checks. **PR gate must retain.**
- **Mega menu keyboard nav** (`navigation.spec.js:5`) — focus return after menu close. Requires browser. **PR gate must retain.**
- **Homepage accessibility + contrast** — first impression + widest audience; static checks catch some issues but not computed color / focus indicators. **PR gate should retain a minimum here.**

Static/unit checks (`grep`, i18n/SEO, HTML structure) already handle: robots meta, sitemap presence, hreflang tags, canonical URLs, description meta, feed presence, skip-link presence, Canva section presence. These are in the `verify` job today and are correctly not duplicated in Playwright.

## 9. Safe optimization options

1. **Split into smoke + full-regression.** Recommended.
   - PR gate: navigation.spec.js (all 5) + accessibility (Homepage only) + contrast (Homepage + KPI text).
   - Weekly: everything currently gated on PR + extended browser regression across domain specs.
   - Expected PR playwright job: **~1 min** (browser install 23s + tests ~15s + overhead ~15s).
   - Saving per PR: ~4 min 30s.

2. **Cache `~/.cache/ms-playwright/`.** Marginal — 23s browser install is small vs 5 min tests. **REJECTED as not worth complexity.**

3. **Increase CI workers to 2 or 3.** Playwright supports it; some tests may share resource. Ubuntu-latest runners are 2 vCPU. **CONDITIONAL** — measure separately; may reduce serialized wall-clock by ~40% but risk of flaky-test amplification. **Not recommended for this slice.**

4. **Path-based Playwright skipping** for narrowly non-UI changes. **REJECTED** — shared templates (`_includes/`, `_data/`, `_utils/`) touch nearly every UI surface; hard to define safe paths without missing regressions.

5. **Reduce contrast scope per PR** — cover Homepage only per PR, rest weekly. **RECOMMENDED as part of Option 1.**

6. **Convert some tests to unit-level DOM checks** (via jsdom). **REJECTED** — computed color values, focus-trap event handling, and theme-persistence localStorage cannot be reliably tested without a real browser.

## 10. Rejected optimizations

- **Move ALL Playwright to weekly** — REJECTED. Focus-trap and theme-persistence regressions have real historical precedent; catching them post-merge is worse than catching them pre-merge.
- **Delete the contrast tests** — REJECTED. They provide protection against CSS regressions, especially dark-mode dual-theme cases. Move to weekly, don't delete.
- **Delete the accessibility tests** — REJECTED. axe-core catches ARIA / role / label regressions that HTML grep cannot.
- **Cache Playwright browsers via GHA actions** — REJECTED. Saving is small (~20s), added moving parts, cache-hit-rate uncertainty, key-version churn. Revisit only if CI budget becomes critical.
- **Parallelize CI workers** — REJECTED as part of this slice. Would need separate flakiness re-baseline. Can be pursued later if PR time is still too slow after Option 1.

## 11. Recommended PR smoke suite

Preserve browser-only invariants only:

```yaml
- name: Run Playwright smoke (PR gate)
  run: npx playwright test tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js --grep "@smoke"
```

Tag additions (one-line changes) in the existing specs:

- `tests/accessibility.spec.js` — tag the Homepage test only: `test(\`${page.name} passes basic axe-core accessibility tests @smoke\`, …)` when `page.name === 'Homepage'`.
- `tests/contrast.spec.js` — tag Homepage button contrast (`@smoke`) + KPI text test (`@smoke`).
- `tests/navigation.spec.js` — tag `mega menu`, `search dialog traps focus`, `EN search dialog lifecycle`, and `theme selection` as `@smoke`. Leave the Pagefind search Finnish-term test UN-tagged (weekly-only).

Alternative to grep-based tagging: a dedicated `tests/smoke/*.spec.js` folder that re-imports the fixture helpers and runs a curated subset. Grep-based is simpler and requires no test-file duplication.

**Expected PR smoke:** ~15s test execution + ~23s browser install + ~15s overhead = **~53 seconds total playwright job**.

## 12. Recommended weekly full-regression suite

Weekly runs on `main` via `schedule: cron` + `workflow_dispatch`:

- `tests/accessibility.spec.js` — all 13 pages
- `tests/contrast.spec.js` — all 14 tests
- `tests/navigation.spec.js` — all 5 tests (including the Pagefind flake)
- **Optional expansion (only if evidence supports):** curated browser regressions across domain specs (`tests/detail-ux-*.spec.js`, `tests/course-relation-ux-01.spec.js`, `tests/opetus-ia-01.spec.js`, `tests/home-nav-correction-01.spec.js`, `tests/o1-orientation.spec.js`, `tests/detail-hero-01.spec.js`). Include ONLY if failure would meaningfully improve visibility of regressions that PR-only paths miss.

**Do NOT** run all `tests/*.spec.js` weekly. That includes unit-style spec files (Pagefind facets, `pf5-*`, etc.) that already run at PR time via `test:unit` or would create noise.

**Recommended weekly scope:** the current PR set exactly (`accessibility + navigation + contrast`), plus optional 3–5 domain regressions as an explicit list.

## 13. Scheduling

Recommend one job:

```yaml
name: Weekly Playwright regression
on:
  schedule:
    - cron: "0 5 * * 1"  # Mondays 05:00 UTC
  workflow_dispatch:
```

Rationale:
- Once/week (Monday morning UTC) is sufficient for main-only regression.
- `workflow_dispatch` retains ad-hoc manual runs.
- Trigger targets `main`, tests the currently-deployed state.
- Failure emits a normal Actions failure → visible in the Actions tab; can escalate to email/notification later if needed.

`build.yml` already has a `schedule: cron: "0 5 * * 1"` weekly pattern per prior workstream — reuse the same slot to avoid CI runner contention.

## 14. PR gate design

**Recommended shape (unchanged for build + verify + deploy):**

```
staging.yml (unchanged apart from playwright step)
├─ build             (SSR + artifact upload)
├─ verify            (needs: build) — static SEO/robots/hreflang checks
├─ playwright-smoke  (needs: build, if: pull_request) — smoke tag only
└─ deploy            (needs: build+verify, if: staging)
```

**New workflow file:** `.github/workflows/weekly-playwright.yml`:

```yaml
name: Weekly Playwright regression
on:
  schedule:
    - cron: "0 5 * * 1"
  workflow_dispatch:
jobs:
  full-regression:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: "24", cache: npm }
      - run: npm ci
      - run: npm run build:no-og
        env: { DISABLE_OG_IMAGES: "true" }
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js
        env:
          PLAYWRIGHT_USE_STATIC_SERVER: "true"
          PLAYWRIGHT_A11Y_OFFLINE: "true"
```

Weekly rebuilds `_site` locally to guarantee currency (main is the target; there is no artifact from PR builds). Total weekly time: ~7 min (build ~5m + tests ~5m minus parallelism). Acceptable.

## 15. Expected PR time saving

| Job | Before | After | Δ |
|---|---|---|---|
| build | ~5m | ~5m | 0 |
| verify | ~20s | ~20s | 0 |
| **playwright** | **~5m 51s** | **~53s** | **−4m 58s** |
| Total PR wall-clock (parallel jobs) | ~6m 30s (playwright dominates) | ~5m 30s (build dominates) | **~1m end-to-end** |

The user-visible PR feedback wait becomes bounded by the build job (~5m) instead of the Playwright job (~5m 51s). If the build itself is ever optimized, the smoke gate's ~53s becomes the ceiling.

## 16. Flakiness / risk assessment

- **Pagefind search flake preserved in weekly** — protects PR gate from the historical timing race that has caused rerun-needed failures (PR #200, #218 flaky-recovered).
- **Focus-trap tests kept on PR gate** — these are the highest-confidence browser-only regressions and must not slip past PR time.
- **Presentations contrast tests moved to weekly** — 96s of local execution justified only when template/CSS changes affect that archive; content-only PRs get a clean gate.
- **No new caching, no new parallelism, no path filters** — determinism preserved.
- **Weekly failure visibility** — Actions tab default. If weekly failure needs stronger alerting later, add a separate slice.

## 17. Architecture Closure 1.0 impact

**No AC1 reopen trigger.** This is CI-only:

- Canonical Content v1 unchanged.
- Pagefind unchanged.
- Runtime site behavior unchanged.
- No new abstraction, no new schema, no runtime JSON, no SSR change.

**AC1 remains CLOSED / GREEN / MAIN.**

## 18. Final decision

**CONDITIONAL GO — smallest correct implementation.**

Conditions:
1. PR smoke must retain: navigation (all 5 except Pagefind FI-term), Homepage accessibility, Homepage contrast, KPI text contrast.
2. Weekly regression runs the current full PR set (unchanged coverage), triggered by schedule + workflow_dispatch.
3. Smoke tagging is grep-based via `--grep "@smoke"`, added as tag suffixes to selected test names in existing specs — NO test-file duplication.
4. No caching, no parallelism, no path filters in this slice.

If any of the above cannot be met simply, the recommendation collapses to NO-GO (keep current behavior).

## 19. Bounded next workstream (exactly one, if approved)

### CI-PERF-02-IMPL — PR Playwright smoke gate + weekly full-regression workflow

Scope:
1. Tag 6 tests in `tests/navigation.spec.js`, `tests/accessibility.spec.js`, `tests/contrast.spec.js` with `@smoke` suffix in test titles (single-word suffix per targeted `test('… @smoke', …)`).
2. Update `.github/workflows/staging.yml` playwright step to `npx playwright test --grep "@smoke" tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js`.
3. Add new `.github/workflows/weekly-playwright.yml` with `schedule` + `workflow_dispatch` triggers, matching the current full test set.
4. Verify locally that:
   - `--grep @smoke` returns the 6 tagged tests (fast).
   - Unmarked run returns all 32 tests (weekly-equivalent).
   - Focus-trap + theme persistence tests remain in smoke.
   - Pagefind Finnish-term test is NOT in smoke.
5. New closure `docs/ci-perf-02-implementation-closure-YYYY-MM-DD.md`.

Non-goals:
- No changes to Canonical Content v1, Pagefind, site runtime, template code, or tests' assertion logic.
- No caching of Playwright browsers.
- No parallel worker count changes.
- No path-based skipping.
- No new domain regressions added to weekly (leave that as a future slice if repo evidence supports it).

Estimated diff: ~15 lines (6 test-title edits + 1 workflow line change + 1 new ~25-line workflow file) + closure doc.

Runtime impact: PR playwright job **~5m 51s → ~53s** (median). Weekly full regression ~7m against `main` once per week.

Architecture Closure 1.0 status: expected to remain **CLOSED / GREEN / MAIN** after IMPL (CI-only).

**Await explicit implementation authorization before starting CI-PERF-02-IMPL. This audit stops here.**
