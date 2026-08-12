# Writings FI Client Parity

Date: 2026-08-11

## Scope

Tämä raportti dokumentoi W2-checkpointin parity-portin:

- FI `/kirjoitukset/` SSR
- FI `/kirjoitukset/` JS-on
- canonical writings page projection

Rajaus:

- ei EN-muutoksia
- ei UI-muutoksia
- ei FI näkyvän sisältöjoukon laajennusta canonical `290` itemiin

## Compatibility Rule

FI näkyvä joukko johdetaan canonical writings datasetistä tällä yhteensopivuussäännöllä:

- `contentType = blogPost`
- `contentType = opinion`
- `contentType = column`

Tärkeä huomio:

- tämä on compatibility projection
- ei canonical writings datasetin pysyvä sisältömääritelmä

## Canonical Source

FI SSR:

- `src/kirjoitukset.11tydata.js`
- `finnishWritingsPage`

FI JS-on:

- `ContentEngine.query({ source: 'writings', ... })`
- endpoint: `/data/writings-page.json`

## Parity Result

`node scripts/audit-writings-fi-client-parity.js` tulos:

- `ok: true`

Count parity:

- legacy visible total: `126`
- canonical compatibility total: `126`

Type parity:

- `blogPost`: `70`
- `opinion`: `47`
- `column`: `9`

Order parity:

- opinions: green
- columns: green
- blog posts: green

SSR opening parity:

- opinions opening 5: green
- columns opening 5: green
- blog opening 5: green

Runtime source parity:

- kaikki näkyvät FI client-queryt käyttävät `source: 'writings'`
- vanhat `content` / `publications`-runtimehaut poistettu
- `parseJson(...)` / `pub-data` legacy-runtime poistettu FI-sivulta

## Notable Fix During W2

Audit paljasti yhden puuttuvan blogikirjoituksen canonical writings -kerroksesta:

- `/2024/10/21/sivista-blogi-tekoaly-on-tyokaverini/`

Korjaus:

- shared writings -keräys laajennettiin huomioimaan myös `collections.content`
- canonical total palautui `289` -> `290`
- FI compatibility total palautui `125` -> `126`

## Verification

Suoritetut ajot:

```bash
node --test tests/unit/writingsPage.test.js
CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --quiet
node scripts/audit-writings-page-projection.js
node scripts/audit-writings-fi-client-parity.js
```

Tulokset:

- unit tests: pass
- cache-only build: pass
- projection audit: pass
- FI client parity audit: pass
