# Presentations Archive Pagefind Suitability Audit 2

Date: 2026-09-13
Status: `AUDIT ONLY` — no production code changed.
Decision: **D — HYBRID REMAINS THE CORRECT TARGET.**

Follow-up to `docs/presentations-archive-pagefind-suitability-audit-2026-08-28.md`
(Audit 1). Audit 1 concluded HYBRID and listed six prerequisites that would
justify reopening the decision as `B — SUITABLE AFTER SMALL PREREQUISITES`.
Slice 3 (P2-SLICE-3-CARD-UNIFICATION) was recommended as the immediate
implementation package independent of the FULL-migration prerequisites. Slice 3
has since shipped (PR #255, merge commit `538b15b1`, 2026-09-13). This audit
re-evaluates the six prerequisites against the current `origin/main` and
records what the FULL-migration decision looks like today.

## 1. Repository truth

- Worktree: `/private/tmp/presentations-pagefind-audit-2`
- Branch: `docs/presentations-archive-pagefind-suitability-audit-2`
- HEAD: `538b15b138c074d0e5dc5a1f45731b235660e849`
- `origin/main` HEAD: `538b15b138c074d0e5dc5a1f45731b235660e849`
- Ahead / behind vs `origin/main`: `0 / 0`
- `git status`: clean.

## 2. What changed since Audit 1

**Materially:** one item on the recommended-next-actions list — Slice 3 —
shipped as PR #255.

- `src/js/presentations-page.js` no longer owns `archiveCardHtml()` and its
  helper cluster.
- The FI and EN archive runtime no longer fetches `/data/presentations-page.json`.
  Card metadata was moved into `data-*` attributes on the SSR
  `.presentation-archive-card` nodes; the client reads that DOM metadata
  and toggles card visibility via `ContentPresets.queryPreset(items,
  "FindExplore:presentations", ...)` — same preset key, same filter/search
  semantics, new data source.
- Verified: FI and EN each render 221 SSR cards with 221 parseable
  metadata records. Zero runtime requests to `/data/presentations-page.json`.
  See `docs/presentations-runtime-data-01-2026-09-13.md` for measurements.

**Not changed:** none of Audit 1's six FULL-migration prerequisites was
addressed by PR #255 (per that PR's stated scope). Slice 3 was
explicitly a HYBRID-closure step, not a step toward Decision B.

The following are also **unchanged since Audit 1** and remain covered by
its §4–§9:

- Record count and shape in `src/_data/presentationsPage.js`.
- Local-first vs external-first mix (`landingType: "localDetail"` vs
  `"externalSource"`).
- Canonical Content v1 boundary.
- Pagefind indexing pipeline architecture.

## 3. Prerequisite re-evaluation (six items from Audit 1 §12)

### #1 — Verified live custom-record coverage for external-first presentations

**Status: NOT VERIFIED IN THIS AUDIT.** The code path exists and is wired:

- `scripts/_lib/presentationPagefind.js:479` defines
  `buildPresentationCustomRecord(record, content)`.
- `scripts/run-pagefind.js:102` calls
  `index.addCustomRecord(buildPresentationCustomRecord(record, content))`
  for every entry in `customScopeRecords`, i.e. every record whose
  `indexCandidateDocument` is falsy (external-first with no usable
  local HTML).
- Audit metrics are computed:
  `externalLandingTotal = records.filter(r => r.landingType === "externalSource").length`
  and `preferredExternalCount` (canvaRecords subset). See
  `scripts/_lib/presentationPagefind.js:390` and `:407`.
- `run-pagefind.js:148` writes `presentationScopeLocalDocuments` count
  (localScopeRecords.size) and `presentationExternalLandingTotal` into
  the build stats output.

What this audit did NOT do: execute a live Pagefind search against
`https://www.jarilaru.fi/haku/` (or `/en/search/`) for a known
external-first canonical presentation identity and confirm the
custom record surfaces. That requires wasm-driven query (Playwright or
similar) — out of scope for a static grep audit.

**Blocker classification:** unchanged from Audit 1. The code exists;
the live coverage guarantee has to come from a scripted end-to-end
query or from a dedicated audit workstream that instantiates the
Pagefind client and asserts a hit for each external-first canonical
id.

### #2 — Reconcile PF5-G2 Eleventy projection vs `presentationPagefind.js` postbuild injection

**Status: PARTIALLY RESOLVED (data-scope split), OWNERSHIP UNCLEAR.**

Live inspection of `scripts/run-pagefind.js`:

```
const localScopeRecords = uniqueIndexCandidates(presentationAudit.records);
const customScopeRecords = presentationAudit.records.filter(r => !r.indexCandidateDocument);
```

The two paths partition the record set by `indexCandidateDocument`:
- Records with a usable local HTML candidate → indexed via normal
  Pagefind HTML scan of the local detail page (PF5-G2 projection in
  `src/src.11tydata.js:resolvePagefindPresentations` supplies the
  `data-pagefind-meta`/`filter` attributes on those local pages).
- Records without → indexed via `addCustomRecord` in the postbuild.

At index time, no presentation is indexed twice — the two paths are
mutually exclusive by construction.

**What remains an ownership question rather than a runtime duplication:**
both files define what "canonical presentation identity + Pagefind
filters" look like — the schema is duplicated at the source-code level.
`src/src.11tydata.js:200-210` emits `FindExplore=presentations`,
`PresentationYear`, `PresentationType`, `PresentationTopic` filters;
`scripts/_lib/presentationPagefind.js:460` emits `PresentationIndexDocument`
plus similar metadata. A schema drift between the two would produce
two different Pagefind vocabularies for local vs custom presentations
without any single-source enforcement.

**Blocker classification (revised):** downgrade from Audit 1's
absolute "should be reconciled before further reliance" to a
**maintenance risk** rather than a runtime blocker. FULL migration
would benefit from a schema-parity assertion (either a shared helper
or a build-time cross-check), but it is not a functional prerequisite.

### #3 — Shared presenter external-URL hardening

**Status: STILL BLOCKED.** `src/js/search-result-presenter.js` (283 LOC)
contains **zero** references to `target`, `_blank`, `external`,
`externalUrl`, `externalFirst`, `noopener`, or `hasLocalDetail`. The
presenter uses `data.url` uniformly and renders it as an internal-style
link.

Verified by direct grep:
```
$ grep -nE 'target|_blank|external|externalFirst|noopener|hasLocalDetail' src/js/search-result-presenter.js
(no matches)
```

Consequence for archive migration: adopting this presenter on
`/esitykset/` today would render all 80 external-first cards as
same-tab internal-style links without the "Ulkoinen / External"
badge — the exact semantic regression Audit 1 §5 flagged.

**Blocker classification:** unchanged. Still hard-blocking Decision B.

### #4 — Emit `data-pagefind-sort="date:..."` from `resolvePagefindPresentations`

**Status: STILL BLOCKED.** Zero occurrences of `data-pagefind-sort`
in the presentation detail projection, in the presentation-item
template, or in the postbuild custom-record builder:

```
$ grep -n "data-pagefind-sort" src/_includes/presentation-item.njk src/src.11tydata.js scripts/_lib/presentationPagefind.js scripts/run-pagefind.js
(no matches in any of those files)
```

`data-pagefind-sort` exists in the repo only on `src/_includes/media-item.njk`
(unrelated content type).

Consequence for archive migration: Pagefind cannot serve the archive's
current `date-desc` ordering. The archive would either need to sort
client-side after fetching results (partly defeating the point of
migrating) or the projection has to emit `data-pagefind-sort="date:{{ item.date }}"`
on presentation detail pages and, for external-first records, in the
custom record fields.

**Blocker classification:** unchanged. Small implementation, but still
required.

### #5 — Design decision on topic combobox (406 topics vs F&E chip UI)

**Status: NO NEW DESIGN DECISION.** The archive still uses a
`<datalist>`-backed `<input type="search">` for topic (naturally
handles 406 vocabulary entries with type-ahead). FI adds five
"starter chip" buttons above the form:

```
$ wc -l src/js/starter-chips.js
     103 src/js/starter-chips.js
```

`starter-chips.js` is a generic click-to-fill-a-form-field mechanism,
not a facet system. It exposes five curated topic entry points on FI
only; it does not replace or reduce the datalist. The 406 topic
vocabulary and the F&E chip UI's much smaller facet-chip pattern
remain unreconciled.

**Blocker classification:** unchanged. Not a code blocker but a UX
design decision that must precede FULL migration — otherwise the
migration would either (a) drop topic filtering, (b) surface all 406
topics as chips (poor UX), or (c) invent a curated subset without
policy for how it stays in sync with the underlying data.

### #6 — `returnTo` semantics under Pagefind

**Status: PARTIALLY IMPLEMENTED (in F&E shell), NOT WIRED FOR PRESENTATIONS.**

`src/js/find-explore.js:662-673` defines `withReturnTo(href)`:

```
- Rewrites same-origin hrefs to append ?returnTo=<current>&returnLabel=<i18n>
- Skips cross-origin hrefs (returns unchanged) — a natural fit for
  the external-first case where returnTo makes no sense
- Applied by decorateResultLinks() to `.publication-archive-title-link`,
  `.thesis-archive-title-link`, `.find-explore-result-title`, and the
  primary result button
```

This is exactly the shape Audit 1 §12 asked for. However, presentations
archive today does NOT use `find-explore.js` — it uses
`src/js/presentations-page.js` which has its own DOM path. The
`returnTo` decoration on presentation cards happens at build time in
`src/_includes/presentations/result-card.njk:8` (Nunjucks concatenation
into the pre-rendered `<a href="…?returnTo=…&returnLabel=…">`).

If FULL migration adopts `find-explore.js`-style presentation on
`/esitykset/`, `withReturnTo` covers local-first correctly (skips
external-first correctly). The build-time decoration in
`result-card.njk` would then become redundant.

**Blocker classification:** downgrade from Audit 1 to **compatible**.
The shared helper already implements the wanted semantics for the
migration case.

## 4. Prerequisite status matrix

| # | Prerequisite | Audit 1 status | Audit 2 status | Delta |
|---|---|---|---|---|
| 1 | Live custom-record coverage verified | Not verified | Not verified in this audit either | none |
| 2 | PF5-G2 vs postbuild reconciliation | Should be reconciled | Data scope split verified (mutually exclusive), schema ownership open | partial |
| 3 | Shared presenter external-URL hardening | Blocking | Still blocking (0 matches in presenter) | none |
| 4 | `data-pagefind-sort="date:..."` on presentations | Blocking | Still blocking (0 matches in projection) | none |
| 5 | Topic combobox design decision | Open | Still open (starter chips ≠ facet UI) | none |
| 6 | `returnTo` semantics under Pagefind | Open | F&E shell already implements the wanted shape; needs wiring | partial |

Two soft downgrades (#2 and #6). Three hard prerequisites (#3, #4,
#5) remain absolute blockers. #1 is unchanged.

## 5. What Slice 3 actually gave us for a FULL migration

Audit 1 predicted Slice 3 would "unblock a cleaner FULL Pagefind
audit later" by ensuring the comparison would be one thing vs one
thing. That prediction is now testable.

Before Slice 3, a FULL migration compared:
- old: `SSR result-card.njk` **and** `presentations-page.js:archiveCardHtml()`
- new: `search-result-presenter.js` output

After Slice 3, the same comparison is:
- old: `SSR result-card.njk` (with the client toggling visibility)
- new: `search-result-presenter.js` output

The `archiveCardHtml()` variable is gone. This eliminates one source
of drift analysis in the eventual FULL migration audit, exactly as
Audit 1 predicted. It does not, on its own, resolve any of the six
prerequisites.

## 6. New measurement: post-Slice-3 runtime cost of the current path

From `docs/presentations-runtime-data-01-2026-09-13.md` (same
baseline gzip measurements):

| Path | Bytes (gzip) |
|---|---:|
| FI HTML + page JS + runtime JSON | 269,473 → **211,260** |
| EN HTML + page JS + runtime JSON | 243,936 → **186,384** |
| Runtime JSON request | 118,167 → **0** |

Runtime JSON fetch is gone. Whether shared-presenter Pagefind
delivery would be smaller or larger than the current DOM-metadata
delivery is not measurable from this static audit — it requires an
implementation prototype to compare wire cost and time-to-interactive.

## 7. Architecture decision (unchanged)

**D — HYBRID REMAINS THE CORRECT TARGET.**

Three of the six prerequisites remain hard blockers (#3, #4, #5).
The two soft downgrades (#2, #6) reduce the total unknown surface
but do not enable migration on their own. Prerequisite #1 remains
un-verified as a live-coverage guarantee, though the code path is
in place.

Under Decision D:

- SSR + build-time `result-card.njk` remains authoritative for the
  221-item archive.
- The DOM-metadata + `queryPreset` runtime added by Slice 3 remains
  the archive's interaction layer.
- Pagefind and `search-result-presenter.js` remain authoritative for
  global discovery (`/haku/`, `/en/search/`, navbar), where the
  external-URL semantics gap does not surface because global search
  results for external-first presentations flow through custom
  records with different render context.
- `/data/presentations-page.json` remains a build-time public
  contract for Pagefind + audits; not a browser dependency anymore.

## 8. Bounded next work if the decision is ever to move to B

To justify a Decision-B reopen audit (call it Audit 3), the following
concrete items would need to complete first, in this order:

1. **Live external-first coverage verification.** A scripted end-to-end
   test that instantiates Pagefind on `/haku/` and asserts a hit for
   each external-first canonical id (or asserts an accepted list).
   Delivers pass/fail evidence for prerequisite #1. Estimated small.
2. **Schema parity assertion** between `src/src.11tydata.js:resolvePagefindPresentations`
   and `scripts/_lib/presentationPagefind.js:buildPresentationCustomRecord`.
   Either a shared helper that both call, or a build-time cross-check
   that fails when the filter/meta vocabularies diverge. Delivers
   maintenance guarantee for prerequisite #2. Estimated small.
3. **`data-pagefind-sort="date:..."` emission** on presentation
   detail pages (via `resolvePagefindPresentations` + the shared
   projection helper from step 2) AND in `buildPresentationCustomRecord`.
   Delivers prerequisite #4. Estimated small.
4. **Shared presenter external-URL hardening.** Extend
   `src/js/search-result-presenter.js` to distinguish external vs
   local URLs and emit `target="_blank" rel="noopener noreferrer"`
   + the external badge for external results. This is not
   presentations-specific; it also cleans up global-search rendering
   for all external-first content. Delivers prerequisite #3.
   Estimated small–medium.
5. **Topic UX design decision.** Either accept `<datalist>` for
   both the archive path and the Pagefind path (simplest), or
   design a curated facet-chip subset with a documented sync policy.
   Delivers prerequisite #5. Estimated small (decision) + medium
   (if chips chosen).
6. **Audit 3 (FULL migration re-audit).** Re-runs Audit 1 §4–§9
   against the state produced by steps 1–5, with the current post-
   Slice-3 archive as the "current" baseline. Decision is then
   `A` (SUITABLE), `B` (SUITABLE AFTER SMALL PREREQUISITES),
   `C` (NOT SUITABLE), or `D` (HYBRID REMAINS) based on the
   evidence at that time.

Steps 1–5 can proceed independently, in any order, without any
Canonical Content v1, Pagefind pipeline architecture, or archive
runtime change. Each is bounded.

## 9. Recommended next action

**Do not start the migration. Do not start Audit 3 yet.**

The prerequisite chain (steps 1–5 above) has an obvious cheapest-first
ordering: step 2 (schema parity) and step 3 (sort emission) are
mechanical additions that reduce the audit surface without any UX
commitment. If interest in the FULL migration is real, step 2 + step 3
are the natural next slice.

Steps 1 and 4 depend on a small amount of scripted verification (step 1)
and shared-presenter design work (step 4) that touch other pages, so
they should be their own workstreams.

Step 5 is a design decision that gates any facet-based UI change; it
should not be deferred until Audit 3, since a "no chips, keep datalist"
decision costs nothing and removes a whole class of blocker.

If none of this is scheduled, HYBRID (the current state) is stable,
audited, and self-consistent. No further action is required to keep
it healthy.

## 10. Files consulted (verification breadcrumbs)

- `src/js/presentations-page.js` — 214 LOC post-Slice-3, no
  `archiveCardHtml()`.
- `src/js/search-result-presenter.js` — 283 LOC, no external/target/
  noopener/hasLocalDetail references.
- `src/js/find-explore.js` — `withReturnTo` around line 662, decorator
  around line 675.
- `src/js/starter-chips.js` — 103 LOC, generic click-to-fill mechanism.
- `src/_includes/presentation-item.njk` — `data-pagefind-ignore`
  regions present; no `data-pagefind-sort`.
- `src/_includes/media-item.njk` — only file using `data-pagefind-meta`/
  `filter` outside presentations for a content type; still no
  `data-pagefind-sort`.
- `src/_includes/presentations/result-card.njk` — build-time
  `returnTo`/`returnLabel` decoration around line 4–8.
- `src/src.11tydata.js` — `resolvePagefindPresentations` around
  line 164, filter projection around lines 200–210.
- `scripts/_lib/presentationPagefind.js` — 519 LOC, exports
  `buildPresentationCustomRecord`, `buildPresentationExistingHtmlAudit`,
  `extractTextFromHtml`.
- `scripts/run-pagefind.js` — local/custom scope split around lines
  120–130.
- `docs/presentations-archive-pagefind-suitability-audit-2026-08-28.md`
  — Audit 1.
- `docs/presentations-runtime-data-01-2026-09-13.md` — Slice 3
  closure with wire-cost measurements.
