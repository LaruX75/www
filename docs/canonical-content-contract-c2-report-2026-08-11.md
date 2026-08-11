# Canonical Content Contract C2 Report

Date: 2026-08-11

## Scope

C2 jatkoi C1-auditista ilman runtime- tai UI-refaktoria.

Tavoite oli:

- lukita yhteiset arkkitehtuurisopimukset
- dokumentoida kenttien semantiikka
- lisata pieni shared structural validator
- standardoida parity gate -malli
- varmistaa, etta nelja nykyista pilottia pysyvat vihreina

## Delivered

### Added

- `docs/canonical-content-contract-v1.md`
- `src/_utils/validateProjectionContract.js`
- `tests/unit/canonicalContentContract.test.js`

### Updated

- `scripts/audit-publications-page-projection.js`

Muutos audit-skriptiin oli tarkoituksellinen C2-tason contract-fix:

- publications canonical `pageUrl` on nyt local detail URL
- vanha legacy-SSR kaytti anchor-URL:ia
- tama ero on nykyarkkitehtuurissa tarkoituksellinen, ei regressio
- scripti paivitettiin luokittelemaan tama `intentional difference` -luokkaan

Runtimea, UI:ta, CSS:aa, public endpoint -sopimusta tai client-kayttaytymista ei muutettu.

## Standardized Contracts

### STANDARDIZED

- architecture layers:
  - authoritative source
  - canonical internal object
  - consumer-specific projection
  - rendered/search projection
- stable identity principle
- `pageUrl = local canonical HTML projection`
- public allowlist principle
- projection structural invariants
- FI/EN shared identity/content-layer rule
- detail-page decision rule
- JSON-LD as metadata projection
- Pagefind as rendered-document consumer
- helper responsibility matrix
- parity gate model

### LEGACY / COMPATIBILITY

- `url`

Paatos:

- `url` sailyy compatibility-kenttana
- projection ei saa hiljaa vaihtaa sen merkitysta
- uudet contractit suosivat `pageUrl` + `sourceUrl` -ajattelua

### PROMISING / NEEDS MORE EVIDENCE

- `contentType` yhteisena pakollisena public fieldina kaikille projectioneille
- `sourceKey`
- `sourceLabel`
- `sourceUrl` yhtenaistettyna kaikissa neljassa pilotissa

### TYPE-SPECIFIC

- publication DOI/dedup/source-priority-logiikka
- writings `sectionKeys` / `recordOrigin`
- presentations `externalUrl` ja rikas metadata
- thesis-specific detail/abstract/citation-shape

### FUTURE ENHANCEMENT

- shared visibility-field
- universal JSON-LD generator
- universal serializer
- projection size optimization
- wider migration of audit scripts onto the new shared validator

## URL Semantics Decision

### Locked in C2

```text
pageUrl
= local canonical HTML projection

sourceUrl
= authoritative/original external source

url
= legacy / compatibility field
```

### Implications

- publications:
  - `pageUrl` = local detail
  - `url` = external/open target
- theses:
  - `pageUrl` = local detail
  - `url` = current compatibility source target
  - `sourceUrl` = OuluREPO
- writings:
  - `url` = consumer-visible primary link
  - `pageUrl` and `sourceUrl` remain supporting fields
- presentations:
  - `pageUrl` = local detail when present
  - `externalUrl` still carries source-like semantics in part of the model

Paivaus C2:ssa:

- `pageUrl` on nyt lukittu
- `url` ei ole viela poistettava
- `sourceUrl`-suunta on dokumentoitu mutta ei pakotettu kaikkiin tyyppeihin

## Source Semantics Decision

### STANDARDIZED AS CONCEPTS

- content identity
- source identity
- source display label
- source URL
- record/projection origin

### Not standardized as universal runtime fields

- `source`
- `sourceKey`
- `sourceLabel`
- `sourceUrl`
- `externalUrl`
- `recordOrigin`

Johtopaatos:

- käsitteet ovat nyt eksplisiittiset
- field-level yhdenmukaistus vaatii viela lisaevidenssia

## Shared Validator

Lisatty:

- `src/_utils/validateProjectionContract.js`

Validatorin vastuu:

- `count === items.length`
- duplicate IDs
- required fields
- allowlist violations
- invalid `lang`
- invalid local `pageUrl`
- canonical/projection ID parity

Validatorin rajaus:

- ei publication DOI-dedupia
- ei writings `sectionKeys`-logiikkaa
- ei presentation source mergea
- ei thesis abstract quality -paattelya

Luokitus:

- shared structural validator: `STANDARDIZED`
- type-specific parity logic: `TYPE-SPECIFIC`

## Helper Responsibility Matrix

### STANDARDIZED responsibilities

