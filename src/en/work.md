---
layout: hub.njk
title: University Lecturer Work
subtitle: Technology-enhanced learning · AI education · University of Oulu
description: My work as a university lecturer — teaching, research, and societal engagement at the Faculty of Education, University of Oulu.
permalink: /en/work/
translationKey: university_lecturer_work
lang: en
hubKey: work
eyebrow: University of Oulu
eyebrowIcon: bi bi-mortarboard
templateEngineOverride: njk
heroButtons:
  - href: "#what-i-do"
    label: "What I do"
    style: "btn btn-primary btn-sm"
  - href: "#hub-nav"
    label: "All content areas"
    style: "btn btn-sm hub-btn-outline"
---

{%- set peerReviewedCount = 0 -%}
{%- for pub in researchfi -%}
  {%- if pub.peerReviewed -%}{%- set peerReviewedCount = peerReviewedCount + 1 -%}{%- endif -%}
{%- endfor -%}

{# ── STAT CARDS ───────────────────────────────────────────────────────────── #}
<section class="py-5 bg-body-tertiary border-bottom" aria-label="Key figures">
  <div class="site-shell">
    <div class="row g-3 text-center">
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3 h-100">
          <div class="display-5 fw-bold text-primary mb-1">{{ researchfi.length }}</div>
          <div class="small text-muted">publications</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3 h-100">
          <div class="display-5 fw-bold text-success mb-1">{{ peerReviewedCount }}</div>
          <div class="small text-muted">peer-reviewed</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3 h-100">
          <div class="display-5 fw-bold text-warning mb-1">{{ theses.stats.totalGradut }}</div>
          <div class="small text-muted">master's supervised</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3 h-100">
          <div class="display-5 fw-bold text-info mb-1">{{ theses.stats.totalKandit }}</div>
          <div class="small text-muted">bachelor's supervised</div>
        </div>
      </div>
    </div>
  </div>
</section>

{# ── WHAT I DO ─────────────────────────────────────────────────────────────── #}
<section class="py-5" id="what-i-do" aria-labelledby="what-i-do-heading">
  <div class="site-shell">
    <p class="text-uppercase text-muted fw-semibold small mb-1"><i class="bi bi-person-workspace me-1"></i>Role content</p>
    <h2 class="h4 mb-4" id="what-i-do-heading">What I do in practice</h2>
    <div class="row g-4">

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="mb-2 fs-3" style="color:#0d6efd"><i class="bi bi-easel2-fill"></i></div>
            <h3 class="h6 fw-bold mb-2">Teaching</h3>
            <p class="small text-muted mb-0">I teach technology-enhanced learning and AI education in teacher education programmes. My courses focus on digital pedagogy, computational thinking, and STEAM integration — hands-on, without requiring a programming background.</p>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="mb-2 fs-3" style="color:#198754"><i class="bi bi-search"></i></div>
            <h3 class="h6 fw-bold mb-2">Research</h3>
            <p class="small text-muted mb-0">I research teachers' and student teachers' AI literacy, and the pedagogical use of technology in primary and higher education. I participate in the interdisciplinary Generation AI project, bringing together education, law, and computer science.</p>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="mb-2 fs-3" style="color:#fd7e14"><i class="bi bi-megaphone-fill"></i></div>
            <h3 class="h6 fw-bold mb-2">Societal engagement</h3>
            <p class="small text-muted mb-0">I serve as a dissemination expert in the Generation AI project — bringing research findings into classrooms, teacher education, and policy decision-making. I also train teachers across Finland in AI education methods.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

{# ── GENERATION AI ─────────────────────────────────────────────────────────── #}
<section class="py-5 bg-body-tertiary border-top border-bottom" id="generation-ai" aria-labelledby="gen-ai-heading">
  <div class="site-shell">
    <p class="text-uppercase text-muted fw-semibold small mb-1"><i class="bi bi-lightning-charge me-1"></i>Current project</p>
    <h2 class="h4 mb-1" id="gen-ai-heading">Generation AI — strategic research project</h2>
    <p class="text-muted small mb-4">Funded by the Academy of Finland's Strategic Research Council (SRC), SHIELD programme</p>
    <div class="row g-4 align-items-start">

      <div class="col-lg-7">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <p><a href="https://www.generation-ai-stn.fi" target="_blank" rel="noopener noreferrer"><strong>Generation AI</strong></a> is a Finnish research project teaching children and young people to understand artificial intelligence — its possibilities, risks, and societal significance. The project produces free applications, teaching materials, and scientific research for pre-primary and basic education.</p>
            <p class="mb-0">The project responds to three societal challenges: AI systems eroding people's sense of security, algorithmic environments undermining trust in authorities and science, and rapidly deepening digital inequality.</p>
          </div>
        </div>
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h3 class="h6 mb-3"><i class="bi bi-globe2 me-2 text-primary"></i>Project websites</h3>
            <div class="row g-3">
              <div class="col-sm-6">
                <div class="border rounded p-3 h-100">
                  <div class="fw-semibold small mb-1"><i class="bi bi-journal-richtext me-1 text-primary"></i>Research site</div>
                  <p class="small text-muted mb-2">Scientific information, SHIELD programme, research publications, and consortium.</p>
                  <a href="https://www.generation-ai-stn.fi" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-box-arrow-up-right me-1"></i>generation-ai-stn.fi
                  </a>
                </div>
              </div>
              <div class="col-sm-6">
                <div class="border rounded p-3 h-100">
                  <div class="fw-semibold small mb-1"><i class="bi bi-app-indicator me-1 text-success"></i>Applications & materials</div>
                  <p class="small text-muted mb-2">Six free applications and ready-made teaching units for classroom use.</p>
                  <a href="https://www.gen-ai.fi" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-sm">
                    <i class="bi bi-box-arrow-up-right me-1"></i>gen-ai.fi
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h3 class="h6 mb-3">My role in the project</h3>
            <ul class="list-unstyled small mb-0">
              <li class="mb-2"><i class="bi bi-broadcast me-2 text-primary"></i>Dissemination expert — translating research into practice</li>
              <li class="mb-2"><i class="bi bi-mortarboard me-2 text-success"></i>Link between teacher education and the project</li>
              <li class="mb-2"><i class="bi bi-search me-2 text-warning"></i>Research focus: teachers' AI literacy</li>
              <li class="mb-0"><i class="bi bi-globe me-2 text-danger"></i>Website development and maintenance</li>
            </ul>
          </div>
        </div>
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h3 class="h6 mb-3">Project details</h3>
            <ul class="list-unstyled small mb-0">
              <li class="mb-2"><i class="bi bi-award me-2 text-primary"></i>Funder: Academy of Finland / SRC</li>
              <li class="mb-2"><i class="bi bi-shield-check me-2 text-success"></i>Programme: SHIELD</li>
              <li class="mb-2"><i class="bi bi-people me-2 text-warning"></i>Interdisciplinary consortium: education, law, computer science</li>
              <li class="mb-0"><i class="bi bi-geo-alt me-2 text-muted"></i>Coordinator: University of Eastern Finland (UEF)</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
