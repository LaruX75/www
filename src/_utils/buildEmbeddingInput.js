/**
 * buildEmbeddingInput(item, richSources, options) — kanoninen rich embedding input.
 *
 * v4.4 Rich Embedding Input Layer (2026-08-09).
 *
 * ROOLI: yksi vastuu — yhdistä sisältötyyppikohtainen rich source
 * (transcript / body / abstract) title + description -metadatan päälle
 * ja tuota embedding-mallille sopiva teksti.
 *
 * EI ContentEngine. EI normalized content schema. Vain rakennus tekstistä.
 *
 * PRIORITEETTI (auditin §7 mukaisesti):
 *   varsinainen body/transcript/abstract > description > title > täydentävä metadata
 *
 * KÄYTTÖ:
 *   const { buildEmbeddingInput } = require("./buildEmbeddingInput");
 *   const input = buildEmbeddingInput(item, richSources);
 *   // → { text, sources, chars, truncated, contentType, version }
 *
 * @param {object} item — normalized content record (/data/content.json tai /data/theses.json)
 * @param {object} [richSources] — { markdownBodyByUrl: Map, transcriptByUrl: Map }
 * @param {object} [options] — { maxChars: 6000, strategy: "head" }
 *
 * VERSIO: input-strategian versiointi jotta cache voidaan invalidoida
 *   yhdellä muutoksella (ei rebuildaa turhaan jos vain koodi muuttuu
 *   tunnistettavasti — ks. INPUT_STRATEGY_VERSION).
 */

const crypto = require("crypto");
const { truncate } = require("./embeddingTruncation");

// Nosta versiota kun buildEmbeddingInput:in logiikka muuttuu tavalla joka
// muuttaa jo lasketun embedding:in inputia (esim. lisätään uusia sourceja,
// muutetaan järjestystä, otetaan mukaan metadatasignaali).
// Sama arvo tallennetaan cachen inputHash-fingerprintiin.
const INPUT_STRATEGY_VERSION = "v1-2026-08-09";

const DEFAULT_MAX_CHARS = 6000;
const DEFAULT_TRUNCATION = "head";

// -----------------------------------------------------------------------------
// Rich source resolvers per contentType
// -----------------------------------------------------------------------------

/**
 * Palauttaa lisä-sisällön joka lisätään title + description:in perään.
 * Palauttaa null jos ei ole rich sourcea.
 *
 * richSources: {
 *   markdownBodyByUrl: Map<url, string>,  // src/blog, src/publications, src/politics, src/media
 *   transcriptByUrl: Map<url, { transcript, description? }>  // slideshare-content.json
 * }
 */
function getRichSource(item, richSources = {}) {
  const url = item?.url || "";
  const contentType = item?.contentType || "";
  const markdownBodyByUrl = richSources.markdownBodyByUrl || new Map();
  const transcriptByUrl = richSources.transcriptByUrl || new Map();

  // SlideShare-presentation → transcript ensisijainen
  if (contentType === "presentation") {
    const ss = transcriptByUrl.get(url);
    if (ss && ss.transcript && ss.transcript.length > 200) {
      return { source: "slideshareTranscript", text: ss.transcript };
    }
  }

  // blogPost / opinion / column / statement / speech / initiative / article / mediaItem
  // → markdown-body jos saatavilla
  const bodyContentTypes = new Set([
    "blogPost", "opinion", "column", "statement", "speech", "initiative",
    "article", "mediaItem"
  ]);
  if (bodyContentTypes.has(contentType)) {
    const body = markdownBodyByUrl.get(url);
    if (body && body.length > 200) {
      return { source: "markdownBody", text: body };
    }
  }

  // Thesis: description on jo abstract (theses.js:n toThesisRecord vie sen sinne).
  // Ei erillistä lisä-sourcea — description itsessään on rich.

  // scientificPublication: description on Research.fi:n abstract. Ei lisä-sourcea.
  // (Voisi laajentaa myöhemmin publication-abstract-enrichments-v1.json:sta.)

  // video / expertAssignment / Canva-presentation: ei rich sourcea.
  return null;
}

// -----------------------------------------------------------------------------
// Markdown-siivoaminen (kevyt, ei täydellinen — riittää embedding-inputille)
// -----------------------------------------------------------------------------

function stripMarkdown(md) {
  return String(md || "")
    .replace(/```[\s\S]*?```/g, " ")               // fenced code blocks
    .replace(/`[^`]+`/g, " ")                       // inline code
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")          // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")        // links → link text
    .replace(/^[#>*-]\s*/gm, "")                    // heading/list/quote markers
    .replace(/[*_~]/g, "")                          // emphasis/strikethrough
    .replace(/\n{3,}/g, "\n\n")                     // collapse blank lines
    .replace(/[ \t]+/g, " ")                        // collapse spaces
    .trim();
}

// -----------------------------------------------------------------------------
// Yhdistä osat
// -----------------------------------------------------------------------------

function pickString(v) {
  const s = String(v == null ? "" : v).trim();
  return s || null;
}

function buildEmbeddingInput(item, richSources, options = {}) {
  const contentType = item?.contentType || "unknown";
  const title = pickString(item?.title);
  const description = pickString(item?.description);

  const parts = [];
  const sources = [];

  if (title) { parts.push(title); sources.push("title"); }
  if (description) { parts.push(description); sources.push("description"); }

  const rich = getRichSource(item, richSources);
  if (rich) {
    const cleaned = rich.source === "markdownBody" ? stripMarkdown(rich.text) : String(rich.text || "").trim();
    if (cleaned.length > 100) {
      parts.push(cleaned);
      sources.push(rich.source);
    }
  }

  const joined = parts.join("\n\n");
  const maxChars = Number(options.maxChars) || DEFAULT_MAX_CHARS;
  const strategy = options.strategy || DEFAULT_TRUNCATION;
  const trunc = truncate(joined, { maxChars, strategy });

  return {
    text: trunc.text,
    sources,
    chars: trunc.text.length,
    truncated: trunc.truncated,
    originalChars: trunc.originalChars,
    contentType,
    truncationStrategy: strategy,
    version: INPUT_STRATEGY_VERSION
  };
}

// -----------------------------------------------------------------------------
// Fingerprint invalidation-logiikkaa varten
// -----------------------------------------------------------------------------

/**
 * SHA1 embedding-inputille + versiolle. Käytetään cachen inputHash-kenttänä.
 * Jos input-teksti tai INPUT_STRATEGY_VERSION muuttuu → hash muuttuu →
 * embedding lasketaan uudelleen.
 *
 * HUOM: model-avain tallennetaan cachen top-level:iin erikseen. Fingerprint
 * kattaa vain input + strategy version — malli-vaihto invalidoi koko cachen.
 */
function fingerprint(embeddingInput) {
  const h = crypto.createHash("sha1");
  h.update(embeddingInput.version);
  h.update("\0");
  h.update(embeddingInput.truncationStrategy);
  h.update("\0");
  h.update(String(embeddingInput.chars));
  h.update("\0");
  h.update(embeddingInput.text);
  return "sha1-" + h.digest("hex");
}

module.exports = {
  buildEmbeddingInput,
  fingerprint,
  INPUT_STRATEGY_VERSION,
  DEFAULT_MAX_CHARS,
  DEFAULT_TRUNCATION
};
