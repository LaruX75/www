import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';
import {
    BUTTON_AUDIT_PAGES,
    auditButtonContrastOnPage,
    auditTextContrastForSelectors,
    formatContrastIssues,
} from './helpers/contrast.js';

test.describe('Button Contrast Audits', () => {
    // Presentations archive (Slice 3 C1, commit 826bea4b) renders all 218
    // canonical presentation cards in SSR. JS init hides cards past the
    // first page-size but the visibility snapshot + per-button hover +
    // measureButtonState iteration still spans several hundred buttons
    // on /esitykset/ and /en/presentations/. The 120s per-test budget
    // is tight on CI runners; extend to 300s for this describe block
    // only. Other pages complete well under the old budget.
    test.setTimeout(300000);
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
