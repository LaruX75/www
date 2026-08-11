# Presentation Architecture Parity

Päiväys: 2026-08-11

Commit auditointipiste: `2b48d169f91567bbf1e1c78ba4931e06ecfa21f4`

## Tarkoitus

Tämä dokumentti kokoaa yhteen presentation-pilotin arkkitehtuuriparityn neljä päätodistetta:

1. public projection parity
2. client parity
3. detail parity
4. full build ja UX-regressio

Lisäksi dokumentti kirjaa jäljellä olevat presentation-spesifit legacy-haarat, jotta pilottia ei merkitä liian aikaisin täysin valmiiksi.

## Yhteenveto

Arkkitehtuurin kannalta pilotin ydin on nyt toteutunut:

- `/data/presentations-page.json` on canonical public projection
- `/esitykset/` käyttää canonical `items`-rakenetta
- yksittäiset presentation-detail-sivut käyttävät samaan canonical-kerrokseen nojaavaa lookupia

Täysi parity ei kuitenkaan ole vielä täysin vihreä kahdesta syystä:

- [src/en/presentations.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/presentations.njk) on edelleen erillinen legacy-haara, joka käyttää omaa `rawData`-malliaan

Checkpoint 5a on kuitenkin nyt vihreä:

- `/esitykset/`-sivun thumbnail-linkkien `link-name`-regressio on korjattu
- nykyinen Playwright UX/a11y-suite menee läpi kokonaan

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
PLAYWRIGHT_PORT=4182 PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js
```

Tulos:

- `23 passed (52.9s)`

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
- presentation-pilotin ainoa jäljellä oleva selkeä poikkeus on EN-sivun legacy-haara

## 6. Repo-Wide Legacy Audit

Erityinen auditointikohde:

- [src/en/presentations.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/presentations.njk)

Tulos:

- tiedosto käyttää edelleen omaa inline-`rawData`-mallia
- tiedostossa on edelleen eksplisiittiset `rawData`-kohdat riveillä `338`, `349` ja `709`
- sivu ei käytä canonical `/data/presentations-page.json` → `items` -polkua

Tulkinta:

- tämä on tällä hetkellä viimeinen selvästi näkyvä presentation-spesifi legacy-haara
- sitä ei pidä muuttaa automaattisesti saman parity-portin yhteydessä
- seuraava oikea kysymys on, onko kyse tarkoituksellisesta englanninkielisestä poikkeuksesta vai vain vanhasta toteutuksesta, jota ei ole vielä siirretty canonical-kerrokseen

## Päätelmä

Presentation-pilotin arkkitehtuurinen ydin voidaan pitää käytännössä onnistuneena:

- listaus käyttää canonical projectionia
- detail-sivut käyttävät samaan canonical kerrokseen nojaavaa lookupia
- public projection-, client- ja detail-parityt ovat vihreitä
- täysi Eleventy-build valmistuu onnistuneesti

Sitä ei kuitenkaan vielä pidä merkitä täysin valmiiksi ilman varausta, koska yksi asia on vielä jäljellä:

1. [src/en/presentations.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/presentations.njk)-haaran erillinen päätös: pidetäänkö se tarkoituksellisena poikkeuksena vai siirretäänkö se myöhemmin canonical-malliin

## Suositeltu seuraava askel

Seuraava turvallinen jatko ei ole uusi iso presentations-refaktori vaan pieni cleanup-vaihe:

1. korjaa `/esitykset/`-sivun thumbnail-linkkien a11y-labelit
2. aja nykyinen Playwright-suite uudelleen puhtaasti loppuun
3. tee erillinen päätös EN-sivun legacy-haarasta ennen kuin sitä kosketaan

Tämä vaihe on nyt tehty kohtien 1-2 osalta. Seuraava rajattu checkpoint on EN-sivun legacy-audit ja päätös siitä, siirtyykö se canonical-polulle vai dokumentoidaanko se tarkoituksellisena poikkeuksena.
