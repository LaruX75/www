---
title: "Vaalikaudet"
metaTitle: Vaalikaudet ja poliittinen työ
permalink: /politiikka/vaalikaudet/
layout: base.njk
lang: fi
translationKey: election_history
description: "Jari Larun poliittinen työ vaalikausittain: luottamustoimet, vaalitulokset, puheenvuorot, valtuustoaloitteet ja muut relevantit sisällöt samassa näkymässä."
templateEngineOverride: njk
pageStyles:
  - /css/election-history-page.css
schemaType: CollectionPage
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
        <p class="term-hero-lead mb-4">Vaalikaudet kokoavat poliittisen työn monikuntaliitoksesta alkaen, jolloin minusta tuli taas oululainen. Puheenvuorot, valtuustoaloitteet, kyselytunnit ja kirjoitukset asettuvat kausien mukaan samaan ajalliseen yhteyteen.</p>
      </div>
      <aside class="term-hero-card">
        <p class="term-hero-card__kicker">Mitä täältä löytyy</p>
        <ul class="term-hero-card__list">
          <li>vaalitulokset ja luottamustoimet kausittain</li>
          <li>valtuustopuheenvuorot, valtuustoaloitteet ja kyselytunnit omissa ryhmissään</li>
          <li>mielipidekirjoitukset ja muut relevantit politiikkasisällöt</li>
          <li>linkit kokouksiin, pöytäkirjoihin ja vanhoihin vaalisivuihin</li>
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

      {% set termCouncilMeetings = [] %}
      {% for meeting in councilMeetings %}
        {% set meetingTs = meeting.date | toTimestamp %}
        {% if meetingTs >= startTs and meetingTs <= endTs %}
          {% set _ = termCouncilMeetings.push(meeting) %}
        {% endif %}
      {% endfor %}

    <article id="{{ term.anchor }}" class="term-card mb-5">
      <div class="term-card__header">
        <div>
          <h2 class="term-card__title">{{ term.period }}</h2>
          {% if term.current %}
          <p class="term-current-badge">Kuluva vaalikausi</p>
          {% endif %}
          <p class="term-card__role">{{ term.title }}</p>
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

        <section class="term-meta-card">
          <h3 class="term-meta-card__title">Kaupunginvaltuusto</h3>
          {% if termCouncilMeetings.length %}
          <p class="term-meta-card__text">{{ termCouncilMeetings.length }} kokousta, joissa tällä vaalikaudella näkyy omaa valtuustotyötä.</p>
          <a href="/politiikka/kaupunginvaltuusto/" class="term-inline-link">Avaa kokoukset</a>
          {% else %}
          <p class="term-meta-card__text mb-0">Tälle vaalikaudelle ei ole vielä kytketty kaupunginvaltuuston kokouksia.</p>
          {% endif %}
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
