# Testing Guide

## Overview

Our testing philosophy is simple: **test what matters, catch regressions early**.

This site currently has 9 Jest suites covering 70 tests and roughly 170 assertions, all focused on the things most likely to break a Hugo community site: routes, content quality, navigation, UX contracts, and interactive JavaScript. Playwright is also installed for browser-based smoke tests as end-to-end coverage is added.

## Test Categories

### 1. Build Validation
Checks the generated Hugo site in `public/` to make sure output is correct:
- expected routes exist
- forms work
- meta tags are present
- links resolve
- CSS and JS assets are emitted
- navigation menus render correctly

### 2. Content Validation
Checks source content quality before bad content reaches production:
- frontmatter is valid
- images are referenced correctly
- menu URLs are sane
- placeholders are removed
- event dates are valid

### 3. UX Contract
Checks that important pages render the sections and elements residents expect:
- key homepage sections
- CTAs
- viewport and layout assumptions
- CSS properties
- heading hierarchy
- emergency and safety links

### 4. Unit Tests
Tests individual JavaScript modules in isolation using **Jest 30.4.2** and **jsdom 22.1.0** for DOM behavior:
- AI assistant
- search
- safety dashboard

### 5. E2E Smoke Tests
Browser-level tests using **Playwright 1.59.1**. These are being added separately and should cover high-value user journeys across the built site.

## Running Tests

Build the site first for any tests that inspect `public/`:

```bash
hugo --gc --minify
```

Common commands:

```bash
npx jest
npx jest tests/navigation.test.js
npx jest --coverage
npx playwright test
```

For faster local checks, match your test run to the change:

- **Content only** → `npx jest tests/content-validation.test.js tests/build-validation.test.js tests/navigation.test.js`
- **JavaScript** → `npx jest tests/ai-assistant.test.js tests/search.test.js tests/safety-dashboard.test.js` then `npx playwright test`
- **Theme/config** → run the full Jest suite and Playwright
- **Docs/CI only** → build only unless you want an extra sanity check

Pull requests still run the full CI suite as a safety net.

## TDD Workflow

Use **Red-Green-Refactor**:

1. **Red** — write a failing test first
2. **Green** — implement the minimum code or content change to make it pass
3. **Refactor** — clean up while keeping tests green

Example: adding a new navigation item

1. Write or update a navigation test that expects the new item
2. Add the menu entry in Hugo content/config/templates
3. Rebuild with `hugo --gc --minify`
4. Run the relevant Jest suite and confirm it passes

If a commit only updates tests, include `[test-update]` in the commit message so the post-merge test tracking workflow does not create a follow-up issue.

## When to Write Each Test Type

- **New content section** → add build-validation coverage (route exists) and navigation coverage (links work)
- **New page** → add content-validation coverage (frontmatter) and UX contract coverage (expected sections render)
- **New JS feature** → add a unit test
- **New user flow** → add an e2e smoke test
- **Bug fix** → write a regression test first to reproduce the bug, then fix it

## Coverage Targets

These are aspirational targets, not bureaucracy:

- **Build validation:** 100% of routes and navigation links
- **Content validation:** all frontmatter must be valid
- **JS unit tests:** 80%+ line coverage
- **E2E:** all primary user journeys

## CI Pipeline

CI now uses one gated workflow: **`.github/workflows/ci.yml`**.

- **Build → test → deploy** happens in a single pipeline
- The deploy job has `needs: build-and-test`, so deploy only happens after tests pass
- The old separate `gh-pages.yml` workflow was removed
- **Pull requests** run build + test, but skip deploy
- **Pushes to `master`** run build + test + deploy

In short: nothing goes live unless the test stage is green.

## Targeted Execution

On push workflows, CI uses **`dorny/paths-filter@v3`** to choose the smallest useful test set. Pull requests still run the full suite.

| Change Type | Path Patterns | Tests Run | ~Time |
|---|---|---|---|
| Content only | `content/**`, `static/images/**` | `content-validation`, `build-validation`, `navigation` | ~30s |
| Theme/config | `themes/**`, `hugo.toml` | Full Jest suite + Playwright e2e | ~90s |
| JavaScript | `themes/rrroca/static/js/**` | JS unit tests + Playwright | ~60s |
| Docs/CI only | `docs/**`, `.github/**` | Build only | ~10s |
| PRs | Any | Full suite | ~90s |

This keeps routine content updates fast without removing the safety net for larger changes.

## Auto Test Tracking

After merges, **`.github/workflows/test-coverage.yml`** reviews the commit and opens a GitHub issue when test follow-up may be needed.

- checks the commit diff
- maps changed files to the most relevant test suites
- opens an issue with a checklist of suites to review
- adds the `test-coverage` label for tracking
- skips docs-only changes
- skips commits with `[test-update]` in the message to avoid loops

This workflow is meant to remind volunteers to keep tests in sync, not to add extra process.

## Branch Protection Setup (Required)

To ensure CI gates all merges, enable branch protection on `master`:

1. Go to **Settings → Branches → Add rule**
2. Branch name pattern: `master`
3. Check: **Require status checks to pass before merging**
4. Search and add: `build-and-test`
5. Check: **Require branches to be up to date before merging**
6. Save changes

Without this, PRs can be merged before CI finishes.
