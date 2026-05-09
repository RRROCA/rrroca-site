const { test, expect } = require('@playwright/test');

const destinations = [
  { name: 'About', locator: '.nav-main a[href="/about/"]', path: '/about/', heading: /About/i },
  { name: 'Safety', locator: '.nav-main a[href="/safety/"]', path: '/safety/', heading: /Safety/i },
  { name: 'News', locator: '.nav-main a[href="/news/"]', path: '/news/', heading: /News/i },
  { name: 'Events', locator: '.nav-main a[href="/events/"]', path: '/events/', heading: /Events/i },
  { name: 'Get Involved', locator: '.nav-main a[href="/get-involved/"]', path: '/get-involved/', heading: /Join us|Get Involved/i },
  { name: 'Community', locator: '.quick-link-card[href="/community/"]', path: '/community/', heading: /Community/i },
  { name: 'Sports', locator: '.quick-link-card[href="/sports/"]', path: '/sports/', heading: /Sport/i },
];

test.describe('Navigation', () => {
  test('section links navigate to the correct pages', async ({ page }) => {
    for (const destination of destinations) {
      await page.goto('/');
      await page.locator(destination.locator).click();
      await expect(page).toHaveURL(new RegExp(`${destination.path.replace(/\//g, '\\/')}`));
      await expect(page.locator('.page-header h1').first()).toContainText(destination.heading);
    }
  });

  test('section pages load without page errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    for (const destination of destinations) {
      await page.goto(destination.path);
      await expect(page.locator('.page-header h1').first()).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
  });

  test('browser back navigation returns to the previous page', async ({ page }) => {
    await page.goto('/news/');
    const firstArticle = page.locator('.news-card a').first();
    await firstArticle.click();
    await expect(page).toHaveURL(/\/news\/.+/);

    await page.goBack();

    await expect(page).toHaveURL(/\/news\/$/);
    await expect(page.getByRole('heading', { level: 1, name: /News/i })).toBeVisible();
  });

  test('renders the custom 404 page for a missing route', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');

    if (response) {
      expect([200, 404]).toContain(response.status());
    }

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/404|Page Not Found/i);
    await expect(page.getByText(/doesn't exist|may have moved/i)).toBeVisible();
  });
});
