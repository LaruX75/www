---
layout: base.njk
title: Publications and Analytics
permalink: /en/publications/
translationKey: publications_index
lang: en
---
<section class="bg-light">
  <div class="container py-4">
    <h1 class="display-6 fw-bold mb-2">Publications and Analytics</h1>
    <p class="text-muted mb-0">Publication data synced from <a href="https://research.fi/en/results/person/0000-0003-0347-0182" target="_blank" rel="noopener noreferrer">Research.fi profile</a>.</p>
  </div>
</section>

<section class="py-4">
  <div class="container">
    <div class="list-group shadow-sm">
      {% for pub in researchfi %}
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h2 class="h6 mb-1">{{ pub.title }}</h2>
            <p class="text-muted small mb-0">{{ pub.authors }}</p>
            {% if pub.journal %}<p class="small mb-0"><em>{{ pub.journal }}</em></p>{% endif %}
          </div>
          <div class="text-end">
            {% if pub.year %}<div class="small text-muted mb-2">{{ pub.year }}</div>{% endif %}
            {% if pub.url %}<a class="btn btn-sm btn-outline-primary" href="{{ pub.url }}" target="_blank" rel="noopener noreferrer">Ope
</a>{% endif %}
          </div>
        </div>
      </div>
      {% else %}
      <div class="alert alert-warning">No publications available.</div>
      {% endfor %}
    </div>
  </div>
</section>
