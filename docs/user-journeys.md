# RRROCA User Experience Journeys

*How residents and board members experience the RRROCA website. These journeys drive every architecture and feature decision.*

*Last updated: May 2026*

---

## Why Journeys Matter

RRROCA serves two distinct audiences with very different needs:

- **~20,000 residents** who want information about their community
- **~15-20 board members** who govern the association as volunteers

The website must serve both — without requiring either group to understand the technology behind it. These journeys map the experience from the user's perspective, not the system's.

---

## Journey 1: Community Resident

### 1A. "What's happening in my neighbourhood?"

```
Resident hears sirens / sees construction / gets a flyer
    → Opens rrroca.org on their phone
    → Sees safety alerts, upcoming events, or news on the homepage
    → Finds what they need in < 30 seconds
    → Done — no login, no signup, no friction
```

**Principles at work:** P0 (Community First), P4 (accessible to everyone), P5 (no attack surface — static pages)

### 1B. "I need help finding something"

```
Resident can't find what they're looking for
    → Clicks the chat icon
    → Asks in plain language: "When is the next community cleanup?"
    → AI assistant answers from site content — no hallucination, cites sources
    → Resident clicks the linked page for full details
    → Done — no login required
```

**Principles at work:** P0 (resident gets information), P6 (if chatbot fails, search and navigation still work)

### 1C. "I want to report a concern or get involved"

```
Resident wants to report a safety concern or volunteer
    → Fills out a form (safety report, volunteer signup, contact)
    → Formspree processes submission → email to relevant board member
    → Resident sees confirmation message
    → If Formspree is down → fallback shows email address and phone number
```

**Alternative path (via chatbot):**
```
Resident: "The events page has a broken link"
    → AI assistant collects details: which page, what's broken
    → Directs to the bug report form or GitHub Issues link
    → Future: auto-creates GitHub Issue on the resident's behalf
```

**Principles at work:** P2 (free tier), P5 (no server-side processing), P6 (mailto fallback)

### 1D. "I want to see what the board is doing"

```
Resident visits /board/ or /board/actions/
    → Sees board member bios, meeting schedule
    → Can read all open motions — titles, descriptions, current vote counts
    → Cannot vote, propose, or second (no login needed to read)
    → Transparency without friction
```

**Principles at work:** P0 (informed residents), P5 (read-only = no attack surface)

---

## Journey 2: Board Member

### 2A. "A new motion needs my attention" (notification → action)

```
Board member receives email at their @rrroca.org address
    ← GitHub Actions workflow sent notification when motion was proposed
    → Email says: "New motion: [title]. Review and vote: rrroca.org/board/actions/"
    → Board member clicks link
    → Lands on Board Action Center
    → Clicks "Sign in with Google" → authenticates with @rrroca.org account
    → AI assistant greets: "Welcome back, [name]. You have 1 motion pending your vote."
    → Board member reviews motion, votes through conversation or UI
    → Done — never touched GitHub, never left rrroca.org
```

**Principles at work:** P0 (faster governance → better community outcomes), P4 (conversational interface — maximum accessibility), P1 (any board member can do this — no special skills)

### 2B. "I want to propose a motion" (board secretary experience)

```
Board member visits rrroca.org/board/actions/
    → Signs in with Google (or is already signed in)
    → Opens the AI assistant
    → Says: "I want to propose we allocate $500 for playground fence repair"
    → Agent drafts the motion:
        - Formats the title and description
        - Identifies the relevant category
        - Shows preview: "Here's the draft. Submit?"
    → Board member confirms
    → Motion created (GitHub Issue, invisible to board member)
    → Email notification sent to all board members via board@rrroca.org
    → Agent confirms: "Motion submitted. Board members have been notified."
```

**Principles at work:** P4 (natural language is the most accessible interface), P3 (zero learning curve), P5 (auth-gated, only @rrroca.org accounts)

### 2C. "What's pending?" (board secretary awareness)

```
Board member visits rrroca.org (any page)
    → Signs in with Google
    → Opens the AI assistant
    → Agent automatically knows their board context:
        "Good morning, [name]. Here's what needs attention:
         • 1 motion awaiting your vote: [title]
         • 1 motion needs a second: [title]
         • The technology strategy motion has been open 12 days."
    → Board member can act immediately through conversation
    → Or navigates to /board/actions/ for the full list
```

