# Opinnäytteet: canonical object → projection -audit (2026-08-11)

## Scope

Tämä audit koskee opinnäytearkkitehtuuria:

- lähdedata ja rikastus
- nykyinen canonical-candidate
- FI/EN SSR + JS-on -pariteetti
- public JSON -sopimus
- detail-HTML-polku
- Pagefind
- embeddings / H0 / recommendation-pooli

Rajaus: tämä checkpoint ei muuta runtime-koodia. Tavoite on löytää pienin turvallinen seuraava arkkitehtuurityö.

## Executive summary

Opinnäytteet eivät ole samassa arkkitehtuuritilassa kuin esitykset ja julkaisut olivat auditin alussa. Tärkein havainto on tämä:

- `src/_data/theses.js` on jo käytännössä canonical thesis object -kerros.
- FI- ja EN-listasivut käyttävät jo samaa thesis-datasettiä sekä SSR:ssä että JS-hydraatiossa.
- `/data/theses.json` on jo toimiva public projection.
- Theses osallistuvat jo collection-, taxonomy-, embedding- ja recommendation-pooliin.

Suurin puuttuva lenkki ei ole listaus- tai JSON-arkkitehtuuri vaan detail-projektio:

- opinnäytteillä ei ole paikallisia HTML-detail-sivuja
- yksi opinnäyte ei voi olla oma Pagefind-dokumenttinsa
- hakutulokset osoittavat koontisivuille tai eivät löydä opinnäytettä lainkaan

Siksi pienin oikea seuraava checkpoint ei ole uusi `theses-page.json`, eikä FI/EN-listasivujen uusi canonical-migraatio. Pienin oikea checkpoint on thesis detail pilot nykyisestä canonical-kerroksesta.

## Nykyinen arkkitehtuuri

Nykyinen dataflow näyttää tältä:

```text
OuluREPO OpenSearch
+ thesis-keywords-cache.json
+ curated research-thesis meta
+ optional manual theses fallback
        ↓
src/_data/theses.js
  canonical-enriched thesis objects
        ├── src/opinnaytteet.njk (FI SSR)
        ├── src/en/theses.njk (EN SSR)
        ├── src/data/theses.json.11ty.js
        ├── src/_utils/toThesesCollectionItems.js
        │     └── eleventy collection "theses"
        ├── researchProgram thesis views
        └── embeddings / hybrid / semantic scripts via /data/theses.json
```

## 1. Lähteet ja normalisointi

### 1.1 Pääasiallinen lähde

`src/_data/theses.js` hakee OuluREPO OpenSearch -rajapinnasta advisor- ja reviewer-rooleihin perustuvat tietueet, normalisoi XML:n ja rakentaa rikastetut thesis-objektit.

Olennaiset kohdat:

- OuluREPO-haku ja sivutus: `src/_data/theses.js:171-180`, `254-270`
- XML → thesis object: `src/_data/theses.js:194-245`
- rikastus ja citation-metadata: `src/_data/theses.js:85-99`
- cache/offline fallback: `src/_data/theses.js:316-345`
- advisor/reviewer dedup + final split: `src/_data/theses.js:349-416`

### 1.2 Rikastukset

`src/_data/theses.js` yhdistää useita rikastuslähteitä samaan objektiin:

- `src/curated/research-thesis-meta.json`
- `src/curated/research-program.json` thesis-meta
- `src/_data/thesis-keywords-cache.json`
- `src/_data/curated/theses.json`

Nykyinen manuaalinen fallback on arkkitehtuurissa mukana, mutta tämänhetkinen `src/_data/curated/theses.json` on käytännössä tyhjä:

- `manual: []`
- `hidden: []`

### 1.3 Nykyinen datasetin koko

Auditointihetkellä `_site/data/theses.json` sisälsi:

- `169` itemiä yhteensä
- `116` ohjattua (`thesisRole=advised`)
- `53` tarkastettua (`thesisRole=reviewed`)
- `140` gradu-tasoista
- `29` kandi-tasoista

Kenttäpeitto:

- `127/169` sisältää `description` / abstractin
- `42/169` on ilman abstractia
- `120/169` sisältää avainsanoja
- `110/169` sisältää `researchLine`-metadatan
- `77/169` sisältää `researchThemes`-metadatan
- `110/169` sisältää `researchAudience`-metadatan
- `169/169` sisältää `citationApa`-kentän

## 2. Canonical-candidate

### Johtopäätös

`src/_data/theses.js` on nykytilassa selvästi vahvin canonical-candidate, ja käytännössä jo canonical object -kerros.

Perusteet:

