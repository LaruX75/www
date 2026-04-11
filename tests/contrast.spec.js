import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';
import {
    BUTTON_AUDIT_PAGES,
    auditButtonContrastOnPage,
    auditTextContrastForSelectors,
    formatContrastIssues,
} from './helpers/contrast.js';

test.describe('Button Contrast Audits', () => {
    test.setTimeout(120000);
    for (const auditPage of BUTTON_AUDIT_PAGES) {
        test(`${auditPage.name} buttons meet contrast requirements`, async ({ page }) => {
            await gotoAndAssertSite(page, auditPage.path);
            const issues = await auditButtonContrastOnPage(page, auditPage);

            expect(
                issues,
                issues.length > 0
                    ? `Button contrast issues found on ${auditPage.path}\n${formatContrastIssues(issues)}`
                    : `No button contrast issues found on ${auditPage.path}`
            ).toEqual([]);
        });
    }

    test('Site changes KPI text meets contrast requirements in both themes', async ({ page }) => {
        const auditPages = [
            { name: 'Site Changes', path: '/sivuston-muutokset/' },
            { name: 'Site Changes (EN)', path: '/en/site-changes/' },
        ];
        const selectors = [
            '.site-changes-kpi-value--primary',
            '.site-changes-kpi-value--success',
            '.site-changes-kpi-value--date',
            '.site-changes-kpi-label',
        ];

        for (const theme of ['light', 'dark']) {
            for (const auditPage of auditPages) {
                await gotoAndAssertSite(page, '/');
                await page.evaluate((selectedTheme) => {
                    window.localStorage.setItem('theme', selectedTheme);
                }, theme);

                await page.goto(auditPage.path);
                await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);

                const issues = await auditTextContrastForSelectors(page, {
                    ...auditPage,
                    name: `${auditPage.name} (${theme})`,
                }, selectors);

                expect(
                    issues,
                    issues.length > 0
                        ? `Text contrast issues found on ${auditPage.path} in ${theme} theme\n${formatContrastIssues(issues)}`
                        : `No text contrast issues found on ${auditPage.path} in ${theme} theme`
                ).toEqual([]);
            }
        }
    });
});
