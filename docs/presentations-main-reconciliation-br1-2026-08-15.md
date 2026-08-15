# BR1 - Presentation Branch to Current Main Reconciliation

Date: 2026-08-15

## 1. Starting Git State

- Repository: `/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2`
- Original active branch: `feat/canva-analysis-data-driven`
- Original active HEAD: `506e1211ae3360647fa9518fa66acf72b561b750` (`fix: reconcile presentation topic coverage evidence`)
- `origin/main`: `8d7594bbc186dfc7c696b1689d89267a063d7465` (`docs: close research contextual Find and Explore v1`)
- Merge-base: `9cabb69a5c8149b78654783e5b7a40b9b8d77faa` (`feat: enrich presentation metadata and layout`)
- F4 merge: `be16a7f352eeb4b817a96ed229b9817a63d57834`
- F4 tag: `f4-research-find-explore-v1`, peeled to `be16a7f352eeb4b817a96ed229b9817a63d57834`

The original active workspace was dirty and was not used for history rewriting. Existing stashes were left untouched:

- `stash@{0}: On codex/f4-research-contextual-find-explore: wip: api fallback cache after f4 research build`
- `stash@{1}: On feat/canva-analysis-data-driven: wip: api fallback cache after canva cleanup`
- `stash@{2}: On feat/canva-analysis-data-driven: wip: leftover cache and pilot artifacts before canva cleanup`
- `stash@{3}: On main: cache-before-push`

## 2. Divergence History

`origin/main` had moved through the closed F2/F3/F4 sequence after the shared merge-base. The active presentation branch diverged before that later mainline history and continued presentation/F3C work independently. The absence of F4 from the presentation branch was treated as branch divergence, not a revert.

## 3. Main-Only Commits

Relevant main-only work after the merge-base included:

- F2 writings Find & Explore commits and merge/closure.
- F3A theses Find & Explore commits and merge/closure.
- F3B publications Find & Explore commits and merge/closure.
- PR #86 merge of earlier Canva/presentation work.
- F4 Research contextual Find & Explore commits, merge `be16a7f3`, and closure `8d7594bb`.

## 4. Presentation-Only Commits

Presentation/F3C commits unique to the active branch after the merge-base were replayed:

- `74d06ac6c19efb936264790335743d3eac4f750` - `feat: harden presentation Pagefind discovery`
- `0223751fc153013fe8302cf0ee0b47346bd15c07` - `feat: map presentation topics for contextual discovery`
- `506e1211ae3360647fa9518fa66acf72b561b750` - `fix: reconcile presentation topic coverage evidence`

The attachment also named `f1f5cebd4382147df7022221e765bf59e78886e7` (`refactor: integrate curated presentation semantics`). It exists on `codex/f3c-p1-presentation-semantics`, but it was not an ancestor of `origin/main` or the active presentation HEAD, and its final effects were represented by the later active presentation state. It was not cherry-picked separately.

## 5. Conflict Analysis

No Git conflicts occurred while replaying the three active presentation commits onto `origin/main`.

Semantic risk areas checked explicitly:

- Research page and homepage stayed from `origin/main`.
- `src/js/find-explore.js` stayed compatible with F2/F3/F4.
- Presentation archive/runtime state came from the verified active dirty P6 workspace, not from a blind old-branch merge.
- `Research` scope remained `publications,theses,writings`.
- Presentations were not added to Research.
- Cache-only/generated `.cache/api-fallback/*` changes were excluded from the commit.

## 6. Strategy Decision

Evaluated strategies:

- Rebase the dirty presentation branch onto `origin/main`.
- Merge `origin/main` into the dirty presentation branch.
- Create a clean branch from `origin/main` and replay presentation commits.
- Reconstruct the verified final presentation diff on a clean `origin/main` branch.

Selected strategy: clean `origin/main` worktree plus replayed presentation commits, then selected copy of verified uncommitted P6 presentation files from the original dirty workspace.

Reason: this preserved F4/mainline as the base of truth, avoided rewriting the dirty original workspace, avoided consuming unrelated stashes/cache files, and allowed deterministic verification of the final presentation state.

