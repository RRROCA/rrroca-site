const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with the expected title and mountain hero', async ({ page }) => {
    await expect(page).toHaveTitle(/RRROCA|Rocky Ridge/i);
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.hero-photo')).toBeVisible();
    await expect(page.locator('.hero-logo')).toBeVisible();
  });

  test('shows six quick links that are clickable', async ({ page }) => {
    const cards = page.locator('.quick-links-grid .quick-link-card');

    await expect(cards).toHaveCount(6);

    const hrefs = await cards.evaluateAll(elements =>
      elements.map(element => element.getAttribute('href'))
    );

    expect(hrefs.every(Boolean)).toBeTruthy();
  });

  test('shows the safety dashboard, news, Facebook, membership, and emergency sections', async ({ page }) => {
    await expect(page.locator('#safety-dashboard')).toBeVisible();
    await expect(page.locator('.safety-stat-card')).toHaveCount(4);

    const newsCards = page.locator('.news-grid .news-card').first();
    await expect(newsCards).toBeVisible();

    await expect(page.getByRole('heading', { name: /Stay Connected/i })).toBeVisible();
    await expect(page.getByText(/Latest from RRROCA on Facebook/i)).toBeVisible();

    await expect(page.locator('.membership-tiers-inline .tier-inline')).toHaveCount(3);
    await expect(page.locator('.emergency-bar')).toBeVisible();
    await expect(page.locator('.emergency-contacts a[href="tel:403-266-1234"]').first()).toBeVisible();
  });

  test('keeps the navigation header visible while scrolling', async ({ page }) => {
    const header = page.locator('.site-header');

    const before = await header.boundingBox();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(header).toBeVisible();
    const after = await header.boundingBox();

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(2);
  });

  test('renders a four-column footer with links', async ({ page }) => {
    await expect(page.locator('.footer-grid .footer-col')).toHaveCount(4);

    const footerLinkCount = await page.locator('.site-footer a').count();
    expect(footerLinkCount).toBeGreaterThan(5);
  });
});
