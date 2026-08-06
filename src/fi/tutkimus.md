---
title: "Tutkimus"
permalink: /tutkimus/
layout: base.njk
lang: fi
translationKey: research
description: "Jari Larun tutkimus: nykyinen Generation AI -ohjelma, kolme keskeistä tutkimuslinjaa (tekoälylukutaito, opettajankoulutus, koulutusteknologia) sekä väitöskirja ja tutkijaprofiilit."
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

{% set researchProgramModel = researchProgram or {} %}
{% set researchLines = researchProgramModel.visibleLines or researchProgramModel.lines or [] %}
{% set currentResearchLine = researchProgramModel.currentLine or null %}

<!-- HERO -->
<section class="research-hero py-5 bg-body-tertiary border-bottom">
  <div class="site-shell">
    <div class="row align-items-center g-4">
      <div class="col-lg-9">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Tutkimus</p>
        <h1 class="display-6 fw-bold mb-3">Tutkimuksen tarkasteluteemat: miten teknologia muuttaa oppimista ja opettamista</h1>
        <p class="lead mb-4">Jari Larun tutkimus kulkee yhteisöllisestä oppimisesta ja mobiiliteknologiasta opettajien tekoälylukutaitoon. Tämä sivu kokoaa nykyisen tutkimusohjelman, kolme keskeistä tutkimuslinjaa ja tunnistetiedot ulkoisiin tutkijaprofiileihin.</p>
        <div class="d-flex flex-wrap gap-2">
          <a href="/julkaisut/" class="btn btn-primary rounded-pill px-4">Avaa julkaisuluettelo</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- NYKYINEN OHJELMA: GENERATION AI -->
<section class="py-5" id="generation-ai">
  <div class="site-shell">
    <div class="row g-4 align-items-stretch">
      <div class="col-lg-7">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Nykyinen tutkimusohjelma</p>
        <h2 class="h3 fw-bold mb-3">Generation AI kokoaa tutkimuksen tämänhetkisen painopisteen</h2>
        <p class="lead mb-3">Suomen Akatemian Strategisen tutkimuksen neuvoston (STN) rahoittama monitieteinen hanke (2022–) rakentaa pohjaa tekoäly- ja turvallisuuskasvatukselle esi- ja perusopetuksessa.</p>
        <p class="mb-3">Työssä yhdistyvät tutkimustiedon välittäminen, opettajankoulutus ja opettajien tekoälylukutaidon tutkimus. Tavoitteena on tehdä vaikeasta ilmiöstä ymmärrettävä ja käyttökelpoinen koulun arjessa.</p>
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
              <dd class="col-7">Suomen Akatemian Strategisen tutkimuksen neuvosto</dd>
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

<!-- TUTKIMUSLINJAT -->
<section class="py-5 bg-body-tertiary border-top border-bottom" id="tutkimuslinjat">
  <div class="site-shell">
    <div class="row g-4 align-items-end mb-3">
      <div class="col-lg-8">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Tutkimuslinjat</p>
        <h2 class="h3 fw-bold mb-3">Kolme keskeistä tutkimuslinjaa</h2>
        <p class="text-muted mb-0">Työn ydinkysymys ei ole vain mitä on julkaistu, vaan millä linjoilla työ etenee ja miten eri julkaisut, opinnäytteet ja käytännön sovellukset liittyvät toisiinsa.</p>
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
            {% if line.publications.length %}
              <p class="small text-uppercase text-muted fw-semibold mb-2">Keskeinen julkaisu</p>
              <div class="mb-3">
                {% set pub = line.publications[0] %}
                <p class="small fw-semibold mb-1">{{ pub.title }}</p>
                <p class="small text-muted mb-1">{{ pub.citation }}</p>
                <a href="{{ pub.url }}" class="small text-decoration-none">Avaa lähdeviite →</a>
              </div>
            {% endif %}
            <div class="mt-auto d-flex flex-wrap gap-2">
              <a href="{{ line.themeUrl }}" class="btn btn-sm btn-outline-primary rounded-pill px-3">{{ line.themeLabel or "Aiheprofiili" }}</a>
            </div>
          </div>
        </article>
      </div>
      {% endfor %}
    </div>
  </div>
</section>

