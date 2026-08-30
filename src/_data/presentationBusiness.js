/**
 * RP-CONVERGE-01 (resumed) — canonical projection of Presentations
 * whose frontmatter EXPLICITLY declares membership in the `business`
 * context (i.e., `/kouluttaja/` hub per CONTEXT_META.business.href).
 *
 * IMPORTANT: this projection reads RAW frontmatter `contexts` directly
 * from each Presentation Markdown file. It DOES NOT read the resolved
 * contexts value produced by resolveContexts()/inferContexts() in the
 * Eleventy data pipeline. That distinction is deliberate: after
 * PRES-CONTEXT1, the company-page selection must use editorial
 * authority only (explicit frontmatter declaration), never
 * inference-derived context membership.
 *
 * Refs:
 * - docs/pres-context1-presentation-business-context-reconciliation-2026-08-30.md
 * - docs/rp-converge-01-company-presentations-convergence-2026-08-30.md
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const PRESENTATIONS_DIR = path.join(__dirname, "..", "presentations");

function toIsoDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function readPresentationFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  try {
    return yaml.load(m[1]) || {};
  } catch (_e) {
    return null;
  }
}

module.exports = function presentationBusiness() {
  if (!fs.existsSync(PRESENTATIONS_DIR)) return { items: [] };

  const items = [];
  for (const name of fs.readdirSync(PRESENTATIONS_DIR)) {
    if (!name.endsWith(".md")) continue;
    const filePath = path.join(PRESENTATIONS_DIR, name);
    const fm = readPresentationFrontmatter(filePath);
    if (!fm) continue;

    const explicitContexts = Array.isArray(fm.contexts) ? fm.contexts : [];
    if (!explicitContexts.includes("business")) continue;

    const baseName = name.replace(/\.md$/, "");
    items.push({
      file: name,
      baseName,
      title: fm.title || "",
      date: toIsoDate(fm.date),
      pageUrl: fm.pageUrl || `/presentations/${baseName}/`,
      externalUrl: fm.url || "",
      sourceUrl: fm.sourceUrl || fm.url || ""
    });
  }

  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    items,
    total: items.length
  };
};
