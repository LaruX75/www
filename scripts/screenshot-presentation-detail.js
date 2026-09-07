#!/usr/bin/env node
/*
 * DETAIL-HERO-UX-02 + PRESENTATION-COMPOSITION-01 visual QA — captures
 * representative Presentation detail pages at 1440 and 390 for
 * before/after comparison.
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const PORT = 4901;
const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const OUT_DIR = path.join(ROOT, "outputs", "detail-hero-ux-02");
fs.mkdirSync(OUT_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".woff": "font/woff",
  ".woff2": "font/woff2", ".ico": "image/x-icon"
};

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split("?")[0]);
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const filePath = path.join(SITE, urlPath);
      if (!filePath.startsWith(SITE)) { res.statusCode = 403; return res.end("forbidden"); }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.statusCode = 404; return res.end("not found"); }
        res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
        res.end(data);
      });
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

const PAGES = [
  { slug: "ss-luento-3-suunnittelu-ja-pedagogiset-mallit-410014y-tieto-ja-viestintatekniikka-p", label: "presentation-luento-3-historical-slideshare-formerly-dirty" },
  { slug: "ss-luento1-johdanto-410014y-tvt-pedagogiset-perusteet", label: "presentation-luento-1-2013-genuine-lead" },
  { slug: "405040y-luento-1-johdanto-2026-a", label: "presentation-405040y-current-impl" },
  { slug: "ss-410014y-luento-2-taman-vuosisadan-ydintaidot-21th-skills-ja-koulun-muutospaineet", label: "presentation-luento-2-2014-historical-formerly-dirty" },
  { slug: "opettaja-teko-lyn-ja-lytt-myyden-turbulenssissa-tampere-2025", label: "presentation-canva" },
  { slug: "eduxr-2020-suunnanmuutos-digiopettajasta-etaopettajaksi", label: "presentation-youtube" },
  { slug: "opi-oulu-2026-tekoalyaiheinen-paneelikeskustelu", label: "presentation-no-thumbnail" }
];

async function main() {
  const server = await serve();
  const browser = await chromium.launch();
  try {
    for (const p of PAGES) {
      const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const dp = await desktop.newPage();
      const desktopResponse = await dp.goto(`http://127.0.0.1:${PORT}/presentations/${p.slug}/`, { waitUntil: "networkidle" });
      if (!desktopResponse || !desktopResponse.ok()) {
        throw new Error(`Desktop capture failed for ${p.slug}: HTTP ${desktopResponse?.status() || "no response"}`);
      }
      const desktopMetrics = await dp.evaluate(() => {
        const h1 = document.querySelector("h1.content-detail-title");
        const lead = document.querySelector("p.content-detail-lead");
        const thumb = document.querySelector("a.content-detail-thumb, .content-detail-thumb img");
        const hero = document.querySelector("section.content-detail-hero");
        const kurssiSection = document.querySelector("section[aria-labelledby='kurssitoteutus-heading']");
        const primaryAction = document.querySelector(".content-detail-actions .btn-primary");
        function r(el){ if(!el) return null; const b=el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; }
        return {
          h1: { rect: r(h1), text: h1 ? h1.textContent.trim().slice(0, 80) : null, hasCompact: h1 ? h1.className.includes("content-detail-title--compact") : false },
          lead: lead ? { rect: r(lead), textLen: lead.textContent.length, first80: lead.textContent.trim().slice(0, 80) } : null,
          thumb: r(thumb),
          hero: r(hero),
          primaryAction: r(primaryAction),
          kurssitoteutus: kurssiSection ? { rect: r(kurssiSection), h2: kurssiSection.querySelector("h2")?.textContent.trim(), hasPeers: !!kurssiSection.querySelector(".course-peer-item") } : null
        };
      });
      await dp.screenshot({ path: path.join(OUT_DIR, `${p.label}_desktop_1440.png`), clip: { x: 0, y: 0, width: 1440, height: 900 } });
      await desktop.close();

      const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
      const mp = await mobile.newPage();
      const mobileResponse = await mp.goto(`http://127.0.0.1:${PORT}/presentations/${p.slug}/`, { waitUntil: "networkidle" });
      if (!mobileResponse || !mobileResponse.ok()) {
        throw new Error(`Mobile capture failed for ${p.slug}: HTTP ${mobileResponse?.status() || "no response"}`);
      }
      const mobileMetrics = await mp.evaluate(() => {
        const doc = document.documentElement;
        const primaryAction = document.querySelector(".content-detail-actions .btn-primary");
        const actionRect = primaryAction?.getBoundingClientRect();
        return {
          docWidth: doc.scrollWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth,
          primaryAction: actionRect ? { w: Math.round(actionRect.width), h: Math.round(actionRect.height) } : null
        };
      });
      await mp.screenshot({ path: path.join(OUT_DIR, `${p.label}_mobile_390.png`), clip: { x: 0, y: 0, width: 390, height: 844 } });
      await mobile.close();

      console.log(`=== ${p.label} ===`);
      console.log(JSON.stringify(desktopMetrics, null, 2));
      console.log("mobile:", JSON.stringify(mobileMetrics));
      console.log();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
