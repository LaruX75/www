# feat/canva-analysis-data-driven — Branch & Worktree Audit

Date: 2026-08-21

Status: AUDIT-ONLY. No git-tree modification. No `restore`, `reset`, `clean`,
`stash`, `commit`, `push`, `rebase`, or `merge` was performed. No file in the
canva worktree was touched.

Primary worktree inspected:
`/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2` on branch
`feat/canva-analysis-data-driven`.

Audit-doc worktree (this doc):
`/private/tmp/www-t1-post-b2c-audit`, detached at `origin/main`.

## 1. Executive Verdict

**VERDICT B — SALVAGE THEN RETIRE.**

- Every committed local branch commit is functionally already on `main` via `codex/*` reimplementation branches (4 of 5 are byte-identical patches; the 5th is an earlier iteration of the same commit-message pair).
- The dirty working tree is a partial mid-migration snapshot of F3C-P6 whose canonical form is already on `main` via PR #88 (`fabad8f0`) and its follow-ups. 10 of 15 changed/untracked source files are byte-identical to `origin/main`.
- The 5 files that still differ from `main` are pre-starter-chips earlier iterations, superseded by later main commits.
- The 9 dirty `.cache/api-fallback/*` files are tracked build cache and each modification is a single `savedAt` timestamp line; safe to restore.
- Only two truly workspace-unique artifacts exist: two F4-R0 audit docs. F4-R0B is a self-referential diagnostic about this branch's own divergence and has no ongoing value. F4-R0 is a substantive cross-content research-semantics audit whose subject area is already CLOSED on `main` via F4-R1/R2/R3/closure docs; its salvage value is historical-analytical only, not functional.

Recommended cleanup path (documented, not executed here): salvage F4-R0 as a
standalone historical audit doc under a docs-only branch; then retire the
`feat/canva-analysis-data-driven` branch after its remote counterpart is
optionally deleted.

## 2. Git State

Values verified in the canva worktree with `git fetch origin`.

| Ref | SHA | Notes |
| --- | --- | --- |
| Local branch | `feat/canva-analysis-data-driven` | |
| Local HEAD | `4ebaa61634da10df7e9c3c849d01ba9ab191cada` | `feat: add media Find and Explore support`, 2026-08-15 |
| Remote branch HEAD | `9cabb69a5c8149b78654783e5b7a40b9b8d77faa` | `feat: enrich presentation metadata and layout` |
| `origin/main` HEAD | `3e5020603aaa772c61e144ee6fad8b97d6d5f567` | Merge PR #120 (T1 closure roadmap) |

Ahead/behind:

- local HEAD is **5 commits ahead** of `origin/feat/canva-analysis-data-driven` (unpushed local work)
- local HEAD is **0 commits ahead / far behind** `origin/main` for architecture: `git log origin/main..HEAD` returns 5 local-only commits, but `git log HEAD..origin/main` shows the branch is behind by dozens of merges (T1, O1, N1 baseline, F3C, F4, M2, PF-*, TH-CITE1, PUB-CITE1, seo/og/ci closures, etc.).
- The branch shares the merge-base `9cabb69a` with `origin/main`; that same SHA is the current remote branch tip, i.e. everything after `9cabb69a` on the branch is unpushed local work.
- The branch's own history shows it has been merged into `main` twice historically via PR #82 and PR #86 (visible in `git log` on `main`).

## 3. Committed Local-Only Commits vs `main`

All 5 unpushed local commits pair one-to-one with a commit already on `origin/main` that has an identical subject line and author/date. Pairing verified with `git patch-id --stable`:

| Local SHA | Main SHA | Subject | Patch equivalence |
| --- | --- | --- | --- |
| `74d06ac6` | `a413bf39` | feat: harden presentation Pagefind discovery | **IDENTICAL** |
| `0223751f` | `ce23a3d4` | feat: map presentation topics for contextual discovery | **IDENTICAL** |
| `506e1211` | `bfaf78f8` | fix: reconcile presentation topic coverage evidence | **IDENTICAL** |
| `eef968bf` | `b51b6bea` | docs: audit media Pagefind compatibility | **IDENTICAL** |
| `4ebaa616` | `335bc2d4` | feat: add media Find and Explore support | **EARLIER ITERATION** (890 ins / 17 del vs 977 ins / 3 del on the same 8-file surface) |

