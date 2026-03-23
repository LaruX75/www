# Saavutettavuus- ja käytettävyysauditointi

Päiväys: 2026-03-21
Päivitetty: 2026-03-23

Tavoitetaso: WCAG 2.1 AA

Auditoinnin tapa:
- lähdekoodin ja Eleventy-pohjien läpikäynti
- generoituun `_site`-HTML:ään kohdistettu tarkastus
- olemassa olevan Playwright/axe-testauksen arviointi
- käytettävyysheuristiikka navigaation, haun, taulukoiden ja upotusten osalta

Rajaukset:
- Tässä auditissa ei tehty ruudunlukijalla tehtävää manuaalitestausta.

## Yhteenveto

Sivustolla on jo paljon hyvää saavutettavuuspohjaa: `lang`-attribuutit, ohituslinkki, `main`-alue, näkyvät fokuskehykset, erillinen saavutettavuuspaneeli, opinnäytesivun `aria-live`-tilaviestit ja useita nimettyjä ikonipainikkeita on toteutettu oikein.

**Tilannepäivitys 2026-03-23:** Auditoinnin jälkeen on korjattu useita kriittisiä ja merkittäviä löydöksiä. Desktop-megavalikon näppäimistökäyttö, hakudialogin fokuslogiikka, iframe-nimitykset, saavutettavuusseloste ja testausprosessi on uusittu. Kontrastikorjaukset kattoivat sivutuksen, opinnäytebadget ja julkaisusivun avainsanapilven. Testikattavuus on merkittävästi kasvanut: kaikki 14 Playwright-testiä läpäistään.

WCAG 2.1 AA -tasoa ei vielä voida pitää täysin saavutettuna, mutta tila on parantunut huomattavasti. Jäljellä olevat keskeiset puutteet: kontaktimegavalikon lomake-labelit, linkkien värillinenkorostus sekä julkaisusivun coauthor-suodattimen tilaviesti.

## Priorisoidut löydökset

### P1 Kriittinen: desktop-megavalikko ei ole aidosti näppäimistökäytettävä — ✅ KORJATTU 2026-03-23

~~Vaikutus:~~
- ~~Desktopissa alavalikot avautuvat CSS:llä hoverin kautta, mutta top-level-linkin klikkaus ohjataan JavaScriptillä aina kohdesivulle.~~
- ~~Tämä tarkoittaa käytännössä, että hiiretön käyttäjä ei voi avata desktop-alavalikkoa luotettavasti näppäimistöllä.~~

Korjaus (2026-03-23):
- Top-level-linkin toggle-logiikka uudelleenkirjoitettu: `Enter`/`Space` avaa/sulkee alavalikot, `ArrowDown`/`ArrowUp` siirtyy alavalikkolinkkien välillä, `Escape` sulkee aktiivisen alivalikon ja palauttaa fokuksen ylätasolle.
- Toteutus käyttää suoraa DOM-manipulaatiota Bootstrap-JavaScript-API:n sijaan, jotta näppäimienkäsittely toimii luotettavasti.
- Muutetut tiedostot: `src/_includes/base.njk`, `src/_includes/header.njk`.
- Playwright-navigaatiotesti kattaa keyboard-käytön: `tests/navigation.spec.js`.

WCAG:
- 2.1.1 Keyboard
- 2.1.2 No Keyboard Trap
- 2.4.3 Focus Order

### P1 Kriittinen: hakuoverlay ei ole merkitty dialogiksi eikä fokus pysy siinä — ✅ KORJATTU 2026-03-23

~~Vaikutus:~~
- ~~Hakunäkymä avataan visuaalisena overlayna, mutta markupista puuttuu dialogisemantiikka.~~
- ~~Koodi siirtää fokuksen hakukenttään, mutta ei lukitse tab-järjestystä overlayn sisään eikä palauta fokusta avauspainikkeelle suljettaessa.~~

Korjaus (2026-03-23):
- Hakuoverlay merkitty `role="dialog"`, `aria-modal="true"` ja `aria-labelledby`-attribuuteilla.
- Fokusloukku (focus trap) toteutettu: Tab/Shift+Tab kiertää vain dialogin sisäisten fokusoitavien elementtien välillä.
- `Escape`-näppäin sulkee dialogin ja palauttaa fokuksen avauspainikkeelle.
- Muutetut tiedostot: `src/_includes/base.njk`, `src/_includes/header.njk`.
- Playwright-navigaatiotesti kattaa fokushallinnan: `tests/navigation.spec.js`.

