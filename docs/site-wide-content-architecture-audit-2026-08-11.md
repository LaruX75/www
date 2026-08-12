# Site-Wide Content Architecture Audit

Date: 2026-08-11

## Executive Summary

Sivustolla on jo kolme vahvaa canonical object -> projection -pilottia tuotannollisessa käytössä:

- esitykset
- julkaisut
- opinnäytteet

Ne käyttävät erillistä authoritative source -> canonical object -> public projection -linjaa, jonka päällä toimivat:

- FI-listaus
- EN-listaus
- public JSON
- detail HTML
- Pagefind

Samaan aikaan sivustolla on myös toinen, vanhempi mutta edelleen hyödyllinen shared layer markdown-pohjaisille sisällöille:

- `src/_utils/resolveContentMeta.js`
- `src/_utils/toPublicContentRecord.js`
- `src/js/content-engine.js`
- `src/_utils/contentPresets.js`

Tämä layer toimii hyvin yleisissä content-feedeissä, mutta ei vielä muodosta yhtä universaalia canonical contractia kaikille sisältötyypeille. Suurin jäljellä oleva arkkitehtuurivelka ei ole enää esityksissä, julkaisuissa tai opinnäytteissä, vaan kirjoitukset-hubissa:

- `src/kirjoitukset.njk`
- `src/en/writings.njk`

Niissä on edelleen rinnakkaisia data-polkuja, upotettua JSON:ia ja source-kohtaista client-normalisointia. Suurin perusteltu seuraava checkpoint on siksi kirjoitukset-hubin canonical page projection + parity, ei uuden sisältötyypin migraatio.

## Audit Scope And Method

Audit perustuu repo-evidenssiin seuraavissa kerroksissa:

- collections ja `_data`-loaderit
- public JSON -endpointit
- FI/EN listaussivut
- detail-HTML-polut
- shared metadata/content layer
- taxonomy, knowledge graph, embeddings ja recommendations
- built artefacts `_site/data/*.json`

Audit ei tee runtime-, UI-, URL-, redirect-, embedding-, Pagefind-ranking- tai contract-muutoksia.

## Current Global Architecture

Sivustolla on tällä hetkellä käytännössä kolme rinnakkaista arkkitehtuurikerrosta.

### 1. Shared markdown content layer

Tämä layer normalisoi markdown-pohjaisia Eleventy-collection-itemejä:

- `src/_utils/resolveContentMeta.js`
- `src/_utils/toPublicContentRecord.js`
- `src/_utils/contentPresets.js`
- `src/js/content-engine.js`

Se palvelee erityisesti feedejä:

- `/data/content.json`
- `/data/publications.json`
- `/data/presentations.json`
- `/data/media.json`
- `/data/initiatives.json`
- `/data/council-speeches.json`

### 2. Type-specific canonical layers

Nämä ovat jo selkeästi authoritative canonical object -kerroksia:

- `src/_data/presentationsPage.js`
- `src/_data/publicationsPage.js`
- `src/_data/researchfiContent.js`
- `src/_data/theses.js`
- `src/_utils/toThesesCollectionItems.js`

### 3. Specialized projections

Nämä eivät ole velkaa sinänsä, vaan tarkoituksellisia erikoisprojekteja:

- `src/_data/knowledgeGraph.js`
- `src/_data/semanticRelated.js`
- `scripts/build-embeddings.js`

## Content Type Inventory

Rakennetun datan perusteella tärkeimmät public feed -määrät ovat:

| Feed | Items |
| --- | ---: |
| `/data/content.json` | 466 |
| `/data/publications.json` | 164 |
| `/data/presentations.json` | 139 |
| `/data/media.json` | 73 |
| `/data/initiatives.json` | 10 |
| `/data/council-speeches.json` | 79 |
| `/data/researchfi.json` | 56 |
| `/data/theses.json` | 169 |
| `/data/presentations-page.json` | 210 |
| `/data/publications-page.json` | 56 |

`/data/content.json` sisältää vain shared markdown content -poolin, ei opinnäytteitä eikä Research.fi-julkaisuja. Tämä on tärkein site-wide arkkitehtuurihavainto.

`content.json`-poolin `contentType`-jakauma:

- `presentation`: 139
- `speech`: 92
- `blogPost`: 70
- `mediaItem`: 61
- `opinion`: 47
- `article`: 14
- `initiative`: 10
- `video`: 9
- `column`: 9
- `statement`: 6
- `scientificPublication`: 6
- `expertAssignment`: 3

