# Canonical Content v1 -> Find & Explore Roadmap

Date: 2026-08-12

## Status

Canonical content architecture v1 on nyt rakennettu neljalle sisältöalueelle:

- presentations / esitykset
- publications / julkaisut
- theses / opinnäytteet
- writings / kirjoitukset

Yhteinen periaate:

```text
authoritative source(s)
        ↓
canonical internal content
        ↓
purpose-specific projections
        ├── HTML
        ├── public JSON
        ├── JSON-LD / metadata
        ├── Pagefind
        └── internal semantic projections
```

C1-C3-auditit ja C2-contract ovat tehneet mallista dokumentoidun ja validoitavan.

Keskeinen päätös:

```text
pageUrl
= local canonical HTML page

sourceUrl
= authoritative/original source

url
= compatibility field
```

Saanto:

> Älä jatka `url`-kentän site-wide refaktorointia tässä roadmapissa.

Seuraava tavoite ei ole uusi arkkitehtuurikerros, vaan näkyvä UX-, performance-, SEO- ja ylläpitohyöty jo rakennetusta canonical-mallista.

## Release Gate

Ennen mitään Find & Explore- tai C4-työtä noudatetaan tätä porttia:

```text
commit
→ PR
→ CI
→ merge
→ tag canonical-content-v1
→ vasta sitten seuraava vaihe
```

Tämä on pakollinen rollback- ja historiapiste.

## R0 - Freeze and publish canonical-content-v1

Ennen uutta Find & Explore -runtimea:

1. tarkista nykyinen työpuu
2. ryhmittele canonical-arkkitehtuuriin kuuluvat muutokset
3. varmista ettei mukaan tule unrelated work
4. aja keskeiset unit/parity/build-portit
5. tee architecture consolidation PR
6. merge vasta vihreän CI:n jälkeen
7. tagaa merge nimella `canonical-content-v1`

Ehdotettu PR-otsikko:

```text
Canonical content architecture v1: presentations, publications, theses and writings
```

Saanto:

> Älä aloita F1/F2/C4-jatkokehitystä ennen kuin R0 on suljettu.

## F1 - Find & Explore Architecture + Deletion Audit

F1 on audit-only.

Sen pitää vastata kahteen yhtä tärkeään kysymykseen:

### A. Mitä Pagefind voi ottaa vastuulleen?

Auditoi vähintään:

- global search
- presentations
- publications
- theses
- writings
- etusivu
- Tutkimus
- Työ
- Politiikka
- Kynästä

Tunnista ainakin:

- tekstihaku
- content-type filter
- vuosi
- kieli
- theme
- keyword
- publication type
- thesis type
- role
- source
- grouping
- sorting
- show more
- pagination
- section filtering

Luokittelu:

```text
PAGEFIND
CANONICAL_DATA
KEEP_CLIENT
HYBRID
REDUNDANT
NEEDS_INVESTIGATION
```

### B. Mitä nykyisestä UI:sta voidaan poistaa?

Tämä on F1:n pakollinen deletion audit.

Etsi erityisesti:

- päällekkäiset hakukentät
- sisältötyyppikohtaiset minihakukoneet
- päällekkäiset filtterit
- valtavat archive-taulukot
- listat, joiden kaikki itemit renderöidään DOMiin vain client-filteriä varten
- miniarkistot pääsivuilla
- saman datan toistuvat yhteenvedot
- redundantit "kaikki sisällöt" -listat
- päällekkäinen navigaatio
- päällekkäiset taxonomy entry points
- client-side JSON -> normalize -> filter -> render -putket, joita Pagefind voisi korvata

Jokaisesta poistoehdotuksesta raportoi:

```text
current UI/runtime
replacement
UX impact
SEO impact
JS-off impact
accessibility impact
performance impact
risk
```

Tavoite ei ole poistaa sisältöä.

Tavoite on:

> vähentää käyttöliittymää sisällön päältä.

## F1 - DOM / payload baseline

Mittaa ennen muutoksia ainakin:

- `/julkaisut/`
- `/esitykset/`
- `/opinnaytteet/`
- `/kirjoitukset/`
- EN-vastineet mahdollisuuksien mukaan

Kerää:

- HTML size
- rendered item/card/row count
- DOM size tai luotettava proxy
- relevant JS size
- relevant JSON payload
- initially visible records
- records present only for filtering
- Pagefind index size

Tämä toimii baseline-mittauksena myöhempää F2/P1-vertailua varten.

## F1 - Pagefind metadata readiness

Tarkista mitä Pagefindille oikeasti päätyy HTML:stä.

Vähintään:

