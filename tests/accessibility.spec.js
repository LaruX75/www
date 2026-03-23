import { test } from '@playwright/test';
import { AXE_AUDIT_PAGES, runAxeAudit } from './helpers/a11y.js';

test.describe('Accessibility Audits', () => {
    for (const auditPage of AXE_AUDIT_PAGES) {
        test(`${auditPage.name} passes basic axe-core accessibility tests`, async ({ page }) => {
            try {
                await runAxeAudit(page, auditPage.path, {
                    detailedReport: true,
                    detailedReportOptions: { html: true },
                });
            } catch (e) {
                console.log(`${auditPage.name} AV Violations:`, e.message);
                throw e;
            }
        });
    }
});
