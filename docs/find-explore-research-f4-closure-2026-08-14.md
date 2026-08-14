# F4 Research Contextual Find & Explore v1 Closure

Date: 2026-08-14

## 1. Scope

F4 closes the Research contextual Find & Explore partial MVP. Scope was limited to FI `/tutkimus/`, a homepage route into that Research context, shared Find & Explore runtime reuse, and verification of the already closed writings, theses, and publications scopes.

Out of scope: F3C presentations, F3D media, O1 orientation, EN Research rollout, homepage Find & Explore mounting, master JSON creation, presentation architecture, media architecture, external enrichment, embeddings, and unrelated cleanup.

## 2. F4 Partial MVP

The delivered MVP adds one contextual cross-content Find & Explore surface to `/tutkimus/`. It helps users search across research-relevant publications, theses, and writings while preserving the existing Research page as a server-rendered narrative page.

## 3. Architecture

F4 follows the existing canonical content pattern:

```text
canonical content projections
      ->
Pagefind metadata
      ->
shared Find & Explore runtime
      ->
Research contextual discovery UI
```

No new canonical master object store or master JSON endpoint was introduced.

## 4. Shared Core

The implementation extends the existing shared `src/js/find-explore.js` runtime instead of forking a Research-only client. The Research context uses the same Find & Explore include and runtime path as writings, theses, and publications.

## 5. Included Scopes

The Research contextual surface intentionally includes only the three closed Find & Explore scopes:

- publications
- theses
- writings

Presentations and media remain explicit future workstreams.

## 6. Mixed Model

The Research surface is a contextual mixed-result browser. It does not replace the publication archive, thesis archive, writings archive, or their domain-specific semantics.

## 7. Topics

F4 reuses the existing curated topic vocabulary and does not introduce a second topic taxonomy. Topic controls are contextual discovery affordances, not a new canonical classification source.

## 8. SSR

`/tutkimus/` remains useful without JavaScript. The existing research lines, project context, publication highlights, and archive links remain server-rendered. Find & Explore is progressive enhancement.

## 9. Homepage

The homepage remains orientation-first. It links users toward the Research contextual discovery route but does not mount Find & Explore, load `find-explore.js`, add filters, or introduce a homepage result browser.

## 10. FI-Only

F4 is FI-first. The implemented route is `/tutkimus/`.

## 11. EN Deferred

No EN Research Find & Explore surface was implemented. EN remains a future decision and should not be inferred from F4.

## 12. Performance

Built-output audit measured the Research page delta against the F4 baseline:

- HTML bytes: +5,611.
- DOM elements: +53.
- Search inputs: +1.
- Buttons: +2.
- Local scripts: +1.
- Local script bytes: +19,602.
- Inline script bytes: +0.
- Runtime JSON references: 0.

Homepage delta stayed intentionally tiny:

- HTML bytes: +129.
- DOM elements: +1.
- Search inputs, buttons, local scripts, local script bytes, inline script bytes, and runtime JSON references: unchanged.

## 13. Cross-Content Quality

The Research contextual smoke test passed. The surface can return mixed publication, thesis, and writing results through the shared runtime and intended Pagefind scopes.

## 14. Writings Regression

Writings built-output audit passed with canonical total 290. Writings Pagefind audit passed: FI title samples 3/3 found and top 1; EN samples 6/6 found and top 1; topic samples 4/4 passed.

## 15. Theses Regression

Theses built-output audit passed with canonical total 169. Thesis Pagefind audit passed: title samples 8/8 detail found and top 1; author samples 4/4 top 1; filter-only samples 4/4 found.

## 16. Publications Regression

Publications built-output audit passed with canonical total 56. Publication Pagefind plain-title samples passed 8/8 detail found and 8/8 top 1. The previously documented exact-title limitation remains: exact-title samples found 5/8 detail pages and are not an F4 regression.

## 17. Browser Smoke

Combined browser smoke for writings, theses, publications, and F4 passed: 9/9.

## 18. Accessibility, Navigation, Contrast

Split serial verification passed:

- accessibility: 13/13
- navigation: 4/4
- contrast: 14/14

Total split evidence: 31/31. A combined accessibility plus navigation command exposed a reproducible inter-suite focus-state failure in the search-dialog focus test, while the same navigation test and full navigation suite pass independently. No accessibility test was weakened, skipped, or deleted.

## 19. Build And Unit

`npm run build:no-og` passed using existing cache fallback for unavailable external fetches.

`npm run test:unit` passed: 389/389.

## 20. GitHub Status

GitHub status checks for PR head `bd580fa75ae8cb4e10e4d3886ada405a01f1b6a2`: no GitHub status checks returned.

The PR was merged after explicit approval to merge without GitHub status checks, based on local verification gates.

## 21. PR And Merge

PR: #87, `Research contextual Find & Explore`, https://github.com/LaruX75/www/pull/87.

PR head commit: `bd580fa75ae8cb4e10e4d3886ada405a01f1b6a2`.

Merge commit: `be16a7f352eeb4b817a96ed229b9817a63d57834`.

Merge timestamp: `2026-08-14T13:07:52Z`.

## 22. Tag And Verified Target

Annotated tag: `f4-research-find-explore-v1`.

Tag target: `be16a7f352eeb4b817a96ed229b9817a63d57834`.

The tag points to the F4 merge commit, not this closure documentation commit.

## 23. Remaining Limitations

Known limitations after F4:

- Research contextual Find & Explore is FI-only.
- Presentations are not included and remain F3C evidence-gated.
- Media is not included and remains F3D suitability-audit-needed.
- Homepage does not host Find & Explore.
- The exact-title publication Pagefind limitation remains documented from F3B/P4c evidence.
- A combined accessibility plus navigation command has a reproducible inter-suite focus-state failure, while split suite verification is green.

## 24. Explicit Closure Status

F4 Research contextual Find & Explore v1 is closed green as a partial MVP.

Do not continue F4 in this checkpoint. The next roadmap items remain separate gates.
