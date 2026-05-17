# ALM / CI/CD Architecture

## Overview

RRROCA uses a fully automated ALM pipeline: issues drive code changes, CI validates them, and deployments happen without manual intervention for trusted content changes.

## Deployment Targets

| Environment | URL | Platform | Trigger |
|-------------|-----|----------|---------|
| **Production** | https://rrroca.org | Azure Static Web Apps | Push to `master` |
| **Staging** | https://rrroca.github.io/rrroca-site/ | GitHub Pages | Push to `master` |
| **PR Preview** | Auto-generated | Azure SWA preview | Pull request |

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ISSUE INTAKE                              │
├─────────────────────────────────────────────────────────────────┤
│  content-fix issue    →  Auto-assign Copilot (board members)    │
│  motion issue         →  Auto-publish markdown + commit         │
│  bug/feature issue    →  Manual triage                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CODE CHANGE (PR)                            │
├─────────────────────────────────────────────────────────────────┤
│  Copilot agent opens PR  │  Human opens PR  │  Motion auto-push │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CI VALIDATION (ci.yml)                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Hugo build (Extended 0.161.1)                               │
│  2. Jest unit tests + coverage                                  │
│  3. htmltest — internal link validation                         │
│  4. Playwright e2e smoke tests (content/theme/JS changes)       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MERGE POLICY                                 │
├─────────────────────────────────────────────────────────────────┤
│  Content-only + trusted author  →  Auto-merge (no review)       │
│  Any PR + human approval        →  Auto-merge after CI          │
│  Other PRs                      →  Require review + CI          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT                                  │
├─────────────────────────────────────────────────────────────────┤
│  azure-swa.yml  →  Production (rrroca.org)                      │
│  ci.yml         →  Staging (GitHub Pages)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Branch Protection

Enforced via GitHub repository ruleset on `master`:

- **Required status check:** `build-and-test` (CI workflow job)
- **No direct pushes:** All changes must go through PRs
- **No force pushes or deletions**

## Workflows

### `ci.yml` — Build & Test
- **Trigger:** PR to master, push to master, manual dispatch
- **Steps:** Hugo build → Jest → htmltest → Playwright (conditional)
- **Also:** Deploys to GitHub Pages staging on push

### `azure-swa.yml` — Production Deploy
- **Trigger:** Push to master, PR (for previews)
- **Steps:** Hugo build → Azure SWA deploy
- **Secret:** `AZURE_STATIC_WEB_APPS_API_TOKEN`

### `content-auto-merge.yml` — Merge Automation
- **Content PRs:** Auto-merge from Copilot/board when files only touch `content/` or `static/images/`
- **Approved PRs:** Enable auto-merge after any approval (waits for CI)

### `content-fix-assign.yml` — Issue Triage
- **Trigger:** Issue labeled `content-fix`
- **Trusted authors** (CanChad, SeunOgunsola): Assign to Copilot coding agent
- **Others:** Add `needs-review` label
- **Auth:** Uses `COPILOT_PAT` secret (fine-grained PAT) — `GITHUB_TOKEN` cannot trigger the agent
- **Bot identity:** `copilot-swe-agent[bot]` with `agent_assignment` payload

### `motion-publish.yml` — Governance Motions
- **Trigger:** Issue with `motion` label
- **Action:** Parse form fields, generate motion markdown, commit, deploy

### `test-coverage.yml` — Coverage Follow-up
- **Trigger:** Push to master
- **Action:** Analyze changed files, open issue if test coverage may need updating

## Testing Strategy

| Layer | Tool | Scope | When |
|-------|------|-------|------|
| Unit | Jest | Build validation, content, JS, UX contracts | Every PR |
| Links | htmltest | Internal link integrity | Every PR |
| E2E | Playwright | Navigation, page loads, console errors | Content/theme/JS changes |
| Manual | Azure SWA preview | Visual review | PR preview URL |

## Trusted Authors (Auto-merge)

Board members and maintainers who can trigger zero-touch content deployments:
- `CanChad` (Chad La Fournie — President)
- `SeunOgunsola` (Seun Ogunsola — Treasurer)

To add a new trusted author, update:
1. `.github/workflows/content-auto-merge.yml` (auto-merge condition)
2. `.github/workflows/content-fix-assign.yml` (auto-assign list)

## Resiliency Notes

- **If moving away from Microsoft employee benefits:** Add Copilot Business subscription to RRROCA org ($19/user/month) to retain Copilot coding agent capability.
- **Azure SWA free tier** covers the production site (100GB bandwidth, custom domain, SSL).
- **GitHub Pages** provides a free staging fallback if Azure SWA is unavailable.
- **COPILOT_PAT expiry:** Fine-grained PAT expires periodically (check Settings → Developer Settings → Fine-grained tokens). Regenerate and update the repo secret before expiry or the content-fix auto-assign will fail silently.

## Security Posture

All security features are enabled on this repository:

| Feature | Status | Notes |
|---------|--------|-------|
| **Secret scanning** | ✅ Enabled | Push protection blocks commits with secrets |
| **Dependabot** | ✅ Enabled | Auto-opens PRs for vulnerable dependencies |
| **CodeQL** | ✅ Enabled | Scans JS/TS on push and PR for vulnerabilities |
| **Branch protection** | ✅ Enforced | `build-and-test` required, no direct push to master |

## Secrets & Tokens

| Secret | Purpose | Rotation |
|--------|---------|----------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Production deploy to Azure SWA | Azure portal → Static Web Apps → Manage deployment token |
| `COPILOT_PAT` | Triggers Copilot coding agent on content-fix issues | GitHub Settings → Developer Settings → Fine-grained PATs |

## Architecture Diagram

See [`docs/alm-architecture.excalidraw`](./alm-architecture.excalidraw) for a visual diagram (open at https://aka.ms/excalidraw).
