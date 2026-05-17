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
- **Events**: https://rrroca.getcommunal.com/events
- **Facilities booking**: https://rrroca.getcommunal.com/facilities
- **Contact email**: info@rrroca.org
- **Facebook Page**: https://www.facebook.com/rrroca.org
- **Facebook Group**: https://www.facebook.com/groups/royaloakrockyridgefamilies

⚠️ **Only link to GetCommunal URLs listed above.** Do NOT invent or guess GetCommunal paths (e.g., `/volunteer` does not exist). If unsure whether a URL exists, ask in an issue comment rather than linking to it.

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

## Content vs Design — Strict Boundary

**Content changes** (auto-mergeable, no review needed):
- Adding/editing markdown text, headings, lists, blockquotes
- Adding/editing standard markdown links: `[text](url)`
- Adding/editing markdown images: `![alt](path)`
- Updating front matter (title, date, description, tags)
- Using existing Hugo shortcodes (e.g., `{{< volunteer-form >}}`)

**Design changes** (require review, NOT auto-mergeable):
- Any raw HTML tags (`<p>`, `<a>`, `<div>`, `<button>`, `<span>`, etc.)
- Any CSS class references (`class="..."`)
- Any inline styles (`style="..."`)
- Creating or modifying Hugo shortcodes
- Changes to templates (`layouts/`), CSS, or JavaScript
- Adding structural sections that change page layout

**If a content-fix issue requires design changes** (buttons, CTAs, layout restructuring):
1. Do NOT add raw HTML to markdown files
2. Instead, comment on the issue explaining that this requires a design change
3. Label the issue `design-change` so a human reviewer handles it
4. Alternatively, use an existing Hugo shortcode if one fits the need

## Rules
1. **Always run the build and tests** before considering work complete
2. **Never commit personal info** (phone numbers, personal emails) — use @rrroca.org role emails only
3. **Forms use mailto:** fallback (not API endpoints) — see `themes/rrroca/static/js/forms.js`
4. **Membership links** must point to Communal (see `hugo.toml` membershipURL param)
5. **Match existing code style** — check surrounding code for conventions
6. For content updates, create/edit files in `content/` — Hugo handles the rest
7. For visual/layout changes, edit templates in `themes/rrroca/layouts/` and CSS in `style.css`
8. **Never launch a browser** to test — use Hugo build + Jest only (see Sandbox rules above)
9. **Always include `Fixes #N`** in PR descriptions to auto-close the originating issue
10. **Never prefix PR titles with `[WIP]`** — create draft PRs instead if incomplete
11. **Never add raw HTML to markdown content files** — if a CTA/button is needed, flag as `design-change`