## 7. Reconciliation Performed

Created:

- Branch: `codex/presentations-main-reconciliation`
- Worktree: `/private/tmp/www-presentations-main-reconciliation`
- Base: `origin/main` at `8d7594bb`

Cherry-picked:

- `74d06ac6` -> `a413bf39`
- `0223751f` -> `ce23a3d4`
- `506e1211` -> `bfaf78f8`

Copied selected uncommitted P6 presentation files from the original workspace, including presentation data reports, P6 audit script, archive/result-card includes, presentation page JS/CSS/templates, and `tests/presentations-archive.spec.js`. R0/R0B docs and `.cache/api-fallback/*` dirty files were not copied.

## 8. Conflict Resolutions

No textual conflicts required resolution. One audit-only compatibility fix was applied to `scripts/audit-writings-legacy-runtime.js`: it now accepts the existing `origin/main` Pagefind dynamic import with query parameters. Runtime behavior, writings eligibility, and Research semantics were not changed.

## 9. F4 Preservation Evidence

Source evidence:

- `src/index.njk` links to `/tutkimus/#tutkimusnaytto`.
- `src/fi/tutkimus.md` contains `findExploreKind = "researchContext"`.
- `src/fi/tutkimus.md` contains `<section id="tutkimusnaytto">`.

Built-output evidence:

- `_site/tutkimus/index.html` contains `<section id="tutkimusnaytto">`.
- `_site/tutkimus/index.html` contains `data-find-explore-kind="researchContext"`.
- `_site/tutkimus/index.html` contains `data-find-explore-kinds="publications,theses,writings"`.
- `_site/index.html` links to `/tutkimus/#tutkimusnaytto`.
- No Research mount includes presentations.

`node scripts/audit-f4-research-built-output.js` passed with `ok: true`.

## 10. Presentation Preservation Evidence

Pre-reconciliation active workspace baseline:

- Canonical presentations: `218`
- Built local details: `139`
- Local detail records with `hasLocalDetail`: `138`
- Local-first: `138`
- External-first: `80`
- Topicless: `20`
- Representations: `231`
- Duplicate discovery identities: `0`
- P6 built-output audit: OK
- Presentation Pagefind title quality: `20/20 found, 19 top1`
- Preferred landing: `20/20 title-sample destinations correct`
- Existing HTML reuse: `139 reused local HTML documents, 0 new public pages`

Post-reconciliation baseline:

- Canonical presentations: `218`
- Built local details: `139`
- Local detail records with `hasLocalDetail`: `138`
- Local-first: `138`
- External-first: `80`
- Topicless: `20`
- Representations: `231`
- Duplicate discovery identities: `0`
- Canva total: `79`
- Canva with designId: `79`
- Canva with pageUrl: `16`
- Canva with existing local HTML: `18`
- Restored Canva mapping total: `12`
- Restored Canva mappings with existing local HTML: `12`
- Presentation Pagefind title quality: `20/20 found, 19 top1`
- Preferred landing: `20/20 title-sample destinations correct`
- Existing HTML reuse: `139 reused local HTML documents, 0 new public pages`

## 11. Build And Unit Results

- `npm ci`: passed; npm reported 4 high severity vulnerabilities, no audit fix run.
- `npm run build:no-og`: passed; 1455 files written.
- Pagefind postbuild: `ok: true`, `htmlDocumentsIndexed: 1442`, `presentationScopeLocalDocuments: 139`, `presentationScopeCustomRecords: 92`, `presentationCanonicalTotal: 218`, `presentationLocalLandingTotal: 138`, `presentationExternalLandingTotal: 80`.
- SEO dashboard: `pages=1442`, `missingDescription=0`, `missingOgImage=0`.
- Research.fi integrity: `56` archive publications, `56` metadata records, `56` research line, `55` curated themes.
- `npm run test:unit`: passed; 84 suites, 400 tests.

Network-backed data fetches failed or were skipped in sandbox/offline mode where expected, and the build used existing caches.

