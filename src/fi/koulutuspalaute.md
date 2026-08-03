---
title: Täydennyskoulutuspalaute
metaTitle: Täydennyskoulutuspalaute ja koulutustyön kehittäminen
description: "Täydennyskoulutusten ja asiantuntijatilaisuuksien palautteen kooste 2017–2026: toistuvat vahvuudet (käytännönläheisyys, konkreettiset työkalut kuten Somekone, tekoälyn hyödyntämisen konkretisointi) ja kehittämiskohteet (aika harjoittelulle, rauhallisempi tempo, kohderyhmäräätälöinti, ennakkomateriaali ajoissa)."
date: 2026-08-02
modified: 2026-08-03
layout: base.njk
templateEngineOverride: njk,md
translationKey: fi_only_koulutuspalaute
permalink: /koulutuspalaute/
pageShell: true
schemaType: CollectionPage
schemaAbout:
  - "@type": "Thing"
    name: "Täydennyskoulutuspalaute"
    description: "Koulutuksista, webinaareista ja asiantuntijatilaisuuksista saatu osallistujapalaute."
  - "@type": "Thing"
    name: "Koulutustyön kehittäminen"
    description: "Palautteen hyödyntäminen tulevien koulutusten suunnittelussa."
---

<section class="training-feedback-page">

<header class="tfb-hero">
  <p class="tfb-kicker">Larux · palaute {{ trainingFeedback.meta.aikavali }}</p>
  <h1 class="tfb-title">Täydennyskoulutuspalaute</h1>
  <p class="tfb-lead">Tämä osio kokoaa täydennyskoulutuksista, webinaareista ja asiantuntijatilaisuuksista saatua palautetta. Aineisto koostuu osallistujakyselyistä, palautekoosteista, järjestäjien välittämistä palautteista sekä osallistujien raakalainauksista. Jokaisen lähteen kohdalla on merkitty näytön vahvuus.</p>

  <dl class="tfb-kpi-grid">
    <div class="tfb-kpi">
      <dt>Aikaväli</dt>
      <dd>{{ trainingFeedback.meta.aikavali }}</dd>
    </div>
    <div class="tfb-kpi">
      <dt>Tilaisuuksia aineistossa</dt>
      <dd>{{ trainingFeedback.meta.tilaisuuksia }}</dd>
    </div>
    <div class="tfb-kpi">
      <dt>OpoAI-osallistujia</dt>
      <dd>{{ trainingFeedback.meta.opoAIOsallistujia }}</dd>
    </div>
    <div class="tfb-kpi">
      <dt>Kainutlaatuinen ope 2017</dt>
      <dd>{{ trainingFeedback.meta.kainutlaatuinenKeskiarvo }}</dd>
    </div>
  </dl>

  <p class="tfb-rajaus"><em>Rajaus: Osio ei sisällä yliopiston opintojaksojen opiskelijapalautetta. Ne on koottu omalle sivulleen <a href="/opiskelijoiden-antamaa-palautetta/">Opiskelijapalaute ja opetuksen kehittäminen</a>.</em></p>
</header>

<section class="tfb-timeline" aria-label="Palautteen kertymisen aikajana">
  <p class="tfb-kicker">Aikajana</p>
  <ol class="tfb-timeline-track">
    {% for kohta in trainingFeedback.aikajana %}
    <li><span class="tfb-timeline-year">{{ kohta.vuosi }}</span><span class="tfb-timeline-label">{{ kohta.kuvaus }}</span></li>
    {% endfor %}
  </ol>
</section>

<div class="tfb-columns">

<article class="tfb-column tfb-column--positive">
  <h2>Toistuvat vahvuudet</h2>
  <ul class="tfb-theme-list">
    {% for teema in trainingFeedback.toistuvatTeemat.vahvuudet %}
    <li>{{ teema }}</li>
    {% endfor %}
  </ul>
</article>

<article class="tfb-column tfb-column--growth">
  <h2>Toistuvat kehityskohteet</h2>
  <ul class="tfb-theme-list">
    {% for teema in trainingFeedback.toistuvatTeemat.kehityskohteet %}
    <li>{{ teema }}</li>
    {% endfor %}
  </ul>
