const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const loadResearchfi = require("../src/_data/researchfi");
const loadResearchfiContent = require("../src/_data/researchfiContent");
const { buildCanonicalPublicationsPageItems } = require("../src/_data/publicationsPage");
const { buildCanonicalPublicationDetailsModel } = require("../src/_data/publicationDetails");

function readManualPublicationItems() {
  const dir = path.join(process.cwd(), "src", "publications");
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const absolute = path.join(dir, file);
      const parsed = matter.read(absolute);
      const data = parsed.data || {};
      const date = data.date ? new Date(data.date) : new Date();
      const slug = path.basename(file, path.extname(file));
      return {
        inputPath: absolute,
        url: `/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${slug}/`,
        date,
        data
      };
    });
}

function normalizeComparable(value) {
  return value == null ? "" : String(value);
}

async function main() {
  const [researchfi, researchfiContent] = await Promise.all([
    loadResearchfi(),
    loadResearchfiContent()
  ]);
  const collections = {
    publications: readManualPublicationItems()
  };

  const pageItems = buildCanonicalPublicationsPageItems({
    researchfi,
    researchfiContent,
    manualEvaluations: []
  }, {}).filter((item) => item.sourceKey === "researchfi");

  const detailModel = buildCanonicalPublicationDetailsModel({
    researchfi,
    researchfiContent,
    collections
  });
  const detailItems = detailModel.researchfiItems;
  const detailUrls = detailItems.map((item) => item.pageUrl).filter(Boolean);
  const uniqueDetailUrls = new Set(detailUrls);
  const pageByAnchor = new Map(pageItems.map((item) => [item.anchorId, item]));

  const mismatches = detailItems
    .map((detail) => ({
      detail,
      page: pageByAnchor.get(detail.anchorId) || null
    }))
    .filter(({ detail, page }) => {
      if (!page) return true;
      return normalizeComparable(detail.title) !== normalizeComparable(page.title)
        || normalizeComparable(detail.year) !== normalizeComparable(page.year)
        || normalizeComparable(detail.authors) !== normalizeComparable(page.authors)
        || normalizeComparable(detail.typeCode) !== normalizeComparable(page.typeCode);
    })
    .map(({ detail, page }) => ({
      detailId: detail.id,
      anchorId: detail.anchorId,
      title: detail.title,
      detailYear: detail.year,
      pageYear: page?.year ?? null,
      detailAuthors: detail.authors ?? null,
      pageAuthors: page?.authors ?? null,
      detailTypeCode: detail.typeCode ?? null,
      pageTypeCode: page?.typeCode ?? null
    }));

  const missingIdentifiers = detailItems
    .filter((item) => !item.id || !item.pageUrl)
    .map((item) => ({
      id: item.id || null,
      pageUrl: item.pageUrl || null,
      title: item.title || null
    }));

  const result = {
    ok: pageItems.length === detailItems.length
      && detailUrls.length === uniqueDetailUrls.size
      && mismatches.length === 0
      && missingIdentifiers.length === 0,
    checks: {
      canonicalResearchfiCount: pageItems.length,
      detailCount: detailItems.length,
      uniqueDetailUrlCount: uniqueDetailUrls.size,
      manualRedirectCount: detailModel.manualRedirects.length,
      mismatches: mismatches.length,
      missingIdentifiers: missingIdentifiers.length
    },
    sample: detailItems.slice(0, 5).map((item) => ({
      id: item.id,
      pageUrl: item.pageUrl,
      title: item.title
    })),
    mismatches,
    missingIdentifiers,
    manualRedirects: detailModel.manualRedirects
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
