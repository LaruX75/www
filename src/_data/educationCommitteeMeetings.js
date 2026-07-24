const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const committeeMeta = require("./educationCommitteeMeetingMeta");
const officialMeetingData = require("./educationCommitteeOfficialMeetings.json");

const ROOT = path.join(__dirname, "..", "..");
const SOURCE_DIRECTORIES = ["blog", "publications", "politics", "media"];

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateOnly(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function dateSlug(value) {
  const date = dateOnly(value);
  return date ? date.replace(/-/g, "/") : "";
}

function normalizePermalink(value) {
  if (!value) return "";
  const permalink = String(value);
  if (permalink === "false") return "";
  return permalink.startsWith("/") ? permalink : `/${permalink}`;
}

function itemUrl(filePath, data = {}) {
  const permalink = normalizePermalink(data.permalink);
  if (permalink) return permalink;

  const slug = dateSlug(data.date);
  if (!slug) return "";
  const basename = path.basename(filePath, path.extname(filePath));
  return `/${slug}/${basename}/`;
}

function readDirectory(directory) {
  const fullDirectory = path.join(ROOT, "src", directory);
  if (!fs.existsSync(fullDirectory)) return [];

  return fs.readdirSync(fullDirectory)
    .filter((entry) => entry.endsWith(".md") || entry.endsWith(".njk"))
    .map((entry) => {
      const inputPath = path.join(fullDirectory, entry);
      const parsed = matter(fs.readFileSync(inputPath, "utf8"));
      return {
        inputPath,
        url: itemUrl(inputPath, parsed.data),
        date: parsed.data.date || null,
        data: parsed.data
      };
    })
    .filter((item) => item.url && item.data?.title);
}

function allItems() {
  return SOURCE_DIRECTORIES.flatMap(readDirectory);
}

function isCommitteeRelated(data = {}) {
  const haystack = [
    data.politicalBody,
    data.meeting,
    data.forum,
    data.tags,
    data.categories,
    data.keywords,
    data.contexts,
    data.contentContexts,
    data.entities
  ].flatMap(toArray).join(" ");
  const normalized = normalize(haystack);
  return normalized.includes("sivistyslautakunta")
    || normalized.includes("sivistys-ja-kulttuurilautakunta")
    || normalized.includes("siku");
}

function bodyFor(data = {}, ref = {}) {
  const explicit = normalize(ref.body || data.politicalBody || data.meeting || "");
  if (explicit.includes("sivistys-ja-kulttuurilautakunta") || explicit === "siku") return "sivistys-ja-kulttuurilautakunta";
  if (explicit.includes("sivistyslautakunta")) return "sivistyslautakunta";
  const itemDate = dateOnly(ref.date || data.committeeMeetingDate || data.date);
  return itemDate && itemDate >= "2023-01-01" ? "sivistyslautakunta" : "sivistys-ja-kulttuurilautakunta";
}

function meetingRefsForItem(item) {
  const data = item.data || {};
  if (Array.isArray(data.committeeMeetings) && data.committeeMeetings.length) {
    return data.committeeMeetings
      .map((ref) => ({ ...ref, date: dateOnly(ref.date) }))
      .filter((ref) => ref.date);
  }

  const meetingDate = dateOnly(data.committeeMeetingDate);
  if (meetingDate) {
    return [{
      date: meetingDate,
      body: data.politicalBody || data.meeting || "",
      activityType: data.activityType || "",
      agendaTitle: data.agenda_title || data.agendaTitle || "",
      protocolUrl: data.protocolUrl || ""
    }];
  }

  return [];
}

function typeLabel(data = {}) {
  if (data.activityType === "muutosesitys") return "Muutosesitys";
  if (data.type === "mielipide") return "Mielipidekirjoitus";
  if (data.type === "artikkeli" || data.source === "facebook") return "Blogiartikkeli";
  if (toArray(data.forum).map(normalize).includes("lautakunta")) return "Lautakuntasisältö";
  return data.type || "Sisältö";
}

function activityLabel(item = {}, ref = {}) {
  const data = item.data || {};
  const type = ref.activityType || data.activityType || "";
  const labels = {
    muutosesitys: "muutosesitys",
    kokousanalyysi: "kokousanalyysi",
    kokousennakko: "kokousennakko",
    kannanotto: "kannanotto",
    tausta: "tausta"
  };
  return labels[type] || typeLabel(data).toLowerCase();
}

function buildItemView(item, ref) {
  const data = item.data || {};
  return {
    url: item.url,
    title: data.title || "",
    date: dateOnly(data.date),
    typeLabel: typeLabel(data),
    activityLabel: activityLabel(item, ref),
    agendaTitle: ref.agendaTitle || data.agenda_title || data.agendaTitle || "",
    description: data.description || data.politicsWritingSummary || "",
    sourceLabel: data.sourceLabel || data.publication || "",
    protocolUrl: ref.protocolUrl || data.protocolUrl || ""
  };
}

function meetingLabel(date, meta = {}) {
  if (meta.meetingNumber) return `Kokous ${meta.meetingNumber}`;
  return `Kokous ${date.split("-").reverse().join(".")}`;
}

function formatAgendaItem(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  const section = item.section ? `§ ${item.section}` : "";
  return [section, item.title].filter(Boolean).join(" ");
}

const ROUTINE_AGENDA_PATTERNS = [
  /tiedoksi annettavat infoasiat/i,
  /tiedoksi annettavat infot/i,
  /infot .*lautakunnalle/i,
  /nuorisovaltuust.*terveiset/i,
  /tiedoksi annettavat otto-oikeus/i,
  /kokouksen laillisuus/i,
  /pöytäkirjan tarkast/i,
  /pöytäkirjantarkast/i,
  /työjärjestyksen hyväks/i,
  /^muut asiat/i,
  /viranhaltijapäät/i,
  /salassapidettävä/i
];

function cleanAgendaTitle(item = "") {
  const title = typeof item === "string" ? item : item.title;
  return String(title || "")
    .replace(/^§\s*\d+\s*/, "")
    .replace(/\u0080/g, "€")
    .replace(/[\u0096\u0097]/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

function isRoutineAgendaTitle(title = "") {
  return ROUTINE_AGENDA_PATTERNS.some((pattern) => pattern.test(title));
}

function joinFinnishList(items = []) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} sekä ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} sekä ${items[items.length - 1]}`;
}

function compactRepeatedAgendaTitles(titles = []) {
  const compacted = [];
  let serviceNetworkAdded = false;
  const serviceNetworkTitles = titles
    .filter((title) => /^Palveluverkkoa koskeva päätös:/i.test(title))
    .map((title) => title.replace(/^Palveluverkkoa koskeva päätös:\s*/i, "").trim())
    .filter(Boolean);

  titles.forEach((title) => {
    if (/^Palveluverkkoa koskeva päätös:/i.test(title)) {
      if (!serviceNetworkAdded) {
        const schools = serviceNetworkTitles.slice(0, 5);
        const suffix = serviceNetworkTitles.length > schools.length ? " ja muita kohteita" : "";
        compacted.push(`Palveluverkkoa koskevat päätökset: ${joinFinnishList(schools)}${suffix}`);
        serviceNetworkAdded = true;
      }
      return;
    }

    compacted.push(title);
  });

  return compacted;
}

function pykalaCountSentence(count = 0) {
  if (!count) return "";
  return count === 1
    ? "Pöytäkirjassa oli 1 pykälä."
    : `Pöytäkirjassa oli kaikkiaan ${count} pykälää.`;
}

function contextualAgendaSummary(agendaItems = [], agendaCount = 0) {
  const highlights = compactRepeatedAgendaTitles(agendaItems
    .map(cleanAgendaTitle)
    .filter((title) => title && !isRoutineAgendaTitle(title)))
    .slice(0, 4);

  const count = agendaCount || agendaItems.length;
  if (!highlights.length) {
    return count
      ? `${pykalaCountSentence(count)} Julkisesti näkyvät otsikot eivät avaa kokouksen sisältöä tarkemmin.`
      : "";
  }

  const lead = highlights.length > 2
    ? "Kokouksen asioita olivat muun muassa"
    : "Kokouksen asioita olivat";
  const countSentence = count ? ` ${pykalaCountSentence(count)}` : "";

  return `${lead} ${joinFinnishList(highlights)}.${countSentence}`;
}

function sourceLabelFor(official = {}, meta = {}) {
  if (meta.agendaSourceLabel) return meta.agendaSourceLabel;
  if (official.meetingNumber) return `Oukan pöytäkirja ${official.meetingNumber}`;
  return official.protocolUrl ? "Oukan pöytäkirja" : "";
}

function buildMeetingShell({ date, bodyKey, meta = {}, ref = {}, official = {} }) {
  const body = committeeMeta.bodies[bodyKey] || committeeMeta.bodies.sivistyslautakunta;
  const agendaItems = meta.agendaItems
    ? toArray(meta.agendaItems)
    : toArray(official.agendaItems).map(formatAgendaItem).filter(Boolean);
  const agendaCount = official.agendaItems ? official.agendaItems.length : agendaItems.length;

  return {
    key: `${bodyKey}:${date}`,
    date,
    meetingDate: date,
    bodyKey,
    bodyName: body.name,
    bodyShortName: body.shortName,
    bodyPeriod: body.periodLabel,
    bodyUrl: body.url,
    meetingNumber: meta.meetingNumber || official.meetingNumber || "",
    meetingTime: official.time || "",
    meetingLabel: meetingLabel(date, { meetingNumber: meta.meetingNumber || official.meetingNumber }),
    summaryTitle: meta.summaryTitle || "",
    protocolUrl: meta.protocolUrl || ref.protocolUrl || official.protocolUrl || "",
    agendaSourceLabel: sourceLabelFor(official, meta),
    agendaSummary: meta.agendaSummary || contextualAgendaSummary(agendaItems, agendaCount),
    agendaItems,
    officialAgendaCount: agendaCount,
    hasOfficialMeeting: Boolean(official.protocolUrl),
    items: []
  };
}

function buildMeetings() {
  const meetings = new Map();

  toArray(officialMeetingData.meetings).forEach((official) => {
    const date = dateOnly(official.date);
    if (!date) return;
    const meta = committeeMeta.byDate[date] || {};
    const bodyKey = meta.body || official.bodyKey || "sivistyslautakunta";
    const shell = buildMeetingShell({ date, bodyKey, meta, official });
    meetings.set(shell.key, shell);
  });

  allItems().forEach((item) => {
    meetingRefsForItem(item).forEach((ref) => {
      const date = ref.date;
      const meta = committeeMeta.byDate[date] || {};
      const bodyKey = meta.body || bodyFor(item.data, ref);
      const key = `${bodyKey}:${date}`;

      if (!meetings.has(key)) {
        meetings.set(key, buildMeetingShell({ date, bodyKey, meta, ref }));
      }

      const meeting = meetings.get(key);
      const itemView = buildItemView(item, ref);
      meeting.items.push(itemView);
      if (!meeting.protocolUrl && itemView.protocolUrl) meeting.protocolUrl = itemView.protocolUrl;
    });
  });

  return [...meetings.values()]
    .map((meeting) => {
      const seen = new Set();
      meeting.items = meeting.items
        .filter((item) => {
          const key = `${item.url}:${item.title}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => a.title.localeCompare(b.title, "fi"));

      const activityTypes = new Set(meeting.items.map((item) => item.activityLabel).filter(Boolean));
      meeting.counts = {
        items: meeting.items.length,
        activityTypes: activityTypes.size,
        agendaItems: meeting.officialAgendaCount || meeting.agendaItems.length
      };
      meeting.activityLead = meeting.items.length
        ? `Kokoukseen liittyy ${meeting.items.length} sivustolla julkaistua sisältöä: ${[...activityTypes].join(", ")}.`
        : "";
      return meeting;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = buildMeetings;

module.exports.standaloneCommitteeItems = function standaloneCommitteeItems() {
  return allItems()
    .filter((item) => isCommitteeRelated(item.data))
    .filter((item) => !meetingRefsForItem(item).length)
    .filter((item) => Boolean(item.data?.committeeRelated))
    .map((item) => {
      const data = item.data || {};
      return {
        ...buildItemView(item, {}),
        bodyKey: bodyFor(data, {}),
        committeeRelated: Boolean(data.committeeRelated),
        date: dateOnly(data.date),
        seasonDate: dateOnly(data.date),
        seasonLabel: data.committeeContextLabel || data.forum || "",
        description: data.description || data.politicsWritingSummary || ""
      };
    })
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
};
