const curatedProgram = require("../curated/research-program.json");
const loadResearchfiContent = require("./researchfiContent");
const loadTheses = require("./theses");

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function sortByPriorityAndYear(items = []) {
  return [...items].sort((a, b) => {
    const priorityDiff = toNumber(b.researchPriority) - toNumber(a.researchPriority);
    if (priorityDiff !== 0) return priorityDiff;

    const yearDiff = toNumber(b.year) - toNumber(a.year);
    if (yearDiff !== 0) return yearDiff;

    return String(a.title || "").localeCompare(String(b.title || ""), "fi");
  });
}

function pickOrderedItems(keys = [], itemMap) {
  return toArray(keys)
    .map((key) => itemMap.get(key))
    .filter(Boolean);
}

function annotateWarnings(items, itemMap, kind) {
  const missing = toArray(items).filter((key) => !itemMap.has(key));
  if (missing.length) {
    console.warn(`[researchProgram] Missing curated ${kind}: ${missing.join(", ")}`);
  }
  return missing;
}

function logMissingResearchLines(items, kind) {
  const missing = toArray(items).filter((item) => !item.researchLine);
  if (!missing.length) return missing;

  const preview = missing
    .slice(0, 5)
    .map((item) => {
      const id = item.anchorId || item.link || item.publicationId || "unknown";
      const year = item.year || "n.d.";
      return `${year} | ${id} | ${item.title}`;
    })
    .join(" || ");

  console.warn(
    `[researchProgram] ${missing.length} ${kind} item(s) missing researchLine. Examples: ${preview}`
  );

  return missing;
}

function logEmptyResearchLines(lines) {
  const emptyLines = toArray(lines).filter((line) => !line.publicationCount && !line.thesisCount);
  if (!emptyLines.length) return emptyLines;

  console.warn(
    `[researchProgram] Empty research line(s): ${emptyLines.map((line) => line.key).join(", ")}`
  );

  return emptyLines;
}

module.exports = async function loadResearchProgram() {
  const [publications, thesesData] = await Promise.all([
    loadResearchfiContent(),
    loadTheses()
  ]);

  const theses = [
    ...toArray(thesesData?.gradut),
    ...toArray(thesesData?.kandit)
  ];

  const publicationMap = new Map(publications.map((item) => [item.anchorId, item]));
  const thesisMap = new Map(theses.map((item) => [item.link, item]));

  const lines = toArray(curatedProgram.lines).map((line) => {
    const linePublications = sortByPriorityAndYear(
      publications.filter((item) => item.researchLine === line.key)
    );
    const lineTheses = sortByPriorityAndYear(
      theses.filter((item) => item.researchLine === line.key)
    );

    return {
      ...line,
      publications: linePublications.slice(0, line.maxPublications || linePublications.length),
      theses: lineTheses.slice(0, line.maxTheses || lineTheses.length),
      publicationCount: linePublications.length,
      thesisCount: lineTheses.length
    };
  });
  const visibleLines = lines.filter((line) => line.showOnResearchPage !== false);

  const currentLine = lines.find((line) => line.key === curatedProgram.currentLineKey) || visibleLines[0] || lines[0] || null;
  const featuredPublications = pickOrderedItems(curatedProgram.featuredPublicationIds, publicationMap);
  const featuredTheses = pickOrderedItems(curatedProgram.featuredThesisLinks, thesisMap);

  const missingPublicationIds = annotateWarnings(
    curatedProgram.featuredPublicationIds,
    publicationMap,
    "publication ids"
  );
  const missingThesisLinks = annotateWarnings(
    curatedProgram.featuredThesisLinks,
    thesisMap,
    "thesis links"
  );
  const publicationsMissingResearchLine = logMissingResearchLines(publications, "publication");
  const thesesMissingResearchLine = logMissingResearchLines(theses, "thesis");
  const emptyResearchLines = logEmptyResearchLines(lines);

  return {
    currentLineKey: curatedProgram.currentLineKey || null,
    currentLine,
    lines,
    visibleLines,
    featuredPublications,
    featuredTheses,
    publications,
    theses,
    missingPublicationIds,
    missingThesisLinks,
    publicationsMissingResearchLine,
    thesesMissingResearchLine,
    emptyResearchLines
  };
};
