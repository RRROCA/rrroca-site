# Code Review Instructions

These instructions guide GitHub Copilot when reviewing pull requests on this repository.

## Scope-Based Review

### Infrastructure & Security Files (`api/**`, `staticwebapp.config.json`, `.github/workflows/**`, `hugo.toml`)

When these files change, check for:

- **Security regressions**: Weakened CSP directives, removed auth guards, exposed secrets in logs, new `unsafe-eval`/`unsafe-inline` without justification
- **Cost implications**: New Azure services, increased API quotas/limits, added dependencies with runtime costs
- **Graceful degradation**: What happens if the new dependency/service is unavailable? Does the site still load?
- **Credential hygiene**: Secrets referenced but not in environment, overly broad permissions on tokens/workflows
- **Documentation gap**: If a new secret, service, or architectural pattern is introduced, flag if `SECURITY.md`, `docs/ALM-ARCHITECTURE.md`, or `docs/CONTINUITY-BINDER.md` are not also updated in the PR

### Content Files (`content/**`, `static/images/**`)

Do NOT raise architecture concerns on content-only changes unless they:
- Introduce raw HTML, `<script>` tags, or inline event handlers
- Reference external URLs that could break (non-RRROCA domains)
- Include personal data (phone numbers, personal email addresses)

### Workflow Files (`.github/workflows/**`)

Additionally check:
- Permissions are minimal (prefer `contents: read` unless write is justified)
- No use of `pull_request_target` without explicit security justification
- Pinned action versions (use SHA, not floating tags like `@main`)
- Secrets are not passed to steps that don't need them

## General Principles

- **Do not comment on style, formatting, or naming** unless it creates a functional bug
- **Do not repeat guidance** already covered by linters or CI checks
- **Prefer actionable feedback** — suggest a fix, not just "this might be a problem"
- **Consider volunteer context** — complex mitigations that require ongoing maintenance are a cost, not just a benefit
