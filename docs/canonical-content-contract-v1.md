# Canonical Content Contract v1

Date: 2026-08-11

## Purpose

Tama dokumentti lukitsee C1-auditissa tunnistetun yhteisen Canonical Content Architecture -sopimuksen ilman, etta neljaa toimivaa pilottia pakotetaan yhteen universaaliin runtime-skeemaan.

Sopimus koskee neljaa nykyista pilottia:

- presentations / esitykset
- publications / julkaisut
- theses / opinnaytteet
- writings / kirjoitukset

Perusmuoto on:

```text
authoritative source(s)
→ canonical internal object
→ consumer-specific projection
→ rendered HTML / public JSON / JSON-LD / Pagefind / internal semantic projections
```

## 1. Architecture Layers

### 1. Authoritative source

Authoritative source voi olla:

- markdown/frontmatter
- Research.fi
- OuluREPO
- curated async data
- usean lahteen yhdistelma

Saanto:

> authoritative source is not the same thing as public JSON.

### 2. Canonical internal object

Canonical internal object:

- muodostaa stable identityn
- ratkaisee source priorityn ja dedupin tarvittaessa
- normalisoi aidosti yhteiset semanttiset kentat
- sailyttaa type-specific extensionit type-specificina

### 3. Consumer-specific projection

Projection:

- ei ole master truth
- julkaisee vain consumerin tarvitsemat kentat
- ei saa muuttaa canonical kentan merkitysta hiljaisesti
- saa olla type-specific

### 4. Rendered/search projection

Rendered HTML, JSON-LD ja Pagefind-dokumentit ovat omia projektiotasojaan:

```text
canonical object
→ page data
→ rendered HTML / metadata
→ search surface
```

## 2. Canonical Core v1

Taulukossa "scope" tarkoittaa sita, kuuluuko kentta:

- canonical objectiin
- projectioniin
- vai molempiin

| Field | Status | Semantic meaning | Scope | Public? | Null/omit? | Current content types | Projection may change meaning? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | REQUIRED | yhden logical itemin vakaa canonical identity | canonical + projection | yes | no | all four | no |
| `title` | REQUIRED | ensisijainen ihmisen luettava otsikko | canonical + projection | yes | no | all four | no |
| `description` | OPTIONAL | consumer-safe summary, ei valttamatta full abstract/body | canonical + projection | yes | yes | all four | no |
| `contentType` | PROMISING / NOT YET STANDARD | canonical content class | canonical first, projection second | yes when needed | yes | publications, theses, writings, shared content; not uniform in presentations page projection | no |
| `lang` | OPTIONAL | canonical content language code normalized to current public vocabulary | canonical + projection | yes | yes when source does not support reliable language | all four | no |
| `date` | OPTIONAL | tarkin normalisoitu paivamaara jonka canonical layer pystyy perustellusti antamaan | canonical + projection | yes | yes | all four | no |
| `year` | OPTIONAL | ryhmittelyyn ja analytiikkaan kaytettava normalisoitu vuosi | canonical + projection | yes | yes | all four | no |
| `pageUrl` | OPTIONAL | sivuston paikallinen canonical HTML projection | projection-facing canonical metadata | yes | yes | all four in different degrees | no |
| `sourceUrl` | PROMISING / NOT YET STANDARD | authoritative/original external source URL | canonical metadata + projection | yes | yes | theses, writings, parts of publications/presentations | no |
| `url` | LEGACY / COMPATIBILITY | consumer primary link in current runtime; merkitys vaihtelee | projection | yes | yes | all four | no; nykyista merkitysta ei saa hiljaa vaihtaa |
| `categories` | OPTIONAL | editorial/topical categories | canonical + projection | yes | yes | all four | no |
| `keywords` | OPTIONAL | free topical descriptors | canonical + projection | yes | yes | all four | no |
| `sourceKey` | PROMISING / NOT YET STANDARD | source identity key, ei display label | canonical metadata + projection | yes | yes | presentations, publications, writings | no |
| `sourceLabel` | PROMISING / NOT YET STANDARD | source display label | projection-facing canonical metadata | yes | yes | presentations, publications, writings | no |

