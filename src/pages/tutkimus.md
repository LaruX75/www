---
title: "Tutkimus"
permalink: /tutkimus/
layout: base.njk
lang: fi
translationKey: research
description: "Jari Larun tutkimustyö: yhteisöllinen oppiminen, mobiiliteknologia ja tekoälylukutaito. Tieteelliset julkaisut, ohjatut opinnäytetyöt, tutkimushankkeet ja -profiilit."
templateEngineOverride: njk
---

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

<!-- HERO -->
<section class="py-5 bg-body-tertiary border-bottom">
  <div class="container">
    <div class="row align-items-center g-4">
      <div class="col-lg-8">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Tutkimus</p>
        <h1 class="display-6 fw-bold mb-3">Tutkimustyöni</h1>
        <p class="lead mb-3">Tutkin teknologian roolia oppimisessa ja opetuksessa – yhteisöllisistä skripteistä mobiililaitteisiin ja opettajien tekoälylukutaitoon. Toimin yliopistonlehtorina Oulun yliopiston Kasvatustieteiden tiedekunnassa.</p>
        <div class="d-flex flex-wrap gap-2">
          <a href="/julkaisut/" class="btn btn-read-more btn-sm rounded-pill px-3">Tieteelliset julkaisut</a>
          <a href="/opinnaytteet/" class="btn btn-read-more btn-sm rounded-pill px-3">Ohjatut opinnäytetyöt</a>
          <a href="https://orcid.org/0000-0003-0347-0182" class="btn btn-read-more btn-sm rounded-pill px-3" target="_blank" rel="noopener noreferrer">ORCID-profiili</a>
          <a href="https://research.fi/en/results/person/0000-0003-0347-0182" class="btn btn-read-more btn-sm rounded-pill px-3" target="_blank" rel="noopener noreferrer">Research.fi</a>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="row g-3 text-center">
          <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-primary">{{ researchfi.length }}</div>
                <div class="small text-muted">julkaisua</div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-info">{{ peerReviewedCount }}</div>
                <div class="small text-muted">vertaisarvioitua</div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-success">{{ theses.stats.totalGradut }}</div>
                <div class="small text-muted">gradua ohjattu</div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-warning">{{ theses.stats.totalKandit }}</div>
                <div class="small text-muted">kandia ohjattu</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- TUTKIMUSALUEET -->
<section class="py-5">
  <div class="container">
    <h2 class="h3 fw-bold mb-4">Tutkimusalueet</h2>
    <div class="row g-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="mb-3 text-primary fs-2"><i class="bi bi-people-fill"></i></div>
            <h3 class="h5 fw-bold">Yhteisöllinen oppiminen</h3>
            <p class="text-muted mb-0">Tutkin, miten yhteisöllisiä skriptejä voidaan käyttää ohjaamaan oppijoiden työskentelyä ja tiedonrakentelua. Väitöskirjani (2012) kohdentui erityisesti mobiililaitteiden tukemaan yhteisölliseen oppimiseen.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="mb-3 text-success fs-2"><i class="bi bi-phone-fill"></i></div>
            <h3 class="h5 fw-bold">Mobiiliteknologia opetuksessa</h3>
            <p class="text-muted mb-0">Olen tutkinut langattomia päätelaitteita ja mobiililaitteita asiantuntijuuden jakamisen ja yhteisöllisen tiedonrakentelun välineinä aina vuodesta 2003 alkaen – ajalta ennen älypuhelinaikaa.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="mb-3 text-warning fs-2"><i class="bi bi-robot"></i></div>
            <h3 class="h5 fw-bold">Tekoälylukutaito</h3>
            <p class="text-muted mb-0">Nykyinen tutkimukseni kohdentuu opettajien ja opettajaopiskelijoiden tekoälylukutaitoihin sekä lasten tekoäly- ja turvallisuuskasvatukseen osana Generation AI -hanketta.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- NYKYINEN HANKE: GENERATION AI -->
