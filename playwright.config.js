import { defineConfig, devices } from '@playwright/test';

const PLAYWRIGHT_USE_STATIC_SERVER = process.env.PLAYWRIGHT_USE_STATIC_SERVER === 'true';
const PLAYWRIGHT_PORT = Number(process.env.PLAYWRIGHT_PORT || '4173');
const PLAYWRIGHT_SERVER_ENV = 'PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true';
const PLAYWRIGHT_HOST = PLAYWRIGHT_USE_STATIC_SERVER
    ? `http://localhost:${PLAYWRIGHT_PORT}`
    : `http://127.0.0.1:${PLAYWRIGHT_PORT}`;
const PLAYWRIGHT_SERVER_COMMAND = PLAYWRIGHT_USE_STATIC_SERVER
    ? `python3 -m http.server ${PLAYWRIGHT_PORT} --directory _site`
    : `${PLAYWRIGHT_SERVER_ENV} npx @11ty/eleventy --serve --port=${PLAYWRIGHT_PORT}`;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: PLAYWRIGHT_HOST,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: PLAYWRIGHT_SERVER_COMMAND,
        url: PLAYWRIGHT_HOST,
        reuseExistingServer: false,
        timeout: 180 * 1000,
    },
});
