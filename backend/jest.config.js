module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/server.js'
  ],
  setupFilesAfterEnv: ['./tests/setup.js'],
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/mocks/uuid.js'
  }
};
