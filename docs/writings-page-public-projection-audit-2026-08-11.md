# Writings Page Public Projection Audit

Date: 2026-08-11

## Endpoint

W1 lisäsi uuden allowlist-pohjaisen endpointin:

- `/data/writings-page.json`

Lähdekoodi:

- `src/_data/writingsPage.js`
- `src/data/writings-page.json.11ty.js`

## Public Contract

Endpointin ulkokuori:

```json
{
  "version": 1,
  "generatedAt": "...",
  "count": 290,
  "items": [ ... ]
}
```

Auditissa vahvistettu:

- `count === items.length`
- JSON on validi
- item-ID:t ovat yksilöllisiä
- `pageUrl`-arvot ovat yksilöllisiä silloin kun ne ovat olemassa
- allowlistin ulkopuolisia kenttiä ei vuoda

## Allowlist

Projectionin eksplisiittinen allowlist on:

- `id`
- `contentType`
- `sectionKeys`
- `source`
- `sourceKey`
- `sourceLabel`
- `recordOrigin`
- `title`
- `description`
- `date`
- `year`
- `lang`
- `url`
- `pageUrl`
- `sourceUrl`
- `isExternal`
- `categories`
- `keywords`
- `authors`
- `authorsText`
- `publication`
- `publicationType`
- `journal`
- `publisher`
- `type`
- `typeCode`
- `publicationGroup`
- `event`
- `forum`
- `speechContext`
- `speechKind`
- `meeting`
- `meetingDate`
- `initiativeType`
- `writingRoles`
- `opinionRoles`
- `taxonomyTypeKey`
- `taxonomyTypeLabel`
- `doi`
- `doiUrl`
- `volume`
- `issue`
- `pages`

## Output Summary

Rakennetun endpointin item-määrä:

- `290`

`contentType`-jakauma:

- `statement`: 6
- `speech`: 92
- `initiative`: 10
- `scientificPublication`: 56
- `opinion`: 47
- `blogPost`: 70
- `column`: 9

`sectionKeys`-jakauma:

- `statements`: 6
- `speeches`: 92
- `publicSpeeches`: 13
- `initiatives`: 10
- `publications`: 56
- `opinions`: 47
- `blog`: 70
- `columns`: 9

`sourceKey`-jakauma:

- `local`: 218
- `researchfi`: 53
- `facebook`: 16
- `manual`: 3

## Parity Result

`node scripts/audit-writings-page-projection.js` tulos:

- `ok: true`

Parity-tulkinta:

- FI current runtime subset parity: green
- FI SSR source: `finnishWritingsPage`
- FI JS-on source: `/data/writings-page.json` (`source: 'writings'`)
- EN SSR source: `englishWritingsPage`
- EN JS-on source: `/data/writings-page.json` (`source: 'writings'`)
- EN current runtime parity: green, kun huomioidaan intentional scientific-publication-diffs

Intentional EN scientific publication differences:

- 3 Research.fi duplicate/variant-title -tapausta poistuu canonical dedupissa
- 3 manual publication fallback -itemiä tulevat canonical datasettiin nykyisen EN-runtime-feedin ulkopuolelta

## Build And Test Result

Suoritetut ajot:

```bash
node --test tests/unit/writingsPage.test.js
CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --quiet
node scripts/audit-writings-page-projection.js
node scripts/audit-writings-fi-client-parity.js
node scripts/audit-writings-en-client-parity.js
node scripts/audit-writings-legacy-runtime.js
```

Tulokset:

- unit tests: pass
- cache-only build: pass
- projection audit: pass
- FI client parity audit: pass
- EN client parity audit: pass
- legacy runtime audit: pass

Build loi artefaktin:

- `_site/data/writings-page.json`

## W2/W4 Outcome

W2-W4 eivät muuttaneet endpoint-contractia, mutta tekivät siitä sekä FI- että EN-writings-sivujen runtime-lähteen ja lukitsivat writings-runtime-cleanupin ilman UI-muutosta.

Toteutunut tila:

- canonical public projection säilyi allowlist-pohjaisena
- FI SSR ja JS-on käyttävät samaa canonical sourcea
- EN SSR ja JS-on käyttävät samaa canonical sourcea
- FI visible subset säilyi `126` itemissä
- EN visible set käyttää canonical `290` itemin joukkoa
- writings-runtimeen ei jäänyt tunnettuja legacy-feed-polkuja
- subset-sääntö on eksplisiittinen compatibility projection:
- `blogPost`
- `opinion`
- `column`

## Remaining Legacy After W4

Jäljellä W4:n jälkeen:

- `materials`-kortin erillinen sivutason laskenta
- mahdolliset writings-sivujen ulkopuoliset dead legacy-haarat

Tämä on tarkoituksellista. W4:n tehtävä oli siivota writings-runtime, ei poistaa shared feed -infrastruktuuria tai muuttaa `materials`-osiota item-tasoiseksi writings-listaksi.

W4:n materials-sääntö:

> `materials` is a page-level summary/navigation element, not an itemized writings content section and therefore is not required to be represented as items in `writingsPage.items`.
