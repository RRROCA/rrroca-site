/**
 * Navigation consistency & broken link detection tests.
 *
 * Ensures every navigation surface links to real pages and that all
 * internal markdown links resolve to built routes. Runs post-build
 * against the public/ directory.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { BASE_PREFIX, CONTENT_DIR, PUBLIC_DIR, SITE_ORIGINS, isInternalUrl, resolveRoute } = require('./helpers/site-config');

const REPO_ROOT = path.resolve(__dirname, '..');

function collectFiles(dir, extension, results = []) {
  if (!fs.existsSync(dir)) return results;
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

const routeExists = (href) => Boolean(resolveRoute(href));

function loadDom(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  return new JSDOM(html).window.document;
}

/* ============================================================
   NAVIGATION CONSISTENCY — every nav surface must link to real pages
   ============================================================ */
describe('Navigation consistency', () => {
  const indexDoc = loadDom(path.join(PUBLIC_DIR, 'index.html'));

  it('header nav has expected menu items and all resolve', () => {
    const navLinks = indexDoc.querySelectorAll('.nav-main a[href]');
    const hrefs = Array.from(navLinks).map((a) => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href'),
    }));

    // Must include these sections at minimum
    const requiredSections = ['About', 'Safety', 'Events', 'Get Involved', 'Community', 'Governance', 'Resources', 'News'];
    requiredSections.forEach((section) => {
      expect(
        hrefs.some((h) => h.text.toLowerCase().includes(section.toLowerCase()))
      ).toBe(true);
    });

    // All links must resolve
    const broken = hrefs.filter((h) => {
      if (!h.href || h.href.startsWith('#') || h.href.startsWith('/.auth/') || !isInternalUrl(h.href)) return false;
      return !routeExists(h.href);
    });
    expect(broken).toEqual([]);
  });

  it('footer quick links all resolve to existing routes', () => {
    const footerLinks = indexDoc.querySelectorAll('.site-footer a[href]');
    const broken = [];
    footerLinks.forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#') || href.startsWith('/.auth/') || !isInternalUrl(href)) return;
      if (!routeExists(href)) {
        broken.push({ href, text: a.textContent.trim().substring(0, 40) });
      }
    });
    expect(broken).toEqual([]);
  });

  it('footer contains links to all major sections', () => {
    const footerLinks = Array.from(indexDoc.querySelectorAll('.site-footer a[href]'));
    const footerHrefs = footerLinks.map((a) => a.getAttribute('href')).join(' ');

    const requiredFooterLinks = [
      'about/', 'about/board-members/', 'safety/', 'news/', 'events/',
      'community/', 'get-involved/', 'board/', 'business-directory/', 'contact/'
    ];

    requiredFooterLinks.forEach((fragment) => {
      expect(footerHrefs).toContain(fragment);
    });
  });

  it('sidebar quick links all resolve to existing routes', () => {
    const sidebarLinks = indexDoc.querySelectorAll('.sidebar-link-list a[href]');
    const broken = [];
    sidebarLinks.forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#') || !isInternalUrl(href)) return;
      if (!routeExists(href)) {
        broken.push({ href, text: a.textContent.trim().substring(0, 40) });
      }
    });
    expect(broken).toEqual([]);
  });

  it('homepage quick-link cards all resolve', () => {
    const cards = indexDoc.querySelectorAll('.quick-links-grid .quick-link-card[href]');
    expect(cards.length).toBeGreaterThanOrEqual(6);

    const broken = [];
    cards.forEach((card) => {
      const href = card.getAttribute('href');
      if (!href || !isInternalUrl(href)) return;
      if (!routeExists(href)) {
        broken.push({ href, text: card.textContent.trim().substring(0, 40) });
      }
    });
    expect(broken).toEqual([]);
  });
});

/* ============================================================
   MARKDOWN INTERNAL LINKS — catch broken links at source level
   ============================================================ */