Conclusion: the local branch's post-merge-base history is fully superseded by main. No committed local commit adds new work not present on main. The 5th commit's earlier-iteration form is not worth cherry-picking because its canonical replacement is already merged (`335bc2d4`).

## 4. Uncommitted Files (28 total)

Classification legend:

- `SUPERSEDED / WT == MAIN` — working tree byte-identical to `origin/main`
- `SUPERSEDED / EARLIER ITERATION` — same file exists on main with a later iteration; local WT is an older snapshot
- `GENERATED CACHE / SAFE TO RESTORE` — tracked build cache, `savedAt`-only diff
- `SALVAGE CANDIDATE` — content not present anywhere on `main` and potentially valuable
- `TRANSIENT DIAGNOSTIC` — content not on main but only meaningful in the context of this stale branch itself

### 4.1 Modified files

| File | Diff shortstat | WT vs `origin/main` | Classification |
| --- | --- | --- | --- |
| `.cache/api-fallback/citations-openalex-semanticscholar.json` | 1/1 | `savedAt`-only | GENERATED CACHE / SAFE TO RESTORE |
| `.cache/api-fallback/crossref-enrichments-v1.json` | 1/1 | `savedAt`-only | GENERATED CACHE / SAFE TO RESTORE |
| `.cache/api-fallback/finna-aoe-v2.json` | 1/1 | `savedAt`-only | GENERATED CACHE / SAFE TO RESTORE |
| `.cache/api-fallback/finna-search-v1.json` | 1/1 | `savedAt`-only | GENERATED CACHE / SAFE TO RESTORE |
| `.cache/api-fallback/github-site-changes-v1.json` | 1/1 | `savedAt`-only | GENERATED CACHE / SAFE TO RESTORE |
| `.cache/api-fallback/jufo-enrichments-v1.json` | 1/1 | `savedAt`-only | GENERATED CACHE / SAFE TO RESTORE |
| `.cache/api-fallback/ouka-council-meeting-videos-v1.json` | 1/1 | `savedAt`-only | GENERATED CACHE / SAFE TO RESTORE |
| `.cache/api-fallback/researchfi-publications.json` | 1/1 | `savedAt`-only | GENERATED CACHE / SAFE TO RESTORE |
| `.cache/api-fallback/theses-oulurepo-v2.json` | 1/1 | `savedAt`-only | GENERATED CACHE / SAFE TO RESTORE |
| `docs/data/presentation-topic-coverage-diagnostics-f3c-p5.json` | 1/1 | differs from later main iteration | SUPERSEDED / EARLIER ITERATION |
| `docs/data/presentations-existing-html-f3c-p4.json` | 1179/1 | differs from later main iteration | SUPERSEDED / EARLIER ITERATION |
| `docs/data/presentations-pagefind-f3c-p4-baseline.json` | 1/1 | differs from later main iteration | SUPERSEDED / EARLIER ITERATION |
| `docs/presentations-pagefind-quality-f3c-p4-report-2026-08-14.md` | 1/1 | differs from later main iteration | SUPERSEDED / EARLIER ITERATION |
| `docs/presentations-topic-mapping-f3c-p5-report-2026-08-14.md` | 8/8 | differs from later main iteration | SUPERSEDED / EARLIER ITERATION |
| `src/_includes/presentations/archive.njk` | 82/58 | differs — WT lacks the starter-chips block later added on main | SUPERSEDED / EARLIER ITERATION |
| `src/_includes/presentations/feature-highlights.njk` | 0/2 | **WT == MAIN** | SUPERSEDED / WT == MAIN |
| `src/_includes/presentations/route-card.njk` | 1/2 | **WT == MAIN** | SUPERSEDED / WT == MAIN |
| `src/_utils/contentPresets.js` | 40/3 | **WT == MAIN** | SUPERSEDED / WT == MAIN |
| `src/css/presentations-page.css` | 50/7 | **WT == MAIN** | SUPERSEDED / WT == MAIN |
| `src/en/presentations.njk` | 9/310 | **WT == MAIN** | SUPERSEDED / WT == MAIN |
| `src/esitykset.njk` | 6/0 | differs — WT lacks the starter-chips assets later added on main | SUPERSEDED / EARLIER ITERATION |
| `src/js/presentations-page.js` | 477/1768 | **WT == MAIN** | SUPERSEDED / WT == MAIN |

