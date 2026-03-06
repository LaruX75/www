---
layout: base.njk
title: Presentations
description: Talks and slide decks across Canva, Google Slides, and SlideShare
permalink: /en/presentations/
translationKey: presentations_index
lang: en
---
<div class="container py-5">
  <header class="mb-4 text-center">
    <h1 class="display-5 fw-bold mb-2">Presentations</h1>
    <p class="text-muted">A selection of slide decks and talks.</p>
  </header>

  <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
    {% for p in collections.presentations %}
    <div class="col">
      <div class="card h-100 border-0 shadow-sm">
        {% if p.data.thumbnail %}<img src="{{ p.data.thumbnail }}" class="card-img-top" alt="{{ p.data.title }}" style="height:220px;object-fit:cover;">{% endif %}
        <div class="card-body">
          <h2 class="h6 mb-1">{{ p.data.title }}</h2>
          {% if p.date %}<p class="small text-muted mb-0">{{ p.date | dateFormat }}</p>{% endif %}
        </div>
        <div class="card-footer bg-transparent border-0">
          <a class="btn btn-sm btn-outline-primary" href="{{ p.data.url }}" target="_blank" rel="noopener noreferrer">Open presentatio
</a>
        </div>
      </div>
    </div>
    {% else %}
    <p class="text-muted">No presentation entries.</p>
    {% endfor %}
  </div>
</div>
