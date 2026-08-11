# EN Presentations Audit

Päiväys: 2026-08-11

Tämän auditin tarkoitus on ratkaista checkpoint 5b:n päätös:

- voiko [src/en/presentations.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/presentations.njk) siirtyä canonical presentation -kerroksen varaan
- vai onko kyseessä tarkoituksellinen poikkeus, joka tarvitsee edelleen oman datamallinsa

## Yhteenveto

Johtopäätös: EN-sivu voidaan siirtää canonical-polulle.

Perustelu:

- EN-sivun nykyinen data tulee samoista lähteistä, joista canonical `items` on jo rakennettu
- EN-sivu ei näytä tarvitsevan sellaista item-tasoista kenttää, jota canonical `items` ei tarjoa
- nykyinen EN-poikkeus on ennen kaikkea vanha datan kokoamistapa, ei aidosti eri sisältömalli

Ainoa selkeä puute canonical-polun näkökulmasta on sivutason lähdemetadatan näkyvyys:

- EN-sivu näyttää tällä hetkellä AOE- ja YouTube-lähteissä `(cached)`-huomion, joka tulee raakadataobjektien `source`-kentästä
- tätä fetch/cache-tilatietoa ei tällä hetkellä ole canonical `items`-rakenteessa eikä `/data/presentations-page.json`-endpointin public projectionissa

Tämä ei kuitenkaan riitä perusteluksi jättää EN-sivua legacy-haaraksi, koska kyse ei ole item-rakenteen poikkeuksesta vaan pienestä sivutason metatiedosta.

## 1. Mitä dataa EN-sivu lukee nyt

[src/en/presentations.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/presentations.njk) käyttää tällä hetkellä kuutta datalähdettä:

1. `collections.presentations`
2. `finnaAoe.rows`
3. `canva.enRows`
4. `youtube.videos`
5. `youtube.tableRows`
6. `canvaPageUrls`-mapping, joka johdetaan `collections.presentations`-kokoelmasta

Tarkemmat kohdat:

- SlideShare-rivit kootaan `collections.presentations`-kokoelmasta riveillä `21-42`
- AOE-osio käyttää `finnaAoe.rows`-dataa riveillä `63-92`
- Canva-osio käyttää `canva.enRows`-dataa riveillä `94-147`
- YouTube-videot ja playlistit käyttävät `youtube.videos`- ja `youtube.tableRows`-dataa riveillä `208-267`
- arkistolista käyttää `collections.presentations`, `finnaAoe.rows` ja `youtube.tableRows` -dataa riveillä `270-329`

## 2. Missä rawData / source-kohtainen rakenne tulee mukaan

Legacy-rakenne tulee mukaan suoraan templaten sisäisessä client-logiikassa:

- `rawData` muodostetaan riveillä `338-344`
- Canvaan lisätään jälkikäteen `pageUrl`-mapping riveillä `346-349`
- `normalizeRows()` sisältää lähdekohtaiset haarat riveillä `433-520`
- lopullinen renderöinti käy läpi `Object.entries(rawData)` riveillä `709-723`

Tämä tarkoittaa, että EN-sivu tuntee edelleen lähdekohtaiset raakarakenteet suoraan:

- AOE odottaa kenttiä kuten `image`, `summary`, `year`
- Canva odottaa `canva.enRows`-rakennetta
- YouTube-videot odottavat `publishedAt`
- playlistit odottavat `itemCount`
- SlideShare käyttää yhdistelmää `categories`, `keywords`, `thumbnail`, `date`

Lisäksi tiedostossa on yksi selvästi legacyksi jäänyt haara:

- `normalizeRows("google")` riveillä `490-500`
- mutta `rawData` ei koskaan sisällä `google`-avainta

Tämä on dead codea, ei aktiivinen käyttötapaus.

## 3. Käyttääkö EN-sivu samaa sisältöjoukkoa kuin FI `/esitykset/`

Ei täysin, mutta se käyttää saman canonical-kerroksen alajoukkoa.

FI-sivu:

