# ALM / CI/CD Architecture

**Status:** Target Phase 0 delivery architecture  
**Last updated:** June 2026  
**Related:** See `TARGET-ARCHITECTURE.md` for the broader RRROCA digital operating model.

## Overview

RRROCA uses a Git-based publishing pipeline for a Hugo static website. GitHub stores the source and approved public content, CI validates changes, and Firebase Hosting serves the generated static files at `rrroca.org`.

The production website has no application database, custom authentication, public API, or runtime AI dependency.

## Deployment targets

| Environment | Platform | Purpose |
|---|---|---|
| **Production** | Firebase Hosting | Serve the static Hugo output at `rrroca.org` |
| **Pull-request validation** | GitHub Actions | Build and test proposed changes |
| **Preview** | Firebase preview channel when enabled | Visual review of selected pull requests |
| **Recovery option** | GitHub Pages or another static host | Documented portability path, not an active parallel production target |

There must be one active production deployment path. Azure Static Web Apps and Cloud Run are not part of the Phase 0 target architecture.

## Pipeline

```text
Content editor or technical maintainer
        ↓
CMS commit or pull request
        ↓
GitHub Actions
  1. Hugo build
  2. Unit and content tests
  3. Link validation
  4. End-to-end smoke tests when applicable
        ↓
Human approval where required
        ↓
Merge to master
        ↓
Static deploy to Firebase Hosting
```

## Change paths

### Content editing

Non-technical editors use the browser CMS. Approved content is stored as Markdown and images in the repository, then passes through the same validation and deployment pipeline as technical changes.

### Website requests

GitHub Issues may be used for:

- content corrections;
- broken links;
- website bugs;
- accessibility problems;
- feature requests;
- technical maintenance.

GitHub is not the default system for confidential board records, member information, full meeting transcripts, financial records, or general board voting.

### Technical changes

Design, template, configuration, workflow, and application-code changes require a pull request and review. AI coding tools may assist, but a person remains responsible for understanding and approving the change.

## Branch protection

The `master` branch should enforce:

- required build and test checks;
- pull requests for non-trivial technical changes;
- no force pushes or branch deletion;
- human review for workflow, template, JavaScript, configuration, and infrastructure changes;
- no direct runtime service credentials in source.

Content-only auto-merge may be retained only where the author is trusted, the changed paths are tightly constrained, and CI verifies the result.

## Testing strategy

| Layer | Purpose | Expected cadence |
|---|---|---|
| Hugo build | Validate templates, content, and configuration | Every pull request and production deployment |
| Jest/unit tests | Validate JavaScript and repository contracts | Every relevant pull request |
| Link validation | Detect broken internal links | Every pull request |
| Playwright/smoke tests | Validate navigation, rendering, and browser behaviour | Theme, layout, or JavaScript changes |
| Preview review | Validate visual and content quality | Material design or content changes |
| Production smoke test | Confirm critical resident journeys after deployment | Every production release |

## Hosting configuration

Firebase Hosting is limited to static delivery in Phase 0:

- custom domain and managed HTTPS;
- permanent redirects from legacy WordPress URLs;
- custom security headers;
- sensible cache policies;
- static 404 and error pages;
- optional preview channels.

It must not contain or route to:

- Cloud Run or Cloud Functions;
- Firebase Authentication;
- Firestore;
- Gemini or other LLM APIs;
- board action or voting APIs;
- GitHub write credentials;
- resident or board personal data.

## Secrets

The static site should require only deployment credentials needed by GitHub Actions. Credentials must be organization-owned and stored in GitHub repository or environment secrets.

Remove or decommission obsolete secrets after their related services are disabled, including Azure Static Web Apps, Azure OpenAI, Cloud Run chatbot, and custom board-authentication credentials.

## Operational ownership

- The repository belongs to the RRROCA GitHub organization.
- The Firebase project belongs to RRROCA, not an individual volunteer.
- At least two named people have appropriate GitHub and Firebase administrative access.
- MFA is required for administrators.
- A maintainer other than the original implementer must successfully perform a test deployment or recovery exercise.

## Recovery

The recovery objective is to redeploy the generated static website to another host within a few hours.

Required recovery assets:

- GitHub repository and full history;
- domain registrar access;
- Hugo version and build instructions;
- Firebase project access;
- redirect and header configuration;
- documented process for deploying to GitHub Pages or another static host;
- secure archive of the retired WordPress site during the agreed retention period.

## Deferred capabilities

The following are not part of Phase 0 ALM:

- resident AI chatbot;
- authenticated board assistant;
- agent-created GitHub issues or commits;
- automated motion creation or voting;
- automated publication of AI-generated content;
- transcript-to-publication automation without human approval.

These may be reconsidered after the static site, board document model, meeting-intelligence process, and human publishing workflow are operating reliably.