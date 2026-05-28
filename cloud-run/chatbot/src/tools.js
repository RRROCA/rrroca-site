/**
 * Tool definitions and execution for RRROCA chatbot.
 * Ported from api/chat/index.js tool system.
 */
import { githubRequest, getFileContent, commitFile, GITHUB_OWNER, GITHUB_REPO, createHttpError, sanitizeLog } from './github.js';

// --- Write rate limiting ---
const WRITE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const WRITE_RATE_LIMIT_MAX = 10;
const writeRateLimits = new Map();
const COMMUNITY_SUGGEST_LIMIT = 2;
const COMMUNITY_SUGGEST_WINDOW_MS = 24 * 60 * 60 * 1000;
const communitySuggestLimits = new Map();

function enforceWriteRateLimit(userId) {
  const now = Date.now();
  const entry = writeRateLimits.get(userId) || { count: 0, resetTime: now + WRITE_RATE_LIMIT_WINDOW_MS };
  if (now > entry.resetTime) { entry.count = 0; entry.resetTime = now + WRITE_RATE_LIMIT_WINDOW_MS; }
  if (entry.count >= WRITE_RATE_LIMIT_MAX) return false;
  entry.count += 1;
  writeRateLimits.set(userId, entry);
  return true;
}

function enforceCommunityRateLimit(ip) {
  const now = Date.now();
  const entry = communitySuggestLimits.get(ip) || { count: 0, resetTime: now + COMMUNITY_SUGGEST_WINDOW_MS };
  if (now > entry.resetTime) { entry.count = 0; entry.resetTime = now + COMMUNITY_SUGGEST_WINDOW_MS; }
  if (entry.count >= COMMUNITY_SUGGEST_LIMIT) return false;
  entry.count += 1;
  communitySuggestLimits.set(ip, entry);
  return true;
}

// --- Tool declarations (OpenAI-compatible format, converted to Gemini in chat.js) ---
export const BOARD_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'submit_motion',
      description: 'Submit a board motion proposal. Only call after gathering all required information and presenting a summary for confirmation.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short title (max 160 chars). Auto-generated from motionText if omitted.' },
          motionText: { type: 'string', description: 'Full text of the motion — what is being proposed (required, max 5000 chars).' },
          background: { type: 'string', description: 'Why this motion is needed — context and rationale (required, max 5000 chars).' },
          category: { type: 'string', description: 'Category: Safety, Infrastructure, Events, Communications, Finance, Governance, or Other.' },
          amount: { type: 'number', description: 'Budget amount in CAD if this motion involves spending.' },
          portfolio: { type: 'string', description: 'Board portfolio this falls under.' },
          deadline: { type: 'string', description: 'Decision deadline if time-sensitive (YYYY-MM-DD).' },
          supportingDocs: { type: 'string', description: 'Links to supporting documents.' }
        },
        required: ['motionText', 'background']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_content',
      description: 'Create a new content item (news, event, safety alert) on the RRROCA website as a draft. Only call after drafting and getting confirmation.',
      parameters: {
        type: 'object',
        properties: {
          contentType: { type: 'string', description: 'Type: news, event, or safety.' },
          title: { type: 'string', description: 'Article/event title (max 200 chars).' },
          date: { type: 'string', description: 'Publication/event date (YYYY-MM-DD).' },
          description: { type: 'string', description: 'Short summary (max 500 chars).' },
          body: { type: 'string', description: 'Full body in Markdown.' },
          slug: { type: 'string', description: 'URL slug (auto-generated if omitted).' }
        },
        required: ['contentType', 'title', 'date', 'description', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_content',
      description: 'Update an existing content item. Only call after showing proposed changes and getting confirmation.',
      parameters: {
        type: 'object',
        properties: {
          contentType: { type: 'string', description: 'Type: news, event, or safety.' },
          slug: { type: 'string', description: 'Slug/filename of content to update.' },
          updates: {
            type: 'object',
            description: 'Fields to update.',
            properties: {
              title: { type: 'string' },
              date: { type: 'string' },
              description: { type: 'string' },
              body: { type: 'string' }
            }
          }
        },
        required: ['contentType', 'slug', 'updates']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'report_issue',
      description: 'Submit a website bug report or feedback as a GitHub Issue. Only call after gathering details and getting confirmation.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short issue title (max 160 chars).' },
          category: { type: 'string', description: 'Type: bug, content-issue, feature-request, or question.' },
          page: { type: 'string', description: 'Affected page/feature.' },
          description: { type: 'string', description: 'Problem description.' },
          expected: { type: 'string', description: 'Expected behaviour.' },
          device: { type: 'string', description: 'Device/browser info.' },
          priority: { type: 'string', description: 'Priority: low, medium, or high.' }
        },
        required: ['title', 'category', 'description']
      }
    }
  }
];

