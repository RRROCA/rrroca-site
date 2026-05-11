# RRROCA Azure Services Roadmap

This roadmap documents a conservative, additive use of Azure services for the RRROCA website. The website's core platform remains Hugo on GitHub Pages: free, simple, portable, and resilient to volunteer turnover. Azure services are planned only as optional enhancements that improve forms, notifications, monitoring, or identity without becoming hard dependencies. It also creates a practical roadmap for work led by Chad La Fournie in his RRROCA role as Safety & Technology Director and, professionally, as a Microsoft Azure Technical Specialist (L64).

## Philosophy

- **GitHub Pages remains the host** for the public website, aligned to **P1 Survive Turnover** and **P2 Zero Cost by Default**.
- **Azure services are optional enhancements**, not prerequisites. If any service fails or is removed, the public site still works, consistent with **P6 Graceful Degradation**.
- **Each service must satisfy two tests:** it must map cleanly to RRROCA architecture principles, and it must provide credible **L64 Azure Technical Specialist (ATS)** evidence through real design and implementation work.
- **All planned services are constrained to free tiers or included free usage.** If a service cannot stay free, it should not become part of the core design.

## Planned Services

### Phase 1: Foundation (Current)

#### Cloudflare Workers

Cloudflare Workers is not an Azure service, but it belongs in the roadmap because it is already deployed as the OAuth authenticator for the CMS. It establishes the pattern RRROCA will follow for future cloud enhancements: small, low-cost, low-maintenance services wrapped around a static site rather than replacing it.

- **Current role:** OAuth authenticator for CMS access
- **Why it matters:** proves RRROCA can add cloud capabilities without changing the core hosting model
- **Principles:** P1 (survives turnover when documented and shared), P3 (minimal maintenance), P6 (public site remains available even if CMS auth is unavailable)
- **L64 evidence:** edge authentication design, OAuth integration, lightweight cloud service deployment

### Phase 2: Forms & Communication

#### Azure Functions

Azure Functions is the preferred path for serverless form processing once RRROCA is ready to replace third-party form handlers.

- **Use case:** contact, volunteer, and safety report forms
- **Free tier:** **1 million executions/month**
- **Replaces:** Formspree or similar third-party form handler
- **Why it fits RRROCA:** keeps the website static while enabling lightweight server-side workflows only where needed
- **Principles:** **P2** (free), **P5** (no database required), **P6** (forms degrade to `mailto:` links if unavailable)
- **L64 evidence:** serverless architecture, API design, Azure Functions deployment, secure input handling

#### Azure Communication Services

Azure Communication Services adds optional outbound email for time-sensitive community notifications.

- **Use case:** when a safety alert is published on the site, email subscribers automatically
- **Free tier:** **100 emails/day**
- **Why it fits RRROCA:** residents who rely on email get faster notification, while the website remains the source of truth
- **Principles:** **P0** (community safety), **P2** (free tier), **P6** (site works without email delivery)
- **L64 evidence:** event-driven architecture, Azure Communication Services integration, notification workflow design

### Phase 3: Intelligence

#### Azure Monitor / Application Insights

Azure Monitor and Application Insights provide basic observability without introducing operational complexity to the public site.

- **Use case:** understand which pages residents use most and detect broken links or degraded user journeys
- **Free tier:** **5 GB/month data ingestion**
- **Why it fits RRROCA:** supports better decisions about resident information needs without affecting the site's core reliability
- **Principles:** **P0** (improve engagement through data), **P2** (free), **P3** (low maintenance)
- **L64 evidence:** observability design, monitoring strategy, telemetry interpretation

### Phase 4: Identity (Future — if Google → Microsoft migration)

#### Entra External ID

Entra External ID is a future option only if RRROCA chooses to move board operations from Google to Microsoft 365. It is not required for the public website and should not be introduced early.

- **Use case:** single sign-on for board members across CMS, email, Teams, and related internal tools
- **Replaces:** individual GitHub-account-only authentication patterns for board workflows
- **Why it fits RRROCA:** simplifies internal access only when the surrounding Microsoft identity estate exists
- **Principles:** **P4** (simplified login), **P5** (centralized identity), **P6** (public site remains unaffected if identity is unavailable)
- **L64 evidence:** identity architecture, Entra External ID design, B2C-style access patterns
- **Timeline:** only when and if RRROCA migrates to Microsoft 365

## Decision Framework Alignment

The table below maps each planned service to the most relevant questions in RRROCA's 10-question decision framework.

| Service | Q0 Engagement | Q1 Disappears | Q2 Cost | Q3 Maintenance | Q6 Requires Chad | Q9 AI-assistable |
|---|---|---|---|---|---|---|
| Cloudflare Workers | Indirectly yes — enables secure CMS publishing | **Yes** — CMS auth may be unavailable, but public site still works | **$0** on free tier | Low | **No**, if documented with shared admin access | **Yes** — small text-based service |
| Azure Functions | **Yes** — improves contact, volunteer, and safety reporting | **Yes** — forms fall back to `mailto:` links | **$0** within free tier | Low | **No**, if deployed in a shared Azure environment with documentation | **Yes** — standard serverless code and config |
| Azure Communication Services | **Yes** — faster safety communication to residents | **Yes** — alerts still publish on the website | **$0** within free quota | Low | **No**, if configuration and runbooks are shared | **Yes** — straightforward event + email workflow |
| Azure Monitor / Application Insights | Indirectly yes — improves site usefulness over time | **Yes** — monitoring loss does not affect visitors | **$0** within free tier | Low | **No** — shared dashboard access is sufficient | **Yes** — telemetry and configuration are AI-friendly |
| Entra External ID | Indirectly yes — improves board operations, not resident-facing content | **Yes** — only internal sign-in is affected; public site remains up | **$0** only if kept within free/included usage under a future M365 path | Medium | **No**, if tenant ownership is organizational rather than personal | **Yes** — identity flows are well-documented and AI-assistable |

## What We Won't Do

- **Move hosting from GitHub Pages to Azure Static Web Apps.** That would violate **P1** by increasing bus-factor risk and making the public site more dependent on Azure-specific operational knowledge.
- **Use Azure SQL or Cosmos DB for the website.** That would violate **P5** by adding unnecessary state, operational burden, and attack surface to a site designed to stay static-first.
- **Build custom authentication before RRROCA actually needs it.** That would violate **YAGNI** and add complexity before the Association has a clear operational reason to carry it.

## Recommendation

RRROCA should continue treating Azure as an enhancement layer, not a hosting strategy. The right sequence is: keep the public site static and durable, add Azure Functions and Azure Communication Services only when they replace manual work, add observability when there is enough traffic to learn from, and defer identity modernization until a broader Microsoft 365 decision exists.
