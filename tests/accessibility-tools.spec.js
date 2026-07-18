import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const REPRESENTATIVE_PAGES = [
    { name: 'Homepage', path: '/' },
    { name: 'Writings', path: '/kynasta/' },
    { name: 'Presentations', path: '/esitykset/' },
    { name: 'University work', path: '/tyoni-yliopistonlehtorina/' },
    {
        name: 'Council speech',
        path: '/2026/04/27/puheenvuoro-valtuustossa-haukiputaan-jokiranta-asemakaava-politiikan-hitaus/',
    },
];

const DEFAULT_A11Y = {
    textSize: 'normal',
    highContrast: false,
    reducedMotion: false,
    screenReaderAssist: false,
    dyslexiaFont: false,
    textSpacing: false,
    readingGuide: false,
    backgroundColor: '',
};

function normalizeRgb(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

async function loadWithA11y(page, path, settings, theme = 'light') {
    await page.addInitScript(({ selectedTheme, a11ySettings }) => {
        window.localStorage.setItem('theme', selectedTheme);
        window.localStorage.setItem('a11y-settings', JSON.stringify(a11ySettings));
    }, {
        selectedTheme: theme,
        a11ySettings: { ...DEFAULT_A11Y, ...settings },
    });

    await gotoAndAssertSite(page, path);
}

async function computedStyle(page, selector) {
    const locator = page.locator(selector).first();
    await expect(locator).toBeVisible();

    return locator.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            borderColor: style.borderTopColor,
            backgroundImage: style.backgroundImage,
        };
    });
}

test.describe('Accessibility colour modes', () => {
    const VISIBLE_SURFACE_SELECTOR = [
        'main .card:visible',
        'main [class*="-card"]:visible',
        'main .table:visible',
        'main .content-context-card:visible',
    ].join(', ');

    for (const auditPage of REPRESENTATIVE_PAGES) {
        test(`high contrast controls shared colours on ${auditPage.name}`, async ({ page }) => {
            await loadWithA11y(page, auditPage.path, { highContrast: true }, 'dark');

            await expect(page.locator('html')).toHaveClass(/a11y-high-contrast/);

            const bodyStyle = await computedStyle(page, 'body');
            expect(normalizeRgb(bodyStyle.backgroundColor)).toBe('rgb(0, 0, 0)');
            expect(normalizeRgb(bodyStyle.color)).toBe('rgb(255, 255, 255)');

            const surfaceStyle = await computedStyle(page, VISIBLE_SURFACE_SELECTOR);
            expect(normalizeRgb(surfaceStyle.backgroundColor)).toBe('rgb(0, 0, 0)');
            expect(surfaceStyle.backgroundImage).toBe('none');

            const linkCount = await page.locator('main a:not(.btn):not(.badge):visible').count();
            if (linkCount > 0) {
                const linkStyle = await computedStyle(page, 'main a:not(.btn):not(.badge):visible');
                expect(normalizeRgb(linkStyle.color)).toBe('rgb(255, 255, 0)');
            }
        });
    }

    test('background colour mode uses light readable surfaces', async ({ page }) => {
        await loadWithA11y(page, '/esitykset/', { backgroundColor: 'blue' }, 'dark');

        await expect(page.locator('html')).toHaveAttribute('data-a11y-bg', 'blue');

        const bodyStyle = await computedStyle(page, 'body');
        expect(normalizeRgb(bodyStyle.backgroundColor)).toBe('rgb(220, 236, 255)');
        expect(normalizeRgb(bodyStyle.color)).toBe('rgb(17, 24, 39)');

        const surfaceStyle = await computedStyle(page, VISIBLE_SURFACE_SELECTOR);
        expect(normalizeRgb(surfaceStyle.color)).toBe('rgb(17, 24, 39)');
        expect(surfaceStyle.backgroundImage).toBe('none');

        const linkStyle = await computedStyle(page, 'main a:not(.btn):not(.badge)');
        expect(normalizeRgb(linkStyle.color)).toBe('rgb(3, 78, 162)');
    });

    test('high contrast wins over a selected background colour', async ({ page }) => {
        await loadWithA11y(page, '/kynasta/', {
            highContrast: true,
            backgroundColor: 'yellow',
        }, 'light');

        await expect(page.locator('html')).toHaveClass(/a11y-high-contrast/);
        await expect(page.locator('html')).toHaveAttribute('data-a11y-bg', 'yellow');

        const bodyStyle = await computedStyle(page, 'body');
        expect(normalizeRgb(bodyStyle.backgroundColor)).toBe('rgb(0, 0, 0)');
        expect(normalizeRgb(bodyStyle.color)).toBe('rgb(255, 255, 255)');
    });
});
