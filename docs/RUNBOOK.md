# RRROCA Site — Operations Runbook & Resiliency Guide

> **Last updated:** May 2026
> **Primary maintainer:** Chad La Fournie (Safety & Technology Director)
> **Architecture:** Hugo static site → Azure Static Web Apps (Standard) → Azure Functions API

---

## Table of Contents

1. [⛔ Pre-Launch Gate: Subscription Migration](#-pre-launch-gate-subscription-migration)
2. [Architecture Overview](#architecture-overview)
3. [Component Inventory & Ownership](#component-inventory--ownership)
4. [Minimum Skill Requirements](#minimum-skill-requirements)
5. [Break-Glass: Emergency Recovery](#break-glass-emergency-recovery)
6. [Graceful Degradation Layers](#graceful-degradation-layers)
7. [Microsoft Nonprofit Program — Benefits & Risk Mitigation](#microsoft-nonprofit-program--benefits--risk-mitigation)
8. [Plan B: Self-Funded](#plan-b-self-funded-if-nonprofit-benefits-unavailable)
9. [How a Microsoft Employee Can Help](#how-a-microsoft-employee-can-help-without-being-the-customer)
10. [GitHub Copilot — Costs & Considerations](#github-copilot--costs--considerations)
11. [Transfer Checklist](#transfer-checklist)

---

## ⛔ Pre-Launch Gate: Subscription Migration

> **HARD REQUIREMENT: The RRROCA site MUST NOT go live on rrroca.org while hosted on Chad's Visual Studio Enterprise subscription.**

### Why This Is Non-Negotiable

The VS Enterprise subscription provides $150 USD/month in Azure credits for **individual development and testing only** — not production workloads. Running a live community website serving hundreds of residents on dev/test credits violates the subscription terms.

**As a Microsoft employee, the risk is amplified:**
- Internal compliance could flag it during an audit as misuse of employee benefits
- If an incident occurs (outage, data issue, community complaint), the subscription misuse becomes a liability
- Potential consequences: credits revoked (site goes offline), HR/compliance review, or being asked to reimburse costs
- Even if well-intentioned, it creates an appearance problem

### Current State (Acceptable)

The SWA is deployed to `zealous-wave-07c275a0f.7.azurestaticapps.net` — a staging/test URL. No DNS cutover to `rrroca.org` has occurred. **This is legitimately dev/test today.** There is time to fix this.

### Before DNS Cutover to rrroca.org

Complete **one** of these migration paths:

| Option | Cost | Who Owns It | Best If... |
|--------|------|------------|------------|
| **A: Nonprofit Azure grant** | $0 (if eligible) | RRROCA org | RRROCA qualifies for Microsoft nonprofit program |
| **B: RRROCA pay-as-you-go** | ~$250 CAD/year | RRROCA org | Board approves small tech budget |
| **C: Personal pay-as-you-go** | ~$250 CAD/year | Chad (personal) | Interim while evaluating A or B |

**Option A** is ideal (org-owned, free). **Option B** is the self-reliant path. **Option C** is a stopgap — it keeps costs on Chad but on a proper pay-as-you-go subscription, not dev/test credits.

### Migration Steps (same for all options)

```
1. Create new Azure subscription (pay-as-you-go or nonprofit grant)
2. Create new SWA resource in the new subscription
3. Configure SWA settings (custom auth, app settings, environment variables)
4. Update GitHub secret AZURE_STATIC_WEB_APPS_API_TOKEN to new SWA
5. Deploy via CI/CD to verify new SWA works
6. Configure custom domain (rrroca.org) on the new SWA
7. Delete old SWA resource from VS Enterprise subscription
```

### Gating the Board Motion

When presenting the SWA platform to the board for approval, the motion should include the subscription migration as a prerequisite to DNS cutover. The board should understand:
- The staging site (current URL) is for evaluation and testing
- Going live requires a production-appropriate Azure subscription
- The annual cost is ~$250 CAD (or $0 if nonprofit grant approved)
- This is a one-time migration, not an ongoing hassle

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Community Members                       │
│              rrroca.org  →  Azure SWA (Standard)             │
├──────────────────────────────────────────────────────────────┤
│  Static Content (Hugo)  │  Azure Functions API               │
│  - Community pages      │  - /api/chat (Azure OpenAI)        │
│  - Events & safety      │  - /api/motion (GitHub Issues)     │
│  - Business directory   │                                    │
│  - Board governance     │  Auth: Google OAuth via SWA        │
├──────────────────────────────────────────────────────────────┤
│  CI/CD: GitHub Actions  │  CMS: Sveltia CMS (/admin/)       │
│  - Build & test         │  - Direct-to-master commits       │
│  - Deploy to SWA        │  - Auth via Cloudflare Workers     │
│  - Board notifications  │                                    │
│  - Motion workflows     │                                    │
└──────────────────────────────────────────────────────────────┘
│                    Content stored in Git                      │
│                GitHub Org: RRROCA/rrroca-site                │
└──────────────────────────────────────────────────────────────┘
```

### What Each Layer Does

| Layer | Purpose | If it fails... |
|-------|---------|----------------|
| **Hugo static site** | Generates all HTML/CSS/JS from Markdown | Can rebuild anywhere in minutes |
| **Azure SWA** | Hosts the site, serves pages, routes API calls | Site goes offline (content safe in Git) |
| **Azure Functions** | AI chatbot + board motion workflow | Site works, advanced features break |
| **Google OAuth** | Board member authentication | Board features become read-only |
| **GitHub Actions** | Automated build, test, deploy, notifications | Manual deployment still possible |
| **Sveltia CMS** | Browser-based content editing at /admin/ | Edit Markdown in GitHub directly |
| **Git repository** | Source of truth for ALL content and code | Everything recoverable from here |

---

## Component Inventory & Ownership

### 🔴 Single-Person Dependencies (Chad's Personal Accounts)

| Component | Account | Monthly Cost | Risk |
|-----------|---------|-------------|------|
| Azure SWA (Standard tier) | VS Enterprise subscription (chadlafournie@outlook.com) | $9/mo (covered by $150/mo credits) | Sub cancellation = site offline |
| Azure OpenAI endpoint + key | Same Azure subscription | Usage-based (~$2-5/mo) | Chatbot AI stops working |
| Google OAuth app | Personal Gmail → Google Cloud Console | Free | Board auth breaks if account lost |
| Cloudflare Workers | chad752.workers.dev | Free tier | Sveltia CMS login breaks |
| SWA deploy token | GitHub repo secret (Chad manages) | Free | CI/CD stops deploying |
| GitHub Copilot CLI | Microsoft employee benefit | $0 (employee perk) | Development velocity drops |

### 🟢 Organization-Owned (Resilient)

| Component | Owner | Notes |
|-----------|-------|-------|
| GitHub Org (RRROCA) | RRROCA board | Contains all code + content |
| rrroca.org domain | RRROCA | DNS registration owned by org |
| Google Workspace | RRROCA | @rrroca.org email for board members |
| Site content (Markdown) | Git repository | Survives any infrastructure failure |
| Hugo theme + templates | Git repository | No external dependency |

---

## Minimum Skill Requirements

### Tier 1: Keep the Lights On (Content Maintainer)

**Who:** Any board member with basic computer skills
**Skills needed:** Web browser, basic typing
**Can do:**
- Edit content via Sveltia CMS (/admin/ — browser-based, no code)
- Approve auto-merge content PRs
- View site analytics

**Cannot do:** Fix broken builds, update infrastructure, change site design

### Tier 2: Basic Troubleshooting (Technical Volunteer)

**Who:** Someone comfortable with web technology basics
**Skills needed:**
- Git basics (clone, commit, push)
- Markdown syntax
- Comfort reading GitHub Actions logs
- Basic Azure Portal navigation

**Can do:**
- Re-run failed CI/CD workflows
- Make simple template changes
- Manage Azure SWA settings in portal
- Rotate secrets/API keys

**Time to train:** 2–4 hours with documentation

### Tier 3: Full Site Development (Developer)

**Who:** A web developer (intermediate level)
**Skills needed:**
- Hugo static site generator
- JavaScript/Node.js (intermediate — for API functions)
- GitHub Actions CI/CD (8 workflows)
- Azure Portal (SWA, app settings, billing)
- Google Cloud Console (OAuth app management)
- DNS management
- CSS/responsive design
- Security awareness (CSP, CORS, XSS, rate limiting)

**Can do:** Everything — feature development, infrastructure changes, security updates

**Time to train:** 8–16 hours (assumes existing web dev experience)

### Current State vs Ideal

The current architecture requires **Tier 3** for any meaningful changes. Content-only work can be done at **Tier 1** via Sveltia CMS. The gap between Tier 1 and Tier 3 is where resiliency risk lives — if something breaks and there's no Tier 3 person available, the community relies on the break-glass procedure below.

---

## Break-Glass: Emergency Recovery

### Scenario: Site is offline and Chad is unavailable

**Total time to recover:** ~30 minutes
**Skill level needed:** Tier 2 (basic Git + web knowledge)
**Cost:** $0

#### Step 1: Verify the site is down (1 minute)

Visit `https://rrroca.org` — if it doesn't load, the Azure SWA is likely offline.

#### Step 2: Clone the repository (2 minutes)

```bash
git clone https://github.com/RRROCA/rrroca-site.git
cd rrroca-site
```

#### Step 3: Install Hugo (5 minutes)

Download Hugo Extended from https://gohugo.io/installation/

```bash
# macOS
brew install hugo

# Windows (winget)
winget install Hugo.Hugo.Extended

# Linux (snap)
snap install hugo
```

#### Step 4: Build the site (1 minute)

```bash
hugo --gc --minify
```

This generates the complete static site in the `public/` folder.

#### Step 5: Deploy to a free static host (10–15 minutes)

**Option A: Netlify (recommended for simplicity)**
1. Go to https://app.netlify.com/drop
2. Drag and drop the `public/` folder
3. Site is live immediately at a `.netlify.app` URL
4. Optionally configure `rrroca.org` DNS to point here

**Option B: Cloudflare Pages**
1. Go to https://dash.cloudflare.com → Pages
2. Create new project → Upload assets → upload `public/` folder
3. Site is live at a `.pages.dev` URL

**Option C: Vercel**
1. Go to https://vercel.com/new
2. Import the GitHub repo
3. Framework preset: Hugo
4. Deploy

#### Step 6: Update DNS (5 minutes, if needed)

Point `rrroca.org` DNS records to the new host. The specific records depend on which host you chose (CNAME or A records — each host provides instructions).

### What You Lose in Break-Glass Mode

| Feature | Status | Impact |
|---------|--------|--------|
| All community content | ✅ Fully working | None — HTML is static |
| Page navigation & search | ✅ Fully working | None |
| Events, safety, directory | ✅ Fully working | None |
| AI chatbot | ❌ Falls back to keyword matching | Reduced but functional |
| Board member login | ❌ Not available | Board features read-only |
| Motion propose/vote | ❌ Not available | Use email/meeting instead |
| Board notifications | ❌ Not available | Use email instead |
| Sveltia CMS | ⚠️ May work if Cloudflare Worker is still up | Edit Markdown in GitHub |

**Key insight:** 100% of community-facing content survives. Only board governance features (which require authentication) are lost.

---

## Graceful Degradation Layers

The architecture is designed to degrade gracefully, losing features in order of least to most impact:

```
Layer 1 (loses AI):     Azure OpenAI key expires
                        → Chatbot falls back to keyword matching
                        → All other features work normally

Layer 2 (loses auth):   Google OAuth app lost
                        → Board login breaks
                        → Motion workflow becomes read-only
                        → Community content fully accessible

Layer 3 (loses deploy): SWA deploy token or CI/CD breaks
                        → Site continues running (last good deploy)
                        → Manual deploy possible via Azure Portal

Layer 4 (loses hosting): Azure subscription lapses
                         → Site goes offline
                         → Break-glass: redeploy static site elsewhere ($0)
                         → Community content fully recoverable from Git

Layer 5 (nuclear):       GitHub org deleted
                         → All source lost (extremely unlikely)
                         → Any clone of the repo has full recovery capability
```

---

## Microsoft Nonprofit Program — Benefits & Risk Mitigation

### RRROCA's Legal Status

RRROCA is a **Canadian nonprofit society** incorporated under the Alberta Societies Act. It is **not a registered charity** with the Canada Revenue Agency (CRA) — it does not have CRA charitable registration number or issue tax receipts. This is an important distinction for eligibility.

### Eligibility — Honest Assessment

Microsoft's nonprofit eligibility requires organizations to hold "recognized legal status in their respective country (equal to 501(c)(3) status under the United States Internal Revenue Code)." For Canada, Microsoft's country-specific requirements (https://aka.ms/eligibility-requirements) define which legal statuses qualify.

**The question:** Does Alberta Societies Act incorporation qualify, or does Microsoft require CRA-registered charity status?

- **In favour:** RRROCA has recognized legal nonprofit status in Alberta. Its mission clearly benefits the local community (safety, community engagement, neighbourhood governance). Microsoft's eligibility page explicitly includes missions that "benefit the local community" and "advance social welfare."
- **Against:** Some Microsoft nonprofit programs in Canada historically required CRA charitable registration. A community association that primarily serves its own members (vs. the general public) may face scrutiny.
- **Bottom line:** The only way to know is to apply. Registration is free. If rejected, RRROCA loses nothing. If accepted, it's transformative.

Register at: https://nonprofit.microsoft.com/register
Required: An employee or strategic volunteer (i.e., a board director) must register — not a third party.

### Available Benefits (If Eligible)

#### 1. Azure Grant — $2,000 USD (~$2,740 CAD)/year in Azure Credits (FREE)

**This is the single most impactful risk mitigation available.**

| Current State | With Nonprofit Azure Grant |
|--------------|---------------------------|
| SWA runs on Chad's personal VS Enterprise subscription | SWA runs on RRROCA org-owned Azure subscription |
| If Chad cancels sub, site goes offline | Org controls its own subscription |
| Azure OpenAI costs come from personal credits | Covered by nonprofit grant |
| Bus factor = 1 for hosting | Bus factor = any authorized board member |

**Cost math:**
- SWA Standard: ~$9 USD/month = ~$108 USD/year (~$148 CAD)
- Azure OpenAI (estimated chat usage): ~$30–60 USD/year (~$41–82 CAD)
- **Total Azure costs: ~$140–170 USD/year, well within the $2,000 USD grant**
- Surplus grant credits (~$1,800 USD) could fund future Azure services (e.g., Azure Communication Services for board notifications, Azure CDN, monitoring)

**What this changes:** The #1 resiliency risk (site hosted on personal subscription) is **completely eliminated**. The Azure subscription becomes org-owned, with multiple board members as administrators.

#### 2. Microsoft 365 Business Premium — 75% Discount

| Plan | Retail | Nonprofit Price | Notes |
|------|--------|----------------|-------|
| M365 Business Premium | ~$22 USD/user/month | **~$5.50 USD/user/month** | Includes Teams, SharePoint, Outlook, OneDrive, Entra ID, Intune, security |

**For RRROCA (7 board directors):** ~$38.50 USD/month (~$53 CAD/month, ~$636 CAD/year)

**Who can use these licenses:**
- ✅ Board directors (unpaid executive staff) — eligible for **grant** licenses (free)
- ✅ Paid employees (if any) — eligible for grant licenses
- ✅ Volunteers — eligible for **discounted** licenses only
- ❌ Community members / general membership — NOT eligible

**Note:** Microsoft grants up to 10 free M365 Business Premium licenses to eligible nonprofits for paid staff and unpaid executive staff. RRROCA's 7 board directors would likely qualify for **free** licenses, not just discounted ones. This would make the cost **$0/month** for board directors.

**Benefits beyond collaboration:**
- **Entra ID** for board members — could replace Google OAuth for board auth, eliminating the personal Gmail OAuth dependency
- **SharePoint** for document management (currently Google Drive)
- **Teams** for board communications (currently Google Meet/Chat)
- **Intune** for device security
- **Enterprise-grade security** included
- **Unified identity** — one @rrroca.org identity for everything (if custom domain configured)

**Migration consideration:** This would involve moving board collaboration from Google Workspace to M365. It's a significant change that requires board buy-in and training. However, it adds resilience (org-owned identity provider, eliminates personal OAuth dependency) and simplifies the architecture.

**Important:** Moving to M365 does NOT require abandoning Google Workspace immediately. Both can run in parallel during transition.

#### 3. Microsoft 365 Copilot — $25.50 USD/user/month (15% Discount)

Available as an add-on to M365 licenses. This is the AI assistant for Word, Excel, Teams, Outlook, etc. — **not** GitHub Copilot. Potentially useful for board productivity (meeting summaries, document drafting) but not essential for site management. At ~$175 USD/month for 7 users, this is likely not worth the cost for a CA board unless it genuinely transforms their workflow.

### What This Doesn't Cover

- **GitHub Copilot CLI** — This is a GitHub product, separate from Microsoft nonprofit offers. See next section.
- **Custom domain SSL** — Already included free with Azure SWA.
- **Cloudflare Workers** — Would need separate solution (or replace Sveltia CMS auth with Entra ID if M365 adopted).
- **Google Workspace** — Would still need to be maintained if not migrating to M365, or shut down if migrating.

### Recommendation: Apply, But Plan for "No"

**Apply anyway — it's free and takes 30 minutes.** But be realistic: RRROCA is an Alberta Societies Act nonprofit (community association), not a CRA-registered charity. Microsoft's eligibility benchmarks against US 501(c)(3) charitable status, and community associations in the US are typically 501(c)(4) or 501(c)(7) — excluded categories. RRROCA primarily serves its own members, which is an association model, not a charitable model.

**In RRROCA's favour:** recognized legal nonprofit status, volunteer-run, genuine community safety mission, not generating profit. Microsoft's Canada-specific requirements *might* be broader than the US benchmark.

**Bottom line:** Apply, but build the budget and architecture assuming the answer is no.

#### If Approved: Suggested Sequence

```
Phase 1 (NOW):     Register RRROCA at nonprofit.microsoft.com
                   Provide Alberta Societies Act incorporation docs
                   → If approved:
                       Create RRROCA org-owned Azure subscription
                       Migrate SWA from Chad's personal sub → org sub
                       Add 2+ board members as Azure subscription admins
                       → Eliminates #1 bus factor risk

Phase 2 (LATER):   Evaluate M365 nonprofit grant/discount
                   Board decision: keep Google Workspace or migrate to M365
                   If migrate: Entra ID replaces Google OAuth
                   → Eliminates #2 bus factor risk (personal Gmail OAuth app)

Phase 3 (FUTURE):  If M365 adopted, evaluate Entra ID for Sveltia CMS auth
                   → Eliminates #3 bus factor risk (Cloudflare Workers)
                   Consider M365 Copilot for board productivity (only if ROI clear)
```

### Plan B: Self-Funded (If Nonprofit Benefits Unavailable)

If RRROCA doesn't qualify for Microsoft nonprofit benefits, the costs are still very manageable for a community association budget.

#### Annual Cost Breakdown

| Component | USD/year | CAD/year (approx) | Notes |
|-----------|---------|-------------------|-------|
| Azure SWA Standard | $108 | $148 | Hosting + Azure Functions |
| Azure OpenAI | ~$30–60 | ~$41–82 | Chat API usage (low volume) |
| Google Workspace | $0 | $0 | Already exists, org-owned |
| GitHub (Free plan) | $0 | $0 | Already exists, org-owned |
| Domain renewal (rrroca.org) | ~$15 | ~$20 | Already budgeted |
| **Total** | **~$153–183** | **~$209–250** | |

#### Optional Add-Ons

| Component | USD/year | CAD/year (approx) | Notes |
|-----------|---------|-------------------|-------|
| GitHub Copilot Pro (1 seat) | $120 | $164 | For site maintainer, if desired |
| Cloudflare Workers (paid) | $0 | $0 | Free tier sufficient |
| **Total with Copilot** | **~$273–303** | **~$373–414** | |

**Context:** RRROCA's annual budget likely handles community events, insurance, hall maintenance, etc. An additional ~$250 CAD/year for the entire technology platform is extremely modest. Many CAs spend more on a single newsletter mailing.

#### Self-Funded Migration Path

Even without nonprofit benefits, the key resiliency improvement remains the same: **move Azure off Chad's personal subscription.**

```
Step 1:  Board approves ~$250 CAD/year technology budget line
Step 2:  Create a new Azure subscription under RRROCA
         - Use a shared board email (e.g., technology@rrroca.org) as account owner
         - Add 2+ board members as subscription admins
         - Set up pay-as-you-go with a board-authorized credit card or association bank account
Step 3:  Migrate SWA from Chad's personal sub → RRROCA org sub
         - Export/import SWA configuration
         - Update GitHub secret (SWA deploy token) to new subscription
         - Update Azure OpenAI endpoint to new subscription
Step 4:  Chad remains as technical contributor, no longer single point of failure for hosting
```

### How a Microsoft Employee Can Help (Without Being the Customer)

Chad is a Microsoft employee volunteering for RRROCA. This creates both advantages and boundaries:

#### What You CAN Do

1. **Nonprofit registration guidance** — Help RRROCA navigate the nonprofit.microsoft.com registration process. You know the system; a board member must submit, but you can guide them through it.

2. **Internal warm introduction** — Connect RRROCA (via the board president or another director) with your local Microsoft Philanthropies or Nonprofits team. An internal referral carries weight and can clarify eligibility questions before formal application.

3. **Tech for Social Impact team** — Microsoft's [Tech for Social Impact](https://www.microsoft.com/en-us/nonprofits) organization manages the nonprofit program. As an employee, you can find the right contact on the internal directory and facilitate an introduction. They can advise on whether Alberta Societies Act status qualifies before RRROCA applies.

4. **Azure architecture guidance** — You can help design the Azure subscription structure, recommend SKUs, and provide technical best practices. This is volunteering your expertise, not a customer engagement.

5. **Microsoft Nonprofit AI Advisors** — Microsoft's employee giving platform accepts volunteer opportunities from nonprofits. RRROCA could submit a request for skilled AI/cloud volunteers, and Microsoft employees (including you, or others) could engage through official channels. This makes the relationship formal and above-board.

6. **GitHub for Nonprofits application** — Similarly, you can guide RRROCA through the GitHub nonprofit application at https://support.github.com/contact/nonprofit.

#### What You Should NOT Do

- **Don't register on RRROCA's behalf** — The registration must be done by "an employee or strategic volunteer of the nonprofit." As a board director, you technically qualify, but having a non-Microsoft-employee board member register avoids any appearance of conflict.
- **Don't use your Microsoft credentials/subscription as the permanent solution** — That's the current problem. The goal is org-owned infrastructure.
- **Don't position this as a Microsoft engagement** — RRROCA is not a Microsoft customer. You're a volunteer who happens to work at Microsoft.
- **Don't commit Microsoft resources** — Any support from Microsoft Philanthropies or the nonprofit team should come through their official programs, not as a personal favour.

#### Recommended Approach

```
1. Pre-qualify:    Find the Tech for Social Impact / Nonprofit team internally
                  Ask: "Does an Alberta Societies Act nonprofit qualify?"
                  → This avoids a wasted application and sets expectations

2. If yes:        Have another board director register at nonprofit.microsoft.com
                  You provide technical guidance on Azure subscription setup
                  Migrate SWA to the new org-owned subscription

3. If no:         Proceed with Plan B (self-funded, ~$250 CAD/year)
                  Still move Azure to an org-owned subscription
                  Consider whether CRA charitable registration is worth pursuing
                  (separate discussion — has implications beyond Microsoft benefits)
```

### Risks and Considerations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RRROCA doesn't qualify (Societies Act ≠ CRA charity) | Medium | No benefits; status quo continues | Apply and find out ($0 cost); consider CRA registration path |
| Azure grant doesn't renew in future years | Low | Must find alternative funding (~$170 USD/year) | Grant has existed for years; costs are minimal even without it |
| M365 migration disrupts board workflows | Medium | Productivity dip during transition | Phase 2 is optional; run parallel with Google Workspace |
| Board members need Azure Portal training | Low | Minor — most management is hands-off | This runbook + 1-hour walkthrough |
| Microsoft changes nonprofit terms | Low | Could lose benefits | Site architecture degrades gracefully (see above) |

### Beyond Azure: Other Microsoft Benefits Worth Exploring

If RRROCA qualifies, other potentially valuable benefits:

- **Security Program for Nonprofits** — free cyberthreat monitoring and risk assessment
- **Microsoft Elevate for Changemakers** — AI training and credentials for board members
- **FastTrack for Microsoft 365** — free deployment guidance if migrating to M365
- **Volunteer Use Benefit** — for each M365 E3/E5 license, get up to 5 additional F3 licenses for volunteers (if RRROCA ever has volunteer programs needing M365)

---

## GitHub Copilot — Costs & Considerations

### What is GitHub Copilot CLI?

GitHub Copilot CLI is the tool being used to build and maintain this site. It's an AI-powered development assistant that runs in the terminal — the tool generating this document right now. It is a **GitHub** product (not Microsoft 365), with its own licensing.

### Current Cost: $0

Chad uses it through his Microsoft employee benefits. It's not a cost to RRROCA.

### If RRROCA Wanted Its Own License

| Plan | Cost (USD) | Cost (CAD approx) | Notes |
|------|-----------|-------------------|-------|
| **Copilot Free** | $0/month | $0 | Limited features, limited requests. Enough for basic read/explore tasks. |
| **Copilot Pro** | $10/month | ~$14/month | Unlimited completions, premium models. *New signups paused as of April 2026.* |
| **Copilot Pro+** | $39/month | ~$53/month | All models, highest request limits. *New signups paused as of April 2026.* |
| **Copilot Business** | Per-seat (contact sales) | — | Org-level management. *Self-serve paused on Free/Team plans.* |

**Note:** GitHub signups for paid Copilot plans were paused in April 2026. This may be temporary. Check https://github.com/features/copilot for current availability.

### GitHub for Nonprofits

GitHub offers free/discounted plans for verified nonprofits. Apply at https://support.github.com/contact/nonprofit. Benefits may include:
- Free GitHub Team plan features (protected branches, code owners, draft PRs)
- 3,000 GitHub Actions minutes/month (vs 2,000 on free plan)
- Potentially discounted Copilot Business seats

**This is separate from the Microsoft nonprofit program** — GitHub has its own nonprofit application process. Worth applying for alongside the Microsoft nonprofit registration.

### Is Copilot CLI Essential for RRROCA?

**No.** The site is a standard Hugo + GitHub Actions + Azure Functions stack. Any developer can maintain it with conventional tools (VS Code, terminal, Git). Copilot CLI is a **force multiplier** — it makes Chad ~10x more productive — but the site doesn't depend on it running.

**However:** The complexity of the codebase (8 GitHub Actions workflows, 2 API endpoints with rate limiting/injection protection, custom OAuth flow, CSP headers) means the *effective* skillset needed without Copilot CLI is **senior full-stack developer** — well beyond typical community association volunteer capacity.

### Should RRROCA Budget for Copilot?

**Not now.** The free tier is adequate for basic maintenance tasks. If a future maintainer wants the full development experience, $10 USD/month (~$14 CAD) is reasonable. The real question is whether the successor has the developer skills to benefit from it — if they're Tier 2 (basic troubleshooting), Copilot won't help much. If they're Tier 3 (developer), it's transformative.

---

## Transfer Checklist

If the primary maintainer changes, complete these steps:

### Immediate (Day 1)

- [ ] Add new maintainer as **Owner** on GitHub RRROCA org
- [ ] Add new maintainer as **Contributor** on Azure SWA resource
- [ ] Share Azure Portal access (subscription admin)
- [ ] Share SWA deployment token (or regenerate + update GitHub secret)
- [ ] Walk through this runbook (1 hour)

### Short-Term (Week 1)

- [ ] Transfer or share Google Cloud Console access (OAuth app)
- [ ] Transfer or share Cloudflare Workers access (Sveltia CMS auth)
- [ ] Verify new maintainer can trigger CI/CD (push to master or manual workflow)
- [ ] Verify new maintainer can access Azure OpenAI settings
- [ ] Verify new maintainer can edit content via Sveltia CMS

### If Migrated to Nonprofit Azure Subscription

- [ ] Ensure 2+ board members are Azure subscription admins
- [ ] Document Azure OpenAI endpoint and deployment name
- [ ] Ensure SWA deployment token is in GitHub secrets (org-level, not personal)
- [ ] Verify Azure grant is renewed annually

### If Migrated to M365 / Entra ID

- [ ] Board members authenticate via Entra ID (replaces Google OAuth)
- [ ] Sveltia CMS auth uses Entra ID (replaces Cloudflare Workers)
- [ ] SWA custom auth config updated for Entra ID provider
- [ ] Google Workspace can be decommissioned or kept as backup

---

## Architecture Decision Records

### ADR-001: Azure SWA over GitHub Pages

**Decision:** Moved from GitHub Pages to Azure Static Web Apps (Standard tier).
**Rationale:** GitHub Pages cannot run server-side functions (needed for AI chatbot and board auth). SWA provides Azure Functions integration, custom OAuth, and server-side security headers.
**Trade-off:** $9/month cost, infrastructure complexity, personal subscription dependency.
**Mitigation:** Nonprofit Azure grant eliminates cost; org-owned subscription eliminates personal dependency.

### ADR-002: Google OAuth over Azure AD (Entra ID)

**Decision:** Used Google OAuth for board member authentication.
**Rationale:** Board members already have @rrroca.org Google Workspace accounts. Entra ID would require M365 licenses. Google OAuth was the path of least resistance.
**Trade-off:** OAuth app on personal Gmail account (bus factor risk). SWA Free tier doesn't support custom OAuth (forced Standard upgrade).
**Future:** If RRROCA adopts M365 nonprofit, Entra ID replaces Google OAuth — eliminating the personal Gmail dependency.

### ADR-003: Hugo + Git over Traditional CMS

**Decision:** Static site generator (Hugo) with content in Git, not WordPress/Wix/Squarespace.
**Rationale:** Zero-cost content hosting, version history for all changes, no database to maintain, extreme portability (can deploy anywhere), and Sveltia CMS provides a GUI for non-technical editors.
**Trade-off:** Higher initial complexity; requires developer for structural changes.
**Validation:** This decision ages well — content survives any infrastructure failure.

---

*This document should be reviewed and updated whenever the architecture changes or maintainer responsibilities shift.*
