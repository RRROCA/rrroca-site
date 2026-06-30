# RRROCA Board Content Guide (Phase 1)

This guide is for board members and volunteers who publish website information.

## CMS Access

- **CMS URL:** `https://rrroca.org/admin/`
- Sign in with the approved GitHub account for content editing
- Use the CMS only for content you are authorized to edit

## What the Website Handles in Phase 1

- Public information pages
- News and event publishing
- Safety updates
- Programs and facilities information
- Volunteer and contact information
- Governance documents and board reference pages

## What Is Not Included in Phase 1

- Chatbot features
- Board sign-in workflows
- Motion proposal/second/voting automation
- Custom API-driven features

## How to Publish Updates

### Option A: Browser-based CMS
1. Open `https://rrroca.org/admin/`.
2. Edit the content entry (news, event, page, or board content).
3. Save and publish.
4. Confirm the related pull request/checks complete.

### Option B: GitHub Content Edit
1. Edit the markdown file in `content/`.
2. Open a pull request.
3. Wait for required checks.
4. Merge after approval.

## Where to Reference Content Rules

- `static/admin/config.yml` — CMS collections and fields
- `content/` — source markdown content
- `docs/RUNBOOK.md` — publishing workflow and operational steps
- `docs/architecture-principles.md` — architecture direction and constraints

## Governance Content Best Practices

- Keep board pages informational and document-focused
- Link to approved governance documents only
- Use role-based contact addresses (for example, `info@rrroca.org`)
- Avoid embedding process automation in content pages

## Support

- Website/content issue: open a GitHub issue
- Access issue: contact the repository maintainers
