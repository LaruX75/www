# FI–EN-pääsivujen vastaavuuden toteutus

Toteutettu 16.9.2026 auditoinnin `fi-en-main-pages-parity-audit-2026-09-15.md` perusteella. Vertailuperustana on työkopion suomenkielinen sivusto. Muutoksia ei ole julkaistu tuotantoon.

## Muutokset

- Etusivu, Tietoa, yliopistotyö, opetusportfolio, CV, tutkimus, kouluttaja, politiikka, yhteiskunnallinen vuorovaikutus ja yhteystiedot käyttävät yhteistä sivuparikohtaista rakennetta.
- Etusivujen samat roolit, viisi aloituspolkua, sisältömäärät, tunnustukset ja merkkitapahtumat tulevat samoista lähteistä. EN-portfolion ja CV:n tyhjät/suppeat esittelyt on korvattu varsinaisilla sisällöillä.
- Opetukselle, opiskelijapalautteelle, koulutuspalautteelle, kaupunginvaltuustolle, sivistyslautakunnalle ja teemaprofiileille on lisätty EN-koonnit.
- Kynästä on molemmissa kielissä kirjoitusten, valtuustotyön ja asiantuntijatyön koonti. Kirjoitukset sisältää blogin, mielipiteet ja kolumnit. Kieliparit ovat erilliset ja yksikäsitteiset.
- Lausunnoille ja valtuustotyölle on omat EN-sivut. Vanhoja EN-kirjoitusarkiston puhe-/lausuntoankkureita varten on kohdelinkit ja selaimessa toimiva siirtymä.
- EN-mediassa ovat samat rajaukset, pikavalinnat ja sivutus. Esityssivut sisältävät samat käyttötarkoitusreitit, nostot, aiheprofiilit ja arkiston. Julkaisuissa on sama viitevienti ja analyysirakenne.
- Pagefindin kieliversiot alustetaan erillisiin, sarjallisesti käynnistyviin moduuleihin. Dokumentin `lang`-arvo palautetaan aina alustuksen jälkeen, joten FI- ja EN-indeksit eivät sekoitu eivätkä jaa Worker-muistia.
- Väitöskirjan viisi paikallista linkkiä korjattiin kummallakin kielellä. Valtuusto-/vaalihistorian lähdepolkujen muodostus poistaa tiedostonimestä päivämääräetuliitteen Eleventyn tavoin.
- Avoimuus-, matkailu-, kategoria- ja avainsanakoontien rakenteet yhtenäistettiin. Vanha `/en/training/` opastaa ajantasaisiin materiaaleihin, palveluihin ja yliopisto-opetukseen.

## Sisältökäytäntö

Esittelytekstit ja käyttöliittymä ovat englanniksi. Alkuperäiset kirjoitukset, kurssimateriaalit, palautelainaukset, kokousasiakirjat ja niiden lähdekohtaiset kuvaukset voivat pysyä suomeksi; koonnit kertovat tästä. Poliittisten päälinjojen pitkät alkuperäiset aikajanat ovat suomenkielisiä, ja EN-pääsivu tarjoaa englanninkieliset esittelyt ja selkeät jatkolinkit.

CV säilyttää lähteen tietojen päiväyksen 1.1.2025. Kääntäminen ei ole ulkoinen ansioluettelon faktantarkistus eikä tietojen päivityspäivää ole muutettu vastaamaan käännöstyötä.

## Ylläpito

- `src/_includes/pages/`: sivuparien yhteiset rakenteet.
- `src/_data/pageTranslations/en.json`: käsin kirjoitetut käyttöliittymän ja esittelytekstien käännökset; haku normalisoi vain välilyönnit.
- `src/_utils/pageLocale.js`: esittelytekstien ja pääsivureittien kieliversiot. Alkuperäisten aineistojen tunnisteita, suodatusarvoja tai lähdepolkuja ei käännetä.
- `npm run check:i18n-seo` tarkistaa myös sovitut pääsivuparit, vastavuoroiset kielilinkit sekä paikalliset sivu- ja ankkurilinkit. Vaihtoehtoisen build-hakemiston voi antaa `SITE_DIR`-muuttujalla.
- `npm run check:main-page-interactions` tarkistaa indeksoidulta paikalliselta sivustolta FI/EN-julkaisuhakuja, viiteviennin, median rajauksen ja vanhan lausuntosyvälinkin. Palvelinosoite annetaan `PARITY_BASE_URL`-muuttujalla.

## Varmennus

16.9.2026 ajettiin onnistuneesti:

- Eleventy-tuotantorakennus paikallisilla API-välimuisteilla: 1 497 HTML-sivua.
- Pagefind-indeksin muodostus: 1 497 HTML-asiakirjaa, 223 esityksen kanonista tietuetta.
- `SITE_DIR=/tmp/fi-en-parity-implementation node scripts/check-i18n-seo.js`: kieli-, SEO-, vastavuoroiset kielilinkit sekä paikalliset sivu- ja ankkurilinkit läpäisivät.
- `node --test tests/unit/homeCitationDisplay.test.js tests/unit/pageLocale.test.js`: 5/5 läpäisi.
- `PARITY_BASE_URL=http://127.0.0.1:4188 node scripts/check-main-page-interactions.js`: FI/EN-julkaisuhaku, viitevienti, podcast-suodatin ja vanha lausuntolinkki läpäisivät. Haut palauttivat kyselyillä `learning` 42/42 ja `TPACK` 2/2 tulosta.

Testaus käyttää paikallisia API-välimuisteja. Yhteydenottolomaketta ei lähetetä eikä ulkoisten lähdepalvelujen saatavuutta hyväksytä paikallistestillä.

Koko yksikkötestisarjassa havaittiin kuusi muutoksista riippumatonta virhettä, jotka toistettiin erillisessä HEAD-lähtöversion kopiossa samoilla välimuisteilla: esitysarkiston kaksi vanhentunutta lukumääräodotusta, kaksi esityksen tietuemallin odotusta sekä kaksi hakulaadun vanhaa vertailuarvoa. Muutoksen omat kohdennetut testit käsittelevät yhteisiä etusivumääriä, reittejä, alkuperäistunnisteiden säilymistä ja päivämäärällisiä valtuustolinkkejä.
