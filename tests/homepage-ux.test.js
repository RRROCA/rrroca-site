const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const HOMEPAGE_HTML = path.join(PUBLIC_DIR, 'index.html');
const SOURCE_CSS = path.join(REPO_ROOT, 'themes', 'rrroca', 'static', 'css', 'style.css');
const SOURCE_LAYOUTS_DIR = path.join(REPO_ROOT, 'themes', 'rrroca', 'layouts');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function loadHomepage() {
  return new JSDOM(read(HOMEPAGE_HTML)).window.document;
}

function walkFiles(dir, extension, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, extension, results);
    } else if (fullPath.endsWith(extension)) {
      results.push(fullPath);
    }
  }

  return results;
}

function toPublicAssetPath(assetUrl) {
  if (!assetUrl || assetUrl.startsWith('data:') || assetUrl.startsWith('mailto:') || assetUrl.startsWith('tel:')) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(assetUrl, 'http://localhost:1314/');
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return null;
  }

  let relativePath = parsed.pathname.replace(/^\/+/, '');
  // Strip baseURL prefix (e.g. "rrroca-site/") for GitHub Pages subdirectory
  relativePath = relativePath.replace(/^rrroca-site\//, '');
  return path.join(PUBLIC_DIR, relativePath.split('/').join(path.sep));
}

function routeExists(href) {
  if (!href) {
    return false;
  }

  const parsed = new URL(href, 'http://localhost:1314/');
  let cleanPath = parsed.pathname;
  // Strip baseURL prefix for GitHub Pages subdirectory
  cleanPath = cleanPath.replace(/^\/rrroca-site/, '');
  if (cleanPath === '/' || cleanPath === '') {
    return fs.existsSync(HOMEPAGE_HTML);
  }

  const relativePath = cleanPath.replace(/^\/+/, '');
  const directPath = path.join(PUBLIC_DIR, relativePath);

  return (
    fs.existsSync(directPath) ||
    fs.existsSync(`${directPath}.html`) ||
    fs.existsSync(path.join(directPath, 'index.html'))
  );
}

describe('Homepage UX contract', () => {
  it('renders all critical homepage sections in the built HTML', () => {
    const document = loadHomepage();

    const requiredSections = [
      '#hero.hero',
      '.community-strip',
      '.quick-links',
      '.get-involved-strip',
      '#safety-dashboard',
      '.news-grid',
      '#membership.membership-section',
      '.emergency-bar',
    ];

    requiredSections.forEach((selector) => {
      expect(document.querySelector(selector)).not.toBeNull();
    });
  });

  it('ships valid homepage image and background-image asset references', () => {
    const document = loadHomepage();
    const missingAssets = [];

    document.querySelectorAll('img[src]').forEach((img) => {
      const assetPath = toPublicAssetPath(img.getAttribute('src'));
      if (assetPath && !fs.existsSync(assetPath)) {
        missingAssets.push({ type: 'img', asset: img.getAttribute('src') });
      }
    });

    document.querySelectorAll('[style*="background-image"]').forEach((node) => {
      const style = node.getAttribute('style') || '';
      const matches = [...style.matchAll(/url\((['"]?)(.*?)\1\)/g)];
      matches.forEach(([, , asset]) => {
        const assetPath = toPublicAssetPath(asset);
        if (assetPath && !fs.existsSync(assetPath)) {
          missingAssets.push({ type: 'background', asset });
        }
      });
    });

    expect(missingAssets).toEqual([]);
  });

  it('contains no leading-slash absURL template calls in theme layouts', () => {
    const violations = [];
    const htmlFiles = walkFiles(SOURCE_LAYOUTS_DIR, '.html');
    const badAbsUrlPattern = /\{\{\s*"\/.*?\|\s*absURL/g;

    htmlFiles.forEach((filePath) => {
      const source = read(filePath);
      if (badAbsUrlPattern.test(source)) {
        violations.push(path.relative(REPO_ROOT, filePath));
      }
    });

    expect(violations).toEqual([]);
  });

  it('includes the homepage animation keyframes required by the UX spec', () => {
    const css = read(SOURCE_CSS);
    ['heroReveal', 'heroParallax', 'heroGlow', 'stripMarquee'].forEach((keyframe) => {
      expect(css).toMatch(new RegExp(`@keyframes\\s+${keyframe}\\b`));
    });
  });

  it('keeps homepage CTA links real, non-empty, and routable', () => {
    const document = loadHomepage();
    const ctaSelectors = [
      '.hero-actions a.btn',
      '.quick-links-grid a.quick-link-card',
      '.involve-grid a.involve-card',
      '#membership .membership-actions a.btn',
      '.news-grid a.read-more',
    ];

    const hrefs = ctaSelectors.flatMap((selector) =>
      [...document.querySelectorAll(selector)].map((link) => link.getAttribute('href'))
    );

    expect(hrefs.length).toBeGreaterThanOrEqual(10);
    hrefs.forEach((href) => {
      expect(href).toBeTruthy();
      expect(href).not.toMatch(/^(#|javascript:|todo)/i);
      expect(routeExists(href)).toBe(true);
    });
  });

  it('includes a responsive viewport meta tag', () => {
    const document = loadHomepage();
    const viewport = document.querySelector('meta[name="viewport"]');

    expect(viewport).not.toBeNull();
    expect(viewport.getAttribute('content')).toMatch(/width=device-width/i);
  });

  it('keeps mobile breakpoints for 1024px, 768px, and 480px in the main stylesheet', () => {
    const css = read(SOURCE_CSS);
    [1024, 768, 480].forEach((breakpoint) => {
      expect(css).toMatch(new RegExp(`@media\\s*\\(max-width:\\s*${breakpoint}px\\)`));
    });
  });

  it('does not reference undefined CSS custom properties', () => {
    const css = read(SOURCE_CSS);
    const defined = new Set([...css.matchAll(/--([A-Za-z0-9-]+)\s*:/g)].map((match) => match[1]));
    const used = new Set([...css.matchAll(/var\(--([A-Za-z0-9-]+)/g)].map((match) => match[1]));
    const undefinedVars = [...used].filter((name) => !defined.has(name)).sort();

    expect(undefinedVars).toEqual([]);
  });

  it('uses semantic sections and a sane heading hierarchy on the homepage', () => {
    const document = loadHomepage();
    const sectionExpectations = [
      ['#hero', 'h1'],
      ['.quick-links', 'h2'],
      ['.get-involved-strip', 'h2'],
      ['#safety-dashboard', 'h2'],
      ['.bg-alt', 'h2'],
      ['#membership', 'h2'],
      ['.emergency-bar', 'h2'],
    ];

    sectionExpectations.forEach(([selector, headingSelector]) => {
      const section = document.querySelector(selector);
      expect(section).not.toBeNull();
      expect(section.querySelector(headingSelector)).not.toBeNull();
    });

    const headingLevels = [...document.querySelectorAll('main h1, main h2, main h3')]
      .map((heading) => Number(heading.tagName.slice(1)));

    expect(headingLevels[0]).toBe(1);
    headingLevels.reduce((previous, current) => {
      expect(current - previous).toBeLessThanOrEqual(1);
      return current;
    });
  });

  it('keeps emergency contacts available as tel links', () => {
    const document = loadHomepage();
    const telLinks = [...document.querySelectorAll('.emergency-contacts a[href^="tel:"]')];

    expect(telLinks).toHaveLength(2);
    telLinks.forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^tel:/);
      expect(link.textContent.trim().length).toBeGreaterThan(0);
    });
  });
});
