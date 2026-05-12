const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const HAS_BUILD = fs.existsSync(PUBLIC_DIR);
const describeSuite = HAS_BUILD ? describe : describe.skip;

if (!HAS_BUILD) {
  describe.skip('SEO validation (no build output)', () => {
    it('skipped — run hugo first', () => {});
  });
}

function collectFiles(dir, extension, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

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

function getHtmlFiles() {
  return collectFiles(PUBLIC_DIR, '.html');
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getRelativePath(filePath) {
  return path.relative(PUBLIC_DIR, filePath) || 'index.html';
}

function getTitleMatches(html) {
  return [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
}

function getMetaDescriptionContent(document) {
  const meta = document.querySelector('meta[name="description"]');
  return meta?.getAttribute('content') ?? null;
}

function getCanonicalHref(document) {
  return document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
}

describeSuite('SEO validation', () => {
  const htmlFiles = getHtmlFiles();

  it('every page has a <title> tag (skip 404 page)', () => {
    const missing = htmlFiles
      .filter((filePath) => path.basename(filePath).toLowerCase() !== '404.html')
      .filter((filePath) => getTitleMatches(readFile(filePath)).length === 0)
      .map(getRelativePath);

    expect(missing).toEqual([]);
  });

  it('no page has duplicate title tags on a single page', () => {
    const duplicates = htmlFiles
      .map((filePath) => ({
        file: getRelativePath(filePath),
        count: getTitleMatches(readFile(filePath)).length,
      }))
      .filter(({ count }) => count > 1);

    expect(duplicates).toEqual([]);
  });

  it('every page has a meta description', () => {
    const missing = htmlFiles
      .map((filePath) => {
        const dom = new JSDOM(readFile(filePath));
        return {
          file: getRelativePath(filePath),
          description: getMetaDescriptionContent(dom.window.document),
        };
      })
      .filter(({ description }) => description === null)
      .map(({ file }) => file);

    expect(missing).toEqual([]);
  });

  it('meta descriptions are not empty', () => {
    const empty = htmlFiles
      .map((filePath) => {
        const dom = new JSDOM(readFile(filePath));
        return {
          file: getRelativePath(filePath),
          description: getMetaDescriptionContent(dom.window.document),
        };
      })
      .filter(({ description }) => typeof description === 'string' && description.trim().length === 0)
      .map(({ file }) => file);

    expect(empty).toEqual([]);
  });

  it('homepage has required Open Graph tags', () => {
    const homepagePath = path.join(PUBLIC_DIR, 'index.html');
    expect(fs.existsSync(homepagePath)).toBe(true);

    const document = new JSDOM(readFile(homepagePath)).window.document;
    ['og:title', 'og:description', 'og:type', 'og:url'].forEach((property) => {
      const meta = document.querySelector(`meta[property="${property}"]`);
      expect(meta).not.toBeNull();
      expect((meta?.getAttribute('content') || '').trim().length).toBeGreaterThan(0);
    });
  });

  it('sitemap.xml exists and is valid XML', () => {
    const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);

    const sitemap = readFile(sitemapPath);
    expect(sitemap).toMatch(/<urlset\b[\s\S]*<\/urlset>/i);

    const urlBlocks = sitemap.match(/<url>[^]*?<\/url>/gi) || [];
    expect(urlBlocks.length).toBeGreaterThan(0);
    urlBlocks.forEach((urlBlock) => {
      expect(urlBlock).toMatch(/<loc>https?:\/\/[^<]+<\/loc>/i);
    });
  });

  it('robots.txt exists and does not disallow the whole site', () => {
    const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
    expect(fs.existsSync(robotsPath)).toBe(true);

    const robots = readFile(robotsPath);
    expect(robots).not.toMatch(/disallow:\s*\/\s*(?:\r?\n|$)/i);
  });

  it('canonical URLs are absolute when present', () => {
    const invalidCanonicals = htmlFiles
      .map((filePath) => {
        const dom = new JSDOM(readFile(filePath));
        return {
          file: getRelativePath(filePath),
          canonical: getCanonicalHref(dom.window.document),
        };
      })
      .filter(({ canonical }) => canonical && !/^https?:\/\//i.test(canonical))
      .map(({ file, canonical }) => ({ file, canonical }));

    expect(invalidCanonicals).toEqual([]);
  });

  it('no page has an excessively long title', () => {
    const warnings = [];
    const failures = [];

    htmlFiles.forEach((filePath) => {
      const title = getTitleMatches(readFile(filePath))[0]?.[1]?.replace(/\s+/g, ' ').trim() || '';
      if (!title) {
        return;
      }

      if (title.length > 120) {
        failures.push({ file: getRelativePath(filePath), length: title.length, title });
      } else if (title.length > 70) {
        warnings.push({ file: getRelativePath(filePath), length: title.length, title });
      }
    });

    if (warnings.length > 0) {
      console.warn('SEO title length warnings (>70 chars):', warnings);
    }

    expect(failures).toEqual([]);
  });
});
