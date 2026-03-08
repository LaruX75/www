require("dotenv").config();
const { readCache, readCacheIfFresh, writeCache, fetchWithTimeout } = require("./_apiCache");

const CACHE_TTL_HOURS = 12;

const CACHE_KEY = "citations-openalex-semanticscholar";

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

  const doiCitationsMap = {};
  let profileHIndex = 0;
  let profileTotalCitations = 0;
  let openAlexOk = false;
  let semanticScholarOk = false;

  try {
    console.log("Haetaan OpenAlex-viittausdataa...");

    const authorRes = await fetchWithTimeout(
      `https://api.openalex.org/authors?filter=orcid:${orcidId}&select=id,display_name,cited_by_count,works_count,summary_stats`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "jarilaru-fi-site/1.0 (mailto:jari.laru@oulu.fi)"
        }
      },
      15000
    );

    if (authorRes.ok) {
      const authorData = await authorRes.json();
      const author = authorData.results?.[0];
      if (author) {
        profileHIndex = Math.max(profileHIndex, author.summary_stats?.h_index || 0);
        profileTotalCitations = Math.max(profileTotalCitations, author.cited_by_count || 0);
        openAlexOk = true;
      }
    }

    const worksRes = await fetchWithTimeout(
      `https://api.openalex.org/works?filter=authorships.author.orcid:${orcidId}&select=doi,cited_by_count&per_page=100`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "jarilaru-fi-site/1.0 (mailto:jari.laru@oulu.fi)"
        }
      },
      15000
    );

    if (worksRes.ok) {
      const worksData = await worksRes.json();
      (worksData.results || []).forEach((work) => {
        if (!work.doi) return;
        const doi = work.doi.replace("https://doi.org/", "").toLowerCase();
        doiCitationsMap[doi] = Math.max(doiCitationsMap[doi] || 0, work.cited_by_count || 0);
      });
      openAlexOk = true;
    }
  } catch (error) {
    console.error("OpenAlex haku epäonnistui:", error.message);
  }

  try {
    console.log("Haetaan Semantic Scholar -viittausdataa...");

    const s2AuthorRes = await fetchWithTimeout(
      `https://api.semanticscholar.org/graph/v1/author/${s2AuthorId}?fields=name,paperCount,citationCount,hIndex`,
      { headers: { Accept: "application/json" } },
      15000
    );

    if (s2AuthorRes.ok) {
      const s2Author = await s2AuthorRes.json();
      profileTotalCitations = Math.max(profileTotalCitations, s2Author.citationCount || 0);
      profileHIndex = Math.max(profileHIndex, s2Author.hIndex || 0);
      semanticScholarOk = true;
    }

    const s2PapersRes = await fetchWithTimeout(
      `https://api.semanticscholar.org/graph/v1/author/${s2AuthorId}/papers?fields=title,citationCount,externalIds&limit=100`,
      { headers: { Accept: "application/json" } },
      15000
    );

    if (s2PapersRes.ok) {
      const s2PapersData = await s2PapersRes.json();
      (s2PapersData.data || []).forEach((paper) => {
        const doi = paper.externalIds?.DOI?.toLowerCase();
        if (!doi) return;
        doiCitationsMap[doi] = Math.max(doiCitationsMap[doi] || 0, paper.citationCount || 0);
      });
      semanticScholarOk = true;
    }
  } catch (error) {
    console.error("Semantic Scholar haku epäonnistui:", error.message);
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
