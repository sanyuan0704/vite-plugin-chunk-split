module.exports = {
  transform: {
    '^.+\\.tsx?$': ['esbuild-jest', { sourcemap: true }],
  },
  collectCoverage: false,
  collectCoverageFrom: ['test'],
  coverageDirectory: './jest/coverage',
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  testRegex: '/test/.+\\.test\\.(t|j)sx?$',
  verbose: false,
};
