#!/usr/bin/env node
/*
 * audit-peppi-courses.js — PEPPI-BROWSER-CURATION-01 proof-of-concept.
 *
 * Developer-only audit tool. Not part of the site build. Not part of the
 * CI test pipeline. Never mutates canonical data.
 *
 * Behaves like a normal browser:
 *   - launches headless Chromium via Playwright
 *   - visits public opas.peppi.oulu.fi pages
 *   - waits for the Angular SPA to render
 *   - reads visible DOM
 *   - observes public XHR/fetch responses for audit evidence
 *   - writes developer-only outputs under outputs/peppi-browser-curation/
 *
 * Ethical bounds:
 *   - one browser session, short list of exact course lookups
 *   - short delays between navigations
 *   - no unauthenticated API brute-forcing
 *   - no crawling of unrelated study programmes
 *
 * Run:
 *   npm run audit:peppi
 *   PEPPI_HEADED=1 npm run audit:peppi      # open a visible browser
 *   PEPPI_SCREENSHOTS=1 npm run audit:peppi # retain local PNG evidence
 *   PEPPI_COURSES=405040Y npm run audit:peppi   # limit courses
 */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const {
  historicalCourseEvidence,
  implementationSummaries
} = require("./_lib/peppiAuditParser");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "outputs", "peppi-browser-curation");
const SCREENSHOTS_DIR = path.join(OUT_DIR, "screenshots");

const BASE = "https://opas.peppi.oulu.fi";
const NAV_TIMEOUT_MS = 30000;
const RENDER_TIMEOUT_MS = 15000;
const DELAY_BETWEEN_MS = 1500;

const HEADED = process.env.PEPPI_HEADED === "1";
const CAPTURE_SCREENSHOTS = process.env.PEPPI_SCREENSHOTS === "1";
const COURSE_FILTER = (process.env.PEPPI_COURSES || "").split(",").map((s) => s.trim()).filter(Boolean);

/*
 * Probe plan. Deliberately tiny: 3 courses. For 405040Y we hit the known
 * direct URL. For historical codes we use the public search route.
 */
const PROBES = [
  {
    courseCode: "405040Y",
    kind: "direct",
    url: `${BASE}/fi/opintojakso/405040Y/28004?period=2026-2027`,
    studyGuideYear: "2026-2027",
    note: "Current implementation — canonical peppiUrl in src/opetus/teknologiatuettu-oppiminen-2026-a.md",
  },
  ...expandHistoricalProbes("410014Y", [
    "2011-2012", "2012-2013", "2013-2014", "2014-2015", "2015-2016",
  ]),
  ...expandHistoricalProbes("410017Y", [
    "2011-2012", "2012-2013", "2013-2014", "2014-2015",
  ]),
];

