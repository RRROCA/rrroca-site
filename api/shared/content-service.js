/**
 * Shared CMS content service for RRROCA.
 * Creates/updates Hugo markdown content via GitHub Contents API.
 * Restricted to safe content directories with server-side validation.
 */
'use strict';

const { getFileContent, commitFile, createHttpError } = require('./github');

// Allowed content types → directory mapping
const CONTENT_TYPES = {
  news: { dir: 'content/news', requiredFields: ['title', 'date', 'description', 'body'] },
  event: { dir: 'content/events', requiredFields: ['title', 'date', 'description', 'body'] },
  safety: { dir: 'content/safety', requiredFields: ['title', 'date', 'description', 'body'] }
};

const SLUG_MAX_LENGTH = 80;
const TITLE_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 10000;
const DESCRIPTION_MAX_LENGTH = 500;

/**
 * Validate and normalize a slug for file naming.
 */
function normalizeSlug(slug) {
  return String(slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, SLUG_MAX_LENGTH);
}

/**
 * Validate a date string (YYYY-MM-DD format).
 */
function validateDate(date) {
  const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw createHttpError(400, 'Date must be in YYYY-MM-DD format.');
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) throw createHttpError(400, 'Invalid date.');
  return date;
}

/**
 * Validate content params for creation.
 */
function validateContentParams(params) {
  const { contentType, title, date, description, body, slug } = params;

  if (!contentType || !CONTENT_TYPES[contentType]) {
    throw createHttpError(400, `contentType must be one of: ${Object.keys(CONTENT_TYPES).join(', ')}`);
  }

  if (!title || String(title).trim().length === 0) {
    throw createHttpError(400, 'Title is required.');
  }
  if (String(title).length > TITLE_MAX_LENGTH) {
    throw createHttpError(400, `Title exceeds ${TITLE_MAX_LENGTH} characters.`);
  }

  const validDate = validateDate(date);

  if (!description || String(description).trim().length === 0) {
    throw createHttpError(400, 'Description is required.');
  }
  if (String(description).length > DESCRIPTION_MAX_LENGTH) {
    throw createHttpError(400, `Description exceeds ${DESCRIPTION_MAX_LENGTH} characters.`);
  }

  if (!body || String(body).trim().length === 0) {
    throw createHttpError(400, 'Body content is required.');
  }
  if (String(body).length > BODY_MAX_LENGTH) {
    throw createHttpError(400, `Body exceeds ${BODY_MAX_LENGTH} characters.`);
  }

  // Reject HTML in body
  if (/<script|<iframe|<object|<embed|<form|on\w+\s*=/i.test(body)) {
    throw createHttpError(400, 'Content must not contain HTML scripts or interactive elements.');
  }

  const finalSlug = normalizeSlug(slug || title);
  if (!finalSlug) {
    throw createHttpError(400, 'Could not generate a valid slug from the title.');
  }

  return {
    contentType,
    title: String(title).trim(),
    date: validDate,
    description: String(description).trim(),
    body: String(body).trim(),
    slug: finalSlug
  };
}

/**
 * Build Hugo markdown file content with YAML frontmatter.
 */
function buildMarkdown(params) {
  const lines = [
    '---',
    `title: "${params.title.replace(/"/g, '\\"')}"`,
    `date: ${params.date}`,
    `description: "${params.description.replace(/"/g, '\\"')}"`,
    'draft: true',
    '---',
    '',
    params.body
  ];
  return lines.join('\n') + '\n';
}

/**
 * Compute the file path for a new content item.
 */
function computeFilePath(contentType, date, slug) {
  const config = CONTENT_TYPES[contentType];
  return `${config.dir}/${date}-${slug}.md`;
}

/**
 * Create new content (news, event, safety alert).
 * Always creates as draft: true for safety.
 * @param {object} params - { contentType, title, date, description, body, slug? }
 * @param {object} user - Authenticated board member
 * @returns {{ success: boolean, filePath: string, message: string }}
 */
