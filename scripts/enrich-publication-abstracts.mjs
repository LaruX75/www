import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { execFile } from "child_process";
import { promisify } from "util";

const require = createRequire(import.meta.url);
const loadPublications = require("../src/_data/researchfi.js");
const {
  readCache,
  readCacheIfFresh,
  writeCache,
  fetchWithTimeout,
  isOfflineFetchMode
} = require("../src/_data/_apiCache.js");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "reports", "publication-analysis");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "publication-abstract-enrichments.json");
const OUTPUT_MARKDOWN = path.join(OUTPUT_DIR, "publication-abstract-enrichments.md");

const execFileAsync = promisify(execFile);
const CACHE_KEY = "publication-abstract-enrichments-v2";
const CACHE_TTL_HOURS = 24 * 7;
const USER_AGENT = "jarilaru.fi/2.0 (mailto:jari.laru@oulu.fi; publication enrichment)";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function runConcurrent(items, concurrency, asyncFn) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      await asyncFn(current);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
}

function normalizeDoi(doi) {
  return String(doi || "").trim().replace(/^https?:\/\/doi\.org\//i, "").toLowerCase();
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function stripTags(text) {
  return decodeHtmlEntities(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeInvertedIndex(index) {
  if (!index || typeof index !== "object") return null;
  const words = [];
  Object.entries(index).forEach(([token, positions]) => {
    if (!Array.isArray(positions)) return;
    positions.forEach((position) => {
      words[position] = token;
    });
  });
  const text = words.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return text || null;
}

function uniqueList(values, limit = 8) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, limit);
}

function hasUsableEnrichmentData(map) {
  if (!map || typeof map !== "object") return false;
  return Object.values(map).some((entry) => (
    entry?.abstract ||
    entry?.sources?.openAlex ||
    entry?.sources?.crossref ||
    (Array.isArray(entry?.topics) && entry.topics.length > 0) ||
    (Array.isArray(entry?.keywords) && entry.keywords.length > 0)
  ));
}

async function fetchJson(url) {
  try {
    const response = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT } }, 12000);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    if (isOfflineFetchMode()) return null;
    const message = String(error?.message || "");
    const causeMessage = String(error?.cause?.message || "");
    const shouldFallbackToCurl = /fetch failed|ENOTFOUND|EAI_AGAIN|ECONNRESET|ECONNREFUSED/i.test(`${message} ${causeMessage}`);
    if (!shouldFallbackToCurl) return null;

    try {
      const { stdout } = await execFileAsync(
        "curl",
        ["-fsSL", "-A", USER_AGENT, url],
        { maxBuffer: 10 * 1024 * 1024 }
      );
      return JSON.parse(stdout);
    } catch {
      return null;
    }
  }
}

async function fetchOpenAlexByDoi(doi) {
  const normalized = normalizeDoi(doi);
  if (!normalized) return null;

  const url = `https://api.openalex.org/works?filter=doi:${encodeURIComponent(normalized)}&per-page=1&mailto=jari.laru@oulu.fi`;
  try {
    const data = await fetchJson(url);
    const work = data?.results?.[0];
    if (!work) return null;
    return {
      openAlexId: work.id || null,
      abstract: decodeInvertedIndex(work.abstract_inverted_index),
      primaryTopic: work.primary_topic?.display_name || null,
      topics: uniqueList((work.topics || []).map((topic) => topic?.display_name)),
      keywords: uniqueList((work.keywords || []).map((keyword) => keyword?.display_name)),
      citedByCount: work.cited_by_count || 0,
      landingPageUrl: work.primary_location?.landing_page_url || work.primary_location?.source?.homepage_url || null
    };
  } catch {
    return null;
  }
}

async function fetchCrossrefAbstract(doi) {
  const normalized = normalizeDoi(doi);
  if (!normalized) return null;
  const url = `https://api.crossref.org/works/${encodeURIComponent(normalized)}`;
  try {
    const data = await fetchJson(url);
    const message = data?.message;
    if (!message) return null;
    return {
      abstract: stripTags(message.abstract || ""),
      subjects: uniqueList(message.subject || []),
      publisher: message.publisher || null,
      licenseUrls: uniqueList((message.license || []).map((license) => license?.URL))
    };
  } catch {
    return null;
  }
}