## Architecture Matrix

| Content type / view | Authoritative source | Canonical object layer | Public projection | Detail HTML | FI/EN parity | SSR/JS parity | Classification | Severity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Presentations | heterogeneous presentation sources | `src/_data/presentationsPage.js` | `/data/presentations-page.json` | local presentation pages | yes | yes | A | low |
| Publications | `researchfiContent` + manual fallback | `src/_data/publicationsPage.js` + `src/_data/researchfiContent.js` | `/data/publications-page.json` | local publication detail pages | yes | yes | A | low |
| Theses | `src/_data/theses.js` | `src/_data/theses.js` | `/data/theses.json` | 169 local thesis detail pages | yes | yes | A | low |
| Generic markdown content feeds | Eleventy markdown collections | `resolveContentMeta` + `toPublicContentRecord` | `/data/content.json` and per-type feeds | markdown detail pages | mixed | mixed | B | medium |
| Media archive FI | markdown media files | partial shared layer only | `/data/media.json` | local media detail pages | n/a | partial PE parity | B | medium-low |
| Media archive EN | markdown media files | no dedicated canonical page projection | none, SSR-only archive | local media detail pages | partial | n/a | B | medium-low |
| Writings FI | multiple collections | no page-level canonical dataset | mixed embedded JSON + shared engine | existing detail pages | n/a | no | C | high |
| Writings EN | multiple collections + `researchfi.json` | no page-level canonical dataset | multiple feeds + client-side re-mapping | existing detail pages | no | no | C | high |
| Knowledge graph | curated + content + research data | bespoke graph model | `/data/knowledge-graph.json` | graph page only | n/a | yes | D | low |
| Semantic related / embeddings | `_site/data/content.json` + `_site/data/theses.json` | embedding input builder | JSON/cache outputs | n/a | n/a | n/a | D | medium |

### Classification Legend

- A = canonical object -> projection implemented end-to-end
- B = mostly aligned, but not yet unified page-level contract
- C = real architecture debt with parallel runtime paths
- D = intentional specialized projection, not a migration target by default

## Public JSON Inventory

### Shared content feeds

Allowlist-pohjaisia shared feeds:

- `/data/content.json`
- `/data/publications.json`
- `/data/presentations.json`
- `/data/media.json`
- `/data/initiatives.json`

Näiden serialisointi kulkee `_shared.serializeItems` -> `toPublicContentRecord`.

### Page projections

Tyyppikohtaiset canonical page projections:

- `/data/presentations-page.json`
- `/data/publications-page.json`
- `/data/council-speeches.json`

Näistä erityisesti presentations/publications ovat vahvoja allowlist-sopimuksia.

### Type-specific feeds outside shared layer

- `/data/theses.json`
- `/data/researchfi.json`

Nämä ovat edelleen hallittuja allowlist-feedejä, mutta eivät käytä shared `toPublicContentRecord`-polkua.

### Specialized feeds

- `/data/taxonomy-index.json`
- `/data/knowledge-graph.json`

## Detail HTML Inventory

Canonical-detail-tila on nyt vahva kahdessa ulkoisesta datasta tulevassa sisältötyypissä:

- julkaisut: `_site/julkaisut/` sisältää listauksen + local detail -sivut
- opinnäytteet: `_site/opinnaytteet/` sisältää listauksen + 169 local detail -sivua

Esityksissä detail-polku on jo ollut paikallinen markdown-pohjainen rakenne, ja listaus käyttää nyt samaa canonical kerrosta.

Media-, blogi-, politiikka- ja useimmat kirjoitussisällöt ovat edelleen perinteisiä markdown detail -sivuja ilman erillistä page-level canonical resolveria. Tämä ei ole ongelma yksittäisen detail-sivun kannalta, mutta se rajoittaa listaushubeihin tehtävää parity-siivousta.

## FI / EN Parity

### Green

- `esitykset` / `en/presentations`
- `julkaisut` / `en/publications`
- `opinnaytteet` / `en/theses`

Näissä FI- ja EN-sivut käyttävät samaa canonical dataset -linjaa tai siitä johdettua eksplisiittistä subsettiä.

### Not Yet Green

- `kirjoitukset` / `en/writings`
- `mediassa` / `en/media`

`en/writings.njk` on tässä auditissa selvästi heikoin kohta:

- fetchaa erikseen `/data/publications.json`, `/data/initiatives.json`, `/data/content.json`, `/data/researchfi.json`
- rakentaa scientific-publications-taulukon clientissä `rawItems.map(...)`-normalisoinnilla
- ei kuluta yhtä page-level canonical datasettiä