## 3. Type-Specific Extensions

Yhteinen contract ei poista tarvetta type-specific kentille.

### Presentations

Type-specific extensioneja:

- `externalUrl`
- `thumbnail`
- `sourceLanguage`
- `slideCount`
- `itemCount`
- `badgeText`
- `meta`
- `courseContexts`
- `jarjestaja`
- `kategoria`
- `paakortti`
- `paareitti`
- `asiantuntijaprofiili`
- `sivuyhteys`

Luokitus:

- `TYPE-SPECIFIC`

### Publications

Type-specific extensioneja:

- `authors`
- `journal`
- `publisher`
- `type`
- `typeCode`
- `publicationGroup`
- `publicationKind`
- `peerReviewed`
- `openAccess`
- `volume`
- `issue`
- `pages`
- `isbn`
- `doi`
- `doiUrl`
- `jufoLevel`
- `citationCount`
- `researchLine`
- `researchThemes`
- `researchAudience`

Luokitus:

- `TYPE-SPECIFIC`

### Theses

Type-specific extensioneja:

- `thesisType`
- `thesisRole`
- `citationApa`
- `researchPriority`
- `researchSummary`
- thesis-detail-modelin `abstract`, `abstractParagraphs`, `schemaAuthors`

Luokitus:

- `TYPE-SPECIFIC`

### Writings

Type-specific extensioneja:

- `sectionKeys`
- `recordOrigin`
- `isExternal`
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

Luokitus:

- `TYPE-SPECIFIC`

## 4. Identity Contract

### Standardized

> One logical content item must have one stable canonical identity independent of its projections.

Tama ei tarkoita samaa teknista ID-formaattia kaikille.

### Type-specific identity implementations

- presentations: source-backed canonical item id
- publications: canonical winner dedupin jalkeinen publication identity
- theses: OuluREPO-handleen perustuva stable numeric id
- writings: shared content identity tai inherited publication identity

### Dedup and source priority

Dedup ja source priority kuuluvat canonical layeriin, eivat projectioniin tai clienttiin.

Vahvin nykyinen referenssimalli on publications:

```text
DOI
→ stable identifier
→ normalized title + year
```

ja:

```text
researchfi > manual
```

Luokitus:

- stable identity principle: `STANDARDIZED`
- shared technical dedup algorithm: `TYPE-SPECIFIC`

## 5. URL Semantics

### Locked semantics

```text
pageUrl
= local canonical HTML projection

sourceUrl
= authoritative/original external source

url
= legacy / compatibility field
```

### Current runtime reality

- publications page projection: `pageUrl` on local detail, `url` on external/open target
- theses feed: `pageUrl` on local detail, `url` on OuluREPO compatibility target, `sourceUrl` on OuluREPO
- writings page projection: `url` on consumer-visible primary link, `pageUrl` and `sourceUrl` tukevat view-mapperia
- presentations page projection: `pageUrl` on local detail when available, `externalUrl` kantaa usein kaytannossa `sourceUrl`-merkitysta

### Backward compatibility rule

Nykyinen `url`-semantiikka saa jatkua projectioneissa niin kauan kuin clientit tarvitsevat sita.

Saanto:

> projection may not silently repurpose `url` once a consumer depends on its current meaning.

### Future deprecation direction

Mahdollinen myohempi migraatio etenee vain parity-portin kautta:

1. clients read explicit `pageUrl` and `sourceUrl`
2. `url` remains compatibility alias
3. type-by-type deprecation documented
4. `url` semantics tightened only after consumer parity is proven

Luokitus:

- `pageUrl`: `STANDARDIZED`
- `sourceUrl`: `PROMISING / NOT YET STANDARD`
- `url`: `LEGACY / COMPATIBILITY`

## 6. Source Semantics

Nykyiset lahi-kasitteet:

- `source`
- `sourceKey`
- `sourceLabel`
- `sourceUrl`
- `externalUrl`
- `recordOrigin`

### Conceptual boundaries

| Concept | Meaning | Status |
| --- | --- | --- |
| content identity | logical item identity | STANDARDIZED |
| source identity | mista authoritative source -linjasta item tulee | STANDARDIZED AS CONCEPT |
| `sourceKey` | source identityn koneellinen tunniste | PROMISING / NOT YET STANDARD |
| `sourceLabel` | source identityn nayttoteksti | PROMISING / NOT YET STANDARD |
| `sourceUrl` | authoritative/original external source URL | PROMISING / NOT YET STANDARD |
| `externalUrl` | type-specific external target, usein presentations-puolella sourceUrl-tyyppinen | TYPE-SPECIFIC |
| `recordOrigin` | mista projection tai canonical chain item tuli | TYPE-SPECIFIC |

### Rule

Projection ei saa sotkea naita toisiinsa:

- `sourceKey` ei ole display label
- `sourceLabel` ei ole identity
- `recordOrigin` ei ole content identity
- `sourceUrl` ei ole sama asia kuin local `pageUrl`

## 7. Projection Contract

### Core rule

> A projection contains only the fields required by its consumer.

### Projection invariants

Kaikille shared public projectioneille tulee voida tarkistaa ainakin:

- `count === items.length`
- projection IDs are unique
- required fields exist
- allowlist is respected
- `pageUrl` means local URL when present
- `lang` is normalized when present
- canonical-to-projection parity can be asserted by identity

### Current public projections

- `/data/presentations-page.json`
- `/data/publications-page.json`
- `/data/theses.json`
- `/data/writings-page.json`

### What is not standardized

- yksi universaali serializer
- yksi universaali public field array
- yksi universaali page model builder

Luokitus:

- shared structural validation: `STANDARDIZED`
- shared runtime serializer: `PROMISING / NOT YET STANDARD`

## 8. Public / Private Boundary

Saanto:

> canonical internal object does not automatically mean browser-public JSON.

Allowlist on pakollinen kaikissa public projectioneissa.

Tama toteutuu nykyisissa piloteissa:

- presentations: `PUBLIC_PRESENTATION_FIELDS`
- publications: `PUBLIC_PUBLICATIONS_PAGE_FIELDS`
- writings: `PUBLIC_WRITINGS_PAGE_FIELDS`
- theses: explicit serializer, vaikka ei yhteista field-arrayta

## 9. FI / EN Rule

Saanto:

> language-specific views may select different subsets, but they must share the same identity and source model.

Toteutuma:

- presentations: sama canonical dataset
- publications: sama canonical dataset
- theses: sama canonical dataset
- writings: FI compatibility subset, EN full canonical set

Subset difference ei ole arkkitehtuuririkkomus, jos:

- content identity pysyy samana
- source model pysyy samana
- subset rule on eksplisiittinen

## 10. Detail-Page Rule

Detail HTML kannattaa luoda, jos item tarvitsee yhden tai useamman naista:

- shareable local URL
- canonical document identity
- own JSON-LD document
- own Pagefind document
- local landing page authoritative external sourcea varten

Detail HTML ei ole pakollinen:

- summary-only objekteille
- navigation-only koontiosille
- sivun sisaisille yhteenvetoelementeille

Vertailu:

- publications: yes
- theses: yes
- presentations: yes when local presentation detail exists
- writings/materials: no

## 11. JSON-LD Rule

Saanto:

> JSON-LD is a metadata projection, not a metadata source of truth.

Nykyinen polku:

```text
canonical object
→ Eleventy page data
→ _meta.njk
→ _ldschema.njk
→ JSON-LD
```

Type-specific branching `_ldschema.njk`:ssa on nykyisin tarkoituksellista niin kauan kuin eri document-tyypit tarvitsevat eri structured-data shapea.

Luokitus:

- JSON-LD as projection: `STANDARDIZED`
- universal JSON-LD generator: `FUTURE ENHANCEMENT`

