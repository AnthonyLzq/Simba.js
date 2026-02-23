const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const ejs = require('ejs')

const TEMPLATES_DIR = join(__dirname, '..', '..', 'templates')

/**
 * Render an EJS template file with the given data.
 * @param {string} templatePath - Relative path from the templates/ directory (e.g., 'api/services/BaseHttp.ts.ejs')
 * @param {Record<string, unknown>} data - Variables to pass to the template
 * @returns {string} The rendered template content
 */
const renderTemplate = (templatePath, data = {}) => {
  const fullPath = join(TEMPLATES_DIR, templatePath)
  const template = readFileSync(fullPath, 'utf-8')

  return ejs.render(template, data, {
    filename: fullPath
  })
}

module.exports = { renderTemplate, TEMPLATES_DIR }
