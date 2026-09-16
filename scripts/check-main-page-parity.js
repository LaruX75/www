#!/usr/bin/env node
// Main-page contract: each locale has the intended reciprocal partner, and
// local navigation reaches an existing page/anchor. Original documents may be FI.
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const { routes } = require('../src/_utils/pageLocale');
const topics = require('../src/_data/seoTopics');

function checkMainPageParity(siteRoot) {
  const pairs = Object.entries(routes).filter(([fi]) => !['/blogi/', '/sidonnaisuudet/'].includes(fi));
  for (const topic of topics) pairs.push([`/teemat/${topic.slug}/`, `/en/topics/${topic.slug}/`]);
  const cache = new Map();
  const errors = new Set();
  function read(url) {
    let pathname = new URL(url, 'https://www.jarilaru.fi').pathname;
    const candidates = new Set([pathname, decodeURI(pathname), encodeURI(decodeURI(pathname))]);
    for (const candidate of candidates) {
      const base = path.join(siteRoot, candidate);
      for (const file of [path.join(base, 'index.html'), base, base + '.html']) {
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
        if (!file.endsWith('.html')) return { asset: true };
        if (!cache.has(file)) cache.set(file, cheerio.load(fs.readFileSync(file, 'utf8')));
        return { $: cache.get(file) };
      }
    }
    return null;
  }
  for (const pair of pairs) {
    for (const [index, url] of pair.entries()) {
      const lang = index ? 'en' : 'fi', otherLang = index ? 'fi' : 'en', other = pair[1 - index];
      const doc = read(url);
      if (!doc?.$) { errors.add(`Missing main page: ${url}`); continue; }
      const $ = doc.$;
      if ($('html').attr('lang') !== lang) errors.add(`Wrong document language: ${url}`);
      if ($('main h1').length !== 1) errors.add(`Expected one main heading: ${url}`);
      for (const [locale, expected] of [[lang, url], [otherLang, other]]) {
        const alts = $(`link[rel="alternate"][hreflang="${locale}"]`);
        if (alts.length !== 1 || new URL(alts.attr('href') || '/', 'https://www.jarilaru.fi').pathname !== expected) {
          errors.add(`Wrong ${locale} alternate on ${url}; expected ${expected}`);
        }
      }
      const switchLabel = lang === 'fi' ? 'Switch language to English' : 'Vaihda kieleksi suomi';
      const switches = $(`a[aria-label="${switchLabel}"]`);
      if (!switches.length || switches.toArray().some(a => new URL($(a).attr('href'), 'https://www.jarilaru.fi').pathname !== other)) {
        errors.add(`Wrong language switch on ${url}; expected ${other}`);
      }
      for (const a of $('main a[href], header a[href], nav a[href], footer a[href]').toArray()) {
        const href = $(a).attr('href');
        if (!href || href === '#' || !/^(\/|#|https?:\/\/(?:www\.)?jarilaru\.fi\/)/.test(href)) continue;
        const target = new URL(href, 'https://www.jarilaru.fi' + url);
        const targetDoc = read(target.href);
        if (!targetDoc) errors.add(`Broken link on ${url}: ${href}`);
        else if (target.hash && targetDoc.$) {
          const id = decodeURIComponent(target.hash.slice(1));
          if (!targetDoc.$('[id], a[name]').toArray().some(e => targetDoc.$(e).attr('id') === id || targetDoc.$(e).attr('name') === id)) {
            errors.add(`Missing anchor on ${url}: ${href}`);
          }
        }
      }
    }
  }
  return { pairs: pairs.length, errors: [...errors] };
}
if (require.main === module) {
  const result = checkMainPageParity(path.resolve(process.env.SITE_DIR || '_site'));
  result.errors.forEach(e => console.error(e));
  console.log(`${result.pairs} main-page pairs; ${result.errors.length} issue(s).`);
  process.exitCode = result.errors.length ? 1 : 0;
}
module.exports = { checkMainPageParity };
