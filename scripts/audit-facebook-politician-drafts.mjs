#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DEFAULT_INPUT = "src/blog/_drafts/facebook-politician";
const REPORT_JSON = "reports/facebook-politician-migration.json";
const REPORT_CSV = "reports/facebook-politician-migration.csv";
const REPORT_MD = "reports/facebook-politician-migration.md";

const GENERIC_TITLE_PATTERNS = [
  /lisäsi uuden kuvan/i,
  /lisäsi kuvan/i,
  /lisäsi \d+ uutta kuvaa/i,
  /lisäsi videon/i,
  /lisäsi uuden videon/i,
  /lisäsi \d+ uutta videota/i,
  /jakoi julkaisun/i,
  /jakoi linkin/i,
  /päivitti tilansa/i,
  /jakoi profiilin/i
];

const CONTENT_THEMES = [
  {
    key: "kampus-raksila-linnanmaa",
    label: "Kampus, Raksila ja Linnanmaa",
    terms: ["kampus", "linnanmaa", "raksila", "keskustakampus", "yliopistokampus", "syk", "yliopiston sijainti"]
  },
  {
    key: "palveluverkko",
    label: "Palveluverkko ja kaupunginosat",
    terms: ["palveluverkko", "kouluverkko", "päiväkotiverkko", "lähikoulu", "lähipalvel", "kaupunginosa", "suuralue", "jääli", "kiiminki", "haukipudas"]
  },
  {
    key: "sivistyslautakunta",
    label: "Sivistyslautakunta ja koulutuspolitiikka",
    terms: ["sivistyslautakunta", "sivistys- ja kulttuurilautakunta", "lautakunta", "varhaiskasvatus", "koulu", "oppilas", "opetus", "lukio"]
  },
  {
    key: "vaalit",
    label: "Vaalit ja kampanja",
    terms: ["vaalit", "vaalikone", "ehdokas", "äänestä", "kampanja", "aluevaalit", "kuntavaalit", "vaalirahoitus"]
  },
  {
    key: "avoimuus",
    label: "Avoimuus, data ja tiedolla johtaminen",
    terms: ["avoimuus", "läpinäky", "tietojohtaminen", "data", "mittari", "valmistelu", "pöytäkirja", "sidonnaisuus"]
  },
  {
    key: "hyvinvointialue",
    label: "Hyvinvointialue ja sote",
    terms: ["hyvinvointialue", "pohde", "aluevaltuusto", "sote", "terveyspalvel", "perhepalvel", "lasten ja nuorten"]
  },
  {
    key: "liikenne",
    label: "Liikenne ja kaupunkirakenne",
    terms: ["liikenne", "joukkoliikenne", "pyöräily", "pysäköinti", "uimahalli", "kaavoitus", "asemakaava", "rakentaminen"]
  }
];

