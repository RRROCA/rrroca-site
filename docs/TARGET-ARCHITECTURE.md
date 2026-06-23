# RRROCA Target Architecture

**Status:** Proposed target architecture for board review  
**Last updated:** June 2026  
**Authority:** This document is the current architectural reference for the RRROCA digital ecosystem. Where older Azure, Firebase, GitHub Pages, chatbot, or board-agent documents conflict with this document, this document takes precedence until the broader strategy is formally updated.

## 1. Strategic intent

RRROCA will pursue the **Frontier Community Association** vision: use modern technology and AI to reduce volunteer burden, preserve institutional knowledge, strengthen governance, and improve communication with residents.

The vision is an operating model, not a single application. RRROCA will not make the public website responsible for board operations, private records, meeting intelligence, or organizational identity.

The target outcome is:

- residents find reliable community information quickly;
- approved decisions and minutes are transparent;
- board records survive volunteer turnover;
- meetings produce accurate draft notes and actions with less manual effort;
- volunteers can publish and maintain content without specialist knowledge;
- AI assists drafting, summarizing, searching, and troubleshooting, while people retain approval authority.

## 2. Design principles

This architecture applies the principles in `architecture-principles.md` with four clarifications:

1. **Static-first, not static-only.** The public website remains static. Optional services may support private workflows when they provide clear value and have a manual fallback.
2. **AI assists; humans approve.** AI output is always draft material for minutes, policies, public content, safety information, and formal decisions.
3. **Shared ownership is the succession plan.** Organizational accounts, two administrators, current documentation, and tested handoffs are mandatory. AI is an accelerator, not the owner of the system.
4. **Optimize each platform for its audience.** The resident website and the private board operating environment are separate products connected through an approval and publishing workflow.

## 3. Platform responsibilities

### 3.1 Google Workspace — private digital operating system

Google Workspace is the system of work for RRROCA board operations and organizational knowledge.

It owns:

- board identities and role-based email;
- Gmail and Google Groups;
- Calendar and Google Meet;
- Shared Drives, Docs, Sheets, and Forms;
- draft minutes, working policies, meeting packages, recordings, and transcripts;
- private financial, membership, governance, and operational records;
- Gemini and NotebookLM capabilities where licensed and approved.

Google Workspace is not the public website platform.

### 3.2 GitHub — publishing and technical work platform

GitHub is the system of record for the website source and approved public content.

It owns:

- Hugo source, themes, configuration, and Markdown content;
- website change history;
- pull requests and technical review;
- automated tests and deployment workflows;
- website bugs, feature requests, and content-change requests;
- approved public records represented as website content.

GitHub is not the primary repository for private board records, full transcripts, financial documents, or member information.

### 3.3 Firebase Hosting — static public delivery

Firebase Hosting serves `rrroca.org` as a static website.

Phase 0 use is limited to:

- static HTML, CSS, JavaScript, and images;
- custom domain and HTTPS;
- redirects from legacy WordPress URLs;
- security and cache headers;
- static error pages;
- optional preview channels.

Phase 0 explicitly excludes:

- Cloud Run or Cloud Functions;
- Firebase Authentication;
- Firestore or other application databases;
- Gemini or other LLM APIs;
- public or board chat APIs;
- GitHub write tokens in runtime services;
- board voting, motion submission, or content publishing through an AI agent.

GitHub Pages remains a portable recovery option because the Hugo output can be deployed there with minimal effort. It is not a second active production target.

### 3.4 Communal — membership and transactions

Communal remains the system of record for:

- memberships;
- event and program registration;
- payments and related transactional communication;
- volunteer records where the platform is used for that purpose.

The website links to Communal rather than duplicating transactional workflows.

### 3.5 QuickBooks and Stripe — finance

QuickBooks remains the accounting system of record. Stripe and Communal support payment processing. Financial information is not stored in the website repository.

### 3.6 WhatsApp — informal coordination

WhatsApp remains appropriate for immediate, informal coordination. It is not the system of record for decisions, policies, expenditures, or commitments.

## 4. Information lifecycle

### 4.1 Private working information

Private and draft information remains in Google Shared Drives:

- meeting recordings and transcripts;
- draft agendas and minutes;
- draft policies and communications;
- contracts and vendor information;
- member, resident, or volunteer personal information;
- financial and confidential governance records.

### 4.2 Approved public information

After human review and approval, appropriate material is published through the website CMS or a pull request:

- approved minutes;
- approved public motions and outcomes;
- public policies;
- annual reports and approved financial summaries;
- news, events, safety notices, and community resources.

The publishing flow is:

```text
Google Workspace working document
        ↓
Human review and approval
        ↓
CMS or pull request
        ↓
GitHub commit and automated validation
        ↓
Firebase static deployment
```

