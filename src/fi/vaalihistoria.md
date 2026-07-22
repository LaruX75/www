---
title: "Vaalikaudet"
metaTitle: Vaalikaudet ja poliittinen työ
permalink: /vaalikaudet/
layout: base.njk
lang: fi
translationKey: election_history
description: "Jari Larun poliittinen työ vaalikausittain: luottamustoimet, vaalitulokset, puheenvuorot, valtuustoaloitteet ja muut relevantit sisällöt samassa näkymässä."
templateEngineOverride: njk
schemaAbout:
  - "@type": "Thing"
    name: "Oulun kaupunginvaltuusto 2025–2029"
    description: "2. varavaltuutettu ja sivistyslautakunnan jäsen."
  - "@type": "Thing"
    name: "Pohjois-Pohjanmaan aluevaltuusto 2022–2025"
    description: "Aluevaltuuston varajäsen."
  - "@type": "Thing"
    name: "Oulun kaupunginvaltuusto 2021–2025"
    description: "Valtuutettu ja sivistyslautakunnan varajäsen."
  - "@type": "Thing"
    name: "Vaalikaudet ja poliittinen työ"
    description: "Puheenvuorot, valtuustoaloitteet ja luottamustoimet vaalikausittain."
schemaMentions:
  - "@type": "GovernmentOrganization"
    name: "Oulun kaupunginvaltuusto"
    url: "https://www.ouka.fi/valtuusto"
  - "@type": "GovernmentOrganization"
    name: "Sivistyslautakunta, Oulun kaupunki"
    url: "https://www.ouka.fi/"
  - "@type": "GovernmentOrganization"
    name: "Pohjois-Pohjanmaan hyvinvointialue"
    url: "https://pohde.fi/"
  - "@type": "Organization"
    name: "Kansallinen Kokoomus"
    url: "https://www.kokoomus.fi/"
---

{% macro renderContentList(items, emptyText, listId, metaMode="date") %}
  {% if items.length %}
  <div class="term-content-stack" data-term-pagination data-page-size="3" data-list-id="{{ listId }}">
    <ul class="term-content-list">
      {% for item in items %}
      <li class="term-content-item" data-page-item>
        <a href="{{ item.url }}" class="term-content-link">{{ item.data.title }}</a>
        <div class="term-content-meta">
          <span>{{ (item.data.meetingDate or item.date) | dateFormat }}</span>
          {% if metaMode == "event" and item.data.event %}
          <span>{{ item.data.event }}</span>
          {% elif metaMode == "initiative" %}
          <span>{{ item.data.initiative_type or "Valtuustoaloite" }}</span>
          {% if item.data.meeting %}
          <span>{{ item.data.meeting }}</span>
          {% endif %}
          {% elif metaMode == "type" and item.data.type %}
          <span>{{ item.data.type }}</span>
          {% endif %}
        </div>
      </li>
      {% endfor %}
    </ul>
    {% if items.length > 3 %}
    <div class="term-content-pagination">
      <p class="term-content-pagination__info mb-0" data-page-info aria-live="polite"></p>
      <ul class="pagination pagination-sm mb-0 flex-wrap" data-page-controls aria-label="Sivutus {{ listId }}"></ul>
    </div>
    {% endif %}
  </div>
  {% else %}
  <p class="term-empty mb-0">{{ emptyText }}</p>
  {% endif %}
{% endmacro %}

