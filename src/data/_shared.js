/**
 * Jaettu apukirjasto /data/*.json.11ty.js -tiedostoille.
 *
 * Kaikki JSON-endpointit kayttavat samaa serialize/sort/wrap-logiikkaa.
 */

const toPublicContentRecord = require("../_utils/toPublicContentRecord");

const JSON_SCHEMA_VERSION = 1;

/**
 * Muunna Eleventy-collection publiciksi JSON-tietuejoukoksi.
 *
 * - Kayttaa `toPublicContentRecord`:ia.
 * - Poistaa itemit joilta puuttuu url tai title (serializer palauttaa null).
 * - Deduplikoi URL:in perusteella (jos sama item on kahdessa collectionissa).
 * - Sorttaa uusimmasta vanhimpaan `date`-kentan perusteella (ISO 8601 -string).
 *
 * @param {Array} items - Eleventy-collection items
 * @returns {Array} public records
 */
function serializeItems(items) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    const record = toPublicContentRecord(item);
    if (!record) continue;
    if (seen.has(record.url)) continue;
    seen.add(record.url);
    out.push(record);
  }
  return out.sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA === dateB) return String(a.url).localeCompare(String(b.url));
    return dateB.localeCompare(dateA);
  });
}

/**
 * Rakenna JSON-outputin ulkokuori.
 *
 * @param {Array} records - jo serialisoidut public records
 * @returns {string} JSON-string (2-space indent)
 */
function jsonWrap(records) {
  return JSON.stringify({
    version: JSON_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    count: records.length,
    items: records
  }, null, 2);
}

module.exports = {
  JSON_SCHEMA_VERSION,
  serializeItems,
  jsonWrap
};
