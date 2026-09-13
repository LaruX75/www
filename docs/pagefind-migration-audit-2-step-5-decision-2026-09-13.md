# Step 5 -päätös: `/esitykset/`-arkiston topic-chip:it (2026-09-13)

Pagefind-migration-audit 2:n Step 5 (topic UX -päätös) päätös ja
sync-käytäntö. Toteuttaa auditin `docs/presentations-archive-pagefind-suitability-audit-2-2026-09-13.md`
§11 cheapest-first -listan viidennen askeleen.

## Päätös

**Muokataan olemassa olevaa FI-chip-listaa datan valossa ja lisätään
EN-versio käännöksillä.** Vaihtoehto B ("Curated facet chips") auditin
kysymyksestä.

Muutokset:
- FI-chip-kuratointi päivitetty topic-frekvenssin ja semanttisen
  erottelun mukaan (Koulutusteknologia, Opettajankoulutus,
  Tekoälylukutaito, Sosiaalinen media, Mobiilioppiminen).
- EN-arkistolle (`/en/presentations/`) lisätty oma chip-lohko
  englanninkielisillä otsikoilla.
- Sync-käytäntö dokumentoitu tähän tiedostoon.

## Konteksti — nykytila ennen

Chip:it lisättiin 2026-08-16 commitissa `88107ebf` "feat: add starter
chips to discovery pages" (PF1 §13 -perusteinen kuratointi). Nykyinen
FI-lista:

```
AI literacy | Tekoäly | Koulutusteknologia | Opettajankoulutus | Mobiilioppiminen
```

FI-only (`{% if archiveLocale == "fi" %}` -gate). EN-käyttäjät eivät
näe chip:eja.

Auditin 2 §11 tunnisti `starter-chips.js` mekanismina muttei että se
on jo aktiivinen `/esitykset/`:issä. Step 5 kysyi:
- Pitäisikö chip-lista kuratoida datan valossa?
- Pitäisikö EN-arkistolle lisätä chip:it?
- Miten chip-lista pysyy synkassa 405-topic-vokabulaarin kanssa?

## Data-analyysi

221 kanonista esitystä. 386 uniikkia topic-avainta (case-normalisoitu).
Top-15 (case-normalisoituna):

| # | Topic | Esityksiä | Kattavuus |
|---|---|---:|---:|
| 1 | Koulutusteknologia | 92 | 42% |
| 2 | Opettajankoulutus | 48 | 22% |
| 3 | TVT | 27 | 12% |
| 4 | Generation AI | 27 | 12% |
| 5 | Tekoälylukutaito | 26 | 12% |
| 6 | Sosiaalinen media | 15 | 7% |
| 7 | Generatiivinen tekoäly | 15 | 7% |
| 8 | Tekoäly | 14 | 6% |
| 9 | Somekone | 13 | 6% |
| 10 | Digitaalinen media | 12 | 5% |
| 11 | AI literacy | 12 | 5% |
| 12 | Multimedia | 11 | 5% |
| 13 | EU AI Act | 10 | 5% |
| 14 | Mobiilioppiminen | 9 | 4% |
| 15 | Opetettava kone | 9 | 4% |

Havainnot:
- **Pitkä häntä**: Top-5 kattaa 42-12% esityksistä; loput ovat
  yksittäistapauksia.
- **AI on jakautunut**: "AI literacy" (12), "Tekoälylukutaito" (26),
  "Tekoäly" (14), "Generatiivinen tekoäly" (15), "Generation AI" (27)
  ovat semanttisesti päällekkäisiä mutta erillisiä avaimia.
- **Case-normalisointi** yhdistää variantit "Koulutusteknologia" (isolla)
  ja "koulutusteknologia" (pienellä).

## Kuratointi — päätetty valikoima

### FI (5 chip:iä, kattaa ~87% esityksistä)

| Chip (display + value) | Perustelu | Esityksiä |
|---|---|---:|
| Koulutusteknologia | Merkittävin topic (42% kattavuus) | 92 |
| Opettajankoulutus | Toiseksi merkittävin (22%) | 48 |
| Tekoälylukutaito | Yhdistää AI-teemaa yhdellä chipillä (ennen: kaksi päällekkäistä chip:iä "AI literacy" + "Tekoäly") | 26 |
| Sosiaalinen media | Uusi lisäys, semanttisesti erillinen, 7% | 15 |
| Mobiilioppiminen | Ennallaan, semanttisesti erillinen | 9 |

