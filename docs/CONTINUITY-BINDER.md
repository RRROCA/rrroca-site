# RRROCA Website Continuity Binder

> **Purpose**: Everything a new maintainer needs to keep rrroca.org running.
> If you're reading this because the previous maintainer is unavailable — don't panic. This site is designed to run with minimal intervention.

**Last updated**: May 2026
**Current maintainer**: Chad LaFournie (VP / ATS)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   rrroca.org                        │
│                 Firebase Hosting                    │
│         (auto-deployed from master branch)          │
└──────────────────────┬──────────────────────────────┘
                       │ Hugo build
┌──────────────────────┴──────────────────────────────┐
│              GitHub Repository                      │
│         github.com/RRROCA/rrroca-site              │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ content/    │  │ themes/      │  │ static/   │  │
│  │ (markdown)  │  │ rrroca/      │  │ admin/    │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ Sveltia CMS + /api/chat
┌──────────────────────┴──────────────────────────────┐
│      Content Management System + Chatbot API        │
│     rrroca.org/admin/ (browser-based editor)        │
│             Auth via GitHub PKCE                    │
│        /api/chat → Cloud Run → Gemini              │
└─────────────────────────────────────────────────────┘
```

**Stack**: Hugo static site generator → GitHub (source) → Firebase Hosting (hosting) + Cloud Run (chatbot API)

**How content flows**:
1. Board member edits content at `rrroca.org/admin/` (content management system)
2. Sveltia CMS commits the change directly to the `master` branch on GitHub
3. GitHub Actions runs CI (build + tests)
4. Firebase Hosting auto-deploys the new build to production

---

## 2. Service Inventory

| Service | Purpose | URL / Location | Owner |
|---------|---------|---------------|-------|
| **GitHub repo** | Source code & CI/CD | github.com/RRROCA/rrroca-site | RRROCA org |
| **Firebase Hosting** | Production hosting | rrroca-site.web.app | Firebase project rrroca-site |
| **Domain registrar** | rrroca.org domain | _See credentials vault_ | RRROCA board |
| **Cloud Run** | AI chatbot API | rrroca-chatbot.us-central1.run.app | Firebase project rrroca-site |
| **Gemini API** | AI model for chatbot | aistudio.google.com | Google AI Studio |
| **Communal** | Membership management | rrroca.getcommunal.com | RRROCA board |
| **Facebook Page** | Social media | facebook.com/rrroca.org | RRROCA board |
| **Facebook Group** | Community group | facebook.com/groups/royaloakrockyridgefamilies | RRROCA board |

---

## 3. Credentials & Access

> **⚠️ No credentials are stored in this document or anywhere in the repository.**

All credentials are stored in: **[INSERT SECURE LOCATION — e.g., RRROCA Board shared password manager or encrypted document]**

Access to the credentials vault is granted to: **President + VP (minimum two people)**

### What's in the vault

| Credential | What it's for | Who needs it |
|-----------|--------------|-------------|
| GitHub org owner credentials | Managing repo settings, branch protection, Actions secrets | Technical maintainer |
| Firebase / Google Cloud console login | Firebase Hosting, Cloud Run, custom domain, SSL | Technical maintainer |
| Domain registrar login | DNS records, domain renewal | President or VP |
| Google AI Studio / Gemini access | Chatbot model access and API key management | Technical maintainer |
| Communal admin | Membership portal configuration | Membership Director |
| `FIREBASE_SERVICE_ACCOUNT` | GitHub Actions secret for Firebase Hosting deployment | Set in GitHub repo settings |
| `WIF_PROVIDER` + `WIF_SERVICE_ACCOUNT` | GitHub Actions auth for Cloud Run deployment | Set in GitHub repo settings |

### GitHub repository access

The repo lives under the **RRROCA** GitHub organization. To add a new maintainer:
1. Invite them to the RRROCA org
2. Grant them **Write** or **Admin** access to `rrroca-site`
3. They'll need a GitHub account (free tier is fine)

---

## 4. Day-to-Day Operations

### Adding news or events (non-technical)
1. Go to `rrroca.org/admin/`
2. Log in with GitHub
3. Select the collection (News, Events, etc.)
4. Click "New" and fill in the fields
5. Save — the site updates automatically in ~2 minutes

### Updating a board member
1. Go to `rrroca.org/admin/` → Board Members
2. Edit the entry or create a new one
3. To add a photo: upload to `static/images/board/` and reference in the bio

### Publishing a board motion
1. Go to GitHub → Issues → New Issue → "Board Motion" template
2. Fill in the motion details (mover, seconder, text, result)
3. Close the issue → the motion auto-publishes to the website

---

## 5. Common Maintenance Tasks

### Domain renewal
- **Frequency**: Annual
- **Action**: Log into domain registrar, renew `rrroca.org`
- **Risk if missed**: Site goes offline. DNS records point nowhere.
- **Lead time**: Renew at least 30 days before expiry

### SSL certificate
- **Managed by**: Firebase Hosting (automatic)
- **Action needed**: None — auto-renews as long as DNS is correct

### Dependency updates
- **Frequency**: Quarterly recommended
- **Action**: Update `package.json` dependencies, run `npm ci && npx jest`
- **Hugo version**: Currently v0.161.1 — update cautiously, test locally first
- **Sveltia CMS**: Pinned version with integrity hash in `static/admin/index.html`

### Annual checklist
- [ ] Domain renewed
- [ ] Board member pages updated after AGM
- [ ] Meeting schedule updated for new year
- [ ] Verify CMS login still works (GitHub PKCE)
- [ ] Review and rotate any API tokens/secrets
- [ ] Confirm at least 2 people have credentials vault access

---

## 6. Incident Response

### Site is down
1. Check [Google Cloud Service Health](https://status.cloud.google.com/) — are Firebase Hosting and Cloud Run healthy?
2. Check DNS: `nslookup rrroca.org` — does it resolve?
3. Check GitHub Actions: is the latest build green?
4. If DNS is wrong → log into domain registrar, verify records
5. If build is broken → revert the last commit on `master`

### CMS login not working
1. Check `rrroca.org/admin/` — does the GitHub sign-in flow load correctly?
2. If sign-in fails → review the GitHub PKCE configuration in the Firebase / GCP console and `static/admin/config.yml`
3. Fallback: edit content files directly on GitHub (no CMS needed)

### Chatbot not working
1. Check Cloud Run service health for `rrroca-chatbot`
2. Check GitHub Actions: did `chatbot-deploy.yml` succeed?
3. Verify Gemini API access, quotas, and secrets in Google AI Studio / Google Cloud
4. Fallback: the public site still works even if the chatbot is temporarily unavailable

### Site shows old content
1. Check GitHub Actions — did the build succeed?
2. Firebase Hosting may take 1-2 minutes to propagate
3. Try hard-refresh (Ctrl+Shift+R) or incognito window
4. If stuck → trigger manual redeploy from GitHub Actions or the Firebase console

### Accidental bad content published
1. Go to GitHub → repository → find the bad commit
2. Click "Revert" to create a revert commit
3. Or: edit the file directly on GitHub to fix it
4. The CI pipeline will rebuild and redeploy automatically

---

## 7. GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to master | Build Hugo site, run Jest tests, deploy to GitHub Pages (staging) |
| `firebase-deploy.yml` | Push/PR to master | Deploy to Firebase Hosting (production + preview channels) |
| `chatbot-deploy.yml` | Push to master (chatbot/content changes) | Deploy the Cloud Run chatbot API |
| `auto-merge-content.yml` | PR from Sveltia CMS | Auto-merge content-only PRs from the CMS |
| `merge-on-approve.yml` | PR approval | Auto-merge approved PRs (mobile-friendly approval flow) |
| `motion-publish.yml` | Issue closed with "motion" label | Auto-publish board motions from GitHub Issues |
| `test-coverage.yml` | PR with test file changes | Run targeted test coverage |

---

## 8. Technical Reference

### Local development
```bash
# Prerequisites: Git, Hugo (v0.161.1 extended), Node.js (v20+)

