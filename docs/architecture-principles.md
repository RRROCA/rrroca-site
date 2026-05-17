# RRROCA Architecture Principles

*Living document — review at each AGM. Last updated: May 2026.*

---

## Why This Document Exists

Community associations are volunteer organizations with inherent constraints that most tech projects don't face: unpredictable turnover, zero budget, variable technical skill, and people who donate hours — not weeks. Every technical decision must be evaluated through this lens, not through the lens of a company with paid staff and IT departments.

These principles are grounded in and aligned to the RRROCA Strategic Plan (2024-2028) and Business Plan (2023-2028), which together define the Association's mandate, values, and guiding principles.

These principles are ordered by priority. When principles conflict, higher-ranked principles win.

---

## TL;DR

**Build a website that a non-technical volunteer board can maintain at zero cost, forever.** Use static HTML (no servers, no databases, no plugins), store content in portable Markdown, and make every feature degrade gracefully when third-party services change or disappear. AI coding assistants are the succession plan — choose a platform they can work with.

### Principles at a Glance

| # | Principle | One-Liner |
|---|-----------|-----------|
| **P0** | [Community First](#north-star) | Every decision serves resident engagement — informed, safe, involved |
| **P1** | [Survive Volunteer Turnover](#p1-survive-volunteer-turnover-the-bus-factor-principle) | No single person's departure breaks the website |
| **P2** | [Zero Cost by Default](#p2-zero-cost-by-default-the-sustainability-principle) | Site runs at $0 indefinitely; paid services are optional |
| **P3** | [Minimal Maintenance](#p3-minimal-maintenance-the-neglect-proof-principle) | Zero ongoing maintenance to keep the lights on |
| **P4** | [Progressive Skill Levels](#p4-progressive-skill-levels-the-accessibility-principle) | Content editors → power users → AI-assisted → developers |
| **P5** | [Security by Elimination](#p5-security-by-elimination-the-static-first-principle) | No server, no database, no attack surface |
| **P6** | [Graceful Degradation](#p6-graceful-degradation-the-resilient-features-principle) | Broken third-party = reduced features, never broken pages |
| **P7** | [Portability](#p7-portability-over-optimization-the-no-lock-in-principle) | Standard formats, no vendor lock-in, deployable anywhere |
| **P8** | [Document Decisions](#p8-document-decisions-not-just-code-the-institutional-memory-principle) | Next volunteer understands WHY, not just WHAT |

Also in this document: [Decision Framework](#decision-framework) (10-question checklist) · [Applied Guidance](#applying-principles-to-common-decisions) (forms, CMS, payments) · [AI Tooling Strategy](#ai-tooling-strategy) · [Anti-Patterns](#anti-patterns-to-avoid)

---

## North Star

### P0. Community First (The Engagement Principle)

> **Every feature, page, and design decision exists to strengthen the connection between residents and their community. If it doesn't help a neighbour feel more informed, more safe, or more involved — it doesn't belong.**

This is the north star that sits above all other principles. It flows directly from RRROCA's founding mandate:

- **Vision:** *"Build a sense of community that encourages involvement between community-based organizations, community members, and individual neighborhoods... Friendly, Safe and Environmentally Sensitive."*
- **Mission:** *"A vital organization that effectively acts in response to the common interests and concerns of the community's diverse residents."*
- **Guiding Principle #2:** *"Strive to be a Community Hub of Information"*

The website is not a technology project — it's a **Community Hub of Information** that happens to use technology. The measure of success is not uptime, page speed, or code quality. It's whether residents check the site when they hear sirens, whether new families discover their community cleanup day, whether a senior finds the right phone number during an emergency.

**Alignment to RRROCA Guiding Principles:**

| RRROCA Guiding Principle | How the website serves it |
|---|---|
| #1 Represent the community on well-being and aesthetics | Safety alerts, development updates, planning notices |
| #2 Community Hub of Information | The entire site — events, news, resources, contacts |
| #3 Inspire involvement through volunteer opportunities | Volunteer forms, "get involved" calls-to-action on every page |
| #4 Engage with HAs, community-based groups | Partner org directory, joint event promotion |
| #5 Support Child and Youth organizations | Youth programs page, Scouts/Guides links |
| #6 Promote sports and programs for various age groups | Programs page, registration info, seasonal schedules |
| #7 Organize social events to bring community together | Events calendar, event recaps with photos |
| #8 Promote safety and act on public safety trends | Safety dashboard, concern reporting, CPS liaison info |

**What this means in practice:**
- Content hierarchy is driven by resident needs, not board structure. Safety alerts and upcoming events are more important than bylaws and meeting minutes.
- Every page should answer a resident's question — "Is my neighbourhood safe?" "What's happening this weekend?" "How do I get involved?" — not showcase the CA's org chart.
- Features are justified by engagement impact: a simple event calendar that 200 families check monthly is worth more than a sophisticated membership portal that 10 people use. (Context: RRROCA has ~150-200 memberships out of ~20,000 residents — the site must serve the whole community, not just members.)
- Design choices favour warmth and approachability over corporate polish. This is a neighbourhood, not a brand.
- Accessibility is non-negotiable — the site serves everyone from tech-savvy parents to seniors who just learned to use a tablet.
- Local voice matters: content should sound like a neighbour talking, not a press release. Real photos of real events, not stock imagery.

**Decision test:** *"Does this feature help a Rocky Ridge or Royal Oak resident feel more connected to their community?"* If the answer is no or "maybe eventually," deprioritize it.

---

## Core Principles

### P1. Survive Volunteer Turnover (The Bus Factor Principle)

> **No single person's departure — from the board, from the community, or from the project — should break the website or block content updates.**

This is the #1 architecture principle because it reflects the #1 operational reality of every community association: people rotate off the board, move away, get busy, or simply stop volunteering.

**Strategic Plan alignment:** The Business Plan explicitly calls out succession planning as a priority — *"Each member of the Executive and Portfolio Chairs should develop a succession plan and actively develop a successor."* Board attendance and quorum are recurring challenges. The Association has no paid staff and relies entirely on volunteers. Technology choices must reflect this reality: if the Communications Chair changes mid-year, the website cannot go dark.

**What this means in practice:**
- Shared ownership: GitHub organization (not personal account), 2+ org admins, documented account access
- No "Chad-only" systems: every service must be accessible by at least two board members
- Content management via browser UI (Decap CMS), not terminal/git commands
- Self-documenting: `docs/OPERATIONS.md`, `ARCHITECTURE.md`, `EMERGENCY.md`, `ACCOUNTS.md`
- Annual "bus factor" audit at each AGM: can someone other than the original builder publish a post?
- Align with board succession planning: website handoff should be part of every Portfolio Chair transition

**Decision test:** *"If the person who set this up disappeared tomorrow, could the next volunteer figure it out within 30 minutes with only the documentation we've written?"*

---

### P2. Zero Cost by Default (The Nonprofit Budget Principle)

> **The site must run indefinitely at $0. Every paid service must be optional and its removal must not break core functionality.**

**Strategic Plan alignment:** RRROCA's values include *Fiscal Responsibility*. The Association's unrestricted revenue comes primarily from ~150-200 annual memberships and business sponsorships — total operating budget is modest. Casino gaming proceeds (AGLC) are restricted to specific capital expenditures and cannot fund technology. The Business Plan notes that *"staff salaries can only be drawn from unrestricted funds"* — website costs compete directly with programming, events, and facility maintenance (~$4,735/year).

Section 10.2 calls for a *"Financial Model for Technology Investments"* — our model is simple: $0 baseline, optional enhancements only.

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

**Strategic Plan alignment:** The Business Plan repeatedly identifies limited volunteer time as the primary constraint — *"The Association currently has no paid staff and relies entirely on volunteers."* Board quorum is already a challenge; bylaw requirements and absences are preventing motions from passing. Portfolio Chairs carry governance, operations, AND programming responsibilities. Every hour a volunteer spends on website maintenance is an hour not spent on events, programs, or community engagement. The old tech strategy's WordPress + 10Web + plugins approach would have demanded exactly the kind of ongoing security patching and plugin management that volunteers don't have time for.

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

**Strategic Plan alignment:** The Business Plan identifies distinct operational tiers — Executive Committee, Portfolio Chairs, general volunteers — with varying capacity and expertise. The Communications Chair oversees all external communications (website, newsletter, social media). Programs, Events, and Safety Chairs need to post content specific to their portfolios. The old tech strategy identified 7 personas ranging from "Paul Anderson" (new resident wanting instant AI answers) to "David Lee" (technology volunteer contributing expertise). The architecture must serve all of them without requiring the technical ones for routine tasks.

The Business Plan's Section 10.4 calls for *"digital tools for effective volunteer management"* — the CMS and content workflow IS a volunteer management tool.

**What this means in practice:**
- **Tier 1 — Content editors** (any board member): Browser-based CMS (Decap CMS at `/admin/`). No terminal, no Git, no code. Create/edit news, events, safety alerts via forms and rich text editor.
- **Tier 2 — Power users** (interested volunteers): Can edit markdown files directly on GitHub.com. Understands basic formatting but doesn't need local development setup.
- **Tier 2.5 — AI-assisted contributors** (the new middle): A semi-technical volunteer with access to AI tools (GitHub Copilot CLI, Copilot Chat, or similar) can perform developer-tier tasks — modifying templates, debugging build failures, updating configuration — without deep Hugo/Git expertise. AI dramatically compresses the gap between Tier 2 and Tier 3. This is a strategic differentiator: the platform choice should maximize AI-assistability (well-documented, standard tooling, text-based config).
- **Tier 3 — Developer** (rare volunteer or hired freelancer): Full local dev with Hugo, can modify templates, themes, and CI/CD. Needed for design changes, not content.

**AI as force multiplier:** The traditional CA problem is "we need a developer but can't afford or retain one." AI tools fundamentally change this equation. A board member who can describe what they want in plain English can now get implementation help from AI — but ONLY if the underlying platform is AI-friendly. Static sites with Markdown, standard HTML/CSS/JS, and well-documented toolchains are maximally AI-assistable. Proprietary platforms (WordPress plugins, Google Sites templates, managed CMS web parts) are opaque to AI tools, which limits this multiplier effect.

**Decision test:** *"Can the least technical board member publish a safety alert without asking anyone for help? And can a semi-technical volunteer with AI assistance make a template change without a developer?"*

---

### P5. Security by Elimination (The Static-First Principle)

> **The most secure system is one with no server, no database, no admin panel, and no dynamic code. Eliminate attack surface rather than managing it.**

**Strategic Plan alignment:** The Business Plan's Section 9.1 calls for a *"Comprehensive Cybersecurity Strategy"* including *"secure access controls, regular security audits, and staff training on data privacy norms."* For a volunteer organization with no IT staff, the most effective cybersecurity strategy is elimination of the attack surface entirely. The current WordPress site has a massive vulnerability profile (PHP, MySQL, plugins, admin panel, XML-RPC) — moving to static HTML eliminates ALL of these vectors. Security audits become trivial when there's nothing to audit. The old tech strategy recommended 10Web + WordPress plugins + AI chatbot backends — each one adding attack surface that volunteers would need to monitor and patch.

The Business Plan also emphasizes compliance with data privacy norms (PIPEDA in Canada). Static sites that don't collect or store personal data have minimal privacy obligations — form submissions go directly to third-party processors (Formspree, Google Forms) who handle compliance.

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

**Strategic Plan alignment:** The Business Plan emphasizes partnerships and collaboration (Section 10.3, Guiding Principle #4) — with homeowner associations, churches, YMCA, CPS, schools, and local businesses. Many of these partnerships will involve linking to external resources, embedding shared calendars, or integrating third-party services. These external dependencies WILL change, break, or disappear. The architecture must treat every external integration as "nice to have" — enhancing the experience when available, invisible when not.

The old tech strategy's AI chatbot (Botsify/Tidio/Dialogflow at $50-100/month) would have been a single point of failure: when the subscription lapsed or the free tier changed, residents would get errors instead of information. Every integration must degrade to a simpler alternative, never to a broken page.

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

**Strategic Plan alignment:** RRROCA already faces a platform decision: Google Workspace for board operations, with a potential future path to other productivity suites via nonprofit grants. The Business Plan's board operations run on Google Calendar, Google Drive, Gmail, and WhatsApp. The website must be independent of the board's operational platform — whether that's Google today, another suite tomorrow, or something else entirely. Content in Markdown is platform-agnostic: it can be served from GitHub Pages, Netlify, Cloudflare Pages, or any web server. This independence protects the community's content investment regardless of what happens with board tooling.

The old tech strategy was built around WordPress + Google ecosystem integration — tightly coupling the website to both a CMS platform and an operational platform. Our approach decouples these: website content is portable Markdown, operational tooling is a separate decision.

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

**Strategic Plan alignment:** The Business Plan calls for succession planning at every level — *"Each member of the Executive and Portfolio Chairs should develop a succession plan and actively develop a successor."* Technology decisions are particularly vulnerable to institutional memory loss because they involve specialized knowledge. When the Safety Director who built the website rotates off the board, the next person needs to understand not just how to post content, but why Hugo was chosen over WordPress, why Formspree instead of a custom backend, why the site is on GitHub Pages instead of a paid host.

The old tech strategy recognized this with its "Standardization and Documentation" pillar but placed documentation in Google Drive. Our approach keeps documentation IN the repository (where it can't get separated from the code) AND in a board-accessible location (Google Drive today, or whatever collaboration platform the board uses in the future). Dual storage per P1 (bus factor) — if either copy is lost, the other survives.

**What this means in practice:**
- This document (architecture-principles.md) explains the philosophy
- `ARCHITECTURE.md` explains the technical stack
- `OPERATIONS.md` explains day-to-day content management
- `EMERGENCY.md` explains what to do when things break
- `ACCOUNTS.md` lists all services, accounts, and who has access
- Decision records for non-obvious choices (inline in the relevant docs, not a separate ADR folder — keep it simple)
- Keep documentation in the repo AND in a board-accessible location (shared drive, collaboration platform)

**Decision test:** *"Could a reasonably technical person who has never seen this project read the docs and make their first content change within 30 minutes? Could a developer make a theme change within 2 hours?"*

---

## Decision Framework

When evaluating any new service, tool, or feature for the RRROCA site, run it through this checklist:

| # | Question | Acceptable Answers |
|---|----------|-------------------|
| 0 | Does this help residents feel more informed, safe, or involved? (P0 — Community Hub of Information) | Yes — clear engagement value |
| 1 | What happens if this service disappears? | Site still works, feature degrades gracefully |
| 2 | What does it cost? | $0 (free tier), or optional enhancement with free fallback |
| 3 | Does it need ongoing maintenance? | No, or once/year at most |
| 4 | Can a non-technical board member use it? | Yes for content tasks; N/A for development tasks |
| 5 | Does it create vendor lock-in? | No — standard formats, portable, switchable |
| 6 | Does it require Chad (or any single person)? | No — documented, shared access, bus-factor >= 2 |
| 7 | Does it increase the attack surface? | No — static-first, no server-side code |
| 8 | Is it documented? | Yes — what it is, why it was chosen, how to change it |
| 9 | Is it AI-assistable? | Yes — a volunteer with AI tools (GHCP CLI, Copilot) can understand, modify, and troubleshoot it without deep expertise |

**Scoring:** If a proposed service fails questions 0, 1, 2, or 6, it should be rejected or redesigned. Question 9 is a strong preference — AI-assistability is a force multiplier for volunteer capacity, but not an absolute requirement for simple services.

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

**Alternative path (Phase 2, once nonprofit productivity suite is set up):** Cloud-based forms + automation → chat notification. Zero cost under nonprofit grant. But adds vendor dependency, so keep Formspree as documented fallback.

### Newsletter Signup

| Principle | Implication |
|-----------|------------|
| P2 (Zero cost) | Must have a free tier for <500 subscribers |
| P3 (Minimal maintenance) | Must handle double opt-in, unsubscribe, compliance automatically |
| P6 (Graceful degradation) | If provider dies → form shows "email us to subscribe" fallback |
| P7 (Portability) | Subscriber list must be exportable as CSV |

**Recommended:** Buttondown (free tier: 100 subscribers) or Mailchimp (free tier: 500 subscribers). Both handle CAN-SPAM/CASL compliance. Subscriber data exportable.

**Alternative path:** Once a nonprofit productivity suite is set up, could use distribution list for newsletter. Simpler but less feature-rich (no analytics, no templates).

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

### Board Identity & Authentication

| Principle | Implication |
|-----------|------------|
| P0 (Community First) | Faster board governance → better outcomes for residents |
| P1 (Survive turnover) | New board members sign in with their existing @rrroca.org email — zero onboarding |
| P2 (Zero cost) | Azure SWA built-in auth is free. No per-user licensing. |
| P4 (Progressive skill) | "Sign in with Google" — one click, no training required |
| P5 (Security by elimination) | Azure SWA handles OAuth — no custom auth code, no password storage |
| P7 (Portability) | Swap Google → Microsoft Entra ID with one config change when/if @rrroca.org migrates |

**Decided:** Google OAuth via Azure Static Web Apps built-in authentication. Board members authenticate with their existing @rrroca.org Google Workspace accounts. Authorization enforced in the API by verifying `@rrroca.org` email domain from the `x-ms-client-principal` header.

**Decision gauntlet (May 2026):** Evaluated three options — (A) Google OAuth + direct email notifications, (B) GitHub Enterprise SSO ($168/month — rejected, fails P2), (C) simple GitHub accounts for board members (rejected, fails P4 — onboarding friction for non-technical volunteers). Option A passes all 10 checks with zero hard fails.

**Migration path:** When/if RRROCA moves from Google Workspace to Microsoft 365, change `auth.identityProviders.google` to `auth.identityProviders.azureActiveDirectory` in `staticwebapp.config.json`. Board members experience zero change — same @rrroca.org email, same sign-in flow.

### Board Notifications

| Principle | Implication |
|-----------|------------|
| P2 (Zero cost) | GitHub Actions is free for public repos. Google Group included in Workspace. |
| P3 (Minimal maintenance) | Self-contained workflow triggers on issue events. Board membership managed in Google Groups. |
| P5 (Security by elimination) | No email API keys in application code. SMTP secrets in GitHub repository secrets. |
| P6 (Graceful degradation) | If email fails → Board Action Center page and AI assistant still show all pending motions. |
| P7 (Portability) | Google Group today → M365 Group tomorrow. SMTP is standard protocol. |

**Decided:** GitHub Actions workflow (`board-notify.yml`) sends email to `board@rrroca.org` (Google Group) when motions are proposed, seconded, or voted on. The workflow triggers on GitHub Issue events with the `motion` label. Board members receive email, click a link to `rrroca.org/board/actions/`, sign in, and act.

**Why not GitHub @mentions:** Requires board members to have GitHub accounts (fails P4 — onboarding friction). Why not SendGrid/ACS in the Azure Function: adds API keys to the app (fails P5 — unnecessary attack surface). GitHub Actions + Google Group is zero new infrastructure — both already exist.

### AI Community Assistant (Chatbot)

| Principle | Implication |
|-----------|------------|
| P0 (Community First) | Residents get instant answers. Board members get a "board secretary." |
| P2 (Zero cost) | Azure OpenAI via existing Azure subscription. No per-query cost at CA volume. |
| P3 (Minimal maintenance) | System prompt is text. Knowledge base auto-builds from site content. |
| P4 (Progressive skill) | Conversational interface — the most accessible possible UI |
| P5 (Security by elimination) | Strict system prompt guardrails. Board features gated by auth. |
| P6 (Graceful degradation) | If chatbot fails → search bar, navigation, and static pages still work |
| P7 (Portability) | System prompt is plain text. Swappable to any LLM provider. |

**Decided:** Single chatbot with progressive capabilities based on authentication state:

- **Public visitors:** Community Q&A from site knowledge base. Events, safety, programs, facilities.
- **Authenticated board members:** All public capabilities PLUS board context — pending motions, vote status, meeting awareness. Can help draft motions and communications. Directs to Board Action Center for official actions (propose/second/vote).

**Note:** This supersedes the earlier anti-pattern "Don't build an AI chatbot." The original concern was valid (paid chatbot services at $50-100/month violate P2 and P6). The implementation uses Azure OpenAI at zero incremental cost on the existing Azure subscription, with graceful degradation to static content if the service is unavailable. The chatbot is an enhancement layer, never a dependency.

---

## AI Tooling Strategy

> *This section operationalizes the AI-assistability principle (P4 Tier 2.5, Decision Framework Q9) with specific tooling recommendations aligned to RRROCA's operational model.*

### Why AI Matters for a Community Association

RRROCA's fundamental constraint is volunteer capacity — ~150-200 members, a board of 15-20, zero paid staff, and chronic quorum challenges. Traditional website management requires either:
- **A developer volunteer** (rare, temporary, creates bus-factor-1 risk per P1)
- **Paid contractors** (violates P2 at $50-150/hr)
- **Dumbing down the platform** (limits capability, creates lock-in per P7)

AI tools create a fourth option: **a semi-technical volunteer who can accomplish developer-level tasks with AI assistance.** This is the Tier 2.5 model — and it's the strategic reason the platform choice matters far beyond hosting costs.

### AI Use Cases for RRROCA

| Use Case | Who | AI Tool | Platform Requirement |
|----------|-----|---------|---------------------|
| **Website changes** — modify templates, fix bugs, update layouts | Communications Chair or tech volunteer | AI coding assistants (GitHub Copilot, ChatGPT, etc.) | Text-based codebase (Hugo/Markdown/HTML) — AI can read, understand, and modify. Proprietary platforms (Google Sites, managed CMS) have opaque templates AI can't assist with. |
| **Content drafting** — write news articles, event descriptions, safety alerts | Any board member | Any AI assistant (Copilot, Gemini, ChatGPT) | Markdown-based content → AI drafts, human reviews, publishes via CMS. Works with any AI. |
| **Safety analysis** — summarize CPS reports, identify crime trends, draft community alerts | Safety Director | AI coding assistants | Structured data in YAML/JSON → AI can analyze and generate visualizations. |
| **Board collaboration** — meeting prep, agenda generation, motion drafting | President, Secretary | Productivity suite AI (Copilot, Gemini) | Independent of website platform — uses whatever productivity suite the board runs on. |
| **Partner coordination** — draft communications to CPS, City, HAs, schools | Portfolio Chairs | Email/docs AI | Email/docs tool, independent of website platform. |
| **Volunteer management** — matching volunteers to tasks, tracking hours | Volunteers Chair | Future AI-assisted tools | Structured data (Google Sheets/Forms today, could migrate to other platforms). |
| **Troubleshooting** — diagnose build failures, fix CI, debug deployment | Tech volunteer | GitHub Copilot CLI | Git-based workflow with standard toolchain. GHCP CLI can read error logs, suggest fixes, and implement them. Not possible with managed platforms (10Web, Google Sites). |

### Platform AI-Assistability Score

| Platform | AI Can Read Code | AI Can Modify Templates | AI Can Debug Builds | AI Can Assist Content | Score |
|----------|:---:|:---:|:---:|:---:|:---:|
| **Hugo + GitHub** | ✅ Markdown, HTML, Go templates, JS — all text-based | ✅ Edit any template file with GHCP CLI | ✅ Read build logs, fix errors, run locally | ✅ Draft Markdown content | ⭐⭐⭐⭐ |
| **WordPress + 10Web** | ⚠️ PHP readable but plugin code is opaque | ❌ Themes are PHP + database queries, fragile to edit | ❌ "Plugin conflicts" are nearly impossible to AI-debug | ✅ Draft content in editor | ⭐⭐ |
| **Google Sites** | ❌ No code access, proprietary | ❌ Template changes via GUI only | N/A No build process | ⚠️ Content via Google Docs integration | ⭐ |
| **Managed CMS (e.g. SharePoint)** | ⚠️ Framework-specific TypeScript | ⚠️ Web parts modifiable but require framework knowledge | ⚠️ Build process exists but debugging requires platform expertise | ✅ Content via built-in pages | ⭐⭐ |

### AI-Assisted Coding as the "Safety Net" for Volunteer Turnover

A key strategic insight: AI coding assistants don't just help WITH the current developer — they ARE the succession plan for the developer role.

**Scenario:** Chad (current Safety Director / tech volunteer) rotates off the board. The next Communications Chair has no coding experience. With Hugo + GitHub:
1. They post content via Decap CMS (Tier 1 — no AI needed)
2. They need a template change → they describe it to an AI coding assistant → it modifies the template → they review and commit (Tier 2.5)
3. Build breaks → AI reads the error log → suggests and implements the fix (Tier 2.5)
4. They need a new feature → AI plans it, implements it, and explains what it did (Tier 2.5)

With WordPress, Google Sites, or managed CMS platforms, steps 2-4 require hiring a contractor or finding another developer volunteer. AI can't help because the platforms are opaque.

**This makes Hugo + GitHub not just a cost-competitive choice (P2) but a P1-compliant choice** — it's the only platform where AI-assisted volunteers can maintain the full stack.

### Board Operations — AI-Assisted Collaboration

Board operations (meetings, motions, communications, partner coordination) are SEPARATE from website management. The board currently uses Google Workspace; a future path to other productivity suites via nonprofit grants exists. AI recommendations for board ops:

| Board Task | Current (Google) | Future (Nonprofit Productivity Suite) | AI Enhancement |
|------------|-----------------|------------------------|----------------|
| Meeting agendas | Google Docs | Docs/collaborative editor | AI summarizes past minutes, suggests agenda items |
| Minutes & motions | Google Docs | Docs/collaborative editor | AI drafts minutes from notes, flags action items |
| Board communications | Gmail | Email platform | AI drafts emails to community, CPS, City |
| Document sharing | Google Drive | Cloud storage/sharing | AI-indexed search across all board documents |
| Volunteer coordination | WhatsApp + Google Sheets | Chat + task management | AI-assisted volunteer matching, scheduling |
| Safety reporting | Manual compilation | Workflow automation | AI-summarized CPS data, trend detection |
| Event planning | Google Calendar | Outlook Calendar | AI-generated promotional content, scheduling optimization |

**Key principle:** Board ops tooling is a separate decision from website platform. Don't let the desire for "one platform" force a bad website decision. The website serves 20,000 residents; board ops serves 15-20 board members. Optimize each for its audience.

### AI Anti-Patterns

| Anti-Pattern | Why It's Wrong | What To Do Instead |
|---|---|---|
| **~~"Build an AI chatbot"~~** | ~~$50-100/month (violates P2), breaks when subscription lapses (violates P6), requires prompt engineering maintenance (violates P3)~~ | **UPDATE (May 2026):** Implemented at zero incremental cost using Azure OpenAI on the existing Azure subscription. Graceful degradation to static FAQ + search if AI is unavailable. Board-aware capabilities gated by authentication. See [AI Community Assistant](#ai-community-assistant-chatbot) guidance above. |
| **"Use AI to auto-generate content"** | Hallucination risk for safety-critical content (crime stats, emergency contacts), community trust issue | AI drafts, human reviews. Never auto-publish AI content without board member approval. |
| **"Choose the platform with the best AI features"** | AI features in managed platforms are vendor lock-in (violates P7) and add cost as features mature past free tiers (violates P2) | Choose the platform AI tools can WORK WITH (text-based, standard, open), not the one WITH AI built in. |
| **"AI replaces the need for documentation"** | AI tools are better with context; documentation makes AI MORE effective, not less | Document decisions (P8) — AI reads docs and gives better answers. Undocumented systems = bad AI output. |

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
| **"One platform for everything"** | Forces bad trade-offs — what's best for 20K residents (website) ≠ what's best for 20 board members (ops) | Decouple website from board ops. Optimize each for its audience. Connect via content, not platform. |
| **~~"Build an AI chatbot"~~** | ~~$50-100/month (violates P2), breaks when subscription lapses (violates P6), requires prompt engineering (violates P3)~~ | **Superseded.** Implemented at zero cost via Azure OpenAI. See [Applied Guidance](#ai-community-assistant-chatbot). |
| **"AI will handle it"** | AI-generated content without review = hallucination risk, especially for safety-critical info | AI drafts, humans approve. AI assists volunteers, doesn't replace governance. |
| **"Choose the platform with the best AI"** | AI features in managed platforms are vendor lock-in (P7) and add cost past free tiers (P2) | Choose the platform AI tools can WORK WITH (text-based, open), not the one WITH AI built in. |

---

## Principle Governance

- **Review cadence:** Annually at AGM, or when onboarding a new technical volunteer
- **Updates:** Any board member can propose changes via PR or discussion
- **Enforcement:** Use the Decision Framework checklist before adopting any new service or tool
- **Owner:** Safety Director (current technical lead) — transfers with the role

---

*These principles are not about what's technically optimal. They're about what survives the reality of volunteer organizations: turnover, time poverty, budget constraints, and variable technical skill. Every decision should be boring, resilient, and documented.*

*Aligned to: RRROCA Strategic Plan (2024-2028), Business Plan (2023-2028), and Integrated Technology Strategy (2024-28). Supersedes the technology recommendations in the old tech strategy where they conflict with these principles (specifically: WordPress/10Web/plugin recommendations replaced by static-first approach; AI chatbot deferred pending zero-cost implementation path).*
