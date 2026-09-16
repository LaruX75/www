# FI–EN-pääsivujen vastaavuusauditointi

Päiväys: 15.9.2026. Tila: auditointi, ei toteutusmuutoksia.

## 1. Johtopäätös

**Englanninkieliset pääsivut eivät vielä vastaa riittävästi suomenkielisiä. Korjaustyö voidaan aloittaa tämän auditoinnin perusteella.** Erillistä laajaa arkkitehtuuriselvitystä ei tarvita.

Puutteet eivät rajoitu käännöksiin. EN sisältää tyhjiä tai huomattavasti suppeampia esittelysivuja, vanhoja sivurakenteita, puuttuvia toimintoja sekä vääriä kielenvaihto- ja navigaatiokohteita. Samalla osa sivupareista käyttää jo yhteistä toimivaa perustaa.

Tärkeimmät korjattavat kokonaisuudet:

1. Kynästä/Kirjoitukset-kieliparit, valikkolinkit ja puuttuvat ankkurit.
2. Opetusportfolio, CV, yliopistotyö ja tutkimus; Opetus-koontisivun EN-vastine.
3. Etusivu, Tietoa ja Kouluttaja: FI:n nykyinen rakenne ja sisällöt englanniksi.
4. Media-, esitys- ja julkaisusivujen toiminnallinen vastaavuus, mukaan lukien EN-julkaisuhakujen toistuva tyhjä tulos.
5. Politiikka, yhteiskunnallinen vuorovaikutus ja muut tukisivut.

## 2. Vertailuperusta ja menetelmä

- Työkopio: `jarilaru-eleventy-final-v2`.
- Haara: `fix/embedded-video-presentation-completeness-01`.
- HEAD auditoinnin alussa: `36104ff0`.
- Vertailuperusta on tämän työkopion nykyinen FI-toteutus. Julkaistun tuotantosivuston tai etärepositorion vastaavuutta tähän HEADiin ei tarkistettu.
- Työkopiossa oli aluksi yhdeksän muuttunutta API-välimuistitiedostoa sekä kolme aiempaa, seuraamatonta legacy-blog-auditointia. Niitä ei muokattu tässä työssä.
- Lähdekartoitus kattoi `src/index.njk`, juuren koontisivut, `src/fi`, `src/en` sekä opinnäytteiden FI/EN-alakoontisivut. Lisäksi tarkastettiin jaettuja malleja, sivupohjia, navigaatiodataa ja aiempia auditointeja.
- Rakennettiin erillinen sivusto hakemistoon `/tmp/fi-en-parity-audit-site`. Build: `CACHE_ONLY=true DISABLE_OG_IMAGES=true PLAYWRIGHT_A11Y_OFFLINE=true node node_modules/@11ty/eleventy/cmd.cjs --output=/tmp/fi-en-parity-audit-site --quiet`.
- Kartoituksessa oli 90 lähdetietuetta, joista 89 vastasi yksittäistä tarkastettua HTML-sivua; näistä 36 oli englanninkielisiä. Yksi kokoussivupohja tuottaa dynaamisia kokousreittejä eikä kuulu yksittäisten pääsivujen HTML-vertailuun.
- Rakennetusta HTML:stä kerättiin otsikot, sivupohjat, tyylit, kielimerkinnät, kielenvaihtolinkit, lomakekentät ja sisäiset linkit. Dynaamisesti sivutetuista opinnäytearkistoista vertailtiin ensimmäiset sivut.
- Chromium-varmennus kattoi 30 URL-osoitetta eli 15 sivuparia, leveydet 1440 ja 390 px, korkeus 900 px. Molemmista otettiin kuvakaappaukset. Valittuja kuvakaappauksia tarkastettiin silmämääräisesti.
- Lisäksi tehtiin kohdennettuja valikko-, haku-, media- ja viitevientitarkistuksia. Lomakkeita ei lähetetty.

Tämä on sisältö-, rakenne-, navigaatio- ja toiminnallisuusauditointi. Se ei ole kaikkien tekstien lausekohtainen käännöstarkistus, täydellinen saavutettavuusauditointi tai ulkoisten lähteiden faktantarkistus.

## 3. Riittävän 1:1-vastaavuuden tavoite

### Vaaditaan

- Samat keskeiset osiot ja niiden tehtävät sekä pääosin sama järjestys.
- Samat olennaiset faktat ja ajantasaiset roolit; vastaavat toimintakehotukset ja etenemisreitit.
- Sama visuaalinen rakenne, komponentit ja mobiilikäytettävyys. Englannin erilainen tekstipituus saa muuttaa rivittymistä.
- Samat käyttäjän tarvitsemat toiminnot: haku, rajaukset, selaus, lähdeviitteen vienti ja yhteydenotto siellä, missä ne ovat FI-versiossa.
- Yksiselitteinen FI–EN-sivuparitus, vastavuoroinen kielenvaihto ja oikeat `hreflang`-merkinnät.
- Englanninkielinen käyttöliittymä ja esittelytekstit. Suomenkielisen aineiston kieli ilmaistaan ymmärrettävästi.
- Yhteinen tietolähde samoille määrille, tehtäville, hankkeille ja muille toistuville faktoille.

