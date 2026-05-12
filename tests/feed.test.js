const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const FEED_PATH = path.join(PUBLIC_DIR, 'index.xml');
const HUGO_CONFIG_PATH = path.join(REPO_ROOT, 'hugo.toml');
const HAS_BUILD = fs.existsSync(PUBLIC_DIR);
const describeSuite = HAS_BUILD ? describe : describe.skip;

if (!HAS_BUILD) {
  describe.skip('Feed validation (no build output)', () => {
    it('skipped — run hugo first', () => {});
  });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getFeedContent() {
  return readFile(FEED_PATH);
}

function getEntryBlocks(xml) {
  return xml.match(/<item\b[^>]*>[\s\S]*?<\/item>|<entry\b[^>]*>[\s\S]*?<\/entry>/gi) || [];
}

function getTagContent(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
}

function getEntryLink(block) {
  const directLink = getTagContent(block, 'link');
  if (directLink) {
    return directLink;
  }

  const hrefMatch = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i);
  return hrefMatch ? hrefMatch[1].trim() : null;
}

function getFeedTitle(xml) {
  const channelMatch = xml.match(/<channel\b[^>]*>[\s\S]*?<title>([\s\S]*?)<\/title>/i);
  if (channelMatch) {
    return channelMatch[1].replace(/\s+/g, ' ').trim();
  }

  const feedMatch = xml.match(/<feed\b[^>]*>[\s\S]*?<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return feedMatch ? feedMatch[1].replace(/\s+/g, ' ').trim() : null;
}

function getSiteTitle() {
  const hugoToml = readFile(HUGO_CONFIG_PATH);
  const match = hugoToml.match(/^\s*title\s*=\s*"([^"]+)"\s*$/m);
  return match ? match[1].trim() : null;
}

describeSuite('Feed validation', () => {
  it('RSS feed exists', () => {
    expect(fs.existsSync(FEED_PATH)).toBe(true);
  });

  it('feed is well-formed XML', () => {
    const xml = getFeedContent();
    expect(xml.trim().startsWith('<?xml')).toBe(true);

    const isRss = /<rss\b[\s\S]*<channel\b[\s\S]*<\/channel>[\s\S]*<\/rss>/i.test(xml);
    const isAtom = /<feed\b[\s\S]*<\/feed>/i.test(xml);
    expect(isRss || isAtom).toBe(true);

    if (isRss) {
      expect((xml.match(/<item\b/gi) || []).length).toBe((xml.match(/<\/item>/gi) || []).length);
    }

    if (isAtom) {
      expect((xml.match(/<entry\b/gi) || []).length).toBe((xml.match(/<\/entry>/gi) || []).length);
    }
  });

  it('feed contains entries', () => {
    const entries = getEntryBlocks(getFeedContent());
    expect(entries.length).toBeGreaterThan(0);
  });

  it('each entry has required fields', () => {
    const invalidEntries = getEntryBlocks(getFeedContent())
      .map((entry, index) => ({
        index: index + 1,
        hasTitle: Boolean(getTagContent(entry, 'title')),
        hasLink: Boolean(getEntryLink(entry)),
        hasSummary: Boolean(getTagContent(entry, 'description') || getTagContent(entry, 'summary')),
      }))
      .filter(({ hasTitle, hasLink, hasSummary }) => !hasTitle || !hasLink || !hasSummary);

    expect(invalidEntries).toEqual([]);
  });

  it('feed links are absolute URLs', () => {
    const invalidLinks = getEntryBlocks(getFeedContent())
      .map((entry, index) => ({
        index: index + 1,
        link: getEntryLink(entry),
      }))
      .filter(({ link }) => !link || !/^https?:\/\//i.test(link));

    expect(invalidLinks).toEqual([]);
  });

  it('feed title matches site title', () => {
    const feedTitle = getFeedTitle(getFeedContent());
    const siteTitle = getSiteTitle();

    expect(siteTitle).toBeTruthy();
    expect(feedTitle).toBe(siteTitle);
  });
});
