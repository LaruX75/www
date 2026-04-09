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
  <div class="container py-5">
    <div class="row g-4 align-items-center">
      <div class="col-lg-8">
        <p class="pol-eyebrow mb-2"><i class="bi bi-building2 me-1"></i>Politiikka</p>
        <h1 class="display-5 fw-bold mb-3">Jari Laru, poliitikko</h1>
        <p class="mb-3 pol-hero-text">Kaupungin ja aluehallinnon päätöksenteko perustuu yhteistyöhön. Yksittäinen valtuutettu ei saa asioita eteenpäin ilman verkostoja, dialogia ja yhteistä suuntaa.</p>
        <p class="mb-3 pol-hero-text pol-hero-text-strong">Olen ollut mukana yhteiskunnallisessa vaikuttamisessa nuoresta asti. Taustani asukasyhdistystoiminnassa, kunnallispolitiikassa ja koulutuksen kentällä näkyy tavassani tehdä politiikkaa: käytännöllisesti, tietoon nojaten ja pitkäjänteisesti.</p>
        <p class="mb-4 pol-hero-text">Painoalueina toimiva arki lähipalveluineen, hallinnon avoimuus ja tasapainoinen kaupunkikehitys.</p>
        <div class="d-flex flex-wrap gap-2">
          <a href="#valtuustoaloitteet" class="btn pol-hero-btn-primary">Valtuustoaloitteet</a>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="pol-hero-card">
          <img src="/img/uploads/2020/01/WhatsApp-Image-2019-12-02-at-18.58.31-1.jpeg" alt="Jari Laru politiikassa" class="pol-hero-img">
          <p class="pol-hero-caption">Kunta- ja aluepolitiikkaa yhteistyön, sivistyksen ja toimivan arjen puolesta.</p>
        </div>
      </div>
    </div>
  </div>
</section>
<div class="pol-hero-divider"></div>

<section class="py-5 mb-0" id="poliittiset-teemat">
  <div class="container">
    <div class="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-4">
      <div>
        <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-grid-3x3-gap me-1"></i>Teemat</p>
        <h2 class="h4 mb-1">Kirjoituksia aiheittain</h2>
        <p class="text-muted small mb-0">Blogit, puheenvuorot ja mielipidekirjoitukset politiikan keskeisistä teemoista.</p>
      </div>
      <a href="/kynasta/" class="btn btn-outline-primary btn-sm">Kaikki kirjoitukset</a>
    </div>
    <div class="d-flex flex-wrap gap-2">
      <a href="/avainsanat/koulutus/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-mortarboard me-1"></i>Koulutus</a>
      <a href="/avainsanat/koulu/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-building me-1"></i>Kouluverkko</a>
      <a href="/avainsanat/valtuustoaloite/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-megaphone me-1"></i>Demokratia</a>
      <a href="/avainsanat/kaupunki/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-buildings me-1"></i>Kaupunkikehitys</a>
      <a href="/avainsanat/hyvinvointi/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-heart-pulse me-1"></i>Hyvinvointi</a>
      <a href="/avainsanat/nuoret/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-people me-1"></i>Nuoret</a>
      <a href="/avainsanat/talous/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-graph-up me-1"></i>Talous</a>
    </div>
  </div>
</section>

