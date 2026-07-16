const path = require("path");
const opinionRoles = require("../_data/opinionRoles");

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

module.exports = {
  layout: "page.njk",
  lang: "fi",
  eleventyComputed: {
    opinionRoles: (data) => resolveOpinionRoles(data),
    tags: (data) => {
      const tagSet = new Set(["publications", ...toArray(data.tags)]);

      if (data.type === "puhe") {
        tagSet.add("pub_puhe");
      }
      if (data.type === "kolumni") {
        tagSet.add("pub_kolumni");
      }
      if (data.type === "mielipide") {
        tagSet.add("pub_mielipide");
        const roles = resolveOpinionRoles(data);
        roles.forEach((role) => tagSet.add(`pub_mielipide_${role}`));
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
