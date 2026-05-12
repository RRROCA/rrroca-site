const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(REPO_ROOT, 'public');
const CONTENT = path.join(REPO_ROOT, 'content');
const SITE_ORIGIN = 'https://rrroca.org';

function readFiles(rootDir, extensions, relativeTo = rootDir) {
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!extensions.includes(path.extname(entry.name).toLowerCase())) continue;

      try {
        files.push({
          path: fullPath,
          relativePath: path.relative(relativeTo, fullPath),
          content: fs.readFileSync(fullPath, 'utf-8')
        });
      } catch (error) {
        // Skip unreadable files so one bad file does not break the suite.
      }
    }
  }

  walk(rootDir);
  return files;
}

function readBuiltFiles(extensions) {
  return readFiles(PUBLIC, extensions);
}

function readContentMarkdownFiles() {
  return readFiles(CONTENT, ['.md'], REPO_ROOT);
}

function getUrlDetails(href) {
  if (!href) return null;

  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^(mailto:|tel:|data:)/i.test(trimmed)) return null;

  try {
    return new URL(trimmed, SITE_ORIGIN);
  } catch (error) {
    return null;
  }
}

function isInternalHref(href) {
  const url = getUrlDetails(href);
  if (!url) return true;

  if (!/^https?:$/i.test(url.protocol)) return true;

  const hostname = url.hostname.toLowerCase();
  if (hostname === 'rrroca.org' || hostname.endsWith('.rrroca.org')) return true;

  // GitHub Pages staging site is internal
  if (hostname === 'canchad.github.io' && /^\/rrroca-site(?:\/|$)/.test(url.pathname)) {
    return true;
  }

  if (hostname === 'github.com' && /^\/CanChad(?:\/|$)/.test(url.pathname)) {
    return true;
  }

  return false;
}

