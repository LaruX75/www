# Publications Page Client Parity

Päiväys: 2026-08-11

## Checkpoint P2

Tässä checkpointissa FI-julkaisusivu siirrettiin käyttämään samaa canonical publications page -datasettiä sekä SSR:ssä että client-hydraatiossa.

Rajaus:

- koskee vain [julkaisut.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/julkaisut.njk)-sivua
- EN-sivua ei vielä muutettu
- `/data/researchfi.json` jäi ennalleen
- `/data/publications.json` jäi ennalleen
- UI-rakenne, tekstit, taulukot ja suodatus säilyivät

## Toteutettu muutos

[julkaisut.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/julkaisut.njk) ei enää rakenna dataa:

- raakasta `researchfi`-taulukosta
- erillisestä `collections.publications`-manual-appendista
- client-puolen `source: 'researchfi'`-hausta

Sen sijaan sivu käyttää nyt:

- buildissä `publicationsPage.items`
- hydraatiossa `/data/publications-page.json`-projectionia

Käytännössä samasta canonical datasetistä tulevat nyt:

- KPI-laskenta
- A/B/C/D/E/G-luokittelu
- manual publication -itemit
- taulukoiden SSR-avausjoukko
- hydraation koko datasetti
- analytiikan inline-laskenta

## Vanhan maailman audit

Komento:

```bash
node scripts/audit-publications-page-client-parity.js
```

Raportti osoitti eksplisiittisesti vanhan epäjatkuvuuden:

- vanha SSR vs canonical
  - `59 == 59`
  - ei puuttuvia rivejä
  - ei kenttäeroja
- vanha JS-hydraatio vs canonical
  - `56 != 59`
  - canonicalissa mukana 3 manual publication -itemiä, joita vanha JS ei hakenut
- vanha JS vs canonical researchfi-subset
  - `56 == 56`
  - ei kenttäeroja

Toisin sanoen:

- vanha FI-SSR oli sisällöllisesti lähempänä canonicalia
- vanha JS-hydraatio jäi jälkeen juuri manual publication -itemeissä

## Uuden canonical runtime -parity

Sama audit-skripti raportoi uudesta runtime-tilasta:

- `sourceDatasetCount: 59`
- `researchfi: 56`
- `manual: 3`
- `hydratedCount: 59`
- `sameDatasetForSsrAndHydration: true`

Ryhmäkohtaiset määrät:

- `A: 29`
- `B: 9`
- `C: 1`
- `D: 6`
- `E: 5`
- `G: 1`

SSR-avausjoukko säilyi tarkoituksella rajattuna:

- `A: 5`
- `B: 5`
- `C: 1`
- `D: 5`
- `E: 5`
- `G: 1`

Tämä on hyväksytty parity:

- SSR ei renderöi koko datasettiä ilman JavaScriptiä
- mutta SSR ja hydraatio nojaavat nyt samaan canonical lähdejoukkoon

## KPI-huomio

KPI-arvoista vain kokonaismäärä muuttui canonical-datasetin mukaiseksi:

- legacy researchfi-only total: `56`
- canonical total: `59`

Muut KPI:t säilyivät samoina:

- peer-reviewed: `39`
- open access: `33`
- articles: `13`
- conferences: `23`
- books: `2`

Tämä ero on tarkoituksellinen seuraus siitä, että canonical publications page dataset sisältää myös 3 eksplisiittisesti hyväksyttyä manual publication -itemiä.

## Build-signaali

Komento:

```bash
npm run eleventy:quiet
```

Tulos:

- onnistui
- `[11ty] Copied 266 Wrote 1232 files in 99.08 seconds (80.4ms each, v3.1.6)`

## Seuraava checkpoint

P3 voi nyt kohdistua pelkästään EN-sivuun:

- [en/publications.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/publications.njk)
- canonical projection -polku
- eksplisiittinen language/subset rule
- ei uutta rinnakkaista lähdeputkea
