---
description: SlideShare-esitysten hakeminen ja päivittäminen
---

Koska SlideShare ei tarjoa julkista rajapintaa, esitysten tiedot kerätään manuaalisesti tai avustetusti selaimen kautta ja tallennetaan tiedostoon `src/_data/slideshare.js`.

### Vaiheet uusien esitysten lisäämiseksi:

1. **Avaa profiilisivu:**
   Siirry osoitteeseen `https://www.slideshare.net/larux`.

2. **Poimi esityksen tiedot:**
   Uuden esityksen osalta tarvitset:
   - **ID**: Numerosarja esityksen URL-osoitteen lopussa (esim. `137666039`).
   - **Title**: Esityksen otsikko.
   - **URL**: Esityksen suora linkki.
   - **Thumbnail**: Esityksen esikatselukuvan URL (löytyy `<img>`-tagin `src`-attribuutista).

3. **Päivitä datatiedosto:**
   Lisää uusi objekti `src/_data/slideshare.js` -tiedoston taulukkoon:
   ```javascript
   {
     id: "UUSI_ID",
     title: "Esityksen otsikko",
     thumbnail: "https://cdn.slidesharecdn.com/ss_thumbnails/...",
     url: "https://www.slideshare.net/slideshow/..."
   }
   ```

4. **Automatisoitu haku (AI-avusteinen):**
   Voit myös antaa AI-assistentille (kuten Antigravity) tehtäväksi:
   > "Hae uusimmat esitykseni SlideSharesta (larux) ja päivitä `src/_data/slideshare.js`."
   Assistentti osaa käyttää selaintyökaluja poimiakseen tiedot automaattisesti.

5. **Kaikkien 124 esityksen haku:**
   Jos haluat hakea kaikki loputkin esitykset kerralla, voit pyytää assistenttia käymään läpi kaikki SlideShare-profiilisi sivut (1-8) ja päivittämään listan.
