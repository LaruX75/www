const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');
const cheerio = require('cheerio');
const root = path.join(__dirname, '../..');
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, 'src/_includes')));
require('../../eleventy.filters')({
  addFilter: (name, fn) => env.addFilter(name, fn),
  getFilter: name => env.getFilter(name),
  addAsyncShortcode: () => {}
});
env.addFilter('url', value => value);

test('both homepages render the same factual counts from shared data, without stale citation claims', () => {
  const shared = fs.readFileSync(path.join(root, 'src/_includes/pages/home.njk'), 'utf8');
  assert.equal(shared.includes('600+'), false);
  const data = {
    collections: {presentations: [], publications: [], pub_puhe: [{},{}]},
    researchfi: [{},{},{}], theses: {stats:{total:4}}, mediaArchive: {all:[{}]},
    pageContent: {etusivu:{hero:{},intro:{cta1:{}},paths:{cards:[]},roles:{cards:[]}}},
    testimonials: {locales:{fi:{},en:{}},items:[]}
  };
  const counts = lang => {
    const html = env.render('pages/home.njk', {...data,lang});
    const $ = cheerio.load(html);
    assert.equal($('h1').length, 1);
    return $('.home-hero-kpi-value').map((_,el)=>$(el).text().trim()).get();
  };
  assert.deepEqual(counts('fi'), ['4','3','2','1','0']);
  assert.deepEqual(counts('en'), counts('fi'));
});
