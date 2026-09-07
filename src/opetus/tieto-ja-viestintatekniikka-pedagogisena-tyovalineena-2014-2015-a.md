---
title: "Tieto- ja viestintätekniikka pedagogisena työvälineenä - syksy 2014"
description: "Opintojakson 410014Y julkiset säilyneet kurssimateriaalit syksyltä 2014."
layout: base.njk
templateEngineOverride: njk
permalink: /opetus/tieto-ja-viestintatekniikka-pedagogisena-tyovalineena/2014-2015-a/
lang: fi
pageShell: true
translationKey: course_410014y_2014_2015_a_fi_only
course:
  courseId: 410014Y
  courseName: Tieto- ja viestintätekniikka pedagogisena työvälineenä
  academicYear: "2014–2015"
  semesterLabel: Syksy 2014
  periodId: "2014-2015-a"
  lectures:
    - number: 1
      title: Johdantoluento
      presentationPageUrl: /presentations/ss-410014y-johdantoluento-tieto-ja-viestintatekniikka-pedagogisena-tyovalineena-201/
    - number: 2
      title: Tämän vuosisadan ydintaidot
      presentationPageUrl: /presentations/ss-410014y-luento-2-taman-vuosisadan-ydintaidot-21th-skills-ja-koulun-muutospaineet/
    - number: 4
      title: Sopimukset ja tekijänoikeudet
      presentationPageUrl: /presentations/ss-410014y-luento-4-sopimukset-ja-tekijanoikeudet/
---

<section class="py-5 bg-body-tertiary border-bottom"><div class="site-shell">
<p class="text-uppercase text-muted fw-semibold small mb-2">Opetus</p>
<h1 class="display-6 fw-bold mb-3">{{ title }}</h1>
<p class="lead mb-3">Kurssin {{ course.courseId }} säilyneet julkiset materiaalit lukuvuodelta {{ course.academicYear }}.</p>
<div class="d-flex flex-wrap gap-2"><span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">{{ course.courseId }}</span><span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">{{ course.semesterLabel }}</span></div>
</div></section>
<section class="py-5"><div class="site-shell"><h2 class="h3 fw-bold mb-3">Säilyneet luentomateriaalit</h2><p class="text-muted">Tämä historiallinen sivu kokoaa kolme vahvistetusti samaan kurssitoteutukseen kuuluvaa julkista esitysmateriaalia. Kurssin täydellinen luentosarja ei ole julkisesti saatavilla — säilyneet numeroidut osat ovat 1, 2 ja 4. Muita osia ei rekonstruoida.</p><ul class="list-group">{% for lecture in course.lectures %}<li class="list-group-item"><a href="{{ lecture.presentationPageUrl }}" class="fw-semibold text-decoration-none">Luento {{ lecture.number }}: {{ lecture.title }}</a></li>{% endfor %}</ul></div></section>
