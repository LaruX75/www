# RP-CONVERGE-01 → RP-CONVERGE-01A — Company Presentations Convergence Audit

Date: 2026-08-30
Status: `AUDIT COMPLETE / DECISION C — CONVERGENCE BLOCKED / DOCS ONLY`

RP-CONVERGE-01 originally shipped a production replacement of the FI
`/kouluttaja/` "Viimeisimpiä koulutusesityksiä" strip using
`presentationContextGroups.groups["veso-taydennyskoulutus"]`. The
follow-up semantic-source audit (RP-CONVERGE-01A) found that both the
original and the intended canonical alternative rely on **text-regex
inference** rather than any repo-documented canonical relationship
authority. The production change is reverted in the same PR (#169);
the audit is preserved as documentation. The legacy consumer, the
partial, and the CSS remain on `main`.

## Repository state

- Branch: `cleanup/rp-converge-01-company-presentations`
- PR: [#169](https://github.com/LaruX75/www/pull/169)
- Base: `origin/main` at `6b44c950918be5b719bf37da75251212f0ccf1ba` (post PR #168 selection-audit merge).
- Reference documents:
  - `docs/post-closure-next-workstream-selection-audit-2026-08-29.md` — selection audit that scoped RP-CONVERGE-01.
  - `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md`, `docs/r1-related-content-closure-2026-08-29.md`, `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md` — amended to reflect that the "orphan" claim was stale and that RP-CONVERGE-01A left the include in place under Decision C.

## Correction summary

The first RP-CONVERGE-01 implementation attempt (commit `45db10db`) replaced the legacy `canva.tableRows + sivuyhteys="kouluttaja-sivu"` selection with `presentationContextGroups.groups["veso-taydennyskoulutus"].featured | take(3)`. That commit was **reverted inside the same PR** after the RP-CONVERGE-01A audit found the replacement's authority basis was insufficient. This document records the audit; the production files return to their pre-PR state.

## Semantic-source audit — legacy set

Legacy selection: `canva.tableRows` filtered by `sivuyhteys` containing `"kouluttaja-sivu"`.

- **Total legacy items** on `main`: 57 (of 138 canva imports).
- Nature of `sivuyhteys`: editorial page-connection marker in `src/_data/canva-presentations.json`. Not documented as canonical relationship authority in any closure doc; not part of the `contexts` vocabulary; not shipped to templates as a canonical field.

## Semantic-source audit — canonical fields inspected

| Candidate field | Coverage on `main` | Meaning | Canonical authority? | Suitable for company strip? |
| --- | ---: | --- | --- | --- |
| `contexts` (via `resolveContexts` in `src/_data/contentContext.js`) | 7 / 139 presentation MDs resolve to `contexts.includes("business")` | Vocabulary member; `CONTEXT_META.business.href === "/kouluttaja/"` explicitly maps `business` to the company page. | **Vocabulary IS canonical** (used by R1 sidebar, AC1 content context sidebar, hub navigation). **Membership is text-inferred** via `inferContexts()` lines 189–199 matching titles/descriptions/categories/keywords against `veso|täydennyskoulutus|kouluttaja|keynote|webinaari|workshop`. Zero MDs declare `contexts:` in frontmatter for business-family. | **Weak parity** — 7/57 (~12 %) coverage. Same inference category as the group approach. |
| `type` | 139/139 = `"esitys"` (three outliers only) | Presentation kind marker. | Field is canonical but degenerate — no discriminator. | Not suitable. |
| `source` | 115/139 = `"slideshare"`, 2 youtube, 1 ouka | Import origin. | Canonical origin marker but degenerate for the company-page semantic. | Not suitable. |
| `categories` (declared frontmatter) | Sparse and inconsistent — no single "training-audience" category; nearest are `"VESO"` (few), `"Koulutus"` (6), `"Opettajankoulutus"` (~21) | Declared taxonomy on individual MDs. | Canonical, declared, but not curated for the company-page selection. | Weak parity; even the union of the closest labels covers only a partial subset and drifts by editorial inconsistency. |
| `contexts.includes("teaching")` | 139/139 (added unconditionally for `/presentations/` inputPath in `inferContexts` line 137–139) | Broad presentation classifier. | Field is canonical, membership is derived from inputPath alone. | Not a discriminator — matches all presentations. |
| `presentationContextGroups.groups["veso-taydennyskoulutus"]` | 10 items | Build-time UI grouping over presentation title + basename via regex + Finnish city-name prefixes + training-context keywords. | **Not documented as canonical authority.** Currently consumed only by `src/_includes/presentations/background-and-sources.njk` (the `/esitykset/` archive's grouping section). | Uses the same text-regex authority-substitution the audit spec warns against. |
| `paakortti` (`item.paakortti` in `canva-presentations.json`) | Marker on a subset of legacy imports | Legacy "flagship version" marker used by the deleted-style renderer. | Legacy-only; not preserved on canonical presentation MDs. | Not canonical. |

## Comparison — legacy set vs canonical alternatives

- Legacy `sivuyhteys="kouluttaja-sivu"`: 57 items — curated editorial selection.
- Canonical `contexts.includes("business")`: 7 items — text-regex overlap only.
- `presentationContextGroups.veso-taydennyskoulutus`: 10 items — different text-regex overlap; broader than `business` (matches VESO / DigiErko / city+training keywords) but narrower than the editorial set.

Neither canonical alternative recovers the majority of the legacy selection. The two "canonical-looking" alternatives (`contexts=business`, `presentationContextGroups`) are both **text-inference** — they differ only in which regex owns membership, and only one (`contexts`) is a documented vocabulary. The `contexts` vocabulary IS canonical for R1 / AC1 discovery, but its `business`-membership resolution on presentations is not editorially curated today.

## Role of `presentationContextGroups`

**`presentationContextGroups` is a derived UI grouping layer, not canonical membership authority.** It builds group buckets deterministically at build time by matching regexes against presentation titles and basenames (plus city-name prefixes), and it is currently consumed only by the `/esitykset/` archive's "Esitykset käyttötavan mukaan" browsing section (`src/_includes/presentations/background-and-sources.njk:52`). Its groups are useful for archive navigation. They are not documented as canonical presentation-to-hub membership. This audit does not delete or modify `presentationContextGroups`; it only classifies it correctly.

## Decision

**`DECISION = C — CANONICAL SIGNAL EXISTS BUT PARITY IS WEAK / AMBIGUOUS.`**

Rationale:

1. `contexts.includes("business")` is a defensible canonical vocabulary map (`CONTEXT_META.business.href === "/kouluttaja/"`), but its membership is text-inferred via `inferContexts` line 189–199, and it recovers only 7 of 57 legacy items (~12 % coverage).
2. Zero presentation MDs declare `contexts:` explicitly for business-family; the entire canonical-business set is derived from title/description keywords matching `veso|täydennyskoulutus|kouluttaja|keynote|webinaari|workshop`.
3. The correction spec explicitly warns against `translate sivuyhteys into another hidden heuristic` and against inferring membership from title regex. Switching authorities from `sivuyhteys` to `presentationContextGroups.veso-taydennyskoulutus` OR to `inferContexts`-derived `contexts=business` both fall under that warning.
4. No explicit canonical relationship field on presentation MDs identifies the `/kouluttaja/` audience today.

**`The legacy path cannot yet be safely deleted without defining or identifying an authoritative canonical relationship.`**

## Actions taken in this PR

Production files: **reverted to pre-PR state.**

- `src/_includes/related-presentations.njk` — **restored** (delete undone).
- `src/css/larux-page.css` — `.larux-section--presentations .related-presentations { ... }` selector **restored**.
- `src/fi/yritys.md` — `#viimeisimmat-esitykset` section **restored** to `{% include "related-presentations.njk" %}` with the original `relatedSivuyhteys="kouluttaja-sivu"` selection.
- `tests/rp-converge-01-company-presentations.spec.js` — **removed** (its assertions targeted the reverted production behavior).

Documentation: **kept as the audit outcome.**

- This implementation record (rewritten as an audit-only record).
- Three R1 doc amendments — updated to reflect Decision C and the fact that the legacy path remains on `main` under a documented canonical-relationship gap.

## Prevented regression

Shipping the original RP-CONVERGE-01 change would have made `presentationContextGroups.veso-taydennyskoulutus` — a regex-derived UI grouping — the authoritative membership rule for the `/kouluttaja/` presentation strip. That would have promoted a text-regex classification into a canonical-relationship position without any documented contract. RP-CONVERGE-01A prevents that regression.

## Non-goals reaffirmed

Neither RP-CONVERGE-01 nor RP-CONVERGE-01A changed any of the following:

- Canonical Content v1 (no field added / removed / redefined).
- The `contexts` vocabulary (`CONTEXT_ORDER`, `CONTEXT_META`, aliases, or `resolveContexts` logic).
- `inferContexts` behavior (specifically the `veso|täydennyskoulutus|kouluttaja|keynote|webinaari|workshop → business` rule).
- `presentationContextGroups.js` (kept as a UI-grouping layer for `/esitykset/`).
- The R1 shared `content-context-sidebar.njk` / `computeRelatedContent` filter.
- `semanticRelated.json`, `SEM_WEIGHT`, `SEM_MIN`, or the semantic layer boundary.
- Pagefind projections or the discovery pipeline.
- Public JSON contracts.
- Presentation URL/landing semantics (canonical `/presentations/{slug}/` for local, external URL for external-first — untouched).
- Any browser JS; the strip remains SSR / no-JS.

## Follow-up options (not part of this PR)

Options for a future, deliberately scoped decision:

1. **Editorial curation**: add explicit `contexts: ["business"]` declarations to the intended presentation MDs. This would move the `contexts=business` set from text-inference to editorial curation without any code change. RP-CONVERGE-01 could then re-use `contexts.includes("business")` as authority with strong coverage.
2. **Amend `inferContexts`**: broaden or narrow the business-context regex in `src/_data/contentContext.js` lines 189–199 based on documented editorial intent. Requires an architecture note because it changes canonical inference for other consumers (not just this strip).
3. **Retain the legacy strip indefinitely**: accept that `sivuyhteys="kouluttaja-sivu"` on the raw Canva import remains the operative selection. Document `sivuyhteys` as a scoped legacy editorial marker (not canonical membership) and leave the FI-only strip as-is.
4. **Remove the strip**: decide the marketing surface no longer needs a dynamic "latest coach presentations" section (the sibling `#esimerkit` curated section already shows examples). Deletion becomes justified because the section is dropped, not because the include was replaced.

None of these is a bounded slice on its own until an editorial owner picks an option.

## Tests

- Unit: `npm run test:unit` — **637 pass / 0 fail** (unchanged baseline; no production code changed relative to `origin/main`).
- Full build: still passes with unchanged baseline metrics (production restored to pre-PR state matches `origin/main` behavior).
- Targeted regression test removed (its assertions targeted the reverted production behavior).

## Architecture assessment

- **`presentationContextGroups` remains a derived UI grouping layer and is not used as canonical membership authority for the company presentation strip.**
- No parallel content-ownership path was removed; the legacy `canva.tableRows` + `sivuyhteys` path remains on `main` for now, documented as a live legacy consumer with a canonical-relationship gap (not orphan).
- No new content model, no new taxonomy, no new inferred-membership authority introduced.
- No AC1 reopen condition was triggered by either the original attempt (reverted before merge) or by this correction.

## AC1 assessment

**Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.** No reopen condition triggered:

- Duplicate content ownership: no new duplicate introduced (production reverted).
- Canonical semantics in browser JS: none added.
- Pagefind canonical storage regression: no change.
- Runtime JSON → HTML duplicating SSR: none added.
- Source / landing / context / public-contract regression: none.
- FI/EN parity: unchanged from `origin/main`.

**R1 remains `CLOSED / MAINTENANCE`.** R1's substantive conclusions are unchanged; only three factually stale "orphan" claims in R1-A / R1 closure / R1-ADR1 were corrected to reflect the discovered FI consumer and the Decision-C outcome.

## Stopping point

RP-CONVERGE-01A audit is complete when all six are true:

1. ✅ Legacy consumer identity on `main` verified (`src/fi/yritys.md:290`, `sivuyhteys="kouluttaja-sivu"`, 57 items).
2. ✅ Canonical alternative fields inspected (`contexts`, `type`, `source`, `categories`, `presentationContextGroups`) and coverage recorded.
3. ✅ Decision made and justified (Decision C, weak parity).
4. ✅ Production changes reverted; no unsafe replacement shipped.
5. ✅ R1-A / R1 closure / R1-ADR1 amendments updated to reflect Decision C (not the earlier "deletion completed" wording).
6. ✅ `presentationContextGroups` correctly classified as UI grouping, not canonical authority.

**No further RP-CONVERGE follow-up is scheduled in this workstream.** Any resumption depends on an explicit editorial or architecture decision per the "Follow-up options" section above.
