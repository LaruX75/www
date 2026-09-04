# DETAIL-UX-01C-B — Content Graph → Detail UX suitability audit (RE-AUDIT)

**Type:** AUDIT ONLY — no production code changed
**Date:** 2026-09-04 (initial) → 2026-09-04 (re-audit)
**Repo:** LaruX75/www
**Baseline SHA:** `b975998f919006babb96aedd7dbdb724e70f5945` (== origin/main after DETAIL-UX-01A)
**Working branch:** `audit/detail-ux-01c-b-content-graph` (doc-only)
**PR #211:** OPEN — DETAIL-UX-01C Part A (thumbnail fix) not yet merged.

Architecture Closure 1.0 stays `CLOSED / GREEN / MAIN`. Canonical Content v1 unchanged. R1-ADR1 boundaries unchanged.

## 0. Re-audit note

The initial audit (below) asked: "does the graph tell us something new about THIS item?" It correctly answered "no — the item's own canonical fields already do." That conclusion is preserved for the direct-fact question.

**But a second question was under-explored: does the graph reveal SHARED-NEIGHBOR STRUCTURES (A → X ← B) that ground precise relational navigation between canonical items?** The re-audit at §22–§27 below finds that YES, there are meaningful shared-neighbor structures — the strongest being course-linked presentations (up to 19 peers on `410014Y`), followed by shared research line, shared theme, and cross-domain curated project links.

The revised central conclusion (§27):

> **Content Graph is not justified as a new detail-page runtime data source. But it IS a valuable RELATIONSHIP MODEL revealing canonical shared-neighbor structures worth exposing to users. Those structures should be rendered at build time directly from canonical fields (Option B from §15) — the graph is the design tool, canonical fields are the data source.**

The original detail-item conclusion still stands:

## 1. Executive summary (initial)

**Content Graph is NOT a good source for detail-page "Liittyy suoraan tähän" UX in most domains.** Every semantically-useful direct relation the graph exposes is already available on the canonical record itself — usually already rendered as visible metadata. Adding a graph-derived section would duplicate what the user already sees.

**Only exceptions** where the graph adds novel UX-visible information:
- **Presentations** with `presentedIn` → presentationContext (7 of 138). This is a canonical join from `presentationContexts.json`, not a genuine graph inference.
- Nothing else on Publications, Theses, Writings, Media, Blog that isn't already surfaced by the current templates.

**Concrete finding for Kempele VESO (`/presentations/kempele-veso-2026/`):**
- 0 outgoing edges
- 1 incoming edge: `Jari Laru → presented → Kempele VESO`
- That single fact is already visible ("Jari Laru is the site author, presented on 21.1.2026")
- **The graph has nothing new to show here.** A "Liittyy suoraan tähän" section grounded in the graph would render EMPTY for Kempele VESO. That's correct behavior per spec §18 (omit section), but it also proves the graph does not solve this UX problem.

**Recommendation:**
- **Option B (§15) — skip the graph.** Present the same "direct relations" from canonical fields directly (research line, themes, courseContexts, event) at build time via Nunjucks + existing helpers. Simpler, deterministic, no graph coupling, no confusion between "canonical relationship" and "graph projection".
- Keep `content-context-sidebar.njk` architecture as-is (it already handles most of these semantics).
- Move `Kaikki esitykset` (and its cross-domain equivalents) from the hero action row to a footer-orientation region so it doesn't visually compete with the primary action.
- Do NOT add a graph-derived detail-page section.

**Kempele VESO next-slice UX:** "Samasta aiheesta" section grounded in existing `contexts: [business]` (canonical context; renders as "Muut koulutus- ja puhetyö -esitykset"). This is R1/discovery territory and belongs to a `DETAIL-UX-01C-B-DISCOVERY` follow-up if pursued — NOT a graph section.

**AC1: no reopen trigger.**

## 2. Repo state at audit time

- Branch: `audit/detail-ux-01c-b-content-graph`
- HEAD: `b975998f…` (== origin/main after DETAIL-UX-01A merge)
- PR #211 (`feat/detail-ux-01c-thumbnail-fix`): OPEN, head `29561814…`, contains Part A regression fix; NOT reflected in this audit's graph inspection since Part A is a thumbnail projection change and does not touch graph builder or inputs.

## 3. Current Content Graph architecture

Per `docs/knowledge-graph-ssr-01-closure-2026-09-03.md`, Content Graph is a **derived build-time projection**:

```
canonical sources
  researchProgram, researchProjects, canva (canvaMerged),
  presentationContexts.json, curated/projectLinks.json,
  collections.presentations
        ↓
buildKnowledgeGraph(data)   in  src/_data/knowledgeGraph.js
        ↓
{ nodes, edges, nodeCount, edgeCount, nodeKinds, edgeTypes }
        ↓
Consumers:
  - /tutkimus/tietograafi/  (visualisation page — sole current consumer)
  - (nothing else — public JSON endpoint deleted in KG-SSR-01)
```

Graph is NOT:
- canonical authority
- taxonomy authority
- identity authority
- URL authority
- recommendation engine

## 4. Node inventory (audit-time measurement)

Actual counts from a live invocation of `buildKnowledgeGraph(data)`:

| Node kind | Count |
| --- | ---: |
| person | 214 |
| presentation | 138 |
| thesis | 116 |
| publication | 57 |
| topic | 17 |
| theme | 16 |
| course | 12 |
| project | 6 |
| presentationContext | 5 |
| researchLine | 4 |
| **Total nodes** | **585** |

*Note: differs slightly from KG-SSR-01 audit baseline (582 nodes / 1200 edges) because COURSE-PAGE-01 added 3 new presentations + 1 new course entry after that baseline.*

