const { writeFile } = require('node:fs/promises')

/**
 * @param {String} filename
 * @param {String} data
 * @returns {Promise<void>}
 */
module.exports = (filename, data) => writeFile(filename, data, 'utf8')
