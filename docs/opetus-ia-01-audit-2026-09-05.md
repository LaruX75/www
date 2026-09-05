# OPETUS-IA-01 — Teaching / Course Information Architecture audit (2026-09-05)

## 1. Status

**AUDIT ONLY.** No production code changes. No commits. No PR. No implementation. Awaiting explicit implementation approval.

**Verdict: CONDITIONAL GO for a small, IA-first implementation slice.** The teaching area does not currently exist as a coherent user-facing IA even though the underlying course-page data model is already rich. The IA gap is real, user-facing, and independent of sequence UX.

## 2. Repo / branch / HEAD / origin/main

- Branch: `audit/opetus-ia-01` (local; not pushed)
- HEAD: `33af97fd0541aa7e1481f3f3b517e597502704df`
- origin/main: `33af97fd0541aa7e1481f3f3b517e597502704df`
- Main contains PR #214 (DETAIL-UX-SEQUENCE-01 audit — DEFERRED).
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN**.
- Canonical Content v1 = unchanged (this audit does not propose to change it).

Docs consulted:
- `docs/canonical-content-contract-v1.md`
- `docs/detail-ux-sequence-01-audit-2026-09-05.md` (evidence for canonical-course-structure gap; NOT a call to implement sequence UX)
- `docs/course-page-01-405040y-2026-a-2026-09-03.md`
- `docs/detail-ux-01c-b-course-closure-2026-09-05.md`
- `docs/architecture-closure-1-0-closure-2026-08-29.md`
- `docs/architecture-closure-current-state-reconciliation-2026-08-29.md`

## 3. Architecture guardrails preserved

- **DETAIL-UX-SEQUENCE-01 remains CLOSED / DEFERRED.** This audit reuses that audit's evidence about `courseContexts` limitations but proposes NO sequence UX and NO reopen of sequence.
- **Canonical Content v1: NO changes in this audit.** Any schema extension recommendation is a separate audit + PR + closure.
- No taxonomy invented for the UI. No Pagefind as canonical storage. No SPA architecture. No parallel client-side content model.
- SSR-first remains the target.
- The teaching IA justifies the data model, not the other way around (per DETAIL-UX-SEQUENCE-01 reopen rule).

## 4. Current-state map

### Existing routes / files

| URL | Backing source | Type |
|---|---|---|
| `/opetus/` | `src/legacy-redirects/opetus.njk` | **redirect to `/tyoni-yliopistonlehtorina/`** — no hub, no landing, no course index |
| `/opetus/teknologiatuettu-oppiminen/2026-2027-a/` | `src/opetus/teknologiatuettu-oppiminen-2026-a.md` | **Real course-implementation page** (single course, single period) |
| `/opetus/teknologiatuettu-oppiminen/2026-a/` | (legacy alias? — appears in `_site/opetus/teknologiatuettu-oppiminen/`) | Legacy alias, resolves to same content |
| `/opetus-teknologiatuettu-oppiminen-2026-a/` | `src/legacy-redirects/opetus-teknologiatuettu-oppiminen-2026-a.njk` | Legacy flat-URL redirect |
| `/tyoni-yliopistonlehtorina/` | `src/fi/tyoni-yliopistonlehtorina.njk` | **Personal-profile page** ("Yliopistotyö: opetus, tutkimus ja yhteiskunnallinen vuorovaikutus"). Overview of teaching + research + societal engagement. Not a course hub. |
| `/portfolio/` | `src/portfolio-index.njk` + `src/_includes/portfolio.njk` | **Teaching portfolio** — pedagogical principles, evaluation evidence, teaching CV. Not a course structure. |
| `/en/portfolio/` | `src/en/portfolio.njk` | EN teaching portfolio |
| `/presentations/405040y-luento-{1,2,3}-…/` | `src/presentations/*.md` | Individual presentation detail pages (lecture materials) |

### Navigation exposure

