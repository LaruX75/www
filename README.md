# jarilaru.fi

Staattinen kaksikielinen (FI/EN) henkilö- ja asiantuntijasivusto, toteutettu Eleventyllä ja julkaistu GitHub Pagesiin.

---

## Suomeksi

### Mitä sivusto sisältää

- Ajankohtaiset kirjoitukset, puheet ja aloitteet
- Julkaisut, opinnäytteet ja esitykset
- Profiili-, yhteys- ja CV-sivut
- Suomen- ja englanninkieliset rinnakkaissivut

### Teknologiat (yleistaso)

- Eleventy (11ty)
- Nunjucks + Markdown
- Bootstrap 5
- GitHub Actions + GitHub Pages

### Kuinka aloittaa oman sivuston tekeminen

Näillä työkaluilla voit rakentaa vastaavan sivuston omilla tiedoillasi.

1. Kopioi projekti pohjaksi ja vaihda oma sivuston nimi, URL ja perustiedot.
2. Korvaa sisältö omaksi:
   - lisää omat sivut `src/pages/` ja `src/en/` -hakemistoihin
   - lisää omat kirjoitukset, julkaisut, esitykset ja kuvat `src/`-rakenteeseen
3. Muokkaa ulkoasu omalle brändille `src/css/`-tiedostoissa.
4. Käynnistä paikallinen kehitys:
   - `npm ci`
   - `npm run start:no-og`
5. Varmista build ennen julkaisua:
   - `npm run build:no-og`
6. Julkaise oma versio:
   - luo oma GitHub-repo
   - ota GitHub Pages käyttöön
   - puske `main`-haaraan, jolloin Actions hoitaa buildin ja deployn

### Julkaisu

Push `main`-haaraan käynnistää automaattisen build + deploy -putken.

### Tekninen dokumentaatio

Tarkempi tekninen toteutusohje voidaan pitää lokaalina tiedostona `TECHNICAL_HOWTO.md` (ei versionhallintaan eikä julkaisuun).

---

## In English

### What the site includes

- Current writings, speeches, and initiatives
- Publications, theses, and presentations
- Profile, contact, and CV pages
- Parallel Finnish and English page versions

### Tech stack (high level)

- Eleventy (11ty)
- Nunjucks + Markdown
- Bootstrap 5
- GitHub Actions + GitHub Pages

### How to start building your own site

You can use this setup as a base and replace the content with your own.

1. Copy this project and update site name, URL, and core metadata.
2. Replace content:
   - add your own pages under `src/pages/` and `src/en/`
   - add your own writings, publications, presentations, and images in `src/`
3. Customize visual style and branding in `src/css/`.
4. Start local development:
   - `npm ci`
   - `npm run start:no-og`
5. Verify production build locally:
   - `npm run build:no-og`
6. Publish your own version:
   - create your own GitHub repository
   - enable GitHub Pages
   - push to `main` to trigger build and deploy via Actions

### Deployment

Pushing to `main` triggers the automated build + deploy pipeline.

### Technical documentation

A more detailed implementation guide can be kept locally as `TECHNICAL_HOWTO.md` (not versioned and not published).
