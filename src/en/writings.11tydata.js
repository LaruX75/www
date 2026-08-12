const { buildEnglishWritingsViewModel } = require("../_data/writingsPage");

module.exports = {
  eleventyComputed: {
    englishWritingsPage: (data) => buildEnglishWritingsViewModel(data)
  }
};
