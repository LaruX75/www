const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  validateCollectionItem
} = require("../../src/_utils/canonicalContentValidation");
const {
  fetchDoiMetadata,
  normalizeDoiInput,
  parseCrossrefMessage
} = require("../../scripts/_lib/authoring/doiMetadata");
const {
  buildPublicationDraft,
  compareProposalToPublication,
  findExistingPublicationByDoi
} = require("../../scripts/_lib/authoring/publicationDraft");
const {
  getAuthoringInputPaths,
  renderPublicationPreview
} = require("../../scripts/_lib/authoring/eleventyPreview");

const CROSSREF_MESSAGE_FIXTURE = {
  DOI: "10.1016/j.compedu.2025.105485",
  URL: "https://doi.org/10.1016/j.compedu.2025.105485",
  type: "journal-article",
  title: ["Learning with AI in teacher education"],
  author: [
    { family: "Laru", given: "Jari" },
    { family: "Naykki", given: "Piia" }
  ],
  "published-online": {
    "date-parts": [[2025, 4, 15]]
  },
  "container-title": ["Computers & Education"],
  volume: "201",
  issue: "4",
  page: "105485",
  publisher: "Elsevier BV",
  language: "en"
};

function buildDoiProposal() {
  return parseCrossrefMessage(CROSSREF_MESSAGE_FIXTURE, normalizeDoiInput("https://doi.org/10.1016/j.compedu.2025.105485"));
}

test("AUTHORING-PIPELINE-02: raw DOI normalization reuses canonical publication DOI shape", () => {
  const normalized = normalizeDoiInput("10.1016/J.COMPEDU.2025.105485");
  assert.equal(normalized.doi, "10.1016/j.compedu.2025.105485");
  assert.equal(normalized.doiUrl, "https://doi.org/10.1016/j.compedu.2025.105485");
});

test("AUTHORING-PIPELINE-02: doi.org URL normalization resolves to canonical DOI", () => {
  const normalized = normalizeDoiInput("http://dx.doi.org/10.1016/j.compedu.2025.105485");
  assert.equal(normalized.doi, "10.1016/j.compedu.2025.105485");
});

test("AUTHORING-PIPELINE-02: malformed DOI fails fast", () => {
  assert.throws(
    () => normalizeDoiInput("not-a-doi"),
    /Virheellinen DOI/
  );
});

test("AUTHORING-PIPELINE-02: Crossref fixture parses to canonical proposal fields", () => {
  const proposal = buildDoiProposal();
  assert.equal(proposal.title, "Learning with AI in teacher education");
  assert.equal(proposal.authors, "Laru, Jari; Naykki, Piia");
  assert.equal(proposal.date, "2025-04-15");
  assert.equal(proposal.year, 2025);
  assert.equal(proposal.journal, "Computers & Education");
  assert.equal(proposal.publisher, "Elsevier BV");
  assert.equal(proposal.proposedTypeCode, "A1");
  assert.equal(proposal.evidenceUrl, "https://api.crossref.org/works/10.1016%2Fj.compedu.2025.105485");
});

test("AUTHORING-PIPELINE-02: metadata fetch accepts mocked Crossref response", async () => {
  let requestedUrl = "";
  const proposal = await fetchDoiMetadata("10.1016/j.compedu.2025.105485", {
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({ message: CROSSREF_MESSAGE_FIXTURE })
      };
    }
  });

  assert.equal(requestedUrl, "https://api.crossref.org/works/10.1016%2Fj.compedu.2025.105485");
  assert.equal(proposal.title, "Learning with AI in teacher education");
  assert.equal(proposal.proposedTypeCode, "A1");
});

test("AUTHORING-PIPELINE-02: existing canonical DOI is detected and canonical page identified", () => {
  const proposal = buildDoiProposal();
  const context = {
    candidates: {
      dedupedCandidates: [{
        doi: "10.1016/j.compedu.2025.105485",
        record: {
          pageUrl: "/julkaisut/02254916YJ/",
          title: "Learning with AI in teacher education",
          authors: "Laru, Jari; Naykki, Piia",
          year: 2025,
          journal: "Computers & Education",
          publisher: "Elsevier BV"
        }
      }]
    },
    detailsByPageUrl: new Map([[
      "/julkaisut/02254916YJ/",
      {
        pageUrl: "/julkaisut/02254916YJ/",
        title: "Learning with AI in teacher education",
        doi: "10.1016/j.compedu.2025.105485",
        authors: "Laru, Jari; Naykki, Piia",
        year: 2025,
        journal: "Computers & Education",
        publisher: "Elsevier BV"
      }
    ]])
  };

  const existing = findExistingPublicationByDoi(proposal.doi, context);
  const comparison = compareProposalToPublication(proposal, existing);

  assert.ok(existing);
  assert.equal(existing.detail.pageUrl, "/julkaisut/02254916YJ/");
  assert.equal(comparison.pageUrl, "/julkaisut/02254916YJ/");
  assert.ok(comparison.fields.every((field) => field.matches));
});