<section class="py-5 mb-0 bg-body-tertiary" id="valtuustoaloitteet">
  <div class="container">
    <div class="d-flex align-items-end justify-content-between mb-4">
      <div>
        <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-file-earmark-text me-1"></i>Aloitteet</p>
        <h2 class="h4 mb-1">Valtuustoaloitteet</h2>
        <p class="text-muted small mb-0">{{ collections.politics.length }} aloitetta — avoimuudesta, liikenteestä, urheilusta ja kaupunkikehityksestä</p>
      </div>
      <a href="/kynasta/#aloitteet" class="btn btn-outline-primary btn-sm">Kaikki aloitteet</a>
    </div>

    <div class="ouka-scroller d-flex gap-3 pb-3" style="overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;">
      {% for item in collections.politics | sort(true, false, "date") %}
      <div class="card border-0 shadow-sm flex-shrink-0" style="width:300px; scroll-snap-align:start;">
        <div class="card-body d-flex flex-column h-100" style="min-height:200px;">
          <div class="mb-2">
            <span class="badge bg-primary-subtle text-primary-emphasis">Valtuustoaloite</span>
            <span class="text-muted small ms-2">{{ item.date | dateFormat }}</span>
          </div>
          <h3 class="h6 fw-semibold mb-auto">{{ item.data.title }}</h3>
          <div class="mt-3 d-flex flex-wrap gap-2">
            <a href="{{ item.url }}" class="btn btn-outline-primary btn-sm">Lue aloite</a>
            {% if item.data.ouka_response_url %}
            <a href="{{ item.data.ouka_response_url }}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-sm" title="{{ item.data.ouka_response_body }}">
              <i class="bi bi-check2-circle me-1"></i>Vastaus
            </a>
            {% endif %}
          </div>
          {% if item.data.ouka_response_body %}
          <p class="text-muted mt-2 mb-0" style="font-size:0.75rem;"><i class="bi bi-building me-1"></i>{{ item.data.ouka_response_body }}</p>
          {% endif %}
        </div>
      </div>
      {% endfor %}
    </div>
    <p class="text-muted small mt-2">
      <i class="bi bi-arrow-right me-1"></i>Voit vierittää kortteja vaakatasossa &middot;
      <a href="http://asiakirjat.ouka.fi/ktwebscr/pk_tek_tweb.htm" target="_blank" rel="noopener noreferrer" class="text-muted">Oulun asiakirjajärjestelmä (KTWeb)</a>
    </p>
  </div>
</section>

<section class="py-5 mb-0" id="kokousvideot">
  <div class="container">
    <div class="d-flex align-items-end justify-content-between mb-4">
      <div>
        <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-camera-video me-1"></i>Videot</p>
        <h2 class="h4 mb-1">Valtuuston kokoukset</h2>
        <p class="text-muted small mb-0">Oulun kaupunginvaltuuston kokoukset suorana ja tallenteina — lähde: Oulun kaupungin avoin data</p>
      </div>
      <a href="https://www.ouka.fi/oulu/kaupunginvaltuusto/kokoukset" target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary btn-sm">ouka.fi</a>
    </div>

    {% if oukaCouncilVideos.length > 0 %}
    <div class="ouka-scroller d-flex gap-3 pb-3" style="overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;">
      {% for video in oukaCouncilVideos %}
      <div class="card border-0 shadow-sm flex-shrink-0" style="width:280px; scroll-snap-align:start;">
        {% if video.thumbnail %}
        <a href="{{ video.url }}" target="_blank" rel="noopener noreferrer">
          <img src="{{ video.thumbnail }}" alt="{{ video.title }}" class="card-img-top" style="aspect-ratio:16/9; object-fit:cover;" loading="lazy">
        </a>
        {% endif %}
        <div class="card-body">
          <p class="small text-muted mb-1">{{ video.dateStr }}</p>
          <h3 class="h6 fw-semibold mb-2" style="font-size:0.85rem; line-height:1.4;">{{ video.title }}</h3>
          <a href="{{ video.url }}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-danger btn-sm">
            <i class="bi bi-youtube me-1"></i>Katso
          </a>
        </div>
      </div>
      {% endfor %}
    </div>
    <p class="text-muted small mt-2"><i class="bi bi-arrow-right me-1"></i>Voit vierittää kortteja vaakatasossa &middot; Lähde: <a href="https://api.ouka.fi/v1" target="_blank" rel="noopener noreferrer" class="text-muted">api.ouka.fi</a></p>
    {% else %}
    <p class="text-muted">Kokousvideoita ei juuri nyt saatavilla.</p>
    {% endif %}
  </div>
</section>

<script id="politics-blog-data" type="application/json">
[
{% for post in collections.blog %}
  {
    "title": {{ (post.data.title or "") | dump | safe }},
    "url": {{ (post.url or "") | dump | safe }},
    "date": {{ (post.date | dateToRfc3339) | dump | safe }},
    "categories": {{ (post.data.categories or []) | dump | safe }},
    "keywords": {{ (post.data.keywords or []) | dump | safe }}
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
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }}
  }
{% endfor %}
{% for item in collections.pub_kolumni %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Kolumni",
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }}
  }
{% endfor %}
{% for item in collections.pub_mielipide %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Mielipide",
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }}
  }
{% endfor %}
{% for item in collections.pub_puhe %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Puheenvuoro",
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }}
  }
{% endfor %}
]
</script>

