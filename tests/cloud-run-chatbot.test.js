const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const CHATBOT_DIR = path.join(REPO_ROOT, 'cloud-run', 'chatbot');
const SRC_DIR = path.join(CHATBOT_DIR, 'src');

function readFile(...segments) {
  return fs.readFileSync(path.join(...segments), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

function extractToolNames(section) {
  return [...section.matchAll(/name:\s*'([^']+)'/g)].map((match) => match[1]);
}

function extractRequiredFields(toolSnippet) {
  const match = toolSnippet.match(/required:\s*\[([^\]]*)\]/);
  expect(match).not.toBeNull();

  return match[1]
    .split(',')
    .map((field) => field.trim().replace(/^'|'$/g, ''))
    .filter(Boolean);
}

function getToolSnippet(section, toolName, orderedNames) {
  const startToken = `name: '${toolName}'`;
  const start = section.indexOf(startToken);
  expect(start).toBeGreaterThanOrEqual(0);

  const currentIndex = orderedNames.indexOf(toolName);
  const nextToolName = orderedNames[currentIndex + 1];
  const end = nextToolName
    ? section.indexOf(`name: '${nextToolName}'`, start + startToken.length)
    : section.length;

  expect(end).toBeGreaterThan(start);
  return section.slice(start, end);
}

describe('cloud-run chatbot package structure', () => {
  const packageJsonPath = path.join(CHATBOT_DIR, 'package.json');
  const packageJson = JSON.parse(readFile(packageJsonPath));

  test('has the expected package metadata and dependencies', () => {
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    expect(packageJson.name).toBe('rrroca-chatbot');
    expect(packageJson.type).toBe('module');
    expect(packageJson.dependencies).toEqual(
      expect.objectContaining({
        '@google/genai': expect.any(String),
        express: expect.any(String)
      })
    );
  });
});

describe('cloud-run chatbot Dockerfile', () => {
  const dockerfilePath = path.join(CHATBOT_DIR, 'Dockerfile');
  const dockerfile = readFile(dockerfilePath);

  test('uses the required base image, port, and non-root execution', () => {
    expect(fs.existsSync(dockerfilePath)).toBe(true);
    expect(dockerfile).toMatch(/FROM\s+node:20-slim\b/);
    expect(dockerfile).toMatch(/EXPOSE\s+8080\b/);
    expect(dockerfile).toMatch(/ENV\s+PORT=8080\b/);
    expect(dockerfile).toMatch(/addgroup\s+--system\s+appgroup/);
    expect(dockerfile).toMatch(/adduser\s+--system\s+--ingroup\s+appgroup\s+appuser/);
    expect(dockerfile).toMatch(/USER\s+appuser\b/);
    expect(dockerfile).not.toMatch(/USER\s+root\b/);
  });
});

describe('cloud-run chatbot source files', () => {
  test('includes the required source modules', () => {
    ['server.js', 'chat.js', 'tools.js', 'github.js'].forEach((fileName) => {
      expect(fs.existsSync(path.join(SRC_DIR, fileName))).toBe(true);
    });
  });
});

describe('cloud-run chatbot tool definitions', () => {
  const toolsSource = readFile(path.join(SRC_DIR, 'tools.js'));
  const boardSection = extractSection(toolsSource, 'export const BOARD_TOOLS = [', 'export const COMMUNITY_TOOLS = [');
  const communitySection = extractSection(toolsSource, 'export const COMMUNITY_TOOLS = [', '// --- Tool executor ---');
  const boardToolNames = extractToolNames(boardSection);
  const communityToolNames = extractToolNames(communitySection);

  test('defines the expected board and community tools', () => {
    expect(boardToolNames).toEqual([
      'submit_motion',
      'create_content',
      'update_content',
      'report_issue'
    ]);
    expect(communityToolNames).toEqual(['submit_community_suggestion']);
  });

  test.each([
    {
      name: 'submit_motion',
      required: ['motionText', 'background'],
      properties: ['title', 'motionText', 'background', 'category', 'amount', 'portfolio', 'deadline', 'supportingDocs']
    },
    {
      name: 'create_content',
      required: ['contentType', 'title', 'date', 'description', 'body'],
      properties: ['contentType', 'title', 'date', 'description', 'body', 'slug']
    },
    {
      name: 'update_content',
      required: ['contentType', 'slug', 'updates'],
      properties: ['contentType', 'slug', 'updates']
    },
    {
      name: 'report_issue',
      required: ['title', 'category', 'description'],
      properties: ['title', 'category', 'page', 'description', 'expected', 'device', 'priority']
    }
  ])('defines required parameters for board tool $name', ({ name, required, properties }) => {
    const snippet = getToolSnippet(boardSection, name, boardToolNames);

    expect(snippet).toMatch(/parameters:\s*\{/);
    expect(snippet).toMatch(/type:\s*'object'/);
    expect(extractRequiredFields(snippet)).toEqual(required);

    properties.forEach((property) => {
      expect(snippet).toMatch(new RegExp(`\\b${escapeRegExp(property)}\\b\\s*:\\s*\\{`));
    });
  });

  test('defines required parameters for the community tool', () => {
    const snippet = getToolSnippet(communitySection, 'submit_community_suggestion', communityToolNames);

    expect(snippet).toMatch(/parameters:\s*\{/);
    expect(snippet).toMatch(/type:\s*'object'/);
    expect(extractRequiredFields(snippet)).toEqual(['name', 'email', 'title', 'idea']);

    ['name', 'email', 'title', 'idea', 'category', 'whobenefits'].forEach((property) => {
      expect(snippet).toMatch(new RegExp(`\\b${escapeRegExp(property)}\\b\\s*:\\s*\\{`));
    });
  });
});

describe('cloud-run chatbot security patterns', () => {
  const chatSource = readFile(path.join(SRC_DIR, 'chat.js'));
  const injectionSection = extractSection(chatSource, 'const INJECTION_PATTERNS = [', '];');

  test('defines prompt injection detection regex patterns in chat.js', () => {
    const patternLines = injectionSection.match(/^\s*\/.*\/i,?\s*$/gm) || [];

    expect(patternLines).toHaveLength(11);
    [
      'ignore\\s+(all\\s+)?(previous|prior|above)\\s+(instructions|rules|prompts)',
      'you\\s+are\\s+now\\s+',
      'new\\s+system\\s+prompt',
      '\\bDAN\\b.*\\bmode\\b',
      'pretend\\s+(you\\s+are|to\\s+be)',
      'act\\s+as\\s+(if|though)\\s+you',
      'reveal\\s+(your|the)\\s+(system|initial)\\s+(prompt|instructions)',
      'what\\s+(are|is)\\s+your\\s+(instructions|system\\s+prompt|rules)',
      'developer\\s+mode',
      'bypass\\s+(the\\s+)?(rules|filters|guardrails)',
      'jailbreak'
    ].forEach((patternFragment) => {
      expect(chatSource).toContain(patternFragment);
    });
  });

  test('applies injection detection inside validateMessage', () => {
    expect(chatSource).toContain('for (const pattern of INJECTION_PATTERNS)');
    expect(chatSource).toContain("if (pattern.test(trimmed)) {");
    expect(chatSource).toContain("return { valid: false, reason: 'I can only help with RRROCA community questions.' };");
  });
});
