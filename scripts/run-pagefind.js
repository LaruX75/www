const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const pagefind = require("../node_modules/pagefind/lib/index.js");
const {
  SITE_ROOT,
  buildHtmlRouteMap,
  buildPresentationExistingHtmlAudit,
  buildPresentationCustomRecord,
  extractTextFromHtml
} = require("./_lib/presentationPagefind");

const nonContentDirs = [
  path.join(SITE_ROOT, "og-image.og"),
  path.join(SITE_ROOT, "pagefind")
];

function cleanupIndexDirs() {
  for (const dir of nonContentDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (_) {
      // Ignore cleanup errors, Pagefind can still run on the rest of the site.
    }
  }
}

function stableSortByKey(entries = []) {
  return [...entries].sort(([left], [right]) => String(left).localeCompare(String(right)));
}

function uniqueIndexCandidates(records = []) {
  const byUrl = new Map();

  records
    .filter((record) => record.indexCandidateDocument)
    .forEach((record) => {
      const key = record.indexCandidateDocument;
      if (byUrl.has(key)) {
        throw new Error(`Duplicate presentation scope index candidate URL: ${key}`);
      }
      byUrl.set(key, record);
    });

  return byUrl;
}

async function addHtmlFiles(index, htmlRouteMap) {
  // Local presentation HTML now carries Pagefind metadata directly from
  // Eleventy/Nunjucks SSR (see src/src.11tydata.js resolvePagefindPresentations
  // — PF5-G2). The postbuild in-memory injection layer that used to add an
  // equivalent hidden block per PR/audit PF5-HYGIENE-1 has been deleted; we
  // simply hand each HTML file to Pagefind as it exists on disk.
  const errors = [];
  let indexedCount = 0;

  for (const [url, filePath] of stableSortByKey([...htmlRouteMap.entries()])) {
    const sourcePath = path.relative(SITE_ROOT, filePath);
    const content = await fsp.readFile(filePath, "utf8");

    const result = await index.addHTMLFile({ sourcePath, content });
    if (result.errors.length) {
      errors.push(...result.errors.map((message) => `[${url}] ${message}`));
      continue;
    }
    indexedCount += 1;
  }

  return { indexedCount, errors };
}

async function resolveCustomRecordContent(record, htmlRouteMap) {
  const candidateUrls = [
    record.indexCandidateDocument,
    record.localPageUrl,
    ...(record.localHtmlDocuments || []).map((document) => document.url)
  ].filter(Boolean);

  for (const url of candidateUrls) {
    const filePath = htmlRouteMap.get(url);
    if (!filePath) continue;

    const html = await fsp.readFile(filePath, "utf8");
    const text = extractTextFromHtml(html);
    if (text) return text;
  }

  return "";
}

async function addPresentationCustomRecords(index, records = [], htmlRouteMap = new Map()) {
  const errors = [];
  let indexedCount = 0;

  for (const record of records) {
    if (!record.preferredLandingUrl) {
      errors.push(`[${record.canonicalPresentationId}] Missing preferred landing URL for custom Pagefind record`);
      continue;
    }

    const content = await resolveCustomRecordContent(record, htmlRouteMap);
    const result = await index.addCustomRecord(buildPresentationCustomRecord(record, content));
    if (result.errors.length) {
      errors.push(
        ...result.errors.map((message) => `[${record.canonicalPresentationId}] ${message}`)
      );
      continue;
    }
    indexedCount += 1;
  }

  return { indexedCount, errors };
}

async function main() {
  cleanupIndexDirs();

  const presentationAudit = await buildPresentationExistingHtmlAudit(SITE_ROOT);
  const htmlRouteMap = await buildHtmlRouteMap(SITE_ROOT);
  const localScopeRecords = uniqueIndexCandidates(presentationAudit.records);
  const customScopeRecords = presentationAudit.records.filter((record) => !record.indexCandidateDocument);

  const service = await pagefind.createIndex();
  if (service.errors.length) {
    throw new Error(`Failed to start Pagefind service: ${service.errors.join("; ")}`);
  }

  try {
    const htmlResult = await addHtmlFiles(service.index, htmlRouteMap);
    const customResult = await addPresentationCustomRecords(service.index, customScopeRecords, htmlRouteMap);
    const writeResult = await service.index.writeFiles({
      outputPath: path.join(SITE_ROOT, "pagefind")
    });

    const errors = [
      ...htmlResult.errors,
      ...customResult.errors,
      ...writeResult.errors
    ];

    if (errors.length) {
      throw new Error(errors.join("\n"));
    }

    console.log(JSON.stringify({
      ok: true,
      htmlDocumentsIndexed: htmlResult.indexedCount,
      presentationScopeLocalDocuments: localScopeRecords.size,
      presentationScopeCustomRecords: customResult.indexedCount,
      presentationCanonicalTotal: presentationAudit.summary.canonicalTotal,
      presentationLocalLandingTotal: presentationAudit.summary.localLandingTotal,
      presentationExternalLandingTotal: presentationAudit.summary.externalLandingTotal
    }, null, 2));
  } finally {
    await pagefind.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