const CURATED_EXISTING_MATCHES = [
  {
    file: "src/publications/keskustakampus-on-uhka-ict-sektorin-tulevaisuudelle.md",
    terms: [
      "mielipidekirjoitus sanomalehti kaleva 10.2.2022",
      "raksilan yliopistokiinteistöä koskevat suunnitelmat uhkaavat alueemme ict-sektorin tulevaisuutta",
      "kymmenen tst:n tutkimusyksiköiden johtajina toimivaa professoria"
    ]
  },
  {
    file: "src/publications/paattajalta-keskustakampuksen-lammikossa-uiva-musta-joutsen-uhkaa-alueemme-ict-sektoria.md",
    terms: [
      "paikallislehti rantapohja julkaisi tänään kolumnini",
      "alueemme ict-sektorin kovia vientilukuja",
      "keskustakampuksen lammikossa uiva musta joutsen"
    ]
  },
  {
    file: "src/publications/puhe-kaikkien-kampus-mielenosoitus-2022.md",
    terms: [
      "puhe kaikkien kampus mielenosoituksessa",
      "keskustakampushanketta on ajettu kuin käärmettä pyssyyn",
      "peli on syytä viheltää poikki ja luopua raksilan suunnitelmista"
    ]
  },
  {
    file: "src/blog/opiskelijoiden-kysely-kertoi-miksi-keskustakampus-heratti-vastustusta.md",
    terms: [
      "uusin opiskelijoiden kysely keskustakampuksesta",
      "kaski ry järjesti viime viikolla kyselyn",
      "yli 80% opiskelijoista kokee yliopiston tiedottaneen keskustakampushankkeesta"
    ]
  },
  {
    file: "src/blog/raksilasta-ja-kampuksesta-2019-2022.md",
    terms: [
      "raksilasta ja kampuksesta 2019-2022",
      "asia ei ole uusi vaan käsittely on vellonut jo vuosikaudet",
      "vähintä mitä voimme tehdä on viheltää peli poikki ja antaa suunnitelmille aikalisä"
    ]
  },
  {
    file: "src/blog/normaalikoulun-tilapaatos-palautti-kampuskeskustelun-raiteilleen.md",
    terms: [
      "oulun normaalikoulu saa vihdoin nykyaikaiset ja terveelliset tilat",
      "uudishanke sijoittuu opettajia kouluttavan kasvatustieteiden ja psykologian tiedekunnan läheisyyteen",
      "keskustakampusharhailu katkaisi hyvällä alulla olleet tilasuunnitelmat"
    ]
  },
  {
    file: "src/blog/normaalikoulun-tilaratkaisu-alkoi-vihdoin-edeta.md",
    terms: [
      "oulun yliopiston hallitus on vihdoin päättänyt ratkaista oulun normaalikoulun tila-asiat",
      "osa koulusta siirtyy jo ensi syksynä tilaelementtiin",
      "keskustakampuskokonaisuuteen liittynyt normaalikoulun tilaseikkailu vei mustaan aukkoon"
    ]
  },
  {
    file: "src/publications/kysyin-keskustakampusseminaarissa-tst-tiedekunnan-siirron-perusteita.md",
    terms: [
      "keskustakampusseminaari 31.1.2022",
      "miksi yliopisto pakottaa tieto- ja sähkötekniikan tiedekunnan tutkijat ja opiskelijat pois linnanmaalta",
      "tutkimus on kuitenkin yliopiston päätehtävä"
    ]
  },
  {
    file: "src/publications/kysymykset-linnanmaan-kampuksen-sisailmasta-ja-teuvo-pakkalan-kadun-liikenteesta.md",
    terms: [
      "avoin keskustelutilaisuus linnanmaasta ja raksilasta",
      "ovatko linnanmaan tilat terveysturvalliset",
      "teuvo pakkalankadun vetokyky kampushankkeen toteutuessa"
    ]
  },
  {
    file: "src/publications/puheenvuoro-valtuustossa-raksilan-kampushanke-on-kuin-liian-lyhyt-peitto.md",
    terms: [
      "1. puheenvuoroni kaupunginvaltuuston kokouksessa",
      "raksilan kampushanketta sopii kuvaamaan liian lyhyt peitto",
      "siksi kannatan mikko viitasen esittämää pontta"
    ]
  },
  {
    file: "src/blog/valtuutettujen-vetoomus-toi-keskustakampuksen-valtuuston-kasiteltavaksi.md",
    terms: [
      "vuoden viimeisen valtuuston kokouksen yhteydessä keräsimme nopeasti 25 valtuutetun vetoomuksen",
      "tuoda keskustakampuksen hankesuunnitelma valtuuston käsittelyyn",
      "on hyvä, että näin merkittävää asiaa käsitellään myös julkisessa valtuuston kokouksessa"
    ]
  },
  {
    file: "src/blog/raksilan-vesiliikuntakeskus-on-osa-laajempaa-kaupunkirakennetta.md",
    terms: [
      "sekä kaleva että munoulu uutisoivat 5.2.2025 raksilan vesiliikuntakeskuksen suunnitelmista",
      "asemakaava ja tonttijako 564-2577",
      "yhdyskuntalautakunnan esityslistamateriaalien joukossa on paljon kiinnostavia aiheita"
    ]
  },
  {
    file: "src/blog/palveluverkko-2023-reunaehtojen-tarkastelua.md",
    terms: [
      "sosiaalisen median eri kanavissa eteeni tupsahti tällä viikolla karttasommitelma",
      "palveluverkko tai kouluverkko, kutsutaan sitä sitten millä nimellä hyvänsä",
      "tein taas muutaman visualisoinnin iltapuhteiksi koskien kouluverkkoasiaa"
    ]
  },
  {
    file: "src/blog/tilasto-ei-riita-jos-rajaukset-eivat-nay.md",
    terms: [
      "tilasto ja tilasto - mistä numerot tulevat",
      "oulu on suomen viidenneksi suurin matkailualue",
      "jos matkailua käsittelevästä tutkimuksesta puuttuu merkittävä osa maamme keskeisistä matkailualueista"
    ]
  }
];

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--input" || argv[i] === "-i") {
      args.input = argv[i + 1] || DEFAULT_INPUT;
      i += 1;
    }
  }
  return args;
}

