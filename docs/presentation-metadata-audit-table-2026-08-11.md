# Presentation Metadata Audit Table

Päiväys: 2026-08-11

## Audit-pohja

Tämä audit perustuu tämänhetkiseen repossa olevaan esitysaineistoon ja sen johdettuun normalisointiin.

- paikalliset esityssivut: 139
- normalisoitu lähdeinventaario: `readLocalPresentationSources()`
- Canva-syöte: `src/_data/canva.js` palauttaa 75 korttiriviä
- tärkeimmät lähdekoodit:
  - `src/_data/presentationSources.js`
  - `src/presentations/presentations.11tydata.js`
  - `src/_utils/presentationDerivedMetadata.js`
  - `src/_data/canva.js`
  - `src/_data/slideshare.js`

## Tiivistetyt havainnot

1. Ydinmetadata on jo varsin hyvä.
   - `title`, `description`, `date`, `url` ja `pageUrl` peittävät lähes koko aineiston.

2. Kontekstimetadata on hajallaan useaan kerrokseen.
   - `event`, `audience`, `location`, `jarjestaja`, `courseContexts`, `contexts` ja `teachingUnit` kuvaavat kaikki käyttöyhteyttä, mutta eri tarkkuuksilla.

3. Aihemetadata tarvitsee työnjaon.
   - `categories`, `keywords` ja `themes` eivät vielä eroa tarpeeksi selvästi toisistaan.

4. Provenance-kenttiä on useita ja niiden tarkoitus pitäisi lukita.
   - `url`, `sourceUrl`, `publicUrl` ja `pageUrl` ovat kaikki perusteltuja, mutta niillä pitää olla tarkka omistajuus.

5. `source` kannattaa pitää tiukasti normalisoituna.
   - lähde kannattaa johtaa tunnetuista alustoista myös silloin, kun frontmatter ei sisällä eksplisiittistä arvoa
   - yleinen fallback voi olla `web`, mutta näkyvän UI-labelin ei pidä perustua sellaisenaan tähän tekniseen slugiin

## Lähdejakauma

Normalisoidussa paikallisinventaaressa lähteet jakautuvat näin:

| Lähde | Määrä |
| --- | ---: |
| `slideshare` | 115 |
| `youtube` | 2 |
| `ouka` | 1 |
| `web` | 2 |
| `canva` | 19 |

Tämä tarkoittaa käytännössä sitä, että osa audit-havainnoista on koko aineiston havaintoja ja osa selvästi SlideShare- tai Canva-polun erityispiirteitä.

## Kenttäaudit

| Kenttä | Peitto | Rooli | Näyttötaso | Päätös | Huomio |
| --- | ---: | --- | --- | --- | --- |
| `title` | 139/139 | `identity` | `primary` | `keep` | Pakollinen ydinkenttä. |
| `description` | 139/139 | `identity` | `primary` | `keep` | Yksi kanoninen näkyvä tiivistelmä. |
| `summary` | 75/75 Canva-syötteessä | `identity` | `internal` | `derive` | Lähdetason lyhyt tiivistelmä; ei oma näkyvä kenttä jos `description` jo ratkaisee saman tehtävän. |
| `richSummary` | 1/75 Canva-syötteessä | `semantic` | `conditional` | `merge` | Sisällöllisesti arvokas, mutta kuuluu samaan näkyvään summary-slotiin kuin `description`. |
| `date` | 138/139 | `identity` | `secondary` | `keep` | Hyvä badge-kenttä yksittäisellä sivulla ja listauksissa. |
| `source` | 139/139 | `provenance` | `secondary` | `keep` | Tarpeellinen, kun arvo pidetään kontrolloidussa slug-sanastossa kuten `slideshare`, `canva`, `youtube`, `ouka`, `web`. |
| `url` | 139/139 | `provenance` | `primary` | `keep` | Käyttäjän päätoiminto: avaa varsinainen esitys tai julkaistu versio. |
| `sourceUrl` | 139/139 | `provenance` | `internal` | `keep` | Tekninen lähdeosoite; ei yleensä tarvitse omaa näkyvää labelia UI:ssa. |
| `publicUrl` | vaihtelee lähteittäin | `provenance` | `internal` | `keep` | Tarpeellinen erityisesti Canva-polussa, mutta ei käyttäjämerkitykseltään eri asia kuin päälinkki. |
| `pageUrl` | 139/139 | `ui-only` | `internal` | `keep` | Sivuston oma reitti, ei varsinainen sisältömetadata. |
| `thumbnail` | 138/139 | `ui-only` | `secondary` | `keep` | Tärkeä orientaatioon, mutta ei metadatatekstinä näytettävä kenttä. |
| `slideCount` | 124/139 | `context` | `secondary` | `keep` | Toimii hyvin badge-rivissä silloin kun arvo on luotettava. |
| `sourceLanguage` | 124/139 | `context` | `secondary` | `keep` | Hyödyllinen ja kompakti näkyvä kenttä. |
| `viewCount` | 115/139 | `provenance` | `internal` | `hide` | Lähdemetriikka, ei sisällön merkitysmetadataa. |
| `categories` | 134/139 | `discovery` | `secondary` | `keep/merge` | Tarpeellinen, mutta nykykäyttö on liian leveä etenkin Canva-datassa. |
| `keywords` | 130/139 | `discovery` | `secondary` | `keep` | Sopii tarkempiin aihehakuihin ja korteille rajattuna määränä. |
| `themes` | 1/75 Canva-syötteessä | `semantic` | `conditional` | `keep` | Hyvä kontrolloitu rikastuskerros, mutta vielä liian harva näkyäkseen laajasti UI:ssa. |
| `event` | 7/139 raw-frontmatterissa | `context` | `conditional` | `keep` | Arvokas silloin kun esitys liittyy tunnistettavaan tapahtumaan. |
| `audience` | 4/139 raw-frontmatterissa | `context` | `conditional` | `keep/merge` | Mielekäs kenttä, mutta pitäisi erottaa tai yhdistää tapahtuma- ja opetuskontekstiin suunnitelmallisesti. |
| `location` | 75/75 Canva-syötteessä | `context` | `conditional` | `keep` | Hyvä tapahtumakonteksti, ei pakollinen kaikille esityksille. |
| `jarjestaja` | 75/75 Canva-syötteessä | `context` | `conditional` | `keep` | Hyödyllinen, jos halutaan näyttää missä organisaatioyhteydessä puhe pidettiin. |
| `courseContexts` | 39/139 | `context` | `conditional` | `derive` | Raaka objektirakenne on liian raskas suoraan UI:hin; siitä kannattaa johtaa kevyt näkyvä yhteenveto. |
| `contexts` | johdettu | `semantic` | `internal` | `hide` | Hyvä koneelliselle linkitykselle, mutta abstrakti sellaisenaan lukijalle. |
| `teachingUnit` | johdettu | `context` | `conditional` | `keep` | Parempi näkyvä opetusyhteenveto kuin koko `courseContexts`-objekti. |
| `categories + keywords + themes` | yhdistelmäongelma | `discovery` | `secondary` | `merge-strategy` | Näille pitää päättää selkeä työnjako eikä vain näyttää kaikkea rinnakkain. |
| `url + sourceUrl + publicUrl + pageUrl` | yhdistelmäongelma | `provenance` | `mixed` | `document` | Kentät ovat perusteltuja, mutta niiden semantiikka on dokumentoitava tarkasti. |

