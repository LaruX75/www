const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const PRESENTATIONS_DIR = path.join(__dirname, "..", "presentations");

// Cities that indicate a paikallinen täydennyskoulutus / kuntien tilaisuus.
// Prefix-based match on word starts (works with Finnish sija-suffixes like -ssa, -lla, -sta).
const CITY_PREFIXES = [
  "kempele", "riihimä", "riihimae", "riihimä", "kalajok", "helsing", "helsinki",
  "espoo", "tamper", "kokkola", "kerava", "jyväsk", "jyvask", "rovanie",
  "kajaani", "vaasa", "turku", "lahti", "kuopio", "joensuu", "stadi"
];
// Ambivalent city names — must match as full word
const AMBIVALENT_CITIES = ["simo", "simon", "simoss", "pori", "porin", "poriss"];

function hasCity(text) {
  const words = text.split(/[^a-zäöå]+/i);
  for (const w of words) {
    if (!w) continue;
    for (const p of CITY_PREFIXES) {
      if (w.startsWith(p)) return true;
    }
    for (const c of AMBIVALENT_CITIES) {
      if (w === c) return true;
    }
  }
  return false;
}

const GROUPS = [
  {
    id: "yliopistotyo",
    title: "Yliopistokurssit ja luennot",
    icon: "bi-mortarboard-fill",
    kicker: "Opetustyö",
    description:
      "Oulun yliopistossa pidettyjä luentoja ja opintojaksomateriaaleja koulutusteknologian, opettajankoulutuksen ja tvt-perusopetuksen jaksoilta.",
    match: (text, fn) =>
      /\bluento\b|opintojak|jaksolla|kurssin johdanto/.test(text) ||
      /ktk\d{2,}|ktko\d/.test(fn) ||
      /\b\d{5,6}[a-z]\b/.test(text) ||
      /(koulutusteknologian|tvt\b|tieto- ja viestintätekni).*(perusteet|perusopinnot|opinnot|opintoja|opintojakso|jakso|4op)/.test(
        text
      ),
    excerpt: 4
  },
  {
    id: "veso-taydennyskoulutus",
    title: "VESO- ja kuntien opettajakoulutus",
    icon: "bi-buildings-fill",
    kicker: "Täydennyskoulutus",
    description:
      "Kuntien ja koulutusverkostojen tilaamia opettajien täydennyskoulutuksia — VESO-päivät, DigiErko, Osaava-hanke ja kaupunkeihin viedyt kutsupuheet.",
    match: (text, fn) =>
      /\bveso\b/.test(text) ||
      /digierko/.test(text) ||
      /täydennyskoulut|taydennyskoulut/.test(text) ||
      /osaava.*(digi|veso|hanke)/.test(text) ||
      /(robokampus|luova luokka|digikarne)/.test(text) ||
      /(opettajille suunnattu|opettajien täydennys)/.test(text) ||
      (hasCity(text) && /(20\d\d|tekoäly|koulut|opettaj|opetus|kunta)/.test(text))
  },
  {
    id: "keynote-konferenssit",
    title: "Keynote-puheenvuorot ja konferenssit",
    icon: "bi-megaphone-fill",
    kicker: "Puheenvuorot",
    description:
      "Kansallisia konferenssiavauksia, pyydetyt asiantuntijapuheenvuorot ja kutsuseminaarit koulutusalan tapahtumissa.",
    match: (text, fn) =>
      /keynote/.test(text) ||
      /konferenssi|kongressi|symposium|seminaari/.test(text) ||
      /\bitk\b|itk20\d\d|itk-20\d\d/.test(fn) ||
      /(itk|opi[- ]oulu|finnoschool|digierko|steam|arctic frontiers|opinpaiv|yliopistopäiv|lito).*20\d\d/.test(
        text
      ) ||
      /avauspuheenvuoro|avauspuhe|kutsupuh/.test(text) ||
      /paneeli.*kesku|panel discussion/.test(text)
  },
  {
    id: "kansainvaliset",
    title: "Kansainväliset tieteelliset esitelmät",
    icon: "bi-globe2",
    kicker: "Tutkimuskonferenssit",
    description:
      "Vertaisarvioidut ja kutsutut esitelmät kansainvälisissä koulutus- ja teknologiaan liittyvissä konferensseissa (englanniksi).",
    match: (text, fn) =>
      /\b(cscl|isls|earli|iste|hicss|site|ed-media|edmedia|ectel|icls|ijcnn|ircdl|edulearn)\b/.test(
        text
      ) ||
      /\bfab lab\b/.test(text) ||
      /\bcollaborative script/.test(text) ||
      /\bscaffold(ing)?\b.*(mobile|collaborative)/.test(text) ||
      /(developing|supporting|designing|predicting|scaffolding|analyz|analys).*(learning|technology|activities|research|edtech)/.test(
        text
      ) ||
      /\bsocial media as a tool for research/.test(text) ||
      /\bprofessional use of social media/.test(text)
  },
  {
    id: "webinaarit",
    title: "Webinaarit ja online-tilaisuudet",
    icon: "bi-camera-video-fill",
    kicker: "Verkkotilaisuudet",
    description:
      "Etätilaisuuksissa pidetyt asiantuntijapuheenvuorot — AVI:n webinaarit, ITK-webinaarit, Generation AI -sarja ja verkkolive-tapahtumat.",
    match: (text, fn) =>
      /webinaari|webinar/.test(text) ||
      /verkkolive|verkkoluent/.test(text) ||
      /generation ai.*(sovellu|yleisesitys|selitett|kyberturv)/.test(text)
  },
  {
    id: "tyopajat",
    title: "Työpajat ja fasilitoidut sessiot",
    icon: "bi-people-fill",
    kicker: "Vuorovaikutteinen työ",
    description:
      "Työpajat ja fasilitoidut asiantuntijasessiot, joissa aineisto tukee keskustelua ja yhteistä työskentelyä.",
    match: (text, fn) =>
      /työpaja|workshop\b|\bpaja\b/.test(text) ||
      /rakli|opinpaiv|lito2018/.test(text)
  },
  {
    id: "asiantuntijaesitelmat",
    title: "Asiantuntijaesitelmät ja koulutusteknologian kaari",
    icon: "bi-collection-fill",
    kicker: "Julkiset esitelmät",
    description:
      "Kutsuttuja ja julkisia asiantuntijaesitelmiä koulutusteknologian, mobiilioppimisen, sosiaalisen median ja opetuksen digitalisaation kehityksestä.",
    match: () => true, // catch-all
    excerpt: 5
  }
];

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else if (name.endsWith(".md")) results.push(full);
  }
  return results;
}

