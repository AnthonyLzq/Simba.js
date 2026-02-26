const { mkdir } = require('node:fs/promises')

/**
 * Creates multiple directories recursively (cross-platform, no shell spawn).
 * @param  {...String} dirs - Directory paths to create.
 * @returns {Promise<void>}
 */
module.exports = (...dirs) =>
  Promise.all(dirs.map(dir => mkdir(dir, { recursive: true })))