Node URL availability by kind:
- `publication` — has `url` (external / DOI)
- `thesis` — has `url` (OuluREPO handle)
- `presentation` — has `url` (`/presentations/…/` local canonical)
- `presentationContext` — has canonical URL if `presentationContexts.json` entry supplies one
- `course` — no URL in the current graph node structure (courseId only)
- `researchLine` — has URL (`themeUrl` or `secondaryUrl`)
- `theme` — no URL
- `topic` — no URL
- `project` — has `url` if the researchProjects record supplies one
- `person` — has URL only for the root person (Jari Laru → `/tietoa/`); other persons are label-only

## 5. Edge inventory (audit-time measurement)

Edge frequency by direction:

| From kind | Edge | To kind | Count |
| --- | --- | --- | ---: |
| person | authorOf | publication | 216 |
| person | authorOf | thesis | 147 |
| thesis | hasTheme | theme | 141 |
| person | presented | presentation | 138 |
| publication | hasTheme | theme | 127 |
| person | advised | thesis | 116 |
| thesis | belongsToResearchLine | researchLine | 110 |
| publication | belongsToResearchLine | researchLine | 55 |
| presentation | usedInCourse | course | 44 |
| researchLine | coversTheme | theme | 21 |
| presentationContext | hasTopic | topic | 20 |
| presentation | presentedIn | presentationContext | 19 |
| project | linkedPublication | publication | 16 |
| project | linkedPresentation | presentation | 11 |
| person | participatesIn | project | 6 |
| project | supportsResearchLine | researchLine | 6 |
| project | linkedThesis | thesis | 5 |
| project | linkedPresentationContext | presentationContext | 1 |

## 6. Relationship confidence classification

| Edge type | Classification | Origin |
| --- | --- | --- |
| authorOf | A (explicit) — but self-obvious in metadata | canonical publication.authors / thesis.authors |
| presented | A (explicit) — but self-obvious (Jari Laru site-wide) | derived from presentation existence |
| advised | A (explicit) — but self-obvious in thesis metadata | thesis.advisors match `Laru` |
| reviewed | A (explicit) — self-obvious | thesis.reviewers match `Laru` |
| belongsToResearchLine | A (explicit) — **already in current sidebar and body cards** | canonical `researchLine` frontmatter |
| hasTheme / coversTheme | A (explicit) — **already visible on cards** | canonical `researchThemes[]` frontmatter |
| hasTopic | A (explicit) — narrow (only `presentationContext` → `topic`, 20 edges) | presentationContexts.json |
| usedInCourse | A (explicit) — **already shown in "Käyttöyhteys" card** | canonical `courseContexts[]` frontmatter |
| presentedIn | B (deterministic curated join) — **NEW** information not in current detail templates | `presentationContexts.json` URL matching |
| linkedPublication / linkedThesis / linkedPresentation / linkedPresentationContext | B (deterministic curated) — from `curated/projectLinks.json` | but only visible from PROJECT side; project has no detail page |
| participatesIn / supportsResearchLine | A (explicit) — narrow to Jari-Laru root; UX marginal | canonical researchProjects |

No C (derived semantic) or D (inferred) edges in the current graph — good.

**Key observation: 8 of the 15 edge types add zero UX value on a detail page because they duplicate metadata that is already visible.** The remaining 7 either lack usable targets (course, theme, topic nodes without URLs) or are narrowly applicable.

## 7. Six-domain coverage

Aggregate coverage of "does the graph give us anything the canonical templates don't already show?":

| Domain | Nodes in graph | Useful direct relations from graph | Notes |
| --- | ---: | --- | --- |
| Publication | 57 | Research line (55/57 = 96%) + themes (already visible in sidebar/citation card). Graph adds **nothing new** — same fields already rendered by `publication-item-body.njk:113-118`. | Author, journal, DOI already primary hero. Project→linkedPublication (16) could show "This is part of research project X" — currently NOT surfaced. Only novel candidate. |
| Presentation | 138 | Course (44/138 = 32%, already shown in "Käyttöyhteys"). Event context via `presentedIn` (19/138 = 14%, currently NOT surfaced). Course already visible. Event is the only novel signal. | 96/138 presentations have zero useful graph edges. |
| Thesis | 116 | Research line (110/116 = 95%, already visible as hero badge + Details card). Themes (77/116 = 66%, already visible as hero badges + Themes card). Graph adds **nothing new**. | Author, advisor already primary hero/metadata. |
| Writings | **0 nodes** | Writings are not in the graph as a node kind. | Council-speech siblings via `content-context-sidebar.njk`'s "Samassa kokouksessa" (canonical join, not graph). |
| Media | **0 nodes** | Media items not in the graph. | Media outlet + role visible in own metadata card. |
| Blog | **0 nodes** | Blog posts not in the graph. | Categories + keywords already in sidebar. |

**3 of 6 domains have zero graph coverage. In the remaining 3 (Publications, Presentations, Theses) the graph mostly restates what the template already shows.**

## 8. Kempele VESO case study

Live query from `buildKnowledgeGraph()`:

```
node: presentation:presentations-kempele-veso-2026
  label: Kempele VESO 2026
  url:   /presentations/kempele-veso-2026/
  date:  2026-01-21
  source: canva
  description: Opettajien työyhteisökoulutus Kempeleen kouluille tekoälyn ja digitaalisen oppimisen teemoista.

OUTGOING edges: 0

INCOMING edges: 1
  [person: Jari Laru] → presented → Kempele VESO
```

**One incoming edge, zero outgoing.** The single fact is: "Jari Laru presented this." Same information is already visible three places on the detail page:
- Site header/footer (author is Jari Laru)
- Hero source badge ("Canva · 21.1.2026")
- Cross-detail context (this is a Jari Laru presentation, obvious from the domain)