### Sallitaan

- Blogikirjoitusten, puheiden, pöytäkirjojen, kurssimateriaalien, mediajuttujen ja julkaisujen alkuperäinen kieli.
- Alkuperäisotsikko, asianmukainen kielimerkintä ja linkki suomenkieliseen lähde- tai detail-sivuun.
- Englanninkieliselle lukijalle tarpeellinen lyhyt taustoitus esimerkiksi suomalaisesta hallinnosta tai koulutusjärjestelmästä.
- Historiallisten kampanja- ja muiden arkistosivujen jääminen suomeksi, kun EN-koonti kertoo niiden luonteen.

Kaikkien yksittäisten sisältöjen kääntämistä ei tarvita pääsivujen vastaavuuden saavuttamiseen. Kielenvaihto toisen kielen etusivulle ei kuitenkaan korvaa puuttuvaa vastinsivua pääsivulla.

## 4. Pääsivujen vertailumatriisi

Luokat: **suuri ero** = sivun sisältö tai tehtävä poikkeaa olennaisesti; **osittainen** = perusta on olemassa, mutta osioita, ilmettä tai toimintoja puuttuu; **lähellä** = kohdennettu korjaus/varmennus riittää; **puuttuu** = vastaavaa EN-koontia ei ole.

| FI → EN | Tila | Havainto ja tavoite |
| --- | --- | --- |
| `/` → `/en/` | Suuri ero | EN:ssä vanhempi hero, erilaiset toimintakehotukset ja roolilinkit, kuusi lukukorttia FI:n viiden sijaan. FI:n merkkitapahtuma-aikajana ja nykyinen kokonaisrakenne puuttuvat. FI käyttää lisäksi `home-page.css`:ää. Siirrä FI:n rakenne, sisältöpainotukset ja samat tietolähteet EN:ään. |
| `/tietoa/` → `/en/about/` | Suuri ero | FI:n uusi henkilökuva ja `about-page.css`; EN:n vanhat rooli-, matka- ja someosiot. Pidempi EN-sivu ei tarkoita parempaa vastaavuutta. Käännä FI:n nykyinen sisältö ja säilytä sen osioiden tehtävät. |
| `/tyoni-yliopistonlehtorina/` → `/en/work/` | Suuri ero | FI on oma `university-work-page.css`:ää käyttävä työprofiili. EN käyttää `hub.njk`:tä, tilastokortteja ja pitkää Generation AI -esittelyä. Opetuksen, tutkimuksen, ohjauksen, näyttöjen ja jatkopolkujen rakenne pitää tuoda samaksi. |
| `/opetus/` → puuttuu | Puuttuu | FI:n nykyiset ja aiemmat kurssitoteutukset kokoava sivu käyttää `teaching_fi_only`-avainta. EN tarvitsee oman koonnin; alkuperäiset kurssisivut voivat pysyä suomeksi kielimerkinnöin. `/en/training/` ei ole tämän sivun vastine. |
| `/portfolio/` → `/en/portfolio/` | Suuri ero | EN käyttää vanhaa `portfolio-list.njk`:tä ja `collections.portfolio`-listaa. Auditointibuildissa näkyy vain otsikko ja kuvaus, ei aineistokortteja. FI:ssä on yhdeksän pääosiota pedagogisista periaatteista arviointinäyttöön. Korvaa EN:n tyhjä listapohja FI:n varsinaisella portfoliorakenteella. |
| `/cv/` → `/en/cv/` | Suuri ero | EN:ssä nimi, neljä perustietoa ja kolme profiililinkkiä sekä ohjaus FI-CV:hen. Tutkinnot, työkokemus, kielitaito, hankkeet ja tutkimustuotokset eivät vastaa FI-sivua. FI:n CV sisältää myös päivityspäivän 1.1.2025: tietojen ajantasaisuus on tarkistettava toteutuksessa ennen niiden monistamista. |
| `/tutkimus/` → `/en/research/` | Suuri ero | EN:n varsinainen sisältö on kolme tutkimusteemakorttia. FI:ssä lisäksi nykyinen tutkimusohjelma, tutkimuslinjojen näyttöjen haku, väitös/pro gradu, hankkeet ja jatkopolut. EN ei käytä FI:n `research-page.css`:ää eikä tutkimuksen Find & Explore -osiota. |
| `/vaitoskirja/` → `/en/dissertation/` | Lähellä, linkkikorjaus | Neljä sisältöosiota vastaavat toisiaan, alkuperäisten julkaisujen kieli sopii sisältöön. Viisi paikallisen metatiedon linkkiä osoittaa olemattomiin juuripolkuihin. Ongelma on myös FI:ssä, joten korjaa yhteinen lähde/osoitteet. |
| `/julkaisut/` → `/en/publications/` | Osittainen + hakuvika | Yhteinen julkaisumalli, haku ja `publication-archive-groups.njk`. Hakusanalla `learning` FI palautti 42 tulosta ja EN nolla, vaikka indeksissä on tuloksia molemmille rajauksille. FI:n nykyinen aloitus- ja analyysirakenne poikkeaa. EN asettaa `publicationArchiveShowCitation = false`; FI käyttää arvoa `true` ja tarjoaa vientidialogin. Korjaa hakupoikkeama ja lisää sama vientitoiminto EN:ään. |
| `/opinnaytteet/` → `/en/theses/` | Lähellä | Yhteinen kanoninen aineisto, haku ja uusimpien opinnäytteiden ryhmät. Myös kolme alakoontia käyttää yhteistä `thesis-subarchive-page.njk`:tä. Säilytä tämä perusta; tarkista termit, aihelinkit ja alkuperäiskielen esittäminen. |
| `/esitykset/` → `/en/presentations/` | Suuri ero sivun rakenteessa | Yhteinen esitysarkisto on jo käytössä. FI:n hero, käyttötarkoitukseen perustuvat reitit, nostot, aiheprofiilit ja taustaosio on erotettu yhteisiksi osiksi. EN painottuu yhä lähdepalveluittaisiin AOE/Canva/SlideShare/YouTube-lohkoihin. Siirrä nykyinen FI:n koostumus EN:ään arkiston päälle. |
| `/yhteiskunnallinen-vuorovaikutus/` → `/en/societal-engagement/` | Osittainen | Sama tyylitiedosto, mutta osioiden tarkoitus ja järjestys poikkeavat. FI:ssä kanavat ja läpileikkaavat teemat; EN:ssä yleisöryhmät ja kolme esimerkkiä. Päivitä FI:n nykyisen mallin mukaan sekä korjaa lausuntolinkit. |
| `/kouluttaja/` → `/en/company/` | Suuri ero | FI:n `larux-page.css`, kohderyhmät, kolme palvelumuotoa, luottamusnäytöt, toteutusesimerkit ja uusimmat esitykset. EN:ssä vanhempi yritysesittely, tausta, esimerkit ja FAQ. Yhteinen palauteosio on hyödynnettävissä. |
| `/politiikka/` → `/en/politics/` | Suuri ero | FI esittää nykyiset tehtävät, neljä kuratoitua teemaa ja käytännön näytöt. EN ryhmittelee teemoja selaimen JavaScriptissä hakusanalistoilla ja tarjoaa vanhoja aineistonäkymiä. Tuo FI:n kuratoitu rakenne ja yhteiset aihetiedot EN:ään; säilytä alkuperäiset puheet suomeksi. |
| `/politiikka/vaalikaudet/` → `/en/election-history/` | Lähellä, linkkikorjaus | Yhteinen `election-history-page.njk` ja `electionHistory`-malli. Suomenkieliset arkistosisällöt ovat hyväksyttävä ero. Yksi linkki sisältää ylimääräisen päivämäärän slugissa ja puuttuu molempien kielten koonnista. |
| `/poliittinen-avoimuus/` → `/en/affiliations/` | Osittainen | Keskeiset tehtävä-, sidonnaisuus- ja vaalirahoitusosiot ovat olemassa. FI:n päivitetty hero, sivupaneeli ja asettelu poikkeavat EN:stä. Sisältöä ja muotoilua yhdenmukaistettava, kokonaan uutta sisältömallia ei tarvita. |
| `/kynasta/` → `/en/kynasta/` | Osittainen + väärä sivuparitus | Kolmen sisältöalueen ajatus on olemassa; EN:n valtuusto- ja asiantuntijaosuudet on korvattu FI-linkeillä. EN:n kirjoitusosion kielilupaus on ristiriidassa todellisen aineiston kanssa. Sivua ei ole kytketty päävalikon varsinaiseksi EN-koonniksi. |
| `/kirjoitukset/` → nykyinen `/en/writings/` | Suuri ero tehtävässä | FI sisältää blogin, mielipiteet ja kolumnit. EN on vanha laaja koonti, jossa on myös lausuntoja, aloitteita, puheita, julkaisuja ja materiaaleja. Rajaa sivun tehtävä FI-vastineen mukaiseksi ja parita avaimella `writings_texts`; varmista vanhojen syvälinkkien jatkuvuus. |
| `/blog/` → `/en/blog/` | Lähellä rakenteeltaan | Sama `blog-list.njk`. Englanninkielinen kehys ei tarkoita blogitekstien kääntymistä. Säilytä yhteinen listaus ja varmista näkyvä kieliviesti sekä FI/EN-koontilinkit. |
| `/mediassa/` → `/en/media/` | Suuri toiminnallinen ero | FI:ssä nostot, 14 sisältö-/rooli-/aiherajauspainiketta, pikavalinnat ja erissä selaus. EN tulostaa koko aineiston korttiruudukkona ilman näitä rajauksia. Yhteinen `mediaArchive` on käytössä, mutta sivun renderöinti ja käyttökokemus eroavat. |
| `/yhteystiedot/` → `/en/contact/` | Osittainen | Sama lomakkeen vastaanottaja ja samat keskeiset kentät. FI:ssä ankkurinavigaatio, uudempi korttiasettelu ja laajemmat yhteystiedot (esimerkiksi videokokouslinkki). EN tarvitsee saman käyttöliittymän ja tietosisällön. Lähetystä ei testattu. |
| `/palkinnot/` → `/en/awards/` | Lähellä sisällöltään | Myös vuoden 2026 ja 2025 tunnustukset löytyvät EN:stä. Ei yleistä käännöspuutetta; tarkista yhteinen esitysjärjestys ja esittelykehys. Etusivujen nostot käsitellään erikseen. |
| `/autolomat/` → `/en/road-trips/` | Osittainen | EN:ssä matkojen esittelyjä ja selkeitä “Read in Finnish” -linkkejä. FI:n haavelista ja matkailublogin osio eivät vastaa EN:n rakennetta. Yhdenmukaista koonti, jätä matkakertomukset alkuperäiskielelle. |
| `/haku/` → `/en/search/` | Lähellä rakenteeltaan | Jaettu `_search-page-config.njk`, lokalisoidut tekstit ja rajaukset. Hakutulosten alkuperäiskieli saa erota käyttöliittymästä. Koko sivuston haun relevanssia ei arvioitu uudelleen tässä auditoinnissa. |

