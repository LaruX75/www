# Canonical Content Architecture Audit

Date: 2026-08-11

## 1. Executive Summary

Neljä suljettua pilottia osoittavat saman arkkitehtuurimuodon olevan jo käytännössä toimiva:

```text
authoritative source(s)
        ↓
canonical internal object
        ↓
purpose-specific projections
```

Tämä malli on nyt todistettu neljässä eri sisältötyypissä:

- presentations / esitykset
- publications / julkaisut
- theses / opinnäytteet
- writings / kirjoitukset

Repo-evidenssin perusteella yhteinen standardi ei kuitenkaan vielä tarkoita yhtä universaalia runtime-skeemaa. Yhteinen osa on ennen kaikkea:

- arkkitehtuurin kerrosjako
- stable identity -ajatus
- public projectionien allowlist-periaate
- local `pageUrl` ja external `sourceUrl` -käsitteiden erottaminen
- se, että HTML, JSON-LD ja Pagefind ovat projekteja eivätkä master truth

Vahvin johtopäätös on tämä:

> Canonical Content Architecture on jo riittävän yhtenäinen standardoitavaksi periaatteiden, sopimusten, audit-porttien ja helper-rajausten tasolla, mutta ei vielä yhden universaalin objektimuodon tai geneerisen runtime-engine abstraktion tasolla.

Suositus tämän auditin lopussa on `Vaihtoehto A`: seuraava vaihe kannattaa olla shared contracts/tests/helpers -tason standardointi ennen uusia laajoja sisältötyyppimigraatioita.

## 2. Current Architecture

### Presentations

Nykyinen ketju:

```text
heterogeneous presentation sources
→ src/_data/presentationsPage.js
→ canonical presentation page items
→ /data/presentations-page.json
→ FI /esitykset/
→ EN /en/presentations/
→ local presentation detail pages
```

Tärkeät evidenssipisteet:

- `src/_data/presentationsPage.js` määrittelee `PUBLIC_PRESENTATION_FIELDS`-allowlistin ja rakentaa canonical presentation itemit
- `src/data/presentations-page.json.11ty.js` julkaisee canonical public projectionin
- `src/presentations/presentations.11tydata.js` käyttää `buildCanonicalPresentationPageLookup(data)`-resolveria detail-metadatan syöttämiseen
- FI ja EN käyttävät samaa canonical page model -linjaa

Presentations-pilotissa yhteinen arkkitehtuurisääntö on vahva, mutta URL-semantics on tyyppikohtaisesti muita monimutkaisempi: samassa canonical objektissa voi esiintyä sekä local `pageUrl` että external `url` ja erillinen `externalUrl`.

### Publications

Nykyinen ketju:

```text
Research.fi + manual fallbacks
→ source priority + dedup
→ src/_data/publicationsPage.js
→ publicationsPage.items
→ /data/publications-page.json
→ FI /julkaisut/
→ EN /en/publications/
→ src/_data/publicationDetails.js
→ /julkaisut/<id>/
→ Pagefind
```

Tärkeät evidenssipisteet:

- `src/_data/publicationsPage.js` määrittelee `PUBLIC_PUBLICATIONS_PAGE_FIELDS`-allowlistin
- dedup-järjestys on eksplisiittinen: `DOI → stable identifier → normalized title + year`
- source priority on eksplisiittinen: `researchfi > manual`
- `src/_data/publicationDetailPages.js` rakentaa detail-lähteet canonical publication details -mallia varten
- `src/julkaisut/researchfi-details.njk` on local detail HTML -projektio

Publications on tällä hetkellä neljästä pilotista vahvin identiteetti- ja dedup-mallin referenssitoteutus.

### Theses

Nykyinen ketju:

```text
OuluREPO + curated thesis metadata
→ src/_data/theses.js
→ canonical thesis objects
→ /data/theses.json
→ FI /opinnaytteet/
→ EN /en/theses/
→ src/_data/thesisDetails.js
→ /opinnaytteet/<id>/
→ Pagefind
```

Tärkeät evidenssipisteet:

- `src/_data/theses.js` toimii authoritative canonical object -kerroksena
- `src/_utils/thesisIdentity.js` muodostaa stable thesis id:n OuluREPO-linkin trailing numeric segmentistä
- `src/data/theses.json.11ty.js` käyttää yhteensopivuussyistä vielä `url = sourceUrl = OuluREPO`, mutta julkaisee myös `pageUrl`-kentän
- `src/opinnaytteet/thesis-details.njk` generoi local detail HTML -sivut kaikille canonical thesis -objekteille

