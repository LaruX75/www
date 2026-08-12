# Writings Legacy Runtime Audit

Date: 2026-08-11

## Scope

Tämä audit dokumentoi W4-checkpointin:

- FI `/kirjoitukset/`
- EN `/en/writings/`
- canonical `writingsPage.items`
- `materials`-osion tarkoituksellisen poikkeuksen

## Runtime Result

W4:n jälkeen writings-runtime voidaan kuvata näin:

```text
writingsPage
     ↓
writingsPage.items
     ↓
/data/writings-page.json
     ↓
FI /kirjoitukset/
EN /en/writings/
```

FI käyttää edelleen compatibility projectionia:

- `blogPost`
- `opinion`
- `column`

EN käyttää canonical visible setiä:

- `290` itemiä

## Legacy Cleanup Result

`node scripts/audit-writings-legacy-runtime.js` tarkistaa, ettei writings-runtimeen ole jäänyt tunnettuja vanhoja rinnakkaisia polkuja.

Tarkistettuja legacy-signaaleja ovat esimerkiksi:

- `parseJson`
- `pub-data`
- `mielipiteet-data`
- `lausunnot-data`
- `kolumnit-data`
- `aloitteet-data`
- `puheet-data`
- `blog-data`
- `_enToRecord`
- `_enLoadJsonItems`
- `rawItems.map`
- suorat `/data/publications.json`
- suorat `/data/initiatives.json`
- suorat `/data/content.json`
- suorat `/data/researchfi.json`
- writings-runtimeen jääneet `source: 'content' | 'publications' | 'researchfi' | 'initiatives'` -haut

W4-tulos:

- FI-template: ei tunnettuja writings-legacy-runtimeviittauksia
- EN-template: ei tunnettuja writings-legacy-runtimeviittauksia
- FI client queries: vain `source: 'writings'`
- EN client queries: vain `source: 'writings'`

## Materials Exception

`materials` säilyy tarkoituksellisena sivutason poikkeuksena.

Sääntö:

> `materials` is a page-level summary/navigation element, not an itemized writings content section and therefore is not required to be represented as items in `writingsPage.items`.

Käytännössä tämä tarkoittaa:

- `materials`-osiolla on oma summary-card
- se ei hae itemeitä canonical writings runtime -polusta
- `writingsPage.items` ei sisällä `materials`-itemeitä
- `materials`-UI ei muuttunut W4:ssa

## Verification

Suoritetut ajot:

```bash
node --test tests/unit/writingsPage.test.js
node scripts/audit-writings-page-projection.js
node scripts/audit-writings-fi-client-parity.js
node scripts/audit-writings-en-client-parity.js
node scripts/audit-writings-legacy-runtime.js
CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --quiet
```

W4:n hyväksymiskriteerit:

- canonical total = `290`
- FI compatibility subset = `126`
- EN visible set = `290`
- writings-runtime legacy audit = green
- materials remains summary-only
