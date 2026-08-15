const presentations = require("./canva-presentations.json");
const { loadHiddenIds } = require("./_curatedStubs");
const { getCanvaDesignId, normalizeCanvaUrl } = require("./canvaUrl");
const { buildCanvaMerged } = require("./canvaMerged");
const {
  readLocalPresentationSources,
  createCanvaPresentationLookup
} = require("./presentationSources");

module.exports = function () {
  const hidden = loadHiddenIds('canva');
  const canvaLookup = createCanvaPresentationLookup(readLocalPresentationSources());
  const mergedByLink = new Map(
    buildCanvaMerged().items.map((item) => [item.link || "", item])
  );
  const rows = presentations.map((item) => {
    const sourceUrl = String(item.link || "").trim();
    const publicUrl = normalizeCanvaUrl(item.publicUrl || sourceUrl);
    const merged = mergedByLink.get(sourceUrl) || null;
    const directId = getCanvaDesignId(sourceUrl || publicUrl);
    const mergedId = merged?.designId || null;
    // Prefer the concrete /d/ or public Canva ID from the row itself.
    // The merged dataset can map shortlinks to a richer design id, but using it
    // as the primary id collapses distinct decks that happen to share a link map.
    const id = directId || mergedId;
    const localMatch =
      canvaLookup.get(id) ||
      (mergedId && mergedId !== id ? canvaLookup.get(mergedId) : null) ||
      {};
    const rich = merged?.rich || null;
    const shortDescription = item.summary || "";
    const richSummary = rich?.richSummary || "";
    const resolvedPublicUrl = publicUrl || localMatch.publicUrl || null;
    const resolvedSourceUrl = sourceUrl || localMatch.sourceUrl || null;
    return {
      id,
      title: item.title || "Nimetön esitys",
      description: richSummary || shortDescription,
      summary: shortDescription,
      richSummary,
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
      source: "canva",
      jarjestaja: item.jarjestaja || "",
      kategoria: item.kategoria || "",
      paakortti: item.paakortti === true,
      asiantuntijaprofiili: Array.isArray(item.asiantuntijaprofiili) ? item.asiantuntijaprofiili : [],
      sivuyhteys: Array.isArray(item.sivuyhteys) ? item.sivuyhteys : [],
      courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : [],
      sourceLanguage: rich?.lang || item.lang || "",
      slideCount: Number.isFinite(rich?.slideCount) ? rich.slideCount : null,
      themes: Array.isArray(rich?.themes) ? rich.themes : [],
    };
  }).filter((item) => !hidden.has(item.id));

  const fiRows = rows.filter(r => r.lang !== "en");
  const enRows = rows.filter(r => r.lang === "en");

  return {
    enabled: true,
    source: "canva",
    tableRows: rows,
    fiRows,
    enRows,
    tickerRows: rows.slice(0, 12),
    cardRows: rows
  };
};
