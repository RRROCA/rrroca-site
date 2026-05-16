const { test, expect } = require('@playwright/test');
const { stubFuse } = require('./helpers');

test.describe('Smart search', () => {
  test.beforeEach(async ({ page }) => {
    await stubFuse(page);
    await page.goto('/');
  });

  test('opens the search overlay with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.locator('#search-overlay')).toBeVisible();
    await expect(page.locator('#search-input')).toBeFocused();
  });

  test('shows search results and navigates when a result is clicked', async ({ page }) => {
    const indexResponse = page
      .waitForResponse(response => response.url().endsWith('/index.json') && response.status() === 200)
      .catch(() => null);

    await page.keyboard.press('Control+k');
    await expect(page.locator('#search-overlay')).toBeVisible();
    await indexResponse;
    await page.waitForFunction(() => typeof window.Fuse === 'function');
    await page.locator('#search-input').fill('safety');

    await expect(page.locator('.search-result').first()).toBeVisible();
    const results = page.locator('.search-result');
    const targetHref = await results.first().getAttribute('href');
    await results.first().click();

    await expect(page).toHaveURL(new RegExp(targetHref.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '$'));
    expect(new URL(page.url()).pathname).not.toBe('/');
  });

  test('closes the search overlay with Escape', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.locator('#search-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-overlay')).not.toBeVisible();
  });

  test('closes the search overlay with the close button', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.locator('.search-close').click();
    await expect(page.locator('#search-overlay')).not.toBeVisible();
  });
});