<section class="py-5 bg-body-tertiary border-top border-bottom">
  <div class="container">
    <div class="row align-items-center g-5">
      <div class="col-lg-7">
        <span class="badge bg-success mb-3">Käynnissä</span>
        <h2 class="h3 fw-bold mb-3">Generation AI</h2>
        <p class="lead mb-3">Strategisen tutkimuksen neuvoston (STN) rahoittama monitieteinen hanke, joka kehittää esi- ja perusopetuksen tekoäly- ja turvallisuuskasvatuksen perustaa Suomessa.</p>
        <p class="mb-3">Toimin hankkeessa vuorovaikutusasiantuntijana: jaan tutkimustietoa opettajille, kouluille ja laajemmalle yleisölle. Tutkin samalla opettajien ja opettajaopiskelijoiden tekoälylukutaitoja ja niiden kehittymistä.</p>
        <div class="d-flex flex-wrap gap-2">
          <a href="https://www.generation-ai-stn.fi" class="btn btn-success" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right me-1"></i>Hankkeen sivusto</a>
          <a href="/tyoni-yliopistonlehtorina/" class="btn btn-outline-secondary">Lisää yliopistotyöstä</a>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <h4 class="h6 text-uppercase text-muted fw-bold mb-3">Hanketiedot</h4>
            <dl class="row mb-0 small">
              <dt class="col-5 text-muted">Rahoittaja</dt>
              <dd class="col-7">Strategisen tutkimuksen neuvosto (STN)</dd>
              <dt class="col-5 text-muted">Rooli</dt>
              <dd class="col-7">Vuorovaikutusasiantuntija, tutkija</dd>
              <dt class="col-5 text-muted">Tutkimusaihe</dt>
              <dd class="col-7">Opettajien tekoälylukutaito, tekoälykasvatus</dd>
              <dt class="col-5 text-muted">Kohderyhmä</dt>
              <dd class="col-7">Esi- ja perusopetus, opettajat</dd>
              <dt class="col-5 text-muted">Organisaatio</dt>
              <dd class="col-7">Oulun yliopisto, Kasvatustieteiden tiedekunta</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- JULKAISUT WIDGET -->
<section class="py-5">
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h3 fw-bold mb-0">Tieteelliset julkaisut</h2>
      <a href="/julkaisut/" class="btn btn-outline-primary btn-sm">Katso kaikki &rarr;</a>
    </div>
    <p class="text-muted mb-4">Julkaisut haetaan automaattisesti <a href="https://research.fi/en/results/person/0000-0003-0347-0182" target="_blank" rel="noopener noreferrer">Research.fi-profiilista</a>. Viittausdata: OpenAlex + Semantic Scholar.</p>
    {% if researchfi.length %}
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="card text-center border-primary h-100">
          <div class="card-body py-3">
            <div class="h2 fw-bold text-primary mb-1">{{ countA }}</div>
            <div class="small text-muted">Lehtiartikkelit (A)</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center border-info h-100">
          <div class="card-body py-3">
            <div class="h2 fw-bold text-info mb-1">{{ countConf }}</div>
            <div class="small text-muted">Konferenssit</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center border-warning h-100">
          <div class="card-body py-3">
            <div class="h2 fw-bold text-warning mb-1">{{ countC }}</div>
            <div class="small text-muted">Kirjat &amp; väitöskirjat</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center border-secondary h-100">
          <div class="card-body py-3">
            <div class="h2 fw-bold text-secondary mb-1">{{ countOther }}</div>
            <div class="small text-muted">Muut</div>
          </div>
        </div>
      </div>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-transparent py-3">
        <h3 class="h6 text-uppercase text-muted fw-bold mb-0"><i class="bi bi-journal-text me-2 text-primary"></i>Viimeisimmät julkaisut</h3>
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-hover align-middle mb-0">
          <thead>
            <tr>
              <th style="width:60px" class="text-center">Vuosi</th>
              <th style="width:70px">Tyyppi</th>
              <th>Otsikko &amp; julkaisu</th>
              <th class="text-center" style="width:60px">Linkki</th>
            </tr>
          </thead>
          <tbody>
            {% for pub in researchfi | sort(true, false, "year") | slice(0, 8) %}
            <tr>
              <td class="text-center font-monospace small fw-bold text-info">{{ pub.year or '&mdash;' }}</td>
              <td><span class="badge bg-secondary" title="{{ pub.typeFi }}">{{ pub.typeShort }}</span></td>
              <td>
                <span class="fw-medium d-block mb-1">{{ pub.title }}</span>
                {% if pub.journal %}<span class="text-muted small fst-italic">{{ pub.journal }}</span>{% endif %}
                {% if pub.doi and semanticscholar.metrics.doiCitations[pub.doi | lower] %}<span class="badge text-bg-warning rounded-pill ms-1" title="Viittaukset"><i class="bi bi-quote me-1"></i>{{ semanticscholar.metrics.doiCitations[pub.doi | lower] }}</span>{% endif %}
              </td>
              <td class="text-center">
                {% if pub.url %}<a href="{{ pub.url }}" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill" rel="noopener noreferrer" title="Avaa julkaisu uuteen välilehteen" aria-label="Avaa julkaisu uuteen välilehteen"><i class="bi bi-box-arrow-up-right"></i></a>{% endif %}
              </td>
            </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
      <div class="card-footer bg-transparent text-center py-3">
        <a href="/julkaisut/" class="btn btn-primary btn-sm">Katso kaikki {{ researchfi.length }} julkaisua &rarr;</a>
      </div>
    </div>
    {% else %}
    <div class="alert alert-info">Julkaisudata ladataan Research.fi-profiilista build-vaiheessa.</div>
    {% endif %}
  </div>
