# DETAIL-UX-01C — Presentation thumbnail regression fix + relevant-next-content audit

**Type:** AUDIT + PART-A REGRESSION FIX (Part B deferred)
**Date:** 2026-09-04
**Repo:** LaruX75/www
**Baseline SHA:** `b975998f919006babb96aedd7dbdb724e70f5945` (== origin/main after DETAIL-UX-01A merge)
**Branch:** `feat/detail-ux-01c-thumbnail-fix`
**Predecessor docs:** `docs/detail-ux-01-content-first-redesign-2026-09-04.md`, `docs/detail-ux-01a-closure-2026-09-04.md`, `docs/canonical-content-contract-v1.md`, `docs/architecture-closure-1-0-closure-2026-08-29.md`.

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. Canonical Content v1 unchanged.

## Executive summary

**Two problems, two decisions:**

1. **Part A — Presentation thumbnail regression (FIXED in this workstream).** The Presentation detail page renders the raw frontmatter `thumbnail` value directly. Some records still carry legacy `design.canva.ai/*` URLs from an older Canva CDN — these are ephemeral and rot. A canonical local thumbnail projection exists at `src/_data/canva-presentations.json` and hosts `/images/canva-thumbnails/*.png` files for 75 Canva presentations. The archive `/esitykset/` already uses the local projection; only the detail page was consuming the stale frontmatter. **Regression scope: 15 presentations.** Fix: prefer canonical local thumbnail projection on the detail page.

2. **Part B — "Kaikki esitykset" vs. relevant next content (DEFERRED to next slice).** The hero-level "Kaikki esitykset" domain-orientation link is not the same UX role as canonical "next relevant content". Canonical signals (`courseContexts`, `contexts`, `event`, `audience`, `teachingUnit`, `categories`) exist to derive relevant peers deterministically at build time, WITHOUT introducing a new taxonomy. But this is a substantial UX-section addition (new SSR partial, self-exclusion, empty-state, i18n labels) and belongs in its own PR with its own regression tests.

**AC1 assessment: no reopen trigger.** Neither problem indicates architecture regression; Part A is a stale-thumbnail data-flow fix, Part B is a UX-section addition on top of existing canonical semantics.

## Part A — Thumbnail regression

### Root cause

Detail-page thumbnail resolution flows:

```
src/presentations/{slug}.md
  frontmatter thumbnail = "https://design.canva.ai/..." (ephemeral CDN, some records)
                        OR SlideShare CDN (stable)
                        OR YouTube (stable)
                        OR local /images (0 records)
                                    │
                                    ▼
        parsePresentationFile()  → item.thumbnail = frontmatter raw
                                    │
                                    ▼
        buildCanonicalPresentationPageRecords()
        line 1224 (pre-fix): `item?.thumbnail || canonicalItem?.thumbnail || ""`
                                                     │
                                                     └─ from canva-presentations.json
                                                        (75 records with local paths)
                                    │
                                    ▼
        record.thumbnail = frontmatter raw stale URL   ← LOSES the local canonical asset
                                    │
                                    ▼
        Detail page: presentations.11tydata.js (pre-fix)
        NO thumbnail override in eleventyComputed
                                    │
                                    ▼
        Nunjucks: <img src="{{ thumbnail }}">
                                    │
                                    ▼
        BROKEN in browser (stale design.canva.ai)
```

Meanwhile, the archive card path bypasses this entirely — it reads `canva-presentations.json` directly via the source-bucket projection, so archive cards render `/images/canva-thumbnails/*.png` correctly.

### Thumbnail coverage (audit)

| Metric | Count |
| --- | ---: |
| Total presentations | 138 |
| Frontmatter thumbnail present | 134 |
| Frontmatter thumbnail = `design.canva.ai/*` (ephemeral, at-risk) | **15** |
| Frontmatter thumbnail = SlideShare CDN | 72 |
| Frontmatter thumbnail = YouTube (`i.ytimg.com`) | 6 |
| Frontmatter thumbnail = `ouka.fi` | 1 |
| Frontmatter thumbnail = `eventilla.avi.fi` | 1 |
| Frontmatter thumbnail = local `/images/…` | 0 |
| Canva canonical projection with local `/images/canva-thumbnails/*.png` | **75** |
| Files in `src/images/canva-thumbnails/` | 75 |