**The graph provides nothing useful to a "Liittyy suoraan tähän" section on Kempele VESO.**

Kempele VESO does NOT have:
- `usedInCourse` (not tied to a university course)
- `presentedIn` (not tied to a presentationContext.json entry — no event-context match)
- `linkedPresentation` (no `curated/projectLinks.json` entry)
- Any project relation

If we implemented a graph-derived direct-relations section, Kempele VESO would render an EMPTY section (per spec §18 → omit).

## 9. Direct relations vs discovery — the boundary

Correctness reminder:

| Layer | User label | Source | Belongs to |
| --- | --- | --- | --- |
| A. Direct canonical | "Liittyy suoraan tähän" | canonical field + optional graph-derived join | detail section |
| B. Context membership | "Kuuluu tähän kokonaisuuteen" | canonical `contexts` array | `content-context-sidebar.njk` |
| C. Topical discovery | "Samasta aiheesta" | topics, keywords, categories | `content-context-sidebar.njk` topic paths |
| D. Semantic ranking | "Katso myös" | `computeRelatedContent` + `semanticRelated.json` bounded boost | `content-context-sidebar.njk` |

R1-ADR1 boundary preserved. Do NOT mix.

For Kempele VESO the natural next-step candidate is layer B (context membership → "business" context → other training/speaking presentations), NOT layer A. This is a discovery pattern, not a canonical direct relation.

## 10. Current sidebar mapping

Proposed destinations for the 8 current `content-context-sidebar.njk` sections:

| Current section (FI) | Semantic role | Proposed destination |
| --- | --- | --- |
| Kokonaisuus → "Selaa samaa aineistoa" | archive orientation | **Move** to footer/orientation region (with `Kaikki esitykset`-style hub link) |
| Aihepolut → "Tämä sisältö liittyy" | topical discovery | **Keep** in sidebar (this is discovery, not direct relation) |
| Kontekstipolut | canonical context membership | **Keep** in sidebar |
| Sisältökonteksti (chip strip) | canonical context labels | **Keep** in sidebar |
| Kategoriat | taxonomy | **Keep** in sidebar (with existing `<details>` collapse) |
| Avainsanat | taxonomy | **Keep** in sidebar |
| Samassa kokouksessa | direct canonical (temporal sibling) | **Keep** in sidebar OR promote to a "Liittyy suoraan tähän" pattern for Writings/council-speeches specifically |
| Katso myös | semantic ranking | **Keep** in sidebar |

**Zero deletions proposed.** Only Kokonaisuus / Selaa samaa aineistoa moves.

## 11. Proposed user-facing labels (FI/EN)

