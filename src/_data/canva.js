const presentations = require("./canva-presentations.json");
const { loadHiddenIds } = require("./_curatedStubs");

module.exports = function () {
  const hidden = loadHiddenIds('canva');
  const rows = presentations.map((item) => {
    const urlMatch = String(item.link || "").match(/\/d\/([A-Za-z0-9_-]+)/);
    const id = urlMatch ? urlMatch[1] : "";
    const url = id
      ? `https://www.canva.com/design/${id}/view`
      : (item.link || null);
    return {
      id,
      title: item.title || "Nimetön esitys",
      description: item.summary || "",
      url,
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
