# RRROCA Integrated Technology Strategy

## Vision: Frontier Community Association

RRROCA has the opportunity to become Calgary's first **Frontier Community Association** — a volunteer-run organization that uses modern technology to punch far above its weight. Not technology for technology's sake, but technology that solves the real problems every CA faces: volunteer burnout, lost institutional knowledge, governance gaps, and communication that doesn't reach residents.

A Frontier CA means:
- **Every board decision is documented and auditable** — not buried in WhatsApp threads
- **Meeting minutes publish themselves** — AI transcribes, summarizes, and posts to the website
- **A volunteer with zero tech skills can update the website** — because it's just text files and AI handles the rest
- **The website costs nothing** — forever. No hosting fees, no plugin subscriptions, no developer invoices
- **When a board member moves on, their successor can be productive in one afternoon** — not one quarter

This strategy maps how to get there across 11 technology domains, evaluated against 9 Architecture Principles derived from RRROCA's own Strategic Plan and Business Plan.

## Executive Summary

This document maps RRROCA's complete technology landscape — 11 strategic domains covering everything the Association uses to serve residents, run the board, communicate with the community, and manage operations. Each domain is evaluated against the Architecture Principles (see `architecture-principles.md`) and assigned a governance level: **board motion**, **portfolio authority** (Safety & Technology Director), or **no change needed**.

**Key recommendations for Board approval:**
1. **Public website:** Hugo + GitHub Pages replaces WordPress ($0 cost, zero maintenance, maximum security)
2. **Membership & programs:** Ratify Communal as the Association's membership platform (already adopted Feb 2026, replacing SportSoft)
3. **Board governance:** Formal motion tracker with authenticated voting replaces informal WhatsApp approvals

**Under portfolio authority (no board vote required):**
- Newsletter tooling (Mailchimp or Communal integration)
- Social media activation (Twitter/X, Instagram)
- Block Watch engagement strategy
- WhatsApp governance improvements
- Cybersecurity baseline
- AI tooling strategy
- Meeting intelligence (AI transcription and auto-published minutes)

**No change needed:** Google Workspace, QuickBooks, Facebook pages

---

## Technology Landscape

