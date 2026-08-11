const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildCanonicalPublicationDetailsModel
} = require("../../src/_data/publicationDetails");

function manualPublicationItem({
  slug,
  title,
  date,
  doi,
  sourceUrl
}) {
  return {
    inputPath: `/tmp/${slug}.md`,
    url: `/2025/02/05/${slug}/`,
    date: new Date(date),
    data: {
      title,
      date,
      description: `${title} description`,
      publication: "Faktabaari EDU",
      publicationCollection: "Tekoalyopas opettajille",
      publicationType: "E1",
      source_url: sourceUrl,
      doi
    }
  };
}

describe("buildCanonicalPublicationDetailsModel", () => {
  test("manual duplicate redirects to Research.fi canonical detail", () => {
    const researchfi = [{
      publicationId: "0707476326",
      anchorId: "rf-a1-0707476326",
      sourceAnchorId: "rf-a1-0707476326",
      title: "Generation AI -projekti",
      authors: "Jari Laru",
      year: 2025,
      doi: "10.1234/example",
      doiUrl: "https://doi.org/10.1234/example",
      url: "https://doi.org/10.1234/example",
      typeCode: "A1",
      typeFi: "Alkuperäisartikkeli tieteellisessä aikakauslehdessä",
      peerReviewed: true,
      openAccess: 1
    }];
    const researchfiContent = [{
      publicationId: "0707476326",
      anchorId: "rf-a1-0707476326",
      sourceAnchorId: "rf-a1-0707476326",
      title: "Generation AI -projekti",
      description: "Research.fi description",
      citation: "Citation",
      citationStyle: "APA 7",
      date: "2025-01-01",
      publicationTypeCode: "A1",
      publicationTypeLabel: "Alkuperäisartikkeli tieteellisessä aikakauslehdessä",
      publicationVenue: "Journal",
      doi: "10.1234/example",
      doiUrl: "https://doi.org/10.1234/example",
      referenceUrl: "https://doi.org/10.1234/example",
      categories: ["Koulutusteknologia"],
      keywords: ["Generation AI"],
      contexts: ["research"],
      entities: ["Oulun yliopisto"],
      sourceLabel: "Research.fi",
      organization: "Oulun yliopisto"
    }];
    const collections = {
      publications: [
        manualPublicationItem({
          slug: "faktabaari-generation-ai-projekti",
          title: "Generation AI -projekti",
          date: "2025-02-05",
          doi: "10.1234/example",
          sourceUrl: "https://faktabaari.fi/edu/generation-ai-projekti/"
        })
      ]
    };

    const model = buildCanonicalPublicationDetailsModel({ researchfi, researchfiContent, collections });

    assert.equal(model.researchfiItems.length, 1);
    assert.equal(model.researchfiItems[0].pageUrl, "/julkaisut/0707476326/");
    assert.equal(model.manualRedirects.length, 1);
    assert.deepEqual(model.manualRedirects[0], {
      from: "/2025/02/05/faktabaari-generation-ai-projekti/",
      to: "/julkaisut/0707476326/",
      title: "Generation AI -projekti",
      canonicalId: "0707476326",
      canonicalTitle: "Generation AI -projekti",
      matchedBy: ["doi"]
    });
  });

  test("missing publicationId falls back to anchor-based canonical detail url", () => {
    const researchfi = [{
      publicationId: null,
      anchorId: "rf-rf-10-35542-osf-io-3qx2h",
      sourceAnchorId: "rf-rf-10-35542-osf-io-3qx2h",
      title: "Learning AI literacy in collaborative projects",
      authors: "",
      year: 2024,
      doi: "10.35542/osf.io/3qx2h",
      doiUrl: "https://doi.org/10.35542/osf.io/3qx2h",
      url: "https://doi.org/10.35542/osf.io/3qx2h",
      typeCode: null,
      typeFi: "Muu julkaisu",
      peerReviewed: true,
      openAccess: 0
    }];
    const researchfiContent = [{
      publicationId: null,
      anchorId: "rf-rf-10-35542-osf-io-3qx2h",
      sourceAnchorId: "rf-rf-10-35542-osf-io-3qx2h",
      title: "Learning AI literacy in collaborative projects",
      description: "Description",
      citation: "Citation",
      citationStyle: "APA 7",
      date: "2024-01-01",
      publicationTypeCode: "",
      publicationTypeLabel: "Muu julkaisu",
      publicationVenue: "",
      doi: "10.35542/osf.io/3qx2h",
      doiUrl: "https://doi.org/10.35542/osf.io/3qx2h",
      referenceUrl: "https://doi.org/10.35542/osf.io/3qx2h",
      categories: ["Koulutusteknologia"],
      keywords: ["tekoälylukutaito"],
      contexts: ["research"],
      entities: ["Oulun yliopisto"],
      sourceLabel: "Research.fi",
      organization: "Oulun yliopisto"
    }];

    const model = buildCanonicalPublicationDetailsModel({
      researchfi,
      researchfiContent,
      collections: { publications: [] }
    });

    assert.equal(model.researchfiItems.length, 1);
    assert.equal(model.researchfiItems[0].id, "rf-rf-10-35542-osf-io-3qx2h");
    assert.equal(model.researchfiItems[0].pageUrl, "/julkaisut/rf-rf-10-35542-osf-io-3qx2h/");
  });
});
