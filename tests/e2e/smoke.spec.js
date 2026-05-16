const { test, expect } = require('@playwright/test');

const APP_PREFIX = '/rrroca-site';

function appPath(pathname = '/') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${APP_PREFIX}${normalizedPath}`.replace(/\/{2,}/g, '/');
}

function toInternalPath(href) {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
    return null;
  }

  const url = new URL(href, 'http://localhost:1313');
  const isLocalhost = url.origin === 'http://localhost:1313' || url.origin === 'http://localhost';
  if (!isLocalhost && !url.pathname.startsWith(APP_PREFIX)) {
    return null;
  }

  return `${url.pathname}${url.search}`;
}

async function expectPageOk(page, pathname) {
  const response = await page.goto(pathname);
  expect(response, `Expected a response for ${pathname}`).not.toBeNull();
  expect(response.status(), `Expected ${pathname} to load successfully`).toBeLessThan(400);
  await expect(page.locator('main')).toBeVisible();
}

test('homepage loads with RRROCA branding in the title', async ({ page }) => {
  await expectPageOk(page, appPath('/'));
  await expect(page).toHaveTitle(/RRROCA|Rocky Ridge/i);
});

test('header navigation links load real pages', async ({ page }) => {
  await expectPageOk(page, appPath('/'));

  const navLinks = page.locator('.nav-main a[href]:not(.nav-cta)');
  await expect(navLinks).toHaveCount(8);

  const links = await navLinks.evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      text: anchor.textContent.trim(),
      href: anchor.getAttribute('href'),
    }))
  );

  for (const link of links) {
    const internalPath = toInternalPath(link.href);
    expect(internalPath, `Expected nav link "${link.text}" to be internal`).toBeTruthy();
    await expectPageOk(page, internalPath);
  }
});

test('footer internal links resolve', async ({ page }) => {
  await expectPageOk(page, appPath('/'));

  const footerLinks = await page.locator('.site-footer a[href]').evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      text: anchor.textContent.trim(),
      href: anchor.getAttribute('href'),
    }))
  );

  const internalLinks = footerLinks
    .map((link) => ({ ...link, path: toInternalPath(link.href) }))
    .filter((link) => link.path);
  expect(internalLinks.length).toBeGreaterThan(0);

  for (const link of internalLinks) {
    await expectPageOk(page, link.path);
  }
});

test('board of directors page is reachable from the About page', async ({ page }) => {
  await expectPageOk(page, appPath('/about/'));

  const boardLink = page.getByRole('link', { name: /board of directors/i }).first();
  await expect(boardLink).toBeVisible();

  const [response] = await Promise.all([
    page.waitForNavigation(),
    boardLink.click(),
  ]);

  expect(response, 'Expected board page navigation response').not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/rrroca-site\/about\/board-of-directors\/$/);
  await expect(page.getByRole('heading', { name: /^Board of Directors$/i }).first()).toBeVisible();
});

test('contact page loads', async ({ page }) => {
  await expectPageOk(page, appPath('/contact/'));
  await expect(page.getByRole('heading', { name: /^Contact Us$/i })).toBeVisible();
});

test('cms admin page serves HTML', async ({ page }) => {
  const response = await page.goto(appPath('/admin/'));
  expect(response, 'Expected admin page response').not.toBeNull();
  expect(response.status()).toBeLessThan(400);

  const contentType = response.headers()['content-type'] || '';
  expect(contentType).toContain('text/html');
  await expect(page.locator('html')).toBeVisible();
});

// --- Negative e2e tests ---

test('404 page renders for a garbage URL', async ({ page }) => {
  await page.goto('/rrroca-site/this-page-does-not-exist-xyz/');

  const content = await page.textContent('body');
  expect(content).toBeTruthy();
  expect(content.toLowerCase()).toMatch(/not found|404|page.*exist/);
});

test('homepage has no console errors', async ({ page }) => {
  const errors = [];
  const benignPatterns = [
    'favicon',
    '404 (Not Found)',
    'net::ERR',
    'ErrorUtils caught an error',
    'fburl.com/debugjs',
    'DataStore.get: namespace is required',
    'Could not find element',
    'facebook.com',
    'connect.facebook.net',
    'fb:xfbml',
    'Cross-Origin',
  ];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/rrroca-site/');
  await page.waitForLoadState('networkidle');

  const realErrors = errors.filter(
    (error) => !benignPatterns.some((pattern) => error.includes(pattern))
  );
  expect(realErrors).toHaveLength(0);
});

test('no mixed content warnings on homepage', async ({ page }) => {
  const mixedContent = [];
  page.on('console', (msg) => {
    if (msg.text().toLowerCase().includes('mixed content')) {
      mixedContent.push(msg.text());
    }
  });

  await page.goto('/rrroca-site/');
  await page.waitForLoadState('networkidle');
  expect(mixedContent).toHaveLength(0);
});

test('critical content is visible without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/rrroca-site/');

  const title = await page.textContent('h1, .hero-title, .site-title');
  expect(title).toBeTruthy();

  const nav = await page.locator('nav a, .nav-main a').count();
  expect(nav).toBeGreaterThan(0);

  await context.close();
});
