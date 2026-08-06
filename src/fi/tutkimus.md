---
title: "Tutkimus, julkaisut ja opinnäytteet"
permalink: /tutkimus/
layout: base.njk
lang: fi
translationKey: research
description: "Jari Larun tutkimus kokoaa yhteisöllisen oppimisen, mobiiliteknologian ja tekoälylukutaidon: julkaisut, ohjatut opinnäytetyöt, hankkeet ja asiantuntijatehtävät."
templateEngineOverride: njk
pageStyles:
  - /css/research-page.css
schemaType: CollectionPage
schemaAbout:
  - "@type": "Thing"
    name: "Teknologiatuettu oppiminen"
    description: "Tutkimus teknologian roolista oppimisessa ja opetuksessa."
  - "@type": "Thing"
    name: "Tekoälylukutaito"
    description: "Opettajien ja oppijoiden tekoälylukutaito ja sen kehittäminen."
  - "@type": "Thing"
    name: "Mobiilioppiminen"
    description: "Mobiiliteknologian pedagoginen hyödyntäminen oppimisessa."
  - "@type": "Thing"
    name: "Yhteisöllinen oppiminen"
    description: "Yhteisöllisen oppimisen prosessit ja niiden tukeminen teknologialla."
  - "@type": "Thing"
    name: "Opettajankoulutus"
    description: "Opettajien koulutus ja ammatillinen kehittyminen."
schemaMentions:
  - "@type": "CollegeOrUniversity"
    name: "Oulun yliopisto"
    url: "https://www.oulu.fi/"
  - "@type": "Organization"
    name: "Kasvatustieteiden tiedekunta, Oulun yliopisto"
    url: "https://www.oulu.fi/fi/tiedekunnat/kasvatustieteiden-tiedekunta"
---

{% import "ui.njk" as ui %}
{%- set articleCount = 0 -%}
{%- set peerReviewedCount = 0 -%}
{%- set countA = 0 -%}
{%- set countC = 0 -%}
{%- set countConf = 0 -%}
{%- set countOther = 0 -%}
{%- for pub in researchfi -%}
  {%- if pub.typeCode == "A1" or pub.typeCode == "A2" -%}{%- set articleCount = articleCount + 1 -%}{%- set countA = countA + 1 -%}
  {%- elif pub.typeCode == "C1" or pub.typeCode == "C2" or pub.typeCode == "G4" or pub.typeCode == "G5" -%}{%- set countC = countC + 1 -%}
  {%- elif pub.typeCode == "A3" or pub.typeCode == "A4" or pub.typeCode == "B3" -%}{%- set countConf = countConf + 1 -%}
  {%- else -%}{%- set countOther = countOther + 1 -%}
  {%- endif -%}
  {%- if pub.peerReviewed -%}{%- set peerReviewedCount = peerReviewedCount + 1 -%}{%- endif -%}
{%- endfor -%}
{% set statementItems = [] %}
{% for item in (collections.publications or []) %}
  {% if item.data.type == "lausunto" %}
    {% set _ = (statementItems.push(item), null) %}
  {% endif %}
{% endfor %}

{% set researchCopy = {
  heroTitle: "Tutkin, miten teknologia muuttaa oppimista ja opettamista.",
  heroLead: "Tutkimukseni kulkee yhteisöllisestä oppimisesta ja mobiiliteknologiasta opettajien tekoälylukutaitoon. Työni yhdistää kasvatustieteen, opetuksen arjen ja uusien teknologioiden käytännöllisen ymmärtämisen.",
  areasTitle: "Keskeiset tutkimuslinjani",
  projectLead: "Strategisen tutkimuksen neuvoston rahoittama monitieteinen hanke rakentaa pohjaa tekoäly- ja turvallisuuskasvatukselle esi- ja perusopetuksessa.",
  projectBody: "Työssäni yhdistyvät tutkimustiedon välittäminen, opettajankoulutus ja opettajien tekoälylukutaidon tutkimus. Tavoitteena on tehdä vaikeasta ilmiöstä ymmärrettävä ja käyttökelpoinen koulun arjessa.",
  impactLead: "Tutkimus ei jää julkaisuihin. Se näkyy myös lausunnoissa, laatijaryhmissä ja asiantuntijatyöryhmissä, joissa arvioin opetuksen digitalisaatiota, tekoälysuosituksia ja koulutusjärjestelmän käytännön toimeenpanoa.",
  publicationsLead: "Julkaisuni kokoavat yhteen pitkän tutkimuslinjan opetusteknologiasta, yhteisöllisestä oppimisesta ja tekoälylukutaidosta.",
  thesesLead: "Ohjaamani opinnäytetyöt näyttävät, millaisia kysymyksiä opetuksesta, teknologiasta ja oppimisesta on käsitelty eri vuosina.",
  ownThesesTitle: "Omat opinnäytteeni",
  ownThesesLead: "Tutkimusurani alkoi mobiiliteknologian ja yhteisöllisen oppimisen kysymyksistä, ja samat teemat näkyvät työssäni edelleen uudessa muodossa.",
  historyTitle: "Tutkimusuran vaiheet",
  historyLead: "Alla ovat keskeiset tutkimusvaiheet ja hankkeet urani varrelta vanhimmasta uusimpaan.",
  profilesLead: "Tutkimusprofiilini, julkaisuni ja viittausdatani löytyvät myös näistä palveluista."
} %}
{% set researchProgramModel = researchProgram or {} %}
{% set researchLines = researchProgramModel.visibleLines or researchProgramModel.lines or [] %}
{% set currentResearchLine = researchProgramModel.currentLine or null %}
{% set featuredResearchPublications = researchProgramModel.featuredPublications or [] %}
{% set featuredResearchTheses = researchProgramModel.featuredTheses or [] %}
{% set latestResearchStatements = statementItems.slice(0, 3) %}
{% set latestResearchAssignments = (mediaArchive.expertAssignments or []).slice(0, 2) %}

