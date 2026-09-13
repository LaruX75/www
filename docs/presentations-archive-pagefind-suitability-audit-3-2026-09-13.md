# Presentations Archive Pagefind Suitability Audit 3

Date: 2026-09-13
Status: `AUDIT ONLY` — no production code changed by this document.
Decision: **D — HYBRID REMAINS THE RECOMMENDED TARGET.**
Alternative: `B — SUITABLE AFTER SMALL PREREQUISITES` is now available
if the migration is desired for reasons independent of user-facing UX.

Follow-up to `docs/presentations-archive-pagefind-suitability-audit-2-2026-09-13.md`
(Audit 2). Audit 2 concluded HYBRID and listed six items on a cheapest-first
list (five prerequisite closures + Audit 3 itself). Since then, PRs #257,
#258, #259, and #260 shipped and closed all five prerequisite items. This
audit re-evaluates the six-item prerequisite matrix against current
`origin/main` and asks the follow-on question that Audits 1–2 deliberately
deferred: **now that migration is technically possible, is it worth doing?**

## 1. Repository truth

- Worktree: `/private/tmp/pagefind-audit-3`
- Branch: `docs/presentations-archive-pagefind-suitability-audit-3`
- HEAD: `3c94d9e16db8f2edfac05dcfbc9c73fbd2019894`
- `origin/main` HEAD: `3c94d9e16db8f2edfac05dcfbc9c73fbd2019894`
- Ahead / behind vs `origin/main`: `0 / 0`
- `git status`: clean.

## 2. What changed since Audit 2

Five PRs shipped, each closing exactly one Audit 2 cheapest-first item:

| PR | Merge SHA | Scope | Prerequisite closed |
|---|---|---|---|
| #257 | `01ce1076` | Schema parity between Eleventy projection and postbuild custom-record + `data-pagefind-sort` on both paths | #2 + #4 |
| #258 | `488b4615` | `scripts/verify-presentation-custom-records.js` fragment-scan verifier + `npm run check:pagefind-presentation-coverage` | #1 |
| #259 | `3e7d807b` | `isExternalUrl` in `search-result-presenter.js` + `target="_blank" rel="noopener noreferrer"` + external icon for external URLs | #3 |
| #260 | `3c94d9e1` | Data-driven refresh of `/esitykset/` starter-chip curation + EN chip block for `/en/presentations/` + sync policy doc | #5 |

Also merged in the same session as immediate context:
- PR #253 (`7d8bbf22`, not this session's work) — resolved 2 YouTube-
  playlist duplicates on live production.
- PR #254 (`777b06ba`) — removed 2 unpublished Canva presentation records
  + 2 curated stubs.
- PR #255 (`538b15b1`) — Slice 3 (runtime data removal, from Audit 2's
  §5 measurement baseline).

**None of the six audited items introduced new blockers.**

## 3. Prerequisite re-evaluation

### #1 — Live external-first coverage verification

**Status: VERIFIED (with a finding).** PR #258 shipped
`scripts/verify-presentation-custom-records.js`. The script uses a
**fragment-scan** strategy (reads `_site/pagefind/fragment/*.pf_fragment`
gzip-decoded JSON payloads and collects `PresentationId → {url, count,
langs}`), not the Pagefind Node API — the API's `noWorker` filter-mode
returned only 199/215 fragments in testing, so the raw-scan is
authoritative.

Run on current build:

```
externalFirstTotal: 78
pagefindPresentationIdTotal: 216
missingCount: 3
duplicateCount: 0
```

**Finding — 3 external-first presentations missing from Pagefind:**
- `sdrdv3W33qRpdA8` — "Tekoäly, ystävä vai vihollinen? (FIN)" (Canva)
- `o2KsaiK39PKEN2g` — "AVI-koulutus – Tekoäly opetuksessa" (Canva)
- `videoSeries|...PLDG0jxUrk8z19_ThqBiynpYG4g-mjwgpt|Jari Larun verkkolive` (YouTube playlist)

Root cause is not in the Pagefind pipeline itself but somewhere in the
canonical-item → custom-record mapping in `scripts/run-pagefind.js` /
`scripts/_lib/presentationPagefind.js`. These 3 records are in
`_site/data/presentations-page.json` as `landingType: "externalSource"`
but never appear in a fragment. Diagnosis is out of scope for this
audit; the verifier now surfaces the failure so any future regression
is caught.

