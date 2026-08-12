(async () => {
  const PAGE_SIZE = 6;
  const UNIFIED_PAGE_SIZE = 12;
  // Data ladataan async /data/presentations-page.json:sta. Aiemmin
  // lataantui embedded <script id="presentation-*-data">-lohkoista
  // (~172 KB HTML). Nyt selain voi cache:ttaa datan.
  async function loadPresentationsPageData() {
    try {
      const res = await fetch('/data/presentations-page.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (error) {
      console.error('esitykset: fetch /data/presentations-page.json failed:', error);
      return { items: [], contexts: [], canvaPageUrls: [] };
    }
  }
  const _pageData = await loadPresentationsPageData();
  const canonicalItems = Array.isArray(_pageData.items) ? _pageData.items : [];
  const presentationContexts = _pageData.contexts || [];
  const analysisArchiveItems = [
    {
      title: "Canva-esitykset 2021-2026",
      url: "/esitykset/canva-analyysi/",
      description: "Teemat, kehityskaaret ja laajimmat esitykset.",
      meta: "Aineistoanalyysi",
      date: "2026",
      _isoDate: "2026-12-31",
      archiveType: "analysis",
      archiveTypeLabel: "Aineistoanalyysi",
      sourceLabel: "Sivuston analyysi"
    },
    {
      title: "SlideShare-esitykset 2009-2020",
      url: "/esitykset/slideshare-analyysi/",
      description: "Katsotuimmat, teemat ja kehityskaaret vuosikymmenittäin.",
      meta: "Aineistoanalyysi",
      date: "2020",
      _isoDate: "2020-12-31",
      archiveType: "analysis",
      archiveTypeLabel: "Aineistoanalyysi",
      sourceLabel: "Sivuston analyysi"
    }
  ];
  const learningEnvironmentItems = [
    {
      title: "418025P LET -kurssin oppimateriaalisivusto",
      url: "https://sites.google.com/oulu.fi/let/home/assesment",
      description: "Learning Environments and Technologies -kurssin oppimateriaalisivusto Google Sitesissa.",
      meta: "Google Sites · Kurssisivusto",
      date: "2019",
      _isoDate: "2019-09-01",
      archiveType: "oppimisymparisto",
      archiveTypeLabel: "Oppimisympäristö",
      sourceLabel: "Google Sites"
    },
    {
      title: "410017Y Digitaalinen media oppimisprojektina — kurssisivusto",
      url: "https://sites.google.com/oulu.fi/410017/etusivu",
      description: "Kurssin verkkosivusto Google Sitesissa.",
      meta: "Google Sites · Kurssisivusto",
      date: "2015",
      _isoDate: "2015-09-01",
      archiveType: "oppimisymparisto",
      archiveTypeLabel: "Oppimisympäristö",
      sourceLabel: "Google Sites"
    },
    {
      title: "CSCL2019 — Computer-Supported Collaborative Learning",
      url: "https://sites.google.com/edu.oulu.fi/cscl2019/home",
      description: "Kansainvälinen 4 yliopiston (Oulu, Turku, Saarland, Alankomaat) verkkokurssi CSCL-teemasta.",
      meta: "Google Sites · Kv. verkkokurssi",
      date: "2019",
      _isoDate: "2019-10-07",
      archiveType: "oppimisymparisto",
      archiveTypeLabel: "Oppimisympäristö",
      sourceLabel: "Google Sites"
    },
    {
      title: "CSCL2020 — Computer-Supported Collaborative Learning",
      url: "https://sites.google.com/edu.oulu.fi/cscl2020/home",
      description: "Kansainvälinen 4 yliopiston verkkokurssi CSCL-teemasta, syksy 2020.",
      meta: "Google Sites · Kv. verkkokurssi",
      date: "2020",
      _isoDate: "2020-10-09",
      archiveType: "oppimisymparisto",
      archiveTypeLabel: "Oppimisympäristö",
      sourceLabel: "Google Sites"
    },
    {
      title: "407062A Ohjelmointi perusopetuksessa — kurssisivusto",
      url: "https://sites.google.com/edu.oulu.fi/ohjelmointi-perusopetuksessa20/etusivu-frontpage",
      description: "Kurssin verkkosivusto (kevät 2020, samaa käytettiin myös vuonna 2019). Digitaalinen ja algoritminen ajattelu, koneeton ja graafinen ohjelmointi, robotiikka. Kaksikielinen (fi/en).",
      meta: "Google Sites · Kurssisivusto",
      date: "2020",
      _isoDate: "2020-01-09",
      archiveType: "oppimisymparisto",
      archiveTypeLabel: "Oppimisympäristö",
      sourceLabel: "Google Sites"
    },
  ];
  const closedLearningEnvironmentItems = [
    // 2020
    {
      title: "405028Y Teknologiatuettu oppiminen ja opintoihin orientoituminen (TVT-osuus)",
      url: "",
      description: "MS Teams -toteutus, Teams-koodi 3ga3n2a. Teams Assignments/Classwork ja SharePoint Home.aspx -sivusto käytössä.",
      meta: "MS Teams · Class Team",
      date: "2020",
      _isoDate: "2020-01-01",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    {
      title: "Learning Environments and Technologies (10 op) — 2020",
      url: "",
      description: "SharePoint Home.aspx -sivusto. Omistajaryhmä olemassa.",
      meta: "SharePoint",
      date: "2020",
      _isoDate: "2020-01-02",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams / SharePoint"
    },
    // 2021
    {
      title: "405028Y Teknologiatuettu oppiminen (TVT-osuus) — 2021",
      url: "",
      description: "MS Teams -toteutus (Yleinen-kanava, SharePoint, Assignments/Classwork). M365 Group.",
      meta: "MS Teams · Class Team",
      date: "2021",
      _isoDate: "2021-01-01",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    {
      title: "405028Y — Opettajainhuone (yksityinen)",
      url: "",
      description: "Erillinen yksityinen Teams/SharePoint-toteutus opettajille (Home.aspx-sivusto).",
      meta: "MS Teams · Private",
      date: "2021",
      _isoDate: "2021-01-02",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    {
      title: "Kurssit Teams-ympäristössä 2021 (aggregoitu)",
      url: "",
      description: "MS Teams -toteutuksia vuonna 2021: Learning Environments & Technologies, Emergent Learning Technologies, Ohjelmointi perusopetuksessa, STEAM-sivuaineen opetus, Aineenopettajien vapaavalintainen TVT-kurssi.",
      meta: "MS Teams · 5 kurssitoteutusta",
      date: "2021",
      _isoDate: "2021-01-03",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    // 2022
    {
      title: "405028Y Teknologiatuettu oppiminen (KTK149-toteutus)",
      url: "",
      description: "MS Teams -toteutus, Teams-koodi 0xyudgq.",
      meta: "MS Teams · Class Team",
      date: "2022",
      _isoDate: "2022-01-01",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    {
      title: "Johdatus STEAMiin",
      url: "",
      description: "O365 Teams -toteutus mainittu virallisessa OPS-kuvauksessa.",
      meta: "MS Teams · O365",
      date: "2022",
      _isoDate: "2022-01-02",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    // 2023
    {
      title: "418028P Learning Environments and Technologies (10 op) — 2023",
      url: "",
      description: "Teams/M365 Group, 26 jäsentä.",
      meta: "MS Teams · Class Team",
      date: "2023",
      _isoDate: "2023-01-01",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    {
      title: "Technologies in Teaching and Learning",
      url: "",
      description: "MS Teams -toteutus, Classwork- ja Assignments-välilehdet käytössä.",
      meta: "MS Teams · Class Team",
      date: "2023",
      _isoDate: "2023-01-02",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    {
      title: "Teknologiatuettu oppiminen ja työskentely — 2023",
      url: "",
      description: "MS Teams -toteutus, Teams-koodi if6dhyt.",
      meta: "MS Teams · Class Team",
      date: "2023",
      _isoDate: "2023-01-03",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    // 2024
    {
      title: "Learning Environments and Technologies — 2024",
      url: "",
      description: "MS Teams -toteutus (Yleinen-kanava).",
      meta: "MS Teams · Class Team",
      date: "2024",
      _isoDate: "2024-01-01",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    {
      title: "Teknologiatuettu oppiminen ja työskentely — LUKO/ERKKA 2024",
      url: "",
      description: "MS Teams Class Team -toteutus.",
      meta: "MS Teams · Class Team",
      date: "2024",
      _isoDate: "2024-01-02",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    {
      title: "Teknologiatuettu oppiminen ja työskentely — PSYKA-MUKA 24-25",
      url: "",
      description: "MS Teams Class Team -toteutus.",
      meta: "MS Teams · Class Team",
      date: "2024",
      _isoDate: "2024-01-03",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    // 2025
    {
      title: "Learning Environments & Technologies Course Workspace — 2025",
      url: "",
      description: "Howspace-ympäristö. Group 1 (LET + vaihto-opiskelijat) ja Group 2 (Learning Sciences).",
      meta: "Howspace · 2 ryhmää",
      date: "2025",
      _isoDate: "2025-01-01",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "Howspace"
    },
    {
      title: "Learning Environments and Technologies — 2025 (16 workshopin toteutus)",
      url: "",
      description: "Kansainvälisten ja suomalaisten opiskelijoiden yhteiskurssi, 16 workshopia.",
      meta: "MS Teams · 16 workshopia",
      date: "2025",
      _isoDate: "2025-01-02",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    // 2026 — pääosin M365 Group -hallintaa
    {
      title: "Teknologiatuettu oppiminen ja työskentely — LUKO/ERKKA 2026",
      url: "",
      description: "M365 Group aktiivinen, 128 jäsentä.",
      meta: "MS Teams · M365 Group",
      date: "2026",
      _isoDate: "2026-01-01",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "MS Teams"
    },
    {
      title: "M365 Group -hallinta 2026 (uusimiset ja vanhentumiset)",
      url: "",
      description: "Vuoden 2026 M365 Group -hallintaa: 418028P Learning Environments and Technologies (26 jäsentä, ryhmä vanheni) ja Learning environments and technologies 10 cr (8 jäsenen HiddenMembership, uusimisviesti).",
      meta: "M365 · Ryhmähallinta",
      date: "2026",
      _isoDate: "2026-01-02",
      archiveType: "suljettu-oppimisymparisto",
      archiveTypeLabel: "Suljettu oppimisympäristö",
      sourceLabel: "M365"
    }
  ];
  const courseFilterLabels = new Map();
  const refinerParentByFilter = {
    "category:konferenssi-keynote": "route:puheenvuorot",
    "category:kansainvälinen-konferenssi": "route:puheenvuorot",
    "category:tdk-luento": "route:opintojaksot",
    "category:täydennyskoulutus": "route:koulutukset",
    "category:webinaari": "route:koulutukset",
    "category:hanke-esittely": "route:koulutukset",
    aoe: "route:materiaalit",
    video: "route:materiaalit",
    analysis: "route:materiaalit",
    oppimisymparisto: "route:materiaalit",
    "suljettu-oppimisymparisto": "route:materiaalit"
  };

  const iconByKey = {
    aoe: "bi-book",
    canva: "bi-file-earmark-slides",
    curatedVideos: "bi-camera-video",
    customMaterials: "bi-box-arrow-up-right",
    videoSeries: "bi-collection-play",
    youtubeVideos: "bi-youtube",
    youtube: "bi-youtube",
    slideshare: "bi-collection-play"
  };

  const linkLabelByKey = {
    aoe: "Avaa Finnassa",
    canva: "Avaa",
    curatedVideos: "Katso",
    customMaterials: "Avaa materiaali",
    videoSeries: "Avaa sarja",
    youtubeVideos: "Katso",
    youtube: "YouTube",
    slideshare: "SlideShare",
    analysis: "Lue analyysi",
    oppimisymparisto: "Avaa sivusto"
  };

  const archiveMetaByKey = {
    canva: {
      archiveType: "own",
      archiveTypeLabel: "Koulutus / esitys",
      sourceLabel: "Canva"
    },
    slideshare: {
      archiveType: "own",
      archiveTypeLabel: "Koulutus / esitys",
      sourceLabel: "SlideShare"
    },
    aoe: {
      archiveType: "aoe",
      archiveTypeLabel: "Avoin oppimateriaali",
      sourceLabel: "AOE / Finna"
    },
    curatedVideos: {
      archiveType: "video",
      archiveTypeLabel: "Video / tallenne",
      sourceLabel: "YouTube / oma puheenvuoro"
    },
    customMaterials: {
      archiveType: "aoe",
      archiveTypeLabel: "Verkkomateriaali",
      sourceLabel: "Oulun kaupunki"
    },
    videoSeries: {
      archiveType: "video",
      archiveTypeLabel: "Videosarja",
      sourceLabel: "YouTube / oma sarja"
    },
    youtubeVideos: {
      archiveType: "video",
      archiveTypeLabel: "Video / tallenne",
      sourceLabel: "YouTube"
    },
    youtube: {
      archiveType: "video",
      archiveTypeLabel: "Soittolista",
      sourceLabel: "YouTube"
    }
  };

  function escHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function truncate(value, max = 120) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max).trim()}…` : text;
  }

  function isExternalUrl(url) {
    return /^https?:\/\//i.test(String(url || ""));
  }

  function linkAttrs(url) {
    return isExternalUrl(url) ? ' target="_blank" rel="noopener noreferrer"' : "";
  }

  function itemSourceKey(item, sourceKeyOverride = "") {
    return String(sourceKeyOverride || item?.sourceKey || "").trim();
  }

  function prefersLocalPresentationPage(item, sourceKeyOverride = "") {
    const sourceKey = itemSourceKey(item, sourceKeyOverride);
    return Boolean(item?.pageUrl) && (sourceKey === "slideshare" || sourceKey === "canva");
  }

  function primaryUrl(item, sourceKeyOverride = "") {
    if (prefersLocalPresentationPage(item, sourceKeyOverride)) {
      return item.pageUrl || item.url || item.externalUrl || "";
    }
    return item.url || item.pageUrl || item.externalUrl || "";
  }

  function externalSourceUrl(item, sourceKeyOverride = "") {
    if (prefersLocalPresentationPage(item, sourceKeyOverride)) {
      return item.url || item.externalUrl || "";
    }
    if (item?.externalUrl && item.externalUrl !== primaryUrl(item, sourceKeyOverride)) {
      return item.externalUrl;
    }
    return "";
  }

  function primaryActionLabel(item, sourceKeyOverride = "") {
    return prefersLocalPresentationPage(item, sourceKeyOverride)
      ? "Avaa esityssivu"
      : (item?.url ? (linkLabelByKey[itemSourceKey(item, sourceKeyOverride)] || "Avaa") : "Avaa esityssivu");
  }

  function presentationThumbLabel(item, sourceKeyOverride = "") {
    const title = String(item?.title || "").trim() || "Esitys";
    return `${primaryActionLabel(item, sourceKeyOverride)}: ${title}`;
  }

  function normalizeContextUrl(value) {
    return String(value || "").trim().replace(/\/$/, "");
  }

  function uniquePush(list, value) {
    const normalized = String(value || "").trim();
    if (!normalized || list.includes(normalized)) return;
    list.push(normalized);
  }

  function slugifyFilterValue(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function courseFilterValue(course) {
    const id = String(course?.courseId || "").trim();
    const name = String(course?.courseName || "").trim();
    const value = id ? slugifyFilterValue(id) : slugifyFilterValue(name);
    return value ? `course:${value}` : "";
  }

  function courseFilterLabel(course) {
    const id = String(course?.courseId || "").trim();
    const name = String(course?.courseName || "").trim();
    if (id && name) return `${id} ${name}`;
    return id || name || "Opintojaksokonteksti";
  }

  function itemCourseContexts(item) {
    return Array.isArray(item?.courseContexts) ? item.courseContexts : [];
  }

  function createMatcherText(parts) {
    return parts
      .flatMap((part) => {
        if (Array.isArray(part)) return part;
        return [part];
      })
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
  }

  function findContextsForItem(item) {
    const itemUrls = [
      item.url,
      item.externalUrl,
      item.pageUrl
    ].map(normalizeContextUrl).filter(Boolean);
    const itemTitle = String(item.title || "").trim();

    return presentationContexts.filter((context) => {
      const materialUrls = Array.isArray(context.materialUrls)
        ? context.materialUrls.map(normalizeContextUrl).filter(Boolean)
        : [];
      const materialTitles = Array.isArray(context.materialTitles)
        ? context.materialTitles.map((title) => String(title || "").trim())
        : [];
      return itemUrls.some((url) => materialUrls.includes(url)) || (itemTitle && materialTitles.includes(itemTitle));
    });
  }

  function classifyPresentationItem(item, contexts = []) {
    const categoryTags = [];
    const profileTags = [];
    const routeTags = [];
    const explicitCategory = String(item.kategoria || "").trim();
    const explicitProfiles = Array.isArray(item.asiantuntijaprofiili) ? item.asiantuntijaprofiili : [];
    const explicitPrimaryRoute = String(item.paareitti || "").trim();
    const hasCourseContext = itemCourseContexts(item).length > 0;
    const contextTypes = contexts.map((context) => String(context.type || "").trim()).filter(Boolean);
    const text = createMatcherText([
      item.title,
      item.description,
      item.meta,
      item.sourceLabel,
      item.archiveTypeLabel,
      item.jarjestaja,
      item.organizer,
      item.sourceKey,
      item.keywords,
      item.categories,
      contexts.map((context) => [
        context.title,
        context.type,
        context.typeLabel,
        context.format,
        context.role,
        context.organizer,
        context.audience,
        context.summary,
        context.topics
      ])
    ]);
    const has = (pattern) => pattern.test(text);

    if (explicitCategory) uniquePush(categoryTags, explicitCategory);
    explicitProfiles.forEach((profile) => uniquePush(profileTags, profile));

    if (contextTypes.includes("keynote")) {
      uniquePush(categoryTags, "konferenssi-keynote");
      uniquePush(profileTags, "asiantuntija");
    }

    if (contextTypes.includes("continuing-education")) {
      uniquePush(categoryTags, "täydennyskoulutus");
      uniquePush(profileTags, "kouluttaja");
    }

    if (contextTypes.includes("academic-lecture")) {
      uniquePush(categoryTags, "tdk-luento");
      uniquePush(profileTags, "tutkija");
      uniquePush(profileTags, "kouluttaja");
    }

    if (contextTypes.includes("expert-video")) {
      uniquePush(profileTags, "asiantuntija");
    }

    if (contextTypes.includes("video-series")) {
      uniquePush(profileTags, "kouluttaja");
      uniquePush(routeTags, "route:materiaalit");
    }

    if (!categoryTags.length || has(/\bkeynote\b|avauspuheenvuoro|avauspuhe|plenary|opening keynote/)) {
      if (has(/\bkeynote\b|avauspuheenvuoro|avauspuhe|plenary|opening keynote/)) {
        uniquePush(categoryTags, "konferenssi-keynote");
      }
    }

    if (!categoryTags.length || has(/\b(isls|earli|iste|hicss|site|edmedia|ed-media|ectel|icls|edulearn|steam|arctic frontiers|fablearn|conference|symposium|kongressi|konferenssi)\b/)) {
      if (has(/\b(isls|earli|iste|hicss|site|edmedia|ed-media|ectel|icls|edulearn|steam|arctic frontiers|fablearn|conference|symposium|kongressi|konferenssi)\b/)) {
        uniquePush(categoryTags, "kansainvälinen-konferenssi");
      }
    }

    if (has(/\bwebinaari\b|\bwebinar\b|itk-webinaari|verkkoluent|verkkolive/)) {
      uniquePush(categoryTags, "webinaari");
    }

    if (has(/\bveso\b|täydennyskoulut|taydennyskoulut|koulutuspaketti|opettajille suunnattu|opettajien täydennys|digierko|opopassi|\bavi\b/)) {
      uniquePush(categoryTags, "täydennyskoulutus");
    }

    if (has(/\bhanke\b|hankkeen|project presentation|hankeesittely|esittely japanilaiselle vieraalle/)) {
      uniquePush(categoryTags, "hanke-esittely");
    }

    if (has(/\bluento\b|opintojak|kurssi|kurssin|väitös|vaitos|doctoral defence|akateeminen luento|\b\d{5,6}[a-z]\b/)) {
      uniquePush(categoryTags, "tdk-luento");
    }

    if (categoryTags.includes("konferenssi-keynote") || categoryTags.includes("kansainvälinen-konferenssi")) {
      uniquePush(profileTags, "tutkija");
      uniquePush(profileTags, "asiantuntija");
    }

    if (categoryTags.includes("täydennyskoulutus") || categoryTags.includes("webinaari") || categoryTags.includes("hanke-esittely")) {
      uniquePush(profileTags, "kouluttaja");
    }

    if (categoryTags.includes("tdk-luento")) {
      uniquePush(profileTags, "kouluttaja");
      uniquePush(profileTags, "tutkija");
    }

    if (item.archiveType === "aoe") {
      uniquePush(profileTags, "kouluttaja");
    }

    if (item.archiveType === "analysis") {
      uniquePush(profileTags, "asiantuntija");
      uniquePush(profileTags, "tutkija");
    }

    if (item.sourceKey === "videoSeries") {
      uniquePush(profileTags, "kouluttaja");
      uniquePush(profileTags, "asiantuntija");
    }

    if (has(/asiantuntija|paneeli|palveluverkko|tausta-aineisto|päätöksenteko/)) {
      uniquePush(profileTags, "asiantuntija");
    }

    if (has(/väittelijä|research|doctoral|väitös|vaitos|conference|symposium|cscl|learning analytics/)) {
      uniquePush(profileTags, "tutkija");
    }

    if (has(/kouluttaja|workshop|työpaja|opettajille suunnattu|opettajien täydennys|digierko|veso/)) {
      uniquePush(profileTags, "kouluttaja");
    }

    if (item.archiveType === "video" || item.archiveType === "aoe") {
      uniquePush(routeTags, "route:materiaalit");
    }

    if (hasCourseContext) {
      uniquePush(routeTags, "route:opintojaksot");
    }

    const isAcademicLectureOnly =
      categoryTags.length === 1 &&
      categoryTags[0] === "tdk-luento";
    const hasTrainingCategory =
      categoryTags.includes("täydennyskoulutus") ||
      categoryTags.includes("webinaari") ||
      categoryTags.includes("hanke-esittely") ||
      categoryTags.includes("tdk-luento");

    if (
      categoryTags.includes("konferenssi-keynote") ||
      categoryTags.includes("kansainvälinen-konferenssi") ||
      (profileTags.includes("tutkija") &&
        !isAcademicLectureOnly &&
        !hasTrainingCategory)
    ) {
      uniquePush(routeTags, "route:puheenvuorot");
    }

    if (hasTrainingCategory) {
      uniquePush(routeTags, "route:koulutukset");
    }

    if (
      profileTags.includes("asiantuntija") &&
      !routeTags.includes("route:koulutukset") &&
      item.archiveType !== "aoe"
    ) {
      uniquePush(routeTags, "route:puheenvuorot");
    }

    if (!routeTags.length && item.archiveType === "own") {
      if (has(/teacher education|opettajankoulutus|opettaj|pedagog|opetus|oppiminen|learning|education|kurssi|luento|workshop|mobiilioppiminen|multimedia|social media|teknologiatuettu/)) {
        uniquePush(routeTags, "route:koulutukset");
      } else {
        uniquePush(routeTags, "route:puheenvuorot");
      }
    }

    if (explicitPrimaryRoute) {
      uniquePush(routeTags, explicitPrimaryRoute);
    }

    let routePrimary = "";
    if (item.archiveType !== "analysis") {
      if (explicitPrimaryRoute) {
        routePrimary = explicitPrimaryRoute;
      } else if (hasCourseContext) {
        routePrimary = "route:opintojaksot";
      } else if (item.archiveType === "video" || item.archiveType === "aoe") {
        routePrimary = "route:materiaalit";
      } else if (
        categoryTags.includes("konferenssi-keynote") ||
        categoryTags.includes("kansainvälinen-konferenssi")
      ) {
        routePrimary = "route:puheenvuorot";
      } else if (
        categoryTags.includes("täydennyskoulutus") ||
        categoryTags.includes("webinaari") ||
        categoryTags.includes("hanke-esittely") ||
        categoryTags.includes("tdk-luento")
      ) {
        routePrimary = "route:koulutukset";
      } else if (routeTags.includes("route:puheenvuorot")) {
        routePrimary = "route:puheenvuorot";
      } else if (routeTags.includes("route:koulutukset")) {
        routePrimary = "route:koulutukset";
      } else if (routeTags.includes("route:materiaalit")) {
        routePrimary = "route:materiaalit";
      }
    }

    return {
      categoryTags,
      profileTags,
      routeTags,
      routePrimary,
      primaryCategory: categoryTags[0] || ""
    };
  }

  function renderContextBadges(item) {
    const matches = (Array.isArray(item.matchedContexts) ? item.matchedContexts : findContextsForItem(item)).slice(0, 1);
    if (!matches.length) return "";
    return `<div class="presentation-context-chip-row">${matches.map((context) => `
      <span class="presentation-context-chip">${escHtml(context.typeLabel || "Konteksti")}: ${escHtml(context.title || "")}</span>
    `).join("")}</div>`;
  }

  const COURSE_EVIDENCE_PRIORITY = {
    strong: 4,
    contextual: 2
  };

  const COURSE_LINK_TYPE_PRIORITY = {
    explicit_course_code: 4,
    explicit_course_name: 3,
    probable_legacy_course_material: 2,
    possible_reuse_of_course_material: 1,
    contextual_topic_or_pathway: 0
  };

  function primaryCourseContext(item) {
    const courses = itemCourseContexts(item);
    if (!courses.length) return null;

    return [...courses].sort((a, b) => {
      const evidenceDiff =
        (COURSE_EVIDENCE_PRIORITY[b?.evidenceLevel] || 0) - (COURSE_EVIDENCE_PRIORITY[a?.evidenceLevel] || 0);
      if (evidenceDiff !== 0) return evidenceDiff;

      const typeDiff =
        (COURSE_LINK_TYPE_PRIORITY[b?.linkType] || 0) - (COURSE_LINK_TYPE_PRIORITY[a?.linkType] || 0);
      if (typeDiff !== 0) return typeDiff;

      return String(a?.courseName || "").localeCompare(String(b?.courseName || ""));
    })[0];
  }

  function courseBadgeText(course) {
    const id = String(course?.courseId || "").trim();
    const name = String(course?.courseName || "").trim();
    if (id) return id;
    if (!name) return "Opintojaksokonteksti";
    return name.length > 34 ? `${name.slice(0, 31).trim()}…` : name;
  }

  function renderCourseBadges(item) {
    const course = primaryCourseContext(item);
    if (!course) return "";
    const filter = courseFilterValue(course);
    const label = courseFilterLabel(course);
    const text = courseBadgeText(course);
    const chip = filter
      ? `<button type="button" class="presentation-course-chip" data-presentation-filter="${escHtml(filter)}" title="${escHtml(label)}"><i class="bi bi-mortarboard" aria-hidden="true"></i>${escHtml(text)}</button>`
      : `<span class="presentation-course-chip" title="${escHtml(label)}"><i class="bi bi-mortarboard" aria-hidden="true"></i>${escHtml(text)}</span>`;
    return `<div class="presentation-course-chip-row" aria-label="Opintojaksokonteksti">${chip}</div>`;
  }

  function presentationLanguageLabel(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return "";
    if (normalized === "fi") return "FI";
    if (normalized === "en") return "EN";
    if (normalized === "fi-en" || normalized === "en-fi") return "FI/EN";
    return String(value || "").trim().toUpperCase();
  }

  function presentationSlideCountLabel(value) {
    const count = Number(value);
    if (!Number.isFinite(count) || count <= 0) return "";
    return `${count} diaa`;
  }

  function pushPresentationBadge(badges, badge) {
    const text = String(badge?.text || "").trim();
    if (!text) return;
    if (badges.some((item) => item.text === text)) return;
    badges.push({ icon: badge.icon || "bi-tag", text });
  }

  function buildPresentationMetaBadges(item, sourceKeyOverride = "") {
    const sourceKey = sourceKeyOverride || item.sourceKey || "";
    const badges = [];
    const language = presentationLanguageLabel(item.sourceLanguage || item.lang);
    const slideCountText = presentationSlideCountLabel(item.slideCount);
    const isPresentationLike = ["canva", "slideshare", "google"].includes(sourceKey) || item.archiveType === "own";

    if (isPresentationLike) {
      if (language) {
        pushPresentationBadge(badges, { icon: "bi-translate", text: language });
      }
      if (slideCountText) {
        pushPresentationBadge(badges, { icon: "bi-layers", text: slideCountText });
      }
    }

    if (!badges.length) return "";

    return `<div class="presentation-archive-card-meta presentation-archive-card-meta--details" aria-label="Esityksen metatiedot">${badges.slice(0, 3).map((badge) => `
      <span class="presentation-archive-card-detail">
        <i class="bi ${escHtml(badge.icon)} me-1" aria-hidden="true"></i>${escHtml(badge.text)}
      </span>
    `).join("")}</div>`;
  }

  function toDisplayDate(value) {
    if (!value) return "";
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("fi-FI").format(parsed);
    }
    return String(value);
  }

  function toIsoDate(value) {
    if (!value) return null;
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function extractSlideshareDateFromThumbnail(thumbnailUrl) {
    if (!thumbnailUrl) return null;
    // Kaikki SlideShare-formaatit: -YYMMDDHHMMSS- (12 numeroa väliviivojen välissä)
    // Uusi: -190322085500-thumbnail, Vanha: -120125013821-phpapp01-, -conversion-gate01- jne.
    const match = String(thumbnailUrl).match(/-(\d{6})\d{6}-/);
    if (!match) return null;
    const yymmdd = match[1];
    const yy = Number.parseInt(yymmdd.slice(0, 2), 10);
    const mm = Number.parseInt(yymmdd.slice(2, 4), 10);
    const dd = Number.parseInt(yymmdd.slice(4, 6), 10);
    if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    const year = yy >= 90 ? 1900 + yy : 2000 + yy;
    return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }

  function normalizeSlideshareIsoDate(value, thumbnailUrl) {
    // Thumbnail-URL on luotettavin lähde (sisältää latauspäivän tiedostonimessä).
    // Front matter -päivämäärä toimii fallbackina tiedostoille joilla thumbnail puuttuu.
    return extractSlideshareDateFromThumbnail(thumbnailUrl) || toIsoDate(value) || "";
  }

  function createEmptySectionRowsByKey() {
    return {
      aoe: [],
      canva: [],
      customMaterials: [],
      curatedVideos: [],
      videoSeries: [],
      youtubeVideos: [],
      youtube: [],
      slideshare: []
    };
  }

  function normalizeCanonicalItem(item) {
    const sourceKey = itemSourceKey(item);
    if (!sourceKey) return null;

    if (sourceKey === "aoe") {
      const year = String(item.year || item.date || "").trim();
      return {
        sourceKey,
        sourceLabel: item.sourceLabel || "AOE / Finna",
        title: item.title || "Nimetön oppimateriaali",
        url: item.url || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        meta: "AOE / Oppimateriaali",
        date: year,
        _isoDate: year ? `${year}-12-31` : ""
      };
    }

    if (sourceKey === "canva") {
      const iso = toIsoDate(item.date || "") || "";
      return {
        id: item.id || "",
        sourceKey,
        sourceLabel: item.sourceLabel || "Canva",
        title: item.title || "Nimetön esitys",
        url: item.url || "",
        pageUrl: item.pageUrl || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        keywords: Array.isArray(item.categories) ? item.categories.filter(Boolean) : [],
        lang: item.lang || "fi",
        sourceLanguage: item.sourceLanguage || item.lang || "fi",
        slideCount: Number.isFinite(item.slideCount) ? item.slideCount : null,
        meta: "Canva",
        date: toDisplayDate(iso),
        _isoDate: iso,
        jarjestaja: item.jarjestaja || "",
        kategoria: item.kategoria || "",
        paakortti: item.paakortti === true,
        paareitti: item.paareitti || "",
        asiantuntijaprofiili: Array.isArray(item.asiantuntijaprofiili) ? item.asiantuntijaprofiili : [],
        sivuyhteys: Array.isArray(item.sivuyhteys) ? item.sivuyhteys : [],
        courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : []
      };
    }

    if (sourceKey === "youtubeVideos") {
      const iso = toIsoDate(item.date || "") || "";
      return {
        sourceKey,
        sourceLabel: item.sourceLabel || "YouTube",
        title: item.title || "Nimetön video",
        url: item.url || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        meta: "YouTube-video",
        date: toDisplayDate(iso),
        _isoDate: iso
      };
    }

    if (sourceKey === "curatedVideos") {
      const iso = toIsoDate(item.date || "") || "";
      return {
        sourceKey,
        sourceLabel: item.sourceLabel || "YouTube / oma puheenvuoro",
        title: item.title || "Nimetön video",
        url: item.url || item.externalUrl || "",
        pageUrl: item.pageUrl || "",
        externalUrl: item.externalUrl || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        meta: item.badgeText || "Video / tallenne",
        date: toDisplayDate(iso),
        _isoDate: iso
      };
    }

    if (sourceKey === "videoSeries") {
      const iso = toIsoDate(item.date || "") || "";
      return {
        sourceKey,
        sourceLabel: item.sourceLabel || "YouTube / oma sarja",
        title: item.title || "Nimetön videosarja",
        url: item.url || item.externalUrl || "",
        pageUrl: item.pageUrl || "",
        externalUrl: item.externalUrl || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        meta: item.badgeText || (item.itemCount ? `${item.itemCount} videota` : "Videosarja"),
        date: toDisplayDate(iso),
        _isoDate: iso
      };
    }

    if (sourceKey === "youtube") {
      const iso = toIsoDate(item.date || "") || "";
      return {
        sourceKey,
        sourceLabel: item.sourceLabel || "YouTube",
        title: item.title || "Nimetön soittolista",
        url: item.url || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        meta: `${item.itemCount || 0} videota`,
        date: toDisplayDate(iso),
        _isoDate: iso
      };
    }

    if (sourceKey === "slideshare") {
      const iso = normalizeSlideshareIsoDate(item.date || "", item.thumbnail || "");
      return {
        sourceKey,
        sourceLabel: item.sourceLabel || "SlideShare",
        date: toDisplayDate(iso),
        title: item.title || "Nimetön esitys",
        url: item.url || "",
        pageUrl: item.pageUrl || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        keywords: [
          ...(Array.isArray(item.categories) ? item.categories : []),
          ...(Array.isArray(item.keywords) ? item.keywords : [])
        ].map((value) => String(value || "").trim()).filter(Boolean),
        courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : [],
        sourceLanguage: item.sourceLanguage || "",
        slideCount: Number.isFinite(item.slideCount) ? item.slideCount : null,
        _isoDate: iso
      };
    }

    if (sourceKey === "customMaterials") {
      const iso = toIsoDate(item.date || "") || "";
      return {
        sourceKey,
        sourceLabel: item.sourceLabel || "Oulun kaupunki",
        title: item.title || "Nimetön materiaali",
        url: item.url || item.externalUrl || "",
        pageUrl: item.pageUrl || "",
        externalUrl: item.externalUrl || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        meta: item.badgeText || "Verkkomateriaali",
        date: toDisplayDate(iso),
        _isoDate: iso
      };
    }

    return null;
  }

  function sortSectionRows(rows) {
    return [...rows].sort((a, b) => (b._isoDate || "").localeCompare(a._isoDate || ""));
  }

  function buildSectionRowsFromItems(items) {
    const buckets = createEmptySectionRowsByKey();
    items.forEach((item) => {
      const normalized = normalizeCanonicalItem(item);
      const sourceKey = itemSourceKey(normalized);
      if (!normalized || !sourceKey || !Array.isArray(buckets[sourceKey])) return;
      buckets[sourceKey].push(normalized);
    });

    Object.keys(buckets).forEach((key) => {
      buckets[key] = sortSectionRows(buckets[key]);
    });

    return buckets;
  }

  function buildSectionRowsByKey() {
    return buildSectionRowsFromItems(canonicalItems);
  }

  function renderFeatured(key, rows) {
    const host = document.getElementById(`featured-${key}`);
    if (!host || !rows.length) return;
    const item = rows[0];
    const icon = escHtml(iconByKey[key] || "bi-file-earmark");
    const isVideoThumb = key === "youtubeVideos" || key === "videoSeries";
    const thumb = item.thumbnail
      ? `<img src="${escHtml(item.thumbnail)}" alt="${escHtml(item.title)}" class="featured-thumb" style="object-fit:cover;" loading="lazy" decoding="async" onerror="this.style.display='none';">`
      : `<div class="featured-thumb" style="background:var(--bs-secondary-bg);display:flex;align-items:center;justify-content:center;color:var(--bs-secondary-color);font-size:1.5rem;"><i class="bi ${icon}"></i></div>`;
    const desc = escHtml(truncate(item.description || item.meta || "", 130));
    const href = primaryUrl(item, key);
    const buttonLabel = primaryActionLabel(item, key);
    const sourceHref = externalSourceUrl(item, key);
    const sourceLabel = escHtml(linkLabelByKey[key] || "Avaa lähde");
    host.innerHTML = `
      <div class="card border-0 shadow-sm mb-4 overflow-hidden">
        <div class="d-flex align-items-stretch">
          <div class="flex-shrink-0 overflow-hidden ${isVideoThumb ? "video-preview video-preview--sm" : ""}">${thumb}</div>
          <div class="card-body py-2 px-3 d-flex flex-column justify-content-center">
            <p class="text-muted small mb-1">
              ${item.date ? `<i class="bi bi-calendar3 me-1"></i>${escHtml(item.date)}&ensp;` : ""}
              <span class="badge text-bg-warning text-dark fw-semibold" style="font-size:.65rem;">Uusin</span>
            </p>
            <h3 class="h6 fw-bold mb-1 lh-sm">${escHtml(item.title)}</h3>
            ${desc ? `<p class="text-muted small mb-2">${desc}</p>` : ""}
            <div class="d-flex gap-2 flex-wrap">
              ${href ? `<a href="${escHtml(href)}"${linkAttrs(href)} class="btn btn-primary btn-sm rounded-pill px-3 align-self-start">${escHtml(buttonLabel)} ${isExternalUrl(href) ? '<i class="bi bi-arrow-up-right"></i>' : '<i class="bi bi-arrow-right"></i>'}</a>` : ""}
              ${sourceHref ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="btn btn-outline-secondary btn-sm rounded-pill px-3 align-self-start">${sourceLabel} <i class="bi bi-arrow-up-right"></i></a>` : ""}
            </div>
          </div>
        </div>
      </div>`;
  }

  function pickFourRandom(rows) {
    if (!rows.length) return [];
    const shuffled = [...rows];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const picked = shuffled.slice(0, Math.min(4, shuffled.length));
    while (picked.length < 4) {
      picked.push(shuffled[picked.length % shuffled.length]);
    }
    return picked;
  }

  function renderScroller(key, rows) {
    const host = document.querySelector(`.presentation-scroller[data-key="${key}"] .presentation-scroller-track`);
    if (!host) return;
    const cards = pickFourRandom(rows);
    if (!cards.length) {
      host.innerHTML = "";
      return;
    }

    const htmlCards = cards.map((item) => {
      const isVideoThumb = key === "youtubeVideos" || key === "videoSeries";
      const thumb = item.thumbnail
        ? `<div class="scroller-media ${isVideoThumb ? "video-preview video-preview--sm" : ""}">
             <img src="${escHtml(item.thumbnail)}" class="card-img-top" alt="${escHtml(item.title)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="scroller-placeholder" style="display:none;"><i class="bi ${escHtml(iconByKey[key] || "bi-file-earmark")}"></i></div>
           </div>`
        : `<div class="scroller-placeholder"><i class="bi ${escHtml(iconByKey[key] || "bi-file-earmark")}"></i></div>`;
      const href = primaryUrl(item, key);
      const buttonLabel = primaryActionLabel(item, key);
      const sourceHref = externalSourceUrl(item, key);
      const link = href
        ? `<a href="${escHtml(href)}"${linkAttrs(href)} class="btn btn-primary btn-sm rounded-pill px-3">${escHtml(buttonLabel)} ${isExternalUrl(href) ? '<i class="bi bi-arrow-up-right"></i>' : '<i class="bi bi-arrow-right"></i>'}</a>`
        : `<span class="text-muted small"><i class="bi bi-link-45deg"></i> Ei linkkiä</span>`;
      const pageLink = sourceHref
        ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="btn btn-outline-secondary btn-sm rounded-pill px-2 ms-1" title="Avaa alkuperäinen lähde"><i class="bi bi-arrow-up-right"></i></a>`
        : "";
      return `
        <article class="card border-0 shadow-sm presentation-scroller-card">
          ${thumb}
          <div class="card-body p-3">
            <h3 class="h6 mb-1">${escHtml(item.title)}</h3>
            ${item.date ? `<p class="text-muted small mb-1"><i class="bi bi-calendar3 me-1"></i>${escHtml(item.date)}</p>` : ""}
            <p class="text-muted small mb-3">${escHtml(truncate(item.meta || item.description, 72))}</p>
            ${link}${pageLink}
          </div>
        </article>
      `;
    }).join("");

    host.innerHTML = `${htmlCards}${htmlCards}`;
  }

  function renderPagination(key, rows, page, onChange) {
    const host = document.getElementById(`pagination-${key}`);
    if (!host) return;
    const pageCount = Math.ceil(rows.length / PAGE_SIZE);
    if (pageCount <= 1) {
      host.innerHTML = "";
      return;
    }

    let html = "";
    for (let p = 1; p <= pageCount; p += 1) {
      html += `
        <li class="page-item ${p === page ? "active" : ""}">
          <button class="page-link" type="button" data-page="${p}">${p}</button>
        </li>
      `;
    }
    host.innerHTML = html;
    host.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => onChange(Number(btn.dataset.page)));
    });
  }

  function renderTable(key, rows, page, onChange) {
    const tbody = document.getElementById(`table-body-${key}`);
    if (!tbody) return;
    const start = (page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    if (key === "youtubeVideos") {
      tbody.innerHTML = pageRows.map((item) => {
        const preview = item.thumbnail
          ? `<span class="video-preview video-preview--xs d-inline-block"><img src="${escHtml(item.thumbnail)}" alt="${escHtml(item.title)}" class="img-fluid border" style="max-height:72px;object-fit:cover;" loading="lazy" decoding="async" onerror="this.closest('.video-preview').outerHTML='<span class=&quot;text-muted small&quot;>Ei saatavilla</span>';"></span>`
          : '<span class="text-muted small">Ei saatavilla</span>';
        const desc = item.description ? escHtml(truncate(item.description, 140)) : '<span class="text-muted small">-</span>';
        return `
          <tr>
            <td class="small text-muted text-center" data-label="Esikatselu">${preview}</td>
            <td class="fw-semibold" data-label="Otsikko">${escHtml(item.title)}</td>
            <td class="small" data-label="Kuvaus">${desc}</td>
            <td class="text-nowrap" data-label="Päiväys">${escHtml(item.date || "-")}</td>
            <td data-label="Avaa">
              ${primaryUrl(item)
                ? `<a href="${escHtml(primaryUrl(item))}"${linkAttrs(primaryUrl(item))} class="btn btn-outline-primary btn-sm rounded-pill px-3">${item.url ? "Katso" : "Avaa esityssivu"}</a>`
                : `<span class="text-muted small">Ei linkkiä</span>`}
            </td>
          </tr>
        `;
      }).join("");
      renderPagination(key, rows, page, onChange);
      return;
    }

    if (key === "canva" || key === "slideshare") {
      tbody.innerHTML = pageRows.map((item) => {
        const keywords = Array.isArray(item.keywords) ? item.keywords : [];
        const keywordHtml = keywords.length
          ? keywords.map((k) => `<span class="badge text-bg-light text-dark border me-1 mb-1">${escHtml(k)}</span>`).join("")
          : '<span class="text-muted small">Ei saatavilla</span>';
        const preview = item.thumbnail
          ? `<img src="${escHtml(item.thumbnail)}" alt="${escHtml(item.title)}" class="img-fluid border" style="max-height:72px;object-fit:cover;" loading="lazy" decoding="async" onerror="this.outerHTML='<span class=&quot;text-muted small&quot;>Ei saatavilla</span>';">`
          : '<span class="text-muted small">Ei saatavilla</span>';
        const summary = item.description ? escHtml(truncate(item.description, 220)) : '<span class="text-muted small">Ei saatavilla</span>';
        const href = primaryUrl(item, key);
        const sourceHref = externalSourceUrl(item, key);
        const primaryTitle = prefersLocalPresentationPage(item, key) ? "Avaa esityssivu" : "Avaa esitys";
        return `
          <tr>
            <td class="text-center small text-muted font-monospace" data-label="Päivämäärä">${escHtml(item.date || "Ei saatavilla")}</td>
            <td class="small text-muted text-center" data-label="Esikatselu">${preview}</td>
            <td class="fw-semibold" data-label="Otsikko">${escHtml(item.title)}</td>
            <td class="small" data-label="Tiivistelmä">${summary}</td>
            <td data-label="Avainsanat">${keywordHtml}</td>
            <td class="text-center" data-label="Avaa">
              <div class="d-flex gap-1 justify-content-center flex-wrap">
              ${href
                ? `<a href="${escHtml(href)}"${linkAttrs(href)} class="btn btn-outline-primary btn-sm rounded-pill px-2" title="${escHtml(primaryTitle)}"><i class="bi ${isExternalUrl(href) ? "bi-arrow-up-right" : "bi-file-earmark-text"}"></i></a>`
                : `<span class="text-muted small">Ei linkkiä</span>`}
              ${sourceHref
                ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="btn btn-outline-secondary btn-sm rounded-pill px-2" title="Avaa alkuperäinen lähde"><i class="bi bi-arrow-up-right"></i></a>`
                : ""}
              </div>
            </td>
          </tr>
        `;
      }).join("");
    } else {
      tbody.innerHTML = pageRows.map((item) => `
        <tr>
          <td class="fw-semibold" data-label="Otsikko">${escHtml(item.title)}</td>
          <td data-label="Kuvaus">
            <div class="small">${escHtml(truncate(item.description, 140) || "-")}</div>
            <div class="small text-muted">${escHtml(item.meta || "")}</div>
          </td>
          <td class="text-nowrap" data-label="Päiväys / vuosi">${escHtml(item.date || "-")}</td>
          <td data-label="Avaa">
            ${primaryUrl(item)
              ? `<a href="${escHtml(primaryUrl(item))}"${linkAttrs(primaryUrl(item))} class="btn btn-outline-primary btn-sm rounded-pill px-3">${escHtml(item.url ? (linkLabelByKey[key] || "Avaa") : "Avaa esityssivu")}</a>`
              : `<span class="text-muted small">Ei linkkiä</span>`}
          </td>
        </tr>
      `).join("");
    }

    renderPagination(key, rows, page, onChange);
  }

  function renderMobileList(key, rows, page) {
    const host = document.getElementById(`mobile-list-${key}`);
    if (!host) return;
    const start = (page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    host.innerHTML = pageRows.map((item) => {
      const keywords = Array.isArray(item.keywords) ? item.keywords : [];
      const keywordHtml = (key !== "canva" && key !== "slideshare" && keywords.length)
        ? `<div class="d-flex flex-wrap gap-1 mb-2">${keywords.map((k) => `<span class="badge text-bg-light text-dark border">${escHtml(k)}</span>`).join("")}</div>`
        : "";
      const metaBadgeHtml = buildPresentationMetaBadges(item, key);
      const isVideoThumb = key === "youtubeVideos" || key === "videoSeries";
      const thumbHtml = item.thumbnail
        ? `<span class="${isVideoThumb ? "video-preview video-preview--xs " : ""}rounded flex-shrink-0 me-3" style="width:72px;height:52px;"><img src="${escHtml(item.thumbnail)}" alt="" class="rounded" style="width:72px;height:52px;object-fit:cover;" loading="lazy" decoding="async" onerror="this.closest('span').style.display='none';"></span>`
        : "";
      const href = primaryUrl(item, key);
      const sourceHref = externalSourceUrl(item, key);
      const openBtn = href
        ? `<a href="${escHtml(href)}"${linkAttrs(href)} class="btn btn-outline-primary btn-sm rounded-pill px-3">${escHtml(primaryActionLabel(item, key))} ${isExternalUrl(href) ? '<i class="bi bi-arrow-up-right"></i>' : '<i class="bi bi-arrow-right"></i>'}</a>`
        : "";
      const pageBtn = sourceHref
        ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="btn btn-outline-secondary btn-sm rounded-pill px-2 ms-1" title="Avaa alkuperäinen lähde"><i class="bi bi-arrow-up-right"></i></a>`
        : "";
      const descText = truncate(item.description, 140);
      return `
        <li class="border-bottom py-3" role="listitem">
          <div class="d-flex align-items-start">
            ${thumbHtml}
            <div class="flex-grow-1 overflow-hidden">
              <p class="fw-semibold mb-1 lh-sm">${escHtml(item.title)}</p>
              ${item.date ? `<p class="text-muted small mb-1"><i class="bi bi-calendar3 me-1"></i>${escHtml(item.date)}</p>` : ""}
              ${item.meta ? `<p class="text-muted small mb-1">${escHtml(item.meta)}</p>` : ""}
              ${descText ? `<p class="text-muted small mb-2">${escHtml(descText)}</p>` : ""}
              ${metaBadgeHtml}
              ${keywordHtml}
              <div class="d-flex gap-1 flex-wrap">${openBtn}${pageBtn}</div>
            </div>
          </div>
        </li>`;
    }).join("");
  }

  function buildUnifiedArchiveItems(sectionRowsByKey) {
    const items = [];
    Object.entries(sectionRowsByKey).forEach(([key, rows]) => {
      const meta = archiveMetaByKey[key];
      if (!meta) return;
      rows.forEach((item) => {
        const matchedContexts = findContextsForItem(item);
        const taxonomy = classifyPresentationItem(
          {
            ...item,
            archiveType: meta.archiveType,
            archiveTypeLabel: meta.archiveTypeLabel,
            sourceLabel: meta.sourceLabel,
            sourceKey: key
          },
          matchedContexts
        );
        items.push({
          ...item,
          archiveType: meta.archiveType,
          archiveTypeLabel: meta.archiveTypeLabel,
          sourceLabel: meta.sourceLabel,
          sourceKey: key,
          openLabel: linkLabelByKey[key] || "Avaa",
          matchedContexts,
          categoryTags: taxonomy.categoryTags,
          profileTags: taxonomy.profileTags,
          routeTags: taxonomy.routeTags,
          routePrimary: taxonomy.routePrimary,
          kategoria: item.kategoria || taxonomy.primaryCategory
        });
      });
    });

    analysisArchiveItems.forEach((item) => {
      const matchedContexts = findContextsForItem(item);
      const taxonomy = classifyPresentationItem(item, matchedContexts);
      items.push({
        ...item,
        openLabel: linkLabelByKey.analysis,
        matchedContexts,
        categoryTags: taxonomy.categoryTags,
        profileTags: taxonomy.profileTags,
        routeTags: taxonomy.routeTags,
        routePrimary: taxonomy.routePrimary,
        kategoria: item.kategoria || taxonomy.primaryCategory
      });
    });

    learningEnvironmentItems.forEach((item) => {
      const matchedContexts = findContextsForItem(item);
      const taxonomy = classifyPresentationItem(item, matchedContexts);
      items.push({
        ...item,
        openLabel: linkLabelByKey.oppimisymparisto,
        matchedContexts,
        categoryTags: taxonomy.categoryTags,
        profileTags: taxonomy.profileTags,
        routeTags: taxonomy.routeTags,
        routePrimary: "route:materiaalit",
        kategoria: item.kategoria || taxonomy.primaryCategory
      });
    });

    closedLearningEnvironmentItems.forEach((item) => {
      const matchedContexts = findContextsForItem(item);
      const taxonomy = classifyPresentationItem(item, matchedContexts);
      items.push({
        ...item,
        openLabel: "",
        matchedContexts,
        categoryTags: taxonomy.categoryTags,
        profileTags: taxonomy.profileTags,
        routeTags: taxonomy.routeTags,
        routePrimary: "route:materiaalit",
        kategoria: item.kategoria || taxonomy.primaryCategory
      });
    });

    const seen = new Set();
    return items
      .filter((item) => {
        const key = `${item.url || item.pageUrl || ""}|${item.title || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b._isoDate || "").localeCompare(a._isoDate || ""));
  }

  function matchesPresentationFilter(item, filter) {
    if (!filter || filter === "all") return true;
    if (filter.startsWith("course:")) {
      return itemCourseContexts(item).some((course) => courseFilterValue(course) === filter);
    }
    if (filter === "route:puheenvuorot") {
      return item.routePrimary === filter;
    }
    if (filter === "route:opintojaksot") {
      return item.routePrimary === filter || itemCourseContexts(item).length > 0;
    }
    if (filter === "route:koulutukset") {
      return item.routePrimary === filter;
    }
    if (filter === "route:materiaalit") {
      return item.routePrimary === filter;
    }
    if (["own", "aoe", "video", "analysis", "oppimisymparisto", "suljettu-oppimisymparisto"].includes(filter)) return item.archiveType === filter;
    if (filter.startsWith("category:")) {
      return Array.isArray(item.categoryTags) && item.categoryTags.includes(filter.slice("category:".length));
    }
    if (filter.startsWith("profile:")) {
      return Array.isArray(item.profileTags) && item.profileTags.includes(filter.slice("profile:".length));
    }
    if (filter.startsWith("context:")) {
      return Array.isArray(item.sivuyhteys) && item.sivuyhteys.includes(filter.slice("context:".length));
    }
    return false;
  }

  function renderPresentationFilterCounts(items) {
    document.querySelectorAll("[data-presentation-count]").forEach((node) => {
      const filter = node.dataset.presentationCount || "all";
      const count = items.filter((item) => matchesPresentationFilter(item, filter)).length;
      node.textContent = count === 1 ? "1 sisältö" : `${count} sisältöä`;
    });
  }

  function presentationRefinerKey(filter) {
    if (filter?.startsWith?.("course:")) return "route:opintojaksot";
    if (String(filter || "").startsWith("route:")) return filter;
    return refinerParentByFilter[filter] || "";
  }

  function populatePresentationCourseFilter(items) {
    const select = document.getElementById("presentation-course-filter");
    if (!select) return [];

    courseFilterLabels.clear();
    const courses = new Map();
    items.forEach((item) => {
      itemCourseContexts(item).forEach((course) => {
        const value = courseFilterValue(course);
        if (!value) return;
        const previous = courses.get(value) || {
          label: courseFilterLabel(course),
          count: 0
        };
        previous.count += 1;
        courses.set(value, previous);
        courseFilterLabels.set(value, previous.label);
      });
    });

    const options = [...courses.entries()]
      .sort(([, a], [, b]) => a.label.localeCompare(b.label, "fi"))
      .map(([value, item]) => ({ value, ...item }));

    select.innerHTML = [
      '<option value="all">Kaikki opintojaksot</option>',
      ...options.map((item) => `<option value="${escHtml(item.value)}">${escHtml(item.label)} (${item.count})</option>`)
    ].join("");
    select.disabled = options.length === 0;
    return options.map((item) => item.value);
  }

  function describePresentationFilter(filter) {
    const labels = {
      all: { label: "Kaikki sisällöt", note: "" },
      "route:puheenvuorot": { label: "Puheenvuorot", note: "Mukana ovat keynote- ja konferenssipuheenvuorot sekä muut laajat asiantuntijaesiintymiset." },
      "route:opintojaksot": { label: "Opintojaksot", note: "Mukana ovat sisällöt, joille on merkitty opintojaksokonteksti. Voit tarkentaa valintaa opintojaksovalikosta." },
      "route:koulutukset": { label: "Koulutukset ja työpajat", note: "Mukana ovat täydennyskoulutuksiin, webinaareihin ja työpajoihin liittyvät materiaalit." },
      "route:materiaalit": { label: "Videot ja materiaalit", note: "Mukana ovat tallenteet, videosarjat ja jaettavat oppimateriaalit." },
      own: { label: "Omat esitykset", note: "" },
      aoe: { label: "Avoimet oppimateriaalit", note: "" },
      video: { label: "Videot", note: "" },
      analysis: { label: "Analyysit", note: "" },
      oppimisymparisto: { label: "Oppimisympäristöt", note: "Kurssien ja hankkeiden avoimet verkkosivustot (Google Sites, Wikikirjat)." },
      "suljettu-oppimisymparisto": { label: "Suljetut oppimisympäristöt", note: "Kurssien MS Teams / M365 / Howspace -toteutukset. Ei julkisia URL:eja — vain kurssin osallistujille." }
    };
    if (labels[filter]) return labels[filter];

    if (filter.startsWith("category:")) {
      const suffix = filter.slice("category:".length);
      const categoryLabels = {
        "konferenssi-keynote": "Keynotet",
        "kansainvälinen-konferenssi": "Kansainväliset konferenssit",
        "täydennyskoulutus": "Täydennyskoulutukset",
        "hanke-esittely": "Hanke-esittelyt",
        "tdk-luento": "Yliopistoluennot",
        "webinaari": "Webinaarit"
      };
      return { label: categoryLabels[suffix] || suffix, note: "Rajaus kokoaa samaan tyyppiin kuuluvat sisällöt." };
    }

    if (filter.startsWith("profile:")) {
      const suffix = filter.slice("profile:".length);
      const profileLabels = {
        kouluttaja: "Kouluttaja",
        tutkija: "Tutkija",
        asiantuntija: "Asiantuntija"
      };
      return { label: profileLabels[suffix] || suffix, note: "Suodatus perustuu asiantuntijaprofiiliin." };
    }

    if (filter.startsWith("course:")) {
      return {
        label: courseFilterLabels.get(filter) || "Opintojaksokonteksti",
        note: "Rajaus näyttää materiaalit, joiden metadatassa on tämä opintojaksokonteksti."
      };
    }

    if (filter.startsWith("context:")) {
      return { label: filter.slice("context:".length), note: "Suodatus perustuu sivuyhteyteen." };
    }

    return { label: "Valittu suodatus", note: "" };
  }

  function renderUnifiedArchive(items, filter, page) {
    const grid = document.getElementById("presentation-unified-archive");
    const status = document.getElementById("presentation-unified-status");
    const pagination = document.getElementById("presentation-unified-pagination");
    if (!grid || !status || !pagination) return;

    const filtered = items.filter((item) => matchesPresentationFilter(item, filter));
    const pageCount = Math.max(1, Math.ceil(filtered.length / UNIFIED_PAGE_SIZE));
    const safePage = Math.min(Math.max(page, 1), pageCount);
    const start = (safePage - 1) * UNIFIED_PAGE_SIZE;
    const pageItems = filtered.slice(start, start + UNIFIED_PAGE_SIZE);
    const filterInfo = describePresentationFilter(filter || "all");

    status.innerHTML = `
      <span class="presentation-archive-status-badge">${escHtml(filterInfo.label)}</span>
      <span>${filtered.length === 1 ? "Näytetään 1 sisältö." : `Näytetään ${filtered.length} sisältöä.`}</span>
      ${filterInfo.note ? `<small>${escHtml(filterInfo.note)}</small>` : ""}
    `;

    if (!pageItems.length) {
      grid.innerHTML = `<p class="text-muted mb-0">Rajauksella “${escHtml(filterInfo.label)}” ei löytynyt sisältöjä.</p>`;
      pagination.innerHTML = "";
      return;
    }

    grid.innerHTML = pageItems.map((item) => {
      const href = primaryUrl(item, item.sourceKey);
      const sourceHref = externalSourceUrl(item, item.sourceKey);
      const contextBadges = renderContextBadges(item);
      const courseBadges = renderCourseBadges(item);
      const metaBadges = buildPresentationMetaBadges(item);
      const isVideoThumb = item.sourceKey === "youtubeVideos" || item.sourceKey === "videoSeries";
      const thumb = item.thumbnail
        ? `<span class="presentation-archive-card-thumb-placeholder"><i class="bi ${escHtml(iconByKey[item.sourceKey] || "bi-easel2")}"></i></span><img src="${escHtml(item.thumbnail)}" alt="" class="presentation-archive-card-thumb-image" loading="lazy" decoding="async" onerror="this.style.display='none';">`
        : `<span class="presentation-archive-card-thumb-placeholder"><i class="bi ${escHtml(iconByKey[item.sourceKey] || "bi-easel2")}"></i></span>`;
      const primaryButton = href
        ? `<a href="${escHtml(href)}"${linkAttrs(href)} class="btn btn-outline-primary btn-sm rounded-pill px-3">${escHtml(primaryActionLabel(item, item.sourceKey))}</a>`
        : "";
      const externalButton = sourceHref
        ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="btn btn-outline-secondary btn-sm rounded-pill px-3">${escHtml(item.openLabel || "Avaa lähde")}</a>`
        : "";
      const sourceButton = item.externalUrl && item.externalUrl !== item.url
        ? `<a href="${escHtml(item.externalUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary btn-sm rounded-pill px-3">YouTube</a>`
        : "";
      const titleLink = href
        ? `<a href="${escHtml(href)}"${linkAttrs(href)}>${escHtml(item.title)}</a>`
        : escHtml(item.title);
      const kategoriaLabels = {
        "konferenssi-keynote": "Keynote",
        "kansainvälinen-konferenssi": "Kansainvälinen",
        "täydennyskoulutus": "Täydennyskoulutus",
        "webinaari": "Webinaari",
        "hanke-esittely": "Hanke",
        "tdk-luento": "Yliopistoopetus",
        "muu": ""
      };
      const routeLabels = {
        "route:puheenvuorot": "Puheenvuorot",
        "route:opintojaksot": "Opintojaksot",
        "route:koulutukset": "Koulutukset ja työpajat",
        "route:materiaalit": "Videot ja materiaalit"
      };
      const secondaryRouteLabels = {
        "route:puheenvuorot": "Myös: Puheenvuorot",
        "route:opintojaksot": "Myös: Opintojaksot",
        "route:koulutukset": "Myös: Koulutukset ja työpajat",
        "route:materiaalit": "Myös: Videot ja materiaalit"
      };
      const kategoriaLabel = item.kategoria ? (kategoriaLabels[item.kategoria] || item.kategoria) : "";
      const kategoriaBadge = kategoriaLabel
        ? `<button type="button" class="presentation-archive-card-chip presentation-archive-card-chip-secondary" data-presentation-filter="category:${escHtml(item.kategoria)}">${escHtml(kategoriaLabel)}</button>`
        : "";
      const routeBadge = item.routePrimary && routeLabels[item.routePrimary]
        ? `<button type="button" class="presentation-archive-card-route" data-presentation-filter="${escHtml(item.routePrimary)}">${escHtml(routeLabels[item.routePrimary])}</button>`
        : "";
      const routeSecondaryBadges = Array.isArray(item.routeTags)
        ? item.routeTags
          .filter((route) => route && route !== item.routePrimary && secondaryRouteLabels[route])
          .map((route) => `<button type="button" class="presentation-archive-card-route-secondary" data-presentation-filter="${escHtml(route)}">${escHtml(secondaryRouteLabels[route])}</button>`)
          .join("")
        : "";
      const sourceMetaLabel = [item.archiveTypeLabel || "Sisältö", item.sourceLabel || item.meta || ""]
        .filter(Boolean)
        .join(" · ");
      const jarjestajaLine = (item.sourceKey === "canva" && item.jarjestaja)
        ? `<p class="presentation-archive-card-date">${escHtml(item.jarjestaja)}${item.date ? ` · ${escHtml(item.date)}` : ""}</p>`
        : `<p class="presentation-archive-card-date">${escHtml(item.date || item.meta || "")}</p>`;
      return `
        <article class="presentation-archive-card">
          <div class="presentation-archive-card-thumb ${isVideoThumb ? "video-preview video-preview--sm" : ""}">${thumb}</div>
          <div class="presentation-archive-card-body">
            <div class="presentation-archive-card-header">
              <div class="presentation-archive-card-meta presentation-archive-card-meta--primary">
                ${routeBadge}${kategoriaBadge}
              </div>
              ${sourceMetaLabel
                ? `<p class="presentation-archive-card-overline">${escHtml(sourceMetaLabel)}</p>`
                : ""}
              <h3 class="presentation-archive-card-title">${titleLink}</h3>
              ${jarjestajaLine}
            </div>
            <div class="presentation-archive-card-support">
              ${routeSecondaryBadges
                ? `<div class="presentation-archive-card-meta presentation-archive-card-meta--secondary">${routeSecondaryBadges}</div>`
                : ""}
              ${metaBadges}
              ${courseBadges}
              ${contextBadges}
            </div>
            <p class="presentation-archive-card-desc">${escHtml(truncate(item.description || item.meta || "", 150))}</p>
            <div class="presentation-archive-card-actions">${primaryButton}${externalButton}${sourceButton}</div>
          </div>
        </article>
      `;
    }).join("");

    if (pageCount <= 1) {
      pagination.innerHTML = "";
      return;
    }

    pagination.innerHTML = Array.from({ length: pageCount }, (_, index) => {
      const pageNumber = index + 1;
      return `
        <li class="page-item ${pageNumber === safePage ? "active" : ""}">
          <button class="page-link" type="button" data-unified-page="${pageNumber}">${pageNumber}</button>
        </li>
      `;
    }).join("");
  }

  function renderFeatureShowcase() {
    const host = document.getElementById("presentation-feature-showcase");
    if (!host) return;
    const kategoriaLabels = {
      "konferenssi-keynote": "Keynote",
      "kansainvälinen-konferenssi": "Kansainvälinen",
      "täydennyskoulutus": "Täydennyskoulutus",
      "webinaari": "Webinaari",
      "hanke-esittely": "Hanke",
      "tdk-luento": "Yliopistoopetus",
      "muu": ""
    };
    const items = (sectionRowsByKey.canva || [])
      .filter((r) => r.paakortti)
      .sort((a, b) => (b._isoDate || "").localeCompare(a._isoDate || ""));
    if (!items.length) {
      host.closest("section")?.style && (host.closest("section").style.display = "none");
      return;
    }

    const featured = items[0];
    const secondary = items.slice(1, 5);
    const labelFor = (item) => item.kategoria ? (kategoriaLabels[item.kategoria] || item.kategoria) : "Päänosto";
    const thumbFor = (item, href, className = "presentation-feature-primary-media", emptyIcon = "bi-file-earmark-slides") => item.thumbnail
      ? `<a href="${escHtml(href)}"${linkAttrs(href)} class="${className}" aria-label="${escHtml(presentationThumbLabel(item, "canva"))}">
          <img src="${escHtml(item.thumbnail)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async" onerror="this.style.display='none';">
        </a>`
      : `<a href="${escHtml(href)}"${linkAttrs(href)} class="${className}" aria-label="${escHtml(presentationThumbLabel(item, "canva"))}">
          <span class="presentation-feature-placeholder"><i class="bi ${escHtml(emptyIcon)}"></i></span>
        </a>`;
    const featuredHref = primaryUrl(featured, "canva") || featured.url;
    const featuredSourceHref = externalSourceUrl(featured, "canva");
    const featuredMetaBadges = buildPresentationMetaBadges(featured, "canva");
    const featuredOverline = [featured.archiveTypeLabel || "Canva-esitys", featured.sourceLabel || "Canva"]
      .filter(Boolean)
      .join(" · ");
    const featuredContextLine = [featured.jarjestaja, featured.date]
      .filter(Boolean)
      .join(" · ");

    host.innerHTML = `
      <div class="presentation-feature-layout">
        <article class="presentation-feature-primary">
          <div class="presentation-feature-primary-body">
            ${featuredOverline ? `<p class="presentation-feature-overline">${escHtml(featuredOverline)}</p>` : ""}
            <div class="presentation-feature-meta">
              <span>${escHtml(labelFor(featured))}</span>
              ${featured.date ? `<span>${escHtml(featured.date)}</span>` : ""}
            </div>
            <h3><a href="${escHtml(featuredHref)}"${linkAttrs(featuredHref)}>${escHtml(featured.title)}</a></h3>
            ${featuredContextLine ? `<p class="presentation-feature-context">${escHtml(featuredContextLine)}</p>` : ""}
            <div class="presentation-feature-primary-visual">
              ${thumbFor(featured, featuredHref)}
            </div>
            ${featuredMetaBadges}
            <p class="presentation-feature-primary-desc">${escHtml(truncate(featured.description || "Esitys kuuluu sivun keskeisiin nostoihin.", 320))}</p>
            <div class="presentation-feature-actions">
              <a href="${escHtml(featuredHref)}"${linkAttrs(featuredHref)} class="btn btn-primary rounded-pill px-4">${escHtml(primaryActionLabel(featured, "canva"))} <i class="bi bi-arrow-up-right"></i></a>
              ${featuredSourceHref && featuredSourceHref !== featuredHref
                ? `<a href="${escHtml(featuredSourceHref)}"${linkAttrs(featuredSourceHref)} class="btn btn-outline-secondary rounded-pill px-4">Canva</a>`
                : ""}
              <a href="#kaikki-esitykset" class="btn btn-outline-secondary rounded-pill px-4" data-presentation-filter="category:${escHtml(featured.kategoria || "konferenssi-keynote")}">Näytä sama ryhmä</a>
            </div>
          </div>
        </article>
        <div class="presentation-feature-secondary">
          ${secondary.map((item) => {
            const href = primaryUrl(item, "canva") || item.url;
            const sourceHref = externalSourceUrl(item, "canva");
            const metaBadges = buildPresentationMetaBadges(item, "canva");
            const smallMeta = [item.jarjestaja || item.sourceLabel || "Canva", item.date]
              .filter(Boolean)
              .join(" · ");
            return `
            <article class="presentation-feature-small">
              ${item.thumbnail
                ? `<a href="${escHtml(href)}"${linkAttrs(href)} class="presentation-feature-small-thumb" aria-label="${escHtml(presentationThumbLabel(item, "canva"))}"><img src="${escHtml(item.thumbnail)}" alt="" loading="lazy" decoding="async" onerror="this.parentElement.style.display='none';"></a>`
                : thumbFor(item, href, "presentation-feature-small-thumb presentation-feature-small-thumb--empty", "bi-easel2")}
              <div class="presentation-feature-small-body">
                <div class="presentation-feature-small-top">
                  <span class="presentation-feature-small-label">${escHtml(labelFor(item))}</span>
                  ${item.date ? `<span class="presentation-feature-small-date">${escHtml(item.date)}</span>` : ""}
                </div>
                <strong class="presentation-feature-small-title"><a href="${escHtml(href)}"${linkAttrs(href)}>${escHtml(item.title)}</a></strong>
                ${smallMeta ? `<p class="presentation-feature-small-meta">${escHtml(smallMeta)}</p>` : ""}
                ${item.description ? `<p class="presentation-feature-small-desc">${escHtml(truncate(item.description, 140))}</p>` : ""}
                ${metaBadges ? `<div class="presentation-feature-small-badges">${metaBadges}</div>` : ""}
                <div class="presentation-feature-small-actions">
                  <a href="${escHtml(href)}"${linkAttrs(href)} class="presentation-feature-small-link">${escHtml(primaryActionLabel(item, "canva"))}</a>
                  ${sourceHref && sourceHref !== href
                    ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="presentation-feature-small-link presentation-feature-small-link--muted">Canva</a>`
                    : ""}
                </div>
              </div>
            </article>
          `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderLegacyFeaturedCards() {
    const grid = document.getElementById("paakortti-grid");
    if (!grid) return;
    const items = (sectionRowsByKey.canva || []).filter((r) => r.paakortti);
    if (!items.length) {
      grid.closest("section")?.style && (grid.closest("section").style.display = "none");
      return;
    }
    grid.innerHTML = items.map((item) => {
      const thumb = item.thumbnail
        ? `<span class="presentation-archive-card-thumb-placeholder"><i class="bi bi-file-earmark-slides"></i></span><img src="${escHtml(item.thumbnail)}" alt="" class="presentation-archive-card-thumb-image" loading="lazy" decoding="async" onerror="this.style.display='none';">`
        : `<span class="presentation-archive-card-thumb-placeholder"><i class="bi bi-file-earmark-slides"></i></span>`;
      const metaBadges = buildPresentationMetaBadges(item, "canva");
      return `
        <article class="presentation-archive-card presentation-archive-card--featured">
          <div class="presentation-archive-card-thumb">${thumb}</div>
          <div class="presentation-archive-card-body">
            <div class="presentation-archive-card-meta"><span>Canva</span></div>
            <h3 class="presentation-archive-card-title">
              <a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escHtml(item.title)}</a>
            </h3>
            ${item.date ? `<p class="presentation-archive-card-date">${escHtml(item.date)}</p>` : ""}
            ${metaBadges}
            <p class="presentation-archive-card-desc">${escHtml(truncate(item.description || "", 150))}</p>
            <div class="presentation-archive-card-actions">
              <a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm rounded-pill px-3">Avaa <i class="bi bi-arrow-up-right"></i></a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  const sectionRowsByKey = buildSectionRowsByKey();

  function initUnifiedArchive() {
    const archiveItems = buildUnifiedArchiveItems(sectionRowsByKey);
    const filterControls = [...document.querySelectorAll("[data-presentation-filter]")];
    const courseFilterSelect = document.getElementById("presentation-course-filter");
    const refinerHost = document.querySelector("[data-presentation-refiners]");
    const refinerPanels = [...document.querySelectorAll("[data-presentation-refiner]")];
    const archiveGrid = document.getElementById("presentation-unified-archive");
    const courseFilters = populatePresentationCourseFilter(archiveItems);
    const validFilters = new Set([
      "all",
      ...filterControls.map((control) => control.dataset.presentationFilter || "all"),
      ...courseFilters
    ]);
    let activeFilter = "all";
    let activePage = 1;
    renderPresentationFilterCounts(archiveItems);

    const readFilterFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlFilter = params.get("esitykset");
      return urlFilter && validFilters.has(urlFilter) ? urlFilter : "all";
    };

    const writeFilterToUrl = (filter) => {
      const url = new URL(window.location.href);
      if (!filter || filter === "all") {
        url.searchParams.delete("esitykset");
      } else {
        url.searchParams.set("esitykset", filter);
      }
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    };

    const applyFilter = (filter, shouldScroll = false) => {
      activeFilter = validFilters.has(filter) ? filter : "all";
      const refinerKey = presentationRefinerKey(activeFilter);
      activePage = 1;
      filterControls.forEach((control) => {
        const controlFilter = control.dataset.presentationFilter || "all";
        control.classList.toggle(
          "is-active",
          controlFilter === activeFilter || (activeFilter !== "all" && controlFilter === refinerKey)
        );
      });
      if (courseFilterSelect) {
        courseFilterSelect.value = activeFilter.startsWith("course:") ? activeFilter : "all";
      }
      if (refinerHost) {
        refinerHost.hidden = !refinerKey || activeFilter === "all";
      }
      refinerPanels.forEach((panel) => {
        panel.hidden = panel.dataset.presentationRefiner !== refinerKey;
      });
      if (refinerKey !== "route:opintojaksot" && courseFilterSelect) {
        courseFilterSelect.value = "all";
      }
      renderUnifiedArchive(archiveItems, activeFilter, activePage);
      writeFilterToUrl(activeFilter);
      if (shouldScroll) {
        document.getElementById("kaikki-esitykset")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    filterControls.forEach((control) => {
      control.addEventListener("click", (event) => {
        const filter = control.dataset.presentationFilter || "all";
        if (control.tagName === "A") event.preventDefault();
        applyFilter(filter, control.tagName === "A");
      });
    });

    courseFilterSelect?.addEventListener("change", () => {
      const value = courseFilterSelect.value || "all";
      applyFilter(value === "all" ? "route:opintojaksot" : value, false);
    });

    archiveGrid?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-presentation-filter]");
      if (!button) return;
      const filter = button.dataset.presentationFilter || "all";
      applyFilter(filter, false);
    });

    document.getElementById("presentation-unified-pagination")?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-unified-page]");
      if (!button) return;
      activePage = Number(button.dataset.unifiedPage) || 1;
      renderUnifiedArchive(archiveItems, activeFilter, activePage);
      document.getElementById("kaikki-esitykset")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    applyFilter(readFilterFromUrl(), false);
  }

  Object.entries(sectionRowsByKey).forEach(([key, normalized]) => {
    if (!normalized.length) return;
    const hasFeatured = !!document.getElementById(`featured-${key}`);
    if (hasFeatured) renderFeatured(key, normalized);
    const rest = hasFeatured ? normalized.slice(1) : normalized;
    if (!rest.length) return;
    let currentPage = 1;
    const rerender = (newPage) => {
      currentPage = newPage;
      renderTable(key, rest, currentPage, rerender);
      renderMobileList(key, rest, currentPage);
    };
    rerender(1);
  });
  renderFeatureShowcase();
  renderLegacyFeaturedCards();
  initUnifiedArchive();
})();
