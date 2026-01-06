/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  testEnvironment: 'node',
  testTimeout: 30000,
  testMatch: ['**/?(*.)+(spec|test|e2e.test).[jt]s?(x)'],
  clearMocks: true,
  transformIgnorePatterns: ['/node_modules/(?!uuid|@faker-js/faker)'],
  moduleNameMapper: {
    '^cuid$': '<rootDir>/test-utils/cuid.ts',
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};