{% set politicalSpeechEvents = [
  "Oulun kaupunginvaltuusto",
  "Oulun kaupunginvaltuuston vierailu Oulun yliopistolla",
  "Oulun raati -yleisötilaisuus",
  "Uuden Oulun kuulemistilaisuus",
  "Kempeleen kunnan tilaisuus",
  "Porisuta porvaria koulutuksesta",
  "OSYK-lukion valtaus"
] %}
{% set termPeriods = [
  {
    "anchor": "2025-2029",
    "period": "2025–2029",
    "current": true,
    "title": "2. varavaltuutettu, sivistyslautakunnan jäsen sekä aluevaltuuston varajäsen",
    "summary": "Kuluvalla vaalikaudella korostuvat maankäytön ja palveluverkon yhteys, alueellinen yhdenvertaisuus, valmistelun avoimuus sekä kaupungin ja yliopiston suhde. Esillä ovat yhtä aikaa Haukiputaan ja lähijunaliikenteen kaltaiset aluekysymykset, tietoon perustuva päätöksenteko ja opetuksen kehittäminen.",
    "start": "2025-04-14",
    "results": [
      {
        "label": "Kuntavaalit 2025",
        "detail": "Oulu, ehdokas 439",
        "result": "289 ääntä, valittu 2. varavaltuutetuksi"
      },
      {
        "label": "Aluevaalit 2025",
        "detail": "Pohjois-Pohjanmaa",
        "result": "395 ääntä, valittu aluevaltuuston varajäseneksi"
      }
    ],
    "roles": [
      "2. varavaltuutettu, Oulun kaupunginvaltuusto",
      "Sivistyslautakunnan jäsen, Oulun kaupunki",
      "Aluevaltuuston varajäsen, Pohjois-Pohjanmaan hyvinvointialue"
    ],
    "archives": [
      {
        "href": "/kunta-ja-aluevaalit-2025/",
        "label": "Vaalisivusto 2025"
      }
    ]
  },
  {
    "anchor": "2021-2025",
    "period": "2021–2025",
    "title": "Kaupunginvaltuutettu, sivistys- ja kulttuurilautakunnan jäsen sekä maakuntavaltuuston jäsen",
    "summary": "Toinen valtuustokausi laajeni myös alueelliseen vaikuttamiseen, ja aineistossa painottuvat kaupungin suuret rakennekysymykset. Esillä ovat erityisesti palveluverkko, kampus- ja kaavaratkaisut, kulttuuri- ja hyvinvointipalvelut sekä avoimuus, tiedolla johtaminen ja aloitteiden seuranta.",
    "start": "2021-06-14",
    "end": "2025-04-13",
    "results": [
      {
        "label": "Kuntavaalit 2021",
        "detail": "Oulu, ehdokas 372",
        "result": "354 ääntä, valittu kaupunginvaltuutetuksi"
      },
      {
        "label": "Aluevaalit 2022",
        "detail": "Pohjois-Pohjanmaa, ehdokas 253",
        "result": "436 ääntä, valittu aluevaltuuston varajäseneksi"
      }
    ],
    "roles": [
      "Kaupunginvaltuutettu, Oulun kaupunki",
      "Sivistys- ja kulttuurilautakunnan jäsen, Oulun kaupunki",
      "Maakuntavaltuuston jäsen, Pohjois-Pohjanmaan liitto",
      "Aluevaltuuston varajäsen, Pohjois-Pohjanmaan hyvinvointialue"
    ],
    "archives": [
      {
        "href": "/kuntavaalit-2021/",
        "label": "Kuntavaalit 2021"
      },
      {
        "href": "/jari-laru-aluevaltuustoon/",
        "label": "Aluevaalit 2022"
      }
    ]
  },
  {
    "anchor": "2017-2021",
    "period": "2017–2021",
    "title": "Kaupunginvaltuutettu, sivistys- ja kulttuurilautakunnan jäsen sekä maakuntavaltuuston varavaltuutettu",
    "summary": "Ensimmäinen valtuustokausi rakensi profiilia sivistyksen, alueellisen yhdenvertaisuuden ja valmistelun kriittisen tarkastelun varaan. Aineistossa toistuvat kouluverkko, kampusratkaisut, kaupunginosien tasapuolinen kehittäminen sekä kysymys siitä, miten päätöksiä perustellaan ja valmistellaan avoimesti.",
    "start": "2017-04-10",
    "end": "2021-06-13",
    "results": [
      {
        "label": "Kuntavaalit 2017",
        "detail": "Oulu, ehdokas 36",
        "result": "168 ääntä, valittu kaupunginvaltuutetuksi"
      }
    ],
    "roles": [
      "Kaupunginvaltuutettu, Oulun kaupunki",
      "Sivistys- ja kulttuurilautakunnan jäsen, Oulun kaupunki",
      "Maakuntavaltuuston varavaltuutettu, Pohjois-Pohjanmaan liitto"
    ],
    "archives": [
      {
        "href": "/jari-laru-kaupunginvaltuutettu/",
        "label": "Arkistosivu 2017–2021"
      }
    ]
  },
  {
    "anchor": "2013-2017",
    "period": "2013–2017",
    "title": "Varavaltuutettu sekä lähidemokratiatoimikunnan puheenjohtaja",
    "summary": "Monikuntaliitoksen jälkeinen ensimmäinen kausi painottui lähidemokratiaan, asukasvaikuttamiseen ja siihen, miten paikallinen ääni kuuluu suuressa Oulussa. Esillä ovat erityisesti Jäälin ja muiden alueiden palvelut, alueellinen osallisuus sekä uuden kaupungin tapa rakentaa luottamusta kuntalaisten suuntaan.",
    "start": "2013-01-01",
    "end": "2017-04-09",
    "results": [
      {
        "label": "Kunnallisvaalit 2012",
        "detail": "Oulu, ehdokas 367",
        "result": "Valittu varavaltuutetuksi"
      }
    ],
    "roles": [
      "Varavaltuutettu, Oulun kaupunginvaltuusto",
      "Lähidemokratiatoimikunnan puheenjohtaja"
    ],
    "archives": [
      {
        "href": "/kunnallisvaalit-2012/",
        "label": "Kunnallisvaalit 2012"
      }
    ]
  }
] %}

