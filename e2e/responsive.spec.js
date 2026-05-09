const { test, expect } = require('@playwright/test');
const { countUniqueColumnStarts } = require('./helpers');

async function fitsViewport(page, selector) {
  return page.locator(selector).evaluate(element => {
    const rect = element.getBoundingClientRect();
    return rect.left >= -1 && rect.right <= window.innerWidth + 1;
  });
}

test.describe('Responsive layouts', () => {
  test('shows the mobile navigation and compact quick links on phones', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('.menu-toggle')).toBeVisible();

    const columns = await countUniqueColumnStarts(page, '.quick-links-grid .quick-link-card');
    expect(columns).toBe(1);
    expect(await fitsViewport(page, '.quick-links-grid')).toBeTruthy();
  });

  test('uses the current two-column quick-link layout on tablet widths', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const columns = await countUniqueColumnStarts(page, '.quick-links-grid .quick-link-card');
    expect(columns).toBe(2);
    expect(await fitsViewport(page, '.quick-links-grid')).toBeTruthy();
  });

  test('uses the premium six-column quick-link grid on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const columns = await countUniqueColumnStarts(page, '.quick-links-grid .quick-link-card');
    expect(columns).toBe(6);
    expect(await fitsViewport(page, '.quick-links-grid')).toBeTruthy();
  });

  test('sizes the AI assistant panel for mobile screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.locator('#ai-fab').click();

    const panelBox = await page.locator('#ai-panel').boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox.width).toBeLessThanOrEqual(375);
    expect(panelBox.height).toBeLessThanOrEqual(667 * 0.85);
  });
});
