/**
 * @type import('@jest/types').Config.InitialOptions
 */
const config = {
  verbose: true,
  testEnvironment: 'node',
  testTimeout: 1 * 60 * 1000,
  moduleFileExtensions: ['js', 'mjs', 'ts'],
  testMatch: [
    '**/test/integration/**/*.test.js',
    '**/test/integration/**/*.test.mjs',
    '**/test/integration/**/*.test.ts'
  ],
  transform: {}
}

module.exports = config
