# PF5-A1 — Global Result Parity Audit (post H1 + Index Hygiene)

**Mode:** AUDIT ONLY  
**Date:** 2026-08-25  
**Baseline `origin/main` SHA:** `1d4a42def281eb5a5b7a61b4801151f51b858c18`  
**Audit branch:** `audit/pf5-a1-global-result-parity`  
**Prior recommendation:** `docs/architecture-closure-checkpoint-2026-08-25.md` (`54c236f4`) → NEXT WORKSTREAM = PF5, DECISION = REDUCE, FIRST SLICE = PF5-A1 result-card variant inventory.

## 0. Decision (top-of-file summary)

```
PER-DOMAIN DECISIONS:
  Publications:   KEEP   (shared skeleton via presenter; F&E has legitimate enrichment)
  Theses:         KEEP   (shared skeleton via presenter; F&E archive rows have OuluREPO link)
  Presentations:  KEEP   (G2 activated shared presenter; excerpt hygiene fixed)
  Writings:       KEEP   (shared skeleton via presenter; Pagefind description meta gap
                          is a separate F&E enrichment concern, not global-parity)
  Media:          CHANGE (shared presenter media branch is empty; canonical data + emitted
                          Pagefind meta already sufficient to render a useful primary-meta line)
  Generic:        KEEP   (unknown kind falls back to family+title+excerpt cleanly)

MEDIA G3 DECISION:  GO
FIRST SLICE:        PF5-G3A — presenter media branch (primaryMetaFor + label map)
EXPECTED DELETION:  Zero code deletion. Small net addition (~20-30 LOC in presenter).
INTENTIONALLY RETAINED:
                    Canonical Content v1, Media M2 Pagefind contract, universal
                    main[data-pagefind-body], all /data/*.json public contracts,
                    F&E per-kind enrichments (APA/CSL, JUFO/OA/peer-review, citation
                    export, thesis OuluREPO source link, publication archive tables).
```

## 1. Baseline

- `origin/main` at prompt creation: `1d4a42def281eb5a5b7a61b4801151f51b858c18` — verified unchanged
- Prior audit checkpoint on `audit/architecture-closure-checkpoint` commit `54c236f4`
- Last three commits shaping the current search surface:
  - `965c735b` — Pagefind index hygiene hotfix (universal `<main data-pagefind-body>`, attribute-form meta, presentation excerpt leak fixed)
  - `373cb8f5` — PF5-G2 presentations Pagefind projection (activated shared presenter for presentations)
  - `cf9c1e12` — PF5-G1 shared presenter convergence (6 helpers deduplicated; single owner)

## 2. Docs reviewed (authoritative)

