# DETAIL-UX-SEQUENCE-01 — audit (2026-09-05)

## 1. Status

**DEFERRED / NO-GO FOR GENERAL IMPLEMENTATION** (decision 2026-09-05).

The audit ran, evidence was gathered, and the decision is not to implement
sequence navigation on Presentation detail pages at this time. Canonical
Content v1 will NOT be extended for this UX feature.

**Audit evidence establishes:**
- `courseContexts[].courseId` alone does not prove sequence membership.
- 410014Y (19 items across 5 course periods 2011–2015) and 410017Y (8 items
  across ~4 periods with parallel "Multimedia I–V" and "Digitaalinen media"
  series) falsify general same-course sequencing.
- 405040Y is a valid isolated sequence candidate, but robust implementation
  would require canonical `coursePeriodId` + `sessionIndex` semantics that do
  not currently exist in the schema.
- Title parsing, Pagefind ordering and heuristic date ordering across
  courseId matches are REJECTED as authoritative sequence sources.

**Actions taken by this decision:**
1. Audit doc (this file) preserved as reference.
2. Canonical Content v1 unchanged. No schema extension.
3. No prev/next navigation implemented on Presentation detail (or any other
   detail domain).
4. Architecture Closure 1.0 remains **CLOSED / GREEN / MAIN**.

**Reopen condition:**

Revisit DETAIL-UX-SEQUENCE-01 only if canonical `coursePeriodId` /
`sessionIndex` (or equivalent course-period + session-order semantics) are
introduced into Canonical Content v1 for an **independent canonical-content
reason** — for example, to support a scoped course-page workstream that
needs to render a period's lecture set in canonical order. Do NOT introduce
those fields merely to enable this UX feature. The UX affordance follows the
data; the data does not follow the UX affordance.

The rest of this document is the original audit reasoning that produced the
verdict below.

---

**Original audit verdict: NO-GO for the general case. CONDITIONAL GREEN only for a narrowly-scoped course-period slice that needs a canonical schema extension first.**

## 2. Repo / branch / HEAD / origin/main

- Branch: `audit/detail-ux-sequence-01` (local; not pushed)
- HEAD: `adf43bc1cfb2676d15e408f225d78803eb169da0`
- origin/main: `adf43bc1cfb2676d15e408f225d78803eb169da0`
- Main contains PR #213 (DETAIL-UX-ORIENT-01) merge as expected.
- Architecture Closure 1.0 = **CLOSED / GREEN / MAIN**.
- Canonical Content v1 = unchanged.

Docs consulted:
- `docs/detail-ux-orient-01-closure-2026-09-05.md`
- `docs/detail-ux-orient-01-cross-domain-audit-2026-09-05.md`
- `docs/detail-ux-01c-b-course-closure-2026-09-05.md`
- `docs/course-page-01-405040y-2026-a-2026-09-03.md`
- `docs/canonical-content-contract-v1.md` (§Presentations type-specific extensions)
- `docs/architecture-closure-1-0-closure-2026-08-29.md`

## 3. Architecture guardrails

The four navigation layers must remain independent:

| Layer | Answers |
|---|---|
| PRIMARY ACTION | *What can I do with this content?* |
| SITE ORIENTATION | *Where does this content live on the site?* |
| RETURN TO ORIGIN | *Where did I come from and how do I get back?* |
| **SEQUENCE NAVIGATION** | *How do I move within the ordered whole this content is part of?* |

SEQUENCE NAVIGATION is NOT: search-result pagination, browser history, return-to-origin, domain hub navigation, "similar content", topical discovery, or arbitrary chronological ordering.

Non-negotiables for any implementation:
- Canonical Content v1 changes require a separate audit + closure.
- Pagefind cannot be a canonical sequence source.
- Content Graph cannot be a runtime dependency.
- No client-side sequence content model. If implementable, must be SSR.
- No `document.referrer`, no browser history, no title parsing as authoritative order.

## 4. Canonical `courseContexts` schema (verified from repo)

From an exhaustive grep of `src/presentations/*.md` frontmatter and cross-check against `canonical-content-contract-v1.md:110`, `courseContexts[]` items expose exactly these fields:

