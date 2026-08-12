# Opinnäytteet: data quality audit (2026-08-11)

## Rajaus

T4 on puhdas data quality -vaihe, ei arkkitehtuurimuutos.

Auditin fokus:

- authoritative `lang` canonical thesis -objektista public projectioniin
- abstract-kattavuus ilman AI-generointia

## Tulos

- canonical thesis objects: `169`
- kielijakauma authoritative lähdedatasta:
  - `139` suomeksi (`fin`)
  - `30` englanniksi (`eng`)
- abstract löytyy `127/169`
- abstract puuttuu `42/169`

## Kielimetadatan havainto

`src/_data/theses.js` ja thesis detail -malli johtavat kielen jo authoritative
lähdekentästä (`fin` / `eng`), mutta `/data/theses.json` merkitsi ennen
korjausta kaikki itemit `fi`:ksi.

Korjauksen jälkeen `lang` johdetaan myös public projectionissa suoraan
lähdetiedosta:

- `eng` / `en` → `en`
- muut nykyiset arvot → `fi`

Tämä pitää yhtenäisenä nämä kerrokset:

- canonical thesis object
- `/data/theses.json`
- thesis detail HTML
- meta / JSON-LD -projektio
- collection-item projection

## Abstract-kattavuuden audit

Puuttuvien abstractien kohdalla tarkistettiin kaksi paikkaa:

1. OuluREPO-lähdedata (`src/_data/theses.js` cache)
2. `src/_data/thesis-keywords-cache.json`

Tulos:

- `42/42` puuttuvasta abstractista puuttuu sekä lähdedatasta että nykyisestä cache-rikastuksesta
- `0/42` ei ollut palautettavissa nykyisestä cache-rikastuksesta

Tämänhetkinen johtopäätös on siis:

- kyse ei näytä olevan mapping-bugista
- kyse ei näytä olevan nykyisen keywords/abstract-cache-polun regressiosta
- kyse on toistaiseksi source-backed puutteesta tai erillisestä future-retrieval-tehtävästä

## Ei tehty tässä vaiheessa

- ei AI-generoituja abstrakteja
- ei embedding/H0-strategian muutoksia
- ei Pagefind-, detail- tai linkitysarkkitehtuurin muutoksia
