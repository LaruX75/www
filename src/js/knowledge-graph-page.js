(function () {
  "use strict";

  // KNOWLEDGE-GRAPH-SSR-01: pure filter/search over SSR DOM.
  // No fetch, no runtime JSON, no HTML construction. All node and
  // edge markup is produced by src/fi/tietograafi.njk at build time.

  const NODE_KIND_LABELS = {
    course: "Opintojakso",
    person: "Henkilö",
    presentation: "Esitys",
    presentationContext: "Esityskonteksti",
    project: "Tutkimushanke",
    publication: "Julkaisu",
    researchLine: "Tutkimuslinja",
    theme: "Teema",
    thesis: "Opinnäyte",
    topic: "Aihe"
  };

  const EDGE_TYPE_LABELS = {
    advised: "Ohjaa",
    authorOf: "Kirjoittaa",
    belongsToResearchLine: "Kuuluu tutkimuslinjaan",
    connectedTo: "Liittyy",
    coversTheme: "Painottaa teemaa",
    hasTheme: "Sisältää teeman",
    hasTopic: "Sisältää aiheen",
    linkedPresentation: "Linkittyy esitykseen",
    linkedPresentationContext: "Linkittyy esityskontekstiin",
    linkedPublication: "Linkittyy julkaisuun",
    linkedThesis: "Linkittyy opinnäytteeseen",
    participatesIn: "Osallistuu hankkeeseen",
    presented: "Pitää esityksen",
    presentedIn: "Esiintyy kontekstissa",
    reviewed: "Tarkastaa",
    supportsResearchLine: "Tukee tutkimuslinjaa",
    usedInCourse: "Käytetään opintojaksolla"
  };

  const numberFormat = new Intl.NumberFormat("fi-FI");

  function formatCount(value) {
    return numberFormat.format(value);
  }

  function init() {
    const nodeSelect = document.getElementById("kg-node-kind-filter");
    const edgeSelect = document.getElementById("kg-edge-type-filter");
    const searchInput = document.getElementById("kg-search-filter");
    const status = document.querySelector("[data-kg-status]");
    const nodeCount = document.querySelector("[data-kg-node-count]");
    const edgeCount = document.querySelector("[data-kg-edge-count]");
    const nodeEmpty = document.querySelector("[data-kg-node-empty]");
    const edgeEmpty = document.querySelector("[data-kg-edge-empty]");

    const nodeItems = Array.from(document.querySelectorAll("[data-kg-node]"));
    const edgeItems = Array.from(document.querySelectorAll("[data-kg-edge]"));

    if (!nodeSelect || !edgeSelect || !searchInput) return;

    function apply() {
      const nodeKind = nodeSelect.value || "all";
      const edgeType = edgeSelect.value || "all";
      const query = String(searchInput.value || "").trim().toLowerCase();

      let visibleNodes = 0;
      const visibleNodeKinds = new Set();

      nodeItems.forEach((item) => {
        const kindMatches = nodeKind === "all" || item.dataset.kgKind === nodeKind;
        const searchMatches = !query || (item.dataset.kgHaystack || "").includes(query);
        const visible = kindMatches && searchMatches;
        item.hidden = !visible;
        if (visible) {
          visibleNodes += 1;
          if (item.dataset.kgKind) visibleNodeKinds.add(item.dataset.kgKind);
        }
      });

      let visibleEdges = 0;
      edgeItems.forEach((item) => {
        const typeMatches = edgeType === "all" || item.dataset.kgEdgeType === edgeType;
        const kindMatches = nodeKind === "all"
          || item.dataset.kgFromKind === nodeKind
          || item.dataset.kgToKind === nodeKind;
        const searchMatches = !query || (item.dataset.kgHaystack || "").includes(query);
        const visible = typeMatches && kindMatches && searchMatches;
        item.hidden = !visible;
        if (visible) visibleEdges += 1;
      });

      if (nodeCount) nodeCount.textContent = `${formatCount(visibleNodes)} osumaa`;
      if (edgeCount) edgeCount.textContent = `${formatCount(visibleEdges)} osumaa`;
      if (nodeEmpty) nodeEmpty.hidden = visibleNodes > 0;
      if (edgeEmpty) edgeEmpty.hidden = visibleEdges > 0;

      if (status) {
        const kindLabel = nodeKind === "all"
          ? "kaikki solmut"
          : NODE_KIND_LABELS[nodeKind] || nodeKind;
        const typeLabel = edgeType === "all"
          ? "kaikki suhteet"
          : EDGE_TYPE_LABELS[edgeType] || edgeType;
        status.textContent = `Rajaus: ${kindLabel} · ${typeLabel}`;
      }
    }

    nodeSelect.addEventListener("change", apply);
    edgeSelect.addEventListener("change", apply);
    searchInput.addEventListener("input", apply);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
