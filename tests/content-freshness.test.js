const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(REPO_ROOT, 'content');
const BOARD_MEMBERS_DIR = path.join(CONTENT_DIR, 'about', 'board-members');
const BOARD_DIRECTORS_FILE = path.join(CONTENT_DIR, 'about', 'board-of-directors.md');
const HAS_CONTENT = fs.existsSync(CONTENT_DIR);
const describeSuite = HAS_CONTENT ? describe : describe.skip;
const STALE_CUTOFF = new Date('2023-01-01T00:00:00Z');
const PLACEHOLDER_TITLE_PATTERNS = [
  /^untitled$/i,
  /^todo$/i,
  /^draft title$/i,
  /^new page$/i,
  /^page title$/i,
  /^title here$/i,
  /^your title here$/i,
  /^sample title$/i,
  /^tbd$/i,
];

if (!HAS_CONTENT) {
  describe.skip('Content freshness (no content directory)', () => {
    it('skipped — content directory missing', () => {});
  });
}

function walkMarkdownFiles(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(fullPath, results);
    } else if (entry.name.endsWith('.md') && entry.name !== '_index.md') {
      results.push(fullPath);
    }
  }

  return results;
}

function readSource(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
}

function getFrontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, 'm'));
  if (!match) {
    return null;
  }

  return match[1].trim().replace(/^['\"]|['\"]$/g, '');
}

function isIsoLikeDate(value) {
  return /^\d{4}-\d{2}-\d{2}(?:[Tt ][^\n]+)?$/.test(value) && !Number.isNaN(Date.parse(value));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describeSuite('Content freshness and front matter quality', () => {
  const markdownFiles = walkMarkdownFiles(CONTENT_DIR);

  it('every content markdown file has title and date front matter', () => {
    const missingFields = [];

    markdownFiles.forEach((filePath) => {
      const frontmatter = parseFrontmatter(readSource(filePath));
      const title = getFrontmatterValue(frontmatter, 'title');
      const date = getFrontmatterValue(frontmatter, 'date');

      if (!title || !date) {
        missingFields.push({
          file: path.relative(REPO_ROOT, filePath),
          title: Boolean(title),
          date: Boolean(date),
        });
      }
    });

    expect(missingFields).toEqual([]);
  });

  it('no content page uses a placeholder title', () => {
    const placeholderTitles = [];

    markdownFiles.forEach((filePath) => {
      const frontmatter = parseFrontmatter(readSource(filePath));
      const title = getFrontmatterValue(frontmatter, 'title');

      if (title && PLACEHOLDER_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
        placeholderTitles.push({
          file: path.relative(REPO_ROOT, filePath),
          title,
        });
      }
    });

    expect(placeholderTitles).toEqual([]);
  });

  it('every content page uses a valid ISO-like date value', () => {
    const invalidDates = [];

    markdownFiles.forEach((filePath) => {
      const frontmatter = parseFrontmatter(readSource(filePath));
      const date = getFrontmatterValue(frontmatter, 'date');

      if (date && !isIsoLikeDate(date)) {
        invalidDates.push({
          file: path.relative(REPO_ROOT, filePath),
          date,
        });
      }
    });

    expect(invalidDates).toEqual([]);
  });

  it('warns about published content dated before 2023 without draft: true', () => {
    const staleContent = [];

    markdownFiles.forEach((filePath) => {
      const frontmatter = parseFrontmatter(readSource(filePath));
      const date = getFrontmatterValue(frontmatter, 'date');
      const draft = getFrontmatterValue(frontmatter, 'draft');

      if (!date || !isIsoLikeDate(date) || /^true$/i.test(draft || '')) {
        return;
      }

      if (new Date(date) < STALE_CUTOFF) {
        staleContent.push({
          file: path.relative(REPO_ROOT, filePath),
          date,
        });
      }
    });

    if (staleContent.length > 0) {
      console.warn(
        `Published content older than 2023 detected:\n${staleContent
          .map(({ file, date }) => `- ${file} (${date})`)
          .join('\n')}`
      );
    }

    expect(Array.isArray(staleContent)).toBe(true);
  });

  it('every board member page is referenced from board-of-directors.md', () => {
    const boardDirectorySource = fs.existsSync(BOARD_DIRECTORS_FILE)
      ? readSource(BOARD_DIRECTORS_FILE)
      : '';
    const orphanedBoardMemberPages = [];

    walkMarkdownFiles(BOARD_MEMBERS_DIR).forEach((filePath) => {
      const slug = path.basename(filePath, '.md');
      const slugPattern = new RegExp(`/about/board-members/${escapeRegExp(slug)}/?`);

      if (!slugPattern.test(boardDirectorySource)) {
        orphanedBoardMemberPages.push(path.relative(REPO_ROOT, filePath));
      }
    });

    expect(orphanedBoardMemberPages).toEqual([]);
  });
});
