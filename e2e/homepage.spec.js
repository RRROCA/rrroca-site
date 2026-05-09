const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with the redesigned header, logo, and hero', async ({ page }) => {
    await expect(page).toHaveTitle(/RRROCA|Rocky Ridge/i);
    await expect(page.locator('.site-header .logo-img')).toBeVisible();
    await expect(page.locator('.site-header .logo-img')).toHaveAttribute('src', /rrroca-logo\.png$/);
    for (const label of ['Home', 'About', 'Safety', 'News', 'Events', 'Get Involved', 'Business Directory', 'Contact', 'Gallery', 'Join']) {
      await expect(page.locator('.nav-main')).toContainText(label);
    }
    await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Join / Renew' })).toBeVisible();
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.hero-photo')).toBeVisible();
    await expect(page.locator('.hero-logo')).toBeVisible();
  });

  test('shows the current community-focused homepage sections', async ({ page }) => {
    const quickLinks = page.locator('.quick-links-grid .quick-link-card');
    const involveCards = page.locator('.involve-grid .involve-card');

    await expect(page.locator('.community-strip .strip-item')).toHaveCount(4);
    await expect(quickLinks).toHaveCount(6);
    await expect(involveCards).toHaveCount(3);
    await expect(page.locator('.involve-card-icon')).toHaveCount(3);
    await expect(page.locator('.involve-card img')).toHaveCount(0);
    await expect(page.locator('#safety-dashboard')).toBeVisible();
    await expect(page.locator('.safety-stat-card')).toHaveCount(4);
    await expect(page.locator('.news-grid .news-card')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: /Stay Connected/i })).toBeVisible();
    await expect(page.locator('#membership .membership-tiers-inline .tier-inline')).toHaveCount(3);
    await expect(page.locator('.membership-photo img')).toBeVisible();
  });

  test('renders the navy emergency bar with pill-style contact links', async ({ page }) => {
    const emergencyBar = page.locator('.emergency-bar');
    const contacts = page.locator('.emergency-contacts a');

    await expect(emergencyBar).toBeVisible();
    await expect(contacts).toHaveCount(3);
    await expect(contacts.filter({ hasText: '911' })).toHaveAttribute('href', 'tel:911');
    await expect(contacts.filter({ hasText: /403-266-1234/i })).toHaveAttribute('href', 'tel:403-266-1234');

    const backgroundColor = await emergencyBar.evaluate((element) => getComputedStyle(element).backgroundColor);
    const [red, green, blue] = backgroundColor.match(/\d+/g).map(Number);
    expect(blue).toBeGreaterThan(red);
    expect(blue).toBeGreaterThan(green);

    const pillStyles = await contacts.evaluateAll((elements) =>
      elements.map((element) => ({
        borderRadius: parseFloat(getComputedStyle(element).borderRadius),
        backgroundColor: getComputedStyle(element).backgroundColor,
      }))
    );

    expect(pillStyles.every((style) => style.borderRadius >= 8)).toBeTruthy();
    expect(pillStyles.every((style) => style.backgroundColor !== 'rgba(0, 0, 0, 0)')).toBeTruthy();
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
