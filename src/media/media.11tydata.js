module.exports = {
  layout: "page.njk",
  lang: "fi",
  eleventyComputed: {
    tags: (data) => {
      const tagSet = new Set(["media"]);

      if (data.mediaRole) {
        tagSet.add(`media_${data.mediaRole}`);
      }

      if (data.mediaType) {
        tagSet.add(`media_type_${data.mediaType}`);
      }

      return Array.from(tagSet);
    }
  },
  permalink: function (data) {
    const hasExplicitDate = Object.prototype.hasOwnProperty.call(data, "date") && data.date;
    if (!hasExplicitDate) {
      return `/mediassa/${data.page.fileSlug}/`;
    }

    const d = data.page.date;
    if (!d) return `/mediassa/${data.page.fileSlug}/`;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `/mediassa/${y}/${m}/${day}/${data.page.fileSlug}/`;
  }
};
