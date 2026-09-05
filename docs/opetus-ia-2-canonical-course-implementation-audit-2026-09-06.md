# OPETUS-IA-2 — Canonical Course-Implementation Semantics audit (2026-09-06)

## 1. Status

**AUDIT ONLY.** No production code changes, no schema changes, no commits, no PR. Awaiting explicit implementation authorization.

**Verdict: CONDITIONAL GO for a narrow, opt-in `periodId` extension on Presentation `courseContexts[]`.** The canonical contract as it stands cannot correctly attribute a Presentation to a specific course implementation, and this gap is a genuine canonical-content problem independent of any UX feature.

## 2. Repo baseline

- Branch: `audit/opetus-ia-2` (local; not pushed)
- HEAD: `096a275621af34ba78f6976676c13907ad4804c0`
- origin/main: `096a275621af34ba78f6976676c13907ad4804c0`
- Main contains OPETUS-IA-01 slice 1 (SSR `/opetus/` landing) via PR #215.
- **Architecture Closure 1.0 = CLOSED / GREEN / MAIN** (unchanged).
- **Canonical Content v1 = unchanged** (this audit does not modify it).
- **DETAIL-UX-SEQUENCE-01 = CLOSED / DEFERRED / DOCUMENTED / MAIN** (unchanged; this audit does not reopen it).

Docs consulted:
- `docs/opetus-ia-01-audit-2026-09-05.md`
- `docs/opetus-ia-01-closure-2026-09-05.md`
- `docs/detail-ux-sequence-01-audit-2026-09-05.md`
- `docs/canonical-content-contract-v1.md`
- `docs/architecture-closure-1-0-closure-2026-08-29.md`

## 3. Current data flow (verified against main HEAD `096a2756`)

### Canonical Content v1 §Presentations — `courseContexts[]` fields

Exhaustive frontmatter grep across `src/presentations/*.md` (42 files carrying `courseContexts`) yields exactly these keys inside each course-context item:

| Field | Semantic |
|---|---|
| `courseId` | Course code (`405040Y`, `410014Y`, `410017Y`, `418028P`, `413315S-01`, `413314S`, `407062A`, `405021Y`, `050091A`) |
| `courseName` | Human-readable course name |
| `evidenceLevel` | `"strong"` \| `"contextual"` |
| `linkType` | `"explicit_course_code"` \| `"explicit_course_name"` \| `"probable_legacy_course_material"` \| `"possible_reuse_of_course_material"` \| `"contextual_topic_or_pathway"` |
| `matchedTerms` | Tokens that produced the match |
| `evidenceSummary` | Free-form audit-trail string |
| `courseSourceReferenceIds` | Provenance references |

**No `periodId`. No `academicYear`. No implementation identity. No session/lecture order.**

### Course-page frontmatter (page-local, NOT canonical)

`src/opetus/teknologiatuettu-oppiminen-2026-a.md` — the single existing real course-implementation page — carries a `course:` object with:

```yaml
course:
  courseId: 405040Y
  courseName: Teknologiatuettu oppiminen ja työskentely
  credits: 4
  creditsLabel: "4 op"
  period: A
  academicYear: "2026–2027"
  semester: syksy
  semesterLabel: "Syyslukukausi 2026"
  periodId: "2026-2027-a"       # ← human-readable implementation ID
  peppiUrl: "https://opas.peppi.oulu.fi/fi/opintojakso/405040Y/28004?period=2026-2027"
                                 #                              ^^^^^ Peppi implementation ID
  teachingUnitLabel: Opettajankoulutus
  teachingStaff: […]
  lectures:
    - number: 1
      date: 2026-08-25
      presentationPageUrl: /presentations/405040y-luento-1-johdanto-2026-a/
    - number: 2 …
    - number: 3 …
    - number: 4 (no presentationPageUrl)
    - number: 5 (externalSpeaker: Kopiosto)
```

**Observation:** the course-page carries implementation identity as page-local metadata. The Peppi URL contains the university's authoritative implementation ID (`28004`). The `periodId: "2026-2027-a"` string is a project-local, human-readable identifier derived from `academicYear + period`. Neither is part of canonical content today; both live on a single page's frontmatter.

