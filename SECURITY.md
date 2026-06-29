# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the RRROCA website or deployment pipeline, report it to:

**Email:** [board@rrroca.org](mailto:board@rrroca.org)

Include:

- Description of the issue
- Reproduction steps
- Potential impact

## Scope

This policy covers:

- `rrroca.org` static website delivery
- GitHub repository and GitHub Actions workflows
- Azure Static Web Apps hosting configuration
- Browser-based CMS access and content workflow

## Out of Scope

- Third-party services outside RRROCA control (social platforms, external embeds)
- Legacy or removed runtime systems that are not part of Phase 1

## Security Controls (Phase 1)

- Branch protection and required status checks
- Secret scanning and Dependabot alerts
- CodeQL and repository security monitoring
- Static-site architecture with no custom runtime API surface
- Security-focused Jest checks in CI

## Operational Security Notes

- Keep secrets only in GitHub/Azure secret stores
- Use role-based organizational email accounts
- Rotate deployment tokens when maintainers change
- Ensure at least two maintainers retain admin access for continuity
