---
title: "Opetus"
permalink: /opetus/
layout: base.njk
lang: fi
translationKey: teaching_fi_only
description: "Opetus-alue kokoaa yhteen Jari Larun julkiset kurssisivut, opetusportfolion, opiskelijapalautteen ja opetustyön kokonaiskuvan. Kurssitoteutukset ovat suomenkielisiä."
templateEngineOverride: md,njk
pageShell: true
schemaType: CollectionPage
---

<section class="py-5 border-bottom bg-body-tertiary">
  <div class="site-shell">
    <p class="text-uppercase text-muted fw-semibold small mb-2">Yliopistotyö</p>
    <h1 class="display-6 fw-bold mb-3">Opetus</h1>
    <p class="lead mb-0">Julkiset kurssisivut ja opetukseen liittyvät kokonaisuudet Oulun yliopiston opettajankoulutuksessa. Tämä sivu vie kurssitoteutuksiin ja opetuksen arviointinäyttöön; ei ole opetusportfolion tai työprofiilin korvike.</p>
  </div>
</section>

<section class="py-5" id="kurssitoteutukset" aria-labelledby="opetus-kurssitoteutukset-heading">
  <div class="site-shell">
    <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
      <div>
        <h2 id="opetus-kurssitoteutukset-heading" class="h3 fw-bold mb-1">Kurssitoteutukset</h2>
        <p class="text-muted mb-0">Julkiset kurssisivut sisältävät kurssin perustiedot, luentoaikataulun ja saatavilla olevat esitysmateriaalit. Virallinen kurssikuvaus löytyy Oulun yliopiston Peppi-oppaasta.</p>
      </div>
      <span class="badge text-bg-light border text-dark align-self-start">{{ coursePages.catalog.length }} kurssia</span>
    </div>

    <div class="vstack gap-3" data-opetus-catalog>
      {% for course in coursePages.catalog %}
      <article class="card shadow-sm border-0" data-opetus-course data-course-id="{{ course.courseId }}">
        <div class="card-body">
          <div class="d-flex flex-wrap align-items-baseline gap-2 mb-2">
            <h3 class="h5 fw-bold mb-0">{{ course.courseName }}</h3>
            <span class="badge text-bg-light border text-dark">{{ course.courseId }}</span>
          </div>
          <ul class="list-group list-group-flush mb-0" data-opetus-implementations>
            {% for implementation in course.implementations %}
            <li class="list-group-item px-0 py-2 d-flex flex-wrap align-items-baseline justify-content-between gap-3" data-opetus-implementation data-period-id="{{ implementation.periodId }}">
              <a class="fw-semibold text-decoration-none" href="{{ implementation.pageUrl }}">{{ implementation.semesterLabel or implementation.academicYear }}</a>
              <span class="small text-muted">
                {% if implementation.academicYear %}{{ implementation.academicYear }}{% endif %}
                {% if implementation.period %}<span aria-hidden="true"> · </span>Periodi {{ implementation.period }}{% endif %}
                {% if implementation.creditsLabel %}<span aria-hidden="true"> · </span>{{ implementation.creditsLabel }}{% endif %}
                {% if implementation.teachingUnitLabel %}<span aria-hidden="true"> · </span>{{ implementation.teachingUnitLabel }}{% endif %}
              </span>
            </li>
            {% endfor %}
          </ul>
        </div>
      </article>
      {% endfor %}
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