test("AUTHORING-PIPELINE-02: publication draft keeps canonical allowlisted fields and no inferred taxonomy", () => {
  const draft = buildPublicationDraft({
    proposal: buildDoiProposal(),
    manual: {
      typeCode: "A1"
    }
  });

  assert.match(draft.slug, /^rf-a1-/);
  assert.match(draft.pageUrl, /^\/julkaisut\/rf-a1-/);
  assert.equal(draft.canonicalDetail.title, "Learning with AI in teacher education");
  assert.equal(draft.canonicalDetail.typeCode, "A1");
  assert.equal(draft.canonicalDetail.doi, "10.1016/j.compedu.2025.105485");
  assert.deepEqual(draft.canonicalDetail.categories, []);
  assert.deepEqual(draft.canonicalDetail.keywords, []);
  assert.deepEqual(draft.canonicalDetail.contexts, []);
  assert.equal("crossrefType" in draft.canonicalDetail, false);
  assert.equal("evidenceUrl" in draft.canonicalDetail, false);
  assert.equal("language" in draft.canonicalDetail, false);
});

test("AUTHORING-PIPELINE-02: publication validation passes for valid DOI draft", () => {
  const draft = buildPublicationDraft({
    proposal: buildDoiProposal(),
    manual: {
      typeCode: "A1"
    }
  });

  const result = validateCollectionItem({
    collectionName: "publications",
    data: draft.validationData,
    filePath: path.join(process.cwd(), "src", "publications", `${draft.slug}.md`),
    useResolvedContexts: false,
    strictSemanticChecks: true
  });

  assert.deepEqual(result.errors, []);
});

test("AUTHORING-PIPELINE-02: publication validation fails when canonical required fields are missing", () => {
  const draft = buildPublicationDraft({
    proposal: buildDoiProposal(),
    manual: {
      typeCode: "A1"
    }
  });

  const result = validateCollectionItem({
    collectionName: "publications",
    data: {
      ...draft.validationData,
      type: "",
      doi: "bad-doi"
    },
    filePath: path.join(process.cwd(), "src", "publications", `${draft.slug}.md`),
    useResolvedContexts: false,
    strictSemanticChecks: true
  });

  assert.ok(result.errors.some((item) => item.field === "type"));
  assert.ok(result.errors.some((item) => item.field === "doi"));
});

test("AUTHORING-PIPELINE-02: publication preview reuses the production detail template", async () => {
  const draft = buildPublicationDraft({
    proposal: buildDoiProposal(),
    manual: {
      typeCode: "A1"
    }
  });

  const preview = await renderPublicationPreview({ draft, keepTemp: true });
  const html = fs.readFileSync(path.join(process.cwd(), preview.previewPath), "utf8");
  const {
    authoringInputRoot,
    inputPath,
    tempGlobalDataPath
  } = getAuthoringInputPaths(draft.slug, "publications");
  const tempGlobalData = fs.readFileSync(tempGlobalDataPath, "utf8");

  assert.ok(preview.pagesProcessed >= 1);
  assert.ok(preview.htmlBytes > 500);
  assert.equal(inputPath, path.join(process.cwd(), "src", "julkaisut", "researchfi-details.njk"));
  assert.match(tempGlobalData, /researchfiItems/);
  assert.match(html, /<h1[^>]*>Learning with AI in teacher education<\/h1>/);
  assert.match(html, /Julkaisun tiedot|Publication details/);
  assert.match(html, /10\.1016\/j\.compedu\.2025\.105485/);

  fs.rmSync(authoringInputRoot, { recursive: true, force: true });
  fs.rmSync(path.join(process.cwd(), ".tmp", "authoring-preview", draft.slug), {
    recursive: true,
    force: true
  });
});
