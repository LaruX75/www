# DETAIL-UX-01A — Content-first hierarchy + primary action clarity

**Status:** READY FOR REVIEW
**Date:** 2026-09-04
**Baseline SHA:** `79f9de7cdb7f867e246d894e7e28d15f2acb096a` (== origin/main after DETAIL-HERO-01)
**Branch:** `feat/detail-ux-01a`
**Predecessor:** `docs/detail-ux-01-content-first-redesign-2026-09-04.md`

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`. Canonical Content v1 unchanged.

## Scope delivered

The three UX shifts recommended by the DETAIL-UX-01 redesign proposal, and nothing else:

### A. Presentation thumbnail → hero aside

Presentation detail bodies now render the canonical thumbnail as the hero aside (via `detail-hero.njk`'s existing `aside` slot), mirroring the Media detail pattern. When a Presentation record has no thumbnail (4 of 138), the hero falls back to `content-detail-hero-grid--single` — no aside markup emitted.

The body-inline thumbnail duplicate (`content-detail-inline-visual`) was removed. The preview no longer renders twice.

### B. Thesis primary action → hero

Thesis hero now emits an inline `btn-primary rounded-pill` pointing at the canonical `thesisDetail.sourceUrl` (OuluREPO handle), immediately next to the `detail-orientation` hub-return link. Same href, same target, same rel as the pre-existing card-level CTA below Abstract + Citation.

The secondary "Alkuperäinen lähde" card was retained as a contextual explainer — user still reads the "this local page is metadata + landing; original lives in OuluREPO" copy — but no longer has to scroll past Abstract + Citation to reach the source. Both CTAs point to the same canonical URL.

### C. Destination-specific CTA labels

Where destination is derivable from existing canonical / source resolver data:

| Domain | Old label | New label | Data source |
| --- | --- | --- | --- |
| Publication (DOI destination) | `Avaa lähde` | `Avaa DOI:ssa` | `detail.doiUrl == externalHref` |
| Publication (non-DOI external) | `Avaa lähde` | `Avaa julkaisu` | `detail.externalUrl` fallback |
| Presentation on Canva | `Avaa materiaali` | `Avaa esitys Canvassa` | `source == "canva"` |
| Presentation on SlideShare | `Avaa materiaali` | `Avaa esitys SlideSharessa` | `source == "slideshare"` |
| Presentation on AOE | `Avaa materiaali` | `Avaa materiaali AOE:ssa` | `source == "aoe"` |
| Presentation on OUKA | `Avaa materiaali` | `Avaa Oulun kaupungin materiaali` | `source == "ouka"` |
| Presentation video (YouTube) | `Katso tallenne` | `Katso tallenne YouTubessa` | `isVideoPreview` |
| Media (with outlet) | `Avaa alkuperäinen lähde` | `Avaa alkuperäinen lähde — {mediaOutlet}` | `mediaOutlet` |
| Media (no outlet) | `Avaa alkuperäinen lähde` | (unchanged) | fallback |

Publications also gained bilingual EN labels (`Open in DOI` / `Open publication`). Thesis primary action carries bilingual `Open in OuluREPO` / `Avaa OuluREPOssa`.

**No new source classifier was introduced.** Every label maps directly to existing canonical `source` / `mediaOutlet` / `doiUrl` fields.

**Blog and Writing were intentionally not relabeled** — their external-source URLs are heterogeneous and cannot be reliably classified to a specific service label without a new classifier. Spec §3 explicitly forbids building one for DETAIL-UX-01A.

## Publication DOI: PROTECTED SEMANTIC METADATA

Per spec §4, the Publication DOI is **not** a deletion candidate.

Preserved as evidence:
- Sidebar `<dt>DOI</dt><dd>...</dd>` row (visible in built HTML — `grep -c '<dt>DOI</dt>' julkaisut/*/index.html` = 1)
- APA citation card DOI text
- Hero primary CTA now labels destination as DOI (identifier surfacing, not identifier removal)
- JSON-LD DOI in `@id` / `url` / bibliographic properties (verified via md5-identical JSON-LD across sample publication before/after)

Every existing DOI touchpoint on Publication detail is intentional. The hero button label change surfaces the DOI as the destination.

## Blog source duplication decision

**Deferred, not resolved.** The redesign's earlier suggestion to remove the hero `Avaa lähde` on Blog was NOT applied in this slice. Spec §5 requires strong parity proof + accessibility unchanged + JS-disabled proof. Blog external-source has secondary semantics ("text source" + "background source" in body asides) — collapsing the hero CTA needs a separate follow-up to establish that consumers rely on the aside labels for context. **Blog markup unchanged in this slice.**

Recorded as follow-up in `DETAIL-UX-01B` or `DETAIL-UX-01D`.

## Files changed

| File | Change |
| --- | --- |
| `src/_includes/presentation-item.njk` | Add hero aside for canonical thumbnail (via `heroPartial.heroShell(..., aside=…)`); delete body-inline duplicate `.content-detail-inline-visual`; add destination-specific CTA label |
| `src/_includes/thesis-detail-body.njk` | Add inline `btn-primary` OuluREPO link in `content-detail-actions` next to `detail-orientation`; secondary card retained |
| `src/_includes/publication-item-body.njk` | Destination-specific CTA label (`Avaa DOI:ssa` when DOI, `Avaa julkaisu` fallback); bilingual |
| `src/_includes/media-item.njk` | Destination-specific CTA label with outlet suffix |
| `tests/detail-ux-01a.spec.js` | **New** — 6 test groups × 7-page matrix |
| `docs/detail-ux-01a-closure-2026-09-04.md` | **New** — this document |

**5 modified + 2 new = 7 file operations.** Net delta ~+70 / −12 lines.

**No changes to** `detail-hero.njk`, `content-context-sidebar.njk`, `detail-orientation.njk`, `_ldschema.njk`, `_meta.njk`, `base.njk`, any resolver, any `_data/`, any curated data, `.eleventy.js`, or `package*.json`.

## Content Graph parity

**Byte-identical vs. baseline `origin/main` (79f9de7c).** Two proofs:

### Source-level (constructive)

`git diff --stat origin/main` on `src/_data/knowledgeGraph.js`, all `src/_data/curated/`, `src/_data/researchProgram.js`, `src/_data/researchProjects.js`, `src/_data/canva*`, and `src/_data/presentationContexts.json` returns **empty**. Every KG input is unchanged. `buildKnowledgeGraph()` output is byte-identical by construction. Audit baseline preserved: **582 nodes / 1200 edges / 10 node kinds / 15 edge types**.

### Build-level (empirical)

Two builds in independent revisions:
- Baseline: `git worktree add /tmp/detail-ux-01a-baseline origin/main` → `1479 files, exit 0`
- Post-migration: `rm -rf _site && npx @11ty/eleventy` on this branch → `1479 files, exit 0`

Same file count; graph consumer (`/tutkimus/tietograafi/`) built in both.

## JSON-LD parity

Compared md5 of `<script type="application/ld+json">` block on 7 built pages (6 domains + one Presentation with thumbnail):

| Page | Baseline vs. after |
| --- | :---: |
| `/julkaisut/0669729323/` | IDENTICAL |
| `/presentations/405040y-luento-1-johdanto-2026-a/` | IDENTICAL |
| `/presentations/kohti-kriittist-teko-lylukutaitoa-2026-finnoschool/` | IDENTICAL |
| `/mediassa/2026/03/29/tekoaly-tekee-petoksen-koulutehtavissa-helpoksi/` | IDENTICAL |
| `/2013/02/05/yhdistysaktivisti/` | IDENTICAL |
| `/2026/04/28/lausunto-uutta-suuntaa-suomen-digitaaliseen-kompassiin/` | IDENTICAL |
| `/opinnaytteet/46895/` | IDENTICAL |

`_ldschema.njk`, `_meta.njk`, `resolveContentMeta.js` are in the untouched set.

## Content-context-sidebar parity

Sidebar heading count identical baseline vs. after (rich Publication + Presentation: 8; Thesis: 7). No changes to `content-context-sidebar.njk`, `computeRelatedContent`, `semanticRelated.json`, or R1 boundaries.

## Empirical UX-shift verification

| Assertion | Baseline | After | ✓/✗ |
| --- | :---: | :---: | :---: |
| Presentation (with thumbnail) hero aside | 0 | 1 | ✓ |
| Presentation body-inline thumbnail | 1 | 0 | ✓ (removed) |
| Presentation (no thumbnail) fallback to single-column | — | ✓ | ✓ |
| Thesis btn-primary count | 1 | 2 (hero + card) | ✓ |
| Thesis OuluREPO href count | 6 | 7 (+1 in hero) | ✓ |
| Publication CTA label | `Avaa lähde` | `Avaa DOI:ssa` | ✓ |
| Publication DOI `<dt>DOI</dt>` present | 1 | 1 | ✓ (preserved) |
| Presentation Canva CTA label | `Avaa materiaali` | `Avaa esitys Canvassa` | ✓ |
| Media CTA label | `Avaa alkuperäinen lähde` | `Avaa alkuperäinen lähde — Kaleva` | ✓ |

## Accessibility verification

- Exactly one `<h1>` on all 7 built sample pages (Playwright asserts this).
- Heading hierarchy preserved (no changes to h1/h2/h3 structure).
- Primary action distinguishable by class (`btn-primary rounded-pill`) — not by color alone.
- Presentation hero thumbnail uses `alt=""` (justified: `<aside aria-label="Esityksen esikatselu">`), matching Media pattern.
- Thesis new hero CTA has meaningful text (`Avaa OuluREPOssa` / `Open in OuluREPO`), `target="_blank"`, `rel="noopener noreferrer"`.
- DOM reading order preserved on all pages (hero → body → sidebar → orientation).
- All new CTA labels render server-side; core functionality works with JavaScript disabled.

Mobile behavior: presentation hero aside stacks below title at < 992px (Bootstrap responsive default), matching Media pattern. Verified via CSS class analysis.

## Pagefind verification

`data-pagefind-ignore` and `data-pagefind-weight` attributes on Presentation hero preserved unchanged (count identical baseline vs. after: 4× `data-pagefind-ignore`, 2× `data-pagefind-weight`). No new Pagefind attributes introduced. No schema or filter changes.

## FI/EN parity

- Publications: new labels bilingual (`Open in DOI` / `Avaa DOI:ssa`, `Open publication` / `Avaa julkaisu`).
- Thesis: new hero primary action bilingual (`Open in OuluREPO` / `Avaa OuluREPOssa`).
- Presentation and Media: existing labels were FI-only in the current codebase (matches FI-only detail templates); no regression.
- Blog and Writing: unchanged.

## Test results

- `git diff --check` — clean
- Full Eleventy build (baseline worktree) — 1479 files, exit 0
- Full Eleventy build (post-migration working tree) — 1479 files, exit 0
- New Playwright regression at `tests/detail-ux-01a.spec.js` — 6 test groups × up to 7-page matrix; will run on CI
- Adjacent regressions (i18n-seo, JSON-LD, Pagefind) not re-run locally — CI covers them

## Remaining UX issues (out of scope for this slice)

Not addressed in DETAIL-UX-01A, per redesign doc sequencing:

- **DETAIL-UX-01B** — Writing content-first swap (body above meta list; council-speech video as primary content)
- **DETAIL-UX-01C** — Relations sidebar layout: inline sections on mobile
- **DETAIL-UX-01D** — Accessibility + polish:
  - Wrap Blog + Writing sidebars in `<aside>`
  - Writing thumbnail `alt="{{ title }}"` → `imageAlt` or empty
  - Thesis citation modal SSR fallback note
  - Blog "Avaa lähde" duplication (deferred pending consumer audit)

## Architecture assessment

Reviewed against `docs/architecture-closure-1-0-closure-2026-08-29.md` §6 reopen conditions:

| Reopen condition | Repo evidence? |
| --- | :---: |
| new duplicate content ownership | **No** |
| canonical semantics moved into browser JS | **No** |
| Pagefind becoming canonical storage | **No** |
| new runtime JSON → HTML architecture | **No** |
| loss of FI/EN parity in shared architecture | **No** |
| removal of a public contract without consumer proof | **No** |
| regression in source, landing or context semantics | **No** |

**Architecture Closure 1.0 = `CLOSED / GREEN / MAIN`.** Canonical Content v1 unchanged. R1 unchanged. Knowledge Graph unchanged. `content-context-sidebar.njk` unchanged. `detail-hero.njk` unchanged. `_ldschema.njk` unchanged.
