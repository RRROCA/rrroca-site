const fs = require('fs');
const path = require('path');

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
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'safety-dashboard.js'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'js', 'search.js'))).toBe(true);
  });

  it('renders the homepage with key community sections', () => {
    const indexHtml = readFile(path.join('public', 'index.html'));

    expect(indexHtml).toMatch(/id=["']hero["']/i);
    expect(indexHtml).toMatch(/class=["'][^"']*quick-links/i);
    expect(indexHtml).toMatch(/id=["']safety-dashboard["']/i);
    expect(indexHtml).toContain('Latest Community News');
    expect(indexHtml).toMatch(/id=["']membership["']/i);
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
        navigationFallback: expect.any(Object),
        responseOverrides: expect.any(Object)
      })
    );
  });

  it('ensures root-relative internal links resolve to built files', () => {
    const htmlFiles = collectFiles(PUBLIC_DIR, '.html');
    const brokenLinks = [];

    for (const htmlFile of htmlFiles) {
      const html = fs.readFileSync(htmlFile, 'utf8');
      const matches = html.match(/href=(?:"(\/[^"]*)"|'(\/[^']*)'|(\/[^\s>]+))/g) || [];

      for (const rawMatch of matches) {
        const href = rawMatch.replace(/^href=(["'])?/, '').replace(/["']$/, '');
        if (!routeExists(href)) {
          brokenLinks.push({
            file: path.relative(REPO_ROOT, htmlFile),
            href
          });
        }
      }
    }

    expect(brokenLinks).toEqual([]);
  });

  it('includes core meta tags across generated HTML pages', () => {
    const htmlFiles = collectFiles(PUBLIC_DIR, '.html');

    htmlFiles.forEach((htmlFile) => {
      const html = fs.readFileSync(htmlFile, 'utf8');
      expect(html).toMatch(/<meta\s+charset=["']?utf-8["']?/i);
      expect(html).toMatch(/<meta\s+name=["']viewport["']/i);
      expect(html).toMatch(/<meta\s+name=["']description["']/i);
      expect(html).toMatch(/<meta\s+property=["']og:title["']/i);
      expect(html).toMatch(/<link\s+rel=["']canonical["']/i);
    });
  });
});
