# RRROCA Platform Strategy — L64 ATS Evaluation

## Executive Summary

**Recommendation: Hugo + GitHub Pages + Decap CMS + Microsoft 365 Nonprofit**

This hybrid approach delivers the best of all worlds: a bulletproof, zero-cost website with a visual CMS for non-technical contributors, plus Microsoft 365 Business Basic (free, 300 seats) for everything else the CA needs — email, Teams, SharePoint, OneDrive.

---

## Option Comparison

### Option A: Hugo + GitHub Pages (Current Path)
| Dimension | Assessment |
|-----------|-----------|
| **Cost** | $0/year (GitHub Pages free for public repos) |
| **Security** | ★★★★★ — No server, no database, no PHP, no plugins to patch. Attack surface is essentially zero. WordPress is the #1 hacked CMS globally. |
| **Performance** | ★★★★★ — Static files served from GitHub's CDN. Sub-second page loads. |
| **Collaboration** | ★★★☆☆ — Requires GitHub + Decap CMS setup for non-technical editors |
| **Maintenance** | ★★★★★ — Zero server maintenance. No WordPress updates, no plugin conflicts. |
| **Customization** | ★★★★★ — Full control over design, no theme/plugin limitations |
| **ATS Synergy** | ★★★★★ — Demonstrates GitHub Pages, Hugo, CI/CD, Copilot CLI — all Microsoft products |

### Option B: 10Web (WordPress Managed Hosting)
| Dimension | Assessment |
|-----------|-----------|
| **Cost** | ~$84-120/year ($7-10/mo with nonprofit discount) |
| **Security** | ★★★☆☆ — Better than self-hosted WP, but still WordPress with plugins, PHP, and database attack vectors. 10Web adds WAF/firewall. |
| **Performance** | ★★★★☆ — Google Cloud + Cloudflare CDN, but still dynamic PHP rendering |
| **Collaboration** | ★★★★★ — WordPress admin is familiar to most people, drag-and-drop editing |
| **Maintenance** | ★★★★☆ — 10Web manages updates, but you still deal with plugin conflicts |
| **Customization** | ★★★☆☆ — Constrained by WordPress themes/plugins ecosystem |
| **ATS Synergy** | ★☆☆☆☆ — No Microsoft ecosystem connection |

### Option C: Microsoft 365 + SharePoint Site (Full Microsoft)
| Dimension | Assessment |
|-----------|-----------|
| **Cost** | $0/year (M365 Business Basic nonprofit grant, up to 300 users) |
| **Security** | ★★★★☆ — Enterprise-grade Microsoft security, but public SharePoint sites have limitations |
| **Performance** | ★★★☆☆ — SharePoint public sites are slower than static hosting |
| **Collaboration** | ★★★★★ — Native Teams/SharePoint integration, familiar to Microsoft users |
| **Maintenance** | ★★★★★ — Fully managed by Microsoft |
| **Customization** | ★★☆☆☆ — SharePoint Communication Sites are limited in design flexibility |
| **ATS Synergy** | ★★★★★ — Full Microsoft ecosystem showcase |

---

## RRROCA's Legal Status — Important Clarification

RRROCA is a **nonprofit community association** incorporated under the **Alberta Societies Act** — but it is **NOT a registered charity** with the CRA. This distinction matters:

| Program | Requires Charity Status? | RRROCA Eligible? |
|---------|------------------------|-----------------|
| **TechSoup Canada** | ❌ No — accepts incorporated nonprofits | ✅ Yes — register as "Incorporated Nonprofit" with Alberta Certificate of Incorporation |
| **Microsoft 365 Nonprofit** | ❌ No — requires TechSoup validation only | ✅ Yes — once TechSoup verified |
| **GitHub for Nonprofits** | ❌ No — accepts equivalent nonprofit status | ✅ Likely — submit incorporation docs |
| **Google Workspace Nonprofit** | ⚠️ Varies — often requires charity number | ❓ Check eligibility |

**Action:** Register at techsoupcanada.ca with RRROCA's Alberta Society Certificate of Incorporation. No CRA charity number needed.

---

## Recommended Hybrid Strategy

### Phase 1: Website (Now)
**Hugo + GitHub Pages + Decap CMS**
- Website stays on Hugo/GH Pages (free, secure, fast, already built)
- Add Decap CMS at `/admin/` for non-technical CA board members to edit content
- Decap provides a WordPress-like visual editor that commits directly to GitHub
- No code knowledge needed — editors see forms for title, date, body (markdown)
- Auth via GitHub OAuth (editors need free GitHub accounts)

