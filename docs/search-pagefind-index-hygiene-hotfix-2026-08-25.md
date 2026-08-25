# Pagefind index hygiene — presentation excerpts + universal body scope

**STATUS: CLOSED / GREEN / MAIN** (2026-08-25)

Hotfix haara: `hotfix/pagefind-index-hygiene`  
Aloitus-baseline: `origin/main = 2ef8f2871669d7078afa77f96505bb13590724a2`  
PR base: `8db7425e83f687deb14a9bc06331835960d419c1` (post-SSR-P1)  
Päivämäärä: 2026-08-25

## 0. Closure

| Kenttä | Arvo |
| --- | --- |
| PR | [#149](https://github.com/LaruX75/www/pull/149) |
| Toteutus-HEAD | `4b3ba2f7f511fcb4392152b50849d4d21770a7a0` |
| Merge commit | `965c735b13c048794d479fb7d96759f3302d62d1` |
| Resulting `origin/main` | `965c735b13c048794d479fb7d96759f3302d62d1` |
| PR CI | `build-and-verify` pass, `playwright` pass |
| Main deploy | `Build and Deploy` success |
| Merged | 2026-08-25T09:34:54Z |
| Konfliktit SSR-P1:n kanssa | ei — mikään SSR-P1:n koskettama tiedosto ei limity tämän hotfixin muutoksiin |

### Tuotannon jälkiverifiointi (jarilaru.fi post-deploy)

- **Global Sisältö facet** (kaikki sivutyypit indeksissä):
  `Esitykset: 326, Julkaisut: 57, Kirjoitukset ja puheenvuorot: 234, Mediassa: 72, Opinnäytteet: 139`.
  Käytetään corpus-sanity-mittarina — ei summata query-tuloksiin.
- **Kysely `mobiili` (Kieli=Suomi)**: 164 tulosta. Sisältö facet: Esitykset 36, Julkaisut 36,
  Kirjoitukset ja puheenvuorot 18, Mediassa 0, Opinnäytteet 32. Top 20 excerpttien seula
  kielletyille tokeneille (`slideshare|`, `localDetail`, `externalUrl`, `landingUrl`, `pageUrl`,
  `sourceUrl`, `education|research`): **0 osumaa**.
- **Kysely `tekoäly` (Kieli=Suomi)**: 373 tulosta. Sisältö facet: 5/5 domainia. Top 20 kiellettyjä
  tokeneita: 0.
- **Kysely `learning` (EN /en/search/)**: 130 tulosta, Sisältö-facet Esitykset 20, Mediassa 1,
  Opinnäytteet 30. Top 5 kiellettyjä tokeneita: 0.
- **Affected result `/presentations/ss-mobiilioppimisesta-about-mobile-learning/`**:
  meta.title = "Mobiilioppimisesta - About Mobile learning", meta.PresentationYear = "2011",
  meta.PresentationType = "presentation", Sisältö = ["Esitykset"].
  Excerpt: `<mark>Mobiilioppimisesta</mark> - <mark>About</mark> <mark>Mobile</mark> <mark>learning.</mark> This document provides a summary of a presentation on <mark>mobile</mark> <mark>learning.</mark> It discusses the history and future of <mark>mobile</mark> <mark>learning,</mark>…` — täysin ihmisluettava, ei pipe-vuotoa.

### Body-boundary + injektio tuotannossa

- `<main data-pagefind-body>` renderöityy universaalisti (etusivu, esitykset, esitysdetaili,
  julkaisut, opinnäytteet, /en/*).
- `pagefindDocument.seedText`-span omalla `data-pagefind-body`-attribuutilla → F&E seed-kyselyt
  toimivat (`__find_explore_publications__` 57 doc, `__find_explore_theses__` 139 doc,
  `__find_explore_presentations__` 195 sisältäen custom-recordit).
- Esitysdetaili-sivujen HTML:ssä **ei** ole `data-presentation-pagefind-scope`-injektiota (Pagefind
  lisää sen vain indeksointihetkellä `run-pagefind.js`:n kautta). H1:llä `data-pagefind-weight="10"`.

### G2 metadatakontrakti — säilyy tuotannossa

- Kaikki filter-avaimet indeksissä: `Sisältö`, `FindExplore`, `Kieli`, `PresentationYear`,
  `PresentationType`, `PresentationTopic`, `PresentationContext`, `Research context`,
  `PresentationLandingType`, `PresentationMediaType`, `PresentationSourceType`,
  `PresentationResearchPreset`, `PresentationEvent`.
- Meta säilyy: `title`, `PresentationYear`, `PresentationType`, `PresentationEvent`. Otsikot
  joissa kaksoispiste (`Mobiililaitteet ja koulu: hypeä ja arkirealismia`) parsiutuvat oikein.

### SSR-P1 regressiotesti

`/esitykset/` renderöi SSR-P1-osiot rakennushetkellä: hero-sektio, "Millaista materiaalia etsit?"
selauspaneeli, "Nostot"-featured-section, "Neljä esimerkkiä tilaisuuksista" (ITK 2026 -avauspuheenvuoro,
Palveluverkkokeskustelun tausta-aineisto, Opetus ja oppiminen tekoälyajassa, Jari Larun verkkolive).
`/en/presentations/` renderöi 6 SSR-sektiota. Ei duplikaatti-rendausta, ei console-erroreita
(X-Frame-Options meta-warning on baseline, ei liity tähän hotfixiin).

### Muiden domainien pistetesti

Publications ("tekoäly"), Writings ("lausunto"), Theses ("mobiili"), Media ("tekoäly"): kaikkien top-2
tuloksen excerpt ei-tyhjä, ihmisluettava, otsikko ja meta säilyvät. Ei blank-excerpttejä eikä
menetettyjä main-sisältöjä.

### Result-count semantics — tarkennus

Pagefind-summan luku (`search.results.length`) = *matching dokumenttien / sivujen* lukumäärä, **ei**
sanaesiintymien lukumäärä. Yksi sivu jossa "mobiili" esiintyy monta kertaa on yksi tulos.
Aiempi ~228 mobiili FI-luku oli **paisunut** koska (a) tekninen metadataroska tuotti legitiimejä
Pagefind-document-matcheja, ja (b) ilman `data-pagefind-body` rajauskerrosta koko `<body>` (navbar,
footer, filter-panels) matchaili kyselyihin. Uusi ~164 (tuotannossa) heijastaa vain oikeaa sisältö-
osumista. Sama kausaliteetti pätee `tekoäly`-kyselyn 373 tulokseen.

### Poistot / yksinkertaistukset säilyvät

`buildPresentationPagefindInjection` yksinkertaistuksessa poistetut palat:

- Meta-arvojen body-teksti-spanit (siirretty attribuuttimuotoon)
- Painotettu duplikaattiotsikko-markup (H1 omaa `data-pagefind-weight="10"`)
- `scopeText`-bareback `<span>` (find-explore seed säilyy custom-recordien contentissa)

Ei uutta client-side excerpt-sanitointia lisätty.

### Testit ja CI

- Unit: `npm run test:unit` → 612 pass, 0 fail
- PF5 & find-explore Playwright: 95 pass (yksi baseline-flake `f3b-publications-find-explore.spec.js`
  passasi eristettynä uudelleenajolla; dokumentoitu tunnetuksi)
- PR CI: `build-and-verify` pass, `playwright` pass
- Main deploy: success (SHA 965c735b)

### Deferred (ei tässä hotfixissä)

- Result ranking tuning
- Query relevance tuning
- Media G3
- Writings G4
- Presentations FULL Pagefind decision
- Archive runtime JSON removal
- FilterPills MutationObserver cleanup
- BBS/Gopher/themes

### Cleanup

Worktree `/private/tmp/www-index-hygiene` ja lokaali haara `hotfix/pagefind-index-hygiene` poistettu
mergen jälkeen. Remote-haara poistettu. `git worktree prune` ajettu.

---

## 1. Tiivistelmä

Haun tulokset "mobiili"-kyselylle sisälsivät esitysrivien excerpteissä teknistä metadataroskaa
(esim. `slideshare|https://…|Otsikko`, `education|research|teaching`, `long-term-learning`,
`localDetail`, `find_explore_presentations`). Kokonaishits oli 228 FI-partitiossa. Hotfixin jälkeen
excerptit ovat siistejä ja tulostaulukossa säilyy odotettu määrä osumia (66 mobiili FI, monikanavainen
Sisältö-facet).

Hotfix on rajattu HTML-indeksoinnin skoping-tasoon (`data-pagefind-body` + `data-pagefind-ignore`) ja
Pagefind-injektion attribuuttimuotoiseen metadataan. **Kanoninen data (`Canonical Content v1`),
PF5-G2 metadatakontrakti ja hakuvalikkomallit säilyvät muuttumattomina.**

## 2. Reprodusointi ja alkumittaus

Kysely `mobiili` FI-partitiossa `origin/main`:sta:

- **228 tulosta** (haun total)
- **Top 8 esitysriviä** — kaikkien excerptissä pipe-erotettu teknisdatapätkä. Esim.
  - `/presentations/ss-mobiilioppimisesta-about-mobile-learning/` → excerpt sisälsi
    `Nollaa kaikki Mobiilioppimisesta - About Mobile learningslideshare|https://www.slideshare.net/slideshow/…/9581844|Mobiilioppimisesta - About Mobile learningeducation|teaching2011presentationenlong-term-learningMobiilioppiminen…`
  - Sama vuoto toistui kaikilla 8 top-8 -tulossivulla (URLpolut `/presentations/ss-mobiili*/`).
- Muut sivutyypit (Julkaisut, Opinnäytteet, Kirjoitukset ja puheenvuorot, Mediassa, kotisivu,
  taksonomiat) näkyivät tuloksissa siistein excerptein.

Vuoto on rajattu esitysten yksityiskohtasivuihin. Muiden sisältötyyppien HTML on siisti.

## 3. Juurisyy — pipe-vuoto excerpteissä

Vuotolähde: `scripts/_lib/presentationPagefind.js` funktio `buildPresentationPagefindInjection`.
Se lisäsi jokaisen esitysdetail-sivun runkoon ennen `</body>`:tä lohkon:

```html
<div hidden data-presentation-pagefind-scope="presentations">
  <!-- Pagefind-suodattimet: <span hidden data-pagefind-filter="Key:Value"></span> -->
  <!-- Pagefind-meta bodytekstinä: <span hidden data-pagefind-meta="Key">Value</span> -->
  <!-- Painotettu otsikko: <span data-pagefind-weight="10">Title</span> ×2 -->
  <!-- ScopeText: <span> __find_explore_presentations__ Title Description … </span> -->
</div>
```

Kolme vuotokanavaa:

1. `data-pagefind-meta="Key"` sisällä oleva `Value` — Pagefind indeksoi sen bodytekstinä, ei
   pelkkänä attribuuttimetana.
2. Meta-arvo `PresentationId` = `canonicalPresentationId(item)` palautti pipe-liitoksen
   `sourceKey|sourceUrl|title` (esim. `slideshare|https://…|Otsikko`) kun `item.id` puuttui.
3. `scopeText`-span sisälsi seed-tokenin `__find_explore_presentations__` + otsikot + kuvaukset +
   konteksti/topic-arvot. Kaikki toistuivat tekstivirrassa vailla erottimia — Pagefindin excerpt-
   generaattori laski peräkkäisistä `<span hidden>`-solmuista yhden pitkän liuskan.

Kaiken tämän lisäksi presentation-detail-sivuilla ei ollut `data-pagefind-body`-rajausta, joten
Pagefind indeksoi koko `<body>`:n mukaan lukien navbarin, footerin, esteettömyystyökalut ja
hakuvalintapaneelit.

## 4. Tavoitekontrakti (mitä esitysten indeksissä säilyy)

Säilyy (rakenteellinen relevanssi ja PF5-G2):

- Meta `title`, `PresentationYear`, `PresentationType`, `PresentationEvent`
- Filter-arvot: `Sisältö:Esitykset`, `FindExplore:presentations`, `Kieli`, `PresentationYear`,
  `PresentationType`, `PresentationTopic`, `PresentationContext`, `Research context`,
  `PresentationLandingType`, `PresentationMediaType`, `PresentationSourceType`,
  `PresentationResearchPreset`, `PresentationEvent`

Ei enää bodytekstinä indeksoitavaa:

- Meta-arvojen sisällöt (siirretty attribuuttimuotoon)
- `PresentationId`, `PresentationLandingUrl`, `PresentationIndexDocument`
- Painotettu duplikaattiotsikko-span (H1:ssä on jo `data-pagefind-weight="10"`)
- `scopeText`-liuska (find-explore seed nyt custom-recordien contentissa; katso §7)

## 5. Muutokset

### 5.1 `src/_includes/base.njk`

- `<main id="main-content">` sai `data-pagefind-body`-attribuutin. Yhtenäistää koko sivustoa
  koskevan indeksointirajauksen: navbar, footer, esteettömyystyökalut ja uutistickerit jäävät pois.
- `pagefindDocument.seedText` -span (find-explore seed publications/theses/writings) sai oman
  `data-pagefind-body`-attribuutin. Pagefind sallii useita `data-pagefind-body`-elementtejä samalla
  sivulla ja indeksoi kaikkien sisällön.

Syy jälkimmäiseen: kun `<main>` sai `data-pagefind-body`n, kaikki `<main>`:n ulkopuolinen teksti
jäi pois indeksistä. `pagefindDocument.seedText` sijaitsee `<body>`:n alkupäässä (ennen `<main>`)
kentän `Kieli`-suodattimen läheisyydessä. Se on tarpeen `find-explore.js`:n seed-kyselyille
(`__find_explore_publications__`, `__find_explore_theses__`) — ilman erillistä
`data-pagefind-body`:ä find-explore-sivupohjat lopettaisivat tulosten näyttämisen, kun käyttäjä
ei ole vielä kirjoittanut mitään.

### 5.2 `src/_includes/presentation-item.njk`

Lisätty `data-pagefind-ignore` neljälle esityksen kromielementille:

- `<p class="content-detail-eyebrow">` "Esitys tai opetusmateriaali" — SEO-hälytys, ei
  hakuosumaan sopivaa.
- `<div class="content-detail-meta">` — kompaktit merkinnät (source-label, päiväys, kieli,
  diamäärä) — ne on jo katettu meta/filter-arvoina.
- `<div class="content-detail-actions">` — "Avaa materiaali" + orientation-nav ei ole
  hakusisältöä.
- `<p class="content-detail-card-kicker">` "Esitys" — sama syy kuin eyebrow'lla.

Otsikko (`h1` painotus 10), lead-subtitle/description (painotus 6), Käyttöyhteys-kortin
metatiedot (Tilaisuus, Kohderyhmä, Opetuskonteksti, Opetusyhteys) ja kontekstisivupalkki
(kategoriat, avainsanat, related content) jäävät indeksoitavaksi normaalisti — nämä ovat
laillisia haun täsmäytyskohteita.

### 5.3 `scripts/_lib/presentationPagefind.js` — `buildPresentationPagefindInjection`

Muutettu injektion muotoa niin, että metadata luetaan attribuuteista, ei bodytekstistä. Lopputulos:

```html
<div hidden data-pagefind-ignore="all" data-presentation-pagefind-scope="presentations">
  <span data-pagefind-filter="Sisältö:Esitykset"></span>
  <span data-pagefind-filter="PresentationYear:2011"></span>
  …
  <span data-pagefind-meta="title:Mobiilioppimisesta - About Mobile learning"></span>
  <span data-pagefind-meta="PresentationType:presentation"></span>
  …
</div>
```

Poistettu injektiosta:

- `weightedTitleMarkup` (H1:ssä painotus 10 jo templatessa)
- `scopeText`-bareback `<span>` (find-explore seed säilyy custom-recordien content-tekstissä,
  ks. `buildPresentationCustomRecord`)

`data-pagefind-ignore="all"` on varmuudeksi: attribuuttimuotoiset filter/meta luetaan silti.

## 6. Todennettu käytös hotfixin jälkeen

Rebuild: `DISABLE_OG_IMAGES=true npx @11ty/eleventy && DISABLE_OG_IMAGES=true node scripts/run-pagefind.js`
→ `htmlDocumentsIndexed: 1459`, `presentationScopeLocalDocuments: 139`,
`presentationScopeCustomRecords: 79`.

Pagefind-tilanne FI-partitiossa:

- `pagefind.filters()['Sisältö']` = `{ Esitykset: 194, Julkaisut: 57, Kirjoitukset ja puheenvuorot: 234, Mediassa: 72, Opinnäytteet: 139 }`
- Kysely `mobiili` (Kieli=Suomi) → **66** tulosta (baseline 228), top-5:ssä esityksiä ja
  opinnäytteitä, kaikki excerptit ihmisluettavia (ei pipe-vuotoja).
- Kysely `tekoäly` (Kieli=Suomi) → 356 tulosta, Sisältö-facet katsottavissa (Esitykset 81,
  Julkaisut 57, Kirjoitukset ja puheenvuorot 13, Mediassa 70, Opinnäytteet 15).
- Seed-kyselyt `__find_explore_publications__` = 57 doc, `__find_explore_theses__` = 139 doc,
  `__find_explore_presentations__` = 63 (custom records).

Presentation-metadatakontrakti (`ss-mobiilioppimisesta-about-mobile-learning`):

```json
{
  "meta": {
    "PresentationType": "presentation",
    "PresentationYear": "2011",
    "title": "Mobiilioppimisesta - About Mobile learning",
    "image": "https://cdn.slidesharecdn.com/…"
  },
  "filters": {
    "FindExplore": ["presentations"],
    "Kieli": ["Suomi"],
    "PresentationTopic": ["Koulutusteknologia","mobiilioppiminen","sosiaalinen media","historia"],
    "PresentationType": ["presentation"],
    "PresentationYear": ["2011"],
    "Sisältö": ["Esitykset"]
  }
}
```

Otsikossa oleva kaksoispiste ei riko attribuutti-parsintaa (esim.
`Mobiililaitteet ja koulu: hypeä ja arkirealismia` palautuu meta.titlessa täydellisesti).

## 7. Regressiotestien tulos

Ajetut testit worktreessä (`hotfix/pagefind-index-hygiene`):

- `npm run test:unit` — 612 pass, 0 fail
- `tests/pf5-g2-presentations-shared-result.spec.js` — pass
- `tests/pf5-h1a-search-shell.spec.js` — pass
- `tests/pf5-h1b-progressive-facets.spec.js` — pass
- `tests/pf5-hotfix-search-state-facet-counts.spec.js` — pass
- `tests/pf5-hotfix-search-ui-regressions.spec.js` — pass
- `tests/pf-starter-chips.spec.js` — pass
- `tests/pf5-g1-navbar-modular-ui.spec.js` — pass (24 tests)
- `tests/f2-find-explore-smoke.spec.js` — pass
- `tests/f3a-theses-find-explore.spec.js` — pass
- `tests/f3b-publications-find-explore.spec.js` — 1 test aluksi flakysi rinnakkaiskuormituksessa
  ("EN publications Find & Explore resolves canonical local publication links"), passasi
  eristettynä uudelleenajolla. Tunnettu baseline-flake (`~33% rate`).

Yhteensä 95 passed, 1 flaky-pass eristettynä, 4 skipped.

Ei aiheutunut visuaalisia regressioita `presentation-item.njk`:hen tai `base.njk`:hen (vain
attribuuttilisäys `<main>`:iin ja seedText-spaniin — ei muutosta layoutille, tyyleille eikä
DOM-rakenteelle).

## 8. Rajaukset (mitä hotfix EI muuta)

- Kanoninen esitysdatamalli (`Canonical Content v1`, `withPresentationSemantics`, canonicaliteams)
  ei muutu.
- PF5-G2 filter-nimet ja meta-avaimet säilyvät (`Sisältö`, `PresentationYear`, `PresentationType`,
  `PresentationTopic`, `Research context`).
- Ei muutosta navbar-hakumodaaliin, /haku/-sivun H1A one-input rakenteeseen, H1B progressive
  facet-piiloihin, dark-teemakontrasteihin, tulosrivien tyhjänmerkkausrajoituksiin.
- Ei touchia find-explore Nunjucks-koodiin tai `src/js/find-explore.js`:ään.
- Ei muutosta Pagefindin `run-pagefind.js`:n custom-record-polkuihin tai käännösmerkintöihin.
- Ei työaseman uudelleenprosessointia — hotfix lataa muutokset seuraavan CI/deployn kautta.

## 9. Muutostiedostot

- `src/_includes/base.njk` (+2 attribuuttia)
- `src/_includes/presentation-item.njk` (+4 `data-pagefind-ignore` -attribuuttia)
- `scripts/_lib/presentationPagefind.js` (`buildPresentationPagefindInjection` yksinkertaistettu,
  siirretty meta attribuuttimuotoon, poistettu weightedTitleMarkup ja scopeText)

Yhteensä 3 tiedostoa, +9 -30 riviä.

## 10. Testauskomennot uusintaan

```bash
# HTML-rakennus + Pagefind-indeksin uusinta
DISABLE_OG_IMAGES=true npx @11ty/eleventy
DISABLE_OG_IMAGES=true node scripts/run-pagefind.js

# Unit-testit
npm run test:unit

# PF5 & find-explore regressio
PLAYWRIGHT_USE_STATIC_SERVER=true DISABLE_OG_IMAGES=true npx playwright test \
  tests/pf5-g1-navbar-modular-ui.spec.js \
  tests/pf5-g2-presentations-shared-result.spec.js \
  tests/pf5-h1a-search-shell.spec.js \
  tests/pf5-h1b-progressive-facets.spec.js \
  tests/pf5-hotfix-search-state-facet-counts.spec.js \
  tests/pf5-hotfix-search-ui-regressions.spec.js \
  tests/pf-starter-chips.spec.js \
  tests/f2-find-explore-smoke.spec.js \
  tests/f3a-theses-find-explore.spec.js \
  tests/f3b-publications-find-explore.spec.js \
  --workers=2

# Manuaalitesti: query "mobiili" /haku/ -sivulla → excerptit ihmisluettavia,
# Sisältö-pillit näyttävät 5 domainia.
```
