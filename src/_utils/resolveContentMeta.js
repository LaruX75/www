/**
 * Yhteinen resolveri sisaltotyypin ja siihen liittyvan semanttisen tiedon
 * paattelylle. Keskittaa aiemmin kolmessa paikassa (contentTypeLabel,
 * resolveSchemaType, getTaxonomyType) olleen paallekkaisen logiikan yhteen
 * pisteeseen.
 *
 * Palauttaa vain kanonisen semanttisen kerroksen:
 *
 *   {
 *     contentType,         // canonical, koneellinen (contentSchema.js -sanasto)
 *     contentTypeLabel,    // FI/EN nayttoteksti
 *     section,             // laaja alue (media, writings, politics, blog, ...)
 *     schemaType,          // Schema.org @type
 *     pageBlockType,       // Schema.org renderointihaara (_ldschema.njk kayttaa)
 *     specialPageType      // Schema.org specialpage-tyyppi tai null
 *   }
 *
 * Tarkeaa:
 * - Toteutus lukitsee TASMALLEEN nykyisen contentTypeLabel- ja
 *   resolveSchemaType-kayttaytymisen. Ristiriidat (kts. tests/unit/
 *   content-type.test.js [ristiriita]-tagit) on tietoisesti sailytetty jotta
 *   tama refaktori ei muuta yhtaan renderoityvaa sivua.
 * - Ei duplikoi Data Cascaden computed-kenttia (writingRoles, speechContext,
 *   forum, opinionRoles, contexts, tags). Resolver lukee vain jo asetettuja
 *   arvoja datasta.
 * - Ei riippuvuutta Nunjucksiin tai HTML-renderointiin. Puhdas funktio,
 *   serialisoitavissa myohemmin JSONiin.
 * - contentType kayttaa contentSchema.js:n canonical `contentTypes`-vocabulariaa.
 *
 * @param {object} data - sivun data (frontmatter + eleventyComputed lopputulos)
 * @param {string} [inputPath] - Eleventy-inputPath (fallback-lahteena)
 * @param {("fi"|"en")} [lang="fi"] - kielen valinta labelille
 * @returns {{contentType: string, contentTypeLabel: string, section: string, schemaType: (string|null), pageBlockType: string, specialPageType: (string|null)}}
 */

const contentTypeLabel = require("./contentTypeLabel");
const resolveSchemaType = require("./resolveSchemaType");

// Legacy `type` -> canonical `contentType` (contentSchema.js:n vocabulary)
const LEGACY_TYPE_TO_CONTENT_TYPE = {
  artikkeli: "article",
  blogikirjoitus: "blogPost",
  esitys: "presentation",
  kolumni: "column",
  lausunto: "statement",
  mielipide: "opinion",
  puhe: "speech",
  tieteellinen: "scientificPublication"
};

// mediaType -> canonical contentType
const MEDIA_TYPE_TO_CONTENT_TYPE = {
  video: "video",
  podcast: "mediaItem",
  radio: "mediaItem",
  article: "mediaItem",
  pressRelease: "mediaItem",
  tv: "mediaItem",
  assignment: "expertAssignment"
};

// canonical contentType -> laaja section
// section-arvot: media, writings, politics, blog, presentations, publications, other
const CONTENT_TYPE_TO_SECTION = {
  article: "writings",
  blogPost: "blog",
  column: "writings",
  expertAssignment: "media",
  initiative: "politics",
  mediaItem: "media",
  opinion: "writings",
  presentation: "presentations",
  scientificPublication: "publications",
  speech: "writings",
  statement: "writings",
  thesis: "publications",
  video: "media"
};

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function resolveContentType(data, inputPath) {
  const d = data || {};
  const p = String(inputPath || "");
  const tags = new Set(toArray(d.tags));

  // 1. Eksplisiittinen canonical contentType (jos jo asetettu frontmatterissa)
  if (d.contentType && typeof d.contentType === "string") {
    return d.contentType;
  }

  // 2. Legacy `type` (kontrolloitu sanasto)
  if (d.type && LEGACY_TYPE_TO_CONTENT_TYPE[d.type]) {
    return LEGACY_TYPE_TO_CONTENT_TYPE[d.type];
  }

  // 3. mediaType (Media-kansion sisallot)
  if (d.mediaType && MEDIA_TYPE_TO_CONTENT_TYPE[d.mediaType]) {
    return MEDIA_TYPE_TO_CONTENT_TYPE[d.mediaType];
  }

  // 4. researchfi-source => scientificPublication
  if (d.source === "researchfi") {
    return "scientificPublication";
  }

  // 5. inputPath-fallback
  if (p.includes("/media/")) return "mediaItem";
  if (p.includes("/presentations/")) return "presentation";
  if (p.includes("/blog/")) return "blogPost";
  if (p.includes("/politics/")) return "initiative";

  // 6. tags-fallback (yhdenmukainen nykyisen contentTypeLabel/resolveSchemaType-kanssa)
  if (tags.has("blog")) return "blogPost";
  if (tags.has("politics")) return "initiative";
  if (tags.has("publications")) return "article";
  if (tags.has("presentations")) return "presentation";

  // 7. Default
  return "article";
}

function resolveSection(contentType) {
  return CONTENT_TYPE_TO_SECTION[contentType] || "other";
}

function resolveContentMeta(data, inputPath, lang = "fi") {
  const d = data || {};
  const tags = Array.isArray(d.tags) ? d.tags : toArray(d.tags);

  // contentTypeLabel: tasmalleen sama kuin nykyinen contentTypeLabel-funktio.
  // Ristiriidat sailyvat (kts. tests/unit/content-type.test.js).
  const label = contentTypeLabel(d, tags, lang);

  // schemaType: tasmalleen sama kuin nykyinen resolveSchemaType-funktio.
  const schema = resolveSchemaType(d);

  // Canonical contentType: uusi kanoninen tunniste (contentSchema.js -sanasto)
  const contentType = resolveContentType(d, inputPath);

  return {
    contentType,
    contentTypeLabel: label,
    section: resolveSection(contentType),
    schemaType: schema.resolvedSchemaType,
    pageBlockType: schema.pageBlockType,
    specialPageType: schema.specialPageType
  };
}

module.exports = resolveContentMeta;
module.exports.LEGACY_TYPE_TO_CONTENT_TYPE = LEGACY_TYPE_TO_CONTENT_TYPE;
module.exports.MEDIA_TYPE_TO_CONTENT_TYPE = MEDIA_TYPE_TO_CONTENT_TYPE;
module.exports.CONTENT_TYPE_TO_SECTION = CONTENT_TYPE_TO_SECTION;