<section class="term-archive-page term-archive-page--hero py-5 bg-body-tertiary border-bottom">
  <div class="site-shell">
    <div class="term-hero">
      <div>
        <p class="term-eyebrow mb-2">Politiikka</p>
        <h1 class="term-hero-title mb-3">Vaalikaudet</h1>
        <p class="term-hero-lead mb-4">Tämä sivu kokoaa poliittisen työn vaalikausittain monikuntaliitoksesta alkaen, jolloin minusta tuli taas oululainen. Tästä näkymästä löytyvät puheenvuorot, valtuustoaloitteet ja kirjoitukset vaalikausien mukaan, jotta näet miten vastuut, painotukset ja poliittinen työ ovat muuttuneet ajan myötä.</p>
      </div>
      <aside class="term-hero-card">
        <p class="term-hero-card__kicker">Mitä täältä löytyy</p>
        <ul class="term-hero-card__list">
          <li>vaalitulokset ja luottamustoimet kausittain</li>
          <li>valtuustopuheenvuorot ja valtuustoaloitteet omissa ryhmissään</li>
          <li>mielipidekirjoitukset ja muut relevantit politiikkasisällöt</li>
          <li>linkit vanhoihin vaalisivuihin arkistona, ei pääreittinä</li>
        </ul>
      </aside>
    </div>

    <div class="term-jump-grid" aria-label="Siirry vaalikauteen">
      {% for term in termPeriods %}
      <a class="term-jump-card" href="#{{ term.anchor }}">
        <span class="term-jump-period">{{ term.period }}</span>
        <strong>{{ term.title }}</strong>
      </a>
      {% endfor %}
    </div>
  </div>
</section>

