# COURSE-RELATION-UX-01 — Course-implementation relationship UX audit (2026-09-06)

## 1. Status

**AUDIT ONLY.** No production code changes, no schema changes, no commits, no PR. Awaiting explicit implementation authorization.

**Verdict: PARTIAL GO — combined slice A + C.** Recommend implementation-aware peer semantics (per-implementation grouping when `periodId` is present on both sides) AND a course-implementation backlink where a verified local course-implementation page exists. Fallback for periodId-less legacy content is retained with more cautious copy — no silent inference.

## 2. Repo baseline

- Branch: `audit/course-relation-ux-01` (local; not pushed)
- HEAD: `d1b9ba8801f8bb64959d57cd4fb9b707c8cb67fe`
- origin/main: `d1b9ba8801f8bb64959d57cd4fb9b707c8cb67fe`
- Main contains CANONICAL-COURSE-PERIODID-01 (PR #216).
- **Architecture Closure 1.0 = CLOSED / GREEN / MAIN** (unchanged).
- **Canonical Content v1 = extended** in §3 Presentations with optional `courseContexts[].periodId` (from PR #216).
- **DETAIL-UX-SEQUENCE-01 = CLOSED / DEFERRED / DOCUMENTED / MAIN** (unchanged; this audit does NOT reopen).

Docs consulted:
- `docs/canonical-course-periodid-01-closure-2026-09-06.md`
- `docs/opetus-ia-2-canonical-course-implementation-audit-2026-09-06.md`
- `docs/opetus-ia-01-closure-2026-09-05.md`
- `docs/detail-ux-01c-b-course-closure-2026-09-05.md`
- `docs/detail-ux-sequence-01-audit-2026-09-05.md`
- `docs/canonical-content-contract-v1.md` (§3 Presentations extended)
- `docs/architecture-closure-1-0-closure-2026-08-29.md`

## 3. Current SSR / data flow (verified against main)

### Peer selection

`src/presentations/presentations.11tydata.js` — `selectPeerPresentationsByCourse(data)`:

```js
function collectCourseIds(courseContexts = []) {
  return Array.from(new Set(
    (Array.isArray(courseContexts) ? courseContexts : [])
      .map((c) => c && c.courseId)
      .filter(Boolean)
  ));
}

function selectPeerPresentationsByCourse(data) {
  const currentCourseIds = collectCourseIds(getPresentationCourseContexts(data));
  // ...
  presentationLookup.forEach((record, pageUrl) => {
    // ...
    const peerCourseIds = collectCourseIds(peerContexts);
    const sharedCourseId = peerCourseIds.find((id) => currentSet.has(id));
    if (!sharedCourseId) return;
    // ...
  });
  peers.sort(/* date DESC, title ASC */);
  return peers.slice(0, PEER_LIMIT); // PEER_LIMIT = 6
}
```

- **Membership rule (today):** `courseId` match only. `periodId` **ignored** even when present on both sides.
- **Ordering:** date DESC → title ASC.
- **Cap:** 6.
- **Source:** `buildCanonicalPresentationPageLookup(data)` — fully resolved before eleventyComputed executes.

### Template rendering

`src/_includes/presentation-item.njk:167-188`:

```njk
{% if peerPresentationsByCourse and peerPresentationsByCourse.length %}
<section class="content-detail-course-peers" aria-labelledby="samalla-kurssilla-heading">
  <h2 id="samalla-kurssilla-heading" class="h5 fw-bold mb-3">
    {{ "On the same course" if currentLang == "en" else "Samalla kurssilla" }}
  </h2>
  {% set peerCourseId = peerPresentationsByCourse[0].courseId %}
  {% set peerCourseName = peerPresentationsByCourse[0].courseName %}
  <p class="text-muted small mb-3">
    {% if currentLang == "en" %}Other presentations from course {{ peerCourseId }}{% if peerCourseName %} — {{ peerCourseName }}{% endif %}.
    {% else %}Muut opintojakson {{ peerCourseId }}{% if peerCourseName %} — {{ peerCourseName }}{% endif %} esitykset.{% endif %}
  </p>
  <ul class="list-unstyled mb-0 d-grid gap-2">
    {% for peer in peerPresentationsByCourse %}
    <li class="course-peer-item">
      <a href="{{ peer.url }}" class="fw-semibold text-decoration-none d-block">{{ peer.title }}</a>
      …
    </li>
    {% endfor %}
  </ul>
</section>
{% endif %}
```

- Heading: **"Samalla kurssilla"** / **"On the same course"** — course-level phrasing.
- Descriptive line: **"Muut opintojakson {courseId} — {courseName} esitykset."** — implies a single implementation.

### Course-page ↔ Presentation linkage

`src/opetus/teknologiatuettu-oppiminen-2026-a.11tydata.js` already hydrates `course.lectures[].presentationPageUrl` into the canonical Presentation records via `buildCanonicalPresentationPageLookup(data)`. This is a one-way lookup: **course-page → Presentation**.

**No reverse-lookup helper exists today.** From a Presentation detail page there is no build-time way to name the course-implementation page it belongs to. A `Map<(courseId, periodId), { pageUrl, courseName, courseId, periodId }>` derived from `src/opetus/*.md` frontmatters would provide it; today the only course-implementation page is `teknologiatuettu-oppiminen-2026-a.md` (`courseId: 405040Y`, `periodId: "2026-2027-a"`, `permalink: /opetus/teknologiatuettu-oppiminen/2026-2027-a/`) → the reverse map would have exactly one entry.

## 4. Current "Samalla kurssilla" semantics — observed behaviour

### 405040Y (positive case)

`/presentations/405040y-luento-1-johdanto-2026-a/`:
- **2 peers rendered** (luento 2 + luento 3).
- Heading: "Samalla kurssilla".
- Copy: "Muut opintojakson 405040Y — Teknologiatuettu oppiminen ja työskentely esitykset."
- **Accuracy:** ACCURATE **by accident**. All three 405040Y presentations belong to the same course implementation (2026-2027-a) — the course-level peer group happens to coincide with the implementation-level peer group here. Neither the code nor the copy communicates this coincidence.

### 410014Y (falsification case — verified with real built HTML)

`/presentations/ss-1-luento-tieto-ja-viestintatekniikan-perusteet-opintojaksolla-tvt-opetuskayton-h/` (a 2011 lecture):
- **6 peers rendered** (PEER_LIMIT-capped).
- Heading: "Samalla kurssilla".
- Copy: "Muut opintojakson 410014Y — Tieto- ja viestintätekniikka pedagogisena työvälineenä esitykset."
- **Accuracy:** MISLEADING. The 6 peers span 2011–2015 across five parallel course implementations. Copy uses "opintojakson … esitykset" phrasing that implies the current implementation. A student arriving here from a 2011 lecture is offered a mix of 2011 / 2012 / 2013 / 2014 / 2015 material as if they belonged together.
- **Consequence:** the user cannot distinguish "material from the same delivery of this course" from "any historical material tagged with the same course code".

### Kempele (exclusion invariant)

`/presentations/kempele-veso-2026/`:
- No `courseContexts` in frontmatter, `courseReview.status = rejected` in Canva projection.
- Peer section correctly OMITTED. No backlink. No relationship UX.
- **Must remain unchanged** by any peer/backlink refactor.

## 5. User-facing problem

Three distinct problems arise from the courseId-only membership rule:

1. **Attribution ambiguity.** On implementation-aware content (405040Y today; any new period-scoped course tomorrow), the peer list happens to be correct but doesn't SAY it's implementation-scoped. Copy says "opintojakson X esitykset" whether the peers share the current implementation or not.
2. **Historical mixing.** On implementation-unaware content (410014Y, 410017Y), the peer list actively mixes distinct implementations under an implementation-implying heading. This is misleading.
3. **No return path.** A visitor on `/presentations/405040y-luento-1-…/` cannot navigate to `/opetus/teknologiatuettu-oppiminen/2026-2027-a/` without going through the sidebar's generic hub link + finding the course. The natural direct-relationship edge is invisible.

Problem (1) is a copy fix. Problem (2) is a semantic-rule fix. Problem (3) is a new component. All three benefit from the newly canonical `periodId`.

## 6. Course-level vs implementation-level relationship analysis

### Option A — courseId only (status quo)
- **Pro:** simplest; no code changes; preserves the current DETAIL-UX-01C-B-COURSE peer test invariants.
- **Con:** misleads on 410014Y-class historical content; doesn't leverage the new `periodId` at all.

### Option B — courseId + periodId (strict implementation-only)
- **Pro:** peers always belong to the same delivery.
- **Con:** 410014Y-class content (no `periodId`) would render zero peers, silently losing existing "browse other historical material for this course" navigation. Regression for a currently-useful (if imprecise) affordance.

### Option C — dual, in two separately labelled groups
- **Pro:** shows both "this implementation" and "same course across implementations".
- **Con:** doubles UI weight on a detail page that already carries direct relationships + context + discovery + orientation + return-to-origin sections. Adds section clutter. Doesn't help when only one axis is meaningful.

### Option D (recommended) — implementation-scoped when both sides carry `periodId`; course-scoped fallback when the current item lacks `periodId`
- **When current has `periodId`:** peers MUST match BOTH `courseId + periodId`. Heading "Samassa kurssitoteutuksessa". Copy names the implementation.
- **When current has no `periodId`:** peers match `courseId` only (current behaviour). Heading changes to acknowledge cross-implementation ambiguity, e.g. "Samalta opintojaksolta (kaikki vuodet)". Copy makes it explicit that materials may come from multiple implementations.
- **Peers with `periodId` that differs from current's `periodId`:** excluded. A 2013 lecture peer does NOT appear on a 2026 lecture's list.
- **Kempele:** unchanged (no `courseContexts` → no peer group).

Option D respects the "absence is meaningful" invariant from CANONICAL-COURSE-PERIODID-01: current-item without `periodId` remains fully served, but with copy that no longer implies implementation identity.

## 7. Fallback behavior for missing `periodId`

Explicit rules:

1. **Never infer** `periodId` from date, title, URL slug, topic, category, filename, or peer patterns.
2. **When the current item lacks `periodId`:** peer selection stays courseId-only. Heading and copy shift to make ambiguity visible.
3. **When the current item has `periodId` but a candidate peer lacks it:** candidate is EXCLUDED. This is intentional — a canonical implementation-scoped list must not mix in items whose implementation is unknown.
4. **When the current item has `periodId` and a candidate peer has a different `periodId`:** excluded.
5. **When the current item has `periodId` and no other item shares both `courseId + periodId`:** section omitted entirely (no "ei muita sisältöjä" placeholder — consistent with existing empty-state convention).

Falsification checks for the recommended rule against real data:

- **405040Y luento 1 today (post-CANONICAL-COURSE-PERIODID-01):** current has `periodId: "2026-2027-a"`; peers include luento 2 and luento 3 (both same courseId + periodId). Expected result: 2 peers. **Unchanged from today's count** — DETAIL-UX-01C-B-COURSE regression test `2 peers each` remains green.
- **410014Y ss-1-luento (any 2011–2015 record):** current has NO `periodId`. Fallback applies. Course-level peers as today, but with revised copy. Expected count: PEER_LIMIT-capped 6. **Unchanged** — DETAIL-UX-01C-B-COURSE regression `6 peers on 410014Y` remains green.
- **Kempele:** no `courseContexts` → no peer section. **Unchanged.**

## 8. Backlink feasibility

Data available at build time:

- `src/opetus/*.md` frontmatters carry `course.courseId`, `course.periodId`, `course.courseName`. Each file's Eleventy `permalink` is the course-implementation page URL.
- `_data` layer can read those files at build time (fs.readFileSync + simple YAML front-matter parse, mirroring `scripts/validate-course-period-id.js` `parseCoursePagePeriodIds()` pattern).

Build-time reverse-lookup helper (new, small):

```js
// _data/coursePages.js — new
// Returns { byCourseAndPeriod: Map<`${courseId}::${periodId}`, { pageUrl, courseName, courseId, periodId }>,
//           byCourseId: Map<courseId, [{ pageUrl, periodId, ... }, ...]> }
```

**Feasibility: YES.** No runtime JSON, no Pagefind dependency, no browser inference, no URL guessing, no canonical Course entity. The course-page frontmatter IS the authoritative source; the helper just indexes what already exists.

Coverage today: 1 entry (405040Y 2026-2027-a → /opetus/teknologiatuettu-oppiminen/2026-2027-a/). Grows automatically as future course-implementation pages are added.

## 9. Recommended UX wording (FI)

### Implementation-scoped peer group (current has `periodId`, ≥1 peer with same `courseId + periodId`)

- Heading: **"Samassa kurssitoteutuksessa"**
- Descriptive line: **"Muut kurssitoteutuksen {courseId} ({periodId}) materiaalit."**
  - Example: "Muut kurssitoteutuksen 405040Y (2026-2027-a) materiaalit."

### Course-level fallback (current lacks `periodId`, ≥1 peer with same `courseId`)

- Heading: **"Samalta opintojaksolta"**
- Descriptive line: **"Materiaaleja opintojaksolta {courseId} — {courseName}. Aineisto voi olla eri vuosien toteutuksista."**
  - Example: "Materiaaleja opintojaksolta 410014Y — Tieto- ja viestintätekniikka pedagogisena työvälineenä. Aineisto voi olla eri vuosien toteutuksista."

### Course-implementation backlink (current has `periodId`, matching course-implementation page exists)

- Rendered as a small standalone card or link block distinct from the peer list, e.g.:
  - **"Kurssitoteutus: {courseName} ({semesterLabel} · periodi {period})"** with a button/link **"Avaa kurssisivu"** → `/opetus/…/{periodId}/`.
  - Example: "Kurssitoteutus: Teknologiatuettu oppiminen ja työskentely (Syyslukukausi 2026 · periodi A)"

### EN handling

The current 405040Y course page is FI-only (`translationKey: course_405040y_2026_a_fi_only`). No EN course-implementation page exists.

- EN peer section headings should mirror the FI split with equivalent phrasing when EN presentations exist. However the current implementation-aware content (405040Y luentos) is FI-only content itself. **EN parity out of scope for this slice** — but do NOT regress the existing EN "On the same course" fallback rendering, and use `translationKey: teaching_fi_only`-style opt-outs for the FI-only backlink to prevent language-switch traps.

## 10. Recommended placement

Current DETAIL-UX-ORIENT-01 detail order:

```
IDENTITY
→ PRIMARY CONTENT
→ PRIMARY ACTION           (hero)
→ MAIN CONTENT             (content-prose)
→ ESSENTIAL METADATA       (Käyttöyhteys card: Paikka/Käyttöyhteys/Järjestäjä/…)
→ DIRECT RELATIONSHIPS     (content-detail-course-peers = today's Samalla kurssilla)
→ CONTEXT / DISCOVERY      (content-context-sidebar)
→ SITE ORIENTATION         (sidebar content-context-archive-link)
→ RETURN TO ORIGIN         (trailing footer, JS-revealed)
```

**Course-implementation backlink is a DIRECT canonical relationship** (Presentation → its course-implementation page is a specific, non-topical, non-orientational edge). It belongs INSIDE the DIRECT RELATIONSHIPS layer, immediately AFTER the peer group.

Suggested DOM order in `presentation-item.njk`:

```
… presentation-detail-support (Käyttöyhteys card, unchanged)
… content-detail-course-peers (peer group; heading + copy per §9)
… content-detail-course-implementation (NEW: backlink to /opetus/…)
… content-detail-related (existing content-context-sidebar)
```

The backlink is NOT SITE ORIENTATION (which is domain-hub scoped) and NOT RETURN-TO-ORIGIN (which is arrival-context scoped). It is a canonical peer edge.

## 11. FI / EN implications

- **FI:** all copy above is FI-first. EN parity added where surfaces exist.
- **EN:** the current 405040Y course page has no EN counterpart. The backlink section MUST NOT render on an EN presentation if the target course-implementation page is FI-only, unless the EN presentation content itself lives on the same URL.
- **Language-switch trap avoidance:** if EN presentations gain implementation-aware content later, backlink implementation must check the resolved course-page's `translationKey` or `lang` before rendering an EN-side link.

## 12. Deletion / simplification opportunities

If implementation-aware peers ship:

- The current `presentation-item.njk` peer-group `<p class="text-muted small">` descriptive line and the heading branch conditional simplify to a single dispatch on peer-group mode (implementation-scoped vs course-scoped fallback). Cleaner code path.
- No template deletion. Additive changes only.
- DETAIL-UX-01C-B-COURSE closure doc references the current heading text — it stays factually accurate for the fallback case; no doc rewriting needed for the closure itself, but the new closure should reference the semantic shift.

If backlink ships:

- No pre-existing structure is duplicated. Nothing safely deletable today (the reverse edge does not exist in any form).
- Future: if `/opetus/…/{periodId}/` course pages start enumerating their materials via a `(courseId, periodId)` reverse lookup (a future course-page enrichment slice), the course-page frontmatter `course.lectures[].presentationPageUrl` list COULD become derivable from Presentation-side `periodId` and made optional. Out of scope here.

## 13. Risks / falsification cases

1. **Silent inference temptation.** If someone later adds "if periodId is absent, guess from date range" that would violate the CANONICAL-COURSE-PERIODID-01 invariant. Mitigation: keep the fallback branch explicit + tested + commented.
2. **Peer count regression on 410014Y.** DETAIL-UX-01C-B-COURSE regression test asserts "6 peers on 410014Y". The recommended rule preserves this (410014Y items lack `periodId` → fallback branch → same courseId-only peers as today). If the rule changed to "always strict implementation", 410014Y would regress to zero peers. Recommendation: keep the test invariant; the rule change is copy + heading + optional backlink, not membership on the fallback path.
3. **DETAIL-UX-01C-B-COURSE test on 405040Y.** Test asserts "2 peers each". Under the recommended rule, luento 1 with `periodId=2026-2027-a` still finds luento 2 + luento 3 as peers (both same courseId + same periodId). Test remains green.
4. **Course page moves URL.** If a course page's permalink changes, the backlink would 404 silently unless build-time validation catches the drift. Mitigation: extend `scripts/validate-course-period-id.js` to also verify that every Presentation with `periodId` resolves to a live course-page URL, warning-only.
5. **Multiple course-implementation pages sharing `(courseId, periodId)`.** Should not happen (course pages are authoritative per implementation), but the reverse-lookup helper should assert uniqueness at build time — warn if two course pages declare the same `(courseId, periodId)`.
6. **EN language-switch to FI-only backlink.** Solved by conditionally rendering the backlink only when the course-page's language matches the current Presentation's language (or is explicitly allowed).

## 14. Architecture Closure 1.0 impact

**No AC1 reopen trigger.**

- Canonical Content v1: **unchanged.** All proposed changes are consumer-layer (templates + one build-time projection helper + one Presentation eleventyComputed). `periodId` is already canonical (PR #216).
- No source→canonical→projection layering change.
- No new abstraction. No new taxonomy. No new content type.
- SSR-first preserved. No runtime JS, no Pagefind course facets, no runtime JSON.

Default AC1 status remains **CLOSED / GREEN / MAIN**.

## 15. Explicit sequence non-impact

DETAIL-UX-SEQUENCE-01 remains **CLOSED / DEFERRED / DOCUMENTED / MAIN.**

This audit does NOT:
- Add `sessionIndex` or any ordering primitive.
- Implement prev/next.
- Sort peers as an ordered lecture sequence (peers stay date-DESC / title-ASC — presentation order, not sequence semantics).
- Reopen the sequence audit's closed decision.
- Turn `periodId` into a sequence identifier — `periodId` answers *"which implementation?"*, not *"which lecture in what order?"*.

Any future sequence-UX proposal must satisfy the sequence audit's own reopen condition (canonical evidence of unique session ordering per `(courseId, periodId)` set). This audit provides no such shortcut.

## 16. Final decision

**PARTIAL GO — combined slice A + C.**

Ship:
- Implementation-aware peer semantics with course-level fallback (Option D from §6).
- Course-implementation backlink where a verified local course-implementation page exists.
- Copy updates per §9.
- Small build-time reverse-lookup helper (`src/_data/coursePages.js` or equivalent).
- Extension of `scripts/validate-course-period-id.js` to also verify backlink resolvability (warning-only).

Do NOT ship in this workstream:
- `sessionIndex` (would reopen sequence audit).
- Prev/next controls.
- Second peer section for "same course, other implementations".
- Course-page enrichment listing all presentations (course-page-side change; separate audit).
- EN course-implementation page synthesis.
- Public JSON exposure of the backlink target.

## 17. Bounded next workstream recommendation

### COURSE-RELATION-UX-01-IMPL — Implementation-aware peer semantics + course-implementation backlink

Scope:
1. **New build-time helper** `src/_data/coursePages.js`: index `src/opetus/*.md` frontmatters by `(courseId, periodId)` into a Map. Uniqueness assertion at build time.
2. **Update** `src/presentations/presentations.11tydata.js`:
   - `selectPeerPresentationsByCourse` gains implementation-scoped mode when current has `periodId`. Falls back to courseId-only when current lacks `periodId`. Returns extra metadata (`mode: "implementation" | "course-fallback"`, `periodId | null`) for template dispatch.
   - New computed `courseImplementationBacklink`: resolves current item's `(courseId, periodId)` against the coursePages map. Returns `{ pageUrl, courseName, periodLabel } | null`.
3. **Update** `src/_includes/presentation-item.njk`:
   - Peer section heading + copy dispatched on `mode`.
   - New `<section class="content-detail-course-implementation">` block after peer section, rendered when backlink exists.
4. **Extend** `scripts/validate-course-period-id.js`: also cross-check backlink resolvability (warning-only).
5. **New spec** `tests/course-relation-ux-01.spec.js`:
   - 405040Y: 2 peers, mode=implementation, backlink to /opetus/teknologiatuettu-oppiminen/2026-2027-a/ visible.
   - 410014Y ss-1-luento: 6 peers (unchanged count), mode=course-fallback, no backlink.
   - Kempele: no peer section, no backlink.
   - Cross-implementation exclusion (once a hypothetical second 405040Y period ships — mockable via test fixture or gated on future data).
6. **Preserve** DETAIL-UX-01C-B-COURSE regression suite unchanged; it must remain green.
7. **New closure** `docs/course-relation-ux-01-closure-YYYY-MM-DD.md`.

Out of scope (would be separate future workstreams):
- Adding `sessionIndex` (DETAIL-UX-SEQUENCE-01 stays CLOSED).
- Course-page-side enrichment of a Presentation list derived from Presentation-side `periodId` (course-page workstream).
- EN course-implementation surface.
- Public JSON exposure of implementation backlinks.
- Historical periodId backfill for 410014Y / 410017Y.

Estimated diff: ~60 lines helper + ~30 lines computed changes + ~40 lines template markup + ~150 lines new spec + ~10 lines validator extension + ~100 lines closure doc = ~400 lines total.

Runtime JS added: **0**. SSR-only.

Architecture Closure 1.0 status after IMPL: expected to remain **CLOSED / GREEN / MAIN**. Canonical Content v1 unchanged.

**Await explicit implementation authorization before starting COURSE-RELATION-UX-01-IMPL. This audit stops here.**