- `docs/site-architecture-closure-roadmap-2026-08-20.md`
- `docs/architecture-closure-checkpoint-2026-08-25.md` (this audit's parent decision)
- `docs/pf5-g1-shared-presenter-convergence-2026-08-23.md`
- `docs/pf5-g1-navbar-modular-ui-implementation-2026-08-23.md`
- `docs/pf5-g2-presentations-pagefind-projection-2026-08-24.md`
- `docs/pf5-h1a-search-page-shell-simplification-2026-08-24.md`
- `docs/pf5-h1b-progressive-facet-disclosure-2026-08-24.md`
- `docs/search-ui-hotfix-2026-08-24.md`, `docs/search-state-facet-count-hotfix-2026-08-24.md`, `docs/search-pagefind-index-hygiene-hotfix-2026-08-25.md`
- `docs/find-explore-publications-v1-closure-2026-08-14.md`, `docs/find-explore-theses-v1-closure-2026-08-14.md`, `docs/find-explore-writings-v1-closure-2026-08-12.md`, `docs/find-explore-presentations-f3c-closure-2026-08-15.md`
- `docs/publications-full-pagefind-pub-cite1-closure-2026-08-17.md`
- `docs/m1-media-pagefind-compatibility-audit-2026-08-15.md`, `docs/m2-media-find-explore-closure-2026-08-16.md`, `docs/m2-media-pagefind-find-explore-2026-08-15.md`
- `docs/f4-research-find-explore-closure-2026-08-15.md`

## 3. Surface inventory

| # | Surface | URL | Template | Renderer | Presenter | Notes |
| - | --- | --- | --- | --- | --- | --- |
| A | Navbar Pagefind dialog | any page (`<dialog id="searchOverlay">`) | `src/_includes/header.njk` + `src/_includes/_search-nav-config.njk` | `src/js/global-search-modular-ui.js` (`createModularSearchUI`) → `SearchResultPresenter.renderSharedCard` | shared | pageSize = 6; density = compact |
| B | Full search FI | `/haku/` | `src/fi/haku.njk` + `_search-page-config.njk` | same factory | shared | pageSize = 10 |
| C | Full search EN | `/en/search/` | `src/en/search.njk` + `_search-page-config.njk` | same factory | shared | pageSize = 10; only labels differ |
| D | Publications F&E FI | `/julkaisut/` archive | `src/julkaisut.njk` | `src/js/find-explore.js` kindConfig.publications | shared skeleton + F&E enrichments (APA, JUFO/OA/peer-review, citation export, source link, archive tables) | mount `data-find-explore-kind="publications"` |
| E | Publications F&E EN | `/en/publications/` | `src/en/publications.njk` | same | same | archive view |
| F | Theses F&E FI | `/opinnaytteet/` | `src/opinnaytteet.njk` | `find-explore.js` kindConfig.theses | shared skeleton + OuluREPO source link in archive rows | archive |
| G | Theses F&E EN | `/en/theses/` | `src/en/theses.njk` | same | same | archive |
| H | Writings F&E FI | `/kirjoitukset/` | `src/kirjoitukset.njk` | `find-explore.js` kindConfig.writings | shared skeleton; content type only (Pagefind gap for description) | `requiresQueryForSearch: true` |
| I | Writings F&E EN | `/en/writings/` | `src/en/writings.njk` | same | same | |
| J | Presentations global | `/haku/`, `/en/search/`, navbar | shared | `SearchResultPresenter` (post-G2) | shared skeleton with type + event | no dedicated F&E mount |
| K | Media global | `/haku/`, `/en/search/`, navbar | shared | `SearchResultPresenter` | shared skeleton with **empty primary meta line** ← the gap | no F&E mount |
| L | Research mixed F&E | `/tutkimus/` | `src/fi/tutkimus.md` | `find-explore.js` kindConfig.researchContext (multi-kind: publications, theses, writings, presentations) | shared skeleton for all kinds | topic-preset remapping active (e.g., tekoäly → ai-literacy) |

No other user-visible search surface exists.

## 4. Presenter call graph

```
Pagefind result data
  |
  ├─(global search)  createModularSearchUI (global-search-modular-ui.js)
  |                    → per-result: SearchResultPresenter.renderSharedCard(data)
  |                        → projectEntry(data)
  |                            → detectKind(data)      // publications → theses → media → presentations → writings → unknown
  |                            → yearFor(kind, data)   // per-kind year field
  |                            → primaryMetaFor(kind)  // per-kind meta parts
  |                            → resultTitle, contentFamilyLabelFromData
  |                        → renderFamilyHeader (badge + year)
  |                        → <a class="find-explore-result-title">
  |                        → renderPrimaryMetaLine (per-kind or empty)
  |                        → renderExcerpt (RAW markup — preserves <mark>)
  |
  └─(Find & Explore)  find-explore.js  createResultEntry(data)
                        → detectKind
                        → merged record (CSL for publications, thesisTypeRoleLabel for theses, etc.)
                        → kindConfig[kind].resultMeta(entry)
                        → renderResultEntry
                            → publications → renderPublicationCardResult OR renderPublicationArchiveRow
                                              (APA body + qualityLine + citationButton + sourceLink)
                            → theses → renderPublicationArchiveRow-style with OuluREPO button
                                       (in archive) OR shared skeleton (in F&E generic list)
                            → other → shared skeleton (`<li class="find-explore-result">`)
                                     BUT with F&E's own excerpt escaping (kills <mark>)
```

### Kind detection order (SearchResultPresenter.detectKind)

1. `meta.publicationYear || meta.publicationType || meta.publicationCsl` → publications
2. `meta.thesesYear || meta.thesesType || meta.thesesAuthorLine` → theses
3. `meta.mediaType || meta.mediaRole || meta.mediaOutlet` → **media**
4. `meta.PresentationYear || meta.PresentationType || meta.PresentationEvent` → presentations
5. `meta.writingsYear || meta.writingsContentType` → writings
6. else → unknown

### primaryMetaFor branches

- publications: [publicationAuthors, publicationTypeLabel || publicationType || publicationGroup, publicationVenue || publicationJournal || publicationPublisher]
- theses: [thesesAuthorLine, `${thesesType} · ${thesesRole}`]
- writings: [writingsContentType]
- presentations: [PresentationType, PresentationEvent]
- **media: [] ← THE GAP** (documented as "G3 territory, deliberately deferred")
- unknown: []

## 5. Result shape matrix

Legend: ✓ present, — not present, `n/a` domain doesn't have that concept.

| Domain | Navbar | /haku/ | /en/search/ | F&E | Family badge | Year | Title | Primary meta | Excerpt | Authors | Venue/Event/Outlet | Role | Badges | Actions | Thumbnail | Landing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Publications | ✓ | ✓ | ✓ | ✓ + APA + quality line + citation export | ✓ Julkaisut | ✓ | ✓ | ✓ authors · type · venue | ✓ | ✓ (via publicationAuthors meta) | ✓ (via publicationVenue) | n/a | F&E only (JUFO/OA/peer-review) | F&E only (citation export, source link) | — | canonical detail |
| Theses | ✓ | ✓ | ✓ | ✓ + OuluREPO source link (archive) | ✓ Opinnäytteet | ✓ | ✓ | ✓ author · type · role | ✓ | ✓ (via thesesAuthorLine) | n/a | ✓ | — | F&E archive only | — | canonical detail |
| Presentations | ✓ (post-G2) | ✓ | ✓ | shared skeleton (via researchContext mount) | ✓ Esitykset | ✓ | ✓ | ✓ type · event | ✓ | — | ✓ (via PresentationEvent) | n/a | — | — | — | canonical detail (localDetail) or archive (externalSource) |
| Writings | ✓ | ✓ | ✓ | ✓ shared skeleton | ✓ Kirjoitukset ja puheenvuorot | ✓ | ✓ | ✓ writings content type only | ✓ | — | — | — | — | — | — | canonical detail |
| **Media** | ✓ | ✓ | ✓ | not mounted | ✓ Mediassa | ✓ (via meta.year) | ✓ | **— MISSING** | ✓ | — | ✓ available in meta.mediaOutlet | ✓ available in meta.mediaRole | — | — | — | canonical detail + external source URL |
| Generic (unknown) | ✓ | ✓ | ✓ | shared skeleton | — (no family filter) | — | ✓ | — | ✓ | — | — | — | — | — | — | page URL |

## 6. Shared skeleton analysis

Current shared skeleton (`renderSharedCard`, 208 LOC presenter):

```
FAMILY BADGE · YEAR
TITLE (link)
PRIMARY META (varying per domain)
EXCERPT (with <mark> preserved)
```

**GO/NO-GO per domain** for this skeleton:

- Publications: **GO** — currently works; F&E variant adds legitimate enrichment (APA, quality, citation export). Keep both.
- Theses: **GO** — currently works.
- Presentations: **GO** — activated by G2; index hygiene cleaned excerpts.
- Writings: **GO** — currently works; description gap is F&E-only concern, not global-parity.
- Media: **GO with a minor presenter tweak** — canonical data supports "type · role · outlet" meta line; presenter needs `primaryMetaFor('media')` implementation + label map.
- Generic (unknown): **GO** — fallback is clean.

The skeleton itself is the right shape site-wide. Only one domain (Media) has an unfilled per-kind branch.

## 7. Publications — decision KEEP

- Global search: shared skeleton with authors · type · venue. Excerpts clean.
- F&E: retains legitimate enrichment — APA citation sentence via CSL (`publication-citation.js` 640 LOC isomorphic), quality line (peer-reviewed / OA / JUFO / citation count), citation export button (opens `#citationExportModal`), external source link, grouped archive tables with OKM-group headings.
- Element classification (per user question):
  - **Global search only** (A): authors, publication type, source/venue (already in primaryMetaFor)
  - **Publications F&E only** (B): peer-review label, JUFO level, OA badge, citation body (APA), citation export button, source link, archive-table row layout, grouped archive
  - **Detail/archive only** (C): full CSL rendering with volume/issue/pages/DOI/ISBN
- Global-search parity is intentionally reduced. F&E enrichment is domain-appropriate. **KEEP.**

## 8. Theses — decision KEEP

- Global search: shared skeleton with author line · type · role. Year present.
- F&E: adds OuluREPO source link button in archive rows (`renderResultEntry` theses branch, `find-explore.js:893-909`).
- No obvious defect. Mature per TH-CITE1 Phase 3 closure. **KEEP.**

## 9. Presentations — decision KEEP

- Post-G2 (`373cb8f5`): shared presenter's dormant presentations kind branches now activate on real Pagefind results.
- Post-index-hygiene (`965c735b`): excerpts no longer contain `slideshare|URL|title`, `education|research|teaching`, `long-term-learning`, `localDetail`, `find_explore_presentations` pipe-delimited technical strings.
- Verified in production earlier today: `/presentations/ss-mobiilioppimisesta-about-mobile-learning/` returns clean human-readable excerpt with `meta.PresentationType=presentation`, `meta.PresentationYear=2011`, `Sisältö=Esitykset`.
- No dedicated F&E mount for presentations exists; presentations discovery is via global search (navbar / /haku/ / /en/search/) + researchContext mount on `/tutkimus/`.
- **Effectively DONE. Do not add thumbnail/source embellishment without user-value evidence.** KEEP.

## 10. Writings — decision KEEP

- Shared skeleton renders content type only. This matches the PF5-G1 audit's writings decision (reduced result retained because Pagefind meta does not carry description/publication).
- No current result-content defect. The gap (description not projected) is a separate F&E enrichment question the roadmap already tags as deferred.
- No obvious KEEP-blocker in the current global search surface. **KEEP.**

## 11. Media — decision CHANGE

### 11.1 Canonical availability

Verified against `src/media/*.md` frontmatter + `src/_data/mediaArchive.js`:

- `title` — always present
- `description` — always present
- `date` — optional
- `mediaType` — enum: podcast / article / pressRelease / tv / radio / video / assignment
- `mediaRole` — enum: about / guest / interviewer / expertAssignment
- `mediaOutlet` — free string (e.g., "Yle", "TechnocratNJ / YouTube")
- `sourceUrl` — external URL (optional)
- `thumbnail` — optional
- `categories`, `keywords`, `topics`, `subtitle`, `roleTitle`, `appointingBody`, `mediaOrder`, `lang` — optional metadata

### 11.2 Pagefind emission (already in place per M2)

`src/_includes/media-item.njk` emits:

| Filter | Meta | Source expression |
| --- | --- | --- |
| `Sisältö:Mediassa` | — | fixed |
| `Mediatyyppi:{label}` | `mediaType:{enum}` | `_media-macros.njk mediaTypeLabel(item.mediaType, lang)` |
| `Rooli:{label}` | `mediaRole:{enum}` | `_media-macros.njk mediaRoleLabel(item.mediaRole, lang)` |
| `Vuosi:{YYYY}` | `year:{YYYY}` | derived from date |
| — | `mediaOutlet:{string}` | raw outlet |
| — | `date:{ISO}` + sort:date | isoDate |

70/73 items have year+date (3 legacy flat-slug items lack authored dates). Per M2 archive-scope `data-pagefind-ignore` and no `data-pagefind-body` on media-item.

### 11.3 Presenter gap

`SearchResultPresenter.primaryMetaFor('media')` returns `[]` (line 129-132). Presenter's own comment explicitly acknowledges this: *"media did NOT have a shared-renderer kind pre-G1 (that decision is G3/PF5 Phase 3 territory, deliberately deferred); it therefore renders here with the family badge only, no primary meta line."*

Media results in global search today render as:

```
Mediassa · 2025
Result title
                            ← empty (no primary meta)
Excerpt from body...
```

vs the target:

```
Mediassa · 2025
Result title
Video · Vieraana · Yle
Excerpt from body...
```

### 11.4 Landing semantics preserved

- Detail page: `/mediassa/{year}/{month}/{day}/{slug}/` (canonical local Pagefind surface with all meta spans)
- External source: `sourceUrl` (surfaced as "Avaa alkuperäinen lähde" primary action on detail page)
- No client-side URL synthesis required. Presenter continues to use `data.url` (canonical detail URL) for the result link.

### 11.5 Required work: A (metadata projection) — NO. B (presenter branch) — YES. C/D — NO.

- (A) metadata projection: **not required**. All fields already emitted per M2.
- (B) presenter branch: **required**. Extend `primaryMetaFor('media')` to return `[mediaTypeLabel, mediaRoleLabel, mediaOutlet]` filtering empties. Needs a tiny in-presenter label map (browser JS cannot call Nunjucks macros directly) — mirror the exact `mediaTypeLabel` / `mediaRoleLabel` sets from `_media-macros.njk`.
- (C) SSR / index hygiene: **not required**. Media archive already `data-pagefind-ignore`'d; detail pages emit all needed meta.
- (D) broader architecture change: **not required**.

Decision: **CHANGE (small, presenter-only)**.

## 12. Generic — decision KEEP

- kind=unknown falls through to family label empty + title + primary meta empty + excerpt.
- Users landing on unknown/generic pages via search see a legible card (badge omitted, title link, excerpt) — acceptable.
- If generic pages later dominate a mixed search enough to warrant a distinct presenter branch, the shared skeleton already accommodates that. Not urgent.

## 13. F&E vs global — SHARED CORE vs SURFACE-SPECIFIC ENRICHMENT

**SHARED CORE** (present on all surfaces via presenter):
- family badge + year eyebrow line
- title link
- primary meta line (per-kind, deliberately reduced)
- excerpt (raw markup preserved by presenter; F&E kills `<mark>` intentionally at F&E's own consumer sites)

**F&E SURFACE-SPECIFIC ENRICHMENT** (intentionally NOT in global search):

| Domain | Enrichment | Reason to keep only in F&E |
| --- | --- | --- |
| Publications | APA citation body (CSL), JUFO/OA/peer-review quality line, citation export button, external source link, grouped OKM archive tables | Deep bibliographic tooling belongs in the archive surface where the user has committed to browsing publications; global search stays scannable |
| Theses | OuluREPO source link button on archive rows | Domain-specific action tied to institutional repo; not useful outside archive |
| Presentations | (none — F&E uses shared skeleton via researchContext mount) | Presentations don't have a standalone F&E mount |
| Writings | (none currently — description projection gap noted but out of PF5-A1 scope) | Roadmap-deferred |

## 14. Landing semantics

- Publications: `record.url` from `publicationRecordFromMeta` → canonical detail. F&E adds DOI/external source link as SEPARATE action (not the primary result link).
- Theses: `data.url` → canonical detail. F&E archive rows also expose OuluREPO source link as separate action.
- Presentations (localDetail): `data.url` → canonical `/presentations/{slug}/`. Preserved by G2 projector.
- Presentations (externalSource): not in Pagefind index (external-first records without local detail); appear only in SSR archive. No client-side landing resolution.
- Writings: `data.url` → canonical detail.
- Media: `data.url` → canonical `/mediassa/{...}/{slug}/`. External source stays a SEPARATE detail-page action, not the primary result link.
- Generic: `data.url` → the page's own URL.

No surface would need client-side URL synthesis after Media G3. All landing decisions are already canonical-driven.

## 15. Navbar vs full search — one presenter, two densities

- Same presenter, same HTML per card, same CSS.
- Navbar: `pageSize: 6` (compact pagination); full search: `pageSize: 10`. Configured via `_search-nav-config.njk` / `_search-page-config.njk`.
- No density-specific renderer needed. Confirmed by CSS ledger below — one CSS block (`_components.css:703-770`), no navbar-only overrides.

## 16. CSS parity

| File | Classes | Lines | Scope |
| --- | --- | --- | --- |
| `src/css/modules/_components.css` | `.find-explore-result*` family (base card, family badge, year, title link, primary meta, excerpt, focus, hover, media query) | 703–770 | Universal — same rules for navbar + /haku/ + /en/search/ + F&E |
| `src/css/modules/_components.css` | `[data-search-modular-results] > li` list-marker + gap resets | 785–797 | **PF5 accessibility HOTFIX** — masks the `<li>` inside `<div>` semantic violation (see §17) |
| `src/css/find-explore.css` | `.find-explore-*` container / status / grid / groups / publications archive layout / quality line | 1–80 | F&E-only; does NOT restyle the individual result card |

No domain-specific overrides. No language-forked CSS. No divergent typography or spacing across surfaces.

## 17. Accessibility

Real, present but not-critical issue:

- `renderSharedCard` emits `<li class="find-explore-result">` at `search-result-presenter.js:186`.
- The parent container in `global-search-modular-ui.js:167,188` is `<div class="site-search-page-results" data-search-modular-results>` — a `<div>`, not `<ul>` or `<ol>`.
- CSS reset at `_components.css:785-797` masks the visual `list-item` marker.
- Assistive tech still sees orphan `<li>` elements without a list parent — count is not announced, "list of N items" landmark is absent.
- Severity: **medium** (semantic, no user-facing breakage). Not blocking Media G3.
- Fix belongs in a separate small a11y slice (change container tag from `<div>` to `<ul>` / `<ol>`; remove the CSS reset that masks the browser default). Not in scope for PF5-A1 or Media G3.

No other a11y defects found in the shared card. Title link accessible name = title text. No duplicate CTAs. No headings inside the card (intentional — cards are list items in a sea of results, not sectioning content).

## 18. FI / EN

- Structural parity: identical HTML per card between FI and EN mounts. Same CSS.
- Metadata availability parity: FI has full canonical metadata for all domains; EN has NO presentation detail pages (documented in G2 closure — pre-existing site structure, not a regression).
- Label parity: only "N tulosta" vs "N results" (correctly localised by search-page config); SISALTO_LABELS deliberately Finnish across FI + EN mounts (matches the Pagefind filter values).
- **No FI/EN change would be required by Media G3** — media detail pages already index equivalently on both sides via `lang` frontmatter + label macros.

## 19. Pagefind contract per result kind (post-G2 + hygiene)

| Kind | Filters used by presenter | Meta used by presenter | Emission point |
| --- | --- | --- | --- |
| publications | `Sisältö:Julkaisut`, `Julkaisut *` | `publicationYear`, `publicationType`, `publicationTypeLabel`, `publicationGroup`, `publicationCsl`, `publicationAuthors`, `publicationVenue`, `publicationJournal`, `publicationPublisher` | `src/src.11tydata.js resolvePagefindPublications` |
| theses | `Sisältö:Opinnäytteet`, `Opinnäytteet *` | `thesesYear`, `thesesType`, `thesesRole`, `thesesAuthorLine`, `thesesDescription` | `src/src.11tydata.js resolvePagefindTheses` (via `thesesFindExplore.js`) |
| presentations | `Sisältö:Esitykset`, `PresentationYear/Type/Topic/Event/Context`, `Research context:research` | `title`, `PresentationYear`, `PresentationType`, `PresentationEvent` | `src/src.11tydata.js resolvePagefindPresentations` (added by G2) + `scripts/_lib/presentationPagefind.js` injection (attribute-form post index hygiene) |
| writings | `Sisältö:Kirjoitukset ja puheenvuorot` | `writingsYear`, `writingsContentType` | `src/src.11tydata.js resolvePagefindWritings` |
| media | `Sisältö:Mediassa`, `Mediatyyppi`, `Rooli`, `Vuosi` | `mediaType`, `mediaRole`, `mediaOutlet`, `year`, `date` | `src/_includes/media-item.njk` (per M2) |
| unknown | `Kieli:*` only | — | `base.njk` universal |

Canonical remains authoritative. Pagefind is discovery infrastructure, not canonical storage.

## 20. Duplication / deletion ledger

| Candidate | Location | Consumer | Replacement | Safe to delete? |
| --- | --- | --- | --- | --- |
| Duplicate `escapeHtml()` in navbar factory | `src/js/global-search-modular-ui.js:113` | Only local use | `SearchResultPresenter.escapeHtml` (already loaded first per PF5-G1 load-order guarantee) | **Yes** (small — 8 LOC). Optional cleanup, not blocking Media G3. |
| CSS list-marker reset for `[data-search-modular-results] > li` | `src/css/modules/_components.css:785-797` | Masks a11y violation | Change container `<div>` → `<ul>` in `global-search-modular-ui.js:167,188`, then delete reset | Safe but out of scope for PF5-A1 / Media G3. Belongs in separate a11y slice. |
| Duplicate media card composer | `src/fi/mediassa.njk:371-402` (`renderCard()` inline JS) vs SSR loop at 212-236 | FI media archive hydration | Delegate to a shared Nunjucks-driven client helper OR let SSR carry all 73 (as EN does) | Bounded — ~30 LOC. **Out of scope for PF5-A1**. Belongs in a separate Media archive cleanup if ever justified. |
| F&E `renderExcerpt` inline (kills `<mark>`) | `src/js/find-explore.js:751-753, 913-915` | F&E per-kind renderers | Presenter's `renderExcerpt` preserves `<mark>` | **No** — intentional divergence per PF5-G1 closure ("F&E behavior change against the slice guardrails"). Keep. |

**Net deletion opportunity of Media G3 slice: 0.** It's a small addition (~20-30 LOC in presenter) with zero code removed. This is acceptable because the addition eliminates a real user-visible gap (media results with empty meta line) at minimum surface cost.

## 21. Media G3 GO/NO-GO — GO

**Reason:** the canonical data + emitted Pagefind meta already contain everything the presenter needs to render a useful media primary-meta line. No canonical change. No Pagefind emission change. No SSR change. No F&E mount. Just fill the empty presenter branch.

## 22. Recommended next slice — PF5-G3A (audit-only doc; implementation deferred)

**Slice ID:** PF5-G3A — presenter media branch (primaryMetaFor + label map)

**Goal:** render media results in navbar / /haku/ / /en/search/ with a useful primary-meta line ("Podcast · Vieraana · Yle" style), matching the visual weight of publications/theses/presentations/writings cards. Zero canonical/Pagefind changes.

**Exact files touched by the implementation slice (READ + minimal edit):**

- `src/js/search-result-presenter.js` — extend `primaryMetaFor('media')` to return a filtered array of `[mediaTypeLabel, mediaRoleLabel, mediaOutlet]`. Add a tiny in-presenter `MEDIA_TYPE_LABELS` / `MEDIA_ROLE_LABELS` map mirroring `src/_includes/_media-macros.njk` (browser JS cannot call Nunjucks macros; inline copy is required).
- (optional cosmetic) `src/js/global-search-modular-ui.js` — delete the duplicate `escapeHtml` at line 113 and read it from `SearchResultPresenter.escapeHtml` (already loaded first). Not required for the core slice.

**Exact fields consumed by the new branch:**

- `meta.mediaType` — enum: podcast, article, video, pressRelease, tv, radio, assignment
- `meta.mediaRole` — enum: about, guest, interviewer, expertAssignment
- `meta.mediaOutlet` — raw string

**Exact deletion:** none in the core slice. Optional ~8 LOC removal of duplicate `escapeHtml` if the cleanup is folded in.

**Tests:**

- Unit test the new `primaryMetaFor('media')` branch with each media type/role combination and an empty-outlet case (ensure empties are filtered).
- Playwright regression on `/haku/?q=` for a media term (e.g., "Yle" or a distinctive outlet name) asserting the primary-meta line is rendered.
- Reverse test: unknown-media (no mediaType/mediaRole/mediaOutlet) should still render (falls through to family + title + excerpt).

**FI / EN:**

- The `MEDIA_TYPE_LABELS` / `MEDIA_ROLE_LABELS` map must have Finnish labels (matching `_media-macros.njk` FI defaults) because SISALTO_LABELS convention is Finnish across FI + EN mounts. Consistent with existing behavior.
- No EN corpus asymmetry blocker — EN media detail pages already carry same meta via `lang: en` frontmatter.

**Landing semantics:**

- Result link stays `data.url` (canonical media detail page). External source stays a separate action on the detail page, not surfaced as the primary link. Preserved unchanged.

**Pagefind contract:**

- No filter changes. No meta emission changes. `SearchResultPresenter` continues to be a pure client projection.

**Measurable success:**

- After the slice, top-N media results in `/haku/?q={media-term}` render `Mediassa · YEAR / Title / TypeLabel · RoleLabel · Outlet / Excerpt`.
- No regression in publications/theses/presentations/writings/generic primary-meta lines (they don't share the branch).
- No CSS or DOM structure change; navbar and full search stay one presenter, two densities.

## 23. Deferred

- Publications description projection (F&E only)
- Writings description projection (F&E only)
- Media archive hydration cleanup (mediassa.njk duplicate `renderCard()` ~30 LOC)
- `<div>` → `<ul>` container swap + CSS list-marker reset cleanup (semantic a11y)
- Navbar `escapeHtml` duplicate deletion (~8 LOC cosmetic)
- Presentations FULL Pagefind decision (roadmap-deferred)
- BBS / Gopher / themes

## 24. Final decision

```
PER-DOMAIN:
  Publications:   KEEP
  Theses:         KEEP
  Presentations:  KEEP
  Writings:       KEEP
  Media:          CHANGE  (small presenter branch, no canonical/Pagefind changes)
  Generic:        KEEP

MEDIA G3:         GO
NEXT SLICE:       PF5-G3A — presenter media branch (primaryMetaFor + label map)
DELETION EXPECTED: 0 in the core slice. Optional ~8 LOC (escapeHtml dedup).
INTENTIONALLY RETAINED:
  Canonical Content v1, Media M2 Pagefind contract, universal main[data-pagefind-body],
  all /data/*.json public contracts, F&E per-kind enrichments (APA/CSL, JUFO/OA/peer-
  review, citation export, thesis OuluREPO source link, publication archive tables),
  F&E renderExcerpt divergence (intentional).
```

STOP. This document is a decision, not an implementation.
