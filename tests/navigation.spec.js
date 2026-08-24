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
        await page.addInitScript(() => {
            const spokenChunks = [];
            window.__spokenChunks = spokenChunks;
            class MockSpeechSynthesisUtterance {
                constructor(text) {
                    this.text = text;
                    this.lang = '';
                    this.rate = 1;
                    this.onend = null;
                    this.onerror = null;
                }
            }

            Object.defineProperty(window, 'SpeechSynthesisUtterance', {
                configurable: true,
                writable: true,
                value: MockSpeechSynthesisUtterance
            });

            Object.defineProperty(window, 'speechSynthesis', {
                configurable: true,
                value: {
                speak(utterance) {
                    spokenChunks.push(utterance.text);
                    window.setTimeout(() => {
                        if (typeof utterance.onend === 'function') utterance.onend();
                    }, 0);
                },
                cancel() {}
                }
            });
        });
        await installPagefindStub(page);
        // #searchToggleBtn on d-flex d-xl-none (nakyy vain <1200px). Desktopilla
        // haku toimii inline-formin kautta. Testataan mobiili-modaalia mobile-viewportissa.
        await page.setViewportSize({ width: 800, height: 800 });
        await gotoAndAssertSite(page, '/');

        const trigger = page.locator('#searchToggleBtn');
        const dialog = page.locator('#searchOverlay');
        const closeButton = page.locator('#searchCloseBtn');
        const input = page.locator('#siteSearchNavInput');

        await expect(trigger).toBeVisible();
        await trigger.click();

        await expect(dialog).toBeVisible();
        // N1: search overlay uses the native <dialog> element. Modal role
        // and modal-ness are implicit (getByRole('dialog') matches, and
        // showModal() puts it in the top layer). `open` attribute reflects
        // dialog state; `aria-modal`/`aria-hidden` are no longer set
        // explicitly because they duplicated native semantics.
        await expect(dialog).toHaveAttribute('open', '');
        await expect(page.getByRole('dialog')).toBeVisible();
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

        const accessibilityTrigger = page.locator('#a11yTrigger');
        const focusAssistToggle = page.locator('#a11yFocusAssist');
        const skipLink = page.locator('.skip-link');
        const ttsPlay = page.locator('#a11yTtsPlay');
        const ttsStop = page.locator('#a11yTtsStop');

        await accessibilityTrigger.click();
        await expect(focusAssistToggle).toBeVisible();
        await expect(ttsPlay).toBeVisible();
        await focusAssistToggle.click();

        await expect(focusAssistToggle).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('html')).toHaveClass(/a11y-screen-reader/);
        await expect(skipLink).toBeVisible();

        const storedSetting = await page.evaluate(() => {
            const stored = window.localStorage.getItem('a11y-settings');
            return stored ? JSON.parse(stored).screenReaderAssist : null;
        });

        expect(storedSetting).toBe(true);

        await ttsPlay.click();
        await expect(ttsStop).toBeEnabled();
        await page.waitForFunction(() => Array.isArray(window.__spokenChunks) && window.__spokenChunks.length > 0);
        const spokenCount = await page.evaluate(() => Array.isArray(window.__spokenChunks) ? window.__spokenChunks.length : 0);
        expect(spokenCount).toBeGreaterThan(0);
    });

    test('Search dialog returns Pagefind results for a known Finnish term', async ({ page }) => {
        // #searchToggleBtn on d-flex d-xl-none — nakyy vain mobile/tablet-viewportissa.
        await page.setViewportSize({ width: 800, height: 800 });
        await gotoAndAssertSite(page, '/');

        await page.locator('#searchToggleBtn').click();
        const input = page.locator('#siteSearchNavInput');

        await expect(input).toBeVisible();
        await input.fill('tekoäly');

        await expect(page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind]').first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('#searchOverlay [data-search-modular-summary]')).toContainText(/tulos/);
    });

    test('EN search dialog: same open/traversal/close/return lifecycle as FI', async ({ page }) => {
        // Parity gate: EN nav renders the same #searchOverlay / #searchToggleBtn /
        // #searchCloseBtn IDs and shares the same site-ui.js JS. This test
        // exercises the full lifecycle on an EN page to prove the shared JS
        // works identically without per-language focus behavior.
        await page.setViewportSize({ width: 800, height: 800 });
        await gotoAndAssertSite(page, '/en/');

        const trigger = page.locator('#searchToggleBtn');
        const dialog = page.locator('#searchOverlay');
        const closeButton = page.locator('#searchCloseBtn');
        const input = page.locator('#siteSearchNavInput');

        await expect(trigger).toBeVisible();
        await trigger.click();
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('open', '');
        await expect(input).toBeVisible();
        await expect(input).toBeFocused();

        // Reverse-tab from input reaches close button
        await page.keyboard.down('Shift');
        await page.keyboard.press('Tab');
        await page.keyboard.up('Shift');
        await expect(closeButton).toBeFocused();

        // Reverse-tab from close (first) wraps to the last focusable — focus stays in overlay
        await page.keyboard.down('Shift');
        await page.keyboard.press('Tab');
        await page.keyboard.up('Shift');
        const focusInside = await page.evaluate(() => {
            const overlay = document.getElementById('searchOverlay');
            return Boolean(overlay && overlay.contains(document.activeElement));
        });
        expect(focusInside).toBe(true);

        // Escape closes + focus returns to trigger
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();

        // Reopen works
        await trigger.click();
        await expect(dialog).toBeVisible();
        await expect(input).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
    });

    test('Theme selection persists across page navigation', async ({ page }) => {
        await gotoAndAssertSite(page, '/');

        const themeToggle = page.locator('[data-theme-toggle]').first();
        await expect(themeToggle).toBeVisible();
        await themeToggle.click();

        await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');

        const storedTheme = await page.evaluate(() => window.localStorage.getItem('theme'));
        expect(storedTheme).toBe('dark');

        await page.goto('/miten-sivusto-on-rakennettu/');
        await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');

        await page.goto('/sivuston-muutokset/');
        await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
    });
});
