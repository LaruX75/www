#!/usr/bin/env node

const path = require("path");
const { performance } = require("node:perf_hooks");
const {
  validateCollectionItem
} = require("../src/_utils/canonicalContentValidation");
const {
  fetchYouTubeMetadata
} = require("./_lib/authoring/youtubeMetadata");
const {
  fetchDoiMetadata,
  normalizeDoiInput
} = require("./_lib/authoring/doiMetadata");
const {
  buildPresentationDraft,
  compareProposalToCanonical,
  findExistingPresentationBySourceUrl
} = require("./_lib/authoring/presentationDraft");
const {
  buildPublicationDraft,
  compareProposalToPublication,
  findExistingPublicationByDoi,
  loadCanonicalPublicationContext
} = require("./_lib/authoring/publicationDraft");
const {
  renderPublicationPreview,
  renderPresentationPreview
} = require("./_lib/authoring/eleventyPreview");

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    contexts: [],
    keepTemp: false,
    debug: false
  };
  let url = "";

  while (args.length) {
    const token = args.shift();
    if (!url && !token.startsWith("--")) {
      url = token;
      continue;
    }

    if (token === "--type") {
      options.type = args.shift() || "";
      continue;
    }

    if (token === "--contexts") {
      const raw = args.shift() || "";
      options.contexts = raw.split(",").map((item) => item.trim()).filter(Boolean);
      continue;
    }

    if (token === "--slug") {
      options.slug = args.shift() || "";
      continue;
    }

    if (token === "--type-code") {
      options.typeCode = args.shift() || "";
      continue;
    }

    if (token === "--keep-temp") {
      options.keepTemp = true;
      continue;
    }

    if (token === "--debug") {
      options.debug = true;
      continue;
    }

    if (token === "--write") {
      options.write = true;
      continue;
    }

    throw new Error(`Tuntematon argumentti: ${token}`);
  }

  if (!url) {
    throw new Error('Usage: npm run author:preview -- "<youtube-url|doi>" [--type esitys] [--contexts teaching,business] [--type-code A1] [--write]');
  }

  return { url, options };
}

function printLines(lines) {
  process.stdout.write(`${lines.join("\n")}\n`);
}

function formatComparison(comparison) {
  if (!comparison) {
    return ["Canonical comparison: no existing Presentation match"];
  }

  const lines = [
    `Canonical comparison: ${path.relative(process.cwd(), comparison.filePath)}`
  ];

  comparison.fields.forEach((item) => {
    lines.push(
      `${item.field}: ${item.matches ? "MATCH" : "DIFF"} ` +
      `(proposed="${item.proposed}" canonical="${item.canonical}")`
    );
  });

  return lines;
}

function isYouTubeInput(value) {
  return /(youtube\.com|youtu\.be)/i.test(String(value || ""));
}

function isLikelyDoiInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;

  if (/^https?:\/\//i.test(raw)) {
    return /(?:dx\.)?doi\.org\//i.test(raw);
  }

  return true;
}

function formatDuplicateComparison(comparison) {
  if (!comparison) {
    return ["Metadata differences: no canonical duplicate"];
  }

  const lines = [
    `Existing canonical page: ${comparison.pageUrl || "(no canonical detail URL)"}`,
    "Metadata differences:"
  ];

  comparison.fields.forEach((item) => {
    lines.push(
      `${item.field}: ${item.matches ? "MATCH" : "DIFF"} ` +
      `(proposed="${item.proposed}" canonical="${item.canonical}")`
    );
  });

  return lines;
}

async function runYouTubeFlow(inputValue, options) {
  const proposal = await fetchYouTubeMetadata(inputValue);
  const canonicalMatch = findExistingPresentationBySourceUrl(proposal.sourceUrl);
  const draft = buildPresentationDraft({
    proposal,
    manual: options,
    canonicalMatch
  });
  const comparison = compareProposalToCanonical(proposal, canonicalMatch);

  const validation = validateCollectionItem({
    collectionName: "presentations",
    data: draft.frontMatter,
    filePath: path.join(process.cwd(), "src", "presentations", `${draft.slug}.md`),
    useResolvedContexts: false,
    strictSemanticChecks: true
  });

  const lines = [
    "AUTHORING-PIPELINE-02",
    "",
    "Source:",
    "YouTube",
    "Domain:",
    "Presentation",
    `URL: ${proposal.sourceUrl}`,
    `Video ID: ${proposal.videoId}`,
    "",
    "Proposed metadata:",
    `Title: ${proposal.title || "(missing)"}`,
    `Date: ${proposal.date || "(missing)"}`,
    `Source URL: ${proposal.sourceUrl || "(missing)"}`,
    `Thumbnail: ${proposal.thumbnail || "(missing)"}`,
    `Source type: ${proposal.sourceType || "(missing)"}`,
    ""
  ];

  lines.push(...formatComparison(comparison));
  lines.push("");

  if (validation.errors.length) {
    lines.push("Canonical validation:");
    lines.push("FAIL");
    lines.push("");
    lines.push("Missing / invalid:");
    validation.errors.forEach((item) => {
      lines.push(`${item.field}: ${item.message}`);
    });
    printLines(lines);
    process.exitCode = 1;
    return;
  }

  const preview = await renderPresentationPreview({
    draft,
    keepTemp: options.keepTemp
  });

  lines.push("Canonical validation:");
  lines.push("PASS");
  lines.push("");
  lines.push("Eleventy preview:");
  lines.push("PASS");
  lines.push(`Pages processed: ${preview.pagesProcessed}`);
  lines.push(`Import: ${preview.timings.importMs.toFixed(1)} ms`);
  lines.push(`Init: ${preview.timings.initMs.toFixed(1)} ms`);
  lines.push(`Render: ${preview.timings.renderMs.toFixed(1)} ms`);
  lines.push(`Cold start total: ${preview.timings.totalMs.toFixed(1)} ms`);
  lines.push(`HTML bytes: ${preview.htmlBytes}`);
  lines.push("");
  lines.push(`Preview: ${preview.previewPath}`);

  if (options.write) {
    lines.push("");
    lines.push("Canonical write:");
    if (canonicalMatch) {
      lines.push("BLOCKED");
      lines.push(`Reason: destination already exists (${path.relative(process.cwd(), canonicalMatch.filePath)}).`);
      lines.push("AP-03 does not overwrite existing canonical content.");
      printLines(lines);
      process.exitCode = 1;
      return;
    }
    try {
      const { writePresentationCanonical } = require("./_lib/authoring/canonicalWriter");
      const result = writePresentationCanonical({ draft });
      lines.push("PASS");
      lines.push(`Written: ${path.relative(process.cwd(), result.destination)}`);
      lines.push(`Bytes: ${result.bytesWritten}`);
      lines.push(`Round-trip validation: PASS (${result.roundTrip.warnings.length} warnings)`);
    } catch (err) {
      lines.push("BLOCKED");
      lines.push(`Reason: ${err.message}`);
      printLines(lines);
      process.exitCode = 1;
      return;
    }
  } else {
    lines.push("");
    lines.push("Canonical write: DRY RUN (no --write given). No canonical file modified.");
  }

  printLines(lines);
}

