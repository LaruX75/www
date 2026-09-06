# PEPPI-BROWSER-CURATION-01 - browser curation proof of concept

Date: 2026-09-06
Status: `POC COMPLETE`
Verdict: **GO - DEV-ONLY BROWSER CURATION TOOL**

## 1. Repo baseline and handover state

- Handover branch and `origin/main`: `main` at `3b0941b07a0bc7955a995dd3681dd05f817d5839`.
- The handover worktree contained Claude Code's uncommitted crawler, the
  `audit:peppi` script entry, and generated audit outputs. They were
  preserved unchanged while creating `codex/peppi-browser-curation-01-poc`.
- This POC adds developer tooling and evidence only. It does not alter
  canonical course or presentation content.

## 2. Why browser crawling was tested

`docs/peppi-api-suitability-01-audit-2026-09-06.md` established that direct
standalone API probes are not a supported integration path: public browser
pages are an Angular SPA and simple API clients do not receive the same useful
data. The question here was narrower: can the normal public browser context
produce auditable evidence for a very small, human-reviewed course curation
workflow?

## 3. Relation to SlideShare tooling

The precedent is architectural rather than an implementation template:

```text
public external source -> developer audit/import evidence -> human review -> later canonical curation
```

The existing SlideShare scripts gather external source evidence before a human
curates local content. This Peppi tool follows that separation. It does not
copy the SlideShare production flow, fetch during a site build, or create
canonical records automatically.

## 4. Browser crawler architecture

`scripts/audit-peppi-courses.js` launches one headless Playwright Chromium
session, visits exact public study-guide URLs, observes only the browser's own
Peppi responses, extracts visible DOM evidence, and writes files below
`outputs/peppi-browser-curation/`.

It is manual-only through:

```text
npm run audit:peppi
```

It is not referenced by the build scripts, CI, runtime JavaScript, Pagefind,
or public JSON producers.

## 5. Tested courses and years

The probe plan is intentionally fixed and small:

| Course | Study-guide years | Navigation |
| --- | --- | --- |
| `405040Y` | `2026-2027` | known current direct course URL |
| `410014Y` | `2011-2012` through `2015-2016` | exact-code public search, then one found link |
| `410017Y` | `2011-2012` through `2014-2015` | exact-code public search, then one found link |

No catalog-wide crawling was performed.

## 6. Navigation and selector strategy

The crawler uses normal public routes. Historical searches use
`/fi/haku/{courseCode}?period={studyGuideYear}` and follow at most one matching
course link. It waits for Angular's non-loading root, then for the exact
course-specific browser API response. For the current direct course, it also
waits for a visible realization row matching `{courseCode}-{implementation}`.

DOM extraction is deliberately shallow: visible course code, credits, headings,
realization text, links, and common labelled fields. Network observation is
kept as audit evidence, not treated as a stable API contract.

## 7. SPA-rendering behavior

The first handover implementation could classify before Playwright's
asynchronous response-body readers had finished. The final crawler tracks and
awaits those readers before classification. It also begins waiting for the
relevant response before navigation, so fast Angular requests are not missed.

Historical follow pages consistently render a small (`624` character) SPA
surface. That is not treated as a generic rendering failure: their observed
course-detail request has an explicit `404`, while the preceding search's
`COURSE_UNIT` request is `200`.

## 8. Browser network observations

The browser context observed successful public frontend requests to
`opasbe.peppi.oulu.fi`, including:

- `GET /api/course/28004?period=2026-2027` -> `200` for current `405040Y`.
- `GET /api/realizations/course/28004?period=2026-2027` -> `200` for its
  visible current implementations.
- `GET /api/lu/units/410014Y/COURSE_UNIT?period=YYYY-YYYY` -> `200` for each
  tested historical year.
- `GET /api/lu/units/410017Y/COURSE_UNIT?period=YYYY-YYYY` -> `200` for each
  tested historical year.
- `GET /api/course/3213?period=YYYY-YYYY` and
  `GET /api/course/3216?period=YYYY-YYYY` -> `404` in their corresponding
  historical follow-up contexts.

This demonstrates how the public frontend works today. It is not proof of a
documented, stable, or supported third-party API.

## 9. Extracted field model

The audit output keeps the raw probe URL/status, rendering status, visible DOM
summary, and bounded response previews. Optional local screenshots are
captured only with `PEPPI_SCREENSHOTS=1`. The pure parser adds:

- historical `courseUnitId`, Finnish/English names, and type;
- an explicit implementation-detail status;
- deduplicated visible current implementation codes and date ranges.

Missing data stays missing; the parser never guesses a period, implementation,
or relationship.

## 10. 405040Y exact result

`405040Y` is a `FOUND` current course in study-guide year `2026-2027`.
Browser-visible data gives code `405040Y`, `4 op`, and these implementation
identities:

| Implementation | Visible name / date evidence |
| --- | --- |
| `405040Y-3021` | Teknologiatuettu oppiminen ja työskentely: Psyka, Opti, Kako, Muka; `25.08.2026 - 08.10.2026` |
| `405040Y-3022` | Teknologiatuettu oppiminen ja työskentely, VaMo ja Vaka Momu 1EF; `27.08.2026 - 27.11.2026` |
| `405040Y-3023` | Teknologiatuettu oppiminen ja työskentely, Luko ja ELO; `29.10.2026 - 09.12.2026` |
| `405040Y-3024` | Teknologiatuettu oppiminen ja työskentely, VAKA kevät 2027; `01.01.2027 - 09.05.2027` |

