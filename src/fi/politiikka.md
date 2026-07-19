---
title: "Jari Laru, poliitikko"
description: "Luottamustehtävät, tavoitteet ja vaikuttamisen painopisteet Oulussa."
permalink: /politiikka/
layout: base.njk
translationKey: politics_index
lang: fi
templateEngineOverride: njk
---
<section class="pol-hero mb-0">
  <div class="site-shell py-5">
    <div class="row g-5 align-items-stretch">
      <div class="col-lg-7">
        <p class="pol-eyebrow mb-2"><i class="bi bi-building2 me-1"></i>Politiikka</p>
        <h1 class="pol-hero-title mb-3">Jari Laru, poliitikko</h1>
        <p class="pol-hero-manifesto mb-3">Sivistys, lähipalvelut ja avoin päätöksenteko eivät ole kunnallispolitiikan sivujuonteita vaan sen kovaa ydintä.</p>
        <p class="mb-4 pol-hero-text">Teen politiikkaa käytännöllisesti ja tietoon nojaten. Tavoitteena on, että päätöksenteko näkyy kuntalaiselle parempina oppimisympäristöinä, toimivampina palveluina ja valmisteluna, jota voi seurata ilman sisäpiiritietoa.</p>
        <div class="pol-hero-points mb-4">
          <div class="pol-hero-point">
            <span class="pol-hero-point-title">Sivistys</span>
            <span class="pol-hero-point-text">Laadukkaat oppimisympäristöt, koulutuspolitiikka ja pitkät vaikutukset.</span>
          </div>
          <div class="pol-hero-point">
            <span class="pol-hero-point-title">Lähipalvelut</span>
            <span class="pol-hero-point-text">Koko Oulu mukaan kasvuun, ei vain keskusta tai yksittäiset hankkeet.</span>
          </div>
          <div class="pol-hero-point">
            <span class="pol-hero-point-title">Avoimuus</span>
            <span class="pol-hero-point-text">Päätösten perustelut, data ja valmistelu näkyviksi myös kuntalaiselle.</span>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <a href="#ydinteemat" class="btn pol-hero-btn-primary">Ydinteemat</a>
          <a href="#ajankohtaista" class="btn pol-hero-btn-outline">Näyttö käytännössä</a>
        </div>
      </div>
      <div class="col-lg-5">
        <aside class="pol-hero-card pol-hero-card--profile h-100">
          <img src="/img/uploads/2020/01/WhatsApp-Image-2019-12-02-at-18.58.31-1.jpeg" alt="Jari Laru politiikassa" class="pol-hero-img">
          <div class="pol-hero-side">
            <p class="pol-hero-side-kicker">Poliittinen profiili</p>
            <p class="pol-hero-caption">Käytännöllistä kunnallispolitiikkaa sivistyksen, lähipalvelujen ja avoimuuden puolesta.</p>
            <dl class="pol-hero-facts mb-0">
              <div>
                <dt>Tapa toimia</dt>
                <dd>Tietoon nojaten, pitkäjänteisesti, yhteistyökykyisesti</dd>
              </div>
              <div>
                <dt>Kysymys jonka esitän</dt>
                <dd>Miten päätös näkyy tavallisen oululaisen arjessa?</dd>
              </div>
              <div>
                <dt>Näyttö</dt>
                <dd>Puheenvuorot, aloitteet ja kirjoitukset samasta linjasta</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>
<div class="pol-hero-divider"></div>

<nav class="pol-mobile-path" aria-label="Politiikkasivun tärkeimmät osiot">
  <a href="#vaalikaudet">Tehtävät</a>
  <a href="#ydinteemat">Ydinteemat</a>
  <a href="#ajankohtaista">Näyttö</a>
  <a href="#kirjoitukset">Kirjoitukset</a>
</nav>

{% set politicalSpeechEvents = [
  "Oulun kaupunginvaltuusto",
  "Oulun kaupunginvaltuuston vierailu Oulun yliopistolla",
  "Oulun raati -yleisötilaisuus",
  "Uuden Oulun kuulemistilaisuus",
  "Kempeleen kunnan tilaisuus",
  "Porisuta porvaria koulutuksesta",
  "OSYK-lukion valtaus"
] %}
{% set politicalSpeeches = [] %}
{% for speech in collections.pub_puhe %}
  {% if politicalSpeechEvents.indexOf(speech.data.event or "") != -1 %}
    {% set _ = politicalSpeeches.push(speech) %}
  {% endif %}
{% endfor %}
{% set sortedInitiatives = collections.politics | sort(true, false, "date") %}
{% set currentTrustRoles = [
  {
    "area": "Oulu",
    "title": "2. varavaltuutettu",
    "org": "Oulun kaupunginvaltuusto"
  },
  {
    "area": "Oulu",
    "title": "Sivistyslautakunnan jäsen",
    "org": "Oulun kaupunki"
  },
  {
    "area": "Pohjois-Pohjanmaa",
    "title": "Aluevaltuuston varajäsen",
    "org": "Pohjois-Pohjanmaan hyvinvointialue"
  }
] %}
{% set electionPeriods = [
  {
    "period": "2025–2029",
    "title": "2. varavaltuutettu ja sivistyslautakunnan jäsen",
    "summary": "Ehdolla sekä kunta- että aluevaaleissa. Nykyiset luottamustehtävät jatkuvat sivistyksen, palvelujen ja avoimen päätöksenteon teemoissa.",
    "detail": "Luottamustoimet: 2. varavaltuutettu, sivistyslautakunnan jäsen, aluevaltuuston varajäsen.",
    "link": "/vaalikaudet/#2025-2029",
    "linkLabel": "Avaa vaalikausi"
  },
  {
    "period": "2021–2025",
    "title": "Kaupunginvaltuutettu ja maakuntavaltuuston jäsen",
    "summary": "Valittu uudelleen Oulun kaupunginvaltuustoon. Työ painottui erityisesti sivistys- ja kulttuuripalveluihin sekä laajoihin palveluverkkokysymyksiin.",
    "detail": "Luottamustoimet: kaupunginvaltuutettu, sivistys- ja kulttuurilautakunnan jäsen, maakuntavaltuuston jäsen.",
    "link": "/vaalikaudet/#2021-2025",
    "linkLabel": "Avaa vaalikausi"
  },
  {
    "period": "2017–2021",
    "title": "Kaupunginvaltuutettu ja maakuntavaltuuston varavaltuutettu",
    "summary": "Ensimmäinen valinta Oulun kaupunginvaltuustoon. Samalla rakentui linja, jossa yhdistyvät sivistys, alueellinen yhdenvertaisuus ja lähidemokratia.",
    "detail": "Luottamustoimet: kaupunginvaltuutettu, sivistys- ja kulttuurilautakunnan jäsen, maakuntavaltuuston varavaltuutettu.",
    "link": "/vaalikaudet/#2017-2021",
    "linkLabel": "Avaa vaalikausi"
  },
  {
    "period": "2013–2017",
    "title": "Varavaltuutettu ja lähidemokratiatoimikunnan puheenjohtaja",
    "summary": "Vuoden 2012 vaalien jälkeen alkanut vaalikausi toi mukaan varavaltuutetun vastuun ja lähidemokratiatoimikunnan puheenjohtajuuden. Profiili rakentui vahvasti alueellisen osallisuuden, lähipalvelujen ja asukasvaikuttamisen ympärille.",
    "detail": "Luottamustoimet: varavaltuutettu ja lähidemokratiatoimikunnan puheenjohtaja.",
    "link": "/vaalikaudet/#2013-2017",
    "linkLabel": "Avaa vaalikausi"
  }
] %}
{% set politicsWritingItems = [] %}
{% for post in collections.blog %}
  {% if post.data.politicsWritingRole %}
    {% set _ = politicsWritingItems.push({
      "role": post.data.politicsWritingRole,
      "order": post.data.politicsWritingOrder or 999,
      "type": "Blogi",
      "date": (post.date | dateFormat),
      "title": post.data.title,
      "href": post.url,
      "summary": post.data.politicsWritingSummary or post.data.description or ""
    }) %}
  {% endif %}
{% endfor %}
{% for item in collections.pub_mielipide %}
  {% if item.data.politicsWritingRole %}
    {% set _ = politicsWritingItems.push({
      "role": item.data.politicsWritingRole,
      "order": item.data.politicsWritingOrder or 999,
      "type": "Mielipide",
      "date": (item.date | dateFormat),
      "title": item.data.title,
      "href": item.url,
      "summary": item.data.politicsWritingSummary or item.data.description or ""
    }) %}
  {% endif %}
{% endfor %}
{% for item in collections.pub_kolumni %}
  {% if item.data.politicsWritingRole %}
    {% set _ = politicsWritingItems.push({
      "role": item.data.politicsWritingRole,
      "order": item.data.politicsWritingOrder or 999,
      "type": "Kolumni",
      "date": (item.date | dateFormat),
      "title": item.data.title,
      "href": item.url,
      "summary": item.data.politicsWritingSummary or item.data.description or ""
    }) %}
  {% endif %}
{% endfor %}
{% set sortedPoliticsWritingItems = politicsWritingItems | sort(false, false, "order") %}
{% set featuredPoliticalWritings = [] %}
{% set featuredHybridWritings = [] %}
{% for item in sortedPoliticsWritingItems %}
  {% if item.role == "political" %}
    {% set _ = featuredPoliticalWritings.push(item) %}
  {% elif item.role == "hybrid" %}
    {% set _ = featuredHybridWritings.push(item) %}
  {% endif %}
{% endfor %}
{% set politicalVideoHighlights = [
  {
    "title": "Oululaisia lapsia ja nuoria koskevien tilastotietojen tarkastelua",
    "url": "https://www.youtube.com/watch?v=7EXB54VvlsU&t=2s",
    "thumbnail": "https://i.ytimg.com/vi/7EXB54VvlsU/hqdefault.jpg",
    "date": "2026-01-19",
    "label": "Asiantuntijavideo",
    "context": "Palveluverkkokeskustelu 2026",
    "summary": "Tausta-aineisto Oulun palveluverkkokeskusteluun: mitä lasten ja nuorten tilastot kertovat päätöksenteon ja koko kaupunkiin kohdistuvien vaikutusten arvioinnin tueksi."
  }
] %}

