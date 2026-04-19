---
layout: base.njk
templateEngineOverride: njk
title: "Jari Laru, politician"
description: "Positions of trust, goals and priorities in Oulu municipal and regional politics."
permalink: /en/politics/
translationKey: politics_index
lang: en
---
<section class="pol-hero mb-0">
  <div class="container py-5">
    <div class="row g-4 align-items-center">
      <div class="col-lg-8">
        <p class="pol-eyebrow mb-2"><i class="bi bi-building2 me-1"></i>Politics</p>
        <h1 class="display-5 fw-bold mb-3">Jari Laru, politician</h1>
        <p class="mb-3 pol-hero-text">Decision-making in municipal and regional governance is built on cooperation. No individual councillor moves things forward without networks, dialogue, and shared direction.</p>
        <p class="mb-3 pol-hero-text pol-hero-text-strong">I have been involved in civic influence from an early age. My background in residents' association work, municipal politics, and education is reflected in the way I do politics: practically, evidence-based, and with a long-term perspective.</p>
        <p class="mb-4 pol-hero-text">Key priorities: functional everyday life with local services, open governance, and balanced urban development.</p>
        <div class="d-flex flex-wrap gap-2">
          <a href="#council-initiatives" class="btn pol-hero-btn-primary">Council motions</a>
          <a href="/en/election-history/" class="btn pol-hero-btn-outline">Election history</a>
          <a href="/en/affiliations/" class="btn pol-hero-btn-outline">Affiliations</a>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="pol-hero-card">
          <img src="/img/uploads/2020/01/WhatsApp-Image-2019-12-02-at-18.58.31-1.jpeg" alt="Jari Laru in politics" class="pol-hero-img">
          <p class="pol-hero-caption">Municipal and regional politics for cooperation, education, and a functional everyday life.</p>
        </div>
      </div>
    </div>
  </div>
</section>
<div class="pol-hero-divider"></div>

<section class="py-5 mb-0" id="political-themes">
  <div class="container">
    <div class="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-4">
      <div>
        <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-grid-3x3-gap me-1"></i>Themes</p>
        <h2 class="h4 mb-1">Writings by theme</h2>
        <p class="text-muted small mb-0">Blog posts, speeches and opinion pieces on key political themes.</p>
      </div>
      <a href="/en/writings/" class="btn btn-outline-primary btn-sm">All writings</a>
    </div>
    <div class="d-flex flex-wrap gap-2 mb-4">
      <a href="/en/keywords/koulutus/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-mortarboard me-1"></i>Education</a>
      <a href="/en/keywords/koulu/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-building me-1"></i>School network</a>
      <a href="/en/keywords/valtuustoaloite/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-megaphone me-1"></i>Democracy</a>
      <a href="/en/keywords/kaupunki/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-buildings me-1"></i>Urban development</a>
      <a href="/en/keywords/hyvinvointi/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-heart-pulse me-1"></i>Wellbeing</a>
      <a href="/en/keywords/nuoret/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-people me-1"></i>Youth</a>
      <a href="/en/keywords/talous/" class="btn btn-outline-secondary btn-sm"><i class="bi bi-graph-up me-1"></i>Economy</a>
    </div>
    <div class="row g-3" id="politics-theme-cta-grid"></div>
  </div>
</section>

<section class="py-5 mb-0 bg-body-tertiary" id="council-initiatives">
  <div class="container">
    <div class="d-flex align-items-end justify-content-between mb-4">
      <div>
        <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-file-earmark-text me-1"></i>Motions</p>
        <h2 class="h4 mb-1">Council motions</h2>
        <p class="text-muted small mb-0">{{ collections.politics.length }} motions — on open governance, transport, sports and urban development</p>
      </div>
      <a href="/en/writings/#aloitteet" class="btn btn-outline-primary btn-sm">All motions</a>
    </div>

    <div class="ouka-scroller d-flex gap-3 pb-3" style="overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;">
      {% for item in collections.politics | sort(true, false, "date") %}
      <div class="card border-0 shadow-sm flex-shrink-0" style="width:300px; scroll-snap-align:start;">
        <div class="card-body d-flex flex-column h-100" style="min-height:200px;">
          <div class="mb-2">
            <span class="badge bg-primary-subtle text-primary-emphasis">Council motion</span>
            <span class="text-muted small ms-2">{{ item.date | dateFormat }}</span>
          </div>
          <h3 class="h6 fw-semibold mb-auto">{{ item.data.title }}</h3>
          <div class="mt-3 d-flex flex-wrap gap-2">
            <a href="{{ item.url }}" class="btn btn-outline-primary btn-sm">Read motion</a>
            {% if item.data.ouka_response_url %}
            <a href="{{ item.data.ouka_response_url }}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-sm" title="{{ item.data.ouka_response_body }}">
              <i class="bi bi-check2-circle me-1"></i>Response
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
      <i class="bi bi-arrow-right me-1"></i>You can scroll the cards horizontally &middot;
      <a href="http://asiakirjat.ouka.fi/ktwebscr/pk_tek_tweb.htm" target="_blank" rel="noopener noreferrer" class="text-muted">Oulu document system (KTWeb)</a>
    </p>
  </div>
