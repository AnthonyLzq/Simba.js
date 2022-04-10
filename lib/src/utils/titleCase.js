/**
 * @param {String} projectName
 * @returns {String}
 */
module.exports = projectName => {
  const pn = projectName.toLowerCase().split('-')
  let title = ''

  pn.forEach((word, index, array) => {
    title += `${word[0].toUpperCase()}${word.slice(1)} `

    if (index !== array.length - 1) title += ' '
  })

  return title.trim()
}
