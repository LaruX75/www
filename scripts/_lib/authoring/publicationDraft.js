const loadResearchfi = require("../../../src/_data/researchfi");
const loadResearchfiContent = require("../../../src/_data/researchfiContent");
const { readManualPublicationItems } = require("../../../src/_data/publicationDetailPages");
const {
  buildCanonicalPublicationCandidates,
  canonicalPublicationDetailUrl,
  normalizeDoi: normalizePublicationDoi,
  PUBLICATION_TYPE_LABELS
} = require("../../../src/_data/publicationsPage");
const {
  buildCanonicalPublicationDetailsModel,
  buildResearchfiDetail
} = require("../../../src/_data/publicationDetails");
const { buildAnchorId } = require("../../../src/_data/researchfi");

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeDateToYear(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-/);
  return match ? Number(match[1]) : null;
}

async function loadCanonicalPublicationContext() {
  const [researchfi, researchfiContent] = await Promise.all([
    loadResearchfi(),
    loadResearchfiContent()
  ]);
  const collections = {
    publications: readManualPublicationItems()
  };
  const candidates = buildCanonicalPublicationCandidates({
    researchfi,
    researchfiContent,
    collections
  });
  const detailModel = buildCanonicalPublicationDetailsModel({
    researchfi,
    researchfiContent,
    collections
  });
  const detailsByPageUrl = new Map(
    detailModel.researchfiItems.map((item) => [String(item.pageUrl || ""), item])
  );

  return {
    researchfi,
    researchfiContent,
    collections,
    candidates,
    detailModel,
    detailsByPageUrl
  };
}

function findExistingPublicationByDoi(doi, context) {
  const normalized = normalizePublicationDoi(doi);
  if (!normalized) return null;

  const match = context?.candidates?.dedupedCandidates?.find((candidate) => {
    const candidateDoi = normalizePublicationDoi(
      candidate?.doi || candidate?.record?.doi || candidate?.record?.doiUrl
    );
    return candidateDoi === normalized;
  }) || null;

  if (!match) return null;

  return {
    doi: normalized,
    candidate: match,
    record: match.record || null,
    detail: context.detailsByPageUrl.get(String(match.record?.pageUrl || "")) || null
  };
}

function labelForTypeCode(typeCode) {
  return PUBLICATION_TYPE_LABELS[String(typeCode || "").trim().toUpperCase()] || "";
}

