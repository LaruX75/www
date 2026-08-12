const { JSON_SCHEMA_VERSION } = require("./_shared");
const { buildKnowledgeGraph } = require("../_data/knowledgeGraph");

module.exports = class {
  data() {
    return {
      permalink: "/data/knowledge-graph.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    const graph = buildKnowledgeGraph(data);
    return JSON.stringify({
      version: JSON_SCHEMA_VERSION,
      generatedAt: graph.generatedAt,
      nodeCount: graph.nodeCount,
      edgeCount: graph.edgeCount,
      nodeKinds: graph.nodeKinds,
      edgeTypes: graph.edgeTypes,
      nodes: graph.nodes,
      edges: graph.edges
    }, null, 2);
  }
};
