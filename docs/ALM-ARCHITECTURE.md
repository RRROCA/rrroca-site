# ALM / CI/CD Architecture (Phase 1)

## Overview

RRROCA Phase 1 uses a static-first delivery pipeline:

1. Content and template changes are made in GitHub.
2. Pull requests run required validation (`build-and-test`).
3. Merges to `master` trigger production deployment to Azure Static Web Apps.

The architecture intentionally excludes runtime APIs, board authentication workflows, chatbot automation, and motion automation.

## Deployment Targets

| Environment | URL | Platform | Trigger |
|---|---|---|---|
| **Production** | https://rrroca.org | Azure Static Web Apps | Push to `master` |
| **PR Preview** | Auto-generated | Azure SWA preview | Pull request |

## Required Checks and Branch Policy

- **Required status check:** `build-and-test`
- **Branch:** `master`
- **Policy:** no direct pushes, no force pushes, merge only after required checks pass

## Active Workflows

### `.github/workflows/ci.yml` — Build and Test
- Triggers on pull requests and pushes to `master`
- Runs Hugo build, Jest tests, and htmltest link validation
- This is the merge gate

### `.github/workflows/azure-swa.yml` — Production Deploy
- Builds the static site with Hugo
- Copies `staticwebapp.config.json` into `public/`
- Deploys static output to Azure Static Web Apps

### `.github/workflows/content-auto-merge.yml` — Content Guardrail + Auto-merge
- Restricts auto-merge to safe content-only PRs
- Blocks design/layout changes in markdown-only content flows

### `.github/workflows/test-coverage.yml` — Test Follow-up Reminder
- Opens a tracking issue when code areas change and tests may need updates

## Removed from Phase 1

The following automation was removed because it is outside Phase 1 scope:

- Motion automation workflows
- Board notification workflow
- Content-fix auto-assignment workflow
- Firebase deployment workflow
- Runtime API pipeline dependencies

## Secrets Used in Phase 1

| Secret | Purpose |
|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Azure SWA deploy authentication |
| `GITHUB_TOKEN` | Standard workflow API access |
| `COPILOT_PAT` | Optional automation for repository workflows |
