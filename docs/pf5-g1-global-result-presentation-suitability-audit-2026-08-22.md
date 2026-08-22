# PF5-G1 Global Result Presentation — Implementation Suitability Micro-Audit

## Status

AUDIT.

Micro-audit only. No production code changed.

## Baseline

- **Branch:** `pf5/g1-suitability`
- **Worktree:** `/private/tmp/www-pf5-g1`
- **Base:** `origin/main` = `5246b748801f9cca8e6c2dcd84b96516295c7445` (post PF5-audit merge)
- **HEAD at audit start:** `5246b748801f9cca8e6c2dcd84b96516295c7445` (no commits on branch)
- **Pagefind version pinned in `package.json`:** `^1.5.2`; installed `node_modules/pagefind/package.json` → **1.5.2** (PROVEN).
- **Runtime assets produced by CLI into `_site/pagefind/` (PROVEN, from a fresh build in this worktree):** `pagefind-ui.js`, `pagefind-ui.css`, `pagefind-modular-ui.js`, `pagefind-modular-ui.css`, `pagefind-component-ui.js`, `pagefind-component-ui.css`, `pagefind-highlight.js`, `pagefind.js`, `pagefind-worker.js`, WASM binaries.

## Audit scope

Single question:

> What is the smallest and architecturally correct mechanism to replace the stock generic PagefindUI result presentation on the four global surfaces (navbar FI, navbar EN, `/haku/`, `/en/search/`) with a shared PF4/PF5 result presentation, **without** introducing a parallel search UI architecture and **without** duplicating `find-explore.js`'s runtime into JS?

Non-goals: G2 (presentations), G3 (media 11b/11c), G4 (writings) — this audit records the implications of G1's evidence for them but does not decide them.

## Current data flow

```
canonical Nunjucks record
  → src/src.11tydata.js#resolvePagefindDocument
       → publications: src/_utils/publicationsFindExplore.js#buildPublicationFindExploreDocument
       → theses:       src/_utils/thesesFindExplore.js#buildThesisFindExploreDocument
       → writings:     inline resolvePagefindWritings
       → presentations: scripts/_lib/presentationPagefind.js#buildPresentationCustomRecord
       → media:        src/_includes/media-item.njk emits data-pagefind-meta / filter
  → base.njk emits <span hidden data-pagefind-meta="…"> and <span hidden data-pagefind-filter="…">
  → Pagefind CLI indexes into _site/pagefind/*
  → runtime: stock PagefindUI (window.PagefindUI) on:
       - navbar FI (src/_includes/_nav-fi.njk:700 + src/js/site-ui.js:611)
       - navbar EN (src/_includes/_nav-en.njk:669 + src/js/site-ui.js:611)
       - /haku/    (src/fi/haku.njk:49    + src/js/site-search-page.js:39)
       - /en/search/ (src/en/search.njk:49 + src/js/site-search-page.js:39)
  → default PagefindUI template: title link + excerpt + filter pills. No PF4/PF5 semantics.
```

## Pagefind 1.5.2 capability findings

All mechanism-relevant findings are **PROVEN** by grepping the runtime bundles produced by the pinned dependency in this worktree.

### PagefindUI Default (`/pagefind/pagefind-ui.js`)

Option surface (from the destructured `e.*` chain in the bundle):
- `element`, `bundlePath`, `pageSize`, `resetStyles`, `showImages`, `showSubResults`, `excerptLength`, `showEmptyFilters`, `openFilters`, `debounceTimeoutMs`, `mergeIndex`, `translations`, `autofocus`, `focusOnSlash`, `sort`
- **Presentation hooks**: `processResult` and `processTerm`

`processResult` usage in the bundle (PROVEN):
```
t(1, n = await c.data()),
t(1, n = a?.(n) ?? n),         // ← a = processResult; called with data object, may return modified data
n.meta?.image && t(1, n = {...n, meta: {...n.meta, image: C(...)}}),
```

- `processResult` is a **data-transformation** callback that mutates/replaces the *result data object* before the fixed Svelte-compiled template renders it.
- It does NOT let the caller substitute an alternative HTML template.
- Any presentation change through this path must go through Pagefind's default row template shape (title link, excerpt, filter pills, sub-results, optional image).

### PagefindUI Modular (`/pagefind/pagefind-modular-ui.js`)

