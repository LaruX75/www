const presentations = require("./canva-presentations.json");
const { loadHiddenIds } = require("./_curatedStubs");
const { getCanvaDesignId, normalizeCanvaUrl } = require("./canvaUrl");
const {
  readLocalPresentationSources,
  createCanvaPresentationLookup
} = require("./presentationSources");

module.exports = function () {
  const hidden = loadHiddenIds('canva');
  const canvaLookup = createCanvaPresentationLookup(readLocalPresentationSources());
  const rows = presentations.map((item) => {
    const sourceUrl = String(item.link || "").trim();
    const publicUrl = normalizeCanvaUrl(item.publicUrl || sourceUrl);
    const id = getCanvaDesignId(sourceUrl || publicUrl);
    const localMatch = canvaLookup.get(id) || {};
    const resolvedPublicUrl = publicUrl || localMatch.publicUrl || null;
    const resolvedSourceUrl = sourceUrl || localMatch.sourceUrl || null;
    return {
      id,
      title: item.title || "Nimetön esitys",
      description: item.summary || "",
      url: resolvedPublicUrl,
      publicUrl: resolvedPublicUrl,
      sourceUrl: resolvedSourceUrl,
      pageUrl: localMatch.pageUrl || null,
      thumbnail: item.thumbnail || null,
      date: item.date || item.publishedAt || item.createdAt || item.updatedAt || null,
      categories: Array.isArray(item.keywords) ? item.keywords : [],
      location: item.location || "",
      folder: item.folder || "",
      lang: item.lang || "fi",
      source: "json",
      jarjestaja: item.jarjestaja || "",
      kategoria: item.kategoria || "",
      paakortti: item.paakortti === true,
      asiantuntijaprofiili: Array.isArray(item.asiantuntijaprofiili) ? item.asiantuntijaprofiili : [],
      sivuyhteys: Array.isArray(item.sivuyhteys) ? item.sivuyhteys : [],
      courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : [],
    };
  }).filter((item) => !hidden.has(item.id));

  const fiRows = rows.filter(r => r.lang !== "en");
  const enRows = rows.filter(r => r.lang === "en");

  return {
    enabled: true,
    source: "json",
    tableRows: rows,
    fiRows,
    enRows,
    tickerRows: rows.slice(0, 12),
    cardRows: rows
  };
};
