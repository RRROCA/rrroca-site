const crypto = require('crypto');

const GITHUB_OWNER = 'RRROCA';
const GITHUB_REPO = 'rrroca-site';
const MOTION_LABEL = 'motion';
const AWAITING_SECOND_LABEL = 'awaiting-second';
const OPEN_FOR_VOTE_LABEL = 'open-for-vote';
const EMAIL_DOMAIN = '@rrroca.org';
const EMAIL_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@rrroca\.org$/i;
const MOTION_META_REGEX = /<!--\s*RRROCA_MOTION_META:\s*([\s\S]*?)\s*-->/i;
const MOTION_EVENT_REGEX = /<!--\s*RRROCA_MOTION_EVENT:\s*([\s\S]*?)\s*-->/i;
const TRUSTED_IP_HEADERS = ['x-azure-clientip', 'x-ms-client-ip', 'client-ip'];
const REQUEST_TIMEOUT_MS = 10000;
const MAX_BODY_BYTES = 32 * 1024;
const REQUEST_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const REQUEST_RATE_LIMIT_MAX = 20;
const WRITE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_RATE_LIMIT_MAX = 5;
const IP_WRITE_RATE_LIMIT_MAX = 10;
const FIELD_LIMITS = {
  title: 160,
  motionText: 5000,
  background: 5000,
  category: 80,
  portfolio: 80,
  deadline: 40,
  supportingDocs: 1000,
  proposerName: 100,
  seconderName: 100,
  voterName: 100
};
const allowedOrigins = new Set([
  'https://rrroca.github.io',
  'https://rrroca.org',
  'https://www.rrroca.org',
  'https://zealous-wave-07c275a0f.7.azurestaticapps.net'
]);
const rateLimitStore = global.__RRROCA_MOTION_RATE_LIMITS || new Map();
global.__RRROCA_MOTION_RATE_LIMITS = rateLimitStore;

function createHttpError(status, message, logMessage) {
  const error = new Error(message);
  error.status = status;
  error.logMessage = logMessage || message;
  return error;
}

function sanitizeLog(value, maxLength = 200) {
  return String(value || '').replace(/[\r\n]+/g, ' ').slice(0, maxLength);
}

function getHeader(req, name) {
  if (!req || !req.headers) return '';
  return req.headers[name] || req.headers[name.toLowerCase()] || req.headers[name.toUpperCase()] || '';
}

function normalizeOrigin(origin) {
  return String(origin || '').trim();
}