## 5. Vahvistetut toiminta- ja navigaatiohavainnot

### P1 — Kynästä- ja Kirjoitukset-sivujen kieliparit ovat väärin

Lähteet: `src/kynasta.njk`, `src/kirjoitukset.njk`, `src/en/kynasta.njk`, `src/en/writings.njk`, `eleventy.filters.js:1333`, `src/_includes/_meta.njk:115`.

`findTranslationUrl` palauttaa ensimmäisen saman käännösavaimen ja kielen sivun. Sekä `/en/kynasta/` että `/en/writings/` käyttävät avainta `writings_index`. `/kirjoitukset/` käyttää avainta `writings_texts`, jolla ei ole EN-vastinetta.

Tuoreen buildin todellinen käyttäytyminen:

| Lähtösivu | Kielenvaihdon kohde | Ongelma |
| --- | --- | --- |
| `/kynasta/` | `/en/writings/` | Päätyy vanhaan, eri tehtävää palvelevaan koontiin. |
| `/en/kynasta/` | `/kynasta/` | Paluuvaihto EN:ään päätyy eri sivulle. |
| `/kirjoitukset/` | `/en/` | Päätyy etusivulle. |
| `/en/writings/` | `/kynasta/` | Ei palaudu kirjoitusten omaan arkistoon. |

