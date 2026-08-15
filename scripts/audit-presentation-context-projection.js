const fs = require("fs");
const path = require("path");

const {
  buildPresentationExistingHtmlAudit,
  canonicalPresentationId,
  normalizeLocalUrl
} = require("./_lib/presentationPagefind");
const { getPresentationResearchPresets } = require("../src/_data/presentationResearchTopics");

const ROOT = process.cwd();
const SITE_ROOT = path.join(ROOT, "_site");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(SITE_ROOT, relativePath), "utf8"));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function hasContext(item = {}, context = "") {
  return toArray(item.contexts).includes(context);
}

function countBy(items = [], getKey = () => "") {
  const counts = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Object.fromEntries([...counts.entries()].sort((left, right) => left[0].localeCompare(right[0], "fi")));
}

function normalizeContexts(values = []) {
  return uniqueStrings(values).sort((left, right) => left.localeCompare(right, "fi"));
}

function matchedLocalPresentationUrls(item = {}) {
  const urls = new Set();
  const add = (value) => {
    const normalized = normalizeLocalUrl(value);
    if (normalized) urls.add(normalized);
  };

  add(item.localPageUrl || item.pageUrl || "");
  toArray(item.representations).forEach((representation) => {
    add(representation.localPageUrl || "");
    add(representation.url || "");
  });

  return [...urls];
}

function sampleProjection(item = {}, matchedDetails = []) {
  return {
    canonicalId: canonicalPresentationId(item),
    title: item.title || "",
    contexts: toArray(item.contexts),
    landingType: item.landingType || "",
    localPageUrl: item.localPageUrl || "",
    matchedLocalDetails: matchedDetails.map((detail) => ({
      pageUrl: detail.pageUrl || "",
      title: detail.title || "",
      contexts: toArray(detail.contexts)
    })),
    safeResearchPresets: getPresentationResearchPresets(toArray(item.topics))
  };
}