<section class="py-5 mb-0 bg-body-tertiary" id="vaalikaudet">
  <div class="site-shell">
    <div class="pol-section-head">
      <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-calendar-event me-1"></i>Mandaatit</p>
      <h2 class="pol-section-title">Vaalikaudet ja nykyiset luottamustehtävät</h2>
      <p class="pol-section-lead mb-0">Poliittinen profiili ei perustu vain yksittäisiin puheenvuoroihin. Tällä hetkellä tärkeimmät luottamustehtäväni liittyvät Oulun kaupungin päätöksentekoon, sivistyslautakuntaan ja alueelliseen vaikuttamiseen.</p>
    </div>

    <div class="pol-mandate-layout">
      <aside class="pol-mandate-card pol-mandate-card--current">
        <div class="pol-mandate-current-head">
          <p class="pol-current-kicker mb-1">Nykyiset tehtävät</p>
          <h3 class="pol-current-title">Vaalikausi 2025–2029</h3>
          <p class="text-muted small mb-0">Käytännön politiikka näkyy näissä rooleissa juuri nyt.</p>
        </div>
        <div class="pol-role-list">
          {% for role in currentTrustRoles %}
          <article class="pol-role-item">
            <p class="pol-role-area">{{ role.area }}</p>
            <h4 class="pol-role-title">{{ role.title }}</h4>
            <p class="pol-role-org">{{ role.org }}</p>
          </article>
          {% endfor %}
        </div>
      </aside>

      <div class="pol-mandate-periods">
        {% for period in electionPeriods %}
        <article class="pol-mandate-card pol-mandate-period">
          <div class="pol-mandate-period-top">
            <span class="pol-mandate-badge">{{ period.period }}</span>
            <h3 class="pol-mandate-title">{{ period.title }}</h3>
          </div>
          <p class="pol-mandate-summary">{{ period.summary }}</p>
          <p class="pol-mandate-detail">{{ period.detail }}</p>
          <a href="{{ period.link }}" class="pol-mandate-link">{{ period.linkLabel }}</a>
        </article>
        {% endfor %}
      </div>
    </div>

    <div class="pol-mandate-links">
      <a href="/vaalikaudet/" class="pol-mandate-link-card">
        <strong>Vaalikaudet</strong>
        <span>Koko vaalikausien historia, vaalitulokset ja luottamustoimet samassa näkymässä.</span>
      </a>
      <a href="/sidonnaisuudet/" class="pol-mandate-link-card">
        <strong>Sidonnaisuudet</strong>
        <span>Avoin kooste jäsenyyksistä, ilmoituksista ja luottamustehtävistä.</span>
      </a>
    </div>
  </div>
</section>

<section class="py-5 mb-0" id="ydinteemat">
  <div class="site-shell">
    <div class="pol-section-head">
      <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-bullseye me-1"></i>Ydinteemat</p>
      <h2 class="pol-section-title">Kolme painopistettä, joihin poliittinen profiilini eniten nojaa</h2>
      <p class="pol-section-lead mb-0">Nämä ovat teemoja, joissa sisältöni, puheenvuoroni ja aloitteeni muodostavat selkeän jatkuvuuden. Tällä sivulla ne näkyvät linjauksina ensin, todisteina vasta sen jälkeen.</p>
    </div>
    <div id="politics-core-theme-list" class="row g-4"></div>
    <div id="politics-profile-note" class="mt-3"></div>
  </div>
</section>

<section class="py-5 mb-0 bg-body-tertiary" id="toimintatapa">
  <div class="site-shell">
    <details class="pol-mobile-disclosure" data-pol-mobile-collapse open>
      <summary class="pol-mobile-disclosure-summary">
        <span>Miten teen politiikkaa</span>
        <small>Työskentelytapa ja päätöksenteon periaatteet</small>
      </summary>
      <div class="pol-mobile-disclosure-body">
        <div class="pol-section-head">
          <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-diagram-3 me-1"></i>Toimintatapa</p>
          <h2 class="pol-section-title">Miten teen politiikkaa</h2>
          <p class="pol-section-lead mb-0">Olennaista ei ole vain se, mistä puhun, vaan miten yritän vaikuttaa. Sisällöissäni toistuu sama työskentelytapa: perehdyn, perustelen ja pidän kokonaisuuden näkyvissä silloinkin, kun keskustelu kaventuu yksittäiseen kiistaan.</p>
        </div>
        <div class="pol-method-grid">
          <article class="pol-method-card">
            <span class="pol-method-number">1</span>
            <h3 class="h6">Perehdyn ennen kuin linjaan</h3>
            <p class="small mb-0">Tilastot, vaikutusarviot ja tausta-aineistot eivät ole koristeita vaan päätösten perusta. Tämä näkyy erityisesti kouluverkkoa, väestökehitystä ja raportointia koskevissa sisällöissä.</p>
          </article>
          <article class="pol-method-card">
            <span class="pol-method-number">2</span>
            <h3 class="h6">Edistän valmistelun läpinäkyvyyttä</h3>
            <p class="small mb-0">Päätöksentekoa pitää voida seurata myös organisaation ulkopuolelta. Siksi pidän tärkeänä raportointia, aloitteiden seurantaa, tietojärjestelmiä ja muita käytäntöjä, jotka tekevät valmistelusta aidosti läpinäkyvää.</p>
          </article>
          <article class="pol-method-card">
            <span class="pol-method-number">3</span>
            <h3 class="h6">Katselen päätöksiä koko Oulun läpi</h3>
            <p class="small mb-0">Päätösten vaikutuksia pitää tarkastella kaikkien 23 suuralueen ja 105 kaupunginosan näkökulmasta. Siksi puhun palveluverkosta, liikkumisesta ja kasvusta koko kaupungin alueellisena yhdenvertaisuutena, en vain yksittäisinä hankkeina.</p>
          </article>
          <article class="pol-method-card">
            <span class="pol-method-number">4</span>
            <h3 class="h6">Haen yhteistyötä ilman pehmeyttä</h3>
            <p class="small mb-0">Yhteistyö ei tarkoita linjattomuutta. Pyrin löytämään toimivia kompromisseja, mutta nostan ongelmat esiin silloin, kun päätökset uhkaavat sivistystä, palveluja tai valmistelun laatua.</p>
          </article>
        </div>
      </div>
    </details>
  </div>
</section>

