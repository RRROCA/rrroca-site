const fs = require('fs');
const path = require('path');

// Load knowledge base (built at deploy time)
let knowledgeBase = null;
const KB_PATH = path.join(__dirname, 'knowledge-base.json');
if (fs.existsSync(KB_PATH)) {
  knowledgeBase = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
}

const SYSTEM_PROMPT = `You are the RRROCA Community Assistant — a friendly, helpful AI for the Rocky Ridge Royal Oak Community Association website (rrroca.org) in NW Calgary, Alberta.

RULES:
- Answer ONLY from the knowledge base provided below. Do not invent information.
- If you don't know the answer, say so and suggest visiting rrroca.org or emailing info@rrroca.org.
- Keep answers concise (2-4 sentences max) unless the user asks for detail.
- Use friendly, welcoming tone appropriate for a community website.
- Include relevant page links in markdown format when helpful: [Link text](/path/)
- For emergencies, always direct to 911 first.
- Never discuss politics, religion, or controversial topics.
- Never provide legal, medical, or financial advice.

COMMUNITY KNOWLEDGE BASE:
${knowledgeBase ? knowledgeBase.pages.map(p => `## ${p.title} (${p.path})\n${p.content}`).join('\n\n') : 'Knowledge base not loaded.'}`;

module.exports = async function (context, req) {
  // CORS preflight is handled by SWA — just handle POST
  const { message, history } = req.body || {};

  if (!message) {
    context.res = { status: 400, body: { error: 'Missing "message" field' } };
    return;
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

  if (!endpoint || !apiKey) {
    context.res = {
      status: 503,
      body: { error: 'AI service not configured', fallback: true }
    };
    return;
  }

  // Build messages array with conversation history
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (history && Array.isArray(history)) {
    // Include last 6 turns max to stay within context limits
    const recentHistory = history.slice(-6);
    for (const turn of recentHistory) {
      if (turn.role && turn.content) {
        messages.push({ role: turn.role, content: turn.content });
      }
    }
  }

  messages.push({ role: 'user', content: message });

  try {
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages,
        max_tokens: 500,
        temperature: 0.3,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      context.log.error(`Azure OpenAI error: ${response.status} ${errBody}`);
      context.res = {
        status: 502,
        body: { error: 'AI service error', fallback: true }
      };
      return;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        reply,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
        }
      }
    };
  } catch (err) {
    context.log.error(`Chat function error: ${err.message}`);
    context.res = {
      status: 500,
      body: { error: 'Internal error', fallback: true }
    };
  }
};
