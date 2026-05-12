const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

function readFile(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function collectFiles(dir, extension, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, extension, results);
    } else if (fullPath.endsWith(extension)) {
      results.push(fullPath);
    }
  }

  return results;
}

function loadDocument(relativePath) {
  const dom = new JSDOM(readFile(relativePath));
  return dom.window.document;
}

// Detect baseURL path prefix from the build output (e.g. /rrroca-site/)
const BASE_PREFIX = (() => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) return '';
  const html = fs.readFileSync(indexPath, 'utf8');
  const match = html.match(/href=["']?(\/[^"'\s>]+?)\/about\/["'\s>]/);
  return match ? match[1] : '';
})();

function routeExists(href) {
  const cleanHref = href.split('#')[0].split('?')[0];
  if (!cleanHref || cleanHref === '/' || cleanHref === `${BASE_PREFIX}/`) {
    return fs.existsSync(path.join(PUBLIC_DIR, 'index.html'));
  }

  // Strip the baseURL path prefix if present (e.g. /rrroca-site/about/ → /about/)
  let relativePath = cleanHref;
  if (BASE_PREFIX && relativePath.startsWith(BASE_PREFIX)) {
    relativePath = relativePath.slice(BASE_PREFIX.length);
  }
  relativePath = relativePath.replace(/^\/+/, '');
  const directPath = path.join(PUBLIC_DIR, relativePath);

  return (
    fs.existsSync(directPath) ||
    fs.existsSync(`${directPath}.html`) ||
    fs.existsSync(path.join(directPath, 'index.html'))
  );
}