Myös `/en/kynasta/` ilmoittaa `hreflang="en"` -vastineekseen `/en/writings/`. Tavoite: yksi FI-sivu ja yksi EN-sivu jokaista varsinaista käännösavainta kohti, oikea paritus ja vastavuoroiset linkit.

### P1 — EN-valikoissa on järjestelmällisesti vääriä kirjoitusankkureita

Lähteet: `src/_data/headerNav.js`, `src/en/index.njk`, `src/en/societal-engagement.njk`, `src/en/kynasta.njk`, `src/en/writings.njk`.

EN-valikon linkit käyttävät suomenkielisiä ankkureita, mutta kohdesivun osioiden tunnisteet ovat englanniksi:

| Nykyinen ankkuri | Kohdesivulla oleva tunniste |
| --- | --- |
| `#lausunnot` | `#statements` |
| `#aloitteet` | `#initiatives` |
| `#puheet` | `#speeches` |
| `#mielipiteet` | `#opinions` |
| `#kolumnit` | `#columns` |
| `#julkiset-puheet` | `#public-speeches` |

Lisäksi EN-Kynästä käyttää yksikkömuotoisia `#opinion`- ja `#column`-linkkejä, joita ei ole. Poliittisten mielipiteiden linkki käyttää samaa puuttuvaa `#mielipiteet`-ankkuria kyselyparametrin kanssa.

Korjaa pääreitit uuden sivujaon mukaisiksi. Säilytä vanhoille julkisille syvälinkeille tarvittaessa yhteensopivat ankkurit tai tarkoituksenmukaiset ohjaukset. Pelkkä ankkurin vaihtaminen ei ratkaise Kynästä/Kirjoitukset-sivujen eri tehtäviä.

### P1 — Portfolio on EN:ssä käytännössä tyhjä

Lähteet: `src/en/portfolio.njk`, `src/_includes/portfolio-list.njk`, `src/portfolio-index.njk`.

Auditointibuildissa EN:n pääsisältö on 18 välilyönnein erotettua sanaa, otsikko ja kuvaus; FI:ssä on noin 1 552 sanaa ja yhdeksän pääosiota. Sanamäärä on vain havaintoa havainnollistava mitta, ei käännöksen laatukriteeri. Selaimessa tyhjyys vahvistui. Korjaus tarvitsee varsinaisen esittelysisällön, ei pelkkää listan otsikoiden käännöstä.

### P1 — Käyttöliittymän kieli ja aineiston kieli sekoittuvat EN-Kynästä-sivulla

Lähteet: `src/en/kynasta.njk`, `src/en/kynasta.11tydata.js`, `src/_utils/kynastaHubPage.js:134`, `src/_includes/kynasta-hub-subsection.njk`.

