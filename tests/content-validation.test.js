const fs = require('fs');
const path = require('path');
const { CONTENT_DIR, PUBLIC_DIR, SITE_ORIGINS, resolveRoute } = require('./helpers/site-config');

const REPO_ROOT = path.resolve(__dirname, '..');
const THEMES_DIR = path.join(REPO_ROOT, 'themes', 'rrroca');

function walkFiles(dir, extensions, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, extensions, results);
    } else if (extensions.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function parseFrontmatter(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : '';
}

function getFrontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, 'm'));
  if (!match) {
    return null;
  }

  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

const routeExists = (href) => Boolean(resolveRoute(href));

describe('Content and source validation', () => {
  it('requires title and date frontmatter on all content markdown files', () => {
    const markdownFiles = walkFiles(CONTENT_DIR, ['.md']);
    const missing = [];

    markdownFiles.forEach((filePath) => {
      const frontmatter = parseFrontmatter(filePath);
      const title = getFrontmatterValue(frontmatter, 'title');
      const date = getFrontmatterValue(frontmatter, 'date');

      if (!title || !date) {
        missing.push({
          file: path.relative(REPO_ROOT, filePath),
          title: Boolean(title),
          date: Boolean(date),
        });
      }
    });

    expect(missing).toEqual([]);
  });

  it('ensures content image references point to files in static images', () => {
    const markdownFiles = walkFiles(CONTENT_DIR, ['.md']);
    const missingImages = [];

    markdownFiles.forEach((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      const imageMatches = source.matchAll(/(?:\]\(|src:\s*["']?)(\/images\/[^)\s"']+)/g);

      for (const match of imageMatches) {
        const imagePath = path.join(REPO_ROOT, 'static', match[1].replace(/^\//, '').replace(/\//g, path.sep));
        if (!fs.existsSync(imagePath)) {
          missingImages.push({
            file: path.relative(REPO_ROOT, filePath),
            image: match[1],
          });
        }
      }
    });

    expect(missingImages).toEqual([]);
  });

  it('ensures hugo.toml main menu URLs resolve to built routes', () => {
    const hugoToml = read('hugo.toml');
    const menuBlocks = hugoToml.split('[[menus.main]]').slice(1);
    const menuUrls = menuBlocks
      .map((block) => block.match(/url\s*=\s*"([^"]+)"/)?.[1])
      .filter(Boolean);

    expect(menuUrls.length).toBeGreaterThan(0);
    menuUrls.forEach((url) => {
      expect(routeExists(url)).toBe(true);
    });
  });

  it('contains no absolute production-domain links in markdown or source html', () => {
    const sourceFiles = [
      ...walkFiles(CONTENT_DIR, ['.md']),
      ...walkFiles(path.join(REPO_ROOT, 'themes'), ['.html']),
      ...walkFiles(REPO_ROOT, ['.md']).filter((filePath) => path.dirname(filePath) === REPO_ROOT),
    ];

    const matches = [];
    const primaryHostname = new URL(SITE_ORIGINS[0]).hostname.replace('.', '\\.');
    const pattern = new RegExp(`https?:\\/\\/(?:www\\.)?${primaryHostname}\\b`, 'i');

    sourceFiles.forEach((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      if (pattern.test(source)) {
        matches.push(path.relative(REPO_ROOT, filePath));
      }
    });

    expect(matches).toEqual([]);
  });

  it('parses all event dates and end dates successfully', () => {
    const eventFiles = walkFiles(path.join(CONTENT_DIR, 'events'), ['.md']);
    const invalidDates = [];

    eventFiles.forEach((filePath) => {
      const frontmatter = parseFrontmatter(filePath);
      ['date', 'endDate'].forEach((field) => {
        const value = getFrontmatterValue(frontmatter, field);
        if (value && Number.isNaN(Date.parse(value))) {
          invalidDates.push({
            file: path.relative(REPO_ROOT, filePath),
            field,
            value,
          });
        }
      });
    });

    expect(invalidDates).toEqual([]);
  });

  it('finds no placeholder copy in source content or templates', () => {
    const scanRoots = [
      CONTENT_DIR,
      THEMES_DIR,
    ];
    const topLevelFiles = ['DEPLOY.md', 'hugo.toml']
      .map((relativePath) => path.join(REPO_ROOT, relativePath))
      .filter((filePath) => fs.existsSync(filePath));

    const scanFiles = [
      ...scanRoots.flatMap((dir) => walkFiles(dir, ['.md', '.html', '.js', '.toml'])),
      ...topLevelFiles,
    ];

    const hits = [];
    const patterns = [/lorem ipsum/i, /\bTODO\b/i, /your-formspree-id/i, /YOUR_/];

    scanFiles.forEach((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      if (patterns.some((pattern) => pattern.test(source))) {
        hits.push(path.relative(REPO_ROOT, filePath));
      }
    });

    expect(hits).toEqual([]);
  });
});
