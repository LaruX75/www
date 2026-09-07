---
title: "Opetus"
permalink: /opetus/
layout: base.njk
lang: fi
translationKey: teaching_fi_only
description: "Opetus-alue kokoaa yhteen Jari Larun julkiset kurssisivut, opetusportfolion, opiskelijapalautteen ja opetustyön kokonaiskuvan. Kurssitoteutukset ovat suomenkielisiä."
templateEngineOverride: njk
pageShell: true
schemaType: CollectionPage
---

{# Compact course-group row primitive shared by both sections
   (Nykyinen opetus + Aiemmat kurssitoteutukset). Preserves the merged
   OPETUS-CATALOG-UX-01 language: card wrapper, list-group-flush,
   full-row list-group-item-action link, no pill CTA, no p-4 p-lg-5.
   Row layout is now stacked (title above meta) so the meta sits
   visually close to the title on both desktop and mobile, per the
   playbook (metadata secondary to title/action). #}
{% macro courseGroupCards(courses) %}
  {% for course in courses %}
  <article class="card shadow-sm border-0" data-opetus-course data-course-id="{{ course.courseId }}">
    <div class="card-body">
      <div class="d-flex flex-wrap align-items-baseline gap-2 mb-2">
        <h3 class="h5 fw-bold mb-0">{{ course.courseName }}</h3>
        <span class="badge text-bg-light border text-dark">{{ course.courseId }}</span>
      </div>
      <div class="list-group list-group-flush mb-0" data-opetus-implementations>
        {% for implementation in course.implementations %}
        <a class="list-group-item list-group-item-action bg-transparent px-0 py-3" href="{{ implementation.pageUrl }}" data-opetus-implementation data-period-id="{{ implementation.periodId }}">
          <div class="fw-semibold">{{ implementation.semesterLabel or implementation.academicYear }}</div>
          <div class="small text-muted mt-1">
            {% if implementation.academicYear %}{{ implementation.academicYear }}{% endif %}
            {% if implementation.period %}<span aria-hidden="true"> · </span>Periodi {{ implementation.period }}{% endif %}
            {% if implementation.creditsLabel %}<span aria-hidden="true"> · </span>{{ implementation.creditsLabel }}{% endif %}
            {% if implementation.teachingUnitLabel %}<span aria-hidden="true"> · </span>{{ implementation.teachingUnitLabel }}{% endif %}
          </div>
        </a>
        {% endfor %}
      </div>
    </div>
  </article>
  {% endfor %}
{% endmacro %}

{% macro courseCountBadge(courses) %}
<span class="badge text-bg-light border text-dark align-self-start">{{ courses.length }} {% if courses.length == 1 %}kurssi{% else %}kurssia{% endif %}</span>
{% endmacro %}

<section class="py-5 border-bottom bg-body-tertiary">
  <div class="site-shell">
    <p class="text-uppercase text-muted fw-semibold small mb-2">Yliopistotyö</p>
    <h1 class="display-6 fw-bold mb-3">Opetus</h1>
    <p class="lead mb-0">Julkiset kurssisivut ja opetukseen liittyvät kokonaisuudet Oulun yliopiston opettajankoulutuksessa. Tämä sivu vie kurssitoteutuksiin ja opetuksen arviointinäyttöön; ei ole opetusportfolion tai työprofiilin korvike.</p>
  </div>
</section>

<section class="py-5" id="nykyinen-opetus" aria-labelledby="opetus-nykyinen-heading">
  <div class="site-shell">
    <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
      <div>
        <h2 id="opetus-nykyinen-heading" class="h3 fw-bold mb-1">Nykyinen opetus</h2>
        <p class="text-muted mb-0">Kuluvan lukuvuoden julkiset kurssisivut. Virallinen kurssikuvaus löytyy Oulun yliopiston Peppi-oppaasta.</p>
      </div>
      {{ courseCountBadge(coursePages.catalogCurrent) }}
    </div>

    <div class="vstack gap-3" data-opetus-catalog="current">
      {{ courseGroupCards(coursePages.catalogCurrent) }}
    </div>
  </div>
</section>

<section class="py-5 border-top" id="aiemmat-kurssitoteutukset" aria-labelledby="opetus-aiemmat-heading">
  <div class="site-shell">
    <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
      <div>
        <h2 id="opetus-aiemmat-heading" class="h3 fw-bold mb-1">Aiemmat kurssitoteutukset</h2>
        <p class="text-muted mb-0" data-opetus-historical-notice>Aiemmat kurssitoteutukset tuodaan parhaillaan käsin osaksi tätä luetteloa, joten kaikkia vanhoja toteutuksia ei vielä näy täällä.</p>
      </div>
      {{ courseCountBadge(coursePages.catalogHistorical) }}
    </div>

    <div class="vstack gap-3" data-opetus-catalog="historical">
      {{ courseGroupCards(coursePages.catalogHistorical) }}
    </div>

    <p class="small text-muted mb-0 mt-4">Aiempien vuosien opetusmateriaalit ovat selattavissa myös <a href="/esitykset/">esitysten kokoelmasta</a>.</p>
  </div>
</section>

<section class="py-5 border-top bg-body-tertiary" id="opetuksen-liittyvat" aria-labelledby="opetus-liittyvat-heading">
  <div class="site-shell">
    <h2 id="opetus-liittyvat-heading" class="h3 fw-bold mb-3">Opetukseen liittyvät kokonaisuudet</h2>
    <p class="text-muted mb-4">Nämä sivut käsittelevät opetusta pedagogisen näytön, palautteen ja yliopistotyön laajemman roolin näkökulmasta. Ne täydentävät kurssitoteutuksia, mutta eivät ole kurssirakenteen korvikkeita.</p>

    <div class="row g-4">
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body p-4">
            <p class="text-uppercase small text-muted fw-semibold mb-2">Pedagoginen näyttö</p>
            <h3 class="h5 fw-bold mb-3">
              <a href="/portfolio/" class="text-decoration-none">Opetusportfolio</a>
            </h3>
            <p class="mb-3">Pedagogiset periaatteet, opetuskokemus, opetuksen laadun arviointi ja opetusansiot.</p>
            <a class="btn btn-outline-primary rounded-pill px-3" href="/portfolio/">Avaa opetusportfolio</a>
          </div>
        </div>
      </div>

      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body p-4">
            <p class="text-uppercase small text-muted fw-semibold mb-2">Opiskelijoiden ääni</p>
            <h3 class="h5 fw-bold mb-3">
              <a href="/opiskelijoiden-antamaa-palautetta/" class="text-decoration-none">Opiskelijapalaute</a>
            </h3>
            <p class="mb-3">Kurssikohtainen opiskelijapalaute yliopisto-opintojaksoilta ja opetuksen kehittäminen.</p>
            <a class="btn btn-outline-primary rounded-pill px-3" href="/opiskelijoiden-antamaa-palautetta/">Avaa opiskelijapalaute</a>
          </div>
        </div>
      </div>

      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body p-4">
            <p class="text-uppercase small text-muted fw-semibold mb-2">Yliopistotyö kokonaisuutena</p>
            <h3 class="h5 fw-bold mb-3">
              <a href="/tyoni-yliopistonlehtorina/" class="text-decoration-none">Työni yliopistonlehtorina</a>
            </h3>
            <p class="mb-3">Opetuksen, tutkimuksen ja yhteiskunnallisen vaikuttamisen kokonaiskuva yliopistotyössä.</p>
            <a class="btn btn-outline-primary rounded-pill px-3" href="/tyoni-yliopistonlehtorina/">Avaa työprofiili</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
