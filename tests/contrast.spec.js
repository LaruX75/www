import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';
import {
    BUTTON_AUDIT_PAGES,
    auditButtonContrastOnPage,
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
});
