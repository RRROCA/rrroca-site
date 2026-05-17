const crypto = require('crypto');

const GITHUB_OWNER = 'RRROCA';
const GITHUB_REPO = 'rrroca-site';
const MOTION_LABEL = 'motion';
const AWAITING_SECOND_LABEL = 'awaiting-second';
const OPEN_FOR_VOTE_LABEL = 'open-for-vote';
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const EMAIL_DOMAIN = '@rrroca.org';
const MOTION_META_REGEX = /<!--\s*RRROCA_MOTION_META:\s*([\s\S]*?)\s*-->/i;
const MOTION_EVENT_REGEX = /<!--\s*RRROCA_MOTION_EVENT:\s*([\s\S]*?)\s*-->/i;
const allowedOrigins = new Set([
  'https://rrroca.github.io',
  'https://rrroca.org',
  'https://www.rrroca.org',
  'https://zealous-wave-07c275a0f.7.azurestaticapps.net'
]);
const rateLimitStore = global.__RRROCA_MOTION_RATE_LIMITS || new Map();
global.__RRROCA_MOTION_RATE_LIMITS = rateLimitStore;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isBoardEmail(email) {
  return normalizeEmail(email).endsWith(EMAIL_DOMAIN);
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function parseEmbeddedJson(source, pattern) {
  const match = String(source || '').match(pattern);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    return null;
  }
}

function extractMotionMeta(issueBody) {
  return parseEmbeddedJson(issueBody, MOTION_META_REGEX) || {};
}

function extractMotionEvent(commentBody) {
  return parseEmbeddedJson(commentBody, MOTION_EVENT_REGEX);
}

function corsHeaders(origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin'
  };

  if (allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }

  return headers;
}

function respond(context, origin, status, body) {
  context.res = {
    status,
    headers: corsHeaders(origin),
    body
  };
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body[field] || '').trim());
  if (missing.length) {
    throw new Error(`Missing required field(s): ${missing.join(', ')}`);
  }
}

function enforceRateLimit(email) {
  const key = normalizeEmail(email);
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }

  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return true;
}

function sanitizeText(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function summarize(text) {
  const compact = sanitizeText(text).replace(/\s+/g, ' ');
  if (!compact) {
    return 'No summary provided.';
  }

  return compact.length > 180 ? `${compact.slice(0, 179).trim()}…` : compact;
}

function deriveMotionNumber(issue) {
  const created = issue && issue.created_at ? new Date(issue.created_at) : new Date();
  const year = Number.isNaN(created.getTime()) ? new Date().getUTCFullYear() : created.getUTCFullYear();
  return `${year}-${String(issue.number).padStart(3, '0')}`;
}

function stripMotionPrefix(title) {
  return String(title || '').replace(/^Motion\s+\d{4}-\d+:\s*/i, '').trim();
}

function buildIssueBody(payload) {
  const amount = payload.amount ? Number(payload.amount) : null;
  const meta = {
    motionText: sanitizeText(payload.motionText),
    background: sanitizeText(payload.background),
    category: sanitizeText(payload.category) || 'Other',
    amount: Number.isFinite(amount) ? amount : null,
    portfolio: sanitizeText(payload.portfolio),
    deadline: sanitizeText(payload.deadline),
    supportingDocs: sanitizeText(payload.supportingDocs),
    proposerName: sanitizeText(payload.proposerName),
    proposerEmailHash: hashEmail(payload.proposerEmail),
    submittedAt: new Date().toISOString()
  };

  const lines = [
    '## Motion Summary',
    '',
    `**Proposed by:** ${meta.proposerName}`,
    `**Category:** ${meta.category}`,
    meta.portfolio ? `**Portfolio:** ${meta.portfolio}` : '',
    Number.isFinite(meta.amount) ? `**Amount:** CAD ${meta.amount.toFixed(2)}` : '**Amount:** No spending requested',
    meta.deadline ? `**Decision requested by:** ${meta.deadline}` : '',
    '',
    '## Motion Text',
    '',
    meta.motionText,
    '',
    '## Why This Is Needed',
    '',
    meta.background,
    '',
    '## Supporting Links or Documents',
    '',
    meta.supportingDocs || 'None provided.',
    '',
    '_Submitted through the RRROCA Board Action Center. A seconder is required before voting opens._',
    '',
    `<!-- RRROCA_MOTION_META: ${JSON.stringify(meta)} -->`
  ].filter(Boolean);

  return lines.join('\n');
}

function buildSecondComment(name, email) {
  const event = {
    type: 'second',
    name: sanitizeText(name),
    emailHash: hashEmail(email),
    recordedAt: new Date().toISOString()
  };

  return `Seconded by **${event.name}**.\n\n<!-- RRROCA_MOTION_EVENT: ${JSON.stringify(event)} -->`;
}

function buildVoteComment(name, email, vote) {
  const event = {
    type: 'vote',
    vote,
    name: sanitizeText(name),
    emailHash: hashEmail(email),
    recordedAt: new Date().toISOString()
  };

  return `Vote recorded: **${event.name}** voted **${vote.toUpperCase()}**.\n\n<!-- RRROCA_MOTION_EVENT: ${JSON.stringify(event)} -->`;
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const method = options.method || 'GET';

  if (method !== 'GET' && !token) {
    const error = new Error('GITHUB_TOKEN is not configured for motion writes. Add it to the Static Web App application settings.');
    error.status = 503;
    throw error;
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'RRROCA-Board-Action-Center',
    'X-GitHub-Api-Version': '2022-11-28',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data && data.message ? data.message : 'GitHub API request failed.');
    error.status = response.status;
    throw error;
  }

  return data;
}

