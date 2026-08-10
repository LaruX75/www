const toPublicContentRecord = require("../_utils/toPublicContentRecord");
const presentationContexts = require("./presentationContexts.json");
const curatedProjectLinks = require("./curated/projectLinks.json");
const researchProjects = require("./researchProjects");

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePlain(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function safeNodeId(prefix, value) {
  return `${prefix}:${normalizePlain(value) || "unknown"}`;
}

function canonicalPersonId(name) {
  const normalized = normalizePlain(name);
  if (
    normalized === "jari-laru" ||
    normalized === "laru-jari" ||
    normalized === "laru-j" ||
    normalized === "laru-jari-j" ||
    normalized === "jari-l" ||
    normalized === "laru-jari-jari"
  ) {
    return "person:jari-laru";
  }
  return safeNodeId("person", name);
}

function summarize(value, maxLength = 280) {
  const text = normalizeText(value);
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
}

function createGraph() {
  return {
    nodes: [],
    edges: [],
    _nodeIds: new Set(),
    _edgeIds: new Set()
  };
}

function addNode(graph, node) {
  if (!node?.id || graph._nodeIds.has(node.id)) return node?.id || null;
  graph._nodeIds.add(node.id);
  graph.nodes.push(node);
  return node.id;
}

function addEdge(graph, edge) {
  if (!edge?.from || !edge?.to || !edge?.type) return null;
  const edgeId = `${edge.type}|${edge.from}|${edge.to}`;
  if (graph._edgeIds.has(edgeId)) return edgeId;
  graph._edgeIds.add(edgeId);
  graph.edges.push({
    id: edgeId,
    ...edge
  });
  return edgeId;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = String(item?.[key] || "").trim() || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function splitAuthorNames(value) {
  return normalizeText(value)
    .split(/\s*;\s*/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function normalizeMaterialUrl(url = "") {
  return String(url || "")
    .trim()
    .replace(/^http:\/\//i, "https://")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function courseNodeId(course = {}) {
  const courseId = normalizeText(course.courseId);
  const courseName = normalizeText(course.courseName);
  return safeNodeId("course", courseId || courseName);
}

function buildPresentationContextLookup(items = []) {
  const byUrl = new Map();
  const byTitle = new Map();

  toArray(items).forEach((context) => {
    const contextId = safeNodeId("presentation-context", context.id || context.title);
    toArray(context.materialUrls).forEach((url) => {
      const key = normalizeMaterialUrl(url);
      if (!key) return;
      const list = byUrl.get(key) || [];
      list.push(contextId);
      byUrl.set(key, list);
    });
    toArray(context.materialTitles).forEach((title) => {
      const key = normalizePlain(title);
      if (!key) return;
      const list = byTitle.get(key) || [];
      list.push(contextId);
      byTitle.set(key, list);
    });
  });

  return { byUrl, byTitle };
}

const PROJECT_LINE_MAP = {
  "generation-ai": ["ai-literacy"],
  tkaedite: ["teacher-education"],
  makect: ["teacher-education"],
  lea: ["teacher-education"],
  mosil: ["long-term-learning"],
  rotuaari: ["long-term-learning"]
};

function addProjectNodes(graph, data, rootPersonId) {
  const projectNodes = new Map();

  toArray(data.researchProjects || researchProjects).forEach((project) => {
    const projectKey = normalizePlain(project.name || project.fullName);
    const projectId = safeNodeId("project", project.name || project.fullName);
    addNode(graph, {
      id: projectId,
      kind: "project",
      label: normalizeText(project.name || project.fullName),
      fullName: normalizeText(project.fullName),
      url: normalizeText(project.url) || null,
      period: normalizeText(project.period),
      funder: normalizeText(project.funder),
      active: project.active === true
    });

    addEdge(graph, {
      type: "participatesIn",
      from: rootPersonId,
      to: projectId,
      role: normalizeText(project.role),
      period: normalizeText(project.period)
    });

    const mappedLines = PROJECT_LINE_MAP[normalizePlain(project.name || project.fullName)] || [];
    mappedLines.forEach((lineKey) => {
      addEdge(graph, {
        type: "supportsResearchLine",
        from: projectId,
        to: safeNodeId("research-line", lineKey)
      });
    });

    projectNodes.set(projectKey, projectId);
  });

  return projectNodes;
}

function addResearchLineAndThemeNodes(graph, researchProgram) {
  const lineNodes = new Map();
  const themeLabels = researchProgram?.thesisThemeLabels || {};

  toArray(researchProgram?.lines).forEach((line) => {
    const lineId = safeNodeId("research-line", line.key);
    addNode(graph, {
      id: lineId,
      kind: "researchLine",
      label: normalizeText(line.title),
      key: normalizeText(line.key),
      url: normalizeText(line.themeUrl || line.secondaryUrl) || null,
      description: summarize(line.description, 240)
    });
    lineNodes.set(line.key, lineId);
  });

  Object.entries(themeLabels).forEach(([key, label]) => {
    addNode(graph, {
      id: safeNodeId("theme", key),
      kind: "theme",
      label: normalizeText(label),
      key
    });
  });

  return { lineNodes, themeLabels };
}

function addPublicationNodes(graph, researchProgram, lineNodes) {
  const publicationNodes = new Map();

  toArray(researchProgram?.publications).forEach((publication) => {
    const publicationId = safeNodeId("publication", publication.anchorId || publication.url || publication.title);
    const publicationKey = normalizeText(publication.anchorId);
    addNode(graph, {
      id: publicationId,
      kind: "publication",
      label: normalizeText(publication.title),
      url: normalizeText(publication.url) || null,
      year: publication.year || null,
      publicationType: normalizeText(publication.typeFi || publication.typeCode),
      description: summarize(publication.description || publication.abstract || publication.summary)
    });

    splitAuthorNames(publication.authors).forEach((author) => {
      const personId = canonicalPersonId(author);
      addNode(graph, {
        id: personId,
        kind: "person",
        label: author
      });
      addEdge(graph, {
        type: "authorOf",
        from: personId,
        to: publicationId
      });
    });

    if (publication.researchLine && lineNodes.has(publication.researchLine)) {
      const lineId = lineNodes.get(publication.researchLine);
      addEdge(graph, {
        type: "belongsToResearchLine",
        from: publicationId,
        to: lineId
      });
    }

    toArray(publication.researchThemes).forEach((themeKey) => {
      const themeId = safeNodeId("theme", themeKey);
      addEdge(graph, {
        type: "hasTheme",
        from: publicationId,
        to: themeId
      });
      if (publication.researchLine && lineNodes.has(publication.researchLine)) {
        addEdge(graph, {
          type: "coversTheme",
          from: lineNodes.get(publication.researchLine),
          to: themeId
        });
      }
    });

    if (publicationKey) {
      publicationNodes.set(publicationKey, publicationId);
    }
  });

  return publicationNodes;
}

function addThesisNodes(graph, researchProgram, lineNodes, rootPersonId) {
  const thesisNodes = new Map();

  toArray(researchProgram?.theses).forEach((thesis) => {
    const thesisId = safeNodeId("thesis", thesis.link || thesis.title);
    const thesisKey = normalizeMaterialUrl(thesis.link);
    addNode(graph, {
      id: thesisId,
      kind: "thesis",
      label: normalizeText(thesis.title),
      url: normalizeText(thesis.link) || null,
      year: thesis.year || null,
      thesisType: normalizeText(thesis.type),
      description: summarize(thesis.abstract || thesis.researchSummary)
    });

    toArray(thesis.authors).forEach((author) => {
      const personId = canonicalPersonId(author);
      addNode(graph, {
        id: personId,
        kind: "person",
        label: normalizeText(author)
      });
      addEdge(graph, {
        type: "authorOf",
        from: personId,
        to: thesisId
      });
    });

    const advisors = toArray(thesis.advisors).map(normalizePlain);
    const reviewers = toArray(thesis.reviewers).map(normalizePlain);
    const jariInAdvisors = advisors.includes("laru-jari");
    const jariInReviewers = reviewers.includes("laru-jari");

    addEdge(graph, {
      type: jariInAdvisors ? "advised" : (jariInReviewers ? "reviewed" : "connectedTo"),
      from: rootPersonId,
      to: thesisId
    });

    if (thesis.researchLine && lineNodes.has(thesis.researchLine)) {
      const lineId = lineNodes.get(thesis.researchLine);
      addEdge(graph, {
        type: "belongsToResearchLine",
        from: thesisId,
        to: lineId
      });
    }

    toArray(thesis.researchThemes).forEach((themeKey) => {
      const themeId = safeNodeId("theme", themeKey);
      addEdge(graph, {
        type: "hasTheme",
        from: thesisId,
        to: themeId
      });
    });

    if (thesisKey) {
      thesisNodes.set(thesisKey, thesisId);
    }
  });

  return thesisNodes;
}

function addPresentationContextNodes(graph) {
  const contextNodes = new Map();

  toArray(presentationContexts.items).forEach((context) => {
    const contextId = safeNodeId("presentation-context", context.id || context.title);
    const contextKey = normalizeText(context.id);
    addNode(graph, {
      id: contextId,
      kind: "presentationContext",
      label: normalizeText(context.title),
      date: normalizeText(context.date),
      contextType: normalizeText(context.type),
      contextTypeLabel: normalizeText(context.typeLabel),
      organizer: normalizeText(context.organizer),
      audience: summarize(context.audience, 180),
      description: summarize(context.summary)
    });

    toArray(context.topics).forEach((topic) => {
      const topicId = safeNodeId("topic", topic);
      addNode(graph, {
        id: topicId,
        kind: "topic",
        label: normalizeText(topic)
      });
      addEdge(graph, {
        type: "hasTopic",
        from: contextId,
        to: topicId
      });
    });

    if (contextKey) {
      contextNodes.set(contextKey, contextId);
    }
  });

  return contextNodes;
}

function addPresentationNodes(graph, data, rootPersonId) {
  const presentationNodes = new Map();
  const collections = data.collections || {};
  const items = toArray(collections.presentations);
  const contextLookup = buildPresentationContextLookup(presentationContexts.items);

  items.forEach((item) => {
    const record = toPublicContentRecord(item);
    if (!record) return;

    const presentationId = safeNodeId("presentation", record.url);
    addNode(graph, {
      id: presentationId,
      kind: "presentation",
      label: normalizeText(record.title),
      url: normalizeText(record.url) || null,
      date: normalizeText(record.date),
      lang: normalizeText(record.lang),
      source: normalizeText(item?.data?.source || record.source),
      teachingUnit: normalizeText(item?.data?.teachingUnit || record.teachingUnit),
      description: summarize(
        item?.data?.description ||
        record.description ||
        item?.data?.summary
      )
    });

    addEdge(graph, {
      type: "presented",
      from: rootPersonId,
      to: presentationId
    });

    toArray(item?.data?.courseContexts).forEach((course) => {
      const courseId = courseNodeId(course);
      addNode(graph, {
        id: courseId,
        kind: "course",
        label: normalizeText(course.courseName || course.courseId),
        courseId: normalizeText(course.courseId),
        courseName: normalizeText(course.courseName),
        teachingUnit: normalizeText(record.teachingUnit)
      });
      addEdge(graph, {
        type: "usedInCourse",
        from: presentationId,
        to: courseId
      });
    });

    const candidateUrls = [
      record.url,
      item?.data?.url,
      item?.data?.sourceUrl
    ].map(normalizeMaterialUrl).filter(Boolean);
    const candidateTitles = [record.title, item?.data?.title].map(normalizePlain).filter(Boolean);
    const matchedContextIds = new Set();

    candidateUrls.forEach((url) => {
      toArray(contextLookup.byUrl.get(url)).forEach((contextId) => matchedContextIds.add(contextId));
    });
    candidateTitles.forEach((title) => {
      toArray(contextLookup.byTitle.get(title)).forEach((contextId) => matchedContextIds.add(contextId));
    });

    matchedContextIds.forEach((contextId) => {
      addEdge(graph, {
        type: "presentedIn",
        from: presentationId,
        to: contextId
      });
    });

    const presentationKey = normalizeMaterialUrl(record.url);
    if (presentationKey) {
      presentationNodes.set(presentationKey, presentationId);
    }
  });

  return presentationNodes;
}

function ensureExternalPublicationNode(graph, publicationNodes, entry) {
  if (!entry) return null;

  const doiKey = normalizeText(entry.doi);
  const urlKey = normalizeMaterialUrl(entry.url);
  const nodeKey = doiKey || urlKey || normalizeText(entry.title);
  if (!nodeKey) return null;

  const existingNodeId = (doiKey && publicationNodes.get(doiKey)) || (urlKey && publicationNodes.get(urlKey));
  if (existingNodeId) {
    return existingNodeId;
  }

  const publicationId = safeNodeId("publication", nodeKey);
  addNode(graph, {
    id: publicationId,
    kind: "publication",
    label: normalizeText(entry.title),
    url: normalizeText(entry.url) || null,
    year: entry.year || null,
    doi: normalizeText(entry.doi) || null,
    publicationType: normalizeText(entry.journal),
    description: summarize(entry.description)
  });

  if (doiKey) {
    publicationNodes.set(doiKey, publicationId);
  }
  if (urlKey) {
    publicationNodes.set(urlKey, publicationId);
  }

  return publicationId;
}

function buildExternalCanvaPresentationLookup(canvaData = {}) {
  const rows = toArray(canvaData.cardRows || canvaData.tableRows);
  const bySourceUrl = new Map();

  rows.forEach((item) => {
    const sourceUrl = normalizeMaterialUrl(item.sourceUrl);
    if (sourceUrl) {
      bySourceUrl.set(sourceUrl, item);
    }
  });

  return { bySourceUrl };
}

function ensureExternalCanvaPresentationNode(graph, presentationNodes, rootPersonId, item) {
  if (!item) return null;

  const sourceUrl = normalizeMaterialUrl(item.sourceUrl);
  const publicUrl = normalizeMaterialUrl(item.publicUrl || item.url);
  const nodeKey = sourceUrl || publicUrl || normalizeText(item.title);
  if (!nodeKey) return null;

  const existingNodeId = sourceUrl
    ? presentationNodes.get(sourceUrl)
    : presentationNodes.get(publicUrl);

  if (existingNodeId) {
    return existingNodeId;
  }

  const presentationId = safeNodeId("presentation", nodeKey);
  addNode(graph, {
    id: presentationId,
    kind: "presentation",
    label: normalizeText(item.title),
    url: normalizeText(item.publicUrl || item.url || item.sourceUrl) || null,
    sourceUrl: normalizeText(item.sourceUrl) || null,
    date: normalizeText(item.date),
    lang: normalizeText(item.lang),
    source: "canva",
    organizer: normalizeText(item.jarjestaja),
    description: summarize(item.description || item.richSummary || item.summary)
  });

  addEdge(graph, {
    type: "presented",
    from: rootPersonId,
    to: presentationId
  });

  if (sourceUrl) {
    presentationNodes.set(sourceUrl, presentationId);
  }
  if (publicUrl && !sourceUrl) {
    presentationNodes.set(publicUrl, presentationId);
  }

  return presentationId;
}

function addCuratedProjectLinks(
  graph,
  {
    projectNodes,
    publicationNodes,
    thesisNodes,
    presentationNodes,
    contextNodes,
    rootPersonId,
    externalCanvaPresentations
  }
) {
  function warnMissing(projectKey, targetType, targetValue) {
    console.warn(
      `[knowledgeGraph] Missing curated ${targetType} target for project "${projectKey}": ${targetValue}`
    );
  }

  function connectCuratedItems(projectKey, entries, options = {}) {
    const {
      lookup,
      keyField,
      edgeType,
      normalize = normalizeText
    } = options;

    const projectId = projectNodes.get(normalizePlain(projectKey));
    if (!projectId) {
      console.warn(`[knowledgeGraph] Missing curated project node: ${projectKey}`);
      return;
    }

    toArray(entries).forEach((entry) => {
      const rawValue = Array.isArray(keyField)
        ? keyField.map((field) => entry?.[field]).find(Boolean)
        : entry?.[keyField];
      const targetId = lookup.get(normalize(rawValue));
      if (!targetId) {
        warnMissing(projectKey, edgeType, rawValue);
        return;
      }

      addEdge(graph, {
        type: edgeType,
        from: projectId,
        to: targetId,
        source: "curatedProjectLinks",
        confidence: 1,
        evidence: summarize(entry.evidence, 180)
      });
    });
  }

  Object.entries(curatedProjectLinks).forEach(([projectKey, config]) => {
    toArray(config.publications).forEach((entry) => {
      if (entry?.anchorId) return;
      ensureExternalPublicationNode(graph, publicationNodes, entry);
    });

    toArray(config.presentations).forEach((entry) => {
      const sourceUrl = normalizeMaterialUrl(entry?.sourceUrl);
      if (!sourceUrl || presentationNodes.has(sourceUrl)) return;

      ensureExternalCanvaPresentationNode(
        graph,
        presentationNodes,
        rootPersonId,
        externalCanvaPresentations.bySourceUrl.get(sourceUrl)
      );
    });

    connectCuratedItems(projectKey, config.publications, {
      lookup: publicationNodes,
      keyField: ["anchorId", "doi", "url"],
      edgeType: "linkedPublication"
    });
    connectCuratedItems(projectKey, config.theses, {
      lookup: thesisNodes,
      keyField: "link",
      edgeType: "linkedThesis",
      normalize: normalizeMaterialUrl
    });
    connectCuratedItems(projectKey, config.presentations, {
      lookup: presentationNodes,
      keyField: ["url", "sourceUrl"],
      edgeType: "linkedPresentation",
      normalize: normalizeMaterialUrl
    });
    connectCuratedItems(projectKey, config.presentationContexts, {
      lookup: contextNodes,
      keyField: "id",
      edgeType: "linkedPresentationContext"
    });
  });
}

function cleanupGraph(graph) {
  return {
    nodes: graph.nodes.sort((a, b) => String(a.id).localeCompare(String(b.id), "fi")),
    edges: graph.edges.sort((a, b) => String(a.id).localeCompare(String(b.id), "fi"))
  };
}

function buildKnowledgeGraph(data = {}) {
  const graph = createGraph();
  const rootPersonId = addNode(graph, {
    id: "person:jari-laru",
    kind: "person",
    label: "Jari Laru",
    url: "/tietoa/"
  });

  const researchProgram = data.researchProgram || {};
  const { lineNodes } = addResearchLineAndThemeNodes(graph, researchProgram);
  const externalCanvaPresentations = buildExternalCanvaPresentationLookup(data.canva || {});

  const projectNodes = addProjectNodes(graph, data, rootPersonId);
  const publicationNodes = addPublicationNodes(graph, researchProgram, lineNodes);
  const thesisNodes = addThesisNodes(graph, researchProgram, lineNodes, rootPersonId);
  const contextNodes = addPresentationContextNodes(graph);
  const presentationNodes = addPresentationNodes(graph, data, rootPersonId);

  addCuratedProjectLinks(graph, {
    projectNodes,
    publicationNodes,
    thesisNodes,
    presentationNodes,
    contextNodes,
    rootPersonId,
    externalCanvaPresentations
  });

  const cleaned = cleanupGraph(graph);
  return {
    generatedAt: new Date().toISOString(),
    nodeCount: cleaned.nodes.length,
    edgeCount: cleaned.edges.length,
    nodeKinds: countBy(cleaned.nodes, "kind"),
    edgeTypes: countBy(cleaned.edges, "type"),
    nodes: cleaned.nodes,
    edges: cleaned.edges
  };
}

module.exports = {
  buildKnowledgeGraph
};