- Se yhdistää kaikki oikeat lähteet yhteen objektiin ennen UI- tai JSON-projektioita.
- Se ratkaisee source priorityn jo nyt:
  - OuluREPO ensisijainen
  - manual kandi fallback vain tarpeen mukaan
  - reviewer-only dedup advisor-dataa vasten
- Se lisää curated tutkimusohjelmametadatan ennen downstream-käyttöä.
- Samaa objektijoukkoa käyttävät jo useat projektio- ja käyttöpolut.

Tärkeä seuraus:

- opinnäytteille ei pidä rakentaa uutta rinnakkaista “master JSON” -kerrosta
- seuraavien checkpointien pitäisi käyttää nykyistä `theses.js`-kerrosta authoritative sourcena

## 3. Nykyiset projektiot

### 3.1 Public JSON projection

`src/data/theses.json.11ty.js` muodostaa `/data/theses.json`-endpointin suoraan `data.theses`-objektista.

Olennaiset kohdat:

- endpoint-kuori: `src/data/theses.json.11ty.js:93-140`
- record-allowlist: `src/data/theses.json.11ty.js:48-90`
- `advised` + `reviewed` dedup JSON-projektiossa: `src/data/theses.json.11ty.js:107-139`

Tämä on jo allowlist-pohjainen public projection. Siihen vuotavat vain käyttöön otetut public-kentät:

- `id`
- `url`
- `title`
- `description`
- `year`
- `lang`
- `contentType`
- `contentTypeLabel`
- `section`
- `thesisType`
- `authors`
- `keywords`
- `categories`
- `contexts`
- `thesisRole`
- `researchLine`
- `researchThemes`
- `researchAudience`
- `researchPriority`
- `researchSummary`
- `citationApa`

Kenttiä, jotka jäävät tarkoituksella pois public projectionista:

- `advisors`
- `reviewers`
- `subjects`
- `licenseUri`
- `okmType`
- `featuredOn`
- `researchExcluded`
- `stats`
- `fetchedAt`

### 3.2 Collection projection

`src/_utils/toThesesCollectionItems.js` muuntaa samat thesis-objektit virtuaalisiksi Eleventy collection itemeiksi.

Olennaiset kohdat:

- collection-item projection: `src/_utils/toThesesCollectionItems.js:47-95`
- full collection build: `src/_utils/toThesesCollectionItems.js:106-136`
- collection registration: `eleventy.collections.js:307-316`

Tämä on tärkeä signaali siitä, että canonical object → projection -malli on opinnäytteissä jo osittain käytössä.

## 4. FI / EN parity audit

### 4.1 SSR

FI- ja EN-sivut käyttävät SSR:ssä samaa `theses`-dataobjektia:

- FI: `src/opinnaytteet.njk`
- EN: `src/en/theses.njk`

Molemmat renderöivät kolme lohkoa samasta datasetistä:

- gradut
- kandit
- reviewerOnly

SSR-limit on nykykoodissa `5` per lohko:

- FI: `src/opinnaytteet.njk:177-182`, `215-220`, `262-266`
- EN: `src/en/theses.njk:111-116`, `140-145`, `169-174`

### 4.2 JS-on / hydraatio

FI ja EN käyttävät hydraatiossa samaa `/data/theses.json`-feedia `window.ContentEngine.query({ source: 'theses' ... })` -kutsujen kautta.

- FI-hydraatio: `src/opinnaytteet.njk:353-390`
- EN-hydraatio: `src/en/theses.njk:260-294`
- source → endpoint map: `src/_utils/contentPresets.js:46-56`
- thesis filter fields browser-side: `src/_utils/contentPresets.js:147-175`

### 4.3 Pariteettijohtopäätös

FI/EN-sivuilla ei löydy samanlaista arkkitehtuurista SSR-vs-JS dataset split -ongelmaa kuin julkaisuissa tai esityksissä oli ennen canonical-migraatiota.

Nykyinen tilanne:

- FI SSR = `theses.js`
- EN SSR = `theses.js`
- FI JS-on = `/data/theses.json`
- EN JS-on = `/data/theses.json`
- `/data/theses.json` muodostetaan samasta `theses.js`-datasetistä

Tämä on käytännössä jo hyvä parity-signaali.

### 4.4 Havaitut pienet epäsymmetriat

1. `lang` kovakoodataan public feediin arvoksi `"fi"`:

- `src/data/theses.json.11ty.js:110`

Samaan aikaan collection-projektio tunnistaa myös englanninkieliset opinnäytteet:

- `src/_utils/toThesesCollectionItems.js:66`