| Field | Type | Semantics |
|---|---|---|
| `courseId` | string (e.g. `"405040Y"`, `"410014Y"`) | Canonical course code — MEMBERSHIP key |
| `courseName` | string | Display name (`"Teknologiatuettu oppiminen ja työskentely"`) |
| `evidenceLevel` | `"strong"` \| `"contextual"` | Confidence of the course membership assertion |
| `linkType` | `"explicit_course_code"` \| `"explicit_course_name"` \| `"probable_legacy_course_material"` \| `"possible_reuse_of_course_material"` \| `"contextual_topic_or_pathway"` | Provenance of the match |
| `matchedTerms` | string[] | Tokens that produced the match |
| `evidenceSummary` | string | Free-form human-readable explanation |
| `courseSourceReferenceIds` | string[] | Provenance references (audit trail) |

**No `lectureNumber`. No `sessionIndex`. No `partOrder`. No `moduleIndex`. No `coursePeriod`. No `sequencePosition`.**

Top-level Presentation fields with any temporal / ordering meaning:
- `date` (YYYY-MM-DD) — canonical publication/presentation date
- `title` — free-form display string (may or may not contain "Luento N")
- `year` (derived from date)

**There is no canonical sequence-order field on Presentation.** Any ordering must be derived from `date` and/or `title` heuristics.

## 5. 405040Y evidence

All three items with `courseContexts[].courseId = 405040Y`:

| File | Title | Date | linkType | evidenceLevel |
|---|---|---|---|---|
| `405040y-luento-1-johdanto-2026-a.md` | "405040Y Luento 1: Johdanto (2026 A)" | 2026-08-25 | `explicit_course_code` | `strong` |
| `405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.md` | "405040Y Luento 2: Digitaalinen osaaminen vuonna 2026 – DigComp 3.0" | 2026-09-01 | `explicit_course_code` | `strong` |
| `405040y-luento-3-tekoalylukutaito-2026-a.md` | "405040Y Luento 3: Tekoälylukutaito" | 2026-09-03 | `explicit_course_code` | `strong` |

Observations:
1. Three distinct dates, ~1 week apart — chronologically clean.
2. All identify the SAME course period ("2026 A", encoded in title + `evidenceSummary`).
3. `evidenceSummary` includes "luento 1/2/3" markers, but these are free-form strings.
4. `explicit_course_code` on all three — clean membership signal.
5. Title-derived "Luento N" numbering matches date-ASC order.

**Conclusion for 405040Y in isolation:** Yes, a linear sequence. But this is a positive case; it does not generalize.

Q&A per audit prompt §3B:
1. **Muodostavatko nämä aidon lineaarisen sarjan?** Yes — 3 lectures, single course period.
2. **Todistaako canonical data järjestyksen?** Date ASC. Yes, but title-parsing would falsely appear to work too and is dangerous to bake in.
3. **Onko date ASC riittävä?** For this course period, yes. But `date` ASC breaks across multiple course periods (see §6).
4. **Tie-break saman päivämäärän tapauksessa?** No such case exists in 405040Y. Canonical data provides no deterministic tie-break — see §7 rejected strategies.
5. **Voiko title:sta päätellä järjestystä?** Only heuristically. `title` is display data.

## 6. 410014Y falsification test

19–20 items with `courseContexts[].courseId = 410014Y`, spanning **2011–2015** (5 course periods):

