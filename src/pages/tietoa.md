---
title: "Jari Jukka Laru"
date: 2020-01-17
description: "Jari Laru – poliitikko, yliopistonlehtori, tutkija, yrittäjä, isä ja oululainen. Tämä sivu kertoo, kuka hän on."
layout: base.njk
templateEngineOverride: njk
permalink: /tietoa/
translationKey: about
wp_id: 7
---


<!-- HERO -->
<section class="py-5 bg-body-tertiary border-bottom">
  <div class="container">
    <div class="row align-items-center g-5">
      <div class="col-lg-7">
        <p class="text-uppercase text-muted fw-semibold small mb-2">{{ pageContent.tietoa.hero.eyebrow }}</p>
        <h1 class="display-5 fw-bold mb-3">{{ pageContent.tietoa.hero.name }}</h1>
        <p class="lead mb-4">{{ pageContent.tietoa.hero.lead }}</p>
        <p class="mb-4">{{ pageContent.tietoa.hero.bio }}</p>
        <div class="d-flex flex-wrap gap-2">
          {% for cta in pageContent.tietoa.hero.ctas %}
          <a href="{{ cta.href }}" class="btn {{ cta.style }}">{{ cta.label }}</a>
          {% endfor %}
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm overflow-hidden">
          <img class="card-img-top" src="/img/uploads/2020/01/jari.laru_1397908734_26-e1610053137214.jpg" alt="Jari Laru" loading="eager">
          <div class="card-body py-2 px-3">
            <p class="card-text small text-muted mb-0">{{ pageContent.tietoa.hero.photoCaption }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- KOTIKAUPUNKI -->
<section class="py-5 bg-body-tertiary border-top border-bottom">
  <div class="container">
    <div class="row align-items-center g-5">
      <div class="col-lg-6">
        <h2 class="h3 fw-bold mb-3">{{ pageContent.tietoa.hometown.heading }}</h2>
        {% for p in pageContent.tietoa.hometown.paragraphs %}
        <p class="{% if loop.last %}mb-0{% else %}mb-3{% endif %}">{{ p | safe }}</p>
        {% endfor %}
      </div>
      <div class="col-lg-6">
        <div class="row g-3">
          <div class="col-6">
            <div class="card border-0 shadow-sm">
              <img class="card-img-top jaali-kuva" src="/img/uploads/2021/03/suomi100-200x300.jpg" alt="Jari Laru Suomi 100 -juhlassa Oulussa 2017" loading="lazy">
              <div class="card-body py-2 px-3">
                <p class="card-text small text-muted mb-0">Suomi 100 -juhla Oulussa, 2017</p>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-0 shadow-sm">
              <img class="card-img-top jaali-kuva" src="/img/uploads/2021/03/asyhds-300x225.jpg" alt="Jari Laru asukasyhdistyksen puheenjohtajana Jäälissä" loading="lazy">
              <div class="card-body py-2 px-3">
                <p class="card-text small text-muted mb-0">Asukasyhdistyksen puheenjohtajana Jäälissä</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- VAPAA-AIKA & MATKAT – galleria + lightbox -->
<section class="py-5">
  <div class="container">
    <h2 class="h3 fw-bold mb-2">{{ pageContent.tietoa.leisure.heading }}</h2>
    <p class="text-muted mb-4">{{ pageContent.tietoa.leisure.lead }}</p>

    <!-- Galleria: iso featured + 2×2 thumbnails -->
    <div class="row g-2 mb-5">
      <div class="col-lg-6">
        <a href="/img/uploads/2021/04/IMG_20190629_153127-edited-1024x578.jpg" class="lb-trigger d-block h-100" data-img="/img/uploads/2021/04/IMG_20190629_153127-edited-1024x578.jpg" data-caption="Skopje, Pohjois-Makedonia &ndash; kesä 2019. Oulu&ndash;Skopje&ndash;Oulu, vajaa 10&thinsp;000 km." aria-label="Avaa kuva: Skopje, Pohjois-Makedonia">
          <img src="/img/uploads/2021/04/IMG_20190629_153127-edited-1024x578.jpg" alt="Roadtrip Skopje, Pohjois-Makedonia 2019" class="galleria-featured w-100 h-100" loading="lazy">
        </a>
      </div>
      <div class="col-lg-6">
        <div class="row g-2 h-100">
          <div class="col-6">
            <a href="/img/uploads/2021/05/197296754_51c407c4b1_o.jpg" class="lb-trigger d-block" data-img="/img/uploads/2021/05/197296754_51c407c4b1_o.jpg" data-caption="Perheenisä &ndash; kolmen lapsen isä ja puoliso. Ruuhkavuodet täydessä vauhdissa." aria-label="Avaa kuva: Perheenisä">
              <img src="/img/uploads/2021/05/197296754_51c407c4b1_o.jpg" alt="Perheenisä" class="galleria-thumb w-100" loading="lazy">
            </a>
          </div>
          <div class="col-6">
            <a href="/img/uploads/2021/05/IMG_20210425_113524.jpg" class="lb-trigger d-block" data-img="/img/uploads/2021/05/IMG_20210425_113524.jpg" data-caption="Kulinaristi &ndash; intohimoinen ruoanlaittaja, leipuri ja Suomen juustoseuran jäsen." aria-label="Avaa kuva: Kulinaristi">
              <img src="/img/uploads/2021/05/IMG_20210425_113524.jpg" alt="Ruoanlaittoa – kulinaristi" class="galleria-thumb w-100" loading="lazy">
            </a>
          </div>
          <div class="col-6">
            <a href="/img/uploads/2021/05/IMG_20180714_122145__01-e1619985796461.jpg" class="lb-trigger d-block" data-img="/img/uploads/2021/05/IMG_20180714_122145__01-e1619985796461.jpg" data-caption="Suikkamies &ndash; 1970-luvun talo vaatii töitä. Kaivinkoneen ohjaimista tapettipintaan." aria-label="Avaa kuva: Hartiapankkiremontoija">
              <img src="/img/uploads/2021/05/IMG_20180714_122145__01-e1619985796461.jpg" alt="Hartiapankkiremontoija – suikkamies töissä" class="galleria-thumb w-100" loading="lazy">
            </a>
          </div>
          <div class="col-6">
            <a href="/img/uploads/2021/03/37522991_10156458618453116_4533218945909391360_o-e1615744405294-300x166.jpg" class="lb-trigger d-block" data-img="/img/uploads/2021/03/37522991_10156458618453116_4533218945909391360_o-e1615744405294-300x166.jpg" data-caption="Nizza, Ranska &ndash; Côte d&rsquo;Azurin aurinkoa Välimeren rannalla." aria-label="Avaa kuva: Nizza, Ranska">
              <img src="/img/uploads/2021/03/37522991_10156458618453116_4533218945909391360_o-e1615744405294-300x166.jpg" alt="Lomalla Nizzassa, Ranska" class="galleria-thumb w-100" loading="lazy">
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Automatkareissut-info -->
    <div class="mt-4 p-4 border rounded bg-body-tertiary d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div>
        <span class="fw-bold">{{ pageContent.tietoa.leisure.travelStrip.label }}</span>
        <span class="text-muted ms-2 small">{{ pageContent.tietoa.leisure.travelStrip.destinations }}</span>
      </div>
      <a href="{{ pageContent.tietoa.leisure.travelStrip.cta1.href }}" class="btn btn-primary btn-sm">{{ pageContent.tietoa.leisure.travelStrip.cta1.label }}</a>
    </div>
  </div>
</section>

<!-- LIGHTBOX MODAL -->
<div class="modal fade" id="lightboxModal" tabindex="-1" aria-label="Kuvan suurennos" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content bg-dark border-0">
      <div class="modal-header border-0 pb-0">
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Sulje"></button>
      </div>
      <div class="modal-body text-center p-3 pt-0">
        <img id="lightboxImg" src="" alt="" class="img-fluid rounded" style="max-height:75vh;object-fit:contain;">
        <p id="lightboxCaption" class="text-white-50 small mt-3 mb-0"></p>
      </div>
    </div>
  </div>
</div>

<!-- SOME JA YHTEYS -->
<section class="py-5 bg-body-tertiary border-top">
  <div class="container">
    <h2 class="h3 fw-bold mb-2">{{ pageContent.tietoa.social.heading }}</h2>
    <p class="text-muted mb-4">{{ pageContent.tietoa.social.lead }}</p>
    <div class="row g-3">
      {% for profile in pageContent.tietoa.social.profiles %}
      <div class="col-sm-6 col-lg-3">
        <a href="{{ profile.href }}" target="_blank" rel="noopener noreferrer" class="card border-0 shadow-sm text-decoration-none h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-2
              {%- if profile.platform == 'LinkedIn' %}" style="color:#0a66c2"><i class="bi bi-linkedin"></i>
              {%- elif profile.platform == 'Instagram' %}" style="color:#e1306c"><i class="bi bi-instagram"></i>
              {%- elif profile.platform == 'YouTube' %} text-danger"><i class="bi bi-youtube"></i>
              {%- elif profile.platform == 'Facebook' %}" style="color:#1877f2"><i class="bi bi-facebook"></i>
              {%- elif profile.platform == 'ORCID' %} text-success"><i class="bi bi-person-badge-fill"></i>
              {%- elif profile.platform == 'Research.fi' %} text-primary"><i class="bi bi-building"></i>
              {%- elif profile.platform == 'ResearchGate' %} text-success"><i class="bi bi-share-fill"></i>
              {%- elif profile.platform == 'Google Scholar' %} text-warning"><i class="bi bi-search"></i>
              {%- else %}"><i class="bi bi-globe"></i>
              {%- endif %}
            </div>
            <h3 class="h6 fw-bold">{{ profile.platform }}</h3>
            <p class="small text-muted mb-0">{{ profile.desc }}</p>
          </div>
        </a>
      </div>
      {% endfor %}
    </div>
    <div class="mt-5 text-center">
      <p class="text-muted mb-3">{{ pageContent.tietoa.social.contactText }}</p>
      <a href="{{ pageContent.tietoa.social.contactCta.href }}" class="btn btn-primary"><i class="bi bi-envelope-fill me-2"></i>{{ pageContent.tietoa.social.contactCta.label }}</a>
    </div>
  </div>
</section>

<style>
/* Rooli-kuvat – tasainen korkeus */
.rooli-kuva {
  height: 200px;
  object-fit: cover;
  object-position: center top;
}

/* Jääli-kuvat – tasainen korkeus */
.jaali-kuva {
  height: 180px;
  object-fit: cover;
  object-position: center top;
}

/* Galleria: iso featured-kuva */
.galleria-featured {
  object-fit: cover;
  height: 340px;
  border-radius: 0.375rem;
  display: block;
  transition: opacity 0.2s;
}
.lb-trigger:hover .galleria-featured,
.lb-trigger:hover .galleria-thumb {
  opacity: 0.88;
}

/* Galleria: pienet thumbit */
.galleria-thumb {
  object-fit: cover;
  height: 164px;
  border-radius: 0.375rem;
  display: block;
  transition: opacity 0.2s;
}


</style>

<script>
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('lightboxModal');
    var img = document.getElementById('lightboxImg');
    var cap = document.getElementById('lightboxCaption');
    var canUseBootstrapModal = Boolean(window.bootstrap && window.bootstrap.Modal && modal);
    var bsModal = canUseBootstrapModal ? new window.bootstrap.Modal(modal) : null;

    document.querySelectorAll('.lb-trigger').forEach(function (el) {
      var imgUrl = el.dataset.img || el.getAttribute('href');
      if (imgUrl) {
        el.setAttribute('href', imgUrl);
      }

      el.addEventListener('click', function (e) {
        if (!canUseBootstrapModal || !img || !cap || !imgUrl) {
          return;
        }
        e.preventDefault();
        img.src = imgUrl;
        img.alt = (el.querySelector('img') || {}).alt || '';
        cap.innerHTML = el.dataset.caption || '';
        bsModal.show();
      });
    });
  });
})();
</script>
