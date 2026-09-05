# CANONICAL-COURSE-PERIODID-01 — closure (2026-09-06)

Bounded Canonical Content v1 §Presentations type-specific extension:
adds an optional `periodId` field to `courseContexts[]` items so a
Presentation can canonically declare which specific implementation of
a course it belongs to.

Additive, non-breaking. No public projection expands. Sequence UX
stays deferred.

## 1. Base

- Base SHA: `096a275621af34ba78f6976676c13907ad4804c0` (origin/main after PR #215 merge)
- Branch: `feat/canonical-course-periodid-01`
- Audit reference: `docs/opetus-ia-2-canonical-course-implementation-audit-2026-09-06.md`
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (unchanged)
- DETAIL-UX-SEQUENCE-01 = **CLOSED / DEFERRED / DOCUMENTED / MAIN** (unchanged; this PR does NOT reopen it)

## 2. Exact semantics of optional `periodId`

Nested inside `courseContexts[]` items alongside `courseId`, `courseName`, `evidenceLevel`, `linkType`, `matchedTerms`, `evidenceSummary`, `courseSourceReferenceIds`.

```yaml
courseContexts:
  - courseId: 405040Y
    courseName: Teknologiatuettu oppiminen ja työskentely
    periodId: "2026-2027-a"        # ← NEW, OPTIONAL
    evidenceLevel: strong
    linkType: explicit_course_code
    matchedTerms: [405040Y]
    evidenceSummary: "…"
```

- **Purpose:** identifies a specific known course implementation / period.
- **Type:** string; human-readable; recommended shape `{academicYear-lowercased}-{period-lowercased}` (e.g. `"2026-2027-a"`). Consumers treat the string as opaque.
- **Authority:** the value MUST match the corresponding course page's `course.periodId` frontmatter when such a course page exists.
- **Requiredness:** OPTIONAL. Non-breaking for the 41 existing legacy `courseContexts` records that ship without it.
- **Invariant:** `periodId` MUST NEVER be inferred from date, title, URL slug, topic, category, Pagefind, Content Graph, or filename. Only the frontmatter is authoritative.

## 3. Why absence is meaningful

Absence of `periodId` on a `courseContexts[]` item explicitly means:

> "This Presentation is attributed to `courseId` at the course level; the specific implementation is NOT known canonically."

Consumers MUST tolerate absence gracefully. This preserves the canonical truth about legacy content (410014Y 19 items across 5 periods; 410017Y 8 items across ~4 periods with parallel content sub-series). Silently back-filling those would replace unknown truth with fabricated data.

## 4. Migrated records

Exactly three Presentation frontmatter files gained `periodId: "2026-2027-a"`:

- `src/presentations/405040y-luento-1-johdanto-2026-a.md`
- `src/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.md`
- `src/presentations/405040y-luento-3-tekoalylukutaito-2026-a.md`

The value matches the course page `src/opetus/teknologiatuettu-oppiminen-2026-a.md`'s `course.periodId: "2026-2027-a"`.

## 5. Deliberately unmigrated historical records

The following records **remain without `periodId`** by design:

- 410014Y (19 files, 2011–2015, five implementations — no course pages exist for any of these implementations)
- 410017Y (8 files, 2012–2015, ≥4 implementations)
- 418028P (2 files)
- 413315S-01, 413314S, 407062A, 405021Y, 050091A (singletons)
- Kempele VESO 2026 (no `courseContexts` at all — `courseReview.status = rejected` in Canva projection)

Total unmigrated: 39 `courseContexts` items across 38 files. Their status is "course-level attribution only; implementation not known canonically." This is the correct canonical answer given the source evidence, not a temporary state waiting to be filled.

## 6. Validation behavior

New helper: `scripts/validate-course-period-id.js`.

- Iterates `src/presentations/*.md` frontmatter and cross-checks any `courseContexts[].periodId` against course-page frontmatter `course.periodId` values indexed by `courseId`.
- Warning-only. Exit code always 0.
- Never mutates data. Never infers `periodId`.
- Prints one warning line per suspect entry (unknown courseId with periodId; periodId mismatch against course-page value). Prints a summary line at end.

Current repo state: 3 entries checked, 0 warnings.

## 7. Projection impact

### Internal canonical projection

The `courseContexts[]` array is passed through the entire canonical projection pipeline (`src/_data/presentationsPage.js` `buildCanonicalPresentationItems`, `buildCanonicalPresentationPageRecords`, `buildCanonicalPresentationPageLookup`) as-is — no per-field allowlist strips nested keys inside courseContexts items. `periodId` therefore travels through unchanged for future internal SSR consumers.

Existing SSR consumers (`presentation-item.njk`, `presentations.11tydata.js`, `knowledgeGraph.js`, `presentationDerivedMetadata.js`, `teachingUnits.js`, `presentationSources.js`) do not currently read `periodId` and require no changes.

### Public JSON

`/data/presentations-page.json` (the canonical public projection for the /esitykset/ page) already exposes the full `courseContexts` array including all pre-existing nested fields. To honour this workstream's invariant that public JSON is unchanged, `src/data/presentations-page.json.11ty.js` now strips `periodId` from every `courseContexts[]` item at the public-JSON boundary via a small `stripInternalOnlyFields` helper.

- Byte-for-byte: `_site/data/presentations-page.json` gains zero `periodId` occurrences.
- Shape: `courseContexts` array continues to project every other pre-existing nested field.
- Internal canonical projection is untouched — the strip happens only at the JSON.stringify boundary.

## 8. Public-contract impact

**Zero.**

- `_site/data/presentations-page.json` — `periodId` absent (stripped at boundary).
- `_site/presentations/*/index.html` — `periodId` absent (never rendered by templates).
- Verified: `grep periodId _site/presentations/405040y-luento-1-johdanto-2026-a/index.html` → 0 matches.
- Verified: `grep '"periodId"' _site/data/presentations-page.json` → 0 matches.

## 9. JSON-LD impact

**Zero.** `_ldschema.njk` has zero `courseContexts` references; adding a nested field to `courseContexts[]` cannot appear in JSON-LD without an explicit template change, which this PR does not make.

## 10. Pagefind impact

**Zero.** Presentation detail templates emit no `data-pagefind-meta="course*"` attribute; adding a nested `periodId` to canonical data does not touch Pagefind indexing. Verified: no new `data-pagefind-*` attribute in changed templates.

## 11. Files changed

**New:**
- `scripts/validate-course-period-id.js` — build-time validation helper (warning-only, exit 0).
- `tests/unit/canonicalCoursePeriodId.test.js` — regression suite (11 tests across 4 groups).
- `docs/canonical-course-periodid-01-closure-2026-09-06.md` — this file.

**Modified:**
- `docs/canonical-content-contract-v1.md` §3 Presentations — adds nested-field table for `courseContexts[]` documenting `periodId` semantics + invariants.
- `src/presentations/405040y-luento-1-johdanto-2026-a.md` — adds `periodId: "2026-2027-a"` to its 405040Y courseContexts item.
- `src/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.md` — same.
- `src/presentations/405040y-luento-3-tekoalylukutaito-2026-a.md` — same.
- `src/data/presentations-page.json.11ty.js` — adds `stripInternalOnlyFields` helper to keep the public JSON boundary unchanged.

**Also included (from audit branch):**
- `docs/opetus-ia-2-canonical-course-implementation-audit-2026-09-06.md` — the audit that authorized this slice.

## 12. Architecture Closure 1.0 impact

**Zero. AC1 remains CLOSED / GREEN / MAIN.**

- AC1 protects the C1 canonical core semantic contract. `courseContexts[]` is documented as `TYPE-SPECIFIC` in Canonical Content v1 §3 (Presentations). Type-specific extensions are extensible per contract; adding a new optional nested field is exactly the extension mechanism the contract anticipates.
- No changes to canonical core fields (`id`, `title`, `description`, `date`, `pageUrl`, `sourceKey`, etc.).
- No changes to source→canonical→projection layering.
- No new abstraction. No new architectural layer.

## 13. DETAIL-UX-SEQUENCE-01 impact

**Zero. DETAIL-UX-SEQUENCE-01 remains CLOSED / DEFERRED / DOCUMENTED / MAIN.**

`periodId` alone does NOT satisfy the sequence audit's reopen condition. Sequence UX would still require:

1. Session-order semantics (a `sessionIndex` field or equivalent) — **NOT added by this PR.**
2. Independent canonical-content justification for that ordering primitive — **not asserted by this PR.**
3. Falsification evidence that same-`(courseId, periodId)` sets provide unique ordering — **not gathered by this PR.**

This PR is careful in its schema-doc text to state:
> `periodId` ei implikoi `sessionIndex`ia. Sekvenssijärjestys (edellinen/seuraava luento) ei ole johdettavissa `periodId`:sta yksin. Sekvenssisemantiikka vaatisi erillisen kanonisen laajennuksen omalla auditillaan; DETAIL-UX-SEQUENCE-01 pysyy CLOSED / DEFERRED.

Any future sequence-UX proposal MUST satisfy its own audit + reopen condition — this PR provides no shortcut.

## 14. Tests and verification

New unit test spec `tests/unit/canonicalCoursePeriodId.test.js` — **11/11 green** across 4 groups:

- **Group A (3 tests):** each of the three 405040Y luento files carries `courseId=405040Y` + `periodId="2026-2027-a"`.
- **Group B (3 tests):** absence is meaningful — only the three 405040Y files carry `periodId`; 410014Y and 410017Y receive no inferred `periodId`.
- **Group C (1 test):** Kempele VESO exclusion invariant preserved (still no `courseContexts` at all).
- **Group D (2 tests):** validator cross-check matches course-page authority; zero validator warnings for current repo state.
- **Group E (2 tests, gated on prior build):** Public JSON `/data/presentations-page.json` does NOT expose `periodId`; rendered Presentation HTML does NOT surface `periodId`.

Build: `CACHE_ONLY=true npx @11ty/eleventy` exit 0.
Pagefind: regenerated post-build, unchanged.
Adjacent regression suites: to be run in CI.

## 15. Deletion / simplification

None in this PR. The extension is intentionally additive. No pre-existing consumer becomes redundant. No temporary compatibility code exists that this PR could safely remove.

If a future IA-3 slice ships a Presentation → course-implementation reverse link, some course-page ↔ presentation drift-detection code may become worth writing (build-time check that `lectures[].presentationPageUrl` and Presentation-side `periodId` agree). Out of scope here.
