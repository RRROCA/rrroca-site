const { test, expect } = require('@playwright/test');

const primaryNavigation = [
  { label: 'About', href: '/about/', heading: /About/i },
  { label: 'Safety', href: '/safety/', heading: /Safety|Community Safety Hub/i },
  { label: 'News', href: '/news/', heading: /News/i },
  { label: 'Events', href: '/events/', heading: /Events/i },
  { label: 'Get Involved', href: '/get-involved/', heading: /Join us|Get Involved/i },
  { label: 'Business Directory', href: '/business-directory/', heading: /Business Directory/i },
  { label: 'Contact', href: '/contact/', heading: /Contact/i },
  { label: 'Gallery', href: '/gallery/', heading: /Gallery/i },
  { label: 'Join', href: '/membership/', heading: /Membership|Join/i },
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
    heading: /Volunteer application/i,
    submitLabel: /Join as a volunteer/i,
    fields: ['#volunteer-name', '#volunteer-email', '#volunteer-availability', '#volunteer-message'],
  },
  {
    path: '/safety/report/',
    heading: /Report a Concern/i,
    submitLabel: /Submit concern/i,
    fields: ['#report-type', '#report-location', '#report-description'],
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
      await page.locator(`.nav-main a[href="${destination.href}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${destination.href.replace(/\//g, '\\/')}$`));
      await expect(page.locator('main h1').first()).toContainText(destination.heading);
    }

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Join / Renew' }).click();
    await expect(page).toHaveURL(/\/membership\/$/);
    await expect(page.locator('main h1').first()).toContainText(/Membership|Join/i);
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
      await expect(page.locator('form.rr-form[data-formspree]')).toBeVisible();
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