</section>

<!-- OPINNÄYTTEET WIDGET -->
<section class="py-5 bg-body-tertiary border-top border-bottom">
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h3 fw-bold mb-0">Ohjatut opinnäytetyöt</h2>
      <a href="/opinnaytteet/" class="btn btn-outline-primary btn-sm">Katso kaikki &rarr;</a>
    </div>
    <p class="text-muted mb-4">Ohjaamani opinnäytetyöt haetaan automaattisesti <a href="https://oulurepo.oulu.fi" target="_blank" rel="noopener noreferrer">OuluREPO-julkaisuarkistosta</a>{% if theses.stats.firstYear %} ({{ theses.stats.firstYear }}&ndash;{{ theses.stats.lastYear }}){% endif %}.</p>
    <div class="row g-4 mb-4">
      <div class="col-md-4">
        <div class="card text-center border-primary h-100">
          <div class="card-body py-4">
            <div class="display-4 fw-bold text-primary">{{ theses.stats.totalGradut }}</div>
            <div class="text-muted mt-1">Pro gradu -tutkielmaa</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center border-info h-100">
          <div class="card-body py-4">
            <div class="display-4 fw-bold text-info">{{ theses.stats.totalKandit }}</div>
            <div class="text-muted mt-1">Kandidaatintyötä</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center h-100">
          <div class="card-body py-4">
            <div class="display-4 fw-bold">{{ theses.stats.total }}</div>
            <div class="text-muted mt-1">Yhteensä</div>
          </div>
        </div>
      </div>
    </div>
    {% if theses.stats.byYear %}
    <div class="d-flex gap-1 flex-wrap mb-4">{% for item in theses.stats.byYear %}<span class="badge bg-secondary">{{ item[0] }}: {{ item[1] }}</span>{% endfor %}</div>
    {% endif %}
    {% if theses.gradut.length %}
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-transparent py-3">
        <h3 class="h6 text-uppercase text-muted fw-bold mb-0"><i class="bi bi-mortarboard-fill me-2 text-primary"></i>Viimeisimmät gradut</h3>
      </div>
      <div class="list-group list-group-flush">
        {% for thesis in theses.gradut | slice(0, 5) %}
        <div class="list-group-item px-4 py-3">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <span class="fw-medium">{% if thesis.link %}<a href="{{ thesis.link }}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">{{ thesis.title }}</a>{% else %}{{ thesis.title }}{% endif %}</span>
              {% if thesis.authors.length %}<div class="small text-muted mt-1">{{ thesis.authors | join(", ") }}</div>{% endif %}
            </div>
            <span class="badge bg-light text-dark border flex-shrink-0">{{ thesis.year }}</span>
          </div>
        </div>
        {% endfor %}
      </div>
      <div class="card-footer bg-transparent text-center py-3">
        <a href="/opinnaytteet/" class="btn btn-outline-primary btn-sm">Katso kaikki {{ theses.stats.total }} opinnäytetyötä &rarr;</a>
      </div>
    </div>
    {% endif %}
  </div>