Sivu kertoo kirjoitusosiossa olevan englanninkielistä sisältöä. `filterByLang` ei kuitenkaan suodata kielen mukaan, vaan palauttaa kanonisen aineiston sellaisenaan; tämä on myös funktion kommentissa dokumentoitu. Kortti ei näytä aineiston kielimerkintää. Tavoite on englanninkielinen kehys, joka kertoo rehellisesti alkuperäisten kirjoitusten olevan pääosin suomeksi. Älä suodata olemassa olevaa aineistoa tyhjäksi tai väitä sitä käännetyksi.

### P1 — EN-julkaisuhaku palauttaa tyhjää olemassa olevasta aineistosta

Toistettu tuoreella paikallisella buildilla ja sen Pagefind-indeksillä:

1. Avaa `/julkaisut/`, kirjoita `learning`, paina Enter: **42 tulosta**.
2. Avaa `/en/publications/`, sama sana ja tyhjät sisältö-/laaturajaukset: **No results found.**
3. Ero toistui myös viiden sekunnin odotuksen jälkeen.
4. Samassa selainympäristössä erikseen alustettu suomenkielinen Pagefind-runtime palautti suoralla haulla **42 tulosta sekä `Publications scope: fi` että `Publications scope: en` -rajauksella**. Indeksissä oli kummallekin rajaukselle 57 julkaisudokumenttia.

Näyttö rajaa ongelman käyttöliittymän hakupolkuun tai sen kieliruntimen alustukseen; se ei osoita puuttuvaa EN-julkaisuaineistoa. Tarkka juurisyy on vielä toteutuksessa selvitettävä. `src/js/find-explore.js:123` alustaa kieliversioita muuttamalla hetkellisesti yhteistä `document.documentElement.lang`-arvoa, ja kielten lämmitys/haku käynnistyy rinnakkain. Tämä on tutkittava kohta, ei tässä auditoinnissa vahvistettu juurisyy.

Korjaus on nostettava reittikorjausten rinnalle ensimmäiseen toteutusvaiheeseen. Eri hakusanat ja kylmä/lämmin lataus kuuluvat korjauksen regressiotarkistuksiin.

### P1/P2 — Toiminnot eivät vastaa toisiaan

- **Media:** EN:stä puuttuvat FI:n sisältötyypin, roolin ja aiheen rajaukset sekä erissä selaus. Lähteet `src/fi/mediassa.njk:168` ja `src/en/media.njk:119`.
- **Julkaisut:** viitevienti on tarkoituksella pois EN:stä (`src/en/publications.njk:169`), vaikka yhteinen arkistokomponentti osaa jo englanninkielisen “Export citation” -painikkeen. Vientidialogi ja sen tapahtumakäsittely ovat FI-sivulla. Yhtenäistä nämä osat.
- **Tutkimus:** EN:stä puuttuu FI:n aiheen mukaan rajattu tutkimusnäyttöjen haku.
- **Esitykset:** arkisto on yhteinen, mutta FI:n käyttötarkoitusreitit ja nostot puuttuvat EN:stä. Säilytä arkiston yhteinen omistajuus, muuta koontisivun rakenne.

### P2 — Puuttuvat paikalliset kohdesivut

Vahvistetut EN-sivuilta löytyvät puuttuvat kohteet:

- `/en/kynasta/` → `/en/topics/`.
- `/en/politics/` → `/en/keywords/koulutus/`, `/en/keywords/kaupunki/`, `/en/keywords/nuoret/`.
- `/en/dissertation/` → viisi juuripolkuista väitöskirjan/osajulkaisujen metatietolinkkiä. Sisällöt ovat päivämäärällisillä tai muilla nykyisillä reiteillä; esimerkiksi introduction löytyy polusta `/2012/10/04/introduction-scaffolding-learning-activities-with-collaborative-scripts-and-mobile-devices/`.
- `/en/election-history/` → `/2022/04/04/2022-04-04-palveluverkkolinjaukset-eivat-ole-vain-kylakoulukysymys/`. Nykyinen sivu on `/2022/04/04/palveluverkkolinjaukset-eivat-ole-vain-kylakoulukysymys/`.

Väitös- ja vaalihistoriasivun mainitut virheet esiintyvät myös FI:ssä: korjaa molempien yhteinen reititys. Automaattinen tarkistus huomioi sekä URI-koodatut että dekoodatut tiedostopolut, jotta koodattuja historiallisen sisällön osoitteita ei virheellisesti luokitella puuttuviksi.

### P2 — Rooli on EN-etusivulla ristiriitainen

`src/en/index.njk:119` nimeää roolilinkin “City Councillor”, mutta saman sivun myöhempi teksti ja FI-etusivu kuvaavat tehtävän 2. varavaltuutetuksi. Tämä on sivuston sisäinen ristiriita, ei tässä työssä tehty ulkoinen faktantarkistus. Käytä toteutuksessa yhteistä ajantasaista roolitietoa ja sovittua englanninkielistä nimikettä.

## 6. Navigaatio ja puuttuvat EN-koonnit

FI:n ja EN:n ylävalikkojen pääalueet ovat olemassa, mutta reitit eivät ole tasavertaisia:

- FI Työ: Opetus, Tutkimus, Yhteiskunnallinen vuorovaikutus, Täydennyskoulutus. EN Work: University Work, Research, Societal Engagement sekä erillinen yhteydenotto-CTA.
- EN:n opetuksen, opiskelijapalautteen ja koulutuspalautteen jatkopolut eivät vastaa FI:tä.
- FI Politiikka ohjaa kaupunginvaltuuston, sivistyslautakunnan ja neljän kuratoidun teeman koonteihin. EN ohjaa vanhan Writings-sivun osioihin ja vaalihistoriaan.
- FI Kynästä ohjaa kolmeen sisältökokonaisuuteen. EN:n päälinkki vie `/en/writings/`-sivulle; uusi `/en/kynasta/` jää tämän pääreitin ulkopuolelle.
- FI:n teemat/aiheprofiilit ja EN:n kategoriat/avainsanat ovat eri kehitysvaiheissa. Olematonta `/en/topics/`-linkkiä ei tule jättää näkyville.

### Puuttuvien sivujen toteutusrajaus

| Kokonaisuus | Ehdotettu riittävä EN-taso |
| --- | --- |
| Opetus | Oma käännetty koonti, samat nykyiset ja aiemmat toteutukset, FI-kurssilinkkien kielimerkintä. |
| Opiskelijapalaute ja koulutuspalaute | Englanninkieliset yhteenvedot ja vastaavat näytöt; alkuperäiset palautelainaukset voidaan säilyttää suomeksi selitteellä. |
| Kaupunginvaltuusto ja sivistyslautakunta | Englanninkielinen selitys sekä vastaavat kokousreitit/koonti yhteisestä datasta. Pöytäkirjoja ja kokousvideoita ei tarvitse kääntää. |
| Valtuustotyö ja lausunnot | EN-koonnit samoille sisältöryhmille tai selkeästi nimetty, rakenteeltaan vastaava EN-osuus. FI-alkuperäiset merkitään. |
| Poliittiset teemat ja muut aiheprofiilit | Käännetyt esittelyt ja samat kuratoidut aihepolut; alkuperäiset näytöt voivat pysyä suomeksi. |

Näiden puuttuminen on tässä vaiheessa suunnittelutieto ja toteutustehtävä. Vanhojen `fi_only`-avainten tai aiempien auditointien hyväksymät kielierot eivät automaattisesti täytä nyt asetettua tavoitetta.

## 7. Tukisivut ja hyväksyttävät erot

| Sivut | Auditoinnin arvio |
| --- | --- |
| Saavutettavuusselosteet | Otsikkorakenne ja keskeiset sisältöalueet vastaavat toisiaan. Ei sisällön oikeellisuuden tai saavutettavuusväitteiden uudelleenarviointia tässä työssä. |
| Tietosuojaselosteet | Seitsemän samaa aihealuetta. Tarkista toteutusvaiheessa termit ja yhteystiedot; ei oikeudellista auditointia tässä työssä. |
| Lisenssit | Samat sisältö-, poliittisten tekstien, koodin ja kolmannen osapuolen sisältöjen osiot. |
| Miten sivusto on rakennettu | Kuusi vastaavaa pääosiota. Nykyiset sivuparit voidaan säilyttää. |
| Sivuston muutokset | Vastaava muutoshistorian esitys. Git-viestien alkuperäinen kieli ei yksin ole käännöspuute. |
| Vuoden 2025 vaalisivu | Keskeinen kampanja- ja tulosrakenne vastaa FI:tä. Historiallinen kampanjasivu ei ole etusijalla. |
| Kategoriat ja avainsanat | EN käyttää yksinkertaisia listoja, FI sisältää myös toimitettuja aihepolkuja, ryhmittelyä ja ohjaavaa sisältöä. Yhdenmukaista aihepolkujen yhteydessä. |
| `/en/training/` | Auditointibuildissa vain otsikko ja kuvaus (21 sanaa); vanha `training-list.njk`. FI-vastine on arkistoksi merkitty vanha raakalista, ei nykyinen Opetus tai Kouluttaja. Suositus: käsittele historiallisena reittinä ja ohjaa tarkoituksen mukaan nykyisiin EN-esityksiin/kouluttajaan. Älä nimeä uudeksi Opetus-sivuksi ilman reittien tarkoituksen selvittämistä. |
| 404-sivut | Vastaava perusrakenne ja lokalisoitu teksti. |
| Opinnäytteiden kandidaatti-, maisteri- ja tarkastettujen alakoontisivut | Sama sivupohja ja vastaavat roolirajaukset. Tarkistus koski ensimmäisiä sivuja; koko sivutushistoriaa ei käyty selaimessa läpi. |

## 8. Toteutustapa ja järjestys

### Vaihe 1 — Reitit ja kielisopimus

- Lukitse `/kynasta/` ↔ `/en/kynasta/` ja `/kirjoitukset/` ↔ `/en/writings/` sivujen tehtävien mukaisesti.
- Korjaa valikkojen pääreitit, vanhat ankkurit, puuttuvat kohteet ja väärä aineiston kielilupaus.
- Selvitä ja korjaa toistettu EN-julkaisuhakujen poikkeama ennen julkaisusivun ulkoasun viimeistelyä.
- Määritä uusi Opetus-vastine sekä puuttuvien koontien URL-osoitteet. Luonteva ehdokas opetukselle on `/en/teaching/`; sitä ei ole luotu tässä auditoinnissa.
- Lisää käännösavainten yksikäsitteisyys ja kielilinkkien vastavuoroisuus tarkistuksiin. Tarkista myös ankkurit, ei pelkästään sivun olemassaoloa.

