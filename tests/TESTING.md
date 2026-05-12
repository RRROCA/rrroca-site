# RRROCA Testing Guide

## Running Tests

```bash
hugo --quiet          # Build the site first
npm test              # Run all Jest tests (or: npx jest --verbose)
```

## Test Organization

| File | Domain | What it validates |
|------|--------|-------------------|
| `build-validation.test.js` | Build output | Core pages, routes, assets exist |
| `content-validation.test.js` | Content | Front matter, markdown structure |
| `homepage-ux.test.js` | Homepage | Sections, layout, CSS variables |
| `navigation.test.js` | Navigation | Menu links, routing |
| `qa-comprehensive.test.js` | Quality | Links, security, placeholder data, pricing |
| `ai-assistant.test.js` | AI chatbot | Knowledge base, message handling |
| `forms.test.js` | Forms | Validation, submission, honeypot |
| `safety-dashboard.test.js` | Safety | Dashboard JS logic |
| `search.test.js` | Search | Search index, Fuse.js integration |
| `accessibility.test.js` | A11y | Alt tags, headings, landmarks, labels |
| `seo.test.js` | SEO | Titles, meta, OG, sitemap, robots |
| `feed.test.js` | RSS | Feed structure, entries, links |
| `security.test.js` | Security | External link rel, secrets, mixed content |
| `cross-platform.test.js` | CI health | No hardcoded backslash paths |

## Resilience Principles

All tests must follow these rules. Violations will be caught in code review.

### R1. Assert structure, not prose
- ❌ `expect(text).toContain('Membership Tiers')`
- ✅ `expect(text).toMatch(/membership/i)`
- Copy changes should not break tests.

### R2. Discover, don't enumerate
- ❌ `expect(items.length).toBe(6)`
- ✅ `expect(items.length).toBeGreaterThanOrEqual(3)`
- Adding content should never break tests.

### R3. Use path.join() everywhere
- ❌ `'themes\\rrroca\\static\\js\\file.js'`
- ✅ `path.join('themes', 'rrroca', 'static', 'js', 'file.js')`
- Enforced by `cross-platform.test.js`.

### R4. Fail loud, not silent
- ❌ `console.warn('issue found')`
- ✅ `expect(violations).toEqual([])`
- Warnings are for informational notes only.

### R5. One file per domain
- Each test file owns one functional domain.
- No catch-all "comprehensive" files for new checks — add to the right domain file.

### R6. Self-documenting test names
- ❌ `it('check meta tags', ...)`
- ✅ `it('every page has a meta description', ...)`

### R7. Graceful skip on missing build
```js
const HAS_BUILD = fs.existsSync(PUBLIC_DIR);
const describeSuite = HAS_BUILD ? describe : describe.skip;
```

### R8. Cross-platform by default
- `path.join()` for paths, `.replace(/\r\n/g, '\n')` for content comparison.

### R9. No network, no randomness
- Tests validate built files only. No HTTP requests. Mock randomness if needed.

### R10. Additive content model
- Test that required items exist, not that unexpected ones are absent.
- New pages, board members, events should never break tests.

## Adding a New Test

1. Identify the domain (forms? SEO? accessibility?)
2. Add to the existing domain file, or create a new one if it's a new domain
3. Follow the resilience principles above
4. Run `npx jest tests/your-file.test.js --verbose` to verify
5. Ensure the test passes on both Windows and Linux (CI runs Ubuntu)