function expandHistoricalProbes(code, years) {
  return years.map((year) => ({
    courseCode: code,
    kind: "search",
    url: `${BASE}/fi/haku/${code}?period=${year}`,
    studyGuideYear: year,
    note: `Historical candidate for ${code}`,
  }));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function iso() {
  return new Date().toISOString();
}

function ensureDirs() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (CAPTURE_SCREENSHOTS) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function safeSlug(str) {
  return String(str).replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
}

/*
 * Waits for the Angular SPA "Loading..." shell to disappear.
 * Returns whether meaningful content was observed.
 */
async function waitForSpaRender(page) {
  try {
    // The SPA shell has <p>Loading...</p> inside <app-root>. Real content
    // replaces that. Wait either for a heading/course-code-like element,
    // or for the loading text to vanish.
    await page.waitForFunction(
      () => {
        const root = document.querySelector("app-root");
        if (!root) return false;
        const text = (root.textContent || "").trim();
        // Loading shell is short and contains only "Loading..."
        if (text === "Loading..." || text.length < 30) return false;
        return true;
      },
      { timeout: RENDER_TIMEOUT_MS }
    );
    return true;
  } catch {
    return false;
  }
}

/*
 * Extracts what is visible on a rendered Peppi course/implementation
 * page. Uses semantic queries (headings, dt/dd, links) over CSS selectors
 * where possible.
 */
async function extractCoursePageData(page) {
  return await page.evaluate(() => {
    function textOf(el) {
      return (el?.textContent || "").trim().replace(/\s+/g, " ");
    }
    function nearest(el, selector) {
      return el?.closest(selector) || null;
    }

    const root = document.querySelector("app-root");
    if (!root) return { visible: false };

    const bodyText = (root.textContent || "").trim();

    // Try heading structure
    const h1 = root.querySelector("h1");
    const h2s = Array.from(root.querySelectorAll("h2")).map((h) => textOf(h));

    // Look for "dt / dd" or "label / value" pairs commonly used by Peppi
    const dtdd = [];
    root.querySelectorAll("dl").forEach((dl) => {
      const dts = dl.querySelectorAll("dt");
      dts.forEach((dt) => {
        const dd = dt.nextElementSibling;
        if (dd && dd.tagName === "DD") {
          dtdd.push({ label: textOf(dt), value: textOf(dd) });
        }
      });
    });

    // Try to detect a course-code chip and credits chip
    const codeMatch = bodyText.match(/\b(\d{3,6}[A-Z]{1,2})\b/);
    const opMatch = bodyText.match(/(\d+(?:[.,]\d+)?)\s*op\b/i);

    // Realizations list — Peppi uses the CSS token "realization" in its
    // Angular components. Try to enumerate them without over-fitting.
    const realizationEls = Array.from(
      root.querySelectorAll("[class*='realization']")
    );
    const realizations = realizationEls.map((el) => {
      const text = textOf(el);
      const anchor = el.querySelector("a[href]") || nearest(el, "a[href]");
      const href = anchor ? anchor.getAttribute("href") : null;
      return {
        text: text.length > 400 ? text.slice(0, 400) + "…" : text,
        href,
      };
    });

    // Look for all internal links to Peppi resources for further probing
    const internalLinks = Array.from(root.querySelectorAll("a[href]"))
      .map((a) => ({
        text: textOf(a),
        href: a.getAttribute("href"),
      }))
      .filter((l) => l.href && (l.href.startsWith("/") || l.href.startsWith("http")))
      .filter((l) => l.href.includes("/opintojakso/") || l.href.includes("/haku/") || l.href.includes("/arkisto/") || l.href.includes("/ohjelma/"))
      .slice(0, 40);

    // Look for common Peppi labels
    function findLabelValue(labelRe) {
      // dl-based already handled; try inline label patterns.
      const spans = Array.from(root.querySelectorAll("span,div,li,p"));
      for (const el of spans) {
        const t = textOf(el);
        const m = t.match(labelRe);
        if (m) return m[1] ? m[1].trim() : null;
      }
      return null;
    }

    return {
      visible: true,
      bodyLength: bodyText.length,
      h1: textOf(h1),
      h2s,
      dtdd,
      detectedCourseCode: codeMatch ? codeMatch[1] : null,
      detectedCredits: opMatch ? opMatch[1] + " op" : null,
      realizations,
      internalLinks,
      startDate: findLabelValue(/Alkamispäivä\s*[:\-]?\s*([0-9.]+)/i),
      endDate: findLabelValue(/Päättymispäivä\s*[:\-]?\s*([0-9.]+)/i),
      teachingPeriodHint: findLabelValue(/Opetusperiodi\s*[:\-]?\s*(\S+)/i)
        || findLabelValue(/Periodi\s*[:\-]?\s*(\S+)/i),
      teachers: (() => {
        const label = /Vastuuopetta|Opettaja|Opetuksesta vastaava/i;
        const spans = Array.from(root.querySelectorAll("dt,label,strong,h3,h4"));
        for (const el of spans) {
          const t = textOf(el);
          if (label.test(t)) {
            const sibling = el.nextElementSibling;
            return sibling ? textOf(sibling) : null;
          }
        }
        return null;
      })(),
    };
  });
}

function relevantApiPath(probe) {
  if (probe.kind === "search") {
    return `/api/lu/units/${probe.courseCode}/COURSE_UNIT`;
  }

  const match = String(probe.url || "").match(/\/opintojakso\/[^/]+\/(\d+)/);
  return match ? `/api/course/${match[1]}` : "";
}

async function waitForRelevantApiResponse(page, probe) {
  const expectedPath = relevantApiPath(probe);
  if (!expectedPath) return false;

  try {
    await page.waitForResponse((response) => {
      try {
        const url = new URL(response.url());
        return url.pathname === expectedPath
          && url.searchParams.get("period") === probe.studyGuideYear;
      } catch {
        return false;
      }
    }, { timeout: RENDER_TIMEOUT_MS });
    return true;
  } catch {
    return false;
  }
}

async function waitForDirectImplementationRows(page, courseCode) {
  try {
    await page.waitForFunction((code) => Array.from(
      document.querySelectorAll("[class*='realization']")
    ).some((element) => new RegExp(`\\b${code}-\\d+\\b`).test(element.textContent || "")), courseCode, {
      timeout: RENDER_TIMEOUT_MS
    });
    return true;
  } catch {
    return false;
  }
}

async function probeOnce(context, probe, networkSink) {
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);

  const perProbeNetwork = [];
  const networkTasks = [];
  page.on("response", (resp) => {
    const url = resp.url();
    if (!url.includes("peppi.oulu.fi")) return;
    if (!/\/(api|education|realizations|programme|organisation)\b/.test(url)) return;
    networkTasks.push((async () => {
      let contentType = "";
      try { contentType = resp.headers()["content-type"] || ""; } catch {}
      let bodyPreview = null;
      try {
        const buf = await resp.body();
        const isJson = contentType.includes("application/json") || (buf.length > 0 && "{[".includes(String.fromCharCode(buf[0])));
        bodyPreview = isJson ? buf.toString("utf8").slice(0, 500) : `[${buf.length} bytes ${contentType}]`;
      } catch (e) {
        bodyPreview = `[body-not-available: ${e.message}]`;
      }
      perProbeNetwork.push({
        url,
        method: resp.request().method(),
        status: resp.status(),
        contentType,
        bodyPreview,
      });
    })());
  });

  const result = {
    courseCode: probe.courseCode,
    kind: probe.kind,
    url: probe.url,
    studyGuideYear: probe.studyGuideYear,
    status: "UNKNOWN",
    finalUrl: null,
    httpStatus: null,
    render: null,
    dom: null,
    network: perProbeNetwork,
    screenshot: null,
    retrievedAt: iso(),
    note: probe.note || null,
    error: null,
  };

  try {
    // Start listening before navigation so a fast Angular response cannot be
    // missed between DOMContentLoaded and the SPA-render check.
    const relevantResponse = waitForRelevantApiResponse(page, probe);
    const resp = await page.goto(probe.url, { waitUntil: "domcontentloaded" });
    result.finalUrl = page.url();
    result.httpStatus = resp ? resp.status() : null;

    const rendered = await waitForSpaRender(page);
    result.render = rendered ? "RENDERED" : "TIMEOUT_OR_EMPTY";

    // Wait for this exact public frontend request, not an arbitrary SPA delay.
    result.relevantApiObserved = await relevantResponse;
    result.implementationRowsObserved = probe.kind === "direct"
      ? await waitForDirectImplementationRows(page, probe.courseCode)
      : false;

    // Give Angular a beat for late XHRs and animations
    await sleep(1200);

    // The response listener reads bodies asynchronously. Classification must
    // use completed records rather than an in-flight network array.
    await Promise.allSettled(networkTasks);

    result.dom = await extractCoursePageData(page);
    result.implementations = implementationSummaries(result.dom.realizations);
    result.historicalCourseEvidence = probe.kind === "follow"
      ? historicalCourseEvidence(perProbeNetwork, probe.courseCode, probe.studyGuideYear)
      : null;

    // Interpret result
    if (!result.dom.visible) {
      result.status = "SPA_NOT_RENDERED";
    } else if (probe.kind === "direct") {
      // For direct URL to a known implementation
      if (result.dom.detectedCourseCode === probe.courseCode) {
        result.status = "FOUND";
      } else if (result.dom.bodyLength > 200) {
        result.status = "PARTIAL_RENDER";
      } else {
        result.status = "NOT_FOUND";
      }
    } else if (probe.kind === "follow" && result.historicalCourseEvidence) {
      // The browser can still recover official historical COURSE_UNIT data
      // even when Peppi's modern course-detail route returns no record.
      result.status = result.historicalCourseEvidence.implementationDetailStatus === 404
        ? "COURSE_UNIT_FOUND_NO_IMPLEMENTATION_DETAIL"
        : "COURSE_UNIT_FOUND";
    } else {
      // Search page — look for whether the course code appears as a result link
      const codeHref = (result.dom.internalLinks || []).find((l) => l.href && l.href.includes(`/opintojakso/${probe.courseCode}`));
      if (codeHref) {
        result.status = "FOUND_VIA_SEARCH";
        result.foundLink = codeHref;
      } else if (result.dom.bodyLength > 200 && /ei hakutuloksia|no results|ei löytynyt/i.test(result.dom.h1 + " " + result.dom.h2s.join(" ") + " " + result.dom.internalLinks.map((l) => l.text).join(" "))) {
        result.status = "NO_RESULTS";
      } else if (result.dom.bodyLength > 200) {
        result.status = "SEARCH_AMBIGUOUS";
      } else {
        result.status = "SEARCH_EMPTY";
      }
    }

    if (CAPTURE_SCREENSHOTS) {
      const shot = path.join(SCREENSHOTS_DIR, `${safeSlug(probe.courseCode)}_${safeSlug(probe.studyGuideYear)}_${probe.kind}.png`);
      try {
        await page.screenshot({ path: shot, fullPage: true });
        result.screenshot = path.relative(ROOT, shot);
      } catch {}
    }
  } catch (err) {
    result.error = err.message;
    result.status = "ERROR";
  }

  networkSink.push({ probe: `${probe.courseCode} ${probe.studyGuideYear}`, requests: perProbeNetwork });

  await page.close();
  return result;
}

