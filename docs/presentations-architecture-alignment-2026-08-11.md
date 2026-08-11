# Presentations Architecture Alignment

Päiväys: 2026-08-11

## Linjaus

Esitysten seuraavaa datakerrosta ei rakenneta uutena rinnakkaisena JSON-first-järjestelmänä.

Tärkein periaate:

- ei uutta `presentations-index.json`-tyyppistä rinnakkaista endpointia
- ei uutta käsin ylläpidettävää `presentation-master.json`-tietovarastoa
- ei toista presentation-kohtaista content engineä nykyisen rinnalle

Nykyinen konsolidointipiste on olemassa olevassa arkkitehtuurissa.

## Nykyiset authoritative-rakenteet

Tarkistetut nykyiset kerrokset:

- [contentPresets.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_utils/contentPresets.js)
- [content-engine.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/js/content-engine.js)
- [contentSchema.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/contentSchema.js)
- [resolveContentMeta.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_utils/resolveContentMeta.js)
- [presentationsPage.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/_data/presentationsPage.js)
- [presentations-page.json.11ty.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/data/presentations-page.json.11ty.js)
- [presentations.json.11ty.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/data/presentations.json.11ty.js)

## Tämänhetkinen johtopäätös

Nykyinen `presentations-page.json` on jo käytännössä build-aikainen aggregaattipiste `/esitykset/`-sivulle.

Siksi oikea eteneminen on:

- muuttaa nykyistä endpointia kohti kanonista public projectionia
- ei luoda sille rinnakkaista uutta esitysindeksiä vain uuden nimen vuoksi

Nykyinen `presentations.json` on olemassa, mutta se kattaa vain `collections.presentations`-aineiston eikä vielä koko `/esitykset/`-näkymän tarvitsemia lähteitä.

## Nykyinen arkkitehtuurivelka

Suurin tämänhetkinen poikkeama liitteessä kuvatusta tavoitetilasta on:

1. [presentations-page.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/js/presentations-page.js) hakee suoraan `/data/presentations-page.json`:n eikä käytä vielä yhteistä `ContentEngine`-kerrosta.
2. `presentations-page.json` palauttaa edelleen heterogeenisen `rawData`-rakenteen.
3. Julkinen selaindata ei vielä ole puhdas allowlist-pohjainen public projection.

Tämä ei tarkoita, että pitäisi rakentaa uusi järjestelmä.

Se tarkoittaa, että nykyinen endpoint pitää konsolidoida.

## Tavoiterakenne

Tavoite on yksi kanoninen esitysobjekti, joka muodostetaan nykyisistä lähteistä buildissä:

```text
Canva
SlideShare
AOE / Finna
Markdown / frontmatter
kuratoitu metadata
rikastus
      ↓
nykyiseen arkkitehtuuriin istuva adapteri
      ↓
kanoninen presentation object
      ↓
allowlist-pohjainen public projection
```

## Seuraava oikea refaktorointijärjestys

1. Määrittele kanoninen presentation object nykyisen adapterikerroksen sisään.
   - mieluiten nykyisen `src/_data/presentationsPage.js` / nykyisten presentation-lähdemoduulien yhteyteen
   - ei uutta rinnakkaista manuaalista master-tiedostoa

2. Muuta nykyinen `/data/presentations-page.json` eksplisiittiseksi public projectioniksi.
   - allowlist, ei `rawData miinus pari kenttää`

3. Siirrä `/esitykset/`-sivun selainlogiikka vähitellen käyttämään tätä projection-mallia.

4. Kytke suodatus mahdollisuuksien mukaan nykyiseen `contentPresets` / `content-engine` -malliin sen sijaan, että laajennetaan nykyistä presentation-kohtaista erillislogiikkaa loputtomasti.

## Mitä ei tehdä

- ei uutta `presentations-index.json`
- ei uutta `presentation-master.json`
- ei source-kenttien, title/date/summary-kenttien ylläpitoa useassa käsin editoitavassa master-lähteessä
- ei build-time semanttisten scorejen kirjoittamista takaisin toimitukselliseen lähdedataan

## Käytännön vaikutus nykytyöhön

Nykyiset UI-siivoukset ja esityssivujen metadata-kavennukset ovat edelleen ok.

Seuraava data-arkkitehtuurin muutos pitää kuitenkin tehdä näin:

- konsolidoi nykyistä `/data/presentations-page.json`-rakennetta
- älä lisää sen rinnalle uutta presentation-datajärjestelmää
