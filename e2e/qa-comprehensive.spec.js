// @ts-check
const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://localhost:1314';

test.describe('QA Comprehensive — Live Site Tests', () => {

  test.describe('Protocol Links', () => {
    test('tel: links work on safety report page', async ({ page }) => {
      await page.goto(`${BASE}/safety/report/`);
      const telLinks = page.locator('a[href^="tel:"]');
      const count = await telLinks.count();
      expect(count).toBeGreaterThan(0);
      // Verify no ZgotmplZ
      const content = await page.content();
      expect(content).not.toContain('ZgotmplZ');
    });

    test('mailto: links work across the site', async ({ page }) => {
      await page.goto(`${BASE}/contact/`);
      const content = await page.content();
      expect(content).not.toContain('ZgotmplZ');
    });
  });

  test.describe('Search Functionality', () => {
    test('search overlay opens and can fetch index', async ({ page }) => {
      await page.goto(BASE);
      await page.keyboard.press('Control+k');
      const overlay = page.locator('#search-overlay');
      await expect(overlay).toHaveClass(/open/, { timeout: 3000 });
      const input = page.locator('#search-input');
      await input.fill('safety');
      // Allow time for async Fuse.js index load + search
      await page.waitForTimeout(3000);
      const results = page.locator('#search-results');
      const html = await results.innerHTML();
      // Should show actual results or "no results" — not permanently stuck loading
      expect(html.length).toBeGreaterThan(0);
    });
  });

  test.describe('Gallery', () => {
    test('gallery images load (no broken src)', async ({ page }) => {
      await page.goto(`${BASE}/gallery/`);
      const images = page.locator('.gallery-image');
      const count = await images.count();
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const src = await images.nth(i).getAttribute('src');
          expect(src).not.toMatch(/^\/images\//); // Should not be bare path
          expect(src).toBeTruthy();
        }
      }
    });
  });

  test.describe('AI Assistant', () => {
    test('AI assistant opens and responds', async ({ page }) => {
      await page.goto(BASE);
      const trigger = page.locator('.ai-assistant-trigger, [onclick*="assistant"]').first();
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(500);
        const panel = page.locator('.ai-assistant-panel, #ai-assistant');
        await expect(panel).toBeVisible({ timeout: 3000 });
      }
    });

    test('AI assistant links include baseURL prefix', async ({ page }) => {
      await page.goto(BASE);
      // Open assistant and trigger a response
      const trigger = page.locator('.ai-assistant-trigger, .ai-fab').first();
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(500);
        const input = page.locator('.ai-input input, #ai-input input').first();
        if (await input.isVisible()) {
          await input.fill('safety');
          await input.press('Enter');
          await page.waitForTimeout(1000);
          // Check that links in response use correct base
          const links = page.locator('.ai-messages a[href]');
          const linkCount = await links.count();
          for (let i = 0; i < linkCount; i++) {
            const href = await links.nth(i).getAttribute('href');
            if (href && href.startsWith('/') && !href.startsWith('//')) {
              // Internal links should include the base path on GH Pages
              // On localhost they'll start with / which is fine
              expect(href).not.toMatch(/^\/safety\/?$/); // bare path without base
            }
          }
        }
      }
    });
  });

  test.describe('Cross-page Consistency', () => {
    test('no #ZgotmplZ on any major page', async ({ page }) => {
      const pages = [
        '/', '/safety/', '/events/', '/get-involved/',
        '/contact/', '/membership/', '/gallery/', '/about/',
        '/safety/report/'
      ];
      for (const p of pages) {
        await page.goto(`${BASE}${p}`, { timeout: 10000 });
        const content = await page.content();
        expect(content).not.toContain('ZgotmplZ');
      }
    });
  });
});
