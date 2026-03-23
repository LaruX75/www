import { test, expect } from '@playwright/test';
import { gotoAndAssertSite, installPagefindStub } from './helpers/a11y.js';

test.describe('Navigation and Focus Audits', () => {
    test('Desktop mega menu supports keyboard opening and focus return', async ({ page }) => {
        await gotoAndAssertSite(page, '/');

        const toggle = page.locator('#megaToggleMeFi');
        const panel = page.locator('#megaMenuMeFi');

        await page.waitForFunction(() => Boolean(window.bootstrap));
        await expect(toggle).toBeVisible();
        await toggle.focus();
        await expect(toggle).toBeFocused();

        await page.keyboard.press('Enter');

        await expect(panel).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');

        await page.keyboard.press('Tab');

        const hasFocusInsideMenu = await page.evaluate(() => {
            const menu = document.getElementById('megaMenuMeFi');
            return Boolean(menu && menu.contains(document.activeElement));
        });

        expect(hasFocusInsideMenu).toBe(true);

        await page.keyboard.press('Escape');

        await expect(toggle).toBeFocused();
        await expect(panel).not.toBeVisible();
    });

    test('Search dialog traps focus and returns it to the trigger', async ({ page }) => {
        await installPagefindStub(page);
        await gotoAndAssertSite(page, '/');

        const trigger = page.locator('#searchToggleBtn');
        const dialog = page.locator('#searchOverlay');
        const closeButton = page.locator('#searchCloseBtn');
        const input = page.locator('#searchOverlay .pagefind-ui__search-input');

        await expect(trigger).toBeVisible();
        await trigger.click();

        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('role', 'dialog');
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await expect(dialog).toHaveAttribute('aria-hidden', 'false');
        await expect(input).toBeVisible();
        await expect(input).toBeFocused();

        await page.keyboard.down('Shift');
        await page.keyboard.press('Tab');
        await page.keyboard.up('Shift');
        await expect(closeButton).toBeFocused();

        await page.keyboard.down('Shift');
        await page.keyboard.press('Tab');
        await page.keyboard.up('Shift');

        const hasWrappedFocusInsideDialog = await page.evaluate(() => {
            const overlay = document.getElementById('searchOverlay');
            return Boolean(overlay && overlay.contains(document.activeElement));
        });

        expect(hasWrappedFocusInsideDialog).toBe(true);

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
    });
});
