/**
 * @param {String} projectName
 * @returns {String}
 */
module.exports = projectName => {
  return projectName
    .toLowerCase()
    .split('-')
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}