async function fetchIssue(issueNumber) {
  return githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`);
}

async function fetchComments(issueNumber) {
  return githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/comments?per_page=100`);
}

async function updateIssueLabels(issue, addLabels = [], removeLabels = []) {
  const currentLabels = Array.isArray(issue.labels)
    ? issue.labels.map((label) => (typeof label === 'string' ? label : label.name)).filter(Boolean)
    : [];
  const nextLabels = [...new Set(currentLabels.filter((label) => !removeLabels.includes(label)).concat(addLabels))];

  await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}`, {
    method: 'PATCH',
    body: { labels: nextLabels }
  });
}

function parseBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    return req.body.trim() ? JSON.parse(req.body) : {};
  }

  return req.body;
}

function getSecondEvent(issue, comments) {
  const structuredSecond = comments
    .map((comment) => extractMotionEvent(comment.body))
    .find((event) => event && event.type === 'second');

  if (structuredSecond) {
    return structuredSecond;
  }

  if (Number(issue.reactions && issue.reactions.hooray) > 0) {
    return { name: 'Recorded on GitHub', recordedAt: issue.updated_at, legacy: true };
  }

  return null;
}

function getVoteSummary(issue, comments) {
  const tally = {
    for: Number(issue.reactions && issue.reactions['+1']) || 0,
    against: Number(issue.reactions && issue.reactions['-1']) || 0,
    abstain: 0
  };
  const votesByEmail = new Map();

  comments.forEach((comment) => {
    const event = extractMotionEvent(comment.body);
    if (!event || event.type !== 'vote') {
      return;
    }

    const key = event.emailHash || `${event.name}-${event.recordedAt}`;
    votesByEmail.set(key, event);
  });

  votesByEmail.forEach((event) => {
    if (event.vote === 'for') {
      tally.for += 1;
    } else if (event.vote === 'against') {
      tally.against += 1;
    } else if (event.vote === 'abstain') {
      tally.abstain += 1;
    }
  });

  return { tally, votesByEmail };
}

async function handlePropose(body) {
  requireFields(body, ['motionText', 'background', 'proposerName', 'proposerEmail']);

  if (!isBoardEmail(body.proposerEmail)) {
    const error = new Error(`Email must end with ${EMAIL_DOMAIN}.`);
    error.status = 403;
    throw error;
  }

  if (!enforceRateLimit(body.proposerEmail)) {
    const error = new Error('Rate limit exceeded. Please wait before submitting another board action.');
    error.status = 429;
    throw error;
  }

  const title = sanitizeText(body.title) || summarize(body.motionText);
  const issueBody = buildIssueBody({ ...body, title });
  const issue = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    body: {
      title,
      body: issueBody,
      labels: [MOTION_LABEL, AWAITING_SECOND_LABEL]
    }
  });

  const motionNumber = deriveMotionNumber(issue);
  await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}`, {
    method: 'PATCH',
    body: {
      title: `Motion ${motionNumber}: ${title}`
    }
  });

  return {
    success: true,
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    motionNumber
  };
}

