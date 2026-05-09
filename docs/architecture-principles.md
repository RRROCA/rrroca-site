# RRROCA Architecture Principles

*Living document — review at each AGM. Last updated: May 2026.*

---

## Why This Document Exists

Community associations are volunteer organizations with inherent constraints that most tech projects don't face: unpredictable turnover, zero budget, variable technical skill, and people who donate hours — not weeks. Every technical decision must be evaluated through this lens, not through the lens of a company with paid staff and IT departments.

These principles are ordered by priority. When principles conflict, higher-ranked principles win.

---

## Core Principles

### P1. Survive Volunteer Turnover (The Bus Factor Principle)

> **No single person's departure — from the board, from Microsoft, or from the project — should break the website or block content updates.**

This is the #1 architecture principle because it reflects the #1 operational reality of every community association: people rotate off the board, move away, get busy, or simply stop volunteering.

**What this means in practice:**
- Shared ownership: GitHub organization (not personal account), 2+ org admins, documented account access
- No "Chad-only" systems: every service must be accessible by at least two board members
- Content management via browser UI (Decap CMS), not terminal/git commands
- Self-documenting: `docs/OPERATIONS.md`, `ARCHITECTURE.md`, `EMERGENCY.md`, `ACCOUNTS.md`
- Annual "bus factor" audit at each AGM: can someone other than the original builder publish a post?

**Decision test:** *"If the person who set this up disappeared tomorrow, could the next volunteer figure it out within 30 minutes with only the documentation we've written?"*

---

### P2. Zero Cost by Default (The Nonprofit Budget Principle)

> **The site must run indefinitely at $0. Every paid service must be optional and its removal must not break core functionality.**

Community associations operate on membership dues, typically $5,000-10,000/year covering insurance, programs, and facility rentals. Website hosting is never a budget priority and is the first line item cut.

**What this means in practice:**
- Static site on free hosting (GitHub Pages) — no server bills, no "oops we forgot to renew"
- Free tiers only for third-party services (Formspree free = 50 submissions/month, more than enough)
- Paid services are enhancement layers, never dependencies: if Formspree disappears, forms degrade to `mailto:` links — not a broken page
- Domain renewal (~$15/year) is the only unavoidable cost
- No "surprise bill" services: avoid usage-based pricing that could spike unexpectedly

**Decision test:** *"If the CA's bank account hits $0 and no one pays any tech bills for a year, does the website still work?"*

---

### P3. Minimal Maintenance Burden (The Volunteer Time Principle)

> **The architecture must require zero ongoing maintenance to keep running. Maintenance effort should only be needed for content updates, never for keeping the lights on.**

Volunteers donate 2-5 hours per month to the CA — total, across all responsibilities. If the website requires patching, updating, monitoring, or babysitting, it will be neglected and eventually break. WordPress sites die this way constantly.

**What this means in practice:**
- Static HTML output: no servers to patch, no databases to back up, no PHP versions to upgrade
- No runtime dependencies: the deployed site is plain HTML/CSS/JS — it runs on any web server
- No monitoring required: static sites don't crash, don't run out of memory, don't get hacked via plugin exploits
- CI/CD handles deployment: push content → GitHub Actions builds → GitHub Pages serves. Fully automated.
- Third-party services must be "set and forget" — if it requires a monthly login to keep working, it's wrong

**Decision test:** *"If nobody touches this for 6 months, does the site still work perfectly?"*

---

### P4. Progressive Skill Levels (The Collaboration Principle)

> **Content editing must be accessible to non-technical volunteers. Development-level access should be available but never required for day-to-day operations.**

A CA board typically has 8-12 members. Maybe 1-2 are technical. The website cannot depend on the technical ones for routine content updates.

**What this means in practice:**
- **Tier 1 — Content editors** (any board member): Browser-based CMS (Decap CMS at `/admin/`). No terminal, no Git, no code. Create/edit news, events, safety alerts via forms and rich text editor.
- **Tier 2 — Power users** (interested volunteers): Can edit markdown files directly on GitHub.com. Understands basic formatting but doesn't need local development setup.
- **Tier 3 — Developer** (rare volunteer or hired freelancer): Full local dev with Hugo, can modify templates, themes, and CI/CD. Needed for design changes, not content.

**Decision test:** *"Can the least technical board member publish a safety alert without asking anyone for help?"*

---

### P5. Security by Elimination (The Static-First Principle)

> **The most secure system is one with no server, no database, no admin panel, and no dynamic code. Eliminate attack surface rather than managing it.**

WordPress is the #1 hacked CMS globally because it has a massive attack surface: PHP runtime, MySQL database, plugin ecosystem, admin login, XML-RPC, REST API. Our approach eliminates all of these.

**What this means in practice:**
- Static HTML output: no server-side code to exploit
- No database: no SQL injection possible
- No admin panel on the public site: CMS authentication goes through GitHub OAuth, not a custom login form
- No plugins: no third-party code with unknown vulnerabilities
- Client-side JavaScript is minimal and doesn't handle sensitive data
- Form submissions go to third-party processors (Formspree): we never store form data ourselves
- All secrets (API keys, OAuth tokens) live in GitHub Secrets or CI/CD config, never in the codebase

