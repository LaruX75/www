#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const siteRoot = path.resolve('_site');
const siteOrigin = 'https://www.jarilaru.fi';

function walkHtmlFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(full, list);
    } else if (entry.isFile() && full.endsWith('.html')) {
      list.push(full);
    }
  }
  return list;
}

function normalizePath(href) {
  if (!href) return null;
  let value = href.trim();
  if (!value) return null;

  // Strip fragment and query.
  value = value.split('#')[0].split('?')[0];
  if (!value) return null;

  if (value.startsWith('mailto:') || value.startsWith('tel:')) return null;

  if (value.startsWith(siteOrigin)) {
    value = value.slice(siteOrigin.length);
  }

  if (!value.startsWith('/')) {
    return null;
  }

  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

function urlExistsInSite(urlPath) {
  if (!urlPath) return true;

  const asDir = path.join(siteRoot, urlPath, 'index.html');
  const asFile = path.join(siteRoot, urlPath);
  const asHtml = path.join(siteRoot, `${urlPath}.html`);

  return fs.existsSync(asDir) || fs.existsSync(asFile) || fs.existsSync(asHtml);
}

function findAll(regex, input) {
  const matches = [];
  let m;
  while ((m = regex.exec(input)) !== null) {
    matches.push(m);
  }
  return matches;
}

function run() {
  if (!fs.existsSync(siteRoot)) {
    console.error('ERROR: _site directory not found. Build the site first.');
    process.exit(1);
  }

  const htmlFiles = walkHtmlFiles(siteRoot);
  const errors = [];

  const langSwitchRegex = /<a[^>]*aria-label="(?:Vaihda kieleksi suomi|Switch language to English)"[^>]*href="([^"]+)"/g;
  const hreflangRegex = /<link[^>]*rel="alternate"[^>]*hreflang="(fi|en|x-default)"[^>]*href="([^"]+)"/g;

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');

    // 1) Language switch links should not point to missing local paths.
    for (const match of findAll(langSwitchRegex, html)) {
      const href = match[1];
      const normalized = normalizePath(href);
      if (normalized && !urlExistsInSite(normalized)) {
        errors.push(`Language switch target missing: ${file} -> ${href}`);
      }
    }

    // 2) hreflang alternate links should resolve to existing local URLs.
    for (const match of findAll(hreflangRegex, html)) {
      const lang = match[1];
      const href = match[2];
      const normalized = normalizePath(href);
      if (normalized && !urlExistsInSite(normalized)) {
        errors.push(`hreflang (${lang}) target missing: ${file} -> ${href}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`ERROR: i18n/SEO check failed with ${errors.length} issue(s).`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`OK: i18n/SEO check passed for ${htmlFiles.length} HTML files.`);
}

run();
