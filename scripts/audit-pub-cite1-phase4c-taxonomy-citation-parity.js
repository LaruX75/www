#!/usr/bin/env node
/**
 * PUB-CITE1 Phase 4c — Taxonomy Publication Citation Parity Audit
 *
 * Compares the pre-migration server APA string
 * (researchfiContent.buildApaCitation → item.data.citation) rendered
 * on taxonomy pages against what the shared Nunjucks filter
 * publicationCitation(item.data.csl, "apa") would produce.
 *
 * The three affected taxonomy templates are:
 *   - src/teemat.njk               (research publications block)
 *   - src/kategoriat.njk           (featured item + list rows)
 *   - src/avainsanat.njk           (list rows)
 *
 * Only publication items are touched (kategoriat/avainsanat guard
 * with taxonomyTypeKey === "scientific-publications"; teemat's
 * research publications block is publication-only).
 *
 * Read-only. Writes:
 *   docs/data/pub-cite1-phase4c-taxonomy-citation-parity-2026-08-17.json
 *
 * Exits non-zero when any unexplained regression is found or when
 * a publication item lacks csl in the current build state.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pub-cite1-phase4c-taxonomy-citation-parity-2026-08-17.json"
);

const SITE_DIR = path.join(REPO_ROOT, "_site");
const KATEGORIAT_DIR = path.join(SITE_DIR, "kategoriat");
const AVAINSANAT_DIR = path.join(SITE_DIR, "avainsanat");
const TEEMAT_DIR = path.join(SITE_DIR, "teemat");

function requireFresh(rel) {
  const full = path.join(REPO_ROOT, rel);
  delete require.cache[full];
  return require(full);
}

function listIndexHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name, "index.html");
    if (fs.existsSync(full)) out.push({ slug: entry.name, path: full });
  }
  return out;
}

// Extract publication-citation blocks from a taxonomy page.
// The three templates emit distinct CSS hooks:
//   kategoriat/avainsanat → <p class="taxonomy-publication-citation">
//   teemat                → <p class="topic-research-citation">
// The citation text is the last text node after the optional
// <span class="taxonomy-citation-label">APA 7</span> prefix.
function extractCitations(html, cssClass) {
  const rx = new RegExp(`<p[^>]*class="[^"]*${cssClass}[^"]*"[^>]*>([\\s\\S]*?)</p>`, "g");
  const out = [];
  let m;
  while ((m = rx.exec(html)) !== null) {
    let body = m[1];
    body = body.replace(/<span[^>]*class="[^"]*taxonomy-citation-label[^"]*"[^>]*>[\s\S]*?<\/span>/g, "");
    body = body.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (body) out.push(body);
  }
  return out;
}

function decodeHtmlEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function classifyDiff(legacy, shared, csl) {
  const l = decodeHtmlEntities(legacy);
  const s = shared;
  if (l === s) return { class: "IDENTICAL", explanation: "" };
  // APA initials improvement: shared renders "Family, G." while
  // legacy pipes the raw string.
  const cslAuthors = Array.isArray(csl?.author) ? csl.author : [];
  const firstStructured = cslAuthors[0] && cslAuthors[0].family && cslAuthors[0].given;
  const oldStartsWithFullName = firstStructured
    && l.indexOf(`${cslAuthors[0].family}, ${cslAuthors[0].given}`) === 0;
  const newStartsWithInitials = firstStructured
    && new RegExp(`^${cslAuthors[0].family}, ${cslAuthors[0].given.charAt(0)}\\.`).test(s);
  if (oldStartsWithFullName && newStartsWithInitials) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Author names shortened to initials per APA 7" };
  }
  // Hyphenated middle initials: legacy delivers "V.-M." (verbatim
  // from the Research.fi authorsText); shared normalises to
  // "V. M." — APA 7 accepts both. Treat as a stylistic improvement.
  if (/[A-ZÅÄÖ]\.-[A-ZÅÄÖ]\./.test(l) && /[A-ZÅÄÖ]\.\s+[A-ZÅÄÖ]\./.test(s)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Hyphenated middle initial normalised to space-separated initials" };
  }
  // Legitimately unknown author. Legacy omits the author segment
  // ("(2019). Title..."); shared inserts an explicit
  // "Tuntematon tekijä (2019). ..." placeholder. Explicit unknown
  // is better UX than silent omission.
  if (/^\(\d{4}\)\./.test(l) && /^Tuntematon tekijä \(\d{4}\)\./.test(s)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Explicit unknown-author label instead of silent omission" };
  }
  const publisher = (csl && csl.publisher) || "";
  if (publisher && s.indexOf(publisher) >= 0 && l.indexOf(publisher) === -1) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Publisher now included per APA 7" };
  }
  const hasOxfordAmp = /, & /.test(s) && !/, & /.test(l);
  const hasContainerVolume = / \d+(\(\d+\))?, /.test(s) && !/ \d+(\(\d+\))?, /.test(l);
  const oldHasDoiWithoutPrefix = /(^|\s)10\.\d/.test(l);
  const newHasDoiUrl = /https:\/\/doi\.org\//.test(s);
  const newHasThesisGenre = /(Doctoral dissertation|Master's thesis)/.test(s);
  const newHasChapterMarker = /Teoksessa /.test(s);
  if (hasOxfordAmp || hasContainerVolume) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "APA style improvements (Oxford ampersand / volume formatting)" };
  }
  if (newHasDoiUrl && oldHasDoiWithoutPrefix) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "DOI rendered as full URL per APA 7" };
  }
  // DOI case normalisation: Phase 1 lowercases the DOI (APA 7 style
  // guides recommend lowercase DOIs; the DOI system is
  // case-insensitive). Legacy passed the raw case through.
  const doi = (csl && csl.DOI) || "";
  if (doi) {
    const legacyHasUppercaseDoi = new RegExp(doi.replace(/[.\-\/]/g, "\\$&"), "i").test(l)
      && !new RegExp(doi.replace(/[.\-\/]/g, "\\$&")).test(l);
    if (legacyHasUppercaseDoi && s.indexOf(doi) >= 0) {
      return { class: "EXPECTED IMPROVEMENT", explanation: "DOI case normalised to lower per APA 7 recommendation" };
    }
  }
  if (newHasThesisGenre && !/(Doctoral dissertation|Master's thesis)/.test(l)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Thesis genre now included" };
  }
  if (newHasChapterMarker && !/Teoksessa /.test(l)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Chapter now marks its container title" };
  }
  const cslIsMinimal = !csl?.["container-title"] && !csl?.DOI && !csl?.publisher;
  if (cslIsMinimal) {
    return { class: "METADATA-LIMITED", explanation: "Canonical record lacks container / DOI / publisher" };
  }
  return { class: "UNEXPLAINED REGRESSION", explanation: "Inspect manually" };
}

async function main() {
  // Load researchfiContent items — the source of truth for both
  // the legacy citation string and the CSL projection.
  const loadResearchfiContent = requireFresh("src/_data/researchfiContent.js");
  const publicationCitation = requireFresh("src/_utils/publicationCitation.js");
  const researchfiContent = await loadResearchfiContent();
  const byAnchor = new Map(researchfiContent.map((item) => [item.anchorId, item]));
  const publicationsWithCsl = researchfiContent.filter((item) => item.csl).length;

  // Baseline citation strings — indexed by the exact legacy text so
  // we can look up which content item produced a rendered citation.
  const legacyToItem = new Map();
  const sharedToItem = new Map();
  for (const item of researchfiContent) {
    if (item.citation) legacyToItem.set(item.citation, item);
    if (item.csl) {
      const rendered = publicationCitation.buildCitation({ csl: item.csl, style: "apa" });
      if (rendered && !rendered.empty && rendered.text) {
        sharedToItem.set(rendered.text, item);
      }
    }
  }

  const kategoriatPages = listIndexHtml(KATEGORIAT_DIR);
  const avainsanatPages = listIndexHtml(AVAINSANAT_DIR);
  const teematPages = listIndexHtml(TEEMAT_DIR);

  const stats = {
    kategoriat: { pages: 0, citations: 0, matched: 0, matchedShared: 0, matchedLegacy: 0, identical: 0, improvements: 0, metadataLimited: 0, regressions: 0, missing: 0, unmatched: 0 },
    avainsanat: { pages: 0, citations: 0, matched: 0, matchedShared: 0, matchedLegacy: 0, identical: 0, improvements: 0, metadataLimited: 0, regressions: 0, missing: 0, unmatched: 0 },
    teemat: { pages: 0, citations: 0, matched: 0, matchedShared: 0, matchedLegacy: 0, identical: 0, improvements: 0, metadataLimited: 0, regressions: 0, missing: 0, unmatched: 0 }
  };
  const regressionExamples = [];
  const missingCslExamples = [];
  const seenAnchorIds = { kategoriat: new Set(), avainsanat: new Set(), teemat: new Set() };

  function processGroup(name, pages, cssClass) {
    for (const page of pages) {
      const html = fs.readFileSync(page.path, "utf8");
      const citations = extractCitations(html, cssClass);
      if (citations.length === 0) continue;
      stats[name].pages++;
      for (const renderedText of citations) {
        stats[name].citations++;
        const decoded = decodeHtmlEntities(renderedText);
        // Post-migration path: the rendered text should equal the
        // shared renderer's output for exactly one canonical item.
        const sharedItem = sharedToItem.get(decoded);
        if (sharedItem) {
          stats[name].matched++;
          stats[name].matchedShared++;
          stats[name].identical++;
          seenAnchorIds[name].add(sharedItem.anchorId);
          continue;
        }
        // Pre-migration path: the rendered text might still match
        // the legacy composer output (defence-in-depth fallback).
        // This is only expected when the CSL is missing on a record
        // AND the template's `or item.data.citation` branch fired.
        const legacyItem = legacyToItem.get(decoded);
        if (legacyItem) {
          stats[name].matched++;
          stats[name].matchedLegacy++;
          seenAnchorIds[name].add(legacyItem.anchorId);
          if (!legacyItem.csl) {
            stats[name].missing++;
            missingCslExamples.push({ template: name, slug: page.slug, anchorId: legacyItem.anchorId });
          } else {
            const shared = publicationCitation.buildCitation({ csl: legacyItem.csl, style: "apa" });
            const cls = classifyDiff(renderedText, shared.text, legacyItem.csl);
            if (cls.class === "IDENTICAL") stats[name].identical++;
            else if (cls.class === "EXPECTED IMPROVEMENT") stats[name].improvements++;
            else if (cls.class === "METADATA-LIMITED") stats[name].metadataLimited++;
            else if (cls.class === "UNEXPLAINED REGRESSION") {
              stats[name].regressions++;
              if (regressionExamples.length < 6) {
                regressionExamples.push({
                  template: name, slug: page.slug, anchorId: legacyItem.anchorId,
                  legacy: renderedText, shared: shared.text
                });
              }
            }
          }
          continue;
        }
        // Neither shared nor legacy matched — rendered text is
        // something we did not expect on a publication citation.
        stats[name].unmatched++;
        if (regressionExamples.length < 6) {
          regressionExamples.push({
            template: name, slug: page.slug, anchorId: null,
            legacy: "(no matching legacy or shared item)", shared: renderedText
          });
        }
      }
    }
  }

  processGroup("kategoriat", kategoriatPages, "taxonomy-publication-citation");
  processGroup("avainsanat", avainsanatPages, "taxonomy-publication-citation");
  processGroup("teemat", teematPages, "topic-research-citation");

  const gates = {
    researchfiContentAllHaveCsl: publicationsWithCsl === researchfiContent.length,
    kategoriatNoUnexplainedRegressions: stats.kategoriat.regressions === 0,
    avainsanatNoUnexplainedRegressions: stats.avainsanat.regressions === 0,
    teematNoUnexplainedRegressions: stats.teemat.regressions === 0,
    noMissingCslOnRenderedTaxonomyItem: stats.kategoriat.missing + stats.avainsanat.missing + stats.teemat.missing === 0,
    // Post-migration invariant: every rendered publication citation
    // in every taxonomy template must be identifiable — either as
    // the shared renderer's output for a canonical item (expected)
    // or as a legacy composer output (defence-in-depth fallback).
    everyCitationIdentified: stats.kategoriat.unmatched + stats.avainsanat.unmatched + stats.teemat.unmatched === 0
  };

  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PUB-CITE1 Phase 4c — taxonomy publication citation parity",
    counts: {
      researchfiContentItems: researchfiContent.length,
      researchfiContentWithCsl: publicationsWithCsl,
      taxonomy: stats
    },
    seenAnchorIds: {
      kategoriat: [...seenAnchorIds.kategoriat].sort(),
      avainsanat: [...seenAnchorIds.avainsanat].sort(),
      teemat: [...seenAnchorIds.teemat].sort()
    },
    regressionExamples,
    missingCslExamples,
    gates,
    gateFailures,
    productionChangePolicy: "This audit only inspects the built _site output; it does not modify any production source."
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log(`researchfiContent: ${researchfiContent.length} items, ${publicationsWithCsl} with csl`);
  for (const t of ["kategoriat", "avainsanat", "teemat"]) {
    const s = stats[t];
    console.log(`${t}: pages=${s.pages} citations=${s.citations} shared=${s.matchedShared} legacy=${s.matchedLegacy} unmatched=${s.unmatched} regressions=${s.regressions} missing-csl=${s.missing}`);
  }
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
