# Presentations Page Public Projection Audit

Päiväys: 2026-08-11

## Tarkoitus

`/data/presentations-page.json` muutetaan canonical public projectioniksi ilman uutta rinnakkaista endpointia.

Checkpoint 1:n linja oli:

- canonical public projection julkaistaan `items`-tauluna
- nykyinen `rawData` säilyy client-parityn vuoksi, mutta se muodostetaan canonical itemeistä
- `rawData` ei enää saa olla heterogeenisten build-lähteiden suora vuoto

Checkpoint 3:n jälkeen:

- `/data/presentations-page.json` ei enää julkaise `rawData`-kenttää
- `/esitykset/` toimii suoraan canonical `items`-projectionin varassa
- legacy grouped projection jää vain auditointiin, ei runtime-sopimukseen

## Clientin nykyisin käyttämät kentät

Lähdekohtainen auditointi tiedostosta [presentations-page.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/js/presentations-page.js):

- `aoe`: `title`, `url`, `image`, `summary`, `year`
- `canva`: `id`, `title`, `url`, `pageUrl`, `thumbnail`, `description`, `categories`, `lang`, `sourceLanguage`, `slideCount`, `date`, `jarjestaja`, `kategoria`, `paakortti`, `paareitti`, `asiantuntijaprofiili`, `sivuyhteys`, `courseContexts`
- `slideshare`: `title`, `url`, `pageUrl`, `thumbnail`, `description`, `categories`, `keywords`, `date`, `courseContexts`, `sourceLanguage`, `slideCount`
- `curatedVideos`: `title`, `url`, `pageUrl`, `externalUrl`, `thumbnail`, `description`, `badgeText`, `date`
- `videoSeries`: `title`, `url`, `pageUrl`, `externalUrl`, `thumbnail`, `description`, `badgeText`, `date`, `itemCount`
- `youtubeVideos`: `title`, `url`, `thumbnail`, `description`, `publishedAt`
- `youtube`: `title`, `url`, `thumbnail`, `description`, `publishedAt`, `itemCount`

## Projectionista tarkoituksella pudotetut kentät

Kentät, joita nykyinen client ei enää käytä ja joita ei enää haluta vuotaa public endpointtiin:

- Canva: `summary`
- Canva: `richSummary`
- Canva: `themes`
- Canva: `location`
- Canva: `folder`
- SlideShare: `viewCount`
- kaikki muut build-only tai rikastusvaiheen sisäiset kentät, joita allowlist ei nimeä

## Allowlist-rakenne

Allowlist on määritelty datakerroksessa tiedostossa [presentationsPage.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/presentationsPage.js):

- `PUBLIC_PRESENTATION_FIELDS`
- `PUBLIC_PRESENTATION_LEGACY_FIELDS`

Näiden avulla erotetaan:

- canonical public itemit
- nykyisen clientin tarvitsema lähdekohtainen grouped compatibility projection

## Parity-tarkistus

Parity tarkistetaan skriptillä:

- [audit-presentations-page-projection.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-presentations-page-projection.js)

Skripti vertaa vanhaa ja uutta rakennetta vähintään seuraavilla tasoilla:

- objektimäärät
- lähdetyypit
- otsikot
- URL:t
- `date` / `year`
- `sourceLanguage` / `lang`
- `categories` / `keywords`
- kaikki clientin nykyisin käyttämät kentät
- allowlistin ulkopuolisten kenttien vuodot

Client-parity tarkistetaan lisäksi skriptillä:

- [audit-presentations-page-client-parity.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-presentations-page-client-parity.js)

Se varmistaa, että canonical `items`-polku tuottaa saman render-lähtödatan kuin vanha legacy-lähdedata bucket-, archive- ja filter-tasolla.

## Checkpoint 4

Yksittäiset esityssivut käyttivät aiemmin omaa rinnakkaista lookupia tiedostosta [presentationSources.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/presentationSources.js), vaikka listaussivu oli jo siirretty canonical `items`-polulle.

Checkpoint 4:n jälkeen:

- detailisivujen lookup muodostetaan datakerroksen kautta funktiolla `buildCanonicalPresentationPageLookup`
- lookup rakentuu `buildPresentationsPageSourceData` + `buildCanonicalPresentationItems` -ketjun päälle
- detailisivu saa edelleen tarvitsemansa page-kohtaiset kentät kuten `publicUrl`, `sourceUrl` ja `viewCount`
- UI ei muutu, mutta listaus- ja detailisivun metadata tulevat nyt samasta canonical-rungosta

## Pagefind-polku

Pagefind ei käytä erillistä presentation-JSON-endpointia.

Se indeksoi buildatun HTML:n skriptistä [run-pagefind.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/run-pagefind.js), joten tässä auditissa olennaista on:

- millä datalla yksittäinen esityssivu renderöidään
- että detailisivun sisältö ja metadata eivät enää tule erillisestä heterogeenisestä rinnakkaisrakenteesta

Siksi checkpoint 4 ei vaadi Pagefind-koodin muutosta. Riittää, että yksittäinen esityssivu renderöityy canonical-pohjaisesta lookupista.

## Detail-parity

Detailisivun parity tarkistetaan skriptillä:

- [audit-presentation-detail-parity.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-presentation-detail-parity.js)

Skripti vertaa vanhaa `readLocalPresentationSources()`-pohjaista page-recordia uuteen canonical lookup -pohjaiseen recordiin vähintään kentissä:

- `pageUrl`
- `title`
- `description`
- `categories`
- `keywords`
- `source`
- `url`
- `sourceUrl`
- `publicUrl`
- `thumbnail`
- `date`
- `sourceLanguage`
- `slideCount`
- `viewCount`
- `courseContexts`
