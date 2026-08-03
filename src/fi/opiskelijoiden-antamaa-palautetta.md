---
title: Opiskelijapalaute ja opetuksen kehittäminen
date: 2013-02-07
modified: 2026-08-03
description: "Opetusportfolion opiskelijapalaute-osio: yliopiston opintojaksojen kurssikohtainen palaute 2013–2023, mukana sekä myönteiset teemat että kehittämiskohteet."
layout: base.njk
templateEngineOverride: njk,md
translationKey: fi_only_opiskelijapalaute
permalink: /opiskelijoiden-antamaa-palautetta/
pageShell: true
schemaAbout:
  - "@type": "Thing"
    name: "Opiskelijapalaute"
    description: "Yliopiston opintojaksoihin liittyvä opiskelijapalaute ja sen hyödyntäminen opetuksen kehittämisessä."
  - "@type": "Thing"
    name: "Opetuksen kehittäminen"
    description: "Palautteen käyttö kurssirakenteiden, ohjeistusten, arvioinnin ja aikataulujen kehittämiseen."
---

<section class="student-feedback-page">

<header class="sfb-hero">
  <p class="sfb-kicker">Opetusportfolio · palaute {{ studentFeedback.meta.aikavali }}</p>
  <h1 class="sfb-title">Opiskelijapalaute ja opetuksen kehittäminen</h1>
  <p class="sfb-lead">Tämä osio kokoaa yliopiston opintojaksoihini liittyvää opiskelijapalautetta kurssikohtaisesti. Aineisto on kerätty kurssikohtaisista palauteraporteista (Peppi/WebOodi), sähköpostitse välitetyistä opiskelijapalautteista sekä kurssien portfoliovastauksista.</p>

  <dl class="sfb-kpi-grid">
    <div class="sfb-kpi">
      <dt>Aikaväli</dt>
      <dd>{{ studentFeedback.meta.aikavali }}</dd>
    </div>
    <div class="sfb-kpi">
      <dt>Kursseja</dt>
      <dd>{{ studentFeedback.meta.kursseja }}</dd>
    </div>
    <div class="sfb-kpi">
      <dt>TEL1-kurssi (2013)</dt>
      <dd>{{ studentFeedback.meta.tel1Keskiarvo }}</dd>
    </div>
    <div class="sfb-kpi">
      <dt>Portfoliovastauksia</dt>
      <dd>{{ studentFeedback.meta.portfoliovastauksia }}</dd>
    </div>
  </dl>

  <p class="sfb-rajaus"><em>Rajaus: vain yliopisto-opintojaksojen opiskelijapalaute. Täydennyskoulutusten palaute on koottu omalle sivulleen <a href="/koulutuspalaute/">Täydennyskoulutuspalaute</a>.</em></p>
</header>

{% for kurssi in studentFeedback.kurssit %}
<section class="sfb-course">
  <header class="sfb-course-head">
    <div>
      <p class="sfb-kicker">{{ kurssi.vuosi }}</p>
      <h2>{{ kurssi.nimi }}</h2>
      <p class="sfb-course-meta">{{ kurssi.aineistonTyyppi }}</p>
    </div>
    {% if kurssi.mittarit and kurssi.mittarit.length %}
    <dl class="sfb-course-metrics">
      {% for mittari in kurssi.mittarit %}
      <div><dt>{{ mittari.label }}</dt><dd>{{ mittari.arvo }}</dd></div>
      {% endfor %}
    </dl>
    {% endif %}
  </header>

  <div class="sfb-course-body">
    {% if kurssi.myonteinen and kurssi.myonteinen.length %}
    <div class="sfb-course-col sfb-course-col--positive">
      <h3>Myönteinen palaute</h3>
      {% for lainaus in kurssi.myonteinen %}
      <blockquote>{{ lainaus.teksti }}</blockquote>
      {% endfor %}
    </div>
    {% endif %}
    {% if kurssi.kehittaminen and kurssi.kehittaminen.length %}
    <div class="sfb-course-col sfb-course-col--growth">
      <h3>Kehittämiskohteet</h3>
      {% for lainaus in kurssi.kehittaminen %}
      <blockquote>{{ lainaus.teksti }}</blockquote>
      {% endfor %}
    </div>
    {% endif %}
    {% if kurssi.huomautus %}
    <p class="sfb-course-note">{{ kurssi.huomautus }}</p>
    {% endif %}
  </div>