Exported components (PROVEN, from the bundle's assignment block `b(f, { … })`):
- `Instance` — shared search state; accepts `bundlePath`, `mergeIndex`, `processResult`, `processTerm`, `debounceTimeoutMs`, `translations`
- `Input` — search input primitive
- `FilterPills` — filter surface primitive
- `Summary` — result count / summary primitive
- `ResultList` — result list primitive; accepts **`resultTemplate`** and **`placeholderTemplate`** — both are functions returning HTML (verified in bundle: `this.resultTemplate = e.resultTemplate ?? y`).

`ResultList` builds its own container and calls `resultTemplate(data)` per result. The author fully owns the per-result DOM.

### Pagefind Component UI (`/pagefind/pagefind-component-ui.js`)

Custom elements registered (PROVEN via `customElements.define`):
- `<pagefind-search>`, `<pagefind-input>`, `<pagefind-results>`

Uses Handlebars-like `template` attribute; example template shown in bundle:
```
<li class="pf-result">
  <div class="pf-result-card">
    {{#if and(options.show_images, meta.image)}}<img …>…{{/if}}
    …
```

Templating is Pagefind-specific string DSL, not a JS function.

### Direct Pagefind Search API (`/pagefind/pagefind.js`)

Exports (PROVEN, method names in bundle):
- `init`, `search`, `debouncedSearch`, `filters`, `preload`, `loadFragment`, `loadChunk`, `mergeIndex`, `destroy`, `options`, `enterPlaygroundMode`

Zero UI. Caller owns input, filters, list, pagination, focus management, i18n.

### Summary table

| Mechanism | Ships in 1.5.2? | Template ownership | Generated-asset size (see note below) | Migration cost from current PagefindUI Default | Notes |
|---|---|---|---|---|---|
| PagefindUI Default `processResult` | Yes (already in use, callback not installed) | Data-only; template fixed | current baseline | Small | Cannot replace HTML template. Presentation only via data injection. |
| PagefindUI Default subclassing / DOM patch | Not a public API | N/A | N/A | High + brittle | NO-GO. |
| PagefindUI Modular (`ResultList.resultTemplate`) | Yes | Full per-result HTML via JS function | substantially smaller than the Default UI asset in this audited build | Medium (rebuild input/filters/summary composition) | Author-owned templates; composes with `Instance` + `Input` + `FilterPills` + `Summary`. |
| Pagefind Component UI | Yes | Full per-result HTML via Handlebars DSL | larger than the Default UI asset in this audited build | Medium (adopt custom elements, translate DSL) | DSL not a JS function; ergonomics don't match existing `find-explore.js` renderer style. |
| Direct Search API | Yes | Full site-owned UI | smaller than the Default UI asset, but plus all app UI code | High (re-implement input, filters, count, pagination, translations) | Effectively rebuilds what PagefindUI Default gives us. |

### Note on generated-asset size

The comparisons above refer to the **raw byte size of the generated JS file** (minified but not gzipped) in `_site/pagefind/*` produced by the pinned Pagefind 1.5.2 CLI during a build in this worktree, measured with `wc -c` (PROVEN). Order of the four generated JS files, largest → smallest in this build: `pagefind-component-ui.js` > `pagefind-ui.js` > `pagefind.js` > `pagefind-modular-ui.js`.

This is **not** a network-transfer or performance claim. Actual over-the-wire size (gzip/brotli), first-paint impact, wasm/worker warm-up, defer/preload behaviour, and cache-hit rates are P1 concerns. Do not translate raw file size into a performance-savings promise inside G1.

## Global result metadata matrix

**Per-domain metadata visible to a global consumer of a Pagefind result** — enumerated from the actual `data-pagefind-meta` / `data-pagefind-filter` emitters currently in the tree. This lists what a shared presenter would receive on the global surface, and whether that suffices for the PF4/PF5-audited card semantics.

Notation: field name / Pagefind projection / available on global result? / authoritative meaning / needed by PF4/PF5 shared presenter?

### Publications *(source: `src/_utils/publicationsFindExplore.js:152`)*

| field | Pagefind projection | on global result? | authoritative meaning | needed by presenter? |
|---|---|---|---|---|
| `url` | Pagefind built-in | Yes (`data.url`) | canonical `pageUrl` | yes (title link) |
| year | `meta.publicationYear` | Yes | publication year | yes (family header) |
| authors | `meta.publicationAuthors` | Yes | joined author line | yes (primary meta) |
| type code | `meta.publicationType` / `meta.publicationTypeCode` | Yes | OKM code (A1, A2, …) | yes (primary meta / type chip) |
| type label | `meta.publicationTypeLabel` | Yes | localized long label | yes (primary meta) |
| venue | `meta.publicationVenue` / `publicationJournal` / `publicationPublisher` | Yes | journal or publisher | yes (primary meta) |
| description | `meta.publicationDescription` (snippet 260 chars) | Yes | short description | optional |
| DOI | `meta.publicationDoi` / `publicationDoiUrl` | Yes | DOI + link | optional (action row on card) |
| source | `meta.publicationSourceUrl` / `publicationSourceLabel` | Yes | external source (Research.fi) | optional (action row on card) |
| peer-reviewed | `meta.publicationPeerReviewed` = `"true"`/`""` | Yes | boolean-as-string | yes (quality line) |
| open access | `meta.publicationOpenAccess` | Yes | boolean-as-string | yes (quality line) |
| JUFO | `meta.publicationJufoLevel` | Yes | level 0/1/2/3 | yes (quality line) |
| citation count | `meta.publicationCitationCount` | Yes | integer-as-string | optional |
| CSL | `meta.publicationCsl` | Yes (JSON string) | CSL-JSON for APA rendering | yes (APA body, if adopted) |
| content family | `filter Sisältö:Julkaisut` + `FindExplore:publications` | Yes (via `filters`) | family badge | yes (family header) |
| language | `filter Kieli:*` | Yes | language | preserved by ranking filter |

**Verdict:** publications meta surface is sufficient for the full PF4/PF5-APA7 card contract, including quality line. No new metadata required for the shared global presenter.

### Theses *(source: `src/_utils/thesesFindExplore.js` `meta` block)*

| field | Pagefind projection | on global result? | needed by presenter? |
|---|---|---|---|
| `url` | built-in | Yes | yes |
| year | `meta.thesesYear` | Yes | yes (family header) |
| author line | `meta.thesesAuthorLine` | Yes | yes (primary meta) |
| type | `meta.thesesType` | Yes | yes (primary meta — Master's/Bachelor's) |
| role | `meta.thesesRole` | Yes | yes (primary meta — supervised/reviewed) |
| source URL | `meta.thesesSourceUrl` | Yes | optional (OuluREPO action) |
| description / abstract snippet | `meta.thesesDescription` (260 chars) | Yes | optional (excerpt-shaped fallback) |
| content family | `filter Sisältö:Opinnäytteet` | Yes | yes |

**Verdict:** theses meta surface is sufficient. `thesisTypeRoleLabel` composition can happen entirely in the shared presenter using `thesesType` + `thesesRole`.

### Writings *(source: `src/src.11tydata.js` `resolvePagefindWritings`)*

| field | Pagefind projection | on global result? | needed by presenter? |
|---|---|---|---|
| `url` | built-in | Yes | yes |
| year | `meta.writingsYear` | Yes | yes |
| content type | `meta.writingsContentType` (e.g. `opinion`, `blog`, …) | Yes | yes (primary meta via `writingsTypeLabel` map) |
| content family | `filter Sisältö:Kirjoitukset ja puheenvuorot` + `FindExplore:writings` | Yes | yes |
| description / lead | **NOT projected** as meta | **No** — only Pagefind's own excerpt from indexed content | see gap below |
| categories | `filter Writings topic:*` (up to 6) | Yes as filters; not accessible on `data.meta` | filters may not surface in `processResult`/`resultTemplate` payload identically to meta — needs verification |
| publication source | not projected | **No** | not currently available |

**Metadata gap (NEEDS FOLLOW-UP, not for this audit to resolve):** the current `writings-curated-list.njk` SSR card shows `date`, `description` (135 chars), up to 2 category badges + publication badge. Of these, **description and publication are not surfaced through Pagefind meta**. Categories are surfaced only through filter names.

**Consequence for G4:** the current PF4 reduced writings card (family + title + `writingsTypeLabel` + excerpt) is **the maximum a shared presenter can produce without adding new Pagefind meta** — which the roadmap forbids inside a G1 slice. G4-A (converge to SSR curated-list) is therefore blocked at the metadata layer unless writings meta is deliberately widened. The reduced variant may be the correct answer regardless of visual convergence preferences.

### Presentations *(source: `scripts/_lib/presentationPagefind.js#buildPresentationPagefindMeta`)*

| field | Pagefind projection | on global result? | needed by presenter? |
|---|---|---|---|
| `url` | built-in — `record.preferredLandingUrl` | Yes | yes (title link; landing-aware) |
| year | `meta.PresentationYear` | Yes | yes (family header) |
| event | `meta.PresentationEvent` | Yes | yes (primary meta) |
| type | `meta.PresentationType` | Yes | yes (primary meta) |
| role | `meta.PresentationRole` | Yes | optional |
| landing type | `meta.PresentationLandingType` (external / local) | Yes | yes (external/local badge) |
| landing URL | `meta.PresentationLandingUrl` (== url) | Yes | yes |
| media type | `meta.PresentationMediaType` | Yes | optional (icon selection) |
| source type | `meta.PresentationSourceType` | Yes | yes (source label) |
| content family | derived (see note) | Partially | see note |
| research context | `meta.ResearchContext == "research"` | Yes | preserved by canonical membership |
| thumbnail | **NOT projected** | **No** | not needed for shared global card (PF5-APA7 §17 Phase 2 decided icon-only) |

**Note on content family:** presentations do not currently emit `filter Sisältö:Esitykset` from `buildPresentationPagefindFilters` in the same way publications/theses/writings do (they emit their own family label under a different name inside `filters`). PROVEN: `_site/pagefind/*` produced; the shared presenter can classify a presentation result via presence of `meta.PresentationId` or `meta.PresentationLandingType`. **NEEDS FOLLOW-UP** to confirm PF3-style family-badge label emission on global surface (the family-header helper in `find-explore.js` reads `entry.contentFamilyLabel` from the kind config, not from Pagefind meta directly). This is a shared-presenter extraction consideration, not a Pagefind-meta gap.

**Verdict:** presentation meta is sufficient for the icon-only shared horizontal variant sanctioned by PF5-APA7 §17 Phase 2. Family-label projection may need a small helper on the extracted presenter side.

### Media *(source: `src/_includes/media-item.njk:13-30`)*

| field | Pagefind projection | on global result? | needed by presenter? |
|---|---|---|---|
| `url` | built-in | Yes | yes |
| mediaType | `meta.mediaType` + `filter Mediatyyppi:*` | Yes | yes (primary meta / icon) |
| mediaRole | `meta.mediaRole` + `filter Rooli:*` | Yes | yes (primary meta) |
| mediaOutlet | `meta.mediaOutlet` | Yes | yes (primary meta or badge) |
| year | `meta.year` + `filter Vuosi:*` | Yes | yes (family header) |
| date | `meta.date` (ISO) | Yes | yes (formatted date) |
| content family | `filter Sisältö:Mediassa` | Yes (via filters) | yes (family header) |
| thumbnail | **NOT projected** | **No** | not needed for the icon-only variant |

**Verdict:** media meta is sufficient for a shared media presenter that mirrors PF5-APA7 §17 Phase 3 intent. The 11b (extend shared-renderer `kind`) vs 11c (surface-specific presenter) decision is orthogonal to G1's mechanism choice; both remain viable.

### Global surface metadata summary

- All four global surfaces already receive the meta above (they run on the same Pagefind index used by F&E).
- No new Pagefind metadata is required to run a shared PF4/PF5 presenter on global for **publications, theses, presentations, media**.
- The one **NEEDS FOLLOW-UP** gap is **writings description + publication badge**: not projected today, and adding them requires either widening `resolvePagefindWritings` meta or accepting that the reduced writings card is the correct output regardless of surface. **Do not resolve inside G1.**

## Presenter ownership / extraction analysis

Inventory of `src/js/find-explore.js` (1233 LOC) split by responsibility. File-scope vs closure-scope matters for extraction.

### File-scope pure presenter helpers (extractable as-is)

- `escapeHtml` (line 49) — pure.
- `resultTitle(data)` (line 75) — pure; picks title from Pagefind data.
- `contentFamilyLabelFromData(kind, data)` (line 90) — pure; maps `kind → SISALTO_LABELS[kind]`.
- `renderFamilyHeader(entry)` (line 98) — pure; produces the `<div class="find-explore-result-family">…</div>` fragment from `entry.contentFamilyLabel` + `entry.year` + `entry.kind`.
- `renderPrimaryMetaLine(entry)` (line 112) — pure; joins `entry.meta[]` with middot separator into `<p class="find-explore-result-primary-meta">`.
- `SISALTO_LABELS` map + `kindConfig` object (~line 340+) — declarative; `kindConfig[kind].resultMeta(entry)` and `.excerpt(data, record)` are pure functions.

These five helpers plus `kindConfig` are **the exact PF4 shared-card contract** the audit is trying to reuse on global surfaces. They contain no Pagefind state and no DOM mutation.

### `initMount`-scope helpers currently closed over mount state (extractable with parameter-passing)

Located inside `initMount(mount)` closure (from line 618):
- `citationButton(record)` (718) — closes over `labels`, `locale`.
- `publicationCitationBody(entry)` (738) — reads `labels`, `locale`; can be rewritten to take them as parameters.
- `publicationQualityLine(record)` (761) — reads `labels`.
- `sourceLink(record)` (772) — reads `labels`.
- `renderPublicationCardResult(entry)` (778) — calls all of the above.
- `publicationSourceCell(record, title)` (797), `renderPublicationArchiveRow(entry)` (811).
- `renderResultEntry(entry)` (920) — the top-level branch: publications → card or archive-row; theses → `<tr>`; else → generic `<li>`.
- `renderGroupedResults`, `renderPublicationArchiveGroups` — grouped output; specific to F&E archive context. Global has no grouping requirement.

Each of these can be rewritten as a pure function taking `(entry, { labels, locale })`. The refactor is real but scoped — nothing here mutates external state.

### Mount runtime (must NOT move to global surface)

Everything else in `initMount`: `runSearch`, `renderResults` (which injects into `data-find-explore-results` DOM node and does archive-row replacement), `readState`, `writeState`, `updateUrl`, `filtersFor`, `filtersForKind`, `readRecords`, `sortThesisEntries`, `sortPublicationEntries`, plus mount-level event wiring.

These own the F&E mount contract (URL sync, filter chips, archive row replacement, mount-specific sort state). They are not needed by a global surface using Pagefind's ranking as-is with no F&E-style filter panel.

### Extraction feasibility

**Feasible without expanding abstraction.** A small `src/_utils/searchPresenter.js` module (JS-side sibling of `src/_utils/`'s Node-only helpers) can host: `renderFamilyHeader`, `renderPrimaryMetaLine`, `renderPublicationCardResult`, `renderPublicationArchiveRow` shape (only the card, not the archive row for global), theses row shape, and the `kindConfig` projections needed for primary meta lines.

The global consumer (site-search-page.js + navbar mount) imports the shared presenter and passes it to whichever Pagefind mechanism is chosen. `find-explore.js` continues to own the F&E runtime and imports the same shared presenter.

**Not an expansion of abstraction:** the pure helpers already exist as pure functions inside `find-explore.js`. Extraction is a physical move, not a design change. Duplication is REDUCED (both F&E and global surfaces share one presenter definition), not introduced.

**Do NOT extract:** the mount runtime. Global surfaces do not need it and importing `find-explore.js` wholesale would pull unused ranking/filter/sort code into the navbar bundle.

## Mechanism comparison matrix

| Dimension | A. PagefindUI Default + `processResult` | B. PagefindUI Default subclass / DOM patch | **C. PagefindUI Modular (`ResultList.resultTemplate`)** | D. Component UI (`<pagefind-results>` template) | E. Direct Search API |
|---|---|---|---|---|---|
| Pagefind 1.5.2 support | Yes (PROVEN) | Not a public API (PROVEN: no exported hook) | Yes (PROVEN) | Yes (PROVEN) | Yes (PROVEN) |
| Implementation size | Small (add callback + data injection) but fits fixed template | High (patch Svelte-compiled bundle) | Medium (compose Instance + Input + FilterPills + Summary + ResultList with shared presenter) | Medium (adopt custom elements + Handlebars template DSL) | High (re-implement input, filters, count, pagination, translations) |
| Reuse of existing PF4/PF5 semantics | Partial (can shape data but template shape is Pagefind's, not PF4's) | N/A | **Full** (author-owned resultTemplate is exactly the PF4/PF5 card shape) | Full (via DSL, awkward to keep in sync with JS presenter) | Full but at high cost |
| Duplication risk | Low (no new renderer) but wrong presentation model | High | Low (single shared renderer imported by both F&E and global) | Medium (DSL template diverges from JS presenter over time) | High (re-implements PagefindUI Default) |
| Accessibility risk | Low — inherits Default UI a11y | High — patched Svelte output | Low — Modular UI primitives are the same lib as Default, just decomposed | Medium — custom elements shadow DOM interaction; extra a11y audit required | High — self-owned a11y for every control |
| Navbar compatibility | Yes (in use today) | N/A | Yes (Instance + Input + Summary + ResultList compose into any container) | Yes | Yes |
| `/haku/` + `/en/search/` compatibility | Yes | N/A | Yes | Yes | Yes |
| FI/EN parity | Preserved (existing translations) | N/A | Preserved (translations option on Instance) | Preserved (translations attribute) | Preserved (author-owned) |
| Ranking preservation | Yes (Pagefind owns ranking) | Yes | Yes | Yes | Yes |
| Metadata sufficiency | Depends on template; template is fixed → cannot render PF4 hierarchy | N/A | Yes for publications / theses / presentations / media; writings gap noted | Yes (same data surface) | Yes (same data surface) |
| Deletion opportunity | Minimal (stock Default row remains the DOM) | N/A | **Substantial** — removes stock Default row DOM from four surfaces; enables one shared presenter | Substantial | Substantial but comes with new code |
| Migration risk | Low but doesn't reach goal | Very high | Medium — one-surface pilot recommended before rolling to all four | Medium — new templating DSL to maintain | High — big rewrite for four surfaces |
| **Classification** | REDUCE (cannot reach PF4/PF5 shape) | NO-GO | **GO with pilot** | REDUCE (works, worse ergonomics + larger bundle) | NO-GO (over-scope) |

## Recommended G1 architecture

**Recommendation: GO on Mechanism C (PagefindUI Modular UI) with a one-surface pilot.**

Reasoning:
- **PROVEN capability:** `ResultList.resultTemplate(data): string|Element` is a function-based per-result template. It is exactly the extension surface PF4/PF5 semantics need.
- **PROVEN sufficiency:** metadata already projected by canonical → Pagefind is sufficient for publications, theses, presentations, and media on the shared presenter. Writings has a metadata gap that is out of G1's scope.
- **No parallel search UI architecture:** Modular UI is the same Pagefind library, decomposed. It reuses the same index, the same wasm core, the same translations. No SPA-search layer is created.
- **No wholesale duplication of `find-explore.js`:** only the small, already-pure PF4/PF5 presenter helpers get physically moved to a shared module. `find-explore.js`'s mount runtime is not imported by global surfaces.
- **Generated-asset comparison** (per note above): the Modular UI generated asset in this audited build is substantially smaller than the Default UI asset. Site-owned shell code (input/filters/summary composition + translations) adds some code on the site side. Whether the net over-the-wire impact is neutral, better, or worse depends on how the shell is authored, and is a P1 question, not a G1 claim.

**Recommended shape (contract, not implementation):**

```
src/_utils/searchPresenter.js (or similar)
  ├── renderFamilyHeader(entry)     — pure
  ├── renderPrimaryMetaLine(entry)  — pure
  ├── projectPublicationEntry(data) — pure; returns {url, kind, year, meta, contentFamilyLabel, …}
  ├── projectThesisEntry(data)      — pure
  ├── projectWritingEntry(data)     — pure (reduced form; no description/publication)
  ├── projectPresentationEntry(data)— pure
  ├── projectMediaEntry(data)       — pure  (subject to G3 11b/11c decision)
  ├── renderSharedCard(entry, {labels, locale}) — pure; dispatches by kind
  └── SISALTO_LABELS

src/js/site-search-page.js (rewritten)
  ├── imports pagefind-modular-ui  (Instance, Input, FilterPills, Summary, ResultList)
  ├── imports searchPresenter
  ├── composes UI shell (input, filters panel, summary, result container)
  └── ResultList({ resultTemplate: (data) => renderSharedCard(projectByKind(data), …) })

src/js/site-ui.js (navbar mount) — same pattern, smaller shell

src/js/find-explore.js
  ├── imports searchPresenter (same source)
  └── unchanged mount runtime; renderer functions replaced by shared presenter
```

**Explicit invariants (must hold across the pilot and the rollout):**
- `pageUrl` / `sourceUrl` / `externalUrl` / landing semantics **preserved** — the shared presenter reads landing info from the projections above; canonical remains authoritative.
- Ranking **not reordered or grouped** on global surfaces.
- No new Pagefind meta and no taxonomy change during G1.
- PF3 Finnish family-badge label preserved (Modular UI's `translations` option handles UI strings; presenter emits the Finnish label directly per PF3).
- FI/EN parity preserved — the shared presenter is language-neutral; templates pass `labels` and `locale`.
- Accessibility — Modular UI primitives are shipped from the same source library as Default UI, decomposed. Whether the same a11y behaviour holds after site-owned composition is **NEEDS BROWSER TEST** (keyboard, screen-reader, focus containment inside the `<dialog>`), verified by the pilot.

### Split of evidence: API suitability vs integrated browser lifecycle

- **PROVEN (API suitability):** Modular UI ships in Pagefind 1.5.2; `Instance`, `Input`, `FilterPills`, `Summary`, `ResultList` are the composable primitives; `ResultList.resultTemplate(data): string|Element` is an author-provided function that owns the per-result DOM; `translations` option is present on `Instance`. All from grep of the pinned 1.5.2 runtime in this worktree.
- **NEEDS BROWSER TEST (integrated lifecycle):** the following must be verified by the `/haku/` pilot in a browser before this mechanism can be relied on across all four global surfaces. Nothing in the pilot lifecycle has been observed yet:

  - Native search `<dialog>` lifecycle (the navbar Pagefind trigger currently opens a `<dialog>` — verify the Modular UI mount does not fight it) — **NEEDS BROWSER TEST**
  - Initial input focus behaviour when the search surface opens — **NEEDS BROWSER TEST**
  - Tab / focus containment inside the search surface — **NEEDS BROWSER TEST**
  - `Escape` close behaviour and its interaction with the `<dialog>` lifecycle — **NEEDS BROWSER TEST**
  - Exact focus return to the trigger after close — **NEEDS BROWSER TEST**
  - Navbar FI behaviour end-to-end — **NEEDS BROWSER TEST**
  - Navbar EN behaviour end-to-end — **NEEDS BROWSER TEST**
  - `/haku/` behaviour end-to-end — **NEEDS BROWSER TEST**
  - `/en/search/` behaviour end-to-end — **NEEDS BROWSER TEST**
  - Initial `?q=…` query prefill and search — **NEEDS BROWSER TEST**
  - Language filter (`Kieli`) applied via Modular UI — **NEEDS BROWSER TEST**
  - Translations (FI + EN strings for placeholder, clear, load-more, filters label, zero/one/many results, alt-search, suggestion, searching) — **NEEDS BROWSER TEST**
  - Load-more / pagination behaviour — **NEEDS BROWSER TEST**

  These are integrated lifecycle concerns; they cannot be answered by inspecting bundles. Each stays labelled `NEEDS BROWSER TEST` until the pilot produces observed evidence.

- **The GO decision is not weakened by this split.** API suitability is proven and is the correct precondition for scheduling the pilot. Integrated browser lifecycle is exactly what the pilot exists to observe.

**Pilot before rollout.** Because migration from PagefindUI Default to Modular UI touches four surfaces and re-implements input/filters/summary composition, the pilot should:
- Land on **`/haku/` only** first.
- Prove the `NEEDS BROWSER TEST` items above on `/haku/`, plus: shared presenter renders publications, theses, writings (reduced), presentations, media correctly; no ranking drift; no F&E regression (nothing there should change).
- Only after `/haku/` is green: rollout to `/en/search/`, navbar FI, navbar EN in that order. Each rollout is one PR, and each additional surface re-verifies the `NEEDS BROWSER TEST` items on that specific surface.

**Alternate framing (in case reviewer disagrees):** the decision on Mechanism C is strong but there is a legitimate case for framing it as **NEEDS EXPERIMENT** if the reviewer wants concrete pilot evidence (LOC delta on the extracted presenter, byte-level generated-asset comparison on the four global surfaces, keyboard/SR parity evidence, resolution of every `NEEDS BROWSER TEST` above) before greenlighting the full mechanism switch. The `/haku/` pilot IS that experiment. Either framing lands at the same first PR: a Modular UI proof-of-concept on `/haku/` guarded by the pilot criteria above.

## Implications for G2 / G3 / G4

### G2 — Presentations shared result presentation
- **Enabled by G1.** Once the shared presenter and Modular UI shell exist, adding a `presentation` kind to the shared presenter (icon-only, per PF5-APA7 §17 Phase 2) is a small additive change to `searchPresenter.js`.
- **No F&E mount on `/esitykset/`** — SSR archive card remains authoritative for the archive view.
- **Metadata gap:** none identified — `PresentationEvent`, `PresentationType`, `PresentationLandingType`, `PresentationSourceType` all available (PROVEN).

### G3 — Media 11b/11c
- G1 does **not** decide this. Both 11b (add `media` kind to shared presenter) and 11c (surface-specific presenter on global) become simpler after G1: media kind is a copy-shaped extension of the shared presenter; surface-specific is a small custom `resultTemplate` on the global ResultList only.
- Recommend **decide 11b/11c only after G1's shared-presenter shape is real**.

### G4 — Writings F&E
- **The metadata gap (`description`, `publication`) means G4-A (converge to `writings-curated-list.njk`) is currently blocked at the Pagefind layer.** Reopening it would require either widening `resolvePagefindWritings` meta (which touches canonical projection — deliberately out of G1 scope) or accepting the reduced variant.
- **The reduced PF4 writings result may be the correct answer** across both global and F&E surfaces, and the shared presenter will output that reduced shape uniformly.
- Recommend **do not reopen G4 as a widening effort**. Confirm the reduced shape after G1 lands.

## Deletion ledger

Contingent on shipping the recommended Mechanism C on all four surfaces.

**PROVEN deletion candidate:**
- Stock PagefindUI Default bundle load on the four global surfaces: `<script src="/pagefind/pagefind-ui.js" defer>` in `src/_includes/_meta.njk:191`. Replaced by Modular UI bundle load. Verified needed today via `initUi()` and `new window.PagefindUI(…)`.
- `pagefind-ui.css` preload/stylesheet in `src/_includes/_meta.njk:186-189`. Replaced by Modular UI CSS plus site-owned styling for shell (input, filters, summary). Byte-level size comparison is a P1 concern (see the note on generated-asset size).
- `new window.PagefindUI(…)` construction in `src/js/site-search-page.js:39` and `src/js/site-ui.js:611`. Replaced by Modular UI composition.
- Duplicated `translations` block in `src/js/site-search-page.js:46-73` and `src/js/site-ui.js:620-…`. After Modular UI adoption, translations move to a single shared translations map imported by both sites.

**Contingent deletion (needs G4 disposition):**
- The generic `<li class="find-explore-result">` writings fallback branch in `find-explore.js#renderResultEntry` (line ~941–950) can be replaced by an import of `searchPresenter.renderSharedCard`. Actual line-level deletion depends on refactor style.

**Must retain:**
- `src/_utils/publicationsFindExplore.js`, `src/_utils/thesesFindExplore.js`, `src/src.11tydata.js#resolvePagefindDocument`, `scripts/_lib/presentationPagefind.js`, `src/_includes/media-item.njk` meta emitters — canonical projections; unchanged.
- `src/_includes/publication-archive-groups.njk`, `src/_includes/thesis-archive-table.njk`, `src/_includes/presentations/result-card.njk`, `src/_includes/writings-curated-list.njk`, `src/fi/mediassa.njk` + `src/en/media.njk` + `src/_includes/_media-macros.njk` — authoritative SSR archive presenters.
- `src/js/find-explore.js` mount runtime — F&E surfaces continue to own their state, filters, sort, and archive-row replacement.
- Pagefind index build (`scripts/run-pagefind.js`) and all `data-pagefind-*` emitters — unchanged.

**Do NOT promise deletion of:** the entire `pagefind/*` bundle. Modular UI + WASM + worker + fragment/chunk assets remain required.

## Risks / failure paths

1. **Modular UI shell parity gap.** Migrating from Default UI to Modular UI on four surfaces requires re-composing input, filters, summary, translations. **NEEDS BROWSER TEST**: pilot must verify no visual/UX regression on `/haku/` before rolling to the other three surfaces.
2. **Sub-results on navbar mount.** Navbar Default UI currently uses `showSubResults: true`. Modular UI has no built-in sub-results renderer (PROVEN: no `sub_results` handling in the modular bundle). Sub-results can be rendered explicitly from `data.sub_results` inside the presenter, but this is extra work. Evaluate during pilot whether sub-results remain a navbar requirement.
3. **`processResult` incompatibility with Modular UI.** Modular UI's `Instance` still accepts `processResult`; but the presenter path is `ResultList.resultTemplate`, not `processResult`. Do not use both simultaneously.
4. **`data.filters` availability in `resultTemplate` payload.** The template callback receives `data` with `.url`, `.meta`, `.excerpt`, `.sub_results`. **NEEDS BROWSER TEST**: confirm whether `data.filters` is also passed (writings currently relies on `filter Writings topic` — but that field is for facet aggregation, not per-result meta). If not, the presenter must classify family from `meta` alone (all domains except media already have kind-identifying meta fields).
5. **Bundle-swap regression on global surfaces.** Loading Modular UI instead of Default UI must not break unrelated pages that share `_meta.njk`. Recommend conditional loading via `pageStyles` / a page-level flag rather than swapping globally.
6. **Presentations family-label projection.** As noted in the metadata section, presentation results may not emit a `Sisältö:Esitykset` filter the same way other domains do. **NEEDS FOLLOW-UP** in the pilot: confirm presenter can produce the family badge from `meta.PresentationId` presence or an equivalent signal.
7. **PagefindUI Default translations may not map 1:1 to Modular UI.** The Modular UI `translations` option surface differs slightly. **NEEDS BROWSER TEST**: pilot must verify FI and EN string coverage matches today's UX.
8. **CI regression.** Playwright `tests/accessibility-tools.spec.js`, `tests/navigation.spec.js`, `tests/accessibility.spec.js` currently exercise the navbar Pagefind trigger. Pilot must run all four before rollout.

## Explicit non-goals

- No canonical content changes.
- No Pagefind indexing config changes (no new meta, no new filters, no ranking tweaks).
- No taxonomy changes.
- No new content types or content-family facets.
- No SPA-search layer; no client-owned content model.
- No grouping by kind on global surfaces.
- No FI/EN parity reopen (PF3 Finnish family badge decision stands).
- No Research contextual view changes.
- No changes to SSR archive partials.
- No `find-explore.js` mount runtime import on global surfaces.
- No conversion of `pagefind-ui.js` to a subclass or DOM-patched variant.
- No committing to G2 / G3 / G4 in this audit.

## Final decision

**PARITY DECISION (for G1 slice): GO**

**RESULT PRESENTATION MECHANISM: PagefindUI Modular UI (`Instance` + `Input` + `FilterPills` + `Summary` + `ResultList` with `resultTemplate` bound to a shared presenter extracted from `find-explore.js`'s already-pure PF4/PF5 helpers).**

**IMPLEMENTATION SHAPE: pilot on `/haku/` first, rollout to `/en/search/`, navbar FI, navbar EN in separate PRs after pilot passes.** Pilot criteria include every `NEEDS BROWSER TEST` item enumerated in the "Split of evidence" section above (native `<dialog>` lifecycle, initial input focus, Tab/focus containment, `Escape` close, exact focus return, all four surfaces end-to-end, initial `?q=…` query, language filter, translations, load-more / pagination), plus: shared presenter renders each domain correctly; no ranking drift; no F&E regression; generated-asset comparison recorded.

Evidence classification for each key claim:
- Modular UI is officially in Pagefind 1.5.2 and exports the composable primitives listed. **PROVEN** by grepping the bundle produced in this worktree.
- `resultTemplate` fully owns the per-result HTML. **PROVEN** by the bundle's `this.resultTemplate = e.resultTemplate ?? y` line.
- Publications, theses, presentations, media metadata are sufficient for the shared presenter without new Pagefind meta. **PROVEN** by direct read of the emitters and the metadata matrix.
- Writings has a metadata gap for description/publication. **PROVEN** (not projected by `resolvePagefindWritings`); the reduced PF4 writings card is the correct output for the shared presenter today.
- Extraction of shared PF4/PF5 helpers from `find-explore.js` does not require expanding abstraction. **PROVEN** (helpers are already pure at file scope; mount-scope helpers can be parameterised with modest refactor).
- Integrated browser lifecycle across the four global surfaces (all items listed above). **NEEDS BROWSER TEST** — that is the pilot's purpose. Not a weakening of the GO decision on API suitability.
- Byte-level generated-asset comparison across the four surfaces after Modular UI adoption. **NEEDS BROWSER TEST** in the sense that it must be re-measured on the pilot's actual output; performance/network claims themselves are P1 territory.

---

**End of audit.** No production code changed. Awaiting review before the PF5-G1 pilot is scheduled.