- `resolveContentMeta` = shared semantic resolver
- `toPublicContentRecord` = shared markdown-backed public serializer
- `contentSchema` = controlled vocabulary / collection rules
- `contentPresets` = query/filter definitions + endpoint map
- `content-engine` = browser-side projection consumer
- `presentationsPage` = presentation canonical/page builder
- `publicationsPage` = publication canonical builder + identity/dedup
- `publicationDetails` = publication detail resolver
- `theses` = authoritative source adapter + canonical thesis builder
- `thesisDetails` = thesis detail resolver
- `writingsPage` = writings page-level canonical builder
- `thesisIdentity` = stable thesis identity resolver

### Important guardrail

`helper != universal content engine`

C2 ei tuottanut mega-abstraktiota, ja se on oikea lopputulos.

## Visibility Assessment

Nykytila:

- `permalink`
- `eleventyExcludeFromCollections`
- `robots`
- redirect-pages
- `data-pagefind-ignore`

Arvio:

- shared visibility concept: `PROMISING / FUTURE ENHANCEMENT`
- evidence for immediate implementation: `insufficient`

Paatos:

- visibility-fieldia ei toteutettu

## Executed Validation

### Build

- `CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --quiet`
  - success
  - `Copied 266 Wrote 1455 files in 10.69 seconds`

### Unit tests

- `npm run test:unit`
  - success
  - `389/389 passed`

Sisaltaa muun muassa:

- uusi `canonicalContentContract.test.js`
- `presentationsPage.test.js`
- `publicationsPage.test.js`
- `publicationDetails.test.js`
- `thesesFeed.test.js`
- `thesisDetails.test.js`
- `writingsPage.test.js`
- `resolveContentMeta.test.js`
- `toPublicContentRecord.test.js`
- built-feed checks via `json-feeds.test.js`

### Existing audits

- `node scripts/audit-presentations-page-projection.js`
  - `ok: true`
- `node scripts/audit-publications-page-projection.js`
  - `ok: true`
- `node scripts/audit-publications-page-client-parity.js`
  - `ok: true`
- `node scripts/audit-publication-details-parity.js`
  - `ok: true`
- `node scripts/audit-en-publications-parity.js`
  - `ok: true`
- `node scripts/audit-thesis-details-parity.js`
  - `parityOk: true`
  - `169 detail pages / 169 canonical items`
- `node scripts/audit-thesis-pagefind.js`
  - `8/8 detailFound`
  - `8/8 detailTop1`
- `node scripts/audit-writings-page-projection.js`
  - `ok: true`
- `node scripts/audit-writings-fi-client-parity.js`
  - `ok: true`
- `node scripts/audit-writings-en-client-parity.js`
  - `ok: true`
- `node scripts/audit-writings-legacy-runtime.js`
  - `ok: true`
- `node scripts/audit-writings-built-output.js`
  - `ok: true`

### Not run

Playwright accessibility/navigation/contrast suitea ei ajettu, koska C2 ei muuttanut renderointia, UI:ta tai runtime-kayttaytymista.

## Regressions

### None in runtime/UI

Audit- ja testiajot eivat osoittaneet regressioita neljassa pilotissa.

### One contract-layer false positive fixed

`scripts/audit-publications-page-projection.js`:

- ennen C2-paivitysta false negative `ok: false`
- syy: local detail `pageUrl` tulkittiin parity-rikkomukseksi suhteessa legacy anchor-URL:iin
- C2:ssa tama muutettiin intentional contract difference -luokkaan

Luokitus:

- `STANDARDIZED`: `pageUrl` local canonical detail URL
- `LEGACY / COMPATIBILITY`: legacy anchor-based SSR comparison

## Remaining Technical Debt

### B — Important consolidation

- `url`-semantiikka on edelleen type-overloaded
- `sourceKey/sourceLabel/sourceUrl` tarvitsee lisaevidenssia ennen field-level standardointia
- kaikki audit-scriptit eivat viela kayta uutta shared validatoria

### C — Cleanup

- osa audit-skripteista toistaa edelleen omaa allowlist/parity-boilerplateaan
- `toPublicContentRecord`-kommentit antavat laajemman kattavuuskuvan kuin nykyinen toteutus

### D — Future enhancement

- visibility contract
- wider validator adoption
- universal JSON-LD abstraction, jos se joskus osoittautuu turvalliseksi
- projection-size optimization

## Conclusion

C2 on vihrea.

Tarkeimmat tulokset:

- canonical content architecture on nyt dokumentoitu eksplisiittiseksi contractiksi
- `pageUrl`-semantiikka on lukittu
- `url` on eksplisiittisesti legacy/compatibility field
- source semantics on eroteltu kasitetasolla
- shared structural validator on olemassa
- parity gate -malli on dokumentoitu
- nelja nykyista pilottia pysyvat vihreina

Tama checkpoint ei tehnyt arkkitehtuurista abstraktimpaa.

Se teki jo toimivasta arkkitehtuurista selkeamman, testattavamman ja toistettavamman.
