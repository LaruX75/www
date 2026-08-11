const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function expectIncludes(source, needle) {
  return source.includes(needle);
}

function countMatches(source, regex) {
  return [...source.matchAll(regex)].length;
}

function main() {
  const writings = readJson("_site/data/writings-page.json");
  const fiHtml = readText("_site/kirjoitukset/index.html");
  const enHtml = readText("_site/en/writings/index.html");

  const fiChecks = {
    fileExists: true,
    compatibilityCopy: expectIncludes(fiHtml, "70 blogikirjoitusta, 47 mielipidekirjoitusta ja 9 kolumnia"),
    opinionRows: countMatches(fiHtml, /<tbody id="mielipiteet-tbody">[\s\S]*?<\/tbody>/g) === 1,
    columnRows: countMatches(fiHtml, /<tbody id="kolumnit-tbody">[\s\S]*?<\/tbody>/g) === 1,
    blogRows: countMatches(fiHtml, /<tbody id="blog-tbody">[\s\S]*?<\/tbody>/g) === 1
  };

  const enChecks = {
    fileExists: true,
    materialsSection: expectIncludes(enHtml, '<section id="materials"'),
    materialsSummaryCopy: expectIncludes(enHtml, "This total combines Canva presentations, SlideShare presentations, and AOE/Finna learning materials."),
    statementsTbody: expectIncludes(enHtml, 'id="statements-tbody"'),
    publicSpeechesTbody: expectIncludes(enHtml, 'id="public-speeches-tbody"'),
    publicationsTbody: expectIncludes(enHtml, 'id="pub-tbody"'),
    opinionsBadge: expectIncludes(enHtml, '>47<'),
    columnsBadge: expectIncludes(enHtml, '>9<'),
    initiativesBadge: expectIncludes(enHtml, '>10<'),
    speechesBadge: expectIncludes(enHtml, '>92<'),
    statementsBadge: expectIncludes(enHtml, '>6<'),
    publicSpeechesBadge: expectIncludes(enHtml, '>13<'),
    blogBadge: expectIncludes(enHtml, '>70<'),
    publicationsBadge: expectIncludes(enHtml, '>56<')
  };

  const ok = writings.count === 290
    && fiChecks.compatibilityCopy
    && fiChecks.opinionRows
    && fiChecks.columnRows
    && fiChecks.blogRows
    && enChecks.materialsSection
    && enChecks.materialsSummaryCopy
    && enChecks.statementsTbody
    && enChecks.publicSpeechesTbody
    && enChecks.publicationsTbody
    && enChecks.opinionsBadge
    && enChecks.columnsBadge
    && enChecks.initiativesBadge
    && enChecks.speechesBadge
    && enChecks.statementsBadge
    && enChecks.publicSpeechesBadge
    && enChecks.blogBadge
    && enChecks.publicationsBadge;

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    ok,
    canonicalTotal: writings.count,
    fiChecks,
    enChecks
  }, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
}

main();
