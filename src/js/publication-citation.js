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

  function apa(csl) {
    var authors = toArraySafe(csl.author);
    var authorText = apaAuthorList(authors) || "Tuntematon tekijä";
    var year = extractYear(csl.issued) || "n.d.";
    var title = trimString(csl.title) || "Nimetön julkaisu";
    var containerTitle = trimString(csl["container-title"]);
    var publisher = trimString(csl.publisher);
    var genre = trimString(csl.genre);
    var url = urlSuffix(csl);

    var sentence = authorText + " (" + year + "). " + stripTrailingPunctuation(title) + ".";

    if (csl.type === "thesis") {
      var host = genre || "Thesis";
      var suffix = publisher ? host + ", " + publisher : host;
      sentence += " " + suffix + ".";
    } else if (csl.type === "chapter") {
      if (containerTitle) sentence += " Teoksessa " + stripTrailingPunctuation(containerTitle);
      var vip = volumeIssuePagesApa(csl);
      if (vip) sentence += " (" + vip + ")";
      sentence += ".";
      if (publisher) sentence += " " + publisher + ".";
    } else if (csl.type === "book") {
      if (publisher) sentence += " " + publisher + ".";
      else if (containerTitle) sentence += " " + containerTitle + ".";
    } else {
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

  function mla(csl) {
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

  function chicago(csl) {
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

  function bibtex(csl) {
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

  function ris(csl) {
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
    if (publisher) lines.push("PB  - " + publisher);
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
    if (!csl || typeof csl !== "object" || !csl.id || !csl.title) {
      return { text: "", style: style, empty: true };
    }
    var text;
    switch (style) {
      case "mla": text = mla(csl); break;
      case "chicago": text = chicago(csl); break;
      case "bibtex": text = bibtex(csl); break;
      case "ris": text = ris(csl); break;
      case "apa":
      default: text = apa(csl); break;
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