WCAG:
- 1.3.1 Info and Relationships
- 2.4.3 Focus Order
- 4.1.2 Name, Role, Value

### P1 Kriittinen: kontaktimegavalikon lomakekentillä ei ole näkyviä label-elementtejä — ⚠️ AVOIN

Vaikutus:
- Kentät on nimetty vain `placeholder`-tekstillä ja `aria-label`-attribuuteilla.
- Tämä heikentää käytettävyyttä, muistikuormaa ja vaikeuttaa lomakkeen käyttöä suurennuksella sekä kognitiivisissa haasteissa.

Todisteet:
- `src/_includes/header.njk` rivit 794–798.

WCAG:
- 1.3.1 Info and Relationships
- 3.3.2 Labels or Instructions

Suositus:
- Lisätään näkyvät `<label>`-elementit kaikille kentille.
- `placeholder` saa jäädä esimerkkitekstiksi, mutta ei ensisijaiseksi nimeksi.

### P1 Kriittinen: useilla iframe-upotuksilla ei ole title-attribuuttia — ✅ KORJATTU 2026-03-23

~~Vaikutus:~~
- ~~Ruudunlukija ei saa upotuksen tarkoitusta luotettavasti selville.~~
- ~~Osa upotuksista on lisäksi vanhoja `http://`-osoitteita, mikä voi aiheuttaa myös mixed content -ongelmia.~~

Korjaus (2026-03-23):
- Kaikille viidelle julkaisusivun iframelle on lisätty kuvaava `title`-attribuutti.
- Muutetut tiedostot:
  - `src/publications/paper-1-scaffolding-different-learning-activities-with-mobile-tools-in-three-everyday-contexts.md`
  - `src/publications/paper-2-social-patterns-in-mobile-technology-mediated-collaboration-among-members-of-the-professional-distance-education-community.md`
  - `src/publications/paper-3-supporting-small-group-learning-using-multiple-web-2-0-tools-a-case-study-inthe-higher-education-context.md`
  - `src/publications/talousarvioesitys-2020-yksityisen-varhaiskasvatuksen-osuutta-tulee-lisata-25.md`
  - `src/publications/vierailu-kempeleen-kunnassa-aiheena-asukkaiden-huoli-jatevesilietteiden-kasittelyyn-liittyen.md`

WCAG:
- 4.1.2 Name, Role, Value
- 2.4.6 Headings and Labels

### P2 Merkittävä: linkkien erottuvuus perustuu liikaa väriin — ⚠️ OSITTAIN AVOIN

Vaikutus:
- Yleinen linkkityyli poistaa tekstilinkeiltä alleviivauksen eikä lisää muuta pysyvää erottavaa vihjettä.
- Opinnäytetaulukossa otsikkolinkki on erikseen `text-decoration-none text-body`, jolloin linkki näyttää tavalliselta tekstiltä.

Todisteet:
- `src/css/a11y.css` rivit 19–24
- `src/_includes/thesis-table.njk` rivit 37–40

WCAG:
- 1.4.1 Use of Color
- 1.4.3 Contrast (tilannekohtaisesti)

Suositus:
- Säilytetään tekstilinkkien alleviivaus oletuksena tai lisätään muu pysyvä visuaalinen erottaja.
- Taulukoissa linkin ei pidä näyttää tavalliselta leipätekstiltä.

### P2 Merkittävä: julkaisusivun dynaaminen rajaus ei ilmoita muutosta avustaville teknologioille — ⚠️ AVOIN

Vaikutus:
- Kanssatutkijasuodattimen tila päivittyy JavaScriptillä, mutta tilaviesti ei ole `role="status"`- tai `aria-live`-alue.
- Ruudunlukijan käyttäjä ei välttämättä saa tietoa siitä, että rajaus on aktivoitunut tai poistunut.

Todisteet:
- `src/julkaisut.njk` rivi 84
- `src/julkaisut.njk` rivit 628–643

WCAG:
- 4.1.3 Status Messages

Suositus:
- Lisätään `role="status"` ja `aria-live="polite"` tilaviestikonttiin.

### P2 Merkittävä: saavutettavuusseloste on nykytilaan nähden liian vahva ja osin virheellinen — ✅ KORJATTU 2026-03-23

