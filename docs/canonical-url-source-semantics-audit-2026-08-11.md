# Canonical URL & Source Semantics Audit

Date: 2026-08-11

## 1. Executive summary

Repo tukee nyt neljaa onnistunutta canonical content -pilottia, mutta URL-semantics ei ole viela site-wide yhtenainen samalla tavalla kuin `pageUrl`-contract. Vahvin yhteinen saanto on:

- `pageUrl` = local canonical HTML projection
- `sourceUrl` = authoritative/original external source
- `url` = legacy / compatibility / consumer-primary link

Kaytannossa `pageUrl` on neljassa pilotissa jo vahva ja paosin yhdenmukainen. `sourceUrl` on oikein kaytossa etenkin opinnaytteissa ja osassa kirjoitus- ja esitysputkia, mutta julkaisuissa sen roolia kantavat edelleen usein `url`, `externalUrl` tai `referenceUrl`.

Keskeinen johtopaatos on, etta `url`-kentalla on useita elavia semanttisia merkityksia. Sita ei voi turvallisesti poistaa C3:n evidenssin perusteella. Oikea suositus on pitaa `url` dokumentoituna compatibility alias -kenttana ja tehda mahdollinen C4 kuluttajamigraationa, ei field-removalina.

## 2. Contract baseline

C2 lukitsi seuraavan baseline-semanticsin:

```text
pageUrl
= sivuston paikallinen canonical HTML -URL

sourceUrl
= authoritative/original external source

url
= legacy / compatibility field
```

Rakenteellinen validatori [src/_utils/validateProjectionContract.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_utils/validateProjectionContract.js:1) tarkistaa edelleen vain:

- duplicate identityt
- allowlist-rikkomukset
- required fieldit
- `lang`-validiteetin
- local `pageUrl` -muodon
- projection parityn

Se ei sisalla content-type-, source-, DOI-, redirect- tai JSON-LD-logiikkaa, mika on C3:n kannalta oikea rajaus.

## 3. Pilot comparison

| Concern | Presentations | Publications | Theses | Writings |
| --- | --- | --- | --- | --- |
| `url` meaning | primary open/public target; joskus local detail, usein external | external/open target | OuluREPO compatibility target | consumer-visible primary link |
| `pageUrl` meaning | local presentation detail when one exists | local publication detail | local thesis detail | local page when one exists |
| `sourceUrl` meaning | original/source URL etenkin local presentation recordsissa | ei public page projectionin ensiluokan kentta | original OuluREPO URL | original source when meaningful |
| `externalUrl` | type-specific source/open target etenkin video- ja material-cardeissa | detail modelissa `externalUrl` | ei kaytossa | ei kaytossa |
| canonical HTML URL | local detail route | local detail route | local detail route | local page route |
| external source | SlideShare / Canva / YouTube / muu ulkoinen | DOI / journal / manual source | OuluREPO | sourceUrl / external media outlet |
| public projection | `/data/presentations-page.json` | `/data/publications-page.json` | `/data/theses.json` | `/data/writings-page.json` |
| detail page | osalla itemeista | kaikilla canonical Research.fi detail-sivuilla | kaikilla 169 | local content only / publication items detailin kautta |
| client consumer | `src/js/presentations-page.js` | `src/julkaisut.njk`, `src/en/publications.njk` inline JS | `src/opinnaytteet.njk`, `src/en/theses.njk` | `src/kirjoitukset.njk`, `src/en/writings.njk` |

Johtopaatos: `pageUrl` toteutuu piloteissa paremmin kuin `sourceUrl`. `url` ei ole pilottien valilla yksi kentta yhdella merkityksella.

## 4. URL vocabulary

Auditissa esiintyvat erilliset URL-kasitteet ovat:

- `LOCAL_PAGE`: paikallinen HTML-dokumentti, esim. `/opinnaytteet/62907/`
- `EXTERNAL_SOURCE`: authoritative/original external source, esim. OuluREPO, SlideShare, journal article page
- `CANONICAL_METADATA`: absoluuttinen canonical identity, esim. `https://www.jarilaru.fi/opinnaytteet/62907/`
- `IDENTIFIER_RESOLVER`: DOI-resolveri tai muu identifier-based landing URL
- `NAVIGATION`: valikko- ja UI-linkit, esim. `headerNav.url`
- `COMPATIBILITY`: legacy/public-kentta jonka merkitys riippuu consumerista
- `AMBIGUOUS`: kentta tai helper, joka pystyy edustamaan useampaa kuin yhta ylla olevista ilman eksplisiittista intenttia

