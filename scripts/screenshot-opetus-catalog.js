#!/usr/bin/env node
/*
 * OPETUS-CATALOG-UX-01 visual QA — captures /opetus/ screenshots at
 * 1440px desktop and 390px mobile against the fresh built _site.
 */

const path = require("path");
const fs = require("fs");
const http = require("http");
const { chromium } = require("playwright");

const PORT = 4899;
const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const OUT_DIR = path.join(ROOT, "outputs", "opetus-catalog-ux-01");
fs.mkdirSync(OUT_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon"
};

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split("?")[0]);
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const filePath = path.join(SITE, urlPath);
      if (!filePath.startsWith(SITE)) {
        res.statusCode = 403; res.end("forbidden"); return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.statusCode = 404; res.end("not found"); return; }
        res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
        res.end(data);
      });
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  const server = await serve();
  const browser = await chromium.launch();
  try {
    // Desktop 1440x900
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const dPage = await desktop.newPage();
    await dPage.goto(`http://127.0.0.1:${PORT}/opetus/`, { waitUntil: "networkidle" });
    await dPage.screenshot({
      path: path.join(OUT_DIR, "opetus_desktop_1440_above_fold.png"),
      clip: { x: 0, y: 0, width: 1440, height: 900 }
    });
    await dPage.screenshot({
      path: path.join(OUT_DIR, "opetus_desktop_1440_full.png"),
      fullPage: true
    });
    // Count visible catalog cards + rows in the first viewport
    const desktopMetrics = await dPage.evaluate(() => {
      function inViewport(el) {
        const r = el.getBoundingClientRect();
        return r.top < 900 && r.bottom > 0;
      }
      const cards = Array.from(document.querySelectorAll("[data-opetus-course]"));
      const rows = Array.from(document.querySelectorAll("[data-opetus-implementation]"));
      // The implementation link IS the row (list-group-item-action pattern),
      // so link hit area = row bounding rect.
      const linkRects = rows
        .filter((r) => r.tagName === "A")
        .map((r) => {
          const rect = r.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        });
      return {
        totalCourses: cards.length,
        totalImplementations: rows.length,
        coursesAboveFold: cards.filter(inViewport).length,
        implementationsAboveFold: rows.filter(inViewport).length,
        firstCardRect: cards[0] ? cards[0].getBoundingClientRect().toJSON() : null,
        firstRowRect: rows[0] ? rows[0].getBoundingClientRect().toJSON() : null,
        implementationLinkRects: linkRects,
        implementationLinkTag: rows[0] ? rows[0].tagName : null,
        catalogHeight: Math.round(document.querySelector("[data-opetus-catalog]")?.getBoundingClientRect().height),
        catalogTop: Math.round(document.querySelector("[data-opetus-catalog]")?.getBoundingClientRect().top)
      };
    });
    await desktop.close();

    // Mobile 390x844 (iPhone 13/14 default)
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const mPage = await mobile.newPage();
    await mPage.goto(`http://127.0.0.1:${PORT}/opetus/`, { waitUntil: "networkidle" });
    await mPage.screenshot({
      path: path.join(OUT_DIR, "opetus_mobile_390_above_fold.png"),
      clip: { x: 0, y: 0, width: 390, height: 844 }
    });
    await mPage.screenshot({
      path: path.join(OUT_DIR, "opetus_mobile_390_full.png"),
      fullPage: true
    });
    const mobileMetrics = await mPage.evaluate(() => {
      const cards = document.querySelectorAll("[data-opetus-course]");
      const rows = Array.from(document.querySelectorAll("[data-opetus-implementation]"));
      const linkRects = rows
        .filter((r) => r.tagName === "A")
        .map((r) => {
          const rect = r.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        });
      const doc = document.documentElement;
      return {
        totalCourses: cards.length,
        totalImplementations: rows.length,
        implementationLinkTag: rows[0] ? rows[0].tagName : null,
        implementationLinkRects: linkRects,
        // WCAG 2.5.5 Level AAA minimum: 44x44 CSS px
        allLinksMeet44px: linkRects.every((r) => r.height >= 44 && r.width >= 44),
        docWidth: doc.scrollWidth,
        docHeight: doc.scrollHeight,
        hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth
      };
    });
    await mobile.close();

    fs.writeFileSync(path.join(OUT_DIR, "metrics.json"), JSON.stringify({
      desktop: desktopMetrics,
      mobile: mobileMetrics,
      capturedAt: new Date().toISOString()
    }, null, 2));

    console.log("=== DESKTOP 1440x900 ===");
    console.log(JSON.stringify(desktopMetrics, null, 2));
    console.log("=== MOBILE 390x844 ===");
    console.log(JSON.stringify(mobileMetrics, null, 2));
    console.log("=== SCREENSHOTS ===");
    fs.readdirSync(OUT_DIR).forEach((f) => console.log("  ", path.join("outputs/opetus-catalog-ux-01", f)));
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
