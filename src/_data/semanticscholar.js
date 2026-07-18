require("dotenv").config();
const { readCache, readCacheIfFresh, writeCache, fetchWithTimeout } = require("./_apiCache");

const CACHE_TTL_HOURS = 12;

const CACHE_KEY = "citations-openalex-semanticscholar";

async function fetchOpenAlex(orcidId) {
  const headers = { Accept: "application/json", "User-Agent": "jarilaru-fi-site/1.0 (mailto:jari.laru@oulu.fi)" };
  const [authorRes, worksRes] = await Promise.all([
    fetchWithTimeout(
      `https://api.openalex.org/authors?filter=orcid:${orcidId}&select=id,display_name,cited_by_count,works_count,summary_stats`,
      { headers }, 15000
    ),
    fetchWithTimeout(
      `https://api.openalex.org/works?filter=authorships.author.orcid:${orcidId}&select=doi,cited_by_count&per_page=100`,
      { headers }, 15000
    ),
  ]);

  let hIndex = 0, totalCitations = 0;
  const doiCitations = {};

  if (authorRes.ok) {
    const data = await authorRes.json();
    const author = data.results?.[0];
    if (author) {
      hIndex = author.summary_stats?.h_index || 0;
      totalCitations = author.cited_by_count || 0;
    }
  }
  if (worksRes.ok) {
    const data = await worksRes.json();
    (data.results || []).forEach((work) => {
      if (!work.doi) return;
      const doi = work.doi.replace("https://doi.org/", "").toLowerCase();
      doiCitations[doi] = Math.max(doiCitations[doi] || 0, work.cited_by_count || 0);
    });
  }
  return { hIndex, totalCitations, doiCitations };
}

async function fetchSemanticScholar(s2AuthorId) {
  const headers = { Accept: "application/json" };
  const [authorRes, papersRes] = await Promise.all([
    fetchWithTimeout(
      `https://api.semanticscholar.org/graph/v1/author/${s2AuthorId}?fields=name,paperCount,citationCount,hIndex`,
      { headers }, 15000
    ),
    fetchWithTimeout(
      `https://api.semanticscholar.org/graph/v1/author/${s2AuthorId}/papers?fields=title,citationCount,externalIds&limit=100`,
      { headers }, 15000
    ),
  ]);

  let hIndex = 0, totalCitations = 0;
  const doiCitations = {};

  if (authorRes.ok) {
    const data = await authorRes.json();
    totalCitations = data.citationCount || 0;
    hIndex = data.hIndex || 0;
  }
  if (papersRes.ok) {
    const data = await papersRes.json();
    (data.data || []).forEach((paper) => {
      const doi = paper.externalIds?.DOI?.toLowerCase();
      if (!doi) return;
      doiCitations[doi] = Math.max(doiCitations[doi] || 0, paper.citationCount || 0);
    });
  }
  return { hIndex, totalCitations, doiCitations };
}

/**
 * Semantic Scholar + OpenAlex -yhdistetty viittausdata.
 * Jos API:t eivät vastaa, käytetään viimeisintä onnistunutta välimuistia.
 */
module.exports = async function () {
  const orcidId = process.env.ORCID_ID || "0000-0003-0347-0182";
  const s2AuthorId = process.env.S2_AUTHOR_ID || "2016750";

  const fresh = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
  if (fresh?.data) {
    console.log(`Viittausdata: käytetään tuoretta välimuistia (${fresh.savedAt}).`);
    return fresh.data;
  }

  const cached = readCache(CACHE_KEY);

  console.log("Haetaan viittausdataa (OpenAlex + Semantic Scholar rinnakkain)...");
  const [oaResult, s2Result] = await Promise.allSettled([
    fetchOpenAlex(orcidId),
    fetchSemanticScholar(s2AuthorId),
  ]);

  const doiCitationsMap = {};
  let profileHIndex = 0;
  let profileTotalCitations = 0;
  let openAlexOk = false;
  let semanticScholarOk = false;

  if (oaResult.status === "fulfilled") {
    const { hIndex, totalCitations, doiCitations } = oaResult.value;
    profileHIndex = Math.max(profileHIndex, hIndex);
    profileTotalCitations = Math.max(profileTotalCitations, totalCitations);
    Object.entries(doiCitations).forEach(([doi, count]) => {
      doiCitationsMap[doi] = Math.max(doiCitationsMap[doi] || 0, count);
    });
    openAlexOk = true;
  } else {
    console.error("OpenAlex haku epäonnistui:", oaResult.reason?.message);
  }

  if (s2Result.status === "fulfilled") {
    const { hIndex, totalCitations, doiCitations } = s2Result.value;
    profileHIndex = Math.max(profileHIndex, hIndex);
    profileTotalCitations = Math.max(profileTotalCitations, totalCitations);
    Object.entries(doiCitations).forEach(([doi, count]) => {
      doiCitationsMap[doi] = Math.max(doiCitationsMap[doi] || 0, count);
    });
    semanticScholarOk = true;
  } else {
    console.error("Semantic Scholar haku epäonnistui:", s2Result.reason?.message);
  }

  const metrics = {
    doiCitations: doiCitationsMap,
    sources: "OpenAlex + Semantic Scholar",
    profileHIndex,
    profileTotalCitations
  };

  if (openAlexOk || semanticScholarOk) {
    writeCache(CACHE_KEY, { metrics });
    return { metrics };
  }

  if (cached?.data) {
    console.warn(`Viittausdata: käytetään välimuistia (${cached.savedAt}).`);
    return cached.data;
  }

  return { metrics };
};
