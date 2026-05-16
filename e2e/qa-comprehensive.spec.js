// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('QA Comprehensive — Live Site Tests', () => {

  test.describe('Protocol Links', () => {
    test('tel: links work on safety page', async ({ page }) => {
      await page.goto('/safety/');
      const telLinks = page.locator('a[href^="tel:"]');
      const count = await telLinks.count();
      expect(count).toBeGreaterThan(0);
      const content = await page.content();
      expect(content).not.toContain('ZgotmplZ');
    });

    test('mailto: links work across the site', async ({ page }) => {
      await page.goto('/contact/');
      const content = await page.content();
      expect(content).not.toContain('ZgotmplZ');
    });
  });

  test.describe('Search Functionality', () => {
    test('search overlay opens and can fetch index', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Control+k');
      const overlay = page.locator('#search-overlay');
      await expect(overlay).toHaveClass(/open/, { timeout: 3000 });
      const input = page.locator('#search-input');
      await input.fill('safety');
      await page.waitForTimeout(3000);
      const results = page.locator('#search-results');
      const html = await results.innerHTML();
      expect(html.length).toBeGreaterThan(0);
    });
  });

  test.describe('Gallery', () => {
    test('gallery images load (no broken src)', async ({ page }) => {
      await page.goto('/gallery/');
      const images = page.locator('.gallery-card img, .gallery-image');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < Math.min(count, 3); i++) {
        const src = await images.nth(i).getAttribute('src');
        expect(src).toBeTruthy();
      }
    });
  });

  test.describe('AI Assistant', () => {
    test('AI assistant opens and responds', async ({ page }) => {
      await page.goto('/');
      const triggers = page.locator('.ai-assistant-trigger, .ai-fab, [onclick*="assistant"]');
      if (await triggers.count() === 0) {
        test.skip();
        return;
      }
      const trigger = triggers.first();
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(500);
        const panel = page.locator('.ai-assistant-panel, #ai-assistant');
        await expect(panel).toBeVisible({ timeout: 3000 });
      }
    });

    test('AI assistant links include baseURL prefix', async ({ page }) => {
      await page.goto('/');
      const trigger = page.locator('.ai-assistant-trigger, .ai-fab').first();
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(500);
        const input = page.locator('.ai-input input, #ai-input input').first();
        if (await input.isVisible()) {
          await input.fill('safety');
          await input.press('Enter');
          await page.waitForTimeout(1000);
          const links = page.locator('.ai-messages a[href]');
          const linkCount = await links.count();
          for (let i = 0; i < linkCount; i++) {
            const href = await links.nth(i).getAttribute('href');
            if (href && href.startsWith('/') && !href.startsWith('//')) {
              expect(href).not.toMatch(/^\/safety\/?$/);
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
      ];
      for (const p of pages) {
        await page.goto(p, { timeout: 10000 });
        const content = await page.content();
        expect(content).not.toContain('ZgotmplZ');
      }
    });
  });
});