- käyttää `presentationsPage`-mallia buildissä [src/esitykset.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/esitykset.njk#L34)
- lukee varsinaisen selaindatan canonical endpointista `/data/presentations-page.json` [src/esitykset.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/esitykset.njk#L60) ja [src/js/presentations-page.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/js/presentations-page.js)
- käyttää canonical `items`-listaa, jossa on tällä hetkellä `210` itemiä

Canonical-jakauma nykyisessä buildissä:

- `slideshare`: `115`
- `canva`: `75`
- `aoe`: `9`
- `customMaterials`: `1`
- `curatedVideos`: `7`
- `videoSeries`: `3`
- `youtubeVideos`: `0`
- `youtube`: `0`

EN-sivu käyttää tästä joukosta tällä hetkellä käytännössä:

- kaikki `slideshare`-itemit
- vain `canva`-itemit, joilla `lang === "en"` (`15` kpl)
- kaikki `aoe`-itemit
- mahdolliset `youtubeVideos`- ja `youtube`-itemit, jos niitä on saatavilla

EN-sivu ei nykyisellään käytä FI-sivun mukana olevia canonical-lähteitä:

- `customMaterials`
- `curatedVideos`
- `videoSeries`
- `canva`-itemit, joilla `lang !== "en"`
- `presentationsContext` / `contexts`

Johtopäätös:

- EN-sivu ei ole sama näkymä kuin FI `/esitykset/`
- mutta sen käyttämä sisältö on canonical-mallin sisällä oleva rajattu osajoukko, ei eri sisältöjärjestelmä

## 4. Mitä EN-sivu tarvitsee, mitä canonical `items` ei vielä tarjoa

Item-tasolla canonical `items` kattaa EN-sivun tarpeet käytännössä kokonaan.

EN-sivun nykyiset tarpeet ja canonical-vastineet:

- `title` → on
- `url` → on
- `pageUrl` → on
- `thumbnail` → on
- `description` → on
- `date` → on
- `lang` → on
- `categories` / `keywords` → on
- `itemCount` → on

Puuttuva asia ei ole item-tasoinen vaan sivutason lähdemetadata:

- AOE-lähteen `(cached)`-merkintä käyttää `finnaAoe.source`-kenttää rivillä `87`
- YouTube-lähteen `(cached)`-merkintä käyttää `youtube.source`-kenttää rivillä `234`

Nykyinen public projection ei tarjoa vastaavaa `sources`- tai `fetchState`-rakennetta.

Tämän takia täysin puhdas canonical-migraatio tarvitsee joko:

1. pienen sivutason source-status-metadatan public projectioniin, tai
2. päätöksen, että `(cached)`-merkintä ei kuulu EN-sivun runtime-sopimukseen

Tämä on kuitenkin pieni ja rajattu puute. Se ei edellytä legacy `rawData` -rakenteen säilyttämistä.

## 5. Syntyykö näkyvää käyttäytymiseroa, jos EN-sivu siirretään canonical-polulle

Ei välttämättä, jos migraatio tehdään nykyistä sisältörajautusta kunnioittaen.

Visible parity säilyy, jos canonical-polulla:

- Canva rajataan edelleen vain `lang === "en"` -itemeihin
- SlideShare pysyy omana osionaan
- AOE pysyy omana osionaan
- YouTube-videot ja playlistit pidetään erillisinä sourceKey-pohjaisina listoina
- arkistolista rakennetaan edelleen EN-sivun nykyisellä logiikalla eikä FI-sivun kokonaisarkiston logiikalla

Näkyvä käyttäytymisero syntyisi vain, jos EN-sivu migroitaisiin väärällä tavalla eli vaihdettaisiin samalla myös sisältörajaukset:

- mukaan tulisivat `customMaterials`, `curatedVideos` ja `videoSeries`
- kaikki Canva-itemit voisivat tulla näkyviin kielisuodatuksen sijaan
- sivu alkaisi muistuttaa FI-sivua eikä nykyistä EN-rakennetta

Siksi oikea päätös ei ole “tee EN-sivusta FI-sivun kopio”, vaan:

- pidä EN-sivun nykyinen UI ja osiorakenne
- vaihda vain datalähde canonical `items` -kerrokseen

## 6. Onko EN-sivulla oma client-JS vai täysin Nunjucks/SSR-pohjainen logiikka

EN-sivu ei käytä erillistä sivukohtaista JS-tiedostoa kuten FI-sivu.

Havainto:

- frontmatterissa on vain `pageStyles`, ei `pageScripts`-määritystä riveillä `1-10`
- client-logiikka on inline-scriptinä riveillä `335-725`

Toteutus on siis tällä hetkellä:

- SSR/Nunjucks runko
- inline client-JS, joka normalisoi ja renderöi lähdekohtaiset taulukot selaimessa

Se ei ole puhtaasti SSR-sivu.

## 7. Päätös 5b

Päätös: migroi EN-sivu canonical-polulle.

Perustelu:

- nykyinen EN-poikkeus ei perustu erilliseen sisältömalliin
- nykyinen EN-poikkeus ei perustu erilliseen item-rakenteeseen
- canonical `items` kattaa EN-sivun nykyiset sisältötarpeet
- jäljellä oleva ero on lähinnä sivun oma osiointi ja pieni sivutason fetch/cache-metatieto

EN-sivulle ei siis jää riittävää sisällöllistä tai teknistä perustetta säilyä legacy-haarana.

## 8. Suositeltu seuraava toteutusvaihe

Seuraava pieni checkpoint voi tehdä tämän ilman UI-muutoksia:

1. rakenna EN-sivulle canonical-pohjainen lähdeadapteri `items`-listasta
2. säilytä nykyiset osiot: `aoe`, `canva (lang=en)`, `slideshare`, `youtubeVideos`, `youtube`
3. säilytä nykyinen arkistolista ja nykyiset CTA-kortit
4. poista `rawData`-objekti ja `normalizeRows()`-source-haarat
5. ratkaise erikseen source-status-metatieto `(cached)` joko projection-lisäyksenä tai hyväksyttynä pienenä poistona

Tämän jälkeen EN-sivu voidaan katsoa canonical-arkkitehtuurin piiriin kuuluvaksi eikä presentation-pilotissa jää enää näkyvää legacy-poikkeusta.
