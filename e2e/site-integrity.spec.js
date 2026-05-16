const { test, expect } = require('@playwright/test');

const keyPages = [
  '/',
  '/about/',
  '/safety/',
  '/news/',
  '/events/',
  '/get-involved/',
  '/business-directory/',
  '/contact/',
  '/gallery/',
  '/membership/',
  '/get-involved/volunteer/',
  '/safety/report/',
];

function normalizeInternalLinks(hrefs, origin) {
  return [...new Set(
    hrefs
      .filter(Boolean)
      .filter((href) => !/^(mailto:|tel:|javascript:|#)/i.test(href))
      .map((href) => new URL(href, origin))
      .filter((url) => (
        url.origin === origin
        || ['localhost', '127.0.0.1'].includes(url.hostname)
      ))
      .map((url) => `${url.pathname}${url.search}`)
  )];
}

test.describe('Site integrity', () => {
  test('every nav menu link returns a successful response', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const origin = new URL(page.url()).origin;

    const navLinks = await page.locator('.nav-main a').evaluateAll((links) =>
      links.map((link) => ({
        text: (link.textContent || '').trim(),
        href: link.getAttribute('href'),
      }))
    );

    const expectedLabels = ['About', 'Safety', 'Events', 'Get Involved', 'Community', 'Governance', 'Resources', 'News'];
    const matchedLinks = expectedLabels.map((label) => navLinks.find((link) => link.text === label));

    expect(matchedLinks.every(Boolean)).toBeTruthy();

    for (const link of matchedLinks) {
      const destination = new URL(link.href, origin);
      const response = await request.get(`${origin}${destination.pathname}${destination.search}`);
      expect(response.status(), `${link.text} -> ${link.href}`).toBeLessThan(400);
    }
  });

  test('no key page links point to the old rrroca.org site', async ({ page }) => {
    const oldDomainLinks = [];

    for (const route of keyPages) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      const offending = await page.locator('a[href]').evaluateAll((links) =>
        links
          .map((link) => link.href)
          .filter((href) => /^https?:\/\/(www\.)?rrroca\.org(\/|$)/i.test(href))
      );

      offending.forEach((href) => oldDomainLinks.push({ route, href }));
    }

    expect(oldDomainLinks).toEqual([]);
  });

  test('all internal links on the homepage resolve without 404s', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const origin = new URL(page.url()).origin;
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.href));
    const internalLinks = normalizeInternalLinks(hrefs, origin);

    expect(internalLinks.length).toBeGreaterThan(10);

    for (const href of internalLinks) {
      const response = await request.get(`${origin}${href}`);
      expect(response.status(), href).toBeLessThan(400);
    }
  });

  test('footer links resolve or use safe external destinations', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const origin = new URL(page.url()).origin;
    const footerLinks = await page.locator('.site-footer a[href]').evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute('href'),
        absoluteHref: link.href,
      }))
    );

    expect(footerLinks.length).toBeGreaterThan(5);

    for (const link of footerLinks) {
      if (/^mailto:/i.test(link.href)) {
        expect(link.href).toMatch(/^mailto:/i);
        continue;
      }

      if (/^https?:\/\//i.test(link.absoluteHref) && !link.absoluteHref.startsWith(origin) && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(link.absoluteHref)) {
        expect(link.absoluteHref).not.toMatch(/^https?:\/\/(www\.)?rrroca\.org(\/|$)/i);
        expect(link.absoluteHref).toMatch(/^https:\/\//i);
        continue;
      }

      const destination = new URL(link.href, origin);
      const response = await request.get(`${origin}${destination.pathname}${destination.search}`);
      expect(response.status(), link.href).toBeLessThan(400);
    }
  });

  test('form pages expose the expected form controls', async ({ page }) => {
    const formChecks = [
      { route: '/contact/', fields: ['#contact-name', '#contact-email', '#contact-subject', '#contact-message'] },
      { route: '/get-involved/volunteer/', fields: ['#volunteer-name', '#volunteer-email', '#volunteer-availability', '#volunteer-message'] },
    ];

    for (const formCheck of formChecks) {
      await page.goto(formCheck.route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('form.rr-form')).toBeAttached();

      for (const selector of formCheck.fields) {
        await expect(page.locator(selector)).toBeAttached();
      }
    }
  });

  test('gallery page includes lightbox markup and triggers', async ({ page }) => {
    await page.goto('/gallery/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.gallery-grid .gallery-card')).toHaveCount(8);
    await expect(page.locator('.gallery-card-button[data-lightbox-src]')).toHaveCount(8);
    await expect(page.locator('#gallery-lightbox[hidden]')).toBeAttached();
    await expect(page.locator('#gallery-lightbox .gallery-lightbox-image')).toBeAttached();
  });

  test('business directory includes a working search input shell', async ({ page }) => {
    await page.goto('/business-directory/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-directory-search]')).toBeVisible();
    await expect(page.locator('[data-directory-grid] [data-directory-card]')).toHaveCount(6);
  });

  test('events page renders upcoming event content', async ({ page }) => {
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

  test('homepage emergency bar is visible with correct contact numbers', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.emergency-bar')).toBeVisible();
    await expect(page.locator('.emergency-contacts a[href="tel:911"]')).toContainText('911');
    await expect(page.locator('.emergency-contacts a[href="tel:403-266-1234"]')).toContainText('403-266-1234');
    await expect(page.locator('.emergency-contacts a')).toHaveCount(3);
  });

  test('mobile navigation toggle opens and closes the menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const toggle = page.locator('.menu-toggle');
    const nav = page.locator('.nav-main');

    await expect(toggle).toBeVisible();
    await expect(nav).not.toHaveClass(/open/);
    await toggle.click();
    await expect(nav).toHaveClass(/open/);
    await toggle.click();
    await expect(nav).not.toHaveClass(/open/);
  });

  test('header keeps the Join button visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.site-header a.btn.btn-primary.btn-sm')).toBeVisible();
    await expect(page.locator('.site-header .nav-cta')).toHaveAttribute('href', /rrroca\.getcommunal\.com\/memberships/);
  });
});
