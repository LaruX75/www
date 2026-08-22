import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const PROBE_PATH = '/';

async function panelIsShown(page) {
    return page.evaluate(() => {
        const panel = document.getElementById('a11yPanel');
        if (!panel) return false;
        const style = window.getComputedStyle(panel);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

async function focusRetained(page) {
    return page.evaluate(() => {
        const panel = document.getElementById('a11yPanel');
        const trigger = document.getElementById('a11yTrigger');
        const active = document.activeElement;
        if (!active || active === document.body) return false;
        if (trigger && active === trigger) return true;
        return Boolean(panel && (panel === active || panel.contains(active)));
    });
}

test.describe('Accessibility panel lifecycle', () => {
    test.beforeEach(async ({ page }) => {
        await gotoAndAssertSite(page, PROBE_PATH);
    });

    test('trigger click opens the panel and outside click closes it', async ({ page }) => {
        const trigger = page.locator('#a11yTrigger');
        const panel = page.locator('#a11yPanel');

        expect(await panelIsShown(page)).toBe(false);

        await trigger.click();
        await expect(panel).toBeVisible();
        expect(await panelIsShown(page)).toBe(true);

        await page.locator('main').first().click({ position: { x: 50, y: 50 } });
        await expect(panel).toBeHidden();
        expect(await panelIsShown(page)).toBe(false);
    });

    test('Escape closes the panel and returns focus to the trigger', async ({ page }) => {
        const trigger = page.locator('#a11yTrigger');
        const panel = page.locator('#a11yPanel');

        await trigger.click();
        await expect(panel).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden();
        await expect(trigger).toBeFocused();
    });

    test('close button closes the panel', async ({ page }) => {
        const trigger = page.locator('#a11yTrigger');
        const panel = page.locator('#a11yPanel');
        const closeBtn = page.locator('#a11yClose');

        await trigger.click();
        await expect(panel).toBeVisible();
        await closeBtn.click();
        await expect(panel).toBeHidden();
    });

    test('interior click keeps the panel open', async ({ page }) => {
        const trigger = page.locator('#a11yTrigger');
        const panel = page.locator('#a11yPanel');

        await trigger.click();
        await expect(panel).toBeVisible();

        await page.locator('#a11yHighContrast').click();
        await expect(panel).toBeVisible();
        await expect(page.locator('#a11yHighContrast')).toHaveAttribute('aria-pressed', 'true');
    });

    test('open retains focus on trigger or inside panel', async ({ page }) => {
        const trigger = page.locator('#a11yTrigger');
        const panel = page.locator('#a11yPanel');

        await trigger.click();
        await expect(panel).toBeVisible();

        expect(await focusRetained(page)).toBe(true);
    });

    test('repeat open-close cycles remain deterministic', async ({ page }) => {
        const trigger = page.locator('#a11yTrigger');
        const panel = page.locator('#a11yPanel');

        for (let i = 0; i < 10; i += 1) {
            await trigger.click();
            await expect(panel).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(panel).toBeHidden();
            await expect(trigger).toBeFocused();
        }
    });
});
