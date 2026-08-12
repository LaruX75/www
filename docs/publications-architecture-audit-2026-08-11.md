# Publications Architecture Audit

Päiväys: 2026-08-11

## Tarkoitus

Tämän auditin tarkoitus on rajata julkaisut-pilotin seuraava turvallinen checkpoint samalla kurinalaisella mallilla kuin esityksissä:

heterogeeniset publication-lähteet
→ canonical publication objects
→ allowlist public projection
→ page/client-kulutus

Tässä vaiheessa ei vielä tehdä UI-muutosta. Tavoite on ensin ymmärtää nykyinen runtime-sopimus ja sen parity-epäjatkuudet.

## Nykyiset julkiset endpointit

Repo julkaisee tällä hetkellä kaksi eri julkaisuaiheista JSON-virtaa:

1. `/data/publications.json`
2. `/data/researchfi.json`

Niiden roolit ovat eri:

- [src/data/publications.json.11ty.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/data/publications.json.11ty.js) serialisoi `collections.publications`-kokoelman yleiseksi public content feediksi
- [src/data/researchfi.json.11ty.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/data/researchfi.json.11ty.js) serialisoi Research.fi-tutkimusjulkaisut erilliseksi scientific-publication-feediksi

Lisäksi Research.fi-datan rinnalla on jo canonical sisältökerros:

- [src/_data/researchfiContent.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/researchfiContent.js)

Se tuottaa rikastetun canonical-objektin, jota käytetään jo muualla sivustossa tutkimuslinjoihin, teemoihin ja taxonomyyn.

## Mitä FI-sivu käyttää nyt

Pääsivu [src/julkaisut.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/julkaisut.njk) käyttää tällä hetkellä kahta rinnakkaista datamallia:

- build-vaiheessa raakaa `researchfi`-dataa
- build-vaiheessa lisäksi `collections.publications`-itemeitä, joilla on `publicationType`

Käytännössä FI-sivu:

- laskee KPI:t `researchfi`-taulukosta
- ryhmittelee A/B/C/D/E/G-luokat `researchfi`-taulukosta
- lisää samaan SSR-listaukseen myös manuaalisia publicationType-itemeitä `collections.publications`-kokoelmasta
- hydraatio-vaiheessa korvaa taulukot clientissä `window.ContentEngine.query({ source: 'researchfi' })` -datalla eli `/data/researchfi.json`-projectionilla

Tämä tarkoittaa, että SSR ja JS-on runtime eivät tällä hetkellä nojaa täysin samaan sisältöjoukkoon.

## Mitä EN-sivu käyttää nyt

[src/en/publications.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/publications.njk) käyttää vain `researchfi`-dataa.

EN-sivu:

- ei lue `collections.publications`-manuaali-itemeitä
- ei sekoita mukaan publicationType-frontmatter-julkaisuja
- renderöi ja analysoi vain Research.fi-joukkoa

Siksi FI- ja EN-sivujen sisältöjoukko ei ole täysin sama.

## Tunnistettu parity-epäjatkuvuus

FI-sivu lukee buildissä kolme manuaalista publicationType-itemiä `src/publications/`-puolelta:

- [faktabaari-generation-ai-projekti.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/publications/faktabaari-generation-ai-projekti.md)
- [faktabaari-tekoalytaitojen-opettaminen-generation-ai-sovellusten-avulla.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/publications/faktabaari-tekoalytaitojen-opettaminen-generation-ai-sovellusten-avulla.md)
- [etaopetuksen-nayton-paikka.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/publications/etaopetuksen-nayton-paikka.md)

Client-hydraatio ei kuitenkaan hae näitä mukaan, koska se käyttää vain `source: 'researchfi'`-projectionia.

Tästä seuraa:

- JS-off ja JS-on eivät perustu täysin samaan aineistoon
- FI ja EN eivät perustu täysin samaan aineistoon
- nykyinen julkaisut-sivu ei vielä ole samalla tavalla canonical page projection -mallissa kuin esitykset

Tämä ei ole pelkkä cleanup-havainto vaan oikea parity-kysymys.

## Kentät, joita FI-client käyttää researchfi-projectionista

FI-sivun hydraatio käyttää vähintään näitä `/data/researchfi.json`-kenttiä:

- `anchorId`
- `title`
- `year`
- `authors`
- `journal`
- `url`
- `doi`
- `doiUrl`
- `type`
- `typeCode`
- `volume`
- `issue`
- `pages`
- `publisher`
- `isbn`
- `jufoLevel`
- `citationCount`
- `researchLine`
- `researchThemes`
- `researchAudience`
- `peerReviewed`
- `openAccess`

Lisäksi sivun analytiikka käyttää raw `researchfi`-inline-datasta ainakin kenttiä:

- `year`
- `typeCode`
- `authors`
- `title`
- `peerReviewed`
- `openAccess`
- `doi`

Tämä inline-data pitäisi myöhemmin saada samasta canonical page-projectionista tai samasta endpoint-sopimuksesta, ei erillisestä Nunjucks-loopista.

## Mitä `/data/publications.json` tekee nyt

`/data/publications.json` ei ole julkaisut-sivun page-projection.

Se on yleinen public content feed `collections.publications`-sisällöille, ja sitä käyttävät esimerkiksi:

- politiikka- ja kirjoitukset-sivujen client-filtterit
- muut sisältöarkistot, jotka odottavat tavallista public content record -muotoa

Sitä ei siis pidä sotkea suoraan scientific-publication-listauksen runtime-sopimukseksi ilman erillistä parity-porttia.

## Suositeltu seuraava checkpoint

Turvallisin seuraava askel ei ole suoraan client-refaktori, vaan page-tason canonical projection:

1. määritä julkaisut-sivulle yksi kanoninen sisältöjoukko
2. yhdistä siihen hallitusti:
   - Research.fi scientific publication -objektit
   - ne manuaaliset publicationType-julkaisut, joiden kuuluu oikeasti näkyä julkaisuluettelossa
3. julkaise tämä allowlist-muotoisena page-projectionina
4. vertaile parity:
   - item count
   - title
   - URL
   - year/date
   - type/typeCode
   - authors
   - researchLine/themes/audience
   - FI SSR vs canonical projection
   - EN expected subset vs canonical projection
5. vasta tämän jälkeen vaihda FI- ja EN-sivut lukemaan samaa canonical page-projectionia

## Käytännön toteutusrajaus

Seuraavan toteutuscheckpointin hyväksymiskriteeri voisi olla:

- julkaisut-sivulla on yksi eksplisiittinen canonical page data -kerros
- JS-on ja JS-off nojaavat samaan sisältöjoukkoon
- FI- ja EN-sivu eivät kokoa rinnakkaisia publication-objekteja eri lähteistä
- `/data/publications.json` saa jäädä ennalleen yleiseksi collection-feediksi
- UI, tekstit ja osiorakenne eivät muutu

## Ei vielä tehtävä tässä checkpointissa

Tähän samaan muutokseen ei kannata niputtaa:

- julkaisut-sivun visuaalista redesignia
- uutta vapaatekstihakua מעבר nykyisen
- Pagefind-uudelleenkytkentää
- knowledge-graphin tai embedding-polun muutoksia
- muiden `collections.publications`-kuluttajien refaktorointia

Ensimmäinen tavoite on vain ratkaista julkaisut-listauksen datapariteetti ja saada sille sama canonical projection -malli, joka esityksissä jo todistettiin toimivaksi.
