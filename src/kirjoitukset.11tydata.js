const {
  buildWritingsPageModel,
  buildFinnishWritingsViewModel
} = require("./_data/writingsPage");

module.exports = {
  eleventyComputed: {
    writingsPage: (data) => buildWritingsPageModel(data),
    finnishWritingsPage: (data) => buildFinnishWritingsViewModel(data)
  }
};
