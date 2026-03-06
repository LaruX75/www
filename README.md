# jarilaru.fi (Eleventy)

Staattinen monikielinen sivusto (FI/EN), toteutettu Eleventylla.

## GDPR ja ulkoiset upotukset (tekninen toteutus)

Sivustolla on käytössä ulkoisten upotusten suostumusmekanismi, joka estää kolmannen osapuolen iframe-sisällöt oletuksena.

### Miten toteutus toimii

1. Build-vaiheessa kaikki ulkoiset iframet kääritään consent-wrapperiin.
2. Iframe `src` siirretään attribuuttiin `data-consent-src`.
3. Varsinainen iframe pidetään piilotettuna (`hidden`), kunnes käyttäjä hyväksyy latauksen.
4. Selainpuolen skripti näyttää kaksikielisen (FI/EN) consent-UI:n:
   - `Lataa sisältö / Load content`
   - `Salli kaikki ulkoiset upotukset / Allow all external embeds`
5. Jos käyttäjä sallii kaikki upotukset, valinta tallennetaan `localStorage`en avaimella `external_media_consent`.

### Missä koodi on

- Build-transform ja HTML-käärintä:
  - `.eleventy.js`
  - funktiot: `wrapExternalIframes`, `eleventy.after`-hook
- Selainpuolen consent-logiikka:
  - `src/js/external-media-consent.js`
- Consent-UI-tyylit:
  - `src/css/styles.css` (`.external-media-consent*`)
- Skriptin lataus:
  - `src/_includes/base.njk`
- Tietosuojasivut:
  - `src/pages/tietosuojaseloste.md`
  - `src/en/privacy.md`

### localStorage-avaimet

- `theme`: käyttäjän teema (dark/light)
- `a11y-settings`: saavutettavuusasetukset
- `external_media_consent`: globaali ulkoisten upotusten suostumus

## Ylläpito-ohje

### Uuden ulkoisen palvelun lisääminen

Jos lisäät sisältöä, joka renderöityy `<iframe>`-tagiksi (esim. YouTube/Facebook/Scribd), se menee automaattisesti consent-gaten taakse.

Jos haluat palvelukohtaisen tunnisteen (provider-label), lisää hosti tunnistukseen:

- tiedosto: `.eleventy.js`
- funktio: `getProviderFromHost(hostname)`

### Jos haluat poikkeuksen (ei consent-gatea)

Vältä poikkeuksia, ellei kyse ole aidosti välttämättömästä toiminnallisuudesta.
Jos poikkeus on pakko tehdä, toteuta hosti- tai URL-ehto funktioon `shouldWrapIframeSrc(src)` tiedostossa `.eleventy.js`.

### Testaus ennen julkaisuja

1. Aja build:
   - `npm run build:no-og -- --quiet`
2. Tarkista satunnaisilta sivuilta, että:
   - upotuksen kohdalla näkyy consent-UI
   - iframe latautuu vasta klikkauksen jälkeen
   - FI/EN-tekstit näkyvät oikein
3. Varmista tietosuojasivujen sisältö:
   - `/tietosuojaseloste/`
   - `/en/privacy/`

### Muutokset lainsäädäntöön / käytäntöihin

Jos sivulle lisätään analytiikkaa tai muuta seurantaa, arvioi suostumusvaatimukset uudelleen ja päivitä:

- consent-logiikka (`src/js/external-media-consent.js`)
- tietosuojasivut (FI/EN)
- tämä README

## TODO ennen lopullista julkaisua

### Legacy-sivujen siivous (WordPress-perintö)

Legacy-sivuja ei poisteta vielä. Siivous tehdään vasta, kun sivuston rakenne ja redirectit on lukittu.

Tavoite:
- poistaa vain aidosti tarpeettomat vanhat sivut (esim. vanhat importti-/välivaihesivut)
- varmistaa, ettei SEO- tai käyttäjäpolkuja rikota

Erotteluperuste ennen poistoa:
- blogipostaukset: pääosin `src/blog/**`
- sivut: pääosin `src/pages/**` ja `src/en/**`
- lopullinen luokittelu tehdään front matterin perusteella (`layout`, `tags`/collection, `permalink`)

## Navigaatio ja breadcrumbit (Eleventy Navigation)

Sivuston yläpäänavigaatio (top-level) ja breadcrumbit käyttävät samaa avainpohjaista nav-rakennetta.

### Mistä avaimet tulevat

- Lähdedata on tiedostossa:
  - `src/_data/headerNav.js`
- Avaimet määritellään erikseen kielille:
  - `fi: [...]`
  - `en: [...]`
- Jokainen item sisältää `eleventyNavigation`-objektin, jossa käytetään mm. kenttiä:
  - `key` (uniikki tunniste)
  - `title` (näkyvä nimi)
  - `url` (polku, jos klikattava)
  - `parent` (ylätason avain breadcrumb-hierarkiaan)
  - `order` (järjestys)
  - `icon` (headerin ikoni, top-levelissä)

Nykyisiä avaimia ovat esimerkiksi:
- top-level: `home`, `me`, `work`, `politics`, `writings`, `contact`
- breadcrumb-osioita: `blog`, `publications`, `presentations`, `theses`

### Missä niitä käytetään

- Header:
  - `src/_includes/header.njk`
  - rakentaa `topNavItems` suodattimella `eleventyNavigation`
  - hakee avaimet suodattimella `navItemByKey` (`.eleventy.js`)
- Breadcrumb:
  - `src/_includes/base.njk` asettaa sivukohtaisen `breadcrumbKey`-arvon
  - `src/_includes/breadcrumb.njk` renderöi polun suodattimella `eleventyNavigationBreadcrumb(...)`

### Miten lisäät uuden osion

1. Lisää uusi nav-item `src/_data/headerNav.js` tiedostoon molemmille kielille:
   - sama `key` molempiin kieliin
   - käännösten mukainen `title` ja `url`
   - tarvittaessa `parent` (jos kuuluu breadcrumb-hierarkiaan)
2. Jos lisäät uuden top-level kohdan:
   - lisää vastaava renderöinti `src/_includes/header.njk` tiedostoon (sama tapa kuin `navWork`, `navPolitics` jne.)
3. Jos haluat breadcrumbit uudelle sisältötyypille:
   - lisää `breadcrumbKey`-mappaus `src/_includes/base.njk` tiedostoon (`page.inputPath`/`page.url` ehdot)
4. Varmista että avaimet ovat uniikkeja per kieli ja `parent` viittaa olemassa olevaan avaimeen.

### Tarkistus ennen commitia

1. Aja build:
   - `npm run build:no-og`
2. Tarkista header FI/EN:
   - top-level nimet ja linkit oikein
3. Tarkista breadcrumb FI/EN:
   - listaussivu: `Home > Osio`
   - sisältösivu: `Home > Osio > Nykyinen sivu`
