# PRES-YT-DATE-01 — Canonical YouTube-Backed Presentation Date Reconciliation

Date: 2026-08-31
Status: `IMPLEMENTED / CANONICAL METADATA REPAIRED`

Adds the authoritative canonical publication date to
`src/presentations/larun-pikkuvinkit.md`, the one YouTube-backed
Presentation MD that was shipping without an explicit frontmatter
`date:`. Eleventy previously fell back to the file's mtime when
populating the collection item's canonical date, which surfaced a
2020 videosarja at the top of every date-descending Presentation
sort as if it were 2026 content.

The defect was missing canonical metadata, not any downstream sort
or template logic. The fix repairs the source of truth (frontmatter)
and lets the existing canonical Presentation pipeline propagate
correct chronology to every consumer.

## Repository state

- Branch: `content/pres-yt-date-01-reconciliation`
- Base: `origin/main` at `7d45001d8809c17fd8910003ec6b91be00f10bc1`.
- Reference: `docs/home-landing-01-canonical-latest-2026-08-30.md` (the homepage workstream that discovered the defect and initially compensated with a template-level date-presence filter; that filter is removed after this PR merges — see PR #175 update).

## Larun pikkuvinkit — evidence, before, after

### Source evidence

- **Source URL** (from existing frontmatter): `https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY`
- **Authoritative source date** (from repository/source data supplied with this task): `2020-03-23T19:58:17.045136Z`
- **Semantic year**: 2020 — the videosarja was created during "koronakevät 2020" (the March 2020 pandemic pivot to remote teaching), consistent with the MD's own description (`"Koronakevään 2020 lyhytvideosarja…"`) and body text (`"Larun pikkuvinkit on koronakevään 2020 aikana tehty lyhytvideosarja."`).

### Before

```yaml
---
title: "Larun pikkuvinkit"
description: "Koronakevään 2020 lyhytvideosarja, jossa …"
url: "https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY"
sourceUrl: "https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY"
thumbnail: "https://i.ytimg.com/vi/hCZ9lgODkes/hqdefault.jpg"
source: "youtube"
type: "videosarja"
event: "Koronakevään etäopetus"
audience: "…"
categories: […]
keywords: […]
topics: […]
---
```

No `date:` field. Downstream chronology: Eleventy fell back to file mtime, which at repo state `7d45001d` was 2026-08-02 22:43. Any date-descending sort over `collections.presentations` therefore surfaced this item as 2026-08-02, ahead of the actual latest content (Arjen tekoälyhaaste 2026-05-06).

### After

Single-line addition after `description:`:

```yaml
date: 2020-03-23
```

Full corrected frontmatter (only new line shown; every other field preserved byte-for-byte):

```diff
 title: "Larun pikkuvinkit"
 description: "Koronakevään 2020 lyhytvideosarja, jossa …"
+date: 2020-03-23
 url: "https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY"
 sourceUrl: "…"
 ...
```

Format follows the repository's dominant Presentation frontmatter convention (unquoted YAML date `YYYY-MM-DD`, e.g., `date: 2026-01-21` in `kempele-veso-2026.md`). Not a full ISO timestamp — the repo does not use full timestamps for Presentation dates.

## YouTube-backed Presentation audit

Full sweep of `src/presentations/*.md` for items whose canonical source is YouTube (either `source: youtube` or a `url` / `sourceUrl` matching `youtube.com` / `youtu.be`).

| # | File | Canonical date before | Source date | Action | Classification |
| --: | --- | --- | --- | --- | --- |
| 1 | `avoin-tiede-2021-avoimeen-oppimiseen-ja-opetukseen.md` | `2021-04-14` | — (not in scope; explicit date already present) | none | **OK** |
| 2 | `eduxr-2020-suunnanmuutos-digiopettajasta-etaopettajaksi.md` | `2020-01-01` | — | none | **OK** — generic `2020-01-01` may represent event/delivery year, per spec §3 "Do not change the meaning of an existing canonical date if it may represent an event/delivery date instead of upload date." |
| 3 | **`larun-pikkuvinkit.md`** | **(none — file mtime fallback)** | `2020-03-23T19:58:17.045136Z` (provided in task) | **date: 2020-03-23 added** | **MISSING DATE — SOURCE DATE AVAILABLE** |
| 4 | `lea-hanke-visioita-sahkoisista-oppimisymparistoista.md` | `2018-11-19` | — | none | **OK** |
| 5 | `teknologia-opetuksen-tukena-video-1-keskustelemme-suhteestamme.md` | `2020-01-01` | — | none | **OK** — same reasoning as #2. |
| 6 | `tsl-tekoaly-demokratian-ja-sivistyksen-tukena-paneelikeskustelu-2024.md` | `2024-11-07` | — | none | **OK** |

**Files changed**: 1 (`src/presentations/larun-pikkuvinkit.md`, +1 line).

**Ambiguous items left untouched**: the two `2020-01-01` items (rows 2 and 5). Both may represent event/delivery years rather than upload dates. No repo-provable YouTube upload date was supplied for either, and overwriting could destroy editorial intent. Documented here as intentional non-actions.

**Not classified as `DATE CONFLICT`**: no item had two conflicting authoritative canonical dates.

## Verification

- Frontmatter YAML re-parses cleanly (`js-yaml` loads it without error).
- All other fields on `larun-pikkuvinkit.md` are preserved exactly: `title`, `description`, `url`, `sourceUrl`, `thumbnail`, `source`, `type`, `event`, `audience`, `categories`, `keywords`, `topics`, and the Markdown body.
- Canonical URL (`/presentations/larun-pikkuvinkit/` per Eleventy permalink) unchanged.
- `source: youtube` unchanged.

### Chronology effect

**Before** (`_site/kouluttaja/` and any Presentation date-desc sort):

- `larun-pikkuvinkit` sorted as `2026-08-02` (file mtime), placing it ahead of the actual latest Presentation (`arjen-tekoalyhaaste` 2026-05-06).
- The HOME-LANDING-01 initial implementation had to add a template-level `_p.data.date` presence filter to compensate.

**After** (this PR merged):

- `larun-pikkuvinkit` sorts as `2020-03-23`, placing it correctly in the 2020 tail of the corpus.
- The latest date-descending item is the actual latest Presentation.
- No consumer needs to filter or work around malformed dates.

## Test — chronology regression

Added `tests/unit/pres-yt-date-01-chronology.test.js` (3 cases):

1. **Every YouTube-backed Presentation MD declares an explicit frontmatter `date:`.** Iterates `src/presentations/*.md`, filters to YouTube-backed items (`source: youtube` or URL match), asserts `fm.date` is truthy. Guards against future MDs re-introducing the mtime-fallback defect.
2. **`larun-pikkuvinkit.md` resolves to 2020 chronology.** Asserts exact ISO `2020-03-23`, plus preservation of `source: youtube`, `type: videosarja`, and the YouTube playlist URL.
3. **The repair does not silently overwrite existing YouTube-backed dates.** Asserts the five other YouTube-backed MDs still resolve to their prior canonical dates (`2021-04-14`, `2020-01-01`, `2018-11-19`, `2020-01-01`, `2024-11-07`).

The test does not read filesystem timestamps — it parses frontmatter directly.

## Tests

- `npm run test:unit` — **645 pass / 0 fail** (was 642 baseline; +3 new PRES-YT-DATE-01 assertions).
- Full eleventy build — expected PASS (frontmatter unchanged in shape; only one field added).
- `git diff --check` — clean.
- Zero diff outside the one MD frontmatter line + the new test file + this doc.

## Effect on HOME-LANDING-01

- HOME-LANDING-01 (PR #175) originally added a template-level `_presWithDate` push-loop that excluded any `collections.presentations` item without a `data.date` — a workaround for exactly this malformed frontmatter.
- After PRES-YT-DATE-01 merges, that eligibility filter must be removed. HOME-LANDING-01 will be updated in the same session to consume `collections.presentations | sort(true, false, "date") | first` directly, and the HOME-LANDING-01 doc will be corrected to remove any wording implying the homepage filters malformed data.
- The homepage no longer needs to know about malformed canonical metadata. Chronology ownership stays where it belongs: in the canonical Presentation frontmatter.

## No new layer

- **No new YouTube reader.** No API client. No `_data` projection. No date reconciliation helper. No runtime metadata lookup. No browser-side enrichment.
- The fix is one line of frontmatter in one Markdown file plus one unit test file.

## Architecture status

- **`The defect was missing canonical Presentation metadata, not homepage sorting logic.`**
- **`Canonical Presentation metadata owns chronology.`**
- **`Filesystem mtime is not authoritative content chronology.`**
- **`HOME-LANDING-01 no longer contains a malformed-data eligibility rule.`** (After the PR #175 update that follows this merge.)
- **`No new reader, parser, projection, API layer, URL resolver, or browser-side content model was introduced.`**
- **`Canonical Content v1 remains unchanged.`**
- **`Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.`**
