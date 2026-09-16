# Auditoinnin havaintoaineisto

Raportti: [FI–EN-pääsivujen vastaavuusauditointi](../../fi-en-main-pages-parity-audit-2026-09-15.md).

Paikallinen lähde: haara `fix/embedded-video-presentation-completeness-01`, HEAD `36104ff0`, 15.9.2026. Tiedostot kuvaavat tämän työkopion buildia, eivät erillistä tuotantosivuston tarkastusta.

## Tiedostot

- `pages.json`: 90 lähdetietuetta, 89:n rakennetun sivun otsikot, kieliparit, tyylit ja lomakekentät. 36 tarkastettua EN-sivua. Sanamäärä on `main`-elementin tekstin karkea välilyöntijako, ei sisällöllisen vastaavuuden pistemäärä.
- `links.json`: 89 sivun pääsisällön, navigaation ja alatunnisteen paikalliset sivu-/ankkurivirheet ja kielimerkintöjen vastavuoroisuushavainnot. Sama virheellinen valikkolinkki esiintyy usealla sivulla. Puuttuva ankkuri tarkoittaa puuttumista rakennetusta HTML:stä; tärkeä kirjoitusankkurin tapaus varmennettiin myös selaimessa.
- `browser.json`: 60 alkulatauksen mittausta (30 URL-osoitetta, leveydet 1440/390 px). `errors` koskee JavaScriptin `pageerror`-poikkeuksia, ei kaikkia verkkopyyntöjä tai konsolivaroituksia. Näistä alkulatausmittauksista ei pidä päätellä hakujen tai kaikkien painikkeiden toimivan.
- `interactions.json`: kohdennetut valikko-, haku-, media-, viitevienti- ja ankkurihavainnot. Desktop-hoverin `expanded=false` ei ole hyväksytty avaustesti; erillinen näppäimistövarmennus on `followup.json`:ssa.
- `followup.json`: julkaisuhakujen toistettu ero, valittujen rajauskenttien arvot, suora erikseen alustettu Pagefind-haku sekä työvalikkojen onnistunut näppäimistöavaus. `raw`-tulokset mitattiin erillisestä suomenkielisestä Pagefind-runtimesta, eivät käyttöliittymän alkuperäisestä instanssista.
- `build.log`, `pagefind.log`, `i18n-check.log`: rakentamisen ja olemassa olevan kielitarkistuksen tulokset. Välimuisti-/metatietovaroitukset ovat osa lähtötilaa.
- Seitsemän PNG-kuvaa: valittu visuaalinen näyttö. Kaikkia 60 kuvakaappausta ei lisätty repositorioon.

## Rakentamisen toisto

Projektin juuresta:

```sh
CACHE_ONLY=true DISABLE_OG_IMAGES=true PLAYWRIGHT_A11Y_OFFLINE=true node node_modules/@11ty/eleventy/cmd.cjs --output=/tmp/fi-en-parity-audit-site --quiet
```

Pagefind- ja kielitarkistusskriptit käyttävät työhakemiston `_site`-polkua. Auditoinnissa niitä varten oli `/tmp/fi-en-parity-check/_site`-symbolinen linkki erilliseen auditointibuildiin. Skriptit ajettiin tästä tilapäishakemistosta absoluuttisella polulla projektin skriptiin:

```sh
DISABLE_OG_IMAGES=true node /Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/run-pagefind.js
node /Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/check-i18n-seo.js
```

Selaintarkistusta varten build tarjottiin paikallisesti osoitteessa `http://127.0.0.1:4187/`. Näkymän korkeus oli 900 px. Ensimmäisessä 60 mittauksen ajossa liikkeet vähennettiin ja ulkoiset pyynnöt estettiin jsDelivr-CDN:ää lukuun ottamatta. Hakupoikkeaman viimeinen toisto tehtiin tavallisella paikallisella selainlatauksella. Se toistui myös siinä. Lomakkeita ei lähetetty.

Hakuvirheen manuaalinen toisto: avaa FI- ja EN-julkaisusivut, jätä ryhmä/laatukentät rajaamatta, kirjoita `learning`, paina Enter ja odota tulosta. Auditoinnissa FI antoi 42 tulosta ja EN tyhjän tuloksen. Katso raportista tutkimuksen rajat ja korjaustehtävä.