</section>
{% endfor %}

<section class="sfb-collection-traces">
  <h2>Palautteen keruun jäljet muilla kursseilla</h2>
  <p class="sfb-column-note">Palautetta on kerätty systemaattisesti myös näiltä kursseilta, mutta koosteet ovat sähköpostiliitteinä eikä niiden sisältöä ole vielä purettu tähän osioon.</p>
  <table>
    <thead>
      <tr><th>Kurssikoodi</th><th>Kurssin nimi</th><th>Vuodet</th></tr>
    </thead>
    <tbody>
      {% for kurssi in studentFeedback.keruunJaljet %}
      <tr><td>{{ kurssi.koodi }}</td><td>{{ kurssi.nimi }}</td><td>{{ kurssi.vuodet }}</td></tr>
      {% endfor %}
    </tbody>
  </table>
</section>

<details class="sfb-historical">
  <summary><span>Historiallisia lainauksia (2012–2013)</span></summary>
  <div class="sfb-historical-body">
    <p>Sivun aiemmasta versiosta säilytetyt lainaukset perusopetuksen ja Edutool-maisteriohjelman kursseilta.</p>

    <h3>Perusopetus — TVT pedagogisena työvälineenä</h3>
    <p>Ylioppilaskunnan teemapäivä "anna omena hyvälle opettajalle" 2012:</p>
    <blockquote>"Moi! Tässä hyvälle opelle omena koko ryhmältä!!! :D"</blockquote>

    <p>Opiskelijan sähköpostitse lähettämä viesti:</p>
    <blockquote>"Hei Jari, täydensin puuttuvat blogiartikkelit. […] Oli muuten oikeasti hyvä kurssi, kiitos! Mukavaa alkanutta vuotta 2013."</blockquote>

    <h3>Edutool-maisteriohjelma</h3>
    <blockquote>"Blogin käyttö oman oppimisen välineenä ja ammatillisena työvälineenä. Teknologisten apuvälineiden käyttö oman oppimisen ja yhteisöllisen oppimisen tukena."</blockquote>
    <blockquote>"Jarin opetustyyli harjoituksissa. Sekä mahtavat sähköpostiohjeet mitä oli tehty ja mitä pitäisi tehdä."</blockquote>
    <blockquote>"Lisäksi harjoituksissa oli vähän kiireen tuntu ja osa ohjelmista käytiin turhan nopeaa. […] Yleensäkin ohjeistusta ja tehtävänantoja harjoituksissa voisi selkeyttää."</blockquote>
    <blockquote>"Erityisen hyvin toimi kurssin alussa annettu tukiopetus. […] Pahimman stressin se leikkasi ja pystyin luottamaan, että etäjaksolla selviän."</blockquote>
  </div>
</details>

</section>

<style>
.student-feedback-page {
  display: block;
}

/* Hero */
.sfb-hero {
  padding: 1.5rem clamp(1rem, 3vw, 2rem);
  margin-bottom: 1.5rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at 100% 0%, rgba(13, 110, 253, 0.08), transparent 42%),
    var(--bs-body-bg);
}

.sfb-kicker {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
  margin-bottom: 0.4rem;
}

.sfb-title {
  font-family: var(--bs-font-family-heading);
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  line-height: 1.15;
  margin: 0 0 0.85rem;
}

.sfb-lead {
  color: var(--bs-secondary-color);
  max-width: 62rem;
  margin: 0 0 1.25rem;
  font-size: 1.03rem;
  line-height: 1.55;
}

.sfb-rajaus {
  margin: 1rem 0 0;
  font-size: 0.88rem;
  color: var(--bs-secondary-color);
}

.sfb-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.85rem;
  margin: 0.5rem 0 0;
}

.sfb-kpi {
  padding: 0.85rem 1rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.85rem;
  background: var(--bs-tertiary-bg);
}

.sfb-kpi dt {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
  margin-bottom: 0.3rem;
}

.sfb-kpi dd {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--bs-body-color);
  line-height: 1.1;
}

/* Kurssiosio */
.sfb-course {
  padding: 1.35rem clamp(1rem, 2.5vw, 1.75rem);
  margin-bottom: 1.35rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 1rem;
  background: var(--bs-body-bg);
}

