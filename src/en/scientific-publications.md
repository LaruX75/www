---
layout: base.njk
title: Scientific Publications
permalink: /en/scientific-publications/
translationKey: scientific_publications_index
lang: en
---
<section class="py-4 bg-light border-bottom">
  <div class="container">
    <h1 class="display-6 fw-bold mb-2">Scientific Publications</h1>
    <p class="text-muted mb-0">Overview of peer-reviewed and scientific publication outputs.</p>
  </div>
</section>

<section class="py-4">
  <div class="container">
    <div class="table-responsive shadow-sm rounded">
      <table class="table table-hover mb-0">
        <thead>
          <tr>
            <th>Year</th>
            <th>Title</th>
            <th>Publicatio
</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {% for pub in collections.pub_tieteellinen %}
          <tr>
            <td>{{ pub.date | dateYear }}</td>
            <td>{{ pub.data.title }}</td>
            <td>{{ pub.data.publication or "" }}</td>
            <td>{% set u = pub.data.url or pub.data.source_url or pub.url %}<a href="{{ u }}" target="_blank" rel="noopener noreferrer">Ope
</a></td>
          </tr>
          {% else %}
          <tr><td colspan="4" class="text-muted text-center py-4">No entries.</td></tr>
          {% endfor %}
        </tbody>
      </table>
    </div>
  </div>
</section>