### EN (5 chip:iä)

| Chip (display) | Value (filter-arvo) | Miksi value on suomeksi |
|---|---|---|
| Educational technology | `Koulutusteknologia` | EN-esitysten topic-avaimet ovat pääosin suomenkielisiä (52/62 EN-esityksestä käyttää "Koulutusteknologia" -avainta). Chip-display käännetty, value pysyy filter-matchable. |
| Teacher education | `Opettajankoulutus` | Sama peruste (16/62 EN-esityksestä). |
| AI literacy | `AI literacy` | Poikkeus: EN-esityksissä on aidosti "AI literacy" -topic-avain (11x). Value = display. |
| Social media | `sosiaalinen media` | Pienellä koska EN-datassa muoto on `sosiaalinen media` (6x). |
| Mobile learning | `mobiilioppiminen` | Sama peruste (7x). |

## Sync-käytäntö

**Mistä chip-listaa säilytetään.** `src/_includes/presentations/archive.njk`
sisältää sekä FI- että EN-chip-lohkot ehtoblockissa
`{% if archiveLocale == "en" %}...{% else %}...{% endif %}`. Ei
erillistä config-tiedostoa.

**Milloin chip-listaa tarkistetaan.**
- **Vuosittain** — kerran vuodessa tai 50 uuden esityksen lisäyksen
  jälkeen (kumpi tulee ensin).
- Aja `node -e '...'`-analyysi joka laskee case-normalisoidut
  top-15-topic:it (skripti: ks. tämän doc:in "Data-analyysi"-osio).
- Jos top-5-topic:it tai niiden järjestys ovat muuttuneet merkittävästi,
  päivitä chip-lista.

**Milloin chip-listaa EI päivitetä.**
- **Yksittäinen uusi esitys** ei muuta 405-topic-jakoumaa merkittävästi.
- **Uusi topic joka ei ole top-15:ssä** — vokabulaari kasvaa mutta chip:it
  keskittyvät volyymissa.

**Miten chip-arvot pysyvät oikein.**
- `data-starter-chip-value` -attribuutin pitää täsmätä `presentations-page.json`:in
  `items[].topics[]`-arvoihin (case-sensitiivisesti, koska
  `<datalist>` ja `queryPreset` matchaavat sen mukaan).
- Jos vokabulaarin canonical-versio muuttuu (esim. "koulutusteknologia" →
  "Koulutusteknologia"), chip-value pitää päivittää samoin.

**Kuka vastuussa.** Sivuston pääkäyttäjä. Ei erillistä review-prosessia.

## Skope-rajaus — mitä EI tehdä

- **Ei muuta lähdedata-kuratointia.** Chip:it ovat käyttäjäystävällinen
  aloituspiste, ei semanttinen re-kartoitus. 405-topic-vokabulaari
  säilyy nykyisellään.
- **Ei uusia Pagefind-fasetteja.** Chip toimii vain arkistosivun
  `<datalist>`-input:in kanssa (`data-starter-chip-target=`). Global
  search (`/haku/`) käyttää eri mekanismia (topic-filter Pagefind:in
  kautta).
- **Ei chip-välisiä exclusiivisia valintoja.** `data-starter-chips`
  aggr-elementti hoitaa aria-pressed-tilan, käyttäjä voi klikata
  toistaan.
- **Ei "Aloita tästä" -kirjaimellinen käännös EN:iin.** Käytetään
  "Start here" (yleisempi EN idioma).

## Auditin status Step 5:n jälkeen

Pagefind-migration-audit 2:n cheapest-first-listasta jäljellä:
- ✅ Step 2 — schema parity (PR #257)
- ✅ Step 3 — data-pagefind-sort (PR #257)
- ✅ Step 1 — custom-record verifikaatio (PR #258)
- ✅ Step 4 — shared-presenter external/local -erottelu (PR #259)
- ✅ Step 5 — topic UX -päätös (tämä PR)
- 🔴 **Audit 3** — uudelleen-arviointi kaikkien Steps 1-5:n jälkeen
- ⏳ **Pre-existing löydös** PR #258:sta — 3 puuttuvaa external-first-esitystä
  Pagefind:istä (2 Canva + 1 YouTube playlist) vaatii erillisen
  korjaus-workstream:in
