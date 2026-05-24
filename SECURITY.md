# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the RRROCA website or its
infrastructure, please report it responsibly.

**Email:** [board@rrroca.org](mailto:board@rrroca.org)

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will acknowledge receipt within **48 hours** and aim to resolve
confirmed issues within **7 days**.

## Scope

This policy covers:
- The RRROCA website (rrroca.org / Azure Static Web Apps)
- GitHub Actions workflows and CI/CD pipeline
- CMS admin interface (Sveltia CMS)
- AI Chatbot (Azure OpenAI backend + Azure Functions API)

## Out of Scope

- Third-party services (Google Fonts, unpkg CDN)
- Social media integrations

## Security Measures

### Code & CI

- **Secret scanning** — enabled with push protection
- **Dependabot alerts** — monitors npm dependencies
- **CodeQL analysis** — static analysis on JavaScript/TypeScript
- **Branch protection** — required CI checks before merge
- **Content Security** — Jest security test suite validates built output

### AI Chatbot Hardening

- **Prompt injection detection** — regex-based input validation blocks known jailbreak patterns server-side
- **Azure OpenAI content filters** — DefaultV2 policy with jailbreak/prompt shields, hate, violence, sexual, self-harm (all blocking at Medium threshold)
- **Tool-gating (defense in depth)** — three independent layers prevent unauthorized tool execution:
  1. Non-board users only receive community tools in the OpenAI request
  2. Server-side allowlist check before any tool is executed
  3. `executeTool()` independently enforces auth for board-only tools
- **PII protection** — community suggestion emails are masked in public GitHub Issues; full contact details stored server-side only (Application Insights)
- **Rate limiting** — 6 requests/min per IP, 200/day global, 2 suggestions/day per IP
- **Board identity** — `x-ms-client-principal` injected by Azure SWA (cannot be spoofed externally); verified against `@rrroca.org` email domain
- **API isolation** — Azure Functions run as SWA managed functions with no independent public endpoint

### Azure Infrastructure

- **TPM quota cap** — Azure OpenAI deployment limited to 10K tokens/min (prevents runaway costs)
- **Budget alert** — $50/month cap on `rg-rrroca` resource group; alerts at $20 and $45 to safety@rrroca.org
- **Auth providers restricted** — only Google OAuth enabled; GitHub, Twitter, AAD providers return 404
- **Security headers** — HSTS, X-Frame-Options, CSP, X-Content-Type-Options configured globally
