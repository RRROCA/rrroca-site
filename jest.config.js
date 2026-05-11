module.exports = {
  roots: ['<rootDir>/tests'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  collectCoverageFrom: ['themes/rrroca/static/js/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov']
};
