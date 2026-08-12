const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const loadResearchfi = require("./researchfi");
const loadResearchfiContent = require("./researchfiContent");
const loadSemanticscholar = require("./semanticscholar");
const { buildCanonicalPublicationDetailsModel } = require("./publicationDetails");

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

module.exports = async function publicationDetailPages() {
  const [researchfi, researchfiContent, semanticscholar] = await Promise.all([
    loadResearchfi(),
    loadResearchfiContent(),
    loadSemanticscholar()
  ]);

  return buildCanonicalPublicationDetailsModel({
    researchfi,
    researchfiContent,
    semanticscholar,
    collections: {
      publications: readManualPublicationItems()
    }
  });
};
