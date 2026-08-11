# Publications Page Public Projection Audit

Päiväys: 2026-08-11

## Checkpoint P1

Tässä checkpointissa tehtiin vain datakerros ja public projection:

- canonical publications page dataset
- allowlist public projection
- parity audit

FI- tai EN-clientteihin ei vielä koskettu.

## Tavoitetila

Julkaisut-sivulle rakennettiin oma page-tason canonical projection ilman, että:

- `researchfiContent.js` korvattiin uudella rinnakkaisella “master truth” -mallilla
- yleistä `/data/publications.json`-feedia muutettiin
- FI- tai EN-sivun UI:ta muutettiin

Rakenteellinen linja on nyt:

`researchfi` + `researchfiContent` + eksplisiittisesti hyväksytyt manual publication records
→ `buildPublicationsPageModel`
→ `/data/publications-page.json`

## Uudet tiedostot

- [publicationsPage.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/publicationsPage.js)
- [publications-page.json.11ty.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/data/publications-page.json.11ty.js)
- [audit-publications-page-projection.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-publications-page-projection.js)
- [julkaisut.11tydata.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/julkaisut.11tydata.js)
- [en/publications.11tydata.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/publications.11tydata.js)

## Manual publication -päätös

FI-julkaisuluettelon vanha SSR-käytös ei jäänyt voimaan implisiittisesti, vaan manual publication -itemit luokiteltiin eksplisiittisesti:

- `etaopetuksen-nayton-paikka`
  - `professionalPublication`
  - mukana canonical page datasetissä
- `faktabaari-generation-ai-projekti`
  - `generalAudiencePublication`
  - mukana canonical page datasetissä
- `faktabaari-tekoalytaitojen-opettaminen-generation-ai-sovellusten-avulla`
  - `generalAudiencePublication`
  - mukana canonical page datasetissä

Tässä checkpointissa ei jäänyt excluded manual publication -itemeitä.

## Projection allowlist

Canonical itemeille määriteltiin eksplisiittinen allowlist:

- `PUBLIC_PUBLICATIONS_PAGE_FIELDS`

Projectioniin vuotavat vain sivun tulevan käyttöpolun kannalta olennaiset kentät, kuten:

- tunnisteet ja URL:t
- otsikko ja kuvaus
- vuosi / päivä
- tekijät, julkaisupaikka ja tyyppikoodi
- DOI / JUFO / citation metadata
- tutkimuslinja-, teema- ja yleisömetadata
- lähde- ja origin-tieto

## Parity-audit

Komento:

```bash
node scripts/audit-publications-page-projection.js
```

Tulos:

- `ok: true`
- `count: 59`
- `researchfi: 56`
- `manual: 3`
- `legacyCount = canonicalCount = 59`
- `idsOnlyInLegacy = []`
- `idsOnlyInCanonical = []`
- `fieldDiffs = []`
- allowlistin ulkopuolisia kenttävuotoja ei havaittu

Parity tässä checkpointissa tarkoittaa nimenomaan FI-sivun nykyisen SSR-sisältöjoukon ja uuden canonical page datasetin yhtäpitävyyttä.

## Build-signaali

Komento:

```bash
npm run eleventy:quiet
```

Tulos:

- onnistui
- `[11ty] Copied 266 Wrote 1232 files in 110.04 seconds (89.3ms each, v3.1.6)`

Build käytti useissa ulkoisissa lähteissä välimuistia, mutta publications page projection ei rikkonut build-polkuja.

## Seuraava checkpoint

P2:n tavoite voi nyt olla turvallisesti:

- FI-client lukee canonical `/data/publications-page.json` -projectionia
- JS-off / JS-on parity tarkistetaan
- UI ei muutu
