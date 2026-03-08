---
title: "Research"
permalink: /en/research/
layout: base.njk
lang: en
translationKey: research
description: "Jari Laru's research profile: collaborative learning, mobile learning technology, and AI literacy in education."
templateEngineOverride: njk
---

{%- set peerReviewedCount = 0 -%}
{%- for pub in researchfi -%}
  {%- if pub.peerReviewed -%}{%- set peerReviewedCount = peerReviewedCount + 1 -%}{%- endif -%}
{%- endfor -%}

<section class="py-5 bg-body-tertiary border-bottom">
  <div class="container">
    <div class="row align-items-center g-4">
      <div class="col-lg-8">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Research</p>
        <h1 class="display-6 fw-bold mb-3">My research work</h1>
        <p class="lead mb-3">I study how technology supports learning and teaching: from collaborative scripts and mobile devices to teachers' AI literacy.</p>
        <div class="d-flex flex-wrap gap-2">
          <a href="/en/publications/" class="btn btn-read-more btn-sm rounded-pill px-3">Scientific publications</a>
          <a href="/en/theses/" class="btn btn-read-more btn-sm rounded-pill px-3">Supervised theses</a>
          <a href="https://orcid.org/0000-0003-0347-0182" class="btn btn-read-more btn-sm rounded-pill px-3" target="_blank" rel="noopener noreferrer">ORCID</a>
          <a href="https://research.fi/en/results/person/0000-0003-0347-0182" class="btn btn-read-more btn-sm rounded-pill px-3" target="_blank" rel="noopener noreferrer">Research.fi</a>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="row g-3 text-center">
          <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-primary">{{ researchfi.length }}</div>
                <div class="small text-muted">publications</div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-info">{{ peerReviewedCount }}</div>
                <div class="small text-muted">peer-reviewed</div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-success">{{ theses.stats.totalGradut }}</div>
                <div class="small text-muted">master's theses supervised</div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="display-5 fw-bold text-warning">{{ theses.stats.totalKandit }}</div>
                <div class="small text-muted">bachelor's theses supervised</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="py-5">
  <div class="container">
    <h2 class="h3 fw-bold mb-4">Research themes</h2>
    <div class="row g-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="mb-3 text-primary fs-2"><i class="bi bi-people-fill"></i></div>
            <h3 class="h5 fw-bold">Collaborative learning</h3>
            <p class="text-muted mb-0">How collaborative scripts can guide shared inquiry and support knowledge construction in authentic learning settings.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="mb-3 text-success fs-2"><i class="bi bi-phone-fill"></i></div>
            <h3 class="h5 fw-bold">Mobile learning technology</h3>
            <p class="text-muted mb-0">Long-term work on mobile and wireless technologies in education, including research before the smartphone era.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="mb-3 text-warning fs-2"><i class="bi bi-robot"></i></div>
            <h3 class="h5 fw-bold">AI literacy</h3>
            <p class="text-muted mb-0">Current focus on teachers' and student teachers' AI literacy, and AI safety education for children through the Generation AI project.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
