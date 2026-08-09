/**
 * Truncation-strategiat embedding-inputille.
 *
 * v4.4 Rich Embedding Input Layer -osa (2026-08-09).
 *
 * Erillinen moduli jotta strategy on vaihdettavissa ilman että
 * buildEmbeddingInput.js muuttuu. Ensimmäisessä PR:ssä käytössä vain
 * "head" — muut ovat placeholder + kommentti, jotta strukturi on
 * valmis myöhempiä testejä varten.
 *
 * Käyttö:
 *   const { truncate } = require("./embeddingTruncation");
 *   const result = truncate(longText, { maxChars: 6000, strategy: "head" });
 *   // → { text, truncated, originalChars }
 */

const DEFAULT_MAX_CHARS = 6000;
const DEFAULT_STRATEGY = "head";

/**
 * Truncation-strategia "head": pidä alusta N merkkiä.
 * Yksinkertaisin. Toimii hyvin sisällöille joissa aihe esitellään alkuun
 * (esim. blog-postit, esitykset joissa title-slide + intro on alussa).
 */
function truncateHead(text, maxChars) {
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: text.substring(0, maxChars), truncated: true };
}

/**
 * PLACEHOLDER: "headAndTail" — pidä alku ja loppu, jätä keskustasta pois.
 * Voisi toimia paremmin pitkille SlideShare-transcripteille jotka
 * sisältävät myös yhteenveto-slidet lopussa. EI TOTEUTETTU vielä.
 */
function truncateHeadAndTail(text, maxChars) {
  // TODO v4.5+: half from head + half from tail with separator "\n[...]\n"
  // Ensimmäisessä versiossa palautuu head-strategyyn.
  return truncateHead(text, maxChars);
}

/**
 * PLACEHOLDER: "chunkAndPool" — jaa tekstistä useita chunk:eja, laske
 * embedding kullekin, pool:aa keskiarvolla tai attention-mekaniikalla.
 * EI TOTEUTETTU vielä. Vaatii buildEmbeddingInput:in ja build-embeddings:in
 * arkkitehtuurimuutoksen (yksi item → useita vektoreita).
 */
function truncateChunkAndPool(text, _maxChars) {
  // TODO v4.5+
  throw new Error("chunkAndPool-strategia ei ole vielä toteutettu");
}

const STRATEGIES = {
  head: truncateHead,
  headAndTail: truncateHeadAndTail,
  chunkAndPool: truncateChunkAndPool
};

/**
 * truncate(text, options)
 *
 * @param {string} text — koko embedding-input
 * @param {object} [options]
 * @param {number} [options.maxChars=6000] — kova yläraja
 * @param {("head"|"headAndTail"|"chunkAndPool")} [options.strategy="head"]
 * @returns {{ text: string, truncated: boolean, originalChars: number, strategy: string }}
 */
function truncate(text, options = {}) {
  const input = String(text || "");
  const maxChars = Number(options.maxChars) || DEFAULT_MAX_CHARS;
  const strategy = options.strategy || DEFAULT_STRATEGY;
  const fn = STRATEGIES[strategy];
  if (!fn) throw new Error(`Tuntematon truncation-strategia: ${strategy}`);
  const result = fn(input, maxChars);
  return {
    text: result.text,
    truncated: result.truncated,
    originalChars: input.length,
    strategy
  };
}

module.exports = {
  truncate,
  DEFAULT_MAX_CHARS,
  DEFAULT_STRATEGY,
  STRATEGIES: Object.keys(STRATEGIES)
};
