# TECHNICAL HOWTO (local repo)

Tämä dokumentti on kehittäjille. Se kuvaa sivuston toteutuksen, ylläpidon ja julkaisuputken yksityiskohtaisesti.

## 1. Arkkitehtuuri

- SSG: Eleventy v2
- Sisältö: Markdown + Nunjucks
- Tyylit/UI: Bootstrap 5 + projektikohtaiset CSS-tiedostot
- Kielet: suomi (`/`) ja englanti (`/en/`)
- Julkaisu: GitHub Actions -> GitHub Pages

## 2. Tärkeimmät hakemistot

- `src/`:
  - kaikki julkaistava sisältö, templatet, css/js, data
- `src/_includes/`:
  - layoutit ja yhteiset komponentit (`base.njk`, `header.njk`, `page.njk`, jne.)
- `src/_data/`:
  - datamallit ja nav-rakenne (`headerNav.js`)
- `src/pages/`:
  - suomenkieliset sisältösivut
- `src/en/`:
  - englanninkieliset sivut
- `.eleventy.js`:
  - build-konfiguraatio, pluginit, suodattimet, post-process
- `.github/workflows/build.yml`:
  - CI/CD + tuotannon smoke-testit

## 3. Build- ja ajokomennot

- Kehityspalvelin:
  - `npm run start`
  - `npm run start:no-og` (suositeltu)
- Build:
  - `npm run build`
  - `npm run build:no-og` (suositeltu)
- Linkkitarkistus (verkko riippuvainen):
  - `npm run build:links`

## 4. Julkaisun kulku

1. Push `main`-haaraan
2. GitHub Actions `build`:
   - `npm ci`
   - Eleventy build
   - artefaktin upload
3. `deploy` julkaisee `_site` GitHub Pagesiin
4. `smoke` tarkistaa tuotannon:
   - statuskoodit
   - `robots.txt`
   - SEO-meta/hreflang/canonical
   - sitemap URL + `lastmod`
   - TOC-linkit presentations-sivuilla

## 5. Sivuston tärkeät toteutukset

### 5.1 Navigaatio ja breadcrumb

- Header/nav-data: `src/_data/headerNav.js`
- Header-renderöinti: `src/_includes/header.njk`
- Breadcrumb-avainmappaus: `src/_includes/base.njk`
- Breadcrumb-renderöinti: `src/_includes/breadcrumb.njk`

### 5.2 TOC (table of contents)

- Plugin: `eleventy-plugin-toc`
- Käytössä mm. `src/esitykset.njk` ja `src/en/presentations.njk`

### 5.3 AI-crawler opt-out + robots

- `src/robots.txt` sisältää AI-bottiblokit (esim. GPTBot, ClaudeBot)
- `src/_includes/base.njk`: `meta name="robots" content="index, follow, noai, noimageai"`
- Eleventy passthrough: `.eleventy.js` -> `src/robots.txt`

### 5.4 Ulkoisten iframe-upotusten suostumus

- `.eleventy.js`: ulkoisten iframejen wrapperointi buildissä
- `src/js/external-media-consent.js`: selainpuolen consent-logiikka
- `src/css/styles.css`: consent-komponentin tyylit

## 6. Sisällön lisääminen

- Uusi FI-sivu: `src/pages/*.md` tai `*.njk`
- Uusi EN-sivu: `src/en/*.md` tai `*.njk`
- Lisää `translationKey` FI/EN-sivuparille, jos sivu on kaksikielinen
- Suosi `layout: page.njk`, ellei tarvita sivukohtaista layoutia

## 7. Tyylien yhdenmukaisuus

- Käytä Bootstrap-komponentteja (`container`, `row`, `card`, `btn`, `badge`, `table`)
- Käytä olemassa olevia layoutteja (`base.njk`, `page.njk`)
- Sticky-navin vuoksi ankkuriosioissa käytetään tarvittaessa `scroll-margin-top`

## 8. Vianhaku

- Jos deployssa puuttuu tiedosto (esim. robots):
  - varmista passthrough `.eleventy.js`
- Jos ankkurihypyt peittävät otsikot:
  - lisää `scroll-margin-top` kohdeosioille
- Jos Actions ei käynnisty:
  - validoi workflow-YAML

## 9. Miksi tämä tiedosto ei mene palvelimelle

- Julkaisuartefakti rakennetaan `_site`-hakemistosta
- `_site` syntyy `src/`-sisällöstä + määritellyistä passthrough-kopioista
- Tämä tiedosto sijaitsee repojouressa (`TECHNICAL_HOWTO.md`), eikä sitä kopioida `_site`-hakemistoon

