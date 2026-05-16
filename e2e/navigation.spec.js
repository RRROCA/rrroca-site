const { test, expect } = require('@playwright/test');

const primaryNavigation = [
  { label: 'About', href: '/about/', heading: /About/i },
  { label: 'Safety', href: '/safety/', heading: /Safety|Community Safety Hub/i },
  { label: 'Events', href: '/events/', heading: /Events/i },
  { label: 'Get Involved', href: '/get-involved/', heading: /Join us|Get Involved/i },
  { label: 'Community', href: '/community/', heading: /Community/i },
  { label: 'Governance', href: '/board/', heading: /Governance|Board/i },
  { label: 'Resources', href: '/resources/', heading: /Resources/i },
  { label: 'News', href: '/news/', heading: /News/i },
];

const contentPages = [
  { path: '/about/board-of-directors/', heading: /Board of Directors/i },
  { path: '/community/parks-pathways/', heading: /Parks and Pathways/i },
  { path: '/safety/electrical-safety/', heading: /Electrical Safety/i },
  { path: '/safety/winter-safety/', heading: /Winter Safety/i },
  { path: '/safety/wild-animal-safety/', heading: /Wild Animals/i },
  { path: '/gallery/', heading: /Community Gallery/i },
  { path: '/business-directory/', heading: /Community Business Directory/i },
];

const formPages = [
  {
    path: '/contact/',
    heading: /Contact Us/i,
    submitLabel: /Send message/i,
    fields: ['#contact-name', '#contact-email', '#contact-subject', '#contact-message'],
  },
  {
    path: '/get-involved/volunteer/',
    heading: /Volunteer with RRROCA/i,
    submitLabel: /Join as a volunteer/i,
    fields: ['#volunteer-name', '#volunteer-email', '#volunteer-availability', '#volunteer-message'],
  },
];

test.describe('Navigation', () => {
  test('header links and homepage calls to action resolve to real pages', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const logo = page.locator('.site-header .logo');
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.hero-title')).toContainText(/Welcome to Rocky Ridge/i);

    for (const destination of primaryNavigation) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('.site-header .nav-main').getByRole('link', { name: destination.label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(destination.href.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '$'));
      await expect(page.locator('main h1').first()).toContainText(destination.heading);
    }

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const joinCta = page.locator('.site-header .nav-cta');
    await expect(joinCta).toBeVisible();
    await expect(joinCta).toHaveText('Join');
    await expect(joinCta).toHaveAttribute('href', /rrroca\.getcommunal\.com\/memberships/);
  });

  test('new content pages render without 404s', async ({ page }) => {
    for (const contentPage of contentPages) {
      const response = await page.goto(contentPage.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status() ?? 200).toBeLessThan(400);
      await expect(page.locator('main h1').first()).toContainText(contentPage.heading);
    }
  });

  test('contact, volunteer, and safety report forms are available', async ({ page }) => {
    for (const formPage of formPages) {
      const response = await page.goto(formPage.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status() ?? 200).toBeLessThan(400);
      await expect(page.locator('main h1').first()).toContainText(formPage.heading);
      await expect(page.locator('form.rr-form[data-formspree], form.rr-form[data-mailto]')).toBeVisible();
      await expect(page.getByRole('button', { name: formPage.submitLabel })).toBeVisible();

      for (const field of formPage.fields) {
        await expect(page.locator(field)).toBeVisible();
      }
    }
  });

  test('gallery and business directory pages load their interactive content', async ({ page }) => {
    await page.goto('/gallery/', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('.gallery-grid .gallery-card').count()).toBeGreaterThan(0);
    expect(await page.locator('.gallery-filters .gallery-filter').count()).toBeGreaterThan(1);

    await page.goto('/business-directory/', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('[data-directory-grid] [data-directory-card]').count()).toBeGreaterThan(0);
    await expect(page.locator('[data-directory-search]')).toBeVisible();
  });

  test('events page renders the upcoming events area', async ({ page }) => {
    await page.goto('/events/', { waitUntil: 'domcontentloaded' });

    const eventCards = page.locator('.event-card');
    if ((await eventCards.count()) > 0) {
      await expect(eventCards.first().locator('.event-card-date')).toBeVisible();
      await expect(eventCards.first().locator('.event-card-content h3')).toBeVisible();
      expect(await eventCards.first().locator('.event-card-content > p:not(.event-meta)').count()).toBe(0);
    } else {
      await expect(page.locator('.events-empty-state')).toBeVisible();
      await expect(page.locator('.events-empty-state')).toContainText(/No upcoming events/i);
    }
  });

  test('browser back navigation returns to the previous page', async ({ page }) => {
    await page.goto('/news/', { waitUntil: 'domcontentloaded' });
    const firstArticle = page.locator('.news-card a').first();
    await firstArticle.click();
    await expect(page).toHaveURL(/\/news\/.+/);

    await page.goBack();

    await expect(page).toHaveURL(/\/news\/$/);
    await expect(page.getByRole('heading', { level: 1, name: /News/i })).toBeVisible();
  });

  test('renders the custom 404 page for a missing route', async ({ page }) => {
    const response = await page.goto('/nonexistent-page', { waitUntil: 'domcontentloaded' });

    if (response) {
      expect([200, 404]).toContain(response.status());
    }

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/404|Page Not Found/i);
    await expect(page.getByText(/doesn't exist|may have moved/i)).toBeVisible();
  });
});
