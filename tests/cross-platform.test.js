const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.resolve(__dirname);
const THIS_FILE = path.basename(__filename);

describe('cross-platform compatibility', () => {
  const testFiles = fs
    .readdirSync(TESTS_DIR)
    .filter((file) => file.endsWith('.test.js') && file !== THIS_FILE);

  function readTestFile(file) {
    return fs.readFileSync(path.join(TESTS_DIR, file), 'utf8');
  }

  it('no test file contains hardcoded backslash paths', () => {
    const violations = [];

    for (const file of testFiles) {
      const content = readTestFile(file);
      // Match string literals containing backslash-separated path segments
      const matches = content.match(/['"`](?:[a-zA-Z0-9_-]+\\\\){2,}[a-zA-Z0-9_.-]+['"`]/g);
      if (matches) {
        violations.push({ file, paths: matches });
      }
    }

    expect(violations).toEqual([]);
  });

  it('no test file hardcodes site origin URLs', () => {
    const originLiteralPattern = /['"`]https?:\/\/(?:www\.)?(?:rrroca\.org|rrroca\.github\.io)(?:\/[^'"`]*)?['"`]/g;
    const violations = testFiles
      .map((file) => ({
        file,
        matches: readTestFile(file).match(originLiteralPattern) || [],
      }))
      .filter(({ matches }) => matches.length > 0);

    expect(violations).toEqual([]);
  });

  it('no test file defines its own base prefix variable', () => {
    const basePrefixPattern = /\b(?:const|let|var)\s+(?:BASE_PREFIX|basePrefix)\b/g;
    const violations = testFiles
      .map((file) => ({
        file,
        matches: readTestFile(file).match(basePrefixPattern) || [],
      }))
      .filter(({ matches }) => matches.length > 0);

    expect(violations).toEqual([]);
  });
});
