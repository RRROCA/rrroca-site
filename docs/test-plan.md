# RRROCA Test & CI/CD Optimization Plan

> Architecture Principles: P0 (Secure), P1 (Simple/Operable), P3 (Cost-Effective), P7 (Future-Proof)

## Problem Statement

The site can be taken down by a bad check-in because:

1. **gh-pages.yml deploys independently of ci.yml** — CI can fail but deploy still runs
2. **Content PRs auto-merge without waiting for CI** (auto-merge-content.yml)
3. **Running all 70+ tests + Playwright for every push is slow** and will get slower
4. **No auto-generation of tests** when changes are approved from CLI or mobile

## Solution: Gate → Target → Generate

### Layer 1: Gate (P1 — Simple, Operable)

**Goal:** Never deploy a broken site.

Merge `gh-pages.yml` and `ci.yml` into a single workflow with a strict pipeline:

```
build → test → deploy
```

- Deploy step uses `needs: test` — a broken build never reaches production
- Deploy only runs on push to master (not PRs)
- PRs get the same build+test but skip deploy
- Remove the separate `gh-pages.yml` to eliminate the ungated deploy path

**Current state (broken):**
```
push to master ──┬── ci.yml (build + test) ──── pass/fail (no effect on deploy)
                 └── gh-pages.yml (build + deploy) ──── ALWAYS deploys
```

**Target state (gated):**
```
push to master ──── unified.yml (build → test → deploy)
                                          │
                                    must pass ✓
```

### Layer 2: Target (P3 — Cost-Effective)

**Goal:** Run only relevant tests based on what changed. Fast feedback, no wasted CI minutes.

Use `dorny/paths-filter` to detect change type and route to the right test subset:

| Change Type | Files | Tests Run | ~Time |
|---|---|---|---|
| Content only | `content/**`, `static/images/**` | content-validation, build-validation, navigation | ~30s |
| Theme/config | `themes/**`, `hugo.toml`, `static/css/**` | Full Jest suite + Playwright e2e | ~90s |
| JavaScript | `static/js/**` | Unit tests + e2e | ~60s |
| Docs/CI only | `docs/**`, `.github/**`, `*.md` (root) | Skip tests (build-only) | ~10s |
| Mixed | Any combination | Full suite | ~90s |

Implementation: Parallel jobs in the unified workflow, each with path-based `if` conditions.

### Layer 3: Generate (P7 — Future-Proof)

**Goal:** Every approved change automatically gets test coverage.

Post-merge workflow triggered on push to master:

1. Analyze the commit diff (files changed, type of change)
2. Determine which test files should be updated
3. Open a GitHub Issue with:
   - Summary of what changed
   - Which tests should be created/updated
   - Suggested test descriptions
4. Label the issue `test-coverage` for tracking

This is non-blocking — runs after merge so it never slows the approval flow. When approving from GHCP CLI or GH mobile, test updates come as follow-up issues automatically.

**Future enhancement:** When Copilot coding agent is enabled on the repo, the workflow can open a PR with actual test code instead of just an issue.

## Test Suite Reference

| Suite | Tests | Type | When to Run |
|---|---|---|---|
| `build-validation` | 17 | Build artifacts + negative | Always (gatekeeper) |
| `navigation` | 14 | Link integrity + negative | Content + theme changes |
| `content-validation` | 6 | Source quality | Content changes |
| `homepage-ux` | 10 | UX contract | Theme changes |
| `qa-comprehensive` | 24 | Security/QA + negative | Theme + config changes |
| `ai-assistant` | 6 | Unit | JS changes |
| `search` | 4 | Unit | JS changes |
| `safety-dashboard` | 5 | Unit + DOM | JS + theme changes |
| `e2e/smoke` | 10 | Playwright + negative | Theme + config changes |

**Total: 96 tests (86 Jest + 10 Playwright)**

## Negative Test Categories

| Category | Suite | Tests | What It Catches |
|---|---|---|---|
| Build | `build-validation` | 5 | Missing 404, empty content, placeholders, broken images, raw templates |
| Navigation | `navigation` | 5 | External URLs for internal pages, duplicates, draft links, broken anchors, multiple h1 |
| Security | `qa-comprehensive` | 6 | External forms, inline JS, http:// links, raw emails, removed paths, phone formatting |
| E2E | `e2e/smoke` | 4 | 404 rendering, console errors, mixed content, JS-disabled fallback |

## Branch Protection (CRITICAL)

Merge workflows (`merge-on-approve.yml`, `auto-merge-content.yml`) use only `enablePullRequestAutoMerge` — never direct merge. This ensures CI must pass before any merge, including approvals from mobile.

**Required manual setup:** Repository Settings → Branches → Add rule for `master`:
- ✅ Require status checks: `build-and-test`
- ✅ Require branches to be up to date

## Implementation Todos

1. ~~**unified-ci-pipeline** — Merge gh-pages.yml + ci.yml into single gated workflow~~ ✅
2. ~~**targeted-tests** — Add paths-filter for conditional test execution~~ ✅
3. ~~**test-gen-workflow** — Create post-merge issue-creation workflow~~ ✅
4. ~~**update-testing-docs** — Update docs/TESTING.md with new structure~~ ✅
5. ~~**negative-tests** — Add negative test cases across all 4 categories~~ ✅
6. ~~**branch-protection** — Fix merge workflows to prevent phone-approval bypass~~ ✅

## L64 ATS Impact Narrative

> "Designed a CI/CD architecture for RRROCA's community site that prevents production outages through gated deployment pipelines (Gate), optimizes developer velocity with change-aware targeted testing that reduces CI time by 60% for content updates (Target), and uses AI-augmented post-merge analysis to automatically maintain test coverage as the site evolves (Generate). Applied architecture principles P0, P1, P3, P7 to balance reliability with volunteer-friendly simplicity."
