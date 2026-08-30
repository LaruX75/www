# PRES-CONTEXT1 — Presentation Business-Context Editorial Reconciliation

Date: 2026-08-30
Status: `IMPLEMENTED / METADATA COMPLETION`

Completes canonical Presentation `contexts` metadata so that membership
in the `/kouluttaja/` / `business` context is explicit, editorially
justified, and no longer dependent on legacy `sivuyhteys` or on
title/filename regex inference. This is canonical-data completion,
not a schema change and not a new taxonomy.

## Repository state

- Branch: `content/pres-context1-business-reconciliation`
- Base: `origin/main` at `f3e4ee3d1128491087d62c175259609fc34fbc85` (post PR #169 merge).
- Reference documents:
  - `docs/rp-converge-01-company-presentations-convergence-2026-08-30.md` — RP-CONVERGE-01A audit that produced Decision C and identified the canonical-data gap this workstream addresses.
  - `docs/r1a-canonical-related-content-suitability-audit-2026-08-29.md`, `docs/r1-related-content-closure-2026-08-29.md`, `docs/r1-adr1-semantic-related-content-architecture-decision-2026-08-29.md` — R1 closure references (unchanged by this slice).

## Why this work exists

RP-CONVERGE-01A (Decision C, 2026-08-30) proved that no strong canonical relationship existed on `main` to identify the `/kouluttaja/` presentation subset:

- Legacy `sivuyhteys="kouluttaja-sivu"` (57 items in `src/_data/canva-presentations.json`) is editorial marker in the raw Canva import; not documented as canonical authority.
- `contexts.includes("business")` covered only 7 of 139 canonical presentation MDs; all 7 were text-inferred by `inferContexts()` from title/description keywords.
- No presentation MD declared `contexts:` explicitly.

PRES-CONTEXT1 closes that gap by declaring explicit `contexts: - business` on the presentation MDs that editorially qualify, using the already-existing canonical `contexts` vocabulary.

## Canonical `contexts` contract (verified before editing)

- `CONTEXT_ORDER` (from `src/_data/contentSchema.js:124-133`): `business`, `education`, `media`, `open-science`, `personal`, `politics`, `research`, `teaching`. **`business` is a valid Canonical Content v1 value.**
- `CONTEXT_META.business.href === "/kouluttaja/"` (`src/_data/contentContext.js`). Explicit canonical map from `business` context to the FI company / training hub.
- `resolveContexts(data, inputPath)` = union of `normalizeContextList(data.contexts)` (explicit frontmatter) + `inferContexts(...)` (text-heuristic inference). **Explicit augments inferred via `Set`; explicit values are always retained.**
- **No schema change required.** Adding explicit `contexts: - business` on presentation MDs is populating an already-canonical field.

## Business-context editorial definition

For Presentations, `business` means:

> This presentation is materially relevant as evidence or example of Jari Laru's **external training, keynote, workshop, consulting, or other expert-service activity** represented by the `/kouluttaja/` hub — i.e., it was delivered as an external expert/trainer for a paying or commissioning organisation (city, municipality, education provider, professional association, national body such as AVI/OPH, or a public-facing PD/webinar series).

Qualifying examples: externally delivered teacher training (VESO); municipality / education-provider commissioned training; keynote / invited expert talk in a professional-development context; workshop delivered as expert/trainer; webinar delivered as external expert/trainer; professional development session on behalf of a national or regional body.

Non-qualifying examples: ordinary university course lectures and opintojakso material; purely academic conference papers with no external expert-service relevance; internal teaching material; research presentations included only because a title keyword happens to match; anything included by city-name-only heuristic without editorial relevance.

## Legacy evidence

Legacy `sivuyhteys="kouluttaja-sivu"` set in `src/_data/canva-presentations.json`: **57 items** (verified via `canva.tableRows | filter sivuyhteys.includes("kouluttaja-sivu")`).

Of those 57 legacy items:

- **11 legacy entries have a canonical presentation MD counterpart** (via `canva.js` `pageUrl` resolution through `createCanvaPresentationLookup`), mapping to **10 unique canonical MDs** (`simo-veso-2024.md` appears twice in the legacy set — a duplicate legacy entry for the same Canva design).
- **46 legacy entries have NO canonical MD** in `src/presentations/`. They are Canva imports without a canonical detail page. PRES-CONTEXT1 does not create canonical MDs for them (that is a separate content-creation task, out of scope per §17 non-goals).

## Full reconciliation method

1. **Match legacy → canonical**: use `canva.js` (loader that resolves `sivuyhteys` items to their `pageUrl` via `presentationSources.js` → `readLocalPresentationSources` → `createCanvaPresentationLookup`). Items whose `pageUrl` is non-null have a canonical MD counterpart.
2. **Row-level review**: for each matched canonical MD, apply the editorial definition using canonical evidence (`title`, `description`, `event`, `categories`, `topics`, `type`, legacy `kategoria` + `jarjestaja` as evidence signals but not as authority).
3. **False-negative sweep**: score the entire canonical 139-MD corpus against the same editorial signal set to surface MDs that were never marked `kouluttaja-sivu` but should qualify under the editorial definition.
4. **Classify each candidate**: `BUSINESS` (add explicit `contexts: - business`), `NOT BUSINESS` (leave alone), or `REVIEW / AMBIGUOUS` (leave inferred behaviour as-is; document editorial ambiguity).
5. **Preserve existing metadata**: do not touch `title`, `date`, `url`, `sourceUrl`, `pageUrl`, `thumbnail`, `type`, `source`, `categories`, `topics`, `keywords`, layout, or body.

## Legacy 57-item reconciliation summary

| Bucket | Count | Notes |
| --- | ---: | --- |
| Legacy with canonical MD → BUSINESS | 10 (11 legacy entries, 10 unique canonical MDs) | See row-level table below. |
| Legacy with canonical MD → NOT BUSINESS | 0 | Every matched item was editorially BUSINESS. |
| Legacy with canonical MD → REVIEW | 0 | — |
| Legacy without canonical MD | 46 | Canva imports lacking a canonical presentation MD. No metadata change possible in this slice. See "Unmatched legacy" appendix. |

### Row-level table — 10 unique canonical MDs matched from the legacy set

| Canonical MD | Date | Legacy `kategoria` / `jarjestaja` | Categories | Editorial decision | Rationale |
| --- | --- | --- | --- | --- | --- |
| `kempele-veso-2026.md` | 2026-01-21 | täydennyskoulutus / Kempeleen kunta (VESO-koulutus) | VESO, Opettajankoulutus, Tekoäly | **BUSINESS** | Externally commissioned VESO delivered for the city of Kempele. |
| `riihim-ki-veso-2026.md` | 2026-01-22 | täydennyskoulutus / Riihimäen kaupunki (VESO-koulutus) | VESO, Opettajankoulutus, Tekoäly | **BUSINESS** | Externally commissioned VESO delivered for the city of Riihimäki. |
| `konen-k-vibe-robotiikka-riihim-ki-robokampus-2026.md` | 2026-01-20 | täydennyskoulutus / Riihimäen Robokampus 2026 | Robotiikka, Koneäkö, Ohjelmointi, Koulutus | **BUSINESS** | External expert delivery at a municipal Robokampus training event. |
| `kohti-kriittist-teko-lylukutaitoa-2026-finnoschool.md` | 2026-02-16 | täydennyskoulutus / Finnoschool / LUKUTAITO-koulutus | Tekoälylukutaito, Opettajankoulutus, Koulutus | **BUSINESS** | Commissioned Finnoschool LUKUTAITO teacher-PD keynote. |
| `opettaja-teko-lyn-ja-lytt-myyden-turbulenssissa-tampere-2025.md` | 2025-10-30 | täydennyskoulutus / Tampereen kaupunki (opettajankoulutuspäivä) | Tekoäly, Opettajuus, Konferenssi | **BUSINESS** | Externally delivered opettajankoulutuspäivä for the city of Tampere. |
| `kokkola-2025-teko-ly-opettajan-yst-v-vai-viho.md` | 2025-09-30 | täydennyskoulutus / Kokkolan kaupunki (opettajien koulutus) | Tekoäly, Opettajuus, Koulutus | **BUSINESS** | Externally delivered teacher training for the city of Kokkola. |
| `monilukutaito-on-opettajan-supervoima-teko-lylukutaito-luento.md` | 2024-09-27 | täydennyskoulutus / Monilukutaito-koulutushanke | Tekoälylukutaito, Monilukutaito, Luento, Opettajankoulutus | **BUSINESS** | External delivery for a national Monilukutaito PD programme. |
| `pori-kerava-millaisia-teko-lytaitoja-peruskoulussa-tulisi-opettaa-2020-luvulla.md` | 2024-11-21 | täydennyskoulutus / Porin tutorpäivät (myös Keravan digitutorit) | Tekoälytaidot, Peruskoulu, Koulutus | **BUSINESS** | Externally commissioned tutor-day PD for the cities of Pori and Kerava. |
| `digierko2024-risteilyesitys.md` | 2024-11-29 | konferenssi-keynote / DIGIERKO (digitaalisen erityisosaamisen erikoistumiskoulutus) | Digitalisaatio, Erityisopetus, Koulutus | **BUSINESS** | External expert delivery for the national DIGIERKO specialisation-education programme. |
| `simo-veso-2024.md` | 2024-08-30 | täydennyskoulutus / Simon kunta (VESO-päivä + rinnakkainen tiivistelmäesitys) | VESO, Opettajankoulutus, Digitalisaatio | **BUSINESS** | Externally commissioned VESO for the municipality of Simo (two legacy entries — VESO + parallel tools session — for the same canonical MD). |

## False-negative audit — canonical MDs classified BUSINESS but not in the legacy 57

Heuristic sweep over the 139-MD corpus surfaced training-adjacent canonical MDs that were never marked `sivuyhteys="kouluttaja-sivu"`. Each was editorially reviewed:

| Canonical MD | Date | Categories | Editorial decision | Rationale |
| --- | --- | --- | --- | --- |
| `tekoaly-opetuskaytto-avi-webinaari-2024.md` | 2024-10-01 | Tekoäly, Opettajankoulutus, Koulutus, Varhaiskasvatus | **BUSINESS (false negative)** | AVI (Regional State Administrative Agency) commissioned webinar for teachers; externally delivered as expert/trainer. Fits the definition; was inferred-only before because the title contains "webinaari". Now explicitly declared. |
| `ss-osaava-veso-tieto-ja-viestintatekniikka-pedagogisena-tyovalineena-raahe-2015.md` | 2015-10-10 | (SlideShare — categories not populated) | **BUSINESS (false negative)** | OSAAVA-hanke VESO delivered for Raahe teachers; externally commissioned municipal PD. Fits the definition. Was inferred-only via title text; now explicitly declared. |

### Review / ambiguous candidates — not tagged in this slice

| Canonical MD | Reason left as REVIEW | Behaviour after PRES-CONTEXT1 |
| --- | --- | --- |
| `ss-designing-and-supporting-use-of-emergent-technology-in-teacher-education-case-ic.md` | Academic conference paper about ICT workshops for teacher-education students — the presentation is *about* workshops, not itself an external commissioned training delivery. | Remains inferred-only via `inferContexts` matching "workshop" in title. Explicit membership deferred to editorial decision. |
| `ss-lito2018-workshop-arviointi-suurilla-verkkokursseilla.md` | Academic conference workshop (LITO2018) about evaluation on large online courses — not a commissioned external PD. | Remains inferred-only via `inferContexts` matching "workshop" in title. Explicit membership deferred to editorial decision. |
| `opi-oulu-2026-tekoalyaiheinen-paneelikeskustelu.md` | Panel discussion at an OPI Oulu educator event — the format (paneelikeskustelu) does not clearly fit the "external commissioned training/keynote/workshop" definition. | Remains as-is (`teaching` inferred, no business); explicit membership deferred to editorial decision. |

## Explicit metadata changes

Twelve canonical MDs edited. Each received a new `contexts:` block with a single member `business`, inserted after the existing `topics:` block (or before the closing frontmatter delimiter where no `topics:` existed). No other frontmatter fields were touched; no body text changed.

Files edited (12):

- `src/presentations/kempele-veso-2026.md`
- `src/presentations/riihim-ki-veso-2026.md`
- `src/presentations/konen-k-vibe-robotiikka-riihim-ki-robokampus-2026.md`
- `src/presentations/kohti-kriittist-teko-lylukutaitoa-2026-finnoschool.md`
- `src/presentations/opettaja-teko-lyn-ja-lytt-myyden-turbulenssissa-tampere-2025.md`
- `src/presentations/kokkola-2025-teko-ly-opettajan-yst-v-vai-viho.md`
- `src/presentations/monilukutaito-on-opettajan-supervoima-teko-lylukutaito-luento.md`
- `src/presentations/pori-kerava-millaisia-teko-lytaitoja-peruskoulussa-tulisi-opettaa-2020-luvulla.md`
- `src/presentations/digierko2024-risteilyesitys.md`
- `src/presentations/simo-veso-2024.md`
- `src/presentations/tekoaly-opetuskaytto-avi-webinaari-2024.md`
- `src/presentations/ss-osaava-veso-tieto-ja-viestintatekniikka-pedagogisena-tyovalineena-raahe-2015.md`

## Before / after coverage

| Metric | Before PRES-CONTEXT1 | After PRES-CONTEXT1 |
| --- | ---: | ---: |
| Canonical presentation MDs total | 139 | 139 |
| MDs with **explicit** `contexts:` frontmatter | 0 | 12 |
| MDs with `contexts.includes("business")` — **explicit** | 0 | 12 |
| MDs with `contexts.includes("business")` — **inferred only** | 7 | 2 |
| MDs with `contexts.includes("business")` — **resolved (union)** | 7 | 14 |
| Legacy `sivuyhteys="kouluttaja-sivu"` items with canonical MD | 11 (10 unique) | 11 (10 unique) — unchanged |
| Legacy items with canonical MD now explicitly `business` | 4 (inferred) | **10 (explicit)** |

## Explicit vs inferred membership

- **12 MDs** now have `business` as **editorially authoritative** membership (explicit `contexts:` in frontmatter). Downstream consumers (templates, filters, tests) can distinguish editorial truth from fallback inference by inspecting `data.contexts` directly.
- **2 MDs** (`ss-designing-…`, `ss-lito2018-workshop-…`) retain `business` as **inferred-only** membership because they matched `inferContexts` line 189–199 text patterns (`workshop`) but were editorially classified as REVIEW / NOT BUSINESS in this slice. Their inference is unchanged; a future editorial decision could either (a) declare them explicitly, or (b) refine the `inferContexts` heuristic to exclude them.
- `inferContexts` is **not modified** in this slice (per §9 non-goals: this workstream is metadata completion, not inference-code change).

## Ambiguous items

Three items are documented as REVIEW (see the "Review / ambiguous candidates" table above). They remain in their pre-PR resolution state:

- `ss-designing-…` — inferred `business + teaching`.
- `ss-lito2018-workshop-…` — inferred `business + teaching`.
- `opi-oulu-2026-tekoalyaiheinen-paneelikeskustelu.md` — inferred `teaching` only.

## Canonical Content v1 assessment

**Canonical Content v1 contract was not changed; existing canonical metadata was completed.**

- `business` is already a member of `CONTEXT_ORDER` (`src/_data/contentSchema.js:125`).
- `contexts` is already the canonical field for context membership (used by R1's `content-context-sidebar.njk`, by hub navigation via `CONTEXT_META`, and by `computeRelatedContent` scoring).
- No schema, no vocabulary, no aliases, no `inferContexts` heuristics, no `resolveContexts` behaviour was changed.
- No new field, no new taxonomy, no new relationship kind was introduced.

## RP-CONVERGE-01 unblock assessment

**`RP-CONVERGE-01 = UNBLOCKED`**

The four RP-CONVERGE-01A blockers are addressed:

1. **The intended recent company-page presentation examples are all explicitly `business`** — the three latest are `riihim-ki-veso-2026.md` (2026-01-22), `kempele-veso-2026.md` (2026-01-21), and `konen-k-vibe-robotiikka-riihim-ki-robokampus-2026.md` (2026-01-20), each explicitly `contexts: - business`.
2. **The canonical business set has coherent editorial semantics** — every explicit-`business` MD was reviewed against the operational definition; each is an external commissioned training / keynote / webinar / workshop / PD delivery.
3. **Selection can be performed from canonical Presentation content without title/filename regex** — a resumed RP-CONVERGE-01 can filter `collections.presentations` where the MD's own frontmatter declares `contexts: [ ..., "business", ... ]` (or use the resolved contexts via a filter). No `presentationContextGroups` regex authority. No `sivuyhteys` dependency.
4. **`sivuyhteys` is no longer needed to determine company-page membership** — the canonical explicit set is the editorial truth; `sivuyhteys` remains as legacy Canva import metadata but is no longer the operative authority for `/kouluttaja/`.

Additional non-regressions:

5. **No new taxonomy / context value was introduced.** `business` is the existing canonical vocabulary member.
6. **Source / landing semantics remain unchanged.** No `url`, `sourceUrl`, `pageUrl`, `thumbnail`, `source`, `type` fields were touched.

Not implemented in this PR (per §14): the resumed RP-CONVERGE-01 (replace the `/kouluttaja/` strip's selection with a canonical explicit-business filter, then delete `related-presentations.njk`) is a separate PR.

## Architecture Closure assessment

**Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.**

- This work is canonical metadata completion; not architecture migration.
- No AC1 reopen condition triggered:
  - Explicit `contexts` was already the authoritative field; PRES-CONTEXT1 only populates it more completely.
  - No browser/runtime system owns membership.
  - No conflicting canonical authorities introduced.
  - Source / landing / context contract remains internally consistent.
- **R1 remains `CLOSED / MAINTENANCE`.** No R1 surface touched; R1's `content-context-sidebar.njk` continues to consume `contexts` unchanged.

## Stopping condition

PRES-CONTEXT1 is complete when all six are true:

1. ✅ Canonical `contexts` contract inspected and confirmed to support the intended use without schema change.
2. ✅ Editorial definition of `business` for presentations documented.
3. ✅ Legacy 57-item set fully reconciled (10 unique canonical matches classified; 46 unmatched documented as out of scope).
4. ✅ False-negative sweep run over the 139-MD corpus; 2 additional BUSINESS items surfaced and tagged; 3 REVIEW items documented.
5. ✅ 12 canonical MDs edited with explicit `contexts: - business` frontmatter; YAML validates; build passes; unit tests pass.
6. ✅ RP-CONVERGE-01 unblock assessment completed with `UNBLOCKED` outcome.

RP-CONVERGE-01 resumption is a separate PR.
