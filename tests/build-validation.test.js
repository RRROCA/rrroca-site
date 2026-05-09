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

function routeExists(href) {
  const cleanHref = href.split('#')[0].split('?')[0];
  if (!cleanHref || cleanHref === '/') {
    return fs.existsSync(path.join(PUBLIC_DIR, 'index.html'));
  }

  const relativePath = cleanHref.replace(/^\/+/, '');
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
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'css', 'style.css'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'ai-assistant.js'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'forms.js'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'directory-search.js'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'safety-dashboard.js'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'search.js'))).toBe(true);
  });

  it('renders the redesigned homepage with current navigation and community sections', () => {
    const document = loadDocument(path.join('public', 'index.html'));

    expect(document.querySelector('.site-header .logo-img')).not.toBeNull();
    expect(document.querySelector('.site-header .search-trigger')).not.toBeNull();
    expect(
      [...document.querySelectorAll('.site-header a.btn')]
        .some((link) => /\/membership\/?$/.test(link.getAttribute('href') || ''))
    ).toBe(true);
    expect(document.querySelectorAll('.nav-main a').length).toBeGreaterThanOrEqual(10);

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
      '/community/parks-pathways/',
      '/safety/report/',
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

  it('keeps forms available on contact, volunteer, and safety report pages', () => {
    const formPages = [
      {
        file: path.join('public', 'contact', 'index.html'),
        fields: ['#contact-name', '#contact-email', '#contact-subject', '#contact-message']
      },
      {
        file: path.join('public', 'get-involved', 'volunteer', 'index.html'),
        fields: ['#volunteer-name', '#volunteer-email', '#volunteer-availability']
      },
      {
        file: path.join('public', 'safety', 'report', 'index.html'),
        fields: ['#report-type', '#report-location', '#report-description']
      }
    ];

    formPages.forEach(({ file, fields }) => {
      const document = loadDocument(file);
      const form = document.querySelector('form.rr-form[data-formspree]');

      expect(form).not.toBeNull();
      expect(form.getAttribute('method')).toBe('POST');
      expect(form.getAttribute('action')).toMatch(/^\/api\/forms\//);

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
