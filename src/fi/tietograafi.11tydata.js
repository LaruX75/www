const { buildKnowledgeGraph } = require("../_data/knowledgeGraph");

// KNOWLEDGE-GRAPH-SSR-01: build-time projection consumed by
// src/fi/tietograafi.njk. Emits the entire graph (all nodes + edges)
// as ready-to-render view-model so the template renders zero runtime
// JSON fetches and JavaScript only toggles visibility of SSR items.
// Graph identity comes from buildKnowledgeGraph — this file must not
// invent node kinds, edge types, or curated relationships.

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

const COVERAGE_ORDER = [
  "researchLine",
  "theme",
  "project",
  "publication",
  "thesis",
  "presentation",
  "presentationContext",
  "course",
  "person",
  "topic"
];

const NUMBER_FORMATTER = new Intl.NumberFormat("fi-FI");
const DATE_FORMATTER = new Intl.DateTimeFormat("fi-FI", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

function prettyKind(kind) {
  return KIND_LABELS[kind] || kind || "Tuntematon";
}

function prettyEdge(type) {
  return EDGE_LABELS[type] || type || "Tuntematon";
}

function formatNumber(value) {
  return NUMBER_FORMATTER.format(Number(value || 0));
}

function formatTimestamp(value) {
  if (!value) return "";
  try {
    return DATE_FORMATTER.format(new Date(value));
  } catch {
    return String(value);
  }
}

function buildNodeMeta(node, degree) {
  const parts = [prettyKind(node.kind), `${formatNumber(degree)} yhteyttä`];
  if (node.year) parts.push(String(node.year));
  if (node.period) parts.push(node.period);
  if (node.contextTypeLabel) parts.push(node.contextTypeLabel);
  if (node.courseId) parts.push(node.courseId);
  return parts.join(" · ");
}

function buildEdgeMeta(edge) {
  const parts = [prettyEdge(edge.type)];
  if (edge.role) parts.push(edge.role);
  if (edge.period) parts.push(edge.period);
  return parts.join(" · ");
}

function buildNodeHaystack(node) {
  return [
    node.label,
    node.description,
    node.fullName,
    node.courseName,
    node.courseId,
    node.contextTypeLabel,
    node.period,
    node.kind
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildEdgeHaystack(edge, from, to) {
  return [
    prettyEdge(edge.type),
    edge.type,
    from?.label,
    to?.label,
    edge.evidence,
    from?.description,
    to?.description,
    edge.role,
    edge.period
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildProjection(graph) {
  const degrees = new Map(graph.nodes.map((node) => [node.id, 0]));
  graph.edges.forEach((edge) => {
    degrees.set(edge.from, (degrees.get(edge.from) || 0) + 1);
    degrees.set(edge.to, (degrees.get(edge.to) || 0) + 1);
  });

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

  const nodes = graph.nodes
    .map((node) => {
      const degree = degrees.get(node.id) || 0;
      return {
        id: node.id,
        kind: node.kind,
        kindLabel: prettyKind(node.kind),
        label: node.label || node.id,
        url: node.url || null,
        description: node.description || "",
        degree,
        metaLabel: buildNodeMeta(node, degree),
        haystack: buildNodeHaystack(node)
      };
    })
    .sort((a, b) => {
      if (b.degree !== a.degree) return b.degree - a.degree;
      return String(a.label).localeCompare(String(b.label), "fi");
    });

  const edges = graph.edges
    .map((edge) => {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      return {
        id: edge.id,
        type: edge.type,
        typeLabel: prettyEdge(edge.type),
        fromId: edge.from,
        toId: edge.to,
        fromLabel: from?.label || edge.from,
        toLabel: to?.label || edge.to,
        fromKind: from?.kind || "",
        toKind: to?.kind || "",
        fromKindLabel: prettyKind(from?.kind || ""),
        toKindLabel: prettyKind(to?.kind || ""),
        evidence: edge.evidence || "",
        metaLabel: buildEdgeMeta(edge),
        haystack: buildEdgeHaystack(edge, from, to)
      };
    })
    .sort((a, b) => {
      const typeDiff = a.typeLabel.localeCompare(b.typeLabel, "fi");
      if (typeDiff !== 0) return typeDiff;
      const fromDiff = a.fromLabel.localeCompare(b.fromLabel, "fi");
      if (fromDiff !== 0) return fromDiff;
      return a.toLabel.localeCompare(b.toLabel, "fi");
    });

  const nodeKindEntries = Object.entries(graph.nodeKinds).sort(
    (a, b) => b[1] - a[1] || prettyKind(a[0]).localeCompare(prettyKind(b[0]), "fi")
  );

  const edgeTypeEntries = Object.entries(graph.edgeTypes).sort(
    (a, b) => b[1] - a[1] || prettyEdge(a[0]).localeCompare(prettyEdge(b[0]), "fi")
  );

  const nodeKindCards = nodeKindEntries.map(([kind, count]) => ({
    kind,
    label: prettyKind(kind),
    count,
    countLabel: formatNumber(count)
  }));

  const edgeTypeCards = edgeTypeEntries.map(([type, count]) => ({
    type,
    label: prettyEdge(type),
    count,
    countLabel: formatNumber(count)
  }));

  const coverageBadges = COVERAGE_ORDER
    .filter((kind) => graph.nodeKinds[kind])
    .map((kind) => ({
      kind,
      label: prettyKind(kind),
      count: graph.nodeKinds[kind],
      countLabel: formatNumber(graph.nodeKinds[kind])
    }));

  const nodeFilterOptions = Object.entries(graph.nodeKinds)
    .map(([kind, count]) => ({
      value: kind,
      label: prettyKind(kind),
      count,
      countLabel: formatNumber(count)
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fi"));

  const edgeFilterOptions = Object.entries(graph.edgeTypes)
    .map(([type, count]) => ({
      value: type,
      label: prettyEdge(type),
      count,
      countLabel: formatNumber(count)
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fi"));

  return {
    generatedAt: graph.generatedAt,
    generatedAtLabel: formatTimestamp(graph.generatedAt),
    nodeCount: graph.nodeCount,
    edgeCount: graph.edgeCount,
    nodeCountLabel: formatNumber(graph.nodeCount),
    edgeCountLabel: formatNumber(graph.edgeCount),
    nodeKindCount: Object.keys(graph.nodeKinds).length,
    edgeTypeCount: Object.keys(graph.edgeTypes).length,
    nodeKindCountLabel: formatNumber(Object.keys(graph.nodeKinds).length),
    edgeTypeCountLabel: formatNumber(Object.keys(graph.edgeTypes).length),
    nodeKindCards,
    edgeTypeCards,
    coverageBadges,
    nodeFilterOptions,
    edgeFilterOptions,
    nodes,
    edges
  };
}

module.exports = {
  eleventyComputed: {
    knowledgeGraphPage: (data) => buildProjection(buildKnowledgeGraph(data))
  }
};