</article>

</div>

<section class="tfb-impact">
  <p class="tfb-kicker">Portfolio · vaikuttavuus</p>
  <h2>Palautteen havaittuja vaikutuksia</h2>
  <p>Aineistossa on kolme tapausta, joissa palautteella on ollut dokumentoitu vaikutus koulutuksen jatkoon tai osallistujien toimintaan:</p>

  <ol class="tfb-impact-list">
    {% for vaikutus in trainingFeedback.vaikutukset %}
    <li>
      <strong>{{ vaikutus.otsikko }}</strong>
      <span>{{ vaikutus.kuvaus }}</span>
    </li>
    {% endfor %}
  </ol>
</section>

<section class="tfb-sources">
  <p class="tfb-kicker">Lähteet ja tilaisuudet</p>
  <h2>Palautelähteet tilaisuuksittain</h2>

  <ul class="tfb-legend" aria-label="Näytön vahvuuden selitys">
    <li><span class="tfb-legend-dot tfb-legend-dot--strong" aria-hidden="true"></span>Vahva näyttö — dokumentoitu osallistujapalaute</li>
    <li><span class="tfb-legend-dot tfb-legend-dot--medium" aria-hidden="true"></span>Keskivahva — palautekooste tai järjestäjän välittämä palaute</li>
    <li><span class="tfb-legend-dot tfb-legend-dot--weak" aria-hidden="true"></span>Heikko — viittaus palautteeseen, jota ei ole voitu varmentaa</li>
  </ul>

  <div class="tfb-source-list">
    {% for tilaisuus in trainingFeedback.tilaisuudet %}
    <article class="tfb-source-card">
      <header class="tfb-source-head">
        <div>
          <h3>{{ tilaisuus.nimi }}</h3>
          <p class="tfb-source-meta">{{ tilaisuus.meta }}</p>
        </div>
        <span class="tfb-badge tfb-badge--{{ tilaisuus.evidenceLevel }}">{{ tilaisuus.evidenceLabel }}</span>
      </header>
      <div class="tfb-source-body">
        {% if tilaisuus.havainnot and tilaisuus.havainnot.length %}
        <h4>Havainnot</h4>
        <ul>
          {% for h in tilaisuus.havainnot %}
          <li>{{ h }}</li>
          {% endfor %}
        </ul>
        {% endif %}
        {% if tilaisuus.kehittamiskohteet and tilaisuus.kehittamiskohteet.length %}
        <h4>Kehittämiskohteet</h4>
        <ul>
          {% for k in tilaisuus.kehittamiskohteet %}
          <li>{{ k }}</li>
          {% endfor %}
        </ul>
        {% endif %}
        {% if tilaisuus.rajoitteet and tilaisuus.rajoitteet.length %}
        <h4>Rajoitteet</h4>
        <ul>
          {% for r in tilaisuus.rajoitteet %}
          <li>{{ r }}</li>
          {% endfor %}
        </ul>
        {% endif %}
        {% if tilaisuus.esitys %}
        <p class="tfb-source-link"><a href="{{ tilaisuus.esitys.url }}" target="_blank" rel="noopener noreferrer">Esitys "{{ tilaisuus.esitys.nimi }}" Canvassa{% if tilaisuus.esitys.huomautus %} ({{ tilaisuus.esitys.huomautus }}){% endif %} <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i></a></p>
        {% endif %}
      </div>
    </article>
    {% endfor %}
  </div>
</section>

<aside class="tfb-crosslink">
  <p><strong>Katso myös:</strong> <a href="/opiskelijoiden-antamaa-palautetta/">Yliopisto-opintojaksojen opiskelijapalaute</a> ja <a href="/kouluttaja/">Larux — koulutuspalvelut</a>.</p>
</aside>

</section>

<style>
.training-feedback-page {
  display: block;
}

/* Hero */
.tfb-hero {
  padding: 1.5rem clamp(1rem, 3vw, 2rem);
  margin-bottom: 1.5rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at 100% 0%, rgba(13, 110, 253, 0.08), transparent 42%),
    var(--bs-body-bg);
}

.tfb-kicker {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
  margin-bottom: 0.5rem;
}

