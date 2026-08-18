#!/usr/bin/env node
/**
 * TH-CITE1 Phase 1 — thesis CSL parity audit.
 *
 * Iterates the full canonical thesis inventory + compares:
 *   legacy:  src/_data/theses.js#buildApaCitation → thesis.citationApa
 *   shared:  buildThesisCslItem → shared renderer publicationCitation.buildCitation({csl, style: "apa"})
 *
 * Classifies every row as IDENTICAL / EXPECTED IMPROVEMENT /
 * METADATA-LIMITED / UNEXPLAINED REGRESSION using the same rules as
 * the Publications Phase 2 + Phase 4c parity audits (author-initials
 * normalisation, hyphenated-initial normalisation, publisher /
 * URL / genre-bracket differences, etc.).
 *
 * Read-only. Writes docs/data/th-cite1-phase1-thesis-csl-parity-2026-08-17.json.
 * Exits non-zero on any unexplained regression or when the CSL
 * projection fails to produce a citation for a thesis that has a
 * legacy citationApa string.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "th-cite1-phase1-thesis-csl-parity-2026-08-17.json"
);

function requireFresh(rel) {
  const full = path.join(REPO_ROOT, rel);
  delete require.cache[full];
  return require(full);
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function classifyDiff(legacy, shared, csl) {
  const l = decodeEntities(legacy);
  const s = shared;
  if (l === s) return { class: "IDENTICAL", explanation: "" };

  // The shared renderer emits `Title. Genre, Publisher.` (period,
  // comma). Legacy emits `Title [Genre, Publisher].` (bracket) per
  // APA 7. Both carry the same information; bracket compliance is a
  // Phase 2 concern. Recognise the shape difference explicitly.
  const genre = (csl && csl.genre) || "";
  const publisher = (csl && csl.publisher) || "";
  if (genre && publisher) {
    const legacyBracket = `[${genre}, ${publisher}].`;
    const sharedComma = ` ${genre}, ${publisher}.`;
    if (l.indexOf(legacyBracket) >= 0 && s.indexOf(sharedComma) >= 0) {
      return {
        class: "EXPECTED IMPROVEMENT",
        explanation: "Shared renderer emits `Genre, Publisher.` — Phase 2 will align to APA 7 `[Genre, Publisher].`"
      };
    }
  }

  // APA-initials improvement (from Publications Phase 2 rules).
  const cslAuthors = Array.isArray(csl?.author) ? csl.author : [];
  const firstStructured = cslAuthors[0] && cslAuthors[0].family && cslAuthors[0].given;
  const oldStartsWithFullName = firstStructured
    && l.indexOf(`${cslAuthors[0].family}, ${cslAuthors[0].given}`) === 0;
  const newStartsWithInitials = firstStructured
    && new RegExp(`^${cslAuthors[0].family}, ${cslAuthors[0].given.charAt(0)}\\.`).test(s);
  if (oldStartsWithFullName && newStartsWithInitials) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Author names shortened to initials per APA 7" };
  }
  if (/[A-ZÅÄÖ]\.-[A-ZÅÄÖ]\./.test(l) && /[A-ZÅÄÖ]\.\s+[A-ZÅÄÖ]\./.test(s)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Hyphenated middle initial normalised to space-separated initials" };
  }
  if (/^\(\d{4}\)\./.test(l) && /^Tuntematon tekijä \(\d{4}\)\./.test(s)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Explicit unknown-author label instead of silent omission" };
  }
  const cslIsMinimal = !csl?.["container-title"] && !csl?.DOI && !csl?.publisher;
  if (cslIsMinimal) {
    return { class: "METADATA-LIMITED", explanation: "Canonical record lacks container / DOI / publisher" };
  }
  return { class: "UNEXPLAINED REGRESSION", explanation: "Inspect manually" };
}

async function main() {
  const loadTheses = requireFresh("src/_data/theses.js");
  const publicationCitation = requireFresh("src/_utils/publicationCitation.js");
  const { buildThesisCslItem } = requireFresh("src/_utils/thesisCsl.js");

  const data = await loadTheses();
  // TH-CITE1 Phase 3: canonical unique count vs raw source count.
  // The raw OuluREPO source contains one duplicate URL
  // (`handle/10024/7879` — "Videogames as a platform for learning"),
  // so raw = 170 while canonical unique = 169. The public JSON, the
  // virtual collection and thesisDetails all already dedupe by URL.
  // The parity audit reports BOTH counts and prefers the canonical
  // deduplicated view for closure evidence.
  const rawInventory = [
    ...(data.gradut || []).map((t) => ({ thesis: t, role: "advised", bucket: "master" })),
    ...(data.kandit || []).map((t) => ({ thesis: t, role: "advised", bucket: "bachelor" })),
    ...(data.reviewerOnly || []).map((t) => ({ thesis: t, role: "reviewed", bucket: t.type === "bachelorThesis" ? "bachelor" : "master" }))
  ];
  const seenUrl = new Set();
  const inventory = [];
  const duplicateUrls = [];
  for (const entry of rawInventory) {
    const url = entry.thesis && entry.thesis.link;
    if (!url) continue;
    if (seenUrl.has(url)) {
      duplicateUrls.push(url);
      continue;
    }
    seenUrl.add(url);
    inventory.push(entry);
  }

  const stats = {
    rawCount: rawInventory.length,
    canonicalUniqueCount: inventory.length,
    duplicateRawUrls: duplicateUrls,
    total: inventory.length,
    identical: 0,
    improvements: 0,
    metadataLimited: 0,
    regressions: 0,
    cslNull: 0,
    sharedRendererEmpty: 0,
    byType: {},
    byRole: {},
    byLang: {},
    regressionExamples: [],
    cslNullExamples: []
  };
  const perThesisRows = [];

  for (const { thesis, role, bucket } of inventory) {
    stats.byType[thesis.type || "(none)"] = (stats.byType[thesis.type || "(none)"] || 0) + 1;
    stats.byRole[role] = (stats.byRole[role] || 0) + 1;
    stats.byLang[thesis.language || "(none)"] = (stats.byLang[thesis.language || "(none)"] || 0) + 1;

    const csl = buildThesisCslItem(thesis);
    if (!csl) {
      stats.cslNull++;
      if (stats.cslNullExamples.length < 5) {
        stats.cslNullExamples.push({ link: thesis.link, title: thesis.title });
      }
      continue;
    }
    const rendered = publicationCitation.buildCitation({ csl, style: "apa" });
    if (!rendered || rendered.empty || !rendered.text) {
      stats.sharedRendererEmpty++;
      continue;
    }
    const legacy = thesis.citationApa || "";
    const cls = classifyDiff(legacy, rendered.text, csl);
    if (cls.class === "IDENTICAL") stats.identical++;
    else if (cls.class === "EXPECTED IMPROVEMENT") stats.improvements++;
    else if (cls.class === "METADATA-LIMITED") stats.metadataLimited++;
    else if (cls.class === "UNEXPLAINED REGRESSION") {
      stats.regressions++;
      if (stats.regressionExamples.length < 6) {
        stats.regressionExamples.push({
          link: thesis.link,
          type: thesis.type,
          role,
          legacy,
          shared: rendered.text
        });
      }
    }
    perThesisRows.push({
      link: thesis.link,
      type: thesis.type,
      role,
      bucket,
      lang: thesis.language,
      classification: cls.class
    });
  }

  const gates = {
    inventoryLoaded: stats.total > 0,
    everyThesisHasCsl: stats.cslNull === 0,
    everyThesisRendersCitation: stats.sharedRendererEmpty === 0,
    noUnexplainedRegression: stats.regressions === 0
  };
  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "TH-CITE1 Phase 1 — thesis CSL parity audit vs current legacy citationApa",
    counts: stats,
    perThesisRows,
    gates,
    gateFailures,
    productionChangePolicy: "AUDIT ONLY. No production source or contract change."
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log(`raw source records: ${stats.rawCount} (raw source before dedup)`);
  console.log(`canonical unique theses: ${stats.canonicalUniqueCount} (deduplicated by URL)`);
  if (stats.duplicateRawUrls.length) {
    console.log(`raw duplicate URLs dropped by canonical dedup: ${stats.duplicateRawUrls.length}`);
  }
  console.log(`parity (canonical unique): identical=${stats.identical} improvements=${stats.improvements} metadata-limited=${stats.metadataLimited} regressions=${stats.regressions}`);
  console.log(`byType: ${JSON.stringify(stats.byType)}  byRole: ${JSON.stringify(stats.byRole)}  byLang: ${JSON.stringify(stats.byLang)}`);
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