.sfb-course-head {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--bs-border-color);
  margin-bottom: 1.15rem;
  display: grid;
  gap: 1rem;
}

@media (min-width: 992px) {
  .sfb-course-head {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 1.5rem;
  }
}

.sfb-course-head h2 {
  font-family: var(--bs-font-family-heading);
  font-size: 1.4rem;
  margin: 0 0 0.35rem;
  line-height: 1.2;
}

.sfb-course-meta {
  color: var(--bs-secondary-color);
  font-size: 0.88rem;
  margin: 0;
}

.sfb-course-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem 1rem;
  margin: 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.65rem;
  background: var(--bs-tertiary-bg);
  min-width: 0;
}

.sfb-course-metrics > div {
  min-width: 0;
}

.sfb-course-metrics dt {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
  margin-bottom: 0.15rem;
  line-height: 1.2;
}

.sfb-course-metrics dd {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--bs-body-color);
  line-height: 1.1;
}

.sfb-course-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 768px) {
  .sfb-course-body {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
}

.sfb-course-col h3 {
  font-family: var(--bs-font-family-heading);
  font-size: 1.05rem;
  margin: 0 0 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 2px solid var(--bs-border-color);
}

.sfb-course-col--positive h3 {
  border-bottom-color: var(--bs-success);
  color: var(--bs-body-color);
}

.sfb-course-col--growth h3 {
  border-bottom-color: var(--bs-warning);
  color: var(--bs-body-color);
}

.sfb-course-note {
  color: var(--bs-secondary-color);
  font-size: 0.95rem;
  line-height: 1.55;
  margin: 0;
}

/* Blockquotet */
.student-feedback-page blockquote {
  margin: 0.35rem 0 0.85rem;
  padding: 0.75rem 0.95rem;
  border-left: 0.2rem solid var(--bs-primary);
  border-radius: 0.6rem;
  background: var(--bs-tertiary-bg);
  color: var(--bs-body-color);
  font-size: 0.95rem;
  line-height: 1.55;
}

.sfb-course-col--positive blockquote {
  border-left-color: var(--bs-success);
}

.sfb-course-col--growth blockquote {
  border-left-color: var(--bs-warning);
}

.student-feedback-page blockquote cite {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--bs-secondary-color);
  font-style: normal;
}

/* Palautteen keruun jäljet */
.sfb-collection-traces {
  padding: 1.35rem clamp(1rem, 2.5vw, 1.75rem);
  margin-bottom: 1.35rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 1rem;
  background: var(--bs-body-bg);
}

.sfb-collection-traces h2 {
  font-family: var(--bs-font-family-heading);
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}

.sfb-column-note {
  color: var(--bs-secondary-color);
  font-size: 0.9rem;
  margin: 0 0 1rem;
  line-height: 1.55;
}

.sfb-collection-traces table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.sfb-collection-traces th,
.sfb-collection-traces td {
  padding: 0.55rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--bs-border-color);
  vertical-align: top;
}

.sfb-collection-traces th {
  background: var(--bs-tertiary-bg);
  font-weight: 600;
  color: var(--bs-secondary-color);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Historia */
.sfb-historical {
  margin: 0.5rem 0 0;
  padding: 0.85rem 1.15rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.85rem;
  background: var(--bs-tertiary-bg);
}

.sfb-historical > summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--bs-secondary-color);
  list-style: none;
}

.sfb-historical > summary::-webkit-details-marker {
  display: none;
}

.sfb-historical > summary::before {
  content: "▸";
  display: inline-block;
  margin-right: 0.5rem;
  transition: transform 0.2s;
}

.sfb-historical[open] > summary::before {
  transform: rotate(90deg);
}

.sfb-historical-body {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--bs-border-color);
}

.sfb-historical-body h3 {
  font-family: var(--bs-font-family-heading);
  font-size: 1rem;
  margin: 1.35rem 0 0.5rem;
}

.sfb-historical-body h3:first-of-type {
  margin-top: 0;
}

/* Mobiili */
@media (max-width: 575.98px) {
  .sfb-title {
    font-size: 1.5rem;
  }

  .student-feedback-page blockquote {
    padding: 0.7rem 0.85rem;
    font-size: 0.92rem;
  }

  .sfb-collection-traces table {
    display: block;
    overflow-x: auto;
  }
}
</style>
