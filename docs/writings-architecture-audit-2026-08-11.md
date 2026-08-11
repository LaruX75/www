# Writings Architecture Audit

Date: 2026-08-11

## Scope

Tämä audit kuvaa kirjoitukset-hubin canonical page projection -arkkitehtuurin W1-W4-checkpointtien jälkeen.

Kohdesivut:

- `src/kirjoitukset.njk`
- `src/en/writings.njk`

Nykytila:

- W1: canonical writings page projection + public endpoint
- W2: FI `/kirjoitukset/` canonical datasetille ilman UI- tai scope-muutosta
- W3: EN `/en/writings/` canonical datasetille ilman UI- tai scope-muutosta
- W4: legacy runtime cleanup + `materials`-poikkeuksen lukitseminen

## Current FI Runtime

### Canonical source

FI SSR käyttää:

- `finnishWritingsPage`-view-modelia
- joka johdetaan `writingsPage.items` canonical datasetistä
- adapterin kautta `src/kirjoitukset.11tydata.js`

FI JS-on käyttää:

- `ContentEngine.query({ source: 'writings', ... })`
- kaikissa kolmessa näkyvässä osiossa:
- `blogPost`
- `opinion`
- `column`

Public JSON -riippuvuudet:

- `/data/writings-page.json`

### FI visible subset

W2 säilytti tarkoituksella nykyisen näkyvän FI-scope-säännön:

- `contentType ∈ { blogPost, opinion, column }`
- näkyvä määrä: `126`

Tärkeä tulkinta:

- tämä on compatibility projection
- ei canonical writings datasetin pysyvä sisältömääritelmä

## Current EN Runtime

### Canonical source

EN SSR käyttää:

- `englishWritingsPage`-view-modelia
- joka johdetaan `writingsPage.items` canonical datasetistä
- adapterin kautta `src/en/writings.11tydata.js`

EN JS-on käyttää:

- `ContentEngine.query({ source: 'writings', ... })`
- writings-osioissa:
- `statement`
- `opinion`
- `column`
- `initiative`
- `speech`
- `blogPost`
- `scientificPublication`

Public JSON -riippuvuudet:

- `/data/writings-page.json`

### Näkyvät sisältötyypit

EN-sivulla on nykyisin:

- statements
- opinions
- columns
- initiatives
- speeches
- public speeches
- blog
- scientific publications

Lisäksi sivulla on summary-only `materials`-osio, joka ei tällä hetkellä renderöi item-tasoista listaa.

### Materials exception

EN-sivun `materials`-kortti ei ole writingsPage-runtimea.

Se laskee edelleen erikseen:

- Canva-esityksiä
- SlideShare-esityksiä
- AOE/Finna-materiaaleja

Tämä on tarkoituksellinen sivutason poikkeus, ei writings-content-objektien rinnakkainen lähdeputki.

Arkkitehtuurisääntö W4:n jälkeen:

> `materials` is a page-level summary/navigation element, not an itemized writings content section and therefore is not required to be represented as items in `writingsPage.items`.

## FI / EN Content Scope

W1/W2 parity:

- canonical total: `290`
- current FI runtime set: `126`
- current EN runtime set: `290`

Tulkinta:

- FI on edelleen rajatumpi writings-scope
- EN on käytännössä koko writings-datasetin päällä

FI:n nykyinen rajaus luokitellaan tässä vaiheessa:

- `legacy-scope-difference`

Sitä ei jäädytetä canonical arkkitehtuurin pysyväksi ominaisuudeksi, mutta sitä ei myöskään laajenneta W2:ssa.

## Authoritative Sources Used In W1-W3

Writings-pilot ei luonut uutta master-lähdettä.

Kirjoitusten canonical page data muodostetaan näistä olemassa olevista lähteistä:

- shared markdown content layer (`toPublicContentRecord`)
- `collections.content`
- `collections.blog`
- `collections.publications`
- `collections.politics`
- publication-canonical layer (`buildPublicationsPageModel`)

Scientific publications eivät tule writings-layeriin raakasta Research.fi-datasta, vaan jo canonical publication -linjasta.

## Canonical Dataset Summary

W1:n canonical writings dataset:

- total items: `290`

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

## Intentional Differences

EN scientific publications -vertailussa jäi näkyviin kaksi tarkoituksellista eroa:

### 1. Research.fi duplicate cleanup

Nykyinen `/data/researchfi.json` sisältää kolme nyky-runtimeen näkyvää varianttia, jotka canonical dataset deduplisoi:

- title-casing / variant title -tapauksia

### 2. Manual publication fallbacks

Canonical writings dataset sisältää kolme manual publication fallback -itemiä, jotka korvaavat EN:n vanhan suoran Research.fi-only -näkymän canonical runtime-polulla.

Näitä ei käsitelty parity-virheinä, vaan tarkoituksellisina canonical-rikastuksina.

## Outcome

W4:n jälkeen toteutunut arkkitehtuuritila on tämä:

- yksi canonical writings page dataset on olemassa
- FI SSR käyttää canonical view-modelia
- FI JS-on käyttää samaa canonical public projectionia
- EN SSR käyttää canonical view-modelia
- EN JS-on käyttää samaa canonical public projectionia
- FI visible subset parity on vihreä (`126`)
- EN visible parity on vihreä canonical `290` itemin joukolla
- aiemmat FI legacy-runtimehaarat on poistettu
- aiemmat EN monifeed-fetchit ja source-kohtaiset mapper-haarat on poistettu writings-osioista
- writings-runtimeen ei jäänyt tunnettuja rinnakkaisia legacy-feed-polkuja
- `materials` on eksplisiittisesti dokumentoitu summary-only-poikkeukseksi canonical writings -arkkitehtuurin ulkopuolella

Seuraava suositeltu eteneminen:

- `W5`: final FI+EN parity + build + UX gate