async function handleSecond(body) {
  requireFields(body, ['issueNumber', 'seconderName', 'seconderEmail']);

  if (!isBoardEmail(body.seconderEmail)) {
    const error = new Error(`Email must end with ${EMAIL_DOMAIN}.`);
    error.status = 403;
    throw error;
  }

  if (!enforceRateLimit(body.seconderEmail)) {
    const error = new Error('Rate limit exceeded. Please wait before recording another board action.');
    error.status = 429;
    throw error;
  }

  const issueNumber = Number(body.issueNumber);
  const [issue, comments] = await Promise.all([fetchIssue(issueNumber), fetchComments(issueNumber)]);

  if (!Array.isArray(issue.labels) || !issue.labels.some((label) => (typeof label === 'string' ? label : label.name) === MOTION_LABEL)) {
    const error = new Error('That motion could not be found.');
    error.status = 404;
    throw error;
  }

  if (getSecondEvent(issue, comments)) {
    const error = new Error('This motion has already been seconded.');
    error.status = 409;
    throw error;
  }

  await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: {
      body: buildSecondComment(body.seconderName, body.seconderEmail)
    }
  });

  await updateIssueLabels(issue, [OPEN_FOR_VOTE_LABEL], [AWAITING_SECOND_LABEL]);

  return { success: true };
}

async function handleVote(body) {
  requireFields(body, ['issueNumber', 'voterName', 'voterEmail', 'vote']);

  if (!isBoardEmail(body.voterEmail)) {
    const error = new Error(`Email must end with ${EMAIL_DOMAIN}.`);
    error.status = 403;
    throw error;
  }

  if (!['for', 'against', 'abstain'].includes(body.vote)) {
    const error = new Error('Vote must be one of: for, against, abstain.');
    error.status = 400;
    throw error;
  }

  if (!enforceRateLimit(body.voterEmail)) {
    const error = new Error('Rate limit exceeded. Please wait before recording another board action.');
    error.status = 429;
    throw error;
  }

  const issueNumber = Number(body.issueNumber);
  const [issue, comments] = await Promise.all([fetchIssue(issueNumber), fetchComments(issueNumber)]);

  if (!getSecondEvent(issue, comments)) {
    const error = new Error('This motion is still awaiting a seconder, so voting is not open yet.');
    error.status = 409;
    throw error;
  }

  const { votesByEmail } = getVoteSummary(issue, comments);
  const emailHash = hashEmail(body.voterEmail);
  if (votesByEmail.has(emailHash)) {
    const error = new Error('A vote from this email has already been recorded for this motion.');
    error.status = 409;
    throw error;
  }

  await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: {
      body: buildVoteComment(body.voterName, body.voterEmail, body.vote)
    }
  });

  await updateIssueLabels(issue, [OPEN_FOR_VOTE_LABEL], []);

  return { success: true };
}

async function handleList() {
  const issues = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&labels=${encodeURIComponent(MOTION_LABEL)}&per_page=100&sort=created&direction=desc`);
  const motions = await Promise.all(
    issues
      .filter((issue) => !issue.pull_request)
      .map(async (issue) => {
        const comments = await fetchComments(issue.number);
        const meta = extractMotionMeta(issue.body);
        const seconder = getSecondEvent(issue, comments);
        const { tally } = getVoteSummary(issue, comments);

        return {
          number: issue.number,
          motionNumber: deriveMotionNumber(issue),
          title: stripMotionPrefix(issue.title),
          status: seconder ? 'open' : 'awaiting_second',
          votesFor: tally.for,
          votesAgainst: tally.against,
          votesAbstain: tally.abstain,
          proposer: meta.proposerName || issue.user.login,
          seconder: seconder ? seconder.name : null,
          created: issue.created_at,
          deadline: meta.deadline || null,
          category: meta.category || 'Other',
          amount: meta.amount,
          portfolio: meta.portfolio || null,
          summary: summarize(meta.motionText || issue.body),
          url: issue.html_url
        };
      })
  );

  return { motions };
}

module.exports = async function (context, req) {
  const origin = req.headers.origin || req.headers.Origin || '';
  const action = String((req.query && req.query.action) || '').trim().toLowerCase();

  if (req.method === 'OPTIONS') {
    respond(context, origin, 204, '');
    return;
  }

  if (!action) {
    respond(context, origin, 400, { error: 'Missing action query parameter.' });
    return;
  }

  try {
    const body = parseBody(req);
    let result;

    if (req.method === 'GET' && action === 'list') {
      result = await handleList();
    } else if (req.method === 'POST' && action === 'propose') {
      result = await handlePropose(body);
    } else if (req.method === 'POST' && action === 'second') {
      result = await handleSecond(body);
    } else if (req.method === 'POST' && action === 'vote') {
      result = await handleVote(body);
    } else {
      respond(context, origin, 405, { error: 'Unsupported method or action.' });
      return;
    }

    respond(context, origin, 200, result);
  } catch (error) {
    context.log.error('Motion API error', error);
    respond(context, origin, error.status || 500, {
      error: error.message || 'Unexpected error while processing the motion request.'
    });
  }
};
