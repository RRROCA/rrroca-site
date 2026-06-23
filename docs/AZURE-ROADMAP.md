# Azure Roadmap — Historical Reference

**Status:** Superseded in June 2026  
**Current reference:** See `TARGET-ARCHITECTURE.md` and `ALM-ARCHITECTURE.md`.

## Decision

Azure Static Web Apps, Azure Functions, Azure OpenAI, Azure Communication Services, Application Insights, and Entra-based website identity are not part of RRROCA's Phase 0 target architecture.

The Phase 0 website is:

- built with Hugo;
- stored and reviewed in GitHub;
- deployed as static output to Firebase Hosting;
- independent of any application database, custom authentication layer, serverless API, or runtime AI service.

Google Workspace remains RRROCA's private operating environment for email, documents, meetings, collaboration, and future Gemini-enabled board workflows.

## Why this roadmap was retired

The Azure roadmap was created while the project was exploring a public chatbot, authenticated board tools, motion workflows, and serverless form processing. Those capabilities expanded the operating model before the public website, board document structure, and core publishing process were established.

The revised strategy keeps the Frontier Community Association vision but sequences the work differently:

1. launch a secure, static, resident-focused website;
2. organize private board records and workflows in Google Workspace;
3. pilot Google Meet recording, transcription, and AI-generated draft notes;
4. build institutional memory and communication workflows;
5. consider custom AI services only after a validated need and explicit board approval.

## Historical value

The prior Azure work remains useful as research and proof of concept. It demonstrated:

- static-site deployment patterns;
- optional enhancement layers;
- chatbot and agent concepts;
- identity and authorization requirements;
- cost and security controls;
- the operational complexity introduced by runtime AI and write-capable services.

It should not be treated as the current implementation plan.

## Reconsideration criteria

An Azure service may be reconsidered in the future only when:

- it solves a measured operational or resident problem;
- Google Workspace, GitHub, Firebase static hosting, Communal, or a managed third-party service cannot meet the need more simply;
- the board approves any material cost, privacy, identity, or governance implications;
- at least two people can administer it;
- it has a manual fallback and documented recovery path;
- it does not make the public website dependent on a custom backend.

## Current platform boundary

| Need | Current strategic platform |
|---|---|
| Private board work and knowledge | Google Workspace |
| Meetings, recordings, transcripts, AI notes | Google Meet and Gemini, subject to licensing and policy |
| Public website source and approved content | GitHub and Hugo |
| Public static delivery | Firebase Hosting |
| Memberships and program transactions | Communal |
| Finance | QuickBooks, Communal, and Stripe |
| Website and technical work tracking | GitHub Issues and Projects |

This file is retained so that future maintainers understand why Azure was evaluated and why it is not currently part of the target architecture.