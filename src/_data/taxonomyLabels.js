const { slugifyTerm } = require("./metadata-normalization");

const CATEGORY_LABELS_EN_BY_SLUG = {
  "politiikka-ja-paatoksenteko": "Politics and Decision-making",
  "kaupunkikehitys-ja-palveluverkko": "Urban Development and Service Network",
  "sivistys-ja-koulutus": "Education and Culture",
  "mediassa": "Media",
  "yliopisto-ja-korkeakoulut": "Universities and Higher Education",
  "hyvinvointi-ja-osallisuus": "Wellbeing and Participation",
  "oulu": "Oulu",
  "koulutusteknologia": "Educational Technology",
  "politiikka": "Politics",
  "teknologia-ja-digitaalisuus": "Technology and Digitalisation",
  "tekoaly": "Artificial Intelligence",
  "haastattelut": "Interviews",
  "vaalit": "Elections",
  "opettajankoulutus": "Teacher Education",
  "kulttuuri-ja-paikallisidentiteetti": "Culture and Local Identity",
  "kasvatus-ja-koulutus": "Education",
  "jaali": "Jääli",
  "matkat-ja-henkilokohtaiset": "Travel and Personal",
  "koulutuspolitiikka": "Education Policy",
  "avoin-tiede": "Open Science",
  "haastattelijana": "As Interviewer",
  "liikunta-ja-ulkoilu": "Sports and Outdoor Activities",
  "podcastit": "Podcasts",
  "tekoaly-ja-datatoimijuus": "AI and Data Agency",
  "asiantuntijatehtavat": "Expert Assignments",
  "julkinen-digitalisaatio": "Public Digitalisation",
  "kaupunkikehitys": "Urban Development",
  "kuntapolitiikka": "Municipal Politics",
  "palkinnot-ja-tunnustukset": "Awards and Recognition",
  "videot": "Videos",
  "avoin-hallinto": "Open Government",
  "digipedagogiikka": "Digital Pedagogy",
  "digitaalinen-osaaminen": "Digital Competence",
  "etaopetus": "Distance Education",
  "eu-hanke": "EU Project",
  "kouluverkko": "School Network",
  "kulttuuri": "Culture",
  "kulttuuri-ja-taide": "Culture and Art",
  "mobiililaitteet-opetuksessa": "Mobile Devices in Teaching",
  "muistelutyo": "Memory Work",
  "oppimisymparistot-ja-tilat": "Learning Environments and Spaces",
  "paikallisuus": "Locality",
  "perhe": "Family",
  "perusopetus": "Basic Education",
  "radio": "Radio",
  "tekoalylukutaito-ja-teknologia": "AI Literacy and Technology",
  "tietojohtaminen": "Knowledge Management",
  "varhaiskasvatus": "Early Childhood Education"
};

const TAXONOMY_TYPE_LABELS_EN_BY_SLUG = {
  "mediassa": "Media",
  "esitykset-ja-videot": "Presentations and Videos",
  "lausunnot": "Statements",
  "valtuuston-kyselytunnit": "Council Question Hours",
  "valtuustopuheenvuorot": "Council Speeches",
  "akateemiset-puheet": "Academic Speeches",
  "juhlapuheet": "Ceremonial Speeches",
  "julkiset-puheet": "Public Speeches",
  "puheet": "Speeches",
  "mielipiteet": "Opinions",
  "kolumnit": "Columns",
  "aloitteet-ja-asiat": "Initiatives and Items",
  "blogikirjoitukset": "Blog Posts",
  "tieteelliset-julkaisut": "Scientific Publications",
  "muut-sisallot": "Other Content"
};

function labelFromMap(value, lang = "fi", map = {}) {
  const raw = String(value || "").trim();
  if (!raw || lang !== "en") return raw;
  return map[slugifyTerm(raw)] || raw;
}

function category(value, lang = "fi") {
  return labelFromMap(value, lang, CATEGORY_LABELS_EN_BY_SLUG);
}

function taxonomyType(value, lang = "fi") {
  return labelFromMap(value, lang, TAXONOMY_TYPE_LABELS_EN_BY_SLUG);
}

function term(value, lang = "fi", kind = "category") {
  if (kind === "type" || kind === "taxonomyType") return taxonomyType(value, lang);
  if (kind === "category" || kind === "categories") return category(value, lang);
  return String(value || "").trim();
}

module.exports = {
  category,
  taxonomyType,
  term
};