**Principles at work:** P0 (governance doesn't stall), P4 (proactive, not reactive), P6 (if agent fails, action center page still works)

### 2D. "I'm new to the board" (onboarding)

```
New board member is elected or appointed
    → Receives welcome email with one link: rrroca.org/board/
    → Clicks "Sign in with Google" — uses existing @rrroca.org account
    → That's it — they can:
        - Read all motions
        - Propose, second, vote
        - Ask the AI assistant any question about board process
    → No GitHub account needed
    → No special software to install
    → No training session required — the interface is conversational
```

**Principles at work:** P1 (survives turnover — zero onboarding friction), P4 (conversational = self-explanatory), P2 (zero cost per board member)

### 2E. "I need to update website content" (CMS assistance)

```
Board member with CMS access signs in
    → Asks the agent: "Write a news post about the June 15 community cleanup"
    → Agent drafts in RRROCA's community voice with markdown formatting
    → Includes suggested title, date, and description metadata
    → Board member reviews, then either:
        a) Copies to CMS at /admin/ and publishes (now)
        b) Agent publishes directly via GitHub API (future, requires CMS editor role)
```

**Principles at work:** P4 (conversational = most accessible), P1 (new editor just talks to the bot)

### 2F. "I want to draft a communication" (future capability)

```
Board member signs in
    → Asks the agent: "Draft an email to residents about the new parking bylaw"
    → Agent drafts in RRROCA's community voice
    → Board member reviews, edits, copies to their email
    → Sends via their usual email (Gmail / future productivity suite)
```

**Principles at work:** P0 (better communications → more informed residents), P4 (AI assists, human approves)

---

## Journey 3: Website Maintainer (Technical Volunteer)

### 3A. "I need to update site content"

```
Communications Chair or content volunteer
    → Signs in to Decap CMS at /admin/
    → Edits news, events, board bios via browser forms
    → Clicks Save → published in ~2 minutes via CI/CD
    → No code, no terminal, no Git knowledge required
```

### 3B. "I need to change the website design" (AI-assisted)

```
Semi-technical volunteer with AI tools
    → Opens GitHub Copilot CLI in the repo
    → Describes the change: "Add a sidebar to the events page"
    → AI implements the change in Hugo templates
    → Volunteer reviews and commits
    → CI/CD deploys automatically
```

**Principles at work:** P1 (AI is the succession plan), P4 (Tier 2.5 — AI bridges the skill gap)

---

## Technology Is Invisible

A key design principle across ALL journeys: **no user should need to know or care about the technology stack.**

| What the user sees | What's actually happening |
|---|---|
| "Sign in with Google" | Azure SWA built-in auth → Google OAuth → `x-ms-client-principal` header |
| "New motion: [title]" email | GitHub Actions workflow triggered by issue creation → email to Google Group |
| AI assistant knows pending motions | Chat API reads auth header → fetches motion data from GitHub Issues → enriches system prompt |
| Motion submitted | Azure Function creates GitHub Issue with labels, triggers notification workflow |
| Vote recorded | Azure Function posts comment on GitHub Issue, updates labels |
| Website content updates | Decap CMS → Git commit → GitHub Actions → Hugo build → Azure SWA deployment |

**The board member's mental model:** "I sign in with my RRROCA email, the site knows what I need to do, and I talk to it like a person."

**The resident's mental model:** "I go to rrroca.org and find what I need."

Everything else is invisible infrastructure.

---

## Identity Model

| Role | Identity | How they authenticate | What they can do |
|---|---|---|---|
| Resident | None needed | No login | Browse, search, chat (public), read motions, submit forms |
| Board member | @rrroca.org Google account | "Sign in with Google" (Azure SWA) | All resident capabilities + propose/second/vote + board agent context |
| Website maintainer | GitHub account (via RRROCA org) | Sign in to Decap CMS | Edit content via CMS, review PRs |
| Admin | GitHub org owner + Azure access | GitHub + Azure Portal | Full infrastructure control |

**Migration path:** When/if RRROCA moves from Google Workspace to Microsoft 365:
1. Change `identityProviders.google` → `identityProviders.azureActiveDirectory` in SWA config
2. Board members sign in with the same @rrroca.org email (now Microsoft identity)
3. Google Group → M365 Group for notifications
4. Board members experience zero change

---

## Graceful Degradation Map

Every enhanced experience has a fallback:

| Feature | Primary experience | If it fails |
|---|---|---|
| AI chatbot | Conversational Q&A + board context | Search bar, navigation, static FAQ |
| Board agent awareness | "You have 1 pending vote" | Board Action Center page shows all motions |
| Email notifications | board@rrroca.org gets notified | Board members check /board/actions/ directly |
| Google sign-in | One-click SSO | Board Action Center is read-only (motions visible, can't act) |
| Motion creation | Conversational via agent | Form-based via Board Action Center UI |
| Vote recording | Through agent or UI | Manual recording at board meeting |

**P6 in action:** The site never breaks. Features gracefully reduce to simpler alternatives.