<section class="py-5 mb-0" id="ajankohtaista">
  <div class="site-shell">
    <div class="pol-section-head">
      <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-lightning-charge me-1"></i>Ajankohtaista</p>
      <h2 class="pol-section-title">Linja näkyy käytännön työnä</h2>
      <p class="pol-section-lead mb-0">Puheenvuorot, aloitteet ja tausta-aineistot näyttävät, miten poliittinen profiili muuttuu käytännön valtuustotyöksi. Tässä ovat uusimmat esimerkit, ei koko arkisto.</p>
    </div>

    {% if politicalVideoHighlights.length %}
    <div class="pol-video-highlight-list mb-4">
      {% for video in politicalVideoHighlights %}
      <article class="pol-current-card pol-video-highlight">
        <a href="{{ video.url }}" target="_blank" rel="noopener noreferrer" class="pol-video-thumb-link video-preview" aria-label="Katso video: {{ video.title }}">
          <img src="{{ video.thumbnail }}" alt="{{ video.title }}" class="pol-video-thumb" loading="lazy" decoding="async">
        </a>
        <div class="pol-video-copy">
          <div class="pol-video-meta">
            <span class="pol-writing-type">{{ video.label }}</span>
            <span class="text-muted small">{{ video.date | dateFormat }}</span>
          </div>
          <p class="pol-current-kicker mb-1">{{ video.context }}</p>
          <h3 class="pol-current-title"><a href="{{ video.url }}" target="_blank" rel="noopener noreferrer">{{ video.title }}</a></h3>
          <p class="pol-video-summary mb-3">{{ video.summary }}</p>
          <a href="{{ video.url }}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm rounded-pill px-3">Katso video <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i></a>
        </div>
      </article>
      {% endfor %}
    </div>
    {% endif %}

    <div class="row g-4 align-items-start">
      <div class="col-xl-7" id="poliittiset-puheet">
        <section class="pol-current-card">
          <div class="pol-current-head">
            <div>
              <p class="pol-current-kicker mb-1">Puheenvuorot</p>
              <h3 class="pol-current-title">Tuoreimmat poliittiset puheet</h3>
              <p class="text-muted small mb-0">{{ politicalSpeeches.length }} puhetta valtuustossa ja muissa yhteiskunnallisissa tilaisuuksissa</p>
            </div>
            <a href="/kynasta/#puheet" class="btn btn-outline-primary btn-sm">Kaikki puheet</a>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 political-speeches-table">
              <thead>
                <tr>
                  <th scope="col">Päivä</th>
                  <th scope="col">Tapahtuma</th>
                  <th scope="col">Otsikko</th>
                  <th scope="col">Asiakohta</th>
                </tr>
              </thead>
              <tbody id="political-speeches-table-body"></tbody>
            </table>
          </div>
          <div class="pol-current-foot">
            <small id="political-speeches-info" class="text-muted">Näytetään 6 uusinta puhetta</small>
            <nav aria-label="Poliittisten puheiden sivutus">
              <ul id="political-speeches-pagination" class="pagination pagination-sm mb-0 flex-wrap"></ul>
            </nav>
          </div>
        </section>
      </div>

      <div class="col-xl-5" id="valtuustoaloitteet">
        <section class="pol-current-card">
          <div class="pol-current-head">
            <div>
              <p class="pol-current-kicker mb-1">Aloitteet</p>
              <h3 class="pol-current-title">Uusimmat valtuustoaloitteet</h3>
              <p class="text-muted small mb-0">Kuusi uusinta aloitetta avoimuudesta, liikenteestä, hyvinvoinnista ja kaupunkikehityksestä</p>
            </div>
            <a href="/kynasta/#aloitteet" class="btn btn-outline-primary btn-sm">Kaikki aloitteet</a>
          </div>
          <div class="pol-initiative-list">
            {% for item in sortedInitiatives %}
            {% if loop.index <= 6 %}
            <article class="pol-initiative-item">
              <div class="pol-initiative-meta">
                <span class="badge bg-primary-subtle text-primary-emphasis">Valtuustoaloite</span>
                <span class="small text-muted">{{ item.date | dateFormat }}</span>
              </div>
              <h4 class="pol-initiative-title">{{ item.data.title }}</h4>
              {% if item.data.ouka_response_body %}
              <p class="pol-initiative-response"><i class="bi bi-building me-1"></i>{{ item.data.ouka_response_body }}</p>
              {% endif %}
              <div class="d-flex flex-wrap gap-2">
                <a href="{{ item.url }}" class="btn btn-outline-primary btn-sm">Lue aloite</a>
                {% if item.data.ouka_response_url %}
                <a href="{{ item.data.ouka_response_url }}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-sm">Vastaus</a>
                {% endif %}
              </div>
            </article>
            {% endif %}
            {% endfor %}
          </div>
          <p class="text-muted small mb-0">Viralliset asiakirjat ja pöytäkirjat: <a href="http://asiakirjat.ouka.fi/ktwebscr/pk_tek_tweb.htm" target="_blank" rel="noopener noreferrer">Oulun asiakirjajärjestelmä</a></p>
        </section>
      </div>
    </div>
  </div>
</section>

{% set topicProfileKeys = ["oulun-palveluverkko-ja-kaupunkikehitys", "lapinakyva-paatoksenteko-ja-tiedolla-johtaminen", "julkinen-asiantuntijuus-mediassa"] %}
{% set topicProfileTitleId = "politics-topic-profiles-title" %}
{% set topicProfileEyebrow = "Teemaprofiilit" %}
{% set topicProfileTitle = "Poliittinen aineisto aiheittain" %}
{% set topicProfileLead = "Politiikkasivu näyttää linjan. Teemaprofiilit näyttävät, missä puheenvuorot, aloitteet, mielipiteet ja mediaosumat liittyvät samaan poliittiseen kysymykseen." %}
{% include "topic-profile-links.njk" %}

<section class="py-5 mb-0 bg-body-tertiary" id="kirjoitukset">
  <div class="site-shell">
    <div class="pol-section-head">
      <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-journal-text me-1"></i>Kirjoitukset</p>
      <h2 class="pol-section-title">Kirjoituksia ja kannanottoja poliittisesta työstä</h2>
      <p class="pol-section-lead mb-0">Tähän on nostettu valikoima tekstejä, jotka näyttävät poliittisen ajatteluni suunnan. Mukana ei ole koko arkistoa, vaan profiilin kannalta olennaisimmat kirjoitukset.</p>
    </div>

    <div class="row g-4 align-items-start">
      <div class="col-xl-7">
        <section class="pol-current-card">
          <div class="pol-current-head">
            <div>
              <p class="pol-current-kicker mb-1">Valitut tekstit</p>
              <h3 class="pol-current-title">Poliittiset kirjoitukset</h3>
              <p class="text-muted small mb-0">{{ featuredPoliticalWritings.length }} kirjoitusta, joissa poliittinen linja näkyy selvimmin sivistyksen, alueellisen yhdenvertaisuuden ja päätöksenteon valmistelun kysymyksissä.</p>
            </div>
            <a href="/kynasta/?opinions=political#mielipiteet" class="btn btn-outline-primary btn-sm">Poliittiset mielipiteet</a>
          </div>
          <div class="pol-writing-list">
            {% for item in featuredPoliticalWritings %}
            <article class="pol-writing-item">
              <div class="pol-writing-meta">
                <span class="pol-writing-type">{{ item.type }}</span>
                <span class="small text-muted">{{ item.date }}</span>
              </div>
              <h4 class="pol-writing-title"><a href="{{ item.href }}">{{ item.title }}</a></h4>
              <p class="pol-writing-summary mb-0">{{ item.summary }}</p>
            </article>
            {% endfor %}
          </div>
        </section>
      </div>

      <div class="col-xl-5">
        <section class="pol-current-card pol-current-card--hybrid">
          <div class="pol-current-head">
            <div>
              <p class="pol-current-kicker mb-1">Hybridit</p>
              <h3 class="pol-current-title">Asiantuntijuus politiikan tukena</h3>
              <p class="text-muted small mb-0">{{ featuredHybridWritings.length }} tekstiä, joissa tutkimus, koulutus tai analyysi tukee suoraan poliittista argumenttia.</p>
            </div>
          </div>
          <p class="pol-writing-note">Nämä eivät ole tutkimusprofiilin nostoja, vaan poliittisia tekstejä, joissa asiantuntijuus tekee vaikutuksista, vaihtoehdoista ja perusteluista näkyvämpiä.</p>
          <div class="pol-writing-list pol-writing-list--compact">
            {% for item in featuredHybridWritings %}
            <article class="pol-writing-item">
              <div class="pol-writing-meta">
                <span class="pol-writing-type">{{ item.type }}</span>
                <span class="small text-muted">{{ item.date }}</span>
              </div>
              <h4 class="pol-writing-title"><a href="{{ item.href }}">{{ item.title }}</a></h4>
              <p class="pol-writing-summary mb-0">{{ item.summary }}</p>
            </article>
            {% endfor %}
          </div>
          <div class="pol-current-foot">
            <small class="text-muted">Rajapinnan tekstit ovat poliittisia kannanottoja, joissa asiantuntijuus on osa perustelua.</small>
            <a href="/kynasta/?opinions=hybrid#mielipiteet" class="btn btn-outline-primary btn-sm mt-3">Rajapinnan kirjoitukset</a>
          </div>
        </section>
      </div>
    </div>
  </div>
</section>

<section class="py-5 mb-0 bg-body-tertiary" id="laajempi-profiili">
  <div class="site-shell">
    <details class="pol-mobile-disclosure" data-pol-mobile-collapse open>
      <summary class="pol-mobile-disclosure-summary">
        <span>Tukiteemat</span>
        <small>Kaupunkikehitys, hyvinvointi ja yhteistyö</small>
      </summary>
      <div class="pol-mobile-disclosure-body">
        <div class="pol-section-head">
          <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-compass me-1"></i>Laajempi profiili</p>
          <h2 class="pol-section-title">Tukiteemat, jotka täydentävät kokonaisuutta</h2>
          <p class="pol-section-lead mb-0">Kaikki poliittinen sisältö ei kuulu ydinteemoihin. Nämä teemat täydentävät profiilia etenkin kaupunkikehityksen, hyvinvoinnin ja yhteistyökykyisen päätöksenteon suunnista.</p>
        </div>
        <div id="politics-support-theme-list" class="row g-4"></div>
      </div>
    </details>
  </div>
</section>

