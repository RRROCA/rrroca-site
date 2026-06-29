# RRROCA Runbook (Phase 1)

## Scope

Phase 1 operations cover the public informational website only:

- News and events
- Safety information
- Programs and facilities
- Volunteering and contact pages
- Governance documents
- Browser-based CMS content updates
- Static-first deployment through GitHub Actions and Azure Static Web Apps

Out of scope for Phase 1: chatbot runtime, custom APIs, board auth, motion automation, and other experimental automation.

## Architecture at a Glance

```
Content (Markdown + Hugo templates)
          ↓
GitHub Pull Request
          ↓
CI (hugo + jest + htmltest)
          ↓
Merge to master
          ↓
Azure Static Web Apps deploy
```

## Operational Responsibilities

### Content Editors
- Use CMS or markdown updates for approved content changes
- Validate links and front matter before submitting PRs

### Maintainers
- Review and merge PRs after `build-and-test` is green
- Maintain GitHub Actions workflow health
- Rotate deployment token when needed

## Standard Operating Procedures

### 1. Publish a Content Update
1. Create a branch from `master`.
2. Edit content in `content/` (or CMS-generated equivalent).
3. Open a PR.
4. Confirm `build-and-test` passes.
5. Merge to `master`.
6. Confirm Azure SWA deploy succeeds.

### 2. Hotfix a Broken Page
1. Reproduce locally (`hugo --quiet`).
2. Apply minimal fix.
3. Run `npx jest --verbose`.
4. Open PR and merge after required checks.

### 3. Recover from Failed Deployment
1. Open latest run in `.github/workflows/azure-swa.yml`.
2. Confirm `AZURE_STATIC_WEB_APPS_API_TOKEN` exists and is valid.
3. Re-run failed job after correcting token/config.
4. If needed, roll forward with a targeted fix PR.

## Incident Guide

### CI Failing
- Check `.github/workflows/ci.yml` logs
- Resolve Hugo build errors first, then Jest, then htmltest failures
- Keep fix focused on the failing check

### Azure Deploy Failing
- Check `.github/workflows/azure-swa.yml` logs
- Verify deploy token and app configuration
- Confirm `public/staticwebapp.config.json` is present in workflow output

### Broken Link or Missing Page in Production
- Verify source exists in `content/` and URL matches Hugo output
- Run local build and check `public/`
- Ship focused PR fix

## Secrets and Access

Required repository secrets:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `COPILOT_PAT` (optional workflow automation)

At least two maintainers should have:

- GitHub repo admin access
- Azure SWA contributor access

## Phase 1 Change Control

- Keep changes small and reviewable
- Do not introduce runtime services or custom APIs
- Preserve Hugo structure and content portability
- Update docs whenever workflows or architecture change

## Validation Commands

```bash
hugo --quiet
npx jest --verbose
```

These commands are the baseline before merge and release decisions.
