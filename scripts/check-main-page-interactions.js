#!/usr/bin/env node
// Run against a built, Pagefind-indexed site served locally.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const baseURL = process.env.PARITY_BASE_URL || 'http://127.0.0.1:4187';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = [];
  async function go(path) { await page.goto(baseURL + path, {waitUntil:'domcontentloaded'}); }
  async function search(path, query) {
    await go(path);
    await page.locator('[data-find-explore-ready="true"]').first().waitFor();
    const input = page.locator('[data-find-explore-query]').first();
    await input.fill(query);
    await input.press('Enter');
    await page.waitForFunction(() => /\d|No results found|Tuloksia ei löytynyt/.test(document.querySelector('[data-find-explore-status]')?.textContent || ''), null, {timeout:20000});
    await page.waitForTimeout(300);
    const status = await page.locator('[data-find-explore-status]').first().innerText();
    const count = Number(status.match(/\d+/)?.[0] || 0);
    assert.equal(await page.locator('html').getAttribute('lang'), path.startsWith('/en/') ? 'en' : 'fi', 'Search must restore the page language');
    return {count,status};
  }
  try {
    for (const query of ['learning','TPACK','paritynomatchxyz']) {
      const fi = await search('/julkaisut/',query), en = await search('/en/publications/',query);
      assert.equal(en.count, fi.count, `Publication search differs for ${query}`);
      if (query !== 'paritynomatchxyz') assert.ok(en.count > 0, `Missing results for ${query}`);
      else assert.equal(en.count,0);
      results.push({check:'publication search',query,fi,en});
    }
    for (const path of ['/julkaisut/','/en/publications/']) {
      await go(path);
      const button = page.locator('.export-citation-btn').first();
      await button.click();
      await page.locator('#citationExportModal.show').waitFor();
      const preview = page.locator('#citationOutput');
      // The modal must contain a real citation, not just its empty structure.
      assert.ok((await preview.inputValue()).trim().length > 20);
      results.push({check:'citation preview',path,buttons:await page.locator('.export-citation-btn').count()});
    }
    for (const path of ['/mediassa/','/en/media/']) {
      await go(path);
      await page.waitForFunction(() => /\d/.test(document.querySelector('[data-media-browser-status]')?.textContent || ''));
      await page.locator('[data-media-filter="type:podcast"]').click();
      const status = await page.locator('[data-media-browser-status]').innerText();
      assert.equal(Number(status.match(/\d+/)?.[0]),4);
      results.push({check:'podcast filter',path,status});
    }
    await go('/en/writings/#lausunnot');
    await page.waitForURL('**/en/statements/#lausunnot');
    results.push({check:'legacy writing link',destination:new URL(page.url()).pathname});
    assert.deepEqual(errors, [], 'Browser JavaScript exceptions');
    console.log(JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
