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
    <h2 id="opetus-kurssitoteutukset-heading" class="h3 fw-bold mb-3">Kurssitoteutukset</h2>
    <p class="text-muted mb-4">Julkiset kurssisivut sisältävät kurssin perustiedot, luentoaikataulun ja saatavilla olevat esitysmateriaalit. Virallinen kurssikuvaus löytyy Oulun yliopiston Peppi-oppaasta.</p>

    <div class="vstack gap-4" data-opetus-catalog>
      {% for course in coursePages.catalog %}
      <article class="card shadow-sm" data-opetus-course data-course-id="{{ course.courseId }}">
        <div class="card-body p-4 p-lg-5">
          <h3 class="h4 fw-bold mb-3">{{ course.courseName }}</h3>
          <div class="d-flex flex-wrap gap-2 mb-4">
            <span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">{{ course.courseId }}</span>
          </div>
          <div class="vstack gap-3" data-opetus-implementations>
            {% for implementation in course.implementations %}
            <section data-opetus-implementation data-period-id="{{ implementation.periodId }}">
              {% if implementation.teachingUnitLabel %}<p class="text-uppercase small text-muted fw-semibold mb-2">{{ implementation.teachingUnitLabel }}</p>{% endif %}
              <h4 class="h5 fw-bold mb-2"><a href="{{ implementation.pageUrl }}" class="text-decoration-none">{{ implementation.semesterLabel or implementation.academicYear }}</a></h4>
              <div class="d-flex flex-wrap gap-2 mb-3">
                {% if implementation.creditsLabel %}<span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">{{ implementation.creditsLabel }}</span>{% endif %}
                {% if implementation.academicYear %}<span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">{{ implementation.academicYear }}</span>{% endif %}
                {% if implementation.period %}<span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">Periodi {{ implementation.period }}</span>{% endif %}
              </div>
              <a class="btn btn-primary rounded-pill px-4" href="{{ implementation.pageUrl }}">Avaa kurssisivu</a>
            </section>
            {% endfor %}
          </div>
        </div>
      </article>
      {% endfor %}
    </div>

    <p class="small text-muted mb-0 mt-4">Tällä hetkellä julkinen kurssisivu on avattu vain yhdelle toteutukselle. Aiempien vuosien opetusmateriaaleja on selattavissa erikseen esitysten kokoelmasta.</p>
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
