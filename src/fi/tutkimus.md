---
title: Tutkimus
permalink: /tutkimus/
layout: base.njk
lang: fi
translationKey: research
description: >-
  Jari Larun tutkimus: nykyinen Generation AI -ohjelma, kolme keskeistä
  tutkimuslinjaa (tekoälylukutaito, opettajankoulutus, koulutusteknologia) sekä
  väitöskirja ja tutkijaprofiilit.
templateEngineOverride: njk
pageStyles:
  - /css/research-page.css
  - /css/find-explore.css
  - /css/starter-chips.css
pageScripts:
  - /js/find-explore.js
  - /js/starter-chips.js
schemaType: CollectionPage
schemaAbout:
  - '@type': Thing
    name: Teknologiatuettu oppiminen
    description: Tutkimus teknologian roolista oppimisessa ja opetuksessa.
  - '@type': Thing
    name: Tekoälylukutaito
    description: Opettajien ja oppijoiden tekoälylukutaito ja sen kehittäminen.
  - '@type': Thing
    name: Mobiilioppiminen
    description: Mobiiliteknologian pedagoginen hyödyntäminen oppimisessa.
  - '@type': Thing
    name: Yhteisöllinen oppiminen
    description: Yhteisöllisen oppimisen prosessit ja niiden tukeminen teknologialla.
  - '@type': Thing
    name: Opettajankoulutus
    description: Opettajien koulutus ja ammatillinen kehittyminen.
schemaMentions:
  - '@type': CollegeOrUniversity
    name: Oulun yliopisto
    url: 'https://www.oulu.fi/'
  - '@type': Organization
    name: 'Kasvatustieteiden tiedekunta, Oulun yliopisto'
    url: 'https://www.oulu.fi/fi/tiedekunnat/kasvatustieteiden-tiedekunta'
---
{% include "pages/research.njk" %}
