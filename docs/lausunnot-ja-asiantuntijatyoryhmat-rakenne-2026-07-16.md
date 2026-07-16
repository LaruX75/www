# Lausuntojen ja asiantuntijatyoryhmien rakenne

Pvm: 2026-07-16

## Tausta

Nykyinen sivusto tunnistaa kirjoitetusta aineistosta erityisesti seuraavat lajityypit:

- `mielipide`
- `kolumni`
- `puhe`
- blogikirjoitukset
- esitykset
- tieteelliset julkaisut

Sen sijaan **lausunnot** ja **asiantuntijatyoryhmat** puuttuvat viela omina asiantuntijavaikuttamisen muotoinaan. Taman vuoksi ne uhkaavat hajota vaarin nykyisiin koreihin:

- lausunto mielipiteeksi
- tyoryhmajasenyys blogiksi tai irralliseksi profiilitiedoksi

Se heikentaa sivuston kykyA nayttaa asiantuntijavaikuttamisen kokonaiskuvaa.

## Johtopaatos

Sivustolle kannattaa lisata kaksi erillista mutta toisiaan tukevaa kokonaisuutta:

1. `Lausunnot`
2. `Asiantuntijatyoryhmat`

Naita ei pidA niputtaa samaan taulukkoon blogin, mielipiteiden tai kolumnien kanssa ilman omaa metatietoa.

## Mita ne ovat

### Lausunto

Lausunto on:

- muodollinen kannanotto valmisteluun, luonnokseen, hallinnolliseen prosessiin tai julkiseen ohjaukseen
- tyypillisesti lausuntopalvelussa, kuulemisessa, tyoryhmalle tai viranomaiselle annettu vastaus
- asiantuntijuuden naytto, ei mielipidekirjoituksen alalaji

Lausunto voi olla:

- puhtaasti asiantuntijalausunto
- asiantuntija- ja politiikkaroolin hybridi

### Asiantuntijatyoryhma

Asiantuntijatyoryhma ei ole ensisijaisesti kirjoitussisalto vaan:

- luottamuksen ja asiantuntijaroolin naytto
- jasenyys, puheenjohtajuus, ohjausryhma, advisory board, valmisteluryhma tai muu asiantuntijatehtava

Se kuuluu enemman profiili- ja ansionayttoon kuin kirjoitusarkistoon.

## Suositeltu sisaltomalli

### 1. Lausunnot julkaisuina

Lausunnot kannattaa tallentaa nykyiseen `src/publications/`-rakenteeseen omalla tyypillaan:

```yaml
type: lausunto
```

Tama istuu nykyiseen arkkitehtuuriin paremmin kuin uusi erillinen kansio, koska:

- nykyinen kirjoitettu aineisto on jo `src/publications/`-hakemistossa
- `Kynästä` kokoaa juuri kirjoitettua aineistoa
- metadata- ja roolijako on jo rakennettu julkaisuille

### 2. Asiantuntijatyoryhmat omana profiiliaineistona

Asiantuntijatyoryhmia ei kannata vieda `src/publications/`-hakemistoon, vaan esimerkiksi:

- oma data-tiedosto `src/_data/expert-groups.js`
- tai oma sisaltokansio `src/expert-groups/*.md`, jos halutaan yksittaiset alasivut

Suositus:

- aloita datatiedostolla, jos tarkoitus on vain listata roolit
- siirry omiin sivuihin vasta, jos jokaisesta tyoryhmasta halutaan tarina, dokumentit tai tuotokset

## Lausuntojen metadata

Alla suositeltu minimimetadata.

```yaml
title: "Lausunto: Uutta suuntaa Suomen digitaaliseen kompassiin"
subtitle: "Valtioneuvoston selontekoluonnos VN/25733/2021-OKM-334"
date: 2026-04-28
type: lausunto
lang: fi
author: "Jari Laru"
description: >
  Lausunto valtioneuvoston digikompassi-selontekoluonnoksesta.
publication: "Lausuntopalvelu.fi"
statementChannel: "lausuntopalvelu"
statementAuthority: "Valtioneuvosto"
diaryNumber: "VN/25733/2021-OKM-334"
expertiseProfiles:
  - expert
writingRoles:
  - expert
categories:
  - Tekoäly ja datatoimijuus
  - Opettajankoulutus
  - Koulutuspolitiikka
  - Julkinen digitalisaatio
secondaryTheme:
  - Digitaaliset palvelut
  - Sivistys ja koulutus
keywords:
  - lausunnot
  - lausuntopalvelu
  - digikompassi
  - tekoälylukutaito
  - datalukutaito
  - koulutuspolitiikka
relatedProject:
  - Generation AI
license: "CC-BY-4.0"
```

