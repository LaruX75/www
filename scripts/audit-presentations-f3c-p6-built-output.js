const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.join(__dirname, "..");
const SITE_ROOT = path.join(ROOT, "_site");

const PAGE_PATHS = [
  {
    label: "FI",
    htmlPath: path.join(SITE_ROOT, "esitykset", "index.html"),
    expectedLocale: "fi"
  },
  {
    label: "EN",
    htmlPath: path.join(SITE_ROOT, "en", "presentations", "index.html"),
    expectedLocale: "en"
  }
];

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(SITE_ROOT, relPath), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}

function auditPage({ label, htmlPath, expectedLocale }) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const $ = cheerio.load(html);
  const archiveRoot = $('[data-presentation-find-explore]');

  assert(archiveRoot.length === 1, `${label}: shared Find & Explore root missing`);
  assert(archiveRoot.attr("data-locale") === expectedLocale, `${label}: unexpected archive locale`);

  const localScripts = $('script[src]').map((_, el) => $(el).attr("src")).get();
  [
    "/js/pe-list-render.js",
    "/js/content-presets.js",
    "/js/content-engine.js",
    "/js/presentations-page.js"
  ].forEach((src) => {
    assert(localScripts.includes(src), `${label}: missing script ${src}`);
  });

  assert(archiveRoot.find('[data-presentation-control="search"]').length === 1, `${label}: free-text search missing`);
  assert(archiveRoot.find('[data-presentation-control="year"]').length === 1, `${label}: year filter missing`);
  assert(archiveRoot.find('[data-presentation-control="topic"]').length === 1, `${label}: topic filter missing`);
  assert(archiveRoot.find('article.presentation-archive-card').length >= 1, `${label}: SSR archive cards missing`);
  assert(archiveRoot.find('[data-presentation-pagination]').length === 1, `${label}: pagination mount missing`);

  assert(!html.includes("profile:kouluttaja"), `${label}: deferred role filter still present`);
  assert(!html.includes("presentation-course-filter"), `${label}: legacy course filter still present`);
  assert(!html.includes('data-presentation-filter='), `${label}: legacy archive filter bindings still present`);
  assert(!html.includes("const canonicalItems ="), `${label}: old inline canonical JSON runtime still embedded`);
  assert(!html.includes("/data/presentations-page.json"), `${label}: page still hardcodes canonical JSON hydration`);

  assert(/\/presentations\//.test(html), `${label}: local presentation links missing from built output`);
  assert(/table-body-aoe|table-body-canva|table-body-slideshare|table-body-youtubeVideos/.test(html), `${label}: source/archive support surfaces missing`);

  const inlineJsBytes = $("script").toArray().reduce((sum, el) => {
    return sum + ($(el).attr("src") ? 0 : Buffer.byteLength($(el).html() || "", "utf8"));
  }, 0);

  return {
    label,
    htmlBytes: Buffer.byteLength(html, "utf8"),
    domElements: $("*").length,
    searchInputs: archiveRoot.find('input[type="search"]').length,
    selects: archiveRoot.find("select").length,
    buttons: archiveRoot.find("button").length,
    tables: $("table").length,
    inlineJsBytes
  };
}

function main() {
  const canonical = readJson(path.join("data", "presentations-page.json"));
  const legacyProjection = readJson(path.join("data", "presentations.json"));

  const items = Array.isArray(canonical.items) ? canonical.items : [];
  const localFirst = items.filter((item) => !item.externalFirst).length;
  const externalFirst = items.filter((item) => item.externalFirst).length;
  const topicless = items.filter((item) => !Array.isArray(item.topics) || item.topics.length === 0).length;
  const duplicateIds = duplicateValues(items.map((item) => item.id).filter(Boolean));

  assert(canonical.count === 218, `canonical count mismatch: expected 218, got ${canonical.count}`);
  assert(items.length === 218, `canonical items length mismatch: expected 218, got ${items.length}`);
  assert(localFirst === 138, `local-first mismatch: expected 138, got ${localFirst}`);
  assert(externalFirst === 80, `external-first mismatch: expected 80, got ${externalFirst}`);
  assert(topicless === 20, `topicless mismatch: expected 20, got ${topicless}`);
  assert(duplicateIds.length === 0, `duplicate canonical ids found: ${duplicateIds.join(", ")}`);

  assert(legacyProjection.count === 139, `legacy presentations.json count mismatch: expected 139, got ${legacyProjection.count}`);

  const pageSummaries = PAGE_PATHS.map(auditPage);

  console.log("P6 built-output audit: OK");
  console.log(JSON.stringify({
    canonical: {
      count: canonical.count,
      localFirst,
      externalFirst,
      topicless,
      duplicateIds: duplicateIds.length
    },
    legacyProjection: {
      count: legacyProjection.count
    },
    pages: pageSummaries
  }, null, 2));
}

main();