### Phase 2: CA Operations (Next 3 months)
**Microsoft 365 Business Basic (Free Nonprofit Grant)**
- Register RRROCA at techsoupcanada.ca (submit Alberta Society incorporation docs — NO charity number needed)
- Get TechSoup Validation Token → apply at nonprofit.microsoft.com
- Get M365 Business Basic for up to 300 users — FREE
- Includes: Exchange email (@rrroca.org), Teams, SharePoint, OneDrive (1TB/user)
- Board members get professional email, shared documents, Teams channels

### Phase 3: Integration (6 months)
- SharePoint for internal docs (meeting minutes, bylaws, financial reports)
- Teams for board communication and committee coordination
- Power Automate for form processing (contact form → Teams notification)
- GitHub for Nonprofits — free Team plan for private repos and collaboration

---

## 🔑 Resiliency Analysis — "What If Chad Leaves?"

This is the most important strategic consideration. A volunteer organization must survive board turnover. Every technical choice must be evaluated through this lens: **can the next Safety Director (or any board member) maintain this without Chad's Microsoft access or technical expertise?**

### Scenario Matrix

| Scenario | Hugo + GH Pages | 10Web (WordPress) | SharePoint Site |
|----------|-----------------|-------------------|-----------------|
| **Chad leaves the board** | ✅ Site runs forever with zero maintenance. Decap CMS lets any board member edit. GitHub repo is owned by RRROCA org, not Chad. | ✅ WordPress admin panel is familiar. But someone must handle updates, plugin conflicts, security patches. | ✅ If M365 tenant is RRROCA's (not Chad's personal), new admin takes over. |
| **Chad leaves Microsoft** | ✅ Zero impact — GitHub Pages, Hugo, and Decap CMS are not Microsoft products. Nothing depends on Chad's MSFT credentials. | ✅ Zero impact — 10Web is independent of Microsoft. | ⚠️ Medium risk — M365 nonprofit grant is independent of Chad's employment, BUT if Chad set it up under his personal MSFT account, admin transfer is needed. Mitigate by ensuring RRROCA has its own tenant admin. |
| **No technical board members** | ⚠️ Content editing is easy (Decap CMS). Theme/layout changes need a developer — but the site can run for years without any. Worst case: hire a freelancer for $200 to make changes. | ✅ WordPress has massive freelancer pool. But ongoing maintenance burden means you NEED someone technical, or pay 10Web to handle it. | ✅ SharePoint is low-maintenance. But design limitations mean you're stuck with what you have. |
| **Budget goes to zero** | ✅ $0/year forever — GitHub Pages is free for public repos. Domain renewal (~$15/yr) is the only cost. | ❌ $84-120/year for 10Web hosting. If you stop paying, site goes offline. | ✅ M365 nonprofit grant is free. But if RRROCA loses nonprofit status or Microsoft changes the program, there's risk. |
| **Technology becomes obsolete** | ⚠️ Hugo is actively maintained (Go foundation). Static HTML never becomes obsolete — it's the most future-proof format possible. Worst case: switch to another static site generator with same content files. | ⚠️ WordPress is huge but declining. PHP ecosystem aging. Plugin ecosystem is a constant maintenance burden. | ⚠️ SharePoint evolves on Microsoft's roadmap, not yours. Features can be deprecated. |
| **GitHub goes down/changes pricing** | ⚠️ Low risk (Microsoft-owned, widely used). Fallback: deploy same Hugo output to Netlify, Cloudflare Pages, or any static host in <1 hour. Content is portable markdown files. | ❌ Locked to 10Web. Migration requires WordPress export + new hosting setup. | ⚠️ Locked to M365. Migration requires rebuilding. |

### Resiliency Verdict

**Hugo + GitHub Pages is the MOST resilient option** because:

1. **Zero ongoing cost** = can't be killed by budget cuts
2. **Zero server maintenance** = can't be killed by neglect
3. **Portable content** = Markdown files work with any static site generator
4. **No vendor lock-in** = can deploy to Netlify, Cloudflare, Vercel, or any web host
5. **Git history** = complete audit trail, any change can be rolled back
6. **Static HTML output** = the most future-proof format in computing

**10Web is the LEAST resilient** because it requires ongoing payment AND ongoing maintenance. If the board forgets to renew, the site disappears.

### Recommended Resiliency Measures

To make the Hugo setup bulletproof for board turnover:

#### 1. GitHub Organization (not personal account)
- Create a `rrroca` GitHub organization
- Transfer the repo from `CanChad/rrroca-site` to `rrroca/rrroca.org`
- Add 2-3 board members as org owners (redundant admin access)
- Chad's personal account is a member, not the sole owner