<section class="term-archive-page py-5">
  <div class="site-shell">
    {% for term in termPeriods %}
      {% set startTs = term.start | toTimestamp %}
      {% set endTs = 32503680000000 %}
      {% if term.end %}
        {% set endTs = term.end | toTimestamp %}
      {% endif %}

      {% set speeches = [] %}
      {% for speech in collections.pub_puhe | reverse %}
        {% set speechTs = speech.date | toTimestamp %}
        {% if speechTs >= startTs and speechTs <= endTs and politicalSpeechEvents.indexOf(speech.data.event or "") != -1 %}
          {% set _ = speeches.push(speech) %}
        {% endif %}
      {% endfor %}

      {% set initiatives = [] %}
      {% for initiative in collections.politics | reverse %}
        {% set initiativeTs = initiative.date | toTimestamp %}
        {% if initiativeTs >= startTs and initiativeTs <= endTs %}
          {% set _ = initiatives.push(initiative) %}
        {% endif %}
      {% endfor %}

      {% set opinionPieces = [] %}
      {% for item in collections.pub_mielipide | reverse %}
        {% set itemTs = item.date | toTimestamp %}
        {% if itemTs >= startTs and itemTs <= endTs %}
          {% set _ = opinionPieces.push(item) %}
        {% endif %}
      {% endfor %}
      {% for item in collections.pub_kolumni | reverse %}
        {% set itemTs = item.date | toTimestamp %}
        {% if itemTs >= startTs and itemTs <= endTs %}
          {% set _ = opinionPieces.push(item) %}
        {% endif %}
      {% endfor %}

      {% set otherPoliticalItems = [] %}
      {% for item in collections.blog | reverse %}
        {% set itemTs = item.date | toTimestamp %}
        {% if itemTs >= startTs and itemTs <= endTs and item.data.politicalProfiles and item.data.politicalProfiles.length %}
          {% set _ = otherPoliticalItems.push(item) %}
        {% endif %}
      {% endfor %}
      {% for item in collections.publications | reverse %}
        {% set itemTs = item.date | toTimestamp %}
        {% set itemType = item.data.type or "" %}
        {% if itemTs >= startTs and itemTs <= endTs and item.data.politicalProfiles and item.data.politicalProfiles.length and ["puhe", "mielipide", "kolumni"].indexOf(itemType) == -1 %}
          {% set _ = otherPoliticalItems.push(item) %}
        {% endif %}
      {% endfor %}

    <article id="{{ term.anchor }}" class="term-card mb-5">
      <div class="term-card__header">
        <div>
          <p class="term-card__period">{{ term.period }}</p>
          {% if term.current %}
          <p class="term-current-badge">Kuluva vaalikausi</p>
          {% endif %}
          <h2 class="term-card__title">{{ term.title }}</h2>
        </div>
        <p class="term-card__summary mb-0">{{ term.summary }}</p>
      </div>

      <details class="term-mobile-disclosure" data-term-mobile-collapse data-term-current="{{ term.current }}" open>
        <summary class="term-mobile-disclosure-summary">Vaalitulokset, luottamustoimet ja arkisto</summary>
      <div class="term-meta-grid">
        <section class="term-meta-card">
          <h3 class="term-meta-card__title">Vaalitulokset</h3>
          <div class="term-result-grid">
            {% for result in term.results %}
            <div class="term-result-card">
              <p class="term-result-card__label">{{ result.label }}</p>
              <p class="term-result-card__detail">{{ result.detail }}</p>
              <p class="term-result-card__outcome mb-0">{{ result.result }}</p>
            </div>
            {% endfor %}
          </div>
        </section>

        <section class="term-meta-card">
          <h3 class="term-meta-card__title">Luottamustoimet</h3>
          <ul class="term-role-list mb-0">
            {% for role in term.roles %}
            <li>{{ role }}</li>
            {% endfor %}
          </ul>
        </section>

        <section class="term-meta-card">
          <h3 class="term-meta-card__title">Arkisto ja kampanjasivut</h3>
          <div class="term-archive-links">
            {% for link in term.archives %}
            <a href="{{ link.href }}" class="term-inline-link">{{ link.label }}</a>
            {% endfor %}
          </div>
        </section>
      </div>
      </details>

      <details class="term-mobile-disclosure" data-term-mobile-collapse data-term-current="{{ term.current }}" open>
        <summary class="term-mobile-disclosure-summary">Puheenvuorot, valtuustoaloitteet ja kirjoitukset</summary>
      <div class="term-content-grid">
        <section class="term-content-card">
          <div class="term-content-card__head">
            <h3 class="term-content-card__title">Puheenvuorot</h3>
            <span class="term-content-card__count">{{ speeches.length }}</span>
          </div>
          {{ renderContentList(speeches, "Tälle kaudelle ei ole vielä koottu puheenvuoroja.", term.anchor ~ "-speeches", "event") }}
        </section>

        <section class="term-content-card">
          <div class="term-content-card__head">
            <h3 class="term-content-card__title">Valtuustoaloitteet ja vastaukset</h3>
            <span class="term-content-card__count">{{ initiatives.length }}</span>
          </div>
          {{ renderContentList(initiatives, "Tälle kaudelle ei ole vielä koottu aloitteita.", term.anchor ~ "-initiatives", "initiative") }}
        </section>

        <section class="term-content-card">
          <div class="term-content-card__head">
            <h3 class="term-content-card__title">Mielipidekirjoitukset ja kolumnit</h3>
            <span class="term-content-card__count">{{ opinionPieces.length }}</span>
          </div>
          {{ renderContentList(opinionPieces, "Tälle kaudelle ei ole vielä koottu mielipidetekstejä.", term.anchor ~ "-opinions", "type") }}
        </section>

        <section class="term-content-card">
          <div class="term-content-card__head">
            <h3 class="term-content-card__title">Muut relevantit sisällöt</h3>
            <span class="term-content-card__count">{{ otherPoliticalItems.length }}</span>
          </div>
          {{ renderContentList(otherPoliticalItems, "Tälle kaudelle ei ole vielä koottu muita politiikkasisältöjä.", term.anchor ~ "-other", "type") }}
        </section>
      </div>
      </details>
    </article>
    {% endfor %}

    <div class="term-footer-links">
      <a class="btn btn-primary" href="/politiikka/">Politiikka-sivulle</a>
      <a class="btn btn-outline-primary" href="/poliittinen-avoimuus/">Sidonnaisuudet ja vaalirahoitus</a>
    </div>
  </div>