</section>

<section class="py-5 mb-0" id="council-videos">
  <div class="container">
    <div class="d-flex align-items-end justify-content-between mb-4">
      <div>
        <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-camera-video me-1"></i>Videos</p>
        <h2 class="h4 mb-1">Council meetings</h2>
        <p class="text-muted small mb-0">Oulu City Council meetings live and recorded — source: City of Oulu open data</p>
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
            <i class="bi bi-youtube me-1"></i>Watch
          </a>
        </div>
      </div>
      {% endfor %}
    </div>
    <p class="text-muted small mt-2"><i class="bi bi-arrow-right me-1"></i>You can scroll the cards horizontally &middot; Source: <a href="https://api.ouka.fi/v1" target="_blank" rel="noopener noreferrer" class="text-muted">api.ouka.fi</a></p>
    {% else %}
    <p class="text-muted">No council meeting videos available at this time.</p>
    {% endif %}
  </div>
</section>

<section class="py-5 mb-0 bg-body-tertiary" id="politics-blog">
  <div class="container">
    <div class="d-flex align-items-end justify-content-between mb-4">
      <div>
        <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-pen me-1"></i>Blog</p>
        <h2 class="h4 mb-1">Politics blog posts</h2>
        <p class="text-muted small mb-0">Blog posts filtered by political topics (content in Finnish).</p>
      </div>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-8">
            <label for="politics-blog-search" class="form-label small text-muted mb-1">Filter posts</label>
            <input type="search" id="politics-blog-search" class="form-control form-control-sm" placeholder="Search by title or topic..." autocomplete="off">
          </div>
          <div class="col-md-4">
            <label for="politics-blog-year" class="form-label small text-muted mb-1">Year</label>
            <select id="politics-blog-year" class="form-select form-select-sm">
              <option value="">All years</option>
            </select>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 politics-table">
            <thead>
              <tr>
                <th style="width: 140px;">Date</th>
                <th>Title</th>
                <th style="width: 100px;">Link</th>
              </tr>
            </thead>
            <tbody id="politics-blog-tbody"></tbody>
          </table>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <small id="politics-blog-meta" class="text-muted"></small>
          <ul id="politics-blog-pagination" class="pagination pagination-sm mb-0 flex-wrap"></ul>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="py-5 mb-0" id="politics-content">
  <div class="container">
    <div class="d-flex align-items-end justify-content-between mb-4">
      <div>
        <p class="pol-eyebrow pol-eyebrow--dark mb-1"><i class="bi bi-collection me-1"></i>All content</p>
        <h2 class="h4 mb-1">Motions, columns, opinions and speeches</h2>
        <p class="text-muted small mb-0">All political writings and council activity in one list (content in Finnish).</p>
      </div>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-8">
            <label for="politics-content-search" class="form-label small text-muted mb-1">Filter content</label>
            <input type="search" id="politics-content-search" class="form-control form-control-sm" placeholder="Search by title..." autocomplete="off">
          </div>
          <div class="col-md-4">
            <label for="politics-content-type" class="form-label small text-muted mb-1">Content type</label>
            <select id="politics-content-type" class="form-select form-select-sm">
              <option value="">All</option>
              <option value="Motion">Motion</option>
              <option value="Column">Column</option>
              <option value="Opinion">Opinion</option>
              <option value="Speech">Speech</option>
            </select>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 politics-table">
            <thead>
              <tr>
                <th style="width: 140px;">Date</th>
                <th style="width: 140px;">Type</th>
                <th>Title</th>
                <th style="width: 100px;">Link</th>
              </tr>
            </thead>
            <tbody id="politics-content-tbody"></tbody>
          </table>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <small id="politics-content-meta" class="text-muted"></small>
          <ul id="politics-content-pagination" class="pagination pagination-sm mb-0 flex-wrap"></ul>
        </div>
      </div>
    </div>
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
    "contentType": "Motion",
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }}
  }
{% endfor %}
{% for item in collections.pub_kolumni %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Column",
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }}
  }
{% endfor %}
{% for item in collections.pub_mielipide %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Opinion",
    "categories": {{ (item.data.categories or []) | dump | safe }},
    "keywords": {{ (item.data.keywords or []) | dump | safe }}
  }
{% endfor %}
{% for item in collections.pub_puhe %}{{ comma() }}
  {
    "title": {{ (item.data.title or "") | dump | safe }},
    "url": {{ (item.url or "") | dump | safe }},
    "date": {{ (item.date | dateToRfc3339) | dump | safe }},
    "contentType": "Speech",
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

  /* ===== THEME CARDS ===== */
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

  /* ===== TABLES ===== */
  .politics-table th {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    border-bottom-width: 1px;
  }
  .politics-table td { vertical-align: middle; }
  .politics-table .col-date {
    white-space: nowrap;
    color: var(--bs-secondary-color);
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

    // Theme definitions — search terms are in Finnish (matching Finnish content)
    const themeDefinitions = [
      {
        key: 'koulutus',
        title: 'Education and culture',
        description: 'Quality of education, learning environments, teaching, and education policy.',
        terms: ['koulu', 'koulutus', 'opetus', 'oppiminen', 'lukio', 'päiväkoti', 'varhaiskasvatus', 'sivistys']
      },
      {
        key: 'kaupunkikehitys',
        title: 'Urban development and services',
        description: 'Districts, zoning, campuses, service network, and everyday infrastructure.',
        terms: ['kaupunki', 'kaupunginosa', 'palveluverkko', 'kaavo', 'kampus', 'liikenne', 'keskusta', 'alue']
      },
      {
        key: 'demokratia',
        title: 'Democracy and governance',
        description: 'Motions, participation, transparency, and trust in decision-making.',
        terms: ['valtuusto', 'aloite', 'demokratia', 'osallist', 'päätöksenteko', 'hallinto', 'sidonnaisuudet', 'läpinäkyvyys']
      },
      {
        key: 'hyvinvointi',
        title: 'Wellbeing and safety',
        description: "Children's, youth's and families' wellbeing, and safe everyday services.",
        terms: ['hyvinvointi', 'terveys', 'nuor', 'laps', 'perhe', 'turvall', 'kotout', 'sote']
      },
      {
        key: 'talous',
        title: 'Economy and vitality',
        description: 'City finances, investments, employment, and long-term competitiveness.',
        terms: ['talous', 'invest', 'elinvoima', 'yritys', 'työ', 'budjetti', 'kustann', 'verot']
      }
    ];
    const otherTheme = {
      key: 'muu',
      title: 'Other social themes',
      description: 'Other political perspectives that cannot be confined to a single main theme.'
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
      ...politicsBlogData.map((item) => ({ ...item, contentType: 'Blog' })),
      ...contentData.filter((item) => item.contentType === 'Speech' || item.contentType === 'Opinion')
    ];
    const themeGroups = {};
    themedItems.forEach((item) => {
      const theme = resolveTheme(item);
      if (!themeGroups[theme.key]) {
        themeGroups[theme.key] = { ...theme, total: 0, blog: 0, speech: 0, opinion: 0, items: [] };
      }
      const bucket = themeGroups[theme.key];
      bucket.total += 1;
      if (item.contentType === 'Blog') bucket.blog += 1;
      if (item.contentType === 'Speech') bucket.speech += 1;
      if (item.contentType === 'Opinion') bucket.opinion += 1;
      bucket.items.push(item);
    });

    const themeVisuals = {
      koulutus:        { color: '#0d6efd', icon: 'bi-mortarboard-fill' },
      kaupunkikehitys: { color: '#198754', icon: 'bi-buildings-fill' },
      demokratia:      { color: '#dc3545', icon: 'bi-megaphone-fill' },
      hyvinvointi:     { color: '#fd7e14', icon: 'bi-heart-pulse-fill' },
      talous:          { color: '#6f42c1', icon: 'bi-graph-up-arrow' },
      muu:             { color: '#6c757d', icon: 'bi-three-dots' }
    };

    function renderThemeCards() {
      if (!themeGrid) return;
      const groups = Object.values(themeGroups)
        .map((group) => ({ ...group, items: [...group.items].sort((a, b) => new Date(b.date) - new Date(a.date)) }))
        .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, 'en'));

      if (!groups.length) {
        themeGrid.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">No themed content found.</div></div>';
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
                  ${group.blog ? `<span class="badge rounded-pill text-bg-primary-subtle text-primary-emphasis">Blog ${group.blog}</span>` : ''}
                  ${group.speech ? `<span class="badge rounded-pill text-bg-danger-subtle text-danger-emphasis">Speeches ${group.speech}</span>` : ''}
                  ${group.opinion ? `<span class="badge rounded-pill text-bg-info-subtle text-info-emphasis">Opinions ${group.opinion}</span>` : ''}
                </div>
                <div class="theme-links d-grid gap-2 mb-3">${quickLinks || '<span class="small text-muted">No items.</span>'}</div>
                <a href="/en/writings/" class="btn btn-outline-primary btn-sm mt-auto align-self-start">Open writings</a>
              </div>
            </article>
          </div>
        `;
      }).join('');
    }

    renderThemeCards();

    // ---------- Table 1: politics blog ----------
    const blogSearch = document.getElementById('politics-blog-search');
    const blogYear = document.getElementById('politics-blog-year');
    const blogTbody = document.getElementById('politics-blog-tbody');
    const blogMeta = document.getElementById('politics-blog-meta');
    const blogPagination = document.getElementById('politics-blog-pagination');
    const BLOG_PAGE_SIZE = 10;
    let blogPage = 1;

    const blogYears = [...new Set(politicsBlogData.map((d) => new Date(d.date).getFullYear()).filter(Boolean))].sort((a, b) => b - a);
    blogYears.forEach((year) => {
      const opt = document.createElement('option');
      opt.value = String(year);
      opt.textContent = String(year);
      blogYear?.appendChild(opt);
    });

    const fmtDate = (value) => {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB');
    };

    function filteredBlog() {
      const q = (blogSearch?.value || '').toLowerCase().trim();
      const y = blogYear?.value || '';
      return politicsBlogData.filter((item) => {
        const yearOk = !y || String(new Date(item.date).getFullYear()) === y;
        const qOk = !q || item.title.toLowerCase().includes(q);
        return yearOk && qOk;
      });
    }

    function renderBlogPagination(totalPages) {
      if (!blogPagination) return;
      blogPagination.innerHTML = '';
      for (let i = 1; i <= totalPages; i += 1) {
        const li = document.createElement('li');
        li.className = `page-item ${i === blogPage ? 'active' : ''}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'page-link';
        btn.textContent = String(i);
        btn.addEventListener('click', () => { blogPage = i; renderBlog(); });
        li.appendChild(btn);
        blogPagination.appendChild(li);
      }
    }

    function renderBlog() {
      const rows = filteredBlog();
      const totalPages = Math.max(1, Math.ceil(rows.length / BLOG_PAGE_SIZE));
      if (blogPage > totalPages) blogPage = totalPages;
      const start = (blogPage - 1) * BLOG_PAGE_SIZE;
      const slice = rows.slice(start, start + BLOG_PAGE_SIZE);
      if (!blogTbody) return;
      blogTbody.innerHTML = slice.length === 0
        ? '<tr><td colspan="3" class="text-center text-muted py-4">No matching posts found.</td></tr>'
        : slice.map((item) => `
          <tr>
            <td class="col-date">${fmtDate(item.date)}</td>
            <td>${escHtml(item.title)}</td>
            <td><a class="btn btn-outline-primary btn-sm" href="${escHtml(item.url)}">Open</a></td>
          </tr>
        `).join('');
      if (blogMeta) blogMeta.textContent = rows.length === 0 ? '0 results' : `Showing ${start + 1}–${Math.min(start + BLOG_PAGE_SIZE, rows.length)} of ${rows.length}`;
      renderBlogPagination(totalPages);
    }

    blogSearch?.addEventListener('input', () => { blogPage = 1; renderBlog(); });
    blogYear?.addEventListener('change', () => { blogPage = 1; renderBlog(); });
    renderBlog();

    // ---------- Table 2: combined content ----------
    const contentSearch = document.getElementById('politics-content-search');
    const contentType = document.getElementById('politics-content-type');
    const contentTbody = document.getElementById('politics-content-tbody');
    const contentMeta = document.getElementById('politics-content-meta');
    const contentPagination = document.getElementById('politics-content-pagination');
    const CONTENT_PAGE_SIZE = 10;
    let contentPage = 1;

    function filteredContent() {
      const q = (contentSearch?.value || '').toLowerCase().trim();
      const t = contentType?.value || '';
      return contentData.filter((item) => {
        const qOk = !q || item.title.toLowerCase().includes(q);
        const tOk = !t || item.contentType === t;
        return qOk && tOk;
      });
    }

    function renderContentPagination(totalPages) {
      if (!contentPagination) return;
      contentPagination.innerHTML = '';
      for (let i = 1; i <= totalPages; i += 1) {
        const li = document.createElement('li');
        li.className = `page-item ${i === contentPage ? 'active' : ''}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'page-link';
        btn.textContent = String(i);
        btn.addEventListener('click', () => { contentPage = i; renderContent(); });
        li.appendChild(btn);
        contentPagination.appendChild(li);
      }
    }

    function renderContent() {
      const rows = filteredContent();
      const totalPages = Math.max(1, Math.ceil(rows.length / CONTENT_PAGE_SIZE));
      if (contentPage > totalPages) contentPage = totalPages;
      const start = (contentPage - 1) * CONTENT_PAGE_SIZE;
      const slice = rows.slice(start, start + CONTENT_PAGE_SIZE);
      if (!contentTbody) return;
      contentTbody.innerHTML = slice.length === 0
        ? '<tr><td colspan="4" class="text-center text-muted py-4">No matching content found.</td></tr>'
        : slice.map((item) => `
          <tr>
            <td class="col-date">${fmtDate(item.date)}</td>
            <td><span class="badge bg-light text-dark border">${escHtml(item.contentType)}</span></td>
            <td>${escHtml(item.title)}</td>
            <td><a class="btn btn-outline-primary btn-sm" href="${escHtml(item.url)}">Open</a></td>
          </tr>
        `).join('');
      if (contentMeta) contentMeta.textContent = rows.length === 0 ? '0 results' : `Showing ${start + 1}–${Math.min(start + CONTENT_PAGE_SIZE, rows.length)} of ${rows.length}`;
      renderContentPagination(totalPages);
    }

    contentSearch?.addEventListener('input', () => { contentPage = 1; renderContent(); });
    contentType?.addEventListener('change', () => { contentPage = 1; renderContent(); });
    renderContent();

    // ---------- Scrollers: drag + auto-scroll ----------
    const scrollers = Array.from(document.querySelectorAll('.ouka-scroller'));
    if (!scrollers.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const autoScroller = document.querySelector('#council-initiatives .ouka-scroller');
    let pauseAuto = false;
    let rafId = null;
    let lastTs = 0;

    const hasOverflow = (el) => el.scrollWidth - el.clientWidth > 8;

    const stopAuto = () => { if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; } lastTs = 0; };
    const startAuto = () => {
      if (!autoScroller || prefersReducedMotion || rafId) return;
      const speedPxPerMs = 0.045;
      const tick = (ts) => {
        if (!autoScroller || pauseAuto || !hasOverflow(autoScroller)) { lastTs = ts; rafId = window.requestAnimationFrame(tick); return; }
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
      let dragging = false, pending = false, startX = 0, startScroll = 0, capturedId = null;
      const DRAG_THRESHOLD = 6;
      scroller.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        pending = true; startX = e.clientX; startScroll = scroller.scrollLeft; capturedId = e.pointerId;
        if (scroller === autoScroller) pauseAuto = true;
      });
      scroller.addEventListener('pointermove', (e) => {
        if (!pending && !dragging) return;
        const dx = e.clientX - startX;
        if (!dragging && Math.abs(dx) > DRAG_THRESHOLD) {
          dragging = true; scroller.classList.add('is-dragging');
          try { scroller.setPointerCapture(capturedId); } catch (_) {}
        }
        if (dragging) scroller.scrollLeft = startScroll - dx;
      });
      const endDrag = () => {
        pending = false; dragging = false; scroller.classList.remove('is-dragging');
        if (typeof capturedId === 'number') { try { scroller.releasePointerCapture(capturedId); } catch (_) {} capturedId = null; }
        if (scroller === autoScroller) pauseAuto = false;
      };
      scroller.addEventListener('pointerup', endDrag);
      scroller.addEventListener('pointercancel', endDrag);
      scroller.addEventListener('pointerleave', endDrag);
      scroller.addEventListener('wheel', (e) => {
        if (!hasOverflow(scroller)) return;
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        scroller.scrollLeft += e.deltaY; e.preventDefault();
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
      window.addEventListener('resize', () => { hasOverflow(autoScroller) ? (!rafId && startAuto()) : (autoScroller.scrollLeft = 0); }, { passive: true });
      document.addEventListener('visibilitychange', () => { document.hidden ? stopAuto() : startAuto(); });
    }
  })();
</script>