Tämä ei tällä hetkellä näytä rikkovan listaus-UI:ta, mutta se on metadata-epäjatkuvuus.

2. Kommentit puhuvat yhä `15` SSR-rivistä, vaikka templateissä käytetään `5`:

- FI-kommentti: `src/opinnaytteet.njk:353-358`
- EN-kommentti: `src/en/theses.njk:261-264`

Tämä on dokumentaatio-/kommenttidrifti, ei varsinainen arkkitehtuuriblokkeri.

## 5. Thesis-related public JSON audit

Tällä hetkellä ainoa varsinainen thesis-spesifi public endpoint on:

- `/data/theses.json`

Lisäksi thesis-data osallistuu välillisesti:

- `content-presets` endpoint-registryyn: `src/_utils/contentPresets.js:46-56`
- embedding-pooliin yhdessä `/data/content.json`:n kanssa

Tärkeä havainto:

- opinnäytteille ei ole erillistä `/data/theses-page.json`
- sellaista ei myöskään näyttäisi tällä hetkellä tarvittavan listauspariteetin vuoksi

## 6. Detail HTML audit

### Nykytila

Opinnäytteillä ei ole paikallisia HTML-detail-sivuja.

Nykyinen koonti-UI linkittää suoraan ulkoiseen OuluREPO-osoitteeseen:

- desktop-linkki: `src/_includes/thesis-table.njk:55-59`
- mobile-linkki: `src/_includes/thesis-table.njk:142-146`
- sama pattern myös client-side row rendererissä: `src/opinnaytteet.njk:415-429`

Build-outputissa näkyvät vain:

- `_site/opinnaytteet/index.html`
- `_site/en/theses/index.html`

mutta ei vastaavaa polkua tyyliin:

- `_site/opinnaytteet/<id>/index.html`
- `_site/en/theses/<id>/index.html`

### Johtopäätös

Tämä on opinnäytearkkitehtuurin suurin puuttuva lenkki.

Niin kauan kuin paikallista detail-projektiota ei ole:

- yksi thesis ei ole yksi HTML-dokumentti
- Pagefind ei voi palauttaa thesis-kohtaista paikallista URL:ia
- thesis ei saa omaa paikallista schema/OG/canonical-projektiota
- related-content- ja knowledge-surface -laajennuksille ei ole luonnollista sisäistä landing pagea

## 7. Pagefind audit

### Index-tila

Auditissa Pagefind indeksoi:

- `1265` sivua
- `2` kieltä

### Otsikkohakuotos

Auditoin 8 oikeaa thesis-otsikkoa `_site/data/theses.json`-feedistä. Tulokset:

- `5/8` palautti vain `/opinnaytteet/`-koontisivun
- `2/8` ei palauttanut mitään tulosta
- `1/8` palautti teemä-/muuta sivustosisältöä, mutta ei thesis-kohtaista dokumenttia

Esimerkkihavaintoja:

- `6-luokkalaisten kokemuksia matematiikka-ahdistuksesta`
  - top result: `/opinnaytteet/`
- `ADHD-oireisten kokemuksia kuormituksesta koulussa`
  - `0` tulosta
- `Kuinka opettajaopiskelijoiden tekoälytaidot näkyvät heidän tekemissään luokittelijasovelluksissa`
  - top results: teemä- ja julkaisusivuja, ei thesis-detailiä

### Pagefind-johtopäätös

Opinnäytteiden Pagefind-ongelma ei ole ensisijaisesti ranking-tuning-ongelma vaan dokumenttirakenneongelma.

Niin kauan kuin thesis-detail-HTML puuttuu:

- Pagefind ei voi rankata thesis-detailiä ykköseksi
- archive/page/theme/category-sivut joutuvat kantamaan yksittäisen opinnäytteen löydettävyyden
- osa opinnäytteistä jää kokonaan haun ulkopuolelle

Tämä on vahvin peruste հաջորդavalle detail-checkpointille.

## 8. Embeddings / H0 / recommendations audit

Opinnäytteet ovat jo mukana embedding- ja recommendation-poolissa.

### 8.1 Candidate pool

`scripts/build-embeddings.js` rakentaa poolin näin:

- `_site/data/content.json`
- `_site/data/theses.json`

Koodi:

- `scripts/build-embeddings.js:60-68`

### 8.2 Thesis embedding input

`buildEmbeddingInput()` käsittelee thesis-itemin `description`-kentän nimenomaan thesis-abstractina:

