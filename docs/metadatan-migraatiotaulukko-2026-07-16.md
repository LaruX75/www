# Metadatan Migraatiotaulukko

Päiväys: 2026-07-16

Tämä dokumentti kokoaa puheenvuorojen, blogikirjoitusten ja mielipidekirjoitusten nykyisten kategorioiden migraation uuteen malliin.

## Tavoitemalli

### Pääteemat

- `Politiikka ja päätöksenteko`
- `Vaalit`
- `Sivistys ja koulutus`
- `Opettajankoulutus`
- `Koulutusteknologia`
- `Oppimisympäristöt ja tilat`
- `Yliopisto ja korkeakoulut`
- `Kaupunkikehitys ja palveluverkko`
- `Kulttuuri ja paikallisidentiteetti`
- `Hyvinvointi ja osallisuus`
- `Teknologia ja digitaalisuus`
- `Matkat ja henkilökohtaiset`

### Apukentät

- `publication`
- `channel`
- `forum`
- `eventType`
- `series`
- `campaign`
- `context`
- `secondaryTheme`

## Keskeiset havainnot

- Puheenvuoroista 61/77 puuttuu kategoriat ja avainsanat lähes kokonaan.
- Mielipidekirjoituksista 2:lta puuttuu kategoriat ja 4:ltä avainsanat.
- Blogikirjoituksista 5:ltä puuttuu avainsanat.
- Nykyinen `categories`-kenttä sekoittaa samaan paikkaan:
  - sisältöteeman
  - formaatin
  - julkaisukanavan
  - luottamustehtävän tai foorumin
  - sarjanimen
  - kampanjan tai vaalin

## Migraatiotaulukko