/*
 * If a search page revealed a real course URL for a historical year,
 * follow it once to record implementation-level data. Bounded to one
 * follow-up per FOUND_VIA_SEARCH result to keep traffic minimal.
 */
async function followFoundLink(context, initial, networkSink) {
  if (initial.status !== "FOUND_VIA_SEARCH" || !initial.foundLink) return null;
  const rawHref = initial.foundLink.href;
  const absUrl = rawHref.startsWith("http") ? rawHref : BASE + rawHref;
  const followProbe = {
    courseCode: initial.courseCode,
    kind: "follow",
    url: absUrl,
    studyGuideYear: initial.studyGuideYear,
    note: `Follow-up from search of ${initial.courseCode} in ${initial.studyGuideYear}`,
  };
  const followup = await probeOnce(context, followProbe, networkSink);
  const evidence = historicalCourseEvidence(
    [...(initial.network || []), ...(followup.network || [])],
    initial.courseCode,
    initial.studyGuideYear
  );

  if (evidence) {
    followup.historicalCourseEvidence = evidence;
    followup.status = evidence.implementationDetailStatus === 404
      ? "COURSE_UNIT_FOUND_NO_IMPLEMENTATION_DETAIL"
      : "COURSE_UNIT_FOUND";
  }

  return followup;
}