### Course-side ↔ Presentation-side linkage today

| Direction | Mechanism | Canonical? |
|---|---|---|
| course-page → Presentation | `lectures[].presentationPageUrl` string list on the course page | Page-local. Not canonical. |
| Presentation → course-implementation | *(absent)* | Impossible to derive canonically. Presentation only knows `courseId`, not which implementation. |

### Consumers of `courseContexts`

Grep across `src/` (excluding `.md` frontmatter files):

- `src/_data/canva.js` — Canva merge
- `src/_data/knowledgeGraph.js` — course nodes + `usedInCourse` edges
- `src/_data/presentationSources.js` — local source assembly
- `src/_data/presentationsPage.js` — canonical projection pipeline
- `src/_data/teachingUnits.js` — courseId → teaching-unit mapping
- `src/_includes/presentation-item.njk` — SSR: Käyttöyhteys, Samalla kurssilla
- `src/_utils/presentationDerivedMetadata.js` — teachingUnit inference + course signals
- `src/presentations/presentations.11tydata.js` — eleventyComputed

**Not consumers:**
- `src/_utils/toPublicContentRecord.js` (zero `course` references) → **`courseContexts` is not projected to Public JSON.**
- `src/_includes/_ldschema.njk` (zero `courseContexts` references) → **not projected to JSON-LD.**
- Pagefind meta emission on presentation detail (verified: no `data-pagefind-meta="course*"` emission) → **not indexed by Pagefind as canonical structure.**

## 4. Semantic problem

The canonical model can express *"this presentation is part of course 405040Y"* but cannot express *"this presentation is part of the 2026-2027 A implementation of course 405040Y."*

This gap manifests as user-visible incoherence in three ways:

1. **Same-course sequence conflation across implementations.** DETAIL-UX-SEQUENCE-01 already documented this on `courseContexts[].courseId`-only grouping — 19 items across 5 periods of 410014Y cannot be attributed to a single implementation.
2. **No Presentation → course-page reverse link.** A reader on `/presentations/405040y-luento-1-johdanto-2026-a/` cannot canonically know which course page owns them. Any inference requires heuristic URL/date/title matching.
3. **Legacy content misclassification risk.** 410014Y presentations from 2011 would appear identical semantically to hypothetical 2026 revisions of the same course, blocking future IA that surfaces "current implementation" vs "archived material".

**These are canonical-content problems**, not UX problems: even if no user-facing prev/next or reverse-link UI shipped, the underlying model still fails to represent a distinction that exists in the source domain (university course implementations).

## 5. Representative evidence (falsification cases)

### 405040Y — positive baseline
- One course-implementation page (`teknologiatuettu-oppiminen-2026-a.md`), `periodId: "2026-2027-a"`.
- Three presentations (luento 1–3) all with `courseContexts[].courseId = 405040Y` + `linkType: explicit_course_code`.
- Zero ambiguity: all three belong to this implementation.
- Trivially migrateable: add `periodId: "2026-2027-a"` to three frontmatter files.

### 410014Y — historical falsification
- 19 presentations across five distinct fall terms (2011, 2012, 2013, 2014, 2015).
- No course-implementation page exists for any of these terms.
- Mixed `linkType` distribution (some `explicit_course_code`, many `probable_legacy_course_material`, one `explicit_course_name`).
- Falsifies `courseId`-only membership as sufficient. Also falsifies naive `courseId + year` since even single years contain multiple presentations without a canonical order or session count guarantee.
- Some items are NOT lecture material at all (e.g. `OSAAVA VESO 2015` — supplementary continuing-education reuse).
- **Migration answer:** these presentations receive **no `periodId`**. Their canonical status remains "attributed to course 405014Y at course level, implementation not determined." No inference from date. No inference from title.