## Suositeltu työnjako aihemetadatalle

Nykyisessä datassa erityisesti Canva-puoli käyttää `categories`-kenttää paikoin melkein yleisenä keyword-listana. Se tekee UI:sta helposti sekavan ja vaikeuttaa myös knowledge graph -käyttöä.

Ehdotettu työnjako:

- `categories`
  - pieni kontrolloitu ylätason luokitus
  - esimerkki: `AI literacy`, `Koulutusteknologia`, `Opettajankoulutus`

- `keywords`
  - tarkemmat aihetermit, työkalut, teoriat ja käsitteet
  - esimerkki: `CSCL`, `EU AI Act`, `Think First model`

- `themes`
  - koneellisesti tai editoriaalisesti johdettu, vakaampi slug-tason semanttinen kerros
  - hyvä knowledge graphiin, suosituksiin ja ryhmittelyyn

## Suositeltu työnjako kontekstimetadataan

Ehdotettu järjestys:

- `event`
  - mikä tapahtuma tai tilaisuus
- `jarjestaja`
  - kuka järjesti
- `location`
  - missä
- `audience`
  - kenelle
- `teachingUnit`
  - mihin opetuskokonaisuuteen kytkeytyy
- `courseContexts`
  - evidenssirikas taustakerros, ei suoraan näkyvä kenttä

Tällä mallilla sama tieto ei joudu kilpailemaan samalla rivillä eri tarkkuuksilla.

## Suositeltu työnjako provenance-kenttiin

- `pageUrl`
  - sivuston oma detail-sivu
- `url`
  - käyttäjän ensisijainen ulkoinen toimintolinkki
- `publicUrl`
  - julkinen jakolinkki, jos lähde vaatii sitä erikseen
- `sourceUrl`
  - tekninen tai alkuperäinen ingest-linkki

Jos tämä lukitaan dokumentoiduksi säännöksi, kortit ja detail-sivut voidaan rakentaa ilman lähdespesifiä poikkeuslogiikkaa.

## Phase 1 -päätökset

Seuraavat päätökset näyttävät tämän auditin perusteella valmiilta:

1. `description` on esityksen ainoa näkyvä päätiivistelmä.
2. `summary` ja `richSummary` jäävät lähde- tai rikastuskerrokseen ja syöttävät `description`-kenttää.
3. `slideCount` ja `sourceLanguage` ovat hyviä näkyviä badge-kenttiä.
4. `viewCount` ei kuulu oletuksena näkyvään UI:hin.
5. `courseContexts` ei kuulu näkyä sellaisenaan; siitä johdetaan kevyt yhteenveto.
6. `source`-sanasto pitää pitää rajattuna ja URL-pohjainen fallback dokumentoituna.

## Seuraava käytännön askel

Järkevin seuraava toteutus ei ole enää pelkkä layout-hionta, vaan pieni skeemapäätös ja sitä seuraava UI-siivous:

1. yhtenäistetään `source`
2. lukitaan `categories` / `keywords` / `themes`-työnjako
3. johdetaan `courseContexts`-objektista kevyt näkyvä kenttä
4. näytetään esityssivulla vain:
   - lähde
   - päiväys
   - kieli
   - diojen määrä
   - valittu konteksti, jos se on vahva

Tämän jälkeen metadata alkaa palvella sekä lukijaa että knowledge graph -rakennetta ilman, että esityssivu muistuttaa geneeristä artikkelipohjaa.