</section>

<!-- OMA VÄITÖSKIRJA -->
<section class="py-5">
  <div class="container">
    <h2 class="h3 fw-bold mb-4">Omat opinnäytetyöt</h2>
    <div class="row g-4">
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <span class="badge bg-primary mb-3">Väitöskirja 2012</span>
            <h3 class="h5 fw-bold mb-2">Scaffolding learning activities with collaborative scripts and mobile devices</h3>
            <p class="text-muted mb-2">Oulun yliopisto, kasvatustiede. Väitös 20.11.2012.</p>
            <p class="mb-3">Väitöskirja tutki, miten yhteisöllisiä skriptejä voidaan hyödyntää mobiililaitteiden tukemissa oppimisympäristöissä. Työ yhdistää CSCL-tutkimuksen (Computer-Supported Collaborative Learning) ja mobiiliteknologian.</p>
            <div class="d-flex flex-wrap gap-2">
              <a href="http://jultika.oulu.fi/Record/isbn978-951-42-9942-4" class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener noreferrer">Jultika-arkisto</a>
              <a href="/tyoni-yliopistonlehtorina/" class="btn btn-sm btn-outline-secondary">Lisää yliopistosta</a>
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

<!-- TUTKIJAHISTORIA – horisontaalinen aikajana, vanhin ensin -->
<section class="py-5 bg-body-tertiary border-top border-bottom">
  <div class="container">
    <h2 class="h3 fw-bold mb-2">Tutkijahistoria</h2>
    <p class="text-muted mb-4">Keskeisimmät tutkimushankkeet ja -kaudet uran varrelta &ndash; vanhimmasta uusimpaan.</p>
    <p class="small text-muted mb-3">Vihje: aikajana vierii sivusuunnassa mobiilissa ja pienillä näytöillä.</p>
  </div>
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

      <div class="tutkijahistoria-card card border-success shadow-sm flex-shrink-0" style="border-width: 2px !important;">
        <div class="card-body p-4">
          <span class="badge bg-success mb-3">2024&ndash;</span>
          <h3 class="h5 fw-bold mb-1">Generation AI</h3>
          <p class="text-muted small mb-3">Strategisen tutkimuksen neuvosto (STN) &mdash; Oulun yliopisto</p>
          <p class="small mb-0">Tekoälylukutaitojen ja tekoälykasvatuksen tutkimus esi- ja perusopetuksessa. Vuorovaikutusasiantuntijana tutkimustiedon välittäminen opettajille ja kouluille.</p>
        </div>
        <div class="card-footer bg-transparent border-0 px-4 pb-3 pt-0">
          <a href="https://www.generation-ai-stn.fi" class="btn btn-sm btn-success" target="_blank" rel="noopener noreferrer">Hankkeen sivusto</a>
        </div>
      </div>

    </div>
  </div>
  <style>
  .tutkijahistoria-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }
  .tutkijahistoria-scroll::-webkit-scrollbar {
    height: 6px;
  }
  .tutkijahistoria-scroll::-webkit-scrollbar-track {
    background: var(--bs-border-color);
    border-radius: 3px;
  }
  .tutkijahistoria-scroll::-webkit-scrollbar-thumb {
    background: var(--bs-secondary-color);
    border-radius: 3px;
  }
  .tutkijahistoria-card {
    width: 280px;
    min-height: 200px;
  }
  @media (max-width: 576px) {
    .tutkijahistoria-card { width: 240px; }
  }
  </style>
</section>

<!-- APURAHAT JA PALKINNOT -->
<section class="py-5">
  <div class="container">
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
</section>

<!-- PROFIILIT -->
<section class="py-5 bg-body-tertiary border-top">
  <div class="container">
    <h2 class="h3 fw-bold mb-2">Tutkijaprofiilit</h2>
    <p class="text-muted mb-4">Julkaisulistani ja tutkimustietoni useissa kansainvälisissä ja kotimaisissa palveluissa:</p>
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
</section>
