# Metadata Audit Framework

Päiväys: 2026-08-11

## Miksi tämä audit tarvitaan

Sivuston metadata on kasvanut useasta suunnasta yhtä aikaa:

- renderöintiä varten
- hakua ja suodatuksia varten
- knowledge graph- ja embedding-kytkentöjä varten
- lähde- ja provenance-tietoa varten
- yksittäisten sivutyyppien UI-tarpeisiin

Tästä seuraa helposti kolme ongelmaa:

- sama asia esiintyy useassa kentässä eri nimillä tai eri tarkkuudella
- sivulla näytetään kenttiä, jotka ovat hyödyllisiä koneelle mutta eivät lukijalle
- layout alkaa muistuttaa geneeristä blogi- tai artikkelipohjaa, vaikka sisältötyypillä olisi omat prioriteettinsa

Esityssivut ovat hyvä ensimmäinen audit-kohde, mutta sama runko sopii koko sivuston metadataan.

## Audit-kysymykset

Jokaisesta kentästä pitäisi pystyä vastaamaan viiteen kysymykseen:

1. Mitä käyttäjän kysymystä tämä kenttä palvelee?
2. Onko kenttä ensisijaisesti ihmiselle, koneelle vai molemmille?
3. Onko tieto uniikki, vai toistuuko sama asia jo toisessa kentässä?
4. Pitääkö kenttä näyttää aina, joskus vai ei koskaan suoraan UI:ssa?
5. Onko kenttä kontrolloitu, vai elääkö se vapaana tekstinä?

Jos kentälle ei löydy selvää käyttötarkoitusta, se kuuluu joko:

- yhdistää toiseen kenttään
- siirtää sisäiseksi rikastuskentäksi
- poistaa näkyvästä käyttöliittymästä

## Ehdotettu audit-rakenne

### 1. Kentän rooli

Jokainen metadata-kenttä merkitään yhteen päärooliin:

- `identity`
  - mikä tämä sisältö on
- `discovery`
  - miten tämä löytyy haussa, filttereissä tai arkistoissa
- `context`
  - missä tilanteessa sisältö syntyi tai mihin kokonaisuuteen se kuuluu
- `provenance`
  - mistä sisältö tulee ja mihin alkuperäiseen lähteeseen se viittaa
- `semantic`
  - koneellista rikastusta, linkitystä tai analyysiä varten
- `ui-only`
  - vain käyttöliittymää varten johdettu kenttä

### 2. Näyttötaso

Jokaiselle kentälle annetaan yksi näyttötaso:

- `primary`
  - kuuluu näkyä sivun pääsisällössä lähes aina
- `secondary`
  - hyödyllinen tukitieto, mutta ei päähuomion arvoinen
- `conditional`
  - näkyy vain tietyissä sisältötyypeissä tai jos tieto on vahva
- `internal`
  - ei kuulu suoraan näkyvään käyttöliittymään

### 3. Hallintapäätös

Jokaisesta kentästä tehdään lopuksi yksi päätös:

- `keep`
- `merge`
- `derive`
- `hide`
- `drop`

## Presentation-first audit

Esityssivuilla keskeinen ongelma ei ole vain kenttien määrä vaan se, että metadata sekoittaa kolme eri tasoa:

- mitä esitys käsittelee
- missä esitys pidettiin tai käytettiin
- mitä teknistä tai lähdekohtaista tietoa materiaalista tiedetään

### Esityssivun todennäköinen ydinmetadata

Nämä näyttävät tällä hetkellä vahvimmilta `primary`- tai `secondary`-kentiltä:

- `title`
- `description`
- `source`
- `date`
- `event`
- `audience`
- `sourceLanguage`
- `slideCount`
- `courseContexts`
- `keywords`
- `themes`

### Esityssivulla varovaisuutta vaativat kentät

Nämä ovat usein hyödyllisiä, mutta eivät automaattisesti tärkeimpiä lukijalle:

- `viewCount`
  - lähdemetriikka, ei sisällön ydin
- `thumbnail`
  - tukee orientaatiota, ei ole varsinainen metadata-arvo
- `publicUrl`, `sourceUrl`, `url`
  - provenance- ja navigaatiokerros, ei käyttäjämerkitys itsessään
- `contexts`
  - hyödyllinen arkistoinnissa, mutta helposti liian abstrakti yksittäisellä sivulla
- `teachingUnit`
  - hyvä johdettu luokittelutieto, mutta usein `internal` tai `conditional`

### Esityksissä mahdolliset yhdistämiskohteet

Nämä kannattaa tarkistaa erityisen kriittisesti:

- `description`, `summary`, `richSummary`
  - yksi näistä pitää määritellä ensisijaiseksi ihmiselle näkyväksi tiivistelmäksi
