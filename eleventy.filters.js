const fs = require("fs");
const path = require("path");
const Image = require("@11ty/eleventy-img");
const {
  getContextMeta,
  resolveContexts
} = require("./src/_data/contentContext");
const councilMeetingMeta = require("./src/_data/councilMeetingMeta");
const councilMeetingAgendas = require("./src/_data/councilMeetingAgendas.json");
const oukaCouncilSpeechProtocols = require("./src/_data/oukaCouncilSpeechProtocols");
const councilMeetingYoutubeVideos = require("./src/_data/councilMeetingYoutubeVideos.json");
const councilSpeechVideos = require("./src/_data/councilSpeechVideos.json");

function getLangFromUrl(url) {
  return String(url || "").startsWith("/en/") ? "en" : "fi";
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function normalizeTerm(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTopicTerm(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeTerms(values) {
  return new Set(toArray(values).map(normalizeTerm).filter(Boolean));
}

function uniqueContentItems(collections) {
  const sources = [
    ...(collections?.blog || []),
    ...(collections?.publications || []),
    ...(collections?.politics || []),
    ...(collections?.media || []),
    ...(collections?.presentations || [])
  ];
  const seen = new Set();
  return sources.filter((item) => {
    const url = contentItemUrl(item);
    if (!item || !url || !item.data?.title || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function contentItemUrl(item) {
  return item?.url || item?.data?.page?.url || item?.data?.permalink || "";
}

function intersectionCount(values, wanted) {
  return toArray(values).reduce((count, value) => (
    wanted.has(normalizeTerm(value)) ? count + 1 : count
  ), 0);
}

function contentTypeLabel(data = {}, tags = [], lang = "fi") {
  const tagSet = new Set(toArray(tags));
  const contexts = normalizeTerms(data.contexts || []);
  const keywords = normalizeTerms(data.keywords || []);
  const type = data.type || "";
  const speechContext = String(data.speechContext || "").trim();
  if (data.mediaType === "video") return lang === "en" ? "Video" : "Video";
  if (data.mediaType === "podcast") return lang === "en" ? "Podcast" : "Podcast";
  if (data.mediaType === "radio") return lang === "en" ? "Radio" : "Radio";
  if (data.mediaType === "article") return lang === "en" ? "Media article" : "Lehtijuttu";
  if (type === "esitys" || tagSet.has("presentations")) return lang === "en" ? "Presentation" : "Esitys";
  if (type === "lausunto") return lang === "en" ? "Expert statement" : "Asiantuntijalausunto";
  if (data.agenda_title === "Valtuuston kyselytunti" || contexts.has("valtuuston kyselytunti") || keywords.has("valtuustokysely") || speechContext === "kyselytunti") return lang === "en" ? "Council question hour" : "Valtuuston kyselytunti";
  if (type === "puhe") {
    if (speechContext === "valtuusto") return lang === "en" ? "Council speech" : "Valtuustopuheenvuoro";
    if (speechContext === "akateeminen-puhe") return lang === "en" ? "Academic speech" : "Akateeminen puhe";
    if (speechContext === "juhlapuhe") return lang === "en" ? "Ceremonial speech" : "Juhlapuhe";
    if (speechContext === "julkinen-tilaisuus") return lang === "en" ? "Public speech" : "Julkinen puhe";
    return lang === "en" ? "Speech" : "Puhe";
  }
  if (type === "mielipide") return lang === "en" ? "Opinion" : "Mielipide";
  if (type === "kolumni") return lang === "en" ? "Column" : "Kolumni";
  if (tagSet.has("politics")) return lang === "en" ? "Council initiative" : "Valtuustoaloite";
  if (tagSet.has("blog")) return lang === "en" ? "Blog post" : "Blogikirjoitus";
  return lang === "en" ? "Text" : "Kirjoitus";
}

function dateOnlyFromValue(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0")
  ].join("-");
}

function councilOverrideForItem(item) {
  const data = item?.data || {};
  const url = contentItemUrl(item);
  return oukaCouncilSpeechProtocols.overrides?.[url]
    || oukaCouncilSpeechProtocols.overrides?.[data.source_url]
    || {};
}

function councilMeetingDateForItem(item) {
  const data = item?.data || {};
  const override = councilOverrideForItem(item);
  return dateOnlyFromValue(data.meetingDate || override.meetingDate || data.meeting_date || item?.date || data.date);
}

function isCouncilMeetingItem(item) {
  const data = item?.data || {};
  const tags = toArray(data.tags).map(normalizeTerm);
  const forums = toArray(data.forum).map(normalizeTerm);
  const contexts = toArray(data.contexts).map(normalizeTerm);
  const meetingText = [
    data.meeting,
    data.event,
    data.agenda_title,
    data.asiakohta,
    ...forums,
    ...contexts,
    ...tags
  ].join(" ").toLowerCase();

  if (meetingText.includes("kaupunginvaltuusto")) return true;
  if (meetingText.includes("valtuuston kyselytunti")) return true;
  return Boolean(data.meetingDate && tags.includes("politics"));
}

function councilMeetingLabelForItem(item, meetingDate = "") {
  const data = item?.data || {};
  const override = councilOverrideForItem(item);
  return data.meeting
    || override.meeting
    || data.event
    || override.event
    || (meetingDate ? `Oulun kaupunginvaltuusto ${meetingDate}` : "Oulun kaupunginvaltuusto");
}

function formatCouncilMeetingDateShort(meetingDate = "") {
  const match = String(meetingDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return meetingDate;
  return `${Number(match[3])}.${Number(match[2])}.${match[1]}`;
}

function councilMeetingMetaForDate(meetingDate = "") {
  return councilMeetingMeta.byDate?.[meetingDate] || {};
}

function councilMeetingTitleForDate(meetingDate = "") {
  const meta = councilMeetingMetaForDate(meetingDate);
  if (meta.title) return meta.title;
  if (meta.meetingNumber) return `Kokous ${meta.meetingNumber}`;
  if (meta.timelineTitle) return meta.timelineTitle;
  return meetingDate ? `Kokous ${formatCouncilMeetingDateShort(meetingDate)}` : "Kokous";
}

function isCouncilAnnualCycleDate(meetingDate = "") {
  const meta = councilMeetingMetaForDate(meetingDate);
  if (meta.timelineKind === "annual-cycle") return true;
  const video = councilMeetingVideoForDate(meetingDate);
  return /talousarvio/i.test(video?.title || "");
}

function councilItemTypeLabel(data = {}, lang = "fi") {
  const contexts = normalizeTerms(data.contexts);
  const tags = toArray(data.tags).map(normalizeTerm);
  const keywords = toArray(data.keywords).map(normalizeTerm);
  const speechContext = String(data.speechContext || "").trim();
  const isQuestionHour = data.agenda_title === "Valtuuston kyselytunti" || contexts.has("valtuuston kyselytunti") || speechContext === "kyselytunti";
  if (isQuestionHour) return lang === "en" ? "Council question hour" : "Valtuuston kyselytunti";
  if (data.type === "puhe") return lang === "en" ? "Council speech" : "Valtuustopuheenvuoro";
  if (data.initiative_type || tags.includes("aloitteet") || keywords.includes("valtuustoaloite")) return lang === "en" ? "Council initiative" : "Valtuustoaloite";
  if (tags.includes("politics")) return lang === "en" ? "Council initiative" : "Valtuustoaloite";
  return contentTypeLabel(data, data.tags, lang);
}

function isQuestionHourItem(data = {}) {
  const contexts = normalizeTerms(data.contexts);
  return data.agenda_title === "Valtuuston kyselytunti" || contexts.has("valtuuston kyselytunti");
}

function isInitiativeItem(data = {}) {
  const tags = toArray(data.tags).map(normalizeTerm);
  const keywords = toArray(data.keywords).map(normalizeTerm);
  return Boolean(data.initiative_type || tags.includes("aloitteet") || keywords.includes("valtuustoaloite") || tags.includes("politics"));
}

function councilItemSortKey(data = {}) {
  const agendaNumber = Number(data.agenda_item || data.agendaItem || 0);
  const typePriority = isQuestionHourItem(data)
    ? 1
    : data.type === "puhe"
      ? 2
      : isInitiativeItem(data)
        ? 3
        : 4;
  return {
    agendaNumber: Number.isFinite(agendaNumber) && agendaNumber > 0 ? agendaNumber : 999,
    typePriority,
    title: data.title || ""
  };
}

function councilVideoEntriesForItem(item) {
  const data = item?.data || {};
  const url = contentItemUrl(item);
  return [
    ...toArray(councilSpeechVideos.byUrl?.[url]),
    ...toArray(councilSpeechVideos.byUrl?.[data.source_url])
  ];
}

function councilMeetingVideoForDate(meetingDate = "") {
  return toArray(councilMeetingYoutubeVideos.byDate?.[meetingDate])[0] || null;
}

function councilMeetingAgendaForDate(meetingDate = "") {
  return councilMeetingAgendas?.[meetingDate] || { caption: "", items: [] };
}

function councilSpeechVideoUrl(video = {}) {
  const youtubeId = video.youtubeId || "";
  const baseUrl = video.url || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : "");
  const start = Number(video.start);
  if (!baseUrl) return "";
  if (!Number.isFinite(start)) return baseUrl;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}t=${Math.max(0, Math.round(start))}s`;
}

function councilMeetingItemView(item, lang = "fi") {
  const data = item?.data || {};
  const videoEntries = councilVideoEntriesForItem(item);
  const primaryVideoEntry = videoEntries.find((entry) => Number.isFinite(Number(entry.start))) || videoEntries[0] || null;
  const sort = councilItemSortKey(data);
  const itemView = {
    url: contentItemUrl(item),
    title: data.title || "",
    date: item.date || data.date || null,
    type: data.type || "",
    typeLabel: councilItemTypeLabel(data, lang),
    detailLabel: data.asiakohta || data.agenda_title || data.meeting || data.event || "",
    agendaTitle: data.agenda_title || "",
    agendaItem: data.agenda_item || data.agendaItem || "",
    meetingDate: councilMeetingDateForItem(item),
    hasAgenda: Boolean(data.asiakohta || data.agenda_title || data.agenda_item || data.agendaItem),
    hasVideo: videoEntries.length > 0,
    videoStart: primaryVideoEntry && Number.isFinite(Number(primaryVideoEntry.start)) ? primaryVideoEntry.start : null,
    videoUrl: primaryVideoEntry ? councilSpeechVideoUrl(primaryVideoEntry) : "",
    sort
  };

  const missingMetadata = [];
  if (!itemView.hasAgenda && (data.type === "puhe" || isQuestionHourItem(data))) missingMetadata.push("asiakohta");
  if (data.type === "puhe" && !itemView.hasVideo) missingMetadata.push("video");
  itemView.missingMetadata = missingMetadata;
  return itemView;
}

function cleanCouncilAgendaLabel(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^asiakohta\s+/i, "")
    .replace(/^§\s*\d+[a-z]?\s*[–:-]\s*/i, "")
    .replace(/^\d+\s*§\s*[–:-]?\s*/i, "")
    .replace(/^\d+\s*[–:-]\s*/i, "")
    .trim();
}

function uniqueLabels(values = []) {
  const seen = new Set();
  return toArray(values)
    .map(cleanCouncilAgendaLabel)
    .filter(Boolean)
    .filter((value) => {
      const normalized = normalizeTerm(value);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function formatCouncilAgendaItem(item = {}) {
  const title = cleanCouncilAgendaLabel(item.title || "");
  const section = String(item.section || "").trim();
  if (!title) return "";
  return section ? `§ ${section} ${title}` : title;
}

function formatLocalizedList(values = [], lang = "fi") {
  const items = toArray(values);
  if (items.length <= 1) return items[0] || "";
  const conjunction = lang === "en" ? "and" : "ja";
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;
}

function buildCouncilMeetingHeroSummary(meeting = {}, lang = "fi") {
  const isEnglish = lang === "en";
  const protocolAgendaTopics = uniqueLabels(toArray(meeting.agendaItems)
    .map(formatCouncilAgendaItem)
  );
  const ownAgendaTopics = uniqueLabels(meeting.items
    .map((item) => item.agendaTitle || item.detailLabel)
    .filter((label) => normalizeTerm(label) !== "valtuuston kyselytunti")
  );
  const agendaTopics = protocolAgendaTopics.length ? protocolAgendaTopics : ownAgendaTopics;
  const agendaCount = protocolAgendaTopics.length || agendaTopics.length;

  const actions = [];
  if (meeting.counts?.speeches === 1) {
    actions.push(isEnglish ? "one delivered speech" : "yksi pidetty puheenvuoro");
  } else if (meeting.counts?.speeches > 1) {
    actions.push(isEnglish ? `${meeting.counts.speeches} delivered speeches` : `${meeting.counts.speeches} pidettyä puheenvuoroa`);
  }
  if (meeting.counts?.initiatives === 1) {
    actions.push(isEnglish ? "one council initiative" : "yksi valtuustoaloite");
  } else if (meeting.counts?.initiatives > 1) {
    actions.push(isEnglish ? `${meeting.counts.initiatives} council initiatives` : `${meeting.counts.initiatives} valtuustoaloitetta`);
  }
  if (meeting.counts?.questions === 1) {
    actions.push(isEnglish ? "one council question hour question with its response" : "yksi valtuuston kyselytunnin kysymys vastauksineen");
  } else if (meeting.counts?.questions > 1) {
    actions.push(isEnglish ? `${meeting.counts.questions} council question hour questions with responses` : `${meeting.counts.questions} valtuuston kyselytunnin kysymystä vastauksineen`);
  }

  return {
    agendaLead: agendaTopics.length
      ? (isEnglish
        ? `Agenda items in the minutes (${agendaCount}): ${agendaTopics.join("; ")}.`
        : `Pöytäkirjan varsinaiset asiakohdat (${agendaCount}): ${agendaTopics.join("; ")}.`)
      : "",
    activityLead: actions.length
      ? (isEnglish
        ? `Jari Laru participated in the meeting through ${formatLocalizedList(actions, lang)}.`
        : `Jari Laru oli kokouksessa aktiivinen: ${formatLocalizedList(actions, lang)}.`)
      : "",
    agendaTopics,
    agendaCount,
    actions
  };
}

function buildCouncilMeetings(collections, lang = "fi") {
  const items = uniqueContentItems(collections).filter(isCouncilMeetingItem);
  const meetings = new Map();

  items.forEach((item) => {
    const meetingDate = councilMeetingDateForItem(item);
    if (!meetingDate) return;

    if (!meetings.has(meetingDate)) {
      const meetingVideo = councilMeetingVideoForDate(meetingDate);
      const meetingMeta = councilMeetingMetaForDate(meetingDate);
      const meetingAgenda = councilMeetingAgendaForDate(meetingDate);
      const officialLabel = councilMeetingLabelForItem(item, meetingDate);
      const meetingTitle = councilMeetingTitleForDate(meetingDate);
      meetings.set(meetingDate, {
        date: meetingDate,
        meetingDate,
        label: meetingTitle,
        meetingLabel: meetingTitle,
        officialLabel,
        contextLabel: meetingMeta.contextLabel || "Oulun kaupunginvaltuusto",
        meetingNumber: meetingMeta.meetingNumber || "",
        hasQuestionHour: Boolean(meetingMeta.hasQuestionHour),
        summaryTitle: meetingMeta.summaryTitle || "",
        protocolUrl: oukaCouncilSpeechProtocols.protocolsByDate?.[meetingDate] || meetingAgenda.protocolUrl || "",
        agendaCaption: meetingAgenda.caption || "",
        agendaItems: toArray(meetingAgenda.items),
        video: meetingVideo,
        items: [],
        speeches: [],
        initiatives: [],
        questions: [],
        otherItems: [],
        missingMetadata: []
      });
    }

    const meeting = meetings.get(meetingDate);
    const data = item.data || {};
    const itemView = councilMeetingItemView(item, lang);
    meeting.items.push(itemView);

    if (isQuestionHourItem(data)) {
      meeting.questions.push(itemView);
    } else if (data.type === "puhe") {
      meeting.speeches.push(itemView);
    } else if (isInitiativeItem(data)) {
      meeting.initiatives.push(itemView);
    } else {
      meeting.otherItems.push(itemView);
    }
  });

  const sortItems = (meetingItems) => meetingItems
    .sort((a, b) => (
      a.sort.agendaNumber - b.sort.agendaNumber
      || a.sort.typePriority - b.sort.typePriority
      || a.title.localeCompare(b.title, lang === "en" ? "en" : "fi")
    ))
    .map(({ sort, ...item }) => item);

  return [...meetings.values()]
    .map((meeting) => {
      meeting.items = sortItems(meeting.items);
      meeting.speeches = sortItems(meeting.speeches);
      meeting.initiatives = sortItems(meeting.initiatives);
      meeting.questions = sortItems(meeting.questions);
      meeting.otherItems = sortItems(meeting.otherItems);

      if (!meeting.protocolUrl) meeting.missingMetadata.push("protocol");
      if (!meeting.video) meeting.missingMetadata.push("video");
      meeting.items.forEach((item) => {
        item.missingMetadata.forEach((field) => {
          const marker = `${item.url}:${field}`;
          if (!meeting.missingMetadata.includes(marker)) meeting.missingMetadata.push(marker);
        });
      });

      meeting.counts = {
        items: meeting.items.length,
        speeches: meeting.speeches.length,
        initiatives: meeting.initiatives.length,
        questions: meeting.questions.length,
        other: meeting.otherItems.length
      };
      meeting.heroSummary = buildCouncilMeetingHeroSummary(meeting, lang);

      return meeting;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function buildCouncilMeetingTimeline(collections, lang = "fi") {
  const contentMeetings = buildCouncilMeetings(collections, lang);
  const byDate = new Map(contentMeetings.map((meeting) => [meeting.date, {
    ...meeting,
    isQuiet: false
  }]));

  Object.keys(councilMeetingYoutubeVideos.byDate || {})
    .filter((meetingDate) => meetingDate >= "2017-01-01")
    .forEach((meetingDate) => {
      if (byDate.has(meetingDate)) return;
      const meetingMeta = councilMeetingMetaForDate(meetingDate);
      const isAnnualCycle = isCouncilAnnualCycleDate(meetingDate);
      if (!meetingMeta.meetingNumber && !isAnnualCycle) return;
      byDate.set(meetingDate, {
        date: meetingDate,
        meetingDate,
        label: councilMeetingTitleForDate(meetingDate),
        meetingLabel: councilMeetingTitleForDate(meetingDate),
        officialLabel: meetingMeta.officialLabel || "Oulun kaupunginvaltuusto",
        contextLabel: meetingMeta.contextLabel || "Oulun kaupunginvaltuusto",
        meetingNumber: meetingMeta.meetingNumber || "",
        timelineKind: meetingMeta.timelineKind || (isAnnualCycle ? "annual-cycle" : ""),
        hasQuestionHour: Boolean(meetingMeta.hasQuestionHour),
        summaryTitle: meetingMeta.summaryTitle || "",
        protocolUrl: oukaCouncilSpeechProtocols.protocolsByDate?.[meetingDate] || "",
        video: councilMeetingVideoForDate(meetingDate),
        items: [],
        speeches: [],
        initiatives: [],
        questions: [],
        otherItems: [],
        missingMetadata: [],
        counts: {
          items: 0,
          speeches: 0,
          initiatives: 0,
          questions: 0,
          other: 0
        },
        isQuiet: true
      });
    });

  return [...byDate.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function sameCouncilMeetingGroup(collections, pageUrl, limit = 6, lang = "fi") {
  const meetings = buildCouncilMeetings(collections, lang);
  const meeting = meetings.find((item) => item.items.some((meetingItem) => meetingItem.url === pageUrl));
  if (!meeting) return { meetingDate: "", meetingLabel: "", protocolUrl: "", video: null, items: [] };

  const maxItems = Number(limit) || 6;
  return {
    ...meeting,
    items: meeting.items
      .filter((item) => item.url !== pageUrl)
      .slice(0, maxItems)
  };
}

function archiveTerms(items, limit = 14, source = "both") {
  const labels = new Map();
  const counts = new Map();

  toArray(items).forEach((item) => {
    const terms = source === "categories"
      ? toArray(item.data?.categories)
      : source === "keywords"
        ? toArray(item.data?.keywords)
        : [...toArray(item.data?.categories), ...toArray(item.data?.keywords)];
    terms.forEach((term) => {
      const normalized = normalizeTerm(term);
      if (!normalized) return;
      labels.set(normalized, labels.get(normalized) || term);
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([normalized, count]) => ({
      name: labels.get(normalized) || normalized,
      count,
      weight: count >= 20 ? "xl" : count >= 10 ? "lg" : count >= 5 ? "md" : "sm"
    }))
    .filter((term) => term.count > 1)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fi"))
    .slice(0, Number(limit) || 14);
}

function topicTermSet(values) {
  return new Set(toArray(values).map(normalizeTopicTerm).filter(Boolean));
}

function topicTextScore(item, topic = {}) {
  const data = item?.data || {};
  const topicTerms = [
    ...toArray(topic.categories),
    ...toArray(topic.keywords),
    topic.title
  ].map(normalizeTopicTerm).filter(Boolean);
  const text = [
    data.title,
    data.description,
    data.event,
    data.venue,
    data.sourceLabel,
    data.mediaOutlet,
    data.roleTitle,
    data.type,
    data.mediaType,
    ...toArray(data.categories),
    ...toArray(data.keywords),
    ...toArray(data.tags)
  ].map(normalizeTopicTerm).join(" ");

  return topicTerms.reduce((score, term) => {
    if (!term || term.length < 3) return score;
    return text.includes(term) ? score + 1 : score;
  }, 0);
}

function topicItemScore(item, topic = {}) {
  if (!item || !item.url || !item.data?.title) return 0;
  const inputPath = item.inputPath || "";
  const tagSet = new Set(toArray(item.data?.tags).map(normalizeTopicTerm));
  const supportedByPath = /src\/(blog|publications|politics|media|presentations)\//.test(inputPath);
  const supportedByTags = ["blog", "publications", "politics", "media", "presentations"].some((tag) => tagSet.has(tag));
  const supportedByUrl = /^\/(blogi|kynasta|mediassa|esitykset|20\d{2})\//.test(item.url);
  if (!supportedByPath && !supportedByTags && !supportedByUrl) return 0;

  const data = item.data || {};
  const categoryTerms = topicTermSet(topic.categories);
  const keywordTerms = topicTermSet(topic.keywords);
  const contextTerms = topicTermSet(topic.contexts);
  let score = 0;

  score += toArray(data.categories).reduce((sum, value) => (
    categoryTerms.has(normalizeTopicTerm(value)) ? sum + 5 : sum
  ), 0);
  score += toArray(data.keywords).reduce((sum, value) => (
    keywordTerms.has(normalizeTopicTerm(value)) ? sum + 4 : sum
  ), 0);

  resolveContexts(data, inputPath).forEach((context) => {
    if (contextTerms.has(normalizeTopicTerm(context))) score += 2;
  });

  score += topicTextScore(item, topic);
  return score;
}

function dateTimestamp(item) {
  const timestamp = new Date(item?.date || item?.data?.date || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function mapTopicItem(item, topic = {}) {
  const data = item.data || {};
  return {
    url: item.url,
    inputPath: item.inputPath,
    date: item.date || data.date,
    data,
    topicScore: topicItemScore(item, topic),
    typeLabel: contentTypeLabel(data, data.tags || [], data.lang || "fi")
  };
}

function topicItemsFromCollections(collections, topic = {}, limit = 12) {
  const maxItems = Number(limit) || 12;
  return uniqueContentItems(collections)
    .map((item) => mapTopicItem(item, topic))
    .filter((item) => item.topicScore > 0)
    .sort((a, b) => b.topicScore - a.topicScore || dateTimestamp(b) - dateTimestamp(a))
    .slice(0, maxItems)
    .sort((a, b) => dateTimestamp(b) - dateTimestamp(a) || b.topicScore - a.topicScore);
}

function selectedTopics(topics, keys = []) {
  const wanted = topicTermSet(keys);
  return toArray(topics).filter((topic) => wanted.has(normalizeTopicTerm(topic.slug)));
}

function matchingTopicsForPage(
  topics,
  title,
  description,
  categories,
  keywords,
  tags,
  type,
  contexts,
  pageUrl,
  limit = 3
) {
  const item = {
    url: pageUrl || "/",
    inputPath: "",
    data: {
      title,
      description,
      categories,
      keywords,
      tags,
      type,
      contexts
    }
  };

  return toArray(topics)
    .map((topic) => ({
      ...topic,
      topicScore: topicItemScore(item, topic)
    }))
    .filter((topic) => topic.topicScore > 0)
    .sort((a, b) => b.topicScore - a.topicScore || a.title.localeCompare(b.title, "fi"))
    .slice(0, Number(limit) || 3);
}

function buildImgFallback(src, alt, className = "") {
  return `<img src="${src}" alt="${alt}" class="${className}" loading="lazy" decoding="async">`;
}

function cleanSeoTitle(value) {
  return String(value || "")
    .replace(/\s+—\s+Jari Laru\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateSeoTitle(value, maxLength = 53) {
  const text = cleanSeoTitle(value);
  const limit = Number(maxLength) || 53;
  if (text.length <= limit) return text;

  const cut = text.slice(0, limit + 1);
  const punctuationEnd = Math.max(
    cut.lastIndexOf(": "),
    cut.lastIndexOf(" - "),
    cut.lastIndexOf(" – "),
    cut.lastIndexOf(" — "),
    cut.lastIndexOf(". ")
  );
  if (punctuationEnd >= 25) {
    return cut.slice(0, punctuationEnd).trim();
  }

  const wordEnd = cut.slice(0, Math.max(limit - 3, 0)).lastIndexOf(" ");
  const end = wordEnd >= 30 ? wordEnd : limit - 3;
  return `${cut.slice(0, end).trim()}...`;
}

function yearFromDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const match = String(value).match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : "";
  }
  return String(date.getFullYear());
}

function truncateSeoDescription(value, maxLength = 165) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  if (sentenceEnd >= 90) return cut.slice(0, sentenceEnd + 1).trim();
  const wordEnd = cut.lastIndexOf(" ");
  return `${cut.slice(0, wordEnd > 90 ? wordEnd : maxLength).trim()}...`;
}

function contentKindLabel(options = {}) {
  const {
    type,
    tags = [],
    contexts = [],
    keywords = [],
    agenda_title = "",
    currentLang = "fi",
    speechContext: rawSpeechContext = ""
  } = options;
  const tagSet = new Set(toArray(tags).map((tag) => String(tag).toLowerCase()));
  const contextSet = normalizeTerms(contexts);
  const keywordSet = normalizeTerms(keywords);
  const speechContext = String(rawSpeechContext || "").trim();
  if (type === "esitys" || tagSet.has("presentations")) return currentLang === "en" ? "Presentation" : "Esitys";
  if (type === "lausunto") return currentLang === "en" ? "Expert statement" : "Asiantuntijalausunto";
  if (agenda_title === "Valtuuston kyselytunti" || contextSet.has("valtuuston kyselytunti") || keywordSet.has("valtuustokysely") || speechContext === "kyselytunti") return currentLang === "en" ? "Council question hour" : "Valtuuston kyselytunti";
  if (type === "puhe") {
    if (speechContext === "valtuusto") return currentLang === "en" ? "Council speech" : "Valtuustopuheenvuoro";
    if (speechContext === "akateeminen-puhe") return currentLang === "en" ? "Academic speech" : "Akateeminen puhe";
    if (speechContext === "juhlapuhe") return currentLang === "en" ? "Ceremonial speech" : "Juhlapuhe";
    if (speechContext === "julkinen-tilaisuus") return currentLang === "en" ? "Public speech" : "Julkinen puhe";
    return currentLang === "en" ? "Speech" : "Puhe";
  }
  if (type === "mielipide") return currentLang === "en" ? "Opinion piece" : "Mielipidekirjoitus";
  if (type === "kolumni") return currentLang === "en" ? "Column" : "Kolumni";
  if (tagSet.has("blog")) return currentLang === "en" ? "Blog post" : "Blogikirjoitus";
  if (tagSet.has("politics")) return currentLang === "en" ? "Political content" : "Poliittinen sisältö";
  return currentLang === "en" ? "Content" : "Sisältö";
}

function buildSeoFallback(options = {}) {
  const title = cleanSeoTitle(options.title);
  const year = yearFromDate(options.date);
  const kind = contentKindLabel(options);
  const source = String(options.source || "").toLowerCase();
  const currentLang = options.currentLang || "fi";

  if (source === "slideshare" || options.type === "esitys") {
    if (currentLang === "en") {
      return truncateSeoDescription(`${kind} "${title}" in Jari Laru's presentation archive${year ? ` (${year})` : ""}. The material is available as part of the site's public presentation and teaching-material collection.`);
    }
    return truncateSeoDescription(`${kind} "${title}" Jari Larun esitysarkistossa${year ? ` (${year})` : ""}. Materiaali on osa sivuston julkisia esityksiä ja opetusmateriaaleja.`);
  }

  if (currentLang === "en") {
    return truncateSeoDescription(`${kind} "${title}" on Jari Laru's site${year ? ` (${year})` : ""}. The page is part of the site's public archive of writing, expertise, research, and public work.`);
  }
  return truncateSeoDescription(`${kind} "${title}" Jari Larun sivustolla${year ? ` (${year})` : ""}. Sivu kuuluu kirjoitusten, asiantuntijatyön, tutkimuksen ja julkisen vaikuttamisen arkistoon.`);
}

function shouldReplaceSeoDescription(description, options = {}) {
  const text = String(description || "").trim();
  if (!text) return true;
  if (/^slideshare-esitys$/i.test(text)) return true;
  if (/https?:\/\//i.test(text)) return true;
  if (/(tähää|äyttää|Lastensuojen|Mu Oulu lehdessä)/i.test(text)) return true;
  if (/(^|\s)äkökulm/i.test(text)) return true;
  if ((options.type === "esitys" || String(options.source || "").toLowerCase() === "slideshare") && text.length < 70) return true;
  return false;
}

module.exports = function registerFilters(eleventyConfig) {
  eleventyConfig.addFilter("toManualPub", function (items) {
    const item = Array.isArray(items) ? items[0] : items;
    if (!item) return {};
    const d = item.data || {};
    const dateStr = String(d.date || "");
    const pubName = d.publisher || d.publication || "";
    const collName = d.publicationCollection || "";
    const journalDisplay = collName && pubName ? `${collName} – ${pubName}` : (collName || pubName);
    return {
      title: d.title || "",
      year: dateStr.slice(0, 4) || "",
      authors: d.author || "Jari Laru",
      url: d.source_url || d.url || "",
      typeCode: d.publicationType || "",
      typeShort: d.publicationType || "",
      publisher: pubName,
      journal: journalDisplay
    };
  });

  eleventyConfig.addFilter("jsonSafe", function (value) {
    return JSON.stringify(value)
      .replace(/<\/script/gi, "<\\/script")
      .replace(/<!--/g, "<\\!--");
  });

  eleventyConfig.addFilter("inlineCSS", function (relativePath) {
    const fullPath = path.join(__dirname, "src/css", relativePath);
    try {
      return fs.readFileSync(fullPath, "utf-8");
    } catch (e) {
      console.warn(`[inlineCSS] Tiedostoa ei löydy: ${fullPath}`);
      return "";
    }
  });

  eleventyConfig.addFilter("toTimestamp", function (date) {
    return new Date(date).getTime() || 0;
  });

  eleventyConfig.addFilter("dateFormat", function (date) {
    const url = (this.page && this.page.url) || "";
    const locale = url.startsWith("/en/") ? "en-GB" : "fi-FI";
    return new Date(date).toLocaleDateString(locale, {
      day: "numeric", month: "long", year: "numeric"
    });
  });

  eleventyConfig.addFilter("isoDate", function (date) {
    if (!date) return "";
    if (typeof date === "string") {
      const match = date.match(/\d{4}-\d{2}-\d{2}/);
      if (match) return match[0];
    }
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return [
      parsed.getFullYear(),
      String(parsed.getMonth() + 1).padStart(2, "0"),
      String(parsed.getDate()).padStart(2, "0")
    ].join("-");
  });

  eleventyConfig.addFilter("dateYear", function (date) {
    return new Date(date).getFullYear();
  });

  eleventyConfig.addFilter("secondsToClock", function (value) {
    const total = Number(value || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds]
      .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
      .join(":");
  });

  eleventyConfig.addFilter("excerpt", function (content) {
    if (!content) return "";
    const text = content.replace(/<[^>]+>/g, "");
    return text.substring(0, 200) + "...";
  });

  eleventyConfig.addFilter("seoDescription", function (description, options = {}) {
    const fallback = buildSeoFallback(options);
    const raw = shouldReplaceSeoDescription(description, options) ? fallback : description;
    return truncateSeoDescription(raw);
  });

  eleventyConfig.addFilter("seoTitle", function (title, maxLength = 53) {
    return truncateSeoTitle(title, maxLength);
  });

  eleventyConfig.addFilter("slugify", function (str) {
    if (!str) return "";
    return str.toLowerCase()
      .replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  });

  eleventyConfig.addFilter("take", function (arr, n) {
    if (!arr) return [];
    return arr.slice(0, n);
  });

  eleventyConfig.addFilter("skip", function (arr, n) {
    if (!arr) return [];
    return arr.slice(n);
  });

  eleventyConfig.addFilter("relatedContent", function (collections, pageUrl, categories, keywords, tags, type, contextsOrLimit = [], maybeLimit = 4) {
    const wantedCategories = normalizeTerms(categories);
    const wantedKeywords = normalizeTerms(keywords);
    const wantedTags = normalizeTerms(tags);
    const wantedType = String(type || "");
    const wantedContexts = typeof contextsOrLimit === "number" ? new Set() : normalizeTerms(contextsOrLimit);
    const limit = typeof contextsOrLimit === "number" ? contextsOrLimit : maybeLimit;
    const lang = getLangFromUrl(pageUrl);

    if (!wantedCategories.size && !wantedKeywords.size && !wantedTags.size && !wantedContexts.size && !wantedType) return [];

    return uniqueContentItems(collections)
      .filter((item) => item.url !== pageUrl)
      .map((item) => {
        const data = item.data || {};
        const categoryScore = intersectionCount(data.categories, wantedCategories) * 5;
        const keywordScore = intersectionCount(data.keywords, wantedKeywords) * 3;
        const tagScore = intersectionCount(data.tags, wantedTags) * 2;
        const contextScore = intersectionCount(data.contexts, wantedContexts) * 4;
        const typeScore = wantedType && data.type === wantedType ? 2 : 0;
        const score = categoryScore + keywordScore + tagScore + contextScore + typeScore;
        return {
          url: item.url,
          title: data.title || "",
          description: data.description || "",
          date: item.date || data.date || null,
          typeLabel: contentTypeLabel(data, data.tags, lang),
          score
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.date || 0) - new Date(a.date || 0);
      })
      .slice(0, Number(limit) || 4);
  });

  eleventyConfig.addFilter("sameCouncilMeetingGroup", function (collections, pageUrl, limit = 6, lang = "fi") {
    return sameCouncilMeetingGroup(collections, pageUrl, limit, lang);
  });

  eleventyConfig.addFilter("councilMeetings", function (collections, lang = "fi") {
    return buildCouncilMeetings(collections, lang);
  });

  eleventyConfig.addFilter("councilMeetingTimeline", function (collections, lang = "fi") {
    return buildCouncilMeetingTimeline(collections, lang);
  });

  eleventyConfig.addFilter("contentTermCloud", function (collections, categories, keywords, limit = 12) {
    const ownTerms = [...toArray(categories), ...toArray(keywords)];
    if (!ownTerms.length) return [];

    const frequencies = new Map();
    uniqueContentItems(collections).forEach((item) => {
      [...toArray(item.data?.categories), ...toArray(item.data?.keywords)].forEach((term) => {
        const normalized = normalizeTerm(term);
        if (!normalized) return;
        frequencies.set(normalized, (frequencies.get(normalized) || 0) + 1);
      });
    });

    const seen = new Set();
    return ownTerms
      .filter((term) => {
        const normalized = normalizeTerm(term);
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .map((term) => {
        const name = String(term || "");
        const count = frequencies.get(normalizeTerm(term)) || 1;
        return {
          name,
          count,
          weight: count >= 20 ? "xl" : count >= 10 ? "lg" : count >= 5 ? "md" : "sm"
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fi"))
      .slice(0, Number(limit) || 12);
  });

  eleventyConfig.addFilter("archiveTermCloud", function (items, limit = 14, source = "both") {
    return archiveTerms(items, limit, source);
  });

  eleventyConfig.addFilter("topicItems", function (collections, topic, limit = 12) {
    return topicItemsFromCollections(collections, topic, limit);
  });

  eleventyConfig.addFilter("selectedTopics", function (topics, keys = []) {
    return selectedTopics(topics, keys);
  });

  eleventyConfig.addFilter("matchingTopics", function (
    topics,
    title,
    description,
    categories,
    keywords,
    tags,
    type,
    contexts,
    pageUrl,
    limit = 3
  ) {
    return matchingTopicsForPage(topics, title, description, categories, keywords, tags, type, contexts, pageUrl, limit);
  });

  eleventyConfig.addFilter("topicTypeLabel", function (item, lang = "fi") {
    return contentTypeLabel(item?.data || item || {}, item?.data?.tags || item?.tags || [], lang);
  });

  eleventyConfig.addFilter("filterByType", function (arr, type) {
    if (!arr) return [];
    return arr.filter(item => item.data.type === type);
  });

  eleventyConfig.addFilter("resolveContexts", function (data, inputPath = "") {
    return resolveContexts(data || {}, inputPath);
  });

  eleventyConfig.addFilter("contextLabel", function (context, lang = "fi") {
    return getContextMeta(context, lang).label;
  });

  eleventyConfig.addFilter("contextHref", function (context, lang = "fi") {
    return getContextMeta(context, lang).href;
  });

  eleventyConfig.addFilter("apa7authors", function (authors) {
    if (!Array.isArray(authors)) return "";
    const formattedAuthors = authors.map(name => {
      const commaIdx = name.indexOf(',');
      if (commaIdx === -1) return name;
      const last = name.slice(0, commaIdx).trim();
      const firsts = name.slice(commaIdx + 1).trim();
      const initials = firsts
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part
          .split("-")
          .filter(Boolean)
          .map(w => `${w[0].toUpperCase()}.`)
          .join("-"))
        .join(" ");
      return `${last}, ${initials}`;
    }).filter(Boolean);
    if (formattedAuthors.length <= 1) return formattedAuthors.join("");
    return `${formattedAuthors.slice(0, -1).join(", ")}, & ${formattedAuthors[formattedAuthors.length - 1]}`;
  });

  eleventyConfig.addFilter("absoluteUrl", function (url, base) {
    if (!url) return base || "";
    if (/^https?:\/\//i.test(url)) return url;
    const normalizedBase = (base || "").replace(/\/+$/, "");
    const normalizedUrl = String(url).startsWith("/") ? url : `/${url}`;
    return `${normalizedBase}${normalizedUrl}`;
  });

  eleventyConfig.addFilter("langFromUrl", function (url) {
    return getLangFromUrl(url);
  });

  eleventyConfig.addFilter("localeForLang", function (lang) {
    return lang === "en" ? "en_US" : "fi_FI";
  });

  eleventyConfig.addFilter("switchLangUrl", function (url, targetLang) {
    const source = String(url || "/");
    if (targetLang === "en") {
      if (source === "/") return "/en/";
      if (source.startsWith("/en/")) return source;
      return `/en${source.startsWith("/") ? source : `/${source}`}`;
    }
    if (source === "/en/") return "/";
    if (source.startsWith("/en/")) {
      const fiUrl = source.replace(/^\/en/, "");
      return fiUrl || "/";
    }
    return source || "/";
  });

  eleventyConfig.addFilter("findTranslationUrl", function (items, translationKey, targetLang) {
    if (!translationKey || !Array.isArray(items)) return "";
    const match = items.find((item) => {
      if (!item || !item.data) return false;
      const itemLang = item.data.lang || getLangFromUrl(item.url);
      return item.data.translationKey === translationKey && itemLang === targetLang;
    });
    return match && match.url ? match.url : "";
  });

  eleventyConfig.addFilter("navItemByKey", function (items, key) {
    if (!Array.isArray(items) || !key) return null;
    return items.find((item) => item && item.key === key) || null;
  });

  eleventyConfig.addAsyncShortcode("optimizedImage", async function (src, alt, className = "", sizes = "100vw") {
    if (!src || !alt) return "";
    try {
      const sourcePath = src.startsWith("/")
        ? path.join(process.cwd(), "src", src.replace(/^\/+/, ""))
        : src;

      const metadata = await Image(sourcePath, {
        widths: [320, 640],
        formats: ["webp", "jpeg"],
        outputDir: path.join(process.cwd(), "_site", "img", "optimized"),
        urlPath: "/img/optimized/",
        filenameFormat: (id, originalSrc, width, format) => {
          const baseName = path.basename(originalSrc, path.extname(originalSrc));
          return `${baseName}-${id}-${width}w.${format}`;
        }
      });

      return Image.generateHTML(metadata, {
        alt,
        class: className,
        sizes,
        loading: "lazy",
        decoding: "async"
      });
    } catch (_) {
      return buildImgFallback(src, alt, className);
    }
  });
};

module.exports.buildCouncilMeetings = buildCouncilMeetings;
module.exports.buildCouncilMeetingTimeline = buildCouncilMeetingTimeline;