<!-- OMA VÄITÖSKIRJA JA PRO GRADU -->
<section class="py-5" id="omat-opinnaytteet">
  <div class="site-shell">
    <div class="row g-4 align-items-end mb-3">
      <div class="col-lg-8">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Tutkimustyön alkupiste</p>
        <h2 class="h3 fw-bold mb-3">Väitöskirja ja pro gradu</h2>
        <p class="text-muted mb-0">Tutkimusuran alkupiste löytyy mobiiliteknologian ja yhteisöllisen oppimisen kysymyksistä. Samat teemat näkyvät työssä edelleen uudessa muodossa.</p>
      </div>
    </div>
    <div class="row g-4">
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <span class="badge bg-primary mb-3">Väitöskirja 2012</span>
            <h3 class="h5 fw-bold mb-2">Scaffolding learning activities with collaborative scripts and mobile devices</h3>
            <p class="text-muted mb-2">Oulun yliopisto, kasvatustiede. Väitös 21.11.2012.</p>
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
</section>

<!-- TUTKIJAPROFIILIT -->
<section class="py-5 bg-body-tertiary border-top" id="profiilit">
  <div class="site-shell">
    <div class="row g-4 align-items-end mb-3">
      <div class="col-lg-8">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Tutkijaprofiilit</p>
        <h2 class="h3 fw-bold mb-3">Julkaisut ja viittausdata ulkoisissa palveluissa</h2>
        <p class="text-muted mb-0">Tutkimusprofiilit, julkaisut ja viittausdata löytyvät myös näistä palveluista.</p>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-sm-6 col-lg-4">
        <a href="https://orcid.org/0000-0003-0347-0182" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-success"><i class="bi bi-person-badge-fill"></i></div>
            <h3 class="h6 fw-bold">ORCID</h3>
            <p class="small text-muted mb-0">0000-0003-0347-0182</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-4">
        <a href="https://research.fi/en/results/person/0000-0003-0347-0182" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-primary"><i class="bi bi-building"></i></div>
            <h3 class="h6 fw-bold">Research.fi</h3>
            <p class="small text-muted mb-0">Kansallinen tutkijatietokanta</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-4">
        <a href="https://scholar.google.com/scholar?q=Jari+Laru" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-warning"><i class="bi bi-search"></i></div>
            <h3 class="h6 fw-bold">Google Scholar</h3>
            <p class="small text-muted mb-0">Viittausdata ja h-indeksi</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-4">
        <a href="https://www.semanticscholar.org/author/Jari-Laru/2016750" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-info"><i class="bi bi-graph-up"></i></div>
            <h3 class="h6 fw-bold">Semantic Scholar</h3>
            <p class="small text-muted mb-0">AI-pohjainen viittausanalyysi</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-4">
        <a href="https://oulurepo.oulu.fi/search?query=Laru" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-secondary"><i class="bi bi-archive-fill"></i></div>
            <h3 class="h6 fw-bold">OuluREPO</h3>
            <p class="small text-muted mb-0">Oulun yliopiston julkaisuarkisto</p>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-4">
        <a href="https://www.researchgate.net/profile/Jari-Laru" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2 text-success"><i class="bi bi-share-fill"></i></div>
            <h3 class="h6 fw-bold">ResearchGate</h3>
            <p class="small text-muted mb-0">Julkaisut ja yhteistyöverkosto</p>
          </div>
        </a>
      </div>
    </div>
  </div>
</section>

<!-- MUUALLA SIVUSTOLLA -->
<section class="site-shell pb-5">
  <aside class="research-crosslinks">
    <h2>Muualla sivustolla</h2>
    <ul>
      <li>
        <a href="/julkaisut/">Julkaisuluettelo</a> — kaikki tieteelliset julkaisut OKM-luokituksen mukaisesti
        <ul>
          <li><a href="/vaitoskirja/">Väitöskirja</a> — lectio, osajulkaisut ja väitöstyön konteksti</li>
          <li><a href="/opinnaytteet/">Ohjatut opinnäytetyöt</a> — pro gradut ja kandidaatintyöt</li>
        </ul>
      </li>
      <li>
        <a href="/tyoni-yliopistonlehtorina/">Yliopistotyö</a> — kolmen roolin kokonaisuus: opetus, tutkimus, vuorovaikutus
        <ul>
          <li><a href="/palkinnot/">Palkinnot, apurahat ja tunnustukset</a></li>
          <li><a href="/cv/">Ansioluettelo</a> — koulutus, työkokemus, hankkeet</li>
        </ul>
      </li>
      <li>
        <a href="/yhteiskunnallinen-vuorovaikutus/">Yhteiskunnallinen vuorovaikutus</a> — miten tutkimus jatkuu käytännön työhön
        <ul>
          <li><a href="/lausunnot/">Lausunnot ja julkiset puheet</a></li>
          <li><a href="/esitykset/">Esitykset ja avoimet materiaalit</a></li>
          <li><a href="/mediassa/">Mediassa</a></li>
        </ul>
      </li>
      <li><a href="/teemat/">Teemaprofiilit</a> — aiheen mukaan koottu tutkimus, lausunnot, materiaalit ja media</li>
    </ul>
  </aside>
</section>
