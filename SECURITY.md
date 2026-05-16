# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the RRROCA website or its
infrastructure, please report it responsibly.

**Email:** [board@rrroca.org](mailto:board@rrroca.org)

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will acknowledge receipt within **48 hours** and aim to resolve
confirmed issues within **7 days**.

## Scope

This policy covers:
- The RRROCA website (rrroca.github.io/rrroca-site)
- GitHub Actions workflows and CI/CD pipeline
- CMS admin interface (Sveltia CMS)

## Out of Scope

- Third-party services (Google Fonts, unpkg CDN)
- Social media integrations

## Security Measures

- **Secret scanning** — enabled with push protection
- **Dependabot alerts** — monitors npm dependencies
- **CodeQL analysis** — static analysis on JavaScript/TypeScript
- **Branch protection** — required CI checks before merge
- **Content Security** — Jest security test suite validates built output