Repo-wide `url`-kentan merkityksia on kaytannossa viisi:

1. `LOCAL_PAGE`
2. `EXTERNAL_SOURCE`
3. `IDENTIFIER_RESOLVER`
4. `NAVIGATION`
5. `COMPATIBILITY / PRIMARY_LINK`

## 5. `pageUrl` audit

### Status by pilot

- Presentations: `CONTRACT-COMPLIANT`
- Publications: `CONTRACT-COMPLIANT`
- Theses: `CONTRACT-COMPLIANT`
- Writings: nykyinen output `CONTRACT-COMPLIANT`, mutta builder-tasolla yksi `AMBIGUOUS` riskikohta

### Evidence

- [src/data/theses.json.11ty.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/data/theses.json.11ty.js:52) julkaisee `pageUrl`-kenttana local detailin ja `sourceUrl`-kenttana OuluREPO-linkin.
- [src/_data/thesisDetails.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/thesisDetails.js:71) rakentaa detail-mallin samalla erottelulla.
- [src/_data/publicationsPage.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/publicationsPage.js:338) rakentaa `pageUrl`-kentaksi canonical detail-URL:n ja `url`-kentaksi external open targetin.
- [src/_data/presentationsPage.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/presentationsPage.js:455) julkaisee `pageUrl` vain local-detail-capable itemeille.
- [docs/writings-page-public-projection-audit-2026-08-11.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/docs/writings-page-public-projection-audit-2026-08-11.md:18) vahvistaa nykyisen outputin `pageUrl`-uniikkiuden.

### Notable risk

[src/_data/writingsPage.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/writingsPage.js:159) sisaltaa helperin:

```text
localPageUrl(record) = pageUrl || url
```

Nykyisessa datassa tama tuottaa local routeja, koska shared content -recordit ovat Eleventy-itemeita joiden `url` on paikallinen. Semanttisesti se on silti hauras: jos joku future record toisi external `url`:n ilman eksplisiittista `pageUrl`:ia, writings-projection voisi rikkoa C2-contractin. Tämä on `AMBIGUOUS IMPLEMENTATION`, ei nykyinen output-regressio.

## 6. `sourceUrl` audit

### Missa `sourceUrl` on jo oikein kaytossa

- Theses feed: [src/data/theses.json.11ty.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/data/theses.json.11ty.js:68)
- Thesis detail model: [src/_data/thesisDetails.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/thesisDetails.js:80)
- Shared public content serializer: [src/_utils/toPublicContentRecord.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_utils/toPublicContentRecord.js:116)
- Writings page projection shared content branch: [src/_data/writingsPage.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/writingsPage.js:223)
- Presentations local-source merge path: [src/_data/presentationsPage.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/presentationsPage.js:597)
- Knowledge graph external Canva merge: [src/_data/knowledgeGraph.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/knowledgeGraph.js:502)

### Missa sama rooli elaa eri nimilla

- `externalUrl` presentations-rakenteessa
- `referenceUrl` researchfiContent-rakenteessa
- `url` publications-page projectionissa
- `doiUrl` identifier-resolverina, ei automaattisesti `sourceUrl`:na

### Johtopaatos

`sourceUrl` on konseptina vahva mutta ei viela site-wide standardi samalla tavalla kuin `pageUrl`. Julkaisut ja esitykset kayttavat yha alias-kenttia sen sijaisena.

## 7. `url` compatibility audit

Merkittavat `url`-semantiikat:

| Producer / layer | `url` meaning | Classification | Preferred future field |
| --- | --- | --- | --- |
| `page.url` / Eleventy collection items | local page route | `LOCAL_PAGE` | `pageUrl` vain jos serialisoidaan public-recordiksi |
| `/data/theses.json` | OuluREPO source | `EXTERNAL_SOURCE` + `COMPATIBILITY` | `sourceUrl` |
| `/data/publications-page.json` | external/open target | `COMPATIBILITY` | `sourceUrl` tai `externalUrl` consumer intentin mukaan |
| `/data/writings-page.json` | consumer-visible primary link | `COMPATIBILITY` | `pageUrl` tai `sourceUrl` case-by-case |
| `/data/presentations-page.json` | public/open target; joskus local page | `COMPATIBILITY` | `pageUrl` + `sourceUrl` + `externalUrl` eksplisiittisesti |
| `headerNav.url` | UI navigation target | `NAVIGATION` | `href` / nav-specific key |
| `researchfiContent.url` | local publication detail | `LOCAL_PAGE` | `pageUrl` jos joskus serialisoidaan samaan contractiin |
| `publication.url` when DOI-only | resolver landing URL | `IDENTIFIER_RESOLVER` | `doiUrl` + mahdollinen `sourceUrl` |