## 5. AI strategy

### 5.1 Priority AI use cases

The initial AI priorities are internal and read-oriented:

1. Google Meet recording, transcription, and draft meeting notes;
2. draft minutes and action-item extraction;
3. institutional search through curated NotebookLM notebooks;
4. drafting and repurposing approved communications;
5. assistance maintaining and troubleshooting the Hugo site.

### 5.2 Meeting intelligence

Meeting intelligence is the first flagship Frontier CA capability.

Target workflow:

```text
Google Calendar and Meet
        ↓
Recording, transcript, and AI-generated notes
        ↓
Secretary verifies attendance, quorum, motions, votes, and actions
        ↓
Board approves official minutes
        ↓
Approved public minutes are published to the website
```

The recording and full transcript remain private unless the board explicitly approves otherwise. Recording, consent, in-camera handling, access, and retention must be governed by a board-approved policy.

### 5.3 Deferred AI capabilities

The following are deferred until the underlying manual workflows are proven and the board approves the risk and operating model:

- public resident chatbot;
- authenticated board assistant;
- AI-created motions or votes;
- AI tools that create GitHub issues or commit content;
- automatic publication of AI-generated material;
- custom cloud APIs for board operations.

Any future agentic action must use verified identity, explicit authorization, least privilege, server-enforced confirmation, complete audit history, and a manual fallback.

## 6. Board governance and work tracking

The public website must not become a prerequisite for conducting board business.

During the foundation phase:

- formal deliberation and voting follow the bylaws and approved board procedures;
- approved decisions are recorded in official minutes and the decision register;
- Google Forms, Sheets, Groups, or other board-approved Workspace tools may support agenda intake and action tracking;
- GitHub Issues and Projects are used primarily for website and technical work;
- electronic voting workflows are introduced only after governance requirements are verified and formally approved.

## 7. Delivery architecture

```text
Board and volunteers
        ↓
Google Workspace: private work, meetings, documents, Gemini
        ↓ human approval
GitHub: Hugo source, public content, review, tests
        ↓ automated static deployment
Firebase Hosting: rrroca.org
        ↓
Residents
```

Production must have one active deployment path. Azure Static Web Apps and Cloud Run are not part of the target Phase 0 architecture.

## 8. Security and resilience requirements

Before production cutover:

- every platform is owned by RRROCA rather than a personal account;
- at least two named administrators exist for Google, GitHub, Firebase, the domain registrar, Communal, and critical social accounts;
- individual administrator identities use MFA;
- shared passwords are eliminated where named access is possible;
- secrets remain in the deployment platform, never in source;
- the static site contains no personal or confidential board data;
- the deployment and recovery process is tested by someone other than the original implementer;
- legacy WordPress content and credentials are archived securely before shutdown;
- redirects, forms, external links, accessibility, and rollback are tested.

## 9. Roadmap

### Phase 0 — Foundation and launch

- establish organizational ownership and two-admin coverage;
- launch the Hugo website using Firebase Hosting as static delivery only;
- configure CMS access for non-technical publishing;
- complete content migration and legacy redirects;
- disable obsolete Azure and Cloud Run deployment paths;
- organize board records in Google Shared Drives;
- document the system of record for every information type;
- verify the governance basis for electronic decisions before automating them.

### Phase 1 — Meeting intelligence pilot

- evaluate the minimum Google Workspace licence footprint for the actual board;
- pilot Google Meet recording, transcription, and AI-generated notes;
- adopt consent, privacy, in-camera, and retention rules;
- measure secretary effort and accuracy over at least three meetings;
- publish only reviewed and approved minutes.

### Phase 2 — Institutional memory

- create curated NotebookLM notebooks for governance, onboarding, and selected portfolios;
- migrate and classify legacy board documents;
- create a decision register and consistent action tracking;
- test whether a new director can become productive in one afternoon.

### Phase 3 — Communication engine

- define content ownership and editorial cadence;
- use AI to draft and repurpose approved information for the website, email, newsletter, and social channels;
- evaluate Communal before adding another newsletter platform.

### Phase 4 — Selective automation

Automate only proven repetitive work with a named owner, measurable benefit, manual fallback, privacy assessment, and documented recovery process.

### Phase 5 — Evaluate custom AI applications

Consider read-only resident or board assistants only after the site, meeting process, document model, and publishing workflow are operating reliably.

## 10. Decision record

The earlier custom chatbot and board-agent direction demonstrated useful concepts but introduced runtime authentication, cloud APIs, GitHub write credentials, and operational complexity before the core website and board workflows were established. That implementation is not the Phase 0 target.

The Frontier CA vision remains. The revised sequence delivers the highest-value capabilities first: a reliable public site, meeting intelligence, institutional memory, and faster human-approved communication.