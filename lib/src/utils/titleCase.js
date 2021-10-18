/**
 * @param {String} projectName 
 * @returns {String}
 */
module.exports = projectName => {
  projectName = projectName.toLowerCase().split('-')
  let title = ''

  projectName.forEach((word, index, array) => {
    if (index !== array.length - 1)
      title += `${word[0].toUpperCase()}${word.slice(1)} `
    else title += `${word[0].toUpperCase()}${word.slice(1)}`
  })

  return title
}
