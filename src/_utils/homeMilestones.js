const VALID_CATEGORIES = Object.freeze([
  "tausta",
  "tutkimus",
  "opetus",
  "politiikka",
  "palkinto"
]);

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseLeadingYear(value) {
  const normalized = pickString(value);
  const match = normalized.match(/(\d{4})/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function requireYear(value, message) {
  const year = Number.isFinite(value) ? value : parseLeadingYear(value);
  if (!Number.isFinite(year)) {
    throw new Error(message);
  }
  return year;
}

function first(list = []) {
  return toArray(list)[0] || null;
}

function findBy(list = [], predicate) {
  return toArray(list).find(predicate) || null;
}

function createAuthority({
  key,
  sourceKind,
  label,
  year,
  title = "",
  href = "",
  fields = ["year", "title", "href"],
  details = {}
}) {
  return {
    key,
    sourceKind,
    label,
    year: requireYear(year, `home milestone authority requires year for ${key}`),
    title: pickString(title),
    href: pickString(href),
    fields: toArray(fields),
    details
  };
}

function buildCvAuthorities(cvData = {}) {
  const fi = cvData.fi || {};
  const education = toArray(fi.education);
  const currentPositions = toArray(fi.positions);
  const previousPositions = toArray(fi.prev_positions);
  const grants = toArray(fi.grants);
  const funding = toArray(fi.funding);

  const km = findBy(education, (entry) => pickString(entry.degree).includes("maisteri"));
  const dissertation = findBy(education, (entry) => pickString(entry.degree).includes("tohtori"));
  const researchAssistant = findBy(previousPositions, (entry) => pickString(entry.title) === "Tutkimusavustaja");
  const doctoralStudent = findBy(previousPositions, (entry) => pickString(entry.title) === "Tutkijakoulutettava");
  const universityTeacher = findBy(previousPositions, (entry) => pickString(entry.title) === "Yliopisto-opettaja");
  const universityLecturer = findBy(currentPositions, (entry) => pickString(entry.title) === "Yliopistonlehtori");
  const entrepreneurship = findBy(currentPositions, (entry) => pickString(entry.institution).includes("Larux"));
  const grant2005 = findBy(grants, (entry) => pickString(entry.year).startsWith("2005"));
  const grant2010 = findBy(grants, (entry) => pickString(entry.year).startsWith("2010"));

  const authorities = new Map();

  if (km) {
    authorities.set("cv-education-km", createAuthority({
      key: "cv-education-km",
      sourceKind: "cv.education",
      label: "cv.fi.education: KM",
      year: km.year,
      title: km.degree,
      href: "/cv/",
      fields: ["year"]
    }));
  }

  if (dissertation) {
    authorities.set("cv-education-dissertation", createAuthority({
      key: "cv-education-dissertation",
      sourceKind: "cv.education",
      label: "cv.fi.education: KT",
      year: dissertation.year,
      title: dissertation.degree,
      href: "/vaitoskirja/",
      fields: ["year", "href"]
    }));
  }

  if (researchAssistant) {
    authorities.set("cv-prev-research-assistant", createAuthority({
      key: "cv-prev-research-assistant",
      sourceKind: "cv.prev_positions",
      label: "cv.fi.prev_positions: Tutkimusavustaja",
      year: researchAssistant.period,
      title: `${researchAssistant.title} EDTECH-yksikössä`,
      href: "/cv/",
      fields: ["year", "title", "href"]
    }));
  }

  if (doctoralStudent) {
    authorities.set("cv-prev-doctoral-student", createAuthority({
      key: "cv-prev-doctoral-student",
      sourceKind: "cv.prev_positions",
      label: "cv.fi.prev_positions: Tutkijakoulutettava",
      year: doctoralStudent.period,
      title: "Tutkijakoulutettava (OPMON)",
      href: "/cv/",
      fields: ["year", "title", "href"]
    }));
  }

  if (universityTeacher) {
    authorities.set("cv-prev-university-teacher", createAuthority({
      key: "cv-prev-university-teacher",
      sourceKind: "cv.prev_positions",
      label: "cv.fi.prev_positions: Yliopisto-opettaja",
      year: universityTeacher.period,
      title: `${universityTeacher.title}, ${pickString(universityTeacher.note)}`,
      href: "/cv/",
      fields: ["year", "title", "href"]
    }));
  }

  if (universityLecturer) {
    authorities.set("cv-current-university-lecturer", createAuthority({
      key: "cv-current-university-lecturer",
      sourceKind: "cv.positions",
      label: "cv.fi.positions: Yliopistonlehtori",
      year: universityLecturer.period,
      title: "Yliopistonlehtori (nykyinen tehtävä)",
      href: "/tyoni-yliopistonlehtorina/",
      fields: ["year", "title", "href"]
    }));
  }

  if (entrepreneurship) {
    authorities.set("cv-current-entrepreneurship", createAuthority({
      key: "cv-current-entrepreneurship",
      sourceKind: "cv.positions",
      label: "cv.fi.positions: Larux t:mi",
      year: entrepreneurship.period,
      title: "Larux tmi käynnistyy (toukokuu 2010)",
      href: "/kouluttaja/",
      fields: ["year", "title", "href"]
    }));
  }

  if (grant2005) {
    authorities.set("cv-grant-2005", createAuthority({
      key: "cv-grant-2005",
      sourceKind: "cv.grants",
      label: "cv.fi.grants: 2005–2006",
      year: grant2005.year,
      title: "Kulttuurirahaston tutkimusapuraha (2005–2006)",
      href: "/tutkimus/",
      fields: ["year", "title", "href"]
    }));
  }

  if (grant2010) {
    authorities.set("cv-grant-2010", createAuthority({
      key: "cv-grant-2010",
      sourceKind: "cv.grants",
      label: "cv.fi.grants: 2010–2011",
      year: grant2010.year,
      title: "Kulttuurirahaston tutkimusapuraha (2010–2011)",
      href: "/tutkimus/",
      fields: ["year", "title", "href"]
    }));
  }

  toArray(funding).forEach((entry) => {
    const name = pickString(entry.project);
    if (!name) return;
    authorities.set(`cv-funding-${name.toLowerCase()}`, createAuthority({
      key: `cv-funding-${name.toLowerCase()}`,
      sourceKind: "cv.funding",
      label: `cv.fi.funding: ${name}`,
      year: entry.period,
      title: name,
      href: "/tutkimus/#hankkeet",
      fields: ["year"]
    }));
  });

  return authorities;
}

function buildResearchProjectAuthorities(researchProjects = []) {
  return new Map(
    toArray(researchProjects).map((entry) => {
      const name = pickString(entry.name);
      const title = [
        entry.funder ? `${entry.funder}: ` : "",
        name,
        entry.period ? `-hanke (${entry.period})` : ""
      ].join("").replace(": Rotuaari-hanke", "in Rotuaari-hanke");

      const localizedTitle = (() => {
        if (name === "Rotuaari") return `TEKESin ${name}-hanke (${entry.period})`;
        if (name === "Mosil") return `${name}-hanke (${entry.period}, EU Kaleidoscope NoE)`;
        if (name === "LEA") return `${name}-hanke (${entry.period}, EU Horizon 2020)`;
        if (name === "MakeCT") return `${name}-hanke käynnistyy (${entry.period})`;
        if (name === "Generation AI") return `${name} -tutkimusohjelma käynnistyy (${entry.period})`;
        if (name === "TKAEDITE") return `${name}-hanke (${entry.period}, Erasmus+)`;
        return `${name} (${entry.period})`;
      })();

      return [
        `research-project-${name.toLowerCase()}`,
        createAuthority({
          key: `research-project-${name.toLowerCase()}`,
          sourceKind: "researchProjects",
          label: `researchProjects: ${name}`,
          year: entry.period,
          title: localizedTitle,
          href: "/tutkimus/#hankkeet",
          fields: ["year", "title", "href"],
          details: { fullName: pickString(entry.fullName) }
        })
      ];
    })
  );
}

function buildElectionAuthorities(electionHistory = {}) {
  const terms = toArray(electionHistory.terms);
  const authorities = new Map();

  [
    { termId: "2013-2017", milestoneYear: 2012 },
    { termId: "2017-2021", milestoneYear: 2017 },
    { termId: "2021-2025", milestoneYear: 2021 },
    { termId: "2025-2029", milestoneYear: 2025 }
  ].forEach(({ termId, milestoneYear }) => {
    const term = terms.find((entry) => entry.id === termId);
    if (!term) return;
    const period = pickString(term.localized?.fi?.period);
    authorities.set(`election-term-${termId}`, createAuthority({
      key: `election-term-${termId}`,
      sourceKind: "electionHistory",
      label: `electionHistory term ${termId}`,
      year: milestoneYear,
      title: `Vaalikausi ${period} (Oulu)`,
      href: "/politiikka/vaalikaudet/",
      fields: ["year", "title", "href"],
      details: {
        termId,
        period,
        roleTitle: pickString(term.localized?.fi?.title)
      }
    }));
  });

  return authorities;
}

function buildAuthorityMap({ cvData, researchProjects, electionHistory }) {
  const authorities = new Map();
  [
    buildCvAuthorities(cvData),
    buildResearchProjectAuthorities(researchProjects),
    buildElectionAuthorities(electionHistory)
  ].forEach((sourceMap) => {
    sourceMap.forEach((value, key) => authorities.set(key, value));
  });
  return authorities;
}

function buildMilestoneFromDefinition(definition, authorities) {
  const sourceAuthority = definition.sourceKey
    ? authorities.get(definition.sourceKey) || null
    : null;

  if (definition.sourceKey && !sourceAuthority) {
    throw new Error(`Missing home milestone authority: ${definition.sourceKey}`);
  }

  const title = pickString(definition.title) || pickString(sourceAuthority?.title);
  const href = pickString(definition.href) || pickString(sourceAuthority?.href);
  const description = pickString(definition.description);
  const category = pickString(definition.category);
  const year = requireYear(
    definition.year ?? sourceAuthority?.year,
    `home milestone requires year for ${definition.id}`
  );

  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(`home milestone requires valid category for ${definition.id}`);
  }
  if (!title) {
    throw new Error(`home milestone requires title for ${definition.id}`);
  }
  if (!description) {
    throw new Error(`home milestone requires description for ${definition.id}`);
  }
  if (!href || !href.startsWith("/")) {
    throw new Error(`home milestone requires local href for ${definition.id}`);
  }

  return {
    id: pickString(definition.id),
    year: String(year),
    category,
    title,
    description,
    href,
    phaseStart: definition.phaseStart || null,
    authority: sourceAuthority
      ? {
          ...sourceAuthority,
          companionFields: toArray(definition.companionFields)
        }
      : null,
    classification: pickString(definition.classification || (sourceAuthority ? "B/D" : "C")),
    targetLabel: pickString(definition.targetLabel),
    currentSourceState: pickString(definition.currentSourceState)
  };
}

function compareMilestones(left = {}, right = {}) {
  const yearDiff = Number.parseInt(left.year, 10) - Number.parseInt(right.year, 10);
  if (yearDiff !== 0) return yearDiff;
  return Number.parseInt(left.order || 0, 10) - Number.parseInt(right.order || 0, 10);
}

function buildHomeMilestones({ definitions = [], cvData = {}, researchProjects = [], electionHistory = {} }) {
  const authorities = buildAuthorityMap({ cvData, researchProjects, electionHistory });
  const seenIds = new Set();

  const milestones = toArray(definitions).map((definition, index) => {
    const item = buildMilestoneFromDefinition(definition, authorities);
    if (!item.id) {
      throw new Error(`home milestone requires id at index ${index}`);
    }
    if (seenIds.has(item.id)) {
      const error = new Error("duplicate milestone id");
      error.code = "duplicate-milestone-id";
      error.values = [item.id];
      throw error;
    }
    seenIds.add(item.id);
    return {
      ...item,
      order: index
    };
  });

  const sorted = [...milestones].sort(compareMilestones);
  const orderingViolations = sorted
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => milestones[index]?.id !== item.id)
    .map(({ item }) => item.id);

  const invalidPhasePlacement = milestones
    .map((item, index) => {
      if (!item.phaseStart || index === 0) return null;
      const previous = milestones[index - 1];
      if (!previous) return item.id;
      return Number.parseInt(previous.year, 10) > Number.parseInt(item.year, 10)
        ? item.id
        : null;
    })
    .filter(Boolean);

  const duplicateTargetUrls = Object.entries(
    milestones.reduce((acc, item) => {
      acc[item.href] = (acc[item.href] || 0) + 1;
      return acc;
    }, {})
  )
    .filter(([, count]) => count > 1)
    .map(([href, count]) => ({ href, count }));

  const categoryCounts = milestones.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return {
    milestones: milestones.map(({ order, ...item }) => item),
    milestoneCount: milestones.length,
    phaseCount: milestones.filter((item) => item.phaseStart).length,
    categoryCounts,
    authoritativeSourceBackedCount: milestones.filter((item) => item.authority).length,
    companionOnlyCount: milestones.filter((item) => !item.authority).length,
    unresolvedAuthorityCount: milestones.filter((item) => item.classification.includes("E")).length,
    duplicateTargetUrls,
    missingUrls: milestones.filter((item) => !item.href).map((item) => item.id),
    missingYears: milestones.filter((item) => !item.year).map((item) => item.id),
    orderingViolations,
    invalidPhasePlacement
  };
}

module.exports = {
  VALID_CATEGORIES,
  buildAuthorityMap,
  buildHomeMilestones
};
