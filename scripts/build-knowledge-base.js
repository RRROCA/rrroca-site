#!/usr/bin/env node
/**
 * Build Knowledge Base for RRROCA AI Assistant
 * 
 * Extracts content from Hugo markdown files and generates a compact
 * knowledge base JSON used as system context for Azure OpenAI.
 * Run at build time: node scripts/build-knowledge-base.js
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const OUTPUT_FILE = path.join(__dirname, '..', 'api', 'chat', 'knowledge-base.json');

function extractFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const metaBlock = match[1];
  const body = match[2].trim();
  const meta = {};

  for (const line of metaBlock.split('\n')) {
    const kv = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
    if (kv) meta[kv[1]] = kv[2];
  }

  return { meta, body };
}

function cleanMarkdown(text) {
  let result = text
    .replace(/{{<.*?>}}/g, '') // Remove Hugo shortcodes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links → text only
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/#{1,6}\s*/g, '') // Remove heading markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold → plain
    .replace(/\*([^*]+)\*/g, '$1'); // Italic → plain

  // Loop HTML tag removal until stable to prevent nested tag bypass
  let previous;
  do {
    previous = result;
    result = result.replace(/<[^>]+>/g, '');
  } while (result !== previous);

  return result
    .replace(/\n{3,}/g, '\n\n') // Collapse blank lines
    .trim();
}

function walkDirectory(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function buildKnowledgeBase() {
  const files = walkDirectory(CONTENT_DIR);
  const pages = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf-8');
    const { meta, body } = extractFrontMatter(raw);

    if (meta.draft === 'true') continue;

    const relativePath = path.relative(CONTENT_DIR, file)
      .replace(/\\/g, '/')
      .replace(/_index\.md$/, '')
      .replace(/\.md$/, '/');

    const cleanBody = cleanMarkdown(body);
    if (!cleanBody || cleanBody.length < 20) continue;

    // Truncate very long pages to keep context manageable
    const truncated = cleanBody.length > 1500
      ? cleanBody.substring(0, 1500) + '...'
      : cleanBody;

    pages.push({
      title: meta.title || path.basename(file, '.md'),
      path: '/' + relativePath,
      section: relativePath.split('/')[0],
      content: truncated,
    });
  }

  // Sort by section for readability
  pages.sort((a, b) => a.section.localeCompare(b.section) || a.title.localeCompare(b.title));

  const kb = {
    generated: new Date().toISOString(),
    pageCount: pages.length,
    pages,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(kb, null, 2));
  console.log(`Knowledge base built: ${pages.length} pages → ${OUTPUT_FILE}`);
}

buildKnowledgeBase();