**Regression scope:** exactly the 15 `design.canva.ai/*` records.

**After the fix ships, coverage is 12/15 fixed + 3/15 remaining stale.** The remaining 3 (`generation-ai-yleisesitys-sovellukset-2026`, `luento-4-ohjelmointiosaaminen`, `luento-1-johdanto`) have `null` entries in `data/canva/content-slug-to-designid.json` — there is no confident Canva design ID mapping, so the canonical projection has no local asset to prefer. These 3 need data curation (identify Canva design ID + add local thumbnail file) as a separate follow-up. They are no worse than before the fix; the fix simply cannot help them.

The remaining Canva-authored presentations (60 of 75 canonical Canva records) do not have `design.canva.ai/*` in frontmatter — presumably they were populated using SlideShare or YouTube exports earlier, or their frontmatter has never been updated to point at the ephemeral Canva CDN.

The 15 affected slugs:
- `digierko2024-risteilyesitys`
- `international-conference-on-the-advancement-of-steam-2024`
- `kempele-veso-2026` (reporter's example)
- `monilukutaito-on-opettajan-supervoima-teko-lylukutaito-luento`
- `generation-ai-yleisesitys-sovellukset-2026`
- `konen-k-vibe-robotiikka-riihim-ki-robokampus-2026`
- `riihim-ki-veso-2026`
- `luento-4-ohjelmointiosaaminen`
- `kokkola-2025-teko-ly-opettajan-yst-v-vai-viho`
- `pori-kerava-millaisia-teko-lytaitoja-peruskoulussa-tulisi-opettaa-2020-luvulla`
- `luento-1-johdanto`
- `kohti-kriittist-teko-lylukutaitoa-2026-finnoschool`
- `opettaja-teko-lyn-ja-lytt-myyden-turbulenssissa-tampere-2025`
- `simo-veso-2024`
- `syntyvyys-ja-kouluik-luokat-oulussa-2026`

### Authoritative thumbnail projection

`src/_data/canva-presentations.json` — hand-curated projection where each Canva presentation entry pairs a Canva design ID with a local `/images/canva-thumbnails/…png` asset. This is the canonical Canva projection used by the archive.

The mapping from presentation URL → Canva design ID lives in `data/canva/content-slug-to-designid.json`. This lookup is already used by `buildCanonicalPresentationItems()` via the `canvaLookup.byId` / `.byTitle` maps.

**Nothing in this layer was changed by the fix.** Only the precedence between local .md frontmatter and canonical projection was reversed inside `buildCanonicalPresentationPageRecords()`, and the detail-page hydration was routed through it.

### Fix (Part A — SHIPPED in this workstream)

Two files:

1. **`src/_data/presentationsPage.js:1224`** — `buildCanonicalPresentationPageRecords` thumbnail resolution: prefer canonical projection thumbnail when it's a local path (`String(canonicalItem.thumbnail).startsWith("/")`); fall back to frontmatter otherwise. This narrow condition guarantees no regression for records that intentionally use a remote thumbnail (SlideShare / YouTube / OuKa) — those are all URL-prefixed with `http` or `https` and don't match `startsWith("/")`.

2. **`src/presentations/presentations.11tydata.js:93`** — add `eleventyComputed.thumbnail` that reads from the canonical projection (`getPresentationRecord(data)?.thumbnail`) with frontmatter fallback. Detail page now consumes the projection's decision instead of raw frontmatter.

Total: 2 files, ~10 lines of code + comments.

### Why this fix is safe

- **Canonical contract unchanged.** No canonical field, ID, URL, context, taxonomy, or source resolver semantic changed. `sourceUrl`, `externalUrl`, `pageUrl` all untouched.
- **No new taxonomy, no new schema.** `canva-presentations.json` already exists and was already the authoritative Canva projection.
- **Consumer-safe.** The only projection field affected is `thumbnail`, and it only changes when a local canonical asset actually exists. Public JSON `/data/presentations-page.json` consumers get an IMPROVED (local-hosted, stable) thumbnail — no consumer is broken.
- **No runtime fetch.** No Canva API call at build or runtime. No browser-side thumbnail resolver.
- **No new client JS.** SSR-only.
- **Frontmatter still valid.** Presentations that intentionally use external thumbnails (SlideShare, YouTube, other domains) continue to render those.

## Part B — Relevant next content

### `Kaikki esitykset` — current role

`Kaikki esitykset` in the hero comes from `detail-orientation.njk` (`orientationHubLabel = "Kaikki esitykset"`). Its intent is **domain orientation** (return to hub), not **relevant next content**. When it's the only hero-tier navigation aside from the primary CTA, users read it as an implicit recommendation, which is misleading.

### Canonical relationship signals available

Per Canonical Content v1 §3 (Presentations type-specific extensions) and the current data model, the following signals could ground a deterministic "relevant next content" section:

| Level | Signal | Source | Applicability to Kempele VESO |
| :---: | --- | --- | --- |
| L1 — explicit relation | `courseContexts[].courseId` | canonical frontmatter | ✗ (VESO is not course-linked) |
| L2 — canonical context | `contexts: [business]` | canonical frontmatter, resolved via `resolveContexts` + `contentContext.js` alias map | ✓ Kempele VESO has `contexts: [business]` → "Koulutus ja puhetyö" |
| L3 — presentation-specific | `event`, `audience`, `teachingUnit` | canonical frontmatter + `teachingUnits.js` | Partial — VESO has no explicit event field but `categories: [VESO,...]` |
| L3 — semantic | `categories`, `keywords`, `topics` | canonical frontmatter | ✓ shared `VESO`, `Opettajankoulutus`, `Tekoäly`, `opettajankoulutus` |
| L4 — topical discovery | Pagefind + R1 `semanticRelated` | derived index + ranking | ✓ falls back cleanly |

**Presentations with `contexts: [business]`** — ~12 confirmed by grep (Kempele VESO, Kokkola, Finnoschool, Kone K/Riihimäki, Tampere, Riihimäki VESO, Pori-Kerava, Simo VESO, and others). This is the natural "training/speaking presentations" group.

### Deterministic SSR model for Part B (design, not implemented)

Proposed SSR partial: `src/_includes/presentation-relevant-next.njk`. On the detail page:

```njk
{% set relevantPeers = collections.presentations
  | selectSameContexts(page.url, contexts)
  | limit(6) %}
{% if relevantPeers.length %}
<section class="content-detail-relevant-next">
  <h2>Muut {{ primaryContext.label.fi | lower }}</h2>
  <div class="row g-3">
    {% for peer in relevantPeers %}
      <div class="col-md-6 col-lg-4">
        {# reuse existing presentation-card.njk or archive card partial #}
      </div>
    {% endfor %}
  </div>
</section>
{% endif %}
```

Requirements:
- New JS filter `selectSameContexts(currentUrl, contexts)` in `.eleventy.js` — pure canonical filter, no new data, no new taxonomy
- Deterministic ordering by `date` descending, self-excluded
- Fallback cascade: L1 (courseContexts) → L2 (contexts) → L3 (categories/topics) → nothing
- Empty state: do not render the section
- Context label from `contentContext.js:CONTEXT_META`
- FI/EN parity via existing i18n
- Reuse existing presentation-card partial where practical
- New Playwright spec covering the 4 cases per spec §15

Why deferred:
- Substantive new SSR section — new template, new filter, new tests, new label copy
- Needs UX review of card reuse decision (there is not currently a shared "presentation-card partial" — archive cards are inline)
- Should ship in a focused workstream with its own regression tests
- Fits pattern of DETAIL-UX-01A's Blog-deferral: don't bundle substantive UX additions with regression fixes

### `Kaikki esitykset` repositioning (also deferred)

Spec §10 allows moving the "Kaikki esitykset" domain-orientation link from the hero to a footer-orientation area, so it no longer competes visually with the primary CTA. This deferred to Part B slice, because it should ship alongside the relevant-next-content section (so users have a real "next" to look at before hitting the escape hatch).

## Deletion candidates

- After Part A ships: 15 stale `design.canva.ai/*` frontmatter thumbnails are still in .md files but are now IGNORED by the detail projection (local canonical wins). These could be cleaned up in a follow-up data hygiene pass — but leaving them is fully safe.
- No template deletions in this slice.
- Part B, when shipped, will make the hero-tier "Kaikki esitykset" superfluous as a "next content" implication; the link itself (as domain orientation) should stay in a lower position.

## FI/EN parity

- Part A: language-neutral (thumbnail URL). No copy change.
- Part B: labels ("Muut täydennyskoulutusesitykset", "Samasta aiheesta", "Tämän kurssin muut esitykset" / EN counterparts) will use existing `contentContext.js` label map + explicit i18n block.

## Accessibility

- Part A: thumbnail restored — image now renders. `alt=""` continues (justified by parent `<aside aria-label="Esityksen esikatselu">` per DETAIL-HERO-01). No regression to reading order, focus, or heading hierarchy.
- Part B (when shipped): needs its own a11y verification — heading level, list semantics, link accessible names, keyboard, mobile order.

## Test strategy

### Part A (this slice)
- New Playwright regression at `tests/detail-ux-01c-thumbnail.spec.js`:
  - `/presentations/kempele-veso-2026/` renders a local `/images/canva-thumbnails/*.png` thumbnail (not `design.canva.ai/*`)
  - At least one other affected presentation (e.g., `luento-1-johdanto`) also renders local thumbnail
  - Non-Canva presentation (SlideShare) still renders its stable CDN thumbnail unchanged
  - Presentation without any thumbnail (405040y-luento-1-johdanto-2026-a — one of the 4 without frontmatter thumbnail) renders no aside markup (single-column hero fallback preserved)
  - Archive `/esitykset/` cards still render local thumbnails (regression guard for archive path)
- JSON-LD md5 identical baseline vs. after on 5 sample pages
- Content Graph parity via source-diff (KG inputs untouched)
- Pagefind attributes on Presentation hero unchanged (`data-pagefind-ignore` × 4, `data-pagefind-weight` × 2)

### Part B (follow-up slice)
- Course-linked presentation: relevant peers from same courseContexts
- Business-context presentation (Kempele VESO): relevant peers from same contexts
- Presentation with no strong relation: topical fallback OR empty section
- Self-exclusion invariant
- Determinism: SSR output identical on repeat build
- FI/EN labels

## Architecture Closure 1.0 assessment

Reviewed against `docs/architecture-closure-1-0-closure-2026-08-29.md` §6 reopen conditions:

| Reopen condition | Repo evidence? |
| --- | :---: |
| new duplicate content ownership | **No** |
| canonical semantics moved into browser JS | **No** |
| Pagefind becoming canonical storage | **No** |
| new runtime JSON → HTML architecture | **No** |
| loss of FI/EN parity in shared architecture | **No** |
| removal of a public contract without consumer proof | **No** — public JSON thumbnail gets an IMPROVED value; contract untouched |
| regression in source, landing or context semantics | **No** — thumbnail is a preview asset; source/landing/context all untouched |

**Architecture Closure 1.0 = `CLOSED / GREEN / MAIN`.**

## Files changed (Part A only)

| File | Change |
| --- | --- |
| `src/_data/presentationsPage.js` | Reverse thumbnail precedence in `buildCanonicalPresentationPageRecords` when canonical projection has local path |
| `src/presentations/presentations.11tydata.js` | Add `eleventyComputed.thumbnail` routing through canonical projection |
| `tests/detail-ux-01c-thumbnail.spec.js` | **New** — regression spec |
| `docs/detail-ux-01c-relevant-next-content-audit-2026-09-04.md` | **New** — this document |

2 modified + 2 new = 4 file operations.

## Stopping point

**Part A implemented in this PR. Part B (relevant next content SSR section + `Kaikki esitykset` repositioning) recommended as a separate follow-up slice** — call it `DETAIL-UX-01C-B` or similar. The audit above documents the deterministic canonical model that would ground it; implementation should be a focused workstream.