</section>

<style>
.term-archive-page--hero {
  position: relative;
  overflow: hidden;
}

.term-archive-page--hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(125, 159, 199, 0.18), transparent 30%),
    linear-gradient(180deg, rgba(219, 232, 247, 0.36), rgba(219, 232, 247, 0));
  pointer-events: none;
}

.term-hero {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1.75rem;
  grid-template-columns: minmax(0, 1.18fr) minmax(18rem, 0.82fr);
  align-items: start;
}

.term-eyebrow {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #163e6c;
}

.term-eyebrow--dark,
.term-card-kicker {
  color: rgba(17, 40, 70, 0.58);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.term-hero-title {
  margin: 0;
  font-size: clamp(2.5rem, 4vw, 4.2rem);
  line-height: 0.98;
}

.term-hero-lead {
  max-width: 48rem;
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.7;
  color: rgba(17, 40, 70, 0.82);
}

.term-section-head {
  max-width: 52rem;
  margin-bottom: 2rem;
}

.term-section-title {
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 1.04;
  margin-bottom: 0.75rem;
}

.term-section-lead {
  color: rgba(17, 40, 70, 0.78);
  line-height: 1.65;
}

.term-hero-card,
.term-overview-card,
.term-card,
.term-meta-card,
.term-content-card,
.term-jump-card {
  border-radius: 1.2rem;
  border: 1px solid rgba(17, 40, 70, 0.1);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 1rem 2.3rem rgba(17, 40, 70, 0.08);
}

.term-hero-card,
.term-overview-card {
  padding: 1.5rem;
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,249,255,0.92));
}

.term-hero-card__kicker,
.term-card__period {
  margin: 0 0 0.6rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(17, 40, 70, 0.58);
}

.term-hero-card__list {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.65rem;
  line-height: 1.6;
  color: rgba(17, 40, 70, 0.78);
}

.term-jump-grid {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 1.75rem;
}

.term-jump-card {
  display: grid;
  gap: 0.35rem;
  padding: 1rem 1.05rem;
  text-decoration: none;
  color: #102845;
  background: rgba(255, 255, 255, 0.82);
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease, color 180ms ease;
}

.term-jump-card:hover,
.term-jump-card:focus-visible,
.term-inline-link:hover,
.term-inline-link:focus-visible,
.term-content-link:hover,
.term-content-link:focus-visible {
  border-color: rgba(18, 63, 116, 0.22);
  text-decoration: none;
}

.term-jump-card:hover,
.term-jump-card:focus-visible {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.96);
}

.term-jump-period {
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #163e6c;
}

.term-card {
  padding: 1.35rem;
}

.term-card__header {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  align-items: start;
  margin-bottom: 1.25rem;
}

.term-card__title {
  margin: 0;
  font-size: clamp(1.45rem, 1.18rem + 1vw, 2.15rem);
  font-weight: 700;
  line-height: 1.12;
  color: #102845;
}

.term-current-badge {
  display: inline-flex;
  align-items: center;
  margin: 0 0 0.7rem;
  padding: 0.34rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #163e6c;
  background: rgba(17, 40, 70, 0.08);
}

.term-card__summary {
  color: rgba(17, 40, 70, 0.76);
  line-height: 1.65;
}

.term-meta-grid,
.term-content-grid,
.term-result-grid {
  display: grid;
  gap: 1rem;
}

.term-meta-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 1.1rem;
}

.term-content-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.term-meta-card,
.term-content-card {
  padding: 1.15rem 1.15rem 1.1rem;
}

.term-meta-card__title,
.term-content-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #102845;
}

.term-result-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.term-result-card {
  padding: 0.9rem 1rem;
  border: 1px solid rgba(100, 116, 139, 0.16);
  border-radius: 1rem;
  background: rgba(241, 245, 249, 0.6);
}

