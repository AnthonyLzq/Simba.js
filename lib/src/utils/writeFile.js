const { writeFile } = require('fs')

/**
 * @param {String} filename
 * @param {String} data
 * @returns {Promise<String>}
 */
module.exports = (filename, data) => {
  return new Promise((resolve, reject) => {
    writeFile(filename, data, error => {
      if (error) reject(error.message)
      else resolve('Saved successfully')
    })
  })
}