### 4.2 Untracked files

| File | Present on `origin/main`? | Classification |
| --- | --- | --- |
| `docs/f4-r0-existing-cross-content-semantics-audit-2026-08-15.md` | NO (644 lines, workspace-unique) | SALVAGE CANDIDATE (historical audit) |
| `docs/f4-r0b-research-find-explore-git-reconciliation-2026-08-15.md` | NO (530 lines, workspace-unique) | TRANSIENT DIAGNOSTIC (about the branch's own divergence; retire with branch) |
| `docs/presentations-find-explore-f3c-p6-report-2026-08-14.md` | YES | SUPERSEDED / WT == MAIN |
| `scripts/audit-presentations-f3c-p6-built-output.js` | YES | SUPERSEDED / WT == MAIN |
| `src/_includes/presentations/result-card.njk` | YES | SUPERSEDED / WT == MAIN |
| `tests/presentations-archive.spec.js` | YES | SUPERSEDED / WT == MAIN |

## 5. Cache Audit

- `.cache/*` is `.gitignore`-excluded with an explicit whitelist for `.cache/api-fallback/**`, so the fallback cache is intentionally version-controlled (probably for build reproducibility when external APIs are unreachable).
- Each dirty cache file's diff is exactly two lines: one `-` and one `+`, both hitting the top-level `savedAt` field. No payload content changed by hand.
- Category for all 9 files: **SAFE TO RESTORE LATER** (or leave in place until a real workflow needs the refresh).

## 6. Actual "Canva" / Presentations Work Identified

The branch name (`feat/canva-analysis-data-driven`) suggests a Canva-analysis focus, but the actual working-tree work is the **F3C-P6 Presentations Find & Explore partial migration**, aligned with the shared `content-engine.js` / `content-presets.js` / `pe-list-render.js` stack.

Evidence in the workspace:

- untracked `docs/presentations-find-explore-f3c-p6-report-2026-08-14.md` documents the migration
- `src/js/presentations-page.js` is being shrunk from ~1,900 lines of inline hardcoded data to ~609 lines of a thin presentation-specific adapter
- `src/en/presentations.njk` removes ~310 lines of embedded `<script>` with duplicated canonical items, replacing them with `{% include "presentations/archive.njk" %}` and shared `pageScripts:`
- `src/_utils/contentPresets.js` adds the `FindExplore:presentations` preset and `presentationsPage` endpoint
- Test / script additions cover the migration verification (`tests/presentations-archive.spec.js`, `scripts/audit-presentations-f3c-p6-built-output.js`)

Same P6 work has already landed on `origin/main` via PR #88 (`fabad8f0`), plus the follow-up presentation topic / research-topic / media Find & Explore commits that ended up in main via `codex/*` branches (PRs #85 – #90). See §7.

## 7. Overlap With Current `main` Architecture

Cross-referenced against:

- `docs/site-architecture-closure-roadmap-2026-08-20.md`
- `docs/find-explore-presentations-f3c-closure-2026-08-15.md`
- `docs/o1-orientation-implementation-2026-08-20.md`

Overlap findings:

| Branch surface | Current main state | Verdict |
| --- | --- | --- |
| Presentations F3C-P6 migration | CLOSED / GREEN via PR #88 (`fabad8f0`); F3C invariants documented | FULLY SUPERSEDED |
| Presentation topic-mapping helpers | Merged via `ce23a3d4` (identical patch to local `0223751f`) | FULLY SUPERSEDED |
| Topic coverage evidence reconciliation | Merged via `bfaf78f8` (identical patch to local `506e1211`) | FULLY SUPERSEDED |
| Presentation Pagefind hardening | Merged via `a413bf39` (identical patch to local `74d06ac6`) | FULLY SUPERSEDED |
| Media Pagefind M1 audit | Merged via `b51b6bea` (identical patch to local `eef968bf`) | FULLY SUPERSEDED |
| Media Find & Explore M2 support | Merged via `335bc2d4` (larger, later iteration of local `4ebaa616`) | FULLY SUPERSEDED |
| Starter chips added later on main | Local `archive.njk` / `esitykset.njk` predate the addition | LOCAL VERSION OBSOLETE |
| F4-R0 cross-content research audit doc | Not on main; F4 closed via R1/R2/R3/closure without needing R0 | SALVAGE CANDIDATE (historical value) |
| F4-R0B branch-divergence diagnostic | Not on main; only about this branch | RETIRE WITH BRANCH |

No branch surface conflicts with current main architecture in the sense of contradicting Canonical Content v1, the Presentations local-first / external-first model, or the pageUrl / sourceUrl / externalUrl semantics. The branch's committed work is aligned with what eventually landed; it is just outdated because the codex-based reimplementations moved the same intent forward.

## 8. Salvage Units

### SALVAGE A — F4-R0 cross-content research-semantics audit

- Purpose: read-only audit dated 2026-08-15 (644 lines) inventorying which shipped content types carry research semantics and where research-membership is authoritative vs inferred.
- Files: `docs/f4-r0-existing-cross-content-semantics-audit-2026-08-15.md` (untracked, workspace-only).
- Dependencies: none — pure docs.
- Current-main conflict risk: **none** functionally. Main already documents F4 via R1/R2/R3/closure. Salvaging would add a historical audit doc that predates the R1 scoping.
- Standalone suitability: **HIGH**. A single docs-only branch could add this file under a name that makes its historical nature explicit (e.g., dated audit filename retained).
- Suggested cleanup path (documented, not executed): copy the file into a fresh docs branch cut from `origin/main`, verify link targets, docs-only PR.

### Non-salvage: F4-R0B git-reconciliation diagnostic

- Content is entirely about `feat/canva-analysis-data-driven`'s own divergence relative to `origin/main` at the time of writing. Once the branch is retired, the diagnostic has no ongoing referent.
- Not recommended for main; retire with the branch.

### Non-salvage: presentation P4/P5 report earlier iterations

- Local versions of `docs/presentations-pagefind-quality-f3c-p4-report-2026-08-14.md`, `docs/presentations-topic-mapping-f3c-p5-report-2026-08-14.md`, and the three `docs/data/presentations-*` datasets are earlier iterations. Main has the later, closure-form iterations. Nothing meaningful to salvage.

### Non-salvage: `starter-chips`-less presentation templates

- Local `src/_includes/presentations/archive.njk` and `src/esitykset.njk` are pre-starter-chips snapshots. Main's later versions with the starter chips are the current truth.

## 9. Cleanup Recommendation (documented only)

Recommended sequence when the user is ready to act on this audit (nothing is
executed here):

1. Salvage: copy `docs/f4-r0-existing-cross-content-semantics-audit-2026-08-15.md` to a docs-only branch cut from `origin/main`, then open a docs-only PR.
2. Retire branch: after salvage-PR merges, decide whether to keep the branch (as archived historical evidence) or delete it locally and remotely. The 5 unpushed local commits will be lost only in the byte-sense; their canonical content already lives on `main`.
3. Cleanup working tree: restore the tracked `.cache/api-fallback/*` files (`git restore`), restore the six SUPERSEDED / WT == MAIN modified files (they will match main after checkout of a main-based branch), and delete the four untracked files whose content is already on main. Leave F4-R0 out of the delete list until it is salvaged.
4. Consider deleting the branch itself only after the salvage PR is merged.

Do NOT execute any of these steps in this audit task.

## 10. Boundary confirmation

This audit performed **no** cleanup, **no** commit, **no** push, **no** rebase,
**no** merge, and **no** modification of any file inside the canva worktree.
The only file created is this docs file, and it lives in a separate audit
worktree (`/private/tmp/www-t1-post-b2c-audit`) detached at `origin/main`. No
`src/`, `tests/`, `.cache/`, `admin/`, `package*`, CI, or Pagefind
configuration file was written or modified.
