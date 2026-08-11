# Publications Architecture Parity

Päiväys: 2026-08-11

## Tarkoitus

Tämä dokumentti sulkee publication-pilotin arkkitehtuurisesti ja kokoaa yhteen checkpointit P1-P4d:

1. canonical page dataset + public projection
2. FI SSR + JS-on parity
3. EN canonical migration + source priority
4. Research.fi detail HTML + Pagefind detail parity + EN legacy neutralointi

Tavoite ei ole enää avata uusia julkaisuhaaroja, vaan todeta että canonical object -> projection -malli on nyt todistettu myös julkaisuissa.

## Yhteenveto

Publication-pilotin arkkitehtuuripariteetti on nyt vihreä:

- `publicationsPage.items` on canonical publications page dataset
- FI `/julkaisut/` käyttää samaa canonical datasettiä sekä SSR:ssä että JS-hydraatiossa
- EN `/en/publications/` käyttää samaa canonical datasettiä
- Research.fi on authoritative lähde, manual publication -itemit ovat fallback-only
- deduplikointi tapahtuu ennen page projectionia
- Research.fi-julkaisuilla on omat canonical detail HTML -sivut
- Pagefind löytää detail-sivut oikein, ja normaalissa koko otsikon haussa detail on `8/8` tapauksessa sijalla `#1`
- `/en/scientific-publications/` on neutraloitu legacy-reittinä redirectillä canonical EN-julkaisusivulle

## Lopullinen arkkitehtuuri

```text
Research.fi + manual fallbacks
        ↓
source priority + dedup
        ↓
canonical publication objects
        ↓
┌──────────────────────────────┐
│ publicationsPage.items       │
│ FI /julkaisut/               │
│ EN /en/publications/         │
│ public JSON                  │
│ Research.fi detail HTML      │
│ Pagefind                     │
│ existing embeddings / H0     │
└──────────────────────────────┘
```

Tärkeä runtime-sääntö:

- manual publication item on vain viivefallback
- kun sama julkaisu ilmestyy Research.fi:hin, Research.fi korvaa sen canonical datasetissä ilman duplikaattia

Tämä fallback-käyttäytyminen on suojattu myös yksikkötesteissä:

- [tests/unit/publicationsPage.test.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/tests/unit/publicationsPage.test.js)

## 1. P1 - Canonical Page Dataset + Public Projection

Dokumentti:

- [publications-page-public-projection-audit-2026-08-11.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/docs/publications-page-public-projection-audit-2026-08-11.md)

Keskeinen lopputulos:

- julkaisut-sivulle rakennettiin oma canonical page dataset
- siitä tehtiin allowlist-pohjainen public projection `/data/publications-page.json`
- `researchfiContent.js` säilyi lähdekerroksena, eikä rinnalle luotu uutta “master truth” -JSON-mallia
- manual publication -itemit otettiin mukaan eksplisiittisen sisällöllisen päätöksen kautta

Parity-audit P1:ssä:

- `ok: true`
- `count: 59`
- `researchfi: 56`
- `manual: 3`
- `fieldDiffs = []`
- allowlist-vuotoja ei havaittu

## 2. P2 - FI SSR + JS-on Samalle Canonical Datasetille

Dokumentti:

- [publications-page-client-parity-2026-08-11.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/docs/publications-page-client-parity-2026-08-11.md)

Keskeinen lopputulos:

- [src/julkaisut.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/julkaisut.njk) käyttää nyt buildissä `publicationsPage.items`-dataa
- hydraatio käyttää `/data/publications-page.json`-projectionia
- vanha FI-epäjatkuvuus poistui: SSR ja JS-on eivät enää nojaa eri sisältöjoukkoihin

Parity-signaali:

- `sourceDatasetCount: 59`
- `hydratedCount: 59`
- `sameDatasetForSsrAndHydration: true`

Tarkoituksellinen säilytetty ero:

- SSR renderöi edelleen vain rajatun avausjoukon per luokka
- hydraatio avaa koko canonical datasetin
- tämä on hyväksytty parity, koska lähdejoukko ja luokittelu ovat samat

## 3. P3 - EN Canonical Migration + Research.fi Authoritative

Keskeinen lopputulos:

- [src/en/publications.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/publications.njk) käyttää samaa `publicationsPage.items`-datasettiä kuin FI-sivu
- Research.fi on authoritative source
- manual publication -itemit toimivat vain fallbackeina
- deduplikointi tapahtuu source layerissä ennen page projectionia
- FI ja EN perustuvat samaan canonical publication -joukkoon

Arkkitehtuurinen merkitys:

- EN-sivu ei enää kulje omaa rinnakkaista publication-putkea
- source priority + dedup on määritelty ennen page projectionia, ei clientissä eikä detail-sivulla

