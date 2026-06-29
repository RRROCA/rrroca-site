# Testing Guide (Phase 1)

## Overview

Testing focuses on static-site correctness and content quality for the public website.

## Test Categories

1. **Build validation** — Hugo output, routes, assets, and forms
2. **Content validation** — front matter, links, and content quality checks
3. **UX contract** — expected page sections and structure
4. **JavaScript unit tests** — search, forms, safety, and page behavior
5. **Security/content checks** — headers, links, and secret leakage checks

## Running Tests

```bash
hugo --quiet
npx jest --verbose
```

## CI Pipeline

Required workflow: **`.github/workflows/ci.yml`**

- Hugo build
- Jest test suite
- htmltest link validation

Pull requests must pass `build-and-test` before merge.

## Notes

- Phase 1 does not run Playwright or runtime API tests.
- If tests are updated only, use `[test-update]` in the commit message to skip coverage-tracker issue creation.