<section class="py-5 mb-0" id="arkistot">
  <div class="site-shell">
    <details class="pol-mobile-disclosure pol-mobile-disclosure--archive" data-pol-mobile-collapse open>
      <summary class="pol-mobile-disclosure-summary">
        <span>Syvemmälle aineistoon</span>
        <small>Arkistot, pöytäkirjat ja koko kirjoitusaineisto</small>
      </summary>
      <div class="pol-mobile-disclosure-body">
        <div class="pol-archive-band">
          <div class="pol-archive-copy">
            <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-archive me-1"></i>Arkistot</p>
            <h2 class="pol-section-title mb-2">Syvemmälle aineistoon</h2>
            <p class="mb-0">Politiikkasivu näyttää linjan. Kun haluat koko aineiston, löydät sen kirjoituksista, puheenvuoroista, aloitteista ja kaupungin kokousaineistoista.</p>
          </div>
          <div class="pol-archive-links">
            <a href="/kynasta/?opinions=political#mielipiteet" class="pol-archive-link">
              <strong>Poliittiset mielipiteet</strong>
              <span>Kirjoitukset, joissa kunnallinen ja alueellinen linja näkyy selvimmin.</span>
            </a>
            <a href="/kynasta/#puheet" class="pol-archive-link">
              <strong>Puheenvuoroarkisto</strong>
              <span>Valtuustossa ja muissa tilaisuuksissa pidetyt puheet.</span>
            </a>
            <a href="/kynasta/#aloitteet" class="pol-archive-link">
              <strong>Aloitearkisto</strong>
              <span>Kaikki valtuustoaloitteet vastauksineen ja taustoineen.</span>
            </a>
            <a href="/vaalikaudet/" class="pol-archive-link">
              <strong>Vaalikaudet</strong>
              <span>Luottamustoimet, puheenvuorot ja kirjoitukset vaalikausittain jäsennettynä.</span>
            </a>
            <a href="https://www.ouka.fi/valtuusto" target="_blank" rel="noopener noreferrer" class="pol-archive-link">
              <strong>Kokoukset ja pöytäkirjat</strong>
              <span>Oulun kaupungin kokoukset, tallenteet ja viralliset asiakirjat.</span>
            </a>
          </div>
        </div>
      </div>
    </details>
  </div>
</section>

<script id="politics-blog-data" type="application/json">
[
{% for post in collections.blog %}
  {
    "title": {{ (post.data.title or "") | dump | safe }},
    "url": {{ (post.url or "") | dump | safe }},
    "date": {{ (post.date | dateToRfc3339) | dump | safe }},
    "tags": {{ (post.data.tags or []) | dump | safe }},
    "categories": {{ (post.data.categories or []) | dump | safe }},
    "keywords": {{ (post.data.keywords or []) | dump | safe }},
    "politicalProfiles": {{ (post.data.politicalProfiles or []) | dump | safe }}
  }{% if not loop.last %},{% endif %}
{% endfor %}
]
</script>

<script id="politics-content-data" type="application/json">
[
{% set comma = joiner(",") %}
{% for item in collections.politics %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Aloite",
    "tags": {{ (item.data.tags or []) | dump | safe }},
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }},
    "politicalProfiles": {{ (item.data.politicalProfiles or []) | dump | safe }}
  }
{% endfor %}
{% for item in collections.pub_kolumni %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Kolumni",
    "tags": {{ (item.data.tags or []) | dump | safe }},
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }},
    "politicalProfiles": {{ (item.data.politicalProfiles or []) | dump | safe }}
  }
{% endfor %}
{% for item in collections.pub_mielipide %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Mielipide",
    "tags": {{ (item.data.tags or []) | dump | safe }},
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }},
    "politicalProfiles": {{ (item.data.politicalProfiles or []) | dump | safe }}
  }
{% endfor %}
{% for item in collections.pub_puhe %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Puheenvuoro",
    "tags": {{ (item.data.tags or []) | dump | safe }},
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }},
    "politicalProfiles": {{ (item.data.politicalProfiles or []) | dump | safe }}
  }
{% endfor %}
]
</script>

<script id="political-speeches-data" type="application/json">
[
{% for speech in politicalSpeeches %}
  {
    "title": {{ (speech.data.title or "") | dump | safe }},
    "url": {{ (speech.url or "") | dump | safe }},
    "date": {{ (speech.date | dateToRfc3339) | dump | safe }},
    "formattedDate": {{ (speech.date | dateFormat) | dump | safe }},
    "event": {{ (speech.data.event or "") | dump | safe }},
    "asiakohta": {{ (speech.data.asiakohta or "") | dump | safe }}
  }{% if not loop.last %},{% endif %}
{% endfor %}
]
</script>

