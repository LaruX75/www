# Writings EN Client Parity

Date: 2026-08-11

## Scope

Tämä raportti dokumentoi W3-checkpointin parity-portin:

- EN `/en/writings/` SSR
- EN `/en/writings/` JS-on
- canonical writings page projection

Rajaus:

- ei FI scope-muutoksia
- ei UI-muutoksia
- ei uuden EN-visible-subsetin keksimistä

## Canonical Source

EN SSR:

- `src/en/writings.11tydata.js`
- `englishWritingsPage`

EN JS-on:

- `ContentEngine.query({ source: 'writings', ... })`
- endpoint: `/data/writings-page.json`

## Runtime Scope

EN käyttää canonical writings datasetin koko näkyvää joukkoa:

- canonical total: `290`
- EN visible total: `290`

Section counts:

- statements: `6`
- opinions: `47`
- columns: `9`
- initiatives: `10`
- speeches: `92`
- public speeches: `13`
- blog posts: `70`
- scientific publications: `56`

## Legacy Baseline Versus Canonical

Vanhan EN-runtime-maailman feedit olivat:

- `/data/publications.json`
- `/data/initiatives.json`
- `/data/content.json`
- `/data/researchfi.json`

W3-parityssä nämä verrattiin canonical datasettiin.

Täysi exact parity toteutui:

- statements
- opinions
- columns
- initiatives
- speeches
- blog posts

Scientific publications -vertailussa hyväksyttiin aiemmin dokumentoidut tarkoitukselliset erot:

- 3 Research.fi-duplicate/variant-title -tapausta poistuu canonical dedupissa
- 3 manual publication fallback -itemiä tulevat canonical datasettiin mukaan

Muita unexplained-diffejä ei jäänyt.

## SSR Parity

Rakennetun HTML:n SSR-parity oli vihreä:

- statements full table: green
- public speeches full table: green
- opinions opening 5: green
- columns opening 5: green
- initiatives opening 5: green
- speeches opening 5: green
- blog opening 5: green

## Client Runtime Parity

`node scripts/audit-writings-en-client-parity.js` tulos:

- `ok: true`

Runtime source parity:

- kaikki writings-client-haut käyttävät `source: 'writings'`
- suorat legacy-fetchit poistettu:
- `/data/publications.json`
- `/data/initiatives.json`
- `/data/content.json`
- `/data/researchfi.json`
- source-kohtaiset raw mapper -haarat poistettu writings-runtime-polusta

Yksi tärkeä rajaus säilytettiin tarkoituksella:

- scientific publications -taulukko ei ala tässä checkpointissa hiljaisesti ohjata local detail -sivuille niissä tapauksissa, joissa vanha EN-runtime ei tarjonnut ulkoista URL:ia

## Verification

Suoritetut ajot:

```bash
node --test tests/unit/writingsPage.test.js
CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --quiet
node scripts/audit-writings-page-projection.js
node scripts/audit-writings-en-client-parity.js
```

Tulokset:

- unit tests: pass
- cache-only build: pass
- projection audit: pass
- EN client parity audit: pass
