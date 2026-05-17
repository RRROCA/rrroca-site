# Copilot Coding Agent Instructions for RRROCA Website

## Project Overview
This is a Hugo static site for the Rocky Ridge Royal Oak Community Association (RRROCA) in Calgary, AB.
- **Hugo theme**: `themes/rrroca/`
- **Content**: `content/` directory with markdown files
- **Styles**: `themes/rrroca/assets/css/style.css`
- **JavaScript**: `themes/rrroca/static/js/`
- **Templates**: `themes/rrroca/layouts/`
- **Config**: `hugo.toml`

## Build & Test

**IMPORTANT**: Hugo is NOT pre-installed. Install it first using the Go installer (no external downloads needed):
```bash
CGO_ENABLED=1 go install -tags extended github.com/gohugoio/hugo@v0.161.1
```

If Go is not available, download Hugo directly:
```bash
curl -sSL https://github.com/gohugoio/hugo/releases/download/v0.161.1/hugo_extended_0.161.1_linux-amd64.tar.gz | tar xz -C /usr/local/bin hugo
```

Then build and test:
```bash
hugo --quiet          # Build the site (must pass with no errors)
npm ci                # Install test dependencies
npx jest --verbose    # Run ALL validation tests (must all pass)
```

## Content Structure
- News articles → `content/news/`
- Events → `content/events/`
- Community pages → `content/community/`
- Board / Governance → `content/board/`
- Safety → `content/safety/`
- Sports → `content/sports/`
- About pages → `content/about/`
- Board members → `content/about/board-members/`

## Content File Format
All content pages use Hugo front matter:
```markdown
---
title: "Page Title"
date: "YYYY-MM-DD"
description: "Short description for SEO and hero section"
categories: ["section-name"]
tags: ["tag1", "tag2"]
draft: false
---

Page content in markdown...
```

## Key URLs & Services
- **Membership**: https://rrroca.getcommunal.com/memberships
- **Contact email**: info@rrroca.org
- **Facebook Page**: https://www.facebook.com/rrroca.org
- **Facebook Group**: https://www.facebook.com/groups/royaloakrockyridgefamilies

## Design System
- Uses CSS custom properties (design tokens) defined in `:root`
- Mountain-inspired palette: sky (#1a3a5c), ridge (#2c6e8a), meadow (#4a8c5c), sunset (#e8913a)
- Fonts: Inter (body), Merriweather (headings)
- Mobile-first responsive design with breakpoints at 480px, 768px, 1024px

## Sandbox Environment Rules
**CRITICAL**: You run in a sandboxed VM with firewall restrictions.
- **DO NOT** use Playwright, Puppeteer, headless browsers, or any browser-based testing
- **DO NOT** make outbound HTTP requests to external sites (they will be blocked)
- **DO NOT** install apt packages from external repos (dl.google.com is blocked)
- **ONLY** verify your work with `hugo --quiet` (build) and `npx jest` (tests)
- The Jest tests validate the built HTML output — that's sufficient

## Rules
1. **Always run the build and tests** before considering work complete
2. **Never commit personal info** (phone numbers, personal emails) — use @rrroca.org role emails only
3. **Forms use mailto:** fallback (not API endpoints) — see `themes/rrroca/static/js/forms.js`
4. **Membership links** must point to Communal (see `hugo.toml` membershipURL param)
5. **Match existing code style** — check surrounding code for conventions
6. For content updates, create/edit files in `content/` — Hugo handles the rest
7. For visual/layout changes, edit templates in `themes/rrroca/layouts/` and CSS in `style.css`
8. **Never launch a browser** to test — use Hugo build + Jest only (see Sandbox rules above)
9. **Always include `Fixes #N` or `Closes #N`** in your PR description (where N is the issue number you're addressing) so the issue auto-closes on merge
10. **Keep PR titles clean** — no `[WIP]` prefix; mark as draft only if genuinely incomplete
11. **Update `docs/ALM-ARCHITECTURE.md`** if your changes affect CI/CD workflows, deployment, or testing strategy
