/**
 * Shared motion service for RRROCA.
 * Extracted from api/motion/index.js for reuse in the agentic chatbot.
 */
'use strict';

const { githubRequest, GITHUB_OWNER, GITHUB_REPO, createHttpError } = require('./github');

const MOTION_LABEL = 'motion';
const AWAITING_SECOND_LABEL = 'awaiting-second';
const FIELD_LIMITS = {
  title: 160,
  motionText: 5000,
  background: 5000,
  category: 80,
  portfolio: 80,
  deadline: 40,
  supportingDocs: 1000
};

function normalizeText(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function sanitizeForGitHub(value, { multiline = false } = {}) {
  let text = normalizeText(value);
  if (!multiline) text = text.replace(/\s+/g, ' ');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/@/g, '@\u200b')
    .replace(/```/g, '`\u200b``')
    .replace(/([\\`*_{}\[\]#+|])/g, '\\$1');
}

function formatMultilineSection(text) {
  return sanitizeForGitHub(text, { multiline: true }) || 'None provided.';
}

function summarize(text) {
  const words = normalizeText(text).split(/\s+/).slice(0, 12);
  return words.join(' ') + (words.length >= 12 ? '…' : '');
}

function getUserDisplayName(user) {
  return user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function validateProposal(body) {
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
    supportingDocs: validateTextField(body, 'supportingDocs', { maxLength: FIELD_LIMITS.supportingDocs, multiline: true })
  };
}

function validateTextField(body, field, { required = false, maxLength, multiline = false } = {}) {
  const normalized = normalizeText(body[field]);
  if (required && !normalized) {
    throw createHttpError(400, `Missing required field: ${field}.`);
  }
  if (!normalized) return '';
  const measured = multiline ? normalized : normalized.replace(/\s+/g, ' ');
  if (maxLength && measured.length > maxLength) {
    throw createHttpError(400, `${field} exceeds the ${maxLength} character limit.`);
  }
  return measured;
}

function validateAmount(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1000000) return null;
  return num;
}

function buildIssueBody(proposal, user) {
  const displayName = getUserDisplayName(user);
  const meta = {
    motionText: sanitizeForGitHub(proposal.motionText, { multiline: true }),
    background: sanitizeForGitHub(proposal.background, { multiline: true }),
    category: sanitizeForGitHub(proposal.category) || 'Other',
    amount: Number.isFinite(proposal.amount) ? proposal.amount : null,
    portfolio: sanitizeForGitHub(proposal.portfolio),
    deadline: sanitizeForGitHub(proposal.deadline),
    supportingDocs: sanitizeForGitHub(proposal.supportingDocs, { multiline: true }),
    proposerName: displayName,
    proposerEmail: user.email,
    proposerId: user.id,
    submittedAt: new Date().toISOString()
  };

  const lines = [
    '## Motion Summary',
    '',
    `**Proposed by:** ${displayName} (${user.email})`,
    `**Category:** ${meta.category}`,
    meta.portfolio ? `**Portfolio:** ${meta.portfolio}` : '',
    Number.isFinite(meta.amount) ? `**Amount:** CAD ${meta.amount.toFixed(2)}` : '**Amount:** No spending requested',
    meta.deadline ? `**Decision requested by:** ${meta.deadline}` : '',
    '',
    '## Motion Text',
    '',
    formatMultilineSection(proposal.motionText),
    '',
    '## Why This Is Needed',
    '',
    formatMultilineSection(proposal.background),
    '',
    '## Supporting Links or Documents',
    '',
    formatMultilineSection(proposal.supportingDocs),
    '',
    '---',
    '',
    '📋 This motion needs a **second** before voting can begin.',
    '',
    '👉 **[Open the Board Action Center to second this motion](https://rrroca.org/board/actions/)**',
    '',
    '_Submitted through the RRROCA Board Agent._',
    '',
    `<!-- RRROCA_MOTION_META: ${JSON.stringify(meta)} -->`
  ].filter(Boolean);

  return lines.join('\n');
}

function deriveMotionNumber(issue) {
  const created = issue && issue.created_at ? new Date(issue.created_at) : new Date();
  const year = Number.isNaN(created.getTime()) ? new Date().getUTCFullYear() : created.getUTCFullYear();
  return `${year}-${String(issue.number).padStart(3, '0')}`;
}

/**
 * Submit a motion proposal to GitHub Issues.
 * @param {object} params - Motion fields (title, motionText, background, category, amount, portfolio, deadline, supportingDocs)
 * @param {object} user - Authenticated board member { id, email }
 * @returns {{ success: boolean, issueNumber: number, issueUrl: string, motionNumber: string }}
 */
async function submitMotion(params, user) {
  const proposal = validateProposal(params);
  const issueBody = buildIssueBody(proposal, user);

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
    body: { title: `Motion ${motionNumber}: ${proposal.title}` }
  });

  return {
    success: true,
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    motionNumber
  };
}

module.exports = {
  submitMotion,
  validateProposal,
  FIELD_LIMITS
};
