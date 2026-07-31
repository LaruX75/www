#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "_site");
const reportsDir = path.join(projectRoot, "reports");
const reportPath = path.join(reportsDir, "jsonld-validation.json");

const JSONLD_RE = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;

const ARTICLE_TYPES = new Set([
  "Article",
  "BlogPosting",
  "NewsArticle",
  "OpinionNewsArticle",
  "ScholarlyArticle",
]);

function walkHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api" || entry.name.startsWith(".")) continue;
      walkHtml(full, files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

function extractBlocks(html) {
  const blocks = [];
  let match;
  JSONLD_RE.lastIndex = 0;
  while ((match = JSONLD_RE.exec(html))) {
    blocks.push({ raw: match[1], index: match.index });
  }
  return blocks;
}

function validateNode(node, ctx) {
  const issues = [];
  const type = node["@type"];
  if (!node["@context"] && !ctx.hasGraphContext) {
    issues.push({ level: "error", rule: "missing-context", message: "Puuttuu @context" });
  }
  if (!type) {
    issues.push({ level: "error", rule: "missing-type", message: "Puuttuu @type" });
    return issues;
  }

  if (typeof type === "string" && ARTICLE_TYPES.has(type)) {
    if (!node.headline) issues.push({ level: "error", rule: "article-headline", message: `${type}: headline puuttuu` });
    if (node.headline && node.headline.length > 110) {
      issues.push({ level: "warn", rule: "article-headline-length", message: `${type}: headline > 110 merkkiä (${node.headline.length})` });
    }
    if (!node.datePublished) issues.push({ level: "error", rule: "article-datepublished", message: `${type}: datePublished puuttuu` });
    if (!node.author) issues.push({ level: "error", rule: "article-author", message: `${type}: author puuttuu` });
    if (!node.image) issues.push({ level: "warn", rule: "article-image", message: `${type}: image puuttuu` });
    if (!node.publisher) issues.push({ level: "warn", rule: "article-publisher", message: `${type}: publisher puuttuu` });
  }

  if (type === "BreadcrumbList") {
    if (!Array.isArray(node.itemListElement) || node.itemListElement.length === 0) {
      issues.push({ level: "error", rule: "breadcrumb-empty", message: "BreadcrumbList: itemListElement tyhjä" });
    } else {
      node.itemListElement.forEach((item, idx) => {
        if (!item || item["@type"] !== "ListItem") {
          issues.push({ level: "error", rule: "breadcrumb-item-type", message: `BreadcrumbList[${idx}]: @type != ListItem` });
        }
        if (!item.name) {
          issues.push({ level: "error", rule: "breadcrumb-item-name", message: `BreadcrumbList[${idx}]: name puuttuu` });
        }
        if (typeof item.position !== "number") {
          issues.push({ level: "error", rule: "breadcrumb-item-position", message: `BreadcrumbList[${idx}]: position ei numero` });
        }
      });
    }
  }

  if (type === "Person") {
    if (!node.name) issues.push({ level: "error", rule: "person-name", message: "Person: name puuttuu" });
    if (!node.url) issues.push({ level: "warn", rule: "person-url", message: "Person: url puuttuu" });
  }

  if (type === "WebSite") {
    if (!node.name) issues.push({ level: "error", rule: "website-name", message: "WebSite: name puuttuu" });
    if (!node.url) issues.push({ level: "error", rule: "website-url", message: "WebSite: url puuttuu" });
  }

  if (type === "PresentationDigitalDocument") {
    if (!node.name) issues.push({ level: "error", rule: "presentation-name", message: "PresentationDigitalDocument: name puuttuu" });
    if (!node.url) issues.push({ level: "warn", rule: "presentation-url", message: "PresentationDigitalDocument: url puuttuu" });
  }

  if (type === "LocalBusiness" || type === "Organization") {
    if (!node.name) issues.push({ level: "error", rule: "business-name", message: `${type}: name puuttuu` });
    if (!node.url) issues.push({ level: "warn", rule: "business-url", message: `${type}: url puuttuu` });
  }

  if (type === "Thesis") {
    if (!node.name) issues.push({ level: "error", rule: "thesis-name", message: "Thesis: name puuttuu" });
    if (!node.author) issues.push({ level: "error", rule: "thesis-author", message: "Thesis: author puuttuu" });
    if (!node.datePublished) issues.push({ level: "warn", rule: "thesis-datepublished", message: "Thesis: datePublished puuttuu" });
  }

  const allJsonStr = JSON.stringify(node);
  if (allJsonStr.includes("&quot;") || allJsonStr.includes("&amp;amp;") || allJsonStr.includes("&#39;")) {
    issues.push({ level: "error", rule: "html-entity-leak", message: `${type}: HTML-entiteettejä JSON-arvoissa (&quot;/&amp;)` });
  }

  return issues;
}

function walkGraph(root, ctx) {
  const issues = [];
  if (Array.isArray(root)) {
    root.forEach((n) => issues.push(...walkGraph(n, ctx)));
  } else if (root && typeof root === "object") {
    if (Array.isArray(root["@graph"])) {
      const childCtx = { hasGraphContext: !!root["@context"] };
      root["@graph"].forEach((n) => issues.push(...validateNode(n, childCtx)));
    } else {
      issues.push(...validateNode(root, ctx));
    }
  }
  return issues;
}

function relative(p) {
  return path.relative(outputDir, p);
}

function main() {
  if (!fs.existsSync(outputDir)) {
    console.error(`[check-jsonld] _site puuttuu: ${outputDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const files = walkHtml(outputDir);
  const perTypeCounts = new Map();
  const issuesByRule = new Map();
  const fileIssues = [];
  let totalBlocks = 0;
  let parseErrors = 0;

  for (const file of files) {
    let html;
    try {
      html = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (!html.includes("application/ld+json")) continue;

    const blocks = extractBlocks(html);
    totalBlocks += blocks.length;
    const perFileIssues = [];

    for (const block of blocks) {
      let parsed;
      try {
        parsed = JSON.parse(block.raw);
      } catch (err) {
        parseErrors += 1;
        perFileIssues.push({ level: "error", rule: "json-parse", message: `JSON-parsevirhe: ${err.message}` });
        continue;
      }

      const rootNodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of rootNodes) {
        if (node && typeof node === "object") {
          if (Array.isArray(node["@graph"])) {
            for (const g of node["@graph"]) {
              const t = g && g["@type"];
              if (t) perTypeCounts.set(String(t), (perTypeCounts.get(String(t)) || 0) + 1);
            }
          } else {
            const t = node["@type"];
            if (t) perTypeCounts.set(String(t), (perTypeCounts.get(String(t)) || 0) + 1);
          }
        }
        const nodeIssues = walkGraph(node, { hasGraphContext: false });
        perFileIssues.push(...nodeIssues);
      }
    }

    if (perFileIssues.length) {
      fileIssues.push({ file: relative(file), issues: perFileIssues });
      for (const iss of perFileIssues) {
        issuesByRule.set(iss.rule, (issuesByRule.get(iss.rule) || 0) + 1);
      }
    }
  }

  const errorCount = fileIssues.reduce((sum, f) => sum + f.issues.filter((i) => i.level === "error").length, 0);
  const warnCount = fileIssues.reduce((sum, f) => sum + f.issues.filter((i) => i.level === "warn").length, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    filesScanned: files.length,
    filesWithJsonLd: files.filter((f) => {
      try {
        return fs.readFileSync(f, "utf8").includes("application/ld+json");
      } catch {
        return false;
      }
    }).length,
    totalBlocks,
    parseErrors,
    errorCount,
    warnCount,
    typeCounts: Object.fromEntries([...perTypeCounts.entries()].sort((a, b) => b[1] - a[1])),
    issuesByRule: Object.fromEntries([...issuesByRule.entries()].sort((a, b) => b[1] - a[1])),
    files: fileIssues.slice(0, 200),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`[check-jsonld] filesScanned=${report.filesScanned} withLd=${report.filesWithJsonLd} blocks=${totalBlocks} errors=${errorCount} warnings=${warnCount} parseErrors=${parseErrors}`);
  console.log(`[check-jsonld] tyypit:`);
  for (const [t, c] of Object.entries(report.typeCounts)) {
    console.log(`  ${t}: ${c}`);
  }
  if (Object.keys(report.issuesByRule).length) {
    console.log(`[check-jsonld] ongelmasäännöt:`);
    for (const [r, c] of Object.entries(report.issuesByRule)) {
      console.log(`  ${r}: ${c}`);
    }
  }
  console.log(`[check-jsonld] raportti: ${path.relative(projectRoot, reportPath)}`);

  if (errorCount > 0 || parseErrors > 0) process.exit(2);
}

main();
