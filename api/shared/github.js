/**
 * Shared GitHub API client for RRROCA Azure Functions.
 * Used by both chat (agentic tools) and motion APIs.
 */
'use strict';

const GITHUB_OWNER = 'RRROCA';
const GITHUB_REPO = 'rrroca-site';
const REQUEST_TIMEOUT_MS = 15000;

function createHttpError(status, message, logMessage) {
  const error = new Error(message);
  error.status = status;
  error.logMessage = logMessage || message;
  return error;
}

function sanitizeLog(value, maxLength = 200) {
  return String(value || '').replace(/[\r\n]+/g, ' ').slice(0, maxLength);
}

function mapGithubError(responseStatus) {
  if (responseStatus === 404) return createHttpError(404, 'Resource not found.');
  if (responseStatus === 401 || responseStatus === 403) return createHttpError(503, 'GitHub service temporarily unavailable.');
  if (responseStatus === 409) return createHttpError(409, 'Conflict — the file was modified since it was last read. Please try again.');
  if (responseStatus === 422) return createHttpError(400, 'Invalid request to GitHub.');
  if (responseStatus === 429) return createHttpError(429, 'GitHub rate limit reached. Please wait and try again.');
  return createHttpError(502, 'GitHub service error.');
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const method = options.method || 'GET';

  if (method !== 'GET' && !token) {
    throw createHttpError(503, 'Write service temporarily unavailable.');
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'RRROCA-Board-Agent',
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
      try { data = JSON.parse(text); } catch (_) { data = null; }
    }

    if (!response.ok) {
      const mapped = mapGithubError(response.status);
      mapped.logMessage = `GitHub ${method} ${path} failed: ${response.status} ${sanitizeLog(data?.message || text)}`;
      throw mapped;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw createHttpError(504, 'GitHub request timed out.');
    }
    if (error.status) throw error;
    throw createHttpError(502, 'GitHub service error.', sanitizeLog(error.message));
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Get file content from GitHub (for CMS updates).
 * Returns { content, sha, path } or null if not found.
 */
async function getFileContent(filePath) {
  try {
    const data = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`);
    return {
      content: Buffer.from(data.content, 'base64').toString('utf-8'),
      sha: data.sha,
      path: data.path
    };
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

/**
 * Create or update a file via GitHub Contents API.
 * Returns { commit, content } from GitHub response.
 */
async function commitFile(filePath, content, message, sha) {
  const body = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    committer: { name: 'RRROCA Board Agent', email: 'board@rrroca.org' }
  };

  if (sha) {
    body.sha = sha;
  }

  return githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
    method: 'PUT',
    body
  });
}

module.exports = {
  GITHUB_OWNER,
  GITHUB_REPO,
  githubRequest,
  getFileContent,
  commitFile,
  createHttpError,
  sanitizeLog
};
