import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const REPO_ROOT = process.cwd();
const PRESENTER_SOURCE = fs.readFileSync(path.join(REPO_ROOT, 'src/js/search-result-presenter.js'), 'utf8');
const COMPONENT_CSS = fs.readFileSync(path.join(REPO_ROOT, 'src/css/modules/_components.css'), 'utf8');

async function mountMediaResult(page, { lang = 'fi', theme = 'light', data }) {
  await page.setContent(`<!doctype html>
    <html lang="${lang}" data-bs-theme="${theme}">
      <head>
        <meta charset="utf-8">
        <style>${COMPONENT_CSS}</style>
      </head>
      <body>
        <ul data-search-modular-results></ul>
        <script>${PRESENTER_SOURCE}</script>
      </body>
    </html>`);

  await page.evaluate((resultData) => {
    const list = document.querySelector('[data-search-modular-results]');
    list.innerHTML = window.SearchResultPresenter.renderSharedCard(resultData);
  }, data);
}

test.describe('PF5-G3A media presenter browser harness', () => {
  test('thumbnail result preserves UL/LI semantics and renders localized primary meta + decorative image', async ({ page }) => {
    await mountMediaResult(page, {
      lang: 'fi',
      data: {
        url: '/mediassa/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/',
        title: '24 myyttiä tekoälystä ja datasta -joulukalenteri',
        excerpt: 'Generation AI -sarja <mark>tekoälystä</mark> ja datasta.',
        filters: { 'Sisältö': ['Mediassa'] },
        meta: {
          year: '2025',
          mediaType: 'video',
          mediaTypeLabelFi: 'Video',
          mediaRole: 'interviewer',
          mediaRoleLabelFi: 'Haastattelijana',
          mediaOutlet: 'Generation AI / YouTube',
          thumbnail: 'https://i.ytimg.com/vi/-pCxUQ9qbyE/hqdefault.jpg'
        }
      }
    });

    const list = page.locator('[data-search-modular-results]');
    const item = list.locator('> li[data-search-result-kind="media"]').first();
    await expect(list).toHaveJSProperty('tagName', 'UL');
    await expect(item).toHaveJSProperty('tagName', 'LI');
    await expect(item.locator('.find-explore-result-primary-meta')).toContainText('Video');
    await expect(item.locator('.find-explore-result-primary-meta')).toContainText('Haastattelijana');
    await expect(item.locator('.find-explore-result-primary-meta')).toContainText('Generation AI / YouTube');
    await expect(item.locator('.find-explore-result-media-thumb img')).toBeVisible();
    await expect(item.locator('.find-explore-result-media-thumb img')).toHaveAttribute('alt', '');
  });

  test('no-thumbnail result stays clean without an empty image container', async ({ page }) => {
    await mountMediaResult(page, {
      lang: 'en',
      data: {
        url: '/mediassa/anna-liisa-vatjus-anttila-muistelee/',
        title: 'Anna-Liisa Vatjus-Anttila muistelee',
        excerpt: 'Audio interview archive.',
        filters: { 'Sisältö': ['Mediassa'] },
        meta: {
          year: '1999',
          mediaType: 'podcast',
          mediaTypeLabelEn: 'Podcast',
          mediaRole: 'interviewer',
          mediaRoleLabelEn: 'As interviewer',
          mediaOutlet: 'SoundCloud / Jari Laru'
        }
      }
    });

    const item = page.locator('[data-search-modular-results] > li[data-search-result-kind="media"]').first();
    await expect(item.locator('.find-explore-result-primary-meta')).toContainText('Podcast');
    await expect(item.locator('.find-explore-result-primary-meta')).toContainText('As interviewer');
    await expect(item.locator('.find-explore-result-primary-meta')).toContainText('SoundCloud / Jari Laru');
    await expect(item.locator('.find-explore-result-media-thumb')).toHaveCount(0);
    await expect(item).not.toHaveClass(/find-explore-result--with-thumbnail/);
  });

  test('mobile dark theme keeps the thumbnail card single-column without bullets or layout shift', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mountMediaResult(page, {
      lang: 'fi',
      theme: 'dark',
      data: {
        url: '/mediassa/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/',
        title: '24 myyttiä tekoälystä ja datasta -joulukalenteri',
        excerpt: 'Generation AI -sarja <mark>tekoälystä</mark> ja datasta.',
        filters: { 'Sisältö': ['Mediassa'] },
        meta: {
          year: '2025',
          mediaType: 'video',
          mediaTypeLabelFi: 'Video',
          mediaRole: 'interviewer',
          mediaRoleLabelFi: 'Haastattelijana',
          mediaOutlet: 'Generation AI / YouTube',
          thumbnail: 'https://i.ytimg.com/vi/-pCxUQ9qbyE/hqdefault.jpg'
        }
      }
    });

    const layout = await page.locator('[data-search-modular-results] > li[data-search-result-kind="media"]').first().evaluate((item) => {
      const list = item.parentElement;
      const mediaLayout = item.querySelector('.find-explore-result-media-layout');
      const thumb = item.querySelector('.find-explore-result-media-thumb');
      const thumbImage = item.querySelector('.find-explore-result-media-thumb-image');
      const listStyle = getComputedStyle(list);
      const layoutStyle = getComputedStyle(mediaLayout);
      const thumbStyle = getComputedStyle(thumb);
      return {
        theme: document.documentElement.getAttribute('data-bs-theme'),
        listTag: list?.tagName,
        listStyleType: listStyle.listStyleType,
        paddingLeft: listStyle.paddingLeft,
        layoutDisplay: layoutStyle.display,
        layoutColumns: layoutStyle.gridTemplateColumns,
        isSingleColumn: !layoutStyle.gridTemplateColumns.includes(' '),
        thumbAspectRatio: thumbStyle.aspectRatio,
        thumbWidth: Math.round(thumb.getBoundingClientRect().width),
        thumbImageHeight: Math.round(thumbImage.getBoundingClientRect().height)
      };
    });

    expect(layout.theme).toBe('dark');
    expect(layout.listTag).toBe('UL');
    expect(layout.listStyleType).toBe('none');
    expect(layout.paddingLeft).toBe('0px');
    expect(layout.layoutDisplay).toBe('grid');
    expect(layout.isSingleColumn).toBe(true);
    expect(layout.thumbAspectRatio).toBe('16 / 9');
    expect(layout.thumbWidth).toBeGreaterThan(150);
    expect(layout.thumbImageHeight).toBeGreaterThan(90);
  });
});
