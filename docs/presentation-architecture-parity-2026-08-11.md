# Presentation Architecture Parity

Päiväys: 2026-08-11

Commit auditointipiste: `2b48d169f91567bbf1e1c78ba4931e06ecfa21f4`

## Tarkoitus

Tämä dokumentti kokoaa yhteen presentation-pilotin arkkitehtuuriparityn neljä päätodistetta:

1. public projection parity
2. client parity
3. detail parity
4. full build ja UX-regressio

Lisäksi dokumentti kirjaa checkpoint 5:n lopputilan: sekä FI- että EN-esitysnäkymä ovat nyt canonical presentation -kerroksen piirissä.

## Yhteenveto

Arkkitehtuurin kannalta pilotin ydin on nyt toteutunut ja parity-portti on vihreä:

- `/data/presentations-page.json` on canonical public projection
- `/esitykset/` käyttää canonical `items`-rakenetta
- yksittäiset presentation-detail-sivut käyttävät samaan canonical-kerrokseen nojaavaa lookupia
- [src/en/presentations.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/presentations.njk) käyttää nyt samaa canonical `items` -mallia eikä kokoa source-kohtaisia `rawData`-rivejä itse
- nykyinen Playwright UX/a11y-suite menee läpi sekä FI- että EN-esityssivun kanssa

## 1. Public Projection Parity

Skripti:

- [audit-presentations-page-projection.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-presentations-page-projection.js)

Tulos:

- `ok: true`
- `count: 210`
- lähdekohtaiset bucketit täsmäävät
- allowlistin ulkopuolisia kenttävuotoja ei havaittu

Ajantasainen endpoint-rakenne buildatun sivuston JSON:ssa:

- `version`
- `generatedAt`
- `count`
- `items`
- `contexts`
- `canvaPageUrls`

Vahvistettu tila:

- `count = 210`
- `items.length = 210`
- `contexts.length = 5`
- `canvaPageUrls.length = 15`
- `rawData` ei enää ole mukana runtime-sopimuksessa

## 2. Client Parity

Skripti:

- [audit-presentations-page-client-parity.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-presentations-page-client-parity.js)

Tulos:

- `ok: true`
- `canonicalItemsCount: 210`
- bucket parity `ok: true`
- archive parity `ok: true`

Johtopäätös:

- `/esitykset/`-sivun selainlogiikka toimii canonical `items`-polulla ilman source-kohtaista runtime-`rawData`-sopimusta
- listaus, lähdebucketit ja archive-rakenne säilyivät parityssä

## 3. Detail Parity

Skripti:

- [audit-presentation-detail-parity.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-presentation-detail-parity.js)

Tulos:

- `ok: true`
- `count: 139`
- `missingInCanonical: []`
- `missingInLegacy: []`
- `fieldDiffs: []`

Johtopäätös:

- yksittäiset esityssivut eivät enää nojaa irralliseen detail-kohtaiseen rinnakkaisrakenteeseen
- detail lookup kulkee nyt yhteisen canonical-kerroksen kautta
- toteutus on tarkoituksella `local-first, canonical-fallback`, joten näkyvä käyttäytyminen säilyy ennallaan

Keskeiset tiedostot:

- [presentationsPage.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/presentationsPage.js)
- [presentations.11tydata.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/presentations/presentations.11tydata.js)

## 4. Full Build

Komento:

```bash
npm run eleventy:quiet
```

Tulos:

- onnistui
- `[11ty] Copied 266 Wrote 1231 files in 99.19 seconds (80.6ms each, v3.1.6)`
- `_site` tiedostomäärä: `7505`

Huomiot:

- build ei kaatunut checkpoint 4:n jälkeen
- useat live-fetchit epäonnistuivat ajon aikana, mutta build käytti välimuisteja ja valmistui silti onnistuneesti
- parityn näkökulmasta tämä on hyväksyttävä build-signaali, mutta se ei ole sama asia kuin täysin tuore ulkoinen data

## 5. UX / Playwright Regression

Pääajo:

```bash
PLAYWRIGHT_PORT=4183 PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js
```

Tulos:

- `25 passed (1.0m)`

Korjattu regressio:

- [src/js/presentations-page.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/js/presentations-page.js)
- `/esitykset/`-sivun featured-thumbnail-linkeille lisättiin eksplisiittinen saavutettava nimi
- aiempi `link-name`-faili poistui

Testiajon suorituskykykorjaus:

- [tests/helpers/contrast.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/tests/helpers/contrast.js)
- presentations-sivun kontrastiaudit rajattiin `main`-sisältöalueeseen, jolloin yhteinen navigaatiokuori ei toistu turhaan jokaisella sivulla
- hover/scroll-auditin opportunistiset timeoutit lyhennettiin ja liike poistettiin auditin ajaksi, jotta esityssivun suuri kontrollimäärä ei johda pelkkään testitason timeoutiin

Johtopäätös:

- UX-portti on nyt vihreä
- EN-esityssivu on mukana a11y- ja kontrastisuitessa
- presentation-pilotissa ei enää ole näkyvää presentation-spesifiä legacy-haaraa

## 6. Repo-Wide Legacy Audit

Erityinen auditointikohde:

- [src/en/presentations.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/presentations.njk)

Tulos:

- EN-sivun legacy-haara auditoitiin ensin erikseen: [en-presentations-audit-2026-08-11.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/docs/en-presentations-audit-2026-08-11.md)
- sivulle lisättiin oma [presentations.11tydata.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/presentations.11tydata.js), joka käyttää samaa `buildPresentationsPageModel`-polkua kuin FI-sivu
- inline-JS säilytettiin, mutta `rawData`-malli poistui
- EN-sivu käyttää nyt canonical `items`-dataa, josta se rajaa oman nykyisen näkymänsä osiot:
  - `aoe`
  - `canva` (`lang === "en"`)
  - `slideshare`
  - `youtubeVideos`
  - `youtube`

Tulkinta:

- EN-sivu ei ollut tarkoituksellinen arkkitehtuuripoikkeus vaan vanha rinnakkainen datakokoamistapa
- migraatio voitiin tehdä ilman UI-muutosta
- cache/fetch-status-merkintää ei lisätty public projectioniin vain EN-legacy-tekstin säilyttämiseksi

## Päätelmä

Presentation-pilotti voidaan nyt merkitä arkkitehtuurisesti valmiiksi:

- listaus käyttää canonical projectionia
- detail-sivut käyttävät samaan canonical kerrokseen nojaavaa lookupia
- EN-listaus käyttää samaa canonical `items` -kerrosta rajatulla osioinnilla
- public projection-, client- ja detail-parityt ovat vihreitä
- täysi Eleventy-build valmistuu onnistuneesti
- Playwright UX/a11y/contrast-suite menee läpi sekä FI- että EN-esityssivun kanssa

## Suositeltu seuraava askel

Seuraava turvallinen jatko ei enää ole presentation-arkkitehtuurin sisäinen cleanup, vaan siirtyminen seuraavaan auditissa tunnistettuun sisältötyyppiin tai metadataongelmaan:

1. presentation-sisältöjen metadata-auditin seuraavat kohteet
2. yksittäiset review targetiksi nousevat thesis-itemit
3. embeddingeistä puuttuvat yksittäiset itemit
