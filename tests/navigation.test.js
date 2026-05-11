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

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const CONTENT_DIR = path.join(REPO_ROOT, 'content');

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

// Detect baseURL path prefix from the build output
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
    const requiredSections = ['About', 'Safety', 'News', 'Events', 'Community', 'Governance', 'Get Involved', 'Directory'];
    requiredSections.forEach((section) => {
      expect(
        hrefs.some((h) => h.text.toLowerCase().includes(section.toLowerCase()))
      ).toBe(true);
    });

    // All links must resolve
    const broken = hrefs.filter((h) => {
      if (!h.href || h.href.startsWith('http') || h.href.startsWith('#')) return false;
      return !routeExists(h.href);
    });
    expect(broken).toEqual([]);
  });

  it('footer quick links all resolve to existing routes', () => {
    const footerLinks = indexDoc.querySelectorAll('.site-footer a[href]');
    const broken = [];
    footerLinks.forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
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
      'about/', 'board-of-directors/', 'safety/', 'news/', 'events/',
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
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
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
      if (!href || href.startsWith('http')) return;
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
        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') ||
            href.startsWith('//') || href.match(/\.(jpg|jpeg|png|gif|svg|pdf|docx|xlsx)$/i)) {
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
        if (!href || href.startsWith('http') || href.startsWith('mailto:') ||
            href.startsWith('tel:') || href.startsWith('#') || href.startsWith('javascript:') ||
            href.startsWith('data:')) {
          return;
        }
        const cleanHref = href.split('#')[0].split('?')[0];
        if (!cleanHref || checked.has(cleanHref)) return;
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