| Year cluster | Sample title | Date | linkType |
|---|---|---|---|
| 2011 (Fall) | "1. luento tieto- ja viestintätekniikan perusteet…" | 2011-08-31 | `probable_legacy_course_material` |
| 2011 (Fall) | "2. luento tieto- ja viestintätekniikan pedagogiset perusteet…" | 2011-09-01 | `probable_legacy_course_material` |
| 2011 (Fall) | "3. luento tieto- ja viestintätekniikan pedagogiset perusteet…" | 2011-09-07 | `probable_legacy_course_material` |
| 2011 (Fall) | "5. Luento tieto- ja viestintätekniikan pedagogiset perusteet…" | 2011-09-19 | `probable_legacy_course_material` |
| 2012 (Fall) | "Luento 1. Tieto- ja viestintätekniikka pedagogisena työvälineenä…" | 2012-08-30 | `explicit_course_name` |
| 2012 (Fall) | "Luento 2. Tieto- ja viestintätekniikan opetuskäyttö ja yhteiskunta…" | 2012-09-04 | `probable_legacy_course_material` |
| 2012 (Fall) | "Luento 3. Opetuksen uudet ympäristöt ja teknologiat…" | 2012-09-04 | `probable_legacy_course_material` |
| 2012 | "TVT Oppimisen tukena (ääni ei ole synkassa…)" | 2012-10-09 | `probable_legacy_course_material` |
| 2013 (Fall) | "Luento1. Johdanto (410014Y TVT pedagogiset perusteet)" | 2013-08-27 | `probable_legacy_course_material` |
| 2013 (Fall) | "Luento 2. Teoria (410014Y)…" | 2013-08-29 | `explicit_course_code` |
| 2013 (Fall) | "Luento 3. Suunnittelu ja pedagogiset mallit (410014Y)…" | 2013-09-04 | `explicit_course_code` |
| 2014 (Fall) | "410014Y Johdantoluento" | 2014-08-29 | `explicit_course_code` |
| 2014 (Fall) | "410014Y LUENTO 2 Tämän vuosisadan ydintaidot…" | 2014-08-29 | `explicit_course_code` |
| 2014 (Fall) | "410014Y Luento 4 Sopimukset ja tekijänoikeudet" | 2014-09-03 | `explicit_course_code` |
| 2015 (Fall) | "Tieto ja viestintätekniikka pedagogisena työvälineenä. luento 1" | 2015-08-31 | `explicit_course_name` |
| 2015 (Fall) | "OSAAVA VESO — 410014Y — Raahe 2015" | 2015-10-10 | (VESO — not a lecture) |

Falsifications this data proves:

1. **`courseId` alone ≠ sequence membership.** 410014Y has FIVE parallel course-period sequences (2011/2012/2013/2014/2015 fall terms), each conceptually its own ordered lecture set.
2. **`date` ASC across all `courseId` matches produces nonsense navigation.** A user arriving on the 2013 Luento 1 would get 2011 Luento 5 as "previous" and 2013 Luento 2 as "next" — semantically incoherent.
3. **`linkType` filtering does not rescue this.** Filtering to `explicit_course_code` still yields multiple periods (2013, 2014 exclusively).
4. **Same-date ties exist** (2014-08-29 Luento 1 + Luento 2; 2012-09-04 Luento 2 + Luento 3). Date ASC alone is not deterministic; canonical data offers no deterministic tie-break.
5. **Non-lecture content shares the same `courseId`.** "OSAAVA VESO 2015" is a supplementary VESO training reusing the 410014Y course material. Not a lecture in the pedagogical sequence.
6. **Title-derived "Luento N" parsing is unreliable.** Titles include: `"1. luento"`, `"Luento 1"`, `"Luento1."`, `"410014Y Luento 4"`, `"410014Y Johdantoluento"` (no number), `"TVT Oppimisen tukena"` (no lecture number at all), `"OSAAVA VESO"` (not a lecture).

## 7. Other courseIds surveyed (further falsification)

Distribution across `src/presentations/*.md`:

| courseId | Count | Period span | Sequence coherence |
|---|---|---|---|
| 410014Y | 19 | 2011–2015 | NO — 5 parallel periods |
| 410017Y | 8 | 2012–2015 | NO — 4 parallel periods (also contains "Multimedia I–V" title sequence AND "Digitaalinen media" title sequence) |
| 405040Y | 3 | 2026 (A only) | YES — single period |
| 418028P | 2 | 2019 | Ambiguous — 2 items, `contextual_topic_or_pathway` linkType |
| 413315S-01 | 1 | — | N/A — single item |
| 413314S | 1 | — | N/A |
| 407062A | 1 | — | N/A |
| 405021Y | 1 | — | N/A |
| 050091A | 1 | — | N/A |

**Only 405040Y currently satisfies "same course + single period + ordered set" without heuristic inference.**

## 8. Kempele exclusion test

`kempele-veso-2026.md` frontmatter contains NO `courseContexts` (verified: `grep -c "courseContexts" src/presentations/kempele-veso-2026.md` = 0). Canva projection (`canva-presentations.json`) sets `courseReview.status = "rejected"`. Any implementation gated on `courseContexts[].courseId` correctly excludes Kempele — no sequence navigation. No topic/category/title fallback would introduce Kempele either.

Invariant confirmed: no broad-fallback / title-inference / taxonomy-derived membership. Kempele stays excluded.

## 9. Ordering-strategy evaluation