~~Vaikutus:~~
- ~~Seloste väittää sivuston olevan WCAG 2.1 AA -tasolla vaatimusten mukainen.~~
- ~~Samalla testauskuvaus perustuu automaattiajoon, jonka nykyinen konfiguraatio voi kohdistua väärään localhost-palvelimeen.~~

Korjaus (2026-03-23):
- Saavutettavuusseloste päivitetty vastaamaan todellista nykytilaa: "osittain vaatimusten mukainen, kehitystyö käynnissä".
- Testausmenetelmäkuvaus päivitetty (Playwright + axe-playwright, kontrastiauditointi, navigaatiotestit).
- Muutetut tiedostot: `src/pages/saavutettavuus.md`, `src/en/accessibility.md`.

### P3 Keskisuuri: nykyinen Playwright/axe-prosessi voi auditoida väärää sivustoa — ✅ KORJATTU 2026-03-23

~~Vaikutus:~~
- ~~`reuseExistingServer: !process.env.CI` yhdessä kiinteän portin `8080` kanssa sallii tilanteen, jossa testit käyttävät jo käynnissä olevaa toista palvelua.~~

Korjaus (2026-03-23):
- Portti vaihdettu `8080` → `4173` (Vite/Eleventy preview -oletusportti).
- `reuseExistingServer` asetettu `false`-arvoon: testi käynnistää aina oman preview-palvelimen.
- Sivustotunnistustarkistus lisätty: testi varmistaa, että sivusto on oikea ennen axe-ajoa.
- Muutettu tiedosto: `playwright.config.js`.

## Kontrastikorjaukset (lisätty 2026-03-23)

Automatisoitu kontrastiauditointi paljasti useita WCAG 1.4.3 (teksti 4,5:1) ja 1.4.11 (ei-tekstikomponentti 3:1) -rikkomuksia. Kaikki löydökset on korjattu.

### Sivutuksen (pagination) hover-kontrasti — ✅ KORJATTU

- Ongelma: hoverin `background-color: #e9ecef` oli liian lähellä body-taustaväriä `#f4f6f9` (suhde 1,10:1, vaaditaan ≥3:1).
- Korjaus: vaihdettu `background-color: #6c757d` (harmaa, suhde 3,93:1) ja tekstiväri `color: #ffffff` (suhde 4,69:1).
- Muutettu tiedosto: `src/css/styles.css`.

### Opinnäytesivun accordion-kehyskontrasti — ✅ KORJATTU

- Ongelma: Bootstrap-mukauman `.accordion-button` saa `border: 1px solid var(--bs-accordion-border-color)`, jonka oletusarvo `#dee2e6` on lähes erottamaton valkoisesta korttipohjasta (suhde 1,30:1).
- Korjaus: `border-color: #6c757d` (suhde 4,23:1), dark-mode-versio `rgba(255,255,255,0.45)`.
- Muutettu tiedosto: `src/opinnaytteet.njk` (inline-tyyli).

### Opinnäytesivun avainsanabadget — ✅ KORJATTU

- Ongelma: `text-bg-light`-badge sai lähes valkoisen taustan (`rgba(239,246,255)`) valkoisen kortin päällä (suhde 1,09:1).
- Korjaus: CSS-ylikirjoitus korkeammalla spesifisyydellä (ID + 2 luokkaa): tausta läpinäkyväksi, reunukseksi `#6c757d` (suhde 4,23:1).
- Muutettu tiedosto: `src/opinnaytteet.njk` (inline-tyyli).

### Julkaisusivun avainsanapilven tekstikontrasti — ✅ KORJATTU

- Ongelma: Bootstrap-primäärisininen `#0d6efd` sinertävällä taustalla `rgba(219,233,255)` → suhde 3,67:1 (vaaditaan ≥4,5:1).
- Korjaus: väri vaihdettu tummansiniseen `#004192` → suhde 7,98:1.
- Muutettu tiedosto: `src/julkaisut.njk` (inline JS-tyyli).

### CSS-transition-ajoitusongelma testauslogiikassa — ✅ KORJATTU

- Ongelma: `transition: all 0.2s` -animaatio painikkeissa aiheutti virheellisiä mittaustuloksia, kun hover-tila mitattiin 75 ms kuluttua (37,5 % animaatiosta kesken).
- Korjaus: odotusaika nostettu 75 ms → 300 ms (yli 200 ms animaation).
- Muutettu tiedosto: `tests/helpers/contrast.js`.

## Otsikkojärjestyksen korjaus (lisätty 2026-03-23)