.tfb-title {
  font-family: var(--bs-font-family-heading);
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  line-height: 1.15;
  margin: 0 0 0.85rem;
}

.tfb-lead {
  color: var(--bs-secondary-color);
  max-width: 62rem;
  margin: 0 0 1.25rem;
  font-size: 1.03rem;
  line-height: 1.55;
}

.tfb-rajaus {
  margin: 1rem 0 0;
  font-size: 0.88rem;
  color: var(--bs-secondary-color);
}

.tfb-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.85rem;
  margin: 0.5rem 0 0;
}

.tfb-kpi {
  padding: 0.85rem 1rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.85rem;
  background: var(--bs-tertiary-bg);
}

.tfb-kpi dt {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
  margin-bottom: 0.3rem;
}

.tfb-kpi dd {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--bs-body-color);
  line-height: 1.1;
}

/* Aikajana */
.tfb-timeline {
  padding: 1.15rem clamp(1rem, 3vw, 1.75rem);
  margin-bottom: 1.5rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 1rem;
  background: var(--bs-body-bg);
}

.tfb-timeline-track {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0;
  position: relative;
}

.tfb-timeline-track::before {
  content: "";
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  top: 0.55rem;
  height: 2px;
  background: var(--bs-border-color);
  z-index: 0;
}

.tfb-timeline-track li {
  position: relative;
  padding-top: 1.5rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  z-index: 1;
}

.tfb-timeline-track li::before {
  content: "";
  position: absolute;
  left: 0.75rem;
  top: 0;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  background: var(--bs-primary);
  border: 3px solid var(--bs-body-bg);
  box-sizing: content-box;
  transform: translateX(-0.05rem);
}

.tfb-timeline-year {
  display: block;
  font-family: var(--bs-font-family-heading);
  font-size: 1rem;
  font-weight: 800;
  color: var(--bs-primary);
  margin-bottom: 0.15rem;
}

.tfb-timeline-label {
  display: block;
  font-size: 0.85rem;
  color: var(--bs-secondary-color);
  line-height: 1.35;
}

/* Yhteenveto-sarakkeet */
.tfb-columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
}

@media (min-width: 992px) {
  .tfb-columns {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
}

.tfb-column {
  padding: 1.25rem clamp(1rem, 2.5vw, 1.5rem);
  border: 1px solid var(--bs-border-color);
  border-radius: 1rem;
  background: var(--bs-body-bg);
}

.tfb-column--positive {
  border-top: 3px solid var(--bs-success);
}

.tfb-column--growth {
  border-top: 3px solid var(--bs-warning);
}

.tfb-column h2 {
  font-family: var(--bs-font-family-heading);
  font-size: 1.4rem;
  margin: 0 0 0.85rem;
}

.tfb-theme-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.55rem;
}

.tfb-theme-list li {
  padding: 0.65rem 0.85rem 0.65rem 2.15rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.7rem;
  background: var(--bs-tertiary-bg);
  font-weight: 500;
  color: var(--bs-body-color);
  position: relative;
}

.tfb-column--positive .tfb-theme-list li::before {
  content: "✓";
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bs-success);
  font-weight: 700;
}

.tfb-column--growth .tfb-theme-list li::before {
  content: "→";
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bs-warning);
  font-weight: 700;
}

/* Impact / vaikuttavuus */
.tfb-impact {
  padding: 1.5rem clamp(1rem, 3vw, 2rem);
  margin-bottom: 1.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 1rem;
  background: var(--bs-body-bg);
}

.tfb-impact h2 {
  font-family: var(--bs-font-family-heading);
  font-size: 1.5rem;
  margin: 0.35rem 0 0.85rem;
}

.tfb-impact-list {
  list-style: none;
  padding: 0;
  counter-reset: tfb-impact;
  margin: 1rem 0 0;
  display: grid;
  gap: 0.85rem;
}

.tfb-impact-list li {
  counter-increment: tfb-impact;
  position: relative;
  padding: 1rem 1.15rem 1rem 3rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.75rem;
  background: var(--bs-tertiary-bg);
}

