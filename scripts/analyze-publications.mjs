import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const loadPublications = require("../src/_data/researchfi.js");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "reports", "publication-analysis");
const JSON_PATH = path.join(OUTPUT_DIR, "publication-analysis.json");
const MARKDOWN_PATH = path.join(OUTPUT_DIR, "publication-analysis.md");

const STOPWORDS = new Set([
  "a", "about", "after", "ai", "an", "and", "are", "as", "at", "based", "between",
  "by", "case", "data", "de", "des", "der", "di", "do", "education", "effects",
  "en", "for", "from", "how", "in", "into", "is", "la", "learning", "mit", "of",
  "on", "or", "response", "study", "teaching", "the", "their", "through", "to",
  "towards", "under", "using", "via", "with",
  "aihe", "aineiston", "ammatillinen", "artikkeli", "avulla", "eli", "en", "eri",
  "esitys", "että", "ja", "joka", "jossa", "julkaisu", "julkaisussa", "kanssa",
  "kohti", "kun", "kuinka", "kuten", "myös", "näkökulma", "on", "osa", "sekä",
  "sen", "siinä", "suomen", "tai", "tekoäly", "tekoälyn", "tutkimus", "uusia",
  "vaikutus", "vai", "vuonna", "yli", "yhteys"
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function toCountMap(items) {
  const counts = new Map();
  items.filter(Boolean).forEach((item) => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });
  return counts;
}

function sortEntries(map) {
  return Array.from(map.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return String(a[0]).localeCompare(String(b[0]), "fi");
    })
    .map(([label, count]) => ({ label, count }));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractTitleTerms(title) {
  return normalizeText(title)
    .replace(/[^a-z0-9\u00e5\u00e4\u00f6\s-]/g, " ")
    .split(/\s+/)
    .map((term) => term.replace(/^-+|-+$/g, ""))
    .filter((term) => term.length >= 4 && !STOPWORDS.has(term));
}

function splitAuthors(authors) {
  return String(authors || "")
    .split(/\s*;\s*/)
    .map((author) => author.trim())
    .filter(Boolean);
}

function topEntries(entries, limit = 10) {
  return entries.slice(0, limit);
}

function formatPercent(value, total) {
  if (!total) return "0 %";
  return `${Math.round((value / total) * 100)} %`;
}

function buildPublicationRows(publications) {
  return publications.map((publication) => {
    const authorList = splitAuthors(publication.authors);
    const titleTerms = extractTitleTerms(publication.title);
    return {
      publicationId: publication.publicationId || null,
      title: publication.title,
      year: publication.year || null,
      typeCode: publication.typeCode || "",
      typeFi: publication.typeFi || "",
      journal: publication.journal || null,
      doi: publication.doi || null,
      doiUrl: publication.doiUrl || null,
      peerReviewed: Boolean(publication.peerReviewed),
      openAccess: Number(publication.openAccess || 0),
      authorCount: authorList.length,
      authors: authorList,
      titleTerms,
      keywords: Array.isArray(publication.keywords) ? publication.keywords : []
    };
  });
}

function renderMarkdown(report) {
  const { summary, topTerms, topAuthors, topJournals, byYear, byType, publications } = report;
  const latestYears = byYear.slice(0, 8);
  const titleExamples = publications.slice(0, 5).map((publication) => (
    `- ${publication.year || "?"}: ${publication.title}`
  )).join("\n");

  return [
    "# Julkaisuanalyysi",
    "",
    `Luotu: ${report.generatedAt}`,
    "",
    "## Yhteenveto",
    "",
    `- Julkaisuja yhteensä: ${summary.total}`,
    `- DOI-tunniste mukana: ${summary.withDoi} (${formatPercent(summary.withDoi, summary.total)})`,
    `- Vertaisarvioituja: ${summary.peerReviewed} (${formatPercent(summary.peerReviewed, summary.total)})`,
    `- Open access -merkintä: ${summary.openAccess} (${formatPercent(summary.openAccess, summary.total)})`,
    `- Julkaisuvuosia mukana: ${summary.yearSpan}`,
    "",
    "## Julkaisutyypit",
    "",
    ...byType.slice(0, 12).map((entry) => `- ${entry.label}: ${entry.count}`),
    "",
    "## Vuodet",
    "",
    ...latestYears.map((entry) => `- ${entry.label}: ${entry.count}`),
    "",
    "## Toistuvat otsikkotermit",
    "",
    ...topTerms.map((entry) => `- ${entry.label}: ${entry.count}`),
    "",
    "## Yleisimmät kirjoittajakumppanit",
    "",
    ...topAuthors.map((entry) => `- ${entry.label}: ${entry.count}`),
    "",
    "## Julkaisukanavat",
    "",
    ...topJournals.map((entry) => `- ${entry.label}: ${entry.count}`),
    "",
    "## Esimerkkijulkaisut",
    "",
    titleExamples
  ].join("\n");
}

async function main() {
  const publications = await loadPublications();
  const rows = buildPublicationRows(publications);

  const years = rows.map((row) => row.year).filter(Boolean).sort((a, b) => b - a);
  const withDoi = rows.filter((row) => row.doi).length;
  const peerReviewed = rows.filter((row) => row.peerReviewed).length;
  const openAccess = rows.filter((row) => row.openAccess > 0).length;

  const byYear = sortEntries(toCountMap(rows.map((row) => row.year).filter(Boolean)));
  const byType = sortEntries(toCountMap(rows.map((row) => row.typeCode || "Muu")));
  const byJournal = sortEntries(toCountMap(rows.map((row) => row.journal).filter(Boolean)));
  const titleTerms = sortEntries(toCountMap(rows.flatMap((row) => row.titleTerms)));
  const authorCounts = sortEntries(
    toCountMap(
      rows.flatMap((row) => row.authors).filter((author) => author && !/jari laru/i.test(author))
    )
  );

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: rows.length,
      withDoi,
      withoutDoi: rows.length - withDoi,
      peerReviewed,
      openAccess,
      yearSpan: years.length ? `${Math.min(...years)}-${Math.max(...years)}` : "ei tiedossa"
    },
    byYear,
    byType,
    topTerms: topEntries(titleTerms, 20),
    topAuthors: topEntries(authorCounts, 20),
    topJournals: topEntries(byJournal, 15),
    publications: rows
  };

  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(JSON_PATH, JSON.stringify(report, null, 2));
  fs.writeFileSync(MARKDOWN_PATH, renderMarkdown(report));

  console.log(`[publication-analysis] Julkaisuja: ${report.summary.total}`);
  console.log(`[publication-analysis] DOI: ${report.summary.withDoi}/${report.summary.total}`);
  console.log(`[publication-analysis] Raportit: ${path.relative(ROOT, JSON_PATH)}, ${path.relative(ROOT, MARKDOWN_PATH)}`);
}

main().catch((error) => {
  console.error("[publication-analysis] Epäonnistui:", error);
  process.exitCode = 1;
});