`src/_includes/_nav-fi.njk` mega-menu section "Opetus & portfoliot" contains **two** links:
1. `/tyoni-yliopistonlehtorina/` — labelled "Työni yliopistonlehtorina" with helper text "Kurssit, materiaalit ja pedagoginen työ"
2. `/portfolio/` — labelled "Opetusportfolio"

**No link to `/opetus/` or to any individual course page from primary navigation.** The real course page at `/opetus/teknologiatuettu-oppiminen/2026-2027-a/` is essentially unreachable from nav — a user has to know the URL or arrive from a presentation detail's course context.

The `Työ`-menu trigger currently defaults to `/tyoni-yliopistonlehtorina/` and marks itself active when the URL contains `/opetus/`, `/portfolio/`, `/tutkimus/`, `/yhteiskunnallinen-vuorovaikutus/`, `/vaitoskirja/`, or `/palkinnot/`.

## 5. User-facing problem statement

A visitor entering "Opetus" (via the Työ mega-menu subsection heading "Opetus & portfoliot") is offered:
- a personal-profile page (`/tyoni-yliopistonlehtorina/`) that talks ABOUT teaching (among other things), and
- a teaching portfolio (`/portfolio/`) that evaluates teaching.

Neither presents:
1. **What is taught** — no enumeration of courses.
2. **Which courses exist** — no course index.
3. **Which implementation/period** of a course the user is looking at — this data is only visible on the course-implementation page itself.
4. **What sessions/materials belong to which course** — the presentation ↔ course link is one-way (course-page → presentation), not both-way.
5. **How to move between course, implementation, and materials** — no listing surface.
6. **How portfolio and student feedback relate to teaching** — currently they are the only visible "teaching-adjacent" destinations, which conflates *reflection about teaching* with *actual teaching offerings*.

Bottom line: **Opetus lacks a coherent IA.** There is one real course-implementation page, correctly structured, but no path to discover it.

## 6. Canonical / data-flow map

### Course-page frontmatter (rich, structured)

`src/opetus/teknologiatuettu-oppiminen-2026-a.md` frontmatter carries this `course:` object:

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
  periodId: "2026-2027-a"          # ← CANONICAL PERIOD IDENTIFIER (page-scoped)
  peppiUrl: "https://opas.peppi.oulu.fi/…"
  teachingUnitLabel: Opettajankoulutus
  teachingStaff: [{name, responsibilities[], platform}, …]
  lectures:                         # ← EXPLICITLY ORDERED SESSION LIST
    - number: 1
      date: 2026-08-25
      time: "08:15–10:00"
      room: L2 Martti Ahtisaari
      title: Johdanto
      presentationPageUrl: /presentations/405040y-luento-1-johdanto-2026-a/
      recording: {url, label, note}
    - number: 2 …
    - number: 3 …
    - number: 4 (presentationPageUrl: null)
    - number: 5 (externalSpeaker: Kopiosto)
```

**Observations:**
- `periodId` is used as data on this page today (badge rendering, page copy), but it is **only local to this single course-page frontmatter**, not part of Canonical Content v1.
- `lectures[]` is an explicit ordered list with `number`, `date`, `time`, `room`, `title`, `presentationPageUrl`, `recording`. This IS a canonical sequence — but it lives on the course page, not on the individual presentations.
- Some `lectures[]` items have `presentationPageUrl: null` (not yet published) or an `externalSpeaker` (guest lecture with no local material).
- One-way link: course-page → presentation. The reverse (presentation → its course-implementation) is currently absent from canonical presentation data.

### Presentation-side `courseContexts[]` (Canonical Content v1 §Presentations type-specific)

Fields (verified from repo + DETAIL-UX-SEQUENCE-01 audit):

```
courseContexts[]:
  courseId
  courseName
  evidenceLevel      # "strong" | "contextual"
  linkType           # "explicit_course_code" | "explicit_course_name" |
                     # "probable_legacy_course_material" | "possible_reuse_of_course_material" |
                     # "contextual_topic_or_pathway"
  matchedTerms
  evidenceSummary
  courseSourceReferenceIds