- `keywords` ja `themes`
  - jos molemmat kuvaavat aihetta, niiden työnjako pitää selkeyttää
- `event`, `audience`, `courseContexts`, `contexts`
  - nämä kaikki kertovat käyttöyhteydestä, mutta eri tarkkuuksilla
- `url`, `sourceUrl`, `publicUrl`, `pageUrl`
  - navigaatiologiikka on perusteltu, mutta kenttämerkitykset pitää dokumentoida tiukasti

### Esityssivun ehdotettu näyttöjärjestys

Jos audit johtaa UI-päätökseen, esityssivun metadata voisi jakautua näin:

- Pääsisältö:
  - otsikko, tiivistelmä, esikatselu, päätoiminto
- Tiivis tukirivi:
  - lähde, päiväys, kieli, diojen määrä
- Konteksti:
  - tapahtuma, yleisö, opintojaksokytkentä
- Aihelinkitys:
  - teemat tai avainsanat
- Sisäinen/analytiikkataso:
  - katselut, johdetut kontekstit, semantic/embedding-rikastus

## Koko sivuston metadata-audit

Tämä kannattaa laajentaa myöhemmin kaikkiin sisältötyyppeihin, mutta ei yhdellä kertaa ilman rakennetta.

### Audit-segmentit

1. Esitykset
2. Julkaisut
3. Mediassa
4. Kirjoitukset ja mielipiteet
5. Opinnäytteet
6. Politiikkaan liittyvät puheenvuorot ja asiakirjat

### Yhteiset audit-teemat

- `categories` vs `keywords`
- `contexts` vs `contentContexts`
- `event` vs `venue` vs `audience`
- roolikentät
  - `writingRoles`, `opinionRoles`, `mediaRole`, `politicalProfiles`
- provenance-kentät
  - lähde-URL:t, video-ID:t, agenda-linkit, sivuston sisäiset kytkennät
- johdetut kentät
  - mitkä kentät ovat ensisijaisesti renderöintiä varten ja mitkä sisältöä varten

## Konkreettinen audit-taulukko

Jokaisesta kentästä kannattaa täyttää ainakin nämä sarakkeet:

| Kenttä | Sisältötyypit | Rooli | Näyttötaso | Kontrolloitu | Päätös | Huomio |
| --- | --- | --- | --- | --- | --- | --- |
| `title` | kaikki | identity | primary | ei | keep | pakollinen |
| `description` | kaikki | identity | primary | ei | keep | näkyvä tiivistelmä |
| `keywords` | useat | discovery | secondary | osin | keep/merge | sekoittuu helposti teemoihin |
| `themes` | esitykset | discovery/semantic | secondary | kyllä | keep | erotettava avainsanoista |
| `courseContexts` | esitykset | context | conditional | osin | keep | korkea arvo tietyille esityksille |
| `viewCount` | slideshare | provenance | internal/conditional | kyllä | hide | ei pitäisi hallita UI:ta |

## Ehdotettu prioriteettijärjestys

### Vaihe 1

Esitysten metadata-audit.

Tavoite:

- erottaa näkyvä ydinmetadata analyysi- ja lähdemetadatasta
- päättää `description` / `summary` / `richSummary`-malli
- päättää `keywords` / `themes`-työnjako
- päättää mitkä kentät kuuluvat yksittäisen esityssivun UI:hin

### Vaihe 2

Yhteinen metadata-kenttien registry koko sivustolle.

Tavoite:

- jokaiselle kentälle yksi omistajuus ja tarkoitus
- estää uusien melkein-samojen kenttien syntyminen

### Vaihe 3

Audit-skriptin laajennus.

Nykyinen `scripts/debug-data-quality-audit.js` antaa hyvän pohjan semanttisen ja metadata-laadun tarkasteluun, mutta seuraava versio voisi raportoida myös:

- kenttien käyttöasteet sisältötyypeittäin
- päällekkäiset tai lähes päällekkäiset kentät
- kentät, jotka näkyvät UI:ssa ilman vahvaa informaatioarvoa
- kentät, joilla on korkea arvo koneellisessa linkityksessä mutta matala arvo käyttöliittymässä

## Suositus

Tämänhetkinen järkevin eteneminen on:

1. tehdä esityksille oma metadata-audit-taulukko
2. käyttää sitä pilottina koko sivuston metadata-auditiin
3. erottaa näkyvä metadata, kontekstimetadata ja sisäinen analyysimetadata toisistaan systemaattisesti

Tämä on todennäköisesti tärkeämpi pitkäjänteinen työ kuin yksittäisten korttien tai sivupalkkien hienosäätö, koska muuten UI alkaa aina uudestaan paljastaa skeeman epäselvyydet.
