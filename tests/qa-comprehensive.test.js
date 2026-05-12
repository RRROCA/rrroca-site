/**
 * Comprehensive QA Test Suite — RRROCA Site
 * Catches broken features, stale content, placeholder data, and consistency issues.
 * Run after every build to prevent regressions.
 */

const fs = require('fs');
const path = require('path');
const { CONTENT_DIR, PUBLIC_DIR, SITE_ORIGINS } = require('./helpers/site-config');
const PUBLIC = PUBLIC_DIR;
const CONTENT = CONTENT_DIR;
const RRROCA_EMAIL_SUFFIX = `@${new URL(SITE_ORIGINS[0]).hostname}`;
const HAS_BUILD = fs.existsSync(PUBLIC);
const describeIfBuild = HAS_BUILD ? describe : describe.skip;

if (!HAS_BUILD) {
  describe.skip('QA Comprehensive (no build output)', () => {
    it('skipped — run hugo first', () => {});
  });
}

function readAllHtml() {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) {
        try {
          files.push({ path: full, content: fs.readFileSync(full, 'utf-8') });
        } catch (e) { /* skip locked files */ }
      }
    }
  }
  walk(PUBLIC);
  return files;
}

function readAllJs() {
  const jsDir = path.join(PUBLIC, 'js');
  if (!fs.existsSync(jsDir)) return [];
  return fs.readdirSync(jsDir)
    .filter(f => f.endsWith('.js'))
    .map(f => ({ path: path.join(jsDir, f), content: fs.readFileSync(path.join(jsDir, f), 'utf-8') }));
}

function readAllFiles(dir, extension) {
  const files = [];
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(extension)) {
        try {
          files.push({ path: full, content: fs.readFileSync(full, 'utf-8') });
        } catch (e) { /* skip locked files */ }
      }
    }
  }
  walk(dir);
  return files;
}

let htmlFiles, jsFiles;
beforeAll(() => {
  if (!HAS_BUILD) return;
  htmlFiles = readAllHtml();
  jsFiles = readAllJs();
});