async function runDoiFlow(inputValue, options) {
  const fetchStart = performance.now();
  const proposal = await fetchDoiMetadata(inputValue);
  const metadataFetchMs = performance.now() - fetchStart;
  const canonicalContext = await loadCanonicalPublicationContext();
  const existing = findExistingPublicationByDoi(proposal.doi, canonicalContext);
  const comparison = compareProposalToPublication(proposal, existing);

  const lines = [
    "AUTHORING-PIPELINE-02",
    "",
    "Source:",
    "DOI",
    "Domain:",
    "Publication",
    `DOI: ${proposal.doi}`,
    `DOI URL: ${proposal.doiUrl}`,
    "",
    "Proposed metadata:",
    `Title: ${proposal.title || "(missing)"}`,
    `Authors: ${proposal.authors || "(missing)"}`,
    `Date: ${proposal.date || "(missing)"}`,
    `Journal: ${proposal.journal || "(missing)"}`,
    `Publisher: ${proposal.publisher || "(missing)"}`,
    `Type code proposal: ${proposal.proposedTypeCode || "(missing)"}`,
    `Source URL: ${proposal.sourceUrl || "(missing)"}`,
    "",
    `Metadata fetch: ${metadataFetchMs.toFixed(1)} ms`,
    ""
  ];

  if (existing) {
    lines.push("Canonical duplicate:");
    lines.push("YES");
    lines.push("");
    lines.push(...formatDuplicateComparison(comparison));
    printLines(lines);
    return;
  }

  const draft = buildPublicationDraft({
    proposal,
    manual: options
  });
  const validation = validateCollectionItem({
    collectionName: "publications",
    data: draft.validationData,
    filePath: path.join(process.cwd(), "src", "publications", `${draft.slug}.md`),
    useResolvedContexts: false,
    strictSemanticChecks: true
  });

  lines.push("Canonical duplicate:");
  lines.push("NO");
  lines.push("");

  if (validation.errors.length) {
    lines.push("Canonical validation:");
    lines.push("FAIL");
    lines.push("");
    lines.push("Missing / invalid:");
    validation.errors.forEach((item) => {
      lines.push(`${item.field}: ${item.message}`);
    });
    printLines(lines);
    process.exitCode = 1;
    return;
  }

  const preview = await renderPublicationPreview({
    draft,
    keepTemp: options.keepTemp
  });

  lines.push("Canonical validation:");
  lines.push("PASS");
  lines.push("");
  lines.push("Eleventy preview:");
  lines.push("PASS");
  lines.push(`Pages processed: ${preview.pagesProcessed}`);
  lines.push(`Import: ${preview.timings.importMs.toFixed(1)} ms`);
  lines.push(`Init: ${preview.timings.initMs.toFixed(1)} ms`);
  lines.push(`Render: ${preview.timings.renderMs.toFixed(1)} ms`);
  lines.push(`Cold start total: ${preview.timings.totalMs.toFixed(1)} ms`);
  lines.push(`HTML bytes: ${preview.htmlBytes}`);
  lines.push("");
  lines.push(`Preview: ${preview.previewPath}`);

  if (options.write) {
    lines.push("");
    lines.push("Canonical write: NOT SUPPORTED");
    lines.push("Reason: scientific Publication authority is Research.fi + researchfiContent.");
    lines.push("AP-03 does not create a parallel Publication Markdown store.");
    printLines(lines);
    process.exitCode = 1;
    return;
  }

  printLines(lines);
}

async function main() {
  const { url, options } = parseArgs(process.argv.slice(2));
  if (isYouTubeInput(url)) {
    await runYouTubeFlow(url, options);
    return;
  }

  if (isLikelyDoiInput(url)) {
    await runDoiFlow(url, options);
    return;
  }

  throw new Error("Syöte ei ole tuettu YouTube- tai DOI-lähde");
}

main().catch((error) => {
  process.stderr.write(`AUTHORING-PIPELINE-02\n\nError: ${error.message}\n`);
  if (process.argv.includes("--debug")) {
    process.stderr.write(`${error.stack}\n`);
  }
  process.exitCode = 1;
});
