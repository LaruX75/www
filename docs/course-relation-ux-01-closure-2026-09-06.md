# COURSE-RELATION-UX-01 — closure (2026-09-06)

Adaptive Presentation course-relationship UX. Consumes the canonical
`courseContexts[].periodId` extension (CANONICAL-COURSE-PERIODID-01) so
the SSR peer section can distinguish "same course implementation" from
"same course, unknown implementation", and adds a direct-relationship
backlink to the local course-implementation page where a verified one
exists.

Additive, SSR-only. No public projection changes. Sequence UX stays
deferred.

## 1. Base

- Base SHA: `d1b9ba8801f8bb64959d57cd4fb9b707c8cb67fe` (origin/main after PR #216 merge)
- Branch: `feat/course-relation-ux-01`
- Audit reference: `docs/course-relation-ux-01-audit-2026-09-06.md`
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN** (unchanged)
- Canonical Content v1 = **unchanged**
- DETAIL-UX-SEQUENCE-01 = **CLOSED / DEFERRED / DOCUMENTED / MAIN** (unchanged; NOT reopened)

## 2. Adaptive peer semantics

`src/presentations/presentations.11tydata.js` — new `selectCoursePeerRelation(data)` helper. Returns:

```js
{
  mode: "implementation" | "course-fallback",
  courseId: string | null,
  periodId: string | null,       // null in fallback mode
  courseName: string,
  peers: [{ url, title, date, courseId, courseName, periodId }]
}
```

Rules:

- Anchor context = `getPrimaryCourseContext(currentContexts)` (evidence + linkType priority) or first context.
- If anchor has `periodId` → **implementation mode**: peers MUST share BOTH `courseId + periodId`. Peers with the matching `courseId` but different or absent `periodId` are excluded.
- If anchor has no `periodId` → **course-fallback mode**: peers match `courseId` only. Accepts peers with or without `periodId` (preserving DETAIL-UX-01C-B-COURSE behaviour for legacy content).
- Peer order: date DESC → title ASC (unchanged; presentation-list ordering, NOT sequence).
- Cap: `PEER_LIMIT = 6` (unchanged).
- Empty peer set → section omitted entirely (no placeholder text; unchanged convention).
- `periodId` is NEVER inferred (per CANONICAL-COURSE-PERIODID-01).

Backwards-compat shim: `selectPeerPresentationsByCourse(data)` continues to return the flat `peers[]` array via `selectCoursePeerRelation(data).peers`. The DETAIL-UX-01C-B-COURSE `peerPresentationsByCourse` computed remains available.

## 3. Fallback behavior (missing periodId)

Preserves DETAIL-UX-01C-B-COURSE peer counts on legacy records:

- 405040Y luento 1/2/3: **2 peers each** (unchanged count; now implementation-scoped by data).
- 410014Y ss-1-luento (2011 lecture): **6 peers** (unchanged count; course-fallback mode).
- 410017Y items: same fallback behaviour.
- Kempele VESO: no `courseContexts` → no peer section (unchanged).

No implementation membership is fabricated for periodId-less records. Copy explicitly names the ambiguity:

> "Materiaaleja opintojaksolta 410014Y — Tieto- ja viestintätekniikka pedagogisena työvälineenä. Aineisto voi olla eri vuosien toteutuksista."

## 4. Backlink lookup source

New build-time helper: `src/_data/coursePages.js`.

- Reads `src/opetus/*.md` frontmatter, parses top-level `permalink` and nested `course.courseId` / `course.periodId` / `course.courseName` / `course.semesterLabel` / `course.period` / `course.lang`.
- Indexes by `${courseId}::${periodId}` key.
- **Uniqueness guarded at build time:** duplicate `(courseId, periodId)` claims emit a `console.warn` and the first-seen entry wins. No silent shadowing.
- Serializable shape (plain object, not a `Map`) so Eleventy's data cascade can consume it.

New computed field on Presentation pages: `courseImplementationBacklink`. Resolves current item's `(courseId, periodId)` against `coursePagesIndex.byCourseAndPeriod`. Returns `{ pageUrl, courseId, periodId, courseName, semesterLabel, period, lang } | null`. Never inferred; never derived from date/title/URL.

Language-switch guard: template only renders the backlink when `courseImplementationBacklink.lang === currentLang` (or the safe FI default). Prevents an EN Presentation from linking to a FI-only course-implementation page.

Today's index size: **1** entry (405040Y 2026-2027-a → `/opetus/teknologiatuettu-oppiminen/2026-2027-a/`). Grows automatically as future course-implementation pages ship.

## 5. Domain behavior — verified against built site

| Case | Peer section | Peer count | Heading | Copy | Backlink |
|---|---|---|---|---|---|
| **405040Y luento 1** | `content-detail-course-peers--implementation` | 2 | "Samassa kurssitoteutuksessa" | "Muut kurssitoteutuksen 405040Y (2026-2027-a) materiaalit." | **shown** → `/opetus/teknologiatuettu-oppiminen/2026-2027-a/` |
| **405040Y luento 2** | same | 2 | same | same | same |
| **405040Y luento 3** | same | 2 | same | same | same |
| **410014Y ss-1-luento (2011)** | `content-detail-course-peers--course-fallback` | 6 | "Samalta opintojaksolta" | "Materiaaleja opintojaksolta 410014Y — Tieto- ja viestintätekniikka pedagogisena työvälineenä. Aineisto voi olla eri vuosien toteutuksista." | **not shown** (no periodId) |
| **410017Y-family record** | course-fallback | (as data) | fallback | fallback | **not shown** |
| **Kempele VESO** | omitted | — | — | — | not shown |

## 6. Placement

`src/_includes/presentation-item.njk` DOM order (unchanged apart from the two new blocks):

```
… presentation-detail-support (Käyttöyhteys card)
… <section class="content-detail-course-peers content-detail-course-peers--{mode}">
    peer section (adaptive heading + copy + list)
  </section>
… <aside class="content-detail-course-implementation">        ← NEW
    course-implementation backlink (only when resolved)
  </aside>
… <div class="content-detail-related content-detail-related--presentation">
    content-context-sidebar (unchanged)
  </div>
```

Backlink lives with DIRECT canonical relationships, between the peer group and the discovery sidebar. NOT in the hero action row. NOT in the trailing return-to-origin footer.

## 7. FI / EN handling

- **FI:** all new copy is FI-first with a matching EN alternative for any surface where EN presentations could exist.
- **EN:** the current 405040Y course page is FI-only (`translationKey: course_405040y_2026_a_fi_only`). The backlink's `lang` guard prevents an EN Presentation from linking to it. No `/en/opetus/` synthesis. No fabricated EN course metadata.
- Language-switch trap avoidance is a template-level check on `courseImplementationBacklink.lang === currentLang` (with a permitted FI fallback for the current FI-only reality).

## 8. Public JSON impact

**Zero.** `_site/data/presentations-page.json` verified: **0 `periodId` occurrences** (already stripped by the CANONICAL-COURSE-PERIODID-01 boundary helper in `src/data/presentations-page.json.11ty.js`). `courseContexts` still projected with its pre-existing shape.

## 9. JSON-LD impact

**Zero.** `_ldschema.njk` has zero `courseContexts` references; template adds no JSON-LD for the peer section or backlink.

## 10. Pagefind meta impact

**Zero.** No new `data-pagefind-meta` attributes. Peer section and backlink are ordinary SSR anchors; Pagefind indexes them as regular content unless the surrounding element has `data-pagefind-ignore`.

## 11. Runtime JS

**Zero.** All logic is build-time (Eleventy computed + Nunjucks). No new page-JS. No new runtime JSON fetch. Verified via `tests/course-relation-ux-01.spec.js` group G (`no runtime course-related JSON fetch`).

## 12. Canonical Content v1 impact

**Unchanged.** No schema changes. Consumes existing `courseContexts[].periodId` (added in PR #216 as an optional Type-Specific extension per §3 Presentations).

## 13. Architecture Closure 1.0 impact

**Zero. AC1 remains CLOSED / GREEN / MAIN.**

- No canonical core changes.
- No source→canonical→projection layering change.
- No new abstraction. No new taxonomy. No new content type.
- SSR-first preserved.

## 14. DETAIL-UX-SEQUENCE-01 impact

**Zero. Remains CLOSED / DEFERRED / DOCUMENTED / MAIN.**

This slice:
- Does NOT add `sessionIndex` or any ordering primitive.
- Does NOT implement prev/next.
- Does NOT sort peers as an ordered lecture sequence (peers stay date-DESC / title-ASC).
- Does NOT satisfy the sequence audit's reopen condition.
- `periodId` defines MEMBERSHIP scope only. It does not answer "what is the previous/next session?".

## 15. Files changed

**New:**
- `src/_data/coursePages.js` — build-time reverse-lookup helper for course-implementation pages.
- `tests/course-relation-ux-01.spec.js` — regression suite (22 tests across 9 groups A–I).
- `docs/course-relation-ux-01-audit-2026-09-06.md` — the audit that authorized this slice.
- `docs/course-relation-ux-01-closure-2026-09-06.md` — this file.

**Modified:**
- `src/presentations/presentations.11tydata.js` — adds `selectCoursePeerRelation` + `resolveCourseImplementationBacklink` helpers + two new computed fields (`coursePeerRelation`, `courseImplementationBacklink`).
- `src/_includes/presentation-item.njk` — adaptive peer section rendering (dispatched on `coursePeerRelation.mode`) + new `<aside class="content-detail-course-implementation">` backlink block.
- `scripts/validate-course-period-id.js` — extended to also report backlink resolvability (warning-only, exit 0).
- `tests/detail-ux-01c-b-course.spec.js` — updates two copy assertions to reflect the new adaptive copy (implementation-scoped on 405040Y; fallback phrasing on 410014Y). Peer counts unchanged.

## 16. Tests and measurements

- **New spec `tests/course-relation-ux-01.spec.js`: 22/22 green.** Groups A–I cover:
  - A: 405040Y implementation-scoped heading + copy + count.
  - B: backlink section resolves to the real course page.
  - C: 410014Y course-level fallback heading + cautious copy + preserved count.
  - D: 410017Y-family falsification (fallback, no backlink).
  - E: Kempele exclusion invariant preserved.
  - F: SSR-only render (peer section + backlink in JS-disabled HTML).
  - G: no runtime course-related JSON fetch.
  - H: public JSON unchanged (0 `periodId` occurrences).
  - I: DETAIL-UX-01C-B-COURSE `peerPresentationsByCourse` shim invariant remains.
- **Adjacent regression** (`course-relation-ux-01`, `detail-ux-01c-b-course`, `detail-ux-orient-01`, `detail-hero-01`, `opetus-ia-01`): **131/131 green.**
- `node scripts/validate-course-period-id.js`: 3 checked, 0 warnings, 3/3 backlink-resolvable.
- Eleventy build exit 0. Pagefind index regenerated.

## 17. Deletion / simplification

None in this slice. Additive. No pre-existing peer or backlink is duplicated. `course.lectures[].presentationPageUrl` on the course-page frontmatter remains authoritative for its own page's rendering — the Presentation-side backlink is a distinct semantic edge, not a duplicate.

Future opportunity (out of scope): once implementation-aware content grows, a course-page enrichment could derive its rendered materials list from Presentation-side `periodId` and reduce reliance on manual `lectures[].presentationPageUrl` maintenance. That would be its own audit + PR + closure.
