const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { slugifyTerm } = require("../../../src/_data/metadata-normalization");
const { normalizeYouTubeUrl } = require("./youtubeMetadata");

const PRESENTATIONS_DIR = path.join(process.cwd(), "src", "presentations");
const AUTHORING_TEMP_PATTERN = /^(?:__authoring-preview-|authoring-preview-|zz-authoring-preview-)/;

function walkPresentationFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPresentationFiles(fullPath, results);
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      !AUTHORING_TEMP_PATTERN.test(entry.name)
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

function safeNormalizeYouTubeUrl(value) {
  try {
    return normalizeYouTubeUrl(value).sourceUrl;
  } catch (_) {
    return "";
  }
}

function normalizeCanonicalDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const raw = String(value).trim();
  const iso = raw.match(/^\d{4}-\d{2}-\d{2}/);
  return iso ? iso[0] : raw;
}

function loadPresentationFrontMatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return {
    filePath,
    slug: path.basename(filePath, ".md"),
    frontMatter: parsed.data || {},
    body: String(parsed.content || "").trim()
  };
}

function findExistingPresentationBySourceUrl(sourceUrl) {
  const wantedUrl = safeNormalizeYouTubeUrl(sourceUrl) || String(sourceUrl || "").trim();
  if (!wantedUrl) return null;

  for (const filePath of walkPresentationFiles(PRESENTATIONS_DIR)) {
    const parsed = loadPresentationFrontMatter(filePath);
    const candidateUrl = safeNormalizeYouTubeUrl(parsed.frontMatter.sourceUrl || parsed.frontMatter.url || "");
    if (candidateUrl && candidateUrl === wantedUrl) {
      return parsed;
    }
  }

  return null;
}

function buildDraftBody({ proposal }) {
  const lines = [];

  if (proposal.description) {
    lines.push(proposal.description);
    lines.push("");
  }

  lines.push(`[Katso tallenne YouTubessa](${proposal.sourceUrl})`);

  return `${lines.join("\n")}\n`;
}

function buildPresentationDraft({
  proposal,
  manual = {},
  canonicalMatch = null
}) {
  const slug = String(manual.slug || canonicalMatch?.slug || slugifyTerm(proposal.title) || "").trim();
  if (!slug) {
    throw new Error("Slugia ei voitu muodostaa otsikosta");
  }

  const contexts = Array.isArray(manual.contexts)
    ? manual.contexts.filter(Boolean)
    : [];
  const type = String(manual.type || "").trim();
  const pageUrl = `/presentations/${slug}/`;

  const frontMatter = {
    title: proposal.title,
    description: proposal.description || "",
    date: proposal.date || "",
    url: proposal.sourceUrl,
    sourceUrl: proposal.sourceUrl,
    thumbnail: proposal.thumbnail || "",
    source: "youtube",
    type,
    permalink: pageUrl,
    layout: "presentation-item.njk",
    templateEngineOverride: "md"
  };

  if (contexts.length) frontMatter.contexts = contexts;

  return {
    slug,
    pageUrl,
    frontMatter,
    body: buildDraftBody({ proposal })
  };
}

function compareProposalToCanonical(proposal, canonicalMatch) {
  if (!canonicalMatch) return null;

  const canonical = canonicalMatch.frontMatter || {};
  const canonicalSourceUrl = safeNormalizeYouTubeUrl(canonical.sourceUrl || canonical.url || "");

  return {
    filePath: canonicalMatch.filePath,
    slug: canonicalMatch.slug,
    fields: [
      {
        field: "title",
        proposed: proposal.title || "",
        canonical: String(canonical.title || "").trim(),
        matches: String(proposal.title || "").trim() === String(canonical.title || "").trim()
      },
      {
        field: "date",
        proposed: proposal.date || "",
        canonical: normalizeCanonicalDate(canonical.date),
        matches: String(proposal.date || "") === normalizeCanonicalDate(canonical.date)
      },
      {
        field: "sourceUrl",
        proposed: proposal.sourceUrl || "",
        canonical: canonicalSourceUrl,
        matches: String(proposal.sourceUrl || "") === canonicalSourceUrl
      },
      {
        field: "thumbnail",
        proposed: proposal.thumbnail || "",
        canonical: String(canonical.thumbnail || "").trim(),
        matches: String(proposal.thumbnail || "").trim() === String(canonical.thumbnail || "").trim()
      }
    ]
  };
}

module.exports = {
  buildPresentationDraft,
  compareProposalToCanonical,
  findExistingPresentationBySourceUrl,
  normalizeCanonicalDate
};
