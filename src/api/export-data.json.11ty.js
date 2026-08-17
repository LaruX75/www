// Generates /api/export-data.json — used by admin/export page for PDF export
const publicationCitation = require("../_utils/publicationCitation");

// PUB-CITE1 Phase 4d: publication citations in the export JSON are
// rendered from the canonical CSL projection via the shared
// publicationCitation module. citationStyle is a constant "APA 7"
// contract value — the shared renderer produces APA 7 output for
// every valid csl. Failure path (no csl, empty renderer output) is a
// controlled empty string rather than a hidden legacy fallback.
function sharedApaFromCsl(csl) {
  if (!csl) return "";
  const rendered = publicationCitation.buildCitation({ csl, style: "apa" });
  if (!rendered || rendered.empty || !rendered.text) return "";
  return rendered.text;
}

module.exports = class {
  data() {
    return {
      permalink: '/api/export-data.json',
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const localPubs = (data.collections.publications || []).map(item => {
      const d = item.data;
      let dateStr = '';
      if (d.date) {
        try {
          const dt = d.date instanceof Date ? d.date : new Date(d.date);
          dateStr = isNaN(dt.getTime()) ? String(d.date).slice(0, 10) : dt.toISOString().slice(0, 10);
        } catch { dateStr = String(d.date || '').slice(0, 10); }
      }
      return {
        title: d.title || '',
        date: dateStr,
        year: dateStr ? parseInt(dateStr.slice(0, 4), 10) || null : null,
        type: d.type || '',
        publication: d.publication || '',
        event: d.event || '',
        description: d.description || '',
        url: d.url || '',
      };
    });

    const rfPubs = (data.researchfi || []).map(p => ({
      anchorId: p.anchorId || "",
      title: p.title || '',
      authors: p.authors || '',
      year: p.year || null,
      journal: p.journal || '',
      doi: p.doi || '',
      doiUrl: p.doiUrl || '',
      typeCode: p.typeCode || '',
      typeFi: p.typeFi || '',
      peerReviewed: !!p.peerReviewed,
      openAccess: p.openAccess || 0,
      volume: p.volume || '',
      issue: p.issue || '',
      pages: p.pages || '',
      publisher: p.publisher || '',
      jufoLevel: p.jufoLevel || null,
    }));

    const rfContent = (data.researchfiContent || []).map((item) => ({
      anchorId: item.anchorId || "",
      title: item.title || "",
      description: item.description || "",
      citation: sharedApaFromCsl(item.csl),
      citationStyle: "APA 7",
      date: item.date || "",
      type: item.type || "",
      contentType: item.contentType || "",
      source: item.source || "",
      categories: item.categories || [],
      keywords: item.keywords || [],
      contexts: item.contexts || [],
      entities: item.entities || [],
      referenceLabel: item.referenceLabel || "",
      referenceUrl: item.referenceUrl || "",
      url: item.url || ""
    }));

    return JSON.stringify({
      localPublications: localPubs,
      researchfiPublications: rfPubs,
      researchfiContentItems: rfContent,
      cv: data.cv || {},
      generated: new Date().toISOString(),
    });
  }
};