`url` ei siis ole yksi fieldi yhdella merkityksella, vaan aktiivinen compatibility-kerros usealle consumerille.

## 8. Source identity audit

Tavoitemalli:

```text
sourceKey   = machine-stable source identity
sourceLabel = human-readable source name
sourceUrl   = authoritative source address
recordOrigin = builder/runtime provenance
```

Nykytila:

- Presentations: `sourceKey` ja `sourceLabel` ovat vahvoja, mutta `sourceUrl` elaa osin `externalUrl`- ja `publicUrl`-kenttien rinnalla.
- Publications: `sourceKey=researchfi/manual` on selkea, mutta external identity on edelleen usein `url` tai `referenceUrl`.
- Theses: `sourceLabel=OuluREPO`, `sourceUrl=link` on jo semanttisesti siisti.
- Writings: `sourceKey/local|researchfi|manual|facebook` on hyva, mutta consumerit katsovat silti eniten `url`-kenttaa.

Ei loytynyt nayttoa siita, etta `sourceKey` ja `sourceUrl` menisivat jo systemaattisesti sekaisin. Sen sijaan sama original-source-rooli elaa usealla eri field-nimella.

## 9. Public projection audit

### `/data/presentations-page.json`

- `pageUrl`: local presentation page when available
- `url`: public/open target
- `sourceUrl`: canonical page-recordeissa original source
- `externalUrl`: type-specific external target etenkin video/material-cardeissa

### `/data/publications-page.json`

- `pageUrl`: local publication detail
- `url`: external/open target
- `sourceUrl`: ei mukana page projectionissa
- `doiUrl`: identifier resolver

### `/data/theses.json`

- `pageUrl`: local thesis detail
- `url`: OuluREPO compatibility target
- `sourceUrl`: OuluREPO authoritative/original source

### `/data/writings-page.json`

- `pageUrl`: local page when one exists
- `url`: consumer-visible primary link
- `sourceUrl`: original source when meaningful
- publications-subsetissa `sourceUrl` johdetaan publication `url` / `doiUrl` -kentasta

Keskeinen vastaus auditin paakysymykseen:

> Voiko feed-kuluttaja paatella kentan nimesta, onko linkki local navigation vai original source?

Vastaus on:

- `pageUrl`: kylla, paosin voi
- `sourceUrl`: usein voi
- `url`: ei voi
- `externalUrl`: vain presentations-spesifissa kontekstissa

## 10. Consumer dependency matrix

| Producer | Field | Meaning | Consumers | Preferred field | Migration risk |
| --- | --- | --- | --- | --- | --- |
| theses feed | `url` | OuluREPO source | thesis archive JS, legacy tests, embedding inputs | `sourceUrl` | medium |
| theses feed | `pageUrl` | local detail | FI/EN thesis archive | `pageUrl` | low |
| publications page | `url` | open publication target | FI/EN publication tables, open buttons | `sourceUrl` or `externalUrl` | high |
| publications page | `pageUrl` | local detail | detail parity, schema, future local-nav migration | `pageUrl` | low |
| writings page | `url` | visible primary link | FI/EN writings SSR + JS | split to `pageUrl` / `sourceUrl` | high |
| writings page | `sourceUrl` | original source | EN visible-link helper, provenance logic | `sourceUrl` | medium |
| presentations page | `url` | primary public/open target | `src/js/presentations-page.js`, EN presentations inline JS | `pageUrl` for local nav, `externalUrl` or `sourceUrl` for source nav | high |
| presentations page | `pageUrl` | local presentation detail | local page buttons, detail routing | `pageUrl` | low |
| presentations page | `externalUrl` | source/open external target | secondary actions, YouTube buttons | `externalUrl` | medium |
| researchfiContent | `url` | local publication detail | taxonomy/grouping virtual items | `pageUrl` if projected publicly | low |
| shared collections | `item.url` | local Eleventy route | taxonomy pages, sitemap, related content | keep `item.url` internally | low |
| content feed / embeddings | `url` | record identity key for rich-source maps | embedding builder, transcript/body maps | stable local identity key | high |
| knowledge graph | `url` | node URL / public URL | graph dedup fallback, external Canva merge | explicit `pageUrl` + `sourceUrl` pair | medium |

## 11. Template/client audit

### Local vs external navigation already separated