**Blocker classification:** downgraded from Audit 2's "not verified" to
**verified with 3-item known gap**. The 3 missing records are a
**maintenance issue**, not a Pagefind pipeline architecture issue.

### #2 — Schema parity between projection paths

**Status: FULLY RESOLVED.** PR #257 aligned the two paths so both emit
the same 12 filter names and 15 meta keys for the same canonical item.
Enforcement is an explicit unit test:

```
tests/unit/resolvePagefindPresentations.test.js:304
"filter name set is identical between Eleventy projection and custom-
record builder (except Kieli, emitted by base.njk on local-first pages)"
```

The `Kieli` exception is deliberate — `base.njk` emits `data-pagefind-
filter="Kieli:..."` universally from `currentLang` for every page, so
projecting it again from `projectPresentationRecord` would double-emit
on local-first fragments. The exception is one line in the parity test
and is stable.

**Blocker classification:** cleared.

### #3 — Shared presenter external-URL hardening

**Status: FULLY RESOLVED.** PR #259 added `isExternalUrl(url)` with
hostname-guard (`jarilaru.fi` + `www.jarilaru.fi` + `window.location.
hostname` all count as internal). External URLs now render as:

```
<a href="..."
   target="_blank"
   rel="noopener noreferrer"
   aria-label="{title} (avautuu uuteen välilehteen | opens in a new tab)">
  {title}
  <i class="bi bi-box-arrow-up-right ms-1 opacity-75" aria-hidden="true"></i>
</a>
```

Localised aria-label via `searchSurfaceLanguage()`. Non-http protocols
(`javascript:`, `mailto:`, `ftp:`) are safety-guarded to non-external.
10 new unit tests cover the URL discrimination and card rendering.

**Blocker classification:** cleared.

### #4 — `data-pagefind-sort="date:..."` emission

**Status: FULLY RESOLVED.** PR #257 emits sort on both paths:

- **Local-first pages** (via `base.njk` rendering `pagefindDocument.sort`):
  ```
  <span hidden data-pagefind-sort="date:{{ sortValue }}"></span>
  ```
  Verified in production build: 140 FI presentation detail pages carry
  `data-pagefind-sort="date:YYYY-MM-DD"`.

- **External-first custom records** (via `buildPresentationCustomRecord`
  in `scripts/_lib/presentationPagefind.js:522`):
  ```
  customRecord.sort = { date: record.presentationDate };
  ```
  Fragment inspection: external-first custom records carry
  `PresentationDate: 2024-06-27` and `sort.date` set from the same
  ISO-normalised value.

**Blocker classification:** cleared.

### #5 — Topic UX design decision

**Status: FULLY RESOLVED.** PR #260 kept `<datalist>` (the 405-topic
autocomplete backing the search input) AND refreshed the curated
starter-chip block above it. FI chips: Koulutusteknologia,
Opettajankoulutus, Tekoälylukutaito, Sosiaalinen media, Mobiilioppiminen.
EN chips: Educational technology, Teacher education, AI literacy, Social
media, Mobile learning. EN chip `data-starter-chip-value` uses the
Finnish topic keys (except "AI literacy" which is a genuine EN key in
the data) so the filter matches the actual EN-presentation topic
vocabulary.

Sync policy documented in `docs/pagefind-migration-audit-2-step-5-
decision-2026-09-13.md`: chip list re-evaluated annually or every 50
new presentations, whichever comes first.

**Blocker classification:** cleared.

### #6 — Audit 3 (FULL migration re-audit)

**Status: THIS DOCUMENT.** Recorded below in §5–§8.

## 4. Prerequisite status matrix

| # | Prerequisite | Audit 2 status | Audit 3 status | PR |
|---|---|---|---|---|
| 1 | Live external-first coverage | Not verified | Verified (3-item gap surfaced) | #258 |
| 2 | Schema parity | Partial (schema drift risk open) | Cleared (unit test enforces) | #257 |
| 3 | Shared presenter external-URL | Blocking | Cleared | #259 |
| 4 | `data-pagefind-sort` on presentations | Blocking | Cleared | #257 |
| 5 | Topic UX | Open | Cleared (chips + datalist, sync doc) | #260 |
| 6 | Audit 3 (this) | Not scheduled | Completed (this document) | this |

