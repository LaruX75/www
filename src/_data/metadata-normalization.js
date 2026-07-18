function slugifyTerm(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const KEYWORD_CANONICAL_BY_SLUG = {
  "docomomo": "DoCoMoMo",
  "jaali": "Jääli",
  "kiiminki": "Kiiminki",
  "korvensuora": "Korvensuora",
  "kulttuuripaakaupunki": "kulttuuripääkaupunki",
  "lahikoulu": "lähikoulu",
  "linnanmaa": "Linnanmaa",
  "oppimisymparistot": "oppimisympäristöt",
  "oulu": "Oulu",
  "oulu2026": "Oulu2026",
  "oulun-kaupunki": "Oulun kaupunki",
  "oulun-yliopisto": "Oulun yliopisto",
  "oulunsalo": "Oulunsalo",
  "pohjois-makedonia": "Pohjois-Makedonia",
  "pohjois-pohjanmaa": "Pohjois-Pohjanmaa",
  "raksila": "Raksila",
  "raksilan-kampus": "Raksilan kampus",
  "digitaaliset-valineet": "digitaaliset välineet",
  "kaupunginvaltuusto": "Oulun kaupunginvaltuusto",
  "eurooppalainen-oulunseutu": "eurooppalainen Oulunseutu",
  "eurooppalainen-ouluseutu": "eurooppalainen Oulunseutu",
  "era-ja-luontomuseo": "luonto- ja erämuseo",
  "harrastukset": "harrastukset",
  "kuntavaalit2017": "kuntavaalit 2017",
  "lectio-precursora": "lectio precursoria",
  "lektio": "lectio precursoria",
  "lietteiden-kasittely": "lietteenkäsittely",
  "oppiminen-mobiilaitteiden-avulla": "mobiilioppiminen",
  "luonto-ja-eramuseo": "luonto- ja erämuseo",
  "microsoft-o365": "Microsoft 365",
  "o365": "Microsoft 365",
  "oulun-ammattikorkeakoulu": "Oulun ammattikorkeakoulu",
  "oulun-kaupungin-kaavoitus": "Oulun kaupungin kaavoitus",
  "oulun-kaupunginvaltuusto": "Oulun kaupunginvaltuusto",
  "opettajien-taydennyskoulutus": "opettajien täydennyskoulutus",
  "tulevaisuus": "tulevaisuus",
  "valineet-tyokalut": "välineet ja työkalut",
  "vaalit2017": "kuntavaalit 2017",
  "visio": "visio",
  "web-2-0": "Web 2.0",
  "web2-0": "Web 2.0",
  "yliopiston-muutto": "Oulun yliopiston muutto",
  "oulun-yliopiston-muutto": "Oulun yliopiston muutto",
  "koiteli": "Koiteli",
  "jokirannan-koulu": "Jokirannan koulu",
  "salonpaa": "Salonpää",
  "laivakangas": "Laivakangas",
  "oulun-teatteri": "Oulun teatteri",
  "tsv": "TSV"
};

const CATEGORY_CANONICAL_BY_SLUG = {
  "aluevaaalit2022": "Vaalit",
  "av-tekniikka": "Teknologia ja digitaalisuus",
  "digiluokka": "Teknologia ja digitaalisuus",
  "henkilokuva": "Matkat ja henkilökohtaiset",
  "hyvinvointi-ja-osallisuus": "Hyvinvointi ja osallisuus",
  "kamerat": "Teknologia ja digitaalisuus",
  "kaupunkikehitys-ja-palveluverkko": "Kaupunkikehitys ja palveluverkko",
  "kayttojarjestelmat": "Teknologia ja digitaalisuus",
  "koulutusteknologi": "Koulutusteknologia",
  "koulutusteknologia": "Koulutusteknologia",
  "kuntavaalit": "Vaalit",
  "liikunta": "Hyvinvointi ja osallisuus",
  "matkailu": "Matkat ja henkilökohtaiset",
  "matkat-ja-henkilokohtaiset": "Matkat ja henkilökohtaiset",
  "palveluverkko": "Kaupunkikehitys ja palveluverkko",
  "pilvipalvelut-ja-ekosysteemit": "Teknologia ja digitaalisuus",
  "poliitiikka": "Politiikka ja päätöksenteko",
  "politiikka-ja-paatoksenteko": "Politiikka ja päätöksenteko",
  "seurakuntavaalit": "Vaalit",
  "teknologia-ja-digitaalisuus": "Teknologia ja digitaalisuus",
  "teknologiatuettu-oppiminen-ja-opetus": "Koulutusteknologia",
  "tietotekniikka": "Teknologia ja digitaalisuus",
  "tutkimus": "Yliopisto ja korkeakoulut",
  "vaitoskirja": "Yliopisto ja korkeakoulut",
  "vaalit": "Vaalit",
  "www-sivustot": "Teknologia ja digitaalisuus",
  "yliopisto-ja-korkeakoulut": "Yliopisto ja korkeakoulut",
  "yliopistokampus": "Yliopisto ja korkeakoulut"
};

function normalizeKeyword(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const slug = slugifyTerm(raw);
  return KEYWORD_CANONICAL_BY_SLUG[slug] || raw;
}

function normalizeCategory(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const slug = slugifyTerm(raw);
  return CATEGORY_CANONICAL_BY_SLUG[slug] || raw;
}

function normalizeTermList(values, normalizeTerm) {
  const list = Array.isArray(values) ? values : [];
  const seen = new Set();
  const normalized = [];

  list.forEach((value) => {
    const canonical = normalizeTerm(value);
    const slug = slugifyTerm(canonical);
    if (!slug || seen.has(slug)) {
      return;
    }
    seen.add(slug);
    normalized.push(canonical);
  });

  return normalized;
}

function normalizeKeywordList(values) {
  return normalizeTermList(values, normalizeKeyword);
}

function normalizeCategoryList(values) {
  return normalizeTermList(values, normalizeCategory);
}

module.exports = {
  slugifyTerm,
  normalizeKeyword,
  normalizeKeywordList,
  normalizeCategory,
  normalizeCategoryList
};