### Vaihe 2 — Akateemisen profiilin suurimmat aukot

- Portfolio ja CV, sitten yliopistotyö, Opetus ja tutkimus.
- Käytä FI:n hyväksyttyjä sisältöjä pohjana. Tarkista ristiriitaiset/päivääntyneet faktat ennen kääntämistä.
- Tuo englanninkieliset tekstit olemassa oleviin komponentteihin ja malleihin. Älä ylläpidä erillistä EN:n vanhaa listapohjaa uuden profiilin rinnalla.

### Vaihe 3 — Etusivu ja esittelysivut

- Etusivu, Tietoa, Kouluttaja, yhteystiedot.
- Vastaavat otsikot, osiot, toimintakehotukset, kuvat, tunnustukset ja muut näytöt.
- Yhteiset roolit ja luvut; aikajanan faktoille yksi tietolähde ja kielikohtaiset esitystekstit.

### Vaihe 4 — Koontien toiminnallisuus

- Media: samat rajaukset, pikavalinnat ja erissä selaus.
- Julkaisut: viitevienti ja analyysiosioiden koostumus.
- Esitykset: nykyinen hero, reitit ja nostot yhteisen arkiston ympärille.
- Kirjoitukset/lausunnot/valtuustotyö: vaiheessa 1 sovitun jaon mukainen sisältö ja jatkopolut.

### Vaihe 5 — Politiikka, vuorovaikutus ja viimeistely

- Kuratoidut poliittiset teemat, kokouskoonnit, yhteiskunnallinen vuorovaikutus ja aihepolut.
- Avoimuus, autolomat ja tukisivujen tarvittavat pienet muutokset.
- Lopullinen desktop/mobiili-, kielenvaihto- ja hakuvarmennus.

### Tekninen periaate

Kanoniset sisältötiedot pidetään yhteisinä. Sivun rakenne ja toistuva logiikka jaetaan siellä, missä sivupari oikeasti palvelee samaa tehtävää. Kielikohtaiset tekstit ja reitit erotetaan selkeästi. Nykyisiä arkisto-, viite- ja hakukomponentteja jatketaan; koko sivuston uudelleenrakennusta tai uutta rinnakkaista EN-sisältömoottoria ei tarvita.

FI-sivujen semanttisesti tarkoitukselliset erot säilytetään eri sisältöalueiden välillä. Tavoite on FI–EN-vastaavuus sivuparin sisällä, ei kaikkien sivujen muuttaminen samanlaisiksi.

## 9. Hyväksymiskriteerit toteutukselle

1. Jokaisella sovittuun pääsivujoukkoon kuuluvalla FI-sivulla on sisällöllisesti oikea EN-vastine tai erikseen dokumentoitu alkuperäisaineiston poikkeus.
2. Jokaisen sivuparin pääosiot, olennainen faktasisältö ja etenemisreitit on rastitettu matriisista molemmille kielille.
3. Portfolio, CV ja muut esittelysivut sisältävät varsinaisen esittelyn; tyhjä listaus tai linkki FI-sivuun ei riitä.
4. Kielenvaihto toimii molempiin suuntiin, `hreflang` on vastavuoroinen ja käännösavaimet ovat yksikäsitteisiä saman kielen varsinaisille sivuille.
5. Pääsisällön, desktop-valikon, mobiilivalikon ja alatunnisteen paikalliset sivu- ja ankkurilinkit toimivat.
6. Suomenkielistä aineistoa ei esitellä englanniksi käännettynä. Kielestä kerrotaan osion tai kortin yhteydessä tarpeen mukaan.
7. Molemmissa kielissä toimivat samat sovitut haut, rajaukset, viiteviennit ja selaustoiminnot. Tyhjät hakutulokset ja palautus lähtötilaan ovat lokalisoituja.
8. Tärkeimmät sivuparit tarkistetaan vähintään 390 ja 1440 px leveydellä; muutettu navigaatio myös välileveyksillä. Pelkkä vaakaylivuodon puuttuminen ei riitä ulkoasun hyväksyntään.
9. Ilman JavaScriptiä esittelytekstit, keskeiset nostot ja tavalliset jatkolinkit ovat käytettävissä.
10. Build, Pagefind-indeksointi, laajennettu kielitarkistus ja muutoksiin kohdennetut regressiotarkistukset läpäisevät.

## 10. Tarkistustulokset ja rajoitukset