- contentType
- lang
- year
- date
- themes
- categories
- keywords
- publication type
- thesis type
- writing role
- source
- title
- description

Tee matrix:

| Field | Canonical | HTML | Pagefind | UX needs |
| --- | --- | --- | --- | --- |

Älä lisää puuttuvia metadata-kenttiä vielä F1:ssä.

## F1 - Main-page discovery

Arvioi Pagefindia myös pääsivujen UX-kerroksena.

### Etusivu

Kaksi sisäänkäyntiä:

```text
Valitse reitti
= browse/navigation

Find & Explore
= tiedän aiheen jota etsin
```

Arvioi lisäksi nykyisen aikajanan rikastaminen:

```text
year
→ themes
→ content types
→ Pagefind results
```

### Tutkimus

Mahdollinen Evidence UI:

```text
Mistä aiheesta haluat nähdä näyttöä?

[ tekoälylukutaito ]
```

Tulokset voivat yhdistää:

- publications
- theses
- presentations
- writings

Tutkimussivun ei tarvitse sisältää omia miniarkistoja, jos Find & Explore tarjoaa evidenssin.

### Politiikka

Mahdollinen käyttöliittymä:

```text
Mitä olen tehnyt tästä asiasta?

[ palveluverkko ]
```

Tulokset esimerkiksi:

- speeches
- initiatives
- opinions
- statements
- writings

### Työ

Arvioi Evidence-linkkejä:

```text
Opettajankoulutus
→ Tutki tähän liittyviä sisältöjä
```

Ei massiivista archivea pääsivulle.

### Kynästä

Arvioi, voiko nykyisten useiden haku-/listausrakenteiden tilalle tulla yksi:

```text
Hae kirjoituksista ja puheista
```

Facetit:

- contentType
- role
- year
- theme

Kynästä on erityisen tärkeä deletion-audit-kohde.

## F1 - Orientation

Sisällytä auditissa tulevan Orientation-järjestelmän feasibility.

### Top Orientation

Sivun alussa:

```text
canonical breadcrumb

+
discovery context:
← Takaisin: tekoälylukutaito · 8 tulosta
```

Breadcrumb vastaa:

```text
Missä tämä sisältö kuuluu?
```

Discovery context vastaa:

```text
Mistä käyttäjä tuli?
```

### Desktop orientation rail

Testattava konsepti pitkille detail-sivuille.

Mahdolliset elementit:

```text
↑
reading progress
3 / 8
← →
back to results
↓
```

Rail on contextual:

- normaali lukeminen
- Find & Explore
- myöhemmin Listen / Radio

Älä lukitse railia vielä arkkitehtuuriksi. Arvioi UX-hyöty ja saavutettavuus.

### Mobile orientation

Desktop railin sijaan kompakti bottom bar:

```text
←     3 / 8     →     ⌕     ↑
```

Arvioi:

- peittääkö sisältöä
- focus behavior
- keyboard / screen reader
- safe-area
- scroll behavior

### Bottom Orientation

Sivun lopussa:

```text
← Previous       3 / 8       Next →

Explore also:
[theme] [theme] [theme]

↑ Back to top
```

Alhaalla tehtävä on jatkaminen, ei sijainnin ilmoittaminen.

## F1 - Listen / Radio discovery

Auditoi, voiko Pagefind-result set toimia myöhemmin radiojonon pohjana.

Kolme mahdollista toimintoa:

```text
Kuuntele tämä
Kuuntele nämä
Jatka tästä
```

Periaate:

```text
Pagefind
= what to listen to

canonical/detail content
= what is read

TTS
= voice

player
= playback
```

Auditoi eri sisältötyyppien kuunneltavuus:

```text
FULL_TEXT_READABLE
ABSTRACT_READABLE
SUMMARY_READABLE
METADATA_ONLY
NOT_SUITABLE
```

Tarkista ainakin:

- publication
- thesis
- presentation
- blog
- speech
- opinion
- column
- initiative
- statement

Pagefind ei saa muuttua audio-content sourceksi.

## F1 - Contextual radio

Arvioi voiko mikä tahansa discovery state muuttua kuuntelujonoksi.

Esimerkkejä:

```text
2025
→ Kuuntele vuosi 2025

tekoälylukutaito + presentations
→ Kuuntele nämä

politiikka + koulutus
→ Kuuntele aihe
```

Tavoite on välttää erillisen radio-discovery-järjestelmän rakentaminen.

## F1 - SEO parallel audit

SEO ei ole erillinen "SEO text" -projekti.

Auditoi Find & Explore -muutoksen rinnalla tavoitemalli:

```text
hub
→ explains and organizes

topic
→ aggregates subject authority

detail
→ canonical document

Pagefind
→ discovery
```

Tarkista ainakin:

- title
- description
- canonical
- OG
- JSON-LD
- sitemap
- internal linking
- hreflang
- robots / noindex
- indexability

Kiinnitä erityistä huomiota suuriin archive-sivuihin.

Kysy:

> sisältääkö hub edelleen suuria määriä detail-sisältöä turhaan, vaikka canonical detail -sivut ovat olemassa?

Älä lisää geneeristä SEO-fill textiä.

## F1 - Distribution opportunities

Dokumentoi, mutta älä vielä toteuta:

- RSS
- JSON Feed
- ICS
- Web Share
- Copy Link
- Citation export
- Facebook Page distribution

Erityinen jatkopilotti:

```text
canonical item
→ share projection
→ suggested Facebook text
→ canonical URL + OG preview
→ user edits
→ publish to Facebook Page
```

Tavoite on puoliautomaattinen julkaiseminen ennen full automationia.

Facebook ei ole authoritative source tälle sisällölle.

## F1 - FindExplore shared component feasibility

Arvioi yhden shared componentin mahdollisuus.

Konseptuaalinen API:

```text
scope
language
allowedContentTypes
facets
defaultSort
resultTemplate
placeholder
```

Mahdolliset scopet:

```text
all
publications
presentations
theses
writings
theme:<theme>
research
politics
```

Älä rakenna komponenttia vielä.

## F1 - Recommended pilot

Valitse lopuksi ensimmäinen F2-pilotti.

Vertaa vähintään:

- `/julkaisut/`
- `/opinnaytteet/`
- `/esitykset/`
- `/kirjoitukset/`

Valintakriteerit:

- current UX complexity
- redundant client logic
- canonical maturity
- local detail coverage
- Pagefind quality
- metadata readiness
- DOM reduction potential
- SEO benefit
- accessibility risk
- architecture simplification potential

Valitse pilotti, jolla voidaan todistaa samanaikaisesti:

```text
better UX
+
less UI
+
less runtime complexity
+
lighter archive
```

## F1 final report

Luo auditin lopuksi:

```text
docs/find-explore-architecture-audit-2026-08-12.md
```

Raportoi vähintään:

1. nykyiset discovery-toiminnot
2. Pagefindille sopivat toiminnot
3. canonical datalle jäävät toiminnot
4. clientille jäävät toiminnot
5. poistettavat / redundantit UI-rakenteet
6. nykyinen DOM / payload baseline
7. Pagefind metadata readiness
8. pääsivujen Find / Explore / Evidence -mahdollisuudet
9. timeline-mahdollisuus
10. Orientation feasibility
11. Listen / Radio readiness
12. SEO-vaikutukset
13. distribution opportunities
14. FindExplore-component feasibility
15. potentiaalinen poistuva JS / template / runtime
16. suositeltu F2-pilotti
17. F2:n tarkka hyväksymiskriteeri

Anna lopuksi yksi pääsuositus:

```text
PAGEFIND-FIRST RECOMMENDED
```

tai

```text
HYBRID RECOMMENDED
```

tai

```text
CURRENT MODEL SHOULD REMAIN
```

## Architecture boundaries

Älä F1:ssä:

- muuta runtimea
- muuta UI:ta
- poista nykyisiä toimintoja
- muuta canonical contractia
- muuta Pagefind-rankingia
- lisää embeddingejä
- lisää LLM:ää
- rakenna radioa
- rakenna Facebook-automaatiota
- rakenna uutta universal discovery frameworkia

Tämä on auditointi.

## Roadmap after F1

Jos F1 tukee Pagefind-first- tai hybrid-mallia:

```text
F2
→ yksi Find & Explore UX -pilotti

F3
→ shared Find & Explore arkistoihin

F4
→ pääsivujen Search / Explore / Evidence

O1
→ Orientation system

T1
→ interactive timeline

S1
→ SEO closure

P1
→ performance closure

D1
→ RSS / Share / Cite / Facebook Publish

L1
→ Listen / Radio

AI1
→ embeddings / LLM vain jos todellinen tarve on osoitettu
```

Pidä koko roadmapin ajan tämä sääntö:

> Uutta arkkitehtuurikerrosta ei rakenneta ilman osoitettavaa käyttäjä-, suorituskyky- tai ylläpitohyötyä.

Ja toinen yhtä tärkeä sääntö:

> Find & Explore -uudistuksen onnistumista mitataan myös sillä, kuinka paljon tarpeetonta UI:ta ja client-runtimea voidaan poistaa turvallisesti.
