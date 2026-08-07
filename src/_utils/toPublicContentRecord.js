/**
 * Serialisoi Eleventy-itemin julkiseksi JSON-tietueeksi.
 *
 * Yksi yhteinen serialisointikerros kaikille /data/*.json -virroille
 * (content, publications, presentations, media, council-speeches, theses).
 *
 * Periaatteet:
 * - Canonical `contentType` tulee `resolveContentMeta`-resolverista.
 *   Ei duplikoi legacy `type` -> canonical -mappingia.
 * - Vain public-kentat viedaan JSON:iin. Sisaiset kentat (inputPath,
 *   page, layout, permalink, templateEngineOverride, draft yms.) EI
 *   koskaan pade JSON:iin, vaikka ne olisivat frontmatterissa.
 * - Tyhjat kentat (null, undefined, tyhja string, tyhja array) poistetaan.
 * - Paivamaarat normalisoidaan ISO 8601:een.
 * - Array-kentat suodattavat pois falsy-arvot.
 * - JSON on serialisoitavissa: kaikki kentat ovat string, number, boolean,
 *   array tai null.
 *
 * @param {object} item - Eleventy collection item (data, url, date, ...)
 * @returns {object|null} Public content record tai null jos itemilla
 *   ei ole vahintaan urlia ja titlea.
 */

const resolveContentMeta = require("./resolveContentMeta");

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function normalizeArray(value) {
  const arr = toArray(value);
  if (arr.length === 0) return null;
  return arr.map((v) => String(v).trim()).filter(Boolean);
}

function isoDate(value) {
  if (!value) return null;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function extractYear(value) {
  const iso = isoDate(value);
  if (!iso) return null;
  const year = parseInt(iso.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function pickString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function omitEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function toPublicContentRecord(item) {
  const data = item?.data || {};
  const url = item?.url || null;
  const title = pickString(data.title);

  // Minimivaatimukset: url + title. Muuten skippaa.
  if (!url || !title) return null;

  const inputPath = item?.inputPath || "";
  const lang = data.lang === "en" ? "en" : "fi";
  const meta = resolveContentMeta(data, inputPath, lang);

  const dateSource = item?.date || data.date;
  const dateIso = isoDate(dateSource);
  const modifiedIso = isoDate(data.modified);

  return omitEmpty({
    // Perustunnisteet
    id: url,
    url,
    title,
    description: pickString(data.description),
    date: dateIso,
    modified: modifiedIso,
    year: extractYear(dateSource),
    lang,

    // Semanttinen sisaltotyyppi (resolverista)
    contentType: meta.contentType,
    contentTypeLabel: meta.contentTypeLabel,
    section: meta.section,

    // Yleiset taxonomy-kentat
    categories: normalizeArray(data.categories),
    keywords: normalizeArray(data.keywords),
    contexts: normalizeArray(data.contexts),

    // Ehdolliset (media)
    mediaType: pickString(data.mediaType),
    mediaRole: pickString(data.mediaRole),
    mediaOutlet: pickString(data.mediaOutlet),

    // Ehdolliset (puheet ja politiikka)
    speechContext: pickString(data.speechContext),
    event: pickString(data.event),
    forum: normalizeArray(data.forum),
    politicalProfiles: normalizeArray(data.politicalProfiles),
    writingRoles: normalizeArray(data.writingRoles),
    opinionRoles: normalizeArray(data.opinionRoles),

    // Ehdolliset (esitys / julkaisu)
    source: pickString(data.source),
    sourceUrl: pickString(data.sourceUrl),
    thumbnail: pickString(data.thumbnail),
    doi: pickString(data.doi),
    authors: normalizeArray(data.authors),
    publicationType: pickString(data.publicationType)
  });
}

module.exports = toPublicContentRecord;
module.exports.isoDate = isoDate;
module.exports.extractYear = extractYear;
module.exports.normalizeArray = normalizeArray;
module.exports.omitEmpty = omitEmpty;