function listFiles(dir, matcher = () => true) {
  const absolute = path.resolve(ROOT, dir);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(absolute, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath, matcher);
    if (entry.isFile() && matcher(entryPath)) return [entryPath];
    return [];
  });
}

function parseFrontMatter(raw) {
  if (!raw.startsWith("---\n")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 4);
  if (end === -1) return { data: {}, body: raw };

  const frontMatter = raw.slice(4, end).split("\n");
  const body = raw.slice(end + 4).trim();
  const data = {};
  let currentKey = "";

  for (const line of frontMatter) {
    const keyValue = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (keyValue) {
      currentKey = keyValue[1];
      const value = keyValue[2].trim();
      if (!value) {
        data[currentKey] = [];
      } else {
        data[currentKey] = unquote(value);
      }
      continue;
    }

    const listValue = line.match(/^\s*-\s*(.*)$/);
    if (listValue && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(unquote(listValue[1].trim()));
    }
  }

  return { data, body };
}

function unquote(value) {
  return value.replace(/^['"]|['"]$/g, "");
}

function extractDraftText(body) {
  const marker = "## Työstettävä blogiteksti";
  const sourceMarker = "## Alkuperäinen lähde";
  const start = body.indexOf(marker);
  const afterStart = start >= 0 ? body.slice(start + marker.length) : body;
  const end = afterStart.indexOf(sourceMarker);
  return (end >= 0 ? afterStart.slice(0, end) : afterStart)
    .replace(/^>\s.*$/gm, "")
    .replace(/^#+\s*/gm, "")
    .trim();
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .trim();
}

function isGenericTitle(title) {
  return GENERIC_TITLE_PATTERNS.some((pattern) => pattern.test(title || ""));
}

function suggestTitle(title, text) {
  if (!isGenericTitle(title)) return cleanText(title).slice(0, 120);

  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => cleanText(line).replace(/^[-–•]\s*/, ""))
    .filter(Boolean)
    .filter((line) => !/^https?:\/\//i.test(line))
    .filter((line) => !/^facebook-julkaisu/i.test(line));

  const firstSentence = cleanText(text).split(/(?<=[.!?])\s+/)[0] || "";
  if (firstSentence.length >= 28) return firstSentence.slice(0, 105).replace(/[,:;.!?]$/, "");

  const heading = lines.find((line) => line.length >= 18 && line.length <= 105);
  if (heading) return heading.replace(/[,:;.!?]$/, "");

  return cleanText(title).slice(0, 105).replace(/[,:;.!?]$/, "");
}

function detectThemes(text) {
  const normalized = normalizeText(text);
  return CONTENT_THEMES
    .map((theme) => ({
      ...theme,
      hits: theme.terms.filter((term) => normalized.includes(normalizeText(term)))
    }))
    .filter((theme) => theme.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length)
    .map((theme) => theme.label);
}

function detectFormat(title, text) {
  const lowered = `${title}\n${text}`.toLowerCase();
  if (/lisäsi videon|youtube|youtu\.be|video|tallenne/.test(lowered)) return "video/linkki";
  if (/lisäsi .*kuvan|kuva:|valokuva|album/.test(lowered)) return "kuva/nosto";
  if (/jakoi linkin|https?:\/\//.test(lowered)) return "linkkijako";
  if (/jakoi julkaisun/.test(lowered)) return "jaettu julkaisu";
  return "oma teksti";
}

function isBlogArticleCandidate(item) {
  if (item.duplicateOf || item.existingMatch) return false;
  if (item.length < 650) return false;
  if (item.format === "kuva/nosto" && item.length < 1200) return false;

  const articleThemes = [
    "Kampus, Raksila ja Linnanmaa",
    "Palveluverkko ja kaupunginosat",
    "Avoimuus, data ja tiedolla johtaminen",
    "Sivistyslautakunta ja koulutuspolitiikka",
    "Hyvinvointialue ja sote",
    "Liikenne ja kaupunkirakenne"
  ];

  return item.themes.some((theme) => articleThemes.includes(theme));
}

function actionFor(item) {
  if (item.duplicateOf) return "yhdistä duplikaattiin";
  if (item.existingMatch) return "yhdistä olemassa olevaan sivuun";
  if (isBlogArticleCandidate(item)) return "julkaise blogiartikkelina";
  if (item.themes.includes("Vaalit ja kampanja")) return "siirrä vaaliarkistoon";
  if (item.length < 300 && item.format !== "oma teksti") return "jätä taustadokumentiksi";
  if (item.themes.includes("Kampus, Raksila ja Linnanmaa")) return "tiivistä aihepolun nostoihin";
  if (item.themes.includes("Palveluverkko ja kaupunginosat")) return "tiivistä aihepolun nostoihin";
  if (item.themes.includes("Sivistyslautakunta ja koulutuspolitiikka")) return "liitä vaalikausi- tai kokouskontekstiin";
  if (item.length >= 900) return "arvioi blogiksi";
  return "säilytä migraatioaineistossa";
}

function priorityFor(item) {
  let score = 0;
  if (item.length >= 1800) score += 3;
  else if (item.length >= 900) score += 2;
  else if (item.length >= 300) score += 1;
  if (item.themes.includes("Kampus, Raksila ja Linnanmaa")) score += 3;
  if (item.themes.includes("Palveluverkko ja kaupunginosat")) score += 3;
  if (item.themes.includes("Avoimuus, data ja tiedolla johtaminen")) score += 2;
  if (item.themes.includes("Sivistyslautakunta ja koulutuspolitiikka")) score += 2;
  if (item.themes.includes("Vaalit ja kampanja")) score -= 1;
  if (item.genericTitle) score -= 1;
  if (item.duplicateOf) score -= 4;
  if (item.existingMatch) score -= 2;
  if (score >= 6) return "korkea";
  if (score >= 3) return "keskitaso";
  return "matala";
}

function loadExistingContent() {
  const files = [
    ...listFiles("src", (file) => /\.(md|njk)$/i.test(file)),
    ...listFiles("content", (file) => /\.(md|njk)$/i.test(file))
  ]
    .filter((file) => !file.includes("/_drafts/"))
    .filter((file) => !file.includes("/_site/"));

  return files.map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = parseFrontMatter(raw);
    const text = normalizeText(`${parsed.data.title || ""} ${parsed.data.description || ""} ${parsed.body}`);
    return { file: path.relative(ROOT, file), text };
  });
}

function findExistingMatch(text, existing) {
  const normalized = normalizeText(text);
  if (normalized.length < 180) return "";
  const curatedMatch = CURATED_EXISTING_MATCHES.find((entry) =>
    entry.terms.every((term) => normalized.includes(normalizeText(term)))
  );
  if (curatedMatch) return curatedMatch.file;

  const needle = normalized.slice(0, 180);
  const match = existing.find((entry) => entry.text.includes(needle));
  return match?.file || "";
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function writeReports(items, summaries) {
  fs.mkdirSync(path.resolve(ROOT, "reports"), { recursive: true });
  fs.writeFileSync(path.resolve(ROOT, REPORT_JSON), `${JSON.stringify({ generatedAt: new Date().toISOString(), summaries, items }, null, 2)}\n`);

  const csvRows = [
    ["date", "priority", "action", "format", "title", "suggestedTitle", "themes", "length", "duplicateOf", "existingMatch", "file"],
    ...items.map((item) => [
      item.date,
      item.priority,
      item.action,
      item.format,
      item.title,
      item.suggestedTitle,
      item.themes.join("; "),
      item.length,
      item.duplicateOf,
      item.existingMatch,
      item.file
    ])
  ];
  fs.writeFileSync(path.resolve(ROOT, REPORT_CSV), `${csvRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`);

  const highPriority = items.filter((item) => item.priority === "korkea" && !item.duplicateOf).slice(0, 30);
  const blogCandidates = items.filter((item) => item.action === "julkaise blogiartikkelina").slice(0, 30);
  const actions = Object.entries(summaries.actions)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `- ${name}: ${count}`)
    .join("\n");
  const themes = Object.entries(summaries.themes)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `- ${name}: ${count}`)
    .join("\n");

  const md = `# Facebook-poliitikkosivun migraatioaudit

Luotu: ${new Date().toISOString()}

## Yhteenveto

- Draftit yhteensä: ${items.length}
- Korkean prioriteetin kuratointiehdokkaita: ${items.filter((item) => item.priority === "korkea" && !item.duplicateOf).length}
- Blogiartikkeliksi nostettavia: ${items.filter((item) => item.action === "julkaise blogiartikkelina").length}
- Duplikaatteja tai saman tekstin toistoja: ${items.filter((item) => item.duplicateOf).length}
- Olemassa olevaan sivuun osuvia tekstikatkelmia: ${items.filter((item) => item.existingMatch).length}
- Geneerisen Facebook-otsikon sisältäviä: ${items.filter((item) => item.genericTitle).length}

## Suositellut toimenpiteet

${actions}

## Keskeiset teemat

${themes}

## Ensimmäiset blogiartikkeliehdokkaat

| Pvm | Ehdotettu otsikko | Teemat | Tiedosto |
| --- | --- | --- | --- |
${blogCandidates.map((item) => `| ${item.date} | ${item.suggestedTitle.replace(/\|/g, "\\|")} | ${item.themes.join(", ").replace(/\|/g, "\\|")} | \`${item.file}\` |`).join("\n")}

