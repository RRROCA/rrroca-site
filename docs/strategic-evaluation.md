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
- Register RRROCA as a nonprofit with Microsoft (techsoup.ca verification)
- Get M365 Business Basic for up to 300 users — FREE
- Includes: Exchange email (@rrroca.org), Teams, SharePoint, OneDrive (1TB/user)
- Board members get professional email, shared documents, Teams channels
- Replace current Google Workspace for email (or supplement it)

### Phase 3: Integration (6 months)
- SharePoint for internal docs (meeting minutes, bylaws, financial reports)
- Teams for board communication and committee coordination
- Power Automate for form processing (contact form → Teams notification)
- Copilot for Microsoft 365 (if CA qualifies for the nonprofit add-on)

---

## Why NOT 10Web

1. **Cost for no gain**: $84-120/year for WordPress when Hugo/GH Pages is free and already superior
2. **Security regression**: Moving back to WordPress undoes the biggest win of this migration
3. **No Microsoft synergy**: 10Web doesn't connect to Teams, SharePoint, or any Microsoft ecosystem
4. **Collaboration is solvable**: Decap CMS provides the same "edit in browser" experience that 10Web would
5. **Vendor lock-in**: WordPress → 10Web is a hosting dependency; Hugo → GitHub is portable

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
