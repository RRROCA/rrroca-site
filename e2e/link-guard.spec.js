const { test, expect } = require('@playwright/test');

const KEY_PAGES = ['/', '/safety/', '/about/', '/news/', '/events/', '/get-involved/',
  '/business-directory/', '/contact/', '/gallery/', '/membership/',
  '/get-involved/volunteer/', '/get-involved/sponsorship/', '/about/board-of-directors/'];

test.describe('Link guard', () => {
  test('all nav links return HTTP 200', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const navHrefs = await page.locator('.nav-main a[href]:not(.nav-board-link)').evaluateAll((els) =>
      els.map((a) => a.getAttribute('href')).filter((h) => h && !/^javascript:/i.test(h))
    );

    expect(navHrefs.length).toBeGreaterThanOrEqual(8);

    const broken = [];
    for (const href of navHrefs) {
      const url = /^https?:\/\//i.test(href) ? href : new URL(href, page.url()).href;
      const response = await page.request.head(url);
      if (!response.ok()) {
        broken.push({ href, status: response.status() });
      }
    }

    expect(broken).toEqual([]);
  });

  test('no nav link contains a duplicate path segment', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const duplicates = await page.locator('.nav-main a[href]').evaluateAll((els) => {
      const pattern = /\/([^/]+)\/\1\//;
      return els
        .map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim() }))
        .filter((link) => link.href && pattern.test(link.href));
    });

    expect(duplicates).toEqual([]);
  });

  test('all internal links on key pages return HTTP 200', async ({ page }) => {
    const checked = new Set();
    const broken = [];

    for (const pagePath of KEY_PAGES) {
      const response = await page.goto(pagePath, { waitUntil: 'load' });
      if (!response || !response.ok()) {
        broken.push({ page: pagePath, status: response?.status() ?? 0 });
        continue;
      }

      const hrefs = await page.locator('a[href]').evaluateAll((els) =>
        els.map((a) => a.getAttribute('href'))
          .filter((h) => h && !h.startsWith('http://') && !h.startsWith('https://') &&
            !/^mailto:/i.test(h) && !/^tel:/i.test(h) && !h.startsWith('#') && !/^javascript:/i.test(h) && !h.startsWith('/.auth/'))
      );

      for (const href of hrefs) {
        const clean = href.split('#')[0].split('?')[0];
        if (checked.has(clean)) continue;
        checked.add(clean);

        const url = new URL(clean, page.url()).href;
        try {
          const res = await page.request.head(url);
          if (!res.ok()) {
            broken.push({ page: pagePath, href: clean, status: res.status() });
          }
        } catch {
          broken.push({ page: pagePath, href: clean, status: 'error' });
        }
      }
    }

    expect(broken).toEqual([]);
  });

  test('CSS and JS assets on homepage load successfully', async ({ page }) => {
    const missing = [];
    page.on('response', (response) => {
      const url = response.url();
      if ((url.endsWith('.css') || url.endsWith('.js')) && response.status() >= 400) {
        missing.push({ url, status: response.status() });
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    expect(missing).toEqual([]);
  });

  test('all images on homepage load successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const imgSrcs = await page.locator('img[src]').evaluateAll((imgs) =>
      imgs
        .filter((img) => !img.closest('[aria-hidden="true"]'))
        .map((img) => img.src)
        .filter((src) => src && !src.startsWith('data:'))
    );

    const broken = [];
    for (const src of [...new Set(imgSrcs)]) {
      try {
        const res = await page.request.head(src);
        if (!res.ok()) broken.push({ src, status: res.status() });
      } catch {
        broken.push({ src, status: 'error' });
      }
    }

    expect(broken).toEqual([]);
  });
});