If a "Liittyy suoraan tähän" section were implemented (recommendation: don't — use direct canonical projection instead), suggested labels:

| Signal | FI section heading | EN section heading | Label prefix (per item) |
| --- | --- | --- | --- |
| Publication → researchLine | Liittyy suoraan tähän | Directly related | Tutkimuslinja / Research line |
| Publication → project (linkedPublication) | Liittyy suoraan tähän | Directly related | Tutkimusprojekti / Research project |
| Presentation → course (usedInCourse) | Liittyy suoraan tähän | Directly related | Opintojakso / Course |
| Presentation → event (presentedIn) | Liittyy suoraan tähän | Directly related | Tilaisuus / Event |
| Thesis → researchLine | Liittyy suoraan tähän | Directly related | Tutkimuslinja / Research line |

**No user-visible tech names.** All labels are natural-language.

## 12. Prioritization model

If a section were implemented, priority order (highest signal first):

1. `presentedIn` (Presentations) — narrow (19 records) but genuinely new UX information
2. `usedInCourse` (Presentations) — 44 records, but already in "Käyttöyhteys" card
3. `linkedPublication` / `linkedPresentation` / `linkedThesis` — from curated project links (37 total edges, project-side)
4. `belongsToResearchLine` (Publications + Theses) — 165 edges but already visible in existing metadata cards

Cap at max 3–5 relations per detail page.

## 13. Zero-relation behavior

Per spec §18: omit the entire "Liittyy suoraan tähän" section when there are zero useful direct relations. Do NOT render "Ei suhteita löytynyt." style empty state.

For Kempele VESO: section omitted; user proceeds directly to sidebar's "Aihepolut" / "Kontekstipolut" / "Katso myös".

## 14. Desktop wireframes

### A. Presentation with useful direct relations — e.g. `luento-2-taman-vuosisadan-ydintaidot` (410014Y course-linked)

```
┌──────────────────────────────────────────────────────┐
│ ESITYS TAI OPETUSMATERIAALI                          │
│ 410014Y LUENTO 2: Tämän vuosisadan ydintaidot…       │
│ SlideShare · 29.8.2014                               │
│                                                      │
│                              [thumbnail 16:9]        │
│                                                      │
│ [Avaa esitys SlideSharessa]                          │
└──────────────────────────────────────────────────────┘
Esitys / description
────────────────────────────────────────────────────────
Käyttöyhteys
────────────────────────────────────────────────────────
Tilaisuus / Kohderyhmä / Opetuskonteksti: 410014Y
Opetusyhteys: Opettajankoulutus

────────────────────────────────────────────────────────

Liittyy suoraan tähän      ← NEW (from canonical courseContexts)
────────────────────────────────────────────────────────
Opintojakso
  → 410014Y Tieto- ja viestintätekniikka pedagogisena…
    (link to course landing if one exists,
     else to the course-labeled archive filter)

────────────────────────────────────────────────────────

Samasta aiheesta
────────────────────────────────────────────────────────
(existing content-context-sidebar sections)

────────────────────────────────────────────────────────
← Kaikki esitykset   (moved to footer orientation)
```

### B. Publication — e.g. any Publication with researchLine + linkedPublication

```
Publication hero (title / journal / DOI / [Avaa DOI:ssa])
────────────────────────────────────────────────────────
Tiivistelmä
────────────────────────────────────────────────────────
Lähdeviite (APA)
────────────────────────────────────────────────────────

Julkaisun tiedot (sidebar)  |  Liittyy suoraan tähän      ← NEW
Tekijät                     |  ────────────────────────
Julkaisukanava              |  Tutkimuslinja
Vuosi                       |    → AI Literacy (link)
Tyyppi                      |  Tutkimusprojekti
DOI  ← PRESERVED            |    → Generation AI (link)
JUFO                        |
Tutkimuslinja (existing)   ← "duplicate" but semantically distinct:
                              sidebar meta = attribute;
                              direct-relations = navigable relationship
                            |
                            |  Samasta aiheesta
                            |  ────────────────────────
                            |  (existing sidebar sections)

────────────────────────────────────────────────────────
← Kaikki julkaisut   (footer orientation)
```

### C. Detail with ZERO useful direct relations — e.g. Kempele VESO

```
┌──────────────────────────────────────────────────────┐
│ ESITYS TAI OPETUSMATERIAALI                          │
│ Kempele VESO 2026                                    │
│ Canva · 21.1.2026                                    │
│                                                      │
│                              [thumbnail — LOCAL     │
│                                after DETAIL-UX-01C  │
│                                Part A ships]        │
│                                                      │
│ [Avaa esitys Canvassa]                               │
└──────────────────────────────────────────────────────┘

Esitys / description
────────────────────────────────────────────────────────
Opettajien työyhteisökoulutus Kempeleen kouluille…

────────────────────────────────────────────────────────

(no "Liittyy suoraan tähän" section — omitted by design)

────────────────────────────────────────────────────────

Samasta aiheesta                        ← existing sidebar
────────────────────────────────────────────────────────
Kokonaisuus / Aihepolut / Kontekstipolut /
Kategoriat / Avainsanat / Katso myös

────────────────────────────────────────────────────────
← Kaikki esitykset   (footer orientation)
```

## 15. Mobile wireframe (Presentation with direct relations)

```
┌─────────────────────────────┐
│ ESITYS TAI OPETUSMATERIAALI │
│ Title                       │
│ SlideShare · 29.8.2014      │
├─────────────────────────────┤
│ [thumbnail]                 │
├─────────────────────────────┤
│ [Avaa esitys SlideSharessa] │
├─────────────────────────────┤
│ Esitys / description        │
├─────────────────────────────┤
│ Käyttöyhteys                │
├─────────────────────────────┤
│ Liittyy suoraan tähän       │  ← NEW section
│  Opintojakso                │
│    → 410014Y (link)         │
├─────────────────────────────┤
│ Samasta aiheesta            │  ← sidebar flows inline
│  Aihepolut                  │
│  Kontekstipolut             │
│  Kategoriat                 │
│  Avainsanat                 │
│  Katso myös                 │
├─────────────────────────────┤
│ ← Kaikki esitykset          │  ← footer orientation
└─────────────────────────────┘
```

## 16. Hub-orientation recommendation

`Kaikki esitykset` / `Kaikki julkaisut` / `Takaisin opinnäytteisiin` are domain-orientation links. Their current position in the hero action row visually competes with the primary CTA.

**Proposed:** move to a footer-orientation region below all content and relations sections. This preserves the escape-hatch semantics but stops the hero from implying "here are two things you could do next" when the second is just "leave this page".

Do NOT delete these links. They are legitimate orientation, just misplaced.

## 17. Deletion candidates

None. Every current graph edge remains valuable to the `/tutkimus/tietograafi/` visualisation. Every sidebar section remains valuable to R1 discovery. Every canonical field remains authoritative.

The only proposed structural change is a **reposition** of `Kaikki esitykset`-style links from hero to footer.

## 18. Architecture assessment

Reviewed against AC1 §6 reopen conditions:

| Condition | Repo evidence? |
| --- | :---: |
| new duplicate content ownership | No |
| canonical semantics moved into browser JS | No |
| Pagefind becoming canonical storage | No |
| new runtime JSON → HTML | No |
| loss of FI/EN parity | No |
| public contract removed | No |
| source/landing/context regression | No |

**Architecture Closure 1.0 = `CLOSED / GREEN / MAIN`.**

## 19. Recommendation

**Do NOT build a graph-derived detail-page section.**

Reasons (in order of importance):

1. **The graph mostly restates canonical fields already visible.** Publication / Thesis research line + themes are already in the sidebar / body cards. Presentation `usedInCourse` is already in "Käyttöyhteys". Adding a graph-derived section would duplicate rather than add information.
2. **The graph has no data for Writings / Media / Blog** (0 nodes for these 3 kinds). A "consistent" cross-domain graph-derived section would leave half the domains showing nothing.
3. **The graph is empty for Kempele VESO** (the reporter case). The section would omit, which proves the graph isn't the right layer for this UX need.
4. **Simpler direct-canonical projection would achieve the same UX** for Publications/Presentations/Theses (per §15 Option B) — and would automatically extend to any future canonical fields.
5. **`presentedIn`** is the only novel graph-derived signal, and it's really a canonical join from `presentationContexts.json`. It can be surfaced without traversing the graph object.

## 20. Smallest justified implementation slice (if approved)

Two candidates. Both are OPTIONAL and require user approval.

### DETAIL-UX-01C-B-ORIENT (small, safe)

**Scope:** move `Kaikki esitykset`-style hub-orientation links out of the hero action row into a footer-orientation region on all 6 detail templates. No new sections, no new data, no new taxonomy.

- 6 detail body partials edited
- `detail-orientation.njk` include stays exactly the same
- Only the placement inside each domain template changes

**Non-goals:** no direct-relations section, no discovery reorg, no `content-context-sidebar` change.

**Benefit:** hero primary action becomes visually dominant; user's next-step affordance is clearer.

**Test burden:** low. One Playwright spec asserting hub-link is present but NOT inside `.content-detail-hero .content-detail-actions`.

### DETAIL-UX-01C-B-DISCOVERY (medium, deferred)

**Scope:** implement a canonical-derived (NOT graph-derived) "Muut samasta kokonaisuudesta" section on Presentation detail. Uses existing `contexts:` field to filter `collections.presentations` at build time. Kempele VESO renders "Muut koulutus- ja puhetyö -esitykset" from other `contexts: [business]` presentations. Self-excluded, deterministic, no browser JS.

- One new Nunjucks helper (`selectSameContextPresentations(current, limit)`)
- One new SSR partial on presentation-item.njk
- Card reuse decision (probably shared card partial)
- FI/EN labels via existing `contentContext.js` CONTEXT_META
- Empty state = omit section

**Non-goals:** no other domain gets this section in the same slice. No graph consumption. No context-membership inference.

**Benefit:** genuinely new UX for Kempele VESO and its ~12 business-context peers.

**Test burden:** medium — new Playwright spec (positive case, empty case, self-exclusion, FI/EN labels).

## Guardrails observed by this audit

- **No production code changed.** Doc only.
- **No canonical Content v1 change** proposed.
- **No new taxonomy** proposed.
- **No graph builder change** proposed.
- **No new browser JS** proposed.
- **No new client-side content model** proposed.
- **No Pagefind change** proposed.
- **R1-ADR1 boundaries** preserved — semantic ranking stays ranking; contexts stay canonical.
- **contexts ≠ topics** — respected throughout.
- **Architecture Closure 1.0** stays `CLOSED / GREEN / MAIN`.

---

## STOP GATE

**No implementation started.** No branch pushed. No PR opened.

Summary for user decision:

1. **Content Graph is NOT suitable** as a source for "Liittyy suoraan tähän" on detail pages. Almost all useful direct relations are already visible on the current templates.
2. **Publications and Theses have the best graph coverage** (95%+ research-line linkage) but this information is ALREADY rendered by the current sidebar and body cards.
3. **Kempele VESO specifically has 0 useful graph edges.** The graph section would render empty for it — proving the graph is not the answer to the reporter's UX question.
4. **`Liittyy suoraan tähän` vs. `Samasta aiheesta`**: even without a graph section, these two remain semantically distinct in the current `content-context-sidebar.njk` — canonical `Samassa kokouksessa` / `Kontekstipolut` (direct) vs. `Aihepolut` / `Katso myös` (discovery). The distinction is present today; the graph doesn't add clarity.
5. **`Kaikki esitykset` should move** from hero action row to footer orientation — cheapest UX win. That's the `DETAIL-UX-01C-B-ORIENT` slice.
6. **Smallest justified implementation slice:** `DETAIL-UX-01C-B-ORIENT` (hub-link reposition on 6 templates, no new data, no new section). If the user also wants Kempele-VESO-style peers, that's a separate `DETAIL-UX-01C-B-DISCOVERY` slice grounded in canonical `contexts`, not the graph.

Awaiting explicit approval before any code change.

---

## 22. RE-AUDIT — relational navigation via shared-neighbor structures

The initial audit examined **direct-fact edges** (does the graph attach a fact to THIS item?). It missed the second-order question: **shared-neighbor patterns** (A → X ← B — does the graph reveal that many items share the same neighbor?).

Measurement method: live invocation of `buildKnowledgeGraph()` against origin/main, then a systematic scan for shared-neighbor patterns across every anchor kind × edge type × pivot kind that could plausibly ground "why these belong together".

Nine A → X ← B patterns tested:

| # | Pattern | Peer groups (≥2 anchors) | Max peers | Total anchors touched | Strength |
| :---: | --- | ---: | ---: | ---: | --- |
| 1 | Presentation — usedInCourse → Course ← Presentation | 6 of 6 | **19** | 42 | STRONG |
| 2 | Presentation — presentedIn → PresentationContext ← Presentation | 3 of 4 | 6 | 19 | STRONG |
| 3 | Publication — belongsToResearchLine → ResearchLine ← Publication | 3 of 3 | 25 | 55 | STRONG (but broad) |
| 4 | Thesis — belongsToResearchLine → ResearchLine ← Thesis | 4 of 4 | 41 | 110 | STRONG (but very broad) |
| 5 | Publication — hasTheme → Theme ← Publication | 13 of 13 | 21 | 127 | STRONG (need ranking) |
| 6 | Thesis — hasTheme → Theme ← Thesis | 13 of 15 | 32 | 141 | STRONG (need ranking) |
| 7 | Presentation ← linkedPresentation ← Project → linkedPresentation → Presentation | 3 of 5 | 4 | 11 | STRONG (curated, narrow) |
| 8 | Publication ← linkedPublication ← Project → linkedPublication → Publication | 4 of 5 | 4 | 16 | STRONG (curated, narrow) |
| 9 | Thesis ← linkedThesis ← Project → linkedThesis → Thesis | 2 of 2 | 3 | 5 | STRONG (curated, narrow) |

Cross-domain shared-neighbor patterns:

| Cross-domain pattern | Coverage |
| --- | --- |
| Publication + Thesis on same ResearchLine | Mobiilioppiminen: 25 publications + 41 theses; Opettajankoulutus: 15 pub + 19 th; Tekoälylukutaito: 15 pub + 13 th |
| Publication + Presentation + Thesis on same Project | Generation AI: 4 pub + 4 pres + 3 theses (curated) |

**These are the strongest cross-domain neighborhoods in the current graph.**

## 23. Course case study — 405040Y Teknologiatuettu oppiminen

Live query for course node `course:405040y`:

```
course node
  id:            course:405040y
  label:         Teknologiatuettu oppiminen ja työskentely
  courseId:      405040Y
  url:           (none — course nodes lack URL in current schema)
  teachingUnit:  (empty)

Incoming usedInCourse edges (3):
  → 405040Y Luento 1: Johdanto (2026 A)
  → 405040Y Luento 2: Digitaalinen osaaminen vuonna 2026 – DigComp 3.0
  → 405040Y Luento 3: Tekoälylukutaito
```

**All 3 lectures created in COURSE-PAGE-01 workstream. They form a clean shared-neighbor cluster.**

For scale, the same query on `course:410014y` (Tieto- ja viestintätekniikka pedagogisena työvälineenä):

```
Incoming usedInCourse edges (19):
  → 1. luento tieto- ja viestintätekniikan perusteet…
  → 2. luento tieto- ja viestintätekniikan pedagogiset perusteet…
  → 3. luento… CSCL
  → 4. luento… medialukutaito
  → 410014Y Johdantoluento…
  → 410014Y LUENTO 2: Tämän vuosisadan ydintaidot
  → 410014Y Luento 4: Sopimukset ja tekijänoikeudet
  → 5. Luento… tulevaisuus syntyy tutkimalla
  → Luento 1: Tieto- ja viestintätekniikka pedagogisena työvälineenä
  → Luento 2. Teoria (410014Y)
  → Luento 2: … opetuskäyttö ja yhteiskunta
  → Luento 3: Opetuksen uudet ympäristöt ja teknologiat
  → Luento 3. Suunnittelu ja pedagogiset mallit (410014Y)
  → Luento 5: haasteet ja koulun todellisuus (410014Y)
  → Luento1. Johdanto (410014Y TVT pedagogiset perusteet)
  → OSAAVA VESO: Tieto- ja viestintätekniikka pedagogisena työvälineenä. Raahe 2015
  → Teoria suunnittelu a_otvt
  → Tieto ja viestintätekniikka pedagogisena työvälineenä. luento 1
  → TVT Oppimisen tukena
```

**19-item peer group.** Landing on any of these 19 pages, the user would benefit hugely from "Samalla kurssilla" navigation to the other 18. Current UX offers "Aihepolut / Katso myös" — good for topical discovery, but the RELATIONAL SIGNAL (same course) is stronger.

## 24. Direct-fact vs. relational-navigation distinction

| UX Question | Answer | Suitable data source |
| --- | --- | --- |
| A. What course is this presentation from? | "Käytetty opetuksessa: 405040Y" | canonical `courseContexts[]` — ALREADY rendered in "Käyttöyhteys" card |
| B. What OTHER presentations are from that same course? | "Samalla kurssilla: Luento 1, Luento 2, Luento 3" | canonical `courseContexts[].courseId` on peer presentations |

Question A is direct-fact — the graph is redundant, canonical `Käyttöyhteys` card already shows the course.

**Question B is relational-navigation — currently NOT surfaced anywhere on the site.** This is the genuine UX gap.

For 405040Y course page, the 3 lectures already appear as a curated list on the course landing page. But for someone landing on `/presentations/405040y-luento-2-…/` directly (search / share link / RSS), there is NO way to discover the other 2 lectures without leaving the page.

## 25. Three discovery models compared

| Model | Data source | Kempele VESO peers | 410014Y-Luento-3 peers | Precision | Explainability |
| --- | --- | ---: | ---: | --- | --- |
| A. Broad canonical context (`contexts: [business]`) | canonical `contexts[]` field | ~12 (broad "training/speaking" group) | ~12 (same broad group) | Low-medium | Medium ("koulutus- ja puhetyö" is broad) |
| B. Topic / semantic similarity (existing `Aihepolut` / `Katso myös`) | topics + Pagefind + semantic ranking | Varies by topic match | Varies | Medium (algorithmic) | Low ("why this?") |
| C. Relational neighborhood (shared canonical entity) | canonical `courseContexts[].courseId` etc. | 0 (no course/event/project) | 18 (same course) | **HIGH** (explicit shared entity) | **HIGH** ("same course") |

**Model C is the strongest for explainability** but is DATA-DEPENDENT — some items have no strong shared neighbor (like Kempele VESO), and for those, Model A/B is still the right fallback.

Coverage of Model C across the presentation collection:
- Presentations with `usedInCourse` neighborhood ≥2 peers: 42 of 138 (30%)
- Presentations with `presentedIn` neighborhood ≥2 peers: 19 of 138 (14%)
- Presentations with `linkedPresentation` (project) neighborhood ≥2 peers: 11 (via 3 projects)
- Presentations with none of the above: **~86 of 138 (62%)** — Kempele VESO belongs here

So Model C is a **precise-when-applicable** section, not a universal replacement.

## 26. Do we need the Content Graph at RENDER time?

**No.** All Model C shared-neighbor structures can be derived at build time directly from canonical fields:

| Relational neighborhood | Direct canonical filter (no graph object needed) |
| --- | --- |
| Samalla kurssilla | `collections.presentations` where `courseContexts[].courseId` matches |
| Samassa tilaisuudessa | `collections.presentations` where matched via `presentationContexts.json` (URL/title match) |
| Samassa tutkimuslinjassa | `researchProgram.publications` / `.theses` where `researchLine` matches |
| Yhteinen tutkimusteema | `researchProgram.publications` / `.theses` where `researchThemes[]` intersects |
| Samasta projektista | `curated/projectLinks.json` reverse lookup |

**The graph's value is in MODELING and VERIFICATION** — it revealed these shared-neighbor patterns systematically. But at render time, each section reduces to a canonical `filter + limit + sort` — no graph traversal needed, no runtime graph JSON, no browser JS.

This matches the R1-ADR1 boundary: canonical fields remain authoritative; derived projections stay in their lane; no new browser-side content model.

## 27. Revised central conclusion

The initial audit's binary "Content Graph → detail UX: NO" was too tight.

**Revised:**

- **Content Graph is not justified as a new detail-page runtime/rendering data source.** No graph object needs to reach the browser; no runtime JSON → HTML.
- **Content Graph IS a valuable RELATIONSHIP MODEL** revealing strong canonical shared-neighbor structures — most notably:
  - Presentation → Course ← Presentation (42 presentations, 6 course groups, up to 19 peers)
  - Presentation → PresentationContext ← Presentation (19 presentations, up to 6 peers)
  - Publication/Thesis → ResearchLine ← Publication/Thesis (165 items)
  - Publication/Thesis → Theme ← Publication/Thesis (268 items)
  - Cross-domain via curated Project (37 items)
- **Rendering should be direct-canonical at build time** (Option B from §15). The graph informs which relationships are worth surfacing but does not appear in the render pipeline.
- **Precise navigation labels** ("Samalla kurssilla", "Samassa tilaisuudessa", "Samassa tutkimuslinjassa") replace generic "Liittyy suoraan tähän" — the shared entity IS the explanation.
- **Kempele VESO control case** still holds: no course, no event, no project link → relational section is correctly omitted → falls back to broad canonical context (`contexts: [business]`) discovery.

## 28. Revised domain matrix

| Domain | Direct graph value | Shared-neighbor value | Canonical derivable? | UX potential |
| --- | :---: | :---: | :---: | --- |
| Publications | Low (already in metadata) | **High** — 55/57 with research line, 127 with themes | **Yes** — direct `researchLine` + `researchThemes[]` filter on `researchProgram.publications` | Strong via Model C ("Samassa tutkimuslinjassa"); large peer groups need ranking/limit |
| Presentations | Low (courseContexts already in Käyttöyhteys) | **High for course-linked (42/138); Medium for event-linked (19/138); Low for others** | **Yes** — direct `courseContexts[].courseId` or `presentationContexts.json` lookup | Model C ("Samalla kurssilla", "Samassa tilaisuudessa") for 30-50% of presentations; Model A/B fallback for rest (Kempele VESO) |
| Theses | Low (research line already visible) | **High** — 110 with research line, 141 with themes | **Yes** — direct `researchLine` + `researchThemes[]` filter | Strong via Model C ("Samassa tutkimuslinjassa"); huge peer groups (up to 41) need ranking |
| Writings | **Zero** — no graph node kind | None from graph. Council-speech siblings via canonical `meeting` metadata (`Samassa kokouksessa` already exists). | Yes — already partially rendered | Existing sidebar sufficient |
| Media | **Zero** — no graph node kind | None from graph. | N/A | Existing sidebar sufficient |
| Blog | **Zero** — no graph node kind | None from graph. | N/A | Existing sidebar sufficient |

**Recommendation column:**

- Publications: SUITABLE for Model C (research line, themes) — build-time canonical, no graph
- Presentations: SUITABLE for Model C (course, event) — build-time canonical, no graph
- Theses: SUITABLE for Model C (research line, themes) — build-time canonical, no graph
- Writings: EXISTING SIDEBAR sufficient (`Samassa kokouksessa` already does this)
- Media: NOT SUITABLE for Model C (no shared-neighbor structure)
- Blog: NOT SUITABLE for Model C (no shared-neighbor structure)

## 29. Cross-domain relational navigation

The graph reveals two genuinely cross-domain shared-neighbor patterns:

1. **Same research line: Publication + Thesis** — landing on a publication in "Mobiilioppiminen ja yhteisöllinen tiedonrakentelu" line, the user could see "Muut samasta tutkimuslinjasta" listing both publications (25) and theses (41). Cross-domain aggregate.

2. **Same curated project: Publication + Presentation + Thesis** — landing on any Generation AI project item, could see cross-domain peers (4 pub + 4 pres + 3 theses).

Both are canonical-derived (research line = `researchLine` field; project link = `curated/projectLinks.json`). No graph traversal needed at render time.

**These are STRONGER cross-domain relational signals than the current sidebar's "Katso myös" (semantic ranking) provides** — and their meaning is transparent to the user.

## 30. UX vocabulary — precise labels

Instead of one generic "Liittyy suoraan tähän" (initial audit §11), use precise shared-entity labels:

| Shared entity | FI label | EN label |
| --- | --- | --- |
| Course | Samalla kurssilla | On the same course |
| Presentation context / event | Samassa tilaisuudessa | At the same event |
| Research line | Samassa tutkimuslinjassa | Same research line |
| Research theme | Samasta tutkimusteemasta | Same research theme |
| Curated project | Samasta projektista | From the same project |
| Council meeting (writings, already exists) | Samassa kokouksessa | Same council meeting |

Each label explains WHY items belong together. No user needs to know what an "edge" or "node" is.

## 31. Comparison to current `Katso myös`

For an item with a strong relational neighborhood (e.g., 410014Y Luento 3):

| Current UX | Revised UX |
| --- | --- |
| Katso myös | Samalla kurssilla |
| (semantically-ranked topical peers — user asks "why?") | (course-shared peers — meaning is self-evident) |

For an item without a strong relational neighborhood (Kempele VESO):

| Current UX | Revised UX |
| --- | --- |
| Katso myös (topical) | Katso myös (topical) — UNCHANGED |

**Model C ADDS a precise section for ~40 presentations; does NOT replace R1 discovery for the other ~100.**

## 32. Kempele VESO control case revisited

Confirmed still applicable:

- 0 outgoing edges
- 1 incoming (Jari Laru → presented) — self-obvious
- No `usedInCourse`, no `presentedIn`, no `linkedPresentation`
- No shared-neighbor structure ≥2 peers

→ Relational section correctly OMITTED.
→ Kempele VESO's UX improvement path is Model A (canonical `contexts: [business]` → "Muut koulutus- ja puhetyö -esitykset") or Model B (existing `Aihepolut` / `Katso myös`). These are DISCOVERY layers, not RELATIONAL NAVIGATION.

The re-audit does NOT overturn the Kempele-specific finding. It clarifies WHY: Kempele belongs to the ~62% of presentations without a strong relational neighborhood. That's a data property, not a graph/canonical model failure.

## 33. Smallest justified next step (revised)

Three candidates, ranked by user benefit / cost:

### DETAIL-UX-01C-B-COURSE (RECOMMENDED)

**Scope:** implement "Samalla kurssilla" section on `presentation-item.njk` for presentations whose `courseContexts[]` matches other presentations' `courseContexts[]`.

- One canonical filter helper: `selectPeerPresentationsByCourse(currentUrl, courseContexts, limit=6)` in `.eleventy.js`
- One conditional SSR section in `presentation-item.njk`: renders only if peers exist; heading = "Samalla kurssilla" (FI) / "On the same course" (EN)
- Reuses existing presentation card markup where practical
- Coverage: 42 of 138 presentations (30%)
- Kempele VESO: section correctly omitted (no `courseContexts`)
- 410014Y lectures: each gets an 18-peer navigation to other course lectures
- 405040Y course-page lectures: each gets a 2-peer navigation to the other 2

**Non-goals:** other domains, other relational patterns (event/researchLine/project) — deferred to later slices.

**Test burden:** low-medium — 1 new spec (positive 410014Y case, positive 405040Y case, negative Kempele case, self-exclusion, FI/EN labels).

### DETAIL-UX-01C-B-ORIENT (SMALL, ALSO RECOMMENDED)

**Scope:** move `Kaikki esitykset`-style domain hub links from hero action row to footer-orientation region on all 6 detail templates. Independent from -COURSE.

**Benefit:** primary CTA becomes visually dominant.

### DETAIL-UX-01C-B-RESEARCH (LATER)

**Scope:** implement "Samassa tutkimuslinjassa" section for Publications + Theses. Extends Model C to those domains, potentially cross-domain aggregate.

**Deferred** because peer groups are large (up to 41) and need thoughtful ranking/limiting/paging design.

### DETAIL-UX-01C-B-DISCOVERY (LATER)

**Scope:** implement broad-context discovery for Kempele-VESO-style presentations without strong relational neighborhood. Uses `contexts:` canonical field.

**Deferred** because it's a Model A (fallback) implementation and lower priority than Model C wins.

**Recommended ORDER:** COURSE + ORIENT (bundled or separate) → RESEARCH → DISCOVERY.

## 34. Final answers to the re-audit questions

1. **Did the Content Graph actually reveal the course-lecture structure?**
   Yes. Course node `405040y` has 3 incoming `usedInCourse` edges (the 3 lectures); `410014y` has 19. All courses (6 total) have ≥1 incoming, all have ≥2 peers when counted. Confirmed at §23.

2. **What concrete `Presentation → Course ← Presentation` groups were found?**
   6 groups: 410014Y (19 peers), 410017Y (multiple), 050091A (1), 405021Y (1), 405040Y (3), 407062A (1). Full listing at §23.

3. **Is "Samalla kurssilla" more precise and useful than broad `contexts` discovery for the user?**
   YES — for the 42 course-linked presentations. Shared-course meaning is self-evident; broad `contexts: [business]` is not.

4. **Were analogous strong A → X ← B structures found on Publications / Theses?**
   YES: `belongsToResearchLine` (55 pub + 110 th) and `hasTheme` (127 pub + 141 th). Both are canonical-derivable without graph traversal.

5. **Is the Content Graph itself needed at SSR time, or can it be derived more simply from canonical data?**
   Not needed at SSR time. All shared-neighbor patterns reduce to canonical `filter + limit + sort`. Graph is design/verification tool only.

6. **What is the graph's proper role in detail UX given this evidence?**
   **Relationship map, not data source.** It reveals which canonical fields yield precise shared-neighbor navigation; those fields drive the SSR. The graph object itself stays outside the render pipeline.

7. **Does the original "Content Graph → detail UX: NO" conclusion change?**
   **Yes — refined, not overturned.** The graph is not a NEW render-time source (original conclusion holds). But it exposes shared-neighbor structures worth surfacing (new finding). Render those structures directly from canonical fields.

8. **Smallest justified next implementation slice?**
   **`DETAIL-UX-01C-B-COURSE`** — "Samalla kurssilla" on `presentation-item.njk`. Uses canonical `courseContexts[].courseId` directly. Covers 42/138 presentations. Kempele VESO correctly gets no section. 405040Y and 410014Y lecture navigation becomes native. Est. 1 helper + 1 SSR section + 1 spec. Independent of, but bundleable with, `DETAIL-UX-01C-B-ORIENT` (hub-link reposition).
