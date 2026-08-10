/**
 * Global-data-loaderi Nunjucksin `semanticRelated`-avaimelle.
 *
 * v4.4 Vaihe A: data on olemassa, mutta relatedContent-filtteri ei vielä
 * lue sitä (kytkentä tulee Vaiheessa B hyväksytyllä production-kaavalla).
 *
 * Rakenne (JSON):
 *   { "/anchor-url/": [ { "url": "/other/", "sim": 0.82 }, ... ] }
 *
 * Fallback (roadmap §10): jos JSON puuttuu (esim. embedding-cache ei ole
 * tuoreena buildissa), palautetaan tyhjä objekti. Filtteri toimii siinä
 * tapauksessa kuin ennen — pelkkä metadata.
 */

const fs = require("fs");
const path = require("path");

const JSON_FILE = path.join(__dirname, "semanticRelated.json");

module.exports = function () {
  if (!fs.existsSync(JSON_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
  } catch (e) {
    console.warn(`[semanticRelated] JSON:in luku epäonnistui: ${e.message} — fallback {}`);
    return {};
  }
};