Theses-pilotin tärkein arkkitehtuurinen tulos on, että async source-backed dataset riittää authoritative canonical layeriksi ilman Eleventy collection item -mallia.

### Writings

Nykyinen ketju:

```text
shared markdown content layer + canonical publications page data
→ src/_data/writingsPage.js
→ writingsPage.items
→ /data/writings-page.json
→ FI /kirjoitukset/
→ EN /en/writings/
```

Tärkeät evidenssipisteet:

- `src/_data/writingsPage.js` määrittelee `PUBLIC_WRITINGS_PAGE_FIELDS`-allowlistin
- shared local content tulee `toPublicContentRecord`-serializerin kautta
- scientific publications tulevat writings-layeriin publication-canonical-linjasta, eivät raakana Research.fi:stä
- FI käyttää compatibility subsetiä (`126`)
- EN käyttää käytännössä koko canonical datasettiä (`290`)

Writings-pilotin tärkein havainto on, että kieli- tai sivunäkymäkohtainen subsetti voi vaihdella, vaikka identity/content layer pysyy yhteisenä.

## 3. Canonical Content Architecture Matrix

| Concern | Presentations | Publications | Theses | Writings | Proposed standard |
| --- | --- | --- | --- | --- | --- |
| Authoritative source | heterogeneous presentation sources | `researchfiContent` + manual fallbacks | `theses.js` over OuluREPO + curated enrichments | shared markdown content + publication canonical items | authoritative source voi olla markdown, external API/source, curated async data tai usean lähteen yhdistelmä |
| Canonical layer | `src/_data/presentationsPage.js` | `src/_data/publicationsPage.js` + `researchfiContent` | `src/_data/theses.js` | `src/_data/writingsPage.js` | canonical internal object kerros sijaitsee sourcea lähimpänä, ennen public projectioneja |
| Stable id | source-derived or source-backed item id | source-backed id, manual fallback id, canonical winner dedupissa | OuluREPO-derived stable numeric id | local URL / canonical publication id / source-backed shared id | yksi logical item = yksi stable canonical identity, mutta tekninen id-formaatti saa olla tyyppikohtainen |
| `pageUrl` | local detail page when available | canonical local publication detail URL | canonical local thesis detail URL | local page URL when item has one | `pageUrl` = local canonical HTML projection |
| `sourceUrl` | not yet uniform; often `externalUrl` instead | not explicit core field in page projection | original OuluREPO URL | original source URL when meaningful | `sourceUrl` = authoritative/original external source, mutta standardointi vaatii vielä yhdenmukaistamista |
| `url` | sometimes external, sometimes local | local detail URL in page projection | legacy compatibility: original OuluREPO URL | consumer-facing primary link, usually source-first | `url` on tällä hetkellä legacy/ambiguous eikä sitä pidä vielä standardoida yhteiseksi semantiikaksi |
| Public projection | `/data/presentations-page.json` | `/data/publications-page.json` | `/data/theses.json` | `/data/writings-page.json` | jokaisella consumerilla oma allowlist projection |
| Allowlist | yes | yes | yes | yes | public JSON on aina allowlist-pohjainen |
| Detail HTML | local presentation pages | `/julkaisut/<id>/` | `/opinnaytteet/<id>/` | existing markdown details where applicable; writings page itself is archive projection | detail HTML kannattaa luoda kun item tarvitsee oman canonical document identityn |
| JSON-LD | page data → `_ldschema.njk` | page data → `_ldschema.njk` | page data → `_ldschema.njk` | page data → `_ldschema.njk` | JSON-LD on metadata projection page datasta, ei erillinen master truth |
| Pagefind | aggregate + detail docs | detail pages improve granularity | detail pages improve granularity | archive and markdown detail docs | search indeksoi renderöityjä dokumentteja, ei canonical objecteja suoraan |
| FI/EN | same canonical items | same canonical items | same canonical items | same canonical items, different subset/view rules | kielinäkymät voivat käyttää eri subsettejä mutta eivät saa luoda erillisiä identity/source-malleja |
| Dedup | type-specific source merge | explicit DOI / id / title-year dedup | implicit unique-by-source-link identity | inherits publication dedup for publications, shared items otherwise | dedup tehdään ennen public projectionia, mutta logiikka saa olla tyyppikohtainen |
| Source priority | type-specific ordering | explicit `researchfi > manual` | source is effectively authoritative single line | publication priority inherited; shared markdown records otherwise single-source | source priority päätetään canonical layerissa ennen projectioneja |

## 4. Common Canonical Core