describe('Hugo build validation', () => {
  it('generates the expected core build artifacts', () => {
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'index.json'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'safety', 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, '404.html'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'ai-assistant.js'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'forms.js'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'directory-search.js'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'safety-dashboard.js'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'search.js'))).toBe(true);

    const indexDocument = loadDocument(path.join('public', 'index.html'));
    const stylesheet = indexDocument.querySelector('link[rel="stylesheet"][href*="/css/style."]');
    expect(stylesheet).not.toBeNull();
    expect(stylesheet.getAttribute('href')).toMatch(/\/css\/style\.[a-f0-9]{16,}\.css$/i);
    expect(stylesheet.getAttribute('integrity')).toMatch(/^sha(256|384|512)-/);
    expect(stylesheet.getAttribute('crossorigin')).toBe('anonymous');
  });

  it('renders the redesigned homepage with current navigation and community sections', () => {
    const document = loadDocument(path.join('public', 'index.html'));

    expect(document.querySelector('.site-header .logo-img')).not.toBeNull();
    expect(document.querySelector('.site-header .search-trigger')).not.toBeNull();
    expect(
      [...document.querySelectorAll('.site-header a.btn')]
        .some((link) => /membership/.test(link.getAttribute('href') || ''))
    ).toBe(true);
    expect(document.querySelectorAll('.nav-main a').length).toBeGreaterThanOrEqual(7);

    expect(document.querySelector('#hero.hero')).not.toBeNull();
    expect(document.querySelectorAll('.community-strip .strip-track:not([aria-hidden="true"]) .strip-item')).toHaveLength(4);
    expect(document.querySelectorAll('.quick-links-grid .quick-link-card')).toHaveLength(6);
    expect(document.querySelectorAll('.involve-grid .involve-card')).toHaveLength(3);
    expect(document.querySelectorAll('.involve-card-icon')).toHaveLength(3);
    expect(document.querySelectorAll('.involve-card img')).toHaveLength(0);
    expect(document.querySelector('#safety-dashboard')).not.toBeNull();
    expect(document.querySelectorAll('.news-grid .news-card').length).toBeGreaterThanOrEqual(3);
    expect(document.querySelector('#membership .membership-tiers-inline')).not.toBeNull();
    expect(document.querySelector('.emergency-bar')).not.toBeNull();
    expect(document.querySelectorAll('.emergency-contacts a')).toHaveLength(3);
  });

  it('produces a valid search index and static web app configuration', () => {
    const searchIndex = JSON.parse(readFile(path.join('public', 'index.json')));
    const staticWebAppConfig = JSON.parse(readFile('staticwebapp.config.json'));

    expect(Array.isArray(searchIndex)).toBe(true);
    expect(searchIndex.length).toBeGreaterThan(0);
    expect(searchIndex[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        permalink: expect.any(String)
      })
    );

    expect(staticWebAppConfig).toEqual(
      expect.objectContaining({
        routes: expect.any(Array),
        responseOverrides: expect.any(Object),
        globalHeaders: expect.any(Object),
        mimeTypes: expect.any(Object)
      })
    );
    expect(staticWebAppConfig.routes.length).toBeGreaterThan(0);
    expect(staticWebAppConfig.responseOverrides['404']).toEqual(
      expect.objectContaining({
        rewrite: '/404.html',
        statusCode: 404
      })
    );
  });

  it('keeps primary navigation and key homepage routes available in the build output', () => {
    const requiredRoutes = [
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
      '/get-involved/sponsorship/',
      '/about/board-of-directors/',
      '/about/board-members/',
      '/community/',
      '/community/parks-pathways/',
      '/sports/',
      '/board/',
      '/safety/electrical-safety/',
      '/safety/winter-safety/',
      '/safety/wild-animal-safety/'
    ];

    requiredRoutes.forEach((href) => {
      expect(routeExists(href)).toBe(true);
    });
  });

  it('renders new content pages, gallery, and business directory routes', () => {
    const pages = [
      {
        file: path.join('public', 'about', 'board-of-directors', 'index.html'),
        heading: 'Board of Directors'
      },
      {
        file: path.join('public', 'community', 'parks-pathways', 'index.html'),
        heading: 'Parks and Pathways'
      },
      {
        file: path.join('public', 'safety', 'electrical-safety', 'index.html'),
        heading: 'Electrical Safety'
      },
      {
        file: path.join('public', 'safety', 'winter-safety', 'index.html'),
        heading: 'Winter Safety'
      },
      {
        file: path.join('public', 'safety', 'wild-animal-safety', 'index.html'),
        heading: 'Wild Animals'
      },
      {
        file: path.join('public', 'gallery', 'index.html'),
        heading: 'Community Gallery'
      },
      {
        file: path.join('public', 'business-directory', 'index.html'),
        heading: 'Community Business Directory'
      }
    ];

    pages.forEach(({ file, heading }) => {
      const document = loadDocument(file);
      expect(document.querySelector('main h1')?.textContent).toMatch(new RegExp(heading, 'i'));
    });

    const galleryDocument = loadDocument(path.join('public', 'gallery', 'index.html'));
    expect(galleryDocument.querySelectorAll('.gallery-grid .gallery-card').length).toBeGreaterThan(0);

    const directoryDocument = loadDocument(path.join('public', 'business-directory', 'index.html'));
    expect(directoryDocument.querySelectorAll('[data-directory-card]').length).toBeGreaterThan(0);
  });

  it('keeps forms available on contact and volunteer pages', () => {
    const formPages = [
      {
        file: path.join('public', 'contact', 'index.html'),
        fields: ['#contact-name', '#contact-email', '#contact-subject', '#contact-message']
      },
      {
        file: path.join('public', 'get-involved', 'volunteer', 'index.html'),
        fields: ['#volunteer-name', '#volunteer-email', '#volunteer-availability']
      }
    ];

    formPages.forEach(({ file, fields }) => {
      const document = loadDocument(file);
      const form = document.querySelector('form.rr-form[data-formspree], form.rr-form[data-mailto]');

      expect(form).not.toBeNull();

      fields.forEach((selector) => {
        expect(document.querySelector(selector)).not.toBeNull();
      });
    });
  });

  it('includes core meta tags across generated HTML pages', () => {
    const htmlFiles = [
      path.join(PUBLIC_DIR, 'index.html'),
      path.join(PUBLIC_DIR, 'safety', 'index.html'),
      path.join(PUBLIC_DIR, '404.html'),
      path.join(PUBLIC_DIR, 'gallery', 'index.html'),
      path.join(PUBLIC_DIR, 'business-directory', 'index.html')
    ];

    htmlFiles.forEach((htmlFile) => {
      const html = fs.readFileSync(htmlFile, 'utf8');
      expect(html).toMatch(/<meta\s+charset=["']?utf-8["']?/i);
      expect(html).toMatch(/<meta\s+name=(?:"|')?viewport(?:"|')?/i);
      expect(html).toMatch(/<meta\s+name=(?:"|')?description(?:"|')?/i);
      expect(html).toMatch(/<meta\s+property=(?:"|')?og:title(?:"|')?/i);
      expect(html).toMatch(/<link\s+rel=(?:"|')?canonical(?:"|')?/i);
    });
  });
});

/* ============================================
   LINK GUARD — prevent broken links from reaching production
   ============================================ */
describe('Link guard', () => {
  const allHtmlFiles = collectFiles(PUBLIC_DIR, '.html');

  it('no href contains a duplicate path segment (e.g. /rrroca-site/rrroca-site/)', () => {
    const duplicatePattern = /\/([^/]+)\/\1\//;
    const violations = [];

    allHtmlFiles.forEach((file) => {
      const html = fs.readFileSync(file, 'utf8');
      const dom = new JSDOM(html);
      const anchors = dom.window.document.querySelectorAll('a[href]');

      anchors.forEach((a) => {
        const href = a.getAttribute('href');
        if (href && duplicatePattern.test(href)) {
          violations.push({
            file: path.relative(PUBLIC_DIR, file),
            href,
            text: a.textContent.trim().substring(0, 40)
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('no asset src contains a duplicate path segment', () => {
    const duplicatePattern = /\/([^/]+)\/\1\//;
    const violations = [];

    allHtmlFiles.forEach((file) => {
      const html = fs.readFileSync(file, 'utf8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const assets = [
        ...doc.querySelectorAll('link[href]'),
        ...doc.querySelectorAll('script[src]'),
        ...doc.querySelectorAll('img[src]')
      ];

      assets.forEach((el) => {
        const src = el.getAttribute('href') || el.getAttribute('src');
        if (src && duplicatePattern.test(src)) {
          violations.push({
            file: path.relative(PUBLIC_DIR, file),
            src,
            tag: el.tagName.toLowerCase()
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('all internal links in the build output resolve to existing files', () => {
    const missing = [];
    const checked = new Set();

    allHtmlFiles.forEach((file) => {
      const html = fs.readFileSync(file, 'utf8');
      const dom = new JSDOM(html);
      const anchors = dom.window.document.querySelectorAll('a[href]');

      anchors.forEach((a) => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('mailto:') ||
            href.startsWith('tel:') || href.startsWith('#') || href.startsWith('javascript:')) {
          return;
        }
        const cleanHref = href.split('#')[0].split('?')[0];
        if (checked.has(cleanHref)) return;
        checked.add(cleanHref);

        if (!routeExists(cleanHref)) {
          missing.push({
            file: path.relative(PUBLIC_DIR, file),
            href: cleanHref,
            text: a.textContent.trim().substring(0, 40)
          });
        }
      });
    });

    expect(missing).toEqual([]);
  });

  it('all CSS and JS assets referenced in HTML exist on disk', () => {
    const missing = [];
    const checked = new Set();

    allHtmlFiles.forEach((file) => {
      const html = fs.readFileSync(file, 'utf8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const assets = [
        ...Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]')).map((el) => el.getAttribute('href')),
        ...Array.from(doc.querySelectorAll('script[src]')).map((el) => el.getAttribute('src'))
      ];

      assets.forEach((src) => {
        if (!src || src.startsWith('http') || src.includes('livereload') || checked.has(src)) return;
        checked.add(src);
        // Strip baseURL prefix (e.g. /rrroca-site/) so path resolves on disk
        let cleanSrc = src.split('?')[0];
        if (BASE_PREFIX && cleanSrc.startsWith(BASE_PREFIX + '/')) {
          cleanSrc = cleanSrc.slice(BASE_PREFIX.length);
        }
        cleanSrc = cleanSrc.replace(/^\/+/, '');
        const diskPath = path.join(PUBLIC_DIR, cleanSrc);
        if (!fs.existsSync(diskPath)) {
          missing.push({ file: path.relative(PUBLIC_DIR, file), src });
        }
      });
    });

    expect(missing).toEqual([]);
  });

  it('nav menu links all resolve to existing routes', () => {
    const indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
    const dom = new JSDOM(indexHtml);
    const navLinks = dom.window.document.querySelectorAll('.nav-main a[href]');

    expect(navLinks.length).toBeGreaterThanOrEqual(8);

    const broken = [];
    navLinks.forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) return;
      if (!routeExists(href)) {
        broken.push({ href, text: a.textContent.trim() });
      }
    });

    expect(broken).toEqual([]);
  });
});

describe('negative cases', () => {
  const htmlFiles = collectFiles(PUBLIC_DIR, '.html');
  const placeholderPatterns = [
    /lorem ipsum/i,
    /\bTODO\b/i,
    /\bFIXME\b/i,
    /\bTBD\b/i,
    /\bplaceholder\b/i,
    /coming soon/i
  ];
  const SITE_ORIGIN = (() => {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) return '';

    const html = fs.readFileSync(indexPath, 'utf8');
    const canonicalMatch = html.match(/<link\s+rel=(?:"|')?canonical(?:"|')?\s+href=(?:"|')?([^"'\s>]+)/i);
    if (!canonicalMatch) return '';

    try {
      return new URL(canonicalMatch[1]).origin;
    } catch {
      return '';
    }
  })();

  function resolveLocalImagePath(sourceFile, src) {
    if (!src || src.startsWith('data:') || src.startsWith('//')) return null;

    const cleanSrc = src.split('#')[0].split('?')[0];
    if (!cleanSrc) return null;

    if (/^https?:\/\//i.test(cleanSrc)) {
      try {
        const url = new URL(cleanSrc);
        if (!SITE_ORIGIN || url.origin !== SITE_ORIGIN) return null;

        let relativePath = url.pathname;
        if (BASE_PREFIX && relativePath.startsWith(BASE_PREFIX)) {
          relativePath = relativePath.slice(BASE_PREFIX.length);
        }

        return path.join(PUBLIC_DIR, relativePath.replace(/^\/+/, ''));
      } catch {
        return null;
      }
    }

    let relativePath = cleanSrc;
    if (BASE_PREFIX && relativePath.startsWith(BASE_PREFIX)) {
      relativePath = relativePath.slice(BASE_PREFIX.length);
    }

    if (relativePath.startsWith('/')) {
      return path.join(PUBLIC_DIR, relativePath.replace(/^\/+/, ''));
    }

    return path.resolve(path.dirname(sourceFile), relativePath);
  }

  it('404 page exists and contains helpful content', () => {
    const notFoundPath = path.join(PUBLIC_DIR, '404.html');
    expect(fs.existsSync(notFoundPath)).toBe(true);

    const document = loadDocument(path.join('public', '404.html'));
    const pageText = document.body.textContent.replace(/\s+/g, ' ').trim();
    const homepageLink = [...document.querySelectorAll('a[href]')].find((link) => {
      const href = link.getAttribute('href');
      if (!href) return false;

      if (href === '/' || href === `${BASE_PREFIX || ''}/`) return true;

      try {
        return SITE_ORIGIN ? new URL(href).href === `${SITE_ORIGIN}${BASE_PREFIX || ''}/` : false;
      } catch {
        return false;
      }
    });

    expect(pageText).toMatch(/404|not found/i);
    expect(homepageLink).toBeDefined();
  });

  it('no HTML file contains an empty <main> or <article> element', () => {
    const violations = [];

    htmlFiles.forEach((file) => {
      const html = fs.readFileSync(file, 'utf8');
      const dom = new JSDOM(html);

      dom.window.document.querySelectorAll('main, article').forEach((element) => {
        const textContent = (element.textContent || '').replace(/\s+/g, '').trim();
        const hasNonTextContent = Boolean(
          element.querySelector('img, svg, video, canvas, iframe, form, input, button, select, textarea')
        );

        if (!textContent && !hasNonTextContent) {
          violations.push({
            file: path.relative(PUBLIC_DIR, file),
            tag: element.tagName.toLowerCase()
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('no page contains placeholder text', () => {
    const violations = [];

    htmlFiles.forEach((file) => {
      const html = fs.readFileSync(file, 'utf8');
      const dom = new JSDOM(html);
      const bodyText = (dom.window.document.body?.textContent || '').replace(/\s+/g, ' ').trim();

      placeholderPatterns.forEach((pattern) => {
        if (pattern.test(bodyText)) {
          violations.push({
            file: path.relative(PUBLIC_DIR, file),
            pattern: pattern.toString()
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('no built page references a non-existent image', () => {
    const missingImages = [];

    htmlFiles.forEach((file) => {
      const html = fs.readFileSync(file, 'utf8');
      const dom = new JSDOM(html);

      dom.window.document.querySelectorAll('img[src]').forEach((image) => {
        const src = image.getAttribute('src');
        const diskPath = resolveLocalImagePath(file, src);

        if (diskPath && !fs.existsSync(diskPath)) {
          missingImages.push({
            file: path.relative(PUBLIC_DIR, file),
            src
          });
        }
      });
    });

    expect(missingImages).toEqual([]);
  });

  it('no page contains raw Hugo template syntax', () => {
    const violations = [];
    const hugoTemplatePattern = /\{\{[^}]+}}|\{\{<[\s\S]*?>}}|\{\{%[\s\S]*?%}}/;

    htmlFiles.forEach((file) => {
      const html = fs.readFileSync(file, 'utf8');
      if (hugoTemplatePattern.test(html)) {
        violations.push(path.relative(PUBLIC_DIR, file));
      }
    });

    expect(violations).toEqual([]);
  });
});