| # | Strategy | Verdict | Rationale |
|---|---|---|---|
| 1 | Explicit canonical order field (e.g. `sessionIndex`, `lectureNumber`) | ACCEPTABLE (canonical) but **DOES NOT EXIST TODAY** | Would need Canonical Content v1 extension — outside this audit scope |
| 2 | `date` ASC | CONDITIONAL | Works within a single course period (405040Y case). Falsified across periods (410014Y case). Not deterministic when same-date ties exist. Requires prior period bounding. |
| 3 | `date` + `title` tie-break | REJECTED (as authoritative) | Title is display data. Same-date items may not be sortable by title in a semantically meaningful way. |
| 4 | Title-derived "Luento N" parsing | REJECTED | Titles are inconsistent (`"1. luento"`, `"Luento 1"`, `"Luento1"`, `"Johdantoluento"`, no number at all). Parsing amounts to heuristic content classification, not canonical structure. |
| 5 | File order / source order | REJECTED | Filesystem ordering is an implementation accident; not user-meaningful. |
| 6 | Pagefind order | REJECTED | Pagefind is a discovery/search surface, not a canonical structure source. |
| 7 | Content Graph relation order | REJECTED | Content Graph is a modeling/verification tool, not a runtime source (R1 ADR1). |

Additional strategies considered:
- **`courseSourceReferenceIds` provenance ordering** — REJECTED. These are provenance audit tokens, not sequence positions.
- **`evidenceSummary` free-text parsing** — REJECTED. Same class as title parsing. Not canonical structure.

**Bottom line:** without a canonical `coursePeriodId` (or equivalent) + a canonical `sessionIndex`, no combination of existing fields produces a defensible sequence for the 410014Y-class cases. 405040Y works only because it accidentally has exactly one course period and no same-date ties.

## 10. Sequence eligibility rule (draft — CONDITIONAL only)

If a future implementation is authorized AFTER canonical schema extension:

- **Membership:** `courseContexts[].courseId` MATCHES current item's `courseId` AND same `coursePeriodId` (canonical, not yet in schema) AND `linkType` is one of `{explicit_course_code, explicit_course_name}` (excludes legacy/possible-reuse from the sequence).
- **Ordering:** ASC by canonical `sessionIndex` field (not yet in schema). If sessionIndex is absent, fall back to `date` ASC only when all items in the set share a single period.
- **Tie-break:** None — canonical data must guarantee uniqueness of the ordering key per set.
- **Boundary:** first item shows only Next; last shows only Previous; middle shows both. **No wrap-around.**
- **Exclusion:** items where `courseReview.status = "rejected"` (already applied by canonical projection). Items with `linkType ∈ {probable_legacy_course_material, possible_reuse_of_course_material, contextual_topic_or_pathway}` excluded regardless of matching courseId.

**Without the canonical schema extension, the rule cannot be safely implemented for the general case. 405040Y-only implementation is possible today but sets a precedent for baking heuristics into the codebase — REJECTED as a shortcut.**

## 11. UX placement recommendation (IF implemented)

Inserting SEQUENCE NAVIGATION into the DETAIL-UX-ORIENT-01 rendering order:

```
IDENTITY
↓ PRIMARY CONTENT
↓ PRIMARY ACTION                        (hero-actions)
↓ MAIN CONTENT                          (content-prose)
↓ ESSENTIAL METADATA / CONTEXT          (Käyttöyhteys / Paikka / Järjestäjä)
↓ DIRECT RELATIONSHIPS                  (Samalla kurssilla — course peers, unordered)
↓ **SEQUENCE NAVIGATION**              ← proposed placement
↓ TOPICAL DISCOVERY                     (sidebar Katso myös / Selaa samaa aineistoa)
↓ SITE ORIENTATION                      (sidebar content-context-archive-link)
↓ RETURN TO ORIGIN                      (trailing content-detail-origin footer)
```

Rationale:
- Sequence is a stronger relationship than topical discovery (semantic linkage vs. probabilistic).
- Sequence belongs after direct relationships because "same course" is a broader relationship than "next in course" — user has already been told "these are your peers" and can now step through them in order.
- Site orientation and return-to-origin remain the trailing layers; sequence should not compete with them.

Do NOT place sequence in the hero-actions row. That would violate DETAIL-UX-ORIENT-01's invariant of "hero-actions row hosts only true primary actions".

Do NOT collapse sequence into the "Samalla kurssilla" section. They answer different questions:
- Samalla kurssilla = "which other lectures share this course?"
- Sequence = "which is the previous/next lecture in reading order?"

