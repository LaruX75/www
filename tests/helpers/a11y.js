import { expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

export const AXE_AUDIT_PAGES = [
    { name: 'Homepage', path: '/' },
    { name: 'Publications', path: '/julkaisut/' },
    { name: 'Theses', path: '/opinnaytteet/' },
    { name: 'Presentations', path: '/esitykset/' },
    { name: 'CV', path: '/cv/' },
    { name: 'Contact', path: '/yhteystiedot/' },
    { name: 'Accessibility Statement', path: '/saavutettavuus/' },
    { name: 'How This Site Is Built', path: '/miten-sivusto-on-rakennettu/' },
    { name: 'Site Changes', path: '/sivuston-muutokset/' },
];

export async function gotoAndAssertSite(page, path) {
    await page.goto(path);
    await expect(page.locator('.navbar-brand').first()).toContainText('Jari Laru');
}

export async function installPagefindStub(_page) {
    // Component UI uses web components that self-initialize — no stub needed.
}

export async function runAxeAudit(page, path, options = {}) {
    await gotoAndAssertSite(page, path);
    await injectAxe(page);
    await checkA11y(page, null, {
        detailedReport: true,
        ...options,
    });
}
