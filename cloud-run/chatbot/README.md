# RRROCA Chatbot — Cloud Run + Gemini

Rewrite of the Azure OpenAI chatbot for Google Cloud Run with Gemini.

## Architecture

```
Firebase Hosting (rrroca-site.web.app)
  └── /api/chat → Cloud Run (rrroca-chatbot)
                    └── Gemini 2.0 Flash
                    └── GitHub API (motions, content, issues)
```

## Local Development

```bash
cd cloud-run/chatbot
cp .env.example .env
# Fill in GEMINI_API_KEY and GITHUB_TOKEN
npm install
npm run dev
```

Test:
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What events are coming up?"}'
```

## Deployment

Automatic on push to `master` when files in `cloud-run/chatbot/` or `content/` change.

### Manual deployment

```bash
cd cloud-run/chatbot
gcloud run deploy rrroca-chatbot \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_MODEL=gemini-2.0-flash" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,GITHUB_TOKEN=github-bot-token:latest"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | From aistudio.google.com/apikey |
| `GEMINI_MODEL` | No | Default: `gemini-2.0-flash` |
| `GITHUB_TOKEN` | Yes | PAT with `repo` scope for RRROCA/rrroca-site |
| `ALLOWED_ORIGINS` | No | Comma-separated origins |
| `DAILY_LIMIT` | No | Max requests/day (default: 200) |
| `RATE_LIMIT_RPM` | No | Per-IP limit (default: 6/min) |

## Features Ported from Azure Version

- ✅ Community knowledge base (RAG from site content)
- ✅ Injection detection (11 patterns)
- ✅ Rate limiting (per-IP + daily global)
- ✅ Board member authentication
- ✅ Tool: submit_motion
- ✅ Tool: create_content
- ✅ Tool: update_content
- ✅ Tool: report_issue
- ✅ Tool: submit_community_suggestion
- ✅ Board context (open motions, community suggestions)
- ✅ CORS (configurable origins)
- ✅ Write rate limiting for board tools

## Cost

- Gemini 2.0 Flash: ~$0.10/1M input tokens, $0.40/1M output tokens
- Cloud Run: $0 at low traffic (free tier: 2M requests/month)
- Estimated: < $5/month for community chatbot usage
