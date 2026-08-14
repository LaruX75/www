const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BASELINE_ROOT = process.env.F4_BASELINE_SITE || "";

function readTextFrom(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readText(relativePath) {
  return readTextFrom(ROOT, relativePath);
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

function localScriptBytes(localScripts, root = ROOT) {
  return localScripts.reduce((sum, src) => {
    const cleanSrc = src.split("?")[0].replace(/^\//, "");
    const filePath = path.join(root, "_site", cleanSrc);
    if (!fs.existsSync(filePath)) return sum;
    return sum + fs.statSync(filePath).size;
  }, 0);
}

function metrics(html, root = ROOT) {
  const localScripts = collectLocalScripts(html);
  return {
    htmlBytes: Buffer.byteLength(html, "utf8"),
    elementCount: count(html, /<([a-z][a-z0-9-]*)(?:\s|>)/gi),
    searchInputs: count(html, /<input\b[^>]*type="search"/gi),
    selects: count(html, /<select\b/gi),
    buttons: count(html, /<button\b/gi),
    localScripts,
    localScriptCount: localScripts.length,
    localScriptBytes: localScriptBytes(localScripts, root),
    inlineScriptBytes: inlineScriptBytes(html),
    jsonRefs: collectJsonRefs(html),
    jsonRefCount: collectJsonRefs(html).length,
    findExploreMounts: count(html, /data-find-explore\b/gi)
  };
}

function withDelta(current, baseline) {
  if (!baseline) return null;
  return {
    current,
    baseline,
    delta: current - baseline
  };
}

function buildDelta(current, baseline) {
  if (!baseline) return null;
  return {
    htmlBytes: withDelta(current.htmlBytes, baseline.htmlBytes),
    elementCount: withDelta(current.elementCount, baseline.elementCount),
    searchInputs: withDelta(current.searchInputs, baseline.searchInputs),
    selects: withDelta(current.selects, baseline.selects),
    buttons: withDelta(current.buttons, baseline.buttons),
    localScriptCount: withDelta(current.localScriptCount, baseline.localScriptCount),
    localScriptBytes: withDelta(current.localScriptBytes, baseline.localScriptBytes),
    inlineScriptBytes: withDelta(current.inlineScriptBytes, baseline.inlineScriptBytes),
    jsonRefCount: withDelta(current.jsonRefCount, baseline.jsonRefCount),
    findExploreMounts: withDelta(current.findExploreMounts, baseline.findExploreMounts)
  };
}

function getBaselineMetrics(relativePath) {
  if (!BASELINE_ROOT) return null;
  const sitePath = path.join(BASELINE_ROOT, "_site", relativePath);
  if (!fs.existsSync(sitePath)) return null;
  return metrics(readTextFrom(BASELINE_ROOT, path.join("_site", relativePath)), BASELINE_ROOT);
}

function main() {
  const researchHtml = readText("_site/tutkimus/index.html");
  const homeHtml = readText("_site/index.html");
  const findExploreJsBytes = fs.statSync(path.join(ROOT, "_site/js/find-explore.js")).size;
  const baselineResearch = getBaselineMetrics("tutkimus/index.html");
  const baselineHome = getBaselineMetrics("index.html");

  const researchMetrics = metrics(researchHtml);
  const homeMetrics = metrics(homeHtml);
  const researchChecks = {
    fileExists: true,
    ssrNarrativeRemains: researchHtml.includes("Tutkimuksen tarkasteluteemat")
      && researchHtml.includes("Generation AI kokoaa tutkimuksen tämänhetkisen painopisteen"),
    researchLinesRemain: researchHtml.includes("Kolme keskeistä tutkimuslinjaa"),
    projectsRemain: researchHtml.includes("Tutkimushankkeet 2003"),
    curatedResearchRemains: researchHtml.includes("Tuore tutkimusnäyttö tästä linjasta"),
    externalProfilesRemain: researchHtml.includes("ORCID") && researchHtml.includes("Research.fi"),
    contextualMountExists: researchHtml.includes('data-find-explore-kind="researchContext"'),
    intendedScopesOnly: researchHtml.includes('data-find-explore-kinds="publications,theses,writings"')
      && !researchHtml.includes('data-find-explore-kinds="presentations')
      && !researchHtml.includes('data-find-explore-kinds="media'),
    hasFindExploreRuntime: researchHtml.includes("/js/find-explore.js"),
    noNewMasterJsonDataset: !researchHtml.includes("/data/research-find-explore")
      && !researchHtml.includes("/data/find-explore")
      && !researchHtml.includes("/data/research-context"),
    noUnnecessaryCanonicalJsonHydration: collectJsonRefs(researchHtml).length === 0,
    noEmbeddedPublicationRecords: !researchHtml.includes("researchPublicationFindExploreRecords")
      && !researchHtml.includes("data-find-explore-records-id"),
    topicPresetsExist: [
      "Tekoäly ja tekoälylukutaito",
      "Opettajankoulutus",
      "Koulutusteknologia",
      "Yhteisöllinen oppiminen"
    ].every((value) => researchHtml.includes(value))
  };

  const homeChecks = {
    fileExists: true,
    orientationRemains: homeHtml.includes("Kouluttaja, puhuja ja vaikuttaja"),
    discoveryRouteExists: homeHtml.includes('href="/tutkimus/#tutkimusnaytto"'),
    noFindExploreMount: !homeHtml.includes("data-find-explore"),
    noFindExploreRuntimeForHomepage: !homeHtml.includes("/js/find-explore.js"),
    noHomepageFilters: !homeHtml.includes("data-find-explore-query")
      && !homeHtml.includes("data-find-explore-type")
  };

  const report = {
    generatedAt: new Date().toISOString(),
    ok: Object.values(researchChecks).every(Boolean)
      && Object.values(homeChecks).every(Boolean),
    allowedScopes: ["publications", "theses", "writings"],
    excludedScopes: ["presentations", "media", "politics", "projects"],
    findExploreJsBytes,
    research: {
      metrics: researchMetrics,
      baselineMetrics: baselineResearch,
      deltaVsBaseline: buildDelta(researchMetrics, baselineResearch),
      checks: researchChecks
    },
    homepage: {
      metrics: homeMetrics,
      baselineMetrics: baselineHome,
      deltaVsBaseline: buildDelta(homeMetrics, baselineHome),
      checks: homeChecks
    }
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
