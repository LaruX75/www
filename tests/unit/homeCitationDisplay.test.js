const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const nunjucks = require("nunjucks");

const enHomeTemplatePath = path.join(__dirname, "..", "..", "src", "en", "index.njk");
const enHomeTemplateSource = fs.readFileSync(enHomeTemplatePath, "utf8");

function renderCitationKpi(citationCount) {
  return nunjucks.renderString(
    `{% if citationCount %}
<div class="home-overview-kpi">
  <span class="home-overview-kpi-value">{{ citationCount }}</span>
  <span class="home-overview-kpi-label">citations</span>
</div>
{% endif %}`,
    { citationCount }
  ).trim();
}

describe("homepage citation display", () => {
  test("EN homepage no longer contains the stale 600+ fallback", () => {
    assert.equal(enHomeTemplateSource.includes('"600+"'), false);
    assert.equal(enHomeTemplateSource.includes("or \"600+\""), false);
  });

  test("EN homepage uses the actual profileTotalCitations metric", () => {
    assert.match(enHomeTemplateSource, /profileTotalCitations/);
    assert.equal(enHomeTemplateSource.includes("metrics.totalCitations"), false);
  });

  test("citation KPI renders only when a truthful metric exists", () => {
    const html = renderCitationKpi(1022);

    assert.match(html, />1022</);
    assert.match(html, />citations</);
  });

  test("citation KPI is omitted when no usable metric exists", () => {
    assert.equal(renderCitationKpi(null), "");
    assert.equal(renderCitationKpi(undefined), "");
    assert.equal(renderCitationKpi(0), "");
  });
});
