const fs = require("fs");
const path = require("path");

const loadThesisDetails = require("../src/_data/thesisDetails");

function walkDetailPages(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map((entry) => {
      const filePath = path.join(rootDir, entry.name, "index.html");
      return fs.existsSync(filePath) ? {
        id: entry.name,
        filePath
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function main() {
  const model = await loadThesisDetails();
  const detailPages = walkDetailPages(path.join(process.cwd(), "_site", "opinnaytteet"));

  const expectedIds = new Set(model.items.map((item) => item.id));
  const actualIds = new Set(detailPages.map((item) => item.id));

  const missingHtml = model.items
    .filter((item) => !actualIds.has(item.id))
    .map((item) => ({ id: item.id, pageUrl: item.pageUrl, title: item.title }));

  const unexpectedHtml = detailPages
    .filter((item) => !expectedIds.has(item.id))
    .map((item) => ({ id: item.id, filePath: item.filePath }));

  console.log(JSON.stringify({
    canonicalCount: model.count,
    detailHtmlCount: detailPages.length,
    parityOk: model.count === detailPages.length && missingHtml.length === 0 && unexpectedHtml.length === 0,
    missingHtml,
    unexpectedHtml
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
