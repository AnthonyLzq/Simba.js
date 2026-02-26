/**
 * @type import('@jest/types').Config.InitialOptions
 */
const config = {
  verbose: true,
  testEnvironment: 'node',
  testMatch: ['**/test/unit/**/*.test.js'],
  transform: {}
}

module.exports = config