- Theses FI/EN templates: [src/opinnaytteet.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/opinnaytteet.njk:410) and [src/en/theses.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/theses.njk:313) use:
  - `detailLink = t.pageUrl`
  - `sourceLink = t.sourceUrl || t.url`

Tama on hyva consumer pattern.

### Consumers still blocked on `url`

- Publications FI/EN SSR and inline JS:
  - [src/julkaisut.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/julkaisut.njk:401)
  - [src/en/publications.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/publications.njk:198)
- Presentations runtime:
  - [src/js/presentations-page.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/js/presentations-page.js:411)
  - [src/en/presentations.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/presentations.njk:388)
- Writings runtime:
  - [src/kirjoitukset.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/kirjoitukset.njk:597)
  - [src/en/writings.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/writings.njk:701)

### Classification

- `pageUrl || url` fallback:
  - theses: `REQUIRED COMPATIBILITY`
  - writings: `AMBIGUOUS`, but currently intentional
  - presentations: `REQUIRED COMPATIBILITY`
- direct `pub.url` in publications templates:
  - `NEEDS CONSUMER MIGRATION FIRST`
- old EN presentation helper `primaryUrl(item)`:
  - `DEAD LEGACY` arkkitehtuurisesti, mutta elossa runtime-consumerina

## 12. Canonical metadata audit

Canonical metadata muodostetaan local page identitysta, ei source-linkeista:

- [src/_includes/_meta.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_includes/_meta.njk:87)
  - `pageUrl = page.url | absoluteUrl(site.url ...)`
  - `<link rel="canonical" href="{{ pageUrl }}">`
  - `og:url = pageUrl`

Tama on C3:n kannalta vihrea. Auditissa ei loytynyt tapauksia, joissa canonical metadata olisi muodostettu vahingossa `sourceUrl`:sta tai legacy-`url`:sta.

## 13. JSON-LD audit

[src/_includes/_ldschema.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_includes/_ldschema.njk:29) noudattaa paosin oikeaa erottelua:

- `@id` / `url` = local canonical document identity
- `mainEntityOfPage` = local page
- `sameAs` = external/source identity where appropriate

Esimerkit:

- article-like content:
  - `@id = pageUrl`
  - `url = pageUrl`
  - `sameAs = sourceUrl / externalUrl`
- thesis:
  - `@id = pageUrl`
  - `sameAs = thesisSchemaSameAs`
- presentation:
  - `@id = pageUrl`
  - `sameAs = [url]`

JSON-LD-riskina ei ole local/source identityn sekoittuminen, vaan presentations-puolella `sameAs` voi osoittaa public/open targetiin, joka ei aina ole sama kuin authoritative source. Tämä on semanttinen tarkennustarve, ei valiton SEO-regressio.

## 14. Redirect audit

Auditissa loytyi kaksi eri redirect-semanticsia, joita ei pidä sekoittaa:

### Old local URL -> new local canonical page

- publication manual fallback -> Research.fi canonical detail
  - [src/_data/publicationDetails.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/publicationDetails.js:175)

Tama on oikea canonical migration redirect.

### Local page -> another local hub / legacy page

- EN legacy scientific publications redirect
  - [src/en/scientific-publications.njk](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/en/scientific-publications.njk:1)

Tama on local-to-local neutralization, ei external source redirect.

Auditissa ei loytynyt merkittavaa patternia, jossa canonical local page ohjaisi automaattisesti suoraan external sourceen tavalla, joka hajoittaisi local identityn.

## 15. Identifier URL audit

Ulkoiset URL:t eivat ole sama kasite. Auditissa erotettavat roolit ovat:

| Field / value | Type |
| --- | --- |
| `doiUrl` | `IDENTIFIER_RESOLVER` |
| Research.fi person/publication URL | `SOURCE` tai `NAVIGATION`, riippuen consumerista |
| OuluREPO handle/link | `SOURCE` |
| SlideShare URL | `SOURCE` / `MEDIA` |
| Canva source URL | `SOURCE` |
| Canva public URL | `NAVIGATION` / public-open target |
| YouTube watch/playlist URL | `MEDIA` + open target |
| `page.url` local route | `LOCAL_PAGE` |

Erityisen tarkea huomio:

- DOI-resolveri ei ole automaattisesti sama asia kuin `sourceUrl`
- presentations-puolella `publicUrl`, `sourceUrl` ja `externalUrl` eivat ole vaihdettavia synonyymeja

## 16. Compatibility debt

### A - KEEP AS LEGACY CONTRACT