async function createContent(params, user) {
  const validated = validateContentParams(params);
  const filePath = computeFilePath(validated.contentType, validated.date, validated.slug);

  // Check if file already exists
  const existing = await getFileContent(filePath);
  if (existing) {
    throw createHttpError(409, `A file already exists at ${filePath}. Use a different slug or date.`);
  }

  const markdown = buildMarkdown(validated);
  const displayName = user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const commitMessage = `content(${validated.contentType}): ${validated.title}\n\nCreated via Board Agent by ${displayName}`;

  await commitFile(filePath, markdown, commitMessage);

  return {
    success: true,
    filePath,
    contentType: validated.contentType,
    title: validated.title,
    draft: true,
    message: `Created draft ${validated.contentType} article "${validated.title}" at ${filePath}. It's saved as a draft — publish it by removing "draft: true" from the frontmatter in the CMS at /admin/.`
  };
}

/**
 * Update an existing content file's frontmatter or body.
 * Restricted to allowed content directories.
 * @param {object} params - { contentType, slug, updates: { title?, date?, description?, body? } }
 * @param {object} user - Authenticated board member
 * @returns {{ success: boolean, filePath: string, message: string }}
 */
async function updateContent(params, user) {
  const { contentType, slug, updates } = params;

  if (!contentType || !CONTENT_TYPES[contentType]) {
    throw createHttpError(400, `contentType must be one of: ${Object.keys(CONTENT_TYPES).join(', ')}`);
  }

  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) throw createHttpError(400, 'Invalid slug.');

  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    throw createHttpError(400, 'No updates provided.');
  }

  // Find the file by searching for slug match in the content directory
  const config = CONTENT_TYPES[contentType];
  const { githubRequest } = require('./github');
  const { GITHUB_OWNER, GITHUB_REPO } = require('./github');

  let targetFile = null;
  try {
    const files = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${config.dir}`);
    targetFile = files.find((f) => f.name.includes(normalizedSlug) && f.name.endsWith('.md'));
  } catch (error) {
    throw createHttpError(404, `Content directory not found: ${config.dir}`);
  }

  if (!targetFile) {
    throw createHttpError(404, `No ${contentType} file found matching slug "${normalizedSlug}".`);
  }

  const existing = await getFileContent(targetFile.path);
  if (!existing) throw createHttpError(404, 'File not found.');

  // Parse existing frontmatter and body
  const fmMatch = existing.content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw createHttpError(400, 'File has invalid frontmatter format.');

  const frontmatter = {};
  for (const line of fmMatch[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (kv) frontmatter[kv[1]] = kv[2];
  }
  let body = fmMatch[2].trim();

  // Apply updates
  if (updates.title) {
    if (String(updates.title).length > TITLE_MAX_LENGTH) throw createHttpError(400, 'Title too long.');
    frontmatter.title = String(updates.title).trim();
  }
  if (updates.date) {
    frontmatter.date = validateDate(updates.date);
  }
  if (updates.description) {
    if (String(updates.description).length > DESCRIPTION_MAX_LENGTH) throw createHttpError(400, 'Description too long.');
    frontmatter.description = String(updates.description).trim();
  }
  if (updates.body) {
    if (String(updates.body).length > BODY_MAX_LENGTH) throw createHttpError(400, 'Body too long.');
    if (/<script|<iframe|<object|<embed|<form|on\w+\s*=/i.test(updates.body)) {
      throw createHttpError(400, 'Content must not contain HTML scripts or interactive elements.');
    }
    body = String(updates.body).trim();
  }

  // Rebuild file
  const fmLines = Object.entries(frontmatter).map(([k, v]) => {
    if (k === 'date' || k === 'draft') return `${k}: ${v}`;
    return `${k}: "${String(v).replace(/"/g, '\\"')}"`;
  });
  const newContent = `---\n${fmLines.join('\n')}\n---\n\n${body}\n`;

  const displayName = user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const commitMessage = `content(${contentType}): update ${frontmatter.title || normalizedSlug}\n\nUpdated via Board Agent by ${displayName}`;

  await commitFile(targetFile.path, newContent, commitMessage, existing.sha);

  return {
    success: true,
    filePath: targetFile.path,
    message: `Updated ${contentType} "${frontmatter.title || normalizedSlug}" successfully.`
  };
}

module.exports = {
  createContent,
  updateContent,
  CONTENT_TYPES,
  validateContentParams,
  buildMarkdown
};
