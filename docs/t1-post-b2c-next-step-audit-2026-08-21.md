# T1 Post-B2C Next-Step Audit

Date: 2026-08-21

Status: DOCS-ONLY AUDIT

Base main SHA: `a59907432412bb538e65713c4dedfeef34a516f6`

Audit worktree: clean detached checkout of `origin/main`
(`/private/tmp/www-t1-post-b2c-audit`).
The `feat/canva-analysis-data-driven` worktree was not touched.

## 1. Purpose

Decide, on repo evidence and after the merge of T1B2C (PR #119), whether:

- A. T1 continues with another justified slice
- B. T1B3 = NO-GO / DEFER and T1 becomes CLOSED / MAINTENANCE, so the next active workstream is O1
- C. T1 needs one more bounded closure slice before O1

No production changes. Docs-only.

## 2. Completed T1 Slices (verified on `origin/main`)

| Slice | Status | Evidence on main |
| --- | --- | --- |
| T1A audit | CLOSED / GREEN / MAIN | `docs/t1-timeline-2-audit-2026-08-20.md` |
| T1B1 projection foundation | CLOSED / GREEN | `docs/t1b1-timeline-projection-foundation-2026-08-20.md`, `src/_utils/timelineProjection.js`, `src/_data/timelineProjection.js` |
| T1B2A election history convergence | CLOSED / GREEN / MAIN (PR #116) | merge commit `aa0a0937`, `src/_utils/electionHistory.js`, shared `src/_includes/election-history-page.njk` |
| T1B2B home milestone convergence | CLOSED / GREEN / MAIN (PR #117) | merge commit `db581a6e`, projection wired into `src/_data/milestones.js` |
| T1B2C politics theme convergence | CLOSED / GREEN / MAIN (PR #119) | merge commit `a5990743`, `src/_utils/politicsThemeProjection.js` |

Every duplicate-ownership surface named in the T1A inventory has now been converged, deferred as legitimate, or explicitly excluded from T1.

## 3. Remaining T1A Surfaces — Per-Surface Verdict

Each remaining T1A surface was re-evaluated against the strict test:

1. Is there a real parallel ownership / runtime problem?
2. Is there an authoritative existing source?
3. Would convergence remove code or semantic duplication?
4. Would the result be simpler than today?

### 3.1 Council timeline — `/politiikka/kaupunginvaltuusto/`

- Data flow on main: `councilMeetings`, `councilMeetingTimeline` (build-time projection via `buildCouncilMeetings()` / `buildCouncilMeetingTimeline()` in `eleventy.filters.js`).
- Template: `src/fi/valtuusto.njk` — 127 lines, SSR-only, `<details>` year groups, no timeline-specific browser JS, no runtime JSON.
- T1A classification: `A` — "strongest current Timeline 2.0-shaped implementation".
- T1B1: `buildCouncilMeetingTimeline() = KEEP`.
- T1B2C: "does not offer a comparably clear deletion win".
- Parallel ownership: none observed. Companion facts (quiet markers, annual-cycle markers) are legitimate class-C.

Test answers:

1. Real parallel ownership problem? **NO** — helper is already authoritative.
2. Authoritative source? **YES** — already used.
3. Would convergence remove duplication? **NO** — no duplicate to remove.
4. Would the result be simpler? **NO** — refactor for consistency risks adding abstraction with no user or maintenance win.

Verdict: **NO-GO**.

### 3.2 Training feedback — `/koulutuspalaute/`

- Data: `src/_data/trainingFeedback.json` (177 lines, page-native).
- Template: `src/fi/koulutuspalaute.md` (155 lines of markup + inline CSS), SSR-only ordered timeline plus source cards, evidence badges, KPI grid.
- T1A classification: `C` — "legitimate page-native dataset, not duplicated from another canonical object family".
- T1B2C: "legitimate page-native dataset rather than an obvious duplicate-ownership problem".

Test answers:

1. Real parallel ownership problem? **NO** — feedback observations, evidence levels, and KPIs have no canonical source elsewhere.
2. Authoritative source outside the page? **NO**.
3. Convergence would remove duplication? **NO**.
4. Result simpler? **NO** — force-canonicalizing would invent taxonomy the T1A audit explicitly rejects.

Verdict: **NO-GO**.

### 3.3 Site changes — `/sivuston-muutokset/`, `/en/site-changes/`

- Data: `src/_data/githubchanges.js` (172 lines) — GitHub commits API/cache at build time.
- Templates: `src/fi/sivuston-muutokset.njk` (179 lines), `src/en/site-changes.njk` (156 lines). ~1,112 SSR rows per locale, ~850 KB HTML each, ~8,6k DOM tags each, inline browser pagination.
- T1A classification: `C` — "authoritative external history, but not a canonical-content timeline and should remain separate from T1".
- T1A § 21 explicit out-of-scope: "do not fold GitHub site-changes history into content Timeline 2.0".
- T1B2C: "materially higher DOM/performance risk and is not the smallest justified T1B2C slice".

Test answers:

1. Real parallel ownership problem? **NO** — GitHub API is the authority, page consumes it directly.
2. Authoritative source? **YES**, but it is external history, not canonical content.
3. Would convergence remove duplication? **NO** — there is nothing to converge into shared canonical timeline projection.
4. Would the result be simpler? **NO** at T1-level. The DOM/perf pressure is real, but it belongs to C1/P1/UX1, not to T1 Timeline 2.0.

Verdict: **NO-GO for T1**. The 850-KB / 8,6k-tag SSR page is a legitimate concern, but the right lane is C1 (deletion / interaction reduction) or a bounded UX/perf slice — not T1B3.

### 3.4 Already-converged surfaces (no re-open)

- Election history (FI + EN) — T1B2A
- Home milestones — T1B2B
- Politics theme timelines (4 routes) — T1B2C

No further T1 slices are justified on these surfaces without new evidence.

## 4. Does T1B3 Have a Justified Definition?

Repo evidence:

- `docs/t1-timeline-2-audit-2026-08-20.md` § 20: "T1B3 — optional Pagefind enhancement for active discovery only", gated by "no Pagefind-owned chronology, no hidden full DOM filtering, no browser-owned identity model".
- `docs/site-architecture-closure-roadmap-2026-08-20.md`: "do not start `T1B3` before `T1B2C` suitability and scope are proven" and "T1B3 = NOT STARTED".
- Every T1B2 slice doc lists T1B3 as `NO`, `out of scope`.
- T1A § 12: "no current timeline page fetches a timeline-specific browser JSON feed"; § 9 "no current timeline page uses Pagefind to generate their untouched timeline DOM".
- Roadmap principle: "Pagefind is optional enhancement, not a timeline generator".

Interpretation:

- T1B3 is defined only as an *optional* Pagefind enhancement, contingent on proven user demand for active discovery inside a timeline surface.
- No repo evidence shows such demand on any converged surface (election history, home milestones, politics themes) or on the surfaces explicitly excluded from T1 (council, training feedback, site changes).
- Attempting T1B3 now would violate:
  - "do not make Pagefind the canonical timeline store"
  - "no browser-owned identity model"
  - "no runtime JSON -> timeline render path"
  and would add abstraction without repo-evidenced user value.

Verdict on T1B3 definition: **NOT JUSTIFIED as an active next slice**. It has a scoped definition, but no repo-evidenced trigger. Treat as **DEFER** (keep the definition documented; do not open work), not permanent NO-GO.

## 5. T1 Closure Readiness

Signals that T1 is architecturally at a natural closure point:

- Every T1A duplicate-ownership surface is converged (T1B2A/B/C).
- Every T1A page-native or external surface is documented as legitimately out of scope (council = A, training = C, site changes = external history).
- Foundation helper (`timelineProjection.js`) is in place and reused by three convergence slices.
- No open T1A finding requires a further T1B slice by name.
- T1B3 has no repo-evidenced trigger.

Closure gaps (legitimate but *not* T1):

- Council FI-only parity (no EN counterpart) — future FI/EN decision, not a duplicate-ownership problem.
- FI election-history browser pagination retained — deliberate T1B2A decision, deletable later as C1 work.
- Site-changes 850-KB SSR + inline pagination — belongs to C1/P1/UX1.

Verdict: **T1 is ready for CLOSED / MAINTENANCE**. Any future T1B3 or reopening should be triggered by new repo evidence, not by roadmap inertia.

## 6. O1 Comparison

Current O1 state on `origin/main`:

- `src/_includes/detail-orientation.njk` — present.
- Applied to: `publication-item-body.njk`, `thesis-detail-body.njk`, `writing-post.njk` (grep evidence).
- `tests/o1-orientation.spec.js` — present.
- Merged via PR #111 (commit `9e881b77`) before T1B1..T1B2C.
- Roadmap literal status (`O1 = NEXT / READY`) is stale relative to main; core primitive already landed.

Open work under O1:

- Suitability audits for widening to **Presentations** and **Media** (gated per roadmap).
- Related architecture-closure items O1 depends on / relates to:
  - N1 known baseline: home/search-dialog focus-trap regression (visible in `tests/navigation.spec.js`, 172 lines).

Comparative value:

| Dimension | T1 next step | O1 next step |
| --- | --- | --- |
| Duplicate ownership removed | ~zero (nothing left) | Ad-hoc detail return controls in Presentations/Media candidates |
| Legacy code deletable | small (browser paginations, deferred) | possibly more (per-domain return-link ad-hoc code) |
| User-facing closure | already visible on 3 converged surfaces | direct — improves detail-page navigation coverage |
| Risk of over-generalization | HIGH (would require inventing Pagefind timeline model without evidence) | LOWER (audit-first, per-domain suitability gate) |
| Alignment with roadmap guardrails | requires bending "SSR is authoritative" boundary | matches "no forced one-size-fits-all orientation" rule |

Verdict: **O1 currently offers more architecture-closure value than any hypothetical T1B3**, provided widening starts with suitability audits (Presentations, Media) rather than direct implementation.

## 7. Roadmap Update Requirements

`docs/site-architecture-closure-roadmap-2026-08-20.md` needs the following corrections (docs-only, to be applied in a follow-up docs commit — not in this audit):

- § 3 T1 status snapshot:
  - "Next correct timeline workstream: `T1B2C`" → replace with statement reflecting T1B2C = closed on main and T1 = closure/maintenance pending confirmation.
- § 9 Status Snapshot:
  - `T1B2C = NOT STARTED` → `T1B2C = CLOSED / GREEN / MAIN (PR #119)`
  - `T1B3 = NOT STARTED` → `T1B3 = DEFER (no repo-evidenced trigger)`
  - `T1 = ACTIVE` → `T1 = CLOSED / MAINTENANCE` (contingent on this audit)
  - `O1 = NEXT / READY` → `O1 = ACTIVE (widening audits pending for Presentations, Media)` — reflects that core primitive is on main.
- § 8 Current Sequencing:
  - Reorder so O1 is the active workstream after T1 closure, followed by N1 baseline focus-trap fix, C1 cross-cutting, then PF5 audit and R1/P1/UX1.

These changes are documented here as *required*; the actual roadmap edit is intentionally deferred to a separate docs task.

## 8. Verdict

**VERDICT B**

- T1B3 = **DEFER** (definition scoped, no repo-evidenced trigger — reopen only on new user-value evidence for Pagefind-driven active timeline discovery)
- T1 = **CLOSED / MAINTENANCE**
- Next active workstream = **O1 widening** (start with suitability audits for Presentations and Media, per the roadmap gate; do not force a shared orientation primitive if landing semantics differ)

Adjacent priorities remain unchanged:

- N1 focus-trap regression stays the next accessibility/navigation closure lane.
- C1 continues cross-cutting.
- PF5, R1, P1, UX1 stay behind active closure lanes.

## 9. Explicit Non-Actions

This audit did not:

- change production source, templates, JS, CSS
- touch Pagefind config
- touch Canonical Content v1
- start T1B3 implementation
- start O1 widening implementation
- start N1 fix
- start media convergence
- edit `site-architecture-closure-roadmap-2026-08-20.md`
- touch `feat/canva-analysis-data-driven` worktree
- commit, push, or open a PR

## 10. Validation

- `git diff --check` in audit worktree: clean (docs-only add)
- `git status --short` in audit worktree: single untracked audit file
- No build required — docs-only.
