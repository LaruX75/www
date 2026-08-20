const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildArchiveRow,
  buildArchiveRowFromPagefind,
  buildTypeRoleLabel,
  normalizeLang,
  TYPE_ROLE_LABELS
} = require("../../src/_utils/thesisArchiveRow");

const raw = () => ({
  title: "6-luokkalaisten kokemuksia matematiikka-ahdistuksesta",
  authors: ["Riikonen, Hanni"],
  year: "2026",
  type: "masterThesis",
  thesisRole: "advised",
  link: "https://oulurepo.oulu.fi/handle/10024/62699",
  pageUrl: "/opinnaytteet/62699/"
});

const detail = () => ({
  title: "Kohtaamisia ruudun takaa",
  authorLine: "Stång, A.",
  year: "2026",
  thesisType: "masterThesis",
  thesisRole: "reviewed",
  pageUrl: "/opinnaytteet/61940/",
  sourceUrl: "https://oulurepo.oulu.fi/handle/10024/61940"
});

const pagefindMeta = () => ({
  title: "6-luokkalaisten kokemuksia matematiikka-ahdistuksesta",
  thesesAuthorLine: "Riikonen, Hanni",
  thesesYear: "2026",
  thesesType: "masterThesis",
  thesesRole: "advised",
  thesesSourceUrl: "https://oulurepo.oulu.fi/handle/10024/62699"
});

describe("normalizeLang", () => {
  test("defaults to fi", () => {
    assert.equal(normalizeLang(undefined), "fi");
    assert.equal(normalizeLang(""), "fi");
    assert.equal(normalizeLang("xx"), "fi");
  });
  test("accepts en", () => {
    assert.equal(normalizeLang("en"), "en");
    assert.equal(normalizeLang("EN"), "en");
  });
});

describe("buildTypeRoleLabel — all 4 combos", () => {
  test("FI labels", () => {
    assert.equal(buildTypeRoleLabel("masterThesis", "advised", "fi"), "Gradu · ohjattu");
    assert.equal(buildTypeRoleLabel("masterThesis", "reviewed", "fi"), "Gradu · tarkastettu");
    assert.equal(buildTypeRoleLabel("bachelorThesis", "advised", "fi"), "Kandi · ohjattu");
    assert.equal(buildTypeRoleLabel("bachelorThesis", "reviewed", "fi"), "Kandi · tarkastettu");
  });
  test("EN labels", () => {
    assert.equal(buildTypeRoleLabel("masterThesis", "advised", "en"), "Master's · advised");
    assert.equal(buildTypeRoleLabel("masterThesis", "reviewed", "en"), "Master's · reviewed");
    assert.equal(buildTypeRoleLabel("bachelorThesis", "advised", "en"), "Bachelor's · advised");
    assert.equal(buildTypeRoleLabel("bachelorThesis", "reviewed", "en"), "Bachelor's · reviewed");
  });
  test("doctoralThesis falls back to type-only + role", () => {
    assert.equal(buildTypeRoleLabel("doctoralThesis", "advised", "fi"), "Väitöskirja · ohjattu");
    assert.equal(buildTypeRoleLabel("doctoralThesis", "reviewed", "en"), "Doctoral dissertation · reviewed");
  });
  test("missing type + role → localized fallback", () => {
    assert.equal(buildTypeRoleLabel("", "", "fi"), "Opinnäyte");
    assert.equal(buildTypeRoleLabel("", "", "en"), "Thesis");
  });
  test("missing type, known role → uses generic thesis label", () => {
    assert.equal(buildTypeRoleLabel("", "advised", "fi"), "Opinnäyte · ohjattu");
    assert.equal(buildTypeRoleLabel("", "reviewed", "en"), "Thesis · reviewed");
  });
  test("missing role, known type → type-only", () => {
    assert.equal(buildTypeRoleLabel("masterThesis", "", "fi"), "Gradu");
    assert.equal(buildTypeRoleLabel("bachelorThesis", "", "en"), "Bachelor's thesis");
  });
});