## 12. Pagefind Rule

Saanto:

```text
canonical object
→ rendered HTML
→ Pagefind document
```

Pagefind ei kuluta canonical dataa suoraan.

Erotus:

- content architecture = document identity + rendered search surface
- Pagefind tuning = ranking + weighting + UI + ignore rules

Tama sopimus lukitsee vain ensimmaisen.

## 13. Visibility Status

Yhteista:

```js
visibility: {
  web,
  search,
  feed
}
```

-kenttaa ei nykyisessa repossa ole.

Nykyiset kontrollit:

- `permalink`
- `eleventyExcludeFromCollections`
- `robots`
- redirect pages
- `data-pagefind-ignore`

Luokitus:

- shared visibility concept: `PROMISING / FUTURE ENHANCEMENT`
- current visibility capability: `PARTIALLY EXISTS`

Saanto:

Visibility, jos se joskus standardoidaan, kuuluu todennakoisemmin canonical metadata + projection policy -rajapintaan kuin puhtaaseen universal coreen.

## 14. Validation And Parity Gates

Suositeltu gate-malli:

```text
SOURCE/CANONICAL GATE
→ PROJECTION GATE
→ SSR/CLIENT PARITY GATE
→ DETAIL PARITY GATE (when applicable)
→ BUILT OUTPUT GATE
→ PAGEFIND GATE (when applicable)
→ UX / A11Y / NAVIGATION / CONTRAST
```

### When each gate is required

| Gate | When required |
| --- | --- |
| source/canonical | aina kun canonical dataa muodostetaan useasta lahteesta tai dedupilla |
| projection | aina public JSON -projectionille |
| SSR/client parity | kun sivulla on JS-on hydraatio tai client-side filtering/runtime |
| detail parity | kun itemilla on local detail HTML projection |
| built output | aina rakenteellisissa migraatioissa |
| Pagefind | kun detail/document identity on relevantti hakupinta |
| UX/a11y/navigation/contrast | kun runtime/renderointi/UI muuttuu |

## 15. Helper Responsibility Matrix

| Helper / module | Primary responsibility | Classification |
| --- | --- | --- |
| `resolveContentMeta` | shared semantic resolver for `contentType`, `section`, `schemaType` | metadata vocabulary / semantic resolver |
| `toPublicContentRecord` | shared public serializer for markdown-backed collection items | public serializer |
| `contentSchema` | controlled metadata vocabulary and collection rules | metadata vocabulary |
| `contentPresets` | headless query/filter definitions and endpoint map | client/server query layer |
| `content-engine` | browser projection consumer and fetch/cache layer | projection consumer |
| `presentationsPage` | canonical object builder + page projection builder for presentations | canonical object builder |
| `publicationsPage` | canonical publication builder, dedup, source priority, page projection builder | canonical object builder + identity resolver |
| `publicationDetails` | canonical publication detail resolver | detail resolver |
| `theses` | authoritative source adapter + canonical thesis object builder | authoritative source adapter + canonical builder |
| `thesisDetails` | canonical thesis detail resolver | detail resolver |
| `writingsPage` | page-level canonical writings projection builder | page projection builder |
| `thesisIdentity` | stable thesis identity + local detail URL resolver | identity resolver |

### Anti-pattern to avoid

Yksikaan naista helppereista ei saa kasvaa hiljaisesti "kaiken content engineksi".

## 16. Shared Validator Boundary

`src/_utils/validateProjectionContract.js` kuuluu tahan sopimukseen vain rakenteellisena validatorina.

Sille sallittuja tarkistuksia ovat:

- allowlist
- duplicate IDs
- required fields
- normalized language values
- local `pageUrl` shape
- count/items parity
- canonical/projection identity parity

Sille ei kuulu:

- publication DOI-dedup
- writings `sectionKeys`
- presentation source merge
- thesis abstract quality

Luokitus:

- structural projection validator: `STANDARDIZED`
- type-specific parity logic: `TYPE-SPECIFIC`
