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
- **Design guardrail:** Scans content diffs for HTML/design patterns (raw tags, CSS classes, inline styles). If detected, blocks auto-merge, adds `design-change` label, and comments on the PR.
- **Approved PRs:** Enable auto-merge after any approval (waits for CI)

### `content-fix-assign.yml` — Issue Triage
- **Trigger:** Issue labeled `content-fix`
- **Trusted authors** (CanChad, SeunOgunsola): Assign to Copilot
- **Others:** Add `needs-review` label

### `motion-publish.yml` — Governance Motions
- **Trigger:** Issue with `motion` label
- **Action:** Parse form fields, generate motion markdown, commit, deploy

### `test-coverage.yml` — Coverage Follow-up
- **Trigger:** Push to master
- **Skips:** Content-only changes (`content/`, `static/images/`), docs, config
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

## Security Posture

| Category | Status |
|----------|--------|
| CodeQL | ✅ 0 alerts — scans on every PR |
| Dependabot | ✅ 0 alerts — auto-updates enabled |
| Secret scanning | ✅ 0 alerts — push protection enabled |
| Branch protection | ✅ Required CI + no direct pushes |
| Content guardrail | ✅ HTML/design patterns blocked from auto-merge |

## Secrets

| Secret | Purpose | Rotation |
|--------|---------|----------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Azure SWA production deploys | Managed by Azure — no manual rotation |
| `COPILOT_PAT` | Triggers Copilot coding agent via REST API | Fine-grained PAT, expires **Jun 15, 2026** |

### COPILOT_PAT Permissions (fine-grained)
- Actions: Read
- Contents: Read + Write
- Issues: Read + Write
- Metadata: Read
- Pull requests: Read + Write
- Scoped to: RRROCA org repos

### PAT Rotation
When `COPILOT_PAT` expires, the content-fix auto-assign workflow will silently fail. To renew:
1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate new
2. Same permissions as above, scope to RRROCA org
3. Repo → Settings → Secrets → Update `COPILOT_PAT`

## Copilot Coding Agent

The Copilot agent (`copilot-swe-agent[bot]`) handles content-fix issues automatically.

**How it works:**
1. Board member creates issue with `content-fix` label
2. `content-fix-assign.yml` calls GitHub REST API with `agent_assignment` payload
3. Agent creates a PR with `Fixes #N` in the description
4. CI validates → auto-merge if content-only and pure markdown
5. Issue auto-closes on merge

**Key constraints (enforced via `.github/copilot-instructions.md`):**
- No raw HTML in content files — markdown only
- Only link to verified GetCommunal URLs (allowlist in instructions)
- Always include `Fixes #N` to auto-close the originating issue
- No `[WIP]` prefixes — use draft PRs if incomplete
- Cannot use Playwright/browsers in sandbox — Jest + Hugo build only
