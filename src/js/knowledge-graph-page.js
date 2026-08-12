(function () {
  "use strict";

  const KIND_LABELS = {
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

  const EDGE_LABELS = {
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

  const MAX_NODE_ITEMS = 24;
  const MAX_EDGE_ITEMS = 32;

  function escHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function compactDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("fi-FI", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch {
      return String(value);
    }
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("fi-FI").format(Number(value || 0));
  }

  function prettyKind(kind) {
    return KIND_LABELS[kind] || kind || "Tuntematon";
  }

  function prettyEdge(type) {
    return EDGE_LABELS[type] || type || "Tuntematon";
  }

  function summarize(text, maxLength) {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (!normalized) return "";
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trim()}…` : normalized;
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  }

  function buildNodeMeta(node, degree) {
    const parts = [prettyKind(node.kind), `${formatNumber(degree)} yhteyttä`];
    if (node.year) parts.push(String(node.year));
    if (node.period) parts.push(node.period);
    if (node.contextTypeLabel) parts.push(node.contextTypeLabel);
    if (node.courseId) parts.push(node.courseId);
    return parts.join(" · ");
  }

  async function loadGraph() {
    const response = await fetch("/data/knowledge-graph.json");
    if (!response.ok) {
      throw new Error(`knowledge-graph fetch failed: ${response.status}`);
    }
    return response.json();
  }

  function populateSelect(select, entries, formatter) {
    if (!select) return;
    select.innerHTML = [
      select.querySelector("option")?.outerHTML || ""
    ].filter(Boolean).join("");
    entries.forEach(([value, count]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = `${formatter(value)} (${count})`;
      select.appendChild(option);
    });
  }

  function renderKindCards(nodeKinds) {
    const host = document.querySelector("[data-kg-node-kinds]");
    if (!host) return;
    host.innerHTML = Object.entries(nodeKinds)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fi"))
      .map(([kind, count]) => `
        <div class="col-sm-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm p-3 knowledge-graph-kind-card">
            <div class="d-flex justify-content-between align-items-center gap-3">
              <div>
                <div class="fw-bold">${escHtml(prettyKind(kind))}</div>
                <div class="text-muted small">${escHtml(kind)}</div>
              </div>
              <span class="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle fs-6">${formatNumber(count)}</span>
            </div>
          </div>
        </div>
      `).join("");
  }

  function renderEdgeCards(edgeTypes) {
    const host = document.querySelector("[data-kg-edge-types]");
    if (!host) return;
    host.innerHTML = Object.entries(edgeTypes)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fi"))
      .map(([type, count]) => `
        <div class="col-sm-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm p-3 knowledge-graph-edge-card">
            <div class="d-flex justify-content-between align-items-center gap-3">
              <div>
                <div class="fw-bold">${escHtml(prettyEdge(type))}</div>
                <div class="text-muted small">${escHtml(type)}</div>
              </div>
              <span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle fs-6">${formatNumber(count)}</span>
            </div>
          </div>
        </div>
      `).join("");
  }

  function renderCoverage(nodeKinds) {
    const host = document.querySelector("[data-kg-coverage]");
    if (!host) return;
    const preferredOrder = ["researchLine", "theme", "project", "publication", "thesis", "presentation", "presentationContext", "course", "person", "topic"];
    host.innerHTML = preferredOrder
      .filter((kind) => nodeKinds[kind])
      .map((kind) => `
        <span class="knowledge-graph-coverage-badge">
          <strong>${formatNumber(nodeKinds[kind])}</strong>
          <span>${escHtml(prettyKind(kind))}</span>
        </span>
      `).join("");
  }

  function setupExplorer(graph) {
    const nodeSelect = document.getElementById("kg-node-kind-filter");
    const edgeSelect = document.getElementById("kg-edge-type-filter");
    const searchInput = document.getElementById("kg-search-filter");
    const nodeHost = document.querySelector("[data-kg-node-list]");
    const edgeHost = document.querySelector("[data-kg-edge-list]");
    const status = document.querySelector("[data-kg-status]");
    const nodeCount = document.querySelector("[data-kg-node-count]");
    const edgeCount = document.querySelector("[data-kg-edge-count]");

    if (!nodeSelect || !edgeSelect || !searchInput || !nodeHost || !edgeHost) return;

    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
    const degrees = new Map(graph.nodes.map((node) => [node.id, 0]));

    graph.edges.forEach((edge) => {
      degrees.set(edge.from, (degrees.get(edge.from) || 0) + 1);
      degrees.set(edge.to, (degrees.get(edge.to) || 0) + 1);
    });

    populateSelect(
      nodeSelect,
      Object.entries(graph.nodeKinds).sort((a, b) => prettyKind(a[0]).localeCompare(prettyKind(b[0]), "fi")),
      prettyKind
    );
    populateSelect(
      edgeSelect,
      Object.entries(graph.edgeTypes).sort((a, b) => prettyEdge(a[0]).localeCompare(prettyEdge(b[0]), "fi")),
      prettyEdge
    );

    function render() {
      const nodeKind = nodeSelect.value || "all";
      const edgeType = edgeSelect.value || "all";
      const query = String(searchInput.value || "").trim().toLowerCase();

      const filteredNodes = graph.nodes
        .filter((node) => nodeKind === "all" || node.kind === nodeKind)
        .filter((node) => {
          if (!query) return true;
          const haystack = [
            node.label,
            node.description,
            node.fullName,
            node.courseName,
            node.courseId,
            node.contextTypeLabel,
            node.period
          ].join(" ").toLowerCase();
          return haystack.includes(query);
        })
        .sort((a, b) => {
          const degreeDiff = (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0);
          if (degreeDiff !== 0) return degreeDiff;
          return String(a.label || "").localeCompare(String(b.label || ""), "fi");
        });

      const allowedNodeIds = new Set(filteredNodes.map((node) => node.id));

      const filteredEdges = graph.edges
        .filter((edge) => edgeType === "all" || edge.type === edgeType)
        .filter((edge) => {
          if (nodeKind === "all") return true;
          return allowedNodeIds.has(edge.from) || allowedNodeIds.has(edge.to);
        })
        .filter((edge) => {
          if (!query) return true;
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          const haystack = [
            prettyEdge(edge.type),
            from?.label,
            to?.label,
            edge.evidence,
            from?.description,
            to?.description
          ].join(" ").toLowerCase();
          return haystack.includes(query);
        });

      nodeCount.textContent = `${formatNumber(filteredNodes.length)} osumaa`;
      edgeCount.textContent = `${formatNumber(filteredEdges.length)} osumaa`;
      status.textContent = `Rajaus: ${nodeKind === "all" ? "kaikki solmut" : prettyKind(nodeKind)} · ${edgeType === "all" ? "kaikki suhteet" : prettyEdge(edgeType)}`;

      nodeHost.innerHTML = filteredNodes.slice(0, MAX_NODE_ITEMS).map((node) => {
        const degree = degrees.get(node.id) || 0;
        const detail = node.url
          ? `<a href="${escHtml(node.url)}" class="small text-decoration-none">Avaa kohde <i class="bi bi-arrow-up-right ms-1"></i></a>`
          : "";
        return `
          <article class="knowledge-graph-item">
            <div class="knowledge-graph-item-title">${escHtml(node.label || node.id)}</div>
            <div class="knowledge-graph-item-meta">${escHtml(buildNodeMeta(node, degree))}</div>
            ${node.description ? `<p class="knowledge-graph-item-desc">${escHtml(summarize(node.description, 180))}</p>` : ""}
            ${detail}
          </article>
        `;
      }).join("") || `<p class="text-muted small mb-0">Rajauksella ei löytynyt solmuja.</p>`;

      edgeHost.innerHTML = filteredEdges.slice(0, MAX_EDGE_ITEMS).map((edge) => {
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        const meta = [prettyEdge(edge.type)];
        if (edge.role) meta.push(edge.role);
        if (edge.period) meta.push(edge.period);
        return `
          <article class="knowledge-graph-item">
            <div class="knowledge-graph-item-title">
              ${escHtml(from?.label || edge.from)}
              <span class="knowledge-graph-relation-arrow">→</span>
              ${escHtml(to?.label || edge.to)}
            </div>
            <div class="knowledge-graph-item-meta">${escHtml(meta.join(" · "))}</div>
            ${edge.evidence ? `<p class="knowledge-graph-item-desc">${escHtml(summarize(edge.evidence, 180))}</p>` : ""}
            <p class="knowledge-graph-item-desc">
              <span class="badge text-bg-light border">${escHtml(prettyKind(from?.kind || ""))}</span>
              <span class="badge text-bg-light border">${escHtml(prettyKind(to?.kind || ""))}</span>
            </p>
          </article>
        `;
      }).join("") || `<p class="text-muted small mb-0">Rajauksella ei löytynyt suhteita.</p>`;
    }

    nodeSelect.addEventListener("change", render);
    edgeSelect.addEventListener("change", render);
    searchInput.addEventListener("input", render);
    render();
  }

  async function init() {
    try {
      const graph = await loadGraph();

      setText("[data-kg-summary='nodes']", `${formatNumber(graph.nodeCount)} solmua`);
      setText("[data-kg-summary='edges']", `${formatNumber(graph.edgeCount)} suhdetta`);
      setText("[data-kg-summary='generated']", `Päivitetty ${compactDate(graph.generatedAt)}`);

      setText("[data-kg-kpi='nodes']", formatNumber(graph.nodeCount));
      setText("[data-kg-kpi='edges']", formatNumber(graph.edgeCount));
      setText("[data-kg-kpi='kinds']", formatNumber(Object.keys(graph.nodeKinds || {}).length));
      setText("[data-kg-kpi='edgeTypes']", formatNumber(Object.keys(graph.edgeTypes || {}).length));

      renderCoverage(graph.nodeKinds || {});
      renderKindCards(graph.nodeKinds || {});
      renderEdgeCards(graph.edgeTypes || {});
      setupExplorer(graph);
    } catch (error) {
      console.error("knowledge-graph-page:", error);
      setText("[data-kg-status]", "Tietograafin lataus epäonnistui.");
      const fallbackTargets = [
        document.querySelector("[data-kg-node-list]"),
        document.querySelector("[data-kg-edge-list]")
      ].filter(Boolean);
      fallbackTargets.forEach((node) => {
        node.innerHTML = `<p class="text-danger small mb-0">Datan lataus epäonnistui. Tarkista <a href="/data/knowledge-graph.json">JSON-endpoint</a>.</p>`;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