Alla olevat kentät ovat auditin perusteella aidosti yhteisen canonical core -ehdokkaan vahvimmat osat.

| Field | Semantic meaning | Required / optional | Presentations | Publications | Theses | Writings | Projection consumers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | canonical item identity | required | yes | yes | yes | yes | lookup, dedup, routing, client keys |
| `title` | human-readable primary label | required | yes | yes | yes | yes | lists, detail pages, metadata, search |
| `description` | consumer-safe summary | optional | yes | yes | yes | yes | cards, tables, meta, search |
| `date` | most precise normalized date available | optional | yes | yes | partial | yes | sorting, display, metadata |
| `year` | normalized year for grouping/filtering | optional | yes | yes | yes | yes | counts, grouping, analytics |
| `lang` | canonical content language code | required in practice | yes | yes | yes | yes | FI/EN filtering, metadata, badges |
| `pageUrl` | local canonical HTML projection | optional | yes | yes | yes | partial | local routing, canonical links, detail landing pages |
| `categories` | editorial/topical categories | optional | yes | yes | yes | yes | filters, chips, taxonomy |
| `keywords` | free topical descriptors | optional | yes | yes | yes | yes | filters, metadata, search |

### Core but not yet semantically clean enough

| Field | Current status | Reason |
| --- | --- | --- |
| `url` | `LEGACY / NEEDS CLARIFICATION` | tarkoittaa eri piloteissa eri asiaa: external source, local detail tai consumer primary link |
| `source` | `LEGACY / NEEDS CLARIFICATION` | writings/shared-content käyttää usein string-muotoa, kun taas konseptuaalisesti sama asia olisi paremmin `source.key` |
| `sourceKey` | `PROMISING BUT NEEDS MORE EVIDENCE` | vahva julkaisuissa, esityksissä ja kirjoituksissa, mutta ei vielä yhtenäinen opinnäytteissä |
| `sourceLabel` | `PROMISING BUT NEEDS MORE EVIDENCE` | kuluttajille hyödyllinen, mutta ei aina canonical minimi |
| `sourceUrl` | `PROMISING BUT NEEDS MORE EVIDENCE` | vahva tarve julkaisuissa/opinnäytteissä/kirjoituksissa, mutta esityksissä käytössä vielä `externalUrl` |
| `contentType` | `PROMISING BUT NEEDS MORE EVIDENCE` | yhteinen periaate on vahva, mutta presentations page projection ei vielä julkaise kenttää |
| `visibility` | `NOT IMPLEMENTED AS A SINGLE FIELD` | publication/search/feed control on hajallaan repo-säännöissä |

### Common core recommendation

Konseptuaalisen standardin tasolla yhteinen core on jo tunnistettavissa:

```text
id
title
description
date
year
lang
pageUrl
categories
keywords
source identity concept
```

Mutta repo-evidenssi ei vielä tue sitä, että kaikki neljä pilottia pakotettaisiin välittömästi jakamaan täsmälleen samat runtime-kenttänimet erityisesti `url`- ja `sourceUrl`-alueilla.

## 5. Type-Specific Extensions

### Publication extension

Repo-evidenssi:

- `authors`
- `journal`
- `publisher`
- `doi`
- `doiUrl`
- `volume`
- `issue`
- `pages`
- `type`
- `typeCode`
- `publicationGroup`
- `publicationKind`
- `peerReviewed`
- `openAccess`
- `jufoLevel`
- `citationCount`
- `researchLine`
- `researchThemes`
- `researchAudience`

Johtopäätös:

Publication extension on aidosti oma semanttinen alueensa. Tätä ei pidä pakottaa esimerkiksi writings- tai thesis-objektien common coreen.

### Thesis extension

Repo-evidenssi:

- `thesisType`
- `thesisRole`
- `citationApa`
- `researchPriority`
- `researchSummary`
- `sourceUrl`
- OuluREPO-derived stable identity

Huomio:

`description` toimii käytännössä abstractina, mutta auditissa sitä ei pidä nostaa erilliseksi common-core `abstract`-kentäksi, koska muut pilotit eivät käytä samaa semantiikkaa.

### Presentation extension

Repo-evidenssi:

- `sourceLanguage`
- `slideCount`
- `itemCount`
- `thumbnail`
- `badgeText`
- `meta`
- `courseContexts`
- `jarjestaja`
- `kategoria`
- `paakortti`
- `paareitti`
- `asiantuntijaprofiili`
- `sivuyhteys`
- `externalUrl`

Johtopäätös:

Presentations on selvästi metadata-rikkaampi archive/listaustyyppi kuin muut pilotit. Sen event/context/source-metadata on käyttökelpoista juuri esityksissä eikä ole hyvä universal content contract -ehdokas.

### Writings extension

Repo-evidenssi:

- `sectionKeys`
- `recordOrigin`
- `isExternal`
- `authors`
- `authorsText`
- `publication`
- `publicationType`
- `event`
- `forum`
- `speechContext`
- `speechKind`
- `meeting`
- `meetingDate`
- `initiativeType`
- `writingRoles`
- `opinionRoles`
- `taxonomyTypeKey`
- `taxonomyTypeLabel`

Johtopäätös:

Writings-pilotti on ennen kaikkea hub/projection-tyyppinen canonical dataset, joka kokoaa useita kirjoittamisen ja puhumisen muotoja samaan archive-näkymään. `sectionKeys` ja `recordOrigin` ovat hyödyllisiä juuri writings-runtimeen, eivät yhteiseen coreen.

### Extension rule

Auditin perusteella oikea malli on:

```text
COMMON CORE
        +
TYPE-SPECIFIC EXTENSION
```

Ei:

```text
one giant universal object full of nulls
```

## 6. Identity Model

### Presentations

- `id` on source-backed canonical item identity
- sama logical presentation voi tulla useasta lähteestä vain poikkeuksellisesti, eikä repo tällä hetkellä käytä yhtä publications-tyyppistä dedup-porttia
- identity on käytännössä riittävän vakaa listaus- ja detail-käyttöön, mutta ei muodosta site-wide referenssiä samanlaisella vahvuudella kuin publications tai theses

### Publications

- `id` on canonical publication identifier
- duplicate tunnistetaan järjestyksessä `DOI → stable identifier → normalized title + year`
- source priority on eksplisiittinen: `researchfi > manual`
- sama logical publication voi tulla useasta lähteestä, mutta canonical winner valitaan ennen projectionia
- title- tai URL-muutos ei ole ensisijainen identiteetin kantaja silloin kun DOI tai stable identifier on olemassa

### Theses

- `id`/stable identity johdetaan OuluREPO-linkin trailing numeric segmentistä
- source-derived identity on vahva ja pysyy vakaana title-muutoksissa
- `thesisPageUrl(link)` johdetaan identiteetistä eikä otsikosta
- käytännössä duplicate-riski on pieni, koska authoritative source on yksilöllinen handle-pohjainen linkki

### Writings

- local shared content käyttää yleensä local page URL -pohjaista identityä shared content layerin kautta
- scientific publications inheritöivät publication-canonical identiteetin
- writings ei rakenna omaa rinnakkaista identity-mallia publication-objekteille

### Proposed identity principle

Repo-evidenssi tukee vahvasti tätä sääntöä:

> One logical content item should have one stable canonical identity independent of its projections.

Tärkeä lisärajaus:

- sama tekninen `id`-formaatti ei ole vaatimus
- stable identity voi olla source-derived, curated-source-backed tai canonical winner -mallilla rakennettu
- dedup ja source priority kuuluvat canonical layeriin, eivät public projectioniin tai clienttiin

## 7. URL Semantics

### Observed current meanings

| Field | Presentations | Publications | Theses | Writings |
| --- | --- | --- | --- | --- |
| `pageUrl` | local detail page when available | canonical local detail page | canonical local thesis detail page | local page if one exists |
| `sourceUrl` | not consistently used; `externalUrl` often carries this meaning | external/original source concept exists more in detail/page metadata than page projection | original OuluREPO URL | original source when available |
| `url` | sometimes external source, sometimes local, sometimes primary consumer link | local detail URL in page projection | original OuluREPO URL for compatibility | primary outgoing link chosen for consumer convenience |

### Conclusion

`pageUrl` on neljästä piloteista selkein yhteinen semantiikka:

> `pageUrl` = local canonical HTML projection.

`sourceUrl` on myös vahva konseptuaalinen ehdokas:

> `sourceUrl` = authoritative/original external source.

`url` sen sijaan on tällä hetkellä liian monimerkityksinen legacy-kenttä yhteiseksi standardiksi. Auditin suositus ei ole sen poistaminen vaan sen tilan dokumentointi:

- säilytä nykyinen yhteensopivuus
- vältä uusissa canonical piloteissa lisäämästä `url`-kentälle uusia ristiriitaisia merkityksiä
- suosi uusissa suunnitelmissa `pageUrl`- ja `sourceUrl`-ajattelua

## 8. Projection Model

### Page/list projections

Selvästi olemassa olevat page/list projectionit:

- `presentationsPage.items`
- `publicationsPage.items`
- `writingsPage.items`
- theses-arkkitehtuurissa `/data/theses.json` toimii käytännössä vastaavana archive/page projectionina, vaikka erillistä `thesesPage.items`-nimistä kerrosta ei ole

### Public JSON projections

Current canonical public endpoints:

- `/data/presentations-page.json`
- `/data/publications-page.json`
- `/data/theses.json`
- `/data/writings-page.json`

Kaikissa on allowlist-pohjainen `version/generatedAt/count/items`-kuori tai vastaava page-level wrapper.

### HTML detail projections

Nykyiset canonical detail -projektioradat:

- publications: `/julkaisut/<id>/`
- theses: `/opinnaytteet/<id>/`
- presentations: local presentation pages, joiden detail-metadata resolveerataan canonical presentation lookupista
- writings: yksittäiset markdown-sisällöt toimivat detail-sivuina silloin kun item on alun perin local content

### Metadata projections

`src/_includes/_meta.njk` ja `src/_includes/_ldschema.njk` muodostavat metadata-/structured-data-projektion Eleventy page datasta.

Polku on käytännössä:

```text
canonical object
→ page data / resolver
→ _meta.njk
→ _ldschema.njk
→ canonical link / OG / JSON-LD
```

### Search projection

Pagefind ei indeksoi canonical objecteja suoraan, vaan renderöityä HTML:ää:

```text
canonical object
→ rendered HTML
→ Pagefind document
```

Tämä on publications- ja theses-piloteissa juuri se muutos, joka paransi document granularityä.

### Internal semantic projections

Tämän auditin tasolla tunnistetut sisäiset projektiot:

- taxonomy
- knowledge graph
- embeddings
- recommendations / semantic related

Niitä ei pidä tulkita public canonical page projectionien kanssa samaksi kerrokseksi.

### Projection principle

Repo-evidenssi tukee jo nyt tätä sääntöä:

> A projection contains only the fields required by its consumer.

Toteutuma nykytilassa:

- presentations/publications/writings käyttävät eksplisiittisiä public allowlisteja
- theses käyttää allowlist-serialisointia omalla serializerillaan
- internal-only build/runtime-kenttiä ei tietoisesti vuoda public JSONiin

### Noted projection debts

- `url`-kentän semantiikka vuotaa consumer- ja compatibility-tarpeita samaan kenttään
- `theses.json` on arkkitehtuurisesti hyvä mutta semanttisesti vielä osittain compatibility-bridged projection
- writings käyttää tarkoituksella page-specific projection logiikkaa, jota ei pidä vielä yrittää abstrahoida geneeriseksi list-engineksi

## 9. Public / Private Boundary

### Repo-evidenssin perusteella tarvittavat tasot

```text
1. authoritative source
2. canonical internal object
3. public projection
4. rendered/search projection
```

### What the pilots prove

- canonical internal object ei automaattisesti tarkoita selaimelle julkaistavaa JSONia
- public JSON on vain yksi mahdollinen projection
- HTML detail, JSON-LD ja Pagefind ovat eri kuluttajille tarkoitettuja projectioneja samasta sisältöobjektista

### Allowlist rule

Kaikki neljä pilottia toteuttavat allowlist-ajatusta riittävän vahvasti, vaikka tekniikka vaihtelee:

- presentations: explicit `PUBLIC_PRESENTATION_FIELDS`
- publications: explicit `PUBLIC_PUBLICATIONS_PAGE_FIELDS`
- writings: explicit `PUBLIC_WRITINGS_PAGE_FIELDS`
- theses: explicit serializer, vaikka ei käytä shared `toPublicContentRecord`-polkua

Tämä on valmis standardoitava sääntö.

## 10. FI / EN Model

### Shared rule observed in pilots

Repo-evidenssin perusteella yleinen sääntö voidaan muotoilla näin:

> Language-specific page views may select or present different subsets, but should not create independent content identities or source models.

### Pilot-by-pilot

- presentations: FI ja EN käyttävät samaa canonical datasettiä
- publications: FI ja EN käyttävät samaa canonical publication joukkoa
- theses: FI ja EN käyttävät samaa canonical thesis joukkoa
- writings: FI käyttää compatibility subsetiä `126`, EN koko canonical settiä `290`, mutta identity/content layer on sama

### Conclusion

FI/EN-sääntö on jo riittävän vahva shared standardiksi. Samalla writings todistaa, että subset parity ei tarkoita identtistä näkyvää item-määrää.

## 11. Detail-Page Rule

### What the pilots show

