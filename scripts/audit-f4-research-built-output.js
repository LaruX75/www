const fs = require("fs");
const path = require("path");
const { getPresentationResearchPresets } = require("../src/_data/presentationResearchTopics");

const ROOT = process.cwd();
const BASELINE_ROOT = process.env.F4_BASELINE_SITE || "";

function readTextFrom(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readText(relativePath) {
  return readTextFrom(ROOT, relativePath);
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

function localScriptBytes(localScripts, root = ROOT) {
  return localScripts.reduce((sum, src) => {
    const cleanSrc = src.split("?")[0].replace(/^\//, "");
    const filePath = path.join(root, "_site", cleanSrc);
    if (!fs.existsSync(filePath)) return sum;
    return sum + fs.statSync(filePath).size;
  }, 0);
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasContext(item, context) {
  return toArray(item?.contexts).includes(context);
}

function countBy(items, getKey) {
  const counts = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Object.fromEntries([...counts.entries()].sort((left, right) => left[0].localeCompare(right[0], "fi")));
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
  const publicationsPage = readJson("_site/data/publications-page.json");
  const thesesPage = readJson("_site/data/theses.json");
  const writingsPage = readJson("_site/data/writings-page.json");
  const presentationsPage = readJson("_site/data/presentations-page.json");
  const findExploreJsBytes = fs.statSync(path.join(ROOT, "_site/js/find-explore.js")).size;
  const baselineResearch = getBaselineMetrics("tutkimus/index.html");
  const baselineHome = getBaselineMetrics("index.html");

  const researchMetrics = metrics(researchHtml);
  const homeMetrics = metrics(homeHtml);
  const publicationItems = publicationsPage.items || [];
  const thesisItems = thesesPage.items || [];
  const writingItems = writingsPage.items || [];
  const presentationItems = presentationsPage.items || [];

  const eligiblePublications = publicationItems.filter((item) => hasContext(item, "research"));
  const eligibleTheses = thesisItems.filter((item) => hasContext(item, "research"));
  const eligibleWritings = writingItems.filter((item) => hasContext(item, "research"));
  const eligiblePresentations = presentationItems.filter((item) => hasContext(item, "research"));
  const multiContextResearchWritings = eligibleWritings.filter((item) => toArray(item.contexts).length > 1);
  const writingsEligibleByType = countBy(eligibleWritings, (item) => item.contentType || "");
  const writingsTotalByType = countBy(writingItems, (item) => item.contentType || "");
  const writingsResearchContextCombos = countBy(
    eligibleWritings,
    (item) => toArray(item.contexts).join("|")
  );
  const presentationsSafeResearchTopicMapping = presentationItems.filter(
    (item) => getPresentationResearchPresets(toArray(item.topics)).length > 0
  );

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
    contextualFilterUsesExistingResearchContext: researchHtml.includes('data-find-explore-kind="researchContext"')
      && researchHtml.includes('data-find-explore-kinds="publications,theses,writings"'),
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

  const eligibilityChecks = {
    membershipRuleUsesExistingContextOnly: true,
    publicationsEligibleCount: eligiblePublications.length === 53,
    thesesEligibleCount: eligibleTheses.length === 169,
    writingsEligibleCount: eligibleWritings.length === 62,
    totalEligibleCount: eligiblePublications.length + eligibleTheses.length + eligibleWritings.length === 284,
    writingsEligibleByType: JSON.stringify(writingsEligibleByType) === JSON.stringify({
      blogPost: 1,
      opinion: 3,
      scientificPublication: 53,
      speech: 5
    }),
    blogsTotals: (writingsTotalByType.blogPost || 0) === 70 && (writingsEligibleByType.blogPost || 0) === 1,
    multiContextResearchWritings: multiContextResearchWritings.length === 61,
    educationSemanticsRemainVisible: eligibleWritings.filter((item) => hasContext(item, "education")).length === 59,
    teachingSemanticsRemainVisible: eligibleWritings.filter((item) => hasContext(item, "teaching")).length === 43,
    societalInteractionOverlapRemainsVisible: eligibleWritings.filter((item) => hasContext(item, "politics")).length === 8,
    businessOverlapRemainsVisible: eligibleWritings.filter((item) => hasContext(item, "business")).length === 1,
    presentationsStayOutOfResearchMembership: eligiblePresentations.length === 0 && presentationItems.length === 218,
    presentationsSafeTopicMappingRemainsEvidenceOnly: presentationsSafeResearchTopicMapping.length === 168
  };

  const report = {
    generatedAt: new Date().toISOString(),
    ok: Object.values(researchChecks).every(Boolean)
      && Object.values(homeChecks).every(Boolean),
    membershipRule: "Existing Research membership only: include a record when its existing contexts array contains \"research\".",
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
    },
    eligibility: {
      checks: eligibilityChecks,
      counts: {
        publicationsEligible: eligiblePublications.length,
        thesesEligible: eligibleTheses.length,
        writingsEligible: eligibleWritings.length,
        totalResearchPopulation: eligiblePublications.length + eligibleTheses.length + eligibleWritings.length
      },
      writings: {
        totalByContentType: writingsTotalByType,
        eligibleByContentType: writingsEligibleByType,
        blogs: {
          total: writingsTotalByType.blogPost || 0,
          eligible: writingsEligibleByType.blogPost || 0
        },
        multiContextResearchWritings: multiContextResearchWritings.length,
        researchContextCombos: writingsResearchContextCombos,
        eligibleWithEducation: eligibleWritings.filter((item) => hasContext(item, "education")).length,
        eligibleWithTeaching: eligibleWritings.filter((item) => hasContext(item, "teaching")).length,
        eligibleWithPolitics: eligibleWritings.filter((item) => hasContext(item, "politics")).length,
        eligibleWithBusiness: eligibleWritings.filter((item) => hasContext(item, "business")).length
      },
      presentationsEvidenceOnly: {
        canonicalTotal: presentationItems.length,
        researchEligibleUnderExistingContextRule: eligiblePresentations.length,
        safeResearchTopicMappingCount: presentationsSafeResearchTopicMapping.length
      }
    }
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
