const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, "docs", "data", "find-explore-f3-baseline.json");

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function count(source, regex) {
  return [...source.matchAll(regex)].length;
}

function collectJsonRefs(html) {
  return [...new Set([...html.matchAll(/\/data\/[a-z0-9-]+\.json/gi)].map((match) => match[0]))].sort();
}

function collectLocalScripts(html) {
  return [...new Set(
    [...html.matchAll(/<script[^>]+src="([^"]+)"/gi)]
      .map((match) => match[1])
      .filter((value) => value.startsWith("/js/"))
  )];
}

function inlineScriptBytes(html) {
  return [...html.matchAll(/<script\b(?![^>]+src=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .reduce((sum, match) => sum + Buffer.byteLength(match[1] || "", "utf8"), 0);
}

function metrics(html) {
  return {
    htmlBytes: Buffer.byteLength(html, "utf8"),
    elementCount: count(html, /<([a-z][a-z0-9-]*)(?:\s|>)/gi),
    searchInputs: count(html, /<input\b[^>]*type="search"/gi),
    selects: count(html, /<select\b/gi),
    buttons: count(html, /<button\b/gi),
    tables: count(html, /<table\b/gi),
    localScripts: collectLocalScripts(html),
    localScriptCount: collectLocalScripts(html).length,
    inlineScriptBytes: inlineScriptBytes(html),
    jsonRefs: collectJsonRefs(html),
    jsonRefCount: collectJsonRefs(html).length
  };
}

function withDelta(current, baseline) {
  return {
    current,
    baseline,
    delta: current - baseline
  };
}

function buildChecks(html, scope) {
  return {
    findExploreMount: html.includes(`data-find-explore-scope="${scope}"`) && html.includes('data-find-explore-kind="publications"'),
    hasFindExploreScript: html.includes("/js/find-explore.js"),
    noLegacyRuntimeScripts: ![
      "/js/pe-list-render.js",
      "/js/content-presets.js",
      "/js/content-engine.js",
      "/js/table-filters.js"
    ].some((value) => html.includes(value)),
    noPublicationJsonHydration: !html.includes("/data/publications-page.json"),
    noLegacyPublicationTables: !html.includes("data-pub-search") && !html.includes("pub-table-a"),
    localDetailLinks: count(html, /href="\/julkaisut\/(?:researchfi-)?[a-z0-9-]+\/"/gi) >= 8,
    sourceLinks: count(html, /href="https?:\/\/[^"]+"/gi) >= 8,
    hasOpeningList: html.includes("publication-opening-list"),
    hasQualityFilter: html.includes("data-find-explore-quality")
  };
}

function main() {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  const publications = readJson("_site/data/publications-page.json");
  const fiHtml = readText("_site/julkaisut/index.html");
  const enHtml = readText("_site/en/publications/index.html");

  const fiMetrics = metrics(fiHtml);
  const enMetrics = metrics(enHtml);
  const fiChecks = {
    ...buildChecks(fiHtml, "fi"),
    hasCitationModal: fiHtml.includes('id="citationExportModal"'),
    hasCitationButtons: count(fiHtml, /export-citation-btn/gi) >= 8
  };
  const enChecks = {
    ...buildChecks(enHtml, "en"),
    noBrokenCitationButtons: !enHtml.includes("export-citation-btn")
  };

  const report = {
    generatedAt: new Date().toISOString(),
    canonicalTotal: Array.isArray(publications.items) ? publications.items.length : publications.count,
    fi: {
      metrics: fiMetrics,
      checks: fiChecks,
      deltaVsBaseline: {
        htmlBytes: withDelta(fiMetrics.htmlBytes, baseline.pages.publicationsFi.htmlBytes),
        elementCount: withDelta(fiMetrics.elementCount, baseline.pages.publicationsFi.elementCount),
        searchInputs: withDelta(fiMetrics.searchInputs, baseline.pages.publicationsFi.searchInputs),
        selects: withDelta(fiMetrics.selects, baseline.pages.publicationsFi.selects),
        buttons: withDelta(fiMetrics.buttons, baseline.pages.publicationsFi.buttons),
        tables: withDelta(fiMetrics.tables, baseline.pages.publicationsFi.tables),
        localScriptCount: withDelta(fiMetrics.localScriptCount, baseline.pages.publicationsFi.localScriptCount),
        inlineScriptBytes: withDelta(fiMetrics.inlineScriptBytes, baseline.pages.publicationsFi.inlineScriptBytes),
        jsonRefCount: withDelta(fiMetrics.jsonRefCount, baseline.pages.publicationsFi.jsonRequestCount)
      }
    },
    en: {
      metrics: enMetrics,
      checks: enChecks,
      deltaVsBaseline: {
        htmlBytes: withDelta(enMetrics.htmlBytes, baseline.pages.publicationsEn.htmlBytes),
        elementCount: withDelta(enMetrics.elementCount, baseline.pages.publicationsEn.elementCount),
        searchInputs: withDelta(enMetrics.searchInputs, baseline.pages.publicationsEn.searchInputs),
        selects: withDelta(enMetrics.selects, baseline.pages.publicationsEn.selects),
        buttons: withDelta(enMetrics.buttons, baseline.pages.publicationsEn.buttons),
        tables: withDelta(enMetrics.tables, baseline.pages.publicationsEn.tables),
        localScriptCount: withDelta(enMetrics.localScriptCount, baseline.pages.publicationsEn.localScriptCount),
        inlineScriptBytes: withDelta(enMetrics.inlineScriptBytes, baseline.pages.publicationsEn.inlineScriptBytes),
        jsonRefCount: withDelta(enMetrics.jsonRefCount, baseline.pages.publicationsEn.jsonRequestCount)
      }
    }
  };

  report.ok = report.canonicalTotal === 56
    && Object.values(fiChecks).every(Boolean)
    && Object.values(enChecks).every(Boolean);

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) process.exitCode = 1;
}

main();
