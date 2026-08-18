/**
 * publication-citation — Shared CSL-JSON → citation string renderer.
 *
 * Isomorphic UMD: works in Node (require) and browser (window.publicationCitation).
 *
 * Primary API:
 *   buildCitation({ csl, style }) → { text, style, empty }
 *
 * Styles: "apa" (default), "mla", "chicago", "bibtex", "ris".
 *
 * Contract:
 *   - Deterministic, side-effect free, no DOM access.
 *   - Accepts a CSL-JSON item as produced by src/_utils/publicationCsl.js.
 *   - Never mutates the input.
 *   - Never invents data; empty / unknown fields are omitted.
 *   - Returns `{ text: "", empty: true }` when the CSL item is missing
 *     the identity fields (id + title).
 */

(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.publicationCitation = factory();
  }
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DEFAULT_STYLE = "apa";
  var SUPPORTED_STYLES = ["apa", "mla", "chicago", "bibtex", "ris"];

  // TH-CITE1 Phase 2: FI → EN display map for thesis genre + publisher.
  // Only applied when style="apa" and csl.type="thesis" and lang="en".
  // Kept small and additive: unknown genres pass through unchanged so
  // legacy G5 records (typeCode "Doctoral dissertation (article-based)")
  // and any future custom genre string continue to render verbatim.
  var THESIS_GENRE_FI_TO_EN = {
    "Pro gradu -tutkielma": "Master's thesis",
    "Kandidaatintutkielma": "Bachelor's thesis",
    "Väitöskirja": "Doctoral dissertation",
    "Lisensiaatintutkielma": "Licentiate thesis",
    "Opinnäyte": "Thesis"
  };
  var THESIS_PUBLISHER_FI_TO_EN = {
    "Oulun yliopisto": "University of Oulu"
  };

  function normalizeLang(value) {
    var s = trimString(value).toLowerCase();
    return s === "en" ? "en" : "fi";
  }

  function displayThesisGenre(genre, lang) {
    if (!genre) return "";
    if (lang !== "en") return genre;
    return THESIS_GENRE_FI_TO_EN[genre] || genre;
  }

  function displayThesisPublisher(publisher, lang) {
    if (!publisher) return "";
    if (lang !== "en") return publisher;
    return THESIS_PUBLISHER_FI_TO_EN[publisher] || publisher;
  }

  // TH-CITE1 Phase 4A: normalise thesis genre (FI or EN string) to a
  // small stable enum. Consumed by BibTeX entry-type mapping and by
  // format helpers that need to distinguish master's / bachelor's /
  // doctoral / licentiate independent of the display language.
  //   "master"     — Pro gradu -tutkielma / Master's thesis
  //   "bachelor"   — Kandidaatintutkielma / Bachelor's thesis
  //   "doctoral"   — Väitöskirja / Doctoral dissertation
  //   "licentiate" — Lisensiaatintutkielma / Licentiate thesis
  //   "other"      — unrecognised / missing genre
  function normalizedThesisGenre(genre) {
    var g = trimString(genre);
    if (!g) return "other";
    if (g === "Pro gradu -tutkielma" || g === "Master's thesis") return "master";
    if (g === "Kandidaatintutkielma" || g === "Bachelor's thesis") return "bachelor";
    if (g === "Väitöskirja" || g === "Doctoral dissertation") return "doctoral";
    if (g === "Lisensiaatintutkielma" || g === "Licentiate thesis") return "licentiate";
    return "other";
  }

  // TH-CITE1 Phase 4A: deterministic, human-readable, ASCII-safe
  // citation key for BibTeX thesis entries. Shape:
  //     firstAuthorFamily + year + firstTitleWord
  // Matches the legacy browser convention documented in the Phase 4
  // readiness audit while staying deterministic per CSL object.
  // Publications keep their existing `bibtexKey` behaviour — this
  // function only fires when `csl.type === "thesis"`.
  function bibtexThesisKey(csl) {
    var authors = toArraySafe(csl.author);
    var family = "";
    if (authors.length) {
      family = trimString(authors[0].family) || trimString(authors[0].literal) || "";
    }
    var year = extractYear(csl.issued) || "nd";
    var title = trimString(csl.title);
    // First non-whitespace/non-punctuation token; normalisation below
    // strips combining marks so the final key is ASCII-lowercase.
    var firstWordMatch = title.match(/[^\s.,:;()\[\]"'!?]+/);
    var firstWord = firstWordMatch ? firstWordMatch[0] : "thesis";
    return String(family + year + firstWord)
      .normalize("NFD")
      .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "") || ("thesis" + year);
  }

  // TH-CITE1 Phase 4A: BibTeX entry type for a thesis CSL, selected
  // from the normalised genre rather than a blanket `@phdthesis`.
  //   master     → @mastersthesis
  //   doctoral   → @phdthesis
  //   licentiate → @phdthesis (closest valid BibTeX representation)
  //   bachelor   → @misc      (BibTeX has no @bachelorsthesis;
  //                            level is preserved via `howpublished`)
  //   other      → @phdthesis (safe fallback)
  function bibtexThesisEntryType(csl) {
    switch (normalizedThesisGenre(csl.genre)) {
      case "master": return "mastersthesis";
      case "bachelor": return "misc";
      case "doctoral": return "phdthesis";
      case "licentiate": return "phdthesis";
      default: return "phdthesis";
    }
  }

  function isString(value) {
    return typeof value === "string";
  }

  function isFinitePositive(value) {
    var n = Number(value);
    return isFinite(n) && n > 0;
  }

  function trimString(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  function stripTrailingPunctuation(value) {
    return trimString(value).replace(/[\s.,;:]+$/g, "");
  }

  function endsWith(value, suffixes) {
    var s = trimString(value);
    for (var i = 0; i < suffixes.length; i++) {
      if (s.slice(-suffixes[i].length) === suffixes[i]) return true;
    }
    return false;
  }

  function appendSentence(target, addition) {
    var t = trimString(target);
    var a = trimString(addition);
    if (!a) return t;
    if (!t) return a;
    var needsPeriod = !endsWith(t, [".", "?", "!"]);
    return needsPeriod ? t + ". " + a : t + " " + a;
  }

  function joinWithSemicolons(parts) {
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = trimString(parts[i]);
      if (p) out.push(p);
    }
    return out.join("; ");
  }

  function toArraySafe(value) {
    return Array.isArray(value) ? value : [];
  }

  function extractYear(cslIssued) {
    if (!cslIssued || !Array.isArray(cslIssued["date-parts"])) return "";
    var first = cslIssued["date-parts"][0];
    if (!Array.isArray(first) || !first.length) return "";
    return isFinitePositive(first[0]) ? String(first[0]) : "";
  }

  function initials(given) {
    var s = trimString(given).replace(/\./g, "");
    if (!s) return "";
    var parts = s.split(/[\s\-]+/).filter(Boolean);
    return parts.map(function (p) { return p.charAt(0).toUpperCase() + "."; }).join(" ");
  }

  function nameApa(entry) {
    if (!entry) return "";
    if (isString(entry.literal) && entry.literal) return trimString(entry.literal);
    var family = trimString(entry.family);
    var given = trimString(entry.given);
    if (family && given) return family + ", " + initials(given);
    if (family) return family;
    if (given) return given;
    return "";
  }

  function nameMla(entry) {
    if (!entry) return "";
    if (isString(entry.literal) && entry.literal) return trimString(entry.literal);
    var family = trimString(entry.family);
    var given = trimString(entry.given);
    if (family && given) return family + ", " + given;
    return family || given || "";
  }

  function nameChicago(entry) {
    return nameMla(entry);
  }

  function nameNatural(entry) {
    if (!entry) return "";
    if (isString(entry.literal) && entry.literal) return trimString(entry.literal);
    var family = trimString(entry.family);
    var given = trimString(entry.given);
    if (given && family) return given + " " + family;
    return family || given || "";
  }

  function nameBibtex(entry) {
    if (!entry) return "";
    if (isString(entry.literal) && entry.literal) return trimString(entry.literal);
    var family = trimString(entry.family);
    var given = trimString(entry.given);
    if (family && given) return family + ", " + given;
    return family || given || "";
  }

  function bibtexKey(csl) {
    var authors = toArraySafe(csl.author);
    var firstName = authors.length ? (authors[0].family || authors[0].literal || "tekija") : "tekija";
    var year = extractYear(csl.issued) || "nd";
    var titlePart = trimString(csl.title).split(/\s+/).slice(0, 4).join("");
    return String(firstName + year + titlePart)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 50) || "julkaisu";
  }

  function bibtexEntryType(csl) {
    switch (csl.type) {
      case "article-journal":
      case "article-magazine":
      case "article-newspaper":
        return "article";
      case "paper-conference":
        return "inproceedings";
      case "chapter":
        return "inbook";
      case "book":
        return "book";
      case "thesis":
        return "phdthesis";
      default:
        return "misc";
    }
  }

  function risEntryType(csl) {
    switch (csl.type) {
      case "article-journal":
        return "JOUR";
      case "article-magazine":
        return "MGZN";
      case "article-newspaper":
        return "NEWS";
      case "paper-conference":
        return "CPAPER";
      case "chapter":
        return "CHAP";
      case "book":
        return "BOOK";
      case "thesis":
        return "THES";
      default:
        return "GEN";
    }
  }

  function apaAuthorList(authors) {
    if (!authors.length) return "";
    var names = authors.map(nameApa).filter(Boolean);
    if (!names.length) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + ", & " + names[1];
    var head = names.slice(0, names.length - 1).join(", ");
    return head + ", & " + names[names.length - 1];
  }

  function mlaAuthorList(authors) {
    if (!authors.length) return "";
    if (authors.length === 1) return nameMla(authors[0]);
    if (authors.length === 2) return nameMla(authors[0]) + ", and " + nameNatural(authors[1]);
    return nameMla(authors[0]) + ", et al";
  }

  function chicagoAuthorList(authors) {
    if (!authors.length) return "";
    if (authors.length === 1) return nameChicago(authors[0]);
    if (authors.length === 2) {
      return nameChicago(authors[0]) + ", and " + nameNatural(authors[1]);
    }
    var head = [nameChicago(authors[0])];
    for (var i = 1; i < authors.length - 1; i++) head.push(nameNatural(authors[i]));
    return head.join(", ") + ", and " + nameNatural(authors[authors.length - 1]);
  }

  function urlSuffix(csl) {
    var doi = trimString(csl.DOI);
    if (doi) return "https://doi.org/" + doi;
    return trimString(csl.URL);
  }

  function volumeIssuePagesApa(csl) {
    var out = "";
    var volume = trimString(csl.volume);
    var issue = trimString(csl.issue);
    var page = trimString(csl.page);
    if (volume) {
      out += volume;
      if (issue) out += "(" + issue + ")";
    }
    if (page) out += (out ? ", " : "") + page;
    return out;
  }

  function apa(csl, lang) {
    var authors = toArraySafe(csl.author);
    var authorText = apaAuthorList(authors) || "Tuntematon tekijä";
    var year = extractYear(csl.issued) || "n.d.";
    var title = trimString(csl.title) || "Nimetön julkaisu";
    var containerTitle = trimString(csl["container-title"]);
    var publisher = trimString(csl.publisher);
    var genre = trimString(csl.genre);
    var url = urlSuffix(csl);
    var normalizedLang = normalizeLang(lang);

    var titleStripped = stripTrailingPunctuation(title);
    var sentence;

    // TH-CITE1 Phase 2: theses render with APA 7 bracket notation:
    //   Authors (Year). Title [Genre, Publisher].
    // (no period between title and bracket per APA 7 §10.6). When
    // lang="en" the FI genre + publisher strings are translated via
    // the display map; unknown genres pass through unchanged.
    if (csl.type === "thesis") {
      var genreDisplay = displayThesisGenre(genre, normalizedLang);
      var publisherDisplay = displayThesisPublisher(publisher, normalizedLang);
      var host = genreDisplay || (normalizedLang === "en" ? "Thesis" : "Opinnäyte");
      var bracketBody = publisherDisplay ? host + ", " + publisherDisplay : host;
      sentence = authorText + " (" + year + "). " + titleStripped + " [" + bracketBody + "].";
    } else if (csl.type === "chapter") {
      sentence = authorText + " (" + year + "). " + titleStripped + ".";
      if (containerTitle) sentence += " Teoksessa " + stripTrailingPunctuation(containerTitle);
      var vip = volumeIssuePagesApa(csl);
      if (vip) sentence += " (" + vip + ")";
      sentence += ".";
      if (publisher) sentence += " " + publisher + ".";
    } else if (csl.type === "book") {
      sentence = authorText + " (" + year + "). " + titleStripped + ".";
      if (publisher) sentence += " " + publisher + ".";
      else if (containerTitle) sentence += " " + containerTitle + ".";
    } else {
      sentence = authorText + " (" + year + "). " + titleStripped + ".";
      if (containerTitle) {
        sentence += " " + containerTitle;
        var vip2 = volumeIssuePagesApa(csl);
        if (vip2) sentence += ", " + vip2;
        sentence += ".";
      } else if (publisher) {
        sentence += " " + publisher + ".";
      }
    }

    if (url) sentence = appendSentence(sentence, url);
    return sentence.replace(/\s+/g, " ").trim();
  }

  function mla(csl, lang) {
    var authors = toArraySafe(csl.author);
    var authorText = mlaAuthorList(authors) || "Tuntematon tekijä";
    var year = extractYear(csl.issued) || "n.d.";
    var title = trimString(csl.title) || "Nimetön julkaisu";
    var containerTitle = trimString(csl["container-title"]);
    var publisher = trimString(csl.publisher);
    var volume = trimString(csl.volume);
    var issue = trimString(csl.issue);
    var page = trimString(csl.page);
    var doi = trimString(csl.DOI);
    var url = trimString(csl.URL);

    // TH-CITE1 Phase 4A: MLA thesis branch. Emits
    //   Authors. "Title." Genre, Publisher, Year. URL.
    // using the same FI/EN display map as the Phase 2 APA branch.
    // No new translation map; reuses displayThesisGenre / Publisher.
    if (csl.type === "thesis") {
      var normalizedLangMla = normalizeLang(lang);
      var genre = trimString(csl.genre);
      var genreDisplayMla = displayThesisGenre(genre, normalizedLangMla)
        || (normalizedLangMla === "en" ? "Thesis" : "Opinnäyte");
      var publisherDisplayMla = displayThesisPublisher(publisher, normalizedLangMla);
      var outThesis = stripTrailingPunctuation(authorText) + ". \"" + stripTrailingPunctuation(title) + ".\" " + genreDisplayMla;
      if (publisherDisplayMla) outThesis += ", " + publisherDisplayMla;
      outThesis += ", " + year + ".";
      if (url) outThesis += " " + url + ".";
      return outThesis.replace(/\s+/g, " ").trim();
    }

    var out = stripTrailingPunctuation(authorText) + ". \"" + stripTrailingPunctuation(title) + ".\"";
    if (containerTitle) out += " " + containerTitle;
    if (volume) out += ", vol. " + volume;
    if (issue) out += ", no. " + issue;
    out += ", " + year;
    if (page) out += ", pp. " + page;
    if (!containerTitle && publisher) out += ", " + publisher;
    out += ".";
    if (doi) out += " doi:" + doi + ".";
    else if (url) out += " " + url + ".";
    return out.replace(/\s+/g, " ").trim();
  }

  function chicago(csl, lang) {
    var authors = toArraySafe(csl.author);
    var authorText = chicagoAuthorList(authors) || "Tuntematon tekijä";
    var year = extractYear(csl.issued) || "n.d.";
    var title = trimString(csl.title) || "Nimetön julkaisu";
    var containerTitle = trimString(csl["container-title"]);
    var publisher = trimString(csl.publisher);
    var volume = trimString(csl.volume);
    var issue = trimString(csl.issue);
    var page = trimString(csl.page);
    var doi = trimString(csl.DOI);
    var url = trimString(csl.URL);

    // TH-CITE1 Phase 4A: Chicago author-date thesis branch. Emits
    //   Authors. Year. "Title." Genre, Publisher. URL.
    // Reuses displayThesisGenre / displayThesisPublisher so FI and
    // EN follow the same Phase 2 mapping used in APA + MLA.
    if (csl.type === "thesis") {
      var normalizedLangCh = normalizeLang(lang);
      var genreCh = trimString(csl.genre);
      var genreDisplayCh = displayThesisGenre(genreCh, normalizedLangCh)
        || (normalizedLangCh === "en" ? "Thesis" : "Opinnäyte");
      var publisherDisplayCh = displayThesisPublisher(publisher, normalizedLangCh);
      var outThesisCh = stripTrailingPunctuation(authorText) + ". " + year + ". \"" + stripTrailingPunctuation(title) + ".\" " + genreDisplayCh;
      if (publisherDisplayCh) outThesisCh += ", " + publisherDisplayCh;
      outThesisCh += ".";
      if (url) outThesisCh += " " + url + ".";
      return outThesisCh.replace(/\s+/g, " ").trim();
    }

    var out = stripTrailingPunctuation(authorText) + ". \"" + stripTrailingPunctuation(title) + ".\"";
    if (containerTitle) out += " " + containerTitle;
    if (volume) out += " " + volume;
    if (issue) out += ", no. " + issue;
    out += " (" + year + ")";
    if (page) out += ": " + page;
    out += ".";
    if (!containerTitle && publisher) out = out.slice(0, -1) + " " + publisher + ".";
    if (doi) out += " https://doi.org/" + doi + ".";
    else if (url) out += " " + url + ".";
    return out.replace(/\s+/g, " ").trim();
  }

  function bibtex(csl, lang) {
    var authors = toArraySafe(csl.author);
    var authorText = authors.length
      ? authors.map(nameBibtex).filter(Boolean).join(" and ")
      : "Tuntematon Tekija";
    var year = extractYear(csl.issued) || "n.d.";
    var title = trimString(csl.title) || "Nimeton julkaisu";
    var containerTitle = trimString(csl["container-title"]);
    var publisher = trimString(csl.publisher);
    var volume = trimString(csl.volume);
    var issue = trimString(csl.issue);
    var page = trimString(csl.page);
    var doi = trimString(csl.DOI);
    var url = trimString(csl.URL);
    var isbn = trimString(csl.ISBN);

    // TH-CITE1 Phase 4A: BibTeX thesis branch. Entry type is derived
    // from the normalised thesis genre — @mastersthesis /
    // @phdthesis / @misc — and the school/publisher field convention
    // follows the chosen entry type (school for master/phd; misc uses
    // howpublished so the level is self-contained). Citation key
    // uses bibtexThesisKey (family+year+firstTitleWord). Publications
    // keep their existing bibtexEntryType + bibtexKey path unchanged.
    if (csl.type === "thesis") {
      var normalizedLangBt = normalizeLang(lang);
      var genreBt = trimString(csl.genre);
      var genreDisplayBt = displayThesisGenre(genreBt, normalizedLangBt)
        || (normalizedLangBt === "en" ? "Thesis" : "Opinnäyte");
      var publisherDisplayBt = displayThesisPublisher(publisher, normalizedLangBt);
      var thesisEntryType = bibtexThesisEntryType(csl);
      var thesisKey = bibtexThesisKey(csl);
      var thesisLines = ["@" + thesisEntryType + "{" + thesisKey + ","];
      thesisLines.push("  author = {" + authorText + "},");
      thesisLines.push("  title = {" + title + "},");
      thesisLines.push("  year = {" + year + "},");
      if (thesisEntryType === "mastersthesis" || thesisEntryType === "phdthesis") {
        if (publisherDisplayBt) thesisLines.push("  school = {" + publisherDisplayBt + "},");
      } else {
        // @misc: preserve level + institution via howpublished so the
        // record remains self-descriptive even without a school field.
        var howpublishedParts = [];
        if (genreDisplayBt) howpublishedParts.push(genreDisplayBt);
        if (publisherDisplayBt) howpublishedParts.push(publisherDisplayBt);
        if (howpublishedParts.length) {
          thesisLines.push("  howpublished = {" + howpublishedParts.join(", ") + "},");
        }
      }
      if (url) thesisLines.push("  url = {" + url + "},");
      thesisLines.push("}");
      return thesisLines.join("\n");
    }

    var entryType = bibtexEntryType(csl);
    var key = bibtexKey(csl);
    var lines = ["@" + entryType + "{" + key + ","];
    lines.push("  author = {" + authorText + "},");
    lines.push("  title = {" + title + "},");
    lines.push("  year = {" + year + "},");
    if (containerTitle) {
      var containerKey = (entryType === "inbook" || entryType === "inproceedings") ? "booktitle" : "journal";
      lines.push("  " + containerKey + " = {" + containerTitle + "},");
    }
    if (volume) lines.push("  volume = {" + volume + "},");
    if (issue) lines.push("  number = {" + issue + "},");
    if (page) lines.push("  pages = {" + page + "},");
    if (publisher) lines.push("  publisher = {" + publisher + "},");
    if (isbn) lines.push("  isbn = {" + isbn + "},");
    if (doi) lines.push("  doi = {" + doi + "},");
    if (url) lines.push("  url = {" + url + "},");
    lines.push("}");
    return lines.join("\n");
  }

  function ris(csl, lang) {
    var lines = ["TY  - " + risEntryType(csl)];
    var authors = toArraySafe(csl.author);
    for (var i = 0; i < authors.length; i++) {
      var name = nameBibtex(authors[i]);
      if (name) lines.push("AU  - " + name);
    }
    var year = extractYear(csl.issued);
    if (year) lines.push("PY  - " + year);
    var title = trimString(csl.title);
    if (title) lines.push("TI  - " + title);
    var containerTitle = trimString(csl["container-title"]);
    if (containerTitle) {
      var tag = risEntryType(csl) === "JOUR" ? "JO" : "T2";
      lines.push(tag + "  - " + containerTitle);
    }
    var volume = trimString(csl.volume);
    if (volume) lines.push("VL  - " + volume);
    var issue = trimString(csl.issue);
    if (issue) lines.push("IS  - " + issue);
    var page = trimString(csl.page);
    if (page) {
      var m = /^(\d+)\s*-\s*(\d+)$/.exec(page);
      if (m) {
        lines.push("SP  - " + m[1]);
        lines.push("EP  - " + m[2]);
      } else {
        lines.push("SP  - " + page);
      }
    }
    var publisher = trimString(csl.publisher);
    // TH-CITE1 Phase 4A: for a thesis RIS record, publisher is
    // emitted through the shared thesis display map so FI/EN mirror
    // the human-readable citation styles. Non-thesis records keep
    // the raw publisher string.
    if (csl.type === "thesis") {
      var publisherDisplayRis = displayThesisPublisher(publisher, normalizeLang(lang));
      if (publisherDisplayRis) lines.push("PB  - " + publisherDisplayRis);
    } else if (publisher) {
      lines.push("PB  - " + publisher);
    }
    // TH-CITE1 Phase 4A: thesis-level M3 line so Zotero + Mendeley
    // (and any other RIS consumer) capture the thesis genre. Same
    // FI/EN display map as APA/MLA/Chicago.
    if (csl.type === "thesis") {
      var genreDisplayRis = displayThesisGenre(trimString(csl.genre), normalizeLang(lang));
      if (genreDisplayRis) lines.push("M3  - " + genreDisplayRis);
    }
    var isbn = trimString(csl.ISBN);
    if (isbn) lines.push("SN  - " + isbn);
    var doi = trimString(csl.DOI);
    if (doi) lines.push("DO  - " + doi);
    var url = trimString(csl.URL);
    if (url) lines.push("UR  - " + url);
    lines.push("ER  - ");
    return lines.join("\n");
  }

  function normalizeStyle(style) {
    var s = trimString(style).toLowerCase() || DEFAULT_STYLE;
    return SUPPORTED_STYLES.indexOf(s) === -1 ? DEFAULT_STYLE : s;
  }

  function buildCitation(options) {
    var opts = options || {};
    var csl = opts.csl || null;
    var style = normalizeStyle(opts.style);
    var lang = normalizeLang(opts.lang);
    if (!csl || typeof csl !== "object" || !csl.id || !csl.title) {
      return { text: "", style: style, empty: true };
    }
    var text;
    switch (style) {
      // TH-CITE1 Phase 4A: lang threaded through every style. The
      // shared FI/EN thesis display map only fires when
      // csl.type === "thesis"; publication output is unaffected.
      case "mla": text = mla(csl, lang); break;
      case "chicago": text = chicago(csl, lang); break;
      case "bibtex": text = bibtex(csl, lang); break;
      case "ris": text = ris(csl, lang); break;
      case "apa":
      default: text = apa(csl, lang); break;
    }
    return { text: text, style: style, empty: false };
  }

  return {
    SUPPORTED_STYLES: SUPPORTED_STYLES,
    DEFAULT_STYLE: DEFAULT_STYLE,
    buildCitation: buildCitation,
    // exported for tests
    apa: apa,
    mla: mla,
    chicago: chicago,
    bibtex: bibtex,
    ris: ris,
    extractYear: extractYear
  };
}));