- thesis rich source -kommentti: `src/_utils/buildEmbeddingInput.js:100-104`
- `description` → `thesisAbstract` label: `src/_utils/buildEmbeddingInput.js:136-150`
- actual source list build: `src/_utils/buildEmbeddingInput.js:153-206`

Nykyinen logiikka:

- thesis käyttää `title + description`
- `description` tulkitaan thesis-abstractiksi
- erillistä thesis-detail-bodyä tai muuta rich HTML sourcea ei ole

### 8.3 Käytännön seuraus

Embedding- ja hybrid-pooli toimii jo, mutta 42 opinnäytettä ovat title-only tai lähes title-only tilanteessa, koska niiltä puuttuu abstract.

Tämä ei ole ensisijainen arkkitehtuuriblokkeri, mutta kannattaa muistaa myöhemmässä quality-hardeningissa.

## 9. Overall assessment

### Vahvuudet

- Yksi vahva canonical data source on jo olemassa.
- FI/EN listauspariteetti on jo hyvä.
- Public JSON on jo allowlist-projektio.
- Collection-/taxonomy-/researchProgram-integraatio on jo samaan canonical-lähteeseen kytketty.
- Embeddings ja recommendation-pooli käyttävät jo thesis-feedä.

### Todelliset puutteet

- Ei paikallista thesis detail HTML -projektiota.
- Ei thesis-kohtaista Pagefind-dokumenttia.
- `lang`-metadatan public feed -epäjatkuvuus.
- Osa opinnäytteistä on edelleen heikosti rikastettuja abstractin puutteen vuoksi.

## 10. Suositeltu pienin seuraava checkpoint

### Ei suositella seuraavaksi

Seuraava askel ei mielestäni ole:

- uusi `theses-page.json`
- uusi rinnakkainen “canonical JSON first” -malli
- FI/EN-listasivujen iso refaktori
- Pagefind ignore/tuning ennen detail-dokumenttia

### Suositeltu checkpoint T1

Pienin oikea seuraava checkpoint on:

**canonical thesis detail pilot nykyisestä `src/_data/theses.js` -kerroksesta**

Suositeltu dataflow:

```text
src/_data/theses.js
  canonical thesis objects
        ├── /data/theses.json
        ├── FI /opinnaytteet/
        ├── EN /en/theses/
        └── thesis detail HTML pilot
```

### T1-rajaukset

- käytä authoritative sourcena `src/_data/theses.js`:ää, ei `/data/theses.json`:ia
- generoi yksi pilot-thesis paikalliseksi detail-sivuksi
- älä muuta vielä FI/EN archive-UI:ta
- älä rakenna uutta rinnakkaista master-feedä
- älä tee Pagefind-tuningia ennen kuin detail-dokumentti on olemassa

### T1-hyväksymiskriteerit

- yksi thesis = yksi paikallinen HTML-dokumentti
- detail käyttää samaa canonical thesis objectia kuin listaus ja public JSON
- detail-sivu näyttää vähintään:
  - title
  - authors
  - year
  - thesisType
  - abstract
  - keywords
  - researchLine / researchThemes
  - citation
  - linkin OuluREPO-originaliin
- detail-sivulla on Thesis/ScholarlyArticle-tyyppinen schema-projektio
- Pagefind löytää pilot-thesiksen paikallisella detail-URL:lla

## 11. Mahdollinen seuraava checkpoint T2

Jos T1 onnistuu, vasta sitten kannattaa siirtyä massagenerointiin:

- kaikki thesis-detailit samasta canonical resolverista
- archive → detail -linkkistrategia
- Pagefind-parity audit
- mahdollinen EN-detail-polku

## 12. Mikrohuomiot, jotka voi korjata myöhemmin erillään

Nämä eivät ole seuraavan arkkitehtuuricheckpointin ydin, mutta ne kannattaa kirjata:

- `/data/theses.json` `lang` kannattaa johtaa oikeasta thesis-kielestä eikä kovakoodata `fi`
- SSR-kommentit kannattaa päivittää vastaamaan nykyistä `5` rivin limit-logiikkaa
- abstractittomien thesis-tietueiden rikastusta voi jatkaa erillisenä data-quality-tehtävänä

## Final verdict

Opinnäytepilotti ei tarvitse seuraavaksi listausarkkitehtuurin canonical-migraatiota, koska se on jo pitkälti olemassa.

Se tarvitsee seuraavaksi **detail-projektion**, jotta canonical object -malli ulottuu myös:

- thesis-kohtaiseen HTML:ään
- Pagefindiin
- sisäiseen landing page -rakenneeseen

Siksi suositus on:

**T1 = thesis canonical detail pilot, ei uusi page JSON eikä listausrefaktori.**