function buildMergedEntry(publication, openAlex, crossref) {
  const abstract = openAlex?.abstract || crossref?.abstract || null;
  const abstractSource = openAlex?.abstract ? "openalex" : crossref?.abstract ? "crossref" : null;
  return {
    publicationId: publication.publicationId || null,
    title: publication.title,
    year: publication.year || null,
    doi: normalizeDoi(publication.doi),
    doiUrl: publication.doiUrl || null,
    journal: publication.journal || null,
    abstract,
    abstractSource,
    primaryTopic: openAlex?.primaryTopic || null,
    topics: uniqueList([...(openAlex?.topics || []), ...(crossref?.subjects || [])], 10),
    keywords: uniqueList(openAlex?.keywords || [], 10),
    citedByCount: openAlex?.citedByCount || 0,
    landingPageUrl: openAlex?.landingPageUrl || publication.url || publication.doiUrl || null,
    publisher: crossref?.publisher || null,
    sources: {
      openAlex: Boolean(openAlex),
      crossref: Boolean(crossref)
    },
    fetchedAt: new Date().toISOString()
  };
}

function renderMarkdown(entries, totals) {
  const samples = entries
    .filter((entry) => entry.abstract)
    .slice(0, 8)
    .map((entry) => {
      const preview = entry.abstract.length > 240 ? `${entry.abstract.slice(0, 240)}...` : entry.abstract;
      return `### ${entry.title}\n\n- Vuosi: ${entry.year || "?"}\n- DOI: ${entry.doi || "puuttuu"}\n- Aihe: ${entry.primaryTopic || "ei tunnistettu"}\n- Tiivistelmä: ${preview}\n`;
    })
    .join("\n");

  return [
    "# Julkaisujen tiivistelmä- ja aiherikastus",
    "",
    `Luotu: ${new Date().toISOString()}`,
    "",
    `- DOI-julkaisuja: ${totals.withDoi}`,
    `- Rikastettuja merkintöjä: ${totals.enriched}`,
    `- Tiivistelmä löytyi: ${totals.withAbstract}`,
    `- OpenAlex-osumat: ${totals.withOpenAlex}`,
    `- Crossref-osumat: ${totals.withCrossref}`,
    "",
    "## Näytteet",
    "",
    samples || "Ei vielä tiivistelmiä välimuistissa."
  ].join("\n");
}

async function main() {
  const publications = await loadPublications();
  const doiPublications = publications
    .filter((publication) => publication.doi)
    .map((publication) => ({ ...publication, doi: normalizeDoi(publication.doi) }));

  const freshCache = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
  let enrichmentMap = hasUsableEnrichmentData(freshCache?.data) ? freshCache.data : null;

  if (!enrichmentMap) {
    const oldCache = readCache(CACHE_KEY);
    enrichmentMap = hasUsableEnrichmentData(oldCache?.data) ? oldCache.data : {};

    const missing = doiPublications.filter((publication) => !enrichmentMap[publication.doi]);
    if (missing.length > 0 && !isOfflineFetchMode()) {
      console.log(`[publication-abstracts] Haetaan ${missing.length} DOI-rikastusta...`);
      await runConcurrent(missing, 3, async (publication) => {
        const openAlex = await fetchOpenAlexByDoi(publication.doi);
        const crossref = await fetchCrossrefAbstract(publication.doi);
        enrichmentMap[publication.doi] = buildMergedEntry(publication, openAlex, crossref);
      });
      writeCache(CACHE_KEY, enrichmentMap);
    } else if (missing.length > 0) {
      console.log("[publication-abstracts] Offline-tila: uusia DOI-rikastuksia ei haeta verkosta.");
    }
  } else {
    console.log(`[publication-abstracts] Kaytetaan tuoretta valimuistia (${freshCache.savedAt}).`);
  }

  const entries = doiPublications
    .map((publication) => enrichmentMap[publication.doi] || buildMergedEntry(publication, null, null))
    .sort((a, b) => (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title, "fi"));

  const totals = {
    withDoi: doiPublications.length,
    enriched: entries.filter((entry) => entry.sources.openAlex || entry.sources.crossref).length,
    withAbstract: entries.filter((entry) => entry.abstract).length,
    withOpenAlex: entries.filter((entry) => entry.sources.openAlex).length,
    withCrossref: entries.filter((entry) => entry.sources.crossref).length
  };

  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), totals, entries }, null, 2));
  fs.writeFileSync(OUTPUT_MARKDOWN, renderMarkdown(entries, totals));

  console.log(`[publication-abstracts] DOI-julkaisuja: ${totals.withDoi}`);
  console.log(`[publication-abstracts] Tiivistelma loytyi: ${totals.withAbstract}`);
  console.log(`[publication-abstracts] Raportit: ${path.relative(ROOT, OUTPUT_JSON)}, ${path.relative(ROOT, OUTPUT_MARKDOWN)}`);
}

main().catch((error) => {
  console.error("[publication-abstracts] Epäonnistui:", error);
  process.exitCode = 1;
});