function getTrustedClientIp(req) {
  for (const header of TRUSTED_IP_HEADERS) {
    const candidate = String(getHeader(req, header) || '').split(',')[0].trim();
    if (candidate && candidate.length <= 64) {
      return candidate;
    }
  }

  return 'unknown';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isBoardEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function sanitizeForGitHub(value, { multiline = false } = {}) {
  let text = normalizeText(value);
  if (!multiline) {
    text = text.replace(/\s+/g, ' ');
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/@/g, '@\u200b')
    .replace(/```/g, '`\u200b``')
    .replace(/([\\`*_{}\[\]#+|])/g, '\\$1');
}

function validateTextField(body, field, { required = false, maxLength, multiline = false } = {}) {
  const normalized = normalizeText(body[field]);

  if (required && !normalized) {
    throw createHttpError(400, `Missing required field: ${field}.`);
  }

  if (!normalized) {
    return '';
  }

  const measured = multiline ? normalized : normalized.replace(/\s+/g, ' ');
  if (maxLength && measured.length > maxLength) {
    throw createHttpError(400, `${field} exceeds the ${maxLength} character limit.`);
  }

  return measured;
}

function validateIssueNumber(value) {
  const issueNumber = Number(value);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw createHttpError(400, 'Invalid issue number.');
  }

  return issueNumber;
}

function validateAmount(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1000000) {
    throw createHttpError(400, 'Amount must be a valid positive number.');
  }

  return amount;
}

function validateEmailField(body, field) {
  const email = normalizeEmail(body[field]);
  if (!email) {
    throw createHttpError(400, `Missing required field: ${field}.`);
  }

  if (!isBoardEmail(email)) {
    throw createHttpError(403, `Email must be a valid ${EMAIL_DOMAIN} address.`);
  }

  return email;
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

function assertAllowedOrigin(origin) {
  if (origin && !allowedOrigins.has(origin)) {
    throw createHttpError(403, 'Origin not allowed.');
  }
}

function getRequestBodySize(req) {
  if (typeof req?.rawBody === 'string') {
    return Buffer.byteLength(req.rawBody, 'utf8');
  }

  if (Buffer.isBuffer(req?.rawBody)) {
    return req.rawBody.length;
  }

  if (typeof req?.body === 'string') {
    return Buffer.byteLength(req.body, 'utf8');
  }

  if (req?.body === undefined || req?.body === null) {
    return 0;
  }

  try {
    return Buffer.byteLength(JSON.stringify(req.body), 'utf8');
  } catch (error) {
    return MAX_BODY_BYTES + 1;
  }
}

function parseBody(req) {
  if (!req || req.body === undefined || req.body === null || req.body === '') {
    return {};
  }

  if (typeof req.body === 'string') {
    try {
      return req.body.trim() ? JSON.parse(req.body) : {};
    } catch (error) {
      throw createHttpError(400, 'Malformed JSON body.');
    }
  }

  if (typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw createHttpError(400, 'Request body must be a JSON object.');
  }

  return req.body;
}

function getWindowTimestamps(key, windowMs, now) {
  const timestamps = (rateLimitStore.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
  rateLimitStore.set(key, timestamps);
  return timestamps;
}

function enforceRequestRateLimit(clientIp) {
  const now = Date.now();
  const key = `request:${clientIp}`;
  const timestamps = getWindowTimestamps(key, REQUEST_RATE_LIMIT_WINDOW_MS, now);

  if (timestamps.length >= REQUEST_RATE_LIMIT_MAX) {
    return false;
  }

  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return true;
}

function enforceWriteRateLimit(email, clientIp) {
  const now = Date.now();
  const emailKey = `email:${normalizeEmail(email)}`;
  const ipKey = `write-ip:${clientIp}`;
  const emailTimestamps = getWindowTimestamps(emailKey, WRITE_RATE_LIMIT_WINDOW_MS, now);
  const ipTimestamps = getWindowTimestamps(ipKey, WRITE_RATE_LIMIT_WINDOW_MS, now);

  if (emailTimestamps.length >= EMAIL_RATE_LIMIT_MAX || ipTimestamps.length >= IP_WRITE_RATE_LIMIT_MAX) {
    return false;
  }

  emailTimestamps.push(now);
  ipTimestamps.push(now);
  rateLimitStore.set(emailKey, emailTimestamps);
  rateLimitStore.set(ipKey, ipTimestamps);
  return true;
}

function summarize(text) {
  const compact = normalizeText(text).replace(/\s+/g, ' ');
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

function formatMultilineSection(text) {
  const sanitized = sanitizeForGitHub(text, { multiline: true });
  return sanitized || 'None provided.';
}

function buildIssueBody(payload) {
  const meta = {
    motionText: sanitizeForGitHub(payload.motionText, { multiline: true }),
    background: sanitizeForGitHub(payload.background, { multiline: true }),
    category: sanitizeForGitHub(payload.category) || 'Other',
    amount: Number.isFinite(payload.amount) ? payload.amount : null,
    portfolio: sanitizeForGitHub(payload.portfolio),
    deadline: sanitizeForGitHub(payload.deadline),
    supportingDocs: sanitizeForGitHub(payload.supportingDocs, { multiline: true }),
    proposerName: sanitizeForGitHub(payload.proposerName),
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
    formatMultilineSection(payload.motionText),
    '',
    '## Why This Is Needed',
    '',
    formatMultilineSection(payload.background),
    '',
    '## Supporting Links or Documents',
    '',
    formatMultilineSection(payload.supportingDocs),
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
    name: sanitizeForGitHub(name),
    emailHash: hashEmail(email),
    recordedAt: new Date().toISOString()
  };

  return `Seconded by **${event.name}**.\n\n<!-- RRROCA_MOTION_EVENT: ${JSON.stringify(event)} -->`;
}

function buildVoteComment(name, email, vote) {
  const event = {
    type: 'vote',
    vote,
    name: sanitizeForGitHub(name),
    emailHash: hashEmail(email),
    recordedAt: new Date().toISOString()
  };

  return `Vote recorded: **${event.name}** voted **${vote.toUpperCase()}**.\n\n<!-- RRROCA_MOTION_EVENT: ${JSON.stringify(event)} -->`;
}

function mapGithubError(responseStatus) {
  if (responseStatus === 404) {
    return createHttpError(404, 'That motion could not be found.');
  }

  if (responseStatus === 401 || responseStatus === 403) {
    return createHttpError(503, 'Motion service is temporarily unavailable.');
  }

  if (responseStatus === 429) {
    return createHttpError(429, 'Motion service is temporarily rate limited. Please try again later.');
  }

  return createHttpError(502, 'Motion service error. Please try again later.');
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const method = options.method || 'GET';

  if (method !== 'GET' && !token) {
    throw createHttpError(503, 'Motion service is temporarily unavailable.');
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = null;
      }
    }

    if (!response.ok) {
      const mapped = mapGithubError(response.status);
      mapped.logMessage = `GitHub ${method} ${path} failed: ${response.status} ${sanitizeLog(data?.message || text)}`;
      throw mapped;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw createHttpError(504, 'Motion service timed out. Please try again later.', 'GitHub request timed out.');
    }

    if (error.status) {
      throw error;
    }

    throw createHttpError(502, 'Motion service error. Please try again later.', sanitizeLog(error.message));
  } finally {
    clearTimeout(timeout);
  }
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

function validateProposal(body) {
  const proposerName = validateTextField(body, 'proposerName', { required: true, maxLength: FIELD_LIMITS.proposerName });
  const proposerEmail = validateEmailField(body, 'proposerEmail');
  const motionText = validateTextField(body, 'motionText', { required: true, maxLength: FIELD_LIMITS.motionText, multiline: true });
  const background = validateTextField(body, 'background', { required: true, maxLength: FIELD_LIMITS.background, multiline: true });
  const title = validateTextField(body, 'title', { maxLength: FIELD_LIMITS.title }) || summarize(motionText);

  return {
    title,
    motionText,
    background,
    category: validateTextField(body, 'category', { maxLength: FIELD_LIMITS.category }) || 'Other',
    amount: validateAmount(body.amount),
    portfolio: validateTextField(body, 'portfolio', { maxLength: FIELD_LIMITS.portfolio }),
    deadline: validateTextField(body, 'deadline', { maxLength: FIELD_LIMITS.deadline }),
    supportingDocs: validateTextField(body, 'supportingDocs', { maxLength: FIELD_LIMITS.supportingDocs, multiline: true }),
    proposerName,
    proposerEmail
  };
}

function validateSecondRequest(body) {
  return {
    issueNumber: validateIssueNumber(body.issueNumber),
    seconderName: validateTextField(body, 'seconderName', { required: true, maxLength: FIELD_LIMITS.seconderName }),
    seconderEmail: validateEmailField(body, 'seconderEmail')
  };
}

function validateVoteRequest(body) {
  const vote = validateTextField(body, 'vote', { required: true, maxLength: 10 }).toLowerCase();
  if (!['for', 'against', 'abstain'].includes(vote)) {
    throw createHttpError(400, 'Vote must be one of: for, against, abstain.');
  }

  return {
    issueNumber: validateIssueNumber(body.issueNumber),
    voterName: validateTextField(body, 'voterName', { required: true, maxLength: FIELD_LIMITS.voterName }),
    voterEmail: validateEmailField(body, 'voterEmail'),
    vote
  };
}

async function handlePropose(body, clientIp) {
  const proposal = validateProposal(body);

  if (!enforceWriteRateLimit(proposal.proposerEmail, clientIp)) {
    throw createHttpError(429, 'Rate limit exceeded. Please wait before submitting another board action.');
  }

  const issueBody = buildIssueBody(proposal);
  const issue = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    body: {
      title: proposal.title,
      body: issueBody,
      labels: [MOTION_LABEL, AWAITING_SECOND_LABEL]
    }
  });

  const motionNumber = deriveMotionNumber(issue);
  await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}`, {
    method: 'PATCH',
    body: {
      title: `Motion ${motionNumber}: ${proposal.title}`
    }
  });

  return {
    success: true,
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    motionNumber
  };
}

async function handleSecond(body, clientIp) {
  const request = validateSecondRequest(body);

  if (!enforceWriteRateLimit(request.seconderEmail, clientIp)) {
    throw createHttpError(429, 'Rate limit exceeded. Please wait before recording another board action.');
  }

  const [issue, comments] = await Promise.all([fetchIssue(request.issueNumber), fetchComments(request.issueNumber)]);

  if (!Array.isArray(issue.labels) || !issue.labels.some((label) => (typeof label === 'string' ? label : label.name) === MOTION_LABEL)) {
    throw createHttpError(404, 'That motion could not be found.');
  }

  if (getSecondEvent(issue, comments)) {
    throw createHttpError(409, 'This motion has already been seconded.');
  }

  await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${request.issueNumber}/comments`, {
    method: 'POST',
    body: {
      body: buildSecondComment(request.seconderName, request.seconderEmail)
    }
  });

  await updateIssueLabels(issue, [OPEN_FOR_VOTE_LABEL], [AWAITING_SECOND_LABEL]);
  return { success: true };
}

async function handleVote(body, clientIp) {
  const request = validateVoteRequest(body);

  if (!enforceWriteRateLimit(request.voterEmail, clientIp)) {
    throw createHttpError(429, 'Rate limit exceeded. Please wait before recording another board action.');
  }

  const [issue, comments] = await Promise.all([fetchIssue(request.issueNumber), fetchComments(request.issueNumber)]);

  if (!getSecondEvent(issue, comments)) {
    throw createHttpError(409, 'This motion is still awaiting a seconder, so voting is not open yet.');
  }

  const { votesByEmail } = getVoteSummary(issue, comments);
  const emailHash = hashEmail(request.voterEmail);
  if (votesByEmail.has(emailHash)) {
    throw createHttpError(409, 'A vote from this email has already been recorded for this motion.');
  }

  await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${request.issueNumber}/comments`, {
    method: 'POST',
    body: {
      body: buildVoteComment(request.voterName, request.voterEmail, request.vote)
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
  const origin = normalizeOrigin(getHeader(req, 'origin'));
  const action = String((req.query && req.query.action) || '').trim().toLowerCase();
  const clientIp = getTrustedClientIp(req);

  if (req.method === 'OPTIONS') {
    respond(context, origin, allowedOrigins.has(origin) || !origin ? 204 : 403, allowedOrigins.has(origin) || !origin ? '' : { error: 'Origin not allowed.' });
    return;
  }

  try {
    assertAllowedOrigin(origin);

    if (!action) {
      throw createHttpError(400, 'Missing action query parameter.');
    }

    if (!enforceRequestRateLimit(clientIp)) {
      throw createHttpError(429, 'Too many requests. Please try again later.');
    }

    const requestSize = getRequestBodySize(req);
    if (requestSize > MAX_BODY_BYTES) {
      throw createHttpError(413, 'Request body too large.', `bodyBytes=${requestSize}`);
    }

    let result;
    if (req.method === 'GET' && action === 'list') {
      result = await handleList();
    } else if (req.method === 'POST' && action === 'propose') {
      result = await handlePropose(parseBody(req), clientIp);
    } else if (req.method === 'POST' && action === 'second') {
      result = await handleSecond(parseBody(req), clientIp);
    } else if (req.method === 'POST' && action === 'vote') {
      result = await handleVote(parseBody(req), clientIp);
    } else {
      throw createHttpError(405, 'Unsupported method or action.');
    }

    respond(context, origin, 200, result);
  } catch (error) {
    context.log.error(`Motion API error: status=${error.status || 500} ip=${sanitizeLog(clientIp)} detail=${sanitizeLog(error.logMessage || error.message)}`);
    respond(context, origin, error.status || 500, {
      error: error.status && error.status < 500 ? error.message : 'Unexpected error while processing the motion request.'
    });
  }
};
