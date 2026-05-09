const { test, expect } = require('@playwright/test');
const { contrastAudit } = require('./helpers');

const auditRoutes = ['/', '/about/', '/safety/', '/news/', '/events/', '/get-involved/'];

test.describe('Accessibility basics', () => {
  test('all images on key pages have alt attributes', async ({ page }) => {
    for (const route of auditRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      const missingAlt = await page.evaluate(() =>
        Array.from(document.images)
          .filter(image => !image.hasAttribute('alt'))
          .map(image => image.getAttribute('src'))
      );

      expect(missingAlt, `Missing alt attributes on ${route}`).toEqual([]);
    }
  });

  test('all links on the homepage have accessible text', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const emptyLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a'))
        .filter(link => {
          const visibleText = (link.textContent || '').trim();
          const ariaLabel = (link.getAttribute('aria-label') || '').trim();
          const title = (link.getAttribute('title') || '').trim();
          return !visibleText && !ariaLabel && !title;
        })
        .map(link => link.outerHTML)
    );

    expect(emptyLinks).toEqual([]);
  });

  test('homepage headings follow the site section pattern', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main > section .hero-title')).toHaveCount(1);
    expect(await page.locator('h2.section-heading').count()).toBeGreaterThanOrEqual(5);
    await expect(page.locator('.quick-link-card h3')).toHaveCount(6);
    await expect(page.locator('.news-card h3').first()).toBeVisible();
  });

  test('key interface text maintains acceptable contrast', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const snapshot = await page.locator('body').ariaSnapshot();
    expect(snapshot).toBeTruthy();

    const checks = await contrastAudit(page, [
      { selector: '.logo-text strong', backgroundSelector: '.site-header' },
      { selector: '.nav-main a[href="/about/"]', backgroundSelector: '.site-header' },
      { selector: '.emergency-label', backgroundSelector: '.emergency-bar' },
      { selector: '.emergency-contacts a', backgroundSelector: '.emergency-bar' },
    ]);

    for (const check of checks) {
      expect(check.missing).toBeFalsy();
      expect(check.ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('keyboard users can tab through the main menu', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const focusedLabels = [];
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => {
        const active = document.activeElement;
        return active ? (active.textContent || active.getAttribute('aria-label') || '').trim() : '';
      });
      focusedLabels.push(label);
    }

    const focusTrail = focusedLabels.join(' ');
    expect(focusTrail).toContain('Home');
    expect(focusTrail).toContain('About');
    expect(focusTrail).toContain('Safety');
  });

  test('skip-to-content link works when present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const skipLink = page.getByRole('link', { name: /skip/i });
    if (await skipLink.count() === 0) {
      return;
    }

    await skipLink.focus();
    await page.keyboard.press('Enter');

    const mainId = await page.locator('main').getAttribute('id');
    if (mainId) {
      await expect(page).toHaveURL(new RegExp(`#${mainId}$`));
    }
  });
});