export const COMMUNITY_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'submit_community_suggestion',
      description: 'Submit a community suggestion to the RRROCA board. Only call after gathering idea details, name, email, and presenting a summary for confirmation.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Person\'s name (required).' },
          email: { type: 'string', description: 'Email address for follow-up (required).' },
          title: { type: 'string', description: 'Short title (max 160 chars).' },
          idea: { type: 'string', description: 'The suggestion in detail.' },
          category: { type: 'string', description: 'Category: neighbourhood-improvement, event-idea, safety-concern, program-suggestion, or other.' },
          whobenefits: { type: 'string', description: 'Who benefits from this idea.' }
        },
        required: ['name', 'email', 'title', 'idea']
      }
    }
  }
];

// --- Tool executor ---
export async function executeTool(toolName, args, boardMember, clientIp) {
  if (toolName === 'submit_community_suggestion') {
    if (!enforceCommunityRateLimit(clientIp)) {
      return { success: false, error: 'Daily suggestion limit reached (2 per day). Please try again tomorrow.' };
    }
    return executeCommunitySubmission(args);
  }

  if (!boardMember) {
    return { success: false, error: 'Authentication required for this action.' };
  }

  if (!enforceWriteRateLimit(boardMember.id)) {
    return { success: false, error: 'Write rate limit exceeded. Up to 10 write actions per hour.' };
  }

  try {
    switch (toolName) {
      case 'submit_motion': return await executeSubmitMotion(args, boardMember);
      case 'create_content': return await executeCreateContent(args, boardMember);
      case 'update_content': return await executeUpdateContent(args, boardMember);
      case 'report_issue': return await executeReportIssue(args, boardMember);
      default: return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(JSON.stringify({ severity: 'ERROR', message: `Tool error: ${toolName} user=${boardMember.email} err=${sanitizeLog(error.message)}` }));
    if (error.status && error.status < 500) return { success: false, error: error.message };
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

// --- Motion submission ---
async function executeSubmitMotion(args, user) {
  const motionText = String(args.motionText || '').trim();
  const background = String(args.background || '').trim();
  if (!motionText) return { success: false, error: 'motionText is required.' };
  if (!background) return { success: false, error: 'background is required.' };
  if (motionText.length > 5000) return { success: false, error: 'motionText too long (max 5000).' };
  if (background.length > 5000) return { success: false, error: 'background too long (max 5000).' };

  const category = String(args.category || 'Other').trim().slice(0, 80);
  const title = String(args.title || '').trim().slice(0, 160) || motionText.split(/\s+/).slice(0, 12).join(' ') + '…';

  const meta = { category, submittedBy: user.email };
  if (args.amount) meta.amount = args.amount;
  if (args.portfolio) meta.portfolio = String(args.portfolio).slice(0, 80);
  if (args.deadline) meta.deadline = String(args.deadline).slice(0, 40);
  if (args.supportingDocs) meta.supportingDocs = String(args.supportingDocs).slice(0, 1000);

  const bodyParts = [
    `## Motion`,
    '',
    motionText,
    '',
    `## Background`,
    '',
    background,
    '',
    `---`,
    `_Submitted by ${user.name} (${user.email}) via RRROCA Board Agent._`,
    '',
    `<!-- RRROCA_MOTION_META: ${JSON.stringify(meta)} -->`
  ];

  console.log(JSON.stringify({ severity: 'INFO', message: `Motion submission: user=${user.email} title="${sanitizeLog(title)}"` }));

  const issue = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    body: {
      title: `Motion: ${title}`,
      body: bodyParts.join('\n'),
      labels: ['motion', 'awaiting-second']
    }
  });

  const year = new Date().getUTCFullYear();
  const motionNumber = `${year}-${String(issue.number).padStart(3, '0')}`;

  // Rename with motion number
  await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}`, {
    method: 'PATCH',
    body: { title: `Motion ${motionNumber}: ${title}` }
  });

  return {
    success: true,
    motionNumber,
    issueNumber: issue.number,
    message: `Motion ${motionNumber} submitted! It's now awaiting a second from another board member.`
  };
}