.tfb-impact-list li::before {
  content: counter(tfb-impact, decimal-leading-zero);
  position: absolute;
  left: 1rem;
  top: 1rem;
  font-family: var(--bs-font-family-heading);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--bs-primary);
}

.tfb-impact-list strong {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 1rem;
}

.tfb-impact-list span {
  color: var(--bs-secondary-color);
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Lähdekortit */
.tfb-sources {
  padding: 1.5rem clamp(1rem, 3vw, 2rem);
  margin-bottom: 1.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 1rem;
  background: var(--bs-body-bg);
}

.tfb-sources h2 {
  font-family: var(--bs-font-family-heading);
  font-size: 1.5rem;
  margin: 0.35rem 0 0.85rem;
}

.tfb-legend {
  list-style: none;
  padding: 0.7rem 0.9rem;
  margin: 0 0 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.5rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.7rem;
  background: var(--bs-tertiary-bg);
  font-size: 0.82rem;
  color: var(--bs-secondary-color);
}

.tfb-legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.tfb-legend-dot {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.tfb-legend-dot--strong {
  background: #146c43;
}

.tfb-legend-dot--medium {
  background: #997404;
}

.tfb-legend-dot--weak {
  background: #6c757d;
}

.tfb-source-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.tfb-source-card {
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.85rem;
  background: var(--bs-tertiary-bg);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.tfb-source-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.tfb-source-head h3 {
  font-family: var(--bs-font-family-heading);
  font-size: 1.2rem;
  margin: 0 0 0.2rem;
  color: var(--bs-body-color);
  line-height: 1.3;
}

.tfb-source-meta {
  font-size: 0.85rem;
  color: var(--bs-secondary-color);
  margin: 0;
}

.tfb-badge {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  white-space: nowrap;
  letter-spacing: 0.03em;
}

.tfb-badge--vahva {
  background: rgba(25, 135, 84, 0.15);
  color: #146c43;
}

.tfb-badge--keskivahva {
  background: rgba(255, 193, 7, 0.18);
  color: #997404;
}

.tfb-badge--heikko {
  background: rgba(108, 117, 125, 0.16);
  color: #495057;
}

[data-bs-theme="dark"] .tfb-badge--vahva {
  background: rgba(25, 135, 84, 0.28);
  color: #75d798;
}

[data-bs-theme="dark"] .tfb-badge--keskivahva {
  background: rgba(255, 193, 7, 0.28);
  color: #ffd45c;
}

[data-bs-theme="dark"] .tfb-badge--heikko {
  background: rgba(108, 117, 125, 0.28);
  color: #adb5bd;
}

.tfb-source-body h4 {
  font-family: var(--bs-font-family-heading);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bs-secondary-color);
  margin: 0.75rem 0 0.4rem;
}

.tfb-source-body h4:first-of-type {
  margin-top: 0;
}

.tfb-source-body ul {
  padding-left: 1.2rem;
  margin: 0;
  color: var(--bs-body-color);
  font-size: 0.92rem;
  line-height: 1.55;
}

.tfb-source-body li + li {
  margin-top: 0.3rem;
}

.tfb-source-link {
  margin: 0.85rem 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--bs-border-color);
  font-size: 0.88rem;
}

.tfb-source-link a {
  color: var(--bs-primary);
  text-decoration: none;
  font-weight: 600;
}

.tfb-source-link a:hover {
  text-decoration: underline;
}

/* Crosslink */
.tfb-crosslink {
  padding: 1rem 1.15rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.75rem;
  background: var(--bs-tertiary-bg);
  font-size: 0.92rem;
  color: var(--bs-secondary-color);
}

.tfb-crosslink p {
  margin: 0;
}

/* Mobiili */
@media (max-width: 575.98px) {
  .tfb-title {
    font-size: 1.5rem;
  }

  .tfb-source-head {
    flex-direction: column;
    gap: 0.5rem;
  }

  .tfb-badge {
    align-self: flex-start;
  }

  .tfb-timeline-track::before {
    display: none;
  }

  .tfb-timeline-track li {
    padding-top: 0.85rem;
    padding-left: 1.5rem;
  }

  .tfb-timeline-track li::before {
    left: 0;
    top: 1.05rem;
    transform: none;
  }
}
</style>