<style>
  /* ===== HERO ===== */
  .pol-hero {
    background: linear-gradient(135deg, #eaf3ff 0%, #dcecff 100%);
    color: #12304f;
    position: relative;
    overflow: hidden;
  }
  .pol-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -55deg,
      transparent,
      transparent 48px,
      rgba(13, 110, 253, 0.08) 48px,
      rgba(13, 110, 253, 0.08) 96px
    );
    pointer-events: none;
  }
  .pol-hero-divider {
    height: 4px;
    background: linear-gradient(90deg, #0d6efd 0%, #4dabf7 50%, #0d6efd 100%);
  }
  .pol-eyebrow {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: rgba(18, 48, 79, 0.72);
  }
  .pol-eyebrow--dark {
    color: var(--bs-secondary-color);
  }
  .pol-hero-card {
    border-radius: 0.5rem;
    overflow: hidden;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(18, 48, 79, 0.15);
    backdrop-filter: blur(4px);
  }
  .pol-hero-img {
    width: 100%;
    display: block;
    object-fit: cover;
    aspect-ratio: 4/3;
  }
  .pol-hero-caption {
    font-size: 0.8rem;
    color: rgba(18, 48, 79, 0.8);
    padding: 0.6rem 0.8rem;
    margin: 0;
  }
  .pol-hero-text { color: rgba(18, 48, 79, 0.82); }
  .pol-hero-text-strong { color: rgba(18, 48, 79, 0.92); }
  .pol-hero-btn-primary,
  .pol-hero-btn-outline {
    font-weight: 600;
    border-width: 1px;
  }
  .pol-hero-btn-primary {
    background-color: #0d6efd;
    color: #fff;
    border-color: #0d6efd;
  }
  .pol-hero-btn-primary:hover {
    background-color: #0b5ed7;
    border-color: #0b5ed7;
    color: #fff;
  }
  .pol-hero-btn-outline {
    background-color: transparent;
    color: #0d6efd;
    border-color: #0d6efd;
  }
  .pol-hero-btn-outline:hover {
    background-color: #0d6efd;
    color: #fff;
    border-color: #0d6efd;
  }
  [data-bs-theme="dark"] .pol-hero {
    background: #0e1c2f;
    color: #fff;
  }
  [data-bs-theme="dark"] .pol-hero::after {
    background: repeating-linear-gradient(
      -55deg,
      transparent,
      transparent 48px,
      rgba(255, 255, 255, 0.018) 48px,
      rgba(255, 255, 255, 0.018) 96px
    );
  }
  [data-bs-theme="dark"] .pol-eyebrow { color: rgba(255,255,255,0.5); }
  [data-bs-theme="dark"] .pol-hero-text { color: rgba(255,255,255,0.75); }
  [data-bs-theme="dark"] .pol-hero-text-strong { color: rgba(255,255,255,0.85); }
  [data-bs-theme="dark"] .pol-hero-card {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
  }
  [data-bs-theme="dark"] .pol-hero-caption { color: rgba(255,255,255,0.55); }
  [data-bs-theme="dark"] .pol-hero-btn-primary {
    background-color: #f8f9fa;
    color: #1c2e4a;
    border-color: #f8f9fa;
  }
  [data-bs-theme="dark"] .pol-hero-btn-primary:hover {
    background-color: #ffffff;
    color: #1c2e4a;
    border-color: #ffffff;
  }
  [data-bs-theme="dark"] .pol-hero-btn-outline {
    color: #f8f9fa;
    border-color: #f8f9fa;
  }
  [data-bs-theme="dark"] .pol-hero-btn-outline:hover {
    background-color: rgba(248, 249, 250, 0.1);
    color: #f8f9fa;
    border-color: #f8f9fa;
  }

  /* ===== ROLE CARDS ===== */
  .pol-role-card {
    border-top: 3px solid var(--bs-primary) !important;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .pol-role-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 .5rem 1.2rem rgba(0,0,0,.13) !important;
  }
  .pol-role-icon {
    font-size: 1.6rem;
    color: var(--bs-primary);
    margin-bottom: 0.5rem;
    display: block;
  }

  /* ===== GOAL CARDS ===== */
  .pol-goal-card {
    border-left: 4px solid var(--bs-primary) !important;
    transition: transform 0.15s ease;
  }
  .pol-goal-card:hover { transform: translateY(-2px); }
  .pol-goal-num {
    font-size: 2.8rem;
    font-weight: 900;
    line-height: 1;
    color: transparent; /* teksti piilotettu, numero tulee ::before-pseudoelementistä */
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    margin-top: 0.15rem;
    position: relative;
  }
  .pol-goal-num::before {
    content: attr(data-num);
    color: var(--bs-primary);
    opacity: 0.15;
    position: absolute;
    inset: 0;
  }
  .pol-goal-icon {
    font-size: 1.2rem;
    color: var(--bs-primary);
  }

  /* ===== THEME CARDS (JS-rendered) ===== */
  .politics-theme-card {
    border: 0;
    border-left: 4px solid var(--pol-theme-color, var(--bs-primary)) !important;
    box-shadow: var(--bs-box-shadow-sm);
    height: 100%;
    transition: transform 0.15s ease;
  }
  .politics-theme-card:hover { transform: translateY(-2px); }
  .politics-theme-card .theme-links a {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    text-decoration: none;
  }
  .pol-theme-icon {
    font-size: 1.2rem;
    margin-bottom: 0.4rem;
    display: block;
  }

  /* ===== HORIZONTAL SCROLLERS ===== */
  .ouka-scroller {
    cursor: grab;
    scrollbar-width: thin;
    touch-action: pan-x;
  }
  .ouka-scroller.is-dragging {
    cursor: grabbing;
    user-select: none;
  }
</style>

<script>
  (() => {
    const politicsTerms = [
      'politiikka', 'kuntavaalit', 'aluevaalit', 'valtuusto', 'kaupunginvaltuusto',
      'kaupunginhallitus', 'lautakunta', 'aloite', 'sidonnaisuudet', 'vaalikone'
    ];

    const blogRaw = JSON.parse(document.getElementById('politics-blog-data')?.textContent || '[]');
    const politicsBlogData = blogRaw
      .filter((item) => {
        const bag = [
          item.title || '',
          ...(item.categories || []),
          ...(item.keywords || [])
        ].join(' ').toLowerCase();
        return politicsTerms.some((term) => bag.includes(term));
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const contentData = JSON.parse(document.getElementById('politics-content-data')?.textContent || '[]')
      .filter((item) => item && item.title && item.url)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const themeGrid = document.getElementById('politics-theme-cta-grid');

    const escHtml = (value) => String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

    const themeDefinitions = [
      {
        key: 'koulutus',
        title: 'Koulutus ja sivistys',
        description: 'Koulutuksen laatu, oppimisympäristöt, opettajuus ja sivistyspolitiikka.',
        hint: 'koulu',
        terms: ['koulu', 'koulutus', 'opetus', 'oppiminen', 'lukio', 'päiväkoti', 'varhaiskasvatus', 'sivistys']
      },
      {
        key: 'kaupunkikehitys',
        title: 'Kaupunkikehitys ja palveluverkko',
        description: 'Kaupunginosat, kaavoitus, kampukset, palveluverkko ja arjen infrastruktuuri.',
        hint: 'palveluverkko',
        terms: ['kaupunki', 'kaupunginosa', 'palveluverkko', 'kaavo', 'kampus', 'liikenne', 'keskusta', 'alue']
      },
      {
        key: 'demokratia',
        title: 'Demokratia ja päätöksenteko',
        description: 'Aloitteet, osallistuminen, hallinnon avoimuus ja luottamus päätöksentekoon.',
        hint: 'valtuusto',
        terms: ['valtuusto', 'aloite', 'demokratia', 'osallist', 'päätöksenteko', 'hallinto', 'sidonnaisuudet', 'läpinäkyvyys']
      },
      {
        key: 'hyvinvointi',
        title: 'Hyvinvointi ja turvallinen arki',
        description: 'Lasten, nuorten ja perheiden hyvinvointi sekä turvalliset palvelut.',
        hint: 'hyvinvointi',
        terms: ['hyvinvointi', 'terveys', 'nuor', 'laps', 'perhe', 'turvall', 'kotout', 'sote']
      },
      {
        key: 'talous',
        title: 'Talous ja elinvoima',
        description: 'Kaupungin talous, investoinnit, työ ja pitkän aikavälin kilpailukyky.',
        hint: 'talous',
        terms: ['talous', 'invest', 'elinvoima', 'yritys', 'työ', 'budjetti', 'kustann', 'verot']
      }
    ];
    const otherTheme = {
      key: 'muu',
      title: 'Muut yhteiskunnalliset teemat',
      description: 'Muut politiikkaan liittyvät näkökulmat, joita ei voi rajata yhteen pääteemaan.',
      hint: 'politiikka'
    };

    const createBag = (item) => [
      item.title || '',
      ...(item.categories || []),
      ...(item.keywords || [])
    ].join(' ').toLowerCase();

    const resolveTheme = (item) => {
      const bag = createBag(item);
      for (const theme of themeDefinitions) {
        if (theme.terms.some((term) => bag.includes(term))) return theme;
      }
      return otherTheme;
    };

    const themedItems = [
      ...politicsBlogData.map((item) => ({ ...item, contentType: 'Blogi' })),
      ...contentData
        .filter((item) => item.contentType === 'Puheenvuoro' || item.contentType === 'Mielipide')
    ];
    const themeGroups = {};
    themedItems.forEach((item) => {
      const theme = resolveTheme(item);
      if (!themeGroups[theme.key]) {
        themeGroups[theme.key] = {
          ...theme,
          total: 0,
          blogi: 0,
          puheenvuoro: 0,
          mielipide: 0,
          items: []
        };
      }
      const bucket = themeGroups[theme.key];
      bucket.total += 1;
      if (item.contentType === 'Blogi') bucket.blogi += 1;
      if (item.contentType === 'Puheenvuoro') bucket.puheenvuoro += 1;
      if (item.contentType === 'Mielipide') bucket.mielipide += 1;
      bucket.items.push(item);
    });

    const themeVisuals = {
      koulutus:       { color: '#0d6efd', icon: 'bi-mortarboard-fill' },
      kaupunkikehitys:{ color: '#198754', icon: 'bi-buildings-fill' },
      demokratia:     { color: '#dc3545', icon: 'bi-megaphone-fill' },
      hyvinvointi:    { color: '#fd7e14', icon: 'bi-heart-pulse-fill' },
      talous:         { color: '#6f42c1', icon: 'bi-graph-up-arrow' },
      muu:            { color: '#6c757d', icon: 'bi-three-dots' }
    };

    function renderThemeCards() {
      if (!themeGrid) return;
      const groups = Object.values(themeGroups)
        .map((group) => ({
          ...group,
          items: [...group.items].sort((a, b) => new Date(b.date) - new Date(a.date))
        }))
        .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, 'fi'));

      if (!groups.length) {
        themeGrid.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Teemoiteltuja sisältöjä ei löytynyt.</div></div>';
        return;
      }

      themeGrid.innerHTML = groups.map((group) => {
        const visual = themeVisuals[group.key] || themeVisuals.muu;
        const quickLinks = group.items.slice(0, 3).map((item) => `
          <a href="${escHtml(item.url)}" class="small">
            <span class="badge text-bg-light border">${escHtml(item.contentType)}</span>
            <span>${escHtml(item.title)}</span>
          </a>
        `).join('');
        return `
          <div class="col-md-6 col-xl-4">
            <article class="card politics-theme-card" style="--pol-theme-color:${visual.color}">
              <div class="card-body d-flex flex-column">
                <i class="bi ${visual.icon} pol-theme-icon" style="color:${visual.color}"></i>
                <h3 class="h6 mb-2">${escHtml(group.title)}</h3>
                <p class="text-muted small mb-3">${escHtml(group.description)}</p>
                <div class="d-flex flex-wrap gap-2 mb-3">
                  ${group.blogi ? `<span class="badge rounded-pill text-bg-primary-subtle text-primary-emphasis">Blogi ${group.blogi}</span>` : ''}
                  ${group.puheenvuoro ? `<span class="badge rounded-pill text-bg-danger-subtle text-danger-emphasis">Puheenvuorot ${group.puheenvuoro}</span>` : ''}
                  ${group.mielipide ? `<span class="badge rounded-pill text-bg-info-subtle text-info-emphasis">Mielipiteet ${group.mielipide}</span>` : ''}
                </div>
                <div class="theme-links d-grid gap-2 mb-3">${quickLinks || '<span class="small text-muted">Ei nostoja.</span>'}</div>
                <a href="/kynasta/" class="btn btn-outline-primary btn-sm mt-auto align-self-start">Avaa Kynästä</a>
              </div>
            </article>
          </div>
        `;
      }).join('');
    }

    renderThemeCards();
  })();

  (() => {
    const scrollers = Array.from(document.querySelectorAll('.ouka-scroller'));
    if (!scrollers.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const autoScroller = document.querySelector('#valtuustoaloitteet .ouka-scroller');
    let pauseAuto = false;
    let rafId = null;
    let lastTs = 0;

    const hasOverflow = (el) => el.scrollWidth - el.clientWidth > 8;

    const stopAuto = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTs = 0;
    };

    const startAuto = () => {
      if (!autoScroller || prefersReducedMotion || rafId) return;
      const speedPxPerMs = 0.045;
      const tick = (ts) => {
        if (!autoScroller || pauseAuto || !hasOverflow(autoScroller)) {
          lastTs = ts;
          rafId = window.requestAnimationFrame(tick);
          return;
        }
        if (!lastTs) lastTs = ts;
        const delta = ts - lastTs;
        lastTs = ts;
        const maxScroll = autoScroller.scrollWidth - autoScroller.clientWidth;
        const next = autoScroller.scrollLeft + (delta * speedPxPerMs);
        autoScroller.scrollLeft = next >= maxScroll - 1 ? 0 : next;
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    };

    scrollers.forEach((scroller) => {
      let dragging = false;
      let pending = false;
      let startX = 0;
      let startScroll = 0;
      let capturedId = null;
      const DRAG_THRESHOLD = 6;

      scroller.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        pending = true;
        startX = event.clientX;
        startScroll = scroller.scrollLeft;
        capturedId = event.pointerId;
        if (scroller === autoScroller) pauseAuto = true;
      });

      scroller.addEventListener('pointermove', (event) => {
        if (!pending && !dragging) return;
        const deltaX = event.clientX - startX;
        if (!dragging && Math.abs(deltaX) > DRAG_THRESHOLD) {
          dragging = true;
          scroller.classList.add('is-dragging');
          try { scroller.setPointerCapture(capturedId); } catch (_) { /* ignore */ }
        }
        if (dragging) {
          scroller.scrollLeft = startScroll - deltaX;
        }
      });

      const endDrag = (event) => {
        if (!pending && !dragging) return;
        pending = false;
        dragging = false;
        scroller.classList.remove('is-dragging');
        if (typeof capturedId === 'number') {
          try { scroller.releasePointerCapture(capturedId); } catch (_) { /* ignore */ }
          capturedId = null;
        }
        if (scroller === autoScroller) pauseAuto = false;
      };

      scroller.addEventListener('pointerup', endDrag);
      scroller.addEventListener('pointercancel', endDrag);
      scroller.addEventListener('pointerleave', endDrag);

      scroller.addEventListener('wheel', (event) => {
        if (!hasOverflow(scroller)) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        scroller.scrollLeft += event.deltaY;
        event.preventDefault();
      }, { passive: false });

      if (scroller === autoScroller) {
        scroller.addEventListener('mouseenter', () => { pauseAuto = true; });
        scroller.addEventListener('mouseleave', () => { pauseAuto = false; });
        scroller.addEventListener('focusin', () => { pauseAuto = true; });
        scroller.addEventListener('focusout', () => { pauseAuto = false; });
      }
    });

    if (autoScroller && !prefersReducedMotion) {
      startAuto();
      window.addEventListener('resize', () => {
        if (hasOverflow(autoScroller)) {
          if (!rafId) startAuto();
        } else {
          autoScroller.scrollLeft = 0;
        }
      }, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          stopAuto();
        } else {
          startAuto();
        }
      });
    }
  })();
</script>
