const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:1314',
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
    command: 'hugo --baseURL http://localhost:1314/ --buildFuture --gc --minify --cleanDestinationDir && node tests\\serve-public.js',
    port: 1314,
    timeout: 120000,
    reuseExistingServer: true,
  },
});
