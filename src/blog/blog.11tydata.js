const path = require("path");
const writingRoles = require("../_data/writingRoles");

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
}

function resolveWritingRoles(data) {
  const inputPath = data.page?.inputPath || data.inputPath || "";
  const basename = path.basename(inputPath, path.extname(inputPath));
  const explicitRoles = toArray(writingRoles.blog?.[basename]);
  const mergedRoles = new Set([...explicitRoles, ...toArray(data.writingRoles)]);
  return Array.from(mergedRoles);
}

module.exports = {
  layout: "blog-post.njk",
  tags: "blog",
  lang: "fi",
  eleventyComputed: {
    writingRoles: (data) => resolveWritingRoles(data),
    tags: (data) => {
      const tagSet = new Set(toArray(data.tags));
      const roleList = resolveWritingRoles(data);
      tagSet.add("blog");

      roleList.forEach((role) => {
        tagSet.add(`blog_${role}`);
        tagSet.add(`writing_${role}`);
      });
      if (roleList.includes("political") && roleList.includes("expert")) {
        tagSet.add("blog_hybrid");
        tagSet.add("writing_hybrid");
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
