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

### Kuinka aloittaa oman sivuston tekeminen (yleinen malli)

Jos haluat rakentaa vastaavan tyyppisen staattisen sivuston tyhjästä näillä työkaluilla:

1. Luo uusi Node-projekti ja asenna Eleventy sekä tarvitut paketit:
   - esim. Eleventy, Nunjucks/Markdown, Bootstrap
2. Määritä projektirakenne:
   - sisältö (`src/`)
   - layoutit ja komponentit (`src/_includes/`)
   - datatiedostot (`src/_data/`)
3. Rakenna peruslayout:
   - header, footer, navigaatio, kieliversioiden linkitys
4. Lisää sisältötyypit:
   - sivut, artikkelit, julkaisut, listaukset ja mahdolliset suodatusnäkymät
5. Lisää build- ja deploy-putki:
   - GitHub Actions + GitHub Pages (tai muu static hosting)
6. Lisää laadunvarmistus:
   - build-checkit, SEO/sitemap/robots-tarkistukset, smoke-testit tuotantoon

### Kehitys tässä projektissa

1. Asenna riippuvuudet:
   - `npm ci`
2. Käynnistä paikallinen kehitys:
   - `npm run start:no-og`
3. Varmista build ennen julkaisuja:
   - `npm run build:no-og`

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

### How to start building your own site (generic path)

If you want to build a similar static site from scratch with this toolset:

1. Create a new Node project and install required packages:
   - for example Eleventy, Nunjucks/Markdown, Bootstrap
2. Define the project structure:
   - content (`src/`)
   - layouts/components (`src/_includes/`)
   - data files (`src/_data/`)
3. Build a base layout:
   - header, footer, navigation, language switching
4. Add your content types:
   - pages, articles, publications, listing views and filters
5. Add build and deployment pipeline:
   - GitHub Actions + GitHub Pages (or another static host)
6. Add quality checks:
   - build checks, SEO/sitemap/robots validation, production smoke tests

### Development in this project

1. Install dependencies:
   - `npm ci`
2. Start local development:
   - `npm run start:no-og`
3. Verify production build locally:
   - `npm run build:no-og`

### Deployment

Pushing to `main` triggers the automated build + deploy pipeline.

### Technical documentation

A more detailed implementation guide can be kept locally as `TECHNICAL_HOWTO.md` (not versioned and not published).
