# jarilaru.fi

Jari Larun kaksikielinen (FI/EN) henkilö- ja asiantuntijasivusto.

Sivusto on toteutettu staattisena Eleventy-sivustona ja julkaistaan GitHub Pagesiin.

## Mitä sivusto sisältää

- Ajankohtaiset kirjoitukset, puheet ja aloitteet
- Julkaisut, opinnäytteet ja esitykset
- Profiili-, yhteys- ja CV-sivut
- Suomen- ja englanninkieliset rinnakkaissivut

## Teknologiat (yleistaso)

- Eleventy (11ty)
- Nunjucks + Markdown
- Bootstrap 5
- GitHub Actions + GitHub Pages

## Kehityksen pika-aloitus

1. Asenna riippuvuudet:
   - `npm ci`
2. Käynnistä paikallinen kehityspalvelin:
   - `npm run start:no-og`
3. Tee tuotantobuildi:
   - `npm run build:no-og`

## Julkaisu

Push `main`-haaraan käynnistää automaattisen build + deploy -putken.

## Tekninen dokumentaatio

Tämän repositorion tarkempi tekninen toteutusohje löytyy tiedostosta:

- `TECHNICAL_HOWTO.md`

Huom: tekninen howto on tarkoitettu kehityskäyttöön repossa. Se ei ole osa julkaistavaa sivustosisältöä.
