const { resolveContexts } = require("../_data/contentContext");

module.exports = {
    tags: "presentations",
    lang: "fi",
    eleventyComputed: {
        layout: () => "presentation-item.njk",
        contexts: (data) => resolveContexts(data)
    }
};