describe("buildArchiveRow — raw canonical thesis shape", () => {
  test("returns display-safe fields with FI type/role label", () => {
    const row = buildArchiveRow(raw(), "fi");
    assert.equal(row.year, "2026");
    assert.equal(row.authorLine, "Riikonen, Hanni");
    assert.equal(row.title, "6-luokkalaisten kokemuksia matematiikka-ahdistuksesta");
    assert.equal(row.thesisType, "masterThesis");
    assert.equal(row.thesisRole, "advised");
    assert.equal(row.typeRoleLabel, "Gradu · ohjattu");
    assert.equal(row.pageUrl, "/opinnaytteet/62699/");
    assert.equal(row.sourceUrl, "https://oulurepo.oulu.fi/handle/10024/62699");
    assert.equal(row.lang, "fi");
  });
  test("preserves sourceUrl exactly — never derived from pageUrl", () => {
    const row = buildArchiveRow({ ...raw(), pageUrl: "/opinnaytteet/62699/", link: "https://oulurepo.oulu.fi/handle/10024/62699" }, "fi");
    assert.equal(row.pageUrl, "/opinnaytteet/62699/");
    assert.equal(row.sourceUrl, "https://oulurepo.oulu.fi/handle/10024/62699");
    assert.notEqual(row.pageUrl, row.sourceUrl);
  });
  test("multi-author array becomes semicolon-separated", () => {
    const row = buildArchiveRow({ ...raw(), authors: ["Kurki, Suvi", "Komulainen, Anna"] }, "fi");
    assert.equal(row.authorLine, "Kurki, Suvi; Komulainen, Anna");
  });
  test("bachelor + advised in EN", () => {
    const row = buildArchiveRow({ ...raw(), type: "bachelorThesis", thesisRole: "advised" }, "en");
    assert.equal(row.typeRoleLabel, "Bachelor's · advised");
    assert.equal(row.lang, "en");
  });
  test("null input yields empty row", () => {
    const row = buildArchiveRow(null, "fi");
    assert.equal(row.year, "");
    assert.equal(row.title, "");
    assert.equal(row.pageUrl, "");
    assert.equal(row.sourceUrl, "");
  });
  test("does not mutate input", () => {
    const input = raw();
    const snapshot = JSON.parse(JSON.stringify(input));
    buildArchiveRow(input, "fi");
    assert.deepEqual(input, snapshot);
  });
  test("deterministic across repeated calls", () => {
    const a = buildArchiveRow(raw(), "fi");
    const b = buildArchiveRow(raw(), "fi");
    assert.deepEqual(a, b);
  });
  test("does NOT emit citationApa", () => {
    const row = buildArchiveRow(raw(), "fi");
    assert.equal(row.citationApa, undefined);
    assert.equal(row.citation, undefined);
  });
});

describe("buildArchiveRow — thesisDetail shape", () => {
  test("reads authorLine + thesisType + sourceUrl directly", () => {
    const row = buildArchiveRow(detail(), "fi");
    assert.equal(row.authorLine, "Stång, A.");
    assert.equal(row.thesisType, "masterThesis");
    assert.equal(row.thesisRole, "reviewed");
    assert.equal(row.typeRoleLabel, "Gradu · tarkastettu");
    assert.equal(row.sourceUrl, "https://oulurepo.oulu.fi/handle/10024/61940");
  });
});

describe("buildArchiveRowFromPagefind", () => {
  test("consumes Pagefind meta + resultUrl", () => {
    const row = buildArchiveRowFromPagefind(pagefindMeta(), "/opinnaytteet/62699/", "fi");
    assert.equal(row.year, "2026");
    assert.equal(row.authorLine, "Riikonen, Hanni");
    assert.equal(row.title, "6-luokkalaisten kokemuksia matematiikka-ahdistuksesta");
    assert.equal(row.thesisType, "masterThesis");
    assert.equal(row.thesisRole, "advised");
    assert.equal(row.typeRoleLabel, "Gradu · ohjattu");
    assert.equal(row.pageUrl, "/opinnaytteet/62699/");
    assert.equal(row.sourceUrl, "https://oulurepo.oulu.fi/handle/10024/62699");
  });
  test("EN result uses EN label", () => {
    const row = buildArchiveRowFromPagefind(pagefindMeta(), "/opinnaytteet/62699/", "en");
    assert.equal(row.typeRoleLabel, "Master's · advised");
  });
  test("missing thesesSourceUrl → empty sourceUrl (no derivation from pageUrl)", () => {
    const meta = pagefindMeta();
    delete meta.thesesSourceUrl;
    const row = buildArchiveRowFromPagefind(meta, "/opinnaytteet/62699/", "fi");
    assert.equal(row.sourceUrl, "");
    assert.equal(row.pageUrl, "/opinnaytteet/62699/");
  });
  test("null meta yields empty row but preserves pageUrl", () => {
    const row = buildArchiveRowFromPagefind(null, "/opinnaytteet/62699/", "fi");
    assert.equal(row.pageUrl, "/opinnaytteet/62699/");
    assert.equal(row.sourceUrl, "");
    assert.equal(row.title, "");
  });
});

describe("TYPE_ROLE_LABELS constants shape", () => {
  test("both locales cover master + bachelor × advised + reviewed", () => {
    for (const lang of ["fi", "en"]) {
      for (const type of ["masterThesis", "bachelorThesis"]) {
        for (const role of ["advised", "reviewed"]) {
          assert.ok(TYPE_ROLE_LABELS[lang][type][role], `${lang}/${type}/${role} missing`);
        }
      }
    }
  });
});
