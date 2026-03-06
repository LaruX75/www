import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Audits', () => {

    test('Homepage passes basic axe-core accessibility tests', async ({ page }) => {
        // Navigate to homepage
        await page.goto('/');

        // Inject axe-core into the page
        await injectAxe(page);

        // Run axe checking all accessibility rules
        // We can exclude certain known false positives using options if necessary
        try {
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
        } catch (e) {
            console.log("Homepage AV Violations:", e.message);
            throw e;
        }
    });

    test('Publications page passes basic axe-core accessibility tests', async ({ page }) => {
        await page.goto('/julkaisut/');
        await injectAxe(page);
        try {
            await checkA11y(page, null, { detailedReport: true });
        } catch (e) {
            console.log("Julkaisut AV Violations:", e.message);
            throw e;
        }
    });

    test('Theses page passes basic axe-core accessibility tests', async ({ page }) => {
        await page.goto('/opinnaytteet/');
        await injectAxe(page);
        await checkA11y(page, null, { detailedReport: true });
    });

    test('Megamenu navigation works and is accessible', async ({ page }) => {
        // Navigate to a page with Megamenu
        await page.goto('/');

        // The 'Minä' menu should be present
        const minaMenu = page.locator('text=Minä');
        await expect(minaMenu).toBeVisible();

        // Hover to theoretically trigger dropdown or click if it requires it
        await minaMenu.click();

        // Ensure the dropdown menu panel becomes visible
        const dropdownPanel = page.locator('.mega-menu-panel').first();
        await expect(dropdownPanel).toBeVisible();

        // Ensure links inside work (e.g., CV)
        const cvLink = dropdownPanel.locator('a[href="/cv/"]').first();
        await expect(cvLink).toBeVisible();
    });

});
