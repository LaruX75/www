# Research.fi Prompt Eleventyyn

Kopioi alla oleva prompti toiseen sovellukseen tai AI-työkaluun, kun haluat toteuttaa Research.fi-integraation Eleventy-projektiin samalla periaatteella kuin tällä sivustolla.

```text
Haluan toteuttaa Eleventy-projektiin Research.fi-integraation Node.js-datalähteenä samalla periaatteella kuin tuotantokäyttöön tehdyssä Eleventy-ratkaisussa, jossa henkilön julkaisut haetaan Research.fi:n person-haun kautta ja normalisoidaan käyttöön sivuston Nunjucks-templateissa.

Toteuta valmis Eleventy-yhteensopiva ratkaisu, ei pseudokoodia.

Tavoite:
- Hae henkilön julkaisut Research.fi:stä build-vaiheessa
- Tee ratkaisu Eleventyn `_data`-mallin mukaisesti
- Tue kahta hakutapaa:
  - ORCID-tunnus
  - henkilön nimi
- Toteuta ratkaisu niin, että sitä voi käyttää muidenkin henkilöiden kuin yhden ennalta määritellyn tutkijan kanssa
- Tee ratkaisu Node.js + Eleventy -ympäristöön ilman raskasta framework-riippuvuutta

Haluan lopputulokseksi ainakin nämä tiedostot:
1. `src/_data/researchfi.js`
2. tarvittaessa cache-apuri, esim. `src/_data/_apiCache.js` tai `scripts/_apiCache.js`
3. esimerkin siitä, miten `researchfi`-dataa käytetään Nunjucksissa

Research.fi-haku:
- Käytä HTTP POST -kutsua endpointiin:
  `https://researchfi-api-production.2.rahtiapp.fi/portalapi/person/_search`
- Käytä JSON request bodya
- Lisää headerit:
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Origin: https://research.fi`
  - `Referer: https://research.fi/`

Eleventy-konteksti:
- Toteuta `src/_data/researchfi.js` niin, että se exporttaa async-funktion:
  - CommonJS-muodossa `module.exports = async function () { ... }`
  - tai projektin käytössä olevaan Eleventy-muotoon sopivasti
- Funktion tulee palauttaa taulukko julkaisuolioita
- Taulukkoa pitää voida käyttää suoraan templateissa muuttujana `researchfi`
- Toteutuksen pitää toimia build-vaiheessa ilman selainympäristöä

Hakulogiikka:
- ORCID-haussa käytä kyselyä, joka vastaa tätä:
  ```json
  {
    "query": {
      "match_phrase": {
        "id": "0000-0000-0000-0000"
      }
    },
    "size": 1
  }
  ```
- Nimihakua varten tee person-haku nimikenttiin kohdistuvasti
- Jos nimihaku palauttaa useita osumia:
  - älä valitse satunnaisesti
  - pisteytä osumia ainakin näillä:
    - täydellinen nimiosuma
    - ORCID-osuma, jos annettu
    - organisaatio-osuma, jos annettu
  - palauta järjestetty ehdokaslista tai valitse vain, jos osuma on yksiselitteinen

Julkaisujen lukeminen:
- Kun henkilö löytyy, julkaisut löytyvät tietorakenteesta:
  `hits.hits[0]._source.activity.publications`
- Toteuta funktio, joka lukee tämän turvallisesti
- Jos julkaisuja ei ole, palauta tyhjä lista

Normalisoi julkaisu vähintään tähän muotoon:
```js
{
  title: "",
  authors: "",
  year: null,
  journal: null,
  doi: null,
  doiUrl: null,
  url: null,
  typeCode: "",
  typeLabel: "",
  typeShort: "",
  peerReviewed: false,
  openAccess: 0,
  publicationId: null,
  keywords: []
}
```

Julkaisutyypit:
- Tunnista `typeCode` useista mahdollisista kentistä, esimerkiksi:
  - `publicationTypeCode`
  - `typeCode`
  - `publicationType.code`
  - `publicationType.id`
  - `publicationType.value`
  - `publicationType.publicationTypeCode`
  - `publicationTypeCodeFi`
  - `publicationTypeCodeEn`
- Lisää tyyppikoodien kartta luettavaan labeliin, esimerkiksi:
  - A1 = original journal article
  - A2 = review article
  - A3 = chapter in edited volume
  - A4 = conference paper
  - B1, B2, B3
  - C1, C2
  - D1, D2, D3
  - E1, E2
  - G4, G5

