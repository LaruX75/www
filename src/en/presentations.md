---
layout: base.njk
title: Presentations
description: Jari Laru presentations — Canva, Google Slides and SlideShare
permalink: /en/presentations/
translationKey: presentations_index
lang: en
---


<div class="container py-5">
  <header class="mb-5 text-center">
    <h1 class="display-4 fw-bold mb-3">Esitykset</h1>
    <p class="lead text-muted">Valikoima diaesityksiäni eri palveluista.</p>
  </header>

  {# ===================== CANVA ===================== #}
  <section class="mb-5" aria-labelledby="canva-heading">
    <h2 id="canva-heading" class="section-title mb-4">
      <i class="bi bi-star-fill text-warning me-2" style="font-size: 1rem;"></i>Canva-esitykset
    </h2>
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      {% for p in collections.presentations %}
      <div class="col">
        <div class="card h-100 border-0 shadow-sm hover-shadow transition">
          <div class="position-relative overflow-hidden">
            {% if p.data.thumbnail %}
              <img src="{{ p.data.thumbnail }}"
                   class="card-img-top transition-transform"
                   alt="{{ p.data.title }}"
                   style="height: 220px; object-fit: cover; object-position: top;">
              <div class="card-img-overlay d-flex align-items-center justify-content-center opacity-0 bg-dark bg-opacity-50 transition">
                <a href="{{ p.data.url }}" target="_blank" class="btn btn-light btn-sm stretched-link">Katso esitys</a>
              </div>
            {% else %}
              <div class="d-flex align-items-center justify-content-center text-muted bg-placeholder" style="height: 220px;">
                <div class="text-center">
                  <i class="bi bi-file-earmark-slides fs-1 mb-2 d-block"></i>
                  <small>Ei esikatselukuvaa</small>
                </div>
              </div>
            {% endif %}
          </div>
          <div class="card-body">
            <h3 class="h5 card-title mb-1">
              {% if p.data.url %}
                <a href="{{ p.data.url }}" target="_blank" class="text-decoration-none">{{ p.data.title }}</a>
              {% else %}
                {{ p.data.title }}
              {% endif %}
            </h3>
            {% if p.date %}
            <small class="text-muted">{{ p.date | dateFormat }}</small>
            {% endif %}
          </div>
          <div class="card-footer bg-transparent border-0 pt-0 pb-3 px-3">
            {% if p.data.url %}
              <a href="{{ p.data.url }}" target="_blank" class="btn btn-primary btn-sm rounded-pill px-3">
                Katso esitys <i class="bi bi-arrow-up-right"></i>
              </a>
            {% else %}
              <span class="text-muted" style="font-size:0.85rem;"><i class="bi bi-link-45deg"></i> Ei linkkiä</span>
            {% endif %}
            <span class="badge text-bg-secondary rounded-pill ms-2">Canva</span>
          </div>
        </div>
      </div>
      {% else %}
      <p class="text-muted">Ei esityksiä.</p>
      {% endfor %}
    </div>
  </section>

  {# ================ GOOGLE SLIDES ================ #}
  <section class="mb-5" aria-labelledby="google-heading">
    <h2 id="google-heading" class="section-title mb-4">
      <i class="bi bi-file-earmark-slides me-2" style="font-size: 1rem;"></i>Google Slides -esitykset
    </h2>
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      {% for p in googleslides %}
      <div class="col">
        <div class="card h-100 border-0 shadow-sm hover-shadow transition">
          <div class="position-relative overflow-hidden">
            {% if p.thumbnail %}
              <img src="{{ p.thumbnail }}"
                   class="card-img-top transition-transform"
                   alt="{{ p.title }}"
                   style="height: 220px; object-fit: cover; object-position: top;">
              {% if p.url %}
              <div class="card-img-overlay d-flex align-items-center justify-content-center opacity-0 bg-dark bg-opacity-50 transition">
                <a href="{{ p.url }}" target="_blank" class="btn btn-light btn-sm stretched-link">Katso esitys</a>
              </div>
              {% endif %}
            {% else %}
              <div class="d-flex align-items-center justify-content-center text-muted bg-placeholder" style="height: 220px;">
                <div class="text-center">
                  <i class="bi bi-file-earmark-slides fs-1 mb-2 d-block"></i>
                  <small>Ei esikatselukuvaa</small>
                </div>
              </div>
            {% endif %}
          </div>
          <div class="card-body">
            <h3 class="h5 card-title mb-1">
              {% if p.url %}
                <a href="{{ p.url }}" target="_blank" class="text-decoration-none">{{ p.title }}</a>
              {% else %}
                {{ p.title }}
              {% endif %}
            </h3>
            {% if p.date %}
            <small class="text-muted">{{ p.date }}</small>
            {% endif %}
          </div>
          <div class="card-footer bg-transparent border-0 pt-0 pb-3 px-3">
            {% if p.url %}
              <a href="{{ p.url }}" target="_blank" class="btn btn-primary btn-sm rounded-pill px-3">
                Katso esitys <i class="bi bi-arrow-up-right"></i>
              </a>
            {% else %}
              <span class="text-muted" style="font-size:0.85rem;"><i class="bi bi-link-45deg"></i> Ei linkkiä</span>
            {% endif %}
            <span class="badge text-bg-secondary rounded-pill ms-2">Google Slides</span>
          </div>
        </div>
      </div>
      {% endfor %}
    </div>
  </section>

  {# ================= SLIDESHARE ================== #}
  <section class="mb-5" aria-labelledby="slideshare-heading">
    <h2 id="slideshare-heading" class="section-title mb-4">
      <i class="bi bi-collection-play me-2" style="font-size: 1rem;"></i>SlideShare-esitykset
    </h2>
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      {% for p in slideshare %}
      <div class="col">
        <div class="card h-100 border-0 shadow-sm hover-shadow transition">
          <div class="position-relative overflow-hidden">
            {% if p.thumbnail %}
              <img src="{{ p.thumbnail }}"
                   class="card-img-top transition-transform"
                   alt="{{ p.title }}"
                   style="height: 220px; object-fit: cover; object-position: top;">
              <div class="card-img-overlay d-flex align-items-center justify-content-center opacity-0 bg-dark bg-opacity-50 transition">
                <a href="{{ p.url }}" target="_blank" class="btn btn-light btn-sm stretched-link">Katso SlideSharessa</a>
              </div>
            {% else %}
              <div class="d-flex align-items-center justify-content-center text-muted bg-placeholder" style="height: 220px;">
                <div class="text-center">
                  <i class="bi bi-file-earmark-slides fs-1 mb-2 d-block"></i>
                  <small>Ei esikatselukuvaa</small>
                </div>
              </div>
            {% endif %}
          </div>
          <div class="card-body">
            <h3 class="h5 card-title mb-1">
              {% if p.url %}
                <a href="{{ p.url }}" target="_blank" class="text-decoration-none">{{ p.title }}</a>
              {% else %}
                {{ p.title }}
              {% endif %}
            </h3>
          </div>
          <div class="card-footer bg-transparent border-0 pt-0 pb-3 px-3">
            {% if p.url %}
              <a href="{{ p.url }}" target="_blank" class="btn btn-primary btn-sm rounded-pill px-3">
                Katso SlideSharessa <i class="bi bi-arrow-up-right"></i>
              </a>
            {% else %}
              <span class="text-muted" style="font-size:0.85rem;"><i class="bi bi-link-45deg"></i> Ei linkkiä</span>
            {% endif %}
            <span class="badge text-bg-secondary rounded-pill ms-2">SlideShare</span>
          </div>
        </div>
      </div>
      {% endfor %}
    </div>

    <div class="mt-4 text-center">
      <a href="https://www.slideshare.net/larux" target="_blank" class="btn btn-primary px-4 py-2">
        Katso kaikki SlideSharessa (124+) <i class="bi bi-arrow-up-right"></i>
      </a>
    </div>
  </section>

</div>

<style>
/* Section headings */
.section-title {
  font-family: 'Bree Serif', serif;
  font-size: 1.5rem;
  font-weight: 700;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--bs-border-color);
}
[data-bs-theme="dark"] .section-title {
  color: #ffffff;
  border-bottom-color: rgba(255,255,255,0.15);
}

/* Placeholder when no thumbnail */
.bg-placeholder {
  background-color: #dee2e6;
  border-radius: 0;
}
[data-bs-theme="dark"] .bg-placeholder {
  background-color: #2e3f59;
}

/* Card title links — white in dark mode */
.card .card-title a {
  color: var(--bs-body-color) !important;
}
[data-bs-theme="dark"] .card .card-title a {
  color: #ffffff !important;
}
[data-bs-theme="dark"] .card .card-title a:hover {
  color: rgba(255,255,255,0.8) !important;
}

.hover-shadow:hover {
  transform: translateY(-5px);
  box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
}
.hover-shadow:hover .card-img-top {
  transform: scale(1.05);
}
.transition-transform {
  transition: transform 0.5s ease-in-out;
}
.transition {
  transition: all 0.3s ease-in-out;
}
.card-img-overlay:hover {
  opacity: 1!important;
}
</style>