## Muut korkean prioriteetin kuratointiehdokkaat

| Pvm | Suositus | Ehdotettu otsikko | Teemat | Tiedosto |
| --- | --- | --- | --- | --- |
${highPriority.map((item) => `| ${item.date} | ${item.action} | ${item.suggestedTitle.replace(/\|/g, "\\|")} | ${item.themes.join(", ").replace(/\|/g, "\\|")} | \`${item.file}\` |`).join("\n")}

## Huomio

Tämä raportti ei vielä julkaise mitään automaattisesti. Se tekee raakatuonnista hallittavan työlistan: ensin nostetaan vahvimmat tekstit blogiartikkeleiksi, sitten tiivistetään kevyemmät päivitykset aihepolkujen tueksi, yhdistetään duplikaatit ja lopuksi päätetään, mitkä jäävät vain paikalliseksi migraatioaineistoksi.
`;
  fs.writeFileSync(path.resolve(ROOT, REPORT_MD), md);
}

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function main() {
  const args = parseArgs(process.argv);
  const files = listFiles(args.input, (file) => file.endsWith(".md")).sort();
  const existing = loadExistingContent();
  const seen = new Map();

  const items = files.map((absoluteFile) => {
    const raw = fs.readFileSync(absoluteFile, "utf8");
    const { data, body } = parseFrontMatter(raw);
    const text = extractDraftText(body);
    const normalized = normalizeText(text);
    const dedupeKey = `${data.date || ""}::${normalized.slice(0, 360)}`;
    const duplicateOf = seen.get(dedupeKey) || "";
    if (!duplicateOf) seen.set(dedupeKey, path.relative(ROOT, absoluteFile));

    const title = String(data.title || path.basename(absoluteFile, ".md"));
    const item = {
      file: path.relative(ROOT, absoluteFile),
      date: String(data.date || ""),
      title,
      suggestedTitle: suggestTitle(title, text),
      genericTitle: isGenericTitle(title),
      format: detectFormat(title, text),
      themes: detectThemes(text),
      length: cleanText(text).length,
      duplicateOf,
      existingMatch: findExistingMatch(text, existing)
    };
    item.action = actionFor(item);
    item.priority = priorityFor(item);
    return item;
  }).sort((a, b) => {
    const priorityOrder = { korkea: 0, keskitaso: 1, matala: 2 };
    return (priorityOrder[a.priority] - priorityOrder[b.priority]) || b.date.localeCompare(a.date);
  });

  const summaries = {
    actions: {},
    themes: {},
    formats: {},
    years: {}
  };

  for (const item of items) {
    increment(summaries.actions, item.action);
    increment(summaries.formats, item.format);
    increment(summaries.years, item.date.slice(0, 4) || "tuntematon");
    for (const theme of item.themes.length ? item.themes : ["ei teemaa"]) {
      increment(summaries.themes, theme);
    }
  }

  writeReports(items, summaries);
  console.log(`Facebook migration audit: ${items.length} drafts`);
  console.log(`Reports: ${REPORT_MD}, ${REPORT_CSV}, ${REPORT_JSON}`);
}

main();
