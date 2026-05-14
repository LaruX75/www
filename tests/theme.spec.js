import { test, expect } from '@playwright/test';

// Apufunktio: avaa sivu puhtaalla localStoragella (ei tallennettua teema-asetusta)
async function gotoClean(page, path = '/') {
    await page.addInitScript(() => localStorage.removeItem('theme'));
    await page.goto(path);
    await page.waitForLoadState('domcontentloaded');
}

// Lukee data-bs-theme-attribuutin html-elementistä
async function getTheme(page) {
    return page.evaluate(() =>
        document.documentElement.getAttribute('data-bs-theme')
    );
}

// Lukee colorScheme-tyylin html-elementistä
async function getColorScheme(page) {
    return page.evaluate(() =>
        document.documentElement.style.colorScheme
    );
}

// ────────────────────────────────────────────────
// 1. Järjestelmäteema ilman tallennettua asetusta
// ────────────────────────────────────────────────

test.describe('Järjestelmäteema (ei tallennettua asetusta)', () => {

    test('Tumma järjestelmäteema → sivusto tumma', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'dark' });
        const page = await ctx.newPage();
        await gotoClean(page);

        expect(await getTheme(page)).toBe('dark');
        expect(await getColorScheme(page)).toBe('dark');
        await ctx.close();
    });

    test('Vaalea järjestelmäteema → sivusto vaalea', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await gotoClean(page);

        expect(await getTheme(page)).toBe('light');
        expect(await getColorScheme(page)).toBe('light');
        await ctx.close();
    });

    test('Teema asetetaan <head>-skriptissä ennen DOMContentLoaded (ei välkkymistä)', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'dark' });
        const page = await ctx.newPage();
        await page.addInitScript(() => localStorage.removeItem('theme'));

        // Kuuntele DOMContentLoaded-tapahtumaa ja tallenna teema siinä hetkessä
        await page.addInitScript(() => {
            window.__themeAtDCL = null;
            document.addEventListener('DOMContentLoaded', () => {
                window.__themeAtDCL = document.documentElement.getAttribute('data-bs-theme');
            }, { once: true });
        });

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const themeAtDCL = await page.evaluate(() => window.__themeAtDCL);
        // Teema tulee olla asetettu jo DOMContentLoadedin hetkellä (head-skripti ajoi ensin)
        expect(themeAtDCL).toBe('dark');
        await ctx.close();
    });

});

// ────────────────────────────────────────────────
// 2. Manuaalinen vaihtopainike
// ────────────────────────────────────────────────

test.describe('Manuaalinen teeman vaihtaminen', () => {

    test('Tumman teeman sivustolla: toggle vaihtaa vaaleaan', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'dark' });
        const page = await ctx.newPage();
        await gotoClean(page);

        expect(await getTheme(page)).toBe('dark');

        const btn = page.locator('[data-theme-toggle], #themeToggleBtn').first();
        await expect(btn).toBeVisible();
        await btn.click();

        expect(await getTheme(page)).toBe('light');
        await ctx.close();
    });

    test('Vaalean teeman sivustolla: toggle vaihtaa tummaan', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await gotoClean(page);

        expect(await getTheme(page)).toBe('light');

        const btn = page.locator('[data-theme-toggle], #themeToggleBtn').first();
        await btn.click();

        expect(await getTheme(page)).toBe('dark');
        await ctx.close();
    });

    test('Kaksi peräkkäistä togglea palauttaa alkuperäisen teeman', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await gotoClean(page);

        const btn = page.locator('[data-theme-toggle], #themeToggleBtn').first();
        await btn.click();
        expect(await getTheme(page)).toBe('dark');
        await btn.click();
        expect(await getTheme(page)).toBe('light');
        await ctx.close();
    });

    test('Valinta tallentuu localStorageen', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await gotoClean(page);

        const btn = page.locator('[data-theme-toggle], #themeToggleBtn').first();
        await btn.click();

        const stored = await page.evaluate(() => localStorage.getItem('theme'));
        expect(stored).toBe('dark');
        await ctx.close();
    });

    test('Tallennettu asetus säilyy sivun uudelleenlatauksessa', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await gotoClean(page);

        // Aseta tumma käsin localStorageen ennen latausta
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        expect(await getTheme(page)).toBe('dark');
        await ctx.close();
    });

});

// ────────────────────────────────────────────────
// 3. Järjestelmäteeman live-muutos
// ────────────────────────────────────────────────

test.describe('Järjestelmäteeman live-muutos', () => {

    test('Ilman tallennettua asetusta: teema seuraa järjestelmää reaaliajassa', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await gotoClean(page);

        expect(await getTheme(page)).toBe('light');

        // Simuloi järjestelmän vaihtuminen tummaan
        await page.emulateMedia({ colorScheme: 'dark' });

        // Annetaan hetki event-listenerille reagoida
        await page.waitForTimeout(200);

        expect(await getTheme(page)).toBe('dark');
        await ctx.close();
    });

    test('Tallennettu asetus estää järjestelmäteeman live-muutoksen', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();

        // Käyttäjä on tallentanut tumman teeman
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        expect(await getTheme(page)).toBe('dark');

        // Järjestelmä vaihtuu vaaleaan — tallennettu asetus ei saa väistyä
        await page.emulateMedia({ colorScheme: 'light' });
        await page.waitForTimeout(200);

        expect(await getTheme(page)).toBe('dark');
        await ctx.close();
    });

});

// ────────────────────────────────────────────────
// 4. Toggle-ikonin päivitys
// ────────────────────────────────────────────────

test.describe('Toggle-ikonin tila', () => {

    test('Tummassa teemassa ikoni on aurinko (bi-sun-fill)', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'dark' });
        const page = await ctx.newPage();
        await gotoClean(page);
        await page.waitForLoadState('load');

        const icon = page.locator('[data-theme-icon], #themeToggleIcon').first();
        await expect(icon).toHaveClass(/bi-sun-fill/);
        await ctx.close();
    });

    test('Vaaleassa teemassa ikoni on kuu (bi-moon-stars-fill)', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await gotoClean(page);
        await page.waitForLoadState('load');

        const icon = page.locator('[data-theme-icon], #themeToggleIcon').first();
        await expect(icon).toHaveClass(/bi-moon-stars-fill/);
        await ctx.close();
    });

    test('Togglen jälkeen ikoni vaihtuu oikein', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await gotoClean(page);
        await page.waitForLoadState('load');

        const btn = page.locator('[data-theme-toggle], #themeToggleBtn').first();
        const icon = page.locator('[data-theme-icon], #themeToggleIcon').first();

        await expect(icon).toHaveClass(/bi-moon-stars-fill/);
        await btn.click();
        await expect(icon).toHaveClass(/bi-sun-fill/);
        await ctx.close();
    });

});