### 410017Y — parallel-series falsification
- 8 presentations across ~4 periods.
- Contains parallel content sub-series (`Multimedia I–V` from 2012 as a bounded sequence; separate `Digitaalinen media…` items 2014–2015).
- Even within a single year, multiple parallel materials with the same `courseId` reflect distinct implementations OR distinct content strands within one implementation — cannot be resolved from `courseContexts` fields alone.
- **Migration answer:** same as 410014Y. `periodId` absent by default. Preserving the truth that canonical data does not know which implementation these belong to is more valuable than back-filling a guess.

### Kempele VESO — exclusion invariant
- `src/presentations/kempele-veso-2026.md` has **no** `courseContexts` in frontmatter.
- `src/_data/canva-presentations.json` sets `courseReview.status = "rejected"` for this record, blocking any course-context inference by the canonical projection.
- **Migration answer:** Kempele MUST remain excluded. Any period-identity extension MUST NOT introduce broad-fallback or topic-based membership that would sweep VESO/täydennyskoulutus content into "Opetus".

### Other courseIds
Distribution across `src/presentations/*.md`:

| courseId | Count | Course page? | Notes |
|---|---|---|---|
| 410014Y | 19 | no | historical, 5 periods |
| 410017Y | 8 | no | historical, ≥4 periods |
| 405040Y | 3 | **yes (2026-2027-a)** | current implementation |
| 418028P | 2 | no | single year, `contextual_topic_or_pathway` |
| 413315S-01 | 1 | no | singleton |
| 413314S | 1 | no | singleton |
| 407062A | 1 | no | singleton |
| 405021Y | 1 | no | singleton |
| 050091A | 1 | no | singleton |

**Only 405040Y currently has a course-page counterpart. All other courseIds carry historical materials whose implementation identity is unrecoverable from repo evidence today.**

## 6. Candidate identity models

Evaluated against the falsification cases:

### Model A — composite `courseId + academicYear + period`
- **Semantics:** implementation is (courseCode, academicYear, period) tuple.
- **Falsification tests:** works for 405040Y. Splits 410014Y into (2011-fall, 2012-fall, …). Falls into ambiguity for parallel series within a single period (410017Y "Multimedia I–V" case).
- **Verdict:** semantically correct for the university's model but requires three fields to identify. Higher migration surface.

### Model B — Peppi implementation ID (opaque, e.g. `28004`)
- **Semantics:** authoritative university-issued identifier for one delivery.
- **Falsification tests:** ideal when Peppi ID is known. Historical implementations from 2011–2015 predate current Peppi. Not derivable.
- **Verdict:** authoritative but not available for the majority of historical records. Cannot be the primary identifier.

### Model C — human-readable `periodId` (e.g. `"2026-2027-a"`)
- **Semantics:** project-defined identifier that matches the corresponding course-page's `course.periodId`.
- **Falsification tests:** works for 405040Y. For 410014Y/410017Y (no course pages exist), value is naturally absent — the correct canonical answer.
- **Verdict:** matches existing course-page frontmatter convention. Human-readable, human-verifiable. Single-field. Compatible with future absence when implementation is unknown.

### Model D — hybrid (`periodId` primary + optional `peppiImplementationId`)
- **Semantics:** `periodId` is canonical; `peppiImplementationId` is optional authoritative reference.
- **Falsification tests:** same as Model C for identity; adds a provenance field for records that do have a Peppi ID.
- **Verdict:** clean primary + optional provenance. Peppi ID may drift as university platform evolves (currently `opas.peppi.oulu.fi`). Not worth requiring; keep as optional add-on.

## 7. Recommended canonical model

**Extend Canonical Content v1 §Presentations `courseContexts[]` with exactly one new optional field:**

```yaml
courseContexts:
  - courseId: 405040Y
    courseName: Teknologiatuettu oppiminen ja työskentely
    evidenceLevel: strong
    linkType: explicit_course_code
    matchedTerms: [405040Y]
    evidenceSummary: "…"
    periodId: "2026-2027-a"        # ← NEW, OPTIONAL
```

### Authoritative semantics