Publications- ja theses-piloteissa local detail HTML toi selkeän arkkitehtuurihyödyn:

- yksi item = yksi jaettava URL
- yksi item = yksi JSON-LD document
- yksi item = yksi Pagefind document
- local page voi toimia landing page -kerroksena vaikka authoritative source on ulkoinen

### Decision rule

Canonical object tarvitsee oman HTML detail -projektion, kun ainakin osa seuraavista täyttyy:

- sisältö on itsenäisesti linkitettävä
- sisältö halutaan omaksi Pagefind-dokumentiksi
- sisältö tarvitsee canonical URL:n
- sisältö tarvitsee oman JSON-LD/OG/metadataprojektion
- authoritative source on ulkoinen, mutta sivusto haluaa oman document identityn

Canonical object ei tarvitse detail-sivua automaattisesti, jos:

- kyseessä on puhtaasti summary/navigation elementti
- item ei ole itsenäinen dokumentti vaan vain osa laajempaa sivunäkymää
- local detail ei tuo document- tai search-identiteetin kannalta lisäarvoa

Tämä selittää esimerkiksi writingsin `materials`-poikkeuksen ilman että sitä tarvitsee pakottaa itemized detail-malliin.

## 12. Pagefind Implications

Pilottien perusteella yhteinen havainto on tämä:

```text
aggregate-only HTML
→ weak document granularity

one object → one HTML detail
→ stronger Pagefind granularity
```

Publications- ja theses-pilotit todistavat tämän suoraan. Esityksissä local detail -sivut kytkeytyvät samaan dokumentti-identiteetin logiikkaan. Writings taas näyttää, että kaikkea ei tarvitse muuttaa detail-dokumenteiksi, jos kyseessä on jo local markdown document -verkosto.

Tärkeä rajaus:

- content architecture ratkaisee document identityn ja renderöidyn rakenteen
- Pagefind ranking/UI tuning on erillinen optimointitaso

C1:n johtopäätös koskee vain ensimmäistä, ei hakurankingin hienosäätöä.

## 13. JSON-LD Path Audit

### Current path

Repo-evidenssin perusteella JSON-LD syntyy pääosin näin:

```text
canonical object
→ Eleventy page data
→ _meta.njk / _ldschema.njk
→ JSON-LD
```

### What this means

- JSON-LD on pääosin canonical objectin metadata-projektio
- publications-detail ja thesis-detail käyttävät tätä polkua nyt uskottavasti
- `_ldschema.njk` sisältää vielä page-block-tyyppisiä branch-haroja (`presentation`, `article`, `thesis`, `business`, `specialpage`)

### Conclusion

Auditin perusteella JSON-LD ei ole erillinen metadata truth. Se on kuitenkin vielä osittain template-branching-pohjainen projection layer, ei yksi täysin generinen contract.

Luokitus:

- `canonical metadata projection`: `READY TO STANDARDIZE`
- `one universal JSON-LD generator contract`: `PROMISING BUT NEEDS MORE EVIDENCE`

## 14. Shared Helper Audit

### `resolveContentMeta.js`

Nykyinen vastuu:

- ratkaisee canonical `contentType`-, `section`- ja `schemaType`-semantiikkaa markdown-pohjaisille sisällöille
- toimii `_ldschema.njk`-polun ja shared public feedien taustalla

Luokitus:

- `reuse existing`

### `toPublicContentRecord.js`

Nykyinen vastuu:

- serialisoi Eleventy collection itemin public JSON -tietueeksi
- suojaa public/private-boundaryä shared content feed -tasolla

Rajoitus:

- ei ole universaali canonical object serializer kaikille piloteille
- kommentti mainitsee myös theses-virrat, mutta opinnäytteiden nykyinen canonical polku käyttää erillistä serializeria

Luokitus:

- `reuse existing`
- `candidate for future consolidation`

### `contentSchema.js`

Nykyinen vastuu:

- toimii metadatavocabulary-/registry-kerroksena
- ei ole sama asia kuin site-wide canonical content object schema

Luokitus:

- `keep type-specific responsibility as metadata registry`

### `contentPresets.js`

Nykyinen vastuu:

- headless query/filter endpoint map browser- ja Node-käyttöön
- toimii projection-kulutuksen eikä canonical object definitionin tasolla

Luokitus:

- `reuse existing`
- ei pidä nostaa site-wide canonical engineksi tämän auditin perusteella

### `content-engine.js`

Nykyinen vastuu:

- client-side query/runtime projection consumer

Luokitus:

- `keep consumer-specific`

### Overall helper conclusion

