#!/usr/bin/env node
"use strict";

const loadResearchfi = require("../src/_data/researchfi");
const loadResearchfiContent = require("../src/_data/researchfiContent");
const { canonicalPublicationDetailUrl } = require("../src/_data/publicationsPage");
const rules = require("../src/curated/researchfi-integrity.json");

function duplicateValues(values) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

async function main() {
  const [archivePublications, contentItems] = await Promise.all([
    loadResearchfi(),
    loadResearchfiContent()
  ]);
  const failures = [];
  const archiveAnchors = archivePublications.map((item) => item.anchorId);
  const contentAnchors = contentItems.map((item) => item.anchorId);

  if (archivePublications.length < Number(rules.minimumPublicationCount || 1)) {
    failures.push(`Julkaisulähde sisältää vain ${archivePublications.length} julkaisua (vähimmäistaso ${rules.minimumPublicationCount}).`);
  }

  const duplicateArchiveAnchors = duplicateValues(archiveAnchors);
  if (duplicateArchiveAnchors.length) {
    failures.push(`Arkistossa on päällekkäisiä ankkureita: ${duplicateArchiveAnchors.join(", ")}`);
  }

  const duplicateContentAnchors = duplicateValues(contentAnchors);
  if (duplicateContentAnchors.length) {
    failures.push(`Metatietoindeksissä on päällekkäisiä ankkureita: ${duplicateContentAnchors.join(", ")}`);
  }

  const archiveAnchorSet = new Set(archiveAnchors);
  const contentAnchorSet = new Set(contentAnchors);
  const missingFromContent = archiveAnchors.filter((anchor) => !contentAnchorSet.has(anchor));
  const extraInContent = contentAnchors.filter((anchor) => !archiveAnchorSet.has(anchor));

  if (missingFromContent.length || extraInContent.length) {
    failures.push(
      `Arkisto ja metatietoindeksi eivät vastaa toisiaan (puuttuu: ${missingFromContent.join(", ") || "ei mitään"}; ylimääräiset: ${extraInContent.join(", ") || "ei mitään"}).`
    );
  }

  for (const anchorId of rules.requiredAnchorIds || []) {
    if (!archiveAnchorSet.has(anchorId)) {
      failures.push(`Pakollinen julkaisu puuttuu arkistosta: ${anchorId}`);
    }
  }

  contentItems.forEach((item) => {
    if (item.source !== "researchfi") {
      failures.push(`Metatietoindeksin lähde ei ole Research.fi: ${item.anchorId}`);
    }
    const expectedDetailUrl = canonicalPublicationDetailUrl(item.publicationId, item.anchorId)
      || `/julkaisut/#${item.anchorId}`;
    if (item.url !== expectedDetailUrl) {
      failures.push(`Metatietolinkki ei osoita canonical julkaisusivulle: ${item.anchorId}`);
    }
  });

  const duplicateSourceRecords = duplicateValues(archivePublications.map((item) => item.sourceKey));
  if (duplicateSourceRecords.length) {
    console.warn(`[researchfi-integrity] Research.fi palautti ${duplicateSourceRecords.length} sisällöllisesti päällekkäistä tietuetta. Ne säilyvät arkistossa lähdeaineiston mukaisina, mutta näkyvät taksonomioissa vain kerran.`);
  }

  const researchLineCount = contentItems.filter((item) => item.researchLine).length;
  const curatedThemeCount = contentItems.filter((item) => item.researchThemes?.length).length;
  if (researchLineCount !== contentItems.length) {
    console.warn(`[researchfi-integrity] ${contentItems.length - researchLineCount} julkaisulta puuttuu tutkimuslinja. Arkisto julkaistaan silti normaalisti.`);
  }

  if (failures.length) {
    failures.forEach((failure) => console.error(`[researchfi-integrity] ${failure}`));
    process.exitCode = 1;
    return;
  }

  console.log(`[researchfi-integrity] OK: ${archivePublications.length} arkistojulkaisua, ${contentItems.length} metatietotietuetta, ${researchLineCount} tutkimuslinjalla ja ${curatedThemeCount} kuratoiduilla teemoilla.`);
}

main().catch((error) => {
  console.error(`[researchfi-integrity] Tarkistus epäonnistui: ${error.stack || error.message}`);
  process.exitCode = 1;
});