- **`periodId`** identifies **which specific implementation of `courseId`** this Presentation belongs to.
- Value MUST match a corresponding course-page's `course.periodId` frontmatter value if such a course page exists.
- Format is a project-defined string. Recommended shape: `{academicYear}-{period}` lowercased (e.g. `"2026-2027-a"`), consistent with existing course-page convention. The exact string is treated as opaque by consumers — no parsing.
- **Absence semantics are load-bearing:** omitted `periodId` MUST mean "this Presentation is attributed to `courseId` at the course level; specific implementation is NOT known canonically." Consumers MUST NOT infer implementation from date, title, URL slug, or any other source.

### Field naming rationale

Chose `periodId` (not `coursePeriodId`, `implementationId`, `courseImplementationId`):
- **Consistent** with the existing `course.periodId` name on course-page frontmatter — same word means the same thing across course-page and presentation-side data.
- **Correctly scoped** — nested inside `courseContexts[]` alongside `courseId`, so no risk of top-level naming collision.
- **Language-neutral** — matches Finnish `periodi` and English `period` semantics.
- **Shorter** than alternatives without loss of clarity given the surrounding `courseContexts` scope.

### Required vs optional

- **OPTIONAL.** Non-breaking for the 41 existing records that carry `courseContexts` today.
- REQUIRED only if the corresponding `courseId` has a course page AND the presentation is provably part of that implementation. Otherwise omitted.

### Validation invariants

1. `periodId` MUST NOT appear without `courseId` (nested inside a course-context item that already has `courseId`).
2. `periodId` values SHOULD match the format `{academicYear-lowercased}-{period-lowercased}` when derivable, but the field is opaque; validators MUST NOT reject deviant strings if the corresponding course-page frontmatter has a matching string.
3. `periodId` MUST NOT be inferred by any consumer. Only the frontmatter is authoritative.
4. Multiple `courseContexts[]` items with the same `courseId` but different `periodId` are ALLOWED (a presentation could be canonically attributed to two implementations of the same course, e.g. a rerun of the same material).
5. `courseContexts[]` items with the same `courseId` and same `periodId` MUST be deduplicated at authoring time (canonical redundancy).

### Ambiguous-record behavior

- Records without a Peppi/course-page match → `periodId` omitted. Consumers that need implementation identity (future IA-3 reverse link, potential OPETUS-IA-2-IMPL landing enrichment) MUST tolerate absence gracefully.
- Records where `courseId` refers to a course whose implementation cannot be uniquely determined from source (e.g. a reused-material presentation that was shown in multiple implementations) → `periodId` omitted. If explicitly attributed to multiple, use multiple `courseContexts[]` entries (each with `courseId + periodId`).
- Historical materials (410014Y 2011–2015) → `periodId` remains absent. The canonical truth is "we know the courseId; we don't have implementation-level authorship data."

## 8. Migration scope

**Only 3 files need `periodId` added** to close the current active gap (all 405040Y luento files):

- `src/presentations/405040y-luento-1-johdanto-2026-a.md`
- `src/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.md`
- `src/presentations/405040y-luento-3-tekoalylukutaito-2026-a.md`

Add `periodId: "2026-2027-a"` to each `courseContexts[]` item. No other 405040Y implementations exist yet.

**No migration required for the other 39 records** with `courseContexts`. Their `periodId` stays absent by design.

**Estimated diff:** ~6 lines total (3 files × 1 line each). Fits in one small canonical-migration PR.

## 9. Consumer / projection impact

### Internal consumers (may opt in to `periodId`)

| Consumer | Impact | Required change? |
|---|---|---|
| `src/_data/presentationsPage.js` (canonical projection) | Pass through `periodId` inside `courseContexts[]` items. | Yes — trivial (field is already carried through as-is if projection uses spread/copy patterns; needs verification). |
| `src/_data/knowledgeGraph.js` | Could refine `course` node to a `(courseId, periodId)` composite for edges. | Optional. Node identity can stay `courseId`-only until IA-3 makes use of it. |
| `src/_data/teachingUnits.js` | `fromCourseContexts()` looks up teaching unit from `courseId`. `periodId` irrelevant to teaching-unit membership. | No change. |
| `src/_utils/presentationDerivedMetadata.js` | Uses `courseContexts` for teachingUnit inference + search-signal building. `periodId` not used in signal building. | No change. |
| `src/_includes/presentation-item.njk` | Currently reads `courseContexts` for Käyttöyhteys + Samalla kurssilla. Neither semantically needs `periodId` today. | No change (until a future IA-3 slice adds a "Osa kurssitoteutusta X" reverse link). |
| `src/presentations/presentations.11tydata.js` | eleventyComputed `presentationContextSummary` etc. read `courseContexts`. Not affected. | No change. |

