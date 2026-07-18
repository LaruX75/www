const path = require("path");
const opinionRoles = require("../_data/opinionRoles");
const writingRoles = require("../_data/writingRoles");
const { resolveContexts } = require("../_data/contentContext");

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
}

function deriveFallbackOpinionRoles(data) {
  if (data.type !== "mielipide") {
    return [];
  }

  const roles = new Set();
  const categories = toArray(data.categories).map((item) => item.toLowerCase());
  const secondaryThemes = toArray(data.secondaryTheme).map((item) => item.toLowerCase());
  const forum = toArray(data.forum).map((item) => item.toLowerCase());

  if (
    toArray(data.politicalProfiles).length > 0 ||
    categories.includes("politiikka ja päätöksenteko") ||
    categories.includes("vaalit") ||
    forum.includes("kaupunginvaltuusto") ||
    forum.includes("lautakunta") ||
    typeof data.campaign === "string"
  ) {
    roles.add("political");
  }

  const expertSignals = [
    "opettajankoulutus",
    "koulutusteknologia",
    "teknologiatuettu oppiminen ja opetus",
    "oppimisympäristöt ja tilat",
    "yliopisto ja korkeakoulut",
    "teknologia ja digitaalisuus",
    "sivistys ja koulutus"
  ];
  if ([...categories, ...secondaryThemes].some((item) => expertSignals.includes(item))) {
    roles.add("expert");
  }

  if (roles.size === 0) {
    roles.add("expert");
  }

  return Array.from(roles);
}

function isPoliticalPublication(data) {
  const categories = toArray(data.categories).map((item) => item.toLowerCase());
  const secondaryThemes = toArray(data.secondaryTheme).map((item) => item.toLowerCase());
  const forum = toArray(data.forum).map((item) => item.toLowerCase());

  return (
    toArray(data.politicalProfiles).length > 0 ||
    categories.includes("politiikka ja päätöksenteko") ||
    categories.includes("vaalit") ||
    secondaryThemes.includes("politiikka ja päätöksenteko") ||
    forum.includes("kaupunginvaltuusto") ||
    forum.includes("lautakunta") ||
    typeof data.campaign === "string"
  );
}

function resolveOpinionRoles(data) {
  if (data.type !== "mielipide") {
    return toArray(data.opinionRoles);
  }

  const inputPath = data.page?.inputPath || data.inputPath || "";
  const basename = path.basename(inputPath, path.extname(inputPath));
  const explicitRoles = toArray(opinionRoles[basename]);
  const mergedRoles = new Set([...explicitRoles, ...toArray(data.opinionRoles)]);

  if (mergedRoles.size > 0) {
    return Array.from(mergedRoles);
  }

  return deriveFallbackOpinionRoles(data);
}

function resolveWritingRoles(data) {
  const inputPath = data.page?.inputPath || data.inputPath || "";
  const basename = path.basename(inputPath, path.extname(inputPath));
  const explicitRoles = toArray(writingRoles.publications?.[basename]);
  const mergedRoles = new Set([...explicitRoles, ...toArray(data.writingRoles)]);

  if (data.type === "mielipide") {
    resolveOpinionRoles(data).forEach((role) => mergedRoles.add(role));
  }
  if (data.type === "lausunto") {
    mergedRoles.add("expert");
  }

  return Array.from(mergedRoles);
}

function resolveForum(data) {
  const forums = new Set(toArray(data.forum));
  const event = String(data.event || "").trim().toLowerCase();

  if (data.type === "puhe" && event === "oulun kaupunginvaltuusto") {
    forums.add("Kaupunginvaltuusto");
  }

  return Array.from(forums);
}

module.exports = {
  layout: "page.njk",
  lang: "fi",
  eleventyComputed: {
    layout: (data) => {
      const writingTypes = new Set(["puhe", "mielipide", "kolumni", "lausunto", "blogikirjoitus"]);
      return writingTypes.has(data.type) ? "writing-post.njk" : "page.njk";
    },
    forum: (data) => resolveForum(data),
    opinionRoles: (data) => resolveOpinionRoles(data),
    writingRoles: (data) => resolveWritingRoles(data),
    contexts: (data) => resolveContexts(data),
    tags: (data) => {
      const tagSet = new Set(["publications"]);
      const writingRoleList = resolveWritingRoles(data);
      const isHybridWriting = writingRoleList.includes("political") && writingRoleList.includes("expert");

      if (data.type === "puhe") {
        tagSet.add("pub_puhe");
      }
      if (data.type === "kolumni") {
        tagSet.add("pub_kolumni");
        writingRoleList.forEach((role) => tagSet.add(`pub_kolumni_${role}`));
      }
      if (data.type === "lausunto") {
        tagSet.add("pub_lausunto");
        writingRoleList.forEach((role) => tagSet.add(`pub_lausunto_${role}`));
      }
      if (data.type === "mielipide") {
        tagSet.add("pub_mielipide");
        const roles = resolveOpinionRoles(data);
        roles.forEach((role) => tagSet.add(`pub_mielipide_${role}`));
        if (roles.includes("political") && roles.includes("expert")) {
          tagSet.add("pub_mielipide_hybrid");
        }
      }

      writingRoleList.forEach((role) => tagSet.add(`writing_${role}`));
      if (isHybridWriting) {
        tagSet.add("writing_hybrid");
      }

      if (isPoliticalPublication(data)) {
        tagSet.add("politics");
      }

      return Array.from(tagSet);
    }
  },
  permalink: function (data) {
    const d = data.page.date;
    if (!d) return `/${data.page.fileSlug}/`;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `/${y}/${m}/${day}/${data.page.fileSlug}/`;
  }
};