async function main() {
  const presentationsPage = readJson(path.join("data", "presentations-page.json"));
  const presentationsDetails = readJson(path.join("data", "presentations.json"));
  const researchHtml = fs.readFileSync(path.join(SITE_ROOT, "tutkimus", "index.html"), "utf8");
  const htmlAudit = await buildPresentationExistingHtmlAudit(SITE_ROOT);

  const canonicalItems = toArray(presentationsPage.items);
  const localDetails = toArray(presentationsDetails.items);
  const localDetailsByUrl = new Map(
    localDetails
      .map((detail) => {
        const detailUrl = normalizeLocalUrl(detail.pageUrl || detail.url || detail.id || "");
        return detailUrl ? [detailUrl, detail] : null;
      })
      .filter(Boolean)
  );
  const pagefindRecords = toArray(htmlAudit.records);
  const pagefindById = new Map(pagefindRecords.map((record) => [record.canonicalPresentationId, record]));

  const canonicalWithMatches = canonicalItems.map((item) => {
    const matchedDetails = matchedLocalPresentationUrls(item)
      .map((pageUrl) => localDetailsByUrl.get(pageUrl))
      .filter(Boolean);
    const projectedContexts = normalizeContexts(
      matchedDetails.flatMap((detail) => toArray(detail.contexts))
    );
    const contexts = normalizeContexts(toArray(item.contexts));
    const safeResearchPresets = getPresentationResearchPresets(toArray(item.topics));
    const pagefindRecord = pagefindById.get(canonicalPresentationId(item)) || null;

    return {
      item,
      contexts,
      projectedContexts,
      matchedDetails,
      safeResearchPresets,
      pagefindRecord
    };
  });

  const localResearch = localDetails.filter((item) => hasContext(item, "research"));
  const canonicalResearch = canonicalWithMatches.filter(({ item }) => hasContext(item, "research"));
  const pagefindResearch = pagefindRecords.filter((record) => toArray(record.presentationContexts).includes("research"));
  const matchedCanonicalCount = canonicalWithMatches.filter(({ matchedDetails }) => matchedDetails.length > 0).length;
  const projectedCanonicalCount = canonicalWithMatches.filter(({ contexts }) => contexts.length > 0).length;
  const unmatchedCanonicalWithContexts = canonicalWithMatches.filter(
    ({ matchedDetails, contexts }) => matchedDetails.length === 0 && contexts.length > 0
  );
  const mismatchedContextProjection = canonicalWithMatches.filter(
    ({ contexts, projectedContexts }) => JSON.stringify(contexts) !== JSON.stringify(projectedContexts)
  );

  const researchEligibleLocalFirst = canonicalResearch.filter(({ item }) => item.landingType === "localDetail");
  const researchEligibleExternalFirst = canonicalResearch.filter(({ item }) => item.landingType === "externalSource");
  const researchEligibleWithSafeMapping = canonicalResearch.filter(({ safeResearchPresets }) => safeResearchPresets.length > 0);
  const researchEligibleWithoutSafeMapping = canonicalResearch.filter(({ safeResearchPresets }) => safeResearchPresets.length === 0);
  const safeMappedButNotResearch = canonicalWithMatches.filter(
    ({ item, safeResearchPresets }) => safeResearchPresets.length > 0 && !hasContext(item, "research")
  );
  const multiContextResearch = canonicalResearch.filter(({ contexts }) => contexts.length > 1);

  const checks = {
    canonicalCount: canonicalItems.length === 218,
    localDetailCount: localDetails.length === 139,
    localDetailResearchCount: localResearch.length === 33,
    canonicalResearchCount: canonicalResearch.length === 33,
    pagefindResearchCount: pagefindResearch.length === 33,
    matchedCanonicalCount: matchedCanonicalCount === 140,
    projectedCanonicalCount: projectedCanonicalCount === 140,
    noContextsForUnmatchedCanonicals: unmatchedCanonicalWithContexts.length === 0,
    exactContextProjectionFromMatchedLocalDetails: mismatchedContextProjection.length === 0,
    pagefindMatchesCanonicalResearch: pagefindResearch.length === canonicalResearch.length,
    researchMountScopeIncludesPresentations: researchHtml.includes('data-find-explore-kinds="publications,theses,writings,presentations"'),
    safeTopicMappingCount: safeMappedButNotResearch.length + researchEligibleWithSafeMapping.length === 168
  };

  const report = {
    generatedAt: new Date().toISOString(),
    ok: Object.values(checks).every(Boolean),
    checks,
    before: {
      canonicalPresentations: 218,
      localDetails: 139,
      localDetailsWithResearchContext: 33,
      canonicalPresentationsWithResearchContextBeforeProjection: 0,
      pagefindPresentationRecordsWithResearchContextBeforeProjection: 0
    },
    after: {
      canonicalPresentations: canonicalItems.length,
      projectedCanonicalWithAnyContexts: projectedCanonicalCount,
      researchEligiblePresentations: canonicalResearch.length,
      researchIneligibleOrUnknown: canonicalItems.length - canonicalResearch.length,
      researchEligibleLocalFirst: researchEligibleLocalFirst.length,
      researchEligibleExternalFirst: researchEligibleExternalFirst.length,
      researchEligibleWithSafeResearchMapping: researchEligibleWithSafeMapping.length,
      researchEligibleWithoutSafeMapping: researchEligibleWithoutSafeMapping.length,
      safeTopicMappedButNotResearch: safeMappedButNotResearch.length,
      multiContextResearchPresentations: multiContextResearch.length
    },
    breakdowns: {
      researchContextCombos: countBy(canonicalResearch, ({ contexts }) => contexts.join("|")),
      researchEligibleByLandingType: countBy(canonicalResearch, ({ item }) => item.landingType || ""),
      matchedLocalDetailRelationships: countBy(
        canonicalWithMatches.flatMap(({ item }) =>
          matchedLocalPresentationUrls(item).map((pageUrl) => {
            const normalized = normalizeLocalUrl(pageUrl);
            const relationship = toArray(item.representations).find((representation) =>
              normalizeLocalUrl(representation.localPageUrl || representation.url || "") === normalized
            )?.relationship;
            return relationship || (normalizeLocalUrl(item.localPageUrl || item.pageUrl || "") === normalized
              ? "canonicalLocalDetail"
              : "");
          })
        ),
        (relationship) => relationship
      )
    },
    samples: {
      researchEligible: sampleProjection(
        canonicalResearch[0]?.item || {},
        canonicalResearch[0]?.matchedDetails || []
      ),
      teachingOnly: sampleProjection(
        canonicalWithMatches.find(({ item, contexts }) =>
          !hasContext(item, "research") && JSON.stringify(contexts) === JSON.stringify(["teaching"])
        )?.item || {},
        canonicalWithMatches.find(({ item, contexts }) =>
          !hasContext(item, "research") && JSON.stringify(contexts) === JSON.stringify(["teaching"])
        )?.matchedDetails || []
      ),
      educationOnly: sampleProjection(
        canonicalWithMatches.find(({ item, contexts }) =>
          !hasContext(item, "research") && JSON.stringify(contexts) === JSON.stringify(["education"])
        )?.item || {},
        canonicalWithMatches.find(({ item, contexts }) =>
          !hasContext(item, "research") && JSON.stringify(contexts) === JSON.stringify(["education"])
        )?.matchedDetails || []
      ),
      safeTopicMappedButNonResearch: sampleProjection(
        safeMappedButNotResearch[0]?.item || {},
        safeMappedButNotResearch[0]?.matchedDetails || []
      ),
      multiContextResearch: sampleProjection(
        multiContextResearch[0]?.item || {},
        multiContextResearch[0]?.matchedDetails || []
      )
    }
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
