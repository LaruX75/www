#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "_site");
const reportsDir = path.join(projectRoot, "reports");
const siteUrl = process.env.SITE_URL || "https://www.jarilaru.fi";
const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
const sitemapPath = path.join(outputDir, "sitemap.xml");
const robotsPath = path.join(outputDir, "robots.txt");

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractTagValues(xml, tagName) {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "g");
  const values = [];
  let match = regex.exec(xml);
  while (match) {
    values.push(String(match[1] || "").trim());
    match = regex.exec(xml);
  }
  return values;
}

function mapUrlToOutputPaths(urlString) {
  try {
    const parsed = new URL(urlString);
    const siteHost = new URL(normalizedSiteUrl).host;
    if (parsed.host !== siteHost) return [];

    const toOutputPath = (pathname) => {
      let normalizedPathname = pathname || "/";
      if (normalizedPathname.endsWith("/")) {
        normalizedPathname = `${normalizedPathname}index.html`;
      } else if (!path.extname(normalizedPathname)) {
        normalizedPathname = `${normalizedPathname}/index.html`;
      }
      return path.join(outputDir, normalizedPathname.replace(/^\/+/, ""));
    };

    const rawPath = parsed.pathname || "/";
    const decodedPath = (() => {
      try {
        return decodeURIComponent(rawPath);
      } catch (_) {
        return rawPath;
      }
    })();

    const candidates = [toOutputPath(rawPath)];
    if (decodedPath !== rawPath) {
      candidates.push(toOutputPath(decodedPath));
    }
    return candidates;
  } catch (_) {
    return [];
  }
}

function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    siteUrl: normalizedSiteUrl,
    checks: {
      sitemapFileExists: fs.existsSync(sitemapPath),
      robotsFileExists: fs.existsSync(robotsPath),
      robotsContainsSitemap: false
    },
    summary: {
      sitemapUrlCount: 0,
      sitemapLastmodCount: 0,
      missingOutputFiles: 0
    },
    missingOutputFiles: [],
    warnings: [],
    errors: []
  };

  if (!report.checks.sitemapFileExists) {
    report.errors.push(`Missing file: ${sitemapPath}`);
  }
  if (!report.checks.robotsFileExists) {
    report.errors.push(`Missing file: ${robotsPath}`);
  }

  let sitemapXml = "";
  if (report.checks.sitemapFileExists) {
    sitemapXml = readUtf8(sitemapPath);
    const locs = extractTagValues(sitemapXml, "loc");
    const lastmods = extractTagValues(sitemapXml, "lastmod");
    report.summary.sitemapUrlCount = locs.length;
    report.summary.sitemapLastmodCount = lastmods.length;

    if (locs.length === 0) {
      report.errors.push("Sitemap has no <loc> URLs.");
    }
    if (lastmods.length === 0) {
      report.warnings.push("Sitemap has no <lastmod> entries.");
    }

    locs.forEach((loc) => {
      const candidatePaths = mapUrlToOutputPaths(loc);
      if (candidatePaths.length === 0) return;
      const existingMatch = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
      if (!existingMatch) {
        report.missingOutputFiles.push({
          url: loc,
          expectedFile: candidatePaths[0]
        });
      }
    });
    report.summary.missingOutputFiles = report.missingOutputFiles.length;
  }

  if (report.checks.robotsFileExists) {
    const robots = readUtf8(robotsPath);
    const expectedSitemapLine = `Sitemap: ${normalizedSiteUrl}/sitemap.xml`;
    report.checks.robotsContainsSitemap = robots.includes(expectedSitemapLine);
    if (!report.checks.robotsContainsSitemap) {
      report.errors.push(`robots.txt missing line: ${expectedSitemapLine}`);
    }
  }

  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "seo-health.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const isFailing = report.errors.length > 0 || report.summary.missingOutputFiles > 0;
  const status = isFailing ? "FAIL" : "OK";
  console.log(
    `[seo-health] ${status} | urls=${report.summary.sitemapUrlCount} lastmod=${report.summary.sitemapLastmodCount} missingFiles=${report.summary.missingOutputFiles} report=${reportPath}`
  );

  if (report.warnings.length) {
    report.warnings.forEach((warning) => console.warn(`[seo-health] WARN: ${warning}`));
  }
  if (report.errors.length) {
    report.errors.forEach((error) => console.error(`[seo-health] ERROR: ${error}`));
  }

  if (isFailing) {
    process.exit(1);
  }
}

main();
