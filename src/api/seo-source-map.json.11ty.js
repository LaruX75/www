module.exports = class {
  data() {
    return {
      permalink: "/api/seo-source-map.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const items = (data.collections.all || [])
      .filter((item) => item?.url && item?.inputPath && String(item.inputPath).startsWith("./src/"))
      .map((item) => ({
        path: item.url,
        inputPath: String(item.inputPath).replace(/^\.\//, ""),
        title: item.data?.title || "",
        ogImageOverride: item.data?.og_image || item.data?.ogImageOverride || ""
      }));

    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      items
    });
  }
};