.term-result-card__label {
  margin: 0 0 0.3rem;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(17, 40, 70, 0.58);
}

.term-result-card__detail,
.term-result-card__outcome {
  margin: 0;
  font-size: 0.95rem;
}

.term-result-card__detail {
  color: rgba(17, 40, 70, 0.72);
}

.term-role-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.8rem;
}

.term-role-list li {
  padding: 0.95rem 1rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(17, 40, 70, 0.1);
  background: rgba(246, 249, 255, 0.7);
  line-height: 1.55;
  color: rgba(17, 40, 70, 0.84);
}

.term-archive-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.term-inline-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.5rem;
  padding: 0.55rem 0.95rem;
  border: 1px solid rgba(17, 40, 70, 0.1);
  border-radius: 999px;
  color: #12355f;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.82);
  font-weight: 700;
}

.term-content-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.term-content-card__count {
  min-width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 700;
  background: rgba(17, 40, 70, 0.08);
  color: #163e6c;
}

.term-content-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.8rem;
}

.term-content-stack {
  display: grid;
  gap: 0.95rem;
}

.term-content-item {
  padding-top: 0.8rem;
  border-top: 1px solid rgba(100, 116, 139, 0.16);
}

.term-content-item:first-child {
  padding-top: 0;
  border-top: 0;
}

.term-content-link {
  display: inline-block;
  color: #12355f;
  font-weight: 600;
  text-decoration: none;
  line-height: 1.45;
}

.term-content-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.8rem;
  margin-top: 0.35rem;
  font-size: 0.86rem;
  color: rgba(17, 40, 70, 0.64);
}

.term-empty {
  color: rgba(17, 40, 70, 0.64);
  line-height: 1.6;
}

.term-content-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.2rem;
}

.term-content-pagination__info {
  font-size: 0.86rem;
  color: rgba(17, 40, 70, 0.64);
}

.term-content-pagination .pagination {
  gap: 0.35rem;
}

.term-content-pagination .page-item .page-link {
  min-width: 2rem;
  border-radius: 999px;
  border-color: rgba(17, 40, 70, 0.12);
  background: rgba(255, 255, 255, 0.9);
  color: #12355f;
  text-align: center;
}

.term-content-pagination .page-item.active .page-link {
  border-color: #163e6c;
  background: #163e6c;
  color: #fff;
}

.term-footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.term-mobile-disclosure-summary {
  display: none;
}

[data-bs-theme="dark"] .term-hero-card,
[data-bs-theme="dark"] .term-overview-card,
[data-bs-theme="dark"] .term-card,
[data-bs-theme="dark"] .term-meta-card,
[data-bs-theme="dark"] .term-content-card,
[data-bs-theme="dark"] .term-jump-card {
  background: rgba(19, 28, 45, 0.88);
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.35);
}

[data-bs-theme="dark"] .term-hero-card__kicker,
[data-bs-theme="dark"] .term-card__period,
[data-bs-theme="dark"] .term-result-card__label,
[data-bs-theme="dark"] .term-content-card__count,
[data-bs-theme="dark"] .term-inline-link {
  color: #dbeafe;
}

[data-bs-theme="dark"] .term-eyebrow,
[data-bs-theme="dark"] .term-jump-period,
[data-bs-theme="dark"] .term-current-badge,
[data-bs-theme="dark"] .term-content-card__count {
  color: #bfdbfe;
}

[data-bs-theme="dark"] .term-hero-lead,
[data-bs-theme="dark"] .term-section-lead,
[data-bs-theme="dark"] .term-hero-card__list,
[data-bs-theme="dark"] .term-card__summary,
[data-bs-theme="dark"] .term-role-list li {
  color: rgba(226, 232, 240, 0.82);
}

[data-bs-theme="dark"] .term-jump-period,
[data-bs-theme="dark"] .term-result-card__detail,
[data-bs-theme="dark"] .term-content-meta,
[data-bs-theme="dark"] .term-empty,
[data-bs-theme="dark"] .term-content-pagination__info {
  color: rgba(226, 232, 240, 0.78);
}

[data-bs-theme="dark"] .term-result-card {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(148, 163, 184, 0.18);
}

[data-bs-theme="dark"] .term-inline-link {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(191, 219, 254, 0.2);
}

