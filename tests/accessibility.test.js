const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const HAS_BUILD = fs.existsSync(PUBLIC_DIR);
const describeSuite = HAS_BUILD ? describe : describe.skip;

const KNOWN_DECORATIVE_IMAGE_PATTERNS = [
  'spacer',
  'pixel',
  'blank.gif',
  'transparent.gif',
  'clear.gif',
  'data:image/gif;base64,r0lgodlhAQAB'
];

function walkHtml(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtml(fullPath, results);
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.html') {
      results.push(fullPath);
    }
  }

  return results;
}

function parsePage(htmlContent) {
  return new JSDOM(htmlContent);
}

function loadPage(filePath) {
  return parsePage(fs.readFileSync(filePath, 'utf8'));
}

function relativePublicPath(filePath) {
  return path.relative(REPO_ROOT, filePath);
}

function isKnownDecorativeImage(src) {
  const normalizedSrc = (src || '').toLowerCase();
  return KNOWN_DECORATIVE_IMAGE_PATTERNS.some((pattern) => normalizedSrc.includes(pattern));
}

function is404Page(filePath) {
  return path.basename(filePath).toLowerCase() === '404.html';
}

function isAdminPage(filePath) {
  const relativePath = relativePublicPath(filePath).toLowerCase();
  return relativePath === `public${path.sep}admin${path.sep}index.html`;
}

function isMetaRefreshRedirectPage(document) {
  const hasRefresh = Array.from(document.querySelectorAll('meta[http-equiv]')).some(
    (meta) => (meta.getAttribute('http-equiv') || '').trim().toLowerCase() === 'refresh'
  );
  const bodyText = (document.body?.textContent || '').replace(/\s+/g, '').trim();
  return hasRefresh && bodyText.length === 0;
}

function isPaginationAliasPage(filePath) {
  const relativePath = relativePublicPath(filePath).toLowerCase();
  return relativePath.includes(`${path.sep}page${path.sep}1${path.sep}index.html`);
}

function hasDiscernibleLinkText(link) {
  const ariaLabel = (link.getAttribute('aria-label') || '').trim();
  const ariaLabelledBy = (link.getAttribute('aria-labelledby') || '').trim();
  const textContent = (link.textContent || '').replace(/\s+/g, ' ').trim();

  if (ariaLabel || ariaLabelledBy || textContent) {
    return true;
  }

  const images = Array.from(link.querySelectorAll('img[alt]'));
  return images.length > 0 && images.every((image) => (image.getAttribute('alt') || '').trim().length > 0);
}

function isExcludedControl(control) {
  if (control.closest('.honeypot')) {
    return true;
  }

  if (control.matches('[hidden], [aria-hidden="true"]')) {
    return true;
  }

  const type = (control.getAttribute('type') || '').toLowerCase();
  return ['hidden', 'submit', 'button', 'reset', 'image'].includes(type);
}

function hasAssociatedLabel(control, document) {
  if ((control.getAttribute('aria-label') || '').trim()) {
    return true;
  }

  if ((control.getAttribute('aria-labelledby') || '').trim()) {
    return true;
  }

  if (control.closest('label')) {
    return true;
  }

  const id = (control.getAttribute('id') || '').trim();
  if (!id) {
    return false;
  }

  return Boolean(document.querySelector(`label[for="${id}"]`));
}

const htmlFiles = walkHtml(PUBLIC_DIR);
const pageFixtures = HAS_BUILD
  ? htmlFiles.map((filePath) => {
      const dom = loadPage(filePath);
      return {
        filePath,
        relativePath: relativePublicPath(filePath),
        document: dom.window.document
      };
    })
  : [];

describeSuite('built site accessibility', () => {
  it('images have alt attributes', () => {
    const violations = [];

    pageFixtures.forEach(({ relativePath, document }) => {
      document.querySelectorAll('img').forEach((image) => {
        const src = image.getAttribute('src') || '';
        if (isKnownDecorativeImage(src)) {
          return;
        }

        if (!image.hasAttribute('alt')) {
          violations.push({
            file: relativePath,
            src
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('heading hierarchy does not skip levels', () => {
    const violations = [];

    pageFixtures.forEach(({ relativePath, document }) => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const sequence = headings.map((heading) => heading.tagName.toLowerCase());
      let previousLevel = null;

      headings.forEach((heading) => {
        const currentLevel = Number(heading.tagName.charAt(1));
        if (previousLevel !== null && currentLevel > previousLevel + 1) {
          violations.push({
            file: relativePath,
            sequence
          });
        }
        previousLevel = currentLevel;
      });
    });

    expect(violations).toEqual([]);
  });

  it('has at most one h1 per page', () => {
    const violations = [];

    pageFixtures.forEach(({ relativePath, document }) => {
      const h1s = document.querySelectorAll('h1');

      if (h1s.length > 1) {
        violations.push({
          file: relativePath,
          count: h1s.length,
          headings: Array.from(h1s).map((heading) => (heading.textContent || '').replace(/\s+/g, ' ').trim())
        });
      }
    });

    expect(violations).toEqual([]);
  });

  it('includes required ARIA landmarks', () => {
    const violations = [];

    pageFixtures.forEach(({ filePath, relativePath, document }) => {
      if (
        is404Page(filePath) ||
        isAdminPage(filePath) ||
        isMetaRefreshRedirectPage(document) ||
        isPaginationAliasPage(filePath)
      ) {
        return;
      }
      const hasMain = Boolean(document.querySelector('main, [role="main"]'));
      const hasNav = Boolean(document.querySelector('nav, [role="navigation"]'));

      if (!hasMain || !hasNav) {
        violations.push({
          file: relativePath,
          hasMain,
          hasNav
        });
      }
    });

    expect(violations).toEqual([]);
  });

  it('links have discernible text', () => {
    const violations = [];

    pageFixtures.forEach(({ relativePath, document }) => {
      document.querySelectorAll('a[href]').forEach((link) => {
        if (!hasDiscernibleLinkText(link)) {
          violations.push({
            file: relativePath,
            href: link.getAttribute('href') || ''
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('form inputs have associated labels', () => {
    const violations = [];

    pageFixtures.forEach(({ relativePath, document }) => {
      document.querySelectorAll('input, select, textarea').forEach((control) => {
        if (isExcludedControl(control)) {
          return;
        }

        if (!hasAssociatedLabel(control, document)) {
          violations.push({
            file: relativePath,
            tag: control.tagName.toLowerCase(),
            id: control.getAttribute('id') || '',
            name: control.getAttribute('name') || ''
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('has no positive tabindex values', () => {
    const violations = [];

    pageFixtures.forEach(({ relativePath, document }) => {
      document.querySelectorAll('[tabindex]').forEach((element) => {
        const value = Number.parseInt(element.getAttribute('tabindex') || '', 10);
        if (!Number.isNaN(value) && value > 0) {
          violations.push({
            file: relativePath,
            tag: element.tagName.toLowerCase(),
            tabindex: value
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('html element has a language attribute', () => {
    const violations = [];

    pageFixtures.forEach(({ relativePath, document }) => {
      const html = document.documentElement;
      const lang = (html.getAttribute('lang') || '').trim();

      if (!lang) {
        violations.push({
          file: relativePath
        });
      }
    });

    expect(violations).toEqual([]);
  });
});
