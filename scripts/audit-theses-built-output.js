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

function buildChecks(html, scope) {
  return {
    findExploreMount: html.includes(`data-find-explore-scope="${scope}"`) && html.includes('data-find-explore-kind="theses"'),
    noLegacyTables: count(html, /<table\b/gi) === 0,
    noLegacyRuntimeScripts: ![
      "/js/pe-list-render.js",
      "/js/content-presets.js",
      "/js/content-engine.js",
      "/js/table-filters.js"
    ].some((value) => html.includes(value)),
    noThesesJsonHydration: !html.includes("/data/theses.json"),
    hasFindExploreScript: html.includes('/js/find-explore.js'),
    hasThesisHubScript: html.includes('/js/thesis-hub-actions.js'),
    hasAbstractModal: html.includes('id="thesisAbstractModal"'),
    hasCitationModal: html.includes('id="thesisCitationModal"'),
    hasAbstractTriggers: count(html, /data-thesis-abstract-trigger/gi) >= 1,
    hasCitationTriggers: count(html, /data-thesis-citation-trigger/gi) >= 3,
    hasCuratedDetailLinks: count(html, /href="\/opinnaytteet\/[0-9]+\/"/gi) >= 10,
    hasSourceLinks: count(html, /href="https:\/\/oulurepo\.oulu\.fi/gi) >= 1
  };
}

function withDelta(current, baseline) {
  return {
    current,
    baseline,
    delta: current - baseline
  };
}

function main() {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  const theses = readJson("_site/data/theses.json");
  const fiHtml = readText("_site/opinnaytteet/index.html");
  const enHtml = readText("_site/en/theses/index.html");

  const fiMetrics = metrics(fiHtml);
  const enMetrics = metrics(enHtml);
  const fiChecks = buildChecks(fiHtml, "fi");
  const enChecks = buildChecks(enHtml, "en");

  const report = {
    generatedAt: new Date().toISOString(),
    canonicalTotal: Array.isArray(theses.items) ? theses.items.length : Array.isArray(theses) ? theses.length : theses.count,
    fi: {
      metrics: fiMetrics,
      checks: fiChecks,
      deltaVsBaseline: {
        htmlBytes: withDelta(fiMetrics.htmlBytes, baseline.pages.thesesFi.htmlBytes),
        elementCount: withDelta(fiMetrics.elementCount, baseline.pages.thesesFi.elementCount),
        searchInputs: withDelta(fiMetrics.searchInputs, baseline.pages.thesesFi.searchInputs),
        selects: withDelta(fiMetrics.selects, baseline.pages.thesesFi.selects),
        buttons: withDelta(fiMetrics.buttons, baseline.pages.thesesFi.buttons),
        tables: withDelta(fiMetrics.tables, baseline.pages.thesesFi.tables),
        localScriptCount: withDelta(fiMetrics.localScriptCount, baseline.pages.thesesFi.localScriptCount),
        inlineScriptBytes: withDelta(fiMetrics.inlineScriptBytes, baseline.pages.thesesFi.inlineScriptBytes),
        jsonRefCount: withDelta(fiMetrics.jsonRefCount, baseline.pages.thesesFi.jsonRequestCount)
      }
    },
    en: {
      metrics: enMetrics,
      checks: enChecks,
      deltaVsBaseline: {
        htmlBytes: withDelta(enMetrics.htmlBytes, baseline.pages.thesesEn.htmlBytes),
        elementCount: withDelta(enMetrics.elementCount, baseline.pages.thesesEn.elementCount),
        searchInputs: withDelta(enMetrics.searchInputs, baseline.pages.thesesEn.searchInputs),
        selects: withDelta(enMetrics.selects, baseline.pages.thesesEn.selects),
        buttons: withDelta(enMetrics.buttons, baseline.pages.thesesEn.buttons),
        tables: withDelta(enMetrics.tables, baseline.pages.thesesEn.tables),
        localScriptCount: withDelta(enMetrics.localScriptCount, baseline.pages.thesesEn.localScriptCount),
        inlineScriptBytes: withDelta(enMetrics.inlineScriptBytes, baseline.pages.thesesEn.inlineScriptBytes),
        jsonRefCount: withDelta(enMetrics.jsonRefCount, baseline.pages.thesesEn.jsonRequestCount)
      }
    }
  };

  report.ok = report.canonicalTotal === 169
    && Object.values(fiChecks).every(Boolean)
    && Object.values(enChecks).every(Boolean);

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) process.exitCode = 1;
}

main();
