# Post-Closure Next Workstream Selection Audit

Date: 2026-08-29
Status: `SELECTION COMPLETE / DOCS-ONLY`

Repository-evidence-based selection audit for the single next
post-closure workstream on `jarilaru.fi` after Architecture Closure 1.0
(AC1) and R1 have reached their justified stopping points. Docs-only —
no implementation performed in this audit.

## Repository state

- Branch: `audit/post-closure-next-workstream-selection`
- Base: `origin/main` at `300bec5fdd1ea3cecf0a61c05a1d49720182e609` (post PR #167 R1 closure docs merge, `2026-08-29T18:01:25Z`).
- Local HEAD at audit start: `300bec5fdd1ea3cecf0a61c05a1d49720182e609`.
- `git status`: worktree clean apart from `.cache/api-fallback/*` side-products (`crossref-enrichments-v1.json`, `finna-aoe-v2.json`, `jufo-enrichments-v1.json`). Preserved per project convention — not staged, not deleted.
- No production code, template, JS, CSS, canonical data, or Pagefind change performed by this audit.

## Current architecture state

- **Architecture Closure 1.0** — `CLOSED / GREEN / MAIN`. Tag `architecture-closure-1-0` → `41b88d25` (evidence: `docs/architecture-closure-1-0-closure-2026-08-29.md`, `docs/architecture-closure-current-state-reconciliation-2026-08-29.md`).
- **R1 related-content** — `CLOSED / MAINTENANCE` per `docs/r1-related-content-closure-2026-08-29.md`. Shared `content-context-sidebar.njk` present on Publications / Presentations / Media / Blog / Writings / Theses / generic markdown pages. R1-ADR1 retained the semantic layer as bounded auxiliary ranking; no new embedding/LLM infrastructure authorized.
- **Presentations Slice 3 C1** — `CLOSED`. All 218 archive cards SSR, hidden-toggle progressive enhancement, canonical/source/landing semantics intact.
- **Media M2** — `CLOSED`. Canonical unified pipeline; shared discovery facets; localized labels.

## Evidence reviewed

Read directly on current `main`:

- `docs/architecture-closure-1-0-closure-2026-08-29.md`
- `docs/architecture-closure-current-state-reconciliation-2026-08-29.md`
- `docs/r1-related-content-closure-2026-08-29.md`
- `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md`
- `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md`
- `docs/r1b1-thesis-related-content-surface-convergence-2026-08-29.md`
- `docs/p1a-site-performance-baseline-2026-08-29.md`
- `docs/pf-perf1b-first-search-remeasurement-2026-08-29.md`
- `docs/presentations-slice3-c1-closure-2026-08-29.md`
- `docs/presentations-media-architecture-closure-reconciliation-2026-08-28.md`

Verified by direct source inspection:

- `src/_includes/related-presentations.njk` — full body, including CSS block lines 121–173.
- `src/fi/yritys.md:275–305` — live consumer.
- `src/en/company.md` — no `related-presentations` include, no equivalent presentation strip.
- `src/css/larux-page.css:23` — `.larux-section--presentations .related-presentations` selector.
- `src/_includes/thesis-detail-body.njk:150–151` — R1-B1 shared include, in the correct `<aside>`.
- `src/js/find-explore.js:1046,633` — body-class `find-explore-active` toggle + `returnTo` decoration on search-time result URLs.
- `src/css/theses-page.css:295–298` — pager-hide rule `body.find-explore-active .thesis-archive-pager { display: none; }`.
- `tests/th-cite1-phase3-thesis-pagination.spec.js:123–136` — the specific failing case (`active thesis search replaces the same tbody and reset restores SSR rows and pagers`).

Verified by direct test run against the current-main static build (`PLAYWRIGHT_USE_STATIC_SERVER=true` against `_site/` built on `300bec5f`):

- The `th-cite1-phase3` baseline failure at line 133 reproduces on `300bec5f`. Actual failure evidence is captured in "Regression candidates" below.

Verified by grep across `src/`, `scripts/`, `.eleventy.js`, `eleventy.filters.js`, `tests/`:

- `related-presentations` — one live template consumer (`src/fi/yritys.md:290`) + one CSS selector (`src/css/larux-page.css:23`). **The "orphan" claim in R1-A, R1 closure, and R1-ADR1 is factually stale on `300bec5f`.**
- `presentationPagefind.js` — one live reference (`scripts/audit-pf5-native-result-card-variants-apa7.js:43`). Full duplicate-injection reconciliation status noted below under PF5-hygiene-1.
- `data-pagefind-sort="date:..."` on Presentations detail — none (documented Slice 3 C1 debt item 3).

## Candidate inventory

Classified per the audit's six categories.

### 1. Regression

- **TH-CITE1-BASELINE** — `tests/th-cite1-phase3-thesis-pagination.spec.js:123` fails on `300bec5f`.

### 2. Maintenance

- **RP-CONVERGE-01** — `src/_includes/related-presentations.njk` + `src/fi/yritys.md:290` live consumer + stale "orphan" claim in 3 docs; missing EN parity on `src/en/company.md`.
- **DOC-DRIFT-01** — narrow: correct only the "orphan" claim in R1-A / R1 closure / R1-ADR1 (subset of RP-CONVERGE-01).

### 3. Cleanup / deletion

- **PF5-hygiene-1** — reconcile the PF5-G2 Eleventy computed projection with `scripts/_lib/presentationPagefind.js` postbuild injection; pick one owner, delete the other. Repository-evidenced non-blocker per reconciliation doc §5, Slice 3 C1 closure debt item 1.
- **PRES-SORT-01** — add `data-pagefind-sort="date:..."` on Presentation detail template. Slice 3 C1 debt item 3. Only relevant if a later discovery workstream needs presentation date sorting.
- **NATIVE-PRIMS** — future native-HTML-primitive experiments (dialog / tooltip / disclosure). Non-blocker per reconciliation `NATIVE-PRIMITIVES` note.

### 4. Performance

- **NONE — decided.** P1-A concluded `No immediate optimization justified; keep baseline as regression guard.` PF-PERF1B concluded `No immediate PF-PERF optimization justified.` No new measurement contradicts either.

### 5. UX / content experience

- **NONE — no concrete evidence on current `main`.** The homepage information-architecture / awards / testimonials / cross-domain items in the historical UX1 lane list have no specific repo-evidenced friction on current `main` beyond what R1 has already addressed.

### 6. New feature

- **NONE.** No repo-evidenced feature request. No AC1 reopen condition. R1-ADR1 prohibits new embedding/LLM infrastructure without a separate architecture decision.

## Regression candidates — detail

### TH-CITE1-BASELINE

- **Evidence** (reproduced on `300bec5f`): the assertion `expect(resultsLocator(page).locator(".thesis-archive-title-link").first()).toHaveAttribute("href", "/opinnaytteet/62699/")` at line 133 receives `href="/opinnaytteet/62699/?returnTo=%2Fopinnaytteet%2F%3Fq%3DRiikonen"`.
- **Root cause**: intentional O1 orientation `returnTo` decoration in `src/js/find-explore.js:633` — `targetUrl.searchParams.set("returnTo", currentReturnTo())` decorates every search-time result URL with the current search-active URL so the detail page's "back to search" resumes the search state. The behavior is deliberate and consistent with the O1 orientation pattern used across the site.
- **User impact**: **minimal** — the href still resolves correctly to `/opinnaytteet/62699/`; the returnTo appendix is functional. This is test-drift against a design pattern rolled out after the test was written, not a user-visible regression. It does not degrade search or landing.
- **Secondary effect**: because the earlier assertion at line 133 fails, the subsequent pager-hide assertions at line 135–136 are never evaluated. That means the actual `body.find-explore-active .thesis-archive-pager { display: none; }` behavior (per `src/css/theses-page.css:295–298`) is currently untested. That CSS mechanism is present and simple, but this test cannot presently guard it.
- **Affected files**: `tests/th-cite1-phase3-thesis-pagination.spec.js` (assertion update), optionally a helper that normalizes hrefs by stripping `returnTo=` for the equality check.
- **Complexity**: trivial. Effort ≤ 30 min.
- **Risk**: minimal — test-only change.
- **FI/EN implications**: the FI archive is the tested surface; the EN archive (`/en/theses/`) is exercised earlier in the same file (line 116–121) and does not currently fail.
- **Measurable success**: `npx playwright test tests/th-cite1-phase3-thesis-pagination.spec.js` reports **5/5 pass**, and the pager-hide assertion is now reached and asserted.
- **Deletion opportunity**: none directly; a small helper could be added if used more than once.
- **Further audit needed?**: no.

## Maintenance / cleanup candidates — detail

### RP-CONVERGE-01 — `related-presentations.njk` convergence + doc drift

- **Evidence**:
  - `grep -RnE 'related-presentations' src/` on `300bec5f`: one live template include at `src/fi/yritys.md:290`, one CSS selector at `src/css/larux-page.css:23`, plus the include file itself (`src/_includes/related-presentations.njk`).
  - The R1-A audit (`docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md:79–84`, line 243, line 254) states "Currently orphaned … no live consumers". The R1 closure doc (`docs/r1-related-content-closure-2026-08-29.md:182`) repeats "no template consumer exists". The R1-ADR1 doc (`docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md:214`) refers to it as "unrelated orphan". These are factually stale on current `main`.
  - `src/fi/yritys.md:290` renders a marketing strip titled "Viimeisimpiä koulutusesityksiä" using `canva.tableRows | sort … | sivuyhteys` — a legacy data path outside the canonical `computeRelatedContent` model, using a non-canonical `sivuyhteys` grouping field.
  - `src/en/company.md` contains no equivalent — an FI/EN parity gap.
- **Affected surfaces**: `/yritys/` (FI Kouluttaja/company page), `/company/` (EN — no equivalent today).
- **Current user impact**: **narrow** — one FI marketing page, one 3-item strip. Not on a canonical detail page.
- **Architecture impact**: **modest but real** — this is a parallel content-ownership path (`canva.tableRows` + `sivuyhteys` bespoke sort/filter) living outside the canonical Presentations collection + canonical `contexts` model that AC1 and R1 established as authoritative. Converging it aligns yritys.md with the AC1 architecture without changing user-visible content shape.
- **Complexity**: small. One include + one CSS class + one consumer + three docs.
- **Risk**: low. The strip's data source (`canva.tableRows`) is still built; migrating to `collections.presentations` filtered by a canonical field is a like-for-like source swap.
- **FI/EN implications**: convergence work naturally exposes the EN parity gap. Fixing FI without EN would keep the asymmetry; fixing both is small.
- **Measurable success**:
  - `grep -RnE 'related-presentations' src/` returns zero live template consumers.
  - Deletion of `src/_includes/related-presentations.njk` and its CSS block leaves the built `_site/yritys/index.html` marketing strip rendered from canonical data with visual parity.
  - EN parity added or EN parity gap explicitly documented as intentional.
  - R1-A / R1 closure / R1-ADR1 orphan claims corrected on `main`.
- **Deletion opportunity**: **yes** — `src/_includes/related-presentations.njk` (185 lines including inline CSS) plus one CSS selector in `src/css/larux-page.css`.
- **Further audit needed?**: **minor** — the yritys.md strip's intent (marketing lead-gen for training/coaching) is not a "related-content sidebar" — it is a curated "latest training presentations" surface. The convergence should use `collections.presentations` filtered by a canonical field (likely a canonical `contexts` value corresponding to the current `sivuyhteys="kouluttaja-sivu"` marker, or a small explicit tag), **not** `content-context-sidebar.njk` (which is for detail pages, not hub-page marketing strips). This mapping check is a ~15 min task inside the slice, not a separate audit.

### PF5-hygiene-1

- **Evidence**: reconciliation doc line 216 — "reconcile the PF5-G2 Eleventy computed projection with `scripts/_lib/presentationPagefind.js` postbuild injection. Choose one owner; delete the other. Neither breaks anything today."
- **Current user impact**: **none** (build-time only).
- **Architecture impact**: modest — two owners for the same discovery projection is duplicate responsibility.
- **Complexity**: **larger than RP-CONVERGE-01** — requires a consumer audit for `/data/presentations-page.json` (Slice 3 C1 debt item 4: 6 audit scripts + `presentationPagefind.js` + `presentations-page.js` consumers) and a decision on which owner survives.
- **Risk**: medium — Pagefind is production discovery infrastructure.
- **Further audit needed?**: **yes** — consumer audit first.

## Decision matrix

Scoring 1–5 per criterion. Higher is better.

| Candidate | User value | Evidence strength | Simplification | Risk (inv.) | Effort efficiency | Architectural fit | Measurability | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **RP-CONVERGE-01** | 2 | 5 | 4 | 4 | 4 | 5 | 4 | **28** |
| **TH-CITE1-BASELINE** | 1 | 5 | 1 | 5 | 5 | 2 | 5 | **24** |
| PF5-hygiene-1 | 1 | 3 | 4 | 3 | 2 | 4 | 3 | 20 |
| PRES-SORT-01 | 1 | 2 | 1 | 4 | 3 | 2 | 3 | 16 |
| STOP (F) | — | — | — | — | — | — | — | valid fallback |
| Performance (P1/PF-PERF) | 1 | 1 (decided out) | — | — | — | — | — | rejected |
| UX / new feature | 1 | 1 (no evidence) | — | — | — | — | — | rejected |

Notes on scoring:

- **RP-CONVERGE-01 user value** is 2 (single FI marketing page); **evidence strength** is 5 (three docs contradict current `main`, one live consumer, one FI/EN parity gap); **architectural fit** is 5 (removes a parallel content-ownership path).
- **TH-CITE1-BASELINE user value** is 1 (URL noise only; href still functional); **evidence strength** is 5 (reproduced on `300bec5f` in this audit); **architectural fit** is 2 (test-only, no architecture reinforcement).
- **PF5-hygiene-1 effort efficiency** is 2 (requires consumer audit sequence).

## Selected next workstream

**B — Maintenance / cleanup.**

**`NEXT WORKSTREAM = RP-CONVERGE-01`**

- Category: Maintenance / cleanup.
- Scope: converge `src/fi/yritys.md`'s "Viimeisimpiä koulutusesityksiä" marketing strip to a canonical data path over `collections.presentations`; delete `src/_includes/related-presentations.njk` and its unique CSS selector; correct the stale "orphan" claim in R1-A / R1 closure / R1-ADR1; add or explicitly justify skipping EN parity on `src/en/company.md`.

## Why the alternatives do not win

- **TH-CITE1-BASELINE** (regression) — the failure is test drift against an **intentional** design pattern (`src/js/find-explore.js:633` deliberately sets `returnTo` per the O1 orientation contract used across the site). The href still resolves; the returnTo appendix is functional and expected. This is not a user-visible regression, so the "regression outranks cleanup" rule in the selection instructions does not fire in favor of it. It remains a small hygiene follow-up but does not warrant being the single next workstream.
- **PF5-hygiene-1** — depends on a `/data/presentations-page.json` consumer audit sequence that is a larger commitment than a single next slice, and the current owners do not conflict at runtime. Non-blocker per two prior docs.
- **P1 / PF-PERF performance work** — P1-A (`No immediate optimization justified`) and PF-PERF1B (`No immediate PF-PERF optimization justified`) both concluded no user-visible bottleneck justifies opening an optimization slice today. Old roadmap text `P1 = LATER / BASELINE FIRST` is superseded by the newer measured evidence.
- **UX1 broad lane** — no concrete repo-evidenced friction remains on current `main` beyond what R1 addressed; generic "improve homepage IA / expose awards / cross-domain content" candidates lack an exact surface with an exact problem.
- **New embedding / LLM / semantic recommender work** — explicitly prohibited by R1-ADR1 without a separate architecture decision backed by new measurement evidence. AC1 remains `CLOSED / GREEN / MAIN` with no reopen condition met.
- **STOP (F)** — technically defensible (only bounded, low-value debt remains), but the winning candidate has genuine architectural benefit (removes a parallel content-ownership path), is repo-evidenced on three counts (stale docs, live parallel consumer, FI/EN gap), and is small. Choosing STOP would leave those three specific inaccuracies on `main` when they can be corrected in a bounded slice.

## Proposed bounded slice

### RP-CONVERGE-01 — `related-presentations` convergence + doc drift correction

- **Proposed ID/name**: `RP-CONVERGE-01`.
- **Category**: Maintenance / cleanup.
- **Exact problem**:
  1. `src/_includes/related-presentations.njk` is a parallel-content-ownership renderer over `canva.tableRows` + non-canonical `sivuyhteys` grouping, used on one FI page.
  2. Three closure docs (R1-A, R1 closure, R1-ADR1) state it is orphan; on current `main` it is not — `src/fi/yritys.md:290` is a live consumer.
  3. `src/en/company.md` has no equivalent presentation strip → FI/EN parity gap.
- **Evidence**:
  - `grep -RnE 'related-presentations' src/` (see "Evidence reviewed").
  - `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md:79,84,243,254`; `docs/r1-related-content-closure-2026-08-29.md:182,208`; `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md:214`.
  - `src/fi/yritys.md:275–305` vs `src/en/company.md` (299 lines, no equivalent).
- **Scope**:
  - Replace `{% include "related-presentations.njk" %}` in `src/fi/yritys.md` with an inline Nunjucks marketing strip over `collections.presentations` filtered by a canonical field that reproduces today's `sivuyhteys="kouluttaja-sivu"` selection (candidate field: canonical `contexts` value, or a small explicit tag; picked after a 15-min mapping check inside the slice).
  - Add or explicitly justify skipping the equivalent strip on `src/en/company.md` (FI/EN parity decision).
  - Delete `src/_includes/related-presentations.njk`.
  - Delete the `.larux-section--presentations .related-presentations` selector in `src/css/larux-page.css:23`.
  - Amend R1-A, R1 closure, R1-ADR1 to correct the "orphan" claim to reflect the actual convergence outcome (not orphaned pre-slice; converged in this slice).
- **Non-goals**:
  - No change to canonical content, canonical fields, or `contexts` semantics.
  - No change to `computeRelatedContent`, `content-context-sidebar.njk`, `semanticRelated.json`, or any R1 surface.
  - No change to Pagefind projections, discovery, or search.
  - No change to any other detail template or the shared O1 orientation.
  - No new embedding / LLM infrastructure (per R1-ADR1).
  - Not a broader "yritys marketing overhaul" — only the presentations strip.
- **Authoritative data source**: `collections.presentations` (canonical Presentations collection).
- **Current data/render flow**: `canva.tableRows | sort(true, false, "date") → filter by item.sivuyhteys → template render inside include`.
- **Intended data/render flow**: `collections.presentations | canonical filter → SSR strip render inline in yritys.md`.
- **Exact likely files involved**:
  - `src/fi/yritys.md` (replace 6-line include block with a small inline Nunjucks loop).
  - `src/en/company.md` (parity add OR explicit justification comment).
  - `src/_includes/related-presentations.njk` (delete).
  - `src/css/larux-page.css` (delete one selector block at line 23).
  - `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md` (amend orphan claim in §"Duplication / deletion opportunities" §"Evidence" §"Table").
  - `docs/r1-related-content-closure-2026-08-29.md` (amend line 182 and line 208).
  - `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md` (amend line 214).
- **Deletion opportunity**:
  - `src/_includes/related-presentations.njk` (~185 LOC including inline CSS).
  - `.larux-section--presentations .related-presentations` selector in `src/css/larux-page.css`.
  - Optional (out of scope for this slice unless the mapping check proves it dead): `sivuyhteys` field processing in `src/_data/presentationsPage.js` if no other consumer remains.
- **Tests required**:
  - Add one small Playwright assertion that `/yritys/` still renders a "Viimeisimpiä koulutusesityksiä" strip with at least one canonical presentation card and canonical local landing hrefs. No JS assertion needed (build-time render).
  - (If EN parity added) mirror the same assertion on `/company/`.
- **Measurements required**:
  - `grep -RnE 'related-presentations' src/` returns zero live template consumers after the slice.
  - Build succeeds: `CACHE_ONLY=true DISABLE_OG_IMAGES=true npm run build:no-og` — `Copied … Wrote …` count matches or differs only by the deletion.
  - `_site/yritys/index.html` retains a strip with visual parity (before/after screenshot diff or DOM presence check).
- **FI/EN parity requirements**:
  - Either (a) add the equivalent inline strip to `src/en/company.md` using the same canonical filter, or (b) add an inline HTML comment in `src/en/company.md` explaining why the strip is intentionally FI-only (marketing target audience is Finnish training buyers).
- **Architecture risks**:
  - Very low. Removes a parallel content-ownership path — reinforces AC1 and Canonical Content v1.
  - Does not touch canonical semantics, source/landing semantics, Pagefind, or R1 surface.
  - Does not create browser-side related-content ownership.
  - Does not reopen AC1 or R1.
- **Stopping condition**: the slice is complete when all four are true:
  1. `src/_includes/related-presentations.njk` is deleted.
  2. `src/fi/yritys.md` still renders a "latest training presentations" strip driven by `collections.presentations`.
  3. FI/EN parity is either implemented or explicitly justified in `src/en/company.md`.
  4. R1-A / R1 closure / R1-ADR1 orphan claims are corrected on `main`.

## Deletion opportunity

The winning slice **does** produce a bounded, verifiable deletion:

- `src/_includes/related-presentations.njk` — full file.
- `.larux-section--presentations .related-presentations` — one CSS selector block in `src/css/larux-page.css`.
- Optional (guard behind mapping check): the `sivuyhteys` field-processing paths in `src/_data/presentationsPage.js` if no other consumer remains — deferred out of the initial slice unless the check proves it dead.

## AC1 reopen check

Explicit evaluation per the AC1 reopen conditions:

| Reopen condition | Triggered? | Reason |
| --- | --- | --- |
| Duplicate content ownership | **No** — this slice removes a duplicate ownership path, not creates one. |
| Canonical semantics in browser JS | **No** — no browser JS added or modified. |
| Pagefind becoming canonical storage | **No** — Pagefind not touched. |
| Runtime JSON → HTML duplicating SSR | **No** — no runtime JSON path added; the SSR path replaces a build-time bespoke path with a build-time canonical path. |
| Source / landing / context / public-contract regression | **No** — no canonical fields, no public JSON contract, no source/landing semantics changed. |
| Loss of FI/EN shared-architecture parity | **Improved** — this slice explicitly addresses the existing FI/EN gap on the yritys/company page. |

**`Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.`**

## Stopping condition (for the audit itself)

This audit is complete when:

- The candidate inventory covers regression / maintenance / cleanup / performance / UX / new-feature per instructions.
- Each candidate is scored on the same 7-criterion matrix.
- Exactly one workstream is selected (or STOP is chosen with justification).
- The alternatives-rejected list names the strongest three and explains why each loses.
- The AC1 reopen check is explicit.
- No production files are modified.

All satisfied.

## Also record what NOT to do next

- **Do NOT re-open R1** or extend the semantic layer without a separate architecture decision (per R1-ADR1). The retained semantic boost is auxiliary ranking infrastructure only.
- **Do NOT open a broad UX1 lane** — no concrete repo-evidenced friction beyond R1's coverage on current `main`.
- **Do NOT open a Performance slice** — P1-A and PF-PERF1B decisions stand; opening one now would be roadmap inertia against measured evidence.
- **Do NOT delete `/data/presentations-page.json`** without the consumer audit (Slice 3 C1 debt item 4: 6 audit scripts + `presentationPagefind.js` + `presentations-page.js`).
- **Do NOT bundle PF5-hygiene-1 into RP-CONVERGE-01** — different surface, larger risk profile, requires its own consumer audit.
- **Do NOT ship the `th-cite1-phase3` test update without confirming the returnTo behavior is the intended O1 contract** — if the intent is to strip the transient `?q=…` from the returnTo target, that is a small implementation change, not a test-only change. Either way this is a follow-up hygiene item, not the next single workstream.