### External projections

- **Public JSON**: currently does not project `courseContexts`. No change.
- **JSON-LD**: currently does not project `courseContexts`. No change.
- **Pagefind**: currently no `data-pagefind-meta="course*"` emission on Presentation detail. No change.

**Zero public-contract impact.** All potential use of `periodId` is internal.

### Course-page consumers (unchanged)

Course-page frontmatter continues to be authoritative for its own `course.periodId`. This audit does NOT propose changing course-page conventions.

## 10. FI / EN implications

- Field name `periodId` is language-neutral.
- Course-page frontmatter is FI-only today (`translationKey: course_405040y_2026_a_fi_only`); adding `periodId` to Presentation frontmatter does not change that.
- No new user-facing labels introduced by the schema extension itself.

## 11. Deletion / simplification opportunities

If `periodId` is adopted and IA-3 (Presentation → course-implementation reverse link) later ships:
- Course-page-frontmatter-driven `lectures[].presentationPageUrl` list could gain a build-time consistency check ("every presentation with `periodId=X` is either in `lectures[].presentationPageUrl` for the course page with `periodId=X` OR is a supplementary material listed elsewhere on that page"). Enables detecting drift.
- Reduces need for the DETAIL-UX-01C-B-COURSE "Samalla kurssilla" peer-selection to add implementation-scoped filtering: if peers were filtered to same-`periodId`, 410014Y peer sets would correctly be empty (until they gain `periodId`s).

Not deletable today. IA-2 schema extension is additive.

## 12. Risks

1. **Author burden.** Every new 405040Y-family presentation needs `periodId` in frontmatter. Mitigation: schema stays optional, so authors can defer; but the RECOMMENDED practice for new active-course presentations is to include it.
2. **`periodId` string drift** between course-page and presentation-side. Mitigation: build-time validation that `periodId` on Presentation matches a real course-page `course.periodId` when the corresponding course page exists. Otherwise emit a warning (not a hard error) to allow the ~39 legacy records to sit with `periodId` absent.
3. **Silent inference temptation.** Future implementations must not fall back to date-derived or title-derived `periodId`. Mitigation: repeat the "no inference" invariant in schema extension closure + a lint/test guard.
4. **Scope creep to `sessionIndex`.** IA-2 must not add `sessionIndex`. That would reopen DETAIL-UX-SEQUENCE-01. Sequence-order semantics need a separate justification independent of IA needs. Mitigation: explicit non-goal in extension closure.
5. **Cross-domain generalization pressure.** IA-2 is Presentations-scoped. Media/Publications/Theses currently have no `courseContexts`. If they ever gain teaching-attribution, that would be a separate schema question — do NOT extend `periodId` to a domain that doesn't yet carry `courseContexts` at all.
6. **Historical VESO/täydennyskoulutus reclassification.** Any tooling that later consumes `periodId` for "current course" listings MUST honor `courseReview.status = rejected` and `courseContexts` absence. Kempele-style exclusion remains authoritative.

## 13. Architecture Closure 1.0 impact

**No AC1 reopen trigger.**

- AC1 protects the C1 canonical core semantic contract (id/title/description/date/…). `courseContexts[]` is documented as `TYPE-SPECIFIC` in Canonical Content v1 §3 (Presentations). Type-specific extensions are extensible per that contract; extending `courseContexts[]` with a new optional field is exactly the mechanism v1 anticipates for domain-specific evolution.
- No changes to canonical core fields.
- No changes to source-projection layering.
- No new abstraction. No new architectural layer.

Default AC1 status remains **CLOSED / GREEN / MAIN**. This audit finds no repo-evidence regression.