| # | Domain | Current Tool(s) | Status | Governance |
|---|--------|----------------|--------|-----------|
| A | Public Website | WordPress (rrroca.org) → Hugo | 🔄 Board motion | **Board vote** |
| B | Membership & Programs | Communal (replaced SportSoft Feb '26) | ✅ Adopted | **Board ratification** |
| C | Board Operations | Google Workspace (Drive, Docs, Calendar, Gmail) | ✅ Working | No change |
| D | Board Communications | WhatsApp + GitHub PR voting for motions | ⚠️ → ✅ Motion tracker implemented | Portfolio authority |
| E | Community Engagement | Facebook (RRROCA page, Safety page, Families group) | ⚠️ Fragmented | Portfolio authority |
| F | Safety & Block Watch | Facebook group (Visioneers program) + Safety page | ⚠️ Needs activation | Portfolio authority |
| G | Newsletter & Email | Manual email blasts, printed RRRO View | ⚠️ No dedicated tool | Portfolio authority |
| H | Social Media (Dormant) | Twitter/X, Instagram | ❌ Inactive | Portfolio authority |
| I | Financial Systems | QuickBooks + Communal/Stripe | ✅ Working | No change |
| J | Cybersecurity | None formal | ❌ Biz Plan 9.1 gap | Portfolio authority |
| K | AI Tooling | Ad hoc (GitHub Copilot CLI for website) | 🔲 Formalize | Portfolio authority |
| L | Meeting Intelligence | Manual minutes, no recordings | 🔲 New — Frontier CA | Portfolio authority |

---

## Domain A: Public Website — Board Motion Required

### The Problem

The current RRROCA website (rrroca.org) runs on WordPress. WordPress requires ongoing hosting fees ($84–120/yr), constant security patching (PHP + MySQL + plugins), and technical maintenance. It is the most-hacked CMS globally. The site has known security vulnerabilities and an outdated design. The Business Plan (Section 6.2) calls for a website overhaul. The 2025–2026 budget allocates $3,000 for "Website overhaul — Tallis Design."

Hugo + GitHub Pages delivers that overhaul at **$0 ongoing cost**, freeing the $3,000 for other priorities.

### Website Platform Scorecard

Each platform scored against the 10-question checklist from `architecture-principles.md`. Fail on Q0, Q1, Q2, or Q6 = reject.

### Scorecard

| # | Question | Hugo + GitHub Pages | WordPress / 10Web | Managed CMS (SharePoint) | Google Sites |
|---|----------|:---:|:---:|:---:|:---:|
| **Q0** | Helps residents feel informed/safe/involved? | ✅ Full control — safety dashboards, interactive features, custom UX | ✅ Plugins for most features | ⚠️ Limited design, basic content only | ⚠️ Template-only, no custom features |
| **Q1** | Site survives if service disappears? | ✅ Markdown content → deploy anywhere in 1 hour | ❌ Locked to WordPress hosting; export is messy | ⚠️ Locked to nonprofit grant program | ❌ Proprietary format, not portable |
| **Q2** | Cost? | ✅ $0 forever | ❌ $84-120/yr — site dies if payment lapses | ✅ $0 via nonprofit grant | ✅ $0 via nonprofit grant |
| **Q3** | Needs ongoing maintenance? | ✅ Zero — static HTML, no updates needed | ❌ WordPress core + plugins + PHP + database = constant patching | ✅ Fully managed | ✅ Fully managed |
| **Q4** | Non-technical board member can use it? | ✅ Decap CMS for content; power users edit Markdown on GitHub | ✅ WordPress admin is familiar | ✅ Built-in page editor | ✅ Best score — anyone can edit |
| **Q5** | Creates vendor lock-in? | ✅ No — Markdown + HTML, deploy to any static host | ⚠️ WordPress is portable-ish but plugins are not | ⚠️ Tied to nonprofit grant program | ❌ Proprietary content format |
| **Q6** | Requires Chad (or any single person)? | ✅ No — org account, Decap CMS, documented. Bus factor ≥ 2 | ⚠️ Someone must handle updates and plugin conflicts | ✅ Org-owned tenant, any admin can manage | ✅ Any board member can edit |
| **Q7** | Increases attack surface? | ✅ No — pure static HTML, no server code | ❌ PHP + MySQL + plugins = #1 hacked CMS globally | ✅ Managed security | ✅ Managed security |
| **Q8** | Documented? | ✅ Docs in repo + board-accessible location | ⚠️ Plugin configs scattered, tribal knowledge | ⚠️ Platform docs exist but config is GUI-based | ⚠️ Google's docs, not ours |
| **Q9** | AI-assistable? | ✅ Text-based codebase — AI can read, modify, debug everything | ⚠️ PHP readable but plugin conflicts are opaque to AI | ⚠️ Framework-specific, requires platform expertise | ❌ No code access, proprietary templates |
| | **Hard Fails (Q0/Q1/Q2/Q6)** | **0** | **2** (Q1, Q2) | **0** | **1** (Q1) |
| | **Total ⚠️/❌** | **0** | **6** | **4** | **4** |

### Recommendation by Platform

**Option A: Hugo + GitHub Pages — ✅ RECOMMENDED FOR BOARD APPROVAL**
- Zero hard fails. Zero caveats. Passes every question cleanly.
- Only platform where AI-assisted volunteers can maintain the full stack (Tier 2.5).
- Only platform with truly portable content (Markdown → any static host).
- Prototype already built, tested (59 Jest + 68 Playwright tests), and deployed for board review.

**Option B: WordPress / 10Web — NOT RECOMMENDED**
- Hard fails on Q1 (portability) and Q2 (cost). Site goes offline if payment lapses.
- Also fails Q3 (maintenance), Q5 (lock-in), Q7 (security). 
- The old tech strategy recommended this path. This evaluation supersedes that recommendation.

**Option C: Managed CMS (e.g., SharePoint) — NOT RECOMMENDED FOR PUBLIC WEBSITE**
- No hard fails, but 4 caveats. Depends on obtaining a nonprofit productivity suite grant.
- Design limitations prevent the custom UX already prototyped (homepage, safety dashboard).
- AI-assistability is limited — framework-specific development, opaque to general AI tools.
- Could be revisited as a future option for an internal board portal, not the public-facing website.

**Option D: Google Sites — NOT RECOMMENDED FOR WEBSITE**
- Hard fail on Q1 (proprietary format, not portable — Google has discontinued Sites before).
- Also fails Q5 (vendor lock-in) and Q9 (zero AI-assistability for customization).
- Design ceiling is absolute: cannot build safety dashboard, custom search, or interactive features.
- **Google Workspace for board ops remains excellent and should continue** — this recommendation applies only to the public website.

### Website Content Pipeline

The website should serve as the community information hub, consolidating content that currently arrives through fragmented channels:

- **NPC Reports** — Monthly Neighbourhood Partnership Coordinator reports from the City of Calgary (grants, programs, city services, training) should be published as community news
- **Safety updates** — CPS data, Block Watch alerts, emergency preparedness
- **Events** — Cross-posted from Communal (upcoming programs, registrations)
- **Seasonal content** — Street cleaning schedules, water restrictions, Branching Out trees, Neighbour Day
- **Grant opportunities** — Quarterly grant roundups from NPC reports benefit residents and partner organizations

### Budget Impact

The 2025–2026 budget allocates **$3,000 for "Website overhaul — Tallis Design."** Hugo + GitHub Pages delivers that overhaul at $0 ongoing cost, freeing the $3,000 for other priorities (or saving it). Only cost: domain renewal (~$15/yr).

### Nonprofit Eligibility

RRROCA is incorporated under the **Alberta Societies Act** but is **NOT a CRA-registered charity**. This affects which programs are available:

| Program | Requires Charity? | RRROCA Eligible? |
|---------|-------------------|-----------------|
| TechSoup Canada | No — accepts incorporated nonprofits | ✅ Register with Alberta Certificate of Incorporation |
| GitHub for Nonprofits | No — accepts equivalent nonprofit status | ✅ Submit incorporation docs |
| Google Workspace Nonprofit | Varies | ✅ Already active (org ID: 237313873071) |

---

## Domain B: Membership & Programs — Board Ratification

### Current State

RRROCA migrated from **SportSoft** to **Communal** (getcommunal.com) in February 2026. Communal is a Calgary-based SaaS platform used by many Calgary community associations. RRROCA's Communal instance (rrroca.getcommunal.com) has the following features enabled:

| Feature | Status | Notes |
|---------|--------|-------|
| Memberships | ✅ Active | Digital cards, auto-renew, family/household |
| Programs & Events | ✅ Active | Registration, parent programs |
| Facility Bookings | ✅ Active | Drop-in bookings enabled |
| Volunteering | ✅ Active | Hour tracking |
| Donations | ✅ Active | Checkout donations (no tax receipts — no charity #) |
| Product Management | ✅ Active | Merchandise/sales |
| Billing Portal | ✅ Active | Stripe payments (CAD) |
| Custom Forms | ❌ Not enabled | Could replace Google Forms for surveys |
| POS Terminal | ❌ Not enabled | Hardware add-on available |
| Waivers | ❌ Not enabled | Useful for programs/events |

### Principles Evaluation

| Question | Assessment |
|----------|-----------|
| Q0 — Resident value? | ✅ Online membership, event registration, payment — directly serves residents |
| Q1 — Survives if service disappears? | ⚠️ Member data is in Communal's database. Export capability should be verified |
| Q2 — Cost? | ⚠️ ~$75–175/mo ($900–2,100/yr) — not zero, but delivers critical Biz Plan requirements |
| Q4 — Non-technical? | ✅ Browser-based admin, designed for volunteer boards |
| Q5 — Vendor lock-in? | ⚠️ Moderate — member data exportable but workflows are platform-specific |
| Q6 — Requires one person? | ✅ Multiple admins, designed for board turnover |
| Q9 — AI-assistable? | ⚠️ SaaS admin panel — AI can't automate it, but it doesn't need automation |

### Recommendation

**Ratify as the Association's membership and programs platform.** Communal doesn't pass the zero-cost test (P2), but it delivers critical Business Plan requirements (membership management, event registration, payment processing, volunteer tracking) that the website platform is not designed to handle. The cost is justified by the operational value.

**Actions:**
- ☐ Board to formally ratify Communal as the membership platform (if not already done)
- ☐ Verify data export capability (member list, transaction history)
- ☐ Confirm Communal cost is captured in operating budget
- ☐ Evaluate enabling Custom Forms module (could replace ad-hoc Google Forms)
- ☐ Explore Communal → Mailchimp integration for newsletter automation

### Integration with Website

Communal handles transactions. The website handles content and community information. They should cross-link but not duplicate:
- Website links to `rrroca.getcommunal.com/memberships` for membership purchase
- Website event listings link to Communal for registration/payment
- Communal remains the system of record for member data

---

## Domain C: Board Operations — No Change

### Current State

Google Workspace is RRROCA's operational backbone:
- **Gmail** — @rrroca.org email for board members
- **Google Drive** — Document storage, meeting minutes, financial records
- **Google Calendar** — Board meetings, events, volunteer scheduling
- **Google Docs/Sheets** — Collaborative editing, budgets, reports

### Assessment

Google Workspace works. It's free via Google for Nonprofits (already active). Board members are familiar with it. Changing it would be disruptive for zero gain.

**No action required.** Google Workspace continues as the board operations platform. This is an independent decision from the website platform.

---

## Domain D: Board Communications — Portfolio Authority

### Current State

WhatsApp is the primary real-time communication channel between board members and with community volunteers. It works for quick coordination but has significant limitations:

- **No searchable history** — decisions made in WhatsApp are lost
- **No integration** — siloed from Google Drive, email, and website
- **No organizational ownership** — tied to personal phone numbers
- **No topic threading** — conversations blend together
- **Privacy concerns** — personal phone numbers exposed to all group members

### Principles Evaluation

WhatsApp passes Q2 (free), Q4 (everyone knows it), and Q6 (no single person dependency). It fails Q8 (decisions are undocumented) and Q1 (no data portability or backup).

### Recommendation

**Keep WhatsApp for quick coordination, but move formal decisions to a proper governance process:**

#### Board Motion Tracker (implemented)

A formal motion system is now built into the website at `/board/`. When a board member wants to propose a motion:

1. The motion is created as a page on the website (text, cost, rationale, supporting documents)
2. A **GitHub pull request** is opened for the motion — this is the voting mechanism
3. Board members receive an **automatic email notification** when a motion is posted
4. Directors vote by **approving or requesting changes** on the pull request
5. Once quorum is reached, the motion is merged and the website updates with the result

**Why pull request voting instead of Google Forms or email?**

| Concern | How PR Voting Addresses It |
|---------|---------------------------|
| **"Who voted and when?"** | Every approval is timestamped and tied to a named GitHub account — permanent, immutable audit trail |
| **"Is this what I voted on?"** | The exact motion wording is locked in the PR. No one can claim the text changed after they voted |
| **"I didn't see the motion"** | GitHub sends automatic email notifications to all repo collaborators. No more "I missed it in WhatsApp" |
| **"How do I vote?"** | Click the email link → read the motion → click Approve or Request Changes. Works on phone, tablet, laptop — takes 30 seconds |
| **"What did the board decide?"** | Approved motions publish automatically to the public website at `/board/` — full transparency for the community |
| **"What if someone disputes a decision?"** | The complete vote record is in git history forever — legally defensible under the Alberta Societies Act |
| **"Does this cost anything?"** | GitHub accounts are free. No new subscriptions, no new vendors |

**The one ask:** each board member creates a free GitHub account and is added as a collaborator on the website repository. They don't need to know git or code — they just click "Approve" on a pull request.

#### WhatsApp Governance

WhatsApp remains the right tool for quick board coordination — "who's bringing the table to the Stampede Breakfast?" doesn't need a formal process. The key rule:

> **If it's a decision that spends money, changes policy, or commits the Association — it's a motion, not a WhatsApp message.**

This separation means WhatsApp stays informal and fast, while formal governance gets the audit trail and transparency the Alberta Societies Act requires.

---

## Domain E: Community Engagement — Portfolio Authority

### Current State

Facebook is RRROCA's primary community engagement channel, but it's fragmented:

| Page/Group | Owner/Admin | Status | Audience |
|-----------|-------------|--------|----------|
| RRROCA main page | Board members (access confirmed?) | ⚠️ Admin access unclear | General community |
| RRROCA Safety page | Chad La Fournie | ✅ Active | Safety-focused residents |
| RRROCA Families group | Community-run | ✅ Active, engaged | Families in RR/RO |
| Block Watch group | Visioneers / CPS program | ⚠️ Chad moderates, doesn't own | Block Watch participants |

### Challenges

1. **Admin access fragmentation** — The main RRROCA page had admin access issues (previously only Victoria, a student). Current access status needs verification.
2. **No content strategy** — Posts happen ad-hoc rather than as part of a coordinated plan
3. **Cross-posting overhead** — Same content often needs to go to multiple pages/groups manually
4. **No connection to website** — Facebook content doesn't feed back to rrroca.org

### Block Watch — Special Considerations

The Block Watch program was started by Tavis Settles and is connected to a broader Calgary initiative managed by The Visioneers (thevisioneers.ca). It won a 2017 Good Work Award for building trust between neighbourhoods and police and reducing crime statistics. Chad is a moderator but the infrastructure is externally managed.

**Block Watch needs activation** — the program exists and has proven value, but engagement has dropped. This is primarily a community engagement challenge, not a technology one.

### Recommendation

**Establish a content strategy that connects Facebook → Website → Newsletter:**
- Website is the canonical source for community information
- Facebook pages share/promote website content with links back
- Newsletter summarizes key website content monthly
- Block Watch activation is a community engagement priority, not a platform decision

**Actions (portfolio authority):**
- ☐ Verify and document admin access to all RRROCA Facebook properties
- ☐ Ensure 2+ board members have admin access to the RRROCA main page
- ☐ Create a simple content calendar (even monthly) linking website posts → Facebook shares
- ☐ Develop Block Watch re-engagement plan with CPS Community Liaison Officer
- ☐ Cross-post NPC report highlights to Facebook pages

---

## Domain F: Newsletter & Email Marketing — Portfolio Authority

### Current State

RRROCA produces:
- **RRRO View** — community newsletter (status: printed? digital? frequency unclear)
- **Email blasts** — monthly to member email list for events, updates, urgent alerts
- **No dedicated tool** — email blasts appear to be manual via Gmail or Google Groups

### Principles Evaluation

A newsletter tool needs to pass Q2 (free tier available), Q4 (non-technical board member can send), and Q6 (not dependent on one person).

### Recommendation

**Evaluate Communal's integration with Mailchimp** (already supported) or **Buttondown** (free tier, simple):

| Option | Free Tier | Integration | Complexity |
|--------|----------|-------------|-----------|
| Mailchimp | ✅ Up to 500 contacts | ✅ Communal has native integration | Moderate — full marketing platform |
| Buttondown | ✅ Up to 100 subscribers | ⚠️ Manual or API | Simple — newsletter-focused |
| Communal built-in | ✅ Included in subscription | ✅ Native | Simplest — if it meets needs |

**Priority:** Check if Communal's notification/email features can serve as the newsletter tool before adding another platform. Fewer tools = less complexity = better P3 (maintenance-free) score.

**Actions (portfolio authority):**
- ☐ Audit current newsletter process (who sends, how, to whom, how often)
- ☐ Check Communal's email/notification capabilities
- ☐ If insufficient, evaluate Mailchimp free tier with Communal integration
- ☐ Add newsletter signup to Hugo website (Formspree or direct integration)

---

## Domain G: Social Media (Dormant) — Portfolio Authority

### Current State

The Business Plan mentions Twitter and Instagram accounts. Both appear to be **dormant/inactive**. These represent an untapped opportunity for community engagement, particularly for reaching younger residents.

### Recommendation

**Do not activate until the content strategy (Domain E) is in place.** An empty or rarely-updated social account is worse than no account. The priority order is:

1. First: Get the website content pipeline working (NPC reports, safety updates, events)
2. Second: Establish Facebook cross-posting discipline
3. Third: Evaluate whether Twitter/X and Instagram add reach to demographics not on Facebook
4. Fourth: If yes, activate with automated cross-posting from website content

**This is a future item, not urgent.**

---

## Domain H: Financial Systems — No Change

### Current State

- **QuickBooks** — Treasurer maintains accounts, fiscal year July 1 – June 30
- **Communal/Stripe** — Membership payments, event registrations (CAD)
- **Bank** — Multiple authorized signatories, signature cards on file

### Assessment

Financial systems work and are managed by the Treasurer. Communal integrates with QuickBooks (supported integration). No technology change needed.

**Action:** Verify QuickBooks ↔ Communal integration is configured to avoid double data entry.

---

## Domain I: Cybersecurity — Portfolio Authority

### Current State

Business Plan Section 9.1 calls for a "Comprehensive Cybersecurity Strategy" including secure access controls, regular security audits, and data privacy aligned with PIPEDA. Currently, no formal cybersecurity measures are in place.

### Recommended Baseline (aligned to Architecture Principles P5 — Security by Elimination)

The best cybersecurity for a volunteer organization is **eliminating attack surface**, not managing it:

| Risk | Mitigation |
|------|-----------|
| Website hacked | ✅ Hugo eliminates this — static HTML, no server, no database, no admin panel |
| Google Workspace compromised | ☐ Enable 2FA for all board Google accounts |
| Communal data breach | ✅ Communal manages their own security; RRROCA controls access via admin roles |
| WhatsApp compromised | ⚠️ Low risk — but personal phone numbers are exposed |
| Password sharing | ☐ Use a shared password manager (e.g., Bitwarden free) for shared accounts |
| Single person has all access | ☐ Bus factor audit at each AGM (per resiliency measures) |
| PIPEDA compliance | ☐ Document what personal data RRROCA collects, where it's stored, and retention policies |

**Actions (portfolio authority):**
- ☐ Enable 2FA on all board member Google Workspace accounts
- ☐ Audit shared passwords (domain registrar, social media, Communal admin)
- ☐ Create a simple data inventory (what personal data, where stored, who has access)
- ☐ Include cybersecurity status in annual bus factor audit

---

## Domain J: AI Tooling — Portfolio Authority

See `architecture-principles.md` → AI Tooling Strategy section for full details.

### Summary

AI is the force multiplier that makes this entire technology strategy viable for a volunteer organization. Key concepts:

- **Tier 2.5 volunteers** — semi-technical people with AI coding assistants (GitHub Copilot CLI, ChatGPT, Gemini) can perform developer-tier tasks on the Hugo website
- **AI is the succession plan** — when the current developer-volunteer leaves, AI-assisted volunteers can maintain the full stack on Hugo (but NOT on WordPress, managed CMS, or Google Sites)
- **Board operations** — AI writing assistants can help volunteers draft newsletter content, grant applications, meeting minutes, and community communications
- **Platform choice affects AI-assistability** — Hugo scores ⭐⭐⭐⭐ (text-based codebase, AI reads everything); WordPress scores ⭐⭐ (PHP readable but plugins opaque); Google Sites scores ⭐ (no code access)

**The Government of Alberta offers a "Demystifying AI for Nonprofit Orgs" workshop** — relevant for board members to understand how AI tools can help the Association.

---

## Domain L: Meeting Intelligence — Portfolio Authority (Frontier CA)

### The Opportunity

Board meetings, committee calls, and the Annual General Meeting generate decisions, action items, and commitments — but today these are captured (if at all) through manual note-taking. Minutes are often late, incomplete, or never written. The AGM requires formally documented minutes under the Alberta Societies Act, adding compliance pressure to an already-stretched volunteer secretary.

AI-powered meeting intelligence solves this by automating the entire pipeline: **record → transcribe → summarize → publish**.

### How It Works

1. **Record** — Board meetings held via Teams (free tier supports recording and transcription)
2. **Transcribe** — Teams auto-generates a transcript with speaker identification
3. **Summarize** — AI processes the transcript into structured meeting minutes:
   - Attendance and quorum confirmation
   - Motions discussed and outcomes
   - Action items with owners and deadlines
   - Key decisions and rationale
4. **Publish** — Summary posted to the website at `/board/meetings/` as a read-only public record
   - Full transcript available to board members only (linked from the summary)
   - Community sees: what was decided, who was there, what's next

### Why This Matters

| Stakeholder | Impact |
|-------------|--------|
| **Secretary** | Meeting minutes go from a 2-hour chore to a 10-minute review — AI does the drafting |
| **Board members** | Action items are captured and visible — no more "I thought someone else was doing that" |
| **Community** | Residents can see what the board decided without attending the meeting — real transparency |
| **AGM compliance** | Alberta Societies Act minutes requirement met automatically, published within 48 hours |
| **Future board members** | Complete searchable history of every decision — institutional knowledge preserved forever |

### Principles Alignment

- **P0 (Community First):** Residents get transparency into board decisions
- **P1 (Survive Volunteer Turnover):** Meeting history doesn't walk out the door when the Secretary leaves
- **P2 (Zero Cost):** Teams free tier + AI summarization at no cost
- **P4 (Progressive Skill Levels):** Secretary reviews AI-drafted minutes — Tier 1 task, not Tier 3
- **P8 (Document Decisions):** Every meeting is permanently documented in the website's version control

### Implementation Phases

**Phase 1 (Quick win):** Record next board meeting on Teams, manually run AI summary, publish to website. Proves the concept with zero infrastructure.

**Phase 2 (Streamlined):** Create Hugo content type for meeting minutes. Establish a repeatable process: recording → AI summary → PR → publish.

**Phase 3 (Automated):** GitHub Action that accepts a transcript upload and auto-generates the meeting minutes page via AI API.

### Recruiting & Retention Value

This is a signature **Frontier CA** capability. Most community associations struggle to find a volunteer secretary willing to take minutes. RRROCA's pitch:

> "Our meetings transcribe themselves. AI drafts the minutes. The Secretary reviews and clicks publish. The whole community can see what we decided, and every action item is tracked."

This reduces the Secretary role from "thankless transcription duty" to "quality reviewer" — a fundamentally more attractive volunteer position.

---

## Resiliency & Succession Planning

**Aligned to:** Business Plan Section 5.6 — *"Each member of the Executive and Portfolio Chairs should develop a succession plan and actively develop a successor."*

The Business Plan identifies volunteer continuity as the Association's core organizational challenge — 100% volunteer, no paid staff, chronic board quorum issues. Every technology choice must be evaluated through this lens: **can the next Safety & Technology Director (or any board member) maintain this without the current director's technical expertise?** The technology resiliency measures below are the direct implementation of the Section 5.6 succession planning action item for the technology portfolio.

### Scenario Matrix

| Scenario | Website (Hugo) | Memberships (Communal) | Board Ops (Google) | Comms (WhatsApp) |
|----------|---------------|----------------------|-------------------|-----------------|
| **Chad leaves** | ✅ Runs forever, Decap CMS for editing | ✅ Any admin manages | ✅ Any admin manages | ✅ Groups persist |
| **No tech board members** | ✅ Decap CMS + AI-assisted volunteer | ✅ Designed for non-technical | ✅ Everyone knows Google | ✅ Everyone knows WhatsApp |
| **Budget goes to zero** | ✅ $0 forever | ⚠️ Communal subscription required | ✅ Free via nonprofit | ✅ Free |
| **Platform discontinued** | ✅ Markdown → any host in 1 hour | ⚠️ Export data, find replacement | ⚠️ Export data, find replacement | ⚠️ Migrate to another chat |

### Resiliency Measures (apply to ALL domains)

1. **Organizational accounts** — Every platform should be owned by RRROCA, not a personal account. Create a `rrroca` GitHub organization. Ensure Google Workspace is under the rrroca.org domain. Verify Communal admin access.
2. **Redundant access** — 2+ board members as admin on every platform (GitHub, Google, Communal, Facebook, domain registrar).
3. **Documentation** — Maintain in the repo AND Google Drive:
   - `OPERATIONS.md` — How to edit content, publish posts, manage the site
   - `ARCHITECTURE.md` — How the site works
   - `EMERGENCY.md` — What to do if things break
   - `ACCOUNTS.md` — What accounts exist, who has access
4. **Annual bus factor audit** — At each AGM: Can someone other than Chad publish a news post? Edit a page? Add a member to GitHub? Process a membership? If "no" to any, fix immediately.
5. **Minimum viable handoff** — If Chad left tomorrow:

```
RRROCA Technology Quick Reference
==================================
Website:      rrroca.org → edit at rrroca.org/admin (GitHub login)
Memberships:  rrroca.getcommunal.com (Communal admin login)
Email/Docs:   Google Workspace (@rrroca.org accounts)
Board chat:   WhatsApp group
Facebook:     RRROCA page / Safety page / Families group
Source code:  github.com/rrroca/rrroca.org
Domain:       rrroca.org — managed at [registrar]
Passwords:    [shared password manager location]
```

---

## Implementation Roadmap — Becoming a Frontier CA

### Phase 1: Foundation & Alignment (Current)
- ✅ Website rebuilt on Hugo + GitHub Pages (zero-cost, zero-maintenance)
- ✅ Board Motion Tracker with GitHub PR-based voting (authenticated, auditable)
- ✅ Integrated Technology Strategy (this document) and Architecture Principles
- ✅ Change Management Plan prepared
- Board reviews this strategy and website prototype
- Board votes on motions: (1) website platform, (2) governance tracker adoption
- Board ratifies Communal as membership platform

### Phase 2: Website Launch & Board Onboarding
- Board members create free GitHub accounts (voting access)
- First real motion voted via GitHub PR (tiny forest fencing — $1,200)
- Register RRROCA at techsoupcanada.ca
- Create RRROCA GitHub organization, transfer repo
- Configure rrroca.org domain for GitHub Pages
- Set up Decap CMS for non-technical editors

### Phase 3: Meeting Intelligence (Frontier CA Milestone)
- Record first board meeting on Teams (free tier)
- AI-generated meeting minutes published to `/board/meetings/`
- Create repeatable pipeline: recording → AI summary → PR → publish
- AGM minutes auto-published within 48 hours (Alberta Societies Act compliance)
- **This is the capability that defines "Frontier CA"** — the meeting that transcribes itself

### Phase 4: Community Engagement & Content
- Establish website content pipeline (NPC reports, safety updates, events)
- Cross-link Communal ↔ website (membership purchase, event registration)
- Activate newsletter tool (Communal integration or Mailchimp)
- Implement Facebook content strategy
- Volunteer portal with skills-based matching and recruiting pitch

### Phase 5: Hardening & Growth
- Enable 2FA across all board accounts
- Create resiliency documentation (OPERATIONS.md, ARCHITECTURE.md, EMERGENCY.md)
- Conduct first annual bus factor audit at AGM
- Evaluate Block Watch re-engagement strategy with CPS
- Financial transparency page on website

---

## Governance Summary

| Domain | Decision Type | Authority | Status |
|--------|-------------|-----------|--------|
| A. Website Platform | Capital/strategic | **Board motion** | Pending approval |
| B. Communal | Budget ratification | **Board motion** | Already adopted — ratify |
| C. Google Workspace | No change | N/A | ✅ Continue |
| D. Board Governance (Motions) | Operational/strategic | **Board motion** | ✅ Built — pending adoption |
| E. Facebook strategy | Operational | Portfolio authority | Recommendation above |
| F. Newsletter tool | Operational | Portfolio authority | Evaluation needed |
| G. Social media | Operational | Portfolio authority | Future — not urgent |
| H. Financial systems | No change | N/A | ✅ Continue |
| I. Cybersecurity | Operational | Portfolio authority | Baseline needed |
| J. AI tooling | Strategic direction | Portfolio authority | See architecture-principles.md |
| L. Meeting Intelligence | Operational | Portfolio authority | Phase 3 — Frontier CA milestone |

---

## Budget Impact

| Item | Current Cost | Proposed Cost | Change |
|------|-------------|--------------|--------|
| Website hosting (WordPress) | $84–120/yr | $0 (GitHub Pages) | **Save $84–120/yr** |
| Website overhaul (Tallis Design) | $3,000 (budgeted) | $0 (already built) | **Save $3,000** |
| Domain renewal (rrroca.org) | ~$15/yr | ~$15/yr | No change |
| Communal | Already in budget | Already in budget | No change |
| Google Workspace | $0 (nonprofit) | $0 (nonprofit) | No change |
| Newsletter tool | N/A | $0 (free tier) | No change |
| New tools/subscriptions | N/A | $0 | **No new costs** |
| **Net impact (cost savings)** | | | **Save ~$3,100+** |

### Volunteer Matching Revenue

The Safety & Technology Director's employer offers a volunteer matching program (MSGive via Benevity) that donates **$25/hour** to eligible nonprofits for verified volunteer hours, up to a $15,000 annual cap (combined with donation matching). This creates a potential income stream for RRROCA from technology volunteer effort.

> **Action Required:** RRROCA is an Alberta Societies Act nonprofit, not a CRA-registered charity. Benevity primarily lists registered charities, but non-charity nonprofits **can qualify** if verified through TechSoup Canada (techsoup.ca). Steps:
> 1. Search for RRROCA in the Benevity Causes Portal — it may already be listed
> 2. If not found, register RRROCA via TechSoup Canada using the Alberta corporate registry number
> 3. Once verified, volunteer hours can be logged and matched at $25/hr
>
> At 10 hours/month of technology volunteer work, this would generate **$3,000/year** — roughly equal to the website overhaul budget being saved.

This benefit is tied to the volunteer, not the platform — but a text-based, AI-assistable technology stack (Hugo, GitHub, Markdown) enables more productive volunteer hours per session than a maintenance-heavy stack (WordPress patching, plugin conflicts), meaning more impactful hours logged and more matching revenue generated per unit of volunteer time.

---

*Prepared by the Safety & Technology Director for board review — May 2026. Aligned to RRROCA Strategic Plan (2024–2028), Business Plan (2023–2028), and Architecture Principles (docs/architecture-principles.md). This strategy positions RRROCA as Calgary's first Frontier Community Association — technology that serves volunteers, not the other way around.*