<style>
  .pol-hero {
    --pol-ink: #112846;
    --pol-muted: rgba(17, 40, 70, 0.78);
    --pol-line: rgba(17, 40, 70, 0.12);
    --pol-soft: #dbe8f8;
    background:
      radial-gradient(circle at top right, rgba(24, 108, 221, 0.14), transparent 34%),
      linear-gradient(135deg, #f5f9ff 0%, #dce9fb 45%, #eef4fb 100%);
    color: var(--pol-ink);
    position: relative;
    overflow: hidden;
  }
  .pol-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(120deg, transparent 0%, transparent 38%, rgba(17, 40, 70, 0.03) 38%, rgba(17, 40, 70, 0.03) 46%, transparent 46%, transparent 100%);
    pointer-events: none;
  }
  .pol-hero-divider {
    height: 4px;
    background: linear-gradient(90deg, #123f74 0%, #3a76bc 45%, #123f74 100%);
  }
  .pol-mobile-path {
    display: none;
  }
  .pol-mobile-disclosure-summary {
    display: none;
  }
  .pol-mobile-disclosure-body {
    display: block;
  }
  .pol-eyebrow {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(17, 40, 70, 0.68);
  }
  .pol-eyebrow--dark {
    color: rgba(17, 40, 70, 0.64);
  }
  .pol-hero-title,
  .pol-section-title,
  .pol-current-title {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #0f2745;
  }
  .pol-hero-title {
    font-size: clamp(2.6rem, 5vw, 4.25rem);
    line-height: 0.96;
    max-width: 10ch;
  }
  .pol-hero-manifesto {
    font-size: clamp(1.2rem, 1.4vw, 1.55rem);
    line-height: 1.35;
    color: #14355e;
    max-width: 34rem;
  }
  .pol-hero-text,
  .pol-section-lead,
  .pol-archive-copy p {
    font-size: 1.03rem;
    line-height: 1.72;
    color: rgba(17, 40, 70, 0.82);
  }
  .pol-hero-points {
    display: grid;
    gap: 0.85rem;
    max-width: 42rem;
  }
  .pol-hero-point {
    display: grid;
    gap: 0.2rem;
    padding-left: 1rem;
    border-left: 3px solid rgba(18, 63, 116, 0.22);
  }
  .pol-hero-point-title {
    font-weight: 700;
    color: #14355e;
  }
  .pol-hero-point-text {
    color: var(--pol-muted);
    line-height: 1.55;
  }
  .pol-hero-card {
    position: relative;
    border-radius: 1.25rem;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid var(--pol-line);
    box-shadow: 0 1.5rem 3rem rgba(17, 40, 70, 0.12);
    backdrop-filter: blur(8px);
  }
  .pol-hero-img {
    width: 100%;
    display: block;
    object-fit: cover;
    aspect-ratio: 4 / 3;
  }
  .pol-hero-side {
    display: grid;
    gap: 1rem;
    padding: 1.2rem 1.25rem 1.3rem;
  }
  .pol-hero-side-kicker {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(17, 40, 70, 0.62);
  }
  .pol-hero-caption {
    margin: 0;
    font-size: 0.98rem;
    line-height: 1.6;
    color: rgba(17, 40, 70, 0.84);
  }
  .pol-hero-facts {
    display: grid;
    gap: 0.85rem;
    margin: 0;
  }
  .pol-hero-facts div {
    padding-top: 0.8rem;
    border-top: 1px solid var(--pol-line);
  }
  .pol-hero-facts dt {
    margin-bottom: 0.2rem;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(17, 40, 70, 0.58);
  }
  .pol-hero-facts dd {
    margin: 0;
    line-height: 1.55;
    color: rgba(17, 40, 70, 0.84);
  }
  .pol-hero-btn-primary,
  .pol-hero-btn-outline {
    border-radius: 999px;
    padding: 0.68rem 1.05rem;
    font-weight: 700;
    border-width: 1px;
  }
  .pol-hero-btn-primary {
    background: #163e6c;
    color: #fff;
    border-color: #163e6c;
  }
  .pol-hero-btn-primary:hover {
    background: #102f54;
    border-color: #102f54;
    color: #fff;
  }
  .pol-hero-btn-outline {
    background: transparent;
    color: #163e6c;
    border-color: rgba(22, 62, 108, 0.24);
  }
  .pol-hero-btn-outline:hover {
    background: rgba(22, 62, 108, 0.08);
    color: #163e6c;
    border-color: rgba(22, 62, 108, 0.36);
  }
  .pol-section-head {
    max-width: 52rem;
    margin-bottom: 2rem;
  }
  .pol-section-title {
    font-size: clamp(2rem, 3vw, 3rem);
    line-height: 1.04;
    margin-bottom: 0.75rem;
  }
  .pol-mandate-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
    gap: 1.3rem;
    align-items: start;
    margin-bottom: 1.25rem;
  }
  .pol-mandate-card {
    border-radius: 1.2rem;
    border: 1px solid rgba(17, 40, 70, 0.1);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 1rem 2.3rem rgba(17, 40, 70, 0.08);
  }
  .pol-mandate-card--current {
    padding: 1.35rem;
  }
  .pol-mandate-current-head {
    margin-bottom: 1rem;
  }
  .pol-role-list {
    display: grid;
    gap: 0.85rem;
  }
  .pol-role-item {
    padding: 1rem;
    border-radius: 0.95rem;
    border: 1px solid rgba(17, 40, 70, 0.1);
    background: rgba(246, 249, 255, 0.7);
  }
  .pol-role-area {
    margin: 0 0 0.3rem;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(17, 40, 70, 0.58);
  }
  .pol-role-title {
    margin: 0 0 0.22rem;
    font-size: 1.02rem;
    line-height: 1.35;
    color: #102845;
  }
  .pol-role-org {
    margin: 0;
    color: rgba(17, 40, 70, 0.74);
    line-height: 1.5;
  }
  .pol-mandate-periods {
    display: grid;
    gap: 0.95rem;
  }
  .pol-mandate-period {
    padding: 1.2rem 1.2rem 1.1rem;
  }
  .pol-mandate-period-top {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 0.8rem;
  }
  .pol-mandate-badge {
    display: inline-flex;
    align-self: flex-start;
    padding: 0.28rem 0.62rem;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(17, 40, 70, 0.08);
    color: #163e6c;
  }
  .pol-mandate-title {
    margin: 0;
    font-size: 1.18rem;
    line-height: 1.2;
    color: #102845;
  }
  .pol-mandate-summary,
  .pol-mandate-detail {
    margin: 0 0 0.7rem;
    line-height: 1.65;
  }
  .pol-mandate-summary {
    color: rgba(17, 40, 70, 0.82);
  }
  .pol-mandate-detail {
    font-size: 0.95rem;
    color: rgba(17, 40, 70, 0.72);
  }
  .pol-mandate-link {
    display: inline-flex;
    align-items: center;
    font-weight: 700;
    text-decoration: none;
    color: #12355f;
  }
  .pol-mandate-link:hover {
    color: #0d4f94;
  }
  .pol-mandate-links {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
  }
  .pol-mandate-link-card {
    display: grid;
    gap: 0.28rem;
    padding: 1rem 1.05rem;
    border-radius: 1rem;
    text-decoration: none;
    color: #102845;
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(17, 40, 70, 0.1);
    transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease, color 180ms ease;
  }
  .pol-mandate-link-card strong {
    color: #12355f;
    line-height: 1.35;
  }
  .pol-mandate-link-card span {
    color: rgba(17, 40, 70, 0.74);
    line-height: 1.55;
  }
  .pol-mandate-link-card:hover {
    transform: translateY(-1px);
    border-color: rgba(18, 63, 116, 0.22);
    background: rgba(255, 255, 255, 0.96);
    color: #102845;
  }
  .pol-theme-card {
    height: 100%;
    padding: 1.5rem 1.45rem;
    border-radius: 1.2rem;
    border: 1px solid rgba(17, 40, 70, 0.1);
    background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,249,255,0.92));
    box-shadow: 0 1.1rem 2.4rem rgba(17, 40, 70, 0.08);
  }
  .pol-theme-card--support {
    background: rgba(255, 255, 255, 0.9);
  }
  .pol-theme-head {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 1rem;
  }
  .pol-theme-icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--bs-primary-rgb), 0.08);
    font-size: 1rem;
  }
  .pol-theme-title {
    margin: 0;
    font-size: 1.35rem;
    font-family: Georgia, "Times New Roman", serif;
    color: #102845;
  }
  .pol-theme-statement {
    margin: 0 0 0.85rem;
    font-size: 1.03rem;
    line-height: 1.55;
    color: #13345c;
  }
  .pol-theme-description {
    margin: 0 0 1rem;
    color: rgba(17, 40, 70, 0.78);
    line-height: 1.62;
  }
  .pol-theme-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 0.9rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: rgba(17, 40, 70, 0.72);
  }
  .pol-theme-focus {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .pol-theme-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.28rem 0.62rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(17, 40, 70, 0.76);
    background: rgba(17, 40, 70, 0.06);
  }
  .pol-theme-proof-label {
    margin: 0 0 0.55rem;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(17, 40, 70, 0.58);
  }
  .pol-theme-proof-list {
    display: grid;
    gap: 0.7rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pol-theme-proof-item {
    display: grid;
    gap: 0.3rem;
    padding: 0.95rem 1rem;
    border-radius: 0.95rem;
    border: 1px solid rgba(17, 40, 70, 0.1);
    background: rgba(255, 255, 255, 0.9);
  }
  .pol-theme-proof-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    font-size: 0.82rem;
    color: rgba(17, 40, 70, 0.64);
  }
  .pol-theme-proof-type {
    font-weight: 700;
    color: #163e6c;
  }
  .pol-theme-proof-link {
    text-decoration: none;
    color: #12355f;
    line-height: 1.45;
  }
  .pol-theme-proof-link:hover {
    color: #0d4f94;
  }
  .pol-theme-footer {
    margin-top: 1rem;
  }
  .pol-theme-footer a {
    font-weight: 700;
    text-decoration: none;
  }
  .pol-method-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.2rem;
  }
  .pol-method-card {
    position: relative;
    min-height: 100%;
    display: grid;
    align-content: start;
    gap: 0.75rem;
    padding: 1.65rem 1.35rem 1.35rem;
    border-radius: 1.15rem;
    background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,249,255,0.96));
    border: 1px solid rgba(17, 40, 70, 0.1);
    box-shadow: 0 1rem 2.2rem rgba(17, 40, 70, 0.08);
    overflow: hidden;
  }
  .pol-method-number {
    display: block;
    margin: -0.35rem 0 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(3rem, 5vw, 4.6rem);
    line-height: 0.88;
    font-weight: 700;
    letter-spacing: -0.06em;
    color: rgba(22, 62, 108, 0.2);
  }
  .pol-method-card h3 {
    position: relative;
    z-index: 1;
    margin: 0;
    max-width: 14ch;
    font-size: 1.15rem;
    line-height: 1.15;
    color: #102845;
  }
  .pol-method-card p {
    position: relative;
    z-index: 1;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.65;
    color: rgba(17, 40, 70, 0.78);
  }
  .pol-current-card {
    height: 100%;
    padding: 1.35rem;
    border-radius: 1.2rem;
    border: 1px solid rgba(17, 40, 70, 0.1);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 1rem 2.3rem rgba(17, 40, 70, 0.08);
  }
  .pol-current-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .pol-current-kicker {
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(17, 40, 70, 0.58);
  }
  .pol-current-title {
    margin-bottom: 0.35rem;
    font-size: 1.55rem;
    line-height: 1.1;
  }
  .pol-current-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1rem;
    margin-top: 0.75rem;
    border-top: 1px solid rgba(17, 40, 70, 0.08);
  }
  .pol-video-highlight-list {
    display: grid;
    gap: 1rem;
  }
  .pol-video-highlight {
    display: grid;
    grid-template-columns: minmax(16rem, 0.42fr) minmax(0, 0.58fr);
    gap: 1.25rem;
    align-items: stretch;
  }
  .pol-video-thumb-link {
    position: relative;
    display: block;
    min-height: 100%;
    border-radius: 1rem;
    overflow: hidden;
    background: rgba(17, 40, 70, 0.08);
  }
  .pol-video-thumb {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 15rem;
    object-fit: cover;
    transition: transform 180ms ease;
  }
  .pol-video-thumb-link:hover .pol-video-thumb {
    transform: scale(1.035);
  }
  .pol-video-copy {
    align-self: center;
  }
  .pol-video-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-bottom: 0.85rem;
  }
  .pol-video-highlight .pol-current-title a {
    color: inherit;
    text-decoration: none;
  }
  .pol-video-highlight .pol-current-title a:hover {
    color: #0d4f94;
  }
  .pol-video-summary {
    color: rgba(17, 40, 70, 0.78);
    line-height: 1.65;
  }
  .political-speeches-table th {
    font-size: 0.76rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(17, 40, 70, 0.56);
    background: rgba(17, 40, 70, 0.04);
    white-space: nowrap;
    border-bottom-width: 1px;
  }
  .political-speeches-table td {
    vertical-align: middle;
    border-color: rgba(17, 40, 70, 0.08);
  }
  .political-speech-title {
    color: #12355f;
  }
  .political-speech-title:hover {
    color: #0d4f94;
  }
  .pol-initiative-list {
    display: grid;
    gap: 0.9rem;
    margin-bottom: 1rem;
  }
  .pol-writing-list {
    display: grid;
    gap: 0.9rem;
  }
  .pol-writing-list--compact {
    gap: 0.8rem;
  }
  .pol-writing-item {
    padding: 1rem;
    border-radius: 0.95rem;
    border: 1px solid rgba(17, 40, 70, 0.1);
    background: rgba(246, 249, 255, 0.72);
  }
  .pol-writing-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 0.55rem;
  }
  .pol-writing-type {
    display: inline-flex;
    align-items: center;
    padding: 0.28rem 0.62rem;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(17, 40, 70, 0.08);
    color: #163e6c;
  }
  .pol-writing-title {
    margin-bottom: 0.55rem;
    font-size: 1.02rem;
    line-height: 1.42;
    color: #112846;
  }
  .pol-writing-title a {
    color: inherit;
    text-decoration: none;
  }
  .pol-writing-title a:hover {
    color: #0d4f94;
  }
  .pol-writing-summary,
  .pol-writing-note {
    color: rgba(17, 40, 70, 0.76);
    line-height: 1.62;
  }
  .pol-writing-note {
    margin-bottom: 1rem;
  }
  .pol-current-card--hybrid .pol-current-foot {
    margin-top: 1rem;
  }
  .pol-initiative-item {
    padding: 1rem;
    border-radius: 0.95rem;
    border: 1px solid rgba(17, 40, 70, 0.1);
    background: rgba(246, 249, 255, 0.7);
  }
  .pol-initiative-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 0.65rem;
  }
  .pol-initiative-title {
    margin-bottom: 0.7rem;
    font-size: 1rem;
    line-height: 1.45;
    color: #112846;
  }
  .pol-initiative-response {
    margin-bottom: 0.75rem;
    font-size: 0.88rem;
    color: rgba(17, 40, 70, 0.72);
  }
  .pol-archive-band {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 2rem;
    padding: 2rem;
    border-radius: 1.35rem;
    background: linear-gradient(135deg, #102743 0%, #173b64 58%, #1e4d81 100%);
    color: #f4f8fd;
    box-shadow: 0 1.3rem 2.6rem rgba(17, 40, 70, 0.16);
  }
  .pol-archive-band .pol-eyebrow--dark,
  .pol-archive-band .pol-section-title,
  .pol-archive-band .pol-archive-copy p {
    color: inherit;
  }
  .pol-archive-band .pol-eyebrow--dark {
    color: rgba(255, 255, 255, 0.68);
  }
  .pol-archive-links {
    display: grid;
    gap: 0.8rem;
  }
  .pol-archive-link {
    display: grid;
    gap: 0.25rem;
    padding: 0.95rem 1rem;
    border-radius: 1rem;
    text-decoration: none;
    color: #f4f8fd;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.14);
    transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;
  }
  .pol-archive-link strong {
    display: block;
    color: #f7fbff;
    line-height: 1.35;
  }
  .pol-archive-link:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.24);
    transform: translateY(-1px);
  }
  .pol-archive-link span {
    color: rgba(255, 255, 255, 0.86);
    line-height: 1.55;
  }
  .pol-archive-link:hover strong,
  .pol-archive-link:hover span {
    color: #ffffff;
  }
  [data-bs-theme="dark"] .pol-hero {
    --pol-ink: #f3f7fc;
    --pol-muted: rgba(243, 247, 252, 0.82);
    --pol-line: rgba(255, 255, 255, 0.12);
    background:
      radial-gradient(circle at top right, rgba(125, 184, 240, 0.12), transparent 34%),
      linear-gradient(135deg, #0d192a 0%, #10233a 52%, #0f1d32 100%);
    color: #f3f7fc;
  }
  [data-bs-theme="dark"] .pol-hero-title,
  [data-bs-theme="dark"] .pol-section-title,
  [data-bs-theme="dark"] .pol-current-title,
  [data-bs-theme="dark"] .pol-theme-title {
    color: #f7fbff;
  }
  [data-bs-theme="dark"] .pol-eyebrow,
  [data-bs-theme="dark"] .pol-eyebrow--dark,
  [data-bs-theme="dark"] .pol-current-kicker,
  [data-bs-theme="dark"] .pol-theme-proof-label,
  [data-bs-theme="dark"] .pol-role-area {
    color: rgba(255, 255, 255, 0.64);
  }
  [data-bs-theme="dark"] .pol-hero-manifesto,
  [data-bs-theme="dark"] .pol-theme-statement {
    color: rgba(255, 255, 255, 0.9);
  }
  [data-bs-theme="dark"] .pol-hero-text,
  [data-bs-theme="dark"] .pol-section-lead,
  [data-bs-theme="dark"] .pol-theme-description,
  [data-bs-theme="dark"] .pol-theme-meta,
  [data-bs-theme="dark"] .pol-video-summary,
  [data-bs-theme="dark"] .pol-initiative-response,
  [data-bs-theme="dark"] .pol-writing-summary,
  [data-bs-theme="dark"] .pol-writing-note,
  [data-bs-theme="dark"] .pol-mandate-summary,
  [data-bs-theme="dark"] .pol-mandate-detail,
  [data-bs-theme="dark"] .pol-role-org,
  [data-bs-theme="dark"] .pol-mandate-link-card span {
    color: rgba(255, 255, 255, 0.8);
  }
  [data-bs-theme="dark"] .pol-hero-point-text,
  [data-bs-theme="dark"] .pol-hero-caption,
  [data-bs-theme="dark"] .pol-hero-facts dd {
    color: rgba(255, 255, 255, 0.84);
  }
  [data-bs-theme="dark"] .pol-hero-side-kicker,
  [data-bs-theme="dark"] .pol-hero-facts dt {
    color: rgba(255, 255, 255, 0.7);
  }
  [data-bs-theme="dark"] .pol-hero-point {
    border-left-color: rgba(255, 255, 255, 0.22);
  }
  [data-bs-theme="dark"] .pol-hero-point-title,
  [data-bs-theme="dark"] .pol-theme-proof-link,
  [data-bs-theme="dark"] .political-speech-title,
  [data-bs-theme="dark"] .pol-video-highlight .pol-current-title a,
  [data-bs-theme="dark"] .pol-writing-title,
  [data-bs-theme="dark"] .pol-writing-title a,
  [data-bs-theme="dark"] .pol-mandate-title,
  [data-bs-theme="dark"] .pol-role-title,
  [data-bs-theme="dark"] .pol-mandate-link-card {
    color: #f4f8fd;
  }
  [data-bs-theme="dark"] .pol-hero-card,
  [data-bs-theme="dark"] .pol-mandate-card,
  [data-bs-theme="dark"] .pol-theme-card,
  [data-bs-theme="dark"] .pol-method-card,
  [data-bs-theme="dark"] .pol-current-card,
  [data-bs-theme="dark"] .pol-writing-item,
  [data-bs-theme="dark"] .pol-initiative-item {
    background: linear-gradient(180deg, rgba(18, 30, 47, 0.92), rgba(13, 24, 38, 0.96));
    border-color: rgba(255, 255, 255, 0.14);
    box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.22);
  }
  [data-bs-theme="dark"] .pol-theme-proof-item,
  [data-bs-theme="dark"] .pol-role-item,
  [data-bs-theme="dark"] .pol-mandate-link-card,
  [data-bs-theme="dark"] .pol-archive-link {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.16);
  }
  [data-bs-theme="dark"] .pol-mandate-badge {
    background: rgba(255, 255, 255, 0.12);
    color: #f4f8fd;
  }
  [data-bs-theme="dark"] .pol-writing-type {
    background: rgba(255, 255, 255, 0.12);
    color: #f4f8fd;
  }
  [data-bs-theme="dark"] .pol-theme-pill {
    color: rgba(255, 255, 255, 0.82);
    background: rgba(255, 255, 255, 0.12);
  }
  [data-bs-theme="dark"] .pol-method-number {
    color: rgba(255, 255, 255, 0.22);
  }
  [data-bs-theme="dark"] .pol-method-card h3 {
    color: #f7fbff;
  }
  [data-bs-theme="dark"] .pol-method-card p {
    color: rgba(255, 255, 255, 0.82);
  }
  [data-bs-theme="dark"] .political-speeches-table th {
    color: rgba(255, 255, 255, 0.78);
    background: rgba(255, 255, 255, 0.08);
  }
  [data-bs-theme="dark"] .political-speeches-table td,
  [data-bs-theme="dark"] .pol-current-foot {
    border-color: rgba(255, 255, 255, 0.14);
  }
  [data-bs-theme="dark"] .pol-current-card .text-muted,
  [data-bs-theme="dark"] .pol-initiative-item .text-muted,
  [data-bs-theme="dark"] .pol-writing-item .text-muted,
  [data-bs-theme="dark"] #politics-profile-note .text-muted,
  [data-bs-theme="dark"] .pol-theme-proof-item .text-muted,
  [data-bs-theme="dark"] .political-speeches-table .text-muted,
  [data-bs-theme="dark"] #political-speeches-info {
    color: rgba(255, 255, 255, 0.8) !important;
  }
  [data-bs-theme="dark"] .pol-current-card .btn-outline-primary,
  [data-bs-theme="dark"] .pol-initiative-item .btn-outline-primary {
    color: #f4f8fd;
    border-color: rgba(255, 255, 255, 0.3);
  }
  [data-bs-theme="dark"] .pol-current-card .btn-outline-primary:hover,
  [data-bs-theme="dark"] .pol-initiative-item .btn-outline-primary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.42);
  }
  [data-bs-theme="dark"] .pol-current-card .btn-outline-success,
  [data-bs-theme="dark"] .pol-initiative-item .btn-outline-success {
    color: #d7f6df;
    border-color: rgba(125, 211, 156, 0.42);
  }
  [data-bs-theme="dark"] .pol-current-card .btn-outline-success:hover,
  [data-bs-theme="dark"] .pol-initiative-item .btn-outline-success:hover {
    background: rgba(125, 211, 156, 0.12);
    color: #effcf2;
    border-color: rgba(125, 211, 156, 0.58);
  }
  [data-bs-theme="dark"] .pol-hero-btn-primary {
    background: #f4f8fd;
    color: #102743;
    border-color: #f4f8fd;
  }
  [data-bs-theme="dark"] .pol-hero-btn-outline {
    color: #f4f8fd;
    border-color: rgba(255, 255, 255, 0.24);
  }
  [data-bs-theme="dark"] .pol-hero-btn-outline:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.3);
  }
  [data-bs-theme="dark"] .pol-mandate-link {
    color: #cfe4ff;
  }
  [data-bs-theme="dark"] .pol-mandate-link:hover,
  [data-bs-theme="dark"] .pol-mandate-link-card:hover strong {
    color: #ffffff;
  }
  [data-bs-theme="dark"] .pol-mobile-path {
    background: rgba(9, 19, 34, 0.96);
    border-color: rgba(255, 255, 255, 0.12);
  }
  [data-bs-theme="dark"] .pol-mobile-path a,
  [data-bs-theme="dark"] .pol-mobile-disclosure-summary {
    color: #f6f9ff;
  }
  [data-bs-theme="dark"] .pol-mobile-disclosure-summary {
    background: rgba(14, 31, 54, 0.92);
    border-color: rgba(255, 255, 255, 0.12);
  }
  [data-bs-theme="dark"] .pol-mobile-disclosure-summary small {
    color: rgba(246, 249, 255, 0.68);
  }
  @media (max-width: 1199.98px) {
    .pol-mandate-layout {
      grid-template-columns: 1fr;
    }
    .pol-method-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .pol-archive-band {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 767.98px) {
    .pol-mobile-path {
      display: flex;
      gap: 0.5rem;
      margin: 0;
      padding: 0.75rem max(1rem, calc((100vw - 1140px) / 2 + 1rem));
      overflow-x: auto;
      background: rgba(255, 255, 255, 0.94);
      border-bottom: 1px solid rgba(17, 40, 70, 0.1);
      position: sticky;
      top: 0;
      z-index: 20;
      -webkit-overflow-scrolling: touch;
    }
    .pol-mobile-path::-webkit-scrollbar {
      display: none;
    }
    .pol-mobile-path a {
      flex: 0 0 auto;
      border-radius: 999px;
      padding: 0.52rem 0.78rem;
      background: rgba(18, 63, 116, 0.08);
      color: #123f74;
      font-size: 0.82rem;
      font-weight: 800;
      text-decoration: none;
      white-space: nowrap;
    }
    .pol-mobile-disclosure {
      display: block;
    }
    .pol-mobile-disclosure-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.05rem;
      border: 1px solid rgba(17, 40, 70, 0.12);
      border-radius: 1rem;
      background: #ffffff;
      box-shadow: 0 1rem 2rem rgba(17, 40, 70, 0.08);
      color: #112846;
      cursor: pointer;
      list-style: none;
    }
    .pol-mobile-disclosure-summary::-webkit-details-marker {
      display: none;
    }
    .pol-mobile-disclosure-summary::after {
      content: '+';
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      background: rgba(18, 63, 116, 0.08);
      color: #123f74;
      font-weight: 900;
    }
    .pol-mobile-disclosure[open] .pol-mobile-disclosure-summary::after {
      content: '-';
    }
    .pol-mobile-disclosure-summary span {
      display: block;
      font-weight: 800;
      line-height: 1.2;
    }
    .pol-mobile-disclosure-summary small {
      display: block;
      margin-top: 0.2rem;
      color: rgba(17, 40, 70, 0.66);
      font-size: 0.78rem;
      line-height: 1.35;
    }
    .pol-mobile-disclosure[open] .pol-mobile-disclosure-body {
      padding-top: 1.25rem;
    }
    .pol-initiative-item:nth-child(n+4) {
      display: none;
    }
    .pol-mandate-links {
      grid-template-columns: 1fr;
    }
    .pol-hero-title {
      max-width: none;
    }
    .pol-method-grid {
      grid-template-columns: 1fr;
    }
    .pol-current-head,
    .pol-current-foot {
      flex-direction: column;
      align-items: flex-start;
    }
    .pol-video-highlight {
      grid-template-columns: 1fr;
    }
    .pol-video-thumb {
      min-height: 12rem;
    }
    .pol-initiative-meta,
    .pol-writing-meta,
    .pol-theme-proof-top {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>

<script>
  (() => {
    const blogRaw = JSON.parse(document.getElementById('politics-blog-data')?.textContent || '[]');
    const contentRaw = JSON.parse(document.getElementById('politics-content-data')?.textContent || '[]');
    const politicalSpeechesData = JSON.parse(document.getElementById('political-speeches-data')?.textContent || '[]')
      .filter((item) => item && item.title && item.url)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const coreThemeList = document.getElementById('politics-core-theme-list');
    const supportThemeList = document.getElementById('politics-support-theme-list');
    const profileNote = document.getElementById('politics-profile-note');
    const politicalSpeechesTableBody = document.getElementById('political-speeches-table-body');
    const politicalSpeechesInfo = document.getElementById('political-speeches-info');
    const politicalSpeechesPagination = document.getElementById('political-speeches-pagination');
    const mobileQuery = window.matchMedia('(max-width: 767.98px)');
    const mobileDisclosures = Array.from(document.querySelectorAll('[data-pol-mobile-collapse]'));

    const escHtml = (value) => String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
    const formatFiDate = (value) => {
      const date = new Date(value || '');
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleDateString('fi-FI');
    };

    function shortPoliticalSpeechTitle(title) {
      let s = String(title || '').trim();
      s = s.replace(/^(?:Valtuustopuheenvuoro|Puheenvuoro(?:ni)?)(?:\s+valtuustossa|\s+kaupunginvaltuuston\s+kokouksessa\.?)?\s*/i, '');
      const afterParagraph = s.replace(/^.*?§\s*\d+\s*[.:–-]\s*/i, '');
      if (afterParagraph !== s) return afterParagraph.trim();
      const afterColon = s.replace(/^[^:]+:\s*/, '');
      if (afterColon !== s) return afterColon.trim();
      return s.trim();
    }
    function currentPoliticalSpeechPageSize() {
      return mobileQuery.matches ? 3 : 6;
    }

    function applyPoliticsMobileDisclosureState() {
      mobileDisclosures.forEach((disclosure) => {
        if (!mobileQuery.matches) {
          disclosure.open = true;
          disclosure.dataset.mobilePrepared = 'false';
          return;
        }
        if (disclosure.dataset.mobilePrepared === 'true') return;
        disclosure.open = false;
        disclosure.dataset.mobilePrepared = 'true';
      });
    }

    const politicsBlogData = blogRaw
      .filter((item) => item && item.title && item.url && Array.isArray(item.politicalProfiles) && item.politicalProfiles.length > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const contentData = contentRaw
      .filter((item) => item && item.title && item.url && Array.isArray(item.politicalProfiles) && item.politicalProfiles.length > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const themedItems = [
      ...politicsBlogData.map((item) => ({ ...item, contentType: 'Blogi' })),
      ...contentData
        .filter((item) => ['Puheenvuoro', 'Mielipide', 'Aloite'].includes(item.contentType))
    ];
    const hasPoliticalProfile = (item, key) => Array.isArray(item.politicalProfiles) && item.politicalProfiles.includes(key);
    const profileDefinitions = [
      {
        key: 'sivistys',
        title: 'Sivistys ja oppiminen',
        description: 'Koulutuspolitiikka, terveet oppimisympäristöt ja yliopiston sekä kouluverkon ratkaisut.',
        statement: 'Koulutuksen pitää näkyä päätöksenteossa laadukkaina arjen ratkaisuina, ei irrallisina hankkeina.',
        icon: 'bi-mortarboard-fill',
        color: '#0d6efd',
        tier: 'core',
        focus: ['kouluverkko', 'varhaiskasvatus', 'kampusratkaisut']
      },
      {
        key: 'lahipalvelut',
        title: 'Koko Oulun alueellinen yhdenvertaisuus',
        description: 'Oulun 23 suuralueen ja 106 kaupunginosan palvelut, saavutettavuus ja tasapuolinen kehitys.',
        statement: 'Oulua pitää kehittää kokonaisuutena niin, että jokainen suuralue ja kaupunginosa pysyy mukana kasvussa, investoinneissa ja palveluissa.',
        icon: 'bi-geo-alt-fill',
        color: '#198754',
        tier: 'core',
        focus: ['23 suuraluetta', '106 kaupunginosaa', 'alueellinen yhdenvertaisuus']
      },
      {
        key: 'avoinhallinto',
        title: 'Avoin hallinto ja tiedolla johtaminen',
        description: 'Läpinäkyvä päätöksenteko, tietojärjestelmät, avoin data ja seurattavat valmisteluprosessit.',
        statement: 'Päätöksiä pitää voida seurata, ymmärtää ja arvioida ilman sisäpiiritietoa.',
        icon: 'bi-bar-chart-steps',
        color: '#6f42c1',
        tier: 'core',
        focus: ['avoin data', 'päätöksenteon avoimuus', 'aloitteiden seuranta']
      },
      {
        key: 'kaupunkikehitys',
        title: 'Tasapainoinen kaupunkikehitys',
        description: 'Kaavoitus, liikkuminen, keskustan ja kampusten kehittäminen sekä toimiva kaupunkirakenne.',
        statement: 'Kasvua pitää tehdä niin, että kokonaisuus toimii: liikkuminen, palvelut ja identiteetti samassa suunnassa.',
        icon: 'bi-buildings-fill',
        color: '#fd7e14',
        tier: 'support',
        focus: ['kaavoitus', 'liikenne', 'keskustan hankkeet']
      },
      {
        key: 'hyvinvointi',
        title: 'Lasten, nuorten ja perheiden arki',
        description: 'Hyvinvointi, turvallinen arki, nuorisotyö ja ennaltaehkäisevät palvelut.',
        statement: 'Kunnan tärkein tehtävä on luoda turvallinen arki lapsille, nuorille ja perheille.',
        icon: 'bi-heart-pulse-fill',
        color: '#dc3545',
        tier: 'support',
        focus: ['nuoriso', 'perheiden hyvinvointi', 'ennaltaehkäisy']
      },
      {
        key: 'yhteistyo',
        title: 'Yhteistyökykyinen Oulu',
        description: 'Seutuyhteistyö, talousvastuu, aluehallinto ja kaupungin pitkäjänteinen kehittäminen.',
        statement: 'Politiikka ei ole vain vastakkainasettelua, vaan kykyä tehdä toimivia ratkaisuja yhdessä.',
        icon: 'bi-diagram-3-fill',
        color: '#0dcaf0',
        tier: 'support',
        focus: ['talous', 'seutuyhteistyö', 'aluehallinto']
      }
    ];
    const profileGroups = profileDefinitions.map((profile) => {
      const items = themedItems
        .filter((item) => hasPoliticalProfile(item, profile.key))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return {
        ...profile,
        total: items.length,
        blogi: items.filter((item) => item.contentType === 'Blogi').length,
        puheenvuoro: items.filter((item) => item.contentType === 'Puheenvuoro').length,
        mielipide: items.filter((item) => item.contentType === 'Mielipide').length,
        aloite: items.filter((item) => item.contentType === 'Aloite').length,
        items
      };
    }).filter((profile) => profile.total > 0);

    const contentTypeLabel = (value) => {
      if (value === 'Puheenvuoro') return 'Puheenvuoro';
      if (value === 'Mielipide') return 'Mielipide';
      if (value === 'Aloite') return 'Aloite';
      return 'Blogi';
    };

    function renderThemeGroup(groups, target, emptyMessage) {
      if (!target) return;
      if (!groups.length) {
        target.innerHTML = `<div class="col-12"><div class="alert alert-light border mb-0">${emptyMessage}</div></div>`;
        return;
      }

      target.innerHTML = groups.map((group) => {
        const accent = group.color;
        const visibleItems = group.items.slice(0, 2);
        const focusChips = (group.focus || []).map((focus) => `
          <span class="pol-theme-pill">${escHtml(focus)}</span>
        `).join('');
        const metaItems = [
          `${group.total} sisältöä`,
          group.puheenvuoro ? `${group.puheenvuoro} puheenvuoroa` : '',
          group.aloite ? `${group.aloite} aloitetta` : '',
          group.mielipide ? `${group.mielipide} mielipidettä` : '',
          group.blogi ? `${group.blogi} blogia` : ''
        ].filter(Boolean).map((item) => `<span>${escHtml(item)}</span>`).join('');
        const links = visibleItems.map((item) => `
          <li class="pol-theme-proof-item">
            <div class="pol-theme-proof-top">
              <span class="pol-theme-proof-type">${escHtml(contentTypeLabel(item.contentType))}</span>
              <span>${escHtml(item.formattedDate || formatFiDate(item.date))}</span>
            </div>
            <a href="${escHtml(item.url)}" class="pol-theme-proof-link">${escHtml(item.title)}</a>
          </li>
        `).join('');

        return `
          <div class="${group.tier === 'core' ? 'col-lg-4' : 'col-lg-4'}">
            <article class="pol-theme-card ${group.tier === 'core' ? 'pol-theme-card--core' : 'pol-theme-card--support'}" style="border-top:4px solid ${accent}">
              <div class="pol-theme-head">
                <span class="pol-theme-icon" style="color:${accent}">
                  <i class="bi ${group.icon}"></i>
                </span>
                <h3 class="pol-theme-title">${escHtml(group.title)}</h3>
              </div>
              <p class="pol-theme-statement">${escHtml(group.statement)}</p>
              <p class="pol-theme-description">${escHtml(group.description)}</p>
              <div class="pol-theme-meta">${metaItems}</div>
              <div class="pol-theme-focus">${focusChips}</div>
              <p class="pol-theme-proof-label">Tuoreita nostoja</p>
              <ul class="pol-theme-proof-list">${links || '<li class="pol-theme-proof-item"><span class="text-muted small">Nostoja ei löytynyt.</span></li>'}</ul>
              <div class="pol-theme-footer">
                <a href="/kynasta/">Koko kirjoitusarkisto</a>
              </div>
            </article>
          </div>
        `;
      }).join('');
    }

    function renderThemeCards() {
      if (!coreThemeList && !supportThemeList) return;
      const groups = [...profileGroups];
      const coreGroups = groups.filter((group) => group.tier === 'core');
      const supportGroups = groups.filter((group) => group.tier !== 'core');

      renderThemeGroup(coreGroups, coreThemeList, 'Ydinteemoihin sidottuja sisältöjä ei löytynyt.');
      renderThemeGroup(supportGroups, supportThemeList, 'Tukiteemoihin sidottuja sisältöjä ei löytynyt.');

      if (!profileNote) return;
      profileNote.innerHTML = '<small class="text-muted">Luokittelu perustuu sisältöihin lisättyyn politicalProfiles-metadataan. Ydinteemat ja tukiteemat on eroteltu tämän sivun sisältöanalyysin pohjalta, ja sama kirjoitus voi näkyä useammassa teemassa.</small>';
    }

    function renderPoliticalSpeeches(page = 1) {
      if (!politicalSpeechesTableBody || !politicalSpeechesPagination || !politicalSpeechesInfo) return;
      const pageSize = currentPoliticalSpeechPageSize();
      const total = politicalSpeechesData.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const start = (safePage - 1) * pageSize;
      const items = politicalSpeechesData.slice(start, start + pageSize);

      politicalSpeechesTableBody.innerHTML = items.map((item) => `
        <tr>
          <td class="small text-muted">${escHtml(item.formattedDate)}</td>
          <td class="small">${escHtml(item.event)}</td>
          <td><a href="${escHtml(item.url)}" class="fw-semibold text-decoration-none political-speech-title">${escHtml(shortPoliticalSpeechTitle(item.title))}</a></td>
          <td class="small text-muted">${escHtml(item.asiakohta || '')}</td>
        </tr>
      `).join('');

      const first = total ? start + 1 : 0;
      const last = Math.min(start + pageSize, total);
      politicalSpeechesInfo.textContent = total
        ? `Näytetään ${first}–${last} / ${total} puhetta`
        : 'Puheita ei löytynyt';

      politicalSpeechesPagination.innerHTML = Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
        return `
          <li class="page-item ${pageNumber === safePage ? 'active' : ''}">
            <button type="button" class="page-link" data-political-speeches-page="${pageNumber}" aria-label="Sivu ${pageNumber}">
              ${pageNumber}
            </button>
          </li>
        `;
      }).join('');
    }

    renderThemeCards();
    applyPoliticsMobileDisclosureState();
    renderPoliticalSpeeches();

    politicalSpeechesPagination?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-political-speeches-page]');
      if (!button) return;
      const page = Number(button.getAttribute('data-political-speeches-page'));
      if (!Number.isFinite(page)) return;
      renderPoliticalSpeeches(page);
    });
    mobileQuery.addEventListener('change', () => {
      applyPoliticsMobileDisclosureState();
      renderPoliticalSpeeches(1);
    });
  })();
</script>
