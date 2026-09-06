---
title: "Tieto- ja viestintätekniikka pedagogisena työvälineenä - syksy 2013"
description: "Opintojakson 410014Y julkiset säilyneet kurssimateriaalit syksyltä 2013."
layout: base.njk
templateEngineOverride: njk
permalink: /opetus/tieto-ja-viestintatekniikka-pedagogisena-tyovalineena/2013-2014-a/
lang: fi
pageShell: true
translationKey: course_410014y_2013_2014_a_fi_only
course:
  courseId: 410014Y
  courseName: Tieto- ja viestintätekniikka pedagogisena työvälineenä
  academicYear: "2013–2014"
  semesterLabel: Syksy 2013
  periodId: "2013-2014-a"
  lectures:
    - number: 1
      title: Johdanto
      presentationPageUrl: /presentations/ss-luento1-johdanto-410014y-tvt-pedagogiset-perusteet/
    - number: 2
      title: Teoria
      presentationPageUrl: /presentations/ss-luento-2-teoria-410014y-tieto-ja-viestintatekniikka-pedagogisena-valineena/
    - number: 3
      title: Suunnittelu ja pedagogiset mallit
      presentationPageUrl: /presentations/ss-luento-3-suunnittelu-ja-pedagogiset-mallit-410014y-tieto-ja-viestintatekniikka-p/
    - number: 5
      title: Haasteet ja koulun todellisuus
      presentationPageUrl: /presentations/ss-luento-5-haasteet-ja-koulun-todellisuus-410014y/
---

<section class="py-5 bg-body-tertiary border-bottom"><div class="site-shell">
<p class="text-uppercase text-muted fw-semibold small mb-2">Opetus</p>
<h1 class="display-6 fw-bold mb-3">{{ title }}</h1>
<p class="lead mb-3">Kurssin {{ course.courseId }} säilyneet julkiset materiaalit lukuvuodelta {{ course.academicYear }}.</p>
<div class="d-flex flex-wrap gap-2"><span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">{{ course.courseId }}</span><span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">{{ course.semesterLabel }}</span></div>
</div></section>
<section class="py-5"><div class="site-shell"><h2 class="h3 fw-bold mb-3">Säilyneet luentomateriaalit</h2><p class="text-muted">Tämä historiallinen sivu kokoaa neljä vahvistetusti samaan kurssitoteutukseen kuuluvaa julkista esitysmateriaalia. Se ei rekonstruoi täydellistä opetussuunnitelmaa tai luentosarjaa.</p><ul class="list-group">{% for lecture in course.lectures %}<li class="list-group-item"><a href="{{ lecture.presentationPageUrl }}" class="fw-semibold text-decoration-none">Luento {{ lecture.number }}: {{ lecture.title }}</a></li>{% endfor %}</ul></div></section>
