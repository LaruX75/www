---
layout: page.njk
templateEngineOverride: md
title: Saavutettavuusseloste
permalink: /saavutettavuus/
translationKey: accessibility_statement
---

# Saavutettavuusseloste

**Sivusto:** [www.jarilaru.fi](https://www.jarilaru.fi)
**Viimeksi testattu:** 9.3.2026
**Vaatimustenmukaisuustaso:** WCAG 2.1 taso AA
**Tila:** Vaatimukset täyttyvät

---

## Yhteenveto

Sivusto www.jarilaru.fi on testattu WCAG 2.1 AA -kriteeristöä vasten automaattisin testein. Testaus kattaa kaikki keskeiset sivut. Testauksen perusteella sivusto täyttää WCAG 2.1 tason AA vaatimukset testatuilla sivuilla.

---

## Testausmenetelmä

Automaattinen testaus suoritettiin seuraavilla työkaluilla:

- **[axe-core](https://github.com/dequelabs/axe-core)** (Deque Systems) — WCAG 2.1 A- ja AA-kriteerien tarkistus
- **[Playwright](https://playwright.dev/)** — Headless Chromium -selainympäristö todellista renderöintiä varten
- **[Pa11y](https://pa11y.org/)** (HTML_CodeSniffer) — Täydentävä tarkistus

Testaus ajettiin paikallisesti buildattuun staattiseen versioon osoitteessa `localhost`. JavaScript suoritettiin täysimääräisesti ennen tarkistusta (`waitForTimeout: 1500ms`), jotta dynaamisesti renderöity sisältö tuli mukaan arviointiin.

---

## Testatut sivut

| Sivu | URL | Tulos |
|------|-----|-------|
| Etusivu | `/` | ✓ Läpäisee |
| Opinnäytteet | `/opinnaytteet/` | ✓ Läpäisee |
| Julkaisut | `/julkaisut/` | ✓ Läpäisee |
| Ansioluettelo | `/cv/` | ✓ Läpäisee |
| Opetusportfolio | `/portfolio/` | ✓ Läpäisee |
| Esitykset | `/esitykset/` | ✓ Läpäisee |
| Politiikka | `/politiikka/` | ✓ Läpäisee |
| Blogi | `/blogi/` | ✓ Läpäisee |
| Tietosuojaseloste | `/tietosuojaseloste/` | ✓ Läpäisee |
| Ansioluettelo (EN) | `/en/cv/` | ✓ Läpäisee |
| Julkaisut (EN) | `/en/publications/` | ✓ Läpäisee |
| Esitykset (EN) | `/en/presentations/` | ✓ Läpäisee |

---

## Korjatut ongelmat

Testauksen yhteydessä löydettiin ja korjattiin seuraavat WCAG 2.1 AA -puutteet:

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
| 2.1.1 Näppäimistö | Vieritettävä esitysskrolleri ei näppäimistöllä saavutettavissa | Lisätty `tabindex="0"` |
| 1.4.3 Kontrasti | Hero-tekstit rgba-opasiteettiarvoilla | Korvattu kiinteillä väreillä |
| 1.1.1 Ei-tekstinen sisältö | Koristeikonikuvakkeilla puuttuva `aria-hidden` | Lisätty `aria-hidden="true"` |

---

## Tunnetut rajoitukset

Automaattinen testaus kattaa arviolta 30–40 % WCAG-kriteereistä. Seuraavia osa-alueita **ei ole testattu manuaalisesti**:

- Ruudunlukijatestaus (esim. NVDA, VoiceOver, JAWS)
- Kognitiivinen saavutettavuus
- Näppäimistönavigoinnin kokonaissujuvuus
- Kaikki yksittäiset blogipostaukset ja sisältösivut

---

## Palautetta saavutettavuudesta

Jos kohtaat saavutettavuusongelman sivustolla, otathan yhteyttä:

**Jari Laru**
Sähköposti: <jari.laru@oulu.fi>

---

## Viittaukset

- [WCAG 2.1 -ohjeistus (W3C)](https://www.w3.org/TR/WCAG21/)
- [Saavutettavuusdirektiivin vaatimukset (Traficom)](https://www.traficom.fi/fi/viestinta/digitaaliset-palvelut/saavutettavuus)