Shared helperit ovat hyödyllisiä, mutta ne eivät yhdessä vielä muodosta yhtä universaalia canonical abstraction layeria. Oikea seuraava askel ei ole uusi mega-helperi vaan:

- vastuujen nimeäminen tarkemmin
- shared contractien vahvistaminen
- parity-/projection-auditien vakiointi

## 15. Accidental Abstractions vs Real Abstractions

### Do not generalize yet

| Concern | Reason |
| --- | --- |
| presentation/publication/writings page builders | kaikissa on `items`, mutta identity, dedup, source priority ja section logic eivät ole semanttisesti samoja |
| publication dedup rules to all content types | DOI/title-year-logiikka on julkaisu-spesifi |
| writings `sectionKeys` to all archives | writings on hub/projection-tyyppinen koonti, ei geneerinen sisältömalli |
| presentations `externalUrl` triad as universal URL model | esityksissä external/local dualismi on erityisen vahva eikä vielä yleispätevä |
| one generic detail generator | detail routing, metadata contract ja resolverit eroavat edelleen sisältötyypeittäin |

### Ready to standardize

| Concern | Classification | Reason |
| --- | --- | --- |
| stable identity principle | READY TO STANDARDIZE | esiintyy kaikissa piloteissa, vaikka tekninen toteutus vaihtelee |
| canonical object before projections | READY TO STANDARDIZE | todistettu neljässä pilotissa |
| public allowlist projection | READY TO STANDARDIZE | toteutuu kaikissa piloteissa |
| FI/EN share identity/content layer | READY TO STANDARDIZE | todistettu kaikissa piloteissa |
| HTML as projection | READY TO STANDARDIZE | detail- ja archive-polut toimivat tämän mukaisesti |
| dedup/source priority before public projection | READY TO STANDARDIZE | ainakin publications antaa vahvan mallin; periaate yleistyy vaikka logiikka jää type-specificiksi |
| local `pageUrl` concept | READY TO STANDARDIZE | vahva yhteinen semanttinen rooli |
| language normalization | PROMISING BUT NEEDS MORE EVIDENCE | käytännössä vahva, mutta kenttä- ja source-polut eivät ole vielä täysin yhtenäiset |
| `sourceUrl` concept | PROMISING BUT NEEDS MORE EVIDENCE | vahva tarve, mutta kenttänimet eivät vielä ole yhtenäiset |
| projection validation/parity gates | READY TO STANDARDIZE | käytetty systemaattisesti piloteissa |

## 16. Conceptual Canonical Content Object v1

Tämä on auditin perusteella konseptuaalinen malli, ei runtimeen pakotettava skeema:

```js
{
  id,                // REQUIRED
  title,             // REQUIRED
  description,       // OPTIONAL

  contentType,       // OPTIONAL / PROMISING BUT NEEDS MORE EVIDENCE
  lang,              // REQUIRED IN PRACTICE

  date,              // OPTIONAL
  year,              // OPTIONAL

  pageUrl,           // OPTIONAL but semantically strong
  sourceUrl,         // OPTIONAL / needs wider normalization
  url,               // LEGACY / NEEDS CLARIFICATION

  categories,        // OPTIONAL
  keywords,          // OPTIONAL

  sourceKey,         // OPTIONAL / PROMISING
  sourceLabel,       // OPTIONAL / PROMISING

  // type-specific extension
  ...
}
```

### Field status summary

| Field | Status |
| --- | --- |
| `id` | REQUIRED |
| `title` | REQUIRED |
| `description` | OPTIONAL |
| `lang` | REQUIRED IN PRACTICE |
| `date` | OPTIONAL |
| `year` | OPTIONAL |
| `pageUrl` | OPTIONAL |
| `categories` | OPTIONAL |
| `keywords` | OPTIONAL |
| `contentType` | PROMISING BUT NEEDS MORE EVIDENCE |
| `sourceKey` | PROMISING BUT NEEDS MORE EVIDENCE |
| `sourceLabel` | PROMISING BUT NEEDS MORE EVIDENCE |
| `sourceUrl` | PROMISING BUT NEEDS MORE EVIDENCE |
| `url` | LEGACY / NEEDS CLARIFICATION |
| `visibility` | NOT IMPLEMENTED AS SHARED FIELD |

## 17. Canonical Architecture Principles v1