<!-- HERO -->
<section class="research-hero py-5 bg-body-tertiary border-bottom">
  <div class="site-shell">
    <div class="row align-items-center g-4">
      <div class="col-lg-8">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Tutkimus</p>
        <h1 class="display-6 fw-bold mb-3">{{ researchCopy.heroTitle }}</h1>
        <p class="lead mb-3">{{ researchCopy.heroLead }}</p>
        <div class="research-hero-actions d-flex flex-wrap gap-2">
          <a href="#tutkimuslinjat" class="btn btn-read-more btn-sm rounded-pill px-3">Tutkimuslinjat</a>
          <a href="/julkaisut/" class="btn btn-read-more btn-sm rounded-pill px-3">Tieteelliset julkaisut</a>
          <a href="/opinnaytteet/" class="btn btn-read-more btn-sm rounded-pill px-3">Ohjatut opinnäytetyöt</a>
          <a href="https://orcid.org/0000-0003-0347-0182" class="btn btn-read-more btn-sm rounded-pill px-3 research-hero-secondary-action" target="_blank" rel="noopener noreferrer">ORCID-profiili</a>
          <a href="https://research.fi/en/results/person/0000-0003-0347-0182" class="btn btn-read-more btn-sm rounded-pill px-3 research-hero-secondary-action" target="_blank" rel="noopener noreferrer">Research.fi</a>
        </div>
      </div>
      <div class="col-lg-4 research-hero-kpis">
        <div class="row g-3 text-center">
          <div class="col-6">
            {{ ui.kpiCard("julkaisua", researchfi.length, { extraClass: "research-kpi-card" }) }}
          </div>
          <div class="col-6">
            {{ ui.kpiCard("vertaisarvioitua julkaisua", peerReviewedCount, { extraClass: "research-kpi-card" }) }}
          </div>
          <div class="col-6">
            {{ ui.kpiCard("ohjattua gradua", theses.stats.totalGradut, { extraClass: "research-kpi-card" }) }}
          </div>
          <div class="col-6">
            {{ ui.kpiCard("ohjattua kandidaatintyötä", theses.stats.totalKandit, { extraClass: "research-kpi-card" }) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


<nav class="research-mobile-path" aria-label="Tutkimussivun tärkeimmät osiot">
  <a href="#generation-ai">Nyt</a>
  <a href="#tutkimuslinjat">Linjat</a>
  <a href="#vaikuttavuus">Vaikutus</a>
  <a href="#naytto">Näyttö</a>
  <a href="#tausta">Tausta</a>
</nav>

<section class="py-5 bg-body-tertiary border-bottom" id="generation-ai">
  <div class="site-shell">
    <div class="row g-4 align-items-stretch">
      <div class="col-lg-7">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Nykyinen tutkimusohjelma</p>
        <h2 class="h3 fw-bold mb-3">Generation AI kokoaa tutkimukseni tämänhetkisen painopisteen</h2>
        <p class="lead mb-3">{{ researchCopy.projectLead }}</p>
        <p class="mb-3">{{ researchCopy.projectBody }}</p>
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body p-4">
            <h3 class="h6 text-uppercase text-muted fw-bold mb-3">Mikä on keskiössä juuri nyt?</h3>
            <ul class="mb-0 ps-3">
              <li>opettajien ja opettajaopiskelijoiden tekoälylukutaito</li>
              <li>tekoälykasvatus esi- ja perusopetuksessa</li>
              <li>tutkimustiedon vieminen koulun arkeen, materiaaleihin ja koulutuksiin</li>
            </ul>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <a href="https://www.generation-ai-stn.fi" class="btn btn-success" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right me-1"></i>Hankkeen sivusto</a>
          <a href="/tyoni-yliopistonlehtorina/" class="btn btn-outline-secondary">Yliopistotyö</a>
          <a href="/esitykset/" class="btn btn-outline-secondary">Esitykset ja materiaalit</a>
        </div>
      </div>
      <div class="col-lg-5 research-current-evidence">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4 d-flex flex-column">
            <h3 class="h6 text-uppercase text-muted fw-bold mb-3">Tuore tutkimusnäyttö tästä linjasta</h3>
            {% if currentResearchLine and currentResearchLine.publications.length %}
              <div class="d-grid gap-3">
                {% for pub in currentResearchLine.publications %}
                <article>
                  <p class="small fw-semibold mb-1">{{ pub.title }}</p>
                  <p class="small mb-2">{{ pub.citation }}</p>
                  <a href="{{ pub.url }}" class="btn btn-sm btn-outline-primary rounded-pill px-3">Julkaisun lähdeviite</a>
                </article>
                {% endfor %}
              </div>
            {% else %}
              <p class="text-muted small mb-0">Julkaisunostoja ei löytynyt tähän painopisteeseen buildin aikana.</p>
            {% endif %}
            <hr class="my-4">
            <dl class="row mb-0 small">
              <dt class="col-5 text-muted">Rahoittaja</dt>
              <dd class="col-7">Strategisen tutkimuksen neuvosto</dd>
              <dt class="col-5 text-muted">Rooli</dt>
              <dd class="col-7">Vuorovaikutusasiantuntija, tutkija</dd>
              <dt class="col-5 text-muted">Kohderyhmä</dt>
              <dd class="col-7">Esi- ja perusopetus, opettajat</dd>
              <dt class="col-5 text-muted">Organisaatio</dt>
              <dd class="col-7">Oulun yliopisto</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="py-5" id="tutkimuslinjat">
  <div class="site-shell">
    <div class="row g-4 align-items-end mb-2">
      <div class="col-lg-8">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Tutkimuslinjat</p>
        <h2 class="h3 fw-bold mb-3">{{ researchCopy.areasTitle }}</h2>
        <p class="text-muted mb-0">Tutkimussivun ydinkysymys ei ole vain mitä on julkaistu, vaan millä linjoilla työ etenee nyt ja miten eri julkaisut, opinnäytteet ja käytännön sovellukset liittyvät toisiinsa.</p>
      </div>
      <div class="col-lg-4 text-lg-end">
        <a href="/julkaisut/" class="btn btn-outline-primary btn-sm rounded-pill px-3">Koko julkaisuluettelo</a>
      </div>
    </div>

    <div class="row g-4">
      {% for line in researchLines %}
      <div class="col-lg-4">
        <article class="card border-0 shadow-sm h-100">
          <div class="card-body p-4 d-flex flex-column">
            <p class="small text-uppercase text-muted fw-semibold mb-2">{{ line.eyebrow }}</p>
            <h3 class="h5 fw-bold mb-2">{{ line.title }}</h3>
            <p class="text-muted small mb-3">{{ line.description }}</p>
            <p class="small text-uppercase text-muted fw-semibold mb-2">Julkaisut</p>
            {% if line.publications.length %}
              <div class="d-grid gap-3 mb-3">
                {% for pub in line.publications %}
                <div>
                  <p class="small fw-semibold mb-1">{{ pub.title }}</p>
                  <p class="small text-muted mb-1">{{ pub.citation }}</p>
                  <a href="{{ pub.url }}" class="small text-decoration-none">Avaa lähdeviite</a>
                </div>
                {% endfor %}
              </div>
            {% else %}
              <p class="text-muted small mb-3">Tähän tutkimuslinjaan ei ole vielä kuratoitu julkaisuostoja.</p>
            {% endif %}
            <p class="small text-uppercase text-muted fw-semibold mb-2">Liittyvät opinnäytteet</p>
            {% if line.theses.length %}
              <ul class="small ps-3 mb-4">
                {% for thesis in line.theses %}
                <li>
                  <a href="{{ thesis.link }}" target="_blank" rel="noopener noreferrer">{{ thesis.title }}</a><br>
                  <span class="text-muted">{{ thesis.citationApa }}</span>
                </li>
                {% endfor %}
              </ul>
            {% else %}
              <p class="text-muted small mb-4">Tähän tutkimuslinjaan ei ole vielä kuratoitu opinnäytenostoja.</p>
            {% endif %}
            <div class="mt-auto d-flex flex-wrap gap-2">
              <a href="{{ line.themeUrl }}" class="btn btn-sm btn-outline-primary rounded-pill px-3">{{ line.themeLabel or "Aiheprofiili" }}</a>
              <a href="{{ line.secondaryUrl }}" class="btn btn-sm btn-outline-secondary rounded-pill px-3">{{ line.secondaryLabel }}</a>
            </div>
          </div>
        </article>
      </div>
      {% endfor %}
    </div>
  </div>
</section>

<section class="py-5 bg-body-tertiary border-top border-bottom" id="vaikuttavuus">
  <div class="site-shell">
    <div class="row g-4 align-items-start">
      <div class="col-lg-5">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Tutkimus käytännössä</p>
        <h2 class="h3 fw-bold mb-3">Julkaisut eivät ole tutkimuksen päätepiste</h2>
        <p class="text-muted mb-3">{{ researchCopy.impactLead }}</p>
        <p class="mb-3">Tällä sivulla tutkimus näkyy kolmessa muodossa: nykyisenä tutkimusohjelmana, tutkimuslinjoihin jäsentyvänä näyttönä ja käytännön työnä, jossa sama tieto jatkuu lausuntoihin, asiantuntijatehtäviin ja materiaaleihin.</p>
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <h3 class="h6 text-uppercase text-muted fw-bold mb-3">Mihin tutkimus siirtyy tästä eteenpäin?</h3>
            <ul class="mb-0 ps-3">
              <li>lausuntoihin opetuksen, tekoälyn ja digitalisaation kysymyksissä</li>
              <li>asiantuntijatehtäviin ja valmistelun kommentointiin</li>
              <li>opettajankoulutukseen, esityksiin ja avoimiin materiaaleihin</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="col-lg-7">
        <div class="row g-3">
          {% for item in latestResearchStatements %}
          <div class="col-md-6">
            <article class="card border-0 shadow-sm h-100">
              <div class="card-body p-4 d-flex flex-column">
                <p class="small text-uppercase text-muted fw-semibold mb-2">Lausunto</p>
                {% set canvaHref = (item.data.url or item.url) | canvaPublicUrl %}
                <h3 class="h6 fw-bold mb-2"><a class="text-decoration-none stretched-link" href="{{ canvaHref or item.url }}"{% if canvaHref %} target="_blank" rel="noopener noreferrer"{% endif %}>{{ item.data.title }}</a></h3>
                <p class="text-muted small mb-0">{{ item.data.description or (item.templateContent | excerpt) }}</p>
              </div>
            </article>
          </div>
          {% endfor %}
          {% for item in latestResearchAssignments %}
          <div class="col-md-6">
            <article class="card border-0 shadow-sm h-100">
              <div class="card-body p-4 d-flex flex-column">
                <p class="small text-uppercase text-muted fw-semibold mb-2">{{ item.data.roleTitle or "Asiantuntijatehtävä" }}</p>
                <h3 class="h6 fw-bold mb-2"><a class="text-decoration-none stretched-link" href="{{ item.url }}">{{ item.data.title }}</a></h3>
                <p class="text-muted small mb-0">{{ item.data.description or (item.content | excerpt) }}</p>
              </div>
            </article>
          </div>
          {% endfor %}
        </div>
        <div class="mt-3 d-flex flex-wrap gap-2">
          <a href="/lausunnot/#lausunnot" class="btn btn-outline-primary btn-sm rounded-pill px-3">Kaikki lausunnot</a>
          <a href="/mediassa/#media-arkisto" class="btn btn-outline-primary btn-sm rounded-pill px-3">Asiantuntijaroolit</a>
          <a href="/esitykset/" class="btn btn-outline-primary btn-sm rounded-pill px-3">Esitykset ja materiaalit</a>
        </div>
      </div>
    </div>
  </div>
</section>

{% set topicProfileKeys = ["tekoalylukutaito", "opettajankoulutus", "koulutusteknologia-ja-oppimisymparistot"] %}
{% set topicProfileTitleId = "research-topic-profiles-title" %}
{% set topicProfileEyebrow = "Aiheprofiilit" %}
{% set topicProfileTitle = "Samat tutkimuslinjat jatkuvat muualla sivustolla" %}
{% set topicProfileLead = "Teemaprofiilit kokoavat yhteen julkaisut, lausunnot, materiaalit, mediaosumat ja opetustyön silloin, kun haluat seurata yhtä aihetta yli sivurajojen." %}
{% include "topic-profile-links.njk" %}

<section class="py-5" id="naytto">
  <div class="site-shell">
    <div class="row g-4 align-items-end mb-2">
      <div class="col-lg-8">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Näyttö tutkimuksesta</p>
        <h2 class="h3 fw-bold mb-3">Julkaisut ja opinnäytteet samassa rakenteessa</h2>
        <p class="text-muted mb-0">Tässä kohtaa sivua tutkimuksen määrällinen näyttö ja sisällöllinen näyttö tulevat yhteen. Julkaisut kertovat, mitä on tutkittu. Opinnäytteet näyttävät, miten samat teemat jatkuvat ohjauksessa ja opiskelijoiden tutkimuskysymyksissä.</p>
      </div>
    </div>

    <div class="row g-4 align-items-stretch">
      <div class="col-lg-7">
        <article class="card border-0 shadow-sm h-100" id="julkaisut">
          <div class="card-body p-4 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <p class="small text-uppercase text-muted fw-semibold mb-1">Julkaisut</p>
                <h3 class="h4 fw-bold mb-0">Tutkimusnäyttö julkaisujen kautta</h3>
              </div>
              <a href="/julkaisut/" class="btn btn-outline-primary btn-sm">Katso kaikki</a>
            </div>
            <p class="text-muted small mb-4">{{ researchCopy.publicationsLead }}</p>
            <div class="row g-3 mb-4">
              <div class="col-6 col-md-3">
                {{ ui.kpiCard("Lehtiartikkelit", countA, { extraClass: "research-kpi-card" }) }}
              </div>
              <div class="col-6 col-md-3">
                {{ ui.kpiCard("Konferenssit", countConf, { extraClass: "research-kpi-card" }) }}
              </div>
              <div class="col-6 col-md-3">
                {{ ui.kpiCard("Kirjat ja väitökset", countC, { extraClass: "research-kpi-card" }) }}
              </div>
              <div class="col-6 col-md-3">
                {{ ui.kpiCard("Vertaisarvioitua julkaisua", peerReviewedCount, { extraClass: "research-kpi-card" }) }}
              </div>
            </div>
            {% if featuredResearchPublications.length %}
            <div class="d-grid gap-3">
              {% for pub in featuredResearchPublications %}
              <article class="border rounded p-3">
                <p class="small fw-semibold mb-1">{{ pub.title }}</p>
                <p class="small text-muted mb-2">{{ pub.citation }}</p>
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <a href="{{ pub.url }}" class="btn btn-sm btn-outline-primary rounded-pill px-3">Julkaisun lähdeviite</a>
                  {% if pub.doi and semanticscholar.metrics.doiCitations[pub.doi | lower] %}
                  <span class="badge text-bg-warning rounded-pill" title="Viittaukset"><i class="bi bi-quote me-1"></i>{{ semanticscholar.metrics.doiCitations[pub.doi | lower] }}</span>
                  {% endif %}
                </div>
              </article>
              {% endfor %}
            </div>
            {% else %}
            <div class="alert alert-info mb-0">Julkaisudata ladataan Research.fi-profiilista build-vaiheessa.</div>
            {% endif %}
          </div>
        </article>
      </div>

      <div class="col-lg-5">
        <article class="card border-0 shadow-sm h-100" id="opinnaytteet">
          <div class="card-body p-4 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <p class="small text-uppercase text-muted fw-semibold mb-1">Opinnäytteet</p>
                <h3 class="h4 fw-bold mb-0">Ohjaukset osana tutkimuslinjaa</h3>
              </div>
              <a href="/opinnaytteet/" class="btn btn-outline-primary btn-sm">Katso kaikki</a>
            </div>
            <p class="text-muted small mb-4">{{ researchCopy.thesesLead }}</p>
            <div class="row g-3 mb-4">
              <div class="col-6">
                {{ ui.kpiCard("Gradut", theses.stats.totalGradut, { extraClass: "research-kpi-card" }) }}
              </div>
              <div class="col-6">
                {{ ui.kpiCard("Kandit", theses.stats.totalKandit, { extraClass: "research-kpi-card" }) }}
              </div>
            </div>
            {% if theses.stats.byYear %}
            <div class="d-flex gap-1 flex-wrap mb-4">
              {% for item in theses.stats.byYear.slice(0, 6) %}
              <span class="badge bg-secondary">{{ item[0] }}: {{ item[1] }}</span>
              {% endfor %}
            </div>
            {% endif %}
            {% if featuredResearchTheses.length %}
            <div class="d-grid gap-3">
              {% for thesis in featuredResearchTheses %}
              <article class="border rounded p-3">
                <h4 class="h6 fw-bold mb-1"><a href="{{ thesis.link }}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">{{ thesis.title }}</a></h4>
                <p class="small text-muted mb-0">{{ thesis.citationApa }}</p>
              </article>
              {% endfor %}
            </div>
            {% endif %}
          </div>
        </article>
      </div>
    </div>
  </div>
</section>

<section class="py-5 bg-body-tertiary border-top border-bottom" id="tausta" data-research-mobile-priority="2">
  <div class="site-shell">
    <div class="row g-4 align-items-center">
      <div class="col-lg-7">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Tausta ja arkisto</p>
        <h2 class="h3 fw-bold mb-3">Nykyinen tutkimuslinja rakentuu pidemmästä historiasta</h2>
        <p class="text-muted mb-0">Sivun loppuosa ei ole enää varsinainen tutkimuksen pääpolku, vaan taustakerros. Täältä löytyvät oma väitöskirja, tutkimusuran vaiheet, apurahat, tunnustukset ja ulkoiset tutkijaprofiilit.</p>
      </div>
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <h3 class="h6 text-uppercase text-muted fw-bold mb-3">Arkiston osat</h3>
            <ul class="mb-0 ps-3 small">
              <li>oma väitöskirja ja gradun tausta</li>
              <li>tutkimushistoria 2003–2026</li>
              <li>apurahat, palkinnot ja tunnustukset</li>
              <li>ORCID, Research.fi, Scholar, OuluREPO ja muut profiilit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- OMA VÄITÖSKIRJA -->
<section class="py-5" id="omat-opinnaytteet" data-research-mobile-priority="2">
  <div class="site-shell">
    <details class="research-mobile-disclosure" data-research-mobile-collapse open>
      <summary class="research-mobile-disclosure-summary">
        <span>{{ researchCopy.ownThesesTitle }}</span>
        <small>Väitöskirja, gradu ja tutkimuslinjan alku</small>
      </summary>
      <div class="research-mobile-disclosure-body">
        <h2 class="h3 fw-bold mb-2">{{ researchCopy.ownThesesTitle }}</h2>
        <p class="text-muted mb-4">{{ researchCopy.ownThesesLead }}</p>
        <div class="row g-4">
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body p-4">
                <span class="badge bg-primary mb-3">Väitöskirja 2012</span>
                <h3 class="h5 fw-bold mb-2">Scaffolding learning activities with collaborative scripts and mobile devices</h3>
                <p class="text-muted mb-2">Oulun yliopisto, kasvatustiede. Väitös 20.11.2012.</p>
                <p class="mb-3">Väitöskirja tutki, miten yhteisöllisiä skriptejä voidaan hyödyntää mobiililaitteiden tukemissa oppimisympäristöissä. Työ yhdistää CSCL-tutkimuksen (Computer-Supported Collaborative Learning) ja mobiiliteknologian.</p>
                <div class="d-flex flex-wrap gap-2">
                  <a href="/vaitoskirja/" class="btn btn-sm btn-outline-primary">Väitöskokonaisuus</a>
                  <a href="http://jultika.oulu.fi/Record/isbn978-951-42-9940-7" class="btn btn-sm btn-outline-secondary" target="_blank" rel="noopener noreferrer">Jultika-arkisto</a>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body p-4">
                <span class="badge bg-secondary mb-3">Pro gradu 2003</span>
                <h3 class="h5 fw-bold mb-2">Langattomat päätelaitteet hajautetun asiantuntijuuden ja yhteisöllisen tiedonrakentelun tukena</h3>
                <p class="text-muted mb-2">Goman, H. &amp; Laru, J. (2003). Oulun yliopisto.</p>
                <p class="mb-3">Varhaisvaiheen tutkimus langattomien laitteiden mahdollisuuksista hajautetun asiantuntijuuden ja yhteisöllisen tiedonrakentelun välineinä &ndash; ennen älypuhelinaikaa.</p>
                <a href="https://www.researchgate.net/publication/259217800_Langattomat_paatelaitteet_hajautetun_asiantuntijuuden_ja_yhteisollisen_tiedonrakentelun_tukena" class="btn btn-sm btn-outline-secondary" target="_blank" rel="noopener noreferrer">ResearchGate</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
  </div>
</section>

<!-- TUTKIJAHISTORIA – horisontaalinen aikajana, vanhin ensin -->
<section class="py-5 bg-body-tertiary border-top border-bottom" id="tutkimushistoria" data-research-mobile-priority="2">
  <div class="site-shell">
    <details class="research-mobile-disclosure" data-research-mobile-collapse open>
      <summary class="research-mobile-disclosure-summary">
        <span>{{ researchCopy.historyTitle }}</span>
        <small>Hankkeet ja tutkimusvaiheet vuodesta 2003 eteenpäin</small>
      </summary>
      <div class="research-mobile-disclosure-body">
        <h2 class="h3 fw-bold mb-2">{{ researchCopy.historyTitle }}</h2>
        <p class="text-muted mb-4">{{ researchCopy.historyLead }}</p>
        <p class="small text-muted mb-3">Vihje: aikajana vierii sivusuunnassa mobiilissa ja pienillä näytöillä.</p>
  <div class="tutkijahistoria-scroll px-3 px-md-4 pb-4">
    <div class="d-flex gap-3 align-items-stretch">

      <div class="tutkijahistoria-card card border-0 shadow-sm flex-shrink-0">
        <div class="card-body p-4">
          <span class="badge bg-secondary mb-3">2003&ndash;2004</span>
          <h3 class="h5 fw-bold mb-1">TEKES Rotuuari</h3>
          <p class="text-muted small mb-3">Teknologian ja innovaatioiden kehittämiskeskus (TEKES) &mdash; Oulun yliopisto</p>
          <p class="small mb-0">Mobiiliteknologian hyödyntäminen oppimisympäristöissä. Varhaisvaiheen tutkimus langattomista oppimisratkaisuista Suomessa &ndash; ennen älypuhelinaikaa.</p>
        </div>
      </div>

      <div class="tutkijahistoria-arrow align-self-center text-muted flex-shrink-0" aria-hidden="true">
        <i class="bi bi-arrow-right fs-4"></i>
      </div>

      <div class="tutkijahistoria-card card border-0 shadow-sm flex-shrink-0">
        <div class="card-body p-4">
          <span class="badge bg-secondary mb-3">2004&ndash;2005</span>
          <h3 class="h5 fw-bold mb-1">EU FP6 Kaleidoscope</h3>
          <p class="text-muted small mb-3">Euroopan unioni, 6. puiteohjelma &mdash; Network of Excellence</p>
          <p class="small mb-0">Kansainvälinen tutkimusverkosto teknologiatuetun oppimisen alalla. Yhteistyö eurooppalaisten yliopistojen kanssa CSCL-tutkimuksessa.</p>
        </div>
      </div>

      <div class="tutkijahistoria-arrow align-self-center text-muted flex-shrink-0" aria-hidden="true">
        <i class="bi bi-arrow-right fs-4"></i>
      </div>

      <div class="tutkijahistoria-card card border-0 shadow-sm flex-shrink-0">
        <div class="card-body p-4">
          <span class="badge bg-secondary mb-3">2006&ndash;2009</span>
          <h3 class="h5 fw-bold mb-1">Monitieteinen tutkijakoulu</h3>
          <p class="text-muted small mb-3">Oulun yliopisto &mdash; Väitöskirjavaihe</p>
          <p class="small mb-0">Väitöskirjatyö yhteisöllisten skriptien ja mobiililaitteiden tutkimuksesta. Kasvatustieteen, teknologian ja kognitiotieteen rajapinnalla.</p>
        </div>
      </div>

      <div class="tutkijahistoria-arrow align-self-center text-muted flex-shrink-0" aria-hidden="true">
        <i class="bi bi-arrow-right fs-4"></i>
      </div>

      <div class="tutkijahistoria-card card border-0 shadow-sm flex-shrink-0">
        <div class="card-body p-4">
          <span class="badge bg-secondary mb-3">2005&ndash;2010</span>
          <h3 class="h5 fw-bold mb-1">Kulttuurirahasto-apurahat</h3>
          <p class="text-muted small mb-3">Suomen Kulttuurirahasto (2005&ndash;2006 ja 2009&ndash;2010)</p>
          <p class="small mb-0">Yksivuotiset tutkimusapurahat väitöskirjatyöhön: Urpo ja Maija-Liisa Harvan rahasto (16&thinsp;400 €) ja Xerox Oy:n rahasto (21&thinsp;000 €).</p>
        </div>
      </div>

      <div class="tutkijahistoria-arrow align-self-center text-muted flex-shrink-0" aria-hidden="true">
        <i class="bi bi-arrow-right fs-4"></i>
      </div>

      <div class="tutkijahistoria-card card border-0 shadow-sm flex-shrink-0">
        <div class="card-body p-4">
          <span class="badge bg-primary mb-3">2012 &ndash; väitös</span>
          <h3 class="h5 fw-bold mb-1">KT-tutkinto &amp; Digipedagogiikka</h3>
          <p class="text-muted small mb-3">Oulun yliopisto &mdash; Kasvatustieteiden tiedekunta</p>
          <p class="small mb-0">Väitöskirja hyväksytty 20.11.2012. Yli vuosikymmenen opetustyö TVT-opetuksen, sosiaalisen median ja STEAM-sivuaineen parissa.</p>
        </div>
      </div>

      <div class="tutkijahistoria-arrow align-self-center text-muted flex-shrink-0" aria-hidden="true">
        <i class="bi bi-arrow-right fs-4"></i>
      </div>

      <div class="tutkijahistoria-card card border-0 shadow-sm flex-shrink-0">
        <div class="card-body p-4">
          <span class="badge bg-secondary mb-3">2020&ndash;2023</span>
          <h3 class="h5 fw-bold mb-1">MakeCT</h3>
          <p class="text-muted small mb-3">Assessing CT in Nordic Maker Education &mdash; Nordplus Horizontal -rahoitteinen pohjoismainen yhteistyö</p>
          <p class="small mb-0">Tutkimushanke laskennallisen ajattelun (Computational Thinking) arvioinnista ja integroinnista maker-kasvatuksen kontekstissa peruskoulussa. Yhteistyö pohjoismaisten korkeakoulujen ja koulujen kanssa.</p>
        </div>
        <div class="card-footer bg-transparent border-0 px-4 pb-3 pt-0">
          <a href="https://sites.google.com/edu.oulu.fi/makect/home" class="btn btn-sm btn-outline-secondary" target="_blank" rel="noopener noreferrer">Hankkeen sivusto</a>
        </div>
      </div>

      <div class="tutkijahistoria-arrow align-self-center text-muted flex-shrink-0" aria-hidden="true">
        <i class="bi bi-arrow-right fs-4"></i>
      </div>

      <div class="tutkijahistoria-card card border-success shadow-sm flex-shrink-0" style="border-width: 2px !important;">
        <div class="card-body p-4">
          <span class="badge bg-success mb-3">2022&ndash;</span>
          <h3 class="h5 fw-bold mb-1">Generation AI</h3>
          <p class="text-muted small mb-3">Suomen Akatemian Strategisen tutkimuksen neuvosto (STN) &mdash; Oulun yliopisto</p>
          <p class="small mb-0">Tekoälylukutaitojen ja tekoälykasvatuksen tutkimus esi- ja perusopetuksessa. Vuorovaikutusasiantuntijana tutkimustiedon välittäminen opettajille ja kouluille.</p>
        </div>
        <div class="card-footer bg-transparent border-0 px-4 pb-3 pt-0">
          <a href="https://www.generation-ai-stn.fi" class="btn btn-sm btn-success" target="_blank" rel="noopener noreferrer">Hankkeen sivusto</a>
        </div>
      </div>

    </div>
  </div>
  
      </div>
    </details>
  </div>
</section>

<!-- APURAHAT JA PALKINNOT -->
<section class="py-5" id="apurahat-ja-palkinnot" data-research-mobile-priority="2">
  <div class="site-shell">
    <details class="research-mobile-disclosure" data-research-mobile-collapse open>
      <summary class="research-mobile-disclosure-summary">
        <span>Apurahat, palkinnot ja tunnustukset</span>
        <small>Tutkimustyön rahoitus ja tunnustukset</small>
      </summary>
      <div class="research-mobile-disclosure-body">
        <div class="row g-5">
          <div class="col-md-6">
            <h2 class="h3 fw-bold mb-4">Apurahat</h2>
            <div class="list-group list-group-flush border rounded">
              <div class="list-group-item px-4 py-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="fw-bold">Suomen Kulttuurirahasto</div>
                    <div class="small text-muted">Xerox Oy:n rahasto &mdash; väitöskirjatyö</div>
                  </div>
                  <span class="badge bg-warning text-dark">2010</span>
                </div>
                <div class="small mt-1 text-success fw-bold">21&thinsp;000 &euro;</div>
              </div>
              <div class="list-group-item px-4 py-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="fw-bold">Oulun yliopiston matka-apuraha</div>
                    <div class="small text-muted">EARLI 2009 -konferenssi</div>
                  </div>
                  <span class="badge bg-secondary">2009</span>
                </div>
                <div class="small mt-1 text-success fw-bold">1&thinsp;500 &euro;</div>
              </div>
              <div class="list-group-item px-4 py-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="fw-bold">Suomen Kulttuurirahasto</div>
                    <div class="small text-muted">Urpo ja Maija-Liisa Harvan rahasto &mdash; väitöskirjatyö</div>
                  </div>
                  <span class="badge bg-secondary">2005</span>
                </div>
                <div class="small mt-1 text-success fw-bold">16&thinsp;400 &euro;</div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <h2 class="h3 fw-bold mb-4">Palkinnot ja tunnustukset</h2>
            <div class="card border-0 shadow-sm mb-3">
              <div class="card-body p-4">
                <div class="d-flex gap-3 align-items-start">
                  <span class="badge bg-warning text-dark fs-6 px-3 py-2 flex-shrink-0">2020</span>
                  <div>
                    <h3 class="h5 fw-bold mb-1">Kansallinen avoimen tieteen palkinto</h3>
                    <p class="text-muted small mb-2">Tieteellisten seurain valtuuskunta (TSV)</p>
                    <p class="mb-2 small">Palkinto myönnettiin pitkäaikaisesta avoimuuden edistämisestä opetuksessa ja aktiivisesta tuen tarjoamisesta etäopetuksessa koronapandemian aikana.</p>
                    <a href="/palkinnot/" class="btn btn-sm btn-outline-warning">Lue lisää</a>
                  </div>
                </div>
              </div>
            </div>
            <div class="card border-0 shadow-sm">
              <div class="card-body p-4">
                <div class="d-flex gap-3 align-items-start">
                  <span class="badge bg-secondary fs-6 px-3 py-2 flex-shrink-0">2012</span>
                  <div>
                    <h3 class="h5 fw-bold mb-1">Omena hyvälle opettajalle</h3>
                    <p class="text-muted small mb-2">Oulun yliopiston ylioppilaskunta (OYY)</p>
                    <p class="mb-0 small">LO11-B-opiskelijaryhmän tunnustus erinomaisesta opetuksesta. Lisää <a href="/opiskelijoiden-antamaa-palautetta/">palautesivulla</a>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
  </div>
</section>

<!-- PROFIILIT -->
<section class="py-5 bg-body-tertiary border-top" id="profiilit" data-research-mobile-priority="2">
  <div class="site-shell">
    <details class="research-mobile-disclosure" data-research-mobile-collapse open>
      <summary class="research-mobile-disclosure-summary">
        <span>Tutkijaprofiilit</span>
        <small>ORCID, Research.fi, Scholar ja muut palvelut</small>
      </summary>
      <div class="research-mobile-disclosure-body">
        <h2 class="h3 fw-bold mb-2">Tutkijaprofiilit</h2>
        <p class="text-muted mb-4">{{ researchCopy.profilesLead }}</p>
        <div class="row g-3">
      <div class="col-sm-6 col-lg-3">
        <a href="https://orcid.org/0000-0003-0347-0182" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-success"><i class="bi bi-person-badge-fill"></i></div>
            <h3 class="h6 fw-bold">ORCID</h3>
            <p class="small text-muted mb-0">0000-0003-0347-0182</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="https://research.fi/en/results/person/0000-0003-0347-0182" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-primary"><i class="bi bi-building"></i></div>
            <h3 class="h6 fw-bold">Research.fi</h3>
            <p class="small text-muted mb-0">Kansallinen tutkijatietokanta</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="https://scholar.google.com/scholar?q=Jari+Laru" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-warning"><i class="bi bi-search"></i></div>
            <h3 class="h6 fw-bold">Google Scholar</h3>
            <p class="small text-muted mb-0">Viittausdataa ja h-indeksi</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="https://www.semanticscholar.org/author/Jari-Laru/2016750" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-info"><i class="bi bi-graph-up"></i></div>
            <h3 class="h6 fw-bold">Semantic Scholar</h3>
            <p class="small text-muted mb-0">AI-pohjainen viittausanalyysi</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="https://www.researchgate.net/profile/Jari-Laru" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-success"><i class="bi bi-share-fill"></i></div>
            <h3 class="h6 fw-bold">ResearchGate</h3>
            <p class="small text-muted mb-0">Julkaisut ja yhteistyöverkosto</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="https://fi.linkedin.com/in/jarilaru" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2" style="color:#0a66c2"><i class="bi bi-linkedin"></i></div>
            <h3 class="h6 fw-bold">LinkedIn</h3>
            <p class="small text-muted mb-0">Ammatillinen profiili</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="https://oulurepo.oulu.fi/search?query=Laru" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-secondary"><i class="bi bi-archive-fill"></i></div>
            <h3 class="h6 fw-bold">OuluREPO</h3>
            <p class="small text-muted mb-0">Oulun yliopiston julkaisuarkisto</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="https://www.oulu.fi/letlab" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-danger"><i class="bi bi-flask-fill"></i></div>
            <h3 class="h6 fw-bold">LETLab</h3>
            <p class="small text-muted mb-0">Oppimisen ja koulutusteknologian tutkimusyksikkö</p>
          </div>
        </a>
      </div>
        </div>
      </div>
    </details>
  </div>
</section>

<section class="site-shell py-0 pb-5">
  {% set relatedSivuyhteys = "tutkimus" %}
  {% set relatedTitle = "Tutkimustyöhön liittyviä esityksiä" %}
  {% set relatedLimit = 4 %}
  {% set relatedLinkHref = "/esitykset/" %}
  {% set relatedLinkLabel = "Kaikki esitykset ja materiaalit →" %}
  {% include "related-presentations.njk" %}
</section>