```

**Observations:**
- `courseId` is the ONLY membership signal. No `periodId`, no `sessionIndex`, no back-link to course-page URL, no implementation identity.
- 405040Y has 3 presentation items, all with `explicit_course_code` linkType. Correct membership signal.
- 410014Y has 19 presentations across FIVE course periods (2011–2015). `courseId` alone cannot separate periods.
- 410017Y: 8 presentations across ~4 periods with parallel content series.
- Legacy `linkType`s (`probable_legacy_course_material`, `contextual_topic_or_pathway`) mark supplementary / historical reuse — not part of any single implementation's teaching material.

### Cross-check: does the course-page's `lectures[].presentationPageUrl` list already establish membership?

Yes, but ONE-WAY:
- Course-page 405040Y 2026-A: lectures 1, 2, 3 point to specific presentation URLs. Lectures 4, 5 have no presentation URL yet.
- Presentation 405040Y luento 1: `courseContexts[].courseId = 405040Y`. NOTHING on this presentation names the 2026-A implementation.

If a user reads a presentation detail page, they cannot canonically know which course-implementation they are inside without either:
- traversing all course pages to find one whose `lectures[].presentationPageUrl` matches, OR
- inferring from the title / URL slug.

## 7. Evidence from representative courses

### 405040Y

- Course-page: 1 file (`src/opetus/teknologiatuettu-oppiminen-2026-a.md`), 1 published period ("2026-2027-a").
- Presentations: 3 (`405040y-luento-1-johdanto-2026-a`, `405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a`, `405040y-luento-3-tekoalylukutaito-2026-a`).
- Course-page's `lectures[]` list has 5 sessions; 3 have `presentationPageUrl`, 2 do not.
- Coherence: strong. Single implementation, canonical ordering (course-page `lectures[].number`), canonical membership (course-page `lectures[].presentationPageUrl` list).

### 410014Y

- **No course page exists** (course-implementation page absent for 410014Y).
- 19 presentations spanning 2011–2015. Mixed linkTypes. Titles include "1. luento", "Luento 1", "Luento1", "410014Y Johdantoluento", "OSAAVA VESO", "TVT Oppimisen tukena" (SlideShare-only content).
- Without course-implementation pages per year, there is no canonical way to group these into implementations.
- **Historical/legacy content.** 410014Y course is old. Canonical claim: these are archived teaching materials that should be *discoverable* under Opetus but MUST NOT be presented as "current course structure".

### 410017Y

- **No course page exists.**
- 8 presentations across 2012–2015. Mixed content series ("Multimedia I–V" is one internal series; "Digitaalinen media oppimisessa" is another).
- Same historical/legacy status as 410014Y.

### Kempele VESO 2026

- **Not a course.** Continuing-education / VESO training day.
- `courseReview.status = rejected` on Canva projection → excluded from any course-scoped listing.
- Correct classification. IA MUST NOT treat VESO / täydennyskoulutus content as "course material" in the sense the university uses.

## 8. Proposed information architecture

Three-tier hierarchy justified by the evidence:

```
OPETUS (landing)
├── Nykyiset ja viimeaikaiset kurssit (course-implementation index)
│    ├── 405040Y Teknologiatuettu oppiminen ja työskentely (2026–2027 A) → single active implementation
│    └── (future implementations as they are added)
├── Aikaisemmat kurssit (archive / legacy)
│    ├── 410014Y Tieto- ja viestintätekniikka pedagogisena työvälineenä (historical materials 2011–2015, marked as archive)
│    ├── 410017Y Digitaalinen media oppimisessa ja opettamisessa (historical materials 2012–2015)
│    └── (other courseIds present in canonical data)
└── Aiheenmukaiset polut (topical entry points, optional — post-audit)
```

Adjacent (NOT under Opetus, distinct in nav):
- `/portfolio/` = **teaching portfolio** (evaluation, principles, CV). Answers *"how is teaching quality evidenced?"*.
- `/tyoni-yliopistonlehtorina/` = **profile page** for the wider university role. Answers *"what is my academic role?"*.

These three (Opetus / Portfolio / Työni) must be linkable to each other but must not be treated as substitutes for each other.

### Concept distinctions

| Layer | Definition | Canonical carrier today |
|---|---|---|
| **Course** | The unit identified by `courseId` (e.g. `405040Y`). Independent of who teaches it or when. | `courseContexts[].courseId` (presentation-side); `course.courseId` (course-page frontmatter). |
| **Course implementation / period** | A specific delivery of a course (e.g. 405040Y in period A of 2026–2027). Has its own schedule, staff, lecture list, room, Peppi URL. | `course.periodId` (course-page frontmatter only — NOT on presentations). |
| **Session / lecture** | A single meeting inside an implementation (Lecture 1, 2, 3…). Has date, room, presentation material (if any), recording. | `course.lectures[]` (course-page frontmatter only — NOT on presentations). |
| **Material / content** | Individual Presentation/Media/Publication resource. Reusable across implementations. Its own detail page. | `courseContexts[].courseId` (weak — courseId alone; missing period + session linkage). |

## 9. Is Canonical Content v1 sufficient?

**NO** — for the "course implementation / period" concept.

Canonical presentation data supports "course" (via `courseId`) but not "which implementation of that course". The DETAIL-UX-SEQUENCE-01 audit already documented this gap as blocking sequence UX. This audit re-establishes the same gap from an INDEPENDENT direction: even without any sequence UX, a coherent teaching IA needs to distinguish course implementations to correctly attribute materials.

### Semantic gap (canonical, presentation-side)

Missing on `courseContexts[]`:
- **`periodId`** (string, optional) — matches a course-page's `course.periodId`. Enables presentation → course-implementation linkage without heuristic date/URL inference.

Optional / follow-up (NOT required for IA-first slice):
- **`sessionIndex`** or **`lectureNumber`** — would enable sequence navigation. Explicitly NOT proposed here (DETAIL-UX-SEQUENCE-01 remains CLOSED).

### Independent canonical-content justification (satisfies sequence audit's reopen condition)

Reason for introducing `periodId` on `courseContexts[]`:
- Teaching IA needs to correctly attribute a presentation to a specific course implementation to render "Kurssitoteutuksen 2026-A materiaali" without heuristic inference.
- Historical/legacy 410014Y content (19 items, 5 periods) needs disambiguation to be presented as archive material without falsely claiming to be current course structure.
- Course-page frontmatter already uses `periodId` locally; extending it to the presentation-side is a symmetric completion of the existing model.

**This reason is independent of sequence UX.** IA needs implementation identity; sequence UX would be a further, gated question.

### Canonical schema changes are OUT OF SCOPE for this audit

Any decision to add `periodId` to Canonical Content v1 requires:
- its own audit + closure
- migration plan for existing presentations (backfill from course-page `lectures[].presentationPageUrl` reverse-lookup; explicit `null` for legacy materials that predate the canonical model)
- test coverage
- FI/EN parity check

## 10. FI / EN implications

- Course pages are **FI-only** today (course-page frontmatter: `translationKey: course_405040y_2026_a_fi_only`).
- `/portfolio/` and `/en/portfolio/` both exist (parity).
- `/tyoni-yliopistonlehtorina/` exists in FI; EN counterpart TBD (out of scope for this audit).
- Recommendation: **build IA in FI first**, add EN parity only after the FI IA has settled. Course content itself is generally taught in Finnish; EN course landing would announce that content is FI-scoped rather than translate the course frontmatter.

## 11. Navigation implications

Minimum change (IF implementation approved):
- Add a real link to `/opetus/` in the mega-menu "Opetus & portfoliot" section.
- Rename section heading to disambiguate teaching-offerings vs teaching-reflection: e.g. `"Opetus, portfolio ja työ"` with three sub-items (Opetus / Opetusportfolio / Työni yliopistonlehtorina).
- Remove the legacy `/opetus/` → `/tyoni-yliopistonlehtorina/` redirect. Replace with an actual Opetus landing page.

Legacy redirect handling:
- `src/legacy-redirects/opetus.njk` → REMOVE (replaced by real page).
- `src/legacy-redirects/opetus-teknologiatuettu-oppiminen-2026-a.njk` → KEEP (still valid legacy alias).

## 12. Deletion / simplification opportunities

If IA is implemented:
- `src/legacy-redirects/opetus.njk` becomes deletable (a redirect from a URL to itself makes no sense once `/opetus/` is a real page).
- Duplicate teaching-related copy in `/portfolio/`, `/tyoni-yliopistonlehtorina/`, and (future) `/opetus/` should be audited for factual drift — but that's a copy-editing task, not an IA task.
- Nothing else is safely removable without evidence.

## 13. Risks / falsification cases

1. **Backfilling `periodId` on legacy presentations is unreliable.** Solution: mark 410014Y / 410017Y presentations as `periodId: null` (or `periodId: "legacy"`) and render them under an "Aikaisemmat kurssit" archive section that explicitly labels them as historical materials without pretending to be a current implementation.

2. **Course-page ↔ presentation drift.** If a lecture's `presentationPageUrl` points to a slug that later moves, the linkage silently breaks. Mitigation: build-time verification (already partially covered by DETAIL-UX-01C-B-COURSE tests). Not in IA scope.

3. **VESO / continuing-education content leaks into Opetus.** Kempele-style VESO records have `courseReview.status = rejected` and no `courseContexts`. IA MUST use that exclusion signal. Do NOT introduce a broad fallback that would sweep VESO under "Opetus".

4. **Guest lectures without published material.** Course-page `lectures[]` items with `presentationPageUrl: null` or `externalSpeaker: …` must be rendered as list items without linking to a nonexistent material page.

5. **Scope creep to sequence UX.** OPETUS-IA-01 must not become DETAIL-UX-SEQUENCE-01. IA provides *structural* navigation (Opetus → course → implementation → session as list). Sequence UX would be an *ordered* prev/next within an implementation — separately gated and currently DEFERRED.

6. **Portfolio conflation.** Portfolio evaluates teaching; it is not the teaching structure. A visitor looking for a specific course should not have to read a pedagogical philosophy page first.

## 14. Smallest viable implementation path (IF approved)

**Slice IA-1 (SSR-only, no canonical extension yet):**

1. Build a real `/opetus/` landing page using only what already exists:
   - Enumerate courses from `src/opetus/**/*.md` files (each file is a course-implementation with rich `course:` frontmatter).
   - Group by `courseId`. Show each course's currently-available implementation(s).
   - Do NOT enumerate historical 410014Y/410017Y presentations yet (they lack course-implementation pages).
   - `/portfolio/` and `/tyoni-yliopistonlehtorina/` shown as related-but-distinct links at the end.
2. Replace `src/legacy-redirects/opetus.njk` with the new landing.
3. Add `/opetus/` link to mega-menu (as sibling to portfolio + työni, not a replacement).

**Slice IA-2 (SSR + minimal canonical extension — GATED on separate approval):**

4. Introduce `periodId` on `courseContexts[]` as a Canonical Content v1 extension (needs its own audit + closure).
5. Backfill 405040Y presentations with `periodId: "2026-2027-a"`.
6. Add a "Kurssitoteutuksen materiaali" section on course-implementation page that lists ALL presentations sharing `courseId + periodId` (in addition to the already-rendered `lectures[].presentationPageUrl` list).
7. Add on presentation detail pages a "Osa kurssitoteutusta X" reverse link (SSR, no JS).

**Slice IA-3 (archive surface — optional, separately audited):**

8. Add an "Aikaisemmat kurssit" section that surfaces courseIds present in canonical presentation data but lacking a course-implementation page (410014Y, 410017Y, others). Explicitly labels them as archived teaching materials without pretending to be current course structure.

Files affected by IA-1 (smallest slice):

- **New**: `src/opetus/index.njk` (or similar) — the real Opetus landing.
- **Remove**: `src/legacy-redirects/opetus.njk`.
- **Update**: `src/_includes/_nav-fi.njk` — add `/opetus/` link + reconsider "Opetus & portfoliot" section framing.
- **New tests**: `tests/opetus-ia-01.spec.js` — assertions on landing structure, course enumeration, portfolio/työni distinct links, legacy-redirect removal.
- **New closure**: `docs/opetus-ia-01-implementation-closure-YYYY-MM-DD.md`.

Estimated diff for IA-1: ~200–300 lines (landing template + nav update + tests + closure).

**Runtime JS added: 0.** SSR only.

## 15. Relationship to the deferred DETAIL-UX-SEQUENCE-01

- Sequence audit remains **CLOSED / DEFERRED / DOCUMENTED / MAIN**.
- Sequence audit's reopen condition: "canonical `coursePeriodId` / `sessionIndex` (or equivalent) may be introduced only for an INDEPENDENT canonical-content reason."
- This audit provides that independent reason for `periodId` **only** (not `sessionIndex`).
- `sessionIndex` is NOT justified by IA. Course-page `lectures[].number` already carries session order for the course-page rendering context. IA does not need `sessionIndex` on the presentation side.
- **DETAIL-UX-SEQUENCE-01 does NOT reopen** by shipping OPETUS-IA-01. If sequence UX is ever requested, it must satisfy its own reopen condition separately (and this audit does not do that).

## 16. Final decision

**CONDITIONAL GO for IA-1 (SSR-only landing + nav wiring, no canonical extension).**

**CONDITIONAL for IA-2 (canonical `periodId` extension) — GATED on separate schema-extension audit + closure.**

**NO decision for IA-3 (archive surface) at this time — separate future audit.**

Rationale:
- IA-1 delivers the user-facing IA fix without any canonical changes. It uses only what already exists in the course-page frontmatter and can be reviewed as a scoped UX + navigation slice.
- IA-2 addresses the fundamental data-model gap (presentation ↔ implementation linkage). Justified by IA needs, independent of sequence UX. But it's a canonical contract change — deserves its own audit + PR + closure.
- IA-3 requires curatorial work (deciding which historical courses to surface, how to label them) and is not needed to solve the immediate user-facing problem.

## 17. Bounded next workstream recommendation

**Exactly one:**

### OPETUS-IA-01-IMPL slice 1 — SSR Opetus landing + nav

Scope:
- Create real `/opetus/` landing page listing course implementations from `src/opetus/**/*.md`.
- Remove `/opetus/` legacy redirect.
- Wire `/opetus/` into the mega-menu "Opetus & portfoliot" section as a sibling of the portfolio + työni links (not a replacement).
- Regression tests covering: landing exists, enumerates 405040Y 2026-A, links to portfolio + työni without conflating them, legacy redirect removed, nav updated FI-side, JS-disabled works.

Out of scope for this slice:
- Canonical Content v1 changes.
- `periodId` addition to presentation-side courseContexts.
- Historical / archive course surface.
- Presentation → course-implementation reverse link.
- Sequence UX (remains DEFERRED).
- Any EN parity beyond confirming FI-first (Portfolio EN already exists).

Architecture Closure 1.0 status: expected to remain **CLOSED / GREEN / MAIN** after IA-1 (no canonical changes, no runtime JS, SSR-only).