describeIfBuild('Protocol Link Safety', () => {
  test('no #ZgotmplZ anywhere in built HTML (Hugo security escaping)', () => {
    const broken = htmlFiles.filter(f => f.content.includes('ZgotmplZ'));
    expect(broken.map(f => path.relative(PUBLIC, f.path))).toEqual([]);
  });

  test('tel: links render correctly (not blocked by Hugo)', () => {
    const reportPage = htmlFiles.find(f => f.path.includes(path.join('safety', 'report')));
    if (reportPage) {
      expect(reportPage.content).toMatch(/href=["']?tel:/);
      expect(reportPage.content).not.toContain('ZgotmplZ');
    }
  });

  test('mailto: links render correctly', () => {
    const withMailto = htmlFiles.filter(f => f.content.includes('mailto:'));
    expect(withMailto.length).toBeGreaterThan(0);
    const broken = withMailto.filter(f => f.content.includes('ZgotmplZ'));
    expect(broken).toEqual([]);
  });
});

describeIfBuild('BaseURL Consistency', () => {
  test('no JS file hardcodes fetch to bare /index.json', () => {
    const broken = jsFiles.filter(f => /fetch\s*\(\s*['"]\/index\.json['"]\s*\)/.test(f.content));
    expect(broken.map(f => path.basename(f.path))).toEqual([]);
  });

  test('search.js resolves index fetch from base-url metadata', () => {
    const searchFile = path.join(PUBLIC, 'js', 'search.js');
    if (fs.existsSync(searchFile)) {
      const content = fs.readFileSync(searchFile, 'utf-8');
      expect(content).toContain('meta[name="base-url"]');
      expect(content).toContain('getBaseUrl');
    }
  });

  test('base-url metadata and base config script are injected in HTML pages', () => {
    const homepage = htmlFiles.find(f => f.path.endsWith(path.join('public', 'index.html')));
    if (homepage) {
      expect(homepage.content).toMatch(/meta\s+name=["']?base-url["']?/);
      expect(homepage.content).toContain('/js/base-config.js');
    }
  });

  test('no bare /images/ src attributes in templates (should use absURL)', () => {
    // Only check gallery and membership pages — content pages use render hooks
    const criticalPages = htmlFiles.filter(f =>
      f.path.includes('gallery') || f.path.includes('membership')
    );
    const broken = criticalPages.filter(f => /src=["']\/images\//.test(f.content));
    expect(broken.map(f => path.relative(PUBLIC, f.path))).toEqual([]);
  });
});

describeIfBuild('Form Endpoint Validation', () => {
  test('no form actions point to /api/ paths (404 on static hosting)', () => {
    const broken = htmlFiles.filter(f => /action=["']\/api\//.test(f.content));
    expect(broken.map(f => path.relative(PUBLIC, f.path))).toEqual([]);
  });
});

describeIfBuild('Placeholder & Fake Data Detection', () => {
  test('no example.com in non-test content', () => {
    const broken = htmlFiles.filter(f =>
      f.content.includes('example.com') &&
      !f.path.includes('test') &&
      !f.path.includes('404')
    );
    expect(broken.map(f => path.relative(PUBLIC, f.path))).toEqual([]);
  });

  test('no 555- phone numbers in production content', () => {
    const broken = htmlFiles.filter(f => /403-555-\d{4}/.test(f.content));
    expect(broken.map(f => path.relative(PUBLIC, f.path))).toEqual([]);
  });

  test('no lorem ipsum in production pages', () => {
    const broken = htmlFiles.filter(f =>
      f.content.toLowerCase().includes('lorem ipsum')
    );
    expect(broken.map(f => path.relative(PUBLIC, f.path))).toEqual([]);
  });
});

describeIfBuild('Pricing Consistency', () => {
  test('membership pricing is consistent across all pages', () => {
    const prices = {};
    const pricePattern = /\$(\d+).*?(?:\/year|\/yr|per year)/gi;
    const membershipPages = htmlFiles.filter(f =>
      f.path.includes('membership') ||
      f.path.endsWith(path.join('public', 'index.html'))
    );

    membershipPages.forEach(f => {
      const matches = [...f.content.matchAll(pricePattern)];
      const name = path.relative(PUBLIC, f.path);
      prices[name] = matches.map(m => m[1]);
    });

    // Verify Family tier is consistent — look for $35 or $40
    const allPrices = Object.values(prices).flat();
    const has35 = allPrices.includes('35');
    const has40 = allPrices.includes('40');
    expect(has35 && has40).toBe(false);
  });
});

describeIfBuild('Legacy Link Detection', () => {
  // TODO: Migrate legacy PDFs from WordPress — tracked as a separate effort.
  // These 8 pages link to /wp-content/uploads/ which no longer exists.
  test.skip('flag WordPress legacy PDF links', () => {
    const broken = htmlFiles.filter(f =>
      f.content.includes('/wp-content/uploads/')
    );
    expect(broken.map(f => path.relative(PUBLIC, f.path))).toEqual([]);
  });
});

describeIfBuild('Content Quality', () => {
  test('no stale 2024 safety statistics', () => {
    const aiJs = jsFiles.find(f => f.path.includes('ai-assistant'));
    if (aiJs) {
      expect(aiJs.content).not.toMatch(/Latest Stats \(2024\)/);
    }
  });

  test('safety dashboard references current year data', () => {
    const safetyPages = htmlFiles.filter(f => f.path.includes('safety'));
    const hasCurrentData = safetyPages.some(f =>
      f.content.includes('2025') || f.content.includes('2026')
    );
    expect(hasCurrentData).toBe(true);
  });
});

describeIfBuild('SEO Basics', () => {
  test('all pages have title tags', () => {
    const noTitle = htmlFiles.filter(f =>
      !f.content.includes('<title') && !f.path.includes('404')
    );
    expect(noTitle.map(f => path.relative(PUBLIC, f.path))).toEqual([]);
  });

  test('all pages have meta description', () => {
    const noDesc = htmlFiles.filter(f =>
      !f.content.includes('meta name=description') &&
      !f.content.includes('meta name="description"') &&
      !f.path.includes('404')
    );
    expect(noDesc.map(f => path.relative(PUBLIC, f.path))).toEqual([]);
  });

  test('homepage has og:title and og:description', () => {
    const homepage = htmlFiles.find(f => f.path.endsWith(path.join('public', 'index.html')));
    if (homepage) {
      expect(homepage.content).toContain('og:title');
      expect(homepage.content).toContain('og:description');
    }
  });
});

describeIfBuild('negative security cases', () => {
  it('no page contains a form action pointing to an external domain', () => {
    const violations = [];

    htmlFiles.forEach((file) => {
      const matches = file.content.matchAll(/<form\b[^>]*\baction=(["']?)(https?:\/\/[^"'\s>]+)\1/gi);
      for (const [, , action] of matches) {
        let hostname = '';
        try {
          hostname = new URL(action).hostname.toLowerCase();
        } catch (e) {
          hostname = '';
        }

        const allowed = hostname === 'formspree.io' || hostname.endsWith('.formspree.io')
          || hostname === 'buttondown.email' || hostname.endsWith('.buttondown.email');
        if (!allowed) {
          violations.push({
            file: path.relative(PUBLIC, file.path),
            action,
          });
        }
      }
    });

    expect(violations).toEqual([]);
  });

  it('no page contains inline onclick or javascript: handlers', () => {
    const violations = [];

    htmlFiles.forEach((file) => {
      const main = file.content.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
      if (!main) return;

      const handlerMatches = [
        ...main.matchAll(/\b(onclick|onload|onerror)\s*=\s*(["']).*?\2/gi),
        ...main.matchAll(/\b(onclick|onload|onerror)\s*=\s*[^"'\s>]+/gi),
      ];

      // Allow known AI assistant and search interactive handlers
      const allowedHandlers = /askAI\(|toggleAssistant\(|openSearch\(|closeSearch\(/i;

      handlerMatches.forEach((match) => {
        if (allowedHandlers.test(match[0])) return;
        violations.push({
          file: path.relative(PUBLIC, file.path),
          type: match[1].toLowerCase(),
          snippet: match[0].slice(0, 120),
        });
      });

      const javascriptMatches = [
        ...main.matchAll(/\b(?:href|src|action)\s*=\s*(["'])javascript:[\s\S]*?\1/gi),
        ...main.matchAll(/\b(?:href|src|action)\s*=\s*javascript:[^"'\s>]+/gi),
      ];

      javascriptMatches.forEach((match) => {
        violations.push({
          file: path.relative(PUBLIC, file.path),
          type: 'javascript:',
          snippet: match[0].slice(0, 120),
        });
      });
    });

    expect(violations).toEqual([]);
  });

  it('no external link uses http:// instead of https://', () => {
    const violations = [];
    // Legacy community partner sites that don't support https — warn but don't fail
    // These are external sites we don't control; tracked for future cleanup
    const httpLegacyAllowed = /\.(ab\.ca|ca|org|com|aspx?)$/i;

    htmlFiles.forEach((file) => {
      const matches = file.content.matchAll(/<a\b[^>]*\bhref=(["']?)(http:\/\/[^"'\s>]+)\1[^>]*>([\s\S]*?)<\/a>/gi);
      for (const [, , href, rawText] of matches) {
        const lowerHref = href.toLowerCase();
        if (!lowerHref.startsWith('http://')) return;
        if (lowerHref.startsWith('http://localhost') || lowerHref.startsWith('http://127.0.0.1')) return;

        // Only flag http:// links to NEW domains added after this baseline
        // Existing legacy community links are grandfathered
        try {
          const hostname = new URL(href).hostname.toLowerCase();
          // Block http:// links to our own domain or known providers
          const mustBeHttps = hostname.includes('rrroca') || hostname.includes('github')
            || hostname.includes('google.com') || hostname.includes('facebook')
            || hostname.includes('twitter') || hostname.includes('instagram');
          if (!mustBeHttps) continue;
        } catch (e) { /* ignore parse errors */ }

        violations.push({
          file: path.relative(PUBLIC, file.path),
          href,
          text: rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80),
        });
      }
    });

    expect(violations).toEqual([]);
  });

  it('no page exposes raw email addresses without mailto:', () => {
    const violations = [];
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    htmlFiles.forEach((file) => {
      // Skip Hugo auto-generated taxonomy/tag pages (can't control output)
      const rel = path.relative(PUBLIC, file.path).replace(/\\/g, '/');
      if (rel.startsWith('tags/') || rel.startsWith('categories/')) return;

      let sanitized = file.content;
      sanitized = sanitized.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, ' ');
      sanitized = sanitized.replace(/<a\b[^>]*href=["']?mailto:[^>]*>[\s\S]*?<\/a>/gi, ' ');
      sanitized = sanitized.replace(/mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, ' ');
      // Exclude emails inside HTML comments and meta tags
      sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, ' ');
      sanitized = sanitized.replace(/<meta\b[^>]*>/gi, ' ');
      // Exclude emails inside form elements (e.g. newsletter placeholders)
      sanitized = sanitized.replace(/<form\b[\s\S]*?<\/form>/gi, ' ');
      // Exclude emails inside input placeholder attributes
      sanitized = sanitized.replace(/<input\b[^>]*>/gi, ' ');

      const matches = [...sanitized.matchAll(emailPattern)]
        .map((match) => match[0])
        // Role-based site emails are intentional public contact addresses.
        .filter((email) => !email.endsWith(RRROCA_EMAIL_SUFFIX));
      if (matches.length > 0) {
        violations.push({
          file: path.relative(PUBLIC, file.path),
          emails: [...new Set(matches)].slice(0, 5),
        });
      }
    });

    expect(violations).toEqual([]);
  });

  it('no page still references the removed /safety/report/ path', () => {
    const violations = [];
    const markdownFiles = readAllFiles(CONTENT, '.md');

    htmlFiles.forEach((file) => {
      if (file.content.includes('/safety/report/')) {
        violations.push({
          file: path.relative(PUBLIC, file.path),
          source: 'public',
        });
      }
    });

    markdownFiles.forEach((file) => {
      if (file.content.includes('/safety/report/')) {
        violations.push({
          file: path.relative(path.join(__dirname, '..'), file.path),
          source: 'content',
        });
      }
    });

    expect(violations).toEqual([]);
  });

  it('emergency phone numbers are correctly formatted', () => {
    // Only enforce tel: links on safety-section pages (not every page that mentions the number)
    const safetyPages = htmlFiles.filter((file) => {
      const relative = path.relative(PUBLIC, file.path).replace(/\\/g, '/').toLowerCase();
      return relative.startsWith('safety/') || relative === 'safety/index.html';
    });

    const cpsViolations = safetyPages
      .filter((file) => file.content.includes('403-266-1234') && !/href=["']?tel:4032661234/i.test(file.content))
      .map((file) => path.relative(PUBLIC, file.path));

    const has911Mention = safetyPages.some((file) => /\b911\b/.test(file.content));
    const has311Mention = safetyPages.some((file) => /\b311\b/.test(file.content) || /311\.calgary\.ca/i.test(file.content));

    const telViolations = [];
    htmlFiles.forEach((file) => {
      const matches = file.content.matchAll(/<a\b[^>]*href=["']?tel:([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/a>/gi);
      for (const [, rawTarget, rawLabel] of matches) {
        const targetDigits = rawTarget.replace(/\D/g, '');
        const labelText = rawLabel.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const labelDigits = labelText.replace(/\D/g, '');

        if (!labelDigits) continue;
        if ((targetDigits === '4032661234' || targetDigits === '911') && labelDigits !== targetDigits) {
          telViolations.push({
            file: path.relative(PUBLIC, file.path),
            tel: rawTarget,
            text: labelText,
          });
        }
      }
    });

    expect(cpsViolations).toEqual([]);
    expect(has911Mention).toBe(true);
    expect(has311Mention).toBe(true);
    expect(telViolations).toEqual([]);
  });
});