Course identity: **PROVES**. Current implementation identity: **PROVES**.

## 11. 410014Y exact result

Every tested historical guide year (`2011-2012` to `2015-2016`) returns one
official course unit:

| Field | Value |
| --- | --- |
| Course code | `410014Y` |
| Course unit ID | `3213` |
| Finnish name | Tieto- ja viestintätekniikka pedagogisena työvälineenä |
| English name | Information and communication as a pedagogical tool |
| Course-unit request | `200` |
| Historical course-detail request | `404` |

Historical course identity: **PROVES** for the tested study-guide years.
Historical implementation identity: **DOES NOT PROVE**.

## 12. 410017Y exact result

Every tested historical guide year (`2011-2012` to `2014-2015`) returns one
official course unit:

| Field | Value |
| --- | --- |
| Course code | `410017Y` |
| Course unit ID | `3216` |
| Finnish name | Digitaalinen media opetuksessa ja oppimisessa |
| English name | Digital Media in Teaching and Learning |
| Course-unit request | `200` |
| Historical course-detail request | `404` |

Historical course identity: **PROVES** for the tested study-guide years.
Historical implementation identity: **DOES NOT PROVE**.

## 13. Historical coverage

Coverage is evidence of course-unit presence and official naming in the listed
study-guide years only. It is not evidence that every named course had one
implementation, a particular realization group, a particular teaching period,
or a one-to-one mapping to local presentation clusters.

## 14. Course identity versus implementation identity

| Course | Course identity | Implementation identity |
| --- | --- | --- |
| `405040Y` current | **PROVES** | **PROVES** |
| `410014Y` historical | **PROVES** | **DOES NOT PROVE** |
| `410017Y` historical | **PROVES** | **DOES NOT PROVE** |

The distinction is enforced in the crawler status
`COURSE_UNIT_FOUND_NO_IMPLEMENTATION_DETAIL` and in the pure parser tests.

## 15. Parser and output robustness

`tests/unit/peppiAuditParser.test.js` uses static response fixtures only. It
covers exact unit normalization, period mismatch/malformed JSON rejection,
missing historical implementation detail, and duplicate realization rows.
There is no live Peppi test in normal CI.

The versioned outputs are JSON, Markdown, and network summary. Screenshots are
optional local evidence (`PEPPI_SCREENSHOTS=1`) and are not committed because
the bounded run produces large PNG files. A CSV would repeat the same
one-to-many probe evidence without adding review value, so it is intentionally
not produced.

## 16. Failure modes

- Angular can render a short shell before relevant course content is ready.
- Public frontend requests may change without notice.
- Historical course unit metadata can exist while current-style course detail
  does not.
- DOM labels and CSS component names are implementation details.
- A successful browser-observed request does not establish API support.

Any future failure must result in `NO DATA` or an explicit failed probe, not a
canonical fallback or inferred implementation grouping.

## 17. Ethical and rate boundary

The tool uses one browser session, three exact course codes, a fixed small
period set, one follow-up per successful historical search, and a delay between
navigations. It does not enumerate programmes, brute-force endpoints, bypass
access controls, or run in CI/builds. Re-running should be purposeful and
infrequent.

## 18. Canonical authority boundary

Peppi is external audit evidence only. It cannot overwrite local canonical
course data, create a course page, assign `periodId`, establish presentation
membership, or modify presentation contexts. Any later content change remains
a separate human-reviewed curation decision.

## 19. Peppi API suitability reconciliation

`PEPPI-API-SUITABILITY-01` remains unchanged:

- build-time Peppi API dependency: **NO-GO**;
- runtime Peppi API dependency: **NO-GO**;
- stable third-party API contract: **not established**.

The new finding is only that the normal browser context can yield useful
developer audit evidence.

## 20. OPETUS-CATALOG-01 implications

`OPETUS-CATALOG-01A` remains unchanged: the `/opetus/` SSR catalog must derive
from canonical local course pages. Current `405040Y` receives strong
independent implementation evidence. Historical `410014Y` and `410017Y`
receive stronger official course-name/year evidence, but no proof for the six
candidate historical implementation clusters. Those still need user
confirmation and/or implementation-specific evidence.

## 21. Files created

- `scripts/audit-peppi-courses.js`
- `scripts/_lib/peppiAuditParser.js`
- `tests/unit/peppiAuditParser.test.js`
- `outputs/peppi-browser-curation/peppi_course_audit.json`
- `outputs/peppi-browser-curation/peppi_course_audit.md`
- `outputs/peppi-browser-curation/network-summary.json`
- optional local `outputs/peppi-browser-curation/screenshots/`
- this document

`package.json` adds the manual `audit:peppi` command only.

## 22. Verdict

**GO - DEV-ONLY BROWSER CURATION TOOL.** The tool reliably retrieves bounded,
reviewable official evidence in normal public-browser context while preserving
the canonical authority and production architecture boundaries.

## 23. Recommended next action

Use the tool only when a human curator needs supporting evidence for a proposed
course decision. Keep `OPETUS-CATALOG-01A` on its canonical SSR path. Do not
start historical course-page curation or infer the six historical
implementation clusters from this POC alone.