- Eleventy-build onnistui: 1 494 kirjoitettua tiedostoa, 284 kopioitua tiedostoa, noin 244 sekuntia.
- Nykyinen i18n/SEO-tarkistus onnistui 1 482 HTML-tiedostolle. Se ei havainnut yllä kuvattuja semanttisesti vääriä kielipareja: olemassaolon tarkistus on tähän tavoitteeseen liian suppea.
- Pagefind-indeksointi onnistui erilliselle auditointibuildille: 1 482 HTML-dokumenttia, 223 kanonista esitystä.
- 60 selainmittausta: 30 URL-osoitetta × 2 leveyttä. Ei havaittua dokumentin vaakaylivuotoa, JavaScriptin `pageerror`-poikkeuksia tai puuttuvaa/moninkertaista pääsisällön H1-otsikkoa näissä mittauksissa.
- Erillinen sisäisten linkkien tarkistus kattoi 89 HTML-sivua. EN-sivujen linkeissä oli yhteensä **10 yksilöllistä puuttuvaa paikallista sivukohdetta** ja **9 erilaista puuttuvaan ankkuriin viittaavaa URL-muotoa**. Valikkojen toistuvat linkit eivät kasvata näitä yksilöllisten osoitteiden lukuja.
- Kuvakaappausten tarkastelu vahvisti etusivujen ja tutkimussivujen rakenteellisen eron sekä EN-portfolion tyhjyyden. Valittujen kuvien näyttäminen ei ole koko sivuston täydellinen visuaalinen läpikäynti.
- Selainajoissa ulkoiset pyynnöt estettiin lukuun ottamatta sivuston käyttämää jsDelivr-CDN:ää. Ulkoisten kuvien, upotusten tai palvelujen toimivuutta ei hyväksytty tämän testin perusteella.
- Build käytti paikallisia välimuisteja. Se raportoi ennestään puuttuvia tutkimusohjelman julkaisukytkentöjä ja tietograafin hankenodeja. Niitä ei käsitelty kieliversiovikoina eikä korjattu tässä auditoinnissa.
- Lomakkeiden lähetys, kaikki hakusanat/suodatusyhdistelmät, ulkoisten sivujen saatavuus ja tuotantojulkaisu jäivät tarkoituksella tämän auditoinnin ulkopuolelle.

Koneelliset havainnot, toiminnallisten tarkistusten tulokset ja valitut kuvakaappaukset tallennetaan raportin yhteyteen hakemistoon `docs/data/fi-en-main-pages-audit-2026-09-15/`.

### Kohdennetut toimintotarkistukset

| Tarkistus | FI | EN | Tulkinta |
| --- | --- | --- | --- |
| Työ-valikon avaus näppäimistöllä | Aukeaa, `aria-expanded=true` | Aukeaa, `aria-expanded=true` | Sisältö ja reitit eroavat, avaus toimii. |
| Mobiilivalikon avaus | Aukeaa | Aukeaa | Rakenteen vertailu ei paljastanut avauksen estettä. |
| Julkaisuhaku `learning` | 42 tulosta | Ei tuloksia | Vahvistettu korjattava poikkeama. |
| Opinnäytehaku `learning` | 25 tulosta | 25 tulosta | Tämän haun vastaavuus toteutuu. |
| Kirjoitushaku `learning` | 4 tulosta | 6 tulosta | Sivujen nykyinen sisältörajaus eroaa; ei yksin hakumoottorivika. |
| Media, podcast-rajaus | 14 rajauspainiketta; podcastit 4 osumaa | 0 rajauspainiketta | Toiminto puuttuu EN:stä. |
| Julkaisujen viitevienti ennen hakua | 57 vientipainiketta ja dialogi | 0 painiketta, ei dialogia | Toiminto puuttuu EN:stä. Viennin tiedostotallennusta ei testattu. |
| `/en/writings/#lausunnot` | — | Tunnistetta ei ole myöskään JS:n käynnistyttyä; `statements` löytyy | Väärä syvälinkki vahvistettu myös selaimessa. |

Tallennetussa ensimmäisessä toimintolokissa desktop-hover ei muuttanut `aria-expanded`-arvoa. Varsinainen painikkeen näppäimistöavaus tarkistettiin erikseen ja onnistui kummallakin kielellä (`followup.json`). Hover-havaintoa ei luokitella tässä navigaatioviaksi.

### Visuaalinen näyttö

- Etusivu, työpöytä: [FI](data/fi-en-main-pages-audit-2026-09-15/home-fi-desktop.png) / [EN](data/fi-en-main-pages-audit-2026-09-15/home-en-desktop.png).
- Etusivu, mobiili: [FI](data/fi-en-main-pages-audit-2026-09-15/home-fi-mobile.png) / [EN](data/fi-en-main-pages-audit-2026-09-15/home-en-mobile.png).
- Tutkimus, työpöytä: [FI](data/fi-en-main-pages-audit-2026-09-15/research-fi-desktop.png) / [EN](data/fi-en-main-pages-audit-2026-09-15/research-en-desktop.png).
- [EN-portfolion nykyinen tyhjä sisältö](data/fi-en-main-pages-audit-2026-09-15/portfolio-en-desktop.png).

## 11. Päätös

**Auditoinnista voidaan siirtyä toteutukseen.** Ensin korjataan reititys ja sisältöjen kielikäytäntö, sitten suurimmat esittelysivujen aukot ja yhteisten koontien puuttuvat toiminnot. Tämän raportin matriisi toimii toteutuksen työlistana ja hyväksymisen pohjana.
