---
title: Kurkistus sivustoni tekniikkaan
date: 2021-01-04
description: "Tämä sivusto on toteutettu palvelinhotellipohjaisella wordpress.org -järjestelmällä. Jos et ole ennestää tuttu teknistä ylläpitoa vaativan wordpress-alustan kanssa suosittelen sinulle yksinkertaisempaa wordpres"
categories:
  - Larux tmi (yritys)
  - www-sivustot
keywords:
  - how-to
  - laajennukset
  - laajennus
  - ohje
  - plugin
  - sivusto
  - teemat
  - tutoriaali
  - wordpress
wp_id: 508
source_url: "https://www.jarilaru.fi/kurkistus-sivustoni-tekniikkaan/"
templateEngineOverride: md
---

Tämä sivusto on toteutettu palvelinhotellipohjaisella wordpress.org -järjestelmällä. Jos et ole ennestään tuttu teknistä ylläpitoa vaativan wordpress-alustan kanssa suosittelen sinulle yksinkertaisempaa wordpress.com -pilvipalvelua. Nykyään sekin on todella monipuolinen työkalu, vaikka monet hienommista ominaisuuksista erikseen maksavatkin.

Itse pidän Wordpressistä, koska se on suunniteltu siten, että sen taustajärjestelmä on suunniteltu hyvin. Eli se on intuitiivinen työkalu sisältöä tuottaville toimijoille, jotka eivät välttämättä toimi itse kuitenkaan sivuston ylläpitäjinä.

Myös ylläpitäjän näkökulmasta Wordpress on kiitollinen, koska varsinaista ohjelmointiosaamista ei tarvita. Käytännössä sinun tulee ymmärtää wordpress.org alustan, teeman ja laajennusten väliset erot ja suhteet sekä osata käyttää Gutenberg editoria, joka onkin melkoinen parannus aiempiin editoreihin.

Käytännössä si ä voit nykyään muokata sivuston ulkoasua tekstiä kirjoittaessasi, tai pitäisikö pikemmin todeta, että taittaessasi. Sillä nykyään Wordpressillä tosiaan taitetaan "lennosta" sisällöt paikalleen ja se on varsin palkitseva tapa tehdä sisältöjä!

