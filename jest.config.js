/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test|e2e.test).[jt]s?(x)'],
  clearMocks: true,
  transformIgnorePatterns: ['/node_modules/(?!uuid)'],
  moduleNameMapper: {
    '^cuid$': '<rootDir>/test-utils/cuid.ts',
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};