describe('Markdown internal link validation', () => {
  const markdownFiles = collectFiles(CONTENT_DIR, '.md');

  it('all markdown internal links resolve to built routes', () => {
    const broken = [];

    markdownFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      // Match [text](/path/) style links
      const linkPattern = /\]\((\/?[^)#\s]+)\)/g;
      let match;
      while ((match = linkPattern.exec(content)) !== null) {
        const href = match[1];
        // Skip external, mailto, tel, relative image paths
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('//') ||
            href.match(/\.(jpg|jpeg|png|gif|svg|pdf|docx|xlsx)$/i) || !isInternalUrl(href)) {
          continue;
        }
        // Only check absolute internal links (starting with /)
        if (!href.startsWith('/')) continue;

        if (!routeExists(href)) {
          broken.push({
            file: path.relative(REPO_ROOT, filePath),
            href,
          });
        }
      }
    });

    expect(broken).toEqual([]);
  });
});

/* ============================================================
   CROSS-PAGE LINK INTEGRITY — every internal link in built HTML resolves
   ============================================================ */
describe('Built HTML internal link integrity', () => {
  const allHtmlFiles = collectFiles(PUBLIC_DIR, '.html');

  it('every internal <a href> in the site resolves to an existing page', () => {
    const broken = [];
    const checked = new Set();

    allHtmlFiles.forEach((file) => {
      const doc = loadDom(file);
      const anchors = doc.querySelectorAll('a[href]');

      anchors.forEach((a) => {
        const href = a.getAttribute('href');
        if (!href || /^(mailto:|tel:|#|javascript:|data:)/i.test(href) ||
            !isInternalUrl(href)) {
          return;
        }
        const cleanHref = href.split('#')[0].split('?')[0];
        if (!cleanHref || checked.has(cleanHref)) return;
        // Skip Azure SWA runtime routes (auth endpoints handled by platform)
        if (cleanHref.startsWith('/.auth/')) return;
        checked.add(cleanHref);

        if (!routeExists(cleanHref)) {
          broken.push({
            file: path.relative(PUBLIC_DIR, file),
            href: cleanHref,
            text: a.textContent.trim().substring(0, 50),
          });
        }
      });
    });

    expect(broken).toEqual([]);
  });

  it('no page links to the removed /safety/report/ path', () => {
    const violations = [];

    allHtmlFiles.forEach((file) => {
      const html = fs.readFileSync(file, 'utf8');
      if (html.includes('/safety/report/') || html.includes('/safety/report"')) {
        violations.push(path.relative(PUBLIC_DIR, file));
      }
    });

    expect(violations).toEqual([]);
  });
});

/* ============================================================
   HUGO CONFIG MENU VALIDATION — hugo.toml menus match real content
   ============================================================ */
describe('Hugo config menu validation', () => {
  it('every menu URL in hugo.toml has a corresponding content directory', () => {
    const hugoToml = fs.readFileSync(path.join(REPO_ROOT, 'hugo.toml'), 'utf8');
    const menuBlocks = hugoToml.split('[[menus.main]]').slice(1);
    const menuItems = menuBlocks.map((block) => {
      const url = block.match(/url\s*=\s*"([^"]+)"/)?.[1];
      const name = block.match(/name\s*=\s*"([^"]+)"/)?.[1];
      return { name, url };
    }).filter((item) => item.url);

    expect(menuItems.length).toBeGreaterThanOrEqual(8);

    const broken = menuItems.filter((item) => !routeExists(item.url));
    expect(broken).toEqual([]);
  });
});

