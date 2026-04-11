---
layout: page.njk
templateEngineOverride: md
title: Saavutettavuusseloste
description: "Jarilaru.fi-sivuston saavutettavuusseloste: WCAG 2.1 AA -tavoitetaso, auditoinnin tulokset, tunnetut rajoitukset ja palautekanava."
permalink: /saavutettavuus/
translationKey: accessibility_statement
---

**Sivusto:** [www.jarilaru.fi](https://www.jarilaru.fi)
**Viimeksi arvioitu:** 11.4.2026
**Tavoitetaso:** WCAG 2.1 taso AA
**Tila:** Osittain vaatimusten mukainen

---

## Yhteenveto

Sivustoa kehitetään WCAG 2.1 AA -tavoitetta kohti. Huhtikuussa 2026 päivitetyn sisäisen auditoinnin perusteella sivusto ei vielä täytä kaikkia WCAG 2.1 AA -vaatimuksia kaikilla sivuilla ja kaikissa käyttötilanteissa.

Keskeiset jäljellä olevat riskit liittyvät vanhempaan sisältöön, kolmannen osapuolen upotuksiin sekä siihen, että kaikkia sivuja ei ole vielä varmennettu manuaalisesti ruudunlukijoilla ja muilla avustavilla teknologioilla.

---

## Arviointimenetelmä

Arviointi perustuu seuraaviin menetelmiin:

- lähdekoodin ja sivupohjien läpikäynti
- generoituun HTML:ään kohdistettu tarkistus
- **[axe-core](https://github.com/dequelabs/axe-core)**- ja **[Playwright](https://playwright.dev/)**-pohjainen automaattinen testaus
- näppäimistökäytön ja fokusjärjestyksen manuaalinen tarkistus
- jaettujen käyttöliittymäkomponenttien heuristinen arviointi

Automaattinen testaus ajetaan projektin omasta paikallisesta buildista, jotta arviointi kohdistuu varmasti tähän sivustoon eikä ulkopuolisiin ympäristöihin. Auditin 11.4.2026 ajettu testikokonaisuus sisälsi 14 testiä, jotka läpäistiin ilman varsinaisia saavutettavuusvirheitä auditoiduilla ydinsivuilla.

---

## Tarkastuksen kattavuus

Tämän auditointikierroksen ensisijainen tarkastus kohdistui seuraaviin sivu- ja toimintokokonaisuuksiin:

- etusivu
- julkaisut
- opinnäytteet
- esitykset
- CV
- yhteystiedot
- navigaatio ja haku
- footer, lomakkeet, tilaviestit ja suodattimet

Englanninkieliset sivut käyttävät pääosin samoja komponentteja ja rakenteita, mutta niitä ei ole tässä kierroksessa varmennettu yhtä kattavasti sivu sivulta kuin suomenkielisiä ydinsivuja.

---

## Tämän auditoinnin tulos

- 11.4.2026 ajettu automaattinen auditointikokonaisuus läpäisi 14/14 testiä.
- Auditoiduilla ydinsivuilla ei havaittu kriittisiä axe-core-, fokusloukku- tai painikekontrastivirheitä.
- Merkittävimmät jäljellä olevat riskit liittyvät arkistoituun vanhaan sisältöön, ulkoisiin upotuksiin ja manuaalisen ruudunlukijatestauksen keskeneräisyyteen.

---

## Havaitut ja korjatut ongelmat

Vuoden 2026 auditointikierroksilla on korjattu muun muassa seuraavia puutteita:

| Kriteeri | Ongelma | Korjaus |
|----------|---------|---------|
| 1.4.3 Kontrasti | `<code>`-elementtien värikontrasti 4.47:1 (vaatimus 4.5:1) | Tummennettu koodin väri: `#b91c5e` (~6.6:1) |
| 1.4.3 Kontrasti | `.text-danger`-luokan kontrasti 4.18:1 | Tummennettu: `#b02a37` (~6.4:1) |
| 1.4.3 Kontrasti | Hero-painikkeiden kontrasti matalalla | Vaihdettu `btn-light`/`btn-outline-light`, eksplisiittiset värit |
| 1.4.3 Kontrasti | Koristeelliset numerot 01/02/03 15 % opasiteetilla | Siirretty CSS `::before`-pseudoelementtiin (`aria-hidden`) |
| 4.1.1 Jäsentäminen | Duplikaatti-ID tietosuojaselosteessa | Poistettu ylimääräinen `<a id>`-ankuri |
| 4.1.3 Tilaviestit | Opinnäytteiden suodatustulokset ei ilmoitettu | Lisätty `aria-live`-alue |
| 4.1.2 Nimi, rooli, arvo | Avainsanasuodatuspainikkeet ilman tilaa | Lisätty `aria-pressed` |
| 4.1.2 Nimi, rooli, arvo | Ikonipainike blogitaulukossa ilman tekstiä | Lisätty `aria-label` |
| 1.3.1 Tietosisältö koodattu | `aria-hidden`-tikkereiden sisällä fokusoituvia elementtejä | Lisätty `inert`-attribuutti klooneihin |
| 2.1.1 Näppäimistö | Desktop-megavalikko ei ollut näppäimistöllä käytettävä | Erotettu sivulinkki ja alavalikon avauspainike, lisätty näppäimistötuki |
| 4.1.2 Nimi, rooli, arvo | Hakuoverlay ei ollut merkitty dialogiksi | Lisätty dialogisemantiikka ja fokuslogiikka |
| 3.3.2 Ohjeet | Yhteydenottolomakkeen kentissä ei ollut näkyviä labeleita | Lisätty näkyvät `<label>`-elementit |
| 4.1.2 Nimi, rooli, arvo | Useilta iframe-upotuksilta puuttui kuvaava nimi | Lisätty `title`-attribuutteja upotuksiin |
| 1.4.3 Kontrasti | Hero-tekstit rgba-opasiteettiarvoilla | Korvattu kiinteillä väreillä |
| 1.1.1 Ei-tekstinen sisältö | Koristeikonikuvakkeilla puuttuva `aria-hidden` | Lisätty `aria-hidden="true"` |
| 1.4.1 Värin käyttö | Osa tekstilinkeistä erottui ympäröivästä tekstistä lähinnä värillä | Palautettu pysyvä alleviivaus sisältölinkeille |
| 4.1.3 Tilaviestit | Julkaisusivun rajauksesta ei tullut ruudunlukijalle tilaviestia | Lisätty `role="status"` ja `aria-live` |

Tällä auditointikierroksella päivitettiin lisäksi saavutettavuusviestintää niin, että sivuston WCAG-merkintä ohjaa saavutettavuusselosteeseen eikä esitä sivustoa täysin vaatimustenmukaisena.

---

## Tunnetut rajoitukset ja keskeneräiset kohdat

Automaattinen testaus kattaa vain osan WCAG-kriteereistä. Seuraavat osa-alueet ovat edelleen osittain kesken tai vaativat lisävarmennusta:

- ruudunlukijatestit (esim. NVDA, VoiceOver, JAWS)
- kognitiivisen saavutettavuuden manuaalinen arviointi
- kaikkien yksittäisten blogi- ja arkistosivujen tarkistus
- vanhan sisällön kolmannen osapuolen upotukset ja niiden vaihtoehtoiset esitystavat
- englanninkielisten sisältösivujen täydellinen sivukohtainen läpikäynti

---

## Palautetta saavutettavuudesta

Jos kohtaat saavutettavuusongelman sivustolla, otathan yhteyttä:

**Jari Laru**
Sähköposti: <a href="mailto:%6A%61%72%69%2E%6C%61%72%75%40%6F%75%6C%75%2E%66%69" aria-label="Sähköposti jari.laru@oulu.fi"><span>jari.laru</span><span aria-hidden="true">@</span><span>oulu.fi</span></a>

---

## Viittaukset

- [WCAG 2.1 -ohjeistus (W3C)](https://www.w3.org/TR/WCAG21/)
- [Saavutettavuusdirektiivin vaatimukset (Traficom)](https://www.traficom.fi/fi/viestinta/digitaaliset-palvelut/saavutettavuus)
