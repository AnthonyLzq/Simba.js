const https = require('https')
const _ = require('underscore')
const writeFile = require('../utils/writeFile')

/**
 * @param {LicenseConfig} config
 * @returns {Promise<String>}
 */
const getLicense = ({ author, license, year, projectDescription }) => {
  return new Promise((resolve, reject) => {
    https.get(`https://choosealicense.com/licenses/${license}/`, res => {
      let result = ''
      res.setEncoding('utf8')
      res.on('data', chunk => (result += chunk))
      res.on('end', () => {
        const begin = result.indexOf('id="license-text"')
        const end = result.indexOf('</pre>')
        result = _.unescape(result.slice(begin + 18, end))

        switch (license) {
          case 'mit':
            result = result
              .replace('[year]', year)
              .replace('[fullname]', author)
            break
          case 'apache-2.0':
            result = result
              .replace('[yyyy]', year)
              .replace('[name of copyright owner]', author)
            break
          case 'gpl-3.0':
          case 'agpl-3.0':
            result = result
              .replace('<year>', year)
              .replace('<name of author>', author)
              .replace(
                "<one line to give the program's name and a brief idea of what it does.>",
                projectDescription
              )
            break
        }

        resolve(result)
      })
      res.on('error', error => {
        console.error(e)
        reject('error')
      })
    })
  })
}

/**
 * @param {LicenseConfig} config
 * @returns {Promise<String>}
 */
module.exports = async ({
  author,
  license,
  year,
  projectDescription,
  projectName
}) => {
  const data = {
    content: '',
    file   : 'LICENSE'
  }

  try {
    data.content = await getLicense({
      author,
      license,
      year,
      projectDescription
    })
    await writeFile(`${projectName}/${data.file}`, data.content)

    return 'success'
  } catch (error) {
    return 'error'
  }
}

/**
 * @typedef {Object} LicenseConfig
 * @property {String} author of the project
 * @property {'mit'|'apache-2.0'|'gpl-3.0'|'agpl-3.0'} license type
 * @property {Number} year of the license
 * @property {String} projectDescription
 * @property {String} projectName
 */