**Decision test:** *"If someone runs every hacking tool on the internet against this site, what can they actually do?"* Answer should be: "Nothing. It's static HTML."

---

### P6. Graceful Degradation (The Resilient Features Principle)

> **Every optional feature must fail silently and gracefully. A broken third-party service should never result in a broken page or a confusing user experience.**

Third-party free tiers change, services shut down, API keys expire. This is guaranteed to happen eventually, and when it does, it will be months before a volunteer notices.

**What this means in practice:**
- Forms: If the form backend is down, display a fallback contact method (email address, phone number) — never show an error or blank page
- Search: If the search index fails to load, the search box should still be usable (or hidden) — never throw a JavaScript error that breaks the page
- Analytics: If the analytics service disappears, the site is unaffected — analytics are loaded async and are non-blocking
- Newsletter: If the newsletter provider changes, the signup form shows a static message or mailto fallback
- Images: Use local images in `/static/images/`, not external CDNs that could disappear
- External links: Link to external resources, but never depend on them for core page rendering

**Implementation pattern:**
```javascript
// GOOD — graceful degradation
try {
  const response = await fetch(formEndpoint, { method: 'POST', body: formData });
  if (response.ok) {
    showSuccess("Message sent!");
  } else {
    showFallback("Couldn't send automatically. Please email us at info@rrroca.org");
  }
} catch (error) {
  showFallback("Couldn't send automatically. Please email us at info@rrroca.org");
}

// BAD — brittle, confusing
const response = await fetch(formEndpoint, { method: 'POST', body: formData });
const data = await response.json(); // Throws on non-JSON response
showSuccess(data.message); // Throws if data.message is undefined
```

**Decision test:** *"If this third-party service disappeared overnight and nobody noticed for 3 months, what would users experience?"* The answer should always be: "A slightly reduced feature set, never a broken page."

---

### P7. Portability over Optimization (The No-Lock-In Principle)

> **Content must be stored in standard, portable formats. The site must be deployable to any static host with minimal effort. Prefer widely-adopted tools over niche ones.**

Vendor lock-in is how volunteer projects die: the original tool becomes too expensive, or the company pivots, or the free tier evaporates. Portability is insurance.

**What this means in practice:**
- Content in Markdown files (universal, readable, convertible to anything)
- Configuration in TOML/YAML (standard, human-readable)
- Hugo is one of many static site generators — content can be ported to Jekyll, 11ty, Astro, or even raw HTML
- GitHub Pages is one of many static hosts — same HTML deploys to Netlify, Cloudflare Pages, Vercel, or any web server
- No proprietary CMS data formats — Decap CMS reads/writes standard Markdown+YAML front matter
- Images stored locally in the repo, not in a proprietary media library
- Avoid heavy framework dependencies (React, Vue) — vanilla HTML/CSS/JS is forever

**Decision test:** *"If we needed to move to a different hosting provider or static site generator, how many hours would it take?"* Answer should be: "A few hours, not weeks."

---

### P8. Document Decisions, Not Just Code (The Institutional Memory Principle)

> **Every significant technical decision must be documented with context and rationale. The next volunteer should understand not just WHAT was built, but WHY choices were made.**

Volunteer turnover means institutional memory is constantly lost. Code comments explain HOW. Decision documents explain WHY. Without the why, the next person will either break things by making uninformed changes, or be afraid to touch anything.

**What this means in practice:**
- This document (architecture-principles.md) explains the philosophy
- `ARCHITECTURE.md` explains the technical stack
- `OPERATIONS.md` explains day-to-day content management
- `EMERGENCY.md` explains what to do when things break
- `ACCOUNTS.md` lists all services, accounts, and who has access
- Decision records for non-obvious choices (inline in the relevant docs, not a separate ADR folder — keep it simple)
- Keep documentation in the repo AND in a board-accessible location (Teams/SharePoint once M365 is set up)

**Decision test:** *"Could a reasonably technical person who has never seen this project read the docs and make their first content change within 30 minutes? Could a developer make a theme change within 2 hours?"*

---

## Decision Framework

When evaluating any new service, tool, or feature for the RRROCA site, run it through this checklist:

| # | Question | Acceptable Answers |
|---|----------|-------------------|
| 1 | What happens if this service disappears? | Site still works, feature degrades gracefully |
| 2 | What does it cost? | $0 (free tier), or optional enhancement with free fallback |
| 3 | Does it need ongoing maintenance? | No, or once/year at most |
| 4 | Can a non-technical board member use it? | Yes for content tasks; N/A for development tasks |
| 5 | Does it create vendor lock-in? | No — standard formats, portable, switchable |
| 6 | Does it require Chad (or any single person)? | No — documented, shared access, bus-factor ≥ 2 |
| 7 | Does it increase the attack surface? | No — static-first, no server-side code |
| 8 | Is it documented? | Yes — what it is, why it was chosen, how to change it |

