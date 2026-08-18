#!/usr/bin/env node
/**
 * TH-CITE1 Phase 4D — end-to-end modal/export parity audit.
 *
 * Combines the Phase 4A shared-renderer coverage, the Phase 4B
 * detail-page UI wiring, the Phase 4C browser deletion, and the
 * Phase 3 SSR archive boundary into a single closure gate for
 * TH-CITE1 Phase 4. Corpus counts are audit evidence, not
 * production configuration — the audit reads live data + built
 * output rather than hardcoded constants.
 *
 * Hard gates (grouped):
 *   A. Shared renderer thesis coverage (APA / MLA / Chicago /
 *      BibTeX / RIS on a real canonical CSL).
 *   B. Detail-page UI wiring (trigger + CSL + lang + no raw fields,
 *      lean citation modal include present + used, publication-
 *      citation.js loads before thesis-hub-actions.js).
 *   C. Archive boundary preserved (no citation modal, no abstract
 *      modal, no thesis-hub-actions.js, ≤ 30 SSR thesis rows).
 *   D. Browser deletion evidence (no composers, no getCitationBy
 *      Format, no browser getThesisLevelLabel, no abstract-modal
 *      wiring in thesis-hub-actions.js).
 *   E. Public contract preservation (public JSON citationApa, no
 *      csl on public JSON, JSON-LD citation present, Phase 6
 *      server formatter path retained).
 *   F. Corpus parity (canonical unique theses == SSR archive union
 *      FI == SSR archive union EN == Pagefind thesis fragments).
 *
 * Exit non-zero on any gate failure.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const REPO_ROOT = path.resolve(__dirname, "..");
const SITE_ROOT = path.join(REPO_ROOT, "_site");
const OUT = path.join(REPO_ROOT, "docs", "data", "th-cite1-phase4-modal-export-parity-2026-08-18.json");

function requireFresh(rel) {
  const full = path.join(REPO_ROOT, rel);
  delete require.cache[full];
  return require(full);
}

function readSrc(rel) {
  const full = path.join(REPO_ROOT, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

function readSite(rel) {
  const full = path.join(SITE_ROOT, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

async function loadCanonicalThesis() {
  const details = requireFresh("src/_data/thesisDetails.js");
  const model = await details();
  return model.items;
}

function countPagefindThesisFragments() {
  const dir = path.join(SITE_ROOT, "pagefind", "fragment");
  if (!fs.existsSync(dir)) return { total: 0, opinnaytteetLinked: 0, thesisTagged: 0 };
  let opinnaytteetLinked = 0;
  let thesisTagged = 0;
  let total = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".pf_fragment")) continue;
    total++;
    try {
      const raw = zlib.gunzipSync(fs.readFileSync(path.join(dir, name))).toString();
      if (/opinnaytteet\//.test(raw)) opinnaytteetLinked++;
      if (/thesesType|FindExplore.:.theses|"kind":"thesis"/.test(raw)) thesisTagged++;
    } catch (_) {}
  }
  return { total, opinnaytteetLinked, thesisTagged };
}

function unionSsrThesisRows(scope) {
  const roots = scope === "fi" ? [
    "opinnaytteet/index.html",
    "opinnaytteet/ohjatut-gradut/page/2/index.html",
    "opinnaytteet/ohjatut-gradut/page/3/index.html",
    "opinnaytteet/ohjatut-gradut/page/4/index.html",
    "opinnaytteet/ohjatut-gradut/page/5/index.html",
    "opinnaytteet/ohjatut-gradut/page/6/index.html",
    "opinnaytteet/ohjatut-gradut/page/7/index.html",
    "opinnaytteet/ohjatut-gradut/page/8/index.html",
    "opinnaytteet/ohjatut-gradut/page/9/index.html",
    "opinnaytteet/kandityot/page/2/index.html",
    "opinnaytteet/kandityot/page/3/index.html",
    "opinnaytteet/tarkastetut/page/2/index.html",
    "opinnaytteet/tarkastetut/page/3/index.html",
    "opinnaytteet/tarkastetut/page/4/index.html",
    "opinnaytteet/tarkastetut/page/5/index.html",
    "opinnaytteet/tarkastetut/page/6/index.html"
  ] : [
    "en/theses/index.html",
    "en/theses/masters/page/2/index.html",
    "en/theses/masters/page/3/index.html",
    "en/theses/masters/page/4/index.html",
    "en/theses/masters/page/5/index.html",
    "en/theses/masters/page/6/index.html",
    "en/theses/masters/page/7/index.html",
    "en/theses/masters/page/8/index.html",
    "en/theses/masters/page/9/index.html",
    "en/theses/bachelors/page/2/index.html",
    "en/theses/bachelors/page/3/index.html",
    "en/theses/reviewed/page/2/index.html",
    "en/theses/reviewed/page/3/index.html",
    "en/theses/reviewed/page/4/index.html",
    "en/theses/reviewed/page/5/index.html",
    "en/theses/reviewed/page/6/index.html"
  ];
  const seen = new Set();
  for (const rel of roots) {
    const html = readSite(rel);
    if (!html) continue;
    const links = html.match(/class="thesis-archive-title-link[^"]*"\s+href="[^"]+"/g) || [];
    for (const l of links) {
      const m = l.match(/href="([^"]+)"/);
      if (m) seen.add(m[1]);
    }
  }
  return seen.size;
}

async function main() {
  const publicationCitation = requireFresh("src/_utils/publicationCitation.js");
  const thesisCsl = requireFresh("src/_utils/thesisCsl.js");
  const canonicalItems = await loadCanonicalThesis();

  const sampleFi = canonicalItems.find((i) => i.lang === "fi" && i.thesisType === "masterThesis");
  const sampleEn = canonicalItems.find((i) => i.lang === "en" && i.thesisType === "masterThesis");
  const sampleBach = canonicalItems.find((i) => i.thesisType === "bachelorThesis");

  // ---- A. Shared renderer thesis coverage on real CSL ----
  const styles = ["apa", "mla", "chicago", "bibtex", "ris"];
  const rendererGates = {};
  for (const style of styles) {
    if (!sampleFi) { rendererGates["thesis_" + style + "_fi"] = false; continue; }
    const r = publicationCitation.buildCitation({ csl: sampleFi.csl, style, lang: "fi" });
    rendererGates["thesis_" + style + "_fi"] = !!(r && !r.empty && r.text);
  }
  const bibtexEnRendered = sampleEn
    ? publicationCitation.buildCitation({ csl: sampleEn.csl, style: "bibtex", lang: "en" }).text
    : "";
  const risEnRendered = sampleEn
    ? publicationCitation.buildCitation({ csl: sampleEn.csl, style: "ris", lang: "en" }).text
    : "";
  const bibtexBachRendered = sampleBach
    ? publicationCitation.buildCitation({ csl: sampleBach.csl, style: "bibtex", lang: "fi" }).text
    : "";
  rendererGates.bibtexEnUsesSchool = /school = \{University of Oulu\}/.test(bibtexEnRendered);
  rendererGates.bibtexEnIsMastersthesis = /^@mastersthesis\{/.test(bibtexEnRendered);
  rendererGates.risEnHasM3 = /^M3  - Master's thesis$/m.test(risEnRendered);
  rendererGates.bibtexBachelorIsMisc = /^@misc\{/.test(bibtexBachRendered);
  rendererGates.bibtexBachelorHasHowpublished = /howpublished = \{Kandidaatintutkielma, Oulun yliopisto\}/.test(bibtexBachRendered);

  // ---- B. Detail-page UI wiring ----
  const detailBodyNjk = readSrc("src/_includes/thesis-detail-body.njk") || "";
  const detailPageNjk = readSrc("src/opinnaytteet/thesis-details.njk") || "";
  const citationModalNjk = readSrc("src/_includes/thesis-citation-modal.njk") || "";
  const detailUiGates = {
    triggerCarriesCsl: /data-thesis-citation-trigger/.test(detailBodyNjk) && /data-thesis-csl=/.test(detailBodyNjk),
    triggerCarriesLang: /data-thesis-lang=/.test(detailBodyNjk),
    triggerHasNoRawTitle: !/data-thesis-title=/.test(detailBodyNjk),
    triggerHasNoRawAuthors: !/data-thesis-authors=/.test(detailBodyNjk),
    triggerHasNoRawYear: !/data-thesis-year=/.test(detailBodyNjk),
    triggerHasNoRawType: !/data-thesis-type=/.test(detailBodyNjk),
    triggerHasNoRawUrl: !/data-thesis-url=/.test(detailBodyNjk),
    modalIncludePresent: citationModalNjk.length > 0,
    modalIncludeUsed: /include\s+"thesis-citation-modal\.njk"/.test(detailBodyNjk),
    detailLoadsSharedRendererBeforeHub: (function () {
      const pc = detailPageNjk.indexOf("/js/publication-citation.js");
      const th = detailPageNjk.indexOf("/js/thesis-hub-actions.js");
      return pc >= 0 && th >= 0 && pc < th;
    }())
  };

  // ---- C. Archive boundary ----
  const archiveFi = readSite("opinnaytteet/index.html") || "";
  const archiveEn = readSite("en/theses/index.html") || "";
  const archiveGates = {
    fiNoCitationTrigger: !/data-thesis-citation-trigger/.test(archiveFi),
    fiNoCitationModal: !/id="thesisCitationModal"/.test(archiveFi),
    fiNoAbstractModal: !/id="thesisAbstractModal"/.test(archiveFi),
    fiNoThesisHubJs: !archiveFi.includes("/js/thesis-hub-actions.js"),
    enNoCitationTrigger: !/data-thesis-citation-trigger/.test(archiveEn),
    enNoCitationModal: !/id="thesisCitationModal"/.test(archiveEn),
    enNoAbstractModal: !/id="thesisAbstractModal"/.test(archiveEn),
    enNoThesisHubJs: !archiveEn.includes("/js/thesis-hub-actions.js"),
    fiNoOversizedRows: (archiveFi.match(/thesis-archive-citation/g) || []).length <= 30,
    enNoOversizedRows: (archiveEn.match(/thesis-archive-citation/g) || []).length <= 30
  };

  // ---- D. Browser deletion ----
  const thesisHubJs = readSrc("src/js/thesis-hub-actions.js") || "";
  const forbiddenBrowserSymbols = [
    "buildThesisApa", "buildThesisMla", "buildThesisChicago",
    "buildThesisBibTeX", "buildThesisRis", "getCitationByFormat",
    "getThesisLevelLabel", "openAbstractModal", "thesisAbstractModal",
    "data-thesis-abstract-trigger"
  ];
  const deletionGates = {};
  for (const sym of forbiddenBrowserSymbols) {
    deletionGates["thesisHubHasNo_" + sym.replace(/[^A-Za-z0-9]+/g, "_")] =
      !thesisHubJs.includes(sym);
  }

  // ---- E. Public contract preservation ----
  const thesesJson = readSite("data/theses.json");
  let thesesJsonObj = null;
  try { thesesJsonObj = JSON.parse(thesesJson || "null"); } catch (_) {}
  const publicContractGates = {
    publicJsonExists: !!thesesJsonObj,
    publicJsonHasCitationApa: !!thesesJsonObj && Array.isArray(thesesJsonObj.items) && thesesJsonObj.items.every((i) => !("citationApa" in i) || typeof i.citationApa === "string"),
    publicJsonHasAnyCitationApa: !!thesesJsonObj && Array.isArray(thesesJsonObj.items) && thesesJsonObj.items.some((i) => typeof i.citationApa === "string" && i.citationApa.length > 0),
    publicJsonDoesNotExposeCsl: !!thesesJsonObj && Array.isArray(thesesJsonObj.items) && thesesJsonObj.items.every((i) => !("csl" in i)),
    serverBuildApaCitationRetained: /\bfunction\s+buildApaCitation\b/.test(readSrc("src/_data/theses.js") || ""),
    serverWithCitationRetained: /\bfunction\s+withCitation\b/.test(readSrc("src/_data/theses.js") || ""),
    serverGetThesisLevelLabelRetained: /\bfunction\s+getThesisLevelLabel\b/.test(readSrc("src/_data/theses.js") || ""),
    detailJsonLdCitationRetained: /thesisSchemaCitation/.test(readSrc("src/opinnaytteet/thesis-details.njk") || "")
  };
  // Sample: pick a canonical detail page and confirm the JSON-LD
  // <script type="application/ld+json"> contains a citation string.
  const sampleDetailHtml = readSite("opinnaytteet/18096/index.html") || "";
  publicContractGates.sampleDetailJsonLdCitation = /"citation":\s*"/.test(sampleDetailHtml);

  // ---- F. Corpus parity ----
  const canonicalUnique = canonicalItems.length;
  const ssrUnionFi = unionSsrThesisRows("fi");
  const ssrUnionEn = unionSsrThesisRows("en");
  const pf = countPagefindThesisFragments();
  const parityGates = {
    ssrFiUnionEqualsCanonical: ssrUnionFi === canonicalUnique,
    ssrEnUnionEqualsCanonical: ssrUnionEn === canonicalUnique,
    pagefindThesisFragmentsEqualCanonical: pf.thesisTagged === canonicalUnique
  };

  const gates = {
    ...rendererGates,
    ...detailUiGates,
    ...archiveGates,
    ...deletionGates,
    ...publicContractGates,
    ...parityGates
  };
  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([name]) => name);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "TH-CITE1 Phase 4D — end-to-end modal/export parity closure",
    canonical: {
      canonicalUniqueTheses: canonicalUnique,
      ssrUnionFi: ssrUnionFi,
      ssrUnionEn: ssrUnionEn,
      pagefindThesisTaggedFragments: pf.thesisTagged,
      pagefindTotalFragments: pf.total,
      pagefindOpinnaytteetReferencing: pf.opinnaytteetLinked
    },
    gates: gates,
    gateFailures: gateFailures,
    productionChangePolicy: "AUDIT ONLY. No source, template, or contract change."
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("canonical unique theses:", canonicalUnique);
  console.log("SSR archive union FI/EN:", ssrUnionFi + " / " + ssrUnionEn);
  console.log("Pagefind thesis fragments:", pf.thesisTagged);
  console.log("gates checked:", Object.keys(gates).length);
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main().catch(function (err) {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
