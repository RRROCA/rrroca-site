# Integrated Technology Strategy Update — June 2026

## Purpose

This addendum updates the implementation direction of the RRROCA Integrated Technology Strategy while retaining the **Frontier Community Association** vision and the architecture principles.

The strategy remains focused on reducing volunteer burden, preserving institutional knowledge, strengthening governance, and improving communication with residents. The change is in sequencing and platform boundaries, not ambition.

## What remains unchanged

RRROCA will continue to:

- replace the legacy WordPress site with a modern, resident-focused static website;
- keep public content portable in Markdown and version controlled in GitHub;
- use technology and AI to reduce repetitive volunteer work;
- improve transparency through timely, approved public information;
- protect continuity through organizational ownership, documentation, and multiple administrators;
- separate private board work from public community information;
- use Communal for membership, programs, registration, and transactions;
- retain Google Workspace as the board's familiar operational environment.

## What changes

### 1. Google Workspace becomes the private operating platform

Google Workspace is no longer described merely as a system requiring “no change.” It is the strategic private environment for:

- board identity and email;
- Shared Drives and organizational records;
- Docs, Sheets, Forms, and Calendar;
- Google Meet;
- meeting recordings, transcripts, and draft notes;
- Gemini and NotebookLM where licensed and approved.

### 2. Meeting intelligence becomes the first major AI capability

The highest-value AI opportunity is not a public chatbot. It is reducing the effort required to capture meetings, decisions, and actions.

RRROCA will evaluate a Google Meet and Gemini workflow that:

1. records and transcribes board meetings;
2. creates draft notes and action items;
3. requires secretary and board review;
4. keeps recordings and full transcripts private;
5. publishes only approved minutes and public decisions.

### 3. The public website remains static

The website will remain a Hugo static site with source and approved public content in GitHub. Firebase Hosting will serve the static output at `rrroca.org`.

Firebase is a delivery platform in the foundation phase, not an application platform. Cloud Run, Firebase Authentication, Firestore, and runtime Gemini APIs are deferred.

### 4. GitHub is narrowed to its strongest role

GitHub remains the platform for:

- website source and content history;
- technical and website work tracking;
- pull requests, automated validation, and deployment;
- approved public records published as website content.

Private board records, full meeting transcripts, member information, financial records, and general board governance remain in Google Workspace or their appropriate systems of record.

### 5. Custom chatbot and board-agent features are deferred

The current chatbot and write-capable board-agent direction is not part of the foundation phase.

Deferred capabilities include:

- public AI community assistant;
- authenticated board chatbot;
- AI-created motions, votes, issues, or content commits;
- direct publication of AI-generated content;
- custom cloud APIs for board operations.

These may be reconsidered after the public website, meeting process, document structure, and publishing workflow are established and measured.

## Revised system-of-record model

| Information or capability | System of record / strategic platform |
|---|---|
| Board identities and email | Google Workspace |
| Private working documents | Google Shared Drives |
| Meetings, recordings, and transcripts | Google Calendar, Meet, and Drive |
| AI-assisted meeting notes and knowledge work | Gemini and NotebookLM, subject to licensing and policy |
| Approved public website content | Hugo Markdown in GitHub |
| Website source, review, and technical work | GitHub |
| Public website delivery | Firebase Hosting, static only |
| Memberships, programs, and payments | Communal and Stripe |
| Financial records | QuickBooks |
| Informal coordination | WhatsApp |

## Revised roadmap

### Phase 0 — Foundation and launch

- launch the static Hugo website;
- complete content migration and redirects;
- establish organization ownership and two-admin coverage;
- configure browser-based content management;
- organize private board records in Shared Drives;
- document systems of record and publishing responsibilities;
- retire obsolete Azure and custom-backend deployment paths;
- verify governance requirements before automating electronic decisions.

### Phase 1 — Meeting intelligence pilot

- rationalize Google Workspace accounts and confirm the minimum licensed board cohort;
- pilot Meet recording, transcription, and AI-generated draft notes;
- adopt recording, privacy, consent, in-camera, and retention rules;
- measure time saved and note accuracy over multiple meetings;
- publish only reviewed and approved minutes.

### Phase 2 — Institutional memory

- curate governance and onboarding sources;
- create NotebookLM notebooks where appropriate;
- establish a decision register and consistent action tracking;
- improve new-director onboarding and handoff.

### Phase 3 — Communications engine

- define content owners and cadence;
- use AI to draft and repurpose approved content;
- coordinate website, email, newsletter, and social publishing;
- evaluate Communal before introducing additional communications platforms.

### Phase 4 — Selective automation

Automate only proven repetitive processes with a named owner, measurable benefit, human approval, privacy review, manual fallback, and documented recovery process.

### Phase 5 — Custom AI evaluation

Evaluate read-only resident or board assistants only after the underlying information, governance, and publishing systems are reliable.

## Strategic conclusion

The Frontier Community Association vision remains the destination.

RRROCA will achieve it by making the daily work of volunteers easier and more durable—not by making the public website responsible for every organizational process.

The signature outcome is:

> RRROCA meetings produce accurate draft minutes and actions quickly; organizational knowledge survives turnover; volunteers can find and publish what they need; approved information reaches residents reliably; and technology reduces volunteer effort instead of creating more of it.

See `TARGET-ARCHITECTURE.md` for the authoritative platform design and `ALM-ARCHITECTURE.md` for the website delivery model.