# OPETUS-CANVA-THUMBNAILS-01A — implementation (2026-09-09)

## Status

Implementation complete. Draft PR pending. Do NOT merge.

- Baseline: `d5900fb65fab2890155faa0082c5dd4ba699f94f` (origin/main)
- Branch: `feat/opetus-canva-thumbnails-01a`
- Follows: `docs/405040y-presentation-canonicalization-2026-09-09.md` (PR #238) CLOSED / GREEN / MAIN
- Follows: `docs/detail-ux-01c-relevant-next-content-audit-2026-09-04.md` Part A canonical thumbnail flow
- Follows: `docs/course-relation-ux-01-closure-2026-09-06.md`
- Canonical Content v1: **UNCHANGED**
- Pagefind: **UNCHANGED**
- Public JSON: **UNCHANGED**
- Runtime JSON: **UNCHANGED**
- AC1: **CLOSED / GREEN / MAIN**

## Scope

Add canonical, locally-hosted Canva cover thumbnails for the eight canonical
405040Y lecture Presentations and render an SSR preview grouped with the
lecture title (Aihe cell) on both course-implementation pages. The
Materiaali column stays action-oriented (text links only):

- Autumn 2026 (`/opetus/teknologiatuettu-oppiminen/2026-2027-a/`) lectures 1–4
- Spring 2026 VAKA ABCDE (`/opetus/teknologiatuettu-oppiminen/2025-2026-b/`) lectures 1–4

Kopiosto guest lectures stay external and receive no fabricated preview.

**UX rule:** the Presentation thumbnail is grouped with the lecture title;
the Material column remains action-oriented.

## 1. Authenticated Canva asset acquisition (8/8)

Used the repository's existing Canva Connect flow (`scripts/canva/_lib/`)
without inventing a new thumbnail system. A one-off off-repo acquisition
helper (`/tmp/canva-covers-01a/fetch-covers.mjs`) called the existing
`getAccessToken()` and `apiGet()` helpers to fetch each design's fresh
`thumbnail.url` from `GET /v1/designs/{designId}`, then downloaded and
verified the image (HTTP 200, `image/*` content-type, non-generic URL,
design ID embedded in the signed URL, and 596×335 PNG dimensions).

The August 2026 raw cache (`data/canva/canva-designs-raw.json`) already
contained metadata for 5 of the 8 designs; all thumbnail URLs in that
cache had signed-URL expirations from 2026-08, so live API refresh was
required for all 8. Both `.canva-tokens.json` (persisted) and the `.env`
`CANVA_REFRESH_TOKEN` bootstrap value were expired at the start of the
workstream; the operator rotated the OAuth refresh token via
`node scripts/canva/00-oauth-setup.mjs` before acquisition proceeded.

Acquisition result: **8/8 PASS**.

| # | Design ID | Sivut | Tavut | Design-otsikko (Canva) | Kurssin sekvenssi |
|---|---|---:|---:|---|---|
| 1 | DAG29zybS5g | 79 | 30 859 | "Syksy 2025 Muka/kako/opti Luento 1. Johdanto" | 2026-A luento 1 |
| 2 | DAHT7HRSXpU | 25 | 34 189 | "DigComp_3_0_luento_90min.pptx" | 2026-A luento 2 |
| 3 | DAHUIPqmXF8 | 75 | 130 862 | "Luento 3. Tekoälylukutaito" | 2026-A luento 3 |
| 4 | DAHUiWcmiXM | 55 | 108 289 | "Luento 4. Informaatio- ja medialukutaito digitaalisessa ympäristössä" | 2026-A luento 4 |
| 5 | DAGbinJj3qY | 65 | 29 880 | "Luento 1. Johdanto" | 2026-B luento 1 |
| 6 | DAGcMikkGGQ | 46 | 7 270 | "Title" (nimetön) | 2026-B luento 2 |
| 7 | DAGdezSMbr0 | 43 | 6 819 | "Luento 4: Ohjelmointiosaaminen" | 2026-B luento 3 |
| 8 | DAGi9AsWlIk | 73 | 3 370 | "Luento 5. Medialukutaito" | 2026-B luento 4 |

Canva-designien sisäiset työnimet (esim. "Luento 4: Ohjelmointiosaaminen"
tai "Luento 5. Medialukutaito") heijastavat aiempaa työjärjestystä; kurssin
autoritatiivinen sekvenssi on kurssisivun `course.lectures[]`-frontmatter.
Nämä otsikot eivät ole käyttäjän näkyvissä missään; ne pysyvät vain Canvassa.

## 2. Canonical thumbnail flow

Existing chain (unchanged; consumed by this workstream):

```
src/presentations/{slug}.md        ← canonical identity + courseContexts
                                     (url = canva.link/{shortlink})
        │
data/canva/content-slug-to-designid.json
        │  ← NEW 8 mappings ({pageUrl} → {designId, confidence, siteTitle, reason})
src/_data/canva-presentations.json
        │  ← NEW 8 records (link → canva.com/design/{designId}/view, thumbnail = local /images/canva-thumbnails/…)
src/images/canva-thumbnails/{slug}.png
        │  ← NEW 8 assets (from Canva Connect)
        │
src/_data/canva.js  → tableRows[]  (id, pageUrl via createCanvaPresentationLookup)
src/_data/presentationsPage.js
        │  ← buildCanvaMaterialLookup → canvaLookup { byId, byTitle }
        │  ← createCanonicalCanvaItems → canonical items with local thumbnail
        │  ← buildCanonicalPresentationPageRecords (DETAIL-UX-01C fix)
        │      thumbnail: canonical local / (starts with "/") wins over frontmatter
        │  ← buildCanonicalPresentationPageLookup → Map<pageUrl, record>
        │
src/opetus/teknologiatuettu-oppiminen-2026-{a,b}.11tydata.js
        │  ← hydrateLectures → lecture.presentation = canonical record
        │
src/opetus/teknologiatuettu-oppiminen-2026-{a,b}.md
        │  ← SSR preview when lecture.presentation.thumbnail exists
```

No new build-time helper, no new canonical field, no new taxonomy.

## 3. Local asset projection

- 8 new PNG assets under `src/images/canva-thumbnails/` follow the
  presentation URL slug as filename (`{slug}.png`).
- Dimensions 596×335 (matches existing 75 records; hero preview aspect
  ratio 596/335 ≈ 1.78, close to 16:9).
- Byte sizes range 3–131 KB depending on cover simplicity (three
  minimalistic Canva covers under 10 KB are within the existing size
  distribution — smallest existing asset is ~3 KB).
- No optimization pipeline was introduced; assets are the direct
  `type:B` cover thumbnails returned by Canva Connect.

`content-slug-to-designid.json` schema followed exactly (`designId`,
`confidence`, `siteTitle`, `reason`). Confidence is `high` for all
eight because the designId ↔ canonical Presentation pairing is
authoritatively known from the handoff and the canonical .md files
already commit to those Canva materials.

`canva-presentations.json` schema followed exactly. Each new record
carries only what the projection needs to bridge:

- `title` — matches canonical Presentation title (bridges via byTitle)
- `link` / `publicUrl` — full `https://www.canva.com/design/{designId}/view`
  (bridges via byId through `getCanvaDesignId`)
- `thumbnail` — local `/images/canva-thumbnails/{slug}.png`
- `date`, `location`, `lang`, `jarjestaja`, `folder` — projection metadata
- `courseReview.status: "accepted"` with a note that course semantics
  live in the canonical Presentation record's `courseContexts[]`

`courseContexts` is intentionally omitted from the Canva projection —
those semantics belong exclusively to the canonical Presentation record,
per Canonical Content v1 §3 and per the "Do not duplicate canonical
identity or course semantics unnecessarily" invariant of the workstream.

## 4. SSR course-page rendering

Both course pages already resolved `lecture.presentation` through
`buildCanonicalPresentationPageLookup(data)` (via COURSE-PAGE-01 and
its spring 2026-B counterpart).

The **Aihe** (topic/title) cell composes the preview horizontally with
the lecture title using a flex row. When `lecture.presentation.thumbnail`
exists, the row shows [thumbnail | title + optional externalSpeaker].
When absent (Kopiosto rows), the cell falls back to plain title markup:

```njk
<td>
  {% if lecture.presentation and lecture.presentation.thumbnail %}
  <div class="course-lecture-topic d-flex align-items-start gap-3">
    <a href="{{ lecture.presentation.pageUrl }}" class="course-lecture-preview-link flex-shrink-0" aria-label="Esityksen esikatselu">
      <img src="{{ lecture.presentation.thumbnail }}" alt="" loading="lazy" decoding="async" width="596" height="335" class="course-lecture-preview img-fluid rounded">
    </a>
    <div class="course-lecture-topic-body">
      <div class="fw-semibold">{{ lecture.title }}</div>
      {% if lecture.externalSpeaker %}
      <div class="text-muted small">Vierailuluento: {{ lecture.externalSpeaker }}</div>
      {% endif %}
    </div>
  </div>
  {% else %}
  <div class="fw-semibold">{{ lecture.title }}</div>
  ...
  {% endif %}
</td>
```

The **Materiaali** cell is action-oriented: "Avaa esitys" text link
plus the Panopto recording block. No preview image lives here anymore.

```njk
<td>
  {% if lecture.presentation %}
  <a href="{{ lecture.presentation.pageUrl }}" class="text-decoration-none fw-semibold">Avaa esitys <i class="bi bi-arrow-right ms-1"></i></a>
  <div class="text-muted small mt-1">Kanoninen esityssivu jarilaru.fi:ssä</div>
  {% elif ... %}
  ...
  {% if lecture.recording %}
  <div class="mt-2">... Panopto ...</div>
  {% endif %}
</td>
```

Behaviour:

- Preview links to the canonical Presentation `pageUrl` (never directly
  to Canva) and lives in the Aihe cell, grouped with the title.
- The separate "Avaa esitys" text link stays in the Material cell; the
  preview link and the text link have distinct short accessible names
  (`aria-label="Esityksen esikatselu"` vs the visible "Avaa esitys"
  text) so screen-reader users are not subjected to verbose duplicate
  naming.
- The Material column stays action-oriented (Avaa esitys + Panopto);
  the cover is content identity, not an action.
- When `lecture.presentation` is absent (Kopiosto rows both semesters),
  no preview is rendered and no thumbnail is fabricated.
- Panopto recording block and the existing `elif lecture.material`
  branch are unchanged.
- Lecture order is unchanged.
- The existing responsive table remains authoritative for row layout.

## 5. Accessibility and mobile behaviour

- `alt=""` on the image + short distinct accessible names on the two
  links → screen readers announce two links per lecture (preview,
  "Avaa esitys") with no duplicate verbose naming.
- Keyboard focus lands on both links (the preview link is not
  `tabindex="-1"`). Focus indicator is Bootstrap's default focus ring on
  anchor elements, which is visible via `a11y.css`.
- The preview and the title live in a `.course-lecture-topic` flex row
  (`d-flex align-items-start gap-3`); `.flex-shrink-0` on the preview
  keeps the thumbnail at its target width and `.course-lecture-topic-body`
  gets `min-width: 0` so long titles wrap naturally instead of pushing
  the preview off-cell.
- CSS: `.course-lecture-preview-link { max-width: 120px; }` on desktop
  caps the clickable frame within the "Target preview width approximately
  112–120px" band. `.course-lecture-preview` uses
  `width: 100%; aspect-ratio: 596/335; object-fit: cover;` so the image
  scales inside its container. A single narrow-viewport media query
  shrinks the frame to 88px below 480px viewport width so the thumbnail
  never dominates the title cell on 320px / 390px screens.
- 320px and 390px viewports verified via a Playwright spec that measures
  `document.documentElement.scrollWidth` after navigating to each
  course page.

## 6. Deletion / simplification

None. This workstream is additive:

- No canonical .md field was changed.
- No template was removed.
- No CSS was deleted.
- No JS was added.
- No runtime JSON, no Pagefind changes, no browser Canva fetch.

The DETAIL-UX-01C Part A follow-up ("3 remaining stale
`design.canva.ai/*` presentations that could not benefit from that fix
because they had `null` in `content-slug-to-designid.json`") is
unrelated to this workstream: those 3 presentations do not correspond
to the 8 canonical 405040Y lectures and remain unchanged.

## 7. Validation

### Canonical projection

`buildCanonicalPresentationPageLookup(data)` returns local
`/images/canva-thumbnails/{slug}.png` for all eight canonical
Presentation URLs. **8/8 PASS.** Verified by:

- `tests/unit/opetusCanvaThumbnails01a.test.js` — 17 assertions covering
  (i) lookup resolution for each of the 8 pageUrls, (ii) local file
  existence for each of the 8 assets, and (iii) `content-slug-to-designid.json`
  entries for each of the 8 pageUrls with `designId` set and
  `confidence: "high"`.

### SSR previews (Playwright)

`tests/opetus-canva-thumbnails-01a.spec.js` — 52 assertions:

- Autumn 2026-A: exactly 4 previews, each linking to the correct
  canonical landing *inside the `.course-lecture-topic` (Aihe) cell*;
  each `<img>` has `loading="lazy"`, `decoding="async"`, `alt=""`; the
  separate "Avaa esitys" text link is retained in the Material cell
  per lecture; no direct Canva shortcut re-introduced.
- Spring 2026-B: same guards on 4 previews.
- **Material-column guard:** for each of the 8 lecture rows the
  Material `<td>` (the cell containing "Avaa esitys") is asserted to
  contain NO `img.course-lecture-preview` — the preview is grouped
  with the title, not with the actions.
- Kopiosto rows (lecture 5 both semesters): no preview markup anywhere.
- SSR-only: previews present with JavaScript disabled on both pages.
- Mobile: `document.documentElement.scrollWidth ≤ viewport.width` at
  320px and 390px on both pages.

**52/52 PASS.**

### Adjacent regression tests (Playwright)

- `tests/course-page-01.spec.js`: passing after updating the "lecture
  4 canonical link" test to expect **2** anchors per row (the preview
  wrapper + the text link) instead of 1.
- `tests/course-page-405040y-2026-b.spec.js`: passing (no changes
  required — its assertions were already at the row level rather than
  the anchor level).
- `tests/detail-ux-01c-thumbnail.spec.js`: passing after switching the
  "presentation without any thumbnail" fallback test subject from
  `/presentations/405040y-luento-1-johdanto-2026-a/` (which now has a
  canonical thumbnail as a direct result of this workstream) to
  `/presentations/opi-oulu-2026-tekoalyaiheinen-paneelikeskustelu/`
  (the remaining canonical Presentation whose .md has neither a
  frontmatter thumbnail nor a canonical Canva projection).
- `tests/detail-ux-01c-b-course.spec.js`, `tests/course-relation-ux-01.spec.js`,
  `tests/detail-hero-ux-02.spec.js`, `tests/detail-ux-orient-01.spec.js`:
  passing after updating the hardcoded `2 course-peer-item` count to
  `3` for the 405040Y 2026-A implementation. The peer group is
  `courseId=405040Y + periodId=2026-2027-a`; with all four autumn
  lectures now fully resolvable through the canonical Presentation
  lookup (a direct consequence of adding the missing lecture 4 Canva
  projection wiring in this workstream), the correct peer count for
  each lecture is 3 (four in group minus self). No canonical rule was
  changed; the count reflects the completed data wiring.

### Adjacent regression tests (Node --test)

- `tests/unit/presentationResearchTopics.test.js`: passing after bumping
  the hardcoded canonical-items count from 217 to 225 (+8 to reflect the
  new records).
- `tests/unit/presentationsF3cP3.test.js`: passing after bumping the
  hardcoded starting-items and canonical-items counts from 206/217 to
  214/225 (+8). This test's later assertion at line 158
  (`OTHER_EXPLICITLY_DOCUMENTED_STATUS.length === 0`) was previously
  failing on baseline with `5 !== 0`; that pre-existing failure is
  incidentally fixed by this workstream because the 5 unmatched local
  Presentations are the 8 canonical 405040Y lecture .md files that
  now resolve cleanly through the added canonical Canva projection.

### Pre-existing failures NOT touched

- `tests/course-page-01.spec.js:196` "page is meaningful with JavaScript
  disabled" — the hardcoded expected heading text
  `"Tule tekemään opinnäytteitä näistä aiheista"` is not present in
  any source or built HTML (the current heading is `"Tee opinnäytetyö
  kurssin aihepiiristä"`). Pre-existing test drift; verified failing on
  baseline main.
- `tests/detail-ux-orient-01.spec.js:173` "Find & Explore search
  decorates result links" — requires a built Pagefind index
  (`_site/pagefind/pagefind-entry.json`), which `npm run build:local`
  does not generate. Pre-existing environmental limitation.
- `tests/unit/presentationsPage.test.js` two tests
  (`sailyttaa detailisivun nykyiset kentat…`, `fallback toimii jos
  canonical itemia ei loydy`) — deep-equal drift caused by an earlier
  DETAIL-UX-01C-B-COURSE change that added `location`, `kategoria` and
  `jarjestaja` fields to `buildCanonicalPresentationPageRecords`
  output. Pre-existing fixture drift; verified failing on baseline main.
- Six Pagefind/search-quality regression benchmark tests — all require
  a built Pagefind index. Pre-existing environmental limitation.

### Build

`npm run build:local` completed successfully: 1491 files written in
~222 s, `check:researchfi-integrity` OK. No new warnings or errors
attributable to this workstream.

### `git diff --check`

Clean.

## 8. Architecture status

```text
Canonical Content v1: UNCHANGED
Pagefind: UNCHANGED
Public JSON: UNCHANGED
Runtime JSON: UNCHANGED
AC1: CLOSED / GREEN / MAIN
```

Reviewed against AC1 §6 reopen conditions:

| Condition | Evidence |
| --- | :---: |
| new duplicate content ownership | **No** — Canva projection carries no `courseContexts`; canonical .md is still the sole owner of course semantics. |
| canonical semantics moved into browser JS | **No** — all resolution is build-time. |
| Pagefind becoming canonical storage | **No** — Pagefind is unchanged. |
| new runtime JSON → HTML architecture | **No** — no runtime fetch introduced; SSR-only. |
| loss of FI/EN parity in shared architecture | **No** — both course pages are FI-only (per their `translationKey`) and their EN counterparts are not affected. |
| removal of a public contract without consumer proof | **No** — public JSON allowlists and shapes are unchanged. |
| regression in source, landing or context semantics | **No** — `sourceUrl`, `pageUrl`, `contexts`, `courseContexts` for the eight canonical Presentations are all preserved. Preview UI is additive. |

## 9. Files changed

**New:**
- `src/images/canva-thumbnails/405040y-luento-1-johdanto-2026-a.png`
- `src/images/canva-thumbnails/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.png`
- `src/images/canva-thumbnails/405040y-luento-3-tekoalylukutaito-2026-a.png`
- `src/images/canva-thumbnails/405040y-luento-4-media-ja-informaatiolukutaito-2026-a.png`
- `src/images/canva-thumbnails/405040y-luento-1-johdanto-2026-b.png`
- `src/images/canva-thumbnails/405040y-luento-2-digitaalinen-osaaminen-2026-b.png`
- `src/images/canva-thumbnails/405040y-luento-3-ohjelmointiosaaminen-2026-b.png`
- `src/images/canva-thumbnails/405040y-luento-4-medialukutaito-2026-b.png`
- `tests/opetus-canva-thumbnails-01a.spec.js` — Playwright regression suite
  (44 assertions across 8 describe blocks).
- `tests/unit/opetusCanvaThumbnails01a.test.js` — Node --test unit
  guard (17 assertions).
- `docs/opetus-canva-thumbnails-01a-implementation-2026-09-09.md` —
  this document.

**Modified:**
- `data/canva/content-slug-to-designid.json` — +8 slug→designId entries.
- `src/_data/canva-presentations.json` — +8 curated Canva projection
  records (title, link, publicUrl, thumbnail, date, location, lang,
  folder, jarjestaja, courseReview).
- `src/opetus/teknologiatuettu-oppiminen-2026-a.md` — SSR preview
  markup in the Materiaali cell + `.course-lecture-preview-link` /
  `.course-lecture-preview` styles in the trailing `<style>` block.
- `src/opetus/teknologiatuettu-oppiminen-2026-b.md` — same additive
  changes for the spring course page.
- `tests/course-page-01.spec.js` — updated lecture-4 canonical-link
  count from 1 to 2 (preview + text link).
- `tests/detail-ux-01c-thumbnail.spec.js` — switched the "no
  thumbnail" fallback subject to `opi-oulu-2026-tekoalyaiheinen-paneelikeskustelu`.
- `tests/detail-ux-01c-b-course.spec.js`,
  `tests/course-relation-ux-01.spec.js`,
  `tests/detail-hero-ux-02.spec.js`,
  `tests/detail-ux-orient-01.spec.js` — updated hardcoded 405040Y
  peer count from 2 to 3.
- `tests/unit/presentationResearchTopics.test.js` — canonical-items
  count 217 → 225.
- `tests/unit/presentationsF3cP3.test.js` — starting/canonical counts
  206/217 → 214/225.

Uncommitted (intentionally NOT part of this PR):
- `.cache/api-fallback/{crossref-enrichments-v1,finna-aoe-v2,jufo-enrichments-v1}.json`
  — single-line timestamp refreshes from the local build. Not scope of
  this workstream.

## 10. Follow-ups (out of scope for this workstream)

- `.cache/api-fallback/*.json` freshness — decide separately whether to
  commit updated cache snapshots.
- Pre-existing thesis-teaser heading drift in `course-page-01.spec.js`
  (line 205, 224) — separate hygiene commit.
- Pre-existing `presentationsPage.test.js` fixture drift caused by
  DETAIL-UX-01C-B-COURSE's `location`/`kategoria`/`jarjestaja` fields
  on `buildCanonicalPresentationPageRecords` output — separate
  hygiene commit.
