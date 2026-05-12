const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.resolve(__dirname);
const THIS_FILE = path.basename(__filename);

describe('cross-platform compatibility', () => {
  const testFiles = fs
    .readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith('.test.js') && f !== THIS_FILE);

  it('no test file contains hardcoded backslash paths', () => {
    const violations = [];

    for (const file of testFiles) {
      const content = fs.readFileSync(path.join(TESTS_DIR, file), 'utf8');
      // Match string literals containing backslash-separated path segments
      const matches = content.match(/['"`](?:[a-zA-Z0-9_-]+\\\\){2,}[a-zA-Z0-9_.-]+['"`]/g);
      if (matches) {
        violations.push({ file, paths: matches });
      }
    }

    expect(violations).toEqual([]);
  });
});