| Nykyinen arvo | Esiintymiä | Toimenpide | Uusi pääteema | Uusi kenttä | Luonne | Huomio |
|---|---:|---|---|---|---|---|
| `Poliitiikka` | 53 | korvaa | `Politiikka ja päätöksenteko` |  | automaattinen | Yhdistetään samaan kuin `politiikka` |
| `politiikka` | 19 | korvaa | `Politiikka ja päätöksenteko` |  | automaattinen | Yhdistetään samaan kuin `Poliitiikka` |
| `Kuntavaalit` | 8 | korvaa | `Vaalit` | `campaign` | automaattinen | Tarkempi vaali ja vuosi `campaign`-kenttään |
| `Aluevaaalit2022` | 4 | korvaa | `Vaalit` | `campaign: Aluevaalit 2022` | automaattinen | Kirjoitusasuvirhe korjaantuu samalla |
| `Seurakuntavaalit` | 1 | korvaa | `Vaalit` | `campaign: Seurakuntavaalit` | automaattinen |  |
| `vaalit` | 1 | korvaa | `Vaalit` | `campaign` | automaattinen |  |
| `Puheet` | 14 | poista |  | `type: puhe` | automaattinen | Formaatti ei kuulu kategoriaan |
| `Mielipidekirjoitukset` | 38 | poista |  | `type: mielipide` | automaattinen | Formaatti ei kuulu kategoriaan |
| `Kaleva` | 29 | siirrä |  | `publication: Kaleva` | automaattinen | Julkaisukanava |
| `Helsingin Sanomat` | 1 | siirrä |  | `publication: Helsingin Sanomat` | automaattinen | Julkaisukanava |
| `Facebook` | 2 | siirrä |  | `channel: Facebook` | automaattinen | Kanava |
| `Muut lehdet` | 2 | siirrä |  | `publicationType: muu lehti` | automaattinen | Julkaisuluokka |
| `Kaupunginvaltuusto` | 7 | siirrä |  | `forum: Kaupunginvaltuusto` | automaattinen | Foorumi, ei teema |
| `Kaupunginvaltuustossa pidetyt puheenvuorot` | 5 | siirrä |  | `forum: Kaupunginvaltuusto` | automaattinen | Duplikaatti edelliseen |
| `Lautakunta` | 13 | siirrä |  | `forum: Lautakunta` | automaattinen | Foorumi, ei teema |
| `Luottamustehtävät` | 2 | siirrä |  | `context: Luottamustehtävä` | automaattinen | Profiilikonteksti |
| `Lähidemokratiatoimikunta` | 1 | siirrä |  | `forum: Lähidemokratiatoimikunta` | automaattinen | Foorumi |
| `Työryhmätyö` | 1 | siirrä |  | `forum: Työryhmä` | automaattinen | Foorumi |
| `Asukasyhdistys` | 2 | siirrä |  | `forum: Asukasyhdistys` | automaattinen | Foorumi |
| `yhdistystoiminta` | 2 | siirrä tai poista |  | `context: yhdistystoiminta` | tapauskohtainen | Osa voi olla teeman sijaan konteksti |
| `Juhlapuheet` | 4 | siirrä |  | `eventType: juhlapuhe` | automaattinen | Tapahtumatyyppi |
| `Paneelit` | 1 | siirrä |  | `eventType: paneeli` | automaattinen | Tapahtumatyyppi |
| `Seminaarit` | 1 | siirrä |  | `eventType: seminaari` | automaattinen | Tapahtumatyyppi |
| `Tieteelliset tilaisuudet` | 3 | siirrä |  | `eventType: tieteellinen tilaisuus` | automaattinen | Tapahtumatyyppi |
| `Luennot` | 1 | siirrä |  | `eventType: luento` | automaattinen | Tapahtumatyyppi |
| `Larun laitenurkka` | 3 | siirrä |  | `series: Larun laitenurkka` | automaattinen | Sarjanimi |
| `Verkkolive` | 1 | siirrä |  | `series` tai `eventType` | tapauskohtainen | Riippuu käytöstä |
| `Kulttuuri` | 3 | korvaa | `Kulttuuri ja paikallisidentiteetti` |  | automaattinen | Selkeä teemakategoria |
| `Palveluverkko` | 1 | korvaa | `Kaupunkikehitys ja palveluverkko` |  | automaattinen | Selkeä teemakategoria |
| `Koulutuspolitiikka` | 1 | korvaa | `Sivistys ja koulutus` | `secondaryTheme` | tapauskohtainen | Jos fokus enemmän politiikassa, rinnalle `Politiikka ja päätöksenteko` |
| `Liikunta` | 1 | korvaa | `Hyvinvointi ja osallisuus` |  | automaattinen |  |
| `Matkailu` | 4 | korvaa | `Matkat ja henkilökohtaiset` |  | automaattinen | Blogissa toimiva |
| `Henkilökuva` | 1 | korvaa | `Matkat ja henkilökohtaiset` |  | tapauskohtainen | Voi joissain tapauksissa poistua kokonaan |
| `Yliopistokampus` | 1 | korvaa | `Yliopisto ja korkeakoulut` | `secondaryTheme: Oppimisympäristöt ja tilat` | tapauskohtainen | Kampus- ja tilakysymykset rinnalla |
| `Tutkimus` | 1 | korvaa | `Yliopisto ja korkeakoulut` |  | tapauskohtainen | Jos fokus instituutiossa, ei menetelmässä |
| `Väitöskirja` | 2 | korvaa | `Yliopisto ja korkeakoulut` | `eventType` | tapauskohtainen | Usein myös juhla-/akateeminen konteksti |
| `Teknologiatuettu oppiminen ja opetus` | 11 | korvaa | `Koulutusteknologia` | `secondaryTheme` | tapauskohtainen | Ei niputeta automaattisesti sivistykseen |
| `Koulutusteknologi` | 1 | korvaa | `Koulutusteknologia` |  | automaattinen |  |
| `Oppimisympäristöt ja tilat` | 2 | säilytä omana teemana | `Oppimisympäristöt ja tilat` | `secondaryTheme` | tapauskohtainen | Voi liittyä kouluun tai yliopistoon |
| `Avoimet oppimateriaalit ja sisällöt` | 2 | korvaa | `Opettajankoulutus` tai `Koulutusteknologia` |  | tapauskohtainen | Riippuu painotuksesta |
| `Käyttöjärjestelmät` | 1 | korvaa | `Teknologia ja digitaalisuus` | `secondaryTheme: Koulutusteknologia` | tapauskohtainen | Opetuskonteksti voi näkyä sivuteemassa |
| `pilvipalvelut ja ekosysteemit` | 1 | korvaa | `Teknologia ja digitaalisuus` | `secondaryTheme: Koulutusteknologia` | tapauskohtainen |  |
| `tietotekniikka` | 2 | korvaa | `Teknologia ja digitaalisuus` |  | automaattinen |  |
| `av-tekniikka` | 1 | korvaa | `Teknologia ja digitaalisuus` |  | automaattinen |  |
| `kamerat` | 1 | korvaa | `Teknologia ja digitaalisuus` |  | automaattinen |  |
| `www-sivustot` | 1 | korvaa | `Teknologia ja digitaalisuus` |  | automaattinen |  |
| `digiluokka` | 1 | korvaa | `Teknologia ja digitaalisuus` | `series` | tapauskohtainen | Voi olla myös sarjamerkintä |
| `opetus` | 1 | korvaa | `Sivistys ja koulutus` | `secondaryTheme` | tapauskohtainen | Jos opettajankoulutuspainotteinen, käytä sitä |
| `Larux tmi (yritys)` | 2 | poista kategoriasta |  | `context: yritys` | automaattinen | Profiilikonteksti |
| `Työ` | 1 | poista kategoriasta |  | `context` | automaattinen | Liian yleinen |
| `Oulu` | 1 | poista kategoriasta |  |  | automaattinen | Liian yleinen, jää tarvittaessa avainsanaksi |
| `Luokittelematon` | 8 | poista |  |  | automaattinen | Korvattava oikealla teemalla |
| `Uncategorized` | 2 | poista |  |  | automaattinen | Korvattava oikealla teemalla |
| `Yleinen` | 1 | poista |  |  | automaattinen | Korvattava oikealla teemalla |
| `Yleistä` | 1 | poista |  |  | automaattinen | Korvattava oikealla teemalla |
| `Muut` | 5 | poista |  |  | automaattinen | Korvattava oikealla teemalla |