// --- Content creation ---
const CONTENT_TYPES = {
  news: { dir: 'content/news' },
  event: { dir: 'content/events' },
  safety: { dir: 'content/safety' },
};

function normalizeSlug(slug) {
  return String(slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function executeCreateContent(args, user) {
  const { contentType, title, date, description, body, slug } = args;
  if (!CONTENT_TYPES[contentType]) return { success: false, error: `Invalid contentType. Must be: ${Object.keys(CONTENT_TYPES).join(', ')}` };
  if (!title || title.length > 200) return { success: false, error: 'Title required (max 200 chars).' };
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, error: 'Date required in YYYY-MM-DD format.' };
  if (!description || description.length > 500) return { success: false, error: 'Description required (max 500 chars).' };
  if (!body || body.length > 10000) return { success: false, error: 'Body required (max 10000 chars).' };

  const fileSlug = normalizeSlug(slug || title);
  if (!fileSlug) return { success: false, error: 'Could not generate a valid slug.' };

  const dir = CONTENT_TYPES[contentType].dir;
  const filePath = `${dir}/${fileSlug}.md`;

  const markdown = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
description: "${description.replace(/"/g, '\\"')}"
categories: ["${contentType}"]
draft: true
---

${body}
`;

  console.log(JSON.stringify({ severity: 'INFO', message: `Content creation: user=${user.email} type=${contentType} slug=${fileSlug}` }));

  await commitFile(filePath, markdown, `feat(${contentType}): add "${title}" [draft]\n\nCreated by ${user.name} via Board Agent.`);

  return {
    success: true,
    filePath,
    draft: true,
    message: `Draft "${title}" created at /${dir}/${fileSlug}/. It's saved as a draft — publish it via the CMS at /admin/.`
  };
}

// --- Content update ---
async function executeUpdateContent(args, user) {
  const { contentType, slug, updates } = args;
  if (!CONTENT_TYPES[contentType]) return { success: false, error: `Invalid contentType.` };
  if (!slug) return { success: false, error: 'slug is required.' };
  if (!updates || typeof updates !== 'object') return { success: false, error: 'updates object is required.' };

  const dir = CONTENT_TYPES[contentType].dir;
  const fileSlug = normalizeSlug(slug);
  const filePath = `${dir}/${fileSlug}.md`;

  const existing = await getFileContent(filePath);
  if (!existing) return { success: false, error: `Content not found: ${filePath}` };

  // Parse existing front matter
  const match = existing.content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { success: false, error: 'Could not parse existing content.' };

  let frontMatter = match[1];
  let existingBody = match[2].trim();

  if (updates.title) frontMatter = frontMatter.replace(/^title:\s*".*"/m, `title: "${updates.title.replace(/"/g, '\\"')}"`);
  if (updates.date) frontMatter = frontMatter.replace(/^date:\s*".*"/m, `date: "${updates.date}"`);
  if (updates.description) frontMatter = frontMatter.replace(/^description:\s*".*"/m, `description: "${updates.description.replace(/"/g, '\\"')}"`);
  if (updates.body) existingBody = updates.body;

  const newContent = `---\n${frontMatter}\n---\n\n${existingBody}\n`;

  console.log(JSON.stringify({ severity: 'INFO', message: `Content update: user=${user.email} path=${filePath}` }));

  await commitFile(filePath, newContent, `fix(${contentType}): update "${fileSlug}"\n\nUpdated by ${user.name} via Board Agent.`, existing.sha);

  return {
    success: true,
    filePath,
    message: `Updated "${fileSlug}" successfully.`
  };
}