## 14. Explicit relationship to DETAIL-UX-SEQUENCE-01

DETAIL-UX-SEQUENCE-01 remains **CLOSED / DEFERRED / DOCUMENTED / MAIN.**

`periodId` **does NOT** by itself satisfy the sequence-audit reopen condition. Sequence UX requires:
- membership (which `periodId` would provide), AND
- **deterministic session order** (which `periodId` does NOT provide).

The DETAIL-UX-SEQUENCE-01 audit explicitly identified `sessionIndex` as the ordering primitive. IA-2 does NOT add `sessionIndex`. If a future workstream wants to propose `sessionIndex`, it must:
1. Justify it independently of sequence UX (per sequence audit's reopen rule);
2. Present evidence that canonical data can supply unique, deterministic session ordering per `(courseId, periodId)` set;
3. Handle the 410014Y-class case where multiple 2011 Luento files have same-day publish dates and non-uniform title numbering.

None of that is in scope here. **This audit does NOT reopen sequence.**

## 15. Final decision

**CONDITIONAL GO for a narrow, additive `periodId` extension to Canonical Content v1 §Presentations `courseContexts[]`.**

Conditions:
1. Extension is OPTIONAL — no forced migration of the 39 legacy records.
2. Absence is load-bearing semantics — no inference by consumers.
3. `sessionIndex` is EXPLICITLY OUT OF SCOPE (would reopen DETAIL-UX-SEQUENCE-01 without independent justification).
4. Public JSON / JSON-LD / Pagefind projections stay unchanged.
5. Cross-domain expansion (Media/Publications/Theses) EXPLICITLY OUT OF SCOPE.
6. Field naming: `periodId` (matches course-page frontmatter convention).

If any of these conditions cannot be met, the recommendation collapses to NO-GO.

## 16. Bounded next workstream (exactly one, if approved)

### CANONICAL-COURSE-PERIODID-01 — Add optional `periodId` to Presentation `courseContexts[]`

Scope:
1. Update `docs/canonical-content-contract-v1.md` §3 Presentations to list `courseContexts[].periodId` as an OPTIONAL type-specific extension with the semantics documented above.
2. Add `periodId: "2026-2027-a"` to the three 405040Y luento frontmatter files.
3. Verify the canonical projection pipeline (`src/_data/presentationsPage.js` `buildCanonicalPresentationPageRecords`, `buildCanonicalPresentationItems`) passes `periodId` through cleanly (likely already does via spread patterns — verify + test).
4. Build-time validation helper: when a course page exists for a given `courseId`, warn if a Presentation with matching `courseId` carries `periodId` but the value does not match that course page's `course.periodId`. Do NOT hard-fail — some presentations may be legacy or intentionally attributed to a specific past implementation.
5. New regression tests: verify `periodId` survives the canonical projection unchanged; verify absence stays absent; verify the three 405040Y presentations resolve to their `periodId` end-to-end; verify Kempele and 410014Y-class records remain without inferred `periodId`.
6. Closure doc `docs/canonical-course-periodid-01-closure-YYYY-MM-DD.md`.

Out of scope (must be separate future workstreams if ever pursued):
- Presentation-detail "Osa kurssitoteutusta X" reverse link (IA-3).
- Course-page enrichment listing ALL same-`(courseId, periodId)` presentations (IA-3).
- `sessionIndex` addition (would need its own audit + explicit sequence-audit reopen justification).
- Cross-domain `courseContexts` on Media/Publications/Theses.
- Public JSON / JSON-LD / Pagefind emission of `periodId`.
- Backfill of legacy 410014Y / 410017Y `periodId` values.

Diff estimate: ~15 lines schema doc + ~6 lines frontmatter + ~30 lines projection verification test + ~50 lines closure = ~100 lines total, plus one small validation helper if adopted.

Architecture Closure 1.0 status: expected to remain **CLOSED / GREEN / MAIN** after CANONICAL-COURSE-PERIODID-01 (type-specific extension per §3 of the closed contract).

**Await explicit implementation authorization before starting CANONICAL-COURSE-PERIODID-01. This audit stops here.**