async function main() {
  ensureDirs();

  const startedAt = iso();
  const activeProbes = COURSE_FILTER.length
    ? PROBES.filter((p) => COURSE_FILTER.includes(p.courseCode))
    : PROBES;

  console.log(`[peppi-audit] starting ${startedAt}`);
  console.log(`[peppi-audit] probes: ${activeProbes.length} ${COURSE_FILTER.length ? "(filtered)" : ""}`);

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    locale: "fi-FI",
    timezoneId: "Europe/Helsinki",
    viewport: { width: 1400, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 (PEPPI-BROWSER-CURATION-01 audit, jarilaru.fi)",
  });

  const network = [];
  const results = [];

  for (const probe of activeProbes) {
    console.log(`[peppi-audit] ${probe.courseCode} ${probe.studyGuideYear} (${probe.kind})`);
    const r = await probeOnce(context, probe, network);
    console.log(`    → status=${r.status} httpStatus=${r.httpStatus} render=${r.render}`);
    results.push(r);

    if (r.status === "FOUND_VIA_SEARCH") {
      const followup = await followFoundLink(context, r, network);
      if (followup) {
        console.log(`    → follow=${followup.status}`);
        results.push(followup);
      }
    }

    await sleep(DELAY_BETWEEN_MS);
  }

  await context.close();
  await browser.close();

  // Group results per course for the audit report
  const byCourse = {};
  for (const r of results) {
    byCourse[r.courseCode] = byCourse[r.courseCode] || [];
    byCourse[r.courseCode].push(r);
  }

  const auditJson = {
    retrievedAt: startedAt,
    completedAt: iso(),
    source: "opas.peppi.oulu.fi",
    tool: "scripts/audit-peppi-courses.js",
    playwrightBrowser: "chromium",
    probes: activeProbes.length,
    results: results.length,
    courses: Object.entries(byCourse).map(([courseCode, probes]) => ({
      courseCode,
      probes,
    })),
  };

  const auditPath = path.join(OUT_DIR, "peppi_course_audit.json");
  fs.writeFileSync(auditPath, JSON.stringify(auditJson, null, 2));
  console.log(`[peppi-audit] wrote ${path.relative(ROOT, auditPath)}`);

  const netPath = path.join(OUT_DIR, "network-summary.json");
  fs.writeFileSync(netPath, JSON.stringify({ retrievedAt: startedAt, network }, null, 2));
  console.log(`[peppi-audit] wrote ${path.relative(ROOT, netPath)}`);

  const md = renderMarkdown(auditJson);
  const mdPath = path.join(OUT_DIR, "peppi_course_audit.md");
  fs.writeFileSync(mdPath, md);
  console.log(`[peppi-audit] wrote ${path.relative(ROOT, mdPath)}`);

  console.log(`[peppi-audit] done ${iso()}`);
}