#### 2. Documentation (keep in repo AND Teams/SharePoint)
Create `docs/` folder in the repo with:
- `OPERATIONS.md` — How to edit content, publish posts, manage the site
- `ARCHITECTURE.md` — How the site works (Hugo, GH Pages, Decap CMS)
- `EMERGENCY.md` — What to do if the site breaks, who to contact
- `ACCOUNTS.md` — What accounts exist, who has access (domain registrar, GitHub org, Formspree, etc.)

Also keep copies in RRROCA's Teams/SharePoint (once M365 is set up) so non-GitHub board members can find them.

#### 3. Domain Registrar Access
- Ensure 2+ board members have access to the domain registrar (whoever controls rrroca.org DNS)
- Document the registrar login in ACCOUNTS.md (without passwords — use a shared password manager or Teams vault)

#### 4. Decap CMS Configuration
- Configure Decap CMS with RRROCA's GitHub org OAuth app (not Chad's personal one)
- Multiple board members should be GitHub org owners so they can manage OAuth if needed

#### 5. Annual "Bus Factor" Audit
- At each AGM, verify: Can someone other than Chad publish a news post? Edit a page? Add a board member to GitHub?
- If the answer is ever "no," fix it before it becomes a crisis

### Minimum Viable Handoff Document

If Chad left tomorrow, the next person needs to know:

```
RRROCA Website Quick Reference
===============================
Website URL: https://rrroca.org
Hosting: GitHub Pages (free, automatic)
Content editing: Go to rrroca.org/admin → sign in with GitHub
Source code: github.com/rrroca/rrroca.org

To post news: Admin → News → New → Write → Publish
To edit a page: Admin → Pages → Select → Edit → Publish
To add a board member: GitHub org → Settings → Members → Invite

If the site breaks: It's static HTML — it basically can't break.
If you need design changes: Hire any web developer familiar with Hugo (~$50-100/hr).
If you need to move hosting: Hugo builds plain HTML files. Upload them anywhere.

Domain: rrroca.org — managed at [registrar name]
GitHub org owners: [names]
Formspree account: [email]
```

1. **Cost for no gain**: $84-120/year for WordPress when Hugo/GH Pages is free and already superior
2. **Security regression**: Moving back to WordPress undoes the biggest win of this migration
3. **No Microsoft synergy**: 10Web doesn't connect to Teams, SharePoint, or any Microsoft ecosystem
4. **Collaboration is solvable**: Decap CMS provides the same "edit in browser" experience that 10Web would
5. **Vendor lock-in**: WordPress → 10Web is a hosting dependency; Hugo → GitHub is portable
6. **Worst resiliency**: The only option that dies if you stop paying. Hugo runs forever at $0. (See Resiliency Analysis above)

## Why NOT Full SharePoint for the Website

1. **Design limitations**: SharePoint Communication Sites can't match the custom UX we've built
2. **URL structure**: SharePoint URLs are ugly and long
3. **SEO**: Hugo generates clean, optimized HTML that ranks better
4. **Performance**: Static sites are faster than SharePoint rendered pages

## Why Hugo + M365 is the Best of Both Worlds

| Need | Solution |
|------|----------|
| Beautiful public website | Hugo + GitHub Pages |
| Non-technical content editing | Decap CMS (browser-based, no code) |
| Board email | M365 Exchange (@rrroca.org) |
| Board communication | Microsoft Teams |
| Document collaboration | SharePoint + OneDrive |
| Meeting scheduling | Outlook + Teams Calendar |
| Form processing | Power Automate → Teams |
| Cost | $0/year total |

---

## Decap CMS Setup for Collaboration

To make the site editable by non-technical CA members:

1. **What editors see**: A browser-based admin panel at `yoursite.com/admin/`
2. **How it works**: Visual forms → Markdown → Git commit → GitHub Pages auto-deploys
3. **What they can edit**: News posts, events, safety updates, business directory entries
4. **Auth**: GitHub OAuth (each editor needs a free GitHub account)
5. **Time to set up**: ~2 hours

### Editor Experience
- Log in at `/admin/` with GitHub
- See list of content types (News, Events, Safety, etc.)
- Click "New" → fill in title, date, body (rich text editor)
- Click "Publish" → site rebuilds automatically in ~60 seconds
- No terminal, no code, no Git knowledge required

---

## Action Items

1. ☐ Register RRROCA at techsoup.ca for Microsoft nonprofit verification
2. ☐ Apply for M365 Business Basic grant (300 free seats)
3. ☐ Set up Decap CMS on the Hugo site (2 hours)
4. ☐ Create GitHub accounts for board members who will edit content
5. ☐ Configure custom domain (rrroca.org) for GitHub Pages
6. ☐ Set up M365 Exchange for @rrroca.org email (after nonprofit approval)
7. ☐ Create Teams workspace for RRROCA board

---

*Prepared by Copilot CLI — May 9, 2026*
