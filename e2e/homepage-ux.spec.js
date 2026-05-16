const { test, expect } = require('@playwright/test');
const { contrastAudit, countUniqueColumnStarts } = require('./helpers');

async function collectConsoleErrors(page, run) {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await run();

  return { consoleErrors, pageErrors };
}

test.describe('Homepage UX', () => {
  test('renders the hero above the fold on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'load' });

    const hero = page.locator('#hero');
    const title = hero.locator('.hero-title');
    const actions = hero.locator('.hero-actions');
    const heroBox = await hero.boundingBox();
    const titleBox = await title.boundingBox();
    const actionBox = await actions.boundingBox();

    await expect(hero).toBeVisible();
    await expect(title).toBeVisible();
    await expect(actions).toBeVisible();

    expect(heroBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(actionBox).not.toBeNull();
    expect(heroBox.y).toBeLessThanOrEqual(80);
    expect(titleBox.y).toBeLessThan(380);
    expect(actionBox.y + actionBox.height).toBeLessThan(950);
  });

  test('shows six visible quick-link cards that are all routable and clickable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForSelector('.quick-links-grid .quick-link-card', { timeout: 15000 });

    const cards = page.locator('.quick-links-grid .quick-link-card');
    await expect(cards).toHaveCount(6);

    for (let index = 0; index < 6; index += 1) {
      const card = cards.nth(index);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();

      const href = await card.getAttribute('href');
      expect(href).toBeTruthy();

      const response = await page.request.get(href);
      expect(response.status()).toBeLessThan(400);

      await Promise.all([
        page.waitForURL((url) => url.pathname === new URL(href, page.url()).pathname),
        card.click(),
      ]);
      await page.goto('/', { waitUntil: 'load' });
    }
  });

  test('makes the community photo strip horizontally scrollable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'load' });

    const strip = page.locator('.strip-scroll');
    await strip.scrollIntoViewIfNeeded();

    const metrics = await strip.evaluate((element) => {
      const before = element.scrollLeft;
      element.scrollTo({ left: element.scrollWidth, behavior: 'auto' });
      const after = element.scrollLeft;
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        before,
        after,
      };
    });

    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
    expect(metrics.after).toBeGreaterThan(metrics.before);
  });

  test('keeps all primary navigation links resolving without 404s', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const hrefs = await page.locator('.nav-main a[href]:not(.nav-cta)').evaluateAll((links) =>
      links.map((link) => link.href)
    );

    expect(hrefs.length).toBeGreaterThanOrEqual(10);
    for (const href of hrefs) {
      const response = await page.request.get(href);
      expect(response.status(), href).toBeLessThan(400);
    }
  });

  test('stacks quick links and opens the hamburger nav on 375px mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'load' });

    const toggle = page.locator('.menu-toggle');
    const nav = page.locator('.nav-main');

    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(nav).toHaveClass(/open/);

    const columns = await countUniqueColumnStarts(page, '.quick-links-grid .quick-link-card');
    expect(columns).toBe(1);
  });

  test('uses a 2-column quick-link grid on tablet and 6-column grid on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/', { waitUntil: 'load' });
    expect(await countUniqueColumnStarts(page, '.quick-links-grid .quick-link-card')).toBe(2);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'load' });
    expect(await countUniqueColumnStarts(page, '.quick-links-grid .quick-link-card')).toBe(6);
  });

  test('keeps emergency tel links thumb-friendly and tappable', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/', { waitUntil: 'load' });

    const telLinks = page.locator('.emergency-contacts a[href^="tel:"]');
    await expect(telLinks).toHaveCount(2);

    for (let index = 0; index < 2; index += 1) {
      const link = telLinks.nth(index);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', /^tel:/);
      await link.click({ trial: true });

      const box = await link.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('shows the membership CTA linking to external membership platform', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const cta = page.locator('#membership .membership-actions a.btn.btn-primary');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /rrroca\.getcommunal\.com\/memberships/);
    await expect(cta).toHaveAttribute('target', '_blank');
  });

  test('homepage image sources return successful responses', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const images = await page.locator('img').evaluateAll((nodes) =>
      [...new Set(nodes.map((node) => node.currentSrc || node.src).filter(Boolean))]
    );

    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      const response = await page.request.get(image);
      expect(response.status(), image).toBeLessThan(400);
    }
  });

  test('disables motion-heavy CSS when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'load' });

    const animationState = await page.locator('.strip-scroll').evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        animationName: styles.animationName,
        animationDuration: styles.animationDuration,
      };
    });

    expect(animationState.animationName).toBe('none');
    expect(animationState.animationDuration).toBe('0s');
  });

  test('loads the page in under 3 seconds on the local static server', async ({ page }) => {
    const started = Date.now();
    await page.goto('/', { waitUntil: 'load' });
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(3000);
  });

  test('emits no console or runtime errors on homepage load', async ({ page }) => {
    const { consoleErrors, pageErrors } = await collectConsoleErrors(page, async () => {
      await page.goto('/', { waitUntil: 'load' });
      await page.waitForTimeout(250);
    });

    const actionableConsoleErrors = consoleErrors.filter((message) =>
      !/Failed to load resource: the server responded with a status of 404/i.test(message)
      && !/facebook\.com|connect\.facebook\.net|fburl\.com|fb:xfbml|Cross-Origin|ErrorUtils/i.test(message)
    );

    expect(actionableConsoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('meets key homepage accessibility signals', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const imageAudit = await page.locator('img').evaluateAll((images) =>
      images.map((image) => ({
        alt: image.getAttribute('alt'),
        ariaHiddenAncestor: Boolean(image.closest('[aria-hidden="true"]')),
        src: image.currentSrc || image.getAttribute('src'),
      }))
    );

    imageAudit.forEach((image) => {
      if (image.ariaHiddenAncestor) {
        return;
      }
      expect(image.alt, image.src).toBeTruthy();
      expect(image.alt.trim().length, image.src).toBeGreaterThan(0);
    });

    const headingLevels = await page.locator('main h1, main h2, main h3').evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1)))
    );

    expect(headingLevels[0]).toBe(1);
    headingLevels.reduce((previous, current) => {
      expect(current - previous).toBeLessThanOrEqual(1);
      return current;
    });

    const contrastChecks = await contrastAudit(page, [
      { selector: '.site-header .logo-wordmark', backgroundSelector: '.site-header' },
      { selector: '.section-heading', backgroundSelector: 'body' },
    ]);

    contrastChecks.forEach((result) => {
      expect(result.missing).toBe(false);
      expect(result.ratio).toBeGreaterThanOrEqual(3);
    });
  });
});