Vertaisarviointi:
- Toteuta `normalizePeerReviewed()` niin, että se hyväksyy:
  - boolean
  - number
  - string
  - array
  - object
- Käytä julkaisuluokitusta fallbackina:
  - A*, C*, G4, G5 -> yleensä vertaisarvioitu
  - B*, D*, E* -> yleensä ei vertaisarvioitu

Open access:
- Toteuta `normalizeOpenAccess()` niin, että se hyväksyy:
  - boolean
  - number
  - string
  - array
  - object
- Jos kenttä on epäselvä, käytä `selfArchivedCode`-arvoa fallbackina

Avainsanat:
Toteuta `extractKeywords(pub)` robustisti:
- tarkista suorat kentät:
  - `keywords`
  - `keyword`
  - `subjects`
  - `subject`
  - `topic`
  - `topics`
  - `researchKeywords`
  - `publicationKeywords`
  - `researchSubject`
  - `scienceKeywords`
  - `avainsanat`
  - `asiasanat`
- jos arvo on string:
  - pilko erotinmerkeillä `,`, `;`, `|`
- jos arvo on array:
  - käy jokainen läpi
- jos arvo on object:
  - tarkista ainakin:
    - `keyword`
    - `keywords`
    - `subject`
    - `subjects`
    - `topic`
    - `topics`
    - `value`
    - `name`
    - `label`
    - `text`
    - `nameFi`
    - `nameEn`
    - `nameSv`
- käy lisäksi koko julkaisuobjekti rekursiivisesti läpi
- jos avainsanaan viittaava kenttänimi sisältää jonkin näistä:
  - `keyword`
  - `subject`
  - `topic`
  - `tag`
  - `avainsana`
  - `asiasana`
  niin yritä poimia siitä avainsanat
- palauta:
  - uniikit arvot
  - trimmatut arvot
  - aakkosjärjestetty taulukko

Välimuisti:
- Toteuta yksinkertainen cache-ratkaisu Eleventy-buildiä varten
- Tee ainakin:
  - `readCache(key)`
  - `readCacheIfFresh(key, ttlHours)`
  - `writeCache(key, data)`
- Säilytä välimuistissa mieluiten raakadata (`raw publications`), ei vain valmiiksi normalisoitua tulosta
- Jos API-haku epäonnistuu mutta cache löytyy, käytä cachea fallbackina
- Ratkaisun pitää toimia hyvin staattisessa build-putkessa

Ympäristömuuttujat:
- Tue vähintään:
  - `ORCID_ID`
  - tarvittaessa `RESEARCHFI_PERSON_NAME`
  - tarvittaessa `RESEARCHFI_ORGANIZATION`
- Jos ORCID löytyy, käytä sitä ensisijaisesti

Virheenkäsittely:
- Jos API palauttaa virheen, älä kaada koko buildia
- Jos henkilöä ei löydy, palauta tyhjä lista tai hallittu fallback
- Jos julkaisut puuttuvat, palauta tyhjä lista
- Jos avainsanat puuttuvat, palauta `keywords: []`
- Tee parserista sietävä eikä hauras
- Jos cache löytyy, käytä sitä buildin pelastamiseen

Toteutustapa:
- Käytä modernia Node.js:ää
- Voit käyttää:
  - built-in `fetch` tai projektin nykyistä fetch-apuria
  - `fs/promises`
  - `path`
  - `dotenv`
- Älä rakenna tätä framework-riippuvaiseksi
- Tee moduulista Eleventyyn suoraan pudotettava datalähde

Haluan lopputulokseksi:
1. valmiin `src/_data/researchfi.js`-tiedoston
2. mahdollisen cache-apurin
3. esimerkin `.env`-muuttujista
4. esimerkin Nunjucks-käytöstä, esimerkiksi:
   - `{{ researchfi.length }}`
   - looppi julkaisuihin
   - avainsanojen renderöinti
5. lyhyen selityksen siitä:
   - että julkaisut haetaan henkilötietueen sisältä
   - että ORCID on luotettavampi kuin nimi
   - että avainsanat poimitaan heuristisesti useista mahdollisista kentistä
   - että build ei saa kaatua yhden API-ongelman takia

Anna valmis tuotantokelpoinen koodi, ei pseudokoodia.
Jos jokin kenttä ei ole varmasti vakio, käsittele se optionaalisena ja tee parserista robusti.
Säilytä toteutuksessa Eleventyyn sopiva yksinkertainen rakenne.
```
