const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: /e2e[\/\\].*\.spec\.js$/,
  outputDir: 'test-results',
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:1313/rrroca-site/',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
      },
    },
  ],
  webServer: {
    command: 'hugo --baseURL http://localhost:1313/rrroca-site/ --gc --minify && node tests/serve-public.js',
    port: 1313,
    timeout: 120000,
    reuseExistingServer: true,
    env: {
      PORT: '1313',
      SITE_PREFIX: '/rrroca-site',
    },
  },
});
