const presentations = require("./canva-presentations.json");
const { loadHiddenIds } = require("./_curatedStubs");
const { normalizeCanvaUrl } = require("./canvaUrl");

module.exports = function () {
  const hidden = loadHiddenIds('canva');
  const rows = presentations.map((item) => {
    const urlMatch = String(item.link || "").match(/\/d\/([A-Za-z0-9_-]+)/);
    const designMatch = String(item.link || "").match(/\/design\/([A-Za-z0-9_-]+)\//);
    const id = designMatch ? designMatch[1] : (urlMatch ? urlMatch[1] : "");
    const url = normalizeCanvaUrl(item.link || "");
    return {
      id,
      title: item.title || "Nimetön esitys",
      description: item.summary || "",
      url: url || null,
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