// --- Issue reporting ---
async function executeReportIssue(args, user) {
  const title = String(args.title || '').trim().slice(0, 160);
  if (!title) return { success: false, error: 'Issue title is required.' };

  const category = args.category || 'bug';
  const validCategories = ['bug', 'content-issue', 'feature-request', 'question'];
  if (!validCategories.includes(category)) return { success: false, error: `Category must be: ${validCategories.join(', ')}` };

  const bodyParts = [
    `**Reported by:** ${user.name} (${user.email})`,
    `**Category:** ${category}`,
    args.page ? `**Page/Feature:** ${args.page}` : '',
    args.priority ? `**Priority:** ${args.priority}` : '',
    args.device ? `**Device/Browser:** ${args.device}` : '',
    '',
    '## Description',
    '',
    args.description || 'No description provided.',
    ''
  ];
  if (args.expected) bodyParts.push('## Expected Behaviour', '', args.expected, '');
  bodyParts.push('---', '', '_Submitted via RRROCA Board Agent._');

  const labels = [category];
  if (args.priority === 'high') labels.push('priority-high');

  const issue = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    body: {
      title: `[${category}] ${title}`,
      body: bodyParts.filter(l => l !== undefined).join('\n'),
      labels
    }
  });

  return {
    success: true,
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    message: `Issue #${issue.number} created: "${title}". Track at ${issue.html_url}.`
  };
}

// --- Community suggestion ---
function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const visibleLocal = local.length <= 2 ? local[0] + '***' : local.slice(0, 2) + '***';
  return `${visibleLocal}@${domain}`;
}

async function executeCommunitySubmission(args) {
  const name = String(args.name || '').trim().slice(0, 100);
  const email = String(args.email || '').trim().slice(0, 200);
  const title = String(args.title || '').trim().slice(0, 160);
  const idea = String(args.idea || '').trim().slice(0, 5000);
  const category = args.category || 'other';
  const whobenefits = String(args.whobenefits || '').trim().slice(0, 500);

  if (!name) return { success: false, error: 'Please provide your name.' };
  if (!email || !email.includes('@')) return { success: false, error: 'Please provide a valid email.' };
  if (!title) return { success: false, error: 'Please provide a title for your suggestion.' };
  if (!idea) return { success: false, error: 'Please describe your idea.' };

  const bodyParts = [
    '## Community Suggestion',
    '',
    `**From:** ${name}`,
    `**Contact:** ${maskEmail(email)} _(full address shared privately with the board)_`,
    `**Category:** ${category}`,
    whobenefits ? `**Who benefits:** ${whobenefits}` : '',
    '',
    '## Idea',
    '',
    idea,
    '',
    '---',
    '',
    '_Submitted by a community member via the RRROCA website chatbot._'
  ];

  console.log(JSON.stringify({ severity: 'INFO', message: `Community suggestion: name="${sanitizeLog(name)}" email="${sanitizeLog(email)}" title="${sanitizeLog(title)}"` }));

  const issue = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    body: {
      title: `[community-suggestion] ${title}`,
      body: bodyParts.filter(l => l !== undefined).join('\n'),
      labels: ['community-suggestion']
    }
  });

  return {
    success: true,
    message: `Thank you, ${name}! Your suggestion "${title}" has been submitted to the RRROCA board. They'll review it and may follow up at ${email}.`
  };
}