function renderMarkdown(audit) {
  const lines = [];
  const includesScreenshots = audit.courses.some((course) =>
    course.probes.some((probe) => Boolean(probe.screenshot))
  );
  lines.push("# Peppi course audit (browser)");
  lines.push("");
  lines.push(`- source: ${audit.source}`);
  lines.push(`- retrievedAt: ${audit.retrievedAt}`);
  lines.push(`- completedAt: ${audit.completedAt}`);
  lines.push(`- tool: ${audit.tool}`);
  lines.push(`- probes: ${audit.probes}`);
  lines.push(`- results: ${audit.results}`);
  lines.push("");
  for (const course of audit.courses) {
    lines.push(`## ${course.courseCode}`);
    lines.push("");
    lines.push(`| studyGuideYear | kind | status | httpStatus | render | course unit | implementation detail${includesScreenshots ? " | screenshot" : ""} |`);
    lines.push(`|---|---|---|---|---|---|---${includesScreenshots ? "|---" : ""}|`);
    for (const p of course.probes) {
      const courseUnit = p.historicalCourseEvidence
        ? `${p.historicalCourseEvidence.courseCode} / ${p.historicalCourseEvidence.courseUnitId}`
        : (p.dom && p.dom.detectedCourseCode) || "";
      const implementationDetail = p.historicalCourseEvidence?.implementationDetailStatus ?? "";
      const shotPath = p.screenshot
        ? path.relative(OUT_DIR, path.join(ROOT, p.screenshot)).replace(/\\/g, "/")
        : "";
      const shot = shotPath ? `[shot](${shotPath})` : "";
      lines.push(`| ${p.studyGuideYear} | ${p.kind} | ${p.status} | ${p.httpStatus ?? ""} | ${p.render ?? ""} | ${courseUnit} | ${implementationDetail}${includesScreenshots ? ` | ${shot}` : ""} |`);
    }
    lines.push("");
    // Realizations summary
    for (const p of course.probes) {
      if (p.implementations && p.implementations.length > 0) {
        lines.push(`### ${course.courseCode} ${p.studyGuideYear} — implementations (${p.implementations.length})`);
        lines.push("");
        p.implementations.slice(0, 6).forEach((r, i) => {
          lines.push(`${i + 1}. ${r.implementationCode}${r.dateRange ? ` — ${r.dateRange}` : ""}`);
        });
        lines.push("");
      }
    }
  }
  return lines.join("\n");
}

main().catch((err) => {
  console.error("[peppi-audit] fatal:", err);
  process.exit(1);
});