`en/media.njk` on kevyempi poikkeus:

- käyttää samaa `mediaArchive`-lähdettä kuin FI-SSR
- mutta ei käytä `content-engine`- tai `/data/media.json`-polkua kuten FI-sivu

## SSR / JS Parity

### Green

- presentations page
- publications page
- theses archive

### Partial

- media FI: SSR avausjoukko tulee `mediaArchive`sta, JS täydentää `/data/media.json`-feedillä
- tämä on toimiva progressive-enhancement-malli, mutta ei yhtä puhdas canonical page projection kuin esityksissä tai julkaisuissa

### Red / Legacy

- writings FI
- writings EN

`src/kirjoitukset.njk` käyttää sekä:

- upotettuja JSON-blokkeja (`mielipiteet-data`, `lausunnot-data`, `kolumnit-data`, `aloitteet-data`, `puheet-data`, `blog-data`, `pub-data`)
- `window.ContentEngine.query(...)`-hakuja

Tämä tarkoittaa, että samalla sivulla elää kahta eri runtime-mallia:

- embedded page data
- shared endpoint/client engine

`src/en/writings.njk` käyttää vielä rinnakkaisemmin useita feed-fetch-polkuja ja source-kohtaista JS-normalisointia.

## Taxonomy, Metadata And JSON-LD

### Metadata layer

Shared metadata-rakenne on olemassa ja käyttökelpoinen:

- `src/_data/contentSchema.js`
- `src/_utils/resolveContentMeta.js`
- `src/_utils/getTaxonomyType.js`

Tämä layer normalisoi erityisesti markdown collections -sisältöjä.

### Taxonomy

`eleventy.collections.js` rakentaa taxonomy-sivut lähteistä:

- blog
- publications
- politics
- media
- presentations
- `researchfiContent.toCollectionItems(...)`

Merkittävä havainto: theses eivät ole mukana taxonomy source itemeissä, vaikka ne ovat mukana knowledge graphissa ja embeddings-poolissa. Tämä on todellinen site-wide rakenteellinen epäyhtenäisyys, mutta ei yhtä kiireellinen kuin writings-hubien runtime-pariteetti.

### JSON-LD

JSON-LD- ja schema-käytännöt ovat vahvistuneet erityisesti:

- publication detail pages
- thesis detail pages
- presentation pages

Audit ei löytänyt tarvetta uudelle site-wide schema-refaktorille tässä vaiheessa.

## Pagefind Structural Status

Arkkitehtuurin kannalta Pagefind-tilanne on nyt hyvä:

- julkaisuilla on omat detail-dokumentit
- opinnäytteillä on omat detail-dokumentit
- esityksillä on omat local presentation pages

Tämä korjaa juuri sen rakenteellisen ongelman, jossa yksittäinen sisältö löytyi vain koontisivun tai taksonomian kautta.

Audit ei osoita tarvetta uudelle Pagefind-specific muutokselle tässä checkpointissa. Jäljellä olevat velat ovat enemmän content-page paritya kuin hakukerrosta.

## Embeddings And Recommendations

Embeddings-rakenne on jo yllättävän hyvin canonical-identiteettien päällä:

- `scripts/build-embeddings.js` käyttää poolia `_site/data/content.json` + `_site/data/theses.json`
- `src/_utils/buildEmbeddingInput.js` osaa käsitellä canonical `contentType`-tasoja
- `src/_data/semanticRelated.js` on tarkoituksellinen specialized projection

Tärkeä poikkeus:

- Research.fi-julkaisut eivät kuulu samaan embedding-pooliin kuin `content.json` + `theses.json`

Tämä on mahdollinen myöhempi laajennus, mutta ei tämän auditin perusteella seuraava pieniriskisin checkpoint.

## Knowledge Graph Status

`/data/knowledge-graph.json` on selvästi oma tarkoituksellinen projectioninsa. Rakennetussa datassa on:

- 586 nodea
- 1201 edgeä

Node-jakauma:

- `person`: 214
- `presentation`: 141
- `thesis`: 116
- `publication`: 56
- `topic`: 17
- `theme`: 16
- `course`: 11
- `project`: 6
- `presentationContext`: 5
- `researchLine`: 4