- Ongelma: Opinnäytesivulla avainsanapilven otsikko oli toteutettu `<span>`-elementillä, jolloin `h1` hyppäsi suoraan `h3`-tasolle.
- Korjaus: `<span>` vaihdettu `<h2>`-elementtiin.
- Muutettu tiedosto: `src/opinnaytteet.njk`.

## Testiinfrastruktuuri (lisätty 2026-03-23)

Playwright-testipaket on laajennettu merkittävästi:

| Testitiedosto | Kattavuus |
|---|---|
| `tests/accessibility.spec.js` | axe-playwright-auditointi 6 sivulla (FI + EN) |
| `tests/contrast.spec.js` | painikkeiden ja linkkien kontrasti 6 sivulla |
| `tests/navigation.spec.js` | megavalikon näppäimistökäyttö ja hakudialogin fokushallinta |
| `tests/helpers/contrast.js` | selainpuolen kontrastimittaus (teksti + komponentti, default + hover) |
| `tests/helpers/a11y.js` | axe-konfiguraatio ja navigaatioabstraktiot |

Kaikki 14 testiä läpäistään.

## Käytettävyyslöydökset

### Navigaatio
- Megavalikon näppäimistökäyttö on nyt toimiva (Enter/Space/nuolet/Escape).
- Mobiilin offcanvas-rakenne on selkeämpi kuin desktop-versio.

### Haku
- Haku avautuu nopeasti, fokus siirtyy kenttään ja dialogisemantiikka on kunnossa.
- Fokusloukku ja Escape-sulkeminen toimivat oikein.

### Taulukot ja suodatus
- Opinnäytesivu on toiminnallisesti vahva: suodatus, sivutus ja tilaviestit on toteutettu hyvin.
- Julkaisusivun coauthor-rajaus jää tästä jälkeen tilaviestien näkökulmasta (avoin löydös).

### Sisältöupotukset
- Kaikki iframet nimetty kuvaavilla `title`-attribuuteilla.
- Vanhat kolmannen osapuolen upotukset ovat edelleen sekä käytettävyys- että ylläpitoriski.

## Positiiviset havainnot

- `html lang` on käytössä.
- Ohituslinkki pääsisältöön on olemassa.
- `main`-alue ja footer-rakenne ovat pääosin kunnossa.
- Fokuskehykset on määritelty näkyviksi navigaatiossa.
- Opinnäytesivulla on `aria-live`-tilaviestit ja `aria-pressed`-tilat avainsanapainikkeille.
- Ikonipainikkeita on nimetty useissa kohdissa oikein.
- Megavalikon näppäimistökäyttö, hakudialogin fokuslogiikka ja kontrastikorjaukset valmistuneet.

## Suositeltu jatkotoimenpidejärjestys

1. ~~Korjaa desktop-megavalikon näppäimistökäyttö.~~ ✅ TEHTY
2. ~~Muuta hakuoverlay aidoksi dialogiksi.~~ ✅ TEHTY
3. **Lisää näkyvät labelit kontaktimegavalikon lomakkeeseen.** (Korkein prioriteetti)
4. ~~Lisää kaikille iframeille kuvaavat `title`-attribuutit.~~ ✅ TEHTY
5. Korjaa tekstilinkkien erottuvuus koko sivustolla (väri → alleviivaus tai muu visuaalinen erottaja).
6. Lisää julkaisusivun coauthor-rajaukseen `aria-live`-tilaviestit.
7. ~~Päivitä saavutettavuusseloste vastaamaan todellista tilannetta.~~ ✅ TEHTY
8. ~~Korjaa testausputki käyttämään varmasti tämän projektin omaa palvelinta.~~ ✅ TEHTY

## Arvio nykytilasta

**Alkuperäinen tila (2026-03-21):** osittain WCAG 2.1 AA -tason suuntainen, ei vielä AA-tasolla.

**Tilanne 2026-03-23:** edistystä merkittävästi. Kaikki kriittiset P1-ongelmat lukuun ottamatta kontaktimegavalikon lomaketta on korjattu. Kontrastivirheet poistettu. 14/14 automaattitest läpäisty.

Estävät puutteet AA-hyväksynnälle:
- 3.3.2 Labels or Instructions — kontaktilomakkeen näkyvät labelit puuttuvat
- 1.4.1 Use of Color — linkkien erottuvuus värin lisäksi
- 4.1.3 Status Messages — julkaisusivun suodatustilaviesti