## Tulkintasäännöt tapauskohtaisille ryhmille

### Oppimisympäristöt ja tilat

- Jos teksti käsittelee kampusta, tiedekuntia, korkeakoulutiloja tai yliopistoinfraa:
  - pääteema `Yliopisto ja korkeakoulut`
  - sivuteema `Oppimisympäristöt ja tilat`
- Jos teksti käsittelee kouluverkkoa, opetustiloja tai oppimisympäristöä perusopetuksen näkökulmasta:
  - pääteema `Sivistys ja koulutus` tai `Kaupunkikehitys ja palveluverkko`
  - sivuteema `Oppimisympäristöt ja tilat`

### Teknologiatuettu oppiminen ja opetus

- Jos fokus on opettamisen ja oppimisen pedagogisessa käytössä:
  - pääteema `Koulutusteknologia`
- Jos fokus on opettajien osaamisessa, kouluttamisessa tai opettajuuden kehittämisessä:
  - pääteema `Opettajankoulutus`
  - sivuteema `Koulutusteknologia`

### Avoimet oppimateriaalit ja sisällöt

- Jos painotus on opettajien osaamisessa, jakamisessa tai koulutuksessa:
  - pääteema `Opettajankoulutus`
- Jos painotus on välineissä, alustoissa tai teknisissä ratkaisuissa:
  - pääteema `Koulutusteknologia`

## Esimerkkitulkinnat

- `Kampuspohdintaa: Oulun yliopiston hallitus valitsi Kontinkankaan jatkokehitettäväksi kampusvaihtoehdoksi`
  - pääteema `Yliopisto ja korkeakoulut`
  - sivuteema `Oppimisympäristöt ja tilat`
  - lisäksi poliittinen konteksti muissa kentissä

- `Käyttöjärjestelmä varsin olematon sivuseikka`
  - pääteema `Koulutusteknologia`
  - sivuteema `Teknologia ja digitaalisuus`

- `Opettajien digihuoliin tulee vastata koulutuksella`
  - pääteema `Opettajankoulutus`
  - sivuteema `Koulutusteknologia`

- `Faktojen tarkastelua: kouluverkko ja syntyvyys`
  - pääteema `Kaupunkikehitys ja palveluverkko`
  - sivuteema `Sivistys ja koulutus`

## Suositeltu toteutusjärjestys

1. Tee automaattinen kategoriasiivous taulukon automaattisille riveille.
2. Lisää uudet apukentät frontmatteriin niihin sisältöihin, joissa ne ovat ilmeisiä.
3. Täydennä puheenvuorojen puuttuva metadata.
4. Käy tapauskohtaiset teemat läpi erityisesti seuraavista ryhmistä:
   - `Teknologiatuettu oppiminen ja opetus`
   - `Oppimisympäristöt ja tilat`
   - `Avoimet oppimateriaalit ja sisällöt`
   - `Luokittelematon` / `Uncategorized` / `Yleinen` / `Muut`

## Seuraava askel

Tämän dokumentin jälkeen seuraava järkevä vaihe on tehdä ensimmäinen varsinainen metadatamigraatio:

- ensin automaattiset muutokset
- sen jälkeen puheenvuorojen ja tapauskohtaisten koulutus-/yliopistosisältöjen käsin tarkennus