**Scoring:** If a proposed service fails questions 1, 2, or 6, it should be rejected or redesigned. The other questions allow for trade-offs with justification.

---

## Applying Principles to Common Decisions

### Forms (Contact, Volunteer, Safety Report)

| Principle | Implication |
|-----------|------------|
| P2 (Zero cost) | Must have a free tier sufficient for CA volume (~10-20 submissions/month) |
| P3 (Minimal maintenance) | Must be "set and forget" — no server-side code to maintain |
| P5 (Security by elimination) | Form processing happens on third-party servers, not ours |
| P6 (Graceful degradation) | If service dies → show fallback contact info (email/phone), not an error |
| P7 (Portability) | Use standard HTML forms — switching backends means changing one URL |

**Recommended:** Formspree (free tier: 50 submissions/month). Standard HTML `<form>` with `action` URL. If Formspree dies, change one URL or fall back to `mailto:`.

**Alternative path (Phase 2, once M365 is set up):** Microsoft Forms + Power Automate → Teams notification. Zero cost under nonprofit grant. But adds Microsoft dependency, so keep Formspree as documented fallback.

### Newsletter Signup

| Principle | Implication |
|-----------|------------|
| P2 (Zero cost) | Must have a free tier for <500 subscribers |
| P3 (Minimal maintenance) | Must handle double opt-in, unsubscribe, compliance automatically |
| P6 (Graceful degradation) | If provider dies → form shows "email us to subscribe" fallback |
| P7 (Portability) | Subscriber list must be exportable as CSV |

**Recommended:** Buttondown (free tier: 100 subscribers) or Mailchimp (free tier: 500 subscribers). Both handle CAN-SPAM/CASL compliance. Subscriber data exportable.

**Alternative path:** Once M365 is set up, could use Exchange distribution list for newsletter. Simpler but less feature-rich (no analytics, no templates).

### Analytics

| Principle | Implication |
|-----------|------------|
| P2 (Zero cost) | Free or very cheap |
| P3 (Minimal maintenance) | Embed and forget |
| P5 (Security) | Privacy-friendly (no cookie consent banner needed for a CA site) |
| P6 (Graceful degradation) | Loaded async — if it fails, site is completely unaffected |

**Recommended:** Defer. A CA site with ~100-500 monthly visitors doesn't need analytics. If wanted later: Plausible Cloud ($9/mo) or GoatCounter (free, open source). Or just check GitHub Pages traffic stats (free, built-in, zero setup).

### Content Management (CMS)

| Principle | Implication |
|-----------|------------|
| P1 (Survive turnover) | Must work without the person who set it up |
| P4 (Progressive skill) | Browser-based editing for non-technical board members |
| P7 (Portability) | Must read/write standard Markdown — no proprietary format |

**Recommended:** Decap CMS (formerly Netlify CMS). Free, open source, Git-based. Editors use a browser UI; content is stored as Markdown in the same GitHub repo. No additional hosting or database needed.

### Payments (Membership)

| Principle | Implication |
|-----------|------------|
| P2 (Zero cost) | Processor fees are acceptable (2.9% + $0.30), no monthly platform fee |
| P6 (Graceful degradation) | If payment processor is down → show "mail a cheque" or "e-transfer" fallback |

**Recommended:** Defer online payments. Current `mailto:` approach works fine for a CA. When ready: Stripe Checkout (no monthly fee, embedded on the membership page). Keep cheque/e-transfer as permanent fallback.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Dangerous | What To Do Instead |
|---|---|---|
| **"Just add a plugin"** | Plugins create maintenance burden, security risk, and dependencies on individual maintainers | Build minimal features with vanilla HTML/CSS/JS, or use a managed service |
| **"We need a database"** | Databases require backups, patching, connection management, and someone who understands SQL | Keep data in flat files (YAML, JSON, Markdown). Hugo's data templates are powerful. |
| **"Let's build a custom API"** | APIs require hosting, monitoring, authentication, and ongoing maintenance | Use third-party services (Formspree, Stripe) or Hugo's build-time data processing |
| **"Put it in Chad's account"** | Creates a single point of failure | Use organization accounts (GitHub org, CA email addresses), document shared access |
| **"We'll document it later"** | Later never comes. The person who understood it leaves. | Document decisions when you make them. In-context comments > separate docs. |
| **"Optimize for power users"** | Power users are rare and temporary in volunteer orgs | Optimize for the least technical board member first, then add power-user paths |
| **"This tool is better technically"** | Technical superiority doesn't matter if volunteers can't use or maintain it | Choose boring, proven, well-documented tools over cutting-edge ones |

---

## Principle Governance

- **Review cadence:** Annually at AGM, or when onboarding a new technical volunteer
- **Updates:** Any board member can propose changes via PR or discussion
- **Enforcement:** Use the Decision Framework checklist before adopting any new service or tool
- **Owner:** Safety Director (current technical lead) — transfers with the role

---

*These principles are not about what's technically optimal. They're about what survives the reality of volunteer organizations: turnover, time poverty, budget constraints, and variable technical skill. Every decision should be boring, resilient, and documented.*