## 12. Regression Audit Results

Writings:

- `node scripts/audit-writings-built-output.js`: passed.
- `node scripts/audit-writings-page-projection.js`: passed.
- `node scripts/audit-writings-fi-client-parity.js`: passed.
- `node scripts/audit-writings-en-client-parity.js`: passed.
- `node scripts/audit-writings-legacy-runtime.js`: passed after audit-only import-pattern compatibility fix.
- `node scripts/audit-writings-pagefind.js`: passed.

Theses:

- `node scripts/audit-theses-built-output.js`: passed.
- `node scripts/audit-thesis-details-parity.js`: passed.
- `node scripts/audit-thesis-pagefind.js`: passed.

Publications:

- `node scripts/audit-publications-f3b-built-output.js`: passed.
- `node scripts/audit-publication-details-parity.js`: passed.
- `node scripts/audit-publications-page-projection.js`: passed.
- `node scripts/audit-publication-pagefind.js`: passed.

F4 Research:

- `node scripts/audit-f4-research-built-output.js`: passed.

Presentations:

- `node scripts/audit-presentations-f3c-p3-integration.js`: passed.
- `node scripts/audit-presentations-page-projection.js`: passed.
- `node scripts/audit-presentation-detail-parity.js`: passed.
- `node scripts/audit-presentations-page-client-parity.js`: passed.
- `node scripts/audit-presentation-pagefind.js`: passed.
- `node scripts/audit-presentation-topic-mapping.js`: passed.
- `node scripts/audit-presentations-f3c-p6-built-output.js`: passed.

## 13. Browser Results

Combined browser smoke:

```bash
PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test --workers=1 tests/f2-find-explore-smoke.spec.js tests/f3a-theses-find-explore.spec.js tests/f3b-publications-find-explore.spec.js tests/f4-research-find-explore.spec.js tests/presentations-research-smoke.spec.js tests/presentations-archive.spec.js
```

Result: `12 passed`.

The first non-escalated run could not start the local HTTP server due sandbox port binding permission. The escalated run passed.

## 14. Accessibility, Navigation, Contrast Results

`npm run test:a11y` was run twice:

- First full run: build passed; Playwright reported `30 passed`, `1 failed` on `Search dialog traps focus and returns it to the trigger`.
- Targeted rerun of the failing navigation test: `1 passed`.
- Second full `npm run test:a11y`: `31 passed`.

The failed first run is treated as a transient focus timing flake, not a reconciliation regression, because the same test passed in isolation and in the subsequent full run.

## 15. Pre/Post Presentation Metrics

| Metric | Before | After |
| --- | ---: | ---: |
| Canonical presentations | 218 | 218 |
| Built local details | 139 | 139 |
| Local details with `hasLocalDetail` | 138 | 138 |
| Local-first | 138 | 138 |
| External-first | 80 | 80 |
| Representations | 231 | 231 |
| Duplicate discovery identities | 0 | 0 |
| Topicless | 20 | 20 |
| Canva total | 79 | 79 |
| Canva with designId | not separately recorded | 79 |
| Canva with pageUrl | not separately recorded | 16 |
| Canva with existing local HTML | not separately recorded | 18 |
| Restored Canva mappings | not separately recorded | 12 |
| Pagefind title sample | 20/20 found, 19 top1 | 20/20 found, 19 top1 |
| Preferred landing sample | 20/20 correct | 20/20 correct |
| Existing HTML reuse | 139 reused, 0 new pages | 139 reused, 0 new pages |

## 16. Remaining Issues

- `npm ci` reported 4 high severity npm audit vulnerabilities. This was not changed in BR1.
- Presentation year/topic/event/role/language/source coverage remains intentionally partial per F3C evidence; this is not a BR1 regression.
- `test:a11y` showed one transient focus-test flake on the first full run, then passed in targeted and full reruns.

## 17. Recommendation

Next checkpoint: prepare PR/review packaging for `codex/presentations-main-reconciliation`, including a concise PR summary and verification notes, without changing Research semantics or starting the later F4 eligibility/filtering work.