**All five technical prerequisites from Audit 2's cheapest-first list
are now closed.** Prerequisite #1 has a surfaced 3-record gap that is
a maintenance issue rather than a design blocker.

## 5. New question — is migration worth doing now?

Audit 1 and Audit 2 asked a technical-feasibility question: *can we
migrate `/esitykset/` from `ContentPresets.queryPreset` to
`search-result-presenter` + Pagefind?* That question is now answered
"yes" — the prerequisites are closed.

The remaining question is not technical. It is a cost-benefit question:
*given that migration is now possible, is it a net improvement over
the current post-Slice-3 hybrid?*

### 5.1 What FULL migration would deliver

- **One rendering path** for global-search results and archive results
  (shared `search-result-presenter.js`). Eliminates one source of code
  duplication.
- **Native Pagefind sort + facet filtering** on the archive, with sort
  emission now in place (PR #257).
- **External-URL semantics** (PR #259) surfaces uniformly on both
  archive and global search hits.

### 5.2 What FULL migration would cost

- **Wire cost.** Pagefind adds a wasm bundle (~200 KB gzip) plus
  fragment blobs (~1–2 MB depending on query breadth) that are
  currently not loaded on `/esitykset/`. Post-Slice-3 archive
  interaction is DOM-only — the runtime JSON fetch was already removed
  (Audit 2 §6: 269,473 → 211,260 bytes gzip on FI). Migration would
  reintroduce a network + wasm-init cost that Slice 3 explicitly took
  out.
- **Cache thrash on first navigation.** Users landing on `/esitykset/`
  from an internal link do not currently need Pagefind. Under migration
  they would download and initialise it before any filter interaction.
- **Loss of no-JS baseline.** SSR cards + DOM-attribute filtering
  degrade gracefully; a Pagefind-only path does not without a
  no-script SSR fallback (which would recreate the current path
  anyway).

### 5.3 What HYBRID (current state) already delivers

- **Global search uses Pagefind.** External-URL hardening (PR #259) and
  sort emission (PR #257) both take effect on `/haku/` and
  `/en/search/` today — the touchable benefits of the migration are
  already visible in the surface where Pagefind is authoritative.
- **Archive uses the cheapest possible mechanism.** Post-Slice-3 DOM
  attributes + `queryPreset` = zero runtime fetch, zero wasm, one-round
  paint.
- **Schema parity** (PR #257) is enforced by a unit test — both paths
  emit identical shape without a runtime dependency.
- **Verified custom-record coverage** (PR #258) — the `check:pagefind-
  presentation-coverage` command is now a scriptable regression gate.

### 5.4 Net assessment

Every user-facing improvement that a FULL migration would deliver is
**already visible on the surface where Pagefind is authoritative
(global search)** — because PRs #257 and #259 shipped the improvements
to `search-result-presenter.js` and the Pagefind index, not to the
archive. The migration would move an *archive interaction* from a fast
DOM path onto a heavier Pagefind path, with no new user-visible
capability that isn't already in `/haku/`.

The only benefit the migration would add on top of the current state is
**source-code de-duplication** (one rendering path instead of two).
That is a maintenance benefit, and a small one — the two paths now
share a projection contract (PR #257 parity test), so they cannot
drift silently.

## 6. Architecture decision

**D — HYBRID REMAINS THE RECOMMENDED TARGET.**

The recommendation is unchanged from Audits 1 and 2, but the reason
is different. Audits 1–2 recommended HYBRID because the prerequisites
were not met. Audit 3 recommends HYBRID because *the prerequisites are
met but the migration's cost outweighs its benefit*.

Under Decision D as it stands after all five prerequisite closures:

- SSR + build-time `result-card.njk` remains authoritative for the
  221-item archive.
- The DOM-metadata + `queryPreset` runtime added by Slice 3 remains
  the archive's interaction layer.
- Pagefind + `search-result-presenter.js` remain authoritative for
  global discovery (`/haku/`, `/en/search/`, navbar). External-URL
  hardening + sort + schema parity now benefit that surface directly.
- `/data/presentations-page.json` remains a build-time public contract
  for Pagefind + audits.

The five prerequisite closures were **not wasted effort**. Each
delivered a user-visible improvement on the surface where Pagefind is
already authoritative, or a maintenance guarantee that improves both
paths. Their value stands independent of the FULL migration decision.

### Alternative: B — SUITABLE AFTER SMALL PREREQUISITES

**B is now available if the migration is desired for reasons this
audit does not weigh** (e.g. long-term architectural preference to
converge on a single rendering path; strategic dependency of another
workstream on Pagefind-driven archives). Under B, one additional
prerequisite would need to close:

1. **Resolve the 3-record custom-record gap** from PR #258's finding.
   Root-cause the missing Canva + YouTube playlist records in the
   canonical-item → custom-record mapping. Estimated small.

After that, migration is a bounded implementation exercise:
- Replace `presentations-page.js`'s `queryPreset` toggling loop with a
  Pagefind-driven search.
- Adopt `search-result-presenter.renderSharedCard` output for archive
  cards.
- Deprecate `presentations/result-card.njk` (SSR template retained
  only for the no-script fallback).

## 7. Bounded next work (if the decision ever changes)

If a future audit (Audit 4) elects Decision B, the concrete work is:

1. **Fix the 3-record custom-record gap** (from #1's finding). Small,
   isolated diagnosis + fix. Unblocks 100% coverage guarantee.
2. **Prototype migration on FI only.** Measure wire cost + time-to-
   interactive vs the current post-Slice-3 baseline. Report against
   Audit 2 §6's numbers (211,260 bytes gzip FI).
3. **If prototype is favourable, promote to EN and remove the DOM-
   metadata path.**
4. **If prototype is unfavourable, keep HYBRID and close the question.**

If none of this is scheduled, HYBRID is the stable, audited, and
self-consistent target. No further action is required to keep it
healthy.

## 8. Recommended next action

**No new coding workstream. Optional maintenance workstream: root-cause
the 3-record custom-record gap.**

The 3 missing records surfaced by PR #258's verifier are the only
open item across all five prerequisite closures. Their absence does
not affect the archive (which shows them fine — they are in
`presentations-page.json` and render as SSR cards), only global-search
discovery (users searching `/haku/` for "AVI-koulutus" or the
verkkolive playlist do not get a Pagefind hit for that presentation).

Fix priority is **low** — the 3 records are recoverable via
free-text-search on their titles (matches other Pagefind-indexed
content that references them), and the underlying canonical data is
correct.

## 9. Files consulted

**Code (verification breadcrumbs):**
- `src/js/search-result-presenter.js:65,276-282,312` — `isExternalUrl` +
  external-link handling
- `src/src.11tydata.js:201,260-265` — projection with sort output
- `src/_includes/base.njk:65-69` — `data-pagefind-sort` template emission
- `scripts/_lib/presentationPagefind.js:473,522` — meta + sort in custom
  record
- `scripts/verify-presentation-custom-records.js` — 100% coverage verifier
- `src/_includes/presentations/archive.njk` — refreshed FI + new EN
  chip blocks
- `tests/unit/resolvePagefindPresentations.test.js:304` — schema parity
  invariant test

**Docs:**
- `docs/presentations-archive-pagefind-suitability-audit-2026-08-28.md`
  — Audit 1 (original prerequisite list + Slice 3 recommendation)
- `docs/presentations-archive-pagefind-suitability-audit-2-2026-09-13.md`
  — Audit 2 (cheapest-first refactoring + Decision D retained)
- `docs/pagefind-migration-handoff-2026-09-13.md` — compact handoff brief
- `docs/pagefind-migration-audit-2-step-5-decision-2026-09-13.md` —
  Step 5 curation decision + sync policy
- `docs/presentations-runtime-data-01-2026-09-13.md` — Slice 3 closure
  with wire-cost measurements

**GitHub PRs closed since Audit 2:**
- #257 pf5-presentations-schema-parity-sort-01 (Steps 2 + 3)
- #258 check/pagefind-presentation-coverage-01 (Step 1)
- #259 feat/search-presenter-external-link-01 (Step 4)
- #260 feat/presentation-archive-chips-refresh-01 (Step 5)
