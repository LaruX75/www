// Generates /api/export-data.json — used by admin/export page for PDF export
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

    return JSON.stringify({
      localPublications: localPubs,
      researchfiPublications: rfPubs,
      generated: new Date().toISOString(),
    });
  }
};
