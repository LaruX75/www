#!/usr/bin/env node

const path = require("path");
const {
  validateCollectionItem
} = require("../src/_utils/canonicalContentValidation");
const {
  fetchYouTubeMetadata
} = require("./_lib/authoring/youtubeMetadata");
const {
  buildPresentationDraft,
  compareProposalToCanonical,
  findExistingPresentationBySourceUrl
} = require("./_lib/authoring/presentationDraft");
const {
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

    if (token === "--keep-temp") {
      options.keepTemp = true;
      continue;
    }

    if (token === "--debug") {
      options.debug = true;
      continue;
    }

    throw new Error(`Tuntematon argumentti: ${token}`);
  }

  if (!url) {
    throw new Error('Usage: npm run author:preview -- "<youtube-url>" [--type esitys] [--contexts teaching,business]');
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

async function main() {
  const { url, options } = parseArgs(process.argv.slice(2));
  const proposal = await fetchYouTubeMetadata(url);
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
    "AUTHORING-PIPELINE-01",
    "",
    "Source:",
    "YouTube",
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
  printLines(lines);
}

main().catch((error) => {
  process.stderr.write(`AUTHORING-PIPELINE-01\n\nError: ${error.message}\n`);
  if (process.argv.includes("--debug")) {
    process.stderr.write(`${error.stack}\n`);
  }
  process.exitCode = 1;
});