Knowledge graph ei ole tämän auditin perusteella “legacy branch”, vaan oma tuotannollinen sovelluskerros. Se saa kuitenkin syötteensä useammasta content-linjasta, joten sen ylläpito hyötyy välillisesti siitä, että kirjoitukset-hubit saadaan myöhemmin siivottua.

## Duplicate Logic And Source Priority

Selkeimmin hallittu source priority + dedup löytyy julkaisuista:

- Research.fi authoritative
- manual publication records fallbackeina
- dedup ennen page projectionia

Esityksissä canonical merge toimii useasta heterogeenisestä lähteestä.

Opinnäytteissä authoritative source on yksiselitteinen `theses.js`.

Suurin puute site-wide tasolla ei ole source priority, vaan se, että shared markdown content layer ja type-specific canonical layers eivät vielä kohtaa yhdessä writings-hubin page projectionissa.

## Legacy Branches

### Real debt

- `src/kirjoitukset.njk`
- `src/en/writings.njk`

### Smaller debt / intentional PE split

- `src/fi/mediassa.njk`
- `src/en/media.njk`

### Intentional specialized projections

- `src/_data/knowledgeGraph.js`
- `src/_data/semanticRelated.js`
- `/data/researchfi.json` standalone feed

## A-D Classification Summary

### A

- presentations architecture
- publications architecture
- theses architecture

### B

- shared markdown content layer
- media archive pages
- taxonomy inclusion model

### C

- writings FI
- writings EN

### D

- knowledge graph
- semantic related / embeddings helper layer

## Recommended Backlog Ordering

### 1. W1: canonical writings page projection

Rakenna kirjoituksille yksi page-level canonical dataset, joka palvelee:

- `src/kirjoitukset.njk`
- `src/en/writings.njk`

Rajaus:

- ei UI-muutoksia
- ei URL-muutoksia
- ei taxonomy-muutoksia
- ei uusia sisältötyyppejä

Tämä on suurin hyöty / pienin perusteltu riski -muutos.

### 2. W2: writings SSR/JS parity

Poista asteittain:

- embedded JSON -blokit
- source-kohtainen client-normalisointi
- erillinen `researchfi.json`-taulukkomuunnos EN-sivulla

### 3. T5: thesis taxonomy inclusion audit

Ratkaise eksplisiittisesti, pitäisikö opinnäytteiden näkyä myös taxonomy-sivuilla.

### 4. M1: media archive canonical page projection audit

Tarkista, kannattaako `mediaArchive` + `/data/media.json` yhdistää myöhemmin puhtaampaan page-level contractiin.

## One Recommended Next Checkpoint

### Recommendation

Seuraava yksi perusteltu checkpoint on:

**canonical writings page data + FI/EN writings parity audit**

### Why this is the best next step

- se kohdistuu tämänhetkiseen suurimpaan todelliseen arkkitehtuurivelkaan
- se ei vaadi uuden sisältötyypin migraatiota
- sivustolla on jo olemassa reusable primitives:
  - `toPublicContentRecord`
  - `content-engine`
  - `content-presets`
  - per-type public feeds
- riskit voidaan pitää samoina kuin aiemmissa piloteissa:
  - ensin page projection
  - sitten FI parity
  - sitten EN parity
  - ei UI-muutosta samassa checkpointissa

### What I would not do next

En tekisi seuraavaksi:

- uutta universaalia `all-content.json`-master-feediä
- knowledge graph -refaktoria
- embedding-poolin laajennusta Research.fi-julkaisuihin
- media-sivun redesignia
- uuden sisältötyypin canonical pilotointia

## Direct Answers To The Three Audit Questions

### 1. Which content types are already in canonical object -> projection model?

Selvästi ja end-to-end:

- esitykset
- julkaisut
- opinnäytteet

Osittain shared layerin kautta:

- blogi
- mielipiteet / kolumnit / puheet / lausunnot
- media
- politiikka / aloitteet

### 2. Where is the real architecture debt left?

Ensisijaisesti:

- `src/kirjoitukset.njk`
- `src/en/writings.njk`

Toissijaisesti:

- media-sivujen page-level parity
- opinnäytteiden puuttuminen taxonomialähteistä

Ei ensisijaisesti:

- presentations
- publications
- theses
- knowledge graph
- Pagefind

### 3. What single next change gives the biggest benefit with the lowest justified risk?

Yksi seuraava muutos on:

**kirjoitukset-hubin canonical page projection + FI/EN parity**

Se poistaa eniten rinnakkaista runtime-arkkitehtuuria ilman, että tarvitsee avata uusia data-, URL-, SEO- tai UI-riskejä.
