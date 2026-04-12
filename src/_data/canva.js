const presentations = require("./canva-presentations.json");
const { loadHiddenIds } = require("./_curatedStubs");

module.exports = function () {
  const hidden = loadHiddenIds('canva');
  const rows = presentations.map((item) => {
    const urlMatch = String(item.link || "").match(/\/d\/([A-Za-z0-9_-]+)/);
    return {
      id: urlMatch ? urlMatch[1] : "",
      title: item.title || "Nimetön esitys",
      description: item.summary || "",
      url: item.link || null,
      thumbnail: item.thumbnail || null,
      date: item.date || item.publishedAt || item.createdAt || item.updatedAt || null,
      categories: Array.isArray(item.keywords) ? item.keywords : [],
      location: item.location || "",
      folder: item.folder || "",
      lang: item.lang || "fi",
      source: "json"
    };
  }).filter((item) => !hidden.has(item.id));

  const fiRows = rows.filter(r => r.lang !== "en");

  return {
    enabled: true,
    source: "json",
    tableRows: rows,
    fiRows,
    tickerRows: rows.slice(0, 12),
    cardRows: rows
  };
};