## 4. P4a/P4b - Research.fi Detail Pages Canonical Detail -Polusta

Parity-audit:

- [scripts/audit-publication-details-parity.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-publication-details-parity.js)

Keskeiset tiedostot:

- [src/_data/publicationDetails.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/publicationDetails.js)
- [src/_data/publicationDetailPages.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/publicationDetailPages.js)
- [src/julkaisut/researchfi-details.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/julkaisut/researchfi-details.njk)

Lopputulos:

- Research.fi-julkaisuista syntyy omat canonical detail HTML -sivut
- detail-resolveri käyttää samaa canonical publication object -kerrosta kuin page-projection
- detail-sivuja ei generoida `publicationsPage.items`-JSON:sta, vaan rinnakkaisena projectionina canonical resolverista
- manual -> Research.fi -siirtymä on ratkaistu niin, että Research.fi voittaa canonical recordina ilman duplikaattia

P4b-auditin ydinsignaali:

- canonical Research.fi unique count ja detail count täsmäävät
- jokaisella detailillä on oma canonical URL
- identifier-/title-/year-/authors-parity säilyy

## 5. P4c - Pagefind Detail Documents

Dokumentti:

- [publications-detail-pagefind-audit-2026-08-11.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/docs/publications-detail-pagefind-audit-2026-08-11.md)

Uusi audit-skripti:

- [scripts/audit-publication-pagefind.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-publication-pagefind.js)

Keskeinen lopputulos:

- Research.fi detail-sivut ovat nyt oikeita Pagefind-dokumentteja
- normaalissa koko otsikon haussa detail-sivu löytyi `8/8`
- normaalissa koko otsikon haussa detail-sivu oli `8/8` tapauksessa rank `#1`

Dokumentoitu rajoite:

- tarkka lainausmerkkihaku on edelleen aggregate-heavy
- kyse ei ole detail-sivun puuttumisesta vaan duplicated publication text -kilpailusta archive/taxonomy-sivuilla
- tästä ei tehty vielä muutosta, koska se on oma koko sivuston Pagefind quality hardening -teemansa

P4c voidaan siis sulkea vihreänä tällä säännöllä:

- `one publication = one primary result for normal publication-title searches`

## 6. P4d - EN Legacy Neutralized

Dokumentti:

- [publications-en-legacy-audit-2026-08-11.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/docs/publications-en-legacy-audit-2026-08-11.md)

Tiedosto:

- [src/en/scientific-publications.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/scientific-publications.njk)

Lopputulos:

- `/en/scientific-publications/` ei enää toimi omana publication-sivunaan
- reitti ohjaa canonical `/en/publications/`-sivulle
- sillä on `noindex, follow`
- redirect-body on rajattu `data-pagefind-ignore`-alueeksi
- legacy-EN-haara ei enää muodosta kolmatta rinnakkaista publication-mallia

## Build- ja Runtime-Signaali

Checkpointtien aikana publication-pilotin täysi Eleventy-build on valmistunut onnistuneesti useaan kertaan canonical-migraation jälkeen, viimeisimpänä:

```bash
CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --quiet
```

Tulos:

- `[11ty] Copied 266 Wrote 1285 files in 10.40 seconds (8.1ms each, v3.1.6)`

Tulkinta:

- publication-canonical-malli ei rikkonut build-polkua
- detail-sivut, EN-canonical-sivu ja legacy-redirect mahtuvat samaan build-sopimukseen

## Päätelmä

Publication-pilotti voidaan nyt merkitä arkkitehtuurisesti valmiiksi:

- canonical publicationsPage.items on käytössä
- FI ja EN nojaavat samaan canonical datasettiin
- Research.fi on authoritative source
- manual publication -itemit ovat fallback-only
- dedup tapahtuu ennen projectioneja
- Research.fi detail HTML toimii canonical detail -polulla
- Pagefind löytää detail-sivut oikein normaalissa otsikkohaussa
- EN legacy route on neutraloitu redirectillä

Julkaisut eivät siis enää tarvitse uutta arkkitehtuurikierrosta tässä pilotissa.

## Suositeltu Seuraava Sisältötyyppi

Seuraava paras canonical object -> projection -mallin kohde on:

1. opinnäytteet

Perustelu:

- aineisto on jo laaja
- siellä on jo abstract-rikastusta
- siellä on jo embedding-polku käytössä
- canonical-mallia voi testata ilman uuden infrastruktuurin rakentamista

Käytännön next step:

- tee opinnäytteille sama audit-järjestys kuin esityksissä ja julkaisuissa:
  1. nykyinen runtime-audit
  2. canonical source object
  3. allowlist public projection
  4. FI/EN/runtime parity
  5. detail/search/embedding-parity soveltuvin osin