[Katso video](https://www.youtube.com/watch?v=Z1ND4HeGj3oMitä eroa on Wordpress.org ja Wordpress.com alustoilla?)

### Jos sinulla ei ole wordpress.org sivustoa vielä asennettuna, aloita täältä

Jos päätät, että asennat wordpress.org palvelun www-hotelliin, ole hyvä ja aloita täältä: [https://fi.wordpress.org/support/topic/wp-asennus-helppoko/](https://fi.wordpress.org/support/topic/wp-asennus-helppoko/)

Seuraavaksi oletan, että sinulla on peruswordpress käynnissä tai jo oleva sivusto toiminnassa ja olet kiinnostut millainen teema ja millaiset pluginit minulla on tällä kertaa asennettuina ja käytössä?

### Seuraavaksi pieni yllätys! Nimittäin käytän Wordpressin vakioteemaa

Yleensä en ole pitänyt sivustoista, jotka syntyvät Wordpressin vakioteemalla eli sivupohjalla. Nyt vuoden 2020-2021 taitteessa olen joutunut syömään periaatteeni, koska sivun ulkoasua voi säätää niin kovin paljon myös Gutenberg editoriossa, eli sivua taittaessa. Minä olen siis jättänyt käyttöön vakiosivupohjan, joka o
[Twenty Twenty](https://fi.wordpress.org/themes/twentytwenty/).

Twenty Twenty on varsin minimalistinen sivupohja, mutta niinpäs se Veikko Mynttinen aikoinaan totesikin tietojenkäsittelytieteen digitaalisen median suuntautumisvaihtoehdon harjoitusryhmässä että "less is more"

Aikoinaan minulle oli tärkeätä se, että tekstin ympärillä oli paljon erilaisia vimpaimia sivun vasemmassa ja oikeassa reunassa. Onhan se vähän järkyttävää, että nyt noita pieniä kategorialistauksia, kirjoittajan kuvauksia ym. ei voi laittaa kuin sivun alaosaan. Eli ainoa vimpainalue twenty twentyssä on sivun alaosassa. Ehkä keski-ikäisyys on paljastanut minussa minimalistin, ehkä ei, mutta yllättävän hyvin olen pärjännyt tämän valintani kanssa.

[Katso video](https://www.youtube.com/watch?v=ZAuxNF8lifg)

#### Halusin kuitenkin pikkuisen enemmän säätää sen ulkoasua..Twentig!

Vaikka minimalismi on tiettyyn rajaan saakka mukavaa, totesin varsin pian, että olisipas mukava säätää twenty twentyn värejä, eri elementtien kokoa jne. Siitäpäs tuli vastaan tarve ensimmäiselle varsinaiselle laajennukselle. Pienellä googlailulla löysin ilmaise
[twentig -laajennukse](https://twentig.com/), jonka avulla pystyin säätämään sivupohjaan liittyviä asetuksia yllättävänkin runsaasti. Sain säädettyä värit kohdalleen, asetettua uudenlaisia visuaalisia asetuksia blogi- ja sivu äkymille sekä Gutenberg editoriin sain lisälohkoja sivujen taittoa varten.

### Äh, eikös Gutenbergin kategoria-vimpain anna määrätä kategoriaa? Eli sivujen taittoon liittyvää hienosäätöä!

Sivustoni layout on jossain määrin monimutkainen, sillä sen täytyy olla yhtäaikaisesti portfolio akateemiselle työlleni, yritykseni sivu ja vieläpä kunnallispoliitikkaan liittyvä sivusto. Olikin selvää, että haluan hyödyntää sivuillani Wordpressin kohtalaisen hyvin toteutettua avainsana- ja luokittelutyökalua.

Eli sama suomeksi: haluan tehdä Worpdressin työkaluilla sivuja, joiden yläosassa on esimerkiksi minun henkilöesittely ja alaosassa listattuna artikkeleita haluamani luokittelun perusteella. Tällainen oli ihan arkea aikoinaan, kun tein Drupalilla pari sivustoa. Samoin odotin sen toimivan toki Wordpressissä, jota olen käyttänyt lukuisissa eri projekteissa tätä ennen. Kauhukseni huomasin, että muutoin monipuolinen Gutenberg-editori ei siihen kyennyt venymään!

#### Kuinka tehdä erilaisia listauksia artikkeleista ja muista sisällöistä sivuille?

##### Haaste 1: Kuinka Tehdä artikkeleista luokiteltu listaus yhdelle sivulle luokittain?

Koska olen kirjoittanut erittäin paljon mielipidekirjoituksia, kolumneja, puheenvuoroja jne. halusin ne listata yhdellä ja ainoalla sivulla käyttäen sopivia väliotsikoita. Hieman keskeneräisen lopputuloksen voitte katsoa täältä: [Jari Larun puheita ja kirjoituksia](https://www.jarilaru.fi/jari-larun-puheita-ja-kirjoituksia/)

Wordpressin normaali "blogi äkymä" ei riittänyt niiden jäsentelyyn sopivalla tavalla. Sehän vain listaa kirjoitukset allekkain. Toki olisin voinut tehdä sivun yläosan valikkoon soveltuvan luokittelun, mutta visuaalisena ihmisenä en ollut siihen tyytyväinen. Sen sijaan etsin soveltuvaa laajennusta, jonka avulla voisin tehdä soveltuvat näkyvät alaotsikoiden alle (esim. mielipidekirjoitukset).

Huomasin varsin nopeasti, että toimivat ratkaisut olivat maksullisia. Ensimmäinen vaihtoehto eli [Archive-Pro-Matic](https://plugins.twinpictures.de/premium-plugins/archive-pro-matic/) oli edullisempi, mutta ei tarjonnut riittävän mukavia mahdollisuuksia virittää näkyville tulevia sisältöjä. Toinen laajennus eli [Posts Table Pro](https://barn2.co.uk/wordpress-plugins/posts-table-pro/) mainosti olevansa "paras mahdollinen ratkaisu", mutta ensikokeilujen perusteella matkapuhelimen näytöllä sisältöä oli liikaa. Pienen tutkiskelun perusteella paljastui, että mobiili äkymää voi säätää erikseen ja sekin ongelma poistui.

Posts Table Pro:n avulla sain siis tehtyä tuon puheita ja kirjoituksia sivun taulukko äkymän, johon olen alustavasti varsin tyytyväinen! Varjopuolena oli se, että laajennuksen hintataso on siellä 70 dollarin tienoilla.

[Katso video](https://www.youtube.com/watch?v=-C6BYofMSLw)

##### HAASTE2: Kuinka liittää relevantteja artikkeleita osaksi sivun rakennetta?

Tämä toinen haaste oli samankaltainen kuin edellinen, mutta tässä tapauksessa tavoitteena oli saada listattua sopivat artikkelit esimerkiksi henkilökohtaisen esittelyn jatkeeksi. Nyt kyse ei siis ole samanlaisesta tarpeesta kuin "puheita ja kirjoituksia sivustolla".  Päinvastoin, tarkoituksena on tehdä esittelysivuja on kyse sitten työstä, yritystoiminnasta tai politiikasta ja kytkeä soveltuvat artikkelit luontevasti esittelyn perään.

Tämän toteuttaminen on vielä käytännössä pikkaisen kesken, mutta [esittelysivuni alaosassa](https://www.jarilaru.fi/tietoja/) pyörii "teknologiatuettu oppiminen" luokkaan kytkettyjä artikkeleita karuselli äkymässä. Siitä saa vähän suuntaa :)

No, miten tämä käytännössä tehtiin? Pienen googlauksen jälkeen ratkaisu osoittautui kohtalaisen helpoksi! Nimittäin "[ultimate addons for Gutenberg](https://www.ultimategutenberg.com/)" laajennus toi mukanaan paitsi kaipaamani toiminnallisuuden, niin myös hurjan määrän muita hyödyllisiä lohkoja osaksi Gutenberg editoria. Esimerkkejä hyödyllisistä lohkoista ovat varoitusboksit (katso täältä: [Jari Larun puheita ja kirjoituksia](https://www.jarilaru.fi/jari-larun-puheita-ja-kirjoituksia/)) ja sisällysluettelo-lohko, jollainen löytyy mm. tääältä: [Larux tmi](https://www.jarilaru.fi/larux-tmi/)

[Katso video](https://www.youtube.com/watch?v=H4UVrqAUFVQ)

##### Haaste 3: Kuinka saan tehtyä automaattisen luettelon tekemistäni tieteellisistä julkaisuista?

Yksi käyttötarkoitus näille sivuilleni on se, että ne toimivat myös akateemisena portfoliona (sen laatiminen on toki vasta alkuvaiheessa eli kesken). Anyway, 2020-luvulla ei tietenkään kannata päivittää julkaisuluetteloa käsin niiltä osin, kuin julkaisut ovat kirjankappaleita, artikkeleita tai muita virallisia julkaisuja. Erilaiset esitelmät, konferenssiesitykset sun muut aion lisätä kuitenkin käsin tänne.

Jo aiemmilla, sittemmin manan majoille siirtyneillä sivuillani olen integroinut Mendeley-viitteidenhallintajärjestelmän sivustolleni. En kuitenkaan ole jostain syystä ylläpitänyt Mendeley-tietokantaa sitten väittelyn, joten se ei tullut kysymykseen. Sen sijaan olen nykyään pitänyt luetteloa julkaisuistani ilmaisessa Zoterossa ja ResearchGate-palvelussa. No, ResearchGatelle ei löytynyt laajennusta, mutta Zoterolleppas löytyi ja millainen löytyikään! Sen avulla nimittäin voi tehdä myös sisäisiä viittauksia wordpress julkaisuissa ja koostaa niistä julkaisun yhteyteen lähdeluettelon. Siis ihan samanlainen käyttökokemus kuin vaikkapa Wordissä olevilla Mendeley/Zotero/Refworks jne laajennuksilla.

No, mikäs se tällainen ihmelaajennus sitten oikein onkaan? No, [Zotpress](https://katieseaborn.com/work/zotpress/)! Zotpress integroi sinun Zotero-tietokannan ja Wordpressin yhteen ja tarjoaa periaatteessa hienot työkalut. En vain ole saanut tätä vielä täydellisesti toimimaan, koska ei ole ollut aikaa tutkia miksi tiettyjä kummallisuuksia on. Esimerkiksi värkki listaa [Jari Larun puheita ja kirjoituksia](https://www.jarilaru.fi/jari-larun-puheita-ja-kirjoituksia/) sivuille kaikki tietokannassa olevat julkaisut, eikä vain omiani. No, pientä laittoa.

Anyway, toimivan oloinen työkalu.

### Youtube, Youtube ja Youtube! Haluasin koko soittolistan näkyville yhdellä kertaa

Viime keväänä innostuin tekemään Youtube-striimiä eli Larun verkkoliveä. Täällä sivustolla taas halusin tuoda asiaa käsittelevän artikkelin osaksi näkymän koko verkkoliveen upottamalla soittolistan.

Youtube upottuu kyllä todella sievästi ilman erityisempiä toimia, mutta yritäppä saada näkyville soittolistan kokonaisuus tai vaikkapa Youtube-kanava. Ei onnistukaan enää! On siis mentävä tutkiskelemaan taas laajennusten valikoimaa.

Siitä aikani pengottua törmäsin laajennukseen "[Embed Plus for Youtube - Gallery, Channel, Playlist, Live Stream](https://www.embedplus.com/)", joka oli juuri oikea ratkaisu tarpeeseeni! Tätä tulen käyttämään vielä ja paljon, tällä hetkellä olen lähinnä kokeillut sitä Verkkoliveä käsittelevän (keskeneräisen) artikkelini yhteydessä eli täällä: [Jari Larun verkkolive](https://www.jarilaru.fi/2020/03/12/jari-larun-verkkolive/)

[Katso video](https://www.youtube.com/watch?v=o3cbTU5d3Qk)

### Lopuksi: muutama olennainen laajennus, jotka pysyttelevät taustalla

Lopuksi esittelen muutaman olennaisen laajennuksen, jotka asennan yleensä aina. Ne liittyvät sivuston turvallisuuteen, varmuuskopiointiin ja hakukoneoptimointiin.

#### Mikään ei ole sen tärkeämpää kuin hakukoneoptimointi, no, ehkä hakukoneoptimointi

Vuosia sitten tein toiminimeni toimesta erään kohtalaisen seikkaperäisen sivustototeutuksen tutulle asiakkaalle. Sivusto oli tehty Drupal-teknologialla ja tavoitteena oli saada mahdollisimman nopeasti Google huomioimaan sivuston olemassaolo ja sitä myöten sivusto näkymään toimeksiantajan asiakkaille.

Toisin kuten usein luullaan, Google ei löydä sivuja kovin tehokkaasti noin vain. Päinvastoin, kamppailu hakukoneiden huomiosta on eräänlaista "taistelua", jossa on olemassa selkeät sään öt. Aiheesta käytetään termiä "hakukoneoptimointi" (englanniksi SEO eli Search Engine Optimatization") ja siihen on olemassa runsaasti erilaisia ohjevideoita ja sivustoja. Jos aihepiiri ei ole kovin tuttu, niin Google esimerkiksi voi auttaa asiassa omalla pienellä oppaallaan: [https://developers.google.com/search/docs/beginner/seo-starter-guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)

Hakukoneoptimoinnissa on karkeasti sanoen kaksi tasoa: 1) tekninen taso, jossa sivuston toteutus ja asennetut SEO laajennukset näyttelelevät roolia ; 2) sisällöllinen taso, jossa sisältöä kirjoittava henkilö laatii sivustolle otsikon, rakenteen, avainsanat, luokittelun jne.

Jokainen, joka tekee ammatillisen, poliittisen tai tieteellisen sivuston, haluaapi toki maksimaalisen hakukoneiden huomion. Wordpressille löytyy runsaasti erilaisia SEO laajennuksia ja tällä kertaa asensin sivustolleni [All-in-one SEO](https://aioseo.com/) ja [Google Analytics for Wordpress by Monsterinsights](https://www.monsterinsights.com/) -laajennukset.

Varsinkin kuntavaalien ja muiden poliittisten kamppailujen kohdalla tämä aihepiiri on erityisen keskeinen ja tätä ei voi sivuuttaa.

#### Hei! Suojataan liikenne asentamalla SSL sertifikaatti

Vaikka tällä sivustolla ei verkkokauppaa tai muuta SSL sertifikaattia tarvitsevaa toimintaa pyöritetäkään, se on hyvä asentaa. Esimerkiksi Google antaa paremman pagerankin https-sivuistoille (s lopussa on yhtä kuin secure). Tähän tarkoitukseen soveltuu erinomaisesti "[Really Simple SSL](https://really-simple-ssl.com/)" laajennus.

#### iThemes Security tarkistaa sivuston turvallisuude

[iThemes Security](https://ithemes.com/security/) tarkistaa sivustosi erilaisten hyökkkäysten ja hyväksikäyttöjen varalta. Tärkeä työkalu.

#### UpdraftPlus - Backup/Restore varmuuskopiointii

Tämä
[UpdraftPlus](https://updraftplus.com/)laajennuksen avulla pystyn varmuuskopioimaan sivustoni ja palauttamaan sen tarvittaessa. Jos teen joitain isoja muutoksia, teen tämän avulla varmuuskopion ennen muutosten tekemistä.

## Hengästyttääkö? Tässä tämä kaikki!

Ei muuta kuin laajennuksia asentelemaan ;)