- `/data/theses.json:url`
- `/data/publications-page.json:url`
- `/data/writings-page.json:url`
- `/data/presentations-page.json:url`
- `api/export-data.json:url`

### B - SAFE TO REPLACE WITH `pageUrl`

- consumerit, joiden tarkoitus on local detail navigation ja joilla `pageUrl` on aina saatavilla
- thesis archive detail buttons ovat kaytannossa jo talla polulla

### C - SAFE TO REPLACE WITH `sourceUrl`

- thesis source/open-link consumers
- writings consumers, jotka eksplisiittisesti haluavat original source -linkin eivatka local landing pagea

### D - NEEDS CONSUMER MIGRATION FIRST

- publications FI/EN runtime
- presentations FI/EN runtime
- writings FI/EN mixed link helpers
- embeddings rich-source lookups keyed by `item.url`
- knowledge graph URL fallback logic

### E - AMBIGUOUS / NEEDS DESIGN DECISION

- writings `localPageUrl(record) = pageUrl || url`
- presentations `url` vs `externalUrl` vs `sourceUrl` triad
- publications page projection without public `sourceUrl`

### F - DEAD LEGACY

- EN legacy scientific publications page as standalone destination is already effectively dead; current file is a redirect shell

## 17. Migration graph

Turvallinen etenemisjarjestys C3-evidenssin perusteella:

```text
document field intent
        ↓
classify consumers by link intent
        ↓
migrate local-navigation consumers to pageUrl
        ↓
migrate original-source consumers to sourceUrl / externalUrl
        ↓
keep url as compatibility alias
        ↓
measure remaining consumers
        ↓
decide whether any public contract can narrow url safely
        ↓
possible later deprecation
```

Tarkea ei-suositus:

```text
DO NOT:
pageUrl + sourceUrl audit
        ↓
remove url globally
```

Repo-evidenssi ei tue sita.

## 18. Architecture blockers

Varsinaisia severe canonical/SEO-blockereita ei loytynyt.

Loydetyt arkkitehtuuririskit:

1. Writings builderin `pageUrl || url` fallback on semanttisesti hauras.
2. Presentations runtime on edelleen vahvasti `url`-vetoinen, vaikka datasetissa on jo `pageUrl` ja `externalUrl`.
3. Publications page projection ei julkaise `sourceUrl`:ia eksplisiittisesti, vaikka internal canonical layer jo erottaa local detailin ja external targetin.
4. Embedding- ja knowledge-graph-putket kayttavat `url`-kenttaa identity-/lookup-avaimena, mika tekee URL-removalista korkean riskin.

Namit eivat ole C3:ssa korjattavia, mutta ne estavat `url`-kentan nopean poistamisen.

## 19. Recommendation

Suositus `url`-kentalle:

```text
KEEP AS DOCUMENTED COMPATIBILITY ALIAS
```

Perustelut:

- `pageUrl` + `sourceUrl` eivat viela kata kaikkia elavia consumer-semanticsia ilman migraatiota.
- Osa consumerista tarvitsee edelleen yhden "avaa tama" -kenttan, vaikka kohde vaihtelee sisaltotyypeittain.
- Repo-wide kaytto ei osoita turvallista yhteista future meaningia `url`-kentalle.

Siksi vaihtoehdoista:

- A - remove: ei turvallinen nyt
- B - compatibility alias: suositus
- C - one explicit future meaning: ei viela riittavaa evidenssia

## 20. Proposed C4

Suositeltu seuraava checkpoint:

### C4 - Consumer Intent Migration Audit

Rajaus:

- ei public feed contract -muutosta ensin
- ei `url`-kentan poistamista
- ensin local-vs-external consumer intent -kartta runtimeissa

Tarkka tavoite:

1. luokittele kaikki elavat `url`-kuluttajat kolmeen ryhmaan:
   - local navigation
   - original/source navigation
   - compatibility/open target
2. migraatiokelpoinen local navigation siirretaan lukemaan `pageUrl`
3. migraatiokelpoinen source navigation siirretaan lukemaan `sourceUrl` tai type-specific `externalUrl`
4. `url` jatkaa compatibility aliasina kunnes jaljella olevat consumerit on mitattu

Ensisijaiset C4-kohteet:

- `src/julkaisut.njk`
- `src/en/publications.njk`
- `src/js/presentations-page.js`
- `src/en/presentations.njk`
- `src/kirjoitukset.njk`
- `src/en/writings.njk`
- embedding/knowledge-graph URL identity audit erillisena alavaiheena

Tama olisi hallittu consumer-migraatio, ei field-removal PR.
