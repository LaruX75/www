# Sisältömetadatan skeema

Tämä skeema erottaa sivuston sisällöissä neljä asiaa, jotka menevät helposti sekaisin: mitä sisältö on, missä roolissa se on tehty, mistä aiheesta se kertoo ja mihin tilanteeseen tai todistusaineistoon se liittyy.

Skeeman koneellinen lähde on `src/_data/contentSchema.js`. Tämä dokumentti selittää käytännön merkityksen sisällön ylläpidolle.

## Perusjako

| Kerros | Kentät | Vastaa kysymykseen | Esimerkki |
| --- | --- | --- | --- |
| Identiteetti | `title`, `description`, `date`, `canonical` | Mikä sisältö on yksittäisenä sivuna? | Otsikko, tiivistelmä, julkaisupäivä |
| Sisältötyyppi | `type`, `contentType`, `mediaType`, `source` | Mitä muotoa sisältö on? | `puhe`, `lausunto`, `esitys`, `video` |
| Rooli | `writingRoles`, `opinionRoles`, `mediaRole`, `politicalProfiles` | Missä roolissa sisältö liittyy Jariin? | `expert`, `political`, `interviewer` |
| Aiheet | `categories`, `keywords` | Mistä sisältö käsittelee? | `Koulutusteknologia`, `palveluverkko` |
| Konteksti | `contexts`, `event`, `venue`, `audience` | Missä tilanteessa sisältö syntyi tai mihin se kuuluu? | ITK 2026, luento, täydennyskoulutus |
| Todisteet ja linkitys | `sourceUrl`, `agenda_url`, `youtubeId`, `relatedItems`, `feedbackRefs` | Mihin ulkoiseen lähteeseen tai samaan kokonaisuuteen sisältö liittyy? | pöytäkirja, video, palaute |

## Pääperiaate

`categories` ja `keywords` eivät saa kertoa kaikkea. Ne ovat aihehakua varten.

Jos halutaan tietää, onko teksti poliittinen vai asiantuntijateksti, käytetään `writingRoles`- tai `opinionRoles`-kenttää.

Jos halutaan tietää, kuuluuko sisältö politiikkasivun profiilikortteihin, käytetään `politicalProfiles`-kenttää.

Jos halutaan tietää, näkyykö video mediassa, esityksissä tai yliopistotyön sivulla, käytetään `mediaRole`, `mediaType`, `contexts` ja myöhemmin `relatedItems`-kytkentöjä.

`contexts` on otettu käyttöön siirtymävaiheen kenttänä. Jos sisältötiedostossa on eksplisiittinen `contexts`-lista, sitä käytetään. Jos sitä ei ole, sivusto johtaa alustavan kontekstin turvallisista signaaleista, kuten sisältötyypistä, rooleista, kategoriasta, mediakentistä ja esityksen lähteestä. Tämä pitää nykyiset sisällöt toiminnassa, mutta uudet tärkeät sisällöt kannattaa merkitä käsin.

## Kontrolloidut arvot

### Sisältötyypit

Nykyinen sivusto käyttää vielä suomenkielistä `type`-kenttää:

| Arvo | Merkitys |
| --- | --- |
| `puhe` | Puheenvuoro, juhlapuhe tai valtuustopuhe |
| `mielipide` | Lehdessä tai julkisessa kanavassa julkaistu mielipidekirjoitus |
| `kolumni` | Kolumni tai esseemäinen oma teksti |
| `lausunto` | Lausuntopalveluun tai valmisteluun annettu asiantuntijalausunto |
| `esitys` | Diaesitys, luento- tai koulutusmateriaali |
| `tieteellinen` | Tieteellinen julkaisu tai sen sivustolle tuotu lähdesivu |
| `artikkeli` | Asiantuntija-artikkeli |
| `blogikirjoitus` | Julkaisuissa oleva blogimuotoinen teksti |

Uusi `contentType` voidaan ottaa käyttöön myöhemmin englanninkielisinä teknisinä arvoina. Sitä ei tarvitse lisätä vanhoihin tiedostoihin heti.

### Roolit

| Arvo | Käyttö |
| --- | --- |
| `political` | Sisältö liittyy poliittiseen vaikuttamiseen, vaaleihin, valtuustotyöhön tai kaupunkipolitiikkaan |
| `expert` | Sisältö liittyy asiantuntijuuteen, tutkimukseen, opetukseen, koulutusteknologiaan tai lausuntotyöhön |
| `personal` | Sisältö on henkilökohtainen, muistelullinen tai omaan elämään liittyvä |

`opinionRoles` on tarkoitettu erityisesti mielipidekirjoituksille. `writingRoles` on yleisempi kenttä kaikille kirjoituksille ja blogeille.

### Mediassa-roolit

| Arvo | Käyttö |
| --- | --- |
| `about` | Jari on jutun, haastattelun tai uutisen kohde |
| `guest` | Jari on vieraana, panelistina tai haastateltavana |
| `interviewer` | Jari toimii haastattelijana tai keskustelun vetäjänä |

### Mediassa-tyypit

Sallitut arvot ovat `article`, `podcast`, `radio`, `tv` ja `video`.

### Politiikkaprofiilit

| Arvo | Profiili |
| --- | --- |
| `sivistys` | Sivistys ja oppiminen |
| `lahipalvelut` | Koko Oulun alueellinen yhdenvertaisuus |
| `avoinhallinto` | Avoin hallinto ja tiedolla johtaminen |
| `kaupunkikehitys` | Tasapainoinen kaupunkikehitys |
| `hyvinvointi` | Lasten, nuorten ja perheiden arki |
| `yhteistyo` | Yhteistyökykyinen Oulu |

## Käytännön esimerkit

### Poliittinen mielipidekirjoitus

```yaml
type: mielipide
opinionRoles:
  - political
writingRoles:
  - political
categories:
  - Politiikka ja päätöksenteko
keywords:
  - palveluverkko
politicalProfiles:
  - sivistys
  - lahipalvelut
```

### Asiantuntijalausunto

```yaml
type: lausunto
writingRoles:
  - expert
contexts:
  - education
  - research
source: lausuntopalvelu
sourceUrl: https://www.lausuntopalvelu.fi/...
categories:
  - Koulutusteknologia
keywords:
  - tekoälylukutaito
```

### Video, joka kuuluu sekä esityksiin että mediaan

```yaml
mediaRole: interviewer
mediaType: video
contexts:
  - media
  - education
source: youtube
youtubeId: VIDEO_ID
relatedItems:
  - /esitykset/jari-larun-verkkolive/
```

Tällöin sama sisältö voidaan näyttää mediassa-sivulla, esitysten koosteessa ja työprofiilin nostoissa ilman että sivusto päättelee sitä pelkästä otsikosta tai avainsanoista.

## Auditointi

Tarkista skeeman nykytila komennolla:

```bash
npm run audit:content-schema
```

Audit erottaa kaksi asiaa:

| Taso | Merkitys |
| --- | --- |
| Virhe | Kentässä on arvo, jota skeema ei tunne |
| Varoitus | Suositeltu kenttä puuttuu, mutta sivusto voi silti toimia |

Ensimmäinen tavoite ei ole saada varoituksia nollaan. Tärkeämpää on, että uudet sisällöt eivät enää lisää uusia nimeämistapoja tai roolien sekoittumista.