describe('negative navigation cases', () => {
  const allHtmlFiles = collectFiles(PUBLIC_DIR, '.html');

  function parseMainMenuItems() {
    const hugoToml = fs.readFileSync(path.join(REPO_ROOT, 'hugo.toml'), 'utf8');
    return hugoToml
      .split('[[menus.main]]')
      .slice(1)
      .map((block) => ({
        name: block.match(/name\s*=\s*"([^"]+)"/)?.[1],
        url: block.match(/url\s*=\s*"([^"]+)"/)?.[1],
      }))
      .filter((item) => item.name && item.url);
  }

  function resolveMenuContentFile(url) {
    let relativePath = url.split('#')[0].split('?')[0];
    if (BASE_PREFIX && relativePath.startsWith(BASE_PREFIX)) {
      relativePath = relativePath.slice(BASE_PREFIX.length);
    }
    relativePath = relativePath.replace(/^\/+|\/+$/g, '');

    const candidates = relativePath
      ? [
          path.join(CONTENT_DIR, relativePath, '_index.md'),
          path.join(CONTENT_DIR, `${relativePath}.md`),
          path.join(CONTENT_DIR, relativePath, 'index.md'),
        ]
      : [path.join(CONTENT_DIR, '_index.md')];

    return candidates.find((candidate) => fs.existsSync(candidate));
  }

  function hasDraftFrontMatter(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontMatter = content.startsWith('---')
      ? content.slice(3).split(/\r?\n---/)[0]
      : content.startsWith('+++')
        ? content.slice(3).split(/\r?\n\+\+\+/)[0]
        : '';

    return /^\s*draft\s*:\s*true\s*$/m.test(frontMatter) || /^\s*draft\s*=\s*true\s*$/m.test(frontMatter);
  }

  it('no nav link uses an external URL format for internal pages', () => {
    const indexDoc = loadDom(path.join(PUBLIC_DIR, 'index.html'));
    const navLinks = Array.from(
      indexDoc.querySelectorAll('.nav-main a[href], .site-footer a[href], .sidebar-link-list a[href]')
    );

    const violations = navLinks
      .map((link) => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href') || '',
      }))
      .filter((link) => {
        const normalizedHref = link.href.toLowerCase();
        return SITE_ORIGINS.some((origin) => normalizedHref.startsWith(origin.toLowerCase()));
      });

    expect(violations).toEqual([]);
  });

  it('no duplicate entries exist in header nav', () => {
    const menuItems = parseMainMenuItems();
    const duplicateUrls = [];
    const duplicateNames = [];
    const seenUrls = new Map();
    const seenNames = new Map();

    menuItems.forEach((item) => {
      if (seenUrls.has(item.url)) {
        duplicateUrls.push({ url: item.url, names: [seenUrls.get(item.url), item.name] });
      } else {
        seenUrls.set(item.url, item.name);
      }

      if (seenNames.has(item.name)) {
        duplicateNames.push({ name: item.name, urls: [seenNames.get(item.name), item.url] });
      } else {
        seenNames.set(item.name, item.url);
      }
    });

    expect(duplicateUrls).toEqual([]);
    expect(duplicateNames).toEqual([]);
  });

  it('no nav item points to a draft page', () => {
    const menuItems = parseMainMenuItems();
    const violations = menuItems
      .map((item) => ({
        ...item,
        filePath: resolveMenuContentFile(item.url),
      }))
      .filter((item) => !item.filePath || hasDraftFrontMatter(item.filePath))
      .map((item) => ({
        name: item.name,
        url: item.url,
        file: item.filePath ? path.relative(REPO_ROOT, item.filePath) : null,
      }));

    expect(violations).toEqual([]);
  });

  it('no anchor link in content points to a non-existent ID', () => {
    const violations = [];

    allHtmlFiles.forEach((filePath) => {
      const doc = loadDom(filePath);
      const anchors = doc.querySelectorAll('a[href^="#"]');

      anchors.forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        let targetId = href.slice(1).trim();
        if (!targetId) return;

        try {
          targetId = decodeURIComponent(targetId);
        } catch (_error) {
          // Leave the original fragment in place if it is not URI-encoded.
        }

        if (!doc.getElementById(targetId)) {
          violations.push({
            file: path.relative(PUBLIC_DIR, filePath),
            href,
            text: anchor.textContent.trim().substring(0, 50),
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('no page has more than one <h1> element', () => {
    const violations = allHtmlFiles
      .map((filePath) => {
        const doc = loadDom(filePath);
        const h1Count = doc.querySelectorAll('h1').length;
        return h1Count > 1
          ? {
              file: path.relative(PUBLIC_DIR, filePath),
              h1Count,
            }
          : null;
      })
      .filter(Boolean);

    expect(violations).toEqual([]);
  });
});