function readPresentation(fp) {
  const raw = fs.readFileSync(fp, "utf8");
  const fm = raw.match(/^---+\n([\s\S]*?)\n---+/);
  if (!fm) return null;
  let data = {};
  try {
    data = yaml.load(fm[1]) || {};
  } catch (e) {
    return null;
  }
  if (!data.title || !data.date) return null;
  const isoDate =
    typeof data.date === "string"
      ? data.date.substring(0, 10)
      : new Date(data.date).toISOString().substring(0, 10);
  const baseName = path.basename(fp, ".md");
  const url = data.pageUrl || `/presentations/${baseName}/`;
  return {
    title: data.title,
    date: isoDate,
    url,
    baseName,
    externalUrl: data.url || null
  };
}

module.exports = function () {
  const files = walk(PRESENTATIONS_DIR);
  const presentations = files.map(readPresentation).filter(Boolean);

  const claimed = new Set();
  const groups = GROUPS.map((group) => {
    const items = [];
    for (const p of presentations) {
      if (claimed.has(p.baseName)) continue;
      const text = `${p.title} ${p.baseName}`.toLowerCase();
      if (group.match(text, p.baseName.toLowerCase())) {
        claimed.add(p.baseName);
        items.push(p);
      }
    }
    items.sort((a, b) => (a.date < b.date ? 1 : -1));
    const excerpt = group.excerpt || 4;
    return {
      id: group.id,
      title: group.title,
      icon: group.icon,
      kicker: group.kicker,
      description: group.description,
      totalCount: items.length,
      featured: items.slice(0, excerpt),
      rest: items.slice(excerpt)
    };
  }).filter((g) => g.totalCount > 0);

  return {
    total: presentations.length,
    groups
  };
};