## 12. FI / EN labeling

Preferred (destination-aware):

FI:
```
← Edellinen: 405040Y Luento 1: Johdanto
Seuraava: 405040Y Luento 3: Tekoälylukutaito →
```

EN (if EN Presentation detail routes exist — currently FI-only per O1 closure):
```
← Previous: 405040Y Lecture 1: Introduction
Next: 405040Y Lecture 3: AI Literacy →
```

Considerations:
- Full destination title in link text (accessibility gain).
- Length cap ~80 chars (align with DETAIL-UX-ORIENT-01 return-label sanitizer). Truncate with ellipsis if longer.
- `aria-label` on each anchor if title is truncated visually (`aria-label="Previous: <full title>"`).
- Mobile: stacking layout with clear visual separator; do not truncate below `~40` chars on narrow viewport.
- Screen reader order: previous first, then next (matches reading direction in FI/EN).

**No `nav[aria-label]` wrapper needed if placed inside an existing named region.** If a distinct region is used, `nav aria-label="Sequence navigation"` / `"Jaksonavigaatio"`.

## 13. SSR implementation feasibility

If canonical schema is extended AND membership+ordering rule is settled, SSR is straightforward:

**Data source:**
- Same as DETAIL-UX-01C-B-COURSE peer selection: `buildCanonicalPresentationPageLookup(data)`. Already fully resolved before `eleventyComputed` runs.

**Build-time helper** (new, analogous to `selectPeerPresentationsByCourse`):
- `selectSequenceForPage(data)` → `{ courseId, coursePeriodId, previous: {url, title, date} | null, next: {url, title, date} | null, currentIndex, totalCount }`
- Runs in `src/presentations/presentations.11tydata.js` `eleventyComputed`.
- Iterates canonical projection, filters to same `courseId` + same `coursePeriodId`, sorts by canonical `sessionIndex`, finds current item, returns neighbors.

**Template addition** (in `src/_includes/presentation-item.njk`):
- New `<nav class="content-detail-sequence" aria-labelledby="…">` placed after `content-detail-course-peers` section and before `content-detail-related`.
- Renders `previous` / `next` anchors from computed data.
- Conditional on `sequenceInfo.previous || sequenceInfo.next`.

**Runtime JS:** 0. All SSR.

**No new abstraction beyond one helper + one template block.** Canonical projection already loaded. Content Graph untouched.

If SessionIndex canonical field is NOT introduced, the 405040Y-only "date ASC within same course, only when count ≤ N with strong linkTypes" implementation is technically possible but risks the same class of drift the current audit falsifies: it works accidentally for one course and would break silently on future data.

## 14. Deletion / simplification opportunities

If sequence is implemented and canonical `coursePeriodId` + `sessionIndex` land:

- `Samalla kurssilla` peer list on `presentation-item.njk` (`content-detail-course-peers` section) MAY become redundant when a full ordered sequence exists → could collapse the peer list into a compact "N of M in sequence" indicator. Requires separate UX review.
- Course-page (`/opetus/405040y/...`) currently maintains its own lecture list — if canonical sequence exists, that page could consume the same helper.

Without canonical schema extension: nothing safely removable.

## 15. Test plan (for a future implementation slice)

### A. Membership
- 405040Y course-period 2026-A: exactly 3 items in sequence.
- Rejected course context (Kempele) → no sequence markup on page.
- Item with only `linkType = probable_legacy_course_material` for a courseId → NOT included in sequence for other items with `explicit_course_code`.

### B. Order
- First item (Luento 1): only Next visible, points to Luento 2.
- Middle item (Luento 2): both Previous (Luento 1) and Next (Luento 3).
- Last item (Luento 3): only Previous visible.
- No wrap-around.
- Deterministic tie-break (if implemented): identical `sessionIndex` values MUST NOT exist within a single set; test asserts uniqueness.

### C. Semantics — falsification guards
- 410014Y detail (any year): NO sequence rendered until canonical schema separates course periods. Regression guard against silent "date ASC across all courseId matches" implementation.
- 410017Y detail: same guard.
- Kempele: no sequence.
- No taxonomy-derived membership.
- No title-parsed order.
- No Pagefind dependency (grep `sequence`-related code paths for `pagefind` references).