function buildPublicationDraft({
  proposal,
  manual = {}
}) {
  const typeCode = pickString(manual.typeCode || proposal.proposedTypeCode || "").toUpperCase();
  const typeLabel = labelForTypeCode(typeCode);
  const anchorId = buildAnchorId(
    {
      publicationId: null,
      publicationName: proposal.title,
      title: proposal.title
    },
    typeCode,
    proposal.doi
  );
  const publicationId = null;
  const pageUrl = canonicalPublicationDetailUrl(publicationId, anchorId);
  const date = pickString(proposal.date) || (proposal.year ? `${proposal.year}-01-01` : "");

  const publicationRecord = {
    publicationId,
    anchorId,
    sourceAnchorId: anchorId,
    title: proposal.title,
    authors: pickString(proposal.authors),
    year: proposal.year || normalizeDateToYear(date),
    journal: pickString(proposal.journal),
    doi: pickString(proposal.doi),
    doiUrl: pickString(proposal.doiUrl),
    url: pickString(proposal.sourceUrl) || pickString(proposal.doiUrl),
    typeCode,
    typeFi: typeLabel || "Muu julkaisu",
    peerReviewed: false,
    openAccess: 0,
    volume: pickString(proposal.volume),
    issue: pickString(proposal.issue),
    pages: pickString(proposal.pages || proposal.articleNumber),
    articleNumber: pickString(proposal.articleNumber),
    publisher: pickString(proposal.publisher),
    isbn: pickString(proposal.isbn)
  };

  const contentRecord = {
    publicationId,
    anchorId,
    sourceAnchorId: anchorId,
    title: proposal.title,
    description: "",
    date,
    publicationTypeCode: typeCode,
    publicationTypeLabel: typeLabel || "Muu julkaisu",
    publicationVenue: pickString(proposal.journal),
    doi: pickString(proposal.doi),
    doiUrl: pickString(proposal.doiUrl),
    referenceUrl: pickString(proposal.sourceUrl) || pickString(proposal.doiUrl),
    categories: [],
    keywords: [],
    contexts: [],
    entities: [],
    sourceLabel: "Crossref DOI",
    organization: ""
  };

  const canonicalDetail = buildResearchfiDetail(publicationRecord, contentRecord, {
    semanticscholar: {}
  });
  if (!canonicalDetail) {
    throw new Error("Julkaisudraftia ei voitu muodostaa DOI-metadatasta");
  }

  const detail = {
    ...canonicalDetail,
    pageUrl,
    date,
    year: publicationRecord.year || normalizeDateToYear(date),
    source: "crossref",
    sourceKey: "crossref",
    sourceLabel: "Crossref DOI",
    type: typeLabel || canonicalDetail.type,
    typeCode,
    externalUrl: pickString(proposal.sourceUrl) || pickString(proposal.doiUrl) || canonicalDetail.externalUrl,
    journal: pickString(proposal.journal) || canonicalDetail.journal,
    publisher: pickString(proposal.publisher) || canonicalDetail.publisher,
    authors: pickString(proposal.authors) || canonicalDetail.authors,
    description: ""
  };

  const validationData = {
    id: detail.id,
    anchorId: detail.anchorId,
    publicationId: detail.publicationId,
    title: detail.title,
    date: detail.date,
    year: detail.year,
    type: "tieteellinen",
    typeCode: detail.typeCode,
    doi: detail.doi,
    pageUrl: detail.pageUrl,
    sourceUrl: detail.externalUrl || detail.doiUrl || "",
    authors: detail.authors || "",
    journal: detail.journal || "",
    publisher: detail.publisher || "",
    categories: [],
    keywords: [],
    contexts: []
  };

  return {
    slug: anchorId,
    pageUrl,
    canonicalDetail: detail,
    validationData,
    publicationRecord,
    contentRecord
  };
}

function compareProposalToPublication(proposal, existing = null) {
  if (!existing) return null;

  const current = existing.detail || existing.record || {};
  const existingPageUrl = current.pageUrl || existing.record?.pageUrl || "";

  return {
    pageUrl: existingPageUrl,
    fields: [
      {
        field: "title",
        proposed: pickString(proposal.title),
        canonical: pickString(current.title),
        matches: pickString(proposal.title) === pickString(current.title)
      },
      {
        field: "doi",
        proposed: normalizePublicationDoi(proposal.doi),
        canonical: normalizePublicationDoi(current.doi || current.doiUrl),
        matches: normalizePublicationDoi(proposal.doi) === normalizePublicationDoi(current.doi || current.doiUrl)
      },
      {
        field: "year",
        proposed: String(proposal.year || ""),
        canonical: String(current.year || ""),
        matches: String(proposal.year || "") === String(current.year || "")
      },
      {
        field: "authors",
        proposed: pickString(proposal.authors),
        canonical: pickString(current.authors),
        matches: pickString(proposal.authors) === pickString(current.authors)
      },
      {
        field: "journal",
        proposed: pickString(proposal.journal),
        canonical: pickString(current.journal),
        matches: pickString(proposal.journal) === pickString(current.journal)
      },
      {
        field: "publisher",
        proposed: pickString(proposal.publisher),
        canonical: pickString(current.publisher),
        matches: pickString(proposal.publisher) === pickString(current.publisher)
      }
    ]
  };
}

module.exports = {
  buildPublicationDraft,
  compareProposalToPublication,
  findExistingPublicationByDoi,
  loadCanonicalPublicationContext
};