git clone https://github.com/RRROCA/rrroca-site.git
cd rrroca-site
npm ci                    # Install test dependencies
hugo server               # Local dev server at localhost:1313

# Before committing
hugo --quiet              # Verify build
npx jest --verbose        # Run all tests
```

### Key files
| File | Purpose |
|------|---------|
| `hugo.toml` | Site configuration (title, menus, params) |
| `firebase.json` | Firebase Hosting rewrites, caching, and security headers |
| `static/admin/config.yml` | Content management system collections and fields |
| `cloud-run/chatbot/` | Cloud Run chatbot service and Gemini integration |
| `themes/rrroca/layouts/` | HTML templates (Hugo) |
| `themes/rrroca/assets/css/style.css` | Stylesheet (processed by Hugo Pipes) |
| `themes/rrroca/static/js/` | JavaScript files |
| `content/` | All site content (markdown files) |
| `tests/` | Jest test suite (150+ tests) |

### Content structure
```
content/
├── news/              # News articles
├── events/            # Community events
├── community/         # Community pages
├── safety/            # Safety resources
├── sports/            # Sports programs
├── board/             # Board governance & motions
├── about/             # About pages & board members
│   └── board-members/ # Individual board member bios
└── business-directory/ # Local business listings
```

---

## 9. Transferring Ownership

If the current maintainer is leaving the board:

### Before departure (2-week minimum lead time)
1. **Credentials**: Ensure all items in Section 3 are in the shared vault
2. **GitHub**: Transfer org ownership or add new admin
3. **Firebase / GCP**: Add new maintainer as admin on the `rrroca-site` project
4. **Google AI**: Ensure Gemini API access and Cloud Run deployment access are shared
5. **Domain**: Verify registrar account is accessible by at least one other board member
6. **Walkthrough**: 1-hour session covering Sections 4-6 of this document

### If maintainer is suddenly unavailable
1. **Content updates**: Any board member with GitHub access can edit files directly on github.com — no technical skills needed for simple text changes
2. **Site stays running**: Firebase Hosting, Cloud Run, and DNS continue without intervention
3. **CMS keeps working**: As long as GitHub PKCE auth remains active
4. **Find help**: Contact a local tech volunteer or post in [Calgary tech community groups]
5. **Fallback maintainer**: [INSERT PRE-APPROVED CONTACT — ideally a tech-savvy community member who has agreed to help in emergencies]

### What will NOT break without a maintainer
- ✅ Site stays online (Firebase Hosting is fully managed)
- ✅ SSL certificates auto-renew
- ✅ Existing content remains accessible
- ✅ CMS continues working for edits

### What WILL eventually need attention
- ⚠️ Domain renewal (annual)
- ⚠️ Dependency updates (security patches)
- ⚠️ GitHub Actions workflow changes (if GitHub changes CI features)
- ⚠️ Cloud Run / Gemini quotas, secrets, or project access drift

---

## 10. Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Current maintainer | Chad LaFournie | info@rrroca.org |
| Board President | _[Name]_ | president@rrroca.org |
| Fallback technical contact | _[To be appointed]_ | _[Contact]_ |
| Domain registrar support | _[Registrar name]_ | _[Support URL]_ |
| Firebase / Google Cloud support | Google | console.firebase.google.com |

---

*This document should be reviewed and updated annually at the AGM or whenever there is a change in technical maintainer.*