### D. UX
- FI labels: "Edellinen: <title>" / "Seuraava: <title> →".
- EN parity (if EN routes exist).
- Boundary states rendered correctly.
- No visual duplicate with `Samalla kurssilla`, `content-context-archive-link`, or return-to-origin footer.
- Truncated title has `aria-label` with full text.

### E. Architecture
- SSR output exists with `javaScriptEnabled: false`.
- No runtime JS added (grep new spec doesn't touch `src/js/`).
- Canonical Content v1 changes require a separate PR + closure — audited independently.

### F. Regression (DETAIL-UX-01C-B-COURSE + DETAIL-UX-ORIENT-01 invariants)
- Samalla kurssilla peer count unchanged on 405040Y (still 2 peers per lecture).
- Kempele Paikka / Käyttöyhteys / Järjestäjä rows unchanged.
- Thumbnail hero aside unchanged.
- Publication DOI unchanged (protected metadata).
- Blog card-footer stays removed.
- Return-to-origin trailing footer unchanged.
- Sidebar `content-context-archive-link` unchanged.

## 16. Risks

1. **Silent expansion:** Once "sequence for 405040Y" ships, pressure will grow to enable sequence for 410014Y / 410017Y without solving the period-separation problem. Mitigation: only ship after canonical schema extension.
2. **Title-parsing precedent:** If we accept `"Luento N"` parsing as canonical, future data authors will assume this is a contract. Mitigation: REJECT title parsing outright in code review.
3. **Cross-domain expansion:** "Sequence for publications in a series" or "sequence for theses" would require separate audits — must not be added silently under DETAIL-UX-SEQUENCE-01.
4. **Interaction with Samalla kurssilla:** Users may perceive redundancy if both render. Mitigation: UX review during implementation, potentially collapse peer list into sequence position indicator.
5. **Data quality regression:** New content lacking canonical sessionIndex silently disappears from sequence. Mitigation: build-time warning + test coverage on missing-field cases.

## 17. Final decision

**NO-GO for the general case.**
**CONDITIONAL GREEN for 405040Y-only, gated on prior canonical schema extension (`coursePeriodId` + `sessionIndex`).**

Rationale:
- Canonical data proves sequence membership+order for 405040Y (single course period).
- Canonical data explicitly FALSIFIES the same rule for 410014Y (5 parallel periods) and 410017Y (4+ periods).
- No canonical field exists today to separate course periods within a single `courseId`.
- Ordering must be canonical-proven; no title parsing, no Pagefind, no heuristic inference.
- Shipping 405040Y-only implementation without canonical schema extension would either (a) require hardcoding a courseId whitelist, or (b) silently break on future data.

### If GREEN implementation is later approved

**Prerequisite (separate audit + PR):**
Extend Canonical Content v1 Presentations type-specific `courseContexts[]` schema with:
- `coursePeriodId` (string, optional, e.g. `"2026-A"`, `"2013-fall"`) — separates parallel course-period sequences under the same `courseId`.
- `sessionIndex` (integer, optional) — canonical order position within a period. Uniqueness required per `(courseId, coursePeriodId)` set.

**Smallest implementation slice AFTER schema extension:**

Files that would change:
1. `src/presentations/presentations.11tydata.js` — add `selectSequenceForPage(data)` helper + `sequenceInfo` computed field (~40 lines).
2. `src/_includes/presentation-item.njk` — add `<nav class="content-detail-sequence">` block after `content-detail-course-peers` and before `content-detail-related` (~15 lines).
3. `tests/detail-ux-sequence-01.spec.js` — new spec covering §15 test plan (~150 lines).
4. `src/_data/presentationsPage.js` — route `coursePeriodId` + `sessionIndex` through `buildCanonicalPresentationPageRecords` (~4 lines).
5. `docs/detail-ux-sequence-01-implementation-closure-YYYY-MM-DD.md` — new closure.

No CSS additions required (Bootstrap flex + existing utility classes).
No JS additions.
No new abstraction layers.

## 18. Architecture Closure 1.0 status

**CLOSED / GREEN / MAIN.** This audit does not open AC1. The recommended action (or non-action) is a canonical-schema question that would need its own gated audit + PR + closure sequence.

## 19. Canonical Content v1 status

**Unchanged.** This audit explicitly identifies the canonical schema gap (`coursePeriodId` + `sessionIndex`) but does not close it. Any decision to extend the canonical contract requires a separate workstream.
