# RRROCA Test Suite Guide (Phase 1)

## Run Commands

```bash
hugo --quiet
npx jest --verbose
npm run test:ui
```

## Current Test Files

| File | Domain |
|---|---|
| `build-validation.test.js` | Build output and required routes/assets |
| `content-validation.test.js` | Front matter and content structure |
| `content-freshness.test.js` | Content recency and quality checks |
| `navigation.test.js` | Navigation links and route integrity |
| `homepage-ux.test.js` | Homepage structure and UX expectations |
| `inner-page.test.js` | Inner-page layout and semantics |
| `forms.test.js` | Form behavior and fallback behavior |
| `search.test.js` | Search behavior and indexing integration |
| `directory-search.test.js` | Directory search behaviors |
| `safety-dashboard.test.js` | Safety dashboard scripts |
| `safety-dashboard.partial.test.js` | Safety dashboard rendering checks |
| `qa-comprehensive.test.js` | Cross-cutting QA validations |
| `accessibility.test.js` | Accessibility requirements |
| `seo.test.js` | SEO metadata and discoverability |
| `feed.test.js` | RSS/feed output correctness |
| `security.test.js` | Security-focused static checks |
| `cross-platform.test.js` | Path and environment compatibility |
| `e2e/*.spec.js` | Browser-based UI, navigation, responsiveness, and interaction coverage |

## Testing Rules

- Prefer structural assertions over exact prose
- Keep tests additive (new pages/content should not fail existing tests)
- Use `path.join()` for file paths
- Keep tests deterministic and offline
- UI tests run Playwright against the built local site and default to the installed Microsoft Edge browser on Windows