1. Authoritative source is not the same thing as public JSON.
2. Every logical content item should have one stable canonical identity.
3. Canonical object formation happens before any public, HTML, or search projection.
4. Projections are consumer-specific and should only contain the fields their consumer needs.
5. Public JSON must be allowlist-based.
6. HTML is a projection, not the source of truth.
7. FI and EN views may differ in subset or presentation, but must share identity and source model.
8. Local `pageUrl` and external/original `sourceUrl` are distinct concepts.
9. Dedup and source priority belong to the canonical layer, not to clients.
10. Search indexes rendered documents, not raw canonical data.
11. Type-specific extensions should remain type-specific unless semantic equivalence is proven.
12. Similar code is not enough reason to create a shared abstraction.

## 18. Visibility Audit

Original JSON-first-ajattelun kaltainen yhtenäinen:

```json
{
  "visibility": {
    "web": true,
    "search": true,
    "feed": true
  }
}
```

ei nykyisessä repossa ole toteutettuna.

### Current state

Visibility/publication control exists hajautettuna:

- `permalink: false` tai conditional permalink
- `eleventyExcludeFromCollections: true`
- `robots: "noindex, follow"`
- redirect-template + canonical redirect
- `data-pagefind-ignore`

### Classification

- `visibility as one shared field`: `NOT IMPLEMENTED`
- `visibility/publication control as a practical capability`: `PARTIALLY EXISTS`
- `visibility as immediate blocker for current architecture`: `NOT CURRENTLY NEEDED`

Johtopäätös:

Visibility-control on todellinen tarve, mutta ei vielä sellainen yhteinen canonical field, joka pitäisi C1:n perusteella pakottaa kaikkiin objekteihin.

## 19. Current Architecture Debts

### A — Architecture blocker

Audit ei löytänyt neljän suljetun pilotin sisältä sellaista avointa blokkeria, joka estäisi yhteisen arkkitehtuuristandardin muodostamisen.

### B — Important consolidation

- `url`-kentän site-wide semantiikka on edelleen epäselvä ja vaatii myöhemmän standardointipäätöksen
- `source` / `sourceKey` / `sourceLabel` -alue tarvitsee yhdenmukaisemman shared contractin
- shared helperien vastuurajat kannattaa kirjoittaa eksplisiittisemmiksi ennen seuraavaa isoa migraatiota
- projection/parity-auditien toistuva malli kannattaa vakioida yhteisiksi testeiksi tai audit-skripteiksi

### C — Cleanup

- `toPublicContentRecord.js`-kommenttien ja todellisen kattavuuden välinen pieni ristiriita, koska theses käyttää omaa serializeria
- template-branching `_ldschema.njk`:ssa on toimiva mutta osin historiallinen rakenne
- writingsin view-mapperit voi myöhemmin arvioida vielä kerran siitä näkökulmasta, ovatko ne pysyviä consumer-adaptereita vai poistettavaa välivaihetta

### D — Future enhancement

- richer shared visibility controls
- projection size optimization
- generic projection validation tooling
- Pagefind ranking/UI tuning
- feed/syndication contracts
- knowledge graph / embeddings / recommendations standardointi saman arkkitehtuurikielen alle

## 20. Recommendation For Next Phase

### Choice

`Vaihtoehto A`

### Rationale

Canonical-malli on riittävän yhtenäinen.

Neljä pilottia todistavat jo:

- shared kerrosajattelun
- stable identity -periaatteen
- allowlist public projectionin
- FI/EN shared identity modelin
- detail/page/search projection -ketjun

Seuraava järkevä askel ei siis ole uusi sisältötyyppipilotti eikä universaalin skeeman pakottaminen, vaan C2-tyyppinen standardointivaihe:

- shared contract definitions
- projection/parity test gates
- URL/source field semantics decision
- helper responsibility documentation

### Recommended C2 scope

Turvallinen C2-rajauksen luonnos repo-evidenssin perusteella olisi:

```text
canonical contracts
→ field semantics
→ parity/audit helpers
→ projection validation
```

Ei:

```text
new universal runtime schema
→ large-scale refactor
```

## 21. Final Conclusion

Tämän auditin perusteella sivustolla on nyt oikea yhteinen Canonical Content Architecture -standardi seuraavassa merkityksessä:

- authoritative source erotetaan public JSONista
- canonical internal object rakennetaan ennen projectioneja
- projections ovat consumer-specific
- public boundary on allowlist-pohjainen
- local HTML/metadata/search ovat projectioneja samasta sisältöidentiteetistä

Mutta standardi ei vielä tarkoita:

- yhtä universaalia objektimuotoa
- yhtä geneeristä build/runtime-engineä
- yhteistä dedup-logiikkaa kaikille sisältötyypeille

Oikea jatko on siis standardoida periaatteet ja sopimukset, ei pakottaa ennenaikaista universaalia abstraktiota.