function isMixedContentUrl(value) {
  if (!value) return false;

  const trimmed = value.trim();
  if (!/^http:\/\//i.test(trimmed)) return false;
  if (/^http:\/\/(localhost|127\.0\.0\.1)/i.test(trimmed)) return false;
  return true;
}

const SECRET_PATTERNS = [
  { label: 'api key assignment', regex: /\bapi[_-]?key\s*[:=]\s*['\"]?[A-Za-z0-9_\-+=/]{8,}/gi },
  { label: 'api key query parameter', regex: /(?:\?|&|\b)api[_-]?key=([^&\s'\"<>]{6,})/gi },
  { label: 'secret assignment', regex: /\bsecret(?:[_-]?key)?\s*[:=]\s*['\"]?[A-Za-z0-9_\-+=/]{8,}/gi },
  { label: 'password assignment', regex: /\bpassword\s*[:=]\s*['\"]?[^\s'\"<>]{6,}/gi },
  { label: 'token assignment', regex: /\b(?:token|access[_-]?token|auth[_-]?token)\s*[:=]\s*['\"]?[A-Za-z0-9._\-+=/]{8,}/gi },
  { label: 'token query parameter', regex: /(?:\?|&|\b)(?:token|access_token|auth_token|secret|password)=([^&\s'\"<>]{6,})/gi },
  { label: 'aws access key', regex: /\bA(?:KIA|SIA)[0-9A-Z]{16}\b/g },
  { label: 'github token', regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g }
];

const DANGEROUS_PATTERNS = [
  { pattern: /<script[\s>]/i, name: 'script tags' },
  { pattern: /<iframe[\s>]/i, name: 'iframe tags', exemption: 'iframe' },
  { pattern: /on(click|load|error|mouseover|focus|blur)\s*=/i, name: 'inline event handlers' },
  { pattern: /javascript:/i, name: 'javascript: URLs' },
  { pattern: /<object[\s>]/i, name: 'object tags' },
  { pattern: /<embed[\s>]/i, name: 'embed tags' },
  { pattern: /<form[\s>]/i, name: 'form tags in content' }
];

const SANITIZATION_EXEMPTION_PATTERNS = {
  iframe: /<!--\s*sanitization-exempt:\s*iframe\s*-->/i
};

function isIgnoredSecretMatch(matchText) {
  return /\{\{.*\}\}|var\(--/i.test(matchText);
}

function hasSanitizationExemption(fileContent, exemption) {
  if (!exemption) return false;
  return SANITIZATION_EXEMPTION_PATTERNS[exemption]?.test(fileContent) || false;
}

let htmlFiles = [];
let builtFiles = [];

beforeAll(() => {
  htmlFiles = readBuiltFiles(['.html']);
  builtFiles = readBuiltFiles(['.html', '.js']);
});

describe('built site security checks', () => {
  test('external links using _blank or external domains include noopener', () => {
    if (!fs.existsSync(PUBLIC) || htmlFiles.length === 0) {
      console.warn('Skipping external link security check: public output is unavailable.');
      return;
    }

    const violations = [];

    htmlFiles.forEach((file) => {
      const dom = new JSDOM(file.content);
      const anchors = dom.window.document.querySelectorAll('a[href]');

      anchors.forEach((anchor) => {
        const href = anchor.getAttribute('href') || '';
        const rel = (anchor.getAttribute('rel') || '').trim();
        const target = (anchor.getAttribute('target') || '').toLowerCase();
        const reasons = [];

        if (target === '_blank' && !/\bnoopener\b/i.test(rel)) {
          reasons.push('target="_blank" missing noopener');
        }

        if (!isInternalHref(href) && !/\bnoopener\b/i.test(rel)) {
          reasons.push('external link missing noopener');
        }

        if (reasons.length > 0) {
          violations.push({
            file: file.relativePath,
            href,
            rel: rel || '(missing)',
            issue: reasons.join('; ')
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  test('built HTML and JS do not contain hardcoded secrets', () => {
    if (!fs.existsSync(PUBLIC) || builtFiles.length === 0) {
      console.warn('Skipping secret scan: public output is unavailable.');
      return;
    }

    const violations = [];

    builtFiles.forEach((file) => {
      SECRET_PATTERNS.forEach(({ label, regex }) => {
        regex.lastIndex = 0;

        for (const match of file.content.matchAll(regex)) {
          const snippet = match[0];
          if (isIgnoredSecretMatch(snippet)) continue;

          violations.push({
            file: file.relativePath,
            pattern: label,
            snippet: snippet.slice(0, 120)
          });
        }
      });
    });

    expect(violations).toEqual([]);
  });

  test('built assets do not reference insecure mixed-content URLs', () => {
    if (!fs.existsSync(PUBLIC) || htmlFiles.length === 0) {
      console.warn('Skipping mixed content check: public output is unavailable.');
      return;
    }

    const violations = [];

    htmlFiles.forEach((file) => {
      const dom = new JSDOM(file.content);
      const document = dom.window.document;
      const selectors = [
        ['img[src]', 'src'],
        ['script[src]', 'src'],
        ['link[href]', 'href'],
        ['iframe[src]', 'src']
      ];

      selectors.forEach(([selector, attribute]) => {
        document.querySelectorAll(selector).forEach((element) => {
          const value = element.getAttribute(attribute) || '';
          if (!isMixedContentUrl(value)) return;

          violations.push({
            file: file.relativePath,
            tag: element.tagName.toLowerCase(),
            attribute,
            value
          });
        });
      });
    });

    expect(violations).toEqual([]);
  });

  test('self-hosts Fuse.js and applies integrity or crossorigin where appropriate', () => {
    if (!fs.existsSync(PUBLIC) || htmlFiles.length === 0) {
      console.warn('Skipping CDN hardening check: public output is unavailable.');
      return;
    }

    const searchScriptPath = path.join(PUBLIC, 'js', 'search.js');
    expect(fs.existsSync(searchScriptPath)).toBe(true);
    const searchScript = fs.readFileSync(searchScriptPath, 'utf8');
    expect(searchScript).toContain("script.src = '/js/vendor/fuse.min.js'");
    expect(searchScript).not.toContain('cdn.jsdelivr.net');

    const adminPath = path.join(PUBLIC, 'admin', 'index.html');
    expect(fs.existsSync(adminPath)).toBe(true);
    const adminDocument = new JSDOM(fs.readFileSync(adminPath, 'utf8')).window.document;
    const cmsScript = adminDocument.querySelector('script[src*="unpkg.com/@sveltia/cms"]');
    expect(cmsScript).not.toBeNull();
    expect(cmsScript?.getAttribute('integrity')).toMatch(/^sha384-/);
    expect(cmsScript?.getAttribute('crossorigin')).toBe('anonymous');

    const homepagePath = path.join(PUBLIC, 'index.html');
    expect(fs.existsSync(homepagePath)).toBe(true);
    const homepageDocument = new JSDOM(fs.readFileSync(homepagePath, 'utf8')).window.document;
    const fontPreconnects = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    fontPreconnects.forEach((href) => {
      const link = homepageDocument.querySelector(`link[rel="preconnect"][href="${href}"]`);
      expect(link).not.toBeNull();
      expect(link?.getAttribute('crossorigin')).toBe('anonymous');
    });
  });

  test('no dangerous HTML in markdown content files', () => {
    if (!fs.existsSync(CONTENT)) {
      console.warn('Skipping markdown sanitization check: content directory is unavailable.');
      return;
    }

    const markdownFiles = readContentMarkdownFiles();
    expect(markdownFiles.length).toBeGreaterThan(0);

    const violations = [];

    markdownFiles.forEach((file) => {
      DANGEROUS_PATTERNS.forEach(({ pattern, name, exemption }) => {
        if (hasSanitizationExemption(file.content, exemption)) return;

        const match = file.content.match(pattern);
        if (!match) return;

        violations.push({
          file: file.relativePath,
          pattern: name,
          match: match[0]
        });
      });
    });

    if (violations.length > 0) {
      const details = violations
        .map(({ file, pattern, match }) => `- ${file}: ${pattern} (${match})`)
        .join('\n');

      throw new Error(`Dangerous HTML found in markdown content files:\n${details}`);
    }
  });
});
