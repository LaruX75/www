const {pageText} = require('../_utils/pageLocale');
module.exports = {eleventyComputed:{topicTitleEn:data => pageText(data.topic?.title || 'Topic profile','en'),topicDescriptionEn:data=>pageText(data.topic?.description || data.topic?.lead || 'Topic profile','en')}};