[data-bs-theme="dark"] .term-role-list li {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(148, 163, 184, 0.18);
}

[data-bs-theme="dark"] .term-content-card__count {
  background: rgba(191, 219, 254, 0.14);
}

[data-bs-theme="dark"] .term-current-badge {
  background: rgba(191, 219, 254, 0.14);
}

[data-bs-theme="dark"] .term-content-pagination .page-item .page-link {
  border-color: rgba(191, 219, 254, 0.2);
  background: rgba(15, 23, 42, 0.78);
  color: #dbeafe;
}

[data-bs-theme="dark"] .term-content-pagination .page-item.active .page-link {
  border-color: #bfdbfe;
  background: #bfdbfe;
  color: #102845;
}

@media (max-width: 991.98px) {
  .term-hero,
  .term-card__header,
  .term-meta-grid,
  .term-content-grid {
    grid-template-columns: 1fr;
  }

  .term-jump-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767.98px) {
  .term-result-grid {
    grid-template-columns: 1fr;
  }

  .term-jump-grid {
    display: flex;
    gap: 0.65rem;
    overflow-x: auto;
    padding-bottom: 0.15rem;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .term-jump-grid::-webkit-scrollbar {
    display: none;
  }

  .term-jump-card {
    flex: 0 0 72%;
    min-width: 14rem;
  }

  .term-mobile-disclosure {
    border-top: 1px solid rgba(100, 116, 139, 0.16);
    padding-top: 0.9rem;
    margin-top: 0.9rem;
  }

  .term-mobile-disclosure-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 2.55rem;
    margin-bottom: 0.85rem;
    padding: 0.58rem 0.85rem;
    border: 1px solid rgba(18, 63, 116, 0.18);
    border-radius: 999px;
    background: rgba(18, 63, 116, 0.06);
    color: #102845;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 800;
    list-style: none;
  }

  .term-mobile-disclosure-summary::-webkit-details-marker {
    display: none;
  }

  .term-mobile-disclosure-summary::after {
    content: "+";
    font-size: 1.05rem;
    line-height: 1;
  }

  .term-mobile-disclosure[open] .term-mobile-disclosure-summary::after {
    content: "-";
  }

  .term-card,
  .term-hero-card,
  .term-overview-card,
  .term-meta-card,
  .term-content-card {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .term-footer-links .btn {
    width: 100%;
  }

  [data-bs-theme="dark"] .term-mobile-disclosure {
    border-top-color: rgba(148, 163, 184, 0.18);
  }

  [data-bs-theme="dark"] .term-mobile-disclosure-summary {
    background: rgba(191, 219, 254, 0.1);
    border-color: rgba(191, 219, 254, 0.24);
    color: #dbeafe;
  }
}
</style>

<script>
  (() => {
    const paginatedGroups = document.querySelectorAll('[data-term-pagination]');
    if (!paginatedGroups.length) return;

    paginatedGroups.forEach((group) => {
      const items = Array.from(group.querySelectorAll('[data-page-item]'));
      const info = group.querySelector('[data-page-info]');
      const controls = group.querySelector('[data-page-controls]');
      const pageSize = Number(group.getAttribute('data-page-size')) || 3;

      if (items.length <= pageSize || !info || !controls) return;

      const total = items.length;
      const totalPages = Math.ceil(total / pageSize);

      const renderPage = (page) => {
        const safePage = Math.min(Math.max(page, 1), totalPages);
        const start = (safePage - 1) * pageSize;
        const end = start + pageSize;

        items.forEach((item, index) => {
          item.hidden = index < start || index >= end;
        });

        const firstVisible = start + 1;
        const lastVisible = Math.min(end, total);
        info.textContent = `Näytetään ${firstVisible}-${lastVisible} / ${total}`;

        controls.innerHTML = Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1;
          return `
            <li class="page-item ${pageNumber === safePage ? 'active' : ''}">
              <button type="button" class="page-link" data-page-number="${pageNumber}" aria-label="Sivu ${pageNumber}">
                ${pageNumber}
              </button>
            </li>
          `;
        }).join('');
      };

      controls.addEventListener('click', (event) => {
        const button = event.target.closest('[data-page-number]');
        if (!button) return;
        const page = Number(button.getAttribute('data-page-number'));
        if (!Number.isFinite(page)) return;
        renderPage(page);
      });

      renderPage(1);
    });
  })();

</script>
