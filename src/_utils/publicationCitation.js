/**
 * publicationCitation — Node-side accessor for the isomorphic
 * shared citation renderer located at src/js/publication-citation.js.
 *
 * The renderer itself is UMD so it can be loaded from the browser
 * (via `/js/publication-citation.js`) and from Node (via this
 * accessor). Keeping a single source of truth avoids Node/browser
 * formatter drift.
 */

"use strict";

module.exports = require("../js/publication-citation.js");
