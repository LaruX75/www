/**
 * Paattelee sivun Schema.org-tyyppikoodit yhdesta datalahteesta.
 *
 * Aiemmin logiikka asui eleventy.filters.js:n riveilla 1208-1251
 * (`resolveSchemaType`-filtteri). Extraktoitu itsenaiseksi moduuliksi
 * jotta characterization-testit voivat lukita nykyisen kayttaytymisen
 * ennen resolver-refaktoria. Toteutus 1:1 sama, ei semanttisia muutoksia.
 *
 * @param {object} data - schemaType, type, tags, mediaType, contentType
 * @returns {{resolvedSchemaType: (string|null), pageBlockType: string, specialPageType: (string|null)}}
 */
function resolveSchemaType(data) {
  const d = data || {};
  const type = d.type;
  const tags = Array.isArray(d.tags) ? d.tags : [];

  let resolvedSchemaType = d.schemaType || null;

  if (!resolvedSchemaType) {
    if (type === "esitys") resolvedSchemaType = "PresentationDigitalDocument";
    else if (type === "tieteellinen") resolvedSchemaType = "ScholarlyArticle";
    else if (type === "mielipide") resolvedSchemaType = "OpinionNewsArticle";
    else if (type === "kolumni") resolvedSchemaType = "NewsArticle";
    else if (type === "lausunto" || type === "puhe" || type === "artikkeli") resolvedSchemaType = "Article";
    else if (type === "blogikirjoitus") resolvedSchemaType = "BlogPosting";
    else if (d.contentType === "scientificPublication") resolvedSchemaType = "ScholarlyArticle";
    else if (d.mediaType || d.contentType) resolvedSchemaType = d.mediaType ? "NewsArticle" : "Article";
    else if (tags.includes("blog")) resolvedSchemaType = "BlogPosting";
    else if (tags.includes("politics") || tags.includes("publications")) resolvedSchemaType = "Article";
  }

  const articleTypes = new Set([
    "Article", "BlogPosting", "NewsArticle", "OpinionNewsArticle", "ScholarlyArticle"
  ]);
  const specialTypes = new Set([
    "AboutPage", "ProfilePage", "ContactPage", "CollectionPage", "FAQPage"
  ]);

  let pageBlockType = "webpage";
  let specialPageType = null;

  if (resolvedSchemaType === "PresentationDigitalDocument") {
    pageBlockType = "presentation";
  } else if (articleTypes.has(resolvedSchemaType)) {
    pageBlockType = "article";
  } else if (resolvedSchemaType === "LocalBusiness" || resolvedSchemaType === "Organization") {
    pageBlockType = "business";
  } else if (resolvedSchemaType === "Thesis") {
    pageBlockType = "thesis";
  } else if (specialTypes.has(resolvedSchemaType)) {
    pageBlockType = "specialpage";
    specialPageType = resolvedSchemaType;
  }

  return { resolvedSchemaType, pageBlockType, specialPageType };
}

module.exports = resolveSchemaType;
