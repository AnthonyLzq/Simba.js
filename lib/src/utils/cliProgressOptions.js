/**
 * @param {String} format
 * @param {Boolean} hideCursor
 * @param {Boolean} synchronousUpdate
 * @returns {CliOptions} cli options
 */
module.exports = (format, hideCursor, synchronousUpdate) => ({
  format,
  hideCursor,
  synchronousUpdate
})

/**
 * @typedef {Object} CliOptions
 * @property {String} format cli format to show the progress to the user
 * @property {Boolean} hideCursor
 * @property {Boolean} synchronousUpdate
 */