### Mahdolliset lisa-kentat

Naita ei tarvitse ottaa heti kayttoon, mutta ne ovat hyodyllisia jos lausuntoja tulee useita:

```yaml
statementStatus: "published"
statementTopic: "digitaalinen kompassi"
statementAudience:
  - valtionhallinto
  - koulutussektori
  - kansalaiset
statementKind: "julkinen lausunto"
```

## Asiantuntijatyoryhmien metadata

Jos tyoryhmat tuodaan datana, yksi rivi voisi sisaltaa:

```js
{
  title: "Kasvatustieteiden tiedekunnan TVT-strategiatyoryhma",
  role: "Jasen",
  organization: "Oulun yliopisto",
  startYear: 2012,
  endYear: 2014,
  profile: "expert",
  theme: ["opettajankoulutus", "teknologia ja digitaalisuus"],
  description: "Osallistuminen opetuskayton teknologiastrategian valmisteluun."
}
```

Jos taas ne viedaan omiksi Markdown-sivuiksi, etusijalle kannattaa nostaa:

- `title`
- `role`
- `organization`
- `startYear`
- `endYear`
- `description`
- `themes`
- `relatedOutputs`

## Kokoelmat

Nykyinen `eleventy.collections.js` tuntee mm.:

- `pub_mielipide`
- `pub_kolumni`
- `pub_puhe`

Suositeltu laajennus:

```js
["mielipide", "kolumni", "puhe", "tieteellinen", "esitelma", "lausunto"].forEach(type => {
  ...
});
```

Lisaksi:

```js
eleventyConfig.addCollection("pub_lausunto", ...)
```

Mahdollinen jatkolaajennus:

```js
eleventyConfig.addCollection("pub_lausunto_expert", ...)
eleventyConfig.addCollection("pub_lausunto_political", ...)
```

Tata ei kuitenkaan tarvitse tehda heti, jos kaikki ensimmaiset lausunnot ovat selvasti asiantuntijaroolissa.

## Tagit ja roolit

Nykyinen `publications.11tydata.js` rakentaa tageja mielipiteille, kolumneille ja puheille. Lausunnoille kannattaa lisata vastaava kerros:

```js
if (data.type === "lausunto") {
  tagSet.add("pub_lausunto");
}
```

Jos lausunnoissa halutaan sama roolijako kuin mielipiteissa:

```js
if (data.type === "lausunto") {
  tagSet.add("pub_lausunto");
  writingRoleList.forEach((role) => tagSet.add(`pub_lausunto_${role}`));
}
```

Suositus:

- kayta lausunnoille `writingRoles`
- ala kayta niille `opinionRoles`, koska ne eivat ole mielipidekirjoituksia

## Mihin sivuilla

### 1. Kynästä

Tama on luontevin ensisijainen paikka.

Suositeltu muutos:

- lisaa uusi osio `Lausunnot`
- sijoita se `Mielipiteet`-osion ja `Kolumnit`/`Blogi`-osion yhteyteen

Perustelu:

- kyse on kirjoitetusta, julkaistusta vaikuttamisaineistosta
- se ei ole blogia
- se ei ole poliittinen aloite
- se ei ole tieteellinen julkaisu

Suositeltu otsikointi:

- `Lausunnot ja asiantuntijakannanotot`

Jos halutaan tiukempi rajaus:

- `Lausunnot`

### 2. Työni yliopistonlehtorina

Sivulla on jo dynaaminen osio tuoreille kirjoituksille, esityksille ja julkaisuille.

Suositus:

- lisaa uusi nostokortti tai listalohko `Lausunnot`
- nayta 2-3 uusinta lausuntoa
- käytä sita asiantuntijavaikuttamisen nayttona

Tama on vahvempi signaali kuin tavallinen asiantuntijamielipide, koska lausunto kohdistuu suoraan valmisteluun.

### 3. Tutkimus / yliopistotyö / portfolio

Lausuntoja ei tarvitse nostaa tutkimussivulle oletuksena.

Ne sopivat paremmin:

- `Työni yliopistonlehtorina`
- mahdollisesti `Portfolio`-sivulle kohtaan, jossa naytetaan yhteiskunnallista vuorovaikutusta

### 4. Megamenu

Nykyinen `Kynästä`-megamenun rakenne kannattaa laajentaa seuraavasti:

#### Nykyinen logiikka

- Poliittinen vaikuttaminen
- Kirjoitukset ja kannanotot
- Esitykset ja julkaisut

#### Suositeltu uusi rakenne

Sarake 1:

- Puheenvuorot
- Aloitteet
- Poliittiset mielipiteet

Sarake 2:

- Asiantuntijamielipiteet
- Lausunnot
- Kolumnit
- Blogi

See also:

- Esitykset
- Julkaisut

Perustelu:

- lausunnot ovat kirjoituksia ja kannanottoja, mutta muodollisempia kuin mielipiteet
- ne sopivat asiantuntijavaikuttamisen yhteyteen

### 5. Politiikka-sivu

Lausuntoja ei pidä nostaa politiikkasivulle oletuksena.

Poikkeus:

- jos yksittainen lausunto on selvasti poliittinen tai liittyy suoraan luottamustehtavaan, se voidaan nostaa mukaan hybridisisaltona

Oletus kuitenkin:

- lausunto = asiantuntijasisalto
- politiikka-sivu = poliittinen profiili

## Miten lausunnot eroavat mielipiteista

| Piirre | Mielipide | Lausunto |
|---|---|---|
| Julkaisukanava | lehti, media, verkkojulkaisu | lausuntopalvelu, kuuleminen, viranomaisprosessi |
| Muoto | julkinen kannanotto | muodollinen asiantuntijavastaus |
| Tavoite | vaikuttaa keskusteluun | vaikuttaa valmisteluun |
| Rooli | asiantuntija, poliitikko tai hybridi | ensisijaisesti asiantuntija |
| Sijoitus sivustolla | `Mielipiteet` | oma `Lausunnot`-osio |

## Miten asiantuntijatyoryhmat eroavat lausunnoista

| Piirre | Lausunto | Asiantuntijatyoryhma |
|---|---|---|
| Tyyppi | julkaistu tekstisisalto | rooli, jasenyys, luottamus |
| Muoto | teksti | profiilitieto |
| Paras esitystapa | lista/taulukko | aikajana, kortit tai profiililista |
| Ensisijainen sivu | `Kynästä`, `Työni yliopistonlehtorina` | `Työni yliopistonlehtorina`, `CV`, mahdollinen oma sivu |

## Ensimmainen toteutuskierros

Suositeltu toteutusjarjestys:

1. Lisaa `type: lausunto` nykyiseen julkaisulogiikkaan.
2. Tee yksi pilottisisalto liitteen lausunnosta.
3. Lisaa `pub_lausunto`-kokoelma.
4. Lisaa `Kynästä`-sivulle lausunto-osio ja sivutus.
5. Lisaa `Työni yliopistonlehtorina` -sivulle 2-3 lausunnon dynaaminen nosto.
6. Lisaa megamenuun `Lausunnot`.
7. Kokoa asiantuntijatyoryhmat erikseen data-aineistoksi.

## Ei kannata tehda ensimmaisella kierroksella

- ala tee lausunnoille omaa erillista design-saariketta, joka ei noudata `Kynästä`-sivun logiikkaa
- ala sekoita lausuntoja `Mielipiteet`-taulukkoon
- ala tee tyoryhmista omaa raskasta arkistosivua ennen kuin aineisto on koottu

## Pilottiluokitus liitteen lausunnolle

Liitteen lausunto kuuluu luokkiin:

- paatyyppi: `lausunto`
- rooli: `expert`
- paateemat:
  - `tekoäly ja datatoimijuus`
  - `opettajankoulutus`
  - `koulutuspolitiikka`
  - `julkinen digitalisaatio`
- liittyma:
  - `Työni yliopistonlehtorina`
  - mahdollisesti `Tutkimus`

Se ei ole:

- mielipidekirjoitus
- blogipostaus
- poliittinen kirjoitus ensisijaisesti

## Suositus yhdella rivilla

Lausunnot kannattaa ottaa sivustolle omana kirjoitetun asiantuntijavaikuttamisen tyyppinaan `src/publications/`-rakenteen sisalla, kun taas asiantuntijatyoryhmat kannattaa rakentaa erillisena profiili- ja ansionayttona, ei kirjoituksina.
